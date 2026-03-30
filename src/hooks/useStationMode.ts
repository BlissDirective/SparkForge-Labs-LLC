'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSceneStore } from '@/stores/sceneStore';
import {
  BLOOM_PRESETS,
  CAMERA_PRESETS,
  VIGNETTE_PRESETS,
  HUD_PRESETS,
  SIDE_PANEL_PRESETS,
  PANEL_CURVATURE_PRESETS,
  PANEL_OPACITY_PRESETS,
  STATUS_BAR_PRESETS,
} from '@/lib/3d/cockpitConfig';
import type { SidePanelContent } from '@/lib/3d/cockpitConfig';
import { LAB_COLORS, LAB_NAMES, DEFAULT_LED_COLOR } from '@/config/labs';

// useStationMode — Laboratory Control Station Mode Manager
// Decisions: 2.1 (all pages), 3.4 (dimmed during games)
// CPA v1.0: Extended with bloom, vignette, FOV, HUD, cockpit fields
// Drives: LED rim color, aurora bg, particle behavior, frame glow,
//         cockpit panels, HUD, side panels, status bar, bloom, camera

export type StationMode =
  | 'dashboard'
  | 'labmap'
  | 'lab'
  | 'game'
  | 'profile'
  | 'celebration'
  | 'onboarding'
  | 'parent'
  | 'admin';

export interface StationModeState {
  mode: StationMode;
  ledColor: string;
  bgIntensity: number;
  particleCount: number;
  particleSpeed: number;
  frameGlow: number;
  frameDimmed: boolean;
  activeLabId: number | null;
  activeLabColor: string;
  activeLabName: string;

  // CPA v1.0 — Cockpit Panoramic Architecture fields
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
  sidePanelLeftContent: SidePanelContent;
  sidePanelRightContent: SidePanelContent;
  statusBarOpacity: number;
  panelCurvature: number;
  panelOpacity: number;
}

// Lab colors, names, and default LED color imported from @/config/labs (single source of truth)

