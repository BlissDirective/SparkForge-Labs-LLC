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
import FocusTrap from 'focus-trap-react';
import { useReducedMotion } from 'motion/react';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useSceneStore } from '@/stores/sceneStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useUIStore } from '@/stores/uiStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { useGameSounds } from '@/hooks/useGameSounds';
import { XPPopupProvider } from '@/components/game/XPPopup';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';
import { JuiceProvider } from '@/components/juice/JuiceProvider';
import { getCompletionTier } from '@/lib/3d/gameParticles';
import { GameHUD3D } from '@/components/3d/game-ui/GameHUD3D';

interface GameShellProps {
  gameId: string;
  title: string;
  worldNumber: number;
  worldColor: string;
  /**
   * @deprecated API-HIGH-003 (C): XP is now server-authoritative.
   *   For source='game' the value is looked up from GAME_XP_REWARDS
   *   in src/lib/game-xp-config.ts by the /api/gamification/xp route.
   *   This prop is still accepted for backwards compat but the server
   *   ignores any client-supplied amount when the source is 'game'.
   */
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
  const isComplete = useGameStore((s) => s.isComplete);
  const score = useGameStore((s) => s.score);
  const currentRound = useGameStore((s) => s.currentRound);

  // Phase 4 §10.6 (H-B): Auto-play correct/wrong chime on score changes.
  // Every game that calls `updateScore(+N)` on a correct answer now gets
  // the canonical child-safe correct/wrong audio for free — no per-game
  // wiring required. Tracks score delta between renders. Positive delta
  // (normal case: +10 for correct) triggers playCorrect; a stale-round
  // advance WITHOUT a delta is a no-op (most games increment round on
  // both correct and wrong — we rely on score delta as the signal).
  // Games that need more granular control (Pet Trainer, Agent Architect,
  // Neural Builder, Bias Detective, Sort Toy Box, Prompt Lab) still use
  // their bespoke per-game audio hooks and can call sfx.playWrong()
  // directly when they detect a wrong answer.
  const sfx = useGameSounds();
  const prevScoreRef = useRef(0);
  const prevRoundRef = useRef(0);
  useEffect(() => {
    // Reset tracking when a new game mounts
    prevScoreRef.current = 0;
    prevRoundRef.current = 0;
  }, [gameId]);
  useEffect(() => {
    if (score > prevScoreRef.current) {
      // Score went up — correct answer
      const delta = score - prevScoreRef.current;
      sfx.playCorrect();
      // Combo pitch-climb on consecutive correct rounds (no round reset
      // between). Use currentRound - prevRound as a simple streak proxy.
      const roundsAdvanced = currentRound - prevRoundRef.current;
      if (delta > 0 && roundsAdvanced <= 1 && currentRound >= 3) {
        sfx.playCombo(currentRound);
      }
    } else if (currentRound > prevRoundRef.current && !isComplete) {
      // Round advanced with no score change — typically means wrong answer.
      // Skip if isComplete (end-of-game ceremony handles its own audio).
      sfx.playWrong();
    }
    prevScoreRef.current = score;
    prevRoundRef.current = currentRound;
  }, [score, currentRound, isComplete, sfx]);
  const enterGame = useSceneStore((s) => s.enterGame);
  // STATE-MED-003 (B): single coordinated teardown replaces the previous
  // exitGame() + resetGame() pair. Idempotent so StrictMode / concurrent
  // unmounts are safe.
  const cleanupGame = useSceneStore((s) => s.cleanupGame);
  const setGameHUDContent = useSceneStore((s) => s.setGameHUDContent);
  const activeChild = useActiveChild();
  const completeAndReward = useCompleteAndReward();
  const hasRewarded = useRef(false);

