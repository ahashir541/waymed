import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { RouteView } from '../components/RouteView.tsx';
import { Icon } from '../components/Icon.tsx';
import { currentPlace } from '../lib/place.ts';
import { Feedback, NotifyToggle, OfflineSince, ShareButton, TokenStatusCard } from '../components/TokenStatus.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { saveToken, useBackend, useHospital, useOnline, useStore, useToken } from '../lib/store.tsx';
import { parseTokenLabel } from '../lib/queue.ts';

export function TokenLookupForm({ big, onFound }: { big?: boolean; onFound?: (id: string) => void }) {
  const { t } = usePrefs();
  const backend = useBackend();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const label = parseTokenLabel(value);
        if (!label) return setError(t('token.invalid'));
        setBusy(true);
        setError('');
        try {
          const id = await backend.lookupToken(label);
          if (!id) setError(t('token.notFound'));
          else if (onFound) onFound(id);
          else navigate(`/t/${id}`);
        } catch {
          setError(t('common.error'));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="tok" className={`${big ? 'text-3xl' : 'text-xl'} font-bold`}>
        {t('token.lookupTitle')}
      </label>
      <input
        id="tok"
        className={`field ltr text-center font-black tracking-widest uppercase ${big ? 'min-h-24 text-6xl' : 'min-h-16 text-4xl'}`}
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="PED-007"
        autoComplete="off"
        autoCapitalize="characters"
        inputMode="text"
        maxLength={10}
        aria-describedby="tok-hint tok-err"
      />
      <p id="tok-hint" className="text-muted">
        {t('token.lookupHint')}
      </p>
      <p id="tok-err" role="alert" className="font-semibold text-danger">
        {error}
      </p>
      <button className={`btn btn-primary ${big ? 'min-h-20 text-3xl' : 'min-h-14 text-xl'}`} disabled={busy}>
        <Icon name="ticket" /> {t('token.lookupGo')}
      </button>
    </form>
  );
}

export function TokenLookup() {
  const { t } = usePrefs();
  return (
    <Layout visitor>
      <LanguageGate>
        <div className="mx-auto max-w-xl">
          <PageTitle icon="ticket">{t('home.haveSlip')}</PageTitle>
          <div className="glass rounded-3xl p-6">
            <TokenLookupForm />
          </div>
        </div>
      </LanguageGate>
    </Layout>
  );
}

export function TokenPage() {
  const { id = '' } = useParams();
  const [q] = useSearchParams();
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const { backend } = useStore();
  const online = useOnline();
  const { view, missing, updatedAt } = useToken(id);
  const dept = view ? data.departments.find((d) => d.id === view.deptId) : null;

  useEffect(() => {
    if (q.get('src') === 'qr') backend.logEvent({ type: 'qr_scanned', channel: 'phone' });
  }, [q, backend]);
  useEffect(() => {
    if (view) saveToken(backend.mode, { id: view.id, label: view.label, deptId: view.deptId });
  }, [view, backend.mode]);

  return (
    <Layout visitor wide>
      <LanguageGate>
        <div className="grid gap-5">
          {missing && !view && (
            <div role="alert" className="glass rounded-3xl p-6 text-xl">
              <Icon name="alert" className="me-2 inline text-danger" /> {t('token.notFound')}
              <div className="mt-4">
                <Link to="/t" className="btn btn-primary">
                  {t('token.lookupTitle')}
                </Link>
              </div>
            </div>
          )}
          {!view && !missing && <p className="text-xl text-muted">{t('common.loading')}</p>}
          {view && (
            <>
              <OfflineSince online={online} updatedAt={updatedAt} />
              <TokenStatusCard view={view} data={data} />
              <div className="no-print flex flex-wrap gap-2">
                <ShareButton url={`${location.origin}/f/${view.id}`} title={t('token.share')} text={t('token.shareText', { label: view.label })} />
                {(view.status === 'waiting' || view.status === 'next') && <NotifyToggle view={view} deptName={L(dept?.name)} />}
                <Link to={`/f/${view.id}`} className="btn">
                  <Icon name="users" /> {t('token.familyPage')}
                </Link>
              </div>
              {view.status === 'done' && <Feedback tokenId={view.id} />}
              <p className="text-base text-muted">
                <Icon name="lock" size={18} className="me-1 inline" />
                {t('token.privacy')}
              </p>
              {dept && view.status !== 'done' && (
                <>
                  <h2 className="mt-2 text-2xl font-bold">{t('token.route', { dept: L(dept.name) })}</h2>
                  <RouteView data={data} from={currentPlace()} dest={dept.id} />
                </>
              )}
            </>
          )}
        </div>
      </LanguageGate>
    </Layout>
  );
}
