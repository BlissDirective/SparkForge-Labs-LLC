// src/stores/pocketBrainStore.ts
// ════════════════════════════════════════════════════════════════
// POCKET BRAIN STORE — Stage 11A (C5, Lab 1)
// ════════════════════════════════════════════════════════════════
// Per-session state for the Pocket Brain game. Wraps webllmService
// with reactive state and manages the 13-phase machine.
//
// Persisted slice: tutorialSeen + lastModelChoice + lastQuantization
// + raceBest (kid's personal best score).
// Transient slice: phase + load progress + streaming state + race
// session state + per-prompt run history.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from '@/stores/toastStore';
import { webllmService, selectActiveExperts } from '@/lib/pocketbrain/webllmService';
import type { LoadProgress } from '@/lib/pocketbrain/webllmService';
import type { ModelChoice, Quantization, DeviceCapability } from '@/lib/pocketbrain/capability';
import { probeCapability } from '@/lib/pocketbrain/capability';
import { isTriviaAnswerCorrect, RACE_TRIVIA, triviaForBand } from '@/lib/pocketbrain/promptLibrary';
import type { RaceTrivia } from '@/lib/pocketbrain/promptLibrary';

// ─── Phase machine ───────────────────────────────────────────────

export type PocketBrainPhase =
  | 'welcome'
  | 'learn-model'
  | 'learn-tokens'
  | 'learn-where'
  | 'download'
  | 'first-run'
  | 'token-stream-view'
  | 'quantization-lab'
  | 'moe-switchboard'
  | 'speed-race'
  | 'compare-cloud'
  | 'pocket-mode'
  | 'report';

// ─── Persisted shape ─────────────────────────────────────────────

interface PocketBrainPersisted {
  tutorialSeen: { model: boolean; tokens: boolean; where: boolean };
  lastModelChoice: ModelChoice | null;
  lastQuantization: Quantization;
  /** Personal best in race-mode (correct answers in 5 minutes). */
  raceBest: number;
}

// ─── Per-prompt run record ───────────────────────────────────────

export interface PromptRunRecord {
  promptId: string;
  quantization: Quantization;
  output: string;
  tokensPerSec: number;
  durationMs: number;
  activeExperts: number[];
  /** Run timestamp ms. */
  runAtMs: number;
}

// ─── Race session ────────────────────────────────────────────────

export interface RaceSession {
  startedAtMs: number;
  durationMs: number;            // total race time budget (e.g. 5 min)
  /** Trivia ids served so far. */
  servedQuestionIds: string[];
  /** Answers attempted so far (parallel to servedQuestionIds). */
  answers: { questionId: string; output: string; correct: boolean; tokensPerSec: number }[];
  /** Current question (if any). */
  currentQuestionId: string | null;
}

// ─── Transient shape ─────────────────────────────────────────────

interface PocketBrainTransient {
  phase: PocketBrainPhase;

  // Capability + model state
  capability: DeviceCapability | null;
  modelStatus: 'idle' | 'probing' | 'downloading' | 'loading' | 'ready' | 'error';
  modelChoice: ModelChoice | null;
  quantization: Quantization;
  loadProgress: LoadProgress | null;
  loadError: string | null;

  // Inference state
  currentPrompt: string;
  isStreaming: boolean;
  streamingText: string;
  tokensPerSec: number;
  activeExperts: number[];
  /** AbortController for the active stream (so user can cancel). */
  abortController: AbortController | null;

  // Run history (for the report card)
  runHistory: PromptRunRecord[];

  // Race mode
  race: RaceSession | null;
  raceTickMs: number;            // most recent UI re-render trigger

  // Cloud-compare phase
  cloudCompareOutput: string;
  isCloudComparing: boolean;
}

type PocketBrainState = PocketBrainPersisted & PocketBrainTransient & {
  setPhase: (p: PocketBrainPhase) => void;
  beginGame: () => void;
  reset: () => void;

  markTutorialSeen: (k: 'model' | 'tokens' | 'where') => void;
  setQuantization: (q: Quantization) => void;

  // Capability / loading
  probe: () => Promise<DeviceCapability>;
  loadModel: () => Promise<void>;
  unloadModel: () => Promise<void>;

  // Single-shot inference
  setCurrentPrompt: (p: string) => void;
  runPrompt: (promptId: string) => Promise<void>;
  cancelStream: () => void;

  // Race mode
  startRace: (band: 'A' | 'B' | 'C', durationMs?: number) => void;
  raceNextQuestion: () => RaceTrivia | null;
  submitRaceAnswer: (questionId: string, output: string, tokensPerSec: number) => void;
  endRace: () => void;
  raceTick: () => void;            // call from useEffect interval

  // Cloud compare
  runCloudCompare: (prompt: string) => Promise<void>;
};

