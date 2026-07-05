// ════════════════════════════════════════════════════
// CRON — Parent Weekly Digest (Phase 4, behind a flag)
// Sends each parent a short weekly recap email: per child —
// games played, minutes, XP earned, and top lab this week —
// plus one rotating AI "conversation starter".
//
// Scheduling: weekly, Sunday 16:00 UTC (add to the deployment
// scheduler when crons are wired up — no vercel.json exists yet).
//
// Data source (same tables the parent dashboard reads):
//   progress (completed rows in the last 7 days, joined to
//   content for world/lab + xp_reward) — the identical window
//   /api/parent/usage uses for games_played_this_week.
//
// Security:
//   CRON_SECRET bearer-token auth via the shared verifyCronBearer
//   helper (T17 DEPLOY-MED-003), same as sibling crons.
//
// Graceful degradation:
//   - ENABLE_WEEKLY_DIGEST !== 'true' → skipped with reason, 200
//   - Missing RESEND_API_KEY → skipped with reason, 200
//   - Individual email failures don't abort the batch — each
//     parent is processed independently.
//   - Batch limit: 100 parents per run.
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, sanitizeErrorMessage } from '@/lib/api-helpers';
import { verifyCronBearer } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { LAB_NAMES } from '@/config/labs';
import { renderWeeklyDigest, type ChildDigest } from '@/lib/email-templates/weekly-digest';

export const runtime = 'nodejs';

const BATCH_LIMIT = 100;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// One line per week, rotating. Static on purpose — no AI call needed
// for a digest footer.
const CONVERSATION_STARTERS = [
  'Ask them: what did Sparky teach you about how AI learns?',
  'Ask them: can an AI make a mistake? How would you catch it?',
  'Ask them: if you could build any AI helper, what would it do?',
  'Ask them: how does a computer know a cat photo is a cat?',
  'Ask them: what should an AI never be allowed to decide on its own?',
  'Ask them: what clues tell you a picture might be AI-generated?',
];

interface ParentRow {
  id: string;
  email: string;
  full_name: string | null;
}

interface ChildRow {
  id: string;
  parent_id: string;
  display_name: string;
}

interface ProgressRow {
  child_id: string;
  time_spent_seconds: number | null;
  content: { world: number | null; xp_reward: number | null } | null;
}

/** Aggregate one child's week from their completed progress rows. */
function buildChildDigest(displayName: string, rows: ProgressRow[]): ChildDigest {
  let seconds = 0;
  let xp = 0;
  const labCounts = new Map<number, number>();

  for (const row of rows) {
    seconds += row.time_spent_seconds ?? 0;
    xp += row.content?.xp_reward ?? 0;
    const world = row.content?.world;
    if (typeof world === 'number') {
      labCounts.set(world, (labCounts.get(world) ?? 0) + 1);
    }
  }

  let topLab: string | null = null;
  let topCount = 0;
  for (const [world, count] of labCounts) {
    if (count > topCount) {
      topCount = count;
      topLab = LAB_NAMES[world] ?? `Lab ${world}`;
    }
  }

  return {
    displayName,
    gamesPlayed: rows.length,
    minutes: Math.round(seconds / 60),
    xp,
    topLab,
  };
}

