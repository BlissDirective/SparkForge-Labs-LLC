# MOBILE 3D ENHANCEMENT PLAN — Part B: Implementation Details

**Version:** 1.0 | **Date:** March 23, 2026 | **Status:** DRAFT — Awaiting User Review
**Companion:** Part A contains analysis, feasibility research, and option comparison

---

## 1. IMPLEMENTATION DETAILS PER OPTION

This document provides buildable implementation details for each option from Part A. The chosen option's sections become the implementation spec; unused options can be archived.

---

## 2. SHARED INFRASTRUCTURE (ALL OPTIONS)

Regardless of which option is chosen, these foundational changes are required:

### 2.1 Amend Decision CPA2-12

**Current:** "Mobile gets zero R3F (pure CSS fallback)"
**Proposed:** "Mobile gets performance-budgeted 3D with automatic CSS fallback for unsupported devices. Triangle budget, draw call limits, and rendering mode are governed by `deviceStore` GPU tier detection."

### 2.2 Update `deviceStore.ts` — Mobile GPU Detection

Add runtime GPU capability detection to distinguish high/mid/low-end mobile devices:

```typescript
// New types
export type MobileGPUTier = 'mobile-high' | 'mobile-mid' | 'mobile-low';

// Detection function (runs once at app launch)
export async function detectMobileGPU(): Promise<MobileGPUTier> {
  // 1. Check WebGPU support
  const hasWebGPU = 'gpu' in navigator && await navigator.gpu?.requestAdapter();

  // 2. Check device memory (navigator.deviceMemory API)
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;

  // 3. Check GPU renderer string via WebGL
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

  // 4. Classify
  if (hasWebGPU && memory >= 4) return 'mobile-high';
  if (gl && memory >= 2) return 'mobile-mid';
  return 'mobile-low';
}
```

### 2.3 Update `useIsMobile.ts` — Granular Detection

```typescript
// New hook: useDeviceCapability
export function useDeviceCapability() {
  const deviceType = useDeviceStore(s => s.deviceType);
  const gpuTier = useDeviceStore(s => s.gpuTier);
  const mobileGpuTier = useDeviceStore(s => s.mobileGpuTier);
  const isMobile = useIsMobile();

  return {
    isMobile,
    canRender3D: !isMobile || mobileGpuTier !== 'mobile-low',
    renderTier: isMobile
      ? mobileGpuTier === 'mobile-high' ? 'mobile-3d-high'
      : mobileGpuTier === 'mobile-mid' ? 'mobile-3d-low'
      : 'mobile-css'
      : deviceType === 'tablet' ? 'tablet-3d'
      : 'desktop-3d',
    maxTriangles: isMobile
      ? mobileGpuTier === 'mobile-high' ? 300_000
      : mobileGpuTier === 'mobile-mid' ? 100_000
      : 0
      : undefined, // Use existing deviceStore profile
    maxDrawCalls: isMobile
      ? mobileGpuTier === 'mobile-high' ? 50
      : mobileGpuTier === 'mobile-mid' ? 25
      : 0
      : undefined,
  };
}
```

### 2.4 Mobile-Optimized R3F Canvas Wrapper

A new lightweight canvas component for mobile that enforces hard performance limits:

```typescript
// src/components/3d/MobileCanvas.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, PerformanceMonitor } from '@react-three/drei';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

export function MobileCanvas({ children }: { children: React.ReactNode }) {
  const { canRender3D, renderTier } = useDeviceCapability();

  if (!canRender3D) return null;

  return (
    <Canvas
      frameloop="demand"     // Only render when needed
      dpr={renderTier === 'mobile-3d-high' ? 1.25 : 1}
      gl={{
        antialias: false,
        powerPreference: 'low-power',
        alpha: true,
        stencil: false,
        depth: true,
      }}
      performance={{ min: 0.5 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <PerformanceMonitor
        onDecline={() => { /* Auto-reduce LOD */ }}
        flipflops={3}
        onFallback={() => { /* Switch to CSS fallback */ }}
      >
        {children}
      </PerformanceMonitor>
    </Canvas>
  );
}
```

### 2.5 On-Demand Rendering Controller

Critical for battery life — only re-render when something changes:

