# HERO ANIMATION — v3-FINAL (PART A)

## Stores, Infrastructure & Shaders

**Date:** March 20, 2026 | **Phase:** 5A (after Stage 3 Part 3, before Cockpit CPA2)
**Reference Specs:** `docs/00-reference/SparkForge_Hero_Page_Animation_v2.0.md`, `docs/00-reference/Implementation_Plan_Hero_Page_Animation_v2.0.md`
**Decision References:** OD-1 (Audio Default), OD-2 (Fast-Forward Scrub), OD-3 (Skip Intro Toggle), OD-4 (WebGPU Compute Shaders)
**Supersedes:** `CrystalShatter.tsx` (archived to `src/components/3d/_SUPERSEDED/`)

---

## Overview

Part A establishes the infrastructure for the 8-phase cinematic hero animation. This includes store updates (uiStore + deviceStore), GPU detection, all shader files, and CPU-side 3D utilities. No visual output yet — that comes in Part B.

### Prerequisites
- Stage 3 Part 3A/B complete (StationFrame shell, CrystalShatter exists)
- Three.js v0.183.2+, R3F v9.5.0+, drei v10.7.7+, GSAP v3.14.2+, Tone.js v15.1.22+ (all installed in Stage 1)

### Files Created/Modified

| # | File | Action | Lines |
|---|------|--------|-------|
| 1 | `src/stores/uiStore.ts` | Modified (+skipIntroAnimation) | ~8 added |
| 2 | `src/stores/deviceStore.ts` | Modified (+GPUTier, +gpuTier, +stripeCount) | ~20 added |
| 3 | `src/lib/webgpuDetection.ts` | Created | ~177 |
| 4 | `src/shaders/crystallineLogo.vert` | Created | ~54 |
| 5 | `src/shaders/crystallineLogo.frag` | Created | ~175 |
| 6 | `src/shaders/electricVeins.frag` | Created | ~142 |
| 7 | `src/shaders/voronoiShatter.comp` | Created | ~185 |
| 8 | `src/lib/3d/voronoiFracture.ts` | Created | ~308 |
| 9 | `src/lib/3d/heroSplines.ts` | Created | ~203 |

### Packages to Install

```bash
npm install three-bvh-csg three-mesh-bvh troika-three-text
```

---

## Step 1: Update `src/stores/uiStore.ts`

**Purpose:** Add `skipIntroAnimation` per OD-3 (Skip Intro Toggle)

Add to `UIState` interface (after `particleIntensity`):
```typescript
/** Per-child setting: skip the hero intro animation on page load.
 *  Default: false. Toggled in Settings page (Stage 4 Part 3).
 *  When true, HeroAnimation renders Phase 8 final state immediately. */
skipIntroAnimation: boolean;
setSkipIntroAnimation: (skip: boolean) => void;
```

Add to store creation:
```typescript
skipIntroAnimation: false,
setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
```

**Status:** ✅ Already implemented in current codebase (`uiStore.ts` lines 14-17, 45, 48)

---

## Step 2: Update `src/stores/deviceStore.ts`

**Purpose:** Add `GPUTier` type, `gpuTier` and `stripeCount` fields per OD-4

Add type export (after `LODLevel`):
```typescript
// ■■ GPU Rendering Tier ■■
// Detected at runtime by webgpuDetection.ts
// Determines particle budget and rendering pipeline for hero animation
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2' | 'css';
```

Add to `DeviceState` interface:
```typescript
gpuTier: GPUTier;
stripeCount: number;
setGpuTier: (tier: GPUTier, stripes?: number) => void;
```

Add to store creation:
```typescript
gpuTier: 'webgl2' as GPUTier,
stripeCount: 0,
setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),
```

Update `partialize` to persist:
```typescript
partialize: (state) => ({
  deviceType: state.deviceType,
  hasSelected: state.hasSelected,
  gpuTier: state.gpuTier,
  stripeCount: state.stripeCount,
}),
```

**Status:** ✅ Already implemented in current codebase (`deviceStore.ts` lines 20-23)

---

## Step 3: Create `src/lib/webgpuDetection.ts`

**Purpose:** Runtime GPU tier detection with `maxStorageBufferBindingSize` probing per OD-4
**Lines:** ~177

