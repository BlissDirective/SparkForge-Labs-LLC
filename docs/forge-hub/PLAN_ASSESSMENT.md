# Forge Hub plan — assessment (2026-09-12)

**Scope:** the six docs in `docs/forge-hub/` at `setup-sparkforge-dev` tip `927560c`, cross-checked against the code on that branch and PR #164.
**Verdict:** the six docs are internally coherent and the phasing is sensible for an R3F room. But the plan as written collides with the repo's current, shipped architecture direction, omits what it actually replaces, and references files that only exist in an unmerged PR. It should not move to Phase 1 until the eight decisions in §6 are closed.

---

## 1. Architectural collision (blocker)

The plan makes an R3F canvas the primary surface for `/`, `/home`, `/login`, `/signup`, `/labs`, `/arcade`, `/profile`, `/create`, `/story`, `/progress`, `/achievements`, `/mastery`, `/seasons`, `/buddies`, `/onboarding`. That is the critical path of every kid route. Three active, approved documents forbid exactly that:

| Document | Status | Rule |
|---|---|---|
| `docs/concepts/10-digital-forge-build-plan.md` §0.1 | **Shipped** F0–F8 (PROGRESS.md 2026-07-20), flags ON | 0.1.2 "The frame is DOM/CSS. Canvas is a garnish." Canvas only for marketing hero, one-shot ceremonies, `aria-hidden` ambience. 0.1.3 "No WebGL/WebGPU on any dashboard critical path." |
| `Fable-5-SparkForge-Rebuild.md` Part IV (line 769, IV.2) | Active master plan | "the pre-2026 3D-cockpit era shows the failure mode — a 37M-triangle spatial UI that had to be abandoned for HTML-first. Part IV must not repeat it." IV.2: "no WebGL on the dashboard critical path", "mobile is a first-class diorama". IV.3 unlock condition: Part III R1–R7 + G1–G3 + owner go. |
| `docs/IV-A-living-lab-spec.md` | Exploration draft | Rejects Three.js/WebGPU scenes for the hub because they "re-open the cockpit failure mode". |

The forge-hub plan's own §8 names the failure mode as "panoramic free-look cockpit". The repo's post-mortems attribute it to *canvas on the critical path* generally, not to free-look specifically. Both readings are defensible. The owner has to pick one explicitly, and if the forge hub is the new direction, Concept 10 §0.1.2–0.1.3 and Rebuild IV.2 must be amended in the same commit so the repo stops contradicting itself.

**CLAUDE.md is stale in the opposite direction.** It still describes the WebGPU Laboratory Control Station cockpit as current (v6.8, May 2026). The code says it was retired: `src/components/game/GameShell.tsx:6-7`, `src/app/(dashboard)/layout.tsx:2-5` ("Replaces the 3D cockpit"), `docs/UI-Game-Enhancements/Higgsfield-UI-Redesign-Plan.md:19`. Any agent working from CLAUDE.md will build against a shell that no longer exists. A v7 CLAUDE.md is needed whichever way the direction call goes.

## 2. What the plan actually replaces (unstated)

The docs say the forge "replaces the marketing hero". The screen inventory shows it also replaces the entire `(dashboard)` shell. None of the following are named anywhere in the six docs:

- `Sidebar`, `TopBar`, `BottomNav` in `src/components/layout/` and the dashboard layout itself.
- Concept 10 deliverables now live behind `FEATURE_FLAGS.FORGE_*`: Forge Dashboard Workbench (F4), `ForgeRing` lab selection (F5), `ForgeHero` Lightfall hero (F6), ForgeSpark mascot (F7), the `src/components/forge/*` primitive kit (`ForgePanel`, `HoloChip`, `CircuitTraces`, `EmberField`, …).
- The Molten-Warm palette lock (Concept 10: amber/gold dominant, cyan as accent, never cyan-on-black). LOCKED_HUB is cyan-primary on a rose-gold/cream room. That is a palette reversal, not a variation.
- The word "forge" already means the Concept 10 theme (`forge-theme.css`, `FORGE_THEME` flag, `/dev/forge` primitive showcase). The plan's `ForgeLayout`, `ForgeCore`, `forge-lab/*` names will collide in imports and in conversation.

**Sparky is already decided.** `docs/SPARKY-RIVE-SPEC.md` locks Rive (`public/rive/sparky.riv`, state machine `SparkyMachine`, inputs `comboTier`/`celebrate`/`encourage`/`thinking`), `@rive-app/react-canvas` is installed, and `src/components/sparky/SparkyRive.tsx` consumes it. Concept 10 §11.4 re-specs the same machine as `forgespark.riv` (unauthored). The plan's "tech options, decide Phase 5: Rive / Lottie / billboard / GLB" would create a third mascot system. `SparkyOverlay` should be a drei `Html` wrapper around the existing `SparkyRive`/`SparkyCore`, decided now.

