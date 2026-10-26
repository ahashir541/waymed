import { useEffect, useMemo, useState } from 'react';
import { FACILITY_TYPES, type HospitalData } from '../lib/types.ts';
import { findRoute, resolveDestination, deptAtNode, type RouteStep } from '../lib/route.ts';
import { stepText, placeName } from '../lib/directions.ts';
import { usePrefs, safeStorage } from '../lib/prefs.tsx';
import { useBackend } from '../lib/store.tsx';
import { speak, stopSpeaking, canSpeak, type ClipId } from '../lib/voice.ts';
import { MapViewport } from './MapViewport.tsx';
import { Icon } from './Icon.tsx';
import { DeptMark } from './DeptMark.tsx';

const STEP_ICON: Record<RouteStep['kind'], string> = {
  start: 'pin',
  straight: 'arrowUp',
  slight_left: 'slightLeft',
  slight_right: 'slightRight',
  left: 'arrowLeft',
  right: 'arrowRight',
  back: 'uturn',
  arrive: 'flag',
};
const STEP_CLIP: Partial<Record<RouteStep['kind'], ClipId>> = {
  straight: 'go_straight',
  slight_left: 'turn_left',
  left: 'turn_left',
  slight_right: 'turn_right',
  right: 'turn_right',
  arrive: 'arrived',
};

export function ListenButton({ texts, clips = [], className = '' }: { texts: string[]; clips?: ClipId[]; className?: string }) {
  const { t, lang } = usePrefs();
  const [note, setNote] = useState('');
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stopSpeaking(), []);
  if (!canSpeak() && lang !== 'sd') return null;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className={`btn ${className}`}
        aria-pressed={playing}
        onClick={async () => {
          if (playing) {
            stopSpeaking();
            setPlaying(false);
            return;
          }
          const how = await speak(texts, lang, clips);
          setNote(how === 'none' ? t('guide.voiceMissing') : '');
          setPlaying(how !== 'none');
          if (how !== 'none') setTimeout(() => setPlaying(false), Math.min(30000, texts.join(' ').length * 90));
        }}
      >
        <Icon name="speaker" />
        {playing ? t('common.stop') : t('common.listen')}
      </button>
      {note && (
        <span role="status" className="text-base text-muted">
          {note}
        </span>
      )}
    </span>
  );
}

export function useStepFree(): [boolean, (v: boolean) => void] {
  const [v, setV] = useState(() => safeStorage.get('wm_stepfree') === '1');
  return [
    v,
    (x: boolean) => {
      setV(x);
      safeStorage.set('wm_stepfree', x ? '1' : '0');
    },
  ];
}

interface Props {
  data: HospitalData;
  from: string;
  dest: string;
  emergency?: boolean;
  /** Bigger type and controls for kiosks. */
  kiosk?: boolean;
}

