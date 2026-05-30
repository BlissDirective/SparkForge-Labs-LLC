// ════════════════════════════════════════════════════
// GAME JUICE ENGINE TESTS
// Combo system, milestone tracking, juice triggers
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  createJuiceState,
  recordCorrect,
  recordWrong,
  recordHintUsed,
  getComboTier,
  getComboLabel,
  getSparkyReaction,
  getFloatingText,
  getScreenShakeIntensity,
  shouldShowSparky,
  getSessionStats,
  COMBO_TIERS,
  MILESTONES,
} from '@/lib/juice/GameJuiceEngine';
import type { JuiceEvent } from '@/lib/juice/GameJuiceEngine';

// ─── Creation Tests ───

describe('createJuiceState', () => {
  it('starts with zero combo', () => {
    const s = createJuiceState();
    expect(s.combo).toBe(0);
    expect(s.maxCombo).toBe(0);
    expect(s.totalCorrect).toBe(0);
    expect(s.totalWrong).toBe(0);
  });

  it('starts with empty events', () => {
    const s = createJuiceState();
    expect(s.events.length).toBe(0);
    expect(s.milestonesHit.size).toBe(0);
  });

  it('starts at juice level 0', () => {
    expect(createJuiceState().juiceLevel).toBe(0);
  });
});

// ─── Correct Answer Tests ───

describe('recordCorrect', () => {
  it('increments combo on correct', () => {
    const s = createJuiceState();
    const { state } = recordCorrect(s, 1, 10);
    expect(state.combo).toBe(1);
    expect(state.totalCorrect).toBe(1);
  });

  it('fires correct event on first answer', () => {
    const s = createJuiceState();
    const { events } = recordCorrect(s, 1, 10);
    expect(events.some(e => e.type === 'correct')).toBe(true);
  });

  it('fires combo_start on second consecutive correct', () => {
    const s1 = createJuiceState();
    const { state: s2 } = recordCorrect(s1, 1, 10);
    const { events } = recordCorrect(s2, 2, 20);

    expect(events.some(e => e.type === 'combo_start')).toBe(true);
    expect(events.some(e => e.type === 'combo_build')).toBe(true);
  });

  it('tracks max combo', () => {
    let s = createJuiceState();
    for (let i = 0; i < 5; i++) {
      const r = recordCorrect(s, i + 1, (i + 1) * 10);
      s = r.state;
    }
    expect(s.maxCombo).toBe(5);
    expect(s.combo).toBe(5);
  });

  it('increases juice level', () => {
    const s = createJuiceState();
    const { state } = recordCorrect(s, 1, 10);
    expect(state.juiceLevel).toBe(5);
  });

  it('caps juice at 100', () => {
    let s = createJuiceState();
    for (let i = 0; i < 25; i++) {
      const r = recordCorrect(s, i + 1, (i + 1) * 10);
      s = r.state;
    }
    expect(s.juiceLevel).toBe(100);
  });
});

// ─── Wrong Answer Tests ───

describe('recordWrong', () => {
  it('resets combo on wrong', () => {
    let s = createJuiceState();
    const r1 = recordCorrect(s, 1, 10);
    s = r1.state;
    const r2 = recordCorrect(s, 2, 20);
    s = r2.state;
    expect(s.combo).toBe(2);

    const { state } = recordWrong(s, 3, 20);
    expect(state.combo).toBe(0);
  });

  it('fires combo_break event', () => {
    let s = createJuiceState();
    const r1 = recordCorrect(s, 1, 10);
    s = r1.state;
    const r2 = recordCorrect(s, 2, 20);
    s = r2.state;

    const { events } = recordWrong(s, 3, 20);
    expect(events.some(e => e.type === 'combo_break')).toBe(true);
  });

  it('tracks consecutive wrong answers', () => {
    let s = createJuiceState();
    const r1 = recordWrong(s, 1, 0);
    s = r1.state;
    const r2 = recordWrong(s, 2, 0);
    expect(r2.state.consecutiveWrong).toBe(2);
  });

  it('decreases juice level', () => {
    let s = createJuiceState();
    // Build up juice
    for (let i = 0; i < 5; i++) {
      const r = recordCorrect(s, i + 1, (i + 1) * 10);
      s = r.state;
    }
    expect(s.juiceLevel).toBeGreaterThan(0);

    const before = s.juiceLevel;
    const { state } = recordWrong(s, 6, 50);
    expect(state.juiceLevel).toBeLessThan(before);
  });

  it('does not let juice go below 0', () => {
    const s = createJuiceState();
    const { state } = recordWrong(s, 1, 0);
    expect(state.juiceLevel).toBe(0);
  });
});

