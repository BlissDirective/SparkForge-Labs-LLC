# v0 Prompt — Lab Constellation (Style 2: Brighter Lab Atrium)

**Target:** v0.dev.
**Attach:** `../design-specs/style-2-brighter-cockpit.json`
**Output target:** `<LabConstellation />` for `src/components/home/LabConstellation.tsx`. Background of `<MainStage>` in style-2 home shell.

---

## Paste this into v0

Build the SparkForge `LabConstellation` — the lab map for the Lab Atrium aesthetic. Same concentric 6+5 ring topology as style-1, but reimagined as a **slowly orbiting constellation** of glass disks rather than dense holographic emblems. Lighter, more airy, parallax-aware.

Use the attached `style-2-brighter-cockpit.json` for ALL design tokens.

### Geometry (from spec `architecture.labMap`)

- **Outer ring** — labs 1–6, radius `22vmin`, 60° apart, starting at `-90deg`.
- **Inner ring** — labs 7–11, radius `14vmin`, 72° apart, starting at `-90deg`.
- **Whole constellation slowly orbits ±2deg in a 60-second loop** (CSS keyframe). This is what makes it feel alive vs. style-1's static positions.
- **Parallax-tilt:** the entire map rotates ±3 deg following cursor position (rAF + lerp 0.12).

Position each lab using the same double-rotate trick as style-1. The orbiting rotation applies to a `<div className="constellation-orbit">` wrapper, NOT individual labs.

### Lab nodes — soft glass disks

Each lab is a 72 px circular **glass disk** (not a 3D hex emblem):

```
┌─ outer 1px iridescent rim (lab-color tinted) ─┐
│   ┌─ inner 64px glass disk ─────────────┐    │
│   │  backdrop-blur 14px, saturate 170% │    │
│   │  background: white/22 → white/8    │    │
│   │  drop-shadow: 0 8px 24px lab/30%   │    │
│   │                                     │    │
│   │  <span> emoji (28 px)              │    │
│   │  Below disk:                       │    │
│   │  <span> "LAB {n}: {name}" (Sora 11px) │  │
│   └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

The label sits BELOW the disk (12 px below), white text, drop-shadow `0 1px 2px rgba(0,0,0,0.4)` for legibility against the bright backdrop.

### Adjacency edges

Same topology as style-1 (outer loop / inner loop / cross beams / Lab 6 overlay) but **gradient tubes** instead of thin animated dashes:

- Stroke: `linear-gradient(to <direction>, lab-color-A, lab-color-B)`, **1.5 px** thick.
- Soft drop-shadow `drop-shadow(0 0 6px lab-color-A/40)`.
- Dash animation: `stroke-dasharray: 8 12; animation: connection-pulse 6s ease-in-out infinite`.

Render in `<svg>` background layer (z-index 0).

### Center "core"

A small pulsing core at the geometric center: 16 px circular blur with iridescent gradient `conic-gradient(from 0deg, teal, magenta, pink, teal)`, opacity 0.6, breathes 4 s.

### Interaction

- **Click lab disk** → `onLabClick(labId)`. Visual: disk scales 1.16, rim brightens to full lab-color, ring rotates iridescent 4 s.
- **Hover lab disk** → scale 1.08, anchor-positioned **tooltip card** appears (use CSS Anchor Positioning):

```css
.lab-tooltip {
  position-anchor: --node-{id};
  top: anchor(top);
  left: anchor(center);
  transform: translate(-50%, calc(-100% - 12px));
}
```

  Tooltip is a glass-card `atrium-card` style: 240 px wide, padding 16 px, contains:
  - Lab name (`font-display`, 16 px, weight 600).
  - Lab description (`font-body`, 13 px, white/85, 2-line clamp).
  - Progress bar (small, 6 px tall).
  - Game count: `{completed} of {total} games`.
  - "→ Enter Lab" chip (small primary button).

- **Double-click** → `onLabEnter(labId)` (uses View Transitions API in parent).
- **Keyboard:** Tab cycles labs in adjacency order. Arrow keys traverse the adjacency graph (UP/DOWN moves between rings via cross beams; LEFT/RIGHT moves around current ring). Enter focuses; Space enters.

### Locked labs

- Disk desaturated 50% + reduced opacity 0.6.
- Padlock icon (lucide `lock`, 14 px) overlaid top-right of disk.
- Tooltip changes to "Complete Lab N to unlock".
- No iridescent rotation when focused.

### Data shape

```ts
interface LabNode {
  id: number; name: string; description: string; icon: string; hex: string;
  ring: 'outer' | 'inner'; progress: number; locked: boolean;
  gamesCompleted: number; gamesTotal: number;
}
interface LabConstellationProps {
  labs: LabNode[];
  focusedLabId: number | null;
  onLabClick: (id: number) => void;
  onLabEnter: (id: number) => void;
}
```

### Motion

- **Initial entry:** edges fade in 800 ms; nodes scale 0.7→1.0 + fade with stagger 60 ms (outer first, inner second).
- **Idle:** entire constellation orbits ±2 deg / 60 s loop (CSS); parallax-tilt ±3 deg following cursor (JS rAF, desktop only).
- **Hover:** disk scales 1.08 in 250 ms easing `cubic-bezier(0.22, 1, 0.36, 1)`. Tooltip fades in 150 ms.
- **Focus:** scale 1.16, iridescent rotation 4 s on the rim.
- **Center core:** breathing 4 s.
- **Reduced motion:** ALL motion off — orbit static, parallax-tilt off, rim rotation static, only fades preserved.

### Accessibility

- Wrapper: `<div role="navigation" aria-label="Lab constellation — 11 themed AI labs in two concentric rings, navigable by adjacency">`.
- Each disk is a `<button>` with rich aria-label: `"Lab {id}: {name}. {description}. {progress}% complete, {gamesCompleted} of {gamesTotal} games. Connected to labs {adjacentIds.join(', ')}. {locked ? 'Locked.' : ''}"`.
- Tooltip is decorative (visible on hover/focus); keyboard focus reveals it identically.
- Reduced-motion + reduced-transparency support.

### Constraints

- TypeScript strict.
- Pure HTML/CSS/SVG — no canvas.
- Use `lucide-react` for the lock icon.
- Single file `src/components/home/LabConstellation.tsx`.
- No external state — props in, callbacks out.

### Export

```ts
export default LabConstellation;
export type { LabConstellationProps, LabNode };
```

---

## After v0 generates

1. Drop into `<MainStage>` background slot in `HomeShell`.
2. Verify the constellation orbits ±2 deg over 60 s without your input.
3. Hover a lab — tooltip appears anchored above the disk, showing rich info.
4. Move your cursor across the map — whole constellation should tilt subtly via parallax.
5. Tab through nodes — focus follows adjacency graph, not just DOM order.

## If v0 misses the mark

- "Constellation isn't orbiting — wrap rings in `<div className='constellation-orbit'>` and apply `@keyframes constellation-orbit { 50% { transform: rotate(2deg); } }` for 60 s loop."
- "Tooltip is at fixed position — use CSS Anchor Positioning with `position-anchor: --node-{id}` and `top: anchor(top)`."
- "Edges are flat lines — make them gradient tubes (linear-gradient stroke with two lab colors), 1.5 px thick, with drop-shadow glow."
- "Lab disks look identical — each lab's `--lab-color` should tint its rim and drop-shadow color."
