// ════════════════════════════════════════════════════════════════════════
// SENTIMENT SCANNER v3 — Lab 8 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Analyze emotions in text by adjusting sentiment parameters.
// Simulation: positivity, negativity, neutrality, intensity.
// 10 levels with different text types.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Happy or Sad?', description: 'Basic emotion detection.', emoji: '😊', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Movie Reviews', description: 'Did they like the movie?', emoji: '🎬', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Social Posts', description: 'Analyze social media emotions.', emoji: '📱', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Sarcasm Spotting', description: 'When words say one thing but mean another!', emoji: '🙃', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Mixed Feelings', description: 'Texts with complex emotions.', emoji: '🤔', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'News Tone', description: 'Is the news positive, negative, or neutral?', emoji: '📰', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Customer Feedback', description: 'Analyze product reviews.', emoji: '⭐', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Political Speech', description: 'Detect bias in political language.', emoji: '🏛️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Poetry & Lyrics', description: 'Analyze artistic emotions.', emoji: '🎭', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Emotion Master', description: 'The ultimate sentiment challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  const targets: Record<number, [number, number, number]> = {
    1: [70, 30, 20], 2: [60, 40, 30], 3: [50, 50, 40], 4: [30, 60, 50],
    5: [40, 40, 60], 6: [20, 70, 60], 7: [50, 40, 40], 8: [25, 65, 55],
    9: [45, 35, 70], 10: [40, 40, 50],
  };
  const t = targets[levelId] || [50, 50, 40];

  return (params: Record<string, number>): SimResult => {
    const pos = params.positivity || 50;
    const neg = params.negativity || 50;
    const neu = params.neutrality || 50;
    const intensity = params.intensity || 50;

    const score = Math.max(0, Math.round(100 - (
      Math.abs(pos - t[0]) * 0.5 +
      Math.abs(neg - t[1]) * 0.4 +
      Math.abs(neu - t[2]) * 0.3 +
      Math.abs(intensity - 60) * 0.2
    )));

    const labels = ['😊 Positive', '😔 Negative', '😐 Neutral'];
    const maxIdx = [pos, neg, neu].indexOf(Math.max(pos, neg, neu));

    return {
      score,
      maxScore: 100,
      outputs: {
        dominant: { value: maxIdx, target: 0, label: `Dominant: ${labels[maxIdx]}`, emoji: ['😊', '😔', '😐'][maxIdx] },
        balance: { value: 100 - Math.abs(pos - neg), target: 70, label: 'Pos-Neg Balance', emoji: '⚖️' },
        confidence: { value: intensity, target: 60, label: 'Confidence', emoji: '💪' },
      },
      feedback: score >= 80 ? 'Excellent sentiment analysis!' : score >= 60 ? 'Good reading of the text.' : 'Keep practicing emotional detection.',
      explanation: 'Sentiment analysis uses NLP to detect emotions. Real models consider context, sarcasm, and word choice.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Sentiment analysis classifies text as positive, negative, or neutral using NLP.',
  2: 'Movie review analysis helps studios understand audience reactions at scale.',
  3: 'Social media monitoring tracks brand sentiment and public opinion automatically.',
  4: 'Sarcasm detection is hard because context and tone matter — AI is still learning!',
  5: 'Multi-class sentiment captures complex emotions beyond just positive/negative.',
  6: 'News sentiment analysis tracks emotional tone in journalism and its effects.',
  7: 'Customer feedback analysis extracts insights from thousands of reviews.',
  8: 'Political text analysis detects bias, framing, and emotional manipulation.',
  9: 'Artistic text (poetry, lyrics) uses metaphor — the hardest sentiment challenge.',
  10: 'Master sentiment analysis by combining all signals: words, context, and intensity.',
};

export default function SentimentScannerGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('sentiment-scanner', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Sentiment Scanner" color="#FF6B35" labNum={8}>
      <GameLevelSystem gameTitle="Sentiment Scanner" gameEmoji="😊" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#FF6B35" gameEmoji="😊"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'positivity', label: 'Positivity', emoji: '😊', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'negativity', label: 'Negativity', emoji: '😔', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'neutrality', label: 'Neutrality', emoji: '😐', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'intensity', label: 'Intensity', emoji: '💪', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