const TRANSIENT_INITIAL: PocketBrainTransient = {
  phase: 'welcome',
  capability: null,
  modelStatus: 'idle',
  modelChoice: null,
  quantization: 'Q4',
  loadProgress: null,
  loadError: null,
  currentPrompt: '',
  isStreaming: false,
  streamingText: '',
  tokensPerSec: 0,
  activeExperts: [],
  abortController: null,
  runHistory: [],
  race: null,
  raceTickMs: 0,
  cloudCompareOutput: '',
  isCloudComparing: false,
};

const DEFAULT_RACE_DURATION_MS = 5 * 60 * 1000;

// ─── Store ───────────────────────────────────────────────────────

export const usePocketBrainStore = create<PocketBrainState>()(
  persist(
    (set, get) => ({
      tutorialSeen: { model: false, tokens: false, where: false },
      lastModelChoice: null,
      lastQuantization: 'Q4',
      raceBest: 0,
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen, lastQuantization } = get();
        const next: PocketBrainPhase =
          !tutorialSeen.model ? 'learn-model'
          : !tutorialSeen.tokens ? 'learn-tokens'
          : !tutorialSeen.where ? 'learn-where'
          : 'download';
        set({ phase: next, quantization: lastQuantization });
      },

      reset: () => {
        // Cancel any in-flight stream before resetting transient state.
        const { abortController } = get();
        try { abortController?.abort(); } catch { /* best-effort */ }
        set({ ...TRANSIENT_INITIAL });
      },

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      setQuantization: (q) => set({ quantization: q, lastQuantization: q }),

      // ── Capability + load ──────────────────────────────────
      probe: async () => {
        set({ modelStatus: 'probing' });
        const cap = await probeCapability();
        set({
          capability: cap,
          modelChoice: cap.modelChoice,
          modelStatus: cap.modelChoice === 'mp4-poster' ? 'error' : 'idle',
          loadError: cap.modelChoice === 'mp4-poster'
            ? 'Your browser doesn\'t support WebGPU — switching to the video fallback.'
            : null,
        });
        return cap;
      },

      loadModel: async () => {
        const { modelChoice, quantization } = get();
        if (!modelChoice || modelChoice === 'mp4-poster') {
          set({ modelStatus: 'error', loadError: 'No live model available on this device.' });
          return;
        }
        set({ modelStatus: 'downloading', loadProgress: null, loadError: null });
        try {
          await webllmService.load(modelChoice, quantization, (progress) => {
            // Snapshot progress into the store on each tick so the
            // download bar UI stays live.
            const phaseLabel = progress.text.toLowerCase();
            const status: PocketBrainTransient['modelStatus'] =
              phaseLabel.includes('fetch') || phaseLabel.includes('download')
                ? 'downloading'
                : 'loading';
            set({ loadProgress: progress, modelStatus: status });
          });
          set({
            modelStatus: 'ready',
            loadProgress: { progress: 1, text: 'Model ready.', elapsedMs: 0 },
            lastModelChoice: modelChoice,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          set({ modelStatus: 'error', loadError: msg });
          useToastStore.getState().addToast('error', `Couldn't load model: ${msg}`);
        }
      },

      unloadModel: async () => {
        try {
          await webllmService.dispose();
        } catch { /* best-effort */ }
        set({ modelStatus: 'idle', loadProgress: null });
      },

      // ── Single-shot inference ──────────────────────────────
      setCurrentPrompt: (p) => set({ currentPrompt: p }),

      runPrompt: async (promptId) => {
        const { quantization, currentPrompt } = get();
        const text = currentPrompt.trim();
        if (text.length === 0) return;
        if (!webllmService.isLoaded()) {
          useToastStore.getState().addToast('error', 'Model not loaded yet — try the download phase first.');
          return;
        }

        const ac = new AbortController();
        const startedAt = Date.now();
        set({
          isStreaming: true,
          streamingText: '',
          tokensPerSec: 0,
          activeExperts: selectActiveExperts(text),
          abortController: ac,
        });

        try {
          let lastTokensPerSec = 0;
          for await (const chunk of webllmService.stream({ prompt: text, signal: ac.signal })) {
            lastTokensPerSec = chunk.tokensPerSec;
            set({
              streamingText: chunk.text,
              tokensPerSec: chunk.tokensPerSec,
              activeExperts: chunk.activeExperts,
            });
          }
          const durationMs = Date.now() - startedAt;
          const finalText = get().streamingText;
          set((s) => ({
            isStreaming: false,
            abortController: null,
            runHistory: [
              ...s.runHistory,
              {
                promptId,
                quantization,
                output: finalText,
                tokensPerSec: lastTokensPerSec,
                durationMs,
                activeExperts: s.activeExperts,
                runAtMs: Date.now(),
              },
            ],
          }));
        } catch (e) {
          set({ isStreaming: false, abortController: null });
          const msg = e instanceof Error ? e.message : String(e);
          if (msg !== 'AbortError') {
            useToastStore.getState().addToast('error', `Run failed: ${msg}`);
          }
        }
      },

      cancelStream: () => {
        const { abortController } = get();
        try { abortController?.abort(); } catch { /* best-effort */ }
        set({ isStreaming: false, abortController: null });
      },

      // ── Race mode ──────────────────────────────────────────
      startRace: (band, durationMs = DEFAULT_RACE_DURATION_MS) => {
        const triviaIds = triviaForBand(band).map((t) => t.id);
        if (triviaIds.length === 0) return;
        // Shuffle stable per-session.
        const shuffled = [...triviaIds].sort(() => Math.random() - 0.5);
        set({
          race: {
            startedAtMs: Date.now(),
            durationMs,
            servedQuestionIds: [shuffled[0]],
            answers: [],
            currentQuestionId: shuffled[0],
          },
          raceTickMs: Date.now(),
        });
      },

      raceNextQuestion: () => {
        const { race } = get();
        if (!race) return null;
        const remainingIds = RACE_TRIVIA
          .map((t) => t.id)
          .filter((id) => !race.servedQuestionIds.includes(id));
        if (remainingIds.length === 0) {
          // Cycle the deck so a kid who's fast doesn't run out.
          set({ race: { ...race, servedQuestionIds: race.servedQuestionIds.slice(-1) } });
          return RACE_TRIVIA.find((t) => t.id !== race.currentQuestionId) ?? RACE_TRIVIA[0];
        }
        const next = remainingIds[0];
        const trivia = RACE_TRIVIA.find((t) => t.id === next);
        if (!trivia) return null;
        set({
          race: {
            ...race,
            servedQuestionIds: [...race.servedQuestionIds, next],
            currentQuestionId: next,
          },
        });
        return trivia;
      },

      submitRaceAnswer: (questionId, output, tokensPerSec) => {
        const { race } = get();
        if (!race) return;
        const trivia = RACE_TRIVIA.find((t) => t.id === questionId);
        if (!trivia) return;
        const correct = isTriviaAnswerCorrect(trivia, output);
        set({
          race: {
            ...race,
            answers: [...race.answers, { questionId, output, correct, tokensPerSec }],
          },
        });
      },

      endRace: () => {
        const { race, raceBest } = get();
        if (!race) return;
        const correctCount = race.answers.filter((a) => a.correct).length;
        if (correctCount > raceBest) {
          set({ raceBest: correctCount });
        }
        set({ race: null });
      },

      raceTick: () => set({ raceTickMs: Date.now() }),

      // ── Cloud compare ─────────────────────────────────────
      runCloudCompare: async (prompt) => {
        const text = prompt.trim();
        if (text.length === 0) return;
        set({ isCloudComparing: true, cloudCompareOutput: '' });
        try {
          // Re-uses the existing /api/ai/prompt-lab path. Keeps the
          // single Anthropic API surface area, and inherits its
          // kid-safety filters.
          const res = await fetch('/api/ai/prompt-lab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text }),
          });
          if (!res.ok) {
            throw new Error(`Cloud comparison failed (${res.status})`);
          }
          const data = (await res.json()) as { text?: string; reply?: string };
          set({ cloudCompareOutput: data.text ?? data.reply ?? '(no response)' });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          useToastStore.getState().addToast('error', `Cloud compare failed: ${msg}`);
          set({ cloudCompareOutput: '(comparison unavailable)' });
        } finally {
          set({ isCloudComparing: false });
        }
      },
    }),
    {
      name: 'sparkforge-pocket-brain',
      partialize: (s): PocketBrainPersisted => ({
        tutorialSeen: s.tutorialSeen,
        lastModelChoice: s.lastModelChoice,
        lastQuantization: s.lastQuantization,
        raceBest: s.raceBest,
      }),
    },
  ),
);
