// DB-ENH-002 (Recommended): Realtime child progress + XP sync
//
// Subscribes to Supabase Realtime for one child's progress and row
// updates, then invalidates the corresponding React Query caches so
// any component displaying that data re-fetches.
//
// Usage:
//   useRealtimeChildSync(childId);              // single child
//   useRealtimeChildrenSync([id1, id2, id3]);   // parent dashboard
//
// The hook is a no-op when childId is empty, when Supabase URL is
// not configured (SSR + build), or when the user lacks read access
// (RLS silently suppresses the notification).

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient as createSupabaseBrowser } from '@/lib/supabase/client';
import {
  subscribeToChildProgress,
  subscribeToChildRow,
} from '@/lib/realtime/channels';

export function useRealtimeChildSync(childId: string | null | undefined): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!childId) return;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createSupabaseBrowser();

    const progressChannel = subscribeToChildProgress(supabase, childId, () => {
      void qc.invalidateQueries({ queryKey: ['progress', childId] });
      void qc.invalidateQueries({ queryKey: ['progress', 'lab'] });
      void qc.invalidateQueries({ queryKey: ['progress', 'all-labs', childId] });
    });

    const rowChannel = subscribeToChildRow(supabase, childId, () => {
      void qc.invalidateQueries({ queryKey: ['children'] });
      void qc.invalidateQueries({ queryKey: ['child', childId] });
      void qc.invalidateQueries({ queryKey: ['xp', childId] });
    });

    void progressChannel.subscribe();
    void rowChannel.subscribe();

    return () => {
      void supabase.removeChannel(progressChannel);
      void supabase.removeChannel(rowChannel);
    };
  }, [childId, qc]);
}

export function useRealtimeChildrenSync(
  childIds: readonly string[] | null | undefined,
): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!childIds || childIds.length === 0) return;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createSupabaseBrowser();
    const channels = childIds.flatMap((id) => [
      subscribeToChildProgress(supabase, id, () => {
        void qc.invalidateQueries({ queryKey: ['progress', id] });
        void qc.invalidateQueries({ queryKey: ['progress', 'all-labs', id] });
      }),
      subscribeToChildRow(supabase, id, () => {
        void qc.invalidateQueries({ queryKey: ['children'] });
        void qc.invalidateQueries({ queryKey: ['child', id] });
      }),
    ]);

    channels.forEach((c) => {
      void c.subscribe();
    });

    return () => {
      channels.forEach((c) => {
        void supabase.removeChannel(c);
      });
    };
    // childIds reference equality drives re-subscription. Callers
    // should memoize the array upstream.
  }, [childIds, qc]);
}
