// ════════════════════════════════════════════════════════════════════════
// ADAPTIVE ENGINE — Phase 10.1: Adaptive Difficulty System
// ════════════════════════════════════════════════════════════════════════
// Per-child dynamic difficulty adjustment. A transparent controller tracks a
// rolling performance signal (accuracy, speed, hint usage, retries) via
// exponential moving averages, then recommends a difficulty level with
// single-step hysteresis so it never lurches. Also produces a learning-curve
// series for the parent dashboard.
// ════════════════════════════════════════════════════════════════════════

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];

/** Raw per-game performance sample (all rates/accuracy in 0..1). */
export interface PerformanceSample {
  /** Correct answer ratio, 0..1. */
  accuracy: number;
  /** Speed score, 0..1 (1 = comfortably faster than the time target). */
  speedScore: number;
  /** Hint usage rate, 0..1 (0 = no hints used). */
  hintRate: number;
  /** Retry rate, 0..1 (0 = no retries). */
  retryRate: number;
}

/** Persisted per-child, per-lab adaptive state. */
export interface AdaptiveState {
  level: DifficultyLevel;
  /** EWMA of the composite performance score, 0..1. */
  performance: number;
  /** Number of samples folded in so far. */
  samples: number;
  /** Recent learning-curve points (most recent last), capped. */
  history: LearningPoint[];
}

export interface LearningPoint {
  at: string; // ISO date
  level: DifficultyLevel;
  performance: number; // 0..1
  accuracy: number; // 0..1
}

export const EWMA_ALPHA = 0.3;
export const HISTORY_CAP = 30;

/** Promote when sustained performance is high; demote when it's low. */
const PROMOTE_THRESHOLD = 0.8;
const DEMOTE_THRESHOLD = 0.45;
/** Require a few samples before the controller starts moving difficulty. */
const MIN_SAMPLES_TO_ADAPT = 3;

const WEIGHTS = { accuracy: 0.5, speed: 0.2, hints: 0.15, retries: 0.15 };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Composite performance score (0..1) for a single sample. */
export function scoreSample(s: PerformanceSample): number {
  return clamp01(
    WEIGHTS.accuracy * clamp01(s.accuracy) +
      WEIGHTS.speed * clamp01(s.speedScore) +
      WEIGHTS.hints * (1 - clamp01(s.hintRate)) +
      WEIGHTS.retries * (1 - clamp01(s.retryRate)),
  );
}

export function levelIndex(level: DifficultyLevel): number {
  return DIFFICULTY_ORDER.indexOf(level);
}

export function stepLevel(level: DifficultyLevel, delta: number): DifficultyLevel {
  const i = Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, levelIndex(level) + delta));
  return DIFFICULTY_ORDER[i];
}

export function defaultState(): AdaptiveState {
  return { level: 'easy', performance: 0.5, samples: 0, history: [] };
}

/**
 * Fold a new sample into the adaptive state: update the performance EWMA,
 * apply single-step hysteresis to the difficulty, and append a curve point.
 */
export function applySample(state: AdaptiveState, sample: PerformanceSample, at: Date = new Date()): AdaptiveState {
  const score = scoreSample(sample);
  const samples = state.samples + 1;
  const performance =
    state.samples === 0 ? score : EWMA_ALPHA * score + (1 - EWMA_ALPHA) * state.performance;

  let level = state.level;
  if (samples >= MIN_SAMPLES_TO_ADAPT) {
    if (performance >= PROMOTE_THRESHOLD) level = stepLevel(level, +1);
    else if (performance <= DEMOTE_THRESHOLD) level = stepLevel(level, -1);
  }

  const point: LearningPoint = {
    at: at.toISOString(),
    level,
    performance: Math.round(performance * 100) / 100,
    accuracy: Math.round(clamp01(sample.accuracy) * 100) / 100,
  };
  const history = [...state.history, point].slice(-HISTORY_CAP);

  return { level, performance, samples, history };
}

/** Recommended starting level from a one-off performance score. */
export function recommendLevel(performance: number): DifficultyLevel {
  if (performance >= 0.85) return 'expert';
  if (performance >= 0.65) return 'hard';
  if (performance >= 0.4) return 'medium';
  return 'easy';
}

/** Direction of the recent trend over the curve (for the parent dashboard). */
export function curveTrend(history: LearningPoint[]): 'up' | 'down' | 'flat' {
  if (history.length < 2) return 'flat';
  const first = history[0].performance;
  const last = history[history.length - 1].performance;
  if (last - first > 0.05) return 'up';
  if (first - last > 0.05) return 'down';
  return 'flat';
}

export function describeLevel(level: DifficultyLevel): string {
  switch (level) {
    case 'easy': return 'Guided — extra hints and time';
    case 'medium': return 'Standard challenge';
    case 'hard': return 'Tougher — fewer hints';
    case 'expert': return 'Expert — maximum challenge';
  }
}
