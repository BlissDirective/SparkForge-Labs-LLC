# Forge Hub — Full Transition Action Plan (v2)

**Status:** Proposed — Phase 0 (governance) not yet started
**Date:** 2026-09-13 (v1 2026-09-12)
**Owner vision (2026-09-13):** one seamless, video-like UI. The hologram screens move, merge, and resize with the kid's interaction: all three merge into one large hologram that games play inside; on welcome the two side holograms shrink slightly and carry the key details from the current hero page while the center hologram shows the login under a "Welcome to SparkForge" headline. The new Sparky is a fully rigged character that moves freely on the desk the emitter sits on, interacts with the kid, wears holiday outfits, and reacts to whatever hologram activity is being played or selected.
**Inputs:** `PLAN_ASSESSMENT.md`, the six spec docs in this folder, PR #164, the code on `setup-sparkforge-dev` at `927560c`.
**This is a plan. No code ships from this document.**

**What changed from v1:** games play on the merged glass instead of exiting (§2.7, W5); Sparky is a rigged 3D desk character instead of a 2D overlay (§2.8, W3); welcome and login are one composition (§2.9); a choreography layer is added so every state change is a directed sequence (§2.6); timeline and team needs updated (§4, §9).

---

## 0. Decisions this plan assumes

| # | Decision | Answer | Weight |
|---|---|---|---|
| 1 | Direction | **Forge hub is the kid-facing shell on desktop and ultrawide.** Concept 10 §0.1 and Rebuild IV.2 are amended, not ignored. | Owner-made |
| 2 | Panel technology | **DOM panels projected from the 3D scene.** Glass meshes carry the motion; DOM content rides them and never stretches. See §2.2. | Shapes the plan |
| 3 | Where the canvas lives | **One canvas in the root layout**, mode driven by pathname; FLAT routes pause and hide it. See §2.1. | Shapes the plan |
| 4 | Mobile and tablet | **Today's HTML dashboard shell stays as the compact-tier shell**, restyled. No canvas below 1440 px. See §2.3. | Shapes the plan |
| 5 | Games | **Games play inside the merged hologram (`PlayStage`) by default**, with a per-game full-screen escape hatch. Owner vision. See §2.7. | Owner-made |
| 6 | Sparky | **Rigged 3D character living on the desk**, face driven by the existing expression system, outfit packs by calendar. 2D stills from the same model for in-game and compact tier. Owner vision. See §2.8. | Owner-made |
| 7 | Welcome composition | **`welcome` = shrunken side panels with hero key details + center login under the headline.** `/`, `/login`, `/signup` share the scene. Owner vision. See §2.9. | Owner-made |
| 8 | Choreography | **Every state change is a directed, interruptible sequence** (glass, beams, emitter, Sparky, audio) rather than independent tweens. GSAP timelines at runtime; Theatre.js for authored cinematic beats. See §2.6. | Shapes the plan |
| 9 | PR #164 | **Port, then close.** Layout math, portal reducer, catalog, tests, blend tokens, locked plate. Not the hotspot shell, route, or flag. | Detail |
| 10 | Renderer and flag | **`three/webgpu` via the existing `createRenderer` factory with TSL materials** (WebGPU first, automatic WebGL2 backend, poster below that). Flag family `FORGE_HUB*` in `src/config/feature-flags.ts`. | Detail |

Open questions for the owner (do not block Phase 0):

