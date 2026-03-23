# Desktop-First Immersive 3D Overhaul — Part D

## Document Updates, Error Analysis & Enhancement Ideas

**Version:** 1.0 | **Date:** March 23, 2026 | **Author:** Claude Code
**Scope:** Phase 4 of 4 — Update CLAUDE.md and PROGRESS.md to reflect D3D architecture. Catalog discrepancies. Propose future enhancements.
**Depends On:** Parts A, B, C completion

---

## 1. OVERVIEW

This is the final part of the 4-part Desktop-First Immersive 3D Overhaul. Parts A-C delivered the architecture and source code. Part D documents what needs to change in existing project documentation and provides a forward-looking enhancement roadmap.

### Part Map

| Part | Title | Scope |
|------|-------|-------|
| **A** | Foundation Cleanup | Remove mobile/LOD/CSS fallbacks. Hardcode desktop-ultra. |
| **B** | Single Canvas & Mechanical Iris | Persistent CockpitCanvas, SceneStore, SceneRouter, MechanicalIris. |
| **C** | Post-FX, Audio & Interactivity | Full EffectComposer, iris audio, mouse parallax, interactive surfaces. |
| **D (this)** | Document Updates & Roadmap | CLAUDE.md updates, discrepancy catalog, enhancement ideas. |

---

## 2. PHASE 4A — CLAUDE.md Updates Required

These changes should be applied to CLAUDE.md when the D3D overhaul is executed during stage builds.

### 2.1 Section 7 — Game Architecture Template

**Remove** the `useIsMobile` pattern:
```typescript
// ❌ REMOVE:
function useIsMobile() { ... }
{!isMobile && <Component3D />}

// ✅ REPLACE:
// D3D-1: Desktop-only. 3D always renders.
<Component3D {...props} />
```

### 2.2 Section 9 — 3D Architecture Rules

**Remove these lines:**
- "Mobile fallback: `useIsMobile()` → component returns `null` on mobile"
- "CSS 2D fallback remains fully functional when 3D is hidden"
- "LOD is MANDATORY — every 3D component must use `useLOD()` hook or `<LODWrapper>`"
- "Device-adaptive FPS — `deviceStore` drives FPS targets (desktop 60, tablet 45, mobile 30)"

**Add these lines:**
- "Desktop-only rendering (D3D-1) — no mobile/tablet code paths"
- "All effects always-on (D3D-5) — no conditional postprocessing"
- "Single persistent Canvas (D3D-B1) — CockpitCanvas never unmounts"
- "Scene management via sceneStore (D3D-B5) — centralized visibility control"
- "Mechanical iris transitions (D3D-B2) — cockpit↔game via MechanicalIris"

**Update triangle budgets to D3D-3:**

| Tier | Old | New |
|------|-----|-----|
| Flagship | 10M | 20M |
| FL-Lite | 2M | 10M |
| Standard | 500K | 5M |
| System | 20M | 30M |
| **Total** | **20M** | **50M** |

### 2.3 Section 9.1 — Replace LOD Architecture

Replace entire section with:
```markdown
### 9.1 Desktop-Ultra Rendering (D3D-1, D3D-2)

LOD system removed (D3D-2). All geometry renders at maximum quality.
No DeviceSelectionModal, no tiered budgets, no useLOD hook.
deviceStore hardcodes desktop-ultra: 50M total, 64 segments, all effects on.

Future mobile will use R3F-native LOD (Three.js LOD object), not CSS fallbacks.
```

### 2.4 Section 9 — Component Registry Update

Add new D3D components:

| Category | New Components |
|----------|----------------|
| Scene Management | SceneRouter, MechanicalIris, PostProcessingStack |
| Hooks | useIrisTransition, useParallaxMouse, useInteractiveSurface |
| Audio | irisAudioEngine |
| Stores | sceneStore |
| Removed | LODWrapper (D3D-2), GenericGameParticles (D3D-1), DeviceSelectionModal (D3D-1) |

### 2.5 Section 11 — Bug Registry Additions

| ID | Issue | Fix | Stage |
|----|-------|-----|-------|
| D3D-CANVAS-PERSIST | CockpitCanvas unmounted during gameplay | **SUPERSEDED** by D3D-B1: Canvas persists. sceneStore replaces setGameActive. | D3D-B |
| D3D-LOD-REMOVED | LOD system removed | **RESOLVED** by D3D-2: deviceStore hardcoded to desktop-ultra. | D3D-A |
| D3D-MOBILE-REMOVED | Mobile detection removed | **RESOLVED** by D3D-1: 401 isMobile → 0. | D3D-A |
| D3D-POSTFX-UPGRADE | Only 3 effects active | **RESOLVED** by D3D-5/C1: 7 effects always-on. | D3D-C |

### 2.6 Section 14 — Stores (9 → 10)

Add sceneStore:

| Store | Stage | Key State |
|-------|-------|-----------|
| **sceneStore** | D3D-B | activeScene, activeGameId, activeGameLabColor, transition, isTransitioning, cockpitOpacityTarget. enterGame/exitGame/enterSpatial/exitSpatial/setHeroActive/completeHero. |

Update deviceStore: "D3D-1/3: Hardcoded desktop-ultra. 50M total. No device selection."

Note on uiStore: `gameActive` deprecated (D3D-B1). Use sceneStore.enterGame/exitGame.

### 2.7 Version Footer

Update to v6.0:
```
*End of CLAUDE.md v6.0 — SparkForge Autonomous Development Playbook*
*... | D3D Overhaul IMPLEMENTED (Desktop-First, 50M, Mechanical Iris, Scene Routing) |
20 D3D decision locks (9 + 6 + 5) | ...*
```

---

## 3. PHASE 4B — Error Analysis & Discrepancy Catalog

