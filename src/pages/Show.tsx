// Presenter show: fullscreen 16:9, one idea per scene, keyboard and clicker control.
// Space/Right/PageDown next · Left/PageUp back · A auto-play · P pause · R restart · F fullscreen · H hide controls · S safe mode.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { L10n, Lang, TokenView } from '../lib/types.ts';
import { LANGS } from '../lib/types.ts';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { findRoute } from '../lib/route.ts';
import { stepText } from '../lib/directions.ts';
import { translate } from '../lib/i18n/core.ts';
import { FloorPlan } from '../components/FloorPlan.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { FlipText } from '../components/FlipText.tsx';
import { Slip } from '../components/Slip.tsx';
import { Icon } from '../components/Icon.tsx';
import { HMW, PERSONAS, JOURNEY, FEATURE_EVIDENCE, REJECTED, PILOT, RESEARCH, TEAM_MEMBERS, STORY_STEPS, RAW_IDEA } from '../data/story.ts';

interface Scene {
  id: string;
  sec: number;
  title: L10n;
  caption: L10n;
  body: (ctx: { lang: Lang; tick: number }) => ReactNode;
}

const S = (en: string, ur: string, sd: string): L10n => ({ en, ur, sd });
const STAGE_W = 1280;
const STAGE_H = 720;

