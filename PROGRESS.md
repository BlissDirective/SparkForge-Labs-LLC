# SparkForge Build Progress

## Current Phase: Fable Frontend Enhancement — Phases A–C COMPLETE; Phase D started (needs direction)
## Status: 26 games migrated (25 waves + Bias Detective flagship→SORT), HS-5 green 26/26, canonical re-skin done. Phase D plan in docs/UI-Game-Enhancements/Phase-D-Status.md — flagship R3F + asset tracks await authoritative input.
## Last Updated: 2026-06-28

### Phase D — started (2026-06-28)

Assessment + decision plan: `docs/UI-Game-Enhancements/Phase-D-Status.md`.
Key finding: GameShell renders no per-game 3D (cockpit removed in v2), so a
flagship only has R3F if its own file imports one. Only Prompt Lab, Agent
Architect, Context Architect, Pixel Witness (+ Lab 11 TBD) have genuine in-file
R3F; the rest are quiz/levels/sim games.

**Done (safe, in-plan, proven pattern):**
- **Bias Detective (Lab 6 flagship) → SORT** — concept quiz → weigh AI systems
  onto "Shows Bias" / "Fair Design" scales with a fairness-balance meter. Same
  educational cases (Amazon hiring, COMPAS, healthcare proxy, facial
  recognition, audits). Canonical Lab 6 `#FF7050`. tsc/lint/build clean; added
  to the smoke spec.

**Awaiting authoritative input (per Phase-D-Status.md):**
- Migrate the remaining flat flagship games where the archetype is a clean fit
  (vs. design-ambiguous ones like Pocket Brain, whose compression-sim mechanic
  doesn't match the map's REVEAL note).
- Genuine-R3F flagships: additive `useDeviceProfile` 2D fallback (desktop R3F
  kept) — a 3D/structure change (CLAUDE.md approval gate).
- Asset-pipeline tracks (Blender GLB/HS-8, Rive `sparky.riv`, Scenario
  backgrounds, Figma chrome) — blocked on connectors/keys only the owner provides.
- Emoji → icon sweep (Ui-Creation.md) — design-dependent.

### Canonical lab re-skin (2026-06-28) — final pass

All 26 migrated games (25 waves + Sort Toy Box) re-skinned to their canonical
lab accent + lab number, sourced from `gameRegistry.ts` (`lab:`) ×
`labColors.ts` (`hex:`). Lab → hex: 1 #0FB8FA · 2 #B67BFF · 3 #FF70AF ·
4 #D9A430 · 5 #00D17A · 6 #FF7050 · 7 #10BAD2 · 8 #8F96FA · 9 #E68E28 ·
10 #DE5AEA.

A deterministic script touched only three things per file — the `LAB_COLOR`
const, the GameShell `color` literal (when not already `{LAB_COLOR}`), and the
GameShell `labNum` — so semantic colors (success-green, the `#FF6B35` challenge
callout) were preserved. This also corrected pre-existing GameShell mismatches
where the hardcoded labNum/color disagreed with the registry: AI or Not 1→10,
Emoji Decoder 1→8, My First AI App 1→9, Data Shield 5→6, Real or Fake 5→6,
Token Chopper 8→4, Pixel Investigator 7→3, Prediction Market 10→7,
Human vs Machine 2→1.

**Validation:** `tsc` 0 src errors · `npm run build` EXIT=0 (143 static pages).

### HS-5 — Playwright visual checkpoint (2026-06-28)

A real demo-login E2E needs Supabase creds (HS-1, user-only), so per
Fable-Frontend-Enhancement.md §2.3 the harness mounts each game via an auth-free
dev preview route and asserts the archetype canvas renders without runtime
errors.

**Artifacts (committed):**
- `src/app/dev/game-preview/[slug]/` — auth-free single-game mount (reuses
  `GAME_LOADERS`; reachable on every env like the other `/dev/*` routes, noindex).
- `tests/e2e/game-migration-smoke.spec.ts` — drives level map → welcome → play
  for all 26 games (25 migrated + Sort Toy Box), asserts a `<canvas>` with real
  dimensions mounts and zero `pageerror`s. Runs against a production build
  (`PW_EXECUTABLE_PATH`/`/opt/pw-browsers/chromium`).

**Two production bugs the harness caught and fixed:**
1. **Pixi CSP/eval** (`fix(pixi)` 9811197) — Pixi v8 generates shaders with
   `eval`, blocked by the prod CSP, so *every* Pixi game failed to render canvas
   in production. Fixed by importing `pixi.js/unsafe-eval` (no-eval polyfills) in
   `primitives.ts`.
2. **Loader export mismatch** (`fix(arcade)` f876d33) — ~20 loader entries used
   `def(m, 'XGame')` (named) while the game files are `export default`, yielding
   `{ default: undefined }` → React #306 → GameErrorBoundary. Fixed `def()` to
   fall back to the default export.

**Verification — FULL SWEEP PASSED ✅ (2026-06-28):** all **26/26 games** mount
their archetype canvas with zero runtime `pageerror`s, against a production
build, run as 3 resilient batches (9 + 9 + 8) of <1 min each:
- Batch 1 → 9 passed: sort-toy-box, ai-spy, neuron-relay, ai-or-not,
  data-shield, real-or-fake, word-predictor, token-chopper, ai-art-detective.
- Batch 2 → 9 passed: camera-quest, fool-the-ai, build-classifier,
  prediction-market, sentiment-scanner, emoji-decoder, chatbot-builder,
  lost-in-translation, time-machine.
- Batch 3 → 8 passed: human-vs-machine, pixel-investigator, tool-picker,
  code-blocks, career-explorer, my-first-ai-app, future-forge, treat-trainer.

Covers all five render types (SORT · REVEAL · CONNECT · REACT · Phaser); 26
screenshots captured. Sandbox containers recycle every few minutes, so the
sweep is batched here; in CI it runs as one job via the playwright.config
`webServer`. Re-run: `npx playwright test game-migration-smoke --project=chromium`.

### Game Migration — Wave 7: Treat Trainer (Phaser-4 maze) (2026-06-28)

The single Phaser case in the map. Added `phaser@^4.2.0`.

- `src/components/games/phaser/mazeGame.ts` — self-contained maze factory.
  Uses `import type * as PhaserNS from 'phaser'` (erased at build) and receives
  the Phaser namespace at runtime, so Phaser never enters the SSR/server bundle.
  Recursive-backtracker perfect maze, wall-collision movement, BFS shortest-path
  (for the "Plan path" hint + greedy nearest-treat scoring baseline).
- `src/components/games/phaser/PhaserMazeStage.tsx` — React wrapper, dynamic
  `{ssr:false}`. Creates/destroys the `Phaser.Game` per level, publishes scene
  state to `window.__SPARKFORGE_GAME__`, and provides a DOM d-pad + "Plan path"
  button so keyboard/AT players use the same controls as the canvas.
- `TreatTrainerGame.tsx` — rewritten from the 4-slider pet sim into 10 maze
  levels (grid + treat count grow with level). Teaches pathfinding/search.

**Validation:** `tsc` 0 src errors · `next lint` clean · `npm run build` EXIT=0
(143 static pages; arcade routes compiled with the new Phaser chunk lazy-loaded
behind the game loader). Runtime visual verification deferred to HS-5.

---
**Migration tally:** SORT ×12 · REVEAL ×5 · CONNECT ×7 · REACT ×2 · Phaser ×1 =
**25 games** + 5 reusable stage wrappers (PixiSortStage, PixiBinSortStage,
PixiRevealStage, PixiConnectStage, PixiReactStage) + PhaserMazeStage.



### Game Migration — Waves 4–6 (2026-06-28)

Per `Game-Migration-Map.md` §5 rollout steps 4–6. 16 games migrated in one push
(15 templatable games via parallel subagents using the established reference
files + wrappers; Build Classifier rebuilt by the main agent). No new wrappers
or scene code were needed — every game reuses the Wave-1–3 archetype library.

**Wave 4 — Lab 7 (Vision):**
| Archetype | Game | Mechanic |
|-----------|------|----------|
| REVEAL | Camera Quest | scan a scene, capture the target-class objects |
| SORT | Fool the AI | Fools-the-AI / AI-still-sees-it + confidence meter |
| SORT | Build Classifier | drag labelled examples into per-level class bins + accuracy meter (clean rebuild of the 836-line pipeline) |
| SORT | Prediction Market | Likely / Uncertain / Unlikely |

**Wave 5 — Lab 8 (Language):**
| Archetype | Game | Mechanic |
|-----------|------|----------|
| SORT | Sentiment Scanner | Happy / Sad / Angry / Neutral |
| SORT | Emoji Decoder | emoji text-names → Positive / Negative / Action / Object (no glyphs) |
| CONNECT | Chatbot Builder | wire Input → Intent → Response → Reply |
| CONNECT | Lost in Translation | wire a faithful translation relay |

**Wave 6 — Labs 1/2/5/7/9/10 remainders:**
| Archetype | Game | Mechanic |
|-----------|------|----------|
| SORT | Time Machine | Early / Recent / Today era bins |
| SORT | Human vs Machine | Humans win / Machines win |
| REVEAL | Pixel Investigator | inspect CV scene, confirm detected features |
| SORT | Tool Picker | Vision / Language / Prediction / Recommendation |
| CONNECT | Code Blocks | wire program blocks in execution order |
| CONNECT | Career Explorer | bipartite skill ↔ career matching |
| CONNECT | My First AI App | wire Input → AI Service → Output |
| CONNECT | Future Forge | wire invention-module blueprint chains |

**Validation:** `tsc` 0 src errors across all 16 · `next lint` clean on all 16
(incl. the no-emoji guard for Emoji Decoder) · `npm run build` EXIT=0 (143
static pages). All keep GameShell/GameLevelSystem/lazy-loader/Zustand, fire
GameJuiceEngine via useJuice, ship keyboard/AT fallbacks, publish scene state to
window.__SPARKFORGE_GAME__. Existing per-game accents retained (canonical re-skin
queued as a final pass).

### Discrepancies Log (Waves 4–6)

| Issue | Fix | Status |
|---|---|---|
| Build Classifier was an 836-line custom Collect→Train→Test game using useGame()/gameId | Clean SORT rebuild on GameLevelSystem + useGameActions + PixiBinSortStage with per-level class sets + accuracy meter | ✅ |
| Emoji Decoder is inherently emoji-themed but a no-emoji guard exists | Chips show emoji TEXT-NAMES (e.g. "crying face"), not glyphs; lint passes | ✅ |
| Several games' registry lab differs from their GameShell labNum/color | Left GameShell as-is; canonical re-skin is the final queued pass | noted |



### Game Migration — Wave 3: Lab 4 (AI That Creates) quiz sweep (2026-06-28)

Per `Game-Migration-Map.md` §5 rollout step 3. Three Lab-4 quiz games migrated.

| Archetype | Proof game | Mechanic before → after | Files |
|-----------|-----------|--------------------------|-------|
| **REACT** | Word Predictor | Next-word MCQ → candidate words rise as cards with probability bars; tap the likeliest before it fades | `WordPredictorGame.tsx` (extends `ReactionArena`) |
| **SORT** | Token Chopper | Tokenization quiz → sort chopped pieces into Word / Subword / Punct / Special bins | `TokenChopperGame.tsx` (reuses `PixiBinSortStage`) |
| **SORT** | AI Art Detective | AI-vs-human-art quiz → drag each tell into Human-made / AI-made; why-card reveals the artifact | `AiArtDetectiveGame.tsx` (reuses `PixiBinSortStage`) |

**Shared-scene enhancement (backward compatible):**
- `scenes/ReactionArena.tsx` — opt-in labeled "card" mode via `makeTarget()`:
  targets render as word cards with a probability bar; `onHit` now reports
  whether the tapped card was the correct choice. Generic circle mode (AI or
  Not) unchanged. `PixiReactStage` threads `makeTarget` + a11y `choices`.

**Validation:** `tsc` 0 src errors · `next lint` clean on all 6 changed files ·
`npm run build` EXIT=0 (143 static pages; only a pre-existing unrelated warning).

### Discrepancies Log (Game Migration Wave 3)

| Issue | Fix | Status |
|---|---|---|
| Generic ReactionArena (tap-any) could not express "tap the LIKELIEST word" | Added opt-in labeled card mode (`makeTarget` + `onHit(correct)`); generic mode untouched | ✅ |
| Token Chopper map note also says "keep CONNECT bonus round" | Focused this proof on token-type SORT; the pipeline-ordering idea is deferred to a CONNECT follow-up (noted in file header) | noted |
| Token Chopper / AI Art Detective registry labs differ from GameShell `labNum` | Left GameShell as-is (lab/color reassignment needs sign-off) | noted |



### Game Migration — Wave 2: Lab 6 (Ethics) quiz sweep (2026-06-28)

Per `Game-Migration-Map.md` §5 rollout step 2. Two Lab-6 quiz games migrated.

| Archetype | Proof game | Mechanic before → after | Files |
|-----------|-----------|--------------------------|-------|
| **SORT** | Data Shield | Privacy quiz → drag data items into Private / Sensitive / Shareable bins; shield-strength meter rises on correct calls | `DataShieldGame.tsx`, new `pixi/PixiBinSortStage.tsx` |
| **REVEAL** | Real or Fake? | Media-literacy quiz → inspect snippets; tap the fakes to reveal verdict + the tell | `RealOrFakeGame.tsx` (reuses `pixi/PixiRevealStage.tsx`) |

**Shared-scene enhancements (backward compatible):**
- `scenes/SortDragScene.tsx` — `binLabels` prop (named bins instead of "Group N").
- `ChipToken.tsx` — multi-word labels now word-wrap + shrink (named items, not
  just short codes).
- New generic `PixiBinSortStage` (arbitrary items + named bins) — the SORT
  wrapper for the rollout (PixiSortStage stays Sort-Toy-Box-specific).

**Validation:** `tsc` 0 src errors · `next lint` clean on all 5 changed files ·
`npm run build` EXIT=0 (143 static pages; only a pre-existing unrelated warning).

### Discrepancies Log (Game Migration Wave 2)

| Issue | Fix | Status |
|---|---|---|
| `SortDragScene` bins were hardcoded "Group N" — wrong for named privacy bins | Added opt-in `binLabels`; default keeps "Group N" | ✅ |
| `ChipToken` rendered one short line — named data items would overflow | Word-wrap + size-down for multi-word/long labels | ✅ |
| Data Shield / Real or Fake registry lab is 6 but GameShell uses `labNum={5}`/green | Left GameShell as-is (lab/color reassignment needs sign-off; out of scope) | noted |



### Game Migration — Wave 1: prove the remaining 3 archetypes (2026-06-28)

Per `docs/UI-Game-Enhancements/Game-Migration-Map.md` §5 rollout order. Phase C
shipped the 4 Pixi archetypes; Sort Toy Box (SORT) was the only runtime-proven
game. Wave 1 proves the other three archetypes on one standard game each.

| Archetype | Proof game | Lab | Mechanic before → after | Files |
|-----------|-----------|-----|--------------------------|-------|
| **REVEAL** | AI Spy | 1 | QuizLevelRenderer tap-quiz → AI-hunt grid: tap objects you think use AI; AI ones fire a signal pulse + why-card | `AiSpyGame.tsx`, new `pixi/PixiRevealStage.tsx` |
| **CONNECT** | Neuron Relay | 3 | Four-slider simulation → wire the signal path input→hidden→output; correct wires green, dead-ends red | `NeuronRelayGame.tsx`, new `pixi/PixiConnectStage.tsx` |
| **REACT** | AI or Not? | 10/1 | Multiple-choice quiz → timed detection drill: tap AI "tells" before they vanish, build a streak | `AiOrNotGame.tsx`, new `pixi/PixiReactStage.tsx` |

**Shared-scene enhancements (backward compatible):**
- `scenes/RevealMapScene.tsx` — `showLabelsCovered` prop (hunt mode shows object
  names on covered tiles; what's hidden is the AI verdict, not the object).
- `scenes/ConnectBoardScene.tsx` — `edgeColors` prop (per-edge color override so
  games paint correct wires green and wrong ones red).

**Per-game DoD status:** archetype wired ✅ · lab skin applied (existing per-game
accent retained — canonical-color re-skin deferred to avoid an unapproved visual
change) ✅ · juice firing via `useJuice().onCorrect/onWrong` ✅ · keyboard/AT
fallback present in every wrapper ✅ · `window.__SPARKFORGE_GAME__` scene state
published via `PixiGameStage` inspector ✅ · `npm run build` green ✅ · Playwright
SSIM ≥ 0.96 visual pass — **pending** (games sit behind dashboard auth; HS-5
checkpoint).

**Validation:** `tsc --noEmit` 0 src errors · `next lint` clean on all 8 changed
files · `npm run build` EXIT=0 (only pre-existing unused-var warnings in
unrelated files).

### Discrepancies Log (Game Migration Wave 1)

| Issue | Fix | Status |
|---|---|---|
| `RevealMapScene` showed `?` on covered tiles — wrong for a hunt where the object must be visible | Added opt-in `showLabelsCovered` with word-wrapped labels; default false keeps classic memory behavior | ✅ |
| `ConnectBoardScene` drew every edge green, so wrong wires looked correct | Added opt-in `edgeColors` map keyed by sorted `a-b` pair | ✅ |
| `AiOrNot` registry lab is 10 but the game's GameShell uses `labNum={1}`/blue | Left GameShell as-is (lab reassignment is an unapproved visual change; out of Wave 1 scope) | noted |

---

## Prior Phase: SparkForge Branding 3D — Phase 5 COMPLETE pending HS-9 sign-off
## Status: AWAITING HS-9 USER VERIFICATION — all 7 sub-commits of Phase 5c shipped; HeroAnimation.tsx now runs v3 wholesale on the live homepage
## Last Updated: 2026-04-29

### Phase 5c proper — COMPLETE (2026-04-29)

| # | Sub-piece | Commit | Notes |
|---|---|---|---|
| 5c.1 | Beats 5+6 components | `038d9cb` | Beat5WordmarkCascade (per-letter pop), Beat6DichroicBloom (synchronized bloom + Q5 lensflare 2.0 peak) |
| 5c.2 | Beat 7 component | `a51103d` | Beat7CockpitMaterialization (wordmark drift + lensflare fade + signalCockpit hook) |
| 5c.3 | Beat 8 component | `cd79537` | Beat8AtomicHandoff (shatter-into-UI; 17 UI anchors; per-anchor flashes; onHandoffComplete callback) |
| 5c.4 | Audio remap | `c4a230f` | heroAudio.ts:syncToProgress 13 trigger-time edits + 19.5 s base + Beat 5 cascade chimes + Beat 8 arrival ticks |
| 5c.5 | Scrubber expansion | `2a7b5eb` | /dev/hero-v3 covers full 19.5 s with all 8 beats |
| 5c.6 | HeroAnimation.tsx v3 | `88e0096` | Wholesale replacement — v2 phase content removed, v3 beats mounted; live homepage hero now runs v3 |
| 5c.7 | HS-9 verification doc | (this commit) | docs/hero-v3/HS-9-Verification.md — 7-section checklist for user sign-off |

### HS-9 hard stop — AWAITING USER VERIFICATION

The HeroAnimation v3 is wired into the live homepage (`/`). User must walk through `docs/hero-v3/HS-9-Verification.md` (7 sections, ~50 checkpoints):

1. **Hero v3 plays end-to-end** (11 checks across 8 beats)
2. **CPA v2 single-canvas verification** — same `<canvas>` DOM node 0 → 19.5 s; no swap; cockpit takes over inside the same canvas
3. **Skip / fast-forward / accessibility** — Escape / Enter / Space / prefers-reduced-motion / Settings toggle
4. **Audio synchronization** — all 8 beats' cues fire at correct timestamps
5. **Performance budget** — ≤ 18 ms/frame on WebGPU desktop-ultra
6. **Mobile / non-WebGPU fallback** — MP4-poster path serves correctly
7. **Theatre.js studio** (Q8) — overlay mounts on every environment

### Branch state

- All Phase 5 commits pushed to `claude/sparkforge-phase-five-CSSzU`
- Build clean: `npm run build` → ✅ EXIT=0
- Working tree clean
- Ready for HS-9 sign-off → squash-merge into `setup-SparkForge-dev`

**Runtime override (2026-04-29):** Hero total runtime extended **19.0 s → 19.5 s** (Beat 8 0.5 → 1.0 s) for shatter-into-UI breathing room. 4× FF window 4.75 → 4.875 s. N4 lock revised. All downstream docs (storyboard v1.2, action plan §16.3 + N4 row, audio remap §11) updated.

### Phase 5b proper — COMPLETE (2026-04-29)

| # | Sub-piece | Commit | File(s) |
|---|---|---|---|
| 5b.1 | Theatre.js project + Hero v3 sheet | `c134288` | `src/lib/hero/heroTheatreProject.ts` (singleton + 4 typed Sheet Objects + ensureHeroStudio() auto-mount per Q8) |
| 5b.2 | Voronoi shard set component | `aafce73` | `src/components/3d/branding/SfShardSet.tsx` (forwardRef + imperative handle for parent-driven physics) + dev showcase wiring |
| 5b.3a | Beats 1+2 components | `3bedf32` | `src/components/3d/hero/v3/Beat1VoidAwakening.tsx` + `Beat2IgnitionSpark.tsx` |
| 5b.3b | Beats 3+4 components | `213ee92` | `Beat3SCrystallization.tsx` + `Beat4FMirrorAndShardBurst.tsx` + `SfMark3D.tsx` revealMask prop |
| 5b.4 | `/dev/hero-v3` standalone scrubber | (this commit) | `src/app/dev/hero-v3/{page.tsx,client.tsx}` |

### Action plan deviation (intentional)

Action plan §10 5b.4 calls for `process.env.NEXT_PUBLIC_HERO_V3_BEATS_1_4` env-var feature flag to wire v3 beats into the live `HeroAnimation.tsx`. Replaced with a **standalone `/dev/hero-v3` route** per user no-gating mandate — no env flag, live homepage hero stays on v2 until Phase 5c integrates all 8 beats wholesale.

### Build status

- `npm run build` → ✅ EXIT=0
- `/dev/hero-v3` → 39.6 kB / 726 kB First Load JS (+33 kB delta from `@theatre/studio` + 4 beat components + heroTheatreProject)
- `/dev/branding` → 3.57 kB / 693 kB (unchanged from 5b prep)

### Phase 5b prep — COMPLETE (2026-04-29)

| Sub-piece | File | Notes |
|---|---|---|
| Custom TSL lensflare shader | `src/components/3d/branding/LensflareTSL.tsx` | Two-mesh billboard architecture per flare instance: hot-core square plane (radial falloff + center white-shift) + anamorphic streak plane (horizontal gradient, anamorphic vertical narrowing, chromatic tip-tinting). Uses `MeshBasicNodeMaterial` + `AdditiveBlending` + `depthWrite=false` + `toneMapped=false` (standard additive lens-flare pattern). Reads from `SF_BRAND.LENS_FLARES` config (Phase 1). Live-tunable `intensityMul`, `coreScale`, `streakScale` props for Phase 5b/c animation. Per-instance materials with `useMemo` + dispose-on-unmount (TSL node materials hold GPU pipelines per instance — sharing breaks uniform isolation). |
| Dev showcase wiring | `src/app/dev/branding/client.tsx` | New "Lensflare TSL (Phase 5b prep)" subject; mounts both flares (amber index 0, cyan index 1) plus the SF mark behind for scale; 3 new sliders (Flare intensity ×, Core scale, Streak scale); camera distance 6.4 to match SF mark scale. |

### Build verification

- `npm run build` → ✅ EXIT=0, compiled in 17.2s. `/dev/branding` 3.57 kB / 693 kB First Load JS (was 2.31 / 692 — +1.3 kB for LensflareTSL).

### Notes

- Theatre.js studio auto-mount (Q8) deferred to Phase 5b proper — there's no Theatre sheet to expose yet (lensflare is a standalone tunable component, not a beat).
- Per Beat 6 user pick Q5, the flare's `intensityMul` slider in dev showcase tops at 2.4 (gives headroom above Beat 6's 2.0 peak).

