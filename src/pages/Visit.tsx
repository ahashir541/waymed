// The visitor journey in five chapters: Gate > Slip > Map > Wait > Your turn.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { Layout } from '../components/Layout.tsx';
import { VCard, VTitle } from '../components/VisitorShell.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptBadge } from '../components/DeptMark.tsx';
import { FloorPlan, PLAN_H, PLAN_W } from '../components/FloorPlan.tsx';
import { QRCode } from '../components/QRCode.tsx';
import { ListenButton, useStepFree } from '../components/RouteView.tsx';
import { Feedback, ShareButton } from '../components/TokenStatus.tsx';
import { FacilityGrid } from '../components/FacilityGrid.tsx';
import { LostHelp } from './Landmark.tsx';
import { TokenLookupForm } from './Token.tsx';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend, useHospital, useStore, useToken } from '../lib/store.tsx';
import { CHAPTERS, NEEDS, chapterPath, endVisit, updateVisit, useVisit, type Chapter, type Visit } from '../lib/visit.ts';
import { findRoute, resolveDestination, type RouteResult, type Pt } from '../lib/route.ts';
import { stepText, placeName } from '../lib/directions.ts';
import { OffRouteDetector, farFromPlan, gpsToPlan, nearestNode, softChime } from '../lib/geo.ts';
import { ApiError } from '../lib/backend/types.ts';
import { sampleHospital } from '../data/sampleHospital.ts';
import { FACILITY_TYPES, type HospitalData, type TokenView } from '../lib/types.ts';
import { isOpen, nextOpening, openingWords } from '../lib/hours.ts';
import type { DictKey } from '../lib/i18n/core.ts';

const STEP_ICON: Record<string, string> = {
  start: 'pin',
  straight: 'arrowUp',
  slight_left: 'slightLeft',
  slight_right: 'slightRight',
  left: 'arrowLeft',
  right: 'arrowRight',
  back: 'uturn',
  arrive: 'flag',
};

export default function VisitPage() {
  const { chapter = 'gate' } = useParams();
  const visit = useVisit();
  if (!CHAPTERS.includes(chapter as Chapter)) return <Navigate to="/" replace />;
  if (!visit) return <Navigate to="/" replace />;
  const c = chapter as Chapter;
  return (
    <Layout visitor wide={c === 'map'}>
      {c === 'gate' && <Gate />}
      {c === 'slip' && <Slip visit={visit} />}
      {c === 'map' && <MapChapter visit={visit} />}
      {c === 'wait' && <Wait visit={visit} />}
      {c === 'turn' && <Turn visit={visit} />}
    </Layout>
  );
}

function go(navigate: ReturnType<typeof useNavigate>, chapter: Chapter, patch: Partial<Visit> = {}) {
  updateVisit({ ...patch, chapter });
  navigate(chapterPath(chapter));
}

// ---------- 1. At the gate ----------

function Gate() {
  const { t } = usePrefs();
  const navigate = useNavigate();
  // The same five parts as the progress bar above.
  const icons: Record<Chapter, string> = { gate: 'entrance', slip: 'ticket', map: 'route', wait: 'clock', turn: 'bell' };
  return (
    <div className="v-stagger grid gap-3">
      <VTitle sub={t('v.gate.calm')}>{t('v.gate.title')}</VTitle>
      <p className="font-semibold">{t('v.gate.lead')}</p>
      <ol className="grid gap-2">
        {CHAPTERS.map((c, i) => (
          <li key={c} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon name={icons[c]} size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-accent">
                {i + 1}. {t(`v.ch.${c}` as DictKey)}
              </span>
              <span className="text-[0.9375rem] font-semibold leading-snug">{t(`v.journey.${c}` as DictKey)}</span>
            </span>
          </li>
        ))}
      </ol>
      <button className="vbtn v-glow mt-2" onClick={() => go(navigate, 'slip', { here: 'entrance' })}>
        {t('v.gate.start')} <Icon name="arrowRight" size={20} className="rtl:rotate-180" />
      </button>
    </div>
  );
}

// ---------- 2. Get your slip ----------

