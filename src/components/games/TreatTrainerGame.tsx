// ════════════════════════════════════════════════════════════════════════
// TREAT TRAINER v3 — Lab 2 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Train a virtual pet by adjusting training parameters.
// Simulation: food amount, exercise, sleep, play.
// 10 levels with different pet types and challenges.

'use client';
import { useCallback, useState } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer, { type SimParameter } from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Puppy Basics', description: 'Train your first virtual puppy!', emoji: '🐕', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Kitty Care', description: 'Cats need different training!', emoji: '🐱', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Bird Brain', description: 'Teach a parrot tricks!', emoji: '🦜', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Bunny Hop', description: 'Gentle training for bunnies.', emoji: '🐰', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Hamster Wheel', description: 'High-energy hamster training!', emoji: '🐹', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Fish Focus', description: 'Can you train a fish?', emoji: '🐠', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Lizard Logic', description: 'Reptiles learn too!', emoji: '🦎', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Octopus Genius', description: 'The smartest invertebrate!', emoji: '🐙', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Pet', description: 'Train multiple pets at once!', emoji: '🏠', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Master Trainer', description: 'The ultimate pet training challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const PETS = ['🐕', '🐱', '🦜', '🐰', '🐹', '🐠', '🦎', '🐙', '🐕', '🐱'];
const PET_NAMES = ['Puppy', 'Kitty', 'Parrot', 'Bunny', 'Hamster', 'Fish', 'Lizard', 'Octopus', 'Multi', 'Ultimate'];

function getSimulate(levelId: number) {
  const petIdx = (levelId - 1) % PETS.length;
  return (params: Record<string, number>): SimResult => {
    const food = params.food || 50;
    const exercise = params.exercise || 50;
    const sleep = params.sleep || 50;
    const play = params.play || 50;

    // Optimal ranges vary by pet
    const opts: Record<string, number[]> = {
      '🐕': [60, 70, 60, 80], '🐱': [50, 40, 70, 60], '🦜': [40, 30, 60, 90],
      '🐰': [50, 50, 70, 70], '🐹': [30, 90, 60, 80], '🐠': [20, 10, 80, 40],
      '🦎': [40, 20, 80, 30], '🐙': [50, 40, 60, 90],
    };
    const opt = opts[PETS[petIdx]] || [50, 50, 60, 70];

    // Calculate happiness (closeness to optimal)
    const happiness = 100 - (
      Math.abs(food - opt[0]) * 0.8 +
      Math.abs(exercise - opt[1]) * 0.6 +
      Math.abs(sleep - opt[2]) * 0.5 +
      Math.abs(play - opt[3]) * 0.7
    ) / 4;

    const health = Math.min(100, (food + sleep) / 2 + 10);
    const energy = Math.min(100, exercise * 0.6 + sleep * 0.4);
    const score = Math.max(0, Math.round(happiness));

    return {
      score,
      maxScore: 100,
      outputs: {
        happiness: { value: Math.max(0, Math.round(happiness)), target: 80, label: 'Happiness', emoji: '😊' },
        health: { value: Math.round(health), target: 80, label: 'Health', emoji: '❤️' },
        energy: { value: Math.round(energy), target: 70, label: 'Energy', emoji: '⚡' },
      },
      feedback: score >= 80 ? `${PETS[petIdx]} is thriving!` : score >= 60 ? `${PETS[petIdx]} is doing okay.` : `${PETS[petIdx]} needs better care.`,
      explanation: score >= 80 ? 'Perfect balance! You found the sweet spot.' : score >= 60 ? 'Getting there. Try adjusting one parameter at a time.' : 'Keep experimenting! Each pet has unique needs.',
    };
  };
}

function getParams(levelId: number): SimParameter[] {
  return [
    { id: 'food', label: 'Food Amount', emoji: '🍖', value: 50, min: 0, max: 100, step: 5, unit: '%' },
    { id: 'exercise', label: 'Exercise', emoji: '🏃', value: 50, min: 0, max: 100, step: 5, unit: '%' },
    { id: 'sleep', label: 'Sleep', emoji: '💤', value: 50, min: 0, max: 100, step: 5, unit: '%' },
    { id: 'play', label: 'Play Time', emoji: '🎾', value: 50, min: 0, max: 100, step: 5, unit: '%' },
  ];
}

const CONCEPTS: Record<number, string> = {
  1: 'Supervised learning: you provide labeled examples (treat = good behavior) and the pet learns.',
  2: 'Different species need different training approaches — just like different ML models suit different problems.',
  3: 'Reinforcement learning: the pet learns from rewards and penalties over time.',
  4: 'Generalization: a well-trained pet responds correctly to NEW situations, not just memorized ones.',
  5: 'Feature importance: some factors (exercise for hamsters) matter more than others.',
  6: 'Limited training data: some animals (fish) have fewer neurons — smaller models need different approaches.',
  7: 'Cold-blooded learning: reptiles learn slower but retain longer — like models with lower learning rates.',
  8: 'High intelligence: octopuses have distributed neurons — like ensemble models with multiple sub-networks.',
  9: 'Multi-task learning: training multiple pets simultaneously with shared techniques.',
  10: 'Master training combines everything: the right model, optimal parameters, and consistent feedback.',
};

const CHALLENGES: Record<number, string | undefined> = {
  6: 'Fish have tiny brains — find what works with minimal parameters!',
  8: 'Octopuses are smart but stubborn — hit 85+ happiness!',
  10: 'Balance ALL four parameters perfectly for the ultimate pet!',
};

export default function TreatTrainerGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('treat-trainer', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Treat Trainer" color="#4F6EF7" labNum={2}>
      <GameLevelSystem gameTitle="Treat Trainer" gameEmoji="🐕" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#4F6EF7" gameEmoji={PETS[(level.id - 1) % PETS.length]}
            description={`Train your virtual ${PET_NAMES[level.id - 1]} by balancing food, exercise, sleep, and play!`}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            challenge={CHALLENGES[level.id]}
            parameters={getParams(level.id)}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
