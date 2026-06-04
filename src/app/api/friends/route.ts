// ════════════════════════════════════════════════════
// GET  /api/friends   — list a child's buddy connections
// POST /api/friends   — redeem an invite code to connect
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import {
  FRIEND_LIMIT,
  countActiveFriends,
  canAddFriend,
  alreadyConnected,
  normalizeInviteCode,
  isValidInviteCodeShape,
  isInviteExpired,
  type FriendConnection,
} from '@/lib/social/SocialEngine';

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

interface ConnRow {
  id: string;
  child_id: string;
  buddy_id: string;
  status: FriendConnection['status'];
  parent_approved: boolean;
  created_at: string;
  updated_at: string;
}

// ─── GET ───
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = new URL(req.url).searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = createAdminClient();

  try {
    const { data: connRows } = await supabase
      .from('friend_connections')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });

    // Resolve buddy display names + avatars (COPPA-safe pseudonyms only).
    const buddyIds = [...new Set((connRows ?? []).map((c) => c.buddy_id))];
    const nameMap = new Map<string, { name: string; avatar: string }>();
    if (buddyIds.length > 0) {
      const { data: buddies } = await supabase
        .from('children')
        .select('id, display_name')
        .in('id', buddyIds);
      for (const b of buddies ?? []) {
        nameMap.set(b.id, { name: b.display_name ?? 'Buddy', avatar: 'happy' });
      }
    }

    const connections: FriendConnection[] = (connRows ?? []).map((r: ConnRow) => ({
      id: r.id,
      childId: r.child_id,
      buddyId: r.buddy_id,
      buddyDisplayName: nameMap.get(r.buddy_id)?.name ?? 'Buddy',
      buddyAvatar: nameMap.get(r.buddy_id)?.avatar ?? 'happy',
      status: r.status,
      parentApproved: r.parent_approved,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // Pending parent approvals for this child.
    const { data: approvals } = await supabase
      .from('parent_approvals')
      .select('*')
      .eq('child_id', childId)
      .is('decision', null)
      .order('created_at', { ascending: false });

    return apiSuccess({
      connections,
      pendingApprovals: (approvals ?? []).map((a) => ({
        id: a.id,
        connectionId: a.connection_id,
        childId: a.child_id,
        buddyDisplayName: a.buddy_display_name,
        buddyAvatar: a.buddy_avatar,
        decision: a.decision,
        createdAt: a.created_at,
      })),
      activeCount: countActiveFriends(connections),
      limit: FRIEND_LIMIT,
      canAddMore: canAddFriend(connections),
    });
  } catch (err) {
    console.error('[friends:get]', err);
    return apiError('Failed to fetch friends', 500);
  }
}

// ─── POST: redeem invite code ───
const RedeemSchema = z.object({
  childId: z.string().uuid(),
  code: z.string().min(8).max(12),
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
  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) return apiError('childId and code required', 400);

  const { childId } = parsed.data;
  const code = normalizeInviteCode(parsed.data.code);
  if (!isValidInviteCodeShape(code)) return apiError('Invalid code format', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = createAdminClient();

  try {
    // Look up the invite.
    const { data: invite } = await supabase
      .from('friend_invite_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (!invite) return apiError('Code not found', 404);
    if (invite.redeemed) return apiError('Code already used', 409);
    if (isInviteExpired({ expiresAt: invite.expires_at })) return apiError('Code expired', 410);
    if (invite.child_id === childId) return apiError('Cannot connect to yourself', 400);

    const buddyId: string = invite.child_id;

    // Enforce friend limit + no duplicate connection.
    const { data: myConns } = await supabase
      .from('friend_connections')
      .select('*')
      .eq('child_id', childId);

    const myConnections: FriendConnection[] = (myConns ?? []).map((r: ConnRow) => ({
      id: r.id, childId: r.child_id, buddyId: r.buddy_id, buddyDisplayName: '',
      buddyAvatar: 'happy', status: r.status, parentApproved: r.parent_approved,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));

    if (!canAddFriend(myConnections)) return apiError(`Friend limit (${FRIEND_LIMIT}) reached`, 409);
    if (alreadyConnected(myConnections, buddyId)) return apiError('Already connected', 409);

    const pk = pairKey(childId, buddyId);
    const now = new Date().toISOString();

    // Create both direction rows (pending parent approval on each side).
    const { error: connErr } = await supabase.from('friend_connections').insert([
      { child_id: childId, buddy_id: buddyId, pair_key: pk, status: 'pending_parent', parent_approved: false, created_at: now, updated_at: now },
      { child_id: buddyId, buddy_id: childId, pair_key: pk, status: 'pending_parent', parent_approved: false, created_at: now, updated_at: now },
    ]);
    if (connErr) {
      console.error('[friends:redeem:conn]', connErr);
      return apiError('Failed to create connection', 500);
    }

    // Fetch the freshly-created rows to seed parent approvals.
    const { data: created } = await supabase
      .from('friend_connections')
      .select('id, child_id, buddy_id')
      .eq('pair_key', pk);

    // Resolve display names for the approval cards.
    const ids = [...new Set((created ?? []).map((c) => c.buddy_id))];
    const { data: kids } = await supabase
      .from('children')
      .select('id, display_name')
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    const km = new Map((kids ?? []).map((k) => [k.id, k]));

    if (created && created.length) {
      await supabase.from('parent_approvals').insert(
        created.map((c) => ({
          connection_id: c.id,
          child_id: c.child_id,
          buddy_display_name: km.get(c.buddy_id)?.display_name ?? 'Buddy',
          buddy_avatar: 'happy',
        })),
      );
    }

    // Mark the invite redeemed (single-use).
    await supabase
      .from('friend_invite_codes')
      .update({ redeemed: true, redeemed_by: childId })
      .eq('code', code);

    return apiSuccess({ status: 'pending_parent', message: 'Connection created — awaiting parent approval' });
  } catch (err) {
    console.error('[friends:redeem]', err);
    return apiError('Failed to redeem code', 500);
  }
}
