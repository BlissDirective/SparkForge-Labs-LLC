# v0 Prompt — Home Screen Shell (Style 2: Brighter Lab Atrium)

**Target:** v0.dev.
**Attach:** `../design-specs/style-2-brighter-cockpit.json`
**Output target:** complete `/home` page mockup at `app/home/page.tsx` + supporting layout components.

> Sibling prompts: `style-2-lab-map-prompt.md`, `style-2-nav-dock-prompt.md`. Generate this shell first, then those, then wire them in.

---

## Paste this into v0

Build the SparkForge `/home` page shell — **"Lab Atrium"** aesthetic. Imagine a bright glass-walled observatory deck rather than a cramped pilot cockpit. Cantilevered floating panels hover above a turquoise-to-magenta gradient backdrop with aurora bloom. **No dark mode.** Use the attached `style-2-brighter-cockpit.json` for ALL design tokens.

This generates the **shell only**. Two sibling prompts fill `<LabConstellation />` (center stage background) and `<NavigationDock />` (bottom strip).

### Page architecture (from spec `architecture.zoneGrid`)

CSS Grid + subgrid:

```
┌─ Top bar (translucent glass, 1px iridescent bottom edge) 56px ─┐
│                                                                │
│ Pilot 22% │      Main Stage 56%        │ Mission Deck 22%      │
│           │   (lab map background)     │                       │
│           │                            │                       │
├─ Navigation Dock (bento-style, full width) 140px ──────────────┤
└────────────────────────────────────────────────────────────────┘
```

```css
grid-template-rows: 56px 1fr 140px;
grid-template-columns: 22% 56% 22%;
grid-template-areas:
  "topbar  topbar    topbar"
  "pilot   stage     deck"
  "dock    dock      dock";
gap: 16px;
padding: 24px;
```

Use container queries on the wrapper.

### Generate these components

1. **`<HomeShell>`** — outermost grid wrapper. Renders the page background, topbar, three middle zones, and dock.
2. **`<TopBar>`** — translucent glass strip across the top. Per `architecture.panels[topbar]`:
   - Logo wordmark left (32 px, `font-display`).
   - Breadcrumb center: `HOME / DASHBOARD` (Orbitron 11 px tracked 0.16em).
   - Right cluster: clock pill, XP chip, avatar button (32 px circle with menu-on-click).
   - Background: `linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)`, `backdrop-filter: blur(20px) saturate(180%)`.
   - 1 px iridescent bottom border (animated 8s rotate, conic-gradient teal→violet→magenta→pink→teal).
3. **`<PilotCard>`** — Left zone. Cantilevered glass card. Per `architecture.panels[pilot-card]`:
   - 24 px outer radius, 32 px padding, hovers 8 px above page with cantilever shadow `0 24px 56px -32px rgba(0,0,0,0.35)`.
   - Background: `linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)`, blur(14px) saturate(170%).
   - Content stack:
     - 120 px circular avatar with **animated rotating iridescent ring** (8 s) — same conic-gradient ring as `<TopBar />` border.
     - Child name (`font-display` 24 px weight 700, center).
     - Level pill (`font-data` 12 px, `LV {level}`, glass + lab-color tint).
     - 3-up stat row: XP / STREAK / RANK. Each: tiny label (10 px tracked uppercase) + big value (Orbitron 20 px).
     - "To Next Level" rail: 8 px progress bar with rounded ends, lab-color fill.
     - Badge shelf: horizontal scroll-snap with 56-px tiles, gap 12 px. Empty slots show locked padlock.
4. **`<MainStage>`** — Center zone. Per `architecture.panels[main-stage]`:
   - Slot for `<LabConstellation />` background: `<div data-slot="lab-map" className="absolute inset-0 -z-10" />`.
   - Hero greeting: `Good {timeOfDay}, {firstName}.` (`font-display`, clamp(2rem, 4vw, 3.25rem), weight 700, `-0.03em` tracking).
   - Sub-greeting: `Lab {focusedLabId} is calling — your {pendingMission} mission awaits.` (`font-body`, 17 px, white/85).
   - Bottom-center CTA pair:
     - Primary: `Continue Mission →` (glass-card-v2-elevated, lab-color accent ring, 56 px tall pill, `font-display` 18 px).
     - Beside it: 3 chip-buttons "Resume Game" / "Daily Challenge" / "Ask Sparky" (small glass pills, `font-body` 13 px).
   - Curved accent rail: 1-px luminous arc above and below the stage zone, hugging the rounded corners (use SVG path).
5. **`<MissionDeck>`** — Right zone. Vertical stack of 5 mini-cards. Per `architecture.panels[mission-deck]`:
   - Same cantilever glass treatment as `<PilotCard>`.
   - Each mini-card: 16 px radius, 16 px padding, glass.
   - Cards (in order):
     1. **Next Up** — title + body `Lab {n}: {gameName}` + small "Begin" chip
     2. **Daily Streak** — title + flame stack visual + `{streakDays}-day streak`
     3. **Ask Sparky** — title + body + "Open chat" chip + iridescent ring accent
     4. **From Parent** *(conditional)* — only render if `parentMessage` prop set; "Reply" chip
     5. **New Badges** — `{n} unlocked` + "View" chip
   - Each card hover: lift 4 px, cantilever shadow deepens.
