import { Link } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';

export function NotFound() {
  const { t } = usePrefs();
  return (
    <Layout visitor>
      <div className="glass mx-auto mt-10 max-w-xl rounded-3xl p-8 text-center">
        <Icon name="compass" size={56} className="mx-auto text-accent" />
        <h1 className="mt-3 text-3xl font-bold">{t('common.notFound')}</h1>
        <Link to="/" className="btn btn-primary mt-6">
          <Icon name="home" /> {t('common.goHome')}
        </Link>
      </div>
    </Layout>
  );
}
