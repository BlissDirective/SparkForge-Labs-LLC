// ════════════════════════════════════════════════════
// Phase 10.5 — Analytics Engine (Advanced Analytics Dashboard)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  strengthBand,
  topicHeatmap,
  computeVelocity,
  xpPercentile,
  timeOnTaskSummary,
  generateInsight,
  getWeekMonday,
  type AnalyticsSnapshot,
} from '@/lib/analytics/AnalyticsEngine';

describe('topic strength', () => {
  it('bands by percent', () => {
    expect(strengthBand(0)).toBe('new');
    expect(strengthBand(20)).toBe('learning');
    expect(strengthBand(50)).toBe('strong');
    expect(strengthBand(80)).toBe('mastered');
  });

  it('builds a sorted heatmap', () => {
    const map = topicHeatmap({ 3: 90, 1: 10, 2: 55 });
    expect(map.map((t) => t.labId)).toEqual([1, 2, 3]);
    expect(map[0].band).toBe('new');
    expect(map[2].band).toBe('mastered');
  });
});

describe('learning velocity', () => {
  const snaps: AnalyticsSnapshot[] = [
    { weekStarting: '2026-05-04', xp: 100, timeMinutes: 60, gamesPlayed: 5 },
    { weekStarting: '2026-05-11', xp: 300, timeMinutes: 80, gamesPlayed: 8 },
    { weekStarting: '2026-05-18', xp: 700, timeMinutes: 90, gamesPlayed: 12 },
  ];

  it('derives weekly XP deltas, average and trend', () => {
    const v = computeVelocity(snaps);
    expect(v.weekly).toEqual([200, 400]);
    expect(v.average).toBe(300);
    expect(v.trend).toBe('up');
  });

  it('handles sparse data', () => {
    const v = computeVelocity([snaps[0]]);
    expect(v.weekly).toEqual([]);
    expect(v.average).toBe(0);
    expect(v.trend).toBe('flat');
  });

  it('is order-independent (sorts by week)', () => {
    const v = computeVelocity([snaps[2], snaps[0], snaps[1]]);
    expect(v.weekly).toEqual([200, 400]);
  });
});

describe('benchmark + time-on-task', () => {
  it('maps total XP to a percentile on the reference curve', () => {
    expect(xpPercentile(0)).toBe(5);
    expect(xpPercentile(600)).toBe(40);
    expect(xpPercentile(100000)).toBe(98);
  });

  it('summarizes time on task', () => {
    const t = timeOnTaskSummary([
      { weekStarting: 'a', xp: 0, timeMinutes: 60, gamesPlayed: 0 },
      { weekStarting: 'b', xp: 0, timeMinutes: 100, gamesPlayed: 0 },
    ]);
    expect(t.totalMinutes).toBe(160);
    expect(t.weeklyAvgMinutes).toBe(80);
  });
});

describe('insight generation', () => {
  it('produces a friendly summary referencing strengths', () => {
    const insight = generateInsight({
      childName: 'Robin',
      velocity: { weekly: [100, 300], average: 200, trend: 'up' },
      heatmap: topicHeatmap({ 1: 90, 2: 20 }),
      percentile: 70,
      labNames: { 1: 'What IS AI?', 2: 'Teaching AI' },
    });
    expect(insight).toMatch(/Robin/);
    expect(insight).toMatch(/accelerating/i);
    expect(insight).toMatch(/70%/);
    expect(insight).toMatch(/What IS AI\?/);
  });
});

describe('week helper', () => {
  it('returns a Monday ISO date', () => {
    const monday = getWeekMonday(new Date('2026-06-10T12:00:00Z')); // Wed
    expect(new Date(monday + 'T00:00:00Z').getUTCDay()).toBe(1);
  });
});
