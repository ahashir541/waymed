import { useEffect, useState } from 'react';
import { LANGS, type Lang } from '../lib/types.ts';
import { translate } from '../lib/i18n/core.ts';
import { useAllLanguages } from '../lib/prefs.tsx';
import { useHospital, useOnline, useQueues, useStore, useTick } from '../lib/store.tsx';
import { fmtTime } from '../lib/slots.ts';
import { demoTick } from '../lib/backend/demo.ts';
import { DeptMark } from '../components/DeptMark.tsx';
import { FlipText } from '../components/FlipText.tsx';
import { StatusBanners } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';

/** Entrance display: all departments in three languages, now-serving numbers that flip, rotating headings. */
export default function Board() {
  useAllLanguages();
  const { data } = useHospital();
  const { queues, updatedAt } = useQueues();
  const online = useOnline();
  const { backend, demo } = useStore();
  const [li, setLi] = useState(0);
  useTick(1000);
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
    const id = setInterval(() => setLi((n) => n + 1), 8000);
    return () => clearInterval(id);
  }, []);
  // Exhibition only: keep the demo board moving.
  useEffect(() => {
    if (!demo) return;
    const id = setInterval(() => demoTick(backend, data.departments.map((d) => d.id)), 9000);
    return () => clearInterval(id);
  }, [demo, backend, data.departments]);

  const lang: Lang = LANGS[li % 3];
  const tr = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(lang, k, v);
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const nextAll = data.departments.flatMap((d) => (queues[d.id]?.nextLabels ?? []).slice(0, 2));

  return (
    <div dir="ltr" lang="en" className="min-h-dvh bg-[#050d1c] text-white" style={{ fontSize: 'clamp(18px, 1.6vw, 40px)' }}>
      <StatusBanners />
      <header className="flex items-center gap-4 border-b border-white/10 px-[2vw] py-[1.2vh]">
        <img src="/icon.svg" alt="" className="size-[3.2em] rounded-2xl" />
        <div className="leading-tight">
          <p className="text-[1.6em] font-black">WayMed</p>
          <p className="opacity-80">{data.hospital.name.en}</p>
        </div>
        <p key={lang} lang={lang} dir={dir} className="fade-up ms-auto text-[2em] font-bold text-teal-300">
          {tr('board.nowServing')}
        </p>
        <p className="ltr ms-[2vw] text-[2em] font-black tabular-nums">{fmtTime(Date.now())}</p>
      </header>
      {!online && updatedAt && (
        <p role="status" className="bg-slate-700 px-[2vw] py-2 text-center font-semibold">
          {translate('en', 'board.offline', { time: fmtTime(updatedAt) })} · <span lang="ur">{translate('ur', 'board.offline', { time: fmtTime(updatedAt) })}</span>
        </p>
      )}
      <main className="grid gap-[1.2vh] px-[2vw] py-[2vh] pb-[9vh] lg:grid-cols-2">
        {data.departments.map((d) => {
          const q = queues[d.id];
          return (
            <section key={d.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-[2vw] rounded-[1.2em] border border-white/10 bg-white/[0.04] px-[1.5vw] py-[1.2vh]" style={{ borderInlineStart: `0.5em solid ${d.color}` }}>
              <DeptMark dept={d} size={84} />
              <div className="min-w-0">
                <p className="text-[2.1em] font-extrabold leading-tight">{d.name.en}</p>
                <p className="flex flex-wrap gap-x-[1.5em] text-[1.6em] leading-snug opacity-90">
                  <span lang="ur" dir="rtl">
                    {d.name.ur}
                  </span>
                  <span lang="sd" dir="rtl">
                    {d.name.sd}
                  </span>
                </p>
                <p key={`${d.id}${lang}`} lang={lang} dir={dir} className="fade-up mt-1 opacity-75">
                  {q ? tr('board.waiting', { n: q.waiting }) : '—'}
                  {q?.nextLabels.length ? ` · ${tr('board.next')}: ` : ''}
                  <span className="ltr">{q?.nextLabels.join('  ')}</span>
                </p>
              </div>
              <div className="text-[4.2em] font-black leading-none">
                <FlipText text={q?.nowServing?.label ?? '---'} length={7} />
              </div>
            </section>
          );
        })}
      </main>
      <footer className="fixed inset-x-0 bottom-0 flex items-center gap-[2vw] overflow-hidden border-t border-white/10 bg-[#0b1e3f] px-[2vw] py-[1.2vh]">
        <span key={lang} lang={lang} dir={dir} className="fade-up shrink-0 rounded-full bg-amber-300 px-4 py-1 text-[1.3em] font-black text-black">
          {tr('board.next')}
        </span>
        <p className="ltr truncate text-[1.6em] font-bold tracking-wider">{nextAll.join('   ·   ') || '—'}</p>
        <span className="ms-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-[#b91c1c] px-4 py-1 text-[1.2em] font-black">
          <Icon name="siren" /> {translate('en', 'emergency.title')} · <span lang="ur">{translate('ur', 'emergency.title')}</span> · <span lang="sd">{translate('sd', 'emergency.title')}</span>
        </span>
      </footer>
    </div>
  );
}
