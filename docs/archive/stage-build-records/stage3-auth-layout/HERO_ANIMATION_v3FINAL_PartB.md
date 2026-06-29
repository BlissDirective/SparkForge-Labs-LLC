# HERO ANIMATION — v3-FINAL (PART B)

## Particle System, Audio, Hook & Master Orchestrator

**Date:** March 20, 2026 | **Phase:** 5B (after Hero Animation Part A)
**Reference Specs:** `docs/00-reference/SparkForge_Hero_Page_Animation_v2.0.md`, `docs/00-reference/Implementation_Plan_Hero_Page_Animation_v2.0.md`
**Decision References:** OD-1 (Audio Default), OD-2 (Fast-Forward Scrub), OD-3 (Skip Intro Toggle), OD-4 (WebGPU Compute Shaders)
**Depends On:** Phase 5A (stores, shaders, GPU detection, 3D utilities)

---

## Overview

Part B creates the visual and audio components of the 8-phase hero animation: the TSL particle system (1B+ lifetime throughput), Tone.js audio timeline, animation lifecycle hook, and the master `HeroAnimation.tsx` orchestrator. After this phase, the full 19-second cinematic sequence is functional.

### Prerequisites
- Phase 5A complete (stores updated, shaders created, GPU detection working)
- All packages from 5A installed (`three-bvh-csg`, `three-mesh-bvh`, `troika-three-text`)

### Files Created

| # | File | Action | Lines |
|---|------|--------|-------|
| 1 | `src/lib/3d/heroParticleCompute.ts` | Created | ~366 |
| 2 | `src/lib/3d/heroParticleRender.ts` | Created | ~197 |
| 3 | `src/lib/audio/heroAudio.ts` | Created | ~807 |
| 4 | `src/hooks/useHeroAnimation.ts` | Created | ~189 |
| 5 | `src/components/3d/HeroAnimation.tsx` | Created | ~549 |

### Archive Action

```bash
# Archive CrystalShatter.tsx (replaced by HeroAnimation.tsx)
mkdir -p src/components/3d/_SUPERSEDED
git mv src/components/3d/CrystalShatter.tsx src/components/3d/_SUPERSEDED/CrystalShatter.tsx
```

Create `src/components/3d/_SUPERSEDED/SUPERSEDED_BY.md` documenting the archival.

**Note:** `CrystalHero.tsx` (parallax variant, Decision 8.1) is a **separate component** and is **retained**.

---

## Step 1: Create `src/lib/3d/heroParticleCompute.ts`

**Purpose:** TSL compute kernel for 8-phase particle simulation
**Lines:** ~366
**Dependencies:** Phase 5A (GPUTier from deviceStore, stripe count from webgpuDetection)

### Architecture
- Multi-buffer striped storage: 1–4 stripes × 2.5M particles × 48 bytes
- Ping-pong double buffering per stripe
- Phase-dependent physics (8 behaviors)
- Atomic free-list for lock-free particle recycling

### Phase Behaviors

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

### Key Exports
```typescript
export const PARTICLES_PER_STRIPE = 2_500_000;
export function createParticleStripe(): ParticleStripeBuffers;
export const simulateParticles: TSLComputeKernel;
export function createParticleSystem(stripeCount: number, tier: GPUTier): HeroParticleSystem;
```

### Memory Management
- `initialize(stripeCount)` — allocate all GPU buffers at animation start
- `update(phase, deltaTime)` — per-frame compute dispatch + buffer swap
- `handoff(ambientSystem)` — Phase 8 particle transfer to `AmbientParticles`
- `dispose()` — release all GPU resources after handoff

**Status:** ✅ Already implemented (`src/lib/3d/heroParticleCompute.ts`, 366 lines)

---

## Step 2: Create `src/lib/3d/heroParticleRender.ts`

**Purpose:** TSL render material for instanced particle billboard quads
**Lines:** ~197
**Dependencies:** Step 1 (particle buffer types)

### Rendering Details
- Vertex: billboard orientation (camera-facing) + size scaling
- Fragment: `smoothstep` SDF circle (r=0.45, soft edge 0.05) + glow halo (r=0.8, alpha 0.15)
- Blending: `THREE.AdditiveBlending` (src: ONE, dst: ONE)
- Depth: `depthWrite: false`, `depthTest: true`
- Trail: last 4 positions per particle, quad strip with linearly decaying alpha

### Key Exports
```typescript
export function createParticleRenderMaterial(tier: GPUTier): THREE.SpriteNodeMaterial;
export function createTrailGeometry(maxTrailSegments: number): THREE.BufferGeometry;
```

**Status:** ✅ Already implemented (`src/lib/3d/heroParticleRender.ts`, 197 lines)

---

## Step 3: Create `src/lib/audio/heroAudio.ts`

**Purpose:** Tone.js audio timeline for all 8 animation phases
**Lines:** ~807
**Dependencies:** None (uses Tone.js, installed in Stage 1)
**Directory:** Create `src/lib/audio/` if it doesn't exist

