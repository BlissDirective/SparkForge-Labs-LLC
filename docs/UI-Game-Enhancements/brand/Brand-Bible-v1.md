# Brand Bible v1 — "Lumen: Papercraft Neon"

> **Date:** 2026-06-16 · **Status:** LOCKED (Phase 0 direction) — pending real Higgsfield refs to fill `[SEED_TBD]` / `[REF_TBD]`.
> **Parent:** `Higgsfield-UI-Redesign-Plan.md` · **Build doc:** `Higgsfield-Build-Playbook.md`
> **Phase-0 decisions logged (stakeholder, 2026-06-16):**
> 1. **Blend Track B × Track C** as the final direction.
> 2. **Lock** it as the style reference set + seed + prompt kit (this document).
> 3. This is **Brand Bible v1**.

---

## 1. The direction — a blend, named "Lumen"

**Neon Atelier (Track B)** × **Paper Cosmos (Track C)** =

> **Lumen — Papercraft Neon:** hand-crafted, tactile *illustrated-3D* materials (cut paper, felt, painted board, soft clay) staged in **cinematic neon depth** — volumetric light, lens focus-pulls, gentle film grain. The warmth and approachability of a storybook, lit and shot like a film.

Why the blend works for ages 6–16: the **papercraft tactility** keeps it friendly and unintimidating for band A/B; the **cinematic neon lighting, depth-of-field, and lens FX** keep it genuinely cool for band C. One world, both audiences — no "kiddie" ceiling, no "cold sci-fi" floor.

**One-line generation north star (the style spine of every prompt):**
> *"tactile cut-paper and soft-clay illustrated 3D, layered papercraft depth, lit with cinematic volumetric neon rim-light, shallow depth of field, subtle film grain and gentle bloom, dark ink background, premium children's-film quality"*

---

## 2. Palette

Deep ink "paper" darks carry neon rim-light; the 11 lab hues stay the chromatic anchors (kept from `labColors.ts` so Tailwind/3D/Pixi inherit one source of truth — update that file if Phase-0 refs shift a hue).

### Core neutrals (proposed — confirm against first refs)
| Token | Value | Use |
|---|---|---|
| `--ink-900` | `oklch(0.12 0.02 270)` | deepest background paper |
| `--ink-800` | `oklch(0.16 0.02 275)` | card / panel paper |
| `--ink-700` | `oklch(0.20 0.02 280)` | raised papercraft layer |
| `--paper-50` | `oklch(0.96 0.01 90)` | warm "paper white" text/highlights |
| `--grain` | film-grain overlay | 3–5% opacity, screen blend |

### Lab anchor hues (from `labColors.ts`, neon rim-light application)
1 `#0FB8FA` · 2 `#B67BFF` · 3 `#FF70AF` · 4 `#D9A430` · 5 `#00D17A` · 6 `#FF7050` · 7 `#10BAD2` · 8 `#8F96FA` · 9 `#E68E28` · 10 `#DE5AEA` · 11 `#6FFFE6`

### Application rules
- **Rim, don't flood.** Lab hue appears as neon edge-light, glow, and accent — never as a flat fill. Surfaces stay ink/paper.
- **One hero hue per screen** (the active lab); neutrals everywhere else.
- **Glow = depth cue.** Brighter neon = nearer layer; dim = far. Reinforces papercraft parallax.
- **WCAG:** text stays `--paper-50` on ink (passes AA); neon is decorative, never the only signal.

---

## 3. Typography (proposed pairing — finalize in look-dev)

Fresh direction → warmer display with character, kept-clean body, sci-fi data.
| Role | Face | Rationale |
|---|---|---|
| Display | **Clash Display** (or **Cabinet Grotesk**) | confident, friendly geometric — storybook-meets-modern |
| Body | **Sora** (kept) | neutral, legible, already self-hosted |
| Data / numbers | **Orbitron** (kept) | cinematic HUD numerals for XP/levels |
| Mono | **JetBrains Mono** (kept) | code games, API Explorer |

Kinetic type is part of the motion language (§5) — headlines arrive on a focus-pull, numbers `CountUp`.

---

## 4. Material & lighting rules (the look-lock)

Every generated asset and every CSS/Pixi/R3F surface obeys these so media and runtime read as one:
1. **Layered papercraft depth** — 3–5 parallax planes (cut-paper edges visible).
2. **Neon rim-light** on the hero subject in the active lab hue.
3. **Volumetric light + soft bloom** — cinematic, not blown out.
4. **Shallow depth of field** — focus on subject, background bokeh.
5. **Film grain 3–5% + subtle vignette + faint chromatic aberration** on edges.
6. **Soft materials only** — paper, felt, clay, painted board; no chrome/glass (this is the clean break from Frost-Prismatic).
7. **Warm key / cool fill** — papercraft warmth keyed against neon coolness.

---

## 5. Motion language

- **Cinematic camera:** dolly-in, focus-pull, parallax drift — applied to backdrops (video) and to layered stills (CSS/Pixi parallax).
- **Papercraft layer parallax** on mouse/scroll (honor `prefers-reduced-motion`).
- **Neon pulse** on interactive/active elements; **grain shimmer** at rest.
- **Transitions as film** — lab entry = focus-pull + stinger (§7 of plan); route changes cross-fade on lite tier.
- **Foreground stays code** — Pixi (games), Rive (Sparky), Motion/GSAP (UI) animate *over* the authored video. Higgsfield is the set; code is the actors.

---

## 6. Sparky (mascot) design

