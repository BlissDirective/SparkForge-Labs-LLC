# Forge Hub — Full Transition Action Plan (v2.2)

**Status:** APPROVED direction — locks committed 2026-09-14; Phase 0 dispatchable
**Date:** 2026-09-14 (v2.1 same day, v2 2026-09-13, v1 2026-09-12)
**v2.2 (2026-09-14):** locks committed (`public/forge-hub/`, `docs/forge-hub/LOCKED_SPARKY.md`, `docs/sparky/SPARKY-CHARACTER-SPEC.md`); old avatar designs archived; decisions 2 to 10 confirmed by the owner ("lock both, proceed"); §11 added: the Grok Bot Team operating model, accounts, keys, software, decision authority, dispatch order, and approval flow, with the copy-paste agent prompts in `GROK_TEAM_PROMPTS.md`.
**v2.1 (2026-09-14):** owner closed the three open questions. The flat marketing scroll is dropped and the welcome scene inside the forge is the marketing hero. A year-one outfit catalog is added (§6b). Sparky's head-top hologram module is the emitter for a small chat hologram that floats above every other screen and is the chat box for all Sparky conversation (§2.8b). The Sparky concept art was supplied and its observations feed the character spec (§2.8a).
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

Decisions 2 to 10 were confirmed by the owner on 2026-09-14 ("lock both, proceed"). Any of them can still be reopened by the owner; agents may not reopen them (§11.4).

Owner answers recorded 2026-09-14:

| # | Question | Answer |
|---|---|---|
| 11 | Marketing long-scroll | **Dropped.** The welcome scene inside the forge is the marketing hero. Features, How-It-Works, and the AI tutor showcase condense into the two side panels and a "Learn more" Focus panel. Pricing and legal remain flat routes. |
| 12 | Outfit calendar | **Year-one catalog in §6b**: five Halloween variants, Christmas, winter, spring, summer, fall, Fourth of July, a suit for special occasions, plus occasion and unlockable packs. Parent toggle stays. |
| 13 | Sparky conversation | **Head-emitter chat hologram.** The translucent module on top of Sparky's head is an emitter. It projects a small hologram screen that renders above every other screen and is the chat box for all Sparky conversation (tips, reactions, the tutor chat). See §2.8b. Text only in v1; synthesized voice is a later option. |
| 14 | Site footer (owner, 2026-09-15) | **The footer lives inside a side hologram.** Copyright, cookie preferences, the COPPA and no-tracking badges, and the legal and pricing links render as a footer strip inside `HoloR` in `welcome` and `HoloL` in `hubSplit`, not on the `ToastRail` and not on a page below the stage. There is no marketing or hero page outside the Hologram-Forge Hub. The current `MarketingFooter` survives only in the compact-tier HTML shell. |

**Measured-gate rule (owner, 2026-09-15):** P1 and every later visual gate require a number produced by `scripts/ssim-forge-hub.mjs` from a live canvas (`.forge-hub-ssim/report.json`), at or above 0.96 against `public/forge-hub/world/LOCKED_HUB.jpg`. A stub exit, a skipped run, or a capture of the poster layer is not a number. CI runs the WebGL2 baseline on every forge-hub change (`.github/workflows/forge-hub-visual.yml`); the WebGPU number comes from the reference laptop (`REFERENCE_HARDWARE.md`).

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

drei `Html` is used only for small in-world decorations: slot labels, the HoloBubble `ping` glyph, toast chips.

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
- **Interaction:** tap or click Sparky → reaction plus a tip in the HoloBubble; hover → glance. No dragging (accidental drags from kids). Raycast hits Sparky's mesh only; the desk sits below the glass plane so Sparky can never occlude a panel hit target. All speech and the tutor chat live in the HoloBubble (§2.8b); Whisper mode is the bubble expanding while the main panels dim and Sparky leans in at `frontCenter`.
- **Outfits:** attachment slots on named bones (head, back, left hand, right hand) plus material variant swaps. Each holiday pack is a small GLB of attachments and an optional clip, lazy-loaded by a calendar config (date ranges, region-neutral by default). Lab-themed accessories unlock through existing badges. Parents can disable seasonal outfits in settings. Kids never see a purchase surface for outfits.
- **2D counterparts:** the in-game 72 px mount and the compact shell use stills and sprite sheets rendered from the 3D master so the look is identical. The `SparkyMachine` Rive contract is kept for any game that already uses it; authoring a Rive v2 is optional and later.
- **Interim placeholder:** a procedural coral capsule body with the face screen and head dome (the `GuideAvatar3D` pattern) with bob and hop, so the behaviour system, spots, reactions, and chat hologram are built and tested before the rigged asset arrives.
- **Performance:** one skinned mesh with GPU skinning is roughly a millisecond a frame; well inside budget.

### 2.8a What the concept art fixes for the spec

Observations from the supplied Sparky concept, written into `docs/sparky/SPARKY-CHARACTER-SPEC.md` and the artist brief:

