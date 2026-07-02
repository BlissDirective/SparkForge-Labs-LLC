# SparkForge DESIGN.md — v1.0 (July 2, 2026)

The canonical design system for the SparkForge redesign (Fable-5 rebuild,
Part III). Every R-phase PR must cite the tokens and patterns here.
**LOCKED** sections are owner-approved and in production. Everything else is
v1 draft — the owner reviews this document as the gate to the R1–R7 rollout.

Grounding research: decomposition of the owner's four reference sites
(sentry.io, irisyireihu.com, ciaoenergy.com, abvtek.com), a 2026 front-end
trend survey, and a react-bits ecosystem curation (reactbits.dev, MagicUI,
Aceternity). Full findings in Fable-5-SparkForge-Rebuild.md Part III.

---

## 1. Brand (LOCKED)

- **Name:** SparkForge (company: SparkForge Labs LLC)
- **Tagline:** "Sparking Curiosity, and Forging Skills with AI"
- **Personality:** curious · encouraging · luminous.
  Anti-adjectives: sterile, babyish, noisy, corporate.
- **Voice:** Sparky's voice is the product's voice — playful, never
  sarcastic, celebrates effort over correctness. Parent surfaces switch to
  calm-informative.

## 2. Mascot — Sparky (LOCKED)

- Canonical reference: `public/branding/sparky-reference.jpeg`.
- Single implementation: `src/components/sparky/SparkyCore.tsx` — full-body
  chibi chrome robot; lightning-bolt emblem; visor with scanline LED eyes;
  neon ear pods. **No mascot drawings may exist outside
  `src/components/sparky/`.**
- Identity neon **#4DE9FF** is constant (trim/emblem/pods); the 9
  expressions tint only face LEDs.
- Sizing: fixed sm/md/lg/xl (40/72/120/192px) in app surfaces; fluid
  `pixelSize` (CSS `clamp()`) on marketing surfaces.
- Rive upgrade path: `docs/SPARKY-RIVE-SPEC.md` (drop-in, no code changes).
- Usage discipline: Sparky appears where he *does* something (reacts,
  guides, celebrates, projects) — never as passive decoration.

## 3. Hero — "The Hologram Reveal" (LOCKED)

- Title "Welcome to SparkForge Labs" as a banded cyan-gradient hologram
  projected from a chrome puck; beam trapezoid fully encases the type at
  every viewport (beam + title share one measured container).
- Full sequence every visit (~3s); reduced-motion renders the finished
  composition instantly; mobile = same sequence, simplified cone.
- Subtitle = the tagline, solid (non-holographic), single text-effect sweep.
- Implementation: `src/components/landing/HeroHologram.tsx` (timeline in `T`).

## 4. Surfaces & Color

Two surfaces, one brand:

| | App dashboard (light) | Marketing (dark) |
|---|---|---|
| Base | `--sf-surface` #FFFFFF / alt #F8FAFF | #0A0F1E |
| Text | #1A1D2B / #52586E / #8C94AC | #F0F2F8 / rgba(255,255,255,.85–.5) |
| Brand accent | #4F6EF7 (primary), #E945F5 (pink) | same, plus neon #4DE9FF |
| Neon rule | cyan appears **saturated, not glowing** | glow allowed — accents, strokes, holograms only, never body text |

- **Lab recoloring (Ciao pattern):** the 11 lab colors (`src/config/labColors.ts`)
  recolor their lab's section/page over the neutral shell — the shell itself
  stays near-monochrome (AbvTek pattern) so lab colors and game art pop.
- Gradient discipline: brand gradient #E945F5→#4F6EF7 for CTAs; cyan→lab-color
  for in-lab headings; never more than one gradient system per view.
- Contrast floor: WCAG AA enforced by `tests/unit/no-low-contrast-text.test.ts`
  (never use `text-white/10..40`).

## 5. Typography

**Decision (resolves a live conflict):** the app currently declares two font
systems — Nunito/Inter in `src/styles/design-tokens.css` and Exo 2/Sora in
`src/app/globals.css` (the latter wins by load order and is what users see).
**Canon: `--font-display: 'Exo 2'` · `--font-body: 'Sora'`** — the techy,
rounded-geometric pairing matches the chrome/hologram brand and stays
legible for young readers. R1 deletes the stale Nunito/Inter declarations.

- Scale by **size contrast, not weight soup** (AbvTek pattern): display
  clamps (hero `clamp(2rem, 7vw, 5.6rem)`; section h2 `clamp(1.75rem, 4vw, 3rem)`),
  body 16–18px, captions 13–14px. Minimum body size for kids: 16px.
- One kinetic-type moment per page maximum (marketing only); body text never
  animates.
- Poetic microcopy headers (AbvTek): every lab gets one line, kid-legible
  ("Teach a robot to see").

## 6. Motion vocabulary

- **Springs are the default** for interactive UI (motion/react):
  stiffness 300 / damping 20 for reactions; 80/18 for lazy-follow. Clamped —
  no wobble.
- **Scroll reveals:** `whileInView` + `viewport={{ once: true, margin: '0px 0px 25% 0px' }}`;
  migrate simple reveals to native CSS `animation-timeline` where supported
  (feature-detected); GSAP reserved for pinned/complex sequences only.
- **View Transitions API** (Next 15) for card→page morphs (lab card → lab
  page, game card → game) as progressive enhancement — navigation never
  gates on it.
- **Motion restraint (Sentry pattern):** animation only where it carries
  meaning. No decorative parallax fields, no scroll-jacking, no full-page
  preloaders, no custom cursors.
