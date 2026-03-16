# 3D PANORAMIC COCKPIT ENHANCEMENT — v2.0

## Comprehensive Cockpit Architecture Upgrade Document

**Version:** 2.0 | **Date:** March 15, 2026 | **Status:** SPECIFICATION
**Supersedes:** COCKPIT_PANORAMIC_ARCHITECTURE_v1.md (March 14, 2026)
**Scope:** Full cockpit pipeline — geometry, materials, spatial dashboard, personalization, transitions, audio, navigation
**Prerequisites:** Enhancement 1.1 (Spatial Dashboard) + Enhancement 1.2 (Cockpit Personalization Engine) — both IMPLEMENTED

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Panoramic Panel System v2](#3-panoramic-panel-system-v2)
4. [Holographic HUD v2](#4-holographic-hud-v2)
5. [Spatial Dashboard Integration](#5-spatial-dashboard-integration)
6. [Cockpit Skin System v2](#6-cockpit-skin-system-v2)
7. [Transition Cinematics](#7-transition-cinematics)
8. [Interactive Console System v2](#8-interactive-console-system-v2)
9. [Ambient Life System v2](#9-ambient-life-system-v2)
10. [Audio Integration](#10-audio-integration)
11. [Performance Budgets & LOD](#11-performance-budgets--lod)
12. [Mobile Fallback Strategy](#12-mobile-fallback-strategy)
13. [Accessibility](#13-accessibility)
14. [File Registry](#14-file-registry)
15. [Decision Lock Additions](#15-decision-lock-additions)
16. [Migration Path from v1](#16-migration-path-from-v1)
17. [Cross-Stage Impact Matrix](#17-cross-stage-impact-matrix)

---

## 1. EXECUTIVE SUMMARY

### What Changed from v1

COCKPIT_PANORAMIC_ARCHITECTURE_v1.md introduced the curved panoramic cockpit (140° arc, CylinderGeometry panels, hex sub-panels, HolographicHUD, SidePanels, StatusBar3D, BarrelDistortion). Enhancement 1.1 then implemented the Spatial Dashboard (HolographicLabMap, CinematicCamera, InteractiveConsole3D, AmbientNPCs, DynamicEnvironment). Enhancement 1.2 added the CockpitSkinManager (5 themes with environmental visuals).

**v2.0 consolidates all three into a single coherent architecture** and adds:

| Feature | Status in v1 | Status in v2.0 |
|---------|-------------|----------------|
| Panoramic panel geometry (140° arc) | Implemented (CockpitPanels.tsx) | Enhanced — adaptive curvature per viewport, refined hex clusters |
| HolographicHUD (rings + scan lines) | Implemented (HolographicHUD.tsx) | v2 — data-driven rings, mini-map integration, threat/achievement radar |
| Spatial Dashboard (3D lab map) | Implemented (SpatialDashboard.tsx) | v2 — unified scene graph, shared postprocessing pipeline |
| Cockpit Skins (5 themes) | Implemented (CockpitSkinManager.tsx) | v2 — skin-reactive panel materials, per-skin HUD tint, transition FX |
| Transition Cinematics | Not implemented | NEW — lab entry wormhole, game launch zoom, achievement ceremony |
| Audio Integration | Not implemented | NEW — spatial audio zones, ambient per-skin soundscapes |
| Console System | Implemented (InteractiveConsole3D.tsx) | v2 — real-time data binding, expandable detail views |
| Mini-Map | Not implemented | NEW — persistent mini-map overlay with mission markers |
| NPC System | Implemented (AmbientNPCs.tsx) | v2 — dialogue bubbles, contextual reactions, pet companion slot |

### Design Philosophy

The cockpit is the **persistent spatial anchor** for the entire SparkForge experience. It should feel like a real command bridge — not a UI wrapper around flat content. Every element serves both an aesthetic purpose (immersion) and a functional purpose (navigation, information, feedback).

**Principles:**
1. **Function follows form:** Every decorative element conveys real data
2. **Continuous presence:** The cockpit never fully disappears — even in games, edges persist at reduced opacity
3. **Child-first:** All interactions are discoverable without text instructions
4. **Performance-first:** LOD degrades gracefully; mobile gets CSS equivalents, not broken 3D

---

## 2. ARCHITECTURE OVERVIEW

### Unified Scene Graph

v1 had separate R3F Canvas instances for StationFrame and SpatialDashboard. v2.0 merges them into a **single R3F Canvas** at `z-index: 0` with all cockpit elements as siblings in one scene graph.

```
R3F Canvas (fixed, full viewport, z-index: 0)
├── CinematicCamera (spring-damped, mode-aware)
├── AdaptiveDpr
├── Environment (HDR or preset fallback)
│
├── /* LAYER 1: Background */
├── CockpitSkinManager (skin-specific bg: stars/nebula/caustics/crystals/grid)
├── AuroraBackground (default skin only, fades for other skins)
│
├── /* LAYER 2: Spatial Content */
├── HolographicLabMap (10 labs in ring, core hologram)
├── InteractiveConsole3D ×4 (XP, badges, streak, progress)
├── AmbientNPCs (5 personality types + pet companion)
├── DynamicEnvironment (lab-reactive particles, multi-light)
│
├── /* LAYER 3: Cockpit Shell */
├── CockpitPanels (curved panoramic wrap + hex clusters)
├── LEDRim (curved arc, lab-colored)
├── SidePanels (left: radar/labNav, right: terminal/stats)
├── StatusBar3D (bottom gauge strip)
├── HolographicHUD (concentric rings, scan lines)
│
├── /* LAYER 4: Postprocessing */
├── EffectComposer
│   ├── Bloom (mode-dependent: CPA-7)
│   ├── Vignette (mode-dependent: CPA-8)
│   └── BarrelDistortion (mode-dependent: CPA-10)
│
└── /* LAYER 5: Transition FX (when active) */
    ├── WormholeTransition (lab entry/exit)
    ├── GameLaunchZoom (game focus sequence)
    └── CeremonyFX (achievement/level-up)
```

### Z-Index Stack (Full)

| z-index | Layer | Content |
|---------|-------|---------|
| 0 | R3F Canvas | All 3D content (single canvas) |
| 1 | CSS station-frame-css | Mobile fallback frame |
| 2 | CSS cockpit-indicators | Mobile side indicators + status bar |
| 5 | CSS scanline-overlay | CRT scanline effect |
| 10 | HTML SpatialOverlay | Lab info panel, nav hints, console quick-access |
| 15 | HTML MiniMapOverlay | Persistent mini-map (top-right) |
| 20 | HTML Dashboard Content | Actual page content (cards, grids, forms) |
| 50 | HTML Modal Layer | Modals, toasts, celebrations |

### Store Dependencies

```
cockpitStore (spatial nav, camera, skin, NPCs, consoles)
    ├── consumed by: SpatialDashboard, CinematicCamera, HolographicLabMap,
    │                InteractiveConsole3D, AmbientNPCs, SpatialOverlay,
    │                CockpitSkinManager, MiniMapOverlay
    └── persisted: cockpitSkin, focusedLabId, npcsVisible

deviceStore (LOD, FPS targets, triangle budgets)
    ├── consumed by: ALL 3D components (LOD gating)
    └── persisted: deviceType, hasSelected

uiStore (labColor, particleIntensity, sound, celebration)
    ├── consumed by: CockpitPanels, LEDRim, HolographicHUD, DynamicEnvironment
    └── drives: mode-dependent presets via useStationMode

childStore (XP, level, badges, streak, avatar, cosmetics)
    ├── consumed by: StatusBar3D, InteractiveConsole3D, SpatialOverlay
    └── drives: real-time gauge data
```

---

## 3. PANORAMIC PANEL SYSTEM v2

### 3.1 Adaptive Curvature

v1 used a fixed 140° arc. v2.0 introduces **viewport-adaptive curvature**:

| Viewport Width | Arc Degrees | Panel Radius | Rationale |
|---------------|-------------|-------------|-----------|
| > 1920px | 155° | 4.2 | Ultra-wide feels more immersive |
| 1440-1920px | 140° | 4.0 | Standard desktop (v1 default) |
| 1024-1439px | 120° | 3.6 | Tablet landscape, less peripheral |
| 768-1023px | 0° (CSS fallback) | — | Below threshold, use CSS frame |
| < 768px | 0° (CSS fallback) | — | Mobile, full CSS fallback |

**Hook:** `useAdaptiveCockpit()` — returns `{ arcDegrees, panelRadius, curvature }` based on `window.innerWidth` with debounced resize listener.

### 3.2 Hex Cluster Upgrades

v1 hex clusters were decorative. v2.0 makes them **functional**:

**Left Hex Cluster (3 hexes) — Lab Navigation:**
- Hex 1: Active lab indicator (pulsing lab color, lab number rendered as texture)
- Hex 2: Lab completion ring (fill = completion %)
- Hex 3: Next recommended lab (mission marker pulse)

**Right Hex Cluster (3 hexes) — Status Indicators:**
- Hex 1: XP rate indicator (sparkle speed = recent XP/min)
- Hex 2: Streak status (flame opacity = streak heat)
- Hex 3: Alert indicator (badge earned, friend request, challenge)

**Data Binding:**
```typescript
interface HexClusterData {
  left: {
    activeLabId: number;
    activeLabColor: string;
    labCompletion: number;        // 0-1
    recommendedLabId: number;
    recommendedLabColor: string;
  };
  right: {
    xpRate: number;               // XP earned per minute (rolling 5min window)
    streakHeat: number;           // 0-1 (0 = cold, 1 = on fire)
    alertCount: number;           // pending notifications
    alertType: 'badge' | 'challenge' | 'social' | null;
  };
}
```

### 3.3 Panel Material Reactivity

In v2.0, cockpit panel materials respond to the active skin:

| Skin | PanelFace Tint | Hex Edge Glow | Chrome Reflection |
|------|---------------|---------------|-------------------|
| Default | `#1a1e2e` | Lab color | Frost-Prismatic HDR |
| Cyberpunk | `#2a0030` | `#FF00FF` / `#00FFFF` | Neon grid reflection |
| Space | `#0a0a1e` | `#4444FF` | Starfield reflection |
| Underwater | `#0a1a2e` | `#00BBFF` | Caustic light pattern |
| Crystal | `#1a0828` | `#AA66FF` | Prismatic refraction |

Material tint transitions use the same 1-second smoothstep lerp as CockpitSkinManager.

### 3.4 Geometry Constants (Updated)

```typescript
export const COCKPIT_GEOMETRY_V2 = {
  // Base values (adapted by useAdaptiveCockpit)
  panelCurvature: 0.85,
  totalWrapArc: 140,            // degrees, overridden by adaptive
  panelRadius: 4.0,             // overridden by adaptive
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,
  hexDepth: 0.02,

  // NEW in v2
  hexDataTextureSize: 64,       // px, for lab number / indicator textures
  panelEdgeBevel: 0.005,        // subtle edge chamfer
  topBarSegments: 48,           // increased from 32 for smoother curve
  sideSegments: 24,             // increased from 16
} as const;
```

---

## 4. HOLOGRAPHIC HUD v2

### 4.1 Data-Driven Rings

v1 HUD had 3 purely decorative concentric rings. v2.0 maps each ring to real data:

| Ring | Radius | Data | Visual |
|------|--------|------|--------|
| Outer (r=3.2-3.5) | Session time | Ring fills clockwise over session duration (60min = full) |
| Mid (r=2.2-2.5) | Lab progress | 10 segments, each lit = lab completed |
| Inner (r=1.2-1.5) | XP to next level | Fill ring, pulsing at >90% |
| Core sphere | Current level | Size scales with level (1-50) |

### 4.2 Mini-Map Integration

The HUD doubles as a **mini-map** when in overview mode:

```
                    ╭───────────╮
                   │   Outer    │  ← Session timer ring
                   │  ╭──────╮ │
                   │  │ Labs │ │  ← 10 lab dots on mid ring
                   │  │  ●   │ │  ← Core = current position
                   │  ╰──────╯ │
                   │            │
                    ╰───────────╯

When lab-focus mode:
  - Focused lab dot enlarges and pulses
  - Connection beams from core to focused lab
  - Adjacent labs dim
  - Outer ring shows focused lab's completion %
```

### 4.3 Threat/Achievement Radar

The 12 radial scan lines become an **event radar**:

- **Achievement approaching:** Scan line glows gold when sweeping past a lab where the child is close to earning a badge
- **New content alert:** Scan line glows green when passing a lab with unplayed content
- **Challenge waiting:** Scan line glows orange for pending multiplayer challenges (future)
- **Sweep speed** adapts: faster during active gameplay, slower in idle overview

### 4.4 HUD Opacity Schedule (Updated)

```typescript
export const HUD_PRESETS_V2 = {
  dashboard:     { opacity: 0.15, rotationSpeed: 0.1,  pulseIntensity: 0.3, dataMode: 'minimap' },
  labmap:        { opacity: 0.18, rotationSpeed: 0.15, pulseIntensity: 0.4, dataMode: 'minimap' },
  lab:           { opacity: 0.20, rotationSpeed: 0.2,  pulseIntensity: 0.5, dataMode: 'labfocus' },
  game:          { opacity: 0.0,  rotationSpeed: 0,    pulseIntensity: 0,   dataMode: 'hidden' },
  celebration:   { opacity: 0.85, rotationSpeed: 0.4,  pulseIntensity: 1.0, dataMode: 'burst' },
  gameComplete:  { opacity: 1.0,  rotationSpeed: 0.5,  pulseIntensity: 1.0, dataMode: 'burst' },
  profile:       { opacity: 0.12, rotationSpeed: 0.08, pulseIntensity: 0.2, dataMode: 'stats' },
  onboarding:    { opacity: 0.10, rotationSpeed: 0.05, pulseIntensity: 0.15, dataMode: 'tutorial' },
} as const;
```

---

## 5. SPATIAL DASHBOARD INTEGRATION

### 5.1 Unified Canvas Architecture

v1 had potential for two Canvas instances (StationFrame canvas + SpatialDashboard canvas). v2.0 mandates a **single Canvas** managed by a top-level `<CockpitCanvas>` component:

```typescript
// src/components/3d/CockpitCanvas.tsx — NEW in v2.0
// Single R3F Canvas that contains ALL cockpit + spatial elements
// Replaces both StationFrame's Canvas and SpatialDashboard's Canvas

interface CockpitCanvasProps {
  mode: StationModeKey;
  labCompletions?: Record<number, number>;
  onLabEnter?: (labId: number) => void;
  children?: React.ReactNode;     // Game-specific 3D content injected here
}

export function CockpitCanvas({ mode, labCompletions, onLabEnter, children }: CockpitCanvasProps) {
  const profile = useDeviceStore(s => s.profile);
  const isMobile = useIsMobile();

  if (isMobile) return null; // CSS fallback handles mobile

  return (
    <div className="fixed inset-0 z-0" aria-label="3D Cockpit Environment" role="application">
      <Canvas
        frameloop="always"
        dpr={[1, profile.pixelRatio]}
        camera={{ position: [0, 6.5, 7], fov: 58, near: 0.1, far: 100 }}
        gl={{ antialias: profile.antialias, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <CockpitScene mode={mode} labCompletions={labCompletions} onLabEnter={onLabEnter}>
            {children}
          </CockpitScene>
        </Suspense>
      </Canvas>
    </div>
  );
}
```

> **R3F v9 WebGPU Integration (per Hero Animation v2.0, March 16 2026):**
>
> When upgrading CockpitCanvas to use `WebGPURenderer`, use R3F v9's async `gl` prop:
> ```typescript
> const createWebGPURenderer = async (canvas: HTMLCanvasElement) => {
>   const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true });
>   await renderer.init();
>   return renderer;
> };
>
> <Canvas gl={createWebGPURenderer} />
> ```
> `WebGPURenderer` auto-falls back to WebGL2 if WebGPU is unavailable.
> TSL shaders auto-compile to GLSL in WebGL2 mode. R3F v9 also requires
> `extend(THREE)` to register WebGPU elements in the R3F reconciler.
>
> The hero animation (`HeroAnimation.tsx`) renders INSIDE this same canvas architecture —
> the canvas is shared between the hero sequence and the persistent cockpit.
> See `Implementation_Plan_Hero_Page_Animation_v2.0.md` and `SparkForge_Hero_Page_Animation_v2.0.md`.

### 5.2 Scene Composition Order

Within `<CockpitScene>`, elements render in this order (painter's algorithm):

1. **Background layer:** CockpitSkinManager (stars, nebula, etc.) + AuroraBackground
2. **Spatial layer:** HolographicLabMap + DynamicEnvironment + InteractiveConsole3D ×4
3. **Ambient layer:** AmbientNPCs + PetCompanion3D
4. **Shell layer:** CockpitPanels + LEDRim + SidePanels + StatusBar3D + HolographicHUD
5. **Transition layer:** WormholeTransition / GameLaunchZoom / CeremonyFX (when active)
6. **Injected content:** `{children}` — game-specific 3D components
7. **Postprocessing:** EffectComposer (Bloom + Vignette + BarrelDistortion)

### 5.3 Mode Transitions

The CockpitScene responds to `StationModeKey` changes by orchestrating parallel transitions:

| Transition | Duration | Easing | Elements Affected |
|-----------|----------|--------|-------------------|
| dashboard → lab | 800ms | spring(300, 25) | Camera flies to lab, panels stay, HUD shifts to labfocus |
| lab → game | 600ms | easeInOut | Camera zooms into game, panels retract (curvature 0.3), HUD hides |
| game → lab | 400ms | easeOut | Camera pulls back, panels expand, HUD fades in |
| lab → dashboard | 800ms | spring(300, 25) | Camera returns to overview, all elements restore |
| any → celebration | 200ms | easeIn | Bloom spikes, HUD flares, panels pulse lab color |
| celebration → previous | 1200ms | easeOut | Gradual return to pre-celebration state |

---

## 6. COCKPIT SKIN SYSTEM v2

### 6.1 Skin-Reactive Elements (NEW)

v1 CockpitSkinManager only affected background (lights, fog, particles, background geometry). v2.0 extends skin reactivity to **all cockpit elements**:

| Element | Default | Cyberpunk | Space | Underwater | Crystal |
|---------|---------|-----------|-------|------------|---------|
| Panel tint | `#1a1e2e` | `#2a0030` | `#0a0a1e` | `#0a1a2e` | `#1a0828` |
| LED color | Lab color | `#FF00FF` | `#4444FF` | `#00BBFF` | `#AA66FF` |
| HUD ring color | Lab color | Magenta/Cyan alt | Deep blue | Aqua | Purple |
| Scan line sweep | White | Neon pink | Cool blue | Caustic pattern | Prismatic |
| Status bar glow | Lab color | Neon grid | Starlight | Ocean blue | Crystal refraction |
| NPC visor color | `#00BBFF` | `#FF00FF` | `#AACCFF` | `#66DDFF` | `#D946EF` |
| Console frame | Chrome | Dark chrome + neon edge | Brushed titanium | Corroded copper | Glass crystal |
| Particle physics | Drift | Drift (fast) | Sparkle (slow) | Rise (bubbles) | Sparkle + orbit |

### 6.2 Skin Unlock Progression

Skins are no longer freely selectable — they're **earned achievements**:

| Skin | Unlock Condition | Badge Earned |
|------|-----------------|--------------|
| Default (Frost-Prismatic) | Always available | — |
| Cyberpunk | Complete all Lab 9 games (Code Blocks, Career Explorer, API Explorer, My First AI App) | "Digital Pioneer" |
| Space | Earn 10,000 total XP | "Star Navigator" |
| Underwater | Maintain a 30-day streak | "Deep Diver" |
| Crystal | Complete ALL 35 games at least once | "Crystal Commander" |

**Preview mode:** Children can preview locked skins for 30 seconds via a "Try It" button in Settings. The preview shows the skin with a watermark overlay.

### 6.3 Skin Transition Effects (NEW)

When switching skins, a 2-second transition sequence plays:

1. **Dissolve out (0-0.5s):** Current skin elements fade via dithered dissolve shader
2. **Flash (0.5-0.7s):** Brief white flash (bloom spike to 2.0)
3. **Dissolve in (0.7-2.0s):** New skin elements materialize with particle burst
4. **Settle (2.0-2.5s):** All elements reach steady state

```typescript
// Dissolve shader uniform
uniform float uDissolveProgress;  // 0.0 = fully visible, 1.0 = fully dissolved
uniform float uNoiseScale;        // default 8.0

// In fragment shader:
float noise = snoise(vUv * uNoiseScale);
float threshold = uDissolveProgress * 1.2 - 0.1; // slight overshoot for clean edges
if (noise < threshold) discard;

// Edge glow at dissolve boundary
float edgeDist = abs(noise - threshold);
float edgeGlow = smoothstep(0.1, 0.0, edgeDist) * (1.0 - uDissolveProgress);
color += skinAccentColor * edgeGlow * 3.0;
```

---

## 7. TRANSITION CINEMATICS

### 7.1 Lab Entry Wormhole

When a child enters a lab (double-click or Enter key on focused lab):

**Sequence (2.5s total):**
1. **Camera acceleration (0-0.8s):** Camera flies toward focused lab structure at increasing speed
2. **Wormhole open (0.8-1.2s):** Torus geometry expands at lab position, inner surface has lab-colored energy shader
3. **Tunnel transit (1.2-2.0s):** Camera passes through torus into a **procedural tunnel** (CylinderGeometry, BackSide, animated UV shader with lab-colored energy streaks)
4. **Emerge (2.0-2.5s):** Tunnel dissolves, lab page content fades in, cockpit shell transitions to lab mode

**Component:** `src/components/3d/WormholeTransition.tsx`

```typescript
interface WormholeTransitionProps {
  active: boolean;
  targetLabId: number;
  targetPosition: [number, number, number];
  labColor: string;
  onComplete: () => void;   // Triggers route push
}
```

**Triangle budget:** ~2,000 tris (torus 500 + tunnel cylinder 1,000 + particle trail 500)
**Shader:** Custom GLSL energy flow (animated UV offset + Perlin noise distortion + lab-colored emissive)

### 7.2 Game Launch Zoom

When a child launches a game from within a lab:

**Sequence (1.5s total):**
1. **Console focus (0-0.4s):** Camera swoops to the game's position in the lab
2. **Frame morph (0.4-1.0s):** Station chrome bezel **morphs** from curved cockpit panels into the game's chrome bezel frame. This is achieved by animating `COCKPIT_GEOMETRY.panelCurvature` from 0.85 → 0.0 while the game's bezel fades in
3. **Game reveal (1.0-1.5s):** Game content fills central viewport, cockpit elements reach game-mode opacity

### 7.3 Achievement Ceremony

When XP popup / badge / level-up triggers:

**Sequence (3.0s total):**
1. **Bloom spike (0-0.3s):** Bloom intensity jumps to 1.0, vignette darkens
2. **HUD flare (0.3-1.0s):** All 3 HUD rings expand outward (scale 1.0 → 1.5), scan lines spin rapidly, core sphere pulses bright
3. **Panel pulse (1.0-1.5s):** Cockpit panels flash lab color (emissive spike), hex clusters flash in sequence (50ms stagger)
4. **Particle burst (1.5-2.0s):** 200 particles explode from center (additive blending, lab-colored, gravity-affected)
5. **Settle (2.0-3.0s):** All elements smoothly return to pre-ceremony state

**Component:** `src/components/3d/CeremonyFX.tsx`

```typescript
type CeremonyType = 'xp' | 'badge' | 'levelUp' | 'gameComplete' | 'streakMilestone';

interface CeremonyFXProps {
  type: CeremonyType;
  intensity: number;    // 0.5 for xp, 0.7 for badge, 1.0 for levelUp
  labColor: string;
  onComplete: () => void;
}
```

**Intensity scaling per type:**

| Type | Bloom Peak | Particle Count | HUD Expansion | Duration |
|------|-----------|---------------|---------------|----------|
| xp | 0.6 | 50 | 1.1x | 1.5s |
| badge | 0.8 | 100 | 1.3x | 2.0s |
| levelUp | 1.0 | 200 | 1.5x | 3.0s |
| gameComplete | 0.9 | 150 | 1.4x | 2.5s |
| streakMilestone | 0.7 | 80 | 1.2x | 2.0s |

---

## 8. INTERACTIVE CONSOLE SYSTEM v2

### 8.1 Real-Time Data Binding

v1 consoles displayed static data passed as props. v2.0 consoles **subscribe directly** to stores for real-time updates:

```typescript
// Console data sources (no prop drilling needed)
const consoleDataSources = {
  xp: {
    store: useChildStore,
    selector: (s) => ({ xp: s.activeChild?.xp ?? 0, level: s.activeChild?.level ?? 1 }),
    updateFrequency: 'realtime',  // Updates on every XP change
  },
  badges: {
    store: useChildStore,
    selector: (s) => ({ badges: s.badges, recentBadge: s.badges[s.badges.length - 1] }),
    updateFrequency: 'realtime',
  },
  streak: {
    store: useChildStore,
    selector: (s) => ({ streak: s.activeChild?.streak_count ?? 0 }),
    updateFrequency: 'session',   // Updates once per session start
  },
  progress: {
    store: useChildStore,  // + useProgress hook
    selector: (s) => ({ labsCompleted: 0, totalLabs: 10 }),  // Computed from progress data
    updateFrequency: 'realtime',
  },
};
```

### 8.2 Expandable Detail Views

Clicking a console in v1 just toggled an `activeConsole` state. v2.0 adds **detail panels**:

When a console is clicked:
1. Camera transitions to console view (existing behavior)
2. A glassmorphic HTML overlay appears adjacent to the 3D console
3. The overlay shows detailed information:

| Console | Detail Panel Content |
|---------|---------------------|
| XP | Level progress bar, XP history graph (last 7 days), next level requirements |
| Badges | Badge grid (earned + locked), recent badge highlight with description |
| Streak | Streak calendar (last 30 days), longest streak record, daily goal status |
| Progress | Per-lab completion grid, game completion counts, recommended next games |

**Detail panel component:** `src/components/dashboard/ConsoleDetailPanel.tsx`

### 8.3 Console Frame Styles per Skin

Each skin changes the console frame appearance:

```typescript
export const CONSOLE_FRAME_STYLES: Record<CockpitSkin, ConsoleFrameStyle> = {
  default:    { material: 'chrome',    edgeGlow: true,  transmission: 0.4, bracketStyle: 'angular' },
  cyberpunk:  { material: 'darkChrome', edgeGlow: true,  transmission: 0.3, bracketStyle: 'neon' },
  space:      { material: 'titanium',  edgeGlow: false, transmission: 0.5, bracketStyle: 'minimal' },
  underwater: { material: 'copper',    edgeGlow: true,  transmission: 0.6, bracketStyle: 'organic' },
  crystal:    { material: 'glass',     edgeGlow: true,  transmission: 0.8, bracketStyle: 'faceted' },
};
```

---

## 9. AMBIENT LIFE SYSTEM v2

### 9.1 Pet Companion Integration

Enhancement 1.2 introduced `PetCompanion3D.tsx` (a persistent cockpit pet from Pet Trainer game). v2.0 formalizes its behavior:

**Pet States:**
| State | Trigger | Behavior |
|-------|---------|----------|
| Idle | No activity for 30s | Bobs gently, occasionally looks around |
| Curious | Child hovers a lab | Turns to face the lab, antennae perk up |
| Excited | XP earned | Jumps, particle trail, celebration chirp |
| Guiding | Child is lost (no activity 2min) | Floats toward recommended lab, leaves trail |
| Sleeping | Idle for 5min+ | Settles on console, ZZZ particles, dims |
| Celebrating | Badge/level-up | Full celebration animation (spins, fireworks) |

**Pet perch positions:**
```typescript
const PET_PERCH_POSITIONS = {
  default: [1.5, 1.0, 2.0] as const,      // Floating beside right console
  console: [-1.0, 0.5, 3.0] as const,     // On console desk when sleeping
  focused: null,                            // Dynamic — near focused lab
  guiding: null,                            // Dynamic — path toward recommended lab
};
```

### 9.2 NPC Dialogue Bubbles

v1 NPCs were purely ambient (patrol, bob, blink). v2.0 adds **contextual speech bubbles**:

**Trigger conditions:**
| NPC Type | Trigger | Bubble Content (examples) |
|----------|---------|--------------------------|
| Scout | Child enters new lab for first time | "Welcome to the AI Lab! Ready to explore?" |
| Engineer | Child completes a game | "Great work! You're building real skills." |
| Medic | Child fails 3x in a row | "Don't worry — every scientist experiments!" |
| Guardian | Child approaches restricted content | "This one's for older explorers. Try this instead!" |
| Scholar | Child earns badge | "Did you know? [fun AI fact related to badge]" |

**Implementation:** Bubbles are **HTML overlays** positioned via `useThree().camera.project()` to track NPC world position. They appear for 4 seconds, then fade. Max 1 bubble at a time (queue system).

### 9.3 NPC Counts per Device (Updated)

| Device | NPCs | Pet | Total Ambient |
|--------|------|-----|---------------|
| Desktop (ultra) | 8 | 1 | 9 entities |
| Desktop (high) | 6 | 1 | 7 entities |
| Tablet | 4 | 1 | 5 entities |
| Mobile | 0 | 0 | CSS indicators only |

---

## 10. AUDIO INTEGRATION

### 10.1 Spatial Audio Zones

v2.0 introduces **positional audio** tied to cockpit elements:

```typescript
// Audio zone definitions
const COCKPIT_AUDIO_ZONES = {
  ambient: {
    source: 'generative',           // Tone.js synth pad
    position: [0, 0, 0],            // Center
    radius: 20,                      // Always audible
    volume: 0.15,
    skin_variations: true,           // Each skin has unique ambient
  },
  console_xp: {
    source: 'sfx/console-hum.mp3',
    position: [-3, -1, 2],          // XP console position
    radius: 4,
    volume: 0.3,
    trigger: 'proximity',           // Louder when camera is near
  },
  hologram_core: {
    source: 'generative',           // Soft oscillator
    position: [0, 0, 0],            // Center of lab map
    radius: 6,
    volume: 0.1,
    modulation: 'labColor',         // Pitch/timbre shifts with focused lab
  },
  led_rim: {
    source: 'sfx/electric-hum.mp3',
    position: [0, 3.5, -4],         // Top of cockpit arc
    radius: 5,
    volume: 0.05,
    trigger: 'always',
  },
};
```

### 10.2 Skin-Specific Soundscapes

| Skin | Ambient Tone | Particle Sound | Transition Sound |
|------|-------------|---------------|-----------------|
| Default | Low synth pad (C2, Sora-like) | Soft chime on drift | Crystal shimmer |
| Cyberpunk | Distorted bass (Fm7) | Electric zap | Neon buzz surge |
| Space | Deep space drone (Cm) | Twinkling (high sine) | Airlock whoosh |
| Underwater | Filtered bubbles (bandpass) | Pop on rise | Submersion gurgle |
| Crystal | Glass harmonica (Am) | Resonant ping | Prism refraction ring |

### 10.3 Audio Engine Architecture

```typescript
// src/lib/audio/cockpitAudio.ts — NEW in v2.0

export class CockpitAudioEngine {
  private context: Tone.Context;
  private ambientSynth: Tone.PolySynth;
  private sfxPlayers: Map<string, Tone.Player>;
  private panner3D: Tone.Panner3D;

  // Initialize with skin
  async initialize(skin: CockpitSkin): Promise<void>;

  // Update listener position (camera position)
  updateListenerPosition(position: [number, number, number]): void;

  // Transition between skins
  async transitionToSkin(newSkin: CockpitSkin, duration: number): Promise<void>;

  // Trigger spatial SFX
  playSpatial(soundId: string, position: [number, number, number]): void;

  // Set master volume (respects uiStore.sound setting)
  setVolume(volume: number): void;

  // Cleanup
  dispose(): void;
}
```

---

## 11. PERFORMANCE BUDGETS & LOD

### 11.1 Triangle Budget Breakdown (v2.0)

| Component | Desktop (Ultra) | Desktop (High) | Tablet | Mobile |
|-----------|----------------|----------------|--------|--------|
| CockpitPanels | 1,500 | 1,200 | 800 | 0 (CSS) |
| HexClusters | 300 | 300 | 200 | 0 |
| HolographicHUD | 600 | 500 | 400 | 0 |
| SidePanels | 200 | 200 | 100 | 0 |
| StatusBar3D | 300 | 250 | 200 | 0 |
| LEDRim | 1,500 | 1,200 | 800 | 0 |
| **Cockpit Shell Total** | **4,400** | **3,650** | **2,500** | **0** |
| | | | | |
| HolographicLabMap | 28,000 | 20,000 | 12,000 | 0 |
| LabStructure3D (×10) | 25,000 | 18,000 | 10,000 | 0 |
| InteractiveConsole3D (×4) | 6,000 | 4,500 | 3,000 | 0 |
| AmbientNPCs | 4,000 | 3,000 | 2,000 | 0 |
| PetCompanion3D | 1,500 | 1,000 | 800 | 0 |
| DynamicEnvironment | 15,000 | 10,000 | 5,000 | 0 |
| AmbientParticles | 5,000 | 3,000 | 2,000 | 0 |
| **Spatial Content Total** | **84,500** | **59,500** | **34,800** | **0** |
| | | | | |
| CockpitSkinManager (bg) | 8,000 | 5,000 | 3,000 | 0 |
| AuroraBackground | 2,000 | 1,500 | 1,000 | 0 |
| **Background Total** | **10,000** | **6,500** | **4,000** | **0** |
| | | | | |
| TransitionFX (peak) | 2,500 | 2,000 | 1,500 | 0 |
| CeremonyFX (peak) | 3,000 | 2,000 | 1,000 | 0 |
| **Transition Peak** | **5,500** | **4,000** | **2,500** | **0** |
| | | | | |
| **GRAND TOTAL** | **104,400** | **73,650** | **43,800** | **0** |
| Device Budget | 500,000 | 200,000 | 150,000 | 50,000 |
| Headroom for Games | 395,600 | 126,350 | 106,200 | 50,000 |

### 11.2 LOD Levels for Cockpit Components

```typescript
// Cockpit-specific LOD overrides
export const COCKPIT_LOD = {
  ultra: {
    panelSegments: 48,
    sideSegments: 24,
    hexDetail: true,
    hudRingSegments: 64,
    scanLines: 12,
    barrelDistortion: true,
    reflections: true,
  },
  high: {
    panelSegments: 32,
    sideSegments: 16,
    hexDetail: true,
    hudRingSegments: 48,
    scanLines: 12,
    barrelDistortion: true,
    reflections: true,
  },
  medium: {
    panelSegments: 24,
    sideSegments: 12,
    hexDetail: false,       // Hex clusters simplified to circles
    hudRingSegments: 32,
    scanLines: 8,
    barrelDistortion: false,
    reflections: false,
  },
  low: {
    panelSegments: 16,
    sideSegments: 8,
    hexDetail: false,
    hudRingSegments: 16,
    scanLines: 6,
    barrelDistortion: false,
    reflections: false,
  },
} as const;
```

### 11.3 Adaptive Performance Monitoring

The existing `useAdaptiveLOD()` hook monitors FPS and auto-downgrades. v2.0 adds cockpit-specific thresholds:

| FPS (% of target) | Action |
|-------------------|--------|
| > 90% | Full quality |
| 80-90% | Reduce particle counts by 30% |
| 60-80% | Drop to next LOD level, disable BarrelDistortion |
| 40-60% | Disable HolographicHUD, reduce NPC count by half |
| < 40% | Disable all cockpit 3D, fall back to CSS frame |

---

## 12. MOBILE FALLBACK STRATEGY

### 12.1 CSS Fallback Components

Mobile (< 768px) gets no R3F rendering. Instead, CSS provides the cockpit aesthetic:

| 3D Component | CSS Fallback | Class |
|--------------|-------------|-------|
| CockpitPanels | Gradient border + box-shadow | `.station-frame-css` |
| LEDRim | Animated gradient border-top | `.led-rim-css` |
| HolographicHUD | None (mobile doesn't need it) | — |
| SidePanels | Side indicator dots | `.cockpit-side-indicator` |
| StatusBar3D | Fixed bottom bar | `.status-bar-mobile` |
| HolographicLabMap | 2D grid of lab cards | `<LabGrid />` |
| InteractiveConsole3D | Dashboard stat cards | `<StatCard />` |
| AmbientNPCs | None | — |
| PetCompanion3D | 2D pet avatar (top-right) | `<PetAvatar />` |
| CockpitSkinManager | CSS custom properties + gradient backgrounds | `.skin-{name}` |

### 12.2 Tablet Compromise (768-1023px)

Tablets get a **reduced 3D experience**:
- R3F Canvas renders but at `medium` LOD
- No BarrelDistortion, no reflections
- 4 NPCs, no dialogue bubbles
- Simplified HUD (1 ring instead of 3)
- Touch controls: swipe to rotate lab map, tap to focus, double-tap to enter

### 12.3 Progressive Enhancement Thresholds

```typescript
export const COCKPIT_FEATURE_THRESHOLDS = {
  fullCockpit3D: { minWidth: 1024, minGPU: 'medium' },   // Full R3F cockpit
  reducedCockpit3D: { minWidth: 768, minGPU: 'low' },    // Simplified R3F
  cssOnly: { minWidth: 0, minGPU: 'any' },               // CSS fallback
};
```

---

## 13. ACCESSIBILITY

### 13.1 Keyboard Navigation

All cockpit elements are navigable via keyboard:

| Key | Context | Action |
|-----|---------|--------|
| Arrow Left/Right | Overview | Cycle through labs |
| Arrow Up/Down | Lab focus | Cycle through games in lab |
| Enter | Lab focused | Enter lab |
| Enter | Game focused | Launch game |
| Escape | Any depth | Go back one level (game → lab → overview) |
| Tab | Any | Cycle through console quick-access buttons |
| Space | Console focused | Toggle console detail panel |
| 1-0 | Overview | Jump to Lab 1-10 directly |
| M | Any | Toggle mini-map visibility |
| N | Any | Toggle NPC visibility |

### 13.2 Screen Reader Support

```html
<!-- ARIA structure for the cockpit -->
<div role="application" aria-label="SparkForge Command Bridge">
  <div role="navigation" aria-label="Lab Navigation">
    <!-- Lab map described as a list -->
    <div role="list" aria-label="10 Science Labs">
      <div role="listitem" aria-label="Lab 1: AI Foundations — 45% complete">...</div>
      <!-- ... -->
    </div>
  </div>

  <div role="complementary" aria-label="Status Consoles">
    <div role="status" aria-label="XP: 2,450 of 5,000 — Level 12">...</div>
    <div role="status" aria-label="Streak: 7 days">...</div>
    <div role="status" aria-label="Badges: 15 earned">...</div>
    <div role="status" aria-label="Progress: 4 of 10 labs completed">...</div>
  </div>
</div>
```

### 13.3 Reduced Motion Support

When `prefers-reduced-motion: reduce` is active OR `accessibilityStore.reducedMotion === true`:

- All transitions are instant (0ms duration)
- HUD rings are static (no rotation)
- NPC movement disabled (NPCs are stationary)
- Particle movement disabled (particles are static points)
- BarrelDistortion disabled
- Bloom reduced to 0.2 intensity
- Camera transitions use direct cut instead of spring interpolation
- Celebration ceremonies show static overlay instead of animated sequence

---

## 14. FILE REGISTRY

### 14.1 New Files in v2.0

| File | Type | Purpose | Stage |
|------|------|---------|-------|
| `src/components/3d/CockpitCanvas.tsx` | NEW | Unified R3F Canvas orchestrator | Post-build |
| `src/components/3d/WormholeTransition.tsx` | NEW | Lab entry/exit cinematic | Post-build |
| `src/components/3d/CeremonyFX.tsx` | NEW | Achievement/level-up ceremony FX | Post-build |
| `src/components/dashboard/ConsoleDetailPanel.tsx` | NEW | Expandable console info overlays | Post-build |
| `src/components/dashboard/MiniMapOverlay.tsx` | NEW | Persistent mini-map (top-right) | Post-build |
| `src/components/dashboard/NPCDialogueBubble.tsx` | NEW | Contextual NPC speech bubbles | Post-build |
| `src/hooks/useAdaptiveCockpit.ts` | NEW | Viewport-adaptive curvature/radius | Post-build |
| `src/hooks/useCockpitAudio.ts` | NEW | Spatial audio integration hook | Post-build |
| `src/lib/audio/cockpitAudio.ts` | NEW | CockpitAudioEngine class | Post-build |
| `src/lib/3d/cockpitConfig.ts` | MODIFIED | v2 geometry constants, LOD presets | Post-build |
| `src/shaders/dissolve.glsl` | NEW | Skin transition dissolve shader | Post-build |
| `src/shaders/wormhole.glsl` | NEW | Lab entry tunnel energy shader | Post-build |

### 14.2 Modified Files from v1

| File | Modification |
|------|-------------|
| `src/components/3d/StationFrame.tsx` | Delegates to CockpitCanvas, removes own Canvas |
| `src/components/3d/SpatialDashboard.tsx` | Becomes a scene-level group, not a Canvas wrapper |
| `src/components/3d/CockpitPanels.tsx` | Adds hex data binding, skin material reactivity |
| `src/components/3d/HolographicHUD.tsx` | Adds data-driven rings, mini-map mode |
| `src/components/3d/SidePanels.tsx` | Skin-reactive shader uniforms |
| `src/components/3d/StatusBar3D.tsx` | Real-time store subscriptions |
| `src/components/3d/InteractiveConsole3D.tsx` | Skin frame styles, detail panel trigger |
| `src/components/3d/AmbientNPCs.tsx` | Dialogue bubble integration, pet companion slot |
| `src/components/3d/CockpitSkinManager.tsx` | Extended element reactivity, dissolve transitions |
| `src/components/3d/CinematicCamera.tsx` | Transition cinematic sequences |
| `src/components/dashboard/SpatialOverlay.tsx` | Console detail panel integration |
| `src/stores/cockpitStore.ts` | Skin unlock state, audio preferences, ceremony queue |
| `src/lib/3d/cockpitConfig.ts` | v2 geometry, LOD presets, frame styles |

---

## 15. DECISION LOCK ADDITIONS

| ID | Decision | Rationale |
|----|----------|-----------|
| CPA2-1 | Single R3F Canvas for all cockpit + spatial content | Eliminates double-canvas performance overhead, enables shared postprocessing |
| CPA2-2 | Viewport-adaptive curvature (120-155° based on width) | Ultra-wide monitors benefit from wider wrap; narrow viewports need less peripheral |
| CPA2-3 | Hex clusters display real data (not decorative) | Every visual element should serve a functional purpose |
| CPA2-4 | Skin unlock via achievements (not free selection) | Drives engagement, rewards exploration, makes skins feel earned |
| CPA2-5 | Skin transition uses dissolve shader (not crossfade) | More dramatic, feels like a physical transformation |
| CPA2-6 | Lab entry uses wormhole cinematic (2.5s) | Creates spatial continuity — child feels like they're traveling, not page-navigating |
| CPA2-7 | NPC dialogue bubbles are HTML overlays (not 3D text) | Better readability, easier localization, consistent font rendering |
| CPA2-8 | Spatial audio via Tone.js Panner3D | Already installed, no new dependency needed |
| CPA2-9 | Mobile gets zero R3F (pure CSS fallback) | Battery life, performance, touch UX all better with CSS approach |
| CPA2-10 | Ceremony FX intensity scales by event type | Level-up should feel bigger than a routine XP gain |
| CPA2-11 | Console detail panels are glassmorphic HTML overlays | Readable text, interactive (links, graphs), consistent with SpatialOverlay |
| CPA2-12 | Adaptive FPS monitoring can fall back to CSS at <40% target | Graceful degradation is better than stuttering 3D |

---

## 16. MIGRATION PATH FROM v1

### Phase 1: Unify Canvas (Non-Breaking)

1. Create `CockpitCanvas.tsx` as a wrapper that includes both StationFrame scene + SpatialDashboard scene
2. Update `StationFrame.tsx` to export a scene group instead of a Canvas
3. Update `SpatialDashboard.tsx` to export a scene group instead of a Canvas
4. Dashboard layout imports `CockpitCanvas` instead of both separately
5. **Validation:** Visual output identical to v1, but single Canvas in DOM

### Phase 2: Enhance Existing Components (Incremental)

1. Add hex data binding to `CockpitPanels.tsx`
2. Add data-driven rings to `HolographicHUD.tsx`
3. Add skin material reactivity to panel components
4. Add detail panels to console system
5. **Validation:** Each change is independently testable, no regressions

### Phase 3: Add New Features (Additive)

1. Implement `WormholeTransition.tsx`
2. Implement `CeremonyFX.tsx`
3. Implement `MiniMapOverlay.tsx`
4. Implement `NPCDialogueBubble.tsx`
5. Implement `CockpitAudioEngine`
6. **Validation:** Each feature can be toggled via feature flag

### Phase 4: Polish & Optimize

1. Implement adaptive curvature hook
2. Add skin unlock progression
3. Tune performance thresholds
4. Cross-browser testing (Chrome, Firefox, Safari, Edge)
5. **Validation:** Lighthouse performance audit, 60fps on target devices

---

## 17. CROSS-STAGE IMPACT MATRIX

| Stage | Files Affected | Nature of Change |
|-------|---------------|-----------------|
| 1 (Foundation) | `cockpitConfig.ts`, `stores/cockpitStore.ts` | Config extensions, store additions |
| 3 (Auth/Layout) | `StationFrame.tsx`, `CockpitPanels.tsx`, `HolographicHUD.tsx`, `SidePanels.tsx`, `StatusBar3D.tsx`, `BarrelDistortion.tsx` | Refactor to scene groups, add v2 features |
| 4 (Core Pages) | `useStationMode` | Add transition cinematic triggers |
| 5 (Gamification) | Ceremony system | CeremonyFX replaces/augments existing celebration overlay |
| 6-7 (Games) | Game chrome bezel | GameLaunchZoom morphs cockpit → game frame |
| 8 (Parent) | No impact | Parent dashboard doesn't use cockpit 3D |
| 10 (Polish) | Accessibility, PWA | Cockpit ARIA labels, reduced motion, keyboard nav |

### Dependency Chain

```
cockpitConfig.ts (v2 constants)
    → CockpitCanvas.tsx (unified orchestrator)
        → StationFrame.tsx (refactored to scene group)
        → SpatialDashboard.tsx (refactored to scene group)
        → WormholeTransition.tsx (NEW)
        → CeremonyFX.tsx (NEW)
    → cockpitStore.ts (extended state)
        → MiniMapOverlay.tsx (NEW)
        → ConsoleDetailPanel.tsx (NEW)
        → NPCDialogueBubble.tsx (NEW)
    → CockpitAudioEngine (NEW)
        → useCockpitAudio.ts (NEW)
```

---

## APPENDIX A: COCKPIT MODE STATE MACHINE

```
                    ┌──────────────┐
                    │   overview   │◄────────── Escape (from any)
                    └──────┬───────┘
                           │
                    Arrow / Click
                           │
                    ┌──────▼───────┐
                    │  lab-focus   │
                    └──────┬───────┘
                           │
                    Enter / Double-click
                           │
                    ┌──────▼───────┐
              ┌─────│   lab-page   │
              │     └──────┬───────┘
              │            │
              │     Game Launch
              │            │
              │     ┌──────▼───────┐
              │     │    game      │
              │     └──────┬───────┘
              │            │
              │     Game Complete
              │            │
              │     ┌──────▼───────┐
              └────►│ celebration  │───► Returns to previous state
                    └──────────────┘

Console sub-state (accessible from overview or lab-focus):
    overview/lab-focus → console (Tab/Click) → back (Escape/Click outside)
```

---

## APPENDIX B: GLOSSARY

| Term | Definition |
|------|-----------|
| CPA | Cockpit Panoramic Architecture — the curved cockpit geometry system |
| Station Mode | The current UI mode (dashboard, lab, game, celebration, etc.) |
| Scene Group | An R3F `<group>` containing related 3D elements (not a Canvas) |
| Glassmorphic | Semi-transparent with backdrop blur — SparkForge's overlay style |
| Skin | A complete visual theme for the cockpit environment |
| Ceremony | An animated celebration sequence triggered by achievements |
| LOD | Level of Detail — geometry/effect quality adapted to device capability |

---

*End of 3D_PANORAMIC_COCKPIT_ENHANCEMENT_v2.0 — SparkForge Cockpit Architecture*
*Consolidates: CPA v1.0 + Enhancement 1.1 (Spatial Dashboard) + Enhancement 1.2 (Personalization Engine)*
*12 new decisions (CPA2-1 through CPA2-12) | 12 new files | 13 modified files*
*March 15, 2026*
