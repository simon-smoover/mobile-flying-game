import { describe, expect, it } from 'vitest';
import {
  clampYAboveTerrain,
  DEFAULT_SURFACE_CLEARANCE,
  fbm2,
  hash2,
  noise2,
  terrainDisplacementH,
  terrainSurfaceWorldY,
} from './terrainHeight';

describe('terrainHeight', () => {
  it('hash2 is deterministic in [0,1)', () => {
    const a = hash2(1.2, -3.4);
    const b = hash2(1.2, -3.4);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('noise2 is bounded', () => {
    const v = noise2(12.3, -45.6);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });

  it('fbm2 returns stable finite values for a grid', () => {
    for (let x = -20; x <= 20; x += 7) {
      for (let z = -20; z <= 20; z += 7) {
        const v = fbm2(x, z);
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(20);
      }
    }
  });

  it('terrainSurfaceWorldY stays below typical player path for flat-ish regions', () => {
    const y = terrainSurfaceWorldY(0, 0, 0, 0, 0);
    expect(Number.isFinite(y)).toBe(true);
    expect(y).toBeLessThan(5);
    expect(y).toBeGreaterThan(-40);
  });

  it('clampYAboveTerrain never returns below floor+clearance', () => {
    const scroll = 120;
    const time = 3.3;
    const boost = 0.4;
    const wx = 8;
    const wz = 40;
    const floor = terrainSurfaceWorldY(wx, wz, scroll, time, boost);
    const yBad = floor - 50;
    const yClamped = clampYAboveTerrain(yBad, wx, wz, scroll, time, boost, DEFAULT_SURFACE_CLEARANCE);
    expect(yClamped).toBeGreaterThanOrEqual(floor + DEFAULT_SURFACE_CLEARANCE - 1e-6);
  });

  it('matches golden snapshot for displacement at origin', () => {
    const h = terrainDisplacementH(0, 0, 0, 0, 0);
    expect(h).toBeCloseTo(3.900_049, 5);
  });
});
