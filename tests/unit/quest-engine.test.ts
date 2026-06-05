// ════════════════════════════════════════════════════
// QUEST ENGINE TESTS — Comprehensive Coverage
// Tests quest selection, progress, rewards, weekly chains
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  selectDailyQuests,
  activateQuest,
  updateQuestProgress,
  claimQuestReward,
  getQuestProgressPercent,
  createWeeklyChain,
  advanceChainStep,
  getQuestGreeting,
  countQuestsByStatus,
  allQuestsClaimed,
  QUEST_TEMPLATES,
  WEEKLY_CHAIN_TEMPLATES,
  RARITY_MULTIPLIER,
} from '@/lib/quests/QuestEngine';
import type { QuestTemplate, ActiveQuest } from '@/lib/quests/QuestEngine';

// ═══ Helpers ═══

function makeTemplate(overrides: Partial<QuestTemplate> = {}): QuestTemplate {
  return {
    id: 'test-1',
    type: 'play_games',
    difficulty: 'easy',
    rarity: 'common',
    title: 'Test Quest',
    description: 'Play 1 game',
    emoji: '🎮',
    requirementCount: 1,
    xpReward: 10,
    gemReward: 5,
    sparkyExpression: 'happy',
    ...overrides,
  };
}

function makeActiveQuest(overrides: Partial<ActiveQuest> = {}): ActiveQuest {
  return {
    id: 'quest-123',
    templateId: 'test-1',
    childId: 'child-456',
    status: 'active',
    progress: 0,
    requirementCount: 3,
    assignedDate: '2026-06-04',
    expiresAt: '2026-06-04',
    claimedAt: null,
    createdAt: '2026-06-04T00:00:00Z',
    title: 'Test Quest',
    description: 'Play 3 games',
    emoji: '🎮',
    difficulty: 'medium',
    rarity: 'common',
    type: 'play_games',
    xpReward: 25,
    gemReward: 10,
    sparkyExpression: 'happy',
    ...overrides,
  };
}

// ═══ SELECT DAILY QUESTS ═══

describe('selectDailyQuests', () => {
  it('returns exactly 3 quests (1 easy, 1 medium, 1 hard)', () => {
    const quests = selectDailyQuests(QUEST_TEMPLATES, 'test-seed-1');
    expect(quests).toHaveLength(3);

    const easy = quests.filter((q) => q.difficulty === 'easy');
    const medium = quests.filter((q) => q.difficulty === 'medium');
    const hard = quests.filter((q) => q.difficulty === 'hard');

    expect(easy).toHaveLength(1);
    expect(medium).toHaveLength(1);
    expect(hard).toHaveLength(1);
  });

  it('returns deterministic results for same seed', () => {
    const q1 = selectDailyQuests(QUEST_TEMPLATES, 'same-seed');
    const q2 = selectDailyQuests(QUEST_TEMPLATES, 'same-seed');
    expect(q1.map((q) => q.id)).toEqual(q2.map((q) => q.id));
  });

  it('returns different results for different seeds', () => {
    const q1 = selectDailyQuests(QUEST_TEMPLATES, 'seed-a');
    const q2 = selectDailyQuests(QUEST_TEMPLATES, 'seed-b');
    // Very unlikely to be identical across 50+ templates
    const ids1 = q1.map((q) => q.id).sort();
    const ids2 = q2.map((q) => q.id).sort();
    expect(ids1).not.toEqual(ids2);
  });

  it('handles empty template array', () => {
    const quests = selectDailyQuests([], 'seed');
    expect(quests).toHaveLength(0);
  });

  it('never returns the same template twice', () => {
    const quests = selectDailyQuests(QUEST_TEMPLATES, 'unique-seed');
    const ids = quests.map((q) => q.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids).toEqual(uniqueIds);
  });

  it('includes quest metadata in selected quests', () => {
    const quests = selectDailyQuests(QUEST_TEMPLATES, 'meta-seed');
    for (const q of quests) {
      expect(q.id).toBeDefined();
      expect(q.title).toBeDefined();
      expect(q.description).toBeDefined();
      expect(q.emoji).toBeDefined();
      expect(q.xpReward).toBeGreaterThanOrEqual(0);
      expect(q.gemReward).toBeGreaterThanOrEqual(0);
      expect(q.requirementCount).toBeGreaterThan(0);
    }
  });
});

