// Route engine: shortest path over the landmark graph, with a step-free mode,
// and turn-by-turn steps that the UI renders in English, Urdu and Sindhi.
import type { Edge, FacilityType, HospitalData, Landmark } from './types.ts';
import { FACILITY_TYPES } from './types.ts';

export type Pt = [number, number];
export type TurnKind = 'start' | 'straight' | 'slight_left' | 'slight_right' | 'left' | 'right' | 'back' | 'arrive';

export interface RouteStep {
  kind: TurnKind;
  nodeId: string;
  note: Edge['note'];
  meters: number;
}

export interface RouteResult {
  from: string;
  to: string;
  nodes: string[];
  points: Pt[];
  meters: number;
  steps: RouteStep[];
  stepFree: boolean;
}

/** Plan units to metres. The sample plan is 1000 units wide, roughly 120 m. */
export const METERS_PER_UNIT = 0.12;

const dist = (p: Pt, q: Pt) => Math.hypot(q[0] - p[0], q[1] - p[1]);

export function edgePoints(edge: Edge, nodes: Map<string, Landmark>, fromId: string): Pt[] {
  const a = nodes.get(edge.a);
  const b = nodes.get(edge.b);
  if (!a || !b) return [];
  const pts: Pt[] = [[a.x, a.y], ...(edge.via ?? []), [b.x, b.y]];
  return fromId === edge.a ? pts : pts.reverse();
}

export function polylineLength(pts: Pt[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** Signed turn angle in degrees from heading u to heading v. Positive = right turn (screen coordinates, y down). */
export function turnAngle(u: Pt, v: Pt): number {
  const cross = u[0] * v[1] - u[1] * v[0];
  const dot = u[0] * v[0] + u[1] * v[1];
  return (Math.atan2(cross, dot) * 180) / Math.PI;
}

export function classifyTurn(deg: number): TurnKind {
  const a = Math.abs(deg);
  if (a < 25) return 'straight';
  if (a >= 150) return 'back';
  if (a < 60) return deg > 0 ? 'slight_right' : 'slight_left';
  return deg > 0 ? 'right' : 'left';
}

interface Adj {
  to: string;
  edge: Edge;
  len: number;
}

function buildGraph(data: HospitalData, stepFree: boolean) {
  const nodes = new Map(data.landmarks.map((l) => [l.id, l]));
  const adj = new Map<string, Adj[]>();
  for (const l of data.landmarks) adj.set(l.id, []);
  for (const e of data.edges) {
    if (stepFree && !e.stepFree) continue;
    if (!nodes.has(e.a) || !nodes.has(e.b)) continue;
    const len = polylineLength(edgePoints(e, nodes, e.a));
    adj.get(e.a)!.push({ to: e.b, edge: e, len });
    adj.get(e.b)!.push({ to: e.a, edge: e, len });
  }
  return { nodes, adj };
}

/** Dijkstra over the landmark graph. Returns null when the destination cannot be reached. */
export function shortestPath(data: HospitalData, from: string, to: string, stepFree = false) {
  const { nodes, adj } = buildGraph(data, stepFree);
  if (!nodes.has(from) || !nodes.has(to)) return null;
  const d = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { node: string; edge: Edge }>();
  const done = new Set<string>();
  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const [k, v] of d) {
      if (!done.has(k) && v < best) {
        best = v;
        u = k;
      }
    }
    if (u === null) return null;
    if (u === to) break;
    done.add(u);
    for (const { to: w, edge, len } of adj.get(u) ?? []) {
      const nd = best + len;
      if (nd < (d.get(w) ?? Infinity)) {
        d.set(w, nd);
        prev.set(w, { node: u, edge });
      }
    }
  }
  const path: string[] = [to];
  const edges: Edge[] = [];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur)!;
    edges.unshift(p.edge);
    path.unshift(p.node);
    cur = p.node;
  }
  return { path, edges, length: d.get(to)!, nodes };
}

const roundMeters = (m: number) => Math.max(5, Math.round(m / 5) * 5);

export function findRoute(data: HospitalData, from: string, to: string, stepFree = false): RouteResult | null {
  const sp = shortestPath(data, from, to, stepFree);
  if (!sp) return null;
  const { path, edges, nodes } = sp;
  const points: Pt[] = [];
  const steps: RouteStep[] = [{ kind: 'start', nodeId: from, note: null, meters: 0 }];
  let lastHeading: Pt | null = null;
  edges.forEach((edge, i) => {
    const pts = edgePoints(edge, nodes, path[i]);
    if (i === 0) points.push(pts[0]);
    points.push(...pts.slice(1));
    const head: Pt = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
    const kind: TurnKind = lastHeading ? classifyTurn(turnAngle(lastHeading, head)) : 'straight';
    const n = pts.length;
    lastHeading = [pts[n - 1][0] - pts[n - 2][0], pts[n - 1][1] - pts[n - 2][1]];
    steps.push({ kind, nodeId: path[i + 1], note: edge.note ?? null, meters: roundMeters(polylineLength(pts) * METERS_PER_UNIT) });
  });
  steps.push({ kind: 'arrive', nodeId: to, note: null, meters: 0 });
  return {
    from,
    to,
    nodes: path,
    points,
    meters: roundMeters(sp.length * METERS_PER_UNIT),
    steps,
    stepFree,
  };
}

/**
 * Resolve a destination string to a graph node.
 * Accepts a department id, a landmark id, a facility id or a facility type (nearest one wins).
 */
export function resolveDestination(data: HospitalData, dest: string, from: string, stepFree = false): string | null {
  const dept = data.departments.find((d) => d.id === dest);
  if (dept) return dept.nodeId;
  if (data.landmarks.some((l) => l.id === dest)) return dest;
  const fac = data.facilities.find((f) => f.id === dest);
  if (fac) return fac.nodeId;
  if ((FACILITY_TYPES as string[]).includes(dest)) {
    let best: string | null = null;
    let bestLen = Infinity;
    for (const f of data.facilities.filter((x) => x.type === (dest as FacilityType))) {
      if (f.nodeId === from) return from;
      const sp = shortestPath(data, from, f.nodeId, stepFree);
      if (sp && sp.length < bestLen) {
        bestLen = sp.length;
        best = f.nodeId;
      }
    }
    return best;
  }
  return null;
}

/** Department whose door is this node, if any. */
export function deptAtNode(data: HospitalData, nodeId: string) {
  return data.departments.find((d) => d.nodeId === nodeId) ?? null;
}

export function emergencyDept(data: HospitalData) {
  return data.departments.find((d) => d.isEmergency) ?? null;
}

/** SVG path "d" for a list of points. */
export const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
