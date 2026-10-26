// Acceptance tests for the mobile-first visitor app.
import { expect, test, devices, type BrowserContext, type Page } from '@playwright/test';
import { apiLogin, BASE, presetLang } from './fixtures.ts';
import { planToGps } from '../../src/lib/geo.ts';
import { sampleHospital } from '../../src/data/sampleHospital.ts';

const phone = { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } };
const geo = sampleHospital.hospital.geo!;

async function seedVisit(ctx: BrowserContext, visit: Record<string, unknown>) {
  await ctx.addInitScript((v) => {
    if (!sessionStorage.getItem('wm_seeded')) {
      localStorage.setItem('wm_visit', JSON.stringify({ startedAt: Date.now(), ...v }));
      sessionStorage.setItem('wm_seeded', '1');
    }
  }, visit);
}

async function setPos(ctx: BrowserContext, x: number, y: number, accuracy: number) {
  const g = planToGps(geo, [x, y]);
  await ctx.setGeolocation({ latitude: g.lat, longitude: g.lng, accuracy });
}

test('first screen explains what to do, with one primary action', async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('WayMed takes you from the hospital gate to the right department, step by step, in your language.');
  await expect(page.getByText('Get a slip at the Slip Room').first()).toBeVisible();
  await expect(page.getByText('Follow the map to your department').first()).toBeVisible();
  await expect(page.getByText('Wait. We tell you when it is your turn').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'I am at the hospital gate' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Emergency' })).toBeVisible();
  // Natural sizing: 16px body text and buttons at least 48px tall.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('16px');
  const box = await page.getByRole('button', { name: 'I am at the hospital gate' }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(48);
  // Fits a 375px phone without sideways scrolling.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await ctx.close();
});

test('full live journey on a 375px phone: gate, slip, checkpoint map, wait, your turn', async ({ browser, playwright }) => {
  const ctx = await browser.newContext(phone);
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'I am at the hospital gate' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome. We will guide you.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start my visit' }).click();
  await expect(page.getByText('First, walk to the Slip Room.')).toBeVisible();
  await page.getByRole('button', { name: 'I am at the Slip Room' }).click();
  await page.getByRole('button', { name: /Check-up/ }).click();
  await page.getByRole('button', { name: 'Get my slip' }).click();
  await expect(page.getByText(/Medicine \(OPD\) has your token \d+ and knows you are coming\./)).toBeVisible();
  await expect(page.getByText('This slip holds no personal data.')).toBeVisible();
  await page.getByRole('button', { name: 'Show me the way' }).click();
  // Skip location: checkpoint mode.
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByText('Checkpoint mode')).toBeVisible();
  await expect(page.getByText(/Step 1 of \d/)).toBeVisible();
  for (let i = 0; i < 6 && !(await page.getByText('You have arrived').isVisible()); i++) {
    await page.getByRole('button', { name: /^I reached / }).click();
  }
  await expect(page.getByText('You have arrived')).toBeVisible();
  await page.getByRole('button', { name: 'Wait for my turn' }).click();
  await expect(page.getByRole('heading', { name: 'Wait for your turn' })).toBeVisible();
  await expect(page.getByText(/Estimated wait|No one ahead/).first()).toBeVisible();

  // The department calls the next token (staff on another device).
  const api = await playwright.request.newContext({ baseURL: BASE });
  await apiLogin(api, 'admin@e2e.local');
  expect((await api.post('/api/staff/queues/medicine/next', { headers: { 'x-waymed': '1' } })).ok()).toBe(true);
  await expect(page.getByText('Your turn now')).toBeVisible({ timeout: 4000 });
  await page.getByRole('button', { name: 'Yes' }).click();
  await expect(page.getByText('Thank you. Your answer is anonymous.')).toBeVisible();
  await page.getByRole('button', { name: 'Finish visit' }).click();
  await expect(page.getByText(/Visit finished/)).toBeVisible();
  await api.dispose();
  await ctx.close();
});