function StepList({ route, data }: { route: RouteResult; data: HospitalData }) {
  const { t, lang } = usePrefs();
  return (
    <ol className="grid gap-2">
      {route.steps.slice(1).map((s, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl bg-solid px-3 py-2.5">
          <Icon name={STEP_ICON[s.kind]} size={20} className="shrink-0 text-accent" />
          <span className="text-[0.9375rem]">{s.kind === 'arrive' ? t('v.map.destination', { place: placeName(data, route.nodes[route.nodes.length - 1], lang) }) : stepText(s, data, lang)}</span>
        </li>
      ))}
    </ol>
  );
}

function SlipCard({ view, data }: { view: TokenView; data: HospitalData }) {
  const { t, L } = usePrefs();
  const dept = data.departments.find((d) => d.id === view.deptId);
  const n = Number(view.label.split('-')[1] ?? 0);
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="h-2" style={{ background: dept?.color }} />
        <div className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="ltr text-[2.5rem] font-black leading-none tracking-tight">{view.label}</p>
            {dept && (
              <p className="mt-2 flex items-center gap-2 font-semibold">
                <DeptBadge dept={dept} size={30} /> {L(dept.name)}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-white p-1.5">
            <QRCode value={`${location.origin}/t/${view.id}?src=qr`} size={96} label={view.label} />
          </div>
        </div>
        <p className="flex items-center gap-2 border-t border-line px-4 py-2 text-xs text-muted">
          <Icon name="lock" size={14} /> {t('v.slip.noData')}
        </p>
      </div>
      {dept && (
        <p role="status" className="flex items-start gap-2 rounded-2xl border border-[#3ccf7a]/30 bg-[#3ccf7a]/10 p-3 text-[0.9375rem]">
          <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" />
          {t('v.slip.headsUp', { dept: L(dept.name), n })}
        </p>
      )}
    </div>
  );
}

function Slip({ visit }: { visit: Visit }) {
  const { t, L } = usePrefs();
  const navigate = useNavigate();
  const backend = useBackend();
  const { data } = useHospital();
  const { view } = useToken(visit.tokenId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [printed, setPrinted] = useState(false);
  const toRoom = useMemo(() => findRoute(data, 'entrance', 'registration'), [data]);
  const need = NEEDS.find((x) => x.id === visit.need);
  const dept = need ? data.departments.find((d) => d.id === need.deptId) : null;

  // Each part of this chapter has its own address (?step=walk|need|yours), so refresh and Back
  // return to the same part. The address wins when it is allowed; otherwise the saved visit decides.
  const [q, setQ] = useSearchParams();
  const derived = visit.tokenId ? 'yours' : visit.here === 'registration' ? 'need' : 'walk';
  const asked = q.get('step');
  const step = asked === 'walk' || (asked === 'need' && visit.here === 'registration') || (asked === 'yours' && visit.tokenId) ? asked : derived;
  useEffect(() => {
    if (asked !== step) setQ({ step }, { replace: true });
  }, [asked, step, setQ]);
  const toStep = (next: 'walk' | 'need' | 'yours') => setQ({ step: next });

  // Phase 3: slip in hand.
  if (step === 'yours' && visit.tokenId && view) {
    return (
      <div className="v-stagger grid gap-4">
        <VTitle>{t('v.slip.yours')}</VTitle>
        <SlipCard view={view} data={data} />
        <button className="vbtn v-glow" onClick={() => go(navigate, 'map', { here: 'registration', done: 0 })}>
          <Icon name="route" size={20} /> {t('v.slip.next')}
        </button>
      </div>
    );
  }

  // Phase 1: walk from the gate to the Slip Room.
  if (step === 'walk') {
    return (
      <div className="v-stagger grid gap-4">
        <VTitle sub={t('v.slip.go')}>{t('v.slip.title')}</VTitle>
        {toRoom && (
          <>
            <VCard className="p-2">
              <FloorPlan data={data} route={toRoom} viewBox="0 330 620 300" />
            </VCard>
            <StepList route={toRoom} data={data} />
          </>
        )}
        <button
          className="vbtn v-glow"
          onClick={() => {
            updateVisit({ here: 'registration' });
            toStep(visit.tokenId ? 'yours' : 'need');
          }}
        >
          <Icon name="check" size={20} /> {t('v.slip.atRoom')}
        </button>
      </div>
    );
  }

  // Phase 2: what do you need, then get the slip.
  return (
    <div className="v-stagger grid gap-4">
      <VTitle>{t('v.slip.need')}</VTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {NEEDS.map((n) => {
          const d = data.departments.find((x) => x.id === n.deptId);
          const emergency = n.id === 'emergency';
          return (
            <button
              key={n.id}
              aria-pressed={visit.need === n.id}
              onClick={() => (emergency ? navigate('/emergency?from=registration') : updateVisit({ need: n.id, deptId: n.deptId }))}
              className={`vtile flex h-full min-h-[112px] flex-col items-start justify-between gap-2 rounded-2xl border p-3 text-start ${
                emergency ? 'col-span-full min-h-0 flex-row items-center justify-start border-[#D92D20]/50 bg-[#D92D20]/10' : 'border-line bg-surface'
              }`}
            >
              {d && <DeptBadge dept={d} size={emergency ? 34 : 40} />}
              <span className="font-bold">
                {t(`v.need.${n.id}` as DictKey)}
                {!emergency && d && <span className="block text-xs font-normal text-muted">{L(d.name)}</span>}
                {emergency && <span className="block text-xs font-normal">{t('v.slip.emergency')}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-[#D92D20]/15 p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {visit.tokenId ? (
        <button className="vbtn v-glow" onClick={() => toStep('yours')}>
          <Icon name="ticket" size={20} /> {t('v.slip.yours')}
        </button>
      ) : !printed ? (
        <>
          <button
            className="vbtn v-glow"
            disabled={!dept || busy}
            onClick={async () => {
              if (!dept) return;
              setBusy(true);
              setError('');
              try {
                const v = await backend.selfIssue(dept.id);
                updateVisit({ tokenId: v.id, label: v.label, deptId: v.deptId });
                toStep('yours');
              } catch (e) {
                setError(e instanceof ApiError && e.status === 429 ? t('v.slip.limit') : t('common.error'));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Icon name="ticket" size={20} /> {t('v.slip.get')}
          </button>
          <button className="vbtn-2" onClick={() => setPrinted(true)}>
            <Icon name="keyboard" size={18} className="text-accent" /> {t('v.slip.printed')}
          </button>
        </>
      ) : (
        <VCard>
          <TokenLookupForm
            onFound={async (id) => {
              const v = await backend.getToken(id);
              if (v) {
                updateVisit({ tokenId: v.id, label: v.label, deptId: v.deptId, need: NEEDS.find((n) => n.deptId === v.deptId)?.id });
                toStep('yours');
              }
            }}
          />
        </VCard>
      )}
    </div>
  );
}

// ---------- 3. Follow the map ----------

type Mode = 'gps' | 'checkpoint';
type Note = null | 'denied' | 'far' | 'weak';

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let lock: { release: () => Promise<void> } | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
        const l = await nav.wakeLock?.request('screen');
        if (l && !cancelled) lock = l;
        else void l?.release();
      } catch {
        /* not supported or denied: navigation still works */
      }
    };
    void request();
    const onVis = () => document.visibilityState === 'visible' && void request();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void lock?.release();
    };
  }, [active]);
}

function notify(body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  navigator.serviceWorker
    ?.getRegistration()
    .then((reg) => {
      if (reg) void reg.showNotification('WayMed', { body, tag: 'wrong-turn', icon: '/icon-192.png' });
      else new Notification('WayMed', { body });
    })
    .catch(() => undefined);
}

/** Zoom the plan around where the visitor is, the next point and (if close) the destination. */
function focusBox(data: HospitalData, nodes: string[], dot: Pt | null): string {
  const pts: Pt[] = nodes.map((id) => data.landmarks.find((l) => l.id === id)).filter(Boolean).map((l) => [l!.x, l!.y]);
  if (dot) pts.push(dot);
  if (!pts.length) return `0 0 ${PLAN_W} ${PLAN_H}`;
  let x0 = Math.min(...pts.map((p) => p[0])) - 110;
  let x1 = Math.max(...pts.map((p) => p[0])) + 110;
  let y0 = Math.min(...pts.map((p) => p[1])) - 90;
  let y1 = Math.max(...pts.map((p) => p[1])) + 90;
  const aspect = PLAN_W / PLAN_H;
  let w = Math.max(480, x1 - x0);
  let h = Math.max(w / aspect, y1 - y0);
  w = Math.max(w, h * aspect);
  h = w / aspect;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  x0 = Math.max(0, Math.min(PLAN_W - w, cx - w / 2));
  y0 = Math.max(0, Math.min(PLAN_H - h, cy - h / 2));
  x1 = Math.min(PLAN_W, w);
  y1 = Math.min(PLAN_H, h);
  return `${Math.round(x0)} ${Math.round(y0)} ${Math.round(x1)} ${Math.round(y1)}`;
}

function LocationSheet({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  const { t } = usePrefs();
  // Covers the whole page: a bottom sheet on narrow screens, a centred dialog on wider ones.
  return createPortal(
    <div className="vmode-portal fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="loc-h">
      <div className="v-sheet w-full rounded-t-3xl border border-line bg-solid p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:max-w-md md:rounded-3xl md:p-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />
        <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon name="pin" size={26} />
        </span>
        <h2 id="loc-h" className="text-xl font-extrabold">
          {t('v.loc.title')}
        </h2>
        <p className="mt-2">{t('v.loc.body')}</p>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted">
          <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-accent" /> {t('v.loc.privacy')}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="vbtn-2" onClick={onSkip}>
            {t('v.loc.skip')}
          </button>
          <button className="vbtn" onClick={onAllow}>
            {t('v.loc.allow')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MapChapter({ visit }: { visit: Visit }) {
  const { t, L, lang } = usePrefs();
  const navigate = useNavigate();
  const { data } = useHospital();
  const [stepFree, setStepFree] = useStepFree();
  const dept = data.departments.find((d) => d.id === visit.deptId);
  const dest = dept?.nodeId ?? resolveDestination(data, visit.deptId ?? '', visit.here) ?? 'junction';
  const geo = data.hospital.geo ?? sampleHospital.hospital.geo!;

  const [mode, setMode] = useState<Mode>(visit.loc === 'allowed' ? 'gps' : 'checkpoint');
  const [note, setNote] = useState<Note>(visit.loc === 'skipped' ? 'denied' : null);
  const [dot, setDot] = useState<Pt | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [pick, setPick] = useState(false);
  const detector = useRef(new OffRouteDetector());
  const weakSince = useRef<number | null>(null);

  const route = useMemo(() => findRoute(data, visit.here, dest, stepFree) ?? findRoute(data, visit.here, dest, false), [data, visit.here, dest, stepFree]);
  const arrived = visit.here === dest;
  const next = route && route.nodes.length > 1 ? route.steps[1] : null;
  const nextNode = route?.nodes[1] ?? null;
  const total = visit.done + Math.max(0, (route?.nodes.length ?? 1) - 1);
  const routeRef = useRef(route);
  routeRef.current = route;
  const visitRef = useRef(visit);
  visitRef.current = visit;

  useWakeLock(!arrived);

  const raiseAlert = (msg: string) => {
    setAlert(msg);
    navigator.vibrate?.([200, 100, 200]);
    softChime();
    notify(msg);
  };

  // On-device location: only while this screen is open and the visitor allowed it.
  useEffect(() => {
    if (mode !== 'gps' || arrived) return;
    if (!('geolocation' in navigator)) {
      setMode('checkpoint');
      setNote('denied');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const p = gpsToPlan(geo, pos.coords.latitude, pos.coords.longitude);
        const acc = pos.coords.accuracy;
        if (acc <= detector.current.maxAccuracyM && farFromPlan(p, geo.metersPerUnit)) {
          setMode('checkpoint');
          setNote('far');
          setDot(null);
          return;
        }
        if (acc > detector.current.maxAccuracyM) {
          weakSince.current ??= Date.now();
          if (Date.now() - weakSince.current > 20_000) setNote('weak');
          return;
        }
        weakSince.current = null;
        setNote(null);
        setDot(p);
        const r = routeRef.current;
        const v = visitRef.current;
        if (!r) return;
        // Reached the next point?
        const nn = data.landmarks.find((l) => l.id === r.nodes[1]);
        if (nn && Math.hypot(nn.x - p[0], nn.y - p[1]) * geo.metersPerUnit < 10) {
          detector.current.reset();
          updateVisit({ here: nn.id, done: v.done + 1 });
          return;
        }
        if (detector.current.push(p, acc, r.points, geo.metersPerUnit) === 'off') {
          const back = placeName(data, v.here, lang);
          raiseAlert(t('v.map.wrong', { place: back }));
          updateVisit({ here: nearestNode(data, p) });
        }
      },
      (err) => {
        // Only a real refusal switches to checkpoints. Indoors "unavailable" and "timeout" come and go:
        // keep listening, say location is not precise, and the checkpoint buttons keep working meanwhile.
        if (err.code === err.PERMISSION_DENIED) {
          setMode('checkpoint');
          setNote('denied');
        } else setNote('weak');
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, arrived, geo, data, lang]);

  const reached = (id: string) => {
    setPick(false);
    if (!route) return;
    const idx = route.nodes.indexOf(id);
    if (idx > 0) {
      updateVisit({ here: id, done: visit.done + idx });
    } else if (idx !== 0) {
      raiseAlert(t('v.map.wrongCheckpoint', { place: placeName(data, id, lang) }));
      updateVisit({ here: id });
    }
  };

  const viewBox = useMemo(() => focusBox(data, [visit.here, ...(route?.nodes.slice(1, 3) ?? [])], dot), [data, visit.here, route, dot]);

  return (
    <div className="grid gap-3">
      {visit.loc === 'unset' && (
        <LocationSheet
          onAllow={() => {
            updateVisit({ loc: 'allowed' });
            setMode('gps');
            setNote(null);
            if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission().catch(() => undefined);
          }}
          onSkip={() => {
            updateVisit({ loc: 'skipped' });
            setMode('checkpoint');
            setNote('denied');
          }}
        />
      )}

      {alert && (
        <div role="alert" className="v-shake flex items-start gap-3 rounded-2xl border border-[#D92D20]/60 bg-[#D92D20]/20 p-3">
          <Icon name="alert" size={22} className="mt-0.5 shrink-0 text-danger" />
          <div className="flex-1">
            <p className="font-bold">{alert}</p>
            <p className="text-sm text-muted">{t('v.map.rerouted')}</p>
          </div>
          <button className="vchip h-9" onClick={() => setAlert(null)}>
            {t('v.map.dismiss')}
          </button>
        </div>
      )}

      <div className="grid items-start gap-4 md:grid-cols-[1.4fr_1fr] md:gap-6">
      <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${mode === 'gps' ? 'bg-[#3b82f6]/15 text-[#93c5fd]' : 'bg-accent-soft text-accent'}`}>
          <Icon name={mode === 'gps' ? 'pin' : 'flag'} size={14} /> {mode === 'gps' ? t('v.map.gps') : t('v.map.checkpoint')}
        </span>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[#E0A800]" checked={stepFree} onChange={(e) => setStepFree(e.target.checked)} />
          <Icon name="wheelchair" size={16} /> {t('guide.stepFree')}
        </label>
      </div>
      {note && <p className="rounded-xl bg-solid p-2.5 text-sm text-muted">{t(`v.loc.${note}` as DictKey)}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-[var(--wm-plan-bg)]">
        <FloorPlan data={data} route={route} routeColor="#E0A800" viewBox={viewBox} dot={dot ? { x: dot[0], y: dot[1] } : null} drawKey={`${visit.here}-${stepFree}`} />
      </div>
      </div>
      <div className="grid gap-3">

      {arrived ? (
        <div className="v-stagger grid gap-3">
          <VCard className="flex items-center gap-3 border-[#3ccf7a]/40">
            <Icon name="flag" size={28} className="text-ok" />
            <div>
              <p className="text-lg font-extrabold">{t('v.map.arrived')}</p>
              {dept && <p className="text-muted">{L(dept.name)}</p>}
            </div>
          </VCard>
          <button className="vbtn v-glow" onClick={() => go(navigate, 'wait')}>
            <Icon name="clock" size={20} /> {t('v.map.toWait')}
          </button>
        </div>
      ) : (
        next &&
        nextNode && (
          <div className="v-stagger grid gap-3">
            <div key={visit.here} className="rounded-2xl border border-accent/40 bg-surface p-4">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span className="uppercase tracking-wide text-accent">{t('v.map.next')}</span>
                <span>{t('v.map.stepOf', { n: Math.min(total, visit.done + 1), total })}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
                  <Icon name={STEP_ICON[next.kind]} size={30} strokeWidth={2.6} />
                </span>
                <p className="flex-1 text-lg font-bold leading-snug">{stepText(next, data, lang)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-muted">{next.meters} m</span>
                <ListenButton texts={[stepText(next, data, lang)]} className="min-h-10 py-1 text-sm" />
              </div>
            </div>
            <button className="vbtn" onClick={() => reached(nextNode)}>
              <Icon name="check" size={20} /> {t('v.map.reached', { place: placeName(data, nextNode, lang) })}
            </button>
            <button className="vbtn-2" aria-expanded={pick} onClick={() => setPick(!pick)}>
              <Icon name="compass" size={18} className="text-accent" /> {t('v.map.elsewhere')}
            </button>
            {pick && (
              <VCard className="v-pop scroll-mb-24">
                <span ref={(el) => el?.closest('.v-pop')?.scrollIntoView({ block: 'center', behavior: 'smooth' })} />
                <p className="mb-2 text-sm font-semibold">{t('v.map.pick')}</p>
                <div className="flex flex-wrap gap-2">
                  {data.landmarks
                    .filter((l) => l.kind === 'landmark' && l.id !== visit.here)
                    .map((l) => (
                      <button key={l.id} className="vchip" onClick={() => reached(l.id)}>
                        <Icon name="pin" size={14} /> {L(l.name)}
                      </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-muted">{t('v.map.scanHint')}</p>
              </VCard>
            )}
          </div>
        )
      )}
      <div className="mt-1">
        <LostHelp landmarkId={visit.here} compact />
      </div>
      </div>
      </div>
    </div>
  );
}

// ---------- 4. Wait ----------

function Wait({ visit }: { visit: Visit }) {
  const { t, L, lang } = usePrefs();
  const navigate = useNavigate();
  const { data } = useHospital();
  const { backend, demo } = useStore();
  const { view } = useToken(visit.tokenId);
  const dept = data.departments.find((d) => d.id === visit.deptId);
  const now = Date.now();
  const closed = dept ? isOpen(dept, now) === false : false;
  const opensAt = dept && closed ? nextOpening(dept, now) : null;
  const base = dept?.nodeId ?? 'waiting';

  useEffect(() => {
    if (view?.status === 'called') go(navigate, 'turn');
  }, [view?.status, navigate]);

  // Demo mode only: the simulated department keeps calling tokens so the journey reaches "Your turn".
  // A closed department calls nobody, in the demo too.
  useEffect(() => {
    if (!demo || !visit.deptId || closed) return;
    const id = setInterval(() => void backend.queueOp(visit.deptId!, 'next'), 6000);
    return () => clearInterval(id);
  }, [demo, backend, visit.deptId, closed]);

  if (!visit.tokenId) return <Navigate to={chapterPath('slip')} replace />;
  const statusTone = view?.status === 'next' ? 'bg-accent text-on-accent' : view?.status === 'skipped' ? 'bg-[#D92D20] text-white' : 'bg-solid text-ink';

  return (
    <div className="v-stagger grid gap-4">
      <VTitle sub={t('v.wait.lead')}>{t('v.wait.title')}</VTitle>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface" aria-live="polite">
        <div className="h-2" style={{ background: dept?.color }} />
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="ltr text-[2.25rem] font-black leading-none">{visit.label}</p>
            {dept && <DeptBadge dept={dept} size={40} />}
          </div>
          {view ? (
            <>
              <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${statusTone}`}>{t(`token.status.${view.status}` as DictKey)}</p>
              {(view.status === 'waiting' || view.status === 'next') && (
                <div className="mt-3 grid gap-1">
                  <p className="font-bold">{view.ahead === 0 ? t('token.aheadNone') : view.ahead === 1 ? t('token.aheadOne') : t('token.ahead', { n: view.ahead })}</p>
                  {closed && dept ? (
                    <div className="mt-1 rounded-xl border border-warn/40 bg-warn/10 p-3">
                      <p className="font-bold text-warn">{t('v.wait.closed', { dept: L(dept.name) })}</p>
                      {opensAt && <p className="mt-0.5">{t('v.wait.opens', { when: openingWords(opensAt, now, { today: t('common.today'), tomorrow: t('common.tomorrow') }, lang) })}</p>}
                      <p className="mt-1 text-sm text-muted">{t('v.wait.closedHint')}</p>
                      {dept.bookable && (
                        <Link to={`/book?dept=${dept.id}`} className="vbtn mt-3 min-h-12 text-base">
                          <Icon name="calendar" size={18} /> {t('v.wait.bookTime')}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      {view.wait && <p>{t('token.wait', { min: view.wait.minMin, max: view.wait.maxMin })}</p>}
                      {view.wait && <p className="text-xs text-muted">{view.wait.measured ? t('token.waitMeasured') : t('token.waitConfig')}</p>}
                    </>
                  )}
                  {demo && <p className="text-xs font-bold text-accent">{t('common.simulation')} · {t('v.demoData')}</p>}
                </div>
              )}
            </>
          ) : (
            <p className="mt-3 text-muted">{t('common.loading')}</p>
          )}
        </div>
      </div>
      <ShareButton url={`${location.origin}/f/${visit.tokenId}`} title={t('token.share')} text={t('token.shareText', { label: visit.label ?? '' })} />

      <section aria-labelledby="near-h">
        <h2 id="near-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          {t('v.wait.near')} {data.sample && <span className="normal-case text-accent">· {t('v.demoData')}</span>}
        </h2>
        <FacilityGrid data={data} from={base} types={FACILITY_TYPES.filter((f) => f !== 'helpdesk')} />
      </section>

      {!closed && (
        <Link to={`/book${dept?.bookable ? `?dept=${dept.id}` : ''}`} className="vbtn-2 text-sm">
          <Icon name="calendar" size={18} className="text-accent" /> {t('v.wait.book')}
        </Link>
      )}
      {dept && <p className="text-xs text-muted">{L(dept.openHours)}</p>}
    </div>
  );
}

// ---------- 5. Your turn ----------

function Turn({ visit }: { visit: Visit }) {
  const { t, L } = usePrefs();
  const navigate = useNavigate();
  const { data } = useHospital();
  const dept = data.departments.find((d) => d.id === visit.deptId);
  useEffect(() => {
    navigator.vibrate?.([400, 150, 400, 150, 400]);
  }, []);
  return (
    <div className="v-stagger grid gap-4">
      <div className="turn-pulse rounded-3xl bg-[#15803d] p-6 text-center text-white">
        <Icon name="check" size={48} strokeWidth={2.6} className="mx-auto" />
        <p className="mt-2 text-[1.75rem] font-black">{t('v.turn.title')}</p>
        <p className="ltr mt-1 text-[2rem] font-black">{visit.label}</p>
        {dept && <p className="mt-1 font-semibold">{t('v.turn.go', { dept: L(dept.name) })}</p>}
      </div>
      {visit.tokenId && <Feedback tokenId={visit.tokenId} />}
      <section aria-labelledby="after-h" className="rounded-2xl border border-line bg-surface p-4">
        <h2 id="after-h" className="flex items-center gap-2 font-extrabold">
          <Icon name="clipboard" size={18} className="text-accent" /> {t('v.turn.after')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('followup.lead')}</p>
        <ul className="mt-3 grid gap-2 text-[0.9375rem]">
          {(['followup.r1', 'followup.r2', 'followup.r3'] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-1 shrink-0 text-accent" /> {t(k)}
            </li>
          ))}
          <li className="flex items-start gap-2 font-bold text-danger">
            <Icon name="siren" size={16} className="mt-1 shrink-0" /> {t('followup.r4')}
          </li>
        </ul>
        <Link to="/followup" className="vbtn-2 mt-4">
          <Icon name="printer" size={18} className="text-accent" /> {t('v.turn.openCard')}
        </Link>
      </section>
      <button
        className="vbtn-2"
        onClick={() => {
          safeStorage.set('wm_visit_ended', '1', true);
          endVisit();
          navigate('/');
        }}
      >
        <Icon name="flag" size={18} className="text-accent" /> {t('v.turn.finish')}
      </button>
    </div>
  );
}
