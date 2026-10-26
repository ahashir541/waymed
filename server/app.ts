// HTTP API and static hosting. buildApp() is used by the server and by the integration tests.
import Fastify, { LogController, type FastifyReply, type FastifyRequest } from 'fastify';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import compress from '@fastify/compress';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import './i18n.ts';
import type { Config } from './config.ts';
import { loadConfig } from './config.ts';
import { openDb, getHospitalData, putEntity, deleteEntity, ENTITY_KINDS, type EntityKind, type DB, setMeta } from './db.ts';
import { Hub } from './realtime.ts';
import { can, type Action } from './policy.ts';
import { SESSION_COOKIE, SESSION_TTL_MS, login, logout, sessionUser, listStaff, createStaff, updateStaff } from './auth.ts';
import * as svc from './services.ts';
import { HttpError, type Ctx } from './services.ts';
import { ask } from './assistant.ts';
import { parseTokenLabel } from '../src/lib/queue.ts';
import { EVENT_TYPES, FACILITY_TYPES, LANGS, type StaffUser } from '../src/lib/types.ts';
import { ICON_NAMES } from '../src/lib/icons.ts';

declare module 'fastify' {
  interface FastifyRequest {
    staff: StaffUser | null;
  }
}

// ---------- Validation schemas ----------

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{1,39}$/);
const TokenId = z.string().regex(/^[A-Za-z0-9_-]{16}$/);
const Lang = z.enum(LANGS as [string, ...string[]]);
const Text = (max = 200) => z.string().trim().min(1).max(max);
const L10n = z.object({ en: Text(), ur: Text(), sd: Text() });
const L10nLong = z.object({ en: Text(400), ur: Text(400), sd: Text(400) });
const Coord = z.number().min(0).max(1000);
const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const entitySchemas: Record<EntityKind, z.ZodType> = {
  hospital: z.object({
    id: Id,
    name: L10n,
    shortName: Text(20),
    openHours: L10nLong,
    helpline: z.string().max(40),
    address: L10n.optional(),
    geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), x: Coord, y: Coord, rotationDeg: z.number().min(-360).max(360), metersPerUnit: z.number().positive().max(10) }).optional(),
  }),
  department: z.object({
    id: Id,
    code: z.string().regex(/^[A-Z]{2,4}$/),
    name: L10n,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    icon: z.enum(ICON_NAMES as [string, ...string[]]),
    shape: z.enum(['circle', 'square', 'triangle', 'diamond', 'hexagon']),
    floor: z.number().int().min(-5).max(30),
    avgServiceMin: z.number().min(1).max(180),
    openHours: L10n,
    nodeId: Id,
    room: z.object({ x: Coord, y: Coord, w: z.number().min(10).max(1000), h: z.number().min(10).max(1000) }),
    bookable: z.boolean(),
    isEmergency: z.boolean().optional(),
    order: z.number().int().min(0).max(999),
    badge: z.string().regex(/^[A-Z0-9!+]{1,3}$/).optional(),
  }),
  landmark: z.object({
    id: Id,
    name: L10n,
    x: Coord,
    y: Coord,
    floor: z.number().int().min(-5).max(30),
    kind: z.enum(['landmark', 'door', 'waypoint']),
    hasSticker: z.boolean(),
    deptId: Id.optional(),
  }),
  edge: z.object({
    id: Id,
    a: Id,
    b: Id,
    stepFree: z.boolean(),
    via: z.array(z.tuple([Coord, Coord])).max(10).optional(),
    note: z.enum(['steps', 'ramp', 'lift']).nullable().optional(),
  }),
  facility: z.object({ id: Id, type: z.enum(FACILITY_TYPES as [string, ...string[]]), nodeId: Id, x: Coord, y: Coord, name: L10n }),
  doctor: z.object({
    id: Id,
    deptId: Id,
    name: L10n,
    schedule: z.object({ days: z.array(z.number().int().min(0).max(6)).max(7), start: HHMM, end: HHMM }),
    slotMin: z.number().int().min(5).max(120),
    available: z.boolean(),
  }),
  kiosk: z.object({ id: Id, name: Text(60), landmarkId: Id }),
};

