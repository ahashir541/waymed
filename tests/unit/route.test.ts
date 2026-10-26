import { describe, expect, it } from 'vitest';
import { classifyTurn, findRoute, resolveDestination, shortestPath, turnAngle } from '../../src/lib/route.ts';
import { stepText } from '../../src/lib/directions.ts';
import { sampleHospital as data } from '../../src/data/sampleHospital.ts';
import type { HospitalData } from '../../src/lib/types.ts';

describe('route engine', () => {
  it('finds the shortest path (through the steps) from the entrance to Children', () => {
    const r = findRoute(data, 'entrance', 'door_ped')!;
    expect(r.nodes).toEqual(['entrance', 'registration', 'junction', 'waiting', 'door_ped']);
    expect(r.steps[0].kind).toBe('start');
    expect(r.steps.at(-1)!.kind).toBe('arrive');
    expect(r.steps.some((s) => s.note === 'steps')).toBe(true);
  });

  it('step-free mode avoids every edge with steps', () => {
    const r = findRoute(data, 'entrance', 'door_ped', true)!;
    expect(r.nodes).toEqual(['entrance', 'ramp', 'junction', 'waiting', 'door_ped']);
    const used = r.nodes.slice(1).map((n, i) => data.edges.find((e) => (e.a === r.nodes[i] && e.b === n) || (e.b === r.nodes[i] && e.a === n))!);
    expect(used.every((e) => e.stepFree)).toBe(true);
    expect(r.meters).toBeGreaterThan(findRoute(data, 'entrance', 'door_ped')!.meters);
  });

  it('returns null when no step-free route exists', () => {
    const cut: HospitalData = { ...data, edges: data.edges.filter((e) => e.id !== 'e4' && e.id !== 'e11' && e.id !== 'e9') };
    expect(findRoute(cut, 'entrance', 'door_ped', true)).toBeNull();
    expect(findRoute(cut, 'entrance', 'door_ped', false)).not.toBeNull();
  });

  it('returns null for unknown nodes', () => {
    expect(shortestPath(data, 'nowhere', 'door_ped')).toBeNull();
  });

  it('route to the same node is just start and arrive', () => {
    const r = findRoute(data, 'junction', 'junction')!;
    expect(r.steps.map((s) => s.kind)).toEqual(['start', 'arrive']);
  });

  it('emergency is reached directly from the entrance', () => {
    expect(findRoute(data, 'entrance', 'door_emr')!.nodes).toEqual(['entrance', 'door_emr']);
  });

  it('classifies turns in screen coordinates (y down)', () => {
    expect(classifyTurn(turnAngle([1, 0], [1, 0]))).toBe('straight');
    expect(classifyTurn(turnAngle([1, 0], [0, 1]))).toBe('right');
    expect(classifyTurn(turnAngle([1, 0], [0, -1]))).toBe('left');
    expect(classifyTurn(turnAngle([1, 0], [-1, 0.01]))).toBe('back');
    expect(classifyTurn(turnAngle([1, 0], [1, 1]))).toBe('slight_right');
  });

  it('resolves departments, landmarks and the nearest facility', () => {
    expect(resolveDestination(data, 'paediatrics', 'entrance')).toBe('door_ped');
    expect(resolveDestination(data, 'junction', 'entrance')).toBe('junction');
    expect(resolveDestination(data, 'water', 'entrance')).toBe('junction');
    expect(resolveDestination(data, 'water', 'waiting')).toBe('waiting');
    expect(resolveDestination(data, 'prayer', 'entrance')).toBe('labCorridor');
    expect(resolveDestination(data, 'unknown-place', 'entrance')).toBeNull();
  });

  it('produces directions in English, Urdu and Sindhi', () => {
    const r = findRoute(data, 'entrance', 'door_ped')!;
    const en = r.steps.map((s) => stepText(s, data, 'en'));
    const ur = r.steps.map((s) => stepText(s, data, 'ur'));
    const sd = r.steps.map((s) => stepText(s, data, 'sd'));
    expect(en[0]).toContain('Main Entrance');
    expect(en.at(-1)).toContain('Children');
    expect(ur[0]).toContain('مرکزی دروازہ');
    expect(sd[0]).toContain('مکيه دروازو');
    for (const list of [en, ur, sd]) expect(list.every((x) => x.length > 5 && !x.includes('{'))).toBe(true);
  });
});
