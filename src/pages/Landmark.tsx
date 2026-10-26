import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { chapterPath, getVisit, updateVisit } from '../lib/visit.ts';
import { Layout } from '../components/Layout.tsx';
import { LanguageGate } from '../components/LanguageGate.tsx';
import { RouteView } from '../components/RouteView.tsx';
import { Icon } from '../components/Icon.tsx';
import { Modal } from '../components/Modal.tsx';
import { DestinationCards } from './Guide.tsx';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend, useHospital, useSavedToken } from '../lib/store.tsx';
import { resolveDestination } from '../lib/route.ts';
import { placeName } from '../lib/directions.ts';
import type { GuideRequest } from '../lib/types.ts';

/** "I feel lost" help: stay put, nearest help desk, or ask a guide to come (anonymous request staff can see). */
export function LostHelp({ landmarkId, big, compact }: { landmarkId: string; big?: boolean; compact?: boolean }) {
  const { t, L, lang } = usePrefs();
  const backend = useBackend();
  const { data } = useHospital();
  const [open, setOpen] = useState(false);
  const [guide, setGuide] = useState<GuideRequest | null>(null);
  const [error, setError] = useState('');
  const place = data.landmarks.find((l) => l.id === landmarkId);
  const help = resolveDestination(data, 'helpdesk', landmarkId);

  useEffect(() => {
    if (!guide) return;
    return backend.subscribe(`guide:${guide.id}`, (_e, g) => setGuide(g as GuideRequest));
  }, [backend, guide?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        className={`flex w-full items-center justify-center gap-3 font-extrabold transition-transform hover:scale-[1.01] ${compact ? 'min-h-12 rounded-2xl border border-[#E0A800]/50 bg-transparent text-base text-accent' : `rounded-3xl bg-amber-300 text-black shadow-xl ${big ? 'min-h-28 text-4xl' : 'min-h-20 text-3xl'}`}`}
        onClick={() => {
          setOpen(true);
          backend.logEvent({ type: 'lost_help', landmarkId, lang });
        }}
      >
        <Icon name="compass" size={compact ? 20 : big ? 48 : 40} strokeWidth={2.4} /> {t('landmark.lost')}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('landmark.lostTitle')}>
        <div className="grid gap-4 text-xl">
          <p className="flex items-start gap-2">
            <Icon name="pin" className="mt-1 shrink-0 text-accent" /> {t('landmark.lostStay', { place: L(place?.name) })}
          </p>
          {help && (
            <Link to={`/g/helpdesk?from=${landmarkId}`} className="btn min-h-14" onClick={() => setOpen(false)}>
              <Icon name="helpdesk" /> {t('landmark.helpDesk')}: {placeName(data, help, lang)}
            </Link>
          )}
          {!guide ? (
            <button
              className="btn btn-primary min-h-16 text-xl"
              onClick={async () => {
                setError('');
                try {
                  setGuide(await backend.requestGuide(landmarkId, lang));
                } catch {
                  setError(t('common.error'));
                }
              }}
            >
              <Icon name="users" /> {t('landmark.askGuide')}
            </button>
          ) : (
            <p role="status" className={`rounded-2xl p-4 font-bold ${guide.status === 'on_the_way' ? 'bg-[#15803d] text-white' : 'bg-accent-soft'}`}>
              <Icon name={guide.status === 'on_the_way' ? 'check' : 'clock'} className="me-2 inline" />
              {guide.status === 'open' ? t('landmark.guideSent', { place: L(place?.name) }) : guide.status === 'on_the_way' ? t('landmark.guideOnWay') : t('landmark.guideDone')}
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

export function LandmarkPage() {
  const { landmark = '' } = useParams();
  const [q] = useSearchParams();
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const backend = useBackend();
  const saved = useSavedToken();
  const place = data.landmarks.find((l) => l.id === landmark);
  const savedDept = saved ? data.departments.find((d) => d.id === saved.deptId) : null;
  const [pick, setPick] = useState<string | null>(null);

  const navigate = useNavigate();
  useEffect(() => {
    if (!place) return;
    // During a visit, a landmark QR is a checkpoint: confirm the place and continue on the map.
    const v = getVisit();
    if (v && v.deptId && (v.chapter === 'map' || v.chapter === 'slip')) {
      updateVisit({ here: place.id, chapter: 'map' });
      navigate(chapterPath('map'), { replace: true });
      return;
    }
    safeStorage.set('wm_here', place.id, true);
    if (q.get('src') === 'qr') backend.logEvent({ type: 'qr_scanned', channel: 'phone', landmarkId: place.id });
  }, [place, q, backend]);

  if (!place) {
    return (
      <Layout visitor>
        <p role="alert" className="glass rounded-3xl p-6 text-xl">
          <Icon name="alert" className="me-2 inline text-danger" />
          {t('landmark.unknown')}
        </p>
      </Layout>
    );
  }

  const dest = pick ?? savedDept?.id ?? null;
  return (
    <Layout visitor wide>
      <LanguageGate>
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-3xl bg-navy p-5 text-white shadow-xl">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/15">
            <Icon name="pin" size={32} />
          </span>
          <div>
            <p className="text-lg opacity-85">{t('landmark.title')}</p>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{L(place.name)}</h1>
          </div>
        </div>
        <div className="mb-5">
          <LostHelp landmarkId={place.id} />
        </div>
        {dest ? (
          <>
            {savedDept && dest === savedDept.id && (
              <p className="mb-3 flex flex-wrap items-center gap-2 text-xl font-bold">
                <Icon name="ticket" className="text-accent" /> {t('landmark.toToken')}: <span className="ltr">{saved!.label}</span>
                <Link to={`/t/${saved!.id}`} className="btn ms-2 min-h-11">
                  {t('token.title')}
                </Link>
              </p>
            )}
            <RouteView data={data} from={place.id} dest={dest} />
            <button className="btn mt-4" onClick={() => setPick('')}>
              <Icon name="route" /> {t('guide.other')}
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-2xl font-bold">{t('landmark.noToken')}</h2>
            <DestinationCards data={data} from={place.id} onPick={setPick} />
          </>
        )}
      </LanguageGate>
    </Layout>
  );
}
