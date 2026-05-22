// ════════════════════════════════════════════════════════════════════════
// PET TRAINER v4 — Lab 2 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Train virtual pets through supervised learning simulation.
// Replaced Three.js with CSS-animated pet avatars.
// 10 levels with different species, behaviors, and training goals.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Puppy School', description: 'Teach a puppy to sit and stay!', emoji: '🐕', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Kitty Tricks', description: 'Cats can learn too!', emoji: '🐱', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Parrot Talk', description: 'Teach a parrot words!', emoji: '🦜', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Bunny Agility', description: 'Bunnies can jump through hoops!', emoji: '🐰', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Hamster Maze', description: 'Guide a hamster through puzzles!', emoji: '🐹', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Fish Tricks', description: 'Even fish can learn!', emoji: '🐠', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Lizard Focus', description: 'Train a focused lizard!', emoji: '🦎', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Octopus Genius', description: 'The smartest invertebrate!', emoji: '🐙', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Species', description: 'Train multiple pets together!', emoji: '🏠', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Master Trainer', description: 'The ultimate pet training test!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const PETS = ['🐕', '🐱', '🦜', '🐰', '🐹', '🐠', '🦎', '🐙', '🐕', '🐱'];
const PET_NAMES = ['Puppy', 'Kitty', 'Parrot', 'Bunny', 'Hamster', 'Fish', 'Lizard', 'Octopus', 'Team', 'Champion'];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const reward = params.reward || 50;
    const repetition = params.repetition || 50;
    const patience = params.patience || 50;
    const consistency = params.consistency || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [70, 60, 60, 70], 2: [60, 50, 80, 60], 3: [80, 70, 50, 70],
      4: [60, 80, 70, 60], 5: [50, 90, 60, 80], 6: [70, 40, 90, 50],
      7: [40, 30, 90, 80], 8: [80, 60, 50, 90], 9: [70, 70, 70, 70], 10: [75, 75, 75, 75],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const learning = Math.max(0, 100 - Math.abs(reward - t[0]) * 0.5 - Math.abs(repetition - t[1]) * 0.4 - Math.abs(patience - t[2]) * 0.3 - Math.abs(consistency - t[3]) * 0.4);
    const bond = Math.max(0, 100 - Math.abs(reward - 70) * 0.3 - Math.abs(patience - 70) * 0.5 - Math.abs(consistency - 60) * 0.3);
    const score = Math.round((learning + bond) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        learning: { value: Math.round(learning), target: 80, label: 'Learning Rate', emoji: '📈' },
        bond: { value: Math.round(bond), target: 70, label: 'Trust Bond', emoji: '❤️' },
      },
      feedback: score >= 80 ? `${PETS[levelId - 1]} mastered the trick!` : score >= 60 ? `${PETS[levelId - 1]} is learning!` : 'Keep trying — every pet learns differently!',
      explanation: 'Supervised learning: reward good behavior, repeat consistently, be patient. Each pet has unique optimal parameters.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Supervised learning: you provide labeled examples (treat = correct behavior) and the pet learns.',
  2: 'Different species need different training — just like different ML models need different hyperparameters!',
  3: 'Repetition strengthens neural pathways. Each practice round reinforces the learned behavior.',
  4: 'Generalization: a well-trained pet responds to the command in NEW locations, not just where trained.',
  5: 'Feature importance: some cues matter more than others. Find what your pet responds to best.',
  6: 'Limited model capacity: some animals (fish) have smaller brains — like smaller neural networks.',
  7: 'Cold-blooded learning: reptiles learn slower but retain longer — like models with lower learning rates.',
  8: 'Distributed intelligence: octopuses have neurons in their arms — like ensemble models!',
  9: 'Multi-task learning: training multiple behaviors that share underlying skills.',
  10: 'Master training combines all principles: reward timing, repetition, patience, and consistency.',
};

export default function PetTrainerGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('pet-trainer', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Pet Trainer" color="#4F6EF7" labNum={2}>
      <GameLevelSystem gameTitle="Pet Trainer" gameEmoji="🐕" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#4F6EF7" gameEmoji={PETS[level.id - 1]}
            description={`Train your virtual ${PET_NAMES[level.id - 1]} using supervised learning! Adjust reward timing, repetition, patience, and consistency.`}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'reward', label: 'Reward Timing', emoji: '🦴', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'repetition', label: 'Repetition', emoji: '🔄', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'patience', label: 'Patience', emoji: '⏱️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'consistency', label: 'Consistency', emoji: '✅', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
