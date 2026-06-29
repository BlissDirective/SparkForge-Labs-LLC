# COCKPIT INTERFACE INTEGRATION PLAN

**Version:** 1.0 | **Date:** March 30, 2026 | **Author:** Claude Code + BlissDirective
**Goal:** Transform SparkForge from "3D backdrop + HTML overlay" into "cohesive 3D cockpit with embedded content"

---

## THE PROBLEM

The codebase has ~40 3D cockpit components and ~20 HTML dashboard pages built independently. Currently:

- The 3D cockpit renders as a **fixed background** (z-0, `pointer-events-none`)
- HTML pages render **on top** (z-10) as full-screen content that **obscures** the cockpit
- The user sees a standard web dashboard with a barely-visible 3D backdrop
- 5 critical 3D UI components are **orphaned** (built but never instantiated in the scene)

**The vision:** A futuristic Laboratory Control Station where the cockpit IS the interface.

---

## ASSESSMENT OF `cockpit-architecture.json`

### What's Correct and Valuable
- Scene graph composition order (5 layers) is well-defined
- Triangle budgets are specified per component (~37.8M cockpit total)
- Mode presets (bloom, camera, vignette, HUD per page type) are comprehensive
- State machine (overview -> lab-focus -> lab-page -> game -> celebration) is sound
- Keyboard navigation scheme is fully mapped
- 5 cockpit skins with unlock conditions defined
- Audio spatial zones with 10 zones and 16 event types

### What Needs Updating
| Item | Issue | Fix |
|------|-------|-----|
| `canvas.camera.position` | Shows `[0, 6.5, 7]` (overview) but code uses `[0, 0.65, 1.1]` (cockpit seat) | Update to match actual code |
| `triangleBudgets` | Shows old values (CockpitPanels 2M, LEDRim 200K) | Update to v3.0 budgets (CockpitPanels 4M, LEDRim 500K, 3D UI 5.5M) |
| `adaptiveCurvature` | References tablet/mobile/cssFallback | Remove per D3D-1 (desktop-only) |
| `lod` | 4 LOD levels (ultra/high/medium/low) | Remove per D3D-2 (always ultra, no LOD) |
| `fpsDegradation` | Includes "fall back to CSS frame" | Remove CSS fallback per D3D-1 |
| `progressiveEnhancement` | References tablet/mobile thresholds | Remove per D3D-1 |
| `zIndexStack` | Lists "CSS station-frame-css" and "CSS cockpit-indicators" as mobile fallback | Remove mobile layers |
| `fileRegistry.pending` | Lists dissolve.glsl, wormhole.glsl, useAdaptiveCockpit as pending | Mark as implemented (all exist) |
| Missing: 3D UI components | NavigationButtonGrid, VariableDialCluster, CenterViewportScreen not in scene graph | Add to sceneGraph.layers |
| Missing: cockpitBroadcastStore | Not referenced in storeDependencies | Add with 16 event types |

### What Needs Adding
- **Integration layer specification:** How HTML content maps to 3D viewport zones
- **Route-to-scene mapping:** Which Next.js routes trigger which cockpit modes
- **Content constraint regions:** Where HTML renders relative to cockpit geometry

---

## INTEGRATION PLAN: 6 PHASES

### Phase 1: Wire Orphaned 3D UI Components (Priority: CRITICAL)

**Goal:** Make the 3D cockpit visually present and interactive by instantiating the orphaned components.

**Files to modify:**
- `src/components/3d/CockpitCanvas.tsx` — Add 3 components to cockpitContent

**Changes:**
```
CockpitCanvas cockpitContent section:
  + <NavigationButtonGrid position={[0, -0.6, -1.85]} />
  + <VariableDialCluster position={[0, -0.3, -1.4]} />
```

CockpitCanvas spatialContent (inside SpatialDashboardContent):
```
  + <CenterViewportScreen labColor={effectiveLabColor} opacity={0.85} />
```

**Imports to add:**
```typescript
import { NavigationButtonGrid, VariableDialCluster, CenterViewportScreen } from './ui';
```

