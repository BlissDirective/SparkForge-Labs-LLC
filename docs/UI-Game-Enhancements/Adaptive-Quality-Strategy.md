# Adaptive Quality Strategy — "optimize, don't downgrade"

> **Date:** 2026-06-28 · Supersedes the "2D mobile fallback" framing in the
> migration map / Fable Phase D. **Decision (owner, 2026-06-28):** lower-end
> devices should get an *optimized version of the same experience*, not a
> separate 2D game.

---

## 1. The recommendation (TL;DR)

Render the **same R3F scene everywhere**, but scale its fidelity along a
**quality ladder** chosen from real device capability + a live FPS monitor.
Keep a genuine **floor** for devices that truly can't do 3D — and that floor is
the **Pixi 2D archetype already built in Waves 1–7** (so that work is
repurposed, not wasted, and it doubles as the accessibility path).

```
ULTRA   desktop + WebGPU, strong GPU      full effects, 37.8M-tri cockpit, DPR≤2
HIGH    desktop/laptop, WebGPU/WebGL2      DoF off if FPS dips, DPR≤1.5
MEDIUM  tablet / mid Android, WebGL2       no post-FX, shadows low, fewer particles, 30fps cap
LOW     weak mobile GPU, WebGL2            flat lighting, no shadows, instanced LODs, minimal particles
FLOOR   no WebGL2 / detect-gpu tier 0      → Pixi 2D archetype (same game, 2D) + a11y DOM path
```

This is the standard R3F approach and it preserves brand fidelity for the broad
middle while guaranteeing *something playable* on the cheapest school Chromebook.

## 2. Why not "just optimize, no 2D at all"

A pure-3D-everywhere policy fails on the real floor:
- **WebGPU is not universal** (older Safari/Android, locked-down school
  devices). The platform already treats WebGPU as primary with an MP4 fallback
  for the hero — games need the same realism.
- **Some devices have no usable GPU** (no WebGL2, or `detect-gpu` tier 0). No
  amount of scaling makes a 37.8M-tri scene run there.
- **COPPA/education reality:** SparkForge targets school Chromebooks (the Fable
  doc's explicit 60 fps target device). Many are GLES2-class.

So: optimize aggressively across ULTRA→LOW (one scene, scaled), and fall back to
2D only at the true FLOOR. The 2D archetypes are the safety net + the
keyboard/AT experience, not the mobile default.

## 3. What scales between tiers (the knobs)

All applied to the **same** scene graph:

| Knob | ULTRA → FLOOR |
|------|---------------|
| Renderer | WebGPU → WebGL2 → (2D) |
| `dpr` (resolution) | 2.0 → 1.5 → 1.0 → 0.75 |
| Postprocessing | DoF + N8AO/SSAO + bloom → bloom only → none |
| Shadows | high-res → low-res → off |
| Geometry | full mesh → LODs / instancing → impostors |
| Particles | full count → reduced → minimal |
| Target FPS | 60 → 60 → 30 (frame-rate cap) |
| Antialiasing | MSAA → FXAA → off |

Much of this infra already exists and just needs unifying:
- **Performance toggle (D3D-5 relaxation)** already omits DoF + N8AO/SSAO.
- **`triangleBudget`** per game in `gameRegistry.ts`.
- **`ADAPTIVE_CURVATURE`** + tier thresholds in `cockpitConfig.ts`.
- **`useDeviceProfile`** (width-based tiers) — a starting signal.
- WebGPU-primary + MP4-poster fallback for the hero.

## 4. Best way to accomplish it (implementation plan)

1. **Capability probe** — `src/lib/3d/qualityTier.ts`:
   - static: `navigator.gpu` (WebGPU?), `detect-gpu` (GPU tier/benchmark),
     `deviceMemory`, `hardwareConcurrency`, `devicePixelRatio`, WebGL2 support.
   - resolve an initial tier ULTRA…FLOOR. Persist the user's manual override
     (extend the existing Settings Performance toggle to a 3-way: Auto / High /
     Battery).
2. **`useQualityTier()` hook** — returns `{ tier, dpr, postFx, shadows, particleScale, maxFps, renderer }`. Every R3F scene reads it.
3. **Dynamic downgrade** — wrap scenes in drei `<PerformanceMonitor>` (+
   `<AdaptiveDpr pixelated />`, `<AdaptiveEvents>`): if measured FPS stays below
   budget, step the tier down at runtime (and back up if headroom returns). This
   is the single highest-leverage piece — it self-corrects on unknown hardware.
4. **Scene wiring** — cockpit + the genuine-R3F flagships (Prompt Lab, Agent
   Architect, Context Architect, Pixel Witness, Lab 11) read the tier to gate
   postprocessing passes, shadow maps, LOD selection, particle counts, and DPR.
5. **FLOOR routing** — when `tier === FLOOR` (no WebGL2 / detect-gpu 0), render
   the game's Pixi 2D archetype instead of the R3F scene. This reuses the
   Waves 1–7 wrappers and the `window.__SPARKFORGE_GAME__` + a11y path.
6. **Renderer selection** — prefer the existing WebGPU path; fall back to WebGL2
   automatically (R3F supports both); only then FLOOR.
7. **Verify** — extend the Playwright harness to load each scene under throttled
   CPU/GPU and assert it stays interactive; SSIM ≥ 0.96 only enforced at ULTRA
   (lower tiers are intentionally different).

### New dependency
- `detect-gpu` (~small, MIT) for the static GPU tier. drei's
  `PerformanceMonitor`/`AdaptiveDpr` are already in `@react-three/drei`.

## 5. How this changes Phase D

- The migration map's "R3F (X fallback)" entries are reinterpreted: the 2D
  archetype is the **FLOOR tier**, not the mobile default. Mobile/tablet on
  capable GPUs get **optimized 3D** (MEDIUM/LOW), not 2D.
- `useDeviceProfile`'s width-based mobile→`MobileDashboard` short-circuit should
  be revisited: width is a poor proxy for GPU power (a tablet can be powerful, a
  cheap laptop weak). Move the decision to `useQualityTier()` (capability-based),
  keeping width only for *layout*.
- No flagship needs a hand-built separate 2D game; they need the tier hooks.

### Open question for the owner
- **Scope of tiers now vs later:** ship the `useQualityTier()` + drei
  `PerformanceMonitor` auto-scaling on the **cockpit** first (highest-traffic,
  heaviest scene), then roll to flagships? Or wire all R3F scenes at once?
  (Recommend: cockpit first as the proof, then flagships — mirrors the
  Phase-B-before-Phase-C cadence that worked for the games.)
