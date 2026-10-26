import { Link } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { resetDemo } from '../lib/backend/demo.ts';

export default function DemoHub() {
  const { t } = usePrefs();
  // Visitor-facing: no links to staff, desk, board or admin screens.
  const tiles: [string, string, string][] = [
    ['/tour', 'play', t('v.tour')],
    ['/demo/walk', 'users', t('demo.walk')],
    ['/demo/show', 'monitor', t('demo.show')],
    ['/', 'route', t('demo.visitor')],
  ];
  return (
    <Layout visitor>
      <PageTitle icon="play" sub={t('demo.lead')}>
        {t('demo.title')}
      </PageTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([to, icon, label], i) => (
          <Link key={to} to={to} className={`fade-up flex min-h-28 flex-col justify-center gap-2 rounded-3xl p-5 text-xl font-bold ${i < 2 ? 'bg-accent text-on-accent shadow-xl' : 'glass'}`} style={{ animationDelay: `${i * 60}ms` }}>
            <Icon name={icon} size={32} /> {label}
          </Link>
        ))}
      </div>
      <button
        className="btn mt-6"
        onClick={() => {
          resetDemo();
          location.reload();
        }}
      >
        <Icon name="trash" /> {t('kiosk.startOver')} ({t('common.simulation')})
      </button>
    </Layout>
  );
}
