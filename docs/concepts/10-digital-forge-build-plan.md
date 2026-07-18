# Concept 10 — THE DIGITAL FORGE · Master UI Build Plan

*"A futuristic digital forge where players craft intelligence. Molten light, living circuitry, chrome and glass — wrapped around the app we already have."*

**Version:** 1.0 · **Date:** 2026-07-18 · **Status:** APPROVED BUILD PLAN (owner-directed)
**Supersedes for art direction:** concepts 05 / 06 / 08 (this plan absorbs their best mechanics — see §1.4)
**Execution target:** this document is written to be executed end-to-end by an implementing LLM (Opus 4.8 / Sonnet 5 class) with no additional design input. Every phase has exact file paths, component contracts, token values, and pass/fail acceptance gates.

---

## PART 0 — EXECUTION CONTRACT (read first, follow always)

These rules bind every phase below. They encode the cockpit-era lessons and the owner's directive: *push the visual boundary hard, never become non-functional.*

### 0.1 Architecture invariants (NEVER violate)

1. **One app, one React tree.** The Forge shell is the existing Next.js 15 / React 19 app's layout + component tree. There are NO iframes, NO postMessage bridges, NO separate SPA shell, NO Web-Component wrappers. Games remain React components mounted exactly as they are today (`GameAdapter` → `HtmlGameShell` on `src/app/(dashboard)/arcade/[gameSlug]/page.tsx`).
2. **The frame is DOM/CSS. Canvas is a garnish.** Every persistent UI surface (frames, panels, bars, nav, progress, text) is HTML/CSS/SVG. `<canvas>` (R3F/Pixi/Rive) is permitted ONLY for: (a) the marketing hero scene, (b) bounded one-shot ceremony moments, (c) small, lazy, absolutely-positioned ambience layers that are `aria-hidden`, load post-LCP via `next/dynamic` `ssr:false`, and can be removed without any loss of function.
3. **No WebGL/WebGPU on any dashboard critical path.** The LCP element on every route is HTML/text/an eager image — never a script-hydrated canvas.
4. **No canvas above interactive content.** Nothing with `pointer-events` may overlay a game viewport. Decorative overlays must set `pointer-events: none` and `aria-hidden="true"`.
5. **Games are untouched.** Zero edits inside `src/components/games/*` for the retheme phases (F0–F7). Games inherit the new look purely through the shell, tokens, and shared primitives. (Phase F8 *adds* one new game; it edits nothing in existing games.)
6. **Every phase is flag-gated and individually revertible** via the existing `flag()` pattern in `src/config/feature-flags.ts` (`NEXT_PUBLIC_<KEY>=false` ⇒ instant rollback, no code change).
7. **Existing token indirection is the retheme mechanism.** The live app reads colors as `rgb(var(--sf-*) / α)` from `src/styles/design-tokens.css`. The Forge theme OVERRIDES those variables under a `data-theme="forge"` root attribute — it does not fork components.

### 0.2 Quality gates (every phase must pass ALL before the next begins)

| Gate | Requirement | How to verify |
|---|---|---|
| Build | `npm run build` clean (0 TS errors) | run it |
| Perf | LCP < 2.5 s on the touched route, mid-tier throttled profile (4× CPU, Fast 3G in Playwright/DevTools); CLS ≈ 0 | Playwright trace or Lighthouse CI |
| Contrast | All text ≥ WCAG AA (4.5:1 body, 3:1 large). Existing contrast/design-matrix guard tests stay green | `npm run test` guard suite + `tests/e2e/a11y-*.spec.ts` |
| Reduced motion | `prefers-reduced-motion: reduce` yields a fully-composed static state — every animation in the phase has an explicit reduced-motion branch | manual + automated check per §14.3 |
| Flash safety | No element flashes > 3×/second; no full-screen strobes (WCAG 2.3.1) | code review checklist §14.4 |
| Keyboard | Every interactive element reachable and operable by keyboard; focus visible on forge-dark surfaces | axe + manual tab-through |
| Revert | Flipping the phase's flag to `false` restores the pre-phase UI exactly | manual toggle test |
| Snapshot | Playwright visual snapshot added for each new/redesigned surface under `tests/e2e/visual/` | run suite |

### 0.3 Git & process

- Work per-phase: one commit per phase slice, message format `Forge F<N>.<slice>: <summary>`.
- Update `PROGRESS.md` after each phase per the CLAUDE.md template (discrepancies log included).
- Escalation rules from CLAUDE.md §2 apply (2 failed auto-fix attempts → HARD STOP).
- Each phase ends with the HS-5-style visual checkpoint listed in its "Acceptance" block.

### 0.4 Build order (strict)

```
F0  Token consolidation sweep            (no visual change — prerequisite)
F1  Forge token theme + primitive library
F2  Forge Chamber (game shell restyle)   ← highest leverage: all 42 games
F3  Forge Complete ceremony
F4  Dashboard Workbench (layout + home)
F5  Forge Ring (lab selection)
F6  Marketing hero (cinematic 3D)
F7  ForgeSpark mascot
F8  Core Ignition (new game #43)
```

F2 depends on F0+F1. F3 depends on F1. F4 depends on F0+F1. F5 depends on F1+F4. F6 depends on F1 only (parallelizable). F7 depends on F1 (parallelizable after F1). F8 depends on F1+F2+F3+F7.

---

## PART 1 — CREATIVE DIRECTION (locked decisions)

### 1.1 The world

SparkForge is a **futuristic digital forge-laboratory** — a high-tech makerspace where intelligence is crafted, not conjured. Molten data streams feed glowing crucibles; holographic panels float over brushed-alloy workbenches; circuit traces pulse through the walls like veins; every finished lesson is *forged* — heated, hammered, quenched — into something the child made.

### 1.2 Palette temperature — LOCKED: **Molten-Warm**

Per owner acceptance of the review recommendation: the ground is **warm ember charcoal (brown-black), never blue-black gunmetal**. Molten amber/gold is the dominant light source. Spark-cyan is the secondary energy color (the "electric" note against the heat). Plasma-magenta exists ONLY in celebration moments (tertiary, rare). This keeps the premium sci-fi shine, differentiates from every cyan-on-black AI product, reads warmer for ages 7–9, and is literally on-brand (Spark + Forge).

**Iridescence rule:** the cyan/amber/magenta triad may co-occur only in (a) celebration ceremonies and (b) the marketing hero. Everywhere else: amber dominant, cyan accent, magenta absent.

### 1.3 Design language pillars

| Pillar | Meaning in practice |
|---|---|
| **Alloy + glass** | Panels are dark glass (blur + translucency) set in brushed-bronze/chrome bezels. Bezels are CSS (gradients + pseudo-elements), never images or canvas. |
| **Molten states** | Anything that fills, loads, or progresses is molten: flowing amber gradients, heat-to-cool transitions on completion. |
| **Living circuitry** | Backgrounds carry faint SVG circuit traces; current pulses along them (stroke-dashoffset). Glow appears only on *active* traces — restraint is the style. |
| **Forge-press interaction** | Buttons compress with heat-glow on press and release with a tiny spark burst. Panels arrive with magnetic snap (spring overshoot ≤ 4 px). |
| **Ceremony over ambience** | The big effects budget is spent on short, earned, one-shot moments (Forge Complete, level-up, lab ignition) — not on persistent background load. |

### 1.4 Lineage (what this plan absorbs from concepts 05/06/08)

- From **06 Living Forge**: the warm palette philosophy, the Forge-Strike ceremony structure, the sound identity (hum/clang/hiss/crackle), the "bright golden, never moody" guardrail.
- From **08 Spark Circuit**: pulse-along-trace motion, chain-reaction completion sweeps, the strict photosensitivity rules.
- From **05 Blueprint Forge**: nothing visual; its fidelity-ladder discipline ("the 2D tier is authentic, not a downgrade") is retained as policy.

### 1.5 Typography — LOCKED (no new font pipeline)

All faces are already loaded in the app:

| Role | Face | Usage |
|---|---|---|
| Display / headings | **Exo 2** (`--font-display`) | Screen titles, panel headers, buttons. Weight 600–800. Letter-spacing `0.02em` on all-caps labels. |
| Body | **Sora** (`--font-body`) | All reading text. Never below 14 px for kid-facing copy. |
| Data readouts | **JetBrains Mono** (`--font-mono`) | XP numbers, timers, scores, "temper readouts". Tabular-nums. |

**Text effects policy:** glow on text is permitted only for display-size headings (≥ 24 px) as a soft `text-shadow` (see `--glow-text` token). **Scanlines, chromatic aberration, and any distortion filter must NEVER apply to text or reading surfaces.** Body text is always clean Sora on a solid or ≥ 0.85-opacity panel.

### 1.6 Sound identity (Tone.js, existing dependency)

| Event | Sound |
|---|---|
| Forge-press (button) | soft metallic tick |
| Panel snap | low damped thunk |
| Progress milestone | rising warm hum |
| Gate/round success | single bright clang |
| Forge Complete ceremony | hum → 1–3 clangs (stars) → quench hiss → warm chord |
| Error/miss | dull tap (never harsh buzz) |

All sound routed through the existing audio settings/mute plumbing. Sound is always optional; nothing depends on it.

---

## PART 2 — THE FORGE TOKEN SYSTEM (Phase F1a)

### 2.1 File & mechanism

Create **`src/styles/forge-theme.css`**. Import it in `src/app/globals.css` immediately after the existing `@import "../styles/design-tokens.css";`:

```css
@import "../styles/design-tokens.css";
@import "../styles/forge-theme.css";
```

The file overrides the `--sf-*` variables under `:root[data-theme='forge']` and defines new `--forge-*` tokens. The attribute is set in **`src/app/layout.tsx`**: when `FEATURE_FLAGS.FORGE_THEME` is true, render `<html data-theme="forge" ...>` (otherwise omit the attribute). Because every redesigned component already reads `rgb(var(--sf-*) / α)`, the entire app rethemes from this one attribute, and `NEXT_PUBLIC_FORGE_THEME=false` restores the light theme instantly.

