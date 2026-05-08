# v0 Prompt — Home Screen Shell (Style 1: Current Cockpit, lightly cleaned)

**Target:** v0.dev (primary).
**Attach:** `../design-specs/style-1-current-cockpit.json`
**Output target:** complete `/home` page mockup at `app/home/page.tsx` + supporting layout components.

> This prompt covers the **page shell only** — the four zones, HUD frame, and slots. The lab map and instrument cluster have dedicated prompts (`style-1-lab-map-prompt.md`, `style-1-instrument-cluster-prompt.md`) — generate those separately and import them as `<HolographicLabMap />` and `<InstrumentCluster />`.

---

## Paste this into v0

Build the SparkForge `/home` page shell for a Next.js 15 + Tailwind 4 + TypeScript dark-mode-only app. Aesthetic: **Frost-Prismatic Laboratory Cockpit** — a futuristic spacecraft cabin viewed from the pilot's seat. Surface is `oklch(0.13 0.02 260)` deep navy. Use the attached `style-1-current-cockpit.json` for ALL design tokens.

This is the **shell** — generate the page layout, zones, top-bar/HUD frame, and panel containers. Use placeholder `<div data-slot="lab-map" />` for the lab map and `<div data-slot="instruments" />` for the instrument cluster — those come from sibling prompts.

### Page architecture (from spec `architecture.zoneGrid`)

CSS Grid with 4 zones around a central viewport, plus a peripheral HUD frame.

```
┌─ HUD top-arc + corner readouts ────────────────┐
│                                                │
│  Left 25%   │      Center 45%      │ Right 25% │
│  Player Hub │   Mission Viewport   │  Controls │
│             │   (lab map slot)     │           │
│             │                      │           │
├─ HUD bottom-arc + corner readouts ─────────────┤
│                                                │
│         Bottom 15% — Instrument Cluster        │
└────────────────────────────────────────────────┘
```

Grid template:

```css
grid-template-rows: 64px 1fr 56px 120px;
grid-template-columns: 25% 45% 25%;
grid-template-areas:
  "hud-tl   hud-top    hud-tr"
  "left     center     right"
  "hud-bl   hud-bottom hud-br"
  "instr    instr      instr";
```

Apply container queries (`@container`) at the page wrapper so children adapt without viewport-coupling.

### Generate these components in one file (or split if cleaner)

1. **`<HomeShell>`** — the grid wrapper. Renders the page background (cosmic-dark from `background.stack` in spec), all four zones, and the HUD frame.
2. **`<PlayerHubPanel>`** — Left zone. Per `architecture.panels[0]`:
   - Hexagonal avatar frame (96 px) with chrome bezel (3-layer: outer 16px / led-rim 13px / screen-inner 11px).
   - Child name centered (`font-display` Exo 2, 18 px, weight 600).
   - Level badge pill below name (`font-data` Orbitron, 11 px, format `LV.{level}`).
   - Vertical gauge stack: XP (circular gauge), Streak (flame + number), Daily progress (radial ring).
   - Badge shelf — 6-slot honeycomb 2×3 grid.
   - Glass-card-v2 outer wrapper, 16 px outer radius, padding 24 px.
3. **`<ControlConsolePanel>`** — Right zone. Per `architecture.panels[2]`:
   - Collapsible "CONTROLS" header (`font-data`, 11 px, tracked 0.18em uppercase, chevron-down).
   - Audio toggle (small switch, label "Audio").
   - Ambient slider (0–1, step 0.05, label "Ambient").
   - Brightness slider (0.7–1.0, step 0.02, label "Brightness").
   - Theme segmented (3 options: Default / Aurora / Crimson).
   - Link "Open all settings" → `/settings`.
   - Same glass-card-v2 wrapper.
