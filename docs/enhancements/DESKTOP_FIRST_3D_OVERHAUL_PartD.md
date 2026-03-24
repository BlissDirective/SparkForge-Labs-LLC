# Desktop-First Immersive 3D Overhaul — Part D

## Document Updates, Error Analysis & Enhancement Ideas

**Version:** 1.0 | **Date:** March 23, 2026 | **Author:** Claude Code
**Scope:** Phase 4 of 4 — Update CLAUDE.md, PROGRESS.md, and stage documents to reflect D3D architecture. Catalog known discrepancies. Propose future enhancements.
**Depends On:** Part A (D3D-1 through D3D-9) + Part B (D3D-B1 through D3D-B6) + Part C (D3D-C1 through D3D-C5)

---

## 1. OVERVIEW

This document is **Part D** of the 4-part Desktop-First Immersive 3D Overhaul. Part A removed constraints, Part B consolidated the canvas architecture, Part C added immersive post-processing and interactivity. Part D now documents all required updates to project documentation, catalogs discrepancies, and proposes future enhancements.

### Part Map

| Part | Title | Scope |
|------|-------|-------|
| **A** | Foundation Cleanup | Remove mobile/LOD/CSS fallbacks. Hardcode desktop-ultra. |
| **B** | Single Canvas & Mechanical Iris | Persistent CockpitCanvas, SceneStore, SceneRouter, MechanicalIris. |
| **C** | Post-FX, Audio & Interactivity | Full EffectComposer, iris audio, mouse parallax, interactive surfaces. |
| **D (this)** | Document Updates & Error Analysis | Stage .md updates, CLAUDE.md updates, error analysis, enhancement ideas. |

### Part D Phases

| Phase | Name | Scope |
|-------|------|-------|
| **4A** | CLAUDE.md Updates | Update Sections 7, 9, 11, 14 to reflect D3D architecture changes (new stores, removed LOD, new components, updated triangle budgets, new decision locks) |
| **4B** | Error Analysis & Discrepancy Catalog | Document all known discrepancies between existing stage docs and D3D architecture, catalog files that will need updates when stages are built |
| **4C** | Enhancement Roadmap | Future ideas building on D3D foundation (WebGPU shader ports, procedural environment generation, advanced particle physics, VR readiness) |

---

## 2. PHASE 4A — CLAUDE.md Updates Required

The following sections of CLAUDE.md require updates to reflect the D3D architecture. These are documented as **specifications** — the actual edits will be applied when the D3D overhaul is executed during stage builds, not during the planning phase. This prevents plan documents from conflicting with the current build state.

### 2.1 Section 7 — Game Architecture Template

Current template shows:

```typescript
const Component3D = dynamic(() => import(...), { ssr: false });
function useIsMobile() { ... }
{!isMobile && <Component3D />}
```

**D3D update:** Remove `useIsMobile` pattern entirely. Games render 3D unconditionally. Replace with:

```typescript
const Component3D = dynamic(() => import(...), { ssr: false });
// 3D always renders — desktop-only (D3D-1)
<Component3D {...props} />
```

Remove all references to:
- `useIsMobile()` hook
- `GenericGameParticles` CSS fallback
- Mobile conditional rendering `{!isMobile && ...}`

### 2.2 Section 9 — 3D Architecture Rules

**Lines to REMOVE:**

| Current Line | Reason |
|-------------|--------|
| "Mobile fallback: `useIsMobile()` → component returns `null` on mobile" | D3D-1: No mobile code paths |
| "CSS 2D fallback remains fully functional when 3D is hidden" | D3D-1: No CSS fallbacks |
| "LOD is MANDATORY — every 3D component must use `useLOD()` hook or `<LODWrapper>`" | D3D-2: LOD system removed |
| "Device-adaptive FPS — `deviceStore` drives FPS targets (desktop 60, tablet 45, mobile 30)" | D3D-1: Single desktop target |

**Lines to ADD:**

