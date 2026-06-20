# Higgsfield UI Redesign Plan — Cinematic Reinvention of SparkForge

> **Date:** 2026-06-16
> **Companion docs:** `Fable-Frontend-Enhancement.md`, `Game-Migration-Map.md`, `Ui-Creation.md`
> **Status:** PLAN — pending Phase-0 look-dev approval before any production build.
> **Creative brief (locked with stakeholder, 2026-06-16):**
> - **Scope:** whole app, end to end.
> - **Direction:** clean-sheet **fresh art direction** — Higgsfield drives a new look; Frost-Prismatic is *not* a constraint.
> - **Worlds:** **11 distinct cinematic lab worlds** (palette + backdrop + soundscape each).
> - **Assets to ship:** Higgsfield **Soul** stylized stills/textures · **cinematic video** backdrops + transition stingers · **animated Sparky / mascot** clips.
> - **Fidelity:** maximum, per the Tech Quality Mandate. Performance + COPPA handled via fallback tiers, not as a ceiling.

---

## 0. What exists today (the thing we are replacing)

A 2026-06-16 review of `setup-sparkforge-dev`:

- **Architecture:** HTML-first. The WebGPU "Laboratory Control Station" cockpit was **retired** (see `GameShell.tsx` header) in favor of a React-DOM v2 redesign. R3F/three remain in deps and in flagship *game* scenes, not the app shell.
- **Landing** (`src/app/(marketing)/page.tsx`): `HeroSection` (OGL `FloatingLines` shader bg + `HeroContent`) → `LandingAITutor` → `LandingFeatures` → `LandingHowItWorks` → `LandingCTA`. Background `#0A0F1E`.
- **Design system** (`src/components/ui/SF*.tsx`): glassmorphism cards/buttons/badges/modals/progress — chrome-edge borders, neon glow, dark surfaces.
- **Effect kit** (`src/components/bits/*`): `GalaxyBackground`, `SpotlightCard`, `TiltedCard`, `StarBorder`, `MetallicPaint`, `GradientText`, `ShinyText`, `ClickSpark`, `OrbitalRing`, `FloatingLines`, `AmbientParticles`, `CountUp`.
- **Tokens** (`globals.css` + `design-tokens.css`): OKLCH neon accents (L=0.75), surfaces `≈#0A0E17`, fonts Exo 2 (display) / Sora (body) / Orbitron (data) / JetBrains Mono.
- **Motion stack in use:** `motion` (ex-Framer), `gsap`, `@theatre/core`, OGL (FloatingLines); R3F + drei + postprocessing + rapier + uikit for game 3D; **Pixi v8 + Rive** added this session.
- **Adaptivity:** `useDeviceProfile` tiers (mobile/tablet/desktop/ultrawide), `withReducedMotion`, `withDeviceProfile`, `MobileDashboard` fallback.

**Verdict:** competent and consistent, but **template-like** — procedural shader backgrounds and generic "React Bits" effects rather than authored, branded, cinematic media. There is no through-line of *story* or *place*. That is exactly the gap Higgsfield closes.

---

## 1. Higgsfield in this stack — what it is and is not

Higgsfield is a **cinematic generative-media pipeline**, not a runtime engine:

| Higgsfield capability | Output | Where it lands in SparkForge |
|---|---|---|
| **Soul** (photoreal / stylized image model, style-lockable) | stills, tileable textures, sprite sheets | CSS/Pixi/R3F textures, poster frames, lab key art, marketing imagery, replaces emoji per `Ui-Creation.md` |
| **Video + DoP motion** (camera moves, VFX presets) | looping MP4/WebM, transition stingers | `<video>` cinematic backdrops, route-transition stingers (wormhole / lab reconfigure / celebration) |
| **Speak / talking-avatar** (lip-sync) | short avatar clips | animated Sparky reactions + intros; also reference for Rive states |

It is an **asset pipeline that sits beside** the existing runtime (CSS / `<video>` / Pixi / R3F), the same way Scenario/Blender sit in the Fable plan. It does **not** render interactively in-browser. Implication: the redesign is "author cinematic media, then wire it in" — the runtime architecture (Next App Router, the Pixi archetypes, Rive mascot, GameShell) is preserved and *fed*, not rebuilt.

