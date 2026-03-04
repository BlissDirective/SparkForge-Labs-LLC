# Stage 5 Parts 2-3A v3-FINAL — Reward Shaders

**Version:** v3-FINAL (corrected)
**Build Phase:** 9A (Part A of Parts 2-3)
**Prerequisites:** Stage 5 Part 1 complete, Stage 3 Part 3 v3-FINAL (noise.glsl, shaders/index.ts), Stage 4 Part 2 v3-FINAL
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS

---

## Overview

This document ADDS 4 new GLSL shaders and appends 8 shader exports to `src/shaders/index.ts`. These are the **reward shaders** that power the visual upgrades for badges, cards, shields, and streak flames in the v3 Laboratory Control Station vision.

**Document scope:** NEW shader files only. All v2 Stage 5 files remain untouched. This is Part A of the v3-FINAL Stage 5 enhancement — shaders only (no R3F components).

### Decisions Implemented

| Decision | Description | Shader |
|----------|-------------|--------|
| 4.2 | LiquidMetal Epic+Legendary | liquidMetal.glsl |
| 4.3 | Holographic collectibles only | holographic.glsl |
| 4.5 | Energy field 3D dome desktop, CSS mobile | energyField.glsl |
| — | Diamond streak flame (100+ day) | fireNoise.glsl |

### Files Created / Modified

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `src/shaders/liquidMetal.glsl` | CREATE | Vertex+Fragment: flowing mercury surface for Epic/Legendary badges |
| 2 | `src/shaders/holographic.glsl` | CREATE | Fragment only: rainbow diffraction for collectible cards |
| 3 | `src/shaders/energyField.glsl` | CREATE | Vertex+Fragment: hex dome with shatter for streak shield |
| 4 | `src/shaders/fireNoise.glsl` | CREATE | Vertex+Fragment: prismatic procedural flame for Diamond tier |
| 5 | `src/shaders/index.ts` | MODIFY (APPEND) | 8 new exports: 4 vertex + 4 fragment shader strings |

### GPU Performance Budget

| Shader | Applied To | GPU Cost | When Active |
|--------|-----------|----------|-------------|
| liquidMetal | Epic/Legendary badges in Trophy Room | ~0.3ms/badge | Trophy Room only |
| holographic | DailySparkCard, CosmeticShop cards | ~0.1ms | Profile / Shop only |
| energyField | Streak shield dome (desktop) | ~0.2ms | Profile page only |
| fireNoise | Diamond streak flame (100+ day) | ~0.2ms | Profile page only |

### Shader Uniform Interface Summary

| Shader | Key Uniforms | Noise Dep. |
|--------|-------------|------------|
| liquidMetal | uTime, uIntensity(0.5/1.0), uColor, uRippleCenter, uRippleStrength | Yes (simplex3D) |
| holographic | uTime, uTilt(vec2), uIntensity, uBaseColor | No |
| energyField | uTime, uColor, uShieldHP, uShatterProgress, uBreathScale, uIntensity | Yes (simplex3D) |
| fireNoise | uTime, uIntensity, uFlameHeight | Yes (simplex3D) |

### Rarity Visual Reference

| Rarity | Color | LiquidMetal | Holographic | Pedestal (Part B) |
|--------|-------|-------------|-------------|-------------------|
| Common | #64748B | No | No | Brushed steel |
| Uncommon | #10B981 | No | No | Polished chrome |
| Rare | #3B82F6 | No | No | Blue glass + glow |
| Epic | #8B5CF6 | Yes (0.5x) | No | Purple crystal + Bloom |
| Legendary | #F59E0B | Yes (1.0x) | No | Gold PBR + fire particles |

---

