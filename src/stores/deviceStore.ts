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
    maxTriangles: 500_000,
    lodBias: 'ultra',
    particleMultiplier: 1.0,
    bloomEnabled: true,
    postProcessingEnabled: true,
    shadowsEnabled: true,
    maxLights: 12,
    textureResolution: 'full',
    instancedMeshLimit: 2000,
    sphereSegments: 32,
    antialias: true,
    pixelRatio: 2.5,
  },
  tablet: {
    targetFPS: 45,
    maxTriangles: 150_000,
    lodBias: 'high',
    particleMultiplier: 0.6,
    bloomEnabled: true,
    postProcessingEnabled: true,
    shadowsEnabled: false,
    maxLights: 4,
    textureResolution: 'half',
    instancedMeshLimit: 500,
    sphereSegments: 16,
    antialias: true,
    pixelRatio: 1.5,
  },
  mobile: {
    targetFPS: 30,
    maxTriangles: 50_000,
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

// ■■ Triangle budgets per game tier, scaled by device ■■
export const TRIANGLE_BUDGETS: Record<DeviceType, { flagship: number; flLite: number; standard: number }> = {
  desktop:  { flagship: 200_000, flLite: 100_000, standard: 50_000 },
  tablet:   { flagship: 100_000, flLite: 50_000,  standard: 25_000 },
  mobile:   { flagship: 50_000,  flLite: 25_000,  standard: 10_000 },
};

// ■■ Store Interface ■■
interface DeviceState {
  deviceType: DeviceType | null;       // null = not yet selected
  hasSelected: boolean;                // true after user makes a choice
  profile: PerformanceProfile;
  setDeviceType: (type: DeviceType) => void;
  getTriangleBudget: (tier: 'flagship' | 'flLite' | 'standard') => number;
  getParticleCount: (baseCount: number) => number;
  getSphereDetail: (preferredSegments?: number) => number;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceType: null,
      hasSelected: false,
      profile: PERFORMANCE_PROFILES.desktop, // Default until selected

      setDeviceType: (type: DeviceType) =>
        set({
          deviceType: type,
          hasSelected: true,
          profile: PERFORMANCE_PROFILES[type],
        }),

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
