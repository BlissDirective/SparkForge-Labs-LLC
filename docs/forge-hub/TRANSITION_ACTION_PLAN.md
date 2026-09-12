# Forge Hub — Full Transition Action Plan

**Status:** Proposed — Phase 0 (governance) not yet started
**Date:** 2026-09-12
**Owner decision recorded:** proceed with the animated hologram-forge-hub (`LOCKED_HUB`) as the welcome, main, and control surface, and with the new Sparky avatar concept (`LOCKED_SPARKY`) as the companion.
**Inputs:** `PLAN_ASSESSMENT.md`, the six spec docs in this folder, PR #164, the code on `setup-sparkforge-dev` at `927560c`.
**This is a plan. No code ships from this document.**

---

## 0. Decisions this plan assumes

The owner has made decision 1 from `PLAN_ASSESSMENT.md` §6. The other seven are assumed as below. Each is a default the owner can override by reply; the ones marked **shapes the plan** change the architecture if reversed, the rest change only details.

| # | Decision | Assumed answer | Weight |
|---|---|---|---|
| 1 | Direction | **Forge hub is the kid-facing shell on desktop and ultrawide.** Concept 10 §0.1 and Rebuild IV.2 are amended, not ignored. | Owner-made |
| 2 | Panel technology | **DOM panels projected from the 3D scene**, not drei `Html transform`. See §2.2 for why. | **Shapes the plan** |
| 3 | Where the canvas lives | **One canvas in the root layout**, mode driven by pathname; FLAT routes pause and hide it. | **Shapes the plan** |
| 4 | Mobile and tablet | **Today's HTML dashboard shell stays alive as the compact-tier shell**, restyled to the forge-hub palette. No canvas below 1440 px. | **Shapes the plan** |
| 5 | Games | **All 42 games exit the forge.** `PlayStage` hosts non-game surfaces only. | Shapes W5 |
| 6 | Sparky tech | **Rive**, per the existing spec, with the state machine extended for overlay poses. SVG `SparkyCore` redrawn to the new concept as the fallback. | Shapes W3 |
| 7 | PR #164 | **Port, then close.** Take the layout math, portal reducer, catalog, tests, blend tokens, and locked plate. Do not merge the hotspot shell or its route and flag. | Detail |
| 8 | Renderer and flag | **`three/webgpu` renderer via the existing `createRenderer` factory with TSL node materials** (WebGPU first, automatic WebGL2 backend, poster below that). Flag family `FORGE_HUB*` in `src/config/feature-flags.ts`. | Detail |

Open questions the owner should answer before Phase 1 (they do not block Phase 0):

- **Welcome composition.** Locked plate has three equal panels. The docs want large-C + two small. Plan assumes: first paint matches the lock, morph to large-C on first intent.
- **Marketing sections.** Plan assumes Features, How-It-Works, AI Tutor, and CTA remain a flat scroll *below* the 100 vh forge stage on `/`, rather than being folded into panels. Pricing stays FLAT.
- **Palette amendment.** Plan assumes Concept 10 §1.2 is amended to "warm rose-gold/cream world, cyan hologram primary for UI surfaces, molten amber reserved for progress fills and ceremonies". Confirm this is the intended read of the plate.

---

## 1. Target end state

When this plan is complete:

- **Desktop and ultrawide (≥ 1440 px):** every kid-facing route renders inside one persistent forge stage. The room, SF emitter, desk, and hologram glass are a fixed-camera R3F scene. Three DOM panels ride the glass. Navigation is a morph between named modes, never a page flash. Sparky floats as an overlay companion with tip, point, whisper, cheer, and wave poses. Parent, billing, security settings, legal, and admin routes drop to `EscapeFlat`, a full-viewport 2D surface, with the stage paused behind them.
- **Tablet and mobile (< 1440 px):** the current HTML dashboard shell (Sidebar, TopBar, BottomNav) remains, restyled to the forge-hub palette. No canvas. Same page content components as the desktop panels.
- **No-GPU or crashed-canvas desktop:** a poster of the locked plate behind the same DOM panels. Nothing functional is lost.
- **Games:** all 42 launch through an airlock transition out of the forge into the existing `HtmlGameShell`, and return through a reform transition into `gameLobby`. Sparky's in-game 72 px mount is unchanged.
- **`/` logged out:** the forge in `welcome` mode with a real `<h1>` on the center glass, then the flat marketing scroll below.
- **Rollback:** one flag off returns the HTML shell on every tier, because that shell never stops being the compact-tier shell.

