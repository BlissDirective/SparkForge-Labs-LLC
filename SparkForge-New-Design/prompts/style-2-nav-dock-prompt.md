# v0 Prompt — Navigation Dock (Style 2: Brighter Lab Atrium)

**Target:** v0.dev.
**Attach:** `../design-specs/style-2-brighter-cockpit.json`
**Output target:** `<NavigationDock />` for `src/components/home/NavigationDock.tsx`. Fills the bottom row of `HomeShell` (`grid-area: dock`).

---

## Paste this into v0

Build the SparkForge `NavigationDock` for the Lab Atrium aesthetic. **Replaces the dense instrument cluster of style-1** with a clean horizontal **bento strip** — large, breathable, modern. Five primary nav tiles + two small status pills. Less mechanical, more curated.

Use the attached `style-2-brighter-cockpit.json` for ALL design tokens.

### Layout

A 140-px-tall horizontal flex row with two clusters:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Home]  [Labs]  [Arcade]  [Profile]  [Settings]    [● ONLINE]  │
│                                                     [○ SPARKY]  │
└─────────────────────────────────────────────────────────────────┘
        ← 5 large bento tiles (flex-1) →    ← 2 status pills →
```

```css
display: flex; align-items: center; gap: 16px; padding: 0 24px;
```

The 5 nav tiles are `flex: 1 1 0`; the 2 status pills sit right-aligned in a small column.

Outer wrapper: `atrium-card-elevated` (24 px outer radius, 32 px outer padding, glass background, cantilever shadow `0 24px 56px -32px rgba(0,0,0,0.35)`).

### Nav tiles (5 of them)

Each tile is a flat bento card, 100% height of dock interior (~76 px tall after dock padding), ~120 px wide.

Anatomy:

```
┌─ outer 16px radius, padding 12px ─┐
│  ┌─ icon (28 px lucide) ─┐        │
│  │  centered top         │        │
│  └────────────────────────┘        │
│  Label below icon                  │
│  (Sora 13 px, weight 500)         │
│                                    │
│  Tiny lab-color accent line at    │
│  bottom (only on active tile)     │
└────────────────────────────────────┘
```

Active tile (`route === currentRoute`):
- Background lifted: `linear-gradient(145deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.18) 100%)`.
- 1 px iridescent rim (rotating 8 s) — same conic gradient as elsewhere.
- 2-px-tall `var(--lab-color)` accent line at the tile bottom.
- Icon + label color `text-white` at full opacity.

Inactive tiles:
- Background: `linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)`.
- Icon + label at 78% opacity.
- Hover: scale 1.03, opacity → 100%, glass background brightens to active treatment (without iridescent rim).
- Magnetic hover: tile translates ±4 px toward cursor on hover (Apple-dock style).

Tiles (from spec `architecture.panels[navigation-dock].elements[0].tiles`):

| id | label | icon | href | extras |
|---|---|---|---|---|
| home | Home | home | /home | primary (always slightly emphasized) |
| labs | Labs | beaker | /labs | small badge "11" top-right corner |
| arcade | Arcade | gamepad-2 | /arcade | — |
| profile | Profile | user | /profile | — |
| settings | Settings | settings | /settings | — |

**Labs badge:** small 18 px circular badge, `var(--neon-amber)` background, white text 10 px Orbitron, content `{labCount}`.

### Status pills (2 of them, right column)

Stacked vertically in a 120 px wide column, gap 8 px.

Each pill is a small rounded rectangle (9999 px radius, 32 px tall, padding 8/12), glass background.

**Pill 1: Connection state**
- Tiny 8 px LED dot left (color: green for online, amber for slow, red for offline).
- Text: `ONLINE` / `SLOW` / `OFFLINE` (Orbitron 11 px, tracked 0.16em).
- LED has `emissive-glow-pulse` animation.

**Pill 2: Sparky guide state**
- Avatar dot: 16 px circle with Sparky's accent color (lab-color), small `🤖` emoji.
- Text: `SPARKY READY` / `THINKING…` / `OFFLINE` (Orbitron 11 px, tracked).

### Props

```ts
interface NavigationDockProps {
  currentRoute: '/home' | '/labs' | '/arcade' | '/profile' | '/settings';
  labCount: number;             // for badge — typically 11
  connectionState: 'online' | 'slow' | 'offline';
  sparkyState: 'ready' | 'thinking' | 'offline';
  labColorHex: string;          // active tile accent + sparky avatar
}
```

### Motion (use `motion/react`)

- **Initial entry:** dock slides up + fades from `translateY(20px)` over 400 ms `easeOut`.
- **Tile hover:** scale 1.03, lift +2 px y, magnetic offset toward cursor (rAF, lerp 0.18). Disabled on touch + reduced-motion.
- **Active tile iridescent rim:** 8 s linear infinite (CSS conic-gradient rotation).
- **Status LEDs:** `emissive-glow-pulse` 3 s.
- **Sparky avatar:** when `state==='thinking'`, gentle 1.05 ↔ 1.0 scale 1 s loop.
- **Reduced motion:** magnetic hover off, iridescent rim static, all pulses static.

### Accessibility

- Wrapper: `<nav aria-label="Primary navigation">`.
- Each tile is a `<Link>` with `aria-current={route === href ? 'page' : undefined}` and visible label.
- Status pills are `<div role="status" aria-live="polite">` so screen-readers announce state changes.
- Reduced-motion handled.

### Constraints

- TypeScript strict.
- Use `lucide-react` (icons) and `next/link`.
- Single file `src/components/home/NavigationDock.tsx`.

### Export

```ts
export default NavigationDock;
export type { NavigationDockProps };
```

---

## After v0 generates

1. Drop into `HomeShell` dock slot.
2. Verify 5 bento tiles + 2 status pills layout horizontally with the right spacing.
3. Active route's tile has iridescent rim + lab-color bottom accent line.
4. Hover a tile — magnetic pull toward cursor + scale 1.03.
5. The Labs badge "11" is visible top-right of the Labs tile.

## If v0 misses the mark

- "Tiles are tall and thin — they should be ~120 px wide each, ~76 px tall, distributed flex-1 across the dock."
- "Active tile has no iridescent rim — apply the conic-gradient ring (`from 0deg, teal, violet, magenta, pink, teal`) animated 8 s linear via mask-composite trick."
- "Magnetic hover doesn't work on touch — wrap in `@media (hover: hover) and (pointer: fine)` to disable on touch."
- "Status pills are too big — make them 32 px tall pills with 8 px LED dot + small uppercase text."
