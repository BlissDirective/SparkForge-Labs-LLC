// ================================================================
// Electric Veins — Fragment Shader
// ================================================================
// Animated energy vein propagation for Phase 4 (Electricity Surge).
// L-system fractal branching in UV space with Perlin noise offset.
// Output: emissive contribution to the crystalline logo material.
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 4, Phase 4
//
// Usage: Applied as an additive emissive pass on the crystalline logo
// during Phase 4 (7.5s – 10.0s). uIntensity ramps 0 -> 1 over 2.5s.

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uIntensity;  // Ramps 0 -> 1 over Phase 4 duration (2.5s)

varying vec2 vUv;

// ■■ Perlin Noise 2D (Improved) ■■
// Used for organic displacement of vein branches
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlinNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Quintic interpolation for smoother gradients
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// ■■ Lightning/Vein Branch Function ■■
// Creates a single branching line with noise displacement
float veinBranch(vec2 uv, float frequency, float time, float thickness) {
  // Noise-displaced UV for organic wobble
  vec2 noiseOffset = vec2(
    perlinNoise2D(uv * frequency * 0.5 + time * 0.3),
    perlinNoise2D(uv * frequency * 0.7 + time * 0.4 + 50.0)
  );
  vec2 displaced = uv + noiseOffset * 0.08;

  // Branch pattern: abs(fract - 0.5) creates center-line pattern
  float branchX = abs(fract(displaced.x * frequency) - 0.5);
  float branchY = abs(fract(displaced.y * frequency) - 0.5);

  // Combine X and Y branches for grid-like vein network
  float branch = smoothstep(thickness + 0.02, thickness, branchX);
  branch *= smoothstep(thickness + 0.02, thickness, branchY);

  return branch;
}

// ■■ Electric Vein Color ■■
// Electric blue #00FFFF with white-hot core
vec3 electricColor(float veinStrength) {
  vec3 coreColor = vec3(1.0, 1.0, 1.0);            // White-hot core
  vec3 midColor = vec3(0.2, 0.8, 1.0);              // Bright cyan
  vec3 edgeColor = vec3(0.0, 0.4, 1.0);             // Deep electric blue

  vec3 color = mix(edgeColor, midColor, smoothstep(0.0, 0.5, veinStrength));
  color = mix(color, coreColor, smoothstep(0.6, 1.0, veinStrength));

  return color;
}

void main() {
  // ── 6-octave fractal vein accumulation ──
  // Each octave doubles in frequency and halves in contribution,
  // creating increasingly fine branching detail.
  float vein = 0.0;

  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float freq = pow(2.0, fi);
    float amp = 1.0 / (fi + 1.0);

    // Perlin-displaced UV per octave (from spec Section 4, Phase 4)
    vec2 uv_offset = vUv + perlinNoise2D(vUv * (fi + 1.0) + uTime * 0.5) * 0.1;

    // Branch pattern at this octave
    float branch = smoothstep(0.48, 0.50,
        abs(fract(uv_offset.x * freq) - 0.5));
    branch *= smoothstep(0.48, 0.50,
        abs(fract(uv_offset.y * freq) - 0.5));

    vein += branch * amp;
  }

  // ── Propagation wave ──
  // Veins appear to propagate outward from center over time
  float distFromCenter = length(vUv - 0.5) * 2.0;
  float propagation = smoothstep(
    distFromCenter - 0.1,
    distFromCenter + 0.1,
    uIntensity * 1.5 // Slightly faster than intensity ramp
  );
  vein *= propagation;

  // ── Flickering / arcing effect ──
  // Random high-frequency flicker simulating electrical arcing
  float flicker = perlinNoise2D(vUv * 20.0 + uTime * 8.0) * 0.5 + 0.5;
  float arc = step(0.7, flicker) * 0.5; // Sparse bright arcs
  vein += arc * propagation * 0.3;

  // ── Main trunk veins ──
  // Larger, more prominent veins running through the geometry
  float trunk = veinBranch(vUv, 2.0, uTime, 0.48);
  vein += trunk * 0.4;

  // ── Intensity scaling ──
  vein *= uIntensity;

  // ── Color computation ──
  vec3 veinColor = electricColor(vein);

  // ── Glow bloom contribution ──
  // Additional soft glow around veins for bloom post-processing
  float glow = vein * 0.5;
  float softGlow = smoothstep(0.0, 0.3, vein) * 0.2;

  // ── Final output ──
  // This is an additive emissive contribution — blended on top of
  // the crystalline logo's base material output
  vec3 finalColor = veinColor * (vein + softGlow);
  float alpha = clamp(vein + softGlow * 0.5, 0.0, 1.0) * uIntensity;

  gl_FragColor = vec4(finalColor, alpha);
}
