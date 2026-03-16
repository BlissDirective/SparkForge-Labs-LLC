# Implementation Plan — Hero Page Animation v2.0

**Version:** 1.0 | **Date:** March 16, 2026 | **Status:** READY FOR EXECUTION
**Reference:** `docs/00-reference/SparkForge_Hero_Page_Animation_v2.0.md`
**Branch:** `claude/sparkforge-stage1-foundation-LBQEo`

---

## OVERVIEW

This document is the step-by-step execution plan for implementing the 8-phase cinematic hero animation specified in `SparkForge_Hero_Page_Animation_v2.0.md`. It covers **11 new source files** (~1,800 lines), **2 store updates**, **8 stage document updates**, and **1 progress log update**.

### Current State (Pre-Implementation)

| Item | Status |
|------|--------|
| Three.js | v0.183.2 installed (exceeds r171+ requirement) |
| @react-three/fiber | v9.5.0 installed (exceeds v9.0.0 requirement) |
| @react-three/drei | v10.7.7 installed (exceeds v9.120.0 requirement) |
| GSAP | v3.14.2 installed |
| Tone.js | v15.1.22 installed |
| `CrystalShatter.tsx` | Exists — 5-phase, ~7s animation (to be extended/replaced) |
| `HeroAnimation.tsx` | Does NOT exist (to be created) |
| `src/lib/audio/` | Directory does NOT exist (to be created) |
| `webgpuDetection.ts` | Does NOT exist (to be created) |
| `uiStore.ts` | Exists — missing `skipIntroAnimation` field |
| `deviceStore.ts` | Exists — missing `gpuTier` field |
| New packages needed | `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text` |
| Build status | PASSING (0 TypeScript errors) |

### Execution Order & Dependencies

```
Phase A (Store & Infrastructure) ← no dependencies, start here
    ├── A1 (uiStore) — independent
    ├── A2 (deviceStore) — independent
    └── A3 (webgpuDetection) — depends on A2 (uses gpuTier type)

Phase B (Particle System) ← depends on A2, A3
    ├── B1 (heroParticleCompute) — depends on A3 (stripe count)
    └── B2 (heroParticleRender) — depends on B1 (buffer types)

Phase C (Shaders & 3D Utilities) ← independent of B, can parallelize
    ├── C1, C2 (crystallineLogo shaders) — independent
    ├── C3 (electricVeins) — independent
    ├── C4 (voronoiShatter) — independent
    ├── C5 (voronoiFracture.ts) — independent
    └── C6 (heroSplines.ts) — independent

Phase D (Audio) ← independent of B, C, can parallelize
    └── D1 (heroAudio) — independent

Phase E (Hook & Orchestrator) ← depends on A, B, C, D (imports all)
    ├── E1 (useHeroAnimation) — depends on A1, A2
    └── E2 (HeroAnimation.tsx) — depends on ALL prior phases

Phase F (Stage Doc Updates) ← depends on A-E (documents actual code)
    ├── F1-F8 — all independent of each other, can parallelize

Phase G (Commit & Push) ← depends on ALL
    └── G1 → G2 → G3 — sequential
```

### Parallelization Strategy

```
Batch 1 (parallel): A1, A2       — store updates (independent)
Batch 2 (sequential): A3         — webgpuDetection (needs A2 types)
Batch 3 (parallel): B1, C1-C6, D1 — particle compute, shaders, audio
Batch 4 (sequential): B2         — particle render (needs B1)
Batch 5 (parallel): E1, E2       — hook then orchestrator
Batch 6 (parallel): F1-F8        — all stage doc updates
Batch 7 (sequential): G1 → G2 → G3
```

---

## PHASE A: STORE & INFRASTRUCTURE UPDATES

### A1. Update `src/stores/uiStore.ts`

**Purpose:** Add `skipIntroAnimation` per OD-3 (Skip Intro Toggle)
**Decision Reference:** OD-3 — First visit always plays full 19s. Settings toggle available per-child.
**Estimated Changes:** ~8 lines added

**Current State:**
```typescript
// src/stores/uiStore.ts — Lines 4-23
interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  soundEnabled: boolean;
  dailyChallengeCompleted: boolean;
  particleIntensity: 'off' | 'low' | 'medium' | 'high';
  // ... actions ...
}
```

**Changes Required:**

1. Add to `UIState` interface:
```typescript
/** Per-child setting: skip the hero intro animation on page load.
 *  Default: false. Toggled in Settings page (Stage 4 Part 3).
 *  When true, HeroAnimation renders Phase 8 final state immediately. */
skipIntroAnimation: boolean;
setSkipIntroAnimation: (skip: boolean) => void;
```

2. Add to store creation (after `particleIntensity: 'medium'`):
```typescript
skipIntroAnimation: false,
setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
```

**Validation:**
- `npx tsc --noEmit` — no new errors
- Existing store consumers unaffected (additive change)
- Verify `useUIStore` re-exports work

---

### A2. Update `src/stores/deviceStore.ts`

**Purpose:** Add `gpuTier` field per OD-4 (WebGPU Compute Shaders)
**Decision Reference:** OD-4 — Tiered GPU detection cached in localStorage
**Estimated Changes:** ~20 lines added

**Current State:**
```typescript
// src/stores/deviceStore.ts — Lines 95-103
interface DeviceState {
  deviceType: DeviceType | null;
  hasSelected: boolean;
  profile: PerformanceProfile;
  setDeviceType: (type: DeviceType) => void;
  getTriangleBudget: (tier: 'flagship' | 'flLite' | 'standard') => number;
  getParticleCount: (baseCount: number) => number;
  getSphereDetail: (preferredSegments?: number) => number;
}
```

**Changes Required:**

1. Add GPU tier type export (after `LODLevel` type):
```typescript
// ■■ GPU Rendering Tier ■■
// Detected at runtime by webgpuDetection.ts
// Determines particle budget and rendering pipeline for hero animation
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2' | 'css';
```

2. Add to `DeviceState` interface:
```typescript
/** GPU rendering tier detected at runtime by webgpuDetection.ts.
 *  Determines particle budget and rendering pipeline for hero animation.
 *  Cached in localStorage alongside existing device preferences. */
gpuTier: GPUTier;

/** Number of striped particle buffers (1-4) based on GPU VRAM capability.
 *  Each stripe holds 2.5M particles at 48 bytes each. */
stripeCount: number;

setGpuTier: (tier: GPUTier, stripes?: number) => void;
```

