import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useChildStore } from '@/stores/childStore';
import { useToastStore, toast } from '@/stores/toastStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

// UX-HIGH-003 (B): helper for offline-vs-network-error copy
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// v2 [ENH]: Optimistic XP update — shows instant feedback
export function useAwardXP() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();
  const { activeChild } = useChildStore();

  // UX-HIGH-003 (B): ref captures mutation.mutate so the retry toast
  // action can invoke it without TDZ issues. Populated after
  // useMutation returns.
  const mutateRef = useRef<((vars: {
    childId: string;
    source: string;
    gameId?: string;
    amount?: number;
  }) => void) | null>(null);

  const mutation = useMutation({
    // API-HIGH-003 (C): `gameId` is now the authoritative input for
    // source === 'game'. `amount` is still accepted (and required for
    // non-game sources), but the server ignores it for games.
    mutationFn: (body: {
      childId: string;
      source: string;
      gameId?: string;
      amount?: number;
    }) =>
      apiFetch<{
        xpAwarded?: number;
        amount?: number;
        leveledUp?: boolean;
        newLevel?: number;
        newTitle?: string;
        capped?: boolean;
      }>('/api/gamification/xp', { method: 'POST', body: JSON.stringify(body) }),

    // v2 [ENH]: Optimistic update — instantly show XP in sidebar
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['progress'] });

      // Snapshot for rollback
      const previousChild = activeChild ? { ...activeChild } : null;

      // Optimistically update local store. For source=game the real
      // amount is server-computed, so we use an optimistic guess
      // (variables.amount if provided, else a conservative 25) — the
      // `onSettled` invalidation will reconcile with the authoritative
      // server value. API-HIGH-003 (C).
      if (activeChild) {
        const optimistic = variables.amount ?? 25;
        useChildStore.getState().updateXP(optimistic);
      }

      return { previousChild };
    },

    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
      // UX-HIGH-003 (B): Retry toast. Offline copy is more optimistic
      // because the user's connection — not the server — is the
      // likely cause and Option B's OfflineBanner already tells them.
      toast.error(
        isOffline()
          ? "You're offline — XP will save when you reconnect."
          : "Couldn't save XP.",
        {
          duration: 8000,
          action: {
            label: 'Retry',
            onClick: () => mutateRef.current?.(variables),
          },
        }
      );
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

  // Populate the retry-ref so the toast action can re-mutate. React
  // guarantees mutation.mutate is stable across renders.
  mutateRef.current = mutation.mutate;

  return mutation;
}

// v2 [ENH]: Optimistic streak update
// STATE-HIGH-002 (C): Adds Retry-action toast on error in addition to
// the pre-existing optimistic-update + rollback.
export function useUpdateStreak() {
  const qc = useQueryClient();
  const { activeChild } = useChildStore();

  const mutateRef = useRef<((childId: string) => void) | null>(null);

  const mutation = useMutation({
    mutationFn: (childId: string) =>
      apiFetch<{ shieldUsed?: boolean }>('/api/gamification/streak', { method: 'POST', body: JSON.stringify({ childId }) }),

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

    onError: (_err, variables, context) => {
      if (context?.previousChild) {
        useChildStore.getState().setActiveChild(context.previousChild);
      }
      toast.error(
        isOffline()
          ? "You're offline — streak will save when you reconnect."
          : "Couldn't update streak.",
        {
          duration: 8000,
          action: {
            label: 'Retry',
            onClick: () => mutateRef.current?.(variables),
          },
        },
      );
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

  mutateRef.current = mutation.mutate;
  return mutation;
}

// Get badges for a child
export function useBadges(childId: string) {
  return useQuery({
    queryKey: ['badges', childId],
    queryFn: () => apiFetch<{ badges: Array<{ id: string; name: string; icon: string; description: string; rarity: string; earned: boolean; category: string }> }>(`/api/gamification/badges?childId=${childId}`),
    enabled: !!childId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Check for new badges after an action
// STATE-HIGH-002 (C): No optimistic update — badges are server-determined
// (we don't know which will trigger). But we do surface errors via a
// retry-action toast so a transient failure doesn't silently lose a
// badge earn.
export function useCheckBadges() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();
  const mutateRef = useRef<((childId: string) => void) | null>(null);

  const mutation = useMutation({
    mutationFn: (childId: string) =>
      apiFetch<{ newBadges: Array<{ id: string; name: string; icon: string; description: string; rarity: string; category: string }> }>('/api/gamification/badges', { method: 'POST', body: JSON.stringify({ childId }) }),
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
    onError: (_err, variables) => {
      toast.error(
        isOffline()
          ? "You're offline — we'll check for new badges when you reconnect."
          : "Couldn't check for new badges.",
        {
          duration: 8000,
          action: {
            label: 'Retry',
            onClick: () => mutateRef.current?.(variables),
          },
        },
      );
    },
  });

  mutateRef.current = mutation.mutate;
  return mutation;
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

    // Step 2: Award XP (triggers celebration).
    // API-HIGH-003 (C): for source='game' the server ignores `amount`
    // and looks up the canonical reward from GAME_XP_REWARDS using
    // `gameId`. We forward contentId as gameId since games identify
    // themselves by their slug (e.g., 'ai-spy').
    await awardXP.mutateAsync({
      childId,
      source,
      gameId: source === 'game' ? contentId : undefined,
      amount: source === 'game' ? undefined : xpAmount,
    });

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
