'use client';

// ════════════════════════════════════════════════════
// useLOD — Mandatory Level of Detail Hook
// ════════════════════════════════════════════════════
// Every 3D component MUST use this hook to determine
// its rendering complexity. LOD is driven by:
//   1. Device type (from deviceStore)
//   2. Camera distance (for distance-based LOD)
//   3. Scene complexity (adaptive degradation)
//
// LOD Levels:
//   high     — Full geometry, all effects (desktop, close camera)
//   medium   — Reduced segments, simplified effects (tablet, mid-range)
//   low      — Minimal geometry, no effects (mobile, far camera)
//   billboard — 2D sprite replacement (extreme distance / perf budget)
//
// Usage:
//   const lod = useLOD({ tier: 'flagship' });
//   <sphereGeometry args={[radius, lod.segments, lod.segments]} />

import { useState, useEffect, useMemo } from 'react';
import { useDeviceStore, type LODLevel, type DeviceType } from '@/stores/deviceStore';

// ■■ LOD Configuration per Level ■■
interface LODConfig {
  segments: number;           // Sphere/cylinder segments
  tubularSegments: number;    // Tube geometry detail
  subdivisions: number;       // Mesh subdivision level
  particleMultiplier: number; // Scale particle counts
  enableEffects: boolean;     // Glow, trails, sparkles
  enableShadows: boolean;     // Cast/receive shadows
  enableReflections: boolean; // Env map reflections
  enableAnimations: boolean;  // Complex animations
  textureDetail: 'full' | 'half' | 'quarter';
  maxInstances: number;       // Instanced mesh limit
}

const LOD_CONFIGS: Record<LODLevel, LODConfig> = {
  ultra: {
    segments: 32,
    tubularSegments: 64,
    subdivisions: 4,
    particleMultiplier: 1.5,
    enableEffects: true,
    enableShadows: true,
    enableReflections: true,
    enableAnimations: true,
    textureDetail: 'full',
    maxInstances: 2000,
  },
  high: {
    segments: 16,
    tubularSegments: 32,
    subdivisions: 3,
    particleMultiplier: 1.0,
    enableEffects: true,
    enableShadows: true,
    enableReflections: true,
    enableAnimations: true,
    textureDetail: 'full',
    maxInstances: 500,
  },
  medium: {
    segments: 12,
    tubularSegments: 20,
    subdivisions: 2,
    particleMultiplier: 0.6,
    enableEffects: true,
    enableShadows: false,
    enableReflections: true,
    enableAnimations: true,
    textureDetail: 'half',
    maxInstances: 200,
  },
  low: {
    segments: 8,
    tubularSegments: 12,
    subdivisions: 1,
    particleMultiplier: 0.3,
    enableEffects: false,
    enableShadows: false,
    enableReflections: false,
    enableAnimations: true,
    textureDetail: 'quarter',
    maxInstances: 50,
  },
  billboard: {
    segments: 4,
    tubularSegments: 6,
    subdivisions: 0,
    particleMultiplier: 0.1,
    enableEffects: false,
    enableShadows: false,
    enableReflections: false,
    enableAnimations: false,
    textureDetail: 'quarter',
    maxInstances: 10,
  },
};

// ■■ Triangle scaling factors per tier ■■
const TIER_SCALE: Record<string, Record<LODLevel, number>> = {
  flagship: { ultra: 1.5, high: 1.0, medium: 0.5, low: 0.25, billboard: 0.05 },
  flLite:   { ultra: 1.5, high: 1.0, medium: 0.5, low: 0.25, billboard: 0.05 },
  standard: { ultra: 1.5, high: 1.0, medium: 0.5, low: 0.25, billboard: 0.05 },
  system:   { ultra: 1.5, high: 1.0, medium: 0.7, low: 0.4, billboard: 0.1 },
};

// ■■ Hook Options ■■
interface UseLODOptions {
  /** Game tier — determines triangle budget */
  tier: 'flagship' | 'flLite' | 'standard' | 'system';
  /** Override device-based LOD level */
  forcedLevel?: LODLevel;
  /** Distance from camera for distance-based LOD (optional) */
  cameraDistance?: number;
  /** Distance thresholds for LOD transitions [medium, low, billboard] */
  distanceThresholds?: [number, number, number];
}

// ■■ Hook Return ■■
export interface LODState extends LODConfig {
  level: LODLevel;
  triangleBudget: number;
  scaledBudget: number;    // Budget adjusted for current LOD level
  deviceType: DeviceType;
}

// ■■ Default distance thresholds ■■
const DEFAULT_THRESHOLDS: [number, number, number] = [8, 15, 30];