3. Add to store creation (after `profile: PERFORMANCE_PROFILES.desktop`):
```typescript
gpuTier: 'webgl2' as GPUTier,  // safe default until detection runs
stripeCount: 0,                 // 0 = no WebGPU stripes (WebGL2/CSS mode)

setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),
```

4. Update `partialize` to persist new fields:
```typescript
partialize: (state) => ({
  deviceType: state.deviceType,
  hasSelected: state.hasSelected,
  gpuTier: state.gpuTier,
  stripeCount: state.stripeCount,
}),
```

5. Add selector helpers (bottom of file):
```typescript
export const selectGpuTier = (s: DeviceState) => s.gpuTier;
export const selectStripeCount = (s: DeviceState) => s.stripeCount;
```

**Validation:**
- `npx tsc --noEmit` — no new errors
- Existing `selectProfile`, `selectDeviceType`, `selectHasSelected` selectors unaffected
- localStorage key remains `sparkforge-device` (additive to existing persisted shape)

---

### A3. Create `src/lib/webgpuDetection.ts`

**Purpose:** Runtime GPU tier detection with `maxStorageBufferBindingSize` probing
**Decision Reference:** OD-4 — Detection runs once at app mount, caches in `deviceStore.gpuTier`
**Estimated Lines:** ~120
**Dependencies:** A2 (`GPUTier` type from deviceStore)

**File Location:** `src/lib/webgpuDetection.ts`

**Implementation Spec:**

```typescript
// src/lib/webgpuDetection.ts
//
// Detects GPU rendering tier at runtime:
//   1. Probe WebGPU availability via navigator.gpu
//   2. If available, request adapter + device
//   3. Probe maxStorageBufferBindingSize for stripe count
//   4. If no WebGPU, check WebGL2 context
//   5. Fallback to CSS tier
//
// Returns: { tier: GPUTier, stripeCount: number }
// Called once at app mount, result cached in deviceStore
```

**Key Logic:**
- `navigator.gpu` check → adapter request → device request
- `maxStorageBufferBindingSize >= 256MB` → `webgpu-high` (4 stripes)
- `maxStorageBufferBindingSize >= 128MB` → `webgpu-mid` (2 stripes)
- `WebGPU available but low limits` → `webgpu-low` (1 stripe)
- `WebGL2 context available` → `webgl2` (0 stripes)
- `Nothing available` → `css` (0 stripes)

**Particle Budget by Tier (from spec Section 3.2):**

| Tier | Peak Simultaneous | Lifetime Throughput | Stripe Count |
|------|-------------------|--------------------:|:------------:|
| `webgpu-high` | 10,000,000 | 1,000,000,000+ | 4 |
| `webgpu-mid` | 5,000,000 | 500,000,000+ | 2 |
| `webgpu-low` | 2,000,000 | 200,000,000+ | 1 |
| `webgl2` | 500,000 | 50,000,000 | 0 |
| `css` | 15 | 15 | 0 |

**Exports:**
```typescript
export interface GPUDetectionResult {
  tier: GPUTier;
  stripeCount: number;
  maxBufferSize: number;       // bytes, 0 if not WebGPU
  maxComputeWorkgroups: number; // 0 if not WebGPU
}

export async function detectGPUTier(): Promise<GPUDetectionResult>;
```

**Integration Point:**
- Called from root layout or `HeroAnimation` on first mount
- Result stored via `useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount)`
- Subsequent visits read from localStorage (no re-detection unless device change)

**Validation:**
- TypeScript compiles cleanly
- Function is `async` (WebGPU API is promise-based)
- Handles all edge cases: no `navigator.gpu`, adapter rejection, device creation failure
- Does NOT throw — always returns a valid result (worst case: `css`)

---

## PHASE B: CORE PARTICLE SYSTEM (TSL/WebGPU)

### B1. Create `src/lib/3d/heroParticleCompute.ts`

**Purpose:** TSL compute kernel for particle simulation — 1B+ lifetime throughput
**Decision Reference:** OD-4 — Multi-buffer striped architecture with TSL
**Estimated Lines:** ~300
**Dependencies:** A2 (stripe count), A3 (GPU tier)

**File Location:** `src/lib/3d/heroParticleCompute.ts`

**Implementation Spec:**

```typescript
// TSL (Three Shader Language) compute kernel for hero particle simulation.
// Compiles to WGSL (WebGPU) or GLSL (WebGL2) automatically.
//
// Architecture:
//   - Multi-buffer striped storage (1-4 stripes × 2.5M particles × 48 bytes)
//   - Ping-pong double buffering per stripe
//   - Phase-dependent physics (8 behaviors)
//   - Atomic free-list for lock-free particle recycling
//   - Frustum culling flags (skip in render pass)
```

**Key Exports:**
```typescript
export const PARTICLES_PER_STRIPE = 2_500_000;

export function createParticleStripe(): ParticleStripeBuffers;

export const simulateParticles: TSLComputeKernel;  // Fn() from three/tsl

export interface ParticleUniforms {
  phase: number;           // Current animation phase (0-7)
  gravity: THREE.Vector3;
  convergencePoint: THREE.Vector3;
  shatterOrigin: THREE.Vector3;
  drag: number;
  turbulence: number;
  deltaTime: number;
}

export function createParticleSystem(
  stripeCount: number,
  tier: GPUTier
): HeroParticleSystem;
```

**Phase Behaviors (in compute kernel):**

| Phase | Uniform `phase` | Particle Behavior |
|-------|:---:|---|
| 0 (Void) | 0 | Brownian drift — Perlin velocity perturbation, amplitude 0.005 |
| 1 (Assembly) | 1 | Converge to logo vertices — lerp toward KD-tree nearest target |
| 2 (Showcase) | 2 | Orbit logo edges — tangential velocity along edge curves |
| 3 (Surge) | 3 | Energy vibration — increasing amplitude displacement |
| 4 (Shatter) | 4 | Explosive outward — radial velocity 5-15 units/s + tangential |
| 5 (Regroup) | 5 | Spline paths to cockpit — interpolate along CubicBezierCurve3 |
| 6 (Materialize) | 6 | Settle into cockpit geometry — damped spring to final positions |
| 7 (Online) | 7 | Transition to ambient — hand off remaining particles |

**Memory Management:**
- `initialize(stripeCount)` — allocate all GPU buffers at animation start
- `update(phase, deltaTime)` — per-frame compute dispatch + buffer swap
- `handoff(ambientSystem)` — Phase 8 particle transfer to `AmbientParticles`
- `dispose()` — release all GPU resources after handoff