- **Silhouette:** chibi humanoid robot, head about a third of total height, rounded coral shell parts over black ball joints. Five-fingered hands. Rounded boots with cyan sole lights. This replaces the "chrome orb" description in the current Rive spec entirely.
- **Palette:** coral body (warm, sits naturally in the rose-gold and cream room), black joints and inner mechanics, cyan for everything that emits (face, chest badge, head dome, ear discs, boot lights), yellow lightning-bolt decals on shoulders, forearms, hips, and boots.
- **Face:** a black rounded screen with dot-matrix cyan eyes and smile. This confirms the dynamic face-screen texture approach; the nine expressions are redrawn in LED-dot style so 3D, in-game 2D, and compact tier share one face.
- **Chest badge:** cyan "S" on a rounded plate. It is an emissive material zone, useful as a reaction light (pulses on cheer, dims when sleepy) and as an outfit swap zone.
- **Head dome:** translucent cyan module with sparkle inside, on the crown. It is the chat emitter (§2.8b). It needs its own bone and socket, an emissive material that pulses while the chat hologram is open, and the outfit rule below.
- **Ear discs:** cyan-ringed side modules, a natural attachment point for earmuffs and headphones in outfit packs.
- **Rig guidance:** humanoid rig, about 45 to 60 bones including simplified fingers (two bones per finger) so pointing and waving read clearly; a `holoEmitter` bone at the dome; attachment sockets at crown (around the dome, never over it), face rim, ears, neck, chest plate, back, each hand, each boot.
- **Decal zones as material slots:** bolts and the "S" plate are the cheap places for outfits to re-theme (bats at Halloween, snowflakes in winter, stars for the Fourth of July) without new geometry.
- **Outfit rule:** nothing may cover the head dome. Hats and hoods are designed with a cutout or sit as a ring around it.

### 2.8b The chat hologram ("HoloBubble")

Sparky's head dome projects a fourth, small glass: the **HoloBubble**. It is the single place all Sparky conversation happens.

- **What it is:** a small slab primitive (about 320 × 200 CSS pixels at rest) anchored to the `holoEmitter` bone and projected each frame like the three main panels, with a thin cyan beam from the dome to its lower edge. It is a DOM panel with the reading plate, so the chat is real text, scrollable, and screen-reader friendly. It always renders above the three main panels and above the play stage.
- **States:** `hidden`; `ping` (a small glyph over the dome when Sparky has something to say); `tip` (one or two lines, auto-dismiss after a few seconds, no input); `chat` (expanded to about 420 × 320, message list plus input, the existing `AITutorContext` engine behind it); `whisper` (the three main panels dim and the bubble grows toward center stage for a coaching moment). Whisper mode is therefore the bubble expanding, not the chat moving onto HoloC.
- **Follows Sparky:** when he walks to another desk spot the bubble trails him on a short spring and settles above his head. It clamps inside the viewport and flips to the other side of the dome if it would cover the focused control or the active panel's header. It never covers the play stage's input area during a game; during play it is limited to `ping` and `tip` and only speaks on the game's own events.
- **Opening it:** tap or click Sparky or the bubble, the keyboard shortcut used by the current tutor, or the Director opening it for onboarding and first-visit moments. Escape closes it and returns focus to where it was.
- **Voice:** text only in v1, with the existing `forgeSparkVoice.ts` lines and the tutor engine. Optional synthesized voice later would play from the dome.
- **Compact tier and fallback:** the bubble becomes the existing floating chat panel with the 2D Sparky, same engine and messages.
- **Replaces:** the drei `Html` speech tail from v2 and the floating `AITutor` chat on desktop.

### 2.9 Welcome and login are one composition, and the welcome is the marketing hero

`welcome` mode: HoloL and HoloR at about 85 percent scale carrying the hero's key details (what SparkForge is and the 11 labs and 42 games on the left; Sparky's introduction and the demo login on the right). HoloC at full size with "Welcome to SparkForge" above the login form. `/` and `/login` render this scene; `/signup`, `/forgot-password`, and `/reset-password` wipe different content into HoloC without a morph. On successful login the Director grows the sides to equal, wipes the mission into HoloC, and Sparky waves from `nearCore` with a HoloBubble greeting.

There is no marketing page below or beside the forge. The welcome scene is the marketing hero: the side panels carry the pitch, a "Learn more" control opens a Focus panel with the longer Features and How-It-Works copy, and Sparky's HoloBubble offers the demo. All of this is server-rendered DOM so search engines index it. `ForgeHero`, `HeroSection`, `LandingMicroGame`, `NetworkMicroDemo`, `LandingFeatures`, `LandingHowItWorks`, `LandingAITutor`, `LandingCTA`, and `MoltenThread` are retired at cutover; their copy is the source for the side and Focus panels. `/pricing` and the legal pages remain flat routes, reached from the footer strip inside a side hologram (`HoloR` in `welcome`, `HoloL` in `hubSplit`; decision 14). The footer is not a `ToastRail` chip and there is no strip below the stage.

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
7. Reconcile spec paths to in-repo `docs/forge-hub/` and `public/forge-hub/` (W0-06). Open the PROGRESS.md FORGE HUB section.
8. Close PR #164 with a comment pointing here once W2 has ported what it needs.
9. **Motion bible** (new): one page listing every transition, its timeline steps, duration, and reduced-motion substitute, kept in `docs/forge-hub/MOTION_BIBLE.md` and treated as the source the Director implements.

### W1 World and renderer

