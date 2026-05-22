// ════════════════════════════════════════════════════════════════════════
// CODE BLOCKS v3 — Lab 9 — Redesigned
// ════════════════════════════════════════════════════════════════════════
// Drag code blocks into the right order to build programs.
// Sort code statements into correct execution order.
// 10 levels from simple sequences to complex algorithms.

'use client';
import { useCallback } from 'react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import DragDropLevelRenderer from '@/components/games/shared/DragDropLevelRenderer';
import type { DragItem, DropZone } from '@/components/games/shared/DragDropLevelRenderer';

const LEVELS = [
  { id: 1, name: 'Hello World', description: 'Put the print statement in order!', emoji: '👋', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Variables', description: 'Declare, assign, then print.', emoji: '📦', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'If Statements', description: 'Condition first, then action!', emoji: '❓', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Loops', description: 'Set up, check, repeat!', emoji: '🔄', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Functions', description: 'Define, then call!', emoji: '⚙️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Lists', description: 'Create, add, access!', emoji: '📋', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Dictionaries', description: 'Key-value pairs in order!', emoji: '🔑', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Error Handling', description: 'Try, check, recover!', emoji: '🛡️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Algorithms', description: 'Sort and search correctly!', emoji: '🔍', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Code Master', description: 'Build complex programs!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const ZONES: DropZone[] = [
  { id: 'step1', label: 'Step 1', emoji: '1️⃣', color: '#4F6EF7' },
  { id: 'step2', label: 'Step 2', emoji: '2️⃣', color: '#2ECC71' },
  { id: 'step3', label: 'Step 3', emoji: '3️⃣', color: '#FF6B35' },
  { id: 'step4', label: 'Step 4', emoji: '4️⃣', color: '#E945F5' },
];

function getItems(levelId: number): DragItem[] {
  const sets: Record<number, DragItem[]> = {
    1: [
      { id: 'c1', label: 'print("Hello!")', emoji: '🖨️', category: 'step2', explanation: 'After setting up, you print the message!' },
      { id: 'c2', label: '# Setup program', emoji: '⚙️', category: 'step1', explanation: 'Comments and setup always come first.' },
      { id: 'c3', label: 'name = "World"', emoji: '📝', category: 'step2', explanation: 'Declare the variable before using it.' },
    ],
    2: [
      { id: 'v1', label: 'x = 5', emoji: '🔢', category: 'step1', explanation: 'Declare the variable first.' },
      { id: 'v2', label: 'y = x + 3', emoji: '➕', category: 'step2', explanation: 'Use the variable after declaring it.' },
      { id: 'v3', label: 'print(y)', emoji: '🖨️', category: 'step3', explanation: 'Print the result after computing it.' },
    ],
    3: [
      { id: 'i1', label: 'age = 15', emoji: '🔢', category: 'step1', explanation: 'Set up the variable first.' },
      { id: 'i2', label: 'if age >= 13:', emoji: '❓', category: 'step2', explanation: 'Check the condition after setting up.' },
      { id: 'i3', label: '  print("Teenager")', emoji: '🖨️', category: 'step3', explanation: 'The action comes after the condition.' },
    ],
    4: [
      { id: 'l1', label: 'count = 0', emoji: '0️⃣', category: 'step1', explanation: 'Initialize the counter first.' },
      { id: 'l2', label: 'while count < 5:', emoji: '🔄', category: 'step2', explanation: 'Set up the loop condition.' },
      { id: 'l3', label: '  print(count)', emoji: '🖨️', category: 'step3', explanation: 'Do something inside the loop.' },
      { id: 'l4', label: '  count = count + 1', emoji: '➕', category: 'step4', explanation: 'Update the counter to avoid infinite loop!' },
    ],
  };

  return sets[levelId] || sets[1];
}

const CONCEPTS: Record<number, string> = {
  1: 'Programs execute top-to-bottom. Order matters!',
  2: 'Variables store data. Declare before you use!',
  3: 'If statements check conditions before acting.',
  4: 'Loops repeat code. Update your counter!',
  5: 'Functions are reusable code blocks. Define, then call!',
  6: 'Lists store collections of items. Create, then access!',
  7: 'Dictionaries use key-value pairs for fast lookups.',
  8: 'Error handling prevents crashes. Plan for mistakes!',
  9: 'Algorithms are step-by-step problem-solving recipes.',
  10: 'Master programming by combining all concepts!',
};

export default function CodeBlocksGame() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('code-blocks', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Code Blocks" color="#E945F5" labNum={9}>
      <GameLevelSystem gameTitle="Code Blocks" gameEmoji="💻" labColor="#E945F5" levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <DragDropLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor="#E945F5" gameEmoji="💻"
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
