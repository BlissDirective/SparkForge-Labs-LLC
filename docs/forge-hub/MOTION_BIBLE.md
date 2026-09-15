# Forge Hub — Motion Bible

**Status:** **DRAFT — Director fill-in** (v1 draft)  
**Version:** v1 draft (Director W0-08 fill-in of Scribe stub)  
**Date:** 2026-09-15  
**Not implementation.** This file is the authored spec: named transitions, ordered timeline steps, ms budgets, tokens, Sparky, audio, reduced-motion substitutes. GSAP / Theatre.js / `director.ts` land in a later Director PR.

| | |
|---|---|
| **Owner (fill-in)** | Director (TAP v2.2 §11.1; `GROK_TEAM_PROMPTS.md` §7) |
| **Owner (stub outline)** | Scribe ([PR #172](https://github.com/BlissDirective/SparkForge-Labs-LLC/pull/172)) |
| **Implements** | TAP v2.2 §2.6 choreography layer; §3 W0 item 9; §10 item 5 |
| **Decision lock** | `docs/01-decisions/2026-09-forge-hub.md` **#8** — every state change is a directed, interruptible Director sequence |
| **Vocabulary** | TAP v2.2 mode / panel names; forthcoming `docs/forge-hub/VOCABULARY.md` (W0-05). Until W0-05 lands, use TAP terms below. Do not invent aliases. |
| **Related (superseded for feel, useful for tokens)** | `FORGE_MOTION_BRAINSTORM.md`, `R3F_VARIATION_PLAN.md` §4 |

Foreman note: W0-08 stays **doing** until this fill-in PR merges **and** Foreman marks the board row done. Landing the fill-in does **not** auto-close the workstream.

---

## 0. How to read this draft

Each named transition has:

1. An **index row** (`id`, authored steps, wall-clock duration, reduced-motion substitute).
2. A **page** with trigger, ordered timeline, tokens, Sparky, audio, skip, owner status.

`id`s are stable from the Scribe stub. Do not rename. New companion ids (`labsbrowse-hub`, `dual-exit`) are additive and called out.

**Wall-clock vs step budgets:** interactive pages list overlapping windows on one Director timeline. Step durations are window lengths; they overlap so content fade (first fifth of the **slab** window) and wipe (last fifth of the slab window) can run on the glass while slabs move (decision #2: DOM never stretches). **Wall-clock** is the class cap. Exclusive sequential sums are not the runtime; the numbered `t=` ranges are.

When a page is later locked in implementation: change `Fill-in` from `DRAFT` to `LOCKED`, keep the `id` stable, and leave reduced-motion as a first-class row.

---

## 1. Locked timing and runtime (do not reopen)

From TAP v2.2 §2.6 and decision lock #8. Timing changes inside ±20 % are Tier 0 (Director); new transitions or removed steps are Tier 1; feel changes are Tier 2.

| Rule | Value |
|------|--------|
| **Interactive morphs** | **≤ 600 ms** |
| **Cinematic beats** | **≤ 1.5 s**, skippable by **click, Enter, or Space** |
| **`prefers-reduced-motion`** | Replace the whole sequence with a **200 ms crossfade**; **skip cinematic beats** |
| **Runtime** | **GSAP** timelines at runtime (deterministic, interruptible `overwrite`, scrub-able for tests) |
| **Authored beats** | **Theatre.js** JSON, played by the Director (never load Studio in production) |
| **Camera** | **Fixed composition.** Micro-dolly **± 2 %** and pointer parallax allowed. **Cuts are not.** |
| **Independent tweens** | **Not allowed** on glass, beams, emitter, Sparky, or audio for these objects. One Director timeline per transition. |
| **Canonical step order** (interactive morphs) | emitter charge → beams retarget → slabs move / merge / split → outgoing content fade (first fifth) → incoming content wipe (last fifth) → Sparky reaction → audio sting |
| **Content during morph** | DOM never stretches (decision #2). Fade out first fifth; glass carries motion; wipe in last fifth. |
| **Ambient loop** | Emitter pulse, dust, panel breathe, beam flicker, Sparky idle / blink — continuous while `frameloop === 'always'`. Not a named morph. |
| **Portal reducer** | `idle → charge → emit → docked` (W1-02 port). Holds locked: charge **420 ms**, emit **560 ms** (Stagehand `portalMachine`, CDO confirmed). Reduced motion → `SKIP_TO_DOCKED`. Changing 420 / 560 is **Tier 1** with Stagehand / Foreman. |
| **Compact / no canvas** | No Director timelines below 1440 px or on poster fallback. HTML shell only. |

Theatre.js beat files (v1): `first-visit-ignition`, optional `game-launch-burst` (does **not** gate first input), `level-up`, `outfit-swap`. Holiday intro: **no id in v1**.

### 1.1 Motion tokens (names from `R3F_VARIATION_PLAN.md` §4; durations Director-confirmed against caps)

R3F candidate ranges (e.g. `glassWipe` 0.3–0.5 s, `sfBloom` 0.4–0.8 s) **do not apply** to interactive morphs as written — they would blow the 600 ms cap once charge + slabs + fifths are sequenced. v1 uses the token **names**; durations below are the Director lock for this bible.

| Token | v1 use | v1 duration | Notes |
|-------|--------|-------------|-------|
| `sfBloom` | Interactive charge pulse; cinematic charge / emit bloom | **80 ms** interactive pulse; **420 ms** on `emit-burst` charge (matches reducer hold) | Ambient idle bloom is the ambient loop, not this token’s full R3F range |
| `panelBreathe` | Ambient only | **~3 s** loop (scale 98–102 % + scanline) | Never a morph step |
| `yawTuck` | Focus sides | **240 ms** inside the slab window | ±8–15° yaw; snap to 0 on `reading` slots (Stagehand) |
| `slotSlide` | Arc move, same Z | **420 ms** slab window on interactive morphs | Same Z plane; no Z cuts |
| `glassWipe` | Incoming content (last fifth) | **84–120 ms** interactive (last fifth of the slab window) | R3F 0.3–0.5 s superseded for interactive by the fifths rule |
| `sparkyPing` | Addressable glow / reaction start | **100 ms** | Dome / badge pulse on the Director clock |
| `sparkyHop` | Squash-stretch accent | **250 ms** | Desk character hop; **not** overlay-anchor hop from the brainstorm |
| `morphDissolve` | 3→1 merge / 1→3 split / glass re-layout | **420 ms** slab window | Borders stay; glass carries the morph |

---

## 2. Vocabulary (until `VOCABULARY.md` / W0-05)

Do not treat `FORGE_MOTION_BRAINSTORM.md` overlay anchors or `R3F_VARIATION_PLAN.md` Sparky-as-overlay language as current. Locked terms:

| Term | Meaning |
|------|---------|
| `HoloL` / `HoloC` / `HoloR` | The three glass slabs |
| `welcome` | Shrunken sides + center login (decision #7) |
| `hubSplit` | Equal trio; three destinations |
| `labsBrowse` | Labs bench / browse layout |
| `gameLobby` | Arcade lobby on the trio |
| `playStage` / `PlayStage` | Merged single glass; games play here (decision #5) |
| `HoloBubble` | Head-emitter chat hologram (decision #13) |
| Whisper | HoloBubble **expands**; main panels dim; Sparky leans in at `frontCenter` — chat does **not** move onto HoloC |
| Emit burst | Portal reducer punctuation: `charge → emit → docked` |
| Director | Sole owner of stage animation |

Modes also named in TAP §2.1 (no pages in the §10-item-5 minimum; extra pages in §4 / §6): `avatarStudio`, `settingsDock`, `cinematic`, Focus, Dual, `FLAT`.

---

## 3. Index — TAP §10 item 5 (minimum)

Authored steps and wall-clock durations. Reduced-motion is always a first-class substitute.

| id | from → to / kind | steps (authored) | duration budget | reduced-motion substitute |
|----|-------------------|------------------|-----------------|---------------------------|
| `welcome-idle` | first paint / idle ambient (`welcome`) | • snap / hold `welcome` (sides ~85 %, HoloC login) — **no** equal-trio morph on first paint  • ambient loop (pulse, dust, `panelBreathe`, flicker, Sparky `idle.a` / `idle.b`)  • form-focus glance at HoloC | **Ambient** (continuous). No first-paint morph. | Skip ambient motion; static `welcome` pose (or **200 ms** crossfade into it). No breathe / hop / bloom. |
| `login-success-hubsplit` | `welcome` → `hubSplit` | • charge 80 ms  • beams 70 ms  • sides 85 % → equal 420 ms  • fade first fifth  • mission wipe last fifth  • Sparky `wave` at `nearCore` + HoloBubble `tip`  • `sting.loginSuccess` | **Interactive 600 ms** wall-clock | **200 ms** crossfade `welcome` → `hubSplit`. Skip wave / sting / beats. |
| `hub-labsbrowse` | `hubSplit` → `labsBrowse` | • charge 80 ms  • beams 70 ms  • slabs to labs bench 420 ms  • fade / wipe fifths  • Sparky attend labs slot (`leftLip` / `rightLip`, `point.*`)  • `sting.hubLabsBrowse` | **Interactive 600 ms** wall-clock | **200 ms** crossfade `hubSplit` → `labsBrowse`. Skip beats. |
| `lobby-playstage-merge` | `gameLobby` → `playStage` merge | • charge 80 ms  • beams 70 ms  • **3→1 merge** yaw-0 PlayStage 420 ms  • fade / shell wipe  • room **dim**  • Sparky attend stage  • `sting.gameLaunch`  • optional Theatre burst **after** morph, does not gate input | Morph **interactive 600 ms**. Optional burst **cinematic ≤ 1.5 s**, skippable. First input at morph end (TAP W5 &lt; 1.2 s). | **200 ms** crossfade to merged PlayStage + dim. Skip burst / merge-dissolve. |
| `playstage-lobby-split` | `playStage` → `gameLobby` split | • lift dim 80 ms  • charge 80 ms  • beams 70 ms  • **1→3 split** 340 ms  • fade / lobby wipe  • Sparky return  • `sting.lobbyReturn` | **Interactive 600 ms** wall-clock | **200 ms** crossfade PlayStage → `gameLobby`. Skip split-dissolve / beats. |
| `whisper-expand` | Whisper (HoloBubble expand) | • dome charge 80 ms  • dome beam → bubble 70 ms  • trio dim + bubble grow 400 ms  • Sparky `whisper` lean at `frontCenter`  • `sting.whisperOpen` | **Interactive 600 ms** wall-clock. Pair: `whisper-close`. | **200 ms** crossfade: panels dim + bubble at whisper size. Skip lean / spring. |
| `emit-burst` | Emit burst (portal reducer) | • `idle` → **charge 420 ms** → **emit 560 ms** → `docked`  • Sparky glance / `sparkyHop` during emit  • `sting.emitBurst` at emit start | **Cinematic 980 ms** wall-clock (≤ 1.5 s), skippable. **Not** an interactive morph. | **200 ms** crossfade + reducer **`SKIP_TO_DOCKED`**. No charge/emit performance. |
| `first-visit-ignition` | first-visit ignition (Theatre.js) | • Theatre JSON 0–1500 ms  • micro-dolly + bloom  • slabs settle `welcome`  • content wipe  • Sparky to `nearCore`, start `wave`  • land `welcome-idle` | **Cinematic 1500 ms**, skippable | **Skip beat.** **200 ms** crossfade (or instant) into idle `welcome`. |

---

## 4. Extra named transitions (GROK_TEAM_PROMPTS §3 item 7)

Not in TAP §10 item 5 minimum. Ids confirmed for v1 (none dropped). Additive: `labsbrowse-hub`, `dual-exit`. Holiday intro: still **no id** in v1.

| id | from → to / kind | steps (authored) | duration budget | reduced-motion substitute |
|----|-------------------|------------------|-----------------|---------------------------|
| `whisper-close` | Whisper → prior layout | • reverse expand  • panels undim  • Sparky `whisper` out then return  • restore focus | **Interactive 600 ms** | **200 ms** crossfade to prior layout |
| `focus-in` | any → Focus | • charge 80 ms  • beams 70 ms  • HoloC expand + sides `yawTuck` 420 ms  • fade / wipe  • Sparky look-at C | **Interactive 600 ms** | **200 ms** crossfade to Focus |
| `focus-out` | Focus → prior | • reverse Focus (`yawTuck` unwind)  • fade / wipe  • Sparky return | **Interactive 600 ms** | **200 ms** crossfade to prior |
| `dual-enter` | any → Dual | • charge 80 ms  • beams 70 ms  • two mid + C strip 420 ms  • fade / wipe  • Sparky between | **Interactive 600 ms** | **200 ms** crossfade to Dual |
| `dual-exit` | Dual → prior | • reverse Dual  • fade / wipe  • Sparky return | **Interactive 600 ms** | **200 ms** crossfade to prior |
| `labsbrowse-hub` | `labsBrowse` → `hubSplit` | Mirror of `hub-labsbrowse` (bench → equal trio) | **Interactive 600 ms** | **200 ms** crossfade `labsBrowse` → `hubSplit` |
| `level-up` | ceremony | • Theatre.js beat  • stage retarget of `ForgeCompleteCeremony`  • Sparky `cheer`  • `sting.levelUp` | **Cinematic ≤ 1.5 s**, skippable | Skip beat; **200 ms** crossfade / static ceremony |
| `outfit-swap` | Sparky outfit | • Theatre.js `outfitSwap` clip 0.9 s  • mesh hitch **&lt; 100 ms** (TAP W3) at swap frame | Beat **≤ 1.5 s** skippable; hitch TAP W3 | Skip beat; instant material/attachment swap |

Holiday intro (Theatre.js candidate in Director prompt): **no id in v1** — do not ship a kid-visible holiday beat until a later packet names an id.

---

## 5. Pages — TAP §10 item 5

### 5.1 `welcome-idle` — welcome (first paint / idle ambient)

- **Fill-in:** `DRAFT`
- **Class:** ambient (no interactive first-paint morph)
- **Trigger:** First paint of `/`, `/login`, `/signup` in `welcome` (decision #7). Returning idle after `first-visit-ignition` lands, after auth-form wipes on `/signup` `/forgot-password` `/reset-password`, and whenever the stage is in `welcome` with no morph running. Compact / poster: no timeline.
- **Director timeline steps (order):**
  - **t = 0:** Pose **hold** — HoloL / HoloR ~85 %, HoloC full-size login. **No** equal-trio → shrunken-sides morph on first paint. Decision #7 **is** the welcome pose; equal trio is `hubSplit` after login (`login-success-hubsplit`). The R3F-plan “morph on first paint or idle” option is **declined** for v1 (would fight the lock and add a morph the kid did not request).
  - **t = 0…∞:** Ambient loop (not a named morph): emitter pulse, dust / embers, `panelBreathe`, beam flicker, Sparky `idle.a` ⇄ `idle.b` + procedural `breathe` / blink at `nearCore`.
  - **On HoloC form focus:** glance (look-at only, no walk). TAP §5 `/` `/login` row.
  - **Kid idle &gt; 45 s:** behaviour `lookAround` + HoloBubble `ping` (Smith reaction map) — **not** a Director morph id.
- **Duration budget:** ambient continuous; **0 ms** morph. Do not add a ≤ 600 ms first-paint morph without a Tier 1 id.
- **Tokens used:** `panelBreathe` (loop); idle `sfBloom` pulse as ambient only (not the morph charge).
- **Sparky reaction:** Spot `nearCore`. Clips: `idle.a` / `idle.b` + `breathe`. Optional ambient `wave` is **not** on a timer in v1 (wave belongs to `login-success-hubsplit` and ignition handoff). Hover Sparky → glance; tap → `tapReact` + HoloBubble `tip` (opens chat path, may then `whisper-expand` if coaching). After bedtime: `sleep` overrides (behaviour, not this id).
- **Audio:** `bed.welcome` loop (Tone.js id, placeholder). No sting. Honour mute and D3D-5 (no extra bloom bed if Performance omits bloom).
- **Reduced-motion substitute:** static `welcome` pose or **200 ms** crossfade into it. Freeze ambient (no breathe / hop / bloom / flicker). Sparky holds idle pose.
- **Runtime:** GSAP ambient loops (not Theatre.js). Interruptible the instant any morph id starts (`overwrite: 'auto'`).
- **Skip:** n/a for idle. A new morph overwrites ambient tweens; do not leave breathe mid-scale — snap breathe to 1.0 as the morph starts.
- **Camera:** fixed; ± 2 % micro-dolly ok (slow ambient, not a cut).
- **Owner status:** draft
- **Notes:** Distinct from `first-visit-ignition`. `/signup` `/forgot-password` `/reset-password` wipe HoloC **without** a layout morph (TAP §2.9) — content `glassWipe` on HoloC only, ≤ 200 ms, still under the interactive cap; that wipe is **not** a new id in v1 (same `welcome` pose).

### 5.2 `login-success-hubsplit` — login success → hubSplit

- **Fill-in:** `DRAFT`
- **Class:** interactive morph
- **Trigger:** Auth success that routes `/home` in `hubSplit` (including demo login). Not fired by `/signup` form submit until that success lands `/home`. FLAT `/mfa-challenge` is not this morph.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** emitter charge — `sfBloom` 80 ms pulse. (`emit-burst` 420/560 is **not** nested here; see §5.7.)
  - **t = 50–120:** beams retarget to equal-trio attachment rects.
  - **t = 80–500:** slabs move — HoloL / HoloR grow ~85 % → equal (`slotSlide` 420 ms). HoloC stays reading (yaw 0).
  - **t = 80–164:** outgoing content fade (first fifth of the 420 ms slab window). Login / welcome copy fades; DOM does not stretch.
  - **t = 416–500:** incoming `glassWipe` — mission / continue / quest into HoloC; stats into HoloL; feed into HoloR (TAP §5 `/home`).
  - **t = 480–580:** Sparky reaction — stay `nearCore`; `sparkyPing` 100 ms; start `wave` (1.2 s clip **handoff**: clip may complete after t = 600 as behaviour). HoloBubble `tip` greeting.
  - **t = 560–600:** `sting.loginSuccess`.
- **Duration budget:** **600 ms** wall-clock (interactive cap).
- **Tokens used:** `sfBloom`, `slotSlide`, `glassWipe`, `sparkyPing`.
- **Sparky reaction:** Spot `nearCore` (no walk). Clip `wave`. Face `happy`. HoloBubble `tip` (text-only v1, decision #13). First visit of the day after this morph: behaviour may `point.R` / `point.L` at the mission — that point is **not** on this timeline.
- **Audio:** `sting.loginSuccess` then `bed.hub` (placeholders). Mute + D3D-5 respected; muted → skip sting, keep morph.
- **Reduced-motion substitute:** **200 ms** crossfade `welcome` → `hubSplit`. Skip wave, sting, charge, dissolve. Pose snaps to equal trio; bubble may show static greeting text without motion.
- **Runtime:** GSAP. One timeline. `overwrite: 'auto'`.
- **Skip / interrupt:** Interactive — **not** skippable by click / Enter / Space. New navigation overwrites and must tween slabs to the **new** target end pose (never freeze mid-morph). Reduced-motion uses the 200 ms substitute instead of this timeline.
- **Camera:** fixed; ± 2 % micro-dolly ok.
- **Owner status:** draft
- **Notes:** `/signup` `/forgot-password` `/reset-password` wipe HoloC **without** this morph (TAP §2.9).

### 5.3 `hub-labsbrowse` — hub → labsBrowse

- **Fill-in:** `DRAFT`
- **Class:** interactive morph
- **Trigger:** Navigate to `/labs` (`labsBrowse`). Reverse is **`labsbrowse-hub`** (§6.6), not this id.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** emitter charge — `sfBloom` 80 ms.
  - **t = 50–120:** beams retarget to labs-bench rects.
  - **t = 80–500:** slabs to labs bench (`slotSlide` 420 ms): HoloL lab list, HoloC selected-lab hero, HoloR detail + progress (TAP §5). Wide work C as the bench; tools on sides.
  - **t = 80–164:** outgoing fade (first fifth).
  - **t = 416–500:** incoming `glassWipe`.
  - **t = 480–580:** Sparky attend — walk toward hovered side (`leftLip` if list, `rightLip` if detail); if walk cannot finish in 100 ms, **start** `walk` / `turn.*` on the timeline and let behaviour finish. Then `point.L` or `point.R`. `sparkyPing`.
  - **t = 560–600:** `sting.hubLabsBrowse`.
- **Duration budget:** **600 ms** wall-clock.
- **Tokens used:** `sfBloom`, `slotSlide`, `glassWipe`, `sparkyPing`. (`yawTuck` is Focus, not this bench.)
- **Sparky reaction:** Start `nearCore`. End `leftLip` (default list) or the hovered lip. Clips: `walk` as needed, `point.L` / `point.R`. Face `happy`.
- **Audio:** `sting.hubLabsBrowse` (placeholder). Mute skips sting.
- **Reduced-motion substitute:** **200 ms** crossfade `hubSplit` → `labsBrowse`. Skip beats. Sparky teleports to `leftLip` (reduced-motion exception in the character spec).
- **Runtime:** GSAP.
- **Skip / interrupt:** overwrite; do not leave slabs mid-morph.
- **Camera:** fixed; ± 2 % micro-dolly ok.
- **Owner status:** draft
- **Notes:** Id is hub → labs only. `/labs/[labId]` is `focus-in`, not this morph.

### 5.4 `lobby-playstage-merge` — gameLobby → playStage merge

- **Fill-in:** `DRAFT`
- **Class:** interactive morph + optional cinematic burst
- **Trigger:** Game pick on `/arcade/[gameSlug]` (or lesson/story that uses merged glass) when registry `stage: 'glass'`. **Fullscreen hatch is not this morph** (stage pauses; game takes the viewport). Phaser / Pixi: Stagehand / Glazier set `frameloop: 'demand'` **after** this morph. No edits in `src/components/games/*`.
- **Director timeline steps (order):**
  - **Morph (wall-clock 0–600 ms):**
    - **t = 0–80:** emitter charge — `sfBloom` 80 ms.
    - **t = 50–120:** beams retarget to the single PlayStage rect.
    - **t = 80–500:** **3→1 merge** to yaw-0 PlayStage (~70 % viewport width × 75 % height, TAP §2.7) — `morphDissolve` + `slotSlide` 420 ms. No cuts.
    - **t = 80–164:** outgoing fade (lobby chrome).
    - **t = 416–500:** incoming `glassWipe` — `HtmlGameShell` `variant="stage"` into the merged DOM region.
    - **t = 400–500:** room **dim** (post off, particles lowest tier; world cap ~30 fps per TAP §2.7) on the same timeline.
    - **t = 480–580:** Sparky attend stage — from arcade `rightLip` cheer-spot toward `leftLip` for content / stay `rightLip` for play reactions. `sparkyHop` if the spot change is local; otherwise start `walk`.
    - **t = 560–600:** `sting.gameLaunch`. **First input enabled at t = 600.**
  - **Optional burst (cinematic, after morph, does not gate input):** Theatre JSON `beats/game-launch-burst.json`, **≤ 1500 ms**, skippable click / Enter / Space. Default: play on first glass launch of the session only; skip if the game is already interactive. Sparky `cheer` (1.5 s) **is** the burst if used. TAP W5 “launch morph to first input &lt; 1.2 s” is satisfied because input is at 600 ms, not after the burst.
- **Duration budget:** morph **600 ms**; burst **≤ 1.5 s** skippable and **non-blocking** for input.
- **Tokens used:** `sfBloom`, `morphDissolve`, `slotSlide`, `glassWipe`, `sparkyHop` / `sparkyPing`.
- **Sparky reaction:** Morph: attend PlayStage (`leftLip` sit for `/content/[slug]`; `rightLip` for arcade play — TAP §5). Burst: `cheer`. During play, JuiceProvider events are behaviour (`celebrate` → `cheer`, etc.), not this id. During play, HoloBubble is `ping` / `tip` only.
- **Audio:** `sting.gameLaunch`; optional `sting.gameLaunchBurst` only if the Theatre beat runs. Mute skips stings. Game audio is the game’s own (untouched).
- **Reduced-motion substitute:** **200 ms** crossfade to merged PlayStage + dim. Skip burst / merge-dissolve. Sparky snaps to attend spot.
- **Runtime:** GSAP morph; Theatre.js JSON if burst ships. Studio only on `/dev/forge-hub?studio=1` in development.
- **Skip / interrupt:** burst: click / Enter / Space → end pose of the burst (already merged + dim). Morph: overwrite. Do not un-merge on skip of the burst.
- **Camera:** fixed; ± 2 % micro-dolly ok; **no cuts**.
- **Owner status:** draft
- **Notes:** Phaser/Pixi: `frameloop: 'demand'` after morph (Stagehand/Glazier). `/story` may use `cinematic` instead; if so, this merge still applies then `first-visit-ignition`-class beats are a different id.

### 5.5 `playstage-lobby-split` — playStage → gameLobby split

- **Fill-in:** `DRAFT`
- **Class:** interactive morph
- **Trigger:** Finish, quit, or back to `/arcade` from a `glass` PlayStage. Not used when leaving a `fullscreen` hatch (stage was paused). Not used when leaving `/content/[slug]` to Focus / labs — that is `focus-in` / `hub-labsbrowse` / `labsbrowse-hub` as the route table says.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** lift dim (restore post / particles / `frameloop: 'always'` as Stagehand allows).
  - **t = 80–160:** emitter charge — `sfBloom` 80 ms.
  - **t = 130–200:** beams retarget to trio lobby rects.
  - **t = 160–500:** **1→3 split** — `morphDissolve` + `slotSlide` 340 ms to `gameLobby`.
  - **t = 160–228:** outgoing fade (first fifth of 340 ms ≈ 68 ms).
  - **t = 432–500:** incoming `glassWipe` — lobby list / preview / badge.
  - **t = 460–580:** Sparky return — `rightLip` + `cheer` start if a ceremony just happened; else `nearCore` idle. `sparkyHop` or start `walk`.
  - **t = 540–600:** `sting.lobbyReturn`.
- **Duration budget:** **600 ms** wall-clock.
- **Tokens used:** `sfBloom`, `morphDissolve`, `slotSlide`, `glassWipe`, `sparkyHop`.
- **Sparky reaction:** Leave PlayStage attend spot; return `rightLip` (arcade) per TAP §5. Clip `cheer` only if the quit is a **win** path that did not already play `level-up`; otherwise `idle.a`. Face `happy`.
- **Audio:** `sting.lobbyReturn` (placeholder). Mute skips sting. No launch burst on the reverse.
- **Reduced-motion substitute:** **200 ms** crossfade PlayStage → `gameLobby`. Skip split-dissolve / beats. Dim already off at t = 0 of the fade.
- **Runtime:** GSAP.
- **Skip / interrupt:** overwrite.
- **Camera:** fixed; ± 2 % micro-dolly ok.
- **Owner status:** draft
- **Notes:** Reverse of `lobby-playstage-merge` **without** the launch burst. Win ceremonies use `level-up` **before** this split if the kid stays on stage for the ceremony; if the product dismisses to lobby immediately, play `sting.lobbyReturn` only (do not stack `cheer` twice).

### 5.6 `whisper-expand` — Whisper (HoloBubble expand)

- **Fill-in:** `DRAFT`
- **Class:** interactive morph (sub-layout, not a `ForgeRouteMode`)
- **Trigger:** Tap Sparky or the bubble; tutor keyboard shortcut; Director onboarding / first-visit coaching. **Suppressed during `playStage`** (bubble stays `ping` / `tip` only — TAP §2.8b). Escape is `whisper-close`, not a reverse of this id on the same timeline.
- **Director timeline steps (order):** wall-clock **0–600 ms**. No 3-slab merge; dim + bubble replace the slab-move slot in the canonical order.
  - **t = 0–80:** emitter charge — dome emissive 1.0 → 1.2 (`sfBloom` on the dome, not the core burst).
  - **t = 50–120:** beams retarget — thin cyan beam dome → bubble lower edge.
  - **t = 80–480:** “slabs”: trio dim (not a merge); HoloBubble grow toward center (~320×200 rest → whisper size, still not chat-on-HoloC). Follow-spring is Stagehand; Director owns expand timing.
  - **t = 80–160:** outgoing — no content swap on the trio; dim is the fade analog (first fifth of the 400 ms expand window).
  - **t = 400–480:** incoming — whisper chrome / coach copy `glassWipe` in the bubble (last fifth).
  - **t = 480–580:** Sparky `whisper` lean at `frontCenter` (clip intro 0.5 s — start walk/turn at t = 400 if not already there so the lean reads). Face `speaking`.
  - **t = 560–600:** `sting.whisperOpen` (soft; text-only v1 — no TTS).
- **Duration budget:** **600 ms** wall-clock.
- **Tokens used:** `sfBloom`, `glassWipe`, `sparkyPing`. No `morphDissolve` (trio does not re-layout).
- **Sparky reaction:** Spot `frontCenter`. Clip `whisper` (0.5 s in, then hold). Smith names stay `whisper` after C1. HoloBubble state `whisper`.
- **Audio:** `sting.whisperOpen` (placeholder). Mute skips sting. No synthesized voice in v1 (decision #13).
- **Reduced-motion substitute:** **200 ms** crossfade to dim + expanded bubble. Skip lean / spring. Sparky teleports to `frontCenter`, hold pose.
- **Runtime:** GSAP. HoloBubble follow-spring is Stagehand — Director times the expand.
- **Skip / interrupt:** Escape closes via `whisper-close` (overwrite this timeline into that one). New route morph overwrites and must undim + collapse bubble as part of the new end pose.
- **Camera:** fixed; ± 2 % micro-dolly ok.
- **Owner status:** draft
- **Notes:** Whisper = bubble expand, **not** chat on HoloC (TAP §2.8b). Open and close are a **pair of ids** (`whisper-expand` / `whisper-close`), not one reversible id — keeps overwrite and focus restore explicit.

### 5.7 `emit-burst` — Emit burst (portal reducer charge → emit → docked)

- **Fill-in:** `DRAFT`
- **Class:** **cinematic ≤ 1.5 s**, skippable. **Not** an interactive morph.
- **Trigger:** Standalone portal punctuation: `/dev/forge-hub` Ignite; explicit `cinematic` mode arrivals; optional first-session “core online” after ignition if Director composes it **after** `welcome-idle` lands (not nested inside 600 ms morphs). **Does not** punctuate every interactive mode change in v1 — nesting charge **420 ms** + emit **560 ms** inside a 600 ms morph would require a Tier-1 retime. Interactive morphs use the **80 ms** `sfBloom` pulse in §1.1 instead.
- **Director timeline steps (order):** wall-clock **0–980 ms** (idle → charge → emit → docked).
  - **t = 0:** `IGNITE`; leave `idle`.
  - **t = 0–420:** `charge` — hold **420 ms** (Stagehand `portalMachine`). `sfBloom` builds on the core. No slab merge required; optional `morphDissolve` **accent** on glass edges only (borders stay — not a layout change).
  - **t = 420–980:** `emit` — hold **560 ms**. Beam cone on; bloom peak; dust kick. Sparky may glance / `sparkyHop` (250 ms) from **t = 420–670**. **Not** “rides the beam” (brainstorm overlay language is not locked).
  - **t = 420–480:** `sting.emitBurst` at emit start.
  - **t = 980:** `docked`. Timeline complete. Ambient loop resumes.
- **Duration budget:** **980 ms** wall-clock ≈ charge 420 + emit 560. Under the **1.5 s** cinematic cap **without** changing 420 / 560. Do not pad to 1500 ms.
- **Tokens used:** `sfBloom` (420 ms charge = reducer hold), `sparkyHop`, optional edge `morphDissolve` accent (not a mode morph).
- **Sparky reaction:** Remain `nearCore` (or current spot — no walk required). Glance toward the core; `sparkyHop` once on emit. Clips: stay `idle.a` with hop overlay, or `surprised` (0.6 s) if the burst is a first-session beat. Face `excited` on emit, then `idle`.
- **Audio:** `sting.emitBurst` (placeholder). Mute skips sting; reducer still runs.
- **Reduced-motion substitute:** **200 ms** crossfade to the docked look + reducer **`SKIP_TO_DOCKED`**. No charge/emit performance. Sparky does not hop.
- **Runtime:** **GSAP driving ported `portalMachine` (W1-02).** Holds **must** match Stagehand: charge **420 ms**, emit **560 ms**. This page does **not** re-author those holds in Theatre.js — Theatre is not the source of 420 / 560. Optional bloom intensity may be GSAP on the same clock. Studio not required.
- **Skip / interrupt:** click / Enter / Space → **`SKIP_TO_DOCKED`** (same action as reduced-motion). Retract / Escape on `/dev/forge-hub` is Stagehand `RETRACT` to `idle` (dev control; not a kid skip). A new Director morph overwrites and must leave the reducer in a coherent phase (`docked` or `idle` per the new page).
- **Camera:** fixed; ± 2 % micro-dolly ok; bloom is post, not a camera move. **No cuts.**
- **Owner status:** draft
- **Notes:** **Stagehand lock (CDO confirmed):** portal reducer holds already in W1-02 ([PR #173](https://github.com/BlissDirective/SparkForge-Labs-LLC/pull/173)): charge **420 ms**, emit **560 ms**. Full idle→charge→emit→docked wall-clock ≈ **980 ms** → classified **cinematic ≤ 1.5 s** (skippable), not interactive, so it stays under caps **without a Tier-1 retime**. Any change to 420 / 560 is **Tier 1** with Stagehand / Foreman. Do not re-specify reducer states (`idle` / `charge` / `emit` / `docked` / `IGNITE` / `ADVANCE` / `RETRACT` / `SKIP_TO_DOCKED`). Dissolve-vs-morph: v1 is **reducer performance + optional edge accent**, not a 3→1 layout morph (layout morphs are the other ids).

### 5.8 `first-visit-ignition` — first-visit ignition

- **Fill-in:** `DRAFT`
- **Class:** cinematic beat
- **Trigger:** First visit to `/` or `/login` when skip-hero / reduced-motion is **off**. Onboarding may request it once. Returning visitors and skip-hero settings go straight to `welcome-idle`. Distinct from `welcome-idle` and from `emit-burst` (do not require the 420/560 reducer for v1 ignition; bloom is Theatre-authored on this clock).
- **Director timeline steps (order):** wall-clock **0–1500 ms**. Theatre.js JSON `beats/first-visit-ignition.json`.
  - **t = 0–300:** room wakes — dust, emitter idle→glow, camera micro-dolly **+2 %** (no cut).
  - **t = 200–700:** `sfBloom` ignition bloom (Theatre curve; **not** the portal 420 ms hold).
  - **t = 300–1100:** slabs settle into `welcome` (shrunken sides + full HoloC) from empty glass — `morphDissolve` / `slotSlide` on this longer cinematic clock.
  - **t = 300–460:** outgoing fade analog if any placeholder glass content exists (first fifth of 800 ms settle ≈ 160 ms).
  - **t = 940–1100:** incoming `glassWipe` of welcome copy / login (last fifth of settle).
  - **t = 1100–1500:** Sparky arrives `nearCore` (start `walk` / `turn.*` earlier if spawning `behindCore`); start `wave`. Clip 1.2 s **handoffs** into `welcome-idle` after t = 1500. HoloBubble `tip` optional.
  - **t = 1400–1500:** `sting.ignition`; crossfade into `bed.welcome`.
  - **t = 1500:** land `welcome-idle` (ambient loop takes over).
- **Duration budget:** **1500 ms** wall-clock, skippable.
- **Tokens used:** `sfBloom`, `morphDissolve`, `slotSlide`, `glassWipe`, `sparkyPing`.
- **Sparky reaction:** End spot `nearCore`. Clips: `walk` as needed, `wave`. **Smith request (after JSON exists):** prefer a `ignition.wave` one-shot **≤ 600 ms** if the wave must finish inside the beat; until then use base `wave` with handoff into `welcome-idle`. Face `happy`.
- **Audio:** `sting.ignition` then `bed.welcome` (placeholders). Mute skips sting; still land welcome.
- **Reduced-motion substitute:** **Skip beat.** **200 ms** crossfade or instant into idle `welcome`. No ignition bloom / wave.
- **Runtime:** Theatre.js JSON via Director; Studio only on `/dev/forge-hub?studio=1` in development. Production plays JSON only.
- **Skip / interrupt:** click / Enter / Space → `welcome-idle` (200 ms crossfade or snap). Skip-hero setting never starts this beat.
- **Camera:** fixed; ± 2 % micro-dolly ok; **no cuts**.
- **Owner status:** draft
- **Notes:** Gate P1: “ignition plays”. Kid-visible on `/dev/forge-hub?ignition=1` (lab). Production `/` `/login` stay gated until FORGE_HUB (W10). JSON: `src/lib/forge-hub/beats/first-visit-ignition.json`. Distinct from `welcome-idle`.

---

## 6. Extra pages (prompts list)

Same field contract. Confirmed for v1.

### 6.1 `whisper-close`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** Escape; bubble close control; Director ending a coaching beat; a route morph that must collapse Whisper as part of overwrite (compose into the new timeline’s start). Restore focus to the previously focused control.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** dome charge down (emissive 1.2 → 1.0 / 0.6 per next bubble state).
  - **t = 50–120:** beam retarget / collapse toward dome.
  - **t = 80–480:** bubble shrink to rest (or `hidden` / `tip`); trio undim.
  - **t = 80–160:** whisper copy fade (first fifth).
  - **t = 400–480:** prior chrome already visible (undim); no incoming wipe unless a tip remains.
  - **t = 400–560:** Sparky `whisper` out (0.4 s) then start return walk to prior spot (`nearCore` default).
  - **t = 540–600:** `sting.whisperClose` (optional; may be silent if mute or if expand sting already played).
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `glassWipe` (fade), `sparkyPing`.
- **Sparky reaction:** `frontCenter` → prior spot. Clip `whisper` out, then `walk` / `idle.a`.
- **Audio:** `sting.whisperClose` (placeholder). Mute → none.
- **Reduced-motion substitute:** **200 ms** crossfade to prior layout; Sparky teleports; focus restored.
- **Skip / interrupt:** overwrite into a route morph; still restore focus.
- **Owner status:** draft

### 6.2 `focus-in`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** Enter Focus sub-layout: `/labs/[labId]`, `/mastery`, `/competencies`, welcome “Learn more” Features / How-It-Works (TAP §2.9, §5). Prior mode stored as `previousMode` for `focus-out`.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** charge `sfBloom` 80 ms.
  - **t = 50–120:** beams retarget to Focus rects (HoloC ~70–80 %; sides tucked).
  - **t = 80–500:** HoloC expand; HoloL / HoloR `yawTuck` 240 ms inside the 420 ms `slotSlide` window. Yaw snaps to 0 on `reading` slots (Stagehand).
  - **t = 80–164:** outgoing fade.
  - **t = 416–500:** incoming `glassWipe` (lesson list, path, story, etc.).
  - **t = 480–580:** Sparky look-at HoloC; `point.L` / `point.R` if a side tool matters, else glance from `nearCore` or nearest lip.
  - **t = 560–600:** `sting.focusIn`.
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `yawTuck`, `slotSlide`, `glassWipe`, `sparkyPing`.
- **Sparky reaction:** Look at C (TAP). Spot nearest lip or `nearCore`. Clip `point.*` or look-at only.
- **Audio:** `sting.focusIn` (placeholder).
- **Reduced-motion substitute:** **200 ms** crossfade to Focus.
- **Skip / interrupt:** overwrite.
- **Owner status:** draft

### 6.3 `focus-out`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** Leave Focus to `previousMode` (back from `/labs/[labId]` to `/labs` = `labsBrowse`; close “Learn more” to `welcome`; `/mastery` → `hubSplit` per route table).
- **Director timeline steps (order):** wall-clock **0–600 ms**. Reverse of `focus-in`: unwind `yawTuck`, HoloC to prior scale, fade / wipe, Sparky return.
  - **t = 0–80:** charge 80 ms.
  - **t = 50–120:** beams to prior rects.
  - **t = 80–500:** reverse Focus layout 420 ms.
  - **t = 80–164:** fade Focus copy.
  - **t = 416–500:** wipe prior copy.
  - **t = 480–580:** Sparky return to the prior mode’s default spot.
  - **t = 560–600:** `sting.focusOut`.
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `yawTuck`, `slotSlide`, `glassWipe`.
- **Sparky reaction:** Return (e.g. `leftLip` for labs bench). Clip `idle.a` or `walk`.
- **Audio:** `sting.focusOut` (placeholder).
- **Reduced-motion substitute:** **200 ms** crossfade to prior.
- **Skip / interrupt:** overwrite.
- **Owner status:** draft

### 6.4 `dual-enter`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** `/progress`, `/buddies` Dual sub-layout (TAP §5). Two mid panels + C strip (R3F variation D). Dual is **not** one-way — see `dual-exit`.
- **Director timeline steps (order):** wall-clock **0–600 ms**.
  - **t = 0–80:** charge 80 ms.
  - **t = 50–120:** beams to Dual rects.
  - **t = 80–500:** two mid + C strip `slotSlide` 420 ms.
  - **t = 80–164:** fade.
  - **t = 416–500:** wipe (stats / chart / detail, or friends / invite).
  - **t = 480–580:** Sparky idle **between** panels — `frontCenter` or `nearCore`, no lean.
  - **t = 560–600:** `sting.dualEnter`.
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `slotSlide`, `glassWipe`.
- **Sparky reaction:** Spot `frontCenter` (between) or `nearCore`. Clip `idle.a`. COPPA: no extra social cheer on `/buddies` enter.
- **Audio:** `sting.dualEnter` (placeholder).
- **Reduced-motion substitute:** **200 ms** crossfade to Dual.
- **Skip / interrupt:** overwrite.
- **Owner status:** draft
- **Notes:** `dual-exit` is required so Dual is not a one-way enter.

### 6.5 `dual-exit`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** Leave Dual to `previousMode` (typically `hubSplit`).
- **Director timeline steps (order):** Mirror `dual-enter` in reverse on a **0–600 ms** clock (charge → beams → unwind two-mid + C strip → fade / wipe → Sparky return → `sting.dualExit`).
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `slotSlide`, `glassWipe`.
- **Sparky reaction:** Return `nearCore`. Clip `idle.a` / `walk`.
- **Audio:** `sting.dualExit` (placeholder).
- **Reduced-motion substitute:** **200 ms** crossfade to prior.
- **Owner status:** draft

### 6.6 `labsbrowse-hub`

- **Fill-in:** `DRAFT`
- **Class:** interactive **≤ 600 ms**
- **Trigger:** `/labs` → `/home` (or any `labsBrowse` → `hubSplit`). Additive id so `hub-labsbrowse` stays one-way.
- **Director timeline steps (order):** Mirror §5.3 on a **0–600 ms** clock: charge 80 → beams 70 → bench to equal trio 420 → fifths fade/wipe → Sparky return `nearCore` → `sting.labsBrowseHub`.
- **Duration budget:** **600 ms**
- **Tokens used:** `sfBloom`, `slotSlide`, `glassWipe`, `sparkyPing`.
- **Sparky reaction:** Lip → `nearCore`. Clip `walk` / `idle.a`.
- **Audio:** `sting.labsBrowseHub` (placeholder).
- **Reduced-motion substitute:** **200 ms** crossfade `labsBrowse` → `hubSplit`.
- **Owner status:** draft

### 6.7 `level-up`

- **Fill-in:** `DRAFT`
- **Class:** cinematic **≤ 1.5 s** skippable
- **Trigger:** Level-up / mastery-claim / lab-completion ceremony retargeted to the stage (`ForgeCompleteCeremony`, `CelebrationOverlay` — TAP §2.7). Plays **on** the current layout (often `playStage` or `hubSplit`); does **not** by itself merge or split glass.
- **Director timeline steps (order):** wall-clock **≤ 1500 ms**. Theatre JSON `beats/level-up.json`.
  - **t = 0–200:** emitter / beam burst accent (`sfBloom`).
  - **t = 0–1500:** Sparky `cheer` (1.5 s — fills the cap; skippable). Spot `frontCenter` or current attend spot (no long walk).
  - **t = 200–1500:** confetti / molten-amber progress fills over the room (ceremonial palette; not a camera cut).
  - **t = 0–100:** `sting.levelUp`.
  - Optional: Sharp Suit pack is an **outfit calendar / occasion** swap — chain `outfit-swap` **after** skip/end if the pack is enabled; do not block the ceremony on the hitch.
- **Duration budget:** **1500 ms** skippable.
- **Tokens used:** `sfBloom`, `sparkyPing`, `sparkyHop` (inside `cheer`).
- **Sparky reaction:** Clip `cheer`. Face `celebrating`. Chest badge pulse (spec §2.8a). HoloBubble `tip` optional.
- **Audio:** `sting.levelUp` (placeholder). Mute skips sting; still allow static badge chrome.
- **Reduced-motion substitute:** skip beat; **200 ms** crossfade / static ceremony (badge + copy, no cheer / confetti burst).
- **Runtime:** Theatre.js JSON via Director.
- **Skip / interrupt:** click / Enter / Space → end pose (cheer blend-out 120 ms per character spec).
- **Owner status:** draft
- **Notes:** Kid-visible → packet + recording when implemented.

### 6.8 `outfit-swap`

- **Fill-in:** `DRAFT`
- **Class:** cinematic beat optional; swap hitch TAP W3 **&lt; 100 ms**
- **Trigger:** Calendar pack change, `/profile` `avatarStudio` rack pick, occasion (Sharp Suit on ceremony). Parents can disable seasonal outfits — if disabled, this id no-ops.
- **Director timeline steps (order):**
  - **Beat (skippable, ≤ 1500 ms; v1 uses the 0.9 s `outfitSwap` clip):** Theatre JSON `beats/outfit-swap.json` aligned to Smith clip `outfitSwap` (0.9 s; swap at frame 14 @ 30 fps ≈ **467 ms** into the clip).
  - **Hitch:** attachment / material swap **&lt; 100 ms** at that frame (TAP W3). Not a glass morph; slabs hold.
  - Sparky stays on the current spot (`nearCore` or studio `rightLip` rack). Dome flash is on the clip, not `emit-burst`.
  - **t ≈ 0–80:** `sting.outfitSwap` (optional, soft).
- **Duration budget:** beat **900 ms** (≤ 1.5 s); hitch **&lt; 100 ms**.
- **Tokens used:** `sparkyPing`; no `morphDissolve` on glass.
- **Sparky reaction:** Clip `outfitSwap`. Face `happy`. Outfit rule: nothing covers the head dome.
- **Audio:** `sting.outfitSwap` (placeholder). Mute skips sting; swap still happens.
- **Reduced-motion substitute:** skip beat; **instant** material/attachment swap (0 ms hitch target; still &lt; 100 ms).
- **Runtime:** Theatre.js JSON + Smith swap API. GSAP only if no beat (reduced-motion / skip).
- **Skip / interrupt:** click / Enter / Space → instant swap at end pose, skip remaining clip.
- **Owner status:** draft

---

## 7. Out of scope for this fill-in PR

- Implementation (`director.ts`, GSAP timelines, Theatre JSON files, Tone.js buffers, SSIM) — later Director work after Stagehand hooks
- Layout registry numbers — Stagehand
- `public/forge-hub/` bytes — never
- `src/components/games/*` — never
- W0-04 CLAUDE.md v7 — separate packet
- Claiming W0-08 **done** — Foreman: **doing** until Foreman marks done after this fill-in lands
- Reopening plan decisions 1–13
- New Zustand stores; production flags; secrets

---

## 8. Director fill-in checklist

- [x] Replace every `TODO (Director)` on §5 pages (minimum)
- [x] Confirm or drop §4 / §6 extra ids — **confirmed** all stub ids; **added** `dual-exit` and `labsbrowse-hub`; holiday intro **no id in v1** (documented, not dropped)
- [x] Bind slice-1 ids 1:1 to a GSAP timeline or Theatre stub — **W2-02:** `emit-burst`, `login-success-hubsplit`, `first-visit-ignition` (stub JSON), `welcome-idle` ambient coordinator. **W2 Theatre fill:** `beats/first-visit-ignition.json` authored; Director samples JSON (GSAP master clock / scrubber). **W2 remainder:** `hub-labsbrowse` / `labsbrowse-hub`, `focus-in` / `focus-out`, `dual-enter` / `dual-exit`, `whisper-expand` / `whisper-close`, `lobby-playstage-merge` / `playstage-lobby-split`. Theatre `level-up` / `outfit-swap` stay unregistered.
- [x] Scrub tests at 0 / 0.2 / 0.5 / 0.8 / 1 for slice-1 ids **and W2 remainder morphs** (Director unit tests). Inspector still owns SSIM / Playwright morph recording.
- [ ] Packet + recording for each kid-visible beat — **when implemented; not this PR**
- [ ] Align names with `VOCABULARY.md` when W0-05 lands
- [ ] Then Foreman may mark W0-08 **done**

### 8.1 Audio sting ids (names only; no binary)

`bed.welcome` · `bed.hub` · `sting.loginSuccess` · `sting.hubLabsBrowse` · `sting.labsBrowseHub` · `sting.gameLaunch` · `sting.gameLaunchBurst` · `sting.lobbyReturn` · `sting.whisperOpen` · `sting.whisperClose` · `sting.emitBurst` · `sting.ignition` · `sting.focusIn` · `sting.focusOut` · `sting.dualEnter` · `sting.dualExit` · `sting.levelUp` · `sting.outfitSwap`

### 8.2 Tier-1 notes for Foreman

- **Do not change portal holds 420 / 560** without Stagehand + Foreman (already classified cinematic at 980 ms).
- Nesting full `emit-burst` inside every interactive morph would blow the 600 ms cap — v1 keeps burst **standalone**. Reversing that composition is Tier 1.
- Adding holiday-intro as a named id is Tier 1 (new transition).
- Token duration retunes vs R3F §4 candidates are Director v1 (documented in §1.1); treat further feel changes as Tier 2 once kids see them.
- **W2-02 Stagehand bind:** `registerMorphTargets(mode)` lives on Stagehand `src/lib/forge-hub/layouts.ts` (PR #176). Director lerps those targets; live HoloC seat is `HUBSPLIT_HOLO_C` `{31.2, 24, 37.6×48}`. `LAYOUT_MORPH_MS` = **420** (`slotSlide`); interactive wall-clock still ≤ 600 ms. Portal charge/emit remains 420/560. `?pose=lock` keeps the painted top seed.
- **W2 remainder (Director):** remaining interactive morphs bind the same Stagehand APIs. `playstage-lobby-split` slab is **340 ms** (bible §5.5) — not a `LAYOUT_MORPH_MS` retime. Whisper is a sub-layout (dim + HoloBubble), not a `ForgeRouteMode`. Do not nest `emit-burst` 420/560 inside these morphs. Stagehand W2-07 still owns login-on-HoloC + cycle smoke.

Agent: Director (Grok Bot Team)