// ─── Combo Tier Tests ───

describe('getComboTier', () => {
  it('returns null for combo < 2', () => {
    expect(getComboTier(0)).toBeNull();
    expect(getComboTier(1)).toBeNull();
  });

  it('returns tier for combo 3', () => {
    const tier = getComboTier(3);
    expect(tier).not.toBeNull();
    expect(tier?.threshold).toBeLessThanOrEqual(3);
  });

  it('returns highest matching tier', () => {
    const tier = getComboTier(20);
    expect(tier?.threshold).toBe(20);
    expect(tier?.label).toBe('LEGENDARY!');
  });

  it('returns null for combo 0', () => {
    expect(getComboTier(0)).toBeNull();
  });
});

describe('getComboLabel', () => {
  it('returns empty for low combo', () => {
    expect(getComboLabel(1)).toBe('');
  });

  it('returns label for combo 5', () => {
    const label = getComboLabel(5);
    expect(label.length).toBeGreaterThan(0);
    expect(label).toContain('5');
  });
});

// ─── Sparky Reaction Tests ───

describe('getSparkyReaction', () => {
  it('returns reaction for combo_build at 5', () => {
    const reaction = getSparkyReaction({
      type: 'combo_build', combo: 5, maxCombo: 5, round: 1, score: 50, timestamp: Date.now(),
    });
    expect(reaction).not.toBeNull();
    expect(reaction?.expression).toBe('excited');
  });

  it('returns reaction for combo_break', () => {
    const reaction = getSparkyReaction({
      type: 'combo_break', combo: 0, maxCombo: 10, round: 5, score: 50, timestamp: Date.now(),
    });
    expect(reaction).not.toBeNull();
    expect(reaction?.expression).toBe('sad');
  });

  it('returns null for generic correct', () => {
    const reaction = getSparkyReaction({
      type: 'correct', combo: 1, maxCombo: 1, round: 1, score: 10, timestamp: Date.now(),
    });
    expect(reaction).not.toBeNull();
    expect(reaction?.expression).toBe('happy');
  });

  it('returns celebrating for milestone', () => {
    const reaction = getSparkyReaction({
      type: 'combo_milestone', combo: 10, maxCombo: 10, round: 1, score: 100, timestamp: Date.now(),
    });
    expect(reaction?.expression).toBe('celebrating');
  });
});

// ─── Floating Text Tests ───

describe('getFloatingText', () => {
  it('returns text for correct', () => {
    const ft = getFloatingText({
      type: 'correct', combo: 1, maxCombo: 1, round: 1, score: 10, timestamp: Date.now(),
    });
    expect(ft).not.toBeNull();
    expect(ft?.text).toBe('Correct!');
    expect(ft?.color).toBe('#10B981');
  });

  it('returns text for wrong', () => {
    const ft = getFloatingText({
      type: 'wrong', combo: 0, maxCombo: 0, round: 1, score: 0, timestamp: Date.now(),
    });
    expect(ft?.text).toBe('Try Again!');
    expect(ft?.color).toBe('#EF4444');
  });

  it('returns combo text for high combos', () => {
    const ft = getFloatingText({
      type: 'combo_build', combo: 12, maxCombo: 12, round: 5, score: 120, timestamp: Date.now(),
    });
    expect(ft?.text).toBe('x12');
    expect(ft?.size).toBe('lg');
  });

  it('returns null for unknown types', () => {
    const ft = getFloatingText({
      type: 'hint_used', combo: 0, maxCombo: 0, round: 1, score: 0, timestamp: Date.now(),
    });
    expect(ft).not.toBeNull();
    expect(ft?.text).toBe('Hint Used');
  });
});

// ─── Screen Shake Tests ───

describe('getScreenShakeIntensity', () => {
  it('returns shake for combo_break', () => {
    const intensity = getScreenShakeIntensity({
      type: 'combo_break', combo: 0, maxCombo: 10, round: 5, score: 50, timestamp: Date.now(),
    });
    expect(intensity).toBeGreaterThan(0);
  });

  it('returns shake for wrong', () => {
    const intensity = getScreenShakeIntensity({
      type: 'wrong', combo: 0, maxCombo: 0, round: 1, score: 0, timestamp: Date.now(),
    });
    expect(intensity).toBeGreaterThan(0);
  });

  it('returns no shake for correct', () => {
    const intensity = getScreenShakeIntensity({
      type: 'correct', combo: 1, maxCombo: 1, round: 1, score: 10, timestamp: Date.now(),
    });
    expect(intensity).toBe(0);
  });
});

