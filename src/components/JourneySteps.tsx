import { useEffect, useState } from 'react';
import { Icon } from './Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';

const STEPS = [
  { id: 'gate', icon: 'entrance' },
  { id: 'slip', icon: 'ticket' },
  { id: 'map', icon: 'route' },
  { id: 'wait', icon: 'clock' },
  { id: 'turn', icon: 'bell' },
] as const;
type StepId = (typeof STEPS)[number]['id'];
const STEP_MS = 3600;

/** Small phone screen that acts out one step (decorative). */
function Scene({ id }: { id: StepId }) {
  const { t } = usePrefs();
  if (id === 'gate')
    return (
      <div className="grid gap-2">
        <p className="text-xs text-muted">{t('v.gate.title')}</p>
        {['English', 'اردو', 'سنڌي'].map((l, i) => (
          <span
            key={l}
            className={`js-pop rounded-xl border px-3 py-2 text-center text-sm font-bold ${i === 2 ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'}`}
            style={{ animationDelay: `${150 + i * 160}ms` }}
          >
            {l}
          </span>
        ))}
      </div>
    );
  if (id === 'slip')
    return (
      <div className="grid justify-items-center gap-2 text-center">
        <p className="text-xs text-muted">{t('v.slip.yours')}</p>
        <span className="js-pop ltr rounded-2xl border-2 border-dashed border-accent px-5 py-3 text-3xl font-black tabular-nums text-accent">24</span>
        <span className="js-pop flex items-center gap-1 text-xs text-muted" style={{ animationDelay: '350ms' }}>
          <Icon name="lock" size={12} className="text-accent" /> {t('v.slip.noData')}
        </span>
      </div>
    );
  if (id === 'map')
    return (
      <div className="grid gap-2">
        <svg viewBox="0 0 160 90" className="w-full" aria-hidden="true">
          <rect x="4" y="4" width="152" height="82" rx="10" className="fill-[var(--wm-plan-bg)] stroke-[var(--wm-line)]" />
          <path d="M20 72 H70 V30 H140" pathLength={1} className="js-path fill-none stroke-[var(--wm-accent)]" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="72" r="6" className="fill-[var(--wm-ink)]" />
          <circle cx="140" cy="30" r="7" className="js-pin fill-[var(--wm-accent)]" />
        </svg>
        <span className="js-pop flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-on-accent" style={{ animationDelay: '900ms' }}>
          <Icon name="arrowLeft" size={16} className="shrink-0" /> {t('v.map.next')}
        </span>
      </div>
    );
  if (id === 'wait')
    return (
      <div className="grid gap-2">
        <p className="text-xs text-muted">{t('v.wait.title')}</p>
        {[21, 22, 23, 24].map((n, i) => (
          <span
            key={n}
            className={`js-slide ltr flex items-center justify-between rounded-lg px-3 py-1.5 text-sm tabular-nums ${n === 24 ? 'bg-accent-soft font-black text-accent' : 'bg-surface text-muted'}`}
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <span>{n}</span>
            {n === 24 && <Icon name="user" size={14} />}
          </span>
        ))}
      </div>
    );
  return (
    <div className="js-turn grid justify-items-center gap-2 rounded-xl bg-[#1f9d55] p-4 text-center text-white">
      <Icon name="bell" size={28} className="js-ring" />
      <span className="text-base font-black">{t('v.turn.title')}</span>
      <span className="ltr text-2xl font-black tabular-nums">24</span>
    </div>
  );
}

/** "How it works": the visit as five animated steps, auto-playing; tap a step to jump to it. */
export function JourneySteps() {
  const { t } = usePrefs();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Start playing once the page has settled, so the first paint stays light.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(id);
  }, []);
  const playing = ready && !paused && !reduced;

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, playing]);

  const step = STEPS[active];
  return (
    <section aria-labelledby="how-h" className="overflow-hidden rounded-3xl border border-line bg-surface" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5 md:px-8 md:pt-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">{t('v.howTitle')}</p>
          <h2 id="how-h" className="mt-1 text-xl font-extrabold md:text-2xl">
            {t('v.journey.title')}
          </h2>
        </div>
      </div>

      {/* Track */}
      <ol className="relative mx-5 mt-6 grid grid-cols-5 md:mx-8">
        <span className="absolute inset-x-[10%] top-6 h-1 rounded-full bg-line" aria-hidden="true" />
        <span
          className="v-bar absolute start-[10%] top-6 h-1 w-[80%] rounded-full bg-accent"
          style={{ transform: `scaleX(${active / (STEPS.length - 1)})` }}
          aria-hidden="true"
        />
        {STEPS.map((s, i) => {
          const state = i < active ? 'done' : i === active ? 'now' : 'next';
          return (
            <li key={s.id} className="relative grid justify-items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
                aria-current={state === 'now' ? 'step' : undefined}
                aria-label={`${i + 1}. ${t(`v.ch.${s.id}`)}`}
                className={`relative grid size-12 place-items-center rounded-full border-2 transition-[transform,background-color,border-color] duration-300 ${
                  state === 'now' ? 'scale-110 border-accent bg-accent text-on-accent' : state === 'done' ? 'border-accent bg-surface text-accent' : 'border-line bg-surface text-muted'
                }`}
              >
                {state === 'now' && playing && <span className="js-ping absolute inset-0 rounded-full bg-accent" aria-hidden="true" />}
                <Icon name={state === 'done' ? 'check' : s.icon} size={20} className="relative" />
              </button>
              <span className={`text-center text-xs font-bold sm:text-sm ${state === 'next' ? 'text-muted' : ''}`}>{t(`v.ch.${s.id}`)}</span>
            </li>
          );
        })}
      </ol>

      {/* Stage */}
      <div className="mt-6 grid items-center gap-6 border-t border-line bg-[var(--wm-plan-bg)] p-5 md:grid-cols-[1fr_260px] md:p-8">
        <div key={step.id} className="v-enter" aria-live="polite">
          <p className="text-sm font-bold text-accent">
            {t('v.map.stepOf', { n: active + 1, total: STEPS.length })}
          </p>
          <p className="mt-1 text-2xl font-extrabold">{t(`v.ch.${step.id}`)}</p>
          <p className="mt-2 max-w-md text-lg leading-relaxed text-muted">{t(`v.journey.${step.id}`)}</p>
          <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden="true">
            {playing && <span key={active} className="js-timer block h-full w-full rounded-full bg-accent" style={{ animationDuration: `${STEP_MS}ms` }} />}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[240px] rounded-[28px] border-4 border-[var(--wm-ink)]/80 bg-bg p-3 shadow-sm" aria-hidden="true">
          <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-line" />
          <div key={step.id} className="v-enter min-h-[170px]">
            <Scene id={step.id} />
          </div>
        </div>
      </div>
    </section>
  );
}