---

## 2. Architecture decisions that make the transition safe

### 2.1 One stage in the root layout

The stage mounts once in `src/app/layout.tsx` behind the `FORGE_HUB` flag and a desktop-tier check, above all three route groups. A `ForgeRouteMode` provider maps the pathname to a mode (`welcome`, `hubSplit`, `authMerged`, `labsBrowse`, `gameLobby`, `avatarStudio`, `settingsDock`, `playStage`, `cinematic`) or to `FLAT`. Route groups keep their own layouts for auth, banners, and providers, but they no longer own any chrome on desktop.

Consequences:

- `/` → `/login` → `/home` is one continuous scene. No canvas remount, no flash.
- FLAT routes set the frame loop to `never` and hide the canvas. Returning restores it without re-initialising the renderer.
- Game routes do the same, which is the "dim" option from the spec and avoids a 1 to 2 s WebGPU init on every game launch.
- The middleware auth gate is unchanged. Mode mapping is purely client-side.

### 2.2 DOM panels projected from the scene, not `Html transform`

Each hologram is two things: a glass mesh in the scene (edge glow, scanline, breathe, emissive cone from the SF core) and a normal React DOM element positioned over it. A `useProjectedSlot` hook reads the glass mesh's corner anchors each frame and writes a CSS transform to the DOM panel. Yaw up to about 8° is applied as CSS `perspective` + `rotateY`; any panel that holds a form or more than two lines of body text snaps to yaw 0 (Focus, CenterWide, PlayStage).

Why this instead of drei `Html transform`:

- **The panels are server-rendered.** Before hydration they sit at the static rects from the layout registry over a poster of the plate. The LCP element on every route is HTML text, which keeps Concept 10 §0.1.3 true in spirit and keeps Lighthouse honest.
- **Text stays crisp, forms and scroll stay native, focus order is DOM order.** The a11y policy needs no exceptions.
- **The same DOM panels are the poster fallback and the basis of the compact shell.** One component tree, three presentations.
- **PR #164 already proved the percent-rect approach** with beams following live rects. The projection hook replaces its hand-frozen numbers with numbers derived from the scene.

drei `Html` is still used for small in-world decorations: slot labels, the Sparky speech tail, toast chips on the rail.

### 2.3 Reading plate rule

Inside every glass panel the content region has an opaque backing (≥ 0.85 alpha, dark navy family) with the translucent cyan glass visible only in the edge zone and behind empty panels. This satisfies `docs/UX_CONTRAST_POLICY.md` and Concept 10 §1.5 and is the single biggest difference from the PR #164 look (0.48 / 0.58 fill). Empty idle panels stay thin glass, as the lock shows.

### 2.4 World built as plate plus parallax first

Phase 1 uses the locked plate as the projected backdrop with real meshes only for what must move or emit: SF core and beam cone, desk lip, three glass slabs, dust and ember particles. This is the "plate + parallax" option in `R3F_VARIATION_PLAN.md` §1. It is how SSIM ≥ 0.96 against `LOCKED_HUB` is reachable in the first phase, and it keeps the GPU budget Chromebook-safe. A full mesh room is a later, optional upgrade behind the same interfaces.

### 2.5 State lives in a repurposed store, not a new one

