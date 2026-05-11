# v0 Prompt — Instrument Cluster (Style 1: Current Cockpit)

**Target:** v0.dev.
**Attach:** `../design-specs/style-1-current-cockpit.json`
**Output target:** `<InstrumentCluster />` component for `src/components/home/InstrumentCluster.tsx`. Fills the bottom strip of `HomeShell` (`grid-area: instr`).

---

## Paste this into v0

Build the SparkForge `InstrumentCluster` — the bottom 120-px-tall horizontal strip below the cockpit zones. Three sub-clusters: a 5-button navigation grid (center), a 2-dial status cluster (left or right), and a status bar with LED rim line spanning the full width.

Use the attached `style-1-current-cockpit.json` for ALL design tokens.

### Layout

Grid template:

```css
grid-template-columns: 1fr auto 1fr;
grid-template-rows: 1fr auto;  /* second row is the LED status bar */
```

Three direct children:
1. **Left cluster:** dial cluster (status + link).
2. **Center cluster:** 5-button navigation grid.
3. **Right cluster:** dial cluster (mission + audio).

Plus a **bottom-spanning LED status bar** in row 2.

Outer container: `glass-card-v2` (16 px radius, padding 12 px), background tinted with current `var(--lab-color)` glow at 8% opacity.

### Sub-cluster 1: Navigation button grid (center)

Five round backlit buttons in a row with 16 px gap. Each button:

```
┌─ chrome bezel (3-layer, 56 px outer) ──┐
│  ┌─ LED rim (lab-color, animated) ─┐  │
│  │  ┌─ inner disk ─────────────┐   │  │
│  │  │     <Icon size={20} />   │   │  │
│  │  └──────────────────────────┘   │  │
│  └─────────────────────────────────┘  │
│  Label below (Orbitron 9px tracked)   │
└────────────────────────────────────────┘
```

Buttons (from spec `architecture.panels[3].elements[0].buttons`):

| id | label | icon | href |
|---|---|---|---|
| home | Home | home (lucide) | /home |
| labs | Labs | beaker | /labs |
| arcade | Arcade | gamepad-2 | /arcade |
| profile | Profile | user | /profile |
| settings | Settings | cog (settings) | /settings |

Use `lucide-react` for icons.

**Active state:** the button matching `currentRoute` has its LED rim at full opacity and a soft outer glow (`box-shadow: 0 0 24px var(--lab-glow)`). Other buttons' LEDs are at 0.4 opacity.

**Hover state:** scale 1.05, LED brightens to 0.8, soft glow fades in.

### Sub-cluster 2: Left dial cluster (LINK + MISSION STATUS)

Two compact "instrument dial" cards side-by-side. Each card is 80 × 80 px with chrome bezel + screen inner.

**Dial 1: LINK (connection status)** — pulse bar
- Label "LINK" (Orbitron 9 px, tracked, white/55).
- Visual: 24 px tall, 60 px wide horizontal bar with 5 segments. Active segments fill in `var(--lab-color)`. `connection-pulse` animation 4 s.
- Below: tiny status word `STABLE` / `WEAK` / `LOST` (Orbitron 8 px, white/65).

**Dial 2: MISSION STATUS** — single LED indicator
- Label "STATUS" (Orbitron 9 px, tracked).
- Visual: 12 px circular LED, lab-colored, with `emissive-glow-pulse` animation.
- Below: status text `MISSION READY` / `IN PROGRESS` / `COMPLETE` (Orbitron 8 px).

### Sub-cluster 3: Right dial cluster (AUDIO + ENERGY)

Same pattern, two more dials.

**Dial 3: AUDIO**
- Visual: 24 px tall vertical 5-segment EQ bar (like the LINK pulse but vertical).
- Animated random heights when audio is playing; flat when muted.
- Status text: `ON` / `MUTED`.

**Dial 4: ENERGY (XP today)**
- Visual: circular gauge SVG, 0-100% fill in `var(--lab-color)`.
- Center text: `{xpToday}` (Orbitron 11 px).
- Status text: `+{xpDelta} TODAY`.

