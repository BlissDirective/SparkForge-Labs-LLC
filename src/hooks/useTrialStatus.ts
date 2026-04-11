// ════════════════════════════════════════════════════
// useTrialStatus — Client-side trial state
// v3 Gap 2: Fetches /api/auth/me, computes remaining
// time every second so the TrialBanner counts down live.
// ════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  getTrialDaysRemaining,
  getTrialMsRemaining,
  type SubscriptionTier,
} from '@/lib/tier-config';

interface MeResponse {
  id: string;
  email: string;
  fullName: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  subscriptionPeriodEnd: string | null;
}

export interface TrialStatus {
  /** True while fetching the parent profile for the first time. */
  loading: boolean;
  /** True when trial_ends_at is in the future. */
  isInTrial: boolean;
  /** Whole days remaining (rounded up). */
  daysRemaining: number;
  /** Milliseconds remaining (updated every second). */
  msRemaining: number;
  /** True when < 2 days remain — drives red "urgent" state. */
  isUrgent: boolean;
  /** ISO string of when the trial ends, or null. */
  trialEndsAt: string | null;
  /** Tier the user is on while trialing. */
  tier: SubscriptionTier;
}

export function useTrialStatus(): TrialStatus {
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<MeResponse>('/api/auth/me'),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const trialEndsAt = data?.trialEndsAt ?? null;
  const tier = data?.subscriptionTier ?? 'free';

  // Live countdown — ticks every second while a trial is active.
  const [msRemaining, setMsRemaining] = useState(() => getTrialMsRemaining(trialEndsAt));

  useEffect(() => {
    if (!trialEndsAt) {
      setMsRemaining(0);
      return;
    }
    setMsRemaining(getTrialMsRemaining(trialEndsAt));
    const id = setInterval(() => {
      setMsRemaining(getTrialMsRemaining(trialEndsAt));
    }, 1000);
    return () => clearInterval(id);
  }, [trialEndsAt]);

  const isInTrial = msRemaining > 0;
  const daysRemaining = getTrialDaysRemaining(trialEndsAt);
  const isUrgent = isInTrial && msRemaining < 2 * 24 * 60 * 60 * 1000;

  return {
    loading: isLoading,
    isInTrial,
    daysRemaining,
    msRemaining,
    isUrgent,
    trialEndsAt,
    tier,
  };
}