## 3. Broken and inconsistent references

| Reference | Where | Reality on `setup-sparkforge-dev` |
|---|---|---|
| `src/lib/forge-lab/layouts.ts`, `/dev/forge-lab`, `docs/forge-lab-hub.md`, `public/forge-lab/world/LOCKED_HERO.png`, `LOCKED.md` | Phased plan §1, §7, §9; R3F plan §1 | Exist only in PR #164 (open, unmerged, 41 files, +2816, base 8 commits behind tip). The plan says "keep as fallback" but it is not on the branch. |
| `hub-concepts/locked/LOCKED_HUB`, `hub-concepts/locked/R3F_VARIATION_PLAN.md` | Phased plan header | Local paths. Should be `docs/forge-hub/…`. |
| `/workspace/SparkForge Labs/Phased-R3F-Hub-Plan.md` | INTERACTIVE_VIDEO_UI_PLAN | Local path. |
| `LOCKED_HUB.jpeg/png`, `LOCKED_SPARKY.png` | LOCKED_HUB.md | Not in repo (acknowledged). PR #164 ships a *different* lock at `public/forge-lab/world/LOCKED_HERO.png`. Two "locked" plates in two places. |
| `docs/Phased-R3F-Hub-Plan.md` (docs root) | — | Older rev of `docs/forge-hub/Phased-R3F-Hub-Plan.md` (differs in status, Sparky section, `heroWelcome`→`welcome`). Per CLAUDE.md §3.2 it should be archived or deleted. |
| PROGRESS.md | — | No entry for forge-hub, PR #164, or any of this work. |

**Terminology drift across the six docs:**

- Module names: Phased plan §3 uses `TopBanner / SideList / SideDetail / CenterWide`; R3F plan §2 and the inventory use `HoloL / HoloC / HoloR`. Pick one.
- `hubSplit` is "Top + L + R" in Phased §4 but "3 destinations Hub/Labs/Games" in R3F §3. The locked plate has three equal panels and no top banner. The Phased module catalog is not reconciled with the lock.
- Phased §5 crosswalk still says `heroWelcome`; §4 renamed it to `welcome`.
- Flag name `NEXT_PUBLIC_FORGE_LAB_R3F` does not follow either existing convention (`NEXT_PUBLIC_FF_*` via `src/lib/feature-flags.ts`, or `flag('KEY')` in `src/config/feature-flags.ts`).

## 4. Technical concerns for Phases 1–4

1. **Renderer is unspecified.** Plan says "R3F + drei". CLAUDE.md v6.6 Tech Quality Mandate says WebGPU+TSL with an MP4-poster fallback. `src/lib/3d/webgpuRenderer.ts` (`createRenderer`) and `webgpuDetect.ts` already exist and carry the iOS Safari crash guard from the cockpit era. Reuse them or state why not.
2. **drei `Html` mode.** Plan §7 wants `Html transform` on meshes. Today every drei `Html` in `src/components/3d/` is plain overlay (no `transform`, no `occlude`). `transform` puts forms and text under a CSS `matrix3d`, which blurs text at non-integer scales and complicates focus rings and IME input. `occlude="blending"` is WebGL-only. Phase 2 should prototype a login form under `transform` and check `/login` against `.lighthouserc.json` (a11y ≥ 0.9 is an `error` assertion; LCP ≤ 2.5 s and CLS ≤ 0.1 are checked; note `lhci autorun … || true` in CI means it currently cannot fail the build).
3. **Mobile is deferred to Phase 6.** CLAUDE.md v6.8 and Rebuild IV.2 both make mobile first-class. `src/hooks/useDeviceProfile.ts` already gates by tier. If `/` becomes the forge, phones have no plan until Phase 6. `EscapeFlat` should be the mobile/tablet path from Phase 3.
4. **Store budget.** `docs/STATE_ARCHITECTURE.md` roadmap R1/R2 consolidates to 12 stores and `scripts/audit-store-deps.sh` gates new ones. Morph mode state should be a slice, not a 15th store. PR #164's `layouts.ts` + `portalMachine.ts` are the right seed.
5. **Game exit has no mechanism.** Games mount via `next/dynamic` inside `/arcade/[gameSlug]` → `GameAdapter` → `HtmlGameShell`. There is no "leave the canvas" transition. Only 5 of 42 games use Phaser/Pixi (`TreatTrainer`, `SortToyBox`, `BuildClassifier`, `AiOrNot`, `FutureForge`); 37 are DOM/SVG/R3F. So "heavy Phaser/Pixi games EXIT" is the minority case. The real question is whether 37 DOM games render inside `PlayStage` as Html-on-mesh (inheriting the transform problems above) or whether all games EXIT. Recommend all games EXIT; `PlayStage` is for non-game surfaces (`/story`, `/create`).
6. **Contrast.** `docs/UX_CONTRAST_POLICY.md` ratios are measured against opaque `#0A0E16`; a translucent panel over a 3D room has no fixed backdrop. Concept 10 §1.5 gives the rule that transfers: body text on a ≥ 0.85-opacity panel. PR #164 moved glass fill to 0.48/0.58 and it is still under. Reading surfaces need an opaque plate behind the text region, with the "glass" only at the edges.
7. **Overlay guard.** OVERLAY-CRIT-001 (PROGRESS.md, 2026-07-21): no `filter`/`transform`/`backdrop-filter` on html/body/app-shell wrappers. `EscapeFlat` as `position:fixed` must sit outside any transformed forge wrapper.
8. **Hero.** Plan says the forge replaces the hero, so `ForgeHero` (F6, flag `FORGE_HERO`) is dropped and `HeroSection` becomes the forge. Say so; otherwise `/` has two canvases.

