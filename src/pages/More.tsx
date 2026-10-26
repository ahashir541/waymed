import { Link } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { VTitle } from '../components/VisitorShell.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { FACILITY_TYPES } from '../lib/types.ts';
import { resolveDestination } from '../lib/route.ts';
import { placeName } from '../lib/directions.ts';
import type { DictKey } from '../lib/i18n/core.ts';

function Row({ to, icon, label, sub }: { to: string; icon: string; label: string; sub?: string }) {
  return (
    <Link to={to} className="vtile flex min-h-[60px] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
      <Icon name="arrowRight" size={18} className="text-muted rtl:rotate-180" />
    </Link>
  );
}

export default function More() {
  const { t, lang } = usePrefs();
  const { data } = useHospital();
  return (
    <Layout visitor>
      <VTitle>{t('v.more.title')}</VTitle>
      <section aria-labelledby="fac-h" className="mb-5">
        <h2 id="fac-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          {t('v.more.facilities')} {data.sample && <span className="normal-case text-accent">· {t('v.demoData')}</span>}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {FACILITY_TYPES.map((f) => {
            const node = resolveDestination(data, f, 'entrance');
            return (
              <Link key={f} to={`/g/${f}`} className="vtile flex items-center gap-2 rounded-2xl border border-line bg-surface p-3">
                <Icon name={f} size={20} className="shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{t(`facility.${f}` as DictKey)}</span>
                  {node && <span className="block truncate text-xs text-muted">{placeName(data, node, lang)}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <div className="grid gap-2">
        <Row to="/book" icon="calendar" label={t('v.more.book')} sub={t('book.window')} />
        <Row to="/assistant" icon="mic" label={t('v.more.assistant')} sub={t('assistant.label')} />
        <Row to="/followup" icon="clipboard" label={t('v.more.followup')} sub={t('followup.lead')} />
        <Row to="/prepare" icon="check" label={t('v.more.prepare')} />
        <Row to="/tour" icon="play" label={t('v.tour')} />
        <Row to="/demo/walk" icon="users" label={t('v.more.walk')} />
        <Row to="/demo/show" icon="monitor" label={t('v.more.show')} />
      </div>
    </Layout>
  );
}
