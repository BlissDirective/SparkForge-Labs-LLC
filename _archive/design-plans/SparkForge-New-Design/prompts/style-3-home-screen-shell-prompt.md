# v0 Prompt — Home Screen Shell (Style 3: Holo-Deck Dashboard)

**Target:** v0.dev (also strong fit for Lovable, motionsites.ai for the hero fold).
**Attach:** `../design-specs/style-3-cyberpunk-apple.json`
**Output target:** complete `/home` page mockup at `app/home/page.tsx` + supporting fold + floating components.

> Sibling prompts: `style-3-lab-map-widget-prompt.md`, `style-3-floating-dock-prompt.md`. Generate this shell first; the fold-mission bento grid uses `BentoLabTile` from the existing `style-3-bento-tile-prompt.md`.

---

## Paste this into v0

Build the SparkForge `/home` page — **"Holo-Deck Dashboard"** aesthetic. **Apple-style vertical-scroll dashboard** with cyberpunk holographic accents (iridescent rings, magenta/teal vortex hero, low-poly geometric corners). This is a **clean-sheet redesign** — discard the cockpit metaphor entirely. Light + dark mode. Use the attached `style-3-cyberpunk-apple.json` for ALL design tokens.

This generates the **shell** — top bar, 5 distinct scroll folds, and slot placeholders for the lab map widget and floating dock (those have sibling prompts).

### Architecture overview (from spec `architecture.zoneGrid`)

Single column, max-width 1280 px, vertical scroll with optional `scroll-snap-type: y mandatory`. Five folds plus persistent floating layers:

```
┌─ TopBar (transparent → glass on scroll) ──────────┐
├─ Fold 1: Hero (92vh)                              │
│   eyebrow • huge greeting • streak stat • CTA pair│
├─ Fold 2: Mission bento grid (auto, ≥100vh)        │
│   eyebrow • title • bento grid of 11 lab tiles    │
├─ Fold 3: Momentum (auto, ≥60vh)                   │
│   continue card + recent activity column          │
├─ Fold 4: Lab map widget (auto, ≥70vh)             │
│   eyebrow • title • <LabMapOrbit /> (slot)        │
├─ Fold 5: Daily challenge + Sparky guide (≥60vh)   │
│   2-column equal split                            │
└────────────────────────────────────────────────────┘
+ Floating dock (anchored bottom-center, persistent)
+ Background vortex bloom (fixed, scroll-parallax)
```

### Generate these components

1. **`<HomeShell>`** — outer wrapper, full-page background, fixed background vortex, scroll-snap container.
2. **`<TopBar>`** — transparent at scrollY=0, glass-blurred on scroll past 64 px.
3. **`<HeroFold>`** — fold 1.
4. **`<MissionFold>`** — fold 2 (bento grid using existing `<BentoLabTile />`).
5. **`<MomentumFold>`** — fold 3.
6. **`<OrbitFold>`** — fold 4 (slot for `<LabMapOrbit />`).
7. **`<DiscoverFold>`** — fold 5.

Floating dock comes from sibling prompt — for now, render `<div data-slot="dock" />` in `HomeShell`.

### Component specs

#### 1. `<HomeShell>`

- Outer: `<main className="holo-deck">`, `min-h-screen relative overflow-x-hidden`.
- Theme switching: `<html data-theme="light" | "dark">` toggleable, defaults to `prefers-color-scheme`.
- Page background:

  ```css
  /* Light mode */
  background:
    radial-gradient(circle 60vw at 70% 30%, rgba(178,44,255,0.18) 0%, transparent 50%),
    radial-gradient(circle 50vw at 20% 70%, rgba(31,227,214,0.20) 0%, transparent 55%),
    linear-gradient(180deg, #F7FAFD 0%, #E8F4FF 100%);
  background-attachment: fixed;

  /* Dark mode */
  [data-theme="dark"] .holo-deck {
    background:
      radial-gradient(circle 70vw at 65% 35%, rgba(178,44,255,0.45), transparent 55%),
      radial-gradient(circle 60vw at 25% 75%, rgba(31,227,214,0.30), transparent 60%),
      radial-gradient(circle 40vw at 50% 50%, rgba(122,45,224,0.25), transparent 50%),
      linear-gradient(180deg, #0B0F1E 0%, #050714 100%);
  }
  ```

