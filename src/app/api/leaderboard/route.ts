// GET /api/leaderboard — Fetch league leaderboard for a child
// Returns top participants + user's position, COPPA-safe
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import {
  getWeekStart,
  getWeekEnd,
  rankParticipants,
  buildLeaderboard,
  getLeagueConfig,
  determinePromotionStatus,
  isInPromotionZone,
  isInDemotionZone,
  calculateZones,
} from '@/lib/leaderboard/LeaderboardEngine';
import type { LeagueParticipant, LeagueTier } from '@/lib/leaderboard/LeaderboardEngine';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId is required', 400);

  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(childId).success) {
    return apiError('Invalid childId format', 400);
  }

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  // Find child's current league assignment
  const { data: participant } = await supabase
    .from('league_participants')
    .select('league_id, league:league_id(tier)')
    .eq('child_id', childId)
    .single();

  let leagueId: string | null = null;
  let tier: LeagueTier = 'bronze';

  if (participant && participant.league) {
    leagueId = participant.league_id;
    // Supabase can return the joined relation as an object or a single-element
    // array depending on FK cardinality inference — handle both shapes.
    const leagueRel = participant.league as unknown as
      | { tier: LeagueTier }
      | { tier: LeagueTier }[]
      | null;
    const rel = Array.isArray(leagueRel) ? leagueRel[0] : leagueRel;
    tier = rel?.tier ?? 'bronze';
  } else {
    // Assign to Bronze league for current week
    const { data: bronzeLeague } = await supabase
      .from('leagues')
      .select('id')
      .eq('tier', 'bronze')
      .eq('week_starting', weekStart)
      .single();

    if (bronzeLeague) {
      leagueId = bronzeLeague.id;
    } else {
      // Create the league
      const { data: newLeague } = await supabase
        .from('leagues')
        .insert({
          tier: 'bronze',
          week_starting: weekStart,
          week_ending: weekEnd,
        })
        .select('id')
        .single();

      leagueId = newLeague?.id ?? null;
    }

    // Assign child to league if not already assigned
    if (leagueId) {
      // Generate COPPA-safe display name
      const { generateDisplayName, selectEmojiAvatar } = await import('@/lib/leaderboard/LeaderboardEngine');
      const displayName = generateDisplayName(childId);
      const avatarEmoji = selectEmojiAvatar(childId);

      await supabase.from('league_participants').upsert({
        league_id: leagueId,
        child_id: childId,
        display_name: displayName,
        avatar_emoji: avatarEmoji,
      }, { onConflict: 'league_id,child_id' });
    }
  }

  if (!leagueId) {
    return apiError('Failed to find or create league', 500);
  }

  // Get all participants in the league
  const { data: participants } = await supabase
    .from('league_participants')
    .select('*')
    .eq('league_id', leagueId)
    .order('xp_earned', { ascending: false });

  // Build ranked leaderboard
  const typedParticipants = (participants || []).map(p => ({
    id: p.id,
    leagueId: p.league_id,
    childId: p.child_id,
    displayName: p.display_name,
    avatarEmoji: p.avatar_emoji,
    xpEarned: p.xp_earned ?? 0,
    gamesPlayed: p.games_played ?? 0,
    questsCompleted: p.quests_completed ?? 0,
    rank: 0,
    promotionStatus: (p.promotion_status || 'pending') as 'promoted' | 'demoted' | 'staying' | 'pending',
    joinedAt: p.joined_at,
    isActive: p.is_active ?? false,
    tier,
  }));

  const ranked = rankParticipants(typedParticipants);
  const leaderboard = buildLeaderboard(ranked, childId, tier);

  // Find user's rank
  const userEntry = leaderboard.find(e => e.isCurrentUser);
  const userRank = userEntry?.rank ?? null;

  // Calculate progression
  const { data: history } = await supabase
    .from('league_history')
    .select('tier, promotion_status')
    .eq('child_id', childId)
    .order('week_starting', { ascending: false })
    .limit(10);

  const { data: child } = await supabase
    .from('children')
    .select('xp')
    .eq('id', childId)
    .single();

  const config = getLeagueConfig(tier);
  const nextTier = tier === 'bronze' ? 'silver'
    : tier === 'silver' ? 'gold'
    : tier === 'gold' ? 'platinum'
    : tier === 'platinum' ? 'diamond'
    : tier === 'diamond' ? 'legend'
    : null;

  const xpToNext = nextTier
    ? Math.max(0, getLeagueConfig(nextTier).unlockRequirement - (child?.xp ?? 0))
    : 0;

  return apiSuccess({
    entries: leaderboard,
    tier,
    userRank,
    weekStart,
    weekEnd,
    progression: {
      currentTier: tier,
      nextTier,
      previousTier: tier === 'silver' ? 'bronze'
        : tier === 'gold' ? 'silver'
        : tier === 'platinum' ? 'gold'
        : tier === 'diamond' ? 'platinum'
        : tier === 'legend' ? 'diamond'
        : null,
      xpToNextTier: xpToNext,
    },
    leagueSize: ranked.length,
  });
}