// ■■ Determine LOD from device + distance ■■
function resolveLODLevel(
  deviceBias: LODLevel,
  cameraDistance?: number,
  thresholds: [number, number, number] = DEFAULT_THRESHOLDS
): LODLevel {
  // Start with device bias
  const levels: LODLevel[] = ['ultra', 'high', 'medium', 'low', 'billboard'];
  let levelIndex = levels.indexOf(deviceBias);

  // If camera distance provided, potentially downgrade further
  if (cameraDistance !== undefined) {
    if (cameraDistance > thresholds[2]) {
      levelIndex = Math.max(levelIndex, 4); // billboard
    } else if (cameraDistance > thresholds[1]) {
      levelIndex = Math.max(levelIndex, 3); // low
    } else if (cameraDistance > thresholds[0]) {
      levelIndex = Math.max(levelIndex, 2); // medium
    }
  }

  return levels[Math.min(levelIndex, levels.length - 1)];
}

export function useLOD(options: UseLODOptions): LODState {
  const { tier, forcedLevel, cameraDistance, distanceThresholds } = options;

  const deviceType = useDeviceStore((s) => s.deviceType) || 'desktop';
  const profile = useDeviceStore((s) => s.profile);
  const getTriangleBudget = useDeviceStore((s) => s.getTriangleBudget);

  // Resolve the LOD level
  const level = useMemo(() => {
    if (forcedLevel) return forcedLevel;
    return resolveLODLevel(profile.lodBias, cameraDistance, distanceThresholds);
  }, [forcedLevel, profile.lodBias, cameraDistance, distanceThresholds]);

  // Get triangle budget and scale it
  const triangleBudget = useMemo(
    () => tier === 'system' ? 3000 : getTriangleBudget(tier),
    [tier, getTriangleBudget]
  );

  const tierScale = TIER_SCALE[tier] || TIER_SCALE.standard;
  const scaledBudget = Math.round(triangleBudget * (tierScale[level] || 1.0));

  // Get LOD config
  const config = LOD_CONFIGS[level];

  return useMemo(
    () => ({
      ...config,
      level,
      triangleBudget,
      scaledBudget,
      deviceType,
    }),
    [config, level, triangleBudget, scaledBudget, deviceType]
  );
}

// ■■ Adaptive FPS Monitor ■■
// Optional: monitors actual FPS and auto-downgrades LOD if performance drops
export function useAdaptiveLOD(options: UseLODOptions): LODState & {
  isThrottled: boolean;
  actualFPS: number;
} {
  const baseLOD = useLOD(options);
  const targetFPS = useDeviceStore((s) => s.profile.targetFPS);

  const [actualFPS, setActualFPS] = useState(60);
  const [isThrottled, setIsThrottled] = useState(false);

  // FPS sampling
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measure = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        setActualFPS(fps);

        // If FPS drops below 80% of target for 2+ seconds, signal throttle
        const threshold = targetFPS * 0.8;
        setIsThrottled(fps < threshold);

        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [targetFPS]);

  // Auto-downgrade LOD if throttled
  const adaptedLevel = useMemo(() => {
    if (!isThrottled) return baseLOD.level;
    const levels: LODLevel[] = ['ultra', 'high', 'medium', 'low', 'billboard'];
    const currentIdx = levels.indexOf(baseLOD.level);
    return levels[Math.min(currentIdx + 1, levels.length - 1)];
  }, [isThrottled, baseLOD.level]);

  const adaptedConfig = LOD_CONFIGS[adaptedLevel];
  const tierScale = TIER_SCALE[options.tier] || TIER_SCALE.standard;

  return useMemo(
    () => ({
      ...adaptedConfig,
      level: adaptedLevel,
      triangleBudget: baseLOD.triangleBudget,
      scaledBudget: Math.round(baseLOD.triangleBudget * (tierScale[adaptedLevel] || 1.0)),
      deviceType: baseLOD.deviceType,
      isThrottled,
      actualFPS,
    }),
    [adaptedConfig, adaptedLevel, baseLOD.triangleBudget, baseLOD.deviceType, tierScale, isThrottled, actualFPS]
  );
}

// ■■ LOD Helper — Scale geometry args for common shapes ■■
export function lodSphere(lod: LODState, radius: number): [number, number, number] {
  return [radius, lod.segments, lod.segments];
}

export function lodCylinder(
  lod: LODState,
  radiusTop: number,
  radiusBottom: number,
  height: number
): [number, number, number, number] {
  return [radiusTop, radiusBottom, height, lod.segments];
}

export function lodTorus(
  lod: LODState,
  radius: number,
  tube: number
): [number, number, number, number] {
  return [radius, tube, lod.segments, lod.tubularSegments];
}