```typescript
// src/hooks/useMobileFrameControl.ts
import { useFrame, useThree } from '@react-three/fiber';

export function useMobileFrameControl() {
  const invalidate = useThree(s => s.invalidate);
  const needsRender = useRef(false);

  // Call this when scene needs update
  const requestRender = useCallback(() => {
    needsRender.current = true;
    invalidate();
  }, [invalidate]);

  return { requestRender };
}
```

---

## 3. OPTION A IMPLEMENTATION: "LITE 3D"

### 3.1 Scope Summary
- **Budget:** 50K triangles, <25 draw calls
- **New files:** 6-8 new components
- **Modified files:** 5-7 existing files
- **Build phases:** 2-3 (insertable after Phase 5F in build plan)

### 3.2 Component Breakdown

#### A1. Mobile Login Portal (5K tri, 3 draw calls)

```
File: src/components/3d/MobileLoginPortal.tsx
- Low-poly crystal ring (TorusGeometry, 5K tri, 32 segments)
- 50 instanced particle orbs (InstancedMesh, 1 draw call)
- Slow rotation animation (useFrame with delta-based timing)
- No post-processing, no shadows
- On-demand rendering (only animates portal rotation)
```

#### A2. Mobile Hero Micro-Animation (15K tri, 5 draw calls)

```
File: src/components/3d/MobileHeroAnimation.tsx
- Compressed 8 seconds (vs 19s desktop)
- Phases: Logo crystallize (2s) → Shatter (1s) → Particle burst (2s) → Cockpit fade-in (3s)
- Logo: Low-poly extruded text (Troika, 8K tri)
- Shatter: 20 shard pieces (instanced, 5K tri)
- Particles: 100 instanced cubes (2K tri, 1 draw call)
- Camera: Simple zoom + rotate (no spline curves)
```

#### A3. Mobile Chrome Bezel Ring (10K tri, 4 draw calls)

```
File: src/components/3d/MobileChromeBezel.tsx
- Replaces CSS gradient border with dimensional chrome ring
- TorusGeometry ring (6K tri) with MeshStandardMaterial (metalness 0.9)
- LED rim: 50 instanced capsules (3K tri, 1 draw call)
- Subtle pulse animation (emissive intensity oscillation)
- Wraps dashboard content as z-index underlay
```

#### A4. Mobile Lab Map (8K tri, 6 draw calls)

```
File: src/components/3d/MobileLabMap.tsx
- 2.5D isometric grid (not full 3D hologram)
- 10 lab nodes as low-poly hexagonal prisms (800 tri each)
- Subtle float animation per node (sin wave)
- Touch: tap to select lab (camera focus transition)
- Connection lines: LineGeometry (1 draw call)
```

#### A5. Mobile Game Background (10K tri per game, 2-3 draw calls)

```
File: src/components/3d/MobileGameEnvironment.tsx
- Generic themed backdrop component
- Low-poly scene: ground plane + 2-3 themed props (instanced)
- Lab-colored ambient light + single directional light
- Props library: 10 sets (1 per lab theme)
- Shared across all 35 games via prop swap
```

#### A6. Mobile Instanced Particles (2K tri, 1 draw call)

```
File: src/components/3d/MobileParticles3D.tsx
- Replaces GenericGameParticles CSS dots
- 50-100 instanced icosahedron particles (20 tri each = 2K max)
- Lab-colored emissive material
- Simple vertical drift + opacity cycle
- Single draw call via InstancedMesh
- Falls back to GenericGameParticles on mobile-low
```

### 3.3 Files Modified

| File | Change |
|------|--------|
| `deviceStore.ts` | Add `mobileGpuTier`, `detectMobileGPU()`, update TRIANGLE_BUDGETS mobile row |
| `CockpitCanvas.tsx` | Instead of `return null` on mobile, render `<MobileChromeBezel>` for capable devices |
| `GameShell.tsx` | Use `MobileParticles3D` instead of `GenericGameParticles` on 3D-capable mobile |
| `src/app/(auth)/layout.tsx` | Use `MobileLoginPortal` instead of CSS dots on 3D-capable mobile |
| `HeroAnimation.tsx` (or new) | Add `MobileHeroAnimation` path for mobile |
| `useIsMobile.ts` (or new hook) | Add `useDeviceCapability` hook |

### 3.4 Build Phase Integration

Insert as **Phase 5G** (after Login 3D Enhancement):

