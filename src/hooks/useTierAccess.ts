// ════════════════════════════════════════════════════
// useTierAccess — Client-side tier gating (P1-4 / Phase 4)
// Resolves the parent's subscription tier and derives
// lab/game access from TIER_CONFIG (src/lib/tier-config.ts).
//
// Tier source of truth: React Query ['auth', 'me'] →
// GET /api/auth/me → parents.subscription_tier. This is the
// same query useTrialStatus uses, so the response is shared
// from the cache (no extra network request).
//
// Loading rule: while the tier is unknown we NEVER lock
// content — paying users must not see a flash of lock badges.
// Callers get `isLoading` so they can defer lock UI.
//
// TODO(P2 — server tracking required): the "3 games per week"
// free-tier limit (TIER_CONFIG.free.gamesPerWeek) is NOT
// enforced here. It needs server-side play tracking
// (games played this week per child) before it can be gated —
// client-side counting is trivially bypassed. See canPlayGame()
// in src/lib/tier-config.ts for the intended check.
// ════════════════════════════════════════════════════
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { isLabAccessible, type SubscriptionTier } from '@/lib/tier-config';
import { getGameBySlug, getGamesByLab } from '@/config/gameRegistry';

/** Minimal slice of the /api/auth/me payload this hook consumes. */
interface MeTierResponse {
  subscriptionTier: SubscriptionTier;
}

export type LabAccess = 'full' | 'preview' | 'locked';
export type GameLockReason = 'lab-preview' | 'lab-locked';

const VALID_TIERS: readonly SubscriptionTier[] = ['free', 'plus', 'forge'];

/**
 * Resolve the current parent's subscription tier.
 *
 * Defaults to 'free' when unknown (unauthenticated, error, or
 * unexpected payload), but exposes `isLoading` so UIs can treat
 * content as unlocked while the tier is still being fetched.
 */
export function useTier(): { tier: SubscriptionTier; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    // Same key + fetcher as useTrialStatus → shared cache entry.
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<MeTierResponse>('/api/auth/me'),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const raw = data?.subscriptionTier;
  const tier: SubscriptionTier =
    raw && VALID_TIERS.includes(raw) ? raw : 'free';

  return { tier, isLoading };
}

/**
 * Lab access level for the current tier.
 * - freeLabsAccess → 'full'
 * - previewLabs    → 'preview' (first lesson free)
 * - otherwise      → 'locked'
 * Plus/Forge resolve to 'full' for all labs via TIER_CONFIG.
 * While the tier is loading, access is 'full' (never lock during load).
 */
export function useLabAccess(labId: number): {
  access: LabAccess;
  isLoading: boolean;
} {
  const { tier, isLoading } = useTier();
  if (isLoading) {
    return { access: 'full', isLoading: true };
  }
  return { access: isLabAccessible(tier, labId), isLoading: false };
}

/**
 * Whether a specific game is locked for the current tier.
 *
 * A game is locked when:
 * - its lab is 'preview' AND it is not the FIRST game of that lab
 *   in GAME_REGISTRY order ("first lesson free"), or
 * - its lab is 'locked'.
 *
 * Unknown slugs and the loading window are treated as unlocked
 * (the game page has its own not-found handling, and we never
 * lock content while the tier is loading).
 */
export function useGameAccess(slug: string): {
  locked: boolean;
  reason?: GameLockReason;
  isLoading: boolean;
} {
  const { tier, isLoading } = useTier();

  const game = getGameBySlug(slug);
  if (isLoading || !game) {
    return { locked: false, isLoading };
  }

  const access = isLabAccessible(tier, game.lab);
  if (access === 'full') {
    return { locked: false, isLoading: false };
  }

  if (access === 'preview') {
    const firstInLab = getGamesByLab(game.lab)[0];
    const isFirstLesson = firstInLab?.slug === game.slug;
    return isFirstLesson
      ? { locked: false, isLoading: false }
      : { locked: true, reason: 'lab-preview', isLoading: false };
  }

  return { locked: true, reason: 'lab-locked', isLoading: false };
}
