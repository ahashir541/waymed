import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { RouteView } from '../components/RouteView.tsx';
import { DeptBadge, DeptMark } from '../components/DeptMark.tsx';
import { Icon } from '../components/Icon.tsx';
import { currentPlace } from '../lib/place.ts';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend, useHospital } from '../lib/store.tsx';
import { FACILITY_TYPES, type HospitalData } from '../lib/types.ts';

/** "Where do you want to go?" cards: departments (shape + icon + letter + name) and facilities. */
export function DestinationCards({ data, from, big, onPick }: { data: HospitalData; from: string; big?: boolean; onPick?: (dest: string) => void }) {
  const { t, L } = usePrefs();
  const href = (d: string) => `/g/${d}?from=${from}`;
  // Kiosk screens keep their large touch targets; the web app uses calm, readable cards.
  const deptCard = big
    ? 'glass fade-up flex min-h-28 items-center gap-4 rounded-3xl p-4 text-3xl font-bold'
    : 'vtile group flex min-h-[76px] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-start';
  const facCard = big
    ? 'chip min-h-16 justify-center text-lg'
    : 'vtile flex min-h-[60px] items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-start';
  const deptInner = (d: HospitalData['departments'][number]) =>
    big ? (
      <>
        <DeptMark dept={d} size={72} />
        <span className="text-start">{L(d.name)}</span>
      </>
    ) : (
      <>
        <DeptBadge dept={d} size={40} />
        <span className="min-w-0 flex-1 font-bold leading-snug">{L(d.name)}</span>
        <Icon name="arrowRight" size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </>
    );
  const facInner = (f: (typeof FACILITY_TYPES)[number]) => (
    <>
      <span className={big ? '' : 'grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft'}>
        <Icon name={f} size={big ? 24 : 18} className="shrink-0 text-accent" />
      </span>
      <span className={big ? '' : 'text-sm font-semibold leading-tight'}>{t(`facility.${f}`)}</span>
    </>
  );
  return (
    <div className="grid gap-7">
      <section aria-labelledby="dep-h">
        <h2 id="dep-h" className={big ? 'mb-3 text-xl font-bold text-muted' : 'mb-3 text-sm font-bold uppercase tracking-wide text-muted'}>
          {t('guide.departments')}
        </h2>
        <div className={`v-stagger grid gap-3 ${big ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {data.departments.map((d) =>
            onPick ? (
              <button key={d.id} className={deptCard} onClick={() => onPick(d.id)}>
                {deptInner(d)}
              </button>
            ) : (
              <Link key={d.id} to={href(d.id)} className={deptCard}>
                {deptInner(d)}
              </Link>
            ),
          )}
        </div>
      </section>
      <section aria-labelledby="fac-h">
        <h2 id="fac-h" className={big ? 'mb-3 text-xl font-bold text-muted' : 'mb-3 text-sm font-bold uppercase tracking-wide text-muted'}>
          {t('guide.facilities')} {data.sample && <span className="font-normal normal-case text-accent">· {t('v.demoData')}</span>}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FACILITY_TYPES.filter((f) => data.facilities.some((x) => x.type === f)).map((f) =>
            onPick ? (
              <button key={f} className={facCard} onClick={() => onPick(f)}>
                {facInner(f)}
              </button>
            ) : (
              <Link key={f} to={href(f)} className={facCard}>
                {facInner(f)}
              </Link>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

export function GuideHome() {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const [q] = useSearchParams();
  const backend = useBackend();
  const from = q.get('from') && data.landmarks.some((l) => l.id === q.get('from')) ? q.get('from')! : currentPlace();
  useEffect(() => {
    if (q.get('src') === 'qr') backend.logEvent({ type: 'qr_scanned', channel: 'phone', landmarkId: from });
  }, [q, backend, from]);
  return (
    <Layout visitor wide>
      <LanguageGate>
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold">{t('guide.whereTitle')}</h1>
          <p className="mb-6 mt-1 flex items-center gap-1.5 text-muted">
            <Icon name="pin" size={16} className="text-accent" /> {t('guide.youAreAt')}: {L(data.landmarks.find((l) => l.id === from)?.name)}
          </p>
          <DestinationCards data={data} from={from} />
        </div>
      </LanguageGate>
    </Layout>
  );
}

export function GuideRoute() {
  const { t } = usePrefs();
  const { dest = '' } = useParams();
  const [q] = useSearchParams();
  const { data } = useHospital();
  const fromQ = q.get('from');
  const from = fromQ && data.landmarks.some((l) => l.id === fromQ) ? fromQ : currentPlace();
  useEffect(() => {
    if (fromQ && data.landmarks.some((l) => l.id === fromQ)) safeStorage.set('wm_here', fromQ, true);
  }, [fromQ, data.landmarks]);
  return (
    <Layout visitor wide>
      <LanguageGate>
        <Link to={`/g?from=${from}`} className="no-print mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <Icon name="arrowLeft" size={16} className="rtl:rotate-180" /> {t('guide.other')}
        </Link>
        <RouteView data={data} from={from} dest={dest} />
      </LanguageGate>
    </Layout>
  );
}
