import { Icon } from './Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { BUILT_BY, RAW_IDEA, STORY_STEPS, TEAM_MEMBERS } from '../data/story.ts';

/** Home page: who we are, where we went, which HMW we chose, the raw idea, and that it became this app. */
export function StorySection() {
  const { t, L } = usePrefs();
  return (
    <section aria-labelledby="story-h" className="rounded-3xl border border-line bg-surface p-5 md:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-accent">{t('v.story.eyebrow')}</p>
      <h2 id="story-h" className="mt-1 text-xl font-extrabold md:text-2xl">
        {t('v.story.title')}
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-muted">{t('v.story.team')}:</span>
        {TEAM_MEMBERS.map((m) => (
          <span key={m} className="ltr rounded-full border border-line bg-white/5 px-3 py-1 text-sm font-semibold">
            {m}
          </span>
        ))}
      </div>

      <ol className="mt-6 grid gap-3 md:grid-cols-5">
        {STORY_STEPS.map((s, i) => (
          <li key={i} className={`relative rounded-2xl border p-4 ${i === STORY_STEPS.length - 1 ? 'border-accent/50 bg-accent-soft' : 'border-line bg-[#111]'}`}>
            <span className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="text-xs font-bold text-accent">{i + 1}</span>
            </span>
            <p className="mt-3 font-display font-extrabold leading-snug">{L(s.title)}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{L(s.text)}</p>
          </li>
        ))}
      </ol>

      <figure className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <blockquote className="-rotate-[0.6deg] rounded-xl bg-[#fdf6d8] px-5 py-4 text-[#1b1b1b] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8a6d00]">{t('v.story.raw')}</p>
          <p className="font-hand mt-1 text-[1.45rem] leading-snug">{L(RAW_IDEA)}</p>
        </blockquote>
        <figcaption className="grid gap-1">
          <span className="flex items-center gap-2 font-semibold text-accent">
            <Icon name="arrowRight" size={18} className="shrink-0 rtl:rotate-180" /> {t('v.story.then')}
          </span>
          <span className="text-sm text-muted">
            {t('v.story.builtBy')} <span className="ltr font-bold text-ink">{BUILT_BY}</span>
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
