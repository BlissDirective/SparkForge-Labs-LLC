// ================================================================
// Crystalline Logo — Vertex Shader (WebGL2 fallback)
// ================================================================
// Displacement mapping for crystalline faceting of extruded "SparkForge" text.
// UV generation for fragment shader consumption.
// Normal perturbation for faceted bevel edges.
//
// In WebGPU mode, this logic is implemented via TSL MeshPhysicalNodeMaterial.
// This GLSL file serves as WebGL2 fallback and documentation reference.
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 4, Phase 2

uniform float uTime;
uniform float uDisplacementScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Simplex-like hash for per-vertex facet displacement
float hash31(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Crystalline faceting: displace vertices along normal
  // using a per-face hash for faceted appearance
  vec3 facetSeed = floor(position * 10.0) * 0.1;
  float facetOffset = hash31(facetSeed) * 2.0 - 1.0;

  // Animated breathing: subtle vertex displacement over time
  float breath = sin(uTime * 1.2 + position.y * 2.0) * 0.003;

  // Bevel edge perturbation: stronger displacement at UV extremes
  float bevelFactor = smoothstep(0.4, 0.5, abs(uv.x - 0.5))
                    + smoothstep(0.4, 0.5, abs(uv.y - 0.5));
  float bevelDisplace = bevelFactor * 0.005;

  // Combined displacement along normal
  float totalDisplacement = facetOffset * uDisplacementScale + breath + bevelDisplace;
  vec3 displaced = position + normal * totalDisplacement;

  vPosition = displaced;
  vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
