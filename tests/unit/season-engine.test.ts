// ════════════════════════════════════════════════════
// Phase 9 — Season Engine (Seasonal Content Engine)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  SEASONS,
  getActiveSeason,
  getSeason,
  getSeasonWeek,
  getSeasonalQuests,
  getSeasonalItems,
  isItemAvailable,
  emptyProgress,
  isQuestComplete,
  isQuestClaimed,
  canClaimQuest,
  seasonProgressPercent,
  allQuestsComplete,
  canAfford,
  canClaimGrandPrize,
  getSeasonGreeting,
  type SeasonProgress,
} from '@/lib/seasons/SeasonEngine';

describe('season calendar', () => {
  it('defines 7 seasons with unique keys', () => {
    expect(SEASONS).toHaveLength(7);
    expect(new Set(SEASONS.map((s) => s.key)).size).toBe(7);
  });

  it('resolves the active season by date', () => {
    // Mid-summer
    expect(getActiveSeason(new Date('2026-07-04T12:00:00Z'))?.key).toBe('summer-explorer');
    // Halloween
    expect(getActiveSeason(new Date('2026-10-20T12:00:00Z'))?.key).toBe('halloween');
    // Off-season gap (late April)
    expect(getActiveSeason(new Date('2026-04-25T12:00:00Z'))).toBeNull();
  });

  it('computes a 1-based week within the season', () => {
    const summer = getSeason('summer-explorer')!;
    expect(getSeasonWeek(summer, new Date('2026-06-01T00:00:00Z'))).toBe(1);
    expect(getSeasonWeek(summer, new Date('2026-06-08T00:00:00Z'))).toBe(2);
  });
});

describe('seasonal quests', () => {
  it('builds a 5-quest chain per season', () => {
    const q = getSeasonalQuests('summer-explorer');
    expect(q).toHaveLength(5);
    expect(q.every((x) => x.requirementCount > 0 && x.currencyReward > 0)).toBe(true);
  });

  it('tracks completion, claim eligibility and percent', () => {
    const quests = getSeasonalQuests('summer-explorer');
    const p = emptyProgress('summer-explorer', 'child-1');
    expect(seasonProgressPercent('summer-explorer', p)).toBe(0);

    // Complete the first quest.
    p.questProgress[quests[0].id] = quests[0].requirementCount;
    expect(isQuestComplete(quests[0], p)).toBe(true);
    expect(canClaimQuest(quests[0], p)).toBe(true);
    expect(seasonProgressPercent('summer-explorer', p)).toBe(20);

    // Claim it.
    p.claimedQuests.push(quests[0].id);
    expect(isQuestClaimed(quests[0], p)).toBe(true);
    expect(canClaimQuest(quests[0], p)).toBe(false);
  });

  it('detects all-complete + grand prize eligibility', () => {
    const quests = getSeasonalQuests('summer-explorer');
    const p: SeasonProgress = emptyProgress('summer-explorer', 'child-1');
    for (const q of quests) p.questProgress[q.id] = q.requirementCount;
    expect(allQuestsComplete('summer-explorer', p)).toBe(true);
    expect(canClaimGrandPrize('summer-explorer', p)).toBe(true);
    p.grandPrizeClaimed = true;
    expect(canClaimGrandPrize('summer-explorer', p)).toBe(false);
  });
});

describe('seasonal shop', () => {
  it('builds rotating items gated by week', () => {
    const items = getSeasonalItems('summer-explorer');
    expect(items.length).toBeGreaterThan(0);
    const week1 = items.find((i) => i.weekAvailable === 1)!;
    const week3 = items.find((i) => i.weekAvailable === 3)!;
    expect(isItemAvailable(week1, 1)).toBe(true);
    expect(isItemAvailable(week3, 1)).toBe(false);
    expect(isItemAvailable(week3, 3)).toBe(true);
  });

  it('enforces affordability and one-time purchase', () => {
    const items = getSeasonalItems('summer-explorer');
    const item = items[0];
    const p = emptyProgress('summer-explorer', 'child-1');
    expect(canAfford(item, p)).toBe(false); // 0 currency
    p.currency = item.cost;
    expect(canAfford(item, p)).toBe(true);
    p.purchases.push(item.id);
    expect(canAfford(item, p)).toBe(false); // already owned
  });
});

describe('greetings', () => {
  it('adapts to season state', () => {
    expect(getSeasonGreeting(null, 0)).toMatch(/no seasonal event/i);
    const summer = getSeason('summer-explorer')!;
    expect(getSeasonGreeting(summer, 0)).toMatch(/is here/i);
    expect(getSeasonGreeting(summer, 100)).toMatch(/grand prize/i);
  });
});
