// ════════════════════════════════════════════════════════════════════════
// HUMAN vs MACHINE v3 — Lab 2 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Sort tasks into "Human Only", "AI Only", or "Both" categories.
// Drag-drop style with tap-to-zone interaction.
// 10 levels with increasingly tricky tasks.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import DragDropLevelRenderer from '@/components/games/shared/DragDropLevelRenderer';
import type { DragItem, DropZone } from '@/components/games/shared/DragDropLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Easy Tasks', description: 'Sort simple everyday tasks.', emoji: '🤖', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Creative Work', description: 'Who creates art, music, stories?', emoji: '🎨', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Physical Jobs', description: 'Tasks that need a body!', emoji: '💪', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Smart Decisions', description: 'Moral and ethical choices.', emoji: '⚖️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Teamwork', description: 'When humans and AI collaborate!', emoji: '🤝', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Tricky Tasks', description: 'Things that seem obvious but are not!', emoji: '😵', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Future Jobs', description: 'What work will look like in 2030.', emoji: '🔮', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'AI Surprises', description: 'Things AI can do that shock people!', emoji: '😲', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Edge Cases', description: 'Gray areas and debates.', emoji: '🤔', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Future Critic', description: 'The ultimate human vs AI test!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const ZONES: DropZone[] = [
  { id: 'human', label: 'Humans Only', emoji: '👤', color: '#4F6EF7' },
  { id: 'ai', label: 'AI Only', emoji: '🤖', color: '#E945F5' },
  { id: 'both', label: 'Both Together', emoji: '🤝', color: '#2ECC71' },
];

function getItems(levelId: number): DragItem[] {
  const all: DragItem[] = [
    { id: 'h1', label: 'Writing a heartfelt love letter', emoji: '💌', category: 'human', explanation: 'Deep emotional connection and personal experience are uniquely human.' },
    { id: 'a1', label: 'Sorting 1 million photos', emoji: '📸', category: 'ai', explanation: 'AI can process massive datasets at speeds humans cannot match.' },
    { id: 'b1', label: 'Designing a building', emoji: '🏗️', category: 'both', explanation: 'AI optimizes structure; architects provide creativity and vision.' },
    { id: 'h2', label: 'Comforting a crying friend', emoji: '🤗', category: 'human', explanation: 'Empathy and emotional support require genuine human connection.' },
    { id: 'a2', label: 'Predicting weather patterns', emoji: '🌤️', category: 'ai', explanation: 'ML models analyze satellite data and historical patterns far better than humans.' },
    { id: 'b2', label: 'Making a medical diagnosis', emoji: '🩺', category: 'both', explanation: 'AI assists with image analysis; doctors bring judgment and patient knowledge.' },
    { id: 'a3', label: 'Playing chess at grandmaster level', emoji: '♟️', category: 'ai', explanation: 'Chess engines like Stockfish surpass all human players.' },
    { id: 'h3', label: 'Creating a new scientific theory', emoji: '🔬', category: 'human', explanation: 'Breakthrough insights require creativity, intuition, and cross-domain thinking.' },
    { id: 'b3', label: 'Writing a movie script', emoji: '🎬', category: 'both', explanation: 'AI generates drafts; humans refine emotion, pacing, and cultural nuance.' },
    { id: 'a4', label: 'Driving a car on a highway', emoji: '🚗', category: 'ai', explanation: 'Self-driving systems process sensor data faster than human reflexes.' },
    { id: 'h4', label: 'Raising a child', emoji: '👶', category: 'human', explanation: 'Parenting requires love, moral guidance, and adapting to unique personalities.' },
    { id: 'b4', label: 'Composing music', emoji: '🎵', category: 'both', explanation: 'AI generates melodies; humans add soul, meaning, and performance emotion.' },
    { id: 'h5', label: 'Making ethical decisions', emoji: '⚖️', category: 'human', explanation: 'Ethics require values, cultural context, and moral reasoning that AI lacks.' },
    { id: 'a5', label: 'Translating 100 languages', emoji: '🌍', category: 'ai', explanation: 'Neural translation handles dozens of languages simultaneously and instantly.' },
    { id: 'b5', label: 'Teaching a class', emoji: '🏫', category: 'both', explanation: 'AI personalizes content; teachers inspire, mentor, and adapt emotionally.' },
    { id: 'h6', label: 'Falling in love', emoji: '❤️', category: 'human', explanation: 'Love involves consciousness, choice, and emotional depth beyond computation.' },
    { id: 'a6', label: 'Detecting fraud in transactions', emoji: '💳', category: 'ai', explanation: 'AI spots patterns across millions of transactions in real-time.' },
    { id: 'b6', label: 'Cooking a gourmet meal', emoji: '👨‍🍳', category: 'both', explanation: 'AI suggests recipes; chefs add creativity, taste, and presentation artistry.' },
  ];

  // Select items based on level
  const start = ((levelId - 1) * 3) % all.length;
  const selected = [];
  for (let i = 0; i < 8; i++) {
    selected.push(all[(start + i) % all.length]);
  }
  return selected;
}

const CONCEPTS: Record<number, string> = {
  1: 'AI excels at speed, scale, and pattern recognition. Humans excel at creativity, empathy, and judgment.',
  2: 'Creativity is not just human — but human-AI collaboration produces the most interesting art.',
  3: 'Physical tasks requiring dexterity and real-world interaction are still human strengths.',
  4: 'Ethical decisions need values, context, and empathy — areas where AI falls short.',
  5: 'The best results often come from humans and AI working together, each contributing their strengths.',
  6: 'Some tasks seem simple but are surprisingly complex, and vice versa!',
  7: 'Future jobs will shift toward AI oversight, creativity, and human connection.',
  8: 'AI capabilities keep surprising us — what seems impossible today may be routine tomorrow.',
  9: 'The boundary between human and AI capabilities is a gray zone that keeps shifting.',
  10: 'The future is not human vs AI — it is human + AI, working together to solve big problems.',
};

export default function HumanVsMachineGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('human-vs-machine', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Human vs Machine" color="#4F6EF7" labNum={2}>
      <GameLevelSystem gameTitle="Human vs Machine" gameEmoji="🤖" labColor="#4F6EF7" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <DragDropLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#4F6EF7" gameEmoji="🤖"
            description={level.description}
            concept={CONCEPTS[level.id] || CONCEPTS[1]}
            items={getItems(level.id)}
            zones={ZONES}
          />
        )}
      />
    </GameShell>
  );
}
