import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeApp } from './helpers.ts';
import { book, purgeExpired } from '../../server/services.ts';
import type { Slot, TokenView } from '../../src/lib/types.ts';

let apps: { close: () => Promise<unknown> }[] = [];
afterEach(async () => {
  await Promise.all(apps.map((a) => a.close()));
  apps = [];
  vi.restoreAllMocks();
});

// Monday 2026-10-26, 07:00 in Karachi
const MONDAY_7AM = Date.UTC(2026, 9, 26, 2, 0);

describe('booking transaction', () => {
  it('a booked slot becomes unavailable and double booking is impossible', async () => {
    const t = await makeApp({ now: () => MONDAY_7AM });
    apps.push(t.app);
    const slots = (await t.get('/api/public/doctors/d_ped_1/slots')).json() as Slot[];
    const free = slots.find((s) => s.status === 'free')!;
    // Two visitors press "Book" for the same slot at the same moment.
    const [a, b] = await Promise.all([t.post('/api/public/appointments', { doctorId: 'd_ped_1', slotStart: free.start }), t.post('/api/public/appointments', { doctorId: 'd_ped_1', slotStart: free.start })]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409]);
    const ok = (a.statusCode === 200 ? a : b).json() as TokenView;
    expect(ok.label).toMatch(/^PED-\d{3}$/);
    expect(ok.slotStart).toBe(free.start);
    const after = (await t.get('/api/public/doctors/d_ped_1/slots')).json() as Slot[];
    expect(after.find((s) => s.start === free.start)!.status).toBe('booked');
    // Even calling the service directly cannot double book (UNIQUE constraint).
    expect(() => book(t.ctx, 'd_ped_1', free.start)).toThrow();
    expect((t.db.prepare('SELECT COUNT(*) AS n FROM appointments').get() as { n: number }).n).toBe(1);
  });

  it('slots outside the schedule, blocked slots and unavailable doctors cannot be booked', async () => {
    const t = await makeApp({ now: () => MONDAY_7AM });
    apps.push(t.app);
    const admin = await t.login('admin@test.local');
    const slots = (await t.get('/api/public/doctors/d_med_2/slots')).json() as Slot[];
    const outside = slots.find((s) => s.status === 'unavailable')!;
    expect((await t.post('/api/public/appointments', { doctorId: 'd_med_2', slotStart: outside.start })).statusCode).toBe(409);
    const free = ((await t.get('/api/public/doctors/d_ped_1/slots')).json() as Slot[]).find((s) => s.status === 'free')!;
    expect((await t.post('/api/staff/doctors/d_ped_1/blocks', { slotStart: free.start, blocked: true }, admin)).statusCode).toBe(200);
    expect((await t.post('/api/public/appointments', { doctorId: 'd_ped_1', slotStart: free.start })).statusCode).toBe(409);
    expect((await t.post('/api/staff/doctors/d_lab_1/availability', { available: false }, admin)).statusCode).toBe(200);
    const lab = (await t.get('/api/public/doctors/d_lab_1/slots')).json() as Slot[];
    expect(lab.some((s) => s.status === 'free')).toBe(false);
  });

  it('booking needs no personal data and stores none', async () => {
    const t = await makeApp({ now: () => MONDAY_7AM });
    apps.push(t.app);
    const free = ((await t.get('/api/public/doctors/d_ped_1/slots')).json() as Slot[]).find((s) => s.status === 'free')!;
    expect((await t.post('/api/public/appointments', { doctorId: 'd_ped_1', slotStart: free.start, name: 'Ali', phone: '0300' })).statusCode).toBe(200);
    const cols = (t.db.prepare('PRAGMA table_info(appointments)').all() as { name: string }[]).map((c) => c.name);
    expect(cols.sort()).toEqual(['created_at', 'doctor_id', 'expires_at', 'id', 'slot_start', 'token_id']);
  });
});

