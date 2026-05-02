// src/stores/pixelWitnessStore.ts
// ════════════════════════════════════════════════════════════════
// PIXEL WITNESS STORE — Stage 11C (C4, Lab 7)
// ════════════════════════════════════════════════════════════════
// Per-session state for the video-VLM judging game. No Supabase
// persistence per Doc 2 §G.10 — all session-only.
//
// Persisted slice: tutorialSeen + lastSenseConfig + bestAccuracy.
// Transient slice: phase + active clip + active question +
// player ratings + sense config.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ClipQuestion,
  PixelClip,
  PixelMode,
  PlayerRating,
  SenseConfig,
} from '@/types/pixelWitness';
import {
  CLIP_LIBRARY,
  questionsForClip,
  clipsForBand,
} from '@/lib/pixelwitness/clipLibrary';
import {
  blindAnswerFor,
  computeGrade,
  evaluateRating,
  senseSatisfies,
} from '@/lib/pixelwitness/judgeEngine';

// ─── Phase machine ───────────────────────────────────────────────

export type PixelWitnessPhase =
  | 'welcome'
  | 'learn-modal'
  | 'learn-fusion'
  | 'learn-hallucinate'
  | 'tutorial'
  | 'watch-A'
  | 'watch-B'
  | 'watch-C'
  | 'hallucination-hunt'
  | 'sense-builder'
  | 'creative-sandbox'
  | 'report';

interface PixelWitnessPersisted {
  tutorialSeen: { modal: boolean; fusion: boolean; hallucinate: boolean; tutorial: boolean };
  lastSenseConfig: SenseConfig;
  bestAccuracy: number;
}

interface PixelWitnessTransient {
  phase: PixelWitnessPhase;
  /** Mode driver - which sub-phase the player is in. */
  mode: PixelMode;
  /** Eligible clips for the current mode + band (computed at startMode). */
  modeClips: PixelClip[];
  /** Index into modeClips. */
  clipIndex: number;
  /** Cached current clip. */
  currentClip: PixelClip | null;
  /** Questions for the current clip (4 per clip). */
  currentQuestions: ClipQuestion[];
  /** Index into currentQuestions. */
  questionIndex: number;
  /** Cached current question. */
  currentQuestion: ClipQuestion | null;
  /** Player ratings across the whole session. */
  ratings: PlayerRating[];
  /** Active senses (Sense Builder phase). */
  senseConfig: SenseConfig;
  /** Has the player marked the AI's answer for the current question? */
  hasRatedCurrent: boolean;
  /** Last error / status message. */
  lastError: string | null;
}

type PixelWitnessState = PixelWitnessPersisted & PixelWitnessTransient & {
  setPhase: (p: PixelWitnessPhase) => void;
  beginGame: () => void;
  reset: () => void;
  markTutorialSeen: (k: keyof PixelWitnessPersisted['tutorialSeen']) => void;

  /** Start a mode (sets phase + loads clips). */
  startMode: (mode: PixelMode, band: 'A' | 'B' | 'C') => void;
  nextClip: () => void;
  nextQuestion: () => void;

  /** Active senses control (Sense Builder phase). */
  toggleSense: (sense: keyof SenseConfig) => void;
  setSenseConfig: (config: SenseConfig) => void;

  /** Get the AI answer to render for the current question, considering
   *  the active senses. Returns the recorded answer when senses satisfy
   *  the minimum, otherwise the blind fallback. */
  getDisplayedAnswer: () => string;

  /** Record the player's call. */
  rateAnswer: (rating: PlayerRating['rating'], note?: string) => void;

  /** Compute the session grade on demand. */
  getGrade: () => ReturnType<typeof computeGrade>;
};

const DEFAULT_SENSE_CONFIG: SenseConfig = {
  caption: true,
  oneFrame: false,
  allFrames: false,
  audio: false,
};

