# SparkForge Hero Page Animation v2.0

**Version:** 2.0 | **Date:** March 15, 2026 | **Status:** SPECIFICATION
**Scope:** 8-phase cinematic hero sequence — crystal seed → logo formation → shatter → cockpit materialization → live app handoff
**Prerequisites:** Stage 3 v3-FINAL (StationFrame, CrystalShatter), CPA v2.0 (Cockpit Architecture), OD-1 through OD-4 (Resolved Design Decisions)
**Tech Stack:** Next.js 15 / React 19 / React Three Fiber v9 / Three.js r171+ (WebGPU) / TSL (Three Shader Language) / WebGPU Compute Shaders / GSAP / Tone.js / Motion
**Particle Budget:** 1,000,000,000+ lifetime throughput (upgraded from 500M via multi-buffer streaming + TSL compute)

---

## 1. EXECUTIVE SUMMARY

This document specifies the full **19-second cinematic hero animation** that plays when users first arrive at SparkForge. The sequence replaces the original `CrystalShatter.tsx` (Stage 3 v3-FINAL Part 3A) with an 8-phase orchestrated sequence that transforms a single seed of light into the fully operational cockpit interface.

**Key architectural innovation:** the animation's final rendered frame IS the application's first interactive frame — a seamless handoff with zero cuts, no canvas swaps, and no flash-of-unstyled-content. The R3F Canvas used throughout the hero animation is the same `CockpitCanvas` from CPA v2.0; cockpit geometry materializes from the shattered logo shards themselves.

**Design Decision Integration:**

- **OD-2 (Fast-Forward Scrub):** Click, tap, Enter, or Space during any phase accelerates the GSAP master timeline `timeScale` to 4x. Remaining animation completes in approximately 0.5 seconds while preserving visual continuity — shards still follow their spline paths to cockpit positions, just faster.
- **OD-3 (Skip Intro Toggle):** First visit always plays the full 19-second sequence. A `skipIntroAnimation` toggle (default `false`) is available per-child in `uiStore` via the Settings page. When enabled, the cockpit renders instantly at Phase 8's final state.
- **OD-4 (WebGPU Compute Shaders):** The particle system uses WebGPU compute shaders as the primary rendering path, enabling **1,000,000,000+ (1B+)** total lifetime particle throughput across the 19-second sequence. Graceful degradation follows: WebGPU → WebGL2 (device-tier caps per CLAUDE.md Section 9.1) → CSS (12-15 DOM-animated particles).

**Particle Budget Clarification:** The "1B+" figure refers to total lifetime particle throughput — particles spawned, simulated, and recycled across the full 19-second sequence. Peak simultaneous rendered particles cap at ~10M (WebGPU high-end) during Phase 2 convergence and Phase 5 shatter, achieved via **multi-buffer striped architecture** (4 × 256MB storage buffers, each holding 2.5M particles) and TSL-authored compute shaders that compile to both WGSL (WebGPU) and GLSL (WebGL2). At 60fps across 19s (~1,140 frames), recycling 10M particles per frame yields ~11.4B potential lifetime spawns — well above the 1B target. VRAM-aware streaming and particle pool recycling make this feasible on consumer GPUs with 4GB+ VRAM.

**Triangle Budget:** The hero animation peaks at ~1,000,000,000+ lifetime particles (WebGPU) or device-tier caps (WebGL2/CSS fallback). Mesh geometry peaks at ~100,000 shard triangles during Phase 5 (upgraded from 50K), transitioning to the cockpit's ~30M+ triangles (post D3D-3 upgrade; originally ~104,400 per CPA v2.0) by Phase 7.

