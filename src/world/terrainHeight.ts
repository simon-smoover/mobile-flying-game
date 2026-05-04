/**
 * CPU mirror of `terrain.glsl` vertex displacement so gameplay can stay above the GPU mesh.
 * PlaneGeometry is rotated flat on XZ with local y ≈ 0; mesh sits at y = -10.
 * Shader: pos.y += fbm(...) * 18 + ... - 6  → worldY = -10 + (h - 6).
 */

function fract(x: number): number {
  return x - Math.floor(x);
}

export function hash2(px: number, pz: number): number {
  return fract(Math.sin(px * 127.1 + pz * 311.7) * 43758.5453123);
}

export function noise2(px: number, pz: number): number {
  const i = Math.floor(px);
  const j = Math.floor(pz);
  const fx = px - i;
  const fy = pz - j;
  const a = hash2(i, j);
  const b = hash2(i + 1, j);
  const c = hash2(i, j + 1);
  const d = hash2(i + 1, j + 1);
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  return a + (b - a) * ux + (c - a) * uy * (1.0 - ux) + (d - b) * ux * uy;
}

export function fbm2(px: number, pz: number): number {
  let v = 0;
  let a = 0.5;
  let x = px;
  let z = pz;
  for (let k = 0; k < 5; k++) {
    v += a * noise2(x, z);
    x *= 2.1;
    z *= 2.1;
    a *= 0.5;
  }
  return v;
}

/** Matches GLSL `h` before adding to local y (local flat y ≈ 0). */
export function terrainDisplacementH(
  localX: number,
  localZ: number,
  scroll: number,
  time: number,
  boost: number,
): number {
  const px = localX * 0.035 + scroll * 0.02;
  const pz = localZ * 0.035 + time * 0.08;
  const p1x = px;
  const p1z = pz;
  const h = fbm2(p1x, p1z) * 18.0 + fbm2(p1x * 1.7 + 3.1, p1z * 1.7 + 3.1) * 8.0;
  return h + boost * Math.sin(time * 3.0 + localX * 0.05) * 2.5;
}

/** World-space surface Y at (worldX, worldZ) for terrain mesh at (0,-10,0), identity rotation. */
export function terrainSurfaceWorldY(
  worldX: number,
  worldZ: number,
  scroll: number,
  time: number,
  boost: number,
): number {
  const h = terrainDisplacementH(worldX, worldZ, scroll, time, boost);
  return -10 + (h - 6);
}

/** Sphere center must stay this far above the analytical surface (includes ~0.38 player radius). */
export const DEFAULT_SURFACE_CLEARANCE = 1.78;

export function clampYAboveTerrain(
  y: number,
  worldX: number,
  worldZ: number,
  scroll: number,
  time: number,
  boost: number,
  clearance = DEFAULT_SURFACE_CLEARANCE,
): number {
  const floorY = terrainSurfaceWorldY(worldX, worldZ, scroll, time, boost);
  return Math.max(y, floorY + clearance);
}