## Code Review Fixes Applied

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | CRITICAL | holographic.glsl | `gl_FragColor` placed OUTSIDE `main()` closing brace — PDF corruption moved it after `}` | Moved inside `main()` before closing brace |
| 2 | HIGH | energyField.glsl (fragment) | PDF corruption: 3 uniform declarations crammed on single line with displaced comments | Split to separate lines, attached comments inline |
| 3 | HIGH | energyField.glsl (fragment) | `cameraPosition` used without declaration — Three.js built-in | Added comment documenting Three.js built-in uniform |
| 4 | MEDIUM | holographic.glsl (index.ts) | Verified index.ts version has `gl_FragColor` correctly inside main() | Confirmed correct in index.ts — fix applied to standalone .glsl only |
| 5 | MEDIUM | fireNoise.glsl (vertex) | Vertex shader does not use noise functions but index.ts prepends noiseGLSL | Harmless — unused GLSL functions don't error. Documented as intentional for consistency |
| 6 | LOW | liquidMetal.glsl | Single .glsl contains both vertex and fragment with comment separator | Documented: standalone is reference; index.ts splits into separate exports |
| 7 | LOW | All .glsl files | Missing documentation note that these are reference files | Added note to each .glsl header clarifying index.ts is the actual import source |

---

## Step 1: Create `src/shaders/liquidMetal.glsl`

Decision 4.2: Flowing liquid mercury surface for Epic (0.5x displacement) and Legendary (1.0x + mouse ripple) badges.

```glsl
// ================================================================
// SparkForge -- Liquid Metal Shader (Vertex + Fragment)
// ================================================================
// Decision 4.2: Epic (0.5x) + Legendary (1.0x + mouse ripple)
// Applied to: BadgeLevitate3D meshes in Trophy Room
// GPU cost: ~0.3ms per badge
//
// VERTEX: Simplex noise displacement for surface undulation
// FRAGMENT: Metallic BRDF + animated noise + Fresnel reflection
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: liquidMetalVertexShader

uniform float uTime;
uniform float uIntensity;       // 0.5 for Epic, 1.0 for Legendary
uniform vec2 uRippleCenter;     // Mouse position in UV space
uniform float uRippleStrength;  // 0.0 = no ripple, 1.0 = full

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

// simplex3D is prepended from noise.glsl

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Base undulation: 3 octaves of simplex noise
  float noise1 = simplex3D(vec3(position.xy * 1.5, uTime * 0.3)) * 0.5;
  float noise2 = simplex3D(vec3(position.xy * 3.0, uTime * 0.5)) * 0.25;
  float noise3 = simplex3D(vec3(position.xy * 6.0, uTime * 0.8)) * 0.125;
  float totalNoise = (noise1 + noise2 + noise3) * uIntensity;

  // Mouse ripple (Legendary only, uRippleStrength > 0)
  float distToMouse = distance(uv, uRippleCenter);
  float ripple = sin(distToMouse * 20.0 - uTime * 8.0) *
                 exp(-distToMouse * 4.0) *
                 uRippleStrength * 0.15;

  // Combined displacement along normal
  float displacement = totalNoise * 0.08 + ripple;
  vDisplacement = displacement;

  vec3 displaced = position + normal * displacement;
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}

// ---- FRAGMENT SHADER ----
// Export as: liquidMetalFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;      // Badge rarity color
uniform float uIntensity;  // 0.5 for Epic, 1.0 for Legendary

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel effect -- stronger reflection at glancing angles
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  fresnel = mix(0.2, 1.0, fresnel);

  // Base metallic color with animated flow
  float flow = simplex3D(vec3(vUv * 4.0, uTime * 0.4)) * 0.5 + 0.5;
  vec3 baseColor = mix(uColor * 0.6, uColor * 1.4, flow);

  // Specular highlight (Blinn-Phong)
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  vec3 specColor = vec3(1.0, 0.95, 0.9) * spec * 1.5;

  // Environment reflection approximation
  vec3 reflectDir = reflect(-viewDir, normal);
  float envReflect = simplex3D(reflectDir * 2.0 + uTime * 0.2) * 0.5 + 0.5;
  vec3 envColor = mix(
    vec3(0.1, 0.15, 0.3),  // Dark blue ambient
    vec3(0.4, 0.5, 0.7),   // Bright sky reflection
    envReflect
  );

  // Combine: base metal + fresnel reflection + specular
  vec3 finalColor = mix(baseColor, envColor, fresnel * 0.6);
  finalColor += specColor;

  // Displacement-based darkening in valleys
  float valleyDarken = smoothstep(-0.05, 0.05, vDisplacement);
  finalColor *= mix(0.7, 1.0, valleyDarken);

  // Edge glow based on intensity
  finalColor += uColor * fresnel * 0.3 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## Step 2: Create `src/shaders/holographic.glsl`

Decision 4.3: Rainbow diffraction on collectible cards. Pure fragment shader.

**FIX applied:** `gl_FragColor` was outside `main()` in the original — moved inside.

```glsl
// ================================================================
// SparkForge -- Holographic Card Shader (Fragment Only)
// ================================================================
// Decision 4.3: Applied to collectibles + Daily Spark only
// Applied to: SparkCard3D, CosmeticShop featured items
// GPU cost: ~0.1ms (very low -- fragment only, no vertex mod)
//
// Rainbow diffraction from view angle + tilt.
// Uses HSL-to-RGB conversion for smooth spectral sweep.
// CSS fallback: conic-gradient + mix-blend-mode (in v2 component)
// Does NOT require noise.glsl -- uses inline hash noise
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains this shader as a template
// literal string.

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec2 uTilt;       // Card tilt from mouse/touch (-1 to 1)
uniform float uIntensity;  // 0.0 = subtle, 1.0 = vivid
uniform vec3 uBaseColor;   // Card's base color

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// HSL to RGB conversion
vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(
    abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
    0.0, 1.0
  );
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // View-dependent hue shift (core holographic effect)
  float viewAngle = dot(normal, viewDir);
  float hueBase = viewAngle * 0.5 + 0.5;

  // Tilt influence -- mouse movement shifts the rainbow bands
  float tiltInfluence = uTilt.x * 0.3 + uTilt.y * 0.2;
  float hue = fract(hueBase + tiltInfluence + uTime * 0.05);

  // Spatial variation -- rainbow bands sweep across the card
  float spatialHue = fract(hue + vUv.x * 0.4 + vUv.y * 0.3);

  // Generate rainbow color
  vec3 rainbow = hsl2rgb(spatialHue, 0.8, 0.6);

  // Fresnel-based intensity -- stronger at glancing angles
  float fresnel = pow(1.0 - max(viewAngle, 0.0), 2.5);

  // Holographic strength: subtle at rest, vivid on tilt
  float tiltMagnitude = length(uTilt);
  float holoStrength = mix(0.15, 0.6, tiltMagnitude) * uIntensity;

  // Shimmer sparkle (fast-moving high-frequency noise)
  float sparkle = fract(sin(dot(vUv * 50.0 + uTime * 2.0,
                   vec2(12.9898, 78.233))) * 43758.5453);
  sparkle = smoothstep(0.92, 1.0, sparkle) * 0.3;

  // Combine: base card color + rainbow overlay + sparkle
  vec3 finalColor = mix(uBaseColor, rainbow, holoStrength * fresnel);
  finalColor += rainbow * sparkle * uIntensity;

  // Subtle iridescent edge glow
  finalColor += rainbow * fresnel * 0.15 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## Step 3: Create `src/shaders/energyField.glsl`

