# DESIGN.md — SparkForge Frost-Prismatic Design System

> **Version:** 1.0 | **Date:** April 13, 2026
> **Audience:** AI agents, developers, designers working on SparkForge UI
> **Purpose:** Single source of truth for all visual decisions. Read this before generating UI.

---

## 1. Visual Theme

**Name:** Frost-Prismatic
**Concept:** Laboratory Control Station — a futuristic command console for children ages 7-16 learning AI concepts.
**Mode:** Dark-mode only. No light mode. No theme toggle.
**Aesthetic:** Chrome bezels, neon accents on dark surfaces, holographic glass, emissive glows. Think sci-fi instrument panel, not flat dashboard.

**Brand personality:** Confident, technical, playful-but-serious. The platform looks like real aerospace instrumentation adapted for young learners — not dumbed-down, but accessible.

---

## 2. Color Palette (OKLCH — Perceptually Uniform)

All colors target **L=0.75** for neon accents (equal perceived brightness across all labs).

### Neon Accents (60% blue / 40% accent pops)

| Name | OKLCH | HEX (JS/3D) | Usage |
|------|-------|-------------|-------|
| Blue (PRIMARY) | `oklch(0.75 0.17 225)` | `#0FB8FA` | Primary actions, Lab 1, default LED |
| Green | `oklch(0.75 0.19 155)` | `#00D17A` | Success, Lab 5, demo mode |
| Purple | `oklch(0.75 0.19 295)` | `#B67BFF` | Profile, Lab 2, badges |
| Orange | `oklch(0.75 0.20 25)` | `#FF7050` | Warnings, Lab 6 |
| Amber | `oklch(0.75 0.17 75)` | `#D9A430` | Settings, Lab 4, parent |

### Lab Colors (10 labs, all L=0.75)

| Lab | Name | OKLCH | HEX |
|-----|------|-------|-----|
| 1 | What IS AI? | `oklch(0.75 0.17 225)` | `#0FB8FA` |
| 2 | Teaching Machines | `oklch(0.75 0.19 295)` | `#B67BFF` |
| 3 | The Brain Inside | `oklch(0.75 0.19 345)` | `#FF70AF` |
| 4 | AI That Creates | `oklch(0.75 0.17 75)` | `#D9A430` |
| 5 | AI Helpers | `oklch(0.75 0.19 155)` | `#00D17A` |
| 6 | AI & Ethics | `oklch(0.75 0.20 25)` | `#FF7050` |
| 7 | Computer Vision | `oklch(0.75 0.14 195)` | `#10BAD2` |
| 8 | Words & Language | `oklch(0.75 0.15 275)` | `#8F96FA` |
| 9 | Build Your AI | `oklch(0.75 0.18 50)` | `#E68E28` |
| 10 | AI Futures | `oklch(0.75 0.19 325)` | `#DE5AEA` |

### Surfaces (OKLCH — low chroma darks)

| Token | OKLCH | Usage |
|-------|-------|-------|
| `--surface-base` | `oklch(0.13 0.02 260)` | Page background, deepest layer |
| `--surface-card` | `oklch(0.16 0.02 280)` | Card backgrounds |
| `--surface-elevated` | `oklch(0.19 0.02 290)` | Elevated panels, popovers |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `oklch(0.96 0.005 280)` | Headings, primary content |
| `--text-secondary` | `oklch(1.0 0 0 / 0.55)` | Body text, descriptions |
| `--text-muted` | `oklch(1.0 0 0 / 0.55)` | Labels, captions |
| `--text-dim` | `oklch(1.0 0 0 / 0.35)` | Decorative, watermarks |

### Chrome Bezel

| Token | Value | Usage |
|-------|-------|-------|
| `--chrome-edge` | `oklch(1.0 0 0 / 0.06)` | Outer bezel edge |
| `--chrome-highlight` | `oklch(1.0 0 0 / 0.12)` | Top highlight |
| `--chrome-specular` | `oklch(1.0 0 0 / 0.18)` | Specular reflection |

---

## 3. Typography

| Role | Font | CSS Variable | Tailwind Class |
|------|------|-------------|----------------|
| Display/Headers | Exo 2 | `--font-display` | `font-display` |
| Body Text | Sora | `--font-body` | `font-body` |
| Monospace/Code | JetBrains Mono | `--font-mono` | `font-mono` |
| Data/Numbers | Orbitron | `--font-data` | `font-data` |

**Banned fonts:** Fredoka, Nunito Sans, Inter, Roboto, Arial.

**Font loading:** Self-hosted via `next/font/google` with `display: 'swap'`. Fallback fonts have metric overrides (`size-adjust`, `ascent-override`) to prevent layout shift.

---

## 4. Components

### Chrome Frame
The signature visual element. A three-layer container: outer chrome bezel -> LED rim -> inner screen. Used around lab tiles, game panels, and featured cards.

```html
<div class="chrome-frame">
  <!-- Content renders inside the LED-rimmed viewport -->
</div>
```

### Glass Card (Use Sparingly)
Frosted glass effect with `backdrop-blur`. **Reserve for focal elements only** — modals, tooltips, active selections, overlays. Do NOT use for every surface (see ENH-GLASS-01).

### Holographic Button (3D)
Primary interactive element in the cockpit. Chrome frame, emissive glow on hover, haptic vibrate on click (20ms pulse). Uses `HolographicButton.tsx`.

### 3D Text (SDF)
All cockpit text uses troika-three-text SDF rendering via `@react-three/drei Text`. Crisp at any size, rotation, or zoom level. Font sizes in world units aligned to `TYPE_SCALE` tokens in `cockpitDesignTokens.ts`.