**Prerequisite:** the Higgsfield MCP is **not connected** in this session. Wiring it (or its API) is step 0 of execution. Until then, this plan is fully actionable as art-direction + integration architecture; generation is gated on access.

---

## 2. Phase 0 — Art-direction look-dev (the "fresh direction" gate)

Because the direction is clean-sheet, we do **not** assume a final look. Phase 0 produces it.

1. **Generate 3 candidate world-bibles** with Higgsfield Soul, each a complete mini-style: key art for the home screen, one lab, Sparky, and a UI panel. Proposed starting tracks (to be explored, not pre-decided):
   - **Track A — "Luminous Frontier":** warm bioluminescent wonder; soft volumetric light, organic glass, hopeful. Leans younger (band A/B).
   - **Track B — "Neon Atelier":** evolved dark-neon; cinematic depth, lens FX, film grain — the current DNA pushed to film quality. Leans older (band C).
   - **Track C — "Paper Cosmos":** tactile illustrated-3D hybrid; storybook materials with cinematic camera. Widest age span.
2. **Selection gate (human + SSIM discipline):** stakeholder picks one (or a blend). Lock it as the **style reference set + seed + prompt kit** so every later generation is consistent (the Mythos SSIM ≥ 0.96 rule extends to brand media).
3. **Produce the Brand Bible v1:** palette (re-derived, may supersede `labColors.ts` accents), type pairing, motion language, material rules, Sparky design, the per-lab world matrix (§4), and a locked prompt/style-ref kit checked into `docs/UI-Game-Enhancements/brand/`.

**No production UI work starts until Phase 0 is approved.**

---

## 3. The Higgsfield asset pipeline (production architecture)

```
LOOK-DEV     Higgsfield Soul → 3 candidate bibles → pick → style-lock (seed + refs + prompt kit)
STILLS       Soul → key art / textures / sprite sheets → public/cinematic/stills/<lab>/...
VIDEO        Higgsfield video + DoP → loops + stingers → public/cinematic/video/<surface>/*.{webm,mp4}
AVATAR       Higgsfield Speak → Sparky clips → public/cinematic/sparky/*.{webm}  (+ Rive states)
WIRE-IN      <CinematicBackdrop> (video+poster) · Pixi textures · R3F env · CSS bg · next/image
QA           Playwright screenshot + window.__SPARKFORGE_GAME__ + SSIM ≥ 0.96 + COPPA review gate
```

- **Storage & manifest:** all generated media under `public/cinematic/`, indexed by a typed `cinematicManifest.ts` (surface/lab → asset + poster + duration + tier). One import gives any component its art.
- **A new shared component, `<CinematicBackdrop>`:** wraps `<video autoPlay muted loop playsInline poster=…>` with: device-tier source selection (full / lite / poster-only), `prefers-reduced-motion` → static poster, lazy mount via `IntersectionObserver`, and a Pixi/R3F overlay slot for interactive foreground. This is the single seam between authored media and the live UI.
- **Style-lock:** every asset is generated from the locked seed + reference set; new assets are reviewed against the bible before merge.

---

## 4. The 11 lab-world bible (distinct worlds)

Each lab is a place. Lab hue from `labColors.ts` anchors the world (final palette set in Phase 0). Each gets: a **Soul key-art backdrop**, a **video ambient loop**, an **entry stinger**, and a **Tone.js soundscape**. This is the cinematic layer over the `Game-Migration-Map.md` archetypes.

