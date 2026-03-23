# Desktop-First Immersive 3D Overhaul — Part B

## Single Canvas Architecture, Mechanical Iris Transition & Game Scene Refactor

**Version:** 1.0 | **Date:** March 23, 2026 | **Author:** Claude Code
**Scope:** Phase 2 of 4 — Refactor CockpitCanvas as true persistent canvas. Build mechanical iris transition. Centralize scene management. Refactor games as `<group>` scenes.
**Depends On:** Part A completion (D3D-1 through D3D-9 decision locks)
**Builds Toward:** Part C (Post-FX, Spatial Audio & Interactivity)

---

## 1. OVERVIEW

This document is **Part B** of the 4-part Desktop-First Immersive 3D Overhaul. Part A removed all mobile/LOD/CSS fallback constraints and locked desktop-ultra rendering. Part B now consolidates the rendering architecture into a single, persistent canvas with centralized scene management and the signature mechanical iris transition.

### Part Map

| Part | Title | Scope |
|------|-------|-------|
| **A** | Foundation Cleanup | Remove DeviceSelectionModal, LOD system, mobile checks, CSS fallbacks. Hardcode desktop-ultra. |
| **B (this)** | Single Canvas & Mechanical Iris | Persistent CockpitCanvas, SceneStore, SceneRouter, MechanicalIris transition, GameShell refactor. |
| **C** | Post-FX, Spatial Audio & Interactivity | Full EffectComposer stack, spatial audio engine, free camera orbit, interactive cockpit surfaces, parallax. |
| **D** | Document Updates, Error Analysis & Enhancements | Stage .md updates, CLAUDE.md updates, master implementation plan updates, error analysis. |

### Core Changes

1. **SceneStore** — Centralized scene management replacing fragmented state across uiStore, cockpitStore, and CockpitCanvas props
2. **SceneRouter** — R3F component controlling `<group>` visibility inside the persistent canvas
3. **MechanicalIris** — Signature D3D-6 transition with 8 shutter blades, gear ring, pistons, and light rays
4. **CockpitCanvas Refactor** — True persistent canvas that NEVER unmounts, even during gameplay
5. **GameShell Refactor** — Signals scene transitions via sceneStore instead of toggling canvas unmount
6. **CameraSystem Update** — Game camera mode now interpolates to a forward-looking position

---

## 2. DECISION LOCKS (New — D3D-B Series)

These decisions govern the Part B architecture and are **locked upon approval**.

| ID | Decision | Rationale |
|----|----------|-----------|
| **D3D-B1** | Single Canvas persists across ALL app states including gameplay | Eliminates WebGL context thrashing, enables seamless camera transitions, iris can reference cockpit geometry |
| **D3D-B2** | Mechanical iris (not wormhole/dissolve) for cockpit↔game transitions | Physical, tactile, architecturally tied to cockpit panels. D3D-6 implementation. |
| **D3D-B3** | Games render as R3F `<group>` within CockpitCanvas scene graph | Single WebGL context; camera managed by CameraSystem; no per-game Canvas creation |
| **D3D-B4** | Iris animation: 600ms, 3-stage (outer gear → mid blades → inner snap), with audio + light rays | Distinct from hero (19s) and lab transitions. Snappy mechanical feel. |
| **D3D-B5** | SceneStore manages active scene (`cockpit` ∣ `game` ∣ `spatial` ∣ `hero` ∣ `transitioning`) | Single source of truth for scene visibility, camera mode, and transition orchestration |
| **D3D-B6** | Cockpit geometry fades to 20% opacity during game (not hidden) | Provides ambient depth and context — player always knows they're "inside the station" |

---

## 3. PHASE 2A — SceneStore + SceneRouter

### 3.1 NEW FILE: `src/stores/sceneStore.ts`

Centralized scene management store. Replaces the fragmented pattern where `uiStore.gameActive`, `cockpitStore.heroPhase`, and CockpitCanvas props each independently controlled visibility.

