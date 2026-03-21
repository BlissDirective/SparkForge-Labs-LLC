# STAGE 3: AUTH, LAYOUT & STATION FRAME — v3-FINAL (PART 3B)

**Updated:** March 15, 2026 — CPA v2.0 (3D Panoramic Cockpit Enhancement) integration
**Previous:** March 14, 2026 — CPA v1.0

## Overview

Part 3B delivers the **full R3F (React Three Fiber) 3D layer** for the Laboratory Control Station vision. This replaces the Part 3A CSS-only StationFrame placeholder with a persistent R3F Canvas containing aurora background shaders, GPU-instanced ambient particles with connection lines, an emissive LED rim strip, Bloom post-processing, and WebGL detection with CSS fallbacks. It also adds the cinematic entry sequence (originally CrystalShatter ~7s, now **superseded by HeroAnimation.tsx** — 8-phase, 19s), a landing page CrystalHero with mouse parallax, an OnboardingCrystal that forms as onboarding steps progress, GLSL shader infrastructure (noise library, aurora, scanline, chrome), 7+4 PBR material presets, and a GSAP ScrollTrigger wrapper hook.

**CPA v2.0 additions:** StationFrame refactored from a standalone Canvas into a scene group within the unified `CockpitCanvas` orchestrator (Decision CPA2-1). Single R3F Canvas contains ALL cockpit + spatial dashboard elements. CockpitPanels upgraded with viewport-adaptive curvature (CPA2-2) and functional hex clusters with real data binding (CPA2-3). HolographicHUD v2 with data-driven rings (session time, lab progress, XP-to-level), mini-map integration, and threat/achievement radar. SidePanels with skin-reactive shader uniforms. StatusBar3D with real-time store subscriptions. Skin-reactive panel materials per cockpit skin (CPA2-5). NEW: WormholeTransition for lab entry cinematics (CPA2-6), CeremonyFX for achievement celebrations (CPA2-10), ConsoleDetailPanel for expandable console info, MiniMapOverlay for persistent navigation, NPCDialogueBubble for contextual NPC speech. 4 material presets (PanelFace, WornChrome, IndicatorGlass, ConsoleBase). 5 GLSL shaders (radarSweep, dataStream, holographicRing, dissolve, wormhole). Triangle budget: 104,400 (desktop ultra) with LOD degradation.

### v3 Decisions Implemented

- **1.1**: Voronoi fracture (simplified as instanced shards)
- **1.2**: Crystal shatter on both landing + dashboard entry
- **1.3**: Sound optional via child settings (sound hooks ready, audio files deferred)
- **1.4**: Skip button + tap-to-skip on CrystalShatter
- **1.5**: Shards reform into chrome bezel outline (Phase 5)
- **1.6**: ~7s total (5 timed phases)
- **1.7**: Particles coalesce into crystal letters (Phase 2)
- **2.1**: StationFrame R3F canvas on ALL dashboard pages (replaces CSS placeholder)
- **2.3**: Scanline overlay (toggleable, 0.03 opacity)
- **2.4**: Simplified 3D on mobile (reduced particle count, no Bloom, no connection lines)
- **2.5**: Edge-to-edge frame as border overlay
- **5.1**: Ambient particles on every dashboard page
- **5.5**: Intensity slider presets (off/low/medium/high)
- **5.6**: Connection lines at Medium+ tied to slider
- **7.1**: Custom Frost-Prismatic HDR specification (fallback to drei 'night' preset)
- **7.3**: PBR desktop, CSS mobile
- **7.4**: Selective emissive glow (LED rim, active indicators)
- **8.1**: CrystalHero — shared crystal DNA, different execution (parallax + sparkles, not cinematic)
- **CPA-1**: CylinderGeometry panoramic wrap (140° arc, r=4.0)
- **CPA-2**: Hex sub-panel count (2 clusters x 3 = 6 total)
- **CPA-3**: IndicatorGlass transmission (0.6, ior=1.2, thickness=0.5)
- **CPA-4**: HUD normal-use opacity (10-15%)
- **CPA-5**: HUD geometry (3 rings + 12 radial lines + core sphere)
- **CPA-6**: Side panels (left=radar/labNav, right=terminal/stats)
- **CPA-7**: Bloom mode table (dashboard=0.4 to gameComplete=1.0)
- **CPA-8**: R3F Vignette replaces CSS (darkness=0.5, offset=0.3)
- **CPA-9**: Dashboard FOV (56°, was 50°)
- **CPA-10**: Barrel distortion (0.02 strength, 0.0 in games)
- **CPA-11**: Total station frame tri budget — upgraded to 104,400 (desktop ultra) with LOD degradation
- **CPA-12**: Mobile cockpit (CSS-only indicators, zero WebGL)
- **CPA2-1**: Single R3F Canvas for all cockpit + spatial content (replaces dual canvas)
- **CPA2-2**: Viewport-adaptive curvature (120-155° arc based on window width)
- **CPA2-3**: Hex clusters display real data — left: lab nav, right: XP/streak/alerts
- **CPA2-4**: Skin unlock via achievements (not free selection)
- **CPA2-5**: Skin transition uses dissolve shader (not crossfade)
- **CPA2-6**: Lab entry uses wormhole cinematic (2.5s)
- **CPA2-7**: NPC dialogue bubbles are HTML overlays (not 3D text)
- **CPA2-8**: Spatial audio via Tone.js Panner3D
- **CPA2-9**: Mobile gets zero R3F (pure CSS fallback)
- **CPA2-10**: Ceremony FX intensity scales by event type
- **CPA2-11**: Console detail panels are glassmorphic HTML overlays
- **CPA2-12**: Adaptive FPS monitoring can fall back to CSS at <40% target

### Files Created/Modified

| # | File | Action |
|---|------|--------|
| 1 | `src/shaders/noise.glsl` | Created |
| 2 | `src/shaders/aurora.glsl` | Created |
| 3 | `src/shaders/scanline.glsl` | Created |
| 4 | `src/shaders/index.ts` | Created (**CPA: +3 shader exports: radarSweep, dataStream, holographicRing**) |
| 5 | `src/lib/3d/materials.ts` | Created (**CPA: +4 presets, +transmission fields, +createPhysicalMaterial update**) |
| 6 | `src/components/3d/AuroraBackground.tsx` | Created |
| 7 | `src/components/3d/AmbientParticles.tsx` | Created |
| 8 | `src/components/3d/LEDRim.tsx` | Created (**CPA: curved arc via TubeGeometry + CatmullRomCurve3**) |
| 9 | `src/components/3d/StationFrame.tsx` | Replaced (**CPA v2.0: refactored to scene group — delegates to CockpitCanvas**) |
| 10 | `src/components/3d/CrystalShatter.tsx` | Created — **SUPERSEDED** by `HeroAnimation.tsx` (archived to `_SUPERSEDED/`) |
| 10b | `src/components/3d/HeroAnimation.tsx` | Created — **REPLACEMENT** for CrystalShatter (Hero Animation v2.0) |
| 11 | `src/components/3d/CrystalHero.tsx` | Created — **RETAINED** (separate component, Decision 8.1) |
| 12 | `src/components/3d/OnboardingCrystal.tsx` | Created |
| 13 | `src/hooks/useGSAPScroll.ts` | Created |
| 14 | `public/hdri/README-frost-prismatic.md` | Created |
| 15 | `src/app/(dashboard)/layout.tsx` | Modified (**CPA v2.0: imports CockpitCanvas, single Canvas orchestrator**) |
| 16 | `src/components/3d/CockpitPanels.tsx` | **CPA v2.0: Created** — Adaptive curved panels + functional hex clusters with data binding |
| 17 | `src/components/3d/HolographicHUD.tsx` | **CPA v2.0: Created** — Data-driven rings (session/lab/XP) + mini-map + event radar |
| 18 | `src/components/3d/SidePanels.tsx` | **CPA v2.0: Created** — Left radar + right terminal with skin-reactive shaders |
| 19 | `src/components/3d/StatusBar3D.tsx` | **CPA v2.0: Created** — 3D gauge strip with real-time store subscriptions |
| 20 | `src/components/3d/BarrelDistortion.tsx` | **CPA: Created** — Custom postprocessing effect |
| 21 | `src/components/3d/CockpitCanvas.tsx` | **CPA v2.0: Created** — Unified R3F Canvas orchestrator (Decision CPA2-1) |
| 22 | `src/components/3d/WormholeTransition.tsx` | **CPA v2.0: Created** — Lab entry/exit cinematic (Decision CPA2-6) |
| 23 | `src/components/3d/CeremonyFX.tsx` | **CPA v2.0: Created** — Achievement/level-up ceremony FX (Decision CPA2-10) |
| 24 | `src/components/dashboard/ConsoleDetailPanel.tsx` | **CPA v2.0: Created** — Expandable console info overlays (Decision CPA2-11) |
| 25 | `src/components/dashboard/MiniMapOverlay.tsx` | **CPA v2.0: Created** — Persistent mini-map (top-right) |
| 26 | `src/components/dashboard/NPCDialogueBubble.tsx` | **CPA v2.0: Created** — Contextual NPC speech bubbles (Decision CPA2-7) |
| 27 | `src/shaders/dissolve.glsl` | **CPA v2.0: Created** — Skin transition dissolve shader (Decision CPA2-5) |
| 28 | `src/shaders/wormhole.glsl` | **CPA v2.0: Created** — Lab entry tunnel energy shader |

