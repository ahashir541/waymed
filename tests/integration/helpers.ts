import { buildApp } from '../../server/app.ts';
import { openDb, seedHospital } from '../../server/db.ts';
import { createStaff } from '../../server/auth.ts';

export const PASSWORD = 'test-password-123';

export async function makeApp(opts: { now?: () => number; demoTools?: boolean; geminiKey?: string } = {}) {
  const db = openDb(':memory:');
  seedHospital(db);
  createStaff(db, { email: 'admin@test.local', name: 'Admin', role: 'admin', deptId: null, password: PASSWORD });
  createStaff(db, { email: 'desk@test.local', name: 'Desk', role: 'desk', deptId: null, password: PASSWORD });
  createStaff(db, { email: 'ped@test.local', name: 'Ped staff', role: 'dept', deptId: 'paediatrics', password: PASSWORD });
  const { app, ctx } = await buildApp({ db, now: opts.now, config: { staticDir: './__none__', demoTools: !!opts.demoTools, geminiKey: opts.geminiKey ?? '', retentionMs: 24 * 3600_000 } });
  await app.ready();

  const H = { 'x-waymed': '1', 'content-type': 'application/json' };
  async function login(email: string) {
    const r = await app.inject({ method: 'POST', url: '/api/auth/login', headers: H, payload: { email, password: PASSWORD } });
    if (r.statusCode !== 200) throw new Error(`login failed ${r.statusCode}`);
    const c = r.cookies.find((x) => x.name === 'wm_sess')!;
    return `wm_sess=${c.value}`;
  }
  const post = (url: string, payload: unknown, cookie?: string) => app.inject({ method: 'POST', url, headers: { ...H, ...(cookie ? { cookie } : {}) }, payload: payload as object });
  const get = (url: string, cookie?: string) => app.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} });
  return { app, ctx, db, login, post, get, H };
}
