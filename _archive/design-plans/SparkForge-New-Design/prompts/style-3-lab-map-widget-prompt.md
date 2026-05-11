# v0 Prompt — Lab Map Orbit Widget (Style 3: Holo-Deck Dashboard)

**Target:** v0.dev.
**Attach:** `../design-specs/style-3-cyberpunk-apple.json`
**Output target:** `<LabMapOrbit />` for `src/components/home/LabMapOrbit.tsx`. Slotted into `<OrbitFold>` of the style-3 home shell.

---

## Paste this into v0

Build the SparkForge `LabMapOrbit` — a **decorative interactive lab map widget** for the Holo-Deck Dashboard. Distinct from styles 1/2 in that it's NOT the primary navigation entry point (the bento grid is); this is a smaller, tactile, drag-rotatable constellation that complements the Apple-style hero.

Use the attached `style-3-cyberpunk-apple.json` for ALL design tokens.

### Geometry (from spec `architecture.labMap.orbit`)

Same concentric 6+5 ring topology, but **CSS-3D rendered** (transform-style: preserve-3d) for a tactile sphere-of-influence feel.

- **Outer ring** — labs 1–6, radius 38% (of widget size), 60° apart from -90°.
- **Inner ring** — labs 7–11, radius 22%, 72° apart from -90°.
- Widget size: `clamp(360px, 70vmin, 720px)` square.
- Each lab is a **64 px glass disk** with iridescent rim.

### CSS-3D structure

```jsx
<div className="orbit-stage">
  <div className="orbit-rotator" style={{ '--rot-x': `${rotX}deg`, '--rot-y': `${rotY}deg` }}>
    <svg className="adjacency-layer">{/* edges */}</svg>
    <div className="ring ring-outer">{outerLabs.map(...)}</div>
    <div className="ring ring-inner">{innerLabs.map(...)}</div>
    <div className="core" />
  </div>
</div>
```

```css
.orbit-stage    { perspective: 1400px; perspective-origin: 50% 50%; }
.orbit-rotator  { transform-style: preserve-3d; transform: rotateX(var(--rot-x)) rotateY(var(--rot-y)); transition: transform 200ms ease-out; }
.ring           { position: absolute; inset: 0; transform-style: preserve-3d; }
.lab-disk       { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(-1 * var(--ring-r))) rotate(calc(-1 * var(--angle))); }
.ring-outer     { animation: orbit-slow-cw 120s linear infinite; }
.ring-inner     { animation: orbit-slow-ccw 90s linear infinite; }
@keyframes orbit-slow-cw  { to { transform: rotateZ(360deg); } }
@keyframes orbit-slow-ccw { to { transform: rotateZ(-360deg); } }
```

The two rings rotate at different speeds in opposite directions for dynamic feel.

### Lab disks

Each disk:

```
┌─ outer 1 px iridescent rim (animated 8 s rotate) ─┐
│  ┌─ inner 60 px frosted glass disk ───────────┐   │
│  │  light: rgba(255,255,255,0.85)            │   │
│  │  dark:  rgba(31,227,214,0.08) glass      │   │
│  │                                            │   │
│  │  emoji 24 px center                        │   │
│  └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

Use the iridescent ring trick (same as `BentoLabTile`):

```css
.lab-disk::before {
  content: ''; position: absolute; inset: 0; padding: 1px; border-radius: 50%;
  background: conic-gradient(from 0deg, #1FE3D6, #7A2DE0, #B22CFF, #FF4FC8, #1FE3D6);
  animation: iridescent-spin 8s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude; pointer-events: none;
}
```

Below each disk (positioned inside the same lab container), a tiny label: `font-body` 11 px weight 500, lab name. Light mode: `#0B0F1E`. Dark mode: `#F0F4FF`.

### Adjacency edges

Inline SVG layer with same connection set as styles 1/2:
- Outer loop, inner loop, cross beams, Lab 6 dashed-to-all.
- Stroke: `rgba(31,227,214,0.30)` (light) / `rgba(159,255,246,0.30)` (dark).
- Cross beams: lighter `0.18`.
- Lab 6's special dashed lines: even lighter `0.12`, dashed `2 4`.
- Edges DON'T need to rotate with the rings — just draw them in the same DOM tree so 3D transforms cascade.

### Center core

Small pulsing iridescent core at the geometric center, 24 px circle, conic-gradient `from 0deg, #1FE3D6, #B22CFF, #FF4FC8, #1FE3D6`, opacity 0.7, breathing 4 s.

### Drag-to-rotate interaction

Mouse + touch drag rotates the entire `<orbit-rotator>`:

- `pointerdown` captures start position.
- `pointermove` updates `rotX/rotY` proportionally to delta (sensitivity: 0.4 deg/px).
- Clamp `rotX` to `±25deg`, `rotY` is unrestricted.
- `pointerup` ends drag — start a slow auto-decay back to neutral over 1.5 s if no further interaction.
- On hover (no drag), gentle parallax ±3 deg.

```ts
const onPointerMove = (e: PointerEvent) => {
  if (!dragging) return;
  setRotY(prev => prev + (e.movementX * 0.4));
  setRotX(prev => clamp(prev - (e.movementY * 0.4), -25, 25));
};
```

### Click to navigate

- **Click a lab disk** → call `onLabEnter(labId)`. Visual: disk scales 1.18, ring brightens, brief iridescent flare.
- Detect drag-vs-click via threshold (5 px movement).
- `onLabHover(labId | null)` for tooltip parent — but THIS widget doesn't render tooltips (the dashboard is calmer).

### Locked labs

- Disk desaturated 50%, opacity 0.6.
- Padlock icon (lucide `lock`, 12 px, white/70) overlaid bottom-right of disk.
- Click is a no-op + tiny shake animation (200 ms).

### Data shape

```ts
interface LabNode {
  id: number; name: string; icon: string; hex: string;
  ring: 'outer' | 'inner'; locked: boolean;
}
interface LabMapOrbitProps {
  labs: LabNode[];
  focusedLabId: number | null;
  onLabEnter: (id: number) => void;
  onLabHover?: (id: number | null) => void;
  initialRotation?: { x: number; y: number };
  theme?: 'light' | 'dark';
}
```

### Motion

- **Initial entry:** widget scales 0.95 → 1.0 + fades from opacity 0 over 600 ms; lab disks fade in stagger 50 ms each.
- **Idle:** outer ring rotates slowly clockwise (120 s), inner ring counter-clockwise (90 s). Iridescent rims spin 8 s.
- **Hover (no drag):** subtle parallax tilt to cursor.
- **Drag:** smooth rotation, no transition during drag.
- **Drag end:** decay to neutral 1.5 s `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Reduced motion:** rings static, iridescent rims static, drag still works (functional).

### Accessibility

- Wrapper: `<div role="region" aria-label="Lab constellation — 11 themed AI labs in two rotating rings. Drag to rotate. Press Tab to navigate by keyboard.">`.
- Each disk is a `<button aria-label="Enter Lab {id}: {name}. {locked ? 'Locked.' : ''}">`.
- Keyboard navigation: Tab cycles labs in adjacency order. Enter activates.
- For users who can't drag: provide visible "Reset rotation" button below the widget that resets `rotX/rotY` to 0.
- `prefers-reduced-motion`: ring orbits disabled (rings are static), drag remains functional.

### Constraints

- TypeScript strict.
- Use `lucide-react` (lock icon).
- Single file `src/components/home/LabMapOrbit.tsx`.
- Use Pointer Events (not separate mouse + touch handlers).

### Export

```ts
export default LabMapOrbit;
export type { LabMapOrbitProps, LabNode };
```

---

## After v0 generates

1. Drop into `<OrbitFold>` slot.
2. Verify the two rings rotate at different speeds in opposite directions.
3. Click and drag the widget — should rotate smoothly along both axes; release should decay back to neutral.
4. The 11 labs should be visible: 6 in outer ring (radius 38%), 5 in inner (radius 22%).
5. Adjacency edges visible as thin teal lines connecting them.
6. Center has an iridescent pulsing core.
7. Click a lab disk — should call `onLabEnter` (no anchor-positioned tooltip in this style; widget is calmer than styles 1/2).

## If v0 misses the mark

- "Rings aren't rotating in opposite directions — outer should be cw 120s, inner ccw 90s, both via CSS keyframes."
- "Drag rotation isn't smooth — disable `transition` on `.orbit-rotator` while `dragging===true` so rotation follows pointer 1:1."
- "Widget feels flat — add `perspective: 1400px` on `.orbit-stage` and `transform-style: preserve-3d` on `.orbit-rotator` so rings have actual depth."
- "Iridescent rims aren't visible at this size — increase ring thickness from 1 px to 1.5 px."
