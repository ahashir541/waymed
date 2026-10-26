import { describe, expect, it } from 'vitest';
import { doctorSlots, fmtTime, isSlotBookable, localMidnight, BOOKING_HORIZON_MS } from '../../src/lib/slots.ts';
import type { Doctor } from '../../src/lib/types.ts';

const doc: Doctor = { id: 'd1', deptId: 'ped', name: { en: 'D', ur: 'D', sd: 'D' }, schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '12:00' }, slotMin: 30, available: true };
// 2026-10-26 07:00 Karachi time (02:00 UTC)
const NOW = Date.UTC(2026, 9, 26, 2, 0);
const empty = { booked: new Set<number>(), blocked: new Set<number>() };

describe('appointment slots', () => {
  it('uses Pakistan time regardless of the machine time zone', () => {
    expect(fmtTime(localMidnight(NOW))).toBe('00:00');
    expect(fmtTime(NOW)).toBe('07:00');
  });

  it('marks slots outside the schedule as not available', () => {
    const s = doctorSlots(doc, NOW, empty);
    const at = (hhmm: string) => s.find((x) => fmtTime(x.start) === hhmm)!;
    expect(at('08:00').status).toBe('unavailable');
    expect(at('09:00').status).toBe('free');
    expect(at('11:30').status).toBe('free');
    expect(at('12:00').status).toBe('unavailable');
  });

  it('marks booked and blocked slots', () => {
    const s0 = doctorSlots(doc, NOW, empty).find((x) => x.status === 'free')!;
    const s1 = doctorSlots(doc, NOW, empty).filter((x) => x.status === 'free')[1];
    const s = doctorSlots(doc, NOW, { booked: new Set([s0.start]), blocked: new Set([s1.start]) });
    expect(s.find((x) => x.start === s0.start)!.status).toBe('booked');
    expect(s.find((x) => x.start === s1.start)!.status).toBe('blocked');
    expect(isSlotBookable(doc, s0.start, NOW, { booked: new Set([s0.start]), blocked: new Set() })).toBe(false);
  });

  it('an unavailable doctor has no free slots', () => {
    expect(doctorSlots({ ...doc, available: false }, NOW, empty).some((x) => x.status === 'free')).toBe(false);
  });

  it('never offers a slot beyond the booking horizon (keeps data under 24 hours)', () => {
    const s = doctorSlots(doc, NOW, empty);
    expect(s.every((x) => x.start <= NOW + BOOKING_HORIZON_MS)).toBe(true);
    expect(BOOKING_HORIZON_MS).toBeLessThan(24 * 3600_000);
  });

  it('a slot starting within 10 minutes is no longer bookable', () => {
    const at0905 = Date.UTC(2026, 9, 26, 4, 5); // 09:05 local
    const s = doctorSlots(doc, at0905, empty);
    expect(s.find((x) => fmtTime(x.start) === '09:00')?.status).toBe('past');
    expect(s.find((x) => fmtTime(x.start) === '09:30')?.status).toBe('free');
  });
});
