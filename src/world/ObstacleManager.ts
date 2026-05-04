import * as THREE from 'three';
import type { ThemePalette } from './ThemeManager';
import type { CorridorGenerator } from './CorridorGenerator';

interface ObsSlot {
  active: boolean;
  d: number;
  lateral: number;
  vertical: number;
  scale: number;
  mesh: THREE.Mesh;
}

const POOL = 36;

export class ObstacleManager {
  private readonly group = new THREE.Group();
  private readonly slots: ObsSlot[] = [];
  private readonly geom = new THREE.BoxGeometry(1, 1, 1);
  private nextSpawn = 40;

  constructor(scene: THREE.Scene, palette: ThemePalette) {
    scene.add(this.group);
    const mat = new THREE.MeshStandardMaterial({
      color: palette.obstacle.clone(),
      emissive: new THREE.Color('#000000'),
      roughness: 0.55,
      metalness: 0.05,
    });
    for (let i = 0; i < POOL; i++) {
      const mesh = new THREE.Mesh(this.geom, mat.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.slots.push({ active: false, d: 0, lateral: 0, vertical: 0, scale: 3, mesh });
    }
  }

  setPalette(p: ThemePalette) {
    for (const s of this.slots) {
      const m = s.mesh.material as THREE.MeshStandardMaterial;
      m.color.copy(p.obstacle);
    }
  }

  reset() {
    for (const s of this.slots) {
      s.active = false;
      s.mesh.visible = false;
    }
    this.nextSpawn = 40;
  }

  private recycle(): ObsSlot | null {
    for (const s of this.slots) if (!s.active) return s;
    return null;
  }

  update(distance: number, corridor: CorridorGenerator, playerPos: THREE.Vector3): number {
    const horizon = distance + 120;
    while (this.nextSpawn < horizon) {
      const slot = this.recycle();
      if (!slot) break;
      slot.active = true;
      slot.mesh.visible = true;
      slot.d = this.nextSpawn;
      slot.lateral = (Math.random() - 0.5) * 1.85;
      slot.vertical = (Math.random() - 0.5) * 1.1;
      slot.scale = 2.6 + Math.random() * 2.2;
      slot.mesh.scale.setScalar(slot.scale);
      this.nextSpawn += 16 + Math.random() * 22;
    }

    const cull = distance - 40;
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const b = new THREE.Vector3();
    const n = new THREE.Vector3();
    let minD = 1e9;

    for (const s of this.slots) {
      if (!s.active) continue;
      if (s.d < cull) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      corridor.pathTangent(s.d, tan);
      corridor.pathFrame(s.d, tan, b, n);
      corridor.pathPoint(s.d, p);
      p.addScaledVector(b, s.lateral * 8.8);
      p.addScaledVector(n, s.vertical * 5);
      s.mesh.position.copy(p);
      s.mesh.rotation.x += 0.01;
      s.mesh.rotation.y += 0.014;
      const dist = p.distanceTo(playerPos);
      minD = Math.min(minD, dist);
    }
    return minD === 1e9 ? 999 : minD;
  }

  testHit(playerPos: THREE.Vector3, corridor: CorridorGenerator, playerD: number) {
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const b = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (const s of this.slots) {
      if (!s.active) continue;
      if (Math.abs(s.d - playerD) > 30) continue;
      corridor.pathTangent(s.d, tan);
      corridor.pathFrame(s.d, tan, b, n);
      corridor.pathPoint(s.d, p);
      p.addScaledVector(b, s.lateral * 8.8);
      p.addScaledVector(n, s.vertical * 5);
      const r = s.scale * 0.62 + 1.15;
      if (p.distanceTo(playerPos) < r) return true;
    }
    return false;
  }

  dispose() {
    this.group.removeFromParent();
    for (const s of this.slots) (s.mesh.material as THREE.Material).dispose();
    this.geom.dispose();
  }
}