| Lab | Name | Anchor hue | World concept | Signature transition stinger |
|----|------|-----------|---------------|------------------------------|
| 1 | What IS AI? | `#0FB8FA` | a waking observatory of everyday objects revealing hidden "AI signals" | iris-open over a city at dawn |
| 2 | Teaching Machines | `#B67BFF` | a luminous training menagerie; creatures learning | a pet bounds toward camera |
| 3 | The Brain Inside | `#FF70AF` | a vast neural cavern, synapses firing as constellations | dive through a firing synapse |
| 4 | AI That Creates | `#D9A430` | a golden generative atelier; paint becomes light | a brushstroke blooms into a scene |
| 5 | AI Helpers | `#00D17A` | a friendly robotics workshop; helpers at work | a tool snaps into a robot arm |
| 6 | AI & Ethics | `#FF7050` | a warm-lit courthouse of scales and light | scales tip into balance |
| 7 | Computer Vision | `#10BAD2` | a cyan optics lab; lenses, light, focus pulls | a focus-pull resolves a blurry world |
| 8 | Words & Language | `#8F96FA` | a library of living language; floating glyphs | glyphs assemble into a sentence |
| 9 | Build Your AI | `#E68E28` | an orange maker-garage; blueprints to running apps | blocks snap into a machine |
| 10 | AI Futures | `#DE5AEA` | a fuchsia horizon of speculative invention | a portal opens to a future skyline |
| 11 | Agentic AI | `#6FFFE6` | a mint-cyan command web; agents orchestrating | nodes wire themselves into a team |

Each world ships in 3 tiers (video loop / short loop / static key art) for the fallback ladder (§7).

---

## 5. Surface-by-surface redesign (whole app)

| Surface | Today | Cinematic redesign |
|---|---|---|
| **Landing hero** | OGL FloatingLines + text | full-bleed `<CinematicBackdrop>` arrival film (Soul-locked), kinetic headline (GSAP/Theatre), CTA over depth. Poster fallback for reduced-motion. |
| **Landing sections** | React Bits cards | each feature section gets authored b-roll + parallax; "How It Works" becomes a 3-beat cinematic; Soul imagery replaces stock/emoji. |
| **Pricing** | static | tier cards over a calm ambient loop; subtle motion only (conversion clarity > spectacle). |
| **Auth / login** | form | cinematic lab-portal backdrop; `<CinematicBackdrop>` lite tier; brand wordmark moment. |
| **Onboarding** | stepper | the cinematic **arrival sequence** (the retired 8-beat hero, reborn as a Higgsfield film) — child meets Sparky (Speak avatar), picks an avatar, enters the cockpit. Skippable; auto-skips on mobile/reduced-motion. |
| **Dashboard home** | HTML cards | the **cockpit reimagined as cinematic media**: a hero backdrop of the lab map, animated Sparky greeter clip, level/XP/streak as kinetic data (`Orbitron` + CountUp), continue-CTA over film. Not WebGPU — video + DOM + Pixi accents. |
| **Lab map** | grid/ring | an explorable **galaxy of 11 worlds**, each tile previewing its world loop on hover/focus; entering plays the lab's stinger (§4) then routes. |
| **Lab world entry** | route change | full-screen stinger transition (video) → lab world backdrop persists behind that lab's games. This is the "wormhole delivered you somewhere" payoff. |
| **Game shell** | `GameShell` + Pixi/Rive | lab-world backdrop behind the Pixi archetype canvas; Sparky (Rive primary, Higgsfield clips for big moments); juice already wired. |
| **Celebrations / trophy** | 2D celebration | Higgsfield celebration stingers per tier (1–3 star), trophy room as a cinematic hall. |
| **Parent dashboard** | data UI | restrained: keep it calm, data-first; one tasteful brand backdrop, no heavy motion (parents want clarity). |
| **Mobile/tablet** | `MobileDashboard` | gets the **lite tier** — static Soul key art + one short loop on the home hero; cinematic identity without the bandwidth cost. |

---

## 6. Motion & transition system

- **Route transitions as film:** a `<CinematicTransition>` layer plays the relevant stinger (lab entry, celebration) over Next App Router navigation; falls back to a 200ms cross-fade on reduced-motion / lite tier.
- **Kinetic typography & data:** GSAP/Theatre timelines for headline reveals and the home data strip; `CountUp` retained for numbers.
- **Foreground interactivity stays code:** Pixi (games), Rive (mascot), CSS/Motion (UI) render *over* the authored video — Higgsfield is the set, code is the actors. Keeps everything responsive and accessible.
- **Theatre.js** (already a dep) sequences the onboarding arrival beats against the Higgsfield film.

---

## 7. Performance & fallback tiers (max fidelity *with* a floor)

