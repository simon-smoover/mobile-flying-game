/** Expects optional `// ==VERTEX==` and `// ==FRAGMENT==` markers in a .glsl file. */
export function splitGlsl(source: string): { vertex: string; fragment: string } {
  const vMark = '// ==VERTEX==';
  const fMark = '// ==FRAGMENT==';
  const vi = source.indexOf(vMark);
  const fi = source.indexOf(fMark);
  if (vi !== -1 && fi !== -1 && fi > vi) {
    return {
      vertex: source.slice(vi + vMark.length, fi).trim(),
      fragment: source.slice(fi + fMark.length).trim(),
    };
  }
  if (fi !== -1) {
    return {
      vertex: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragment: source.slice(fi + fMark.length).trim(),
    };
  }
  return {
    vertex: source,
    fragment: source,
  };
}
