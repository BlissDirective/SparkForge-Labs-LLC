import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Child, ChildBadge, Progress, AvatarConfig } from '@/types';

interface ChildState {
  activeChild: Child | null;
  children: Child[];
  badges: ChildBadge[];
  progress: Progress[];
  setActiveChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
  setBadges: (badges: ChildBadge[]) => void;
  setProgress: (progress: Progress[]) => void;
  updateXP: (xp: number) => void;
  updateLevel: (level: number, title: string) => void;
  updateStreak: (count: number) => void;
  updateCoins: (coins: number) => void;
  updateAvatarConfig: (config: Partial<AvatarConfig>) => void;
  clearChild: () => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set, get) => ({
      activeChild: null,
      children: [],
      badges: [],
      progress: [],
      setActiveChild: (activeChild) => set({ activeChild }),
      setChildren: (children) => set({ children }),
      setBadges: (badges) => set({ badges }),
      setProgress: (progress) => set({ progress }),
      updateXP: (xpToAdd) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, xp: child.xp + xpToAdd } });
      },
      updateLevel: (level, title) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, level, level_title: title } });
      },
      updateStreak: (count) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, streak_count: count } });
      },
      updateCoins: (coinsToAdd) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, spark_coins: child.spark_coins + coinsToAdd } });
      },
      updateAvatarConfig: (config) => {
        const child = get().activeChild;
        if (!child) return;
        set({ activeChild: { ...child, avatar_config: { ...child.avatar_config, ...config } } });
      },
      clearChild: () => set({ activeChild: null, children: [], badges: [], progress: [] }),
    }),
    { name: 'sparkforge-child', partialize: (state) => ({ activeChild: state.activeChild }) }
  )
);
