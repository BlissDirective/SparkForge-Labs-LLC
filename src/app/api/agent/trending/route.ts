// ════════════════════════════════════════════════════
// TRENDING PIPELINE — Standalone trending research + scenario generation
// Phase 3: Runs independently from main content pipeline
// Admin-only manual trigger OR weekly cron
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, applyRateLimit } from '@/lib/api-helpers';
import { runTrendingPipeline } from '@/lib/agent/pipeline';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// POST: Admin-triggered trending research
export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'trending-run', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Trending pipeline not configured. Add ANTHROPIC_API_KEY to .env.local.',
      503,
      'AGENT_NOT_CONFIGURED'
    );
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiError('Unauthorized', 401, 'AUTH_REQUIRED');

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return apiError('Admin access required', 403, 'FORBIDDEN');
  }

  try {
    const result = await runTrendingPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(`Trending pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}

// GET: Cron-triggered trending research (weekly)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return apiError('CRON_SECRET required in production', 500, 'CONFIG_ERROR');
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', 401, 'AUTH_REQUIRED');
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiSuccess({ skipped: true, reason: 'ANTHROPIC_API_KEY not configured' });
  }

  if (process.env.ENABLE_CONTENT_AGENT === 'false') {
    return apiSuccess({ skipped: true, reason: 'Content agent disabled' });
  }

  try {
    const result = await runTrendingPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Trending cron failed:', message);
    return apiError(`Trending pipeline failed: ${message}`, 500, 'SERVER_ERROR');
  }
}
