'use client';

// ════════════════════════════════════════════════════════════════════
// useCockpitCanvasProps — Phase 5 N.2-MAX (§3.6)
// ════════════════════════════════════════════════════════════════════
// Reactive bridge that merges user preferences from cockpitStore with
// the active mode preset from useCockpitScene to produce the final
// CockpitCanvasProps consumed by dashboard layout.
//
// PROBLEM (audit §3.6): Two parallel config systems:
//   - useCockpitScene flattens mode presets → canvasProps (bloom,
//     vignette, FOV, etc.)
//   - cockpitStore persists user settings (theme, brightness,
//     audioVolumes)
//
// User brightness changes updated cockpitStore but canvasProps weren't
// re-flattened — theming + brightness tweaks did NOTHING visually.
//
// FIX: This hook merges both. Consumers get a reactive canvasProps
// object that updates when EITHER the active scene OR user preferences
// change. Theme color overrides apply uniformly across bloom tint,
// LED rim, HUD accent.
// ════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitScene } from './useCockpitScene';
import { resolveTheme } from '@/lib/3d/cockpitThemes';

export interface CockpitCanvasPropsResolved {
  ledColor: string;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  vignetteDarkness: number;
  vignetteOffset: number;
  cameraFov: number;
  barrelDistortion: number;
  hudOpacity: number;
  hudRotationSpeed: number;
  hudPulseIntensity: number;
  sidePanelOpacity: number;
  statusBarOpacity: number;
  panelCurvature: number;
  panelOpacity: number;
  // Theme-derived fields
  themePanelTint: string;
  themeHudAccent: string;
  themeAmbientLight: string;
  themeEnvHdr: string;
}

/**
 * Compose the final canvas props from the route-driven scene preset
 * merged with user theme + brightness preferences.
 *
 * All consumers that currently destructure from `useCockpitScene().canvasProps`
 * can switch to this hook and get theme-reactive output.
 */
export function useCockpitCanvasProps(): CockpitCanvasPropsResolved {
  const scene = useCockpitScene();
  const themeId = useCockpitStore((s) => s.cockpitTheme);
  const brightness = useCockpitStore((s) => s.brightness);

  return useMemo(() => {
    const theme = resolveTheme(themeId);
    const baseProps = scene.canvasProps;

    // Brightness: user slider default 1.0 = no-op. Below 1 dims bloom
    // + deepens vignette; above 1 (if UI allows) brightens. Clamped to
    // [0.3, 1.5] to avoid extreme distortion. Inverse relationship on
    // vignette — brighter scene = less vignette.
    const b = Math.max(0.3, Math.min(1.5, brightness));
    const brightnessMult = b;
    const vignetteMult = Math.max(0.4, 2 - b); // 1.0 brightness → 1.0 mult, 1.5 → 0.5 mult

    return {
      // LED color: if scene preset specifies explicit color, use it
      // (lab-focused moments override theme). Otherwise use theme base.
      ledColor: baseProps.ledColor || theme.ledBase,

      bloomIntensity: baseProps.bloomIntensity * theme.bloomMultiplier * brightnessMult,
      bloomThreshold: baseProps.bloomThreshold,
      bloomSmoothing: baseProps.bloomSmoothing,

      vignetteDarkness: baseProps.vignetteDarkness * vignetteMult,
      vignetteOffset: baseProps.vignetteOffset,

      cameraFov: baseProps.cameraFov,
      barrelDistortion: baseProps.barrelDistortion,

      hudOpacity: baseProps.hudOpacity,
      hudRotationSpeed: baseProps.hudRotationSpeed,
      hudPulseIntensity: baseProps.hudPulseIntensity,

      sidePanelOpacity: baseProps.sidePanelOpacity,
      statusBarOpacity: baseProps.statusBarOpacity,
      panelCurvature: baseProps.panelCurvature,
      panelOpacity: baseProps.panelOpacity,

      // Theme-derived fields for consumers that want to reactively
      // color panel tint / HUD accent / ambient light / env map.
      themePanelTint: theme.panelTint,
      themeHudAccent: theme.hudAccent,
      themeAmbientLight: theme.ambientLight,
      themeEnvHdr: theme.envHdr,
    };
  }, [scene.canvasProps, themeId, brightness]);
}