**Tech Stack Upgrade Summary (vs. prior 500M spec):**
- **Three.js r171+** — production-ready WebGPU with `import * as THREE from 'three/webgpu'` and automatic WebGL2 fallback
- **TSL (Three Shader Language)** — replaces raw WGSL/GLSL with JS-based shader authoring that compiles to both backends. Enables `instancedArray()`, `Fn()` compute kernels, and `storage()` nodes for cross-renderer particle systems
- **React Three Fiber v9** — async `gl` prop for `WebGPURenderer` initialization: `gl={async (canvas) => { const r = new WebGPURenderer({canvas}); await r.init(); return r; }}`
- **Multi-buffer striped storage** — 4 parallel storage buffers (each 256MB, within WebGPU's `maxStorageBufferBindingSize` default) for 10M simultaneous particles at 48 bytes each
- **Safari 26+ WebGPU support** — ~95% browser coverage; remaining 5% get WebGL2 fallback automatically

---

## 2. DESIGN DECISIONS INTEGRATION

All four outstanding design decisions (OD-1 through OD-4) are resolved and integrated into this specification.

| Decision | Resolution | Integration in Hero Animation |
|----------|-----------|-------------------------------|
| **OD-1: Audio Default** | Sound ON by default | Hero sequence plays with full Tone.js audio (low rumble → crescendo → electric surge → shatter crack → cockpit boot hum). Audio respects per-child `soundEnabled` in `uiStore`. If `soundEnabled === false`, all Tone.js nodes are muted but timeline proceeds identically. Audio context is created on first user interaction (click/tap) per browser autoplay policy. |
| **OD-2: Crystal Shatter Skip** | Fast-forward scrub at 4x | Click/tap/Enter/Space during any phase accelerates GSAP timeline `timeScale` to 4x. Remaining animation completes in ~0.5s. Visual continuity preserved — shards still follow spline paths to cockpit positions, just faster. No phase skipping; all 8 phases execute in compressed time. The scrub button renders as a subtle "Skip >" label in bottom-right corner (opacity 0.4, font-body, 14px). |
| **OD-3: Repeat Visit** | Full sequence + skip option | First visit always plays full 19s. Settings toggle `skipIntroAnimation` (default `false`) in `uiStore`, stored per-child. When enabled, instant cockpit render (Phase 8 final state) — no animation, no audio, no timeline. The toggle appears in the child Settings page (Stage 4 Part 3) under "Visual Preferences." No auto-shortening on repeat visits unless toggle is explicitly enabled. |
| **OD-4: WebGPU Compute** | 1B+ particles via WebGPU + TSL | Primary rendering path uses TSL compute kernels (compiling to WGSL/GLSL) for particle simulation via multi-buffer striped architecture. Degradation chain: WebGPU high-end (1B+ lifetime, 4 stripes) → WebGPU mid-range (500M+, 2 stripes) → WebGL2 (50M, instanced) → CSS (15 particles). Detection via `webgpuDetection.ts` with `maxStorageBufferBindingSize` probing for stripe count. `deviceStore.gpuTier` + `deviceStore.stripeCount` drive selection at mount time. Tier is cached in localStorage and re-evaluated only on device change. |

### Decision Interaction Matrix

Several decisions interact with each other. The following matrix clarifies behavior at intersection points:

| Scenario | Behavior |
|----------|----------|
| OD-1 OFF + OD-2 triggered | Fast-forward proceeds silently; no audio nodes are started or scrubbed |
| OD-1 ON + OD-2 triggered | Audio timeline scrubs to 4x; pitch compensation applied via `Tone.Transport.timeSignature` adjustment to prevent chipmunk effect |
| OD-3 ON (skip enabled) | OD-1 and OD-2 are irrelevant — no animation plays, cockpit renders immediately |
| OD-4 CSS fallback + OD-2 | CSS animation uses `animation-duration` reduction instead of GSAP timeScale; visual result identical |

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Rendering Pipeline

The hero animation operates within a single R3F Canvas instance that persists for the entire application lifecycle:

- **Single R3F Canvas** (`CockpitCanvas` from CPA v2.0) mounted at `z-index: 0` in the root layout
- **WebGPU compute shader pipeline** for particle simulation when available (500M+ lifetime budget)
- **Three.js r170+** with `WebGPURenderer` as primary renderer, `WebGLRenderer` as fallback
- Fallback: **WebGL2 instanced rendering** with device-tier particle caps (per CLAUDE.md Section 9.1)
- **GSAP master timeline** orchestrates all 8 phases with labeled sections for scrubbing and fast-forward
- **Tone.js spatial audio** synchronized to timeline progress via `Tone.Transport` position binding
- **Post-processing stack:** `EffectComposer` with Bloom, ChromaticAberration, MotionBlur (selectively enabled per phase)

```
┌─────────────────────────────────────────────────────────────┐
│                    CockpitCanvas (R3F)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WebGPURenderer / WebGLRenderer (auto-detected)       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Scene Graph                                     │  │  │
│  │  │  ├─ HeroAnimation (Phases 1-7, unmounts at 8)   │  │  │
│  │  │  │  ├─ ParticleSystem (compute/instanced)        │  │  │
│  │  │  │  ├─ LogoGeometry (TextGeometry + shaders)     │  │  │
│  │  │  │  ├─ ShardSystem (Voronoi fragments)           │  │  │
│  │  │  │  └─ SplinePaths (shard migration curves)      │  │  │
│  │  │  ├─ CockpitShell (materializes in Phase 7)      │  │  │
│  │  │  │  ├─ CockpitPanel                              │  │  │
│  │  │  │  ├─ SidePanel (L/R)                           │  │  │
│  │  │  │  ├─ HolographicHUD                            │  │  │
│  │  │  │  ├─ StatusBar3D                               │  │  │
│  │  │  │  └─ LEDRim                                    │  │  │
│  │  │  └─ PostProcessing (Bloom, CA, MotionBlur)      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  GSAP Master Timeline                                 │  │
│  │  ├─ "void"      (0.0 – 2.0s)                        │  │
│  │  ├─ "assembly"  (2.0 – 4.5s)                        │  │
│  │  ├─ "showcase"  (4.5 – 7.5s)                        │  │
│  │  ├─ "surge"     (7.5 – 10.0s)                       │  │
│  │  ├─ "shatter"   (10.0 – 11.5s)                      │  │
│  │  ├─ "regroup"   (11.5 – 14.0s)                      │  │
│  │  ├─ "cockpit"   (14.0 – 17.0s)                      │  │
│  │  └─ "handoff"   (17.0 – 19.0s)                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tone.js Audio Graph                                  │  │
│  │  ├─ Master Volume → Limiter → Destination            │  │
│  │  ├─ Sub-bass (Phase 1-2)                             │  │
│  │  ├─ Whoosh/Impact (Phase 2, 5)                       │  │
│  │  ├─ Crystalline hum (Phase 3)                        │  │
│  │  ├─ Electric crackle (Phase 4)                       │  │
│  │  ├─ Shatter transient (Phase 5)                      │  │
│  │  ├─ Migration drone (Phase 6)                        │  │
│  │  ├─ Boot sequence (Phase 7)                          │  │
│  │  └─ Cockpit ambient (Phase 8 — persists)            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 WebGPU Particle Compute Architecture (1B+ Upgrade)

The particle system is the most technically demanding component of the hero animation. It uses a tiered approach with **TSL (Three Shader Language)** to deliver maximum visual impact across all device capabilities while maintaining a single codebase for WebGPU and WebGL2.

#### TSL-Based Compute Pipeline (Primary Path)

Since Three.js r171+, custom `ShaderMaterial` and `RawShaderMaterial` are not supported in `WebGPURenderer`. All shaders must use **TSL (Three Shader Language)** — a JavaScript-based shader authoring system that compiles to WGSL (WebGPU) and GLSL (WebGL2) automatically.

- **Compute Kernel:** Authored in TSL via `Fn()` — stored in `src/lib/3d/heroParticleCompute.ts` (NOT raw WGSL)
- **Storage Buffers:** TSL `instancedArray(count, type)` creates GPU-persistent buffers. Double-buffered via ping-pong pattern.
- **Workgroup Size:** 256 threads per workgroup, dispatched as `ceil(activeParticleCount / 256)` workgroups
- **Multi-Buffer Striped Architecture (1B+ enabler):** WebGPU's default `maxStorageBufferBindingSize` is 128MB (can request up to 256MB). At 48 bytes/particle, one buffer holds ~2.67M particles. To reach 10M simultaneous, we use **4 parallel storage buffer pairs** (8 buffers total), each managing a 2.5M particle slice. The compute shader dispatches 4 bind groups per frame.

```typescript
// TSL particle buffer setup (replaces raw WGSL)
import { instancedArray, Fn, float, vec3, vec4, storage, uniform } from 'three/tsl';

const PARTICLES_PER_STRIPE = 2_500_000;
const STRIPE_COUNT = 4;

// 4 striped buffers for 10M total
const stripes = Array.from({ length: STRIPE_COUNT }, (_, i) => ({
  positions: instancedArray(PARTICLES_PER_STRIPE, 'vec3'),
  velocities: instancedArray(PARTICLES_PER_STRIPE, 'vec3'),
  colors: instancedArray(PARTICLES_PER_STRIPE, 'vec4'),
  lives: instancedArray(PARTICLES_PER_STRIPE, 'float'),
  sizes: instancedArray(PARTICLES_PER_STRIPE, 'float'),
}));
```

- **Storage Buffers:** Double-buffered particle state for read/write separation (ping-pong pattern):

```wgsl
struct Particle {
    position: vec3<f32>,    // 12 bytes
    velocity: vec3<f32>,    // 12 bytes
    color: vec4<f32>,       // 16 bytes
    life: f32,              //  4 bytes
    size: f32,              //  4 bytes
    // Total: 48 bytes per particle
};

@group(0) @binding(0) var<storage, read> particlesIn: array<Particle>;
@group(0) @binding(1) var<storage, read_write> particlesOut: array<Particle>;
@group(0) @binding(2) var<uniform> params: SimParams;
```

#### Revised Realistic Budget (1B+ Target)

Given VRAM constraints on consumer GPUs (4-8GB typical), the 1B+ target uses a **multi-buffer striped streaming system** with aggressive particle recycling:

- **Active visible particles:** 5M–10M rendered per frame (instanced billboard quads across 4 striped buffers)
- **Background star field:** 1M point sprites with minimal per-particle data (16 bytes: `vec3<f32> position` + `f32 brightness`)
- **Particle recycling pool:** TSL compute kernel recycles dead particles (`life <= 0`) into new spawn positions each frame. Dead particles are atomically appended to a per-stripe free-list buffer, and spawn requests pop from this list. Atomic operations use TSL's `atomicAdd` / `atomicLoad` nodes.
- **The "1B+" figure** refers to total lifetime particle throughput across the 19-second sequence, NOT simultaneous rendered particles. At 60fps across 19 seconds (~1,140 frames), recycling 10M particles per frame yields ~11.4B potential lifetime spawns — well above the 1B target.
- **Peak simultaneous rendered particles:** ~10M during Phase 2 convergence and Phase 5 shatter burst
- **Multi-buffer strategy:** 4 stripe buffers × 2.5M particles × 48 bytes = 480MB total (within 4GB VRAM budget, leaving headroom for textures and cockpit geometry)
- **Frustum culling on GPU:** Particles outside camera frustum are flagged in compute pass and skipped in render pass, reducing fill-rate pressure by ~40%

#### Render Pipeline

Particles are rendered as **instanced billboard quads** with custom vertex and fragment shaders:

```
Compute Pass (per frame):
  1. Read particlesIn buffer
  2. Apply forces (gravity, drag, attractors, repulsors)
  3. Update position += velocity * dt
  4. Decrement life, recycle dead → free list
  5. Write to particlesOut buffer
  6. Swap buffers (ping-pong)

Render Pass (per frame):
  1. Bind particlesOut as instance buffer
  2. Draw instanced quads (4 vertices × activeCount instances)
  3. Vertex shader: billboard orientation + size scaling
  4. Fragment shader: soft circle SDF + glow + trail fade
  5. Blending: additive (src: ONE, dst: ONE)
```

#### Adaptive Budget by GPU Tier

| GPU Tier | Peak Simultaneous | Lifetime Throughput | Buffer Size | Stripe Count | Notes |
|----------|-------------------|--------------------:|-------------|:------------:|-------|
| WebGPU (high-end, 8GB+ VRAM) | 10,000,000 | 1,000,000,000+ | ~480MB | 4 | Full TSL compute pipeline, all effects, 4-stripe buffers |
| WebGPU (mid-range, 4GB VRAM) | 5,000,000 | 500,000,000+ | ~240MB | 2 | 2-stripe buffers, reduced trail density |
| WebGPU (low-end, 2GB VRAM) | 2,000,000 | 200,000,000+ | ~96MB | 1 | Single buffer, no motion blur |
| WebGL2 (desktop) | 500,000 | 50,000,000 | ~24MB | — | TSL compiles to GLSL, instanced rendering |
| WebGL2 (tablet) | 150,000 | 15,000,000 | ~7MB | — | Reduced effects, no motion blur |
| WebGL2 (mobile) | 50,000 | 5,000,000 | ~2.4MB | — | Minimal particles, no post-processing |
| CSS fallback | 15 | 15 | 0 | — | DOM-animated `<div>` elements with `radial-gradient` backgrounds |

#### GPU Tier Detection

Detection runs once at application mount via `webgpuDetection.ts` and caches the result in `deviceStore.gpuTier`:

```typescript
// src/lib/webgpuDetection.ts (pseudocode)
export async function detectGPUTier(): Promise<'webgpu' | 'webgl2' | 'css'> {
  // 1. Check WebGPU availability
  if (navigator.gpu) {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter) {
      const device = await adapter.requestDevice();
      // Probe max buffer size, max compute workgroup size
      const limits = device.limits;
      if (limits.maxStorageBufferBindingSize >= 256_000_000) {
        return 'webgpu'; // high-end or mid-range determined by further probing
      }
    }
  }
  // 2. Check WebGL2
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (gl) return 'webgl2';
  // 3. CSS fallback
  return 'css';
}
```

### 3.3 File Registry (New Files)

All new files created by this specification, their purpose, and their stage impact:

| File | Purpose | Stage Impact |
|------|---------|-------------|
| `src/components/3d/HeroAnimation.tsx` | Master orchestrator component — manages 8-phase GSAP timeline, particle system lifecycle, camera transitions, and handoff to cockpit | Stage 3 Part 3A (replaces standalone `CrystalShatter` usage on landing page) |
| `src/lib/3d/heroParticleCompute.ts` | TSL compute kernel for particle simulation — position/velocity/life/color updates, multi-stripe dispatch, recycling pool, force fields. Compiles to WGSL (WebGPU) or GLSL (WebGL2) automatically. | Stage 1 Part 2 (new TSL file) |
| `src/lib/3d/heroParticleRender.ts` | TSL render material for instanced particle billboard quads — SDF soft-circle, glow halo, additive blending, trail fade. Uses `SpriteNodeMaterial` with custom TSL fragment nodes. | Stage 1 Part 2 |
| `src/shaders/crystallineLogo.vert` | Vertex shader for extruded text geometry — displacement mapping for crystalline faceting, UV generation | Stage 3 Part 3A |
| `src/shaders/crystallineLogo.frag` | Fragment shader with subsurface scattering approximation, IOR-based refraction, transmission, clearcoat specular | Stage 3 Part 3A |
| `src/shaders/electricVeins.frag` | Animated energy vein propagation shader — L-system branching in UV space with Perlin noise offset, emissive output | Stage 3 Part 3A |
| `src/shaders/voronoiShatter.comp` | Compute shader for Voronoi fracture cell generation — used during Phase 5 init to pre-compute shard boundaries | Stage 3 Part 3A |
| `src/lib/audio/heroAudio.ts` | Tone.js audio timeline definition — all 8 phase audio cues, spatial panning, reverb/delay chains, master volume/limiter | Stage 3 Part 3A |
| `src/hooks/useHeroAnimation.ts` | React hook managing timeline state, skip logic (OD-3), fast-forward (OD-2), WebGPU tier detection, phase callbacks | Stage 3 Part 3A |
| `src/lib/3d/heroSplines.ts` | Spline path definitions for Phase 6 shard migration — per-shard `CubicBezierCurve3` with randomized control points | Stage 3 Part 3A |
| `src/lib/3d/voronoiFracture.ts` | CPU-side Voronoi tessellation for shatter geometry — generates `BufferGeometry[]` from input mesh, cached at init | Stage 3 Part 3A |

### 3.4 Store Changes

#### uiStore Additions (per OD-3)

```typescript
// Added to existing uiStore shape in src/stores/uiStore.ts

