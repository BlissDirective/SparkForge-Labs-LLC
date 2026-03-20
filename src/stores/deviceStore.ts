// ════════════════════════════════════════════════════
// DEVICE PERFORMANCE STORE — Persisted device profile
// Drives FPS targets, LOD levels, particle counts,
// bloom quality, and 3D complexity across the platform.
//
// User selects device type at first launch via
// DeviceSelectionModal. Choice persists in localStorage.
// ════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ■■ Device Types ■■
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// ■■ LOD Level ■■
// Used by useLOD hook and all 3D components
export type LODLevel = 'ultra' | 'high' | 'medium' | 'low' | 'billboard';

// ■■ GPU Rendering Tier ■■
// Detected at runtime by webgpuDetection.ts
// Determines particle budget and rendering pipeline for hero animation
export type GPUTier = 'webgpu-high' | 'webgpu-mid' | 'webgpu-low' | 'webgl2' | 'css';

// ■■ Performance Profile ■■
// Pre-calculated values derived from device type
export interface PerformanceProfile {
  targetFPS: number;
  maxTriangles: number;           // Per-scene hard cap
  lodBias: LODLevel;              // Default LOD level
  particleMultiplier: number;     // Scale factor for particle counts
  bloomEnabled: boolean;
  postProcessingEnabled: boolean;
  shadowsEnabled: boolean;
  maxLights: number;
  textureResolution: 'full' | 'half' | 'quarter';
  instancedMeshLimit: number;     // Max instanced copies
  sphereSegments: number;         // Default sphere detail
  antialias: boolean;
  pixelRatio: number;             // Device pixel ratio cap
}

// ■■ Performance Profiles per Device Type ■■
const PERFORMANCE_PROFILES: Record<DeviceType, PerformanceProfile> = {
  desktop: {
    targetFPS: 60,
    maxTriangles: 20_000_000,     // 20M cockpit upgrade (was 10M)
    lodBias: 'ultra',
    particleMultiplier: 1.0,
    bloomEnabled: true,
    postProcessingEnabled: true,
    shadowsEnabled: true,
    maxLights: 16,                // increased from 12 for cockpit lighting
    textureResolution: 'full',
    instancedMeshLimit: 5000,     // increased from 2000 for structural detail
    sphereSegments: 64,           // increased from 32 for ultra-quality curves
    antialias: true,
    pixelRatio: 2.5,
  },
  tablet: {
    targetFPS: 45,
    maxTriangles: 10_000_000,     // 10M cockpit upgrade (was 5M)
    lodBias: 'high',
    particleMultiplier: 0.6,
    bloomEnabled: true,
    postProcessingEnabled: true,
    shadowsEnabled: false,
    maxLights: 8,                 // increased from 4 for cockpit lighting
    textureResolution: 'half',
    instancedMeshLimit: 1500,     // increased from 500 for structural detail
    sphereSegments: 32,           // increased from 16 for smoother curves
    antialias: true,
    pixelRatio: 1.5,
  },
  mobile: {
    targetFPS: 30,
    maxTriangles: 2_500_000,
    lodBias: 'low',
    particleMultiplier: 0.3,
    bloomEnabled: false,
    postProcessingEnabled: false,
    shadowsEnabled: false,
    maxLights: 2,
    textureResolution: 'quarter',
    instancedMeshLimit: 50,
    sphereSegments: 8,
    antialias: false,
    pixelRatio: 1,
  },
};

// ■■ Triangle budgets per game/system tier, scaled by device ■■
// Flagship upgraded to 10M (March 18, 2026) — fully immersive environments
// FL-Lite upgraded to 2M (March 18, 2026) — immersive themed environments
// System tier: 20M cockpit upgrade (March 20, 2026) — full 3D panoramic cockpit
export type TriangleBudgetTier = 'flagship' | 'flLite' | 'standard' | 'system';
export const TRIANGLE_BUDGETS: Record<DeviceType, Record<TriangleBudgetTier, number>> = {
  desktop:  { flagship: 10_000_000, flLite: 2_000_000, standard: 50_000,  system: 20_000_000 },
  tablet:   { flagship: 5_000_000,  flLite: 1_000_000, standard: 25_000,  system: 10_000_000 },
  mobile:   { flagship: 2_500_000,  flLite: 500_000,   standard: 10_000,  system: 0 },
};

// ■■ Store Interface ■■
interface DeviceState {
  deviceType: DeviceType | null;       // null = not yet selected
  hasSelected: boolean;                // true after user makes a choice
  profile: PerformanceProfile;
  /** GPU rendering tier detected at runtime by webgpuDetection.ts.
   *  Determines particle budget and rendering pipeline for hero animation.
   *  Cached in localStorage alongside existing device preferences. */
  gpuTier: GPUTier;
  /** Number of striped particle buffers (1-4) based on GPU VRAM capability.
   *  Each stripe holds 2.5M particles at 48 bytes each. */
  stripeCount: number;
  setDeviceType: (type: DeviceType) => void;
  setGpuTier: (tier: GPUTier, stripes?: number) => void;
  getTriangleBudget: (tier: TriangleBudgetTier) => number;
  getParticleCount: (baseCount: number) => number;
  getSphereDetail: (preferredSegments?: number) => number;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceType: null,
      hasSelected: false,
      profile: PERFORMANCE_PROFILES.desktop, // Default until selected
      gpuTier: 'webgl2' as GPUTier,  // safe default until detection runs
      stripeCount: 0,                 // 0 = no WebGPU stripes (WebGL2/CSS mode)

      setDeviceType: (type: DeviceType) =>
        set({
          deviceType: type,
          hasSelected: true,
          profile: PERFORMANCE_PROFILES[type],
        }),

      setGpuTier: (gpuTier, stripes = 0) => set({ gpuTier, stripeCount: stripes }),

      getTriangleBudget: (tier) => {
        const device = get().deviceType || 'desktop';
        return TRIANGLE_BUDGETS[device][tier];
      },

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
        deviceType: state.deviceType,
        hasSelected: state.hasSelected,
        gpuTier: state.gpuTier,
        stripeCount: state.stripeCount,
      }),
      // Rehydrate profile from persisted deviceType
      onRehydrateStorage: () => (state) => {
        if (state?.deviceType) {
          state.profile = PERFORMANCE_PROFILES[state.deviceType];
        }
      },
    }
  )
);

// ■■ Selector Helpers (for use in components) ■■
export const selectProfile = (s: DeviceState) => s.profile;
export const selectDeviceType = (s: DeviceState) => s.deviceType;
export const selectHasSelected = (s: DeviceState) => s.hasSelected;
export const selectGpuTier = (s: DeviceState) => s.gpuTier;
export const selectStripeCount = (s: DeviceState) => s.stripeCount;
