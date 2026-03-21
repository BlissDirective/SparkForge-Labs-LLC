# COCKPIT CPA2 — v3-FINAL (PART A)

## CockpitCanvas, CameraSystem & Shell Geometry (20M Triangle Budget)

**Date:** March 20, 2026 | **Phase:** 5C (after Hero Animation, before Cockpit Part B)
**Reference Specs:** `docs/00-reference/3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0.md`, `docs/00-reference/Upgrade-3D-Panoramic-Cockpit-2026-03-20.md`
**Decision References:** CPA2-1 (Single Canvas), CPA2-2 (WebGPU Primary), CPA2-3 (Seamless Handoff), CPA2-4 (Scene Groups)
**Depends On:** Phase 5A–5B (Hero Animation complete, CockpitCanvas foundation exists)

---

## Overview

Part A establishes the **unified cockpit rendering architecture** — a single persistent R3F Canvas that wraps the entire app, a unified camera system, and the primary shell geometry components. This transforms StationFrame from a standalone canvas into a thin wrapper around the unified CockpitCanvas.

### Key Architecture Decisions

| Decision | Summary |
|----------|---------|
| **CPA2-1** | Single persistent R3F Canvas for entire app lifecycle — no remount, no canvas swap |
| **CPA2-2** | WebGPU primary renderer via `WebGPURenderer` (async init), WebGL2 auto-fallback via TSL |
| **CPA2-3** | Hero animation seamlessly transitions INTO the live cockpit — final frame IS first interactive frame |
| **CPA2-4** | SpatialDashboard as `<group>` within CockpitCanvas, not separate Canvas |

### Files Created/Modified

| # | File | Action | Triangles | Lines |
|---|------|--------|-----------|-------|
| 1 | `src/components/3d/CockpitCanvas.tsx` | Created | — | ~501 |
| 2 | `src/components/3d/CameraSystem.tsx` | Created | — | ~113 |
| 3 | `src/components/3d/CockpitPanels.tsx` | Upgraded (20M) | 2,000,000 | ~903 |
| 4 | `src/components/3d/SidePanels.tsx` | Upgraded (20M) | 1,500,000 | — |
| 5 | `src/components/3d/LEDRim.tsx` | Upgraded (20M) | 200,000 | — |
| 6 | `src/components/3d/HolographicHUD.tsx` | Upgraded (20M) | 500,000 | — |
| 7 | `src/components/3d/StatusBar3D.tsx` | Upgraded (20M) | 500,000 | — |
| 8 | `src/components/3d/CockpitStructuralDetail.tsx` | Created | 1,500,000 | — |
| 9 | `src/components/3d/CockpitFloor3D.tsx` | Created | 500,000 | — |
| 10 | `src/components/3d/StationFrame.tsx` | Refactored → thin wrapper | — | ~96 |
| 11 | `src/components/3d/SpatialDashboard.tsx` | Refactored → thin wrapper | — | ~35 |
| 12 | `src/stores/cockpitStore.ts` | Created | — | ~273 |
| 13 | `src/lib/3d/cockpitConfig.ts` | Modified (TRIANGLE_BUDGET_V2) | — | — |

---

## Step 1: Create `src/components/3d/CockpitCanvas.tsx`

**Purpose:** Single persistent R3F Canvas (CPA2-1) managing hero/station/spatial/game scenes
**Lines:** ~501

### Architecture

The CockpitCanvas is the **single R3F Canvas** mounted at `z-index: 0` in the root layout. It persists across all routes. All 3D content renders as children or scene groups within this canvas.

```
CockpitCanvas (R3F Canvas, fixed, full viewport, z-index: 0)
├── CameraSystem (spring-damped, mode-aware)
├── AdaptiveDpr
├── Environment (HDR or preset fallback)
│
├── /* LAYER 1: Background */
├── CockpitSkinManager
├── AuroraBackground
│
├── /* LAYER 2: Spatial Content */
├── HolographicLabMap
├── InteractiveConsole3D ×4
├── AmbientNPCs
├── DynamicEnvironment
│
├── /* LAYER 3: Cockpit Shell */
├── CockpitPanels (2M tris)
├── LEDRim (200K)
├── SidePanels (1.5M)
├── StatusBar3D (500K)
├── HolographicHUD (500K)
├── CockpitStructuralDetail (1.5M)
├── CockpitFloor3D (500K)
│
├── /* LAYER 4: Postprocessing */
├── EffectComposer (Bloom, Vignette, BarrelDistortion)
│
└── /* LAYER 5: Transition FX */
    ├── WormholeTransition
    ├── CeremonyFX
    └── MiniMapOverlay3D
```

### WebGPU Renderer (CPA2-2)
```typescript
const createWebGPURenderer = async (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
  await renderer.init();
  return renderer;
};

<Canvas gl={createWebGPURenderer} />
```

### Mobile Fallback
When `useIsMobile()` returns `true`, CockpitCanvas renders a CSS-only fallback (glassmorphic dashboard, CSS particles, gradient backgrounds). No R3F Canvas is mounted on mobile (CPA2-9).

**Status:** ✅ Already implemented (`src/components/3d/CockpitCanvas.tsx`, 501 lines)

---

## Step 2: Create `src/components/3d/CameraSystem.tsx`

**Purpose:** Unified camera for all modes (hero/station/spatial/game)
**Lines:** ~113

Features:
- Spring interpolation between mode positions
- FOV transitions per cockpitStore state
- Idle drift animation (Perlin noise)
- Respects `prefers-reduced-motion`
- Mode-aware: hero (GSAP-driven) → station (orbit) → spatial (cinematic) → game (focused)

