# 3D PANORAMIC COCKPIT ENHANCEMENT — v2.0

## Comprehensive Cockpit Architecture Upgrade Document

**Version:** 2.1 | **Original Date:** March 15, 2026 | **Last Updated:** March 20, 2026 | **Status:** SPECIFICATION + PARTIALLY IMPLEMENTED
**Supersedes:** COCKPIT_PANORAMIC_ARCHITECTURE_v1.md (archived → `docs/00-reference/_SUPERSEDED/`)
**Scope:** Full cockpit pipeline — geometry, materials, spatial dashboard, personalization, transitions, audio, navigation
**Change Log:** See `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` for the 20M triangle upgrade + FIX-TRIPLE-CANVAS details

---

## IMPLEMENTATION STATUS (as of March 20, 2026)

> This document is the **active architectural spec**. Use it alongside `Upgrade-3D-Panoramic-Cockpit-2026-03-20.md` (the change record).

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** — Canvas Unification | `CockpitCanvas.tsx` created; `StationFrame`, `SpatialDashboard`, `HeroAnimation` rewritten as `<group>` wrappers; `CameraSystem.tsx` created | ✅ COMPLETE |
| **Phase 2** — Component Upgrades | 13 existing components upgraded to 20M budget (CockpitPanels 2M, LEDRim 200K, SidePanels 1.5M, HolographicHUD 500K, StatusBar3D 500K, HolographicLabMap 1M, LabStructure3D 3M, InteractiveConsole3D 2M, AmbientNPCs 1.5M, DynamicEnvironment 3M, AuroraBackground 50K, ~~AmbientParticles 200K~~ **(later removed — Decision 20.0)**, CockpitSkinManager) | ✅ COMPLETE |
| **Phase 3** — New Visual Components | `CockpitStructuralDetail.tsx` (1.5M), `VolumetricFog3D.tsx` (500K), `CockpitFloor3D.tsx` (500K), `CeremonyFX.tsx` (500K), `WormholeTransition.tsx` (300K), `MiniMapOverlay3D.tsx` (250K) | ✅ COMPLETE |
| **Phase 4** — Audio System | `cockpitAudio.ts` (CockpitAudioEngine + spatial zones), `useCockpitAudio.ts` | ✅ COMPLETE |
| **Phase 5** — Store & Hook Updates | `deviceStore` 20M profiles + system tier; `cockpitStore` heroPhase; `useLOD` system cap removed; `cockpitConfig.ts` TRIANGLE_BUDGET_V2 | ✅ COMPLETE |
| **Phase 6** — Polish & Optimize | Adaptive curvature hook, skin unlock progression, performance tuning, cross-browser testing | 🔲 PENDING |

**Triangle budget:** ~68K–104K (v2.0 original) → **20,000,000 triangles** (desktop, March 20 upgrade)
**Canvas instances:** 3 (v1 bug) → **1** (single persistent `CockpitCanvas`)

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
    ├── CeremonyFX (achievement/level-up)
    └── CeremonyFXBridge (uiStore → CeremonyFX mapping, Stage 5)
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

### 3.4 Geometry Constants (Updated — v3.0 March 27, 2026)

> **Note:** Export name in code is `COCKPIT_GEOMETRY` (not `_V2`). Values below reflect the v3.0 3D-Embedded UI upgrade.