test('a wrong checkpoint gives the corrected route', async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  await presetLang(ctx, 'en');
  await seedVisit(ctx, { chapter: 'map', deptId: 'medicine', need: 'checkup', loc: 'skipped', here: 'registration', done: 0 });
  const page = await ctx.newPage();
  await page.goto('/visit/map');
  await page.getByRole('button', { name: 'I am somewhere else' }).click();
  await page.getByRole('button', { name: 'Pharmacy Gate' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Pharmacy Gate is not on your route. Here is the new way.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^I reached / })).toBeVisible();
  await ctx.close();
});

async function openMapWithLocation(browser: import('@playwright/test').Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ ...phone, permissions: ['geolocation'] });
  await presetLang(ctx, 'en');
  await seedVisit(ctx, { chapter: 'map', deptId: 'medicine', need: 'checkup', loc: 'allowed', here: 'registration', done: 0 });
  await setPos(ctx, 262, 560, 5);
  const page = await ctx.newPage();
  await page.goto('/visit/map');
  await expect(page.getByText('Location on')).toBeVisible();
  return { ctx, page };
}

test('walking off the route triggers the wrong-turn alert (location allowed)', async ({ browser }) => {
  const { ctx, page } = await openMapWithLocation(browser);
  // Walk east along the bottom corridor instead of up to the Main Junction.
  for (const x of [330, 420, 500, 580, 650, 720]) {
    await setPos(ctx, x, 562, 6);
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole('alert').filter({ hasText: 'You may be going the wrong way. Turn back to Slip Room (Registration).' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('New route ready')).toBeVisible();
  await ctx.close();
});

test('inaccurate readings never cause a false alarm', async ({ browser }) => {
  const { ctx, page } = await openMapWithLocation(browser);
  for (const x of [500, 650, 800, 900, 950, 980]) {
    await setPos(ctx, x, 620, 80); // far off route, but accuracy 80 m: ignored
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1000);
  await expect(page.getByText(/wrong way/)).toHaveCount(0);
  await ctx.close();
});

test('demo tour plays the journey with captions and controls (about 3 minutes)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/tour');
  await expect(page.getByText(/Demo tour · 1\/12 · ~3 min/)).toBeVisible();
  await expect(page.getByText('What is happening')).toBeVisible();
  await expect(page.getByText('From our interviews')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  for (let i = 0; i < 11; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText(/12\/12/)).toBeVisible();
  await expect(page.getByText('Did you reach the right department the first time?').first()).toBeVisible();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByText(/1\/12/)).toBeVisible();
  await ctx.close();
});

test('no staff or admin link appears anywhere in the visitor app', async ({ browser }) => {
  const ctx = await browser.newContext(phone);
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  for (const path of ['/', '/more', '/help', '/g', '/demo', '/tour', '/prepare', '/book', '/emergency', '/assistant']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.filter((h) => /^\/(register|staff|admin|insights|login|board|kiosk)/.test(h)), path).toEqual([]);
  }
  await ctx.close();
});

test('Urdu and Sindhi flip the visitor app to right-to-left', async ({ browser }) => {
  for (const [lang, dir] of [
    ['ur', 'rtl'],
    ['sd', 'rtl'],
    ['en', 'ltr'],
  ] as const) {
    const ctx = await browser.newContext(phone);
    await presetLang(ctx, lang);
    const page = await ctx.newPage();
    await page.goto('/help');
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await ctx.close();
  }
});

test('on a desktop screen it is a normal web app with top navigation and sensible sizes', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/');
  // Top navigation, no phone frame, no bottom bar.
  for (const name of ['Journey', 'Map', 'More', 'Help']) await expect(page.locator('header').getByRole('link', { name })).toBeVisible();
  await expect(page.locator('nav.fixed')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('16px');
  const h1 = await page.getByRole('heading', { level: 1 }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(h1).toBeGreaterThanOrEqual(20);
  expect(h1).toBeLessThanOrEqual(28);
  const btn = await page.getByRole('button', { name: 'I am at the hospital gate' }).boundingBox();
  expect(btn!.height).toBeGreaterThanOrEqual(48);
  expect(btn!.height).toBeLessThanOrEqual(64);
  expect(btn!.width).toBeLessThanOrEqual(600);
  await ctx.close();
});
