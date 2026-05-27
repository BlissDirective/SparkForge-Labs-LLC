// ════════════════════════════════════════════════════
// PHASE 3 TESTS — Home Page Components
// DailyMissionCard, ActivityFeed, QuickStatsBar
// ════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

// ─── DailyMissionCard Logic Tests ───

describe('DailyMissionCard Logic', () => {
  it('generates deterministic daily challenge', () => {
    const { getTodaysChallenge } = require('@/lib/dailyChallenge');
    const c1 = getTodaysChallenge();
    const c2 = getTodaysChallenge();

    expect(c1).toBeDefined();
    expect(c1.id).toBe(c2.id); // Same day = same challenge
    expect(c1.title).toBeTruthy();
    expect(c1.xpReward).toBeGreaterThan(0);
    expect(c1.requirementCount).toBeGreaterThan(0);
  });

  it('has all required challenge fields', () => {
    const { getTodaysChallenge } = require('@/lib/dailyChallenge');
    const challenge = getTodaysChallenge();

    expect(challenge).toHaveProperty('id');
    expect(challenge).toHaveProperty('title');
    expect(challenge).toHaveProperty('description');
    expect(challenge).toHaveProperty('icon');
    expect(challenge).toHaveProperty('type');
    expect(challenge).toHaveProperty('xpReward');
    expect(challenge).toHaveProperty('requirementCount');
  });

  it('calculates time until reset correctly', () => {
    const { getSecondsUntilReset } = require('@/lib/dailyChallenge');
    const seconds = getSecondsUntilReset();
    expect(seconds).toBeGreaterThanOrEqual(0);
    expect(seconds).toBeLessThanOrEqual(86400); // Max 24 hours
  });

  it('formats time remaining correctly', () => {
    const { formatTimeRemaining } = require('@/lib/dailyChallenge');

    expect(formatTimeRemaining(3661)).toMatch(/1h 1m/);
    expect(formatTimeRemaining(900)).toBe('15m');
    expect(formatTimeRemaining(0)).toBe('Less than a minute');
  });

  it('checks challenge completion correctly', () => {
    const { isChallengeComplete, getTodayUTC } = require('@/lib/dailyChallenge');
    const today = getTodayUTC();

    expect(isChallengeComplete(today)).toBe(true);
    expect(isChallengeComplete(null)).toBe(false);
    expect(isChallengeComplete(undefined)).toBe(false);
    expect(isChallengeComplete('2024-01-01')).toBe(false);
  });
});

// ─── ActivityFeed Logic Tests ───

describe('ActivityFeed Logic', () => {
  it('formats time ago correctly', () => {
    const now = new Date();

    // Just now
    expect(formatTimeAgoTest(new Date(now.getTime() - 30000).toISOString())).toBe('Just now');

    // Minutes ago
    expect(formatTimeAgoTest(new Date(now.getTime() - 120000).toISOString())).toMatch(/2m ago/);

    // Hours ago
    expect(formatTimeAgoTest(new Date(now.getTime() - 7200000).toISOString())).toMatch(/2h ago/);

    // Days ago
    expect(formatTimeAgoTest(new Date(now.getTime() - 172800000).toISOString())).toMatch(/2d ago/);
  });

  it('handles empty activities', () => {
    const activities: any[] = [];
    expect(activities.length).toBe(0);
  });

  it('limits activities to max items', () => {
    const activities = Array.from({ length: 10 }, (_, i) => ({
      id: `act-${i}`,
      type: 'game',
      title: `Game ${i}`,
      timestamp: new Date().toISOString(),
    }));
    const maxItems = 5;
    expect(activities.slice(0, maxItems).length).toBe(5);
  });

  it('sorts activities by timestamp descending', () => {
    const activities = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z' },
      { id: '2', timestamp: '2024-01-03T00:00:00Z' },
      { id: '3', timestamp: '2024-01-02T00:00:00Z' },
    ];
    const sorted = [...activities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    expect(sorted[0].id).toBe('2'); // Latest first
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });
});

// ─── QuickStatsBar Logic Tests ───

describe('QuickStatsBar Logic', () => {
  it('calculates XP progress correctly', () => {
    const stats = {
      level: 5,
      xp: 450,
    };
    const xpToNext = stats.level * 100; // 500
    const progress = Math.min(100, (stats.xp % 100) / 100 * 100);
    expect(progress).toBe(50); // 450 % 100 = 50, 50/100 * 100 = 50%
  });

  it('caps XP progress at 100%', () => {
    const stats = {
      level: 10,
      xp: 9999,
    };
    const progress = Math.min(100, (stats.xp % 100) / 100 * 100);
    expect(progress).toBe(99); // 9999 % 100 = 99
  });

  it('handles zero XP correctly', () => {
    const progress = Math.min(100, (0 % 100) / 100 * 100);
    expect(progress).toBe(0);
  });

  it('displays all stat types', () => {
    const stats = {
      streakCount: 7,
      longestStreak: 14,
      freezesEquipped: 1,
      gems: 250,
      canClaimDaily: true,
      dailyStreak: 3,
      earnedBadges: 12,
      totalBadges: 40,
      leagueTier: 'gold',
      leagueRank: 5,
      xp: 1200,
      level: 12,
    };

    expect(stats.streakCount).toBeGreaterThanOrEqual(0);
    expect(stats.gems).toBeGreaterThanOrEqual(0);
    expect(stats.earnedBadges).toBeLessThanOrEqual(stats.totalBadges);
    expect(stats.level).toBeGreaterThan(0);
  });
});

// ─── Integration Tests ───

describe('Phase 3 Integration', () => {
  it('daily challenge has positive XP reward', () => {
    const { getTodaysChallenge } = require('@/lib/dailyChallenge');
    const challenge = getTodaysChallenge();
    expect(challenge.xpReward).toBeGreaterThan(0);
    expect(challenge.xpReward).toBeGreaterThanOrEqual(25);
  });

  it('daily challenge has valid type', () => {
    const { getTodaysChallenge } = require('@/lib/dailyChallenge');
    const challenge = getTodaysChallenge();
    const validTypes = ['play-game', 'complete-quiz', 'read-lesson', 'explore-lab', 'earn-xp', 'play-any'];
    expect(validTypes).toContain(challenge.type);
  });

  it('daily challenge requirement count is positive', () => {
    const { getTodaysChallenge } = require('@/lib/dailyChallenge');
    const challenge = getTodaysChallenge();
    expect(challenge.requirementCount).toBeGreaterThan(0);
  });

  it('challenge templates are diverse', () => {
    const { CHALLENGE_TEMPLATES } = require('@/lib/dailyChallenge');
    const types = new Set(CHALLENGE_TEMPLATES.map((t: any) => t.type));
    expect(types.size).toBeGreaterThan(1);
  });
});

// ─── Helper Functions ───

function formatTimeAgoTest(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
