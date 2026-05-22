// ════════════════════════════════════════════════════════════════════════
// NEURON RELAY v3 — Lab 3 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Race signals through a neural network! Adjust speed, strength,
// and path to optimize signal transmission.
// Simulation: timing, signal strength, routing.
// 10 levels with increasingly complex network topologies.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Single Signal', description: 'Send one signal through a neuron!', emoji: '⚡', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Two Paths', description: 'Choose the fastest route.', emoji: '🔀', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Signal Boost', description: 'Strengthen weak signals!', emoji: '🔋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Network Traffic', description: 'Multiple signals, one network.', emoji: '🚦', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Signal Drop', description: 'Prevent signal loss!', emoji: '📉', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Backpropagation', description: 'Signals flow backward to learn!', emoji: '↩️', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Deep Network', description: 'Navigate 5+ layers!', emoji: '🏗️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Parallel Paths', description: 'Split and merge signals!', emoji: '🔀', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Noise Reduction', description: 'Filter out interference!', emoji: '🔇', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Neural Master', description: 'Master signal transmission!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const speed = params.speed || 50;
    const strength = params.strength || 50;
    const routing = params.routing || 50;
    const inhibition = params.inhibition || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [60, 60, 50, 40], 2: [70, 50, 70, 30], 3: [50, 90, 50, 20],
      4: [60, 70, 80, 40], 5: [40, 80, 60, 60], 6: [50, 70, 50, 70],
      7: [70, 80, 80, 30], 8: [80, 60, 90, 20], 9: [50, 80, 60, 80], 10: [70, 85, 80, 50],
    };
    const t = targets[levelId] || [50, 50, 50, 50];

    const throughput = Math.max(0, 100 - Math.abs(speed - t[0]) * 0.5 - Math.abs(routing - t[2]) * 0.3);
    const signalQuality = Math.max(0, 100 - Math.abs(strength - t[1]) * 0.5 - Math.abs(inhibition - t[3]) * 0.3);
    const score = Math.round((throughput + signalQuality) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        throughput: { value: Math.round(throughput), target: 80, label: 'Throughput', emoji: '📊' },
        quality: { value: Math.round(signalQuality), target: 80, label: 'Signal Quality', emoji: '✨' },
      },
      feedback: score >= 80 ? 'Optimal neural transmission!' : score >= 60 ? 'Good signal flow.' : 'Signal degraded — adjust parameters.',
      explanation: 'Neural networks transmit signals through weighted connections. Speed, strength, and routing all affect performance.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Neurons transmit electrical signals. The signal strength is called activation.',
  2: 'Neural networks route signals through multiple paths, like a highway system for information.',
  3: 'Stronger weights amplify signals. Training adjusts these weights for optimal transmission.',
  4: 'Multiple signals compete for bandwidth. Good routing prevents congestion.',
  5: 'Signal dropout is a technique where random signals are ignored to prevent overfitting.',
  6: 'Backpropagation sends error signals backward through the network to update weights.',
  7: 'Deep networks have many layers. Each layer extracts increasingly abstract features.',
  8: 'Parallel processing lets networks handle multiple inputs simultaneously — like your brain!',
  9: 'Noise reduction (regularization) helps networks focus on important signals, not random fluctuations.',
  10: 'Master neural signal management: balance speed, strength, routing, and noise for peak performance.',
};

export default function NeuronRelayGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('neuron-relay', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Neuron Relay" color="#E945F5" labNum={3}>
      <GameLevelSystem gameTitle="Neuron Relay" gameEmoji="⚡" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="⚡"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'speed', label: 'Signal Speed', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'strength', label: 'Signal Strength', emoji: '💪', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'routing', label: 'Path Routing', emoji: '🛤️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'inhibition', label: 'Noise Filter', emoji: '🔇', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
