# v0 Prompt — Holographic Lab Map (Style 1: Current Cockpit)

**Target:** v0.dev.
**Attach:** `../design-specs/style-1-current-cockpit.json`
**Output target:** `<HolographicLabMap />` component for `src/components/home/HolographicLabMap.tsx`. Fills the center viewport background slot of `HomeShell`.

---

## Paste this into v0

Build a `HolographicLabMap` React component for SparkForge — a 2D HTML/CSS reinterpretation of the existing 3D holographic lab map. Used as the background layer of the dashboard mission viewport.

11 themed AI labs are arranged in **two concentric rings** (a foundation outer ring and an advanced inner ring) with adjacency lines connecting related labs. The whole thing breathes and pulses subtly to feel alive.

Use the attached `style-1-current-cockpit.json` for ALL color and font tokens. Lab colors come from `palette.labs`.

### Geometry (from spec `architecture.labMap`)

- **Outer ring** — labs 1–6, radius `18vw`, 60° apart, starting at `-90deg` (top-12-o-clock).
- **Inner ring** — labs 7–11, radius `11vw`, 72° apart, starting at `-90deg`.
- Both rings concentric on the same center point.
- The map fills the center viewport zone — positioned `absolute inset-0`, center is the viewport's center.

### Lab nodes

Each lab is a 64 px circular hex-emblem button:

```
┌─ outer chrome ring (3 px, conic gradient, lab-color tinted) ─┐
│  ┌─ inner glass disk (56 px, surface-card with backdrop-blur) ─┐  │
│  │   <span> emoji (24 px) — lab.icon                         │  │
│  │   <span> "LAB {n}" (Orbitron 9 px, white/55, below emoji) │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

Position each lab via CSS custom properties driven by inline `style`:

```jsx
<button
  className="lab-node"
  style={{
    '--lab-color': lab.hex,
    '--ring': lab.ring === 'outer' ? '18vw' : '11vw',
    '--angle': `${angleDeg}deg`,
  } as React.CSSProperties}
>...</button>
```

CSS:

```css
.lab-node {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--ring))) rotate(calc(-1 * var(--angle)));
}
```

(The double-rotate trick keeps the emoji upright while positioning around the circle.)

### Adjacency edges (connections between labs)

Draw as inline SVG `<svg className="adjacency-layer" />` covering the whole component, behind the nodes (z-index 0 vs nodes z-index 10).

**Connection set (from spec `architecture.labMap.adjacency`):**

- **Outer loop:** 1↔2, 2↔3, 3↔4, 4↔5, 5↔6, 6↔1
- **Inner loop:** 7↔8, 8↔9, 9↔10, 10↔11, 11↔7
- **Cross beams:** 1↔7, 2↔8, 3↔9, 4↔10, 5↔11
- **Special overlay:** Lab 6 (Ethics) has soft halo + dashed lines to ALL other labs (low opacity, decorative)

Each edge is a `<line>` from one lab's screen-position to the other's. Compute positions in JS:

```ts
const labPos = (lab: Lab) => {
  const r = lab.ring === 'outer' ? OUTER_R : INNER_R; // px or vw → px at runtime
  const a = ((lab.ring === 'outer' ? -90 + (lab.id - 1) * 60 : -90 + (lab.id - 7) * 72) * Math.PI) / 180;
  return [centerX + Math.cos(a) * r, centerY + Math.sin(a) * r];
};
```

Use a `ResizeObserver` on the wrapper to recompute on resize.

**Edge styling:**

- Stroke: gradient lab-color → adjacent-lab-color, 1 px.
- Animated dash: `stroke-dasharray: 4 4; animation: connection-pulse 4s ease-in-out infinite alternate;` (uses existing keyframe).
- Idle opacity: 0.35. On node hover: connected edges scale to 0.9 opacity.

### Center indicator

Tiny pulsing dot at the geometric center: 8 px circle, lab-color, opacity 0.6, `subtle-glow 4s`.

### Interaction

- **Click lab node** → call `onLabClick(labId)` prop. Visual: node scales 1.12, ring brightens, neighbors highlight 800 ms.
- **Hover lab node** → scale 1.06, emissive ring 60%, anchor-positioned tooltip (CSS Anchor Positioning):

```css
.lab-tooltip { position-anchor: --node-{id}; top: anchor(bottom); left: anchor(center); transform: translate(-50%, 8px); }
```

  Tooltip card: glass-card-v2 small, `font-body` 13 px, shows `{lab.name}`, lab progress bar (0-100%), and `→ Enter Lab` chip.
- **Double-click lab node** → call `onLabEnter(labId)` (uses View Transitions API in parent).
- **Keyboard:** `Tab` cycles labs in adjacency order (outer 1→6, then inner 7→11). Arrow keys navigate via adjacency graph. `Enter` focuses; `Space` enters.

### Locked labs

If `lab.locked === true`:
- Node desaturated 60%.
- Padlock icon overlays the emoji (10 px, white/70, top-right corner of the disk).
- Hover/click disabled — instead show tooltip "Complete Lab N to unlock".
- Edges from this node desaturated to 30% opacity.

### Data shape

```ts
interface LabNode {
  id: number;          // 1-11
  name: string;
  icon: string;        // emoji
  hex: string;         // lab color
  ring: 'outer' | 'inner';
  progress: number;    // 0-100
  locked: boolean;
}

