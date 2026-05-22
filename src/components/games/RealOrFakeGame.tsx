// ════════════════════════════════════════════════════════════════════════
// REAL OR FAKE v3 — Lab 5 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Spot fake news, deepfakes, and misinformation. Quiz format.
// 10 levels across media literacy and critical thinking.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'News Basics', description: 'Real news vs fake news.', emoji: '📰', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Source Check', description: 'Who wrote this? Can you trust them?', emoji: '🔍', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Image Tricks', description: 'Manipulated photos and context.', emoji: '📸', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Video Fakes', description: 'Edited videos and deepfakes.', emoji: '🎬', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Social Media', description: 'Viral posts: true or false?', emoji: '📱', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'AI-Generated Text', description: 'Spot AI-written articles.', emoji: '🤖', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Scientific Claims', description: 'Real science vs pseudoscience.', emoji: '🔬', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Emotional Manipulation', description: 'How fakes play on your feelings.', emoji: '🎭', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Fact Check Pro', description: 'Advanced verification techniques.', emoji: '✅', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Truth Champion', description: 'The ultimate media literacy test!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "A headline says 'Scientists discover cure for all diseases!' This is probably...", options: ["Fake — real science is more careful","Real — scientists are amazing","Maybe real","Definitely real"], correctIndex: 0, explanation: "Real scientific breakthroughs are reported cautiously. Sensational headlines are a major red flag for misinformation.", band: 'A' },
    { question: "To check if a news article is real, you should first...", options: ["Check who published it and their reputation","Share it with friends","Believe it if it sounds true","Read only the headline"], correctIndex: 0, explanation: "Source checking is the #1 fact-checking skill. Reputable outlets have editorial standards and correction policies.", band: 'A' },
    { question: "A photo shows a politician doing something shocking, but the image quality is poor and pixelated. This might be...", options: ["Manipulated or taken out of context","Definitely real","A bad camera","An old photo"], correctIndex: 0, explanation: "Poor quality, cropping artifacts, and missing context are common signs of manipulated images. Reverse image search helps verify.", band: 'B' },
    { question: "Reverse image search helps you...", options: ["Find the original source and context of an image","Create new images","Edit photos","Delete images"], correctIndex: 0, explanation: "Reverse image search (Google Images, TinEye) finds where an image first appeared, revealing manipulated or out-of-context usage.", band: 'B' },
    { question: "A video shows a celebrity saying something shocking, but their lip movements don't match the audio. This is likely...", options: ["A deepfake or edited video","A translation","A bad connection","Real but confusing"], correctIndex: 0, explanation: "Lip-sync mismatches are a telltale sign of deepfakes or audio manipulation. Always verify shocking video claims.", band: 'B' },
    { question: "Clickbait headlines often use...", options: ["ALL CAPS, exclamation marks, and emotional language","Simple facts","Neutral tone","Short words"], correctIndex: 0, explanation: "Clickbait uses emotional manipulation: urgency, outrage, curiosity gaps. Real journalism uses measured, specific language.", band: 'A' },
    { question: "If a health claim says 'Doctors don't want you to know this,' it is probably...", options: ["Misinformation","A medical breakthrough","Secret knowledge","Real but hidden"], correctIndex: 0, explanation: "'They don't want you to know' is a classic conspiracy trope. Real medicine is published in peer-reviewed journals.", band: 'A' },
    { question: "AI-generated text often has these characteristics:", options: ["Overly polished, repetitive structure, vague on specifics","Perfect spelling","Always correct facts","Short and simple"], correctIndex: 0, explanation: "AI text tends to be grammatically perfect but can lack specifics, repeat phrases, and hallucinate facts.", band: 'C' },
    { question: "A scientific study cited in an article — you should check...", options: ["Whether the study exists and says what they claim","The author's name","How long it is","The journal's color scheme"], correctIndex: 0, explanation: "Misinformation often misrepresents or invents studies. Check PubMed, Google Scholar, or the journal directly.", band: 'C' },
    { question: "Emotional manipulation in fake news works by...", options: ["Triggering strong emotions before you think critically","Making you laugh","Being boring","Using small words"], correctIndex: 0, explanation: "Fake news spreads fastest when it triggers fear, anger, or excitement — emotions that bypass critical thinking.", band: 'B' },
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

export default function RealOrFakeGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('real-or-fake', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Real or Fake?" color="#2ECC71" labNum={5}>
      <GameLevelSystem gameTitle="Real or Fake?" gameEmoji="🔍" labColor="#2ECC71" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#2ECC71" gameEmoji="🔍" timePerQuestion={18} />
        )}
      />
    </GameShell>
  );
}