```typescript
import { create } from 'zustand';

export type ActiveScene = 'hero' | 'cockpit' | 'spatial' | 'game' | 'transitioning';
export type TransitionType = 'iris-open' | 'iris-close' | 'hero-to-cockpit' | 'cockpit-to-spatial' | 'none';

export interface SceneTransition {
  from: ActiveScene;
  to: ActiveScene;
  type: TransitionType;
  progress: number;      // 0..1
  duration: number;      // ms
  startedAt: number;     // Date.now()
}

interface SceneState {
  activeScene: ActiveScene;
  previousScene: ActiveScene | null;
  activeGameId: string | null;
  activeGameLabColor: string;
  transition: SceneTransition | null;
  isTransitioning: boolean;
  cockpitOpacityTarget: number;  // 1.0 in cockpit, 0.2 during game

  enterGame: (gameId: string, labColor: string) => void;
  exitGame: () => void;
  enterSpatial: () => void;
  exitSpatial: () => void;
  setHeroActive: () => void;
  completeHero: () => void;
  updateTransitionProgress: (progress: number) => void;
  completeTransition: () => void;
}

const IRIS_DURATION = 600;

export const useSceneStore = create<SceneState>((set, get) => ({
  activeScene: 'cockpit',
  previousScene: null,
  activeGameId: null,
  activeGameLabColor: '#00BBFF',
  transition: null,
  isTransitioning: false,
  cockpitOpacityTarget: 1.0,

  enterGame: (gameId, labColor) => {
    set({
      previousScene: get().activeScene,
      activeScene: 'transitioning',
      activeGameId: gameId,
      activeGameLabColor: labColor,
      isTransitioning: true,
      cockpitOpacityTarget: 0.2,
      transition: {
        from: 'cockpit',
        to: 'game',
        type: 'iris-open',
        progress: 0,
        duration: IRIS_DURATION,
        startedAt: Date.now(),
      },
    });
  },

  exitGame: () => {
    set({
      previousScene: 'game',
      activeScene: 'transitioning',
      isTransitioning: true,
      cockpitOpacityTarget: 1.0,
      transition: {
        from: 'game',
        to: 'cockpit',
        type: 'iris-close',
        progress: 0,
        duration: IRIS_DURATION,
        startedAt: Date.now(),
      },
    });
  },

  enterSpatial: () => set({
    previousScene: get().activeScene,
    activeScene: 'spatial',
  }),

  exitSpatial: () => set({
    previousScene: 'spatial',
    activeScene: 'cockpit',
  }),

  setHeroActive: () => set({ activeScene: 'hero', previousScene: null }),

  completeHero: () => {
    set({
      previousScene: 'hero',
      activeScene: 'transitioning',
      isTransitioning: true,
      transition: {
        from: 'hero',
        to: 'cockpit',
        type: 'hero-to-cockpit',
        progress: 0,
        duration: 1200,
        startedAt: Date.now(),
      },
    });
  },

  updateTransitionProgress: (progress) => {
    const { transition } = get();
    if (transition) {
      set({ transition: { ...transition, progress: Math.min(progress, 1) } });
    }
  },

  completeTransition: () => {
    const { transition } = get();
    if (transition) {
      set({
        activeScene: transition.to,
        previousScene: transition.from,
        transition: null,
        isTransitioning: false,
        activeGameId: transition.to === 'cockpit' ? null : get().activeGameId,
      });
    }
  },
}));

// Selectors
export const selectActiveScene = (s: SceneState) => s.activeScene;
export const selectTransition = (s: SceneState) => s.transition;
export const selectIsTransitioning = (s: SceneState) => s.isTransitioning;
export const selectActiveGameId = (s: SceneState) => s.activeGameId;
export const selectCockpitOpacity = (s: SceneState) => s.cockpitOpacityTarget;
```

### 3.2 NEW FILE: `src/components/3d/SceneRouter.tsx`

R3F component that controls which `<group>` is visible inside the persistent CockpitCanvas.