describe('retention', () => {
  it('tokens, events, guide requests and appointments older than 24 hours are deleted; counts stay', async () => {
    let now = MONDAY_7AM;
    const t = await makeApp({ now: () => now });
    apps.push(t.app);
    const desk = await t.login('desk@test.local');
    const tok = (await t.post('/api/staff/tokens', { deptId: 'lab' }, desk)).json() as TokenView;
    await t.post('/api/public/events', { type: 'lost_help', landmarkId: 'junction' });
    await t.post('/api/public/guide-requests', { landmarkId: 'junction', lang: 'en' });
    const free = ((await t.get('/api/public/doctors/d_ped_1/slots')).json() as Slot[]).find((s) => s.status === 'free')!;
    await t.post('/api/public/appointments', { doctorId: 'd_ped_1', slotStart: free.start });

    now += 23 * 3600_000;
    purgeExpired(t.ctx);
    expect((await t.get(`/api/public/tokens/${tok.id}`)).statusCode).toBe(200);

    now += 1 * 3600_000 + 1000;
    const counts = purgeExpired(t.ctx);
    expect(counts.tokens).toBeGreaterThanOrEqual(2);
    expect((await t.get(`/api/public/tokens/${tok.id}`)).statusCode).toBe(404);
    for (const table of ['tokens', 'events', 'guide_requests', 'appointments']) {
      expect((t.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n, table).toBe(0);
    }
    const agg = (t.db.prepare("SELECT SUM(count) AS n FROM aggregates WHERE metric = 'lost_landmark'").get() as { n: number }).n;
    expect(agg).toBe(1);
  });
});

describe('realtime', () => {
  it('a phone subscribed to its token sees "called" within 2 seconds of Next', async () => {
    const t = await makeApp();
    apps.push(t.app);
    const address = await t.app.listen({ port: 0, host: '127.0.0.1' });
    const desk = await t.login('desk@test.local');
    const ped = await t.login('ped@test.local');
    const tok = (await t.post('/api/staff/tokens', { deptId: 'paediatrics' }, desk)).json() as TokenView;

    const ac = new AbortController();
    const res = await fetch(`${address}/api/public/stream?topics=token:${tok.id},queues`, { signal: ac.signal });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const waitFor = async (pred: (s: string) => boolean, ms: number) => {
      const until = Date.now() + ms;
      while (Date.now() < until) {
        const r = await Promise.race([reader.read(), new Promise<null>((ok) => setTimeout(() => ok(null), until - Date.now()))]);
        if (!r || r.done) break;
        buf += dec.decode(r.value);
        if (pred(buf)) return true;
      }
      return false;
    };
    expect(await waitFor((s) => s.includes('"status":"next"'), 2000)).toBe(true);
    buf = '';
    const pressed = Date.now();
    await t.post('/api/staff/queues/paediatrics/next', {}, ped);
    expect(await waitFor((s) => s.includes('"status":"called"') && s.includes('"nowServing":{'), 2000)).toBe(true);
    expect(Date.now() - pressed).toBeLessThan(2000);
    ac.abort();
  });
});

describe('assistant', () => {
  it('answers in three languages and refuses medical advice without an LLM key', async () => {
    const t = await makeApp();
    apps.push(t.app);
    const ask = (lang: string, message: string) => t.post('/api/public/assistant', { lang, message, history: [] });
    const en = (await ask('en', 'where is the pharmacy')).json();
    expect(en.source).toBe('rules');
    expect(en.action).toEqual({ type: 'route', dest: 'pharmacy' });
    const ur = (await ask('ur', 'پانی کہاں ہے')).json();
    expect(ur.reply).toMatch(/[؀-ۿ]/);
    const sd = (await ask('sd', 'ٻارن جو شعبو ڪٿي آهي')).json();
    expect(sd.action).toEqual({ type: 'route', dest: 'paediatrics' });
    const med = (await ask('en', 'what medicine should I take for my fever')).json();
    expect(med.category).toBe('medical');
    expect(med.reply).toContain('cannot give medical advice');
    // Only the category is stored, never the question text.
    const rows = t.db.prepare("SELECT value FROM events WHERE type = 'assistant_question_category'").all() as { value: string }[];
    expect(rows.map((r) => r.value)).toContain('medical');
    expect(JSON.stringify(rows)).not.toContain('fever');
  });

  it('falls back to rules when the LLM fails, and never sends emergencies to the LLM', async () => {
    const t = await makeApp({ geminiKey: 'test-key-not-real' });
    apps.push(t.app);
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    const r = (await t.post('/api/public/assistant', { lang: 'en', message: 'where is the lab', history: [] })).json();
    expect(r.source).toBe('rules');
    expect(r.action).toEqual({ type: 'route', dest: 'lab' });
    spy.mockClear();
    const em = (await t.post('/api/public/assistant', { lang: 'en', message: 'emergency! child unconscious', history: [] })).json();
    expect(em.action).toEqual({ type: 'emergency' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('uses a grounded LLM answer when available and rejects invented destinations', async () => {
    const t = await makeApp({ geminiKey: 'test-key-not-real' });
    apps.push(t.app);
    const reply = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(reply(JSON.stringify({ reply: 'The laboratory is past the Main Junction.', action: { type: 'route', dest: 'lab' } })));
    const ok = (await t.post('/api/public/assistant', { lang: 'en', message: 'how do I get to the lab', history: [] })).json();
    expect(ok.source).toBe('llm');
    expect(ok.action).toEqual({ type: 'route', dest: 'lab' });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(reply(JSON.stringify({ reply: 'Go to the cardiology wing.', action: { type: 'route', dest: 'cardiology' } })));
    const bad = (await t.post('/api/public/assistant', { lang: 'en', message: 'hello', history: [] })).json();
    expect(bad.action).toBeNull();
  });

  it('rate-limits each device', async () => {
    const t = await makeApp();
    apps.push(t.app);
    let last = 200;
    for (let i = 0; i < 14; i++) last = (await t.app.inject({ method: 'POST', url: '/api/public/assistant', headers: { ...t.H, 'x-device-id': 'dev-1' }, payload: { lang: 'en', message: 'hi', history: [] } })).statusCode;
    expect(last).toBe(429);
  });
});

describe('insights', () => {
  it('reports only real counts and lets the page show "not enough data"', async () => {
    const t = await makeApp();
    apps.push(t.app);
    const admin = await t.login('admin@test.local');
    const empty = (await t.get('/api/admin/insights?days=30', admin)).json();
    expect(empty.feedback).toEqual({ yes: 0, no: 0 });
    expect(empty.tokensByDept).toEqual([]);
    expect(empty.minN).toBe(5);
    for (let i = 0; i < 3; i++) await t.post('/api/public/events', { type: 'lost_help', landmarkId: 'junction' });
    const after = (await t.get('/api/admin/insights?days=30', admin)).json();
    expect(after.lostByLandmark).toEqual([{ key: 'junction', count: 3 }]);
    const csv = await t.get('/api/admin/insights.csv?days=30', admin);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.body.split('\n')[0]).toBe('day,hour,metric,key,count,sum');
  });
});
