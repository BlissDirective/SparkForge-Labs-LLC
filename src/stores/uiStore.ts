import { create } from 'zustand';
import type { CelebrationType } from '@/types';

interface UIState {
  sidebarOpen: boolean;
  showCelebration: boolean;
  celebrationType: CelebrationType | null;
  celebrationData: Record<string, unknown> | null;
  labColor: string;
  labTint: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  triggerCelebration: (type: CelebrationType, data?: Record<string, unknown>) => void;
  dismissCelebration: () => void;
  setLabColor: (color: string, tint?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  showCelebration: false,
  celebrationType: null,
  celebrationData: null,
  labColor: '#00BBFF',
  labTint: '#00BBFF',
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
}));
