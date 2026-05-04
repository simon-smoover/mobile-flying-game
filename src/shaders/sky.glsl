// ==VERTEX==
uniform vec3 uCamPos;
varying vec3 vDir;

void main() {
  vec4 wPos = modelMatrix * vec4(position, 1.0);
  vDir = normalize(wPos.xyz - uCamPos);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// ==FRAGMENT==
precision highp float;
uniform float uTime;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGround;
uniform float uBoost;

varying vec3 vDir;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vec3 d = normalize(vDir);
  float t = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(t, 1.4));
  col = mix(uGround, col, smoothstep(-0.25, 0.35, d.y));

  float n = hash(floor(d * 40.0 + uTime * 0.15));
  float breathe = 0.04 * sin(uTime * 1.3 + d.x * 6.0);
  col += (n * 0.08 + breathe) * (0.35 + uBoost * 0.9);
  col += uBoost * vec3(0.15, 0.08, 0.35) * pow(max(d.y, 0.0), 3.0);
  col += vec3(0.04, 0.045, 0.07);

  gl_FragColor = vec4(col, 1.0);
}
