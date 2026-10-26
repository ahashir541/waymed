// Phone layout check: opens every visitor page at 360, 390 and 430 px in English and Urdu and lists
// anything that sticks out of the screen. Usage: npm run build:static, npx vite preview --port 4173,
// then node scripts/check-overflow.ts [baseUrl]
import { chromium } from '@playwright/test';
import { PHONE_PAGES, overflowing } from '../tests/e2e/overflow.ts';

const base = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch();
let bad = 0;
for (const width of [360, 390, 430]) {
  for (const lang of ['en', 'ur']) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await ctx.addInitScript((l) => {
      localStorage.setItem('wm_lang', l);
      sessionStorage.setItem('wm_lang_chosen', '1');
    }, lang);
    const page = await ctx.newPage();
    for (const path of PHONE_PAGES) {
      await page.goto(base + path);
      await page.waitForTimeout(700);
      const o = await overflowing(page);
      if (o.length) {
        bad++;
        console.log(`\n${width}px ${lang} ${path}\n  ${o.join('\n  ')}`);
      }
    }
    await ctx.close();
  }
}
console.log(bad ? `\n${bad} page views overflow` : 'no overflow');
await browser.close();
process.exit(bad ? 1 : 0);
