// ════════════════════════════════════════════════════
// DEVICE STORE — Desktop-Ultra Hardcoded (D3D-1)
// ════════════════════════════════════════════════════
// Desktop-First Immersive 3D Overhaul: All rendering
// locked to maximum quality. No device selection,
// no tiered budgets, no LOD levels.
//
// <!-- FUTURE: When mobile 3D support is added, this store
//      will be expanded with R3F-native LOD tiers (Three.js
//      LOD object). No CSS fallbacks will ever be used.
//      Mobile will render full 3D at reduced triangle counts
//      using native Three.js LOD, not component-level checks. -->

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ■■ GPU Rendering Tier ■■
// Detected at runtime by webgpuDetection.ts
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2';

// ■■ Performance Profile — Desktop Ultra (Always) ■■
export interface PerformanceProfile {
  targetFPS: number;
  maxTriangles: number;
  particleMultiplier: number;
  bloomEnabled: boolean;
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  maxLights: number;
  textureResolution: 'full';
  instancedMeshLimit: number;
  sphereSegments: number;
  antialias: boolean;
  pixelRatio: number;
}

// ■■ Single Profile — Desktop Ultra ■■
const DESKTOP_ULTRA_PROFILE: PerformanceProfile = {
  targetFPS: 60,
  maxTriangles: 50_000_000,       // D3D-3: 50M total (30M cockpit + 20M game)
  particleMultiplier: 1.5,        // Max particles always
  bloomEnabled: true,
  postProcessingEnabled: true,
  shadowsEnabled: true,
  maxLights: 24,                  // Increased for full cockpit + game lighting
  textureResolution: 'full',
  instancedMeshLimit: 10_000,     // Doubled for dense cockpit geometry
  sphereSegments: 64,             // Ultra-quality curves
  antialias: true,
  pixelRatio: 3.0,                // D3D-4: Native DPR, generous cap
};

// ■■ Triangle Budgets — Desktop-Only (D3D-3) ■■
export type TriangleBudgetTier = 'flagship' | 'flLite' | 'standard' | 'system';
export const TRIANGLE_BUDGETS: Record<TriangleBudgetTier, number> = {
  flagship:  20_000_000,    // 20M — full immersive game environment
  flLite:    10_000_000,    // 10M — rich themed environment (up from 2M)
  standard:   5_000_000,    //  5M — full 3D lab environment (up from 500K)
  system:    30_000_000,    // 30M — cockpit shell (up from 20M)
};

// ■■ Store Interface ■■
interface DeviceState {
  profile: PerformanceProfile;
  gpuTier: GPUTier;
  stripeCount: number;
  setGpuTier: (tier: GPUTier, stripes?: number) => void;
  getTriangleBudget: (tier: TriangleBudgetTier) => number;
  getParticleCount: (baseCount: number) => number;
  getSphereDetail: (preferredSegments?: number) => number;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      profile: DESKTOP_ULTRA_PROFILE,
      gpuTier: 'webgl2' as GPUTier,
      stripeCount: 0,

      setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),

      getTriangleBudget: (tier) => TRIANGLE_BUDGETS[tier],

      getParticleCount: (baseCount) => {
        const { particleMultiplier } = get().profile;
        return Math.round(baseCount * particleMultiplier);
      },

      getSphereDetail: (preferredSegments) => {
        const { sphereSegments } = get().profile;
        return preferredSegments
          ? Math.min(preferredSegments, sphereSegments)
          : sphereSegments;
      },
    }),
    {
      name: 'sparkforge-device',
      partialize: (state) => ({
        gpuTier: state.gpuTier,
        stripeCount: state.stripeCount,
      }),
    }
  )
);

// ■■ Selector Helpers ■■
export const selectProfile = (s: DeviceState) => s.profile;
export const selectGpuTier = (s: DeviceState) => s.gpuTier;
export const selectStripeCount = (s: DeviceState) => s.stripeCount;

// REMOVED (D3D-1): DeviceType, LODLevel, selectDeviceType, selectHasSelected,
// PERFORMANCE_PROFILES (multi-device), TRIANGLE_BUDGETS (multi-device)
// REMOVED (D3D-2): LODLevel type export (was used by useLOD.ts — now deleted)

// <!-- FUTURE: MOBILE 3D LOD REINTEGRATION POINT
//
// When mobile support is added, it will use:
//   1. Three.js native LOD object (THREE.LOD) with distance-based geometry swapping
//   2. R3F-native <Detailed> component from @react-three/drei
//   3. Per-component LOD meshes baked at export time (not runtime switching)
//   4. GPU-adaptive quality via renderer.info.render.triangles monitoring
//
// What will NEVER be used:
//   - CSS fallback components (no GenericGameParticles, no CSS borders)
//   - Component-level useIsMobile() checks
//   - Wrapper-based LOD (no LODWrapper context)
//   - Canvas unmounting based on device type
//
// Mobile will render the SAME 3D scene at reduced complexity,
// not a different 2D scene. The 3D experience is the product. -->
