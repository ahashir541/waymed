// Seed the database with the SAMPLE hospital data.
//   npm run seed            only if the database is empty
//   npm run seed -- --force replace hospital configuration with the sample (tokens, staff and counts are kept)
import { loadConfig } from './config.ts';
import { openDb, seedHospital } from './db.ts';

const cfg = loadConfig();
const db = openDb(cfg.databasePath);
const force = process.argv.includes('--force');
const done = seedHospital(db, undefined, force);
console.log(done ? `Sample hospital data written to ${cfg.databasePath}` : 'Database already has hospital data. Use --force to replace it with the sample.');
db.close();
