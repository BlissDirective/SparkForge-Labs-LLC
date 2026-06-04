// ════════════════════════════════════════════════════
// useFriends — Study Buddies (friend) management hook
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiFetchResponse } from '@/lib/api';
import {
  FRIEND_LIMIT,
  countActiveFriends,
  type FriendConnection,
  type ParentApproval,
} from '@/lib/social/SocialEngine';

export interface UseFriendsReturn {
  connections: FriendConnection[];
  pendingApprovals: ParentApproval[];
  activeFriends: FriendConnection[];
  activeCount: number;
  limit: number;
  canAddMore: boolean;
  isLoading: boolean;
  error: string | null;
  generateInvite: () => Promise<{ code: string; expiresAt: string } | null>;
  redeemCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  decideApproval: (connectionId: string, decision: 'approve' | 'decline') => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useFriends(childId: string | null): UseFriendsReturn {
  const [connections, setConnections] = useState<FriendConnection[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ParentApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!childId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetchResponse(`/api/friends?childId=${childId}`);
      const data = await res.json();
      if (data.success) {
        setConnections(data.data.connections ?? []);
        setPendingApprovals(data.data.pendingApprovals ?? []);
      } else {
        setError(data.error ?? 'Failed to load friends');
      }
    } catch {
      setError('Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const generateInvite = useCallback(async () => {
    if (!childId) return null;
    try {
      const res = await apiFetchResponse('/api/friends/invite', {
        method: 'POST',
        body: JSON.stringify({ childId }),
      });
      const data = await res.json();
      if (data.success) return { code: data.data.code, expiresAt: data.data.expiresAt };
      return null;
    } catch {
      return null;
    }
  }, [childId]);

  const redeemCode = useCallback(
    async (code: string) => {
      if (!childId) return { ok: false, message: 'No active child' };
      try {
        const res = await apiFetchResponse('/api/friends', {
          method: 'POST',
          body: JSON.stringify({ childId, code }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchFriends();
          return { ok: true, message: data.data.message ?? 'Request sent!' };
        }
        return { ok: false, message: data.error ?? 'Could not use that code' };
      } catch {
        return { ok: false, message: 'Could not use that code' };
      }
    },
    [childId, fetchFriends],
  );

  const decideApproval = useCallback(
    async (connectionId: string, decision: 'approve' | 'decline') => {
      if (!childId) return false;
      try {
        const res = await apiFetchResponse('/api/friends/approve', {
          method: 'POST',
          body: JSON.stringify({ childId, connectionId, decision }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchFriends();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [childId, fetchFriends],
  );

  const activeFriends = useMemo(
    () => connections.filter((c) => c.status === 'active'),
    [connections],
  );
  const activeCount = useMemo(() => countActiveFriends(connections), [connections]);

  return {
    connections,
    pendingApprovals,
    activeFriends,
    activeCount,
    limit: FRIEND_LIMIT,
    canAddMore: activeCount < FRIEND_LIMIT,
    isLoading,
    error,
    generateInvite,
    redeemCode,
    decideApproval,
    refresh: fetchFriends,
  };
}