**Validation:**
- TSL imports from `three/tsl` compile without error
- `instancedArray()` creates valid GPU-persistent buffers
- Compute kernel dispatches correctly: `ceil(2.5M / 256)` workgroups per stripe
- No runtime errors on WebGL2 fallback (TSL auto-compiles to GLSL)

---

### B2. Create `src/lib/3d/heroParticleRender.ts`

**Purpose:** TSL render material for instanced particle billboard quads
**Decision Reference:** Spec Section 3.2 — Render Pipeline
**Estimated Lines:** ~150
**Dependencies:** B1 (particle buffer types)

**File Location:** `src/lib/3d/heroParticleRender.ts`

**Implementation Spec:**

```typescript
// TSL render material for hero particles.
// Renders particles as instanced billboard quads with:
//   - SDF soft-circle shape
//   - Glow halo (additive)
//   - Trail fade (alpha decay over 4 frames)
//   - Frustum culling (skip particles flagged by compute pass)
//   - Additive blending (src: ONE, dst: ONE)
//
// Uses SpriteNodeMaterial with custom TSL fragment nodes.
```

**Key Exports:**
```typescript
export function createParticleRenderMaterial(
  tier: GPUTier
): THREE.SpriteNodeMaterial;

export function createTrailGeometry(
  maxTrailSegments: number
): THREE.BufferGeometry;
```

**Rendering Details:**
- Vertex shader: billboard orientation (camera-facing) + size scaling from particle `size` attribute
- Fragment shader: `smoothstep` SDF circle (radius 0.45, soft edge 0.05) + glow halo (radius 0.8, alpha 0.15)
- Blending: `THREE.AdditiveBlending` (src: ONE, dst: ONE)
- Depth: `depthWrite: false`, `depthTest: true`
- Trail: store last 4 positions per particle, render as quad strip with linearly decaying alpha

**Validation:**
- `SpriteNodeMaterial` usage compiles with R3F v9 + Three.js r183
- Billboard orientation works in both WebGPU and WebGL2 renderers
- Additive blending produces correct visual output

---

## PHASE C: SHADERS & 3D UTILITIES

### C1. Create `src/shaders/crystallineLogo.vert`

**Purpose:** Vertex shader for extruded 3D "SparkForge" text geometry
**Estimated Lines:** ~40
**Dependencies:** None

**File Location:** `src/shaders/crystallineLogo.vert`

**Implementation Spec:**
- Displacement mapping for crystalline faceting of extruded text
- UV generation for fragment shader consumption
- Normal perturbation for faceted bevel edges
- `uniform float uTime` for animated subtle vertex displacement (breathing)
- Output: `varying vec2 vUv`, `varying vec3 vNormal`, `varying vec3 vPosition`

**Note on TSL Migration:** This GLSL shader is used as reference for the crystalline material. In WebGPU mode, the equivalent logic is authored via TSL `MeshPhysicalNodeMaterial` customization. The GLSL file serves as the WebGL2 fallback path and documentation.

---

### C2. Create `src/shaders/crystallineLogo.frag`

**Purpose:** Fragment shader with subsurface scattering, IOR refraction, clearcoat specular
**Estimated Lines:** ~120
**Dependencies:** C1 (varyings)

**File Location:** `src/shaders/crystallineLogo.frag`

**Implementation Spec:**
- Subsurface scattering approximation (Burley diffuse + wrap lighting)
- IOR-based refraction (`ior: 1.5`, transmission: 0.9)
- Clearcoat specular (clearcoat: 1.0, roughness: 0.05)
- Environment map sampling from `frost-prismatic.hdr`
- `uniform float uEmissiveIntensity` — ramps 0.0 → 0.5 (Phase 3) → 3.0 (Phase 4)
- Emissive color: `#00BBFF` (Frost-Prismatic blue)
- `flatShading: true` for faceted crystalline look on bevel edges

**Material Properties (from spec Section 4, Phase 2):**
```
transmission: 0.9, thickness: 0.5, ior: 1.5,
clearcoat: 1.0, clearcoatRoughness: 0.05,
roughness: 0.05, metalness: 0.1,
envMapIntensity: 1.2, emissive: #00BBFF
```

---

### C3. Create `src/shaders/electricVeins.frag`

**Purpose:** Animated energy vein propagation shader for Phase 4 (Electricity Surge)
**Estimated Lines:** ~100
**Dependencies:** None

**File Location:** `src/shaders/electricVeins.frag`

**Implementation Spec:**
- L-system fractal branching in UV space with Perlin noise offset
- `uniform float uTime` — animated branch propagation
- `uniform float uIntensity` — ramps 0 → 1 over Phase 4 duration (2.5s)
- 6 octaves of branching with progressive detail
- Color: electric blue `#00FFFF`
- Output: emissive contribution to crystalline material

**Core Algorithm (from spec Section 4, Phase 4):**
```glsl
for (int i = 0; i < 6; i++) {
    vec2 uv_offset = vUv + perlinNoise2D(vUv * float(i+1) + uTime * 0.5) * 0.1;
    float branch = smoothstep(0.48, 0.50,
        abs(fract(uv_offset.x * pow(2.0, float(i))) - 0.5));
    branch *= smoothstep(0.48, 0.50,
        abs(fract(uv_offset.y * pow(2.0, float(i))) - 0.5));
    vein += branch * (1.0 / float(i + 1));
}
```

---

### C4. Create `src/shaders/voronoiShatter.comp`

**Purpose:** Compute shader for Voronoi fracture cell generation (Phase 5 pre-computation)
**Estimated Lines:** ~150
**Dependencies:** None

**File Location:** `src/shaders/voronoiShatter.comp`

**Implementation Spec:**
- GPU-accelerated Voronoi cell boundary computation
- Input: seed point array + mesh bounding box
- Output: cell assignments per vertex (which shard each vertex belongs to)
- Workgroup size: 256 threads
- Used during Phase 5 initialization (pre-computed, not per-frame)

**Shard Counts by Tier (from spec Section 4, Phase 5):**

| Tier | Shard Count |
|------|:----------:|
| webgpu-high | 100,000 |
| webgpu-mid | 50,000 |
| webgl2 (desktop) | 10,000 |
| webgl2 (tablet) | 2,000 |
| webgl2 (mobile) | 500 |
| css | 8 |

**Note:** This compute shader is the GPU-accelerated path. The CPU fallback is in `voronoiFracture.ts` (C5).

---

### C5. Create `src/lib/3d/voronoiFracture.ts`

