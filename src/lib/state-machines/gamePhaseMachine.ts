// STATE-ENH-005 (Recommended): Generic game phase state machine
//
// Every SparkForge game follows a welcome → learn → play → complete
// flow, with some flagship games inserting extra phases (e.g.,
// NeuralBuilder's collect → train → test → results). This machine
// generalizes over all of them via a configurable phase list.
//
// Design: a single FSM with string-typed states is simpler than a
// parameterized setup() machine for this use case. Callers pass the
// ordered phase list; the machine emits `advance` / `reset` actions
// and exposes a `phase` context value.

import { setup, assign } from 'xstate';

export type GamePhase = string;

export interface GamePhaseContext {
  phases: readonly GamePhase[];
  currentIndex: number;
  gameId: string;
  /** Milliseconds since machine started — filled on final state. */
  totalElapsedMs: number | null;
  startedAt: number;
}

export type GamePhaseEvent =
  | { type: 'ADVANCE' }
  | { type: 'JUMP_TO'; phase: GamePhase }
  | { type: 'RESET' }
  | { type: 'COMPLETE' };

export interface GamePhaseInput {
  phases: readonly GamePhase[];
  gameId: string;
}

export const gamePhaseMachine = setup({
  types: {} as {
    context: GamePhaseContext;
    events: GamePhaseEvent;
    input: GamePhaseInput;
  },
  actions: {
    next: assign(({ context }) => ({
      currentIndex: Math.min(context.currentIndex + 1, context.phases.length - 1),
    })),
    jumpTo: assign(({ context, event }) => {
      if (event.type !== 'JUMP_TO') return {};
      const idx = context.phases.indexOf(event.phase);
      return idx >= 0 ? { currentIndex: idx } : {};
    }),
    reset: assign(({ context }) => ({
      currentIndex: 0,
      totalElapsedMs: null,
      startedAt: Date.now(),
      phases: context.phases,
      gameId: context.gameId,
    })),
    stampElapsed: assign(({ context }) => ({
      totalElapsedMs: Date.now() - context.startedAt,
    })),
  },
  guards: {
    isLastPhase: ({ context }) =>
      context.currentIndex >= context.phases.length - 1,
  },
}).createMachine({
  id: 'gamePhase',
  context: ({ input }) => ({
    phases: input.phases,
    currentIndex: 0,
    gameId: input.gameId,
    totalElapsedMs: null,
    startedAt: Date.now(),
  }),
  initial: 'active',
  states: {
    active: {
      on: {
        ADVANCE: [
          {
            guard: 'isLastPhase',
            target: 'complete',
            actions: 'stampElapsed',
          },
          { actions: 'next' },
        ],
        JUMP_TO: { actions: 'jumpTo' },
        COMPLETE: { target: 'complete', actions: 'stampElapsed' },
        RESET: { actions: 'reset' },
      },
    },
    complete: {
      on: { RESET: { target: 'active', actions: 'reset' } },
    },
  },
});

/** Pure helper — exposed for unit tests + non-React callers. */
export function currentPhase(context: GamePhaseContext): GamePhase {
  return context.phases[context.currentIndex] ?? context.phases[0];
}
