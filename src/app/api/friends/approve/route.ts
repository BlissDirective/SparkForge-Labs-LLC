// ════════════════════════════════════════════════════
// POST /api/friends/approve — parent approves/declines a connection
// ════════════════════════════════════════════════════
// Every friend connection requires explicit parent approval on BOTH
// sides before it becomes active (COPPA).

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { resolveConnectionStatus } from '@/lib/social/SocialEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  connectionId: z.string().uuid(),
  decision: z.enum(['approve', 'decline']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId, connectionId and decision required', 400);

  const { childId, connectionId, decision } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    // Load this side's connection row; confirm it belongs to the child.
    const { data: conn } = await supabase
      .from('friend_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('child_id', childId)
      .single();

    if (!conn) return apiError('Connection not found', 404);

    const now = new Date().toISOString();

    if (decision === 'decline') {
      // Decline both directions and close out approvals.
      await supabase
        .from('friend_connections')
        .update({ status: 'declined', parent_approved: false, updated_at: now })
        .eq('pair_key', conn.pair_key);
      await supabase
        .from('parent_approvals')
        .update({ decision: 'decline', decided_at: now })
        .eq('connection_id', connectionId);
      return apiSuccess({ status: 'declined' });
    }

    // Approve THIS side.
    await supabase
      .from('friend_connections')
      .update({ parent_approved: true, updated_at: now })
      .eq('id', connectionId);
    await supabase
      .from('parent_approvals')
      .update({ decision: 'approve', decided_at: now })
      .eq('connection_id', connectionId);

    // Re-read both direction rows to compute combined status.
    const { data: pair } = await supabase
      .from('friend_connections')
      .select('id, child_id, parent_approved')
      .eq('pair_key', conn.pair_key);

    const mine = (pair ?? []).find((p) => p.child_id === childId);
    const theirs = (pair ?? []).find((p) => p.child_id !== childId);
    const status = resolveConnectionStatus(
      mine?.parent_approved ?? false,
      theirs?.parent_approved ?? false,
    );

    // Apply the resolved status to both rows.
    await supabase
      .from('friend_connections')
      .update({ status, updated_at: now })
      .eq('pair_key', conn.pair_key);

    return apiSuccess({ status });
  } catch (err) {
    console.error('[friends:approve]', err);
    return apiError('Failed to update approval', 500);
  }
}
