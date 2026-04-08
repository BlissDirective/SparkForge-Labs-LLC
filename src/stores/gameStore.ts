import { create } from 'zustand';

interface GameState {
  currentGame: string | null;
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
    currentGame: gameId, currentRound: 1, totalRounds, score: 0, maxScore: 0,
    isComplete: false, isPaused: false, hintsRemaining: hints, timeElapsed: 0, gameData: {},
  }),
  updateScore: (points) => set((s) => ({ score: s.score + points })),
  setMaxScore: (points) => set({ maxScore: points }),
  advanceRound: () => {
    const s = get();
    const nextRound = s.currentRound + 1;
    if (nextRound > s.totalRounds) { set({ isComplete: true }); }
    else { set({ currentRound: nextRound }); }
  },
  useHint: () => set((s) => ({ hintsRemaining: Math.max(0, s.hintsRemaining - 1) })),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  completeGame: () => set({ isComplete: true }),
  resetGame: () => set({ currentGame: null, currentRound: 1, totalRounds: 0, score: 0, maxScore: 0, isComplete: false, isPaused: false, hintsRemaining: 3, timeElapsed: 0, gameData: {} }),
  setGameData: (key, value) => set((s) => ({ gameData: { ...s.gameData, [key]: value } })),
  tick: () => set((s) => (s.isPaused ? {} : { timeElapsed: s.timeElapsed + 1 })),
}));