---

## 5. Layout System

### 3D Cockpit Architecture (CPA v2.0)
All dashboard content renders inside a persistent 3D cockpit canvas. Pages are **thin scene descriptors** — they call `useCockpitScene(mode)` and route data to 3D panels via `cockpitUIStore`.

**Zero HTML dashboard UI.** All visible content renders inside `CockpitCanvas` via `CockpitUILayer` quadrants:
- **Center:** Main content panel (page-specific)
- **Left:** Secondary info (activity, stats)
- **Right:** Secondary info (badges, notifications)
- **Bottom:** Fixed instruments (NavigationButtonGrid, VariableDialCluster)

### Cockpit Modes
Each page has a distinct cockpit feel:

| Mode | LED Color | Bloom | Particles | Notes |
|------|-----------|-------|-----------|-------|
| dashboard | Blue | 0.4 | 300 | Home page |
| arcade | Green-Amber | 0.5 | 500 | Game browser, energetic |
| labmap | Blue | 0.5 | 400 | Lab selection |
| lab | Lab color | 0.5 | 400 | Inside a lab |
| game | Dynamic | 0.3 | 200 | Gameplay (center scales 1.75x) |
| profile | Purple | 0.4 | 300 | User profile |
| celebration | Gold | 0.8 | 600 | Achievement unlock |

---

## 6. Depth & Layering

### Z-Index Token Scale (HTML Layer)

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 1 | Default content |
| `--z-cockpit-viewport` | 10 | 3D canvas viewport |
| `--z-scanlines` | 5 | CRT scanline overlay |
| `--z-vignette` | 4 | Vignette depth effect |
| `--z-overlay` | 50 | Dropdowns, popovers |
| `--z-skip` | 100 | Skip-to-content link |
| `--z-banner` | 200 | Demo/trial banners |
| `--z-modal` | 300 | Modals |
| `--z-toast` | 500 | Toast notifications |

### 3D Render Order
3D layer uses `renderOrder` (separate from CSS z-index):
- HolographicHUD: renderOrder 10
- Center panel: renderOrder 5
- Side panels: renderOrder 3

### Triangle Budgets

| Tier | Budget | Usage |
|------|--------|-------|
| System (Cockpit) | 37.8M | Always rendered |
| Flagship games | 20M | Full 3D immersion |
| FL-Lite games | 10M | Themed 3D environments |
| Standard games | 5M | Themed 3D environments |
| Total headroom | 50M | Desktop-ultra profile |

---

## 7. Do / Don't Rules

### DO
- Use `chrome-frame` as the primary container for all game and panel content
- Use OKLCH values in CSS, HEX equivalents in JS/Three.js
- Use `font-display` for headings, `font-body` for text, `font-data` for numbers
- Use semantic spacing tokens (`--space-sm`, `--space-lg`, `--space-section`)
- Use `rem` units for all sizing (scales with user font preferences)
- Provide `aria-label` on every interactive element
- Respect `prefers-reduced-motion` — check `useReducedMotion()` in game components
- Minimum 44x44px touch targets on interactive elements (`.touch-target` utility)

### DON'T
- Use `glass-card` on every surface — reserve for focal elements (modals, tooltips, active selections)
- Nest `glass-card` inside `chrome-frame` — the chrome frame IS the container
- Use bounce or elastic easing — use `ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`)
- Use gradient text for visual impact
- Use pure `#000000` or `#ffffff` — use `#0A0E16` (surface-base) and `#F0F0F4` (text-primary)
- Use hardcoded pixel values — use `rem` or spacing tokens
- Use arbitrary z-index values — use `--z-*` tokens
- Use Fredoka, Nunito Sans, Inter, Roboto, or Arial fonts
- Animate layout properties (width, height, margin) — only animate `transform` and `opacity`

---

## 8. Responsive Strategy

**Desktop-first (D3D-1).** SparkForge is designed for desktop screens with 50M triangle 3D rendering. No mobile code paths, no CSS fallbacks, no LOD system.

- **Target:** 1440px+ desktop screens at 60fps
- **Minimum:** 1280px (responsive scaling via viewport units)
- **3D text/HUD:** Viewport-responsive via `useThree().viewport.aspect`
- **Future mobile:** R3F-native LOD (Three.js LOD object), not CSS substitution

---

## 9. Agent Prompts

When generating SparkForge UI, use these constraints:

**For HTML/CSS components:**
```
- Dark mode only, surface-base (#0A0E16) background
- Use Tailwind classes: font-display, font-body, font-data, font-mono
- Wrap content in chrome-frame for game/panel contexts
- Use neon-blue for primary actions, spark-green for success
- All interactive elements need aria-label and min 44x44px
- Use oklch() for colors in CSS, hex for JS
```

**For 3D components:**
```
- Import from cockpitDesignTokens.ts for all constants
- Use drei Text (troika SDF) for all text rendering
- Register with sceneStore via setGameSceneContent
- Budget: check tier (Flagship 20M, FL-Lite 10M, Standard 5M)
- Materials: import from materials.ts presets
```

**For game components:**
```
- Wrap in GameShell with correct worldColor from config/labs.ts
- Phase flow: welcome → learn → play → complete
- Use useSafeTimeout for all timers
- Use useFilteredContent for difficulty-based content
- Use useReducedMotion for animation control
- Score: 10pts/correct default, call setMaxScore if different
```

---

*End of DESIGN.md v1.0 — SparkForge Frost-Prismatic Design System*
*Generated: April 13, 2026 | Source: CLAUDE.md v6.4 + UI/UX Audit Sprint 0-3*
