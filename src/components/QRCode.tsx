import { useMemo } from 'react';
import QR from 'qrcode';

/** QR code drawn as an SVG path (no innerHTML, prints sharply at any size). */
export function QRCode({ value, size = 160, label }: { value: string; size?: number; label?: string }) {
  const { d, n } = useMemo(() => {
    const q = QR.create(value, { errorCorrectionLevel: 'M' });
    const count = q.modules.size;
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (q.modules.get(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d: path, n: count + 8 };
  }, [value]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label ?? value} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