**Status:** ✅ Already implemented (`src/components/3d/CameraSystem.tsx`, 113 lines)

---

## Step 3: Upgrade `src/components/3d/CockpitPanels.tsx` (20M Budget)

**Purpose:** 256-segment curved hull with hex clusters, gauge needles, instanced rivets
**Triangles:** 2,000,000
**Lines:** ~903

20M upgrade features:
- 256-segment curved hull (was 64)
- 2×6 hex clusters with animated gauge needles
- Instanced rivets (1000+)
- Animated sub-panels (open/close, data display)
- Structural ribs and conduits
- LOD-aware via `useLOD` hook (ultra: 2M → billboard: 50K)

**Status:** ✅ Already implemented (`src/components/3d/CockpitPanels.tsx`, 903 lines)

---

## Steps 4-7: Upgrade Shell Components (SidePanels, LEDRim, HolographicHUD, StatusBar3D)

All upgraded to 20M budget with:
- Higher polygon counts per the triangle budget table
- LOD system integration
- Device-adaptive detail levels
- Chrome bezel materials from `materials.ts`

**Status:** ✅ All already implemented

---

## Step 8: Create `src/components/3d/CockpitStructuralDetail.tsx`

**Purpose:** Cable bundles, conduit pipes, vents, ribs, LED indicator strips
**Triangles:** 1,500,000

Adds visual depth and realism to the cockpit shell. LOD reduces to simple box geometry at distance.

**Status:** ✅ Already implemented

---

## Step 9: Create `src/components/3d/CockpitFloor3D.tsx`

**Purpose:** Grated floor, sub-floor piping, energy conduits, LED channels
**Triangles:** 500,000

Completes the cockpit enclosure. Visible when camera looks down.

**Status:** ✅ Already implemented

---

## Step 10: Refactor `src/components/3d/StationFrame.tsx` → Thin Wrapper

**Purpose:** Backward-compatible public API that delegates to CockpitCanvas
**Lines:** ~96

StationFrame is now a thin wrapper that passes all props through to CockpitCanvas. This preserves the import API used by dashboard layout and game components while the actual rendering happens in the unified canvas.

**Status:** ✅ Already implemented (`src/components/3d/StationFrame.tsx`, 96 lines)

---

## Step 11: Refactor `src/components/3d/SpatialDashboard.tsx` → Thin Wrapper

**Purpose:** Backward-compatible wrapper that sets `showSpatialDashboard` prop on CockpitCanvas
**Lines:** ~35

**Status:** ✅ Already implemented (`src/components/3d/SpatialDashboard.tsx`, 35 lines)

---

## Step 12: Create `src/stores/cockpitStore.ts`

**Purpose:** Zustand store for spatial navigation, skins, hero-to-cockpit handoff
**Lines:** ~273

### Key State

```typescript
interface CockpitState {
  // Spatial navigation
  spatialView: 'overview' | 'lab-focus' | 'console-focus' | 'game-focus';
  focusedLabId: number | null;
  cameraTarget: THREE.Vector3;

  // Cockpit skins (5 themes)
  cockpitSkin: 'default' | 'nebula' | 'ocean' | 'crystal' | 'grid';

  // NPC and console state
  npcsVisible: boolean;
  activeConsole: 'xp' | 'badges' | 'streak' | 'progress' | null;

  // Hero-to-cockpit handoff (CPA2-3)
  heroPhase: 'idle' | 'animating' | 'materializing' | 'complete';
  cockpitReady: boolean;
  setHeroPhase: (phase: 'idle' | 'animating' | 'materializing' | 'complete') => void;

  // Ceremony queue
  ceremonyQueue: CeremonyEvent[];

  // Audio preferences
  cockpitAmbientVolume: number;
}
```

**Status:** ✅ Already implemented (`src/stores/cockpitStore.ts`, 273 lines)

---

## Step 13: Update `src/lib/3d/cockpitConfig.ts`

**Purpose:** Add TRIANGLE_BUDGET_V2 constants for 20M upgrade

```typescript
export const TRIANGLE_BUDGET_V2 = {
  cockpitPanels: 2_000_000,
  sidePanels: 1_500_000,
  holographicLabMap: 1_000_000,
  labStructure: 3_000_000,       // 300K × 10 labs
  interactiveConsole: 2_000_000, // 500K × 4
  ambientNPCs: 1_500_000,       // 187K × 8
  dynamicEnvironment: 3_000_000,
  holographicHUD: 500_000,
  statusBar3D: 500_000,
  ledRim: 200_000,
  cockpitStructuralDetail: 1_500_000,
  volumetricFog3D: 500_000,
  cockpitFloor3D: 500_000,
  ceremonyFX: 500_000,
  wormholeTransition: 300_000,
  miniMapOverlay3D: 250_000,
  auroraBackground: 50_000,
  ambientParticles: 200_000,
  TOTAL: 19_000_000,            // ~1M headroom on 20M budget
};
```

**Status:** ✅ Already implemented

---

## Validation

```bash
npx tsc --noEmit       # No TypeScript errors
npm run build          # Build passes
```

Verify:
- [ ] Single R3F Canvas in DOM (check DevTools — only one `<canvas>`)
- [ ] StationFrame and SpatialDashboard are thin wrappers (no own Canvas)
- [ ] CockpitPanels render at full detail on desktop
- [ ] LOD degrades on tablet/mobile profiles
- [ ] cockpitStore persists heroPhase across routes

---

## Commit

```bash
git add -A
git commit -m "Phase 5C: Cockpit CPA2 Part A — unified canvas, camera system, 20M shell geometry"
```