interface UIState {
  // ... existing properties ...

  /** Per-child setting: skip the hero intro animation on page load.
   *  Default: false. Toggled in Settings page (Stage 4 Part 3).
   *  When true, HeroAnimation renders Phase 8 final state immediately. */
  skipIntroAnimation: boolean;
}

// Default value in store creation:
skipIntroAnimation: false,

// Action:
setSkipIntroAnimation: (skip: boolean) => set({ skipIntroAnimation: skip }),
```

#### deviceStore Additions (per OD-4)

```typescript
// Added to existing deviceStore shape in src/stores/deviceStore.ts

interface DeviceState {
  // ... existing properties (deviceType, hasSelected, profile) ...

  /** GPU rendering tier detected at runtime by webgpuDetection.ts.
   *  Determines particle budget and rendering pipeline for hero animation.
   *  Cached in localStorage alongside existing device preferences. */
  gpuTier: 'webgpu' | 'webgl2' | 'css';
}

// Default value in store creation:
gpuTier: 'webgl2',  // safe default until detection runs

// Action:
setGpuTier: (tier: 'webgpu' | 'webgl2' | 'css') => set({ gpuTier: tier }),
```

#### Store Persistence

Both new properties persist via the existing localStorage mechanisms:

- `skipIntroAnimation` persists under the `sparkforge-ui` localStorage key (existing uiStore persistence)
- `gpuTier` persists under the `sparkforge-device` localStorage key (existing deviceStore persistence)
- On child switch, `skipIntroAnimation` reloads from the active child's preferences

---

## 4. 8-PHASE SCENE BREAKDOWN

The hero animation consists of 8 sequential phases totaling 19 seconds. Each phase is defined as a labeled section on the GSAP master timeline, enabling scrub-to (OD-2) and debug seeking.

### Phase 1 — Deep Void Awakening (0.0s – 2.0s)

**GSAP Timeline Label:** `"void"`

**Visual Description:**

The sequence opens on an infinite cosmic void. The background is a deep space gradient centered on `#000814` (near-black navy), with subtle nebula wisps painted via a fullscreen shader quad (Perlin noise FBM, 4 octaves, scale 0.001, animated at 0.02 units/s). A field of 500K+ micro-particles appears as distant stars, each exhibiting slow Brownian drift motion (Perlin velocity perturbation, amplitude 0.005, frequency 2.0).

At screen center, a single seed point of light pulses — an expanding volumetric glow implemented as a `MeshPhysicalMaterial` sphere (radius 0.05, segments 16):

- Emissive color: `#00BBFF` (Frost-Prismatic blue)
- Emissive intensity ramp: `0.0 → 2.0` over 2 seconds (GSAP `fromTo`)
- Scale pulse: `sin(time * 3.0) * 0.02 + 1.0` (gentle breathing)
- Bloom contribution: intensity 1.5, radius 0.8, threshold 0.4

Particle colors span cool whites (`#FFFFFF`), pale blues (`#AADDFF`), and hints of Frost-Prismatic blue (`#00BBFF`), distributed 60/30/10.

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| Position | `[0, 0, 1.5]` → `[0, 0, 2.5]` | Linear pullback at 0.5 units/s |
| FOV | 35° (tight macro) | Static |
| Look-at | `[0, 0, 0]` (seed point) | Static |
| Micro-drift | Perlin noise on `x, y` position | Amplitude 0.01, frequency 0.5 |

**Audio (Tone.js):**

```typescript
// Phase 1 audio cues
const voidAudio = {
  // Low rumble crescendo
  rumble: new Tone.Noise('brown').connect(
    new Tone.Filter({ type: 'lowpass', frequency: 80, rolloff: -24 })
  ), // frequency ramps 80Hz → 200Hz over 2s

  // Sub-bass foundation
  subBass: new Tone.Oscillator({
    type: 'sine',
    frequency: 40,
  }).connect(new Tone.Gain(0)), // amplitude ramps 0 → 0.3 over 2s

  // Reverb environment
  reverb: new Tone.Reverb({ decay: 4, wet: 0.6 }),
};
```

**Particle System:**

| Tier | Implementation | Count | Per-Particle Data | Buffer |
|------|---------------|-------|-------------------|--------|
| WebGPU (high) | TSL compute + point sprites | 1,000,000 | 16 bytes (`vec3 pos` + `f32 brightness`) | ~16MB |
| WebGPU (mid) | TSL compute + point sprites | 500,000 | 16 bytes | ~8MB |
| WebGL2 | TSL→GLSL instanced `Points` | 100,000 | 16 bytes | ~1.6MB |
| CSS | DOM `<div>` with `radial-gradient` | 12 | — | 0 |

**Triangle Budget:** ~500K point sprites (no mesh geometry besides the seed sphere at 512 tris)

---

### Phase 2 — Particle Storm Assembly (2.0s – 4.5s)

**GSAP Timeline Label:** `"assembly"`

**Visual Description:**

All star-field particles reverse their drift and rush inward from every direction, converging on the center point. Each particle gains a velocity trail — implemented via additive blending with alpha decay over 4 frames (trail buffer stores last 4 positions per particle, rendered as a quad strip).

At the convergence point, collision flashes erupt — bright white spark bursts (200 emissive sprite instances per flash, life 0.1s, scale 0.01→0.05→0.0). Three major collision bursts occur at `t=2.5s`, `t=3.2s`, and `t=4.0s`.

As particles reach center, they fuse into 3D extruded crystalline **"SparkForge"** letters:

- **Text Geometry:** `TextGeometry` using Exo 2 Bold font (loaded via `FontLoader` from `/fonts/exo2-bold.json`)
- **Extrusion:** depth 0.3, bevel enabled (thickness 0.02, size 0.02, segments 3)
- **Triangle Count:** ~8,000 triangles total across all letters
- **Crystalline Material:** `MeshPhysicalMaterial`:

```typescript
const crystallineMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 0.9,
  thickness: 0.5,
  ior: 1.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  roughness: 0.05,
  metalness: 0.1,
  envMap: frostPrismaticHDR,     // from public/hdri/frost-prismatic.hdr
  envMapIntensity: 1.2,
  emissive: new THREE.Color('#00BBFF'),
  emissiveIntensity: 0.0,        // ramps to 0.5 during Phase 3
  flatShading: true,              // faceted bevel edges for crystalline look
});
```

The dust-to-solid transition is handled by the compute shader lerping each particle's position toward the nearest vertex on the text geometry. A KD-tree of text vertices is built at init time, and each particle is assigned its target vertex index during Phase 2 onset:

```
For each particle i:
  target[i] = kdTree.nearest(particle[i].position)
  particle[i].position = lerp(particle[i].position, target[i], smoothstep(t, 2.0, 4.5))
```

10K trailing particle wisps persist during convergence — ribbon geometry (2 triangles per segment, 8 segments per ribbon) follows each particle's spline path with fading alpha.

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| Position | `[0, 0, 2.5]` → `[0, 0, 5.0]` | Pullback to reveal full text |
| FOV | 35° → 50° | Smooth ease over 2.5s |
| Scale overshoot | — | Text scale: `1.0 → 1.05 → 1.0` at `t=4.3s` (spring ease, stiffness 300) |

**Audio (Tone.js):**

```typescript
// Phase 2 audio cues
const assemblyAudio = {
  // Rising whoosh
  whoosh: new Tone.Noise('white').connect(
    new Tone.Filter({ type: 'bandpass', frequency: 200, Q: 2 })
  ), // frequency sweeps 200Hz → 2kHz over 2.5s

  // Impact hit at t=4.0s
  impact: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }),
  clang: new Tone.MetalSynth({ frequency: 800, resonance: 4000 }),

  // Crystalline formation
  grainChimes: new Tone.GrainPlayer({
    url: '/audio/glass-chime.mp3',
    grainSize: 0.05,
    overlap: 0.1,
  }),
};
```

**Particle System:**

| Tier | Implementation | Count | Per-Particle Data | Buffer | Stripes |
|------|---------------|-------|-------------------|--------|:-------:|
| WebGPU (high) | TSL compute + instanced quads | 10,000,000 | 48 bytes | ~480MB | 4 |
| WebGPU (mid) | TSL compute + instanced quads | 5,000,000 | 48 bytes | ~240MB | 2 |
| WebGL2 | TSL→GLSL instanced quads | 500,000 | 48 bytes | ~24MB | — |
| CSS | DOM `<div>` with CSS `transform: translate()` | 15 | — | 0 | — |

**Triangle Budget:** ~8,000 (text geometry) + ~2,000 (collision sprite quads) + particle billboard quads (instanced, not counted as scene tris)

