# SparkForge Build Progress

## Current Phase: 3 — Stage 2 Parts 1-4 (Database & API)
## Status: NOT STARTED
## Last Updated: 2026-03-24 (D3D Phase 4B — Error Analysis & Discrepancy Catalog)

---

### Local Development Environment Setup (March 21, 2026)

**Status:** COMPLETE
**Branch:** claude/sparkforge-stage1-foundation-LBQEo

**Environment:**
- Node.js v25.8.1, npm 11.11.0
- `npm install --legacy-peer-deps` — all dependencies installed
- `.env.local` — created with placeholder values (keys not yet configured)
- `npm run build` — compiles successfully (lint cleanup in progress)

**Note:** All prior code in this repo was written directly on GitHub (not built or tested locally). Local development begins now from Stage 1 Phase 1. The project is at **0% built/developed** — no stages have been locally validated or run.

---

### Build Execution Plan (30 Phases)

- [x] Phase 1 — Stage 1 Part 1: Foundation config & structure (verified + fixed 2026-03-22)
- [x] Phase 2 — Stage 1 Part 2: TypeScript source files (verified + fixed 2026-03-22)
- [ ] Phase 3 — Stage 2 Parts 1-4: Database & API (HS-1, HS-7)
- [ ] Phase 4 — Stage 3 Parts 1-2: Auth & Layout
- [ ] Phase 5 — Stage 3 Part 3: Station Frame (v3-FINAL)
- [ ] Phase 5A — Hero Animation Part 1: Stores, infrastructure, shaders
- [ ] Phase 5B — Hero Animation Part 2: Particles, audio, orchestrator (HS-5)
- [ ] Phase 5C — Cockpit Architecture Part 1: Canvas, camera, panels
- [ ] Phase 5D — Cockpit Architecture Part 2: Spatial dashboard, transitions (HS-5, HS-9)
- [ ] Phase 6 — Stage 4 Parts 1+3: Core pages
- [ ] Phase 7 — Stage 4 Part 2: v3-FINAL
- [ ] Phase 8 — Stage 5 Part 1: Gamification & profile
- [ ] Phase 9 — Stage 5 Parts 2-3: v3-FINAL
- [ ] Phase 10 — Stage 6B: Flagship game (HS-8)
- [ ] Phase 11 — Stage 6C: Flagship game
- [ ] Phase 12 — Stage 6D: Flagship game
- [ ] Phase 13 — Stage 6E: Flagship game
- [ ] Phase 14 — Stage 6F: Flagship game
- [ ] Phase 15 — Stage 7A: 9 games
- [ ] Phase 16 — Stage 7B: 4 games
- [ ] Phase 17 — Stage 7C: 4 games (v2)
- [ ] Phase 18 — Stage 7C: 2 games (v3)
- [ ] Phase 19 — Stage 7D: 5 games
- [ ] Phase 20 — Stage 7E: 3 games
- [ ] Phase 21 — Stage 7F: 3 games
- [ ] Phase 22 — Stage 7 Shared systems
- [ ] Phase 23 — Stage 8 Parts 1-2: Parent dashboard (HS-2)
- [ ] Phase 24 — Stage 8 Part 3: v3-FINAL
- [ ] Phase 25 — Stage 9 Parts 1-3: Content agent (HS-3)
- [ ] Phase 26 — Stage 10 Parts 1-2: Polish & deploy (HS-4)

---

### Completed
- [x] Stage 1 Part 1 — Foundation config & structure (verified 2026-03-22)
- [x] Stage 1 Part 2 — TypeScript source files (verified 2026-03-22)

### Current Issues
_(none)_

### Blocked On
_(none)_

### Discrepancies Log (March 22, 2026)

**Phase 1 fixes:**
- `next.config.js` → `next.config.ts`: Replaced Stage 10 production config with Stage 1 starter per build order. Added Sentry wrapper, GLSL loaders, Turbopack rules.
- `.gitignore`: Added missing test/Sentry entries (test-results/, playwright-report/, blob-report/, .sentryclirc).
- Created 8 missing directories: public/images, public/sounds/cockpit, public/fonts, public/models/pets, tests/unit, tests/integration, tests/e2e, tests/mocks.

