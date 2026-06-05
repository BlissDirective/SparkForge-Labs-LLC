// ════════════════════════════════════════════════════
// CURRENCY ENGINE TESTS — Gem Economy Logic
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getDailyReward,
  getLevelUpGems,
  getGameCompletionGems,
  canClaimDailyReward,
  getNextDailyRewardDay,
  claimDailyReward,
  awardGems,
  spendGems,
  purchaseFreeze,
  DAILY_REWARDS,
  GEM_COSTS,
  GAME_COMPLETION_GEMS,
} from '@/lib/currency/CurrencyEngine';
import type { CurrencyWallet } from '@/lib/currency/CurrencyEngine';

// ─── Test Helpers ───

function makeWallet(overrides: Partial<CurrencyWallet> = {}): CurrencyWallet {
  return {
    childId: 'test-child-id',
    gems: 100,
    gemsEarnedLifetime: 150,
    gemsSpentLifetime: 50,
    streakFreezesOwned: 2,
    streakFreezesEquipped: 0,
    lastDailyReward: null,
    dailyRewardStreak: 0,
    ...overrides,
  };
}

// ─── Daily Reward Tests ───

describe('getDailyReward', () => {
  it('returns correct reward for each day', () => {
    expect(getDailyReward(1).gems).toBe(5);
    expect(getDailyReward(2).gems).toBe(10);
    expect(getDailyReward(7).gems).toBe(50);
  });

  it('caps at day 7', () => {
    const reward = getDailyReward(8);
    expect(reward).toEqual(getDailyReward(7));
  });

  it('has freeze bonus on day 7', () => {
    expect(getDailyReward(7).bonusFreeze).toBe(true);
    expect(getDailyReward(6).bonusFreeze).toBe(false);
  });

  it('returns day 1 for invalid input', () => {
    expect(getDailyReward(0)).toEqual(getDailyReward(1));
    expect(getDailyReward(-1)).toEqual(getDailyReward(1));
  });
});

describe('DAILY_REWARDS', () => {
  it('has exactly 7 entries', () => {
    expect(DAILY_REWARDS.length).toBe(7);
  });

  it('escalates gem rewards', () => {
    for (let i = 1; i < DAILY_REWARDS.length; i++) {
      expect(DAILY_REWARDS[i].gems).toBeGreaterThanOrEqual(DAILY_REWARDS[i - 1].gems);
    }
  });
});

// ─── Level Up Tests ───

describe('getLevelUpGems', () => {
  it('returns 10 for levels 1-5', () => {
    expect(getLevelUpGems(1)).toBe(10);
    expect(getLevelUpGems(5)).toBe(10);
  });

  it('returns 20 for levels 6-10', () => {
    expect(getLevelUpGems(6)).toBe(20);
    expect(getLevelUpGems(10)).toBe(20);
  });

  it('follows uniform +10 per 5-level bands through 50', () => {
    expect(getLevelUpGems(21)).toBe(50);  // 21-25
    expect(getLevelUpGems(30)).toBe(60);  // 26-30
    expect(getLevelUpGems(40)).toBe(80);  // 36-40
    expect(getLevelUpGems(41)).toBe(90);  // 41-45
    expect(getLevelUpGems(46)).toBe(100); // 46-50
    expect(getLevelUpGems(50)).toBe(100);
  });

  it('continues +10 per 5-level band past level 50 (unbounded)', () => {
    expect(getLevelUpGems(50)).toBe(100); // top of the 46-50 band
    expect(getLevelUpGems(51)).toBe(110); // 51-55 band
    expect(getLevelUpGems(55)).toBe(110);
    expect(getLevelUpGems(56)).toBe(120); // 56-60 band
    expect(getLevelUpGems(100)).toBe(200);
  });
});

// ─── Game Completion Tests ───