Decision 4.5: Full 3D hex dome on desktop, CSS fallback on mobile.

**FIX applied:** Uniform declarations separated from PDF-corrupted single line.

```glsl
// ================================================================
// SparkForge -- Energy Field Shader (Vertex + Fragment)
// ================================================================
// Decision 4.5: Full 3D dome desktop, CSS mobile
// Applied to: Streak shield on Profile page
// GPU cost: ~0.2ms
// Geometry: IcosahedronGeometry (detail=2) -- natural hex facets
// Blending: THREE.AdditiveBlending
//
// VERTEX: Breathing pulse + shatter displacement
// FRAGMENT: Hex grid + Fresnel glow + energy crawl
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: energyFieldVertexShader

uniform float uTime;
uniform float uShieldHP;          // 1.0 = full, 0.0 = broken
uniform float uBreathScale;       // Breathing pulse amplitude
uniform float uShatterProgress;   // 0.0 = intact, 1.0 = fully shattered

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

// Per-face random for shatter direction
float faceRand(vec3 pos) {
  return fract(sin(dot(floor(pos * 10.0),
               vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Breathing pulse (subtle scale oscillation)
  float breath = 1.0 + sin(uTime * 2.0) * uBreathScale * 0.02;

  // Shatter: each face flies outward along its normal
  float fRand = faceRand(position);
  vFaceRandom = fRand;

  vec3 shatterOffset = normal * fRand * uShatterProgress * 2.0;
  // Add rotation during shatter
  float shatterRotate = uShatterProgress * fRand * 6.28;
  shatterOffset.x += sin(shatterRotate) * uShatterProgress * 0.5;
  shatterOffset.y += cos(shatterRotate) * uShatterProgress * 0.3;

  vec3 finalPos = position * breath + shatterOffset;
  vWorldPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}

// ---- FRAGMENT SHADER ----
// Export as: energyFieldFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;             // Shield color (streak tier dependent)
uniform float uShieldHP;         // 1.0 = full, 0.0 = broken
uniform float uShatterProgress;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

// Note: cameraPosition is a Three.js built-in uniform

// Hex grid pattern
float hexGrid(vec2 p) {
  vec2 q = vec2(p.x * 2.0 * 0.5773503, p.y + p.x * 0.5773503);
  vec2 pi = floor(q);
  vec2 pf = fract(q);
  float v = mod(pi.x + pi.y, 3.0);
  float ca = step(1.0, v);
  float cb = step(2.0, v);
  vec2 ma = step(pf.xy, pf.yx);
  float e = dot(ma, 1.0 - pf.yx + ca * (pf.x + pf.y - 1.0)
             + cb * (pf.yx - 2.0 * pf.xy));
  return smoothstep(0.0, 0.08, e);
}

void main() {
  vec3 normal = normalize(vNormal);

  // Hex grid on the dome surface
  vec2 hexUv = vWorldPosition.xy * 3.0 + vWorldPosition.z * 0.5;
  float hex = hexGrid(hexUv);

  // Edge lines (the hex cell borders glow)
  float hexEdge = 1.0 - hex;

  // Energy crawl along hex edges
  float energyCrawl = simplex3D(vec3(hexUv * 2.0, uTime * 1.5))
                      * 0.5 + 0.5;
  float crawlOnEdge = hexEdge * energyCrawl;

  // Fresnel edge glow
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

  // Base dome color (very transparent center, glowing edges)
  vec3 baseColor = uColor * 0.3;
  float baseAlpha = 0.05 + fresnel * 0.4;

  // Add hex edge glow
  vec3 edgeColor = uColor * 1.5 * crawlOnEdge;
  float edgeAlpha = crawlOnEdge * 0.6;

  // Combine
  vec3 finalColor = baseColor + edgeColor;
  float finalAlpha = (baseAlpha + edgeAlpha) * uIntensity;

  // HP-based dimming
  finalAlpha *= uShieldHP;
  finalColor *= mix(0.3, 1.0, uShieldHP);

  // Shatter: fragments fade out as they fly away
  finalAlpha *= 1.0 - uShatterProgress * 0.8;

  // Pulse flash when HP is low
  if (uShieldHP < 0.3 && uShieldHP > 0.0) {
    float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
    finalColor += uColor * pulse * 0.5;
  }

  gl_FragColor = vec4(finalColor, finalAlpha);
}
```

