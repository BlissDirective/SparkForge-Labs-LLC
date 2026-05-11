# v0 Prompt — Dashboard Bento Tile (Style 2: Brighter Cockpit)

**Target:** v0.dev (primary) — also works in Lovable, Subframe.
**Attach:** `../design-specs/style-2-brighter-cockpit.json`
**Output target:** drop-in component for a Next.js 15 + React 19 + Tailwind 4 app at `src/components/dashboard/BentoLabTile.tsx`.

---

## Paste this into v0

Build a single React component called `BentoLabTile` for a Next.js 15 + Tailwind 4 + TypeScript app called SparkForge — a gamified AI learning platform for kids ages 7–16. This tile is one cell of a bento grid on the dashboard. It represents one of 11 themed "Labs" the child can enter.

**Use the attached `style-2-brighter-cockpit.json` for ALL color, font, and spacing tokens.**

This is the BRIGHTER variant of the SparkForge cockpit. Key differences from the dark-mode original:

- **No dark mode.** App body must NOT set `color-scheme: dark`.
- **Background is a turquoise → dark-magenta diagonal gradient** instead of deep navy.
- **Lab/neon accents are brighter** (OKLCH L lifted to 0.82 from 0.75) so they read crisply against the lighter haze.
- **Chrome bezels are SHINIER** — top specular highlight is much brighter (rgba 0.42 vs 0.18), and a `chrome-shimmer` animation runs ambiently on every bezel (not opt-in like in style-1).

### Aesthetic — "Bright Cockpit, High-Shine Chrome"

The mood: a futuristic instrument panel made of polished aluminum, photographed in golden-hour light. Surface behind the panels is a soft turquoise-to-magenta gradient (think aurora over a sunset). The chrome bezels reflect that environment — specular highlights are intense at the top edge.

### Page-level background (apply to dashboard wrapper, not the tile)

```css
background:
  radial-gradient(ellipse 80% 60% at 25% 30%, oklch(0.78 0.16 195) 0%, transparent 55%),  /* turquoise */
  radial-gradient(ellipse 70% 70% at 78% 78%, oklch(0.42 0.20 340) 0%, transparent 60%),  /* dark magenta */
  linear-gradient(135deg, oklch(0.66 0.14 200) 0%, oklch(0.34 0.14 330) 100%);
```

Include this as a `<DashboardBackground />` sibling component too, so the prompt produces both.

### Layout

- 1×1 default; supports `size: '1x1' | '1x2' | '2x1' | '2x2'`. Min height 120 px. Padding `var(--space-md)` (16 px).
- **Three-layer chrome bezel** (this is the signature — get it right):
  1. **Outer chrome bezel** — `border-radius: 16px`, `padding: 3px`,
     `background: linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.38) 100%)`,
     `box-shadow: 0 1px 0 rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 0.5px rgba(255,255,255,0.10)`.
     The brighter top stop + hairline outer keyline = polished aluminum vs the brushed-titanium of style-1.
  2. **Animated shimmer overlay** — sits over the bezel only.
     `background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%); background-size: 200% 100%;`
     Uses Tailwind's existing `animate-chrome-shimmer` (3s linear infinite). Mask to bezel ring only via padding-box clip so the inner screen stays clean.
  3. **LED rim** — `border-radius: 13px`, `padding: 2px`, `background: linear-gradient(90deg, transparent 0%, var(--lab-color) 50%, transparent 100%)`, `opacity: 0.65` (slightly brighter than style-1 for the lighter context).
  4. **Screen-inner** — `border-radius: 11px`, semi-glass:
     `background: linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)`,
     `backdrop-filter: blur(14px) saturate(170%) brightness(1.05)`,
     `border: 1px solid rgba(255,255,255,0.28)`,
     `box-shadow: inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 40px rgba(0,0,0,0.18)`.
     Note: this is GLASS now — content sits on a translucent panel that picks up the colored backdrop.

### Tile content (top → bottom)

- **Lab number badge** top-left, font Orbitron, 10 px, `text-white` with `text-shadow: 0 1px 2px rgba(0,0,0,0.35)` for legibility on translucent glass. Format `LAB 03`.
- **Lab icon emoji** top-right, 24 px, with `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4))`.
- **Lab name** centered, font Exo 2, semibold, 16 px, color `text-white` with subtle drop shadow. On hover, apply `gradient-text-lab` (`linear-gradient(135deg, var(--lab-color), color-mix(in srgb, var(--lab-color), white 30%))`, background-clip: text).
- **Progress strip** bottom — 2 px tall, `background: linear-gradient(90deg, var(--lab-color) {progress}%, rgba(255,255,255,0.20) {progress}%)`. Note: track uses higher alpha (0.20 vs 0.06) for visibility against the lighter glass.
- **Games-completed count** bottom-right, Orbitron 10 px, white with shadow, format `{n}/{total}`.

