// ════════════════════════════════════════════════════
// Game Store — per-child factory
// Final-Audit 04-15-2026 finding STATE-CRIT-001 (Option B)
//
// Before this refactor, `useGameStore` was a single global Zustand store.
// Switching between child profiles on the same device did NOT reset the
// store, so Child A could start a game, the parent could switch to Child
// B, and Child B would "inherit" A's in-progress game state. XP awards
// would be credited to the wrong child.
//
// After this refactor: each child gets an isolated vanilla Zustand store
// looked up by `activeChild?.id`. The public `useGameStore` hook reads
// the active child id from `useChildStore` and dispatches all subscriptions
// and reads through the per-child store.
//
// API compatibility:
//   - useGameStore(selector)     — same as before
//   - useGameStore()             — returns full state
//   - useGameStore.getState()    — returns snapshot of the MOST RECENTLY
//                                  active child's store (or orphan store
//                                  if no child is active yet)
//   - useGameStore.setState(...) — same semantics as getState
//   - useGameStore.subscribe(fn) — subscribes to the current child's store
//                                  at the time of call; listener is NOT
//                                  automatically re-bound on child switch
//                                  (callers that care should re-subscribe
//                                  when activeChild changes — see
//                                  src/components/shared/A11yAnnouncer.tsx)
// ════════════════════════════════════════════════════

import { createStore, useStore, type StoreApi } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useChildStore } from '@/stores/childStore';

type GamePhase = 'idle' | 'welcome' | 'learn' | 'play' | 'complete';

// UX-MED-001 (A): auto-save indicator lifecycle.
//   'idle'   — nothing in flight, indicator hidden
//   'saving' — a reward-pipeline API call is in flight
//   'saved'  — last call succeeded; auto-fades back to 'idle' 1500ms later
//   'error'  — last call failed; indicator flashes red until next attempt
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface GameState {
  currentGame: string | null;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  score: number;
  maxScore: number;
  /** Redesign (HTML-first games): XP accumulated via awardXP() this session. */
  xpAwarded: number;
  /** Redesign (HTML-first games): stars (0-3) reported at completeGame(). */
  lastStars: number;
  isComplete: boolean;
  isPaused: boolean;
  hintsRemaining: number;
  timeElapsed: number;
  gameData: Record<string, unknown>;
  /** UX-MED-001 (A): current save-indicator state. */
  saveState: SaveState;
  startGame: (gameId: string, totalRounds: number, hints?: number) => void;
  setPhase: (phase: GamePhase) => void;
  updateScore: (points: number) => void;
  setMaxScore: (points: number) => void;
  /**
   * Redesign (HTML-first games): credit XP earned this session. The
   * server reward pipeline is authoritative for the actual amount
   * (see useCompleteAndReward); this just tracks the client-side total
   * so GameShell can forward it and the HUD can display it.
   */
  awardXP: (points: number) => void;
  advanceRound: () => void;
  useHint: () => void;
  /** UX-MED-001 (A): update the auto-save indicator. */
  setSaveState: (s: SaveState) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  /** UX-MED-002 (T10a): toggle between paused and playing. Prefer
   *  this over pauseGame/resumeGame when the caller doesn't know
   *  the current state (Escape handler, PauseButton3D click). */
  togglePause: () => void;
  /**
   * Mark the active game complete. Redesign (HTML-first) games call this
   * with `(gameId, stars)`; legacy 3D games call it with no arguments
   * after `startGame()` has already set `currentGame`.
   */
  completeGame: (gameId?: string, stars?: number) => void;
  resetGame: () => void;
  setGameData: (key: string, value: unknown) => void;
  tick: () => void;
}

