import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { Icon } from '../components/Icon.tsx';
import { TokenStatusCard } from '../components/TokenStatus.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { saveToken, useBackend, useHospital } from '../lib/store.tsx';
import { fmtDay, fmtTime } from '../lib/slots.ts';
import { ApiError } from '../lib/backend/types.ts';
import type { Slot, TokenView } from '../lib/types.ts';

export function Book() {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const backend = useBackend();
  const [q, setQ] = useSearchParams();
  const deptId = q.get('dept') ?? '';
  const [doctorId, setDoctorId] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState<TokenView | null>(null);
  const dept = data.departments.find((d) => d.id === deptId);
  const doctors = data.doctors.filter((d) => d.deptId === deptId);

  // Live slot updates: a time booked on another phone turns "Not available" here within a second.
  useEffect(() => {
    setSlots(null);
    setPicked(null);
    if (!doctorId) return;
    return backend.subscribe(`slots:${doctorId}`, (_e, s) => {
      setSlots(s as Slot[]);
      setPicked((p) => ((s as Slot[]).some((x) => x.start === p && x.status === 'free') ? p : null));
    });
  }, [backend, doctorId]);

  const now = Date.now();
  if (booked) {
    return (
      <Layout visitor>
        <PageTitle icon="check">{t('book.done')}</PageTitle>
        <div className="grid gap-4">
          <TokenStatusCard view={booked} data={data} announce={false} />
          <p className="text-xl">{t('book.noPersonal')}</p>
          {booked.slotStart && booked.slotEnd && (
            <p className="text-xl font-bold">{t('book.estimate', { start: fmtTime(booked.slotStart), end: fmtTime(booked.slotEnd + (booked.slotEnd - booked.slotStart)) })}</p>
          )}
          <Link to={`/t/${booked.id}`} className="btn btn-primary min-h-14 text-xl">
            <Icon name="ticket" /> {t('assistant.openToken')}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout visitor>
      <LanguageGate>
        <PageTitle icon="calendar" sub={t('book.window')}>
          {t('book.title')}
        </PageTitle>

        <section aria-labelledby="b-dept" className="mb-6">
          <h2 id="b-dept" className="mb-3 text-xl font-bold text-muted">
            1. {t('book.dept')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.departments
              .filter((d) => d.bookable)
              .map((d) => (
                <button
                  key={d.id}
                  aria-pressed={d.id === deptId}
                  onClick={() => {
                    setQ({ dept: d.id }, { replace: true });
                    setDoctorId('');
                  }}
                  className={`glass flex min-h-20 items-center gap-3 rounded-2xl p-3 text-xl font-bold ${d.id === deptId ? 'ring-4 ring-accent' : ''}`}
                >
                  <DeptMark dept={d} size={44} /> {L(d.name)}
                </button>
              ))}
          </div>
          {dept && !dept.bookable && <p className="mt-3 text-lg">{t('book.notBookable')}</p>}
        </section>

        {dept?.bookable && (
          <section aria-labelledby="b-doc" className="mb-6">
            <h2 id="b-doc" className="mb-3 text-xl font-bold text-muted">
              2. {t('book.doctor')} {data.sample && <span className="font-normal">· {t('common.sample')}</span>}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  aria-pressed={d.id === doctorId}
                  onClick={() => setDoctorId(d.id)}
                  className={`glass flex min-h-16 items-center gap-3 rounded-2xl p-3 text-start text-lg font-semibold ${d.id === doctorId ? 'ring-4 ring-accent' : ''}`}
                >
                  <Icon name="stethoscope" className="text-accent" />
                  <span className="flex-1">
                    {L(d.name)}
                    {!d.available && <span className="block text-base font-normal text-danger">{t('book.doctorAway')}</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {doctorId && (
          <section aria-labelledby="b-slot">
            <h2 id="b-slot" className="mb-3 text-xl font-bold text-muted">
              3. {t('book.slot')}
            </h2>
            {!slots && <p className="text-muted">{t('common.loading')}</p>}
            {slots && !slots.some((s) => s.status === 'free') && <p className="text-lg">{t('book.noSlots')}</p>}
            {slots &&
              (['today', 'tomorrow'] as const).map((day) => {
                const list = slots.filter((s) => fmtDay(s.start, now) === day && s.status !== 'past');
                if (!list.length) return null;
                return (
                  <div key={day} className="mb-4">
                    <h3 className="mb-2 text-lg font-bold">{t(day === 'today' ? 'common.today' : 'common.tomorrow')}</h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                      {list.map((s) => {
                        const free = s.status === 'free';
                        return (
                          <button
                            key={s.start}
                            disabled={!free}
                            aria-pressed={picked === s.start}
                            onClick={() => setPicked(s.start)}
                            className={`flex min-h-16 flex-col items-center justify-center rounded-xl border p-1 ${
                              picked === s.start ? 'border-accent bg-accent text-on-accent' : free ? 'border-line bg-solid' : 'border-dashed border-line bg-transparent text-muted line-through'
                            }`}
                          >
                            <span className="ltr text-lg font-bold">{fmtTime(s.start)}</span>
                            {!free && <span className="text-base no-underline">{t('common.notAvailable')}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            {error && (
              <p role="alert" className="mb-3 text-lg font-semibold text-danger">
                {error}
              </p>
            )}
            <button
              className="btn btn-primary sticky bottom-24 min-h-16 w-full text-xl shadow-xl"
              disabled={picked === null || busy}
              onClick={async () => {
                if (picked === null) return;
                setBusy(true);
                setError('');
                try {
                  const v = await backend.book(doctorId, picked);
                  saveToken(backend.mode, { id: v.id, label: v.label, deptId: v.deptId });
                  setBooked(v);
                } catch (e) {
                  setError(e instanceof ApiError && e.status === 409 ? t('book.taken') : t('common.error'));
                  setPicked(null);
                  setSlots(await backend.slots(doctorId).catch(() => slots));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Icon name="calendar" /> {picked !== null ? t('book.confirm', { time: fmtTime(picked) }) : t('book.slot')}
            </button>
            <p className="mt-3 text-base text-muted">{t('book.noPersonal')}</p>
          </section>
        )}
      </LanguageGate>
    </Layout>
  );
}