export function RouteView({ data, from, dest, emergency, kiosk }: Props) {
  const { t, L, lang } = usePrefs();
  const backend = useBackend();
  const [stepFree, setStepFree] = useStepFree();
  const [showFacilities, setShowFacilities] = useState(false);

  const target = useMemo(() => resolveDestination(data, dest, from, stepFree), [data, dest, from, stepFree]);
  const route = useMemo(() => (target ? findRoute(data, from, target, stepFree) : null), [data, from, target, stepFree]);
  const fallback = useMemo(() => (!route && stepFree && target ? findRoute(data, from, target, false) : null), [route, stepFree, target, data, from]);
  // A facility (e.g. washrooms) lives next to a graph node: continue the line to the facility itself.
  const facility = useMemo(() => {
    const byId = data.facilities.find((f) => f.id === dest);
    if (byId) return byId;
    if (!(FACILITY_TYPES as string[]).includes(dest) || !target) return null;
    return data.facilities.find((f) => f.type === dest && f.nodeId === target) ?? null;
  }, [data, dest, target]);
  const base = route ?? fallback;
  const shown = useMemo(() => (base && facility ? { ...base, points: [...base.points, [facility.x, facility.y] as [number, number]] } : base), [base, facility]);
  const dept = target && !facility ? deptAtNode(data, target) : null;
  const texts = shown
    ? shown.steps.map((s, i) =>
        facility && i === shown.steps.length - 1 ? t('guide.facilityHere', { facility: L(facility.name), place: placeName(data, target!, lang) }) : stepText(s, data, lang),
      )
    : [];
  useEffect(() => {
    if (facility) setShowFacilities(true);
  }, [facility]);

  useEffect(() => {
    if (target) backend.logEvent({ type: 'route_viewed', lang, deptId: dept?.id, value: dept ? undefined : /^[a-z_]+$/.test(dest) ? dest.slice(0, 24) : undefined });
    // log once per destination
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  if (!target) {
    return (
      <p role="alert" className="glass rounded-2xl p-5 text-lg">
        {t('guide.unknownDest')}
      </p>
    );
  }

  const title = dept ? dept : null;
  return (
    <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]" aria-label={t('guide.steps')}>
      <div className="glass rounded-3xl p-3 sm:p-4">
        {/* Opens fitted to the route; pinch or drag inside the map to look around. */}
        <MapViewport data={data} route={shown} showFacilities={showFacilities || !!facility} highlight={facility?.id} routeColor={emergency ? '#C81E3A' : (dept?.color ?? '#E0A800')} />
        <div className="no-print mt-3 flex flex-wrap gap-2">
          <label className={`chip ${kiosk ? 'min-h-14 text-xl' : ''}`}>
            <input type="checkbox" className="size-5 accent-teal-700" checked={stepFree} onChange={(e) => setStepFree(e.target.checked)} />
            <Icon name="wheelchair" />
            <span>
              {t('guide.stepFree')}
              <span className="sr-only">: {t('guide.stepFreeHint')}</span>
            </span>
          </label>
          <label className={`chip ${kiosk ? 'min-h-14 text-xl' : ''}`}>
            <input type="checkbox" className="size-5 accent-teal-700" checked={showFacilities} onChange={(e) => setShowFacilities(e.target.checked)} />
            <Icon name="water" />
            <span>{t('guide.showFacilities')}</span>
          </label>
        </div>
        {showFacilities && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-base text-muted" aria-label={t('guide.facilities')}>
            {(['water', 'washroom', 'seating', 'prayer', 'helpdesk'] as const).map((f) => (
              <li key={f} className="inline-flex items-center gap-1">
                <Icon name={f} size={20} className="text-accent" /> {t(`facility.${f}`)}
              </li>
            ))}
            {data.sample && <li className="font-semibold">· {t('common.sample')}</li>}
          </ul>
        )}
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {title && <DeptMark dept={title} size={kiosk ? 64 : 48} />}
          {facility && (
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
              <Icon name={facility.type} size={26} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className={`${kiosk ? 'text-4xl' : 'text-2xl'} font-bold leading-tight`}>{facility ? L(facility.name) : placeName(data, target, lang)}</h2>
            {facility && (
              <p className="flex items-center gap-1 text-muted">
                <Icon name="pin" size={15} /> {placeName(data, target, lang)}
              </p>
            )}
            {shown && <p className="text-muted">{t('guide.distance', { m: shown.meters })}</p>}
          </div>
          {shown && <ListenButton texts={texts} clips={shown.steps.map((s) => STEP_CLIP[s.kind]).filter((x): x is ClipId => !!x)} className={kiosk ? 'min-h-16 text-xl' : ''} />}
        </div>
        {!route && stepFree && (
          <p role="alert" className="mb-3 rounded-2xl border border-warn/40 bg-warn/10 p-3 font-semibold text-warn">
            <Icon name="alert" className="me-2 inline" />
            {t('guide.noRoute')}
          </p>
        )}
        {shown && (
          <ol className="grid gap-2" aria-live="polite">
            {shown.steps.map((s, i) => (
              <li key={i} className={`fade-up flex items-start gap-3 rounded-2xl border border-line bg-solid/60 p-3 ${kiosk ? 'text-2xl' : 'text-lg'}`} style={{ animationDelay: `${i * 90}ms` }}>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={STEP_ICON[s.kind]} size={kiosk ? 30 : 26} strokeWidth={2.4} />
                </span>
                <span className="pt-1.5">
                  <span className="sr-only">{i + 1}. </span>
                  {texts[i]}
                  {s.meters > 0 && <span className="ms-2 text-base text-muted">· {s.meters} m</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
        {dept && !dept.isEmergency && !emergency && <p className="mt-4 text-base text-muted">{t('guide.slipHint')}</p>}
      </div>
    </section>
  );
}
