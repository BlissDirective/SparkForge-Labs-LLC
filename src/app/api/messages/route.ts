// ════════════════════════════════════════════════════
// GET  /api/messages  — communication history (parent-visible)
// POST /api/messages  — send a PRESET message to an active buddy
// ════════════════════════════════════════════════════
// COPPA: only server-catalog template ids may be sent. No free-form
// text ever reaches this route — the body carries a templateId, and
// the delivered text is looked up server-side from the catalog.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { getMessageTemplate, isMessageAllowed } from '@/lib/social/SocialEngine';

// ─── GET: history between a child and a buddy (or all for the child) ───
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const url = new URL(req.url);
  const childId = url.searchParams.get('childId');
  const buddyId = url.searchParams.get('buddyId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    let query = supabase
      .from('safe_messages')
      .select('*')
      .or(`from_child_id.eq.${childId},to_child_id.eq.${childId}`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (buddyId) {
      query = supabase
        .from('safe_messages')
        .select('*')
        .or(
          `and(from_child_id.eq.${childId},to_child_id.eq.${buddyId}),and(from_child_id.eq.${buddyId},to_child_id.eq.${childId})`,
        )
        .order('created_at', { ascending: false })
        .limit(100);
    }

    const { data: rows } = await query;

    return apiSuccess({
      messages: (rows ?? []).map((m) => ({
        id: m.id,
        fromChildId: m.from_child_id,
        toChildId: m.to_child_id,
        templateId: m.template_id,
        text: m.text,
        emoji: m.emoji,
        createdAt: m.created_at,
        reported: m.reported,
        outgoing: m.from_child_id === childId,
      })),
    });
  } catch (err) {
    console.error('[messages:get]', err);
    return apiError('Failed to fetch messages', 500);
  }
}

// ─── POST: send a preset message ───
const SendSchema = z.object({
  childId: z.string().uuid(),
  buddyId: z.string().uuid(),
  templateId: z.string().min(1).max(64),
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
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return apiError('childId, buddyId and templateId required', 400);

  const { childId, buddyId, templateId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  // The single COPPA gate: templateId must be in the server catalog.
  if (!isMessageAllowed(templateId)) {
    return apiError('Message not allowed', 422, 'TEMPLATE_NOT_ALLOWED');
  }
  const template = getMessageTemplate(templateId)!;

  const supabase = await createServerSupabase();

  try {
    // Only allow sending to an ACTIVE (mutually parent-approved) buddy.
    const { data: conn } = await supabase
      .from('friend_connections')
      .select('status')
      .eq('child_id', childId)
      .eq('buddy_id', buddyId)
      .single();

    if (!conn || conn.status !== 'active') {
      return apiError('You can only message active buddies', 403);
    }

    const { data: inserted, error } = await supabase
      .from('safe_messages')
      .insert({
        from_child_id: childId,
        to_child_id: buddyId,
        template_id: templateId,
        text: template.text,
        emoji: template.emoji,
        reported: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[messages:send:insert]', error);
      return apiError('Failed to send message', 500);
    }

    return apiSuccess({
      id: inserted.id,
      text: template.text,
      emoji: template.emoji,
      createdAt: inserted.created_at,
    });
  } catch (err) {
    console.error('[messages:send]', err);
    return apiError('Failed to send message', 500);
  }
}
