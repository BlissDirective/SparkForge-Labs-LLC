// src/types/pixelWitness.ts
// ════════════════════════════════════════════════════════════════
// Stage 11C — Pixel Witness (C4, Lab 7 — Computer Vision)
// ════════════════════════════════════════════════════════════════
// Shared types for the video-VLM judging game. Pedagogical core:
// kid watches a clip, sees the AI's answer, decides if it's correct,
// partial, or a hallucination. In the Sense Builder mode the kid
// configures which modalities the AI receives — caption / one-frame
// / all-frames / audio — and watches answers improve as senses grow.
//
// All session-only — no Supabase schema (Doc 2 §G.10).
//
// Asset pipeline note: per Doc 2 §G.5 clips are pre-authored, royalty-
// free assets. Implementation uses documented placeholder URLs
// (/videos/pixel-witness/<clipId>.mp4) with a poster-fallback when
// the file isn't yet provisioned (matches CLAUDE.md HS-8 pattern).
// ════════════════════════════════════════════════════════════════

import type { AgeBand } from '@/config/gameRegistry';

// ─── Clip themes ─────────────────────────────────────────────────

export type ClipTheme =
  | 'everyday'       // cat opening door, kid bubbles, dog catching
  | 'nature'         // sunrise time-lapse, leaf falling, ocean wave
  | 'mechanical'     // clock gears, dominos, balloon inflating
  | 'sports'         // soccer goal, swim dive, gymnastics
  | 'crafts';        // origami, cake decorating, plant repotting

// ─── Clip ────────────────────────────────────────────────────────

export interface PixelClip {
  id: string;
  /** Short title shown on the clip card. */
  title: string;
  theme: ClipTheme;
  /** Duration in seconds (5-15 per spec). */
  durationSec: number;
  /** Source URL. Production: /videos/pixel-witness/<id>.mp4
   *  Dev fallback: poster image at /videos/pixel-witness/<id>.poster.jpg. */
  videoSrc: string;
  /** Poster image to show before play / when video file is unavailable. */
  posterSrc: string;
  /** Decorative emoji. */
  emoji: string;
  /** Age-band gate. */
  band: AgeBand[];
  /** Has audio track relevant to questions? Used by the audio sense toggle. */
  hasAudio: boolean;
}

// ─── Question / answer ───────────────────────────────────────────

export type QuestionKind =
  | 'literal'        // "What is the cat doing?"
  | 'inferential'    // "Why did the kid duck?"
  | 'counting'       // "How many bubbles formed?"
  | 'adversarial';   // designed to elicit a hallucination

export interface ClipQuestion {
  id: string;
  clipId: string;
  kind: QuestionKind;
  /** Kid-readable question text. */
  text: string;
  /** The AI's recorded answer text. For adversarial questions this is
   *  the confidently-wrong response the kid must catch. */
  aiAnswer: string;
  /** Ground truth: 'correct' (literal/inferential/counting answers
   *  the AI got right), 'partial' (right idea, missed details),
   *  'hallucination' (adversarial — the AI confidently lied). */
  truth: 'correct' | 'partial' | 'hallucination';
  /** Brief kid-readable explanation shown after the player rates. */
  explanation: string;
  /** Modality threshold: minimum sense level this Q is meaningfully
   *  answerable at. Used by the Sense Builder loop:
   *    'caption-only'   → answerable from text caption alone
   *    'one-frame'      → needs at least one still frame
   *    'all-frames'     → needs the full video
   *    'audio'          → needs audio track */
  minimumSense: SenseLevel;
}

// ─── Sense (modality) configuration ──────────────────────────────

export type SenseLevel = 'caption-only' | 'one-frame' | 'all-frames' | 'audio';

export interface SenseConfig {
  caption: boolean;
  oneFrame: boolean;
  allFrames: boolean;
  audio: boolean;
}

export interface SenseDescriptor {
  sense: keyof SenseConfig;
  label: string;
  /** Token-cost multiplier per Doc 2 §G.6 (1× / 5× / 30× / 5×). */
  costMultiplier: number;
  /** Kid-readable hint. */
  hint: string;
  emoji: string;
}

// ─── Player rating ───────────────────────────────────────────────

export interface PlayerRating {
  questionId: string;
  /** What the kid called the AI's answer. */
  rating: 'correct' | 'partial' | 'hallucination';
  /** Computed at rate-time: did the kid match the truth? */
  matched: boolean;
  /** Optional ≤ 100-char free-text note. */
  note?: string;
}

// ─── Game modes ──────────────────────────────────────────────────

export type PixelMode =
  | 'watch-A'
  | 'watch-B'
  | 'watch-C'
  | 'hallucination-hunt'
  | 'sense-builder'
  | 'creative-sandbox';

// ─── Grade ───────────────────────────────────────────────────────

export interface PixelGrade {
  totalRated: number;
  matched: number;
  /** Hallucinations the kid CAUGHT (truth='hallucination' AND
   *  rating='hallucination'). */
  hallucinationsCaught: number;
  /** Hallucinations the kid MISSED (truth='hallucination' AND
   *  rating !== 'hallucination'). */
  hallucinationsMissed: number;
  /** False alarms (truth !== 'hallucination' AND
   *  rating === 'hallucination'). */
  falseAlarms: number;
  /** Mean accuracy 0..1. */
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
  summary: string;
}

// ─── Errors ──────────────────────────────────────────────────────

export type PixelError =
  | { kind: 'no-clip-active' }
  | { kind: 'no-question-active' }
  | { kind: 'video-unavailable'; clipId: string };
