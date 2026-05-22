// ════════════════════════════════════════════════════════════════════════
// AI OR NOT v3 — Lab 1 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Decide: Is this AI-made or human-made? Images, text, music, art.
// 10 levels across media types with 80+ challenges.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'AI Art', description: 'Can you spot AI-generated art?', emoji: '🎨', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Text Tricks', description: 'AI text vs human writing.', emoji: '✍️', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Music Mystery', description: 'Is that a real musician or AI?', emoji: '🎵', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Photo Fakes', description: 'Real photos vs AI-generated ones.', emoji: '📸', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Voice vs AI', description: 'Can you tell real voices from synthetic?', emoji: '🗣️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Deepfake Detect', description: 'Spot manipulated videos.', emoji: '🎬', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Code Challenge', description: 'Human programmer vs AI coder.', emoji: '💻', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'News or Nonsense', description: 'Real news vs AI-generated articles.', emoji: '📰', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Media Mix', description: 'All media types combined!', emoji: '🔀', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Grand Detector', description: 'The ultimate AI detection test.', emoji: '🔍', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    // AI Art (Level 1)
    { question: "This painting has perfect symmetry, impossible geometry, and strange hands. AI or Human?", options: ["AI — strange hands are an AI giveaway","Human — artists make mistakes too","AI — perfect symmetry is suspicious","Both A and C"], correctIndex: 3, explanation: "AI art often shows perfect symmetry and malformed hands/fingers — two classic tells.", band: 'A' },
    { question: "A landscape photo has consistent shadows and natural grain. AI or Human?", options: ["Human — natural imperfections","AI — can fake grain now","Could be either","Definitely AI"], correctIndex: 0, explanation: "Natural grain, consistent lighting, and subtle imperfections are signs of real photography.", band: 'A' },
    { question: "An image has a watermark signature and visible brush strokes. AI or Human?", options: ["Human — physical brush strokes","AI — can fake signatures now","Probably AI","Can't tell"], correctIndex: 0, explanation: "Visible brush texture and artist signatures are strong indicators of human-created art.", band: 'A' },
    // Text (Level 2)
    { question: "A poem has inconsistent metaphors and some typos. AI or Human?", options: ["Human — humans make mistakes","AI — AI is inconsistent","Probably AI","Both can be inconsistent"], correctIndex: 0, explanation: "Typos and imperfect flow are more common in human writing. AI text tends to be too polished.", band: 'A' },
    { question: "An essay repeats the same phrase structure in every paragraph. AI or Human?", options: ["AI — repetitive patterns are an AI tell","Human — students repeat themselves","Could be either","Human — bad writing"], correctIndex: 0, explanation: "AI text often shows repetitive sentence structure. Humans vary their writing style naturally.", band: 'B' },
    { question: "A story has invented words, creative spelling, and unique formatting. AI or Human?", options: ["Human — creativity shows personality","AI — invented words confuse AI","Probably human","Can't tell"], correctIndex: 0, explanation: "Inventive language and unique formatting are hallmarks of human creativity that AI rarely replicates.", band: 'B' },
    // Music (Level 3)
    { question: "A song has slight timing variations and breath sounds between phrases. AI or Human?", options: ["Human — natural performance variation","AI — can add breath sounds","Probably AI","Can't tell"], correctIndex: 0, explanation: "Natural timing variation and authentic breath sounds indicate human performance.", band: 'B' },
    { question: "A piece has perfectly quantized timing and no dynamics variation. AI or Human?", options: ["AI — too perfect is suspicious","Human — some musicians are precise","Probably human","Can't tell"], correctIndex: 0, explanation: "Perfect quantization with no dynamics variation is a strong indicator of AI-generated or heavily processed music.", band: 'B' },
    // Photos (Level 4)
    { question: "A photo has realistic lens flare, chromatic aberration, and depth of field. AI or Human?", options: ["Human — real camera optics","AI — can simulate all of these","Could be either","Definitely AI"], correctIndex: 0, explanation: "Authentic optical effects from real lenses are hard for AI to replicate perfectly.", band: 'C' },
    { question: "A portrait has mismatched earrings, inconsistent background blur, and extra fingers. AI or Human?", options: ["AI — multiple AI artifacts","Human — could be Photoshop","Probably AI","Can't tell"], correctIndex: 0, explanation: "Multiple inconsistencies (fingers, asymmetry, background artifacts) together strongly indicate AI generation.", band: 'C' },
    // Voice (Level 5)
    { question: "A voice recording has natural intonation changes and occasional mouth noise. AI or Human?", options: ["Human — natural vocal variation","AI — can be very realistic now","Probably human","Can't tell"], correctIndex: 0, explanation: "Natural prosody, mouth clicks, and breathing patterns are difficult for AI voice to replicate.", band: 'C' },
    { question: "A voice sounds slightly robotic with consistent pace and no breaths. AI or Human?", options: ["AI — too consistent","Human — some people talk that way","Probably human","Can't tell"], correctIndex: 0, explanation: "Perfectly consistent pace without natural variation or breathing is a common AI voice tell.", band: 'B' },
    // Deepfake (Level 6)
    { question: "A video shows someone blinking unnaturally — eyes stay closed too long. AI or Human?", options: ["AI — deepfake blinking is often off","Human — could be tired","Probably AI","Can't tell"], correctIndex: 0, explanation: "Deepfakes often struggle with natural blinking patterns and eye movement synchronization.", band: 'C' },
    { question: "A video has consistent lighting, natural skin texture, and matching lip sync. AI or Human?", options: ["Human — natural appearance","AI — deepfakes are perfect now","Probably human","Can't tell"], correctIndex: 0, explanation: "Natural skin texture, consistent lighting, and perfect lip sync are signs of authentic video.", band: 'C' },
    // Code (Level 7)
    { question: "Code has inconsistent naming, commented-out experiments, and TODOs. AI or Human?", options: ["Human — messy but authentic","AI — always clean code","Probably human","Can't tell"], correctIndex: 0, explanation: "Messy code with TODOs, experiments, and inconsistent style is typical of human programmers.", band: 'C' },
    { question: "Code is perfectly formatted with exhaustive comments and no edge case handling. AI or Human?", options: ["AI — too clean, misses edge cases","Human — writes clean code","Probably human","Can't tell"], correctIndex: 0, explanation: "AI-generated code often looks perfect but fails on edge cases. Humans add defensive code.", band: 'C' },
    // News (Level 8)
    { question: "A news article has named sources, dates, and links to studies. AI or Human?", options: ["Human — real journalism cites sources","AI — can hallucinate sources","Probably human","Can't tell"], correctIndex: 0, explanation: "Real journalism includes verifiable sources. AI sometimes hallucinates fake sources.", band: 'B' },
    { question: "A news article uses sensational language, has no byline, and no verifiable facts. AI or Human?", options: ["AI — or low-quality fake news","Human — tabloids exist","Probably AI","Can't tell"], correctIndex: 0, explanation: "Sensationalism without attribution is a red flag. AI can generate convincing fake news.", band: 'C' },
    // Multi (Level 9)
    { question: "An image has EXIF camera metadata and a geo-tag. AI or Human?", options: ["Human — AI images lack EXIF","AI — can add fake EXIF","Probably human","Can't tell"], correctIndex: 0, explanation: "Authentic camera EXIF data is strong evidence of a real photograph vs AI generation.", band: 'C' },
    { question: "A video shows hands with 6 fingers. AI or Human?", options: ["AI — classic AI hand error","Human — rare birth condition","Probably AI","Can't tell"], correctIndex: 0, explanation: "Extra fingers, melting features, or unnatural hand structure are classic AI generation artifacts.", band: 'A' },
  ];

  // Distribute questions across levels
  const perLevel = 8;
  const start = (levelId - 1) * 2;
  const levelQs = [];
  for (let i = 0; i < perLevel; i++) {
    const idx = (start + i) % all.length;
    levelQs.push(all[idx]);
  }
  return levelQs;
}

export default function AiOrNotGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-or-not', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI or Not?" color="#4F6EF7" labNum={1}>
      <GameLevelSystem gameTitle="AI or Not?" gameEmoji="🤔" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#4F6EF7" gameEmoji="🤔" timePerQuestion={15} />
        )}
      />
    </GameShell>
  );
}
