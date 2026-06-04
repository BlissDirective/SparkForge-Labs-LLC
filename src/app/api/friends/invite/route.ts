// ════════════════════════════════════════════════════
// POST /api/friends/invite — generate a shareable invite code
// ════════════════════════════════════════════════════
// COPPA: connections are made via codes, never by searching names.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { generateInviteCode, inviteExpiry, isValidInviteCodeShape } from '@/lib/social/SocialEngine';

const Schema = z.object({ childId: z.string().uuid() });

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
  if (!parsed.success) return apiError('childId required', 400);

  const { childId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    // Reuse an existing un-redeemed, un-expired code if present.
    const nowIso = new Date().toISOString();
    const { data: existing } = await supabase
      .from('friend_invite_codes')
      .select('*')
      .eq('child_id', childId)
      .eq('redeemed', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return apiSuccess({ code: existing.code, expiresAt: existing.expires_at, reused: true });
    }

    // Generate a unique code (retry a few times on collision).
    let code = '';
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = generateInviteCode();
      if (!isValidInviteCodeShape(candidate)) continue;
      const { data: clash } = await supabase
        .from('friend_invite_codes')
        .select('code')
        .eq('code', candidate)
        .maybeSingle();
      if (!clash) {
        code = candidate;
        break;
      }
    }
    if (!code) return apiError('Could not allocate code, try again', 503);

    const expiresAt = inviteExpiry(nowIso);
    const { error } = await supabase.from('friend_invite_codes').insert({
      code,
      child_id: childId,
      redeemed: false,
      created_at: nowIso,
      expires_at: expiresAt,
    });
    if (error) {
      console.error('[friends:invite:insert]', error);
      return apiError('Failed to create code', 500);
    }

    return apiSuccess({ code, expiresAt, reused: false });
  } catch (err) {
    console.error('[friends:invite]', err);
    return apiError('Failed to create invite', 500);
  }
}
