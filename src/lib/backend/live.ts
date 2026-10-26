// Live backend: talks to the WayMed server over HTTPS and receives realtime updates over SSE.
import type { Backend, Listener } from './types.ts';
import { ApiError } from './types.ts';
import { safeStorage } from '../prefs.tsx';

function deviceId(): string {
  // Random, per-device, used only for assistant rate limiting. Not linked to any person.
  let id = safeStorage.get('wm_device');
  if (!id) {
    id = crypto.randomUUID();
    safeStorage.set('wm_device', id);
  }
  return id;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'x-waymed': '1' } : {}),
      'x-device-id': deviceId(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string })?.error ?? 'http_error');
  return data as T;
}

/** One EventSource per endpoint carrying the union of all subscribed topics. */
class Stream {
  private listeners = new Map<string, Set<Listener>>();
  private es: EventSource | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private statusCbs = new Set<(online: boolean) => void>();
  online = typeof navigator === 'undefined' ? true : navigator.onLine;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  subscribe(topic: string, cb: Listener) {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    this.listeners.get(topic)!.add(cb);
    this.schedule();
    return () => {
      const set = this.listeners.get(topic);
      set?.delete(cb);
      if (set && set.size === 0) {
        this.listeners.delete(topic);
        this.schedule();
      }
    };
  }

  onStatus(cb: (online: boolean) => void) {
    this.statusCbs.add(cb);
    cb(this.online);
    return () => void this.statusCbs.delete(cb);
  }

  private setOnline(v: boolean) {
    if (v === this.online) return;
    this.online = v;
    for (const cb of this.statusCbs) cb(v);
  }

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.connect(), 30);
  }

  private connect() {
    this.es?.close();
    this.es = null;
    const topics = [...this.listeners.keys()];
    if (!topics.length) return;
    const es = new EventSource(`${this.endpoint}?topics=${encodeURIComponent(topics.join(','))}`, { withCredentials: true });
    this.es = es;
    es.onopen = () => this.setOnline(true);
    es.onerror = () => this.setOnline(false);
    const handler = (ev: MessageEvent) => {
      try {
        const { topic, data } = JSON.parse(ev.data) as { topic: string; data: unknown };
        for (const cb of this.listeners.get(topic) ?? []) cb(ev.type, data);
      } catch {
        /* ignore malformed */
      }
    };
    for (const name of ['queues', 'queue', 'token', 'token_missing', 'guide', 'guides', 'line', 'slots', 'hospital']) es.addEventListener(name, handler);
  }
}

export function createLiveBackend(): Backend {
  const pub = new Stream('/api/public/stream');
  const staff = new Stream('/api/staff/stream');
  return {
    mode: 'live',
    getHospital: () => api('GET', '/api/public/hospital'),
    subscribe: (t, cb) => pub.subscribe(t, cb),
    subscribeStaff: (t, cb) => staff.subscribe(t, cb),
    onStatus: (cb) => pub.onStatus(cb),
    lookupToken: async (label) => {
      try {
        return (await api<{ id: string }>('GET', `/api/public/tokens/lookup?label=${encodeURIComponent(label)}`)).id;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
        throw e;
      }
    },
    selfIssue: (deptId) => api('POST', '/api/public/tokens', { deptId }),
    getToken: async (id) => {
      try {
        return await api('GET', `/api/public/tokens/${encodeURIComponent(id)}`);
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null;
        throw e;
      }
    },
    slots: (doctorId) => api('GET', `/api/public/doctors/${encodeURIComponent(doctorId)}/slots`),
    book: (doctorId, slotStart) => api('POST', '/api/public/appointments', { doctorId, slotStart }),
    logEvent: (e) => {
      api('POST', '/api/public/events', e).catch(() => undefined);
    },
    requestGuide: (landmarkId, lang) => api('POST', '/api/public/guide-requests', { landmarkId, lang }),
    ask: (input) => api('POST', '/api/public/assistant', input),
    me: () => api('GET', '/api/auth/me'),
    login: (email, password) => api('POST', '/api/auth/login', { email, password }),
    logout: () => api('POST', '/api/auth/logout'),
    issueToken: (deptId, urgent, channel = 'desk') => api('POST', '/api/staff/tokens', { deptId, urgent, channel }),
    recentTokens: () => api('GET', '/api/staff/tokens/recent'),
    staffLine: (deptId) => api('GET', `/api/staff/queues/${encodeURIComponent(deptId)}`),
    queueOp: (deptId, op) => api('POST', `/api/staff/queues/${encodeURIComponent(deptId)}/${op}`),
    simulate: (deptId) => api('POST', `/api/staff/queues/${encodeURIComponent(deptId)}/simulate`),
    guides: () => api('GET', '/api/staff/guide-requests'),
    updateGuide: (id, status) => api('POST', `/api/staff/guide-requests/${encodeURIComponent(id)}`, { status }),
    setDoctorAvailable: (id, available) => api('POST', `/api/staff/doctors/${encodeURIComponent(id)}/availability`, { available }),
    setSlotBlocked: (id, slotStart, blocked) => api('POST', `/api/staff/doctors/${encodeURIComponent(id)}/blocks`, { slotStart, blocked }),
    putEntity: (kind, id, data) => api('PUT', `/api/admin/entities/${kind}/${encodeURIComponent(id)}`, data),
    deleteEntity: (kind, id) => api('DELETE', `/api/admin/entities/${kind}/${encodeURIComponent(id)}`),
    users: () => api('GET', '/api/admin/users'),
    createUser: (u) => api('POST', '/api/admin/users', u),
    updateUser: (id, patch) => api('PATCH', `/api/admin/users/${encodeURIComponent(id)}`, patch),
    audit: () => api('GET', '/api/admin/audit'),
    insights: (days) => api('GET', `/api/admin/insights?days=${days}`),
    insightsCsvUrl: (days) => `/api/admin/insights.csv?days=${days}`,
    health: () => api('GET', '/api/health'),
  };
}
