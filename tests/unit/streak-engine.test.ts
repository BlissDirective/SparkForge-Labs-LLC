// ════════════════════════════════════════════════════
// STREAK ENGINE TESTS — Comprehensive Coverage
// Tests all streak calculation logic, freeze management, wagers
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  processDailyActivity,
  getStreakMultiplier,
  getSocietyBenefits,
  STREAK_MILESTONES,
  WAGER_CONFIG,
  equipFreeze,
  unequipFreeze,
  placeWager,
  canClaimWager,
  generateStreakCalendar,
  getNextMilestone,
  getDaysUntilNextMilestone,
  getReachedMilestones,
  isStreakAtRisk,
  predictStreakRisk,
  daysBetween,
  isConsecutiveDay,
  hasOneDayGap,
  getTodayUTC,
} from '@/lib/streak/StreakEngine';
import type { StreakState } from '@/lib/streak/StreakEngine';

// ─── Test Helpers ───

function makeState(overrides: Partial<StreakState> = {}): StreakState {
  return {
    streakCount: 0,
    longestStreak: 0,
    streakLastDate: null,
    streakStartedDate: null,
    freezesAvailable: 0,
    freezesEquipped: 0,
    totalFreezesEarned: 0,
    activeWager: null,
    wagerHistory: [],
    isStreakSocietyMember: false,
    societyJoinedAt: null,
    last30Days: [],
    nextMilestone: null,
    daysUntilMilestone: 0,
    ...overrides,
  };
}

// ─── Multiplier Tests ───

describe('getStreakMultiplier', () => {
  it('returns 1.0 for streak < 3', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(1)).toBe(1.0);
    expect(getStreakMultiplier(2)).toBe(1.0);
  });

  it('returns 1.25 for streak 3-6', () => {
    expect(getStreakMultiplier(3)).toBe(1.25);
    expect(getStreakMultiplier(6)).toBe(1.25);
  });

  it('returns 1.5 for streak 7-13', () => {
    expect(getStreakMultiplier(7)).toBe(1.5);
    expect(getStreakMultiplier(13)).toBe(1.5);
  });

  it('returns 1.75 for streak 14-29', () => {
    expect(getStreakMultiplier(14)).toBe(1.75);
    expect(getStreakMultiplier(29)).toBe(1.75);
  });

  it('returns 2.0 for streak 30+', () => {
    expect(getStreakMultiplier(30)).toBe(2.0);
    expect(getStreakMultiplier(100)).toBe(2.0);
  });
});

// ─── Society Benefits Tests ───

describe('getSocietyBenefits', () => {
  it('returns no benefits for streak < 5', () => {
    const benefits = getSocietyBenefits(4);
    expect(benefits.xpBonusPercent).toBe(0);
    expect(benefits.dailyGemReward).toBe(0);
    expect(benefits.title).toBe('');
  });

  it('returns Bronze benefits at 5 days', () => {
    const benefits = getSocietyBenefits(5);
    expect(benefits.title).toBe('Bronze Member');
    expect(benefits.xpBonusPercent).toBe(5);
    expect(benefits.dailyGemReward).toBe(1);
  });

  it('returns Silver benefits at 15 days', () => {
    const benefits = getSocietyBenefits(15);
    expect(benefits.title).toBe('Silver Member');
    expect(benefits.xpBonusPercent).toBe(10);
    expect(benefits.dailyGemReward).toBe(2);
  });

  it('returns Gold benefits at 30 days', () => {
    const benefits = getSocietyBenefits(30);
    expect(benefits.title).toBe('Gold Member');
    expect(benefits.xpBonusPercent).toBe(20);
    expect(benefits.dailyGemReward).toBe(3);
  });

  it('returns Platinum benefits at 60 days', () => {
    const benefits = getSocietyBenefits(60);
    expect(benefits.title).toBe('Platinum Member');
    expect(benefits.xpBonusPercent).toBe(30);
    expect(benefits.dailyGemReward).toBe(5);
  });

  it('returns Diamond benefits at 100 days', () => {
    const benefits = getSocietyBenefits(100);
    expect(benefits.title).toBe('Diamond Member');
    expect(benefits.xpBonusPercent).toBe(40);
    expect(benefits.dailyGemReward).toBe(10);
  });

  it('returns Eternal Flame at 365 days', () => {
    const benefits = getSocietyBenefits(365);
    expect(benefits.title).toBe('Eternal Flame');
    expect(benefits.xpBonusPercent).toBe(50);
    expect(benefits.dailyGemReward).toBe(15);
  });
});

// ─── Date Helper Tests ───

