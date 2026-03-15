// GET /api/progress/world — Get lab progress using DB function
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { LabProgressSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseQuery, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = parseQuery(req, LabProgressSchema);
  if (!parsed.success) return parsed.response;

  const { childId, world } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('age_band').eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  const { data, error } = await supabase.rpc('get_lab_progress', {
    p_child_id: childId, p_world: world, p_age_band: child.age_band,
  });

  if (error) return apiError('Failed to fetch lab progress', 500);

  const result = data?.[0] || { total_items: 0, completed_items: 0, percent: 0 };

  return apiSuccess({
    labId: world,
    totalItems: result.total_items,
    completedItems: result.completed_items,
    percent: result.percent,
  });
}