| New Line | Decision |
|----------|----------|
| "Desktop-only rendering (D3D-1) — no mobile/tablet code paths" | D3D-1 |
| "All effects always-on (D3D-5) — no conditional postprocessing" | D3D-5 |
| "Single persistent Canvas (D3D-B1) — CockpitCanvas never unmounts" | D3D-B1 |
| "Scene management via sceneStore (D3D-B5) — centralized visibility control" | D3D-B5 |
| "Mechanical iris transitions (D3D-B2) — cockpit-to-game via MechanicalIris" | D3D-B2 |
| "Triangle budgets: Flagship 20M, FL-Lite 10M, Standard 5M, System 30M (D3D-3)" | D3D-3 |

### 2.3 Section 9.1 — LOD Architecture (Full Replacement)

**Entire section should be replaced** with:

```markdown
### 9.1 Desktop-Ultra Rendering (D3D-1, D3D-2)

LOD system has been removed (D3D-2). All geometry renders at maximum quality always.
No DeviceSelectionModal, no tiered budgets, no useLOD hook.
deviceStore hardcodes desktop-ultra profile with 50M total triangle budget.

Future mobile support will use R3F-native LOD (Three.js LOD object), not CSS fallbacks.

#### Desktop-Ultra Profile

| Property | Value |
|----------|-------|
| Target FPS | 60 |
| Max Triangles | 50,000,000 (30M cockpit + 20M game) |
| Bloom | Always on |
| Shadows | Always on |
| Pixel Ratio | Native (`window.devicePixelRatio`) |
| SSAO | Always on |
| Chromatic Aberration | Always on |
| Depth of Field | Always on |
```

### 2.4 Section 9.2 — Game Tier Triangle Budgets

**Update table to D3D-3 values:**

| Tier | Before | After | Multiplier |
|------|--------|-------|-----------|
| Flagship | 10M | 20M | 2x |
| FL-Lite | 2M | 10M | 5x |
| Standard | 500K | 5M | 10x |
| System (Cockpit) | 20M | 30M | 1.5x |
| **Total** | **32.5M** | **50M** | |

### 2.5 Section 9.3 — Cockpit Architecture Update

Add reference to D3D-B series decisions:

| Addition | Decision |
|----------|----------|
| CockpitCanvas now uses SceneRouter for visibility management | D3D-B4 |
| MechanicalIris replaces WormholeTransition for cockpit-to-game transitions | D3D-B2 |
| sceneStore replaces fragmented state management | D3D-B5 |
| Cockpit fades to 20% opacity during game scenes | D3D-B6 |
| Game scenes render as `<group>` inside CockpitCanvas | D3D-B3 |

Note: WormholeTransition is retained for lab-to-lab transitions within the spatial dashboard.

### 2.6 Section 11 — Bug Registry Additions

Add the following entries:

| ID | Issue | Fix | Stage |
|----|-------|-----|-------|
| D3D-CANVAS-PERSIST | CockpitCanvas unmounted during gameplay (FIX-DUAL-CANVAS) | **SUPERSEDED** by D3D-B1: Canvas now persists. GameShell uses `sceneStore.enterGame`/`exitGame` instead of `setGameActive`. | D3D Part B |
| D3D-LOD-REMOVED | LOD system (`useLOD`, `LODWrapper`) removed | **RESOLVED** by D3D-2: All geometry at max quality. `deviceStore` hardcoded to desktop-ultra. | D3D Part A |
| D3D-MOBILE-REMOVED | Mobile detection and CSS fallbacks removed | **RESOLVED** by D3D-1: 401 `isMobile` occurrences removed. Desktop-only rendering. | D3D Part A |
| D3D-POSTFX-UPGRADE | Only 3 post-processing effects (Bloom, Vignette, BarrelDistortion) | **RESOLVED** by D3D-5/C1: 7 effects always-on with scene-reactive multipliers. | D3D Part C |

### 2.7 Section 14 — Stores (9 to 10)

**Add sceneStore as store #10:**

| Store | Stage | Key State |
|-------|-------|-----------|
| **sceneStore** | D3D Part B | `activeScene`, `activeGameId`, `activeGameLabColor`, `transition`, `isTransitioning`, `cockpitOpacityTarget`. Actions: `enterGame`/`exitGame`/`enterSpatial`/`exitSpatial`/`setHeroActive`/`completeHero`/`updateTransitionProgress`/`completeTransition`. |