**Phase 2 fixes:**
- `src/types/index.ts`: Added missing CPA v2.0 types (CockpitSkin, SpatialView, ConsoleType, CeremonyType, HUDDataMode, CameraTarget, HexClusterData).
- `src/lib/animations.ts`: Fixed import from `framer-motion` to `motion/react` per Enhancement 8.1.
- Created 5 missing files: `src/stores/cockpitAtoms.ts`, `src/lib/3d/webgpuDetect.ts`, `src/hooks/useAdaptiveCockpit.ts`, `vitest.config.ts`, `tests/setup.ts`.

### Desktop-First 3D Overhaul (D3D) — March 23, 2026

**Status:** PLAN COMPLETE (4 parts, 20 decision locks, 13 files)
**Branch:** `claude/3d-immersive-overhaul-plan-JyUZL`

| Part | Commit | Files | Decision Locks | Status |
|------|--------|-------|----------------|--------|
| A — Foundation Cleanup | `db18293` | 1 doc | D3D-1 through D3D-9 (9) | COMMITTED |
| B — Single Canvas & Iris | `93cd13e` | 4 src + 1 doc | D3D-B1 through D3D-B6 (6) | COMMITTED |
| C — Post-FX & Audio | `d923968` | 4 src + 1 doc | D3D-C1 through D3D-C5 (5) | COMMITTED |
| D — Doc Updates & Roadmap | `6d7dc6d` | 1 doc + CLAUDE.md v6.0 | 0 | Phase 4A COMMITTED, 4B COMMITTED |

**Source files created (8):**
- `src/stores/sceneStore.ts` — Centralized scene management
- `src/components/3d/SceneRouter.tsx` — Scene group visibility controller
- `src/components/3d/MechanicalIris.tsx` — Signature iris transition (530 lines)
- `src/hooks/useIrisTransition.ts` — Transition orchestration hook
- `src/components/3d/PostProcessingStack.tsx` — 7 always-on effects
- `src/lib/audio/irisAudio.ts` — Iris procedural audio
- `src/hooks/useParallaxMouse.ts` — Mouse parallax tracking
- `src/hooks/useInteractiveSurface.ts` — Hover-reactive surfaces

**Modified files (3):**
- `src/components/3d/CockpitCanvas.tsx` — Persistent canvas, SceneRouter, removed CSS fallbacks
- `src/components/game/GameShell.tsx` — sceneStore integration
- `src/components/3d/CameraSystem.tsx` — Game camera mode

**Key architecture changes:**
- Single persistent R3F Canvas (never unmounts, even during gameplay)
- Mechanical iris transition replaces canvas unmount pattern
- sceneStore centralizes visibility (replaces fragmented uiStore.gameActive + cockpitStore.heroPhase)
- 7 post-processing effects always-on with scene-reactive multipliers
- Procedural iris audio (Web Audio API)
- Mouse parallax + interactive surface hooks

### D3D Phase 4B — Error Analysis & Discrepancy Catalog (March 24, 2026)

#### Stage Documents Requiring D3D Updates (During Build)

These discrepancies exist between existing stage docs and the D3D architecture. Each will be resolved when its stage is built — NOT pre-emptively.

| Stage Doc | Discrepancy | Resolution |
|-----------|-------------|-----------|
| All 35 game stage docs (6B–7F) | Contain `useIsMobile()` pattern and conditional 3D rendering | Remove during build per D3D-1. Games render 3D unconditionally. |
| All 3D component stage docs | Import `useLOD` / `LODWrapper` / `useLODContext` | Remove during build, hardcode ultra-quality values (D3D-2). |
| Stage 3 Part 3 | Creates StationFrame with separate Canvas | Use CockpitCanvas with SceneRouter instead (D3D-B1). |
| Stage 6B–7F (all games) | Games create own `<Canvas>` for 3D scenes | Render as `<group>` inside CockpitCanvas via GameShell (D3D-B3). |
| Stage 4 Part 1 | `useApi.ts` references | BUG-1 already documented, no D3D impact. |
| CockpitCanvas stage docs (5C–5D) | References `profile.bloomEnabled` conditional rendering | Remove conditional — PostProcessingStack is always-on (D3D-5, D3D-C1). |
| GameShell stage docs | References `setGameActive(true/false)` from uiStore | Replace with `sceneStore.enterGame`/`exitGame` (D3D-B5). |
| Hero Animation docs (5A–5B) | HeroAnimation may create separate Canvas | Must render as scene within CockpitCanvas (D3D-B1). |
| Login 3D docs (5E–5F) | LoginPortal3D creates own Canvas | Login page is pre-auth — this Canvas is acceptable (outside CockpitCanvas scope). No D3D change needed. |

