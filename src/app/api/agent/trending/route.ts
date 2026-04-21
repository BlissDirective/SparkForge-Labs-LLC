// ════════════════════════════════════════════════════
// TRENDING PIPELINE — Standalone trending research + scenario generation
// Phase 3: Runs independently from main content pipeline
// Admin-only manual trigger OR weekly cron
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  applyRateLimit,
  requireAdmin,
  sanitizeErrorMessage,
} from '@/lib/api-helpers';
import { runTrendingPipeline } from '@/lib/agent/pipeline';
import { verifyCronBearer } from '@/lib/cron-auth';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// POST: Admin-triggered trending research
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'trending-run', undefined, RATE_LIMITS.contentAgent);
  if (limited) return limited;

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError(
      'Trending pipeline not configured. Add ANTHROPIC_API_KEY to .env.local.',
      503,
      'AGENT_NOT_CONFIGURED'
    );
  }

  // API-CRIT-002 (8B): Centralized admin check via requireAdmin().
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;

  try {
    const result = await runTrendingPipeline();
    return apiSuccess(result);
  } catch (e: unknown) {
    // API-MED-002 (B): log full error; sanitize response.
    console.error('[agent/trending] POST failed:', e);
    return apiError(
      sanitizeErrorMessage(e, 'Trending pipeline failed'),
      500,
      'SERVER_ERROR',
    );
  }
}

// GET: Cron-triggered trending research (weekly)
export async function GET(req: NextRequest) {
  // T17 DEPLOY-MED-003: shared verifyCronBearer helper (timing-safe).
  const denial = verifyCronBearer(req, { routeName: 'agent-trending' });
  if (denial) return denial;

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
    // API-MED-002 (B): log full error; sanitize response.
    console.error('[agent/trending] cron failed:', e);
    return apiError(
      sanitizeErrorMessage(e, 'Trending pipeline failed'),
      500,
      'SERVER_ERROR',
    );
  }
}
