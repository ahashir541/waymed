import { ICONS } from '../lib/icons.ts';

interface Props {
  name: string;
  size?: number | string;
  className?: string;
  /** When set, the icon is announced to screen readers; otherwise it is decorative. */
  label?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, className, label, strokeWidth = 2 }: Props) {
  const d = ICONS[name] ?? ICONS.helpdesk;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
