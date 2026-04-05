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
