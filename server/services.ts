// Business operations. Every write runs in a SQLite transaction; every change is pushed to
// subscribed devices through the realtime hub right after commit.
import { randomBytes, randomUUID } from 'node:crypto';
import type { DB, TokenRow } from './db.ts';
import { getHospitalData, rowToToken, tx } from './db.ts';
import type { Hub } from './realtime.ts';
import type { Config } from './config.ts';
import type { AnonEvent, Channel, GuideRequest, GuideStatus, Lang, QueueSummary, Slot, Token, TokenView } from '../src/lib/types.ts';
import { callNext, movingAverageSec, normalize, queueSummary, recallCurrent, skipCurrent, tokenLabel, tokenView, waitingLine } from '../src/lib/queue.ts';
import { doctorSlots, HOSPITAL_UTC_OFFSET_MIN } from '../src/lib/slots.ts';

export interface Ctx {
  db: DB;
  cfg: Config;
  hub: Hub;
  now: () => number;
}

export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const OFFSET_MS = HOSPITAL_UTC_OFFSET_MIN * 60_000;
export const localDay = (at: number) => new Date(at + OFFSET_MS).toISOString().slice(0, 10);
export const localHour = (at: number) => new Date(at + OFFSET_MS).getUTCHours();
const newId = () => randomBytes(12).toString('base64url');

/** Appointment tokens join the line this long before their slot. */
export const APPOINTMENT_LEAD_MS = 15 * 60_000;
/** Service-time samples longer than this are breaks, not service, and are ignored. */
const MAX_SAMPLE_SEC = 45 * 60;

// ---------- Aggregates (kept; counts only) ----------

export function bump(db: DB, metric: string, key: string, at: number, sum = 0) {
  db.prepare(
    `INSERT INTO aggregates (day, hour, metric, key, count, sum) VALUES (?, ?, ?, ?, 1, ?)
     ON CONFLICT(day, hour, metric, key) DO UPDATE SET count = count + 1, sum = sum + excluded.sum`,
  ).run(localDay(at), localHour(at), metric, key, sum);
}

// ---------- Queue ----------

function activeTokens(db: DB, deptId: string): Token[] {
  const rows = db.prepare("SELECT * FROM tokens WHERE dept_id = ? AND status IN ('waiting','next','called')").all(deptId) as unknown as TokenRow[];
  return rows.map(rowToToken);
}

export function avgFor(ctx: Ctx, deptId: string) {
  const dept = getHospitalData(ctx.db).departments.find((d) => d.id === deptId);
  const rows = ctx.db
    .prepare('SELECT seconds FROM service_samples WHERE dept_id = ? AND at > ? ORDER BY at DESC LIMIT 10')
    .all(deptId, ctx.now() - 4 * 3600_000) as { seconds: number }[];
  return movingAverageSec(rows.map((r) => r.seconds).reverse(), dept?.avgServiceMin ?? 10);
}

function writeTokens(db: DB, tokens: Token[]) {
  const st = db.prepare('UPDATE tokens SET status = ?, called_at = ?, recalled_at = ?, done_at = ? WHERE id = ?');
  for (const t of tokens) st.run(t.status, t.calledAt, t.recalledAt, t.doneAt, t.id);
}

interface IssueInput {
  deptId: string;
  priority: 0 | 1;
  channel: Channel;
  slotStart?: number;
  slotEnd?: number;
}

