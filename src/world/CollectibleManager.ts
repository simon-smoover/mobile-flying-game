import * as THREE from 'three';
import type { ThemePalette } from './ThemeManager';
import type { CorridorGenerator } from './CorridorGenerator';

export type CollectibleKind = 'ring' | 'orb' | 'boost';

interface Slot {
  active: boolean;
  d: number;
  lateral: number;
  vertical: number;
  kind: CollectibleKind;
  mesh: THREE.Mesh;
}

const POOL = 96;
const PLAYER_NEAR = 2.85;
const BOOST_NEAR = 3.6;

export class CollectibleManager {
  private readonly group = new THREE.Group();
  private readonly slots: Slot[] = [];
  private readonly ringGeom = new THREE.TorusGeometry(2.1, 0.12, 10, 36);
  private readonly orbGeom = new THREE.SphereGeometry(0.55, 14, 14);
  private readonly boostGeom = new THREE.TorusGeometry(3.4, 0.22, 10, 40);
  private nextSpawn = 18;
  private palette: ThemePalette;

  constructor(scene: THREE.Scene, palette: ThemePalette) {
    this.palette = palette;
    scene.add(this.group);
    for (let i = 0; i < POOL; i++) {
      const kind: CollectibleKind = 'ring';
      const mesh = this.makeMesh(kind);
      mesh.visible = false;
      this.group.add(mesh);
      this.slots.push({ active: false, d: 0, lateral: 0, vertical: 0, kind, mesh });
    }
  }

  setPalette(p: ThemePalette) {
    this.palette = p;
    for (const s of this.slots) this.paint(s.mesh, s.kind);
  }

  private makeMesh(kind: CollectibleKind): THREE.Mesh {
    const geo =
      kind === 'orb' ? this.orbGeom : kind === 'boost' ? this.boostGeom : this.ringGeom;
    const mesh = new THREE.Mesh(geo, this.materialFor(kind));
    mesh.userData.kind = kind;
    return mesh;
  }

  private materialFor(kind: CollectibleKind): THREE.MeshStandardMaterial {
    const m = new THREE.MeshStandardMaterial({
      color: this.palette.ring.clone(),
      emissive: this.palette.ringEmissive.clone(),
      emissiveIntensity: kind === 'boost' ? 2.2 : 1.35,
      metalness: 0.2,
      roughness: 0.35,
    });
    if (kind === 'boost') {
      m.color.copy(this.palette.boost);
      m.emissive.copy(this.palette.boost);
    }
    if (kind === 'orb') {
      m.color.set('#ffffff');
      m.emissive.copy(this.palette.ringEmissive);
      m.emissiveIntensity = 1.6;
    }
    return m;
  }

  private paint(mesh: THREE.Mesh, kind: CollectibleKind) {
    const old = mesh.material as THREE.MeshStandardMaterial;
    old.dispose();
    mesh.geometry =
      kind === 'orb' ? this.orbGeom : kind === 'boost' ? this.boostGeom : this.ringGeom;
    mesh.material = this.materialFor(kind);
    mesh.userData.kind = kind;
  }

  reset() {
    for (const s of this.slots) {
      s.active = false;
      s.mesh.visible = false;
    }
    this.nextSpawn = 18;
  }

  private recycle(): Slot | null {
    for (const s of this.slots) if (!s.active) return s;
    return null;
  }

  private spawnLine(startD: number) {
    const count = 3 + Math.floor(Math.random() * 4);
    const lateral = (Math.random() - 0.5) * 1.4;
    const vertical = (Math.random() - 0.5) * 0.7;
    for (let i = 0; i < count; i++) {
      const slot = this.recycle();
      if (!slot) return;
      slot.kind = 'ring';
      this.ensureMeshKind(slot);
      slot.d = startD + i * 6.5;
      slot.lateral = lateral + (Math.random() - 0.5) * 0.15;
      slot.vertical = vertical + (Math.random() - 0.5) * 0.08;
      slot.active = true;
      slot.mesh.visible = true;
    }
  }

  private ensureMeshKind(slot: Slot) {
    const kind = slot.mesh.userData.kind as CollectibleKind;
    if (kind !== slot.kind) {
      this.paint(slot.mesh, slot.kind);
    }
  }

  private spawnBoost(d: number) {
    const slot = this.recycle();
    if (!slot) return;
    slot.kind = 'boost';
    slot.d = d;
    slot.lateral = (Math.random() - 0.5) * 0.4;
    slot.vertical = (Math.random() - 0.5) * 0.25;
    slot.active = true;
    slot.mesh.visible = true;
    this.ensureMeshKind(slot);
  }

  private spawnOrb(d: number) {
    const slot = this.recycle();
    if (!slot) return;
    slot.kind = 'orb';
    slot.d = d;
    slot.lateral = (Math.random() - 0.5) * 1.8;
    slot.vertical = (Math.random() - 0.5) * 1.1;
    slot.active = true;
    slot.mesh.visible = true;
    this.ensureMeshKind(slot);
  }

  update(
    distance: number,
    corridor: CorridorGenerator,
    playerPos: THREE.Vector3,
    dt: number,
    handlers: {
      onRing: () => void;
      onOrb: () => void;
      onBoostGate: () => void;
    },
  ) {
    const horizon = distance + 140;
    while (this.nextSpawn < horizon) {
      const roll = Math.random();
      if (roll < 0.12) this.spawnOrb(this.nextSpawn + 4);
      else if (roll < 0.2) this.spawnBoost(this.nextSpawn + 10);
      else this.spawnLine(this.nextSpawn);
      this.nextSpawn += 10 + Math.random() * 16;
    }

    const cull = distance - 35;
    const p = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const b = new THREE.Vector3();
    const n = new THREE.Vector3();

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
      p.addScaledVector(b, s.lateral * 8.5);
      p.addScaledVector(n, s.vertical * 4.8);
      s.mesh.position.copy(p);
      const t = tan.clone().normalize();
      s.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t);

      const near = s.kind === 'boost' ? BOOST_NEAR : PLAYER_NEAR;
      if (p.distanceTo(playerPos) < near) {
        s.active = false;
        s.mesh.visible = false;
        if (s.kind === 'ring') handlers.onRing();
        else if (s.kind === 'orb') handlers.onOrb();
        else handlers.onBoostGate();
      }
    }

    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.08;
    for (const s of this.slots) {
      if (!s.active) continue;
      const m = s.mesh.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = (s.kind === 'boost' ? 2.4 : 1.4) * pulse;
    }

    void dt;
  }

  dispose() {
    this.group.removeFromParent();
    for (const s of this.slots) {
      (s.mesh.material as THREE.Material).dispose();
    }
    this.ringGeom.dispose();
    this.orbGeom.dispose();
    this.boostGeom.dispose();
  }
}
