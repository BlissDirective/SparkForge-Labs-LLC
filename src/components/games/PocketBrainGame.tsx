// ════════════════════════════════════════════════════════════════════════
// POCKET BRAIN v4 — Lab 1 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Build efficient small AI models through distillation, quantization,
// and pruning. Simulation: balance model size, accuracy, speed, and memory.
// 10 levels from basic compression to production deployment.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Compression', description: 'Shrink a model without losing accuracy!', emoji: '📦', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Quantization', description: 'Use fewer bits for each weight!', emoji: '🔢', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Distillation', description: 'Teach a small model from a big one!', emoji: '👨‍🏫', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Pruning', description: 'Remove unnecessary connections!', emoji: '✂️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Mixed Precision', description: 'Use different precisions for different layers!', emoji: '⚡', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Edge Deployment', description: 'Optimize for phones and IoT devices!', emoji: '📱', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Knowledge Distill', description: 'Transfer reasoning, not just answers!', emoji: '🧠', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Dynamic Batching', description: 'Batch requests for throughput!', emoji: '⚙️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Device', description: 'Split models across hardware!', emoji: '🔌', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Pocket Master', description: 'The ultimate efficiency challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const quantization = params.quantization || 50;
    const pruning = params.pruning || 50;
    const distillation = params.distillation || 50;
    const optimization = params.optimization || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [70, 30, 60, 50], 2: [80, 40, 50, 60], 3: [50, 40, 80, 60],
      4: [40, 80, 50, 50], 5: [70, 50, 60, 70], 6: [80, 50, 40, 70],
      7: [50, 40, 90, 60], 8: [60, 40, 50, 80], 9: [60, 60, 60, 70], 10: [70, 65, 70, 70],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const sizeReduction = Math.max(0, 100 - Math.abs(quantization - t[0]) * 0.6 - Math.abs(pruning - t[1]) * 0.5);
    const accuracyRetention = Math.max(0, 100 - Math.abs(distillation - t[2]) * 0.5 - Math.abs(optimization - t[3]) * 0.4);
    const score = Math.round((sizeReduction + accuracyRetention) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        sizeReduction: { value: Math.round(sizeReduction), target: 80, label: 'Size Reduction', emoji: '📉' },
        accuracyRetention: { value: Math.round(accuracyRetention), target: 85, label: 'Accuracy Kept', emoji: '🎯' },
      },
      feedback: score >= 80 ? 'Ultra-efficient model!' : score >= 60 ? 'Good compression!' : 'Keep optimizing!',
      explanation: 'Efficient AI models balance size reduction (quantization, pruning) with accuracy retention (distillation, optimization).',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Model compression reduces file size through techniques like weight sharing and matrix factorization, making models faster to load and run.',
  2: 'Quantization reduces the number of bits used to represent each weight. FP32 → INT8 cuts size by 4x with minimal accuracy loss.',
  3: 'Knowledge distillation trains a small "student" model to mimic a large "teacher" model, transferring knowledge through soft labels.',
  4: 'Pruning removes weights with small magnitudes or low importance. A pruned model has fewer connections but can maintain performance.',
  5: 'Mixed precision uses different numerical formats for different layers. Some layers need high precision; others work fine with less.',
  6: 'Edge deployment optimizes models for mobile CPUs, NPUs, and microcontrollers with extreme memory and power constraints.',
  7: 'Advanced distillation transfers not just answers but reasoning chains, attention patterns, and intermediate representations.',
  8: 'Dynamic batching groups incoming requests for efficient GPU utilization. Better batching = higher throughput at same latency.',
  9: 'Model parallelism splits large models across multiple devices. Each device holds a portion of the model, working together.',
  10: 'Master efficient AI: combine quantization, pruning, distillation, and hardware-aware optimization for maximum efficiency.',
};

export default function PocketBrainGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('pocket-brain', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Pocket Brain" color="#0FB8FA" labNum={1}>
      <GameLevelSystem gameTitle="Pocket Brain" gameEmoji="🧠" labColor="#0FB8FA" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#0FB8FA" gameEmoji="🧠"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'quantization', label: 'Quantization', emoji: '🔢', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'pruning', label: 'Pruning', emoji: '✂️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'distillation', label: 'Distillation', emoji: '👨‍🏫', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'optimization', label: 'Optimization', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
