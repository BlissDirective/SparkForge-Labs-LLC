# Forge Hub — Motion Bible

**Status:** **STUB — Director owns fill-in**  
**Version:** v1 outline / skeleton only (Scribe W0-08)  
**Date:** 2026-09-15  
**Not a complete bible.** Full authoring waits until Director seats. This file is an empty spec sheet: named transitions, duration class, and reduced-motion substitutes. Timeline beats, tokens, Sparky reactions, and audio are `TODO (Director)`.

| | |
|---|---|
| **Owner (fill-in)** | Director (TAP v2.2 §11.1; `GROK_TEAM_PROMPTS.md` §7) |
| **Owner (stub outline)** | Scribe (this PR) |
| **Implements** | TAP v2.2 §2.6 choreography layer; §3 W0 item 9; §10 item 5 |
| **Decision lock** | `docs/01-decisions/2026-09-forge-hub.md` **#8** — every state change is a directed, interruptible Director sequence |
| **Vocabulary** | TAP v2.2 mode / panel names; forthcoming `docs/forge-hub/VOCABULARY.md` (W0-05). Until W0-05 lands, use TAP terms below. Do not invent aliases. |
| **Related (superseded for feel, useful for tokens)** | `FORGE_MOTION_BRAINSTORM.md`, `R3F_VARIATION_PLAN.md` §4 |

Foreman note: W0-08 stays **doing** until Director fills bodies. Merging this stub does **not** mean the motion bible is done.

---

## 0. How to read this stub

Each named transition has:

1. An **index row** (`id`, placeholder steps, duration budget, reduced-motion substitute).
2. A **stub page** with empty Director fields (trigger, ordered timeline, tokens, Sparky, audio, skip, owner status).

Scribe does **not** invent easing curves, Theatre.js keyframes, Tone.js stings, or clip names. Placeholder bullets are the TAP §2.6 canonical order only — copy them, then replace.

When Director fills a page: change that page's `Fill-in` line from `STUB` to `DRAFT` / `LOCKED`, keep the `id` stable, and leave reduced-motion as a first-class row (never an afterthought).

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
| **Portal reducer** | `idle → charge → emit → docked` (W1-02 port). Reduced motion → `SKIP_TO_DOCKED`. |
| **Compact / no canvas** | No Director timelines below 1440 px or on poster fallback. HTML shell only. |

Theatre.js beat candidates named in TAP / Director prompt (stub only; not authored here): first-visit ignition, game launch burst, level-up, holiday intro, outfit swap.

Motion tokens from `R3F_VARIATION_PLAN.md` §4 (names only; durations to be confirmed by Director against the caps above): `sfBloom` · `panelBreathe` · `yawTuck` · `slotSlide` · `glassWipe` · `sparkyPing` · `sparkyHop` · `morphDissolve`.

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

Modes also named in TAP §2.1 (no stub pages in the §10-item-5 minimum; extra stubs in §4): `avatarStudio`, `settingsDock`, `cinematic`, Focus, Dual, `FLAT`.

---

## 3. Index — TAP §10 item 5 (minimum)

Placeholder steps are TAP §2.6 order, not authored beats. **Duration budget** is the cap class, not a measured time.

