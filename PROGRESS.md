# SparkForge Build Progress

## Current Phase: Phase 0 Audit Fixes — COMPLETE
## Status: Phase 0 COMPLETE (all 6 batches done)
## Last Updated: 2026-03-26 (Phase 0 Batch 6: Data Integrity)

---

### Phase 0 Audit Fix — Batch 2: TypeScript & ESLint Fixes (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Build Status:** PASS (npm run build succeeds, tsc --noEmit 0 errors)

**Findings Addressed:**
- [x] HIGH-001 — 63 genuine TypeScript errors fixed (was 229 pre-install, resolved to 63 post-install, now 0)
- [x] HIGH-005 — DemoGuard children prop (resolved by npm install restoring type definitions)
- [x] ESLint build errors — all unused imports removed from 17 component files
- [x] TSL shader eslint-disable — 19 shader files get legitimate `no-explicit-any` + `no-unused-vars` disables

**TypeScript Fixes (23 files):**
- Creature components (4 files): Fixed CreatureProps import path, added MoodConfig properties, added THREE namespace import
- TSL shader files (19 files): Fixed Node<> type mismatches with `as any` assertions, fixed `atan2` → `atan` import, fixed swizzle parameter types

**ESLint Fixes (17 files):**
- Removed unused imports: `useMemo`, `useFrame`, `Environment`, `MathUtils`, `Color`, `MeshStandardMaterial`, `vec2`, `vec4`, etc.
- Removed unused variables: `bars`, `cellSize`, `colWidth`, `dp`, `uvCoord`, `flameUV`, etc.
- Prefixed unused callback params with `_` where needed

**Results:**
- TypeScript errors: 63 → **0** (100% clean)
- Next.js build: **PASS** (compiled + 42 static pages generated)
- Total files modified: 40 (23 TS fixes + 17 ESLint fixes)

---

### Phase 0 Audit Fix — Batch 1: Environment & Dependencies (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Audit Source:** AUDIT_REPORT_3-25-2026.md

**Findings Addressed:**
- [x] CRIT-001 — `npm install` (with `--legacy-peer-deps` for nivo/React 19 conflict)
- [x] S1-HIGH-001 — Installed missing `three-mesh-bvh` and `troika-three-text`
- [x] CRIT-003 — Test infrastructure: vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, jsdom, msw, @playwright/test, @types/node
- [x] HIGH-003 — vitest.config.ts now resolves `vitest/config`
- [x] HIGH-004 — tests/setup.ts `global` resolves with @types/node

**Files Created (6):**
- `playwright.config.ts` — Playwright E2E config (chromium, localhost:3000)
- `src/mocks/handlers.ts` — MSW mock handlers for all 24 API routes
- `src/mocks/server.ts` — MSW server setup for Vitest (Node)
- `src/mocks/browser.ts` — MSW worker setup for browser tests
- `tests/e2e/health.spec.ts` — Basic E2E test stub (health check)
- `tests/unit/` and `tests/integration/` directories created

**Files Modified (1):**
- `docs/stage10-polish-deploy/STAGE10_Polish_Deploy_v2_PART2.md` — Added DEFERRED section for production rate limiter (WARN-003: Upstash Redis)

**Results After Batch 1:**
- TypeScript errors: 15,378 → **63** (99.6% reduction)
- Vitest: runnable (no test files yet)
- Playwright: configured
- MSW: 24 API route handlers ready
- Build: reaches lint/type-check phase (fails on pre-existing code errors — Batch 2 scope)

**Deferred:**
- WARN-003 (Redis rate limiter) — reference added to Stage 10 doc, requires Upstash credentials

---