- **Marketing long-scroll.** Plan assumes the Features, How-It-Works, AI Tutor, and CTA sections are condensed into the two welcome side panels and a "Learn more" Focus panel, and the flat scroll below the stage is dropped. Pricing and legal stay flat routes.
- **Outfit calendar.** Plan assumes seven packs in year one (Halloween, winter holidays, Lunar New Year, spring, summer, back-to-school, child's birthday) plus lab-themed unlockable accessories, with a parent toggle. Confirm the list and whether any region-specific holidays are wanted.
- **Sparky's voice.** Plan assumes text speech bubbles and the existing tutor chat, no synthesized voice in v1.

---

## 1. Target end state

- **Desktop and ultrawide (≥ 1440 px):** every kid-facing route lives inside one persistent forge stage. The room, emitter, desk, and three glass slabs are a fixed-camera R3F scene that is never still: emitter pulse, dust, panel breathe, beam flicker, Sparky idling. Navigation is choreographed morphs, never a page flash. The three slabs are the only panel primitives; every layout is a placement of one to three of them, so merging into one large stage or splitting back is the same motion grammar everywhere. Parent, billing, security settings, legal, and admin routes drop to `EscapeFlat` with the stage paused behind them.
- **Games:** picking a game merges the slabs into one large glass; the game plays inside it while the room dims and Sparky reacts to combos, wins, and misses. Finishing reforms the lobby. A handful of games may opt out to full screen if they fail the glass performance budget.
- **Sparky:** a rigged character on the desk. Walks between named desk spots, looks at whichever panel is active or hovered, points, waves, cheers, leans in to whisper tips, sleeps late at night, wears the current holiday outfit, and answers a tap with a reaction and a tip. Never blocks the glass.
- **Welcome:** `/` logged out shows the side panels slightly shrunk with the hero's key details, the center panel with "Welcome to SparkForge" and the login form. After login the sides grow back to equal and the center becomes today's mission.
- **Tablet and mobile (< 1440 px):** the current HTML shell restyled to the forge-hub palette with a 2D Sparky rendered from the same 3D model. Same page content components.
- **No-GPU desktop or canvas crash:** a poster of the plate behind the same DOM panels, 2D Sparky. Nothing functional is lost.
- **Rollback:** `FORGE_HUB` off returns the HTML shell on every tier.

---

## 2. Architecture decisions

### 2.1 One stage in the root layout

The stage mounts once in `src/app/layout.tsx` behind the `FORGE_HUB` flag and a desktop-tier check, above all three route groups. A `ForgeRouteMode` provider maps the pathname to a mode (`welcome`, `hubSplit`, `labsBrowse`, `gameLobby`, `playStage`, `avatarStudio`, `settingsDock`, `cinematic`, Focus and Dual as sub-layouts) or to `FLAT`. Route groups keep their layouts for auth, banners, and providers, but own no chrome on desktop. `/` → `/login` → `/home` → `/arcade` → a game → back is one continuous scene with no renderer re-initialisation. The middleware auth gate is unchanged.

### 2.2 DOM panels projected from the scene

Each hologram is a glass mesh in the scene (edge glow, scanline, breathe, emissive cone from the core) plus an ordinary server-rendered React panel positioned over it by a per-frame projection hook. Yaw up to about 8° is applied as CSS perspective; any panel with a form, a game, or more than two lines of body text sits at yaw 0. Before hydration the panels sit at the static rects from the layout registry over a poster of the plate, so the LCP element on every route is HTML text and Concept 10 §0.1.3 stays true in spirit.

Merge rule: when slabs merge or split, the DOM content of the outgoing layout fades during the first fifth of the morph, the glass carries the motion, and the incoming content wipes in during the last fifth. Content is never stretched.

drei `Html` is used only for small in-world decorations: slot labels, Sparky's speech tail, toast chips.

### 2.3 Reading plate rule

Inside every glass panel the content region has an opaque backing (≥ 0.85 alpha, dark navy family) with the translucent cyan visible only in the edge zone and behind empty panels. Satisfies `docs/UX_CONTRAST_POLICY.md` and Concept 10 §1.5.

### 2.4 World built as plate plus parallax first

Phase 1 uses the locked plate as the projected backdrop with real meshes only for what must move or emit: emitter core and beam cone, desk surface (Sparky's floor, so it is a real plane with the plate's texture), three glass slabs, dust and ember particles. SSIM ≥ 0.96 against `LOCKED_HUB` is reachable this way in the first phase, and the GPU budget stays Chromebook-safe. A full mesh room is a later optional upgrade behind the same interfaces.

### 2.5 State in a repurposed store

`sceneStore` (retired cockpit) becomes `forgeStore`: `mode`, `previousMode`, `morphProgress`, `portalPhase`, `activePanel`, `hoveredPanel`, `sparky` (spot, behaviour, outfit), `flatOverlay`. No new store; respects `docs/STATE_ARCHITECTURE.md` R1/R2. `cockpitStore`, `cockpitAtoms`, and `cockpitBroadcastStore` retire with the cockpit code. `deviceStore` and `useDeviceProfile` stay.

### 2.6 Choreography layer (the "video-like" feel)

A small **Director** owns every state change. It builds one interruptible timeline per transition that sequences, in order: emitter charge, beams retarget, slabs move and merge or split, outgoing content fade, incoming content wipe, Sparky reaction, audio sting. Independent tweens are not allowed to drive these objects, so nothing ever animates out of step.

- **Runtime:** GSAP timelines (already a dependency, already used in four files) because they are deterministic, interruptible with overwrite, and scrub-able for tests.
- **Authored beats:** Theatre.js (already a dependency, already used for the hero v3 beats) for the cinematic moments a designer should tune by hand: first-visit ignition, game launch burst, level-up, holiday intro. Authored sequences are exported as JSON and played by the Director.
- **Timing rules:** interactive morphs ≤ 600 ms; cinematic beats ≤ 1.5 s and skippable by click, Enter, or Space; `prefers-reduced-motion` replaces everything with a 200 ms crossfade and skips beats.
- **Ambient loop:** emitter pulse, dust, panel breathe, beam flicker, Sparky idle and blink run continuously so the scene is never a still.
- **Camera:** fixed composition; micro-dolly of ± 2 percent and pointer parallax are allowed; cuts are not.

### 2.7 Games on the merged glass

`gameLobby` → pick → Director merges the three slabs into one `PlayStage` slab at yaw 0 (about 70 percent of viewport width, 75 percent of height, matching the stage aspect the shell already uses) → the existing `HtmlGameShell` renders inside that DOM region with a `stage` variant (its header strip becomes the glass header, its progress bar rides the glass top edge). Nothing inside `src/components/games/*` changes; none of the 48 game files assume a full-height viewport and the shell already constrains content to a bounded column.

While a game runs the forge enters **dim**: post-processing off, particles at the lowest tier, world render rate capped near 30 fps, Sparky fully animated because reacting to the game is the point. For the five Phaser and Pixi games, which bring their own WebGL canvas, the world drops to on-demand rendering (repaints only when Sparky or a beam changes) so two GPU contexts are never both hot on a Chromebook.

Game events already broadcast by `JuiceProvider` (combo tier, celebrate, encourage) drive Sparky and the emitter. `ForgeCompleteCeremony` and `CelebrationOverlay` are re-targeted to the whole stage: beam burst, Sparky cheer, confetti over the room. Finishing or quitting reverses the merge into `gameLobby`.

Escape hatch: a `stage: 'glass' | 'fullscreen'` field in the game registry, default `glass`. Any game that misses the glass performance budget on the reference Chromebook (§8) is set to `fullscreen`, where the stage pauses and the game takes the viewport as today.

### 2.8 Sparky as a rigged desk character

- **Master asset:** one rigged GLB. Body ≤ 25 k triangles, ≤ 60 bones, two 2048 texture sets compressed to KTX2 with the existing `optimize:3d` script (Draco plus KTX2 already wired in `compressedLoaders.ts`). Loaded with drei `useGLTF` and `useAnimations`.
- **Face:** Sparky's face is a screen. It is rendered as a dynamic texture from the existing nine-expression `SparkyCore` system, so expressions stay one source of truth across 3D, in-game 2D, and the compact shell, and cost no blendshapes. Eye look-at is procedural, aimed at the active panel, the hovered panel, or the pointer.
- **Clip library (v1):** idle A, idle B, breathe and blink (procedural), walk, turn, wave, point left, point right, cheer, whisper lean, sit, sleep, surprised, sad nod, look around. Holiday packs may add one or two clips each.
- **Behaviour system in code:** a small state machine, `idle → attend(panel) → react(event) → return`, fed by forge mode, active and hovered panel, `JuiceProvider` game events, tutor chat state, local time (sleepy after bedtime), and the outfit calendar. Movement is between named desk spots (`nearCore`, `leftLip`, `rightLip`, `frontCenter`, `behindCore`) using walk clips with root motion. No pathfinding.
- **Interaction:** tap or click Sparky → reaction plus a tip; hover → glance. No dragging (accidental drags from kids). Raycast hits Sparky's mesh only; the desk sits below the glass plane so Sparky can never occlude a panel hit target. Speech is a drei `Html` tail with lines from `forgeSparkVoice.ts`; the AI tutor chat becomes Whisper mode with Sparky leaning in at `frontCenter`.
- **Outfits:** attachment slots on named bones (head, back, left hand, right hand) plus material variant swaps. Each holiday pack is a small GLB of attachments and an optional clip, lazy-loaded by a calendar config (date ranges, region-neutral by default). Lab-themed accessories unlock through existing badges. Parents can disable seasonal outfits in settings. Kids never see a purchase surface for outfits.
- **2D counterparts:** the in-game 72 px mount and the compact shell use stills and sprite sheets rendered from the 3D master so the look is identical. The `SparkyMachine` Rive contract is kept for any game that already uses it; authoring a Rive v2 is optional and later.
- **Interim placeholder:** a procedural chrome orb body with the face screen (the `GuideAvatar3D` pattern) with bob and hop, so the behaviour system, spots, and reactions are built and tested before the rigged asset arrives.
- **Performance:** one skinned mesh with GPU skinning is roughly a millisecond a frame; well inside budget.

### 2.9 Welcome and login are one composition

`welcome` mode: HoloL and HoloR at about 85 percent scale carrying the hero's key details (what SparkForge is and the 11 labs and 42 games on the left; Sparky's introduction and the demo login on the right). HoloC at full size with "Welcome to SparkForge" above the login form. `/` and `/login` render this scene; `/signup`, `/forgot-password`, and `/reset-password` wipe different content into HoloC without a morph. On successful login the Director grows the sides to equal, wipes the mission into HoloC, and Sparky waves from `nearCore`. Marketing detail beyond the side panels opens a Focus panel from a "Learn more" control. The current flat marketing scroll, `ForgeHero`, `HeroSection`, and `LandingMicroGame` are retired at cutover.

