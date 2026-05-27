// ════════════════════════════════════════════════════
// LEADERBOARD ENGINE TESTS — League System Logic
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  LEAGUE_ORDER,
  LEAGUE_CONFIGS,
  LEAGUE_ZONES,
  getLeagueConfig,
  getNextTier,
  getPreviousTier,
  canAccessTier,
  calculateZones,
  determinePromotionStatus,
  isInPromotionZone,
  isInDemotionZone,
  calculateLeagueReward,
  rankParticipants,
  buildLeaderboard,
  getWeekStart,
  getWeekEnd,
  getSecondsUntilLeagueReset,
  formatTimeUntilReset,
  generateDisplayName,
  selectEmojiAvatar,
  DISPLAY_NAME_TEMPLATES,
  EMOJI_AVATARS,
} from '@/lib/leaderboard/LeaderboardEngine';
import type { LeagueParticipant, LeagueTier } from '@/lib/leaderboard/LeaderboardEngine';

// ─── Test Helpers ───

function makeParticipant(overrides: Partial<LeagueParticipant> = {}): LeagueParticipant {
  return {
    id: `participant-${overrides.childId || 'default'}`,
    leagueId: 'league-1',
    childId: 'child-1',
    displayName: 'TestPlayer',
    avatarEmoji: '🤖',
    xpEarned: 100,
    gamesPlayed: 5,
    questsCompleted: 2,
    rank: 0,
    promotionStatus: 'pending',
    joinedAt: '2024-01-01',
    isActive: true,
    tier: 'bronze',
    ...overrides,
  };
}

// ─── League Order Tests ───

describe('LEAGUE_ORDER', () => {
  it('has exactly 6 tiers', () => {
    expect(LEAGUE_ORDER.length).toBe(6);
  });

  it('orders from bronze to legend', () => {
    expect(LEAGUE_ORDER[0]).toBe('bronze');
    expect(LEAGUE_ORDER[5]).toBe('legend');
  });

  it('contains all expected tiers', () => {
    expect(LEAGUE_ORDER).toContain('bronze');
    expect(LEAGUE_ORDER).toContain('silver');
    expect(LEAGUE_ORDER).toContain('gold');
    expect(LEAGUE_ORDER).toContain('platinum');
    expect(LEAGUE_ORDER).toContain('diamond');
    expect(LEAGUE_ORDER).toContain('legend');
  });
});

// ─── Config Tests ───

describe('LEAGUE_CONFIGS', () => {
  it('has config for each tier', () => {
    for (const tier of LEAGUE_ORDER) {
      expect(LEAGUE_CONFIGS[tier]).toBeDefined();
    }
  });

  it('bronze has no demotion', () => {
    expect(LEAGUE_CONFIGS.bronze.demoteCount).toBe(0);
  });

  it('legend has no promotion', () => {
    expect(LEAGUE_CONFIGS.legend.promoteCount).toBe(0);
  });

  it('escalates rewards by tier', () => {
    expect(LEAGUE_CONFIGS.bronze.rewardGems.first).toBeLessThan(
      LEAGUE_CONFIGS.silver.rewardGems.first,
    );
    expect(LEAGUE_CONFIGS.silver.rewardGems.first).toBeLessThan(
      LEAGUE_CONFIGS.gold.rewardGems.first,
    );
  });

  it('escalates unlock requirements', () => {
    expect(LEAGUE_CONFIGS.bronze.unlockRequirement).toBe(0);
    expect(LEAGUE_CONFIGS.silver.unlockRequirement).toBeGreaterThan(0);
    expect(LEAGUE_CONFIGS.legend.unlockRequirement).toBeGreaterThan(
      LEAGUE_CONFIGS.diamond.unlockRequirement,
    );
  });
});

// ─── Tier Navigation Tests ───

describe('getLeagueConfig', () => {
  it('returns correct config', () => {
    const config = getLeagueConfig('gold');
    expect(config.tier).toBe('gold');
    expect(config.label).toBe('Gold League');
  });
});

describe('getNextTier', () => {
  it('returns silver after bronze', () => {
    expect(getNextTier('bronze')).toBe('silver');
  });

  it('returns null for legend', () => {
    expect(getNextTier('legend')).toBeNull();
  });
});

describe('getPreviousTier', () => {
  it('returns gold before platinum', () => {
    expect(getPreviousTier('platinum')).toBe('gold');
  });

  it('returns null for bronze', () => {
    expect(getPreviousTier('bronze')).toBeNull();
  });
});

// ─── Access Tests ───

