// GET /api/gamification/badges — Fetch all badges + earned status
// POST /api/gamification/badges — Check and award earned badges
// v2 [BUG-6]: POST expanded to check ALL criteria types
// v2 [ENH]: GET has Cache-Control: 1 hour
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

// v2 [ENH]: Cache badge definitions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const [{ data: badges }, { data: earned }] = await Promise.all([
    supabase.from('badges').select('*').order('category').order('criteria_value'),
    supabase.from('child_badges').select('badge_id, earned_at').eq('child_id', childId),
  ]);

  const earnedMap = new Map((earned || []).map(e => [e.badge_id, e.earned_at]));

  const merged = (badges || []).map(b => ({
    ...b, earned: earnedMap.has(b.id), earnedAt: earnedMap.get(b.id) || null,
  }));

  const response = NextResponse.json({ success: true, data: merged }, { status: 200 });
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
  return response;
}

const CheckBadgesSchema = z.object({ childId: z.string().uuid() });

// v2 [BUG-6]: Expanded to check ALL criteria types:
// reach_xp, reach_level, maintain_streak, complete_world,
// world_games_complete, world_quizzes_90, worlds_visited,
// worlds_mastered, unique_games_played, prompts_used,
// sandboxes_completed, spark_facts_read, total_badges, special
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CheckBadgesSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children').select('xp, level, streak_count, age_band')
    .eq('id', childId).single();

  if (!child) return apiError('Child not found', 404);

  const { data: allBadges } = await supabase.from('badges').select('*');
  const { data: earned } = await supabase.from('child_badges').select('badge_id').eq('child_id', childId);

  const earnedIds = new Set((earned || []).map(e => e.badge_id));
  const unearned = (allBadges || []).filter(b => !earnedIds.has(b.id));

  // Progress data for world-based checks
  const { data: progress } = await supabase
    .from('progress')
    .select('content_id, completed, score, content:content_id(world, type)')
    .eq('child_id', childId).eq('completed', true);

  const worldsVisited = new Set<number>();
  const gamesByWorld = new Map<number, number>();
  const quizScoresByWorld = new Map<number, number[]>();
  const uniqueGamesPlayed = new Set<string>();

  for (const p of progress || []) {
    const c = p.content as any;
    if (!c) continue;
    worldsVisited.add(c.world);
    if (c.type === 'game') {
      gamesByWorld.set(c.world, (gamesByWorld.get(c.world) || 0) + 1);
      uniqueGamesPlayed.add(p.content_id);
    }
    if (c.type === 'quiz' && p.score !== null) {
      const scores = quizScoresByWorld.get(c.world) || [];
      scores.push(Number(p.score));
      quizScoresByWorld.set(c.world, scores);
    }
  }

  // v2 [BUG-6]: Check ALL criteria types
  const newBadges: typeof allBadges = [];

  for (const badge of unearned) {
    let met = false;

    switch (badge.criteria_type) {
      case 'reach_xp':
        met = child.xp >= badge.criteria_value;
        break;
      case 'reach_level':
        met = child.level >= badge.criteria_value;
        break;
      case 'maintain_streak':
        met = child.streak_count >= badge.criteria_value;
        break;
      case 'complete_world':
        if (badge.criteria_world) {
          const { data: lp } = await supabase.rpc('get_lab_progress', {
            p_child_id: childId, p_world: badge.criteria_world, p_age_band: child.age_band,
          });
          met = (lp?.[0]?.percent || 0) >= badge.criteria_value;
        }
        break;
      case 'world_games_complete':
        if (badge.criteria_world) {
          met = (gamesByWorld.get(badge.criteria_world) || 0) >= badge.criteria_value;
        }
        break;
      case 'world_quizzes_90':
        if (badge.criteria_world) {
          const scores = quizScoresByWorld.get(badge.criteria_world) || [];
          met = scores.length > 0 && scores.every(s => s >= 90);
        }
        break;
      case 'worlds_visited':
        met = worldsVisited.size >= badge.criteria_value;
        break;
      case 'worlds_mastered': {
        let mastered = 0;
        for (let w = 1; w <= 10; w++) {
          const { data: lp } = await supabase.rpc('get_lab_progress', {
            p_child_id: childId, p_world: w, p_age_band: child.age_band,
          });
          if ((lp?.[0]?.percent || 0) >= 100) mastered++;
        }
        met = mastered >= badge.criteria_value;
        break;
      }
      case 'unique_games_played':
        met = uniqueGamesPlayed.size >= badge.criteria_value;
        break;
      case 'prompts_used': {
        const { count } = await supabase
          .from('prompt_history')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', childId);
        met = (count || 0) >= badge.criteria_value;
        break;
      }
      case 'sandboxes_completed': {
        const sandboxCount = (progress || []).filter(
          p => (p.content as any)?.type === 'sandbox'
        ).length;
        met = sandboxCount >= badge.criteria_value;
        break;
      }
      case 'spark_facts_read': {
        const factCount = (progress || []).filter(
          p => (p.content as any)?.type === 'spark_fact'
        ).length;
        met = factCount >= badge.criteria_value;
        break;
      }
      case 'total_badges':
        met = (earnedIds.size + newBadges!.length) >= badge.criteria_value;
        break;
      case 'special':
        // Special badges awarded by specific game/event handlers
        break;
    }

    if (met) {
      newBadges!.push(badge);
      earnedIds.add(badge.id);
    }
  }

  // Insert newly earned badges
  if (newBadges!.length > 0) {
    await supabase.from('child_badges').insert(
      newBadges!.map(b => ({ child_id: childId, badge_id: b!.id }))
    );
  }

  return apiSuccess({ newBadges, totalEarned: earnedIds.size });
}