### 2.10 Renderer

`three/webgpu` `WebGPURenderer` through `src/lib/3d/webgpuRenderer.ts`, TSL node materials only, bloom from `PostProcessingStackWebGPU.tsx`, D3D-5 Performance toggle honoured. Below WebGL2 or on a `Canvas3DErrorBoundary` catch, the stage unmounts and the poster fallback shows.

---

## 3. Workstreams

### W0 Governance and document reconciliation

1. Decision-lock entry `docs/01-decisions/2026-09-forge-hub.md` with the ten decisions above.
2. Amend `docs/concepts/10-digital-forge-build-plan.md` §0.1.2 and §0.1.3 ("The frame is DOM. The world is canvas. On desktop tier the world may be a persistent R3F stage behind DOM panels; the LCP element remains HTML.") and §1.2 palette ("warm rose-gold and cream world, cyan hologram primary for UI surfaces, molten amber reserved for progress fills and ceremonies").
3. Amend `Fable-5-SparkForge-Rebuild.md` Part IV to record the forge hub as its outcome with the LCP and mobile guardrails carried over.
4. CLAUDE.md v7: retire the Laboratory Control Station language, describe the forge hub, keep the Tech Quality Mandate and mobile policy, replace the cockpit checkpoint rows.
5. Vocabulary lock: `HoloL / HoloC / HoloR`, `welcome`, `hubSplit`; update `Phased-R3F-Hub-Plan.md` §3 to §5; archive the root `docs/Phased-R3F-Hub-Plan.md` under `_SUPERSEDED/`.
6. Commit lock assets under `public/forge-hub/world/` and `public/forge-hub/sparky/` with SHA manifests; reconcile the two plates.
7. Fix `hub-concepts/` and `/workspace/` paths in the spec docs. Open the PROGRESS.md "Forge Hub" section.
8. Close PR #164 with a comment pointing here once W2 has ported what it needs.
9. **Motion bible** (new): one page listing every transition, its timeline steps, duration, and reduced-motion substitute, kept in `docs/forge-hub/MOTION_BIBLE.md` and treated as the source the Director implements.

