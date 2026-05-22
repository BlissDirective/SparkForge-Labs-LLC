// ════════════════════════════════════════════════════════════════════════
// EMOJI DECODER v3 — Lab 1 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Decode emoji meanings and cultural differences. Quiz format.
// 10 levels from simple faces to complex cultural emoji.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import QuizLevelRenderer, { type QuizQuestion } from '@/components/games/shared/QuizLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Faces', description: 'What do facial expressions mean?', emoji: '😊', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Gestures', description: 'Hand signs around the world!', emoji: '👍', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Food', description: 'Food emoji culture!', emoji: '🍕', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Animals', description: 'Animal symbolism!', emoji: '🐉', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Colors', description: 'Color meanings differ!', emoji: '🟥', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Numbers', description: 'Lucky and unlucky numbers!', emoji: '7️⃣', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'AI & Emoji', description: 'How AI understands emoji!', emoji: '🤖', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Lost in Emoji', description: 'When emoji go wrong!', emoji: '😅', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Emoji Art', description: 'Creative emoji combinations!', emoji: '🎨', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Emoji Master', description: 'The ultimate emoji challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

function getQuestions(levelId: number): QuizQuestion[] {
  const all: QuizQuestion[] = [
    { question: "In Western cultures, 👍 means approval. In parts of the Middle East, it can be...", options: ["Offensive","Extra positive","A peace sign","A request for food"], correctIndex: 0, explanation: "The thumbs-up is offensive in parts of the Middle East and West Africa. Context matters!", band: 'A' },
    { question: "😂 is the 'face with tears of joy.' In 2015, Oxford Dictionary named it...", options: ["Word of the Year","Emoji of the Century","Best Invention","A mistake"], correctIndex: 0, explanation: "The 😂 emoji was Oxford's 2015 Word of the Year — the first emoji to win!", band: 'A' },
    { question: "🍎 The apple emoji has different cultural meanings. In the US it represents...", options: ["Education (teacher's apple)","The forbidden fruit","Health only","A tech company"], correctIndex: 0, explanation: "In American culture, apples are associated with teachers and education. In other contexts, they reference the biblical forbidden fruit.", band: 'B' },
    { question: "👍👎 are used for voting in some platforms because they represent...", options: ["Simple binary choices","Complex emotions","Random choices","Mandatory responses"], correctIndex: 0, explanation: "Thumbs up/down creates a simple binary feedback mechanism — similar to Like/Dislike.", band: 'A' },
    { question: "🙏 The 'folded hands' emoji is interpreted differently across cultures as...", options: ["Prayer OR please/thank you OR high-five","Only prayer","Only gratitude","Only greeting"], correctIndex: 0, explanation: "🙏 means prayer in religious contexts, 'please/thank you' in Japan, and some Western users use it as a high-five!", band: 'B' },
    { question: "AI models process emoji by...", options: ["Converting them to text descriptions","Ignoring them","Drawing them","Deleting them"], correctIndex: 0, explanation: "Most NLP models convert emoji to their text descriptions (e.g., 😂 → 'face with tears of joy') for processing.", band: 'B' },
    { question: "The 🍑 emoji is commonly used to represent...", options: ["A buttocks (slang)","A fruit","Georgia (the US state)","All of the above"], correctIndex: 3, explanation: "🍑 has multiple meanings: literal peach, slang for buttocks, and representing Georgia (the Peach State).", band: 'A' },
    { question: "In China, the number 4 (四) sounds like the word for...", options: ["Death (死)","Life","Fortune","Love"], correctIndex: 0, explanation: "Because 4 sounds like 'death', many Chinese buildings skip the 4th floor (like Western buildings skip 13).", band: 'A' },
    { question: "🎉 is commonly used for celebrations, but AI might misinterpret it as...", options: ["A positive sentiment indicator only","An actual party invitation","A noise maker","Confetti"], correctIndex: 0, explanation: "AI often simplifies emoji to sentiment scores. 🎉 = positive, but misses the specific celebration context.", band: 'B' },
    { question: "The 💩 emoji was originally designed to represent...", options: ["Good luck in Japan (golden poo)","Just what it looks like","Chocolate ice cream","A mistake"], correctIndex: 0, explanation: "The 💩 emoji is based on 'kin no unko' (golden poo) — a Japanese good luck charm! Not just what it seems.", band: 'B' },
    { question: "🐉 The dragon symbolizes...", options: ["Power in China, danger in the West","Evil everywhere","Good luck everywhere","Only in fairy tales"], correctIndex: 0, explanation: "Dragons are revered in Chinese culture (symbol of power) but feared in Western mythology. Same emoji, different meaning!", band: 'B' },
    { question: "A 'zwj sequence' like 👨‍👩‍👧‍👦 creates...", options: ["Family combinations from individual emoji","Animated emoji","3D emoji","Sound emoji"], correctIndex: 0, explanation: "Zero-Width Joiner (ZWJ) sequences combine emoji. 👨+ZWJ+👩+ZWJ+👧+ZWJ+👦 = a family emoji!", band: 'C' },
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

export default function EmojiDecoderGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('emoji-decoder', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Emoji Decoder" color="#4F6EF7" labNum={1}>
      <GameLevelSystem gameTitle="Emoji Decoder" gameEmoji="😊" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <QuizLevelRenderer level={level} onComplete={onComplete} onExit={onExit}
            questions={getQuestions(level.id)} labColor="#4F6EF7" gameEmoji="😊" timePerQuestion={15} />
        )}
      />
    </GameShell>
  );
}
