'use client';

// ================================================================
// SparkForge StationFrame — Cockpit Panoramic Architecture Orchestrator
// ================================================================
// 20M COCKPIT UPGRADE: Now a thin wrapper around CockpitCanvas.
//
// Previously contained its own R3F <Canvas> at z-index 0. As of the
// 20M upgrade (March 20, 2026), StationFrame delegates all 3D rendering
// to the unified CockpitCanvas (CPA2-1: Single Canvas).
//
// This component is preserved as the public API consumed by the
// dashboard layout, passing through all station mode props.
//
// Architecture history:
//   v1: CSS border frame
//   v2: R3F Canvas with curved panels (CPA v1.0)
//   v3: Thin wrapper → CockpitCanvas (20M upgrade, CPA2-1)

import { CockpitCanvas } from './CockpitCanvas';
import type { SidePanelContent, StationModeKey } from '@/lib/3d/cockpitConfig';

interface StationFrameProps {
  mode?: string;
  ledColor?: string;
  bgIntensity?: number;
  particleCount?: number;
  particleSpeed?: number;
  frameGlow?: number;
  frameDimmed?: boolean;
  activeLabColor?: string;
  particleIntensity?: 'off' | 'low' | 'medium' | 'high';
  scanlineEnabled?: boolean;
  spikeEvent?: boolean;
  // CPA v1.0 props
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomSmoothing?: number;
  vignetteDarkness?: number;
  vignetteOffset?: number;
  cameraFov?: number;
  barrelDistortion?: number;
  hudOpacity?: number;
  hudRotationSpeed?: number;
  hudPulseIntensity?: number;
  sidePanelOpacity?: number;
  sidePanelLeftContent?: SidePanelContent;
  sidePanelRightContent?: SidePanelContent;
  statusBarOpacity?: number;
  panelCurvature?: number;
  panelOpacity?: number;
  // Data for StatusBar3D
  xp?: number;
  xpMax?: number;
  streak?: number;
  sessionTime?: number;
  labProgress?: { done: number; total: number };
}

export function StationFrame(props: StationFrameProps) {
  // Pass through all props to the unified CockpitCanvas
  return (
    <CockpitCanvas
      mode={props.mode as StationModeKey | undefined}
      ledColor={props.ledColor}
      bgIntensity={props.bgIntensity}
      activeLabColor={props.activeLabColor}
      particleIntensity={props.particleIntensity}
      scanlineEnabled={props.scanlineEnabled}
      spikeEvent={props.spikeEvent}
      frameDimmed={props.frameDimmed}
      bloomIntensity={props.bloomIntensity}
      bloomThreshold={props.bloomThreshold}
      bloomSmoothing={props.bloomSmoothing}
      vignetteDarkness={props.vignetteDarkness}
      vignetteOffset={props.vignetteOffset}
      cameraFov={props.cameraFov}
      barrelDistortion={props.barrelDistortion}
      hudOpacity={props.hudOpacity}
      hudRotationSpeed={props.hudRotationSpeed}
      hudPulseIntensity={props.hudPulseIntensity}
      sidePanelOpacity={props.sidePanelOpacity}
      sidePanelLeftContent={props.sidePanelLeftContent}
      sidePanelRightContent={props.sidePanelRightContent}
      statusBarOpacity={props.statusBarOpacity}
      panelCurvature={props.panelCurvature}
      panelOpacity={props.panelOpacity}
      xp={props.xp}
      xpMax={props.xpMax}
      streak={props.streak}
      sessionTime={props.sessionTime}
      labProgress={props.labProgress}
    />
  );
}