| id | from → to / kind | steps (placeholder) | duration budget | reduced-motion substitute |
|----|-------------------|---------------------|-----------------|---------------------------|
| `welcome-idle` | first paint / idle ambient (`welcome`) | • hold `welcome` layout (sides ~85 %, HoloC login)  • run ambient loop (pulse, dust, breathe, flicker, Sparky idle)  • **TODO (Director):** first-paint vs locked equal-trio morph | **Ambient** (continuous). Any first-paint morph: **interactive ≤ 600 ms** | Skip ambient motion; static `welcome` pose (or **200 ms** crossfade into it). No breathe / hop / bloom. |
| `login-success-hubsplit` | `welcome` → `hubSplit` | • emitter charge  • beams retarget  • sides grow to equal  • outgoing fade (first fifth)  • mission wipe into HoloC (last fifth)  • Sparky wave `nearCore` + HoloBubble greeting  • audio sting  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade `welcome` → `hubSplit`. Skip wave / sting / beats. |
| `hub-labsbrowse` | `hubSplit` → `labsBrowse` | • emitter charge  • beams retarget  • slabs to labs bench  • outgoing fade  • incoming wipe  • Sparky attend labs slot  • audio sting  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade `hubSplit` → `labsBrowse`. Skip beats. |
| `lobby-playstage-merge` | `gameLobby` → `playStage` merge | • emitter charge  • beams retarget  • **3→1 merge** to yaw-0 PlayStage  • outgoing fade  • game shell wipe-in  • room **dim**  • Sparky attend stage  • optional Theatre **game launch burst**  • audio sting  • **TODO (Director)** | Morph **interactive ≤ 600 ms**. Optional burst **cinematic ≤ 1.5 s**, skippable | **200 ms** crossfade to merged PlayStage + dim. Skip burst / merge-dissolve. |
| `playstage-lobby-split` | `playStage` → `gameLobby` split | • lift dim  • emitter charge  • beams retarget  • **1→3 split**  • outgoing fade  • lobby wipe-in  • Sparky return  • audio sting  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade PlayStage → `gameLobby`. Skip split-dissolve / beats. |
| `whisper-expand` | Whisper (HoloBubble expand) | • main panels dim  • HoloBubble grow toward center  • Sparky `whisper` lean at `frontCenter`  • beam dome → bubble  • **TODO (Director):** open vs close as one id or pair | **Interactive ≤ 600 ms** | **200 ms** crossfade: panels dim + bubble at whisper size. Skip lean / spring. |
| `emit-burst` | Emit burst (portal reducer) | • `idle`  • `charge`  • `emit`  • `docked`  • **TODO (Director):** which mode changes this punctuates; dissolve vs morph | **Interactive ≤ 600 ms** unless Director classifies **cinematic ≤ 1.5 s** skippable | **200 ms** crossfade + reducer **`SKIP_TO_DOCKED`**. No charge/emit performance. |
| `first-visit-ignition` | first-visit ignition (Theatre.js) | • authored beat JSON  • skip targets (click / Enter / Space)  • land `welcome` idle  • **TODO (Director):** steps, Sparky clip request to Smith | **Cinematic ≤ 1.5 s**, skippable | **Skip beat.** **200 ms** crossfade (or instant) into idle `welcome`. |

---

## 4. Extra named transitions (GROK_TEAM_PROMPTS §3 item 7) — stub rows only

Not in TAP §10 item 5 minimum. Listed so Director has ids. Bodies remain TODO.

| id | from → to / kind | steps (placeholder) | duration budget | reduced-motion substitute |
|----|-------------------|---------------------|-----------------|---------------------------|
| `whisper-close` | Whisper → prior layout | • reverse expand  • panels undim  • Sparky return  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade to prior layout |
| `focus-in` | any → Focus | • yaw-tuck sides  • HoloC expand  • content fade/wipe  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade to Focus |
| `focus-out` | Focus → prior | • reverse Focus  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade to prior |
| `dual-enter` | any → Dual | • two mid + C strip  • **TODO (Director)** | **Interactive ≤ 600 ms** | **200 ms** crossfade to Dual |
| `level-up` | ceremony | • Theatre.js beat  • **TODO (Director)** | **Cinematic ≤ 1.5 s**, skippable | Skip beat; **200 ms** crossfade / static ceremony |
| `outfit-swap` | Sparky outfit | • Theatre.js beat + swap  • **TODO (Director)**; TAP W3: swap &lt; 100 ms hitch | Beat **≤ 1.5 s** skippable; swap hitch TAP W3 | Skip beat; instant material/attachment swap |

Holiday intro (Theatre.js candidate in Director prompt): **no id yet** — Director adds a row if shipped in v1.

---

## 5. Stub pages — TAP §10 item 5

Copy the field list. Replace every `TODO (Director)`. Do not delete `id`.

### 5.1 `welcome-idle` — welcome (first paint / idle ambient)

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** ambient (+ optional interactive first-paint morph)
- **Trigger:** TODO (Director) — first paint of `/` `/login` `/signup` in `welcome`; returning idle
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: hold welcome layout; ambient loop; optional equal-trio → shrunken-sides morph
- **Duration budget:** ambient continuous; first-paint morph **≤ 600 ms** if any
- **Tokens used:** TODO (Director) — candidates: `panelBreathe`, `sfBloom` (idle)
- **Sparky reaction:** TODO (Director) — TAP: idle / blink; optional idle wave
- **Audio:** TODO (Director) — none vs bed; mute + D3D-5
- **Reduced-motion substitute:** static welcome pose or **200 ms** crossfade; no ambient motion
- **Runtime:** GSAP ambient loops (not Theatre.js). Interruptible if a morph starts.
- **Skip:** n/a for idle; first-paint morph follows interactive interrupt rules
- **Camera:** fixed; ± 2 % micro-dolly ok
- **Owner status:** stub
- **Notes:** Distinct from `first-visit-ignition`. Decision #7 layout. Welcome vs lock equal-trio is still a Director/Stagehand call inside this stub.