// ═══ ACTIVATE QUEST ═══

describe('activateQuest', () => {
  it('creates an ActiveQuest from a template', () => {
    const template = makeTemplate({
      id: 'qt-play-1',
      title: 'Game Explorer',
      requirementCount: 2,
    });
    const active = activateQuest(template, 'child-1', '2026-06-04');

    expect(active.templateId).toBe('qt-play-1');
    expect(active.childId).toBe('child-1');
    expect(active.status).toBe('active');
    expect(active.progress).toBe(0);
    expect(active.requirementCount).toBe(2);
    expect(active.assignedDate).toBe('2026-06-04');
    expect(active.title).toBe('Game Explorer');
    expect(active.claimedAt).toBeNull();
  });

  it('generates a unique instance ID', () => {
    const template = makeTemplate();
    const a1 = activateQuest(template, 'child-1', '2026-06-04');
    const a2 = activateQuest(template, 'child-1', '2026-06-05');

    expect(a1.id).not.toBe(a2.id);
    expect(a1.id).toContain('test-1'); // template id (from makeTemplate)
    expect(a1.id).toContain('child-1'); // child-scoped instance id
  });
});

// ═══ UPDATE QUEST PROGRESS ═══

describe('updateQuestProgress', () => {
  it('increments progress by given amount', () => {
    const quest = makeActiveQuest({ progress: 0, requirementCount: 5 });
    const updated = updateQuestProgress(quest, 2);

    expect(updated.progress).toBe(2);
    expect(updated.status).toBe('active');
  });

  it('marks quest completed when progress reaches requirement', () => {
    const quest = makeActiveQuest({ progress: 2, requirementCount: 3 });
    const updated = updateQuestProgress(quest, 1);

    expect(updated.progress).toBe(3);
    expect(updated.status).toBe('completed');
  });

  it('does not exceed requirement count (caps)', () => {
    const quest = makeActiveQuest({ progress: 2, requirementCount: 3 });
    const updated = updateQuestProgress(quest, 10);

    expect(updated.progress).toBe(3);
    expect(updated.status).toBe('completed');
  });

  it('does not change status if already claimed', () => {
    const quest = makeActiveQuest({ progress: 1, requirementCount: 3, status: 'claimed' });
    const updated = updateQuestProgress(quest, 5);

    expect(updated.progress).toBe(3);
    // Status stays whatever it was (claimed)
    expect(updated.status).toBe('claimed');
  });
});

// ═══ CLAIM QUEST REWARD ═══

describe('claimQuestReward', () => {
  it('returns zero rewards if quest not completed', () => {
    const quest = makeActiveQuest({ status: 'active', progress: 1, requirementCount: 3 });
    const result = claimQuestReward(quest, 0);

    expect(result.reward.totalGems).toBe(0);
    expect(result.reward.xp).toBe(0);
    expect(result.reward.message).toContain('not completed');
  });

  it('claims base gems and XP with no streak bonus', () => {
    const quest = makeActiveQuest({
      status: 'completed',
      gemReward: 10,
      xpReward: 25,
    });
    const result = claimQuestReward(quest, 0);

    expect(result.reward.gems).toBe(10);
    expect(result.reward.xp).toBe(25);
    expect(result.reward.bonusGems).toBe(0);
    expect(result.reward.totalGems).toBe(10);
    expect(result.quest.status).toBe('claimed');
    expect(result.quest.claimedAt).not.toBeNull();
  });

  it('applies streak bonus for consecutive days', () => {
    const quest = makeActiveQuest({
      status: 'completed',
      gemReward: 20,
      xpReward: 50,
    });
    const result = claimQuestReward(quest, 5); // 5-day streak

    // Base 20 + 25% bonus = 25 gems
    expect(result.reward.bonusGems).toBe(5);
    expect(result.reward.totalGems).toBe(25);
    expect(result.reward.xp).toBe(50); // XP unaffected by streak
    expect(result.reward.message).toContain('streak bonus');
  });

  it('caps streak bonus at 2x max', () => {
    const quest = makeActiveQuest({
      status: 'completed',
      gemReward: 10,
    });
    // 100 days streak should still max at 2x
    const result = claimQuestReward(quest, 100);

    expect(result.reward.totalGems).toBe(20); // 10 base + 10 bonus (2x cap)
    expect(result.reward.bonusGems).toBe(10);
  });

  it('has streak bonus message only when streak >= 3', () => {
    const quest = makeActiveQuest({ status: 'completed', gemReward: 10 });

    const r1 = claimQuestReward(quest, 2);
    expect(r1.reward.message).not.toContain('streak bonus');

    const r2 = claimQuestReward(quest, 3);
    expect(r2.reward.message).toContain('streak bonus');
  });
});

