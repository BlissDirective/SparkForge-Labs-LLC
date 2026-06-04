// ════════════════════════════════════════════════════════════════
// GAME INTERFACE CONTRACT — SparkForge UI/UX Redesign
// ════════════════════════════════════════════════════════════════
// This file defines the standard interface that ALL games must
// implement. It decouples games from the old 3D GameShell and
// enables the new HtmlGameShell wrapper.

/** Result data when a game completes */
export interface GameResult {
  /** Unique game identifier */
  gameId: string;
  /** Child profile ID that played the game */
  childId: string;
  /** Final score achieved */
  score: number;
  /** Maximum possible score */
  maxScore: number;
  /** XP earned from this session */
  xpEarned: number;
  /** Stars earned (0-3) */
  starsEarned: 0 | 1 | 2 | 3;
  /** Time spent playing in seconds */
  timeSpentSeconds: number;
  /** ISO timestamp of completion */
  completedAt: string;
  /** Answer accuracy percentage (0-100) */
  accuracy?: number;
  /** Longest correct-answer streak */
  streakMax?: number;
}

/** Progress update during active gameplay */
export interface GameProgress {
  gameId: string;
  currentQuestion: number;
  totalQuestions: number;
  currentScore: number;
  elapsedSeconds: number;
}

/** Props passed to every game component */
export interface GameProps {
  /** Unique game identifier */
  gameId: string;
  /** Child profile ID playing the game */
  childId: string;
  /** Called when game completes — passes full result */
  onComplete: (result: GameResult) => void;
  /** Called on significant progress updates */
  onProgress?: (progress: GameProgress) => void;
  /** Difficulty level selected */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Practice mode (no scoring saved) */
  isPractice?: boolean;
  /** Called when user requests to exit */
  onExit?: () => void;
}

/** Extended props for the game shell wrapper */
export interface GameShellProps extends Omit<GameProps, 'difficulty'> {
  /** Game display title */
  title: string;
  /** Game category for theming */
  category: string;
  /** Difficulty indicator (1-3) */
  difficulty: number;
  /** Total questions/rounds */
  totalQuestions?: number;
}

/** Game registry entry for the arcade/browser */
export interface GameRegistryEntry {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  difficulty: 1 | 2 | 3;
  xpReward: number;
  estimatedMinutes: number;
  illustration: string;
  color: string;
  icon: string;
  isNew?: boolean;
  isPremium?: boolean;
}

/** Game category taxonomy */
export type GameCategory =
  | 'ethics'
  | 'creativity'
  | 'coding'
  | 'data'
  | 'agents'
  | 'safety'
  | 'career'
  | 'classification'
  | 'nlp'
  | 'vision'
  | 'audio';

/** Category metadata for display */
export interface CategoryMeta {
  id: GameCategory;
  label: string;
  color: string;
  icon: string;
  description: string;
}
