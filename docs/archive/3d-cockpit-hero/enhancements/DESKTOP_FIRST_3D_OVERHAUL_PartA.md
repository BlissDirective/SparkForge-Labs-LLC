# Desktop-First Immersive 3D Overhaul — Part A

## Foundation Cleanup: Constraint Removal & Desktop-Ultra Lock

**Version:** 1.0 | **Date:** March 23, 2026 | **Author:** Claude Code
**Scope:** Phase 1 of 4 — Remove mobile/tablet constraints, LOD system, CSS fallbacks. Lock all rendering to desktop-ultra max.
**Depends On:** CLAUDE.md v5.9, CPA v2.0, Hero Animation v2.0
**Supersedes:** MOBILE_3D_ENHANCEMENT_PLAN_PartA.md, MOBILE_3D_ENHANCEMENT_PLAN_PartB.md (archive to `_SUPERSEDED/`)

---

## 1. OVERVIEW

This document is **Part A** of a 4-part Desktop-First Immersive 3D Overhaul that transforms SparkForge from a responsive multi-device application into a **desktop-only, fully immersive 3D laboratory command station** with no compromises.

### Part Map

| Part | Title | Scope |
|------|-------|-------|
| **A (this)** | Foundation Cleanup | Remove DeviceSelectionModal, LOD system, mobile checks, CSS fallbacks. Hardcode desktop-ultra. |
| **B** | Single Canvas & Mechanical Iris | Refactor CockpitCanvas as true persistent canvas. Build mechanical iris transition. Refactor games as `<group>` scenes. |
| **C** | Post-FX, Spatial Audio & Interactivity | Full EffectComposer stack, spatial audio engine, free camera orbit, interactive cockpit surfaces, parallax mouse tracking. |
| **D** | Document Updates, Error Analysis & Enhancements | All stage .md updates, CLAUDE.md updates, master implementation plan updates, identified errors, and visionary enhancement suggestions. |

---

## 2. DECISION LOCKS (New — D3D Series)

These decisions govern the Desktop-First overhaul and are **locked upon approval**.

| ID | Decision | Rationale |
|----|----------|-----------|
| **D3D-1** | Desktop-only rendering; no mobile/tablet code paths | Eliminates 401 `isMobile` occurrences across 84 files. Simplifies every 3D component. Future mobile support will be a separate R3F-native effort (no CSS fallbacks ever). |
| **D3D-2** | LOD system fully removed | All geometry renders at max quality always. `useLOD`, `LODWrapper`, `useLODContext`, `useAdaptiveLOD` deleted. Future mobile LOD will use R3F-native LOD (Three.js `LOD` object), never CSS substitution. |
| **D3D-3** | Triangle budget upgraded to 50M total | Cockpit: 30M, active game scene: 20M. Up from 20M cockpit-only. |
| **D3D-4** | Native device pixel ratio, no cap | `dpr={[1, window.devicePixelRatio]}` — renders at full native resolution. |
| **D3D-5** | Full EffectComposer always-on | Bloom, ChromaticAberration, Vignette, SSAO, SSR, Depth of Field on every scene. No conditional `profile.bloomEnabled` checks. |
| **D3D-6** | Mechanical Iris cockpit-to-game transition | Physical cockpit panels retract with gear/piston animation, audio, and light rays. Not wormhole, not dissolve. |
| **D3D-7** | Full spatial audio system | Positional audio via Web Audio API + Tone.js for cockpit hum, transitions, UI interactions, per-lab soundscapes. |
| **D3D-8** | Free camera orbit + interactive surfaces + parallax | OrbitControls-based free look, hover-reactive cockpit panels, mouse-position parallax on all scenes. |
| **D3D-9** | Unique 3D environments per-lab (10) + unique per-flagship/FL-Lite | 10 lab environments for standard games, plus unique environments per flagship (6) and FL-Lite (9) game. 25 total unique environments. |

---

## 3. PHASE 1A — DELETE DeviceSelectionModal & Force Desktop-Ultra

### 3.1 Files to DELETE

```
src/components/ui/DeviceSelectionModal.tsx    — DELETE entirely
src/hooks/useIsMobile.ts                      — DELETE entirely
src/hooks/useMediaQuery.ts                    — DELETE (if exists)
src/components/3d/GenericGameParticles.tsx     — DELETE (CSS fallback)
```

### 3.2 Files to MODIFY — Remove all references to deleted files

**Every file that imports from the deleted modules must be updated.** The grep audit found **401 occurrences of `isMobile`** across **84 files**.

#### 3.2.1 `src/stores/deviceStore.ts` — REPLACE ENTIRELY

