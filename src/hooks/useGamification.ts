import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useChildStore } from '@/stores/childStore';
import { useToastStore } from '@/stores/toastStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// v2 [ENH]: Optimistic XP update — shows instant feedback
export function useAwardXP() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();
  const { activeChild } = useChildStore();

  return useMutation({
    mutationFn: (body: { childId: string; amount: number; source: string }) =>
      apiFetch('/api/gamification/xp', { method: 'POST', body: JSON.stringify(body) }),

    // v2 [ENH]: Optimistic update — instantly show XP in sidebar
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['progress'] });

      // Snapshot for rollback
      const previousChild = activeChild ? { ...activeChild } : null;

      // Optimistically update local store
      if (activeChild) {
        useChildStore.getState().updateXP(variables.amount);
      }

      return { previousChild };
    },

    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
    },

    onSuccess: (result) => {
      // Show XP celebration
      triggerCelebration('xp', { xp: result.xpAwarded || result.amount });

      // Broadcast to cockpit
      useCockpitBroadcast.getState().broadcast({
        type: 'xp-change',
        source: 'gamification-xp',
        value: result.xpAwarded || result.amount,
        color: '#F59E0B',
      });

      // If leveled up, show level celebration after XP toast
      if (result.leveledUp) {
        useCockpitBroadcast.getState().broadcast({
          type: 'level-up',
          source: 'gamification-level',
          value: result.newLevel,
          color: '#8B5CF6',
          label: result.newTitle,
        });

        setTimeout(() => {
          triggerCelebration('level', {
            level: result.newLevel,
            title: result.newTitle,
          });
        }, 2500);
      }
    },

    onSettled: () => {
      // Always refetch to sync with server
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// v2 [ENH]: Optimistic streak update
export function useUpdateStreak() {
  const qc = useQueryClient();
  const { activeChild } = useChildStore();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch('/api/gamification/streak', { method: 'POST', body: JSON.stringify({ childId }) }),

    // v2 [ENH]: Optimistic streak increment
    onMutate: async () => {
      const previousChild = activeChild ? { ...activeChild } : null;

      if (activeChild) {
        useChildStore.getState().setActiveChild({
          ...activeChild,
          streak_count: activeChild.streak_count + 1,
        });
      }

      return { previousChild };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
    },

    onSuccess: (result) => {
      // Broadcast streak update to cockpit
      useCockpitBroadcast.getState().broadcast({
        type: 'streak-update',
        source: 'gamification-streak',
        color: '#FF6644',
      });

      // v2 [NEW-2D]: Streak recovery toast
      if (result.shieldUsed) {
        useToastStore.getState().addToast(
          'info',
          'Streak Saved! Your streak shield protected your streak!',
          4000
        );
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

// Get badges for a child
export function useBadges(childId: string) {
  return useQuery({
    queryKey: ['badges', childId],
    queryFn: () => apiFetch(`/api/gamification/badges?childId=${childId}`),
    enabled: !!childId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Check for new badges after an action
export function useCheckBadges() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch('/api/gamification/badges', { method: 'POST', body: JSON.stringify({ childId }) }),
    onSuccess: (result) => {
      if (result.newBadges && result.newBadges.length > 0) {
        // Broadcast badge earn to cockpit
        useCockpitBroadcast.getState().broadcast({
          type: 'badge-earn',
          source: 'gamification-badge',
          color: '#AA66FF',
          label: result.newBadges[0]?.name,
        });

        // Delay badge celebration to not overlap with XP toast
        setTimeout(() => {
          triggerCelebration('badge', result.newBadges[0]);
        }, 2500);
      }
      qc.invalidateQueries({ queryKey: ['badges'] });
    },
  });
}

// COMBINED FLOW: complete content → award XP → update streak → check badges
// This is the main function games and lessons call when a child finishes something.
export function useCompleteAndReward() {
  const completeContent = useCompleteContentInternal();
  const awardXP = useAwardXP();
  const updateStreak = useUpdateStreak();
  const checkBadges = useCheckBadges();

  return async (
    childId: string,
    contentId: string,
    xpAmount: number,
    source: string,
    score?: number
  ) => {
    // Step 1: Record completion
    await completeContent.mutateAsync({ childId, contentId, score });

    // Step 2: Award XP (triggers celebration)
    await awardXP.mutateAsync({ childId, amount: xpAmount, source });

    // Step 3: Update streak
    await updateStreak.mutateAsync(childId);

    // Step 4: Check for new badges
    await checkBadges.mutateAsync(childId);
  };
}

// Internal helper — used only by useCompleteAndReward
function useCompleteContentInternal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { childId: string; contentId: string; score?: number }) =>
      apiFetch('/api/progress', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