// ─── Factory ────────────────────────────────────────────────────────
function createGameStore(): StoreApi<GameState> {
  return createStore<GameState>((set, get) => ({
    currentGame: null,
    phase: 'idle',
    currentRound: 0,
    totalRounds: 0,
    score: 0,
    maxScore: 0,
    xpAwarded: 0,
    lastStars: 0,
    isComplete: false,
    isPaused: false,
    hintsRemaining: 3,
    timeElapsed: 0,
    gameData: {},
    saveState: 'idle' as SaveState,
    startGame: (gameId, totalRounds, hints = 3) =>
      set({
        currentGame: gameId,
        phase: 'play',
        currentRound: 1,
        totalRounds,
        score: 0,
        maxScore: 0,
        xpAwarded: 0,
        lastStars: 0,
        isComplete: false,
        isPaused: false,
        hintsRemaining: hints,
        timeElapsed: 0,
        gameData: {},
        saveState: 'idle',
      }),
    setSaveState: (saveState) => set({ saveState }),
    setPhase: (phase) => set({ phase }),
    updateScore: (points) => set((s) => ({ score: s.score + points })),
    setMaxScore: (points) => set({ maxScore: points }),
    awardXP: (points) => set((s) => ({ xpAwarded: s.xpAwarded + Math.max(0, points) })),
    advanceRound: () => {
      const s = get();
      const nextRound = s.currentRound + 1;
      if (nextRound > s.totalRounds) {
        set({ isComplete: true, phase: 'complete' });
      } else {
        set({ currentRound: nextRound });
      }
    },
    useHint: () => set((s) => ({ hintsRemaining: Math.max(0, s.hintsRemaining - 1) })),
    pauseGame: () => set({ isPaused: true }),
    resumeGame: () => set({ isPaused: false }),
    togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
    completeGame: (gameId, stars) => {
      const s = get();
      // Guard: don't re-complete. Redesign games may supply their own
      // gameId here (legacy games set it earlier via startGame).
      if (s.isComplete) return;
      set({
        currentGame: gameId ?? s.currentGame,
        isComplete: true,
        phase: 'complete',
        ...(typeof stars === 'number' ? { lastStars: stars } : {}),
      });
    },
    resetGame: () =>
      set({
        currentGame: null,
        phase: 'idle',
        currentRound: 1,
        totalRounds: 0,
        score: 0,
        maxScore: 0,
        xpAwarded: 0,
        lastStars: 0,
        isComplete: false,
        isPaused: false,
        hintsRemaining: 3,
        timeElapsed: 0,
        gameData: {},
        saveState: 'idle',
      }),
    setGameData: (key, value) => set((s) => ({ gameData: { ...s.gameData, [key]: value } })),
    tick: () => set((s) => (s.isPaused ? {} : { timeElapsed: s.timeElapsed + 1 })),
  }));
}

// ─── Per-child registry ─────────────────────────────────────────────
const ORPHAN_KEY = '__orphan__';
const storeByChildId = new Map<string, StoreApi<GameState>>();

function resolveKey(childId: string | null | undefined): string {
  return childId ?? ORPHAN_KEY;
}

function getOrCreate(childId: string | null | undefined): StoreApi<GameState> {
  const key = resolveKey(childId);
  let store = storeByChildId.get(key);
  if (!store) {
    store = createGameStore();
    storeByChildId.set(key, store);
  }
  return store;
}

// Track the most recently active child so static (`.getState()`,
// `.subscribe()`, `.setState()`) access points can resolve to the
// current store without every caller needing to pass the childId.
// Updated in the hook body on each render.
let currentChildKey: string = ORPHAN_KEY;

/**
 * Drop the per-child store for a given child id. Useful when a child
 * profile is deleted so we don't leak state across profile recreations.
 * If called with null/undefined, clears the orphan store.
 */
export function dropGameStoreForChild(childId: string | null | undefined): void {
  storeByChildId.delete(resolveKey(childId));
}

/**
 * Clear every per-child store. Used in tests and on hard auth reset.
 */
export function clearAllGameStores(): void {
  storeByChildId.clear();
  currentChildKey = ORPHAN_KEY;
}

// ─── Public hook (API-compatible with previous useGameStore) ────────
interface UseGameStoreCallable {
  (): GameState;
  <T>(selector: (state: GameState) => T): T;
  getState(): GameState;
  setState: StoreApi<GameState>['setState'];
  subscribe: StoreApi<GameState>['subscribe'];
}

const identitySelector = (s: GameState) => s;

