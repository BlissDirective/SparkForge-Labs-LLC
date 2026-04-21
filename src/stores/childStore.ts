// ════════════════════════════════════════════════════════════════
// childStore — UI-ONLY selection state (post T5c-C4)
// ════════════════════════════════════════════════════════════════
// STATE-MED-001 (B-full) final shape. Holds the active-child
// *selection* only — the full Child row is served by React Query
// (['children'] cache) via useActiveChild() / useChildren().
//
// Removed in T5c-C4:
//   - activeChild: Child | null        → use useActiveChild()
//   - children: Child[]                → use useChildren()
//   - badges: ChildBadge[]             → use useBadges(childId) [dead-code was always []]
//   - progress: Progress[]             → use useProgress*() hooks
//   - setChildren / setBadges / setProgress
//   - setActiveChild(child)            → use setActiveChildId(id)
//   - updateXP / updateLevel / updateStreak / updateCoins /
//     updateAvatarConfig                → React Query mutations handle these
//
// What remains:
//   - activeChildId: string | null
//   - setActiveChildId(id)
//   - clearChild()
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChildState {
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  clearChild: () => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      activeChildId: null,
      setActiveChildId: (activeChildId) => set({ activeChildId }),
      clearChild: () => set({ activeChildId: null }),
    }),
    { name: 'sparkforge-child', partialize: (state) => ({ activeChildId: state.activeChildId }) }
  )
);
