import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import type { Role, StaffUser } from '../lib/types.ts';
import { useBackend } from '../lib/store.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { Icon } from './Icon.tsx';

/** Staff pages: the server enforces roles on every call; this only routes people to sign in first. */
export function RequireStaff({ roles, children }: { roles: Role[]; children: (user: StaffUser, demoTools: boolean, logout: () => void) => ReactNode }) {
  const backend = useBackend();
  const { t } = usePrefs();
  const loc = useLocation();
  const [state, setState] = useState<{ user: StaffUser | null; demoTools: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    backend
      .me()
      .then(setState)
      .catch(() => setFailed(true));
  }, [backend]);
  if (failed) return <p className="p-8 text-xl">{t('common.error')}</p>;
  if (!state) return <p className="p-8 text-xl text-muted">{t('common.loading')}</p>;
  if (!state.user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!roles.includes(state.user.role))
    return (
      <div className="glass mx-auto mt-10 max-w-lg rounded-3xl p-8 text-center text-xl">
        <Icon name="lock" size={40} className="mx-auto text-danger" />
        <p className="mt-3">{t('login.needRole')}</p>
        <Link to="/" className="btn mt-4">
          {t('common.goHome')}
        </Link>
      </div>
    );
  const logout = () => {
    void backend.logout().then(() => setState({ user: null, demoTools: false }));
  };
  return <>{children(state.user, state.demoTools, logout)}</>;
}

export function StaffBar({ user, logout }: { user: StaffUser; logout: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2 text-base text-muted">
      <Icon name="user" size={20} /> {user.name} · {user.role}
      <span className="ms-auto flex flex-wrap gap-2">
        {(user.role === 'desk' || user.role === 'admin') && (
          <Link className="btn min-h-11" to="/register">
            {t('desk.title')}
          </Link>
        )}
        <Link className="btn min-h-11" to="/staff">
          {t('staff.title')}
        </Link>
        {user.role === 'admin' && (
          <>
            <Link className="btn min-h-11" to="/admin">
              {t('admin.title')}
            </Link>
            <Link className="btn min-h-11" to="/insights">
              {t('admin.insights')}
            </Link>
          </>
        )}
        <button className="btn min-h-11" onClick={logout}>
          <Icon name="logout" /> {t('login.logout')}
        </button>
      </span>
    </div>
  );
}