4. **`<HudFrame>`** — Peripheral arc frame at z-index 50. Per `architecture.hud`:
   - 4 SVG arc segments (top 92°, bottom 92°, left 70°, right 70°) with tick marks (32 / 32 / 24 / 24).
   - Stroke: `var(--lab-color, #0FB8FA)`, opacity 0.35 baseline → 0.7 on `:has(:hover)` of any panel.
   - 4 corner readouts using inline `<time>` and `<span>` elements. All `font-data` Orbitron:
     - **Top-left:** clock 12 px, format `HH:MM`, letter-spacing 0.12em. Update every 1 s via `setInterval`.
     - **Top-right:** XP counter 12 px, format `XP {xp.toLocaleString()}`. Animate count-up on mount with `motion/react`.
     - **Bottom-left:** mode label 11 px, format `DASHBOARD`, letter-spacing 0.18em.
     - **Bottom-right:** child tag 11 px, format `{name} / LV.{level}`.
   - Breathing pulse: 4 s ease-in-out infinite, opacity wave on the arcs only.
   - Implement gold celebration cascade as a method `triggerCelebration('minor' | 'major' | 'epic')` exposed via `forwardRef` — animation rotates a gold (#FFD700) chase light around the 4 arcs in sequence (top→right→bottom→left) for 1/2/3 revolutions.
5. **`<MissionViewport>`** — Center zone. Per `architecture.panels[1]`:
   - Floating header at top: `Welcome back, {displayName}` (`font-display`, clamp(1.5rem, 3vw, 2rem), weight 700).
   - Sub-line: `Lab {focusedLabId}: {focusedLabName} is calling — your next mission awaits.` (`font-body`, 14 px, white/65).
   - Background slot: `<div data-slot="lab-map" className="absolute inset-0 -z-10" />` — sibling prompt fills.
   - Bottom-center CTA: `Continue Learning →` (primary glow button, glass-card-v2-elevated style with neon-blue accent ring).
   - Quick-action chip row beside CTA: `Daily Challenge`, `Ask Sparky`.
6. **Bottom slot:** `<div data-slot="instruments" className="grid-area-instr" />` — sibling prompt fills with `<InstrumentCluster />`.

### Background (apply to `<HomeShell>` outer)

```css
background:
  radial-gradient(ellipse at 20% 50%, rgba(0,187,255,0.03), transparent 60%),
  radial-gradient(ellipse at 80% 20%, rgba(170,102,255,0.02), transparent 50%),
  oklch(0.13 0.02 260);
```

Plus optional overlays (toggleable via Settings):
- **Scanlines:** `repeating-linear-gradient(0deg, transparent 2px, rgba(0,187,255,0.03) 2px 4px)`, mix-blend-mode overlay, fixed full-screen.
- **Vignette:** `radial-gradient(ellipse at center, transparent 60%, rgba(0,20,40,0.3) 100%)`, fixed full-screen.

### Curvature

Apply ONCE on `<HomeShell>` outer:

```css
transform: perspective(1200px) rotateX(2deg);
transform-style: preserve-3d;
```

Disable inside `@media (prefers-reduced-motion: reduce)` and `@media (pointer: coarse)`.

### Props

```ts
interface HomeShellProps {
  child: { id: string; displayName: string; level: number; xp: number; streakDays: number; dailyPct: number };
  focusedLabId: number;
  focusedLabName: string;
  focusedLabColorHex: string;     // sets --lab-color
  modeName?: string;              // defaults to 'DASHBOARD'
  onContinue?: () => void;
}
```

Set `style={{ '--lab-color': focusedLabColorHex, '--lab-glow': `${focusedLabColorHex}33` }}` on the wrapper.

### Motion (use `motion/react`)

- Each panel enters with a stagger: opacity 0 → 1, translateY(12) → 0, 400 ms each, delays: HUD 0ms, Left 100ms, Center 200ms, Right 300ms, Instruments 400ms. Use `easeOut`.
- HUD breathing: pure CSS keyframe (already in spec — `subtle-glow 4s`).
- Wrap motion props with `useReducedMotion()` — collapse to instant fades.

### Accessibility

- Use semantic landmarks: `<aside aria-label="Pilot identity">` (left), `<main aria-label="Mission viewport">` (center), `<aside aria-label="Controls and monitoring">` (right), `<nav aria-label="Navigation and instruments">` (bottom), `<div role="presentation">` (hud frame — decorative).
- All sliders/toggles have visible labels + ARIA (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).
- Skip link target `<main id="main-content">` already exists in app — don't duplicate.
- Focus ring: existing global rule (3 px solid `var(--lab-color)` + 6 px halo). Don't override.
- Respect `prefers-reduced-motion` and `prefers-contrast: more`.

### Constraints

- Dark mode only — no `dark:` variants needed; surface is fixed.
- Use `font-display` / `font-body` / `font-data` Tailwind utilities (already wired).
- TypeScript strict.
- Single file `app/home/page.tsx` containing the `HomeShell` server-component wrapper, plus client-component sub-panels in `src/components/home/*`.

### Export

```ts
// app/home/page.tsx
export default function HomePage() { /* server-component, fetches child data */ }

// src/components/home/HomeShell.tsx
export default HomeShell;
export { PlayerHubPanel, ControlConsolePanel, HudFrame, MissionViewport };
```

---

## After v0 generates

1. Drop into `app/home/page.tsx` + `src/components/home/*`.
2. Generate `<HolographicLabMap />` and `<InstrumentCluster />` from the sibling prompts and wire them into the slots.
3. Verify the four-zone grid: open at 1280×720, the percentages should be 25/45/25 horizontally; bottom strip should be ~120 px tall.
4. Verify HUD corner readouts visibly show: clock, XP, mode label, child tag.
5. Verify the curvature is subtle (2 deg) — not a fishbowl effect.

## If v0 misses the mark

- "The grid is 33/33/33 — fix to 25% / 45% / 25% with `grid-template-columns: 25% 45% 25%;`."
- "HUD frame is rendering inline; it should be `position: absolute; inset: 0; z-index: 50; pointer-events: none` so it overlays the grid without blocking clicks."
- "Curvature is too aggressive — reduce from 5 deg to 2 deg."
- "The HUD corner readouts are static — wire the clock to update every second and animate the XP count-up."
