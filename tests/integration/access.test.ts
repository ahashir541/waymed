// Access-policy integration tests: the server-side equivalent of Firestore security-rules tests.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeApp } from './helpers.ts';
import { can, POLICY } from '../../server/policy.ts';

let t: Awaited<ReturnType<typeof makeApp>>;
let desk: string, ped: string, admin: string;
beforeAll(async () => {
  t = await makeApp({ demoTools: true });
  [desk, ped, admin] = await Promise.all([t.login('desk@test.local'), t.login('ped@test.local'), t.login('admin@test.local')]);
});
afterAll(() => t.app.close());

describe('visitors (anonymous)', () => {
  it('can read public hospital data and queue summaries', async () => {
    expect((await t.get('/api/public/hospital')).statusCode).toBe(200);
    expect((await t.get('/api/public/queues')).statusCode).toBe(200);
  });

  it('cannot issue tokens, operate queues or read any staff or admin data', async () => {
    expect((await t.post('/api/staff/tokens', { deptId: 'paediatrics' })).statusCode).toBe(401);
    expect((await t.post('/api/staff/queues/paediatrics/next', {})).statusCode).toBe(401);
    for (const url of ['/api/staff/tokens/recent', '/api/staff/queues/paediatrics', '/api/staff/guide-requests', '/api/admin/users', '/api/admin/audit', '/api/admin/insights', '/api/admin/insights.csv']) {
      expect((await t.get(url)).statusCode, url).toBe(401);
    }
    const put = await t.app.inject({ method: 'PUT', url: '/api/admin/entities/department/x', headers: t.H, payload: {} });
    expect(put.statusCode).toBe(401);
  });

  it('can read one token by its id, but cannot list tokens', async () => {
    const tok = (await t.post('/api/staff/tokens', { deptId: 'paediatrics' }, desk)).json();
    const r = await t.get(`/api/public/tokens/${tok.id}`);
    expect(r.statusCode).toBe(200);
    expect(Object.keys(r.json()).sort()).toEqual(['ahead', 'calledAt', 'createdAt', 'deptId', 'id', 'label', 'recalledAt', 'slotEnd', 'slotStart', 'status', 'updatedAt', 'wait'].sort());
    expect((await t.get('/api/public/tokens')).statusCode).toBe(404);
    expect((await t.get('/api/public/tokens/not-a-valid-id')).statusCode).toBe(400);
  });

  it('can create only allowed anonymous events, with no free text', async () => {
    expect((await t.post('/api/public/events', { type: 'lost_help', landmarkId: 'junction', lang: 'ur' })).statusCode).toBe(204);
    expect((await t.post('/api/public/events', { type: 'feedback', value: 'yes' })).statusCode).toBe(204);
    expect((await t.post('/api/public/events', { type: 'slip_issued', deptId: 'paediatrics' })).statusCode).toBe(403);
    expect((await t.post('/api/public/events', { type: 'feedback', value: 'my name is Ali' })).statusCode).toBe(400);
    expect((await t.post('/api/public/events', { type: 'lost_help', name: 'Ali', phone: '0300' })).statusCode).toBe(400);
  });

  it('every state-changing call needs the CSRF header and a same-origin Origin', async () => {
    const noHeader = await t.app.inject({ method: 'POST', url: '/api/public/events', headers: { 'content-type': 'application/json' }, payload: { type: 'feedback', value: 'yes' } });
    expect(noHeader.statusCode).toBe(403);
    const evil = await t.app.inject({ method: 'POST', url: '/api/public/events', headers: { ...t.H, origin: 'https://evil.example' }, payload: { type: 'feedback', value: 'yes' } });
    expect(evil.statusCode).toBe(403);
  });

  it('cannot subscribe to staff topics', async () => {
    expect((await t.get('/api/public/stream?topics=staff:guides')).statusCode).toBe(400);
    expect((await t.get('/api/staff/stream?topics=staff:guides')).statusCode).toBe(401);
  });

  it('wrong passwords are rejected', async () => {
    const r = await t.post('/api/auth/login', { email: 'admin@test.local', password: 'nope' });
    expect(r.statusCode).toBe(401);
  });
});

