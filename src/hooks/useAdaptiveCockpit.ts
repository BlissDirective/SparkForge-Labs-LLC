'use client';

import { useState, useEffect } from 'react';
import { ADAPTIVE_CURVATURE, COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

// AUDIT-A7: Removed isCSSFallback per D3D-1 (desktop-only, no CSS fallback)
interface AdaptiveCockpitParams {
  arcDegrees: number;
  panelRadius: number;
  curvature: number;
}

export function useAdaptiveCockpit(): AdaptiveCockpitParams {
  const [params, setParams] = useState<AdaptiveCockpitParams>({
    arcDegrees: COCKPIT_GEOMETRY.totalWrapArc,
    panelRadius: COCKPIT_GEOMETRY.panelRadius,
    curvature: COCKPIT_GEOMETRY.panelCurvature,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function calculate() {
      const w = window.innerWidth;
      if (w >= ADAPTIVE_CURVATURE.ultraWide.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.ultraWide.arc,
          panelRadius: ADAPTIVE_CURVATURE.ultraWide.radius,
          curvature: COCKPIT_GEOMETRY.panelCurvature,
        });
      } else if (w >= ADAPTIVE_CURVATURE.desktop.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.desktop.arc,
          panelRadius: ADAPTIVE_CURVATURE.desktop.radius,
          curvature: COCKPIT_GEOMETRY.panelCurvature,
        });
      } else {
        // D3D-1: Even on smaller windows, render 3D (desktop-only platform)
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.desktop.arc,
          panelRadius: ADAPTIVE_CURVATURE.desktop.radius,
          curvature: COCKPIT_GEOMETRY.panelCurvature,
        });
      }
    }

    calculate();

    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculate, 150);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return params;
}
