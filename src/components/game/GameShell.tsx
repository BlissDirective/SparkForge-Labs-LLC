'use client';

// ================================================================
// GAME SHELL — Standard wrapper for all 35 SparkForge games
// ================================================================
// D3D Part B (D3D-B1, D3D-B5): CockpitCanvas now persists during
// gameplay. GameShell signals scene transitions via sceneStore
// instead of toggling canvas unmount. The mechanical iris transition
// is triggered automatically when entering/exiting a game.
//
// REMOVED (D3D-1): isMobile state, GenericGameParticles
// REMOVED (D3D-2): LODWrapper, toLODTier, GAME_REGISTRY imports
// REMOVED (D3D-B1): setGameActive(true/false) — canvas no longer unmounts
// ADDED (D3D-B5): enterGame/exitGame via sceneStore — triggers iris transition

import { useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSceneStore } from '@/stores/sceneStore';

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
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);

  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    enterGame(gameId, worldColor);
    return () => {
      exitGame();
      resetGame();
    };
  }, [gameId, totalRounds, hints, worldColor, startGame, resetGame, enterGame, exitGame]);

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
