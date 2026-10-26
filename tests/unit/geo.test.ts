import { describe, expect, it } from 'vitest';
import { OffRouteDetector, distToPolyline, farFromPlan, gpsToPlan, nearestNode, planToGps } from '../../src/lib/geo.ts';
import { findRoute } from '../../src/lib/route.ts';
import { sampleHospital as data } from '../../src/data/sampleHospital.ts';
import type { GeoRef } from '../../src/lib/types.ts';

const ref = data.hospital.geo!;
const route = findRoute(data, 'registration', 'door_med')!;
const mpu = ref.metersPerUnit;

describe('on-device location', () => {
  it('converts GPS to plan coordinates and back', () => {
    for (const p of [
      [100, 560],
      [500, 400],
      [920, 280],
    ] as [number, number][]) {
      const g = planToGps(ref, p);
      const back = gpsToPlan(ref, g.lat, g.lng);
      expect(back[0]).toBeCloseTo(p[0], 3);
      expect(back[1]).toBeCloseTo(p[1], 3);
    }
  });

  it('handles a rotated plan', () => {
    const rot: GeoRef = { ...ref, rotationDeg: 30 };
    const g = planToGps(rot, [400, 300]);
    const back = gpsToPlan(rot, g.lat, g.lng);
    expect(back[0]).toBeCloseTo(400, 3);
    expect(back[1]).toBeCloseTo(300, 3);
  });

  it('measures distance to the route', () => {
    expect(distToPolyline([260, 560], route.points)).toBeCloseTo(0, 5);
    expect(distToPolyline([560, 560], route.points) * mpu).toBeGreaterThan(15);
  });

  it('needs several consecutive off-route readings before alerting', () => {
    const d = new OffRouteDetector();
    const off: [number, number] = [600, 600];
    expect(d.push(off, 5, route.points, mpu)).toBe('on');
    expect(d.push(off, 5, route.points, mpu)).toBe('on');
    expect(d.push(off, 5, route.points, mpu)).toBe('off');
  });

  it('a single stray reading does not raise an alert', () => {
    const d = new OffRouteDetector();
    d.push([600, 600], 5, route.points, mpu);
    d.push([600, 600], 5, route.points, mpu);
    expect(d.push([380, 480], 5, route.points, mpu)).toBe('on'); // back on route resets the count
    expect(d.push([600, 600], 5, route.points, mpu)).toBe('on');
  });

  it('ignores inaccurate readings, so weak indoor GPS never causes a false alarm', () => {
    const d = new OffRouteDetector();
    for (let i = 0; i < 10; i++) expect(d.push([900, 600], 60, route.points, mpu)).toBe('ignored');
    expect(d.push([900, 600], Number.NaN, route.points, mpu)).toBe('ignored');
  });

  it('allows for the reading\'s own accuracy before calling it off-route', () => {
    const d = new OffRouteDetector();
    // About 17 m off the route but with 18 m accuracy: could still be on route.
    const p: [number, number] = [380 + 0.6 * (17 / mpu), 480 + 0.8 * (17 / mpu)];
    for (let i = 0; i < 5; i++) expect(d.push(p, 18, route.points, mpu)).toBe('on');
  });

  it('finds the nearest place and detects readings far from the hospital', () => {
    expect(nearestNode(data, [505, 395])).toBe('junction');
    expect(farFromPlan([500, 300], mpu)).toBe(false);
    expect(farFromPlan([50000, 300], mpu)).toBe(true);
  });
});