### Props

```ts
interface BentoLabTileProps {
  labId: number;            // 1–11
  name: string;
  icon: string;             // emoji
  labColorHex: string;      // e.g. '#0FB8FA'
  progress: number;         // 0-100
  gamesCompleted: number;
  gamesTotal: number;
  size?: '1x1' | '1x2' | '2x1' | '2x2';
  onClick?: () => void;
  href?: string;
}
```

Set `style={{ '--lab-color': labColorHex, '--lab-glow': `${labColorHex}55` /* ~33% alpha — pumped vs style-1 */ }}` on the outer wrapper.

### Motion (use `motion/react`)

- **Idle (always-on, this is the "more shine" directive):**
  - Chrome shimmer animation runs at all times on the bezel layer (3s linear infinite). Don't gate on hover.
  - LED rim has subtle 4s breathing glow.
- **Hover:** `whileHover={{ y: -6, scale: 1.015 }}`, `transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}`. LED rim opacity → 1.0. Outer `box-shadow: 0 16px 50px rgba(0,0,0,0.25), 0 0 28px var(--lab-glow)`. Chrome shimmer speeds up to 1.5s.
- **Tap:** `whileTap={{ y: -2, scale: 1.0 }}`, `duration: 0.1`.
- **Focus-visible:** global ring (3 px solid `var(--lab-color)`).
- **Reduced-motion:** disable y/scale transforms AND chrome-shimmer (use `useReducedMotion()` to set `animation: none` on shimmer overlay).

### Accessibility

- `<motion.button>` if onClick, `<Link>` wrapped in motion if href.
- `aria-label`: `"Enter Lab {labId}: {name}. {progress}% complete, {gamesCompleted} of {gamesTotal} games finished."`
- **Critical:** verify text WCAG AA contrast on BOTH the turquoise edge (lighter) AND the magenta edge (mid-tone) of the gradient backdrop. The chrome bezel + glass panel must provide enough local contrast that white text on translucent glass clears 4.5:1 against any backdrop position. If borderline, increase glass background alpha from 0.22 → 0.32.
- `min-width: 44px; min-height: 44px`.
- Respect `prefers-reduced-motion`.

### Curvature (subtle — apply at GRID level)

Comment at top:

```ts
// CURVATURE: Apply `transform: perspective(1200px) rotateX(2deg); transform-style: preserve-3d`
// to the parent <BentoGrid> container. Tiles inherit the bow.
```

### Constraints

- Do NOT use any dark-mode utilities (`dark:*`).
- All colors come from the spec or `var(--lab-color)`.
- Tailwind utilities preferred where they exist (`animate-chrome-shimmer`, `animate-subtle-glow`, `font-display`, `font-data`).
- TypeScript strict.
- Emit `<DashboardBackground />` as a second small component in the same file (or a sibling file).

### Export

```ts
export default BentoLabTile;
export { DashboardBackground };
export type { BentoLabTileProps };
```

---

## After v0 generates

1. Copy to `src/components/dashboard/BentoLabTile.tsx` + `DashboardBackground.tsx`.
2. **Critical visual check:** the chrome shimmer should be VISIBLE without hover. If you can't see the highlight sweep across the bezel ambiently, the mask is wrong or the gradient stops are too subtle — tell v0 to bump the highlight alpha from 0.30 to 0.45.
3. Test contrast with a color picker: white text on the magenta-corner backdrop should still hit 4.5:1 (the glass panel handles this; if it doesn't, glass alpha is too low).
4. Visit a test page at `app/_design/bento-bright/page.tsx` rendering all 11 labs in a 4-col grid with `transform: perspective(1200px) rotateX(2deg)` on the wrapper.

## If v0 misses the mark

- "The background is too dark — it looks navy. The base gradient should be turquoise (cyan-green) at top-left transitioning to a desaturated dark magenta at bottom-right. No deep navy."
- "Chrome shimmer is only running on hover. Move it to the idle state — it should sweep across the bezel ambiently every 3 seconds."
- "Lab name text is hard to read on the lighter backdrop. Bump the screen-inner glass background alpha from 0.22 to 0.32 OR add a 1px text-shadow."
- "The bezel doesn't look shiny enough — the top stop should be rgba(255,255,255,0.42), not 0.18. Also add the hairline outer keyline `0 0 0 0.5px rgba(255,255,255,0.10)` to box-shadow."
