// GET /api/progress/all-labs — Bulk fetch progress for ALL 10 labs
// v2 [BUG-3]: Replaces 10 individual /progress/world calls with 1 bulk call.
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('age_band').eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  // Fetch all 10 labs in parallel
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i + 1).map(async (world) => {
      const { data } = await supabase.rpc('get_lab_progress', {
        p_child_id: childId, p_world: world, p_age_band: child.age_band,
      });
      const row = data?.[0] || { total_items: 0, completed_items: 0, percent: 0 };
      return {
        labId: world,
        totalItems: Number(row.total_items),
        completedItems: Number(row.completed_items),
        percent: Number(row.percent),
      };
    })
  );

  return apiSuccess(results);
}