**Purpose:** CPU-side Voronoi tessellation for shatter geometry (Bowyer-Watson algorithm)
**Estimated Lines:** ~200
**Dependencies:** None (uses Three.js `BufferGeometry`)

**File Location:** `src/lib/3d/voronoiFracture.ts`

**Implementation Spec:**

```typescript
// CPU-side Voronoi tessellation for Phase 5 shatter geometry.
// Used as fallback when GPU compute is unavailable (WebGL2/CSS tiers).
// Also used for pre-computing shard target assignments.
//
// Algorithm: Bowyer-Watson incremental Delaunay → dual Voronoi
// Input: TextGeometry mesh + shard count + seed
// Output: Array of BufferGeometry (one per shard)
// Cached at HeroAnimation mount — computed once, never per-frame.
```

**Key Exports:**
```typescript
export function generateVoronoiShards(
  inputGeometry: THREE.BufferGeometry,
  shardCount: number,
  seed: number
): THREE.BufferGeometry[];

export function assignShardsToTargets(
  shards: THREE.BufferGeometry[],
  cockpitTargets: CockpitTargetGroup[]
): ShardAssignment[];

export interface ShardAssignment {
  shardIndex: number;
  targetGroup: 'panel' | 'sidePanel' | 'hud' | 'statusBar' | 'ledRim' | 'ambient';
  targetPosition: THREE.Vector3;
  initialVelocity: THREE.Vector3;
  rotationAxis: THREE.Vector3;
  angularVelocity: number;
}
```

**Performance:**
- Pre-computed at mount time (not per-frame)
- Result cached in `useRef` — never recomputed during animation
- For 100K shards (high-end), computation takes ~200ms (acceptable during Phase 1 idle)

---

### C6. Create `src/lib/3d/heroSplines.ts`

**Purpose:** Spline path definitions for Phase 6 shard migration to cockpit positions
**Estimated Lines:** ~150
**Dependencies:** None (uses Three.js `CubicBezierCurve3`)

**File Location:** `src/lib/3d/heroSplines.ts`

**Implementation Spec:**

```typescript
// Spline path definitions for Phase 6 shard migration.
// Each shard follows a unique CubicBezierCurve3 from its
// post-explosion position to its cockpit target position.
//
// Paths are NOT linear — they follow spiral and arc trajectories
// with per-shard randomized control points for organic motion.
```

**Key Exports:**
```typescript
export function generateShardSpline(
  startPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  seed: number
): THREE.CubicBezierCurve3;

export function generateBatchSplines(
  assignments: ShardAssignment[],
  currentPositions: THREE.Vector3[]
): THREE.CubicBezierCurve3[];

export function seededRandom(seed: number): () => number;
```

**Spline Properties (from spec Section 4, Phase 6):**
- Control point 1: `startPos + random * 4.0` (wide arc away from center)
- Control point 2: `targetPos + random * 2.0` (converging approach)
- Path duration per shard: 1.5s – 2.5s (staggered start within 0.5s window)
- Easing: `power2.inOut` (slow departure, fast middle, slow arrival)
- All arrivals complete by `t=14.0s`

---

## PHASE D: AUDIO SYSTEM

### D1. Create `src/lib/audio/heroAudio.ts`

**Purpose:** Tone.js audio timeline definition for all 8 animation phases
**Decision Reference:** OD-1 — Sound ON by default, respects per-child `soundEnabled`
**Estimated Lines:** ~200
**Dependencies:** None (uses Tone.js, already installed)

**File Location:** `src/lib/audio/heroAudio.ts`

**Directory Creation:** `src/lib/audio/` does not exist — create it first.

**Implementation Spec:**

```typescript
// Tone.js audio timeline for the hero animation.
// Synchronized to GSAP master timeline progress via Tone.Transport.
//
// Audio Graph:
//   Master Volume → Limiter → Destination
//   ├─ Sub-bass (Phase 1-2)
//   ├─ Whoosh/Impact (Phase 2, 5)
//   ├─ Crystalline hum (Phase 3)
//   ├─ Electric crackle (Phase 4)
//   ├─ Shatter transient (Phase 5)
//   ├─ Migration drone (Phase 6)
//   ├─ Boot sequence (Phase 7)
//   └─ Cockpit ambient (Phase 8 — persists)
//
// OD-1: Audio plays by default. Muted if soundEnabled === false.
// OD-2: Fast-forward at 4x includes pitch compensation.
// Audio context created on first user interaction (browser autoplay policy).
```

**Key Exports:**
```typescript
export class HeroAudioTimeline {
  constructor(soundEnabled: boolean);

  /** Schedule all audio cues. Must be called after user interaction. */
  initialize(): Promise<void>;

  /** Sync Tone.Transport position with GSAP timeline progress */
  syncToProgress(progress: number): void;

  /** Apply fast-forward pitch compensation (OD-2) */
  setTimeScale(scale: number): void;

  /** Mute all nodes without stopping timeline */
  mute(): void;
  unmute(): void;

  /** Clean up all Tone.js nodes */
  dispose(): void;
}
```

**Phase Audio Cues (from spec Sections 4.1–4.8):**

| Phase | Audio Elements | Timing |
|-------|---------------|--------|
| 1 Void | Brown noise rumble (80→200Hz LP), sub-bass sine 40Hz, reverb (decay 4s) | 0.0–2.0s |
| 2 Assembly | White noise whoosh (200→2kHz BP), impact hit (MembraneSynth), MetalSynth clang, grain chimes | 2.0–4.5s |
| 3 Showcase | PolySynth crystalline hum (C4-E4-G4-B4, -16dB), pink noise panner following camera | 4.5–7.5s |
| 4 Surge | White NoiseSynth crackle (BP 2.5kHz), sawtooth tension sweep (100→800Hz), brown noise thunder | 7.5–10.0s |
| 5 Shatter | MembraneSynth sub drop (40Hz, octaves 6), glass-shatter sample, reverb (decay 3s), grain debris, feedback delay echo | 10.0–11.5s |
| 6 Regroup | MetalSynth decel (4kHz→200Hz), pink noise migration drone (HRTF panner, -24dB), cockpit hum starts (sine 55Hz, -20dB→-12dB) | 11.5–14.0s |
| 7 Materialize | Sequential boot sounds per cockpit component (6 unique synth hits, 400ms stagger), cockpit hum full volume (-6dB) | 14.0–17.0s |
| 8 Online | FM sweep power-up (C3→C5, 0.5s), crossfade to persistent cockpit ambient | 17.0–19.0s |

