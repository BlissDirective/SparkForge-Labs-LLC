import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CelebrationType } from '@/types';

// ════════════════════════════════════════════════════════════════
// R2 (Phase 3 Part 2): accessibilityStore merged into uiStore.a11y.
// The 12 consumers that previously subscribed to useA11yStore now
// read state.a11y.* from uiStore. Actions stay top-level to match
// cockpitStore's convention.
//
// Persist key migration: the old `sparkforge-a11y` localStorage key
// is read once at rehydrate, its values copied into state.a11y, and
// the legacy key deleted. Subsequent writes go to the new
// `sparkforge-ui` key. See onRehydrateStorage below.
// ════════════════════════════════════════════════════════════════

export type A11yFontSize = 'normal' | 'large' | 'xl';

export interface A11ySlice {
  darkMode: boolean;
  fontSize: A11yFontSize;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
}

const A11Y_DEFAULTS: A11ySlice = {
  // Default: dark (Frost-Prismatic theme). A11yProvider checks
  // prefers-color-scheme on first mount and updates if needed.
  darkMode: true,
  fontSize: 'normal',
  dyslexiaFont: false,
  reduceMotion: false,
  highContrast: false,
  screenReader: false,
};

const LEGACY_A11Y_KEY = 'sparkforge-a11y';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  /**
   * @deprecated Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
   * Use `cockpitStore.masterSoundEnabled` instead. This field remains as a backward-compat
   * mirror — the cockpitStore subscribe-bridge keeps it in sync.
   */
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
  /** T15a PERF-MED-003 (Opt A): Performance mode disables the two most
   *  expensive post-processing effects (DepthOfField + SSAO/N8AO). All
   *  other effects stay on — D3D-5 is otherwise honored. Persists in
   *  localStorage per child. Surfaced as a toggle in Settings. */
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
  /**
   * @deprecated Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
   * Use `cockpitStore.setMasterSoundEnabled(value)` or `cockpitStore.muteAll()/unmuteAll()`.
   */
  toggleSound: () => void;
  markDailyChallengeComplete: () => void;
  resetDailyChallenge: () => void;
  setParticleIntensity: (level: 'off' | 'low' | 'medium' | 'high') => void;

  // R2: a11y slice (merged from accessibilityStore)
  a11y: A11ySlice;

  // R2: a11y actions (kept top-level for ergonomic call sites —
  // matches cockpitStore's pattern of flat actions / nested state)
  toggleDarkMode: () => void;
  setFontSize: (size: A11yFontSize) => void;
  toggleDyslexiaFont: () => void;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
  toggleScreenReader: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
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
  performanceMode: false,
  // gameActive/setGameActive removed — D3D-B1: use sceneStore.enterGame/exitGame
  setSkipIntroAnimation: (skipIntroAnimation) => set({ skipIntroAnimation }),
  setShowPerfStats: (showPerfStats) => set({ showPerfStats }),
  setPerformanceMode: (performanceMode) => set({ performanceMode }),
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

  // R2: a11y state + actions (merged from accessibilityStore)
  a11y: { ...A11Y_DEFAULTS },

  toggleDarkMode: () =>
    set((s) => ({ a11y: { ...s.a11y, darkMode: !s.a11y.darkMode } })),
  setFontSize: (fontSize) =>
    set((s) => ({ a11y: { ...s.a11y, fontSize } })),
  toggleDyslexiaFont: () =>
    set((s) => ({ a11y: { ...s.a11y, dyslexiaFont: !s.a11y.dyslexiaFont } })),
  toggleReduceMotion: () =>
    set((s) => ({ a11y: { ...s.a11y, reduceMotion: !s.a11y.reduceMotion } })),
  toggleHighContrast: () =>
    set((s) => ({ a11y: { ...s.a11y, highContrast: !s.a11y.highContrast } })),
  toggleScreenReader: () =>
    set((s) => ({ a11y: { ...s.a11y, screenReader: !s.a11y.screenReader } })),
    }),
    {
      name: 'sparkforge-ui',
      version: 1,
      // Only persist the a11y slice (preserves parity with the old
      // `sparkforge-a11y` store) + performanceMode (T15a — a child
      // on a weaker machine wants the choice to stick across reloads).
      // sidebarOpen / celebration / labColor are transient UI state.
      partialize: (state) => ({
        a11y: state.a11y,
        performanceMode: state.performanceMode,
      }),
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // R2 migration: read the old `sparkforge-a11y` blob on first load
      // after the merge, copy values into state.a11y, then remove the
      // legacy key so subsequent reloads skip this branch.
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        if (typeof window === 'undefined') return;
        const legacy = window.localStorage.getItem(LEGACY_A11Y_KEY);
        if (!legacy) return;
        try {
          const parsed = JSON.parse(legacy) as {
            state?: Partial<A11ySlice>;
          };
          if (parsed.state) {
            state.a11y = {
              darkMode: parsed.state.darkMode ?? state.a11y.darkMode,
              fontSize: parsed.state.fontSize ?? state.a11y.fontSize,
              dyslexiaFont:
                parsed.state.dyslexiaFont ?? state.a11y.dyslexiaFont,
              reduceMotion:
                parsed.state.reduceMotion ?? state.a11y.reduceMotion,
              highContrast:
                parsed.state.highContrast ?? state.a11y.highContrast,
              screenReader:
                parsed.state.screenReader ?? state.a11y.screenReader,
            };
          }
        } catch {
          // legacy key corrupt — fall back to defaults
        }
        window.localStorage.removeItem(LEGACY_A11Y_KEY);
      },
    },
  ),
);