Fixed camera and slot constants in one config; plate-plus-parallax scene with a real desk plane; TSL emitter core with beam cone; portal reducer `idle → charge → emit → docked` ported from PR #164; three glass slabs with edge glow, scanline, breathe; bloom only; frame loop `always` on stage routes, `demand` under reduced motion and during Phaser and Pixi play, `never` on FLAT routes; quality tiers through the existing `autoQuality` path. Exit gate: SSIM ≥ 0.96 against `LOCKED_HUB`; 60 fps on the reference laptop; poster fallback verified on WebKit.

### W2 Screen kit, Director, escape

Layout registry in world units for every mode including `playStage` as the merged slab; projection hook; `HoloPanel` DOM component with the reading plate; the Director with GSAP timelines and the Theatre.js beat player; the motion tokens from `R3F_VARIATION_PLAN.md` §4 implemented as named timeline fragments; `EscapeFlat` outside any transformed wrapper (OVERLAY-CRIT-001); `ToastRail` absorbing the offline, demo, verify, and toast banners; `ForgeRouteMode` provider; `forgeStore`; `/dev/forge-hub` with a mode switcher, `?calibrate=1`, a transition scrubber, and a Sparky behaviour panel. Exit gate: the login form live on HoloC through `welcome → hubSplit → playStage → gameLobby → welcome` with content never stretching; axe clean; keyboard-only pass; ported PR #164 tests plus projection, route table, and Director timeline tests green.

### W3 Sparky character

1. Commit `public/forge-hub/sparky/LOCKED_SPARKY.png`; write `docs/sparky/SPARKY-CHARACTER-SPEC.md` (replaces the Rive spec as the master): geometry and material notes from the concept, rig and bone naming, clip list with durations, attachment slots, texture budgets, face-screen contract, behaviour inputs, outfit pack format, calendar config format. Keep `docs/sparky/_SUPERSEDED/SPARKY-RIVE-SPEC.md` as the 2D in-game contract.
2. Build the behaviour system and desk spots against the procedural placeholder.
3. Face-screen texture from `SparkyCore` expressions; eye look-at.
4. External art: model, rig, clip library, GLB export through `optimize:3d`. Base character roughly four to six weeks of artist and animator time; one week per outfit pack.
5. Swap the placeholder for the rigged asset; tune reactions in `/dev/forge-hub`.
6. Outfit system and calendar config; first packs per the §6b production order; parent toggle in settings.
7. HoloBubble: the fourth slab, dome anchor and beam, states, follow spring, avoidance rules, keyboard access; the tutor engine moves behind it; remove the deprecated `AITutorAvatar` and the floating desktop chat.
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
| **P1 Room shell and placeholder Sparky** | 2 | W1, W3 steps 2–3 | `/dev/forge-hub` at a **measured** SSIM ≥ 0.96 vs `LOCKED_HUB.jpg` from `scripts/ssim-forge-hub.mjs` on a live canvas (WebGL2 in CI, WebGPU on the reference laptop; stub or poster captures do not count); ignition plays; poster on WebKit; placeholder Sparky walks the desk spots and reacts to mode changes. |
| **P2 Screen kit and Director** | 2–3 | W2, W7 | Login form through a full morph cycle including merge to `playStage`; Director timelines tested; theme applied; PR #164 ported and closed. |
| **P3 Welcome, auth, home** | 2 | W4 wave 1, W6 | `/`, `/login`, `/signup`, `/home`, `/onboarding` on the stage; compact tier verified; Lighthouse gates real. |
| **P4 Labs, content, games on glass** | 3 | W4 waves 2–3, W5 | Lab browse to lesson to game on glass and back with no re-init; all 42 games swept, `fullscreen` list agreed. |
| **P5 Rigged Sparky, progress, profile** | 3 | W3 steps 5–8, W4 waves 4–5 | Rigged asset live with the full clip set; First Day, Sharp Suit, and the nearest seasonal pack shipped; HoloBubble replaces the floating tutor; every kid route migrated or FLAT. |
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
| Character spec | `docs/sparky/SPARKY-CHARACTER-SPEC.md`: rig, bones, clips, slots, budgets, face contract, behaviour inputs, outfit format, calendar format | Engineering | P0 |
| Artist brief | Spec plus concept plus the plate for scale and lighting | Owner + Engineering | P0 |
| Placeholder | Procedural orb with face screen, spots, behaviour system | Engineering | P1 |
| Model, rig, clips | Blender source in a separate assets repo or LFS; GLB through `optimize:3d` | Artist and animator | P1 to P5 |
| Face screen | Dynamic texture from `SparkyCore` expressions; procedural look-at | Engineering | P1 |
| Integration | drei `useGLTF` and `useAnimations`; clip blending; root motion between spots | Engineering | P5 |
| Outfit packs | Attachments GLB + optional clip per pack; calendar config; parent toggle | Artist and Engineering | P5 onward, one week per pack |
| HoloBubble | Fourth slab on the dome bone; ping, tip, chat, whisper states; follow spring; avoidance; tutor engine behind it | Engineering | P2 (placeholder) to P5 |
| 2D stills | Sprite sheets rendered from the master for in-game and compact | Engineering | P5 |
| Verification | Clip and reaction pass, hit-test e2e, outfit swap timing, in-game smoke | Engineering | P5 to P6 |

The in-game `SparkyMachine` contract and the `JuiceProvider` events do not change, so the 42 games never wait on the character.

## 6b. Year-one outfit catalog