**Audio Assets Required:**
- `/public/audio/glass-chime.mp3` — Phase 2 grain player source
- `/public/audio/glass-shatter.mp3` — Phase 5 shatter transient
- `/public/audio/glass-fragments.mp3` — Phase 5 debris granular

**Note:** Audio assets should be created or sourced as royalty-free SFX. If assets are unavailable, the system gracefully degrades to synthesized-only audio (all synth nodes still function without sample files).

---

## PHASE E: HOOK & MASTER ORCHESTRATOR

### E1. Create `src/hooks/useHeroAnimation.ts`

**Purpose:** React hook managing animation lifecycle, skip logic, fast-forward, phase callbacks
**Decision References:** OD-2 (fast-forward), OD-3 (skip toggle)
**Estimated Lines:** ~100
**Dependencies:** A1 (skipIntroAnimation), A2 (gpuTier), A3 (detectGPUTier)

**File Location:** `src/hooks/useHeroAnimation.ts`

**Implementation Spec:**

```typescript
// React hook managing the hero animation lifecycle.
//
// Responsibilities:
//   1. Read skipIntroAnimation from uiStore (OD-3)
//   2. Read/detect gpuTier from deviceStore (OD-4)
//   3. Detect prefers-reduced-motion media query
//   4. Manage GSAP timeline timeScale for fast-forward (OD-2)
//   5. Track current phase (0-7) and progress (0.0-1.0)
//   6. Provide onPhaseChange callbacks
//   7. Provide onComplete callback for cockpit handoff
//   8. Handle isFirstVisit flag (full animation on first visit)
```

**Key Exports:**
```typescript
export interface HeroAnimationState {
  shouldSkip: boolean;          // true if skip enabled + not first visit + not reduced motion
  gpuTier: GPUTier;
  stripeCount: number;
  currentPhase: number;         // 0-7
  progress: number;             // 0.0-1.0
  isComplete: boolean;
  isFastForwarding: boolean;
  timeScale: number;            // 1.0 normal, 4.0 fast-forward
}

export interface HeroAnimationActions {
  fastForward: () => void;      // Trigger 4x timeScale (OD-2)
  skipToEnd: () => void;        // Instant jump to Phase 8 final state
  setPhase: (phase: number) => void;
  setProgress: (progress: number) => void;
  setComplete: () => void;
}

export function useHeroAnimation(
  onComplete?: () => void,
  onPhaseChange?: (phase: number) => void
): [HeroAnimationState, HeroAnimationActions];
```

**Skip Logic Decision Tree:**
```
Is prefers-reduced-motion: reduce?
  → YES: shouldSkip = true (accessibility override)
  → NO: Is skipIntroAnimation true in uiStore?
    → YES: Is this the first visit ever?
      → YES: shouldSkip = false (first visit always plays)
      → NO: shouldSkip = true
    → NO: shouldSkip = false
```

**First Visit Detection:**
- Check `localStorage.getItem('sparkforge-hero-seen')`
- On animation complete, set `localStorage.setItem('sparkforge-hero-seen', 'true')`

---

### E2. Create `src/components/3d/HeroAnimation.tsx`

**Purpose:** Master 8-phase GSAP timeline orchestrator — the central component
**Decision References:** All (OD-1 through OD-4)
**Estimated Lines:** ~400
**Dependencies:** ALL prior phases (A, B, C, D, E1)

**File Location:** `src/components/3d/HeroAnimation.tsx`

**This is the most complex component. It replaces the standalone `CrystalShatter.tsx` usage on the landing page.**

**Implementation Spec:**

```typescript
// ================================================================
// HeroAnimation — 8-Phase Cinematic Hero Sequence
// ================================================================
// Replaces standalone CrystalShatter.tsx usage on landing page.
// Orchestrates: GSAP timeline, particle system, camera, audio, handoff.
//
// Architecture:
//   - Renders inside CockpitCanvas (R3F) — same canvas persists post-animation
//   - GSAP master timeline with 8 labeled sections for scrub/skip
//   - WebGPU TSL particle system (1B+ lifetime via multi-stripe)
//   - Tone.js spatial audio synchronized to timeline progress
//   - Seamless handoff: animation's final frame IS the app's first frame
//
// Lifecycle:
//   1. Mount → detect GPU tier, allocate buffers, compile shaders
//   2. Phase 1-7 → GSAP timeline drives animation
//   3. Phase 8 → onComplete callback, dispose hero resources
//   4. Cockpit components continue their normal reactive behavior
```

**Component Props:**
```typescript
interface HeroAnimationProps {
  onComplete: () => void;           // Cockpit handoff — dashboard renders on top
  onPhaseChange?: (phase: number) => void;  // Optional phase tracking
}
```

**Key Internal Structure:**
```
<HeroAnimation>
  ├── useHeroAnimation()            — lifecycle hook (E1)
  ├── HeroParticleSystem            — B1 + B2 integration
  ├── LogoGeometry                  — TextGeometry "SparkForge" (Exo 2 Bold)
  │   ├── crystallineMaterial       — C1 + C2 shaders
  │   └── electricVeinsMaterial     — C3 shader (Phase 4 overlay)
  ├── ShardSystem                   — C4 + C5 Voronoi fracture
  ├── SplinePaths                   — C6 shard migration curves
  ├── CameraController              — GSAP-driven camera orbit, shake, pullback
  ├── PostProcessing                — Bloom, ChromaticAberration, MotionBlur
  ├── SkipButton                    — "Skip Intro" pill (bottom-right, glassmorphic)
  ├── ScreenReaderAnnouncements     — aria-live regions (loading → ready)
  └── HeroAudioTimeline             — D1 audio integration
```

**GSAP Timeline Labels (from spec Appendix A):**
```typescript
timeline
  .addLabel("void", 0)       // Phase 1: 0.0 – 2.0s
  .addLabel("assembly", 2)    // Phase 2: 2.0 – 4.5s
  .addLabel("showcase", 4.5)  // Phase 3: 4.5 – 7.5s
  .addLabel("surge", 7.5)     // Phase 4: 7.5 – 10.0s
  .addLabel("shatter", 10)    // Phase 5: 10.0 – 11.5s
  .addLabel("regroup", 11.5)  // Phase 6: 11.5 – 14.0s
  .addLabel("materialize", 14) // Phase 7: 14.0 – 17.0s
  .addLabel("online", 17);    // Phase 8: 17.0 – 19.0s
```