Detects GPU rendering tier:
1. Probe `navigator.gpu` → adapter → device
2. `maxStorageBufferBindingSize >= 256MB` → `webgpu-high` (4 stripes)
3. `maxStorageBufferBindingSize >= 128MB` → `webgpu-mid` (2 stripes)
4. WebGPU available but low limits → `webgpu-low` (1 stripe)
5. WebGL2 context available → `webgl2` (0 stripes)
6. Nothing → `css` (0 stripes)

**Exports:**
```typescript
export interface GPUDetectionResult {
  tier: GPUTier;
  stripeCount: number;
  maxBufferSize: number;
  maxComputeWorkgroups: number;
}

export async function detectGPUTier(): Promise<GPUDetectionResult>;
```

**Integration:** Called from root layout or `HeroAnimation` on first mount. Result stored via `useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount)`.

**Status:** ✅ Already implemented (`src/lib/webgpuDetection.ts`, 177 lines)

---

## Step 4: Create `src/shaders/crystallineLogo.vert`

**Purpose:** WebGL2 fallback vertex shader for extruded 3D "SparkForge" text geometry
**Lines:** ~54

Features:
- Per-vertex facet displacement via hash function
- Animated breathing via `uTime` uniform
- Bevel edge normal perturbation
- UV generation for fragment shader

**Status:** ✅ Already implemented (`src/shaders/crystallineLogo.vert`, 54 lines)

---

## Step 5: Create `src/shaders/crystallineLogo.frag`

**Purpose:** Fragment shader with PBR specular, SSS approximation, IOR refraction, clearcoat
**Lines:** ~175

Material properties:
```
transmission: 0.9, thickness: 0.5, ior: 1.5,
clearcoat: 1.0, clearcoatRoughness: 0.05,
roughness: 0.05, metalness: 0.1,
envMapIntensity: 1.2, emissive: #00BBFF
```

**Status:** ✅ Already implemented (`src/shaders/crystallineLogo.frag`, 175 lines)

---

## Step 6: Create `src/shaders/electricVeins.frag`

**Purpose:** L-system fractal branching shader for Phase 4 (Electricity Surge)
**Lines:** ~142

Features:
- 6-octave Perlin-displaced fractal branching
- Propagation wave animation
- Color ramp: white-hot → cyan → electric blue (`#00FFFF`)
- `uIntensity` ramps 0→1 over Phase 4 duration (2.5s)

**Status:** ✅ Already implemented (`src/shaders/electricVeins.frag`, 142 lines)

---

## Step 7: Create `src/shaders/voronoiShatter.comp`

**Purpose:** WGSL compute shader for Voronoi fracture cell generation (Phase 5 pre-computation)
**Lines:** ~185

Features:
- GPU-accelerated Voronoi nearest-neighbor classification
- Workgroup shared memory optimization (256 threads)
- Halton quasi-random seed generation
- Shard counts: 100K (webgpu-high) → 8 (css)

**Status:** ✅ Already implemented (`src/shaders/voronoiShatter.comp`, 185 lines)

---

## Step 8: Create `src/lib/3d/voronoiFracture.ts`

**Purpose:** CPU-side Voronoi tessellation (Bowyer-Watson) for WebGL2/CSS fallback
**Lines:** ~308

**Exports:**
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
```

Pre-computed at mount time (not per-frame). Cached in `useRef`.

**Status:** ✅ Already implemented (`src/lib/3d/voronoiFracture.ts`, 308 lines)

---

## Step 9: Create `src/lib/3d/heroSplines.ts`

**Purpose:** Spline path definitions for Phase 6 shard migration to cockpit positions
**Lines:** ~203

**Exports:**
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
```

Spline properties: 1.5–2.5s duration, staggered within 0.5s window, `power2.inOut` easing.

**Status:** ✅ Already implemented (`src/lib/3d/heroSplines.ts`, 203 lines)

---

## Validation

```bash
npx tsc --noEmit       # No TypeScript errors
npm run build          # Build passes
```

All store consumers unaffected (additive changes). GPU detection is async-safe. Shaders are file assets, not TypeScript — they're bundled via webpack raw-loader or referenced at runtime.

---

## Commit

```bash
git add -A
git commit -m "Phase 5A: Hero Animation infrastructure — stores, GPU detection, shaders, 3D utilities"
```
