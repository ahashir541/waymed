// Realtime updates over Server-Sent Events. Phones, kiosks and the board subscribe to topics:
//   queues            all department queue summaries (public)
//   token:<id>        one token's public status (public, needs the unguessable id)
//   guide:<id>        one guide request's status (public, needs the unguessable id)
//   staff:guides      open guide requests (staff only)
//   staff:line:<dept> full waiting line of one department (staff only)
import type { FastifyReply, FastifyRequest } from 'fastify';

interface Client {
  id: number;
  reply: FastifyReply;
  topics: Set<string>;
  ipKey: string;
}

export class Hub {
  private clients = new Set<Client>();
  private byTopic = new Map<string, Set<Client>>();
  private perIp = new Map<string, number>();
  private seq = 0;
  private timer: NodeJS.Timeout | null = null;
  readonly maxClients: number;
  readonly maxPerIp: number;

  constructor(opts: { maxClients?: number; maxPerIp?: number } = {}) {
    this.maxClients = opts.maxClients ?? 5000;
    this.maxPerIp = opts.maxPerIp ?? 40;
    this.timer = setInterval(() => this.broadcastRaw(': ping\n\n'), 15_000);
    this.timer.unref();
  }

  get size() {
    return this.clients.size;
  }

  hasSubscribers(topic: string) {
    return (this.byTopic.get(topic)?.size ?? 0) > 0;
  }

  /** Topics with at least one subscriber that start with a prefix. */
  topicsWithPrefix(prefix: string): string[] {
    return [...this.byTopic.keys()].filter((t) => t.startsWith(prefix) && this.hasSubscribers(t));
  }

  /**
   * Open an SSE stream. `snapshot` returns the current state for a topic so a client
   * that connects (or reconnects after being offline) is immediately up to date.
   */
  open(req: FastifyRequest, reply: FastifyReply, topics: string[], snapshot: (topic: string) => { event: string; data: unknown } | null) {
    // The IP is used only in memory to cap connections per device. It is never stored or logged.
    const ipKey = req.ip;
    if (this.clients.size >= this.maxClients || (this.perIp.get(ipKey) ?? 0) >= this.maxPerIp) {
      reply.code(503).send({ error: 'busy' });
      return;
    }
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    });
    reply.raw.write('retry: 2000\n\n');
    const client: Client = { id: ++this.seq, reply, topics: new Set(topics), ipKey };
    this.clients.add(client);
    this.perIp.set(ipKey, (this.perIp.get(ipKey) ?? 0) + 1);
    for (const t of topics) {
      if (!this.byTopic.has(t)) this.byTopic.set(t, new Set());
      this.byTopic.get(t)!.add(client);
      const snap = snapshot(t);
      if (snap) this.write(client, t, snap.event, snap.data);
    }
    const close = () => this.remove(client);
    req.raw.on('close', close);
    reply.raw.on('error', close);
  }

  publish(topic: string, event: string, data: unknown) {
    const subs = this.byTopic.get(topic);
    if (!subs) return;
    for (const c of subs) this.write(c, topic, event, data);
  }

  close() {
    if (this.timer) clearInterval(this.timer);
    for (const c of this.clients) c.reply.raw.end();
    this.clients.clear();
    this.byTopic.clear();
    this.perIp.clear();
  }

  private write(c: Client, topic: string, event: string, data: unknown) {
    try {
      c.reply.raw.write(`event: ${event}\ndata: ${JSON.stringify({ topic, data })}\n\n`);
    } catch {
      this.remove(c);
    }
  }

  private broadcastRaw(s: string) {
    for (const c of this.clients) {
      try {
        c.reply.raw.write(s);
      } catch {
        this.remove(c);
      }
    }
  }

  private remove(c: Client) {
    if (!this.clients.delete(c)) return;
    const n = (this.perIp.get(c.ipKey) ?? 1) - 1;
    if (n <= 0) this.perIp.delete(c.ipKey);
    else this.perIp.set(c.ipKey, n);
    for (const t of c.topics) {
      const set = this.byTopic.get(t);
      set?.delete(c);
      if (set && set.size === 0) this.byTopic.delete(t);
    }
  }
}
