// ════════════════════════════════════════════════════
// PARENT STORE — Dashboard state and actions
// v2: Uses SubscriptionTier from tier-config.ts (BUG-8A fix)
// v2: Adds timeLimitMinutes per child (ENH-8C)
// ════════════════════════════════════════════════════
import { create } from 'zustand';
import type { SubscriptionTier } from '@/lib/tier-config';

export interface ChildSummary {
  id: string;
  display_name: string;
  age_band: 'A' | 'B' | 'C';
  xp: number;
  level: number;
  streak_count: number;
  streak_last_date: string | null;
  lessons_completed: number;
  quizzes_passed: number;
  games_played: number;
  total_time_minutes: number;
  badges_earned: number;
  labs_completed: number;
  last_active: string | null;
  daily_time_limit_minutes: number | null;
}

interface ParentState {
  tier: SubscriptionTier;
  children: ChildSummary[];
  selectedChildId: string | null;
  isLoading: boolean;

  setTier: (tier: SubscriptionTier) => void;
  setChildren: (children: ChildSummary[]) => void;
  selectChild: (id: string) => void;
  setLoading: (v: boolean) => void;
  updateChildTimeLimit: (childId: string, minutes: number | null) => void;
}

export const useParentStore = create<ParentState>((set) => ({
  tier: 'free',
  children: [],
  selectedChildId: null,
  isLoading: true,

  setTier: (tier) => set({ tier }),
  setChildren: (children) => set({ children }),
  selectChild: (id) => set({ selectedChildId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  updateChildTimeLimit: (childId, minutes) =>
    set((state) => ({
      children: state.children.map((c) =>
        c.id === childId ? { ...c, daily_time_limit_minutes: minutes } : c
      ),
    })),
}));
