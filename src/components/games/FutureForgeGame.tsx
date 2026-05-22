// ════════════════════════════════════════════════════════════════════════
// FUTURE FORGE v3 — Lab 10 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Design future AI scenarios. Balance innovation with ethics.
// Simulation: adjust innovation, safety, accessibility, regulation.
// 10 levels from personal gadgets to global AI policy.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Smart Home', description: 'Design your AI-powered home!', emoji: '🏠', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'School of Tomorrow', description: 'AI in education — how much is too much?', emoji: '🏫', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Health Helper', description: 'AI doctors — trusted or scary?', emoji: '🏥', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Workplace AI', description: 'Robots as coworkers?', emoji: '💼', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Transportation', description: 'Self-driving everything!', emoji: '🚗', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Creative AI', description: 'AI artists, musicians, writers?', emoji: '🎨', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Climate AI', description: 'Can AI save the planet?', emoji: '🌍', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Space AI', description: 'AI explores the cosmos!', emoji: '🚀', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'AGI Ethics', description: 'Preparing for superintelligent AI.', emoji: '🧠', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Future Architect', description: 'Design the ultimate AI future!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const innovation = params.innovation || 50;
    const safety = params.safety || 50;
    const access = params.access || 50;
    const regulation = params.regulation || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [70, 60, 70, 30], 2: [60, 70, 80, 50], 3: [50, 90, 60, 60],
      4: [70, 50, 70, 40], 5: [80, 60, 60, 50], 6: [80, 40, 80, 30],
      7: [70, 70, 60, 50], 8: [90, 60, 50, 40], 9: [60, 90, 50, 70], 10: [70, 80, 70, 60],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const viability = Math.max(0, 100 - Math.abs(innovation - t[0]) * 0.5 - Math.abs(safety - t[1]) * 0.5);
    const acceptance = Math.max(0, 100 - Math.abs(access - t[2]) * 0.5 - Math.abs(regulation - t[3]) * 0.3);
    const score = Math.round((viability + acceptance) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        viability: { value: Math.round(viability), target: 75, label: 'Viability', emoji: '🔧' },
        acceptance: { value: Math.round(acceptance), target: 75, label: 'Acceptance', emoji: '😊' },
      },
      feedback: score >= 80 ? 'A promising future design!' : score >= 60 ? 'Interesting approach.' : 'Needs more balance.',
      explanation: 'Great AI futures balance innovation with safety, accessibility, and thoughtful regulation.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Smart homes use AI for convenience, but privacy matters!',
  2: 'AI tutors can personalize learning, but human teachers provide inspiration.',
  3: 'AI diagnosis is fast, but doctors provide empathy and judgment.',
  4: 'Workplace AI can automate tasks but may displace jobs. Balance is key.',
  5: 'Self-driving cars promise safety but need rigorous testing first.',
  6: 'AI creativity is exciting but raises questions about authorship.',
  7: 'AI can optimize energy and model climate, but implementation matters.',
  8: 'AI helps explore space where human presence is difficult or impossible.',
  9: 'AGI could transform society — careful preparation is essential.',
  10: 'The best AI future is one designed thoughtfully by informed citizens.',
};

export default function FutureForgeGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('future-forge', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Future Forge" color="#E945F5" labNum={10}>
      <GameLevelSystem gameTitle="Future Forge" gameEmoji="🔮" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="🔮"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'innovation', label: 'Innovation', emoji: '💡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'safety', label: 'Safety', emoji: '🛡️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'access', label: 'Accessibility', emoji: '♿', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'regulation', label: 'Regulation', emoji: '📜', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