- Scroll-snap (optional, toggleable in Settings):

  ```css
  .holo-deck { scroll-snap-type: y mandatory; }
  .fold { scroll-snap-align: start; }
  ```

  Wrap behind a `useScrollSnapPreference()` hook reading from a new `prefScrollSnap` value (default `true`).

- Use CSS scroll-driven animations on fold entry:

  ```css
  @supports (animation-timeline: view()) {
    .fold {
      animation: fold-reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
    @keyframes fold-reveal {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
  }
  ```

  Fall back to `IntersectionObserver` for browsers without `view()`.

#### 2. `<TopBar>`

Persistent, top-anchored, full-width.

- Default state (scrollY < 64 px): transparent, no blur.
- Scrolled state (scrollY ≥ 64 px): `backdrop-filter: blur(24px) saturate(180%)`, 1 px bottom border `rgba(255,255,255,0.18)`, `background: rgba(247,250,253,0.78)` (light) / `rgba(11,15,30,0.62)` (dark).
- Use `useScrollY` hook with `requestAnimationFrame` throttling.

Layout (flex, 64 px tall, padding 24 px horizontal):

- **Logo wordmark** left: `SparkForge`, `font-display` (Inter Display) 18 px weight 700, lab-1 color tint on the spark icon.
- **Tab row** center: `Home`, `Labs`, `Arcade`, `Achievements` — `font-body` 14 px weight 500, gap 32 px. Active tab: lab-color underline 2 px tall, animates from 0 width to full on mount with `motion/react` `layoutId`.
- **Avatar button** right: 36 px circle, child's avatar, drop-shadow `0 2px 8px rgba(0,0,0,0.12)`. Click → anchor-positioned profile menu.

```css
.profile-menu {
  position-anchor: --avatar-button;
  top: anchor(bottom);
  right: anchor(right);
  margin-top: 8px;
}
```

#### 3. `<HeroFold>`

Per `architecture.panels[fold-hero]`.

```jsx
<section className="fold fold-hero" data-fold="hero">
  <div className="hero-inner">
    <span className="eyebrow" style={{ color: focusedLabColor }}>TODAY, {dayName.toUpperCase()}</span>
    <h1 className="hero-title">
      Welcome back,<br />
      <span>{firstName}.</span>
    </h1>
    <p className="hero-stat iridescent-text">{streakDays}-day streak</p>
    <div className="hero-cta-row">
      <PrimaryButton>Continue Mission →</PrimaryButton>
      <SecondaryButton>Browse Labs</SecondaryButton>
    </div>
  </div>
  <LowPolyAccent className="absolute bottom-12 right-12" />
  <VortexBloom className="absolute inset-0 -z-10" />
</section>
```

- **Hero title:** `font-display` (Inter Display), `clamp(3rem, 7vw, 6.5rem)`, weight 700, tracking `-0.04em`, line-height 0.96.
- **Hero stat (iridescent-text):**
  ```css
  .iridescent-text {
    background: conic-gradient(from 0deg, #1FE3D6, #B22CFF, #FF4FC8, #1FE3D6);
    -webkit-background-clip: text; background-clip: text;
    color: transparent;
    animation: iridescent-spin 8s linear infinite;
  }
  ```
- **CTA pair:** Primary button is a 56 px-tall pill with iridescent ring border (animated 8 s) + dark glass body. Secondary is a transparent pill with 1 px white border.
- **VortexBloom** (decorative): three radial-gradient layers with `filter: blur(60px)` and `opacity: 0.6`. Positioned behind the title.
- **LowPolyAccent:** inline SVG triangle mesh, ~14 vw size, stroke teal 0.5 px, fill magenta/4%.

Hero scroll-driven shrink:

```css
.hero-title {
  animation: hero-shrink linear both;
  animation-timeline: view();
  animation-range: contain 0% exit 100%;
}
@keyframes hero-shrink {
  to { transform: scale(0.85); opacity: 0; }
}
```

