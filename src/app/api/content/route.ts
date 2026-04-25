// GET /api/content — Fetch published content with filters
//
// AUTH SCOPE: requireAuth (authed parent OR demo/anon user). Content
// listings are intentionally readable by any signed-in user, including
// free-tier and demo sessions — `isLabAccessible` handles per-tier
// gating below.
//
// API-MED-003 (B): content-read rate limit (100/min per user/IP) caps
// scrape-by-authed-user behaviour. Legitimate clients issue far fewer
// requests per minute even when paginating; anything past 100/min is
// almost certainly automated harvesting.
//
// v2 [ENH]: Added Cache-Control: 5 minute cache
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { ContentQuerySchema } from '@/lib/validations';
import {
  apiSuccess,
  apiError,
  parseQuery,
  requireAuth,
  applyRateLimit,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isLabAccessible } from '@/lib/tier-config';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // API-MED-003 (B): cap content reads at 100/min per user to deter
  // scraping. Demo users count against the same bucket by user.id.
  const limited = await applyRateLimit(
    req,
    'content-read',
    auth.user.id,
    RATE_LIMITS.contentRead,
  );
  if (limited) return limited;

  const parsed = parseQuery(req, ContentQuerySchema);
  if (!parsed.success) return parsed.response;

  const { world, ageBand, type, gameSlug, limit = 20, offset = 0 } = parsed.data;

  if (world) {
    const access = isLabAccessible(auth.user.tier, world);
    if (access === 'locked') {
      return apiError('This lab requires a subscription upgrade', 403, 'TIER_LIMIT');
    }
  }

  const supabase = await createServerSupabase();
  let query = supabase
    .from('content')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  if (world) query = query.eq('world', world);
  if (ageBand) query = query.eq('target_age_band', ageBand);

  // Phase 1: Support comma-separated type filters (e.g., 'game_scenario,game_challenge')
  if (type) {
    const types = type.split(',').map(t => t.trim()).filter(Boolean);
    if (types.length === 1) {
      query = query.eq('type', types[0]);
    } else if (types.length > 1) {
      query = query.in('type', types);
    }
  }

  // Phase 2: Filter by game slug (stored in game_config->game_type or content_body metadata)
  if (gameSlug) {
    query = query.contains('game_config', { game_type: gameSlug });
  }

  const { data, count, error } = await query;

  if (error) return apiError('Failed to fetch content', 500);

  // v2 [ENH]: Cache-Control header for content
  const response = apiSuccess({ data: data || [], total: count || 0, limit, offset });
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return response;
}
