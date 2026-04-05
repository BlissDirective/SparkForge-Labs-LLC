# SparkForge VR Conversion Assessment
**Version:** 1.0 | **Date:** April 5, 2026 | **Status:** DRAFT — Awaiting Decision Points  
**Branch:** `claude/sparkforge-vr-assessment-v0DQ3`  
**Prepared by:** Claude Code (Autonomous Analysis)

---

## TABLE OF CONTENTS

1. [Executive Summary & Current State Assessment](#1-executive-summary--current-state-assessment)
2. [VR Technology Options & Platform Targets](#2-vr-technology-options--platform-targets)
3. [Architecture Changes Required](#3-architecture-changes-required)
4. [Per-System Conversion Plan](#4-per-system-conversion-plan)
5. [Game-by-Game VR Adaptation Strategy](#5-game-by-game-vr-adaptation-strategy)
6. [Performance & Hardware Targets](#6-performance--hardware-targets)
7. [Child Safety, Age Policy & UX Considerations](#7-child-safety-age-policy--ux-considerations)
8. [Implementation Roadmap & Decision Points](#8-implementation-roadmap--decision-points)

---

## 1. Executive Summary & Current State Assessment

### 1.1 Summary

SparkForge is an exceptionally strong candidate for VR conversion. The platform has already completed the hardest part of a VR transition: it runs entirely inside a persistent, unified 3D canvas (React Three Fiber), features a first-person seated cockpit UI, 77+ 3D components across 35 game environments, and a full scene-management pipeline (SceneRouter, sceneStore, CameraSystem). No HTML-overlay UI architecture remains — the entire dashboard has been migrated to world-space 3D panels. This is precisely the architecture WebXR requires.

A VR mode is achievable as a **non-destructive, additive layer** on top of the existing codebase. No full rewrite is required. The primary work areas are: replacing the fixed perspective camera with a head-tracked XR camera, swapping mouse raycasting with controller/hand raycasting, adapting post-processing for stereo rendering, and dramatically reducing the cockpit triangle budget (50M → ~3–5M per-eye) for headset-class hardware.

**Verdict: HIGH FEASIBILITY. Medium-to-large effort. Strong architectural alignment.**

---

### 1.2 Current State: What SparkForge Already Has (VR-Favorable)

| Feature | Current Implementation | VR Relevance |
|---|---|---|
| **Single Persistent Canvas** | `CockpitCanvas.tsx` — one R3F Canvas, never unmounts (D3D-B1) | WebXR requires a single WebGL context. SparkForge already enforces this. |
| **3D World-Space UI** | All 6 dashboard pages converted to 3D panels (`CockpitUILayer`, 9 panel components) | VR cannot use HTML overlays. SparkForge has eliminated them. |
| **Auth 3D Panels** | LoginPanel3D, SignupPanel3D, ResetPasswordPanel3D (Phase 3, UI Migration) | All forms already rendered in 3D space — VR-ready. |
| **Game HUD in 3D** | GameHUD3D, GameTimerBar3D, GamePhaseOverlay3D (Phase 5, UI Migration) | All game overlays are 3D geometry, not DOM. |
| **Centralized Camera** | `CameraSystem.tsx` — 4 modes: hero / station / spatial / game | XR overrides camera; CameraSystem already centralizes all camera control. |
| **SceneRouter + sceneStore** | Visibility management for 4 scene groups | Parallels XR session scene graph management. |
| **Three.js r183+** | `three: ^0.183.2` | Three.js r134+ has full WebXR support. r183 adds TSL/WebGPU pipeline. |
| **@react-three/fiber v9** | `@react-three/fiber: ^9.5.0` | R3F v9 is fully compatible with `@react-three/xr` v6. |
| **@react-three/uikit** | `@react-three/uikit: ^1.0.64` — already installed | Purpose-built for world-space 3D UI in R3F — the standard VR UI toolkit in the R3F ecosystem. |
| **troika-three-text** | `troika-three-text: ^0.52.4` | Best-in-class text rendering for 3D/VR, already integrated. |
| **Spatial audio foundation** | Tone.js `^15.1.22` + per-lab audio profiles | Web Audio API supports spatial (positional) audio — upgrade path exists. |
| **GLSL Shader pipeline** | 10 lab pattern TSL shaders + custom .vert/.frag files | TSL shaders compile to WGSL (WebGPU) and GLSL — compatible with XR render path. |
| **Cockpit seated camera** | Camera at `[0, 0.65, 1.1]` looking into curved panel array | Matches the "seated VR cockpit" experience model — natural VR paradigm. |

---

### 1.3 Current State: What SparkForge Does NOT Have (VR Gaps)

| Gap | Current State | What's Needed |
|---|---|---|
| **WebXR session management** | None — desktop browser only | `@react-three/xr` session lifecycle (enter/exit VR) |
| **XR head-tracked camera** | Fixed `PerspectiveCamera` with parallax mouse | XR replaces camera with head pose; existing camera must yield |
| **Controller / hand input** | Mouse raycasting + pointer events | XR controller raycasting (`XRInteractable`) or hand tracking |
| **VR-safe post-processing** | 9 effects always-on (N8AO, DOF, Chromatic Aberration, etc.) | DOF/ChromaticAberration cause VR sickness; must be disabled in XR mode |
| **VR locomotion** | None — camera is stationary | Teleport or smooth locomotion for spatial exploration |
| **Triangle budget compliance** | 50M total (cockpit 30M + game 20M) | Meta Quest 3: ~3–5M per eye (6–10M total). Full cockpit is ~10x over budget. |
| **VR comfort settings** | No IPD, guardian, or comfort overlays | Standard VR comfort controls required |
| **XR UI interaction** | @react-three/uikit installed but not wired to XR input | Connect XR rays to existing uikit hit targets |
| **Platform detection** | `deviceStore` hardcoded desktop-ultra | Must detect XR session and switch to VR profile |
| **Spatial audio (positional)** | Mono audio, no 3D positioning | `THREE.PositionalAudio` for sound-in-space |
| **Age-gating for VR** | Current: auth by parent email | VR adds platform-level age restrictions (Meta requires 10–13+) |

---

### 1.4 Readiness Score

| Category | Score | Notes |
|---|---|---|
| Rendering Architecture | 9/10 | Single canvas, R3F v9, Three.js r183, WebGPU-ready |
| 3D Scene Completeness | 8/10 | 77 3D components, 47 environments, all UI in 3D |
| Input System | 3/10 | Mouse-only; controller/hand input must be built |
| Post-Processing | 4/10 | Effects must be conditionally disabled for VR comfort |
| Performance Budget | 2/10 | 50M triangles — massively over headset hardware limits |
| Audio | 5/10 | Tone.js present; positional audio not yet implemented |
| Child Safety / Age Gating | 4/10 | Auth exists; VR-specific age policies not implemented |
| **Overall** | **5/10** | **Medium readiness — architecture excellent, execution gaps are real but solvable** |

---

*Section 1 of 8 — continues in next section.*

---

## 2. VR Technology Options & Platform Targets

### 2.1 Recommended Primary Path: WebXR via @react-three/xr

**`@react-three/xr`** is the official WebXR integration layer for React Three Fiber. It wraps the browser's [WebXR Device API](https://www.w3.org/TR/webxr/) and provides React-native components for XR sessions, controllers, hands, and hit-testing.

**Why this is the right choice for SparkForge:**
- SparkForge is already built on R3F v9 + Three.js r183 — `@react-three/xr` v6 is a first-class peer
- Requires **zero renderer change** — same WebGL2/WebGPU canvas, same Three.js scene graph
- Non-destructive: VR mode can be toggled without breaking the existing desktop experience
- Open source, MIT license, actively maintained by the pmndrs ecosystem (same team as R3F)

#### How it works

```
WebXR Device API (browser spec)
  └── @react-three/xr (React wrapper)
        └── R3F Canvas (existing CockpitCanvas.tsx)
              └── Three.js r183 (existing scene graph)
```

When a user clicks "Enter VR", `@react-three/xr` calls `navigator.xr.requestSession('immersive-vr')`. The browser takes over the rendering loop, providing a per-frame head pose (position + orientation) for each eye. The existing R3F useFrame loop continues to run — but now renders twice per frame (once per eye) into the headset's displays.

**Sources:**
- [@react-three/xr GitHub — pmndrs/xr](https://github.com/pmndrs/xr) — v6 release notes, API docs
- [WebXR Device API W3C Spec](https://www.w3.org/TR/webxr/) — browser standard
- [Three.js WebXR Docs](https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content) — Three.js built-in XR manager

---

### 2.2 Platform Compatibility Matrix

| Platform | Browser | WebXR Support | Notes |
|---|---|---|---|
| **Meta Quest 2** | Meta Quest Browser (Chromium) | Full — `immersive-vr` + `immersive-ar` | 72Hz / 90Hz. WebXR is the recommended developer path for browser games. |
| **Meta Quest 3 / 3S** | Meta Quest Browser | Full — includes hand tracking v2.1 | 90Hz / 120Hz. Color passthrough AR. Best price/performance for children. |
| **Meta Quest Pro** | Meta Quest Browser | Full | 90Hz. Eye tracking available (WebXR eye input not yet widely supported). |
| **Apple Vision Pro** | Safari / visionOS | Partial — `immersive-vr` mode not yet supported (2026) | Apple supports `inline` and `immersive-ar` (windowed) only. Full VR blocked pending WebXR convergence. |
| **PCVR (Valve Index, HP Reverb G2)** | Chrome / Edge + SteamVR | Full via OpenXR runtime | High-end PCVR. Not a target for a children's educational app. |
| **Chrome Desktop** | Chrome 79+ | `inline` mode only (no headset) | Useful for desktop VR preview/testing without a headset. |
| **Firefox** | Firefox 98+ | Partial — `immersive-vr` behind flag | Not recommended as primary target. |
| **Samsung Galaxy XR** | Samsung Internet / Chrome | WebXR via Android XR | Emerging 2025–2026. Android XR headsets (Samsung Project Moohan) support Chrome WebXR. |

**Recommended primary target: Meta Quest 3 / Quest 3S**  
Reason: Most widely adopted consumer VR headset, best WebXR support, age-appropriate pricing (~$299 Quest 3S), and parental controls via Meta Family Center.

**Sources:**
- [Meta Quest Browser WebXR Support](https://developer.oculus.com/documentation/web/webxr-develop/) — Meta developer docs (2025)
- [WebXR Browser Compatibility — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API#browser_compatibility)
- [Apple Vision Pro visionOS WebXR status](https://webkit.org/blog/15169/webkit-features-in-safari-17-4/) — WebKit blog

---

### 2.3 Alternative Technology Paths (Evaluated & Compared)

#### Option A: WebXR via @react-three/xr *(Recommended)*
| | |
|---|---|
| **Stack change** | Additive only — install `@react-three/xr` |
| **Effort** | Medium (6–12 months for full VR mode) |
| **Preserves** | All 77 existing 3D components, all 35 games, Next.js stack |
| **Platform** | Browser-based — works on Meta Quest Browser, PCVR browsers |
| **Risk** | Performance on Quest hardware (triangle budget reduction required) |
| **Best for** | "VR Mode" toggle inside the existing SparkForge web app |

#### Option B: Native Meta Quest App (React Native + Unity or Unreal Engine 5)
| | |
|---|---|
| **Stack change** | Full rewrite — Unity (C#) or Unreal Engine 5 (C++/Blueprints) |
| **Effort** | Very High (18–36 months) |
| **Preserves** | Game concept and design only. Zero code reuse. |
| **Platform** | Meta Quest store (app distribution) or sideloading |
| **Risk** | Full rebuild cost, new platform certification, separate codebase maintenance |
| **Best for** | Long-term standalone native VR app (SparkForge XR Edition) |

#### Option C: Babylon.js Migration
| | |
|---|---|
| **Stack change** | Full renderer migration from Three.js/R3F to Babylon.js |
| **Effort** | Very High (12–24 months, migrate all 77 3D components) |
| **Preserves** | TypeScript, React, Next.js routing |
| **Platform** | Browser WebXR (Babylon has excellent built-in XR support) |
| **Risk** | Massive migration cost with marginal WebXR benefit over @react-three/xr |
| **Best for** | Not recommended — solution already achievable with existing stack |

#### Option D: A-Frame Wrapper Layer
| | |
|---|---|
| **Stack change** | Layer A-Frame on top of existing Three.js scenes |
| **Effort** | Medium-High — architectural conflict with R3F |
| **Preserves** | Some Three.js geometry |
| **Platform** | Browser WebXR |
| **Risk** | A-Frame and R3F conflict at the renderer level; not compatible |
| **Best for** | Not recommended for SparkForge architecture |

**Sources:**
- [Babylon.js WebXR Documentation](https://doc.babylonjs.com/features/featuresDeepDive/webXR/introToWebXR) — Babylon.js docs
- [A-Frame WebXR](https://aframe.io/docs/1.6.0/introduction/vr-headsets-and-webvr-browsers.html) — A-Frame docs
- [Unity WebGL vs Native VR](https://unity.com/features/vr) — Unity VR documentation
- [pmndrs/xr — @react-three/xr v6](https://github.com/pmndrs/xr/releases/tag/v6.0.0)

---

### 2.4 Deployment Model: WebXR vs App Store

| Factor | WebXR (Browser) | Native App (Store) |
|---|---|---|
| **Distribution** | URL — no install required | App Store download (Meta Horizon, Apple App Store) |
| **Update cycle** | Instant — same as web deploys | App store review cycle (days to weeks) |
| **Subscription integration** | Direct — Stripe already integrated | 30% platform cut on in-app purchases |
| **Code sharing** | 100% code shared with web | Zero code sharing |
| **Performance** | ~60–80% of native | Full native GPU access |
| **Offline support** | PWA caching (already planned) | Full offline |
| **Child accounts** | Supabase auth (existing) | Meta Family Center / Apple Family Sharing required |
| **Recommendation** | **START HERE** — additive VR mode | Long-term expansion (SparkForge XR Edition v2) |

---

*Section 2 of 8 — continues in next section.*

---

## 3. Architecture Changes Required

This section maps each existing SparkForge system to what must change, stay the same, or be added for VR. Changes are classified by impact level: **CRITICAL** (blocks VR), **HIGH** (required for quality), **MEDIUM** (significant improvement), **LOW** (polish).

---

### 3.1 Canvas & Renderer Layer

**Current:** `CockpitCanvas.tsx` — single `<Canvas>` from `@react-three/fiber`, desktop-only, WebGL2/WebGPU.

**What Changes:**
- Wrap `<Canvas>` with `<XR>` from `@react-three/xr` to enable WebXR session management
- Add `<XROrigin>` or `<IfInSessionMode>` components to conditionally render VR-specific content
- Add an "Enter VR" button (`<XRButton>`) that triggers `navigator.xr.requestSession('immersive-vr')`
- The core `<Canvas>` itself does NOT change — it continues to host the same Three.js scene

**Code Sketch (additive, not a replacement):**
```tsx
// CockpitCanvas.tsx — proposed VR wrapper addition
import { XR, createXRStore } from '@react-three/xr';

const vrStore = createXRStore(); // singleton VR session store

<XR store={vrStore}>
  <Canvas ...existingProps>
    {/* All existing scene content — UNCHANGED */}
    <SceneRouter ... />
    <CockpitPanels ... />
    {/* etc. */}
  </Canvas>
</XR>
```

**Impact:** CRITICAL — enables XR session. Additive: ~20 lines of change to `CockpitCanvas.tsx`.

**Source:** [@react-three/xr — Getting Started](https://github.com/pmndrs/xr#getting-started)

---

### 3.2 Camera System

**Current:** `CameraSystem.tsx` — 4 modes (hero/station/spatial/game), controlled by `useCockpitStore`. Uses `useFrame` to interpolate camera position/lookAt. Fixed `PerspectiveCamera` built into the R3F `<Canvas>`.

**What Changes:**
- In VR, the WebXR API **owns** the camera. SparkForge's `CameraSystem` must **yield** camera control when an XR session is active
- XR provides the camera pose (position + rotation) from the headset's IMU each frame — cannot be overridden
- `CameraSystem` needs a new mode: `'xr'` — in this mode, skip all lerp/GSAP logic and let WebXR drive
- The camera **origin** (floor-level position of the player in the scene) is set via `<XROrigin>` — must be placed at the cockpit seat position `[0, 0, 0]`

**Code Sketch:**
```tsx
// CameraSystem.tsx — add XR mode branch
import { useXR } from '@react-three/xr';

const isPresenting = useXR((state) => state.isPresenting);

useFrame(({ camera }) => {
  if (isPresenting) return; // XR drives camera — CameraSystem yields
  // ... existing lerp/GSAP logic unchanged
});
```

**Impact:** CRITICAL — without this, XR camera and CameraSystem fight each other.

**Source:** [@react-three/xr — XROrigin, useXR hook](https://github.com/pmndrs/xr#xrorigin)

---

### 3.3 Input System

**Current:** Mouse pointer events on 3D meshes via R3F `onPointerDown`/`onPointerUp`. `useParallaxMouse` hook for depth movement. NavigationButtonGrid and all cockpit UI buttons receive pointer events.

**What Must Change:**
- In VR, there is no mouse cursor — input comes from **XR controllers** (joysticks + triggers) or **hand tracking**
- `@react-three/xr` provides `<XRInteractable>` which intercepts XR ray events and forwards them as standard `onPointerDown`/`onPointerUp` events — **existing R3F pointer handlers work without changes**
- `useParallaxMouse` becomes inactive in XR (no mouse movement) — no change needed, just inactive

**New Components Required:**
- `XRControllerRay.tsx` — visual laser ray from each controller to help users see where they are pointing
- `XRHandVisualizer.tsx` — optional hand mesh rendering using `XRHandModelFactory`
- `VRPointerCursor.tsx` — floating dot/ring at the XR ray intersection point (replaces mouse cursor)

**Code Sketch:**
```tsx
// In CockpitCanvas.tsx — add XR ray controllers
import { XRControllerModel } from '@react-three/xr';
import { IfInSessionMode } from '@react-three/xr';

<IfInSessionMode allow="immersive-vr">
  <XRControllerModel hand="left" />
  <XRControllerModel hand="right" />
</IfInSessionMode>
```

**What Stays The Same:**
- All R3F `onPointerDown`/`onPointerUp` handlers on 3D UI components — XR rays trigger these natively
- All `useGameStore` game interaction logic — games receive "click" events, not knowing if from mouse or controller

**Impact:** CRITICAL for usability. Partially handled automatically by @react-three/xr.

**Source:** [@react-three/xr — Interactions](https://github.com/pmndrs/xr#interactions), [Three.js XRControllerModelFactory](https://threejs.org/docs/#examples/en/webxr/XRControllerModelFactory)

---

### 3.4 Post-Processing Stack

**Current:** `PostProcessingStack.tsx` — 9 effects always-on: N8AO, Bloom, ChromaticAberration, DepthOfField, Noise, HueSaturation, BrightnessContrast, Vignette, BarrelDistortion.

**VR Problem:**
- **ChromaticAberration** — simulates lens color fringing. In VR, this doubles the effect of the headset's own optical aberration, causing visual discomfort and headaches.
- **DepthOfField** — blurs distant/near objects. In VR, your eyes naturally re-focus at any depth — DOF fights this and causes eye strain.
- **BarrelDistortion** — the headset already applies barrel distortion via its optics correction pipeline. Stacking two barrel distortions produces severe warping.
- **Vignette** — slightly darkens edges. In VR, this can create a "tunnel vision" effect that causes disorientation.
- **N8AO (SSAO)** — computationally expensive and must render twice (once per eye) — performance impact doubles.

**What Changes:**
- Add a `vrMode: boolean` prop to `PostProcessingStack.tsx`
- In VR mode: disable ChromaticAberration, DepthOfField, BarrelDistortion. Reduce Vignette to 0. Keep Bloom (VR-safe), HueSaturation (VR-safe), BrightnessContrast (VR-safe). Reduce N8AO intensity or disable entirely.

**Code Sketch:**
```tsx
// PostProcessingStack.tsx
const isPresenting = useXR((state) => state.isPresenting);

{!isPresenting && <ChromaticAberration ... />}
{!isPresenting && <DepthOfField ... />}
{!isPresenting && <BarrelDistortion ... />}
<Bloom intensity={isPresenting ? bloomIntensity * 0.6 : bloomIntensity} ... />
```

**Impact:** HIGH — VR comfort and headset safety.

**Source:** [WebXR Best Practices — Comfort Guidelines (W3C Immersive Web Working Group)](https://immersive-web.github.io/webxr-samples/), [Oculus VR Comfort Guidelines](https://developer.oculus.com/resources/bp-vision/)

---

### 3.5 Device Store & Performance Profiles

**Current:** `deviceStore.ts` — hardcoded `DESKTOP_ULTRA_PROFILE` with 50M triangle budget, 60fps target, all effects on.

**What Changes:**
- Add `'xr-quest-3'` and `'xr-quest-2'` performance profiles to `deviceStore`
- Set XR profile in `setGpuTier()` when an XR session is detected
- XR profiles reduce `maxTriangles` to ~5M total, target 90fps, disable expensive effects

**New Profiles:**
```typescript
const XR_QUEST3_PROFILE: PerformanceProfile = {
  targetFPS: 90,          // Quest 3 native refresh rate
  maxTriangles: 5_000_000, // 2.5M per eye
  bloomEnabled: true,
  postProcessingEnabled: true, // reduced set
  shadowsEnabled: false,   // shadows too expensive in stereo
  maxLights: 8,
  instancedMeshLimit: 2_000,
  sphereSegments: 16,     // reduced from 64
  antialias: false,        // MSAA handled by headset hardware
  pixelRatio: 1.0,         // headset manages resolution
};
```

**Impact:** CRITICAL — without a VR performance profile, the app will not maintain 72Hz minimum.

**Source:** [Meta Quest Performance Guidelines](https://developer.oculus.com/resources/bp-rendering/), [WebXR Rendering Best Practices — Immersive Web](https://immersive-web.github.io/webxr-samples/)

---

### 3.6 Scene Store & sceneStore

**Current:** `sceneStore.ts` — manages `activeScene` ('hero'|'cockpit'|'game'|'spatial'), `isTransitioning`, `cockpitOpacityTarget`.

**What Changes:**
- Add `isXRPresenting: boolean` and `xrProfile: 'quest2'|'quest3'|'pcvr'|null` to sceneStore
- When XR session starts: trigger cockpit geometry LOD switch, disable expensive components, activate VR locomotion
- Hero animation (`activeScene === 'hero'`) should be **skipped** in XR — users enter directly into cockpit
- Game transitions: MechanicalIris transition may need simplification in VR (fast cuts work better than slow transitions in VR to prevent motion sickness)

**Impact:** HIGH — drives VR-aware scene behavior throughout the app.

---

### 3.7 Cockpit Geometry (Triangle Budget Reduction)

**Current:** ~37.8M triangles in cockpit shell (CockpitPanels 4M, SidePanels 3M, LEDRim 500K, etc.)

**Required:** ~3–5M total for Meta Quest 3 at 90fps.

**Approach — VR LOD variants:**
- Do NOT modify existing desktop cockpit geometry
- Create `CockpitPanels.vr.tsx`, `SidePanels.vr.tsx`, etc. — VR-optimized versions at 10–20% of desktop poly count
- `SceneRouter` selects VR variants when `isXRPresenting === true`
- This preserves the desktop 50M-triangle experience while enabling VR

**Triangle Budget — VR Cockpit Target:**

| Component | Desktop | VR Target | Reduction |
|---|---|---|---|
| CockpitPanels | 4,000,000 | 200,000 | 95% |
| SidePanels | 3,000,000 | 150,000 | 95% |
| HolographicLabMap | 1,000,000 | 80,000 | 92% |
| LEDRim | 500,000 | 20,000 | 96% |
| StatusBar3D | 1,000,000 | 50,000 | 95% |
| HolographicHUD | 1,000,000 | 60,000 | 94% |
| CockpitStructuralDetail | 2,000,000 | 100,000 | 95% |
| CockpitFloor3D | 1,000,000 | 50,000 | 95% |
| DynamicEnvironment | 3,000,000 | 200,000 | 93% |
| Other components | ~21,300,000 | ~90,000 | ~99% |
| **TOTAL** | **~37,800,000** | **~1,000,000** | **~97%** |

**Plus game environments:** 1M–4M per game (existing, mostly usable in VR with minor reduction)

**Impact:** CRITICAL for performance. Significant art/engineering work.

**Source:** [Meta Quest Developer Docs — GPU Performance](https://developer.oculus.com/resources/bp-rendering/), [Three.js WebXR Examples — Performance](https://threejs.org/examples/?q=webxr)

---

*Section 3 of 8 — continues in next section.*

---

## 4. Per-System Conversion Plan

Detailed implementation plan for each subsystem, with specific file targets, new packages, and code patterns.

---

### 4.1 Package Installation

**New packages required for VR mode:**

```bash
npm install @react-three/xr@^6.0.0
```

`@react-three/xr` v6 is the only required new package. Everything else (Three.js XRControllerModelFactory, XRHandModelFactory) ships inside `three` which is already installed at r183.

**Optional (recommended):**
```bash
npm install @webxr-input-profiles/motion-controllers  # controller button/axis profiles
```

**What is NOT needed:**
- Babylon.js — no renderer change
- A-Frame — conflicts with R3F
- `webxr-polyfill` — Meta Quest Browser supports WebXR natively; polyfill only needed for non-supporting browsers (currently unnecessary for target platform)

**Source:** [@react-three/xr npm](https://www.npmjs.com/package/@react-three/xr), [WebXR Input Profiles](https://github.com/immersive-web/webxr-input-profiles)

---

### 4.2 Camera System Conversion Plan

**File:** `src/components/3d/CameraSystem.tsx`

**Current:** Modes `hero | station | spatial | game`. All modes use `useFrame` to LERP camera position/lookAt/FOV.

**VR Changes:**

| Step | Action | Lines affected |
|---|---|---|
| 1 | Import `useXR` from `@react-three/xr` | +1 import |
| 2 | Read `isPresenting` from XR store | +1 hook call |
| 3 | Add early return in `useFrame` when `isPresenting === true` | +3 lines in useFrame |
| 4 | Add `'xr'` to `CameraMode` type | +1 type union |
| 5 | In XR mode, set camera to cockpit seat position via `<XROrigin>` in CockpitCanvas | Separate component |

**Estimated effort:** 2–4 hours. Minimal changes to existing file.

**XR Origin placement:**
```tsx
// In CockpitCanvas.tsx — cockpit seat is the XR floor origin
<XROrigin position={[0, -0.65, 0]} />
// Offsets XR origin so head height (1.6m average) lands at camera [0, 0.65, 1.1]
```

**Hero Animation in VR:**  
The 8-phase hero animation (19-second cinematic) is **not suitable for VR** — extended camera movement sequences cause motion sickness. Recommendation: detect XR session at app start and skip hero animation, entering cockpit directly. `uiStore.skipIntroAnimation` already supports this behavior.

---

### 4.3 Input Conversion Plan

**Files to modify:** `CockpitCanvas.tsx`, all cockpit UI components

**Files to create:** `src/components/3d/xr/XRControllerRays.tsx`, `src/components/3d/xr/XRHandVisual.tsx`, `src/components/3d/xr/VREnterButton.tsx`

#### How XR Input Works with Existing R3F Components

`@react-three/xr` v6 uses a **ray-casting system** that fires from each controller's tip. This system hooks into R3F's existing `onPointerDown`/`onPointerUp` event bubbling. Result: **existing cockpit buttons, lab map, consoles, and game UI respond to VR controller input without code changes.**

This is the key advantage over building a custom input system.

**What does need explicit XR support:**
- Scroll interactions in `CockpitScrollPanel` — XR joystick thumbstick maps to scroll
- Drag-and-drop in sort-based games (SortToyBoxGame, etc.) — XR grab requires `<XRInteractable>` with `selectstart`/`selectend` events
- Text input (`CockpitInput`) — VR keyboard overlay must be triggered (browser handles this on Meta Quest)

**Controller visual feedback:**
```tsx
// src/components/3d/xr/XRControllerRays.tsx
import { XRControllerModel, useXRControllerLocomotion } from '@react-three/xr';

export function XRControllerRays() {
  return (
    <IfInSessionMode allow="immersive-vr">
      <XRControllerModel hand="left" />
      <XRControllerModel hand="right" />
    </IfInSessionMode>
  );
}
```

**Source:** [@react-three/xr — Interactions docs](https://github.com/pmndrs/xr#interactions), [Meta Quest Hand Tracking API](https://developer.oculus.com/documentation/web/webxr-hand-tracking/)

---

### 4.4 UI Layer Conversion Plan

**Current:** `CockpitUILayer.tsx` — quadrant orchestrator rendering 9 panel components (DashboardLeft, DashboardRight, DashboardCenter, etc.) as 3D geometry inside the persistent canvas.

**Good news:** Because SparkForge completed its full 3D UI migration (149 HTML lines removed, all panels converted to world-space 3D geometry), the UI is already in the correct form for VR. No HTML overlay issue exists.

**VR-specific UI concerns:**

| Issue | Current | VR Fix |
|---|---|---|
| Panel distances | Panels at Z=-1.95 to Z=-3.4 | Comfortable VR reading: 1.5–3m from user. Current distances are fine. |
| Text size | Troika text at existing scale | Verify minimum 0.06 world units (≈ ~12mm at arm's length) for legibility |
| Grab/touch zones | Mouse hover highlight | Add XR proximity highlight via `onPointerEnter` (already exists in R3F) |
| Curved panel arc | 218° arc, radius 4.8 | Excellent for VR — peripheral panels visible with natural head turns, not just mouse look |
| @react-three/uikit | Installed (v1.0.64) but not yet primary UI system | Already provides `<Root>`, `<Container>`, `<Text>`, `<Input>` for fully VR-compatible UI |

**@react-three/uikit** is already installed in `package.json`. It is the pmndrs ecosystem's official world-space UI library for R3F, built specifically for VR-compatible interfaces. The existing 3D panel components can progressively adopt uikit patterns for panels that need scroll, text input, or complex layouts.

**Source:** [@react-three/uikit docs](https://github.com/pmndrs/uikit), [Immersive Web — UI guidelines](https://immersive-web.github.io/webxr-samples/)

---

### 4.5 Audio Conversion Plan

**Current:** `CockpitAudioEngine.ts`, `heroAudio.ts` — Tone.js synthesis + Web Audio API. Mono audio positioning. Per-lab audio profiles in `irisAudioEngine`.

**What Changes for VR:**

Spatial (positional) audio is one of the most impactful VR enhancements. When sound sources are positioned in 3D space and tracked to the user's head orientation, presence dramatically increases.

**Three.js Positional Audio:** Three.js provides `THREE.PositionalAudio` which wraps `PannerNode` from the Web Audio API. It automatically applies HRTF (Head-Related Transfer Function) spatialization — the same technology used in professional VR audio.

**Implementation:**
```typescript
// Upgrade CockpitAudioEngine.ts — add spatial audio support
import { PositionalAudio, AudioListener } from 'three';

// AudioListener attaches to the XR camera (head position)
// PositionalAudio attaches to 3D scene objects (consoles, labs, NPCs)

const listener = new THREE.AudioListener();
camera.add(listener); // follows head in VR

const consoleAudio = new THREE.PositionalAudio(listener);
consoleAudio.setRefDistance(2); // audible radius: 2m
consoleAudio.setRolloffFactor(2);
interactiveConsole.add(consoleAudio); // audio emits from console position
```

**Per-lab spatial audio:** When a child looks at Lab 3 (Pink Lab `#FF66AA`), the lab's audio theme should emit from the direction of Lab 3 in the scene. `LAB_COLOR_AUDIO_PROFILES` already defines per-lab audio — spatial positioning just adds a world-space origin.

**NPC audio:** `AmbientNPCs.tsx` (8 bots) — each NPC gets a `PositionalAudio` component. When a child hears an NPC talking, it comes from the NPC's actual position in the cockpit.

**Source:** [THREE.PositionalAudio docs](https://threejs.org/docs/#api/en/audio/PositionalAudio), [Web Audio API — PannerNode (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode)

---

### 4.6 Locomotion Plan

**Current:** No locomotion — camera is stationary in seated cockpit.

**VR Locomotion Options:**

| Type | Description | Comfort | Recommended For |
|---|---|---|---|
| **Stationary (seated)** | No movement — cockpit is fixed, user stays put | Excellent (no sickness) | Dashboard/home cockpit experience |
| **Teleport** | Point controller at floor, click to jump to location | Good | Spatial dashboard lab exploration |
| **Smooth locomotion** | Thumbstick walk — moves camera continuously | Poor for sensitive users | Not recommended for children |
| **Gaze-based selection** | Look at an object for 1–2s to select/navigate | Excellent | Fallback for users without controllers |

**Recommendation for SparkForge:**
- Cockpit home/dashboard: **Stationary seated** — no locomotion needed, the cockpit wraps around the user
- Lab spatial map exploration: **Teleport locomotion** to walk between lab stations
- Games: **Stationary** — game environments are compact, designed for seat-based play

**Implementation:**
```tsx
// Teleport implementation via @react-three/xr
import { XRControllerLocomotion } from '@react-three/xr';

<IfInSessionMode allow="immersive-vr">
  <XRControllerLocomotion
    mode="teleport"
    teleportTargets={LAB_FLOOR_POSITIONS} // pre-defined safe landing spots
  />
</IfInSessionMode>
```

**Source:** [@react-three/xr Locomotion](https://github.com/pmndrs/xr#locomotion), [Oculus Locomotion Design Guidelines](https://developer.oculus.com/resources/locomotion-design-guidelines/)

---

### 4.7 New Store: `xrStore.ts`

A new Zustand store is needed to manage XR session state cleanly, avoiding prop-drilling XR state into every component.

**Proposed shape:**
```typescript
interface XRState {
  isPresenting: boolean;           // in active XR session
  xrProfile: 'quest2'|'quest3'|'pcvr'|null;
  handTrackingAvailable: boolean;
  dominantHand: 'left'|'right';
  vrComfortLevel: 'standard'|'reduced-motion';
  
  // Actions
  enterXR: () => void;
  exitXR: () => void;
  setXRProfile: (profile: XRState['xrProfile']) => void;
}
```

This store would be read by: `CameraSystem`, `PostProcessingStack`, `deviceStore`, `sceneStore`, `CockpitUILayer`, all game components.

---

*Section 4 of 8 — continues in next section.*

---

## 5. Game-by-Game VR Adaptation Strategy

SparkForge has 35 games across 3 tiers. VR adaptation requirements vary significantly by game type. Games are classified into 4 VR adaptation categories:

- **VR-Native:** Minimal changes — the game's mechanics are naturally suited to VR interaction
- **VR-Enhanced:** Moderate changes — core mechanic works, interaction model improves with VR
- **VR-Adapted:** Significant changes — game works in VR with modified UX to suit controller/spatial input
- **VR-Redesign:** Major changes — game mechanic is fundamentally 2D/pointer-based and needs VR-native reimagining

---

### 5.1 Flagship Games (6 games — 20M tri budget desktop)

| # | Game | File | VR Category | VR Interaction | Notes |
|---|---|---|---|---|---|
| 1 | **Pet Trainer** | `PetTrainerGame.tsx` | VR-Native | Reach out and pet/feed the 3D creature with hand tracking | `Pet3DScene.tsx` renders a full 3D creature — hand tracking creates a magical "reach out and touch" moment |
| 2 | **Neural Builder** | `NeuralBuilderGame.tsx` | VR-Native | Grab and connect floating neural network nodes with controllers | `NeuralNetwork3D.tsx` nodes already float in 3D space — controller grab maps directly |
| 3 | **Prompt Lab** | `PromptLabGame.tsx` | VR-Adapted | VR keyboard for text input, 3D preview of prompt results | Text-heavy game; requires VR keyboard overlay — Quest Browser handles this natively |
| 4 | **Agent Architect** | `AgentArchitectGame.tsx` | VR-Native | Pick up and arrange agent pipeline blocks in 3D space | `AgentPipeline3D.tsx` — spatial block arrangement is ideal for 6DOF controllers |
| 5 | **Bias Detective** | `BiasDetectiveGame.tsx` | VR-Enhanced | Point controller at decision cards to flip/reveal bias | `BiasScales3D.tsx` and `BiasDecisionTree3D.tsx` — scales tipping in VR is compelling |
| 6 | **Sort Toy Box** | `SortToyBoxGame.tsx` | VR-Native | Physically pick up objects and drop in the correct bin | `SortScene3D.tsx` and `SortFeatureViz3D.tsx` — drag-and-drop becomes physical grabbing in VR |

**Flagship VR Highlight:** Pet Trainer + Neural Builder + Sort Toy Box offer the most transformative VR experiences — reaching out to touch/grab 3D objects is the core "wow moment" of VR for children.

---

### 5.2 FL-Lite Games (9 games — 10M tri budget desktop)

| # | Game | File | VR Category | VR Interaction | Notes |
|---|---|---|---|---|---|
| 7 | **Code Blocks** | `CodeBlocksGame.tsx` | VR-Enhanced | Grab and stack code blocks in physical space | `CodeBlocks3D.tsx` — block stacking in 3D is a natural VR mechanic |
| 8 | **Chatbot Builder** | `ChatbotBuilderGame.tsx` | VR-Adapted | Connect conversation nodes floating in space | `ChatbotNodes3D.tsx` — node graph interaction with controllers |
| 9 | **Data Detective** | `DataDetectiveGame.tsx` | VR-Enhanced | Walk up to evidence boards, pick clues | `DataDetective3D.tsx` — spatial investigation feels immersive |
| 10 | **Robot Vacuum** | `RobotVacuumGame.tsx` | VR-Native | Physically guide a virtual robot around the room | `RobotVacuum3D.tsx` — steering a virtual robot in VR is excellent for children |
| 11 | **Camera Quest** | `CameraQuestGame.tsx` | VR-Native | Hold the virtual camera and frame scenes with controllers | `CameraQuest3D.tsx` — holding a virtual camera in VR is intuitive |
| 12 | **Future Forge** | `FutureForgeGame.tsx` | VR-Enhanced | Build future-tech items in 3D workshop space | `FutureForge3D.tsx` — assembly mechanic benefits from 3D manipulation |
| 13 | **My First AI App** | `MyFirstAiAppGame.tsx` | VR-Adapted | Touch UI panels floating in VR cockpit | `MyFirstAiApp3D.tsx` — app-building panels work in VR space |
| 14 | **Emoji Decoder** | `EmojiDecoderGame.tsx` | VR-Adapted | Choose from floating emoji options with controller ray | `EmojiDecoder3D.tsx` — selector UI works with XR rays |
| 15 | **AI or Not** | `AiOrNotGame.tsx` | VR-Enhanced | Physically walk to "AI" or "Human" zones to vote | `AiOrNot3D.tsx` — binary choice game becomes a physical movement in VR |

---

### 5.3 Standard Games (20 games — 5M tri budget desktop)

Standard games use the `StandardEnvironmentBase` + procedural environments. VR adaptation is primarily about the environment becoming immersive rather than the game mechanic changing significantly.

| Game | File | VR Category | Primary Change |
|---|---|---|---|
| **AI Spy** | `AiSpyGame.tsx` | VR-Enhanced | "I spy" scanning the environment with head movement |
| **AI Art Detective** | `AiArtDetectiveGame.tsx` | VR-Enhanced | Examine artwork up close by walking to canvases |
| **API Explorer** | `ApiExplorerGame.tsx` | VR-Adapted | Floating API request panels, select with ray |
| **Build Classifier** | `BuildClassifierGame.tsx` | VR-Adapted | Card sorting with controller grab |
| **Career Explorer** | `CareerExplorerGame.tsx` | VR-Adapted | Walk-around career showcase environment |
| **Data Shield** | `DataShieldGame.tsx` | VR-Enhanced | Physically block incoming data threats |
| **Ethics Courtroom** | `EthicsCourtroomGame.tsx` | VR-Native | Sit in courtroom, argue cases in VR space |
| **Fool the AI** | `FoolTheAiGame.tsx` | VR-Adapted | Input panel in VR, see AI responses on floating screen |
| **Human vs Machine** | `HumanVsMachineGame.tsx` | VR-Enhanced | Head-to-head competition visualization in 3D arena |
| **Lost in Translation** | `LostInTranslationGame.tsx` | VR-Adapted | Choose translation tiles floating in space |
| **Neuron Relay** | `NeuronRelayGame.tsx` | VR-Enhanced | Physically connect neurons floating around user |
| **Pixel Investigator** | `PixelInvestigatorGame.tsx` | VR-Enhanced | Examine images up-close, zoom in by leaning forward |
| **Prediction Market** | `PredictionMarketGame.tsx` | VR-Adapted | Floating stock-ticker style panels |
| **Real or Fake** | `RealOrFakeGame.tsx` | VR-Enhanced | Reach out and flip cards to reveal real/fake |
| **Sentiment Scanner** | `SentimentScannerGame.tsx` | VR-Adapted | Emoji/slider UI in VR panel |
| **Time Machine** | `TimeMachineGame.tsx` | VR-Native | Physical time-travel cockpit lever — perfect for VR |
| **Token Chopper** | `TokenChopperGame.tsx` | VR-Enhanced | "Chop" tokens out of text with virtual hands |
| **Tool Picker** | `ToolPickerGame.tsx` | VR-Adapted | Grab floating tool cards |
| **Treat Trainer** | `TreatTrainerGame.tsx` | VR-Enhanced | Hold treat out to train virtual creature |
| **Word Predictor** | `WordPredictorGame.tsx` | VR-Adapted | Select next-word tiles from floating panel |

---

### 5.4 VR Adaptation Summary

| Category | Count | % of Library | Avg Effort |
|---|---|---|---|
| **VR-Native** | 10 | 29% | Low — mostly XR grab + existing 3D |
| **VR-Enhanced** | 13 | 37% | Medium — environment immersion + minor interaction |
| **VR-Adapted** | 11 | 31% | Medium-High — UI panels + controller input |
| **VR-Redesign** | 1 | 3% | High — Prompt Lab text input (VR keyboard required) |

**Key finding:** 66% of SparkForge's 35 games are either VR-Native or VR-Enhanced with minimal re-engineering. Only Prompt Lab requires significant input model work (and even there, Meta Quest's built-in VR keyboard handles the hard part).

---

### 5.5 Priority VR Launch Games (Recommended First Wave)

If building a VR mode incrementally, these 5 games offer the highest VR impact with the lowest implementation effort:

1. **Pet Trainer** — Hand tracking + creature interaction = highest "wow" factor for ages 7–10
2. **Sort Toy Box** — Physical grab-and-sort = intuitive for all ages, demonstrates 6DOF naturally
3. **Neural Builder** — Node connection in space = compelling for ages 11–16
4. **Robot Vacuum** — Steering a physical robot = great for younger children
5. **Ethics Courtroom** — Seated immersive environment = natural VR without locomotion

These 5 games span all age bands (A/B/C), include both Flagship and Standard tiers, and cover all 3 game mechanic types (build/sort, explore, argue/decide).

---

*Section 5 of 8 — continues in next section.*