Every pack is a small GLB of attachments on the named sockets plus material swaps on the decal zones, optionally one short clip, at most 500 KB compressed. Nothing covers the head dome. Kids never see a purchase surface; seasonal packs switch by calendar, occasion packs by event, unlockables by existing badges. Parents can turn seasonal outfits off in settings. Dates are inclusive and stored in a config file so they can be tuned without a deploy.

**Seasonal (calendar-driven)**

| Pack | Window | Attachments and swaps | Clip |
|---|---|---|---|
| Spring Bloom | Mar 20 – May 31 | Flower crown ring around the dome, small watering can in hand, yellow rain boots; bolts → petals | Sniff a flower |
| Summer Splash | Jun 1 – Aug 31 | Sunglasses on the face rim, floppy sun hat ring, inflatable ring at the waist, flip-flop boot covers; bolts → suns | Fan self, "phew" |
| Back to Forge | Aug 15 – Sep 15 (overlaps summer, wins) | Mini backpack, pencil behind the ear disc, name-tag sticker on the chest plate | Adjust backpack straps |
| Fall Harvest | Sep 16 – Oct 24 | Knit beanie ring, cozy scarf, tiny leaf stuck on the dome edge, mug of cocoa in hand; bolts → maple leaves | Sip cocoa |
| Winter Frost | Dec 27 – Feb 28 | Earmuffs on the ear discs, striped scarf, mittens, snow boots; bolts → snowflakes, chest badge frosts over | Shiver and brighten up |

**Halloween (Oct 25 – Nov 1, five variants; a kid can pick, default rotates daily)**

| Variant | Attachments and swaps | Clip |
|---|---|---|
| Pumpkin Pal | Orange jack-o'-lantern shell over the torso, leaf stem ring around the dome, green boot covers; face glows orange | Wobble laugh |
| Friendly Ghost | Translucent white sheet with a dome cutout, cyan face shows through; bolts → tiny bats | Float up and "boo" |
| Star Wizard | Pointed hat with a dome cutout, star-print cape, glowing wand; chest badge → moon | Wand sparkle |
| Glow Skeleton | Body shell → matte black with glowing cyan bone decals; bolts → bones | Rattle dance |
| Hero Cape | Red cape with SparkForge crest, small eye mask around the face rim, wrist cuffs; bolts stay | Hands-on-hips power pose |

**Holidays (calendar-driven, region-aware, parent toggle)**

| Pack | Window | Attachments and swaps | Clip |
|---|---|---|---|
| Fourth of July | Jul 1 – Jul 7 (US region default) | Star-spangled top hat ring, sparkler in hand, red-white-blue chest badge; bolts → stars | Wave sparkler |
| Christmas Cheer | Dec 1 – Dec 26 | Santa hat with a dome cutout, candy-cane scarf, jingle-bell collar, gift box in hand; bolts → candy canes | Jingle and shake |
| New Year Countdown | Dec 31 – Jan 2 | Party glasses showing the year, party horn, confetti decals | Blow horn and confetti |
| Valentine Spark | Feb 10 – Feb 14 | Heart chest badge, bow tie, small heart decals; bolts → hearts | Blush and heart pop |
| Lucky Clover | Mar 15 – Mar 17 | Green top hat ring, shamrock chest badge; bolts → clovers | Jig |
| Lunar New Year | per lunar calendar, region opt-in | Red and gold silk vest, lantern in hand; chest badge → gold coin | Lantern raise |

**Occasion (event-driven)**

| Pack | Trigger | Attachments and swaps | Clip |
|---|---|---|---|
| Sharp Suit | Special occasions: the kid's lab completion, level-up ceremony, mastery claim, parent-shared report day | Tuxedo jacket and bow tie shell, cufflinks, polished boots; bolts hidden | Straighten tie, bow |
| Graduation | Course or lab track completion | Mortarboard ring with a dome cutout, tassel, rolled diploma | Toss the cap |
| Birthday | Child's birthday from the profile | Party hat ring, cake slice, balloon on a string | Dance |
| First Day | First login and onboarding | Shiny "NEW" sticker on the chest plate, oversized welcome badge | Excited bounce |
| Pajamas | After the profile's bedtime hour and before 6 a.m. | Nightcap ring, star-print pajama shell, slippers, teddy in hand; face dims | Yawn, curl up |

**Unlockable (badge-driven, always available once earned)**

| Pack | Unlock | Attachments and swaps |
|---|---|---|
| Lab Coat | First lab completed | White lab coat shell, safety goggles pushed up around the dome |
| Forge Smith | Ten games completed | Leather apron, welding goggles ring, hammer in hand; bolts → sparks |
| Astronaut | Lab 5 or space-themed track complete | Suit shell, backpack, bubble visor built around the dome |
| Detective | Data Detective or Pixel Witness mastery | Deerstalker ring, magnifier in hand, trench collar |
| Agent Atelier | Lab 11 track complete | Mint-cyan tech vest, holographic wrist tablet; chest badge → mint |
| Chef | Any cooking-themed content complete | Toque ring, apron, spatula |

