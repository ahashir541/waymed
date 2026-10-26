// Demo backend for exhibitions and the presenter show. Runs entirely in this browser on SAMPLE data,
// syncs between tabs of the same browser (board, phone view, staff view) and NEVER calls the live API,
// so demo mode cannot write to production data.
import type { Backend, Insights, KeyCount, Listener } from './types.ts';
import { ApiError } from './types.ts';
import type { AnonEvent, GuideRequest, HospitalData, Lang, StaffUser, Token } from '../types.ts';
import { sampleHospital } from '../../data/sampleHospital.ts';
import { callNext, movingAverageSec, normalize, queueSummary, recallCurrent, skipCurrent, tokenLabel, tokenView, parseTokenLabel, waitingLine } from '../queue.ts';
import { doctorSlots, fmtTime } from '../slots.ts';
import { answerRules } from '../assistantRules.ts';
import { loadDictionary } from '../i18n/core.ts';
import { safeStorage } from '../prefs.tsx';

const KEY = 'wm_demo_v1';
const DAY = 24 * 3600_000;

interface DemoEvent extends AnonEvent {
  at: number;
}
interface State {
  hospital: HospitalData;
  tokens: Token[];
  counters: Record<string, number>;
  samples: Record<string, number[]>;
  appointments: { doctorId: string; slotStart: number; tokenId: string; at: number }[];
  blocks: { doctorId: string; slotStart: number }[];
  guides: GuideRequest[];
  events: DemoEvent[];
  waits: { deptId: string; sec: number; at: number }[];
}

const DEMO_USER: StaffUser = { id: 'demo', email: 'demo@waymed.local', name: 'Demo staff', role: 'admin', deptId: null, active: true };
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b % 64]).join('');

function freshState(): State {
  const s: State = { hospital: structuredClone(sampleHospital), tokens: [], counters: {}, samples: {}, appointments: [], blocks: [], guides: [], events: [], waits: [] };
  const now = Date.now();
  // A believable starting queue for the exhibition. Labeled "Simulation" everywhere it is shown.
  const start: Record<string, number> = { emergency: 2, paediatrics: 7, medicine: 6, lab: 5, pharmacy: 4 };
  for (const d of s.hospital.departments) {
    const n = start[d.id] ?? 3;
    for (let i = 0; i < n; i++) addToken(s, d.id, 0, 'desk', now - (n - i) * 4 * 60_000);
    callNext(s.tokens, d.id, now - 3 * 60_000);
    s.samples[d.id] = [d.avgServiceMin * 60 * 0.9, d.avgServiceMin * 60 * 1.1, d.avgServiceMin * 60];
  }
  return s;
}

function addToken(s: State, deptId: string, priority: 0 | 1, channel: Token['channel'], at: number, slot?: { start: number; end: number }): Token {
  const dept = s.hospital.departments.find((d) => d.id === deptId);
  if (!dept) throw new ApiError(400, 'unknown_department');
  const n = (s.counters[deptId] = (s.counters[deptId] ?? 0) + 1);
  const t: Token = {
    id: rid().slice(0, 16),
    deptId,
    number: n,
    label: tokenLabel(dept.code, n),
    status: 'waiting',
    priority,
    channel,
    createdAt: at,
    orderKey: slot ? slot.start - 15 * 60_000 : at,
    calledAt: null,
    recalledAt: null,
    doneAt: null,
    expiresAt: at + DAY,
    slotStart: slot?.start ?? null,
    slotEnd: slot?.end ?? null,
  };
  s.tokens.push(t);
  normalize(s.tokens, deptId);
  s.events.push({ type: 'slip_issued', channel, deptId, at });
  return t;
}

