// Staff authentication. Visitors never sign in.
import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import type { DB } from './db.ts';
import type { Role, StaffUser } from '../src/lib/types.ts';

export const SESSION_COOKIE = 'wm_sess';
export const SESSION_TTL_MS = 12 * 3600_000; // one shift

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, saltB64, hashB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

interface StaffRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  dept_id: string | null;
  pass_hash: string;
  active: number;
}

const toUser = (r: StaffRow): StaffUser => ({ id: r.id, email: r.email, name: r.name, role: r.role, deptId: r.dept_id, active: !!r.active });

// A fixed dummy hash so a login for an unknown email costs the same time as a real one.
const DUMMY_HASH = hashPassword(randomBytes(12).toString('hex'));

export function login(db: DB, email: string, password: string): { user: StaffUser; token: string } | null {
  const row = db.prepare('SELECT * FROM staff WHERE email = ?').get(email.trim().toLowerCase()) as StaffRow | undefined;
  const ok = verifyPassword(password, row?.pass_hash ?? DUMMY_HASH);
  if (!row || !ok || !row.active) return null;
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token_hash, staff_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(sha256(token), row.id, now, now + SESSION_TTL_MS);
  return { user: toUser(row), token };
}

export function sessionUser(db: DB, token: string | undefined): StaffUser | null {
  if (!token) return null;
  const row = db
    .prepare('SELECT s.* FROM sessions x JOIN staff s ON s.id = x.staff_id WHERE x.token_hash = ? AND x.expires_at > ?')
    .get(sha256(token), Date.now()) as StaffRow | undefined;
  if (!row || !row.active) return null;
  return toUser(row);
}

export function logout(db: DB, token: string | undefined) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function listStaff(db: DB): StaffUser[] {
  return (db.prepare('SELECT * FROM staff ORDER BY role, email').all() as unknown as StaffRow[]).map(toUser);
}

export function createStaff(db: DB, input: { email: string; name: string; role: Role; deptId: string | null; password: string }): StaffUser {
  const id = randomUUID();
  db.prepare('INSERT INTO staff (id, email, name, role, dept_id, pass_hash, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)').run(
    id,
    input.email.trim().toLowerCase(),
    input.name,
    input.role,
    input.deptId,
    hashPassword(input.password),
    Date.now(),
  );
  return { id, email: input.email.trim().toLowerCase(), name: input.name, role: input.role, deptId: input.deptId, active: true };
}

export function updateStaff(db: DB, id: string, patch: { name?: string; role?: Role; deptId?: string | null; active?: boolean; password?: string }) {
  const row = db.prepare('SELECT * FROM staff WHERE id = ?').get(id) as StaffRow | undefined;
  if (!row) return null;
  db.prepare('UPDATE staff SET name = ?, role = ?, dept_id = ?, active = ?, pass_hash = ? WHERE id = ?').run(
    patch.name ?? row.name,
    patch.role ?? row.role,
    patch.deptId === undefined ? row.dept_id : patch.deptId,
    patch.active === undefined ? row.active : patch.active ? 1 : 0,
    patch.password ? hashPassword(patch.password) : row.pass_hash,
    id,
  );
  // A changed role or a deactivated account must sign in again.
  if (patch.active === false || patch.role || patch.password) db.prepare('DELETE FROM sessions WHERE staff_id = ?').run(id);
  return toUser(db.prepare('SELECT * FROM staff WHERE id = ?').get(id) as unknown as StaffRow);
}