function useGameStoreImpl<T>(selector?: (s: GameState) => T): T | GameState {
  const childId = useChildStore((s) => s.activeChildId);
  const key = resolveKey(childId);
  // Cache the resolved key for imperative access. Safe to write on every
  // render; reads happen outside React render cycles.
  currentChildKey = key;
  const store = getOrCreate(childId);
  // useStore is a stable hook that subscribes the component to `store`.
  // When no selector is provided, use identitySelector to return full state.
  const effectiveSelector = (selector ?? identitySelector) as (s: GameState) => T;
  return useStore(store, effectiveSelector);
}

function staticStore(): StoreApi<GameState> {
  // Use the most recently resolved child key. If the app boots and calls
  // getState() before any child is active, this returns the orphan store.
  return getOrCreate(currentChildKey === ORPHAN_KEY ? null : currentChildKey);
}

export const useGameStore: UseGameStoreCallable = Object.assign(
  // Wrapping in a plain function keeps the generic overload working.
  (<T>(selector?: (s: GameState) => T) => useGameStoreImpl(selector)) as UseGameStoreCallable,
  {
    getState: () => staticStore().getState(),
    setState: ((...args: Parameters<StoreApi<GameState>['setState']>) =>
      staticStore().setState(...args)) as StoreApi<GameState>['setState'],
    subscribe: ((listener: Parameters<StoreApi<GameState>['subscribe']>[0]) =>
      staticStore().subscribe(listener)) as StoreApi<GameState>['subscribe'],
  },
);

export type { GamePhase, GameState };

// PERF-HIGH-001 (C): Stable-action selector. Actions never change
// identity in Zustand, so subscribing to them via useShallow means
// components only re-render when the bundle's composition changes
// (never, in practice). Games should prefer this over
// `const game = useGameStore()` which re-runs the subscriber on
// every state field change.
/** Narrow selector for the current score only. */
export function useGameScore(): number {
  return useGameStoreImpl((s: GameState) => s.score) as number;
}

/** Narrow selector for the current game phase only. */
export function useGamePhase(): GamePhase {
  return useGameStoreImpl((s: GameState) => s.phase) as GamePhase;
}

export function useGameActions() {
  return useGameStoreImpl(
    useShallow((s: GameState) => ({
      startGame: s.startGame,
      setPhase: s.setPhase,
      updateScore: s.updateScore,
      setMaxScore: s.setMaxScore,
      awardXP: s.awardXP,
      advanceRound: s.advanceRound,
      useHint: s.useHint,
      pauseGame: s.pauseGame,
      resumeGame: s.resumeGame,
      togglePause: s.togglePause,
      completeGame: s.completeGame,
      resetGame: s.resetGame,
      setGameData: s.setGameData,
      tick: s.tick,
    })),
  ) as Pick<
    GameState,
    | 'startGame'
    | 'setPhase'
    | 'updateScore'
    | 'setMaxScore'
    | 'awardXP'
    | 'advanceRound'
    | 'useHint'
    | 'pauseGame'
    | 'resumeGame'
    | 'togglePause'
    | 'completeGame'
    | 'resetGame'
    | 'setGameData'
    | 'tick'
  >;
}

/**
 * T20 PERF-HIGH-001 (A): Drop-in replacement for
 * `const game = useGameStore()` inside game components.
 *
 * Bundles the small set of fields games actually read / call via
 * `useShallow`, so components stop re-rendering when unrelated
 * state changes (most importantly `timeElapsed`, which ticks every
 * second and previously caused a 1-Hz render storm in every
 * mounted game).
 *
 * Subscribes to: score (read), plus the 5 action methods every game
 * uses (startGame, updateScore, setMaxScore, advanceRound,
 * completeGame). Does NOT subscribe to timeElapsed, gameData,
 * isPaused, saveState, hintsRemaining, currentRound, totalRounds —
 * games that need those must add a narrow selector explicitly.
 */
export function useGame() {
  return useGameStoreImpl(
    useShallow((s: GameState) => ({
      score: s.score,
      startGame: s.startGame,
      updateScore: s.updateScore,
      setMaxScore: s.setMaxScore,
      advanceRound: s.advanceRound,
      completeGame: s.completeGame,
    })),
  ) as Pick<
    GameState,
    | 'score'
    | 'startGame'
    | 'updateScore'
    | 'setMaxScore'
    | 'advanceRound'
    | 'completeGame'
  >;
}
