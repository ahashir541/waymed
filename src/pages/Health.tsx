import { useEffect, useState } from 'react';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { Icon } from '../components/Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useBackend, useOnline } from '../lib/store.tsx';

export default function Health() {
  const { t } = usePrefs();
  const backend = useBackend();
  const online = useOnline();
  const [h, setH] = useState<Awaited<ReturnType<typeof backend.health>> | null>(null);
  const [failed, setFailed] = useState(false);
  const [sw, setSw] = useState<boolean | null>(null);
  useEffect(() => {
    backend
      .health()
      .then(setH)
      .catch(() => setFailed(true));
    navigator.serviceWorker?.getRegistration().then((r) => setSw(!!r?.active)) ?? setSw(false);
  }, [backend]);
  const rows: [string, boolean | null, string?][] = [
    [t('health.server'), failed ? false : h ? true : null],
    [t('health.db'), h ? h.db : failed ? false : null],
    [t('health.realtime'), online],
    [t('health.sw'), sw],
    [t('health.assistant'), h ? true : null, h ? (h.llm ? t('health.llm') : t('health.rules')) : undefined],
  ];
  const ok = !failed && h?.ok && online;
  return (
    <Layout>
      <PageTitle icon="activity">{t('health.title')}</PageTitle>
      <p role="status" className={`mb-4 rounded-2xl p-4 text-2xl font-bold ${ok ? 'bg-[#15803d] text-white' : 'bg-amber-300 text-black'}`}>
        <Icon name={ok ? 'check' : 'alert'} className="me-2 inline" />
        {ok ? t('health.ok') : t('health.bad')}
      </p>
      <ul className="glass grid gap-2 rounded-3xl p-5 text-xl">
        {rows.map(([label, v, note]) => (
          <li key={label} className="flex items-center gap-3">
            <Icon name={v === null ? 'clock' : v ? 'check' : 'x'} className={v === null ? 'text-muted' : v ? 'text-ok' : 'text-danger'} />
            <span className="font-semibold">{label}</span>
            {note && <span className="text-muted">· {note}</span>}
          </li>
        ))}
      </ul>
      {h && <p className="mt-3 text-muted">{new Date(h.time).toISOString()}</p>}
    </Layout>
  );
}
