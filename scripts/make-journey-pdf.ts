// Builds WayMed-Patient-Journey.pdf (one A4 page) from docs/journey-onepager.html.
// Usage: node scripts/make-journey-pdf.ts
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const src = pathToFileURL(resolve('docs/journey-onepager.html')).href;
const out = resolve('WayMed-Patient-Journey.pdf');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(src);
await page.evaluate(() => document.fonts.ready);
// A4 at 96 dpi is 1123 px tall; anything taller would spill onto a second page.
const height = await page.evaluate(() => document.body.scrollHeight);
await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, pageRanges: '1' });
await browser.close();
console.log(`${out} written (content height ${height}px of 1123px)`);
if (height > 1123) {
  console.error('Content is taller than one A4 page.');
  process.exit(1);
}