6. **Bottom slot:** `<div data-slot="dock" className="grid-area-dock" />` — sibling prompt fills with `<NavigationDock />`.

### Page background (apply to `<HomeShell>` outer)

```css
background:
  radial-gradient(ellipse 80% 60% at 25% 30%, oklch(0.78 0.16 195) 0%, transparent 55%),
  radial-gradient(ellipse 70% 70% at 78% 78%, oklch(0.42 0.20 340) 0%, transparent 60%),
  linear-gradient(135deg, oklch(0.66 0.14 200) 0%, oklch(0.34 0.14 330) 100%);
```

Plus three ambient overlays:
- **Aurora drift** — two large `radial-gradient` blurs animated 30s loop (CSS keyframe `aurora-drift`).
- **Floating particles** — 24 absolutely-positioned 4-px dots, lab-color tinted, opacity 0.15, animated `float-slow 6s` (existing keyframe), random delays.
- **Film grain** — fixed full-screen overlay `url('data:image/svg+xml;...noise...')` opacity 0.012.

### Top + bottom curved accent rails

Two thin SVG paths hugging the page top and bottom:

```jsx
<svg className="absolute inset-x-0 top-0 h-2 w-full pointer-events-none" viewBox="0 0 100 1" preserveAspectRatio="none">
  <path d="M0,0.5 Q50,1 100,0.5" stroke="url(#iridescent-grad)" strokeWidth="0.5" fill="none" />
</svg>
```

Use `linearGradient` defs for the iridescent stroke.

### Curvature

Subtle 2 deg perspective on the grid wrapper (same as style-1):

```css
.home-shell { transform: perspective(1200px) rotateX(2deg); transform-style: preserve-3d; }
@media (prefers-reduced-motion: reduce), (pointer: coarse) {
  .home-shell { transform: none; }
}
```

### Props

```ts
interface HomeShellProps {
  child: { id: string; firstName: string; displayName: string; level: number; xp: number; streakDays: number; rank: string };
  focusedLabId: number;
  focusedLabName: string;
  focusedLabColorHex: string;
  pendingMissionName?: string;
  parentMessage?: string;
  newBadgeCount?: number;
  onContinue?: () => void;
}
```

### Motion (use `motion/react`)

- **Initial entry:** topbar fades in instantly; pilot/stage/deck slide-up + fade with stagger 100/200/300 ms; dock slides up 400 ms.
- **PilotCard hover:** parallax-tilt rotateX/rotateY ±2deg following cursor (lerp 0.15). Disabled on touch + reduced-motion.
- **MissionDeck cards:** magnetic-hover (translate ±3 px toward cursor on hover).
- **Aurora drift:** continuous 30 s loop CSS keyframe.
- **Iridescent rings (avatar + topbar border):** 8 s linear infinite (CSS).
- **Reduced motion:** all decorative motion off, fades only.

### Accessibility

- Landmarks: `<header>` (topbar), `<aside aria-label="Pilot card">` (left), `<main aria-label="Mission stage">` (center), `<aside aria-label="Mission deck">` (right), `<nav aria-label="Navigation dock">` (bottom).
- Verify WCAG AA on text against the gradient backdrop. Glass panels provide local contrast — if borderline, increase glass alpha from 0.22 to 0.32.
- All cards have `role="region" aria-labelledby="..."` with their visible title.
- Reduced-motion + prefers-contrast respected.
- Focus ring: existing global rule — don't override.

### Constraints

- No `dark:` variants — there is no dark mode for style 2.
- Use `motion/react`, `lucide-react`, `next/link`. TypeScript strict.
- Single `app/home/page.tsx` server component plus client components in `src/components/home/`.

### Export

```ts
export default function HomePage() { /* fetches child data */ }
export { HomeShell, TopBar, PilotCard, MainStage, MissionDeck };
```

---

## After v0 generates

1. Verify the page background renders the diagonal gradient — turquoise top-left → magenta bottom-right.
2. Verify aurora drift ambient animation is visible without hover.
3. Verify cantilever shadows make the panels look like they're floating ABOVE the page (not embedded).
4. Verify the iridescent rings on avatar + topbar border are actually rotating (8 s).
5. Tab through panels — focus order top-bar → pilot → stage → deck → dock.

## If v0 misses the mark

- "Page background is solid color — must be the layered gradient (turquoise radial top-left + magenta radial bottom-right + diagonal base)."
- "Panels look embedded, not floating — add the cantilever shadow `0 24px 56px -32px rgba(0,0,0,0.35)` to each glass card."
- "Iridescent rings are static — they should rotate 8 s linear infinite via `iridescent-spin` keyframe (conic-gradient transform)."
- "Aurora drift isn't moving — wire the radial-gradient layers to a 30 s CSS keyframe that shifts their `background-position`."