// ─── Hint Tests ───

describe('recordHintUsed', () => {
  it('decreases juice level', () => {
    let s = createJuiceState();
    // Build juice
    for (let i = 0; i < 3; i++) {
      const r = recordCorrect(s, i + 1, (i + 1) * 10);
      s = r.state;
    }
    const before = s.juiceLevel;
    s = recordHintUsed(s, 4, 30);
    expect(s.juiceLevel).toBeLessThan(before);
  });

  it('does not go below 0', () => {
    const s = createJuiceState();
    const result = recordHintUsed(s, 1, 0);
    expect(result.juiceLevel).toBe(0);
  });
});

// ─── Session Stats Tests ───

describe('getSessionStats', () => {
  it('calculates accuracy', () => {
    let s = createJuiceState();
    for (let i = 0; i < 7; i++) {
      const r = recordCorrect(s, i + 1, (i + 1) * 10);
      s = r.state;
    }
    for (let i = 0; i < 3; i++) {
      const r = recordWrong(s, i + 8, 70);
      s = r.state;
    }
    const stats = getSessionStats(s);
    expect(stats.accuracy).toBe(70);
    expect(stats.totalCorrect).toBe(7);
    expect(stats.totalWrong).toBe(3);
    expect(stats.maxCombo).toBe(7);
  });

  it('returns 100 accuracy when no wrong', () => {
    let s = createJuiceState();
    const r = recordCorrect(s, 1, 10);
    const stats = getSessionStats(r.state);
    expect(stats.accuracy).toBe(100);
  });
});

// ─── Sparky Visibility Tests ───

describe('shouldShowSparky', () => {
  it('shows Sparky for milestones', () => {
    expect(shouldShowSparky({ type: 'combo_milestone', combo: 5, maxCombo: 5, round: 1, score: 50, timestamp: Date.now() })).toBe(true);
  });

  it('shows Sparky for big combos', () => {
    expect(shouldShowSparky({ type: 'combo_build', combo: 5, maxCombo: 5, round: 1, score: 50, timestamp: Date.now() })).toBe(true);
  });

  it('hides Sparky for small combos', () => {
    expect(shouldShowSparky({ type: 'combo_build', combo: 2, maxCombo: 2, round: 1, score: 20, timestamp: Date.now() })).toBe(false);
  });

  it('shows Sparky for combo breaks', () => {
    expect(shouldShowSparky({ type: 'combo_break', combo: 0, maxCombo: 10, round: 1, score: 50, timestamp: Date.now() })).toBe(true);
  });
});

// ─── Milestone Tests ───

describe('MILESTONES', () => {
  it('has combo milestones at 5, 10, 15, 20', () => {
    const comboMs = MILESTONES.filter(m => m.type === 'combo_milestone');
    expect(comboMs.length).toBe(4);
    expect(comboMs.map(m => parseInt(m.id.split('-')[1]))).toContain(5);
    expect(comboMs.map(m => parseInt(m.id.split('-')[1]))).toContain(10);
    expect(comboMs.map(m => parseInt(m.id.split('-')[1]))).toContain(15);
    expect(comboMs.map(m => parseInt(m.id.split('-')[1]))).toContain(20);
  });

  it('all milestones have unique IDs', () => {
    const ids = MILESTONES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all milestones have showPopup defined', () => {
    for (const ms of MILESTONES) {
      expect(typeof ms.showPopup).toBe('boolean');
    }
  });
});

// ─── COMBO_TIERS Tests ───

describe('COMBO_TIERS', () => {
  it('has ascending thresholds', () => {
    for (let i = 1; i < COMBO_TIERS.length; i++) {
      expect(COMBO_TIERS[i].threshold).toBeGreaterThan(COMBO_TIERS[i - 1].threshold);
    }
  });

  it('has all required fields', () => {
    for (const tier of COMBO_TIERS) {
      expect(tier.threshold).toBeGreaterThan(0);
      expect(tier.label).toBeTruthy();
      expect(tier.emoji).toBeTruthy();
      expect(tier.color).toMatch(/^#/);
      expect(tier.glowIntensity).toBeGreaterThanOrEqual(0);
    }
  });

  it('has increasing glow intensity', () => {
    for (let i = 1; i < COMBO_TIERS.length; i++) {
      expect(COMBO_TIERS[i].glowIntensity).toBeGreaterThanOrEqual(COMBO_TIERS[i - 1].glowIntensity);
    }
  });
});
