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
// ADDED (S5-CRIT-002): useCompleteAndReward — auto XP/streak/badge on game complete
// ADDED (S5-HIGH-006): XPPopupProvider — wraps children for XP popup display
// ADDED (ENH-Phase1B): Game completion → CeremonyFX tier (bronze/silver/gold)

import { useEffect, useRef, type ReactNode } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { XPPopupProvider } from '@/components/game/XPPopup';
import { getCompletionTier } from '@/lib/3d/gameParticles';

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
  xpReward = 50,
  totalRounds,
  hints = 3,
  children,
}: GameShellProps) {
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const isComplete = useGameStore((s) => s.isComplete);
  const score = useGameStore((s) => s.score);
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);
  const activeChild = useChildStore((s) => s.activeChild);
  const completeAndReward = useCompleteAndReward();
  const hasRewarded = useRef(false);

  // Scene + game initialization
  // 3D Embedding: broadcast game-enter/game-exit to cockpitBroadcastStore
  // so cockpit LED rim, HUD, and status bar react to game transitions
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  useEffect(() => {
    startGame(gameId, totalRounds, hints);
    enterGame(gameId, worldColor);
    broadcast({ type: 'game-enter', source: gameId, intensity: 1.0 });
    return () => {
      broadcast({ type: 'game-exit', source: gameId, intensity: 1.0 });
      exitGame();
      resetGame();
      hasRewarded.current = false;
    };
  }, [gameId, totalRounds, hints, worldColor, startGame, resetGame, enterGame, exitGame, broadcast]);

  // Reward pipeline: fires once when game completes
  // ENH-Phase1B: Also triggers CeremonyFX based on score tier
  useEffect(() => {
    if (!isComplete || hasRewarded.current || !activeChild?.id) return;
    hasRewarded.current = true;
    completeAndReward(activeChild.id, gameId, xpReward, 'game', score);

    // Trigger cockpit CeremonyFX based on completion tier
    const scorePercent = totalRounds > 0 ? (score / (totalRounds * 10)) * 100 : 50;
    const tier = getCompletionTier(scorePercent);
    const celebrationType = tier === 'gold' ? 'level' : tier === 'silver' ? 'confetti' : 'xp';
    useUIStore.getState().triggerCelebration(celebrationType);
  }, [isComplete, activeChild?.id, gameId, xpReward, score, totalRounds, completeAndReward]);

  return (
    <XPPopupProvider>
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
    </XPPopupProvider>
  );
}

export default GameShell;