---

### Phase 3 — Formed Logo Showcase (4.5s – 7.5s)

**GSAP Timeline Label:** `"showcase"`

**Visual Description:**

The fully formed "SparkForge" crystalline logo hovers at screen center, occupying approximately 70-80% of horizontal frame width. The camera performs a full 360-degree cinematic orbit over 3 seconds, revealing depth, refraction through the glassmorphic material, and internal crystalline facets from every angle.

The glassmorphic material responds to the environment map (`frost-prismatic.hdr` from `public/hdri/`) with real-time reflections and transmission-based refraction. Internal facets are visible through the transparent letter bodies, creating a gemstone-like quality.

10K+ trailing particles orbit the letter edges in a ribbon particle system:

- Ribbon geometry: 2 triangles per segment, 4 segments per ribbon, per particle
- Particles follow letter edge curves (extracted from geometry edge detection)
- Additive blending, base color `#00BBFF`, alpha 0.3
- Orbit speed: 0.5 rad/s, varying per particle (±20% randomized)

Internal glow pulses in Frost-Prismatic blue `#00BBFF`:

```glsl
// In crystallineLogo.frag
uniform float uTime;
float glowIntensity = sin(uTime * 2.0) * 0.5 + 1.0;
emissive *= glowIntensity;
```

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| Path | Circular orbit, radius 3.0, center `[0, 0, 0]` | Full 360° over 3.0s |
| Altitude | `±0.3` sine wave variation | `sin(orbitAngle * 2.0) * 0.3` |
| FOV | 50° | Static |
| Controls | OrbitControls **disabled** | Camera follows GSAP path exclusively |

```typescript
// Camera orbit GSAP tween
const orbitTween = gsap.to(cameraState, {
  angle: Math.PI * 2,
  duration: 3.0,
  ease: 'none', // linear orbit for smooth continuous rotation
  onUpdate: () => {
    camera.position.x = Math.cos(cameraState.angle) * 3.0;
    camera.position.z = Math.sin(cameraState.angle) * 3.0;
    camera.position.y = Math.sin(cameraState.angle * 2.0) * 0.3;
    camera.lookAt(0, 0, 0);
  },
});
```

**Audio (Tone.js):**

```typescript
// Phase 3 audio cues
const showcaseAudio = {
  // Ambient crystalline hum
  hum: new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.0, decay: 0.5, sustain: 0.8, release: 2.0 },
  }), // plays C4, E4, G4, B4 chord at volume -16dB

  // Spatial whoosh following camera orbit
  whoosh: new Tone.Noise('pink').connect(
    new Tone.Panner3D({ positionX: 0, positionY: 0, positionZ: 3 })
  ), // panner follows camera position for L→R sweep
};
```

**Triangle Budget:** ~8,000 (text geometry) + ~10,000 (orbit ribbon particles as billboard quads)

---

### Phase 4 — Electricity Surge (7.5s – 10.0s)

**GSAP Timeline Label:** `"surge"`

**Visual Description:**

Electric blue `#00FFFF` energy veins propagate inside the letter geometry. This is achieved via a custom fragment shader (`electricVeins.frag`) that renders animated UV-space branching patterns:

```glsl
// electricVeins.frag — core algorithm
uniform float uTime;
uniform float uIntensity; // ramps 0 → 1 over 2.5s

// L-system fractal branching with Perlin noise offset
float vein = 0.0;
for (int i = 0; i < 6; i++) {
    vec2 uv_offset = vUv + perlinNoise2D(vUv * float(i + 1) + uTime * 0.5) * 0.1;
    float branch = smoothstep(0.48, 0.50, abs(fract(uv_offset.x * pow(2.0, float(i))) - 0.5));
    branch *= smoothstep(0.48, 0.50, abs(fract(uv_offset.y * pow(2.0, float(i))) - 0.5));
    vein += branch * (1.0 / float(i + 1));
}
vein *= uIntensity;
```

Veins follow letter mesh edges, branching at vertex junctions with increasing density over the 2.5-second phase duration.

**Plasma arcs** jump between letters:

- 8 arc instances connecting adjacent letter pairs
- Each arc: cubic bezier with animated control points (oscillating ±0.3 at 3Hz)
- Geometry: `TubeGeometry` along bezier path, radius 0.008, segments 32
- Material: `MeshBasicMaterial`, emissive `#00FFFF`, additive blending
- Bloom contribution: intensity 2.0 (intense glow)

**Surface vibration** (energy overload build):

- Letter position noise: Perlin-based displacement
- Amplitude: `0.0 → 0.05` over 2.5 seconds
- Frequency: 30Hz (updated each frame, `noise3D(time * 30, 0, 0) * amplitude`)

**Emissive temperature rise:**

- `emissiveIntensity` uniform ramps from `0.5` (end of Phase 3) to `3.0` over 2.5 seconds
- Color shifts subtly from `#00BBFF` toward `#00FFFF` (cooler → electric)

**God ray bursts** shoot outward from high-energy vertices:

- 6 `ConeGeometry` instances (radius 0.1, height 2.0, segments 8)
- Positioned at letter vertices with highest accumulated energy (pre-computed)
- Material: additive blending, alpha 0.1, tinted `#00BBFF`
- Scale animation: height `0 → 2.0` over 0.3s each, staggered start

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| Shake | Amplitude `0 → 0.03` | Linear ramp over 2.5s, per-frame random offset with spring damping |
| FOV | 50° ± 0.5° | Micro-pulse at 4Hz: `50 + sin(time * 4 * 2π) * 0.5` |
| Position | Base `[0, 0, 5.0]` | Static base + shake offset |

**Audio (Tone.js):**

```typescript
// Phase 4 audio cues
const surgeAudio = {
  // Electric crackle
  crackle: new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 2500, Q: 4 })
  ), // triggered stochastically every 50-150ms

  // Rising tension
  tensionSweep: new Tone.Oscillator({
    type: 'sawtooth',
    frequency: 100,
  }).connect(
    new Tone.Filter({ type: 'lowpass', frequency: 800, Q: 12 })
  ), // frequency sweeps 100Hz → 800Hz over 2.5s

  // Thunder build
  thunder: new Tone.Noise('brown').connect(
    new Tone.Gain(0) // amplitude ramps 0 → 0.4
  ),
};
```

**Triangle Budget:** ~8,000 (text geometry) + ~1,000 (8 arc tubes × ~128 tris each) + ~600 (6 god ray cones × ~100 tris each) = ~9,600 mesh triangles

---

### Phase 5 — Catastrophic Shatter (10.0s – 11.5s)

**GSAP Timeline Label:** `"shatter"`

**Visual Description:**

Energy overload reaches critical mass. The sequence begins with a **glass crack propagation** effect (200ms before detonation, at `t=10.0s`):

- Procedural fracture lines rendered as a screen-space post-processing pass (custom shader)
- Lines trace Voronoi cell edges, animated from center outward at 20 cells/frame
- Line rendering: white, width 1px, alpha 0.8, additive blending

At `t=10.2s`, the **bright flash** fires:

- Full-screen quad, color `#FFFFFF`, alpha ramp: `0 → 1 → 0` over 200ms
- Peak alpha at `t=10.3s` (50ms rise, 150ms fall)
- Simultaneously triggers chromatic aberration spike: R/G/B channel offset `3px → 0px` over 0.5s

The letters **explode into 50,000+ crystalline Voronoi shards:**

- **Voronoi tessellation** is pre-computed at animation initialization by `voronoiFracture.ts`:

```typescript
// src/lib/3d/voronoiFracture.ts — API
export function generateVoronoiShards(
  inputGeometry: THREE.BufferGeometry,
  shardCount: number,
  seed: number
): THREE.BufferGeometry[] {
  // 1. Generate N random seed points within mesh bounding box
  // 2. Compute 3D Voronoi tessellation (Bowyer-Watson algorithm)
  // 3. Clip Voronoi cells to mesh surface
  // 4. Return array of BufferGeometry (one per shard)
  // Result is cached — computed once at HeroAnimation mount
}
```

- Shard count by tier:

| Tier | Shard Count | Notes |
|------|------------|-------|
| WebGPU (high) | 100,000 | Full Voronoi tessellation (upgraded from 50K) |
| WebGPU (mid) | 50,000 | Standard Voronoi tessellation |
| WebGL2 (desktop) | 10,000 | Reduced cell count |
| WebGL2 (tablet) | 2,000 | Simplified fracture |
| WebGL2 (mobile) | 500 | Minimal shards |
| CSS | 8 | DOM elements with `clip-path` |

- Each shard retains a fragment of the letter's `MeshPhysicalMaterial` plus emissive glow
- Per-shard physics simulation (computed in compute shader or CPU depending on tier):

```
Initial velocity: 5–15 units/s radial from center + random tangential component
Per-shard rotation: random axis (normalized vec3), angular velocity 2–8 rad/s
Gravity: -2.0 y-axis (reduced — shards are in a space-like environment)
Air resistance: velocity *= 0.98 per frame (drag coefficient)
```

**Trailing light ribbons** follow fast-moving shards:

- 4 vertices per shard trail segment, 8 segments per trail
- Trail color inherits shard emissive color, alpha decays linearly over trail length
- Only rendered for shards above velocity threshold (> 3 units/s)

**Radial motion blur** applied in the fragment shader based on per-pixel velocity.

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| FOV | 50° → 55° over 0.3s | Spring back to 53° (overshoot then settle) |
| Shake | Spike amplitude 0.08 | Exponential decay to 0 over 0.5s |
| Position | `[0, 0, 5.0]` | Static base + shake |

**Audio (Tone.js):**

