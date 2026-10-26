// Daily backup: a consistent copy of the live SQLite database (safe while the server runs).
// Run once a day (cron / Windows Task Scheduler / a container job):  npm run backup
// Keeps the newest 14 copies in BACKUP_DIR (default ./backups). Copy that folder off the server too.
// Note: visit data is deleted after 24 hours anyway; backups protect the hospital configuration,
// staff accounts, audit log and aggregate counts. Restrict access to backups like the database itself.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../server/config.ts';

const cfg = loadConfig();
const dir = process.env.BACKUP_DIR ?? './backups';
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const target = join(dir, `waymed-${stamp}.db`);
const db = new DatabaseSync(cfg.databasePath);
db.prepare('VACUUM INTO ?').run(target);
db.close();
const old = readdirSync(dir)
  .filter((f) => /^waymed-.*\.db$/.test(f))
  .sort()
  .reverse()
  .slice(14);
for (const f of old) rmSync(join(dir, f));
console.log(`Backup written: ${target}${old.length ? ` (removed ${old.length} old)` : ''}`);
