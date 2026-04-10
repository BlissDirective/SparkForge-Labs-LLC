# Master Design Agent

> **A comprehensive AI design agent reference for Claude Code and all AI coding assistants.**
> Synthesized from [Impeccable](https://github.com/pbakaus/impeccable), [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md), [AIDesigner MCP](https://www.aidesigner.ai/docs/mcp), and Anthropic's frontend-design skill.
> Purpose: Enable any AI agent to produce distinctive, production-grade, fully-coded frontend/UI/UX for any app idea, software concept, website, or digital product.

---

## Table of Contents

1. [Design Philosophy & Anti-Slop Manifesto](#1-design-philosophy--anti-slop-manifesto)
2. [Context Gathering Protocol](#2-context-gathering-protocol)
3. [Design Direction Framework](#3-design-direction-framework)
4. [Typography System](#4-typography-system)
5. [Color & Contrast System](#5-color--contrast-system)
6. [Spatial Design & Layout](#6-spatial-design--layout)
7. [Motion & Animation](#7-motion--animation)
8. [Interaction Design](#8-interaction-design)
9. [Responsive & Adaptive Design](#9-responsive--adaptive-design)
10. [UX Writing & Microcopy](#10-ux-writing--microcopy)
11. [Component Architecture & Design Tokens](#11-component-architecture--design-tokens)
12. [DESIGN.md Integration (Google Stitch Format)](#12-designmd-integration-google-stitch-format)
13. [Agent Commands & Workflows](#13-agent-commands--workflows)
14. [Audit & Critique Frameworks](#14-audit--critique-frameworks)
15. [Hardening & Production Readiness](#15-hardening--production-readiness)
16. [Performance Optimization](#16-performance-optimization)
17. [Onboarding & Empty States](#17-onboarding--empty-states)
18. [Overdrive: Advanced Browser Techniques](#18-overdrive-advanced-browser-techniques)
19. [External Tool Integration (AIDesigner MCP)](#19-external-tool-integration-aidesigner-mcp)
20. [Implementation Checklist](#20-implementation-checklist)

---

## 1. Design Philosophy & Anti-Slop Manifesto

### Core Principle

Every interface this agent produces must pass **The AI Slop Test**: If you showed it to someone and said "AI made this," would they believe you immediately? If yes, that's the problem. A distinctive interface should make someone ask "how was this made?" â not "which AI made this?"

### The Anti-Pattern Registry (NEVER DO THESE)

**Typography Anti-Patterns:**
- NEVER use overused fonts: Inter, Roboto, Arial, Open Sans, Lato, Montserrat, system defaults
- NEVER use monospace typography as lazy shorthand for "technical/developer" vibes
- NEVER put large icons with rounded corners above every heading â they rarely add value and make sites look templated
- NEVER converge on the same font across generations (e.g., Space Grotesk everywhere)

**Color Anti-Patterns:**
- NEVER use the AI color palette: cyan-on-dark, purple-to-blue gradients, neon accents on dark backgrounds
- NEVER use gradient text for "impact" â especially on metrics or headings
- NEVER default to dark mode with glowing accents â it looks "cool" without requiring actual design decisions
- NEVER use gray text on colored backgrounds â it looks washed out; use a shade of the background color instead
- NEVER use pure black (#000) or pure white (#fff) â always tint; pure black/white never appears in nature

**Layout Anti-Patterns:**
- NEVER wrap everything in cards â not everything needs a container
- NEVER nest cards inside cards â visual noise; flatten the hierarchy
- NEVER use identical card grids: same-sized cards with icon + heading + text, repeated endlessly
- NEVER use the hero metric layout template: big number, small label, supporting stats, gradient accent
- NEVER center everything â left-aligned text with asymmetric layouts feels more designed

**Visual Effects Anti-Patterns:**
- NEVER use glassmorphism everywhere â blur effects, glass cards, glow borders used decoratively rather than purposefully
- NEVER use rounded elements with thick colored border on one side
- NEVER use sparklines as decoration â tiny charts that convey nothing meaningful
- NEVER use rounded rectangles with generic drop shadows
- NEVER use modals unless there's truly no better alternative

**Motion Anti-Patterns:**
- NEVER use bounce or elastic easing â they feel dated and tacky; real objects decelerate smoothly
- NEVER animate layout properties (width, height, padding, margin) â use transform and opacity only

### The Intentionality Principle

Bold maximalism and refined minimalism both work â the key is **intentionality, not intensity**. Choose a clear conceptual direction and execute it with precision. Every element must justify its existence. Every design decision must be a conscious choice, not a default.

---

## 2. Context Gathering Protocol

Design skills produce generic output without project context. You MUST have confirmed design context before doing any design work.

### Required Context (Minimum)

1. **Target audience**: Who uses this product and in what context?
2. **Use cases**: What jobs are they trying to get done?
3. **Brand personality/tone**: How should the interface feel?

### Gathering Order

1. **Check loaded instructions**: If instructions already contain a Design Context section, proceed immediately.
2. **Check `.impeccable.md` or `DESIGN.md`**: Read from project root. If it exists and contains required context, proceed.
3. **Ask the user**: If neither source has context, you MUST ask before doing design work. Do NOT skip this. Do NOT attempt to infer context from the codebase alone â code tells you what was built, not who it's for or what it should feel like.

### Extended Context Questions (Ask If Unclear)

**Users & Purpose:**
- Who uses this? What's their context when using it?
- What job are they trying to get done?
- What emotions should the interface evoke? (confidence, delight, calm, urgency)

**Brand & Personality:**
- How would you describe the brand personality in 3 words?
- Any reference sites that capture the right feel? What specifically about them?
- What should this explicitly NOT look like?

**Aesthetic Preferences:**
- Visual direction preference? (minimal, bold, elegant, playful, technical, organic)
- Light mode, dark mode, or both?
- Any colors that must be used or avoided?

**Accessibility & Inclusion:**
- Specific accessibility requirements? (WCAG level, known user needs)
- Considerations for reduced motion, color blindness?

### Persisting Context

Synthesize findings into a `## Design Context` section and write to `.impeccable.md` or `DESIGN.md` in the project root:

```markdown
## Design Context

### Users
[Who they are, their context, the job to be done]

### Brand Personality
[Voice, tone, 3-word personality, emotional goals]

### Aesthetic Direction
[Visual tone, references, anti-references, theme]

### Design Principles
[3-5 principles derived from the conversation]
```

---

## 3. Design Direction Framework

Before writing any code, commit to a BOLD aesthetic direction.

### The Direction Formula

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme â brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. There are countless flavors. Use these for inspiration but design one true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

### Implementation Complexity Matching

Match implementation complexity to the aesthetic vision:
- **Maximalist designs** need elaborate code with extensive animations, effects, layered textures, custom elements
- **Minimalist/refined designs** need restraint, precision, and careful attention to spacing, typography, and subtle details
- Elegance comes from executing the vision well, not from the volume of effects

### Variation Mandate

No design should be the same. Vary between light and dark themes, different fonts, different aesthetics across generations. Interpret creatively and make unexpected choices that feel genuinely designed for the context.

---

## 4. Typography System

### Classic Principles

**Vertical Rhythm:** Line-height should be the base unit for ALL vertical spacing. If body text has `line-height: 1.5` on `16px` type (= 24px), spacing values should be multiples of 24px.

**Modular Scale:** Use fewer sizes with more contrast. A 5-size system covers most needs:

| Role | Typical Ratio | Use Case |
|------|---------------|----------|
| xs | 0.75rem | Captions, legal |
| sm | 0.875rem | Secondary UI, metadata |
| base | 1rem | Body text |
| lg | 1.25-1.5rem | Subheadings, lead text |
| xl+ | 2-4rem | Headlines, hero text |

Popular ratios: 1.25 (major third), 1.333 (perfect fourth), 1.5 (perfect fifth). Pick one and commit.

**Readability:** Use `ch` units for measure (`max-width: 65ch`). Line-height scales inversely with line length. Increase line-height by 0.05-0.1 for light text on dark backgrounds.

### Font Selection

**Avoid invisible defaults:** Inter, Roboto, Open Sans, Lato, Montserrat.

**Better Google Fonts alternatives:**
- Instead of Inter â **Instrument Sans**, **Plus Jakarta Sans**, **Outfit**
- Instead of Roboto â **Onest**, **Figtree**, **Urbanist**
- Instead of Open Sans â **Source Sans 3**, **Nunito Sans**, **DM Sans**
- For editorial/premium â **Fraunces**, **Newsreader**, **Lora**

**System fonts are underrated:** `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui` â native, instant, highly readable. Good for apps where performance > personality.

### Pairing Principles

You often don't need a second font. One well-chosen family in multiple weights creates cleaner hierarchy. When pairing, contrast on multiple axes: Serif + Sans, Geometric + Humanist, Condensed + Wide. NEVER pair fonts that are similar but not identical.

### Fluid vs Fixed Typography

- **App UIs, dashboards, data-dense interfaces:** Use fixed `rem` scales with optional breakpoint adjustments. No major design system uses fluid type in product UI.
- **Marketing/content page headings:** Use fluid sizing via `clamp(min, preferred, max)`. Keep body text fixed.

### Web Font Loading (Prevent Layout Shift)

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;
}

/* Match fallback metrics to minimize shift */
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 90%;
  descent-override: 20%;
  line-gap-override: 10%;
}

body {
  font-family: 'CustomFont', 'CustomFont-Fallback', sans-serif;
}
```

### OpenType Features for Polish

```css
.data-table { font-variant-numeric: tabular-nums; }    /* Aligned numbers */
.recipe-amount { font-variant-numeric: diagonal-fractions; }
abbr { font-variant-caps: all-small-caps; }
code { font-variant-ligatures: none; }
body { font-kerning: normal; }
```

### Accessibility

- Never disable zoom: `user-scalable=no` breaks accessibility
- Use rem/em for font sizes â never px for body text
- Minimum 16px body text
- Touch targets need 44px+ tap areas via padding or pseudo-elements

---

## 5. Color & Contrast System

### Use OKLCH (Not HSL)

OKLCH is perceptually uniform â equal steps in lightness *look* equal. HSL's 50% lightness in yellow looks bright while 50% in blue looks dark.

```css
/* OKLCH: lightness (0-100%), chroma (0-0.4+), hue (0-360) */
--color-primary: oklch(60% 0.15 250);
--color-primary-light: oklch(85% 0.08 250);  /* Reduce chroma at extremes */
--color-primary-dark: oklch(35% 0.12 250);
```

**Key insight:** As you move toward white or black, reduce chroma. High chroma at extreme lightness looks garish.

### Tinted Neutrals (Kill Pure Gray)

```css
/* Dead grays â tinted grays */
--gray-100: oklch(95% 0.01 60);   /* Warm hint */
--gray-900: oklch(15% 0.01 60);

/* Cool-tinted for tech/professional */
--gray-100: oklch(95% 0.01 250);
--gray-900: oklch(15% 0.01 250);
```

The chroma is tiny (0.01) but perceptible. It creates subconscious cohesion.

### Palette Structure

| Role | Purpose | Scale |
|------|---------|-------|
| **Primary** | Brand, CTAs, key actions | 1 color, 3-5 shades |
| **Neutral** | Text, backgrounds, borders | 9-11 shade scale |
| **Semantic** | Success, error, warning, info | 4 colors, 2-3 shades each |
| **Surface** | Cards, modals, overlays | 2-3 elevation levels |

Skip secondary/tertiary unless needed. Most apps work with one accent color.

### The 60-30-10 Rule (Visual Weight)

- **60%**: Neutral backgrounds, white space, base surfaces
- **30%**: Secondary colors â text, borders, inactive states
- **10%**: Accent â CTAs, highlights, focus states

The common mistake: using accent color everywhere. Accent colors work *because* they're rare.

### Dark Mode Is Not Inverted Light Mode

| Light Mode | Dark Mode |
|------------|-----------|
| Shadows for depth | Lighter surfaces for depth (no shadows) |
| Dark text on light | Light text on dark (reduce font weight) |
| Vibrant accents | Desaturate accents slightly |
| White backgrounds | Never pure black â use dark gray (oklch 12-18%) |

```css
:root[data-theme="dark"] {
  --surface-1: oklch(15% 0.01 250);
  --surface-2: oklch(20% 0.01 250);  /* "Higher" = lighter */
  --surface-3: oklch(25% 0.01 250);
  --body-weight: 350;  /* Lighter weight than 400 */
}
```

Use two token layers: primitive (`--blue-500`) and semantic (`--color-primary: var(--blue-500)`). For dark mode, only redefine the semantic layer.

### WCAG Contrast Requirements

| Content Type | AA Minimum | AAA Target |
|--------------|------------|------------|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+ or 14px bold) | 3:1 | 4.5:1 |
| UI components, icons | 3:1 | 4.5:1 |

**Dangerous combinations:** Light gray on white (#1 fail), gray on any colored background, red on green, blue on red, yellow on white, thin light text on images.

### Alpha Is A Design Smell

Heavy use of transparency usually means an incomplete palette. Define explicit overlay colors instead. Exception: focus rings and interactive states.

---

## 6. Spatial Design & Layout

### Spacing System (4pt Base)

8pt systems are too coarse. Use 4pt for granularity: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

Name tokens semantically (`--space-sm`, `--space-lg`), not by value (`--spacing-8`). Use `gap` instead of margins for sibling spacing.

### Grid Systems

**Self-adjusting grid:** `repeat(auto-fit, minmax(280px, 1fr))` â responsive without breakpoints.

**Choose the right tool:**
- **Flexbox** for 1D layouts: rows, nav bars, button groups, component internals
- **CSS Grid** for 2D layouts: page structure, dashboards, coordinated rows AND columns
- Don't default to Grid when Flexbox with `flex-wrap` would be simpler

### Visual Hierarchy (The Squint Test)

Blur your eyes. Can you still identify the most important element? The second? Clear groupings? If everything looks the same weight, you have a hierarchy problem.

Combine multiple dimensions for strong hierarchy:

| Tool | Strong | Weak |
|------|--------|------|
| Size | 3:1 ratio or more | <2:1 ratio |
| Weight | Bold vs Regular | Medium vs Regular |
| Color | High contrast | Similar tones |
| Position | Top/left (primary) | Bottom/right |
| Space | Surrounded by whitespace | Crowded |

The best hierarchy uses 2-3 dimensions at once.

### Cards Are Not Required

Cards are overused. Spacing and alignment create visual grouping naturally. Use cards only when content is truly distinct and actionable, or needs clear interaction boundaries. NEVER nest cards inside cards.

### Container Queries

```css
.card-container { container-type: inline-size; }

@container (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

A card in a narrow sidebar stays compact; the same card in main content expands â automatically.

### Optical Adjustments

- Text at `margin-left: 0` looks indented â use negative margin (`-0.05em`) to optically align
- Geometrically centered icons often look off-center; play icons shift right, arrows shift toward direction
- Touch targets: buttons can look small but need 44px minimum hit areas via padding or `::before` pseudo-elements

### Depth & Elevation

Create semantic z-index scales: `dropdown (100) â sticky (200) â modal-backdrop (300) â modal (400) â toast (500) â tooltip (600)`. Shadows should be subtle â if you can clearly see it, it's probably too strong.

---

## 7. Motion & Animation

### Duration: The 100/300/500 Rule

| Duration | Use Case |
|----------|----------|
| 100-150ms | Instant feedback: button press, toggle, color change |
| 200-300ms | State changes: menu open, tooltip, hover states |
| 300-500ms | Layout changes: accordion, modal, drawer |
| 500-800ms | Entrance animations: page load, hero reveals |

Exit animations are faster than entrances â use ~75% of enter duration.

### Easing: Use Exponential Curves

```css
/* Recommended â natural deceleration */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* Smooth, refined */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* Slightly snappier */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);     /* Confident, decisive */

/* NEVER use these â dated and tacky */
/* bounce: cubic-bezier(0.34, 1.56, 0.64, 1); */
/* elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6); */
```

Don't use `ease` â it's a compromise rarely optimal. Use `ease-out` for entering, `ease-in` for leaving, `ease-in-out` for state toggles.

### The Only Two Animatable Properties

**transform** and **opacity** only. Everything else causes layout recalculation. For height animations, use `grid-template-rows: 0fr â 1fr` instead of animating height.

### Staggered Animations

```css
animation-delay: calc(var(--i, 0) * 50ms);
/* Set style="--i: 0" on each item */
```

Cap total stagger time â 10 items at 50ms = 500ms total. For many items, reduce per-item delay.

### Reduced Motion (Non-Negotiable)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Preserve functional animations (progress bars, spinners) â just remove spatial movement.

### Perceived Performance

- **80ms threshold**: Anything under 80ms feels instant. Target for micro-interactions.
- **Optimistic UI**: Update immediately, handle failures gracefully. Use for low-stakes actions; avoid for payments.
- **Preemptive start**: Begin transitions immediately while loading (skeleton UI).
- **Ease-in toward completion** compresses perceived time via peak-end effect.

---

## 8. Interaction Design

### The Eight Interactive States

Every interactive element needs ALL states designed:

| State | Visual Treatment |
|-------|-----------------|
| Default | Base styling |
| Hover | Subtle lift, color shift (pointer only) |
| Focus | Visible ring (`:focus-visible`, 2-3px, offset) |
| Active | Pressed in, darker |
| Disabled | Reduced opacity, no pointer |
| Loading | Spinner, skeleton |
| Error | Red border, icon, message |
| Success | Green check, confirmation |

### Focus Rings

```css
button:focus { outline: none; }
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

NEVER `outline: none` without `:focus-visible` replacement.

### Forms

- Placeholders aren't labels â always use visible `<label>` elements
- Validate on blur, not every keystroke (exception: password strength)
- Place errors below fields with `aria-describedby`
- Use `<dialog>` element for modals with native focus trap and Esc dismiss

### Dropdown Positioning (The #1 Bug)

Dropdowns inside `overflow: hidden` containers get clipped. Solutions:

1. **CSS Anchor Positioning** (Chrome 125+): `position: fixed` + `position-anchor`
2. **Popover API**: `popover` attribute places in top layer above all z-index
3. **Portal pattern**: React `createPortal(dropdown, document.body)`, Vue `<Teleport to="body">`
4. **Fallback**: `position: fixed` with JS coordinates from `getBoundingClientRect()`

### Destructive Actions: Undo > Confirm

Undo is better than confirmation dialogs â users click through confirmations mindlessly. Remove from UI immediately, show undo toast, actually delete after expiry. Use confirmation only for truly irreversible or high-cost actions.

### Keyboard Navigation

Use roving tabindex for component groups (tabs, menus): one item tabbable, arrow keys move within. Tab moves to next component entirely. Provide skip links for keyboard users.

---

## 9. Responsive & Adaptive Design

### Mobile-First

Start with base styles for mobile, use `min-width` queries to layer complexity. Desktop-first means mobile loads unnecessary styles.

### Content-Driven Breakpoints

Don't chase device sizes. Start narrow, stretch until design breaks, add breakpoint there. Three breakpoints usually suffice (640, 768, 1024px). Use `clamp()` for fluid values.

### Detect Input Method

```css
@media (pointer: fine) { .button { padding: 8px 16px; } }
@media (pointer: coarse) { .button { padding: 12px 20px; } }
@media (hover: hover) { .card:hover { transform: translateY(-2px); } }
@media (hover: none) { /* No hover state â use active */ }
```

### Safe Areas

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Enable with: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`

### Responsive Images

```html
<img src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy" alt="Hero image" />
```

Use `<picture>` element for art direction (different crops at different sizes).

### Adaptation Strategies

- **Navigation**: Hamburger + drawer on mobile â horizontal compact on tablet â full with labels on desktop
- **Tables**: Transform to cards on mobile using `display: block` and `data-label` attributes
- **Progressive disclosure**: `<details>/<summary>` for collapsible content

---

## 10. UX Writing & Microcopy

### Button Labels

NEVER use "OK", "Submit", or "Yes/No". Use specific verb + object patterns:

| Bad | Good |
|-----|------|
| OK | Save changes |
| Submit | Create account |
| Yes | Delete message |
| Cancel | Keep editing |
| Click here | Download PDF |

For destructive actions: "Delete 5 items" not "Delete selected" â name the destruction and show the count.

### Error Messages: The Formula

Every error answers: (1) What happened? (2) Why? (3) How to fix it?

| Situation | Template |
|-----------|----------|
| Format error | "[Field] needs to be [format]. Example: [example]" |
| Missing required | "Please enter [what's missing]" |
| Permission denied | "You don't have access to [thing]. [What to do instead]" |
| Network error | "We couldn't reach [thing]. Check your connection and [action]." |
| Server error | "Something went wrong on our end. We're looking into it. [Alternative action]" |

NEVER blame the user. Reframe: "Please enter a date in MM/DD/YYYY format" not "You entered an invalid date."

### Empty States Are Opportunities

(1) Acknowledge briefly, (2) Explain the value, (3) Provide a clear action.
"No projects yet. Create your first one to get started." â NOT just "No items."

### Consistency Glossary

Pick one term and stick with it:

| Inconsistent | Consistent |
|--------------|------------|
| Delete / Remove / Trash | Delete |
| Settings / Preferences / Options | Settings |
| Sign in / Log in / Enter | Sign in |
| Create / Add / New | Create |

### Voice vs Tone

**Voice** is brand personality â consistent everywhere. **Tone** adapts to moment:
- Success: Celebratory, brief
- Error: Empathetic, helpful (NEVER humor)
- Loading: Reassuring
- Destructive confirm: Serious, clear

### Translation Planning

German text is ~30% longer than English. Use flex/grid that adapts to content. Keep numbers separate. Use full sentences as single strings. Avoid abbreviations.

---

## 11. Component Architecture & Design Tokens

### Token Hierarchy

Use two layers:
1. **Primitive tokens**: `--blue-500`, `--space-4` â raw values
2. **Semantic tokens**: `--color-primary: var(--blue-500)` â contextual meaning

For theming, only redefine the semantic layer. Primitives stay the same.

### When to Extract Components

Extract when:
- Used 3+ times, or likely to be reused
- Systematizing improves consistency
- It's a general pattern (not context-specific)

Create components with:
- Clear props API with sensible defaults
- Proper variants for different use cases
- Accessibility built in (ARIA, keyboard, focus management)
- TypeScript types and documentation

### Design System Token Structure

```css
:root {
  /* Primitives */
  --blue-50: oklch(97% 0.02 250);
  --blue-500: oklch(55% 0.2 250);
  --blue-900: oklch(20% 0.1 250);

  /* Semantics */
  --color-primary: var(--blue-500);
  --color-bg: oklch(98% 0.005 250);
  --color-text: oklch(15% 0.01 250);
  --color-text-secondary: oklch(45% 0.02 250);
  --color-border: oklch(88% 0.01 250);
  --color-surface: oklch(100% 0 0);

  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 2rem;
  --text-display: clamp(2.5rem, 5vw + 1rem, 4rem);

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Motion */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* Elevation */
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 12px oklch(0% 0 0 / 0.08);
  --shadow-lg: 0 12px 32px oklch(0% 0 0 / 0.12);

  /* Z-index */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

---

## 12. DESIGN.md Integration (Google Stitch Format)

### What is DESIGN.md?

A plain-text design system document that AI agents read to generate consistent UI. Introduced by Google Stitch. Drop it into your project root and any AI coding agent instantly understands how your UI should look.

| File | Who reads it | What it defines |
|------|-------------|-----------------|
| `AGENTS.md` | Coding agents | How to build the project |
| `DESIGN.md` | Design agents | How the project should look and feel |

### DESIGN.md Sections (Standard Format)

| # | Section | What it captures |
|---|---------|-----------------|
| 1 | Visual Theme & Atmosphere | Mood, density, design philosophy |
| 2 | Color Palette & Roles | Semantic name + hex + functional role |
| 3 | Typography Rules | Font families, full hierarchy table |
| 4 | Component Stylings | Buttons, cards, inputs, navigation with states |
| 5 | Layout Principles | Spacing scale, grid, whitespace philosophy |
| 6 | Depth & Elevation | Shadow system, surface hierarchy |
| 7 | Do's and Don'ts | Design guardrails and anti-patterns |
| 8 | Responsive Behavior | Breakpoints, touch targets, collapsing strategy |
| 9 | Agent Prompt Guide | Quick color reference, ready-to-use prompts |

### Using DESIGN.md Files as Inspiration

The [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) repository provides 58+ ready-to-use DESIGN.md files extracted from real websites across categories:

**AI/ML:** Claude, Cohere, ElevenLabs, Mistral, Ollama, Replicate, RunwayML, xAI
**Dev Tools:** Cursor, Linear, Vercel, Supabase, Raycast, Resend, Sentry, Warp
**Design/Productivity:** Figma, Framer, Notion, Miro, Cal.com, Webflow
**Fintech:** Stripe, Coinbase, Revolut, Wise, Kraken
**Enterprise:** Apple, Uber, Airbnb, Spotify, Tesla, SpaceX, NVIDIA
**Automotive:** BMW, Ferrari, Lamborghini, Tesla, Renault

**Usage:** Copy a DESIGN.md into your project root â tell your agent "build me a page that looks like this" â get pixel-perfect UI that matches.

### Creating a Custom DESIGN.md

When building a new product, create a DESIGN.md following the standard format. Start with Section 1 (Visual Theme) and let it cascade into concrete tokens. Reference real-world sites as inspiration â the awesome-design-md collection provides excellent templates.

---

## 13. Agent Commands & Workflows

These commands form a complete design workflow. Each can be invoked individually or chained.

### Discovery & Setup

| Command | Purpose |
|---------|---------|
| `/teach-impeccable` | One-time: gather design context, persist to config |

### Analysis & Review

| Command | Purpose |
|---------|---------|
| `/audit [area]` | Technical quality checks: a11y, performance, responsive, anti-patterns. Scored report with P0-P3 severity. |
| `/critique [area]` | UX design review: hierarchy, cognitive load, emotional resonance, persona testing. Nielsen heuristics scored 0-4 per dimension (40pt scale). |

### Refinement

| Command | Purpose |
|---------|---------|
| `/normalize [feature]` | Align with design system standards, spacing, tokens, patterns |
| `/polish [target]` | Final pass: alignment, spacing, consistency, micro-details |
| `/distill [target]` | Strip to essence â remove unnecessary complexity |
| `/clarify [target]` | Improve unclear UX copy, error messages, labels |

### Enhancement

| Command | Purpose |
|---------|---------|
| `/animate [target]` | Add purposeful motion: entrances, micro-interactions, transitions |
| `/colorize [target]` | Introduce strategic color to monochromatic designs |
| `/bolder [target]` | Amplify boring designs â more visual impact and personality |
| `/quieter [target]` | Tone down overstimulating designs â refined, sophisticated |
| `/delight [target]` | Add moments of joy, personality, easter eggs |

### Structural

| Command | Purpose |
|---------|---------|
| `/arrange [target]` | Fix layout, spacing, visual rhythm, hierarchy |
| `/typeset [target]` | Fix font choices, hierarchy, sizing, weight, readability |
| `/extract [target]` | Pull reusable components and tokens into design system |
| `/adapt [target] [context]` | Adapt for different devices, platforms, contexts |
| `/onboard [target]` | Design onboarding flows, empty states, first-run experiences |
| `/harden [target]` | Error handling, i18n, text overflow, edge cases |
| `/optimize [target]` | Performance: loading, rendering, bundle size |
| `/overdrive [target]` | Push past conventional limits â shaders, spring physics, View Transitions |

### Recommended Workflow

1. `/teach-impeccable` â establish context
2. `/critique` â understand current state
3. `/normalize` â align with system standards
4. Address specific issues: `/arrange`, `/typeset`, `/colorize`, `/animate`, `/clarify`
5. `/harden` â production-readiness
6. `/optimize` â performance
7. `/polish` â final pass (always last)
8. `/audit` â verify improvements

---

## 14. Audit & Critique Frameworks

### Technical Audit (5 Dimensions, 0-4 Each, 20pt Max)

| Dimension | What to Check |
|-----------|---------------|
| **Accessibility** | Contrast ratios, ARIA labels, keyboard navigation, semantic HTML, alt text, form labels |
| **Performance** | Layout thrashing, expensive animations, lazy loading, bundle size, re-renders |
| **Theming** | Hard-coded colors, dark mode support, token consistency, theme switching |
| **Responsive** | Fixed widths, touch targets, horizontal scroll, text scaling, breakpoints |
| **Anti-Patterns** | AI slop tells, gray on color, nested cards, bounce easing, redundant copy |

**Rating:** 18-20 Excellent, 14-17 Good, 10-13 Acceptable, 6-9 Poor, 0-5 Critical

### UX Critique (Nielsen's 10 Heuristics, 0-4 Each, 40pt Max)

1. Visibility of System Status
2. Match System / Real World
3. User Control and Freedom
4. Consistency and Standards
5. Error Prevention
6. Recognition Rather Than Recall
7. Flexibility and Efficiency
8. Aesthetic and Minimalist Design
9. Error Recovery
10. Help and Documentation

**Rating:** 36-40 Excellent, 28-35 Good, 20-27 Acceptable, 12-19 Poor, 0-11 Critical

### Issue Severity

| Priority | Name | Description |
|----------|------|-------------|
| **P0** | Blocking | Prevents task completion â fix immediately |
| **P1** | Major | Significant difficulty or WCAG violation â fix before release |
| **P2** | Minor | Annoyance, workaround exists â fix in next pass |
| **P3** | Polish | Nice-to-fix, no real user impact â fix if time permits |

### Cognitive Load Checklist (8 Items)

- [ ] Single focus: primary task without distraction?
- [ ] Chunking: info in digestible groups (â¤4 per group)?
- [ ] Grouping: related items visually grouped?
- [ ] Visual hierarchy: immediately clear what's most important?
- [ ] One thing at a time: single decision before next?
- [ ] Minimal choices: â¤4 visible options at decision points?
- [ ] Working memory: no info from previous screen needed?
- [ ] Progressive disclosure: complexity revealed only when needed?

**Scoring:** 0-1 failures = low (good), 2-3 = moderate, 4+ = critical

### Persona-Based Testing

Select 2-3 personas per interface:

| Persona | Profile | Key Test |
|---------|---------|----------|
| **Alex** (Power User) | Expert, expects efficiency, hates hand-holding | Core task < 60 seconds? Keyboard shortcuts? |
| **Jordan** (First-Timer) | Never used similar product, needs guidance | First action clear in 5 seconds? Icons labeled? |
| **Sam** (Accessibility) | Screen reader, keyboard-only, may have low vision | Full flow keyboard-only? Focus visible? 4.5:1 contrast? |
| **Riley** (Stress Tester) | Tests edge cases, extreme inputs, breaks workflows | Long text? Empty states? Refresh mid-flow? |
| **Casey** (Mobile) | Phone one-handed, frequently interrupted, slow connection | Primary actions in thumb zone? State preserved? |

**Selection guide:**
- Landing page â Jordan, Riley, Casey
- Dashboard â Alex, Sam
- E-commerce â Casey, Riley, Jordan
- Forms/wizards â Jordan, Sam, Casey
- Data/analytics â Alex, Sam

---

## 15. Hardening & Production Readiness

### Text Overflow

```css
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.flex-item { min-width: 0; overflow: hidden; }  /* Prevent flex overflow */
.grid-item { min-width: 0; min-height: 0; }     /* Prevent grid overflow */
```

### Internationalization

- Add 30-40% space budget for translations (German, Finnish longest)
- Use CSS logical properties: `margin-inline-start` not `margin-left`
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for locale-aware formatting
- Test with CJK characters, emoji, RTL text

### Error Handling Checklist

- Network: clear message + retry button + offline mode
- Forms: inline errors near fields, preserve input on error
- API: handle 400/401/403/404/429/500 each appropriately
- Concurrent: prevent double-submission, handle race conditions
- Permission: read-only mode with clear explanation

### Edge Case Testing Matrix

| Category | Test With |
|----------|-----------|
| Long text | 100+ character names, descriptions |
| Short text | Empty, single character |
| Special chars | Emoji, RTL text, accents |
| Large numbers | Millions, billions |
| Many items | 1000+ list items |
| No data | Empty states for every view |
| Concurrent | Click submit 10 times rapidly |
| Network | Disable internet, throttle to 3G |

---

## 16. Performance Optimization

### Core Web Vitals Targets

- **LCP** (Largest Contentful Paint): < 2.5s
- **INP** (Interaction to Next Paint): < 200ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Image Optimization

- Use WebP/AVIF, proper sizing, lazy loading for below-fold
- Responsive images with `srcset` and `sizes`
- `aspect-ratio` CSS to prevent layout shift

### JavaScript Bundle

- Route-based code splitting, tree shaking
- Dynamic imports for heavy components: `const Chart = lazy(() => import('./Chart'))`
- Remove unused dependencies

### CSS Optimization

- Remove unused CSS, inline critical CSS
- Use `content-visibility: auto` for long lists
- CSS containment for independent regions

### Font Optimization

- `font-display: swap` or `optional`
- Subset fonts (only needed characters)
- Preload critical fonts, limit weights loaded

### Rendering

- Only animate `transform` and `opacity`
- Use `will-change` sparingly (only when imminent)
- Batch DOM reads then writes (avoid layout thrashing)
- Virtual scrolling for 1000+ items

### React-Specific

- `memo()` for expensive components
- `useMemo()` / `useCallback()` for expensive computations
- Virtualize long lists, code-split routes
- Use React DevTools Profiler

---

## 17. Onboarding & Empty States

### Onboarding Principles

1. **Show, Don't Tell**: Demonstrate with working examples, not descriptions
2. **Make It Optional**: Let experienced users skip
3. **Time to Value**: Get to "aha moment" ASAP â teach 20% that delivers 80%
4. **Context Over Ceremony**: Teach features when needed, not upfront
5. **Respect Intelligence**: Don't patronize or over-explain

### Empty State Design (Every Empty State Needs)

1. **What will be here**: "Your recent projects will appear here"
2. **Why it matters**: "Projects help you organize work and collaborate"
3. **How to get started**: `[Create project]` or `[Import from template]`
4. **Visual interest**: Illustration or icon (not just text)
5. **Contextual help**: "Need help? [Watch 2-min tutorial]"

**Types:** First use â emphasize value; User cleared â light touch; No results â suggest different query; No permissions â explain why; Error â explain + retry.

### Patterns

- Contextual tooltips at point of first use (dismissable, "don't show again")
- Progressive onboarding: reveal features as users encounter them
- Track completion in localStorage: never show same onboarding twice
- Guided tours: 3-7 steps max, allow skip, make replayable

---

## 18. Overdrive: Advanced Browser Techniques

For when "good" isn't enough â push interfaces past conventional limits.

### Cinematic Transitions

- **View Transitions API**: Shared element morphing between states. List item â detail page. Button â dialog.
- **`@starting-style`**: Animate elements from `display: none` to visible with CSS only.
- **Spring physics**: Natural motion with mass, tension, damping. Libraries: motion (Framer Motion), GSAP.

### Scroll-Driven Animations

```css
@supports (animation-timeline: scroll()) {
  .hero { animation-timeline: scroll(); }
}
```

CSS-only parallax, progress bars, reveal sequences. Chrome/Edge/Safari; provide static fallback.

### Beyond CSS Rendering

- **WebGL**: Shader effects, particles, post-processing. Three.js, OGL, regl.
- **Canvas 2D / OffscreenCanvas**: Custom rendering, pixel manipulation, off-main-thread via Web Workers.
- **SVG filter chains**: Displacement maps, turbulence, morphology for organic distortion.

### Complex Property Animation

- **`@property`**: Register custom CSS properties with types â animate gradients, colors, complex values CSS can't normally interpolate.
- **Web Animations API**: JavaScript-driven with CSS performance. Composable, cancellable, reversible.

### Performance Boundaries

- **Web Workers**: Heavy computation off main thread.
- **OffscreenCanvas**: Render in Worker while main thread stays free.
- **WASM**: Near-native performance for computation-heavy features.

### Rules

1. Progressive enhancement is non-negotiable â every technique degrades gracefully
2. Target 60fps, simplify if below 50
3. Always respect `prefers-reduced-motion`
4. Lazy-initialize heavy resources only when near viewport
5. Test on real mid-range devices, not just your dev machine

---

## 19. External Tool Integration (AIDesigner MCP)

### What is AIDesigner MCP?

An MCP server that generates production-ready HTML/CSS designs from natural language prompts. Connect it to Claude Code, Codex, Cursor, or VS Code.

### Setup

```bash
npx -y @aidesigner/agent-skills init          # Claude Code (default)
npx -y @aidesigner/agent-skills init cursor   # Cursor
npx -y @aidesigner/agent-skills init codex    # Codex
```

### MCP Configuration

```json
{
  "mcpServers": {
    "aidesigner": {
      "type": "http",
      "url": "https://api.aidesigner.ai/api/v1/mcp"
    }
  }
}
```

### Available Tools

| Tool | Purpose |
|------|---------|
| `generate_design` | Create new HTML/CSS from text prompt (returns complete HTML with Tailwind) |
| `refine_design` | Iterate on previous design with feedback (pass run_id or raw HTML) |
| `get_credit_status` | Check credit balance and subscription |
| `whoami` | Connected account identity |

### Design Modes (Coming Soon)

- **Inspire**: URL as visual inspiration for new design
- **Clone**: Replicate visual style and layout of URL
- **Enhance**: Improve design at given URL
- **None** (Default): Pure prompt-driven generation

### Repo Context

The CLI auto-analyzes your project (framework, tokens, routes, component libraries) and passes context to the server so generated designs fit your stack.

### Adoption Workflow

```bash
npx @aidesigner/agent-skills adopt --id <run-id>
```

Generates a structured porting guide: target framework, route placement, CSS token mapping, component reuse recommendations.

---

## 20. Implementation Checklist

### Pre-Build

- [ ] Design context gathered (audience, brand, aesthetic direction)
- [ ] DESIGN.md or `.impeccable.md` exists with project context
- [ ] Bold aesthetic direction chosen with clear differentiation
- [ ] Technical constraints identified (framework, performance, a11y)

### Typography

- [ ] Distinctive font(s) chosen (NOT Inter/Roboto/Arial)
- [ ] Modular type scale with clear hierarchy (5 sizes max)
- [ ] Fluid sizing for marketing headings, fixed for app UI
- [ ] Web font loading optimized (swap, fallback metrics)
- [ ] Body text â¥ 16px, line length â¤ 65ch

### Color

- [ ] OKLCH-based palette with tinted neutrals
- [ ] No pure gray, no pure black (#000), no pure white (#fff)
- [ ] 60-30-10 color distribution
- [ ] WCAG AA contrast met (4.5:1 text, 3:1 UI)
- [ ] Dark mode uses lighter surfaces (not inverted + shadows)

### Layout

- [ ] 4pt spacing system, semantic token names
- [ ] Visual hierarchy passes squint test
- [ ] No unnecessary cards, no nested cards
- [ ] Container queries for component-level responsiveness
- [ ] Optical adjustments applied

### Motion

- [ ] Exponential easing (quart/quint/expo), no bounce/elastic
- [ ] Only transform + opacity animated
- [ ] `prefers-reduced-motion` respected
- [ ] Stagger animations capped at 500ms total

### Interaction

- [ ] All 8 states designed for every interactive element
- [ ] `:focus-visible` rings on all focusable elements
- [ ] Keyboard navigation works throughout
- [ ] Dropdowns escape overflow containers

### Responsive

- [ ] Mobile-first CSS, content-driven breakpoints
- [ ] Touch targets â¥ 44px
- [ ] Safe areas handled (notch, home indicator)
- [ ] Responsive images with srcset/sizes

### UX Writing

- [ ] Specific button labels (no "OK", "Submit", "Yes")
- [ ] Error messages: what happened + why + how to fix
- [ ] Empty states guide users toward action
- [ ] Consistent terminology throughout

### Hardening

- [ ] Text overflow handled (truncation, wrapping)
- [ ] i18n-ready (logical properties, 30% expansion budget)
- [ ] All error states designed with recovery paths
- [ ] Edge cases tested (long text, empty, many items)

### Performance

- [ ] Images: WebP/AVIF, lazy loading, srcset
- [ ] JS: code-split, tree-shaken, unused deps removed
- [ ] CSS: unused removed, critical inlined
- [ ] CLS < 0.1 (aspect-ratio on images, no content injection)

### Anti-Slop Final Check

- [ ] Would someone immediately say "AI made this"? If yes, redesign.
- [ ] No AI color palette (cyan-on-dark, purple gradients)
- [ ] No generic fonts (Inter, Roboto, Arial)
- [ ] No gratuitous glassmorphism, gradient text, or glow effects
- [ ] No identical card grids or hero metric templates
- [ ] Design feels intentional, distinctive, and memorable

---

## Attribution & Sources

- **Impeccable** by Paul Bakaus â Apache 2.0 â [github.com/pbakaus/impeccable](https://github.com/pbakaus/impeccable)
  - Frontend-design skill, 17+ commands, 7 domain references, anti-pattern registry
  - Builds on [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- **Awesome DESIGN.md** by VoltAgent â MIT â [github.com/VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
  - 58+ real-world DESIGN.md files following Google Stitch format
- **AIDesigner MCP** â [aidesigner.ai/docs/mcp](https://www.aidesigner.ai/docs/mcp)
  - MCP server for generate/refine design workflows
- **Anthropic frontend-design skill** â Built into Claude's skill system
