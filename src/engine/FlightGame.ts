import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { CollectibleManager } from '../world/CollectibleManager';
import { CorridorGenerator } from '../world/CorridorGenerator';
import { ObstacleManager } from '../world/ObstacleManager';
import { ThemeManager } from '../world/ThemeManager';
import { CameraRig } from './CameraRig';
import { InputController } from './InputController';
import { SceneManager } from './SceneManager';

export type GameState = 'menu' | 'playing' | 'crashed';

export interface UiSnapshot {
  state: GameState;
  score: number;
  combo: number;
  themeLabel: string;
}

const BASE_SPEED = 26;
const BOOST_MULT = 1.9;
const CHAIN_FOR_BOOST = 5;

export class FlightGame {
  private readonly theme: ThemeManager;
  private readonly scene: SceneManager;
  private readonly input: InputController;
  private readonly cameraRig: CameraRig;
  private readonly corridor = new CorridorGenerator();
  private readonly collectibles: CollectibleManager;
  private readonly obstacles: ObstacleManager;
  private readonly audio = new AudioManager();
  private readonly playerMesh: THREE.Mesh;
  private state: GameState = 'menu';
  private distance = 0;
  private runAge = 0;
  private boostTime = 0;
  private chain = 0;
  private combo = 1;
  private comboTimer = 0;
  private score = 0;
  private chromaBurst = 0;
  private nearMiss = 0;
  private smoothedSteerX = 0;
  private smoothedSteerY = 0;
  private readonly playerPos = new THREE.Vector3();
  private readonly tangent = new THREE.Vector3();
  private readonly bitangent = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();

