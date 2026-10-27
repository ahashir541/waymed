import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptBadge } from '../components/DeptMark.tsx';
import { FloorPlan } from '../components/FloorPlan.tsx';
import { JourneySteps } from '../components/JourneySteps.tsx';
import { StorySection } from '../components/StorySection.tsx';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useHospital, useQueues, useStore } from '../lib/store.tsx';
import { findRoute } from '../lib/route.ts';
import { chapterPath, endVisit, startVisit, useVisit } from '../lib/visit.ts';

/** Animated plan: replays the route from the gate to each department in turn (decorative, drawn when idle). */
function HeroPlan() {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const targets = data.departments.filter((d) => !d.isEmergency);
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(() => setReady(true), { timeout: 2500 });
    else setTimeout(() => setReady(true), 1200);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setI((n) => n + 1), 4500);
    return () => clearInterval(id);
  }, []);
  const dept = targets[i % Math.max(1, targets.length)];
  const route = useMemo(() => (dept ? findRoute(data, 'entrance', dept.nodeId) : null), [data, dept]);
  const gate = L(data.landmarks.find((l) => l.id === 'entrance')?.name);
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-[var(--wm-plan-bg)]" aria-hidden="true">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          <Icon name="route" size={16} className="shrink-0 text-accent" />
          <span className="truncate">
            {gate} → {dept ? L(dept.name) : ''}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">{t('v.demoData')}</span>
      </div>
      <div className="p-2">{ready ? <FloorPlan data={data} route={route} routeColor={dept?.color} drawKey={i} /> : <div className="aspect-[1000/640] w-full" />}</div>
    </div>
  );
}

const TOP_DEPTS = ['medicine', 'paediatrics', 'lab'];