**Update deviceStore description:**
- Remove: `deviceType`, `hasSelected`, LOD references, tiered budgets
- Add: "D3D-1/3: Hardcoded desktop-ultra. 50M total budget. No device selection."

**Update uiStore description:**
- Note: `gameActive` flag is deprecated (D3D-B1). Use `sceneStore.enterGame`/`exitGame` instead.

### 2.8 Component Registry Update (Section 9 table)

Add new D3D components:

| Category | Count Change | New Components |
|----------|-------------|----------------|
| System/Dashboard | +3, -1 | Added: `SceneRouter`, `MechanicalIris`, `PostProcessingStack`. Removed: `LODWrapper`. |
| Hooks | +2, -2 | Added: `useParallaxMouse`, `useInteractiveSurface`. Removed: `useLOD`, `useAdaptiveLOD`. |
| Audio | +1 | `irisAudioEngine` |
| Stores | +1 | `sceneStore` |
| **Net change** | **+4** | |

### 2.9 Version Footer Update

Update from v5.9 to v6.0:

```
*End of CLAUDE.md v6.0 — SparkForge Autonomous Development Playbook*
*... | D3D Overhaul IMPLEMENTED (Desktop-First, 50M budget, Mechanical Iris, Scene Routing) |
20 decision locks (9 D3D + 6 D3D-B + 5 D3D-C) | ...*
```

---

## 3. PHASE 4B — Error Analysis & Discrepancy Catalog

### 3.1 Stage Documents Requiring Updates

When building stages, these discrepancies between existing stage docs and D3D architecture must be addressed:

| Stage Doc | Discrepancy | Resolution |
|-----------|-------------|-----------|
| All 35 game stage docs (6B-7F) | Contain `useIsMobile()` pattern and conditional 3D rendering | Remove during build per Part A checklist (D3D-1). Games render 3D unconditionally. |
| All 3D component stage docs | Import `useLOD` / `LODWrapper` / `useLODContext` | Remove during build, hardcode ultra-quality values (D3D-2). |
| Stage 3 Part 3 | Creates StationFrame with separate Canvas | Use CockpitCanvas with SceneRouter instead (D3D-B1). |
| Stage 6B-7F (all games) | Games create own `<Canvas>` for 3D scenes | Render as `<group>` inside CockpitCanvas via GameShell (D3D-B3). |
| Stage 4 Part 1 | `useApi.ts` references | BUG-1 already documented, no D3D impact. |
| CockpitCanvas stage docs (5C-5D) | References `profile.bloomEnabled` conditional rendering | Remove conditional — PostProcessingStack is always-on (D3D-5, D3D-C1). |
| GameShell stage docs | References `setGameActive(true/false)` from uiStore | Replace with `sceneStore.enterGame`/`exitGame` (D3D-B5). |
| Hero Animation docs (5A-5B) | HeroAnimation may create separate Canvas | Must render as scene within CockpitCanvas (D3D-B1). |
| Login 3D docs (5E-5F) | LoginPortal3D creates own Canvas | Login page is pre-auth, so this Canvas is acceptable (outside CockpitCanvas scope). No D3D change needed. |

### 3.2 Files With Stale References (To Fix During Build)

These files currently contain references that D3D supersedes. They are NOT broken (the old code still works), but should be updated during their respective stage builds:

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

### 3.3 Non-Breaking Deprecations

These patterns still function but are superseded by D3D architecture:

| Deprecated | Replacement | Impact |
|-----------|-------------|--------|
| `uiStore.gameActive` | `sceneStore.activeScene === 'game'` | uiStore flag still exists but no longer read by CockpitCanvas |
| `cockpitStore.heroPhase` | `sceneStore.activeScene === 'hero'` | cockpitStore retains `heroPhase` for HeroAnimation internal state machine |
| `WormholeTransition` (cockpit-to-game) | `MechanicalIris` | WormholeTransition retained for lab-to-lab transitions within spatial dashboard |
| Inline postprocessing in CockpitCanvas | `PostProcessingStack` component | Old inline EffectComposer replaced by extracted component (D3D-C1) |
| `deviceStore.profile.bloomEnabled` | Always `true` | Profile property still exists but is always `true` |
| `deviceStore.hasSelected` | Always `true` | No device selection flow exists |