| Sub-phase | Content | Hard Stop |
|-----------|---------|-----------|
| **5G-1** | Shared infrastructure: GPU detection, MobileCanvas, hooks | — |
| **5G-2** | Mobile login portal + hero micro-animation + chrome bezel | — |
| **5G-3** | Mobile lab map + game environments + instanced particles | HS-5 (mobile visual verification) |

---

## 4. OPTION B IMPLEMENTATION: "IMMERSIVE MOBILE"

### 4.1 Scope Summary
- **Budget:** 255K triangles, <50 draw calls
- **New files:** 12-15 new components
- **Modified files:** 8-10 existing files
- **Build phases:** 4-5

### 4.2 Component Breakdown (extends Option A)

Everything from Option A, **plus:**

#### B1. Enhanced Login Portal (20K tri)
- Full crystal portal geometry (not just ring) — multi-layered with inner glow
- 150 instanced particles with trail effect (custom shader)
- Chrome bezel glow animation (emissive pulse + rim light)

#### B2. Full Hero Animation — Mobile Cut (50K tri)
- All 8 phases preserved but with simplified geometry:
  - Phase 1-3 (Logo): 15K tri crystalline logo
  - Phase 4 (Shatter): 50 shards (instanced, 10K tri)
  - Phase 5-6 (Particles): 500 instanced cubes (GPU compute on WebGPU)
  - Phase 7-8 (Cockpit reveal): 25K tri simplified cockpit shell
- Duration: 12 seconds (vs 19s desktop)

#### B3. Simplified Cockpit Shell (80K tri)
- Chrome bezel ring (15K tri) — rounded extrusion, not just torus
- LED rim with 100 capsules (8K tri)
- 2 simplified side panels (25K tri each) — flat panel + indicators
- Status bar (7K tri) — XP meter + streak indicator
- No NPCs, no consoles, no floor detail

#### B4. Mini Holographic HUD (15K tri)
- 2 concentric rings (vs 8 on desktop)
- Data arc indicators
- Lab color pulsing

#### B5. Mobile Lab Map — Full 3D (30K tri)
- Mini geodesic dome (10K tri)
- 10 lab nodes with mini-diorama previews (2K each)
- Data highway connections (LineGeometry)
- Touch: pinch to zoom, tap to focus

#### B6. Themed Game Environments (50K tri each)
- Full themed backdrop per lab (not just generic props)
- Ambient lighting matching lab palette
- 2-3 animated props per scene
- Environmental particles

#### B7. Half-Resolution Bloom
- Single bloom pass at 0.5x resolution
- Threshold: 0.8 (only brightest elements glow)
- No vignette, no barrel distortion

### 4.3 Build Phase Integration

Insert as **Phases 5G-5K** (after Login 3D Enhancement):

| Sub-phase | Content |
|-----------|---------|
| **5G** | Shared infra + GPU detection + MobileCanvas |
| **5H** | Mobile login portal + hero animation (full) |
| **5I** | Mobile cockpit shell + HUD + chrome bezel |
| **5J** | Mobile lab map + game environments |
| **5K** | Polish + bloom + particle system + HS-5 verification |

---

## 5. OPTION C IMPLEMENTATION: "FULL PARITY"

### 5.1 Scope Summary
- **Budget:** 500-700K triangles, <95 draw calls
- **New files:** 18-22 new components + mobile variants of existing 3D
- **Modified files:** 12-15 existing files
- **Build phases:** 6-8

### 5.2 Key Differences from Option B

| Area | Option B | Option C |
|------|----------|----------|
| Cockpit | 80K simplified shell | 200K full geometry at `low` LOD |
| HUD | 2 rings (15K) | Full 8-ring HUD at reduced segments (40K) |
| Lab map | 30K mini dome | 80K full holographic with data highways |
| Game envs | 50K themed backdrop | 125K full environment at `low` LOD |
| NPCs | None | 2 billboard-sprite NPCs (20K) |
| Environment | None | Simplified fog + weather (10K) |
| Post-processing | Half-res bloom | Bloom + subtle vignette |

### 5.3 Risk Mitigations

- **Aggressive LOD required:** Every component must have `billboard` level (4 segments)
- **WebGPU mandatory for full experience:** WebGL2 auto-downgrades to Option A
- **Adaptive FPS monitor active:** Auto-reduces LOD if FPS drops below 24
- **Memory watchdog:** Monitors `performance.memory` and degrades if approaching limits
- **Resolution scaling:** During animation bursts, render at 0.5x DPR, scale back to 1x when idle

