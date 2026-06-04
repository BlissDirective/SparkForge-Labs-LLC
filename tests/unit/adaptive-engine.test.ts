// ════════════════════════════════════════════════════
// Phase 10.1 — Adaptive Engine (Adaptive Difficulty System)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_ORDER,
  scoreSample,
  stepLevel,
  defaultState,
  applySample,
  recommendLevel,
  curveTrend,
  HISTORY_CAP,
  type AdaptiveState,
  type PerformanceSample,
} from '@/lib/adaptive/AdaptiveEngine';

const perfect: PerformanceSample = { accuracy: 1, speedScore: 1, hintRate: 0, retryRate: 0 };
const poor: PerformanceSample = { accuracy: 0.1, speedScore: 0.1, hintRate: 1, retryRate: 1 };

describe('scoring', () => {
  it('scores a perfect sample at 1 and a poor one near 0', () => {
    expect(scoreSample(perfect)).toBeCloseTo(1, 5);
    expect(scoreSample(poor)).toBeLessThan(0.2);
  });

  it('clamps out-of-range inputs', () => {
    expect(scoreSample({ accuracy: 5, speedScore: 5, hintRate: -1, retryRate: -1 })).toBeLessThanOrEqual(1);
  });
});

describe('level stepping', () => {
  it('clamps at the ends', () => {
    expect(stepLevel('easy', -1)).toBe('easy');
    expect(stepLevel('expert', +1)).toBe('expert');
    expect(stepLevel('medium', +1)).toBe('hard');
  });

  it('orders difficulty correctly', () => {
    expect(DIFFICULTY_ORDER).toEqual(['easy', 'medium', 'hard', 'expert']);
  });
});

describe('adaptive controller', () => {
  it('does not adapt before the minimum sample count', () => {
    let s = defaultState();
    s = applySample(s, perfect);
    s = applySample(s, perfect);
    // 2 samples — still easy (needs >= 3 to move)
    expect(s.level).toBe('easy');
    expect(s.samples).toBe(2);
  });

  it('promotes on sustained strong performance (one step at a time)', () => {
    let s = defaultState();
    for (let i = 0; i < 6; i++) s = applySample(s, perfect);
    // Single-step hysteresis: can rise at most one level per sample.
    expect(['medium', 'hard', 'expert']).toContain(s.level);
    expect(s.performance).toBeGreaterThan(0.8);
  });

  it('demotes on sustained poor performance', () => {
    let s: AdaptiveState = { level: 'hard', performance: 0.7, samples: 5, history: [] };
    for (let i = 0; i < 4; i++) s = applySample(s, poor);
    expect(['easy', 'medium']).toContain(s.level);
  });

  it('caps the learning-curve history', () => {
    let s = defaultState();
    for (let i = 0; i < HISTORY_CAP + 10; i++) s = applySample(s, perfect);
    expect(s.history.length).toBe(HISTORY_CAP);
  });
});

describe('recommendation + trend', () => {
  it('maps performance score to a starting level', () => {
    expect(recommendLevel(0.9)).toBe('expert');
    expect(recommendLevel(0.7)).toBe('hard');
    expect(recommendLevel(0.5)).toBe('medium');
    expect(recommendLevel(0.2)).toBe('easy');
  });

  it('detects curve trend direction', () => {
    const up = [
      { at: 'a', level: 'easy' as const, performance: 0.3, accuracy: 0.3 },
      { at: 'b', level: 'medium' as const, performance: 0.7, accuracy: 0.7 },
    ];
    expect(curveTrend(up)).toBe('up');
    expect(curveTrend([up[1], up[0]])).toBe('down');
    expect(curveTrend([up[0]])).toBe('flat');
  });
});