**Skip Button Spec (OD-2):**
- Renders as `"Skip >"` label, bottom-right corner
- Glassmorphic pill: `backdrop-blur-md bg-white/5 border border-white/10`
- Font: Sora (`font-body`), 14px, opacity 0.4 (hover: 0.8)
- Appears after 2s of animation
- Visible on keyboard focus or mouse hover in bottom-right quadrant
- Click/tap → `handleSkip()` → `timeline.timeScale(4)` (OD-2)
- Escape key → `handleFullSkip()` → instant Phase 8 final state

**Screen Reader Announcements (spec Section 13.2):**
```html
<!-- During animation -->
<div role="status" aria-live="polite" className="sr-only">
  SparkForge is loading your command station...
</div>
<!-- On Phase 8 complete -->
<div role="status" aria-live="assertive" className="sr-only">
  Command station ready. Welcome to SparkForge!
</div>
```

**Camera Sequence (from spec Phase camera tables):**

| Phase | Position | FOV | Special |
|-------|----------|-----|---------|
| 1 Void | `[0, 0, 1.5]` → `[0, 0, 2.5]` | 35° | Micro-drift (Perlin x,y, amp 0.01) |
| 2 Assembly | → `[0, 0, 5.0]` | 35° → 50° | Text scale overshoot at t=4.3s |
| 3 Showcase | Circular orbit r=3.0 | 50° | Full 360° over 3.0s |
| 4 Surge | Base `[0, 0, 5.0]` | 50° ± 0.5° | Shake ramp 0→0.03, FOV pulse 4Hz |
| 5 Shatter | Static + shake | 50° → 55° → 53° | Shake spike 0.08, exp decay |
| 6 Regroup | → `[0, 0, 5.0]` | 53° → 56° | Spring (stiff 300, damp 25) |
| 7 Materialize | → `[0, 6.5, 7]` | 56° → 58° | Breathe motion begins (±0.05, 0.15Hz) |
| 8 Online | Locked `[0, 6.5, 7]` | 58° | CinematicCamera takes over |

**Dynamic Import Pattern (SSR safety):**
```typescript
// In landing page / dashboard layout:
const HeroAnimation = dynamic(
  () => import('@/components/3d/HeroAnimation'),
  { ssr: false }
);
```

**Validation:**
- `npm run build` passes (SSR-safe via dynamic import)
- `npx tsc --noEmit` — no type errors
- Animation plays full 19s sequence on first visit
- Fast-forward (click/Enter/Space) accelerates to 4x
- Escape key skips instantly to Phase 8 final state
- `prefers-reduced-motion` skips to Phase 8 immediately
- Dashboard content fades in over live cockpit on complete

---

## PHASE F: UPDATE STAGE DOCUMENTS (8 docs)

### F1. Update `STAGE1_Foundation_v2_PART1.md`

**File:** `docs/stage1-foundation/STAGE1_Foundation_v2_PART1.md`
**Changes:**

1. **Step 2 (npm installs)** — Add new packages:
```bash
npm install three-bvh-csg three-mesh-bvh troika-three-text
```
Note: Three.js (v0.183.2), R3F (v9.5.0), and drei (v10.7.7) already exceed the spec's minimum requirements. No version upgrade needed in the install commands.

2. **Step 3 (directory structure)** — Add new directory entries:
```
src/lib/audio/              ← NEW (hero animation audio timeline)
```
And add new shader file entries under `src/shaders/`:
```
src/shaders/crystallineLogo.vert    ← NEW
src/shaders/crystallineLogo.frag    ← NEW
src/shaders/electricVeins.frag      ← NEW
src/shaders/voronoiShatter.comp     ← NEW
```

**Log in PROGRESS.md:**
> F1: STAGE1_Foundation_v2_PART1.md — Added `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text` to Step 2 install commands. Added `src/lib/audio/` directory and 4 new shader file entries to Step 3. Three.js/R3F/drei versions already exceed spec requirements (r183/v9.5/v10.7) — no upgrade needed.

---

### F2. Update `STAGE1_Foundation_v2_PART2.md`

**File:** `docs/stage1-foundation/STAGE1_Foundation_v2_PART2.md`
**Changes:**

1. **webgpuDetection.ts** — Add new file entry referencing `src/lib/webgpuDetection.ts` with GPU tier detection logic (A3). Add section documenting the `detectGPUTier()` function, its return type `GPUDetectionResult`, and integration with `deviceStore.setGpuTier()`.

2. **deviceStore.ts** — Update the deviceStore code section to include:
   - `GPUTier` type export
   - `gpuTier` and `stripeCount` fields in `DeviceState` interface
   - `setGpuTier` action
   - Updated `partialize` to persist `gpuTier` and `stripeCount`
   - New selector helpers `selectGpuTier`, `selectStripeCount`

3. **uiStore.ts** — Update the uiStore code section to include:
   - `skipIntroAnimation: boolean` field in `UIState` interface
   - `setSkipIntroAnimation` action
   - Default value `false` in store creation

**Log in PROGRESS.md:**
> F2: STAGE1_Foundation_v2_PART2.md — Added webgpuDetection.ts file entry with GPU tier detection (OD-4). Updated deviceStore.ts section with GPUTier type, gpuTier/stripeCount fields, setGpuTier action. Updated uiStore.ts section with skipIntroAnimation field (OD-3).

---

### F3. Update `STAGE3_Auth_Layout_Shell_v3_PART3A`

**File:** `docs/stage3-auth-layout/STAGE3_Auth_Layout_Shell_v3_PART3A_20260314.md`
**Changes:**

1. **CrystalShatter.tsx section** — Add a note that `CrystalShatter.tsx` is now **extended** by `HeroAnimation.tsx`. The original `CrystalShatter.tsx` remains as the base implementation (5-phase, 7s). `HeroAnimation.tsx` wraps and replaces its landing page usage with the full 8-phase, 19s sequence.

2. **New File Registry** — Add entries for all 11 new hero animation files:
   - `src/components/3d/HeroAnimation.tsx` — Master 8-phase orchestrator
   - `src/lib/3d/heroParticleCompute.ts` — TSL compute kernel
   - `src/lib/3d/heroParticleRender.ts` — TSL render material
   - `src/shaders/crystallineLogo.vert` — Vertex shader
   - `src/shaders/crystallineLogo.frag` — Fragment shader
   - `src/shaders/electricVeins.frag` — Electric veins shader
   - `src/shaders/voronoiShatter.comp` — Voronoi compute shader
   - `src/lib/3d/voronoiFracture.ts` — CPU Voronoi tessellation
   - `src/lib/3d/heroSplines.ts` — Spline path definitions
   - `src/lib/audio/heroAudio.ts` — Tone.js audio timeline
   - `src/hooks/useHeroAnimation.ts` — Animation lifecycle hook

