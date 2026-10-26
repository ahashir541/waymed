// SQLite storage (Node's built-in node:sqlite). One file, easy to back up, runs on a hospital server.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { HospitalData, Token } from '../src/lib/types.ts';
import { sampleHospital } from '../src/data/sampleHospital.ts';

export type DB = DatabaseSync;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- Hospital configuration (departments, landmarks, edges, facilities, doctors, kiosks, hospital).
CREATE TABLE IF NOT EXISTS entities (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (kind, id)
);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Visitor tokens: a number and a department. No personal or medical data. Deleted after 24 hours.
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  dept_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  label TEXT NOT NULL,
  day TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting','next','called','done','skipped')),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority IN (0,1)),
  channel TEXT NOT NULL CHECK (channel IN ('desk','kiosk','phone','booking')),
  created_at INTEGER NOT NULL,
  order_key INTEGER NOT NULL,
  called_at INTEGER,
  recalled_at INTEGER,
  done_at INTEGER,
  expires_at INTEGER NOT NULL,
  slot_start INTEGER,
  slot_end INTEGER,
  UNIQUE (day, dept_id, number)
);
CREATE INDEX IF NOT EXISTS tokens_dept_status ON tokens (dept_id, status);
CREATE INDEX IF NOT EXISTS tokens_label ON tokens (label, day);
CREATE INDEX IF NOT EXISTS tokens_expires ON tokens (expires_at);

CREATE TABLE IF NOT EXISTS counters (day TEXT NOT NULL, dept_id TEXT NOT NULL, last INTEGER NOT NULL, PRIMARY KEY (day, dept_id));

-- Appointments: doctor, slot and token only. UNIQUE makes double booking impossible.
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  slot_start INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (doctor_id, slot_start)
);
CREATE TABLE IF NOT EXISTS slot_blocks (doctor_id TEXT NOT NULL, slot_start INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (doctor_id, slot_start));

-- Service-time samples for the moving-average wait estimate. Not linked to any token.
CREATE TABLE IF NOT EXISTS service_samples (id INTEGER PRIMARY KEY AUTOINCREMENT, dept_id TEXT NOT NULL, seconds INTEGER NOT NULL, at INTEGER NOT NULL);

-- Anonymous events. Deleted after 24 hours; only aggregate counts are kept.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  lang TEXT,
  channel TEXT,
  dept_id TEXT,
  landmark_id TEXT,
  value TEXT,
  at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_expires ON events (expires_at);
CREATE TABLE IF NOT EXISTS aggregates (
  day TEXT NOT NULL,
  hour INTEGER NOT NULL,
  metric TEXT NOT NULL,
  key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  sum REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (day, hour, metric, key)
);

CREATE TABLE IF NOT EXISTS guide_requests (
  id TEXT PRIMARY KEY,
  landmark_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','on_the_way','done')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Staff only. Visitors never have accounts.
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','desk','dept')),
  dept_id TEXT,
  pass_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, staff_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  staff_id TEXT,
  staff_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT
);
`;

export function openDb(path: string): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

/** Run fn inside BEGIN IMMEDIATE ... COMMIT; rolls back on any error. */
export function tx<T>(db: DB, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// ---------- Hospital configuration ----------

export const ENTITY_KINDS = ['hospital', 'department', 'landmark', 'edge', 'facility', 'doctor', 'kiosk'] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

const caches = new WeakMap<DB, HospitalData>();

export function invalidateHospital(db: DB) {
  caches.delete(db);
}

export function getMeta(db: DB, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setMeta(db: DB, key: string, value: string) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

export function getHospitalData(db: DB): HospitalData {
  const hit = caches.get(db);
  if (hit) return hit;
  const rows = db.prepare('SELECT kind, data FROM entities').all() as { kind: EntityKind; data: string }[];
  if (rows.length === 0) return sampleHospital;
  const by = (k: EntityKind) => rows.filter((r) => r.kind === k).map((r) => JSON.parse(r.data));
  const data: HospitalData = {
    hospital: by('hospital')[0] ?? sampleHospital.hospital,
    departments: by('department').sort((a, b) => a.order - b.order),
    landmarks: by('landmark'),
    edges: by('edge'),
    facilities: by('facility'),
    doctors: by('doctor'),
    kiosks: by('kiosk'),
    version: Number(getMeta(db, 'version') ?? 1),
    sample: getMeta(db, 'sample') !== 'false',
  };
  caches.set(db, data);
  return data;
}

export function putEntity(db: DB, kind: EntityKind, id: string, data: unknown) {
  db.prepare(
    'INSERT INTO entities (kind, id, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
  ).run(kind, id, JSON.stringify(data), Date.now());
  bumpVersion(db);
}

export function deleteEntity(db: DB, kind: EntityKind, id: string): boolean {
  const r = db.prepare('DELETE FROM entities WHERE kind = ? AND id = ?').run(kind, id);
  bumpVersion(db);
  return Number(r.changes) > 0;
}

function bumpVersion(db: DB) {
  setMeta(db, 'version', String(Number(getMeta(db, 'version') ?? 1) + 1));
  invalidateHospital(db);
}

/** Write the sample hospital into an empty database. */
export function seedHospital(db: DB, data: HospitalData = sampleHospital, force = false) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM entities').get() as { n: number }).n;
  if (count > 0 && !force) return false;
  tx(db, () => {
    db.exec('DELETE FROM entities');
    putEntity(db, 'hospital', data.hospital.id, data.hospital);
    for (const d of data.departments) putEntity(db, 'department', d.id, d);
    for (const l of data.landmarks) putEntity(db, 'landmark', l.id, l);
    for (const e of data.edges) putEntity(db, 'edge', e.id, e);
    for (const f of data.facilities) putEntity(db, 'facility', f.id, f);
    for (const d of data.doctors) putEntity(db, 'doctor', d.id, d);
    for (const k of data.kiosks) putEntity(db, 'kiosk', k.id, k);
    setMeta(db, 'sample', String(data.sample));
  });
  invalidateHospital(db);
  return true;
}

// ---------- Token row mapping ----------

export interface TokenRow {
  id: string;
  dept_id: string;
  number: number;
  label: string;
  day: string;
  status: Token['status'];
  priority: number;
  channel: Token['channel'];
  created_at: number;
  order_key: number;
  called_at: number | null;
  recalled_at: number | null;
  done_at: number | null;
  expires_at: number;
  slot_start: number | null;
  slot_end: number | null;
}

export const rowToToken = (r: TokenRow): Token => ({
  id: r.id,
  deptId: r.dept_id,
  number: r.number,
  label: r.label,
  status: r.status,
  priority: r.priority ? 1 : 0,
  channel: r.channel,
  createdAt: r.created_at,
  orderKey: r.order_key,
  calledAt: r.called_at,
  recalledAt: r.recalled_at,
  doneAt: r.done_at,
  expiresAt: r.expires_at,
  slotStart: r.slot_start,
  slotEnd: r.slot_end,
});