The store is rewritten to hardcode desktop-ultra with no device selection, no tiered budgets, and no LOD types.

```typescript
// ════════════════════════════════════════════════════
// DEVICE STORE — Desktop-Ultra Hardcoded (D3D-1)
// ════════════════════════════════════════════════════
// Desktop-First Immersive 3D Overhaul: All rendering
// locked to maximum quality. No device selection,
// no tiered budgets, no LOD levels.
//
// <!-- FUTURE: When mobile 3D support is added, this store
//      will be expanded with R3F-native LOD tiers (Three.js
//      LOD object). No CSS fallbacks will ever be used.
//      Mobile will render full 3D at reduced triangle counts
//      using native Three.js LOD, not component-level checks. -->

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ■■ GPU Rendering Tier ■■
// Detected at runtime by webgpuDetection.ts
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2';

// ■■ Performance Profile — Desktop Ultra (Always) ■■
export interface PerformanceProfile {
  targetFPS: number;
  maxTriangles: number;
  particleMultiplier: number;
  bloomEnabled: boolean;
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  maxLights: number;
  textureResolution: 'full';
  instancedMeshLimit: number;
  sphereSegments: number;
  antialias: boolean;
  pixelRatio: number;
}

// ■■ Single Profile — Desktop Ultra ■■
const DESKTOP_ULTRA_PROFILE: PerformanceProfile = {
  targetFPS: 60,
  maxTriangles: 50_000_000,       // D3D-3: 50M total (30M cockpit + 20M game)
  particleMultiplier: 1.5,        // Max particles always
  bloomEnabled: true,
  postProcessingEnabled: true,
  shadowsEnabled: true,
  maxLights: 24,                  // Increased for full cockpit + game lighting
  textureResolution: 'full',
  instancedMeshLimit: 10_000,     // Doubled for dense cockpit geometry
  sphereSegments: 64,             // Ultra-quality curves
  antialias: true,
  pixelRatio: 3.0,                // D3D-4: Native DPR, generous cap
};

// ■■ Triangle Budgets — Desktop-Only (D3D-3) ■■
export type TriangleBudgetTier = 'flagship' | 'flLite' | 'standard' | 'system';
export const TRIANGLE_BUDGETS: Record<TriangleBudgetTier, number> = {
  flagship:  20_000_000,    // 20M — full immersive game environment
  flLite:    10_000_000,    // 10M — rich themed environment (up from 2M)
  standard:   5_000_000,    //  5M — full 3D lab environment (up from 500K)
  system:    30_000_000,    // 30M — cockpit shell (up from 20M)
};

// ■■ Store Interface ■■
interface DeviceState {
  profile: PerformanceProfile;
  gpuTier: GPUTier;
  stripeCount: number;
  setGpuTier: (tier: GPUTier, stripes?: number) => void;
  getTriangleBudget: (tier: TriangleBudgetTier) => number;
  getParticleCount: (baseCount: number) => number;
  getSphereDetail: (preferredSegments?: number) => number;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      profile: DESKTOP_ULTRA_PROFILE,
      gpuTier: 'webgl2' as GPUTier,
      stripeCount: 0,

      setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),

      getTriangleBudget: (tier) => TRIANGLE_BUDGETS[tier],

      getParticleCount: (baseCount) => {
        const { particleMultiplier } = get().profile;
        return Math.round(baseCount * particleMultiplier);
      },

      getSphereDetail: (preferredSegments) => {
        const { sphereSegments } = get().profile;
        return preferredSegments
          ? Math.min(preferredSegments, sphereSegments)
          : sphereSegments;
      },
    }),
    {
      name: 'sparkforge-device',
      partialize: (state) => ({
        gpuTier: state.gpuTier,
        stripeCount: state.stripeCount,
      }),
    }
  )
);

// ■■ Selector Helpers ■■
export const selectProfile = (s: DeviceState) => s.profile;
export const selectGpuTier = (s: DeviceState) => s.gpuTier;
export const selectStripeCount = (s: DeviceState) => s.stripeCount;

// REMOVED (D3D-1): DeviceType, LODLevel, selectDeviceType, selectHasSelected,
// PERFORMANCE_PROFILES (multi-device), TRIANGLE_BUDGETS (multi-device)
// REMOVED (D3D-2): LODLevel type export (was used by useLOD.ts — now deleted)
```

#### 3.2.2 `src/components/game/GameShell.tsx` — REPLACE ENTIRELY

