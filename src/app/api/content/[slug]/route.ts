// GET /api/content/:slug — Fetch single content item by slug
//
// AUTH SCOPE: requireAuth; any signed-in user (parent, demo, admin).
// API-MED-003 (B): same 100/min content-read bucket as the listing
// endpoint, identified by user.id so the cap shares with /api/content.
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  requireAuth,
  applyRateLimit,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isLabAccessible } from '@/lib/tier-config';

interface Params { params: Promise<{ slug: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const limited = await applyRateLimit(
    req,
    'content-read',
    auth.user.id,
    RATE_LIMITS.contentRead,
  );
  if (limited) return limited;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return apiError('Content not found', 404);

  const access = isLabAccessible(auth.user.tier, data.world);
  if (access === 'locked') {
    return apiError('This content requires a subscription upgrade', 403, 'TIER_LIMIT');
  }

  if (access === 'preview' && data.sort_order > 1) {
    return apiError('Upgrade to access more content in this lab', 403, 'TIER_LIMIT');
  }

  return apiSuccess(data);
}
