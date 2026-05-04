// ==VERTEX==
precision highp float;
uniform float uTime;
uniform float uScroll;
uniform float uBoost;

varying float vFog;
varying vec3 vWorld;
varying vec3 vNormal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 pos = position;
  vec2 p = pos.xz * 0.035 + vec2(uScroll * 0.02, uTime * 0.08);
  float h = fbm(p) * 18.0 + fbm(p * 1.7 + 3.1) * 8.0;
  h += uBoost * sin(uTime * 3.0 + pos.x * 0.05) * 2.5;
  pos.y += h - 6.0;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vWorld = (modelMatrix * vec4(pos, 1.0)).xyz;
  vNormal = normalize(normalMatrix * normal);
  vFog = clamp(length(mv.xyz) / 420.0, 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}

// ==FRAGMENT==
precision highp float;

vec3 applyFog(vec3 col, float fogFactor, vec3 fogColor) {
  return mix(fogColor, col, fogFactor);
}

float fogExp(float dist, float density) {
  return exp(-dist * density);
}

uniform vec3 uFogColor;
uniform float uTime;
uniform float uBoost;
uniform vec3 uWaveColor;
uniform vec3 uFoamColor;

varying float vFog;
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  float fres = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
  vec3 base = mix(uWaveColor, uFoamColor, fres);
  float pulse = 0.15 * sin(uTime * 2.0 + vWorld.x * 0.08 + vWorld.z * 0.08);
  vec3 col = base + pulse * vec3(0.2, 0.35, 0.6) + uBoost * vec3(0.35, 0.1, 0.5);
  float fogF = fogExp(vFog * 2.2, 1.35);
  col = applyFog(col, fogF, uFogColor);
  gl_FragColor = vec4(col, 1.0);
}