```typescript
'use client';

// ================================================================
// GAME SHELL — Standard wrapper for all 35 SparkForge games
// ================================================================
// Desktop-First 3D Overhaul (D3D-1): Removed mobile detection,
// CSS particle fallback, and LOD wrapper. All games render at
// maximum quality inside the unified CockpitCanvas.
//
// <!-- FUTURE: When mobile 3D support is re-added, it will use
//      R3F-native LOD (Three.js LOD object) per component, not
//      a wrapper-based LOD system. No CSS fallbacks ever. -->

import { useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useUIStore } from '@/stores/uiStore';

interface GameShellProps {
  gameId: string;
  title: string;
  worldNumber: number;
  worldColor: string;
  xpReward?: number;
  totalRounds: number;
  hints?: number;
  children: ReactNode;
}

export function GameShell({
  gameId,
  title,
  worldNumber,
  worldColor,
  totalRounds,
  hints = 3,
  children,
}: GameShellProps) {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const setGameActive = useUIStore((s) => s.setGameActive);

  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    setGameActive(true);
    return () => {
      setGameActive(false);
      resetGame();
    };
  }, [gameId, totalRounds, hints, startGame, resetGame, setGameActive]);

  return (
    <div
      className="h-full w-full"
      data-game-id={gameId}
      data-world={worldNumber}
      data-world-color={worldColor}
      role="region"
      aria-label={`${title} game`}
    >
      {children}
    </div>
  );
}

export default GameShell;

// REMOVED (D3D-1): isMobile state, GenericGameParticles import/render
// REMOVED (D3D-2): LODWrapper import/render, toLODTier helper, GAME_REGISTRY import
```

### 3.3 Game Files — Remove `isMobile` Checks (35 files)

Every game file currently contains this pattern that must be removed:

```typescript
// ❌ REMOVE this pattern from all 35 game files:
function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(window.innerWidth < 768); }, []);
  return m;
}
// ... later in render:
{!isMobile && <Component3D {...props} />}

// ✅ REPLACE with unconditional 3D rendering:
<Component3D {...props} />
```

**Complete list of game files requiring this change (35 files):**

| # | File | `isMobile` Occurrences |
|---|------|----------------------|
| 1 | `AiSpyGame.tsx` | 5 |
| 2 | `AiArtDetectiveGame.tsx` | 5 |
| 3 | `AiOrNotGame.tsx` | (via 3D component) |
| 4 | `AgentArchitectGame.tsx` | 5 |
| 5 | `ApiExplorerGame.tsx` | 5 |
| 6 | `BiasDetectiveGame.tsx` | 5 |
| 7 | `BuildClassifierGame.tsx` | 5 |
| 8 | `CameraQuestGame.tsx` | 4 |
| 9 | `CareerExplorerGame.tsx` | 5 |
| 10 | `ChatbotBuilderGame.tsx` | 6 |
| 11 | `CodeBlocksGame.tsx` | (via 3D component) |
| 12 | `DataDetectiveGame.tsx` | 3 |
| 13 | `DataShieldGame.tsx` | 5 |
| 14 | `EmojiDecoderGame.tsx` | (via 3D component) |
| 15 | `EthicsCourtroomGame.tsx` | 5 |
| 16 | `FoolTheAiGame.tsx` | 5 |
| 17 | `FutureForgeGame.tsx` | 3 |
| 18 | `HumanVsMachineGame.tsx` | 5 |
| 19 | `LostInTranslationGame.tsx` | 5 |
| 20 | `MyFirstAiAppGame.tsx` | 4 |
| 21 | `NeuralBuilderGame.tsx` | 2 |
| 22 | `NeuronRelayGame.tsx` | 5 |
| 23 | `PetTrainerGame.tsx` | (via Pet3DScene) |
| 24 | `PixelInvestigatorGame.tsx` | 5 |
| 25 | `PredictionMarketGame.tsx` | 5 |
| 26 | `PromptLabGame.tsx` | 8 |
| 27 | `RealOrFakeGame.tsx` | 5 |
| 28 | `RobotVacuumGame.tsx` | 4 |
| 29 | `SentimentScannerGame.tsx` | 5 |
| 30 | `SortToyBoxGame.tsx` | (via SortScene3D) |
| 31 | `TimeMachineGame.tsx` | 5 |
| 32 | `TokenChopperGame.tsx` | 5 |
| 33 | `ToolPickerGame.tsx` | 5 |
| 34 | `TreatTrainerGame.tsx` | 5 |
| 35 | `WordPredictorGame.tsx` | 5 |

### 3.4 3D Component Files — Remove `isMobile` Checks

These 3D components in `src/components/3d/` also contain mobile checks:

