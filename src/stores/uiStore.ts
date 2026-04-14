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
  setSkipIntroAnimation: (skip: boolean) => void;
  /** Show performance stats overlay (triangle counter, FPS, draw calls).
   *  Default: false. Always shown in development mode regardless.
   *  In production, toggleable by admin users in Settings panel (COCK-13). */
  showPerfStats: boolean;
  setShowPerfStats: (show: boolean) => void;
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
  showPerfStats: false,
  // gameActive/setGameActive removed — D3D-B1: use sceneStore.enterGame/exitGame
  setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
  setShowPerfStats: (showPerfStats) => set({ showPerfStats }),
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
