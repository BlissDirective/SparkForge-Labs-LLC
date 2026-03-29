// ════════════════════════════════════════════════════
// ACCESSIBILITY STORE — Persisted user preferences
// Stage 10 Part 1 — 7th Zustand store
// v2 [ENH-10E]: Initial dark mode from system preference
// ════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FontSize = 'normal' | 'large' | 'xl';

interface A11yState {
  darkMode: boolean;
  fontSize: FontSize;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;

  toggleDarkMode: () => void;
  setFontSize: (s: FontSize) => void;
  toggleDyslexiaFont: () => void;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
  toggleScreenReader: () => void;
}

export const useA11yStore = create<A11yState>()(
  persist(
    (set) => ({
      // Default: dark (Frost-Prismatic theme). On first load, A11yProvider
      // checks prefers-color-scheme and updates if needed.
      darkMode: true,
      fontSize: 'normal',
      dyslexiaFont: false,
      reduceMotion: false,
      highContrast: false,
      screenReader: false,

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setFontSize: (fontSize) => set({ fontSize }),
      toggleDyslexiaFont: () => set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      toggleReduceMotion: () => set((s) => ({ reduceMotion: !s.reduceMotion })),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleScreenReader: () => set((s) => ({ screenReader: !s.screenReader })),
    }),
    { name: 'sparkforge-a11y' }
  )
);