`sceneStore` (retired cockpit, 261 lines) already owns active scene, transitions, and enter/exit game. It becomes `forgeStore` with: `mode`, `previousMode`, `morphProgress`, `portalPhase` (from PR #164's reducer), `sparky` (anchor, pose, tip), `flatOverlay`. This respects `docs/STATE_ARCHITECTURE.md` R1/R2 and the store-count gate. `cockpitStore`, `cockpitAtoms`, and `cockpitBroadcastStore` retire with the cockpit code (W9). `deviceStore` and `useDeviceProfile` stay.

### 2.6 Renderer

`three/webgpu` `WebGPURenderer` created through the existing `src/lib/3d/webgpuRenderer.ts` factory, which already carries the iOS Safari guard. All forge materials are TSL node materials so the WebGL2 backend fallback is automatic and there is no shader fork. Below WebGL2, or on a `Canvas3DErrorBoundary` catch, the stage unmounts and the poster fallback shows. Post-processing is bloom only, from `PostProcessingStackWebGPU.tsx`, with the D3D-5 Performance toggle honoured.

---

## 3. Workstreams

Ten workstreams, run as parallel tracks where the dependency table in §4 allows.

### W0 Governance and document reconciliation

1. Write the decision-lock entry (`docs/01-decisions/2026-09-forge-hub.md`): direction, the eight decisions above, the amended invariants.
2. Amend `docs/concepts/10-digital-forge-build-plan.md` §0.1.2 and §0.1.3: "The frame is DOM. The world is canvas. On desktop tier the world may be a persistent R3F stage behind DOM panels; the LCP element remains HTML." Amend §1.2 palette per §0 above.
3. Amend `Fable-5-SparkForge-Rebuild.md` Part IV: record the forge hub as the Part IV outcome, with the same LCP and mobile guardrails carried over.
4. CLAUDE.md v7: remove the Laboratory Control Station as current, describe the forge hub, keep the Tech Quality Mandate and the mobile fallback policy, retire the cockpit HS-9 and 3-Cockpit checklist rows, add forge-hub checkpoint rows.
5. Vocabulary lock: `HoloL / HoloC / HoloR`, `welcome` (never `heroWelcome`), `hubSplit` = three destinations on the equal trio. Update `Phased-R3F-Hub-Plan.md` §3 to §5 to match.
6. Archive `docs/Phased-R3F-Hub-Plan.md` (repo root) under `docs/forge-hub/_SUPERSEDED/` with a manifest, per CLAUDE.md §3.2.
7. Commit the lock assets: `LOCKED_HUB.png` (and JPEG), `LOCKED_SPARKY.png`, PR #164's `LOCKED_HERO.png` with its SHA manifest, all under `public/forge-hub/world/` and `public/forge-hub/sparky/`. Reconcile the two plates: name one canonical, keep the other as a reference still.
8. Fix the `hub-concepts/` and `/workspace/` paths in the spec docs.
9. PROGRESS.md: new "Forge Hub" section, current phase, discrepancies log started.
10. Close PR #164 with a comment pointing at this plan after W2 has ported what it needs.

### W1 World and renderer (room shell)

- Fixed camera matching the plate. Camera constants live in one config file with the layout registry.
- Plate-plus-parallax scene per §2.4. Parallax on mouse and gyroscope-less (desktop only).
- SF emitter: TSL emissive core, cone bloom to live panels (`sfBloom`), portal reducer `idle → charge → emit → docked` ported from PR #164, reduced-motion skips to docked.
- Three glass slabs with TSL edge-glow and scanline; `panelBreathe` idle loop.
- Post-processing: bloom only. Frame loop `always` on stage routes, `demand` under reduced motion, `never` on FLAT and game routes.
- Quality tiers through the existing `autoQuality` path: particle count and bloom resolution step down on low frame time.
- Exit gate: SSIM ≥ 0.96 against `LOCKED_HUB` on a 1536×1024 capture; 60 fps on an Intel Iris Xe class laptop; no console errors; poster fallback verified in a WebKit run.

### W2 Screen kit (panels, morph engine, escape)

- Layout registry in world units: for each mode, each slot's position, rotation Y, scale, and content size. Ported from PR #164's `layouts.ts` with the percent rects converted and the beam-attachment math kept.
- `useProjectedSlot` hook per §2.2, with the SSR static rects as the pre-hydration position.
- Morph engine: damped interpolation per slot in the frame loop (maath is already a drei dependency; no new package). Tokens from `R3F_VARIATION_PLAN.md` §4 implemented as named timings: `slotSlide`, `yawTuck`, `glassWipe`, `morphDissolve`. Reduced motion crossfades only.
- `HoloPanel` DOM component: reading plate per §2.3, header strip, scroll region, focus trap when modal, `aria-label` per slot.
- `EscapeFlat`: full-viewport layer mounted outside any transformed wrapper (OVERLAY-CRIT-001), stage paused behind it, Escape key and a visible "Back to forge" control.
- `ToastRail`: edge chips that absorb `OfflineBanner`, `DemoSessionBanner`, `EmailVerifyBanner`, and `toastStore` output on desktop.
- `ForgeRouteMode` provider and the pathname-to-mode table.
- `forgeStore` per §2.5.
- Dev route `/dev/forge-hub` (public, no flag) with a mode switcher, `?calibrate=1` slot outlines, and a Sparky pose panel. Replaces `/dev/forge-lab`.
- Exit gate: one real React panel (the login form) rendered on HoloC, morph `welcome ⇄ hubSplit ⇄ authMerged` with the form staying mounted, axe clean, keyboard-only pass, 22 ported unit tests green plus new ones for the projection math and the route table.

### W3 Sparky (new avatar concept to production)

1. **Concept lock in repo.** Commit `LOCKED_SPARKY.png`. Write `SPARKY-RIVE-SPEC.md` v2: the new look replaces §1 of the current spec; state machine name and the four game inputs are unchanged so all 42 games keep working; add overlay inputs `pose` (number: 0 idle, 1 wave, 2 point-left, 3 point-right, 4 whisper, 5 cheer) and `attention` (boolean, looks at the active panel). Keep 200×200 artboard, add a 400×400 variant for the overlay.
2. **SVG redraw.** `SparkyCore.tsx` is the SSR-safe fallback and the source for the nine expression colours. Redraw it to the new concept, keeping the expression API so `SparkyFloating`, `SparkyPresenter`, and `SparkyStatic` keep working. This is the one piece of W3 that is in-repo design work.
3. **Rive authoring.** External to the repo: author `sparky.riv` in the Rive editor to v2 spec. Drop at `public/rive/sparky.riv`. Verify on `/dev/sparky` and `/dev/forge-hub`.
4. **`SparkyOverlay`.** A screen-space element anchored to projected 3D points `nearSF`, `panelLip` (bottom edge of the active panel), and `whisperCenter`. `sparkyHop` on anchor change, `sparkyPing` when addressable. Pointer events only on the avatar itself, never over glass hit targets. Tap opens Whisper.
5. **Absorb the AI tutor.** `AITutor` chat becomes the Whisper mode panel (`G Whisper` in the motion doc): panels dim, the chat rides HoloC, Sparky sits at `whisperCenter`. `AITutorAvatar` is already deprecated in favour of `SparkyFloating`; remove it. `AITutorContext` stays as the chat engine.
6. **Compact tier.** `SparkyFloating` keeps its current role on mobile and tablet with the new look.
7. Exit gate: nine expressions and six poses verified on `/dev/sparky`; overlay never occludes a focusable target (automated hit-test in e2e); in-game mount unchanged in the game-migration smoke.

### W4 Screen migration (all routes)

Every route is migrated by wrapping its existing page content in the panel slots of its mode. Page components (`QuestPanel`, `DailyMissionCard`, `ForgeRing`, `LeaderboardPanel`, `PetWidget`, the lab and arcade grids, `LessonViewer`, `QuizEngine`, and so on) are reused as-is or split into left/center/right fragments. Nothing is rewritten for the sake of it. The full route table is in §5. Waves:

- **Wave 1 — Home and welcome:** `/`, `/home`, `/onboarding`.
- **Wave 2 — Auth:** `/login`, `/signup`, `/forgot-password`, `/reset-password`; `/mfa-challenge` FLAT.
- **Wave 3 — Labs and content:** `/labs`, `/labs/[labId]`, `/content/[slug]`, `/story`.
- **Wave 4 — Arcade and games:** `/arcade`, `/arcade/[gameSlug]` airlock (W5), `/create`.
- **Wave 5 — Progress family:** `/progress`, `/achievements`, `/mastery`, `/seasons`, `/buddies`.
- **Wave 6 — Profile and settings:** `/profile` with `avatarStudio`, `/settings` kid prefs on glass, security settings FLAT.
- **FLAT from day one, no migration work beyond palette:** `/parent/*`, `/admin/*`, `/settings/{mfa,sessions,linked-accounts,legal}`, `/onboarding/consent`, all legal marketing pages, `/pricing`, `/offline`.
- **Marketing:** `/competencies` folds into a Focus panel in Wave 6; the landing sections stay flat below the stage.

Each wave ships behind its own sub-flag (`FORGE_HUB_HOME`, `FORGE_HUB_AUTH`, `FORGE_HUB_LABS`, `FORGE_HUB_ARCADE`, `FORGE_HUB_PROGRESS`, `FORGE_HUB_PROFILE`), all AND-ed with `FORGE_HUB`, following the Concept 10 sub-flag pattern.

### W5 Game airlock

- `gameLobby` mode: HoloL game list (existing arcade grid split by lab), HoloR preview and tier upsell, HoloC "launch" stage.
- Launch: `cinematic` emit burst (≤ 0.6 s, from the portal reducer's `emit` hold) → route push → stage frame loop `never`, canvas hidden → `HtmlGameShell` renders as today. No changes inside `src/components/games/*`.
- Return: game complete or exit → route back to `/arcade` → stage resumes in `gameLobby` with `morphDissolve` reform; `ForgeCompleteCeremony` and `CelebrationOverlay` play on the glass instead of the flat page.
- Reduced motion: hard cut both ways.
- The five Phaser/Pixi games and the thirty-seven DOM/SVG/R3F games take the same path. `PlayStage` is used by `/story`, `/create`, and lesson content only.
- Exit gate: `game-migration-smoke` e2e passes with the flag on; launch-to-first-input under 1.5 s on the reference laptop; no WebGPU re-init on return.

### W6 Compact-tier shell and fallbacks

- The current `(dashboard)/layout.tsx` shell is kept and gated to `tier ∈ {mobile, tablet}` or "stage unavailable". It is restyled with the forge-hub token set (W7) and the new Sparky.
- The poster fallback for desktop without a usable GPU reuses the same DOM panels at the static rects over `LOCKED_HUB` as an image, with a slow CSS breathe.
- Reduced motion on desktop keeps the stage but uses crossfades.
- Exit gate: iPhone 15 and iPad WebKit runs in the visual e2e; Lighthouse mobile preset on `/` and `/login` within the existing budgets.

### W7 Theme and tokens

- New theme `data-theme="forge-hub"` in `src/styles/forge-hub-theme.css`, overriding the `--sf-*` variables like `forge-theme.css` does today. Cyan hologram primary, rose-gold and cream world neutrals, amber reserved for molten fills and ceremonies, magenta unchanged (celebrations only).
- The `HOLO_BLEND` tokens from PR #164 become CSS variables, with the fill raised to the reading-plate value.
- `data-contrast="high"` variant maintained.
- Guard scripts (contrast, spacing, design matrix) run against the new theme; the `text-white/10-40` lint rule stays.
- Root layout selects `forge-hub` when `FORGE_HUB` is on, `forge` otherwise.

### W8 Quality gates, tests, and CI

- **Unit:** layout registry, projection math, route-to-mode table, portal reducer, `forgeStore` transitions, Sparky anchor selection.
- **E2E:** `a11y-sidebar.spec.ts` gains a desktop forge variant (`a11y-forge-nav`), since the sidebar no longer exists on desktop; `core-flow-smoke` runs with the flag on and off; visual specs add `forge-welcome`, `forge-auth`, `forge-labs` captures on Chromium with WebGPU and on WebKit for the poster path; the SSIM check against `LOCKED_HUB` runs in the visual job.
- **Lighthouse:** URLs unchanged; the `|| true` on `lhci autorun` becomes a real failure for the accessibility and CLS assertions once Wave 2 lands.
- **Bundle-size job:** the stage chunk is lazy and post-LCP; the job gets a separate budget line for it.
- **Manual visual checkpoints:** HS-5 pattern at the end of each phase, with a written checklist, as CLAUDE.md prescribes.

### W9 Retired cockpit disposition

Salvage into the forge, then archive the rest:

| Keep and adapt | Archive under `src/components/3d/_SUPERSEDED/` or delete |
|---|---|
| `lib/3d/webgpuRenderer.ts`, `webgpuDetect.ts`, `PostProcessingStackWebGPU.tsx`, `Canvas3DErrorBoundary.tsx`, `CinematicCamera.tsx`, `OffscreenCanvasGate.tsx`, `autoQuality.ts`, `sceneStore.ts` (renamed), `deviceStore.ts`, the `branding/` folder, all game `*3D.tsx` scenes and `game-ui/` templates used by games | `CockpitCanvas.tsx`, `CockpitPanels.tsx`, `CockpitFloor3D.tsx`, `CockpitUILayer.tsx`, `SpatialDashboard.tsx`, `HolographicLabMap.tsx`, `HolographicHUD.tsx`, `StationFrame.tsx`, `SidePanels.tsx`, `MechanicalIris.tsx`, `BatchedCockpitChrome.tsx`, `SceneRouter.tsx`, `AmbientNPCs.tsx`, `HeroAnimation.tsx`, `CrystalHero.tsx`, `cockpitStore.ts`, `cockpitAtoms.ts`, `cockpitBroadcastStore.ts`, the cockpit hooks, `cockpit-architecture.json` |

Done in one dedicated PR after W2 proves which pieces the forge actually imports. Expected to remove well over a hundred files and several stores, which also shrinks typecheck and bundle-size CI time.

### W10 Rollout and cutover

1. `/dev/forge-hub` always on for internal review.
2. `FORGE_HUB` on in preview deployments only.
3. Production: staff accounts, then demo sessions, then 10 percent of desktop sessions, then 100 percent. Sentry release tagging already exists; add a `forge_hub` tag so errors split cleanly.
4. Watch: error rate, LCP, INP, game launch success, session length, demo conversion.
5. Kill switch: `FORGE_HUB=false` restores the HTML shell on all tiers, no deploy needed beyond the env change.
6. After two clean weeks at 100 percent: W9 archive PR, remove the `forge` theme's hero-only pieces (`ForgeHero`, `HeroSection` hologram variant, `LandingMicroGame`) that the stage replaced, and tag `v1.0.0-forge-hub`.

---

## 4. Phases and gates

| Phase | Weeks | Workstreams | Exit gate (owner visual checkpoint at each) |
|---|---|---|---|
| **P0 Governance** | 1 | W0 | Decision lock committed; Concept 10, Rebuild IV, CLAUDE.md v7 amended; lock assets in repo; vocabulary reconciled; PROGRESS.md section opened. |
| **P1 Room shell** | 1–2 | W1, W3 step 1–2 | `/dev/forge-hub` shows the room at SSIM ≥ 0.96 vs `LOCKED_HUB`; portal ignite plays; poster fallback works on WebKit; Sparky SVG redraw approved. |
| **P2 Screen kit** | 2 | W2, W7 | Login form live on HoloC through a full morph cycle; axe clean; projection and route tables unit-tested; `forge-hub` theme applied; PR #164 ported and closed. |
| **P3 Home and auth** | 2 | W4 waves 1–2, W6 | `/`, `/home`, `/onboarding`, `/login`, `/signup` on the stage behind flags; compact tier verified on WebKit devices; Lighthouse gates real. |
| **P4 Labs, content, arcade** | 2–3 | W4 waves 3–4, W5 | Lab browse to lesson to game and back with no canvas re-init; all 42 games launch and return; `game-migration-smoke` green with flag on. |
| **P5 Progress, profile, Sparky live** | 2–3 | W4 waves 5–6, W3 steps 3–7 | Every kid route migrated or FLAT; `sparky.riv` v2 in place; Whisper mode replaces the floating tutor; `/competencies` folded. |
| **P6 Polish and hardening** | 2 | W8, W7 guards | All e2e and visual jobs green flag-on and flag-off; SSIM check in CI; bundle budget line; reduced-motion pass; COPPA review of new surfaces. |
| **P7 Cutover** | 1–2 plus 2 weeks soak | W10, W9 | Staged rollout complete; archive PR merged; tag cut. |

Roughly 14 to 17 weeks on a single engineering stream. Rive authoring (W3 step 3) is external and runs in parallel from P1 onward; it is the long pole for P5, so start it in P0. Per the Tech Quality Mandate these figures are informational.

Dependencies: P1 needs P0 (the lock assets). P2 needs P1. P3 needs P2. P4 and P5 can overlap once P3 is stable. P6 needs P5. P7 needs P6. W3 steps 1–2 can start in P0.

---

## 5. Route-by-route migration table

Reuse means the existing page content components move into slots unchanged; split means a page's sections are divided across slots; new means a component that does not exist today.

| Route | Wave | Mode | HoloL | HoloC | HoloR | Sparky | Notes |
|---|---|---|---|---|---|---|---|
| `/` (logged out) | 1 | `welcome` | Teaser: labs count, sample lab | `<h1>` + tagline + Start/Log-in CTAs (from `HeroContent`) | Teaser: Sparky intro, demo login | `nearSF`, wave | Marketing sections flat below the stage. `NetworkMicroDemo` moves into the stage as a HoloC idle toy later (optional). |
| `/home` | 1 | `welcome` → `hubSplit` | `QuickStatsBar`, streak, `PetWidget` | `DailyMissionCard`, continue CTA, `QuestPanel` | `ActivityFeed`, `LeaderboardPanel` shortcuts | `nearSF` | `DashboardTour` (react-joyride) retargeted to panel ids. |
| `/onboarding` | 1 | `welcome` wizard | step list | wizard step (reuse) | tips | `panelLip`, point | `OnboardingCrystal` retired. |
| `/onboarding/consent` | FLAT | — | — | — | — | none | Legal clarity. |
| `/login`, `/signup` | 2 | `authMerged` | — | form (reuse `SFInput`/`SFButton` form) | — | `panelLip`, tip | `AuroraGalaxy`, `MetallicPaint`, `SpotlightCard` wrappers dropped on desktop. `login-layout` visual spec re-baselined. |
| `/forgot-password`, `/reset-password` | 2 | `authMerged` | — | form (reuse) | — | tip | `AuthPanelCanvas` retired. |
| `/mfa-challenge` | FLAT | — | — | — | — | none | Timing-sensitive OTP. |
| `/labs` | 3 | `labsBrowse` | lab list (split from `ForgeRing`/`MagicBento` grid) | `CorePortal` idle or selected lab hero | lab detail + progress (`SFProgressBar`) | `panelLip`, point at hover | `ForgeRing` CSS-3D ring becomes the HoloL list or is retired; owner call at P4 checkpoint. |
| `/labs/[labId]` | 3 | Focus | tools | lesson/game list (reuse) | `TierUpsell`, progress | looks at C | |
| `/content/[slug]` | 3 | Focus / `playStage` | — | `LessonViewer`, `QuizEngine`, `SparkFactViewer` | related | looks at C | Long reads use `playStage` at yaw 0. |
| `/story` | 3 | `playStage` / `cinematic` | — | story component (reuse) | — | `whisperCenter` narrator | |
| `/arcade` | 4 | `gameLobby` | game list (split from arcade grid, `ElectricBorder` dropped) | launch stage | preview, `SFBadge` tier | cheer at edge | |
| `/arcade/[gameSlug]` | 4 | EXIT | — | — | — | in-game 72 px | Airlock per W5. Zero edits in `src/components/games/*`. |
| `/create` | 4 | Lab bench | tools | UGC make surface (reuse) | preview | helps at tools | |
| `/progress` | 5 | `hubSplit` / Dual | stats | chart (reuse `progress` components, @nivo) | detail | idle | Nivo charts render in DOM as today. |
| `/achievements` | 5 | `hubSplit` | filters | badge grid (reuse) | badge detail | cheer on unlock | `BadgePedestal3D` may return as an in-world detail later. |
| `/mastery` | 5 | Focus | — | path (reuse) | claim | point | |
| `/seasons` | 5 | `hubSplit` | — | season (reuse) | rewards | cheer | |
| `/buddies` | 5 | Dual | friends list (reuse `social`) | — | invite | idle | COPPA-safe copy reviewed. |
| `/profile` | 6 | `avatarStudio` | stats (`SFCircularProgress`) | avatar (reuse profile card) | Sparky companion settings (new) | `panelLip` | `AvatarPreview3D` is a salvage candidate for HoloC. |
| `/settings` | 6 | `settingsDock` | nav | kid prefs (reuse) | — | idle | Security items link out to FLAT. |
| `/settings/{mfa,sessions,linked-accounts,legal}` | FLAT | — | — | — | — | none | |
| `/parent/*` (5 routes) | FLAT | — | — | — | — | none | Palette only. |
| `/admin/*` (3 routes) | FLAT | — | — | — | — | none | Palette only. |
| `/pricing` | FLAT | — | — | — | — | none | Dense comparison table. |
| `/competencies` | 6 | Focus | list | story | — | idle | Contrast re-audited on the reading plate. |
| Legal (8 routes) | FLAT | — | — | — | — | none | |
| `/offline` | plain | — | — | — | — | none | |
| `/dev/*` | BRIDGE | — | — | — | — | — | `/dev/forge-hub` new; `/dev/hero-v3` retired with the hero; `/dev/forge` and `/dev/sparky` kept. |

All 52 `page.tsx` routes on the branch are accounted for.

---

## 6. Sparky pipeline in detail

| Step | Artifact | Owner | Phase |
|---|---|---|---|
| Commit the concept | `public/forge-hub/sparky/LOCKED_SPARKY.png` + `LOCKED.md` with SHA | Owner | P0 |
| Spec v2 | `docs/SPARKY-RIVE-SPEC.md` v2: new geometry section, unchanged `SparkyMachine` + four game inputs, new `pose` and `attention` inputs, 200 and 400 artboards, pose list, timing rules (poses ≤ 1 s, interruptible), no audio in `.riv` | Engineering | P0 |
| SVG fallback | `SparkyCore.tsx` redrawn; expression colours re-picked from the concept; `Sparky.test.tsx` updated | Engineering | P1 |
| Rive asset | `public/rive/sparky.riv` v2 | Artist, external | P1 to P5 |
| Overlay | `SparkyOverlay` with anchors and poses; `/dev/forge-hub` pose panel | Engineering | P2 to P3 |
| Tutor absorption | Whisper mode; `AITutorAvatar` removed; chat engine reused | Engineering | P5 |
| Copy | `forgeSparkVoice.ts` lines reviewed for the new personality; age-band variants A/B/C | Owner + Engineering | P5 |
| Verification | Nine expressions, six poses, hit-test e2e, in-game smoke | Engineering | P5 to P6 |

The game-facing contract does not change, so `sparky.riv` v2 can land any time without touching the 42 games.

---

## 7. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Stage hurts LCP or INP on kid Chromebooks | Medium | DOM panels are SSR'd and are the LCP; stage chunk loads post-LCP on idle; bloom-only post; `autoQuality` step-down; Lighthouse gates made real in P3. |
| Cyan glass fails contrast on real content | High if ignored | Reading plate rule (§2.3) from P2; guard scripts run against the new theme; `/competencies` re-audited. |
| Sparky asset slips | Medium | Games never depend on v2; SVG fallback is the new look from P1; overlay works with the fallback. |
| Morph animations feel like page flashes on route change | Medium | One canvas in the root layout (§2.1); route transitions never unmount panels that persist across modes; measured in `core-flow-smoke`. |
| Two "locked" plates diverge | Low | Reconciled in P0 with SHA manifests; agents forbidden from regenerating world art (PR #164 rule carried over). |
| Retired cockpit code confuses agents and bloats builds | High today | CLAUDE.md v7 in P0; W9 archive PR in P7. |
| Compact shell drifts from the desktop content | Medium | Same content components in both presentations; e2e runs both tiers on every wave. |
| Rollback is theoretical | Low | The compact shell is the rollback and is exercised on every mobile session. |
| Palette reversal upsets the shipped Concept 10 look during the flag-off period | Low | `forge` theme untouched until P7; `forge-hub` theme only under the flag. |

---

## 8. Immediate next actions (first two weeks)

1. Owner answers the three open questions in §0 and confirms or overrides decisions 2 to 8.
2. Commit `LOCKED_HUB`, `LOCKED_SPARKY`, and the PR #164 plate with SHA manifests under `public/forge-hub/`.
3. Write the decision-lock entry and the Concept 10, Rebuild IV, and CLAUDE.md v7 amendments in one PR.
4. Archive the root `docs/Phased-R3F-Hub-Plan.md`; fix paths and vocabulary in the six spec docs.
5. Write `SPARKY-RIVE-SPEC.md` v2 and brief the Rive artist.
6. Open PROGRESS.md "Forge Hub" section at Phase 0.
7. Start P1: `/dev/forge-hub` room shell with plate-plus-parallax, portal reducer ported, SSIM harness in place.
8. Redraw `SparkyCore.tsx` to the concept.
9. Port PR #164's `layouts.ts`, `catalog.ts`, `portalMachine.ts`, tests, and blend tokens; close the PR with a link to this plan.
10. Schedule the P1 owner visual checkpoint.
