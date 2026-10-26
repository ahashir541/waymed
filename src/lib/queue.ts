// Queue logic, pure functions. The server applies these inside a SQLite transaction;
// demo mode applies them to an in-memory list.
import type { QueueSummary, Token, TokenView, WaitRange } from './types.ts';

export const LINE_STATUSES = new Set(['waiting', 'next']);

/** Urgent first, then by order key (arrival time, or slot time for appointments), then number. */
export function compareQueue(a: Token, b: Token): number {
  return b.priority - a.priority || a.orderKey - b.orderKey || a.number - b.number;
}

export function waitingLine(tokens: Token[], deptId: string): Token[] {
  return tokens.filter((t) => t.deptId === deptId && LINE_STATUSES.has(t.status)).sort(compareQueue);
}

export function currentlyCalled(tokens: Token[], deptId: string): Token | null {
  const called = tokens.filter((t) => t.deptId === deptId && t.status === 'called');
  called.sort((a, b) => (b.calledAt ?? 0) - (a.calledAt ?? 0));
  return called[0] ?? null;
}

/** First in line becomes `next`, everybody else `waiting`. Returns the tokens that changed. */
export function normalize(tokens: Token[], deptId: string): Token[] {
  const changed: Token[] = [];
  waitingLine(tokens, deptId).forEach((t, i) => {
    const want = i === 0 ? 'next' : 'waiting';
    if (t.status !== want) {
      t.status = want;
      changed.push(t);
    }
  });
  return changed;
}

export interface QueueOpResult {
  changed: Token[];
  called: Token | null;
  /** Seconds between the previous call and this one: one service-time sample. */
  serviceSec: number | null;
  /** Seconds the newly called walk-in token waited. */
  waitSec: number | null;
}

function callFirst(tokens: Token[], deptId: string, now: number, changed: Set<Token>): Token | null {
  const first = waitingLine(tokens, deptId)[0] ?? null;
  if (first) {
    first.status = 'called';
    first.calledAt = now;
    first.recalledAt = null;
    changed.add(first);
  }
  for (const t of normalize(tokens, deptId)) changed.add(t);
  return first;
}

/** Staff pressed Next: finish the current token and call the next one in line. Mutates tokens. */
export function callNext(tokens: Token[], deptId: string, now: number): QueueOpResult {
  const changed = new Set<Token>();
  const cur = currentlyCalled(tokens, deptId);
  let serviceSec: number | null = null;
  for (const t of tokens) {
    if (t.deptId === deptId && t.status === 'called') {
      t.status = 'done';
      t.doneAt = now;
      changed.add(t);
    }
  }
  if (cur?.calledAt) serviceSec = Math.round((now - cur.calledAt) / 1000);
  const called = callFirst(tokens, deptId, now, changed);
  const waitSec = called && called.channel !== 'booking' ? Math.round((now - called.createdAt) / 1000) : null;
  return { changed: [...changed], called, serviceSec, waitSec };
}

/** Staff pressed Skip: the called person did not come. Mark missed and call the next one. */
export function skipCurrent(tokens: Token[], deptId: string, now: number): QueueOpResult {
  const changed = new Set<Token>();
  const cur = currentlyCalled(tokens, deptId);
  if (cur) {
    cur.status = 'skipped';
    cur.doneAt = now;
    changed.add(cur);
  }
  const called = callFirst(tokens, deptId, now, changed);
  const waitSec = called && called.channel !== 'booking' ? Math.round((now - called.createdAt) / 1000) : null;
  return { changed: [...changed], called, serviceSec: null, waitSec };
}

/** Staff pressed Recall: announce the current token again. */
export function recallCurrent(tokens: Token[], deptId: string, now: number): QueueOpResult {
  const cur = currentlyCalled(tokens, deptId);
  if (cur) cur.recalledAt = now;
  return { changed: cur ? [cur] : [], called: cur, serviceSec: null, waitSec: null };
}

/**
 * Moving average of recent service times. Needs at least 3 real samples, otherwise falls back
 * to the department's configured average and says so (measured = false).
 */
export function movingAverageSec(samples: number[], fallbackMin: number): { avgSec: number; measured: boolean } {
  const recent = samples
    .slice(-10)
    .map((s) => Math.min(3600, Math.max(30, s)));
  if (recent.length < 3) return { avgSec: fallbackMin * 60, measured: false };
  const sorted = [...recent].sort((a, b) => a - b);
  // Trim the extremes once there is enough data, so one long consultation does not dominate.
  const trimmed = sorted.length >= 6 ? sorted.slice(1, -1) : sorted;
  return { avgSec: trimmed.reduce((s, x) => s + x, 0) / trimmed.length, measured: true };
}

const floor5 = (m: number) => Math.max(0, Math.floor(m / 5) * 5);
const ceil5 = (m: number) => Math.max(5, Math.ceil(m / 5) * 5);

/** Estimated wait as a range in minutes, rounded to 5 so it never claims false precision. */
export function estimateWait(ahead: number, avgSec: number, measured: boolean): WaitRange {
  const avgMin = avgSec / 60;
  const base = ahead * avgMin;
  const minMin = floor5(base * 0.7);
  let maxMin = ceil5(base * 1.3 + avgMin);
  if (maxMin <= minMin) maxMin = minMin + 5;
  return { minMin, maxMin, measured };
}

export function tokenView(token: Token, deptTokens: Token[], avg: { avgSec: number; measured: boolean }, now: number): TokenView {
  const line = waitingLine(deptTokens, token.deptId);
  const idx = line.findIndex((t) => t.id === token.id);
  const ahead = idx < 0 ? 0 : idx;
  const inLine = LINE_STATUSES.has(token.status);
  return {
    id: token.id,
    label: token.label,
    deptId: token.deptId,
    status: token.status,
    ahead,
    wait: inLine ? estimateWait(ahead, avg.avgSec, avg.measured) : null,
    calledAt: token.calledAt,
    recalledAt: token.recalledAt,
    slotStart: token.slotStart,
    slotEnd: token.slotEnd,
    createdAt: token.createdAt,
    updatedAt: now,
  };
}

export function queueSummary(deptId: string, deptTokens: Token[], avg: { avgSec: number; measured: boolean }, now: number): QueueSummary {
  const line = waitingLine(deptTokens, deptId);
  const cur = currentlyCalled(deptTokens, deptId);
  return {
    deptId,
    nowServing: cur ? { id: cur.id, label: cur.label, calledAt: cur.calledAt ?? now, recalledAt: cur.recalledAt } : null,
    nextLabels: line.slice(0, 3).map((t) => t.label),
    waiting: line.length,
    avgServiceSec: Math.round(avg.avgSec),
    measured: avg.measured,
    updatedAt: now,
  };
}

export const tokenLabel = (code: string, n: number) => `${code}-${String(n).padStart(3, '0')}`;

/** Parse what a visitor typed ("ped 7", "PED-007", "ped007") into a normalised label. */
export function parseTokenLabel(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^([A-Z]{2,4})[\s-]*0*(\d{1,4})$/);
  if (!m) return null;
  return tokenLabel(m[1], Number(m[2]));
}