## 5. What holds up

- **Screen inventory is complete.** All 52 `page.tsx` routes under `src/app` are covered, with sensible FLAT defaults for parent, settings-security, legal, admin.
- **Phasing is right-sized.** Fixed camera, one scene, named morph states, flag-gated, Phase 1 spike is small.
- **No new dependencies for Phases 1–4.** R3F 9.5, drei 10.7, three 0.183, Phaser 4.2, Pixi 8.19, Rive 4.29, GSAP, motion are all installed.
- **PR #164 is a real seed.** 22 unit tests, a layouts registry, a portal state machine, a hotspot map, stubs for authMerged/avatar/game-bay. Its 2° yaw, 0.48/0.58 glass, and emitter-beam findings should be carried into the R3F spec rather than rediscovered.
- **`EscapeFlat` is the correct escape hatch** and matches Concept 10's own allowance for flat dense surfaces.

## 6. Decisions to close before Phase 1

1. **Direction.** Either (a) amend Concept 10 §0.1.2–0.1.3 and Rebuild IV.2 to permit an R3F shell for the kid hub on `tier ∈ {desktop, ultrawide}`, record it as a decision lock, and bump CLAUDE.md to v7 retiring the cockpit language; or (b) scope the forge to `/` and `/login` only, where canvas is already allowed. The plan cannot be both "site home + control surface" and compliant with the current invariants.
2. **PR #164.** Merge (rebased on the 8 newer commits) or close before Phase 1, so every path the plan references exists on the branch.
3. **One lock, one place.** Pick `public/forge-lab/world/` or `docs/forge-hub/` for plates; commit the LOCKED_HUB plate (a JPEG or PNG under 1 MB is fine as a reference asset); archive `docs/Phased-R3F-Hub-Plan.md` (root) under `_SUPERSEDED/` per CLAUDE.md §3.2; fix the `hub-concepts/` and `/workspace/` paths.
4. **One vocabulary.** Holo trio or Top/L/R, `welcome` everywhere, and reconcile `hubSplit` with the three-panel lock.
5. **Sparky.** `SparkyOverlay` wraps the existing Rive spec. Default anchor `nearSF`. Decide now, not Phase 5.
6. **Mobile.** `EscapeFlat` from Phase 3 for mobile/tablet via `useDeviceProfile`.
7. **Games.** All games EXIT the forge; `PlayStage` is not a game host.
8. **Renderer and flag.** WebGPU via `createRenderer` with poster fallback, or plain WebGL, stated in the Phased plan §7. Flag as `FORGE_LAB_R3F` in `src/config/feature-flags.ts` (matches the `FORGE_*` family) or `NEXT_PUBLIC_FF_FORGE_LAB_R3F`.

## 7. Answers to the plan's own open questions (R3F plan §7)

1. **Welcome layout:** start from the locked equal trio and morph to large-C on first intent. The plate is the lock; the large-C composition has not been drawn.
2. **Side panels:** shrink and yaw only. Leaving the frame breaks the fixed-camera composition and pushes `Html transform` math to the viewport edge where it is least stable.
3. **Sparky anchor:** `nearSF`.
4. **Phase 1 start:** not until decision 1 is closed. The spike is cheap, but whether it lands at `/` or under `/dev/` depends entirely on that call.