export async function GET(req: NextRequest) {
  // ── Auth (shared verifyCronBearer helper, same as siblings) ──
  const denial = verifyCronBearer(req, { routeName: 'weekly-digest' });
  if (denial) return denial;

  // ── Feature flag ───────────────────────────────────
  if (process.env.ENABLE_WEEKLY_DIGEST !== 'true') {
    return apiSuccess({
      skipped: true,
      reason: 'ENABLE_WEEKLY_DIGEST is not "true" — weekly digest disabled',
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  // ── Email configured? ──────────────────────────────
  if (!isEmailConfigured()) {
    return apiSuccess({
      skipped: true,
      reason: 'RESEND_API_KEY not configured — no emails sent',
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  const supabase = createAdminClient();
  const weekAgo = new Date(Date.now() - WEEK_MS);

  try {
    // ── Parents with an email (demo/anonymous users have none) ──
    const { data: parentRows, error: parentErr } = await supabase
      .from('parents')
      .select('id, email, full_name')
      .not('email', 'is', null)
      .limit(BATCH_LIMIT);

    if (parentErr) {
      console.error('[cron/weekly-digest] Parent fetch error:', parentErr);
      return apiError('Failed to fetch parents', 500);
    }

    const parents = (parentRows ?? []) as ParentRow[];
    if (parents.length === 0) {
      return apiSuccess({ processed: 0, sent: 0, failed: 0, skippedNoChildren: 0 });
    }

    // ── Active children for those parents ──────────────
    const { data: childRows, error: childErr } = await supabase
      .from('children')
      .select('id, parent_id, display_name')
      .in('parent_id', parents.map((p) => p.id))
      .is('deactivated_at', null);

    if (childErr) {
      console.error('[cron/weekly-digest] Children fetch error:', childErr);
      return apiError('Failed to fetch children', 500);
    }

    const children = (childRows ?? []) as ChildRow[];
    const childrenByParent = new Map<string, ChildRow[]>();
    for (const child of children) {
      const list = childrenByParent.get(child.parent_id) ?? [];
      list.push(child);
      childrenByParent.set(child.parent_id, list);
    }

    // ── This week's completed progress for all children, one query ──
    // Same window + tables as /api/parent/usage (progress) and the parent
    // dashboard (progress joined to content for lab/world + xp_reward).
    let progressByChild = new Map<string, ProgressRow[]>();
    if (children.length > 0) {
      const { data: progressRows, error: progressErr } = await supabase
        .from('progress')
        .select('child_id, time_spent_seconds, content:content_id(world, xp_reward)')
        .in('child_id', children.map((c) => c.id))
        .eq('completed', true)
        .gte('completed_at', weekAgo.toISOString());

      if (progressErr) {
        console.error('[cron/weekly-digest] Progress fetch error:', progressErr);
        return apiError('Failed to fetch weekly progress', 500);
      }

      progressByChild = new Map();
      for (const row of (progressRows ?? []) as unknown as ProgressRow[]) {
        const list = progressByChild.get(row.child_id) ?? [];
        list.push(row);
        progressByChild.set(row.child_id, list);
      }
    }

    // ── Rotating conversation starter (changes weekly) ──
    const starter =
      CONVERSATION_STARTERS[Math.floor(Date.now() / WEEK_MS) % CONVERSATION_STARTERS.length];

    // ── Send one digest per parent (failures don't abort the run) ──
    let sent = 0;
    let failed = 0;
    let skippedNoChildren = 0;

    for (const parent of parents) {
      const parentChildren = childrenByParent.get(parent.id) ?? [];
      if (parentChildren.length === 0) {
        skippedNoChildren++;
        continue;
      }

      try {
        const digests = parentChildren.map((c) =>
          buildChildDigest(c.display_name, progressByChild.get(c.id) ?? []),
        );
        const rendered = renderWeeklyDigest(parent.full_name, digests, starter);

        const result = await sendEmail({
          to: parent.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: { kind: 'weekly_digest' },
        });

        if (result.sent) {
          sent++;
        } else {
          console.error(
            `[cron/weekly-digest] Failed to send to ${parent.email}:`,
            result.reason,
          );
          failed++;
        }
      } catch (err) {
        console.error(`[cron/weekly-digest] Error processing parent ${parent.id}:`, err);
        failed++;
      }
    }

    const summary = {
      processed: parents.length,
      sent,
      failed,
      skippedNoChildren,
      weekWindowStart: weekAgo.toISOString(),
    };

    console.log('[cron/weekly-digest]', summary);
    return apiSuccess(summary);
  } catch (err) {
    return apiError(sanitizeErrorMessage(err, 'Weekly digest cron failed'), 500);
  }
}