#### Files With Stale References (Fix During Stage Build)

These files contain references that D3D supersedes. They are NOT broken (old code still works), but will be updated during their respective stage builds:

| Pattern | Occurrences | Files Affected | D3D Replacement |
|---------|------------|----------------|----------------|
| `useIsMobile` | ~401 | 84 files | Remove entirely (D3D-1) |
| `useLOD` / `LODWrapper` / `useLODContext` | ~30 | 15 files | Remove, hardcode ultra (D3D-2) |
| `GenericGameParticles` | ~35 | 35 game files | Remove CSS fallback (D3D-1) |
| `setGameActive` | ~4 | GameShell, uiStore, CockpitCanvas | Use `sceneStore.enterGame`/`exitGame` (D3D-B5) |
| `profile.bloomEnabled` | ~3 | CockpitCanvas, 2 config files | Always true — remove conditional (D3D-5) |
| `DeviceSelectionModal` | ~2 | Provider, settings page | Remove entirely (D3D-1) |
| `useAdaptiveLOD` | ~5 | LODWrapper, 3D game components | Remove entirely (D3D-2) |
| `lodSphere` / `lodBox` | ~10 | 3D components | Replace with hardcoded max segments (D3D-2) |

#### Non-Breaking Deprecations

These patterns still function but are superseded by D3D architecture:

| Deprecated | Replacement | Impact |
|-----------|-------------|--------|
| `uiStore.gameActive` | `sceneStore.activeScene === 'game'` | uiStore flag still exists but no longer read by CockpitCanvas |
| `cockpitStore.heroPhase` | `sceneStore.activeScene === 'hero'` | cockpitStore retains `heroPhase` for HeroAnimation internal state machine |
| `WormholeTransition` (cockpit-to-game) | `MechanicalIris` | WormholeTransition retained for lab-to-lab transitions within spatial dashboard |
| Inline postprocessing in CockpitCanvas | `PostProcessingStack` component | Old inline EffectComposer replaced by extracted component (D3D-C1) |
| `deviceStore.profile.bloomEnabled` | Always `true` | Profile property still exists but is always `true` |
| `deviceStore.hasSelected` | Always `true` | No device selection flow exists |

#### Import Graph Changes

| Import Change | Affected Consumers | Notes |
|---------------|-------------------|-------|
| `sceneStore` added | CockpitCanvas, SceneRouter, GameShell, MechanicalIris, PostProcessingStack | New central state for scene management |
| `useLOD` removed | All 3D game components, LODWrapper, GameShell | Consumers must remove import and inline ultra values |
| `useIsMobile` removed | 84 files across games, layouts, 3D components | Consumers must remove import and conditional blocks |
| `GenericGameParticles` removed | 35 game files | Consumers must remove import and mobile fallback rendering |
| `PostProcessingStack` added | CockpitCanvas | Single consumer, replaces inline effects |
| `irisAudio` added | MechanicalIris (via useIrisTransition) | Procedural audio for iris open/close |

### Section 4.2 — Procedural Environment Generation (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/procedural-environment-generation-8glJx`

**Architecture:** ProceduralEnvironmentGenerator orchestrates 5 sub-generators (Terrain, SkyDome, Fog, Lighting, Props) driven by 10 lab theme profiles and 3 tier configs. All 3 base environment wrappers (Standard, FL-Lite, Flagship) refactored to delegate internally — zero breaking changes to 35 existing game environments.

