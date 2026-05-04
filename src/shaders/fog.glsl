// Shared GLSL chunk (included as string prefix in other shaders)
vec3 applyFog(vec3 col, float fogFactor, vec3 fogColor) {
  return mix(fogColor, col, fogFactor);
}

float fogExp(float dist, float density) {
  return exp(-dist * density);
}
