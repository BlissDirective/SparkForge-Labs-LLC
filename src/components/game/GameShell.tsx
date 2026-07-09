'use client';

// ================================================================
// GAME SHELL — HTML-first wrapper for all SparkForge games
// ================================================================
// v2 UI/UX Redesign (Phase 8 reconciliation): the 3D-cockpit
// GameShell was retired alongside the Three.js dashboard. This is
// the lightweight HTML wrapper every game renders inside.
//
// Supports BOTH game APIs so the migration can land incrementally:
//   • Redesign (HTML-first) games:
//       <GameShell title="X" color="#hex" labNum={N}>…</GameShell>
//     and credit XP via useGameActions().awardXP(n) +
//     completeGame(gameId, stars).
//   • Legacy games (PromptLab, AgentArchitect, EthicsCourtroom,
//     BuildClassifier, ApiExplorer):
//       <GameShell gameId title worldNumber worldColor totalRounds>
//     which still relies on startGame() being called on mount.
//
// Preserved from the old shell:
//   • XPPopupProvider + JuiceProvider (Phase 5 juice) + GameErrorBoundary
//   • Correct/wrong chimes driven by score delta
//   • Escape-to-pause
//   • Server-authoritative reward pipeline on completion
//     (useCompleteAndReward) + 2D celebration trigger
// Removed (redesign): sceneStore/cockpitStore/GameHUD3D/broadcast +
//   all WebGPU/Three.js cockpit wiring.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import FocusTrap from 'focus-trap-react';
import { useReducedMotion } from 'motion/react';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useUIStore } from '@/stores/uiStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { useGameSounds } from '@/hooks/useGameSounds';
import { XPPopupProvider } from '@/components/game/XPPopup';
import { GameErrorBoundary } from '@/components/game/GameErrorBoundary';
import { JuiceProvider } from '@/components/juice/JuiceProvider';
import ConfettiBurst from '@/components/bits/Confetti';
import { publishGameSnapshot, clearGameSnapshot } from '@/lib/dev/gameInspector';
import { useAdaptiveStore } from '@/stores/adaptiveStore';
import { GameLabContext } from '@/components/game/gameLabContext';
import { GAME_REGISTRY } from '@/config/gameRegistry';

// Slug → lab id, built once. Powers the universal adaptive feed: every
// game completion records a performance sample for that game's lab so
// the invisible adaptive controller has real data (G5).
const LAB_BY_SLUG: Record<string, number> = Object.fromEntries(
  GAME_REGISTRY.map((g) => [g.slug, g.lab]),
);

interface GameShellProps {
  title: string;
  /** Redesign accent color. Falls back to legacy `worldColor`. */
  color?: string;
  /** Redesign lab number. Falls back to legacy `worldNumber`. */
  labNum?: number;
  /** Legacy: unique game id. Redesign games set this via completeGame(). */
  gameId?: string;
  /** @deprecated legacy alias for `color` */
  worldColor?: string;
  /** @deprecated legacy alias for `labNum` */
  worldNumber?: number;
  /** Legacy: total rounds — drives startGame() on mount. */
  totalRounds?: number;
  hints?: number;
  /** @deprecated XP is server-authoritative (GAME_XP_REWARDS lookup). */
  xpReward?: number;
  showTimer?: boolean;
  children: ReactNode;
}

const DEFAULT_COLOR = '#4F6EF7';

