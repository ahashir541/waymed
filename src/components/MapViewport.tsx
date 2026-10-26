// Floor plan in a frame that opens fitted to the route (start and destination both visible), with
// pinch, drag and wheel zoom inside the map only, zoom buttons and "Re-centre". Labels are scaled so
// they never render below 11px on a phone.
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { FloorPlan, PLAN_H, PLAN_W } from './FloorPlan.tsx';
import { Icon } from './Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';

type View = { x: number; y: number; w: number };
const ASPECT = 0.66; // frame height / width (the plan itself is 0.64)
const MIN_W = 260;
const MAX_W = PLAN_W + 60;

function clampView(v: View): View {
  const w = Math.min(MAX_W, Math.max(MIN_W, v.w));
  const h = w * ASPECT;
  return { w, x: Math.min(Math.max(v.x, -30), PLAN_W + 30 - w), y: Math.min(Math.max(v.y, -30), Math.max(-30, PLAN_H + 30 - h)) };
}

/** View around a set of points, with padding, in the frame's aspect ratio. */
export function fitView(points: Array<[number, number]>, pad = 90): View {
  if (!points.length) return { x: 0, y: 0, w: PLAN_W };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs) - pad;
  const x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  const w = Math.max(x1 - x0, (y1 - y0) / ASPECT, MIN_W);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return clampView({ w, x: cx - w / 2, y: cy - (w * ASPECT) / 2 });
}

type Props = Omit<ComponentProps<typeof FloorPlan>, 'viewBox' | 'labelScale'> & { focus?: Array<[number, number]> };

export function MapViewport({ focus, ...plan }: Props) {
  const { t } = usePrefs();
  const frame = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(360);
  const pts = useMemo(() => focus ?? (plan.route?.points as Array<[number, number]> | undefined) ?? [], [focus, plan.route]);
  const home = useMemo(() => fitView(pts), [pts]);
  const [view, setView] = useState<View>(home);
  useEffect(() => setView(home), [home]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPx(el.clientWidth || 360));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pointer gestures: one finger pans, two fingers pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ d: number; cx: number; cy: number } | null>(null);
  const toPlan = (dx: number) => (dx * view.w) / px;
  const zoomAt = (factor: number, fx = 0.5, fy = 0.5) =>
    setView((v) => {
      const w = Math.min(MAX_W, Math.max(MIN_W, v.w * factor));
      return clampView({ w, x: v.x + (v.w - w) * fx, y: v.y + (v.w - w) * ASPECT * fy });
    });

  const unit = px / view.w;
  const labelScale = Math.min(2.4, Math.max(1, 12 / (20 * unit)));
  const moved = view.x !== home.x || view.y !== home.y || view.w !== home.w;

  return (
    <div className="relative">
      <div
        ref={frame}
        className="relative touch-none select-none overflow-hidden rounded-2xl"
        style={{ aspectRatio: `1 / ${ASPECT}` }}
        role="region"
        aria-label={t('guide.planLabel')}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          last.current = null;
        }}
        onPointerMove={(e) => {
          const prev = pointers.current.get(e.pointerId);
          if (!prev) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const ps = [...pointers.current.values()];
          if (ps.length === 1) {
            const dx = e.clientX - prev.x;
            const dy = e.clientY - prev.y;
            setView((v) => clampView({ ...v, x: v.x - toPlan(dx), y: v.y - toPlan(dy) }));
          } else if (ps.length === 2) {
            const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
            const r = frame.current!.getBoundingClientRect();
            const cx = ((ps[0].x + ps[1].x) / 2 - r.left) / r.width;
            const cy = ((ps[0].y + ps[1].y) / 2 - r.top) / r.height;
            if (last.current) zoomAt(last.current.d / d, cx, cy);
            last.current = { d, cx, cy };
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          last.current = null;
        }}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
        onWheel={(e) => {
          const r = frame.current!.getBoundingClientRect();
          zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        }}
      >
        <FloorPlan {...plan} viewBox={`${view.x} ${view.y} ${view.w} ${view.w * ASPECT}`} labelScale={labelScale} className="pointer-events-none absolute inset-0 h-full" />
      </div>
      <div className="no-print mt-2 flex items-center gap-1.5">
        {moved && (
          <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-solid px-3 text-sm font-bold" onClick={() => setView(home)}>
            <Icon name="compass" size={16} className="text-accent" /> {t('v.map.recentre')}
          </button>
        )}
        <span className="ms-auto" />
        <button type="button" className="grid size-10 place-items-center rounded-xl border border-line bg-solid text-lg font-black text-ink" onClick={() => zoomAt(1.3)} aria-label={t('v.map.zoomOut')}>
          −
        </button>
        <button type="button" className="grid size-10 place-items-center rounded-xl border border-line bg-solid text-ink" onClick={() => zoomAt(1 / 1.3)} aria-label={t('v.map.zoomIn')}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  );
}
