import { Layout, PageTitle } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { Icon } from '../components/Icon.tsx';
import { ShareButton } from '../components/TokenStatus.tsx';
import { ListenButton } from '../components/RouteView.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';

export function Prepare() {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const bring = [t('prepare.b1'), t('prepare.b2'), t('prepare.b3'), t('prepare.b4')];
  const steps = [t('prepare.s1'), t('prepare.s2'), t('prepare.s3'), t('prepare.s4')];
  return (
    <Layout visitor>
      <LanguageGate>
        <PageTitle icon="check">{t('prepare.title')}</PageTitle>
        <div className="mb-5 flex flex-wrap gap-2">
          <ShareButton url={`${location.origin}/prepare`} title={t('prepare.share')} text={t('prepare.title')} />
          <ListenButton texts={[t('prepare.bring'), ...bring, t('prepare.arrive'), ...steps]} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <section className="glass rounded-3xl p-5" aria-labelledby="bring-h">
            <h2 id="bring-h" className="mb-3 text-2xl font-bold">
              {t('prepare.bring')}
            </h2>
            <ul className="grid gap-3 text-lg">
              {bring.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon name={['clipboard', 'water', 'monitor', 'users'][i] ?? 'check'} className="mt-1 shrink-0 text-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
          <section className="glass rounded-3xl p-5" aria-labelledby="arr-h">
            <h2 id="arr-h" className="mb-3 text-2xl font-bold">
              {t('prepare.arrive')}
            </h2>
            <ol className="grid gap-3 text-lg">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-bold text-on-accent">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
          <section className="glass rounded-3xl p-5 md:col-span-2" aria-labelledby="hrs-h">
            <h2 id="hrs-h" className="mb-3 text-2xl font-bold">
              {t('prepare.hours')}
            </h2>
            <p className="mb-3 text-lg">{L(data.hospital.openHours)}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {data.departments.map((d) => (
                <li key={d.id} className="flex items-center gap-3 text-lg">
                  <DeptMark dept={d} size={36} />
                  <span className="font-semibold">{L(d.name)}</span>
                  <span className="text-muted">{L(d.openHours)}</span>
                </li>
              ))}
            </ul>
            {data.sample && <p className="mt-3 font-semibold text-warn">{t('common.sample')}</p>}
          </section>
        </div>
        <p className="mt-5 rounded-2xl bg-[#b91c1c] p-4 text-xl font-bold text-white">
          <Icon name="siren" className="me-2 inline" />
          {t('prepare.emergencyNote')}
        </p>
      </LanguageGate>
    </Layout>
  );
}
