'use client';

// DB-ENH-002 (Recommended): Realtime fan-out for a parent's children.
//
// Mounted once at the dashboard layout level. Reads the current
// authenticated user's children (via React Query's `useChildren`) and
// opens Supabase Realtime subscriptions for every child row + their
// progress rows. Any change invalidates the corresponding cache keys
// so every downstream view re-fetches without polling.
//
// Demo users: useChildren returns an empty array; the effect is a
// no-op. Parent users with no children: also a no-op until a child is
// added (useChildren cache invalidation picks them up automatically).

import { useMemo } from 'react';
import { useChildren } from '@/hooks/useChildren';
import { useRealtimeChildrenSync } from '@/hooks/useRealtimeChildSync';

export function RealtimeChildrenBridge() {
  const { data: children } = useChildren();
  // Memoize the id array by reference so useRealtimeChildrenSync's
  // dep check doesn't re-subscribe on every render when the set
  // is unchanged.
  const childIds = useMemo(
    () => (children ?? []).map((c) => c.id),
    [children],
  );
  useRealtimeChildrenSync(childIds);
  return null;
}