export function createDemoBackend(): Backend {
  let state: State = load();
  const listeners = new Map<string, Set<Listener>>();
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wm_demo') : null;

  function load(): State {
    try {
      const raw = safeStorage.get(KEY);
      if (raw) {
        const s = JSON.parse(raw) as State;
        // Always demo on the current sample hospital (names and map may have changed since last time).
        s.hospital = structuredClone(sampleHospital);
        s.tokens = s.tokens.filter((t) => t.expiresAt > Date.now());
        return s;
      }
    } catch {
      /* fall through */
    }
    return freshState();
  }
  function save() {
    safeStorage.set(KEY, JSON.stringify(state));
    channel?.postMessage('changed');
  }
  channel?.addEventListener('message', () => {
    state = load();
    emitAll();
  });

  const avg = (deptId: string) => movingAverageSec(state.samples[deptId] ?? [], state.hospital.departments.find((d) => d.id === deptId)?.avgServiceMin ?? 10);
  const summaries = () => state.hospital.departments.map((d) => queueSummary(d.id, state.tokens, avg(d.id), Date.now()));
  const view = (id: string) => {
    const t = state.tokens.find((x) => x.id === id);
    return t ? tokenView(t, state.tokens, avg(t.deptId), Date.now()) : null;
  };
  const slotsOf = (doctorId: string) => {
    const doc = state.hospital.doctors.find((d) => d.id === doctorId);
    if (!doc) throw new ApiError(404, 'unknown_doctor');
    return doctorSlots(doc, Date.now(), {
      booked: new Set(state.appointments.filter((a) => a.doctorId === doctorId).map((a) => a.slotStart)),
      blocked: new Set(state.blocks.filter((b) => b.doctorId === doctorId).map((b) => b.slotStart)),
    });
  };
  const staffLine = (deptId: string) => ({
    deptId,
    line: waitingLine(state.tokens, deptId).map((t) => ({ id: t.id, label: t.label, status: t.status, priority: t.priority, channel: t.channel, createdAt: t.createdAt, slotStart: t.slotStart })),
    called: state.tokens.filter((t) => t.deptId === deptId && t.status === 'called').map((t) => ({ id: t.id, label: t.label, calledAt: t.calledAt })),
  });
  const openGuides = () => state.guides.filter((g) => g.status !== 'done');

  function snapshot(topic: string): { event: string; data: unknown } | null {
    if (topic === 'queues') return { event: 'queues', data: summaries() };
    if (topic === 'hospital') return { event: 'hospital', data: { version: state.hospital.version } };
    if (topic.startsWith('token:')) {
      const v = view(topic.slice(6));
      return v ? { event: 'token', data: v } : { event: 'token_missing', data: {} };
    }
    if (topic.startsWith('guide:')) {
      const g = state.guides.find((x) => x.id === topic.slice(6));
      return g ? { event: 'guide', data: g } : null;
    }
    if (topic.startsWith('slots:')) {
      try {
        return { event: 'slots', data: slotsOf(topic.slice(6)) };
      } catch {
        return null;
      }
    }
    if (topic === 'staff:guides') return { event: 'guides', data: openGuides() };
    if (topic.startsWith('staff:line:')) return { event: 'line', data: staffLine(topic.slice(11)) };
    return null;
  }
  function emitAll() {
    for (const [topic, set] of listeners) {
      const snap = snapshot(topic);
      if (snap) for (const cb of set) cb(snap.event, snap.data);
    }
  }
  function mutate<T>(fn: () => T): T {
    const out = fn();
    save();
    setTimeout(emitAll, 0);
    return out;
  }
  function subscribe(topic: string, cb: Listener) {
    if (!listeners.has(topic)) listeners.set(topic, new Set());
    listeners.get(topic)!.add(cb);
    const snap = snapshot(topic);
    if (snap) setTimeout(() => cb(snap.event, snap.data), 0);
    return () => void listeners.get(topic)?.delete(cb);
  }
  function op(deptId: string, kind: 'next' | 'recall' | 'skip') {
    mutate(() => {
      const now = Date.now();
      const r = kind === 'next' ? callNext(state.tokens, deptId, now) : kind === 'skip' ? skipCurrent(state.tokens, deptId, now) : recallCurrent(state.tokens, deptId, now);
      if (r.serviceSec && r.serviceSec <= 2700) (state.samples[deptId] ??= []).push(r.serviceSec);
      if (r.waitSec !== null) state.waits.push({ deptId, sec: r.waitSec, at: now });
    });
  }

  return {
    mode: 'demo',
    getHospital: async () => state.hospital,
    subscribe,
    subscribeStaff: subscribe,
    onStatus: (cb) => {
      cb(true);
      return () => undefined;
    },
    lookupToken: async (label) => {
      const p = parseTokenLabel(label);
      return state.tokens.filter((t) => t.label === p).sort((a, b) => b.createdAt - a.createdAt)[0]?.id ?? null;
    },
    selfIssue: async (deptId) => mutate(() => view(addToken(state, deptId, 0, 'phone', Date.now()).id)!),
    getToken: async (id) => view(id),
    slots: async (doctorId) => slotsOf(doctorId),
    book: async (doctorId, slotStart) =>
      mutate(() => {
        const doc = state.hospital.doctors.find((d) => d.id === doctorId);
        const slot = slotsOf(doctorId).find((s) => s.start === slotStart);
        if (!doc || !slot || slot.status !== 'free') throw new ApiError(409, 'slot_unavailable');
        const t = addToken(state, doc.deptId, 0, 'booking', Date.now(), slot);
        state.appointments.push({ doctorId, slotStart, tokenId: t.id, at: Date.now() });
        return view(t.id)!;
      }),
    logEvent: (e) => mutate(() => void state.events.push({ ...e, at: Date.now() })),
    requestGuide: async (landmarkId, lang) =>
      mutate(() => {
        const g: GuideRequest = { id: rid().slice(0, 16), landmarkId, lang, status: 'open', createdAt: Date.now(), updatedAt: Date.now() };
        state.guides.push(g);
        state.events.push({ type: 'guide_requested', landmarkId, lang, at: Date.now() });
        return g;
      }),
    ask: async (input) => {
      await loadDictionary(input.lang as Lang);
      const r = answerRules(input.message, {
        data: state.hospital,
        lang: input.lang as Lang,
        from: input.from ?? 'entrance',
        token: input.tokenId ? view(input.tokenId) : null,
        nextSlot: (deptId) => {
          let best: { doctor: string; start: number } | null = null;
          for (const d of state.hospital.doctors.filter((x) => x.deptId === deptId)) {
            const s = slotsOf(d.id).find((x) => x.status === 'free');
            if (s && (!best || s.start < best.start)) best = { doctor: d.name[input.lang] || d.name.en, start: s.start };
          }
          return best ? { doctor: best.doctor, time: fmtTime(best.start) } : null;
        },
      });
      mutate(() => void state.events.push({ type: 'assistant_question_category', value: r.category, lang: input.lang, at: Date.now() }));
      return r;
    },
    me: async () => ({ user: DEMO_USER, demoTools: true }),
    login: async () => DEMO_USER,
    logout: async () => undefined,
    issueToken: async (deptId, urgent, ch = 'desk') => mutate(() => view(addToken(state, deptId, urgent ? 1 : 0, ch, Date.now()).id)!),
    recentTokens: async () =>
      [...state.tokens]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20)
        .map((t) => ({ id: t.id, label: t.label, deptId: t.deptId, priority: t.priority, createdAt: t.createdAt, status: t.status })),
    staffLine: async (deptId) => staffLine(deptId),
    queueOp: async (deptId, kind) => op(deptId, kind),
    simulate: async (deptId) =>
      mutate(() => {
        for (let i = 0; i < 4; i++) addToken(state, deptId, 0, 'desk', Date.now());
      }),
    guides: async () => openGuides(),
    updateGuide: async (id, status) =>
      mutate(() => {
        const g = state.guides.find((x) => x.id === id);
        if (g) Object.assign(g, { status, updatedAt: Date.now() });
      }),
    setDoctorAvailable: async (id, available) =>
      mutate(() => {
        const d = state.hospital.doctors.find((x) => x.id === id);
        if (d) d.available = available;
      }),
    setSlotBlocked: async (doctorId, slotStart, blocked) =>
      mutate(() => {
        state.blocks = state.blocks.filter((b) => !(b.doctorId === doctorId && b.slotStart === slotStart));
        if (blocked) state.blocks.push({ doctorId, slotStart });
      }),
    putEntity: async (kind, id, data) =>
      mutate(() => {
        const listKey = ({ department: 'departments', landmark: 'landmarks', edge: 'edges', facility: 'facilities', doctor: 'doctors', kiosk: 'kiosks' } as const)[kind as 'department'];
        if (kind === 'hospital') state.hospital.hospital = data as HospitalData['hospital'];
        else if (listKey) {
          const list = state.hospital[listKey] as { id: string }[];
          const i = list.findIndex((x) => x.id === id);
          if (i >= 0) list[i] = data as { id: string };
          else list.push(data as { id: string });
        }
        state.hospital.version++;
        return state.hospital;
      }),
    deleteEntity: async (kind, id) =>
      mutate(() => {
        const listKey = ({ department: 'departments', landmark: 'landmarks', edge: 'edges', facility: 'facilities', doctor: 'doctors', kiosk: 'kiosks' } as const)[kind as 'department'];
        if (listKey) (state.hospital as unknown as Record<string, { id: string }[]>)[listKey] = (state.hospital[listKey] as { id: string }[]).filter((x) => x.id !== id);
        state.hospital.version++;
        return state.hospital;
      }),
    users: async () => [DEMO_USER],
    createUser: async () => {
      throw new ApiError(403, 'demo_mode');
    },
    updateUser: async () => {
      throw new ApiError(403, 'demo_mode');
    },
    audit: async () => [],
    insights: async (days) => demoInsights(state, days),
    insightsCsvUrl: () => null,
    health: async () => ({ ok: true, db: true, realtimeClients: listeners.size, llm: false, time: Date.now() }),
  };
}

