import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useBackend } from '../lib/store.tsx';

export default function Login() {
  const { t } = usePrefs();
  const backend = useBackend();
  const navigate = useNavigate();
  const [q] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const next = q.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/staff';
  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <PageTitle icon="lock" sub={t('login.visitorNote')}>
          {t('login.title')}
        </PageTitle>
        <form
          className="glass grid gap-4 rounded-3xl p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await backend.login(email, password);
              navigate(safeNext, { replace: true });
            } catch {
              setError(t('login.failed'));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="grid gap-1 text-lg font-semibold">
            {t('login.email')}
            <input className="field ltr" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="grid gap-1 text-lg font-semibold">
            {t('login.password')}
            <input className="field ltr" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <p role="alert" className="font-semibold text-danger">
            {error}
          </p>
          <button className="btn btn-primary min-h-14 text-xl" disabled={busy}>
            <Icon name="lock" /> {t('login.submit')}
          </button>
        </form>
      </div>
    </Layout>
  );
}
