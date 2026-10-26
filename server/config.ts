// Server configuration from environment variables. Secrets never reach the browser bundle.
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

/** Minimal .env loader so `npm start` works without extra packages. Real env vars win. */
function loadDotEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}
loadDotEnv();

export interface Config {
  port: number;
  host: string;
  databasePath: string;
  sessionSecret: string;
  publicOrigin: string;
  production: boolean;
  geminiKey: string;
  geminiModel: string;
  demoTools: boolean;
  retentionMs: number;
  staticDir: string;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  const production = process.env.NODE_ENV === 'production';
  let sessionSecret = process.env.SESSION_SECRET ?? '';
  if (!sessionSecret || sessionSecret === 'change-me') {
    if (production && !overrides.sessionSecret) throw new Error('SESSION_SECRET must be set in production.');
    sessionSecret = randomBytes(32).toString('hex');
  }
  return {
    port: Number(process.env.PORT ?? 8080),
    host: process.env.HOST ?? '0.0.0.0',
    databasePath: process.env.DATABASE_PATH ?? './data/waymed.db',
    sessionSecret,
    publicOrigin: (process.env.PUBLIC_ORIGIN ?? '').replace(/\/$/, ''),
    production,
    geminiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    demoTools: process.env.DEMO_TOOLS === 'true',
    retentionMs: Number(process.env.RETENTION_HOURS ?? 24) * 3600_000,
    staticDir: process.env.STATIC_DIR ?? './dist',
    ...overrides,
  };
}