**Production order** (one week of artist time per pack after the base character): First Day and Sharp Suit (needed for onboarding and ceremonies at launch), then whichever seasonal window is nearest to the cutover date, then the five Halloween variants as one batch, then Christmas and Winter Frost, then the remaining seasonal packs, then holidays and unlockables. Twenty-seven packs in year one is about twenty-seven artist weeks; the calendar means only the next two or three are ever on the critical path.

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
| Holiday outfits cause cultural or regional complaints | Low | Region-aware windows; parent toggle; content review in the COPPA pass. |
| Hats and hoods hide the head dome and break the chat emitter | Medium if unstated | Outfit rule in the character spec: every crown attachment has a dome cutout or sits as a ring; checked per pack on `/dev/forge-hub`. |
| HoloBubble covers what the kid is doing | Medium | Renders above panels but avoids the focused control and the active panel header; `ping` and `tip` only during play; Escape always closes it. |
| Two locked plates diverge | Low | Reconciled in P0 with SHA manifests; agents never regenerate world art. |
| Retired cockpit code confuses agents and bloats builds | High today | CLAUDE.md v7 in P0; W9 archive PR in P7. |
| Rollback is theoretical | Low | The compact shell is the rollback and is exercised daily by phone users. |

---

## 8. Budgets and reference hardware

- **Reference laptop:** an Intel Iris Xe class Chromebook or Windows laptop at 1280×720, Chrome stable with WebGPU. Every gate that says "on the reference laptop" means this.
- **World:** ≤ 1.5 M triangles in P1 (plate plus parallax), ≤ 6 material families, bloom only.
- **Sparky:** ≤ 25 k triangles, ≤ 60 bones, two 2048 KTX2 texture sets, ≤ 1.5 ms skinning and animation per frame.
- **Frame time:** ≤ 16 ms hub idle; ≤ 8 ms world share while a DOM game runs; on-demand only while a Phaser or Pixi game runs.
- **Load:** stage chunk and Sparky asset deferred until after LCP; Sparky base GLB ≤ 3 MB compressed; each outfit pack ≤ 500 KB.
- **Lighthouse:** existing `.lighthouserc.json` budgets on `/`, `/login`, `/pricing`, with accessibility and CLS made blocking.
- **SSIM measurement:** `node scripts/ssim-forge-hub.mjs` against a running production build. It verifies the lock SHAs, dismisses the cookie notice, hides the poster layer so only the canvas is scored, refuses blank or poster captures, and writes `.forge-hub-ssim/report.json`. Headless Chromium presents a black WebGPU canvas even where an adapter exists (measured 2026-09-15), so CI scores the WebGL2 path (`--query fallback=webgl2`) and the WebGPU score is taken on the reference laptop. Both numbers go in the P1 packet.

---

## 9. Team and tooling needs

- **3D character artist and animator** (external is fine): base character, rig, clip library, outfit packs. This is the one skill the repo does not have today; nothing in `src/` loads a rigged model yet.
- **Motion design pass** on the motion bible and the Theatre.js beats: can be the owner with engineering support, as the hero v3 beats were done.
- **Engineering:** one stream is enough; two shortens P4 and P5 by running games-on-glass and Sparky integration in parallel.
- **Tooling already present:** R3F, drei, three r183 WebGPU, GSAP, Theatre.js, Draco and KTX2 pipeline, Playwright with WebGPU and WebKit, Lighthouse CI, bundle-size job.

---

## 10. Immediate next actions (first two weeks)

1. Owner confirms decisions 2 to 10 (11 to 13 are answered).
2. Commit `LOCKED_HUB`, the supplied Sparky concept as `LOCKED_SPARKY.png`, and the PR #164 plate with SHA manifests.
3. Write the decision lock and the Concept 10, Rebuild IV, and CLAUDE.md v7 amendments in one PR.
4. Write `docs/sparky/SPARKY-CHARACTER-SPEC.md` from §2.8a (silhouette, palette, face screen, dome bone and socket, sockets, decal slots, outfit rule) and the artist brief; engage the artist with the base character plus First Day and Sharp Suit as the first order.
5. Write `docs/forge-hub/MOTION_BIBLE.md` v1: welcome, login success, hub to labs, lobby to play stage merge, play stage to lobby split, Whisper, Emit burst, first-visit ignition.
6. Archive the root `Phased-R3F-Hub-Plan.md`; fix paths and vocabulary in the spec docs; open the PROGRESS.md section.
7. Start P1: `/dev/forge-hub` room shell, portal reducer ported, SSIM harness, procedural placeholder Sparky with desk spots.
8. Port PR #164's layout math, catalog, reducer, tests, and blend tokens; close the PR with a link here.
9. Schedule the P1 owner visual checkpoint.

Items 2 and the spec half of item 4 were completed on 2026-09-14 (see PROGRESS.md "FORGE HUB — locks committed"). The rest are dispatched to the Grok Bot Team per §11.

---

## 11. Grok Bot Team — operating model, accounts, keys, software, and dispatch

This section is the owner's handbook for running the build with a team of Grok agents. The literal, copy-paste prompts for each agent are in `docs/forge-hub/GROK_TEAM_PROMPTS.md`. Agents make decisions dynamically inside the authority tiers in §11.4; the owner is the only approver at every gate that changes what a kid sees.

### 11.1 Roster

Eight roles. One agent per role is enough; Stagehand and Glazier may be doubled once P2 is done. Names are call signs used in branches, PR titles, and PROGRESS.md so the owner can see who did what at a glance.

