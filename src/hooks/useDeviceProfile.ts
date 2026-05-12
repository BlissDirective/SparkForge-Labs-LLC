'use client';

import { useEffect, useState } from 'react';

// Week 1 — device-detection primitive (single source of truth for every
// fallback decision: 3D vs 2D, hero vs poster, touch hit-target expansion,
// reduced-motion gating). Tier thresholds align with ADAPTIVE_CURVATURE
// breakpoints in src/lib/3d/cockpitConfig.ts: 1920+ = ultrawide curvature,
// 1440+ = standard desktop curvature. Below 1440 the 3D scene falls
// through to the 2D dashboard gate added in Week 2.

export type DeviceTier = 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceProfile {
  tier: DeviceTier;
  touch: boolean;
  dpr: number;
  viewport: { width: number; height: number };
  orientation: Orientation;
  supportsWebGPU: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  isHydrated: boolean;
}

// SSR default mirrors the D3D desktop-only baseline so server-rendered
// markup matches the pre-hydration browser tree on a desktop visitor.
const SSR_DEFAULT: DeviceProfile = {
  tier: 'desktop',
  touch: false,
  dpr: 1,
  viewport: { width: 1440, height: 900 },
  orientation: 'landscape',
  supportsWebGPU: false,
  prefersReducedMotion: false,
  prefersHighContrast: false,
  isHydrated: false,
};

export function classifyTier(width: number): DeviceTier {
  if (width >= 1920) return 'ultrawide';
  if (width >= 1440) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(SSR_DEFAULT);

  useEffect(() => {
    let resizeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastMQ = window.matchMedia('(prefers-contrast: more)');
    const touchMQ = window.matchMedia('(pointer: coarse)');

    function compute() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setProfile({
        tier: classifyTier(width),
        touch: touchMQ.matches,
        // Cap DPR at 3x; values above (some Android phones report 4x) blow
        // up render targets with no perceptual gain.
        dpr: Math.min(window.devicePixelRatio || 1, 3),
        viewport: { width, height },
        orientation: width >= height ? 'landscape' : 'portrait',
        supportsWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
        prefersReducedMotion: reducedMotionMQ.matches,
        prefersHighContrast: highContrastMQ.matches,
        isHydrated: true,
      });
    }

    compute();

    // 150ms debounce mirrors useAdaptiveCockpit so resize-driven re-renders
    // stay rate-limited even when the user is dragging a window edge.
    function handleResize() {
      if (resizeTimeoutId !== undefined) clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(compute, 150);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', compute);
    reducedMotionMQ.addEventListener('change', compute);
    highContrastMQ.addEventListener('change', compute);
    touchMQ.addEventListener('change', compute);

    return () => {
      if (resizeTimeoutId !== undefined) clearTimeout(resizeTimeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', compute);
      reducedMotionMQ.removeEventListener('change', compute);
      highContrastMQ.removeEventListener('change', compute);
      touchMQ.removeEventListener('change', compute);
    };
  }, []);

  return profile;
}
