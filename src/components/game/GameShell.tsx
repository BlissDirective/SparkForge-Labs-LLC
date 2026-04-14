'use client';

// ================================================================
// GAME SHELL — Standard wrapper for all 35 SparkForge games
// ================================================================
// D3D Part B (D3D-B1, D3D-B5): CockpitCanvas now persists during
// gameplay. GameShell signals scene transitions via sceneStore
// instead of toggling canvas unmount. The mechanical iris transition
// is triggered automatically when entering/exiting a game.
//
// Phase 5: Registers GameHUD3D in sceneStore.gameHUDContent so the
// 3D HUD renders inside CockpitCanvas during gameplay. The HUD
// reads gameStore directly — no props needed.
//
// REMOVED (D3D-1): isMobile state, GenericGameParticles
// REMOVED (D3D-2): LODWrapper, toLODTier, GAME_REGISTRY imports
// REMOVED (D3D-B1): setGameActive(true/false) — canvas no longer unmounts
// ADDED (D3D-B5): enterGame/exitGame via sceneStore — triggers iris transition
// ADDED (S5-CRIT-002): useCompleteAndReward — auto XP/streak/badge on game complete
// ADDED (S5-HIGH-006): XPPopupProvider — wraps children for XP popup display
// ADDED (ENH-Phase1B): Game completion → CeremonyFX tier (bronze/silver/gold)
// ADDED (Phase5): GameHUD3D registered via sceneStore.setGameHUDContent

import React, { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { XPPopupProvider } from '@/components/game/XPPopup';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';
import { getCompletionTier } from '@/lib/3d/gameParticles';
import { GameHUD3D } from '@/components/3d/game-ui/GameHUD3D';

interface GameShellProps {
  gameId: string;
  title: string;
  worldNumber: number;
  worldColor: string;
  xpReward?: number;
  totalRounds: number;
  hints?: number;
  /** Show elapsed timer in HUD */
  showTimer?: boolean;
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
  showTimer = false,
  children,
}: GameShellProps) {
  const prefersReducedMotion = useReducedMotion();

  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const isComplete = useGameStore((s) => s.isComplete);
  const score = useGameStore((s) => s.score);
  const enterGame = useSceneStore((s) => s.enterGame);
  const exitGame = useSceneStore((s) => s.exitGame);
  const setGameHUDContent = useSceneStore((s) => s.setGameHUDContent);
  const activeChild = useChildStore((s) => s.activeChild);
  const completeAndReward = useCompleteAndReward();
  const hasRewarded = useRef(false);

  // Scene + game initialization
  // Phase 1 audit fix (Section 3.3): Activate 'game' cockpit mode preset
  // (FOV 72, centerScale 1.75, panel opacity 0.4, panelOffset 0.3)
  const setActiveMode = useCockpitStore((s) => s.setActiveMode);
  const previousModeRef = useRef(useCockpitStore.getState().activeMode);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  useEffect(() => {
    // Capture mode before entering game for restoration on exit
    previousModeRef.current = useCockpitStore.getState().activeMode;

    startGame(gameId, totalRounds, hints);
    enterGame(gameId, worldColor);
    setActiveMode('game');
    broadcast({ type: 'game-enter', source: gameId, value: 1.0 });

    // Register 3D HUD in sceneStore — renders inside CockpitCanvas (Phase 5)
    setGameHUDContent(
      React.createElement(GameHUD3D, {
        color: worldColor,
        title,
        showTimer,
        maxScore: totalRounds * 10,
      })
    );

    return () => {
      broadcast({ type: 'game-exit', source: gameId, value: 1.0 });
      setActiveMode(previousModeRef.current);
      exitGame(); // Also clears gameHUDContent
      resetGame();
      hasRewarded.current = false;
    };
  }, [gameId, totalRounds, hints, worldColor, title, showTimer, startGame, resetGame, enterGame, exitGame, setGameHUDContent, setActiveMode, broadcast]);

  // Reward pipeline: fires once when game completes
  useEffect(() => {
    if (!isComplete || hasRewarded.current || !activeChild?.id) return;
    hasRewarded.current = true;

    const rewardAsync = async () => {
      try {
        await completeAndReward(activeChild.id, gameId, xpReward, 'game', score);
      } catch {
        // Reset so the reward can be retried on next render cycle
        hasRewarded.current = false;
        return;
      }

      // Trigger cockpit CeremonyFX based on completion tier
      const scorePercent = totalRounds > 0 ? (score / (totalRounds * 10)) * 100 : 50;
      const tier = getCompletionTier(scorePercent);
      const celebrationType = tier === 'gold' ? 'level' : tier === 'silver' ? 'confetti' : 'xp';
      useUIStore.getState().triggerCelebration(celebrationType);
    };

    rewardAsync();
  }, [isComplete, activeChild?.id, gameId, xpReward, score, totalRounds, completeAndReward]);

  return (
    <XPPopupProvider>
      {/* Phase 1 audit fix (Section 8.7): GameErrorBoundary wraps all 35 games */}
      <GameErrorBoundary gameId={gameId} gameTitle={title} worldColor={worldColor}>
        <div
          className="h-full w-full"
          data-game-id={gameId}
          data-world={worldNumber}
          data-world-color={worldColor}
          data-reduced-motion={prefersReducedMotion || undefined}
          role="region"
          aria-label={`${title} game`}
        >
          {children}
        </div>
      </GameErrorBoundary>
    </XPPopupProvider>
  );
}

export default GameShell;