```typescript
// Phase 5 audio cues — all triggered at t=10.2s (detonation)
const shatterAudio = {
  // Massive impact — layered transient
  subDrop: new Tone.MembraneSynth({
    pitchDecay: 0.1,
    octaves: 6,
    frequency: 40,
  }),

  glassShatter: new Tone.Player('/audio/glass-shatter.mp3'),

  impactReverb: new Tone.Reverb({ decay: 3.0, wet: 0.7 }),

  // Debris scatter — granular glass fragments
  debris: new Tone.GrainPlayer({
    url: '/audio/glass-fragments.mp3',
    grainSize: 0.03,
    overlap: 0.15,
    playbackRate: 1.0, // randomized ±1 semitone per grain
  }),

  // Echo decay
  echo: new Tone.FeedbackDelay({
    delayTime: 0.3,
    feedback: 0.4,
  }).connect(new Tone.Filter({ type: 'lowpass', frequency: 2000 })),
};
```

**Triangle Budget:** ~50,000 shard meshes (WebGPU), each shard averaging ~1 triangle (Voronoi face) to ~10 triangles (extruded shard with depth) = 50K–500K shard triangles + ribbon trail geometry

---

### Phase 6 — Shard Drift & Regrouping (11.5s – 14.0s)

**GSAP Timeline Label:** `"regroup"`

**Visual Description:**

After the explosion, shards decelerate over the first 1.0 second (`t=11.5s → 12.5s`), hovering momentarily in a frozen debris field. Then, beginning at `t=12.5s`, they intentionally and purposefully begin migrating toward their designated cockpit formation positions.

**Shard Group Assignments:**

Each shard is pre-assigned to a cockpit component target based on its originating letter position and explosion trajectory:

| Shard Group | Source Region | Target Component | Target Positions | Color Shift |
|-------------|--------------|-----------------|------------------|-------------|
| Top/bottom shards | Letters' top/bottom edges | `CockpitPanel` curved bezel | Arc positions at `panelRadius = 4.8` (v3.0) | Crystal `#00BBFF` → chrome alloy `#a8b5c8` |
| Side shards | Letters' left/right extremes | `SidePanel` (left settings, right profile) | Console positions at `x = ±2.35` (v3.0, was ±3.5) | Crystal `#00BBFF` → chrome alloy `#a8b5c8` |
| Center shards | Letters' body centers | `HolographicHUD` concentric rings | Ring positions `r = 1.2, 2.2, 3.2` | Crystal `#00BBFF` → active lab color |
| Bottom-center shards | Lower letter bodies | `StatusBar3D` gauge strip | Bottom bar positions `y = -2.0` | Crystal `#00BBFF` → gauge colors (varied) |
| Edge shards | Letter bevel/outline edges | `LEDRim` arc | Top arc path following bezel curve | Crystal `#00BBFF` → LED `#00BBFF` |
| Remaining micro-particles | Dust/debris field | `AuroraBackground` + `AmbientParticles` | Distributed void positions | Crystal `#00BBFF` → aurora tints (varied) |

**Spline Path System:**

Each shard follows a unique spline path defined in `heroSplines.ts`. Paths are NOT linear — they follow spiral and arc trajectories with per-shard randomized control points:

```typescript
// src/lib/3d/heroSplines.ts — API
export function generateShardSpline(
  startPos: THREE.Vector3,      // shard's current position post-explosion
  targetPos: THREE.Vector3,     // cockpit component target position
  seed: number                  // per-shard random seed
): THREE.CubicBezierCurve3 {
  const rng = seededRandom(seed);

  // Control points create spiral/arc trajectories
  const cp1 = new THREE.Vector3(
    startPos.x + (rng() - 0.5) * 4.0,
    startPos.y + rng() * 3.0,
    startPos.z + (rng() - 0.5) * 4.0
  );
  const cp2 = new THREE.Vector3(
    targetPos.x + (rng() - 0.5) * 2.0,
    targetPos.y + (rng() - 0.5) * 2.0,
    targetPos.z + (rng() - 0.5) * 1.0
  );

  return new THREE.CubicBezierCurve3(startPos, cp1, cp2, targetPos);
}
```

- Path duration per shard: 1.5s – 2.5s (staggered start times, all arrivals complete by `t=14.0s`)
- Stagger distribution: `t_start = 12.5 + random() * 0.5` (all start within a 0.5s window)
- Easing: `power2.inOut` (slow departure, fast middle, slow arrival)

**Arrival Morphing:**

As each shard arrives at its target position, it undergoes a morph sequence:

1. **Scale:** Shard dimensions morph to match target panel geometry (vertex interpolation over 0.3s)
2. **Material crossfade:** `MeshPhysicalMaterial` (crystal) transitions to target material (chrome `MeshStandardMaterial`, emissive glass, or LED material) via uniform lerp in a custom shader:

```glsl
// Material crossfade in fragment shader
uniform float uMorphProgress; // 0.0 = crystal, 1.0 = target
vec3 finalColor = mix(crystalColor, targetColor, smoothstep(0.0, 1.0, uMorphProgress));
float finalMetalness = mix(0.1, targetMetalness, uMorphProgress);
float finalRoughness = mix(0.05, targetRoughness, uMorphProgress);
```

3. **Flatten:** 3D shard depth compresses to match panel thickness (scale.z: shard depth → panel depth)

**Camera:**

| Property | Value | Animation |
|----------|-------|-----------|
| Position | Current → `[0, 0, 5.0]` | Slow dolly to cockpit default viewpoint |
| FOV | 53° → 56° | Transition to CockpitCanvas default FOV (per CPA v2.0) |
| Easing | Spring | Constant 300, damping 25 |
| Look-at | `[0, 0, 0]` | Static |

**Audio (Tone.js):**

```typescript
// Phase 6 audio cues
const regroupAudio = {
  // Shards decelerating — filtered metallic resonance
  decel: new Tone.MetalSynth({
    frequency: 400,
    resonance: 4000,
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 4000, Q: 2 })
  ), // frequency sweeps 4kHz → 200Hz over 1s

  // Migration whoosh — spatialized per-shard (aggregated)
  migrationDrone: new Tone.Noise('pink').connect(
    new Tone.Panner3D({ panningModel: 'HRTF' })
  ).connect(
    new Tone.Gain(-24) // quiet, cumulative feel
  ),

  // Cockpit hum begins
  cockpitHum: new Tone.Oscillator({
    type: 'sine',
    frequency: 55, // A1 — low foundational drone
  }).connect(
    new Tone.Gain(-20) // starts at -20dB, rises to -12dB by phase end
  ),
};
```

**Triangle Budget:** ~50,000 (shards still individual mesh instances) → transitioning to cockpit geometry (~30M+ triangles post D3D-3 upgrade; originally ~104,400 per CPA v2.0 specification) as shards merge into panels. The transition is not a pop — individual shard meshes are disposed as they complete their morph into the cockpit `BufferGeometry`, which is progressively revealed.
## Section 7: Phase 7 — Cockpit Materialization (14–17s)

**Visual:**
- Shards have settled — cockpit HUD geometry is now ~80% formed from merged shards
- Remaining gaps fill with energy traces — electric blue #00FFFF lines connecting shard-panels
  - Line geometry with animated dash offset (THREE.LineDashedMaterial, dashSize 0.05, gapSize 0.1, animated offset)
- Each cockpit component "powers on" sequentially with 400ms stagger:

| Order | Component | Power-On Effect | Timing |
|-------|-----------|----------------|--------|
| 1 | AuroraBackground | Shards dissolve into void gradient, aurora waves begin | 14.0–14.5s |
| 2 | LEDRim | Shards along rim path ignite with lab-color glow, rim sweeps on | 14.4–14.9s |
| 3 | CockpitPanels | Hex sub-panels crystallize from shard clusters, chrome PBR activates | 14.8–15.5s |
| 4 | SidePanels | Left radar sweep animation starts, right terminal text scrolls in | 15.2–15.8s |
| 5 | HolographicHUD | Center shards form concentric rings, rings begin rotation | 15.6–16.3s |
| 6 | StatusBar3D | Bottom gauge strip materializes, gauges animate to initial values | 16.0–16.6s |

- Scanline overlay fades in at 50% through phase (t=15.5s): CSS `.scanline-overlay` opacity 0→1 over 0.5s
- Chrome bezel border completes — PBR reflections activate using `frost-prismatic.hdr`
- Energy trace lines dissolve as solid geometry takes their place (alpha 1→0 over 0.3s per component)

**Camera:**
- Settled at final cockpit position `[0, 0.65, 1.1]` (v3.0 tight-focus seat), FOV 58° (final CockpitCanvas default)
- Subtle breathe motion begins: sinusoidal Y offset ±0.05 at 0.15Hz (persistent in live app)

**Audio:**
- Sequential boot sounds per component (each a unique Tone.js synth hit):
  1. Aurora: soft pad swell (`Tone.PolySynth`, Am7)
  2. LED: electric buzz snap (filtered square wave burst)
  3. Panels: metallic clunk (noise burst + lowpass)
  4. SidePanels: digital chirp sequence (FM synth, rapid arpeggio)
  5. HUD: harmonic ring (sine harmonics C5–G5–C6)
  6. StatusBar: gauge click-click-click (granular noise, 3 hits at 100ms intervals)
- Ambient cockpit hum reaches full volume (−6dB) — this is the persistent soundscape

**Triangle Budget:** Transitioning from shard geometry to final cockpit geometry (30M+ post D3D-3 upgrade; originally 104,400 per CPA v2.0 Section 11.1)

**GSAP Timeline Label:** `"materialize"`

---

## Section 8: Phase 8 — Station Online (17–19s)