### 3.4 Import Graph Changes

The D3D overhaul modifies the dependency graph in these key areas:

| Import Change | Affected Consumers | Notes |
|---------------|-------------------|-------|
| `sceneStore` added | CockpitCanvas, SceneRouter, GameShell, MechanicalIris, PostProcessingStack | New central state for scene management |
| `useLOD` removed | All 3D game components, LODWrapper, GameShell | Consumers must remove import and inline ultra values |
| `useIsMobile` removed | 84 files across games, layouts, 3D components | Consumers must remove import and conditional blocks |
| `GenericGameParticles` removed | 35 game files | Consumers must remove import and mobile fallback rendering |
| `PostProcessingStack` added | CockpitCanvas | Single consumer, replaces inline effects |
| `irisAudio` added | MechanicalIris (via useIrisTransition) | Procedural audio for iris open/close |

---

## 4. PHASE 4C — Enhancement Roadmap

Future enhancements building on the D3D foundation, organized by timeframe and effort.

### 4.1 Near-Term (Post-D3D, Low-Medium Effort)

| Enhancement | Description | Effort | Dependencies |
|-------------|-------------|--------|-------------|
| **WebGPU Shader Ports** | Port 10 GLSL lab pattern shaders to TSL for WebGPU compatibility | Medium | TSL tooling maturity, Three.js r171+ |
| **Per-Game Camera Presets** | Unique camera positions, FOV, and orbit constraints per game via `gameSceneRegistry` | Low | D3D-B4 (SceneRouter) |
| **Iris Audio Integration** | Wire `irisAudioEngine` into `useIrisTransition` hook for automatic audio on transitions | Low | D3D-C3 (irisAudio), D3D-B2 (MechanicalIris) |
| **CockpitCanvas Parallax** | Wire `useParallaxMouse` into `CameraSystem` for subtle mouse-driven depth | Low | D3D-C4 (useParallaxMouse) |
| **Interactive Surface Deployment** | Apply `useInteractiveSurface` to all cockpit panels and consoles | Medium | D3D-C5 (useInteractiveSurface) |
| **Transition Sound Variations** | Different iris audio pitch/timbre per lab color | Low | D3D-C3 |
| **Camera Shake on Events** | Subtle camera shake on XP gain, level-up, game completion | Low | CameraSystem |

### 4.2 Medium-Term (Enhancement 2.0)

| Enhancement | Description | Effort | Dependencies |
|-------------|-------------|--------|-------------|
| **Procedural Environment Generation** | Generate per-lab 3D environments procedurally from lab color, theme, and difficulty level | High | D3D-9 (25 unique environments as base) | **IMPLEMENTED (2026-03-24)** — ProceduralEnvironmentGenerator + 5 sub-generators + proceduralConfig. 10 lab theme profiles, 3 tier configs, seeded FBM noise, 5 fog behaviors, instanced ambient props. All 3 base wrappers refactored to delegate to procedural system. |
| **Advanced Particle Physics** | Gravity, collision, wind forces, turbulence fields for `DynamicEnvironment` particles | Medium | D3D-B1 (persistent Canvas) |
| **Cockpit Skin 3D Variants** | Different 3D geometry per cockpit skin (not just material swaps) — e.g., alien bridge, steampunk console | High | cockpitStore skins, CockpitPanels |
| **Custom HDR Environment** | Generate `frost-prismatic.hdr` procedurally instead of using drei preset | Medium | Three.js PMREMGenerator |
| **Full Game Scene Integration** | All 35 games render as `<group>` inside CockpitCanvas (D3D-B3 full implementation) | High | D3D-B3, all game refactors |
| **Per-Lab Ambient Soundscapes** | Unique ambient audio loops per lab (L1 digital hum, L5 nature sounds, etc.) | Medium | CockpitAudioEngine |
| **Dynamic Skybox** | Time-of-day or progress-based skybox changes in cockpit environment | Medium | DynamicEnvironment |