### 5.2 `login-success-hubsplit` — login success → hubSplit

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive morph
- **Trigger:** TODO (Director) — auth success; `/home` `hubSplit`
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: charge → beams → sides grow → fade → mission wipe → Sparky wave `nearCore` + HoloBubble greeting → sting
- **Duration budget:** **≤ 600 ms**
- **Tokens used:** TODO (Director)
- **Sparky reaction:** TODO (Director) — TAP §2.9 wave + greeting
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade; skip wave / sting / beats
- **Runtime:** GSAP
- **Skip / interrupt:** overwrite; do not leave slabs mid-morph
- **Camera:** fixed; ± 2 % micro-dolly ok
- **Owner status:** stub
- **Notes:** `/signup` `/forgot-password` `/reset-password` wipe HoloC **without** this morph (TAP §2.9).

### 5.3 `hub-labsbrowse` — hub → labsBrowse

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive morph
- **Trigger:** TODO (Director) — `/labs` (and reverse? add `labsbrowse-hub` if needed)
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: charge → beams → slabs to bench → fade → wipe → Sparky attend → sting
- **Duration budget:** **≤ 600 ms**
- **Tokens used:** TODO (Director) — candidates: `slotSlide`, `glassWipe`, `yawTuck`
- **Sparky reaction:** TODO (Director)
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade
- **Runtime:** GSAP
- **Skip / interrupt:** overwrite
- **Camera:** fixed; ± 2 % micro-dolly ok
- **Owner status:** stub
- **Notes:** Id is hub → labs only. Reverse is a new id if shipped.

### 5.4 `lobby-playstage-merge` — gameLobby → playStage merge

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive morph + optional cinematic burst
- **Trigger:** TODO (Director) — game pick; registry `stage: 'glass'` (fullscreen hatch is **not** this morph)
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: charge → beams → 3→1 merge yaw 0 → fade → shell wipe → dim → Sparky → optional launch burst → sting
- **Duration budget:** morph **≤ 600 ms**; burst **≤ 1.5 s** skippable. TAP W5: launch morph to first input **&lt; 1.2 s**
- **Tokens used:** TODO (Director) — candidates: `morphDissolve`, `slotSlide`, `glassWipe`
- **Sparky reaction:** TODO (Director)
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade to PlayStage + dim; skip burst
- **Runtime:** GSAP morph; Theatre.js JSON if burst ships
- **Skip / interrupt:** burst: click / Enter / Space; morph: overwrite
- **Camera:** fixed; ± 2 % micro-dolly ok; **no cuts**
- **Owner status:** stub
- **Notes:** No edits in `src/components/games/*`. Phaser/Pixi: `frameloop: 'demand'` after morph (Stagehand/Glazier).

### 5.5 `playstage-lobby-split` — playStage → gameLobby split

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive morph
- **Trigger:** TODO (Director) — finish, quit, back to `/arcade`
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: lift dim → charge → beams → 1→3 split → fade → lobby wipe → Sparky return → sting
- **Duration budget:** **≤ 600 ms**
- **Tokens used:** TODO (Director)
- **Sparky reaction:** TODO (Director)
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade to `gameLobby`
- **Runtime:** GSAP
- **Skip / interrupt:** overwrite
- **Camera:** fixed; ± 2 % micro-dolly ok
- **Owner status:** stub
- **Notes:** Reverse of `lobby-playstage-merge` without the launch burst unless Director adds a return sting.