```typescript
'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSceneStore } from '@/stores/sceneStore';

interface SceneRouterProps {
  heroContent?: ReactNode;
  cockpitContent: ReactNode;
  spatialContent?: ReactNode;
  gameContent?: ReactNode;
  irisContent?: ReactNode;
}

export function SceneRouter({
  heroContent,
  cockpitContent,
  spatialContent,
  gameContent,
  irisContent,
}: SceneRouterProps) {
  const activeScene = useSceneStore((s) => s.activeScene);
  const cockpitOpacityTarget = useSceneStore((s) => s.cockpitOpacityTarget);
  const isTransitioning = useSceneStore((s) => s.isTransitioning);
  const transition = useSceneStore((s) => s.transition);

  const cockpitGroupRef = useRef<THREE.Group>(null);
  const cockpitOpacityRef = useRef(1.0);

  const showHero = activeScene === 'hero';
  const showCockpit = activeScene !== 'hero';
  const showSpatial = activeScene === 'spatial';
  const showGame = activeScene === 'game' ||
    (isTransitioning && transition?.to === 'game') ||
    (isTransitioning && transition?.from === 'game');
  const showIris = isTransitioning && (
    transition?.type === 'iris-open' || transition?.type === 'iris-close'
  );

  // Smooth cockpit opacity interpolation
  useFrame((_, delta) => {
    const current = cockpitOpacityRef.current;
    const target = cockpitOpacityTarget;
    if (Math.abs(current - target) > 0.001) {
      cockpitOpacityRef.current += (target - current) * Math.min(delta * 5, 1);
    }
  });

  return (
    <>
      {/* Hero Scene Group */}
      <group visible={showHero}>
        {heroContent}
      </group>

      {/* Cockpit Shell Group — fades to 20% during game (D3D-B6) */}
      <group ref={cockpitGroupRef} visible={showCockpit}>
        {cockpitContent}
      </group>

      {/* Spatial Dashboard Group */}
      <group visible={showSpatial}>
        {spatialContent}
      </group>

      {/* Game Scene Group */}
      <group visible={showGame}>
        {gameContent}
      </group>

      {/* Mechanical Iris Overlay */}
      <group visible={showIris}>
        {irisContent}
      </group>
    </>
  );
}
```

---

## 4. PHASE 2B — Mechanical Iris Transition Component

### 4.1 NEW FILE: `src/components/3d/MechanicalIris.tsx`

Signature D3D-6 transition component. Camera-aperture style mechanical iris with 8 shutter blades, gear ring with 32 instanced teeth, 8 pistons, and 4 light ray cones.

**Triangle budget:** ~100,000 (lightweight transition overlay)

**Animation timeline (iris-open, progress 0→1):**
- 0.0–0.3: Gear ring rotates 45°, pistons extend outward
- 0.1–0.7: 8 shutter blades rotate open (staggered — blade i starts at 0.1 + i×0.02)
- 0.5–0.9: 4 light ray cones grow from center (additive blending)
- 0.9–1.0: Final snap — `easeOutBack` for mechanical settle

**For iris-close:** Progress runs 0→1 but animation direction is reversed.

**Materials:** Chrome MeshStandardMaterial (metalness 0.9, roughness 0.15) with lab-colored emissive tint.

See `src/components/3d/MechanicalIris.tsx` for the complete ~530-line implementation. Key architectural points:

- All geometries memoized via `useMemo`
- Gear teeth use `InstancedMesh` for GPU efficiency
- Animation driven by `useFrame` reading `sceneStore.transition.progress`
- Component self-manages visibility (`groupRef.visible = false` when not transitioning)
- Light rays use additive blending cones with center point light

### 4.2 NEW FILE: `src/hooks/useIrisTransition.ts`

Orchestration hook that drives transition progress via `requestAnimationFrame` and provides API for game entry/exit.

```typescript
import { useEffect, useCallback } from 'react';
import { useSceneStore } from '@/stores/sceneStore';

export function useIrisTransition() {
  const transition = useSceneStore((s) => s.transition);
  const updateProgress = useSceneStore((s) => s.updateTransitionProgress);
  const completeTransition = useSceneStore((s) => s.completeTransition);
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);

  useEffect(() => {
    if (!transition) return;

    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - transition.startedAt;
      const progress = Math.min(elapsed / transition.duration, 1);
      updateProgress(progress);

      if (progress >= 1) {
        completeTransition();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [transition?.startedAt, transition?.duration, updateProgress, completeTransition]);

  const startGameTransition = useCallback(
    (gameId: string, labColor: string) => enterGame(gameId, labColor),
    [enterGame]
  );

  const endGameTransition = useCallback(
    () => exitGame(),
    [exitGame]
  );

  return {
    isTransitioning: !!transition,
    progress: transition?.progress ?? 0,
    type: transition?.type ?? 'none' as const,
    startGameTransition,
    endGameTransition,
  };
}
```

---

## 5. PHASE 2C — CockpitCanvas Refactor

### 5.1 MODIFY: `src/components/3d/CockpitCanvas.tsx` — REPLACE ENTIRELY

Major architectural changes:

1. **DELETED** mobile/WebGL detection `useEffect` (D3D-1)
2. **DELETED** CSS-only fallback branch (D3D-1)
3. **DELETED** game mode CSS frame branch with Canvas unmount (D3D-B1)
4. **DELETED** `isMobile` state, `isWebGLAvailable` state
5. **DELETED** `profile.bloomEnabled` conditional around PostprocessingStack (D3D-5)
6. **REPLACED** `dpr={[1, profile.pixelRatio]}` → `dpr={[1, Math.min(devicePixelRatio, 3)]}` (D3D-4)
7. **ADDED** `logarithmicDepthBuffer: true` to GL config
8. **ADDED** `SceneRouter` integration replacing three separate visibility blocks
9. **ADDED** `MechanicalIris` as iris content in SceneRouter
10. **ADDED** `gameSceneContent` prop for game 3D content
11. **REMOVED** `useUIStore.gameActive` dependency — canvas never unmounts

**Key architectural change:** Instead of three separate `{condition && <group>...}` blocks, everything is wrapped in `<SceneRouter>` which reads from `sceneStore` for visibility.

Canvas config upgraded:
```typescript
<Canvas
  frameloop="always"
  dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 3)]}
  camera={{ position: [0, 6.5, 7], fov: 58, near: 0.1, far: 200 }}
  gl={{
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: true,
  }}
/>
```

See `src/components/3d/CockpitCanvas.tsx` for the complete refactored file (~350 lines, down from 514).

---

## 6. PHASE 2D — GameShell + CameraSystem Updates

### 6.1 MODIFY: `src/components/game/GameShell.tsx` — REPLACE ENTIRELY

GameShell now signals scene transitions via `sceneStore` instead of toggling canvas unmount:

```typescript
'use client';

import { useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';

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
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);

  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    enterGame(gameId, worldColor);
    return () => {
      exitGame();
      resetGame();
    };
  }, [gameId, totalRounds, hints, worldColor, startGame, resetGame, enterGame, exitGame]);

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

// REMOVED (D3D-B1): setGameActive(true/false) — canvas no longer unmounts
// ADDED (D3D-B5): enterGame/exitGame via sceneStore — triggers iris transition
```

### 6.2 MODIFY: `src/components/3d/CameraSystem.tsx`

The `'game'` camera mode now interpolates to a forward-looking game camera position instead of doing nothing:

```typescript
// Added at module level:
const GAME_CAMERA_PRESET = {
  position: new THREE.Vector3(0, 2, 5),
  lookAt: new THREE.Vector3(0, 0, 0),
  fov: 45,
};

// In useFrame, game mode section REPLACED:
if (mode === 'game') {
  const gamePos = GAME_CAMERA_PRESET.position;
  const gameLookAt = GAME_CAMERA_PRESET.lookAt;
  const gameFov = GAME_CAMERA_PRESET.fov;
  const lf = 1 - Math.pow(1 - 0.04, delta * 60);

  cam.position.lerp(gamePos, lf * 0.5);
  currentLookAt.current.lerp(gameLookAt, lf * 0.5);
  cam.lookAt(currentLookAt.current);
  if (Math.abs(cam.fov - gameFov) > 0.01) {
    cam.fov = THREE.MathUtils.lerp(cam.fov, gameFov, lf);
    cam.updateProjectionMatrix();
  }
  return;
}
```

---

## 7. IMPACT SUMMARY — PHASE 2

### Files CREATED (4)

| File | Purpose | Lines |
|------|---------|-------|
| `src/stores/sceneStore.ts` | Centralized scene management (D3D-B5) | ~135 |
| `src/components/3d/SceneRouter.tsx` | Scene group visibility controller | ~80 |
| `src/components/3d/MechanicalIris.tsx` | Signature iris transition (D3D-B2/B4) | ~530 |
| `src/hooks/useIrisTransition.ts` | Transition orchestration hook | ~50 |

### Files MODIFIED (3)

| File | Change | Impact |
|------|--------|--------|
| `src/components/3d/CockpitCanvas.tsx` | Major refactor — persistent canvas, SceneRouter, removed CSS fallbacks | -165 lines, +45 lines |
| `src/components/game/GameShell.tsx` | sceneStore integration replacing uiStore.gameActive | Complete rewrite (simplified) |
| `src/components/3d/CameraSystem.tsx` | Game camera mode interpolation | +15 lines |

