// ════════════════════════════════════════════════════════════════════════
// WORD PREDICTOR v3 — Lab 4 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Predict the next word in a sentence! Learn how language models work.
// Quiz format with probability visualization.
// 10 levels from simple sentences to complex context.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Simple Sentences', description: 'Fill in the blank — easy mode!', emoji: '📝', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Rhyme Time', description: 'What rhymes and fits?', emoji: '🎵', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Context Clues', description: 'Use the sentence context!', emoji: '🔍', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Famous Phrases', description: 'Complete well-known sayings.', emoji: '📚', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Science Words', description: 'Technical term predictions.', emoji: '🔬', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Ambiguous Context', description: 'Words with multiple meanings!', emoji: '🤔', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Long Context', description: 'Remember earlier in the paragraph.', emoji: '📖', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Creative Writing', description: 'Predict story continuations.', emoji: '✍️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Code Completion', description: 'Predict the next line of code!', emoji: '💻', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Grand Predictor', description: 'Master word prediction!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "'The cat sat on the ___' — what comes next?", options: ["mat (most common phrase)","ceiling (cats can climb!)","moon (too far)","water (cats hate water)"], correctIndex: 0, explanation: "'The cat sat on the mat' is a common phrase. Language models learn patterns from training data.", band: 'A' },
    { question: "'Twinkle, twinkle, little ___'", options: ["star","moon","light","diamond"], correctIndex: 0, explanation: "This is the famous nursery rhyme. Language models learn common sequences from their training data.", band: 'A' },
    { question: "'An apple a day keeps the ___ away'", options: ["doctor","teacher","dentist","chef"], correctIndex: 0, explanation: "This famous saying means healthy eating prevents illness. LLMs learn idioms and proverbs.", band: 'A' },
    { question: "'To be or not to ___'", options: ["be","go","see","do"], correctIndex: 0, explanation: "Shakespeare's Hamlet! Famous quotes are high-probability predictions for language models.", band: 'B' },
    { question: "In machine learning, 'overfitting' means the model...", options: ["Memorizes training data but fails on new data","Is too simple","Runs too slowly","Uses too little data"], correctIndex: 0, explanation: "Overfitting = the model learns the training data too well and can't generalize to new examples.", band: 'C' },
    { question: "'The mitochondria is the ___ of the cell'", options: ["powerhouse","brain","heart","nucleus"], correctIndex: 0, explanation: "A classic biology meme! High-frequency phrases in training data are predicted with high confidence.", band: 'B' },
    { question: "' Roses are red, violets are ___'", options: ["blue","purple","pretty","sweet"], correctIndex: 0, explanation: "The most common version is 'blue.' Language models predict the statistically most likely next word.", band: 'A' },
    { question: "In Python, to print 'Hello' you write: print(___)", options: ["'Hello'","Hello","print Hello","echo Hello"], correctIndex: 0, explanation: "Python uses quotes for strings. Code LLMs learn programming syntax patterns.", band: 'B' },
    { question: "'The quick brown fox jumps over the lazy ___'", options: ["dog","cat","horse","sheep"], correctIndex: 0, explanation: "This pangram (uses every letter) is extremely common in typing training — high probability!", band: 'B' },
    { question: "When a language model gives multiple possible next words with percentages, this is called...", options: ["Probability distribution","Word cloud","Vocabulary list","Random guessing"], correctIndex: 0, explanation: "Language models output a probability distribution over their entire vocabulary for each position.", band: 'C' },
    { question: "'In 1492, Columbus sailed the ocean ___'", options: ["blue","deep","wide","vast"], correctIndex: 0, explanation: "'Sailed the ocean blue' is the common phrase from the rhyme. Context matters for prediction!", band: 'A' },
    { question: "GPT stands for...", options: ["Generative Pre-trained Transformer","General Purpose Technology","Global Prediction Tool","Great Program Trainer"], correctIndex: 0, explanation: "Generative (creates text), Pre-trained (learns from data first), Transformer (the neural architecture).", band: 'C' },
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

export default function WordPredictorGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('word-predictor', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Word Predictor" color="#E945F5" labNum={4}>
      <GameLevelSystem gameTitle="Word Predictor" gameEmoji="📝" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#E945F5" gameEmoji="📝" timePerQuestion={15} />
        )}
      />
    </GameShell>
  );
}
