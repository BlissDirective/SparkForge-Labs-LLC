'use client';

import { useMemo } from 'react';
import { ADAPTIVE_CURVATURE, COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';
import { useDeviceProfile } from './useDeviceProfile';

// AUDIT-A7: Removed isCSSFallback per D3D-1 (desktop-only, no CSS fallback)
// Week 1 refactor: thin selector over useDeviceProfile so every viewport
// decision flows through one source of truth.
interface AdaptiveCockpitParams {
  arcDegrees: number;
  panelRadius: number;
  curvature: number;
}

export function useAdaptiveCockpit(): AdaptiveCockpitParams {
  const { tier } = useDeviceProfile();

  return useMemo(() => {
    if (tier === 'ultrawide') {
      return {
        arcDegrees: ADAPTIVE_CURVATURE.ultraWide.arc,
        panelRadius: ADAPTIVE_CURVATURE.ultraWide.radius,
        curvature: COCKPIT_GEOMETRY.panelCurvature,
      };
    }
    // desktop, tablet, mobile all return desktop curvature here. mobile +
    // tablet never actually render the 3D cockpit — the Week 2 gate in
    // CockpitCanvas short-circuits to the 2D dashboard before these
    // params are consumed.
    return {
      arcDegrees: ADAPTIVE_CURVATURE.desktop.arc,
      panelRadius: ADAPTIVE_CURVATURE.desktop.radius,
      curvature: COCKPIT_GEOMETRY.panelCurvature,
    };
  }, [tier]);
}