### Audio Graph
```
Master Volume → Limiter → Destination
├─ Sub-bass (Phase 1-2)
├─ Whoosh/Impact (Phase 2, 5)
├─ Crystalline hum (Phase 3)
├─ Electric crackle (Phase 4)
├─ Shatter transient (Phase 5)
├─ Migration drone (Phase 6)
├─ Boot sequence (Phase 7)
└─ Cockpit ambient (Phase 8 — persists)
```

### Phase Audio Cues

| Phase | Audio Elements | Timing |
|-------|---------------|--------|
| 1 Void | Brown noise rumble (80→200Hz LP), sub-bass sine 40Hz, reverb (decay 4s) | 0.0–2.0s |
| 2 Assembly | White noise whoosh (200→2kHz BP), impact hit (MembraneSynth), MetalSynth clang | 2.0–4.5s |
| 3 Showcase | PolySynth crystalline hum (C4-E4-G4-B4, -16dB), pink noise panner | 4.5–7.5s |
| 4 Surge | White NoiseSynth crackle (BP 2.5kHz), sawtooth tension sweep (100→800Hz) | 7.5–10.0s |
| 5 Shatter | MembraneSynth sub drop (40Hz, octaves 6), glass-shatter sample, reverb (3s) | 10.0–11.5s |
| 6 Regroup | MetalSynth decel (4kHz→200Hz), pink noise migration drone (HRTF panner) | 11.5–14.0s |
| 7 Materialize | Sequential boot sounds (6 synth hits, 400ms stagger), cockpit hum full | 14.0–17.0s |
| 8 Online | FM sweep power-up (C3→C5, 0.5s), crossfade to persistent cockpit ambient | 17.0–19.0s |

### Key Exports
```typescript
export class HeroAudioTimeline {
  constructor(soundEnabled: boolean);
  initialize(): Promise<void>;
  syncToProgress(progress: number): void;
  setTimeScale(scale: number): void;
  mute(): void;
  unmute(): void;
  dispose(): void;
}
```

### Audio Assets (Optional)
- `/public/audio/glass-chime.mp3` — Phase 2 grain source
- `/public/audio/glass-shatter.mp3` — Phase 5 transient
- `/public/audio/glass-fragments.mp3` — Phase 5 debris

System gracefully degrades to synthesized-only audio if assets are unavailable.

**Status:** ✅ Already implemented (`src/lib/audio/heroAudio.ts`, 807 lines)

---

## Step 4: Create `src/hooks/useHeroAnimation.ts`

**Purpose:** React hook managing animation lifecycle, skip logic, fast-forward, phase callbacks
**Lines:** ~189
**Dependencies:** Phase 5A stores (skipIntroAnimation, gpuTier)

### Skip Logic Decision Tree
```
Is prefers-reduced-motion: reduce?
  → YES: shouldSkip = true (accessibility override)
  → NO: Is skipIntroAnimation true in uiStore?
    → YES: Is this the first visit ever?
      → YES: shouldSkip = false (first visit always plays)
      → NO: shouldSkip = true
    → NO: shouldSkip = false
```

### Key Exports
```typescript
export interface HeroAnimationState {
  shouldSkip: boolean;
  gpuTier: GPUTier;
  stripeCount: number;
  currentPhase: number;       // 0-7
  progress: number;           // 0.0-1.0
  isComplete: boolean;
  isFastForwarding: boolean;
  timeScale: number;          // 1.0 normal, 4.0 fast-forward
}

export interface HeroAnimationActions {
  fastForward: () => void;
  skipToEnd: () => void;
  setPhase: (phase: number) => void;
  setProgress: (progress: number) => void;
  setComplete: () => void;
}

export function useHeroAnimation(
  onComplete?: () => void,
  onPhaseChange?: (phase: number) => void
): [HeroAnimationState, HeroAnimationActions];
```

**Status:** ✅ Already implemented (`src/hooks/useHeroAnimation.ts`, 189 lines)

---

## Step 5: Create `src/components/3d/HeroAnimation.tsx`

**Purpose:** Master 8-phase GSAP timeline orchestrator — the central component
**Lines:** ~549
**Dependencies:** ALL prior steps in Part A and Part B

### GSAP Timeline Labels
```typescript
timeline
  .addLabel("void", 0)        // Phase 1: 0.0 – 2.0s
  .addLabel("assembly", 2)     // Phase 2: 2.0 – 4.5s
  .addLabel("showcase", 4.5)   // Phase 3: 4.5 – 7.5s
  .addLabel("surge", 7.5)      // Phase 4: 7.5 – 10.0s
  .addLabel("shatter", 10)     // Phase 5: 10.0 – 11.5s
  .addLabel("regroup", 11.5)   // Phase 6: 11.5 – 14.0s
  .addLabel("materialize", 14) // Phase 7: 14.0 – 17.0s
  .addLabel("online", 17);     // Phase 8: 17.0 – 19.0s
```

