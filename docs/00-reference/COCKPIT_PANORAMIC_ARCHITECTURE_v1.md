# COCKPIT PANORAMIC ARCHITECTURE — v1.0

## Architectural Change Document: JSON Image Review Integration

**Version:** 1.0 | **Date:** March 14, 2026 | **Status:** IMPLEMENTED
**Scope:** Cross-cutting 3D, visual, audio, and UI changes across Stages 1, 3, 4, 5, 6, 7, 8, 10
**Trigger:** Post-JSON image review — 5 update points with 10 sub-changes

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Update 1: Panel Geometry](#2-update-1-panel-geometry)
3. [Update 2: Material Properties](#3-update-2-material-properties)
4. [Update 3: Control Element Spatial Layout](#4-update-3-control-element-spatial-layout)
5. [Update 4: Color/Lighting Balance](#5-update-4-colorlighting-balance)
6. [Update 5: Camera & FOV](#6-update-5-camera--fov)
7. [Cross-Stage Impact Matrix](#7-cross-stage-impact-matrix)
8. [File Change Registry](#8-file-change-registry)
9. [New Files Required](#9-new-files-required)
10. [Modified Files Registry](#10-modified-files-registry)
11. [Sound Design Integration](#11-sound-design-integration)
12. [Performance Budget](#12-performance-budget)
13. [Mobile Fallback Strategy](#13-mobile-fallback-strategy)
14. [Migration Notes](#14-migration-notes)
15. [Decision Lock Additions](#15-decision-lock-additions)

---

## 1. EXECUTIVE SUMMARY

The JSON image review reveals a **curved panoramic cockpit dashboard** wrapping around the viewer — fundamentally different from the current flat multi-plane panel architecture specified in the Stage 3 v3-FINAL docs. The current StationFrame uses a flat CSS border overlay with R3F Aurora/Particles/LEDRim behind it. The image demands a concave cylindrical wrap with hexagonal sub-panels, a central holographic HUD, flanking tactical screens, a bottom status bar, enhanced bloom/lens-flare behavior, transmission glass materials, and a wider fisheye-hinted FOV.

### Scope of Change

| Category | Current State | Target State |
|----------|--------------|--------------|
| Panel geometry | Flat CSS border + LED rim strip | Curved CylinderGeometry panoramic wrap (120-160° arc) |
| Sub-panels | None | Hexagonal ShapeGeometry insets at console level |
| Central viewport | HTML content window (no 3D overlay) | HolographicHUD R3F overlay (concentric rings, radial scan, pulsing core) |
| Side panels | None | Left (radar/scanner) + Right (terminal/data) decorative 3D planes |
| Bottom status | CSS-only (via globals.css) | 3D gauge-style Status Bar sub-zone |
| IndicatorGlass material | Basic transparency | Transmission glass (transmission: 0.6, ior: 1.2, thickness: 0.5) |
| Bloom | Fixed 0.4 intensity, 0.6 threshold | Mode-dependent: dashboard=0.4, celebration=0.8, game-complete=1.0 |
| Vignette | CSS radial-gradient | R3F postprocessing Vignette effect (darkness: 0.5, offset: 0.3) |
| Camera FOV | Fixed 50° | 55-58° dashboard + subtle barrel distortion (0.02 strength) |
| Lens flare | None | Optional anamorphic lens flare pass for celebration mode |

### What Does NOT Change

- Aurora background shader (stays behind panels)
- Ambient particles system (stays mid-depth)
- CrystalShatter entry sequence (stays as-is)
- Game-specific 3D components (6B-7F)
- All 35 game architectures
- Authentication/database/API layers
- Mobile CSS fallback approach (still degrades gracefully)
- Shader index concatenation pattern
- Font stack (Exo 2/Sora/Orbitron — BUG-10F)

---

## 2. UPDATE 1: PANEL GEOMETRY

### 1A — Panoramic Curvature

**Problem:** Current StationFrame renders a flat CSS border (`station-frame-css`) with a thin LED rim strip at the top. The JSON image shows a concave cylindrical cockpit dashboard wrapping 120-160° around the viewer.

**Current code** (`StationFrame.tsx`, Stage 3 Part 3B Step 9):
```typescript
// Current: flat CSS border overlay + LED strip at top
<LEDRim color={ledColor} intensity={frameGlow} spikeActive={spikeEvent} />
// ... then CSS:
<div className="station-frame-css" ... />
```

**Target architecture:**
```
PANORAMIC COCKPIT — Top-Down View (schematic)

                    ╭────────────────────╮
                   ╱   TOP INSTRUMENT    ╲
                  ╱      BAR (10%)        ╲
                 ╱                          ╲
    LEFT PANEL  │     CENTRAL VIEWPORT      │  RIGHT PANEL
    (scanner)   │     (HTML content)        │  (terminal)
     ~12% w     │       ~56% w             │    ~12% w
                 ╲                          ╱
                  ╲    CONSOLE DESK        ╱
                   ╲  + HEX PANELS (15%)  ╱
                    ╰────────────────────╯
                      STATUS BAR (5%)

Camera POV is at center, looking outward.
Panels curve TOWARD viewer (concave).
Total wrap arc: 140° (configurable 120-160°).
```

**Implementation approach:**

New component: `src/components/3d/CockpitPanels.tsx`

```typescript
// Key geometry parameters
interface CockpitConfig {
  panelCurvature: number;        // 0.0 (flat) to 1.0 (full cylinder)
  totalWrapArc: number;          // degrees, default 140
  panelRadius: number;           // distance from camera, default 4.0
  centralViewportWidth: number;  // fraction 0-1, default 0.56
  sidesPanelWidth: number;       // fraction 0-1, default 0.12 each
  topBarHeight: number;          // fraction 0-1, default 0.10
  consoleDeskHeight: number;     // fraction 0-1, default 0.15
  statusBarHeight: number;       // fraction 0-1, default 0.05
}

const DEFAULT_COCKPIT: CockpitConfig = {
  panelCurvature: 0.85,
  totalWrapArc: 140,
  panelRadius: 4.0,
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
};
```

**Geometry strategy:**
- Use `CylinderGeometry` segments (open-ended, partial arc) for the main wrap panels
- The central viewport is a **cutout** — geometry surrounds it but does not occlude it
- Side panels and top bar are separate `CylinderGeometry` arc segments at the same radius
- Console desk is a lower angled arc segment
- All panels share `StationChrome` PBR material with chrome reflection shader
- Panel edges get chamfered bevels via `ExtrudeGeometry` with bevel settings

**Triangle budget:** ~800-1200 tris total for cockpit shell (well within the station frame budget). Note: game-level triangle budgets have been upgraded to 10K–100K — see GAME_ENHANCEMENT_AUDIT.md for per-tier details.

**StationMode integration:**
- `useStationMode` gains a new `panelCurvature` field (default per mode)
- Game mode: panels retract (curvature 0.3, opacity 0.2) — Decision 3.4 compatibility
- Celebration mode: panels pulse with lab color

### 1B — Hexagonal Sub-Panels

**Problem:** The JSON image describes "lower left & right hexagonal panels" as multi-function control clusters. No hexagonal geometry exists in the current spec.

**Implementation:**

New sub-component within `CockpitPanels.tsx`:

```typescript
// Hexagonal panel geometry using ShapeGeometry
function createHexShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top hex
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
```

**Placement:**
- 2 hexagonal clusters flanking the central viewport at console desk level
- Left hex cluster: 3 nested hexagons (navigation/lab indicators)
- Right hex cluster: 3 nested hexagons (stats/activity indicators)
- Each hex uses `ShapeGeometry` with `ExtrudeGeometry` for depth (0.02 units)
- Material: `WornChrome` preset (new, see Update 2) with subtle emissive edge glow
- Hex insets render lab-colored indicator lights via `EmissiveGlow` material

**Visual behavior:**
- Hexes pulse gently in dashboard mode (emissive 0.3-0.5 cycle, 4s period)
- Lab mode: left hex cluster highlights the active lab number
- Game mode: hexes dim to 0.1 opacity (Decision 3.4)
- Celebration: all hexes flash in sequence (0.1s stagger)

**Triangle budget:** ~150-200 tris for all hex geometry

---

## 3. UPDATE 2: MATERIAL PROPERTIES

### 2A — Enhanced IndicatorGlass with Transmission

**Problem:** Current `CrystalGlass` preset uses basic transparency. The JSON image calls out "metallic panel reflections of neon lights" requiring transmission/refraction for holographic glass look.

**Current** (`materials.ts`, Stage 3 Part 3B Step 5):
```typescript
CrystalGlass: {
  name: 'CrystalGlass',
  metalness: 0.0,
  roughness: 0.1,
  envMapIntensity: 1.0,
  color: '#ffffff',
  special: 'Legendary pedestals + hero crystal — MeshTransmissionMaterial',
}
```

**New: 4 additional PBR presets** added to `MATERIAL_PRESETS`:

```typescript
// ■■ NEW PRESETS — Cockpit Panoramic Architecture ■■

PanelFace: {
  name: 'PanelFace',
  metalness: 0.85,
  roughness: 0.35,
  envMapIntensity: 1.2,
  color: '#1a1e2e',
  special: 'Main cockpit panel surface — dark metallic with subtle env reflection',
},

WornChrome: {
  name: 'WornChrome',
  metalness: 0.95,
  roughness: 0.45,
  envMapIntensity: 0.8,
  color: '#8a9098',
  special: 'Hexagonal sub-panels, console desk edges — weathered industrial chrome',
},

IndicatorGlass: {
  name: 'IndicatorGlass',
  metalness: 0.1,
  roughness: 0.05,
  envMapIntensity: 1.5,
  color: '#e0f0ff',
  emissive: '#00BBFF',
  emissiveIntensity: 0.3,
  // MeshPhysicalMaterial transmission properties:
  transmission: 0.6,
  ior: 1.2,
  thickness: 0.5,
  special: 'HUD overlays, concentric rings, holographic glass — transmission + refraction',
},

ConsoleBase: {
  name: 'ConsoleBase',
  metalness: 0.7,
  roughness: 0.6,
  envMapIntensity: 0.5,
  color: '#0e1118',
  special: 'Console desk and status bar base — very dark, matte-metallic',
},
```

**MaterialPreset interface extension:**
```typescript
export interface MaterialPreset {
  name: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  // NEW — transmission properties for IndicatorGlass
  transmission?: number;
  ior?: number;
  thickness?: number;
  special?: string;
}
```

**`createPhysicalMaterial()` update** to support transmission:
```typescript
export function createPhysicalMaterial(
  presetName: keyof typeof MATERIAL_PRESETS,
  envMap?: THREE.Texture | null
): THREE.MeshPhysicalMaterial {
  const preset = MATERIAL_PRESETS[presetName];
  if (!preset) throw new Error(`Unknown material preset: ${presetName}`);

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color || '#ffffff'),
    metalness: preset.metalness,
    roughness: preset.roughness,
    envMap: envMap || null,
    envMapIntensity: preset.envMapIntensity,
    emissive: preset.emissive ? new THREE.Color(preset.emissive) : undefined,
    emissiveIntensity: preset.emissiveIntensity || 0,
    // Transmission support (IndicatorGlass)
    ...(preset.transmission !== undefined && {
      transmission: preset.transmission,
      ior: preset.ior ?? 1.5,
      thickness: preset.thickness ?? 0.5,
    }),
  });
}
```

**Glow hierarchy alignment** (confirmed from JSON review):
- Bloom-heavy neon elements (LEDRim, active indicators, hex edges) coexist with matte dark surfaces (PanelFace, ConsoleBase)
- IndicatorGlass gets the holographic refraction look through transmission, not just transparency
- The `EmissiveGlow` preset remains unchanged for LED rim strips and active indicator dots

---

## 4. UPDATE 3: CONTROL ELEMENT SPATIAL LAYOUT

### 3A — Central Holographic HUD

**Problem:** The JSON image's dominant element (~50-60% viewport height) is a large circular holographic HUD with concentric rings, radial segments, and a pulsing energy core. The current StationFrame has no 3D overlay on the central viewport — it's just an HTML content window.

**Design:**
- Semi-transparent R3F overlay rendered **in front of** the HTML content window
- During normal use: 10-15% opacity (barely visible, non-obstructive)
- During transitions: 40-60% opacity with rotation animation
- During celebrations: 80-100% opacity with full animation suite
- During game mode: 0% opacity (hidden — Decision 3.4)

**New component:** `src/components/3d/HolographicHUD.tsx`

```
HUD VISUAL STRUCTURE

         ╭─── Outer Ring (RingGeometry, r=3.2-3.5) ───╮
        ╱                                               ╲
       │   ╭── Mid Ring (RingGeometry, r=2.2-2.5) ──╮   │
       │  ╱                                           ╲  │
       │ │   ╭── Inner Ring (r=1.2-1.5) ──╮           │ │
       │ │  ╱                               ╲          │ │
       │ │ │    ●  Pulsing Core (r=0.3)     │          │ │
       │ │  ╲   (SphereGeometry, emissive) ╱           │ │
       │ │   ╰─────────────────────────────╯           │ │
       │  ╲     + 12 radial scan lines                ╱  │
       │   ╰── (PlaneGeometry strips, rotating) ─────╯   │
        ╲                                               ╱
         ╰─────────────────────────────────────────────╯
           + 4 cardinal tick marks (N/S/E/W markers)
           + Data readout text sprites (optional)
```

**Key implementation details:**

```typescript
interface HolographicHUDProps {
  opacity: number;           // 0.0-1.0, driven by station mode
  color: string;             // Lab accent color
  rotationSpeed: number;     // Outer ring rotation, default 0.1 rad/s
  scanLineCount: number;     // Radial dividers, default 12
  pulseIntensity: number;    // Core pulse strength, default 0.5
  active: boolean;           // false = return null (game mode)
}
```

**Geometry:**
- 3 concentric `RingGeometry` rings (outer, mid, inner) — IndicatorGlass material
- 12 radial scan lines as thin `PlaneGeometry` strips — EmissiveGlow material
- Central pulsing core: `SphereGeometry` (32 segments) with animated emissive intensity
- All geometry at z=0.5 (between R3F background at z<0 and HTML layer at z-index 10)
- Total triangle budget: ~400-600 tris

**Animation (useFrame):**
- Outer ring: rotates at `rotationSpeed` (counter-clockwise)
- Mid ring: rotates at `rotationSpeed * -0.6` (clockwise, slower)
- Inner ring: static, subtle scale pulse (0.98-1.02, 2s period)
- Radial scan lines: one "active" line sweeps 360° per 4s (higher emissive)
- Core: pulsing emissive intensity (sin wave, 1.5s period)

**Mode integration via `useStationMode`:**

| Station Mode | HUD Opacity | Rotation Speed | Pulse Intensity |
|-------------|-------------|----------------|-----------------|
| dashboard | 0.12 | 0.1 | 0.3 |
| labmap | 0.15 | 0.15 | 0.4 |
| lab | 0.18 | 0.2 | 0.5 |
| game | 0.0 (hidden) | 0 | 0 |
| celebration | 0.85 | 0.4 | 1.0 |
| profile | 0.10 | 0.08 | 0.2 |
| onboarding | 0.08 | 0.05 | 0.15 |

### 3B — Side Auxiliary Panels

**Problem:** The JSON image shows distinct rectangular vertical tactical/data displays flanking the center. Current StationFrame has no side screen zones — only a top LED rim and CSS border.

**New component:** `src/components/3d/SidePanels.tsx`

```
SIDE PANEL LAYOUT

┌──────────┐              ┌──────────┐
│ LEFT     │              │ RIGHT    │
│ PANEL    │              │ PANEL    │
│          │   (central   │          │
│ Scanner/ │   viewport)  │ Terminal/│
│ Radar    │              │ Data     │
│ Motif    │              │ Stream   │
│          │              │          │
│ ≈12% w   │              │ ≈12% w   │
└──────────┘              └──────────┘
```

**Implementation:**

```typescript
interface SidePanelsProps {
  leftContent: 'radar' | 'labNav';     // Left panel visual motif
  rightContent: 'terminal' | 'stats';  // Right panel visual motif
  opacity: number;                      // Mode-driven
  labColor: string;                     // Active lab accent
  dimmed: boolean;                      // Game mode
}
```

**Left panel — Radar/Scanner motif:**
- `PlaneGeometry` (1.2 x 3.5 units) positioned at left edge of curved cockpit
- Animated shader texture: rotating sweep line (like radar), concentric range rings
- New GLSL shader: `src/shaders/radarSweep.glsl`
- Lab navigation: each lab represented as a dot on the "radar" at its relative position
- Active lab dot glows brighter

**Right panel — Terminal/Data stream motif:**
- `PlaneGeometry` (1.2 x 3.5 units) positioned at right edge of curved cockpit
- Animated shader texture: scrolling data characters (Matrix-style but on-brand), bar graphs
- New GLSL shader: `src/shaders/dataStream.glsl`
- Shows decorative representations of XP progress, streak, session time

**Material:** PanelFace base + IndicatorGlass overlay for the screen surface
**Triangle budget:** ~100 tris total (2 planes + minor geometry)

**Mode behavior:**

| Station Mode | Side Panels Opacity | Left Content | Right Content |
|-------------|-------------------|-------------|---------------|
| dashboard | 0.6 | radar | stats |
| labmap | 0.7 | labNav | stats |
| lab | 0.5 | labNav | stats |
| game | 0.0 (hidden) | — | — |
| celebration | 0.3 | radar | terminal |
| profile | 0.4 | radar | stats |

### 3C — Bottom Status Bar Strip

**Problem:** The JSON image shows a "horizontal status bar strip" with segmented progress bars, numeric readouts, and warning icons at bottom center. The current architecture only has CSS-based status info in the Sidebar and TopBar.

**New sub-component within `CockpitPanels.tsx`:**

```
STATUS BAR LAYOUT (bottom 5% of viewport)

┌─────────┬────────────┬──────────┬────────────┬─────────┐
│  XP BAR │ STREAK     │ SESSION  │  LAB PROG  │ ALERTS  │
│  ██████░│ 🔥 7 days  │ 12:34    │ 3/5 games  │ ● ● ○   │
│  340/500│            │          │            │         │
└─────────┴────────────┴──────────┴────────────┴─────────┘
```

**Implementation:**

```typescript
interface StatusBarProps {
  xp: number;
  xpMax: number;
  streak: number;
  sessionTime: number;        // seconds
  labProgress: { done: number; total: number };
  alerts: ('info' | 'warn' | 'none')[];
  labColor: string;
  opacity: number;
}
```

**Geometry approach — 3D gauge-style elements:**
- Base: `PlaneGeometry` strip using `ConsoleBase` material
- XP bar: Two overlapping `PlaneGeometry` quads (background + fill) — fill width driven by xp/xpMax ratio
- XP fill uses `EmissiveGlow` material colored to active lab
- Streak indicator: Small `RingGeometry` with fire-colored emissive
- Session timer: Text rendered via `drei/Text` component (Orbitron font)
- Lab progress: Segmented bar (individual small quads per game slot)
- Alert dots: 3 `CircleGeometry` indicators (green/amber/off)

**Triangle budget:** ~200-300 tris

**Data binding:**
- XP, streak: from `childStore` (already available in dashboard)
- Session time: from `useSessionTracker` hook (Stage 3 Part 3A)
- Lab progress: from `useProgress` hook (Stage 4 Part 1)
- Alerts: derived from toast store events

**Mode behavior:**
- Dashboard/labmap/lab/profile: visible at full mode opacity
- Game mode: fades to 0.15 opacity (minimal, non-distracting)
- Celebration mode: XP bar animates fill to new value with particles

---

## 5. UPDATE 4: COLOR/LIGHTING BALANCE

### 4A — Mode-Dependent Bloom & Lens Flare

**Problem:** Current Bloom is fixed at `intensity: 0.4`, `luminanceThreshold: 0.6`. The JSON image specifies high bloom + lens flare effects. Current settings are too conservative.

**Current** (`StationFrame.tsx`):
```typescript
<Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.9} mipmapBlur />
```

**New: Mode-dependent bloom table:**

```typescript
// New config in StationFrame or useStationMode
const BLOOM_PRESETS = {
  dashboard:     { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  labmap:        { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
  lab:           { intensity: 0.5, threshold: 0.5, smoothing: 0.85 },
  game:          { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
  celebration:   { intensity: 0.8, threshold: 0.3, smoothing: 0.7 },
  gameComplete:  { intensity: 1.0, threshold: 0.2, smoothing: 0.6 },
  profile:       { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  onboarding:    { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
} as const;
```

**Lens flare (celebration mode only):**

```typescript
// @react-three/postprocessing provides GodRays — use as lens flare substitute
// Only active during celebration and gameComplete modes
import { GodRays } from '@react-three/postprocessing';

// In EffectComposer, conditionally:
{mode === 'celebration' && (
  <GodRays
    sun={coreRef}           // HolographicHUD pulsing core as light source
    exposure={0.5}
    decay={0.95}
    blur
  />
)}
```

**Alternative:** If GodRays proves too heavy, use a custom anamorphic streak shader as a cheaper lens-flare approximation — horizontal streak across bright bloom sources.

**Performance note:** `gameComplete` bloom intensity 1.0 is brief (3-5 seconds during celebration overlay) and acceptable as a peak moment.

### 4B — R3F Postprocessing Vignette

**Problem:** Current vignette is CSS-only (`radial-gradient` in `.vignette-overlay` class). The JSON calls for an in-scene effect using R3F postprocessing for more convincing cockpit framing.

**Current** (`globals.css` via Stage 3 Part 3A):
```css
.vignette-overlay {
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 20, 40, 0.3) 100%
  );
}
```

**New approach — Dual layer:**

1. **R3F Vignette** (desktop only) — replaces CSS vignette on WebGL-capable devices:
```typescript
import { Vignette } from '@react-three/postprocessing';

// Inside EffectComposer (after Bloom):
<Vignette
  darkness={0.5}         // 0.4-0.6 range, mode-dependent
  offset={0.3}           // Smaller = larger dark border
  eskil={false}          // Use standard blend mode
/>
```

2. **CSS vignette retained** as fallback for:
   - Mobile (no R3F postprocessing)
   - No-WebGL fallback
   - SSR initial render

**Mode-dependent vignette darkness:**

| Mode | R3F Darkness | CSS Fallback Opacity |
|------|-------------|---------------------|
| dashboard | 0.5 | 0.3 |
| labmap | 0.4 | 0.25 |
| lab | 0.5 | 0.3 |
| game | 0.6 | 0.35 |
| celebration | 0.3 | 0.15 |
| profile | 0.5 | 0.3 |
| onboarding | 0.4 | 0.2 |

**When R3F vignette is active,** the CSS `.vignette-overlay` is set to `display: none` to avoid double-darkening:
```typescript
// In StationFrame.tsx render:
{!isMobile && isWebGLAvailable && (
  <style>{`.vignette-overlay { display: none !important; }`}</style>
)}
```

---

## 6. UPDATE 5: CAMERA & FOV

### 5A — Wider FOV + Subtle Barrel Distortion

**Problem:** Current camera FOV is fixed at 50°. The JSON image notes a "wide-angle slightly fisheye" perspective. 50° is too narrow for a cockpit feel.

**Current** (`StationFrame.tsx`):
```typescript
<Canvas camera={{ position: [0, 0, 5], fov: 50 }} ... >
```

**New: Mode-dependent FOV:**

```typescript
const CAMERA_PRESETS = {
  dashboard:   { fov: 56, distortion: 0.02 },
  labmap:      { fov: 58, distortion: 0.02 },
  lab:         { fov: 55, distortion: 0.015 },
  game:        { fov: 52, distortion: 0.0 },   // Crisp, no distortion
  celebration: { fov: 58, distortion: 0.025 },
  profile:     { fov: 54, distortion: 0.01 },
  onboarding:  { fov: 52, distortion: 0.01 },
} as const;
```

**Barrel distortion implementation:**

```typescript
// Custom barrel distortion shader pass via @react-three/postprocessing
// Very low strength to hint at fisheye without distorting UI readability

import { Effect } from 'postprocessing';

class BarrelDistortionEffect extends Effect {
  constructor({ strength = 0.02 } = {}) {
    super('BarrelDistortion', `
      uniform float strength;
      void mainUv(inout vec2 uv) {
        vec2 centered = uv - 0.5;
        float dist = dot(centered, centered);
        uv = uv + centered * dist * strength;
      }
    `, {
      uniforms: new Map([['strength', { value: strength }]]),
    });
  }
}
```

**FOV transition:** When mode changes, FOV interpolates over 0.6s using `useFrame` + lerp:
```typescript
useFrame(() => {
  if (cameraRef.current) {
    cameraRef.current.fov = THREE.MathUtils.lerp(
      cameraRef.current.fov,
      targetFov,
      0.05
    );
    cameraRef.current.updateProjectionMatrix();
  }
});
```

**Game mode exception:** Game mode uses 52° with zero barrel distortion to keep game content sharp and readable. The transition from dashboard (56°) to game (52°) creates a subtle "focus" effect.

---

## 7. CROSS-STAGE IMPACT MATRIX

| Stage | Files Affected | Change Type | Priority |
|-------|---------------|-------------|----------|
| **1 (Foundation)** | `tailwind.config.ts` | Add cockpit-specific utility classes | Low |
| **1 (Foundation)** | `src/lib/constants.ts` or new config | Bloom/camera/cockpit config constants | Medium |
| **3 Part 3A** | `src/hooks/useStationMode.ts` | Add bloom, vignette, FOV, HUD opacity fields | High |
| **3 Part 3A** | `src/app/globals.css` | Conditional vignette disable, hex panel CSS fallbacks | Medium |
| **3 Part 3B** | `src/lib/3d/materials.ts` | Add 4 new presets, extend interface, update helper | High |
| **3 Part 3B** | `src/shaders/index.ts` | Add radar sweep + data stream shader exports | High |
| **3 Part 3B** | `src/components/3d/StationFrame.tsx` | Major rewrite — curved panels, HUD, side panels, bloom modes, vignette, FOV | **Critical** |
| **3 Part 3B** | `src/components/3d/LEDRim.tsx` | Adapt to curved panel top edge (arc path vs straight line) | High |
| **4 Part 2B** | `src/hooks/useStationMode.ts` (via LabReconfig) | Ensure lab transitions update cockpit panel colors | Medium |
| **5 Part 2-3B** | `src/components/3d/GameParticles3D.tsx` | Coordinate with HUD opacity during celebrations | Low |
| **5 Part 2-3C** | Celebration ceremonies | Bloom spike to 1.0, HUD full activation | Medium |
| **6-7 (All games)** | Game chrome bezel wrapper | Cockpit panels dim (Decision 3.4), game FOV 52° | Low |
| **8 Part 3** | ScrollJourney landing page | Cockpit elements visible in marketing preview? | Low |
| **10 Part 1** | `src/components/providers/A11yProvider.tsx` | reducedMotion disables barrel distortion + HUD rotation | Medium |
| **10 Part 1** | CSP headers | No new external domains required | None |

---

## 8. FILE CHANGE REGISTRY

### New Files

| # | File Path | Stage | Description |
|---|-----------|-------|-------------|
| 1 | `src/components/3d/CockpitPanels.tsx` | 3 Part 3B | Main curved panel geometry + hex sub-panels |
| 2 | `src/components/3d/HolographicHUD.tsx` | 3 Part 3B | Concentric rings, radial scan, pulsing core overlay |
| 3 | `src/components/3d/SidePanels.tsx` | 3 Part 3B | Left radar + right terminal decorative panels |
| 4 | `src/components/3d/StatusBar3D.tsx` | 3 Part 3B | 3D gauge-style bottom status strip |
| 5 | `src/components/3d/BarrelDistortion.tsx` | 3 Part 3B | Custom postprocessing effect wrapper |
| 6 | `src/shaders/radarSweep.glsl` | 3 Part 3B | Left panel animated radar sweep shader |
| 7 | `src/shaders/dataStream.glsl` | 3 Part 3B | Right panel scrolling data stream shader |
| 8 | `src/shaders/holographicRing.glsl` | 3 Part 3B | HUD ring glow + scan line shader |
| 9 | `src/lib/3d/cockpitConfig.ts` | 3 Part 3B | Cockpit geometry, bloom, camera, vignette configs |

### Modified Files

| # | File Path | Stage | Changes |
|---|-----------|-------|---------|
| 1 | `src/lib/3d/materials.ts` | 3 Part 3B | +4 presets, +transmission fields, +createPhysicalMaterial update |
| 2 | `src/shaders/index.ts` | 3 Part 3B | +3 shader string exports (radar, dataStream, holographicRing) |
| 3 | `src/components/3d/StationFrame.tsx` | 3 Part 3B | Major rewrite: add CockpitPanels, HUD, SidePanels, StatusBar, mode-dependent bloom/vignette/FOV |
| 4 | `src/components/3d/LEDRim.tsx` | 3 Part 3B | Adapt geometry to curved arc path |
| 5 | `src/hooks/useStationMode.ts` | 3 Part 3A | Add bloomPreset, vignetteSettings, fovPreset, hudOpacity, sidePanelOpacity fields |
| 6 | `src/app/globals.css` | 3 Part 3A | Add hex-panel CSS fallback, conditional vignette toggle |
| 7 | `src/app/(dashboard)/layout.tsx` | 3 Part 3A | Pass new mode fields to StationFrame |

---

## 9. NEW FILES REQUIRED

### `src/lib/3d/cockpitConfig.ts`

Central configuration for all cockpit parameters — single source of truth.

```typescript
// Cockpit Panoramic Architecture — Central Config
// All geometry, bloom, camera, and mode-dependent parameters

export const COCKPIT_GEOMETRY = {
  panelCurvature: 0.85,
  totalWrapArc: 140,          // degrees
  panelRadius: 4.0,           // distance from camera
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,            // individual hex panel radius
  hexDepth: 0.02,             // extrusion depth
} as const;

export const BLOOM_PRESETS = {
  dashboard:     { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  labmap:        { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
  lab:           { intensity: 0.5, threshold: 0.5, smoothing: 0.85 },
  game:          { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
  celebration:   { intensity: 0.8, threshold: 0.3, smoothing: 0.7 },
  gameComplete:  { intensity: 1.0, threshold: 0.2, smoothing: 0.6 },
  profile:       { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  onboarding:    { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
} as const;

export const CAMERA_PRESETS = {
  dashboard:   { fov: 56, distortion: 0.02 },
  labmap:      { fov: 58, distortion: 0.02 },
  lab:         { fov: 55, distortion: 0.015 },
  game:        { fov: 52, distortion: 0.0 },
  celebration: { fov: 58, distortion: 0.025 },
  profile:     { fov: 54, distortion: 0.01 },
  onboarding:  { fov: 52, distortion: 0.01 },
} as const;

export const VIGNETTE_PRESETS = {
  dashboard:   { darkness: 0.5, offset: 0.3 },
  labmap:      { darkness: 0.4, offset: 0.3 },
  lab:         { darkness: 0.5, offset: 0.3 },
  game:        { darkness: 0.6, offset: 0.25 },
  celebration: { darkness: 0.3, offset: 0.4 },
  profile:     { darkness: 0.5, offset: 0.3 },
  onboarding:  { darkness: 0.4, offset: 0.35 },
} as const;

export const HUD_PRESETS = {
  dashboard:   { opacity: 0.12, rotationSpeed: 0.1, pulseIntensity: 0.3 },
  labmap:      { opacity: 0.15, rotationSpeed: 0.15, pulseIntensity: 0.4 },
  lab:         { opacity: 0.18, rotationSpeed: 0.2, pulseIntensity: 0.5 },
  game:        { opacity: 0.0, rotationSpeed: 0, pulseIntensity: 0 },
  celebration: { opacity: 0.85, rotationSpeed: 0.4, pulseIntensity: 1.0 },
  profile:     { opacity: 0.10, rotationSpeed: 0.08, pulseIntensity: 0.2 },
  onboarding:  { opacity: 0.08, rotationSpeed: 0.05, pulseIntensity: 0.15 },
} as const;

export const SIDE_PANEL_PRESETS = {
  dashboard:   { opacity: 0.6, leftContent: 'radar', rightContent: 'stats' },
  labmap:      { opacity: 0.7, leftContent: 'labNav', rightContent: 'stats' },
  lab:         { opacity: 0.5, leftContent: 'labNav', rightContent: 'stats' },
  game:        { opacity: 0.0, leftContent: 'radar', rightContent: 'stats' },
  celebration: { opacity: 0.3, leftContent: 'radar', rightContent: 'terminal' },
  profile:     { opacity: 0.4, leftContent: 'radar', rightContent: 'stats' },
  onboarding:  { opacity: 0.3, leftContent: 'radar', rightContent: 'stats' },
} as const;
```

---

## 10. MODIFIED FILES REGISTRY

### `useStationMode.ts` — Extended Interface

```typescript
// NEW FIELDS added to StationModeState
export interface StationModeState {
  // ... existing fields ...
  mode: StationMode;
  ledColor: string;
  bgIntensity: number;
  particleCount: number;
  particleSpeed: number;
  frameGlow: number;
  frameDimmed: boolean;
  activeLabId: number | null;
  activeLabColor: string;
  activeLabName: string;

  // NEW — Cockpit Panoramic Architecture fields
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  vignetteDarkness: number;
  vignetteOffset: number;
  cameraFov: number;
  barrelDistortion: number;
  hudOpacity: number;
  hudRotationSpeed: number;
  hudPulseIntensity: number;
  sidePanelOpacity: number;
  statusBarOpacity: number;
  panelCurvature: number;      // 0.0 (flat/retracted) to 0.85 (full cockpit)
}
```

### `StationFrame.tsx` — Revised Architecture

The StationFrame becomes the orchestrator of all cockpit sub-components:

```
StationFrame (revised)
├── Canvas
│   ├── AdaptiveDpr
│   ├── Environment (HDR)
│   ├── AuroraBackground (unchanged)
│   ├── AmbientParticles (unchanged)
│   ├── CockpitPanels (NEW — curved panels + hex sub-panels)
│   ├── LEDRim (modified — curved path)
│   ├── SidePanels (NEW — left radar + right terminal)
│   ├── HolographicHUD (NEW — concentric rings overlay)
│   ├── StatusBar3D (NEW — bottom gauge strip)
│   └── EffectComposer
│       ├── Bloom (mode-dependent intensity)
│       ├── Vignette (NEW — replaces CSS on desktop)
│       └── BarrelDistortion (NEW — subtle fisheye)
├── CSS: scanline overlay (unchanged)
├── CSS: vignette fallback (conditionally hidden on desktop)
└── CSS: station-frame-css (fallback, unchanged)
```

---

## 11. SOUND DESIGN INTEGRATION

The cockpit architecture introduces new audio opportunities via the existing Tone.js integration (Stage 5):

| Event | Sound | Implementation |
|-------|-------|----------------|
| Mode transition (dashboard → lab) | Low hum pitch shift + mechanical servo | `Tone.Synth` frequency sweep 80Hz→120Hz, 0.3s |
| HUD activation (celebration) | Rising digital chime + ring tone | `Tone.MetalSynth` with delay effect |
| Hex panel pulse | Subtle click/tick | `Tone.NoiseSynth` burst, 20ms, filtered |
| Status bar XP fill | Progress ascending tone | `Tone.FMSynth` frequency ramp proportional to fill % |
| Barrel distortion engage | Subtle lens whoosh | `Tone.NoiseSynth` with bandpass sweep |
| Side panel data stream | Ambient digital chatter (very quiet) | `Tone.NoiseSynth` continuous, -30dB, filtered |

**Sound gating:** All cockpit sounds respect `child.settings.soundEnabled` (Decision 1.3). When disabled, all audio calls are no-ops. Sound volume scales with the accessibility `reducedMotion` preference (reduced = 50% volume, off for motion sounds).

---

## 12. PERFORMANCE BUDGET

### Triangle Budget (Desktop)

| Component | Current Tris | New Tris | Delta |
|-----------|-------------|----------|-------|
| Aurora background | 2 (plane) | 2 | 0 |
| Ambient particles | ~600 (points) | ~600 | 0 |
| LED rim | ~100 | ~150 (curved) | +50 |
| Cockpit panels | 0 | ~1000 | +1000 |
| Hex sub-panels | 0 | ~200 | +200 |
| HolographicHUD | 0 | ~500 | +500 |
| Side panels | 0 | ~100 | +100 |
| Status bar | 0 | ~250 | +250 |
| **TOTAL** | **~700** | **~2800** | **+2100** |

**Budget limit:** 3000 tris for entire station frame. We're at ~2800 — within budget.

### GPU Cost (Postprocessing)

| Effect | Current Cost | New Cost | Notes |
|--------|-------------|----------|-------|
| Bloom | ~0.5ms | ~0.5-0.8ms (mode-dependent) | Max 1.0 intensity is brief |
| Vignette | 0ms (CSS) | ~0.1ms | Very cheap effect |
| Barrel distortion | 0ms | ~0.1ms | Single-pass UV modification |
| GodRays (celebration) | 0ms | ~0.3ms (intermittent) | Only during 3-5s celebrations |
| **TOTAL** | **~0.5ms** | **~0.7-1.3ms** | Well within 16ms frame budget |

### Mobile Impact

**Zero.** All new components return `null` on mobile. CSS fallbacks handle:
- Cockpit panels → `station-frame-css` border (existing)
- HUD → hidden
- Side panels → hidden
- Status bar → CSS bottom strip (new class `.status-bar-mobile`)
- Bloom modes → no bloom on mobile (existing behavior)
- Vignette → CSS fallback (existing)
- Barrel distortion → none

---

## 13. MOBILE FALLBACK STRATEGY

### CSS-Only Cockpit (Mobile / No-WebGL)

When `isMobile === true` or `isWebGLAvailable === false`, the cockpit reduces to:

```css
/* Existing classes (unchanged) */
.station-frame-css { ... }        /* Border overlay */
.vignette-overlay { ... }         /* Radial gradient */
.scanline-overlay { ... }         /* CRT lines */
.chrome-bezel { ... }             /* Glassmorphism card borders */
.led-rim { ... }                  /* Top glow strip */

/* NEW classes for mobile cockpit hint */
.cockpit-side-indicator {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 40%;
  background: linear-gradient(180deg, transparent, var(--glow-color, #00BBFF), transparent);
  opacity: 0.15;
  pointer-events: none;
  z-index: 2;
}
.cockpit-side-indicator.left { left: 0; }
.cockpit-side-indicator.right { right: 0; }

.status-bar-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 10%, var(--glow-color, #00BBFF) 30%, var(--glow-color, #00BBFF) 70%, transparent 90%);
  opacity: 0.3;
  pointer-events: none;
  z-index: 2;
}
```

This gives mobile users a subtle cockpit framing without any WebGL cost.

---

## 14. MIGRATION NOTES

### Build Order Impact

These changes are **all within Stage 3 Part 3B** (Phase 5 of the build plan). No earlier stages are affected. The implementation order within Stage 3 Part 3B becomes:

1. Shaders first (noise, aurora, scanline, chrome — existing)
2. **NEW shaders** (radarSweep, dataStream, holographicRing)
3. Materials update (add 4 presets, extend interface)
4. **NEW cockpitConfig.ts**
5. `useStationMode.ts` extension (new fields)
6. AuroraBackground (unchanged)
7. AmbientParticles (unchanged)
8. LEDRim (curved adaptation)
9. **NEW CockpitPanels.tsx**
10. **NEW HolographicHUD.tsx**
11. **NEW SidePanels.tsx**
12. **NEW StatusBar3D.tsx**
13. **NEW BarrelDistortion.tsx**
14. StationFrame.tsx (rewrite as orchestrator)
15. CrystalShatter, CrystalHero, OnboardingCrystal (unchanged)
16. Dashboard layout update (pass new mode fields)
17. globals.css additions (mobile fallbacks)

### Backward Compatibility

- All existing CSS classes remain functional
- All existing component props remain valid
- `StationFrame` gains new optional props (all have defaults)
- `useStationMode` returns a superset of current state (existing fields unchanged)
- Games that reference `frameDimmed` still work — cockpit panels respect this flag

### Testing Checklist

After implementation, verify:
- [ ] Dashboard: curved panels visible, HUD at ~12% opacity, side panels active
- [ ] Lab map: panels slightly brighter, HUD 15%, bloom 0.5
- [ ] Lab view: panels colored to active lab, hex indicators highlight lab number
- [ ] Game mode: all cockpit elements dim/hidden, FOV 52°, no distortion
- [ ] Celebration: HUD full activation, bloom spike to 0.8, GodRays active
- [ ] Mobile: no WebGL components rendered, CSS fallbacks visible
- [ ] No-WebGL desktop: CSS cockpit indicators visible
- [ ] Reduced motion: no barrel distortion, no HUD rotation, no hex pulse
- [ ] Performance: frame time stays under 16ms on mid-range desktop GPU

---

## 15. DECISION LOCK ADDITIONS

These new decisions should be added to the Decision Lock Checkpoints:

| ID | Decision | Value | Rationale |
|----|----------|-------|-----------|
| **CPA-1** | Panel curvature model | CylinderGeometry segments, 140° arc, r=4.0 | Matches JSON cockpit panoramic |
| **CPA-2** | Hex sub-panel count | 2 clusters x 3 hexes = 6 total | Flanking console desk |
| **CPA-3** | IndicatorGlass transmission | transmission=0.6, ior=1.2, thickness=0.5 | Holographic glass refraction |
| **CPA-4** | HUD normal-use opacity | 10-15% (mode-dependent) | Non-obstructive during content viewing |
| **CPA-5** | HUD geometry | 3 concentric rings + 12 radial lines + core sphere | Matches JSON circular HUD spec |
| **CPA-6** | Side panels content | Left=radar/labNav, Right=terminal/stats | Decorative, mode-driven |
| **CPA-7** | Bloom mode table | dashboard=0.4 to gameComplete=1.0 | Progressive intensity by context |
| **CPA-8** | R3F Vignette replaces CSS | darkness=0.5, offset=0.3 (desktop only) | More convincing cockpit framing |
| **CPA-9** | Dashboard FOV | 56° (was 50°) | Wider cockpit perspective |
| **CPA-10** | Barrel distortion | 0.02 strength (dashboard), 0.0 (game) | Subtle fisheye, never in games |
| **CPA-11** | Total station frame tri budget | 3000 max | Performance guardrail |
| **CPA-12** | Mobile cockpit | CSS-only indicators, zero WebGL | No mobile performance impact |

---

## APPENDIX A: VISUAL REFERENCE MAPPING

| JSON Image Element | SparkForge Component | Notes |
|-------------------|---------------------|-------|
| Curved panoramic dashboard | CockpitPanels.tsx | CylinderGeometry wrap |
| Lower hexagonal panels | CockpitPanels.tsx (hex sub-component) | ShapeGeometry + ExtrudeGeometry |
| Central circular HUD | HolographicHUD.tsx | RingGeometry + PlaneGeometry strips |
| Concentric rings | HolographicHUD.tsx | 3 RingGeometry instances |
| Radial scan lines | HolographicHUD.tsx | 12 PlaneGeometry strips, rotating |
| Pulsing energy core | HolographicHUD.tsx | SphereGeometry, animated emissive |
| Left tactical display | SidePanels.tsx (left) | radarSweep.glsl shader |
| Right data display | SidePanels.tsx (right) | dataStream.glsl shader |
| Bottom status bar | StatusBar3D.tsx | 3D gauges, text via drei/Text |
| Metallic panel reflections | PanelFace + WornChrome materials | New PBR presets |
| Holographic glass overlays | IndicatorGlass material | transmission + refraction |
| Bloom + lens flare | EffectComposer (Bloom + GodRays) | Mode-dependent intensity |
| Darkened cockpit borders | R3F Vignette effect | Replaces CSS gradient on desktop |
| Wide-angle fisheye | Camera FOV 56° + BarrelDistortion | Subtle, disabled in game mode |

---

## APPENDIX B: COMPONENT DEPENDENCY GRAPH

```
cockpitConfig.ts (constants)
├── used by: useStationMode.ts (bloom, camera, vignette, HUD presets)
├── used by: CockpitPanels.tsx (geometry constants)
├── used by: HolographicHUD.tsx (HUD presets)
├── used by: SidePanels.tsx (opacity/content presets)
└── used by: StationFrame.tsx (bloom, camera, vignette values)

materials.ts (extended)
├── used by: CockpitPanels.tsx (PanelFace, WornChrome, ConsoleBase)
├── used by: HolographicHUD.tsx (IndicatorGlass, EmissiveGlow)
├── used by: SidePanels.tsx (PanelFace, IndicatorGlass)
├── used by: StatusBar3D.tsx (ConsoleBase, EmissiveGlow)
└── used by: LEDRim.tsx (EmissiveGlow — existing)

shaders/index.ts (extended)
├── radarSweep → SidePanels.tsx (left)
├── dataStream → SidePanels.tsx (right)
└── holographicRing → HolographicHUD.tsx

StationFrame.tsx (orchestrator)
├── AuroraBackground (unchanged)
├── AmbientParticles (unchanged)
├── CockpitPanels (NEW)
├── LEDRim (modified)
├── SidePanels (NEW)
├── HolographicHUD (NEW)
├── StatusBar3D (NEW)
└── EffectComposer
    ├── Bloom (mode-dependent)
    ├── Vignette (NEW)
    └── BarrelDistortion (NEW)
```

---

*End of COCKPIT_PANORAMIC_ARCHITECTURE_v1.md*
*Pending review — do NOT implement until approved.*