### W1 World and renderer

Fixed camera and slot constants in one config; plate-plus-parallax scene with a real desk plane; TSL emitter core with beam cone; portal reducer `idle → charge → emit → docked` ported from PR #164; three glass slabs with edge glow, scanline, breathe; bloom only; frame loop `always` on stage routes, `demand` under reduced motion and during Phaser and Pixi play, `never` on FLAT routes; quality tiers through the existing `autoQuality` path. Exit gate: SSIM ≥ 0.96 against `LOCKED_HUB`; 60 fps on the reference laptop; poster fallback verified on WebKit.

### W2 Screen kit, Director, escape

Layout registry in world units for every mode including `playStage` as the merged slab; projection hook; `HoloPanel` DOM component with the reading plate; the Director with GSAP timelines and the Theatre.js beat player; the motion tokens from `R3F_VARIATION_PLAN.md` §4 implemented as named timeline fragments; `EscapeFlat` outside any transformed wrapper (OVERLAY-CRIT-001); `ToastRail` absorbing the offline, demo, verify, and toast banners; `ForgeRouteMode` provider; `forgeStore`; `/dev/forge-hub` with a mode switcher, `?calibrate=1`, a transition scrubber, and a Sparky behaviour panel. Exit gate: the login form live on HoloC through `welcome → hubSplit → playStage → gameLobby → welcome` with content never stretching; axe clean; keyboard-only pass; ported PR #164 tests plus projection, route table, and Director timeline tests green.

