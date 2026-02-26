// POST /api/sessions — Start or end a play session
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { StartSessionSchema, EndSessionSchema } from '@/lib/validations';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const body = await req.json();
  const action = body.action;

  if (action === 'start') {
    const result = StartSessionSchema.safeParse(body);
    if (!result.success) return apiError('Invalid request', 400);

    const { childId } = result.data;

    if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('sessions')
      .insert({ child_id: childId })
      .select()
      .single();

    if (error) return apiError('Failed to start session', 500);

    return apiSuccess(data, 201);
  }

  if (action === 'end') {
    const result = EndSessionSchema.safeParse(body);
    if (!result.success) return apiError('Invalid request', 400);

    const { sessionId } = result.data;

    const supabase = createServerSupabase();

    const { data: session } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single();

    if (!session) return apiError('Session not found', 404);

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
