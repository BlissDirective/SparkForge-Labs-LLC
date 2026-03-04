'use client';

// ================================================================
// GAME SHELL — Standard wrapper for all 35 SparkForge games
// ================================================================
// Initializes gameStore on mount, provides consistent layout wrapper.
// Every game passes configuration props; GameShell calls startGame()
// and renders children inside a full-height container.
//
// Created as a prerequisite stub for Stage 6B Part B.
// Full chrome bezel + LED rim visuals are handled per-game in v3.

import { useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';

interface GameShellProps {
  gameId: string;
  title: string;
  worldNumber: number;
  worldColor: string;
  xpReward?: number;
  totalRounds: number;
  hints?: number;
  children: ReactNode;
}

export function GameShell({
  gameId,
  title,
  worldNumber,
  worldColor,
  totalRounds,
  hints = 3,
  children,
}: GameShellProps) {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    return () => {
      resetGame();
    };
  }, [gameId, totalRounds, hints, startGame, resetGame]);

  return (
    <div
      className="h-full w-full"
      data-game-id={gameId}
      data-world={worldNumber}
      data-world-color={worldColor}
      role="region"
      aria-label={`${title} game`}
    >
      {children}
    </div>
  );
}

export default GameShell;
