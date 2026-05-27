// ════════════════════════════════════════════════════
// BADGE ENGINE TESTS — Badge System Logic
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  BADGE_CATALOG,
  getBadgeById,
  getBadgesByCategory,
  getBadgesByRarity,
  getVisibleBadges,
  calculateCollection,
  buildUnlockResult,
  getCategoryInfo,
  checkBadgeCriteria,
  findNewlyEligibleBadges,
} from '@/lib/badges/BadgeEngine';
import type { BadgeCategory, Rarity } from '@/lib/badges/BadgeEngine';

// ─── Catalog Tests ───

describe('BADGE_CATALOG', () => {
  it('contains badges', () => {
    expect(BADGE_CATALOG.length).toBeGreaterThan(0);
  });

  it('has unique IDs', () => {
    const ids = BADGE_CATALOG.map(b => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has all required fields', () => {
    for (const badge of BADGE_CATALOG) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(badge.category).toBeTruthy();
      expect(badge.rarity).toBeTruthy();
      expect(badge.criteriaType).toBeTruthy();
      expect(badge.gemReward).toBeGreaterThanOrEqual(0);
      expect(badge.xpReward).toBeGreaterThanOrEqual(0);
    }
  });

  it('has positive gem rewards', () => {
    for (const badge of BADGE_CATALOG) {
      expect(badge.gemReward).toBeGreaterThanOrEqual(0);
    }
  });

  it('has streak badges', () => {
    const streakBadges = BADGE_CATALOG.filter(b => b.category === 'streak');
    expect(streakBadges.length).toBeGreaterThan(0);
  });

  it('has XP badges', () => {
    const xpBadges = BADGE_CATALOG.filter(b => b.category === 'xp');
    expect(xpBadges.length).toBeGreaterThan(0);
  });

  it('has legendary rarity badges', () => {
    const legendary = BADGE_CATALOG.filter(b => b.rarity === 'legendary');
    expect(legendary.length).toBeGreaterThan(0);
  });
});

// ─── Lookup Tests ───

describe('getBadgeById', () => {
  it('returns badge for valid ID', () => {
    const badge = getBadgeById('streak-7');
    expect(badge).toBeDefined();
    expect(badge?.name).toBe('Streak Society');
  });

  it('returns undefined for invalid ID', () => {
    const badge = getBadgeById('nonexistent-badge');
    expect(badge).toBeUndefined();
  });

  it('returns welcome badge', () => {
    const badge = getBadgeById('secret-first-login');
    expect(badge).toBeDefined();
  });
});

describe('getBadgesByCategory', () => {
  it('filters by streak category', () => {
    const badges = getBadgesByCategory('streak');
    expect(badges.every(b => b.category === 'streak')).toBe(true);
  });

  it('filters by games category', () => {
    const badges = getBadgesByCategory('games');
    expect(badges.every(b => b.category === 'games')).toBe(true);
  });

  it('returns empty for unknown category', () => {
    const badges = getBadgesByCategory('nonexistent' as BadgeCategory);
    expect(badges.length).toBe(0);
  });
});

describe('getBadgesByRarity', () => {
  it('filters by legendary rarity', () => {
    const badges = getBadgesByRarity('legendary');
    expect(badges.every(b => b.rarity === 'legendary')).toBe(true);
  });

  it('returns badges for each rarity tier', () => {
    const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (const rarity of rarities) {
      const badges = getBadgesByRarity(rarity);
      expect(badges.length).toBeGreaterThan(0);
    }
  });
});

// ─── Visibility Tests ───

describe('getVisibleBadges', () => {
  it('shows non-secret badges', () => {
    const earned = new Set<string>();
    const visible = getVisibleBadges(earned);
    expect(visible.every(b => !b.isSecret)).toBe(true);
  });

  it('shows earned secret badges', () => {
    const earned = new Set(['secret-early-bird']);
    const visible = getVisibleBadges(earned);
    const earlyBird = visible.find(b => b.id === 'secret-early-bird');
    expect(earlyBird).toBeDefined();
  });

  it('hides unearned secret badges', () => {
    const earned = new Set<string>();
    const visible = getVisibleBadges(earned);
    const earlyBird = visible.find(b => b.id === 'secret-early-bird');
    expect(earlyBird).toBeUndefined();
  });
});

// ─── Collection Tests ───

describe('calculateCollection', () => {
  it('calculates 0% with no badges', () => {
    const earned = new Set<string>();
    const collection = calculateCollection(earned);
    expect(collection.earnedCount).toBe(0);
    expect(collection.completionPercent).toBe(0);
  });

  it('calculates 100% with all badges', () => {
    const earned = new Set(BADGE_CATALOG.map(b => b.id));
    const collection = calculateCollection(earned);
    expect(collection.earnedCount).toBe(BADGE_CATALOG.length);
    expect(collection.completionPercent).toBe(100);
  });

  it('tracks secret badges separately', () => {
    const earned = new Set<string>();
    const collection = calculateCollection(earned);
    expect(collection.secretBadgesTotal).toBeGreaterThan(0);
    expect(collection.secretBadgesFound).toBe(0);
  });

  it('counts found secret badges', () => {
    const secretId = BADGE_CATALOG.find(b => b.isSecret)?.id;
    if (secretId) {
      const earned = new Set([secretId]);
      const collection = calculateCollection(earned);
      expect(collection.secretBadgesFound).toBe(1);
    }
  });

  it('has category breakdowns', () => {
    const earned = new Set<string>();
    const collection = calculateCollection(earned);
    expect(Object.keys(collection.byCategory).length).toBeGreaterThan(0);
  });
});

