// Rule-based assistant. Always available: used offline, in demo mode, when no LLM key is set,
// when the LLM fails, and ALWAYS first for emergencies and medical-advice requests.
// TODO: native review - Sindhi keywords below need review by a native Sindhi speaker.
import type { AssistantReply, FacilityType, HospitalData, Lang, TokenView } from './types.ts';
import { tr } from './types.ts';
import { findRoute, resolveDestination, emergencyDept } from './route.ts';
import { placeName, stepText } from './directions.ts';
import { translate, type DictKey } from './i18n/core.ts';

export type Intent =
  | { kind: 'emergency' }
  | { kind: 'medical' }
  | { kind: 'book'; deptId?: string }
  | { kind: 'doctor'; deptId?: string }
  | { kind: 'token' }
  | { kind: 'lost' }
  | { kind: 'facility'; type: FacilityType }
  | { kind: 'where'; deptId: string }
  | { kind: 'hours' }
  | { kind: 'greeting' }
  | { kind: 'unknown' };

/** Lower-case, unify Arabic-script variants used by Urdu and Sindhi, drop punctuation and diacritics. */
export function normalizeText(s: string): string {
  return ` ${s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[يى]/g, 'ی') // ي ى -> ی
    .replace(/[كڪ]/g, 'ک') // ك ڪ -> ک
    .replace(/[هھۃة]/g, 'ہ') // ه ھ ۃ ة -> ہ
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;
}

/** Letters used in Sindhi but not in Urdu (ڪ ٻ ڄ ڃ ڇ ڏ ڌ ڍ ڊ ڙ ڳ ڱ ٺ ٽ ٿ ڀ ڦ ڻ ...). */
const SINDHI_ONLY = /[ٺٻٽٿڀڃڄڇڊڌڍڎڙڦڪڳڱڻ]/;
const ARABIC_SCRIPT = /[؀-ۿ]/;

/** Reply in the language the visitor wrote in: Sindhi letters mean Sindhi, other Arabic script means Urdu. */
export function replyLanguage(text: string, uiLang: Lang): Lang {
  if (SINDHI_ONLY.test(text)) return 'sd';
  if (ARABIC_SCRIPT.test(text)) return uiLang === 'en' ? 'ur' : uiLang;
  return uiLang;
}

const W = (...words: string[]) => words.map((w) => normalizeText(w).trim());

const EMERGENCY = W('emergency', 'urgent', 'bleeding', 'unconscious', 'not breathing', 'cant breathe', 'can not breathe', 'chest pain', 'accident', 'fainted', 'seizure', 'ایمرجنسی', 'فوری', 'خون بہہ', 'بے ہوش', 'بیہوش', 'سانس نہیں', 'سینے میں درد', 'حادثہ', 'ايمرجنسي', 'تڪڙو', 'رت وهي', 'بيهوش', 'ساهه نٿو', 'حادثو');
const MEDICAL = W('which medicine should', 'what medicine', 'should i take', 'dose', 'dosage', 'diagnos', 'is it serious', 'what disease', 'what illness', 'treatment for', 'cure', 'how many tablets', 'side effect', 'کون سی دوا', 'کونسی دوا', 'دوا لوں', 'خوراک', 'تشخیص', 'کیا بیماری', 'علاج بتا', 'سنگین', 'گولیاں کتنی', 'ڪهڙي دوا', 'دوا وٺان', 'ڪهڙي بيماري', 'علاج ٻڌا', 'خطرناڪ آهي');
const BOOK = W('book', 'appointment', 'booking', 'reserve', 'بکنگ', 'بک', 'اپوائنٹمنٹ', 'وقت لینا', 'وقت لے', 'بڪنگ', 'بُڪ', 'اپائنٽمينٽ', 'وقت وٺڻ', 'وقت وٺ');
const DOCTOR = W('doctor', 'physician', 'ڈاکٹر', 'ڊاڪٽر');
const TOKEN = W('token', 'my number', 'my turn', 'slip', 'queue', 'ٹوکن', 'پرچی', 'باری', 'ٽوڪن', 'پرچي', 'واري');
const LOST = W('lost', 'where am i', 'confused', 'cannot find', 'cant find', 'گم', 'بھول گیا', 'بھول گئی', 'راستہ نہیں', 'کہاں ہوں', 'ڀلجي', 'ڀٽڪي', 'رستو نه', 'ڪٿي آهيان');
const HOURS = W('hours', 'opening', 'open', 'timing', 'close', 'اوقات', 'کب کھل', 'ٹائم', 'کھلا', 'وقت ڪڏهن', 'کليل', 'کلندو');
const GREETING = W('hello', 'hi', 'salam', 'assalam', 'سلام', 'السلام', 'هيلو', 'ہیلو');

const FACILITY_WORDS: Record<FacilityType, string[]> = {
  water: W('water', 'drink', 'thirsty', 'پانی', 'پیاس', 'پاڻي', 'اڃ'),
  washroom: W('washroom', 'toilet', 'bathroom', 'restroom', 'wc', 'واش روم', 'باتھ روم', 'بیت الخلا', 'ٹوائلٹ', 'ٽوائليٽ', 'غسلخانو', 'غسل خانہ'),
  prayer: W('pray', 'prayer', 'namaz', 'mosque', 'masjid', 'نماز', 'مسجد'),
  seating: W('sit', 'seat', 'bench', 'rest', 'shade', 'بیٹھ', 'کرسی', 'آرام', 'سایہ', 'ويهڻ', 'ويهان', 'ڪرسي', 'ڇانوَ'),
  helpdesk: W('help desk', 'helpdesk', 'information', 'enquiry', 'ہیلپ ڈیسک', 'معلومات', 'هيلپ ڊيسڪ'),
};

/** Extra words per department id, on top of the department names from the data. */
const DEPT_SYNONYMS: Record<string, string[]> = {
  pharmacy: W('pharmacy', 'medicines', 'get medicine', 'buy medicine', 'collect medicine', 'chemist', 'dawa khana', 'فارمیسی', 'دوا خانہ', 'دوائی', 'دوائیں', 'دوا کہاں', 'فارميسي', 'دوا خانو', 'دوائون', 'دوا ڪٿي'),
  paediatrics: W('child', 'children', 'kid', 'baby', 'paeds', 'pediatric', 'paediatric', 'بچہ', 'بچے', 'بچوں', 'بچی', 'ٻار', 'ٻارن', 'ٻچو'),
  lab: W('lab', 'laboratory', 'test', 'blood test', 'report', 'sample', 'لیب', 'لیبارٹری', 'ٹیسٹ', 'رپورٹ', 'ليب', 'ليبارٽري', 'ٽيسٽ', 'رپورٽ'),
  medicine: W('medicine', 'opd', 'general', 'physician', 'میڈیسن', 'ميڊيسن', 'او پی ڈی'),
  emergency: W('emergency', 'ایمرجنسی', 'ايمرجنسي'),
  gynae: W('gynae', 'gynaecology', 'gynecology', 'women', 'pregnant', 'pregnancy', 'خواتین', 'گائنی', 'حمل', 'زچگی', 'عورتن', 'گائني', 'ڳورهاري'),
  surgery: W('surgery', 'surgeon', 'operation', 'سرجری', 'آپریشن', 'سرجري', 'آپريشن'),
  eye: W('eye', 'eyes', 'vision', 'آنکھ', 'آنکھوں', 'نظر', 'اک', 'اکين'),
  ent: W('ear', 'nose', 'throat', 'ent', 'کان', 'ناک', 'گلا', 'ڪن', 'نڪ', 'ڳلو'),
  radiology: W('x-ray', 'xray', 'ultrasound', 'radiology', 'scan', 'ایکسرے', 'الٹراساؤنڈ', 'ايڪسري', 'الٽراسائونڊ'),
};

// Short words ("ent", "ear", "wc") must match whole words, so "entrance" is not ENT.
const has = (text: string, words: string[]) => words.some((w) => w && text.includes(w.length <= 3 ? ` ${w} ` : ` ${w}`));

export function detectDept(text: string, data: HospitalData): string | undefined {
  const order = ['pharmacy', 'paediatrics', 'gynae', 'surgery', 'eye', 'ent', 'radiology', 'lab', 'medicine', 'emergency'];
  const ids = [...new Set([...order, ...data.departments.map((d) => d.id)])].filter((id) =>
    data.departments.some((d) => d.id === id),
  );
  for (const id of ids) {
    const d = data.departments.find((x) => x.id === id)!;
    const names = W(d.name.en, d.name.ur, d.name.sd, d.code);
    if (has(text, [...(DEPT_SYNONYMS[id] ?? []), ...names])) return id;
  }
  return undefined;
}

export function detectIntent(input: string, data: HospitalData): Intent {
  const text = normalizeText(input);
  if (has(text, EMERGENCY)) return { kind: 'emergency' };
  if (has(text, MEDICAL)) return { kind: 'medical' };
  const deptId = detectDept(text, data);
  if (has(text, BOOK)) return { kind: 'book', deptId };
  if (has(text, DOCTOR)) return { kind: 'doctor', deptId };
  if (has(text, TOKEN)) return { kind: 'token' };
  if (has(text, LOST)) return { kind: 'lost' };
  for (const [type, words] of Object.entries(FACILITY_WORDS) as [FacilityType, string[]][]) {
    if (has(text, words)) return { kind: 'facility', type };
  }
  if (deptId) return { kind: 'where', deptId };
  if (has(text, HOURS)) return { kind: 'hours' };
  if (has(text, GREETING)) return { kind: 'greeting' };
  return { kind: 'unknown' };
}

export interface RuleContext {
  data: HospitalData;
  lang: Lang;
  from: string;
  token: TokenView | null;
  /** Next free appointment in a department, if any. */
  nextSlot?: (deptId: string) => { doctor: string; time: string } | null;
}

const CHIP_KEYS: DictKey[] = [
  'assistant.chip.where',
  'assistant.chip.water',
  'assistant.chip.washroom',
  'assistant.chip.prayer',
  'assistant.chip.lost',
  'assistant.chip.token',
  'assistant.chip.doctor',
  'assistant.chip.book',
];

export function defaultChips(lang: Lang, skip?: string): string[] {
  return CHIP_KEYS.filter((k) => !skip || !k.endsWith(`.${skip}`))
    .slice(0, 5)
    .map((k) => translate(lang, k));
}

export function answerIntent(intent: Intent, ctx: RuleContext): AssistantReply {
  const { data, lang, from } = ctx;
  const t = (k: DictKey, v?: Record<string, string | number>) => translate(lang, k, v);
  const base = { source: 'rules' as const, category: intent.kind };
  switch (intent.kind) {
    case 'emergency':
      return { ...base, reply: t('assistant.ans.emergency'), action: { type: 'emergency' }, chips: [t('assistant.chip.lost')] };
    case 'medical': {
      const em = emergencyDept(data);
      return { ...base, reply: t('assistant.ans.medical'), action: em ? { type: 'route', dest: em.id } : null, chips: defaultChips(lang) };
    }
    case 'where': {
      const dept = data.departments.find((d) => d.id === intent.deptId)!;
      const route = findRoute(data, from, dept.nodeId);
      const first = route ? route.steps.slice(1, 3).map((s) => stepText(s, data, lang)).join(' ') : '';
      return {
        ...base,
        reply: t('assistant.ans.where', { dept: tr(dept.name, lang), first }),
        action: { type: 'route', dest: dept.id },
        chips: defaultChips(lang, 'where'),
      };
    }
    case 'facility': {
      const node = resolveDestination(data, intent.type, from);
      if (!node) return { ...base, reply: t('guide.unknownDest'), action: null, chips: defaultChips(lang) };
      return {
        ...base,
        reply: t('assistant.ans.facility', { facility: t(`facility.${intent.type}` as DictKey), place: placeName(data, node, lang) }),
        action: { type: 'route', dest: intent.type },
        chips: defaultChips(lang, intent.type),
      };
    }
    case 'lost':
      return { ...base, reply: t('assistant.ans.lost'), action: { type: 'lost' }, chips: defaultChips(lang, 'lost') };
    case 'token': {
      if (!ctx.token) return { ...base, reply: t('assistant.ans.tokenNone'), action: null, chips: defaultChips(lang, 'token') };
      const tok = ctx.token;
      let status = t(`token.status.${tok.status}` as DictKey);
      if (tok.status === 'waiting' || tok.status === 'next') {
        status += ` · ${t(tok.ahead === 1 ? 'token.aheadOne' : tok.ahead === 0 ? 'token.aheadNone' : 'token.ahead', { n: tok.ahead })}`;
      }
      return {
        ...base,
        reply: t('assistant.ans.token', { label: tok.label, status }),
        action: { type: 'token', tokenId: tok.id },
        chips: defaultChips(lang, 'token'),
      };
    }
    case 'doctor': {
      if (!intent.deptId) {
        return {
          ...base,
          reply: t('assistant.ans.doctorAsk'),
          action: null,
          chips: data.departments.filter((d) => d.bookable).map((d) => `${t('book.doctor')}: ${tr(d.name, lang)}`),
        };
      }
      const dept = data.departments.find((d) => d.id === intent.deptId)!;
      const next = ctx.nextSlot?.(dept.id) ?? null;
      if (!next) return { ...base, reply: t('assistant.ans.doctorNone', { dept: tr(dept.name, lang) }), action: null, chips: defaultChips(lang, 'doctor') };
      return {
        ...base,
        reply: t('assistant.ans.doctor', { dept: tr(dept.name, lang), doctor: next.doctor, time: next.time }),
        action: { type: 'book', deptId: dept.id },
        chips: defaultChips(lang, 'doctor'),
      };
    }
    case 'book':
      return { ...base, reply: t('assistant.ans.book'), action: { type: 'book', deptId: intent.deptId }, chips: defaultChips(lang, 'book') };
    case 'hours':
      return { ...base, reply: t('assistant.ans.hours', { hours: tr(data.hospital.openHours, lang) }), action: null, chips: defaultChips(lang) };
    case 'greeting':
      return { ...base, reply: t('assistant.hello'), action: null, chips: defaultChips(lang) };
    default:
      return { ...base, reply: t('assistant.ans.unknown'), action: null, chips: defaultChips(lang) };
  }
}

export function answerRules(input: string, ctx: RuleContext): AssistantReply {
  return answerIntent(detectIntent(input, ctx.data), ctx);
}