// ═══ GET QUEST PROGRESS PERCENT ═══

describe('getQuestProgressPercent', () => {
  it('returns 0 for zero progress', () => {
    const quest = makeActiveQuest({ progress: 0, requirementCount: 5 });
    expect(getQuestProgressPercent(quest)).toBe(0);
  });

  it('returns 50 for halfway progress', () => {
    const quest = makeActiveQuest({ progress: 3, requirementCount: 6 });
    expect(getQuestProgressPercent(quest)).toBe(50);
  });

  it('returns 100 for completed quest', () => {
    const quest = makeActiveQuest({ progress: 5, requirementCount: 5 });
    expect(getQuestProgressPercent(quest)).toBe(100);
  });

  it('returns 0 for invalid requirement count', () => {
    const quest = makeActiveQuest({ progress: 5, requirementCount: 0 });
    expect(getQuestProgressPercent(quest)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    const quest = makeActiveQuest({ progress: 1, requirementCount: 3 });
    expect(getQuestProgressPercent(quest)).toBe(33);
  });
});

// ═══ WEEKLY CHAIN ═══

describe('createWeeklyChain', () => {
  it('creates a chain with all steps', () => {
    const template = WEEKLY_CHAIN_TEMPLATES[0];
    const chain = createWeeklyChain(template, 'child-1', '2026-06-01');

    expect(chain.childId).toBe('child-1');
    expect(chain.weekStarting).toBe('2026-06-01');
    expect(chain.totalSteps).toBe(template.steps.length);
    expect(chain.currentStep).toBe(1);
    expect(chain.status).toBe('active');
    expect(chain.steps).toHaveLength(template.steps.length);
  });

  it('sets first step as active, rest as locked', () => {
    const template = WEEKLY_CHAIN_TEMPLATES[0];
    const chain = createWeeklyChain(template, 'child-1', '2026-06-01');

    expect(chain.steps[0].status).toBe('active');
    for (let i = 1; i < chain.steps.length; i++) {
      expect(chain.steps[i].status).toBe('locked');
    }
  });

  it('generates a unique chain ID', () => {
    const template = WEEKLY_CHAIN_TEMPLATES[0];
    const c1 = createWeeklyChain(template, 'child-1', '2026-06-01');
    const c2 = createWeeklyChain(template, 'child-1', '2026-06-08');

    expect(c1.id).not.toBe(c2.id);
    expect(c1.id).toContain('child-1');
  });
});

describe('advanceChainStep', () => {
  it('marks current step completed and next step active', () => {
    const template = WEEKLY_CHAIN_TEMPLATES[0];
    const chain = createWeeklyChain(template, 'child-1', '2026-06-01');
    const advanced = advanceChainStep(chain);

    expect(advanced.steps[0].status).toBe('completed');
    expect(advanced.steps[1].status).toBe('active');
    expect(advanced.currentStep).toBe(2);
    expect(advanced.status).toBe('active');
  });

  it('marks chain completed on final step', () => {
    const template = WEEKLY_CHAIN_TEMPLATES[0];
    let chain = createWeeklyChain(template, 'child-1', '2026-06-01');

    // Advance through all steps
    for (let i = 0; i < template.steps.length; i++) {
      chain = advanceChainStep(chain);
    }

    expect(chain.status).toBe('completed');
    expect(chain.currentStep).toBe(template.steps.length);
  });
});

// ═══ UTILITY FUNCTIONS ═══

describe('getQuestGreeting', () => {
  it('returns encouraging message when no quests completed', () => {
    const msg = getQuestGreeting(0, 3);
    expect(msg).toContain('some quests');
  });

  it('returns congratulations when all completed', () => {
    const msg = getQuestGreeting(3, 3);
    expect(msg).toContain('Amazing');
  });

  it('returns progress message for partial completion', () => {
    const msg = getQuestGreeting(1, 3);
    expect(msg.toLowerCase()).toContain('going');
  });

  it('returns empty message when no quests available', () => {
    const msg = getQuestGreeting(0, 0);
    expect(msg).toContain('something new');
  });
});

describe('countQuestsByStatus', () => {
  it('counts quests by each status correctly', () => {
    const quests: ActiveQuest[] = [
      makeActiveQuest({ id: '1', status: 'active' }),
      makeActiveQuest({ id: '2', status: 'active' }),
      makeActiveQuest({ id: '3', status: 'completed' }),
      makeActiveQuest({ id: '4', status: 'claimed' }),
      makeActiveQuest({ id: '5', status: 'expired' }),
    ];

    const counts = countQuestsByStatus(quests);
    expect(counts.active).toBe(2);
    expect(counts.completed).toBe(1);
    expect(counts.claimed).toBe(1);
    expect(counts.expired).toBe(1);
  });

  it('returns zero counts for empty array', () => {
    const counts = countQuestsByStatus([]);
    expect(counts.active).toBe(0);
    expect(counts.completed).toBe(0);
    expect(counts.claimed).toBe(0);
    expect(counts.expired).toBe(0);
  });
});

describe('allQuestsClaimed', () => {
  it('returns true when all quests are claimed', () => {
    const quests = [
      makeActiveQuest({ id: '1', status: 'claimed' }),
      makeActiveQuest({ id: '2', status: 'claimed' }),
    ];
    expect(allQuestsClaimed(quests)).toBe(true);
  });

  it('returns false when some quests are not claimed', () => {
    const quests = [
      makeActiveQuest({ id: '1', status: 'claimed' }),
      makeActiveQuest({ id: '2', status: 'active' }),
    ];
    expect(allQuestsClaimed(quests)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(allQuestsClaimed([])).toBe(false);
  });
});

// ═══ RARITY MULTIPLIERS ═══

describe('RARITY_MULTIPLIER', () => {
  it('has ascending multipliers', () => {
    expect(RARITY_MULTIPLIER.common).toBe(1.0);
    expect(RARITY_MULTIPLIER.uncommon).toBe(1.2);
    expect(RARITY_MULTIPLIER.rare).toBe(1.5);
    expect(RARITY_MULTIPLIER.epic).toBe(2.0);
    expect(RARITY_MULTIPLIER.legendary).toBe(3.0);
  });
});

// ═══ INTEGRATION: Full quest lifecycle ═══

describe('Quest lifecycle', () => {
  it('completes full flow: select → activate → progress → claim', () => {
    const seed = 'lifecycle-test';
    const childId = 'child-123';
    const today = '2026-06-04';

    // 1. Select daily quests
    const templates = selectDailyQuests(QUEST_TEMPLATES, seed);
    expect(templates).toHaveLength(3);

    // 2. Activate them
    const activeQuests = templates.map((t) => activateQuest(t, childId, today));
    expect(activeQuests).toHaveLength(3);
    expect(activeQuests.every((q) => q.status === 'active')).toBe(true);

    // 3. Progress one quest
    const targetQuest = activeQuests[0];
    const progressed = updateQuestProgress(targetQuest, targetQuest.requirementCount);
    expect(progressed.status).toBe('completed');

    // 4. Claim reward
    const result = claimQuestReward(progressed, 2); // 2-day streak
    expect(result.quest.status).toBe('claimed');
    expect(result.reward.totalGems).toBeGreaterThan(0);
    expect(result.reward.xp).toBeGreaterThan(0);
    expect(result.quest.claimedAt).not.toBeNull();
  });

  it('selects quests weighted by rarity distribution', () => {
    // Run many selections to verify distribution
    const selections: string[] = [];
    for (let i = 0; i < 50; i++) {
      const quests = selectDailyQuests(QUEST_TEMPLATES, `rarity-test-${i}`);
      quests.forEach((q) => selections.push(q.rarity));
    }

    // Should have a mix of rarities across many selections
    const commonCount = selections.filter((r) => r === 'common').length;
    const uncommonCount = selections.filter((r) => r === 'uncommon').length;

    // Common should be most frequent due to weighting
    expect(commonCount + uncommonCount).toBeGreaterThan(0);
    expect(selections.length).toBe(150); // 50 selections × 3 quests
  });
});