### W3 Sparky character

1. Commit `LOCKED_SPARKY.png`; write `docs/SPARKY-CHARACTER-SPEC.md` (replaces the Rive spec as the master): geometry and material notes from the concept, rig and bone naming, clip list with durations, attachment slots, texture budgets, face-screen contract, behaviour inputs, outfit pack format, calendar config format. Keep `SPARKY-RIVE-SPEC.md` as the 2D in-game contract.
2. Build the behaviour system and desk spots against the procedural placeholder.
3. Face-screen texture from `SparkyCore` expressions; eye look-at.
4. External art: model, rig, clip library, GLB export through `optimize:3d`. Base character roughly four to six weeks of artist and animator time; one week per outfit pack.
5. Swap the placeholder for the rigged asset; tune reactions in `/dev/forge-hub`.
6. Outfit system and calendar config; first three packs; parent toggle in settings.
7. Absorb the AI tutor into Whisper mode; remove the deprecated `AITutorAvatar`.
8. Render 2D stills and sprite sheets from the master for the in-game mount and compact shell; update `SparkyCore` fallback colours to the concept.
9. Exit gate: every clip and reaction verified on `/dev/forge-hub`; hit-test e2e proves Sparky never occludes a focusable target; in-game mount unchanged in the game-migration smoke; outfit swap under 100 ms with no frame hitch.

### W4 Screen migration (all routes)

Waves as in v1, with the welcome and login wave merged:

- **Wave 1 — Welcome, auth, home:** `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/home`, `/onboarding`; `/mfa-challenge` FLAT.
- **Wave 2 — Labs and content:** `/labs`, `/labs/[labId]`, `/content/[slug]`, `/story`.
- **Wave 3 — Arcade and games on glass:** `/arcade`, `/arcade/[gameSlug]`, `/create`.
- **Wave 4 — Progress family:** `/progress`, `/achievements`, `/mastery`, `/seasons`, `/buddies`.
- **Wave 5 — Profile, settings, marketing fold:** `/profile` (`avatarStudio` shows Sparky's outfits and the child's avatar side by side), `/settings` kid prefs on glass, `/competencies` as Focus.
- **FLAT from day one:** `/parent/*`, `/admin/*`, `/settings/{mfa,sessions,linked-accounts,legal}`, `/onboarding/consent`, legal pages, `/pricing`, `/offline`.

Sub-flags `FORGE_HUB_WELCOME`, `FORGE_HUB_LABS`, `FORGE_HUB_ARCADE`, `FORGE_HUB_PROGRESS`, `FORGE_HUB_PROFILE`, all AND-ed with `FORGE_HUB`. Each wave reuses the page's existing content components inside slots; the full route table is in §5.

### W5 Games on glass

`HtmlGameShell` `stage` variant; `PlayStage` region sizing and yaw-0 rule; dim mode and the Phaser and Pixi on-demand rule; `JuiceProvider` events wired to the Director and Sparky; ceremonies re-targeted to the stage; registry `stage` field with default `glass`; performance sweep of all 42 games on the reference Chromebook with any failures set to `fullscreen`. Exit gate: `game-migration-smoke` green with the flag on; launch morph to first input under 1.2 s; no renderer re-initialisation; frame time inside budget for every `glass` game.

### W6 Compact-tier shell and fallbacks

Current `(dashboard)/layout.tsx` shell kept and gated to compact tiers or "stage unavailable"; restyled with the forge-hub tokens; 2D Sparky from the master renders; poster fallback reuses the same DOM panels over the plate image with a slow breathe. Exit gate: iPhone and iPad WebKit visual runs; Lighthouse mobile preset within budget.

### W7 Theme and tokens

`data-theme="forge-hub"` in `src/styles/forge-hub-theme.css` overriding `--sf-*` like `forge-theme.css` does; `HOLO_BLEND` as variables with the reading-plate fill; high-contrast variant; guard scripts run against the new theme; root layout selects `forge-hub` when `FORGE_HUB` is on.

### W8 Quality gates, tests, CI