### 2.2 Complete token sheet (exact values — copy verbatim)

```css
/* ════════════════════════════════════════════════════════════════
   SPARKFORGE FORGE THEME v1.0 — "The Digital Forge" (Molten-Warm)
   Applies when <html data-theme="forge">. Overrides design-tokens.css.
   Ground is warm brown-black (ember charcoal) — NEVER blue-black.
   ════════════════════════════════════════════════════════════════ */
@layer base {
  :root[data-theme='forge'] {
    /* ── Surfaces (warm charcoal ladder) ── */
    --sf-surface:          30 22 16;    /* #1E1610 panel ground        */
    --sf-surface-alt:      22 16 11;    /* #16100B app background      */
    --sf-surface-elevated: 41 30 22;    /* #291E16 raised panels       */
    --sf-surface-muted:    51 38 28;    /* #33261C wells, inputs       */
    --sf-surface-inverse: 245 235 220;  /* #F5EBDC cream               */

    /* ── Text (AA-checked on #1E1610 / #16100B) ── */
    --sf-text-primary:   245 235 220;   /* #F5EBDC ≈14:1               */
    --sf-text-secondary: 211 194 172;   /* #D3C2AC ≈9:1                */
    --sf-text-muted:     172 152 130;   /* #AC9882 ≈5.6:1 (AA body)    */
    --sf-text-inverse:    30 22 16;

    /* ── Primary energy: MOLTEN (amber/gold) ── */
    --sf-primary:       255 140 26;     /* #FF8C1A molten amber        */
    --sf-primary-light: 255 194 74;     /* #FFC24A molten gold         */
    --sf-primary-dark:  199  94 12;     /* #C75E0C cooled ember        */

    /* ── Secondary energy: SPARK (electric cyan accent) ── */
    --sf-secondary:       53 224 255;   /* #35E0FF spark cyan          */
    --sf-secondary-light: 154 240 255;  /* #9AF0FF                     */

    /* ── Accents (semantic, re-tempered for warm dark) ── */
    --sf-accent-green:  127 226  74;    /* #7FE24A success / powered   */
    --sf-accent-purple: 196 140 255;    /* #C48CFF                     */
    --sf-accent-pink:   255  61 165;    /* #FF3DA5 PLASMA — ceremony-only */
    --sf-accent-yellow: 255 217  61;    /* #FFD93D                     */
    --sf-accent-cyan:    53 224 255;    /* alias of secondary          */
    --sf-accent-red:    255 107  92;    /* #FF6B5C errors (warm red)   */

    /* ── Borders ── */
    --sf-border:        74 58 44;       /* #4A3A2C alloy seam          */
    --sf-border-focus: 255 140 26;      /* molten focus ring           */
    --sf-border-subtle: 54 42 32;       /* #362A20                     */

    /* ── Metallics (bezel gradients — used via var() in gradients) ── */
    --forge-bronze:        #C87B3B;
    --forge-bronze-deep:   #8A5426;
    --forge-chrome-hi:     rgba(255 236 210 / 0.28);  /* specular top edge  */
    --forge-chrome-mid:    rgba(255 220 180 / 0.10);
    --forge-chrome-lo:     rgba(0 0 0 / 0.45);        /* bezel underside    */

    /* ── Glass ── */
    --forge-glass-bg:      rgba(41 30 22 / 0.62);
    --forge-glass-border:  rgba(255 194 74 / 0.14);
    --forge-glass-blur:    14px;

    /* ── Glow & shadow ── */
    --shadow-sm: 0 1px 2px rgba(0 0 0 / 0.5);
    --shadow-md: 0 4px 16px rgba(0 0 0 / 0.55);
    --shadow-lg: 0 10px 32px rgba(0 0 0 / 0.6);
    --shadow-xl: 0 20px 56px rgba(0 0 0 / 0.65);
    --shadow-glow-primary: 0 0 24px rgba(255 140 26 / 0.35);
    --shadow-glow-green:   0 0 24px rgba(127 226 74 / 0.30);
    --shadow-glow-pink:    0 0 24px rgba(255 61 165 / 0.30);
    --shadow-glow-orange:  0 0 24px rgba(255 140 26 / 0.35);
    --glow-text: 0 0 18px rgba(255 194 74 / 0.35);    /* display headings only */

    /* ── Molten gradient (the signature fill) ── */
    --forge-molten: linear-gradient(90deg,
      #C75E0C 0%, #FF8C1A 35%, #FFC24A 60%, #FF8C1A 85%, #C75E0C 100%);
    --forge-molten-vert: linear-gradient(180deg, #FFC24A 0%, #FF8C1A 55%, #C75E0C 100%);

    /* ── Motion (forge feel) ── */
    --transition-fast:   140ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base:   240ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
    --forge-press:       90ms  cubic-bezier(0.6, 0, 0.4, 1);   /* button down  */
    --forge-release:     260ms cubic-bezier(0.22, 1.4, 0.36, 1);/* snap back   */
    --forge-snap:        360ms cubic-bezier(0.22, 1.2, 0.36, 1);/* panel entry */
    --forge-flow-dur:    2400ms;                                /* molten drift */
  }

  /* High-contrast override (a11y toolbar) — flattens glass, boosts text */
  :root[data-theme='forge'][data-contrast='high'] {
    --forge-glass-bg: rgba(22 16 11 / 0.96);
    --sf-text-muted: 211 194 172;
    --glow-text: none;
  }
}
```

**Contrast facts the implementer must preserve:** `#F5EBDC` on `#1E1610` ≈ 14:1; `#FFC24A` on `#1E1610` ≈ 10:1 (safe for headings/data); `#FF8C1A` on `#16100B` ≈ 7.4:1; `#35E0FF` on `#1E1610` ≈ 10.7:1; `#AC9882` on `#1E1610` ≈ 5.6:1 (minimum body-muted — never dim further). Any NEW color combination must be checked against the guard tests before use. **Text is never set in `--sf-primary` amber below 18 px.**

### 2.3 Tailwind bridge

`tailwind.config.ts`: ensure theme colors exist that resolve through the variables (so classes work in both themes). Add under `theme.extend.colors` (skip any that already exist):

```ts
sf: {
  surface:      'rgb(var(--sf-surface) / <alpha-value>)',
  'surface-alt':'rgb(var(--sf-surface-alt) / <alpha-value>)',
  elevated:     'rgb(var(--sf-surface-elevated) / <alpha-value>)',
  muted:        'rgb(var(--sf-surface-muted) / <alpha-value>)',
  border:       'rgb(var(--sf-border) / <alpha-value>)',
  primary:      'rgb(var(--sf-primary) / <alpha-value>)',
  'primary-light':'rgb(var(--sf-primary-light) / <alpha-value>)',
  secondary:    'rgb(var(--sf-secondary) / <alpha-value>)',
  text:         'rgb(var(--sf-text-primary) / <alpha-value>)',
  'text-secondary':'rgb(var(--sf-text-secondary) / <alpha-value>)',
  'text-muted': 'rgb(var(--sf-text-muted) / <alpha-value>)',
},
```

---

## PART 3 — FEATURE FLAGS (Phase F1a)

Append to `FEATURE_FLAGS` in `src/config/feature-flags.ts`, using the existing `flag()` helper and the existing `isDev` default convention:

```ts
/** ── DIGITAL FORGE RETHEME (Concept 10) ── */
/** Master token flip: <html data-theme="forge"> */
FORGE_THEME:      flag('FORGE_THEME', isDev),
/** Forge Chamber game shell restyle (F2) */
FORGE_CHAMBER:    flag('FORGE_CHAMBER', isDev),
/** Forge Complete ceremony overlay (F3) */
FORGE_CEREMONY:   flag('FORGE_CEREMONY', isDev),
/** Dashboard Workbench layout + home (F4) */
FORGE_DASHBOARD:  flag('FORGE_DASHBOARD', isDev),
/** Forge Ring lab selection (F5) */
FORGE_RING:       flag('FORGE_RING', isDev),
/** Cinematic marketing hero (F6) */
FORGE_HERO:       flag('FORGE_HERO', isDev),
/** ForgeSpark mascot replaces Sparky visuals (F7) */
FORGE_MASCOT:     flag('FORGE_MASCOT', isDev),
/** Canvas ambience layers (ember fields etc.) — global kill-switch */
FORGE_AMBIENCE:   flag('FORGE_AMBIENCE', isDev),
/** Core Ignition game #43 visible in arcade (F8) */
GAME_CORE_IGNITION: flag('GAME_CORE_IGNITION', isDev),
```

Dependency rule (enforce in code): `FORGE_CHAMBER/CEREMONY/DASHBOARD/RING/HERO/MASCOT` each check `FEATURE_FLAGS.FORGE_THEME &&` their own flag — the sub-surfaces never render forge-styled against the light theme.

---

## PART 4 — FORGE PRIMITIVE LIBRARY (Phase F1b)

All primitives live in **`src/components/forge/`** with a barrel `index.ts`. They are pure DOM/CSS/SVG (zero canvas) unless stated. Every primitive: `'use client'` only when it needs state/motion; accepts `className`; is theme-token-driven (no hardcoded colors — tokens only); has an explicit `prefers-reduced-motion` branch (use `useReducedMotion()` from `motion/react` or the CSS media query).

### 4.1 `ForgePanel.tsx` — the universal container

```ts
interface ForgePanelProps {
  variant?: 'glass' | 'alloy' | 'holo';   // default 'glass'
  bezel?: boolean;                         // default true — chrome bezel edge
  glow?: 'none' | 'ambient' | 'active';    // default 'none'
  as?: React.ElementType;                  // default 'section'
  children: React.ReactNode;
  className?: string;
}
```