describe('getGameCompletionGems', () => {
  it('returns base gems for easy game', () => {
    expect(getGameCompletionGems('easy', 80, 1)).toBe(GAME_COMPLETION_GEMS.easy);
  });

  it('returns base gems for hard game', () => {
    expect(getGameCompletionGems('hard', 85, 1)).toBe(GAME_COMPLETION_GEMS.hard);
  });

  it('adds perfect score bonus', () => {
    const base = GAME_COMPLETION_GEMS.medium;
    const perfect = GAME_COMPLETION_GEMS.perfect_score;
    expect(getGameCompletionGems('medium', 100, 1)).toBe(base + perfect);
  });

  it('applies streak multiplier bonus', () => {
    const base = getGameCompletionGems('easy', 80, 1);
    const withMultiplier = getGameCompletionGems('easy', 80, 2);
    expect(withMultiplier).toBeGreaterThan(base);
  });
});

// ─── Claim Daily Tests ───

describe('canClaimDailyReward', () => {
  it('returns true when no previous claim', () => {
    const wallet = makeWallet({ lastDailyReward: null });
    expect(canClaimDailyReward(wallet)).toBe(true);
  });

  it('returns true when last claim was yesterday', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const wallet = makeWallet({ lastDailyReward: yesterday.toISOString().split('T')[0] });
    expect(canClaimDailyReward(wallet)).toBe(true);
  });

  it('returns false when already claimed today', () => {
    const today = new Date().toISOString().split('T')[0];
    const wallet = makeWallet({ lastDailyReward: today });
    expect(canClaimDailyReward(wallet)).toBe(false);
  });
});

describe('getNextDailyRewardDay', () => {
  it('returns 1 for new streak', () => {
    expect(getNextDailyRewardDay(makeWallet({ dailyRewardStreak: 0 }))).toBe(1);
  });

  it('increments within week', () => {
    expect(getNextDailyRewardDay(makeWallet({ dailyRewardStreak: 3 }))).toBe(4);
  });

  it('caps at 7', () => {
    expect(getNextDailyRewardDay(makeWallet({ dailyRewardStreak: 10 }))).toBe(7);
  });
});

describe('claimDailyReward', () => {
  it('awards correct gems for day 1', () => {
    const wallet = makeWallet({ lastDailyReward: null, dailyRewardStreak: 0 });
    const result = claimDailyReward(wallet);

    expect(result.success).toBe(true);
    expect(result.transaction?.amount).toBe(5);
    expect(result.wallet.gems).toBe(105); // 100 + 5
  });

  it('continues streak from yesterday', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const wallet = makeWallet({
      lastDailyReward: yesterday.toISOString().split('T')[0],
      dailyRewardStreak: 2,
    });
    const result = claimDailyReward(wallet);

    expect(result.success).toBe(true);
    expect(result.wallet.dailyRewardStreak).toBe(3);
    expect(result.transaction?.amount).toBe(15); // Day 3 reward
  });

  it('resets streak if gap', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
    const wallet = makeWallet({
      lastDailyReward: threeDaysAgo.toISOString().split('T')[0],
      dailyRewardStreak: 5,
    });
    const result = claimDailyReward(wallet);

    expect(result.success).toBe(true);
    expect(result.wallet.dailyRewardStreak).toBe(1);
  });

  it('fails when already claimed today', () => {
    const today = new Date().toISOString().split('T')[0];
    const wallet = makeWallet({ lastDailyReward: today });
    const result = claimDailyReward(wallet);

    expect(result.success).toBe(false);
    expect(result.wallet.gems).toBe(100); // No change
  });

  it('awards freeze on day 7', () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const wallet = makeWallet({
      lastDailyReward: yesterday.toISOString().split('T')[0],
      dailyRewardStreak: 6,
      streakFreezesOwned: 0,
    });
    const result = claimDailyReward(wallet);

    expect(result.success).toBe(true);
    expect(result.wallet.streakFreezesOwned).toBe(1);
  });
});

// ─── Award/Spend Tests ───

