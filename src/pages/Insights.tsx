import { useEffect, useState, type ReactNode } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { RequireStaff, StaffBar } from '../components/RequireStaff.tsx';
import { FloorPlan } from '../components/FloorPlan.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useBackend, useHospital, useStore } from '../lib/store.tsx';
import type { Insights as Data, KeyCount } from '../lib/backend/types.ts';
import { LANG_NAMES } from '../lib/i18n/core.ts';
import type { Lang } from '../lib/types.ts';

const sum = (l: KeyCount[]) => l.reduce((s, x) => s + x.count, 0);

/** Every number shown here is a real count from anonymous events, or "Not enough data yet". */
function Card({ title, n, minN, children }: { title: string; n: number; minN: number; children: ReactNode }) {
  const { t } = usePrefs();
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-3 flex items-center justify-between gap-2 text-xl font-bold">
        {title} <span className="text-base font-normal text-muted">{t('insights.n', { n })}</span>
      </h2>
      {n < minN ? (
        <p className="flex items-center gap-2 text-lg text-muted">
          <Icon name="clock" /> {t('insights.notEnough')}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function Bars({ items, label, unit = '' }: { items: { key: string; value: number }[]; label: (k: string) => ReactNode; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.key} className="grid grid-cols-[minmax(7rem,auto)_1fr_auto] items-center gap-3">
          <span className="truncate">{label(i.key)}</span>
          <span className="h-4 rounded-full bg-accent-soft">
            <span className="block h-4 rounded-full bg-accent" style={{ width: `${(i.value / max) * 100}%` }} />
          </span>
          <span className="ltr font-bold tabular-nums">
            {i.value}
            {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

function InsightsInner() {
  const { t, L } = usePrefs();
  const backend = useBackend();
  const { demo } = useStore();
  const { data } = useHospital();
  const [days, setDays] = useState(30);
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    backend
      .insights(days)
      .then(setD)
      .catch(() => setError(true));
  }, [backend, days]);
  if (error) return <p className="text-xl">{t('common.error')}</p>;
  if (!d) return <p className="text-xl text-muted">{t('common.loading')}</p>;

  const deptName = (k: string) => {
    const dep = data.departments.find((x) => x.id === k);
    return dep ? (
      <span className="inline-flex items-center gap-2">
        <DeptMark dept={dep} size={24} /> {L(dep.name)}
      </span>
    ) : (
      k
    );
  };
  const placeName = (k: string) => L(data.landmarks.find((l) => l.id === k)?.name) || k;
  const fbTotal = d.feedback.yes + d.feedback.no;
  const lostTotal = sum(d.lostByLandmark);
  const waitN = d.avgWaitByDept.reduce((s, x) => s + x.n, 0);
  const langTotal = sum(d.languages);

  // Rule-based suggestions, only when the data supports them.
  const recs: string[] = [];
  if (lostTotal >= d.minN && d.lostByLandmark[0]) recs.push(t('insights.recLost', { place: placeName(d.lostByLandmark[0].key) }));
  const waitTop = d.avgWaitByDept.find((x) => x.n >= d.minN);
  if (waitTop) recs.push(t('insights.recWait', { dept: L(data.departments.find((x) => x.id === waitTop.key)?.name) || waitTop.key }));
  if (fbTotal >= 10 && d.feedback.yes / fbTotal < 0.8) recs.push(t('insights.recFtr'));
  const nonEn = d.languages.filter((x) => x.key !== 'en').sort((a, b) => b.count - a.count)[0];
  if (langTotal >= 20 && nonEn && nonEn.count / langTotal >= 0.3) recs.push(t('insights.recLang', { lang: LANG_NAMES[nonEn.key as Lang] ?? nonEn.key }));

  return (
    <>
      <PageTitle icon="chart" sub={t('insights.lead')}>
        {t('insights.title')}
      </PageTitle>
      {demo && <p className="mb-4 rounded-2xl bg-amber-300 p-3 font-bold text-black">{t('demo.banner')}</p>}
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((n) => (
          <button key={n} className={`chip ${days === n ? 'bg-accent text-on-accent' : ''}`} aria-pressed={days === n} onClick={() => setDays(n)}>
            {t('insights.range', { n })}
          </button>
        ))}
        {backend.insightsCsvUrl(days) && (
          <a className="btn ms-auto" href={backend.insightsCsvUrl(days)!} download>
            <Icon name="copy" /> {t('insights.csv')}
          </a>
        )}
      </div>

      <section className="glass mb-5 rounded-3xl p-5">
        <h2 className="mb-3 text-xl font-bold">{t('insights.recs')}</h2>
        {recs.length ? (
          <ul className="grid gap-2 text-lg">
            {recs.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <Icon name="flag" className="mt-1 shrink-0 text-accent" /> {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t('insights.noRecs')}</p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={t('insights.ftr')} n={fbTotal} minN={d.minN}>
          <p className="text-5xl font-black">{Math.round((d.feedback.yes / Math.max(1, fbTotal)) * 100)}%</p>
          <p className="text-lg text-muted">{t('insights.ftrDetail', { yes: d.feedback.yes, total: fbTotal })}</p>
        </Card>
        <Card title={t('insights.avgWait')} n={waitN} minN={d.minN}>
          <Bars items={d.avgWaitByDept.map((x) => ({ key: x.key, value: Math.round(x.avgSec / 60) }))} label={deptName} unit=" min" />
        </Card>
        <Card title={t('insights.tokens')} n={sum(d.tokensByDept)} minN={d.minN}>
          <Bars items={d.tokensByDept.map((x) => ({ key: x.key, value: x.count }))} label={deptName} />
        </Card>
        <Card title={t('insights.channels')} n={sum(d.channels)} minN={d.minN}>
          <Bars items={d.channels.map((x) => ({ key: x.key, value: x.count }))} label={(k) => k} />
        </Card>
        <Card title={t('insights.languages')} n={langTotal} minN={d.minN}>
          <Bars items={d.languages.map((x) => ({ key: x.key, value: x.count }))} label={(k) => LANG_NAMES[k as Lang] ?? k} />
        </Card>
        <Card title={t('insights.hours')} n={d.hours.reduce((s, h) => s + h.count, 0)} minN={d.minN}>
          <div className="flex h-40 items-end gap-1" role="img" aria-label={d.hours.filter((h) => h.count).map((h) => `${h.hour}:00 ${h.count}`).join(', ')}>
            {d.hours.slice(6, 22).map((h) => {
              const max = Math.max(1, ...d.hours.map((x) => x.count));
              return (
                <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-accent" style={{ height: `${(h.count / max) * 120}px` }} />
                  <span className="ltr text-base text-muted">{h.hour}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <div className="lg:col-span-2">
          <Card title={t('insights.lost')} n={lostTotal} minN={d.minN}>
            <FloorPlan data={data} heat={Object.fromEntries(d.lostByLandmark.map((x) => [x.key, x.count]))} title={t('insights.lost')} />
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Insights() {
  return (
    <Layout wide>
      <RequireStaff roles={['admin']}>
        {(user, _d, logout) => (
          <>
            <StaffBar user={user} logout={logout} />
            <InsightsInner />
          </>
        )}
      </RequireStaff>
    </Layout>
  );
}