  constructor(
    private readonly mount: HTMLElement,
    private readonly onUi: (u: UiSnapshot) => void,
  ) {
    this.theme = new ThemeManager();
    this.scene = new SceneManager(this.mount, this.theme);
    this.input = new InputController(this.scene.renderer.domElement);
    this.cameraRig = new CameraRig(this.scene.camera);
    this.collectibles = new CollectibleManager(this.scene.scene, this.theme.palette);
    this.obstacles = new ObstacleManager(this.scene.scene, this.theme.palette);

    const pm = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x151520),
      emissive: this.theme.palette.ringEmissive.clone(),
      emissiveIntensity: 1.5,
      metalness: 0.4,
      roughness: 0.35,
    });
    this.playerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), pm);
    this.scene.scene.add(this.playerMesh);

    this.scene.startLoop(this.frame);
    this.idleCamera();
    this.pushUi(true);
  }

  private readonly frame = (dt: number, time: number) => {
    if (this.state === 'playing') this.updatePlaying(dt, time);
    else this.updateIdle(time);

    this.scene.syncSkyPosition();
    this.theme.setCameraPosition(this.scene.camera.position);
    this.scene.render();
  };

  private updateIdle(time: number) {
    this.theme.updateUniforms(time, time * 6, 0.12 + Math.sin(time * 0.7) * 0.06);
    this.corridor.pathPoint(0, this.playerPos);
    this.cameraRig.camera.position.lerp(
      this.playerPos.clone().add(new THREE.Vector3(0, 2.5, -16)),
      0.04,
    );
    this.cameraRig.camera.lookAt(this.playerPos.clone().add(new THREE.Vector3(0, 0.5, 8)));
  }

  private updatePlaying(dt: number, time: number) {
    this.runAge += dt;
    this.input.relax(dt);

    const k = 1 - Math.exp(-15 * dt);
    this.smoothedSteerX += (this.input.steerX - this.smoothedSteerX) * k;
    this.smoothedSteerY += (this.input.steerY - this.smoothedSteerY) * k;

    const easeT = Math.min(1.2, this.runAge);
    const ease = 1 - Math.pow(1 - easeT / 1.2, 2);

    if (this.boostTime > 0) this.boostTime = Math.max(0, this.boostTime - dt);
    const boosting = this.boostTime > 0;
    const spd = BASE_SPEED * ease * (boosting ? BOOST_MULT : 1);
    this.distance += spd * dt;

    this.corridor.pathTangent(this.distance, this.tangent);
    this.corridor.pathFrame(this.distance, this.tangent, this.bitangent, this.normal);
    this.corridor.pathPoint(this.distance, this.playerPos);
    this.playerPos.addScaledVector(this.bitangent, this.smoothedSteerX * 9);
    this.playerPos.addScaledVector(this.normal, this.smoothedSteerY * 5);
    this.playerMesh.position.copy(this.playerPos);

    this.collectibles.update(this.distance, this.corridor, this.playerPos, dt, {
      onRing: () => this.onRingCollect(),
      onOrb: () => {
        this.score += 55;
        this.comboTimer = 2.4;
        this.audio.playCollect();
      },
      onBoostGate: () => this.addBoost(),
    });

    const minD = this.obstacles.update(this.distance, this.corridor, this.playerPos);
    if (minD > 2.4 && minD < 5.4) {
      this.nearMiss = Math.max(this.nearMiss, 1 - (minD - 2.4) / 3);
    } else {
      this.nearMiss *= Math.exp(-10 * dt);
    }

    if (this.obstacles.testHit(this.playerPos, this.corridor, this.distance)) {
      this.crash();
      return;
    }

    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.combo = THREE.MathUtils.lerp(this.combo, 1, 1 - Math.exp(-3 * dt));
    }

    this.chromaBurst *= Math.exp(-5 * dt);

    const boostVis = Math.min(1, this.boostTime * 0.55 + this.chromaBurst * 0.85);
    this.theme.updateUniforms(time, this.distance, boostVis);
    this.audio.setBoostDrive(boostVis);

    this.cameraRig.update(dt, {
      playerPos: this.playerPos,
      tangent: this.tangent,
      bitangent: this.bitangent,
      normal: this.normal,
      speed: spd,
      boost: boostVis,
      nearMiss: this.nearMiss,
      chroma: this.chromaBurst + (easeT < 0.35 ? (1 - easeT / 0.35) * 0.6 : 0),
      steerX: this.smoothedSteerX,
      steerY: this.smoothedSteerY,
    });

    this.pushUi();
  }

  private onRingCollect() {
    this.chain += 1;
    this.score += Math.floor(100 * Math.max(1, Math.floor(this.combo)));
    this.combo = Math.min(8, this.combo + 0.35);
    this.comboTimer = 2.5;
    this.audio.playCollect();
    if (this.chain >= CHAIN_FOR_BOOST) {
      this.chain = 0;
      this.addBoost();
    }
  }

  private addBoost() {
    this.boostTime = Math.min(6.5, this.boostTime + 3.4);
    this.chromaBurst = 1;
    this.audio.playBoost();
  }

  private crash() {
    if (this.state !== 'playing') return;
    this.state = 'crashed';
    this.audio.playCrash();
    this.audio.setBoostDrive(0);
    this.pushUi(true);
  }

  private idleCamera() {
    this.corridor.pathPoint(0, this.playerPos);
  }

  private lastSnap: UiSnapshot | null = null;

  private pushUi(force = false) {
    const snap: UiSnapshot = {
      state: this.state,
      score: Math.floor(this.score),
      combo: Math.max(1, Math.floor(this.combo)),
      themeLabel: this.theme.palette.id.replace(/_/g, ' '),
    };
    if (!force) {
      const p = this.lastSnap;
      if (
        p &&
        p.state === snap.state &&
        p.score === snap.score &&
        p.combo === snap.combo &&
        p.themeLabel === snap.themeLabel
      ) {
        return;
      }
    }
    this.lastSnap = snap;
    this.onUi(snap);
  }

  start() {
    this.audio.unlock();
    this.resetRun();
    this.state = 'playing';
    this.chromaBurst = 0.85;
    this.pushUi(true);
  }

  restart() {
    this.audio.unlock();
    this.resetRun();
    this.state = 'playing';
    this.chromaBurst = 0.75;
    this.pushUi(true);
  }

  private resetRun() {
    this.distance = 0;
    this.runAge = 0;
    this.boostTime = 0;
    this.chain = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.score = 0;
    this.nearMiss = 0;
    this.smoothedSteerX = 0;
    this.smoothedSteerY = 0;
    this.input.steerX = 0;
    this.input.steerY = 0;
    this.collectibles.reset();
    this.obstacles.reset();
    this.corridor.pathPoint(0, this.playerPos);
    this.cameraRig.reset(this.playerPos.clone().add(new THREE.Vector3(0, 2.2, -14)));
  }

  dispose() {
    this.collectibles.dispose();
    this.obstacles.dispose();
    this.input.dispose();
    this.audio.dispose();
    this.scene.scene.remove(this.playerMesh);
    (this.playerMesh.material as THREE.Material).dispose();
    this.playerMesh.geometry.dispose();
    this.scene.dispose(this.theme);
    this.theme.dispose();
  }
}