- **glass**: `background: var(--forge-glass-bg); backdrop-filter: blur(var(--forge-glass-blur)); border: 1px solid var(--forge-glass-border); border-radius: var(--radius-lg);`
- **alloy**: opaque `rgb(var(--sf-surface-elevated))` with a subtle brushed-metal top sheen: `background-image: linear-gradient(180deg, var(--forge-chrome-mid), transparent 18%);`
- **holo**: glass + a faint cyan inner border `inset 0 0 0 1px rgba(53 224 255 / 0.12)` + reserved for AI/hint content only.
- **bezel** (the chrome frame): implemented with a `::before` pseudo-element — 2 px ring using `linear-gradient(180deg, var(--forge-chrome-hi), var(--forge-chrome-mid) 30%, var(--forge-chrome-lo))` masked to the border via `padding: 2px; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;`. This is the signature "metallic frame" and costs zero JS.
- **glow: 'active'** adds `box-shadow: var(--shadow-glow-primary)`.
- Panels entering the viewport animate with the **magnetic snap**: `motion.div` `initial={{ opacity: 0, y: 14, scale: 0.985 }}` `animate={{ opacity: 1, y: 0, scale: 1 }}` `transition={{ duration: 0.36, ease: [0.22, 1.2, 0.36, 1] }}`. Reduced-motion: render final state, no animation. Gate entry animation behind an `animateIn?: boolean` prop (default false) so lists don't stagger-spam.

### 4.2 `ForgeButton.tsx` — forge-press interaction

```ts
interface ForgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'molten' | 'alloy' | 'ghost' | 'danger';  // default 'molten'
  size?: 'sm' | 'md' | 'lg';
  sparks?: boolean;      // default true — spark burst on activate
}
```

- **molten**: `background: var(--forge-molten); color: rgb(var(--sf-text-inverse));` bold Exo 2; background-position animates ±20% over `--forge-flow-dur` (paused under reduced-motion & when not hovered).
- Press: scale 0.96 + `filter: brightness(1.15)` over `--forge-press`; release springs back over `--forge-release`.
- **Spark burst**: on activation, render ≤ 8 absolutely-positioned 3–4 px `<span>` particles (amber/gold) that fly outward 12–24 px and fade over 380 ms, then unmount. Pure CSS keyframes with per-particle `--angle` custom property. `aria-hidden`. Skipped entirely under reduced-motion. One burst max per 300 ms (throttle).
- Focus-visible: 2 px `rgb(var(--sf-border-focus))` outline + 2 px offset — mandatory on dark ground.
- Must remain a real `<button>` (all native semantics preserved).

### 4.3 `MoltenProgress.tsx` — the signature progress bar

```ts
interface MoltenProgressProps {
  value: number;          // 0..1; -1 = indeterminate ("forging…")
  height?: number;        // px, default 8
  label?: string;         // aria-label, required if no visible label
  showHeatTip?: boolean;  // default true — bright leading edge
}
```

- Track: `rgb(var(--sf-surface-muted))`, inset shadow.
- Fill: `background: var(--forge-molten); background-size: 200% 100%;` with `background-position` cycling over `--forge-flow-dur` (the molten drift). Leading 6 px is brightest (`#FFC24A` radial "heat tip").
- Indeterminate: a 30%-wide molten segment sweeping left→right, 1.6 s loop, label defaults to "Forging…".
- On reaching 1.0: fill transitions amber → `rgb(var(--sf-accent-green))` over 600 ms (heat→cool "tempered" moment) + one soft glow pulse.
- ARIA: `role="progressbar"`, `aria-valuenow/min/max`; indeterminate omits `aria-valuenow`.
- Reduced-motion: static gradient, no drift, no sweep (indeterminate shows a static 100% dimmed fill + visible text label instead).

### 4.4 `ForgeDial.tsx` — radial stat/completion ring (SVG)

```ts
interface ForgeDialProps {
  value: number;           // 0..1
  size?: number;           // px, default 64
  thickness?: number;      // default 6
  color?: string;          // CSS color, default molten gradient via <linearGradient>
  children?: React.ReactNode;  // center content (icon / % / count)
  label: string;           // aria-label
}
```

SVG circle with `stroke-dasharray/dashoffset`; animate dashoffset with motion on mount (reduced-motion: instant). Center content is real DOM (absolutely centered div). Used by: lab completion rings (F5), Daily Forge quests (F4), profile stats.

### 4.5 `CircuitTraces.tsx` — living-circuitry background (SVG, decorative)

```ts
interface CircuitTracesProps {
  density?: 'low' | 'med';    // default 'low'
  pulse?: boolean;            // default true — one current pulse at a time
  className?: string;         // caller sizes/positions it
}
```

- A hand-authored SVG (single file, inline component) of orthogonal circuit paths with rounded corners + node dots, stroked in `rgb(var(--sf-border-subtle))` at 1 px.
- **Pulse**: exactly ONE path at a time gets an animated bright segment (amber, `stroke-dasharray` 40/1000, dashoffset keyframed over 4 s, `stroke: #FF8C1A`, opacity 0.7). When it completes, a different path pulses after a 2–5 s randomized idle. Never more than one pulse concurrently — restraint is the aesthetic AND the perf budget.
- Always `aria-hidden="true"`, `pointer-events: none`, positioned behind content, opacity ≤ 0.5 under text regions.
- Reduced-motion: pulses disabled; static traces remain. Tab hidden (`visibilitychange`): animation paused.

### 4.6 `EmberField.tsx` — drifting embers (DOM, decorative, ambience-flagged)

- Renders 10–14 absolutely-positioned 2–4 px radial-gradient dots (amber core, transparent edge) rising slowly with slight sway; CSS keyframes, randomized `animation-delay/duration` via inline custom properties.
- Gated by `FEATURE_FLAGS.FORGE_AMBIENCE`. `aria-hidden`, `pointer-events:none`.
- Hard caps: ≤ 14 particles per instance, ≤ 1 instance per route. Paused under reduced-motion and when tab hidden. On `tier === 'mobile'` (via `useDeviceProfile`), particle count drops to 6.

### 4.7 `HoloChip.tsx` — label chip

Small pill: glass bg, cyan 1 px border at 0.25 opacity, Exo 2 11 px uppercase, `letter-spacing: 0.06em`. Props: `tone?: 'amber' | 'cyan' | 'green' | 'neutral'`. Used for category tags, difficulty, "AI content" badges.

### 4.8 `HeatShimmer.tsx` — heat-distortion hover (bounded, desktop-only)

SVG filter distortion (`feTurbulence` + `feDisplacementMap`, scale ≤ 6) applied to a DECORATIVE child only (never text, never form controls, never game content). Active only `:hover` on `tier ∈ {desktop, ultrawide}`, 400 ms ease-out both ways. Reduced-motion: disabled. Use sparingly: CTA icons, the ceremony blob, lab orb hover. If Safari perf issues arise (feTurbulence is CPU-composited there), the component silently renders children unfiltered — behavior, not visuals, is the contract.

### 4.9 `SparkBurst.tsx` — shared celebration burst

Imperative helper + component: `<SparkBurst fire={n} origin={{x,y}} palette="forge" />` — fires ≤ 24 DOM particles once per `fire` increment. Flash-safe (particles fade, no strobe), `aria-hidden`, auto-unmounts. Replaces scattered ad-hoc confetti for small wins (canvas-confetti remains ONLY inside the F3 ceremony).

### 4.10 `useForgeTier.ts` (hook, in `src/hooks/`)

Thin wrapper over the existing `src/hooks/useDeviceProfile.ts`: returns `{ tier, isCompact, allowAmbience, allowShimmer }` where `allowAmbience = FORGE_AMBIENCE && !prefersReducedMotion && tier !== 'mobile'`, `allowShimmer = tier ∈ {desktop, ultrawide} && !prefersReducedMotion`. ALL conditional effect mounting goes through this hook — no scattered media queries.

### 4.11 Acceptance (F1)

- Storybook-style demo route `src/app/dev/forge/page.tsx` rendering every primitive in every variant (dev-only route; the `dev` folder already exists).
- All gates in §0.2 pass on the demo route. Visual snapshot of the demo route recorded.
- HARD-STOP checkpoint: owner reviews `/dev/forge` and approves the look before F2.

---

## PART 5 — PHASE F0: TOKEN CONSOLIDATION SWEEP (no visual change)

**Goal:** eliminate hardcoded Tailwind palette classes in redesigned (HTML-first) surfaces so the `data-theme` flip rethemes everything. ~250 occurrences exist (audit: 60× `text-slate-400`, 32× `text-slate-500`, 32× `bg-slate-800`, 26× `text-purple-400`, 26× `text-cyan-400`, 23× `bg-slate-900`, etc.).

### 5.1 Method

1. Enumerate: `grep -rEn "text-(slate|gray|zinc|cyan|purple|blue|violet|fuchsia|sky)-[0-9]+|bg-(slate|gray|zinc)-(700|800|900|950)" src/components src/app --include="*.tsx"` — write the list to `docs/concepts/10-forge-sweep-audit.md` before editing.
2. **Scope rule:** sweep ONLY files on HTML-first surfaces (layout, dashboard, arcade, labs, profile, parent, settings, shared, ui, celebrations, sparky, ai-tutor, subscription, onboarding). Do NOT touch `src/components/3d/**` (legacy cockpit, flag-off in prod) or `src/components/games/**` (invariant 0.1.5 — game-internal colors are content, not chrome).
3. Replacement map (apply mechanically):

| Hardcoded | Replace with |
|---|---|
| `text-slate-300/400` | `text-sf-text-secondary` |
| `text-slate-500/600` | `text-sf-text-muted` |
| `text-white`, `text-slate-50..200` (as body text) | `text-sf-text` |
| `bg-slate-800/900/950`, `bg-zinc-*`, `bg-gray-900` | `bg-sf-surface` / `bg-sf-elevated` / `bg-sf-muted` (pick by elevation role) |
| `text-cyan-*` (accent role) | `text-sf-secondary` |
| `text-purple-*`, `text-blue-*` (accent role) | `text-sf-primary` or semantic accent per context |
| `border-slate-*`, `border-white/10` | `border-sf-border` |

4. Judgment rule for the implementer: choose the token by **role** (is this muted metadata? body? an accent?) not by nearest hue. When ambiguous, match the token whose CURRENT light-theme value best preserves today's rendering — F0 must be visually invisible.
5. Commit in batches of ≤ 15 files: `Forge F0.<n>: token sweep — <area>`.