Unit: layout registry, projection math, route table, portal reducer, `forgeStore`, Director timelines (scrubbed to fixed times and asserted), Sparky behaviour transitions, outfit calendar. E2E: `a11y-forge-nav` desktop variant of the sidebar spec; `core-flow-smoke` with the flag on and off; visual captures for welcome, hub, labs, play stage on Chromium with WebGPU and on WebKit for the poster path; SSIM check against `LOCKED_HUB` in the visual job; Sparky hit-test spec. Lighthouse: `|| true` on `lhci autorun` becomes a real failure for accessibility and CLS once Wave 1 lands. Bundle-size job gets separate lines for the stage chunk and the Sparky asset. Owner visual checkpoint at each phase gate.

### W9 Retired cockpit disposition

As v1: salvage the renderer factory, WebGPU detection, post-processing stack, error boundary, cinematic camera, offscreen gate, auto-quality, `sceneStore` (renamed), `deviceStore`, branding folder, and all game 3D scenes and templates; archive the cockpit shell, panels, floor, HUD, station frame, side panels, iris, batched chrome, scene router, NPCs, hero animation, crystal hero, cockpit stores and hooks, and the architecture JSON. One PR after W2 proves the import set.

### W10 Rollout and cutover

`/dev/forge-hub` always on; `FORGE_HUB` on in previews; production staff → demo → 10 percent → 100 percent of desktop sessions; Sentry `forge_hub` tag; watch error rate, LCP, INP, game launch success, session length, demo conversion; kill switch is the flag; after two clean weeks, the W9 archive PR, retirement of the hero-only landing pieces, and tag `v1.0.0-forge-hub`.

---

## 4. Phases and gates

| Phase | Weeks | Workstreams | Exit gate (owner visual checkpoint at each) |
|---|---|---|---|
| **P0 Governance and briefs** | 1 | W0, W3 step 1 | Decision lock, amendments, CLAUDE.md v7, lock assets, motion bible v1, character spec, artist briefed. |
| **P1 Room shell and placeholder Sparky** | 2 | W1, W3 steps 2–3 | `/dev/forge-hub` at SSIM ≥ 0.96; ignition plays; poster on WebKit; placeholder Sparky walks the desk spots and reacts to mode changes. |
| **P2 Screen kit and Director** | 2–3 | W2, W7 | Login form through a full morph cycle including merge to `playStage`; Director timelines tested; theme applied; PR #164 ported and closed. |
| **P3 Welcome, auth, home** | 2 | W4 wave 1, W6 | `/`, `/login`, `/signup`, `/home`, `/onboarding` on the stage; compact tier verified; Lighthouse gates real. |
| **P4 Labs, content, games on glass** | 3 | W4 waves 2–3, W5 | Lab browse to lesson to game on glass and back with no re-init; all 42 games swept, `fullscreen` list agreed. |
| **P5 Rigged Sparky, progress, profile** | 3 | W3 steps 5–8, W4 waves 4–5 | Rigged asset live with the full clip set; first three outfit packs; Whisper mode replaces the floating tutor; every kid route migrated or FLAT. |
| **P6 Polish and hardening** | 2 | W8, W7 guards | All jobs green flag-on and flag-off; SSIM in CI; bundle lines; reduced-motion pass; COPPA review of Sparky interaction and outfits. |
| **P7 Cutover** | 1–2 plus 2 weeks soak | W10, W9 | Staged rollout complete; archive PR merged; tag cut. |

Roughly 18 to 22 weeks on one engineering stream with character art running in parallel from P0. The rigged Sparky is the long pole for P5, so the artist brief is a P0 deliverable and the placeholder keeps engineering unblocked. Per the Tech Quality Mandate these figures are informational.

---

## 5. Route-by-route migration table

