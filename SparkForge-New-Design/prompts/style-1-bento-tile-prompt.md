# v0 Prompt — Dashboard Bento Tile (Style 1: Current Cockpit, exact)

**Target:** v0.dev (primary) — also works in Lovable, Subframe.
**Attach:** `../design-specs/style-1-current-cockpit.json`
**Output target:** drop-in component for a Next.js 15 + React 19 + Tailwind 4 app at `src/components/dashboard/BentoLabTile.tsx`.

---

## Paste this into v0

Build a single React component called `BentoLabTile` for a Next.js 15 + Tailwind 4 + TypeScript dark-mode-only app called SparkForge — a gamified AI learning platform for kids ages 7–16. This tile is one cell of a bento grid on the dashboard. It represents one of 11 themed "Labs" the child can enter.

**Use the attached `style-1-current-cockpit.json` for ALL color, font, and spacing tokens. Do not invent values.** Reference it via tokens, not hex literals — assume the consumer app already exposes the OKLCH variables and font CSS vars (`--font-display`, `--font-body`, `--font-data`, `--neon-blue`, `--surface-card`, `--lab-color`, etc.).

### Aesthetic — "Frost-Prismatic Laboratory Cockpit"

Dark-mode only. Surface is `oklch(0.13 0.02 260)` deep navy. The tile evokes a backlit instrument panel on a futuristic spacecraft cockpit: a metallic chrome bezel framing a recessed glass screen, with a single LED rim line glowing in the lab's accent color.

### Layout

- 1×1 default; supports `size: '1x1' | '1x2' | '2x1' | '2x2'` prop (use `aspect-square` / column spans).
- Min height 120 px. Inner padding `var(--space-md)` (16px).
- Three stacked layers (this is the signature look — get it right):
  1. **Outer chrome bezel** — `border-radius: 16px`, `padding: 3px`, `background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.30) 100%)`, `box-shadow: 0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)`.
  2. **LED rim** — inside bezel, `border-radius: 13px`, `padding: 2px`, `background: linear-gradient(90deg, transparent 0%, var(--lab-color) 50%, transparent 100%)`, `opacity: 0.5`. This is what colors the tile.
  3. **Screen-inner** — `border-radius: 11px`, `background: var(--surface-card)` (`oklch(0.16 0.02 280)`), `box-shadow: inset 0 2px 6px rgba(0,0,0,0.4)`, content goes here.

### Tile content (top → bottom)

- **Lab number badge** top-left, font `var(--font-data)` (Orbitron), `text-2xs` (10px), `text-white/55`, prefixed `LAB ` (e.g. `LAB 03`).
- **Lab icon emoji** top-right, 24 px (use the lab's icon — passed as `icon` prop).
- **Lab name** centered vertically, font `var(--font-display)` (Exo 2), `font-semibold`, `text-base`, color `text-white/95`. Apply `.gradient-text-lab` (linear-gradient from `var(--lab-color)` to `color-mix(in srgb, var(--lab-color), white 30%)`, background-clip: text) on hover only.
- **Progress strip** bottom — 2px tall, full width, `background: linear-gradient(90deg, var(--lab-color) {progress}%, rgba(255,255,255,0.06) {progress}%)`. `progress: number /* 0-100 */` is a prop.
- **Games-completed count** bottom-right, font `var(--font-data)`, `text-2xs`, `text-white/55`, format `{n}/{total}`.

### Props

```ts
interface BentoLabTileProps {
  labId: number;            // 1–11
  name: string;
  icon: string;             // emoji
  labColorHex: string;      // e.g. '#0FB8FA' — used to set --lab-color inline
  progress: number;         // 0-100
  gamesCompleted: number;
  gamesTotal: number;
  size?: '1x1' | '1x2' | '2x1' | '2x2';
  onClick?: () => void;
  href?: string;            // if set, render <Link>; else <button>
}
```

Set `style={{ '--lab-color': labColorHex, '--lab-glow': `${labColorHex}33` /* ~20% alpha */ }}` on the outer wrapper so descendants pick it up via CSS var.

### Motion (use `motion/react` — already installed)

- **Idle:** subtle 4s breathing on the LED rim — `animate-subtle-glow` Tailwind utility (`subtle-glow` keyframe in tailwind.config.ts; `box-shadow` 0 0 8px → 0 0 20px). Already exists, reference by class.
- **Hover:** `whileHover={{ y: -6, scale: 1.01 }}` with `transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}`. Increase LED rim `opacity` to 0.9. Add outer `box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 20px var(--lab-glow)`.
- **Tap:** `whileTap={{ y: -2, scale: 1.0 }}`, `transition={{ duration: 0.1 }}`.
- **Focus-visible:** existing global focus ring picks it up (3px outline using `var(--lab-color)`). Do NOT override.
- **Reduced-motion:** wrap motion props in `useReducedMotion()` and disable y/scale transforms — keep glow only.

### Accessibility

- Render as `<motion.button type="button">` if `onClick`, or `<Link>` wrapped in a `motion.div` if `href`.
- `aria-label`: `"Enter Lab {labId}: {name}. {progress}% complete, {gamesCompleted} of {gamesTotal} games finished."`
- All interactive content reachable via Tab. `min-width: 44px; min-height: 44px` (covered by min-height).
- Respect `prefers-reduced-motion`.

### Curvature (subtle — apply at GRID level, not on individual tile)

Add a comment at the top of the file:

```ts
// CURVATURE: Apply `transform: perspective(1200px) rotateX(2deg); transform-style: preserve-3d`
// to the parent <BentoGrid> container, NOT this tile. Tiles inherit the bow naturally.
// CSS variable: --ui-curve: 2deg (overridable in Settings).
```

### Constraints

- Do NOT add `dark:` variants — dark-mode is the only mode (CLAUDE.md DES-rule).
- Do NOT introduce new colors. Every color must come from the spec or `var(--lab-color)`.
- Use Tailwind utilities where they exist (`animate-subtle-glow`, `text-2xs`, `font-display`, `font-data`, `bg-surface-card`); inline styles only for the dynamic `--lab-color`.
- TypeScript strict-mode-clean.
- Single file; no extra components extracted.

### Export

```ts
export default BentoLabTile;
export type { BentoLabTileProps };
```

---

## After v0 generates

1. Copy the file to `src/components/dashboard/BentoLabTile.tsx`.
2. Sanity-check: it should compile against existing `tailwind.config.ts` + `globals.css` without adding new keyframes (everything used here already exists in v6.5).
3. Wire it up in a test page at `app/_design/bento/page.tsx` rendering all 11 labs in a 4-col grid with `transform: perspective(1200px) rotateX(2deg)`.
4. Verify the chrome bezel's three layers render distinctly — if the LED rim looks like a flat solid color, the gradient is wrong.

## If v0 misses the mark

Common iteration prompts:

- "The chrome bezel is flat. The outer ring should look like brushed metal — three gradient stops, top brightest, middle mid-gray, bottom shadowed. Fix the bezel layer."
- "The LED rim is full brightness. It should be a horizontal gradient that fades to transparent at left and right edges, only bright in the middle 50%."
- "Hover scale is too aggressive (1.05). Reduce to 1.01 and lift y by -6px instead."
- "Add `prefers-reduced-motion` handling — currently the breathing animation runs even when disabled."