| Call sign | Role | Owns | Never touches |
|---|---|---|---|
| **Foreman** | Program lead and orchestrator | Task board, dispatch, dependency order, approval packets to the owner, PROGRESS.md daily note, gate enforcement | Application code, art |
| **Scribe** | Governance and documentation | W0: decision lock, Concept 10 and Rebuild IV amendments, CLAUDE.md v7, vocabulary, motion bible, PR #164 port and close, `_SUPERSEDED` manifests | Source code beyond doc comments, art |
| **Stagehand** | Hub engineer | W1 and W2: renderer, room, glass, projection hook, Director, `forgeStore`, `ForgeRouteMode`, `HoloPanel`, `EscapeFlat`, `ToastRail`, `/dev/forge-hub` | Game components, Sparky art, feature flags for production |
| **Glazier** | Screen migration engineer | W4 waves, W5 games on glass, W6 compact shell, W7 theme | The stage internals owned by Stagehand (proposes changes to Stagehand instead), games' internals |
| **Smith** | Character pipeline | W3: Sparky spec adherence, candidate generation, Blender scripting, rig and export, `optimize:3d`, import checks, outfit packs, 2D stills, HoloBubble coupling with Stagehand | Locked art bytes, the panel system |
| **Director** | Motion and cinematics | Motion bible implementation, Theatre.js beats, GSAP timelines, Tone.js stings, SSIM harness, reduced-motion substitutes | Layout registry values (proposes to Stagehand), game code |
| **Inspector** | QA and performance | W8: unit, e2e, visual, SSIM in CI, axe, Lighthouse, the 42-game glass sweep on reference hardware, hit-test spec for Sparky | Shipping fixes in others' areas (files bugs with repro instead; may fix tests and CI config) |
| **Gatekeeper** | Release | W9 archive PR, W10 flags and rollout, Vercel environment variables, Sentry tags, branch hygiene, release tags on `setup-sparkforge-dev` | Anything before its gate passes |

### 11.2 Sources of truth, read in this order, every session

1. `docs/forge-hub/TRANSITION_ACTION_PLAN.md` (this file)
2. `docs/forge-hub/LOCKED_HUB.md`, `docs/forge-hub/LOCKED_SPARKY.md`, `public/forge-hub/README.md`
3. `docs/sparky/SPARKY-CHARACTER-SPEC.md` (Smith, Stagehand, Director)
4. `docs/forge-hub/PLAN_ASSESSMENT.md` (why the plan is shaped this way)
5. `CLAUDE.md` (autonomy rules, soft and hard stops, commit strategy) — note it is being revised to v7 by Scribe; until then §1 of this plan wins on any conflict
6. `docs/STATE_ARCHITECTURE.md`, `docs/UX_CONTRAST_POLICY.md`, `docs/concepts/10-digital-forge-build-plan.md` §0.1 and §1.5, PROGRESS.md "OVERLAY-CRIT-001"
7. `docs/forge-hub/TASK_BOARD.md` (created by Foreman on day one; the live state)

### 11.3 Hard rules (no tier can waive these)