| Route | Wave | Mode | HoloL | HoloC | HoloR | Sparky | Notes |
|---|---|---|---|---|---|---|---|
| `/` (logged out), `/login` | 1 | `welcome` | Hero key details: what SparkForge is, 11 labs, 42 games (85 %) | "Welcome to SparkForge" + login form | Sparky intro, demo login (85 %) | `nearCore`, wave; glances at the form on focus | Marketing scroll retired; "Learn more" opens Focus. |
| `/signup`, `/forgot-password`, `/reset-password` | 1 | `welcome` | same | form wipes in | same | tip at `frontCenter` | No morph between auth screens. |
| `/mfa-challenge` | FLAT | — | — | — | — | none | |
| `/home` | 1 | `hubSplit` | `QuickStatsBar`, streak, `PetWidget` | `DailyMissionCard`, continue, `QuestPanel` | `ActivityFeed`, `LeaderboardPanel` | `nearCore`; points at the mission on first visit of the day | Sides grow from 85 % to equal on login. `DashboardTour` retargeted. |
| `/onboarding` | 1 | `welcome` wizard | steps | wizard step | tips | `panelLip`, point | `OnboardingCrystal` retired. |
| `/onboarding/consent` | FLAT | — | — | — | — | none | |
| `/labs` | 2 | `labsBrowse` | lab list | selected lab hero | detail + progress | walks to the hovered side, points | `ForgeRing` becomes the list or retires; owner call at P4. |
| `/labs/[labId]` | 2 | Focus | tools | lesson and game list | `TierUpsell`, progress | looks at C | |
| `/content/[slug]` | 2 | `playStage` | — | `LessonViewer`, `QuizEngine`, `SparkFactViewer` on the merged slab | — | sits at `leftLip`, reacts to quiz answers | |
| `/story` | 2 | `playStage` / `cinematic` | — | story on the merged slab | — | narrator at `frontCenter` | |
| `/arcade` | 3 | `gameLobby` | game list by lab | launch stage with preview art | preview, tier badge | cheers at `rightLip` | |
| `/arcade/[gameSlug]` | 3 | `playStage` (or `fullscreen` per registry) | — | game inside `HtmlGameShell` stage variant | — | reacts to combo, celebrate, encourage | Zero edits inside games. Room dims. |
| `/create` | 3 | Lab bench | tools | make surface | preview | helps at `leftLip` | |
| `/progress` | 4 | Dual | stats | chart | detail | idle | |
| `/achievements` | 4 | `hubSplit` | filters | badge grid | badge detail | cheers on unlock | |
| `/mastery` | 4 | Focus | — | path | claim | point | |
| `/seasons` | 4 | `hubSplit` | — | season | rewards | wears the season outfit | |
| `/buddies` | 4 | Dual | friends | — | invite | idle | COPPA copy reviewed. |
| `/profile` | 5 | `avatarStudio` | stats | child avatar | Sparky outfit rack | tries on outfits live | `AvatarPreview3D` salvage candidate. |
| `/settings` | 5 | `settingsDock` | nav | kid prefs | — | idle | Security links out to FLAT. |
| `/settings/{mfa,sessions,linked-accounts,legal}` | FLAT | — | — | — | — | none | |
| `/parent/*`, `/admin/*`, `/pricing`, legal (16 routes) | FLAT | — | — | — | — | none | Palette only. |
| `/competencies` | 5 | Focus | list | story | — | idle | Re-audited on the reading plate. |
| `/offline` | plain | — | — | — | — | none | |
| `/dev/*` | BRIDGE | — | — | — | — | — | `/dev/forge-hub` new; `/dev/hero-v3` retired; `/dev/forge` and `/dev/sparky` kept. |

All 52 `page.tsx` routes on the branch are accounted for.

---

## 6. Sparky pipeline

| Step | Artifact | Owner | Phase |
|---|---|---|---|
| Concept in repo | `public/forge-hub/sparky/LOCKED_SPARKY.png` + SHA manifest | Owner | P0 |
| Character spec | `docs/SPARKY-CHARACTER-SPEC.md`: rig, bones, clips, slots, budgets, face contract, behaviour inputs, outfit format, calendar format | Engineering | P0 |
| Artist brief | Spec plus concept plus the plate for scale and lighting | Owner + Engineering | P0 |
| Placeholder | Procedural orb with face screen, spots, behaviour system | Engineering | P1 |
| Model, rig, clips | Blender source in a separate assets repo or LFS; GLB through `optimize:3d` | Artist and animator | P1 to P5 |
| Face screen | Dynamic texture from `SparkyCore` expressions; procedural look-at | Engineering | P1 |
| Integration | drei `useGLTF` and `useAnimations`; clip blending; root motion between spots | Engineering | P5 |
| Outfit packs | Attachments GLB + optional clip per pack; calendar config; parent toggle | Artist and Engineering | P5 onward, one week per pack |
| Whisper mode | Tutor chat on HoloC with Sparky at `frontCenter` | Engineering | P5 |
| 2D stills | Sprite sheets rendered from the master for in-game and compact | Engineering | P5 |
| Verification | Clip and reaction pass, hit-test e2e, outfit swap timing, in-game smoke | Engineering | P5 to P6 |