3. **Decision Cross-References** — Add references to OD-1 through OD-4 (audio default, fast-forward, skip toggle, WebGPU compute).

**Log in PROGRESS.md:**
> F3: STAGE3_Auth_Layout_Shell_v3_PART3A — Added HeroAnimation.tsx as extension of CrystalShatter. Added file registry for 11 new hero animation files. Added OD-1 through OD-4 cross-references.

---

### F4. Update `STAGE3_Auth_Layout_Shell_v3_PART3B`

**File:** `docs/stage3-auth-layout/STAGE3_Auth_Layout_Shell_v3_PART3B_20260314.md`
**Changes:**

1. **Landing page integration** — Update the section describing the landing page to note that `<HeroAnimation>` is now used instead of `<CrystalShatter>` directly for the hero entry sequence. The landing page (`src/app/(marketing)/page.tsx`) continues to delegate to `ScrollJourney.tsx`, which internally uses `HeroAnimation` for the cinematic intro instead of the standalone `CrystalHero` R3F component.

2. **Note on CrystalShatter preservation** — `CrystalShatter.tsx` is NOT deleted. It remains available for the dashboard entry sequence (Decision 1.2). The landing page path now uses the extended `HeroAnimation.tsx` orchestrator.

**Log in PROGRESS.md:**
> F4: STAGE3_Auth_Layout_Shell_v3_PART3B — Updated landing page section to reference HeroAnimation instead of CrystalShatter for hero entry. CrystalShatter preserved for dashboard entry (Decision 1.2).

---

### F5. Update `STAGE4_Core_Pages_v2_PART3.md`

**File:** `docs/stage4-core-pages/STAGE4_Core_Pages_v2_PART3.md`
**Changes:**

1. **Settings page** — Add "Skip Intro Animation" toggle under "Visual Preferences" section:
```tsx
{/* OD-3: Skip Intro Animation toggle */}
<div className="flex items-center justify-between">
  <div>
    <p className="font-body text-sm text-white/90">Skip Intro Animation</p>
    <p className="font-body text-xs text-white/50">
      Skip the hero animation on future visits
    </p>
  </div>
  <Switch
    checked={skipIntroAnimation}
    onCheckedChange={(checked) => setSkipIntroAnimation(checked)}
  />
</div>
```

2. **Import update** — Add `skipIntroAnimation` and `setSkipIntroAnimation` to the uiStore destructure in the Settings component.

**Log in PROGRESS.md:**
> F5: STAGE4_Core_Pages_v2_PART3.md — Added "Skip Intro Animation" toggle to Settings page under "Visual Preferences" (OD-3). Uses uiStore skipIntroAnimation field with Radix Switch component.

---

### F6. Update `STAGE5_Parts23C_v3FINAL.md`

**File:** `docs/stage5-gamification/STAGE5_Parts23C_v3FINAL.md`
**Changes:**

1. **GameParticles3D section** — Add a note documenting the shared TSL compute particle API:
   - `GameParticles3D.tsx` (R3F particles for 5 flagships) can optionally adopt the same TSL compute pipeline from `heroParticleCompute.ts` for consistent particle behavior across the platform
   - The `createParticleSystem()` API from B1 is designed to be reusable beyond the hero animation
   - For now, `GameParticles3D` continues to use its existing instanced approach; TSL migration is a future enhancement

**Log in PROGRESS.md:**
> F6: STAGE5_Parts23C_v3FINAL.md — Added note about shared TSL compute particle API from heroParticleCompute.ts. GameParticles3D can optionally adopt the same pipeline for consistency. Current instanced approach preserved.

---

### F7. Update `KNOWN_COMPAT_NOTES.md`

**File:** `docs/00-reference/KNOWN_COMPAT_NOTES.md`
**Changes:**

Add a new section: **"Hero Animation v2.0 — TSL & WebGPU Notes"**

```markdown
### Hero Animation v2.0 — TSL & WebGPU Notes (March 2026)

**Three.js r171+ / TSL Migration:**
- Three.js r171+ introduces `import * as THREE from 'three/webgpu'` for zero-config WebGPU
- TSL (Three Shader Language) imports from `'three/tsl'` — replaces raw WGSL/GLSL shader authoring
- `ShaderMaterial`, `RawShaderMaterial`, and `onBeforeCompile()` are NOT supported in `WebGPURenderer`
- All custom materials must use TSL node materials (e.g., `MeshStandardNodeMaterial`)
- Standard materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`) work unchanged in WebGPU

**R3F v9 Async GL Prop:**
- R3F v9's `Canvas` accepts an async `gl` prop (required for `WebGPURenderer.init()`)
- Usage: `gl={async (canvas) => { const r = new WebGPURenderer({canvas}); await r.init(); return r; }}`
- R3F v9 also requires `extend(THREE)` to register WebGPU elements

**WebGPU Browser Coverage (March 2026):**
- Chrome 113+, Edge 113+, Safari 26+: ~90% stable coverage
- Firefox: Behind flag (Nightly), ~5% — auto-falls back to WebGL2 via TSL
- Legacy: ~5% — CSS fallback (12-15 DOM particles)

**New Packages (Hero Animation):**
- `three-bvh-csg` — Voronoi fracture mesh operations
- `three-mesh-bvh` — BVH acceleration for shard collision
- `troika-three-text` — High-quality SDF-based 3D text geometry
```

**Log in PROGRESS.md:**
> F7: KNOWN_COMPAT_NOTES.md — Added "Hero Animation v2.0 — TSL & WebGPU Notes" section covering TSL migration, R3F v9 async gl prop, WebGPU browser coverage, ShaderMaterial deprecation warning, new packages.

---

### F8. Update `3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`

**File:** `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`
**Changes:**

1. **CockpitCanvas section** — Add a note about R3F v9 async `gl` prop for WebGPU renderer initialization:
```markdown
**R3F v9 WebGPU Integration (per Hero Animation v2.0):**
The CockpitCanvas uses R3F v9's async `gl` prop to initialize `WebGPURenderer`:
```typescript
const createWebGPURenderer = async (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  await renderer.init();
  return renderer;
};

<Canvas gl={createWebGPURenderer} />
```
WebGPURenderer auto-falls back to WebGL2 if WebGPU is unavailable.
TSL shaders auto-compile to GLSL in WebGL2 mode.
```

2. **Cross-reference** — Add reference to `SparkForge_Hero_Page_Animation_v2.0.md` as the hero animation renders INSIDE CockpitCanvas (the canvas is shared).

**Log in PROGRESS.md:**
> F8: 3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md — Added R3F v9 async gl prop documentation for CockpitCanvas WebGPU init. Added cross-reference to Hero Animation v2.0 spec (shared canvas architecture).

---

## PHASE G: COMMIT & PUSH

### G1. Update `PROGRESS.md`

**File:** `PROGRESS.md` (repo root)
**Changes:**

Add new section at top (after header):

```markdown
### Hero Page Animation v2.0 Implementation — March 16, 2026

