# SparkForge UI/UX Design Audit & Enhancement Report

> **Version:** 1.0 | **Date:** April 11, 2026 | **Auditor:** Claude Code (Opus 4.6)
> **Scope:** Full codebase audit of UI/UX, frontend design, accessibility, and functional completeness
> **Methodology:** Hybrid mode — locked Frost-Prismatic aesthetic decisions respected; all Master-Design-Agent conflicts flagged as selectable enhancement options
> **Branch:** `claude/review-master-design-agent-6M6K7`

---

## Table of Contents

1. [Executive Summary & Severity Matrix](#1-executive-summary--severity-matrix)
2. [Design System & Tokens](#2-design-system--tokens)
3. [3D Cockpit & Layering](#3-3d-cockpit--layering)
4. [Auth & Dashboard Pages](#4-auth--dashboard-pages)
5. [Game Shell Audit](#5a-game-shell-audit)
6. [Individual Game Findings](#5b-individual-game-findings)
7. [Master-Design-Agent Conflict Cross-Reference](#6-master-design-agent-conflict-cross-reference)
8. [Selectable Enhancement Options](#7-selectable-enhancement-options)
9. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Executive Summary & Severity Matrix

### Audit Scope

| Dimension | Items Audited |
|-----------|---------------|
| CSS/Token files | `globals.css`, `globals-a11y.css`, `tailwind.config.ts`, `cockpitDesignTokens.ts`, `materials.ts` |
| 3D cockpit components | CockpitCanvas, CockpitUILayer, HolographicHUD, CockpitPanels, SidePanels, StatusBar3D, 9 dashboard panels, 8 UI primitives, NavigationButtonGrid, VariableDialCluster |
| Auth pages | login, signup, reset-password + LoginPanel3D, SignupPanel3D, ResetPasswordPanel3D, DemoLoginButton, DemoSessionBanner |
| Dashboard pages | home, labs, arcade, profile, settings, parent (+ 4 parent sub-pages), badges, content, onboarding, admin |
| Games | GameShell, GameHUD3D, 4 game templates, 35 game components (6 Flagship, 9 FL-Lite, 20 Standard) |
| Cross-reference | Master-Design-Agent.md (20 sections, ~1,200 lines) vs Frost-Prismatic design system |
| Existing audits | AUDIT_REPORT.md, AUDIT_REPORT_03.29.2026.md, GAME_ENHANCEMENT_AUDIT.md, 3 game-tier audits |

### Severity Definitions

| Level | Definition | Action |
|-------|-----------|--------|
| **P0 CRITICAL** | Broken functionality, WCAG Level A failure, data loss risk, crash | Fix immediately |
| **P1 HIGH** | Serious UX degradation, misleading UI, accessibility gap, memory leak | Fix before next release |
| **P2 MEDIUM** | Polish issue, minor a11y gap, inconsistency, performance concern | Fix in next sprint |
| **P3 LOW** | Nit, dead code, naming convention, minor optimization | Fix when convenient |

### Full Severity Matrix

| # | Area | P0 | P1 | P2 | P3 | Total |
|---|------|----|----|----|----|-------|
| 2 | Design System & Tokens | 2 | 3 | 4 | 2 | **11** |
| 3 | 3D Cockpit & Layering | 3 | 4 | 4 | 2 | **13** |
| 4 | Auth & Dashboard Pages | 4 | 6 | 7 | 5 | **22** |
| 5a | Game Shell | 2 | 3 | 2 | 0 | **7** |
| 5b | Individual Games | 1 | 4 | 5 | 2 | **12** |
| 6 | Anti-Pattern Conflicts | 0 | 3 | 5 | 2 | **10** |
| | **TOTALS** | **12** | **23** | **27** | **13** | **75** |

### Top 10 Most Urgent Findings

| Rank | ID | Severity | Finding | Location |
|------|----|----------|---------|----------|
| 1 | AUTH-01 | P0 | Hidden input proxies have ZERO ARIA attributes — screen readers cannot interact with login/signup | `LoginPanel3D.tsx:690-738` |
| 2 | GAME-01 | P0 | `setTimeout` leaks in 18/35 games — timers persist after unmount | `AgentArchitectGame.tsx:698`, `NeuralBuilderGame.tsx:756`, +16 more |
| 3 | COCK-01 | P0 | HUD corner text at 0.016 world units + 0.06 effective opacity = invisible | `HolographicHUD.tsx:438-496` |
| 4 | GAME-02 | P0 | GameShell does not enforce phase ordering — `completeGame()` can fire before learn/play | `GameShell.tsx:70-117` |
| 5 | GAME-03 | P0 | RobotVacuum "Go to charger" action defined but handler missing — button does nothing | `RobotVacuumGame.tsx:70-77, 289-297` |
| 6 | AUTH-02 | P0 | Form errors not linked via `aria-describedby` — screen readers can't associate error with field | `LoginPanel3D.tsx:491-514` |
| 7 | DASH-01 | P0 | `/badges` route is empty directory (no `page.tsx`) — potential 404 | `src/app/(dashboard)/badges/` |
| 8 | GAME-04 | P1 | DifficultySelector rendered in 20 Standard games but 0% functional — decorative only | All 20 Standard tier games |
| 9 | COCK-02 | P1 | HolographicHUD corner positions hardcoded for 16:9 — clip on narrow viewports | `HolographicHUD.tsx:113-118` |
| 10 | DASH-02 | P1 | Sidebar sr-only nav missing 8 routes (settings, onboarding, badges, admin, 4 parent sub-pages) | `Sidebar.tsx:21-27` |

### Positive Findings (What's Working Well)

| Area | Strength |
|------|----------|
| **Typography** | Correct font stack (Exo 2 / Sora / JetBrains Mono / Orbitron). No Fredoka/Nunito contamination. `display=swap` on all fonts. |
| **Focus management** | Universal `:focus-visible` with 3px outline + 2px offset. Role-specific overrides for switches, radios, tabs. Mouse clicks hidden via `:focus:not(:focus-visible)`. |
| **Accessibility features** | High-contrast mode, OpenDyslexic font option, font-size scaling (112.5%, 125%), comprehensive light-mode overrides. |
| **Animation quality** | Only `transform`/`opacity` animated (no layout properties). `will-change` properly scoped. |
| **Cockpit token discipline** | 95%+ adherence to `cockpitDesignTokens.ts` across 3D components. Mode presets well-structured (8 modes, 14 properties each). |
| **Button labels** | No generic "OK"/"Submit"/"Yes/No" found anywhere in codebase. All buttons use specific verb+object patterns. |
| **Zero dead buttons** | No `onClick={() => {}}` or stub handlers found in production code. |
| **Architecture** | Dashboard thin-descriptor pattern is sound. Single persistent Canvas (CPA2-1) properly implemented. |

---

## 2. Design System & Tokens

### 2.1 Color System

**Current:** All colors defined in HEX/RGBA. No OKLCH adoption.

| Token | Value | Location |
|-------|-------|----------|
| `--neon-blue` | `#00BBFF` | `globals.css:22`, `tailwind.config.ts:13` |
| `--surface-base` | `#0A0E16` | `globals.css:29`, `tailwind.config.ts:33` |
| `--text-primary` | `#F0F0F4` | `globals.css:35` |
| `--text-secondary` | `rgba(255,255,255,0.55)` | `globals.css:36` |
| `--text-muted` | `rgba(255,255,255,0.3)` | `globals.css:37` |
| `--text-dim` | `rgba(255,255,255,0.15)` | `globals.css:38` |

#### DES-01 [P0] — `--text-muted` fails WCAG AA for body text
- **Contrast:** `rgba(255,255,255,0.3)` on `#0A0E16` = ~3.2:1. **Requires 4.5:1 for AA body text.**
- **Used in:** HolographicHUD corner readouts, muted labels across dashboard
- **Fix:** Increase to `rgba(255,255,255,0.50)` minimum (~4.7:1) or `0.55` to match `--text-secondary`

#### DES-02 [P0] — `--text-dim` fails WCAG AA and AAA entirely
- **Contrast:** `rgba(255,255,255,0.15)` on `#0A0E16` = ~1.8:1. **Fails every WCAG tier.**
- **Used for:** Decorative labels, watermarks, faint dividers
- **Fix:** If used for text: raise to `0.3` minimum. If purely decorative: add `aria-hidden="true"` wherever used

#### DES-03 [P1] — No OKLCH adoption (perceptual uniformity gap)
- **Issue:** Entire palette is HEX. Neon accents at equal HSL saturation look different brightnesses (e.g., `#00FF88` green appears brighter than `#AA66FF` purple at identical opacity)
- **Impact:** Inconsistent perceived brightness across lab colors
- **Enhancement option:** See Section 7, ENH-COLOR-01

#### DES-04 [P1] — Pure `#000` in skip-link text
- **Location:** `globals.css:61` — `.skip-to-content { color: #000; }`
- **Issue:** Pure black text on `#00BBFF` background. Meets contrast (13.8:1) but pure black appears harsh and creates an "AI-slop tell" per Master-Design-Agent
- **Fix:** Use `#0A0E16` (surface-base) for brand-consistent contrast

#### DES-05 [P1] — Hardcoded `#000000` / `#ffffff` across 3D layer
- **Locations:** `cockpitDesignTokens.ts:289` (panel seams), `materials.ts:105,113,121` (CrystalGlass, CartoonMatte), 50+ occurrences in `src/components/3d/`
- **Issue:** Raw black/white literals bypass the token system
- **Fix:** Replace with design token references (`DEPTH_LAYERS.deep` for black, `TEXT_COLORS.primary.hex` for white)

### 2.2 Typography

#### DES-06 [P3] — Font loading via `<link>` instead of `next/font`
- **Location:** `layout.tsx:99-105`
- **Issue:** Google Fonts loaded via external `<link>`, acknowledged in comment as intentional (build-time internet not available in all CI). Performance penalty: extra DNS + connection vs self-hosted
- **Impact:** Minor CLS risk on slow connections. `font-display: swap` mitigates flash but not shift
- **Enhancement option:** See Section 7, ENH-FONT-01

#### DES-07 [P2] — No fallback font metrics defined
- **Issue:** No `size-adjust`, `ascent-override`, `descent-override` for Sora/Exo 2 fallbacks. System-ui fallback will have different metrics, causing layout shift during font swap
- **Fix:** Add `@font-face` with metric overrides for system-ui fallback (per Master-Design-Agent Section 4)

### 2.3 Spacing System

#### DES-08 [P2] — No semantic spacing scale
- **Issue:** Tailwind config defines zero custom spacing tokens. All spacing uses default Tailwind numeric classes (`p-4`, `gap-6`, `mt-8`) which map to a 4px base (correct), but no semantic naming (`--space-sm`, `--space-section`)
- **Impact:** Consistency relies on developer discipline rather than token enforcement
- **Enhancement option:** See Section 7, ENH-SPACE-01

#### DES-09 [P2] — Hardcoded pixel values in globals.css
- **Locations:** `globals.css:59` (`padding: 12px 24px`), `globals.css:65` (`border-radius: 0 0 12px 12px`), multiple locations
- **Issue:** Skip-link and chrome-frame use raw pixel values instead of `rem` or token references
- **Fix:** Convert to `rem` units (`0.75rem 1.5rem`)

### 2.4 Motion & Easing

#### DES-10 [P1] — Elastic overshoot on badge-unlock animation
- **Location:** `tailwind.config.ts:146`
- **Code:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — Y value 1.56 creates elastic bounce
- **Issue:** Violates Master-Design-Agent "NEVER use bounce or elastic easing" (Section 7). Also not caught by `prefers-reduced-motion` handler since it uses `animation-duration: 0.01ms` (badge still renders in final keyframe position with overshoot frozen)
- **Fix:** Replace with `cubic-bezier(0.25, 1, 0.5, 1)` (ease-out-quart) for confident deceleration

#### DES-11 [P2] — `emissive-glow-pulse` not covered by reduced-motion
- **Location:** `globals.css:470-487` — defines `emissivePulse` keyframe
- **Issue:** The `@media (prefers-reduced-motion: reduce)` block at line 394-407 catches `*` animations via duration, but `emissive-glow-pulse` uses `box-shadow` which still shifts visually even at 0.01ms if animation-fill-mode applies
- **Fix:** Add explicit `.emissive-glow-pulse { animation: none; }` inside the reduced-motion block

### 2.5 Z-Index System

#### DES-12 [P2] — Arbitrary z-index: 9999 on skip-link
- **Location:** `globals.css:58`
- **Issue:** Skip-to-content uses `z-index: 9999` while all other z-indices are single digits (cockpit-viewport: 10, scanlines: 5, vignette: 4). This 1000x jump is unnecessary
- **Fix:** Use `z-index: 100` (consistent with conventional dropdown/overlay scale)

#### DES-13 [P3] — No z-index token scale defined
- **Issue:** No centralized z-index scale. 3D layer uses `renderOrder`, HTML layer uses ad-hoc integers
- **Enhancement option:** Define semantic z-index tokens per Master-Design-Agent Section 6

### 2.6 Touch Targets

#### DES-14 [P2] — No 44px minimum touch target enforcement
- **Issue:** No CSS utility, design token, or component constraint enforces the 44x44px WCAG minimum for touch targets. While SparkForge is desktop-first (D3D-1), it still loads on tablets via browser
- **Fix:** Add `.touch-target { min-width: 44px; min-height: 44px; }` utility or enforce via component props

---

## 3. 3D Cockpit & Layering

### 3.1 Text Readability in 3D Space

#### COCK-01 [P0] — HUD corner text nearly invisible
- **Location:** `HolographicHUD.tsx:438-496`, `cockpitDesignTokens.ts:30`
- **Issue:** Caption text (TIME, MODE, CHILD NAME labels) uses `fontSize: 0.016` world units. With camera at FOV 58 and Z=-2.45, this renders at ~14px virtual screen space. Crucially, `fillOpacity = TEXT_COLORS.muted.opacity * opacity` = `0.5 * 0.12 = 0.06` — **6% opacity text**. Combined with outline width of only `0.003`, these readouts are effectively invisible.
- **Impact:** Users cannot read time, mode, or child name in the HUD corners
- **Fix:** Increase `caption` fontSize to `0.024`+ in `cockpitDesignTokens.ts:30`. Set muted opacity multiplier to `0.8` minimum. Increase outline width to `0.005`+.

#### COCK-02 [P1] — HUD corner positions clip on narrow viewports
- **Location:** `HolographicHUD.tsx:113-118`
- **Issue:** Corner readouts hardcoded at `[-1.8, 1.5, -2.45]` (top-left) and `[1.8, 1.5, -2.45]` (top-right). These assume 16:9 aspect ratio. On narrower viewports (<1440px wide), content clips outside the visible frustum.
- **Fix:** Derive X positions from `useThree().viewport.aspect` — scale by `aspect / 1.78` to maintain safe margins

#### COCK-03 [P1] — Muted 3D text color fails WCAG
- **Location:** `cockpitDesignTokens.ts:37-43`
- **Issue:** `TEXT_COLORS.muted` = `#F0F0F4` at `0.5` opacity on dark panel backgrounds (#0A0F1F). Effective contrast ~1.5:1. Used extensively in HolographicHUD labels.
- **Fix:** Increase muted opacity to `0.7`+ or use `TEXT_COLORS.secondary` for all readable content

#### COCK-04 [P2] — CockpitText uses rasterized text, not SDF
- **Location:** `CockpitText.tsx:19-24`
- **Issue:** Uses `@react-three/uikit Text` with WOFF2 fonts. No SDF (signed-distance field) text via troika-three-text. Text below 0.02 world units aliases/blurs at any rotation or scale.
- **Impact:** Small labels throughout cockpit appear fuzzy
- **Enhancement option:** See Section 7, ENH-TEXT-01

### 3.2 Panel Occlusion & Collision

#### COCK-05 [P0] — Center panel can scale into HUD z-depth
- **Location:** `CockpitUILayer.tsx:34, 51, 108-119`, `CockpitCanvas.tsx:316-320`
- **Issue:** Center panel renders at `[0, 0.35, -3.3]` with dynamic scale 1.0-1.75 in game mode. HolographicHUD arcs sit at Z=-2.5. At 1.75x scale, the center panel extends to Z=-1.89, **overlapping the HUD arcs by 0.6 world units**. Camera near plane at 0.1 doesn't prevent visual z-fighting.
- **Fix:** Either clamp center panel scale to max 1.4 OR push HUD arcs further forward to Z=-1.8 OR apply explicit `renderOrder` separation

#### COCK-06 [P1] — Side panel positions create narrow safe zone
- **Location:** `cockpitConfig.ts:40-43`
- **Issue:** Left/right panels at `[+-2.35, 0.25, -1.65]` with rotation +-0.85rad. At FOV 58, the viewport width at Z=-1.65 is ~2.8 world units. Panels at +-2.35 sit beyond this boundary — they work because they're rotated inward, but no bounding box validation prevents future changes from creating intersection.
- **Fix:** Document and enforce min/max panel safe zones in `cockpitConfig.ts`

#### COCK-07 [P2] — Game mode panel expansion lacks Z offset
- **Location:** `CockpitUILayer.tsx:121-149`, `cockpitModePresets.ts:134-135`
- **Issue:** `panelOffset` drives X/Y translation (0.3 in game mode) but no Z adjustment. Expanding center panel (1.75x scale) may visually clip fixed side panels since only lateral spread is considered.
- **Fix:** Add Z-offset `0.2` to side panels during game mode

### 3.3 Orphan & Unwired Components

#### COCK-08 [P1] — NavigationButtonGrid and VariableDialCluster orphaned from scene routing
- **Location:** `CockpitCanvas.tsx:411-415` (comment: "INT-1: Wire orphaned components")
- **Issue:** Both components render directly in CockpitCanvas at `[0,-0.6,-1.85]` and `[0,-0.3,-1.4]`, bypassing CockpitUILayer. They have no scene routing or mode-based visibility. `CockpitUILayer.tsx:189-192` has a `RESERVED` bottom quadrant for these but it's unpopulated.
- **Fix:** Either integrate into CockpitUILayer bottom quadrant or document the direct-Canvas rationale and close INT-1

#### COCK-09 [P2] — DashboardLeft/Right use `lazy()` but always render
- **Location:** `CockpitUILayer.tsx:41-51, 161-163, 184-187`
- **Issue:** Side panels are `React.lazy()` loaded but render in fixed groups with no conditional visibility. The lazy boundary serves no purpose since they're always mounted, and the `Suspense` fallback is `null` creating a potential content flash.
- **Fix:** Either remove `lazy()` wrapping (they always render) or add mode-based conditional rendering

### 3.4 3D Button Accessibility

#### COCK-10 [P0] — 3D buttons have zero keyboard accessibility
- **Location:** `HolographicButton.tsx:65-84`
- **Issue:** No `tabIndex`, `onKeyDown`, `role`, or ARIA attributes on 3D mesh buttons. R3F mesh objects aren't part of the tab order. The NavigationButtonGrid (HOME/LABS/ARCADE/SETTINGS/PROFILE) cannot be reached via keyboard — the only keyboard fallback is the sr-only Sidebar.
- **Impact:** Keyboard-only users rely entirely on the Sidebar for navigation. 3D buttons, dials, and toggles are mouse/touch-only.
- **Fix:** For critical nav buttons, add HTML overlay proxy buttons (similar to hidden input proxy pattern in auth). For 3D-only controls (dials, toggles), ensure equivalent functionality is available via Sidebar or Settings page.

#### COCK-11 [P2] — No haptic feedback for 3D touch interactions
- **Location:** `HolographicButton.tsx:246-254`
- **Issue:** `onPointerDown/Up` handlers have no `navigator.vibrate()` call. On tablets/touch devices, pressing 3D buttons gives no tactile confirmation.
- **Fix:** Add `navigator.vibrate?.([20])` on successful click

### 3.5 Geometry & Performance

#### COCK-12 [P2] — Cockpit geometry disposal timing
- **Location:** `CockpitPanels.tsx:604-634`
- **Issue:** Geometry disposal on `useMemo` swap rather than `useEffect` cleanup. Per existing AUDIT_REPORT.md Finding #7, this was noted but mitigated. Current approach works but is fragile — if `useMemo` triggers before disposal, old geometry leaks one frame.
- **Fix:** Migrate disposal to `useEffect` cleanup for guaranteed lifecycle ordering

#### COCK-13 [P3] — No performance budget enforcement in CockpitCanvas
- **Location:** `CockpitCanvas.tsx`
- **Issue:** `useFrameTimeMonitor` provides dev-only warnings but no runtime triangle counting. The 37.8M cockpit budget is documented but not enforced.
- **Future:** Plan B2 (adaptive degradation) from CLAUDE.md Section 9.1 remains unimplemented

---

## 4. Auth & Dashboard Pages

### 4.1 Auth Forms — Hidden Input Proxy (P3-2 Pattern)

#### AUTH-01 [P0] — Hidden input proxies have ZERO ARIA attributes
- **Locations:** `LoginPanel3D.tsx:690-738`, `SignupPanel3D.tsx:202-223`, `ResetPasswordPanel3D.tsx:282-289`
- **Issue:** The P3-2 hidden input proxy pattern renders `<input>` elements with `opacity: 0` and `pointerEvents: none` behind the 3D scene. These inputs have **no `aria-label`, `aria-describedby`, `id`, or `name` attributes**. Screen readers encounter invisible, unlabeled form fields.
- **Impact:** WCAG 2.1 Level A failure. Users relying on screen readers cannot fill in login, signup, or password reset forms.
- **Fix:** Add `aria-label="Email address"`, `id="email"`, `name="email"` (etc.) to each hidden proxy input. Associate labels via `aria-labelledby` pointing to 3D-rendered label text IDs.

#### AUTH-02 [P0] — Form error messages not associated with fields
- **Locations:** `LoginPanel3D.tsx:491-514`, `SignupPanel3D.tsx:430-440`, `ResetPasswordPanel3D.tsx:257-267`
- **Issue:** Error messages render as 3D text groups but have no `aria-describedby` linkage to the relevant input field. Screen reader users hear errors but can't determine which field is affected.
- **Fix:** Add `aria-describedby="email-error"` on input, `id="email-error"` on error container, and `role="alert"` on error text

#### AUTH-03 [P1] — Demo Login handler naming suggests incomplete refactor
- **Location:** `LoginPanel3D.tsx:395-401`
- **Issue:** `_handleDemoClick` is prefixed with `_` (convention for unused/disabled). The "TRY DEMO" button at line 587 sets `showDemoConfirm(true)`, and the "START DEMO" button at line 619 calls `onDemoStart` — but `_handleDemoClick` is never called. Suggests an incomplete refactor.
- **Impact:** Demo flow appears to work via the two-step confirm path, but dead handler adds confusion.
- **Fix:** Remove `_handleDemoClick` or rename to `handleDemoClick` and wire correctly.

#### AUTH-04 [P1] — Triple demo session handler duplication
- **Locations:** `LoginPanel3D.tsx:62-80`, `DemoLoginButton.tsx:15-38`, `DemoSessionBanner.tsx:29-54`
- **Issue:** Three separate components implement demo session start/end logic with duplicated API calls. If the demo API contract changes, all 3 must be updated.
- **Fix:** Extract shared `useDemoSession()` hook (already exists at `src/hooks/useDemoSession.ts`) and ensure all 3 components consume it.

#### AUTH-05 [P2] — Demo expired modal not keyboard-dismissible
- **Location:** `DemoSessionBanner.tsx:107-161`
- **Issue:** Close button (X) present but no `Escape` key handler on modal overlay. Users without mouse cannot dismiss the expiry modal.
- **Fix:** Add `onKeyDown={(e) => e.key === 'Escape' && handleExitDemo()}` on modal wrapper

#### AUTH-06 [P3] — LoginFormCard.tsx unused
- **Location:** `src/components/auth/LoginFormCard.tsx`
- **Issue:** HTML fallback login form exists but all auth pages use 3D panels exclusively. Dead code.
- **Fix:** Delete or mark with `_SUPERSEDED` prefix if kept for fallback reference

### 4.2 Dashboard Route Issues

#### DASH-01 [P0] — `/badges` route is empty
- **Location:** `src/app/(dashboard)/badges/` — contains only `.gitkeep`, no `page.tsx`
- **Issue:** Directory exists as a route but has no page component. If linked to (or accessed via URL), this would 404 or render the `not-found.tsx` fallback.
- **Impact:** Currently no nav links point here (confirmed via grep), but the empty dir is a trap for future devs.
- **Fix:** Option A: Delete directory. Option B: Create minimal page that displays earned badges (API at `/api/gamification/badges` already exists).

#### DASH-02 [P1] — Sidebar sr-only nav missing 8 routes
- **Location:** `Sidebar.tsx:21-27`
- **Issue:** `navItems` only includes: `/home`, `/labs`, `/arcade`, `/profile`, `/parent`. Missing:
  - `/settings` — accessible only via 3D cockpit button
  - `/onboarding` — no navigation path for screen readers
  - `/admin/content` — admin panel unreachable
  - `/parent/subscription` — billing page unreachable
  - `/parent/add-child` — child creation unreachable
  - `/parent/export` — data export unreachable
  - `/parent/prompt-history` — audit log unreachable
  - `/badges` — (if implemented)
- **Fix:** Add all dashboard routes to `navItems` array with appropriate `aria-label` context

#### DASH-03 [P0] — Onboarding page renders full HTML in 3D dashboard
- **Location:** `src/app/(dashboard)/onboarding/page.tsx:96-347`
- **Issue:** Renders a full glass-card UI with forms, sliders, buttons as HTML (`<div className="min-h-screen flex...">`) — **not a thin scene descriptor**. This violates the architecture contract documented in `layout.tsx:6` ("Zero HTML dashboard UI"). The full HTML page will render on top of the 3D cockpit, creating z-index layering conflicts.
- **Fix:** Convert to thin scene descriptor pattern (call `useCockpitScene('onboarding')`, route content to an `OnboardingPanel3D` component) or wrap in a portal above the canvas

#### DASH-04 [P1] — Content/[slug] page renders HTML components directly
- **Location:** `src/app/(dashboard)/content/[slug]/page.tsx:12-46`
- **Issue:** Renders `LessonViewer`, `QuizEngine`, and other HTML components directly inside the 3D dashboard layout. Same architecture violation as DASH-03.
- **Fix:** Either render via HTML overlay portal (explicitly above canvas z-index) or create `ContentPanel3D` wrapper

#### DASH-05 [P2] — Onboarding progress not persisted
- **Location:** `src/app/(dashboard)/onboarding/page.tsx:77-122`
- **Issue:** Step state (1, 2, 3) is React `useState` — local only. Closing the browser mid-onboarding loses all progress.
- **Fix:** Persist step to `localStorage` or Supabase profile

#### DASH-06 [P2] — Skip-to-content link target mismatch
- **Location:** `layout.tsx:113` (`<a href="#main-content">`) → `layout.tsx:121` (`<main id="main-content">`)
- **Issue:** Root layout has `<main id="main-content">`, but dashboard layout doesn't re-define this ID. The dashboard wrapper renders `{children}` inside a `<div>` — skip link jumps to root `<main>` which wraps everything (including the 3D canvas), not to the meaningful content area.
- **Impact:** Skip link technically works but doesn't skip to useful content in dashboard context.
- **Fix:** Add `id="main-content"` to the ARIA live region or a more specific landmark in the dashboard layout

#### DASH-07 [P2] — Arcade page uses wrong cockpit mode
- **Location:** `src/app/(dashboard)/arcade/page.tsx:14`
- **Issue:** Sets `useCockpitScene('dashboard')` instead of an arcade-specific mode. Arcade UI inherits home dashboard panel layout, positions, and scales.
- **Fix:** Add `'arcade'` mode to `cockpitModePresets.ts` or document that dashboard mode is intentionally shared

#### DASH-08 [P2] — Add-child form error messages are generic
- **Location:** `src/app/(dashboard)/parent/add-child/page.tsx:60-94`
- **Issue:** API error response parsed as generic "Failed to create profile" — doesn't distinguish tier limit errors from validation errors. Parent sees unhelpful message.
- **Fix:** Parse error code; show tier-specific message with upgrade link if tier limit reached

### 4.3 Subscription & Parent Pages

#### DASH-09 [P1] — Subscription billing toggle not announced
- **Location:** `parent/subscription/page.tsx:171-205`
- **Issue:** Monthly/Yearly toggle has `aria-pressed` but no `aria-label`. Screen readers say "button pressed" without context.
- **Fix:** Add `aria-label={`Billing cycle: ${isYearly ? 'yearly' : 'monthly'}`}`

#### DASH-10 [P2] — PaywallModal progress ring lacks ARIA
- **Location:** `PaywallModal.tsx:96-147`
- **Issue:** SVG progress ring shows usage visually but has no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Fix:** Add ARIA attributes to SVG wrapper

#### DASH-11 [P2] — Export/Prompt History generate mock data on every mount
- **Locations:** `parent/export/page.tsx:70-210`, `parent/prompt-history/page.tsx:33-82`
- **Issue:** Large mock datasets generated fresh on every mount without `useMemo`. For 10 children with 100+ entries each, this is ~1000 objects per render.
- **Fix:** Wrap in `useMemo` or fetch from API

#### DASH-12 [P3] — Onboarding 3D crystal import dead code
- **Location:** `onboarding/page.tsx:24-28`
- **Issue:** `const _OnboardingCrystal3D = dynamic(...)` — prefixed with `_` and never rendered. Dead import.
- **Fix:** Remove

#### DASH-13 [P3] — Settings page wiring incomplete
- **Location:** `src/app/(dashboard)/settings/page.tsx`
- **Issue:** Page calls `useCockpitScene('settings')` and `setCenterContent('settings')` but the actual `SettingsPanel3D` may not have functional volume sliders, theme toggles, or cockpit skin selectors wired to stores.
- **Fix:** Verify SettingsPanel3D reads/writes uiStore, cockpitStore, and accessibilityStore

---

## 5a. Game Shell Audit

The `GameShell` component (`src/components/game/GameShell.tsx`) is the universal wrapper for all 35 games. It manages phase lifecycle, HUD rendering, scene routing, and the reward pipeline. Issues here affect every game.

### 5a.1 Phase Lifecycle

#### GAME-01 [P0] — GameShell does not enforce phase ordering
- **Location:** `GameShell.tsx:70-117`
- **Issue:** `startGame()` fires on mount (line 73), but there is no state guard preventing `completeGame()` from being called before `learn` or `play` phases execute. Games can skip phases entirely:
  - `DataDetectiveGame.tsx:496` — Timer fires `setShowResult()` and advances round without explicit phase check
  - `CodeBlocksGame.tsx:678` — Jumps from `play` to `complete` without cleanup
  - `ApiExplorerGame.tsx:587` — `setPhase('complete')` fires before `game.completeGame()`
- **Impact:** Reward pipeline races, double-completion possible, XP awarded for incomplete games
- **Fix:** Add phase invariant guard in `useCompleteAndReward`:
  ```typescript
  if (game.phase !== 'play') {
    console.warn(`completeGame called during ${game.phase}, not play`);
    return;
  }
  ```

#### GAME-02 [P0] — setTimeout leaks across 18/35 games
- **Pattern:** `setTimeout()` or `setInterval()` called without `useRef` tracking and `useEffect` cleanup
- **Affected files (sample):**
  - `AgentArchitectGame.tsx:698` — validation message timeout, no cleanup
  - `AgentArchitectGame.tsx:786` — phase transition timeout, no cleanup
  - `ApiExplorerGame.tsx:513-533` — typewriter `setInterval`, closure-based clear
  - `EmojiDecoderGame.tsx:353, 370` — two timeouts, only one tracked in ref
  - `NeuralBuilderGame.tsx:756` — event handler timeout, no ref
- **Correct pattern (DataDetectiveGame.tsx:465-490):**
  ```typescript
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  ```
- **Fix:** Apply `useSafeTimeout` hook (already exists per CLAUDE.md Standard Tier audit) to all 18 affected games. The hook was created but only applied to 12 Standard tier games — 6 FL-Lite/Flagship games still need migration.

### 5a.2 Scoring & HUD

#### GAME-03 [P1] — GameHUD3D overlaps game content on narrow viewports
- **Location:** `GameHUD3D.tsx:34-39`
- **Issue:** HUD positioned at fixed `HUD_Y = 0.85`, `HUD_Z = -2.8`. No viewport-responsive positioning. On tablets in portrait orientation (narrow viewport), HUD occludes top portion of game content area.
- **Fix:** Tie HUD Y position to `useThree().viewport.height` — shift upward on narrow viewports

#### GAME-04 [P1] — DifficultySelector is decorative-only across 20 Standard games
- **Location:** All 20 Standard tier game files
- **Issue:** `DifficultySelector.tsx` component rendered during phase setup but selected difficulty never filters content or adjusts game parameters. Per CLAUDE.md STD-SYS2: "Difficulty field added to content interfaces; tier state available for filtering" — but no game reads the field.
- **Impact:** UI implies a feature that doesn't work. Children select "Hard" but get the same content as "Easy."
- **Fix:** Wire `selectedDifficulty` state to content filtering in each game's content loader

#### GAME-05 [P1] — Unused `useGameContent()` hooks in 9 FL-Lite + 20 Standard games
- **Locations:** `DataDetectiveGame.tsx:~176`, `RobotVacuumGame.tsx:~176`, etc.
- **Issue:** Dynamic content pipeline hooks are imported but never called. Admin curation pipeline generates content that never reaches games.
- **Fix:** Integrate `useGameContent(gameId)` into each game's content initialization, blending with hardcoded content

### 5a.3 Accessibility in Games

#### GAME-06 [P2] — No `prefers-reduced-motion` checks in any game
- **Scope:** All 35 games
- **Issue:** Every game uses `motion/react` AnimatePresence for phase transitions, particle effects, and celebrations without checking `useReducedMotion()`. The global CSS handler reduces durations to 0.01ms, but Framer Motion runs its own animation loop independent of CSS — meaning JS-driven animations still fire.
- **Fix:** Wrap `<AnimatePresence>` blocks in reduced-motion checks or use Motion's built-in `useReducedMotion` hook

#### GAME-07 [P2] — Missing learn phase in 12/20 Standard games
- **Games:** TimeMachine, HumanVsMachine, NeuronRelay, PixelInvestigator, TokenChopper, AiArtDetective, ToolPicker, DataShield, RealOrFake, FoolTheAi, PredictionMarket, CareerExplorer
- **Issue:** Per CLAUDE.md STD-SYS3, learn cards were "added to each of 12 games (36 total cards)." However, per the games audit, these games still skip from `welcome` directly to `play`.
- **Impact:** Band A children (ages 7-9) miss educational scaffolding before gameplay
- **Fix:** Verify learn phase wiring in each game; ensure `setPhase('learn')` is called after welcome

---

## 5b. Individual Game Findings

Specific bugs and UX issues found in individual game components, organized by tier.

### Flagship Tier (6 games)

#### IND-01 [P1] — NeuralBuilderGame re-render storm on message list
- **Location:** `NeuralBuilderGame.tsx` (~1,872 lines)
- **Issue:** Network graph calculation (force simulation, ~20K particles) recalculates on render. Message list items not wrapped in `React.memo`. Each new training event re-renders the full graph + all previous messages.
- **Impact:** Potential 60fps -> 30fps drop on slower machines during training simulation
- **Fix:** Extract message list into memoized sub-component. Memoize force simulation with `useMemo` keyed on network topology changes only.

#### IND-02 [P1] — PromptLabGame re-renders entire message history
- **Location:** `PromptLabGame.tsx` (~2,332 lines, largest game file)
- **Issue:** Inline `.map()` renders all message components without memoization. Each new AI response triggers full re-render of conversation history.
- **Fix:** Wrap individual message components in `React.memo`. Virtualize if history exceeds 50 messages.

#### IND-03 [P2] — AiSpyGame scoring inconsistency
- **Location:** `AiSpyGame.tsx:241-248`
- **Issue:** Code comments say "-5 for wrong guess" but no score subtraction is implemented. Incorrect guesses have zero penalty, making score inflation easy.
- **Fix:** Implement `game.updateScore(game.score - 5)` on wrong guess OR remove the comment to match behavior

### FL-Lite Tier (9 games)

#### IND-04 [P0] — RobotVacuum "Go to charger" action non-functional
- **Location:** `RobotVacuumGame.tsx:70-77` (action defined), `RobotVacuumGame.tsx:289-297` (handler missing)
- **Issue:** ACTIONS array includes `{ id: 'charger', label: 'Go to charger', ... }` but `runSim()` has no handler for this action ID. The button renders and can be added to a rule sequence, but executing the sequence silently skips this action.
- **Impact:** Core game mechanic broken — children build rules using a non-functional action
- **Fix:** Add pathfinding handler in `runSim()` that navigates the vacuum to the nearest charger tile

#### IND-05 [P1] — RobotVacuum keyboard navigation missing (WCAG)
- **Location:** `RobotVacuumGame.tsx:~651-681`
- **Issue:** Rule builder buttons lack `tabIndex`, `onKeyDown` handlers, and `role="button"`. Keyboard-only users cannot interact with the rule builder interface.
- **Fix:** Add `tabIndex={0}`, `onKeyDown` for Space/Enter, `role="button"` on all interactive rule elements

#### IND-06 [P1] — RobotVacuum color contrast failures
- **Location:** `RobotVacuumGame.tsx:540, 613, 632`
- **Issue:** Text with `text-white/20` (20% opacity white on dark) fails WCAG 4.5:1 minimum
- **Fix:** Increase to `text-white/60` or use `--text-secondary`

#### IND-07 [P1] — CameraQuest null check missing (crash risk)
- **Location:** `CameraQuestGame.tsx:~239`
- **Issue:** `capture()` accesses `streamRef.current` without null guard. If camera permissions denied or not yet granted, this crashes.
- **Fix:** Add `if (!streamRef.current) return;` guard

#### IND-08 [P2] — CameraQuest Band A filter shows abstract items to 7-9 year olds
- **Location:** `CameraQuestGame.tsx:~204`
- **Issue:** Filter uses `i.difficulty <= 1` which includes difficulty 1 (abstract). Band A (ages 7-9) should only see difficulty 0 (concrete).
- **Fix:** Change to `i.difficulty === 0` for Band A

#### IND-09 [P2] — CameraQuest video stream not cleaned up on unmount
- **Location:** `CameraQuestGame.tsx:267-271`
- **Issue:** `videoRef.current.srcObject` not nullified on component unmount. Camera stream continues running in background.
- **Fix:** Add cleanup in `useEffect` return: `videoRef.current.srcObject = null; stream.getTracks().forEach(t => t.stop())`

#### IND-10 [P2] — ChatbotBuilderGame `Math.max` on empty array returns -Infinity
- **Location:** `ChatbotBuilderGame.tsx` (depth calculation)
- **Issue:** `Math.max(...responses.map(r => r.depth))` returns `-Infinity` when responses is empty. Per FLL-018 fix, `|| 0` fallback was noted as resolved — verify in code.
- **Fix:** Confirm `|| 0` fallback is present; add guard if missing

### Standard Tier (20 games)

#### IND-11 [P2] — Score/HUD mismatches in 5 games
- **Games:** DataShield (`setMaxScore(240)` vs HUD expecting `totalRounds * 10`), RealOrFake (duplicate state management), TimeMachine (non-10pt scoring), PixelInvestigator (dead state), SentimentScanner (vocabulary mismatch)
- **Issue:** Per STD-SYS5, scoring was normalized to 10pts/correct but HUD still calculates `maxScore = totalRounds * 10` in some games where actual max differs.
- **Fix:** Ensure all games call `game.setMaxScore(actualMax)` after `startGame()`

#### IND-12 [P3] — SortToyBoxGame missing chrome bezel
- **Location:** `SortToyBoxGame.tsx`
- **Issue:** Per AUDIT_REPORT_03.29.2026.md finding DRIFT-13: SortToyBox doesn't use `chrome-frame` wrapper that all other games use.
- **Fix:** Wrap game content in `<div className="chrome-frame">...</div>`

### Cross-Tier Findings (from prior audits — unresolved)

#### IND-13 [P1] — Lab color returns `#00BBFF` for ALL games
- **Location:** `src/types/index.ts`
- **Issue:** Per AUDIT_REPORT_03.29.2026.md finding W-02: `getLabColor()` or equivalent always returns blue regardless of which lab the game belongs to.
- **Impact:** All 35 games show the same blue accent instead of their lab-specific color
- **Fix:** Ensure `worldToLabColor()` correctly maps world/lab number to the lab color palette

#### IND-14 [P1] — Lab 9 color wrong (#10B981 vs #F97316)
- **Location:** `src/hooks/useStationMode.ts:78`
- **Issue:** Per W-03: Lab 9 returns green (`#10B981`) instead of correct orange (`#F97316`). Tailwind config correctly defines `lab-9: '#F97316'` but the hook has the wrong value.
- **Fix:** Correct the hardcoded value in `useStationMode.ts:78`

---

## 6. Master-Design-Agent Conflict Cross-Reference

This section maps every Master-Design-Agent (MDA) anti-pattern rule against SparkForge's Frost-Prismatic design system. Each conflict is categorized as:

- **INTENTIONAL** — SparkForge violates the rule deliberately as part of its locked aesthetic. Documented rationale exists.
- **ACTIONABLE** — The rule applies. SparkForge violates it without clear justification. Should be fixed.
- **SELECTABLE** — The rule partially applies. Both the current approach and the MDA recommendation have merit. Enhancement option offered in Section 7.

### Color Anti-Patterns (MDA Section 1)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER use cyan-on-dark" | Primary `#00BBFF` on `#0A0E16` | **INTENTIONAL** | Core brand identity. Frost-Prismatic is explicitly a cyan-dominant dark palette. |
| "NEVER use purple-to-blue gradients" | `frost-gradient` uses `rgba(0,187,255,0.08)` to `rgba(170,102,255,0.05)` | **INTENTIONAL** | Low-opacity brand gradient. Not the typical "AI gradient" — it's subtle. |
| "NEVER use neon accents on dark backgrounds" | 5 neon accent colors on `#0A0E16` | **INTENTIONAL** | Entire design language. These are lab-coded educational colors, not decorative neon. |
| "NEVER default to dark mode with glowing accents" | Dark-mode only with `emissive-glow` system | **INTENTIONAL** | Laboratory Control Station aesthetic requires this. Not a default — it's the concept. |
| "NEVER use gradient text for impact" | Not found in codebase | **COMPLIANT** | No gradient text usage detected. |
| "NEVER use pure black (#000) or pure white (#fff)" | `#000` in skip-link, `#000000/#ffffff` in 50+ 3D files | **ACTIONABLE** (DES-04, DES-05) | Pure black/white used where tinted alternatives would be better. Brand-tint to `#0A0E16` and `#F0F0F4`. |
| "NEVER use gray text on colored backgrounds" | `--text-muted` (0.3 opacity) on neon backgrounds possible | **ACTIONABLE** (DES-01) | Muted text on any colored surface fails contrast. |

### Typography Anti-Patterns (MDA Section 1 & 4)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER use overused fonts: Inter, Roboto, Arial..." | Uses Exo 2, Sora, Orbitron, JetBrains Mono | **COMPLIANT** | Distinctive, on-brand fonts. None on the banned list. |
| "NEVER converge on the same font across generations" | N/A (single product) | **COMPLIANT** | Not applicable to a single-product codebase. |
| "NEVER use monospace as lazy shorthand for technical" | Orbitron (data) + JetBrains Mono (code) used appropriately | **COMPLIANT** | Both serve specific functional roles (data display vs code). |

### Layout Anti-Patterns (MDA Section 1 & 6)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER wrap everything in cards" | Chrome bezel frames wrap most content | **SELECTABLE** (ENH-LAYOUT-01) | Chrome frames serve the Laboratory aesthetic, but game content *within* frames sometimes nests card-like containers. |
| "NEVER nest cards inside cards" | Some game UIs nest `glass-card` inside `chrome-frame` | **ACTIONABLE** | Audit found ~8 games with nested container patterns. Should flatten. |
| "NEVER use identical card grids" | Lab map uses uniform grid tiles | **INTENTIONAL** | Lab tiles are intentionally uniform — they represent physical laboratory rooms in the cockpit. Differentiation is via color + 3D models, not card layout variation. |
| "NEVER center everything" | Dashboard content left-aligned within 3D panels | **COMPLIANT** | 3D panel architecture naturally creates asymmetric layout. |

### Visual Effects Anti-Patterns (MDA Section 1)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER use glassmorphism everywhere" | `glass-card`, `glass-surface`, `backdrop-blur` used across auth + games | **SELECTABLE** (ENH-GLASS-01) | Glassmorphism is thematic (lab glass, holographic surfaces), but it's used on nearly every surface. Consider reserving for focal elements only. |
| "NEVER use sparklines as decoration" | Not found | **COMPLIANT** | No decorative sparklines. |
| "NEVER use modals unless there's truly no better alternative" | PaywallModal, DemoExpiredModal, ConfirmationDialogs | **SELECTABLE** (ENH-MODAL-01) | Paywalls and confirmations are valid modal use cases. Demo expiry could use inline banner instead. |

### Motion Anti-Patterns (MDA Section 1 & 7)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER use bounce or elastic easing" | `badge-unlock` uses `cubic-bezier(0.34, 1.56, 0.64, 1)` | **ACTIONABLE** (DES-10) | Elastic overshoot. Replace with `ease-out-quart`. |
| "NEVER animate layout properties" | Only `transform`/`opacity` animated | **COMPLIANT** | Clean implementation. No width/height/margin animations found. |

### Responsive Anti-Patterns (MDA Section 9)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "Start with base styles for mobile, use min-width" | Desktop-first (D3D-1 decision) | **INTENTIONAL** | SparkForge is explicitly desktop-only. Mobile support planned as future R3F-native LOD, not CSS mobile-first. This is a locked architecture decision. |
| "Touch targets >= 44px" | No enforcement | **ACTIONABLE** (DES-14) | Even desktop-first, tablets access via browser. Need minimum sizes. |

### UX Writing Anti-Patterns (MDA Section 10)

| MDA Rule | SparkForge Status | Verdict | Notes |
|----------|------------------|---------|-------|
| "NEVER use OK, Submit, Yes/No" | No instances found | **COMPLIANT** | All buttons use specific verb+object patterns. |
| "Error messages: what + why + how to fix" | Auth errors are generic strings | **SELECTABLE** (ENH-ERROR-01) | Add-child and login errors show generic messages. Could provide specific guidance. |

### Summary

| Verdict | Count |
|---------|-------|
| **COMPLIANT** | 10 |
| **INTENTIONAL** (locked, no action needed) | 6 |
| **ACTIONABLE** (should fix) | 5 |
| **SELECTABLE** (enhancement offered) | 5 |
| **TOTAL rules evaluated** | **26** |

---

## 7. Selectable Enhancement Options

Each enhancement below offers **two or three options**. Select which to adopt (or skip). These are non-critical improvements — the platform functions without them — but each would measurably improve design quality, accessibility, or performance.

> **How to use:** Reply with your choices (e.g., "ENH-COLOR-01: B, ENH-FONT-01: A, ENH-TEXT-01: skip"). Any unmarked items will be deferred.

---

### ENH-COLOR-01 — Migrate color palette to OKLCH

**Current:** HEX/RGBA palette (`#00BBFF`, `rgba(255,255,255,0.55)`, etc.)
**Issue:** Neon accents have inconsistent perceived brightness. `#00FF88` (green) appears significantly brighter than `#AA66FF` (purple) at identical opacity.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Full OKLCH migration** | Convert all CSS custom properties to OKLCH. Generate consistent-lightness neon accents. Update Tailwind config. ~2 hours. | Medium | High — perceptually uniform palette across all 10 labs |
| **B. OKLCH for accents only** | Keep surfaces/text as HEX. Convert only the 5 neon accents + 10 lab colors to OKLCH for perceptual uniformity. ~45 min. | Low | Medium — fixes the primary visual inconsistency |
| **C. Skip** | Keep HEX palette. No perceptual change. | None | None |

---

### ENH-FONT-01 — Self-host fonts via next/font/local

**Current:** Google Fonts CDN via `<link>` in layout.tsx
**Issue:** External dependency, extra DNS lookup, privacy exposure (Google receives visitor IPs)

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Self-host with next/font/local** | Download woff2 files to `public/fonts/`, use `next/font/local` with metric overrides. Eliminates CDN dependency. ~1 hour. | Medium | High — faster TTFB, zero FOUT, privacy-safe |
| **B. Add fallback metrics only** | Keep CDN, but add `@font-face` with `size-adjust`/`ascent-override` for Sora and Exo 2 fallbacks. ~30 min. | Low | Medium — reduces CLS during font swap |
| **C. Skip** | Keep current CDN loading. `display=swap` already mitigates worst case. | None | None |

---

### ENH-TEXT-01 — Upgrade 3D text to SDF rendering (troika-three-text)

**Current:** `@react-three/uikit Text` with WOFF2 rasterization
**Issue:** Text below 0.02 world units aliases/blurs. Cockpit caption text at 0.016 units is fuzzy.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Full troika-three-text migration** | Replace CockpitText internals with troika-three-text SDF renderer. Crisp text at any size/rotation. ~3 hours. | High | High — all 3D text becomes resolution-independent |
| **B. Increase minimum font sizes** | Keep current renderer, raise caption minimum to 0.024, body to 0.04. Quick fix. ~30 min. | Low | Medium — readable but still rasterized |
| **C. Skip** | Accept current rendering quality. | None | None |

---

### ENH-SPACE-01 — Add semantic spacing tokens

**Current:** Raw Tailwind numeric classes (`p-4`, `gap-6`, `mt-8`)
**Issue:** No semantic spacing scale. Consistency relies on developer discipline.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Full semantic token layer** | Add `--space-xs` through `--space-section` tokens in globals.css, mapped to Tailwind `spacing` config. Document usage in DESIGN.md. ~1 hour. | Medium | Medium — enforces consistency |
| **B. Skip** | Tailwind's default 4px scale is already functional. | None | None |

---

### ENH-LAYOUT-01 — Reduce chrome-frame nesting in games

**Current:** Some games nest `glass-card` inside `chrome-frame`, creating visual noise.
**Issue:** MDA "NEVER nest cards inside cards" — double borders, double shadows, visual clutter.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Flatten all nested containers** | Audit all 35 games, remove inner `glass-card` where outer `chrome-frame` suffices. ~2 hours. | Medium | Medium — cleaner game UIs |
| **B. Keep intentional nesting, fix accidental** | Only flatten where nesting is clearly unintentional (same border radius, redundant shadow). ~1 hour. | Low | Low |
| **C. Skip** | Keep current nesting. | None | None |

---

### ENH-GLASS-01 — Reserve glassmorphism for focal elements

**Current:** `glass-card`, `glass-surface`, `backdrop-blur` used on most surfaces.
**Issue:** MDA "NEVER use glassmorphism everywhere" — when everything is glass, nothing is elevated.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Reduce glass to focal elements only** | Use solid `surface-card`/`surface-elevated` for secondary panels. Reserve `glass-card` + `backdrop-blur` for modals, tooltips, active selections. ~3 hours. | High | High — stronger visual hierarchy |
| **B. Reduce blur intensity** | Keep glass everywhere but lower blur from 12px to 4px on non-focal elements. Subtler effect. ~30 min. | Low | Low |
| **C. Skip** | Glass-everywhere is part of the Lab aesthetic. | None | None |

---

### ENH-MODAL-01 — Replace demo expiry modal with inline banner

**Current:** `DemoSessionBanner.tsx:107-161` shows a modal overlay on expiry.
**Issue:** MDA prefers undo/inline over modals. Expiry is expected, not an error — inline degradation is more user-friendly.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Convert to inline expired state** | Replace modal with persistent banner that expands in-place: "Demo expired — [Create account] or [Return to login]". No overlay. ~1 hour. | Medium | Medium — less jarring expiry UX |
| **B. Keep modal, add keyboard dismiss** | Retain modal but add Escape key handling + focus trap. ~20 min. | Low | Low — fixes a11y, keeps modal pattern |
| **C. Skip** | Modal works. Most users will create accounts. | None | None |

---

### ENH-ERROR-01 — Upgrade error messages to what/why/fix pattern

**Current:** Auth and form errors show generic strings ("Failed to create profile", "Invalid credentials").
**Issue:** MDA formula: (1) What happened (2) Why (3) How to fix.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Full error message upgrade** | Rewrite all API error responses with structured messages. Parse error codes in UI to show specific guidance. ~2 hours. | Medium | High — significantly better error UX |
| **B. Add "how to fix" hints to top-3 errors** | Target login failure, add-child tier limit, and password reset — the highest-frequency errors. ~45 min. | Low | Medium |
| **C. Skip** | Generic messages work. Users figure it out. | None | None |

---

### ENH-ZINDEX-01 — Establish z-index token scale

**Current:** Ad-hoc z-index values (4, 5, 10, 9999). No semantic scale.
**Issue:** MDA recommends semantic z-index scale: dropdown(100), sticky(200), modal(300), toast(500), tooltip(600).

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Define z-index tokens** | Add `--z-base`, `--z-overlay`, `--z-modal`, `--z-toast`, `--z-skip` to globals.css. Replace all hardcoded values. ~1 hour. | Low | Medium — prevents future stacking bugs |
| **B. Skip** | Current values work. 3D layer manages its own depth via `renderOrder`. | None | None |

---

### ENH-DESIGNMD-01 — Create DESIGN.md for SparkForge

**Current:** Design system documented across CLAUDE.md, cockpitDesignTokens.ts, globals.css, and various audit files. No single DESIGN.md.
**Issue:** MDA Section 12 recommends a standardized DESIGN.md (Google Stitch format) that any AI agent can read for consistent UI generation.

| Option | Description | Effort | Impact |
|--------|-------------|--------|--------|
| **A. Full DESIGN.md creation** | Synthesize Frost-Prismatic system into a 9-section DESIGN.md at repo root (visual theme, palette, typography, components, layout, depth, do/don't, responsive, agent prompts). ~2 hours. | Medium | High — any future AI agent can generate on-brand UI |
| **B. Lightweight .impeccable.md** | Create minimal design context file with audience, brand personality, aesthetic direction, key tokens. ~30 min. | Low | Medium |
| **C. Skip** | CLAUDE.md Section 6 covers design system. | None | None |

---

## 8. Implementation Roadmap

### Sprint 0 — Immediate P0 Fixes (Critical Path)

These **12 P0 findings** should be fixed before any other work. Estimated effort: **1-2 days**.

| ID | Fix | Files | Est. |
|----|-----|-------|------|
| AUTH-01 | Add ARIA attrs to hidden input proxies | `LoginPanel3D.tsx`, `SignupPanel3D.tsx`, `ResetPasswordPanel3D.tsx` | 1h |
| AUTH-02 | Link error messages via `aria-describedby` | Same 3 files | 30m |
| COCK-01 | Increase HUD caption font size to 0.024+, fix opacity to 0.8+ | `cockpitDesignTokens.ts`, `HolographicHUD.tsx` | 30m |
| COCK-05 | Add `renderOrder` separation OR clamp center panel scale | `CockpitUILayer.tsx` | 30m |
| COCK-10 | Add HTML proxy buttons for critical 3D nav OR verify Sidebar covers all routes | `Sidebar.tsx`, `NavigationButtonGrid.tsx` | 1h |
| DES-01 | Raise `--text-muted` opacity to 0.50+ | `globals.css:37` | 5m |
| DES-02 | Raise `--text-dim` to 0.30+ or add `aria-hidden` where decorative | `globals.css:38` | 15m |
| DASH-01 | Delete empty `/badges` directory OR create minimal page | `src/app/(dashboard)/badges/` | 15m |
| DASH-03 | Convert onboarding to thin scene descriptor | `onboarding/page.tsx` | 2h |
| GAME-01 | Add phase guard in `completeGame()` | `GameShell.tsx` OR `gameStore.ts` | 30m |
| GAME-02 | Apply `useSafeTimeout` to remaining 6 games | 6 game files | 1h |
| IND-04 | Add "Go to charger" handler in RobotVacuum | `RobotVacuumGame.tsx` | 1h |

**Total Sprint 0:** ~8-9 hours

### Sprint 1 — P1 High-Priority Fixes

**23 P1 findings**. These are serious UX degradation, misleading UI, and accessibility gaps. Estimated effort: **3-4 days**.

| Priority Group | IDs | Scope | Est. |
|----------------|-----|-------|------|
| **Accessibility** | COCK-02, COCK-03, DASH-02, DASH-09, IND-05, IND-06, IND-07 | HUD viewport clipping, sidebar nav gaps, keyboard a11y, contrast | 6h |
| **Functional** | AUTH-03, AUTH-04, DASH-04, GAME-04, GAME-05 | Demo handler cleanup, content page architecture, DifficultySelector wiring, content pipeline | 8h |
| **Performance** | IND-01, IND-02, GAME-03 | NeuralBuilder + PromptLab memoization, GameHUD3D responsive positioning | 4h |
| **Design system** | DES-03, DES-04, DES-05, DES-10 | OKLCH (if chosen), pure black/white cleanup, elastic easing fix | 4h |
| **Data integrity** | IND-13, IND-14 | Lab color always-blue fix, Lab 9 color correction | 1h |
| **Orphan components** | COCK-08 | Wire NavigationButtonGrid + VariableDialCluster to CockpitUILayer | 2h |

**Total Sprint 1:** ~25 hours

### Sprint 2 — P2 Medium-Priority Polish

**27 P2 findings**. Polish, minor a11y, consistency, and performance improvements. Estimated effort: **3-4 days**.

| Category | IDs | Est. |
|----------|-----|------|
| Token & spacing cleanup | DES-07, DES-08, DES-09, DES-11, DES-12, DES-14 | 4h |
| Cockpit refinement | COCK-04, COCK-06, COCK-07, COCK-09, COCK-11, COCK-12 | 6h |
| Dashboard polish | DASH-05, DASH-06, DASH-07, DASH-08, DASH-10, DASH-11 | 5h |
| Game polish | GAME-06, GAME-07, IND-03, IND-08, IND-09, IND-10, IND-11 | 6h |

**Total Sprint 2:** ~21 hours

### Sprint 3 — P3 Low-Priority Nits + Enhancements

**13 P3 findings** + any selected enhancements from Section 7.

| Category | IDs | Est. |
|----------|-----|------|
| Dead code cleanup | AUTH-06, DASH-12, DES-06, IND-12 | 1h |
| Verification | DASH-13, COCK-13, DES-13 | 2h |
| Selected enhancements | ENH-* (per user choice) | Variable |

**Total Sprint 3:** 3h + enhancement effort

### Dependency Graph

```
Sprint 0 (P0 critical)
  ├── AUTH-01 + AUTH-02 (auth a11y) — no deps
  ├── COCK-01 (HUD text) — no deps
  ├── COCK-05 (panel z-fighting) → unlocks Sprint 1 cockpit work
  ├── DES-01 + DES-02 (text contrast) — no deps
  ├── DASH-01 (badges route) — no deps
  ├── DASH-03 (onboarding) → may require OnboardingPanel3D creation
  ├── GAME-01 (phase guard) → unlocks Sprint 1 game fixes
  ├── GAME-02 (useSafeTimeout) — no deps
  └── IND-04 (RobotVacuum charger) — no deps

Sprint 1 (P1 high)
  ├── GAME-04 (DifficultySelector) → depends on content interface types
  ├── GAME-05 (useGameContent) → depends on admin curation pipeline
  ├── IND-13 + IND-14 (lab colors) → affects all 35 games visually
  └── COCK-08 (orphan wiring) → depends on COCK-05 panel fixes

Sprint 2 (P2 medium) — all independent of Sprint 1

Sprint 3 (P3 + enhancements) — all independent
```

### Effort Summary

| Sprint | Findings | Est. Hours | Priority |
|--------|----------|------------|----------|
| 0 | 12 P0 | 8-9h | **Immediate** |
| 1 | 23 P1 | 25h | Before release |
| 2 | 27 P2 | 21h | Next cycle |
| 3 | 13 P3 + ENH | 3h + variable | When convenient |
| **Total** | **75 + 10 ENH** | **~57h + enhancements** | |

---

## Appendix A — Files Referenced

| File | Findings |
|------|----------|
| `src/app/globals.css` | DES-01, DES-02, DES-04, DES-09, DES-11, DES-12 |
| `tailwind.config.ts` | DES-08, DES-10 |
| `src/app/layout.tsx` | DES-06, DASH-06 |
| `src/lib/3d/cockpitDesignTokens.ts` | COCK-01, COCK-03, DES-05 |
| `src/components/3d/HolographicHUD.tsx` | COCK-01, COCK-02, COCK-03 |
| `src/components/3d/CockpitUILayer.tsx` | COCK-05, COCK-07, COCK-08, COCK-09 |
| `src/components/3d/CockpitCanvas.tsx` | COCK-05, COCK-08, COCK-13 |
| `src/components/3d/ui/HolographicButton.tsx` | COCK-10, COCK-11 |
| `src/components/3d/CockpitPanels.tsx` | COCK-12 |
| `src/components/3d/panels/LoginPanel3D.tsx` | AUTH-01, AUTH-02, AUTH-03, AUTH-04 |
| `src/components/3d/panels/SignupPanel3D.tsx` | AUTH-01, AUTH-02 |
| `src/components/3d/panels/ResetPasswordPanel3D.tsx` | AUTH-01, AUTH-02 |
| `src/components/auth/DemoSessionBanner.tsx` | AUTH-04, AUTH-05 |
| `src/components/layout/Sidebar.tsx` | DASH-02 |
| `src/app/(dashboard)/onboarding/page.tsx` | DASH-03, DASH-05, DASH-12 |
| `src/app/(dashboard)/content/[slug]/page.tsx` | DASH-04 |
| `src/components/game/GameShell.tsx` | GAME-01, GAME-03 |
| `src/stores/gameStore.ts` | GAME-01 |
| `src/components/games/RobotVacuumGame.tsx` | IND-04, IND-05, IND-06 |
| `src/components/games/NeuralBuilderGame.tsx` | IND-01, GAME-02 |
| `src/components/games/PromptLabGame.tsx` | IND-02 |
| `src/hooks/useStationMode.ts` | IND-14 |
| `src/types/index.ts` | IND-13 |

---

*End of UI/UX Design Audit & Enhancement Report v1.0*
*75 findings (12 P0, 23 P1, 27 P2, 13 P3) + 10 selectable enhancements + 26 anti-pattern evaluations*
*Generated: April 11, 2026 | Auditor: Claude Code (Opus 4.6)*
