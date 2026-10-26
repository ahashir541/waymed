// Starts a fresh server for the end-to-end tests: new database, sample hospital, three test staff accounts.
// Test-only credentials for a throwaway local database (see tests/e2e/fixtures.ts).
import { rmSync } from 'node:fs';
import { openDb, seedHospital } from '../../server/db.ts';
import { createStaff } from '../../server/auth.ts';
import { E2E_DB, E2E_PASSWORD, E2E_PORT } from './fixtures.ts';

for (const suffix of ['', '-wal', '-shm']) rmSync(`${E2E_DB}${suffix}`, { force: true });
const db = openDb(E2E_DB);
seedHospital(db);
createStaff(db, { email: 'desk@e2e.local', name: 'E2E Desk', role: 'desk', deptId: null, password: E2E_PASSWORD });
createStaff(db, { email: 'lab@e2e.local', name: 'E2E Lab', role: 'dept', deptId: 'lab', password: E2E_PASSWORD });
createStaff(db, { email: 'admin@e2e.local', name: 'E2E Admin', role: 'admin', deptId: null, password: E2E_PASSWORD });
db.close();

process.env.DATABASE_PATH = E2E_DB;
process.env.PORT = String(E2E_PORT);
process.env.DEMO_TOOLS = 'false';
process.env.GEMINI_API_KEY = '';
process.env.PUBLIC_ORIGIN = `http://localhost:${E2E_PORT}`;
await import('../../server/index.ts');