### 5.2 Acceptance (F0)

- The grep from 5.1.1 returns zero matches in swept scopes.
- `npm run build` clean; all existing visual snapshots byte-identical or within threshold (light theme unchanged); guard tests green.

---

## PART 6 — PHASE F2: THE FORGE CHAMBER (game shell restyle)

**Files:** `src/components/game/HtmlGameShell.tsx` (primary), `src/components/game/GameAdapter.tsx` (untouched contract), `src/app/(dashboard)/arcade/[gameSlug]/page.tsx` (pre-game screen).
**Contract invariant:** `HtmlGameShellProps` and all callbacks (`onComplete`, `onProgress`, `onExit`) are IDENTICAL — games cannot tell the difference.

### 6.1 Chamber anatomy (flag `FORGE_CHAMBER`; flag-off renders today's shell untouched)

```
┌─ ChamberFrame (ForgePanel variant=alloy, bezel, full-bleed column) ──────┐
│ ┌─ ChamberHeader (h-14) ────────────────────────────────────────────────┐ │
│ │ [◀ exit] Title (Exo2) · HoloChip(category) · HoloChip(difficulty)     │ │
│ │                    score readout (JetBrains, tabular) · [pause] ▐     │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ ══ MoltenProgress (value = currentQuestion/total, height 8) ══════════════ │
│ ┌─ ChamberViewport ─────────────────────────────────────────────────────┐ │
│ │   {children}  ← the untouched game, inside a glass ForgePanel,        │ │
│ │   max-w-3xl centered, min 16px padding, NO overlays above it          │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│  corner rivets (4 CSS dots) · faint CircuitTraces behind viewport edges   │
└───────────────────────────────────────────────────────────────────────────┘
```

Implementation notes:

- **Curvature:** the "curved forge viewport" is faked in CSS — the ChamberFrame gets `border-radius: 20px` outer, and two side "struts" (4 px vertical gradient bars, bronze) with a subtle `clip-path` chamfer on top corners. NO transforms on the content (curved/perspective-transformed content harms readability and hit-testing; the frame *suggests* the cockpit curve, the content stays flat). This deliberately softens the concept's literal panoramic curve — legibility wins.
- Header buttons are `ForgeButton variant="ghost" size="sm"`; exit keeps `aria-label="Exit game"`.
- Score readout: `--font-mono`, `text-sf-primary-light`, with a 200 ms scale-pop (1 → 1.15 → 1) on increment (reduced-motion: no pop).
- **Pause = "Chamber Vented":** the existing `PauseOverlay` restyled as a centered `ForgePanel variant=glass glow=ambient` with title "Chamber Paused", buttons Resume (`molten`), Restart (`alloy`), Exit (`ghost`). Backdrop `rgba(22 16 11 / 0.8)` + blur 6 px. Focus-trapped (it already handles focus; preserve).
- **Hint dock:** the existing AITutor system (`src/components/ai-tutor/`) mounts as before; in the Chamber it docks bottom-right as a `ForgePanel variant=holo` slide-in (translate-x spring, `--forge-snap`). No new hint logic — reskin only.
- Ambience: NO EmberField inside the chamber (games own their visual field). CircuitTraces only in the frame margins at `density=low`, `pulse=false` on `tier=mobile`.
- **Pre-game screen** (`arcade/[gameSlug]/page.tsx` difficulty selector): restyle with ForgePanel cards, difficulty tiers as three `ForgeButton` variants with `ForgeDial` best-score rings; "IGNITE" as the launch CTA (`ForgeButton variant=molten size=lg`). All existing logic (tier access, `GameLockedNotice`, loaders) untouched.

### 6.2 Acceptance (F2)

- Play-test 6 games end-to-end (one per tier mix: `ai-spy`, `pet-trainer`, `neural-builder`, `emoji-decoder`, plus 2 standard) — full welcome→complete cycle, pause/resume/restart/exit all work.
- All §0.2 gates. Snapshot: chamber at 375 px, 768 px, 1440 px widths.
- Flag-off check: `NEXT_PUBLIC_FORGE_CHAMBER=false` renders the current shell pixel-identical.
- HARD-STOP visual checkpoint (owner): "Forge Chamber live on all 42 games — verify frame, molten progress, pause overlay, hint dock, pre-game screen."

---

## PART 7 — PHASE F3: FORGE COMPLETE CEREMONY

**File:** new `src/components/celebrations/ForgeCompleteCeremony.tsx`; `CelebrationOverlay.tsx` becomes the flag-off path. Switch in the ONE place `CelebrationOverlay` is rendered (arcade page): `FEATURE_FLAGS.FORGE_CEREMONY ? <ForgeCompleteCeremony …/> : <CelebrationOverlay …/>`. Props: identical (`result: GameResult`, `onDismiss`).

### 7.1 The ceremony timeline (GSAP timeline, total ≤ 4.5 s, skippable at any moment)

| t (s) | Beat | Implementation |
|---|---|---|
| 0.0 | **Dim + dais**: backdrop fades to `rgba(22 16 11 / 0.88)`; a bronze anvil-dais silhouette (inline SVG, ~40 nodes) rises from bottom 24 px | DOM/SVG, GSAP `y`+opacity |
| 0.4 | **Molten blob**: an amber radial-gradient blob (div, `border-radius: 46% 54% 52% 48%`, subtle wobble keyframes) descends onto the dais | DOM |
| 1.0–2.2 | **Hammer beats** — one per star earned (1–3): screen-safe micro-flash on the blob only (brightness 1→1.6→1, 180 ms — NOT full-screen), a ≤ 24-particle SparkBurst per beat, Tone.js clang, and 3 px translate "thud" on the dais (not the page) | SparkBurst + GSAP; beats ≥ 400 ms apart (flash-rate safe) |
| 2.4 | **Quench**: blob morphs (scale/borderradius tween) into the badge/star result; amber → cyan-white steam wisps (3 CSS pseudo-particles); Tone.js hiss | DOM |
| 2.8 | **Reveal card**: `ForgePanel variant=glass glow=active` springs in with: stars (staggered pop), `+{xpEarned} XP` counting up in JetBrains Mono, score/maxScore, canvas-confetti one burst, colors `['#FF8C1A','#FFC24A','#35E0FF','#F5EBDC']` (forge palette; magenta `#FF3DA5` added ONLY when `starsEarned === 3`) | existing card pattern, restyled |
| 3.2+ | Buttons: "Claim" (`molten`, calls `onDismiss`), "Replay" if the current overlay offers it | — |

- **Skip:** any click/tap/Escape/Enter jumps the timeline to the reveal card instantly (GSAP `progress(1)`). This is mandatory — kids replay games; the ceremony must never feel like a tax.
- **Reduced-motion:** render the reveal card immediately, fully composed, zero timeline, no confetti; stars appear statically.
- **Flash audit:** the only luminance transient is the blob-local hammer flash, ≥ 400 ms spacing, ≤ 3 beats → compliant with WCAG 2.3.1 by construction.
- 0 stars: skip hammer beats; blob cools directly to a "keep forging!" card with an encourage tone — never a sad/punitive visual.

### 7.2 Acceptance (F3)

All §0.2 gates; ceremony verified at 0/1/2/3 stars; skip works mid-beat; `FORGE_CEREMONY=false` restores the current overlay. Snapshot of the reveal card.

---

## PART 8 — PHASE F4: DASHBOARD WORKBENCH

**Files:** `src/app/(dashboard)/layout.tsx`, `src/components/layout/{TopBar,Sidebar,BottomNav}.tsx`, `src/app/(dashboard)/home/page.tsx` (+ its child components in `src/components/home/`).

### 8.1 Layout shell

- Root background: `bg-sf-surface-alt` with ONE fixed, full-viewport `CircuitTraces density=low` layer behind everything (`position: fixed; inset: 0; z-index: 0; opacity: 0.4`) + ONE `EmberField` (via `useForgeTier().allowAmbience`). Content wrapper `z-index: 1`. That is the ENTIRE ambient budget for the dashboard.
- **Sidebar → Control Rail:** `ForgePanel variant=alloy` full-height, 72 px collapsed / 240 px expanded (preserve current expand behavior if present; otherwise fixed current width). Nav items: icon + label, active item gets a 3 px molten left-edge bar + `text-sf-primary-light`; hover gets `bg-sf-muted`. Preserve every existing route/item/aria attribute.
- **TopBar:** glass ForgePanel strip. Left: SparkForge wordmark (Exo 2, `--glow-text`). Center/right: **Forge Rank** (level) as `ForgeDial size=40` with the level number, and the XP bar as `MoltenProgress height=6 showHeatTip` (value = xp progress into level — reuse whatever the current TopBar reads from gamification hooks). Streak flame count in JetBrains Mono. All existing menus (profile, settings, child switcher) preserved, restyled as glass dropdown panels.
- **BottomNav (mobile):** alloy panel, safe-area padded; active tab = molten dot indicator + label. No ambience layers on mobile.

### 8.2 Home page composition (top → bottom)

1. **Workbench hero panel** (`ForgePanel variant=glass, animateIn`): greeting ("Back to the forge, {name}"), Continue-CTA (`ForgeButton molten lg`) resuming the most recent incomplete game (existing continue logic), and the child's level/xp/streak strip. This panel contains the page's LCP text — it must be server-renderable/static-first (no client-only gating of its text).
2. **Daily Forge** — the quest rail: existing daily/quest components (`src/components/quests/`) re-laid-out as 3 radial cards: each a `ForgePanel alloy` with `ForgeDial` (progress), quest title, XP reward `HoloChip`. Horizontal scroll-snap on mobile.
3. **Quick-launch tiles**: favorite/recent games grid (existing data hooks) — each tile: game icon large, name Exo 2, lab-colored 2 px top border (lab colors from `LAB_COLORS` — they remain the per-lab accents inside the forge world), `ForgeDial` mini best-score. Hover: bezel glow + `HeatShimmer` on the ICON only (desktop).
4. **Lab shortcut strip**: horizontal row of 11 lab chips → links to `/labs` (full ring in F5).
5. Right rail (≥ 1024 px): the AITutor / companion dock (existing) inside `ForgePanel variant=holo` — persistent, dockable position preserved.

