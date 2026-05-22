// ════════════════════════════════════════════════════════════════════════
// MY FIRST AI APP v4 — Lab 1 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Build your first AI app by tuning parameters. Simulation.
// 10 levels from simple classifier to full app.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Hello AI', description: 'Make an app that recognizes text!', emoji: '👋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Image Sort', description: 'Sort images by content!', emoji: '📸', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Spam Filter', description: 'Build a spam detector!', emoji: '📧', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Sentiment App', description: 'Detect happy or sad text!', emoji: '😊', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Voice Command', description: 'App that listens to you!', emoji: '🎤', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Recommendation', description: 'Suggest things users like!', emoji: '⭐', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Translation', description: 'Translate between languages!', emoji: '🌍', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Code Helper', description: 'Help write code!', emoji: '💻', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Model', description: 'Combine multiple AI models!', emoji: '🔀', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'App Master', description: 'Build the ultimate AI app!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const data = params.data || 50;
    const model = params.model || 50;
    const accuracy = params.accuracy || 50;
    const speed = params.speed || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [60, 50, 70, 80], 2: [70, 60, 70, 60], 3: [80, 50, 80, 70],
      4: [70, 60, 75, 60], 5: [60, 70, 70, 50], 6: [80, 70, 60, 70],
      7: [70, 80, 70, 50], 8: [60, 70, 80, 60], 9: [80, 80, 70, 60], 10: [75, 75, 80, 70],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const quality = Math.max(0, 100 - Math.abs(data - t[0]) * 0.4 - Math.abs(model - t[1]) * 0.4 - Math.abs(accuracy - t[2]) * 0.4);
    const performance = Math.max(0, 100 - Math.abs(speed - t[3]) * 0.6 - Math.abs(model - t[1]) * 0.3);
    const score = Math.round((quality + performance) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        quality: { value: Math.round(quality), target: 80, label: 'App Quality', emoji: '✨' },
        performance: { value: Math.round(performance), target: 75, label: 'Performance', emoji: '⚡' },
      },
      feedback: score >= 80 ? 'Amazing app!' : score >= 60 ? 'Good app!' : 'Keep building!',
      explanation: 'Great AI apps need quality data, the right model, high accuracy, and fast performance.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Every AI app starts with data. Good data = good app!',
  2: 'Image apps use CNNs to recognize visual patterns in photos.',
  3: 'Spam filters use text classification to separate good email from junk.',
  4: 'Sentiment analysis reads emotions in text — useful for reviews and feedback!',
  5: 'Voice apps use speech recognition to convert audio to text commands.',
  6: 'Recommendation systems learn user preferences to suggest relevant content.',
  7: 'Translation apps use sequence-to-sequence models to convert between languages.',
  8: 'Code assistants use language models trained on programming languages.',
  9: 'Multi-model apps combine several AI capabilities for richer experiences.',
  10: 'The best AI apps balance capability, speed, accuracy, and user experience.',
};

export default function MyFirstAiAppGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('my-first-ai-app', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="My First AI App" color="#4F6EF7" labNum={1}>
      <GameLevelSystem gameTitle="My First AI App" gameEmoji="📱" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#4F6EF7" gameEmoji="📱"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'data', label: 'Data Quality', emoji: '📊', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'model', label: 'Model Size', emoji: '🧠', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'accuracy', label: 'Accuracy Target', emoji: '🎯', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'speed', label: 'Inference Speed', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
