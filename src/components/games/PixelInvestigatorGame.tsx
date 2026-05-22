// ════════════════════════════════════════════════════════════════════════
// PIXEL INVESTIGATOR v3 — Lab 7 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Investigate pixel-level image manipulation. Quiz format.
// Learn forensics: spot fakes, find hidden info, trace origins.
// 10 levels from basic to advanced image forensics.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Zoom In', description: 'Pixels tell the truth!', emoji: '🔍', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Clone Detection', description: 'Spot copied-and-pasted areas!', emoji: '👯', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Metadata Clues', description: 'Hidden info in image files!', emoji: '📁', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Lighting Check', description: 'Inconsistent shadows reveal fakes!', emoji: '💡', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Error Level Analysis', description: 'Different compression = tampering!', emoji: '📊', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Deepfake Signs', description: 'Spot AI-generated faces!', emoji: '👤', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Steganography', description: 'Hidden messages in images!', emoji: '🕵️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Camera Fingerprint', description: 'Every camera leaves a trace!', emoji: '📷', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'AI vs Real', description: 'Distinguish AI art from photos!', emoji: '🎨', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Master Detective', description: 'Solve the toughest image cases!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "When you zoom into a real photo, you see...", options: ["Natural grain and noise patterns","Perfect squares","No pixels at all","Only colors"], correctIndex: 0, explanation: "Real photos have organic sensor noise and grain. AI images often lack this natural randomness.", band: 'A' },
    { question: "If two clouds in a photo look IDENTICAL, this suggests...", options: ["Clone tool was used","Real clouds can be identical","A coincidence","Good photography"], correctIndex: 0, explanation: "Clone detection finds identical regions. Real nature never produces perfect duplicates.", band: 'A' },
    { question: "Image metadata (EXIF) can reveal...", options: ["Camera model, date, location","The photographer's name","Image contents","Passwords"], correctIndex: 0, explanation: "EXIF data stores camera settings, date/time, GPS coordinates, and software used.", band: 'B' },
    { question: "Inconsistent shadows in a photo mean...", options: ["Different images were combined","The sun moved quickly","Multiple light sources","Bad weather"], correctIndex: 0, explanation: "All shadows in a real photo point the same direction. Mixed shadows indicate composite images.", band: 'B' },
    { question: "Error Level Analysis (ELA) highlights...", options: ["Areas with different compression levels","Bright colors","Blurry regions","Small objects"], correctIndex: 0, explanation: "ELA shows areas saved at different quality levels. Edited regions often have different error patterns.", band: 'C' },
    { question: "Deepfake faces often have...", options: ["Unnatural eye blinking and lip sync","Perfect skin","Big smiles","Glasses"], correctIndex: 0, explanation: "Deepfakes struggle with natural blinking rhythm and precise lip-sync. These are key detection points.", band: 'B' },
    { question: "Steganography is the practice of...", options: ["Hiding messages inside images","Encrypting images","Compressing images","Deleting images"], correctIndex: 0, explanation: "Steganography hides data within images by subtly modifying pixel values. The image looks normal!", band: 'C' },
    { question: "Every digital camera has a unique 'fingerprint' because...", options: ["Sensor noise patterns are unique","They have serial numbers","The lens is different","The brand varies"], correctIndex: 0, explanation: "Photo Response Non-Uniformity (PRNU) creates a unique sensor noise pattern per camera.", band: 'C' },
    { question: "AI-generated images often lack...", options: ["Consistent fine details","Colors","Shapes","Brightness"], correctIndex: 0, explanation: "AI struggles with fine details: text, hands, repeating patterns, and logical consistency.", band: 'B' },
    { question: "A reverse image search helps you...", options: ["Find the original source of an image","Create new images","Edit images","Delete images"], correctIndex: 0, explanation: "Reverse image search traces where an image first appeared, revealing manipulation or out-of-context use.", band: 'B' },
    { question: "JPEG artifacts around edges suggest...", options: ["The image was saved multiple times","High quality","Raw format","No editing"], correctIndex: 0, explanation: "Each JPEG save introduces compression artifacts. Multiple saves create visible distortion around edges.", band: 'C' },
    { question: "In a genuine group photo, eye reflections should...", options: ["Point in the same direction","Be different colors","Not exist","Match clothing"], correctIndex: 0, explanation: "Eye catchlights (reflections) should match the light source direction. Mismatches suggest compositing.", band: 'C' },
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

export default function PixelInvestigatorGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('pixel-investigator', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Pixel Investigator" color="#FF6B35" labNum={7}>
      <GameLevelSystem gameTitle="Pixel Investigator" gameEmoji="🔍" labColor="#FF6B35" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#FF6B35" gameEmoji="🔍" timePerQuestion={20} />
        )}
      />
    </GameShell>
  );
}