### Packages Installed

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing gsap --legacy-peer-deps
```

> `--legacy-peer-deps` required due to peer dependency conflicts between R3F ecosystem packages.

---

## CPA v2.0 — Unified Scene Graph Architecture

> **Decision CPA2-1:** v1 had separate R3F Canvas instances for StationFrame and SpatialDashboard. v2.0 merges them into a **single R3F Canvas** at `z-index: 0` with all cockpit elements as siblings in one scene graph.

### Single Canvas Composition (CockpitCanvas.tsx)

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
├── CockpitPanels (curved panoramic wrap + hex clusters — adaptive curvature)
├── LEDRim (curved arc, lab-colored)
├── SidePanels (left: radar/labNav, right: terminal/stats — skin-reactive)
├── StatusBar3D (bottom gauge strip — real-time data)
├── HolographicHUD (data-driven rings, mini-map, event radar)
│
├── /* LAYER 4: Postprocessing */
├── EffectComposer
│   ├── Bloom (mode-dependent: CPA-7)
│   ├── Vignette (mode-dependent: CPA-8)
│   └── BarrelDistortion (mode-dependent: CPA-10)
│
└── /* LAYER 5: Transition FX (when active) */
    ├── WormholeTransition (lab entry/exit — 2.5s)
    ├── GameLaunchZoom (game focus sequence — 1.5s)
    └── CeremonyFX (achievement/level-up — scales by type)
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

### CockpitCanvas Component Interface

```typescript
// src/components/3d/CockpitCanvas.tsx
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

### HolographicHUD v2 — Data-Driven Rings

Each HUD ring maps to real data (Decision CPA2-3):

| Ring | Radius | Data | Visual |
|------|--------|------|--------|
| Outer (r=3.2-3.5) | Session time | Ring fills clockwise over session duration (60min = full) |
| Mid (r=2.2-2.5) | Lab progress | 10 segments, each lit = lab completed |
| Inner (r=1.2-1.5) | XP to next level | Fill ring, pulsing at >90% |
| Core sphere | Current level | Size scales with level (1-50) |

The 12 radial scan lines become an **event radar** — lines glow gold (near badge), green (new content), or orange (pending challenge) when sweeping past relevant labs.

### Hex Cluster Data Binding (CPA2-3)

**Left Hex Cluster (Lab Navigation):**
- Hex 1: Active lab indicator (pulsing lab color, lab number texture)
- Hex 2: Lab completion ring (fill = completion %)
- Hex 3: Next recommended lab (mission marker pulse)

**Right Hex Cluster (Status Indicators):**
- Hex 1: XP rate indicator (sparkle speed = recent XP/min)
- Hex 2: Streak status (flame opacity = streak heat)
- Hex 3: Alert indicator (badge earned, challenge waiting)

### WormholeTransition (Lab Entry — CPA2-6)

2.5s sequence when child enters a lab:
1. Camera acceleration (0-0.8s) — flies toward focused lab
2. Wormhole open (0.8-1.2s) — torus geometry expands with lab-colored energy shader
3. Tunnel transit (1.2-2.0s) — procedural tunnel (CylinderGeometry, BackSide, animated UV)
4. Emerge (2.0-2.5s) — tunnel dissolves, lab page content fades in

### CeremonyFX (Achievement Celebrations — CPA2-10)

Intensity scales by event type:

| Type | Bloom Peak | Particle Count | HUD Expansion | Duration |
|------|-----------|---------------|---------------|----------|
| xp | 0.6 | 50 | 1.1x | 1.5s |
| badge | 0.8 | 100 | 1.3x | 2.0s |
| levelUp | 1.0 | 200 | 1.5x | 3.0s |
| gameComplete | 0.9 | 150 | 1.4x | 2.5s |
| streakMilestone | 0.7 | 80 | 1.2x | 2.0s |

### Skin-Reactive Panel Materials (CPA2-5)

Panel materials respond to active cockpit skin:

| Skin | PanelFace Tint | Hex Edge Glow | Chrome Reflection |
|------|---------------|---------------|-------------------|
| Default | `#1a1e2e` | Lab color | Frost-Prismatic HDR |
| Cyberpunk | `#2a0030` | `#FF00FF` / `#00FFFF` | Neon grid reflection |
| Space | `#0a0a1e` | `#4444FF` | Starfield reflection |
| Underwater | `#0a1a2e` | `#00BBFF` | Caustic light pattern |
| Crystal | `#1a0828` | `#AA66FF` | Prismatic refraction |

### Skin Transition Effects (CPA2-5)

When switching skins, a 2-second dissolve sequence plays:
1. Dissolve out (0-0.5s) — dithered dissolve shader (`src/shaders/dissolve.glsl`)
2. Flash (0.5-0.7s) — bloom spike to 2.0
3. Dissolve in (0.7-2.0s) — new skin materializes with particle burst
4. Settle (2.0-2.5s) — all elements reach steady state

### Console Detail Panels (CPA2-11)

Clicking a console opens a glassmorphic HTML overlay:

| Console | Detail Panel Content |
|---------|---------------------|
| XP | Level progress bar, XP history graph (last 7 days), next level requirements |
| Badges | Badge grid (earned + locked), recent badge highlight with description |
| Streak | Streak calendar (last 30 days), longest streak record, daily goal status |
| Progress | Per-lab completion grid, game completion counts, recommended next games |

### Mode Transition Orchestration

| Transition | Duration | Easing | Elements Affected |
|-----------|----------|--------|-------------------|
| dashboard → lab | 800ms | spring(300, 25) | Camera flies to lab, panels stay, HUD shifts to labfocus |
| lab → game | 600ms | easeInOut | Camera zooms into game, panels retract (curvature 0.3), HUD hides |
| game → lab | 400ms | easeOut | Camera pulls back, panels expand, HUD fades in |
| lab → dashboard | 800ms | spring(300, 25) | Camera returns to overview, all elements restore |
| any → celebration | 200ms | easeIn | Bloom spikes, HUD flares, panels pulse lab color |
| celebration → previous | 1200ms | easeOut | Gradual return to pre-celebration state |