**Status:** [IN PROGRESS / COMPLETE] | **Build:** [PASS / FAIL]
**Reference:** docs/00-reference/SparkForge_Hero_Page_Animation_v2.0.md
**Implementation Plan:** docs/00-reference/Implementation_Plan_Hero_Page_Animation_v2.0.md

**New Source Files Created (11):**
- [ ] src/stores/uiStore.ts — updated (skipIntroAnimation)
- [ ] src/stores/deviceStore.ts — updated (gpuTier, stripeCount)
- [ ] src/lib/webgpuDetection.ts — NEW
- [ ] src/lib/3d/heroParticleCompute.ts — NEW
- [ ] src/lib/3d/heroParticleRender.ts — NEW
- [ ] src/shaders/crystallineLogo.vert — NEW
- [ ] src/shaders/crystallineLogo.frag — NEW
- [ ] src/shaders/electricVeins.frag — NEW
- [ ] src/shaders/voronoiShatter.comp — NEW
- [ ] src/lib/3d/voronoiFracture.ts — NEW
- [ ] src/lib/3d/heroSplines.ts — NEW
- [ ] src/lib/audio/heroAudio.ts — NEW
- [ ] src/hooks/useHeroAnimation.ts — NEW
- [ ] src/components/3d/HeroAnimation.tsx — NEW

**Stage Documents Updated (8):**
- [ ] F1: STAGE1_Foundation_v2_PART1.md — new packages + directory entries
- [ ] F2: STAGE1_Foundation_v2_PART2.md — webgpuDetection, deviceStore, uiStore updates
- [ ] F3: STAGE3_Part3A — HeroAnimation file registry + OD cross-references
- [ ] F4: STAGE3_Part3B — landing page HeroAnimation integration
- [ ] F5: STAGE4_Part3 — Settings skip toggle (OD-3)
- [ ] F6: STAGE5_Parts23C — shared TSL particle API note
- [ ] F7: KNOWN_COMPAT_NOTES.md — TSL/WebGPU migration notes
- [ ] F8: CPA v2.0 — R3F v9 async gl prop for CockpitCanvas

**Discrepancies Log:**
- [list each F1-F8 log entry here]
```

---

### G2. Commit

```bash
git add src/stores/uiStore.ts \
        src/stores/deviceStore.ts \
        src/lib/webgpuDetection.ts \
        src/lib/3d/heroParticleCompute.ts \
        src/lib/3d/heroParticleRender.ts \
        src/shaders/crystallineLogo.vert \
        src/shaders/crystallineLogo.frag \
        src/shaders/electricVeins.frag \
        src/shaders/voronoiShatter.comp \
        src/lib/3d/voronoiFracture.ts \
        src/lib/3d/heroSplines.ts \
        src/lib/audio/heroAudio.ts \
        src/hooks/useHeroAnimation.ts \
        src/components/3d/HeroAnimation.tsx \
        docs/stage1-foundation/STAGE1_Foundation_v2_PART1.md \
        docs/stage1-foundation/STAGE1_Foundation_v2_PART2.md \
        docs/stage3-auth-layout/STAGE3_Auth_Layout_Shell_v3_PART3A_20260314.md \
        docs/stage3-auth-layout/STAGE3_Auth_Layout_Shell_v3_PART3B_20260314.md \
        docs/stage4-core-pages/STAGE4_Core_Pages_v2_PART3.md \
        docs/stage5-gamification/STAGE5_Parts23C_v3FINAL.md \
        docs/00-reference/KNOWN_COMPAT_NOTES.md \
        docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md \
        docs/00-reference/Implementation_Plan_Hero_Page_Animation_v2.0.md \
        PROGRESS.md

git commit -m "Hero Page Animation v2.0: 8-phase cinematic sequence with WebGPU TSL particles

Implements the 19-second hero animation (OD-1 through OD-4):
- 11 new source files (~1,800 lines): particle compute/render, shaders, audio, orchestrator
- Store updates: uiStore (skipIntroAnimation), deviceStore (gpuTier, stripeCount)
- WebGPU tier detection with multi-buffer stripe probing
- TSL compute kernel for 1B+ lifetime particle throughput
- 8-phase GSAP timeline with skip/fast-forward support
- Tone.js spatial audio synchronized to animation progress
- 8 stage documents updated with implementation details"
```

---

### G3. Push

```bash
git push -u origin claude/sparkforge-stage1-foundation-LBQEo
```

If push fails due to network error, retry with exponential backoff:
- Retry 1: wait 2s
- Retry 2: wait 4s
- Retry 3: wait 8s
- Retry 4: wait 16s

---

## VALIDATION CHECKLIST

After all phases complete, verify:

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| Build | `npm run build` | PASS |
| New files exist | `ls src/components/3d/HeroAnimation.tsx` | File exists |
| Store fields | grep `skipIntroAnimation` in uiStore | Found |
| Store fields | grep `gpuTier` in deviceStore | Found |
| Package install | `npm ls three-bvh-csg` | Installed |
| Git status | `git status` | Clean working tree |
| Git push | `git log origin/claude/... -1` | Latest commit |

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| TSL API changes between Three.js versions | Low | High | Pin Three.js version in package.json; test TSL imports |
| WebGPU buffer allocation fails on low-VRAM devices | Medium | Medium | Graceful fallback chain: reduce stripes → WebGL2 → CSS |
| Tone.js autoplay blocked by browser | High | Low | Audio context created on first user interaction; animation plays silently if blocked |
| Voronoi tessellation too slow for 100K shards | Low | Medium | Pre-compute during Phase 1 idle time; reduce shard count on timeout |
| GSAP timeline out of sync with R3F frame loop | Low | High | Use `useFrame` to sync GSAP progress; avoid requestAnimationFrame conflicts |
| Build regression from new dependencies | Low | High | Run `npm run build` after each phase; rollback if breaking |

---

*End of Implementation Plan — Hero Page Animation v2.0*
*7 phases | 11 new files | 8 stage doc updates | ~1,800 new lines of source code*
*March 16, 2026*
