'use client';

// STATE-ENH-005 (Recommended): React binding for the game phase machine
//
// Drop-in for the useState-based `type Phase = 'welcome' | ...`
// pattern used by every SparkForge game. Existing games can migrate
// incrementally — the shape mirrors the current `phase` + `setPhase`
// + `complete()` API.
//
// Usage:
//   const { phase, advance, jumpTo, complete, reset, isComplete } =
//     useGamePhaseMachine({
//       gameId: 'ai-spy',
//       phases: ['welcome', 'learn', 'play', 'complete'],
//     });

import { useMachine } from '@xstate/react';
import { useMemo } from 'react';
import {
  gamePhaseMachine,
  currentPhase,
  type GamePhase,
} from '@/lib/state-machines/gamePhaseMachine';

export interface UseGamePhaseMachineArgs {
  gameId: string;
  phases: readonly GamePhase[];
}

export function useGamePhaseMachine({ gameId, phases }: UseGamePhaseMachineArgs) {
  const [snapshot, send] = useMachine(gamePhaseMachine, {
    input: { gameId, phases },
  });

  return useMemo(
    () => ({
      phase: currentPhase(snapshot.context),
      phaseIndex: snapshot.context.currentIndex,
      isComplete: snapshot.matches('complete'),
      totalElapsedMs: snapshot.context.totalElapsedMs,
      advance: () => send({ type: 'ADVANCE' }),
      jumpTo: (p: GamePhase) => send({ type: 'JUMP_TO', phase: p }),
      complete: () => send({ type: 'COMPLETE' }),
      reset: () => send({ type: 'RESET' }),
    }),
    [snapshot, send],
  );
}
