// Department opening hours in hospital time (PKT). One source: Department.hours.
import type { Department } from './types.ts';
import { fmtTime, localMidnight, localWeekday, toMinutes } from './slots.ts';

const DAY_MS = 24 * 3600_000;

/** True or false when the department lists its hours; null when it does not. */
export function isOpen(dept: Department, now = Date.now()): boolean | null {
  if (!dept.hours?.length) return null;
  const mid = localMidnight(now);
  const day = localWeekday(mid + 12 * 3600_000);
  const min = (now - mid) / 60_000;
  return dept.hours.some((h) => h.days.includes(day) && min >= toMinutes(h.open) && min < toMinutes(h.close));
}

/** Next opening time within a week, or null. */
export function nextOpening(dept: Department, now = Date.now()): number | null {
  if (!dept.hours?.length) return null;
  let best: number | null = null;
  for (let d = 0; d < 8; d++) {
    const mid = localMidnight(now) + d * DAY_MS;
    const day = localWeekday(mid + 12 * 3600_000);
    for (const h of dept.hours) {
      if (!h.days.includes(day)) continue;
      const t = mid + toMinutes(h.open) * 60_000;
      if (t > now && (best === null || t < best)) best = t;
    }
    if (best !== null) return best;
  }
  return best;
}

/** "today 08:00" / "tomorrow 08:00" / weekday + time, in the visitor's words. */
export function openingWords(at: number, now: number, words: { today: string; tomorrow: string }, lang: string): string {
  const days = Math.round((localMidnight(at) - localMidnight(now)) / DAY_MS);
  if (days === 0) return `${words.today} ${fmtTime(at)}`;
  if (days === 1) return `${words.tomorrow} ${fmtTime(at)}`;
  const wd = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ur-PK', { weekday: 'long', timeZone: 'Asia/Karachi' }).format(at);
  return `${wd} ${fmtTime(at)}`;
}