---

## Enhancement 8.2 — WebGPU Rendering Pipeline Integration

> **Source:** ENHANCEMENT_BLUEPRINT_v1.0 Section 8.2
> **Impact:** 2-5x rendering performance improvement on supported browsers.

### WebGPU Auto-Detection in CockpitCanvas

The `CockpitCanvas` component (defined above) must integrate WebGPU auto-detection at initialization. The detection utility from Hero Animation Part A (`src/lib/webgpuDetection.ts`) is called once on mount. Results are stored in the `deviceStore` (Zustand) for global access.

> **FIX (March 21, 2026):** Replaced Jotai atom references (`cockpitAtoms.ts`) with `deviceStore` (Zustand). The `cockpitAtoms.ts` file was never created in any stage document. `deviceStore` already provides `gpuTier` and `setGpuTier`. Also fixed function name (`detectRendererCapability` → `detectGPUTier`) and path (`@/lib/3d/webgpuDetect` → `@/lib/webgpuDetection`) to match Hero Animation Part A.

```typescript
// In CockpitCanvas.tsx initialization:
import { detectGPUTier } from '@/lib/webgpuDetection';
import { useDeviceStore } from '@/stores/deviceStore';

// On mount (inside useEffect):
const setGpuTier = useDeviceStore(s => s.setGpuTier);

useEffect(() => {
  detectGPUTier().then((gpuTier) => {
    setGpuTier(gpuTier);
    console.log(`[SparkForge] GPU Tier: ${gpuTier}`);
  });
}, [setGpuTier]);
```

### R3F Canvas Renderer Selection

```typescript
// CockpitCanvas uses R3F's gl prop to configure the renderer:
<Canvas
  gl={(canvas) => {
    // Three.js r170+ WebGPURenderer is available but requires explicit opt-in
    // For now, use default WebGLRenderer — WebGPU migration happens per-shader
    // When all shaders are TSL, switch to WebGPURenderer here
    return new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  }}
  // ... other props
>
```

### TSL Shader Migration Path

All 19 GLSL shaders (listed in Stage 1 Part 2 Step 20h) are migrated **gradually** to TSL:

| Phase | Shaders | Priority | Notes |
|-------|---------|----------|-------|
| Phase 1 | Lab patterns 1-10 | Medium | Background shaders — most visual impact |
| Phase 2 | aurora, scanline, barrelDistortion | Medium | Cockpit shell effects |
| Phase 3 | liquidMetal, holographic, energyField | Low | Badge/gamification shaders |
| Phase 4 | dissolveTransition, wormholeEffect, hexCluster | Low | CPA v2.0 transition shaders |

**Key rule:** Both GLSL and TSL shaders work simultaneously. No big-bang migration needed. The `TSL_MIGRATION_STATUS` record in `webgpuDetection.ts` tracks which shaders have been migrated.

### Compute Shaders for Particles (Enhancement 8.2)

When WebGPU is available, particle systems (AmbientParticles, GameParticles3D, CeremonyFX) can use **compute shaders** for GPU-accelerated particle updates:

- **10K+ particles** without CPU overhead (vs current 50-200 CPU-updated particles)
- **GPU-accelerated physics** for Sort Toy Box drag interactions and Robot Vacuum pathfinding
- Compute shaders are TSL-native and only available on WebGPU renderer
- Fallback: CPU-based particle updates continue on WebGL2 (current behavior, no regression)

---

## Discrepancies & Build Fixes

| # | Issue | Fix Applied | Category |
|---|-------|-------------|----------|
| 1 | `mode` prop unused in StationFrame body (TS error: unused variable) | Prefixed with underscore: `mode: _mode` in destructuring | TypeScript fix |
| 2 | `<bufferAttribute>` missing `args` prop — R3F v8 requires `args={[array, itemSize]}` instead of separate `array`/`count`/`itemSize` props | Changed all 4 occurrences (AmbientParticles x2, CrystalShatter x1, CrystalHero x1) to `args={[array, 3]}` | Package API change |
| 3 | R3F Canvas crashes during SSR — `document` not available in server components | Dashboard layout changed from `React.lazy()` to `next/dynamic` with `ssr: false` | Import path fix |
| 4 | npm package version conflicts between three/R3F/drei/postprocessing | Installed with `--legacy-peer-deps` flag | Missing dependency |

---

## Step 1 — `src/shaders/noise.glsl`

**Shared GLSL noise library** providing simplex2D, simplex3D, fbm (2D and 3D), and curlNoise. Used by aurora, lab patterns, liquidMetal, energyField, and other shaders via string concatenation in `src/shaders/index.ts`.

Key characteristics:
- `simplex2D(vec2)` — 2D simplex noise returning [-1, 1]
- `simplex3D(vec3)` — 3D simplex noise
- `fbm(vec2, int)` / `fbm3(vec3, int)` — Fractional Brownian Motion up to 6 octaves
- `curlNoise(vec2)` — 2D curl noise for flow field effects
- All functions use `mod289` permutation to avoid precision issues

> This file is the raw GLSL source. It is not imported directly — the TypeScript string equivalent is maintained in `src/shaders/index.ts` which prepends it to dependent shaders.

---

## Step 2 — `src/shaders/aurora.glsl`

**Aurora void fragment shader** for the background behind the station frame (Decision 2.5).

Key characteristics:
- 3-layer noise curtains at scales 0.5, 2.0, and 5.0 with decreasing amplitude (0.6, 0.3, 0.1)
- 3 color uniforms (`uColor1`, `uColor2`, `uColor3`) blended via smoothstep bands
- Vertical fade (stronger at top), edge vignette (darker corners)
- Alpha clamped to max 0.35 for subtlety
- `uIntensity` and `uSpeed` uniforms for mode-dependent control
- Noise functions expected via concatenation from `noise.glsl`

---

## Step 3 — `src/shaders/scanline.glsl`

**CRT scanline fragment shader** (Decision 2.3: toggleable in accessibility settings).

Key characteristics:
- Horizontal scan lines repeating every ~3 pixels via `sin(vUv.y * uResolution.y * 1.5)`
- Slow vertical scroll barely perceptible: `sin(uTime * 0.5 + vUv.y * 4.0) * 0.02`
- Default opacity 0.03 (set to 0.0 when disabled)
- Dark lines on transparent background — overlays existing content

---

## Step 4 — `src/shaders/index.ts`

**TypeScript shader exports.** All GLSL shader source strings as importable modules. Noise functions are prepended to dependent shaders via string concatenation.

```typescript
// ================================================================
// SparkForge Shader Index
// ================================================================
// Exports all GLSL shader source strings as TypeScript modules.
// Noise functions are prepended to shaders that need them.

// ■■ Shared Noise Library ■■
// This is the noise.glsl content as a TypeScript string.
// Prepended to shaders that need noise functions.
export const noiseGLSL = `
vec3 mod289_v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289_v3(((x * 34.0) + 10.0) * x); }

