'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSceneStore } from '@/stores/sceneStore';
import type { SidePanelContent } from '@/lib/3d/cockpitConfig';
// Phase 5 §6.3 / O.3-MAX: Source CPA fields from the unified
// COCKPIT_MODE_PRESETS instead of the 8 fragmented preset objects that
// previously lived in cockpitConfig.ts. Game-mode FOV is now authoritatively
// 72 (was 52 in the deleted CAMERA_PRESETS, which never matched what the
// renderer actually used via useCockpitScene).
import { COCKPIT_MODE_PRESETS } from '@/lib/3d/cockpitModePresets';
import type { CockpitMode } from '@/lib/3d/cockpitModePresets';
import { LAB_COLORS, LAB_NAMES, DEFAULT_LED_COLOR } from '@/config/labs';

// useCockpitMode (formerly useStationMode) — Laboratory Control Station Mode Manager
// Decisions: 2.1 (all pages), 3.4 (dimmed during games)
// CPA v1.0: Extended with bloom, vignette, FOV, HUD, cockpit fields
// Drives: LED rim color, aurora bg, particle behavior, frame glow,
//         cockpit panels, HUD, side panels, status bar, bloom, camera
//
// Phase 2 Section 7 (Solution D): Unified on CockpitMode. StationMode is
// retained as a deprecated alias for backward compatibility.

// Re-export CockpitMode for consumers that still import StationMode from here.
export type { CockpitMode } from '@/lib/3d/cockpitModePresets';
/** @deprecated Use CockpitMode from @/lib/3d/cockpitModePresets */
export type StationMode = CockpitMode;

export interface StationModeState {
  mode: CockpitMode;
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

export function useCockpitMode(): StationModeState & {
  setCelebration: (active: boolean) => void;
  setLabId: (id: number | null) => void;
} {
  const pathname = usePathname();

  // AUDIT-A1: D3D-B1 — Read game state from sceneStore (replaces deprecated uiStore.gameActive)
  const activeScene = useSceneStore((s) => s.activeScene);
  const gameActive = activeScene === 'game' || activeScene === 'transitioning';
  const [celebrationActive, setCelebration] = useState(false);
  const [manualLabId, setLabId] = useState<number | null>(null);

  // Derive mode from pathname (Phase 2 Section 7: unified on CockpitMode)
  const derivedMode = useMemo((): CockpitMode => {
    if (celebrationActive) return 'celebration';
    if (gameActive) return 'game';
    if (!pathname) return 'dashboard';
    if (pathname.startsWith('/onboarding')) return 'onboarding';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/parent')) return 'parent';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname === '/arcade') return 'arcade';
    if (pathname === '/labs') return 'labs';
    if (pathname.startsWith('/labs/')) return 'lab_detail';
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

  // Helper: build CPA fields from the unified COCKPIT_MODE_PRESETS.
  // Phase 5 §6.3 / O.3-MAX: This replaces 8 separate fragmented preset
  // objects (BLOOM_PRESETS, CAMERA_PRESETS, etc.) with reads against the
  // single authoritative preset dictionary. Identical output shape —
  // every downstream consumer (dashboard layout, cockpit canvas props)
  // sees the same CPA fields.
  const buildCPAFields = useCallback((modeKey: CockpitMode) => {
    const preset = COCKPIT_MODE_PRESETS[modeKey] || COCKPIT_MODE_PRESETS.dashboard;

    return {
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
      sidePanelLeftContent: preset.sidePanels.leftContent as SidePanelContent,
      sidePanelRightContent: preset.sidePanels.rightContent as SidePanelContent,
      statusBarOpacity: preset.statusBar.opacity,
      panelCurvature: preset.panels.curvature,
      panelOpacity: preset.panels.opacity,
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
      case 'arcade':
        return {
          mode: 'arcade',
          ledColor: '#88CC44',       // Green-amber blend — game browser energy
          bgIntensity: 0.2,
          particleCount: 500,
          particleSpeed: 0.6,
          frameGlow: 0.6,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#88CC44',
          activeLabName: '',
          ...cpa,
        };
      case 'labs':
        return {
          mode: 'labs',
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
      case 'lab_detail':
        return {
          mode: 'lab_detail',
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
      case 'settings':
        return {
          mode: 'settings',
          ledColor: '#FFAA44',
          bgIntensity: 0.15,
          particleCount: 250,
          particleSpeed: 0.3,
          frameGlow: 0.45,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#FFAA44',
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
          ledColor: '#FFAA44',       // Amber for welcoming onboarding vibe
          bgIntensity: 0.2,
          particleCount: 200,
          particleSpeed: 0.4,
          frameGlow: 0.4,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#FFAA44',
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
          ledColor: '#FF4444', // Red accent for admin/ops context
          bgIntensity: 0.08,
          particleCount: 100,
          particleSpeed: 0.2,
          frameGlow: 0.25,
          frameDimmed: false,
          activeLabId: null,
          activeLabColor: '#FF4444',
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

// Phase 2 Section 7: Backward-compat alias. New code should use useCockpitMode.
/** @deprecated Use useCockpitMode from the same module. */
export const useStationMode = useCockpitMode;

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
