// The visitor's current journey, kept only on this phone and cleared after 24 hours or when the visit ends.
import { useCallback, useEffect, useState } from 'react';
import { safeStorage } from './prefs.tsx';

export type Chapter = 'gate' | 'slip' | 'map' | 'wait' | 'turn';
export const CHAPTERS: Chapter[] = ['gate', 'slip', 'map', 'wait', 'turn'];

export interface Visit {
  startedAt: number;
  chapter: Chapter;
  need?: string;
  deptId?: string;
  tokenId?: string;
  label?: string;
  /** Location consent for this visit: never stored beyond the visit. */
  loc: 'unset' | 'allowed' | 'skipped';
  /** Last confirmed place on the plan (a graph node). */
  here: string;
  /** Steps completed so far, for "Step n of m". */
  done: number;
}

const KEY = 'wm_visit';
const TTL = 24 * 3600_000;
const listeners = new Set<() => void>();

function read(): Visit | null {
  try {
    const v = JSON.parse(safeStorage.get(KEY) ?? 'null') as Visit | null;
    if (!v || Date.now() - v.startedAt > TTL) return null;
    return v;
  } catch {
    return null;
  }
}

function write(v: Visit | null) {
  safeStorage.set(KEY, v ? JSON.stringify(v) : null);
  listeners.forEach((l) => l());
}

export function startVisit(): Visit {
  const v: Visit = { startedAt: Date.now(), chapter: 'gate', loc: 'unset', here: 'entrance', done: 0 };
  write(v);
  return v;
}

export function updateVisit(patch: Partial<Visit>) {
  const cur = read() ?? startVisit();
  write({ ...cur, ...patch });
  // The Map tab and the Emergency button start routes from the last confirmed place.
  if (patch.here) safeStorage.set('wm_here', patch.here, true);
}

export function endVisit() {
  write(null);
}

export function getVisit() {
  return read();
}

export function useVisit(): Visit | null {
  const [v, setV] = useState<Visit | null>(read);
  const sync = useCallback(() => setV(read()), []);
  useEffect(() => {
    listeners.add(sync);
    addEventListener('storage', sync);
    return () => {
      listeners.delete(sync);
      removeEventListener('storage', sync);
    };
  }, [sync]);
  return v;
}

export const chapterPath = (c: Chapter) => `/visit/${c}`;

/** What the visitor needs, mapped to a department. Emergency never gets a slip. */
export const NEEDS: { id: string; deptId: string; icon: string; letter: string }[] = [
  { id: 'emergency', deptId: 'emergency', icon: 'siren', letter: 'E' },
  { id: 'checkup', deptId: 'medicine', icon: 'stethoscope', letter: 'M' },
  { id: 'child', deptId: 'paediatrics', icon: 'child', letter: 'C' },
  { id: 'women', deptId: 'gynae', icon: 'woman', letter: 'W' },
  { id: 'surgery', deptId: 'surgery', icon: 'scalpel', letter: 'S' },
  { id: 'eye', deptId: 'eye', icon: 'eye', letter: 'E' },
  { id: 'ent', deptId: 'ent', icon: 'ear', letter: 'N' },
  { id: 'lab', deptId: 'lab', icon: 'flask', letter: 'L' },
  { id: 'xray', deptId: 'radiology', icon: 'xray', letter: 'X' },
  { id: 'medicine', deptId: 'pharmacy', icon: 'pill', letter: 'P' },
];