describe('canAccessTier', () => {
  it('allows bronze at 0 XP', () => {
    expect(canAccessTier('bronze', 0)).toBe(true);
  });

  it('requires XP for silver', () => {
    expect(canAccessTier('silver', 0)).toBe(false);
    expect(canAccessTier('silver', 500)).toBe(true);
  });

  it('requires high XP for legend', () => {
    expect(canAccessTier('legend', 5000)).toBe(false);
    expect(canAccessTier('legend', 10000)).toBe(true);
  });
});

// ─── Zone Tests ───

describe('calculateZones', () => {
  it('calculates correct zones for bronze (50 participants)', () => {
    const zones = calculateZones(50, 'bronze');
    expect(zones.promoteZoneSize).toBe(LEAGUE_CONFIGS.bronze.promoteCount);
    expect(zones.demoteZoneSize).toBe(0); // Bronze can't demote
  });

  it('calculates correct zones for gold (30 participants)', () => {
    const zones = calculateZones(30, 'gold');
    expect(zones.promoteZoneSize + zones.demoteZoneSize + zones.safeZoneSize).toBe(30);
  });
});

describe('determinePromotionStatus', () => {
  it('promotes top 5 in bronze', () => {
    expect(determinePromotionStatus(1, 50, 'bronze')).toBe('promoted');
    expect(determinePromotionStatus(5, 50, 'bronze')).toBe('promoted');
    expect(determinePromotionStatus(6, 50, 'bronze')).toBe('staying');
  });

  it('demotes bottom 10 in silver', () => {
    expect(determinePromotionStatus(50, 50, 'silver')).toBe('demoted');
    expect(determinePromotionStatus(41, 50, 'silver')).toBe('demoted');
    expect(determinePromotionStatus(40, 50, 'silver')).toBe('staying');
  });

  it('never demotes from bronze', () => {
    expect(determinePromotionStatus(50, 50, 'bronze')).toBe('staying');
  });

  it('never promotes from legend', () => {
    expect(determinePromotionStatus(1, 15, 'legend')).toBe('staying');
  });
});

describe('isInPromotionZone', () => {
  it('returns true for top 5 in bronze', () => {
    expect(isInPromotionZone(3, 50, 'bronze')).toBe(true);
  });

  it('returns false for rank 6+ in bronze', () => {
    expect(isInPromotionZone(6, 50, 'bronze')).toBe(false);
  });
});

describe('isInDemotionZone', () => {
  it('returns true for bottom of silver', () => {
    expect(isInDemotionZone(45, 50, 'silver')).toBe(true);
  });

  it('returns false for bronze', () => {
    expect(isInDemotionZone(50, 50, 'bronze')).toBe(false);
  });
});

// ─── Reward Tests ───

describe('calculateLeagueReward', () => {
  it('gives first place bonus', () => {
    const reward = calculateLeagueReward(1, 50, 'bronze');
    expect(reward.gems).toBe(LEAGUE_CONFIGS.bronze.rewardGems.first);
  });

  it('gives second place bonus', () => {
    const reward = calculateLeagueReward(2, 50, 'bronze');
    expect(reward.gems).toBe(LEAGUE_CONFIGS.bronze.rewardGems.second);
  });

  it('gives participation reward for bottom half', () => {
    const reward = calculateLeagueReward(40, 50, 'bronze');
    expect(reward.gems).toBe(LEAGUE_CONFIGS.bronze.rewardGems.participation);
  });

  it('scales rewards by tier', () => {
    const bronze1st = calculateLeagueReward(1, 50, 'bronze').gems;
    const legend1st = calculateLeagueReward(1, 15, 'legend').gems;
    expect(legend1st).toBeGreaterThan(bronze1st);
  });

  it('awards title for legend 1st', () => {
    const reward = calculateLeagueReward(1, 15, 'legend');
    expect(reward.title).toBe('Weekly Champion');
  });

  it('does not award title for non-legend', () => {
    const reward = calculateLeagueReward(1, 50, 'gold');
    expect(reward.title).toBeUndefined();
  });
});

// ─── Ranking Tests ───

describe('rankParticipants', () => {
  it('sorts by XP descending', () => {
    const participants = [
      makeParticipant({ childId: 'c1', xpEarned: 100 }),
      makeParticipant({ childId: 'c2', xpEarned: 300 }),
      makeParticipant({ childId: 'c3', xpEarned: 200 }),
    ];
    const ranked = rankParticipants(participants);

    expect(ranked[0].childId).toBe('c2');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].childId).toBe('c3');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].childId).toBe('c1');
    expect(ranked[2].rank).toBe(3);
  });

  it('tie-breaks by games played', () => {
    const participants = [
      makeParticipant({ childId: 'c1', xpEarned: 100, gamesPlayed: 5 }),
      makeParticipant({ childId: 'c2', xpEarned: 100, gamesPlayed: 10 }),
    ];
    const ranked = rankParticipants(participants);

    expect(ranked[0].childId).toBe('c2');
  });

  it('assigns promotion status', () => {
    const participants = Array.from({ length: 50 }, (_, i) =>
      makeParticipant({ childId: `c${i}`, xpEarned: 5000 - i * 100 }),
    );
    const ranked = rankParticipants(participants);

    expect(ranked[0].promotionStatus).toBe('promoted');
    expect(ranked[10].promotionStatus).toBe('staying');
  });
});

