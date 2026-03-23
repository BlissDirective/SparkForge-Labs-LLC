# Desktop-First Immersive 3D Overhaul — Part C

## Post-Processing, Spatial Audio, Interactivity & Environments

**Version:** 1.0 | **Date:** March 23, 2026 | **Author:** Claude Code
**Scope:** Phase 3 of 4 — Full EffectComposer stack, iris transition audio, mouse parallax, interactive surfaces.
**Depends On:** Part A (D3D-1 through D3D-9) + Part B (D3D-B1 through D3D-B6)
**Builds Toward:** Part D (Document Updates, Error Analysis & Enhancement Ideas)

---

## 1. OVERVIEW

This document is **Part C** of the 4-part Desktop-First Immersive 3D Overhaul. Part A removed constraints, Part B consolidated the canvas architecture. Part C now adds the immersive layers that make the 3D experience feel alive.

### Part Map

| Part | Title | Scope |
|------|-------|-------|
| **A** | Foundation Cleanup | Remove mobile/LOD/CSS fallbacks. Hardcode desktop-ultra. |
| **B** | Single Canvas & Mechanical Iris | Persistent CockpitCanvas, SceneStore, SceneRouter, MechanicalIris. |
| **C (this)** | Post-FX, Audio & Interactivity | Full EffectComposer, iris audio, mouse parallax, interactive surfaces. |
| **D** | Document Updates & Error Analysis | Stage .md updates, CLAUDE.md updates, error analysis, enhancement ideas. |

### Core Changes

1. **PostProcessingStack** — Extracted, enhanced component with 7 always-on effects and scene-reactive multipliers
2. **IrisAudio** — Procedural audio for mechanical iris transition (gear clicks, servo whir, hydraulic hiss, light ray hum)
3. **useParallaxMouse** — Smooth mouse-position tracking for subtle 3D scene depth movement
4. **useInteractiveSurface** — Hover-reactive cockpit surfaces with glow/scale/emissive transitions

---

## 2. DECISION LOCKS (New — D3D-C Series)

| ID | Decision | Rationale |
|----|----------|-----------|
| **D3D-C1** | 7 post-processing effects always-on: N8AO, Bloom, ChromaticAberration, DOF, Noise, Vignette, BarrelDistortion | D3D-5 implementation. Desktop-only means no performance concern. Maximum visual fidelity. |
| **D3D-C2** | Scene-reactive effect multipliers per active scene | Bloom increases during iris transition, DOF deepens in spatial view, chromatic aberration intensifies during hero. Dynamic visual feel. |
| **D3D-C3** | Procedural iris audio via Web Audio API (not audio samples) | Matches cockpitAudio.ts singleton pattern. Zero additional assets. Fully parametric and direction-aware. |
| **D3D-C4** | Mouse parallax with 0.05 smoothing, 1.0 intensity | Subtle enough to not distract children ages 7-16, strong enough to add perceived depth. |
| **D3D-C5** | Interactive surfaces use emissive + scale (not outline) | Consistent with Frost-Prismatic chrome aesthetic. Outline post-processing would clash with existing effects. |

---

## 3. PHASE 3A — Enhanced PostProcessingStack

### 3.1 NEW FILE: `src/components/3d/PostProcessingStack.tsx`

Extracted from CockpitCanvas as a standalone component. Uses `@react-three/postprocessing` v3.0.4.

**Effects (render order):**

| # | Effect | Purpose | Default Intensity |
|---|--------|---------|-------------------|
| 1 | N8AO (SSAO) | Ambient occlusion for depth | intensity=1.5, radius=0.5 |
| 2 | Bloom | Luminance-based glow | intensity=0.4, threshold=0.6 |
| 3 | ChromaticAberration | RGB channel offset | offset=0.0006 |
| 4 | DepthOfField | Subtle tilt-shift focus | focusDistance=0.01, bokeh=2.0 |
| 5 | Noise | Film grain texture | opacity=0.06 |
| 6 | Vignette | Edge darkening | darkness=0.5 |
| 7 | BarrelDistortion | Lens distortion | strength=0.02 |

**Scene-reactive multipliers:**

| Scene | Bloom | Chromatic | SSAO | DOF | Noise |
|-------|-------|-----------|------|-----|-------|
| cockpit | 1.0x | 1.0x | 1.0x | 1.0x | 1.0x |
| game | 1.2x | 0.5x | 0.8x | 0.5x | 1.0x |
| spatial | 1.0x | 0.8x | 1.2x | 1.5x | 0.8x |
| hero | 1.5x | 1.2x | 0.6x | 0.3x | 1.2x |
| transitioning | 1.8x | 1.5x | 0.4x | 0.2x | 0.5x |

See `src/components/3d/PostProcessingStack.tsx` for the complete ~155 line implementation.

---

## 4. PHASE 3B — Iris Audio Module

### 4.1 NEW FILE: `src/lib/audio/irisAudio.ts`

Singleton `IrisAudioEngine` class following the `CockpitAudioEngine` pattern. Pure Web Audio API.

**Sound design layers:**

