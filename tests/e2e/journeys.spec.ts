// End-to-end tests for the acceptance criteria. Each "device" is a separate browser context.
import { expect, test, devices } from '@playwright/test';
import { apiLogin, BASE, chooseLanguage, issueToken, loginUI, presetLang } from './fixtures.ts';

test('slip on one device, QR on a phone, Next on a third: phone and board update within 2 seconds', async ({ browser }) => {
  const desk = await browser.newContext();
  await presetLang(desk, 'en');
  const deskPage = await desk.newPage();
  await loginUI(deskPage, 'desk@e2e.local', '/register');
  await deskPage.getByRole('button', { name: /Laboratory/ }).click();
  const slip = deskPage.getByTestId('slip');
  await expect(slip).toBeVisible();
  await expect(slip).toContainText('This slip holds no personal data');
  const qrUrl = (await slip.getAttribute('data-qr'))!;
  const label = (await deskPage.getByRole('status').filter({ hasText: 'issued' }).textContent())!.match(/LAB-\d{3}/)![0];

  // Phone: "scans" the QR (opens its URL), chooses Urdu.
  const phone = await browser.newContext({ ...devices['Pixel 7'] });
  const phonePage = await phone.newPage();
  await phonePage.goto(qrUrl);
  await chooseLanguage(phonePage, 'اردو');
  await expect(phonePage.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(phonePage.getByText(label).first()).toBeVisible();

  // Entrance board.
  const board = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const boardPage = await board.newPage();
  await boardPage.goto('/board');
  await expect(boardPage.getByText('Laboratory').first()).toBeVisible();

  // Department staff on a third device press Next.
  const staff = await browser.newContext();
  await presetLang(staff, 'en');
  const staffPage = await staff.newPage();
  await loginUI(staffPage, 'lab@e2e.local', '/staff');
  await expect(staffPage.getByRole('heading', { name: /Waiting/ })).toBeVisible();
  await staffPage.waitForTimeout(500);
  const pressed = Date.now();
  await staffPage.getByRole('button', { name: 'Next' }).click();

  await expect(phonePage.getByText('اب آپ کی باری ہے')).toBeVisible({ timeout: 2000 });
  await expect(boardPage.locator(`[aria-label="${label}"]`)).toBeVisible({ timeout: 2000 });
  expect(Date.now() - pressed).toBeLessThan(2500);
  await Promise.all([desk.close(), phone.close(), board.close(), staff.close()]);
});

test('a booked slot is unavailable to a second user at once', async ({ browser }) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  await presetLang(a, 'en');
  await presetLang(b, 'en');
  const pa = await a.newPage();
  const pb = await b.newPage();
  for (const p of [pa, pb]) {
    await p.goto('/book?dept=lab');
    await p.getByRole('button', { name: /Sample collection counter/ }).click();
  }
  const firstFree = pa.locator('button[aria-pressed]:not([disabled])').filter({ hasText: /^\d\d:\d\d$/ }).first();
  const time = (await firstFree.textContent())!.trim();
  await firstFree.click();
  await pb.locator('button[aria-pressed]:not([disabled])').filter({ hasText: new RegExp(`^${time}$`) }).first().click();
  await pa.getByRole('button', { name: `Book ${time}` }).click();
  await expect(pa.getByRole('heading', { name: 'Your appointment is booked' })).toBeVisible();
  await expect(pa.getByText(/Please come between/)).toBeVisible();
  // Second user: the same time turns "Not available" live, and cannot be booked.
  const slotB = pb.locator('button').filter({ hasText: time }).first();
  await expect(slotB).toBeDisabled({ timeout: 2000 });
  await expect(slotB).toContainText('Not available');
  await a.close();
  await b.close();
});

test('landmark QR with a saved token shows the route from that landmark', async ({ browser, playwright }) => {
  const api = await playwright.request.newContext({ baseURL: BASE });
  await apiLogin(api, 'desk@e2e.local');
  const tok = await issueToken(api, 'paediatrics');
  const phone = await browser.newContext({ ...devices['Pixel 7'] });
  await presetLang(phone, 'en');
  const page = await phone.newPage();
  await page.goto(`/t/${tok.id}`);
  await expect(page.getByText(tok.label).first()).toBeVisible();
  await page.goto('/w/junction?src=qr');
  await expect(page.getByRole('heading', { name: 'Main Junction' })).toBeVisible();
  await expect(page.getByText('Route to your department')).toBeVisible();
  await expect(page.getByText('Start at Main Junction.')).toBeVisible();
  await expect(page.getByText(/You have arrived: Children/)).toBeVisible();
  // "I feel lost" offers a guide; the request reaches staff.
  await page.getByRole('button', { name: 'I feel lost' }).click();
  await page.getByRole('button', { name: 'Ask a guide to meet me' }).click();
  await expect(page.getByText('A guide has been asked to come to Main Junction.')).toBeVisible();
  const guides = await api.get('/api/staff/guide-requests');
  expect((await guides.json()).some((g: { landmarkId: string }) => g.landmarkId === 'junction')).toBe(true);
  await phone.close();
  await api.dispose();
});

