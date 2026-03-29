// ================================================================
// SparkForge -- Wormhole Tunnel Energy Shader (Fragment Only)
// ================================================================
// Decision CPA2-6: Lab entry tunnel energy effect
// Applied to: WormholeTransition tunnel interior walls
// GPU cost: ~0.3ms (fragment only, radial distortion + swirl bands)
//
// Radial tunnel distortion with spiraling energy bands,
// chromatic aberration, and lab-colored energy pulses.
// uProgress drives the transition: 0.0 = entry, 1.0 = exit.
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains this shader as a template
// literal string.

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;       // Animation driver (elapsed seconds)
uniform float uProgress;   // 0.0 = entry, 1.0 = exit
uniform vec3  uLabColor;   // Destination lab accent color
uniform float uSpeed;      // Swirl speed multiplier (default: 1.0)

varying vec2 vUv;

// ────────────────────────────────────────
// Constants — Frost-Prismatic palette
// ────────────────────────────────────────

const vec3 BASE_COLOR  = vec3(0.039, 0.055, 0.086);   // #0A0E16 (surface base)
const vec3 NEON_BLUE   = vec3(0.0, 0.733, 1.0);       // #00BBFF (primary accent)
const float PI         = 3.14159265359;
const float TAU        = 6.28318530718;

// ────────────────────────────────────────
// Noise Utilities (self-contained)
// ────────────────────────────────────────

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // Hermite interpolation

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm3(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * valueNoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ────────────────────────────────────────
// Tunnel Coordinate Transform
// ────────────────────────────────────────

// Convert UV to polar tunnel coordinates
// x = angle around tunnel, y = depth into tunnel
vec2 tunnelCoords(vec2 uv) {
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float angle = atan(centered.y, centered.x);

  // Tunnel depth: inverse of radius (center = far away)
  float depth = 0.5 / max(radius, 0.001);

  return vec2(angle / TAU + 0.5, depth);
}

// ────────────────────────────────────────
// Spiraling Energy Bands
// ────────────────────────────────────────

float energyBands(vec2 tc, float time, float speed) {
  float angle = tc.x * TAU;
  float depth = tc.y;

  // Primary spiral bands — 4 arms rotating with depth
  float spiral = sin(angle * 4.0 - depth * 8.0 + time * speed * 2.0);
  spiral = smoothstep(0.3, 0.8, spiral);

  // Secondary fine-grain energy lines
  float fine = sin(angle * 12.0 + depth * 16.0 - time * speed * 4.0);
  fine = smoothstep(0.6, 0.95, fine) * 0.5;

  // Pulsing depth rings
  float rings = sin(depth * 20.0 - time * speed * 6.0);
  rings = smoothstep(0.7, 1.0, rings) * 0.3;

  return spiral + fine + rings;
}

// ────────────────────────────────────────
// Chromatic Aberration
// ────────────────────────────────────────

vec3 chromaticSample(vec2 uv, float spread) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  vec2 dir = normalize(center + 0.001);

  // Offset each color channel radially
  float rOffset = spread * 1.0;
  float gOffset = spread * 0.0;
  float bOffset = spread * -1.0;

  vec2 tcR = tunnelCoords(uv + dir * rOffset);
  vec2 tcG = tunnelCoords(uv + dir * gOffset);
  vec2 tcB = tunnelCoords(uv + dir * bOffset);

  float time = uTime * max(uSpeed, 0.1);

  float r = energyBands(tcR, time, uSpeed);
  float g = energyBands(tcG, time, uSpeed);
  float b = energyBands(tcB, time, uSpeed);

  return vec3(r, g, b);
}

// ────────────────────────────────────────
// Main
// ────────────────────────────────────────

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float time = uTime * max(uSpeed, 0.1);

  // Tunnel coordinates
  vec2 tc = tunnelCoords(uv);

  // ── Base tunnel energy ──
  float energy = energyBands(tc, time, uSpeed);

  // ── Chromatic aberration (stronger at edges + during transition) ──
  float chromaStrength = 0.008 + uProgress * 0.012;
  vec3 chromaEnergy = chromaticSample(uv, chromaStrength);

  // ── Radial distortion warp ──
  float warp = fbm3(tc * 3.0 + time * 0.5) * 0.15;
  vec2 warpedTC = tc + vec2(warp, -warp * 0.5);
  float warpedEnergy = energyBands(warpedTC, time, uSpeed);

  // Blend warped and clean energy
  energy = mix(energy, warpedEnergy, 0.4);

  // ── Lab-colored energy ──
  // Mix between neon blue base and destination lab color based on progress
  vec3 activeColor = mix(NEON_BLUE, uLabColor, uProgress);

  // Energy band coloring with chromatic split
  vec3 bandColor = activeColor * energy;
  vec3 chromaColor = chromaEnergy * vec3(
    uLabColor.r * 0.8 + 0.2,
    uLabColor.g * 0.8 + 0.2,
    uLabColor.b * 0.8 + 0.2
  );
  bandColor = mix(bandColor, chromaColor, 0.3);

  // ── Tunnel depth fog ──
  // Fade center (deep tunnel) to destination lab color
  float depthFog = smoothstep(0.0, 0.3, radius);
  vec3 fogColor = uLabColor * 0.5;
  bandColor = mix(fogColor * (0.5 + uProgress * 0.5), bandColor, depthFog);

  // ── Edge vignette — bright ring at tunnel mouth ──
  float vignette = smoothstep(0.5, 0.35, radius);
  float edgeGlow = smoothstep(0.35, 0.48, radius) * smoothstep(0.52, 0.48, radius);
  bandColor += activeColor * edgeGlow * 1.5;

  // ── Speed streak particles ──
  float streaks = fbm3(vec2(tc.x * 30.0, tc.y * 2.0 - time * 3.0));
  streaks = smoothstep(0.65, 0.9, streaks) * 0.4;
  bandColor += activeColor * streaks;

  // ── Progress-based intensity ──
  // Entry (0.0): dim tunnel forming
  // Mid (0.5): full intensity
  // Exit (1.0): bright flash, then dissolve
  float progressIntensity;
  if (uProgress < 0.5) {
    progressIntensity = smoothstep(0.0, 0.3, uProgress) * 1.5;
  } else {
    progressIntensity = 1.5 + (uProgress - 0.5) * 2.0; // Brighten toward exit
  }
  bandColor *= progressIntensity;

  // ── Final composition ──
  vec3 finalColor = BASE_COLOR + bandColor;

  // Alpha: solid during tunnel, fades at entry and exit
  float alpha = smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.85, uProgress);
  // Radial alpha — transparent at very center (looking through tunnel)
  alpha *= smoothstep(0.02, 0.15, radius);

  gl_FragColor = vec4(finalColor, alpha);
}