| Layer | Sound | Timing | Technique |
|-------|-------|--------|-----------|
| Gear click | Metallic transient | 0.0s + 0.9s | Highpass-filtered noise burst (15ms) |
| Servo whir | Rising mechanical whine | Continuous | Sawtooth → bandpass, freq 200→600Hz with progress |
| Hydraulic hiss | Pressure release | 0.0–0.7 normalized | Filtered white noise, envelope-shaped |
| Light ray hum | Harmonic tone | 0.5–0.9 progress | Sine at 440Hz, intensity follows ray progress |
| Final snap | Impact + sub-bass | 0.9 progress | Click + sine sweep 60→30Hz |

**API:** `startTransition(direction)`, `syncProgress(progress, direction)`, `stopTransition()`, `mute()`, `unmute()`, `dispose()`

For iris-close: direction parameter reverses the pitch sweep (high→low instead of low→high).

See `src/lib/audio/irisAudio.ts` for the complete ~224 line implementation.

---

## 5. PHASE 3C — Interactive Surfaces & Parallax

### 5.1 NEW FILE: `src/hooks/useParallaxMouse.ts`

Mouse-position parallax tracking hook. Provides smooth interpolated normalized coordinates (-1 to 1) for 3D scene depth movement.

- Tracks raw mouse position via `mousemove` event
- Smooths via rAF interpolation loop (configurable smoothing factor)
- Returns ref to avoid re-renders (values read imperatively in useFrame)

**Options:** `smoothing` (0.05), `intensity` (1.0), `enabled` (true)

### 5.2 NEW FILE: `src/hooks/useInteractiveSurface.ts`

Hook for making R3F meshes hover-reactive. Returns `meshRef`, `state`, and `handlers` object.

**Features:**
- Smooth hover progress (0→1) via useFrame interpolation
- Scale up on hover (default 1.05x)
- Emissive intensity increase on hover (default 0.3)
- Press scale-down (0.97x) on pointer down
- Cursor change to pointer on hover
- Click/hover callbacks

See source files for complete implementations.

---

## 6. PHASE 3D — CockpitCanvas & CameraSystem Integration

### 6.1 MODIFY: `src/components/3d/CockpitCanvas.tsx`

Changes needed to integrate Part C components:

1. **Replace** inline `PostprocessingStack` with imported `<PostProcessingStack />` component
2. **Add** `useParallaxMouse` hook and pass ref to CameraSystem
3. **Wire** iris audio: call `irisAudioEngine.startTransition()` on transition start, `syncProgress()` each frame, `stopTransition()` on completion

### 6.2 MODIFY: `src/components/3d/CameraSystem.tsx`

Add optional parallax offset to all non-hero camera modes:

```typescript
interface CameraSystemProps {
  // ... existing props
  parallaxRef?: React.RefObject<ParallaxValues>;
}

// In useFrame, after position interpolation:
if (mode !== 'hero' && parallaxRef?.current) {
  cam.position.x += parallaxRef.current.smoothX * 0.3;
  cam.position.y += parallaxRef.current.smoothY * 0.15;
}
```

---

## 7. IMPACT SUMMARY — PHASE 3

### Files CREATED (4)

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/3d/PostProcessingStack.tsx` | Full 7-effect EffectComposer (D3D-C1) | ~155 |
| `src/lib/audio/irisAudio.ts` | Iris transition procedural audio (D3D-C3) | ~224 |
| `src/hooks/useParallaxMouse.ts` | Mouse parallax tracking (D3D-C4) | ~67 |
| `src/hooks/useInteractiveSurface.ts` | Hover-reactive surfaces (D3D-C5) | ~131 |

### Files TO MODIFY (2) — Integration in Phase 3D

| File | Change | Impact |
|------|--------|--------|
| `CockpitCanvas.tsx` | Import PostProcessingStack, add parallax + iris audio | ~20 lines changed |
| `CameraSystem.tsx` | Add parallax offset prop | ~10 lines added |

### Net Effect

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Post-processing effects | 3 (Bloom, Vignette, BarrelDistortion) | 7 (+ SSAO, ChromaticAberration, DOF, Noise) | +4 effects |
| Iris audio feedback | None | Full procedural soundscape | New |
| Mouse parallax | None | Smooth depth movement | New |
| Surface interactivity | Basic click handlers | Glow/scale/emissive hover transitions | Enhanced |
| Scene-reactive effects | None (static intensities) | 5 scene modes with multipliers | Dynamic |

---

## 8. EXECUTION CHECKLIST — PHASE 3

- [ ] **3.1** Create `src/components/3d/PostProcessingStack.tsx`
- [ ] **3.2** Create `src/lib/audio/irisAudio.ts`
- [ ] **3.3** Create `src/hooks/useParallaxMouse.ts`
- [ ] **3.4** Create `src/hooks/useInteractiveSurface.ts`
- [ ] **3.5** Update `src/components/3d/CockpitCanvas.tsx` — integrate PostProcessingStack, parallax, iris audio
- [ ] **3.6** Update `src/components/3d/CameraSystem.tsx` — add parallax offset
- [ ] **3.7** `npm run build` — verify clean compilation
- [ ] **3.8** `npx tsc --noEmit` — verify zero type errors
- [ ] **3.9** Commit: `"D3D Phase 3: Post-FX, spatial audio, interactivity"`

---

*End of Part C — Desktop-First Immersive 3D Overhaul: Post-FX, Audio & Interactivity*
*Next: Part D — Document Updates, Error Analysis & Enhancement Ideas*