- **Reduced-motion contract:** every sequence ships an instant-on final
  state; `prefers-reduced-motion` is honored globally (MotionConfig) and
  per-component.
- **Celebration hierarchy:** ClickSpark (any tap) < CountUp (numbers) <
  Confetti (earned wins) < StickerPeel (badges) — earned moments only, so
  celebration retains meaning (no fake urgency, no dark patterns).

## 7. Component canon

Base: SFButton / SFCard / SFInput / SFBadge / SFProgressBar (existing) — all
consume §4 tokens. New structural patterns:

- **Bento grid** (max 1–2 per page): marketing "inside the labs" grid;
  dashboard home stats.
- **Chapter sections** (Sentry progressive-disclosure rhythm): marketing
  pages are fixed narrative beats — promise → proof → capability → trust →
  CTA; one idea per beat.
- **Product-frame proof** (Sentry): real game/dashboard screenshots do the
  explaining on marketing; internals later.
- **Specimen pages** (iris yirei hu archive pattern): each lab/game gets a
  richly documented page — imagery leads, caption-scale copy.
- **Numbered gallery pagination** (AbvTek 01/04): game-preview sliders
  inside lab pages.
- **Bookended nav** (Ciao): marketing header map mirrored in the footer.
- **Glassmorphism-lite**: low-blur frosted panels with real borders for
  dashboard overlays + game HUDs only; always AA text.

### 7.1 react-bits curation (owner directive: re-curate, don't remove)

| Current | Verdict |
|---|---|
| ClickSpark | KEEP — kid feedback; recolor per lab |
| CountUp | KEEP — XP/score/streak counters |
| GradientText | KEEP — headings only, brand or cyan→lab gradients |
| OrbitalRing | KEEP — loading/"thinking" indicator (on-brand AI motif) |
| StarBorder | KEEP — badges, streaks, premium CTAs |
| TiltedCard | KEEP — game cards; tilt ≤ 6°, off for touch/reduced-motion |
| FloatingLines | RESTYLE — dark marketing only; tint #4DE9FF, lower density |
| MetallicPaint | RESTYLE — exclusively Sparky chrome + brand wordmark |
| SpotlightCard | RESTYLE — dark marketing only; light dashboard uses soft border-glow hover |
| GalaxyBackground | REPLACE → reactbits `soft-aurora`/`grainient` (calmer, cheaper) |
| ShinyText | RETIRE — one text-effect system (GradientText + SplitText); currently used on the hero tagline → swap during R-marketing pass |
| AmbientParticles | RETIRE — confirmed (Decision 20.0) |

**Additions (licenses verified):** SplitText, MagicBento, StickerPeel,
ElectricBorder, LightRays (reactbits — MIT+Commons Clause, fine for product
use); Confetti, AnimatedBeam, Marquee (MagicUI — MIT). AnimatedBeam doubles
as the Lab-11 agent-graph visual. LightRays becomes the hologram hero's
backdrop light source. 21st.dev components require per-component license
checks — prefer the MIT sources above.

**Coherence rules:** one background system per surface (aurora/grainient on
marketing-dark; flat + subtle grain on dashboard-light) · one text-effect
system · celebrations only for earned moments.

## 8. Page archetype recipes

- **Marketing chapter page:** dark shell → hologram/section hero → chapter
  beats (§7) → bookended footer. Scroll reveals 25%-early; scanline/neon
  accents; product frames as proof.
- **Dashboard page:** light shell (Sidebar/TopBar/BottomNav) → h1 +
  GradientText → content cards on `--sf-surface` → honest empty states with
  Sparky and a next-action CTA. No neon glow; saturated accents.
- **Game shell:** lab-colored frame chrome; GameStage center; SparkyRive
  dock (juice-driven); celebration ritual on complete (stars → CountUp XP →
  Sparky celebrating → "one more?"); glass HUD panels.
- **Form/settings:** white cards, labeled inputs (never placeholder-only),
  inline validation, parent-calm tone.
- **Parent surfaces:** denser, quieter variant — same tokens, smaller type
  scale, no celebrations, weekly-digest visual language.

## 9. Accessibility floor (non-negotiable)

AA contrast (guard-tested) · touch targets ≥ 44px · full keyboard paths +
visible focus (`--sf-border-focus`) · `aria-live` for game feedback ·
reduced-motion contract (§6) · no information conveyed by hover/cursor only ·
minimum body 16px · dyslexia-font and high-contrast toggles keep working
(A11yProvider).

## 10. Avoid list (dated or wrong for kids)

Full-page preloaders · scroll-jacking · heavy parallax everywhere ·
brutalist/anti-design · decrypt/glitch text as a primary treatment (tiny
doses only — note: LandingCTA's DecryptedText hover is at the allowed
minimum) · infinite ambient particle fields · fake-urgency gamification ·
custom cursors · upsells inside child gameplay (hard rule from Part II).

## 11. Governance

- LOCKED = owner-approved; changing it requires an owner decision recorded
  in Fable-5-SparkForge-Rebuild.md Part III.
- Guard tests enforce the floor: contrast, spacing-token budget, design-
  matrix sync (`node scripts/generate-design-matrix.mjs --write` after token
  changes).
- Every R-phase PR: before/after screenshots (desktop + 390px mobile),
  guards green, tokens/patterns cited from this document.
- react-bits additions require: license check (MIT preferred), reduced-motion
  behavior, one-surface assignment (§7.1 coherence rules).
