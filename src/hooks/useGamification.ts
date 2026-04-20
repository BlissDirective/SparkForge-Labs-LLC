import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useChildStore } from '@/stores/childStore';
import { useToastStore, toast } from '@/stores/toastStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import type { Child } from '@/types';

// ════════════════════════════════════════════════════════════════
// STATE-MED-001 (B-full/T5b): Gamification optimistic updates now
// mutate the React Query `['children']` cache instead of
// childStore.activeChild. Previously, both stores held their own
// copy of the XP/level/streak values and would desync after a
// refetchOnWindowFocus (T5a tightened) pulled fresh server data
// that didn't yet reflect the in-flight award.
//
// After T5b, the React Query cache is the single source of truth —
// useActiveChild() reads from it, this hook writes to it, and the
// server refetch reconciles. childStore is only touched on rollback
// for back-compat until T5c strips it to UI-only.
// ════════════════════════════════════════════════════════════════

/**
 * Apply a partial update to the active child in the React Query cache.
 * Returns a snapshot of the previous children list so onError can
 * roll back cleanly.
 */
function patchActiveChildInCache(
  qc: ReturnType<typeof useQueryClient>,
  activeChildId: string | null | undefined,
  patch: (child: Child) => Child,
): Child[] | undefined {
  if (!activeChildId) return undefined;
  const prev = qc.getQueryData<Child[]>(['children']);
  if (!prev) return undefined;
  const next = prev.map((c) => (c.id === activeChildId ? patch(c) : c));
  qc.setQueryData<Child[]>(['children'], next);
  return prev;
}

// UX-HIGH-003 (B): helper for offline-vs-network-error copy
function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// v2 [ENH]: Optimistic XP update — shows instant feedback
// STATE-MED-001 (B-full/T5b): Optimistic update mutates the React
// Query cache, NOT childStore. See file header for rationale.
export function useAwardXP() {
  const qc = useQueryClient();
  const { triggerCelebration } = useUIStore();
  const activeChildId = useChildStore((s) => s.activeChildId);

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

    // STATE-MED-001 (B-full/T5b): patch the React Query cache instead
    // of childStore. onSettled invalidation reconciles with the
    // authoritative server value.
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: ['children'] });
      await qc.cancelQueries({ queryKey: ['progress'] });

      const optimistic = variables.amount ?? 25;
      const previousChildren = patchActiveChildInCache(
        qc,
        activeChildId,
        (c) => ({ ...c, xp: c.xp + optimistic }),
      );

      return { previousChildren };
    },

    onError: (_err, variables, context) => {
      // STATE-MED-001 (B-full/T5b): rollback by restoring the prior
      // React Query cache snapshot.
      if (context?.previousChildren) {
        qc.setQueryData<Child[]>(['children'], context.previousChildren);
      }
      // UX-HIGH-003 (B): Retry toast.
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
      // STATE-MED-001 (B-full/T5b): invalidate BOTH the children list
      // (so React Query refetches fresh XP / level / streak) AND the
      // progress list. Children invalidation is what propagates the
      // server-authoritative XP back to all useActiveChild() consumers.
      qc.invalidateQueries({ queryKey: ['children'] });
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
// STATE-MED-001 (B-full/T5b): Optimistic update mutates the React
// Query cache, NOT childStore.
export function useUpdateStreak() {
  const qc = useQueryClient();
  const activeChildId = useChildStore((s) => s.activeChildId);

  const mutateRef = useRef<((childId: string) => void) | null>(null);

  const mutation = useMutation({
    mutationFn: (childId: string) =>
      apiFetch<{ shieldUsed?: boolean }>('/api/gamification/streak', { method: 'POST', body: JSON.stringify({ childId }) }),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['children'] });
      const previousChildren = patchActiveChildInCache(
        qc,
        activeChildId,
        (c) => ({ ...c, streak_count: c.streak_count + 1 }),
      );
      return { previousChildren };
    },

    onError: (_err, variables, context) => {
      if (context?.previousChildren) {
        qc.setQueryData<Child[]>(['children'], context.previousChildren);
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
      // STATE-MED-001 (B-full/T5b): also invalidate ['children'] so
      // useActiveChild() picks up the server-authoritative streak.
      qc.invalidateQueries({ queryKey: ['children'] });
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
// UX-MED-001 (A): drives the gameStore.saveState lifecycle that
// SaveIndicator3D renders. Sets 'saving' at start, 'saved' on
// success (with 1500ms auto-fade to 'idle'), 'error' on any failure.
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
    // Lazy import to avoid pulling gameStore into lesson/spark-fact
    // non-game paths at module init. getState() is safe here.
    const { useGameStore } = await import('@/stores/gameStore');
    const setSaveState = useGameStore.getState().setSaveState;

    setSaveState('saving');
    try {
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

      // All four pipeline steps succeeded — flash 'saved' then fade.
      setSaveState('saved');
      setTimeout(() => {
        // Guard: only reset if nothing else moved us into 'saving' or
        // 'error' in the meantime (e.g. an immediate next mutation).
        if (useGameStore.getState().saveState === 'saved') {
          setSaveState('idle');
        }
      }, 1500);
    } catch (err) {
      setSaveState('error');
      throw err;
    }
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