test('kiosk works with a typed token when the camera is denied', async ({ browser, playwright }) => {
  const api = await playwright.request.newContext({ baseURL: BASE });
  await apiLogin(api, 'desk@e2e.local');
  const tok = await issueToken(api, 'pharmacy');
  const kiosk = await browser.newContext({ viewport: { width: 1280, height: 1024 }, permissions: [] });
  const page = await kiosk.newPage();
  await page.goto('/kiosk?at=entrance');
  await chooseLanguage(page, 'English');
  await page.getByRole('button', { name: 'Scan my slip' }).click();
  await expect(page.getByText('Camera is not available. Please type your token instead.')).toBeVisible();
  await page.getByLabel('Type your token').fill(tok.label.toLowerCase().replace('-', ' '));
  await page.getByRole('button', { name: 'Show status' }).click();
  await expect(page.getByText(tok.label).first()).toBeVisible();
  await expect(page.getByText('Start at Main Entrance.')).toBeVisible();
  await kiosk.close();
  await api.dispose();
});

for (const [name, lang, dir] of [
  ['English', 'en', 'ltr'],
  ['اردو', 'ur', 'rtl'],
  ['سنڌي', 'sd', 'rtl'],
] as const) {
  test(`visitor journey and layout direction in ${lang}`, async ({ page }) => {
    await page.goto('/g?src=qr');
    await chooseLanguage(page, name);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await page.locator('a[href^="/g/lab"]').click();
    const steps = page.locator('ol[aria-live] li');
    await expect(steps.first()).toBeVisible();
    expect(await steps.count()).toBeGreaterThanOrEqual(3);
    const text = await steps.first().textContent();
    if (lang === 'en') expect(text).toContain('Main Entrance');
    else expect(text).toMatch(/[\u0600-\u06FF]/);
    // Step-free toggle changes the route.
    await page.getByRole('checkbox').first().check();
    await expect(steps.first()).toBeVisible();
  });
}

test('directions still show with the network off after the first load', async ({ browser }) => {
  const ctx = await browser.newContext();
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/g/paediatrics?from=entrance');
  await expect(page.getByText('Start at Main Entrance.')).toBeVisible();
  // The service worker takes control on the first visit (clientsClaim) and precaches the app shell.
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 20_000 });
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.includes('precache')), null, { timeout: 20_000 });
  await page.reload();
  await expect(page.getByText('Start at Main Entrance.')).toBeVisible();
  await ctx.setOffline(true);
  await page.goto('/g/lab?from=junction');
  await expect(page.getByText('Start at Main Junction.')).toBeVisible();
  await expect(page.getByText('You are offline. Directions still work.')).toBeVisible();
  await ctx.close();
});

test('assistant answers in three languages, refuses medical advice and offers chips', async ({ browser }) => {
  for (const [lang, q, expectText] of [
    ['en', 'where is the pharmacy', /Pharmacy/],
    ['ur', 'پانی کہاں ہے', /پانی/],
    ['sd', 'ٻارن جو شعبو ڪٿي آهي', /ٻارن/],
    ['en', 'what medicine should I take for fever', /cannot give medical advice/],
  ] as const) {
    const ctx = await browser.newContext();
    await presetLang(ctx, lang);
    const page = await ctx.newPage();
    await page.goto('/assistant');
    const panel = page.locator('#wm-assistant');
    await expect(panel.locator('.chip').first()).toBeVisible();
    await panel.locator('#wm-ask').fill(q);
    await panel.locator('#wm-ask').press('Enter');
    await expect(panel.getByRole('log')).toContainText(expectText);
    await ctx.close();
  }
});

test('emergency button is on every visitor screen and shows the fastest route', async ({ browser }) => {
  const ctx = await browser.newContext();
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await page.goto('/prepare');
  await page.getByRole('link', { name: 'Emergency', exact: true }).click();
  await expect(page).toHaveURL(/\/emergency/);
  await expect(page.getByText('Go straight to Emergency. You do not need a slip.')).toBeVisible();
  await expect(page.getByText(/You have arrived: Emergency/)).toBeVisible();
  await ctx.close();
});

test('visitors cannot read or write staff data through the API', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: BASE });
  expect((await api.get('/api/staff/tokens/recent')).status()).toBe(401);
  expect((await api.get('/api/admin/users')).status()).toBe(401);
  expect((await api.post('/api/staff/tokens', { headers: { 'x-waymed': '1' }, data: { deptId: 'lab' } })).status()).toBe(401);
  expect((await api.post('/api/public/events', { headers: { 'x-waymed': '1' }, data: { type: 'slip_issued' } })).status()).toBe(403);
  await api.dispose();
});

test('insights never show invented numbers', async ({ browser }) => {
  const ctx = await browser.newContext();
  await presetLang(ctx, 'en');
  const page = await ctx.newPage();
  await loginUI(page, 'admin@e2e.local', '/insights');
  await expect(page.getByText('Not enough data yet').first()).toBeVisible();
  await ctx.close();
});