export function useStationMode(): StationModeState & {
  setCelebration: (active: boolean) => void;
  setLabId: (id: number | null) => void;
} {
  const pathname = usePathname();

  // AUDIT-A1: D3D-B1 — Read game state from sceneStore (replaces deprecated uiStore.gameActive)
  const activeScene = useSceneStore((s) => s.activeScene);
  const gameActive = activeScene === 'game' || activeScene === 'transitioning';
  const [celebrationActive, setCelebration] = useState(false);
  const [manualLabId, setLabId] = useState<number | null>(null);

  // Derive mode from pathname
  const derivedMode = useMemo((): StationMode => {
    if (celebrationActive) return 'celebration';
    if (gameActive) return 'game';
    if (!pathname) return 'dashboard';
    if (pathname.startsWith('/onboarding')) return 'onboarding';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/parent')) return 'parent';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname === '/labs') return 'labmap';
    if (pathname.startsWith('/labs/')) return 'lab';
    if (pathname.startsWith('/home')) return 'dashboard';
    return 'dashboard';
  }, [pathname, gameActive, celebrationActive]);

  // Derive lab ID from pathname or manual override
  const activeLabId = useMemo(() => {
    if (manualLabId !== null) return manualLabId;
    if (pathname?.startsWith('/labs/')) {
      const match = pathname.match(/\/labs\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  }, [pathname, manualLabId]);

  const activeLabColor = activeLabId
    ? LAB_COLORS[activeLabId] || DEFAULT_LED_COLOR
    : DEFAULT_LED_COLOR;
  const activeLabName = activeLabId
    ? LAB_NAMES[activeLabId] || ''
    : '';

  // Helper: build CPA fields from presets for a given mode key
  const buildCPAFields = useCallback((modeKey: StationMode) => {
    const bloom = BLOOM_PRESETS[modeKey] || BLOOM_PRESETS.dashboard;
    const camera = CAMERA_PRESETS[modeKey] || CAMERA_PRESETS.dashboard;
    const vignette = VIGNETTE_PRESETS[modeKey] || VIGNETTE_PRESETS.dashboard;
    const hud = HUD_PRESETS[modeKey] || HUD_PRESETS.dashboard;
    const sidePanel = SIDE_PANEL_PRESETS[modeKey] || SIDE_PANEL_PRESETS.dashboard;
    const statusBar = STATUS_BAR_PRESETS[modeKey] || STATUS_BAR_PRESETS.dashboard;
    const panelCurvature = PANEL_CURVATURE_PRESETS[modeKey] ?? PANEL_CURVATURE_PRESETS.dashboard;
    const panelOpacity = PANEL_OPACITY_PRESETS[modeKey] ?? PANEL_OPACITY_PRESETS.dashboard;

    return {
      bloomIntensity: bloom.intensity,
      bloomThreshold: bloom.threshold,
      bloomSmoothing: bloom.smoothing,
      vignetteDarkness: vignette.darkness,
      vignetteOffset: vignette.offset,
      cameraFov: camera.fov,
      barrelDistortion: camera.distortion,
      hudOpacity: hud.opacity,
      hudRotationSpeed: hud.rotationSpeed,
      hudPulseIntensity: hud.pulseIntensity,
      sidePanelOpacity: sidePanel.opacity,
      sidePanelLeftContent: sidePanel.leftContent as SidePanelContent,
      sidePanelRightContent: sidePanel.rightContent as SidePanelContent,
      statusBarOpacity: statusBar.opacity,
      panelCurvature,
      panelOpacity,
    };
  }, []);

  // Build the full state
  const state = useMemo((): StationModeState => {
    const cpa = buildCPAFields(derivedMode);

    switch (derivedMode) {
      case 'dashboard':
        return {
          mode: 'dashboard',
          ledColor: DEFAULT_LED_COLOR,
          bgIntensity: 0.15,
          particleCount: 300,
          particleSpeed: 0.3,
          frameGlow: 0.5,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: DEFAULT_LED_COLOR,
          activeLabName: '',
          ...cpa,
        };
      case 'labmap':
        return {
          mode: 'labmap',
          ledColor: DEFAULT_LED_COLOR,
          bgIntensity: 0.25,
          particleCount: 400,
          particleSpeed: 0.5,
          frameGlow: 0.6,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: DEFAULT_LED_COLOR,
          activeLabName: '',
          ...cpa,
        };
      case 'lab':
        return {
          mode: 'lab',
          ledColor: activeLabColor,
          bgIntensity: 0.3,
          particleCount: 500,
          particleSpeed: 0.6,
          frameGlow: 0.7,
          frameDimmed: false,
          activeLabId,
          activeLabColor,
          activeLabName,
          ...cpa,
        };
      case 'game':
        // Decision 3.4: Frame dimmed during games
        return {
          mode: 'game',
          ledColor: activeLabColor,
          bgIntensity: 0.1,
          particleCount: 100,
          particleSpeed: 0.2,
          frameGlow: 0.2,
          frameDimmed: true,
          activeLabId,
          activeLabColor,
          activeLabName,
          ...cpa,
        };
      case 'profile':
        return {
          mode: 'profile',
          ledColor: '#AA66FF',
          bgIntensity: 0.15,
          particleCount: 300,
          particleSpeed: 0.3,
          frameGlow: 0.5,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#AA66FF',
          activeLabName: '',
          ...cpa,
        };
      case 'celebration':
        return {
          mode: 'celebration',
          ledColor: '#FFD700',
          bgIntensity: 0.5,
          particleCount: 1000,
          particleSpeed: 1.5,
          frameGlow: 1.0,
          frameDimmed: false,
          activeLabId,
          activeLabColor: '#FFD700',
          activeLabName: '',
          ...cpa,
        };
      case 'onboarding':
        return {
          mode: 'onboarding',
          ledColor: DEFAULT_LED_COLOR,
          bgIntensity: 0.2,
          particleCount: 200,
          particleSpeed: 0.4,
          frameGlow: 0.4,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: DEFAULT_LED_COLOR,
          activeLabName: '',
          ...cpa,
        };
      case 'parent':
        // Stage 8: Parent dashboard — subtle cockpit, focus on HTML content
        return {
          mode: 'parent',
          ledColor: '#FFAA44', // Amber accent for parent context
          bgIntensity: 0.12,
          particleCount: 150,
          particleSpeed: 0.25,
          frameGlow: 0.35,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#FFAA44',
          activeLabName: '',
          ...cpa,
        };
      case 'admin':
        // Stage 9: Admin content review — minimal cockpit, terminal aesthetic
        return {
          mode: 'admin',
          ledColor: '#00FF88', // Green accent for admin/ops context
          bgIntensity: 0.08,
          particleCount: 100,
          particleSpeed: 0.2,
          frameGlow: 0.25,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#00FF88',
          activeLabName: '',
          ...cpa,
        };
      default:
        return {
          mode: 'dashboard',
          ledColor: DEFAULT_LED_COLOR,
          bgIntensity: 0.15,
          particleCount: 300,
          particleSpeed: 0.3,
          frameGlow: 0.5,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: DEFAULT_LED_COLOR,
          activeLabName: '',
          ...cpa,
        };
    }
  }, [derivedMode, activeLabId, activeLabColor, activeLabName, buildCPAFields]);

  return {
    ...state,
    setCelebration,
    setLabId,
  };
}

// ================================================================
// v3 Stage 4 P2 Additions — Lab Transition Integration
// ================================================================
// APPENDED by Stage 4 Part 2B v3-FINAL
// DO NOT modify existing code above.

// Lab pattern transition progress (0.0 - 1.0)
// Consumed by LabPatternBackground for crossfade
export function useLabTransitionProgress() {
  const [progress, setProgress] = useState(1.0);
  const [previousLabId, setPreviousLabId] = useState<number | null>(null);

  const startTransition = useCallback(
    (fromLabId: number | null, _toLabId: number) => {
      setPreviousLabId(fromLabId);
      setProgress(0);

      // Animate progress 0 -> 1 over 0.4s (the crossfade portion)
      const start = performance.now();
      const duration = 400; // ms
      const animate = (now: number) => {
        const elapsed = now - start;
        const p = Math.min(elapsed / duration, 1.0);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setProgress(eased);
        if (p < 1.0) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },
    []
  );

  return { progress, previousLabId, startTransition };
}

// AUDIT-A1: useGameFocusState removed — superseded by sceneStore (D3D-B5)
// Game focus state is now managed by sceneStore.enterGame/exitGame/transition