describe('daysBetween', () => {
  it('calculates days between dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-02')).toBe(1);
    expect(daysBetween('2024-01-01', '2024-01-08')).toBe(7);
    expect(daysBetween('2024-01-15', '2024-01-10')).toBe(-5);
  });
});

describe('isConsecutiveDay', () => {
  it('returns true for consecutive days', () => {
    expect(isConsecutiveDay('2024-01-01', '2024-01-02')).toBe(true);
  });

  it('returns false for same day', () => {
    expect(isConsecutiveDay('2024-01-01', '2024-01-01')).toBe(false);
  });

  it('returns false for gap days', () => {
    expect(isConsecutiveDay('2024-01-01', '2024-01-03')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isConsecutiveDay(null, '2024-01-02')).toBe(false);
  });
});

describe('hasOneDayGap', () => {
  it('returns true for exactly one day gap', () => {
    expect(hasOneDayGap('2024-01-01', '2024-01-03')).toBe(true);
  });

  it('returns false for consecutive days', () => {
    expect(hasOneDayGap('2024-01-01', '2024-01-02')).toBe(false);
  });

  it('returns false for larger gaps', () => {
    expect(hasOneDayGap('2024-01-01', '2024-01-05')).toBe(false);
  });
});

// ─── processDailyActivity Tests ───