export function GameShell({
  title,
  color,
  labNum,
  gameId,
  worldColor,
  worldNumber,
  totalRounds,
  hints = 3,
  xpReward = 50,
  children,
}: GameShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const accentColor = color ?? worldColor ?? DEFAULT_COLOR;
  const labNumber = labNum ?? worldNumber;

  const startGame = useGameStore((s) => s.startGame);
  const isComplete = useGameStore((s) => s.isComplete);
  const score = useGameStore((s) => s.score);
  const currentRound = useGameStore((s) => s.currentRound);
  const activeChild = useActiveChild();
  const completeAndReward = useCompleteAndReward();

  // Legacy games depend on the shell starting the store game on mount.
  // Redesign games manage their own progression (GameLevelSystem) and
  // omit gameId/totalRounds here, so we skip it for them.
  useEffect(() => {
    if (gameId && typeof totalRounds === 'number') {
      startGame(gameId, totalRounds, hints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, totalRounds, hints]);

  // Correct/wrong chimes from score delta (legacy games call updateScore).
  const sfx = useGameSounds();
  const prevScoreRef = useRef(0);
  const prevRoundRef = useRef(0);
  useEffect(() => {
    prevScoreRef.current = 0;
    prevRoundRef.current = 0;
  }, [gameId]);
  useEffect(() => {
    if (score > prevScoreRef.current) {
      sfx.playCorrect();
      const roundsAdvanced = currentRound - prevRoundRef.current;
      if (roundsAdvanced <= 1 && currentRound >= 3) {
        sfx.playCombo(currentRound);
      }
    } else if (currentRound > prevRoundRef.current && !isComplete) {
      sfx.playWrong();
    }
    prevScoreRef.current = score;
    prevRoundRef.current = currentRound;
  }, [score, currentRound, isComplete, sfx]);

  // Escape toggles pause while playing (ignored once complete).
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

  // Reward pipeline: fires once when the game completes. Reads the
  // resolved gameId + XP from the store so it works for both APIs.
  const hasRewarded = useRef(false);
  useEffect(() => {
    if (!isComplete || hasRewarded.current || !activeChild?.id) return;
    hasRewarded.current = true;

    const rewardAsync = async () => {
      const snap = useGameStore.getState();
      const resolvedGameId = snap.currentGame ?? gameId;
      if (!resolvedGameId) {
        hasRewarded.current = false;
        return;
      }
      const xp = snap.xpAwarded > 0 ? snap.xpAwarded : xpReward;
      try {
        await completeAndReward(activeChild.id, resolvedGameId, xp, 'game', snap.score);
      } catch {
        hasRewarded.current = false;
        return;
      }
      // 2D celebration tier from stars (redesign) or score (legacy).
      const stars = snap.lastStars;
      const celebrationType = stars >= 3 ? 'level' : stars >= 2 ? 'confetti' : 'xp';
      useUIStore.getState().triggerCelebration(celebrationType);

      // G5 — feed the invisible adaptive controller + telemetry. Accuracy
      // is score/maxScore when the game tracks a max, else stars/3. Any
      // failure here must never break the reward path, so it's guarded.
      try {
        const labId = LAB_BY_SLUG[resolvedGameId];
        if (labId) {
          const accuracy =
            snap.maxScore > 0
              ? Math.max(0, Math.min(1, snap.score / snap.maxScore))
              : Math.max(0, Math.min(1, stars / 3));
          useAdaptiveStore.getState().recordOutcome({
            childId: activeChild.id,
            gameSlug: resolvedGameId,
            labId,
            accuracy,
            stars,
          });
        }
      } catch {
        /* adaptive telemetry is best-effort — never block completion */
      }
    };

    rewardAsync();
  }, [isComplete, activeChild?.id, gameId, xpReward, completeAndReward]);

  // Reset the reward guard when a new game mounts.
  useEffect(() => {
    hasRewarded.current = false;
  }, [gameId]);

  // R3 celebration ritual (DESIGN §6/§8): ConfettiBurst on the ONE shared
  // completion moment every game hits — gameStore.isComplete flipping true
  // (redesign games via completeGame(), legacy games via the round loop).
  // Earned wins only: fires exactly once per completion, lab-colored.
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const wasCompleteRef = useRef(false);
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setConfettiTrigger((t) => t + 1);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);
  const confettiColors = useMemo(
    () => [accentColor, '#4DE9FF', '#E945F5', '#4F6EF7', '#FFD93D', '#2ECC71'],
    [accentColor],
  );

  const safeGameId = gameId ?? title.toLowerCase().replace(/\s+/g, '-');

  // Dev-only inspector hook (Fable Phase A item 3 / §2.3): mirror shell
  // state onto window.__SPARKFORGE_GAME__ so the Playwright loop can assert
  // game state textually while judging canvas visuals from screenshots.
  useEffect(() => {
    publishGameSnapshot({
      gameId: safeGameId,
      title,
      labNumber,
      score,
      currentRound,
      isComplete,
    });
  }, [safeGameId, title, labNumber, score, currentRound, isComplete]);

  useEffect(() => () => clearGameSnapshot(), []);

  return (
    <XPPopupProvider>
      <JuiceProvider>
        <GameErrorBoundary gameId={safeGameId} gameTitle={title} worldColor={accentColor}>
          <FocusTrap
            active={!isComplete}
            focusTrapOptions={{
              allowOutsideClick: true,
              clickOutsideDeactivates: false,
              escapeDeactivates: false,
              returnFocusOnDeactivate: true,
              initialFocus: false,
              fallbackFocus: `[data-game-id="${safeGameId}"]`,
            }}
          >
            <div
              className="relative h-full w-full rounded-sf-xl"
              style={{ border: `1px solid ${accentColor}40` }}
              data-game-id={safeGameId}
              data-world={labNumber}
              data-world-color={accentColor}
              data-reduced-motion={prefersReducedMotion || undefined}
              role="region"
              aria-label={`${title} game`}
              tabIndex={-1}
            >
              {/* R3 lab-colored chrome: soft top accent bar (DESIGN §8) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-sf-xl"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  opacity: 0.7,
                }}
              />
              {/* G5 — publish the lab id so nested frameworks (GameLevelSystem)
                  can surface the adaptive nudge without per-game wiring. */}
              <GameLabContext.Provider value={labNumber ?? null}>
                {children}
              </GameLabContext.Provider>
            </div>
          </FocusTrap>
          <ConfettiBurst trigger={confettiTrigger} colors={confettiColors} originY={0.35} />
        </GameErrorBoundary>
      </JuiceProvider>
    </XPPopupProvider>
  );
}

export default GameShell;
