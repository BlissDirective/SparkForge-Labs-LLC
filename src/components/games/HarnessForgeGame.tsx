// ════════════════════════════════════════════════════════════════════════
// HARNESS FORGE v4 — Lab 11 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Learn how AI systems are tested and validated. Slider simulation: balance
// test coverage, evaluation metrics, red teaming, and deployment safety
// (a themed dial sim, not a real test harness).
// 10 levels from unit testing to production validation.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Unit Tests', description: 'Test individual components!', emoji: '🧪', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Benchmarks', description: 'Compare against standards!', emoji: '📊', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Edge Cases', description: 'Test the weird inputs!', emoji: '🔀', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Red Teaming', description: 'Try to break the AI!', emoji: '🔴', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'A/B Testing', description: 'Compare two versions!', emoji: '🅰️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Safety Eval', description: 'Test for harmful outputs!', emoji: '🛡️', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Stress Testing', description: 'Push AI to its limits!', emoji: '💪', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Human Eval', description: 'Real people judge quality!', emoji: '👥', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Continuous', description: 'Monitor in production!', emoji: '📈', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Test Master', description: 'The ultimate validation challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const coverage = params.coverage || 50;
    const metrics = params.metrics || 50;
    const redteam = params.redteam || 50;
    const safety = params.safety || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [70, 50, 30, 60], 2: [60, 80, 30, 50], 3: [80, 60, 70, 50],
      4: [50, 50, 90, 60], 5: [60, 80, 40, 50], 6: [50, 60, 60, 90],
      7: [80, 70, 70, 60], 8: [60, 80, 50, 60], 9: [70, 70, 60, 70], 10: [75, 75, 75, 75],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const reliability = Math.max(0, 100 - Math.abs(coverage - t[0]) * 0.5 - Math.abs(metrics - t[1]) * 0.4);
    const robustness = Math.max(0, 100 - Math.abs(redteam - t[2]) * 0.5 - Math.abs(safety - t[3]) * 0.5);
    const score = Math.round((reliability + robustness) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        reliability: { value: Math.round(reliability), target: 80, label: 'Reliability', emoji: '✅' },
        robustness: { value: Math.round(robustness), target: 75, label: 'Robustness', emoji: '💪' },
      },
      feedback: score >= 80 ? 'Production ready!' : score >= 60 ? 'Good testing!' : 'More testing needed!',
      explanation: 'In real AI, rigorous testing balances coverage, metrics, adversarial testing, and safety evaluation.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Unit tests verify individual components work correctly in isolation.',
  2: 'Benchmarks like GLUE and MMLU provide standardized comparisons across models.',
  3: 'Edge cases reveal failure modes that typical inputs do not expose.',
  4: 'Red teaming involves deliberately trying to provoke harmful or incorrect outputs.',
  5: 'A/B testing compares model versions with real users to measure improvement.',
  6: 'Safety evaluation tests for harmful outputs, bias, and policy violations.',
  7: 'Stress testing pushes models beyond normal operating conditions to find breaking points.',
  8: 'Human evaluation captures quality aspects that automated metrics miss.',
  9: 'Continuous monitoring catches drift and degradation in production systems.',
  10: 'Master AI validation: comprehensive, ongoing, and adaptive testing practices.',
};

export default function HarnessForgeGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('harness-forge', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Harness Forge" color="#E945F5" labNum={11}>
      <GameLevelSystem gameTitle="Harness Forge" gameEmoji="🧪" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="🧪"
            description={`${level.description} Adjust the dials and see what changes.`}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'coverage', label: 'Test Coverage', emoji: '📊', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'metrics', label: 'Eval Metrics', emoji: '📈', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'redteam', label: 'Red Teaming', emoji: '🔴', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'safety', label: 'Safety Tests', emoji: '🛡️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
