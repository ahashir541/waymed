// Every department has a colour AND a shape AND an icon AND a written name, so colour is never the only signal.
import type { Department, Shape } from '../lib/types.ts';
import { ICONS } from '../lib/icons.ts';
import { usePrefs } from '../lib/prefs.tsx';

export const SHAPE_PATHS: Record<Shape, string> = {
  circle: 'M24 2a22 22 0 1 0 0 44a22 22 0 1 0 0-44z',
  square: 'M10 3h28a7 7 0 0 1 7 7v28a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7V10a7 7 0 0 1 7-7z',
  triangle: 'M24 2.5L46.5 44H1.5z',
  diamond: 'M24 1L47 24L24 47L1 24z',
  hexagon: 'M24 2L44 13.5v21L24 46L4 34.5v-21z',
};

export function DeptMark({ dept, size = 48, title }: { dept: Pick<Department, 'color' | 'shape' | 'icon'>; size?: number; title?: string }) {
  const tri = dept.shape === 'triangle';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="shrink-0">
      <path d={SHAPE_PATHS[dept.shape]} fill={dept.color} />
      <g transform={tri ? 'translate(15 19) scale(0.75)' : 'translate(12 12)'} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[dept.icon] ?? ICONS.helpdesk} />
      </g>
    </svg>
  );
}

export function DeptChip({ dept, size = 32, className = '' }: { dept: Department; size?: number; className?: string }) {
  const { L } = usePrefs();
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${className}`}>
      <DeptMark dept={dept} size={size} />
      <span>{L(dept.name)}</span>
    </span>
  );
}

/** Department identity for the visitor app: shape + icon + letter badge (never colour alone). */
export function DeptBadge({ dept, size = 44 }: { dept: Department; size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <DeptMark dept={dept} size={size} />
      <span
        aria-hidden="true"
        className="absolute -bottom-1 -end-1 grid place-items-center rounded-full border-2 border-[#0b0b0b] bg-[#f2f2f2] font-black text-[#0b0b0b]"
        style={{ width: size * 0.5, height: size * 0.5, fontSize: (dept.badge?.length ?? 1) > 1 ? size * 0.2 : size * 0.26 }}
      >
        {dept.badge ?? dept.name.en.trim()[0]?.toUpperCase()}
      </span>
    </span>
  );
}