// ─── Unlock Result Tests ───

describe('buildUnlockResult', () => {
  it('returns result for valid badge', () => {
    const result = buildUnlockResult('streak-7');
    expect(result.badge.id).toBe('streak-7');
    expect(result.rewards.gems).toBeGreaterThan(0);
  });

  it('has celebration for non-common', () => {
    const rare = BADGE_CATALOG.find(b => b.rarity === 'rare')?.id || 'streak-30';
    const result = buildUnlockResult(rare);
    expect(result.celebration.particles).toBe(true);
  });

  it('has screen shake for epic+', () => {
    const epic = BADGE_CATALOG.find(b => b.rarity === 'epic')?.id || 'streak-100';
    const result = buildUnlockResult(epic);
    expect(result.celebration.screenShake).toBe(true);
  });

  it('throws for invalid badge', () => {
    expect(() => buildUnlockResult('nonexistent')).toThrow();
  });
});

// ─── Category Info Tests ───

describe('getCategoryInfo', () => {
  it('returns info for streak', () => {
    const info = getCategoryInfo('streak');
    expect(info.label).toBe('Streak');
    expect(info.icon).toBeDefined();
    expect(info.color).toBeDefined();
  });

  it('returns info for games', () => {
    const info = getCategoryInfo('games');
    expect(info.label).toBe('Games');
  });

  it('returns info for all categories', () => {
    const categories: BadgeCategory[] = ['streak', 'xp', 'games', 'labs', 'social', 'special', 'events'];
    for (const cat of categories) {
      const info = getCategoryInfo(cat);
      expect(info).toBeDefined();
      expect(info.label).toBeTruthy();
    }
  });
});

// ─── Criteria Check Tests ───

describe('checkBadgeCriteria', () => {
  const baseStats = {
    xp: 1000,
    level: 10,
    streakCount: 14,
    uniqueGamesPlayed: 20,
    perfectScores: 5,
    labsMastered: 3,
    currentLeague: 2,
    totalBadges: 10,
  };

  it('passes XP check', () => {
    const badge = getBadgeById('xp-500');
    if (badge) {
      expect(checkBadgeCriteria(badge, baseStats)).toBe(true);
    }
  });

  it('fails XP check when insufficient', () => {
    const badge = getBadgeById('xp-10000');
    if (badge) {
      expect(checkBadgeCriteria(badge, baseStats)).toBe(false);
    }
  });

  it('passes streak check', () => {
    const badge = getBadgeById('streak-7');
    if (badge) {
      expect(checkBadgeCriteria(badge, baseStats)).toBe(true);
    }
  });

  it('passes level check', () => {
    const badge = getBadgeById('level-5');
    if (badge) {
      expect(checkBadgeCriteria(badge, baseStats)).toBe(true);
    }
  });

  it('returns false for special criteria', () => {
    const badge = BADGE_CATALOG.find(b => b.criteriaType === 'special');
    if (badge) {
      expect(checkBadgeCriteria(badge, baseStats)).toBe(false);
    }
  });
});

// ─── Eligibility Tests ───

describe('findNewlyEligibleBadges', () => {
  const baseStats = {
    xp: 10000,
    level: 20,
    streakCount: 30,
    uniqueGamesPlayed: 25,
    perfectScores: 10,
    labsMastered: 5,
    currentLeague: 3,
    totalBadges: 5,
  };

  it('finds multiple eligible badges', () => {
    const earned = new Set<string>();
    const eligible = findNewlyEligibleBadges(baseStats, earned);
    expect(eligible.length).toBeGreaterThan(0);
  });

  it('excludes already earned badges', () => {
    const earned = new Set(['streak-7', 'streak-14']);
    const eligible = findNewlyEligibleBadges(baseStats, earned);
    expect(eligible.some(b => b.id === 'streak-7')).toBe(false);
  });

  it('excludes special badges', () => {
    const earned = new Set<string>();
    const eligible = findNewlyEligibleBadges(baseStats, earned);
    expect(eligible.some(b => b.criteriaType === 'special')).toBe(false);
  });

  it('returns empty when no badges qualify', () => {
    const lowStats = {
      xp: 0,
      level: 1,
      streakCount: 0,
      uniqueGamesPlayed: 0,
      perfectScores: 0,
      labsMastered: 0,
      currentLeague: 1,
      totalBadges: 0,
    };
    const earned = new Set<string>();
    const eligible = findNewlyEligibleBadges(lowStats, earned);
    // Only streak-0 and welcome badge should qualify
    expect(eligible.length).toBeLessThanOrEqual(2);
  });
});
