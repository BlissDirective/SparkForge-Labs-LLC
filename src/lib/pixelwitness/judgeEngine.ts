// src/lib/pixelwitness/judgeEngine.ts
// ════════════════════════════════════════════════════════════════
// Stage 11C — Pixel Witness judging + Sense Builder + grade engine
// ════════════════════════════════════════════════════════════════
// Pure functions. No React, no IO.
// ════════════════════════════════════════════════════════════════

import type {
  ClipQuestion,
  PixelGrade,
  PlayerRating,
  SenseConfig,
  SenseDescriptor,
} from '@/types/pixelWitness';

// ─── Sense level ordering ────────────────────────────────────────

/** Ordered from minimum signal to maximum. Used by senseSatisfies. */
const SENSE_ORDER: ClipQuestion['minimumSense'][] = [
  'caption-only',
  'one-frame',
  'all-frames',
  'audio',
];

// ─── Sense descriptors per Doc 2 §G.6 ────────────────────────────

export const SENSE_META: Record<keyof SenseConfig, SenseDescriptor> = {
  caption: {
    sense: 'caption',
    label: 'Caption only',
    costMultiplier: 1,
    hint: 'AI gets a one-sentence text caption only. Easy to lie.',
    emoji: '📝',
  },
  oneFrame: {
    sense: 'oneFrame',
    label: 'One frame',
    costMultiplier: 5,
    hint: 'AI gets a single still image. Fixes some lies but misses motion.',
    emoji: '🖼️',
  },
  allFrames: {
    sense: 'allFrames',
    label: 'All frames',
    costMultiplier: 30,
    hint: 'AI gets the full video. Hard to lie about visible facts.',
    emoji: '🎞️',
  },
  audio: {
    sense: 'audio',
    label: 'Audio track',
    costMultiplier: 5,
    hint: 'AI gets the sound. Helps with sports, music, dialogue.',
    emoji: '🔊',
  },
};

// ─── Sense satisfaction ──────────────────────────────────────────

/** True if the active SenseConfig provides at least the question's
 *  minimum required modality. Used to decide whether the AI's recorded
 *  answer makes sense to show, vs a "blind" placeholder. */
export function senseSatisfies(
  config: SenseConfig,
  minimum: ClipQuestion['minimumSense'],
): boolean {
  if (minimum === 'caption-only') return true; // any sense set covers caption baseline
  if (minimum === 'one-frame') return config.oneFrame || config.allFrames;
  if (minimum === 'all-frames') return config.allFrames;
  if (minimum === 'audio') return config.audio;
  return false;
}

/** Token budget cost for a given sense config. Sum of multipliers. */
export function senseCost(config: SenseConfig): number {
  let total = 0;
  if (config.caption) total += SENSE_META.caption.costMultiplier;
  if (config.oneFrame) total += SENSE_META.oneFrame.costMultiplier;
  if (config.allFrames) total += SENSE_META.allFrames.costMultiplier;
  if (config.audio) total += SENSE_META.audio.costMultiplier;
  return total;
}

/** Highest sense level enabled, ordered. */
export function highestSense(config: SenseConfig): ClipQuestion['minimumSense'] {
  if (config.audio) return 'audio';
  if (config.allFrames) return 'all-frames';
  if (config.oneFrame) return 'one-frame';
  return 'caption-only';
}

// ─── Blind-AI fallback answer ────────────────────────────────────

/** When the active senses don't satisfy a question's minimum modality,
 *  the AI gives a generic confidently-wrong answer instead. Used by the
 *  Sense Builder to demonstrate "less senses → more lies".
 *
 *  The recorded answer in the clip library is what the AI says when it
 *  HAS sufficient modality. This blind-fallback is what it says
 *  otherwise. */
export function blindAnswerFor(question: ClipQuestion): string {
  switch (question.kind) {
    case 'literal':
      return 'Without seeing the video clearly, I\'ll guess: someone is doing the activity in the video.';
    case 'inferential':
      return 'Probably, yes — that\'s usually why people do that kind of thing.';
    case 'counting':
      return 'There are about 5 of them.';
    case 'adversarial':
      // Adversarial questions are MEANT to elicit confidently-wrong answers,
      // so the blind version commits even harder to a fabricated detail.
      return question.aiAnswer; // same as the recorded hallucination
  }
}

// ─── Player rating evaluation ────────────────────────────────────

/** Determines if the player's rating matches the truth. */
export function evaluateRating(
  rating: PlayerRating['rating'],
  question: ClipQuestion,
): boolean {
  return rating === question.truth;
}

// ─── Grade computation ───────────────────────────────────────────

export function computeGrade(
  ratings: PlayerRating[],
  questions: ClipQuestion[],
): PixelGrade {
  const totalRated = ratings.length;
  if (totalRated === 0) {
    return {
      totalRated: 0,
      matched: 0,
      hallucinationsCaught: 0,
      hallucinationsMissed: 0,
      falseAlarms: 0,
      accuracy: 0,
      stars: 0,
      summary: 'No ratings yet — watch some clips to start judging.',
    };
  }

  let matched = 0;
  let hallucinationsCaught = 0;
  let hallucinationsMissed = 0;
  let falseAlarms = 0;

  const qById = new Map(questions.map((q) => [q.id, q]));

  for (const r of ratings) {
    const q = qById.get(r.questionId);
    if (!q) continue;
    if (r.matched) matched += 1;
    if (q.truth === 'hallucination') {
      if (r.rating === 'hallucination') hallucinationsCaught += 1;
      else hallucinationsMissed += 1;
    } else if (r.rating === 'hallucination') {
      falseAlarms += 1;
    }
  }

  const accuracy = matched / totalRated;
  const stars: 0 | 1 | 2 | 3 =
    accuracy >= 0.85 ? 3
    : accuracy >= 0.65 ? 2
    : accuracy >= 0.4 ? 1
    : 0;

  const summary =
    stars === 3 ? 'Sharp eyes. Almost every call was right - hallucinations caught, real answers trusted.'
    : stars === 2 ? 'Good judgment. A few hallucinations slipped past, or a few real answers got false-flagged.'
    : stars === 1 ? 'Got the easy ones. Watch out for the AI\'s confident lies on adversarial questions.'
    : 'AI is good at sounding right when it isn\'t. Slow down and check.';

  return {
    totalRated,
    matched,
    hallucinationsCaught,
    hallucinationsMissed,
    falseAlarms,
    accuracy,
    stars,
    summary,
  };
}

// ─── Sense level helpers (UI labels) ─────────────────────────────

export function senseLevelLabel(level: ClipQuestion['minimumSense']): string {
  switch (level) {
    case 'caption-only': return 'Caption only';
    case 'one-frame':    return 'One frame';
    case 'all-frames':   return 'All frames';
    case 'audio':        return 'Audio';
  }
}

export function senseOrderIndex(level: ClipQuestion['minimumSense']): number {
  return SENSE_ORDER.indexOf(level);
}
