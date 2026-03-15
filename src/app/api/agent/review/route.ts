// ════════════════════════════════════════════════════
// CONTENT REVIEW API — GET (fetch queue) + POST (approve/reject)
// v2 [BUG-9C]: Uses createServerSupabase
// v2 [ENH-9C]: Bulk operations via arrays
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { approveContent, rejectContent } from '@/lib/agent/pipeline';

export const runtime = 'nodejs';

// ── Admin auth helper ──────────────────────────────
async function verifyAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, supabase, error: 'Unauthorized' as const };
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!parent?.is_admin) {
    return { user, supabase, error: 'Admin access required' as const };
  }

  return { user, supabase, error: null };
}

// ── GET: Fetch queue items + stats ─────────────────
export async function GET(req: NextRequest) {
  const { supabase, error } = await verifyAdmin();

  if (error) {
    return apiError(
      error,
      error === 'Unauthorized' ? 401 : 403,
      error === 'Unauthorized' ? 'AUTH_REQUIRED' : 'FORBIDDEN'
    );
  }

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
  const { user, error } = await verifyAdmin();

  if (error || !user) {
    return apiError(
      error || 'Unauthorized',
      error === 'Unauthorized' ? 401 : 403,
      error === 'Unauthorized' ? 'AUTH_REQUIRED' : 'FORBIDDEN'
    );
  }

  // Parse body in try block, return error in catch block
  let body: {
    action: 'approve' | 'reject';
    ids: string[];
    reason?: string;
  };

  try {
    body = await req.json();
  } catch {
    return apiError('Invalid request body', 400, 'PARSE_ERROR');
  }

  if (
    !body.action ||
    !body.ids ||
    !Array.isArray(body.ids) ||
    body.ids.length === 0
  ) {
    return apiError(
      'Required: action ("approve" | "reject") and ids (string[])',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!['approve', 'reject'].includes(body.action)) {
    return apiError(
      'action must be "approve" or "reject"',
      400,
      'VALIDATION_ERROR'
    );
  }

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
