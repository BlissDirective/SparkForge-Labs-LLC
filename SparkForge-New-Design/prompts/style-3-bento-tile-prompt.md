# v0 Prompt — Dashboard Bento Tile (Style 3: Apple × Cyberpunk Holographic)

**Target:** v0.dev (primary) — also strong fit for Lovable / motionsites.ai.
**Attach:** `../design-specs/style-3-cyberpunk-apple.json`
**Output target:** drop-in component for a Next.js 15 + React 19 + Tailwind 4 app at `src/components/dashboard/BentoLabTile.tsx`.

---

## Paste this into v0

Build a single React component called `BentoLabTile` for a Next.js 15 + Tailwind 4 + TypeScript app called SparkForge — a gamified AI learning platform for kids ages 7–16. This tile is one cell of a bento grid on the dashboard. It represents one of 11 themed "Labs" the child can enter.

**Use the attached `style-3-cyberpunk-apple.json` for ALL color, font, and spacing tokens. Do NOT reuse SparkForge's existing dark cockpit aesthetic — this is a clean-sheet redesign.**

### Aesthetic — "Apple home page meets cyberpunk holographic display module"

Imagine an Apple product page (huge breathing whitespace, single hero element per fold, monochrome typography, cinematic scroll reveals) crossed with a cyberpunk holographic HUD (teal/cyan rim glows, magenta/violet vortex behind hero, low-poly geometric accents, oil-slick iridescence on borders).

The tile is a holographic display module — a flat white card on light mode, or a translucent glass panel hovering over a magenta/teal vortex on dark mode — with a slowly rotating iridescent ring around its edge. No chrome bezel, no scanlines, no neon emissive shadow.

Reference vibe (NOT to be copied — vibe only): the user's two attached images show (1) a teal HUD orb on dark navy with thin glow lines, and (2) a magenta-violet vortex with a low-poly figure. We want that COLOR + LIGHTING energy applied to a clean card layout.

### Layout

- 1×1 default; supports `size: '1x1' | '1x2' | '2x1' | '2x2' | '3x2'` (last is hero size).
- Min height 160 px (more breathing room than style-1/2).
- Inner padding `var(--space-md)` = 24 px (8 px grid, doubled from style-1).
- **Single rounded card. NO three-layer bezel.** Border-radius: 24 px outer, 20 px inner if needed.
- Two visual modes via prop `theme: 'light' | 'dark'` (defaults via `prefers-color-scheme`):
  - **Light mode card:** `background: #FFFFFF`, `border: 1px solid rgba(11,15,30,0.08)`, `box-shadow: 0 16px 48px -12px rgba(11,15,30,0.18), 0 0 0 1px rgba(11,15,30,0.04)`. Apple-product-card-clean.
  - **Dark mode card:** `background: linear-gradient(145deg, rgba(31,227,214,0.06) 0%, rgba(178,44,255,0.04) 100%)`, `backdrop-filter: blur(28px) saturate(180%)`, `border: 1px solid rgba(159,255,246,0.18)`, `box-shadow: 0 24px 60px -16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(159,255,246,0.18)`.

### The signature: holographic edge ring (replaces chrome bezel)

A thin (1 px) animated conic-gradient border that slowly rotates around the card. This is the signal motif — get it right.

```css
.holo-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    #1FE3D6 0%,    /* teal */
    #7A2DE0 25%,   /* violet */
    #B22CFF 50%,   /* magenta */
    #FF4FC8 75%,   /* hot pink */
    #1FE3D6 100%   /* teal close */
  );
  animation: iridescent-spin 8s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
@keyframes iridescent-spin { to { transform: rotate(360deg); } }
```

This uses the same mask-trick as the existing `.glass-card-v2::before` — only the 1 px ring is visible.

### Tile content (Apple-product-card layout)

Single column, generous spacing. NO Orbitron / data-font noise.

