// Demo tour: plays the whole visitor journey automatically inside the phone frame, with captions.
// Everything here is scripted and simulated. It reads the sample hospital and writes nothing anywhere.
// TODO: native review - every `sd` caption in this file needs review by a native Sindhi speaker.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { JourneyProgress, VCard, VisitorShell } from '../components/VisitorShell.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptBadge } from '../components/DeptMark.tsx';
import { FloorPlan } from '../components/FloorPlan.tsx';
import { QRCode } from '../components/QRCode.tsx';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { sampleHospital as data } from '../data/sampleHospital.ts';
import { edgePoints, findRoute, polylineLength, type Pt, type RouteResult } from '../lib/route.ts';
import { stepText, placeName } from '../lib/directions.ts';
import { OffRouteDetector, softChime } from '../lib/geo.ts';
import { answerRules } from '../lib/assistantRules.ts';
import { translate } from '../lib/i18n/core.ts';
import type { Chapter } from '../lib/visit.ts';
import type { L10n } from '../lib/types.ts';
import type { DictKey } from '../lib/i18n/core.ts';

const S = (en: string, ur: string, sd: string): L10n => ({ en, ur, sd });

// Only the evidence named in the brief.
const EVIDENCE: Record<'P1' | 'P2' | 'S1', L10n> = {
  P1: S('Khurshid (P1), attendant: did not know where to go or who to ask.', 'خورشید (P1)، تیماردار: نہیں جانتے تھے کہاں جائیں یا کس سے پوچھیں۔', 'خورشيد (P1)، سنڀاليندڙ: خبر نه هئي ڪٿي وڃن يا ڪنهن کان پڇن.'),
  P2: S('Shams (P2), father: sent to different places by different people, and lost hours.', 'شمس (P2)، والد: مختلف لوگوں نے مختلف جگہ بھیجا، اور گھنٹے ضائع ہوئے۔', 'شمس (P2)، پيءُ: مختلف ماڻهن مختلف هنڌ موڪليو، ۽ ڪلاڪ ضايع ٿيا.'),
  S1: S("Abdullah (S1), doctor's assistant: patients arrive with little early guidance.", 'عبداللہ (S1)، ڈاکٹر کے معاون: مریض بہت کم ابتدائی رہنمائی کے ساتھ آتے ہیں۔', 'عبدالله (S1)، ڊاڪٽر جو مددگار: مريض تمام گهٽ شروعاتي رهنمائي سان اچن ٿا.'),
};

const dept = data.departments.find((d) => d.id === 'medicine')!;
const DEST = dept.nodeId;
const toRoom = findRoute(data, 'entrance', 'registration')!;
const main = findRoute(data, 'registration', DEST)!; // registration > junction > waiting > door_med
const nodes = new Map(data.landmarks.map((l) => [l.id, l]));
const at = (id: string): Pt => [nodes.get(id)!.x, nodes.get(id)!.y];

/** Point at fraction f (0..1) along a polyline. */
function along(pts: Pt[], f: number): Pt {
  const total = polylineLength(pts);
  let d = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg) {
      const k = seg ? d / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
}

// Simulated GPS walk: registration to the junction on route, then a wrong turn towards the Lab Corridor.
const legToJunction = edgePoints(data.edges.find((e) => e.id === 'e2')!, nodes, 'registration');
const wrongLeg: Pt[] = [at('junction'), at('labCorridor')];
const rerouted = findRoute(data, 'junction', DEST)!;
const WRONG_SEC = 18;
// Run the real detector on the simulated readings to find when the alert fires (accuracy 8 m, every 0.5 s).
const ALERT_AT_MS = (() => {
  const det = new OffRouteDetector();
  for (let ms = 0; ms <= WRONG_SEC * 1000; ms += 500) {
    const p = along(wrongLeg, Math.min(1, ms / 9000));
    if (det.push(p, 8, main.points, data.hospital.geo!.metersPerUnit) === 'off') return ms;
  }
  return 6000;
})();

interface Scene {
  id: string;
  sec: number;
  chapter: Chapter | null;
  caption: L10n;
  pain: L10n;
  evidence: (keyof typeof EVIDENCE)[];
  body: (ms: number) => ReactNode;
}