Tier from `useDeviceProfile`; every cinematic asset ships in all applicable tiers via the manifest.

| Tier | Hero/lab backdrop | Stingers | Notes |
|---|---|---|---|
| **ultrawide / desktop** | full video loop (1080–1440p, VP9/AV1) | full | preconnect + preload next likely stinger |
| **tablet** | short loop (720p) | short | |
| **mobile** | static Soul poster + 1 short hero loop | cross-fade | bandwidth-first |
| **reduced-motion (any)** | static poster only | none | hard rule, honored everywhere |

- **Budgets:** first-load JS unchanged (the 230 kB shared chunk stays — media is `<video>`/CDN, not JS); video lazy-mounts via IntersectionObserver; posters are `next/image`. School-Chromebook target: poster-first, loop only after idle.
- **Delivery:** serve `/cinematic` from a CDN with range requests; AV1/VP9 with H.264 fallback; `preload="none"` + manual play on intersection.

---

## 8. COPPA / kid-safety gate (non-negotiable)

AI-generated media for a 6–16 audience requires a review gate **before any asset merges**:

- **No real or realistic human children**; Sparky and characters are clearly stylized non-human.
- **Brand-safe content review** of every generated clip/still (no unsafe, scary-for-young-band, or off-brand output); band-A assets held to a gentler bar.
- **Provenance logged:** prompt + seed + model + reviewer recorded in the asset manifest for auditability.
- **No data in = no PII risk:** generation uses brand prompts only, never child data.
- **Human sign-off** recorded per asset; the Playwright + SSIM checkpoint runs after approval, not instead of it.

---

## 9. Phased rollout (dovetails with the Pixi archetype migration)

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Look-dev: 3 candidate bibles → pick → Brand Bible v1 + style-lock | **stakeholder approval** |
| **1** | Pipeline: connect Higgsfield MCP, `cinematicManifest.ts`, `<CinematicBackdrop>` + `<CinematicTransition>`, fallback tiers | green build, perf budget held |
| **2** | Marketing reinvention (hero, sections, pricing, auth) | visual checkpoint, COPPA gate |
| **3** | Onboarding arrival + dashboard home cockpit | checkpoint |
| **4** | 11 lab worlds (key art + loop + stinger + soundscape), lab map galaxy | per-lab checkpoints; sequence with the Game-Migration-Map waves so a lab's world + its games land together |
| **5** | Game-shell backdrops + celebration stingers + Sparky clips | checkpoint |
| **6** | Mobile lite-tier, polish, full a11y + reduced-motion + perf pass | Lighthouse + SSIM + 60fps Chromebook |

Lab worlds (Phase 4) should be scheduled **lab-by-lab alongside the Pixi archetype waves** in `Game-Migration-Map.md §5`, so each lab is reskinned and its games migrated in the same sweep — one coherent shippable lab at a time.

---

## 10. Risks & open items

- **Higgsfield access/cost** — MCP not yet connected; account tier + generation volume drives timeline. (Cost is informational per the Tech Quality Mandate, but must be surfaced.)
- **Style drift** across many generations — mitigated by the locked seed/reference kit + per-asset review.
- **Video weight** on school networks — mitigated by the tier ladder + poster-first loading.
- **Fresh direction may re-skin `labColors.ts`** — if Phase 0 changes the palette, update the single source of truth (`labColors.ts`) so Tailwind + 3D + Pixi skins inherit it.
- **Two motion paradigms** (authored video + code) — bounded by the `<CinematicBackdrop>` seam (set vs actors).

---

## 11. Immediate next actions

1. **Approve / adjust** the three Phase-0 look-dev tracks (§2).
2. **Provision Higgsfield** (MCP or API key) so generation can begin.
3. On approval, I scaffold Phase 1 (manifest + `<CinematicBackdrop>`/`<CinematicTransition>` + fallback tiers) — buildable immediately, even before assets exist, using poster placeholders (same pattern as the Rive mascot fallback).

*Generated by Claude Code (Fable series). Grounded in a 2026-06-16 review of the setup-sparkforge-dev front end, the locked creative brief, `gameRegistry.ts`, and `labColors.ts`. No production UI work begins before the Phase-0 art-direction gate.*
