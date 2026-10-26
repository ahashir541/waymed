// Appointment slots. Times are computed in hospital local time (Pakistan Standard Time, UTC+5, no DST)
// regardless of the server or device time zone.
import type { Doctor, Slot } from './types.ts';

export const HOSPITAL_UTC_OFFSET_MIN = 300;
/** Bookable grid for every doctor; slots outside the doctor's schedule show as "Not available". */
export const DAY_START = '08:00';
export const DAY_END = '20:00';
/** Privacy rule: nothing about a visit is kept longer than 24 hours, so bookings are limited to the next 22 hours (a booking plus its visit always fits inside 24 hours). */
export const BOOKING_HORIZON_MS = 22 * 3600_000;
/** A slot that starts in less than this is no longer bookable. */
export const BOOKING_LEAD_MS = 10 * 60_000;

const OFFSET_MS = HOSPITAL_UTC_OFFSET_MIN * 60_000;
const DAY_MS = 24 * 3600_000;

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Epoch ms of local midnight for the local day containing `now`. */
export function localMidnight(now: number): number {
  return Math.floor((now + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS;
}

export function localWeekday(epoch: number): number {
  return new Date(epoch + OFFSET_MS).getUTCDay();
}

export function fmtTime(epoch: number): string {
  const d = new Date(epoch + OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function fmtDay(epoch: number, now: number): 'today' | 'tomorrow' | 'later' {
  const diff = Math.round((localMidnight(epoch) - localMidnight(now)) / DAY_MS);
  return diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : 'later';
}

export interface SlotInputs {
  booked: Set<number>;
  blocked: Set<number>;
}

/** All slots for a doctor between now and the booking horizon, each with a status. */
export function doctorSlots(doctor: Doctor, now: number, inputs: SlotInputs): Slot[] {
  const out: Slot[] = [];
  const step = Math.max(5, doctor.slotMin) * 60_000;
  const sched0 = toMinutes(doctor.schedule.start);
  const sched1 = toMinutes(doctor.schedule.end);
  for (let day = 0; day < 2; day++) {
    const midnight = localMidnight(now) + day * DAY_MS;
    const weekday = localWeekday(midnight + 12 * 3600_000);
    for (let t = midnight + toMinutes(DAY_START) * 60_000; t + step <= midnight + toMinutes(DAY_END) * 60_000; t += step) {
      if (t > now + BOOKING_HORIZON_MS - step) continue;
      if (t < now - step) continue;
      const minuteOfDay = (t - midnight) / 60_000;
      const inSchedule =
        doctor.schedule.days.includes(weekday) && minuteOfDay >= sched0 && minuteOfDay + doctor.slotMin <= sched1;
      let status: Slot['status'] = 'free';
      if (t < now + BOOKING_LEAD_MS) status = 'past';
      else if (!doctor.available || !inSchedule) status = 'unavailable';
      else if (inputs.blocked.has(t)) status = 'blocked';
      else if (inputs.booked.has(t)) status = 'booked';
      out.push({ start: t, end: t + step, status });
    }
  }
  return out;
}

export function isSlotBookable(doctor: Doctor, start: number, now: number, inputs: SlotInputs): boolean {
  return doctorSlots(doctor, now, inputs).some((s) => s.start === start && s.status === 'free');
}