/** Create a token inside an existing transaction. */
function issueTokenTx(ctx: Ctx, input: IssueInput): Token {
  const { db } = ctx;
  const data = getHospitalData(db);
  const dept = data.departments.find((d) => d.id === input.deptId);
  if (!dept) throw new HttpError(400, 'unknown_department');
  const now = ctx.now();
  const day = localDay(now);
  const { last } = db
    .prepare('INSERT INTO counters (day, dept_id, last) VALUES (?, ?, 1) ON CONFLICT(day, dept_id) DO UPDATE SET last = last + 1 RETURNING last')
    .get(day, dept.id) as { last: number };
  const token: Token = {
    id: newId(),
    deptId: dept.id,
    number: last,
    label: tokenLabel(dept.code, last),
    status: 'waiting',
    priority: input.priority,
    channel: input.channel,
    createdAt: now,
    orderKey: input.slotStart ? input.slotStart - APPOINTMENT_LEAD_MS : now,
    calledAt: null,
    recalledAt: null,
    doneAt: null,
    expiresAt: now + ctx.cfg.retentionMs,
    slotStart: input.slotStart ?? null,
    slotEnd: input.slotEnd ?? null,
  };
  db.prepare(
    `INSERT INTO tokens (id, dept_id, number, label, day, status, priority, channel, created_at, order_key, expires_at, slot_start, slot_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(token.id, token.deptId, token.number, token.label, day, token.status, token.priority, token.channel, token.createdAt, token.orderKey, token.expiresAt, token.slotStart, token.slotEnd);
  const all = activeTokens(db, dept.id);
  writeTokens(db, normalize(all, dept.id));
  db.prepare('INSERT INTO events (type, channel, dept_id, at, expires_at) VALUES (?, ?, ?, ?, ?)').run('slip_issued', input.channel, dept.id, now, now + ctx.cfg.retentionMs);
  bump(db, 'event', 'slip_issued', now);
  bump(db, 'slip_dept', dept.id, now);
  bump(db, 'channel', input.channel, now);
  return all.find((t) => t.id === token.id) ?? token;
}

export function issueToken(ctx: Ctx, input: IssueInput): TokenView {
  const token = tx(ctx.db, () => issueTokenTx(ctx, input));
  publishDept(ctx, token.deptId);
  return getTokenView(ctx, token.id)!;
}

export type QueueOp = 'next' | 'recall' | 'skip';

export function operateQueue(ctx: Ctx, deptId: string, op: QueueOp) {
  if (!getHospitalData(ctx.db).departments.some((d) => d.id === deptId)) throw new HttpError(404, 'unknown_department');
  const result = tx(ctx.db, () => {
    const now = ctx.now();
    const tokens = activeTokens(ctx.db, deptId);
    const r = op === 'next' ? callNext(tokens, deptId, now) : op === 'skip' ? skipCurrent(tokens, deptId, now) : recallCurrent(tokens, deptId, now);
    writeTokens(ctx.db, r.changed);
    if (r.serviceSec !== null && r.serviceSec > 0 && r.serviceSec <= MAX_SAMPLE_SEC) {
      ctx.db.prepare('INSERT INTO service_samples (dept_id, seconds, at) VALUES (?, ?, ?)').run(deptId, r.serviceSec, now);
      bump(ctx.db, 'service', deptId, now, r.serviceSec);
    }
    if (r.waitSec !== null) bump(ctx.db, 'wait', deptId, now, r.waitSec);
    return r;
  });
  publishDept(ctx, deptId, result.changed.map((t) => t.id));
  return { called: result.called ? { id: result.called.id, label: result.called.label } : null };
}

export function getTokenView(ctx: Ctx, id: string): TokenView | null {
  const row = ctx.db.prepare('SELECT * FROM tokens WHERE id = ? AND expires_at > ?').get(id, ctx.now()) as TokenRow | undefined;
  if (!row) return null;
  const token = rowToToken(row);
  return tokenView(token, activeTokens(ctx.db, token.deptId), avgFor(ctx, token.deptId), ctx.now());
}

export function lookupLabel(ctx: Ctx, label: string): string | null {
  const row = ctx.db
    .prepare('SELECT id FROM tokens WHERE label = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1')
    .get(label, ctx.now()) as { id: string } | undefined;
  return row?.id ?? null;
}

export function summaryFor(ctx: Ctx, deptId: string): QueueSummary {
  return queueSummary(deptId, activeTokens(ctx.db, deptId), avgFor(ctx, deptId), ctx.now());
}

export function queueSummaries(ctx: Ctx): QueueSummary[] {
  return getHospitalData(ctx.db).departments.map((d) => summaryFor(ctx, d.id));
}

export function staffLine(ctx: Ctx, deptId: string) {
  const tokens = activeTokens(ctx.db, deptId);
  const line = waitingLine(tokens, deptId).map((t) => ({ id: t.id, label: t.label, status: t.status, priority: t.priority, channel: t.channel, createdAt: t.createdAt, slotStart: t.slotStart }));
  const called = tokens.filter((t) => t.status === 'called').map((t) => ({ id: t.id, label: t.label, calledAt: t.calledAt }));
  return { deptId, line, called };
}

export function recentTokens(ctx: Ctx, limit = 20) {
  return ctx.db
    .prepare('SELECT id, label, dept_id AS deptId, priority, created_at AS createdAt, status FROM tokens WHERE expires_at > ? ORDER BY created_at DESC LIMIT ?')
    .all(ctx.now(), limit);
}

/** Push fresh state for one department to every subscriber: board, phones and staff screens. */
export function publishDept(ctx: Ctx, deptId: string, alsoTokenIds: string[] = []) {
  const { hub } = ctx;
  hub.publish('queues', 'queue', summaryFor(ctx, deptId));
  if (hub.hasSubscribers(`staff:line:${deptId}`)) hub.publish(`staff:line:${deptId}`, 'line', staffLine(ctx, deptId));
  const ids = new Set(alsoTokenIds);
  for (const t of activeTokens(ctx.db, deptId)) ids.add(t.id);
  for (const id of ids) {
    if (!hub.hasSubscribers(`token:${id}`)) continue;
    const v = getTokenView(ctx, id);
    if (v) hub.publish(`token:${id}`, 'token', v);
  }
}

/** Demo tools only: add sample walk-in tokens. */
export function simulateQueue(ctx: Ctx, deptId: string, n = 4) {
  tx(ctx.db, () => {
    for (let i = 0; i < n; i++) issueTokenTx(ctx, { deptId, priority: 0, channel: 'desk' });
  });
  publishDept(ctx, deptId);
}

// ---------- Appointments ----------

function slotInputs(ctx: Ctx, doctorId: string) {
  const booked = new Set(
    (ctx.db.prepare('SELECT slot_start FROM appointments WHERE doctor_id = ? AND expires_at > ?').all(doctorId, ctx.now()) as { slot_start: number }[]).map((r) => r.slot_start),
  );
  const blocked = new Set((ctx.db.prepare('SELECT slot_start FROM slot_blocks WHERE doctor_id = ?').all(doctorId) as { slot_start: number }[]).map((r) => r.slot_start));
  return { booked, blocked };
}

export function slotsFor(ctx: Ctx, doctorId: string): Slot[] {
  const doctor = getHospitalData(ctx.db).doctors.find((d) => d.id === doctorId);
  if (!doctor) throw new HttpError(404, 'unknown_doctor');
  return doctorSlots(doctor, ctx.now(), slotInputs(ctx, doctorId));
}

/** Transactional booking. The UNIQUE (doctor_id, slot_start) constraint makes a double booking impossible. */
export function book(ctx: Ctx, doctorId: string, slotStart: number): TokenView {
  const data = getHospitalData(ctx.db);
  const doctor = data.doctors.find((d) => d.id === doctorId);
  if (!doctor) throw new HttpError(404, 'unknown_doctor');
  const dept = data.departments.find((d) => d.id === doctor.deptId);
  if (!dept?.bookable) throw new HttpError(400, 'not_bookable');
  const token = tx(ctx.db, () => {
    const slot = doctorSlots(doctor, ctx.now(), slotInputs(ctx, doctorId)).find((s) => s.start === slotStart);
    if (!slot || slot.status !== 'free') throw new HttpError(409, 'slot_unavailable');
    const t = issueTokenTx(ctx, { deptId: dept.id, priority: 0, channel: 'booking', slotStart: slot.start, slotEnd: slot.end });
    try {
      ctx.db
        .prepare('INSERT INTO appointments (id, doctor_id, slot_start, token_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), doctorId, slot.start, t.id, ctx.now(), t.expiresAt);
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new HttpError(409, 'slot_unavailable');
      throw e;
    }
    return t;
  });
  publishDept(ctx, dept.id);
  ctx.hub.publish(`slots:${doctorId}`, 'slots', slotsFor(ctx, doctorId));
  return getTokenView(ctx, token.id)!;
}

export function setSlotBlocked(ctx: Ctx, doctorId: string, slotStart: number, blocked: boolean) {
  if (!getHospitalData(ctx.db).doctors.some((d) => d.id === doctorId)) throw new HttpError(404, 'unknown_doctor');
  if (blocked) ctx.db.prepare('INSERT OR IGNORE INTO slot_blocks (doctor_id, slot_start, created_at) VALUES (?, ?, ?)').run(doctorId, slotStart, ctx.now());
  else ctx.db.prepare('DELETE FROM slot_blocks WHERE doctor_id = ? AND slot_start = ?').run(doctorId, slotStart);
  ctx.hub.publish(`slots:${doctorId}`, 'slots', slotsFor(ctx, doctorId));
}

export function nextFreeSlot(ctx: Ctx, deptId: string, lang: Lang) {
  const data = getHospitalData(ctx.db);
  let best: { doctor: string; start: number } | null = null;
  for (const d of data.doctors.filter((x) => x.deptId === deptId)) {
    const s = slotsFor(ctx, d.id).find((x) => x.status === 'free');
    if (s && (!best || s.start < best.start)) best = { doctor: d.name[lang] || d.name.en, start: s.start };
  }
  return best;
}

// ---------- Anonymous events ----------

/** Event types a visitor device may send. Others are recorded by the server itself. */
export const PUBLIC_EVENT_TYPES = new Set(['qr_scanned', 'kiosk_used', 'lost_help', 'feedback', 'route_viewed']);

export function recordEvent(ctx: Ctx, e: AnonEvent) {
  const now = ctx.now();
  const { db } = ctx;
  tx(db, () => {
    db.prepare('INSERT INTO events (type, lang, channel, dept_id, landmark_id, value, at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      e.type,
      e.lang ?? null,
      e.channel ?? null,
      e.deptId ?? null,
      e.landmarkId ?? null,
      e.value ?? null,
      now,
      now + ctx.cfg.retentionMs,
    );
    bump(db, 'event', e.type, now);
    if (e.lang) bump(db, 'lang', e.lang, now);
    if (e.type === 'qr_scanned') bump(db, 'channel', 'phone', now);
    if (e.type === 'kiosk_used') bump(db, 'channel', 'kiosk', now);
    if (e.type === 'lost_help' && e.landmarkId) bump(db, 'lost_landmark', e.landmarkId, now);
    if (e.type === 'guide_requested' && e.landmarkId) bump(db, 'guide_landmark', e.landmarkId, now);
    if (e.type === 'feedback' && e.value) bump(db, 'feedback', e.value, now);
    if (e.type === 'assistant_question_category' && e.value) bump(db, 'assistant_cat', e.value, now);
    if (e.type === 'route_viewed' && (e.deptId || e.value)) bump(db, 'route_dest', e.deptId || e.value!, now);
  });
}

// ---------- Guide requests ----------

interface GuideRow {
  id: string;
  landmark_id: string;
  lang: Lang;
  status: GuideStatus;
  created_at: number;
  updated_at: number;
}
const toGuide = (r: GuideRow): GuideRequest => ({ id: r.id, landmarkId: r.landmark_id, lang: r.lang, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at });

export function openGuides(ctx: Ctx): GuideRequest[] {
  return (ctx.db.prepare("SELECT * FROM guide_requests WHERE status != 'done' AND expires_at > ? ORDER BY created_at").all(ctx.now()) as unknown as GuideRow[]).map(toGuide);
}

export function getGuide(ctx: Ctx, id: string): GuideRequest | null {
  const r = ctx.db.prepare('SELECT * FROM guide_requests WHERE id = ? AND expires_at > ?').get(id, ctx.now()) as GuideRow | undefined;
  return r ? toGuide(r) : null;
}

export function createGuide(ctx: Ctx, landmarkId: string, lang: Lang): GuideRequest {
  if (!getHospitalData(ctx.db).landmarks.some((l) => l.id === landmarkId)) throw new HttpError(400, 'unknown_landmark');
  const now = ctx.now();
  const id = newId();
  ctx.db
    .prepare('INSERT INTO guide_requests (id, landmark_id, lang, status, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, landmarkId, lang, 'open', now, now, now + ctx.cfg.retentionMs);
  recordEvent(ctx, { type: 'guide_requested', landmarkId, lang });
  ctx.hub.publish('staff:guides', 'guides', openGuides(ctx));
  return getGuide(ctx, id)!;
}

export function updateGuide(ctx: Ctx, id: string, status: GuideStatus) {
  const r = ctx.db.prepare('UPDATE guide_requests SET status = ?, updated_at = ? WHERE id = ?').run(status, ctx.now(), id);
  if (!Number(r.changes)) throw new HttpError(404, 'unknown_request');
  const g = getGuide(ctx, id)!;
  ctx.hub.publish(`guide:${id}`, 'guide', g);
  ctx.hub.publish('staff:guides', 'guides', openGuides(ctx));
  return g;
}

// ---------- Retention ----------

/** Delete everything about visits older than the retention window. Aggregate counts stay. */
export function purgeExpired(ctx: Ctx) {
  const now = ctx.now();
  const cutoff = now - ctx.cfg.retentionMs;
  const { db } = ctx;
  const counts = tx(db, () => ({
    tokens: Number(db.prepare('DELETE FROM tokens WHERE expires_at <= ? OR created_at <= ?').run(now, cutoff).changes),
    events: Number(db.prepare('DELETE FROM events WHERE expires_at <= ? OR at <= ?').run(now, cutoff).changes),
    guides: Number(db.prepare('DELETE FROM guide_requests WHERE expires_at <= ? OR created_at <= ?').run(now, cutoff).changes),
    appointments: Number(db.prepare('DELETE FROM appointments WHERE expires_at <= ? OR created_at <= ?').run(now, cutoff).changes),
    samples: Number(db.prepare('DELETE FROM service_samples WHERE at <= ?').run(cutoff).changes),
    blocks: Number(db.prepare('DELETE FROM slot_blocks WHERE slot_start <= ?').run(cutoff).changes),
    sessions: Number(db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes),
    counters: Number(db.prepare('DELETE FROM counters WHERE day < ?').run(localDay(now - 2 * 24 * 3600_000)).changes),
    audit: Number(db.prepare('DELETE FROM audit WHERE at <= ?').run(now - 90 * 24 * 3600_000).changes),
  }));
  if (counts.tokens) for (const d of getHospitalData(db).departments) publishDept(ctx, d.id);
  return counts;
}

// ---------- Insights (from aggregates only) ----------

export interface KeyCount {
  key: string;
  count: number;
}

export function insights(ctx: Ctx, days: number) {
  const since = localDay(ctx.now() - (days - 1) * 24 * 3600_000);
  const rows = ctx.db.prepare('SELECT metric, key, hour, SUM(count) AS count, SUM(sum) AS sum FROM aggregates WHERE day >= ? GROUP BY metric, key, hour').all(since) as {
    metric: string;
    key: string;
    hour: number;
    count: number;
    sum: number;
  }[];
  const byKey = (metric: string): KeyCount[] => {
    const m = new Map<string, number>();
    for (const r of rows.filter((x) => x.metric === metric)) m.set(r.key, (m.get(r.key) ?? 0) + r.count);
    return [...m].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  };
  const avg = (metric: string) => {
    const m = new Map<string, { n: number; s: number }>();
    for (const r of rows.filter((x) => x.metric === metric)) {
      const cur = m.get(r.key) ?? { n: 0, s: 0 };
      m.set(r.key, { n: cur.n + r.count, s: cur.s + r.sum });
    }
    return [...m].map(([key, v]) => ({ key, n: v.n, avgSec: v.n ? Math.round(v.s / v.n) : 0 })).sort((a, b) => b.avgSec - a.avgSec);
  };
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: rows.filter((r) => r.metric === 'slip_dept' && r.hour === h).reduce((s, r) => s + r.count, 0),
  }));
  const fb = byKey('feedback');
  return {
    days,
    since,
    minN: 5,
    tokensByDept: byKey('slip_dept'),
    avgWaitByDept: avg('wait'),
    channels: byKey('channel'),
    languages: byKey('lang'),
    lostByLandmark: byKey('lost_landmark'),
    guidesByLandmark: byKey('guide_landmark'),
    feedback: { yes: fb.find((x) => x.key === 'yes')?.count ?? 0, no: fb.find((x) => x.key === 'no')?.count ?? 0 },
    hours,
    assistant: byKey('assistant_cat'),
  };
}

export function insightsCsv(ctx: Ctx, days: number): string {
  const since = localDay(ctx.now() - (days - 1) * 24 * 3600_000);
  const rows = ctx.db.prepare('SELECT day, hour, metric, key, count, sum FROM aggregates WHERE day >= ? ORDER BY day, hour, metric, key').all(since) as Record<string, string | number>[];
  const esc = (v: string | number) => {
    const s = String(v);
    // Neutralise spreadsheet formula injection and quote when needed.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return ['day,hour,metric,key,count,sum', ...rows.map((r) => [r.day, r.hour, r.metric, r.key, r.count, r.sum].map(esc).join(','))].join('\n');
}

// ---------- Audit ----------

export function audit(ctx: Ctx, user: { id: string; email: string } | null, action: string, target: string, detail?: unknown) {
  ctx.db.prepare('INSERT INTO audit (at, staff_id, staff_email, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)').run(
    ctx.now(),
    user?.id ?? null,
    user?.email ?? null,
    action,
    target,
    detail === undefined ? null : JSON.stringify(detail),
  );
}

export function auditLog(ctx: Ctx, limit = 200) {
  return ctx.db.prepare('SELECT id, at, staff_email AS who, action, target, detail FROM audit ORDER BY id DESC LIMIT ?').all(limit);
}