/** Cross-entity checks so the admin cannot save a broken map. */
function checkReferences(db: DB, kind: EntityKind, v: Record<string, unknown>) {
  const data = getHospitalData(db);
  const node = (id: unknown) => data.landmarks.some((l) => l.id === id);
  const bad = (field: string) => {
    throw new HttpError(400, 'invalid_reference', field);
  };
  if (kind === 'department' && !node(v.nodeId)) bad('nodeId');
  if (kind === 'edge' && (!node(v.a) || !node(v.b) || v.a === v.b)) bad('a/b');
  if (kind === 'facility' && !node(v.nodeId)) bad('nodeId');
  if (kind === 'doctor' && !data.departments.some((d) => d.id === v.deptId)) bad('deptId');
  if (kind === 'kiosk' && !node(v.landmarkId)) bad('landmarkId');
  if (kind === 'doctor') {
    const s = v.schedule as { start: string; end: string };
    if (s.start >= s.end) bad('schedule');
  }
}

export interface AppOptions {
  config?: Partial<Config>;
  db?: DB;
  now?: () => number;
}

export async function buildApp(opts: AppOptions = {}) {
  const cfg = loadConfig(opts.config);
  const db = opts.db ?? openDb(cfg.databasePath);
  const hub = new Hub();
  const ctx: Ctx = { db, cfg, hub, now: opts.now ?? Date.now };

  const app = Fastify({
    trustProxy: true,
    bodyLimit: 64 * 1024,
    logController: new LogController({ disableRequestLogging: true }),
    // No PII logging: only the route pattern and status of failures are logged, never IPs, bodies or query strings.
    logger: process.env.VITEST ? false : { level: 'warn', serializers: { req: (r) => ({ method: r.method, route: r.routeOptions?.url }), res: (r) => ({ status: r.statusCode }) } },
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'blob:'],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: cfg.production ? [] : null,
      },
    },
    hsts: cfg.production ? { maxAge: 31536000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  });
  app.addHook('onSend', async (_req, reply) => {
    reply.header('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()');
  });
  // gzip/brotli for the app bundle and JSON (the SSE stream is hijacked and never compressed).
  await app.register(compress, { global: true, threshold: 1024, encodings: ['br', 'gzip'] });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  app.decorateRequest('staff', null);
  app.addHook('onRequest', async (req) => {
    req.staff = sessionUser(db, req.cookies?.[SESSION_COOKIE]);
  });

  // CSRF guard: every state-changing API call must carry a custom header (cross-site forms cannot set it)
  // and, when the browser sends an Origin, it must be our own.
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/api/') || req.method === 'GET' || req.method === 'HEAD') return;
    if (req.headers['x-waymed'] !== '1') return reply.code(403).send({ error: 'csrf' });
    const origin = req.headers.origin;
    if (origin) {
      const own = `${req.protocol}://${req.headers.host}`;
      if (origin !== own && origin !== cfg.publicOrigin) return reply.code(403).send({ error: 'origin' });
    }
  });

  app.setErrorHandler((err: Error & { statusCode?: number }, req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.code, detail: err.message !== err.code ? err.message : undefined });
    if (err instanceof z.ZodError) return reply.code(400).send({ error: 'invalid_input', fields: err.issues.map((i) => i.path.join('.')) });
    if (err.statusCode === 429) return reply.code(429).send({ error: 'rate_limited' });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: 'bad_request' });
    req.log.error({ msg: err.message, route: req.routeOptions?.url });
    return reply.code(500).send({ error: 'server_error' });
  });

  const guard = (action: Action, deptOf?: (req: FastifyRequest) => string | undefined) => async (req: FastifyRequest, reply: FastifyReply) => {
    if (!can(req.staff, action, { deptId: deptOf?.(req) })) {
      return reply.code(req.staff ? 403 : 401).send({ error: req.staff ? 'forbidden' : 'unauthenticated' });
    }
  };
  const rl = (max: number, minutes = 1, key?: (req: FastifyRequest) => string) => ({
    rateLimit: { max, timeWindow: minutes * 60_000, ...(key ? { keyGenerator: key } : {}) },
  });
  const deviceKey = (req: FastifyRequest) => `${req.ip}|${String(req.headers['x-device-id'] ?? '').slice(0, 64)}`;
  const deptParam = (req: FastifyRequest) => (req.params as { deptId?: string }).deptId;

  // ---------- Health ----------
  app.get('/api/health', async () => {
    let dbOk = true;
    try {
      db.prepare('SELECT 1').get();
    } catch {
      dbOk = false;
    }
    return { ok: dbOk, db: dbOk, realtimeClients: hub.size, llm: Boolean(cfg.geminiKey), demoTools: cfg.demoTools, time: ctx.now(), version: getHospitalData(db).version };
  });

  // ---------- Public (visitors) ----------
  app.get('/api/public/hospital', { preHandler: guard('hospital.read') }, async (_req, reply) => {
    reply.header('Cache-Control', 'no-cache');
    return getHospitalData(db);
  });

  app.get('/api/public/queues', { preHandler: guard('queue.summary') }, async () => svc.queueSummaries(ctx));

  // A visitor takes a slip on their own phone in the Slip Room (same as a printed slip). Strictly rate-limited.
  app.post('/api/public/tokens', { preHandler: guard('token.selfIssue'), config: rl(3, 30, deviceKey) }, async (req) => {
    const b = z.object({ deptId: Id }).strict().parse(req.body);
    const dept = getHospitalData(db).departments.find((d) => d.id === b.deptId);
    if (!dept) throw new HttpError(400, 'unknown_department');
    if (dept.isEmergency) throw new HttpError(400, 'emergency_no_slip');
    return svc.issueToken(ctx, { deptId: dept.id, priority: 0, channel: 'phone' });
  });

  app.get('/api/public/tokens/lookup', { preHandler: guard('token.lookupByLabel'), config: rl(30) }, async (req) => {
    const { label } = z.object({ label: z.string().max(20) }).parse(req.query);
    const parsed = parseTokenLabel(label);
    if (!parsed) throw new HttpError(400, 'invalid_label');
    const id = svc.lookupLabel(ctx, parsed);
    if (!id) throw new HttpError(404, 'not_found');
    return { id };
  });

  app.get('/api/public/tokens/:id', { preHandler: guard('token.readById'), config: rl(120) }, async (req) => {
    const { id } = z.object({ id: TokenId }).parse(req.params);
    const v = svc.getTokenView(ctx, id);
    if (!v) throw new HttpError(404, 'not_found');
    return v;
  });

  app.get('/api/public/doctors/:doctorId/slots', { preHandler: guard('slots.read'), config: rl(60) }, async (req) => {
    const { doctorId } = z.object({ doctorId: Id }).parse(req.params);
    return svc.slotsFor(ctx, doctorId);
  });

  app.post('/api/public/appointments', { preHandler: guard('appointment.book'), config: rl(6, 10) }, async (req) => {
    const body = z.object({ doctorId: Id, slotStart: z.number().int().positive() }).parse(req.body);
    return svc.book(ctx, body.doctorId, body.slotStart);
  });

  app.post('/api/public/events', { preHandler: guard('event.create'), config: rl(60) }, async (req, reply) => {
    const e = z
      .object({
        type: z.enum(EVENT_TYPES as [string, ...string[]]),
        lang: Lang.optional(),
        channel: z.enum(['desk', 'kiosk', 'phone', 'booking']).optional(),
        deptId: Id.optional(),
        landmarkId: Id.optional(),
        value: z.string().regex(/^[a-z_]{1,24}$/).optional(),
      })
      .strict()
      .parse(req.body);
    if (!svc.PUBLIC_EVENT_TYPES.has(e.type)) throw new HttpError(403, 'event_type_not_allowed');
    if (e.type === 'feedback' && e.value !== 'yes' && e.value !== 'no') throw new HttpError(400, 'invalid_feedback');
    svc.recordEvent(ctx, e as Parameters<typeof svc.recordEvent>[1]);
    return reply.code(204).send();
  });

  app.post('/api/public/guide-requests', { preHandler: guard('guide.create'), config: rl(5, 10) }, async (req) => {
    const b = z.object({ landmarkId: Id, lang: Lang }).strict().parse(req.body);
    return svc.createGuide(ctx, b.landmarkId, b.lang as 'en');
  });

  app.get('/api/public/guide-requests/:id', { preHandler: guard('guide.readById') }, async (req) => {
    const { id } = z.object({ id: TokenId }).parse(req.params);
    const g = svc.getGuide(ctx, id);
    if (!g) throw new HttpError(404, 'not_found');
    return g;
  });

  app.post('/api/public/assistant', { preHandler: guard('assistant.ask'), config: rl(12, 1, deviceKey) }, async (req) => {
    const b = z
      .object({
        lang: Lang,
        message: Text(300),
        history: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(500) })).max(10).default([]),
        tokenId: TokenId.optional(),
        from: Id.optional(),
      })
      .parse(req.body);
    return ask(ctx, b as Parameters<typeof ask>[1]);
  });

  app.post('/api/public/client-error', { config: rl(10) }, async (req, reply) => {
    const b = z.object({ message: z.string().max(300), path: z.string().max(200).optional() }).parse(req.body);
    // Message and route only; no user data. Hook a real error tracker here if VITE_ERROR_DSN is set.
    req.log.warn({ msg: 'client_error', error: b.message.replace(/[A-Za-z0-9_-]{16,}/g, '[id]'), path: b.path?.replace(/[A-Za-z0-9_-]{16,}/g, '[id]') });
    return reply.code(204).send();
  });

  const PUBLIC_TOPIC = /^(queues|hospital|token:[A-Za-z0-9_-]{16}|guide:[A-Za-z0-9_-]{16}|slots:[A-Za-z][A-Za-z0-9_-]{1,39})$/;
  app.get('/api/public/stream', { config: rl(60) }, async (req, reply) => {
    const { topics } = z.object({ topics: z.string().max(300) }).parse(req.query);
    const list = [...new Set(topics.split(','))].slice(0, 6);
    if (!list.length || !list.every((t) => PUBLIC_TOPIC.test(t))) throw new HttpError(400, 'invalid_topics');
    hub.open(req, reply, list, (t) => {
      if (t === 'queues') return { event: 'queues', data: svc.queueSummaries(ctx) };
      if (t === 'hospital') return { event: 'hospital', data: { version: getHospitalData(db).version } };
      if (t.startsWith('token:')) {
        const v = svc.getTokenView(ctx, t.slice(6));
        return v ? { event: 'token', data: v } : { event: 'token_missing', data: { id: t.slice(6) } };
      }
      if (t.startsWith('guide:')) {
        const g = svc.getGuide(ctx, t.slice(6));
        return g ? { event: 'guide', data: g } : null;
      }
      if (t.startsWith('slots:')) {
        try {
          return { event: 'slots', data: svc.slotsFor(ctx, t.slice(6)) };
        } catch {
          return null;
        }
      }
      return null;
    });
  });

  // ---------- Auth ----------
  app.post('/api/auth/login', { config: rl(10, 15) }, async (req, reply) => {
    const b = z.object({ email: z.string().max(200), password: z.string().min(1).max(200) }).parse(req.body);
    const r = login(db, b.email, b.password);
    if (!r) throw new HttpError(401, 'invalid_credentials');
    svc.audit(ctx, r.user, 'login', r.user.email);
    reply.setCookie(SESSION_COOKIE, r.token, { httpOnly: true, sameSite: 'strict', secure: cfg.production, path: '/', maxAge: SESSION_TTL_MS / 1000 });
    return r.user;
  });
  app.post('/api/auth/logout', async (req, reply) => {
    logout(db, req.cookies?.[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });
  app.get('/api/auth/me', async (req) => ({ user: req.staff, demoTools: cfg.demoTools }));

  // ---------- Staff ----------
  app.post('/api/staff/tokens', { preHandler: guard('token.issue') }, async (req) => {
    const b = z.object({ deptId: Id, urgent: z.boolean().default(false), channel: z.enum(['desk', 'kiosk']).default('desk') }).parse(req.body);
    const v = svc.issueToken(ctx, { deptId: b.deptId, priority: b.urgent ? 1 : 0, channel: b.channel });
    svc.audit(ctx, req.staff, 'token.issue', v.label, { urgent: b.urgent });
    return v;
  });
  app.get('/api/staff/tokens/recent', { preHandler: guard('token.listRecent') }, async () => svc.recentTokens(ctx));

  app.get('/api/staff/queues/:deptId', { preHandler: guard('queue.line', deptParam) }, async (req) => {
    const { deptId } = z.object({ deptId: Id }).parse(req.params);
    return svc.staffLine(ctx, deptId);
  });
  for (const op of ['next', 'recall', 'skip'] as const) {
    app.post(`/api/staff/queues/:deptId/${op}`, { preHandler: guard('queue.operate', deptParam) }, async (req) => {
      const { deptId } = z.object({ deptId: Id }).parse(req.params);
      const r = svc.operateQueue(ctx, deptId, op);
      svc.audit(ctx, req.staff, `queue.${op}`, deptId, { called: r.called?.label ?? null });
      return r;
    });
  }
  app.post('/api/staff/queues/:deptId/simulate', { preHandler: guard('queue.simulate', deptParam) }, async (req) => {
    if (!cfg.demoTools) throw new HttpError(403, 'demo_tools_disabled');
    const { deptId } = z.object({ deptId: Id }).parse(req.params);
    svc.simulateQueue(ctx, deptId);
    svc.audit(ctx, req.staff, 'queue.simulate', deptId);
    return { ok: true };
  });

  app.get('/api/staff/guide-requests', { preHandler: guard('guide.list') }, async () => svc.openGuides(ctx));
  app.post('/api/staff/guide-requests/:id', { preHandler: guard('guide.update') }, async (req) => {
    const { id } = z.object({ id: TokenId }).parse(req.params);
    const { status } = z.object({ status: z.enum(['on_the_way', 'done']) }).parse(req.body);
    const g = svc.updateGuide(ctx, id, status);
    svc.audit(ctx, req.staff, 'guide.update', g.landmarkId, { status });
    return g;
  });

  const doctorDept = (req: FastifyRequest) => getHospitalData(db).doctors.find((d) => d.id === (req.params as { doctorId?: string }).doctorId)?.deptId;
  app.post('/api/staff/doctors/:doctorId/availability', { preHandler: guard('doctor.availability', doctorDept) }, async (req) => {
    const { doctorId } = z.object({ doctorId: Id }).parse(req.params);
    const { available } = z.object({ available: z.boolean() }).parse(req.body);
    const doc = getHospitalData(db).doctors.find((d) => d.id === doctorId);
    if (!doc) throw new HttpError(404, 'unknown_doctor');
    putEntity(db, 'doctor', doctorId, { ...doc, available });
    svc.audit(ctx, req.staff, 'doctor.availability', doctorId, { available });
    hub.publish(`slots:${doctorId}`, 'slots', svc.slotsFor(ctx, doctorId));
    hub.publish('hospital', 'hospital', { version: getHospitalData(db).version });
    return { ok: true };
  });
  app.post('/api/staff/doctors/:doctorId/blocks', { preHandler: guard('slots.block', doctorDept) }, async (req) => {
    const { doctorId } = z.object({ doctorId: Id }).parse(req.params);
    const b = z.object({ slotStart: z.number().int().positive(), blocked: z.boolean() }).parse(req.body);
    svc.setSlotBlocked(ctx, doctorId, b.slotStart, b.blocked);
    svc.audit(ctx, req.staff, b.blocked ? 'slot.block' : 'slot.unblock', doctorId, { slotStart: b.slotStart });
    return { ok: true };
  });

  app.get('/api/staff/stream', async (req, reply) => {
    const { topics } = z.object({ topics: z.string().max(300) }).parse(req.query);
    const list = [...new Set(topics.split(','))].slice(0, 8);
    for (const t of list) {
      if (t === 'staff:guides' && can(req.staff, 'guide.list')) continue;
      const m = t.match(/^staff:line:([A-Za-z][A-Za-z0-9_-]{1,39})$/);
      if (m && can(req.staff, 'queue.line', { deptId: m[1] })) continue;
      return reply.code(req.staff ? 403 : 401).send({ error: 'forbidden' });
    }
    hub.open(req, reply, list, (t) => {
      if (t === 'staff:guides') return { event: 'guides', data: svc.openGuides(ctx) };
      if (t.startsWith('staff:line:')) return { event: 'line', data: svc.staffLine(ctx, t.slice(11)) };
      return null;
    });
  });

  // ---------- Admin ----------
  app.put('/api/admin/entities/:kind/:id', { preHandler: guard('hospital.write') }, async (req) => {
    const { kind, id } = z.object({ kind: z.enum(ENTITY_KINDS), id: Id }).parse(req.params);
    const value = entitySchemas[kind].parse(req.body) as Record<string, unknown>;
    if (value.id !== id) throw new HttpError(400, 'id_mismatch');
    checkReferences(db, kind, value);
    putEntity(db, kind, id, value);
    setMeta(db, 'sample', 'false');
    svc.audit(ctx, req.staff, `entity.put.${kind}`, id);
    hub.publish('hospital', 'hospital', { version: getHospitalData(db).version });
    return getHospitalData(db);
  });
  app.delete('/api/admin/entities/:kind/:id', { preHandler: guard('hospital.write') }, async (req) => {
    const { kind, id } = z.object({ kind: z.enum(ENTITY_KINDS), id: Id }).parse(req.params);
    const data = getHospitalData(db);
    if (kind === 'landmark' && (data.edges.some((e) => e.a === id || e.b === id) || data.departments.some((d) => d.nodeId === id) || data.facilities.some((f) => f.nodeId === id))) {
      throw new HttpError(409, 'in_use');
    }
    if (kind === 'department' && data.doctors.some((d) => d.deptId === id)) throw new HttpError(409, 'in_use');
    if (!deleteEntity(db, kind, id)) throw new HttpError(404, 'not_found');
    svc.audit(ctx, req.staff, `entity.delete.${kind}`, id);
    hub.publish('hospital', 'hospital', { version: getHospitalData(db).version });
    return getHospitalData(db);
  });

  app.get('/api/admin/users', { preHandler: guard('users.manage') }, async () => listStaff(db));
  const Password = z.string().min(10).max(200);
  app.post('/api/admin/users', { preHandler: guard('users.manage') }, async (req) => {
    const b = z.object({ email: z.email().max(200), name: Text(80), role: z.enum(['admin', 'desk', 'dept']), deptId: Id.nullable().default(null), password: Password }).parse(req.body);
    try {
      const u = createStaff(db, b);
      svc.audit(ctx, req.staff, 'user.create', u.email, { role: u.role, deptId: u.deptId });
      return u;
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new HttpError(409, 'email_exists');
      throw e;
    }
  });
  app.patch('/api/admin/users/:id', { preHandler: guard('users.manage') }, async (req) => {
    const { id } = z.object({ id: z.uuid() }).parse(req.params);
    const b = z
      .object({ name: Text(80).optional(), role: z.enum(['admin', 'desk', 'dept']).optional(), deptId: Id.nullable().optional(), active: z.boolean().optional(), password: Password.optional() })
      .parse(req.body);
    if (id === req.staff!.id && (b.active === false || (b.role && b.role !== 'admin'))) throw new HttpError(400, 'cannot_demote_self');
    const u = updateStaff(db, id, b);
    if (!u) throw new HttpError(404, 'not_found');
    svc.audit(ctx, req.staff, 'user.update', u.email, { ...b, password: b.password ? '[changed]' : undefined });
    return u;
  });

  app.get('/api/admin/audit', { preHandler: guard('audit.read') }, async () => svc.auditLog(ctx));
  app.get('/api/admin/insights', { preHandler: guard('insights.read') }, async (req) => {
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query);
    return svc.insights(ctx, days);
  });
  app.get('/api/admin/insights.csv', { preHandler: guard('insights.read') }, async (req, reply) => {
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query);
    reply.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="waymed-insights-${days}d.csv"`);
    return svc.insightsCsv(ctx, days);
  });

  app.all('/api/*', async (_req, reply) => reply.code(404).send({ error: 'not_found' }));

  // ---------- Static web app (production build) ----------
  const staticRoot = resolve(cfg.staticDir);
  if (existsSync(resolve(staticRoot, 'index.html'))) {
    await app.register(fastifyStatic, {
      root: staticRoot,
      wildcard: false,
      setHeaders: (res, path) => {
        if (/[\\/]assets[\\/]/.test(path)) res.header('Cache-Control', 'public, max-age=31536000, immutable');
        else res.header('Cache-Control', 'no-cache');
      },
    });
    app.setNotFoundHandler((req, reply) => {
      if (req.method !== 'GET' || req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not_found' });
      reply.header('Cache-Control', 'no-cache');
      return reply.sendFile('index.html');
    });
  }

  app.addHook('onClose', async () => hub.close());
  return { app, ctx };
}
