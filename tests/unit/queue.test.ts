import { describe, expect, it } from 'vitest';
import { callNext, estimateWait, movingAverageSec, normalize, parseTokenLabel, queueSummary, recallCurrent, skipCurrent, tokenLabel, tokenView, waitingLine } from '../../src/lib/queue.ts';
import type { Token } from '../../src/lib/types.ts';

let n = 0;
function tok(over: Partial<Token> = {}): Token {
  n++;
  return {
    id: `t${n}`.padEnd(16, 'x'),
    deptId: 'ped',
    number: n,
    label: tokenLabel('PED', n),
    status: 'waiting',
    priority: 0,
    channel: 'desk',
    createdAt: 1000 * n,
    orderKey: 1000 * n,
    calledAt: null,
    recalledAt: null,
    doneAt: null,
    expiresAt: 1e12,
    slotStart: null,
    slotEnd: null,
    ...over,
  };
}

describe('queue logic', () => {
  it('orders urgent first, then by arrival', () => {
    const a = tok();
    const b = tok();
    const c = tok({ priority: 1 });
    expect(waitingLine([a, b, c], 'ped').map((t) => t.id)).toEqual([c.id, a.id, b.id]);
  });

  it('normalize marks the first in line as next', () => {
    const list = [tok(), tok(), tok()];
    normalize(list, 'ped');
    expect(list.map((t) => t.status)).toEqual(['next', 'waiting', 'waiting']);
  });

  it('callNext finishes the current token and calls the next one', () => {
    const list = [tok(), tok(), tok()];
    normalize(list, 'ped');
    const r1 = callNext(list, 'ped', 10_000);
    expect(r1.called?.id).toBe(list[0].id);
    expect(list[0].status).toBe('called');
    expect(list[1].status).toBe('next');
    const r2 = callNext(list, 'ped', 70_000);
    expect(list[0].status).toBe('done');
    expect(r2.serviceSec).toBe(60);
    expect(r2.called?.id).toBe(list[1].id);
    expect(list[2].status).toBe('next');
  });

  it('callNext on an empty line just finishes the current token', () => {
    const list = [tok()];
    callNext(list, 'ped', 5000);
    const r = callNext(list, 'ped', 9000);
    expect(r.called).toBeNull();
    expect(list[0].status).toBe('done');
  });

  it('skip marks a no-show as skipped (missed) and calls the next one', () => {
    const list = [tok(), tok()];
    callNext(list, 'ped', 5000);
    const r = skipCurrent(list, 'ped', 9000);
    expect(list[0].status).toBe('skipped');
    expect(r.called?.id).toBe(list[1].id);
    expect(r.serviceSec).toBeNull();
  });

  it('recall re-announces the current token without changing the line', () => {
    const list = [tok(), tok()];
    callNext(list, 'ped', 5000);
    recallCurrent(list, 'ped', 8000);
    expect(list[0].recalledAt).toBe(8000);
    expect(list[0].status).toBe('called');
  });

  it('only touches the requested department', () => {
    const other = tok({ deptId: 'lab' });
    const list = [tok(), other];
    callNext(list, 'ped', 5000);
    expect(other.status).toBe('waiting');
  });

  it('appointments are placed by slot time', () => {
    const walkIn = tok({ createdAt: 5000, orderKey: 5000 });
    const appt = tok({ channel: 'booking', createdAt: 1000, orderKey: 60_000 });
    expect(waitingLine([appt, walkIn], 'ped')[0].id).toBe(walkIn.id);
  });

  it('moving average falls back to the department setting until 3 samples exist', () => {
    expect(movingAverageSec([], 8)).toEqual({ avgSec: 480, measured: false });
    expect(movingAverageSec([100, 200], 8).measured).toBe(false);
    const m = movingAverageSec([100, 200, 300], 8);
    expect(m.measured).toBe(true);
    expect(m.avgSec).toBe(200);
    // Extremes are trimmed once there are 6+ samples.
    expect(movingAverageSec([300, 300, 300, 300, 300, 3600], 8).avgSec).toBe(300);
  });

  it('wait estimate is a range rounded to 5 minutes, never a single precise number', () => {
    const w = estimateWait(4, 300, true);
    expect(w.minMin % 5).toBe(0);
    expect(w.maxMin % 5).toBe(0);
    expect(w.maxMin).toBeGreaterThan(w.minMin);
    const zero = estimateWait(0, 300, true);
    expect(zero.minMin).toBe(0);
    expect(zero.maxMin).toBeGreaterThanOrEqual(5);
  });

  it('token view counts people ahead', () => {
    const list = [tok(), tok(), tok()];
    normalize(list, 'ped');
    const v = tokenView(list[2], list, { avgSec: 300, measured: false }, 0);
    expect(v.ahead).toBe(2);
    expect(v.wait?.measured).toBe(false);
  });

  it('queue summary shows now serving and the next labels', () => {
    const list = [tok(), tok(), tok()];
    callNext(list, 'ped', 1);
    const s = queueSummary('ped', list, { avgSec: 300, measured: true }, 2);
    expect(s.nowServing?.label).toBe(list[0].label);
    expect(s.nextLabels).toEqual([list[1].label, list[2].label]);
    expect(s.waiting).toBe(2);
  });

  it('parses typed token labels', () => {
    expect(parseTokenLabel('ped 7')).toBe('PED-007');
    expect(parseTokenLabel(' PED-007 ')).toBe('PED-007');
    expect(parseTokenLabel('lab0012')).toBe('LAB-012');
    expect(parseTokenLabel('hello')).toBeNull();
    expect(parseTokenLabel('P-1')).toBeNull();
  });
});