### 4.3 Long-Term (Enhancement 3.0)

| Enhancement | Description | Effort | Dependencies |
|-------------|-------------|--------|-------------|
| **VR/XR Readiness** | WebXR session support with cockpit as immersive VR environment, hand tracking for console interaction | Very High | WebXR API, controller input system |
| **Real-Time Global Illumination** | Lumen-style GI via compute shaders for accurate light bounce in cockpit | Very High | WebGPU compute, TSL |
| **Procedural Audio Synthesis** | AI-generated ambient soundscapes that react to game state and player emotion | High | Tone.js advanced synthesis, ML inference |
| **Physics-Based Animations** | Cockpit panel physics with springs, dampers, and constraints for realistic interaction | Medium | Rapier physics or cannon-es |
| **Multiplayer Cockpit** | Shared cockpit space where multiple students can see each other's avatars | Very High | WebSocket/WebRTC, network state sync |
| **AI-Driven NPC Behavior** | Ambient NPCs respond to player actions with context-aware dialogue and animations | High | Claude API, behavior trees |
| **Volumetric Clouds** | Ray-marched volumetric clouds visible through cockpit windows | High | Custom TSL compute shader |

---

## 5. IMPACT SUMMARY

### Files CREATED (1)

| File | Purpose | Lines |
|------|---------|-------|
| `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartD.md` | Phase 4: Document updates, error analysis, enhancement roadmap (this document) | ~330 |

### Files TO MODIFY (2)

| File | Change | When |
|------|--------|------|
| `CLAUDE.md` | Sections 7, 9, 9.1, 9.2, 9.3, 11, 14, footer — as specified in Phase 4A | During D3D execution (not during planning) |
| `PROGRESS.md` | Add D3D overhaul completion status | After all 4 parts are built |

### D3D Overhaul Complete Summary

| Part | Phase | Files Created | Files Modified | Decision Locks |
|------|-------|--------------|----------------|----------------|
| A | 1 (Foundation Cleanup) | 0 (spec only) | 0 (spec only) | 9 (D3D-1 through D3D-9) |
| B | 2 (Canvas & Iris) | 4 | 3 | 6 (D3D-B1 through D3D-B6) |
| C | 3 (Post-FX & Interactivity) | 4 | 2 | 5 (D3D-C1 through D3D-C5) |
| D | 4 (Docs & Roadmap) | 1 | 2 | 0 |
| **Total** | **4 phases** | **9 source + 4 docs** | **7** | **20** |

### All 20 Decision Locks

| Series | IDs | Scope |
|--------|-----|-------|
| D3D (Part A) | D3D-1 through D3D-9 | Desktop-only, LOD removal, triangle budgets, effects, transitions, audio, camera, environments |
| D3D-B (Part B) | D3D-B1 through D3D-B6 | Persistent canvas, mechanical iris, scene groups, scene router, scene store, cockpit fade |
| D3D-C (Part C) | D3D-C1 through D3D-C5 | 7 post-FX always-on, scene-reactive multipliers, procedural iris audio, parallax smoothing, emissive surfaces |

---

## 6. EXECUTION CHECKLIST — PHASE 4

- [ ] **4.1** Create `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartD.md` (this document)
- [ ] **4.2** Update `PROGRESS.md` with D3D overhaul planning status
- [ ] **4.3** Commit: `"D3D Phase 4: Document updates, error analysis, enhancement roadmap"`

Note: CLAUDE.md section updates (Phase 4A) are documented as **specifications** in this plan. The actual edits to CLAUDE.md will be applied when the D3D overhaul is executed (building the stages), not during the planning phase. This prevents the plan documents from conflicting with the current build state.

---

*End of Part D — Desktop-First Immersive 3D Overhaul: Document Updates, Error Analysis & Enhancement Roadmap*
*D3D Overhaul Plan Complete: 4 Parts, 20 Decision Locks, 13 Files*
