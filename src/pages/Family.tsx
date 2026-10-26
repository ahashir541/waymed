import { Link, useParams } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { Icon } from '../components/Icon.tsx';
import { OfflineSince, TokenStatusCard } from '../components/TokenStatus.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useHospital, useOnline, useToken } from '../lib/store.tsx';
import { resolveDestination, findRoute } from '../lib/route.ts';
import { placeName } from '../lib/directions.ts';
import { FACILITY_TYPES } from '../lib/types.ts';

/** Attendant companion: family follows the token from anywhere and sees what is nearby. */
export function Family() {
  const { id = '' } = useParams();
  const { t, lang } = usePrefs();
  const { data } = useHospital();
  const online = useOnline();
  const { view, missing, updatedAt } = useToken(id);
  const dept = view ? data.departments.find((d) => d.id === view.deptId) : null;
  const base = dept?.nodeId ?? 'waiting';

  return (
    <Layout visitor>
      <LanguageGate>
        <PageTitle icon="users" sub={t('family.lead')}>
          {t('family.title')}
        </PageTitle>
        <div className="grid gap-5">
          {missing && !view && (
            <p role="alert" className="glass rounded-3xl p-6 text-xl">
              {t('token.notFound')}
            </p>
          )}
          {view && (
            <>
              <OfflineSince online={online} updatedAt={updatedAt} />
              {/* The family page does not vibrate or speak: it is often far from the hospital. */}
              <TokenStatusCard view={view} data={data} announce={false} />
            </>
          )}
          <section className="glass rounded-3xl p-5" aria-labelledby="near-h">
            <h2 id="near-h" className="mb-3 text-2xl font-bold">
              {t('family.nearby')} {data.sample && <span className="text-base font-normal text-muted">· {t('common.sample')}</span>}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {FACILITY_TYPES.map((f) => {
                const node = resolveDestination(data, f, base);
                if (!node) return null;
                const r = findRoute(data, base, node);
                return (
                  <li key={f}>
                    <Link to={`/g/${f}?from=${base}`} className="flex items-center gap-3 rounded-2xl border border-line bg-solid/70 p-3 text-lg">
                      <Icon name={f} className="text-accent" size={28} />
                      <span className="flex-1">
                        <span className="block font-bold">{t(`facility.${f}`)}</span>
                        <span className="text-muted">
                          {placeName(data, node, lang)}
                          {r && r.meters > 5 ? ` · ${t('guide.distance', { m: r.meters })}` : ''}
                        </span>
                      </span>
                      <Icon name="arrowRight" className="rtl:rotate-180" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="flex items-start gap-2 rounded-2xl border border-line bg-solid/70 p-4 text-lg">
            <Icon name="users" className="mt-1 shrink-0 text-accent" /> {t('family.attendants')}
          </p>
        </div>
      </LanguageGate>
    </Layout>
  );
}