/** Insights computed from the interactions made in this demo session (real counts of demo use). */
function demoInsights(s: State, days: number): Insights {
  const since = Date.now() - days * DAY;
  const ev = s.events.filter((e) => e.at >= since);
  const count = (pick: (e: DemoEvent) => string | undefined | false, list = ev): KeyCount[] => {
    const m = new Map<string, number>();
    for (const e of list) {
      const k = pick(e);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([key, c]) => ({ key, count: c })).sort((a, b) => b.count - a.count);
  };
  const waits = new Map<string, { n: number; s: number }>();
  for (const w of s.waits) {
    const cur = waits.get(w.deptId) ?? { n: 0, s: 0 };
    waits.set(w.deptId, { n: cur.n + 1, s: cur.s + w.sec });
  }
  const fb = ev.filter((e) => e.type === 'feedback');
  return {
    days,
    since: new Date(since).toISOString().slice(0, 10),
    minN: 5,
    tokensByDept: count((e) => e.type === 'slip_issued' && e.deptId),
    avgWaitByDept: [...waits].map(([key, v]) => ({ key, n: v.n, avgSec: Math.round(v.s / v.n) })).sort((a, b) => b.avgSec - a.avgSec),
    channels: count((e) => (e.type === 'qr_scanned' ? 'phone' : e.type === 'kiosk_used' ? 'kiosk' : e.type === 'slip_issued' ? e.channel : false)),
    languages: count((e) => e.lang),
    lostByLandmark: count((e) => e.type === 'lost_help' && e.landmarkId),
    guidesByLandmark: count((e) => e.type === 'guide_requested' && e.landmarkId),
    feedback: { yes: fb.filter((e) => e.value === 'yes').length, no: fb.filter((e) => e.value === 'no').length },
    hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: ev.filter((e) => e.type === 'slip_issued' && new Date(e.at + 5 * 3600_000).getUTCHours() === h).length })),
    assistant: count((e) => e.type === 'assistant_question_category' && e.value),
  };
}

/** Exhibition helper: advance one random department, used by the demo board's auto mode. */
export function demoTick(b: Backend, depts: string[]) {
  if (b.mode !== 'demo' || !depts.length) return;
  const d = depts[Math.floor(Math.random() * depts.length)];
  if (Math.random() < 0.35) void b.issueToken(d, false);
  else void b.queueOp(d, 'next');
}

export function resetDemo() {
  safeStorage.set(KEY, null);
}