- **Form:** a small papercraft creature with a glowing neon core (hue shifts to the active lab). Clearly stylized, non-human (COPPA §8).
- **Three production paths, one design:**
  - **Soul** → turnaround sheet + expression sheet (idle/think/celebrate×3/encourage) → Rive reference.
  - **Rive** → the runtime state machine `SparkyMachine` (already wired in `JuiceProvider`; asset drops at `public/rive/sparky.riv`).
  - **Speak** → short lip-synced clips for onboarding intro + big celebration moments.
- Lab companions: same creature, lab-tinted core per world.

---

## 7. The 11 lab worlds (material + lighting per world)

Concept from the redesign plan; here with the Lumen material treatment.
| Lab | Hue | Papercraft world + lighting note |
|----|-----|----------------------------------|
| 1 What IS AI? | `#0FB8FA` | cut-paper city at dawn; AI "signals" glow blue through paper windows |
| 2 Teaching Machines | `#B67BFF` | felt menagerie; creatures with violet neon cores |
| 3 The Brain Inside | `#FF70AF` | layered-paper neural cavern; pink synapse fireflies |
| 4 AI That Creates | `#D9A430` | painted-board atelier; gold paint blooms into light |
| 5 AI Helpers | `#00D17A` | clay robotics workshop; green tool-glow |
| 6 AI & Ethics | `#FF7050` | warm paper courthouse; amber scales rim-lit |
| 7 Computer Vision | `#10BAD2` | paper-lens optics lab; cyan focus-pull motif |
| 8 Words & Language | `#8F96FA` | paper library; violet glyphs lift off the page |
| 9 Build Your AI | `#E68E28` | cardboard maker-garage; orange blueprint glow |
| 10 AI Futures | `#DE5AEA` | pop-up future skyline; fuchsia portal light |
| 11 Agentic AI | `#6FFFE6` | mint paper command-web; nodes wire in light |

Each ships 3 tiers: **video loop / short loop / static key art** (fallback ladder, plan §7).

---

## 8. The locked prompt kit

Reusable, style-locked generation templates. `{LAB_HUE}`, `{LAB_WORLD}`, `{SUBJECT}`, `{ASPECT}` are slots.

### 8.1 Style spine (prepended to every prompt)
```
STYLE = "tactile cut-paper and soft-clay illustrated 3D, layered papercraft depth with visible paper edges, cinematic volumetric neon rim-light in {LAB_HUE}, shallow depth of field, soft bloom, subtle film grain, faint vignette, dark ink background, warm key against cool fill, premium children's-film quality, no chrome, no glass, non-human characters"
NEGATIVE = "realistic human child, photoreal face, text, watermark, logo, chrome, glass, harsh glare, gore, scary, low-res, flat lighting"
```

### 8.2 Soul (stills / textures / key art)
```
{STYLE}, {LAB_WORLD}, {SUBJECT}, composition for {SURFACE}, aspect {ASPECT},
style-ref: [REF_TBD], seed: {SEED}
```
- Hero/home: `--ar 16:9` + a `9:16` mobile crop.
- Lab key art: `16:9` + `1:1` tile.
- Textures/sprites: tileable / sheet layout.

### 8.3 Video (ambient loops + stingers)
```
{STYLE}, {LAB_WORLD}, {CAMERA_MOVE}, seamless loop, 6–10s, {ASPECT},
DoP preset: {DOLLY|FOCUS_PULL|PARALLAX}, style-ref: [REF_TBD], seed: {SEED}
```
- Lab entry stinger uses the world's signature move (Bible §7 of plan).

### 8.4 Speak (Sparky)
```
papercraft creature with {LAB_HUE} neon core, {EXPRESSION}, lip-sync to script "{LINE}",
{STYLE}, transparent/dark bg, 2–4s, style-ref: [REF_SPARKY_TBD], seed: {SPARKY_SEED}
```

---

## 9. Seed-lock protocol

To keep hundreds of generations consistent:
1. **Master style refs:** the approved Phase-0 hero images are checked into `docs/UI-Game-Enhancements/brand/refs/` and referenced (`style-ref`) by *every* later prompt.
2. **Master seed:** the approved hero generation's seed becomes `MASTER_SEED = [SEED_TBD]`. Record it here on approval.
3. **Per-lab seed offsets:** `LAB_SEED(n) = MASTER_SEED + n` (n = lab id) — same family, per-world variation.
4. **Sparky seed:** `SPARKY_SEED = [SEED_TBD]`, fixed across all expressions.
5. **Manifest provenance:** every shipped asset records `{ prompt, seed, model, styleRef, reviewer, date }` in `cinematicManifest.ts` (COPPA §10 + auditability).
6. **Drift check:** new assets are eyeballed against the ref set and held to SSIM ≥ 0.96 vs the world's key art before merge.

---

## 10. COPPA / kid-safety gate (binds all generation)

- No real/realistic human children; characters clearly stylized non-human.
- Every still/clip human-reviewed before merge; band-A held to a gentler bar.
- Provenance (prompt+seed+model+reviewer) logged per asset.
- Generation uses brand prompts only — never child data.

---

## 11. Open until first generations land

- `[SEED_TBD]` master + Sparky seeds — fill on Phase-0 approval.
- `[REF_TBD]` style-reference images — drop into `brand/refs/`.
- Final type pairing — confirm display face against real key art.
- Any lab-hue shifts → update `src/config/labColors.ts` (single source of truth).

*Brand Bible v1. Direction locked; assets pending Higgsfield access. Generated by Claude Code (Fable series).*