function Btn({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return <div className={primary ? 'vbtn v-glow pointer-events-none' : 'vbtn-2 pointer-events-none'}>{children}</div>;
}

function NextCard({ route, n, total }: { route: RouteResult; n: number; total: number }) {
  const { t, lang } = usePrefs();
  const s = route.steps[1];
  return (
    <div className="rounded-2xl border border-accent/40 bg-surface p-4">
      <div className="flex justify-between text-xs font-bold">
        <span className="uppercase tracking-wide text-accent">{t('v.map.next')}</span>
        <span className="text-muted">{t('v.map.stepOf', { n, total })}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
          <Icon name={s.kind === 'left' || s.kind === 'slight_left' ? 'slightLeft' : s.kind === 'right' ? 'arrowRight' : 'arrowUp'} size={26} strokeWidth={2.6} />
        </span>
        <p className="font-bold">{stepText(s, data, lang)}</p>
      </div>
    </div>
  );
}

export default function Tour() {
  useAllLanguages();
  const { t, L, lang } = usePrefs();
  const [i, setI] = useState(0);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(true);

  const scenes: Scene[] = useMemo(
    () => [
      {
        id: 'prepare',
        sec: 12,
        chapter: null,
        caption: S('Before coming: what to bring, the opening hours, and "only one or two attendants". Shared as a link.', 'آنے سے پہلے: کیا لائیں، اوقات، اور "صرف ایک یا دو تیماردار"۔ لنک سے شیئر ہوتا ہے۔', 'اچڻ کان اڳ: ڇا آڻجي، وقت، ۽ "رڳو هڪ يا ٻه سنڀاليندڙ". لنڪ سان شيئر ٿئي ٿو.'), // TODO: native review
        pain: S('Little early guidance', 'شروع میں بہت کم رہنمائی', 'شروع ۾ تمام گهٽ رهنمائي'), // TODO: native review
        evidence: ['S1'],
        body: () => (
          <div className="v-stagger grid gap-3">
            <h2 className="text-xl font-extrabold">{t('prepare.title')}</h2>
            <VCard>
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{t('prepare.bring')}</p>
              {(['prepare.b1', 'prepare.b2', 'prepare.b3', 'prepare.b4'] as const).map((k) => (
                <p key={k} className="flex items-start gap-2 py-1 text-[0.9375rem]">
                  <Icon name="check" size={16} className="mt-1 shrink-0 text-accent" /> {t(k)}
                </p>
              ))}
            </VCard>
            <VCard className="text-sm">
              <p className="font-bold">{t('prepare.hours')}</p>
              <p className="mt-1 text-muted">{L(data.hospital.openHours)}</p>
            </VCard>
            <Btn>
              <Icon name="share" size={18} className="text-accent" /> {t('prepare.share')}
            </Btn>
          </div>
        ),
      },
      {
        id: 'book',
        sec: 14,
        chapter: null,
        caption: S('Or book ahead: pick a department, a doctor and a free time. Taken times say "Not available". No name or phone needed.', 'یا پہلے سے وقت لیں: شعبہ، ڈاکٹر اور خالی وقت چنیں۔ لیے گئے وقت پر "دستیاب نہیں"۔ نام یا فون کی ضرورت نہیں۔', 'يا اڳواٽ وقت وٺو: شعبو، ڊاڪٽر ۽ خالي وقت چونڊيو. ورتل وقت تي "دستياب ناهي". نالي يا فون جي ضرورت ناهي.'), // TODO: native review
        pain: S('Hours lost waiting', 'انتظار میں گھنٹے ضائع', 'انتظار ۾ ڪلاڪ ضايع'), // TODO: native review
        evidence: ['P2'],
        body: (m) => {
          const doc = data.doctors.find((d) => d.deptId === 'medicine')!;
          const times = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15'];
          const taken = new Set(['09:00', '09:30']);
          const picked = m > 4000 ? '09:45' : null;
          return (
            <div className="grid gap-3">
              <h2 className="text-xl font-extrabold">{t('book.title')}</h2>
              <div className="flex items-center gap-3 rounded-2xl border border-accent bg-accent-soft p-3">
                <DeptBadge dept={dept} size={32} />
                <span className="font-bold">{L(dept.name)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-sm font-semibold">
                <Icon name="stethoscope" size={18} className="text-accent" /> {L(doc.name)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {times.map((x) => {
                  const no = taken.has(x);
                  const on = picked === x;
                  return (
                    <div key={x} className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm ${on ? 'border-accent bg-accent font-bold text-on-accent' : no ? 'border-dashed border-line text-muted line-through' : 'border-line bg-surface'}`}>
                      <span className="ltr font-bold">{x}</span>
                      {no && <span className="text-[11px] no-underline">{t('common.notAvailable')}</span>}
                    </div>
                  );
                })}
              </div>
              {m > 8000 ? (
                <p className="v-enter flex items-start gap-2 rounded-2xl border border-[#3ccf7a]/30 bg-[#3ccf7a]/10 p-3 text-[0.9375rem]">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" />
                  <span>
                    <b>{t('book.done')}</b> · <span className="ltr font-black">MED-032</span>
                    <br />
                    {t('book.estimate', { start: '09:45', end: '10:15' })}
                  </span>
                </p>
              ) : (
                <Btn primary>
                  <Icon name="calendar" size={18} /> {t('book.confirm', { time: picked ?? '09:45' })}
                </Btn>
              )}
              <p className="text-center text-xs font-bold text-accent">
                {t('common.simulation')} · {t('v.demoData')}
              </p>
            </div>
          );
        },
      },
      {
        id: 'home',
        sec: 10,
        chapter: null,
        caption: S('A first-time visitor opens WayMed at the gate. One clear sentence and one big button.', 'پہلی بار آنے والا دروازے پر وے میڈ کھولتا ہے۔ ایک واضح جملہ اور ایک بڑا بٹن۔', 'پهريون ڀيرو ايندڙ دروازي تي وي ميڊ کولي ٿو. هڪ واضح جملو ۽ هڪ وڏو بٽڻ.'),
        pain: S('No clear place to start', 'شروع کرنے کی واضح جگہ نہیں', 'شروع ڪرڻ جي واضح جاءِ ناهي'),
        evidence: ['P1'],
        body: () => (
          <div className="v-stagger grid gap-4 pt-2">
            <h2 className="text-[1.3rem] font-extrabold leading-snug">{t('v.focus')}</h2>
            <VCard>
              {[t('v.how1'), t('v.how2'), t('v.how3')].map((x, k) => (
                <p key={k} className="flex items-center gap-3 py-1.5">
                  <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-black text-on-accent">{k + 1}</span>
                  <span className="font-semibold">{x}</span>
                </p>
              ))}
            </VCard>
            <Btn primary>
              <Icon name="entrance" size={20} /> {t('v.atGate')}
            </Btn>
          </div>
        ),
      },
      {
        id: 'gate',
        sec: 9,
        chapter: 'gate',
        caption: S('A calm welcome explains the whole visit in three steps. No one needs to be asked.', 'پرسکون خوش آمدید پورا دورہ تین قدموں میں بتاتا ہے۔ کسی سے پوچھنے کی ضرورت نہیں۔', 'پرسڪون ڀليڪار سڄو دورو ٽن قدمن ۾ ٻڌائي ٿو. ڪنهن کان پڇڻ جي ضرورت ناهي.'),
        pain: S('Nobody to ask', 'پوچھنے والا کوئی نہیں', 'پڇڻ وارو ڪو ناهي'),
        evidence: ['P1'],
        body: () => (
          <div className="v-stagger grid gap-3">
            <h2 className="text-xl font-extrabold">{t('v.gate.title')}</h2>
            <p className="text-muted">{t('v.gate.calm')}</p>
            {[
              ['ticket', t('v.how1')],
              ['route', t('v.how2')],
              ['bell', t('v.how3')],
            ].map(([ic, x]) => (
              <VCard key={x} className="flex items-center gap-3">
                <Icon name={ic} size={22} className="text-accent" /> <span className="font-semibold">{x}</span>
              </VCard>
            ))}
            <Btn primary>{t('v.gate.start')}</Btn>
          </div>
        ),
      },
      {
        id: 'toRoom',
        sec: 12,
        chapter: 'slip',
        caption: S('Short directions from the gate to the Slip Room, with a live dot.', 'دروازے سے پرچی کمرے تک مختصر ہدایات، چلتے نقطے کے ساتھ۔', 'دروازي کان پرچي ڪمري تائين مختصر هدايتون، هلندڙ نقطي سان.'),
        pain: S('Little early guidance', 'شروع میں بہت کم رہنمائی', 'شروع ۾ تمام گهٽ رهنمائي'),
        evidence: ['S1'],
        body: (m) => {
          const p = along(toRoom.points, m / 9000);
          return (
            <div className="grid gap-3">
              <h2 className="text-xl font-extrabold">{t('v.slip.title')}</h2>
              <p className="text-muted">{t('v.slip.go')}</p>
              <VCard className="p-2">
                <FloorPlan data={data} route={toRoom} routeColor="#E0A800" viewBox="0 330 620 300" dot={{ x: p[0], y: p[1] }} />
              </VCard>
              <p className="rounded-xl bg-solid px-3 py-2.5 text-[0.9375rem]">{stepText(toRoom.steps[1], data, lang)}</p>
            </div>
          );
        },
      },
      {
        id: 'need',
        sec: 12,
        chapter: 'slip',
        caption: S('At the Slip Room: "What do you need?" Simple cards. The visitor taps Check-up.', 'پرچی کمرے میں: "آپ کو کیا چاہیے؟" سادہ کارڈ۔ مریض معائنہ دباتا ہے۔', 'پرچي ڪمري ۾: "توهان کي ڇا گهرجي؟" سادا ڪارڊ. مريض معائنو دٻائي ٿو.'),
        pain: S('Not knowing which department', 'یہ نہ جاننا کہ کون سا شعبہ', 'اها خبر نه هجڻ ته ڪهڙو شعبو'),
        evidence: ['P1', 'S1'],
        body: (m) => (
          <div className="grid gap-3">
            <h2 className="text-xl font-extrabold">{t('v.slip.need')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['checkup', 'child', 'lab', 'medicine'] as const).map((n) => {
                const d = data.departments.find((x) => x.id === { checkup: 'medicine', child: 'paediatrics', lab: 'lab', medicine: 'pharmacy' }[n])!;
                const on = n === 'checkup' && m > 5000;
                return (
                  <div key={n} className={`vtile flex min-h-[92px] flex-col justify-between rounded-2xl border p-3 ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
                    <DeptBadge dept={d} size={34} />
                    <span className="font-bold">{t(`v.need.${n}` as DictKey)}</span>
                  </div>
                );
              })}
            </div>
            <Btn primary>
              <Icon name="ticket" size={20} /> {t('v.slip.get')}
            </Btn>
          </div>
        ),
      },
      {
        id: 'slip',
        sec: 15,
        chapter: 'slip',
        caption: S('A slip with department, token and QR, and no personal data. Medicine is told the visitor is coming.', 'شعبہ، ٹوکن اور کیو آر والی پرچی، ذاتی معلومات کے بغیر۔ میڈیسن کو بتا دیا جاتا ہے کہ مریض آ رہا ہے۔', 'شعبي، ٽوڪن ۽ ڪيو آر واري پرچي، ذاتي معلومات کان سواءِ. ميڊيسن کي ٻڌايو وڃي ٿو ته مريض اچي رهيو آهي.'),
        pain: S('Sent to different places by different people', 'مختلف لوگوں نے مختلف جگہ بھیجا', 'مختلف ماڻهن مختلف هنڌ موڪليو'),
        evidence: ['P2'],
        body: (m) => (
          <div className="grid gap-3">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="h-2" style={{ background: dept.color }} />
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="text-sm text-muted">{t('v.slip.yours')}</p>
                  <p className="ltr text-[2.4rem] font-black leading-none">MED-031</p>
                  <p className="mt-2 flex items-center gap-2 font-semibold">
                    <DeptBadge dept={dept} size={28} /> {L(dept.name)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-1.5">
                  <QRCode value={`${location.origin}/tour`} size={84} label="Demo QR" />
                </div>
              </div>
              <p className="border-t border-line px-4 py-2 text-xs text-muted">{t('v.slip.noData')}</p>
            </div>
            {m > 3500 && (
              <p className="v-enter flex items-start gap-2 rounded-2xl border border-[#3ccf7a]/30 bg-[#3ccf7a]/10 p-3 text-[0.9375rem]">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" />
                {t('v.slip.headsUp', { dept: L(dept.name), n: 31 })}
              </p>
            )}
            <p className="text-center text-xs font-bold text-accent">
              {t('common.simulation')} · {t('v.demoData')}
            </p>
          </div>
        ),
      },
      {
        id: 'consent',
        sec: 10,
        chapter: 'map',
        caption: S('Location is optional. A plain sheet asks first, and says it never leaves the phone.', 'مقام اختیاری ہے۔ پہلے سادہ الفاظ میں اجازت مانگی جاتی ہے، اور بتایا جاتا ہے کہ یہ فون سے باہر نہیں جاتا۔', 'جاءِ اختياري آهي. پهريان سادن لفظن ۾ اجازت گهري وڃي ٿي، ۽ ٻڌايو وڃي ٿو ته هي فون کان ٻاهر نٿي وڃي.'),
        pain: S('Fear of being tracked', 'نگرانی کا ڈر', 'نگراني جو ڊپ'),
        evidence: [],
        body: () => (
          <div className="v-sheet mt-6 rounded-3xl border border-line bg-solid p-5">
            <Icon name="pin" size={28} className="text-accent" />
            <h2 className="mt-2 text-xl font-extrabold">{t('v.loc.title')}</h2>
            <p className="mt-2">{t('v.loc.body')}</p>
            <p className="mt-2 text-sm text-muted">{t('v.loc.privacy')}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Btn>{t('v.loc.skip')}</Btn>
              <Btn primary>{t('v.loc.allow')}</Btn>
            </div>
          </div>
        ),
      },
      {
        id: 'walk',
        sec: 16,
        chapter: 'map',
        caption: S('The route draws itself. A big next-step card and a simulated GPS dot guide the walk.', 'راستہ خود بنتا ہے۔ اگلے قدم کا بڑا کارڈ اور نقلی جی پی ایس نقطہ رہنمائی کرتا ہے۔', 'رستو پاڻ ٺهي ٿو. ايندڙ قدم جو وڏو ڪارڊ ۽ نقلي جي پي ايس نقطو رهنمائي ڪري ٿو.'),
        pain: S('Hours lost searching', 'ڈھونڈنے میں گھنٹے ضائع', 'ڳولڻ ۾ ڪلاڪ ضايع'),
        evidence: ['P2'],
        body: (m) => {
          const p = along(legToJunction, m / 11000);
          return (
            <div className="grid gap-3">
              <span className="w-fit rounded-full bg-[#3b82f6]/15 px-3 py-1 text-xs font-bold text-[#93c5fd]">{t('v.map.gps')} · {t('common.simulation')}</span>
              <div className="overflow-hidden rounded-2xl border border-line">
                <FloorPlan data={data} route={main} routeColor="#E0A800" viewBox="150 120 560 358" dot={{ x: p[0], y: p[1] }} />
              </div>
              <NextCard route={main} n={1} total={3} />
            </div>
          );
        },
      },
      {
        id: 'wrong',
        sec: WRONG_SEC,
        chapter: 'map',
        caption: S('The visitor turns the wrong way. After several off-route readings, an alert, a vibration and a soft sound. The route is recomputed.', 'مریض غلط طرف مڑتا ہے۔ کئی بار راستے سے ہٹنے پر اطلاع، وائبریشن اور ہلکی آواز۔ راستہ دوبارہ بنتا ہے۔', 'مريض غلط پاسي مڙي ٿو. ڪيترا ڀيرا رستي کان هٽڻ تي اطلاع، وائبريشن ۽ هلڪي آواز. رستو ٻيهر ٺهي ٿو.'),
        pain: S('Wrong turns cost hours', 'غلط موڑ پر گھنٹے ضائع', 'غلط موڙ تي ڪلاڪ ضايع'),
        evidence: ['P2'],
        body: (m) => {
          const fired = m >= ALERT_AT_MS;
          const p = fired ? along(wrongLeg, ALERT_AT_MS / 9000) : along(wrongLeg, m / 9000);
          return (
            <div className="grid gap-3">
              {fired && (
                <div className="v-shake flex items-start gap-3 rounded-2xl border border-[#D92D20]/60 bg-[#D92D20]/20 p-3">
                  <Icon name="alert" size={22} className="shrink-0 text-danger" />
                  <div>
                    <p className="font-bold">{t('v.map.wrong', { place: placeName(data, 'junction', lang) })}</p>
                    <p className="text-sm text-muted">{t('v.map.rerouted')}</p>
                  </div>
                </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-line">
                <FloorPlan data={data} route={fired ? rerouted : main} routeColor="#E0A800" viewBox="200 120 640 410" dot={{ x: p[0], y: p[1], off: !fired && m > 1500 }} drawKey={fired ? 'r' : 'm'} />
              </div>
              <p className="text-center text-xs font-bold text-accent">{t('common.simulation')}</p>
            </div>
          );
        },
      },
      {
        id: 'arrive',
        sec: 12,
        chapter: 'map',
        caption: S('Back on track: "I reached Waiting Hall", then the Medicine door. Checkpoint taps work without GPS too.', 'دوبارہ صحیح راستے پر: "میں انتظار گاہ پہنچ گیا"، پھر میڈیسن کا دروازہ۔ جی پی ایس کے بغیر چیک پوائنٹ بھی کام کرتے ہیں۔', 'ٻيهر صحيح رستي تي: "مان انتظار گاهه پهچي ويس"، پوءِ ميڊيسن جو دروازو. جي پي ايس کان سواءِ چيڪ پوائنٽ به ڪم ڪن ٿا.'),
        pain: S('Getting lost again', 'دوبارہ گم ہونا', 'ٻيهر گم ٿيڻ'),
        evidence: ['P2'],
        body: (m) => {
          const p = along(rerouted.points, m / 8000);
          return (
            <div className="grid gap-3">
              <div className="overflow-hidden rounded-2xl border border-line">
                <FloorPlan data={data} route={rerouted} routeColor="#E0A800" viewBox="200 60 560 358" dot={{ x: p[0], y: p[1] }} />
              </div>
              {m < 8000 ? (
                <Btn primary>
                  <Icon name="check" size={20} /> {t('v.map.reached', { place: placeName(data, 'waiting', lang) })}
                </Btn>
              ) : (
                <VCard className="v-enter flex items-center gap-3 border-[#3ccf7a]/40">
                  <Icon name="flag" size={26} className="text-ok" /> <span className="text-lg font-extrabold">{t('v.map.arrived')}</span>
                </VCard>
              )}
            </div>
          );
        },
      },
      {
        id: 'wait',
        sec: 18,
        chapter: 'wait',
        caption: S('Waiting with news: people ahead, a time range, family sharing, and water, washrooms and seating nearby.', 'خبر کے ساتھ انتظار: آگے کتنے لوگ، وقت کی حد، گھر والوں سے شیئر، اور قریب پانی، واش روم اور نشستیں۔', 'خبر سان انتظار: اڳيان ڪيترا ماڻهو، وقت جي حد، گهر وارن سان شيئر، ۽ ويجهو پاڻي، واش روم ۽ سيٽون.'),
        pain: S('Wandering and asking while waiting', 'انتظار میں ادھر ادھر پوچھنا', 'انتظار ۾ هيڏانهن هوڏانهن پڇڻ'),
        evidence: ['P2'],
        body: (m) => {
          const ahead = Math.max(0, 3 - Math.floor(m / 6000));
          return (
            <div className="grid gap-3">
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="h-2" style={{ background: dept.color }} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="ltr text-[2rem] font-black">MED-031</p>
                    <DeptBadge dept={dept} size={36} />
                  </div>
                  <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${ahead === 0 ? 'bg-accent text-on-accent' : 'bg-solid'}`}>{t(ahead === 0 ? 'token.status.next' : 'token.status.waiting')}</p>
                  <p key={ahead} className="v-enter mt-2 font-bold">
                    {ahead === 0 ? t('token.aheadNone') : ahead === 1 ? t('token.aheadOne') : t('token.ahead', { n: ahead })}
                  </p>
                  <p>{t('token.wait', { min: ahead * 5, max: ahead * 5 + 10 })}</p>
                  <p className="text-xs font-bold text-accent">
                    {t('common.simulation')} · {t('v.demoData')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['water', 'washroom', 'seating', 'prayer'] as const).map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-sm font-bold">
                    <Icon name={f} size={18} className="text-accent" /> {t(`facility.${f}`)}
                  </div>
                ))}
              </div>
            </div>
          );
        },
      },
      {
        id: 'assistant',
        sec: 14,
        chapter: 'wait',
        caption: S('While waiting, the visitor asks the assistant in Sindhi: "Where is drinking water?" It answers in Sindhi, reads it aloud, and never gives medical advice.', 'انتظار میں مریض سندھی میں پوچھتا ہے: "پینے کا پانی کہاں ہے؟" مددگار سندھی میں جواب دیتا ہے، پڑھ کر سناتا ہے، اور کبھی طبی مشورہ نہیں دیتا۔', 'انتظار ۾ مريض سنڌي ۾ پڇي ٿو: "پيئڻ جو پاڻي ڪٿي آهي؟" مددگار سنڌي ۾ جواب ڏئي ٿو، پڙهي ٻڌائي ٿو، ۽ ڪڏهن طبي صلاح نٿو ڏئي.'), // TODO: native review
        pain: S('Nobody to ask', 'پوچھنے والا کوئی نہیں', 'پڇڻ وارو ڪو ناهي'), // TODO: native review
        evidence: ['P1'],
        body: (m) => {
          const q = 'پيئڻ جو پاڻي ڪٿي آهي؟';
          const r = answerRules(q, { data, lang: 'sd', from: 'waiting', token: null });
          return (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold">{t('v.more.assistant')}</h2>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">سنڌي</span>
              </div>
              <p className="text-xs text-muted">{t('assistant.label')}</p>
              <div className="grid gap-2 rounded-2xl border border-line bg-surface p-3">
                {m < 2500 ? (
                  <p className="flex items-center gap-2 text-sm text-accent">
                    <Icon name="mic" size={18} className="v-float" /> {translate('sd', 'assistant.listening')}
                  </p>
                ) : (
                  <p lang="sd" dir="rtl" className="v-enter ms-auto max-w-[85%] rounded-2xl bg-accent px-3 py-2 text-on-accent">
                    {q}
                  </p>
                )}
                {m > 4500 && (
                  <p lang="sd" dir="rtl" className="v-enter me-auto max-w-[90%] rounded-2xl border border-line bg-solid px-3 py-2">
                    {r.reply}
                  </p>
                )}
                {m > 6500 && (
                  <div className="v-enter vbtn pointer-events-none min-h-11 text-sm">
                    <Icon name="route" size={16} /> {translate('sd', 'assistant.showRoute')}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2" lang="sd" dir="rtl">
                {r.chips.slice(0, 3).map((c) => (
                  <span key={c} className="vchip h-9 text-xs">
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-center text-xs font-bold text-accent">{t('common.simulation')} · {t('assistant.rulesMode')}</p>
            </div>
          );
        },
      },
      {
        id: 'turn',
        sec: 11,
        chapter: 'turn',
        caption: S('"Your turn now", in green, with a vibration. The visitor goes in.', '"اب آپ کی باری ہے"، سبز رنگ اور وائبریشن کے ساتھ۔ مریض اندر جاتا ہے۔', '"هاڻي توهان جي واري آهي"، سائي رنگ ۽ وائبريشن سان. مريض اندر وڃي ٿو.'),
        pain: S('Missing your turn', 'باری نکل جانا', 'واري نڪري وڃڻ'),
        evidence: ['P2'],
        body: () => (
          <div className="turn-pulse mt-4 rounded-3xl bg-[#15803d] p-6 text-center text-white">
            <Icon name="check" size={44} className="mx-auto" strokeWidth={2.6} />
            <p className="mt-2 text-[1.6rem] font-black">{t('v.turn.title')}</p>
            <p className="ltr text-[1.8rem] font-black">MED-031</p>
            <p>{t('v.turn.go', { dept: L(dept.name) })}</p>
          </div>
        ),
      },
      {
        id: 'feedback',
        sec: 10,
        chapter: 'turn',
        caption: S('One anonymous tap: "Did you reach the right department the first time?" That is how the pilot is measured.', 'ایک گمنام ٹیپ: "کیا آپ پہلی بار ہی صحیح شعبے تک پہنچے؟" پائلٹ کی پیمائش اسی سے ہوتی ہے۔', 'هڪ گمنام ٽيپ: "ڇا توهان پهريون ڀيرو ئي صحيح شعبي تائين پهتا؟" پائلٽ جي ماپ ان سان ٿيندي.'),
        pain: S('No way to know if it worked', 'معلوم نہیں ہوتا کہ کام ہوا یا نہیں', 'خبر نٿي پوي ته ڪم ٿيو يا نه'),
        evidence: ['P1', 'P2', 'S1'],
        body: (m) => (
          <VCard className="mt-4">
            <p className="font-extrabold">{t('feedback.question')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className={`vbtn pointer-events-none ${m > 4000 ? '' : 'opacity-80'}`}>
                <Icon name="check" size={18} /> {t('common.yes')}
              </div>
              <Btn>{t('common.no')}</Btn>
            </div>
            {m > 4500 && <p className="v-enter mt-3 text-sm text-muted">{t('feedback.thanks')}</p>}
          </VCard>
        ),
      },
      {
        id: 'followup',
        sec: 12,
        chapter: 'turn',
        caption: S('After the check-up: a follow-up card in simple Urdu and Sindhi. Next visit date, bring reports, come to Emergency if worse. General reminders only.', 'معائنے کے بعد: سادہ اردو اور سندھی میں دوبارہ آنے کا کارڈ۔ اگلی تاریخ، رپورٹیں لائیں، حالت خراب ہو تو ایمرجنسی۔ صرف عام یاددہانی۔', 'معائني کان پوءِ: سادي اردو ۽ سنڌي ۾ ٻيهر اچڻ جو ڪارڊ. ايندڙ تاريخ، رپورٽون آڻيو، حالت خراب ٿئي ته ايمرجنسي. رڳو عام يادگيري.'), // TODO: native review
        pain: S('Unclear what to do next', 'آگے کیا کرنا ہے واضح نہیں', 'اڳتي ڇا ڪجي واضح ناهي'), // TODO: native review
        evidence: ['P1'],
        body: () => (
          <div className="grid gap-3">
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <Icon name="clipboard" size={20} className="text-accent" /> {t('v.turn.after')}
            </h2>
            <div className="rounded-2xl bg-white p-4 text-black">
              <div className="flex items-center justify-between border-b border-black/30 pb-2 text-sm">
                <b>WayMed · {t('followup.title')}</b>
                <span className="flex items-center gap-1">
                  <DeptBadge dept={dept} size={22} /> {L(dept.name)}
                </span>
              </div>
              <p className="mt-2 text-sm">
                <b>{t('followup.next')}:</b> <span className="ltr">__ / __ / ____</span>
              </p>
              <ul className="mt-2 grid gap-1 text-sm">
                {(['followup.r1', 'followup.r2', 'followup.r3'] as const).map((k) => (
                  <li key={k}>• {t(k)}</li>
                ))}
                <li className="font-bold">⚠ {t('followup.r4')}</li>
              </ul>
            </div>
            <p className="text-xs text-muted">{t('followup.lead')}</p>
          </div>
        ),
      },
    ],
    [t, L, lang],
  );

  const scene = scenes[i];
  const totalSec = scenes.reduce((s, x) => s + x.sec, 0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMs((v) => v + 200), 200);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (ms < scene.sec * 1000) return;
    if (i < scenes.length - 1) {
      setI(i + 1);
      setMs(0);
    } else setPlaying(false);
  }, [ms, scene.sec, i, scenes.length]);
  // The wrong-turn alert in the tour also vibrates and chimes, like the real one.
  useEffect(() => {
    if (scene.id === 'wrong' && ms >= ALERT_AT_MS && ms < ALERT_AT_MS + 200 && playing) {
      navigator.vibrate?.([200, 100, 200]);
      softChime();
    }
  }, [scene.id, ms, playing]);

  const goTo = (n: number) => {
    setI(Math.max(0, Math.min(scenes.length - 1, n)));
    setMs(0);
  };

  const panel = (
    <div className="v-enter rounded-3xl border border-line bg-[#111] p-6" key={scene.id}>
      <p className="text-xs font-bold uppercase tracking-wide text-accent">
        {t('v.tour.title')} · {i + 1}/{scenes.length} · ~{Math.round(totalSec / 60)} min
      </p>
      <h2 className="mt-3 text-sm font-bold uppercase tracking-wide text-muted">{t('v.tour.what')}</h2>
      <p className="mt-1 text-lg font-semibold leading-snug">{L(scene.caption)}</p>
      {scene.chapter && (
        <p className="mt-4 text-sm">
          <span className="font-bold text-muted">{t('v.progress', { n: ['gate', 'slip', 'map', 'wait', 'turn'].indexOf(scene.chapter) + 1 })}:</span> {t(`v.ch.${scene.chapter}` as DictKey)}
        </p>
      )}
      <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">{t('v.tour.pain')}</h3>
      <p className="mt-1 flex items-center gap-2 font-semibold">
        <Icon name="check" size={16} className="text-ok" /> <span className="line-through decoration-[#D92D20]/70">{L(scene.pain)}</span>
      </p>
      {scene.evidence.length > 0 && (
        <>
          <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">{t('v.tour.evidence')}</h3>
          <ul className="mt-1 grid gap-2">
            {scene.evidence.map((e) => (
              <li key={e} className="rounded-xl border border-line bg-surface p-3 text-sm">
                “{L(EVIDENCE[e])}”
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-5 text-xs font-bold text-accent">{t('common.simulation')} · {t('v.demoData')}</p>
    </div>
  );

  return (
    <VisitorShell wide>
      <div className="grid items-start gap-6 lg:grid-cols-[440px_1fr] lg:gap-10">
      <section aria-label={t('v.tour.title')} className="overflow-hidden rounded-3xl border border-line bg-[#0b0b0b]">
      <div className="p-4">
      {scene.chapter && (
        <div className="mb-4">
          <JourneyProgress chapter={scene.chapter} />
        </div>
      )}
      <div key={scene.id} className="v-enter min-h-[440px]">
        {scene.body(ms)}
      </div>
      </div>
      <div className="border-t border-line bg-[#111] px-4 pt-3 pb-3">
        <p key={`c${scene.id}`} className="v-enter mb-2 text-sm leading-snug">
          <span className="font-bold text-accent">{t('common.simulation')}: </span>
          {L(scene.caption)}
        </p>
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${((i + ms / (scene.sec * 1000)) / scenes.length) * 100}%` }} />
        </div>
        <div className="flex items-center gap-2">
          <button className="vchip" onClick={() => goTo(i - 1)} aria-label={t('common.back')}>
            <Icon name="arrowLeft" size={16} className="rtl:rotate-180" />
          </button>
          <button className="vchip flex-1 justify-center" onClick={() => setPlaying(!playing)} aria-pressed={playing}>
            <Icon name={playing ? 'pause' : 'play'} size={16} /> {playing ? t('v.tour.pause') : t('v.tour.auto')}
          </button>
          <button className="vchip" onClick={() => goTo(i + 1)} aria-label={t('common.next')}>
            <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
          </button>
          <button
            className="vchip"
            onClick={() => {
              goTo(0);
              setPlaying(true);
            }}
            aria-label={t('v.tour.restart')}
          >
            <Icon name="uturn" size={16} />
          </button>
          <Link to="/" className="vchip" aria-label={t('v.tour.exit')}>
            <Icon name="x" size={16} />
          </Link>
        </div>
      </div>
      </section>
      {panel}
      </div>
    </VisitorShell>
  );
}
