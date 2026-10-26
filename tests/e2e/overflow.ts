// Shared by the Playwright phone-layout test and scripts/check-overflow.ts.
import type { Page } from '@playwright/test';

export const PHONE_PAGES = [
  '/',
  '/visit/gate',
  '/visit/slip',
  '/g',
  '/g/lab',
  '/g/pharmacy',
  '/g/radiology',
  '/g/ent',
  '/g/washroom',
  '/more',
  '/help',
  '/emergency',
  '/book',
  '/book?dept=medicine',
  '/prepare',
  '/assistant',
  '/followup',
  '/tour',
  '/demo/walk',
  '/demo/show',
  '/no-such-page',
];

/** Elements whose box leaves the viewport, ignoring ones inside a sideways scroller. */
export async function overflowing(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: string[] = [];
    if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p);
        // Only a sideways scroller that itself fits on screen is fine; clipping hides content.
        if (/(auto|scroll)/.test(o.overflowX) && p.getBoundingClientRect().right <= vw + 1 && p.getBoundingClientRect().left >= -1) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      // Shapes inside an SVG are clipped by the SVG itself (the map pans inside its frame).
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      const st = getComputedStyle(el);
      if (st.position === 'fixed' && st.visibility === 'hidden') continue;
      if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
        const txt = (el.textContent ?? '').trim().slice(0, 40);
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} [${Math.round(r.left)}..${Math.round(r.right)}] "${txt}"`);
      }
    }
    return out.slice(0, 8);
  });
}