**Expected result:** 3D navigation buttons, page-aware dials, and viewport screen become visible in the cockpit.

---

### Phase 2: Constrain HTML Content to Cockpit Viewport Zone (Priority: CRITICAL)

**Goal:** Stop HTML pages from covering the entire screen. Constrain them to the center viewport area so the cockpit frame is visible around the edges.

**Files to modify:**
- `src/app/(dashboard)/layout.tsx` — Restructure the content area

**Current problem:**
```
motion.main → max-w-7xl mx-auto px-4 → takes full width, covers cockpit
```

**New approach:**
```
motion.main → positioned to match CenterViewportScreen bounds
  - Constrained to ~60% of viewport width, centered
  - Top offset to clear HUD area (~80px)
  - Bottom offset to clear StatusBar3D area (~60px)
  - Side margins to reveal SidePanels (left/right ~15% each)
  - Semi-transparent glassmorphic background
  - Rounded corners with chrome bezel border
```

**CSS changes to `globals.css`:**
```css
.cockpit-viewport-content {
  position: relative;
  z-index: 10;
  max-width: 960px;
  margin: 80px auto 60px;
  padding: 24px 32px;
  background: rgba(10, 14, 22, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 30px rgba(0, 187, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

**Expected result:** HTML content floats in a glassmorphic panel within the cockpit. Cockpit panels, LEDs, HUD, and side panels are visible around the content area.

---

### Phase 3: Connect Sidebar Navigation to Cockpit Broadcast (Priority: HIGH)

**Goal:** When users click sidebar items, the cockpit reacts with visual/audio feedback.

**Files to modify:**
- `src/components/layout/Sidebar.tsx` — Add broadcast on navigation
- `src/hooks/useStationMode.ts` — Ensure mode transitions trigger cockpit preset changes

**Changes to Sidebar.tsx:**
```typescript
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// In nav click handler:
broadcast({ type: 'page-navigate', source: 'sidebar', label: item.label });
```

**Expected result:** Clicking "Labs" in sidebar triggers LED pulse, HUD mode change, and panel color shift. The cockpit responds to every navigation action.

---

### Phase 4: Route-to-Scene Mode Mapping (Priority: HIGH)

**Goal:** Each Next.js route automatically sets the correct cockpit mode, so the 3D environment reconfigures per page.

**Current state:** `useStationMode` returns presets based on a `mode` string, but the mode is not automatically derived from the route.

**Files to modify:**
- `src/hooks/useStationMode.ts` — Add route-based auto-detection

**Add route detection:**
```typescript
import { usePathname } from 'next/navigation';