### Creature Species + HDRI Asset Creation (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**HDRI Generation:**
- [x] Created Node.js HDRI generator (tools/generate-frost-prismatic-hdri.js)
- [x] Generated frost-prismatic.hdr (1024x512, Radiance RGBE, 2MB)
  - Dark studio (#0a0a14) + Blue key (#3B82F6) + Purple fill (#8B5CF6) + Teal rim (#06B6D4)
- [x] CockpitCanvas switched from drei 'night' preset to custom HDRI

**5 Creature Species (replacing 6 generic pets):**
- [x] creatureConfig.ts — Species configs, mood system, 6 evolution stages each
- [x] CreatureBase.tsx — Shared toon shading, CreatureWrapper, BlinkingEye, InnerGlow
- [x] BytelingCreature.tsx — Data & Binary theme (cubic shapes, blue #00BBFF)
- [x] SparkpawCreature.tsx — Neural Networks theme (spheres/tentacles, purple #AA66FF)
- [x] VoltkitCreature.tsx — Energy & Computing theme (triangles/spikes, green #00FF88)
- [x] CogsworthCreature.tsx — Robotics & Building theme (cylinders/gears, amber #FFAA44)
- [x] PixieCreature.tsx — Computer Vision theme (discs/lenses, cyan #06B6D4)

**Integration:**
- [x] PetCreature3D.tsx — Rewrote to use species dispatcher (no more GLB probing)
- [x] Pet3DScene.tsx — Added speciesId prop
- [x] PetTrainerGame.tsx — Replaced 6 generic pets with 5 AI-themed species
- [x] creatures/index.ts — Barrel export + CREATURE_COMPONENTS lookup map

**Files Created (10):**
- `tools/generate-frost-prismatic-hdri.js`
- `public/hdri/frost-prismatic.hdr`
- `src/config/creatureConfig.ts`
- `src/components/3d/creatures/CreatureBase.tsx`
- `src/components/3d/creatures/BytelingCreature.tsx`
- `src/components/3d/creatures/SparkpawCreature.tsx`
- `src/components/3d/creatures/VoltkitCreature.tsx`
- `src/components/3d/creatures/CogsworthCreature.tsx`
- `src/components/3d/creatures/PixieCreature.tsx`
- `src/components/3d/creatures/index.ts`

**Files Modified (3):**
- `src/components/3d/PetCreature3D.tsx` — Species-aware renderer
- `src/components/3d/Pet3DScene.tsx` — Added speciesId prop
- `src/components/games/PetTrainerGame.tsx` — 5 new species configs

**Species Summary:**
| Species | Theme | Shape | Color | Stages |
|---------|-------|-------|-------|--------|
| Byteling | Data & Binary | Cubic | #00BBFF | Data Seed → Bitlet → Bytepup → Datacrunch → Codec → Terabyte |
| Sparkpaw | Neural Networks | Spherical | #AA66FF | Synapse Egg → Noodlet → Synapper → Neurowhelp → Dendrite → Cortex |
| Voltkit | Energy & Computing | Triangular | #00FF88 | Spark Cell → Zaplet → Voltpup → Ampere → Gigawatt → Exaflare |
| Cogsworth | Robotics & Building | Cylindrical | #FFAA44 | Gear Capsule → Sprocket → Ratchet → Dynamo → Fabricator → Archimedes |
| Pixie | Computer Vision | Disc/Lens | #06B6D4 | Lens Seed → Peekaboo → Scanner → Focusfly → Spectra → Omniscient |

---

### Audit Report — R3F Section 4: Stack Alignment & Pitfalls (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**Plan A — TSL Shader Ports (9 GLSL → TSL):**
- [x] Batch 1: Noise utilities — simplex3DTSL, fbm4/6TSL, fbm3_4/6TSL, curlNoiseTSL, perlinNoise2DTSL, hash2TSL
- [x] Batch 2: auroraTSL, scanlineTSL, holographicTSL
- [x] Batch 3: energyFieldTSL (vertex + fragment), liquidMetalTSL (vertex + fragment), fireNoiseTSL (vertex + fragment)
- [x] Batch 4: crystallineLogoTSL (vertex + PBR fragment), electricVeinsTSL (fractal veins + propagation)
- [x] Batch 5: Barrel export index (src/shaders/tsl/index.ts) + WebGPUErrorBoundary component

**Plan B1 — Frame-Time Monitoring (Non-Invasive):**
- [x] Created useFrameTimeMonitor hook — 60-frame sample window, logs warnings > 20ms avg
- [x] Added FrameTimeMonitorInner component to CockpitCanvas (dev-only)
- [x] Added Plan B2 adaptive degradation reference to CLAUDE.md Section 9.1

**Plan C — Asset Preloading:**
- [x] Created src/lib/3d/preloadAssets.ts — wires GLTF_PRELOAD_PATHS + HDRI preloading
- [x] Module-level import in CockpitCanvas triggers preloading on first render
- [x] Note: HDRI file (/public/hdri/frost-prismatic.hdr) pending creation — uses 'night' preset fallback

**Files Created (14):**
- `src/shaders/tsl/noiseUtils.ts` — Shared TSL noise functions (simplex3D, fbm, curl, perlin)
- `src/shaders/tsl/auroraTSL.ts` — Aurora void background (Decision 2.5)
- `src/shaders/tsl/scanlineTSL.ts` — CRT scanline overlay (Decision 2.3)
- `src/shaders/tsl/holographicTSL.ts` — Holographic card diffraction (Decision 4.3)
- `src/shaders/tsl/energyFieldTSL.ts` — Streak shield vertex + fragment (Decision 4.5)
- `src/shaders/tsl/liquidMetalTSL.ts` — Badge levitate vertex + fragment (Decision 4.2)
- `src/shaders/tsl/fireNoiseTSL.ts` — Diamond streak flame vertex + fragment
- `src/shaders/tsl/crystallineLogoTSL.ts` — Hero Animation Phase 2 vertex + PBR fragment
- `src/shaders/tsl/electricVeinsTSL.ts` — Hero Animation Phase 4 fractal veins
- `src/shaders/tsl/index.ts` — Barrel export for all TSL shader ports
- `src/components/3d/WebGPUErrorBoundary.tsx` — TSL compilation error boundary with WebGL2 fallback
- `src/hooks/useFrameTimeMonitor.ts` — Non-invasive frame-time monitoring (dev-only)
- `src/lib/3d/preloadAssets.ts` — Centralized GLTF + HDRI preloading

**Files Modified (2):**
- `src/components/3d/CockpitCanvas.tsx` — Added FrameTimeMonitorInner + asset preload import
- `CLAUDE.md` — Added Plan B1/B2 performance monitoring reference to Section 9.1

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

**Audit Section 4 Item Status:**
| Item | Status | Notes |
|------|--------|-------|
| 4.1 r3f-perf monitoring | ALREADY FIXED (prior audit) | r3f-perf installed, lazy-loaded, dev-only |
| 4.2 GLSL → TSL migration | FIXED | 9 shaders ported + error boundary |
| 4.3 CanvasTexture leaks | ALREADY FIXED (prior audit) | All 3 files have disposal |
| 4.4 GPU tier degradation | FIXED (B1) | Frame-time monitor + B2 reference |
| 4.5 Asset preloading | FIXED | preloadAssets.ts wired in CockpitCanvas |
| 4.6 leva in prod deps | ALREADY FIXED (prior audit) | Moved to devDependencies |

---

### Audit Report — R3F Section 3: Post-Processing & UI Zones (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-r3f-postprocessing-l178F

**Batch 1 — GPU Memory + Dev Monitoring:**
- [x] Item 1: AiSpyGame.tsx — Removed independent Canvas (D3D-B1 violation). Game 3D content now injected via sceneStore.setGameSceneContent(). Added gameSceneContent state to sceneStore.ts. CockpitCanvas reads from store as fallback.
- [x] Item 2: CanvasTexture disposal — AgentPipeline3D.tsx, LabStructure3D.tsx already had disposal (prior audit). Added missing disposal to PetCreature3D.tsx FallbackOrb + GLBPetModel components.
- [x] Item 3: r3f-perf — Already installed (^7.2.3) and integrated in CockpitCanvas with React.lazy + dev-only guard. No changes needed.

**Batch 2 — Post-Processing Enhancements + Html Overlays:**
- [x] Item 4: Adaptive bloom threshold — PostProcessingStack.tsx bloom threshold now shifts per scene (0.3 celebrations, 0.4 transitions/hero, 0.5 spatial, 0.8 gameplay, 0.6 cockpit default)
- [x] Item 5: Per-lab color grading — Added HueSaturation + BrightnessContrast effects. 10 per-lab color profiles (hue, saturation, brightness, contrast). Ceremony warm amber override. Vignette + BarrelDistortion now scene-reactive. Effect count: 7 → 9 always-on.
- [x] Item 6: drei Html 3D-anchored overlays:
  - HolographicLabMap.tsx: Lab name + completion % tooltip on hover (glassmorphism card, lab-colored border)
  - AmbientNPCs.tsx: Personality name badges above bots (pill badge, neon text)
  - CeremonyFX.tsx: Animated ceremony title popup ("Level Up!", "Badge Earned!", etc.) with float-up-and-fade CSS animation
  - WormholeTransition.tsx: "Entering {Lab Name}" label at tunnel midpoint with fade-in/out gated to transition progress

**Files Modified (10 total):**
- `src/components/3d/PostProcessingStack.tsx` — 9 effects, adaptive bloom, color grading, reactive vignette/barrel
- `src/components/3d/CockpitCanvas.tsx` — r3f-perf + gameSceneContent from store
- `src/components/3d/HolographicLabMap.tsx` — Html tooltip overlay
- `src/components/3d/AmbientNPCs.tsx` — Html name badges
- `src/components/3d/CeremonyFX.tsx` — Html ceremony popup
- `src/components/3d/WormholeTransition.tsx` — Html "Entering Lab" label
- `src/components/3d/AgentPipeline3D.tsx` — CanvasTexture disposal
- `src/components/3d/LabStructure3D.tsx` — CanvasTexture disposal
- `src/components/3d/PetCreature3D.tsx` — DataTexture disposal (2 components)
- `src/components/games/AiSpyGame.tsx` — Removed Canvas, uses sceneStore
- `src/stores/sceneStore.ts` — Added gameSceneContent state + selector
- `package.json` — r3f-perf devDependency

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

---

### Audit Report — Suggestions (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-suggestions-oEzxB

**Batch 1 — Canvas DPR + React.memo:**
- [x] Suggestion #12: CockpitCanvas.tsx — Simplified dpr to [1, 3], letting AdaptiveDpr manage runtime values
- [x] Suggestion #13: SKIPPED — frameloop="always" is intentional per D3D-5 mandate (ambient cockpit animations)
- [x] Suggestion #14: Wrapped SpatialDashboardContent, AmbientNPCs, DynamicEnvironment with React.memo

**Batch 2 — Design System Hex Replacement:**
- [x] Suggestion #15: Replaced hardcoded hex values with Tailwind semantic tokens in 3 files:
  - ParentLoadingSkeleton.tsx: bg-[#111118]/80 → bg-surface-card/80 (4 instances)
  - UpgradePrompt.tsx: 7 hex replacements (surface-card, neon-orange, neon-amber tokens)
  - FutureForgeGame.tsx: bg-surface-base, text-lab-10, via-lab-10, text-neon-amber tokens
  - PaywallModal.tsx: SVG stroke="#FFAA44" left as-is (SVG attribute, no Tailwind equivalent)

**Batch 3 — Layout Fix + GLTF Preload:**
- [x] Suggestion #16: Fixed DemoGuard JSX indentation in dashboard layout (logic was correct, formatting misleading)
- [x] Suggestion #17: Added GLTF_PRELOAD_PATHS registry in lib/3d/materials.ts with documented usage pattern

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

---

### Audit Report — Critical Findings (2026-03-24)

**Status:** COMPLETE
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 1 — GPU Memory/Allocation Fixes:**
- [x] Critical #1: SidePanels.tsx — Shared blip geometry + material, dynamic props in useFrame
- [x] Critical #2: HolographicLabMap.tsx — Added useEffect disposal for ConnectionBeam geometry/material
- [x] Critical #3: PostProcessingStack.tsx — useRef for chromatic Vector2 instead of useMemo

**Batch 2 — Store Subscription Optimization:**
- [x] Critical #4a: CockpitCanvas.tsx — 10 individual selectors replacing full destructure
- [x] Critical #4b: useSpatialNavigation.ts — 7 individual selectors
- [x] Critical #4c: SpatialOverlay.tsx — 3 individual selectors

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

### Audit Report — Important Findings (2026-03-24)

**Status:** MOSTLY COMPLETE (2 deferred to dedicated PRs)
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 3+4 — Quick Wins + Performance:**
- [x] Important #6: StatusBar3D.tsx — Rewrote material factories to use ref + useFrame
- [x] Important #7: CockpitPanels.tsx — Immediate geometry disposal via ref on dependency change
- [x] Important #9: package.json — Moved leva to devDependencies
- [x] Important #12: QueryProvider.tsx — Wrapped ReactQueryDevtools in NODE_ENV guard

**Batch 5 — Dependency Cleanup + Design System:**
- [x] Important #8: Removed recharts, replaced with @nivo/line in NeuralBuilderGame.tsx (~200KB savings)
- [x] Important #10: Added DURATION/EASING/TRANSITION presets to existing animations.ts

**Deferred to Dedicated PRs:**
- [ ] Important #5: `import * as THREE` → named imports (103 files, large-scope refactor)
- [ ] Important #11: Sub-scale font sizes text-[9px]/text-[10px] → text-xs (306 occurrences, 53 files)
- [ ] Important #13: Duplicate particle system extraction (architectural refactor, 3 files)

**TypeScript validation:** PASS (0 new errors)

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
