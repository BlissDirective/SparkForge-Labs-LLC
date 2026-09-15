# Decision Lock — Hologram-Forge Hub (2026-09)

**Status:** LOCKED  
**Date:** 2026-09-14  
**Source:** `docs/forge-hub/TRANSITION_ACTION_PLAN.md` v2.2 §0  
**Owner:** Conrad Steinmeyer (sole approver)  
**Repo / branch:** BlissDirective/SparkForge-Labs-LLC · `setup-sparkforge-dev`  
**Task:** W0-01  

Agents may propose amendments; they may **not** reopen these decisions. Reopening is Tier 2 (owner packet via Foreman).

---

## Decisions 1–10 (confirmed 2026-09-14)

| # | Decision | Locked answer |
|---|----------|---------------|
| 1 | Direction | Forge hub is the kid-facing shell on **desktop and ultrawide**. Concept 10 §0.1 and Rebuild IV.2 are **amended**, not ignored. |
| 2 | Panel technology | **DOM panels projected from the 3D scene.** Glass meshes carry motion; DOM content rides them and never stretches. |
| 3 | Canvas placement | **One canvas in the root layout**, mode by pathname; FLAT routes pause and hide it. |
| 4 | Mobile / tablet | Today's HTML dashboard shell stays as the **compact-tier shell** (&lt; 1440 px), restyled. **No canvas** below 1440 px. |
| 5 | Games | Games play inside merged hologram **`PlayStage` by default**, with per-game fullscreen escape hatch. |
| 6 | Sparky | **Rigged 3D character on the desk**; face from expression system; outfit packs by calendar; 2D stills from same model for in-game + compact. Not a painted dock on the plate; not overlay-only. |
| 7 | Welcome | **`welcome`** = shrunken side panels with hero key details + center login under "Welcome to SparkForge". `/`, `/login`, `/signup` share the scene. |
| 8 | Choreography | Every state change is a **directed, interruptible sequence** (Director): GSAP at runtime; Theatre.js for authored cinematic beats. |
| 9 | PR #164 | **Port, then close.** Port layout math, portal reducer, catalog, tests, blend tokens, plates. Not hotspot shell, route, or old flag. |
| 10 | Renderer / flag | **`three/webgpu` via `createRenderer`** + TSL materials (WebGPU → WebGL2 → poster). Flag family **`FORGE_HUB*`** in `src/config/feature-flags.ts`. |

## Decisions 11–13 (owner answers 2026-09-14)

| # | Question | Locked answer |
|---|----------|---------------|
| 11 | Marketing long-scroll | **Dropped.** Welcome scene is the marketing hero. Features / How-It-Works / AI tutor condense into side panels + "Learn more" Focus. Pricing + legal stay flat. |
| 12 | Outfit calendar | Year-one catalog in plan §6b (Halloween set, holidays, seasons, suit, unlockables). Parent toggle stays. |
| 13 | Sparky conversation | **Head-emitter HoloBubble** — chat hologram above other screens. Text only in v1. |

---

## Related locks (art)

| Asset | Path | Rule |
|-------|------|------|
| Hub plate | `public/forge-hub/world/LOCKED_HERO.png` | Never regenerate / restyle; verify `SHA256SUMS` |
| Sparky | `public/forge-hub/sparky/LOCKED_SPARKY.png` | Same; see `LOCKED_SPARKY.md` + `docs/sparky/SPARKY-CHARACTER-SPEC.md` |

---

## Explicit non-goals (v1)

- Pixel Streaming / Unreal for every concurrent kid  
- Free-look camera  
- New Zustand store (repurpose `sceneStore` → `forgeStore`)  
- Editing `src/components/games/*` internals  
- Painted Sparky dock on the locked plate  

---

## Supersedes

Earlier CDO Phase 0 draft defaults that conflicted: Sparky as 2D overlay-only; heavy games always EXIT the forge. Those are replaced by decisions 5–6 above.

---

## Sign-off

| Role | Action |
|------|--------|
| Owner | Locked via TAP v2.2 ("lock both, proceed" + §0 Q11–13) |
| Foreman | W0-01 recorded this file · 2026-09-14 |
| Scribe | Owns follow-on W0-02…W0-08 amendments referencing this lock |