**Visual:**
- All cockpit components are now indistinguishable from the live StationFrame/CockpitCanvas
- Final bloom pulse — "station online" energy wave:
  - Bloom intensity spikes from 0.3 → 1.2 → 0.3 over 0.8s
  - Radial wave effect: ring geometry expanding from center (scale 0→5, alpha 1→0, emissive `#00BBFF`)
- Overlay fades to transparent over 0.5s (any remaining animation-specific overlays)
- **CRITICAL: Seamless handoff** — the R3F Canvas running the animation IS the same Canvas that becomes the persistent CockpitCanvas
  - No canvas swap, no fade-to-black, no DOM remount
  - The animation's final frame IS the app's first frame
  - HeroAnimation component simply stops updating GSAP timeline — cockpit components continue their normal reactive behavior
  - `onComplete()` callback fires → dashboard route renders HTML content on top of the live cockpit (z-index 20)
- Dashboard content (sidebar, TopBar, home page cards) fades in over the live cockpit:
  - Staggered opacity 0→1: sidebar (0.3s), TopBar (0.3s, +100ms delay), main content (0.5s, +200ms delay)
  - Motion entrance animations per CLAUDE.md animation system

**Camera:**
- Final position locked: `[0, 0.65, 1.1]` (v3.0 tight-focus seat), FOV 58°
- Breathe motion continues seamlessly into live CockpitCanvas camera behavior
- CinematicCamera component from CPA v2.0 takes over control

**Audio:**
- "Station online" sound: synthesized power-up tone (ascending FM sweep C3→C5, 0.5s)
- Transition to persistent cockpit ambient soundscape (CockpitAudioEngine from CPA v2.0 Section 10)
- Volume crossfade: hero audio → cockpit audio over 1s

**Triangle Budget:** Final state = cockpit grand total: ~30M+ (post D3D-3 upgrade; originally 104,400 per CPA v2.0)

**GSAP Timeline Label:** `"online"`

---

## Section 9: GPI PARTICLE SYSTEM — 1,000,000,000+ ENHANCEMENTS

### 9.1 WebGPU Compute Pipeline Architecture (1B+ Multi-Buffer Striped)

```
┌───────────────────────────────────────────────────────────────────┐
│              GPU COMPUTE PIPELINE — 1B+ MULTI-STRIPE              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  STRIPE 0          STRIPE 1          STRIPE 2   STRIPE 3│     │
│  │  ┌─────────┐      ┌─────────┐      ┌─────────┐ ┌──────┐│     │
│  │  │ 2.5M    │      │ 2.5M    │      │ 2.5M    │ │ 2.5M ││     │
│  │  │ Particles│      │ Particles│      │ Particles│ │ Part.││     │
│  │  │ 48B each│      │ 48B each│      │ 48B each│ │48B ea││     │
│  │  │ ×2 bufs │      │ ×2 bufs │      │ ×2 bufs │ │×2 buf││     │
│  │  └────┬────┘      └────┬────┘      └────┬────┘ └──┬───┘│     │
│  └───────┼────────────────┼────────────────┼──────────┼────┘     │
│          ▼                ▼                ▼          ▼           │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              TSL Compute Kernel (Fn())                    │     │
│  │  • Phase-dependent physics (8 behaviors)                  │     │
│  │  • Per-stripe dispatch: ceil(2.5M / 256) workgroups       │     │
│  │  • Atomic free-list for particle recycling                │     │
│  │  • Frustum culling flags (skip in render pass)            │     │
│  │  • Color lerp per animation phase                         │     │
│  └──────────────────────┬───────────────────────────────────┘     │
│                          ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              TSL Render Material                           │     │
│  │  • Instanced billboard quads (4 verts × 10M instances)    │     │
│  │  • SDF soft-circle + glow halo + trail fade               │     │
│  │  • Additive blending (src: ONE, dst: ONE)                 │     │
│  │  • Frustum-culled particles skipped (visible count flag)  │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│  TOTAL: 4 stripes × 2.5M × 48B × 2 (ping-pong) = ~960MB peak    │
│  (High-end only — mid-range uses 2 stripes, low-end uses 1)      │
└───────────────────────────────────────────────────────────────────┘
```

### 9.2 Particle Data Structure (TSL — Three Shader Language)

TSL replaces raw WGSL/GLSL with a JavaScript-based shader authoring system that compiles to both WGSL (WebGPU) and GLSL (WebGL2) at runtime. This is mandatory since Three.js r171+ `WebGPURenderer` does not support `ShaderMaterial` or `RawShaderMaterial`.

```typescript
// src/lib/3d/heroParticleCompute.ts — TSL Compute Kernel
import {
  Fn, float, vec3, vec4, instanceIndex, storage,
  instancedArray, uniform, time, deltaTime,
  If, select, Loop, Break,
} from 'three/tsl';

const PARTICLES_PER_STRIPE = 2_500_000;

// Per-stripe storage buffers (TSL instancedArray — lives on GPU permanently)
export function createParticleStripe() {
  return {
    positionsA: instancedArray(PARTICLES_PER_STRIPE, 'vec3'),  // ping
    positionsB: instancedArray(PARTICLES_PER_STRIPE, 'vec3'),  // pong
    velocities: instancedArray(PARTICLES_PER_STRIPE, 'vec3'),
    colors:     instancedArray(PARTICLES_PER_STRIPE, 'vec4'),
    lives:      instancedArray(PARTICLES_PER_STRIPE, 'float'),
    sizes:      instancedArray(PARTICLES_PER_STRIPE, 'float'),
  };
}

// Uniform params (shared across all stripes)
const phaseUniform       = uniform(0);        // Current animation phase (0-7)
const gravityUniform     = uniform(vec3(0, -2, 0));
const convergencePoint   = uniform(vec3(0, 0, 0));
const shatterOrigin      = uniform(vec3(0, 0, 0));
const dragUniform        = uniform(0.02);
const turbulenceUniform  = uniform(0.5);

// TSL compute kernel — dispatched per stripe
export const simulateParticles = Fn(({ positions, velocities, colors, lives, sizes }) => {
  const idx = instanceIndex;
  const pos = positions.element(idx);
  const vel = velocities.element(idx);
  const life = lives.element(idx);

  // Phase-dependent behavior (switch via select/If chains)
  // Phase 0: Brownian drift
  // Phase 1: Converge to logo vertices (lerp toward convergencePoint)
  // Phase 2: Orbit logo edges
  // Phase 3: Energy surge vibration
  // Phase 4: Explosive outward + shards
  // Phase 5: Spline paths to cockpit positions
  // Phase 6: Settle into cockpit geometry
  // Phase 7: Transition to ambient particles

  // Universal: life decay, drag, position update
  life.subAssign(deltaTime.mul(0.1));
  vel.mulAssign(float(1).sub(dragUniform.mul(deltaTime)));
  pos.addAssign(vel.mul(deltaTime));

  // Recycle dead particles (life <= 0 → respawn at random position)
  // Uses atomic free-list for lock-free recycling across workgroups
});
```

**Why TSL instead of raw WGSL?**
1. **Cross-renderer:** Same code runs on WebGPU (compiles to WGSL) and WebGL2 (compiles to GLSL)
2. **No custom material porting:** `WebGPURenderer` rejects `ShaderMaterial` — TSL node materials are required
3. **Ecosystem integration:** TSL `instancedArray` works directly with R3F's `<instancedMesh>` and `<points>`
4. **Hot-reload:** TSL shaders recompile on HMR during development (Turbopack compatible)

### 9.3 Particle Budget Per Phase

| Phase | Name | Peak Simultaneous (WebGPU High) | Peak (WebGPU Mid) | Peak (WebGL2 Desktop) | Lifetime Spawns |
|-------|------|-------------------------------:|------------------:|----------------------:|----------------:|
| 1 | Void Awakening | 1,000,000 | 500,000 | 100,000 | 1,000,000 |
| 2 | Storm Assembly | 10,000,000 | 5,000,000 | 500,000 | 200,000,000 |
| 3 | Logo Showcase | 1,000,000 | 500,000 | 50,000 | 20,000,000 |
| 4 | Electricity Surge | 3,000,000 | 1,000,000 | 100,000 | 60,000,000 |
| 5 | Catastrophic Shatter | 10,000,000 | 5,000,000 | 500,000 | 250,000,000 |
| 6 | Shard Drift | 5,000,000 | 2,000,000 | 200,000 | 150,000,000 |
| 7 | Materialization | 3,000,000 | 1,000,000 | 100,000 | 200,000,000 |
| 8 | Station Online | 500,000 | 200,000 | 20,000 | 120,000,000 |
| **TOTAL** | | **10M peak** | **5M peak** | **500K peak** | **1,001,000,000+** |

### 9.4 Triangle Budget Integration with CPA v2.0

The hero animation's triangle budget relates to and transitions into the cockpit's budget as follows:

| Animation Phase | Hero Tris | Cockpit Tris | Total | Within Device Budget? |
|----------------|----------:|-------------:|------:|:---------------------:|
| Phases 1–4 (logo) | ~20,000 | 0 | 20,000 | Yes (30M system budget) |
| Phase 5 (shatter) | ~100,000 | 0 | 100,000 | Yes (upgraded: 100K Voronoi shards) |
| Phase 6 (transition) | ~100,000 → 0 | 0 → ~30M | 100K–30M | Yes (progressive reveal) |
| Phase 7 (cockpit) | 0 | ~30M | ~30M | Yes (30M system budget) |
| Phase 8 (live) | 0 | ~30M | ~30M | Yes (20M game headroom) |

> **Note:** Particle quads are NOT counted in the triangle budget — they use instanced rendering with a separate GPU budget.

### 9.5 Memory Management

