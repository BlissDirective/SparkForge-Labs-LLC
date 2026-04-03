'use client';

// ════════════════════════════════════════════════════════════════
// useCockpitScene — Page-Level Cockpit Mode Controller
// ════════════════════════════════════════════════════════════════
// Source of truth: SparkForge-Full-ControlScreen.json §page_to_scene_mapping
//
// Pages call this hook to declare their cockpit mode. The hook:
// 1. Reads the CockpitModePreset for the given mode
// 2. Applies all 14 atmosphere properties to cockpitStore + sceneStore
// 3. Broadcasts a page-navigate event via cockpitBroadcastStore
// 4. Returns resolved props for CockpitCanvas consumption
//
// Usage:
//   const scene = useCockpitScene('dashboard');
//   // or auto-detect from route:
//   const scene = useCockpitScene();

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import {
  COCKPIT_MODE_PRESETS,
  DIAL_CONFIGS,
  routeToCockpitMode,
  type CockpitMode,
  type CockpitModePreset,
} from '@/lib/3d/cockpitModePresets';

// ■■ Return type — everything CockpitCanvas and page components need ■■
export interface CockpitSceneState {
  mode: CockpitMode;
  preset: CockpitModePreset;
  dialLabels: [string, string, string];
  isTransitioning: boolean;
  setMode: (mode: CockpitMode) => void;

  // Resolved LED color (dynamic → actual lab color)
  resolvedLedColor: string;

  // Flattened props ready for CockpitCanvas
  canvasProps: {
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
    particleIntensity: 'off' | 'low' | 'medium' | 'high';
  };
}

interface UseCockpitSceneOptions {
  /** Override lab color for dynamic modes (lab_detail, game) */
  labColor?: string;
  /** Disable auto-broadcast on mode change */
  silent?: boolean;
}

export function useCockpitScene(
  explicitMode?: CockpitMode,
  options: UseCockpitSceneOptions = {},
): CockpitSceneState {
  const { labColor = '#00BBFF', silent = false } = options;
  const pathname = usePathname();
  const prevModeRef = useRef<CockpitMode | null>(null);

  // Auto-detect mode from route if not explicitly provided
  const mode = explicitMode ?? routeToCockpitMode(pathname);
  const preset = COCKPIT_MODE_PRESETS[mode];
  const dialLabels = DIAL_CONFIGS[mode];

  // Store actions (stable references)
  const setActiveMode = useCockpitStore((s) => s.setActiveMode);
  const activeMode = useCockpitStore((s) => s.activeMode);
  const isTransitioning = useCockpitStore((s) => s.isTransitioning);
  const setTransitioning = useCockpitStore((s) => s.setTransitioning);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);

  // Resolve LED color: 'dynamic' → actual lab color, static → as-is
  const resolvedLedColor = preset.ledColor === 'dynamic' ? labColor : preset.ledColor;

  // Flatten preset into CockpitCanvas-compatible props
  const canvasProps = useMemo(() => ({
    ledColor: resolvedLedColor,
    bloomIntensity: preset.bloom.intensity,
    bloomThreshold: preset.bloom.threshold,
    bloomSmoothing: preset.bloom.smoothing,
    vignetteDarkness: preset.vignette.darkness,
    vignetteOffset: preset.vignette.offset,
    cameraFov: preset.camera.fov,
    barrelDistortion: preset.camera.distortion,
    hudOpacity: preset.hud.opacity,
    hudRotationSpeed: preset.hud.rotationSpeed,
    hudPulseIntensity: preset.hud.pulseIntensity,
    sidePanelOpacity: preset.sidePanels.opacity,
    statusBarOpacity: preset.statusBar.opacity,
    panelCurvature: preset.panels.curvature,
    panelOpacity: preset.panels.opacity,
    particleIntensity: (preset.particles === 'max' ? 'high' : preset.particles) as 'off' | 'low' | 'medium' | 'high',
  }), [preset, resolvedLedColor]);

  // Apply mode change to stores + broadcast
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    const prevMode = prevModeRef.current;
    prevModeRef.current = mode;

    // Update cockpit store
    setActiveMode(mode);

    // Mark transition in progress
    if (prevMode !== null) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setTransitioning(false);
      }, preset.transition.durationMs);
      return () => clearTimeout(timer);
    }
  }, [mode, setActiveMode, setTransitioning, preset.transition.durationMs]);

  // Broadcast page-navigate event (separate effect to avoid cleanup conflicts)
  useEffect(() => {
    if (silent) return;
    if (activeMode !== mode) return; // Wait for store to sync

    broadcast({
      type: 'page-navigate',
      source: `scene-${mode}`,
      color: resolvedLedColor,
      label: mode.toUpperCase(),
      targetPage: pathname,
    });
    // Only broadcast when mode actually changes in the store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  const setMode = useCallback((newMode: CockpitMode) => {
    setActiveMode(newMode);
  }, [setActiveMode]);

  return {
    mode,
    preset,
    dialLabels,
    isTransitioning,
    setMode,
    resolvedLedColor,
    canvasProps,
  };
}
