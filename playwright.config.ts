import { defineConfig, devices } from '@playwright/test';
import { BASE, E2E_PORT } from './tests/e2e/fixtures.ts';

// Run `npm run build` first: the e2e server serves the production bundle (with the service worker).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/e2e/start-server.ts',
    url: `${BASE}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { PORT: String(E2E_PORT), STATIC_DIR: './dist' },
  },
});
