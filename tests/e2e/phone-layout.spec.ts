// Every visitor page fits a 390 px phone in English and Urdu: no sideways scroll and no element
// past the screen edge (the page is presented on a phone).
import { expect, test } from '@playwright/test';
import { presetLang } from './fixtures.ts';
import { PHONE_PAGES, overflowing } from './overflow.ts';

for (const lang of ['en', 'ur'] as const) {
  test(`phone layout at 390px fits the screen (${lang})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await presetLang(ctx, lang);
    const page = await ctx.newPage();
    const problems: string[] = [];
    for (const path of PHONE_PAGES) {
      await page.goto(path);
      await page.waitForTimeout(500);
      const o = await overflowing(page);
      if (o.length) problems.push(`${path}: ${o.join(' | ')}`);
    }
    expect(problems).toEqual([]);
    await ctx.close();
  });
}
