// On-device location helpers for the wrong-turn alert. Nothing here is sent or stored:
// readings live in memory on the phone and the watcher stops when the visitor leaves the map.
import type { GeoRef, HospitalData } from './types.ts';
import type { Pt } from './route.ts';

const M_PER_DEG_LAT = 110_540;
const mPerDegLng = (lat: number) => 111_320 * Math.cos((lat * Math.PI) / 180);

/** GPS position to floor-plan coordinates (plan y grows downward, north is "up" before rotation). */
export function gpsToPlan(ref: GeoRef, lat: number, lng: number): Pt {
  const east = (lng - ref.lng) * mPerDegLng(ref.lat);
  const north = (lat - ref.lat) * M_PER_DEG_LAT;
  const r = (ref.rotationDeg * Math.PI) / 180;
  // Rotate world (east, north) into plan (right, up).
  const right = east * Math.cos(r) - north * Math.sin(r);
  const up = east * Math.sin(r) + north * Math.cos(r);
  return [ref.x + right / ref.metersPerUnit, ref.y - up / ref.metersPerUnit];
}

/** Inverse of gpsToPlan (used by the demo tour and tests to simulate walking). */
export function planToGps(ref: GeoRef, p: Pt): { lat: number; lng: number } {
  const right = (p[0] - ref.x) * ref.metersPerUnit;
  const up = (ref.y - p[1]) * ref.metersPerUnit;
  const r = (ref.rotationDeg * Math.PI) / 180;
  const east = right * Math.cos(r) + up * Math.sin(r);
  const north = -right * Math.sin(r) + up * Math.cos(r);
  return { lat: ref.lat + north / M_PER_DEG_LAT, lng: ref.lng + east / mPerDegLng(ref.lat) };
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function distToPolyline(p: Pt, pts: Pt[]): number {
  if (pts.length === 1) return Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]);
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, distToSegment(p, pts[i - 1], pts[i]));
  return best;
}

export function nearestNode(data: HospitalData, p: Pt, kinds: string[] = ['landmark', 'door', 'waypoint']): string {
  let best = data.landmarks[0]?.id ?? 'entrance';
  let bd = Infinity;
  for (const l of data.landmarks) {
    if (!kinds.includes(l.kind)) continue;
    const d = Math.hypot(l.x - p[0], l.y - p[1]);
    if (d < bd) {
      bd = d;
      best = l.id;
    }
  }
  return best;
}

/** True when a point is far outside the mapped area (wrong calibration, or the visitor is not at the hospital). */
export function farFromPlan(p: Pt, metersPerUnit: number, marginM = 150): boolean {
  const m = marginM / metersPerUnit;
  return p[0] < -m || p[1] < -m || p[0] > 1000 + m || p[1] > 640 + m;
}

export type Verdict = 'ignored' | 'on' | 'off';

/**
 * Decides when the visitor has really left the route. To avoid false alarms it
 * ignores readings worse than `maxAccuracyM` and needs `needed` consecutive off-route readings.
 */
export class OffRouteDetector {
  private streak = 0;
  readonly thresholdM: number;
  readonly maxAccuracyM: number;
  readonly needed: number;

  constructor(opts: { thresholdM?: number; maxAccuracyM?: number; needed?: number } = {}) {
    this.thresholdM = opts.thresholdM ?? 15;
    this.maxAccuracyM = opts.maxAccuracyM ?? 20;
    this.needed = opts.needed ?? 3;
  }

  reset() {
    this.streak = 0;
  }

  push(p: Pt, accuracyM: number, route: Pt[], metersPerUnit: number): Verdict {
    if (!Number.isFinite(accuracyM) || accuracyM > this.maxAccuracyM) return 'ignored';
    const offM = distToPolyline(p, route) * metersPerUnit;
    // A reading counts as off only when it is off even allowing for its own inaccuracy.
    if (offM > this.thresholdM + accuracyM / 2) {
      this.streak++;
      if (this.streak >= this.needed) {
        this.streak = 0;
        return 'off';
      }
      return 'on';
    }
    this.streak = 0;
    return 'on';
  }
}

/** A short, soft two-tone chime made with Web Audio (no sound files). */
export function softChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.17);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch {
    /* audio not available */
  }
}
