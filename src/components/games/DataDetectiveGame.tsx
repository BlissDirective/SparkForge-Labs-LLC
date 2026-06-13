// ════════════════════════════════════════════════════════════════════════
// DATA DETECTIVE v3 — Lab 2 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Investigate datasets for bias, errors, and patterns.
// Quiz format with data analysis scenarios.
// 10 levels from simple datasets to complex bias detection.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion, type QuizBonusRound } from '@/components/games/shared/QuizLevelRenderer';

// Bonus drag-to-order round: the machine-learning data pipeline.
const BONUS_ROUND: QuizBonusRound = {
  title: 'The data pipeline',
  prompt: 'Drag the stages into the order data flows through to build an AI model.',
  items: [
    { id: 'collect', label: 'Collect the data', correctPosition: 0, currentPosition: 0, color: '#3B82F6' },
    { id: 'clean', label: 'Clean out the errors', correctPosition: 1, currentPosition: 1, color: '#8B5CF6' },
    { id: 'label', label: 'Label the examples', correctPosition: 2, currentPosition: 2, color: '#F59E0B' },
    { id: 'train', label: 'Train the model', correctPosition: 3, currentPosition: 3, color: '#10B981' },
    { id: 'eval', label: 'Check (evaluate) the results', correctPosition: 4, currentPosition: 4, color: '#EF4444' },
  ],
};

const LEVELS = [
  { id: 1, name: 'Data Types', description: 'Numbers, text, images — what kind of data?', emoji: '📊', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Missing Data', description: 'What happens when data is incomplete?', emoji: '❓', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Outliers', description: 'Spot the weird data points!', emoji: '👽', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Sampling Bias', description: 'Is your data representative?', emoji: '🎯', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Label Bias', description: 'Who labeled this data and how?', emoji: '🏷️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Correlation vs Causation', description: 'Just because A and B move together...', emoji: '🔗', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Historical Bias', description: 'Past data encodes past prejudice.', emoji: '📜', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Proxy Variables', description: 'Seemingly neutral data that reveals sensitive info.', emoji: '🕵️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Fairness Metrics', description: 'Mathematical ways to measure bias.', emoji: '⚖️', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Chief Detective', description: 'Solve the toughest data cases!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "A dataset has 100 men and 5 women. This is an example of...", options: ["Sampling bias","Good representation","Random variation","A large dataset"], correctIndex: 0, explanation: "Severe underrepresentation of women means the model won't work well for female users.", band: 'A' },
    { question: "If you train a hiring AI only on past hiring decisions, it might...", options: ["Copy past biases","Be perfectly fair","Only hire new graduates","Reject everyone"], correctIndex: 0, explanation: "Historical data encodes historical bias. Amazon's hiring AI penalized women's resumes because tech was male-dominated.", band: 'B' },
    { question: "A health app works great for light skin but fails on dark skin. The problem is...", options: ["Training data lacked diversity","The algorithm is racist","Dark skin is harder to photograph","A software bug"], correctIndex: 0, explanation: "Pulse oximeters and some computer vision models were trained predominantly on light-skinned subjects.", band: 'B' },
    { question: "'Correlation does not imply causation' means...", options: ["Two things moving together does not mean one causes the other","Statistics are useless","Always trust your gut","A causes B always"], correctIndex: 0, explanation: "Ice cream sales correlate with drownings — not because ice cream causes drowning, but both increase in summer!", band: 'B' },
    { question: "A ZIP code can be a 'proxy variable' for race because...", options: ["Neighborhoods are often segregated","ZIP codes are racist","Mail delivery is biased","It's a coincidence"], correctIndex: 0, explanation: "Even if race isn't in the dataset, ZIP code + income can closely predict it, allowing indirect discrimination.", band: 'C' },
    { question: "An 'outlier' in data is...", options: ["A value very different from others","The average value","The most common value","A missing value"], correctIndex: 0, explanation: "Outliers are extreme values. They can be errors (remove) or important discoveries (investigate)!", band: 'A' },
    { question: "When 30% of survey responses are blank, this is...", options: ["Missing data — a serious problem","Normal and ignorable","A sign of good data","Only affects small datasets"], correctIndex: 0, explanation: "Missing data can bias results if the missingness isn't random. Always investigate WHY data is missing.", band: 'B' },
    { question: "'Demographic parity' means...", options: ["Equal positive outcomes across groups","Everyone gets the same score","Only one group is selected","Random selection"], correctIndex: 0, explanation: "Demographic parity requires that the positive classification rate is the same across all demographic groups.", band: 'C' },
    { question: "If a facial recognition system has 99% accuracy on men but 65% on women, it has...", options: ["Performance disparity","Perfect accuracy","Gender equality","A small sample"], correctIndex: 0, explanation: "Unequal performance across groups is a key fairness metric. This was found in several commercial facial recognition systems.", band: 'C' },
    { question: "Data augmentation (adding synthetic data) can help reduce bias by...", options: ["Balancing underrepresented groups","Making the dataset bigger only","Speeding up training","Reducing model size"], correctIndex: 0, explanation: "Creating synthetic examples of underrepresented groups helps the model learn fairer representations.", band: 'C' },
    { question: "A 'confounding variable' is...", options: ["A hidden factor that affects both variables you're studying","A type of error","A control group","A statistical test"], correctIndex: 0, explanation: "Confounders create spurious correlations. Example: ice cream sales and drowning are both caused by hot weather.", band: 'C' },
    { question: "Auditing an AI model for bias should be done...", options: ["Before deployment and regularly after","Only once at the start","Only when someone complains","Never — AI is objective"], correctIndex: 0, explanation: "Bias can emerge over time as the world changes. Regular audits catch drift and new forms of unfairness.", band: 'B' },
  ];

  const perLevel = 8;
  const start = (levelId - 1) * 2;
  const levelQs: QuizQuestion[] = [];
  for (let i = 0; i < perLevel; i++) {
    const idx = (start + i) % all.length;
    levelQs.push(all[idx]);
  }
  return levelQs;
}

export default function DataDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('data-detective', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Data Detective" color="#4F6EF7" labNum={2}>
      <GameLevelSystem gameTitle="Data Detective" gameEmoji="🔍" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#4F6EF7" gameEmoji="🔍" timePerQuestion={20}
            bonusRound={level.id === 1 ? BONUS_ROUND : undefined} />
        )}
      />
    </GameShell>
  );
}
