// GET /api/progress — Fetch progress for a child
// POST /api/progress — Create/update progress record
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CompleteContentSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('progress')
    .select('*, content:content_id(title, type, world, xp_reward)')
    .eq('child_id', childId)
    .order('updated_at', { ascending: false });

  if (error) return apiError('Failed to fetch progress', 500);

  return apiSuccess(data || []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CompleteContentSchema);
  if (!parsed.success) return parsed.response;

  const { childId, contentId, score, timeSpentSeconds } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('progress')
    .upsert({
      child_id: childId,
      content_id: contentId,
      completed: true,
      score: score || null,
      time_spent_seconds: timeSpentSeconds,
      completed_at: new Date().toISOString(),
      attempts: 1,
    }, { onConflict: 'child_id,content_id' })
    .select()
    .single();

  if (error) return apiError('Failed to record progress', 500);

  return apiSuccess(data, 201);
}