```typescript
// Particle buffer lifecycle
class HeroParticleSystem {
  private particleBufferA: GPUBuffer;  // Read
  private particleBufferB: GPUBuffer;  // Write (ping-pong)
  private computePipeline: GPUComputePipeline;
  private renderPipeline: GPURenderPipeline;

  // Allocate on animation start, release on Phase 8 complete
  async initialize(device: GPUDevice, maxParticles: number): Promise<void>;

  // Per-frame: dispatch compute, swap buffers, render
  update(phase: number, deltaTime: number): void;

  // Phase 8: transfer remaining particles to AmbientParticles system
  async handoff(ambientSystem: AmbientParticleSystem): Promise<void>;

  // Release GPU resources
  dispose(): void;
}
```

---

## Section 10: TECH STACK REQUIREMENTS

### 10.1 New & Upgraded Dependencies

| Package | Version | Purpose | Install Command | Upgrade? |
|---------|---------|---------|----------------|:--------:|
| `three` | **>=0.171.0** | WebGPU production-ready with `import * from 'three/webgpu'` + TSL from `'three/tsl'` | `npm install three@latest` | **YES** — r171+ required for TSL + WebGPU zero-config |
| `@react-three/fiber` | **>=9.0.0** | R3F v9 with async `gl` prop for `WebGPURenderer` initialization | `npm install @react-three/fiber@latest` | **YES** — v9 required for async gl |
| `@react-three/drei` | **>=9.120.0** | Helpers compatible with R3F v9 + WebGPU renderer | `npm install @react-three/drei@latest` | **YES** — must match R3F v9 |
| `three-bvh-csg` | >=0.0.16 | Voronoi fracture mesh operations | `npm install three-bvh-csg` | NEW |
| `three-mesh-bvh` | >=0.8.0 | BVH acceleration for shard collision | `npm install three-mesh-bvh` | NEW |
| `troika-three-text` | >=0.52.0 | High-quality 3D text geometry (SDF-based) | `npm install troika-three-text` | NEW |
| `gsap` | >=3.12 | Timeline orchestration | Already installed (Stage 1) | No |
| `tone` | >=15.0 | Audio synthesis | Already installed (Stage 1) | No |

**Critical Upgrade Notes:**
- Three.js r171+ introduces `import * as THREE from 'three/webgpu'` for zero-config WebGPU with automatic WebGL2 fallback
- TSL (Three Shader Language) imports from `'three/tsl'` — replaces all raw WGSL/GLSL shader authoring
- R3F v9's `Canvas` accepts an async `gl` prop (required because `WebGPURenderer.init()` is async)
- **IMPORTANT:** `ShaderMaterial`, `RawShaderMaterial`, and `onBeforeCompile()` are NOT supported in `WebGPURenderer`. All custom materials must be ported to TSL node materials.

### 10.2 WebGPU Browser Requirements (Updated March 2026)

| Browser | WebGPU Status | Coverage | Fallback |
|---------|--------------|:--------:|----------|
| Chrome 113+ | Shipped (stable) | ~65% | — |
| Edge 113+ | Shipped (stable) | ~5% | — |
| Safari 26+ (macOS/iOS/iPadOS/visionOS) | **Shipped (stable)** | ~20% | — |
| Firefox | Behind flag (Nightly) | ~5% | WebGL2 (TSL auto-compiles to GLSL) |
| Android Chrome | Native WebGPU on modern devices | ~3% | WebGL2 |
| Legacy browsers | N/A | ~2% | CSS fallback (12-15 particles) |
| **Total WebGPU coverage** | | **~95%** | |

Detection is handled by `webgpuDetection.ts` (Stage 1 Part 2, updated per OD-4). Since Safari 26 (September 2025) shipped WebGPU by default, the last major holdout has fallen.

### 10.3 Three.js WebGPU Renderer Integration (R3F v9)

```typescript
// In CockpitCanvas.tsx — R3F v9 async gl prop for WebGPU
import { Canvas, extend } from '@react-three/fiber';
import * as THREE from 'three/webgpu';

// Register three/webgpu elements with R3F v9
extend(THREE);

// WebGPU renderer factory — async gl prop (R3F v9 feature)
const createWebGPURenderer = async (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  // CRITICAL: WebGPU init is async — must await before rendering
  // Without this, scene renders nothing with no error message
  await renderer.init();
  return renderer;
};

// R3F v9 Canvas with async gl prop
<Canvas
  gl={createWebGPURenderer}
  // WebGPURenderer auto-falls back to WebGL2 if WebGPU unavailable
  // TSL shaders auto-compile to GLSL in WebGL2 mode
/>
```

### 10.4 TSL Migration Impact

The following existing files in the SparkForge codebase use `ShaderMaterial` or raw GLSL and **must be migrated to TSL** when `WebGPURenderer` becomes the primary renderer:

| File | Current Approach | TSL Migration |
|------|-----------------|---------------|
| `src/shaders/labPattern*.glsl` (10 files) | Raw GLSL lab pattern shaders | Convert to TSL `Fn()` + `nodeFrame` |
| `src/components/3d/AuroraBackground.tsx` | Shader-based aurora with GLSL | Convert to TSL node material |
| `src/components/3d/AmbientParticles.tsx` | Custom shader for particles | Convert to TSL `instancedArray` + compute |
| `src/components/3d/LEDRimLight.tsx` | Emissive shader | Convert to TSL `MeshStandardNodeMaterial` |
| `src/components/3d/CrystalShatter.tsx` | MeshPhysicalMaterial (compatible) | No change needed — standard materials work |
| `src/components/3d/StationFrame.tsx` | MeshStandardMaterial (compatible) | No change needed — standard materials work |

**Note:** Standard Three.js materials (`MeshStandardMaterial`, `MeshPhysicalMaterial`, etc.) work unchanged in `WebGPURenderer`. Only custom `ShaderMaterial` / `RawShaderMaterial` require TSL migration.

---

## Section 11: STAGE DOCUMENT IMPACT MATRIX

### 11.1 Directly Modified Stage Documents

| Stage Doc | Section Modified | Change Description | Severity |
|-----------|-----------------|-------------------|----------|
| **STAGE1_Foundation_v2_PART2** | Step 16 (webgpuDetection.ts) | Add `gpuTier` detection logic per OD-4 | MEDIUM |
| **STAGE1_Foundation_v2_PART2** | Step 14 (deviceStore.ts) | Add `gpuTier: 'webgpu' \| 'webgl2' \| 'css'` field | MEDIUM |
| **STAGE1_Foundation_v2_PART2** | Step 12 (uiStore.ts) | Add `skipIntroAnimation: boolean` per OD-3 | LOW |
| **STAGE1_Foundation_v2_PART1** | Step 3 (directory structure) | Add `src/shaders/` entries for new WGSL/GLSL files | LOW |
| **STAGE1_Foundation_v2_PART1** | Step 2 (npm installs) | Add `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text` | LOW |
| **STAGE3_Auth_Layout_Shell_v3_PART3A** | CrystalShatter.tsx | Replace standalone crystal shatter with HeroAnimation.tsx orchestrator | HIGH |
| **STAGE3_Auth_Layout_Shell_v3_PART3B** | Landing page | Update landing page to use HeroAnimation instead of CrystalShatter directly | HIGH |
| **STAGE4_Core_Pages_v2_PART3** | Settings page | Add "Skip Intro Animation" toggle (OD-3) | LOW |

### 11.2 Indirectly Affected Stage Documents

| Stage Doc | Relationship | Impact |
|-----------|-------------|--------|
| **STAGE5_Parts23C_v3FINAL** | GameParticles3D uses same WebGPU particle system | Shared compute pipeline, consistent API |
| **STAGE6B–6F (all flagship v3FINAL)** | Flagship games render inside CockpitCanvas | No change needed — games inject via `{children}` prop |
| **STAGE7_Shared_v3FINAL_A** | GenericGameParticles CSS system | CSS fallback tier unchanged |
| **CPA v2.0** | CockpitCanvas is the shared canvas | Hero animation renders IN CockpitCanvas, no architecture change |

### 11.3 New Files Not In Any Existing Stage Doc

These files must be added to Stage 3 Part 3A (v3-FINAL) or created as a new Stage 3 Part 3C:

| File | Lines (est.) | Complexity |
|------|-------------|-----------|
| `src/components/3d/HeroAnimation.tsx` | ~400 | High — GSAP timeline, 8-phase orchestration |
| `src/lib/3d/heroParticleCompute.ts` | ~300 | High — TSL compute kernel, multi-stripe dispatch |
| `src/lib/3d/heroParticleRender.ts` | ~150 | Medium — TSL render material |
| `src/shaders/crystallineLogo.vert` | ~40 | Low |
| `src/shaders/crystallineLogo.frag` | ~120 | High — subsurface scattering |
| `src/shaders/electricVeins.frag` | ~100 | High — L-system branching |
| `src/shaders/voronoiShatter.comp` | ~150 | High — Voronoi tessellation |
| `src/lib/audio/heroAudio.ts` | ~200 | Medium — Tone.js timeline |
| `src/hooks/useHeroAnimation.ts` | ~100 | Medium |
| `src/lib/3d/heroSplines.ts` | ~150 | Medium — spline definitions |
| `src/lib/3d/voronoiFracture.ts` | ~200 | High — mesh fracturing |
| **TOTAL** | **~1,800** | |

---

## Section 12: PERFORMANCE & OPTIMIZATION

### 12.1 Frame Budget Analysis (60fps = 16.67ms per frame)

