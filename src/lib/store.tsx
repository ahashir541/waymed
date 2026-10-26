// Data hooks shared by all pages. Live data comes from the server; demo mode swaps in the in-browser backend.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HospitalData, QueueSummary, TokenView } from './types.ts';
import type { Backend } from './backend/types.ts';
import { createLiveBackend } from './backend/live.ts';
import { safeStorage } from './prefs.tsx';
import { sampleHospital } from '../data/sampleHospital.ts';

interface StoreCtx {
  backend: Backend;
  demo: boolean;
  setDemo: (v: boolean) => void;
}
const Ctx = createContext<StoreCtx | null>(null);

/** Static showcase build (no server): everything runs on demo data in the browser. */
export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === '1';

let live: Backend | null = null;
let demoB: Backend | null = null;

export function BackendProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState(() => STATIC_DEMO || location.pathname.startsWith('/demo') || safeStorage.get('wm_mode', true) === 'demo');
  const setDemo = useCallback((v: boolean) => {
    if (STATIC_DEMO) return; // the static showcase build has no server: always demo
    safeStorage.set('wm_mode', v ? 'demo' : null, true);
    setDemoState(v);
  }, []);
  // The demo backend is only downloaded when a tab enters demo mode.
  const [demoReady, setDemoReady] = useState(() => demoB !== null);
  useEffect(() => {
    if (!demo || demoB) return;
    let alive = true;
    void import('./backend/demo.ts').then((m) => {
      demoB ??= m.createDemoBackend();
      if (alive) setDemoReady(true);
    });
    return () => {
      alive = false;
    };
  }, [demo]);
  const backend = useMemo(() => (demo ? demoB : (live ??= createLiveBackend())), [demo, demoReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => (backend ? { backend, demo, setDemo } : null), [backend, demo, setDemo]);
  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('BackendProvider missing');
  return v;
}
export const useBackend = () => useStore().backend;

// ---------- Online state ----------

export function useOnline(): boolean {
  const backend = useBackend();
  const [net, setNet] = useState(() => navigator.onLine);
  const [stream, setStream] = useState(true);
  useEffect(() => {
    const on = () => setNet(true);
    const off = () => setNet(false);
    addEventListener('online', on);
    addEventListener('offline', off);
    const unsub = backend.onStatus(setStream);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', off);
      unsub();
    };
  }, [backend]);
  return net && stream;
}

// ---------- Hospital data (cached for offline directions) ----------

const HOSP_KEY = 'wm_hospital_cache';
function cachedHospital(): HospitalData | null {
  try {
    const raw = safeStorage.get(HOSP_KEY);
    return raw ? (JSON.parse(raw) as HospitalData) : null;
  } catch {
    return null;
  }
}

export function useHospital(): { data: HospitalData; ready: boolean; fromCache: boolean } {
  const { backend, demo } = useStore();
  const [data, setData] = useState<HospitalData | null>(() => (demo ? sampleHospital : cachedHospital()));
  const [fromCache, setFromCache] = useState(true);
  const load = useCallback(() => {
    backend
      .getHospital()
      .then((d) => {
        setData(d);
        setFromCache(false);
        if (backend.mode === 'live') safeStorage.set(HOSP_KEY, JSON.stringify(d));
      })
      .catch(() => setFromCache(true));
  }, [backend]);
  useEffect(() => {
    load();
    const versionRef = { v: -1 };
    return backend.subscribe('hospital', (_e, d) => {
      const v = (d as { version: number }).version;
      if (versionRef.v !== -1 && v !== versionRef.v) load();
      versionRef.v = v;
    });
  }, [backend, load]);
  return { data: data ?? sampleHospital, ready: data !== null, fromCache };
}

// ---------- Live queues (board, desk) ----------

export function useQueues() {
  const backend = useBackend();
  const [queues, setQueues] = useState<Record<string, QueueSummary>>(() => {
    try {
      return JSON.parse(safeStorage.get(`wm_queues_${backend.mode}`) ?? '{}');
    } catch {
      return {};
    }
  });
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  useEffect(
    () =>
      backend.subscribe('queues', (event, data) => {
        setQueues((prev) => {
          const next = { ...prev };
          if (event === 'queues') for (const q of data as QueueSummary[]) next[q.deptId] = q;
          else if (event === 'queue') next[(data as QueueSummary).deptId] = data as QueueSummary;
          safeStorage.set(`wm_queues_${backend.mode}`, JSON.stringify(next));
          return next;
        });
        setUpdatedAt(Date.now());
      }),
    [backend],
  );
  return { queues, updatedAt };
}

// ---------- One token (phone, family page, kiosk) ----------

export function useToken(id: string | undefined) {
  const backend = useBackend();
  const cacheKey = `wm_tok_${backend.mode}_${id}`;
  const [view, setView] = useState<TokenView | null>(() => {
    try {
      return id ? (JSON.parse(safeStorage.get(cacheKey) ?? 'null') as TokenView | null) : null;
    } catch {
      return null;
    }
  });
  const [missing, setMissing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(view?.updatedAt ?? null);
  useEffect(() => {
    if (!id) return;
    return backend.subscribe(`token:${id}`, (event, data) => {
      if (event === 'token_missing') {
        setMissing(true);
        return;
      }
      setMissing(false);
      setView(data as TokenView);
      setUpdatedAt(Date.now());
      safeStorage.set(cacheKey, JSON.stringify(data));
    });
  }, [backend, id, cacheKey]);
  return { view, missing, updatedAt };
}

// ---------- The slip saved on this phone (for landmark QR codes) ----------

export interface SavedToken {
  id: string;
  label: string;
  deptId: string;
  savedAt: number;
}

export function getSavedToken(mode: string): SavedToken | null {
  try {
    const t = JSON.parse(safeStorage.get(`wm_saved_${mode}`) ?? 'null') as SavedToken | null;
    return t && Date.now() - t.savedAt < 24 * 3600_000 ? t : null;
  } catch {
    return null;
  }
}
export function saveToken(mode: string, t: Omit<SavedToken, 'savedAt'>) {
  safeStorage.set(`wm_saved_${mode}`, JSON.stringify({ ...t, savedAt: Date.now() }));
}

export function useSavedToken() {
  const { backend } = useStore();
  return useMemo(() => getSavedToken(backend.mode), [backend.mode]);
}

/** Re-render every `ms` milliseconds (for relative times and countdowns). */
export function useTick(ms: number) {
  const [, setN] = useState(0);
  const ref = useRef(ms);
  ref.current = ms;
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ref.current);
    return () => clearInterval(id);
  }, []);
}
