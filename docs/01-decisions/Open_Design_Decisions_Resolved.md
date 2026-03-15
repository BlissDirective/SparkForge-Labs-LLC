# Open Design Decisions — Resolved

**Date:** March 15, 2026
**Status:** LOCKED
**Context:** These four open design questions were resolved and locked to unblock Stage 1+ development.

---

## Decision OD-1: Audio Default Behavior

**Question:** What should the default audio state be for new users?

**Resolution:** Sound ON by default, optional toggle via child settings.

**Details:**
- Aligns with existing Decision 1.3 (confirmed, no change)
- Audio is enabled on first launch for all new child profiles
- Each child profile has an independent `soundEnabled` setting in `uiStore`
- Toggle available in the child Settings page (Stage 4 Part 3)
- Parent dashboard (Stage 8) can override audio per-child via `contentFilter` in `parentStore`
- Implementation uses Tone.js — audio context initializes on first user interaction (browser autoplay policy compliance)

**Affected Stages:** 1 (uiStore default), 4 (settings toggle), 6-7 (game audio), 8 (parent override)

---

## Decision OD-2: Crystal Shatter Skip Behavior

**Question:** How should the crystal shatter arrival sequence behave when users want to skip it?

**Resolution:** Fast-forward scrub — shards accelerate to cockpit.

**Details:**
- When user clicks/taps during the CrystalShatter sequence, the animation accelerates (not abruptly cuts)
- Shards fast-forward their trajectories toward the cockpit assembly point
- Acceleration factor: 4x normal speed (completes remaining animation in ~0.5s)
- Visual continuity is preserved — user still sees the shatter-to-cockpit transition, just faster
- Implementation: `CrystalShatter.tsx` (Stage 3 v3-FINAL Part 3A) listens for click/tap events and multiplies the GSAP timeline `timeScale`
- Keyboard accessible: `Enter` or `Space` triggers the same fast-forward

**Affected Stages:** 3 (CrystalShatter.tsx implementation)

---

## Decision OD-3: Repeat Visit Crystal Sequence

**Question:** Should the crystal shatter sequence play on every visit, or be shortened/skipped for returning users?

**Resolution:** Always play Full sequence. Create option to skip or shorten via Settings page.

**Details:**
- The crystal shatter arrival plays in full on every dashboard visit by default
- A "Skip Intro Animation" toggle is added to the child Settings page (Stage 4 Part 3)
- When enabled, the sequence is skipped entirely (instant cockpit render)
- Setting is stored per-child in `uiStore` as `skipIntroAnimation: boolean` (default: `false`)
- No auto-shortening based on visit count — user explicitly controls this
- First-time users always see the full sequence regardless of setting state

**Affected Stages:** 1 (uiStore shape), 3 (CrystalShatter conditional), 4 (settings toggle)

---

## Decision OD-4: WebGPU Compute Shaders

**Question:** Should the platform target WebGPU for particle rendering?

**Resolution:** Yes — target WebGPU compute shaders for 500M+ particle budget with WebGL2 graceful degradation.

**Details:**
- WebGPU compute shaders are the primary rendering path for particle systems on supported browsers
- Target particle budget: 500M+ particles on WebGPU-capable hardware
- Graceful degradation chain:
  1. **WebGPU** (preferred): Full compute shader particle pipeline, 500M+ budget
  2. **WebGL2** (fallback): Standard instanced rendering, capped at device-tier budgets (see CLAUDE.md Section 9.1)
  3. **CSS** (minimal): 12-15 CSS-animated particles for non-GPU contexts
- Detection uses `webgpuDetection.ts` utility (Stage 1 Part 2) — checks `navigator.gpu` availability
- WebGPU particle shaders stored in `src/shaders/` alongside existing GLSL lab pattern shaders
- The `deviceStore` gains an additional `gpuTier: 'webgpu' | 'webgl2' | 'css'` field based on runtime detection
- R3F scenes use `useWebGPU()` hook to select the appropriate particle system at mount time
- Performance monitoring: `useAdaptiveLOD()` (Section 9.1) includes WebGPU FPS tracking and auto-downgrade to WebGL2 if sustained frame drops detected

**Affected Stages:** 1 (detection utility, deviceStore), 5 (particle systems), 6-7 (game particles)

---

## Implementation Notes

These decisions should be applied as follows during the build:

| Decision | First Touchpoint | Key Files |
|----------|-----------------|-----------|
| OD-1 | Stage 1 Part 2 (uiStore) | `stores/uiStore.ts`, child settings page |
| OD-2 | Stage 3 Part 3A (CrystalShatter) | `components/3d/CrystalShatter.tsx` |
| OD-3 | Stage 1 Part 2 (uiStore) + Stage 4 Part 3 (settings) | `stores/uiStore.ts`, settings page |
| OD-4 | Stage 1 Part 2 (webgpuDetection) | `utils/webgpuDetection.ts`, `stores/deviceStore.ts` |

All four decisions are now **LOCKED** and should not be revisited without explicit stakeholder approval.