### Internal Structure
```
<HeroAnimation>
  ├── useHeroAnimation()            — lifecycle hook
  ├── HeroParticleSystem            — compute + render integration
  ├── LogoGeometry                  — TextGeometry "SparkForge" (Exo 2 Bold)
  │   ├── crystallineMaterial       — shaders from Part A
  │   └── electricVeinsMaterial     — Phase 4 overlay
  ├── ShardSystem                   — Voronoi fracture
  ├── SplinePaths                   — shard migration curves
  ├── CameraController              — GSAP-driven orbit, shake, pullback
  ├── PostProcessing                — Bloom, ChromaticAberration, MotionBlur
  ├── SkipButton                    — "Skip Intro" pill (glassmorphic, bottom-right)
  ├── ScreenReaderAnnouncements     — aria-live regions
  └── HeroAudioTimeline             — audio integration
```

### Camera Sequence

| Phase | Position | FOV | Special |
|-------|----------|-----|---------|
| 1 Void | `[0, 0, 1.5]` → `[0, 0, 2.5]` | 35° | Micro-drift |
| 2 Assembly | → `[0, 0, 5.0]` | 35° → 50° | Text overshoot |
| 3 Showcase | Circular orbit r=3.0 | 50° | Full 360° |
| 4 Surge | Base `[0, 0, 5.0]` | 50° ± 0.5° | Shake ramp |
| 5 Shatter | Static + shake | 50° → 55° → 53° | Shake spike |
| 6 Regroup | → `[0, 0, 5.0]` | 53° → 56° | Spring |
| 7 Materialize | → `[0, 6.5, 7]` | 56° → 58° | Breathe |
| 8 Online | Locked `[0, 6.5, 7]` | 58° | CinematicCamera takes over |

### Skip Button (OD-2)
- Glassmorphic pill: `backdrop-blur-md bg-white/5 border border-white/10`
- Font: Sora (`font-body`), 14px, opacity 0.4 (hover: 0.8)
- Appears after 2s. Click → `timeline.timeScale(4)`. Escape → instant Phase 8.

### Screen Reader (Accessibility)
```html
<div role="status" aria-live="polite" className="sr-only">
  SparkForge is loading your command station...
</div>
<div role="status" aria-live="assertive" className="sr-only">
  Command station ready. Welcome to SparkForge!
</div>
```

### Dynamic Import (SSR safety)
```typescript
const HeroAnimation = dynamic(
  () => import('@/components/3d/HeroAnimation'),
  { ssr: false }
);
```

**Status:** ✅ Already implemented (`src/components/3d/HeroAnimation.tsx`, 549 lines)

---

## CrystalShatter Archival

After `HeroAnimation.tsx` is created and verified:

1. Archive CrystalShatter:
```bash
mkdir -p src/components/3d/_SUPERSEDED
git mv src/components/3d/CrystalShatter.tsx src/components/3d/_SUPERSEDED/CrystalShatter.tsx
```

2. Create `src/components/3d/_SUPERSEDED/SUPERSEDED_BY.md`:
```markdown
# SUPERSEDED FILES — src/components/3d/

## ⚠️ DO NOT USE — These files contain outdated code

### CrystalShatter.tsx
- **Superseded by:** `HeroAnimation.tsx` (full 8-phase cinematic replacement)
- **Date archived:** March 20, 2026
- **Reason:** CrystalShatter was a 5-phase, ~7s animation. HeroAnimation is an 8-phase, 19s sequence with WebGPU compute particles, Tone.js audio, GSAP timeline, and seamless cockpit handoff.
- **Note:** `CrystalHero.tsx` (parallax variant, Decision 8.1) is a SEPARATE component and is RETAINED.

### Active 3D Components (do NOT archive)
- HeroAnimation.tsx — 8-phase hero sequence
- CrystalHero.tsx — Landing page parallax variant (Decision 8.1)
- CockpitCanvas.tsx — Unified R3F Canvas (CPA2-1)
- CameraSystem.tsx — Unified camera system
- All other 3D components in parent directory
```

3. Redirect all 17 imports of `CrystalShatter` to `HeroAnimation` across the codebase.

---

## Validation

```bash
npx tsc --noEmit       # No TypeScript errors
npm run build          # Build passes
npm run dev            # Visual verification:
```

**Visual Checklist (HS-5 for Hero Animation):**
- [ ] 8-phase animation plays on first visit (19s total)
- [ ] Fast-forward works (click/Enter/Space → 4x speed)
- [ ] Escape key skips to cockpit immediately
- [ ] Audio plays and is mutable via `soundEnabled`
- [ ] `prefers-reduced-motion` skips to Phase 8
- [ ] WebGL2 fallback works (disable WebGPU in browser flags)
- [ ] CSS fallback works (disable WebGL in browser flags)
- [ ] Dashboard content fades in over live cockpit on complete

---

## Commit

```bash
git add -A
git commit -m "Phase 5B: Hero Animation — particles, audio, hook, orchestrator, CrystalShatter archived"
```