// ─── Leaderboard Build Tests ───

describe('buildLeaderboard', () => {
  it('marks current user correctly', () => {
    const participants = [
      makeParticipant({ childId: 'c1', xpEarned: 100 }),
      makeParticipant({ childId: 'c2', xpEarned: 200 }),
    ];
    const ranked = rankParticipants(participants);
    const leaderboard = buildLeaderboard(ranked, 'c1', 'bronze');

    const userEntry = leaderboard.find(e => e.isCurrentUser);
    expect(userEntry).toBeDefined();
    expect(userEntry?.displayName).toBe('TestPlayer');
  });

  it('shows promotion zone flags', () => {
    const participants = Array.from({ length: 10 }, (_, i) =>
      makeParticipant({ childId: `c${i}`, xpEarned: 1000 - i * 100 }),
    );
    const ranked = rankParticipants(participants);
    const leaderboard = buildLeaderboard(ranked, 'c0', 'bronze');

    expect(leaderboard[0].promotionZone).toBe(true);
    expect(leaderboard[6].promotionZone).toBe(false);
  });
});

// ─── COPPA-Safe Name Tests ───

describe('generateDisplayName', () => {
  it('generates a name from templates', () => {
    const name = generateDisplayName('test-seed-123');
    expect(name.length).toBeGreaterThan(0);
    expect(typeof name).toBe('string');
  });

  it('generates deterministic names for same seed', () => {
    const name1 = generateDisplayName('same-seed');
    const name2 = generateDisplayName('same-seed');
    expect(name1).toBe(name2);
  });

  it('generates different names for different seeds', () => {
    const name1 = generateDisplayName('seed-a');
    const name2 = generateDisplayName('seed-b');
    // Very unlikely to be the same
    expect(name1 === name2).toBe(false);
  });

  it('does not contain real personal info', () => {
    const name = generateDisplayName('child-real-name-123');
    expect(name.toLowerCase()).not.toContain('child');
    expect(name.toLowerCase()).not.toContain('real');
    expect(name.toLowerCase()).not.toContain('name');
  });
});

describe('selectEmojiAvatar', () => {
  it('selects from valid emoji set', () => {
    const emoji = selectEmojiAvatar('test');
    expect(EMOJI_AVATARS).toContain(emoji);
  });

  it('is deterministic', () => {
    expect(selectEmojiAvatar('same')).toBe(selectEmojiAvatar('same'));
  });
});

// ─── Week Helper Tests ───

describe('getWeekStart', () => {
  it('returns Monday', () => {
    const start = getWeekStart();
    const date = new Date(start);
    const day = date.getUTCDay();
    // Monday = 1
    expect(day).toBe(1);
  });
});

describe('getWeekEnd', () => {
  it('returns Sunday (6 days after Monday)', () => {
    const start = getWeekStart();
    const end = getWeekEnd();
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });
});

describe('formatTimeUntilReset', () => {
  it('formats days and hours', () => {
    expect(formatTimeUntilReset(90000)).toMatch(/\d+d \d+h/);
  });

  it('formats hours and minutes', () => {
    expect(formatTimeUntilReset(3600)).toMatch(/\d+h \d+m/);
  });

  it('formats minutes only', () => {
    expect(formatTimeUntilReset(600)).toMatch(/\d+m/);
  });
});

// ─── Zone Constants Tests ───

describe('LEAGUE_ZONES', () => {
  it('has promotion zone at 10%', () => {
    expect(LEAGUE_ZONES.PROMOTION_TOP_PERCENT).toBe(0.1);
  });

  it('has demotion zone at 20%', () => {
    expect(LEAGUE_ZONES.DEMOTION_BOTTOM_PERCENT).toBe(0.2);
  });

  it('leaves 70% safe zone', () => {
    const safe = 1 - LEAGUE_ZONES.PROMOTION_TOP_PERCENT - LEAGUE_ZONES.DEMOTION_BOTTOM_PERCENT;
    expect(safe).toBe(0.7);
  });
});
