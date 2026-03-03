'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// useStationMode — Laboratory Control Station Mode Manager
// Decisions: 2.1 (all pages), 3.4 (dimmed during games)
// Drives: LED rim color, aurora bg, particle behavior, frame glow

export type StationMode =
  | 'dashboard'
  | 'labmap'
  | 'lab'
  | 'game'
  | 'profile'
  | 'celebration'
  | 'onboarding';

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
}

// Lab accent colors from the 10-lab palette
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', // What IS AI? — Blue
  2: '#AA66FF', // Teaching Machines — Purple
  3: '#FF66AA', // The Brain Inside — Pink
  4: '#FFAA44', // AI That Creates — Amber
  5: '#00FF88', // AI Helpers — Emerald
  6: '#FF6644', // AI & Ethics — Red
  7: '#06B6D4', // Computer Vision — Cyan
  8: '#818CF8', // Words & Language — Violet
  9: '#10B981', // Build with AI — Green
  10: '#D946EF', // AI's Future — Fuchsia
};

const LAB_NAMES: Record<number, string> = {
  1: 'What IS AI?',
  2: 'Teaching Machines',
  3: 'The Brain Inside',
  4: 'AI That Creates',
  5: 'AI Helpers',
  6: 'AI & Ethics',
  7: 'Computer Vision',
  8: 'Words & Language',
  9: 'Build with AI',
  10: "AI's Future",
};

const DEFAULT_LED_COLOR = '#00BBFF'; // Frost-Prismatic primary blue

export function useStationMode(): StationModeState & {
  setGameActive: (active: boolean) => void;
  setCelebration: (active: boolean) => void;
  setLabId: (id: number | null) => void;
} {
  const pathname = usePathname();

  const [gameActive, setGameActive] = useState(false);
  const [celebrationActive, setCelebration] = useState(false);
  const [manualLabId, setLabId] = useState<number | null>(null);

  // Derive mode from pathname
  const derivedMode = useMemo((): StationMode => {
    if (celebrationActive) return 'celebration';
    if (gameActive) return 'game';
    if (!pathname) return 'dashboard';
    if (pathname.startsWith('/onboarding')) return 'onboarding';
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

  // Build the full state
  const state = useMemo((): StationModeState => {
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
        };
    }
  }, [derivedMode, activeLabId, activeLabColor, activeLabName]);

  return {
    ...state,
    setGameActive,
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

// Game focus state — tracks when crystal tunnel is active
// Used by StationFrame to dim frame during game entry
export function useGameFocusState() {
  const [isFocusing, setIsFocusing] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  const startFocus = useCallback(() => {
    setIsFocusing(true);
  }, []);

  const completeFocus = useCallback(() => {
    setIsFocusing(false);
    setIsGameActive(true);
  }, []);

  const exitGame = useCallback(() => {
    setIsGameActive(false);
  }, []);

  return {
    isFocusing, // Crystal tunnel playing
    isGameActive, // Game loaded and active
    startFocus,
    completeFocus,
    exitGame,
  };
}
