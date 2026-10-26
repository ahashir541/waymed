// Smoke test for the static (Vercel) showcase build: every visitor page renders with no errors and the
// main journey works on demo data. Usage: npm run build:static, npx vite preview --port 4173, then
//   node scripts/smoke-static.ts [baseUrl]
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 } });
await ctx.addInitScript(() => {
  localStorage.setItem('wm_lang', 'en');
  sessionStorage.setItem('wm_lang_chosen', '1');
});
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`${page.url()} :: ${e.message}`));
let failed = 0;
const check = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${(e as Error).message.split('\n')[0]}`);
  }
};
const see = (text: string | RegExp) => page.getByText(text).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 8000 });

for (const [path, text] of [
  ['/', 'From the hospital gate to the right department'],
  ['/g', 'Where do you want to go?'],
  ['/g/washroom', 'Washrooms: right here'],
  ['/more', 'Appointments'],
  ['/help', 'How to use WayMed in 30 seconds'],
  ['/book?dept=medicine', 'Book an appointment'],
  ['/prepare', 'What to bring'],
  ['/followup', 'Follow-up card'],
  ['/emergency', 'Go straight to Emergency. You do not need a slip.'],
  ['/assistant', 'Voice assistant'],
  ['/tour', 'What is happening'],
  ['/demo/walk', 'Walk in their shoes'],
  ['/demo/show', 'WayMed'],
  ['/board', 'Now serving'],
  ['/register', 'Registration desk'],
  ['/staff', 'Department queue'],
  ['/admin', 'Administration'],
  ['/insights', 'Insights'],
] as const) {
  await check(`page ${path}`, async () => {
    await page.goto(base + path);
    await see(text);
  });
}

await check('journey: gate > slip > map > wait > your turn', async () => {
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'I am at the hospital gate' }).click();
  await page.getByRole('button', { name: 'Start my visit' }).click();
  await page.getByRole('button', { name: 'I am at the Slip Room' }).click();
  await page.getByRole('button', { name: /X-ray or ultrasound/ }).click();
  await page.getByRole('button', { name: 'Get my slip' }).click();
  await see(/has your token \d+ and knows you are coming/);
  await page.getByRole('button', { name: 'Show me the way' }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  for (let i = 0; i < 6 && !(await page.getByText('You have arrived').isVisible()); i++) await page.getByRole('button', { name: /^I reached / }).click();
  await page.getByRole('button', { name: 'Wait for my turn' }).click();
  await see('Wait for your turn');
  // Demo mode: the simulated department calls tokens every few seconds.
  await page.getByText('Your turn now').first().waitFor({ state: 'visible', timeout: 90_000 });
  await see('After your check-up');
});

await check('assistant answers in Sindhi', async () => {
  await page.goto(base + '/assistant');
  await page.locator('#wm-ask').fill('پاڻي ڪٿي آهي');
  await page.locator('#wm-ask').press('Enter');
  await page.locator('#wm-assistant [role=log]').getByText('پيئڻ جو پاڻي').first().waitFor({ timeout: 8000 });
});

await check('booking in demo', async () => {
  await page.goto(base + '/book?dept=lab');
  await page.getByRole('button', { name: /Sample collection counter/ }).click();
  await page.locator('button[aria-pressed]:not([disabled])').filter({ hasText: /^\d\d:\d\d$/ }).first().click();
  await page.getByRole('button', { name: /^Book / }).click();
  await see('Your appointment is booked');
});

console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