The in-game `SparkyMachine` contract and the `JuiceProvider` events do not change, so the 42 games never wait on the character.

---

## 7. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Character art slips | High | Placeholder from P1; behaviour system built against it; games and compact tier never depend on the rigged asset. |
| Games on glass stack GPU load on Chromebooks | Medium | Dim mode; on-demand world rendering during Phaser and Pixi play; per-game `fullscreen` escape hatch decided by measurement, not opinion. |
| "Video-like" motion slows kids down | Medium | 600 ms cap on interactive morphs; beats skippable; reduced-motion crossfade; the Director makes every transition interruptible. |
| Stage hurts LCP or INP | Medium | SSR'd DOM panels are the LCP; stage and Sparky chunks load post-LCP; Lighthouse gates made real in P3. |
| Cyan glass fails contrast on real content | High if ignored | Reading plate rule from P2; guards run against the new theme. |
| Sparky blocks or distracts | Medium | Desk below glass plane; raycast on Sparky only; idle loops subtle during play; a settings toggle to calm Sparky. |
| Holiday outfits cause cultural or regional complaints | Low | Region-neutral default packs; parent toggle; content review in the COPPA pass. |
| Two locked plates diverge | Low | Reconciled in P0 with SHA manifests; agents never regenerate world art. |
| Retired cockpit code confuses agents and bloats builds | High today | CLAUDE.md v7 in P0; W9 archive PR in P7. |
| Rollback is theoretical | Low | The compact shell is the rollback and is exercised daily by phone users. |

---

## 8. Budgets and reference hardware

- **Reference laptop:** an Intel Iris Xe class Chromebook or Windows laptop at 1536×1024, Chrome stable with WebGPU. Every gate that says "on the reference laptop" means this.
- **World:** ≤ 1.5 M triangles in P1 (plate plus parallax), ≤ 6 material families, bloom only.
- **Sparky:** ≤ 25 k triangles, ≤ 60 bones, two 2048 KTX2 texture sets, ≤ 1.5 ms skinning and animation per frame.
- **Frame time:** ≤ 16 ms hub idle; ≤ 8 ms world share while a DOM game runs; on-demand only while a Phaser or Pixi game runs.
- **Load:** stage chunk and Sparky asset deferred until after LCP; Sparky base GLB ≤ 3 MB compressed; each outfit pack ≤ 500 KB.
- **Lighthouse:** existing `.lighthouserc.json` budgets on `/`, `/login`, `/pricing`, with accessibility and CLS made blocking.

---

## 9. Team and tooling needs

- **3D character artist and animator** (external is fine): base character, rig, clip library, outfit packs. This is the one skill the repo does not have today; nothing in `src/` loads a rigged model yet.
- **Motion design pass** on the motion bible and the Theatre.js beats: can be the owner with engineering support, as the hero v3 beats were done.
- **Engineering:** one stream is enough; two shortens P4 and P5 by running games-on-glass and Sparky integration in parallel.
- **Tooling already present:** R3F, drei, three r183 WebGPU, GSAP, Theatre.js, Draco and KTX2 pipeline, Playwright with WebGPU and WebKit, Lighthouse CI, bundle-size job.

---

## 10. Immediate next actions (first two weeks)

1. Owner confirms decisions 2 to 10 and answers the three open questions in §0.
2. Commit `LOCKED_HUB`, `LOCKED_SPARKY`, and the PR #164 plate with SHA manifests.
3. Write the decision lock and the Concept 10, Rebuild IV, and CLAUDE.md v7 amendments in one PR.
4. Write `docs/SPARKY-CHARACTER-SPEC.md` and the artist brief; engage the artist.
5. Write `docs/forge-hub/MOTION_BIBLE.md` v1: welcome, login success, hub to labs, lobby to play stage merge, play stage to lobby split, Whisper, Emit burst, first-visit ignition.
6. Archive the root `Phased-R3F-Hub-Plan.md`; fix paths and vocabulary in the spec docs; open the PROGRESS.md section.
7. Start P1: `/dev/forge-hub` room shell, portal reducer ported, SSIM harness, procedural placeholder Sparky with desk spots.
8. Port PR #164's layout math, catalog, reducer, tests, and blend tokens; close the PR with a link here.
9. Schedule the P1 owner visual checkpoint.