| File | Change |
|------|--------|
| `CockpitCanvas.tsx` | Remove entire mobile/CSS fallback branch (lines 299-350). Remove `isMobile` state. Remove WebGL availability check — assume always available. |
| `AmbientParticles.tsx` | Remove `isMobile` prop and conditional rendering |
| `NeuralNetwork3D.tsx` | Remove 20 `isMobile` references — render all geometry unconditionally |
| `FutureForge3D.tsx` | Remove mobile conditional |
| `CameraQuest3D.tsx` | Remove mobile conditional |
| `EmojiDecoder3D.tsx` | Remove mobile conditional |
| `AiOrNot3D.tsx` | Remove mobile conditional |
| `ChatbotNodes3D.tsx` | Remove mobile conditional |
| `DataDetective3D.tsx` | Remove mobile conditional |
| `RobotVacuum3D.tsx` | Remove mobile conditional |
| `MyFirstAiApp3D.tsx` | Remove mobile conditional |
| `CrystalHero.tsx` | Remove mobile conditional |

### 3.5 Other Files — Remove Mobile References

| File | Change |
|------|--------|
| `src/app/(auth)/layout.tsx` | Remove mobile 3D conditional (3 occurrences) — always render 3D login portal |
| `src/components/landing/ScrollJourney.tsx` | Remove mobile detection (5 occurrences) — always render full 3D scroll experience |
| `src/hooks/useSystemPreferences.ts` | Remove mobile-specific preferences (3 occurrences) |

---

## 4. PHASE 1B — DELETE LOD SYSTEM ENTIRELY

### 4.1 Files to DELETE

```
src/hooks/useLOD.ts              — DELETE entirely
src/components/3d/LODWrapper.tsx  — DELETE entirely
```

### 4.2 Remove All LOD References

Every component that imports `useLOD`, `useLODContext`, `LODWrapper`, or `useAdaptiveLOD` must have those references stripped.

**Pattern to remove from 3D components:**

```typescript
// ❌ REMOVE:
import { useLOD, lodSphere } from '@/hooks/useLOD';
const lod = useLOD({ tier: 'flagship' });
<sphereGeometry args={lodSphere(lod, 1.0)} />
{lod.enableEffects && <Sparkles />}
{lod.enableShadows && <ContactShadows />}

// ✅ REPLACE with hardcoded ultra values:
<sphereGeometry args={[1.0, 64, 64]} />
<Sparkles />
<ContactShadows />
```

**Key constants to hardcode everywhere (previously from LOD):**

| Property | Ultra Value | Use |
|----------|------------|-----|
| `segments` | 64 | Sphere/cylinder segments |
| `tubularSegments` | 128 | Tube geometry detail |
| `subdivisions` | 5 | Mesh subdivision level |
| `particleMultiplier` | 1.5 | Scale particle counts |
| `enableEffects` | `true` (always) | Glow, trails, sparkles |
| `enableShadows` | `true` (always) | Cast/receive shadows |
| `enableReflections` | `true` (always) | Env map reflections |
| `enableAnimations` | `true` (always) | Complex animations |
| `textureDetail` | `'full'` | Texture resolution |
| `maxInstances` | 10,000 | Instanced mesh limit |

### 4.3 Future-Proofing Notes

Add this comment block to `src/stores/deviceStore.ts` and `src/components/game/GameShell.tsx`:

```typescript
// <!-- FUTURE: MOBILE 3D LOD REINTEGRATION POINT
//
// When mobile support is added, it will use:
//   1. Three.js native LOD object (THREE.LOD) with distance-based geometry swapping
//   2. R3F-native <Detailed> component from @react-three/drei
//   3. Per-component LOD meshes baked at export time (not runtime switching)
//   4. GPU-adaptive quality via renderer.info.render.triangles monitoring
//
// What will NEVER be used:
//   - CSS fallback components (no GenericGameParticles, no CSS borders)
//   - Component-level useIsMobile() checks
//   - Wrapper-based LOD (no LODWrapper context)
//   - Canvas unmounting based on device type
//
// Mobile will render the SAME 3D scene at reduced complexity,
// not a different 2D scene. The 3D experience is the product. -->
```

---

## 5. PHASE 1C — MAX-OUT CANVAS SETTINGS GLOBALLY

### 5.1 CockpitCanvas — Remove All Conditional Rendering

The current `CockpitCanvas.tsx` has three render paths:
1. **CSS-only fallback** (mobile/no-WebGL) — lines 335-350 → **DELETE**
2. **Game mode CSS frame** (Canvas unmounted) — lines 352-368 → **DELETE** (Part B replaces with persistent canvas)
3. **Full R3F Canvas** — lines 370-513 → **KEEP and enhance**