1. Never regenerate, re-render, recompress, or restyle any file under `public/forge-hub/`. Verify `sha256sum -c SHA256SUMS` before and after any task that touches the folder.
2. Never edit files under `src/components/games/*` (W5 changes the shell, not the games). Never skip, disable, or quarantine a test to get green.
3. Never add a Zustand store (repurpose `sceneStore` per §2.5). Never put `filter`, `transform`, or `backdrop-filter` on `html`, `body`, or an app-shell wrapper.
4. Never create a release tag, create or delete a long-lived branch, flip a production flag, change a Vercel production setting, or change a GitHub repository setting without an owner approval packet marked Approved. `setup-sparkforge-dev` is the default and only integration branch; there is no `main`.
5. Never paste a secret into chat, a PR, a commit, a doc, or a log. Secrets live only where §11.6 says.
6. Never add a dependency outside the stack in CLAUDE.md §1 without an owner approval packet, except the dev-only tools listed in §11.7.
7. Never spend money (API credits, contractor hours, paid add-ons) without an owner approval packet that names the amount.
8. Every PR targets `setup-sparkforge-dev`, is named `<callsign>: <task-id> <title>`, uses the PR template in `GROK_TEAM_PROMPTS.md` §0.3, and carries the attribution footer the repo requires.
9. Anything visible to a kid (layout, motion, colour, copy, Sparky's look or behaviour, an outfit) reaches the owner as an approval packet before it merges.
10. When blocked or uncertain, do not stop silently and do not guess at a Tier 2 decision: write the options (§11.4) and continue on the recommended option only if it is Tier 0 or 1.

### 11.4 Decision authority tiers (dynamic decisions with owner final approval)

| Tier | Who decides | Examples | Record where |
|---|---|---|---|
| **0 — Agent decides** | The agent, alone, immediately | Implementation details inside its area; file and function names; which drei helper to use; test structure; clip timing within ± 20 %; generating candidate assets for review; ordering its own subtasks; choosing among stack-approved libraries | PR description |
| **1 — Foreman sign-off** | Foreman, same day | Cross-agent interface changes (store shape, layout registry fields, socket names); budget adjustments inside §8 limits; re-ordering tasks across agents; adding a dev-only tool from §11.7; a doc amendment that changes no product behaviour | Task board + PR |
| **2 — Owner approval** | Owner, via approval packet | Anything a kid sees (§11.3 rule 9); palette, silhouette, proportions, expressions, outfit designs; mode or layout changes; the fullscreen list for games; a dependency outside the stack; any spend; account creation; production flags; release tags; reopening decisions 1 to 13; timeline slips over one week | Approval packet, owner reply, then PR |

**Options rule.** For any Tier 1 or Tier 2 decision the agent writes at most three options with a one-line recommendation and the cost of waiting. For Tier 1 it continues on the recommended option unless Foreman objects within the day. For Tier 2 it prepares everything short of the decision (both branches if cheap) and waits.

### 11.5 Approval packets (the only way to reach the owner)

Foreman assembles and sends packets; agents feed him. One packet per decision. The owner answers in chat or on the PR with one word — **Approve**, **Revise** (with notes), or **Reject** — and the Foreman records it in the task board and PROGRESS.md.

```
APPROVAL PACKET <id> — <title>
Gate: <P0..P7 gate or checkpoint id C1..C7>   Tier: 2   Requested by: <callsign>
What: one paragraph.
Why now: one line.
Look: screenshots / turntable / preview URL (Vercel preview for the PR).
Diff: PR link and files touched.
Risk and rollback: one line each.
Options considered: A (recommended) / B / C, one line each.
Ask: Approve | Revise | Reject
```

Foreman sends at most five open packets at a time and batches cosmetic ones. Silence is never approval.

### 11.6 Accounts, platforms, and keys

Everything in this table is the owner's to create or grant. Secrets are stored only in the named place; agents read them from the environment and never echo them.

| Account or platform | Needed for | Who uses it | Status | Where the secret lives |
|---|---|---|---|---|
| GitHub `BlissDirective/SparkForge-Labs-LLC` | Branches, PRs, Actions | All agents | Exists | Grant each agent a fine-grained PAT or a GitHub App installation scoped to this repo only, with Contents and Pull requests read/write and Actions read; no admin scope. Store in the agent runner's secret store as `GITHUB_TOKEN`. |
| GitHub repository settings | Branch protection on `setup-sparkforge-dev`, Git LFS | Owner only | `setup-sparkforge-dev` is and stays the default branch; the stray `main` was deleted by the owner 2026-09-15. AP-001 approved 2026-09-15; `.gitattributes` for LFS committed. | **Owner action O-1:** Settings → Branches → rule for `setup-sparkforge-dev`: require a PR with 1 approval and dismiss stale approvals; required checks `Typecheck, test, build`, `Secret scan (gitleaks)`, `RLS verification`, `E2E smoke (Playwright)`, `SSIM vs locked hub plate`; require up to date; block force pushes; no bypass. |
| Vercel team `conrad-steinmeyers-projects`, project `sparkforge-labs` | Preview deployments per PR (already automatic), production env vars, `FORGE_HUB*` flags | Gatekeeper (read), owner (write) | Exists | Vercel dashboard. Agents do not need a Vercel token for previews. If Gatekeeper is to set env vars, create a Vercel token scoped to the project and store it as `VERCEL_TOKEN`; otherwise the owner sets flags by hand from Gatekeeper's packet. |
| Vercel production branch | Which branch deploys to production | Owner | Latest deployment target is preview; no custom domain attached | Owner confirms the production branch is `setup-sparkforge-dev` when ready for W10; releases are tags on that branch. |
| Supabase project `gqoaknfboahuqvgpidgw` | Two small additions later: per-child `sparky_outfits_enabled` and `sparky_calm_mode` settings columns (W3 step 6), `sparky_outfit_unlocks` reads from existing badges | Scribe drafts migration; owner reviews; applied via the existing MCP flow | Exists; no change until P5 | Service role key never reaches an agent; `NEXT_PUBLIC_SUPABASE_URL` and anon key already in Vercel and `.env.local`. |
| Sentry | `forge_hub` release tag, perf transactions for morphs | Gatekeeper | Exists (`NEXT_PUBLIC_SENTRY_DSN`) | No new key. |
| Anthropic API | Tutor chat behind the HoloBubble | Unchanged | Exists (`ANTHROPIC_API_KEY`) | No change; the chat engine is reused. |
| Stripe | None | — | — | Untouched by this plan. |
| Blender 4.2 LTS | Modelling, rigging, clip authoring, headless export and checks | Smith, artist | Free; install on the agent runner and the artist's machine | No key. |
| Image-to-3D generation service (Meshy or Tripo3D; one is enough) | Track A candidate models from `LOCKED_SPARKY.png` (§11.8) | Smith | **Owner decision + spend**: create an account, buy the smallest credit pack, store the key as `MESH_GEN_API_KEY` | Agent runner secret store. Candidates are proposals only; the lock is never uploaded anywhere that claims rights over it. Check the service's terms on ownership of generated output before buying. |
| Adobe account for Mixamo | Free auto-rig and animation clips as a rigging fallback and clip starting points | Smith, artist | Free; owner creates | No API; browser use. Mixamo clips are retargeted in Blender to the §4.1 skeleton. |
| Contract 3D character artist (Track B) | Final model, rig, clip library, outfit packs when Track A is not good enough | Owner hires; Smith briefs and reviews | **Owner decision + spend** | Brief = `SPARKY-CHARACTER-SPEC.md` + `LOCKED_SPARKY.png` + plate. Deliverables and checkpoints are in the spec §2 and §11. |
| Git LFS on this repo, or a new `SparkForge-Sparky-Assets` repo | `.blend` and texture sources | Smith, artist | **Owner decision** (recommended: LFS on this repo, budget 2 GB) | GitHub settings. |
| Rive (free tier) | Only if a `.riv` is authored for the in-game mount instead of sprite sheets | Smith | Optional | No key. |
| Real-device or cloud device lab (BrowserStack or LambdaTest), or one physical Chromebook and one iPad | Inspector's reference-hardware runs (§8) | Inspector | **Owner decision + spend** (a physical Chromebook is cheaper and better) | If cloud: `DEVICE_LAB_USER` and `DEVICE_LAB_KEY` in the runner secret store. |
| Concept art tool the owner used for `LOCKED_SPARKY.png` | Turnaround and expression-sheet proposals, outfit concept proposals (never the lock itself) | Owner, or Smith with the owner's account if permitted | Exists on the owner's side | Owner's account; agents receive outputs as files. |

### 11.7 Software on the agent runner

Node 24.x (matches Vercel), npm, Git with LFS, Blender 4.2 LTS CLI (`blender -b -P`), `@gltf-transform/cli`, KTX-Software `toktx` (already required by `scripts/optimize-3d-assets.mjs`), Python 3.11 for Blender scripts, Playwright with Chromium (WebGPU flags) and WebKit, `@lhci/cli` 0.14, ImageMagick or `sharp` for stills and sprite sheets, `ffmpeg` for loop encodes, an SSIM tool (`ssim.js` npm or `scikit-image`), Theatre.js studio in the browser via `/dev/forge-hub`. All free; adding anything else is Tier 1 if dev-only, Tier 2 if it ships.

### 11.8 Sparky production: two tracks, owner picks at C1

- **Track A — AI-assisted.** Smith generates 6 to 10 image-to-3D candidates from `LOCKED_SPARKY.png` (front view, then with owner-approved turnaround sheets), imports each into Blender headless, normalises scale and orientation per spec §3.1, renders a comparison sheet against the concept, and sends one approval packet: "Candidate sheet". If the owner approves a candidate, Smith retopologises and cleans it to spec §3 budgets, builds the §4 rig (Rigify humanoid metarig renamed to the contract, or Mixamo auto-rig retargeted), and authors clips (hand-keyed for the signature poses, Mixamo-derived for walk and turn, cleaned up). Cost: credits only. Time: 1 to 3 weeks to C4.
- **Track B — contract artist.** Owner hires; Smith is the technical reviewer at every checkpoint, runs the import checks, and does the pipeline work (export, `optimize:3d`, packs, stills). Cost: contractor. Time: 4 to 6 weeks to C4.
- **Recommendation:** run Track A for 48 hours first. Its candidate sheet either wins outright, becomes the blocking model for Track B (saving the artist a week), or proves the concept needs a human from the start. The owner decides at C1 with both options costed.
- Either track ends at the same place: `public/models/sparky/sparky.glb` passing the import check script, C4 approved, behaviour wired by Stagehand and Smith together.

### 11.9 Dispatch order

| Day | Foreman dispatches | Waits on |
|---|---|---|
| 1 | Foreman creates `TASK_BOARD.md`; Scribe starts W0 items 1 to 8; Smith starts Track A candidates and the artist brief; Stagehand starts W1 on `/dev/forge-hub`; Inspector sets up the SSIM harness and reference hardware | Owner: §11.6 decisions on GitHub PAT, LFS, mesh-gen account, device lab |
| 2 to 5 | Director writes the motion bible with Scribe; Stagehand room shell; Smith candidate sheet packet (C1); Scribe CLAUDE.md v7 packet | Owner approvals: decision lock, amendments, C1 |
| Week 2 | P1 gate packet (room shell SSIM, placeholder Sparky); Glazier starts W7 theme; Gatekeeper ports and closes PR #164 with Scribe | Owner: P1 visual checkpoint |
| Weeks 3 to 5 | Stagehand W2 screen kit and Director timelines; Smith rig and clips (C2 to C4 packets); Inspector unit and e2e scaffolds | Owner: P2 gate, C2 to C4 |
| Weeks 5 to 7 | Glazier W4 wave 1 and W6; Inspector Lighthouse gates real | Owner: P3 gate |
| Weeks 7 to 10 | Glazier W4 waves 2 and 3 with W5; Inspector 42-game sweep; Smith C5 and first packs (C6) | Owner: P4 gate, fullscreen list, C5, C6 per pack |
| Weeks 10 to 13 | Smith integration and HoloBubble with Stagehand; Glazier waves 4 and 5; stills (C7) | Owner: P5 gate |
| Weeks 13 to 15 | Inspector hardening; Director polish; Scribe docs sweep | Owner: P6 gate |
| Weeks 15 to 17 (+2 soak) | Gatekeeper rollout steps, each a packet; W9 archive PR | Owner: each rollout step, final tag |

### 11.10 Reporting

- Foreman appends a dated note to PROGRESS.md every working day: done, blocked, packets open, next.
- Every agent ends every session with a task-board update and, if it touched files, a PR (draft is fine).
- Every gate packet includes the Vercel preview URL for the PR so the owner can see the change live before approving.
- Slips over one week are a Tier 2 packet with a revised §4 table, never a silent re-plan.

---

*Companion: `docs/forge-hub/GROK_TEAM_PROMPTS.md` — the copy-paste system prompt for each call sign, the kickoff message, and the PR template.*
