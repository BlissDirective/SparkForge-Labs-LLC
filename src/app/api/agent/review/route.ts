// ════════════════════════════════════════════════════
// CONTENT REVIEW API — GET (fetch queue) + POST (approve/reject)
// v2 [BUG-9C]: Uses createServerSupabase
// v2 [ENH-9C]: Bulk operations via arrays
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, applyRateLimit, requireAdmin } from '@/lib/api-helpers';
import { approveContent, rejectContent } from '@/lib/agent/pipeline';

// v2 [S9-HIGH-002]: Zod schema for review POST body
const ReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  ids: z.array(z.string().uuid()).min(1),
  reason: z.string().optional(),
});

export const runtime = 'nodejs';

// API-CRIT-002 (8B): Admin check is centralized via requireAdmin().
// createServerSupabase() is still used directly because this route needs
// the Supabase client to run admin-scoped queries (content_queue, agent_runs)
// after authentication has succeeded.

// ── GET: Fetch queue items + stats ─────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;
  const supabase = await createServerSupabase();

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending_review';
  const tab = url.searchParams.get('tab');

  // If requesting run history
  if (tab === 'runs') {
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return apiSuccess({ runs: runs || [] });
  }

  // Fetch queue items
  const { data, count } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order('generated_at', { ascending: false })
    .limit(50);

  // Fetch stats — parallel queries for efficiency
  const [pendingResult, flaggedResult, approvedResult, rejectedResult] =
    await Promise.all([
      supabase
        .from('content_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      supabase
        .from('content_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'needs_human_review'),
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return supabase
          .from('content_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('reviewed_at', today.toISOString());
      })(),
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return supabase
          .from('content_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('reviewed_at', today.toISOString());
      })(),
    ]);

  return apiSuccess({
    items: data || [],
    total: count || 0,
    stats: {
      pending: pendingResult.count || 0,
      flagged: flaggedResult.count || 0,
      approvedToday: approvedResult.count || 0,
      rejectedToday: rejectedResult.count || 0,
    },
  });
}

// ── POST: Approve or reject ────────────────────────
export async function POST(req: NextRequest) {
  // v2 [S9-WARN-002]: Rate limit bulk admin actions (60/min)
  const limited = await applyRateLimit(req, 'admin-review');
  if (limited) return limited;

  const auth = await requireAdmin(req);
  if (!auth.success) return auth.response;
  const user = auth.user;

  // v2 [S9-HIGH-002]: Zod validation replaces manual checks
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return apiError('Invalid request body', 400, 'PARSE_ERROR');
  }

  const parsed = ReviewSchema.safeParse(rawBody);
  if (!parsed.success) {
    return apiError(
      `Validation error: ${parsed.error.issues.map(i => i.message).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
  }

  const body = parsed.data;

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const id of body.ids) {
    if (body.action === 'approve') {
      const result = await approveContent(id, user.id);
      results.push({ id, ...result });
    } else {
      const result = await rejectContent(
        id,
        user.id,
        body.reason || 'Rejected by admin'
      );
      results.push({ id, ...result });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return apiSuccess({
    results,
    summary: {
      total: results.length,
      succeeded,
      failed,
    },
  });
}
