import * as THREE from 'three';

/** Smooth spline-like path in world space; forward is +Z. */
export class CorridorGenerator {
  pathPoint(d: number, out = new THREE.Vector3()): THREE.Vector3 {
    const x = Math.sin(d * 0.011) * 12 + Math.sin(d * 0.037) * 3;
    const y = Math.cos(d * 0.016) * 4.5 + Math.cos(d * 0.029) * 1.2;
    return out.set(x, y, d);
  }

  pathTangent(d: number, out = new THREE.Vector3()): THREE.Vector3 {
    const eps = 2;
    const p0 = this.pathPoint(d);
    const p1 = this.pathPoint(d + eps);
    return out.copy(p1).sub(p0).normalize();
  }

  /** Right-ish vector along the corridor cross-section. */
  pathFrame(_d: number, tangent: THREE.Vector3, outB = new THREE.Vector3(), outN = new THREE.Vector3()) {
    const up = new THREE.Vector3(0, 1, 0);
    outB.copy(tangent).cross(up);
    if (outB.lengthSq() < 1e-6) outB.set(1, 0, 0);
    outB.normalize();
    outN.copy(outB).cross(tangent).normalize();
    return { bitangent: outB, normal: outN };
  }
}
