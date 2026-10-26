// SVG floor plan: rooms, corridors (dashed where there are steps), landmarks, facilities,
// an optional route that draws itself, and an optional heatmap layer for insights.
import { useMemo } from 'react';
import type { HospitalData } from '../lib/types.ts';
import { edgePoints, polylineLength, toPath, type RouteResult } from '../lib/route.ts';
import { ICONS } from '../lib/icons.ts';
import { SHAPE_PATHS } from './DeptMark.tsx';
import { usePrefs } from '../lib/prefs.tsx';

interface Props {
  data: HospitalData;
  route?: RouteResult | null;
  showFacilities?: boolean;
  heat?: Record<string, number>;
  className?: string;
  routeColor?: string;
  /** Replay key: change it to redraw the route animation. */
  drawKey?: string | number;
  title?: string;
  /** Visitor position (on-device location or the demo's simulated walk). */
  dot?: { x: number; y: number; off?: boolean } | null;
  /** Zoom to a part of the plan, e.g. around the next step. */
  viewBox?: string;
  /** Facility to highlight (the destination). */
  highlight?: string;
}

export const PLAN_W = 1000;
export const PLAN_H = 640;

export function FloorPlan({ data, route, showFacilities, heat, className = '', routeColor, drawKey, title, dot, viewBox, highlight }: Props) {
  const { L, t } = usePrefs();
  const nodes = useMemo(() => new Map(data.landmarks.map((l) => [l.id, l])), [data.landmarks]);
  const routeLen = route ? Math.ceil(polylineLength(route.points)) + 10 : 0;
  const start = route ? nodes.get(route.from) : null;
  const end = route ? route.points[route.points.length - 1] : null;
  const maxHeat = heat ? Math.max(1, ...Object.values(heat)) : 1;
  const color = routeColor ?? 'var(--wm-accent)';

  return (
    <svg viewBox={viewBox ?? `0 0 ${PLAN_W} ${PLAN_H}`} className={`w-full h-auto ${className}`} role="img" aria-label={title ?? t('guide.planLabel')}>
      <rect x="0" y="0" width={PLAN_W} height={PLAN_H} rx="28" fill="var(--wm-plan-bg)" />
      <g opacity="0.5" stroke="var(--wm-line)" strokeWidth="1">
        {Array.from({ length: 19 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 50} y1="0" x2={(i + 1) * 50} y2={PLAN_H} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 50} x2={PLAN_W} y2={(i + 1) * 50} />
        ))}
      </g>

      {/* Corridors */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {data.edges.map((e) => {
          const pts = edgePoints(e, nodes, e.a);
          if (pts.length < 2) return null;
          return <path key={e.id} d={toPath(pts)} stroke="var(--wm-plan-corridor)" strokeWidth="26" />;
        })}
        {data.edges
          .filter((e) => !e.stepFree)
          .map((e) => {
            const pts = edgePoints(e, nodes, e.a);
            return pts.length > 1 ? <path key={`s${e.id}`} d={toPath(pts)} stroke="var(--wm-muted)" strokeWidth="14" strokeDasharray="3 7" strokeLinecap="butt" /> : null;
          })}
      </g>

      {/* Rooms */}
      {data.departments.map((d) => (
        <g key={d.id}>
          <rect x={d.room.x} y={d.room.y} width={d.room.w} height={d.room.h} rx="14" fill={d.color} fillOpacity="0.16" stroke={d.color} strokeWidth="3" />
          <g transform={`translate(${d.room.x + 8} ${d.room.y + Math.max(4, d.room.h / 2 - 17)}) scale(0.7)`}>
            <path d={SHAPE_PATHS[d.shape]} fill={d.color} />
            <g transform={d.shape === 'triangle' ? 'translate(15 19) scale(0.75)' : 'translate(12 12)'} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[d.icon]} />
            </g>
          </g>
          <text
            x={d.room.x + 46 + (d.room.w - 46) / 2}
            y={d.room.y + d.room.h / 2}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={d.room.h < 50 ? 19 : 23}
            fontWeight="700"
            fill="var(--wm-ink)"
          >
            {L(d.name).length > 16 ? L(d.name).split(/[ (]/)[0] : L(d.name)}
          </text>
        </g>
      ))}

      {/* Heatmap (insights) */}
      {heat &&
        Object.entries(heat).map(([id, n]) => {
          const l = nodes.get(id);
          if (!l) return null;
          const r = 18 + (n / maxHeat) * 52;
          return (
            <g key={`h${id}`}>
              <circle cx={l.x} cy={l.y} r={r} fill="#dc2626" fillOpacity={0.18 + (n / maxHeat) * 0.4} />
              <text x={l.x} y={l.y - r - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--wm-ink)">
                {n}
              </text>
            </g>
          );
        })}

      {/* Route */}
      {route && route.points.length > 1 && (
        <g key={drawKey ?? `${route.from}-${route.to}-${route.stepFree}`}>
          <path d={toPath(route.points)} fill="none" stroke="var(--wm-plan-bg)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={toPath(route.points)}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="route-draw"
            style={{ ['--len' as string]: routeLen }}
          />
        </g>
      )}

      {/* Landmarks */}
      {data.landmarks
        .filter((l) => l.kind !== 'door')
        .map((l) => {
          // Put the label above when a neighbour on the same row would collide with it.
          const crowded = data.landmarks.some((o) => o.id !== l.id && o.kind !== 'door' && Math.abs(o.y - l.y) < 20 && l.x - o.x > 0 && l.x - o.x < 220);
          return (
          <g key={l.id}>
            <circle cx={l.x} cy={l.y} r={l.kind === 'waypoint' ? 7 : 11} fill="var(--wm-surface-solid)" stroke="var(--wm-ink)" strokeWidth="3" />
            {route?.from !== l.id && <text x={l.x} y={l.y + (l.y > 590 || crowded ? -22 : 34)} textAnchor="middle" fontSize={l.kind === 'waypoint' ? 18 : 22} fontWeight="600" fill="var(--wm-muted)">
              {L(l.name)}
            </text>}
          </g>
          );
        })}

      {/* Facilities */}
      {showFacilities &&
        data.facilities.map((f) => {
          const on = f.id === highlight;
          return (
            <g key={f.id} transform={`translate(${f.x - 17} ${f.y - 17})`}>
              <title>{L(f.name)}</title>
              {on && <circle cx="17" cy="17" r="24" fill="var(--wm-accent)" opacity="0.35" className="pulse-ring" />}
              <rect width="34" height="34" rx="10" fill={on ? 'var(--wm-accent)' : 'var(--wm-surface-solid)'} stroke="var(--wm-accent)" strokeWidth="2.5" />
              <g transform="translate(5 5) scale(1)" fill="none" stroke={on ? '#0b0b0b' : 'var(--wm-accent)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[f.type]} />
              </g>
            </g>
          );
        })}

      {/* Visitor position */}
      {dot && (
        <g className="v-dot" style={{ transform: `translate(${dot.x}px, ${dot.y}px)` }}>
          <circle r="26" fill={dot.off ? '#D92D20' : '#3b82f6'} opacity="0.22" className="pulse-ring" />
          <circle r="12" fill={dot.off ? '#D92D20' : '#3b82f6'} stroke="#fff" strokeWidth="4" />
        </g>
      )}

      {/* Start and destination markers */}
      {start && (
        <g>
          <circle cx={start.x} cy={start.y} r="16" fill={color} className="pulse-ring" />
          <circle cx={start.x} cy={start.y} r="14" fill={color} stroke="#fff" strokeWidth="4" />
          <g transform={`translate(${start.x} ${start.y - 30})`}>
            <rect x="-72" y="-22" width="144" height="34" rx="17" fill="var(--wm-navy)" />
            <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="17" fontWeight="700">
              {t('guide.youAreHere')}
            </text>
          </g>
        </g>
      )}
      {end && (
        <g>
          <circle cx={end[0]} cy={end[1]} r="14" fill={color} className="pulse-ring" />
          <g transform={`translate(${end[0] - 14} ${end[1] - 38})`}>
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z" fill={color} stroke="#fff" strokeWidth="3" />
            <circle cx="14" cy="14" r="5" fill="#fff" />
          </g>
        </g>
      )}
    </svg>
  );
}
