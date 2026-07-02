# SparkForge DESIGN.md (seed — v0.1, July 2, 2026)

Canonical design system for the full app redesign (Fable-5 rebuild Part III).
This is a living document: sections marked **LOCKED** are owner-approved and
in production; everything else is drafted during the DESIGN.md authoring
session (Part III.1) and must be approved before R-phase rollout.

## 1. Brand

- **Name:** SparkForge (company: SparkForge Labs LLC)
- **Tagline (LOCKED):** "Sparking Curiosity, and Forging Skills with AI"
- **Personality (draft):** curious, encouraging, luminous. Anti-adjectives: sterile, babyish, noisy.

## 2. Mascot — Sparky (LOCKED)

- Canonical reference: `public/branding/sparky-reference.jpeg` (owner-supplied).
- Single implementation: `src/components/sparky/SparkyCore.tsx` — full-body
  chibi chrome robot; glowing lightning-bolt emblem; dark visor with scanline
  LED eyes; neon ear pods; cyan trim. **No mascot drawings may exist outside
  `src/components/sparky/`.**
- Identity neon: **#4DE9FF** (trim/emblem/pods constant); expressions tint
  only the face LEDs (9 expressions, see EXPRESSIONS config).
- Sizing: fixed sm/md/lg/xl (40/72/120/192px) in app surfaces; **fluid
  `pixelSize` (CSS clamp) on marketing surfaces** so Sparky scales with the
  viewport.
- Future upgrade path: Rive per `docs/SPARKY-RIVE-SPEC.md` (drop-in, no code
  changes).

## 3. Hero — "The Hologram Reveal" (LOCKED)

- Title: **"Welcome to SparkForge Labs"** as a cyan-gradient hologram
  projected from a chrome puck that Sparky powers via an energy arc.
  Replaces the former "Learn AI. Build the Future." headline.
- Sequence plays **on every visit** (~3s); reduced-motion renders the
  finished composition instantly. Mobile runs the same sequence with
  simplified cone effects (no flicker/scanline animation).
- Subtitle (below animation, NOT holographic): the tagline, solid design-
  scheme color with a react-bits ShinyText sweep to differentiate it.
- Implementation: `src/components/landing/HeroHologram.tsx` (SVG + Motion,
  timeline constants in `T`).

## 4. Color (draft — to finalize in authoring session)

- App surface (light): tokens in `--sf-*` (see `src/styles/design-tokens.css`).
- Marketing surface (dark): base #0A0F1E; hologram/mascot cyan #4DE9FF;
  brand gradient #E945F5 → #4F6EF7 reserved for CTAs and accents.
- Guard rails: AA contrast enforced by `tests/unit/no-low-contrast-text.test.ts`.

## 5. Motion vocabulary (draft)

- Springs: stiffness 300 / damping 20 for expression/UI reactions;
  80/18 for lazy follow (cursor tracking).
- Reveal: `whileInView` with `viewport={{ once: true, margin: '0px 0px 25% 0px' }}`.
- Reduced motion: every sequence must have an instant-on final state.
- react-bits: **retained** per owner direction; current set is re-curated
  (not removed) during the authoring session — replacements must be more
  advanced, coherent, and visually stunning than what they replace.

## 6. Open (to draft in the authoring session)

Type scale & kinetic type rules · component canon (SFButton/SFCard/bento/
chapter sections) · per-page-archetype recipes · sound/haptics vocabulary ·
iconography · illustration/empty-state style · parent-surface variant.