const TRANSIENT_INITIAL: PixelWitnessTransient = {
  phase: 'welcome',
  mode: 'watch-A',
  modeClips: [],
  clipIndex: 0,
  currentClip: null,
  currentQuestions: [],
  questionIndex: 0,
  currentQuestion: null,
  ratings: [],
  senseConfig: DEFAULT_SENSE_CONFIG,
  hasRatedCurrent: false,
  lastError: null,
};

// Per-mode clip-pool size + difficulty filter. Per Doc 2 §G.4:
//   watch-A: 6 simple clips
//   watch-B: 9 medium clips
//   watch-C: 9 hard / adversarial clips
//   hallucination-hunt: boss round - sample from all difficulties,
//                        focus on adversarial questions
const MODE_CONFIG: Record<PixelMode, { size: number; bandFilter: ('A' | 'B' | 'C')[] }> = {
  'watch-A':              { size: 6, bandFilter: ['A'] },
  'watch-B':              { size: 9, bandFilter: ['B'] },
  'watch-C':              { size: 9, bandFilter: ['C'] },
  'hallucination-hunt':   { size: 6, bandFilter: ['A', 'B', 'C'] },
  'sense-builder':        { size: 4, bandFilter: ['A', 'B', 'C'] },
  'creative-sandbox':     { size: 0, bandFilter: ['A', 'B', 'C'] },
};

// ─── Store ───────────────────────────────────────────────────────