const pathname = usePathname();
const autoMode = useMemo(() => {
  if (pathname?.startsWith('/labs/')) return 'lab';
  if (pathname?.startsWith('/arcade/')) return 'game';
  if (pathname === '/labs') return 'labmap';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/settings') return 'profile';
  if (pathname?.startsWith('/parent')) return 'parent';
  if (pathname?.startsWith('/admin')) return 'admin';
  if (pathname === '/onboarding') return 'onboarding';
  return 'dashboard';
}, [pathname]);
```

**Expected result:** Navigating to `/labs` auto-switches cockpit to labmap mode (brighter bloom, lab nav side panels, HUD in minimap mode). Navigating to a game auto-dims the cockpit (D3D-B6).

---

### Phase 5: HTML Sidebar to 3D Sidebar Hybrid (Priority: MEDIUM)

**Goal:** Reduce the HTML sidebar's visual dominance. Make it a compact overlay that works alongside the 3D NavigationButtonGrid.

**Options (choose one):**

**Option A — Minimal HTML sidebar (recommended for Phase 1):**
- Collapse sidebar to icon-only (72px) by default
- Remove text labels from collapsed state
- Reduce opacity to 70% so cockpit shows through
- NavigationButtonGrid provides the "full navigation" in 3D

**Option B — Replace sidebar entirely with 3D navigation:**
- Remove HTML sidebar completely
- NavigationButtonGrid + keyboard nav become primary navigation
- HTML quick-access buttons for accessibility fallback only

**Option C — Hybrid toggle:**
- Sidebar auto-hides after 3 seconds of inactivity
- Hovering left edge reveals it
- NavigationButtonGrid always visible in 3D

---

### Phase 6: Hero Animation Entry + Scene State Initialization (Priority: MEDIUM)

**Goal:** First-time visitors see the Hero Animation, then transition seamlessly into the cockpit.

**Current state:** `sceneStore.activeScene` defaults to `'cockpit'`, so the hero animation never triggers.

**Fix:**
- On first visit (no `skipIntroAnimation` in localStorage), set `activeScene: 'hero'`
- After hero completes (19s or skip), call `completeHero()` which sets `activeScene: 'cockpit'`
- `cockpitStore.heroPhase` tracks: idle -> animating -> materializing -> complete

**Files to modify:**
- `src/app/(dashboard)/layout.tsx` or `AuthProvider.tsx` — Check first-visit flag
- `src/stores/sceneStore.ts` — Initial state logic

---

## ARCHITECTURAL DECISIONS FOR THIS PLAN

| ID | Decision | Rationale |
|----|----------|-----------|
| INT-1 | HTML content constrained to center 60% viewport | Cockpit frame (panels, LEDs, HUD) must be visible |
| INT-2 | Glassmorphic content panel with chrome bezel | Matches Frost-Prismatic aesthetic, content readable over 3D |
| INT-3 | NavigationButtonGrid is supplementary, not replacement for Sidebar | Accessibility requires HTML nav; 3D buttons enhance immersion |
| INT-4 | Route auto-detects cockpit mode | Eliminates manual mode management; presets handle everything |
| INT-5 | Sidebar defaults to collapsed (72px icon-only) | Maximizes cockpit visibility while maintaining navigation |
| INT-6 | Hero animation triggers on first visit only | Returning users go straight to cockpit |

---

## PRIORITY ORDER

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 2: Constrain HTML to viewport zone | Medium | HIGHEST — makes cockpit visible immediately |
| 2 | Phase 1: Wire orphaned 3D UI components | Low | HIGH — adds interactive 3D elements |
| 3 | Phase 4: Route-to-scene mode mapping | Low | HIGH — cockpit reacts to navigation |
| 4 | Phase 3: Sidebar broadcast integration | Low | MEDIUM — visual feedback loop |
| 5 | Phase 5: Sidebar hybrid | Medium | MEDIUM — reduces HTML dominance |
| 6 | Phase 6: Hero animation entry | Low | MEDIUM — first impression |

---

## ESTIMATED IMPACT

**Before integration:**
- User sees flat HTML dashboard with faint 3D background
- No interactive 3D elements
- Cockpit completely obscured by HTML content
- No visual response to navigation

**After integration:**
- User sees a futuristic cockpit with curved panels, glowing LEDs, and a holographic HUD
- HTML content floats in a glassmorphic panel in the center viewport
- 3D navigation buttons glow at the bottom of the cockpit
- Page-aware dials reconfigure when switching sections
- Sidebar clicks trigger cockpit-wide visual pulses
- Each page has a distinct cockpit mood (bloom, color, HUD mode)

---

## REFERENCE FILES

| File | Role |
|------|------|
| `src/components/3d/CockpitCanvas.tsx` | Main integration point — add orphaned components here |
| `src/app/(dashboard)/layout.tsx` | Content constraint — restructure HTML layout here |
| `src/components/3d/ui/index.ts` | Barrel export for 3D UI components |
| `src/hooks/useStationMode.ts` | Mode presets — add route auto-detection here |
| `src/stores/cockpitBroadcastStore.ts` | Event bus — wire sidebar here |
| `src/lib/3d/cockpit-architecture.json` | Architecture spec — update to match plan |
| `src/stores/sceneStore.ts` | Scene state — fix hero initialization here |

---

*End of Cockpit Interface Integration Plan v1.0*
