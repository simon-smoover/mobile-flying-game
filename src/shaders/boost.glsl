// Fullscreen fragment for chromatic-style punch (sampled in TS via uniforms on post quad — optional).
// Included as logic snippet for ring emissive / HUD-adjacent effects in materials.
precision highp float;
uniform float uTime;
uniform float uBoost;
uniform sampler2D tDiffuse;
varying vec2 vUv;

vec3 sampleRGB(vec2 uv, float amt) {
  float r = texture2D(tDiffuse, uv + vec2(amt, 0.0)).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - vec2(amt, 0.0)).b;
  return vec3(r, g, b);
}

void main() {
  float a = uBoost * 0.006 * (0.6 + 0.4 * sin(uTime * 40.0));
  vec3 col = sampleRGB(vUv, a);
  col += uBoost * vec3(0.08, 0.02, 0.12);
  gl_FragColor = vec4(col, 1.0);
}