### 5.4 Build Phase Integration

Insert as **Phases 5G-5N** (8 sub-phases).

---

## 6. OPTION D IMPLEMENTATION: "HYBRID SMART"

### 6.1 Scope Summary
- **Budget:** 0-300K (adaptive per device tier)
- **Build approach:** Build Option A + Option B, plus detection layer that routes between them
- **Build phases:** 5-6

### 6.2 Tier Routing Architecture

```
Device Detection (app launch)
    ├── mobile-high (WebGPU + ≥4GB RAM)  → Option B components
    ├── mobile-mid  (WebGL2 + ≥2GB RAM)  → Option A components
    └── mobile-low  (everything else)     → Enhanced CSS (current + improvements)
```

### 6.3 Component Tier Mapping

```typescript
// src/lib/3d/mobileTierConfig.ts
export const MOBILE_TIER_COMPONENTS = {
  'mobile-high': {
    loginPortal: 'MobileLoginPortalFull',      // 20K tri (Option B)
    heroAnimation: 'MobileHeroFull',            // 50K tri
    cockpit: 'MobileCockpitShell',              // 80K tri
    labMap: 'MobileLabMap3D',                   // 30K tri
    gameEnv: 'MobileGameEnvironmentFull',       // 50K tri
    particles: 'MobileParticlesGPU',            // GPU compute
    hud: 'MobileHUDMini',                       // 15K tri
    bloom: true,
    maxTriangles: 300_000,
  },
  'mobile-mid': {
    loginPortal: 'MobileLoginPortalLite',       // 5K tri (Option A)
    heroAnimation: 'MobileHeroMicro',           // 15K tri
    cockpit: 'MobileChromeBezel',               // 10K tri
    labMap: 'MobileLabMapIsometric',            // 8K tri
    gameEnv: 'MobileGameEnvironmentLite',       // 10K tri
    particles: 'MobileParticlesInstanced',      // Instanced
    hud: null,
    bloom: false,
    maxTriangles: 100_000,
  },
  'mobile-low': {
    loginPortal: 'CSSLoginParticles',           // CSS dots
    heroAnimation: null,                         // Skip
    cockpit: 'CSSChromeBezel',                  // CSS gradient
    labMap: 'CSSLabGrid',                       // 2D grid
    gameEnv: 'GenericGameParticles',            // CSS particles
    particles: 'GenericGameParticles',
    hud: null,
    bloom: false,
    maxTriangles: 0,
  },
} as const;
```

### 6.4 Enhanced CSS Tier (mobile-low improvements)

Even devices that can't run R3F get visual upgrades:

| Enhancement | CSS Technique | Impact |
|-------------|-------------|--------|
| **Layered glassmorphism** | Multiple `backdrop-filter: blur()` at different opacities | Depth perception |
| **Parallax scroll** | `transform: translateZ()` + `perspective` on scroll container | 3D-like movement |
| **Card depth** | `transform: rotateX() rotateY()` on touch/tilt (DeviceOrientation API) | Interactive feel |
| **Richer particles** | More particles (30→60), varied sizes, CSS `filter: blur()` for depth-of-field | More immersive |
| **Animated borders** | `@keyframes` gradient rotation on chrome bezel borders | Living UI |
| **Glow effects** | `box-shadow` with animated spread + color cycling | Neon aesthetic |
| **Lab-themed gradients** | CSS `conic-gradient` + `radial-gradient` for environment backdrops | Themed spaces |

### 6.5 Build Phase Integration

| Sub-phase | Content | Notes |
|-----------|---------|-------|
| **5G** | Shared infra: GPU detection, tier routing, MobileCanvas, hooks | Foundation for all tiers |
| **5H** | Option A components (Lite tier) | mobile-mid experience |
| **5I** | Option B components (Immersive tier) | mobile-high experience |
| **5J** | Enhanced CSS improvements (Low tier) | mobile-low experience |
| **5K** | Integration: tier routing, transitions between tiers, fallback logic | Wiring |
| **5L** | Testing + visual verification across 3 tiers | HS-5 mobile checkpoint |

---

## 7. DECISION LOCK AMENDMENTS

Regardless of chosen option, these decisions need amendment:

| Decision | Current | Proposed Amendment |
|----------|---------|-------------------|
| **CPA2-12** | Zero R3F on mobile | Performance-budgeted R3F with auto CSS fallback |
| **New: MOB-1** | — | Mobile triangle budget: 100K (mid) / 300K (high) / 0 (low) |
| **New: MOB-2** | — | Mobile draw call limit: 25 (mid) / 50 (high) / 0 (low) |
| **New: MOB-3** | — | Mobile rendering: on-demand frameloop by default |
| **New: MOB-4** | — | Mobile bloom: half-res only on mobile-high tier |
| **New: MOB-5** | — | Mobile hero animation: compressed (8s mid / 12s high / skip low) |
| **New: MOB-6** | — | Mobile canvas: single persistent `<MobileCanvas>` (mirrors CPA2-1) |

---

## 8. TESTING REQUIREMENTS

### 8.1 Device Matrix

| Device | Category | Test Priority |
|--------|----------|-------------|
| iPhone 15 Pro | mobile-high | P0 |
| iPhone 13 | mobile-mid | P0 |
| iPhone SE (3rd gen) | mobile-low | P1 |
| Samsung Galaxy S24 | mobile-high | P0 |
| Samsung Galaxy A54 | mobile-mid | P0 |
| Pixel 7a | mobile-mid | P1 |
| Older Android (2022) | mobile-low | P1 |

### 8.2 Performance Targets

| Metric | mobile-high | mobile-mid | mobile-low |
|--------|:-:|:-:|:-:|
| FPS (active animation) | ≥30 | ≥30 | N/A (CSS) |
| FPS (idle/static) | 0 (on-demand) | 0 (on-demand) | N/A |
| Time to interactive | <3s | <2s | <1s |
| Memory usage | <200MB | <100MB | <50MB |
| Battery drain (30min) | <8% | <5% | <3% |

### 8.3 Visual Verification Checklist (New HS-11)

```
HARD STOP: Mobile 3D Enhancement complete. Please verify on a mobile device:

For mobile-high (WebGPU device):
- [ ] 3D login portal renders behind login card
- [ ] Hero animation plays (compressed sequence)
- [ ] Cockpit shell renders with chrome bezel + LED rim
- [ ] Lab map shows 3D nodes (touch to select)
- [ ] Game environments render with themed 3D backdrop
- [ ] Half-res bloom visible on bright elements
- [ ] FPS stays ≥30 during active animations
- [ ] Battery drain acceptable (<8% per 30 min)

For mobile-mid (WebGL2 device):
- [ ] Lite 3D login portal renders
- [ ] Micro hero animation plays (8 seconds)
- [ ] Chrome bezel ring renders as 3D
- [ ] Isometric lab map renders with touch interaction
- [ ] Game backgrounds show low-poly themed scene
- [ ] No bloom / no post-processing
- [ ] FPS stays ≥30

For mobile-low (fallback):
- [ ] Enhanced CSS glassmorphism visible
- [ ] Richer particle animations (60 particles)
- [ ] Animated gradient borders on chrome bezel
- [ ] Card tilt effects on touch
- [ ] No canvas element in DOM
- [ ] Smooth 60fps CSS animations

Reply 'approved' to continue, or describe issues.
```

---

## 9. ESTIMATED TIMELINE

| Option | Phases Added | Insertable After | Build Effort |
|--------|-------------|-----------------|-------------|
| **A (Lite)** | 3 phases (5G-1 to 5G-3) | Phase 5F | 2-3 sessions |
| **B (Immersive)** | 5 phases (5G-5K) | Phase 5F | 4-5 sessions |
| **C (Full Parity)** | 8 phases (5G-5N) | Phase 5F | 6-8 sessions |
| **D (Hybrid)** | 6 phases (5G-5L) | Phase 5F | 5-6 sessions |

All options insert after Phase 5F (Login 3D Enhancement) and before Phase 6 (Stage 4 Core Pages).

---

## 10. OPEN QUESTIONS FOR USER

1. **Which option do you prefer?** (A / B / C / D / modified combination)
2. **Should mobile-low devices keep current CSS or get enhanced CSS?** (Enhanced CSS adds ~1 phase)
3. **Is the hero animation important on mobile?** (Removing it saves 1 sub-phase of effort)
4. **Should we target WebGPU-only for mobile 3D?** (Simplifies code but loses ~25-30% of mobile users)
5. **Priority: battery life vs visual quality?** (Affects bloom, particle counts, animation duration)

---

*End of Part B — Implementation details for all options*
*Awaiting user selection before proceeding with build*