**Explicitly cut (per review, owner-accepted):** the drag-and-drop modular HUD and the holographic cursor trail are NOT built. Do not implement them.

### 8.3 Acceptance (F4)

All §0.2 gates on `/home` (LCP element = workbench greeting text; measure with ambience ON). Mobile 375 px, tablet 768 px, desktop 1440 px snapshots. All nav routes still resolve; keyboard tab order: skip-link → topbar → rail → main. `FORGE_DASHBOARD=false` restores current dashboard. HARD-STOP owner checkpoint.

---

## PART 9 — PHASE F5: THE FORGE RING (lab selection)

**File:** `src/app/(dashboard)/labs/page.tsx` (+ new `src/components/labs/ForgeRing.tsx`, `src/components/labs/LabCrucibleCard.tsx`).

### 9.1 Two views, one truth

The labs page gets a **view toggle** (segmented control, top right): **Ring** (default on `tier ∈ {desktop, ultrawide}`) and **Grid** (default on mobile/tablet; always available everywhere). Both render from the same lab data (`LAB_NAMES`, `LAB_COLORS`, `LAB_ICONS`, `useAllLabsProgress`). The Grid view is the current lab grid restyled with ForgePanels — it is the baseline and the a11y-guaranteed path.

### 9.2 The Ring (CSS 3D — zero canvas)

