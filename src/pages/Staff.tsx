import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout.tsx';
import { RequireStaff, StaffBar } from '../components/RequireStaff.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { Icon } from '../components/Icon.tsx';
import { FlipText } from '../components/FlipText.tsx';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend, useHospital } from '../lib/store.tsx';
import { fmtDay, fmtTime } from '../lib/slots.ts';
import type { GuideRequest, Slot, StaffUser } from '../lib/types.ts';
import type { StaffLine } from '../lib/backend/types.ts';

function Guides() {
  const { t, L, lang } = usePrefs();
  const backend = useBackend();
  const { data } = useHospital();
  const [list, setList] = useState<GuideRequest[]>([]);
  useEffect(() => backend.subscribeStaff('staff:guides', (_e, g) => setList(g as GuideRequest[])), [backend]);
  return (
    <section className="glass rounded-3xl p-5" aria-labelledby="g-h">
      <h2 id="g-h" className="mb-3 flex items-center gap-2 text-2xl font-bold">
        <Icon name="users" /> {t('staff.guides')} <span className="rounded-full bg-accent px-2 text-lg text-on-accent">{list.length}</span>
      </h2>
      {!list.length && <p className="text-muted">{t('staff.noGuides')}</p>}
      <ul className="grid gap-2">
        {list.map((g) => (
          <li key={g.id} className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${g.status === 'open' ? 'border-amber-400 bg-amber-300/20' : 'border-line'}`}>
            <Icon name="pin" className="text-accent" />
            <span className="font-bold">{L(data.landmarks.find((l) => l.id === g.landmarkId)?.name)}</span>
            <span className="text-muted">
              {fmtTime(g.createdAt)} · {g.lang.toUpperCase()}
            </span>
            <span className="ms-auto flex gap-2">
              {g.status === 'open' && (
                <button className="btn btn-primary min-h-11" onClick={() => void backend.updateGuide(g.id, 'on_the_way')}>
                  {t('staff.onTheWay')}
                </button>
              )}
              <button className="btn min-h-11" onClick={() => void backend.updateGuide(g.id, 'done')}>
                {t('staff.closeRequest')}
              </button>
            </span>
          </li>
        ))}
      </ul>
      <span className="sr-only" lang={lang} />
    </section>
  );
}

function DoctorSlots({ deptId }: { deptId: string }) {
  const { t, L } = usePrefs();
  const backend = useBackend();
  const { data } = useHospital();
  const doctors = data.doctors.filter((d) => d.deptId === deptId);
  const [docId, setDocId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const doc = doctors.find((d) => d.id === docId) ?? doctors[0];
  useEffect(() => {
    if (!doc) return;
    return backend.subscribe(`slots:${doc.id}`, (_e, s) => setSlots(s as Slot[]));
  }, [backend, doc]);
  if (!doctors.length) return null;
  return (
    <section className="glass rounded-3xl p-5" aria-labelledby="d-h">
      <h2 id="d-h" className="mb-3 text-2xl font-bold">
        {t('staff.doctors')}
      </h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {doctors.map((d) => (
          <button key={d.id} className={`chip ${doc?.id === d.id ? 'bg-accent text-on-accent' : ''}`} aria-pressed={doc?.id === d.id} onClick={() => setDocId(d.id)}>
            {L(d.name)}
          </button>
        ))}
      </div>
      {doc && (
        <>
          <button className={`btn mb-3 ${doc.available ? '' : 'btn-primary'}`} onClick={() => void backend.setDoctorAvailable(doc.id, !doc.available)}>
            <Icon name={doc.available ? 'x' : 'check'} /> {doc.available ? t('staff.markUnavailable') : t('staff.markAvailable')}
          </button>
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {slots
              .filter((s) => s.status === 'free' || s.status === 'blocked' || s.status === 'booked')
              .map((s) => (
                <button
                  key={s.start}
                  disabled={s.status === 'booked'}
                  onClick={() => void backend.setSlotBlocked(doc.id, s.start, s.status !== 'blocked')}
                  className={`rounded-xl border p-2 text-base ${s.status === 'blocked' ? 'border-dashed border-danger text-danger' : s.status === 'booked' ? 'border-line bg-accent-soft' : 'border-line bg-solid'}`}
                >
                  <span className="ltr block font-bold">
                    {fmtDay(s.start, Date.now()) === 'tomorrow' ? '+1 ' : ''}
                    {fmtTime(s.start)}
                  </span>
                  {s.status === 'booked' ? t('book.booked') : s.status === 'blocked' ? t('staff.unblock') : t('staff.block')}
                </button>
              ))}
          </div>
        </>
      )}
    </section>
  );
}

function Queue({ user, demoTools }: { user: StaffUser; demoTools: boolean }) {
  const { t, L } = usePrefs();
  const backend = useBackend();
  const { data } = useHospital();
  const [deptId, setDeptId] = useState(() => user.deptId ?? safeStorage.get('wm_staff_dept') ?? data.departments[0]?.id ?? '');
  const [line, setLine] = useState<StaffLine | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dept = data.departments.find((d) => d.id === deptId);
  const canOperate = user.role === 'admin' || user.role === 'dept';

  useEffect(() => {
    setLine(null);
    if (!deptId) return;
    return backend.subscribeStaff(`staff:line:${deptId}`, (_e, l) => setLine(l as StaffLine));
  }, [backend, deptId]);

  const op = async (kind: 'next' | 'recall' | 'skip') => {
    setBusy(true);
    setError('');
    try {
      await backend.queueOp(deptId, kind);
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!canOperate) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,select,textarea')) return;
      if (e.key === 'n' || e.key === 'N') void op('next');
      if (e.key === 'r' || e.key === 'R') void op('recall');
      if (e.key === 's' || e.key === 'S') void op('skip');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const current = line?.called[0];
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-lg font-semibold" htmlFor="dept-sel">
            {t('staff.dept')}
          </label>
          <select
            id="dept-sel"
            className="field max-w-xs"
            value={deptId}
            disabled={!!user.deptId}
            onChange={(e) => {
              setDeptId(e.target.value);
              safeStorage.set('wm_staff_dept', e.target.value);
            }}
          >
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {L(d.name)}
              </option>
            ))}
          </select>
          {dept && <DeptMark dept={dept} size={44} />}
        </div>

        <section className="glass rounded-3xl p-6" aria-live="polite">
          <p className="text-xl text-muted">{t('staff.nowServing')}</p>
          <div className="my-2 text-7xl font-black">
            <FlipText text={current?.label ?? '---'} length={7} />
          </div>
          {canOperate && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <button className="btn btn-primary min-h-20 text-2xl" disabled={busy} onClick={() => void op('next')} aria-keyshortcuts="N">
                <Icon name="arrowRight" className="rtl:rotate-180" size={30} /> {t('staff.next')}
              </button>
              <button className="btn min-h-20 text-2xl" disabled={busy || !current} onClick={() => void op('recall')} aria-keyshortcuts="R">
                <Icon name="bell" size={30} /> {t('staff.recall')}
              </button>
              <button className="btn min-h-20 text-xl" disabled={busy || !current} onClick={() => void op('skip')} aria-keyshortcuts="S">
                <Icon name="x" size={30} /> {t('staff.skip')}
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 font-semibold text-danger">
              {error}
            </p>
          )}
          <p className="mt-3 text-base text-muted">{t('staff.urgentFirst')} · N / R / S</p>
        </section>

        <section className="glass rounded-3xl p-5" aria-labelledby="w-h">
          <h2 id="w-h" className="mb-3 text-2xl font-bold">
            {t('staff.waiting')} <span className="text-muted">({line?.line.length ?? 0})</span>
          </h2>
          {!line?.line.length && <p className="text-muted">{t('staff.empty')}</p>}
          <ol className="grid gap-2 sm:grid-cols-2">
            {line?.line.map((x, i) => (
              <li key={x.id} className={`flex items-center gap-2 rounded-2xl border p-3 ${x.priority ? 'border-danger bg-[#b91c1c]/10' : 'border-line bg-solid/70'}`}>
                <span className="w-7 text-muted">{i + 1}.</span>
                <span className="ltr text-xl font-bold">{x.label}</span>
                {x.priority === 1 && (
                  <span className="rounded-full bg-[#b91c1c] px-2 text-base text-white">
                    <Icon name="alert" size={16} className="me-1 inline" />
                    {t('staff.urgent')}
                  </span>
                )}
                {x.slotStart && (
                  <span className="text-base text-muted">
                    <Icon name="calendar" size={16} className="me-1 inline" />
                    {fmtTime(x.slotStart)}
                  </span>
                )}
                <span className="ms-auto text-base text-muted">{fmtTime(x.createdAt)}</span>
              </li>
            ))}
          </ol>
          {demoTools && canOperate && (
            <div className="mt-4 rounded-2xl border border-dashed border-amber-500 p-3">
              <button className="btn" onClick={() => void backend.simulate(deptId)}>
                <Icon name="play" /> {t('staff.simulate')}
              </button>
              <p className="mt-1 text-base text-muted">{t('staff.simulateHint')}</p>
            </div>
          )}
        </section>
      </div>
      <div className="grid content-start gap-5">
        <Guides />
        {canOperate && <DoctorSlots deptId={deptId} />}
      </div>
    </div>
  );
}

export default function Staff() {
  return (
    <Layout wide>
      <RequireStaff roles={['dept', 'desk', 'admin']}>
        {(user, demoTools, logout) => (
          <>
            <StaffBar user={user} logout={logout} />
            <Queue user={user} demoTools={demoTools} />
          </>
        )}
      </RequireStaff>
    </Layout>
  );
}