describe('processDailyActivity', () => {
  it('starts new streak on first activity', () => {
    const state = makeState({ streakLastDate: null });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(1);
    expect(result.isNewStreak).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  it('increments streak on consecutive day', () => {
    const state = makeState({
      streakCount: 5,
      streakLastDate: '2024-01-14',
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(6);
    expect(result.streakIncreased).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  it('uses freeze on one-day gap', () => {
    const state = makeState({
      streakCount: 5,
      streakLastDate: '2024-01-13',
      freezesEquipped: 1,
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(6);
    expect(result.freezeConsumed).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  it('breaks streak on two-day gap without freeze', () => {
    const state = makeState({
      streakCount: 5,
      streakLastDate: '2024-01-13',
      freezesEquipped: 0,
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(1);
    expect(result.streakBroken).toBe(true);
  });

  it('breaks streak on large gap even with freeze', () => {
    const state = makeState({
      streakCount: 10,
      streakLastDate: '2024-01-01',
      freezesEquipped: 2,
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(1);
    expect(result.streakBroken).toBe(true);
  });

  it('is idempotent — no change if already active today', () => {
    const state = makeState({
      streakCount: 5,
      streakLastDate: '2024-01-15',
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(5);
    expect(result.streakIncreased).toBe(false);
  });

  it('detects milestone at day 7', () => {
    const state = makeState({
      streakCount: 6,
      streakLastDate: '2024-01-14',
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakCount).toBe(7);
    expect(result.newMilestoneReached).not.toBeNull();
    expect(result.newMilestoneReached?.day).toBe(7);
  });

  // ─── Wager Tests ───

  it('fails active wager when streak breaks', () => {
    const state = makeState({
      streakCount: 5,
      streakLastDate: '2024-01-10',
      activeWager: {
        id: 'wager-1',
        childId: 'test-child',
        wagerType: '7-day',
        gemsBet: 0,
        startDate: '2024-01-10',
        endDate: '2024-01-16',
        status: 'active',
        daysMaintained: 3,
        rewardGems: 50,
        createdAt: '2024-01-10',
      },
    });
    const result = processDailyActivity(state, '2024-01-15');

    expect(result.streakBroken).toBe(true);
    expect(result.wagerStatus).toBe('failed');
  });
});

// ─── Milestone Tests ───

describe('STREAK_MILESTONES', () => {
  it('contains all expected milestones', () => {
    const days = STREAK_MILESTONES.map(m => m.day);
    expect(days).toContain(1);
    expect(days).toContain(7);
    expect(days).toContain(30);
    expect(days).toContain(365);
  });

  it('has day 7 as freeze reward', () => {
    const m7 = STREAK_MILESTONES.find(m => m.day === 7);
    expect(m7?.rewardType).toBe('freeze');
    expect(m7?.rewardValue).toBe(1);
  });

  it('has day 365 as legendary chest', () => {
    const m365 = STREAK_MILESTONES.find(m => m.day === 365);
    expect(m365?.rewardType).toBe('chest');
    expect(m365?.rewardValue).toBe(500);
  });
});

describe('getNextMilestone', () => {
  it('returns day 1 for streak 0', () => {
    const m = getNextMilestone(0);
    expect(m?.day).toBe(1);
  });

  it('returns day 7 for streak 3', () => {
    const m = getNextMilestone(3);
    expect(m?.day).toBe(7);
  });

  it('returns null after day 365', () => {
    const m = getNextMilestone(400);
    expect(m).toBeNull();
  });
});

describe('getDaysUntilNextMilestone', () => {
  it('returns 1 for streak 0 to day 1', () => {
    expect(getDaysUntilNextMilestone(0)).toBe(1);
  });

  it('returns 4 for streak 3 to day 7', () => {
    expect(getDaysUntilNextMilestone(3)).toBe(4);
  });
});

describe('getReachedMilestones', () => {
  it('returns milestones up to streak count', () => {
    const reached = getReachedMilestones(7);
    expect(reached.length).toBe(3); // days 1, 3, 7
    expect(reached.map(m => m.day)).toEqual([1, 3, 7]);
  });
});

// ─── Freeze Management Tests ───

describe('equipFreeze', () => {
  it('succeeds when freezes available', () => {
    const state = makeState({ freezesAvailable: 2, freezesEquipped: 0 });
    const result = equipFreeze(state);
    expect(result.success).toBe(true);
  });

  it('fails when no freezes available', () => {
    const state = makeState({ freezesAvailable: 0 });
    const result = equipFreeze(state);
    expect(result.success).toBe(false);
  });

  it('fails when max equipped', () => {
    const state = makeState({ freezesAvailable: 1, freezesEquipped: 2 });
    const result = equipFreeze(state);
    expect(result.success).toBe(false);
  });
});

// ─── Wager Tests ───

describe('placeWager', () => {
  it('succeeds for 7-day wager with active streak', () => {
    const state = makeState({ streakCount: 5 });
    const result = placeWager(state, '7-day', '2024-01-15');

    expect(result.success).toBe(true);
    expect(result.wager?.wagerType).toBe('7-day');
    expect(result.wager?.rewardGems).toBe(50);
  });

  it('succeeds for 14-day wager with 14+ history', () => {
    const state = makeState({ streakCount: 10, longestStreak: 20 });
    const result = placeWager(state, '14-day', '2024-01-15');

    expect(result.success).toBe(true);
    expect(result.wager?.wagerType).toBe('14-day');
    expect(result.wager?.rewardGems).toBe(100);
  });

  it('fails for 14-day wager without history', () => {
    const state = makeState({ streakCount: 5, longestStreak: 5 });
    const result = placeWager(state, '14-day', '2024-01-15');

    expect(result.success).toBe(false);
  });

  it('fails with no streak', () => {
    const state = makeState({ streakCount: 0 });
    const result = placeWager(state, '7-day', '2024-01-15');

    expect(result.success).toBe(false);
  });
});

// ─── WAGER_CONFIG Tests ───

describe('WAGER_CONFIG', () => {
  it('has correct 7-day config', () => {
    expect(WAGER_CONFIG['7-day'].daysRequired).toBe(7);
    expect(WAGER_CONFIG['7-day'].rewardGems).toBe(50);
    expect(WAGER_CONFIG['7-day'].gemsBet).toBe(0);
  });

  it('has correct 14-day config', () => {
    expect(WAGER_CONFIG['14-day'].daysRequired).toBe(14);
    expect(WAGER_CONFIG['14-day'].rewardGems).toBe(100);
    expect(WAGER_CONFIG['14-day'].gemsBet).toBe(0);
  });
});

// ─── Streak Risk Tests ───

describe('isStreakAtRisk', () => {
  it('returns false when active today', () => {
    const today = getTodayUTC();
    expect(isStreakAtRisk(today, today)).toBe(false);
  });

  it('returns false with no streak', () => {
    expect(isStreakAtRisk(null, getTodayUTC())).toBe(false);
  });
});

describe('predictStreakRisk', () => {
  it('returns low for 6+ active days', () => {
    expect(predictStreakRisk([true, true, true, true, true, true, true])).toBe('low');
  });

  it('returns medium for 4-5 active days', () => {
    expect(predictStreakRisk([true, true, true, true, false, false, true])).toBe('medium');
  });

  it('returns high for inconsistent', () => {
    expect(predictStreakRisk([true, false, true, false, false, true, false])).toBe('high');
  });
});

// ─── Calendar Tests ───

describe('generateStreakCalendar', () => {
  it('generates 30 days', () => {
    const calendar = generateStreakCalendar([], 0, null, '2024-01-15');
    expect(calendar.length).toBe(30);
  });

  it('marks today correctly', () => {
    const today = getTodayUTC();
    const calendar = generateStreakCalendar([], 0, null, today);
    const todayEntry = calendar.find(d => d.isToday);
    expect(todayEntry).toBeDefined();
    expect(todayEntry?.isToday).toBe(true);
  });
});