function QuickCard({ to, icon, title, sub, tone }: { to: string; icon: string; title: string; sub?: string; tone?: 'danger' }) {
  return (
    <Link to={to} className={`vtile group flex h-full items-center gap-2.5 rounded-2xl border p-3 sm:items-start sm:gap-3 sm:p-4 ${tone === 'danger' ? 'border-[#D92D20]/40 bg-[#D92D20]/10' : 'border-line bg-surface'}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl sm:size-10 ${tone === 'danger' ? 'bg-[#D92D20] text-white' : 'bg-accent-soft text-accent'}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-bold leading-snug [overflow-wrap:normal] sm:text-base">{title}</span>
        {sub && <span className="mt-0.5 line-clamp-2 hidden text-sm text-muted sm:block">{sub}</span>}
      </span>
      <Icon name="arrowRight" size={16} className="mt-1 hidden shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180 sm:block" />
    </Link>
  );
}

export function Home() {
  const { t, L } = usePrefs();
  // The animated plan is decoration: phones skip it entirely (it is not just hidden).
  const [wideScreen] = useState(() => matchMedia('(min-width: 768px)').matches);
  const navigate = useNavigate();
  const visit = useVisit();
  const { data } = useHospital();
  const { queues } = useQueues();
  const { demo } = useStore();
  // Shown once after "Finish visit".
  const [ended] = useState(() => {
    const v = safeStorage.get('wm_visit_ended', true) === '1';
    safeStorage.set('wm_visit_ended', null, true);
    return v;
  });
  const sectionTitle = 'mb-4 text-sm font-bold uppercase tracking-wide text-muted';

  return (
    <Layout visitor wide>
      <div className="mx-auto grid max-w-6xl gap-9 sm:gap-12 lg:gap-16">
        {/* Hero */}
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <div className="v-stagger grid gap-5">
            {ended && (
              <p role="status" className="flex items-start gap-2 rounded-2xl border border-[#3ccf7a]/40 bg-[#3ccf7a]/10 p-3 text-sm">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" /> {t('v.turn.ended')}
              </p>
            )}
            <p className="flex w-fit items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
              <Icon name="building" size={16} className="shrink-0 text-accent" />
              <span className="font-semibold">{L(data.hospital.name)}</span>
              {data.hospital.address && <span className="hidden text-muted md:inline">· {L(data.hospital.address)}</span>}
            </p>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-accent">{t('v.home.eyebrow')}</p>
              <h1 className="mt-2 max-w-[22ch] text-[1.75rem] font-extrabold leading-[1.15] lg:text-[2.125rem]">{t('v.focus')}</h1>
              <p className="mt-3 max-w-md text-lg text-muted">{t('v.home.sub')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {visit ? (
                <button className="vbtn v-glow sm:col-span-2" onClick={() => navigate(chapterPath(visit.chapter))}>
                  <Icon name="play" size={20} className="shrink-0" />
                  <span className="whitespace-nowrap">{t('v.resume')}</span>
                  {visit.label && <span className="ltr shrink-0 whitespace-nowrap rounded-full bg-black/15 px-2 py-0.5 text-sm font-black">{visit.label}</span>}
                </button>
              ) : (
                <button
                  className="vbtn v-glow"
                  onClick={() => {
                    startVisit();
                    navigate(chapterPath('gate'));
                  }}
                >
                  <Icon name="entrance" size={20} /> {t('v.atGate')}
                </button>
              )}
              <button className="vbtn-2" onClick={() => navigate('/tour')}>
                <Icon name="play" size={18} className="text-accent" /> {t('v.tour')}
              </button>
            </div>
            {visit && (
              <button
                className="w-fit text-sm text-muted underline hover:text-ink"
                onClick={() => {
                  endVisit();
                  startVisit();
                  navigate(chapterPath('gate'));
                }}
              >
                {t('v.newVisit')}
              </button>
            )}
            <p className="flex items-start gap-2 text-sm text-muted">
              <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-accent" /> {t('home.privacy')}
            </p>
          </div>
          {wideScreen && <HeroPlan />}
        </section>

        <JourneySteps />

        <StorySection />

        {/* Quick actions */}
        <section aria-labelledby="quick-h">
          <h2 id="quick-h" className={sectionTitle}>
            {t('v.home.quick')}
          </h2>
          <div className="grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            <QuickCard to="/g" icon="pin" title={t('v.map.title')} />
            <QuickCard to="/emergency" icon="siren" title={t('emergency.title')} tone="danger" />
            <QuickCard to="/book" icon="calendar" title={t('home.book')} />
            <QuickCard to="/prepare" icon="check" title={t('home.prepare')} />
            <QuickCard to="/assistant" icon="mic" title={t('v.more.assistant')} />
            <QuickCard to="/followup" icon="clipboard" title={t('home.followup')} />
          </div>
        </section>

        {/* Departments with today's queue */}
        <section aria-labelledby="dept-h">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 id="dept-h" className="text-sm font-bold uppercase tracking-wide text-muted">
              {t('v.home.depts')} <span className="normal-case text-accent">· {demo || data.sample ? t('v.demoData') : t('v.home.live')}</span>
            </h2>
            <Link to="/g" className="text-sm font-semibold text-accent hover:underline">
              {t('v.home.allDepts')} →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.departments.map((d) => {
              const q = queues[d.id];
              // Phones show the three most used departments; the rest are one tap away on the Map tab.
              const top = TOP_DEPTS.includes(d.id);
              return (
                <Link key={d.id} to={`/g/${d.id}`} className={`vtile flex-col gap-3 rounded-2xl border border-line bg-surface p-4 ${top ? 'flex' : 'hidden sm:flex'}`}>
                  <span className="flex items-center gap-3">
                    <DeptBadge dept={d} size={36} />
                    <span className="min-w-0 font-bold leading-snug">{L(d.name)}</span>
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2 text-sm">
                    <span className="text-muted">{t('v.home.nowServing')}</span>
                    <span className="ltr font-black tabular-nums">{q?.nowServing?.label ?? '—'}</span>
                  </span>
                  <span className="-mt-2 text-xs text-muted">{t('v.home.waiting', { n: q?.waiting ?? 0 })}</span>
                </Link>
              );
            })}
          </div>
          <Link to="/g" className="vbtn-2 mt-3 sm:hidden">
            {t('v.home.seeAll', { n: data.departments.length })} <Icon name="arrowRight" size={16} className="rtl:rotate-180" />
          </Link>
        </section>

        {/* Hours and help */}
        <section aria-labelledby="hours-h" className="grid gap-3 md:grid-cols-3">
          <h2 id="hours-h" className="sr-only">
            {t('v.home.visit')}
          </h2>
          <div className="rounded-2xl border border-line bg-surface p-5 md:col-span-2">
            <p className="flex items-center gap-2 font-bold">
              <Icon name="clock" size={18} className="text-accent" /> {t('prepare.hours')}
            </p>
            <p className="mt-2 text-muted">{L(data.hospital.openHours)}</p>
          </div>
          <Link to="/emergency" className="vtile flex flex-col justify-between gap-3 rounded-2xl border border-[#D92D20]/40 bg-[#D92D20]/10 p-5">
            <span className="flex items-center gap-2 font-bold text-danger">
              <Icon name="siren" size={18} /> {t('emergency.title')} · 24h
            </span>
            <span className="text-sm">{t('emergency.callStaff')}</span>
          </Link>
        </section>

        <footer className="flex items-start gap-2 border-t border-line pt-6 text-sm text-muted">
          <img src="/icon.svg" alt="" width={20} height={20} className="mt-0.5 rounded-md" /> {t('v.home.footer')}
        </footer>
      </div>
    </Layout>
  );
}