export default function Show() {
  useAllLanguages();
  const { lang } = usePrefs();
  const { data } = useHospital();
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hide, setHide] = useState(false);
  const [safe, setSafe] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; swiped: boolean } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / STAGE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 767px), (pointer: coarse)').matches);
  const [portrait, setPortrait] = useState(() => matchMedia('(orientation: portrait)').matches);
  useEffect(() => {
    const a = matchMedia('(max-width: 767px), (pointer: coarse)');
    const b = matchMedia('(orientation: portrait)');
    const on = () => {
      setNarrow(a.matches);
      setPortrait(b.matches);
    };
    a.addEventListener('change', on);
    b.addEventListener('change', on);
    return () => {
      a.removeEventListener('change', on);
      b.removeEventListener('change', on);
    };
  }, []);
  const L = (s: L10n) => s[lang] || s.en;

  const ped = data.departments.find((d) => d.id === 'paediatrics') ?? data.departments[0];
  const route = useMemo(() => (ped ? findRoute(data, 'entrance', ped.nodeId) : null), [data, ped]);
  const lostRoute = useMemo(() => (ped ? findRoute(data, 'labCorridor', ped.nodeId) : null), [data, ped]);
  const sampleToken = (status: TokenView['status'], ahead: number): TokenView => ({
    id: 'SAMPLEsample0000',
    label: `${ped?.code ?? 'PED'}-007`,
    deptId: ped?.id ?? '',
    status,
    ahead,
    wait: { minMin: 5, maxMin: 15, measured: false },
    calledAt: null,
    recalledAt: null,
    slotStart: null,
    slotEnd: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const scenes: Scene[] = [
    {
      id: 'title',
      sec: 12,
      title: S('WayMed', 'وے میڈ', 'وي ميڊ'),
      caption: S('A guidance network for first-time visitors at Civil Hospital Karachi.', 'سول ہسپتال کراچی میں پہلی بار آنے والوں کے لیے رہنمائی نیٹ ورک۔', 'سول اسپتال ڪراچي ۾ پهريون ڀيرو ايندڙن لاءِ رهنمائي نيٽ ورڪ.'),
      body: () => (
        <div className="grid h-full place-items-center text-center">
          <div>
            <img src="/icon.svg" alt="" className="mx-auto mb-[0.5em] size-[4em] rounded-[0.8em]" />
            <p className="text-[3.2em] font-black">WayMed</p>
            <p className="text-[1.4em] text-[#E0A800]">{translate(lang, 'app.tagline')}</p>
            <p className="mx-auto mt-[1em] max-w-[22em] text-[1.25em] leading-snug">{L(HMW)}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'team',
      sec: 24,
      title: S('Who we are and how we got here', 'ہم کون ہیں اور یہاں تک کیسے پہنچے', 'اسان ڪير آهيون ۽ هتي ڪيئن پهتاسين'),
      caption: S(
        'We visited Civil Hospital Karachi, turned what we heard into 5 problem themes, chose one HMW, compared 4 ideas, and built this web app.',
        'ہم سول ہسپتال کراچی گئے، سنی باتوں سے 5 موضوعات بنائے، ایک HMW چنا، 4 آئیڈیاز پرکھے، اور یہ ویب ایپ بنائی۔',
        'اسان سول اسپتال ڪراچي وياسين، ٻڌل ڳالهين مان 5 موضوع ٺاهيا، هڪ HMW چونڊيو، 4 خيال پرکيا، ۽ هيءَ ويب ايپ ٺاهي.',
      ),
      body: () => (
        <div className="grid h-full grid-rows-[auto_1fr_auto] gap-[0.5em]">
          <p className="ltr flex flex-wrap items-center gap-[0.4em] text-[0.9em]">
            {TEAM_MEMBERS.map((m) => (
              <span key={m} className="rounded-full bg-white/10 px-[0.6em] py-[0.15em] font-bold">
                {m}
              </span>
            ))}
          </p>
          <ol className="grid grid-cols-5 gap-[0.4em]">
            {STORY_STEPS.map((st, k) => (
              <li key={k} className={`fade-up rounded-[0.5em] p-[0.5em] ${k === STORY_STEPS.length - 1 ? 'bg-[#E0A800] text-black' : 'bg-white/[0.07]'}`} style={{ animationDelay: `${k * 350}ms` }}>
                <Icon name={st.icon} size="1.3em" className={k === STORY_STEPS.length - 1 ? '' : 'text-[#E0A800]'} />
                <p className="mt-[0.2em] text-[0.95em] font-black leading-tight">{L(st.title)}</p>
                <p className="mt-[0.2em] text-[0.8em] leading-snug opacity-90">{L(st.text)}</p>
              </li>
            ))}
          </ol>
          <p className="fade-up font-hand -rotate-[0.5deg] rounded-[0.4em] bg-[#fdf6d8] px-[0.7em] py-[0.35em] text-[1.05em] leading-snug text-black" style={{ animationDelay: '1900ms' }}>
            {L(RAW_IDEA)}
          </p>
        </div>
      ),
    },
    {
      id: 'problem',
      sec: 20,
      title: S('What we heard', 'ہم نے کیا سنا', 'اسان ڇا ٻڌو'),
      caption: S('Paraphrased from our interviews. Not invented, not measured.', 'ہمارے انٹرویوز سے، اپنے الفاظ میں۔ گھڑا یا ناپا نہیں گیا۔', 'اسان جي انٽرويوز مان، پنهنجن لفظن ۾. گهڙيل يا ماپيل ناهي.'),
      body: () => (
        <div className="grid h-full grid-cols-2 gap-[0.6em]">
          {PERSONAS.slice(0, 4).map((p, k) => (
            <div key={p.id} className="fade-up rounded-[0.6em] bg-white/[0.07] p-[0.6em]" style={{ animationDelay: `${k * 300}ms` }}>
              <p className="text-[1.1em] font-black">
                {L(p.name)} <span className="font-normal text-[#E0A800]">· {p.code} · {L(p.role)}</span>
              </p>
              <p className="mt-[0.2em] text-[0.95em] leading-snug">“{L(p.evidence[0])}”</p>
              {p.evidence[1] && <p className="text-[0.85em] leading-snug opacity-80">“{L(p.evidence[1])}”</p>}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'wall',
      sec: 18,
      title: S('34 stickies, 5 themes', '34 نوٹس، 5 موضوعات', '34 نوٽس، 5 موضوع'),
      caption: S(
        'Our field visit: 6 people, 34 stickies, grouped into 5 themes. We chose Group B: lost without guidance.',
        'ہمارا دورہ: 6 لوگ، 34 نوٹس، 5 موضوعات۔ ہم نے گروپ B چنا: رہنمائی کے بغیر گم۔',
        'اسان جو دورو: 6 ماڻهو، 34 نوٽس، 5 موضوع. اسان گروپ B چونڊيو: رهنمائي کان سواءِ گم.',
      ),
      body: () => (
        <div className="grid h-full grid-cols-5 gap-[0.35em] text-[0.62em]">
          {RESEARCH.groups.map((g, k) => {
            const items = RESEARCH.stickies.filter((x) => x.group === g.code);
            const selected = g.code === 'B';
            return (
              <div key={g.code} className={`fade-up flex flex-col gap-[0.3em] rounded-[0.5em] p-[0.4em] ${selected ? 'bg-amber-300/20 ring-4 ring-amber-300' : 'bg-white/[0.06]'}`} style={{ animationDelay: `${k * 200}ms` }}>
                <p className="text-[1.3em] font-black leading-tight">
                  {g.code} · {g.title[lang] ?? g.title.en}
                </p>
                <p className="text-[#F5C842]">
                  {items.length} {L(S('stickies', 'نوٹس', 'نوٽس'))}
                </p>
                {items.slice(0, 3).map((x) => (
                  <p key={x.number} className="ltr rounded-[0.3em] bg-[#fef3c7] p-[0.3em] text-[0.9em] leading-snug text-black">
                    <b>#{x.number} {x.code}</b> {x.text}
                  </p>
                ))}
                {selected && <p className="mt-auto font-black text-amber-300">HMW ✓</p>}
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: 'arrive',
      sec: 16,
      title: S('Arrive: language first', 'پہنچیں: پہلے زبان', 'پهچو: پهريان ٻولي'),
      caption: S('Scan the entrance QR. The first question is the language, then "Where do you want to go?"', 'داخلے کا کیو آر اسکین کریں۔ پہلا سوال زبان، پھر "کہاں جانا ہے؟"', 'داخلا جو ڪيو آر اسڪين ڪريو. پهريون سوال ٻولي، پوءِ "ڪٿي وڃڻو آهي؟"'),
      body: () => (
        <div className="grid h-full grid-cols-3 items-center gap-[0.8em]">
          {LANGS.map((l, k) => (
            <div key={l} lang={l} dir={l === 'en' ? 'ltr' : 'rtl'} className="fade-up rounded-[0.8em] bg-white/[0.08] p-[1em] text-center" style={{ animationDelay: `${k * 400}ms` }}>
              <Icon name="globe" size="2em" className="mx-auto text-[#E0A800]" />
              <p className="mt-[0.3em] text-[1.8em] font-black">{l === 'en' ? 'English' : l === 'ur' ? 'اردو' : 'سنڌي'}</p>
              <p className="text-[0.95em]">{translate(l, 'home.whereTo')}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'slip',
      sec: 18,
      title: S('A slip with no personal data', 'پرچی، کوئی ذاتی معلومات نہیں', 'پرچي، ڪا ذاتي معلومات ناهي'),
      caption: S('Token number, department colour and shape, a QR code and three arrows. No name, no phone.', 'ٹوکن نمبر، شعبے کا رنگ اور شکل، کیو آر اور تین تیر۔ نام نہیں، فون نہیں۔', 'ٽوڪن نمبر، شعبي جو رنگ ۽ شڪل، ڪيو آر ۽ ٽي تير. نالو ناهي، فون ناهي.'),
      body: () =>
        ped && (
          <div className="grid h-full grid-cols-[auto_1fr] items-center gap-[1.2em]">
            <div className="h-full origin-top scale-[0.62] [@media(min-height:900px)]:scale-[0.8]">
              <Slip view={sampleToken('waiting', 3)} dept={ped} data={data} />
            </div>
            <ul className="grid gap-[0.5em] text-[1.2em]">
              {[S('Token only', 'صرف ٹوکن', 'رڳو ٽوڪن'), S('Colour + shape + icon', 'رنگ + شکل + نشان', 'رنگ + شڪل + نشاني'), S('QR opens live status', 'کیو آر سے تازہ صورتحال', 'ڪيو آر سان تازي صورتحال'), S('Deleted after 24 hours', '24 گھنٹے بعد مٹ جاتا ہے', '24 ڪلاڪن بعد ختم')].map((x, k) => (
                <li key={k} className="fade-up flex items-center gap-[0.4em]" style={{ animationDelay: `${600 + k * 400}ms` }}>
                  <Icon name="check" className="text-[#E0A800]" size="1.2em" /> {L(x)}
                </li>
              ))}
            </ul>
          </div>
        ),
    },
    {
      id: 'fork',
      sec: 20,
      title: S('Phone or no phone', 'فون ہو یا نہ ہو', 'فون هجي يا نه هجي'),
      caption: S('With a smartphone: scan the slip. Without one: the kiosk, the board and the coloured signs. Both reach the same place.', 'اسمارٹ فون ہو تو پرچی اسکین کریں۔ نہ ہو تو کیوسک، بورڈ اور رنگین نشان۔ دونوں ایک ہی جگہ پہنچاتے ہیں۔', 'اسمارٽ فون هجي ته پرچي اسڪين ڪريو. نه هجي ته ڪيوسڪ، بورڊ ۽ رنگين نشان. ٻئي ساڳي جاءِ پهچائين ٿا.'),
      body: ({ tick: tk }) => (
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-[0.8em] text-center">
          <div className="fade-up rounded-[0.8em] bg-white/[0.08] p-[0.8em]">
            <Icon name="qr" size="2.4em" className="mx-auto text-[#E0A800]" />
            <p className="text-[1.4em] font-black">{L(S('Phone', 'فون', 'فون'))}</p>
            <p>{L(S('Scan slip, live status, route', 'پرچی اسکین، صورتحال، راستہ', 'پرچي اسڪين، صورتحال، رستو'))}</p>
          </div>
          <div className={`text-[2.5em] transition-opacity ${tk % 2 ? 'opacity-100' : 'opacity-40'}`}>→</div>
          <div className="fade-up rounded-[0.8em] bg-white/[0.08] p-[0.8em]" style={{ animationDelay: '500ms' }}>
            <Icon name="keyboard" size="2.4em" className="mx-auto text-[#E0A800]" />
            <p className="text-[1.4em] font-black">{L(S('Kiosk + board', 'کیوسک + بورڈ', 'ڪيوسڪ + بورڊ'))}</p>
            <p>{L(S('Type token, big touch buttons', 'ٹوکن لکیں، بڑے بٹن', 'ٽوڪن لکو، وڏا بٽڻ'))}</p>
          </div>
          <p className="fade-up col-span-3 text-[1.5em] font-black text-amber-300" style={{ animationDelay: '1200ms' }}>
            {ped && <DeptMark dept={ped} size={48} />} {ped && L(ped.name)}
          </p>
        </div>
      ),
    },
    {
      id: 'route',
      sec: 22,
      title: S('The route draws itself', 'راستہ خود بنتا ہے', 'رستو پاڻ ٺهي ٿو'),
      caption: S('Shortest path over the landmark graph, with a step-free option. Steps in English, Urdu and Sindhi.', 'نشانات کے نقشے پر مختصر ترین راستہ، بغیر سیڑھی کا اختیار۔ ہدایات تین زبانوں میں۔', 'نشانن جي نقشي تي ننڍو رستو، ڏاڪن کان سواءِ اختيار. هدايتون ٽن ٻولين ۾.'),
      body: ({ tick: tk }) => {
        const l = LANGS[Math.floor(tk / 3) % 3];
        return (
          <div className="grid h-full grid-cols-[1.5fr_1fr] items-center gap-[0.8em]">
            <div className="rounded-[0.8em] bg-white p-[0.3em]">
              <FloorPlan data={data} route={route} routeColor={ped?.color} drawKey={`show-${Math.floor(tk / 9)}`} />
            </div>
            <ol key={l} lang={l} dir={l === 'en' ? 'ltr' : 'rtl'} className="fade-up grid gap-[0.3em] text-[0.95em]">
              {route?.steps.map((s, k) => (
                <li key={k} className="rounded-[0.4em] bg-white/[0.08] px-[0.5em] py-[0.25em]">
                  {stepText(s, data, l)}
                </li>
              ))}
            </ol>
          </div>
        );
      },
    },
    {
      id: 'lost',
      sec: 18,
      title: S('Lost? The next sign corrects you', 'راستہ بھول گئے؟ اگلا نشان درست کرتا ہے', 'رستو ڀلجي ويا؟ ايندڙ نشان درست ڪري ٿو'),
      caption: S('Every landmark has a QR sticker: "You are here" plus the corrected route, and an "I feel lost" button that can call a guide.', 'ہر مقام پر کیو آر: "آپ یہاں ہیں" اور درست راستہ، اور "راستہ بھول گیا" بٹن جو رہنما بلا سکتا ہے۔', 'هر جاءِ تي ڪيو آر: "توهان هتي آهيو" ۽ درست رستو، ۽ "رستو ڀلجي ويو" بٽڻ جيڪو رهنما سڏي سگهي.'),
      body: () => (
        <div className="grid h-full grid-cols-[1.5fr_1fr] items-center gap-[0.8em]">
          <div className="rounded-[0.8em] bg-white p-[0.3em]">
            <FloorPlan data={data} route={lostRoute} routeColor={ped?.color} />
          </div>
          <div className="grid gap-[0.6em]">
            <div className="rounded-[0.6em] bg-[#121212] p-[0.6em] ring-2 ring-[#E0A800]">
              <p className="opacity-80">{translate(lang, 'landmark.title')}</p>
              <p className="text-[1.4em] font-black">{L(data.landmarks.find((x) => x.id === 'labCorridor')?.name ?? S('', '', ''))}</p>
            </div>
            <div className="rounded-[0.6em] bg-amber-300 p-[0.6em] text-center text-[1.3em] font-black text-black">
              <Icon name="compass" size="1.2em" className="me-[0.3em] inline" />
              {translate(lang, 'landmark.lost')}
            </div>
            <p className="text-[0.95em]">{translate(lang, 'landmark.askGuide')} → {translate(lang, 'landmark.guideOnWay')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'wait',
      sec: 18,
      title: S('Waiting, with news', 'خبر کے ساتھ انتظار', 'خبر سان انتظار'),
      caption: S('The entrance board and the phone update live. Wait is shown as a range from real service times, never false precision.', 'داخلی بورڈ اور فون فوراً اپ ڈیٹ۔ انتظار اصل اوقات سے ایک حد کے طور پر، جھوٹی درستی نہیں۔', 'داخلا بورڊ ۽ فون هڪدم اپڊيٽ. انتظار اصل وقتن مان هڪ حد طور، ڪوڙي درستي ناهي.'),
      body: ({ tick: tk }) => (
        <div className="grid h-full content-center gap-[0.4em] rounded-[0.8em] bg-black/60 p-[0.8em]">
          {data.departments.slice(0, 4).map((d, k) => (
            <div key={d.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-[0.6em] rounded-[0.4em] bg-white/[0.05] px-[0.5em] py-[0.2em]" style={{ borderInlineStart: `0.3em solid ${d.color}` }}>
              <DeptMark dept={d} size={40} />
              <span className="text-[1.1em] font-bold">
                {d.name.en} · <span lang="ur">{d.name.ur}</span> · <span lang="sd">{d.name.sd}</span>
              </span>
              <span className="text-[1.6em] font-black">
                <FlipText text={`${d.code}-${String(3 + k * 2 + Math.floor(tk / (2 + k))).padStart(3, '0')}`} length={7} />
              </span>
            </div>
          ))}
          <p className="text-center text-[0.8em] text-amber-300">{translate(lang, 'common.simulation')}</p>
        </div>
      ),
    },
    {
      id: 'turn',
      sec: 14,
      title: S('Your turn', 'آپ کی باری', 'توهان جي واري'),
      caption: S('Green, a pulse, vibration and a spoken alert. Missed it? "Go to the desk", not lost forever.', 'سبز رنگ، دھڑکن، وائبریشن اور آواز۔ باری نکل گئی؟ "کاؤنٹر پر جائیں"۔', 'سائو رنگ، ڌڙڪن، وائبريشن ۽ آواز. واري نڪري وئي؟ "ڪائونٽر تي وڃو".'),
      body: () => (
        <div className="grid h-full place-items-center">
          <div className="turn-pulse rounded-[1em] bg-[#15803d] px-[2em] py-[1em] text-center">
            <Icon name="check" size="2.4em" className="mx-auto" strokeWidth={2.6} />
            <p className="text-[2.6em] font-black">{translate(lang, 'token.status.called')}</p>
            <p className="ltr text-[2em] font-black">{ped?.code}-007</p>
            <p className="text-[1.1em]">{translate(lang, 'token.goNow', { dept: ped ? L(ped.name) : '' })}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'journey',
      sec: 22,
      title: S('Customer journey', 'مریض کا سفر', 'مريض جو سفر'),
      caption: S('"Today" comes from the interviews. "Expected" is our hypothesis, to be tested in the pilot.', '"آج" انٹرویوز سے۔ "متوقع" ہمارا مفروضہ ہے، پائلٹ میں جانچا جائے گا۔', '"اڄ" انٽرويوز مان. "متوقع" اسان جو مفروضو آهي، پائلٽ ۾ جانچيو ويندو.'),
      body: () => (
        <div className="grid h-full grid-cols-5 gap-[0.3em] text-[0.7em]">
          {JOURNEY.map((j, k) => (
            <div key={k} className="fade-up grid grid-rows-[auto_1fr_1fr_auto] gap-[0.3em]" style={{ animationDelay: `${k * 250}ms` }}>
              <p className="rounded-[0.4em] bg-[#E0A800] p-[0.3em] text-center text-[1.2em] font-black text-black">{L(j.stage)}</p>
              <div className="rounded-[0.4em] bg-[#b91c1c]/30 p-[0.4em]">
                <p className="font-bold text-red-200">{translate(lang, 'walk.today')} · {j.source}</p>
                <p>{L(j.today)}</p>
              </div>
              <div className="rounded-[0.4em] bg-[#15803d]/30 p-[0.4em]">
                <p className="font-bold text-green-200">{translate(lang, 'walk.expected')}</p>
                <p>{L(j.expected)}</p>
              </div>
              <p className="text-[#F5C842]">{L(j.feature)}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'evidence',
      sec: 24,
      title: S('Every feature has evidence', 'ہر خصوصیت کا ثبوت', 'هر خاصيت جو ثبوت'),
      caption: S('Each feature answers something we heard. Rejected: camera tracking (privacy, cost, maintenance) and walking robots (cost).', 'ہر خصوصیت کسی سنی ہوئی بات کا جواب۔ رد: کیمرہ نگرانی (رازداری، خرچ، دیکھ بھال)، روبوٹ (خرچ)۔', 'هر خاصيت ڪنهن ٻڌل ڳالهه جو جواب. رد: ڪئميرا نگراني (رازداري، خرچ، سار سنڀال)، روبوٽ (خرچ).'),
      body: () => (
        <div className="grid h-full grid-cols-[1.6fr_1fr] gap-[0.8em] text-[0.78em]">
          <ul className="grid content-start gap-[0.3em]">
            {FEATURE_EVIDENCE.map((f, k) => (
              <li key={k} className="fade-up grid grid-cols-[auto_1fr] items-center gap-[0.4em] rounded-[0.4em] bg-white/[0.07] px-[0.4em] py-[0.2em]" style={{ animationDelay: `${k * 200}ms` }}>
                <Icon name={f.icon} className="text-[#E0A800]" size="1.3em" />
                <span>
                  <b>{L(f.feature)}</b> <span className="ltr opacity-80">← {f.evidence}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="grid content-start gap-[0.4em]">
            <p className="text-[1.2em] font-black text-red-300">{L(S('Rejected ideas', 'رد کیے گئے خیالات', 'رد ٿيل خيال'))}</p>
            {REJECTED.map((r, k) => (
              <div key={k} className="rounded-[0.4em] border border-red-300/50 p-[0.4em]">
                <p className="font-bold line-through decoration-red-400">{L(r.idea)}</p>
                <p>{L(r.why)}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'learn',
      sec: 16,
      title: S('The hospital learns where signs fail', 'ہسپتال سیکھتا ہے کہ نشان کہاں ناکام ہیں', 'اسپتال سکي ٿو ته نشان ڪٿي ناڪام آهن'),
      caption: S('Anonymous "I feel lost" taps per landmark become a heatmap. Only counts are kept; no people are tracked.', 'ہر مقام پر گمنام "راستہ بھول گیا" دبانا نقشے پر دکھتا ہے۔ صرف گنتی، کسی کی نگرانی نہیں۔', 'هر جاءِ تي گمنام "رستو ڀلجي ويو" دٻائڻ نقشي تي ڏسجي ٿو. رڳو ڳڻپ، ڪنهن جي نگراني ناهي.'),
      body: () => (
        <div className="grid h-full grid-cols-[1.5fr_1fr] items-center gap-[0.8em]">
          <div className="rounded-[0.8em] bg-white p-[0.3em]">
            <FloorPlan data={data} heat={{ junction: 6, labCorridor: 3, registration: 2 }} />
          </div>
          <div className="grid gap-[0.5em]">
            <p className="rounded-[0.4em] bg-amber-300 p-[0.4em] text-center font-black text-black">{translate(lang, 'common.sample')}</p>
            <p className="text-[1.1em]">{translate(lang, 'insights.recLost', { place: L(data.landmarks.find((x) => x.id === 'junction')?.name ?? S('', '', '')) })}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'pilot',
      sec: 16,
      title: S('Pilot plan', 'پائلٹ منصوبہ', 'پائلٽ رٿا'),
      caption: S('A plan, not results. We will measure before we claim anything.', 'منصوبہ، نتائج نہیں۔ دعویٰ سے پہلے پیمائش کریں گے۔', 'رٿا، نتيجا ناهن. دعوي کان اڳ ماپ ڪنداسين.'),
      body: () => (
        <ul className="grid h-full content-center gap-[0.5em] text-[1.15em]">
          {PILOT.map((p, k) => (
            <li key={k} className="fade-up flex items-center gap-[0.5em]" style={{ animationDelay: `${k * 300}ms` }}>
              <span className="grid size-[1.6em] shrink-0 place-items-center rounded-full bg-[#E0A800] font-black text-black">{k + 1}</span> {L(p)}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  const total = scenes.length;
  const scene = scenes[Math.min(i, total - 1)];
  const next = useCallback(() => {
    setI((n) => Math.min(total - 1, n + 1));
    setElapsed(0);
  }, [total]);
  const prev = useCallback(() => {
    setI((n) => Math.max(0, n - 1));
    setElapsed(0);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((n) => n + 1);
      if (auto && !paused) setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [auto, paused]);
  useEffect(() => {
    if (auto && !paused && elapsed >= scene.sec) {
      if (i < total - 1) next();
      else setAuto(false);
    }
  }, [elapsed, auto, paused, scene.sec, i, total, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === ' ' || k === 'ArrowRight' || k === 'PageDown' || k === 'Enter') {
        e.preventDefault();
        next();
      } else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') {
        e.preventDefault();
        prev();
      } else if (k === 'a' || k === 'A') {
        setAuto(true);
        setPaused(false);
      } else if (k === 'p' || k === 'P') setPaused((p) => !p);
      else if (k === 'r' || k === 'R') {
        setI(0);
        setElapsed(0);
      } else if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void rootRef.current?.requestFullscreen?.();
      } else if (k === 'h' || k === 'H') setHide((h) => !h);
      else if (k === 's' || k === 'S') setSafe((s) => !s);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [next, prev]);

  const totalSec = scenes.reduce((s, x) => s + x.sec, 0);
  // Phones and tablets: swipe or tap, a small bottom bar, no keyboard hints.
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, swiped: false };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t0 = touch.current;
    if (!t0) return;
    const dx = e.changedTouches[0].clientX - t0.x;
    const dy = e.changedTouches[0].clientY - t0.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      t0.swiped = true;
      const forward = lang === 'en' ? dx < 0 : dx > 0;
      if (forward) next();
      else prev();
    }
  };
  return (
    <div
      ref={rootRef}
      className={`grid min-h-dvh place-items-center bg-black text-white ${safe ? 'reduce-motion' : ''} ${narrow && !hide ? 'content-center gap-3 pb-16' : ''}`}
      dir={lang === 'en' ? 'ltr' : 'rtl'}
    >
      {/* Every slide is laid out at 1280 x 720 and scaled to the screen, so nothing is cut on a phone. */}
      <div
        ref={frameRef}
        className="relative overflow-hidden"
        style={{ width: narrow ? 'min(100vw, calc((100dvh - 72px) * 16 / 9))' : 'min(100vw, 177.78vh)', aspectRatio: '16 / 9' }}
        onClick={() => {
          if (touch.current?.swiped) {
            touch.current = null;
            return;
          }
          next();
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute top-0 flex flex-col overflow-hidden bg-gradient-to-br from-[#0B0B0B] via-[#121212] to-[#211A05]"
          style={{ width: STAGE_W, height: STAGE_H, fontSize: STAGE_W * 0.02, insetInlineStart: 0, transform: `scale(${scale})`, transformOrigin: lang === 'en' ? 'top left' : 'top right' }}
        >
        <header className="flex items-center gap-[0.6em] px-[1.2em] pt-[0.8em]">
          <span className="text-[0.8em] text-[#E0A800]">
            {i + 1} / {total}
          </span>
          <h1 key={scene.id} className="fade-up text-[1.6em] font-black">
            {L(scene.title)}
          </h1>
          {(auto || paused) && <span className="ms-auto rounded-full bg-white/10 px-[0.5em] text-[0.8em]">{paused ? translate(lang, 'show.paused') : translate(lang, 'show.auto')}</span>}
          {safe && <span className="rounded-full bg-white/10 px-[0.5em] text-[0.8em]">{translate(lang, 'show.safe')}</span>}
        </header>
        <div key={`b${scene.id}`} className="min-h-0 flex-1 overflow-hidden px-[1.2em] py-[0.6em]">
          {scene.body({ lang, tick })}
        </div>
        <footer className="bg-black/30 px-[1.2em] py-[0.4em]">
          <p key={`c${scene.id}`} className="fade-up text-[0.95em] leading-snug">
            {L(scene.caption)}
          </p>
        </footer>
        <div className="absolute inset-x-0 bottom-0 h-[0.18em] bg-white/10">
          <div className="h-full bg-[#E0A800] transition-[width]" style={{ width: `${((i + (auto ? elapsed / scene.sec : 0)) / total) * 100}%` }} />
        </div>
        </div>
      </div>
      {narrow && (
        <p className="px-4 text-center text-sm text-white/70">
          {translate(lang, 'show.swipe')}
          {portrait && <span className="block">{translate(lang, 'show.rotate')}</span>}
        </p>
      )}
      {!hide && (
        <div
          className={
            narrow
              ? 'fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 bg-black/90 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-sm [&_.btn]:min-h-10 [&_.btn]:border-0 [&_.btn]:bg-white/10 [&_.btn]:px-3 [&_.btn]:text-white'
              : 'fixed end-2 top-2 flex max-w-[46vw] flex-wrap items-center gap-2 rounded-2xl bg-black/70 px-3 py-2 text-base opacity-60 transition-opacity hover:opacity-100'
          }
        >
          <button className="btn min-h-11 px-3" onClick={prev} aria-label="Back">
            <Icon name="arrowLeft" />
          </button>
          <button className="btn min-h-11 px-3" onClick={() => (auto ? setPaused((p) => !p) : (setAuto(true), setPaused(false)))} aria-label="Play or pause">
            <Icon name={auto && !paused ? 'pause' : 'play'} />
          </button>
          <button className="btn min-h-11 px-3" onClick={next} aria-label="Next">
            <Icon name="arrowRight" />
          </button>
          {narrow ? (
            <span className="min-w-0 flex-1 truncate text-center text-white/70">
              {i + 1} / {total}
            </span>
          ) : (
            <>
              <span className="text-white/80">{translate(lang, 'show.controls')}</span>
              <span className="text-white/60">~{Math.round(totalSec / 30) / 2} min</span>
            </>
          )}
          <Link to="/demo" className="btn min-h-11 px-3">
            <Icon name="x" />
          </Link>
        </div>
      )}
    </div>
  );
}
