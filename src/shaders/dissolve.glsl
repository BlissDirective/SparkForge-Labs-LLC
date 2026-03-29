// ================================================================
// SparkForge -- Dissolve Transition Shader (Fragment Only)
// ================================================================
// Decision CPA2-5 / CPA2-8: Cockpit skin transition dissolve effect
// Applied to: CockpitSkinManager skin swap transitions
// GPU cost: ~0.2ms (fragment only, noise + edge glow)
//
// Noise-based dissolve with glowing edge emission.
// uProgress drives the transition: 0.0 = fully visible, 1.0 = fully dissolved.
// Edge glow uses uEdgeColor (default neon blue #00BBFF) at the dissolve frontier.
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains this shader as a template
// literal string.

#ifdef GL_ES
precision highp float;
#endif

uniform float uProgress;     // 0.0 = fully visible, 1.0 = fully dissolved
uniform float uEdgeWidth;    // Glow edge thickness (recommended 0.04 - 0.12)
uniform vec3  uEdgeColor;    // Glow color (default: vec3(0.0, 0.733, 1.0) = #00BBFF)
uniform float uTime;         // Animation driver for edge shimmer
uniform float uNoiseScale;   // Noise frequency (default: 4.0)

varying vec2 vUv;

// ────────────────────────────────────────
// Simplex 2D Noise (self-contained)
// ────────────────────────────────────────

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 10.0) * x);
}

float simplex2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
   -0.577350269189626,   // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  // First corner
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  // Other corners
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  // Permutations
  i = mod289(i);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(0.5 - vec3(
    dot(x0, x0),
    dot(x12.xy, x12.xy),
    dot(x12.zw, x12.zw)
  ), 0.0);
  m = m * m;
  m = m * m;

  // Gradients
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// ────────────────────────────────────────
// FBM (4 octaves) for richer dissolve texture
// ────────────────────────────────────────

float fbm4(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * simplex2D(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ────────────────────────────────────────
// Main
// ────────────────────────────────────────

void main() {
  // Scale UV for noise sampling
  float noiseScale = max(uNoiseScale, 1.0);
  vec2 noiseUV = vUv * noiseScale;

  // Multi-octave noise for organic dissolve pattern
  float noise = fbm4(noiseUV) * 0.5 + 0.5; // Remap to [0, 1]

  // Add subtle temporal variation to the dissolve edge
  float timeWarp = simplex2D(vUv * 2.0 + uTime * 0.3) * 0.05;
  noise += timeWarp;

  // Dissolve threshold — pixels with noise below this value are dissolved
  float threshold = uProgress;

  // Distance from dissolve frontier for edge glow calculation
  float distFromEdge = noise - threshold;

  // Discard fully dissolved pixels
  if (distFromEdge < 0.0) {
    discard;
  }

  // Edge glow: bright emission at the dissolve frontier
  float edgeWidth = max(uEdgeWidth, 0.001);
  float edgeFactor = 1.0 - smoothstep(0.0, edgeWidth, distFromEdge);

  // Pulsing shimmer along the dissolve edge (Frost-Prismatic aesthetic)
  float shimmer = sin(uTime * 8.0 + noise * 20.0) * 0.5 + 0.5;
  float shimmerIntensity = edgeFactor * shimmer * 0.4;

  // Edge color with emissive boost — brighter at the frontier
  vec3 edgeEmission = uEdgeColor * edgeFactor * (2.5 + shimmerIntensity);

  // Secondary edge ring (inner glow) for depth
  float innerEdge = 1.0 - smoothstep(0.0, edgeWidth * 2.5, distFromEdge);
  vec3 innerGlow = uEdgeColor * innerEdge * 0.3;

  // Alpha fades near the dissolve frontier for soft edges
  float alpha = smoothstep(0.0, edgeWidth * 0.5, distFromEdge);

  // Final output: edge emission contributes additively
  // The base surface color is expected to come from the material;
  // this shader outputs the dissolve mask + edge glow overlay
  vec3 finalColor = edgeEmission + innerGlow;

  gl_FragColor = vec4(finalColor, alpha);
}
