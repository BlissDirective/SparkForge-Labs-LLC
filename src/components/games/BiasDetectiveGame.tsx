// ════════════════════════════════════════════════════════════════════════
// BIAS DETECTIVE v4 — Lab 6 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Investigate AI systems for bias. Quiz format with real-world cases.
// 10 levels from simple examples to complex systemic bias.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'What is Bias?', description: 'Learn the basics of AI bias.', emoji: '⚖️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Data Bias', description: 'Bias starts in the data!', emoji: '📊', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Algorithm Bias', description: 'How algorithms amplify bias.', emoji: '🧮', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Facial Recognition', description: 'Why face AI fails some people.', emoji: '👤', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Hiring AI', description: 'When AI screens job applications.', emoji: '💼', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Criminal Justice', description: 'AI in courts and policing.', emoji: '⚖️', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Healthcare Bias', description: 'AI that treats patients unfairly.', emoji: '🏥', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Language Models', description: 'Bias in text generation.', emoji: '📝', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Intersectionality', description: 'Multiple overlapping biases.', emoji: '🔀', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Bias Hunter', description: 'The ultimate bias detection challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "AI bias means an AI system...", options: ["Produces unfair results for certain groups","Is always wrong","Works too slowly","Uses too much data"], correctIndex: 0, explanation: "AI bias occurs when systems produce systematically unfair outcomes for specific demographic groups.", band: 'A' },
    { question: "If a facial recognition system works better on men than women, this is...", options: ["Gender bias in training data","A software bug","Natural difference","Better lighting for men"], correctIndex: 0, explanation: "This happened with commercial systems. Training data had more male faces, so the model learned male features better.", band: 'A' },
    { question: "Amazon's hiring AI was found to be biased because...", options: ["It was trained on historically male-dominated hiring data","Women applied less","It was programmed to reject women","The internet is biased"], correctIndex: 0, explanation: "The system learned to penalize resumes containing 'women's' (as in 'women's chess club') because tech hires were historically male.", band: 'B' },
    { question: "The COMPAS recidivism algorithm (used in US courts) was controversial because...", options: ["It falsely flagged Black defendants as higher risk","It was too accurate","It let everyone go free","Judges ignored it"], correctIndex: 0, explanation: "ProPublica found COMPAS was twice as likely to falsely label Black defendants as high risk for reoffending.", band: 'B' },
    { question: "A healthcare AI worked worse for Black patients because...", options: ["It used healthcare spending as a proxy for health need","Black patients refused treatment","The algorithm was racist","Hospitals were underfunded"], correctIndex: 0, explanation: "The system used past healthcare spending to predict need. Black patients had lower spending due to access barriers, not lower need.", band: 'C' },
    { question: "Language models can be biased because...", options: ["They learn patterns from biased internet text","They are programmed to be biased","They only read Wikipedia","Bias is impossible in text"], correctIndex: 0, explanation: "LLMs trained on internet text absorb societal biases present in that data — gender stereotypes, racial associations, etc.", band: 'B' },
    { question: "'Intersectionality' in AI bias refers to...", options: ["How multiple biases overlap and compound","Where roads cross","A type of neural network","A programming language"], correctIndex: 0, explanation: "A Black woman faces different bias than a Black man or white woman. Intersectional bias examines these overlapping effects.", band: 'C' },
    { question: "One way to reduce bias in AI is to...", options: ["Diversify training data and test across groups","Use less data","Train faster","Make the model smaller"], correctIndex: 0, explanation: "Representative training data, diverse teams, and testing across demographic groups are key to reducing bias.", band: 'B' },
    { question: "'Fairness through unawareness' (removing protected attributes) fails because...", options: ["Other variables can proxy for the removed attribute","It always works","AI cannot be fair","The data is too complex"], correctIndex: 0, explanation: "Even if you remove 'race', ZIP code + income can predict it. The bias finds its way back in through correlated features.", band: 'C' },
    { question: "An AI audit should be conducted by...", options: ["Independent third parties with diverse teams","The same company that built it","Anyone","Only the government"], correctIndex: 0, explanation: "Independent audits with diverse perspectives catch biases that homogenous teams miss.", band: 'B' },
    { question: "'Demographic parity' requires...", options: ["Equal positive rates across groups","Highest accuracy","Fastest inference","Lowest cost"], correctIndex: 0, explanation: "Demographic parity means each group receives positive classifications at equal rates.", band: 'C' },
    { question: "Explainable AI (XAI) helps fight bias by...", options: ["Showing WHY the AI made a decision","Making AI faster","Reducing data needs","Encrypting data"], correctIndex: 0, explanation: "If you can see the reasoning, you can spot when protected attributes inappropriately influenced the decision.", band: 'B' },
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

export default function BiasDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('bias-detective', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Bias Detective" color="#E945F5" labNum={6}>
      <GameLevelSystem gameTitle="Bias Detective" gameEmoji="⚖️" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#E945F5" gameEmoji="⚖️" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