### 3.1 Stage Documents Requiring Updates During Build

| Stage Doc | Discrepancy | Resolution |
|-----------|-------------|-----------|
| All 35 game stage docs | Contain `useIsMobile()` pattern | Remove during build per Part A checklist |
| All 3D component docs | Import `useLOD` / `LODWrapper` | Remove, hardcode ultra values |
| Stage 3 Part 3 | Creates StationFrame with separate Canvas | Use CockpitCanvas with SceneRouter |
| Stage 6B-7F (games) | Games create own `<Canvas>` | Render as `<group>` inside CockpitCanvas |
| CockpitCanvas docs | `profile.bloomEnabled` conditional | Remove — PostProcessingStack always-on |
| GameShell docs | `setGameActive(true/false)` | Replace with sceneStore.enterGame/exitGame |

### 3.2 Stale Reference Counts

| Pattern | ~Count | Files | D3D Replacement |
|---------|--------|-------|----------------|
| `useIsMobile` | 401 | 84 | Remove (D3D-1) |
| `useLOD` / `LODWrapper` | 30 | 15 | Remove (D3D-2) |
| `GenericGameParticles` | 35 | 35 | Remove (D3D-1) |
| `setGameActive` | 4 | 3 | sceneStore (D3D-B5) |
| `profile.bloomEnabled` | 3 | 2 | Always true (D3D-5) |
| `DeviceSelectionModal` | 2 | 2 | Remove (D3D-1) |

### 3.3 Non-Breaking Deprecations

| Deprecated | Replacement | Notes |
|-----------|-------------|-------|
| `uiStore.gameActive` | `sceneStore.activeScene === 'game'` | Flag still exists, unused by CockpitCanvas |
| `cockpitStore.heroPhase` | `sceneStore.activeScene === 'hero'` | heroPhase retained for HeroAnimation internals |
| `WormholeTransition` | `MechanicalIris` | WormholeTransition kept for lab-to-lab transitions |
| Inline PostprocessingStack | `PostProcessingStack` component | Old inline version removed from CockpitCanvas |

---

## 4. PHASE 4C — Enhancement Roadmap

### 4.1 Near-Term (Wire-Up Tasks)

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| Iris Audio Wiring | Connect irisAudioEngine to useIrisTransition (start/sync/stop) | Low |
| CockpitCanvas Parallax | Wire useParallaxMouse ref into CameraSystem | Low |
| Interactive Surfaces | Apply useInteractiveSurface to cockpit panels/consoles | Medium |
| Per-Game Camera Presets | Game-specific camera positions in sceneStore or gameRegistry | Low |
| PostProcessingStack in Canvas | Replace inline PostprocessingStack with new component | Low |

### 4.2 Medium-Term (Enhancement 2.0)

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| WebGPU Shader Ports | Port GLSL shaders (crystallineLogo, electricVeins, holographic, scanline) to TSL | Medium |
| Procedural Environments | Generate per-lab environments from lab color + theme seed | High |
| Advanced Particles | Gravity, collision, wind forces for DynamicEnvironment | Medium |
| Cockpit Skin 3D Variants | Different geometry per skin, not just material swaps | High |
| Custom HDR | Generate frost-prismatic.hdr instead of drei preset | Medium |
| Game Scene Groups | Full D3D-B3: all 35 games as `<group>` inside CockpitCanvas | High |

### 4.3 Long-Term (Enhancement 3.0)

| Enhancement | Description | Effort |
|-------------|-------------|--------|
| VR/XR Readiness | WebXR sessions with cockpit as VR environment | Very High |
| Real-Time GI | Compute-shader global illumination | Very High |
| AI Soundscapes | Procedurally generated ambient audio per lab | High |
| Physics Panels | Spring/damper cockpit panel animations | Medium |

---

## 5. D3D OVERHAUL — COMPLETE SUMMARY

### Deliverables

| Part | Commit | Source Files | Doc Files | Decision Locks |
|------|--------|-------------|-----------|----------------|
| A | `db18293` | 0 | 1 | 9 (D3D-1–9) |
| B | `93cd13e` | 4 | 1 | 6 (D3D-B1–B6) |
| C | `d923968` | 4 | 1 | 5 (D3D-C1–C5) |
| D | — | 0 | 1 | 0 |
| **Total** | **3 commits** | **8 source** | **4 docs** | **20 locks** |

### All 20 Decision Locks

| ID | Decision |
|----|----------|
| D3D-1 | Desktop-only rendering |
| D3D-2 | LOD system removed |
| D3D-3 | 50M triangle budget |
| D3D-4 | Native pixel ratio |
| D3D-5 | Full EffectComposer always-on |
| D3D-6 | Mechanical iris transition |
| D3D-7 | Full spatial audio |
| D3D-8 | Free camera + parallax + interactive |
| D3D-9 | Unique per-lab environments |
| D3D-B1 | Single canvas persists always |
| D3D-B2 | Mechanical iris (not wormhole) |
| D3D-B3 | Games as `<group>` in canvas |
| D3D-B4 | Iris: 600ms, 3-stage, audio+light |
| D3D-B5 | sceneStore manages all scenes |
| D3D-B6 | Cockpit 20% opacity during game |
| D3D-C1 | 7 post-FX always-on |
| D3D-C2 | Scene-reactive multipliers |
| D3D-C3 | Procedural iris audio |
| D3D-C4 | Mouse parallax (0.05 smoothing) |
| D3D-C5 | Emissive+scale hover (not outline) |

---

*End of Part D — Desktop-First Immersive 3D Overhaul: Document Updates & Enhancement Roadmap*
*D3D Overhaul Plan Complete: 4 Parts, 20 Decision Locks, 8 Source Files, 4 Plan Documents*