### Sub-cluster 4: Bottom LED status bar (full-width, row 2)

A 1-px-tall horizontal LED line across the full width of the cluster, centered:

```css
height: 1px;
background: linear-gradient(
  90deg,
  transparent 0%,
  var(--lab-color) 30%,
  var(--lab-color) 70%,
  transparent 100%
);
opacity: 0.5;
animation: ledRimPulse 3s ease-in-out infinite;
```

Plus a 14 px tall text line below it: free-form scrolling status messages (`font-data` Orbitron 10 px, white/40, letter-spacing 0.16em). Marquee-scroll left over 30 s. Sample messages:

```
SYSTEM NOMINAL · ALL CHANNELS GREEN · LAB ACCESS UNRESTRICTED · NEXT CALIBRATION 04:32 · SPARKY ONLINE · 11 LABS DETECTED
```

Pause on hover.

### Props

```ts
interface InstrumentClusterProps {
  currentRoute: '/home' | '/labs' | '/arcade' | '/profile' | '/settings';
  link: { state: 'stable' | 'weak' | 'lost'; bars: number /* 0-5 */ };
  mission: { state: 'ready' | 'in-progress' | 'complete' };
  audio: { muted: boolean; level: number /* 0-1 */ };
  energy: { xpToday: number; xpDelta: number; pct: number /* 0-100 */ };
  statusLine?: string; // marquee text, defaults provided
}
```

### Motion (use `motion/react` + CSS keyframes from globals)

- **Initial entry:** instrument cards fade-in stagger (60 ms each, 300 ms total).
- **LINK pulse-bar:** `connection-pulse 4s` on bars (existing keyframe).
- **MISSION LED:** `emissive-glow-pulse` (existing keyframe).
- **AUDIO EQ:** dynamic heights via `motion/react` `animate` driving 5 height values; cycle 1.2 s.
- **Status bar marquee:** CSS keyframe `marquee 30s linear infinite`.
- **Reduced motion:** marquee static (show first chunk), AUDIO EQ static at 50% all bars, LEDs steady (no pulse).

### Accessibility

- Outer wrapper: `<nav aria-label="Navigation and instrument cluster">`.
- Nav buttons: `<Link>` with `aria-current={currentRoute === href ? 'page' : undefined}` and visible label.
- Dials are decorative — `<div role="img" aria-label="Connection: stable, 5 of 5 bars">` etc.
- Marquee status bar has `role="status" aria-live="polite"` and rotates ARIA text matching visible text.
- Reduced-motion override above.

### Constraints

- Use `lucide-react` for icons (already in package.json).
- TypeScript strict.
- No new keyframes — reuse `subtle-glow`, `connection-pulse`, `emissive-glow-pulse`, `ledRimPulse` from `globals.css`. Add ONLY a `marquee` keyframe (it isn't in the spec yet).
- Single file `src/components/home/InstrumentCluster.tsx`.

### Export

```ts
export default InstrumentCluster;
export type { InstrumentClusterProps };
```

---

## After v0 generates

1. Drop into `HomeShell` bottom slot.
2. Verify all 5 nav buttons render with chrome bezels and the active route's button has its LED brightened.
3. Verify the 4 dials each have their unique visualization (pulse bar / LED / EQ bars / circular gauge).
4. Verify the bottom LED status line spans the full width and the marquee text scrolls.

## If v0 misses the mark

- "Nav buttons have flat backgrounds — they need the 3-layer chrome bezel: outer 16px, LED rim 13px, screen-inner 11px."
- "All dials look identical — give each one a unique visual: LINK = horizontal 5-bar pulse, MISSION = single LED, AUDIO = vertical EQ, ENERGY = circular SVG gauge."
- "The LED status line is too thick — make it 1px tall and reduce opacity to 0.5."
- "Marquee speed is dizzying — slow to 30s linear, pause on hover."