```typescript
export const COCKPIT_GEOMETRY = {
  // Base values (adapted by useAdaptiveCockpit)
  panelCurvature: 0.85,
  totalWrapArc: 218,            // v3: extreme panoramic wrap (was 140)
  panelRadius: 4.8,             // v3: larger radius for immersion (was 4.0)
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,
  hexDepth: 0.02,

  // v3 enhanced
  hexDataTextureSize: 64,
  panelEdgeBevel: 0.005,
  topBarSegments: 288,          // v3: denser for wider arc (was 48→256→288)
  sideSegments: 144,            // v3: denser (was 24→128→144)

  // v3: Structural detail + explicit positions
  rivetSpacing: 0.12,
  cableBundleCount: 60,
  ventPanelCount: 16,
  floorGrateResolution: 80,
  leftConsolePosition: [-2.35, 0.25, -1.65],
  rightConsolePosition: [2.35, 0.25, -1.65],
  statusBarPosition: [0, -1.25, -1.95],
  centerViewportRadius: 3.9,
  centerViewportPosition: [0, 0.35, -3.3],
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
        camera={{ position: [0, 0.65, 1.1], fov: 58, near: 0.1, far: 200 }}  // v3: tight-focus cockpit seat
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
5. **Transition layer:** WormholeTransition / GameLaunchZoom / CeremonyFX + CeremonyFXBridge (when active)
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

### 11.1 Triangle Budget Breakdown (v3.0 — 3D-Embedded UI Upgrade, March 27, 2026)

> ⚠️ **Updated March 27, 2026:** v3.0 3D-Embedded UI upgrade. Cockpit budget increased from 20M to 38M. Camera repositioned to tight-focus cockpit seat `[0, 0.65, 1.1]`. Hull widened to 218° arc. 8 new 3D UI components added. Desktop-only (D3D-1).

#### Device Maximums

| Device | maxTriangles | Notes |
|--------|-------------|-------|
| **Desktop** | **50,000,000** | 38M cockpit + 12M game headroom (v3.0) |

#### Cockpit Shell Components

| Component | Desktop Budget | Tablet Budget | What Changed from v2.0 original |
|-----------|---------------|--------------|----------------------------------|
| **CockpitPanels** | 4,000,000 | — | v3: 288-seg hull, 218° arc, r=4.8, 12 ribs, 768 rivets, alloy #a8b5c8 |
| **LEDRim** | 500,000 | — | v3: 1,500 LEDs, emissive 3.0, wider arc coverage |
| **SidePanels** | 3,000,000 | — | v3: at [±2.35, 0.25, -1.65], alloy chrome, radar + terminal |
| **HolographicHUD** | 1,000,000 | — | v3: **REPOSITIONED (Decision 6.0)** — moved from overhead [0,2.05,-3.4] to peripheral viewport frame (4 arc segments wrapping viewport edges, corner data readouts for time/XP/mode/child). Budget unchanged at 1M. |
| **StatusBar3D** | 1,000,000 | — | v3: at [0, -1.25, -1.95], XP arc bar (no needle), pulse ring (no flame), 10 lab indicators (Decisions 8.1-8.2) |
| **AuroraBackground** | 50,000 | — | Volumetric layers with 3D depth geometry |
| **AmbientParticles** | ~~200,000~~ 0 | — | **REMOVED (Decision 20.0)** — ambient particles removed from cockpit entirely |
| **Shell Subtotal** | **9,750,000** | — | |

#### Spatial Dashboard Components

| Component | Desktop Budget | Tablet Budget | What Changed |
|-----------|---------------|--------------|--------------|
| **HolographicLabMap** | 1,000,000 | 500,000 | Multi-layer geodesic shells, data highway splines, holographic projector pedestal |
| **LabStructure3D** (×10 labs) | 3,000,000 | 1,500,000 | 300K/lab: subdivision surfaces, interior mechanisms, diorama scenes |
| **InteractiveConsole3D** (×4) | 3,000,000 | — | v3: 750K/console, holographic projections |
| **AmbientNPCs** (8 bots) | 2,000,000 | — | v3: 250K/bot, enhanced articulation |
| **DynamicEnvironment** | 3,000,000 | — | Volumetric fog, floating data fragments, dynamic weather effects |
| **Stars/Skybox** | 500,000 | — | Enhanced starfield with nebula geometry |
| **Spatial Subtotal** | **12,500,000** | — | |

#### NEW Components (enabled by 20M upgrade)

| Component | Desktop Budget | Tablet Budget | Description |
|-----------|---------------|--------------|-------------|
| **CockpitStructuralDetail** | 2,000,000 | — | v3: 60 cables, 16 vents, tighter rivet spacing |
| **VolumetricFog3D** | 500,000 | — | Fog volumes, god ray cones, lab-reactive coloring |
| **CockpitFloor3D** | 1,000,000 | — | v3: higher res grate, enhanced sub-floor |
| **CeremonyFX** | 500,000 | — | Instanced confetti, firework bursts, 3D trophy models |
| **WormholeTransition** | 300,000 | — | Animated tunnel, swirling energy walls, portal rings |
| **MiniMapOverlay3D** | 250,000 | — | Miniature lab ring, player indicator |
| **Detail Subtotal** | **4,550,000** | — | |

#### 3D-Embedded UI Components (NEW — v3.0, March 27, 2026)

| Component | Desktop Budget | Description |
|-----------|---------------|-------------|
| **HolographicButton** | per-instance ~100K | Spring-depress, ripple, broadcast |
| **RadialDial3D** | per-instance ~200K | Spring-physics drag-to-rotate, 24 ticks |
| **ToggleSwitch3D** | per-instance ~80K | 45° snap, LED indicator |
| **HolographicCard** | per-instance ~50K | Floating data card + Html content |
| **HolographicPanel** | varies | Curved content surface |
| **NavigationButtonGrid** | 1,000,000 | 5 physical nav buttons (HOME/LABS/ARCADE/SETTINGS/PROFILE) |
| **VariableDialCluster** | 1,500,000 | 3 auto-reconfiguring page-context dials |
| **CenterViewportScreen** | 3,000,000 | Spherical panoramic (r=3.9, 144×72 segs) |
| **cockpitBroadcastStore** | — | Cross-panel event bus (16 event types) |
| **cockpitMaterials.ts** | — | 7 material factories (alloy, panel, holographic, button, bezel, console, LED) |
| **UI Subtotal** | **~11,000,000** | |

#### Budget Summary (v3.0)

| Category | Desktop |
|----------|---------|
| Cockpit Shell | 9,750,000 |
| Spatial Dashboard | 12,500,000 |
| Detail Components | 4,550,000 |
| 3D UI Components | 11,000,000 |
| **COCKPIT TOTAL** | **~37,800,000** |
| Game Headroom | ~12,200,000 |
| **SYSTEM TOTAL** | **50,000,000** |

### 11.2 LOD Levels for Cockpit Components

```typescript
// Cockpit-specific LOD overrides
// NOTE (March 20, 2026): ultra panelSegments updated 48→64 per Upgrade doc Section C.
// useLOD system tier cap (hardcoded 3,000 tris) removed — now reads from deviceStore
// TRIANGLE_BUDGETS.system (desktop: 20M, tablet: 10M, mobile: 0). See FIX-SYSTEM-LOD-CAP.
export const COCKPIT_LOD = {
  ultra: {
    panelSegments: 64,    // Updated from 48 — March 20, 2026
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

## 11.4 Store & Hook Changes (20M Upgrade — March 20, 2026)

> Exact values required by the Upgrade doc. Applied to all stores as of March 20, 2026.

### `deviceStore.ts` — Updated PERFORMANCE_PROFILES

```typescript
desktop: {
  maxTriangles: 20_000_000,    // was 10_000_000
  maxLights: 16,               // was 12
  instancedMeshLimit: 5000,    // was 2000
  sphereSegments: 64,          // was 32
}
tablet: {
  maxTriangles: 10_000_000,    // was 5_000_000
  maxLights: 8,                // was 4
  instancedMeshLimit: 1500,    // was 500
  sphereSegments: 32,          // was 16
}
// mobile: UNCHANGED

// TRIANGLE_BUDGETS — added 'system' tier:
type TriangleBudgets = { flagship: number; flLite: number; standard: number; system: number }
desktop:  { flagship: 10_000_000, flLite: 2_000_000, standard: 500_000, system: 20_000_000 }
tablet:   { flagship: 5_000_000,  flLite: 1_000_000, standard: 250_000, system: 10_000_000 }
mobile:   { flagship: 2_500_000,  flLite: 500_000,   standard: 125_000, system: 0 }
```

### `cockpitStore.ts` — Added Hero Phase

```typescript
// Added to cockpitStore state:
heroPhase: 'idle' | 'animating' | 'materializing' | 'complete'
setHeroPhase: (phase: HeroPhase) => void

// Usage:
// - HeroAnimation sets 'animating' when it starts
// - Upgrade doc handoff sets 'materializing' at t=14s
// - CockpitCanvas sets 'complete' at t=19s
// - CockpitCanvas gates cockpit group visibility on heroPhase !== 'idle'
```

### `useLOD.ts` — System Cap Removed

```typescript
// BEFORE (FIX-SYSTEM-LOD-CAP bug):
() => tier === 'system' ? 3000 : getTriangleBudget(tier)

// AFTER:
() => getTriangleBudget(tier)   // system tier now reads from deviceStore TRIANGLE_BUDGETS.system

// Also: TIER_SCALE.system and LOD_CONFIGS ultra segments updated from 32 to 64
```

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

### 14.1 New Files

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `src/components/3d/CockpitCanvas.tsx` | NEW | Unified R3F Canvas orchestrator — single persistent Canvas for entire app | ✅ IMPLEMENTED |
| `src/components/3d/CameraSystem.tsx` | NEW | Unified camera management (hero + dashboard + transitions) | ✅ IMPLEMENTED |
| `src/components/3d/CockpitStructuralDetail.tsx` | NEW | Cable bundles, conduit pipes, ventilation panels, structural ribs, LED strips (1.5M tris) | ✅ IMPLEMENTED |
| `src/components/3d/VolumetricFog3D.tsx` | NEW | Fog volumes, god ray cones, lab-reactive coloring (500K tris) | ✅ IMPLEMENTED |
| `src/components/3d/CockpitFloor3D.tsx` | NEW | Grated floor panels, sub-floor piping, embedded LED channels (500K tris) | ✅ IMPLEMENTED |
| `src/components/3d/CeremonyFX.tsx` | NEW | Achievement/level-up ceremony FX — confetti, fireworks, 3D trophies (500K tris) | ✅ IMPLEMENTED |
| `src/components/3d/CeremonyFXBridge.tsx` | NEW (Stage 5) | uiStore → CeremonyFX bridge — maps CelebrationType to ceremony effects inside CockpitCanvas | ✅ IMPLEMENTED |
| `src/components/3d/WormholeTransition.tsx` | NEW | Lab entry/exit cinematic tunnel (300K tris) | ✅ IMPLEMENTED |
| `src/components/3d/MiniMapOverlay3D.tsx` | NEW | Persistent 3D minimap — lab ring, position indicator, completion coding (250K tris) | ✅ IMPLEMENTED |
| `src/lib/audio/cockpitAudio.ts` | NEW | CockpitAudioEngine singleton — spatial zones, skin-specific soundscapes | ✅ IMPLEMENTED |
| `src/hooks/useCockpitAudio.ts` | NEW | React hook for component-level audio integration | ✅ IMPLEMENTED |
| `src/components/dashboard/ConsoleDetailPanel.tsx` | NEW | Expandable console info overlays (glassmorphic HTML) | 🔲 PENDING |
| `src/components/dashboard/NPCDialogueBubble.tsx` | NEW | Contextual NPC speech bubbles (HTML overlay, CPA2-10) | 🔲 PENDING (deferred) |
| `src/hooks/useAdaptiveCockpit.ts` | NEW | Viewport-adaptive curvature/radius (Phase 6) | 🔲 PENDING |
| `src/lib/3d/cockpitConfig.ts` | MODIFIED | v2 geometry constants, LOD presets, TRIANGLE_BUDGET_V2 | ✅ IMPLEMENTED |
| `src/shaders/dissolve.glsl` | NEW | Skin transition dissolve shader | 🔲 PENDING |
| `src/shaders/wormhole.glsl` | NEW | Lab entry tunnel energy shader | 🔲 PENDING |

### 14.2 Modified Files

| File | Modification | Status |
|------|-------------|--------|
| `src/components/3d/HeroAnimation.tsx` | **REWRITE** — Remove own Canvas; export HeroScene as `<group>` within CockpitCanvas; add materialization crossfade into cockpit (CPA2-3 Seamless Handoff) | ✅ IMPLEMENTED |
| `src/components/3d/StationFrame.tsx` | **REWRITE** — Remove own Canvas; export as scene group within CockpitCanvas | ✅ IMPLEMENTED |
| `src/components/3d/SpatialDashboard.tsx` | **REWRITE** — Remove own Canvas; becomes a scene-level `<group>`, not a Canvas wrapper | ✅ IMPLEMENTED |
| `src/components/3d/CockpitPanels.tsx` | **MAJOR** — 256-seg curved hull, hex gauge data binding, skin material reactivity, animated sub-panels (2M tris) | ✅ IMPLEMENTED |
| `src/components/3d/HolographicHUD.tsx` | **MAJOR** — 8 data-driven rings, data-display arcs, reticle, volumetric scan beams (500K tris) | ✅ IMPLEMENTED |
| `src/components/3d/LEDRim.tsx` | **MAJOR** — 1,000+ individual LED capsules, pure mood lighting (no data mode per Decision 7.5), audio-reactive pulse waves (200K tris) | ✅ IMPLEMENTED |
| `src/components/3d/SidePanels.tsx` | **MAJOR** — Physical radar dish, 3D data columns, skin-reactive shader uniforms (1.5M tris) | ✅ IMPLEMENTED |
| `src/components/3d/StatusBar3D.tsx` | **MAJOR** — XP arc bar (no needle), pulse ring (no flame) per Decisions 8.1-8.2, real-time store subscriptions (500K tris) | ✅ IMPLEMENTED |
| `src/components/3d/HolographicLabMap.tsx` | **MAJOR** — Multi-layer geodesic shells, data highway splines, projector pedestal (1M tris) | ✅ IMPLEMENTED |
| `src/components/3d/LabStructure3D.tsx` | **MAJOR** — 300K/lab: subdivision surfaces, interior mechanisms, diorama scenes (3M tris total) | ✅ IMPLEMENTED |
| `src/components/3d/InteractiveConsole3D.tsx` | **MAJOR** — 500K/console: multi-part housing, projector base, skin frame styles (2M tris total) | ✅ IMPLEMENTED |
| `src/components/3d/AmbientNPCs.tsx` | **MAJOR** — 187K/bot: facial animation, 3-finger grippers, dialogue bubble integration (1.5M tris) | ✅ IMPLEMENTED |
| `src/components/3d/DynamicEnvironment.tsx` | **MAJOR** — Volumetric fog, environmental props, dynamic weather (3M tris) | ✅ IMPLEMENTED |
| `src/components/3d/AuroraBackground.tsx` | **MINOR** — Volumetric layers for ultra LOD (50K tris) | ✅ IMPLEMENTED |
| `src/components/3d/AmbientParticles.tsx` | **REMOVED (Decision 20.0)** — ambient particles removed from cockpit entirely | ~~✅ IMPLEMENTED~~ REMOVED |
| `src/components/3d/CockpitSkinManager.tsx` | Extended element reactivity, dissolve transitions, updated budgets | ✅ IMPLEMENTED |
| `src/components/3d/CinematicCamera.tsx` | Transition cinematic sequences — superseded by `CameraSystem.tsx` | ✅ IMPLEMENTED |
| `src/stores/cockpitStore.ts` | Added `heroPhase` state + `setHeroPhase` action; skin unlock, audio preferences, ceremony queue | ✅ IMPLEMENTED |
| `src/stores/deviceStore.ts` | **20M profiles**: `desktop.maxTriangles: 20M`, `tablet.maxTriangles: 10M`, added `system` tier to `TRIANGLE_BUDGETS`, `instancedMeshLimit desktop=5000/tablet=1500`, `sphereSegments desktop=64` | ✅ IMPLEMENTED |
| `src/hooks/useLOD.ts` | Removed hardcoded 3,000 tri system cap; ultra segments updated to 64; system tier now reads from `deviceStore.TRIANGLE_BUDGETS.system` | ✅ IMPLEMENTED |
| `src/stores/uiStore.ts` | Verified `gameActive`/`setGameActive` present for unified Canvas game mode strategy | ✅ IMPLEMENTED |
| `src/components/dashboard/SpatialOverlay.tsx` | Console detail panel integration | 🔲 PENDING |

---

## 15. DECISION LOCK ADDITIONS

> **Numbering note (March 20, 2026):** CPA2-2, CPA2-3, CPA2-4 were added to CLAUDE.md to reflect the Upgrade doc architecture. The original v2.0 decisions CPA2-2 through CPA2-12 have been renumbered CPA2-5 through CPA2-15 to align with CLAUDE.md authority. Total: 15 CPA2 decisions (CLAUDE.md will be updated from "12" to "15" at next review).

| ID | Decision | Rationale | Status |
|----|----------|-----------|--------|
| CPA2-1 | Single R3F Canvas for all cockpit + spatial content | Eliminates double-canvas performance overhead; enables shared postprocessing pipeline | ✅ IMPLEMENTED (March 20, 2026) — `CockpitCanvas.tsx` created; `StationFrame`/`SpatialDashboard`/`HeroAnimation` rewritten as `<group>` wrappers |
| CPA2-2 | WebGPU primary renderer with WebGL2 auto-fallback | `WebGPURenderer` via R3F v9 async `gl` prop; TSL shaders compile to WGSL (WebGPU) or GLSL (WebGL2) automatically | ✅ IMPLEMENTED (March 20, 2026) — `CockpitCanvas` uses `WebGPURenderer` async init pattern |
| CPA2-3 | Seamless hero-to-cockpit handoff with zero DOM transitions | Hero Phase 7 camera `[0, 6.5, 7]` fov 58 aligns exactly with cockpit starting camera. Groups crossfade within single Canvas — no Canvas swap, no context loss | ✅ IMPLEMENTED (March 20, 2026) — Hero group fades out while cockpit groups materialize (t=14-19s overlap) |
| CPA2-4 | SpatialDashboard and HeroAnimation as `<group>` within CockpitCanvas, not separate Canvas instances | Preserves CPA2-1 (single Canvas). Each scene is a visibility-toggled `<group>` — HeroGroup visible t=0-17s, CockpitGroup visible t=14s+ | ✅ IMPLEMENTED (March 20, 2026) — All three former Canvas owners now export as `<group>` wrappers |
| CPA2-5 | Viewport-adaptive curvature (120-155° based on width) | Ultra-wide monitors benefit from wider wrap; narrow viewports need less peripheral | 🔲 PENDING (Phase 6) |
| CPA2-6 | Hex clusters display real data (not decorative) | Every visual element should serve a functional purpose | ✅ IMPLEMENTED (March 20, 2026) — CockpitPanels hex clusters display gauge data, animated needles bound to real metrics |
| CPA2-7 | Skin unlock via achievements (not free selection) | Drives engagement, rewards exploration, makes skins feel earned | 🔲 PENDING (Phase 6) |
| CPA2-8 | Skin transition uses dissolve shader (not crossfade) | More dramatic, feels like a physical transformation | 🔲 PENDING (Phase 6) |
| CPA2-9 | Lab entry uses wormhole cinematic (2.5s) | Creates spatial continuity — child feels like they're traveling, not page-navigating | ✅ IMPLEMENTED — `WormholeTransition.tsx` created (300K tris) |
| CPA2-10 | NPC dialogue bubbles are HTML overlays (not 3D text) | Better readability, easier localization, consistent font rendering | 🔲 PENDING — `NPCDialogueBubble.tsx` deferred |
| CPA2-11 | Spatial audio via Tone.js Panner3D | Already installed (Tone.js), no new dependency needed | ✅ IMPLEMENTED — `cockpitAudio.ts` + `useCockpitAudio.ts` created |
| CPA2-12 | Mobile gets zero R3F (pure CSS fallback) | Battery life, performance, and touch UX all better with CSS approach on mobile | ✅ IMPLEMENTED — `useIsMobile()` returns `null` from CockpitCanvas on mobile |
| CPA2-13 | Ceremony FX intensity scales by event type | Level-up should feel bigger than a routine XP gain | ✅ IMPLEMENTED — `CeremonyFX.tsx` uses event type intensity map |
| CPA2-14 | Console detail panels are glassmorphic HTML overlays | Readable text, interactive content (links, graphs), consistent with SpatialOverlay pattern | 🔲 PENDING — `ConsoleDetailPanel.tsx` |
| CPA2-15 | Adaptive FPS monitoring can fall back to CSS at <40% of FPS target | Graceful degradation is better than stuttering 3D | ✅ IMPLEMENTED — `useAdaptiveLOD()` handles FPS-gated degradation; cockpit-specific thresholds in Section 11.3 |

---

## 16. MIGRATION PATH FROM v1

### Phase 1: Unify Canvas (Non-Breaking) — **COMPLETE (March 20, 2026)**

1. ~~Create `CockpitCanvas.tsx` as a wrapper that includes both StationFrame scene + SpatialDashboard scene~~ DONE
2. ~~Update `StationFrame.tsx` to export a scene group instead of a Canvas~~ DONE
3. ~~Update `SpatialDashboard.tsx` to export a scene group instead of a Canvas~~ DONE
4. ~~Dashboard layout imports `CockpitCanvas` instead of both separately~~ DONE
5. ~~**Validation:** Visual output identical to v1, but single Canvas in DOM~~ DONE
6. Also created `CameraSystem.tsx` for unified camera management across hero/dashboard/transitions
7. Also rewrote `HeroAnimation.tsx` as scene group with seamless crossfade into cockpit

### Phase 2: Enhance Existing Components (Incremental) — **COMPLETE (March 20, 2026)**

1. ~~Add hex data binding to `CockpitPanels.tsx`~~ DONE (2M tri upgrade with gauge clusters)
2. ~~Add data-driven rings to `HolographicHUD.tsx`~~ DONE (500K tri upgrade, 8 rings + data arcs)
3. ~~Add skin material reactivity to panel components~~ DONE (CockpitSkinManager updated)
4. ~~Add detail panels to console system~~ DONE (InteractiveConsole3D 2M tri upgrade)
5. ~~**Validation:** Each change is independently testable, no regressions~~ DONE
6. Also upgraded: LEDRim (200K), SidePanels (1.5M), StatusBar3D (500K), HolographicLabMap (1M), LabStructure3D (3M), AmbientNPCs (1.5M), DynamicEnvironment (3M), AuroraBackground (50K), ~~AmbientParticles (200K)~~ **(later removed by Decision 20.0)**

### Phase 3: Add New Features (Additive) — **COMPLETE (March 20, 2026)**

1. ~~Implement `WormholeTransition.tsx`~~ DONE (300K tris)
2. ~~Implement `CeremonyFX.tsx`~~ DONE (500K tris)
3. ~~Implement `MiniMapOverlay3D.tsx`~~ DONE (250K tris)
4. Implement `NPCDialogueBubble.tsx` — DEFERRED (CPA2-7: HTML overlays preferred)
5. ~~Implement `CockpitAudioEngine`~~ DONE (`cockpitAudio.ts` + `useCockpitAudio.ts`)
6. Also created: `CockpitStructuralDetail.tsx` (1.5M), `VolumetricFog3D.tsx` (500K), `CockpitFloor3D.tsx` (500K)

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
| 5 (Gamification) | Ceremony system, CeremonyFXBridge | CeremonyFXBridge maps uiStore celebrations → CeremonyFX inside CockpitCanvas; BadgePedestalBridge added for trophy showcase |
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
        → CeremonyFXBridge.tsx (NEW — Stage 5, uiStore → CeremonyFX)
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
*March 15, 2026 | Updated March 20, 2026: Phases 1-3 COMPLETE (20M cockpit upgrade, unified CockpitCanvas, 21 components)*
