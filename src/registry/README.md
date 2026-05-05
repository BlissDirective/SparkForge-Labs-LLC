# SparkForge Registry — Design Brief

> **This registry is a guiding reference, not a restriction.**
>
> It documents what SparkForge is *today* and what makes SparkForge **SparkForge**
> at the brand-DNA level. It is **not** a rulebook for visual design. AI design
> tools (v0, Subframe, Onlook, etc.) and human designers should read this brief,
> understand the brand, and feel free to **reimagine** anything outside the
> "Core / Preserve" lane below — including the entire current visual system.

This file is read first by any tool consuming the registry. Every other file
defers to the philosophy stated here.

---

## What is SparkForge?

A gamified AI learning platform for children ages 7–16. Eleven themed Labs,
35+ interactive games, adaptive content. Marketed to parents, used by kids.
The core promise: **kids discover, experiment, and build with artificial
intelligence**.

---

## Three lanes

Every part of the visual system falls into one of three lanes. Tools and
designers should treat them very differently.

### 🟢 Core / Preserve — non-negotiable brand DNA

These are the things that make SparkForge identifiable across any redesign.
Don't replace, don't dilute. Reimagine *how* they're presented, not *whether*
they're present.

| Asset | Why it's core |
|---|---|
| **The SparkForge wordmark** | The name is the brand. |
| **The SF mark / dichroic prism aesthetic** | Eye-extracted from the reference render `public/branding/IMG_4607.png`. The dichroic-glass-with-anamorphic-lensflare visual is the brand surface. WebGPU+TSL render is hand-engineered (`src/components/3d/branding/*`); design tools should *use* this surface as a slot, not try to recreate it in HTML/CSS. |
| **The 11 lab color identities** | Each lab is signaled by a specific OKLCH-balanced color. See `src/registry/lib/sparkforge-brand.ts`. The colors carry meaning across the product (lab pages, badges, charts, etc.) — they should remain distinct and recognizable. *How* they're used in any given screen is open. |
| **The "lab" metaphor** | Kids enter a Laboratory; they don't enter a "course" or a "module". The language and conceptual model — labs, experiments, missions, the cockpit — is brand. |
| **WebGPU+TSL 3D primitives** | `<BrandHero3D>`, `<CockpitPreview3D>`, `<LoginPanel3D>`, `<HolographicLabMap>`, `<SparkForgeWordmark3D>`, `<SfShardSet>`, `<LensflareTSL>`, `<HeroAnimation>`. These are world-class hand-engineered assets. Design tools won't recreate them; they should compose UIs *around* them as slots. See the slot wrappers in `src/registry/blocks/*-slot.tsx`. |

### 🟡 Current / Open to redesign — what we have today

This is the **Frost-Prismatic** visual system as currently implemented. It's
the starting point, not the destination. **You are explicitly invited to
replace any of it.**

- **Color mode:** dark-mode-only (`#02050d` deep navy field, eye-extracted from
  the reference render). Open to lighter, lab-themed, or hybrid modes.
- **Chrome bezels + glassmorphism** as the dominant chrome treatment. Open
  to flat, brutalist, soft-gradient, holographic, or any other treatment that
  carries the cockpit/laboratory metaphor.
- **Hex-tile lab grid** as the lab discovery surface. Open to ring,
  constellation, isometric, comic-panel, parallax-scroll, or any other layout.
- **Current typography hierarchy** (Exo 2 display, Sora body, JetBrains Mono
  monospace, Orbitron numeric). Open to alternatives that match a new
  direction; just keep type accessible (WCAG AA contrast).
- **Current button styles** (gradient blue→indigo CTAs, white-translucent
  outline secondaries, chrome-rim demo button). Open to anything.
- **Current scroll-journey "5-act" structure** for the marketing landing.
  Open to any narrative composition.
- **Current cockpit dashboard layout** (4 consoles + holographic lab map +
  dynamic environment). Open to layout changes; keep the cockpit *feel*.
- **Current Frost-Prismatic neon-on-navy palette** beyond the eye-extracted
  brand surface. Open to expanded palettes — softer pastels for kids 7–10,
  bolder neons for 11–16, age-band-aware themes, etc.

### 🔵 Reference signals — neither core nor current

These exist in the registry purely to give a tool *context* about the
product, not as a directive.

- Lab names + descriptions (in `lib/sparkforge-brand.ts`). Communicate what
  each lab is *about* so generated UIs use accurate copy.
- Audience signals (ages 7–16, parent-purchaser + child-user dual audience).
- Game-count metadata (35 games today, 42 planned).
- Tier metadata (Free / Plus / Forge subscription tiers).

---

## What design tools should do

When generating UIs from reference images + the SparkForge registry:

1. **Compose around the 3D slot blocks** rather than recreating them in HTML.
   `<BrandHeroSlot />`, `<CockpitPreviewSlot />`, `<LoginPanelSlot />`. These
   render the existing WebGPU+TSL canvases inline.
2. **Use the lab colors semantically** — if a UI has 3+ category cards,
   they should map to lab IDs. Don't pick arbitrary palette colors when a
   semantic lab color applies.
3. **Treat tokens as defaults, not laws.** If a reference image suggests a
   warmer palette, lighter mode, or different chrome treatment, follow the
   reference. Just keep brand DNA (wordmark, lab colors as identity, 3D
   primitives) intact.
4. **Don't overspecify.** A registry-aware tool that just produces good
   chrome around our 3D primitives is a win. We don't need every component
   to be registry-derived.

## What design tools should *not* do

- Don't try to recreate the brand-surface 3D in HTML/CSS. It's a WebGPU+TSL
  shader pipeline. HTML approximations will look like AI slop next to the
  real thing.
- Don't override lab colors with arbitrary palette picks. The 11 colors are
  identity, not decoration.
- Don't strip the "laboratory" / "cockpit" metaphor from copy. It's brand.
- Don't lock in to the Frost-Prismatic visual system as if it were a rule.
  *It's not.* Better is welcome.

---

## Versioning + intent

This brief is **v0.1** — intentionally lean. Expand as we learn what AI tools
actually need to know vs what they figure out on their own. The principle of
"reference, not restriction" is the constant; specifics evolve.

When in doubt: **brand DNA is the only constraint. Everything else is open.**