| Operation | Budget (ms) | Strategy |
|-----------|------------|----------|
| TSL compute dispatch (4 stripes) | 3–5ms | GPU-only, 4 parallel stripe dispatches overlapped with CPU work |
| Particle render (10M instances) | 5–7ms | Instanced billboards, GPU frustum-culled (~40% skipped) |
| Cockpit geometry render | 2–3ms | Static geometry, cached TSL node materials |
| Post-processing (bloom, CA, blur) | 2–3ms | Half-res bloom, quarter-res blur |
| GSAP timeline tick | <1ms | CPU, minimal overhead |
| Tone.js audio update | <1ms | Web Audio API, hardware-accelerated |
| React reconciliation | 0.5–1ms | Minimal React during animation (R3F v9 optimized) |
| **Total** | **~15ms** | **Within 16.67ms budget (high-end)** |

**Note:** Mid-range WebGPU (2 stripes, 5M particles) targets ~12ms/frame. WebGL2 fallback targets ~10ms/frame at 500K particles.

### 12.2 Optimization Strategies

1. **Particle LOD by distance:** Particles beyond camera frustum are skipped in render pass (compute still runs for physics continuity)
2. **Temporal reprojection:** Reuse 50% of particle render from previous frame during fast camera moves
3. **Geometry instancing:** All 50K shards share one `BufferGeometry` with per-instance transforms (`InstancedMesh`)
4. **Shader warmup:** Compile all shaders during Phase 1 (void) when GPU is underutilized
5. **Audio pre-scheduling:** All Tone.js events scheduled at t=0, not dynamically — eliminates scheduling jitter
6. **Texture atlas:** All particle sprites on a single 1024x1024 atlas (16 sprite types, 256x256 each)
7. **Buffer pre-allocation:** All GPU buffers allocated at animation init, never during animation
8. **Graceful degradation monitoring:** `useAdaptiveLOD()` watches FPS; if < 80% target during animation, immediately drops particle count by 50%

### 12.3 Memory Profile

| Phase | GPU Memory (High-End) | GPU Memory (Mid-Range) | CPU Memory | Notes |
|-------|----------------------|----------------------|-----------|-------|
| Init | 960MB | 480MB | 80MB | 4-stripe buffer allocation + TSL shader compile |
| Phase 1–4 | 960MB | 480MB | 40MB | Steady state, all stripes active |
| Phase 5 | 1.1GB | 560MB | 120MB | Shard geometry (100K) + Voronoi cache |
| Phase 6–7 | 960MB → 240MB | 480MB → 120MB | 80MB → 30MB | Stripe disposal + cockpit geometry load |
| Phase 8+ | 120MB | 120MB | 20MB | Cockpit steady state (all hero buffers released) |

---

## Section 13: ACCESSIBILITY & SKIP BEHAVIOR

### 13.1 Skip Mechanisms (per OD-2 and OD-3)

| Mechanism | Trigger | Behavior |
|-----------|---------|----------|
| Fast-forward | Click/tap anywhere during animation | GSAP `timeScale` 1x → 4x, completes in ~0.5s |
| Keyboard fast-forward | Enter or Space key | Same as click — 4x timeScale |
| Skip setting | `skipIntroAnimation: true` in uiStore | Instant render of Phase 8 final state (0ms animation) |
| First visit override | `isFirstVisit` flag | Full animation plays even if `skipIntroAnimation` is true |
| Reduced motion | `prefers-reduced-motion` media query | Skip to Phase 8 immediately (accessibility) |

### 13.2 Screen Reader Announcements

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

### 13.3 Motion Sensitivity

- `prefers-reduced-motion: reduce` → Skip entire animation, render cockpit immediately
- Particles disabled, camera fixed, no bloom pulses
- All audio still plays (audio is not motion)

### 13.4 Keyboard Navigation During Animation

| Key | Action |
|-----|--------|
| Enter / Space | Fast-forward (4x) |
| Escape | Skip to final state immediately |
| Tab | Focus skip button (visible on keyboard focus) |

### 13.5 Visual Skip Button

A semi-transparent "Skip Intro" button appears in the bottom-right corner after 2s of animation:
- Only visible on keyboard focus or mouse hover in bottom-right quadrant
- Click/tap → immediate skip to Phase 8
- Styled: glassmorphic pill, Sora font, 12px, opacity 0.6

---

## APPENDIX A: GSAP TIMELINE STRUCTURE

```typescript
// Complete timeline with labels for scrubbing (OD-2)
const timeline = gsap.timeline({
  paused: true,
  onComplete: () => onComplete(),
});

timeline
  .addLabel("void", 0)
  .addLabel("assembly", 2)
  .addLabel("showcase", 4.5)
  .addLabel("surge", 7.5)
  .addLabel("shatter", 10)
  .addLabel("regroup", 11.5)
  .addLabel("materialize", 14)
  .addLabel("online", 17);

// Fast-forward handler (OD-2)
const handleSkip = () => {
  timeline.timeScale(4);
};

// Full skip handler (OD-3 / reduced motion)
const handleFullSkip = () => {
  timeline.progress(1);
  timeline.kill();
  onComplete();
};
```

## APPENDIX B: CROSS-REFERENCE TO EXISTING DOCUMENTS

| Document | Sections Referenced | Purpose |
|----------|-------------------|---------|
| CLAUDE.md v5.3 | Section 9 (3D Architecture), Section 9.1 (LOD), Section 14 (Stores) | Architecture rules, LOD budgets, store shapes |
| CPA v2.0 | Section 2 (Architecture), Section 7 (Transitions), Section 11 (Performance) | Cockpit geometry, canvas structure, triangle budgets |
| Open_Design_Decisions_Resolved.md | OD-1 through OD-4 | All four locked decisions integrated |
| STAGE3_Auth_Layout_Shell_v3_PART3A | CrystalShatter.tsx, StationFrame.tsx | Original shatter implementation (to be extended) |
| STAGE3_Auth_Layout_Shell_v3_PART3B | Landing page, scanline overlay | Landing page integration point |
| STAGE1_Foundation_v2_PART2 | webgpuDetection.ts, deviceStore, uiStore | WebGPU detection, store shapes |
| KNOWN_COMPAT_NOTES.md | Three.js r170+, Motion imports | Version-sensitive dependencies |

---

---

## Section 14: TECH STACK UPGRADE SUMMARY

### Packages Requiring Version Upgrade

| Package | Current (Stage 1) | Required | Reason |
|---------|-------------------|----------|--------|
| `three` | >=0.170.0 | **>=0.171.0** | WebGPU production-ready, TSL from `'three/tsl'`, `'three/webgpu'` imports |
| `@react-three/fiber` | >=8.17 | **>=9.0.0** | Async `gl` prop for `WebGPURenderer`, `extend(THREE)` for WebGPU elements |
| `@react-three/drei` | >=9.88 | **>=9.120.0** | R3F v9 compatibility |

### New Packages to Install

```bash
npm install three-bvh-csg three-mesh-bvh troika-three-text
```

### Stage Documents Requiring Modification for Upgrades

| Stage Doc | Change | Why |
|-----------|--------|-----|
| **STAGE1_Foundation_v2_PART1** Step 2 | Update Three.js to r171+, R3F to v9, drei to latest | WebGPU + TSL + async gl |
| **STAGE1_Foundation_v2_PART1** Step 2 | Add `three-bvh-csg`, `three-mesh-bvh`, `troika-three-text` to install commands | New deps for hero animation |
| **STAGE1_Foundation_v2_PART2** Step 20 (cockpitAtoms) | Update `rendererTypeAtom` to detect via `navigator.gpu` + adapter probing | OD-4 gpuTier detection |
| **STAGE1_Foundation_v2_PART2** Step 22 (webgpuDetection) | Add multi-buffer capability probing (`maxStorageBufferBindingSize`) and stripe count calculation | 1B+ multi-stripe budget |
| **STAGE3_Auth_Layout_Shell_v3_PART3A** | CrystalShatter.tsx → HeroAnimation.tsx (8-phase orchestrator) | Core hero animation replacement |
| **STAGE3_Auth_Layout_Shell_v3_PART3B** | Landing page uses `<HeroAnimation>` instead of `<CrystalShatter>` | Landing page integration |
| **STAGE4_Core_Pages_v2_PART3** | Settings page adds "Skip Intro Animation" toggle | OD-3 integration |
| **STAGE5_Parts23C_v3FINAL** | GameParticles3D adopts shared TSL compute particle API | Consistent particle system |
| **CPA v2.0** (reference) | CockpitCanvas uses R3F v9 async `gl` prop | WebGPU renderer init |
| **KNOWN_COMPAT_NOTES.md** | Add Three.js r171+/TSL migration notes, R3F v9 async gl notes | Version-sensitive guidance |

---

*End of SparkForge Hero Page Animation v2.0*
*11 new files | 8 animation phases | 19 seconds | 1,000,000,000+ lifetime particles | WebGPU + TSL primary / WebGL2 fallback / CSS minimal*
*Integrates: OD-1 (audio default), OD-2 (fast-forward scrub), OD-3 (skip toggle), OD-4 (WebGPU compute)*
*Tech stack upgrades: Three.js r171+ / R3F v9 / TSL (Three Shader Language) / Multi-buffer striped particle architecture*
*March 16, 2026*

---

## REFERENCES

- [Three.js WebGPU Migration Guide (2026)](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [Interactive Galaxy with WebGPU Compute Shaders](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [TSL Field Guide — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [GPGPU Particles with TSL & WebGPU — Wawa Sensei](https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu)
- [R3F v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- [WebGPU Buffer Size Limits — gpuweb/gpuweb#1371](https://github.com/gpuweb/gpuweb/issues/1371)
- [WebGPU Optional Features and Limits](https://webgpufundamentals.org/webgpu/lessons/webgpu-limits-and-features.html)
- [WebGPU 2.0 Performance in Chrome 2025](https://markaicode.com/webgpu-2-chrome-2025-performance/)
