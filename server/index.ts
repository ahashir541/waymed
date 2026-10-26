// WayMed server entry point: `npm start` (production) or `npm run dev:api`.
import { buildApp } from './app.ts';
import { purgeExpired } from './services.ts';
import { seedHospital } from './db.ts';
import { createStaff } from './auth.ts';

const { app, ctx } = await buildApp();

if (seedHospital(ctx.db)) app.log.warn('Empty database: loaded the SAMPLE hospital data. Replace it in /admin before a pilot.');

// Hosted deploys have no shell: create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, only while no staff exist.
const staffCount = (ctx.db.prepare('SELECT COUNT(*) AS n FROM staff').get() as { n: number }).n;
if (staffCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  if (process.env.ADMIN_PASSWORD.length < 10) app.log.error('ADMIN_PASSWORD must be at least 10 characters; no admin created.');
  else {
    createStaff(ctx.db, { email: process.env.ADMIN_EMAIL, name: 'Administrator', role: 'admin', deptId: null, password: process.env.ADMIN_PASSWORD });
    console.log(`Created the first admin account (${process.env.ADMIN_EMAIL}). You can remove ADMIN_PASSWORD from the environment now.`);
  }
}

// Privacy rule: visit data is deleted after the retention window (24 hours). Runs every 5 minutes.
const purge = () => {
  try {
    purgeExpired(ctx);
  } catch (e) {
    app.log.error({ msg: 'purge_failed', error: String(e) });
  }
};
purge();
setInterval(purge, 5 * 60_000).unref();

await app.listen({ port: ctx.cfg.port, host: ctx.cfg.host });
console.log(`WayMed listening on http://localhost:${ctx.cfg.port}  (LLM: ${ctx.cfg.geminiKey ? 'on' : 'off, rule-based answers'}; demo tools: ${ctx.cfg.demoTools ? 'on' : 'off'})`);

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await app.close();
    ctx.db.close();
    process.exit(0);
  });
}
