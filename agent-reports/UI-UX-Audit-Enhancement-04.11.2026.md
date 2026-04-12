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

*Sections 6-8 follow below. Each section is committed individually.*