### 5.6 `whisper-expand` — Whisper (HoloBubble expand)

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive morph (sub-layout, not a `ForgeRouteMode`)
- **Trigger:** TODO (Director) — tap Sparky / bubble; tutor shortcut; Director onboarding
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: dim trio → bubble expand → Sparky whisper lean `frontCenter` → dome beam
- **Duration budget:** **≤ 600 ms**
- **Tokens used:** TODO (Director)
- **Sparky reaction:** TODO (Director) — clip `whisper`; Smith names after C1
- **Audio:** TODO (Director) — text-only v1 (decision #13)
- **Reduced-motion substitute:** **200 ms** crossfade to dim + expanded bubble; skip lean / spring
- **Runtime:** GSAP; HoloBubble follow-spring is Stagehand — Director times the expand
- **Skip / interrupt:** Escape closes (see `whisper-close`)
- **Camera:** fixed; ± 2 % micro-dolly ok
- **Owner status:** stub
- **Notes:** Whisper = bubble expand, **not** chat on HoloC (TAP §2.8b). During `playStage`, bubble stays `ping` / `tip` only.

### 5.7 `emit-burst` — Emit burst (portal reducer charge → emit → docked)

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive unless Director promotes to cinematic
- **Trigger:** TODO (Director) — punctuation on mode change vs explicit `cinematic`
- **Director timeline steps (order):**
  - TODO (Director) — placeholder: `idle` → `charge` → `emit` → `docked`; optional morphDissolve
- **Duration budget:** **≤ 600 ms** interactive **or** **≤ 1.5 s** cinematic skippable (pick one; do not exceed both)
- **Tokens used:** TODO (Director) — candidates: `sfBloom`, `morphDissolve`
- **Sparky reaction:** TODO (Director) — brainstorm “rides beam” is **not** locked; desk character may only glance / hop
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade + **`SKIP_TO_DOCKED`**
- **Runtime:** GSAP driving ported `portalMachine` (W1-02). Not Theatre.js unless classified cinematic.
- **Skip / interrupt:** reduced-motion skip-to-docked; cinematic skip if classified
- **Camera:** fixed; ± 2 % micro-dolly ok; bloom is post, not a camera move
- **Owner status:** stub
- **Notes:** Depends on W1-02. Do not re-specify reducer states.

### 5.8 `first-visit-ignition` — first-visit ignition

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** cinematic beat
- **Trigger:** TODO (Director) — first visit / onboarding; skip-hero settings
- **Director timeline steps (order):**
  - TODO (Director) — Theatre.js JSON; land `welcome-idle`
- **Duration budget:** **≤ 1.5 s**, skippable (click / Enter / Space)
- **Tokens used:** TODO (Director)
- **Sparky reaction:** TODO (Director) — request clip from Smith by name/length after JSON exists (e.g. `ignition.wave`)
- **Audio:** TODO (Director)
- **Reduced-motion substitute:** **skip beat**; **200 ms** crossfade or instant `welcome` idle
- **Runtime:** Theatre.js JSON via Director; Studio only on `/dev/forge-hub?studio=1` in development
- **Skip / interrupt:** click / Enter / Space → `welcome-idle`
- **Camera:** fixed; ± 2 % micro-dolly ok; **no cuts**
- **Owner status:** stub
- **Notes:** Gate P1: “ignition plays”. Kid-visible → packet when implemented. Distinct from `welcome-idle`.

---

## 6. Extra stub pages (prompts list)

Same field contract. Bodies TODO.

### 6.1 `whisper-close`

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive **≤ 600 ms**
- **Trigger / steps / tokens / Sparky / audio:** TODO (Director) — reverse of `whisper-expand`; restore focus
- **Reduced-motion substitute:** **200 ms** crossfade to prior layout
- **Owner status:** stub

### 6.2 `focus-in` / `focus-out`

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive **≤ 600 ms**
- **Trigger / steps / tokens / Sparky / audio:** TODO (Director) — HoloC expand, sides yaw-tuck; reverse on out
- **Reduced-motion substitute:** **200 ms** crossfade
- **Owner status:** stub

### 6.3 `dual-enter`

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** interactive **≤ 600 ms**
- **Trigger / steps / tokens / Sparky / audio:** TODO (Director)
- **Reduced-motion substitute:** **200 ms** crossfade
- **Owner status:** stub
- **Notes:** Add `dual-exit` if Dual is not a one-way enter.

### 6.4 `level-up`

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** cinematic **≤ 1.5 s** skippable
- **Trigger / steps / tokens / Sparky / audio:** TODO (Director) — Theatre.js; retarget ceremonies to stage (TAP §2.7)
- **Reduced-motion substitute:** skip beat; **200 ms** crossfade / static
- **Owner status:** stub

### 6.5 `outfit-swap`

- **Fill-in:** `STUB — Director owns fill-in`
- **Class:** cinematic beat optional; swap hitch TAP W3 **&lt; 100 ms**
- **Trigger / steps / tokens / Sparky / audio:** TODO (Director)
- **Reduced-motion substitute:** skip beat; instant swap
- **Owner status:** stub

---

## 7. Out of scope for this stub

- Implementation (`director.ts`, GSAP, Theatre JSON, Tone.js, SSIM) — Director after Stagehand hooks
- Layout registry numbers — Stagehand
- `public/forge-hub/` bytes — never
- `src/components/games/*` — never
- W0-04 CLAUDE.md v7 — separate packet
- Claiming W0-08 **done** — Foreman: **doing** until Director fill-in

---

## 8. Director fill-in checklist (when seated)

- [ ] Replace every `TODO (Director)` on §5 pages (minimum)
- [ ] Confirm or drop §4 / §6 extra ids
- [ ] Bind each `id` 1:1 to a GSAP timeline or Theatre JSON
- [ ] Scrub tests at 0 / 0.2 / 0.5 / 0.8 / 1 (Inspector)
- [ ] Packet + recording for each kid-visible beat
- [ ] Align names with `VOCABULARY.md` when W0-05 lands
- [ ] Then Foreman may mark W0-08 **done**

Agent: Scribe (Grok Bot Team)
