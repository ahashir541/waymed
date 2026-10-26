import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { RequireStaff, StaffBar } from '../components/RequireStaff.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { Icon } from '../components/Icon.tsx';
import { Slip } from '../components/Slip.tsx';
import { usePrefs, useAllLanguages } from '../lib/prefs.tsx';
import { useBackend, useHospital, useQueues } from '../lib/store.tsx';
import { fmtTime } from '../lib/slots.ts';
import type { TokenView } from '../lib/types.ts';
import type { RecentToken } from '../lib/backend/types.ts';

function DeskInner() {
  useAllLanguages();
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const backend = useBackend();
  const { queues } = useQueues();
  const [urgent, setUrgent] = useState(false);
  const [issued, setIssued] = useState<TokenView | null>(null);
  const [recent, setRecent] = useState<RecentToken[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [autoPrint, setAutoPrint] = useState(false);

  const refresh = () => void backend.recentTokens().then(setRecent).catch(() => undefined);
  useEffect(refresh, [backend]);

  const issue = async (deptId: string) => {
    setBusy(deptId);
    setError('');
    try {
      const v = await backend.issueToken(deptId, urgent);
      setIssued(v);
      setUrgent(false);
      refresh();
      if (autoPrint) setTimeout(() => window.print(), 200);
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy('');
    }
  };
  const dept = issued ? data.departments.find((d) => d.id === issued.deptId) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section>
        <PageTitle icon="ticket">{t('desk.title')}</PageTitle>
        <div className="mb-4 flex flex-wrap gap-3">
          <label className="chip min-h-14 text-lg">
            <input type="checkbox" className="size-6 accent-red-700" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            <Icon name="alert" className="text-danger" /> {t('desk.urgent')}
          </label>
          <label className="chip min-h-14 text-lg">
            <input type="checkbox" className="size-6" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
            <Icon name="printer" /> {t('desk.printSlip')}
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.departments.map((d) => (
            <button
              key={d.id}
              disabled={!!busy}
              onClick={() => void issue(d.id)}
              className="glass flex min-h-24 items-center gap-4 rounded-3xl p-4 text-start text-2xl font-bold transition-transform hover:scale-[1.02]"
              style={{ borderInlineStart: `8px solid ${d.color}` }}
            >
              <DeptMark dept={d} size={56} />
              <span className="flex-1">
                {L(d.name)}
                <span className="block text-base font-normal text-muted">{t('board.waiting', { n: queues[d.id]?.waiting ?? 0 })}</span>
              </span>
              <Icon name="plus" />
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-lg font-semibold text-danger">
            {error}
          </p>
        )}
        <h2 className="mt-8 mb-2 text-xl font-bold">{t('desk.recent')}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {recent.map((r) => {
            const d = data.departments.find((x) => x.id === r.deptId);
            return (
              <li key={r.id} className="flex items-center gap-2 rounded-2xl border border-line bg-solid/70 p-2">
                {d && <DeptMark dept={d} size={28} />}
                <span className="ltr font-bold">{r.label}</span>
                {r.priority === 1 && <span className="rounded-full bg-[#b91c1c] px-2 text-base text-white">{t('staff.urgent')}</span>}
                <span className="text-muted">{fmtTime(r.createdAt)}</span>
                <button
                  className="btn ms-auto min-h-11 px-3"
                  onClick={async () => {
                    const v = await backend.getToken(r.id);
                    if (v) setIssued(v);
                  }}
                  aria-label={`${t('desk.printSlip')} ${r.label}`}
                >
                  <Icon name="printer" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-live="polite">
        {issued && dept ? (
          <div className="sticky top-24 grid gap-3">
            <p role="status" className="text-xl font-bold">
              <Icon name="check" className="me-2 inline text-ok" />
              {t('desk.issued', { label: issued.label })}
            </p>
            <div className="print-area">
              <Slip view={issued} dept={dept} data={data} />
            </div>
            <div className="no-print flex flex-wrap gap-2">
              <button className="btn btn-primary min-h-14 flex-1 text-xl" onClick={() => window.print()}>
                <Icon name="printer" /> {t('desk.printSlip')}
              </button>
              <Link className="btn min-h-14" to="/followup">
                <Icon name="calendar" /> {t('desk.followup')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass grid min-h-64 place-items-center rounded-3xl p-6 text-center text-lg text-muted">
            <div>
              <Icon name="ticket" size={48} className="mx-auto" />
              <p className="mt-2">{t('desk.noPersonal')}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Desk() {
  return (
    <Layout wide>
      <RequireStaff roles={['desk', 'admin']}>
        {(user, _demo, logout) => (
          <>
            <StaffBar user={user} logout={logout} />
            <DeskInner />
          </>
        )}
      </RequireStaff>
    </Layout>
  );
}