### Phase 5a Sign-Off (recorded 2026-04-29)

| # | Pick | Note |
|---|---|---|
| Q1 Beat boundaries | Yes | N4 19.0-s lock preserved |
| Q2 Camera | Diagonal | Beat 2 parallax dolly retained |
| Q3 Cascade order | Left-to-right | Sequential reveal retained |
| Q4 Detonation | Outward+up bias | Proven Beat 4 physics retained |
| Q5 Lensflare peak | **2.0** | Beat 6 `intensityMul` updated |
| Q6 Handoff | **Shatter-into-UI** | Beat 8 fully rewritten — ~80 shards target-assigned to cockpit UI anchors |
| Q7 Audio remap | Approve | 12 trigger-time edits in `heroAudio.ts:syncToProgress` authorized |
| Q8 Theatre.js | **Auto-mount everywhere** | `@theatre/studio` adds ~500 KB to bundle on every environment |
| Q9 SSIM halt | **(b) motion-frame averages** | Doubles `compare-ssim.ts` cost; more robust to motion drift |
| Q10 Mobile | **Trimmed 5–8 s Sora/Veo video** | Phase 7 scope ~doubled; mobile-hero deliverable added |

**Branch:** `claude/sparkforge-phase-five-CSSzU` (squash-merges into `setup-SparkForge-dev` on phase completion)

---

## SparkForge Branding 3D — Phase 5a (Hero v3 Storyboard) — April 29, 2026

**Branch:** `claude/sparkforge-phase-five-CSSzU` · **Output:** `docs/hero-v3/Storyboard.md` (350 lines, 14 sections)

### Phase 5a — COMPLETE pending user sign-off (2026-04-29)

| Sub-piece | File | Notes |
|---|---|---|
| Storyboard document | `docs/hero-v3/Storyboard.md` | 14-section markdown deliverable. Full v2 audit (camera paths, store transitions, audio cues for all 8 phases of `HeroAnimation.tsx`); v3 beat sheet (8 beats × 19s with camera paths, lookAt, subjects, material animation, audio cues, performance budgets, out-triggers, Theatre.js sequence labels); audio cue remap (12 trigger-time edits in `heroAudio.ts:syncToProgress`, all v2 nodes reused, no new audio assets); cockpit handoff contract (CPA v2 single-canvas, store state machine, HS-9 verification protocol, skip/fast-forward semantics preserved verbatim from v2); 10 open questions for user sign-off (§13). |

### Audit findings (v2 → v3)

- v2 `HeroAnimation.tsx` is 700 lines with 8-phase GSAP timeline (`void`/`assembly`/`showcase`/`surge`/`shatter`/`regroup`/`materialize`/`online`) — fully captured in §1 audit table.
- v2 `useAtomicHeroToCockpit.ts` referenced by the action plan does **NOT exist** — the atomic handoff is implemented via `useHeroAnimation.ts` + `cockpitStore.setHeroPhase/setCockpitReady` + GSAP `onComplete`. Storyboard §12 documents the actual contract.
- v2 audio (`heroAudio.ts`, 807 lines) is comprehensive and reusable — v3 needs only ~12 trigger-time edits in `syncToProgress`, no new Tone.js nodes.

### Build verification

- `npm run build` → ✅ EXIT=0 (no code changes; only docs added).

### Open items (gated on user)

- §13 Q1–Q10 — 10 sign-off questions. Recommended defaults provided. User picks: "go with defaults on all" / specific per-question changes / restructure / halt.
- Phase 5b prep (custom TSL anamorphic lensflare shader at `src/components/3d/branding/LensflareTSL.tsx`) does **not** start until §13 is answered.

---

## SparkForge Branding 3D — Phase 4 (Offline Render Pipeline) — April 29, 2026

**Branch:** `claude/sparkforge-phase-five-CSSzU` (Phase 4 was bundled into the Phase 3 commit `c308724`)

### Phase 4 — COMPLETE (2026-04-29)

| Sub-piece | File | Notes |
|---|---|---|
| Render script | `scripts/render-branding.ts` | Headless Puppeteer + ffmpeg-static. Boots Next.js dev server, navigates to `/dev/branding/render`, waits on `window.__brandingReady`, screenshots to PNG / encodes loop to MP4. Outputs to `public/branding/`. |
| Render-only route | `src/app/dev/branding/render/{page.tsx,client.tsx}` | UI-chrome-free `/dev/branding/render?subject=sf\|sparkforge\|loop&t=<sec>`. Sets `window.__brandingReady = true` after first frame compiles. |
| 4K SF mark | `public/branding/sf-hero.png` | Transparent 4096×4096 PNG, italic 3.4° canonical pose. Used by `<BrandWordmark>` (Phase 6) and as anchor frame for video-hero alternative. |
| 4K wordmark | `public/branding/sparkforge-hero.png` | Transparent 4096×1024 PNG, italic 3.4° canonical pose. |
| MP4 fallback | `public/branding/brand-fallback.mp4` | SF mark slow-rotate ±0.2 rad over 2 s loop, 1920×1920, H.264 yuv420p. Wired into `BrandingShowcase.tsx` `fallbackVideoSrc` for non-WebGPU devices. |

### Build verification