#### 4. `<MissionFold>`

Per `architecture.panels[fold-mission]`.

- Eyebrow: `YOUR LABS` (Orbitron 12 px tracked 0.20em uppercase, lab-1 color).
- Title: `Where curiosity meets AI.` (`font-display`, clamp(2rem, 4vw, 3.5rem), weight 700, tracking -0.03em).
- 12-col CSS Grid bento, gap 24 px:
  - 1 hero tile (currentOrNext lab, `grid-column: span 6; grid-row: span 4`) — uses the existing `<BentoLabTile size="3x2" variant="hero" />`.
  - 10 satellite tiles (labs 1–10 except current/next, `grid-column: span 3; grid-row: span 2`).
  - 1 wide tile (Lab 11 Agentic AI, `span 6 / span 2`, label "NEW · Agentic AI").
- Each tile uses `<BentoLabTile />` from sibling prompt; pass props.
- Apply curvature on this fold ONLY: `transform: perspective(1400px) rotateX(3deg); transform-style: preserve-3d`.
- Tiles fade-in + translateY 24→0 with 60-ms stagger via `IntersectionObserver` (or `@scroll-timeline` if available).

#### 5. `<MomentumFold>`

Per `architecture.panels[fold-momentum]`.

Two-column grid (8/4 split), gap 32 px:

**Left column (8/12):** "Continue card" — a large bento tile (3 × 1 ratio) with:
- Game thumbnail (full-bleed bg image, 16:9 — placeholder gradient if none).
- Lab name + game title overlaid bottom-left.
- Progress bar (4 px tall, full width, lab-color fill).
- Time-since label: `Last played 2 hours ago`.
- Hover: thumbnail scales 1.04, "Resume" CTA appears bottom-right.

**Right column (4/12):** vertical list of 3 mini activity cards. Each:
- Game icon (32 px, lab-colored).
- Game title (`font-body` 15 px weight 600).
- Time + progress (`font-body` 12 px secondary).

#### 6. `<OrbitFold>`

Per `architecture.panels[fold-orbit]`.

- Eyebrow: `OR JUMP ANYWHERE`.
- Title: `The constellation.`
- Centered widget slot: `<div data-slot="lab-map-widget" />` — sibling prompt fills with `<LabMapOrbit />`.

#### 7. `<DiscoverFold>`

Per `architecture.panels[fold-discover]`.

Two-column equal split, gap 32 px:

**Left card: Daily Challenge**
- Eyebrow: `TODAY'S SPARK`.
- Title: `{challengeTitle}` (e.g., "Train a model in 5 minutes").
- Body: time estimate `~5 min`, reward `+50 XP`.
- CTA: `Begin →` (primary button).

**Right card: Sparky Guide**
- Eyebrow: `YOUR AI GUIDE`.
- Title: `Got a question?`
- Body: `Ask me about today's lab — I'm thinking ahead for you.`
- Sparky avatar (40 px circle, lab-color glow).
- CTA: `Open chat →`.

Both cards: glass `holo-card` (light) / `holo-card-dark` (dark), 28 px radius, padding 40 px.

### Background vortex bloom

A fixed absolutely-positioned layer behind ALL folds:

```jsx
<div className="vortex-bloom">
  <div className="bloom-mag"  />
  <div className="bloom-teal" />
  <div className="bloom-violet" />
</div>
```

```css
.vortex-bloom { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.bloom-mag, .bloom-teal, .bloom-violet { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.5; }
.bloom-mag    { width: 60vw; height: 60vw; left: 65%; top: 25%; background: #B22CFF; }
.bloom-teal   { width: 50vw; height: 50vw; left: 15%; top: 60%; background: #1FE3D6; opacity: 0.3; }
.bloom-violet { width: 40vw; height: 40vw; left: 45%; top: 45%; background: #7A2DE0; opacity: 0.25; }

/* Scroll-parallax: blooms drift slowly relative to scroll */
@supports (animation-timeline: scroll()) {
  .bloom-mag    { animation-timeline: scroll(root); animation: drift-mag    linear; }
  .bloom-teal   { animation-timeline: scroll(root); animation: drift-teal   linear; }
  .bloom-violet { animation-timeline: scroll(root); animation: drift-violet linear; }
  @keyframes drift-mag    { to { transform: translateY(-20vh); } }
  @keyframes drift-teal   { to { transform: translateY(-30vh); } }
  @keyframes drift-violet { to { transform: translateY(-15vh); } }
}
```

