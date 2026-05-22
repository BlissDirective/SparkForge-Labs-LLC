// ════════════════════════════════════════════════════════════════════════
// TOOL PICKER v3 — Lab 5 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Pick the right AI tool for each job. Quiz format.
// 10 levels covering AI tools, APIs, and practical applications.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Basic Tools', description: 'Which AI tool does what?', emoji: '🧰', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Image Tools', description: 'Tools for seeing and creating images.', emoji: '📸', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Text Tools', description: 'Tools for reading and writing.', emoji: '📝', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Audio Tools', description: 'Tools for hearing and speaking.', emoji: '🎧', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Data Tools', description: 'Tools for analyzing data.', emoji: '📊', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Code Tools', description: 'Tools for programming help.', emoji: '💻', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Robot Tools', description: 'Tools for physical robots.', emoji: '🤖', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Science Tools', description: 'AI tools for discovery.', emoji: '🔬', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Combo Challenge', description: 'Pick tools for complex jobs!', emoji: '🔀', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Tool Master', description: 'The ultimate tool-picker test!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "You want to turn a photo into a painting. Which tool?", options: ["Style transfer (Neural style transfer)","Speech recognition","Text classifier","Robot arm"], correctIndex: 0, explanation: "Neural style transfer applies artistic styles to photos using CNNs.", band: 'A' },
    { question: "You need a computer to understand spoken commands. Which tool?", options: ["Speech recognition (ASR)","Computer vision","GAN","Regression"], correctIndex: 0, explanation: "Automatic Speech Recognition (ASR) converts spoken audio into text that the computer can process.", band: 'A' },
    { question: "You want to sort emails into spam and not-spam. Which tool?", options: ["Text classification (NLP)","Image segmentation","Reinforcement learning","Clustering"], correctIndex: 0, explanation: "Text classification uses NLP to categorize text. Spam filters are a classic example.", band: 'B' },
    { question: "A self-driving car needs to see road lines. Which tool?", options: ["Computer vision (Edge detection)","Natural language processing","Speech synthesis","Recommendation engine"], correctIndex: 0, explanation: "Computer vision with edge detection and semantic segmentation helps cars identify lanes and boundaries.", band: 'A' },
    { question: "You want AI to recommend movies based on what you watched. Which tool?", options: ["Collaborative filtering","Image generation","Speech-to-text","Object detection"], correctIndex: 0, explanation: "Collaborative filtering recommends items by finding users with similar tastes. This powers Netflix, Amazon, and Spotify.", band: 'B' },
    { question: "A doctor wants AI to detect tumors in X-rays. Which tool?", options: ["Medical image classification (CNN)","Chatbot","Sentiment analysis","Music generation"], correctIndex: 0, explanation: "CNNs excel at image classification. Medical AI uses them to detect diseases in X-rays, MRIs, and CT scans.", band: 'B' },
    { question: "You want a robot to learn to walk by trial and error. Which tool?", options: ["Reinforcement learning","Supervised learning","Unsupervised learning","Transfer learning"], correctIndex: 0, explanation: "Reinforcement learning lets agents learn by trying actions and receiving rewards/penalties — perfect for robotics.", band: 'C' },
    { question: "You want to generate a human voice reading text. Which tool?", options: ["Text-to-speech (TTS)","Speech recognition","Image generation","Classification"], correctIndex: 0, explanation: "Text-to-Speech (TTS) converts written text into spoken audio using neural vocoders and acoustic models.", band: 'B' },
    { question: "A farmer wants AI to identify plant diseases from leaf photos. Which tool?", options: ["Image classification","Regression analysis","Clustering","Anomaly detection"], correctIndex: 0, explanation: "Image classification can identify disease symptoms in plant leaves, helping farmers take action early.", band: 'B' },
    { question: "You want to predict tomorrow's temperature. Which tool?", options: ["Time series forecasting (LSTM/Transformer)","Image generation","Text summarization","Object detection"], correctIndex: 0, explanation: "Time series models (LSTMs, Transformers) learn patterns in sequential data to predict future values.", band: 'C' },
    { question: "You want AI to write code from a description. Which tool?", options: ["Code generation (LLM)","Image segmentation","Voice cloning","Data clustering"], correctIndex: 0, explanation: "Large Language Models like Codex and Copilot can generate, complete, and explain code from descriptions.", band: 'C' },
    { question: "A store wants AI to detect shoplifting. Which tool?", options: ["Anomaly detection + computer vision","Chatbot","Sentiment analysis","Recommendation"], correctIndex: 0, explanation: "Anomaly detection identifies unusual behavior patterns in video feeds that might indicate theft.", band: 'C' },
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

export default function ToolPickerGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('tool-picker', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Tool Picker" color="#2ECC71" labNum={5}>
      <GameLevelSystem gameTitle="Tool Picker" gameEmoji="🧰" labColor="#2ECC71" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#2ECC71" gameEmoji="🧰" timePerQuestion={18} />
        )}
      />
    </GameShell>
  );
}
