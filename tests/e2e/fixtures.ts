import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';

export const E2E_PORT = 8181;
export const E2E_DB = './data/e2e.db';
/** Test-only password for the throwaway e2e database created by start-server.ts. */
export const E2E_PASSWORD = 'e2e-test-password-1';
export const BASE = `http://localhost:${E2E_PORT}`;

/** Pre-select a language so staff screens skip the visitor language step. */
export async function presetLang(ctx: BrowserContext, lang: 'en' | 'ur' | 'sd') {
  await ctx.addInitScript((l) => {
    localStorage.setItem('wm_lang', l);
    sessionStorage.setItem('wm_lang_chosen', '1');
  }, lang);
}

export async function chooseLanguage(page: Page, name: 'English' | 'اردو' | 'سنڌي') {
  // Kiosk: full-screen picker. Visitor pages: the compact language bar on top of the page.
  await page.locator('section[aria-labelledby="lang-title"] button, [data-lang-bar] button', { hasText: name }).first().click();
}

export async function loginUI(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => u.pathname === next.split('?')[0]);
}

export async function apiLogin(request: APIRequestContext, email: string) {
  const r = await request.post('/api/auth/login', { headers: { 'x-waymed': '1' }, data: { email, password: E2E_PASSWORD } });
  if (!r.ok()) throw new Error(`login ${r.status()}`);
}

export async function issueToken(request: APIRequestContext, deptId: string): Promise<{ id: string; label: string }> {
  const r = await request.post('/api/staff/tokens', { headers: { 'x-waymed': '1' }, data: { deptId } });
  if (!r.ok()) throw new Error(`issue ${r.status()}`);
  return r.json();
}
