import { Link } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { VTitle } from '../components/VisitorShell.tsx';
import { Icon } from '../components/Icon.tsx';
import { FacilityGrid } from '../components/FacilityGrid.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useHospital } from '../lib/store.tsx';
import { currentPlace } from '../lib/place.ts';
import { placeName } from '../lib/directions.ts';

// Lengths of the two demos, rounded to half a minute (the tour and the presenter show).
export const TOUR_MIN = 3.5;
export const SHOW_MIN = 4;

function Row({ to, icon, label, sub }: { to: string; icon: string; label: string; sub?: string }) {
  return (
    <Link to={to} className="vtile flex min-h-[60px] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {sub && <span className="line-clamp-2 block text-sm text-muted">{sub}</span>}
      </span>
      <Icon name="arrowRight" size={18} className="shrink-0 text-muted rtl:rotate-180" />
    </Link>
  );
}

export default function More() {
  const { t, lang } = usePrefs();
  const { data } = useHospital();
  const from = currentPlace();
  return (
    <Layout visitor>
      <VTitle>{t('v.more.title')}</VTitle>
      <section aria-labelledby="fac-h" className="mb-5">
        <h2 id="fac-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          {t('v.more.facilities')} {data.sample && <span className="normal-case text-accent">· {t('v.demoData')}</span>}
        </h2>
        <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="pin" size={14} className="shrink-0 text-accent" /> {t('guide.youAreAt')}: {placeName(data, from, lang)}
        </p>
        <FacilityGrid data={data} from={from} />
      </section>
      <div className="grid gap-2">
        <Row to="/book" icon="calendar" label={t('v.more.book')} sub={t('book.window')} />
        <Row to="/assistant" icon="mic" label={t('v.more.assistant')} sub={t('assistant.label')} />
        <Row to="/followup" icon="clipboard" label={t('v.more.followup')} sub={t('followup.lead')} />
        <Row to="/prepare" icon="check" label={t('v.more.prepare')} sub={t('prepare.b1')} />
        <Row to="/tour" icon="play" label={t('v.tour')} sub={t('v.more.tourSub', { min: TOUR_MIN })} />
        <Row to="/demo/walk" icon="users" label={t('v.more.walk')} sub={t('v.more.walkSub')} />
        <Row to="/demo/show" icon="monitor" label={t('v.more.show')} sub={t('v.more.showSub', { min: SHOW_MIN })} />
      </div>
    </Layout>
  );
}
