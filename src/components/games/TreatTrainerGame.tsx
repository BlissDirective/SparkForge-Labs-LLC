// ════════════════════════════════════════════════════════════════════════
// TREAT TRAINER v4 — Lab 2 (Teaching Machines) — Phaser-4 maze (Wave 7)
// ════════════════════════════════════════════════════════════════════════
// Was a four-slider pet-care simulation. Now a real tilemap MAZE with wall
// collision and BFS pathfinding (the one Phaser case in the migration map):
// guide the dog through the maze to collect every treat in as few steps as
// possible. A "Plan path" button shows the AI's shortest route — teaching how
// an agent SEARCHES for a path to a goal. Phaser-4 scene inside GameShell.
//
// Teaches: pathfinding / search — an agent plans the most efficient route to
// its reward, the foundation of how AI navigates and plans.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, PawPrint, GraduationCap, Target,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle } from '@/components/games/shared/GameVisualKit';

// Phaser is client-only — never SSR it.
const PhaserMazeStage = dynamic(() => import('@/components/games/phaser/PhaserMazeStage'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto aspect-square w-full max-w-[420px] animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#B67BFF';

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'First Steps', description: 'Guide the pup to the treats!', emoji: '🐕', difficulty: 'easy', starThresholds: [50, 70, 90], xpReward: 50 },
  { id: 2, name: 'Two Treats', description: 'Collect both, take the short way.', emoji: '🦴', difficulty: 'easy', starThresholds: [50, 70, 90], xpReward: 60 },
  { id: 3, name: 'Winding Paths', description: 'The maze gets twistier.', emoji: '🐾', difficulty: 'easy', starThresholds: [50, 70, 90], xpReward: 70 },
  { id: 4, name: 'Plan Ahead', description: 'Use the path planner if you get stuck.', emoji: '🧭', difficulty: 'medium', starThresholds: [50, 70, 90], xpReward: 80 },
  { id: 5, name: 'Three Treats', description: 'Choose a smart order to collect them.', emoji: '🍖', difficulty: 'medium', starThresholds: [50, 70, 90], xpReward: 90 },
  { id: 6, name: 'Bigger Maze', description: 'More cells, more choices.', emoji: '🗺️', difficulty: 'medium', starThresholds: [50, 70, 90], xpReward: 100 },
  { id: 7, name: 'Dead Ends', description: 'Avoid wandering down dead ends.', emoji: '🚧', difficulty: 'hard', starThresholds: [50, 70, 90], xpReward: 120 },
  { id: 8, name: 'Four Treats', description: 'Plan the most efficient tour.', emoji: '🎯', difficulty: 'hard', starThresholds: [50, 70, 90], xpReward: 130 },
  { id: 9, name: 'The Big One', description: 'A large maze with five treats.', emoji: '🌀', difficulty: 'expert', starThresholds: [50, 70, 90], xpReward: 150 },
  { id: 10, name: 'Master Pathfinder', description: 'The ultimate maze challenge!', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 90], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'An AI agent finds a path to its goal. Here you are the agent — reach every treat.',
  2: 'Fewer steps = a better path. Search algorithms look for the shortest route.',
  3: 'Walls are obstacles. The agent must plan around them, not through them.',
  4: 'Pathfinding (like BFS) explores the maze to find the shortest route. Tap "Plan path" to see it.',
  5: 'With several goals, the ORDER you visit them changes the total distance.',
  6: 'A bigger search space is harder — more cells to explore before finding the goal.',
  7: 'Dead ends waste steps. Good search prunes paths that lead nowhere.',
  8: 'Visiting many goals efficiently is a routing problem — the heart of AI planning.',
  9: 'Large mazes show why efficient search matters: brute force gets slow fast.',
  10: 'Master test: collect every treat on the shortest possible route.',
};

// Maze size + treat count grow with the level.
function mazeFor(levelId: number): { cols: number; rows: number; treats: number } {
  const cols = Math.min(9, 4 + Math.floor(levelId / 1.5));
  const treats = Math.min(5, 1 + Math.floor(levelId / 2));
  return { cols, rows: cols, treats };
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the Phaser maze
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'maze'>('welcome');
  const maze = useMemo(() => mazeFor(level.id), [level.id]);

  const handleMazeComplete = useCallback((score: number, detail: { steps: number; optimal: number }) => {
    const stars = (score >= level.starThresholds[2] ? 3
      : score >= level.starThresholds[1] ? 2
        : score >= level.starThresholds[0] ? 1 : 1) as 0 | 1 | 2 | 3; // always >=1: finishing the maze is a win
    juice.onCorrect(detail.optimal, score);
    onComplete({ score, maxScore: 100, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
  }, [level, juice, onComplete]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🐕" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Maze:</strong> Move the dog with the arrows (or arrow keys) to collect all {maze.treats} treat{maze.treats > 1 ? 's' : ''}. Fewer steps = more stars!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('maze')}>
          Enter Maze <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ MAZE ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🐕" color={LAB_COLOR}>Find the Treats</GlowingTitle>
        <SFButton variant="outline" size="sm" onClick={onExit} aria-label="Exit level">Exit</SFButton>
      </div>

      <PhaserMazeStage
        levelKey={level.id}
        cols={maze.cols}
        rows={maze.rows}
        treats={maze.treats}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
        onComplete={handleMazeComplete}
      />

      <div className="flex items-center gap-2 text-xs" style={{ color: '#8C94AC' }}>
        <PawPrint className="h-4 w-4" style={{ color: LAB_COLOR }} />
        Collect every treat to finish. Tap <strong>Plan path</strong> to see the shortest route.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function TreatTrainerGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('treat-trainer', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Treat Trainer" color={LAB_COLOR} labNum={2}>
      <GameLevelSystem
        gameTitle="Treat Trainer"
        gameEmoji="🐕"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