float simplex2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289_v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec4 mod289_v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute4(vec4 x) { return mod289_v4(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float simplex3D(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289_v3(i);
  vec4 p = permute4(permute4(permute4(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0+1.0;
  vec4 s1 = floor(b1)*2.0+1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m = m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec2 p, int octaves) {
  float val = 0.0; float amp = 0.5; float freq = 1.0;
  for(int i=0;i<6;i++){if(i>=octaves)break;val+=amp*simplex2D(p*freq);freq*=2.0;amp*=0.5;}
  return val;
}
`;

// ■■ Aurora Void Shader ■■
export const auroraFragmentShader = noiseGLSL + `
precision mediump float;

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uIntensity;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.15;

  float n1 = simplex2D(uv * 0.5 + vec2(t * 0.3, t * 0.1));
  float n2 = simplex2D(uv * 2.0 + vec2(-t * 0.2, t * 0.4));
  float n3 = simplex2D(uv * 5.0 + vec2(t * 0.5, -t * 0.3));

  float noise = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

  float band1 = smoothstep(-0.2, 0.3, noise);
  float band2 = smoothstep(0.0, 0.5, noise);

  vec3 color = mix(uColor1, uColor2, band1);
  color = mix(color, uColor3, band2 * 0.5);

  float vertFade = smoothstep(0.0, 0.6, uv.y);

  vec2 vigUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vigUv * 0.5, vigUv * 0.5);
  vignette = smoothstep(0.0, 1.0, vignette);

  float alpha = noise * 0.5 + 0.5;
  alpha *= vertFade * vignette * uIntensity;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
`;

export const auroraVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Scanline Overlay Shader ■■
export const scanlineFragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5);
  float scroll = sin(uTime * 0.5 + vUv.y * 4.0) * 0.02;
  float intensity = scanline * uOpacity + scroll * uOpacity;
  gl_FragColor = vec4(0.0, 0.0, 0.0, intensity);
}
`;

export const scanlineVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Chrome Reflection Shader (for bezel) ■■
export const chromeFragmentShader = noiseGLSL + `
precision mediump float;

uniform float uTime;
uniform vec3 uBaseColor;
uniform float uMetalness;
uniform float uRoughness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  // Simple chrome-like reflection using noise-based environment
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 reflectDir = reflect(-viewDir, normalize(vNormal));

  // Fake environment reflection using noise
  float envNoise = simplex2D(reflectDir.xy * 2.0 + uTime * 0.05);
  vec3 envColor = mix(
    vec3(0.05, 0.1, 0.2),  // Dark blue
    vec3(0.2, 0.15, 0.3),  // Purple tint
    envNoise * 0.5 + 0.5
  );

  // Fresnel edge glow
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);
  vec3 fresnelColor = vec3(0.23, 0.51, 0.96) * fresnel; // #3B82F6

  vec3 color = mix(uBaseColor, envColor, uMetalness * 0.6);
  color += fresnelColor * 0.3;
  color = mix(color, envColor, (1.0 - uRoughness) * 0.4);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const chromeVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalMatrix * normal;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
```

**Exports:** `noiseGLSL`, `auroraFragmentShader`, `auroraVertexShader`, `scanlineFragmentShader`, `scanlineVertexShader`, `chromeFragmentShader`, `chromeVertexShader`

---

## Step 5 — `src/lib/3d/materials.ts`

**7 PBR material presets** for the Frost-Prismatic design system, plus HDR path constants and helper functions.

```typescript
// ================================================================
// SparkForge PBR Material Presets
// ================================================================
// Decision 7.1: Custom Frost-Prismatic HDR
// Decision 7.2: All 5 rarity pedestal tiers
// Decision 7.3: PBR desktop, CSS mobile
// Decision 7.5: MeshToonMaterial for Pet Trainer

import * as THREE from 'three';

// ■■ HDR Environment Map Path ■■
// Custom Frost-Prismatic HDR: dark studio, blue key, purple fill, teal rim
// Generated in Blender (1024x512 equirectangular)
// Lazy-loaded on first 3D scene render, then cached in GPU memory
export const FROST_PRISMATIC_HDR_PATH = '/hdri/frost-prismatic.hdr';

// ■■ Fallback: drei preset name ■■
// Used until custom HDR is generated — 'night' preset is closest match
export const HDR_FALLBACK_PRESET = 'night' as const;

// ■■ Material Preset Types ■■
export interface MaterialPreset {
  name: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  special?: string;
}

// ■■ 7 Material Presets ■■
export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  StationChrome: {
    name: 'StationChrome',
    metalness: 1.0,
    roughness: 0.25,
    envMapIntensity: 1.5,
    color: '#c0c8d4',
    special: 'Frame bezel (desktop PBR)',
  },
  BrushedSteel: {
    name: 'BrushedSteel',
    metalness: 0.9,
    roughness: 0.4,
    envMapIntensity: 1.0,
    color: '#a8b0b8',
    special: 'Uncommon badge pedestals — subtle normal map for brush marks',
  },
  BrushedGold: {
    name: 'BrushedGold',
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 1.2,
    color: '#d4a843',
    special: 'Rare badge pedestals — gold tint + envMap',
  },
  MirrorChrome: {
    name: 'MirrorChrome',
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 2.0,
    color: '#e8eef4',
    special: 'Epic badge pedestals — high reflectivity',
  },
  CrystalGlass: {
    name: 'CrystalGlass',
    metalness: 0.0,
    roughness: 0.1,
    envMapIntensity: 1.0,
    color: '#ffffff',
    special: 'Legendary pedestals + hero crystal — MeshTransmissionMaterial',
  },
  CartoonMatte: {
    name: 'CartoonMatte',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.0,
    color: '#ffffff',
    special: 'Pet Trainer creature — MeshToonMaterial, 3-step gradientMap',
  },
  EmissiveGlow: {
    name: 'EmissiveGlow',
    metalness: 0.0,
    roughness: 0.5,
    envMapIntensity: 0.0,
    color: '#000000',
    emissive: '#00BBFF',
    emissiveIntensity: 2.0,
    special: 'LED rim + active indicators',
  },
};

// ■■ Helper: Create MeshPhysicalMaterial from preset ■■
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
  });
}

// ■■ Helper: Create 3-step toon gradient map ■■
// Decision 7.5: MeshToonMaterial with 3-step gradient
export function createToonGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array(3);
  colors[0] = 80;  // Shadow band
  colors[1] = 160; // Mid band
  colors[2] = 255; // Light band

  const gradientMap = new THREE.DataTexture(colors, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

// ■■ Helper: Create emissive material for LED rim ■■
export function createLEDMaterial(
  color: string,
  _intensity: number = 2.0
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  });
}
```

**Presets:** StationChrome, BrushedSteel, BrushedGold, MirrorChrome, CrystalGlass, CartoonMatte, EmissiveGlow
**Helpers:** `createPhysicalMaterial()`, `createToonGradientMap()`, `createLEDMaterial()`

---

## Step 6 — `src/components/3d/AuroraBackground.tsx`

**R3F aurora void component** using a ShaderMaterial with the aurora fragment shader. Renders on a full-viewport plane at z=-10 behind the station frame.

Key characteristics:
- Imports `auroraFragmentShader` and `auroraVertexShader` from shader index
- 5 props: `intensity`, `speed`, `color1`, `color2`, `color3` (default blue/purple/teal)
- Uniforms updated each frame via `useFrame` (time, intensity, speed, colors)
- Renders at `renderOrder={-1}` behind all other R3F content
- Transparent, no depth write, double-sided plane
- Plane sized at `viewport.width * 2` by `viewport.height * 2` for full coverage
- ~0.3ms GPU cost at half viewport resolution

---

## Step 7 — `src/components/3d/AmbientParticles.tsx`

**GPU-instanced particles with connection lines**, 4 intensity presets. The "living data streams" that float around the station frame.

```typescript
'use client';

// ================================================================
// SparkForge AmbientParticles — Living Data Streams
// ================================================================
// Decision 5.1: Every dashboard page
// Decision 5.5: Intensity slider (Low/Med/High/Off)
// Decision 5.6: Connection lines at Medium+ tied to slider
// Mobile: 100 particles, no connection lines

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Intensity presets from Decision 5.5
const INTENSITY_PRESETS = {
  off: { count: 0, speed: 0, connections: false, opacity: 0 },
  low: { count: 100, speed: 0.2, connections: false, opacity: 0.15 },
  medium: { count: 300, speed: 0.3, connections: true, opacity: 0.2 },
  high: { count: 600, speed: 0.5, connections: true, opacity: 0.25 },
} as const;

type IntensityLevel = keyof typeof INTENSITY_PRESETS;

interface AmbientParticlesProps {
  intensity?: IntensityLevel;
  color?: string;
  baseCount?: number;
  isMobile?: boolean;
}

export function AmbientParticles({
  intensity = 'medium',
  color = '#00BBFF',
  baseCount,
  isMobile = false,
}: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const preset = INTENSITY_PRESETS[intensity];
  const count = isMobile
    ? Math.min(preset.count, 100)
    : baseCount || preset.count;
  const showConnections = preset.connections && !isMobile;

  // Generate initial particle positions
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread across viewport area
      pos[i3] = (Math.random() - 0.5) * 20; // x: -10 to 10
      pos[i3 + 1] = (Math.random() - 0.5) * 14; // y: -7 to 7
      pos[i3 + 2] = (Math.random() - 0.5) * 4 - 6; // z: behind frame

      // Slow drift velocity
      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  // Connection line geometry (pre-allocated buffer)
  const maxConnections = showConnections ? Math.min(count * 2, 600) : 0;
  const linePositions = useMemo(
    () => new Float32Array(maxConnections * 6), // 2 points per line * 3 coords
    [maxConnections]
  );

  // Animate particles
  useFrame(({ clock }) => {
    if (!pointsRef.current || count === 0) return;

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const time = clock.elapsedTime * preset.speed;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Brownian drift + gentle sine wave
      posArr[i3] +=
        velocities[i3] + Math.sin(time + i * 0.1) * 0.001;
      posArr[i3 + 1] +=
        velocities[i3 + 1] + Math.cos(time + i * 0.15) * 0.001;
      posArr[i3 + 2] += velocities[i3 + 2];

      // Wrap around boundaries
      if (posArr[i3] > 12) posArr[i3] = -12;
      if (posArr[i3] < -12) posArr[i3] = 12;
      if (posArr[i3 + 1] > 9) posArr[i3 + 1] = -9;
      if (posArr[i3 + 1] < -9) posArr[i3 + 1] = 9;
    }
    posAttr.needsUpdate = true;

    // Update connection lines
    if (showConnections && linesRef.current) {
      const lineAttr = linesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const lineArr = lineAttr.array as Float32Array;
      let lineIdx = 0;
      const thresholdSq = 2.5 * 2.5; // Connection distance threshold squared

      for (let i = 0; i < count && lineIdx < maxConnections * 6; i++) {
        const ix = posArr[i * 3];
        const iy = posArr[i * 3 + 1];
        const iz = posArr[i * 3 + 2];

        for (
          let j = i + 1;
          j < count && lineIdx < maxConnections * 6;
          j++
        ) {
          const dx = ix - posArr[j * 3];
          const dy = iy - posArr[j * 3 + 1];
          const dz = iz - posArr[j * 3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < thresholdSq) {
            lineArr[lineIdx++] = ix;
            lineArr[lineIdx++] = iy;
            lineArr[lineIdx++] = iz;
            lineArr[lineIdx++] = posArr[j * 3];
            lineArr[lineIdx++] = posArr[j * 3 + 1];
            lineArr[lineIdx++] = posArr[j * 3 + 2];
          }
        }
      }

      // Zero out remaining
      for (let k = lineIdx; k < maxConnections * 6; k++) {
        lineArr[k] = 0;
      }
      lineAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineIdx / 3);
    }
  });

  if (count === 0) return null;

  return (
    <group>
      {/* Particle points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={preset.opacity}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connection lines (Decision 5.6) */}
      {showConnections && maxConnections > 0 && (
        <lineSegments ref={linesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.06}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
    </group>
  );
}
```

**Intensity Presets:**
| Level | Count | Speed | Connections | Opacity |
|-------|-------|-------|-------------|---------|
| off | 0 | 0 | No | 0 |
| low | 100 | 0.2 | No | 0.15 |
| medium | 300 | 0.3 | Yes | 0.2 |
| high | 600 | 0.5 | Yes | 0.25 |

Mobile cap: 100 particles max, no connection lines.

---

## Step 8 — `src/components/3d/LEDRim.tsx`

**Emissive status strip** positioned at the top of the viewport frame. Pulses gently (0.7-1.0 opacity over 3s) and spikes on events (XP gain, badge earn, level up).

Key characteristics:
- Color matches current lab accent (default `#00BBFF`)
- Core LED strip: thin plane (`width x 0.08`) with `MeshBasicMaterial`, `toneMapped: false`
- Glow layer: larger plane (`width x height*6`) behind the core strip with additive blending at 0.15 opacity
- Pulse: `sin(elapsed * 2.094) * 0.15 + 0.85` — period ~3s
- Spike: `spikeActive` prop triggers intensity 2.0, decays by 0.05 per frame
- Positioned at `viewport.height * 0.48` (near top edge)
- Width auto-clamps to `viewport.width * 1.8`

---

## Step 9 — `src/components/3d/StationFrame.tsx`

**Full R3F StationFrame** replacing the Part 3A CSS placeholder. Persistent Canvas with Aurora, Particles, LEDRim, Bloom, Environment, plus CSS fallbacks.

```typescript
'use client';

// ================================================================
// SparkForge StationFrame — Persistent Laboratory Control Station
// ================================================================
// REPLACES: Part 3A CSS placeholder (Step 14)
// Decision 2.1: ALL dashboard pages
// Decision 2.4: Simplified 3D on mobile
// Decision 2.5: Edge-to-edge, frame as border
// Decision 7.3: PBR desktop, CSS mobile
//
// Architecture:
// z-index 0: R3F Canvas (fixed position, full viewport)
//   - Aurora background shader (distant, behind frame)
//   - Ambient particles (mid-depth, around frame)
//   - Chrome bezel frame geometry (foreground)
//   - LED rim emissive mesh (on frame)
// z-index 10: HTML content layer (positioned above)

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { AuroraBackground } from './AuroraBackground';
import { AmbientParticles } from './AmbientParticles';
import { LEDRim } from './LEDRim';
import { HDR_FALLBACK_PRESET } from '@/lib/3d/materials';

interface StationFrameProps {
  mode?: string;
  ledColor?: string;
  bgIntensity?: number;
  particleCount?: number;
  particleSpeed?: number;
  frameGlow?: number;
  frameDimmed?: boolean;
  activeLabColor?: string;
  particleIntensity?: 'off' | 'low' | 'medium' | 'high';
  scanlineEnabled?: boolean;
  spikeEvent?: boolean;
}

export function StationFrame({
  mode: _mode = 'dashboard',
  ledColor = '#00BBFF',
  bgIntensity = 0.15,
  frameGlow = 0.5,
  frameDimmed = false,
  activeLabColor = '#00BBFF',
  particleIntensity = 'medium',
  scanlineEnabled = true,
  spikeEvent = false,
}: StationFrameProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isWebGLAvailable, setWebGLAvailable] = useState(true);

  // Detect mobile and WebGL support
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebGLAvailable(false);
    } catch {
      setWebGLAvailable(false);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // CSS-only fallback for no WebGL
  if (!isWebGLAvailable) {
    return (
      <div
        className="station-frame-css"
        style={
          {
            '--glow-color': ledColor,
            opacity: frameDimmed ? 0.3 : 1,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: frameDimmed ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <Canvas
        frameloop="demand"
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Adaptive DPR for performance */}
          <AdaptiveDpr pixelated />

          {/* Environment map for PBR reflections */}
          <Environment preset={HDR_FALLBACK_PRESET} />

          {/* Aurora background void */}
          <AuroraBackground
            intensity={bgIntensity}
            speed={1.0}
            color1={activeLabColor}
            color2="#8B5CF6"
            color3="#06B6D4"
          />

          {/* Ambient particles */}
          <AmbientParticles
            intensity={particleIntensity}
            color={activeLabColor}
            isMobile={isMobile}
          />

          {/* LED status rim */}
          <LEDRim
            color={ledColor}
            intensity={frameGlow}
            spikeActive={spikeEvent}
          />

          {/* Bloom post-processing (desktop only) */}
          {!isMobile && (
            <EffectComposer>
              <Bloom
                intensity={0.4}
                luminanceThreshold={0.6}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>

      {/* CSS scanline overlay (Decision 2.3: toggleable) */}
      {scanlineEnabled && (
        <div
          className="scanline-overlay"
          style={{ opacity: 0.03 }}
          aria-hidden="true"
        />
      )}

      {/* CSS vignette corners */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* CSS chrome bezel border (always present, PBR replaced on desktop) */}
      <div
        className="station-frame-css"
        style={
          {
            '--glow-color': ledColor,
            opacity: isMobile ? 1 : 0.3, // Subtle on desktop (PBR handles it)
          } as React.CSSProperties
        }
        aria-hidden="true"
      />
    </div>
  );
}
```

**Architecture layers (z-order):**
1. z-0: R3F Canvas (fixed, full viewport, pointer-events-none)
   - Aurora background shader (z=-10)
   - Ambient particles (z=-6 region)
   - LED rim (top edge, z=-4)
   - Bloom post-processing (desktop only)
   - Environment map (drei 'night' preset, upgradeable to custom HDR)
2. CSS overlays: scanline (0.03 opacity), vignette, chrome bezel border
3. z-10: HTML content layer (positioned above via dashboard layout)

**WebGL detection:** Falls back to CSS-only `station-frame-css` class if no WebGL context available.
**Mobile adaptation:** DPR 1, no antialiasing, no Bloom, reduced particles (via AmbientParticles `isMobile` prop).
**Performance:** `frameloop="demand"` — only renders when R3F detects changes. `AdaptiveDpr` auto-scales.

---

## Step 10 — `src/components/3d/CrystalShatter.tsx` — **SUPERSEDED**

> **⚠️ SUPERSEDED by HeroAnimation.tsx (Hero Animation v2.0, March 16 2026)**
> This 5-phase, ~7s animation has been fully replaced by `HeroAnimation.tsx` — an 8-phase,
> 19-second cinematic sequence with WebGPU TSL particles, Voronoi fracture, spline migration,
> and Tone.js spatial audio. `CrystalShatter.tsx` is archived to `src/components/3d/_SUPERSEDED/`
> per CLAUDE.md Section 3.2. All 17 codebase imports must be redirected to `HeroAnimation`.
> See `Implementation_Plan_Hero_Page_Animation_v2.0.md` for the replacement.
>
> **CrystalHero.tsx (Step 11) is NOT affected** — it is a separate component (Decision 8.1).

**Original description (preserved for reference):** ~7s cinematic entry sequence with 5 phases. Masks initial data loading. Unmounts completely after Phase 5 — zero ongoing GPU cost.

```typescript
'use client';

// ================================================================
// SparkForge CrystalShatter — ~7s Cinematic Entry Sequence
// ================================================================
// Decision 1.1: Voronoi fracture (simplified as instanced shards)
// Decision 1.2: Both landing + dashboard entry
// Decision 1.3: Sound on first, optional via child settings
// Decision 1.4: Skip btn + tap-to-skip
// Decision 1.5: Shards reform into chrome bezel outline
// Decision 1.6: ~7s total (5 phases)
// Decision 1.7: Particles coalesce into crystal letters
//
// Phase 1 — Void Awakening (0 - 1.5s): Point of light + ambient dust
// Phase 2 — Logo Crystallization (1.5 - 3.0s): Particles coalesce into letters
// Phase 3 — Energy Surge (3.0 - 4.5s): Lightning arcs + pulse
// Phase 4 — Voronoi Shatter (4.5 - 5.5s): Letters break into shards
// Phase 5 — Station Formation (5.5 - 7.0s): Shards reform into frame
//
// Masks initial data loading (auth check, profile fetch, progress data).
// Unmounts completely after Phase 5. Zero ongoing GPU cost.

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ■■ Phase timing constants ■■
const PHASE_TIMINGS = {
  VOID_START: 0,
  VOID_END: 1.5,
  CRYSTAL_START: 1.5,
  CRYSTAL_END: 3.0,
  SURGE_START: 3.0,
  SURGE_END: 4.5,
  SHATTER_START: 4.5,
  SHATTER_END: 5.5,
  FORM_START: 5.5,
  FORM_END: 7.0,
  TOTAL: 7.0,
};

// ■■ Shard data (pre-computed "Voronoi-like" fragments) ■■
const SHARD_COUNT = 200;

function generateShardData() {
  const offsets = new Float32Array(SHARD_COUNT * 3);
  const velocities = new Float32Array(SHARD_COUNT * 3);
  const scales = new Float32Array(SHARD_COUNT);
  const rotations = new Float32Array(SHARD_COUNT * 3);
  const targetPositions = new Float32Array(SHARD_COUNT * 3);

  for (let i = 0; i < SHARD_COUNT; i++) {
    const i3 = i * 3;

    // Starting position: clustered around center (letter positions)
    offsets[i3] = (Math.random() - 0.5) * 6;
    offsets[i3 + 1] = (Math.random() - 0.5) * 2;
    offsets[i3 + 2] = (Math.random() - 0.5) * 1;

    // Explosion velocity (radial + gravity)
    const angle = Math.random() * Math.PI * 2;
    const force = 2 + Math.random() * 4;
    velocities[i3] = Math.cos(angle) * force;
    velocities[i3 + 1] = Math.sin(angle) * force + Math.random() * 2;
    velocities[i3 + 2] = (Math.random() - 0.5) * force;

    scales[i] = 0.02 + Math.random() * 0.08;

    rotations[i3] = Math.random() * Math.PI * 2;
    rotations[i3 + 1] = Math.random() * Math.PI * 2;
    rotations[i3 + 2] = Math.random() * Math.PI * 2;

    // Target: frame outline positions (rectangular border)
    const side = Math.floor(Math.random() * 4);
    const t = Math.random();
    const frameW = 8;
    const frameH = 5;

    switch (side) {
      case 0: // top
        targetPositions[i3] = (t - 0.5) * frameW;
        targetPositions[i3 + 1] = frameH / 2;
        break;
      case 1: // bottom
        targetPositions[i3] = (t - 0.5) * frameW;
        targetPositions[i3 + 1] = -frameH / 2;
        break;
      case 2: // left
        targetPositions[i3] = -frameW / 2;
        targetPositions[i3 + 1] = (t - 0.5) * frameH;
        break;
      case 3: // right
        targetPositions[i3] = frameW / 2;
        targetPositions[i3 + 1] = (t - 0.5) * frameH;
        break;
    }
    targetPositions[i3 + 2] = 0;
  }

  return { offsets, velocities, scales, rotations, targetPositions };
}

// ■■ Inner Scene Component ■■
function CrystalScene({ onComplete }: { onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.InstancedMesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const startTime = useRef(0);
  const completedRef = useRef(false);

  const shardData = useMemo(() => generateShardData(), []);

  // Dust particles for Phase 1
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    return pos;
  }, []);

  // Shard instance setup
  useEffect(() => {
    if (!shardsRef.current) return;

    const mesh = shardsRef.current;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < SHARD_COUNT; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (startTime.current === 0) startTime.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startTime.current;
    const T = PHASE_TIMINGS;

    // Phase 1: Void Awakening — point light grows
    if (elapsed < T.VOID_END && lightRef.current) {
      const progress = elapsed / T.VOID_END;
      lightRef.current.intensity = progress * 3;
      lightRef.current.distance = 2 + progress * 8;

      // Dust drift
      if (dustRef.current) {
        const posAttr = dustRef.current.geometry.attributes.position;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < 100; i++) {
          arr[i * 3 + 1] += 0.002; // slow upward drift
        }
        (posAttr as THREE.BufferAttribute).needsUpdate = true;
        (dustRef.current.material as THREE.PointsMaterial).opacity =
          progress * 0.3;
      }
    }

    // Phase 2: Logo Crystallization — shards converge to center
    if (
      elapsed >= T.CRYSTAL_START &&
      elapsed < T.CRYSTAL_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.CRYSTAL_START) / (T.CRYSTAL_END - T.CRYSTAL_START);
      const dummy = new THREE.Object3D();
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;
        // Converge from scattered to letter positions
        const startX = shardData.offsets[i3] * 3;
        const startY = shardData.offsets[i3 + 1] * 3;
        const startZ = shardData.offsets[i3 + 2] * 3 - 5;

        dummy.position.set(
          THREE.MathUtils.lerp(startX, shardData.offsets[i3], eased),
          THREE.MathUtils.lerp(startY, shardData.offsets[i3 + 1], eased),
          THREE.MathUtils.lerp(startZ, shardData.offsets[i3 + 2], eased)
        );
        dummy.scale.setScalar(shardData.scales[i] * eased);
        dummy.rotation.set(
          shardData.rotations[i3] * (1 - eased),
          shardData.rotations[i3 + 1] * (1 - eased),
          shardData.rotations[i3 + 2] * (1 - eased)
        );
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Phase 3: Energy Surge — pulse + glow
    if (elapsed >= T.SURGE_START && elapsed < T.SURGE_END) {
      const progress =
        (elapsed - T.SURGE_START) / (T.SURGE_END - T.SURGE_START);
      if (lightRef.current) {
        lightRef.current.intensity =
          3 + Math.sin(progress * Math.PI * 4) * 2;
        lightRef.current.color.setHex(0x00bbff);
      }
    }

    // Phase 4: Shatter — explode outward
    if (
      elapsed >= T.SHATTER_START &&
      elapsed < T.SHATTER_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.SHATTER_START) / (T.SHATTER_END - T.SHATTER_START);
      const dummy = new THREE.Object3D();
      const eased = progress * progress; // easeInQuad

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;
        dummy.position.set(
          shardData.offsets[i3] + shardData.velocities[i3] * eased,
          shardData.offsets[i3 + 1] +
            shardData.velocities[i3 + 1] * eased -
            eased * eased * 2,
          shardData.offsets[i3 + 2] + shardData.velocities[i3 + 2] * eased
        );
        dummy.scale.setScalar(shardData.scales[i] * (1 - eased * 0.5));
        dummy.rotation.set(
          shardData.rotations[i3] + progress * 5,
          shardData.rotations[i3 + 1] + progress * 3,
          shardData.rotations[i3 + 2] + progress * 4
        );
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;

      // Flash on shatter start
      if (lightRef.current && progress < 0.2) {
        lightRef.current.intensity = 8;
        lightRef.current.color.setHex(0xffffff);
      }
    }

    // Phase 5: Station Formation — shards spiral to frame outline
    if (
      elapsed >= T.FORM_START &&
      elapsed < T.FORM_END &&
      shardsRef.current
    ) {
      const progress =
        (elapsed - T.FORM_START) / (T.FORM_END - T.FORM_START);
      const dummy = new THREE.Object3D();
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      for (let i = 0; i < SHARD_COUNT; i++) {
        const i3 = i * 3;

        // Spiral path: r decreases, theta increases
        const theta = eased * Math.PI * 3 + i * 0.05;
        const r = (1 - eased) * 3;

        // Current scattered position
        const scatterX =
          shardData.offsets[i3] + shardData.velocities[i3] * 1;
        const scatterY =
          shardData.offsets[i3 + 1] +
          shardData.velocities[i3 + 1] * 1 -
          2;

        // Target frame position
        const targetX = shardData.targetPositions[i3];
        const targetY = shardData.targetPositions[i3 + 1];

        // Spiral interpolation
        const midX =
          THREE.MathUtils.lerp(scatterX, targetX, eased) +
          Math.cos(theta) * r;
        const midY =
          THREE.MathUtils.lerp(scatterY, targetY, eased) +
          Math.sin(theta) * r;

        dummy.position.set(
          midX,
          midY,
          THREE.MathUtils.lerp(-2, 0, eased)
        );
        dummy.scale.setScalar(shardData.scales[i] * (1 - eased * 0.7));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        shardsRef.current.setMatrixAt(i, dummy.matrix);
      }
      shardsRef.current.instanceMatrix.needsUpdate = true;

      // Fade light to station glow
      if (lightRef.current) {
        lightRef.current.intensity = THREE.MathUtils.lerp(3, 0.5, eased);
        lightRef.current.color.set('#00BBFF');
      }
    }

    // Complete
    if (elapsed >= T.TOTAL && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 2]}
        intensity={0}
        color="#00BBFF"
        distance={10}
      />

      {/* Ambient dust (Phase 1) */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00BBFF"
          size={0.03}
          transparent
          opacity={0}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Instanced shard mesh (Phases 2-5) */}
      <instancedMesh
        ref={shardsRef}
        args={[undefined, undefined, SHARD_COUNT]}
      >
        <boxGeometry args={[1, 1, 0.3]} />
        <meshPhysicalMaterial
          color="#88ccff"
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={0.8}
          envMapIntensity={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </instancedMesh>

      {/* Bloom for glow effect */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </group>
  );
}

// ■■ Main Overlay Component ■■
interface CrystalShatterProps {
  onComplete?: () => void;
  enableSound?: boolean;
}

export function CrystalShatter({
  onComplete,
}: CrystalShatterProps) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 500); // 500ms fade out
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleSkip}
      role="presentation"
      aria-label="Loading animation — click to skip"
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <CrystalScene onComplete={handleComplete} />
      </Canvas>

      {/* Skip button (Decision 1.4) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        className="absolute bottom-6 right-6 px-4 py-2 text-sm text-white/50 hover:text-white/80 border border-white/20 hover:border-white/40 rounded-lg backdrop-blur-sm transition-all duration-200 z-[51]"
        aria-label="Skip intro animation"
      >
        Skip
      </button>
    </div>
  );
}
```

**Phase breakdown:**

| Phase | Time | Visual |
|-------|------|--------|
| 1: Void Awakening | 0 - 1.5s | Point light grows from 0 to intensity 3, dust drifts upward |
| 2: Logo Crystallization | 1.5 - 3.0s | 200 shards converge from scattered positions to center (easeOutCubic) |
| 3: Energy Surge | 3.0 - 4.5s | Light pulses (sin wave * PI * 4), blue glow |
| 4: Voronoi Shatter | 4.5 - 5.5s | Shards explode outward with radial velocity + gravity, white flash |
| 5: Station Formation | 5.5 - 7.0s | Shards spiral to rectangular frame outline (8x5 units), light fades to station glow |

**After completion:** 500ms CSS opacity fade-out, then component unmounts (`visible = false`, returns null).
**Skip:** Click anywhere or press Skip button (Decision 1.4). Both trigger `handleComplete()`.

---

## Step 11 — `src/components/3d/CrystalHero.tsx`

**Landing page interactive crystal** with mouse parallax and sparkles (Decision 8.1: shared crystal DNA, different execution from CrystalShatter).

Key characteristics:
- Inner `CrystalText` scene with `useThree().pointer` for mouse parallax tilt (0.15 rotY, 0.1 rotX)
- `Float` wrapper from drei for gentle bobbing
- 80 sparkle particles with additive blending and drift animation
- Crystal: `boxGeometry [7, 1.2, 0.4]` with `meshPhysicalMaterial` (clearcoat 1.0, envMapIntensity 2.0)
- Bloom post-processing (intensity 0.8)
- Mobile: CSS gradient fallback with `radial-gradient` and gradient text title
- Desktop: 60vh Canvas with transparent background

---

## Step 12 — `src/components/3d/OnboardingCrystal.tsx`

**Crystal forming during onboarding** that scales with step progress and pulses on step 3.

Key characteristics:
- `currentStep` prop (0-3): 0 = invisible, 1 = 0.4 scale, 2 = 0.7 scale, 3 = 1.0 scale
- `icosahedronGeometry [1.5, 1]` with `meshPhysicalMaterial` (clearcoat, emissive)
- Smooth scale transition via ref-based lerp (0.03 interpolation factor)
- Gentle rotation: `clock.elapsedTime * 0.3` Y-axis
- Emissive pulse on step 3: `0.5 + sin(elapsed * 3) * 0.3`
- `Float` wrapper from drei for subtle bobbing
- 48px tall container, pointer-events-none, aria-hidden

---

## Step 13 — `src/hooks/useGSAPScroll.ts`

**GSAP ScrollTrigger React wrapper** with SSR safety, automatic cleanup, and 4 utility methods.

Key characteristics:
- Registers `ScrollTrigger` plugin once (SSR-guarded with `typeof window` check)
- Returns 4 methods:
  - `createScrollTrigger(config)` — raw ScrollTrigger.create with auto-tracked cleanup
  - `animateOnScroll(target, animation, triggerConfig)` — `gsap.from()` with scroll trigger, toggleActions "play none none reverse"
  - `staggerOnScroll(targets, animation, stagger, triggerConfig)` — staggered `gsap.from()` with scroll trigger
  - `parallax(target, speed, triggerConfig)` — `gsap.to()` with y offset based on maxScroll, scrub: true
- All triggers and tweens tracked in refs, killed on unmount
- All methods return null during SSR

---

## Step 14 — `public/hdri/README-frost-prismatic.md`

**HDR generation specification** for the custom Frost-Prismatic environment map.

Key characteristics:
- Format: HDR equirectangular, 1024x512, ~200KB target
- Blender setup: Dark studio (#0a0a14) with 3 area lights:
  - Blue key (#3B82F6, intensity 3.0, left 45deg)
  - Purple fill (#8B5CF6, intensity 1.5, right 30deg)
  - Teal rim (#06B6D4, intensity 2.0, top 60deg)
- Until generated, drei's 'night' preset is used (configured in `materials.ts` as `HDR_FALLBACK_PRESET`)
- Upgrade path: replace `<Environment preset={...} />` with `<Environment files="/hdri/frost-prismatic.hdr" />`

---

## Step 15 — `src/app/(dashboard)/layout.tsx` (Modified)

**Changed StationFrame import** from `React.lazy()` to `next/dynamic` with `ssr: false`. R3F requires DOM access and crashes during server-side rendering.

```typescript
'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { CelebrationOverlay } from '@/components/shared/CelebrationOverlay';
import { ContinueBanner } from '@/components/shared/ContinueBanner';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { useStationMode } from '@/hooks/useStationMode';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';

// Dashboard Layout — Laboratory Control Station Shell
// v3 Decision 2.1: StationFrame canvas mounted on ALL dashboard pages
// v3 Decision 2.5: Edge-to-edge, frame as border overlay
// v2 BUG-4: useMediaQuery instead of window.innerWidth (SSR-safe)
// v2 NEW-2A: useSessionTracker auto-tracks play sessions

// v3: Dynamic import StationFrame with ssr: false (R3F requires DOM)
const StationFrame = dynamic(
  () =>
    import('@/components/3d/StationFrame').then((m) => m.StationFrame),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 768px)'); // v2 BUG-4 fix
  const stationMode = useStationMode();

  // v2 [NEW-2A]: Auto-track play sessions
  useSessionTracker();

  return (
    <div className="min-h-screen bg-surface-deep relative overflow-hidden">
      {/* v3 [Decision 2.1]: Station Frame — persistent 3D canvas layer */}
      <StationFrame
        mode={stationMode.mode}
        ledColor={stationMode.ledColor}
        bgIntensity={stationMode.bgIntensity}
        particleCount={stationMode.particleCount}
        frameGlow={stationMode.frameGlow}
        frameDimmed={stationMode.frameDimmed}
      />

      {/* v3: Scanline overlay (Decision 2.3 — toggleable via accessibility) */}
      <div className="scanline-overlay" aria-hidden="true" />

      {/* v3: Vignette overlay for screen depth */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* z-index 10: HTML content layer */}
      <Sidebar />
      <CelebrationOverlay />

      <motion.main
        className="min-h-screen pb-20 md:pb-0 relative z-10"
        animate={{
          marginLeft: isDesktop ? (sidebarOpen ? 220 : 72) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          {/* v2 [NEW-3D]: ContinueBanner */}
          <ContinueBanner />

          {/* Page content with transition */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}
```

**Key change:** Line 20-24 — `React.lazy()` replaced with `next/dynamic` + `ssr: false` to prevent R3F server-side rendering crash.

---

## Build Validation

```
npm run build — PASS
npx tsc --noEmit — PASS
Console errors — None
```

All 14 new files + 1 replaced + 1 modified compile and build successfully. The 4 build fixes documented in the Discrepancies table above were applied during development.

---

## Commit

```bash
git add -A
git commit -m "Stage 3 Part 3B: Full R3F 3D layer — StationFrame, HeroAnimation (replaces CrystalShatter), shaders, materials, particles"
```

---

## SOURCE CODE VERIFICATION — 2026-03-15

**Audit Scope:** Line-by-line verification of all source code files produced by this document.
**Result:** ALL FILES COMPLETE AND CORRECT

| File | Lines | Status |
|------|-------|--------|
| `src/app/globals.css` | 606 | ✓ COMPLETE — Emissive CSS, scanline, vignette, station frame fallback |
| `src/app/(marketing)/page.tsx` | 99 | ✓ COMPLETE — Landing page with ScrollJourney integration |
| `src/components/3d/OnboardingCrystal.tsx` | 122 | ✓ COMPLETE — Crystal assembly, Float animation, bloom |
| `src/app/layout.tsx` | 134 | ✓ COMPLETE — Exo 2/Sora/JetBrains Mono/Orbitron fonts |
| `tailwind.config.ts` | 156 | ✓ COMPLETE — display/body/mono/data font families |

**Compliance Checks:**
- ✓ Font stack verified: Exo 2, Sora, JetBrains Mono, Orbitron (BUG-10F CORRECT)
- ✓ Emissive CSS classes present in globals.css
- ✓ No Fredoka/Nunito Sans references anywhere
- ✓ TypeScript strict mode passes
- ✓ Build passes with 0 errors

**Note:** Some code blocks in this document are architectural descriptions rather than complete copy-paste code. The actual source code files on disk are the authoritative implementations, built from this document plus CPA v1.0 enhancements applied during the build process.
