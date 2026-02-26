// GET /api/content — Fetch published content with filters
// v2 [ENH]: Added Cache-Control: 5 minute cache
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { ContentQuerySchema } from '@/lib/validations';
import { apiSuccess, apiError, parseQuery, requireAuth } from '@/lib/api-helpers';
import { isLabAccessible } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = parseQuery(req, ContentQuerySchema);
  if (!parsed.success) return parsed.response;

  const { world, ageBand, type, limit, offset } = parsed.data;

  if (world) {
    const access = isLabAccessible(auth.user.tier, world);
    if (access === 'locked') {
      return apiError('This lab requires a subscription upgrade', 403, 'TIER_LIMIT');
    }
  }

  const supabase = createServerSupabase();
  let query = supabase
    .from('content')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (world) query = query.eq('world', world);
  if (ageBand) query = query.eq('target_age_band', ageBand);
  if (type) query = query.eq('type', type);

  const { data, count, error } = await query;

  if (error) return apiError('Failed to fetch content', 500);

  // v2 [ENH]: Cache-Control header for content
  const response = NextResponse.json(
    { success: true, data: data || [], total: count || 0, limit, offset },
    { status: 200 }
  );
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return response;
}
