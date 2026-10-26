// Talkative assistant. Emergencies and medical-advice questions are answered by fixed rules first,
// never by the model. Everything else goes to Gemini with a prompt that contains ONLY hospital data.
// If the key is missing, the model fails or times out, the rule-based answer is returned instead.
import type { AssistantReply, Lang, TokenView } from '../src/lib/types.ts';
import { tr } from '../src/lib/types.ts';
import { answerIntent, defaultChips, detectIntent } from '../src/lib/assistantRules.ts';
import { getHospitalData } from './db.ts';
import { fmtTime } from '../src/lib/slots.ts';
import type { Ctx } from './services.ts';
import { getTokenView, nextFreeSlot, queueSummaries, recordEvent } from './services.ts';

export const MAX_REPLY_CHARS = 420;
const LLM_TIMEOUT_MS = 8000;

export interface AskInput {
  lang: Lang;
  message: string;
  history: { role: 'user' | 'assistant'; text: string }[];
  tokenId?: string;
  from?: string;
}

function groundingFacts(ctx: Ctx, lang: Lang, token: TokenView | null) {
  const data = getHospitalData(ctx.db);
  const queues = queueSummaries(ctx);
  return {
    hospital: tr(data.hospital.name, 'en'),
    openHours: data.hospital.openHours.en,
    departments: data.departments.map((d) => {
      const q = queues.find((x) => x.deptId === d.id);
      const next = d.bookable ? nextFreeSlot(ctx, d.id, lang) : null;
      return {
        id: d.id,
        name: d.name,
        hours: d.openHours.en,
        bookable: d.bookable,
        waitingNow: q?.waiting ?? 0,
        nowServing: q?.nowServing?.label ?? null,
        nextFreeAppointment: next ? { doctor: next.doctor, time: fmtTime(next.start) } : null,
      };
    }),
    landmarks: data.landmarks.filter((l) => l.kind === 'landmark').map((l) => ({ id: l.id, name: l.name })),
    facilities: data.facilities.map((f) => ({ type: f.type, near: data.landmarks.find((l) => l.id === f.nodeId)?.name.en })),
    visitorToken: token ? { label: token.label, status: token.status, peopleAhead: token.ahead, department: token.deptId } : null,
  };
}

const LANG_NAME: Record<Lang, string> = { en: 'English', ur: 'Urdu (Urdu script)', sd: 'Sindhi (Sindhi Arabic script)' };

export function systemPrompt(lang: Lang, facts: unknown) {
  return [
    'You are WayMed, a wayfinding helper at a government hospital in Karachi, Pakistan.',
    `Always reply in ${LANG_NAME[lang]}, in short simple sentences for people with low literacy. At most 3 sentences.`,
    'You ONLY help with: where departments and facilities are, the visitor token status, which doctor has a free appointment time, opening hours, and starting a booking.',
    'NEVER give medical advice, a diagnosis, medicine names or doses, or say whether something is serious. If asked, say you cannot give medical advice and they should ask a doctor or nurse, and go to Emergency if it is urgent.',
    'Use ONLY the facts in HOSPITAL_DATA. If something is not in the data, say you do not know and suggest the Help Desk. Never invent numbers, times, names or places.',
    'Respond with JSON only: {"reply": string, "action": null | {"type":"route","dest": departmentId | facilityType} | {"type":"book","deptId": departmentId} | {"type":"token"} | {"type":"lost"}}.',
    'Facility types: water, washroom, seating, prayer, helpdesk.',
    `HOSPITAL_DATA = ${JSON.stringify(facts)}`,
  ].join('\n');
}

/** Ask Gemini. Returns null on any failure so the caller can fall back to rules. */
async function askGemini(ctx: Ctx, input: AskInput, facts: unknown): Promise<{ reply: string; action: AssistantReply['action'] } | null> {
  if (!ctx.cfg.geminiKey) return null;
  const contents = [
    ...input.history.slice(-6).map((h) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text.slice(0, 300) }] })),
    { role: 'user', parts: [{ text: input.message.slice(0, 300) }] },
  ];
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(ctx.cfg.geminiModel)}:generateContent`, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ctx.cfg.geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(input.lang, facts) }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 300, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as { reply?: unknown; action?: unknown };
    if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) return null;
    return { reply: parsed.reply.trim(), action: sanitizeAction(ctx, parsed.action, input.tokenId) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Only accept actions that point at real places in the hospital data. */
function sanitizeAction(ctx: Ctx, a: unknown, tokenId?: string): AssistantReply['action'] {
  if (!a || typeof a !== 'object') return null;
  const data = getHospitalData(ctx.db);
  const x = a as Record<string, unknown>;
  if (x.type === 'route' && typeof x.dest === 'string') {
    const ok = data.departments.some((d) => d.id === x.dest) || ['water', 'washroom', 'seating', 'prayer', 'helpdesk'].includes(x.dest);
    return ok ? { type: 'route', dest: x.dest } : null;
  }
  if (x.type === 'book') {
    const deptId = typeof x.deptId === 'string' && data.departments.some((d) => d.id === x.deptId && d.bookable) ? x.deptId : undefined;
    return { type: 'book', deptId };
  }
  if (x.type === 'token' && tokenId) return { type: 'token', tokenId };
  if (x.type === 'lost') return { type: 'lost' };
  return null;
}

/** Strip anything that looks like markup and cap the length. */
export function capReply(s: string): string {
  const clean = s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_REPLY_CHARS) return clean;
  const cut = clean.slice(0, MAX_REPLY_CHARS);
  const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('۔'), cut.lastIndexOf('?'), cut.lastIndexOf('؟'));
  return end > 120 ? cut.slice(0, end + 1) : `${cut}…`;
}

export async function ask(ctx: Ctx, input: AskInput): Promise<AssistantReply> {
  const data = getHospitalData(ctx.db);
  const token = input.tokenId ? getTokenView(ctx, input.tokenId) : null;
  const from = input.from && data.landmarks.some((l) => l.id === input.from) ? input.from : 'entrance';
  const intent = detectIntent(input.message, data);
  const rules = answerIntent(intent, {
    data,
    lang: input.lang,
    from,
    token,
    nextSlot: (deptId) => {
      const n = nextFreeSlot(ctx, deptId, input.lang);
      return n ? { doctor: n.doctor, time: fmtTime(n.start) } : null;
    },
  });
  // Only the category is logged. The question text is never stored.
  recordEvent(ctx, { type: 'assistant_question_category', value: intent.kind, lang: input.lang });

  if (intent.kind === 'emergency' || intent.kind === 'medical') return rules;
  const llm = await askGemini(ctx, input, groundingFacts(ctx, input.lang, token));
  if (!llm) return { ...rules, reply: capReply(rules.reply) };
  return {
    reply: capReply(llm.reply),
    action: llm.action ?? rules.action,
    chips: rules.chips.length ? rules.chips : defaultChips(input.lang),
    category: intent.kind,
    source: 'llm',
  };
}
