import { create } from 'zustand';
import type { CelebrationType } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  soundEnabled: boolean;
  dailyChallengeCompleted: boolean;
  particleIntensity: 'off' | 'low' | 'medium' | 'high';
  /** Per-child setting: skip the hero intro animation on page load.
   *  Default: false. Toggled in Settings page (Stage 4 Part 3).
   *  When true, HeroAnimation renders Phase 8 final state immediately. */
  skipIntroAnimation: boolean;
  /** FIX-DUAL-CANVAS: Global game-active flag consumed by useStationMode.
   *  When true, StationFrame unmounts its R3F Canvas so games get full GPU.
   *  Set by GameShell on mount/unmount. */
  gameActive: boolean;
  setGameActive: (active: boolean) => void;
  setSkipIntroAnimation: (skip: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
  setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  labColor: '#00BBFF',
  labTint: '#00BBFF',
  soundEnabled: true,
  dailyChallengeCompleted: false,
  particleIntensity: 'medium',
  skipIntroAnimation: false,
  gameActive: false,
  setGameActive: (gameActive) => set({ gameActive }),
  setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  triggerCelebration: (type, data = {}) => set({ showCelebration: true, celebrationType: type, celebrationData: data }),
  dismissCelebration: () => set({ showCelebration: false, celebrationType: null, celebrationData: null }),
  setLabColor: (labColor, labTint) => {
    set({ labColor, labTint: labTint || labColor });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--lab-color', labColor);
      document.documentElement.style.setProperty('--lab-glow', labColor + '40');
    }
  },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  markDailyChallengeComplete: () => set({ dailyChallengeCompleted: true }),
  resetDailyChallenge: () => set({ dailyChallengeCompleted: false }),
  setParticleIntensity: (particleIntensity) => set({ particleIntensity }),
}));