- Container: `perspective: 1200px;` centered stage ~560 px tall.
- 11 **crucible orbs** positioned by `transform: rotateY(i * 32.727deg) translateZ(340px)` inside a rotating carrier div. Carrier rotation is driven by GSAP on: drag (x-delta → rotation), wheel (horizontal), arrow keys ← → (rotate one slot, 360/11°, snapped), and clicking a side orb (rotates it to front).
- Each orb (`LabCrucibleCard`): a 150 px circular `ForgePanel alloy` disc — lab icon (emoji, 44 px), lab name (Exo 2 13 px), completion as a molten ring (`ForgeDial` wrapping the disc, color = that lab's `LAB_COLORS` hex), locked labs dimmed with a lock chip. The front-facing orb scales to 1.18 and gains `glow=active`; orbs facing away get `opacity: 0.35` and `pointer-events: none` (compute facing from slot index vs rotation).
- **Front orb expansion:** click/Enter on the front orb flips it to an expanded `ForgePanel glass` card (lab description, games count, top 3 game chips, "Enter Lab" `ForgeButton molten`) — `motion` layout animation, no route change until "Enter Lab" (→ existing lab route).
- **Keyboard/a11y contract:** the ring root is `role="listbox"` `aria-label="Choose a lab"`, orbs are `role="option"` with `aria-selected` on the front orb; ← → rotate, Enter expands, Escape collapses. Focus stays on the listbox root; `aria-activedescendant` tracks the front orb. Screen-reader text includes completion % ("Lab 3, The Brain Inside, 40 percent forged").
- **Reduced-motion:** the ring never auto-rotates; slot changes are instant (no tween). Users can still use Grid view.
- **Do NOT build** the R3F/orbit-controls version now. Leave a `// FORGE_RING_3D: reserved` comment; a future flag may add a canvas-enhanced ring behind the same listbox semantics. The CSS ring is the product.

### 9.3 Acceptance (F5)

All §0.2 gates. E2E: keyboard-only user reaches and enters every one of the 11 labs in Ring view AND Grid view. Task-success guard: extend `core-flow-smoke.spec.ts` — "find and start a game from /labs" must not regress vs the grid baseline (this is the IV-A comprehension gate). Snapshots of both views. `FORGE_RING=false` restores the current labs page.

---

## PART 10 — PHASE F6: CINEMATIC MARKETING HERO (v1.1 — owner-amended 2026-07-18)

**Amendment log (v1.0 → v1.1, all owner-approved):**
- The v1.0 R3F anvil/particle-assembly scene is REPLACED by the **Lightfall** shader background (React Bits) + the **light-forged wordmark** sequence.
- The Sparky/hologram title sequence (`HeroHologram.tsx`) is RETIRED — no mascot appears in the hero title.
- Canonical tagline (already live in `HeroContent.tsx:33`, carried forward verbatim): **"Sparking Curiosity, and Forging Skills with AI"**.
- The existing 5-act `ScrollJourney` engineering is RETAINED and rethemed (v1.0's 3-section spec is dropped).
- New **Molten Thread** scroll transition binds hero → sections → CTA into one continuous circuit.
- The hero micro-game is REPLACED — final game choice is **DECISION PENDING** (§10.6); "Light the Network" is the spec'd default.

**Files:** `src/app/(marketing)/page.tsx`, `src/components/landing/HeroSection.tsx`, `HeroContent.tsx`, `ScrollJourney.tsx` (restyle in place behind `FORGE_HERO`); new `src/components/bits/Lightfall.tsx`, `src/components/landing/ForgedWordmark.tsx`, `src/components/landing/MoltenThread.tsx`, `src/components/landing/NetworkMicroDemo.tsx` (§10.6).

This is the ONE surface where WebGL is authorized (invariant 0.1.2a).

### 10.1 Lightfall — dependency & vendoring

1. `npm install ogl` (small WebGL library, no three.js overlap; log size + license in PROGRESS.md per Part 13 policy).
2. **Vendor** the React Bits Lightfall source (reactbits.dev/backgrounds/lightfall; repo `DavidHDev/react-bits`, `src/content/Backgrounds/Lightfall/`) into `src/components/bits/Lightfall.tsx`, converted to TypeScript, following the established bits pattern (`withReducedMotion`/`withDeviceProfile` wrappers available in that folder). We own the copy — modifications below are expected.
3. Required adaptations to the vendored copy:
   - **Imperative handle**: `forwardRef` exposing `setUniforms({ speed?, density?, opacity? })` so scroll choreography (§10.4) can drive shader uniforms per-frame WITHOUT React re-renders.
   - **`dpr` clamp**: `Math.min(devicePixelRatio, 1.5)` desktop, `1` on `tier ∈ {mobile, tablet}` (via `useForgeTier`).
   - **Auto-pause**: internal IntersectionObserver sets `paused=true` when < 5% visible; also pause on `visibilitychange`.
   - **Reduced-motion**: render one static frame then pause (the still frame IS the fallback art).
   - **No-WebGL fallback**: context-creation failure → render nothing; the CSS poster layer beneath (§10.2) is always present.

### 10.2 Hero viewport (`HeroSection` v2 — layer stack, bottom → top)

| z | Layer | Spec |
|---|---|---|
| 0 | **Poster** (always present) | CSS gradient: `radial-gradient(ellipse 80% 70% at 50% 30%, #33261C 0%, #1E1610 45%, #16100B 100%)` — this is the no-JS / no-WebGL / pre-hydration state and prevents any flash |
| 1 | **Lightfall canvas** (post-LCP dynamic import, `ssr:false`) | Props: `colors={['#FFC24A','#FF8C1A','#35E0FF']}` (two molten streams + ONE spark-cyan — the signature tension; hero is a sanctioned triad surface), `backgroundColor='#16100B'` (≡ `--sf-surface-alt` → seamless ground continuity with the app), `speed=0.5`, `density=0.6` (`0.4` mobile), `glow=1`, `twinkle=0.6`, `backgroundGlow=0.35`, `mouseInteraction` on (`mouseStrength=0.5, mouseRadius=1, mouseDampening=0.15`) — the light bends around the cursor; touch devices simply never update the mouse uniform. Fades in over 800 ms once ready. |
| 2 | **Readability scrim** | Keep the existing scrim pattern, retuned warm: `radial-gradient(ellipse 70% 60% at 50% 45%, rgba(22,16,11,0.72) 0%, rgba(22,16,11,0.35) 55%, transparent 100%)`, `aria-hidden`, `pointer-events:none` |
| 3 | **Content** | `ForgedWordmark` (§10.3) + tagline + CTA `ForgeButton molten lg` "Enter the Forge" (→ signup) + scroll cue |

LCP element = the `<h1>` wordmark text (renders immediately, server-side). CLS 0: every layer is absolutely positioned within the `100dvh` section.

### 10.3 The light-forged wordmark (`ForgedWordmark.tsx`)

**Concept:** no mascot. The falling light forges the brand name itself — the title *enacts* the product promise.

- **Markup:** one real `<h1>` — `SPARKFORGE` (Exo 2, weight 800, `clamp(3rem, 9vw, 7.5rem)`) with `LABS` beneath (Exo 2, weight 600, `letter-spacing: 0.42em`, ~1/4 size). Real HTML text at all times (SEO + screen readers get it instantly; the animation is purely presentational).
- **Sequence** (CSS custom-property timeline driven by GSAP; total ≈ 2.5 s, starts on mount, loosely synced to Lightfall — NEVER reads canvas state, so it runs identically if WebGL is absent):

| t (s) | Beat | Technique |
|---|---|---|
| 0.0 | **Unlit alloy**: letters visible but dark-embossed | `background-clip: text` with a static dark-alloy gradient (`#33261C → #291E16`) + 1 px `#4A3A2C` text-stroke equivalent (layered text-shadow) — readable from frame one (contrast ≥ 3:1 vs ground) |
| 0.3–1.6 | **The pour**: molten fill rises bottom-up through the glyphs with a bright heat-edge at the fill line | animate `background-position` of a two-stop stacked gradient (alloy above, `--forge-molten-vert` below, 8 px `#FFC24A` band at the boundary) from 100% → 0% |
| 1.6–2.2 | **Temper**: glow settles — molten fill cools into a chrome-amber finish with a soft breathing rim | crossfade to the settled gradient (`#F5EBDC → #FFC24A → #C87B3B` vertical); add `--glow-text` shadow easing to a 4 s breathing loop (±20% opacity) |
| 2.2 | **LABS** letterspaces in (tracking 0.6em → 0.42em + fade) | motion/react |
| 2.4 | **Tagline** fades up: "Sparking Curiosity, and Forging Skills with AI" | existing `SplitText`/`BlurText` bits, word-stagger, `text-sf-text-secondary`, Sora 18–20 px |
| 2.7 | CTA + scroll cue fade in | — |

- **Settled-state option:** trial `MetallicPaint` (already in `src/components/bits/`) for the LABS chrome finish before hand-rolling; adopt whichever reads better at the owner checkpoint.
- **Reduced-motion / no-JS:** render the t=2.7 end-state immediately (tempered wordmark, tagline, CTA — fully composed, zero animation). This is the same markup, not a fork.
- The breathing rim is the ONLY persistent animation after settle (≤ 0.25 Hz — flash-safe by two orders of magnitude).

### 10.4 The Molten Thread (`MoltenThread.tsx`) — hero → page transition

**Concept:** scrolling off the title, the falling light collects into a single molten seam that runs down the entire page; every section taps it. Hero → sections → CTA reads as one continuous circuit, previewing the app's `CircuitTraces` design language.

1. **Hero handoff (pin + scrub):** GSAP ScrollTrigger pins `HeroSection` for ~70vh of scroll. Scrub progress `p` drives, via the Lightfall imperative handle (§10.1.3): `speed: 0.5→0.1`, `density: 0.6→0.15`, `opacity: 1→0` (cyan streak fades first — reduce `colors` weighting by swapping to the 2-color warm set at p>0.4). Simultaneously the thread's head draws downward from behind the wordmark (SVG `stroke-dashoffset` scrubbed 0→drawn over the pin range). At p=1 the hero unpins; Lightfall sets `paused=true`.
2. **The thread:** one full-page-height SVG path (center-line, 3 px, `--forge-molten` gradient stroke via `<linearGradient>`, soft `filter: drop-shadow(0 0 6px rgba(255,140,26,0.5))`), absolutely positioned behind content (`z-index` between page background and section panels), `aria-hidden`, `pointer-events:none`. It meanders gently (±60 px bezier sway) so it reads as a seam, not a ruler.
3. **Section ignition contract:** each ScrollJourney act registers its entry with the thread (context or simple ref registry). When an act's panel crosses 60% viewport entry, ONE current pulse (the `CircuitTraces` pulse pattern: 40-unit bright dash traveling the thread segment, ~600 ms) runs from the previous tap-point to this act's tap-point, then the act's panel "ignites": bezel glow flares once (`glow=active` for 400 ms → ambient) as its content snaps in (`--forge-snap`). One pulse at a time globally (queue, drop if busy — restraint rule).
4. **Terminal:** the thread ends by flowing INTO the final CTA button ("Your Station Awaits" act) — the button's molten gradient visually continues the stroke; on click, the existing portal wipe (radial amber `clip-path: circle()` from the button, 500 ms) then routes.
5. **Reduced-motion:** no pin, no scrub, no pulses — thread renders fully drawn and static, sections appear without ignition. Page fully readable stacked.
6. **Mobile:** thread persists (it's one SVG — cheap) but the pin/scrub is shortened to 40vh and Lightfall may be poster-only per §10.1.3 measurement.

### 10.5 ScrollJourney reconciliation (retheme, keep the engineering)

The existing `ScrollJourney.tsx` 5-act structure, lazy-loading with CLS-safe skeleton heights, IntersectionObserver fallback, and reduced-motion handling are all KEPT. Changes are thematic only:

| Act | Current | Forge retheme |
|---|---|---|
| 1 | Crystal Hero (R3F crystal) | REMOVED — the hero viewport (§10.2–10.3) is Act 1; delete the crystal scene mount |
| 2 | Lab Discovery Ring (11 hex tiles) | Keep structure; tiles become `ForgePanel alloy` crucible chips with lab colors + `ForgeDial` accents; ignition via thread (§10.4.3) |
| 3 | Feature Showcase (4 holo cards) | Keep; cards → `ForgePanel glass` with `HoloChip` labels |
| 4 | Station Preview | Re-shoot: static forge-dashboard screenshot (F4 workbench) + CSS glow + existing counters |
| 5 | CTA "Your Station Awaits" | Keep copy; CTA becomes the thread terminal (§10.4.4) |

The micro-game section (currently between hero and journey in `page.tsx`) is replaced per §10.6.

### 10.6 Hero micro-demo — ⚠ DECISION PENDING (owner choosing the featured game)

The current "Teach Sparky to Sort" `LandingMicroGame` is retired (it also stars the removed mascot). Its replacement must obey the micro-demo architecture contract regardless of which game is chosen: **pure DOM/SVG, self-contained, zero stores/auth, zero new deps, ~25 s, playable, ends in a "you just did AI" payoff + signup CTA**. Full games are NEVER embedded on the landing page.

**Spec'd default — "Light the Network" (`NetworkMicroDemo.tsx`), distilled from Neural Builder:**
- 3-layer SVG network: 3 input feature nodes (👂 pointy ears · 🐟 likes fish · 🧶 chases yarn) → 2 hidden → 1 output ("It's a CAT!").
- **Round 1 — Wire it:** tap connections to link the layers; each connection draws in (stroke-dash). A valid input→output path fires a signal pulse (amber dash-pulse, the app's current-flow language) and the output node ignites (SparkBurst ≤ 12).
- **Round 2 — Weight it:** a mis-weighted preset classifies a 🐶 as a cat; child taps a connection to strengthen/weaken (3 visible thickness states), re-fires, gets it right — real weight intuition in two taps.
- **Round 3 — Fire it:** new animal's features light up, full cascade animation, correct classification. Payoff: "**You just built a neural network.**" → CTA "Forge the real thing — Neural Builder is waiting inside" (→ signup).
- A11y: every node/connection is a focusable SVG element with labels; pulses decorative; reduced-motion = instant connection states + static result, still fully playable.
- If the owner selects a different game, re-derive a micro-demo under the same contract and log the decision here.

### 10.7 Housekeeping (superseded-artifact policy)

On F6 ship: `git mv` `HeroHologram.tsx` and `LandingMicroGame.tsx` to `src/components/landing/_SUPERSEDED/` with the standard `SUPERSEDED_BY.md` manifest (per CLAUDE.md §3.2; `CrystalShatter` precedent). `AuroraGalaxy` comes off the hero but REMAINS in `src/components/bits/` (used elsewhere / future use). `BrandHero3D`/crystal-scene mounts referenced by ScrollJourney Act 1 are unmounted (archive only if nothing else imports them — verify first).

### 10.8 Acceptance (F6)

- LCP < 2.5 s with canvas enabled (h1 wordmark is LCP — verify in trace); CLS = 0 through hero + full scroll.
- Page fully readable & navigable with JS disabled (poster + end-state wordmark + stacked sections).
- SEO: h1 + tagline + section copy in initial HTML (`curl` check).
- 60 fps desktop during scrub (DevTools trace over the pin range); Lightfall paused when off-screen (verify via `performance` timeline — zero rAF activity past the hero).
- Reduced-motion e2e: hero end-state + static thread + stacked sections, micro-demo playable.
- Mouse-interaction verified desktop; touch scroll unimpeded (canvas has `pointer-events:none` — mouse tracking via window listener, never intercepting).
- `FORGE_HERO=false` restores the current landing page exactly.
- Snapshots at 375/768/1440: hero settled state, mid-scrub, each act ignited, micro-demo rounds.
- HARD-STOP owner checkpoint: Lightfall tint, wordmark sequence, thread transition, micro-demo feel.

---

## PART 11 — PHASE F7: FORGESPARK — THE MASCOT (full spec)

### 11.1 Character bible

**Name:** ForgeSpark ("Spark" for short in UI copy).
**Species:** a small cyber-fox kit forged from liquid bronze and living circuitry.
**Silhouette:** compact and round-chested (kid-safe, huggable); oversized triangular ears (inner ear glows amber); big hexagonal-iris eyes (the emotional centerpiece, ~22% of face area); a plasma-flame tail that flickers like a candle (the "spark"); four stubby paws; visible curved panel seams along the body with thin amber circuit traces running through them (the "forge").
**Personality:** curious, encouraging, slightly mischievous. Celebrates loudly, never mocks. When the child struggles, ForgeSpark dims its glow and leans in — help is intimacy, not alarm.

**Canonical colors (bind to theme tokens where rendered as SVG):**

| Part | Color |
|---|---|
| Body panels | bronze `#C87B3B` → deep `#8A5426` (vertical gradient per panel) |
| Panel seams / circuit traces | molten amber `#FF8C1A`, glow `#FFC24A` |
| Belly + muzzle + ear tips | cream `#F5EBDC` |
| Eyes | iris spark-cyan `#35E0FF` on near-black sclera `#16100B`, white specular dot |
| Tail flame | core `#FFC24A` → mid `#FF8C1A` → tip `#FF3DA5` (the ONLY persistent magenta in the app — it marks the mascot as special) |
| Paw sparks | `#FFC24A` |

### 11.2 Drop-in contract (this is what makes F7 cheap)

The existing Sparky system is the integration surface. ForgeSpark REPLACES THE VISUAL, NOT THE API:

1. **`src/components/sparky/ForgeSparkCore.tsx`** — new hand-authored inline SVG component with the EXACT public API of `SparkyCore`:
   - `expression?: SparkyExpression` where `SparkyExpression = 'idle' | 'happy' | 'thinking' | 'speaking' | 'excited' | 'sleepy' | 'sad' | 'celebrating' | 'surprised'` (the existing union — do not change it),
   - `size?: 'sm' | 'md' | 'lg' | 'xl'` (same px mapping as SparkyCore),
   - plus whatever other props `SparkyCoreProps` currently declares (mirror them; read SparkyCore.tsx first).
2. **Switch point:** inside `SparkyCore.tsx` itself, at the top of the component: `if (FEATURE_FLAGS.FORGE_MASCOT) return <ForgeSparkCore {...props} />;`. Every existing consumer (`SparkyFloating`, `SparkyPresenter`, `SparkyStatic`, AITutor, onboarding, etc.) gets ForgeSpark automatically — zero call-site edits, one-line revert.
3. **Rive:** author `public/rive/forgespark.riv`. `SparkyRive.tsx` changes only its `RIV_SRC` constant: `const RIV_SRC = FEATURE_FLAGS.FORGE_MASCOT ? '/rive/forgespark.riv' : '/rive/sparky.riv';`. The state machine keeps the name **`SparkyMachine`** and the existing input contract (`comboTier` Number 0–3, `celebrate` Trigger, `encourage` Trigger, `thinking` Boolean) so the GameJuiceEngine binding is untouched. The procedural placeholder orb path in SparkyRive continues to cover the pre-asset window.

### 11.3 SVG build spec (`ForgeSparkCore.tsx`)

- `viewBox="0 0 240 240"`. Root `<svg role="img" aria-label={ariaFor(expression)}>` with per-expression labels ("ForgeSpark is celebrating!" etc.).
- Layer order (each a `<g id>`): `tail-flame` → `body` → `belly` → `head` → `ears` → `eyes` → `muzzle` → `seams` (circuit traces, `stroke="#FF8C1A"` 1.5 px, opacity 0.7) → `fx` (expression-specific particles).
- **Idle micro-motion (CSS within the component):** tail-flame wobble (2.8 s ease-in-out infinite, rotate ±6° from tail base), ear twitch every ~7 s (animation-delay trick), blink every 4–6 s (eyes scaleY 1→0.08→1, 140 ms). All disabled under `prefers-reduced-motion` (static open-eyed pose).
- **Expression table** (each expression = deltas on eyes/ears/tail/fx — implement as a config object like the existing `EXPRESSIONS`):

| Expression | Eyes | Ears | Tail flame | FX |
|---|---|---|---|---|
| idle | open, soft | neutral | small steady | — |
| happy | crescent up-curves | perked | +20% size | 2 spark dots by cheeks |
| thinking | look up-left, half-lids | one ear tilted | slow pulse | rotating gear glyph above head, amber |
| speaking | open, bright | perked | steady | 3 sound-arc strokes near muzzle |
| excited | wide, sparkle specular ×2 | fully perked | +40%, faster flicker | 4 spark dots orbiting |
| sleepy | 80% closed | drooped | ember-low (dim, small) | "z z" glyphs |
| sad | down-curved, small | flattened back | dim blue-shifted `#4FC6FF` small flame | single question-mark particle (help mode) |
| celebrating | closed-happy arcs | perked | +60% flame, magenta tip prominent | SparkBurst-style 8 sparks + tiny trophy glyph |
| surprised | perfect circles | straight up | momentary freeze then flick | "!" glyph |

### 11.4 Rive state-machine spec (`SparkyMachine` in `forgespark.riv`)

Artboard 512×512, transparent. States and transitions (author in Rive editor; this table is the authoring contract):

| State | Loop | Entered by |
|---|---|---|
| Idle | 3.2 s loop (breath, tail wobble, blink cycle) | default; `comboTier == 0` |
| Hype1/2/3 | escalating bounce + flame size | `comboTier` 1/2/3 (blend, 300 ms transitions) |
| Celebrate | 1.6 s one-shot (jump + spark burst + tail flare) → returns to current tier state | `celebrate` trigger |
| Encourage | 1.2 s one-shot (lean toward viewer, soft glow pulse, nod) → return | `encourage` trigger |
| Thinking | 2 s loop (gear rotate, eyes up, seam traces pulse) | `thinking == true` (any state); exits to tier state when false |

Constraints: ≤ 60 fps timeline, no full-artboard flashes, celebrate spark count ≤ 12, total file target < 250 KB.

### 11.5 Voice (copy strings for AITutor / celebration surfaces)

Add `src/config/forgeSparkVoice.ts` exporting arrays per context (pick randomly): `greeting` ("Fire's hot — what are we forging today?"), `win` ("CLANG! That one's a keeper!"), `bigWin` ("Three strikes, pure gold! ⚒️"), `miss` ("Cooled off? Heat it up and strike again."), `hint` ("Psst — check the pattern before you pour."), `idleNudge` ("The forge is humming…"). Kid-safe tone rules: never sarcasm about a wrong answer, never time pressure in encourage lines. Existing AITutor copy call-sites may optionally source from this file where they currently hardcode Sparky lines (grep `Sparky` in `src/components/ai-tutor/` and swap display name to "Spark" when `FORGE_MASCOT` is on).

### 11.6 Acceptance (F7)

`/dev/forge` demo page gains a mascot section rendering all 9 expressions at 4 sizes + the Rive placeholder path. All §0.2 gates. `FORGE_MASCOT=false` restores Sparky everywhere (verify AITutor + one game). SOFT NOTE (HS-8 pattern): until `forgespark.riv` is authored in the Rive editor, SparkyRive's placeholder orb renders in games — non-blocking, the SVG core covers all static/floating/presenter surfaces immediately.

---

## PART 12 — PHASE F8: CORE IGNITION (game #43 — full spec)

*"Race the data stream. Forge the prompt. Break the wall."*

### 12.1 Identity & registration

| Field | Value |
|---|---|
| id | 43 |
| name | Core Ignition |
| slug | `core-ignition` |
| lab | 9 (use `LAB_NAMES[9]` verbatim from `src/config/labColors.ts`) |
| tier | `'flagship'` |
| has3D | `false`, `component3D: null`, `triangleBudget: null`, `cameraPreset: null` |
| ageBands | `['A','B','C']` |
| icon | `'🔥'` |
| description | "Race a molten data stream and forge prompts in mid-run to break through the walls that stop weak prompts cold." |
| stage | `'F8'` |

Register in: `src/config/gameRegistry.ts` (entry above), `src/app/(dashboard)/arcade/[gameSlug]/game-loaders.ts` (`'core-ignition': () => import('@/components/games/CoreIgnitionGame')`), and gate arcade visibility with `FEATURE_FLAGS.GAME_CORE_IGNITION` (filter it from the registry-driven lists when false). Follow the store API mandated by CLAUDE.md (`startGame`, `updateScore`, `advanceRound`, `completeGame`) and the game architecture template (`Phase = 'welcome' | 'learn' | 'play' | 'complete'`, age band from `useChildStore`, ARIA on all interactives, 12–15 lab-colored particles, `game.completeGame()` on completion).

### 12.2 Files

```
src/components/games/CoreIgnitionGame.tsx        — phase orchestrator (template-compliant)
src/components/games/core-ignition/
  TrackScene.tsx        — the 2.5D running track (DOM/CSS/SVG)
  RunHud.tsx            — speed multiplier, mote counter, gate progress
  GateOverlay.tsx       — Overclock bullet-time prompt-forging modal
  PromptForge.tsx       — per-age-band prompt input (chips / template / free)
  scoring.ts            — deterministic rubric (pure functions + tests)
  content.ts            — obstacle & chip content (all bands)
src/types/coreIgnition.ts — shared types
```

### 12.3 Core loop (the design pivot: **bullet-time, not typing-under-pressure**)

The concept's "forge prompts in real-time while racing" is amended (owner-accepted review note): when the runner reaches a gate, the run enters **OVERCLOCK** — time dilates to a stop (track blurs and slows over 400 ms, amber vignette, hum), and the child forges the prompt with NO timer. Prompt quality determines break-through power and the speed multiplier when time resumes. Skill is *quality*, not typing speed — band A (age 7–9, slow typists) is never punished by the clock. The *feeling* of speed is preserved by the run segments between gates.

**Run structure:**
- Auto-runner on a 3-lane molten data-stream track; the avatar is ForgeSpark riding a spark-board.
- Player steers lanes: ← → keys / on-screen lane buttons / tap-on-lane (touch). Lane switching collects **data motes** (+1 pt each, cap 20/run) and dodges inert slag blocks (hitting slag costs 0 points — it only slows the visual multiplier; NO death, NO fail state).
- Gates by band: **A: 6 gates**, **B: 7**, **C: 8**. Run segments 8–12 s between gates. Total run 90–150 s.
- After the final gate: **Ignition Sprint** — 5 s of max-speed cosmetic glory into the finish portal → `complete` phase.

**Obstacle gates (the literacy content).** Each gate is a wall across all lanes with a named flaw; a good prompt must supply the missing ingredient:

| Gate | Flaw it embodies | A good prompt must include | Break animation |
|---|---|---|---|
| **Vague Fog** | request too fuzzy to act on | a specific task ("what exactly") | fog burns away |
| **Bias Wall** | one-sided/unfair framing | balanced/fair phrasing ("both/fairly/everyone") | wall cracks down the middle |
| **Context Canyon** | missing background info | context ("who it's for / what happened before") | a light-bridge assembles |
| **Hallucination Gap** | invites made-up facts | a grounding constraint ("only use…", "if unsure say so") | phantom bricks solidify |
| **Token Overload** | rambling, unfocused ask | concision (within length bound) | wall compacts into a cube and drops |

`content.ts` ships **≥ 6 scenarios per gate type per band** (≥ 90 total). Each scenario: `{ id, gateType, band, setup, goal, chipSet?, templateText?, exemplar, keywords: { required: string[][], banned: string[] } }`. Example (Bias Wall, band A): setup "Robo-judge is picking the best pet, but it only asked cat owners!", goal "Fix the question so it's fair", chips include `["ask everyone","ask all pet owners"]`, `["which pet","what pet is best"]`, `["and why","give a reason"]`, banned `["cats only","best cat"]`. Scenarios are randomized per run without repeats.

### 12.4 PromptForge — per-band input

| Band | Mechanic |
|---|---|
| **A (7–9)** | **Chip assembly**: 6 large chips shown (3 correct-slot, 3 distractors); child taps 3 chips into slots ROLE/TASK/FAIRNESS-or-DETAIL. Drag optional; tap-to-place is primary (motor-skill friendly). Chips read aloud on focus via `aria-label`; text ≥ 16 px. |
| **B (10–12)** | **Template fill**: sentence with 2 blanks (dropdown chip pickers, 4 options each) + one free modifier chip row. |
| **C (13–16)** | **Free forge**: textarea (min 8 / max 220 chars, live counter) + a collapsible "smith's guide" hint listing the gate's needed ingredient categories (not answers). |

### 12.5 Scoring (`scoring.ts` — deterministic, unit-tested, NO AI call in the core loop)

`scoreGate(input, scenario): { points: 0–10, feedback: string, ingredients: IngredientResult[] }`

- Band A: each correct chip in a correct slot = 3 pts, +1 if all three correct (perfect = 10). Distractor chosen → that slot scores 0 and feedback names the ingredient ("A fair question asks *everyone*!").
- Band B: each blank correct = 4, modifier apt = 2.
- Band C rubric (additive): contains ≥ 1 required-keyword group match per ingredient (case-insensitive, word-boundary): task +3, gate-specific ingredient +4, context/constraint +2; length within bounds +1; each banned vague word ("stuff", "things", "whatever", "something", "idk") −1 (floor 0). Cap 10.
- Feedback is ALWAYS constructive and names the ingredient, never just "wrong."
- Multiplier: gate score ≥ 8 → streak +1; two consecutive → **OVERCLOCK STREAK** (track visuals intensify, motes worth ×2 while it lasts); any gate < 5 resets it. Multiplier affects motes only — gate points are pure quality (keeps `maxScore` deterministic: `gates×10 + 20 motes` → normalize per CLAUDE.md 10-pts convention).
- Optional post-run flourish (flagged inside the game, default off): send the child's best band-C prompt to the existing ai-content pipeline for one praise sentence. Never blocks completion; 3 s timeout → skip.

### 12.6 TrackScene rendering (DOM/CSS 2.5D — zero canvas, per invariant 0.1.2)

- A `perspective: 900px` stage; the track is 3 lane strips (`transform: rotateX(55deg)`) whose molten center-lines scroll via `background-position` animation (GSAP ticker driving a CSS custom property `--track-scroll`; speed = f(multiplier)).
- Parallax: 3 background layers (far forge skyline SVG, mid conduit pipes SVG, near track) translating at 0.2×/0.5×/1× speed.
- Avatar: `ForgeSparkCore size="md"` on a board div; lane changes tween `translateX` 180 ms with 4° bank tilt. Motes: absolutely-positioned amber dots flowing toward the player (translate animation, pooled — max 8 live DOM nodes, recycled).
- Slag blocks: dark alloy divs, same pooling. Collision = interval check on lane + z-progress (state, not pixels).
- Overclock entry: `filter: saturate(1.2)` + scroll speed → 0 over 400 ms + vignette div fade-in; GateOverlay (a `ForgePanel glass` modal, focus-trapped) mounts.
- Break-through: gate-specific animation (table above), one SparkBurst (≤ 24), Tone.js clang, speed ramps to multiplier. Flash-safe: each break is a single ≤ 300 ms brightness event.
- **Reduced-motion mode (full alternative, not a degradation):** the track becomes a static illustrated map with a position marker that STEPS between nodes; gates present sequentially as cards (the game is effectively a beautifully-themed quiz). All scoring/content identical. This mode is also the keyboard-screen-reader golden path and is auto-selected by `prefers-reduced-motion`.
- Perf caps: ≤ 40 animated DOM nodes at any instant; single GSAP ticker; everything pauses on `visibilitychange`.

### 12.7 Phases (template-compliant)

- **welcome**: title card, ForgeSpark `excited`, "IGNITE" button, 12–15 lab-9-colored particles (per template).
- **learn**: 3 cards — (1) "Prompts are instructions you forge" (anatomy: role/task/detail), (2) "Walls stop weak prompts" (the 5 gate types with icons), (3) "Overclock = time stops while YOU think" (controls). Band-appropriate copy lengths.
- **play**: the run (§12.3–12.6). Pause = Chamber pause (shell-provided).
- **complete**: `game.completeGame()` with score/maxScore → the F3 Forge Complete ceremony fires via the shell. Post-card shows per-gate ingredient recap ("You forged: 3 fair questions, 2 grounded asks…") — this recap is the pedagogy payoff; do not skip it.

### 12.8 Acceptance (F8)

- Full welcome→complete cycle on all three bands (playwright e2e: band A chip path keyboard-only; band C free-text path).
- `scoring.ts` unit tests: ≥ 20 cases incl. banned-word floors, keyword boundaries, band A perfect/partial.
- Reduced-motion mode e2e: complete a run with `prefers-reduced-motion` emulated.
- All §0.2 gates; registry shows 43 entries; arcade lists Core Ignition only when `GAME_CORE_IGNITION` is on; flag-off hides it with zero trace.
- HARD-STOP owner checkpoint: playthrough on all bands.

---

## PART 13 — PERFORMANCE BUDGETS (system-wide, enforced per phase)

| Surface | Budget |
|---|---|
| Any dashboard route | LCP < 2.5 s (mid-tier, throttled), CLS ≈ 0, zero WebGL on critical path |
| Ambient cost ceiling per route | 1× CircuitTraces + 1× EmberField (≤ 14 nodes) + ≤ 1 pulse — nothing else persistent |
| Ceremony | ≤ 4.5 s, ≤ 24 particles/burst, canvas-confetti single burst only |
| Marketing hero canvas | ≤ 30 k tris + 1,200 points, Bloom only, absent on mobile, never LCP |
| Core Ignition | ≤ 40 animated DOM nodes, 60 fps desktop / 30 fps floor mobile |
| Bundle | New dependencies are PERMITTED when they bring a unique visual/design capability the existing stack can't match (per CLAUDE.md Tech Quality Mandate). Requirements: stable release channel, license verified, size + purpose logged in PROGRESS.md, and — for React Bits-style copy-paste components — vendor the source into `src/components/bits/` (established pattern) so we own and can modify it. `next build` first-load JS for dashboard routes must not grow > 10 KB per phase without a logged justification (marketing routes exempt). |
| Backdrop-filter caps | ≤ 6 simultaneous blurred panels per viewport (blur is compositor-expensive); nested blur forbidden |

---

## PART 14 — ACCESSIBILITY CONTRACT (system-wide)

1. **Contrast:** all text tokens AA on all forge surfaces (§2.2 table is pre-verified; new combos must pass the guard tests). Text never sits directly on ambience layers — always on a panel.
2. **High-contrast toggle:** the existing a11y toolbar's contrast mode maps to `data-contrast="high"` (§2.2 override block): glass goes near-opaque, glows off. Verify toolbar wiring in `src/components/accessibility/` and connect if not automatic.
3. **Reduced motion:** every animated primitive/phase has an explicit static branch (specified inline above). Automated check: a Playwright spec per phase runs with `reducedMotion: 'reduce'` emulation and asserts the surface renders and functions.
4. **Photosensitivity:** no element > 3 luminance flashes/second; no full-screen flashes ever (ceremony flash is blob-local; hero has none; Core Ignition breaks are single events). Code-review checklist item on every phase PR.
5. **Screen readers:** decorative layers `aria-hidden` + `pointer-events:none` (CircuitTraces, EmberField, SparkBurst, tail flames). All state (score, progress, gate feedback) is DOM text. `A11yAnnouncer` (existing) announces: gate results, ceremony XP, ring lab selection.
6. **Touch targets:** ≥ 44×44 px for all kid-facing controls (chips, lane buttons, orbs).

---

## PART 15 — TESTING & VERIFICATION MATRIX

| Suite | Additions |
|---|---|
| `tests/e2e/visual/` | snapshots: `/dev/forge` (F1), chamber ×3 widths (F2), ceremony card (F3), home ×3 (F4), ring + grid (F5), landing ×3 (F6), mascot expressions (F7), Core Ignition welcome/gate/complete (F8) |
| `tests/e2e/a11y-*.spec.ts` | keep green every phase; add ring listbox spec (F5), Core Ignition keyboard spec (F8) |
| `core-flow-smoke.spec.ts` | extend: find-and-start-a-game via forge dashboard AND ring (comprehension gate) |
| Unit | `scoring.test.ts` (F8), token-presence test asserting `forge-theme.css` defines every `--sf-*` key that `design-tokens.css` defines (guards against missed overrides) |
| Reduced-motion | one spec per phase (§14.3) |
| Flag matrix | one spec that boots the app with all forge flags false and asserts the light theme + current shell render (the permanent revert guarantee) |

---

## PART 16 — WHAT IS EXPLICITLY NOT IN THIS BUILD

(Decided in review; do not implement, do not partially implement.)

- ❌ iframes / postMessage / Web-Component wrappers / separate SPA shell
- ❌ "Cross-app portal / shared login / cross-app XP" section (this IS the platform)
- ❌ Holographic cursor / cursor data trails
- ❌ Drag-and-drop modular HUD
- ❌ Depth-of-field & chromatic-aberration postprocessing anywhere
- ❌ Scanlines/distortion on text or reading surfaces
- ❌ R3F orbit-controls lab navigation as the primary path (CSS ring + grid only; `FORGE_RING_3D` reserved for a future flag)
- ❌ Persistent canvas overlays above game viewports
- ❌ Edits to existing game components (F0–F7); Core Ignition adds files only
- ❌ "Forge Echoes" customizable AI companions — great future feature, separate design doc, not this build

---

## PART 17 — ROLLOUT & EXIT

1. Ship each phase dark (flags off in prod) → owner checkpoint → flip that phase's `NEXT_PUBLIC_*` flag in Vercel env → monitor Sentry perf transactions for 48 h → next phase.
2. Full-forge launch = all flags on. Rollback of anything, at any depth, is one env var.
3. After 30 days stable at full-forge: schedule a cleanup pass (remove light-theme dead branches ONLY with explicit owner approval — until then the light theme remains the permanent escape hatch).

*End of Concept 10 — Digital Forge Master Build Plan v1.0. Execute phases in order. When this document conflicts with CLAUDE.md safety/process rules, CLAUDE.md wins; when it conflicts with older concept docs (05/06/08) or the original Concept-10 prose, this document wins.*
