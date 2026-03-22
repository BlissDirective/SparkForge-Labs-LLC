'use client';

import { useState, useEffect } from 'react';
import { ADAPTIVE_CURVATURE, COCKPIT_GEOMETRY } from '@/lib/3d/cockpitConfig';

interface AdaptiveCockpitParams {
  arcDegrees: number;
  panelRadius: number;
  curvature: number;
  isCSSFallback: boolean;
}

export function useAdaptiveCockpit(): AdaptiveCockpitParams {
  const [params, setParams] = useState<AdaptiveCockpitParams>({
    arcDegrees: COCKPIT_GEOMETRY.totalWrapArc,
    panelRadius: COCKPIT_GEOMETRY.panelRadius,
    curvature: COCKPIT_GEOMETRY.panelCurvature,
    isCSSFallback: false,
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
          isCSSFallback: false,
        });
      } else if (w >= ADAPTIVE_CURVATURE.desktop.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.desktop.arc,
          panelRadius: ADAPTIVE_CURVATURE.desktop.radius,
          curvature: COCKPIT_GEOMETRY.panelCurvature,
          isCSSFallback: false,
        });
      } else if (w >= ADAPTIVE_CURVATURE.tablet.minWidth) {
        setParams({
          arcDegrees: ADAPTIVE_CURVATURE.tablet.arc,
          panelRadius: ADAPTIVE_CURVATURE.tablet.radius,
          curvature: COCKPIT_GEOMETRY.panelCurvature * 0.8,
          isCSSFallback: false,
        });
      } else {
        setParams({
          arcDegrees: 0,
          panelRadius: 0,
          curvature: 0,
          isCSSFallback: true,
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