- `npm run build` → ✅ EXIT=0 (passed at PR #137 merge).
- `npm run dev` → ✅ `/dev/branding/render` returns 200 OK; `window.__brandingReady` fires after shaders compile.

### Notes

- Phase 4 was shipped in the same commit as Phase 3 (`c308724`) because the offline render pipeline depends on the wordmark geometry being committed first.
- All `/dev/*` routes are public on every environment per the user's no-gating mandate (see "Gating Removal" entry below).

---

## Gating Removal — April 29, 2026

**Scope:** Per user mandate, all dev/prod/Vercel environment gating has been removed from code and documentation. `/dev/*` routes are public on every environment (local, preview, production).

| File | Change |
|---|---|
| `src/middleware.ts` | `classify()` no longer checks `NODE_ENV` or `NEXT_PUBLIC_ALLOW_DEV_ROUTES`. `/dev/*` is unconditionally a public page. |
| `src/app/dev/branding/page.tsx` | Removed `notFound()` + env-var check. |
| `src/app/dev/branding/render/page.tsx` | Removed `notFound()` + env-var check. |
| `.env.example` | Removed `NEXT_PUBLIC_ALLOW_DEV_ROUTES` documentation block. |
| `BRAND_HERO_ACTION_PLAN.md` | Stripped all gating language; updated branch references from `claude/sparkforge-branding-3d-I4Za1` → `claude/sparkforge-phase-five-CSSzU`; Theatre.js studio guidance no longer NODE_ENV-gated. |

---

## SparkForge Branding 3D — Phase 3 (SparkForge Wordmark) — April 29, 2026

**Branch:** `claude/sparkforge-phase-five-CSSzU` · **Commit:** `c308724` (PR #137)

### Phase 3 — COMPLETE (2026-04-29)

| Sub-piece | File | Notes |
|---|---|---|
| Wordmark vector | `public/branding/sparkforge-geometry.svg` | 10-glyph wordmark (S p a r k F o r g e). viewBox 6400×800, cap-height 650u, baseline 720u, stroke 130u. S/F glyphs are mechanical x-translations of `sf-geometry.svg` (preserves Phase-2 single-source-of-truth). evenodd fill-rule; reversed inner counters as holes. Path IDs preserved for Phase-5b per-letter animation targeting. |
| Shared mesh helper | `src/components/3d/branding/_shared.tsx` | Extracted `BrandingPart` — one extruded letter mesh with per-instance `BrandingMaterial` and visibility prop for `revealMask` without remount. |
| Wordmark component | `src/components/3d/branding/SparkForgeWordmark3D.tsx` | `useLoader(SVGLoader)` → `createShapes` → `ExtrudeGeometry` per `<path>`. `LETTER_ORDER` maps revealMask indices to path IDs. Italic lean via group rotation (preserves dispersion fresnel). Auto-recenter via `Box3` measurement after mount. |
| SF mark refactor | `src/components/3d/branding/SfMark3D.tsx` | Refactored to use `BrandingPart` from `_shared.tsx`. |
| Dev showcase upgrade | `src/app/dev/branding/client.tsx` | SparkForge wordmark is the new default subject; letter-reveal slider (0..10); camera distance bumped to 10.0 for the wider scene. |

### Build verification

- `npm run build` → ✅ EXIT=0; `/dev/branding` route 457 kB / 691 kB First Load JS.
- `npm run dev` → ✅ Ready in 4.1s, no boot errors.

---

## SparkForge Branding 3D — Phase 2 (SF Mark Geometry) — April 28, 2026

**Branch:** `claude/sparkforge-phase-five-CSSzU` (originally authored on a feature branch, now squash-merged into `setup-SparkForge-dev`)

### Phase 2 — COMPLETE (2026-04-28)

| Sub-piece | File | Notes |
|---|---|---|
| SF mark vector | `public/branding/sf-geometry.svg` | Single-source hand-trace from IMG_4607. Two paths (`sf-mark-S`, `sf-mark-F`); clockwise outline winding; viewBox 1400×800; chamfered terminals. Editable in Illustrator/Figma — keep path IDs to preserve animation hooks. |
| SF mark 3D | `src/components/3d/branding/SfMark3D.tsx` | SVGLoader → `SVGLoader.createShapes` → `ExtrudeGeometry` per shape, with bevel/depth from `GEOMETRY` config (depth 32% of cap-height, bevel 7.2% of cap-height, 12 bevel segments, 24 curve segments). Each path mounts as a separate mesh with its own `BrandingMaterial` instance (Phase 5b animates S and F independently). Italic forward-lean (default 0.06 rad ≈ 3.4°) applied at component-level rotation, NOT skew (skew breaks the dispersion fresnel). |
| Dev showcase upgrade | `src/app/dev/branding/client.tsx` | New default subject "SF mark (Phase 2)"; live-tuning sliders for `dispersionMultiplier`, `dichroicIntensity`, `italicLean`. |

### Build verification

- `npm run build` → ✅ **Compiled successfully in 2.0min** (EXIT=0; longer than Phase 1 due to fresh webpack cache rebuild after dep installs).
- `npm run dev` → ✅ `/dev/branding` returns 200 OK. SVG asset (`/branding/sf-geometry.svg`) serves. No runtime errors.
- TS check on Phase 2 files only → ✅ zero errors.

### Halt rule note (Mythos / SSIM ≥ 0.96)

Phase 2's SF mark is a **clean geometric approximation** of IMG_4607's letterforms, not a pixel-perfect trace. The SVG is the single source of truth and is human-editable: if visual diff vs IMG_4607 falls below the 0.96 halt threshold, the user can replace the two `<path d="...">` strings with Illustrator/Figma traces and refresh — no code change needed (path IDs are preserved).

### Open items (rolled to Phase 3)

1. **Visual checkpoint** — User to verify `/dev/branding` (subject = "SF mark") against IMG_4607. If geometry is off, edit SVG; if dispersion/dichroic is off, tune sliders → record values → I'll bake them into `sf-material.config.ts` for Phase 3.
2. **Lensflare** — locked at `c` (custom TSL shader). Built as Phase 5b prep, not Phase 2.
3. **Mobile review path** — env-var override pending user clarification (this turn).

---

## SparkForge Branding 3D — Phase 1 (Material Config + BrandingMaterial) — April 28, 2026

**Branch:** `claude/sparkforge-phase-five-CSSzU` · **Scope:** 7-phase build to extract IMG_4607 (`public/branding/IMG_4607.png`) brand DNA into a single shader + geometry pipeline; replace existing wordmark + hero animation with WebGPU+TSL-rendered SparkForge wordmark; ship offline 4K renders + experimental Sora 2 / Veo 3 prompt pack.

### Locked decisions (chat history)

| ID | Pick | Notes |
|---|---|---|
| D1 | A | Hand-trace SF + custom-design `parkorge` glyphs in same idiom |
| D2 | A | Headless Puppeteer + sharp |
| D3 | B | WebGPU + TSL primary, fallback per N2 |
| D4 | C | Full re-choreograph of all 8 hero phases |
| D5 | order ok | 1→7 phase plan |
| N1 | a | Live R3F+TSL hero with volumetric god-rays + Voronoi shard upgrades |
| N2 | c | WebGPU+TSL primary; thin MP4-poster fallback for non-WebGPU (no shader fork) |
| N3 | a+b+c | three-bvh-csg + Theatre.js (dev) + lensflare (lensflare-effect 404 — awaiting user pick a/b/c) |
| N4 | 19 s w/ 4× FF | Hero timing locked |
| N5 | b | SSIM ≥ 0.96 halt threshold per Mythos rule |
| E1 | yes | Anisotropic prismatic dispersion in TSL |
| E2 | yes | Procedural palette-locked HDRI |
| E3 | yes | WebGPU compute Voronoi pre-fracture |

### Phase 1 — COMPLETE (2026-04-28)

| Sub-piece | File | Notes |
|---|---|---|
| Deps installed | `package.json` | three-bvh-csg@0.0.18, @theatre/core@0.7.2, @theatre/studio@0.7.2 (-D) |
| Quality mandate | `CLAUDE.md` | New "Tech Quality Mandate" section (v6.6); removed all WebGPU/WebGL2/CSS fallback-chain mentions; HS-9 visual checklist updated |
| Material config | `src/lib/branding/sf-material.config.ts` | Single source of truth — eye-extracted IMG_4607 params (palette, IOR, transmission, anisotropic dispersion, dichroic film, geometry, lighting rig, lens flares, procedural HDRI seed, halt threshold) |
| BrandingMaterial | `src/components/3d/branding/BrandingMaterial.tsx` | TSL `MeshPhysicalNodeMaterial` + custom dichroic emissive `Fn` node (per-channel asymmetric color split, Fresnel-boosted, world-space band sweep, warm-bias asymmetry). Exports `createBrandingMaterial()` + `<BrandingMesh>`. |
| BrandingShowcase | `src/components/3d/branding/BrandingShowcase.tsx` | Canvas wrapper. WebGPU capability gate. Async `WebGPURenderer` init via R3F's async `gl` factory. Procedural HDRI via drei `<Environment frames={1}>` with palette-locked `<Lightformer>` rig (E2). Three-light rig (key/rim/fill). MP4-poster fallback for non-WebGPU devices (uses IMG_4607 poster until Phase 4 ships the loop). |
| Dev showcase route | `src/app/dev/branding/page.tsx` + `client.tsx` | `/dev/branding` — 4 placeholder geometries (cube/sphere/torus knot/icosahedron), reference toggle, orbit toggle. `notFound()` in production. |
| Middleware bypass | `src/middleware.ts` | `/dev/*` routes are public **only** in non-production (`NODE_ENV !== 'production'`). |

### Discrepancies Log (Phase 1 auto-fixes — CLAUDE.md §3.1)

| File | Issue | Fix |
|---|---|---|
| `src/app/(dashboard)/layout.tsx` | Pre-existing TS error: `useCockpitBroadcast` referenced without import. Found at `@/stores/cockpitBroadcastStore` (already exists; layout was the missing piece). | Added named import. |
| `src/stores/cockpitStore.ts` | Pre-existing TS1117: `_spatialViewTimeout` / `_focusLabTimeout` / `_openConsoleTimeout` / `_returnToOverviewTimeout` declared twice (merge artifact). | Removed second declaration (the one after the R1 UI-routing slice block). |
| `src/components/3d/branding/BrandingShowcase.tsx` | ESLint `no-restricted-imports`: namespace import from `three/webgpu` blocked. | Switched to named import `{ WebGPURenderer }`. |

### Build verification

- `npm run build` → ✅ **Compiled successfully in 27.3s** (EXIT=0). Warnings only (all pre-existing in non-Phase-1 files).
- `npm run dev` → ✅ Ready in 4.8s; `/dev/branding` returns 200 OK (compile time 2.4s).
- TS check on Phase 1 files only → ✅ zero errors.

### Open items (rolled to Phase 2)

1. **Lensflare resolution** — `@react-three/lensflare-effect` does not exist on npm. User to pick `a` (drei `<Lensflare>`), `b` (postprocessing `LensFlareEffect`), or `c` (custom TSL shader). Not blocking — first surfaces in Phase 5b.
2. **Visual checkpoint** — User to verify `/dev/branding` renders the dichroic-coated geometries against IMG_4607 reference. SSIM convergence is informal at this stage (no real letter geometry yet); the precise SSIM ≥ 0.96 gate runs at Phase 2 (SF mark) and Phase 3 (full wordmark).

---

## Phase 5 First 10 Enhancements — April 22, 2026

**Branch:** `claude/phase-5-auth-enhancements-S5N0E` · **Scope:** 10 tier-locked enhancements selected in Final-Audit_04-15-2026.md §"Phase 5 First 10".

### Task 1 — §10.11 OffscreenCanvas Worker Rendering (Ultra) — ✅ COMPLETE

Shipped 7 sub-pieces across 5 commits. All infrastructure live under `src/lib/3d/offscreen/` + `src/workers/renderWorker.ts`. Opt-in behind `NEXT_PUBLIC_FF_OFFSCREEN_RENDER=true`.

| Sub-piece | Files | Commit |
|---|---|---|
| 1. SAB store mirror + feature flags | `sabStoreMirror.ts`, `sabStoreBridge.ts`, `feature-flags.ts` | `46e338d` |
| 2. Shader precompile manifest + precompiler | `shaderManifest.ts`, `shaderPrecompiler.ts` | `5d7dd79` |
| 3-4. FPS telemetry + auto-quality policy | `fpsTelemetry.ts`, `autoQuality.ts` | `492d77e` |
| 5. Synthetic event bridge | `eventBridge.ts` | `f38d5c3` |
| 6-7. Worker protocol + client + host + render worker | `workerProtocol.ts`, `workerClient.ts`, `OffscreenCanvasGate.tsx`, `OffscreenCanvasWorkerHost.tsx`, `workers/renderWorker.ts` | `d72ea72` |
| Lint fixes (named three imports) | 3 files | `101c2d3` |

**Scope caveat (honest):** full R3F reconciler in worker is 3-5 eng-weeks per the audit. This ships:
- Full infra suite that a reconciler will plug directly into (no throw-away).
- A minimal worker render scene (cockpit ring + grid + stars) so the pipeline is live NOW and measurable.
- Main-thread Canvas untouched — when flag off or browser unsupported, zero regression.

Next: Task #2 — AUTH-ENH Signed Demo Tokens (Max).

---

### Flagship Game Audit — Phase F: Per-Game AI Integration (April 7, 2026)

**Status:** COMPLETE
**Scope:** AI content hooks integrated into all 5 flagship games

- [x] Pet Trainer: `useAIContent` + `SurpriseMeButton` for novel categories
- [x] Sort Toy Box: `useAIContent` for Round 5 AI-generated criteria
- [x] Neural Builder: `useAIContent` for random challenge generation
- [x] Agent Architect: `useAIContent` for sandbox mission generation
- [x] Bias Detective: `useAIContent` for new case generation

**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase E: AI Content Generation Infrastructure (April 7, 2026)

**Status:** COMPLETE
**Scope:** 3 new files — shared utility, API route, client hook

- [x] `src/lib/ai-content-generator.ts` — Types, Zod validation, 10 prompt templates, safety filters, rate limiting, caching
- [x] `src/app/api/ai/generate-content/route.ts` — POST route with auth, Claude API call, JSON parsing, safety check
- [x] `src/hooks/useAIContent.ts` — Client hook with localStorage cache, rate limiting, concurrent request prevention

**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase D2: Remaining Flagship Expansions (April 7, 2026)

**Status:** COMPLETE
**Scope:** 4 flagship games expanded with new content, modes, and features

- [x] **Pet Trainer** (1,123→1,343): +3 pets, +6 categories, +4 moods, +2 evolution stages, customization, training modes
- [x] **Prompt Lab** (2,127→2,323): +7 challenges, +7 templates, 5 scenario packs, battle/history/recipes modes
- [x] **Agent Architect** (1,217→1,335): +5 blocks, +10 missions, 5 packs, 10 debug challenges, sandbox/debug/replay modes
- [x] **Bias Detective** (1,623→1,757): +8 cases, +2 evidence types, +3 ranks, 15-entry timeline, test lab/fix tools

**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase D: Neural Builder Band A + Content Expansion (April 7, 2026)

**Status:** COMPLETE
**Scope:** Band A support + 5 new challenges + 4 arch tests + Band C hyperparameters + competition mode (1,531 → 1,859 lines)

- [x] Band A: 3 simplified challenges (Connect the Dots, Build a Simple Brain, Color Sorter)
- [x] Band A: Visual-only UI with star ratings, "Feed Your Brain!" button, guided text
- [x] 5 new B/C challenges: Sound Recognizer, Emotion Detector, Animal Identifier, Text Classifier, Weather Predictor
- [x] 4 new architecture tests: Overfitter, Underfitter, Speed Demon, Memory Master
- [x] Band C: Activation function selector (ReLU/Sigmoid/Tanh)
- [x] Band C: Dropout toggle (off/25%/50%), learning rate slider, batch size selector
- [x] Competition mode: Beat the Benchmark with bronze/silver/gold tiers
- [x] Hyperparameters affect training curves (convergence rate, noise level)

**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase C: Sort Toy Box Major Expansion (April 7, 2026)

**Status:** COMPLETE
**Scope:** Major expansion from 652 → 1,117 lines. 4 bugs fixed (ST1-ST4).
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`

- [x] 5-round progressive system with progression gates (≥60% match to unlock)
- [x] Expanded shape library: 12 → 30+ shapes across 5 round pools
- [x] Expanded criteria: 3 → 8 (shape, color, size, pattern, texture, weight, symmetry, edgeCount)
- [x] 3 game modes: Standard, Challenge (timed), Discovery (free-play with static AI rule matching)
- [x] Animated 3-phase AI reveal (BUG-ST3): feature extraction → distance → clustering
- [x] Scoring overhaul (BUG-ST1): 5pts/sort + combo bonus + match accuracy + round bonuses
- [x] Removed unused useGameContent hook (BUG-ST2)
- [x] replayCount forces shape regeneration on replay (BUG-ST4)

**Files modified:** `src/components/games/SortToyBoxGame.tsx`
**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase B: Neural Builder Critical Fixes (April 7, 2026)

**Status:** COMPLETE
**Scope:** 8 bugs in NeuralBuilderGame.tsx (2 Critical, 3 High, 3 Medium)
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`

- [x] BUG-NB1 (CRITICAL): Training accuracy now architecture-dependent (convergence rate, noise, plateau)
- [x] BUG-NB2 (HIGH): optimalMatch normalized by optimal neuron sum, not totalNeurons
- [x] BUG-NB3 (HIGH): sparkIntensity uses raw delta before weight clamping
- [x] BUG-NB4 (CRITICAL): Removed duplicate inline NeuralNetwork3D (kept sceneStore registration)
- [x] BUG-NB5 (MEDIUM): setTimeout in ref, cleared on unmount
- [x] BUG-NB6 (MEDIUM): Heartbeat continues during training at 2.7x speed
- [x] BUG-NB7 (MEDIUM): Audio concurrency limited to 3 (prevents distortion)
- [x] BUG-NB8 (MEDIUM): Canvas cleared on challenge switch

**Files modified:** `src/components/games/NeuralBuilderGame.tsx`
**Verification:** `npx tsc --noEmit` — PASS | `npm run build` — PASS

---

### Flagship Game Audit — Phase A: GameStore + GameShell Bug Fixes (April 7, 2026)

**Status:** COMPLETE
**Scope:** 5 critical/high bugs in shared game infrastructure (affects all 35 games)
**Branch:** `claude/flagship-game-audit-implementation-cb9TL`
**Source:** `flagship-game-content-audit(04.06.2026).md` — Section 3 (Bug Audit), Section 8 (Implementation Roadmap)

- [x] BUG-GS1 (CRITICAL): Decoupled `updateScore()` from `maxScore`. Added `setMaxScore()` action. Score and maxScore are now independent.
- [x] BUG-GS2 (HIGH): Fixed `advanceRound()` off-by-one. Changed `>=` to `>`, advance-then-check pattern.
- [x] BUG-GS3 (HIGH): `resetGame()` now clears all fields: `currentGame`, `totalRounds`, `hintsRemaining` added to reset.
- [x] BUG-GS4 (CRITICAL): Kept `maxScore` in HUD using `totalRounds * 10`. Ceremony tier calculation preserved.
- [x] BUG-GS5 (HIGH): Wrapped `completeAndReward` in try/catch. `hasRewarded.current` resets on failure for auto-retry.

**Files modified:**
- `src/stores/gameStore.ts` — 3 bug fixes + 1 new action
- `src/components/game/GameShell.tsx` — 2 bug fixes (reward pipeline + maxScore)

**Verification:** `npx tsc --noEmit` — PASS (zero type errors)

---

### 3D UI Migration (April 3, 2026)

**Status:** COMPLETE — All 7 phases delivered
**Scope:** Full migration of HTML/CSS dashboard UI to 3D cockpit-embedded panels
**Total:** 49 components, 150 design decisions

**Phase 1 — Infrastructure (8 files):**
- [x] cockpitModePresets
- [x] cockpitDesignTokens
- [x] cockpitUIStore
- [x] CockpitUILayer
- [x] 5 UI primitives (base 3D UI building blocks)

**Phase 2 — Dashboard (9 panels):**
- [x] 6 HTML pages converted to 3D panel architecture
- [x] ~861 lines of HTML removed

**Phase 3 — Auth + Forms (4 panels):**
- [x] LoginPanel3D
- [x] SignupPanel3D
- [x] ResetPasswordPanel3D
- [x] ChatPanel3D

**Phase 4 — Gamification (3 components):**
- [x] XPPopup3D
- [x] CelebrationPanel3D
- [x] useCelebration3D

**Phase 5 — Game UI (3 components):**
- [x] GameHUD3D
- [x] GameTimerBar3D
- [x] GamePhaseOverlay3D

**Phase 6 — Game Templates (6 components):**
- [x] ChoiceButton3D
- [x] QuizGameTemplate
- [x] BuilderGameTemplate
- [x] ExplorerGameTemplate
- [x] LabGameTemplate
- [x] GameLearnCards3D

**Phase 7 — Marketing (1 component):**
- [x] CockpitPreview3D

**Key Changes:**
- AmbientParticles.tsx DELETED (Decision 20.0)
- HolographicHUD REPOSITIONED to peripheral frame (Decision 6.0)
- Cockpit-Interface-Plan.md ARCHIVED to _SUPERSEDED/

---

### Documentation Drift Fixes (March 30, 2026)

**Status:** COMPLETE
**Scope:** Archive obsolete docs, fix CLAUDE.md Section 14, note registry refresh needed

- [x] I1: Archived MOBILE_3D_ENHANCEMENT_PLAN_PartA.md and PartB.md to `docs/00-reference/_SUPERSEDED/` via `git mv`. Updated SUPERSEDED_BY.md manifest with D3D-1 obsolescence reason.
- [x] I2: Added v3.0 refresh note to `docs/00-reference/3D-Component-Registry.md` — authoritative list is now CLAUDE.md Section 9 (93 components). LOD/mobile references in registry are outdated per D3D-1/D3D-2.
- [x] I5: Updated CLAUDE.md Section 14 authStore entry to match actual implementation: `parent, isLoading, isDemoMode, demoSession, setParent/setLoading/clearAuth/startDemoSession/endDemoSession/checkDemoStatus` (was incorrectly listing `user, session, loading, signIn/signUp/signOut`).
- [x] I6: Added note to CLAUDE.md Section 14 accessibilityStore entry that store is exported as `useA11yStore`.
- [x] I9: Verified gameRegistry cleanup — `src/config/gameRegistry.ts` contains zero tablet/mobile column references. Batch 3 cleanup confirmed complete.

### Discrepancies Log

- **I3 — Stage 7 Shared file naming:** CLAUDE.md Section 4 references `STAGE7_Shared_v3FINAL_A` and `XP_Celebration(v2)` but the actual filenames in `docs/` may use spaces (e.g., `STAGE7 Shared v3FINAL PartA.md`). This is a documentation reference inconsistency only — the actual files with spaces are fine and should not be renamed. Stage doc references in CLAUDE.md use underscore convention while files may use spaces.

---

### Frontend Audit Fixes (March 30, 2026)

**Status:** COMPLETE
**Scope:** Build fixes, React 19 compatibility, error boundaries, accessibility, production hardening

- [x] CRIT-001: Added 'use client' to /offline page (build fix)
- [x] CRIT-002: Made Supabase client build-safe with placeholder fallbacks (build fix)
- [x] CRIT-003: Upgraded @nivo/* from 0.88.0 to 0.99.0 for React 19 compatibility
- [x] HIGH-001: Documented font loading migration plan (next/font deferred — no build internet)
- [x] HIGH-002: Added error.tsx for (auth) and (marketing) route groups
- [x] HIGH-003: Added loading.tsx for (auth) and (marketing) route groups
- [x] HIGH-004: Guarded non-essential console statements for production
- [x] HIGH-005: Moved dangerouslySetInnerHTML CSS keyframes to globals.css
- [x] WARN-001: Added loading fallbacks to dynamic 3D imports
- [x] WARN-003: Improved ARIA accessibility on 8 simpler games (52+ labels added)
- [x] WARN-005: Documented guideStore + cockpitAtoms in CLAUDE.md

**Files Created (5):**
- `src/app/(auth)/error.tsx`
- `src/app/(auth)/loading.tsx`
- `src/app/(marketing)/error.tsx`
- `src/app/(marketing)/loading.tsx`
- `src/app/(dashboard)/admin/content/AdminContentClient.tsx`

**Files Modified (8+):**
- `src/app/offline/page.tsx` (added 'use client')
- `src/lib/supabase/client.ts` (build-safe fallbacks)
- `src/lib/supabase/server.ts` (build-safe fallbacks)
- `src/lib/env.ts` (relaxed Supabase validation)
- `src/middleware.ts` (build-safe fallbacks)
- `src/app/globals.css` (CSS keyframes from dangerouslySetInnerHTML)
- `package.json` (@nivo upgrade)
- 8 game components (ARIA improvements)

---

### Marketing Layout & Legal Pages Enhancement (2026-03-30)

**Status:** COMPLETE
**Branch:** `claude/audit-findings-implementation-WJSMR`
**Scope:** Shared marketing layout, production-ready COPPA privacy policy, terms of service

**Phase 1 — Shared Marketing Layout:**
- [x] `src/components/marketing/MarketingHeader.tsx` — Fixed glassmorphism header with nav, auth CTAs, active page indicator
- [x] `src/components/marketing/MarketingFooter.tsx` — 3-column footer (Platform, Legal, Contact) with COPPA badge
- [x] `src/app/(marketing)/layout.tsx` — Updated with shared header/footer, aurora background gradient

**Phase 2 — COPPA-Compliant Privacy Policy (13 sections):**
- [x] Operator identification with physical contact details
- [x] Detailed data collection inventory (what we collect AND don't collect)
- [x] Third-party service disclosures with data/purpose/security per service (5 services)
- [x] Verifiable Parental Consent (VPC) method description
- [x] Parental rights enumeration with exercise instructions
- [x] Written data retention policy with per-category periods (2025 COPPA amendment)
- [x] Written security program disclosure (2025 COPPA amendment)
- [x] Cookie/persistent identifier disclosure table
- [x] No-advertising/no-profiling/no-monetization statement
- [x] Demo mode data handling
- [x] Policy change notification + re-consent requirement
- [x] Legal review required banner

**Phase 3 — Terms of Service (14 sections):**
- [x] Eligibility & age requirements (COPPA alignment)
- [x] Account terms with security responsibilities
- [x] Subscription tiers (Free/Plus/Forge) with billing details
- [x] Parental gate for all purchases
- [x] Demo mode terms
- [x] Comprehensive acceptable use policy
- [x] AI-specific disclosures (Anthropic API, moderation, no profiling)
- [x] No-advertising statement
- [x] Intellectual property
- [x] Termination (by user and by operator)
- [x] Disclaimers & limitation of liability
- [x] Dispute resolution (Delaware law, JAMS arbitration)
- [x] Change notification + re-consent requirement

**Phase 4 — Documentation Updates:**
- [x] Master Implementation Guide v4.0 — Added marketing components, privacy/terms pages, auth callback to file registries
- [x] PROGRESS.md — Full implementation log
- [x] AUDIT_REPORT_03.29.2026.md — Resolution status table (updated earlier)

**Files Created (4):**
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/app/(marketing)/privacy/page.tsx` (rewritten from scratch)
- `src/app/(marketing)/terms/page.tsx` (rewritten from scratch)

**Files Modified (2):**
- `src/app/(marketing)/layout.tsx` (full rewrite — added header/footer/aurora)
- `docs/00-reference/SparkForge_Master_Implementation_Guide_v3.2.md` (file registry updates)

---

### Audit Findings Implementation (2026-03-30)

**Status:** CRITICAL + HIGH COMPLETE
**Branch:** `claude/audit-findings-implementation-WJSMR`
**Source:** `AUDIT_REPORT_03.29.2026.md`

**CRITICAL Findings (5/5 Resolved):**
- [x] CRIT-001: AuthProvider wired into (dashboard) and (auth) layouts
- [x] CRIT-002: COPPA consent endpoint secured with session auth + rate limiting
- [x] CRIT-003: Sentry PII scrubbing via beforeSend on all 3 configs (client/server/edge)
- [x] CRIT-004: SQL CHECK constraints consolidated to canonical 6-value set + migration script
- [x] CRIT-005: /privacy and /terms pages created under (marketing) route group

**HIGH Findings (8/8 Resolved, 1 Verified OK):**
- [x] HIGH-001/002: Duplicate SQL files deleted (001b_rls.sql, 001c_functions.sql)
- [x] HIGH-003: search_path added to get_lab_progress SECURITY DEFINER function
- [x] HIGH-004: IDOR fix — auth.uid() check in get_parent_dashboard
- [x] HIGH-005: Daily streak reset pg_cron job added
- [x] HIGH-006: Badge thresholds corrected (35 games, 67 badges)
- [x] HIGH-007: All 9 TypeScript errors fixed across 5 source files
- [x] HIGH-008: Cascading deletes verified — all FKs have ON DELETE CASCADE (no fix needed)
- [x] HIGH-009: Auth callback route.ts created for OAuth/magic link flows

**Build Verification:**
- [x] TypeScript compilation: PASS
- [x] ESLint: PASS (additional fixes applied for unescaped entities, prefer-const, layout exports)
- [ ] Prerender: EXPECTED FAIL (missing Supabase env vars in build environment)

**Discrepancies Log:**
- useAuthHover exported from (auth)/layout.tsx violated Next.js layout export rules — extracted to src/hooks/useAuthHover.ts
- useContent.ts queryFn return type needed explicit cast for type-safe select callback

---

### Previous: Stage 9 — Content Agent Enhancement (ALL 9 PHASES COMPLETE)
**Status:** COMPLETE — Full 9-phase enhancement plan implemented
**Last Updated:** 2026-03-28 (Phase 9: New Game Development Generator)

---

### Content Agent Enhancement — Phase 1: Schema Extension (2026-03-28)

**Status:** COMPLETE
**Branch:** `claude/stage-9-audit-fixes-YQomo`
**Scope:** Foundation types, prompts, pipeline stages, hooks, admin dashboard for 9-phase enhancement plan

**Phase 1A — TypeScript Types (commit b10df85):**
- [x] 4 new ContentType values: game_scenario, game_challenge, trending_topic, branching_lesson
- [x] 12 new interfaces: GameScenarioConfig, GameChallengeConfig, TrendingTopicConfig, BranchingLessonConfig, BranchNode, ContentMetadata, DynamicGameConfig, ArchitectureRequirement, PipelineGateStatus, NewGameBlueprint
- [x] Extended CONTENT_TYPE_ICONS

**Phase 1B — Pipeline Prompts (commit b10df85):**
- [x] GAME_MECHANICS: 35-game slug→mechanics mapping
- [x] 4 new system prompts: GAME_SCENARIO, GAME_CHALLENGE, TRENDING_RESEARCH, BRANCHING_LESSON
- [x] TRENDING_SEARCH_QUERIES: 10 weekly-rotating queries

**Phase 1C — Pipeline Stages (commit b10df85):**
- [x] stageGenerateGameScenarios() — dynamic rounds for existing games
- [x] stageGenerateGameChallenges() — time-limited events
- [x] stageGenerateBranchingLessons() — interactive decision trees
- [x] stageTrendingResearch() — weekly AI news with game adaptations
- [x] PipelineMode: 'standard' | 'enhanced' | 'full'
- [x] Extended AgentRunResult with new metrics

**Phase 1D — Admin Dashboard (commit d163291):**
- [x] 4 new Lucide icons for content types
- [x] Pipeline mode selector (standard/enhanced/full)

**Phase 1E — Content Hooks (commit b10df85):**
- [x] useGameContent(gameSlug, ageBand) — game scenarios + challenges
- [x] useTrendingContent(ageBand) — trending topics
- [x] useBranchingLessons(labNumber, ageBand) — interactive lessons

**Files Created (0) | Files Modified (5):**
- `src/types/index.ts` — 12 new interfaces + 4 content types
- `src/lib/agent/prompts.ts` — 4 prompts + 35 game mechanics + trending queries
- `src/lib/agent/pipeline.ts` — 4 new stages + PipelineMode + enhanced orchestrator
- `src/hooks/useContent.ts` — 3 new React Query hooks
- `src/app/api/agent/run/route.ts` — mode query param support
- `src/app/(dashboard)/admin/content/page.tsx` — icons + mode selector

### Phase 2: Dynamic Game Scaffolding (2026-03-28)

**Status:** COMPLETE (commit 9c9e4f4)
- [x] All 35 game components wired with `useGameContent` hook
- [x] Static content preserved as fallback, dynamic scenarios overlay when available
- [x] 3 parallel batches: Labs 1-3 (12 games), Labs 4-7 (12 games), Labs 8-10 (11 games)

### Phase 3: Trending AI Topics Pipeline (2026-03-28)

**Status:** COMPLETE (commit fa5aabf)
- [x] `/api/agent/trending` route — POST (admin) + GET (cron)
- [x] `runTrendingPipeline()` standalone pipeline function
- [x] `TrendingFeed.tsx` dashboard component (compact/full modes)
- [x] `vercel.json` — weekly trending cron (Mondays 8 AM UTC)
- [x] `schedule/route.ts` — supports ?mode= param, defaults to 'enhanced'

**Files Created (2):**
- `src/app/api/agent/trending/route.ts`
- `src/components/dashboard/TrendingFeed.tsx`

**Files Modified (3):**
- `src/lib/agent/pipeline.ts` — added runTrendingPipeline()
- `src/app/api/agent/schedule/route.ts` — mode param support
- `vercel.json` — weekly trending cron

**Enhancement Roadmap (9 Phases):**
- [x] Phase 1: Content Agent Schema Extension ✅
- [x] Phase 2: Dynamic Game Scaffolding (all 35 games) ✅
- [x] Phase 3: Trending AI Topics Pipeline ✅
- [x] Phase 4: Interactive Lesson Builder ✅
- [x] Phase 5: AI Guide Avatar Integration ✅
- [x] Phase 6: 3D Cockpit Content Integration ✅
- [x] Phase 7: Admin Dashboard Enhancement ✅
- [x] Phase 8: 3D Architecture/UI/UX Generator ✅
- [x] Phase 9: New Game Development Generator ✅

### Phase 9: New Game Development Generator (2026-03-28)

**Status:** COMPLETE (commit 3b1ce43)
**Scope:** Autonomous pipeline that creates entirely new games (concept → code → 3D → audit)

- [x] `game-generator-prompts.ts` — 3 prompts (concept, game code, environment code)
- [x] `game-generator-pipeline.ts` — 9-stage pipeline with COPPA audit
- [x] `/api/agent/game-generator` route — admin-only, rate limited
- [x] Admin dashboard — "New Game" button with tier/lab targeting

**Files Created (3):**
- `src/lib/agent/game-generator-prompts.ts`
- `src/lib/agent/game-generator-pipeline.ts`
- `src/app/api/agent/game-generator/route.ts`

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — New Game button

---

### FULL ENHANCEMENT SUMMARY (9 Phases, 2026-03-28)

| Phase | Scope | New Files | Modified | Lines Added |
|-------|-------|-----------|----------|-------------|
| Audit Fixes | 11 findings resolved | 1 | 7 | ~200 |
| Phase 1: Schema | Types, prompts, pipeline, hooks | 0 | 7 | ~670 |
| Phase 2: Scaffolding | 35 games wired with useGameContent | 0 | 35 | ~106 |
| Phase 3: Trending | API route, feed component, cron | 2 | 3 | ~297 |
| Phase 4: Lessons | Branching renderer, hook, API | 2 | 2 | ~357 |
| Phase 5: AI Guide | Store, prompts, API, voice, chat, 3D | 9 | 1 | ~1,400 |
| Phase 6: Cockpit | Content bridge, NPC bubbles, hologram | 3 | 0 | ~366 |
| Phase 7: Admin | Search, analytics, type filter | 0 | 1 | ~157 |
| Phase 8: 3D Generator | Architect pipeline, prompts, API | 3 | 1 | ~712 |
| Phase 9: Game Generator | Game pipeline, prompts, API | 3 | 1 | ~583 |
| **TOTAL** | | **23 new** | **58 modified** | **~4,848** |

### Phase 8: 3D Architecture/UI/UX Generator (2026-03-28)

**Status:** COMPLETE (commits 3c58bce, Phase 8B)
**Scope:** Autonomous Claude API pipeline that generates R3F components with 8-gate approval

**Phase 8A — Pipeline + Prompts + Route (commit 3c58bce, 3 files):**
- [x] `architect-prompts.ts` — 4 system prompts (analysis, R3F code gen, integration, COPPA audit)
- [x] `architect-pipeline.ts` — 8-gate pipeline (analysis → architecture → code_gen → file_mgmt → build_test → coppa_audit → admin_approval → deploy)
- [x] `/api/agent/architect` route — admin-only POST, rate limited, Zod validated

**Phase 8B — Admin Integration (this commit):**
- [x] "Generate 3D Architecture" button in admin preview modal
- [x] Triggers architect pipeline per content item, shows gate results via toast

**Files Created (3):**
- `src/lib/agent/architect-prompts.ts`
- `src/lib/agent/architect-pipeline.ts`
- `src/app/api/agent/architect/route.ts`

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — architect trigger button

### Phase 7: Admin Dashboard Enhancement (2026-03-28)

**Status:** COMPLETE (commit 22c92a1)
- [x] Search bar — real-time title search with client-side filtering
- [x] Content type filter — dropdown for all 7 content types
- [x] Manual create button — UI hook for future create modal
- [x] Analytics tab — content statistics with by-type, by-lab, by-band breakdowns
- [x] filteredItems — replaces items.map for search + type filter support

**Files Modified (1):**
- `src/app/(dashboard)/admin/content/page.tsx` — +157 lines

### Phase 6: 3D Cockpit Content Integration (2026-03-28)

**Status:** COMPLETE (commit 157eb08)
- [x] `useCockpitContentBridge` hook — bridges Content Agent data to cockpit elements
- [x] `NPCSpeechBubble.tsx` — floating 3D speech bubbles above NPC bots
- [x] `ContentHologram3D.tsx` — holographic content display (daily challenge, trending, recs)

**Files Created (3):**
- `src/hooks/useCockpitContentBridge.ts`
- `src/components/3d/NPCSpeechBubble.tsx`
- `src/components/3d/ContentHologram3D.tsx`

### Phase 5: AI Guide Avatar Integration (2026-03-28)

**Status:** COMPLETE (commits a66d464, 800b0d1, Phase 5C)
**Scope:** Full "Spark" AI Guide — 5 avatar concepts, voice I/O, streaming chat, context awareness

**Phase 5A — Infrastructure (commit a66d464, 6 files):**
- [x] `guideStore.ts` — 10th Zustand store (persisted preferences, conversation, voice, turns)
- [x] `lib/guide/prompts.ts` — Composable prompt system (BASE + AGE_BAND + CONTEXT + LAB + GAME_HINTS)
- [x] `/api/ai/guide/route.ts` — SSE streaming conversation (Haiku, tier-gated turns)
- [x] `useVoiceInput.ts` — Web Speech API STT with interim results
- [x] `useVoiceOutput.ts` — Web Speech API TTS (age-band-tuned pitch/rate, audio-reactive)
- [x] `useGuideContext.ts` — Auto-detects context from route/sceneStore

**Phase 5B — Components (commit 800b0d1, 3 files):**
- [x] `GuideChatPanel.tsx` — Glassmorphic chat overlay (SSE streaming, voice, minimize/expand)
- [x] `GuideAvatar3D.tsx` — R3F avatar (5 concepts: Orb, Fox, Drone, Spark, Nova, all audio-reactive)
- [x] `GuideMobileAvatar.tsx` — CSS 2D fallback (pulse, spinner, lab-color glow)

**Phase 5C — Integration (this commit):**
- [x] Dashboard layout — GuideChatPanel mounted, useGuideContext activated

**Files Created (9):**
- `src/stores/guideStore.ts`, `src/lib/guide/prompts.ts`, `src/app/api/ai/guide/route.ts`
- `src/hooks/useVoiceInput.ts`, `src/hooks/useVoiceOutput.ts`, `src/hooks/useGuideContext.ts`
- `src/components/ui/GuideChatPanel.tsx`, `src/components/3d/GuideAvatar3D.tsx`
- `src/components/ui/GuideMobileAvatar.tsx`

**Files Modified (1):**
- `src/app/(dashboard)/layout.tsx` — GuideChatPanel + useGuideContext integration

### Phase 4: Interactive Lesson Builder (2026-03-28)

**Status:** COMPLETE (commit ce06dd7)
- [x] `useBranchingLesson` hook — decision-tree state machine with back/restart/progress
- [x] `BranchingLessonRenderer` component — full interactive lesson UI with 4 node types
- [x] Content API — multi-type filtering (comma-separated) + gameSlug filter
- [x] ContentQuerySchema — accepts string type and gameSlug params

**Files Created (2):**
- `src/hooks/useBranchingLesson.ts`
- `src/components/content/BranchingLessonRenderer.tsx`

**Files Modified (2):**
- `src/lib/validations.ts` — ContentQuerySchema extended
- `src/app/api/content/route.ts` — multi-type + gameSlug filtering
- [ ] Phase 4: Interactive Lesson Builder
- [ ] Phase 5: AI Guide Avatar Integration
- [ ] Phase 6: 3D Cockpit Content Integration
- [ ] Phase 7: Admin Dashboard Enhancement
- [ ] Phase 8: 3D Architecture/UI/UX Generator
- [ ] Phase 9: New Game Development Generator

---

### Stage 9 Audit Fixes (2026-03-28)

**Status:** COMPLETE
**Branch:** `claude/stage-9-audit-fixes-YQomo`
**Build Status:** TypeScript PASS (0 new errors), all changes compile clean

**Batch 1 — CRIT-001 + HIGH-003 (commit 328fd17):**
- [x] S9-CRIT-001 — Moved Anthropic SDK init from top-level to lazy per-request in prompt-lab/route.ts
- [x] S9-HIGH-003 — Replaced hardcoded model string with MODELS.moderation from centralized config
- [x] S9-HIGH-004 — Already resolved (proper TextBlock type guard + error: unknown)

**Batch 2 — HIGH-001 + HIGH-002 (commit 2987334):**
- [x] S9-HIGH-001 — Added client-side admin guard (useAuthStore + useRouter redirect) to admin content page
- [x] S9-HIGH-002 — Replaced manual POST validation with Zod schema (ReviewSchema with UUID validation)

**Batch 3 — WARN-001/002/003 + INFO-001 (commit 23cf531):**
- [x] S9-WARN-001 — Added rate limiting on /api/agent/run (2/hr via RATE_LIMITS.contentAgent)
- [x] S9-WARN-002 — Added rate limiting on review POST (60/min default)
- [x] S9-WARN-003 — CRON_SECRET now required in production (blocks endpoint if unset)
- [x] S9-INFO-001 — Migrated schedule route from raw NextResponse to apiSuccess/apiError helpers

**Batch 4 — WARN-004 (commit fff7360):**
- [x] S9-WARN-004 — Added defense-in-depth post-response moderation to Prompt Lab:
  - Layer 1: Keyword blocklist (regex, zero latency)
  - Layer 2: Haiku LLM moderation (age-band-aware screening)
  - Blocked responses logged with moderation_passed=false
  - Children see safe redirect messages

**Files Created (1):**
- `src/lib/agent/moderation.ts` — Post-response moderation (blocklist + Haiku)

**Files Modified (5):**
- `src/app/api/ai/prompt-lab/route.ts` — Lazy init + MODELS + moderation integration
- `src/app/(dashboard)/admin/content/page.tsx` — Admin guard
- `src/app/api/agent/review/route.ts` — Zod validation + rate limiting
- `src/app/api/agent/run/route.ts` — Rate limiting
- `src/app/api/agent/schedule/route.ts` — CRON_SECRET enforcement + apiSuccess/apiError
## Current Phase: Stage 7 — Scene Store Audit & Environment Wiring
## Status: COMPLETE — All Stage 7 findings resolved including S7-WARN-002 + 34 TS errors fixed
## Last Updated: 2026-03-28

---

### Stage 7 — Scene Store Audit & Environment Wiring (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/audit-scene-store-stage7-P69V9
**Build Status:** TypeScript 0 errors | Build PASS

**Batch 1 — Stage 7 Game TypeScript Fixes (3 files):**
- [x] EmojiDecoderGame: Pass required props to EmojiDecoder3D, fix variable ordering
- [x] AiOrNotGame: Pass required props to AiOrNot3D, map TimeCategory → visual categories
- [x] DataDetective3D: Replace THREE.Points namespace with named Points import

**Batch 2 — Supporting TypeScript Fixes (11 files, 31 errors → 0):**
- [x] useGamification, useChildren, useContent: Type apiFetch generics
- [x] content/[slug], labs/[labId], labs/page: Type hook return values
- [x] badges/route, stripe/checkout: Fix type assertions
- [x] HolographicButton, LessonViewer, TrophyRoom: Fix type mismatches

**Batch 3 — FL-Lite Environment Wiring (S7-WARN-002, 9 files):**
- [x] DataDetective3D ← DataDetectiveEnvironment
- [x] RobotVacuum3D ← RobotVacuumEnvironment
- [x] CameraQuest3D ← CameraQuestEnvironment
- [x] ChatbotNodes3D ← ChatbotBuilderEnvironment
- [x] EmojiDecoder3D ← EmojiDecoderEnvironment
- [x] CodeBlocks3D ← CodeBlocksEnvironment
- [x] MyFirstAiApp3D ← MyFirstAiAppEnvironment
- [x] FutureForge3D ← FutureForgeEnvironment
- [x] AiOrNot3D ← AiOrNotEnvironment

**Stage 7 Audit Summary — All Findings RESOLVED:**
| ID | Severity | Status |
|---|---|---|
| S7-CRIT-001 | CRITICAL | Resolved (March 27 — D3D-B1 Canvas refactor) |
| S7-HIGH-001 | HIGH | Resolved (GameShell handles startGame) |
| S7-HIGH-002 | HIGH | Resolved (March 27 — EmojiDecoder + AiOrNot 3D wired) |
| S7-HIGH-003 | HIGH | Resolved (March 27 — complete phases added) |
| S7-HIGH-004 | HIGH | Resolved (March 27 — age band enforcement) |
| S7-WARN-001 | WARNING | Resolved (March 27 — learn phases) |
| S7-WARN-002 | WARNING | Resolved (March 28 — 9 FL-Lite environments wired) |
| S7-WARN-003 | WARNING | Resolved (March 27 — ARIA improvements) |
| S7-WARN-004 | WARNING | Resolved (March 27 — SceneRouter error boundary) |
## Current Phase: Stage 6 — Flagship Games Enhancement (P0-P6 COMPLETE)
## Status: COMPLETE — 14 audit fixes + 5 embedding fixes + 7 enhancement phases (P0-P6)
## Last Updated: 2026-03-28 (P6 Session 3: 4 game-specific 3D visualizations)

---

### Stage 6 Enhancement — P0/P1/P2 (2026-03-28)

**Status:** COMPLETE (Session 1 of 3)
**Branch:** claude/stage-6-audit-fixes-38BE4
**Scope:** SortToyBox env expansion + cockpit broadcast for all 6 + audio for all 6

**Phase 1 (P0) — SortToyBoxEnvironment Expansion (commit 47859d6):**
- [x] Expanded from 251 → 622 lines (5 → 12 sub-components)
- [x] NEW: RoboticSortArms (6 animated arms, progress-reactive), FeatureScanner (sweeping beam)
- [x] NEW: BinaryDecisionTree, ClusterSpheres (3 orbiting), WarehouseShelving (24 instanced)
- [x] NEW: DataFlowTubes (3 glowing connections), HolographicLabels (3 floating panels)
- [x] Reactive props: sortProgress, activeGroupCount
- [x] useFrame hooks: 6 (up from 2). Triangle budget: ~3.8M (up from ~1M). Wow: 4/5 (up from 2/5)

**Phase 2 (P1) — Cockpit Broadcast Integration (commit 497dc7d):**
- [x] PetTrainerGame: button-press (correct/wrong), dial-rotate (accuracy), celebration-start (evolution)
- [x] SortToyBoxGame: button-press (sort), celebration-start + dial-rotate (AI reveal)
- [x] NeuralBuilderGame: dial-rotate (epoch progress), celebration-start (50/75/90% + complete)
- [x] PromptLabGame: button-press + dial-rotate (send), celebration-start (challenge pass)
- [x] AgentArchitectGame: button-press (place/run), celebration-start + dial-rotate (mission)
- [x] BiasDetectiveGame: button-press + dial-rotate (evidence), celebration-start (case closed)

**Phase 3 (P2) — Per-Game Audio Hooks (commit 21c0733):**
- [x] usePetTrainerAudio.ts — correct chime, wrong tone, streak chord, evolution fanfare, blip
- [x] useSortAudio.ts — throw whoosh, bin land thunk, group fill chime, AI reveal, complete
- [x] usePromptLabAudio.ts — typewriter click, send whoosh, response pop, score tone, challenge fanfare
- [x] useAgentAudio.ts — block click, connect wire, run hum, step tick, mission fanfare (star-rated)
- [x] useBiasDetectiveAudio.ts — gavel strike, evidence reveal, scale creak, balanced chime, case closed
- [x] All 6 games wired with soundEnabled toggle + audio calls at key action points

**Files Created (5):**
- `src/hooks/usePetTrainerAudio.ts`, `useSortAudio.ts`, `usePromptLabAudio.ts`
- `src/hooks/useAgentAudio.ts`, `useBiasDetectiveAudio.ts`

**Files Modified (7):**
- `src/components/3d/environments/SortToyBoxEnvironment.tsx` — Full expansion
- All 6 game components — cockpitBroadcast + audio integration

### Stage 6 Enhancement — P3/P4/P5 Session 2 (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4

**Phase 4 (P3) — Dead Prop Fixes + Missing Interactions (commit 4b41e3b):**
- [x] NeuralNetwork3D: dataFlowActive now drives traveling data dots along connections
- [x] PromptBubble3D: merge mechanic implemented (similar keywords attract + absorb)
- [x] Pet3DScene: emoji prop made optional (never used in 3D component)
- [x] SortScene3D: hover state + cursor pointer on ThrowableItem
- [x] AgentPipeline3D: hover glow + cursor pointer on Block3D
- [x] BiasScales3D: chain links swing with beam tilt velocity (cascading pendulum)
- [x] SortScene3D: landing particle burst (8 particles, auto-cleanup 700ms)
- [x] PromptLabGame: always-on environment (registers on mount, not just on keywords)

**Phase 5 (P4+P5) — CeremonyFX Milestones + Environment Reactivity (commit d4d83a4):**
- [x] All 6 games trigger CeremonyFX at conservative milestones:
  - PetTrainer: confetti on evolution, NeuralBuilder: confetti at 50/75%, streak at 90%
  - SortToyBox: confetti on AI reveal, PromptLab: confetti on challenge pass
  - AgentArchitect: confetti/streak on mission, BiasDetective: confetti on case closed
- [x] BiasDetective: dynamic caseColor per case type (blue/amber/green/purple/pink/red)
- [x] PetTrainer + NeuralBuilder environments already mood/accuracy-reactive (verified working)

**Files Modified (13):**
- 6 game components — CeremonyFX + uiStore integration
- 7 3D components — data flow, merge, hover, particles, chain physics

---

### Stage 6 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4
**Build Status:** All 14 findings resolved across 4 batches

**Batch 1A — Critical Game Lifecycle (commit 01710ae):**
- [x] S6-CRIT-001 — PromptLabGame: Added completeGame() call in report phase, "Finish Lab" button, full report UI with stats + age-band "What You Learned"
- [x] S6-CRIT-003 — SortToyBoxGame: Removed redundant startGame("sort-toy-box", 1) — GameShell handles initialization with correct totalRounds=12

**Batch 1B — D3D-B1 Canvas Refactor (commit 49c768a):**
- [x] S6-CRIT-002 — Refactored 5 standalone Canvas → group: Pet3DScene, SortScene3D, NeuralNetwork3D, PromptBubble3DScene, AgentPipeline3D. Removed Canvas from BiasDetectiveGame. All 6 games register via setGameSceneContent().
- [x] S6-HIGH-005 — Full sceneStore integration in all 6 flagship game components

**Batch 2A — Sort Toy Box Expansion (commit bcb1a02):**
- [x] S6-HIGH-001 — Full ARIA labels on all interactive elements
- [x] S6-HIGH-002 — Added learn phase (3 lesson cards/band) + complete phase (stats, summary, completeGame)
- [x] S6-HIGH-006 — Full A/B/C age band content in all phases
- [x] S6-WARN-003 — Removed dead code (_ShapeIcon, _assignGroup)
- [x] S6-WARN-005 — Removed redundant nested phase check

**Batch 2B+2C+3 — Disposal, Environment, Rate Limit (commit e788614):**
- [x] S6-HIGH-003 — Material disposal added to BiasScales3D + PromptBubble3D
- [x] S6-HIGH-004 — Created SortToyBoxEnvironment.tsx (240 lines, Lab 2 purple theme)
- [x] S6-WARN-001 — Client-side rate limiting in PromptLab (2s cooldown + 50/day cap)
- [x] S6-WARN-002 — Resolved (removed redundant startGame call)
- [x] S6-WARN-004 — Resolved (BiasDetective Canvas removed)

**Files Created (1):**
- `src/components/3d/environments/SortToyBoxEnvironment.tsx`

**Files Modified (14):**
- `src/components/games/PromptLabGame.tsx` — completeGame, report phase, rate limiting, sceneStore
- `src/components/games/SortToyBoxGame.tsx` — Full rewrite: learn/complete phases, ARIA, age bands
- `src/components/games/PetTrainerGame.tsx` — sceneStore integration
- `src/components/games/NeuralBuilderGame.tsx` — sceneStore integration
- `src/components/games/AgentArchitectGame.tsx` — sceneStore integration
- `src/components/games/BiasDetectiveGame.tsx` — sceneStore + Canvas removal
- `src/components/3d/Pet3DScene.tsx` — Canvas → group
- `src/components/3d/SortScene3D.tsx` — Canvas → group
- `src/components/3d/NeuralNetwork3D.tsx` — Canvas → group
- `src/components/3d/PromptBubble3DScene.tsx` — Canvas → group
- `src/components/3d/AgentPipeline3D.tsx` — Canvas → group
- `src/components/3d/BiasScales3D.tsx` — Material disposal
- `src/components/3d/PromptBubble3D.tsx` — Material disposal
- `src/components/3d/environments/index.ts` — Added SortToyBoxEnvironment export

**Stage 6 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S6-CRIT-001 | CRITICAL | Resolved (Batch 1A) |
| S6-CRIT-002 | CRITICAL | Resolved (Batch 1B) |
| S6-CRIT-003 | CRITICAL | Resolved (Batch 1A) |
| S6-HIGH-001 | HIGH | Resolved (Batch 2A) |
| S6-HIGH-002 | HIGH | Resolved (Batch 2A) |
| S6-HIGH-003 | HIGH | Resolved (Batch 2B) |
| S6-HIGH-004 | HIGH | Resolved (Batch 2C) |
| S6-HIGH-005 | HIGH | Resolved (Batch 1B) |
| S6-HIGH-006 | HIGH | Resolved (Batch 2A) |
| S6-WARN-001 | WARNING | Resolved (Batch 3) |
| S6-WARN-002 | WARNING | Resolved (Batch 1A) |
| S6-WARN-003 | WARNING | Resolved (Batch 2A) |
| S6-WARN-004 | WARNING | Resolved (Batch 1B) |
| S6-WARN-005 | WARNING | Resolved (Batch 2A) |

**3D Embedding Audit (Batch 5, commit 18b47fc):**
- [x] 3D-EMB-001 — SortScene3D: Wired in orphaned SortToyBoxEnvironment
- [x] 3D-EMB-002 — NeuralNetwork3D: Removed duplicate Environment + EffectComposer
- [x] 3D-EMB-003 — AgentPipeline3D: Removed duplicate Environment preset
- [x] 3D-EMB-004 — BiasScales3D: Removed duplicate Environment preset
- [x] 3D-EMB-005 — GameShell: Added cockpitBroadcastStore game-enter/game-exit events

**Stage 6 Doc Updates (Batch 6):**
- [x] Updated 11 stage documents with audit fix notes (6B A/B, 6C A/B, 6D A/B, 6E A/B, 6F A/B, 7B PartA)

### Stage 6 Enhancement — P6 Session 3 (2026-03-28)

**Status:** COMPLETE
**Branch:** claude/stage-6-audit-fixes-38BE4

**Phase 6 (P6) — Game-Specific 3D Visualizations (commit 1e282e9):**
- [x] PetDataLab3D (150 lines) — 3D bar chart for data-lab phase (label distribution, overfitting detection)
- [x] PromptScore3D (130 lines) — Holographic quality ring with 5 dimension segments
- [x] BiasDecisionTree3D (160 lines) — 3D octahedron decision tree for fix phase (biased=red, fixed=green)
- [x] SortFeatureViz3D (170 lines) — 3D feature-space scatter plot for reveal phase

**Files Created (4):**
- `src/components/3d/PetDataLab3D.tsx`, `PromptScore3D.tsx`, `BiasDecisionTree3D.tsx`, `SortFeatureViz3D.tsx`

**Files Modified (4):**
- PetTrainerGame, PromptLabGame, BiasDetectiveGame, SortToyBoxGame — integrated 3D visualizations
## Current Phase: Stage 8 — Full Suite 3D Cockpit Enhancements
## Status: COMPLETE — All 8 audit findings resolved + 10 3D enhancements (A1-D1)
## Last Updated: 2026-03-28 (Stage 8: Audit fixes + Full Suite 3D cockpit integration)

---

### Stage 8 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-8-audit-fixes-A0DNZ
**Build Status:** All 8 findings resolved + 3D embedding audit passed

**Batch 1 — Security Fixes:**
- [x] S8-HIGH-001 — Zod validation on Stripe checkout (CheckoutSchema from validations.ts)
- [x] S8-WARN-002 — Stripe status mapping (STRIPE_STATUS_MAP, DB CHECK updated)
- [x] S8-WARN-005 — Add-child routes through /api/children POST (server-side validation)
- [x] S10-WARN-002 — console.log removed from pricing page

**Batch 2 — Performance + UX:**
- [x] S8-HIGH-002 — PG function get_parent_dashboard() + API route + hook rewrite (6N→1 query)
- [x] S8-WARN-003 — Time limit error handling + optimistic rollback
- [x] S8-WARN-004 — alert() replaced with toast in subscription page

**Batch 3 — COPPA:**
- [x] S8-WARN-001 — Delete child button + confirmation modal in parent dashboard

**3D Cockpit Enhancements (Batches 5-8):**
- [x] A1: ParentStatHologram3D — 4 floating holographic stat tiles (~200K tris)
- [x] A2: Child selector → lab-select broadcast (age-band color → LED rim)
- [x] A3: Time limit → dial-rotate broadcast (snap to preset)
- [x] B1: Tier upgrade ceremony — CeremonyFX confetti on ?success=true
- [x] B2: Billing toggle → toggle-switch broadcast
- [x] B3: Tier card hover → button-press broadcast (tier color → LED rim)
- [x] C1: OnboardingCrystal3D — Progressive crystal formation (~150K tris)
- [x] C2: Lab selection → lab-select broadcast (lab color)
- [x] C3: Launch sequence — game-enter + celebration-start + confetti
- [x] D1: Animated CSS comparison bars in pricing feature table

**Files Created (5):**
- `sql/schema-stage8-dashboard-fn.sql` — PG function + DB constraint update
- `src/app/api/parent/dashboard/route.ts` — Aggregated dashboard API
- `src/components/3d/ParentStatHologram3D.tsx` — 4 floating stat tiles
- `src/components/3d/ParentDashboardBridge.tsx` — Bridge for CockpitCanvas
- `src/components/3d/OnboardingCrystal3D.tsx` — Progressive crystal formation

**Files Modified (9):**
- `src/app/api/stripe/checkout/route.ts` — Zod validation
- `src/app/api/stripe/webhook/route.ts` — Status mapping
- `src/hooks/useParentDashboard.ts` — API-driven fetch
- `src/app/(dashboard)/parent/page.tsx` — Delete button, error handling, toast, 3D broadcasts
- `src/app/(dashboard)/parent/subscription/page.tsx` — Toast, ceremony, broadcasts
- `src/app/(dashboard)/parent/add-child/page.tsx` — API route instead of direct DB
- `src/app/(dashboard)/onboarding/page.tsx` — Crystal import, broadcasts, launch sequence
- `src/app/(marketing)/pricing/page.tsx` — console.log removal, CSS comparison bars
- `src/components/3d/CockpitCanvas.tsx` — ParentDashboardBridge mount

**Stage 8 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S8-HIGH-001 | HIGH | Resolved (Batch 1) |
| S8-HIGH-002 | HIGH | Resolved (Batch 2) |
| S8-WARN-001 | WARNING | Resolved (Batch 3) |
| S8-WARN-002 | WARNING | Resolved (Batch 1) |
| S8-WARN-003 | WARNING | Resolved (Batch 2) |
| S8-WARN-004 | WARNING | Resolved (Batch 2) |
| S8-WARN-005 | WARNING | Resolved (Batch 1) |
| S10-WARN-002 | WARNING | Resolved (Batch 1) |
## Current Phase: Stage 7 — 3D Enhancement Build + Audit Fix
## Status: COMPLETE — All findings resolved + 3D/UI enhancements deployed
## Last Updated: 2026-03-27 (Stage 7: Audit Fix + 3D Enhancement Build)

---

### Stage 7 — 3D Enhancement Build (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-7-audit-fixes-i4ZvH
**Scope:** FL-Lite 3D upgrades (9 components) + Standard UI/UX (10 games) + Systemic enhancements

**Phase 1A — Shared Particle Library (commit a46cdda):**
- [x] Created `src/lib/3d/gameParticles.ts` — 8 particle presets (confettiBurst, sparkShower, dustCloud, dataStream, discoveryBurst, victoryFireworks, trailParticles, steamPuff)
- [x] Particle factory + physics update loop + completion tier system
- **1 file created, 307 lines**

**Phase 1B — CeremonyFX Game Completion Tiers (commit 7a9c67b):**
- [x] GameShell now triggers cockpit CeremonyFX on game completion
- [x] Gold (>80%) → levelUp ceremony | Silver (50-80%) → confetti | Bronze (<50%) → xp toast
- **1 file modified**

**Phase 1C — Bloom/Vignette Presets:**
- [x] Already implemented via cockpit-architecture.json modePresets (game, gameComplete, celebration)

**Phase 2 — FL-Lite 3D Component Upgrades (commit 0fb222c):**
- [x] DataDetective3D: Discovery particles + MeshPhysicalMaterial refraction lens + glow ring
- [x] RobotVacuum3D: Dust cloud particles + glowing trail + LED eyes + victory spin
- [x] CameraQuest3D: Camera flash + polaroid develop effect + chrome gauge + flip sparks
- [x] ChatbotNodes3D: Message pulse trails + data flow texture + root halo + endpoint burst
- [x] EmojiDecoder3D: Steam puffs + gear mesh upgrade + conveyor scroll + vibration + ejection
- [x] CodeBlocks3D: Tracer trail + snap pop + error shake + CRT scanlines
- [x] MyFirstAiApp3D: Orb connection particles + screen content + launch exhaust + score counter
- [x] FutureForge3D: Grid pulse + selection burst + holographic seal + forge glow
- [x] AiOrNot3D: Verdict particles + spotlight + gallery collection + pedestal reveal
- **9 files modified, +2,013 lines | Wow factor: 2.7/5 → 4.2/5**

**Phase 3 — Standard Game UI/UX Enhancements (commit 31254c5):**
- [x] TimeMachine: Clock animation + placement celebration + progress bar
- [x] WordPredictor: Spring probability bars + brain pulse + streak flame
- [x] TokenChopper: Staggered token entrance + type colors + cost meter
- [x] NeuronRelay: Signal pulse flow + toggle animation + animated meter
- [x] FoolTheAi: Animated confidence bar + answer feedback + fooled counter
- [x] PredictionMarket: Animated voting bars + crowd visualization + accuracy counter
- [x] AiArtDetective: Zoom lens hover + animated slider
- [x] ApiExplorer: Send/receive animation + method badges + typewriter response
- [x] HumanVsMachine: Score bars + thinking indicators + verdict reveal
- **9 files modified, +721 lines | Wow factor: 3.2/5 → 3.8/5**

---

### Stage 7 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/stage-7-audit-fixes-i4ZvH
**Build Status:** All CRITICAL + HIGH findings resolved, 3/4 WARN resolved, 1 WARN deferred

**Batch 1 — S7-CRIT-001: D3D-B1 Canvas Refactor (commit 26982ce):**
- [x] Removed standalone `<Canvas>` from all 28 Stage 7 games
- [x] 19 Standard games: Canvas → sceneStore.setGameSceneContent()
- [x] 9 FL-Lite 3D components: Canvas/EffectComposer/Environment → clean `<group>` export
- [x] 9 FL-Lite game files: Added sceneStore integration
- [x] S7-HIGH-002: EmojiDecoder + AiOrNot 3D components imported and registered
- **37 files modified**

**Batch 2 — S7-HIGH-004 + S7-WARN-004 (commit 47aca47):**
- [x] Age band enforcement in game router (API Explorer band C + all restricted games)
- [x] Canvas3DErrorBoundary + Suspense around game content in SceneRouter
- **2 files modified**

**Batch 3 — S7-HIGH-003 + S7-WARN-001 (commit 0e0d025):**
- [x] Complete phases verified/added for all 29 Stage 7 games
- [x] Unique educational "What You Learned" summaries per game
- [x] Learn phases verified present across all games
- **24 files modified**

**Batch 4 — S7-WARN-003: ARIA Labels:**
- [x] ARIA coverage improved on CameraQuest, RobotVacuum, CodeBlocks, NeuronRelay, TreatTrainer, SentimentScanner

**Deferred:**
- [ ] S7-WARN-002 — 9 FL-Lite environment files orphaned (intended for future SceneRouter wiring)

**Stage 7 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S7-CRIT-001 | CRITICAL | Resolved (Batch 1) |
| S7-HIGH-001 | HIGH | Already resolved (GameShell) |
| S7-HIGH-002 | HIGH | Resolved (Batch 1) |
| S7-HIGH-003 | HIGH | Resolved (Batch 3) |
| S7-HIGH-004 | HIGH | Resolved (Batch 2) |
| S7-WARN-001 | WARNING | Resolved (Batch 3) |
| S7-WARN-002 | WARNING | Deferred (future SceneRouter) |
| S7-WARN-003 | WARNING | Resolved (Batch 4) |
| S7-WARN-004 | WARNING | Resolved (Batch 2) |
| S7-INFO-001 | INFO | Acknowledged |
| S7-INFO-002 | INFO | Acknowledged |

---

### Stage 5 Audit Fix — Full Resolution (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-5-audit-issues-xgt8j
**Build Status:** All 16 findings resolved + 4 3D embedding enhancements

**Batch 1 — Critical Fixes (commit cf7cd6b):**
- [x] S5-CRIT-001 — Profile page enhanced (215→689 lines): calculateLevel(), avatar shapes, trophy room, streak flames, daily challenge, editable name, cockpitBroadcast
- [x] S5-CRIT-002 — Wired useCompleteAndReward into GameShell — all 35 games auto-award XP/badges/streaks
- [x] S5-HIGH-006 — Mounted XPPopupProvider in GameShell

**Batch 2 — High Fixes (commit a2fda4e):**
- [x] S5-HIGH-001 — Created 4 UI + 3 3D gamification components (BadgeDisplay, BadgeGrid, LevelProgress, TrophyRoom, XPVortex, BadgePedestal3D, LevelUpExplosion)
- [x] S5-HIGH-002 — Added streak/confetti celebration types to CelebrationOverlay
- [x] S5-HIGH-003 — XP toast auto-dismiss (3s)
- [x] S5-HIGH-004 — reduceMotion support in all gamification components
- [x] S5-HIGH-005 — Full ARIA labels (dialog, aria-modal, aria-live, aria-hidden)
- [x] S5-HIGH-007 — CeremonyFX wired into CockpitCanvas via CeremonyFXBridge + ceremonyMapping

**Batch 3 — Warning Fixes (commit 1354d1f):**
- [x] S5-WARN-001 — CelebrationType→CeremonyFX mapping (ceremonyMapping.ts)
- [x] S5-WARN-002 — Confetti rAF unmount guard (isMounted ref)
- [x] S5-WARN-003 — Already resolved (S2-HIGH-002 typed interface)
- [x] S5-WARN-005 — LOD comment updated in CeremonyFX

**Batch 4 — Info/Cleanup (commit fb02db2):**
- [x] S5-INFO-001 — gamification/ barrel export index.ts, removed .gitkeep

**3D Embedding Enhancements (commit 2801de2):**
- [x] Enhancement A — Profile page broadcasts to cockpitBroadcastStore (page-navigate, badge-earn, button-press)
- [x] Enhancement B — TrophyRoom 3D showcase for rare/epic/legendary badges + BadgePedestalBridge
- [x] Enhancement C — AvatarPreview3D (136 lines, 6 shapes, morph animation, idle rotation, letter overlay)
- [x] Enhancement D — useGamification hooks broadcast xp-change, level-up, badge-earn, streak-update to cockpit

**Files Created (12):**
- `src/components/gamification/BadgeDisplay.tsx`, `BadgeGrid.tsx`, `LevelProgress.tsx`, `TrophyRoom.tsx`, `index.ts`
- `src/components/3d/XPVortex.tsx`, `BadgePedestal3D.tsx`, `LevelUpExplosion.tsx`, `AvatarPreview3D.tsx`, `BadgePedestalBridge.tsx`, `CeremonyFXBridge.tsx`
- `src/lib/ceremonyMapping.ts`

**Files Modified (6):**
- `src/app/(dashboard)/profile/page.tsx` — Full enhancement
- `src/components/game/GameShell.tsx` — Gamification pipeline + XPPopupProvider
- `src/components/shared/CelebrationOverlay.tsx` — All 5 types, ARIA, reduceMotion
- `src/hooks/useGamification.ts` — cockpitBroadcast integration
- `src/components/3d/CeremonyFX.tsx` — LOD comment fix
- `src/components/3d/CockpitCanvas.tsx` — CeremonyFXBridge added

**Stage 5 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S5-CRIT-001 | CRITICAL | Resolved (Batch 1) |
| S5-CRIT-002 | CRITICAL | Resolved (Batch 1) |
| S5-HIGH-001 | HIGH | Resolved (Batch 2) |
| S5-HIGH-002 | HIGH | Resolved (Batch 2) |
| S5-HIGH-003 | HIGH | Resolved (Batch 2) |
| S5-HIGH-004 | HIGH | Resolved (Batch 2) |
| S5-HIGH-005 | HIGH | Resolved (Batch 2) |
| S5-HIGH-006 | HIGH | Resolved (Batch 1) |
| S5-HIGH-007 | HIGH | Resolved (Batch 2) |
| S5-WARN-001 | WARNING | Resolved (Batch 2/3) |
| S5-WARN-002 | WARNING | Resolved (Batch 2) |
| S5-WARN-003 | WARNING | Already resolved (S2-HIGH-002) |
| S5-WARN-004 | WARNING | Acknowledged (naming only, no code change) |
| S5-WARN-005 | WARNING | Resolved (Batch 3) |
| S5-INFO-001 | INFO | Resolved (Batch 4) |
| S5-INFO-002 | INFO | Confirmed working (no action needed) |

---

### Stage 4 — Batch 1: Audit Fixes / Code Cleanup (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Findings Addressed:**
- [x] S4-HIGH-001 — Already resolved (useApi.ts deleted in prior batch)
- [x] S4-HIGH-003 + S4-WARN-001 — Refactored 4 hooks to use centralized `apiFetch` from `src/lib/api.ts`
- [x] S4-WARN-005 — Fixed `as string` assertion in content/[slug]/page.tsx

**Files Modified (5):**
- `src/hooks/useProgress.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useContent.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useChildren.ts` — Removed local apiFetch, import from @/lib/api
- `src/hooks/useGamification.ts` — Removed local apiFetch, import from @/lib/api
- `src/app/(dashboard)/content/[slug]/page.tsx` — Safe Array.isArray check for params.slug

---

### Stage 4 — Batch 2: Camera Repositioning + Materials Upgrade (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Changes:**
- [x] Camera repositioned: `[0, 6.5, 7]` → `[0, 0.65, 1.1]` (cockpit seat, not overhead)
- [x] COCKPIT_GEOMETRY v3: arc 140° → 218°, radius 4.0 → 4.8, segments 256→288/128→144
- [x] ADAPTIVE_CURVATURE: ultraWide 155°→230°, desktop 140°→218°
- [x] CAMERA_PRESETS: all modes updated for tight-focus + added 'settings' mode
- [x] SPATIAL_CAMERA_PRESETS: all views tight-focus + added CONSOLE_CAMERA_PRESETS (left/right)
- [x] Created `src/lib/3d/cockpitMaterials.ts` — 7 material factories per vision JSON
- [x] Added explicit 3D positions: leftConsole, rightConsole, statusBar, centerViewport, HUD

**Files Created (1):**
- `src/lib/3d/cockpitMaterials.ts` — Material factory (alloy, panel, holographic, button, bezel, console, LED)

**Files Modified (4):**
- `src/lib/3d/cockpitConfig.ts` — COCKPIT_GEOMETRY v3, CAMERA_PRESETS, ADAPTIVE_CURVATURE
- `src/stores/cockpitStore.ts` — SPATIAL_CAMERA_PRESETS tight-focus + CONSOLE_CAMERA_PRESETS
- `src/components/3d/CockpitCanvas.tsx` — Initial camera position [0, 0.65, 1.1]
- `src/components/3d/CameraSystem.tsx` — Updated handoff comment

---

### Stage 4 — Batch 3: Full Geometry + Material Overhaul (2026-03-27)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Changes:**
- [x] CockpitPanels.tsx: v3 header, imports cockpitMaterials, 12 ribs (was 8), 768 rivets (was 512)
- [x] LEDRim.tsx: v3 header, 1500 ultra LEDs (was 1000), emissive 3.0 (was ~0.3), imports cockpitMaterials
- [x] SidePanels.tsx: Positions [-2.35, 0.25, -1.65] (was [-5.5, 0, -2]), chrome #a8b5c8 (was #2a2e3e), metalness 0.98 (was 0.92), reads positions from COCKPIT_GEOMETRY
- [x] StatusBar3D.tsx: v3 1M budget header, chrome #a8b5c8 metalness 0.98 roughness 0.12

**Files Modified (4):**
- `src/components/3d/CockpitPanels.tsx`
- `src/components/3d/LEDRim.tsx`
- `src/components/3d/SidePanels.tsx`
- `src/components/3d/StatusBar3D.tsx`

---

### Stage 3 Audit Fix — Batch 10: Security + COPPA + 3D Integration (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W

**Findings Addressed:**
- [x] S3-CRIT-001 — Added `/reset-password` to middleware public paths
- [x] S3-HIGH-001 — COPPA (Option B): Created `/api/auth/consent` endpoint, signup no longer sends consent prematurely
- [x] S3-HIGH-002 — Demo users: `sparkforge-demo-active` httpOnly cookie + middleware check
- [x] S3-WARN-001 — Auth layout `dpr={[1, 3]}` replaces inline `window.devicePixelRatio`
- [x] S3-WARN-002 — `AuthHoverContext` wires login card hover to `LoginPortal3D.isHovered`
- [x] S3-WARN-003 — Downgraded to INFO (no wrong path in docs)
- [x] 3D Integration Audit — 4 findings deferred to Stage 4 (setLabColor, Settings page, WormholeTransition, auth canvas)

**Files Created (2):**
- `src/app/api/auth/consent/route.ts` — COPPA consent endpoint
- (context in auth layout — inline, not separate file)

**Files Modified (7):**
- `src/middleware.ts` — `/reset-password` + demo cookie check
- `src/app/api/auth/demo/route.ts` — Sets `sparkforge-demo-active` cookie
- `src/app/api/auth/signup/route.ts` — Removed `coppaConsent`, sets `coppa_consent_at: null`
- `src/lib/validations.ts` — `SignupSchema` no longer requires `coppaConsent`, added `CoppaConsentSchema`
- `src/app/(auth)/signup/page.tsx` — Step 1 no coppaConsent, Step 3 calls `/api/auth/consent`
- `src/app/(auth)/layout.tsx` — `AuthHoverContext`, `isHovered` prop, `dpr={[1, 3]}`
- `src/app/(auth)/login/page.tsx` — Uses `useAuthHover()` context

---

### Stage 2 Audit Fix — Batch 9: Security + Type Safety + Config (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** Code changes — 5 source files modified

**Findings Addressed:**
- [x] S2-HIGH-001 — Added `verifyChildOwnership` to session end action (security: prevents session UUID enumeration)
- [x] S2-HIGH-002 — Defined `ProgressWithContent` type in badges route, removed 3x `as any`, 3 eslint-disable, 4 non-null assertions
- [x] S2-WARN-001 — Aligned Stripe env vars to `.env.example` names (`STRIPE_PLUS_MONTHLY_ID` format) in `tier-config.ts` + Stage 8 doc
- [x] S2-WARN-002 — Used `Anthropic.TextBlock` type guard + `catch (error: unknown)` in prompt-lab route
- [x] S2-WARN-003 — Replaced raw `req.json()` with `parseBody` + `z.discriminatedUnion` schema in sessions route
- [ ] S2-INFO-001 — Deferred (timezone validated but discarded — cosmetic)
- [ ] S2-INFO-002 — Deferred (all-labs childId not Zod-validated — cosmetic)

**Files Modified (5 source + 2 docs):**
- `src/app/api/sessions/route.ts` — Full rewrite: parseBody + discriminated union + ownership check
- `src/app/api/gamification/badges/route.ts` — ProgressWithContent type, no more as any or !
- `src/app/api/ai/prompt-lab/route.ts` — TextBlock type guard, catch error:unknown
- `src/lib/tier-config.ts` — Stripe env var names aligned to .env.example
- `docs/stage8-parent-dashboard/STAGE8_P3_v3FINAL_B.md` — Stripe env var names aligned
- `AUDIT_REPORT_3-25-2026.md` — All S2 findings marked resolved, remediation log updated
- `PROGRESS.md` — Batch 9 entry added

---

### Stage 1 Audit Fix — Batch A: Verification & Downgrade (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** No code changes — verification only

**Findings Addressed:**
- [x] S1-HIGH-002 — Downgraded to INFO: `useMediaQuery`/`useIsMobile` have zero active imports. Both removed per D3D-1. Comment-only references in 3 files.
- [x] S1-INFO-002 — Verified NOT dead code: `gameActive`/`setGameActive` still actively consumed by `useStationMode.ts` for mode derivation. Deferred to future `sceneStore` migration refactor.

**Files Modified (2 — documentation only):**
- `AUDIT_REPORT_3-25-2026.md` — Updated S1-HIGH-002 (downgraded), S1-INFO-002 (deferred), finding counts, Batch 7 remediation log
- `PROGRESS.md` — Added Batch A entry

---

### Stage 1 Audit Fix — Batch B: Stage Doc Updates (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-stage-1-audit-1dW5W
**Build Status:** Doc-only changes — no source code modified

**Findings Addressed:**
- [x] S1-WARN-003 — Fixed `COCKPIT_GEOMETRY_V2` → `COCKPIT_GEOMETRY` in stage doc (7 occurrences). Aligned segment counts to 20M upgrade. Added structural detail constants + missing bloom presets.
- [x] S1-WARN-004 — Replaced entire deviceStore Step 20a with D3D-1 desktop-ultra implementation. Updated hooks Step 21: marked useMediaQuery/useIsMobile as REMOVED. Updated file inventory.

**Files Modified (3):**
- `docs/stage1-foundation/STAGE1_Foundation_v2_PART2.md` — Steps 20a, 20c, 21, file inventory table
- `AUDIT_REPORT_3-25-2026.md` — S1-WARN-003 resolved, S1-WARN-004 resolved, finding counts final, Batch 8 remediation log
- `PROGRESS.md` — Added Batch B entry, status updated to COMPLETE

**Stage 1 Audit Summary — All Findings:**
| ID | Severity | Status |
|---|---|---|
| S1-CRIT-001 | CRITICAL | Resolved (Batch 6) |
| S1-HIGH-001 | HIGH | Resolved (Batch 1) |
| S1-HIGH-002 | HIGH→INFO | Downgraded (Batch 7) — no active imports |
| S1-WARN-001 | WARNING | Resolved (Batch 6) |
| S1-WARN-002 | WARNING | Resolved (Batch 6) |
| S1-WARN-003 | WARNING | Resolved (Batch 8) — stage doc updated |
| S1-WARN-004 | WARNING | Resolved (Batch 8) — stage doc updated |
| S1-INFO-001 | INFO | Expected — authStore expanded by Phase 5E |
| S1-INFO-002 | INFO | Deferred — gameActive still consumed by useStationMode |
| S1-INFO-003 | INFO | Expected — layout is Stage 10 version |
| S1-INFO-004 | INFO | Low impact — barrel files with optimizePackageImports |

---

### Phase 0 Audit Fix — Batch 2: TypeScript & ESLint Fixes (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Build Status:** PASS (npm run build succeeds, tsc --noEmit 0 errors)

**Findings Addressed:**
- [x] HIGH-001 — 63 genuine TypeScript errors fixed (was 229 pre-install, resolved to 63 post-install, now 0)
- [x] HIGH-005 — DemoGuard children prop (resolved by npm install restoring type definitions)
- [x] ESLint build errors — all unused imports removed from 17 component files
- [x] TSL shader eslint-disable — 19 shader files get legitimate `no-explicit-any` + `no-unused-vars` disables

**TypeScript Fixes (23 files):**
- Creature components (4 files): Fixed CreatureProps import path, added MoodConfig properties, added THREE namespace import
- TSL shader files (19 files): Fixed Node<> type mismatches with `as any` assertions, fixed `atan2` → `atan` import, fixed swizzle parameter types

**ESLint Fixes (17 files):**
- Removed unused imports: `useMemo`, `useFrame`, `Environment`, `MathUtils`, `Color`, `MeshStandardMaterial`, `vec2`, `vec4`, etc.
- Removed unused variables: `bars`, `cellSize`, `colWidth`, `dp`, `uvCoord`, `flameUV`, etc.
- Prefixed unused callback params with `_` where needed

**Results:**
- TypeScript errors: 63 → **0** (100% clean)
- Next.js build: **PASS** (compiled + 42 static pages generated)
- Total files modified: 40 (23 TS fixes + 17 ESLint fixes)

---

### Phase 0 Audit Fix — Batch 1: Environment & Dependencies (2026-03-26)

**Status:** COMPLETE
**Branch:** claude/fix-phase-0-issues-vvp0t
**Audit Source:** AUDIT_REPORT_3-25-2026.md

**Findings Addressed:**
- [x] CRIT-001 — `npm install` (with `--legacy-peer-deps` for nivo/React 19 conflict)
- [x] S1-HIGH-001 — Installed missing `three-mesh-bvh` and `troika-three-text`
- [x] CRIT-003 — Test infrastructure: vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, jsdom, msw, @playwright/test, @types/node
- [x] HIGH-003 — vitest.config.ts now resolves `vitest/config`
- [x] HIGH-004 — tests/setup.ts `global` resolves with @types/node

**Files Created (6):**
- `playwright.config.ts` — Playwright E2E config (chromium, localhost:3000)
- `src/mocks/handlers.ts` — MSW mock handlers for all 24 API routes
- `src/mocks/server.ts` — MSW server setup for Vitest (Node)
- `src/mocks/browser.ts` — MSW worker setup for browser tests
- `tests/e2e/health.spec.ts` — Basic E2E test stub (health check)
- `tests/unit/` and `tests/integration/` directories created

**Files Modified (1):**
- `docs/stage10-polish-deploy/STAGE10_Polish_Deploy_v2_PART2.md` — Added DEFERRED section for production rate limiter (WARN-003: Upstash Redis)

**Results After Batch 1:**
- TypeScript errors: 15,378 → **63** (99.6% reduction)
- Vitest: runnable (no test files yet)
- Playwright: configured
- MSW: 24 API route handlers ready
- Build: reaches lint/type-check phase (fails on pre-existing code errors — Batch 2 scope)

**Deferred:**
- WARN-003 (Redis rate limiter) — reference added to Stage 10 doc, requires Upstash credentials

---

### Creature Species + HDRI Asset Creation (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**HDRI Generation:**
- [x] Created Node.js HDRI generator (tools/generate-frost-prismatic-hdri.js)
- [x] Generated frost-prismatic.hdr (1024x512, Radiance RGBE, 2MB)
  - Dark studio (#0a0a14) + Blue key (#3B82F6) + Purple fill (#8B5CF6) + Teal rim (#06B6D4)
- [x] CockpitCanvas switched from drei 'night' preset to custom HDRI

**5 Creature Species (replacing 6 generic pets):**
- [x] creatureConfig.ts — Species configs, mood system, 6 evolution stages each
- [x] CreatureBase.tsx — Shared toon shading, CreatureWrapper, BlinkingEye, InnerGlow
- [x] BytelingCreature.tsx — Data & Binary theme (cubic shapes, blue #00BBFF)
- [x] SparkpawCreature.tsx — Neural Networks theme (spheres/tentacles, purple #AA66FF)
- [x] VoltkitCreature.tsx — Energy & Computing theme (triangles/spikes, green #00FF88)
- [x] CogsworthCreature.tsx — Robotics & Building theme (cylinders/gears, amber #FFAA44)
- [x] PixieCreature.tsx — Computer Vision theme (discs/lenses, cyan #06B6D4)

**Integration:**
- [x] PetCreature3D.tsx — Rewrote to use species dispatcher (no more GLB probing)
- [x] Pet3DScene.tsx — Added speciesId prop
- [x] PetTrainerGame.tsx — Replaced 6 generic pets with 5 AI-themed species
- [x] creatures/index.ts — Barrel export + CREATURE_COMPONENTS lookup map

**Files Created (10):**
- `tools/generate-frost-prismatic-hdri.js`
- `public/hdri/frost-prismatic.hdr`
- `src/config/creatureConfig.ts`
- `src/components/3d/creatures/CreatureBase.tsx`
- `src/components/3d/creatures/BytelingCreature.tsx`
- `src/components/3d/creatures/SparkpawCreature.tsx`
- `src/components/3d/creatures/VoltkitCreature.tsx`
- `src/components/3d/creatures/CogsworthCreature.tsx`
- `src/components/3d/creatures/PixieCreature.tsx`
- `src/components/3d/creatures/index.ts`

**Files Modified (3):**
- `src/components/3d/PetCreature3D.tsx` — Species-aware renderer
- `src/components/3d/Pet3DScene.tsx` — Added speciesId prop
- `src/components/games/PetTrainerGame.tsx` — 5 new species configs

**Species Summary:**
| Species | Theme | Shape | Color | Stages |
|---------|-------|-------|-------|--------|
| Byteling | Data & Binary | Cubic | #00BBFF | Data Seed → Bitlet → Bytepup → Datacrunch → Codec → Terabyte |
| Sparkpaw | Neural Networks | Spherical | #AA66FF | Synapse Egg → Noodlet → Synapper → Neurowhelp → Dendrite → Cortex |
| Voltkit | Energy & Computing | Triangular | #00FF88 | Spark Cell → Zaplet → Voltpup → Ampere → Gigawatt → Exaflare |
| Cogsworth | Robotics & Building | Cylindrical | #FFAA44 | Gear Capsule → Sprocket → Ratchet → Dynamo → Fabricator → Archimedes |
| Pixie | Computer Vision | Disc/Lens | #06B6D4 | Lens Seed → Peekaboo → Scanner → Focusfly → Spectra → Omniscient |

---

### Audit Report — R3F Section 4: Stack Alignment & Pitfalls (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-r3f-review-XQQ1z

**Plan A — TSL Shader Ports (9 GLSL → TSL):**
- [x] Batch 1: Noise utilities — simplex3DTSL, fbm4/6TSL, fbm3_4/6TSL, curlNoiseTSL, perlinNoise2DTSL, hash2TSL
- [x] Batch 2: auroraTSL, scanlineTSL, holographicTSL
- [x] Batch 3: energyFieldTSL (vertex + fragment), liquidMetalTSL (vertex + fragment), fireNoiseTSL (vertex + fragment)
- [x] Batch 4: crystallineLogoTSL (vertex + PBR fragment), electricVeinsTSL (fractal veins + propagation)
- [x] Batch 5: Barrel export index (src/shaders/tsl/index.ts) + WebGPUErrorBoundary component

**Plan B1 — Frame-Time Monitoring (Non-Invasive):**
- [x] Created useFrameTimeMonitor hook — 60-frame sample window, logs warnings > 20ms avg
- [x] Added FrameTimeMonitorInner component to CockpitCanvas (dev-only)
- [x] Added Plan B2 adaptive degradation reference to CLAUDE.md Section 9.1

**Plan C — Asset Preloading:**
- [x] Created src/lib/3d/preloadAssets.ts — wires GLTF_PRELOAD_PATHS + HDRI preloading
- [x] Module-level import in CockpitCanvas triggers preloading on first render
- [x] Note: HDRI file (/public/hdri/frost-prismatic.hdr) pending creation — uses 'night' preset fallback

**Files Created (14):**
- `src/shaders/tsl/noiseUtils.ts` — Shared TSL noise functions (simplex3D, fbm, curl, perlin)
- `src/shaders/tsl/auroraTSL.ts` — Aurora void background (Decision 2.5)
- `src/shaders/tsl/scanlineTSL.ts` — CRT scanline overlay (Decision 2.3)
- `src/shaders/tsl/holographicTSL.ts` — Holographic card diffraction (Decision 4.3)
- `src/shaders/tsl/energyFieldTSL.ts` — Streak shield vertex + fragment (Decision 4.5)
- `src/shaders/tsl/liquidMetalTSL.ts` — Badge levitate vertex + fragment (Decision 4.2)
- `src/shaders/tsl/fireNoiseTSL.ts` — Diamond streak flame vertex + fragment
- `src/shaders/tsl/crystallineLogoTSL.ts` — Hero Animation Phase 2 vertex + PBR fragment
- `src/shaders/tsl/electricVeinsTSL.ts` — Hero Animation Phase 4 fractal veins
- `src/shaders/tsl/index.ts` — Barrel export for all TSL shader ports
- `src/components/3d/WebGPUErrorBoundary.tsx` — TSL compilation error boundary with WebGL2 fallback
- `src/hooks/useFrameTimeMonitor.ts` — Non-invasive frame-time monitoring (dev-only)
- `src/lib/3d/preloadAssets.ts` — Centralized GLTF + HDRI preloading

**Files Modified (2):**
- `src/components/3d/CockpitCanvas.tsx` — Added FrameTimeMonitorInner + asset preload import
- `CLAUDE.md` — Added Plan B1/B2 performance monitoring reference to Section 9.1

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

**Audit Section 4 Item Status:**
| Item | Status | Notes |
|------|--------|-------|
| 4.1 r3f-perf monitoring | ALREADY FIXED (prior audit) | r3f-perf installed, lazy-loaded, dev-only |
| 4.2 GLSL → TSL migration | FIXED | 9 shaders ported + error boundary |
| 4.3 CanvasTexture leaks | ALREADY FIXED (prior audit) | All 3 files have disposal |
| 4.4 GPU tier degradation | FIXED (B1) | Frame-time monitor + B2 reference |
| 4.5 Asset preloading | FIXED | preloadAssets.ts wired in CockpitCanvas |
| 4.6 leva in prod deps | ALREADY FIXED (prior audit) | Moved to devDependencies |

---

### Audit Report — R3F Section 3: Post-Processing & UI Zones (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-r3f-postprocessing-l178F

**Batch 1 — GPU Memory + Dev Monitoring:**
- [x] Item 1: AiSpyGame.tsx — Removed independent Canvas (D3D-B1 violation). Game 3D content now injected via sceneStore.setGameSceneContent(). Added gameSceneContent state to sceneStore.ts. CockpitCanvas reads from store as fallback.
- [x] Item 2: CanvasTexture disposal — AgentPipeline3D.tsx, LabStructure3D.tsx already had disposal (prior audit). Added missing disposal to PetCreature3D.tsx FallbackOrb + GLBPetModel components.
- [x] Item 3: r3f-perf — Already installed (^7.2.3) and integrated in CockpitCanvas with React.lazy + dev-only guard. No changes needed.

**Batch 2 — Post-Processing Enhancements + Html Overlays:**
- [x] Item 4: Adaptive bloom threshold — PostProcessingStack.tsx bloom threshold now shifts per scene (0.3 celebrations, 0.4 transitions/hero, 0.5 spatial, 0.8 gameplay, 0.6 cockpit default)
- [x] Item 5: Per-lab color grading — Added HueSaturation + BrightnessContrast effects. 10 per-lab color profiles (hue, saturation, brightness, contrast). Ceremony warm amber override. Vignette + BarrelDistortion now scene-reactive. Effect count: 7 → 9 always-on.
- [x] Item 6: drei Html 3D-anchored overlays:
  - HolographicLabMap.tsx: Lab name + completion % tooltip on hover (glassmorphism card, lab-colored border)
  - AmbientNPCs.tsx: Personality name badges above bots (pill badge, neon text)
  - CeremonyFX.tsx: Animated ceremony title popup ("Level Up!", "Badge Earned!", etc.) with float-up-and-fade CSS animation
  - WormholeTransition.tsx: "Entering {Lab Name}" label at tunnel midpoint with fade-in/out gated to transition progress

**Files Modified (10 total):**
- `src/components/3d/PostProcessingStack.tsx` — 9 effects, adaptive bloom, color grading, reactive vignette/barrel
- `src/components/3d/CockpitCanvas.tsx` — r3f-perf + gameSceneContent from store
- `src/components/3d/HolographicLabMap.tsx` — Html tooltip overlay
- `src/components/3d/AmbientNPCs.tsx` — Html name badges
- `src/components/3d/CeremonyFX.tsx` — Html ceremony popup
- `src/components/3d/WormholeTransition.tsx` — Html "Entering Lab" label
- `src/components/3d/AgentPipeline3D.tsx` — CanvasTexture disposal
- `src/components/3d/LabStructure3D.tsx` — CanvasTexture disposal
- `src/components/3d/PetCreature3D.tsx` — DataTexture disposal (2 components)
- `src/components/games/AiSpyGame.tsx` — Removed Canvas, uses sceneStore
- `src/stores/sceneStore.ts` — Added gameSceneContent state + selector
- `package.json` — r3f-perf devDependency

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

---

### Audit Report — Suggestions (2026-03-25)

**Status:** COMPLETE
**Branch:** claude/audit-report-suggestions-oEzxB

**Batch 1 — Canvas DPR + React.memo:**
- [x] Suggestion #12: CockpitCanvas.tsx — Simplified dpr to [1, 3], letting AdaptiveDpr manage runtime values
- [x] Suggestion #13: SKIPPED — frameloop="always" is intentional per D3D-5 mandate (ambient cockpit animations)
- [x] Suggestion #14: Wrapped SpatialDashboardContent, AmbientNPCs, DynamicEnvironment with React.memo

**Batch 2 — Design System Hex Replacement:**
- [x] Suggestion #15: Replaced hardcoded hex values with Tailwind semantic tokens in 3 files:
  - ParentLoadingSkeleton.tsx: bg-[#111118]/80 → bg-surface-card/80 (4 instances)
  - UpgradePrompt.tsx: 7 hex replacements (surface-card, neon-orange, neon-amber tokens)
  - FutureForgeGame.tsx: bg-surface-base, text-lab-10, via-lab-10, text-neon-amber tokens
  - PaywallModal.tsx: SVG stroke="#FFAA44" left as-is (SVG attribute, no Tailwind equivalent)

**Batch 3 — Layout Fix + GLTF Preload:**
- [x] Suggestion #16: Fixed DemoGuard JSX indentation in dashboard layout (logic was correct, formatting misleading)
- [x] Suggestion #17: Added GLTF_PRELOAD_PATHS registry in lib/3d/materials.ts with documented usage pattern

**TypeScript validation:** PASS (0 new errors; pre-existing module resolution errors from missing node_modules unchanged)

---

### Audit Report — Critical Findings (2026-03-24)

**Status:** COMPLETE
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 1 — GPU Memory/Allocation Fixes:**
- [x] Critical #1: SidePanels.tsx — Shared blip geometry + material, dynamic props in useFrame
- [x] Critical #2: HolographicLabMap.tsx — Added useEffect disposal for ConnectionBeam geometry/material
- [x] Critical #3: PostProcessingStack.tsx — useRef for chromatic Vector2 instead of useMemo

**Batch 2 — Store Subscription Optimization:**
- [x] Critical #4a: CockpitCanvas.tsx — 10 individual selectors replacing full destructure
- [x] Critical #4b: useSpatialNavigation.ts — 7 individual selectors
- [x] Critical #4c: SpatialOverlay.tsx — 3 individual selectors

**TypeScript validation:** PASS (0 new errors; 14 pre-existing TSL shader type errors unchanged)

### Audit Report — Important Findings (2026-03-24)

**Status:** MOSTLY COMPLETE (2 deferred to dedicated PRs)
**Branch:** claude/audit-critical-findings-xu1H3

**Batch 3+4 — Quick Wins + Performance:**
- [x] Important #6: StatusBar3D.tsx — Rewrote material factories to use ref + useFrame
- [x] Important #7: CockpitPanels.tsx — Immediate geometry disposal via ref on dependency change
- [x] Important #9: package.json — Moved leva to devDependencies
- [x] Important #12: QueryProvider.tsx — Wrapped ReactQueryDevtools in NODE_ENV guard

**Batch 5 — Dependency Cleanup + Design System:**
- [x] Important #8: Removed recharts, replaced with @nivo/line in NeuralBuilderGame.tsx (~200KB savings)
- [x] Important #10: Added DURATION/EASING/TRANSITION presets to existing animations.ts

**Deferred to Dedicated PRs:**
- [ ] Important #5: `import * as THREE` → named imports (103 files, large-scope refactor)
- [ ] Important #11: Sub-scale font sizes text-[9px]/text-[10px] → text-xs (306 occurrences, 53 files)
- [ ] Important #13: Duplicate particle system extraction (architectural refactor, 3 files)

**TypeScript validation:** PASS (0 new errors)

---

### Local Development Environment Setup (March 21, 2026)

**Status:** NOT YET COMPLETED
**Branch:** claude/sparkforge-stage1-foundation-LBQEo

**Environment:**
- Node.js v25.8.1, npm 11.11.0
- `npm install --legacy-peer-deps` — all dependencies installed
- `.env.local` — created with placeholder values (keys not yet configured)
- `npm run build` — compiles successfully (lint cleanup in progress)

**Note:** All prior code in this repo was written directly on GitHub (not built or tested locally). Local development begins now from Stage 1 Phase 1. The project is at **0% built/developed** — no stages have been locally validated or run. During Build, Claude Code shall strictly clone repo locally, then begin auditing/implementing code starting with stage 1. Code should not be re-written, it should just be audited, and fixed if errors occur. 
**Note:** During stage by stage development it is critical to continuously scan local repo/ file database for any and all applicable code/ critical documentation when developing stage by stage, starting with stage 1.
---

### Build Execution Plan (30 Phases)

- [ ] Phase 1 — Stage 1 Part 1: Foundation config & structure (verified + fixed 2026-03-22)
- [ ] Phase 2 — Stage 1 Part 2: TypeScript source files (verified + fixed 2026-03-22)
- [ ] Phase 3 — Stage 2 Parts 1-4: Database & API (HS-1, HS-7)
- [ ] Phase 4 — Stage 3 Parts 1-2: Auth & Layout
- [ ] Phase 5 — Stage 3 Part 3: Station Frame (v3-FINAL)
- [ ] Phase 5A — Hero Animation Part 1: Stores, infrastructure, shaders
- [ ] Phase 5B — Hero Animation Part 2: Particles, audio, orchestrator (HS-5)
- [ ] Phase 5C — Cockpit Architecture Part 1: Canvas, camera, panels
- [ ] Phase 5D — Cockpit Architecture Part 2: Spatial dashboard, transitions (HS-5, HS-9)
- [ ] Phase 6 — Stage 4 Parts 1+3: Core pages
- [ ] Phase 7 — Stage 4 Part 2: v3-FINAL
- [ ] Phase 8 — Stage 5 Part 1: Gamification & profile
- [ ] Phase 9 — Stage 5 Parts 2-3: v3-FINAL
- [ ] Phase 10 — Stage 6B: Flagship game (HS-8)
- [ ] Phase 11 — Stage 6C: Flagship game
- [ ] Phase 12 — Stage 6D: Flagship game
- [ ] Phase 13 — Stage 6E: Flagship game
- [ ] Phase 14 — Stage 6F: Flagship game
- [ ] Phase 15 — Stage 7A: 9 games
- [ ] Phase 16 — Stage 7B: 4 games
- [ ] Phase 17 — Stage 7C: 4 games (v2)
- [ ] Phase 18 — Stage 7C: 2 games (v3)
- [ ] Phase 19 — Stage 7D: 5 games
- [ ] Phase 20 — Stage 7E: 3 games
- [ ] Phase 21 — Stage 7F: 3 games
- [ ] Phase 22 — Stage 7 Shared systems
- [ ] Phase 23 — Stage 8 Parts 1-2: Parent dashboard (HS-2)
- [ ] Phase 24 — Stage 8 Part 3: v3-FINAL
- [ ] Phase 25 — Stage 9 Parts 1-3: Content agent (HS-3)
- [ ] Phase 26 — Stage 10 Parts 1-2: Polish & deploy (HS-4)

---

### Completed
- 

### Current Issues
_(none)_

### Blocked On
_(none)_

### Discrepancies Log (March 22, 2026)

**Phase 1 fixes:**
- `next.config.js` → `next.config.ts`: Replaced Stage 10 production config with Stage 1 starter per build order. Added Sentry wrapper, GLSL loaders, Turbopack rules.
- `.gitignore`: Added missing test/Sentry entries (test-results/, playwright-report/, blob-report/, .sentryclirc).
- Created 8 missing directories: public/images, public/sounds/cockpit, public/fonts, public/models/pets, tests/unit, tests/integration, tests/e2e, tests/mocks.

**Phase 2 fixes:**
- `src/types/index.ts`: Added missing CPA v2.0 types (CockpitSkin, SpatialView, ConsoleType, CeremonyType, HUDDataMode, CameraTarget, HexClusterData).
- `src/lib/animations.ts`: Fixed import from `framer-motion` to `motion/react` per Enhancement 8.1.
- Created 5 missing files: `src/stores/cockpitAtoms.ts`, `src/lib/3d/webgpuDetect.ts`, `src/hooks/useAdaptiveCockpit.ts`, `vitest.config.ts`, `tests/setup.ts`.

### Desktop-First 3D Overhaul (D3D) — March 23, 2026

**Status:** PLAN COMPLETE (4 parts, 20 decision locks, 13 files)
**Branch:** `claude/3d-immersive-overhaul-plan-JyUZL`

| Part | Commit | Files | Decision Locks | Status |
|------|--------|-------|----------------|--------|
| A — Foundation Cleanup | `db18293` | 1 doc | D3D-1 through D3D-9 (9) | COMMITTED |
| B — Single Canvas & Iris | `93cd13e` | 4 src + 1 doc | D3D-B1 through D3D-B6 (6) | COMMITTED |
| C — Post-FX & Audio | `d923968` | 4 src + 1 doc | D3D-C1 through D3D-C5 (5) | COMMITTED |
| D — Doc Updates & Roadmap | `6d7dc6d` | 1 doc + CLAUDE.md v6.0 | 0 | Phase 4A COMMITTED, 4B COMMITTED |

**Source files created (8):**
- `src/stores/sceneStore.ts` — Centralized scene management
- `src/components/3d/SceneRouter.tsx` — Scene group visibility controller
- `src/components/3d/MechanicalIris.tsx` — Signature iris transition (530 lines)
- `src/hooks/useIrisTransition.ts` — Transition orchestration hook
- `src/components/3d/PostProcessingStack.tsx` — 7 always-on effects
- `src/lib/audio/irisAudio.ts` — Iris procedural audio
- `src/hooks/useParallaxMouse.ts` — Mouse parallax tracking
- `src/hooks/useInteractiveSurface.ts` — Hover-reactive surfaces

**Modified files (3):**
- `src/components/3d/CockpitCanvas.tsx` — Persistent canvas, SceneRouter, removed CSS fallbacks
- `src/components/game/GameShell.tsx` — sceneStore integration
- `src/components/3d/CameraSystem.tsx` — Game camera mode

**Key architecture changes:**
- Single persistent R3F Canvas (never unmounts, even during gameplay)
- Mechanical iris transition replaces canvas unmount pattern
- sceneStore centralizes visibility (replaces fragmented uiStore.gameActive + cockpitStore.heroPhase)
- 7 post-processing effects always-on with scene-reactive multipliers
- Procedural iris audio (Web Audio API)
- Mouse parallax + interactive surface hooks

### D3D Phase 4B — Error Analysis & Discrepancy Catalog (March 24, 2026)

#### Stage Documents Requiring D3D Updates (During Build)

These discrepancies exist between existing stage docs and the D3D architecture. Each will be resolved when its stage is built — NOT pre-emptively.

| Stage Doc | Discrepancy | Resolution |
|-----------|-------------|-----------|
| All 35 game stage docs (6B–7F) | Contain `useIsMobile()` pattern and conditional 3D rendering | Remove during build per D3D-1. Games render 3D unconditionally. |
| All 3D component stage docs | Import `useLOD` / `LODWrapper` / `useLODContext` | Remove during build, hardcode ultra-quality values (D3D-2). |
| Stage 3 Part 3 | Creates StationFrame with separate Canvas | Use CockpitCanvas with SceneRouter instead (D3D-B1). |
| Stage 6B–7F (all games) | Games create own `<Canvas>` for 3D scenes | Render as `<group>` inside CockpitCanvas via GameShell (D3D-B3). |
| Stage 4 Part 1 | `useApi.ts` references | BUG-1 already documented, no D3D impact. |
| CockpitCanvas stage docs (5C–5D) | References `profile.bloomEnabled` conditional rendering | Remove conditional — PostProcessingStack is always-on (D3D-5, D3D-C1). |
| GameShell stage docs | References `setGameActive(true/false)` from uiStore | Replace with `sceneStore.enterGame`/`exitGame` (D3D-B5). |
| Hero Animation docs (5A–5B) | HeroAnimation may create separate Canvas | Must render as scene within CockpitCanvas (D3D-B1). |
| Login 3D docs (5E–5F) | LoginPortal3D creates own Canvas | Login page is pre-auth — this Canvas is acceptable (outside CockpitCanvas scope). No D3D change needed. |

#### Files With Stale References (Fix During Stage Build)

These files contain references that D3D supersedes. They are NOT broken (old code still works), but will be updated during their respective stage builds:

| Pattern | Occurrences | Files Affected | D3D Replacement |
|---------|------------|----------------|----------------|
| `useIsMobile` | ~401 | 84 files | Remove entirely (D3D-1) |
| `useLOD` / `LODWrapper` / `useLODContext` | ~30 | 15 files | Remove, hardcode ultra (D3D-2) |
| `GenericGameParticles` | ~35 | 35 game files | Remove CSS fallback (D3D-1) |
| `setGameActive` | ~4 | GameShell, uiStore, CockpitCanvas | Use `sceneStore.enterGame`/`exitGame` (D3D-B5) |
| `profile.bloomEnabled` | ~3 | CockpitCanvas, 2 config files | Always true — remove conditional (D3D-5) |
| `DeviceSelectionModal` | ~2 | Provider, settings page | Remove entirely (D3D-1) |
| `useAdaptiveLOD` | ~5 | LODWrapper, 3D game components | Remove entirely (D3D-2) |
| `lodSphere` / `lodBox` | ~10 | 3D components | Replace with hardcoded max segments (D3D-2) |

#### Non-Breaking Deprecations

These patterns still function but are superseded by D3D architecture:

| Deprecated | Replacement | Impact |
|-----------|-------------|--------|
| `uiStore.gameActive` | `sceneStore.activeScene === 'game'` | uiStore flag still exists but no longer read by CockpitCanvas |
| `cockpitStore.heroPhase` | `sceneStore.activeScene === 'hero'` | cockpitStore retains `heroPhase` for HeroAnimation internal state machine |
| `WormholeTransition` (cockpit-to-game) | `MechanicalIris` | WormholeTransition retained for lab-to-lab transitions within spatial dashboard |
| Inline postprocessing in CockpitCanvas | `PostProcessingStack` component | Old inline EffectComposer replaced by extracted component (D3D-C1) |
| `deviceStore.profile.bloomEnabled` | Always `true` | Profile property still exists but is always `true` |
| `deviceStore.hasSelected` | Always `true` | No device selection flow exists |

#### Import Graph Changes

| Import Change | Affected Consumers | Notes |
|---------------|-------------------|-------|
| `sceneStore` added | CockpitCanvas, SceneRouter, GameShell, MechanicalIris, PostProcessingStack | New central state for scene management |
| `useLOD` removed | All 3D game components, LODWrapper, GameShell | Consumers must remove import and inline ultra values |
| `useIsMobile` removed | 84 files across games, layouts, 3D components | Consumers must remove import and conditional blocks |
| `GenericGameParticles` removed | 35 game files | Consumers must remove import and mobile fallback rendering |
| `PostProcessingStack` added | CockpitCanvas | Single consumer, replaces inline effects |
| `irisAudio` added | MechanicalIris (via useIrisTransition) | Procedural audio for iris open/close |

### Section 4.2 — Procedural Environment Generation (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/procedural-environment-generation-8glJx`

**Architecture:** ProceduralEnvironmentGenerator orchestrates 5 sub-generators (Terrain, SkyDome, Fog, Lighting, Props) driven by 10 lab theme profiles and 3 tier configs. All 3 base environment wrappers (Standard, FL-Lite, Flagship) refactored to delegate internally — zero breaking changes to 35 existing game environments.

| Batch | Commit | Files | Status |
|-------|--------|-------|--------|
| 1 — Core config + sub-generators | `9269743` | 6 created (proceduralConfig.ts + 5 procedural/*.tsx) | COMMITTED |
| 2 — Generator + integration | `d554608` | 2 created + 4 modified (generator, index, 3 base wrappers) | COMMITTED |
| 3 — Documentation updates | — | 3 modified (PROGRESS.md, CLAUDE.md, PartD.md) | COMMITTED |

**Files created (8):**
- `src/lib/3d/proceduralConfig.ts` — 10 lab themes, 3 tier configs, seeded RNG, type definitions
- `src/components/3d/environments/procedural/ProceduralTerrain.tsx` — Seeded FBM noise terrain + grid floor
- `src/components/3d/environments/procedural/ProceduralSkyDome.tsx` — Gradient sky, star field, aurora
- `src/components/3d/environments/procedural/ProceduralFog.tsx` — 5 fog behaviors (drift/sparkle/swirl/pulse/rise)
- `src/components/3d/environments/procedural/ProceduralLighting.tsx` — Auto-scaled lighting rig
- `src/components/3d/environments/procedural/ProceduralProps.tsx` — 10 geometry types, instanced scatter
- `src/components/3d/environments/procedural/index.ts` — Barrel export
- `src/components/3d/environments/ProceduralEnvironmentGenerator.tsx` — Main orchestrator

**Files modified (4):**
- `src/components/3d/environments/StandardEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='standard')
- `src/components/3d/environments/FLLiteEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='fl-lite')
- `src/components/3d/environments/FlagshipEnvironmentBase.tsx` — Wrapper delegates to procedural (tier='flagship')
- `src/components/3d/environments/index.ts` — Added ProceduralEnvironmentGenerator export

**Key decisions:**
- Q1: Replace base wrappers (Option B) — procedural system is internal, external API unchanged
- Q2: 10 lab theme profiles approved (digital-detection through quantum-frontier)
- Q3: Game tier only (Option A) — triangle budget scales by Standard/FL-Lite/Flagship

### Section 4.1 — Near-Term Enhancements (March 24, 2026)

**Status:** COMPLETE
**Branch:** `claude/build-section-4.1-CQSdv`
**Source:** `docs/enhancements/DESKTOP_FIRST_3D_OVERHAUL_PartD.md` Section 4.1

All 7 near-term enhancements from the D3D roadmap have been implemented:

| Enhancement | ID | Effort | Status | Commit |
|------------|-----|--------|--------|--------|
| WebGPU Shader Ports | A | Medium | COMPLETE | `f5f3519` |
| Per-Game Camera Presets | B | Low | COMPLETE | `378b91c` |
| Iris Audio Integration | C | Low | COMPLETE | `710714b` |
| CockpitCanvas Parallax | D | Low | PRE-EXISTING | (already wired in D3D Part C) |
| Interactive Surface Deployment | E | Medium | COMPLETE (stubs) | `80f1d2f` |
| Transition Sound Variations | F | Low | COMPLETE | `710714b` |
| Camera Shake on Events | G | Low | COMPLETE | `710714b` |

**Files created (14):**
- `src/shaders/labPatterns/tsl/shared.ts` — TSL shared utilities (rand2D, simplex2D)
- `src/shaders/labPatterns/tsl/codeLab.ts` — Lab 1 TSL pattern
- `src/shaders/labPatterns/tsl/dataLab.ts` — Lab 2 TSL pattern
- `src/shaders/labPatterns/tsl/neuralLab.ts` — Lab 3 TSL pattern
- `src/shaders/labPatterns/tsl/createLab.ts` — Lab 4 TSL pattern
- `src/shaders/labPatterns/tsl/agentLab.ts` — Lab 5 TSL pattern
- `src/shaders/labPatterns/tsl/ethicsLab.ts` — Lab 6 TSL pattern
- `src/shaders/labPatterns/tsl/visionLab.ts` — Lab 7 TSL pattern
- `src/shaders/labPatterns/tsl/languageLab.ts` — Lab 8 TSL pattern
- `src/shaders/labPatterns/tsl/buildLab.ts` — Lab 9 TSL pattern
- `src/shaders/labPatterns/tsl/frontierLab.ts` — Lab 10 TSL pattern
- `src/shaders/labPatterns/tsl/index.ts` — Barrel export with lookup helpers
- `src/lib/3d/cameraShake.ts` — Camera shake controller with event presets
- `src/lib/3d/interactiveSurfaceConfig.ts` — Cockpit interactive surface presets

**Files modified (5):**
- `src/lib/audio/irisAudio.ts` — Lab color audio profiles (10 colors → frequency/filter variations)
- `src/hooks/useIrisTransition.ts` — Integrated iris audio lifecycle (was in CockpitCanvas)
- `src/components/3d/CameraSystem.tsx` — Per-game camera presets + shake offset
- `src/components/3d/CockpitCanvas.tsx` — Game preset lookup, removed redundant audio code
- `src/config/gameRegistry.ts` — Added cameraPreset field to all 35 games

---

### Stage 10 Audit Fixes (2026-03-29)

**Status:** COMPLETE
**Branch:** `claude/stage-10-audit-fixes-Ax92m`
**Source:** `AUDIT_REPORT_3-25-2026.md` — Stage 10 section (2 CRITICAL, 7 HIGH, 5 WARNING, 3 INFO)

**Batch 1 — CSP + Security Headers (S10-CRIT-001, S10-HIGH-001, BUG-10D):**
- [x] Added `Content-Security-Policy` header in `next.config.ts` with `connect-src` for Supabase, Sentry, Vercel analytics, Stripe, Anthropic
- [x] Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Added `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] Added `Strict-Transport-Security` (HSTS) with 2-year max-age + preload
- [x] Added immutable caching headers for `/_next/static/` assets

**Batch 2 — Sentry Error Reporting (S10-HIGH-002, S10-HIGH-003):**
- [x] `ErrorBoundary.tsx` — Added `Sentry.captureException` in `componentDidCatch`
- [x] `error.tsx` — Added `Sentry.captureException` in `useEffect`

**Batch 3 — Environment Validation (S10-HIGH-007):**
- [x] Created `src/lib/env.ts` with Zod schema for all required/optional env vars
- [x] Validates at module import: NEXT_PUBLIC_SUPABASE_URL (required), NEXT_PUBLIC_SUPABASE_ANON_KEY (required), Stripe/Anthropic/Sentry keys (optional with graceful fallback)

**Batch 4 — Accessibility Store (S10-WARN-001):**
- [x] Added `screenReader: boolean` + `toggleScreenReader()` to `accessibilityStore.ts`
- [x] Now matches CLAUDE.md Section 14 specification

**Batch 5 — PWA Offline Support (S10-HIGH-004, S10-HIGH-005):**
- [x] Created `public/sw.js` — Cache-first for static assets, network-first for navigation, offline fallback
- [x] Created `src/app/offline/page.tsx` — Frost-Prismatic styled offline page with retry button
- [x] Service worker registered in `A11yProvider` on client mount

**Batch 6 — OpenDyslexic Fonts (S10-HIGH-006):**
- [x] Downloaded `OpenDyslexic-Regular.woff` and `OpenDyslexic-Bold.woff` to `public/fonts/`
- [x] Updated `globals-a11y.css` `@font-face` from woff2 to woff format

**Batch 7 — Theme Color (S10-WARN-003):**
- [x] Dual theme-color retained as intentional — supports a11y light mode toggle (S10-INFO-003)
- [x] No code change needed; documented as design decision

**PWA Branded Icons (S10-CRIT-002, S10-WARN-005):**
- [x] Created `scripts/generate-pwa-icons.mjs` — Sharp-based icon generator with crystalline glassmorphic SparkForge branding
- [x] Generated `icon-512.png` (512×512), `icon-192.png` (192×192), `apple-touch-icon.png` (180×180), `favicon.ico`/`favicon.png` (32×32), `og-image.png` (1200×630)
- [x] Design: Deep void (#0A0E16) background, aurora gradients, chrome bezel ring, neon blue (#00BBFF) "SF" monogram with glassmorphic glow, HUD accent dots

**Files Created (7):**
- `scripts/generate-pwa-icons.mjs`
- `public/icon-512.png`, `public/icon-192.png`, `public/apple-touch-icon.png`
- `public/favicon.ico`, `public/favicon.png`, `public/og-image.png`
- `public/sw.js`
- `src/app/offline/page.tsx`
- `src/lib/env.ts`
- `public/fonts/OpenDyslexic-Regular.woff`, `public/fonts/OpenDyslexic-Bold.woff`

**Files Modified (5):**
- `next.config.ts` — CSP + security headers + static caching
- `src/components/ui/ErrorBoundary.tsx` — Sentry reporting
- `src/app/error.tsx` — Sentry reporting
- `src/stores/accessibilityStore.ts` — screenReader field
- `src/components/accessibility/A11yProvider.tsx` — SW registration
- `src/app/globals-a11y.css` — OpenDyslexic woff format fix

**Audit Finding Resolution Summary:**

| Finding | Severity | Status |
|---------|----------|--------|
| S10-CRIT-001 (No CSP) | CRITICAL | RESOLVED |
| S10-CRIT-002 (PWA icons missing) | CRITICAL | RESOLVED |
| S10-HIGH-001 (No security headers) | HIGH | RESOLVED |
| S10-HIGH-002 (ErrorBoundary no Sentry) | HIGH | RESOLVED |
| S10-HIGH-003 (error.tsx no Sentry) | HIGH | RESOLVED |
| S10-HIGH-004 (No service worker) | HIGH | RESOLVED |
| S10-HIGH-005 (No offline page) | HIGH | RESOLVED |
| S10-HIGH-006 (OpenDyslexic fonts missing) | HIGH | RESOLVED |
| S10-HIGH-007 (No env validation) | HIGH | RESOLVED |
| S10-WARN-001 (a11y store mismatch) | WARNING | RESOLVED |
| S10-WARN-002 (console.log pricing) | WARNING | PREVIOUSLY RESOLVED |
| S10-WARN-003 (Light theme-color) | WARNING | DOCUMENTED (intentional) |
| S10-WARN-004 (error.tsx duplicate) | WARNING | RESOLVED (via S10-HIGH-003) |
| S10-WARN-005 (Missing OG image) | WARNING | RESOLVED |
| S10-INFO-001 (Seed script logs) | INFO | ACCEPTABLE |
| S10-INFO-002 (No TODO/FIXME) | INFO | CLEAN |
| S10-INFO-003 (Light/dark toggle) | INFO | DOCUMENTED (intentional a11y) |

### Code Review Notes
_(none yet)_

---

## Full Code Audit — March 30, 2026

### Audit Scope
- **497 source files** in src/
- **127 documentation files** in docs/
- **18 SQL files** in sql/
- **Config, scripts, tools** at repo root
- **6 parallel audit agents** covering: Routes & API, Components, Stores/Hooks/Types, Stage Documents, Config/SQL/Scripts, Cross-Cutting Concerns

### Issues Found: 154 total
| Severity | Count | Status |
|----------|-------|--------|
| Critical | 21 | ✅ All fixed |
| High | 42 | ✅ All fixed |
| Medium | 52 | ✅ All fixed |
| Low | 39 | ✅ All fixed |

### Batches Completed (10 total)
1. **Batch 1** — Critical Security + Missing Functionality (7 issues)
2. **Batch 2** — D3D Overhaul Propagation (7 issues)
3. **Batch 3** — Triangle Budgets + SQL Merge (7 issues)
4. **Batch 4** — Data Inconsistencies (12 issues)
5. **Batch 5a** — Architecture + Tailwind v4 Migration (6 issues)
6. **Batch 5b** — Parent Dashboard Pages Created (2 issues, 1125 lines new)
7. **Batch 6** — Docs Drift + Performance (17 issues)
8. **Batch 7** — Medium Code Quality (18 issues)
9. **Batch 8** — Stage Doc Deprecated Patterns (8 files updated)
10. **Batch 9** — Low Priority Cleanup (10 issues)

### Key Changes Summary
- Security: COPPA consent JWT validation, SQL security fixes, demo cookie cleanup
- Missing functionality: PATCH /api/auth/me, postprocessing package, 2 parent dashboard pages
- D3D compliance: Removed deprecated gameActive/LOD/mobile code from 15+ source files
- Data: Fixed all lab colors, 5 age band mismatches, centralized lab config
- Architecture: Tailwind v4 migration, SSR-safe localStorage, middleware validation
- SQL: Merged duplicate seed files, unified RUN_ORDER.md
- Docs: Archived obsolete mobile plans, updated triangle budgets, fixed stage doc imports
- Performance: Lazy Tone.js, optimized store subscriptions, parallel badge queries

### Validation
- TypeScript (`npx tsc --noEmit`): ✅ PASS — zero errors
- All 35 game components present: ✅ VERIFIED
- All 3D registry components exist: ✅ VERIFIED
- Import graph clean (no broken imports): ✅ VERIFIED
- No deprecated fonts (Fredoka/Nunito): ✅ VERIFIED
- No deprecated mobile patterns in source: ✅ VERIFIED

---

## Supabase Integration Round — April 24, 2026

### Scope
Reconcile live Supabase project state with the canonical migrations in `sql/`
+ `supabase/migrations/`. Apply 26 outstanding migrations and 5 novel
hardening patches (31 tracked migrations total). Generate TypeScript types
and version-control everything.

### Phase summary

| Phase | Migrations | Verification |
|---|---|---|
| **A — Extensions + search_path** | `enable_pg_cron`, `enable_pgaudit`, `move_pgaudit_to_extensions`, `harden_function_search_paths` | ✓ pg_cron@1.6.4, pgaudit@17.1, 5 functions pinned, 0 lint warnings |
| **B — Baseline completion** | `001a_indexes`, `004_badges_seed`, `005_content_seed`, `stage8_dashboard_fn`, `fll_content_types`, `stage8_patch_admin_trials`, `stage8_patch_children_archive` | ✓ 14 indexes, 68 badges, 306 content rows, get_parent_dashboard RPC, paused subscription_status |
| **C — Phase 1 audit** | `008`, `009`, `010` | ✓ subscription_events.processed/processed_at + sub_events split + 12 RLS reasserted |
| **D — Phase 2 audit + cron** | `011`, `012`, `013`, `014`, `015`, `006_cron` | ✓ email_verified_at, xp daily cap + trigger, content admin split, audit_log + 5 triggers, 6 cron jobs |
| **E — Phase 3 audit** | `016`, `017`, `018` | ✓ 3 perf indexes, FK ON DELETE SET NULL, content.slug NOT NULL + auto-slug trigger |
| **F — Phase 5 enhancements** | `019`, `020`, `022`, `023`, `024`, `025` | ✓ 4 new tables (passkey_credentials/challenges, auth_events, mfa_backup_codes), 18 demo_deny RESTRICTIVE policies, dunning columns, realtime publication |
| **F-extension — Option A role restriction** | `restrict_policies_to_authenticated_role` | ✓ 14 policies recreated TO authenticated |
| **G — Standard game IDs** | `standard_game_ids_20260410` (with prereq columns) | ✓ content_queue.game_id + content_type added (NULL allowed), 34-game CHECK + 97-content-type CHECK + 2 partial indexes |
| **H — Code integration** | TS types generated, migrations exported, PROGRESS update | ✓ src/lib/supabase/database.types.ts (16 tables + 7 RPCs) |

### Skipped (intentional)

- **`sql/021_enable_pgaudit.sql` ALTER DATABASE GUCs** — Require `supabase_admin` role; not accessible via MCP. Deferred user action: apply in Supabase Dashboard → Database → Configuration. Values per file: `pgaudit.log='write, role, ddl'`, log_catalog OFF, log_client OFF, log_level=log, log_parameter ON, log_relation OFF, log_statement_once OFF.

### Auto-fixes (logged per CLAUDE.md §3.1)

Pinned `SET search_path = public, pg_temp` on 8 functions during application
to prevent triggering `function_search_path_mutable` advisor lints
post-migration. Source files unchanged; the patches are baked into the
applied migration. Affected: `reset_daily_xp`, `audit_trigger`,
`cleanup_orphaned_subscription_events`, `slugify`, `content_auto_slug`,
`auth_is_anonymous`, `cleanup_expired_passkey_challenges`,
`mfa_backup_codes_remaining`.

### Discrepancies discovered

1. **`badges` + `content` already seeded.** Initial diff inferred both
   tables were empty based on missing post-stage-8 indexes. Re-query
   after Phase A showed 68 badges + 306 content rows already present.
   Both 005 and stage9 seeds were re-applied via `ON CONFLICT DO UPDATE`
   (no-ops, idempotent). Lesson: never infer from absence.
2. **Phase G prerequisite mismatch.** `supabase/migrations/20260410_add_standard_game_ids.sql`
   assumed `content_queue.game_id` + `content_queue.content_type` columns
   existed. Live `content_queue` lacked both. Per user decision (Option B):
   added the columns as nullable, then applied the migration. CHECK
   constraints relaxed to allow NULL so non-game queue items still pass.
3. **Subscription event `data` column already absent.** sql/009 attempts
   `DROP COLUMN IF EXISTS data` to move sensitive data to detail table —
   live had data column (good). Migration applied cleanly.

### Advisor false-positive note (Option A documented)

After Phase F's `019_demo_role_rls.sql` and the F-extension `restrict_policies_to_authenticated_role`
migration, **22 `auth_allow_anonymous_sign_ins` advisor warnings remain**.

**Why they're false positives:** Supabase's `authenticated` role includes
anonymous sign-ins (signInAnonymously creates a JWT with `is_anonymous=true`
claim, role=authenticated). The 0012 advisor uses a static heuristic that
flags any PERMISSIVE policy scoped to `authenticated` unless the policy
explicitly checks `(auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE`
inline.

**The protection that's actually in place:**
- 12 RESTRICTIVE `demo_deny_*` policies (migration 019) gate every
  user-facing table on `NOT public.auth_is_anonymous()`. This blocks
  anonymous writes definitively (RESTRICTIVE AND-combines with PERMISSIVE).
- Existing PERMISSIVE policies all use `parent_id = auth.uid()` USING
  clauses. `auth.uid()` returns NULL for anonymous, so the comparison
  fails and reads are blocked.

**Why we didn't inline the check:** Per CLAUDE.md §3 and Mythos.md §11.5
("avoid bypassing safety checks"), duplicating the same condition across
PERMISSIVE inline + RESTRICTIVE policy creates triple-redundant logic that
is harder to maintain. The Option A migration was the most we should do
without violating the anti-duplication principle. RESTRICTIVE +
auth_is_anonymous() is the canonical Supabase pattern.

**System is secure.** The advisor is short-sighted, not the schema.

### Deferred user actions

| # | Action | Where | Why |
|---|---|---|---|
| 1 | Enable HIBP leaked-password protection | Dashboard → Auth → Policies | Closes `auth_leaked_password_protection` advisor |
| 2 | Apply pgaudit GUCs from sql/021 | Dashboard → Database → Configuration → Custom Postgres Config | Requires supabase_admin |
| 3 | Configure Site URL = `https://sparkforge-labs.com` + redirect URLs | Dashboard → Auth → URL Configuration | Required for production OAuth/email callbacks |
| 4 | Enable email confirmation | Dashboard → Auth → Email Auth | COPPA / parent verification gate |
| 5 | (Optional) Configure OAuth providers (Google/Apple/Microsoft) | Dashboard → Auth → Providers | For sql/022's signin.oauth events |
| 6 | (Optional) Enable PITR backup | Dashboard → Database → Backups | sql/018 backup runbook expects this on Pro |

### Live state metrics (post-migration)

- **31** tracked migrations in `supabase_migrations.schema_migrations`
- **20** tables in `public` schema (12 baseline + 8 from migrations)
- **18** RESTRICTIVE `demo_deny_*` policies + 14 PERMISSIVE policies on `authenticated`
- **9** pg_cron jobs scheduled (audit retention, COPPA cleanup, streak reset, 3 counter resets, passkey/auth_events/orphan cleanups)
- **2** Realtime tables published (progress, children with REPLICA IDENTITY FULL)
- **2** extensions installed in this round (pg_cron@pg_catalog, pgaudit@extensions)

### Code Review Notes (for future hardening)

- **`mfa_backup_codes_remaining(p_parent_id)`** is GRANTed to authenticated
  but does not enforce `p_parent_id = auth.uid()` inside the function body.
  Any authenticated user can query the count for any parent. Low impact
  (just a count, no hashes/codes returned), but should add an authz
  check in a follow-up. Mirror `get_parent_dashboard`'s pattern.

### Validation
- Tracked migrations: ✅ 31 applied
- Function search_path advisor warnings: ✅ 0 (was 5)
- Extension-in-public advisor warnings: ✅ 0 (was 1)
- Anonymous-access advisor warnings: ⚠ 22 (documented false positives)
- Leaked-password advisor warning: ⚠ 1 (Dashboard toggle)
- TypeScript types regenerated: ✅ `src/lib/supabase/database.types.ts`
- Local migration manifest: ✅ `supabase/migrations/_APPLIED_HISTORY.md`

---

## Phase 3 — SparkForge Wordmark (April 29, 2026)

Branch: `claude/brand-hero-phase-3-e9kYF` (per CLAUDE.md feature-branch rule).
Foundation: Phase 1+2 merged via PR #136 (commit `a237e9b`).

### Locked design selections (chat 2026-04-29)

| Glyph aspect | Selection | Rationale |
|---|---|---|
| `r` top hook | Stepped/angled (rectilinear) | Matches SF mark's bar-and-jog idiom — no curves |
| `g` descender | Single-storey open tail (Futura/Avenir) | Geometric idiom, simpler subpath count |
| `e` counter | Single complex outline | Detours around crossbar; one-path simplicity |
| Bowls (`o`,`p`,`a`,`g`,`e`) | Cubic beziers for true rounded shapes | Genuine typographic curves on the curved letters |

### Files

| Action | File |
|---|---|
| Created | `public/branding/sparkforge-geometry.svg` (10 glyphs, viewBox 6400×800, evenodd) |
| Created | `src/components/3d/branding/_shared.tsx` (`BrandingPart` reusable mesh) |
| Created | `src/components/3d/branding/SparkForgeWordmark3D.tsx` (revealMask + per-letter ids) |
| Edited | `src/components/3d/branding/SfMark3D.tsx` (use shared `BrandingPart`) |
| Edited | `src/app/dev/branding/client.tsx` (sparkforge default, letter-reveal slider, wider camera) |

### Verification

- `xmllint --noout sparkforge-geometry.svg` → parses OK
- `npm run build` → EXIT=0, `/dev/branding` 457 kB / 691 kB First Load JS
- `npm run dev` → Ready in 4.1s, no boot errors

### Discrepancies Log

- None for Phase 3 (the SF and F glyph paths in `sparkforge-geometry.svg`
  are mechanical x-translations of the `sf-geometry.svg` paths — preserves
  the Phase-2 single-source-of-truth contract).

### Code Review Notes

- `BrandingPart` carries an optional `visible` prop so `revealMask` toggles
  visibility without unmount/remount — preserves the BrandingMaterial's
  GPU pipeline across Phase-5b animations (avoids per-frame init cost).
- Each `<path>` in the wordmark SVG becomes ONE mesh; SVGLoader unifies
  multi-subpath letters (e.g. `wm-p` outer + counter) under evenodd
  fill-rule into a single Shape with holes — keeps 10 meshes total
  for 10 letters, simplifying Phase-5b per-letter targeting.

### User checkpoint pending

Visual sign-off at `/dev/branding` with subject = "SparkForge wordmark":
- All 10 letters render with consistent dispersion + dichroic
- Counters in `p`, `a`, `o`, `g`, `e` are HOLLOW (not solid)
- Italic lean produces depth, not skew distortion
- Letter-reveal slider hides/shows letters left-to-right (0..10)

---

## Phase 4 — Offline Render Pipeline (April 29, 2026)

Branch: `claude/brand-hero-phase-3-e9kYF` (continued).

### Artefacts produced

| File | Dimensions | Format | Size |
|---|---|---|---|
| `public/branding/sf-hero.png` | 4096×4096 | PNG, RGBA | 104 KB |
| `public/branding/sparkforge-hero.png` | 4096×1024 | PNG, RGBA | 50 KB |
| `public/branding/brand-fallback.mp4` | 1920×1920 | H.264, yuv420p, 30 fps, 2.00 s loop | 42 KB |

### New files

| Action | File |
|---|---|
| Created | `scripts/render-branding.ts` (puppeteer + ffmpeg-static driver) |
| Created | `src/app/dev/branding/render/page.tsx` (dev-route guard) |
| Created | `src/app/dev/branding/render/client.tsx` (chrome-free + `__brandingReady` flag + LoopRotator) |
| Edited | `src/components/3d/branding/BrandingShowcase.tsx` (new `transparent` prop, conditional alpha/scene-bg/vignette) |
| Edited | `package.json` (added `render:branding` script + `puppeteer`/`ffmpeg-static`/`tsx` -D deps) |

### Verification

- `npm run build` → EXIT=0; `/dev/branding/render` 1.02 kB / 691 kB First Load JS
- `npm run render:branding` → all three artefacts produced
- WebGPU works in headless Chromium with flags `--enable-unsafe-webgpu --enable-features=Vulkan,WebGPU --use-vulkan --ignore-gpu-blocklist`
- Output PNG verified RGBA (PNG IHDR colorType=6); MP4 verified via ffprobe (1920×1920, h264, yuv420p, 2.00s)

### Discrepancies Log (Phase 4)

| Issue | Fix | Status |
|---|---|---|
| ESM mode lacks `__dirname` | Replaced with `fileURLToPath(import.meta.url)` pattern | ✅ |
| `ffmpeg-static` types `string \| null` confused TS narrowing into `spawn` closure | Local `ffBin` const + non-null check before closure | ✅ |
| Puppeteer's `omitBackground` was overridden by root layout `<body class="bg-surface-base">` | Inline `page.evaluate` strips html/body/canvas-ancestor backgrounds before screenshot | ✅ |
| `networkidle0` never fired — Next dev HMR websocket stays open | Switched to `domcontentloaded`; `__brandingReady` is the actual readiness gate | ✅ |
| Scene background was always voidNavy (canvas had `alpha: false`) | Added `transparent` prop to `BrandingShowcase`; render route uses it for stills, off for the loop MP4 | ✅ |

### Code Review Notes (Phase 4)

- The `transparent` prop on `BrandingShowcase` is additive — existing call sites
  (dev showcase, hero, anywhere using the canvas) get default `false` → no behavioural change.
- The render route deliberately differentiates `subject !== 'loop'` for the
  `transparent` flag: the MP4 must bake in the navy background since H.264
  has no alpha channel. PNGs stay transparent for compositing.
- `LoopRotator` rotates ±0.2 rad in a sine wave over 2 s — matches the action
  plan's "slow-rotate" spec. Single full sine cycle per loop, so MP4 loops seamlessly.
- The `render:branding` script auto-boots a dev server if one isn't running,
  and shuts it down on exit. Idempotent: re-runs do not double-start.

---

### AUTH-CRIT-003 — post-login infinite LoadingScreen fix (2026-07-20)

**Symptom (owner-reported, prod mobile Safari):** after login, stuck on the
LoadingScreen "Something may have gone wrong" tier; network confirmed fine.

**Root cause:** supabase-js emits auth events while holding its internal
Navigator-lock and awaits the `onAuthStateChange` callback before releasing
it. `AuthProvider`'s callback was async and awaited `hydrateUserData` →
`.from()` → `getSession()` → same lock ⇒ deadlock. All subsequent auth calls
(incl. `initializeAuth`'s) queue behind the dead lock, so `isInitialized`
never flips. A frozen sibling tab holding the shared per-origin lock produces
the same hang cross-tab (iOS Safari tab freezing).

**Three-layer fix:**
1. `AuthProvider.tsx` — `onAuthStateChange` callback is now synchronous;
   all work deferred via `setTimeout(0)` (`handleAuthEvent`) so the lock is
   released before any Supabase call runs. (Root cause.)
2. `AuthProvider.tsx` — 10 s init watchdog (`INIT_WATCHDOG_MS`) with
   per-step Sentry breadcrumbs (`auth-init` category) + a
   `AuthProvider: init watchdog fired` warning tagged with the stalled step;
   rendering is unblocked on timeout instead of stranding the user.
3. `LoadingScreen.tsx` — stalled tier gains a "Sign in again" plain-anchor
   escape (full page load, fresh auth flow) since refresh can't recover a
   lock held by another frozen tab.

**Dependency:** `@supabase/supabase-js` ^2.98.0 → ^2.110.7 (lock handling
fixes land continuously; root-cause fix above is version-independent).

**Verification:** `npm run build` clean. Note: container npm install used
`--ignore-scripts` because org egress policy 403-blocks the `ffmpeg-static`
binary download (github.com releases); affects only the local branding
render script, not the Vercel deploy.

---

## DIGITAL FORGE BUILD — F0–F8 COMPLETE (2026-07-20)

Full execution of docs/concepts/10-digital-forge-build-plan.md. Each phase
committed + merged to setup-sparkforge-dev individually; all Vercel deploys
green. Forge flags default ON in dev + Vercel PREVIEW, OFF in production
(flip NEXT_PUBLIC_FORGE_*=true in the Production env to launch).

| Phase | Delivered | Verification |
|---|---|---|
| F0 | Token sweep: sf-* Tailwind palette var()-routed; console tokens; 28 files, ~230 classes | build + 828 tests + emitted-CSS check |
| F1 | forge-theme.css (full override sheet), data-theme flip, 9 flags, 9 primitives + useForgeTier, /dev/forge, parity test | 831 tests + live screenshot |
| F2 | ForgeChamberShell + arcade play page chamber/IGNITE; preview-flag defaults | build + tests |
| F3 | ForgeCompleteCeremony (GSAP, skippable, flash-safe, RM instant) | build + tests |
| F4 | Dashboard ambience (traces+embers), workbench hero, wordmark glow | build + tests |
| F5 | ForgeRing CSS-3D listbox + Grid toggle, molten overall progress | build + tests |
| F6 | Lightfall (vendored, ogl dep), ForgedWordmark, MoltenThread, NetworkMicroDemo (4 rounds) | live screenshot + tests |
| F7 | ForgeSparkCore (9 expressions), SparkyCore switch, Rive path swap, voice file | live screenshot + tests |
| F8 | CoreIgnitionGame #43 (bullet-time gates, 3 bands, 30 scenarios, deterministic rubric), registry/loader/flag gating, 22 scoring tests | 853 tests + build |

### Discrepancies / deviations log
- F0: dark-panel classes mapped to NEW sf-console role tokens (light values =
  old hexes exactly) rather than light-surface tokens; rare-shade tolerances
  documented in docs/concepts/10-forge-sweep-audit.md.
- F1: ForgePanel `as` prop is a narrow intrinsic-tag union — React.ElementType<P>
  widening OOMed the tsc build worker (bisected; do not reintroduce).
- F2: chamber progress bar omitted from the arcade page-level frame (games track
  progress internally); ForgeChamberShell retains it for GameAdapter consumers.
- F3: Tone.js ceremony sounds deferred (audio-manager wiring TBD; visuals ship).
- F6: hero pin/scrub simplified to scroll-scrubbed thread + self-pausing
  Lightfall (v1); section ignition via existing whileInView reveals.
  HeroHologram/LandingMicroGame NOT archived — flag-off must restore them
  (supersede at flag cleanup, plan Part 17.3).
- F6: Treat Trainer vignette NOT built — OWNER GATE pending (plan §10.5.1).
- F7: forgespark.riv not yet authored (Rive editor asset) — SparkyRive
  placeholder covers (HS-8 pattern).
- F8: 2 scenarios per gate-type per band shipped (30 total); expansion to ≥6
  per cell follows the Standard-tier content pipeline. In-container e2e not
  runnable (no Supabase env); covered by unit tests + preview verification.
