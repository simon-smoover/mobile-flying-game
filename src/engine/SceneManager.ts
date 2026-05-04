import * as THREE from 'three';
import type { ThemeManager } from '../world/ThemeManager';

export class SceneManager {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private readonly resizeObserver: ResizeObserver;
  private sky: THREE.Mesh;
  private terrain: THREE.Mesh;
  private hemi: THREE.HemisphereLight;
  private dir: THREE.DirectionalLight;
  private raf = 0;
  private onFrame: ((dt: number, time: number) => void) | null = null;
  private last = performance.now();

  constructor(
    private readonly mount: HTMLElement,
    theme: ThemeManager,
  ) {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;
    this.mount.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(66, 1, 0.1, 2000);
    this.camera.position.set(0, 2, -18);

    const skyGeo = new THREE.SphereGeometry(500, 32, 24);
    this.sky = new THREE.Mesh(skyGeo, theme.skyMat);
    this.scene.add(this.sky);

    const terrainGeo = new THREE.PlaneGeometry(900, 900, 180, 180);
    terrainGeo.rotateX(-Math.PI / 2);
    this.terrain = new THREE.Mesh(terrainGeo, theme.terrainMat);
    this.terrain.position.set(0, -10, 0);
    this.scene.add(this.terrain);

    this.hemi = new THREE.HemisphereLight(0xbcd6ff, 0x4a3020, 0.55);
    this.dir = new THREE.DirectionalLight(0xfff2dd, 0.95);
    this.dir.position.set(28, 52, 18);
    this.scene.add(this.hemi, this.dir);

    this.scene.fog = new THREE.FogExp2(theme.palette.fog.clone(), 0.00128);

    this.resize();
    window.addEventListener('resize', this.resize);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.mount);
  }

  private readonly resize = () => {
    const w = this.mount.clientWidth || 1;
    const h = this.mount.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  };

  startLoop(frame: (dt: number, time: number) => void) {
    this.onFrame = frame;
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      this.onFrame?.(dt, t / 1000);
    };
    this.last = performance.now();
    this.raf = requestAnimationFrame(loop);
  }

  stopLoop() {
    cancelAnimationFrame(this.raf);
    this.onFrame = null;
  }

  syncSkyPosition() {
    this.sky.position.copy(this.camera.position);
  }

  updateFogColor(color: THREE.Color, density = 0.0018) {
    const fog = this.scene.fog;
    if (fog instanceof THREE.FogExp2) {
      fog.color.copy(color);
      fog.density = density;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(theme: ThemeManager) {
    this.stopLoop();
    window.removeEventListener('resize', this.resize);
    this.resizeObserver.disconnect();
    this.scene.remove(this.hemi);
    this.scene.remove(this.dir);
    this.scene.remove(this.sky);
    this.scene.remove(this.terrain);
    this.sky.geometry.dispose();
    this.terrain.geometry.dispose();
    theme.skyMat.dispose();
    theme.terrainMat.dispose();
    this.renderer.dispose();
    this.mount.removeChild(this.renderer.domElement);
  }
}
