// Lighthouse for the visitor pages. Usage: start the server (npm start), then `npm run lighthouse [-- baseUrl]`.
// Launches Chromium through Playwright and runs Lighthouse against it through the debugging port.
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const base = process.argv[2] ?? 'http://localhost:8080';
const pages = process.env.PAGES ? process.env.PAGES.split(',') : ['/', '/help?lang=ur', '/more?lang=sd', '/g/paediatrics?lang=en&from=entrance', '/emergency', '/book?lang=en&dept=lab', '/tour?lang=en'];
const PORT = 9333;
const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
let ok = true;
try {
  for (const p of pages) {
    const res = await lighthouse(base + p, { port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] });
    if (!res) throw new Error('no result');
    const lhr = res.lhr;
    const scores = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)]));
    const low = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && !['informative', 'manual', 'notApplicable'].includes(a.scoreDisplayMode))
      .map((a) => `${a.id}:${a.score}`);
    console.log(p.padEnd(40), JSON.stringify(scores), low.length ? `\n    low: ${low.join(', ')}` : '');
    if ((scores.performance ?? 0) < 90 || (scores.accessibility ?? 0) < 90) ok = false;
  }
} finally {
  await browser.close();
}
process.exit(ok ? 0 : 1);
