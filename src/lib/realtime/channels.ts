// DB-ENH-002 (Recommended): Supabase Realtime channel factory
//
// Strongly-typed channel helpers so subscribers don't reach into the
// raw supabase-js API. Each factory returns a RealtimeChannel that
// the caller subscribes to and cleans up on unmount.

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { createClient } from '@/lib/supabase/client';

type SupabaseBrowser = ReturnType<typeof createClient>;

export type ProgressEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface ProgressChangePayload {
  event: ProgressEvent;
  childId: string;
  contentId: string;
  completed: boolean;
  score: number | null;
}

export interface ChildChangePayload {
  event: 'UPDATE';
  childId: string;
  xp: number | null;
  streakCount: number | null;
}

/**
 * Subscribe to row-level changes on `progress` filtered to a single
 * child. RLS still applies — the caller's session must have
 * permission to read the child's progress.
 */
export function subscribeToChildProgress(
  supabase: SupabaseBrowser,
  childId: string,
  onChange: (payload: ProgressChangePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`child-progress:${childId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'progress',
        filter: `child_id=eq.${childId}`,
      },
      (msg) => {
        const row = (msg.new ?? msg.old) as Record<string, unknown> | undefined;
        if (!row) return;
        onChange({
          event: msg.eventType as ProgressEvent,
          childId: row.child_id as string,
          contentId: row.content_id as string,
          completed: Boolean(row.completed),
          score: typeof row.score === 'number' ? row.score : null,
        });
      },
    );
  return channel;
}

/**
 * Subscribe to UPDATEs on the `children` row for a single child.
 * Fires on XP award, streak increment, streak shield toggle, etc.
 */
export function subscribeToChildRow(
  supabase: SupabaseBrowser,
  childId: string,
  onChange: (payload: ChildChangePayload) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`child-row:${childId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'children',
        filter: `id=eq.${childId}`,
      },
      (msg) => {
        const row = msg.new as Record<string, unknown> | undefined;
        if (!row) return;
        onChange({
          event: 'UPDATE',
          childId: row.id as string,
          xp: typeof row.xp === 'number' ? row.xp : null,
          streakCount:
            typeof row.streak_count === 'number' ? row.streak_count : null,
        });
      },
    );
  return channel;
}