---

## Step 4: Create `src/shaders/fireNoise.glsl`

Diamond streak flame (100+ day streaks). Replaces v2 CSS tier 7 with full 3D procedural flame.

```glsl
// ================================================================
// SparkForge -- Fire Noise Shader (Vertex + Fragment)
// ================================================================
// Applied to: StreakFlame3D.tsx (Diamond tier, 100+ day streak)
// GPU cost: ~0.2ms
// Geometry: PlaneGeometry billboard facing camera
//
// VERTEX: Billboard orientation + subtle wave distortion
// FRAGMENT: FBM noise flame + prismatic Diamond refraction
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: fireNoiseVertexShader

uniform float uTime;
uniform float uFlameHeight;  // 1.0 = normal, 1.5 = excited

varying vec2 vUv;
varying float vFlameY;

void main() {
  vUv = uv;

  // Flame Y position (0 at base, 1 at tip)
  vFlameY = uv.y;

  // Subtle horizontal wave at flame tip
  vec3 pos = position;
  float wave = sin(uTime * 3.0 + position.y * 4.0) * 0.05 * position.y;
  pos.x += wave;

  // Scale height
  pos.y *= uFlameHeight;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

// ---- FRAGMENT SHADER ----
// Export as: fireNoiseFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uIntensity;    // Overall brightness
uniform float uFlameHeight;

varying vec2 vUv;
varying float vFlameY;

// FBM for flame turbulence (4 octaves)
float flameFBM(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    f += amp * simplex3D(vec3(p * freq,
                         uTime * (1.0 + float(i) * 0.3)));
    freq *= 2.0;
    amp *= 0.5;
  }
  return f;
}

// Prismatic color for Diamond tier
vec3 prismaticColor(float t) {
  // Rainbow cycle through spectral colors
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = vUv;

  // Center horizontally, base at bottom
  vec2 flameUV = vec2((uv.x - 0.5) * 2.0, uv.y);

  // Flame shape mask: narrow at top, wide at base
  float width = mix(0.6, 0.1, pow(uv.y, 0.8));
  float flameMask = smoothstep(width, width * 0.5, abs(flameUV.x));

  // FBM noise for turbulence (scrolls upward)
  vec2 noiseUV = vec2(flameUV.x * 3.0,
                      flameUV.y * 2.0 - uTime * 2.5);
  float noise = flameFBM(noiseUV);

  // Distort flame shape with noise
  flameMask *= smoothstep(-0.3, 0.5,
                          noise + (1.0 - uv.y) * 0.8);

  // Core temperature gradient (white hot center -> edges)
  float coreDistance = length(
    vec2(flameUV.x, flameUV.y - 0.3)) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.5, coreDistance);

  // Diamond prismatic coloring
  float prismT = noise * 0.5 + uv.y * 0.3 + uTime * 0.1;
  vec3 prismColor = prismaticColor(prismT);

  // Temperature-based color:
  // white core -> prismatic mid -> blue tips
  vec3 coreColor = vec3(1.0, 0.98, 0.95);  // White-hot
  vec3 midColor = prismColor * 1.2;
  vec3 tipColor = vec3(0.3, 0.5, 1.0);     // Blue tips

  vec3 flameColor = mix(tipColor, midColor,
                        smoothstep(0.6, 0.2, uv.y));
  flameColor = mix(flameColor, coreColor, core * 0.7);

  // Final alpha
  float alpha = flameMask * uIntensity;

  // Fade out at very top
  alpha *= smoothstep(1.0, 0.85, uv.y);

  // Subtle ember particles near tip
  float ember = fract(sin(dot(uv * 100.0 + uTime,
                   vec2(12.9898, 78.233))) * 43758.5453);
  ember = smoothstep(0.97, 1.0, ember) * flameMask
        * (1.0 - uv.y);
  flameColor += vec3(1.0, 0.8, 0.4) * ember * 2.0;

  gl_FragColor = vec4(flameColor, alpha);
}
```

---

## Step 5: APPEND to `src/shaders/index.ts`

Append 8 new shader exports (4 vertex + 4 fragment) to the end of the existing file. Do NOT modify existing aurora, scanline, chrome, or noise exports.

**Important pattern:** Standalone `.glsl` files are reference documentation. The `index.ts` template literal strings are the actual imports used by R3F components. Shaders needing noise functions get `noiseGLSL` prepended via string concatenation.

**New exports added:**
- `liquidMetalVertexShader` / `liquidMetalFragmentShader` — with noiseGLSL prepended
- `holographicVertexShader` / `holographicFragmentShader` — no noise dependency
- `energyFieldVertexShader` / `energyFieldFragmentShader` — with noiseGLSL prepended
- `fireNoiseVertexShader` / `fireNoiseFragmentShader` — with noiseGLSL prepended

See the full appended code in the source file at `src/shaders/index.ts` lines 220-591.

---

## Validation

```
npx tsc --noEmit     -> PASS (0 errors)
npm run lint         -> PASS (0 warnings)
npm run build        -> PASS (all routes compile)
```