### Files DELETED (0)

No files deleted in Phase 2.

### Net Effect

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| R3F Canvas instances during gameplay | 2 (cockpit unmounts, game creates own) | 1 (persistent) | -50% GPU contexts |
| WebGL contexts during gameplay | 2 | 1 | -50% |
| Scene visibility management | Fragmented (3 stores + props) | Centralized (sceneStore) | Unified |
| Cockpit-to-game transition | Canvas unmount + CSS frame | Mechanical iris (600ms) | Signature visual |
| Camera during game mode | Locked (no-op) | Smooth interpolation to game position | Better UX |
| CockpitCanvas render paths | 3 (CSS, game CSS, R3F) | 1 (R3F always) | Simplified |
| CockpitCanvas lines of code | 514 | ~350 | -32% |

---

## 8. EXECUTION CHECKLIST — PHASE 2

This is the build order for implementing Phase 2:

- [ ] **2.1** Create `src/stores/sceneStore.ts`
- [ ] **2.2** Create `src/components/3d/SceneRouter.tsx`
- [ ] **2.3** Create `src/components/3d/MechanicalIris.tsx`
- [ ] **2.4** Create `src/hooks/useIrisTransition.ts`
- [ ] **2.5** Refactor `src/components/3d/CockpitCanvas.tsx` — persistent canvas, SceneRouter integration, remove CSS fallbacks
- [ ] **2.6** Refactor `src/components/game/GameShell.tsx` — sceneStore integration, remove uiStore.gameActive
- [ ] **2.7** Update `src/components/3d/CameraSystem.tsx` — game camera mode interpolation
- [ ] **2.8** `npm run build` — verify clean compilation
- [ ] **2.9** `npx tsc --noEmit` — verify zero type errors
- [ ] **2.10** Commit: `"D3D Phase 2: Single canvas, mechanical iris, scene routing"`

---

## 9. ARCHITECTURE DIAGRAM

```
CockpitCanvas (PERSISTENT — never unmounts)
├─ CameraSystem (mode from sceneStore)
├─ Environment (HDR)
├─ SceneRouter
│   ├─ Hero Group (visible: activeScene === 'hero')
│   │   └─ heroSceneContent
│   ├─ Cockpit Group (visible: activeScene !== 'hero')
│   │   ├─ AuroraBackground
│   │   ├─ AmbientParticles
│   │   ├─ CockpitPanels
│   │   ├─ LEDRim
│   │   ├─ SidePanels
│   │   ├─ HolographicHUD
│   │   └─ StatusBar3D
│   ├─ Spatial Group (visible: activeScene === 'spatial')
│   │   ├─ HolographicLabMap
│   │   ├─ InteractiveConsole3D ×4
│   │   └─ AmbientNPCs
│   ├─ Game Group (visible: activeScene === 'game' or transitioning)
│   │   └─ gameSceneContent
│   └─ Iris Group (visible: isTransitioning && iris type)
│       └─ MechanicalIris
├─ PostprocessingStack (always-on)
│   ├─ Bloom
│   ├─ Vignette
│   └─ BarrelDistortion (conditional)
└─ CSS Overlays (scanline, vignette)
```

### Scene Transition Flow

```
User clicks game card
  → GameShell mounts
    → sceneStore.enterGame(gameId, labColor)
      → activeScene = 'transitioning'
      → transition = { type: 'iris-open', progress: 0 }
      → useIrisTransition drives progress via rAF
        → MechanicalIris animates (600ms)
          → 0.0–0.3: Gear ring rotates, pistons extend
          → 0.1–0.7: Shutter blades open (staggered)
          → 0.5–0.9: Light rays from center
          → 0.9–1.0: Final snap
        → sceneStore.completeTransition()
          → activeScene = 'game'
          → CameraSystem interpolates to game position
          → Cockpit fades to 20% opacity

User completes game
  → GameShell unmounts
    → sceneStore.exitGame()
      → transition = { type: 'iris-close', progress: 0 }
      → MechanicalIris animates in reverse (600ms)
      → sceneStore.completeTransition()
        → activeScene = 'cockpit'
        → Cockpit returns to 100% opacity
```

---

*End of Part B — Desktop-First Immersive 3D Overhaul: Single Canvas & Mechanical Iris*
*Next: Part C — Post-FX, Spatial Audio & Interactivity*
