import { create } from 'zustand';

type GamePhase = 'idle' | 'welcome' | 'learn' | 'play' | 'complete';

interface GameState {
  currentGame: string | null;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  score: number;
  maxScore: number;
  isComplete: boolean;
  isPaused: boolean;
  hintsRemaining: number;
  timeElapsed: number;
  gameData: Record<string, unknown>;
  startGame: (gameId: string, totalRounds: number, hints?: number) => void;
  setPhase: (phase: GamePhase) => void;
  updateScore: (points: number) => void;
  setMaxScore: (points: number) => void;
  advanceRound: () => void;
  useHint: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  completeGame: () => void;
  resetGame: () => void;
  setGameData: (key: string, value: unknown) => void;
  tick: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  phase: 'idle',
  currentRound: 0,
  totalRounds: 0,
  score: 0,
  maxScore: 0,
  isComplete: false,
  isPaused: false,
  hintsRemaining: 3,
  timeElapsed: 0,
  gameData: {},
  startGame: (gameId, totalRounds, hints = 3) => set({
    currentGame: gameId, phase: 'play', currentRound: 1, totalRounds, score: 0, maxScore: 0,
    isComplete: false, isPaused: false, hintsRemaining: hints, timeElapsed: 0, gameData: {},
  }),
  setPhase: (phase) => set({ phase }),
  updateScore: (points) => set((s) => ({ score: s.score + points })),
  setMaxScore: (points) => set({ maxScore: points }),
  advanceRound: () => {
    const s = get();
    const nextRound = s.currentRound + 1;
    if (nextRound > s.totalRounds) { set({ isComplete: true, phase: 'complete' }); }
    else { set({ currentRound: nextRound }); }
  },
  useHint: () => set((s) => ({ hintsRemaining: Math.max(0, s.hintsRemaining - 1) })),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  completeGame: () => {
    const s = get();
    // Guard: only complete if a game is active and not already complete
    if (!s.currentGame || s.isComplete) return;
    set({ isComplete: true, phase: 'complete' });
  },
  resetGame: () => set({ currentGame: null, phase: 'idle', currentRound: 1, totalRounds: 0, score: 0, maxScore: 0, isComplete: false, isPaused: false, hintsRemaining: 3, timeElapsed: 0, gameData: {} }),
  setGameData: (key, value) => set((s) => ({ gameData: { ...s.gameData, [key]: value } })),
  tick: () => set((s) => (s.isPaused ? {} : { timeElapsed: s.timeElapsed + 1 })),
}));

export type { GamePhase };