### Props

```ts
interface HomeShellProps {
  child: { id: string; firstName: string; level: number; xp: number; streakDays: number };
  focusedLabId: number;
  focusedLabName: string;
  focusedLabColorHex: string;
  dayName: string;                                    // "Tuesday"
  continueGame?: { thumbnail: string; labName: string; gameTitle: string; progress: number; lastPlayedAgo: string };
  recentActivity?: { id: string; gameTitle: string; labColor: string; timeAgo: string; progress: number }[];
  todaysChallenge?: { title: string; estMin: number; rewardXp: number };
  initialTheme?: 'light' | 'dark' | 'system';
}
```

### Motion (use `motion/react` + CSS scroll-driven where supported)

- Hero entrance: title cascade opacity 0→1 + translateY 24→0, 700 ms staggered (eyebrow 0ms, title 100ms, stat 250ms, CTAs 400ms).
- Topbar scroll behavior: `useScrollY` with rAF; transition backdrop-filter + background opacity 200 ms.
- Fold reveals: scroll-driven where supported, IntersectionObserver fallback.
- Hero scroll-shrink: scroll-driven scale + opacity (covered above).
- Bento tile entrance: 60 ms stagger when fold enters viewport.
- Reduced motion: scroll-snap off, scroll-driven animations off, fades only.

### Accessibility

- Semantic landmarks: `<header>` (topbar), `<main>` (folds), `<footer>` (after fold-discover, even if minimal).
- Each fold: `<section aria-labelledby="fold-{id}-title">`.
- Skip to content link to `#main-content`.
- Focus ring: outline 3 px solid `#1FE3D6`, halo box-shadow.
- WCAG AA verified: text on light bg = 17:1, text on dark bg = 16:1.
- `prefers-reduced-motion`, `prefers-contrast: more`, `prefers-reduced-transparency` all respected.
- Theme toggle is a real button with `aria-pressed`.
- Keyboard scroll: PageUp/PageDown jump folds.

### Constraints

- Use `Inter` and `Inter Display` — wire via next/font/google in `app/layout.tsx`.
- TypeScript strict.
- Files: `app/home/page.tsx` (server component), `src/components/home/*.tsx` for sub-components.
- No SparkForge-specific Frost-Prismatic imports — this is a clean theme.

### Export

```ts
export default function HomePage() { /* fetches child data */ }
export { HomeShell, TopBar, HeroFold, MissionFold, MomentumFold, OrbitFold, DiscoverFold };
```

---

## After v0 generates

1. Verify the page is a vertical scroll with 5 distinct folds, NOT a 4-zone grid.
2. Hero greeting should be huge (clamp(3rem, 7vw, 6.5rem)) — Apple-style, not cramped.
3. Streak stat in iridescent text should rotate its conic gradient over 8 s.
4. Scroll past 64 px — topbar should blur into glass.
5. The vortex bloom blobs should drift slightly as you scroll (parallax).
6. In the bento mission fold, the hero tile is the focused/next lab and is visually different (larger).

## If v0 misses the mark

- "The page is laid out as a 4-zone cockpit grid — that's style-1. THIS is a vertical-scroll page with 5 distinct fold sections stacked top to bottom."
- "Hero text is too small — bump to `clamp(3rem, 7vw, 6.5rem)` weight 700 with tracking `-0.04em`. This is Apple-product-page-hero size."
- "Iridescent text isn't iridescent — apply background: conic-gradient(...) with `-webkit-background-clip: text` and `color: transparent`, animated 8 s."
- "Topbar is opaque from page load — should be transparent at scrollY 0 and only blur into glass once scrolled past 64 px."
- "Bento mission grid is uniform — the hero tile (currentOrNext lab) should span 6 cols × 4 rows, the rest are 3×2 satellites."