- **Lab icon emoji** top-left, 32 px (larger than style-1/2).
- **Lab name** below icon — `Inter Display` (or SF Pro Display fallback), `font-weight: 700`, `font-size: 1.25rem` (20 px), tracking `-0.02em`, color `#0B0F1E` light / `#F0F4FF` dark.
- **Lab number** beside name as a small pill: `Inter`, 11 px, weight 500, format `LAB 03`, color `rgba(11,15,30,0.55)` light / `rgba(240,244,255,0.55)` dark, padding `2px 8px`, border-radius `9999px`, background `rgba(11,15,30,0.04)` light / `rgba(255,255,255,0.06)` dark.
- **One-line description** (passed as `description` prop, optional) — Inter, 14 px, weight 400, `rgba(11,15,30,0.62)` light / `rgba(240,244,255,0.72)` dark.
- **Spacer** (auto, `mt-auto` — content flushes to top, footer to bottom).
- **Progress** bottom-left — small inline, format `{progress}%`, Inter 13 px weight 600, color `var(--lab-color)`. NO progress bar — Apple-style minimal.
- **Games count** bottom-right — Inter 13 px weight 500, format `{n}/{total} games`, muted secondary color.

### Hero variant (when `size === '3x2'`)

- Add a **vortex glow** behind the content: absolutely-positioned `<div>` with
  `background: radial-gradient(circle at 70% 30%, rgba(178,44,255,0.45) 0%, transparent 55%), radial-gradient(circle at 25% 75%, rgba(31,227,214,0.30) 0%, transparent 60%);`
  `filter: blur(40px); opacity: 0.5;`
- Add a **low-poly triangle mesh accent** in the corner: inline SVG, 96×96 px, triangles with `stroke="rgba(31,227,214,0.30)" stroke-width="0.5" fill="rgba(178,44,255,0.04)"`. ~12 triangles in a Delaunay-ish layout (you can hand-author the SVG path).
- Larger lab name: 32 px, weight 700, with `iridescent-text` class (background-clip on the same conic gradient as the holo-ring, animated 8s).

### Props

```ts
interface BentoLabTileProps {
  labId: number;            // 1–11
  name: string;
  icon: string;             // emoji
  description?: string;     // optional one-liner
  labColorHex: string;      // e.g. '#1FE3D6' (style-3 lab palette)
  progress: number;         // 0-100
  gamesCompleted: number;
  gamesTotal: number;
  size?: '1x1' | '1x2' | '2x1' | '2x2' | '3x2';
  theme?: 'light' | 'dark';  // defaults to system
  onClick?: () => void;
  href?: string;
}
```

Set `style={{ '--lab-color': labColorHex }}` on the wrapper.

### Motion (use `motion/react`)

- **Idle:**
  - Holo-ring rotates continuously (8 s linear infinite via CSS — no JS).
  - Subtle "breath": `animate={{ scale: [1, 1.005, 1] }}` over 4 s, ease-in-out, infinite.
- **Hover:**
  - `whileHover={{ y: -4, scale: 1.02 }}`, `transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}`.
  - Box-shadow intensifies: `0 28px 64px -20px rgba(11,15,30,0.22), 0 0 0 1px rgba(31,227,214,0.30)`.
  - Holo-ring opacity 0.7 → 1.0.
  - **Magnetic pull:** track pointer position over the tile, translate the card up to ±4 px toward cursor (CSS variable + JS rAF, debounced). Skip on touch devices (`@media (pointer: coarse)`).
  - **Parallax tilt:** rotate-x ±3 deg, rotate-y ±3 deg based on cursor distance from center. Same pointer tracker, single rAF.
- **Tap:** `whileTap={{ scale: 0.98 }}`, 120 ms.
- **Scroll-reveal entrance:** `initial={{ opacity: 0, y: 24 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true, margin: '-10%' }}`, `transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}`. Stagger by `index * 60 ms` if grid passes index.
- **Reduced-motion:** holo-ring static at 220 deg (no rotation), magnetic + tilt + breath disabled, scroll-reveal collapsed to instant fade.

### Curvature (apply at GRID level)

Stronger than style-1/2 — this is a holographic display module.

