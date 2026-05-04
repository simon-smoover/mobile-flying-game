import * as THREE from 'three';
import skySource from '../shaders/sky.glsl?raw';
import terrainSource from '../shaders/terrain.glsl?raw';
import { splitGlsl } from '../shaders/splitGlsl';

export type ThemeId = 'sunset_ocean' | 'aurora_canyon' | 'neon_tunnel';

export interface ThemePalette {
  id: ThemeId;
  zenith: THREE.Color;
  horizon: THREE.Color;
  ground: THREE.Color;
  fog: THREE.Color;
  wave: THREE.Color;
  foam: THREE.Color;
  ring: THREE.Color;
  ringEmissive: THREE.Color;
  boost: THREE.Color;
  obstacle: THREE.Color;
}

const themes: Record<ThemeId, ThemePalette> = {
  sunset_ocean: {
    id: 'sunset_ocean',
    zenith: new THREE.Color('#3d2a6a'),
    horizon: new THREE.Color('#ff9a72'),
    ground: new THREE.Color('#142238'),
    fog: new THREE.Color('#2a2242'),
    wave: new THREE.Color('#2a4a78'),
    foam: new THREE.Color('#ffd0aa'),
    ring: new THREE.Color('#ffd27a'),
    ringEmissive: new THREE.Color('#ffaa55'),
    boost: new THREE.Color('#66f7ff'),
    obstacle: new THREE.Color('#3a2a28'),
  },
  aurora_canyon: {
    id: 'aurora_canyon',
    zenith: new THREE.Color('#0c1c28'),
    horizon: new THREE.Color('#5cffb8'),
    ground: new THREE.Color('#0a1220'),
    fog: new THREE.Color('#122a38'),
    wave: new THREE.Color('#1a4a58'),
    foam: new THREE.Color('#9dffde'),
    ring: new THREE.Color('#9bffec'),
    ringEmissive: new THREE.Color('#55ffd0'),
    boost: new THREE.Color('#b388ff'),
    obstacle: new THREE.Color('#1e2a28'),
  },
  neon_tunnel: {
    id: 'neon_tunnel',
    zenith: new THREE.Color('#1c0a28'),
    horizon: new THREE.Color('#ff62c8'),
    ground: new THREE.Color('#100818'),
    fog: new THREE.Color('#241038'),
    wave: new THREE.Color('#3a1458'),
    foam: new THREE.Color('#ff8dff'),
    ring: new THREE.Color('#f0f0ff'),
    ringEmissive: new THREE.Color('#d56bff'),
    boost: new THREE.Color('#00f5ff'),
    obstacle: new THREE.Color('#2a1038'),
  },
};

export class ThemeManager {
  readonly palette: ThemePalette;
  readonly skyMat: THREE.ShaderMaterial;
  readonly terrainMat: THREE.ShaderMaterial;

  constructor() {
    const ids = Object.keys(themes) as ThemeId[];
    const id = ids[Math.floor(Math.random() * ids.length)]!;
    this.palette = themes[id];

    const skySplit = splitGlsl(skySource);
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCamPos: { value: new THREE.Vector3() },
        uZenith: { value: this.palette.zenith.clone() },
        uHorizon: { value: this.palette.horizon.clone() },
        uGround: { value: this.palette.ground.clone() },
        uBoost: { value: 0 },
      },
      vertexShader: skySplit.vertex,
      fragmentShader: skySplit.fragment,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const terrainSplit = splitGlsl(terrainSource);
    this.terrainMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uBoost: { value: 0 },
        uFogColor: { value: this.palette.fog.clone() },
        uWaveColor: { value: this.palette.wave.clone() },
        uFoamColor: { value: this.palette.foam.clone() },
      },
      vertexShader: terrainSplit.vertex,
      fragmentShader: terrainSplit.fragment,
    });
  }

  updateUniforms(time: number, scroll: number, boost: number) {
    this.skyMat.uniforms.uTime.value = time;
    this.skyMat.uniforms.uBoost.value = boost;
    this.terrainMat.uniforms.uTime.value = time;
    this.terrainMat.uniforms.uScroll.value = scroll;
    this.terrainMat.uniforms.uBoost.value = boost;
  }

  setCameraPosition(cam: THREE.Vector3) {
    this.skyMat.uniforms.uCamPos.value.copy(cam);
  }

}