describe('staff roles', () => {
  it('desk staff issue slips but cannot call next or administer', async () => {
    expect((await t.post('/api/staff/tokens', { deptId: 'lab', urgent: true }, desk)).statusCode).toBe(200);
    expect((await t.post('/api/staff/queues/lab/next', {}, desk)).statusCode).toBe(403);
    expect((await t.get('/api/admin/users', desk)).statusCode).toBe(403);
  });

  it('department staff operate only their own department', async () => {
    expect((await t.post('/api/staff/queues/paediatrics/next', {}, ped)).statusCode).toBe(200);
    expect((await t.post('/api/staff/queues/lab/next', {}, ped)).statusCode).toBe(403);
    expect((await t.post('/api/staff/tokens', { deptId: 'paediatrics' }, ped)).statusCode).toBe(403);
  });

  it('admins can edit hospital data, with validation and reference checks', async () => {
    const data = (await t.get('/api/public/hospital')).json();
    const dept = { ...data.departments[0], avgServiceMin: 12 };
    expect((await t.app.inject({ method: 'PUT', url: `/api/admin/entities/department/${dept.id}`, headers: { ...t.H, cookie: admin }, payload: dept })).statusCode).toBe(200);
    const bad = { ...dept, color: 'red' };
    expect((await t.app.inject({ method: 'PUT', url: `/api/admin/entities/department/${dept.id}`, headers: { ...t.H, cookie: admin }, payload: bad })).statusCode).toBe(400);
    const badRef = { ...dept, nodeId: 'nowhere' };
    expect((await t.app.inject({ method: 'PUT', url: `/api/admin/entities/department/${dept.id}`, headers: { ...t.H, cookie: admin }, payload: badRef })).statusCode).toBe(400);
    expect((await t.app.inject({ method: 'PUT', url: `/api/admin/entities/department/${dept.id}`, headers: { ...t.H, cookie: desk }, payload: dept })).statusCode).toBe(403);
  });

  it('staff actions are written to the audit log', async () => {
    const rows = (await t.get('/api/admin/audit', admin)).json() as { action: string }[];
    expect(rows.some((r) => r.action === 'token.issue')).toBe(true);
    expect(rows.some((r) => r.action === 'queue.next')).toBe(true);
    expect(rows.some((r) => r.action === 'entity.put.department')).toBe(true);
  });

  it('policy is default-deny', () => {
    expect(can(null, 'token.issue')).toBe(false);
    expect(can(null, 'nonexistent' as keyof typeof POLICY)).toBe(false);
    expect(can({ id: 'x', email: 'x', name: 'x', role: 'admin', deptId: null, active: false }, 'users.manage')).toBe(false);
  });
});

describe('security headers', () => {
  it('sends CSP, frame and referrer protections', async () => {
    const r = await t.get('/api/health');
    expect(r.headers['content-security-policy']).toContain("default-src 'self'");
    expect(r.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['referrer-policy']).toBe('no-referrer');
    expect(String(r.headers['permissions-policy'])).toContain('geolocation=(self)');
  });
});

describe('visitor self-issued slips', () => {
  it('a visitor can take a slip for a department, never for Emergency, and is rate limited', async () => {
    const h = { ...t.H, 'x-device-id': 'phone-a' };
    const ok = await t.app.inject({ method: 'POST', url: '/api/public/tokens', headers: h, payload: { deptId: 'medicine' } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().label).toMatch(/^MED-\d{3}$/);
    expect(Object.keys(ok.json())).not.toContain('channel');
    const em = await t.app.inject({ method: 'POST', url: '/api/public/tokens', headers: h, payload: { deptId: 'emergency' } });
    expect(em.statusCode).toBe(400);
    const extra = await t.app.inject({ method: 'POST', url: '/api/public/tokens', headers: h, payload: { deptId: 'medicine', name: 'Ali' } });
    expect(extra.statusCode).toBe(400);
    let last = 200;
    for (let i = 0; i < 3; i++) last = (await t.app.inject({ method: 'POST', url: '/api/public/tokens', headers: h, payload: { deptId: 'lab' } })).statusCode;
    expect(last).toBe(429);
  });
});