  // Scene + game initialization
  // Phase 1 audit fix (Section 3.3): Activate 'game' cockpit mode preset
  // (FOV 72, centerScale 1.75, panel opacity 0.4, panelOffset 0.3)
  const setActiveMode = useCockpitStore((s) => s.setActiveMode);
  const previousModeRef = useRef(useCockpitStore.getState().activeMode);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  // Phase 2 audit fix (Section 5.7): 400ms game entry anticipation sequence
  // Ref to track anticipation timeout so it can be cleared on unmount
  const anticipationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Capture mode before entering game for restoration on exit
    previousModeRef.current = useCockpitStore.getState().activeMode;

    // Start game state immediately so GameHUD content renders
    startGame(gameId, totalRounds, hints);

    // Phase 2 audit fix (Section 5.7): 400ms game entry anticipation sequence
    // (1) Broadcast anticipation start — LEDs ramp, HUD dims, audio engines can build tone
    // (2) Broadcast particle-converge via reused event channel (fire-and-forget)
    // (3) After 400ms, broadcast anticipation end + run normal enterGame flow
    broadcast({
      type: 'game-anticipation-start',
      source: gameId,
      color: worldColor,
      value: 1.0,
    });

    anticipationTimeoutRef.current = setTimeout(() => {
      broadcast({
        type: 'game-anticipation-end',
        source: gameId,
        color: worldColor,
        value: 1.0,
      });
      enterGame(gameId, worldColor);
      setActiveMode('game');
      broadcast({ type: 'game-enter', source: gameId, value: 1.0 });
    }, 400);

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
      // Clean up anticipation timeout if unmount happens mid-sequence
      if (anticipationTimeoutRef.current) {
        clearTimeout(anticipationTimeoutRef.current);
        anticipationTimeoutRef.current = null;
      }
      broadcast({ type: 'game-exit', source: gameId, value: 1.0 });
      setActiveMode(previousModeRef.current);
      // STATE-MED-003 (B): cleanupGame sequences gameStore.resetGame()
      // → exitGame (clears HUD + scene content + iris close) →
      // activeGameLabColor reset. Replaces the previous
      // exitGame() + resetGame() pair.
      cleanupGame();
      hasRewarded.current = false;
    };
  }, [gameId, totalRounds, hints, worldColor, title, showTimer, startGame, enterGame, cleanupGame, setGameHUDContent, setActiveMode, broadcast]);

  // UX-MED-002 (T10a): Escape key toggles pause. Active while the
  // GameShell is mounted (i.e., during gameplay). Ignored once
  // isComplete fires so Escape at the complete screen doesn't flip
  // the pause flag mid-ceremony.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (useGameStore.getState().isComplete) return;
      e.preventDefault();
      useGameStore.getState().togglePause();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      {/* Phase 5: Game Juice System — combos, floating text, Sparky reactions, screen shake */}
      <JuiceProvider>
      {/* Phase 1 audit fix (Section 8.7): GameErrorBoundary wraps all 35 games */}
      <GameErrorBoundary gameId={gameId} gameTitle={title} worldColor={worldColor}>
        {/* Phase 5 O.6-MIN (§8.6): Focus trap contains Tab navigation within
            the game region during gameplay so keyboard users don't wander
            into the cockpit chrome. Released on unmount (game exit).
            allowOutsideClick so mouse users aren't blocked; clickOutsideDeactivates
            false so clicking background 3D doesn't break the trap. */}
        <FocusTrap
          active={!isComplete}
          focusTrapOptions={{
            allowOutsideClick: true,
            clickOutsideDeactivates: false,
            escapeDeactivates: false,
            returnFocusOnDeactivate: true,
            // Don't force initial focus — let the game component decide where
            // focus starts (e.g., first answer button).
            initialFocus: false,
            fallbackFocus: `[data-game-id="${gameId}"]`,
          }}
        >
          <div
            className="h-full w-full"
            data-game-id={gameId}
            data-world={worldNumber}
            data-world-color={worldColor}
            data-reduced-motion={prefersReducedMotion || undefined}
            role="region"
            aria-label={`${title} game`}
            tabIndex={-1}
          >
            {children}
          </div>
        </FocusTrap>
      </GameErrorBoundary>
      </JuiceProvider>
    </XPPopupProvider>
  );
}

export default GameShell;
