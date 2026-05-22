// ════════════════════════════════════════════════════════════════════════
// LOST IN TRANSLATION v3 — Lab 8 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Explore how AI translates between languages. Simulation.
// Adjust context, formality, and cultural sensitivity.
// 10 levels across different language pairs.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Hello World', description: 'Simple greetings across languages.', emoji: '👋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Lost Idioms', description: 'Idioms that do not translate!', emoji: '🗣️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Food Words', description: 'Tasty translation challenges.', emoji: '🍜', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Formal vs Casual', description: 'The politeness puzzle.', emoji: '🙇', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Emoji Meanings', description: '😂 means different things!', emoji: '😂', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Sarcasm', description: 'When tone gets lost.', emoji: '🙃', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Cultural Context', description: 'Culture shapes language.', emoji: '🌍', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Poetry', description: 'The hardest thing to translate.', emoji: '📜', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Code Switching', description: 'When languages mix!', emoji: '🔀', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Translation Master', description: 'Master all languages!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const context = params.context || 50;
    const formality = params.formality || 50;
    const culture = params.culture || 50;
    const speed = params.speed || 50;

    // Different levels have different optimal targets
    const targets: Record<number, [number, number, number, number]> = {
      1: [60, 50, 40, 80], 2: [80, 40, 70, 50], 3: [70, 60, 60, 60],
      4: [60, 90, 80, 40], 5: [50, 30, 90, 70], 6: [90, 50, 70, 30],
      7: [80, 70, 90, 40], 8: [90, 80, 90, 20], 9: [70, 50, 80, 60], 10: [80, 70, 85, 50],
    };
    const t = targets[levelId] || [60, 50, 60, 60];

    const accuracy = Math.max(0, 100 - (Math.abs(context - t[0]) * 0.5 + Math.abs(formality - t[1]) * 0.5 + Math.abs(culture - t[2]) * 0.5 + Math.abs(speed - t[3]) * 0.3));
    const naturalness = Math.max(0, 100 - Math.abs(formality - t[1]) * 0.8 - Math.abs(culture - t[2]) * 0.4);
    const score = Math.round((accuracy + naturalness) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        accuracy: { value: Math.round(accuracy), target: 80, label: 'Accuracy', emoji: '🎯' },
        natural: { value: Math.round(naturalness), target: 75, label: 'Naturalness', emoji: '🗣️' },
      },
      feedback: score >= 80 ? 'Beautiful translation!' : score >= 60 ? 'Good translation.' : 'Lost in translation...',
      explanation: 'Translation quality depends on context awareness, cultural knowledge, and appropriate formality.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Translation maps words from one language to another, but meaning depends on context!',
  2: 'Idioms like "kick the bucket" make no sense when translated word-for-word.',
  3: 'Food vocabulary reveals culture: Japanese has 20+ words for rice preparation!',
  4: 'Languages have different politeness levels. Japanese has keigo (honorific speech).',
  5: 'The 😂 emoji means laughter in the West but can represent embarrassment in some Asian cultures!',
  6: 'Sarcasm relies on tone and context — extremely hard for AI to translate correctly.',
  7: 'Cultural context shapes meaning. "Family" concepts differ enormously across cultures.',
  8: 'Poetry is the hardest to translate because it relies on sound, rhythm, and cultural allusion.',
  9: 'Code-switching (mixing languages) is common in multilingual communities — challenging for AI!',
  10: 'Master translators combine linguistic skill with deep cultural understanding.',
};

export default function LostInTranslationGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('lost-in-translation', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Lost in Translation" color="#FF6B35" labNum={8}>
      <GameLevelSystem gameTitle="Lost in Translation" gameEmoji="🌍" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#FF6B35" gameEmoji="🌍"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'context', label: 'Context Awareness', emoji: '📖', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'formality', label: 'Formality Level', emoji: '🙇', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'culture', label: 'Cultural Fit', emoji: '🎎', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'speed', label: 'Translation Speed', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
