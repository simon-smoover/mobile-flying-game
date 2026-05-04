import * as THREE from 'three';

export interface CameraRigInput {
  playerPos: THREE.Vector3;
  tangent: THREE.Vector3;
  bitangent: THREE.Vector3;
  normal: THREE.Vector3;
  speed: number;
  boost: number;
  nearMiss: number;
  chroma: number;
  steerX: number;
  steerY: number;
}

export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;
  private readonly smoothPos = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private readonly offset = new THREE.Vector3();
  private roll = 0;
  private pitch = 0;
  private shakeT = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  reset(at: THREE.Vector3) {
    this.smoothPos.copy(at);
    this.lookTarget.copy(at).add(new THREE.Vector3(0, 0, 1));
    this.roll = 0;
    this.pitch = 0;
    this.camera.position.copy(at);
    this.camera.lookAt(this.lookTarget);
  }

  update(dt: number, input: CameraRigInput) {
    const { playerPos, tangent, normal, speed, boost, nearMiss, chroma, steerX, steerY } = input;

    const rollTarget = -steerX * 0.55;
    const pitchTarget = steerY * 0.4;
    this.roll += (rollTarget - this.roll) * (1 - Math.exp(-9 * dt));
    this.pitch += (pitchTarget - this.pitch) * (1 - Math.exp(-9 * dt));

    const dist = 14 + speed * 0.05;
    const height = 2.2 + this.pitch * 6;
    this.offset.copy(tangent).multiplyScalar(-dist);
    this.offset.addScaledVector(normal, height);

    const desired = this.tmp.copy(playerPos).add(this.offset);
    this.smoothPos.lerp(desired, 1 - Math.exp(-6 * dt));

    this.shakeT += dt * (6 + speed * 0.08 + boost * 10);
    const shake = (0.035 + boost * 0.1 + nearMiss * 0.32 + chroma * 0.18) * (speed / 32);
    const sx = Math.sin(this.shakeT * 13.1) * shake;
    const sy = Math.cos(this.shakeT * 11.7) * shake * 0.55;
    const sz = Math.sin(this.shakeT * 9.3) * shake * 0.3;

    this.camera.position.copy(this.smoothPos).add(this.tmp.set(sx, sy, sz));

    this.lookTarget.lerp(this.tmp.copy(playerPos).addScaledVector(tangent, 26), 1 - Math.exp(-10 * dt));
    this.camera.lookAt(this.lookTarget);
    this.camera.rotateZ(this.roll);

    const baseFov = 66;
    const fov = baseFov + boost * 14 + Math.min(speed, 80) * 0.12 + nearMiss * 10 + chroma * 6;
    this.camera.fov += (fov - this.camera.fov) * (1 - Math.exp(-10 * dt));
    this.camera.updateProjectionMatrix();
  }
}