| Batch | Commit | Files | Status |
|-------|--------|-------|--------|
| 1 — Core config + sub-generators | `9269743` | 6 created (proceduralConfig.ts + 5 procedural/*.tsx) | COMMITTED |
| 2 — Generator + integration | `d554608` | 2 created + 4 modified (generator, index, 3 base wrappers) | COMMITTED |
| 3 — Documentation updates | — | 3 modified (PROGRESS.md, CLAUDE.md, PartD.md) | COMMITTED |

**Files created (8):**
- `src/lib/3d/proceduralConfig.ts` — 10 lab themes, 3 tier configs, seeded RNG, type definitions
- `src/components/3d/environments/procedural/ProceduralTerrain.tsx` — Seeded FBM noise terrain + grid floor
- `src/components/3d/environments/procedural/ProceduralSkyDome.tsx` — Gradient sky, star field, aurora
- `src/components/3d/environments/procedural/ProceduralFog.tsx` — 5 fog behaviors (drift/sparkle/swirl/pulse/rise)
- `src/components/3d/environments/procedural/ProceduralLighting.tsx` — Auto-scaled lighting rig
- `src/components/3d/environments/procedural/ProceduralProps.tsx` — 10 geometry types, instanced scatter
- `src/components/3d/environments/procedural/index.ts` — Barrel export
- `src/components/3d/environments/ProceduralEnvironmentGenerator.tsx` — Main orchestrator

**Files modified (4):**
- `src/components/3d/environments/StandardEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='standard')
- `src/components/3d/environments/FLLiteEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='fl-lite')
- `src/components/3d/environments/FlagshipEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='flagship')
- `src/components/3d/environments/index.ts` — Added ProceduralEnvironmentGenerator export

**Key decisions:**
- Q1: Replace base wrappers (Option B) — procedural system is internal, external API unchanged
- Q2: 10 lab theme profiles approved (digital-detection through quantum-frontier)
- Q3: Game tier only (Option A) — triangle budget scales by Standard/FL-Lite/Flagship

### Section 4.1 — Near-Term Enhancements (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/build-section-4.1-CQSdv`
**Source:** `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartD.md` Section 4.1

All 7 near-term enhancements from the D3D roadmap have been implemented:

| Enhancement | ID | Effort | Status | Commit |
|------------|-----|--------|--------|--------|
| WebGPU Shader Ports | A | Medium | COMPLETE | `f5f3519` |
| Per-Game Camera Presets | B | Low | COMPLETE | `378b91c` |
| Iris Audio Integration | C | Low | COMPLETE | `710714b` |
| CockpitCanvas Parallax | D | Low | PRE-EXISTING | (already wired in D3D Part C) |
| Interactive Surface Deployment | E | Medium | COMPLETE (stubs) | `80f1d2f` |
| Transition Sound Variations | F | Low | COMPLETE | `710714b` |
| Camera Shake on Events | G | Low | COMPLETE | `710714b` |

**Files created (14):**
- `src/shaders/labPatterns/tsl/shared.ts` — TSL shared utilities (rand2D, simplex2D)
- `src/shaders/labPatterns/tsl/codeLab.ts` — Lab 1 TSL pattern
- `src/shaders/labPatterns/tsl/dataLab.ts` — Lab 2 TSL pattern
- `src/shaders/labPatterns/tsl/neuralLab.ts` — Lab 3 TSL pattern
- `src/shaders/labPatterns/tsl/createLab.ts` — Lab 4 TSL pattern
- `src/shaders/labPatterns/tsl/agentLab.ts` — Lab 5 TSL pattern
- `src/shaders/labPatterns/tsl/ethicsLab.ts` — Lab 6 TSL pattern
- `src/shaders/labPatterns/tsl/visionLab.ts` — Lab 7 TSL pattern
- `src/shaders/labPatterns/tsl/languageLab.ts` — Lab 8 TSL pattern
- `src/shaders/labPatterns/tsl/buildLab.ts` — Lab 9 TSL pattern
- `src/shaders/labPatterns/tsl/frontierLab.ts` — Lab 10 TSL pattern
- `src/shaders/labPatterns/tsl/index.ts` — Barrel export with lookup helpers
- `src/lib/3d/cameraShake.ts` — Camera shake controller with event presets
- `src/lib/3d/interactiveSurfaceConfig.ts` — Cockpit interactive surface presets

**Files modified (5):**
- `src/lib/audio/irisAudio.ts` — Lab color audio profiles (10 colors → frequency/filter variations)
- `src/hooks/useIrisTransition.ts` — Integrated iris audio lifecycle (was in CockpitCanvas)
- `src/components/3d/CameraSystem.tsx` — Per-game camera presets + shake offset
- `src/components/3d/CockpitCanvas.tsx` — Game preset lookup, removed redundant audio code
- `src/config/gameRegistry.ts` — Added cameraPreset field to all 35 games

### Code Review Notes
_(none yet)_
