// Create the first admin account (or any staff account) from the command line.
//   npm run create-admin -- --email admin@hospital.example --name "Admin" [--role admin|desk|dept] [--dept paediatrics]
// The password is read from the WAYMED_PASSWORD environment variable or prompted for, never passed as an argument.
import { createInterface } from 'node:readline/promises';
import { loadConfig } from './config.ts';
import { openDb } from './db.ts';
import { createStaff } from './auth.ts';
import type { Role } from '../src/lib/types.ts';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const email = arg('email');
const name = arg('name') ?? 'Administrator';
const role = (arg('role') ?? 'admin') as Role;
const deptId = arg('dept') ?? null;
if (!email || !['admin', 'desk', 'dept'].includes(role)) {
  console.error('Usage: npm run create-admin -- --email you@hospital.example --name "Your Name" [--role admin|desk|dept] [--dept <departmentId>]');
  process.exit(1);
}

let password = process.env.WAYMED_PASSWORD ?? '';
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Password (at least 10 characters): ');
  rl.close();
}
if (password.length < 10) {
  console.error('Password must be at least 10 characters.');
  process.exit(1);
}

const db = openDb(loadConfig().databasePath);
try {
  const u = createStaff(db, { email, name, role, deptId, password });
  console.log(`Created ${u.role} account for ${u.email}.`);
} catch (e) {
  console.error(String(e).includes('UNIQUE') ? 'An account with this email already exists.' : String(e));
  process.exitCode = 1;
} finally {
  db.close();
}