describe('awardGems', () => {
  it('adds gems to wallet', () => {
    const wallet = makeWallet({ gems: 100 });
    const result = awardGems(wallet, 50, 'streak_milestone', 'Test award');

    expect(result.success).toBe(true);
    expect(result.wallet.gems).toBe(150);
    expect(result.wallet.gemsEarnedLifetime).toBe(200); // 150 + 50
  });

  it('creates transaction record', () => {
    const wallet = makeWallet();
    const result = awardGems(wallet, 25, 'badge_earned', 'Badge test');

    expect(result.transaction).toBeDefined();
    expect(result.transaction?.type).toBe('badge_earned');
    expect(result.transaction?.amount).toBe(25);
  });

  it('fails for invalid amount', () => {
    const wallet = makeWallet();
    const result = awardGems(wallet, 0, 'streak_milestone', 'Invalid');

    expect(result.success).toBe(false);
    expect(result.wallet.gems).toBe(100); // No change
  });
});

describe('spendGems', () => {
  it('deducts gems from wallet', () => {
    const wallet = makeWallet({ gems: 100 });
    const result = spendGems(wallet, 30, 'purchase_freeze', 'Test purchase');

    expect(result.success).toBe(true);
    expect(result.wallet.gems).toBe(70);
    expect(result.wallet.gemsSpentLifetime).toBe(80); // 50 + 30
  });

  it('fails when insufficient gems', () => {
    const wallet = makeWallet({ gems: 20 });
    const result = spendGems(wallet, 50, 'purchase_freeze', 'Too expensive');

    expect(result.success).toBe(false);
    expect(result.wallet.gems).toBe(20); // No change
  });

  it('fails for invalid amount', () => {
    const wallet = makeWallet();
    const result = spendGems(wallet, 0, 'purchase_freeze', 'Invalid');

    expect(result.success).toBe(false);
  });

  it('creates negative transaction', () => {
    const wallet = makeWallet({ gems: 100 });
    const result = spendGems(wallet, 25, 'spent_cosmetic', 'Cosmetic');

    expect(result.transaction?.amount).toBe(-25);
    expect(result.transaction?.balanceAfter).toBe(75);
  });
});

describe('purchaseFreeze', () => {
  it('spends correct amount', () => {
    const wallet = makeWallet({ gems: GEM_COSTS.STREAK_FREEZE + 10 });
    const result = purchaseFreeze(wallet);

    expect(result.success).toBe(true);
    expect(result.wallet.gems).toBe(10);
  });

  it('fails when too expensive', () => {
    const wallet = makeWallet({ gems: GEM_COSTS.STREAK_FREEZE - 1 });
    const result = purchaseFreeze(wallet);

    expect(result.success).toBe(false);
  });
});

// ─── Constants Tests ───

describe('GEM_COSTS', () => {
  it('has positive costs for paid items', () => {
    expect(GEM_COSTS.STREAK_FREEZE).toBeGreaterThan(0);
    expect(GEM_COSTS.COSMETIC_LEGENDARY).toBeGreaterThan(0);
  });

  it('has free wager entries', () => {
    expect(GEM_COSTS.WAGER_ENTRY_7_DAY).toBe(0);
    expect(GEM_COSTS.WAGER_ENTRY_14_DAY).toBe(0);
  });

  it('has escalating cosmetic costs', () => {
    expect(GEM_COSTS.COSMETIC_COMMON).toBeLessThan(GEM_COSTS.COSMETIC_UNCOMMON);
    expect(GEM_COSTS.COSMETIC_UNCOMMON).toBeLessThan(GEM_COSTS.COSMETIC_RARE);
    expect(GEM_COSTS.COSMETIC_RARE).toBeLessThan(GEM_COSTS.COSMETIC_EPIC);
    expect(GEM_COSTS.COSMETIC_EPIC).toBeLessThan(GEM_COSTS.COSMETIC_LEGENDARY);
  });
});

describe('GAME_COMPLETION_GEMS', () => {
  it('escalates by difficulty', () => {
    expect(GAME_COMPLETION_GEMS.easy).toBeLessThan(GAME_COMPLETION_GEMS.medium);
    expect(GAME_COMPLETION_GEMS.medium).toBeLessThan(GAME_COMPLETION_GEMS.hard);
  });

  it('has positive perfect score bonus', () => {
    expect(GAME_COMPLETION_GEMS.perfect_score).toBeGreaterThan(0);
  });
});