interface HolographicLabMapProps {
  labs: LabNode[];
  focusedLabId: number | null;
  onLabClick: (id: number) => void;
  onLabEnter: (id: number) => void;
  onLabHover?: (id: number | null) => void;
}
```

### Motion (use `motion/react` for nodes, CSS for edges)

- **Initial entry:** edges fade in over 800 ms; nodes scale 0.8→1.0 with stagger of 60 ms (outer first, inner second).
- **Idle:** nodes breath subtle 4 s (existing `subtle-glow` keyframe). Center dot pulses.
- **Hover:** node scales 1.06 in 250 ms, ring brightens, tooltip fades in 150 ms.
- **Focus state:** focused lab scales 1.12, ring rotates a conic-gradient overlay 4 s.
- **Reduced motion:** all motion → instant transitions; adjacency edges static (no dash animation); ring rotation off.

### Accessibility

- Wrapper: `<div role="navigation" aria-label="Lab map — 11 themed AI labs in two concentric rings" />`.
- Each node is a `<button>` with `aria-label="Lab {id}: {name}. {progress}% complete. {ringDescription}. Connected to labs {adjacencies}. {locked ? 'Locked.' : ''}"`.
- Keyboard navigation announced via `aria-current` on focused node.
- High-contrast mode: edges darken to white/40, nodes get visible borders.
- Reduced-motion handling above.

### Constraints

- Pure HTML/CSS — no canvas, no R3F, no SVG complexity beyond inline `<svg>` for edges.
- TypeScript strict.
- Single file `src/components/home/HolographicLabMap.tsx`.
- Imports lab data from props, not from `@/config/labColors` (consumer wires it).

### Export

```ts
export default HolographicLabMap;
export type { HolographicLabMapProps, LabNode };
```

---

## After v0 generates

1. Verify the 11 labs are arranged correctly: 6 in outer ring at 60° steps, 5 in inner ring at 72° steps, both rings concentric.
2. Verify the 17 adjacency edges render (6 outer loop + 5 inner loop + 5 cross beams + Lab 6 dashed-to-all).
3. Hover a lab — tooltip should appear anchored to the node, not at a fixed position.
4. Tab through nodes — focus order should follow ring sequence.
5. Drop into `<MissionViewport>` slot in `HomeShell`.

## If v0 misses the mark

- "Labs are in a single ring of 11 — fix to TWO concentric rings: 6 outer + 5 inner. Outer at 18vw radius / 60° steps; inner at 11vw radius / 72° steps."
- "Adjacency edges aren't drawing — make sure the SVG layer covers the whole map and edges use absolute pixel coordinates computed from lab positions."
- "Tooltip positions wrong — use CSS Anchor Positioning (`position-anchor` + `top: anchor(bottom)`) instead of fixed offset."
- "Lab 6's special 'connects to all' visualization is missing — add dashed low-opacity lines from Lab 6 to every other lab."