```ts
// CURVATURE: Apply to the parent <BentoGrid>:
//   transform: perspective(1400px) rotateX(3deg);
//   transform-style: preserve-3d;
// CSS variable: --ui-curve: 3deg.
// Disable on prefers-reduced-motion AND on @media (pointer: coarse) (touch).
```

### Accessibility

- `<motion.button>` or `<Link>` wrapped, as before.
- `aria-label`: `"Enter Lab {labId}: {name}. {progress}% complete, {gamesCompleted} of {gamesTotal} games finished."`
- Focus ring: `outline: 3px solid #1FE3D6; outline-offset: 2px; box-shadow: 0 0 0 6px rgba(31,227,214,0.30);`
- WCAG AA verified: `#0B0F1E` on `#F7FAFD` = 17:1; `#F0F4FF` on `#0B0F1E` = 16:1. Both modes pass.
- `min-width: 44px; min-height: 44px` (covered).
- Reduced-motion handling above.

### Constraints

- Use `Inter` font — assume the consumer wires it via next/font/google. Specify font stack as fallback.
- `Orbitron` ONLY appears in optional data-overlays (lab number pill could optionally use it via prop) — default to Inter.
- No dark gradient surface variables from the existing app — this is a clean theme.
- Single file output. No icon library imports — use the emoji prop.
- TypeScript strict.

### Export

```ts
export default BentoLabTile;
export type { BentoLabTileProps };
```

### Bonus (request if v0 has space)

Generate a sibling `<BentoGrid>` component that:
- Wraps children in a `perspective(1400px) rotateX(3deg)` container.
- Applies the dark-mode vortex page background:
  ```css
  background:
    radial-gradient(circle 70vw at 65% 35%, rgba(178,44,255,0.45), transparent 55%),
    radial-gradient(circle 60vw at 25% 75%, rgba(31,227,214,0.30), transparent 60%),
    linear-gradient(180deg, #0B0F1E 0%, #050714 100%);
  ```
- Applies the light-mode soft background:
  ```css
  background:
    radial-gradient(circle 60vw at 70% 30%, rgba(178,44,255,0.18), transparent 50%),
    radial-gradient(circle 50vw at 20% 70%, rgba(31,227,214,0.20), transparent 55%),
    linear-gradient(180deg, #F7FAFD 0%, #E8F4FF 100%);
  ```
- Switches based on `theme` prop or system preference.

---

## After v0 generates

1. Copy to `src/components/dashboard/BentoLabTile.tsx` + `BentoGrid.tsx`.
2. **The signature visual is the rotating iridescent ring.** If it's not animating, or if it appears as a solid (non-rotating) gradient border, the conic-gradient is wrong. Iterate until the rainbow visibly rotates over 8 s.
3. Test BOTH theme modes — the dark vortex hero is the more dramatic look; light mode should feel like an Apple product page.
4. Test the magnetic-hover + parallax-tilt with a mouse on desktop. Should feel "weighty" and slow, not jitter. If it jitters, smoothing factor is too low — increase rAF lerp.
5. Visit a test page at `app/_design/bento-cyberpunk/page.tsx` rendering all 11 labs (use the spec's lab palette — `#1FE3D6`, `#7A8DFF`, `#FF4FC8`, etc.) in a 4-col grid with one `3x2` hero tile.

## If v0 misses the mark

- "The holo-ring is solid color, not iridescent. Use a conic-gradient with FOUR color stops (teal → violet → magenta → pink → teal close), not a linear-gradient."
- "The card has a chrome bezel — remove it. This style uses a SINGLE rounded card with a 1 px iridescent ring; no three-layer bezel."
- "The card looks too dense — Apple-product-card means LOTS of breathing room. Increase padding from 16 px to 24 px and bump the min-height to 160 px."
- "The font is wrong — use Inter (or Inter Display for the lab name). Currently it's still using the SparkForge Exo 2 / Orbitron — that's the OLD style."
- "The hero variant is missing the vortex glow behind the content. Add the radial-gradient overlay with `filter: blur(40px); opacity: 0.5;`."
- "Magnetic hover is jittery — increase the lerp smoothing factor from 0.3 to 0.15."
