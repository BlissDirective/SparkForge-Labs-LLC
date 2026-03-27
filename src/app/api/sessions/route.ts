// POST /api/sessions — Start or end a play session
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

// Combined schema validates action + conditional fields
const SessionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), childId: z.string().uuid() }),
  z.object({ action: z.literal('end'), sessionId: z.string().uuid() }),
]);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, SessionSchema);
  if (!parsed.success) return parsed.response;

  const body = parsed.data;
  const supabase = await createServerSupabase();

  if (body.action === 'start') {
    const { childId } = body;

    if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

    const { data, error } = await supabase
      .from('sessions')
      .insert({ child_id: childId })
      .select()
      .single();

    if (error) return apiError('Failed to start session', 500);

    return apiSuccess(data, 201);
  }

  if (body.action === 'end') {
    const { sessionId } = body;

    const { data: session } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single();

    if (!session) return apiError('Session not found', 404);

    // S2-HIGH-001: Verify the session's child belongs to the authenticated parent
    if (!(await verifyChildOwnership(auth.user.id, session.child_id))) {
      return apiError('Session not found', 404);
    }

    const duration = Math.floor(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    );

    const { data, error } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) return apiError('Failed to end session', 500);

    return apiSuccess(data);
  }

  return apiError('Invalid action. Use "start" or "end".', 400);
}
