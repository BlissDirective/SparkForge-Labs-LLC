// ════════════════════════════════════════════════════════════════════════
// CHATBOT BUILDER v4 — Lab 8 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Build a chatbot by tuning NLP parameters. Simulation.
// 10 levels from simple Q&A to complex conversational AI.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Hello Bot', description: 'Build a greeting bot!', emoji: '👋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'FAQ Bot', description: 'Answer common questions!', emoji: '❓', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Intent Matcher', description: 'Understand what users want!', emoji: '🎯', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Context Memory', description: 'Remember the conversation!', emoji: '🧠', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Personality', description: 'Give your bot character!', emoji: '🎭', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Multilingual', description: 'Speak many languages!', emoji: '🌍', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Emotion Aware', description: 'Detect user feelings!', emoji: '❤️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Code Bot', description: 'Help users write code!', emoji: '💻', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Reasoning', description: 'Solve logic puzzles!', emoji: '🧩', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Bot Master', description: 'The ultimate chatbot!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const vocab = params.vocab || 50;
    const context = params.context || 50;
    const creativity = params.creativity || 50;
    const safety = params.safety || 50;

    const targets: Record<number, [number, number, number, number]> = {
      1: [60, 30, 20, 80], 2: [70, 50, 30, 70], 3: [80, 60, 40, 60],
      4: [60, 90, 50, 60], 5: [50, 60, 80, 50], 6: [90, 50, 40, 60],
      7: [60, 80, 60, 70], 8: [80, 70, 40, 80], 9: [70, 90, 50, 80], 10: [80, 80, 60, 80],
    };
    const t = targets[levelId] || [60, 60, 60, 60];

    const understanding = Math.max(0, 100 - Math.abs(vocab - t[0]) * 0.5 - Math.abs(context - t[1]) * 0.5);
    const quality = Math.max(0, 100 - Math.abs(creativity - t[2]) * 0.5 - Math.abs(safety - t[3]) * 0.4);
    const score = Math.round((understanding + quality) / 2);

    return {
      score,
      maxScore: 100,
      outputs: {
        understanding: { value: Math.round(understanding), target: 80, label: 'Understanding', emoji: '🧠' },
        quality: { value: Math.round(quality), target: 75, label: 'Response Quality', emoji: '✨' },
      },
      feedback: score >= 80 ? 'Brilliant bot!' : score >= 60 ? 'Good responses!' : 'Keep tuning!',
      explanation: 'Chatbots need vocabulary, context memory, appropriate creativity, and safety guardrails.',
    };
  };
}

const CONCEPTS: Record<number, string> = {
  1: 'Chatbots use pattern matching to respond. The simplest just match keywords to answers.',
  2: 'FAQ bots use intent classification to match questions to pre-written answers.',
  3: 'Intent recognition uses NLP to figure out what the user wants, even with different wording.',
  4: 'Context memory lets bots reference earlier in the conversation — essential for natural dialogue.',
  5: 'Temperature controls creativity: low = consistent, high = surprising (but possibly off-topic).',
  6: 'Multilingual bots use translation or are trained on multilingual data.',
  7: 'Emotion detection adds sentiment analysis to tailor responses to the user\'s emotional state.',
  8: 'Code assistants use specialized training on programming languages and documentation.',
  9: 'Chain-of-thought prompting helps bots solve complex reasoning problems step by step.',
  10: 'The best bots balance intelligence, personality, safety, and helpfulness.',
};

export default function ChatbotBuilderGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('chatbot-builder', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Chatbot Builder" color="#FF6B35" labNum={8}>
      <GameLevelSystem gameTitle="Chatbot Builder" gameEmoji="💬" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#FF6B35" gameEmoji="💬"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            parameters={[
              { id: 'vocab', label: 'Vocabulary Size', emoji: '📚', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'context', label: 'Context Memory', emoji: '🧠', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'creativity', label: 'Creativity', emoji: '✨', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'safety', label: 'Safety Filters', emoji: '🛡️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </GameShell>
  );
}