### 5.2 Canvas Configuration — Maximum Quality

```typescript
// Current (conditional):
dpr={[1, profile.pixelRatio]}   // capped at 2.5
gl={{ antialias: profile.antialias }}

// New (always max):
dpr={[1, Math.min(window.devicePixelRatio, 3)]}  // Native resolution, 3x safety cap
gl={{
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true,
  logarithmicDepthBuffer: true,  // NEW: prevents z-fighting in deep scenes
}}
```

### 5.3 Remove `profile.bloomEnabled` Conditional

```typescript
// ❌ Current — conditional postprocessing:
{profile.bloomEnabled && (
  <PostprocessingStack ... />
)}

// ✅ New — always-on (D3D-5):
<PostprocessingStack ... />
```

The full EffectComposer upgrade (adding SSAO, SSR, ChromaticAberration, DOF) is detailed in **Part C**.

---

## 6. IMPACT SUMMARY — PHASE 1

### Files DELETED (4)

| File | Reason |
|------|--------|
| `src/components/ui/DeviceSelectionModal.tsx` | D3D-1: No device selection |
| `src/hooks/useIsMobile.ts` | D3D-1: No mobile detection |
| `src/hooks/useLOD.ts` | D3D-2: No LOD system |
| `src/components/3d/LODWrapper.tsx` | D3D-2: No LOD wrapper |
| `src/components/3d/GenericGameParticles.tsx` | D3D-1: No CSS particle fallback |

### Files REPLACED (2)

| File | Reason |
|------|--------|
| `src/stores/deviceStore.ts` | D3D-1/3: Hardcoded desktop-ultra, 50M budget |
| `src/components/game/GameShell.tsx` | D3D-1/2: Remove LOD, mobile, CSS fallback |

### Files MODIFIED (84+)

- **35 game files** — remove `useIsMobile()` hook + conditional 3D rendering
- **12 3D component files** — remove `isMobile` props/checks
- **3 layout/hook files** — remove mobile references
- **30+ stage .md documents** — update code snippets (detailed in Part D)
- **CLAUDE.md** — update Sections 7, 9, 14 (detailed in Part D)

### Net Effect

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| `isMobile` occurrences | 401 | 0 | -401 |
| LOD-related code lines | ~500 | 0 | -500 |
| Device selection UI | 1 modal | 0 | Removed |
| CSS fallback components | 1 | 0 | Removed |
| Triangle budget (cockpit) | 20M | 30M | +50% |
| Triangle budget (flagship game) | 10M | 20M | +100% |
| Triangle budget (FL-Lite game) | 2M | 10M | +400% |
| Triangle budget (standard game) | 500K | 5M | +900% |
| Pixel ratio cap | 2.5 | 3.0 (native) | Uncapped |
| Render paths per component | 2-3 | 1 | Unified |

---

## 7. EXECUTION CHECKLIST — PHASE 1

This is the build order for implementing Phase 1:

- [ ] **1.1** Delete `DeviceSelectionModal.tsx`
- [ ] **1.2** Delete `useIsMobile.ts` and `useMediaQuery.ts`
- [ ] **1.3** Delete `GenericGameParticles.tsx`
- [ ] **1.4** Delete `useLOD.ts`
- [ ] **1.5** Delete `LODWrapper.tsx`
- [ ] **1.6** Replace `deviceStore.ts` with desktop-ultra hardcoded version
- [ ] **1.7** Replace `GameShell.tsx` with simplified version
- [ ] **1.8** Update all 35 game files — remove `useIsMobile` + conditional 3D
- [ ] **1.9** Update 12 3D components — remove `isMobile` props/checks
- [ ] **1.10** Update `CockpitCanvas.tsx` — remove CSS fallback branches
- [ ] **1.11** Update `(auth)/layout.tsx` — remove mobile 3D conditional
- [ ] **1.12** Update `ScrollJourney.tsx` — remove mobile detection
- [ ] **1.13** Update `useSystemPreferences.ts` — remove mobile preferences
- [ ] **1.14** `npm run build` — verify clean compilation
- [ ] **1.15** `npx tsc --noEmit` — verify zero type errors
- [ ] **1.16** Commit: `"D3D Phase 1: Remove mobile/LOD/CSS fallbacks, lock desktop-ultra"`

---

*End of Part A — Desktop-First Immersive 3D Overhaul: Foundation Cleanup*
*Next: Part B — Single Canvas Architecture & Mechanical Iris Transition*