export const usePixelWitnessStore = create<PixelWitnessState>()(
  persist(
    (set, get) => ({
      tutorialSeen: { modal: false, fusion: false, hallucinate: false, tutorial: false },
      lastSenseConfig: DEFAULT_SENSE_CONFIG,
      bestAccuracy: 0,
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen, lastSenseConfig } = get();
        const next: PixelWitnessPhase =
          !tutorialSeen.modal ? 'learn-modal'
          : !tutorialSeen.fusion ? 'learn-fusion'
          : !tutorialSeen.hallucinate ? 'learn-hallucinate'
          : !tutorialSeen.tutorial ? 'tutorial'
          : 'watch-A';
        set({ phase: next, senseConfig: lastSenseConfig });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      // ── Mode loading ──────────────────────────────────────
      startMode: (mode, band) => {
        const cfg = MODE_CONFIG[mode];

        // Pick clips: filter by mode's bandFilter + ensure clip ageBand
        // intersects with player's band.
        const candidates = CLIP_LIBRARY.filter((c) => {
          // Player must qualify for the clip:
          if (!c.band.includes(band)) return false;
          // Mode's bandFilter restricts which clips by their primary
          // difficulty (clip's band intersects mode's filter).
          return cfg.bandFilter.some((b) => c.band.includes(b));
        });

        // Fisher-Yates shuffle (unbiased, unlike compare-by-random).
        const shuffled = [...candidates];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const modeClips = shuffled.slice(0, cfg.size);

        // Hallucination Hunt: boss mode focuses purely on adversarial
        // questions across the picked clips.
        const firstClip = modeClips[0] ?? null;
        let questions: ClipQuestion[] = [];
        if (firstClip) {
          questions = questionsForClip(firstClip.id);
          // For hallucination-hunt mode, restrict to adversarial questions.
          if (mode === 'hallucination-hunt') {
            questions = questions.filter((q) => q.kind === 'adversarial');
          }
        }
        const firstQuestion = questions[0] ?? null;

        const phase: PixelWitnessPhase =
          mode === 'sense-builder' ? 'sense-builder'
          : mode === 'creative-sandbox' ? 'creative-sandbox'
          : mode === 'hallucination-hunt' ? 'hallucination-hunt'
          : mode === 'watch-B' ? 'watch-B'
          : mode === 'watch-C' ? 'watch-C'
          : 'watch-A';

        set({
          mode,
          modeClips,
          clipIndex: 0,
          currentClip: firstClip,
          currentQuestions: questions,
          questionIndex: 0,
          currentQuestion: firstQuestion,
          hasRatedCurrent: false,
          phase,
          lastError: null,
        });
      },

      nextClip: () => {
        const { modeClips, clipIndex, mode } = get();
        const nextIdx = clipIndex + 1;
        if (nextIdx >= modeClips.length) {
          // Out of clips - go to report.
          set({ phase: 'report' });
          return;
        }
        const nextClip = modeClips[nextIdx];
        let questions = questionsForClip(nextClip.id);
        if (mode === 'hallucination-hunt') {
          questions = questions.filter((q) => q.kind === 'adversarial');
        }
        const firstQ = questions[0] ?? null;
        set({
          clipIndex: nextIdx,
          currentClip: nextClip,
          currentQuestions: questions,
          questionIndex: 0,
          currentQuestion: firstQ,
          hasRatedCurrent: false,
        });
      },

      nextQuestion: () => {
        const { currentQuestions, questionIndex } = get();
        const nextIdx = questionIndex + 1;
        if (nextIdx >= currentQuestions.length) {
          // Out of questions for this clip - advance to next clip.
          get().nextClip();
          return;
        }
        set({
          questionIndex: nextIdx,
          currentQuestion: currentQuestions[nextIdx],
          hasRatedCurrent: false,
        });
      },

      // ── Sense control ─────────────────────────────────────
      toggleSense: (sense) => {
        set((s) => {
          const newConfig = { ...s.senseConfig, [sense]: !s.senseConfig[sense] };
          return { senseConfig: newConfig, lastSenseConfig: newConfig };
        });
      },

      setSenseConfig: (config) => set({ senseConfig: config, lastSenseConfig: config }),

      // ── Displayed answer (sense-aware) ────────────────────
      getDisplayedAnswer: () => {
        const { currentQuestion, senseConfig, mode } = get();
        if (!currentQuestion) return '';
        // For Sense Builder mode: blind-fallback when active senses
        // don't satisfy the question's minimum.
        if (mode === 'sense-builder') {
          if (!senseSatisfies(senseConfig, currentQuestion.minimumSense)) {
            return blindAnswerFor(currentQuestion);
          }
        }
        return currentQuestion.aiAnswer;
      },

      // ── Rating ────────────────────────────────────────────
      rateAnswer: (rating, note) => {
        const { currentQuestion, ratings, bestAccuracy } = get();
        if (!currentQuestion) return;
        const matched = evaluateRating(rating, currentQuestion);
        const newRating: PlayerRating = {
          questionId: currentQuestion.id,
          rating,
          matched,
          note: note?.slice(0, 100),
        };
        const updated = [...ratings, newRating];
        // Recompute best accuracy.
        const matchCount = updated.filter((r) => r.matched).length;
        const acc = updated.length > 0 ? matchCount / updated.length : 0;
        set({
          ratings: updated,
          hasRatedCurrent: true,
          bestAccuracy: Math.max(bestAccuracy, acc),
        });
      },

      getGrade: () => {
        const { ratings, modeClips } = get();
        // Collect all questions from all clips in the current mode.
        const allQuestions: ClipQuestion[] = [];
        for (const c of modeClips) {
          allQuestions.push(...questionsForClip(c.id));
        }
        return computeGrade(ratings, allQuestions);
      },
    }),
    {
      name: 'sparkforge-pixel-witness',
      partialize: (s): PixelWitnessPersisted => ({
        tutorialSeen: s.tutorialSeen,
        lastSenseConfig: s.lastSenseConfig,
        bestAccuracy: s.bestAccuracy,
      }),
    },
  ),
);

// ─── Helper: clip pool size for the current player band ──────────

export function expectedClipCountForMode(mode: PixelMode, band: 'A' | 'B' | 'C'): number {
  const cfg = MODE_CONFIG[mode];
  const candidates = clipsForBand(band).filter((c) => cfg.bandFilter.some((b) => c.band.includes(b)));
  return Math.min(cfg.size, candidates.length);
}
