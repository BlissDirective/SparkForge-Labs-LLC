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
  /** Age band locked for this race so refills stay age-appropriate. */
  band: 'A' | 'B' | 'C';
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
  cloudAbortController: AbortController | null;
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
  cloudAbortController: null,
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
          let lastActiveExperts: number[] = selectActiveExperts(text);
          let lastText = '';
          for await (const chunk of webllmService.stream({ prompt: text, signal: ac.signal })) {
            lastTokensPerSec = chunk.tokensPerSec;
            lastActiveExperts = chunk.activeExperts;
            lastText = chunk.text;
            set({
              streamingText: chunk.text,
              tokensPerSec: chunk.tokensPerSec,
              activeExperts: chunk.activeExperts,
            });
          }
          const durationMs = Date.now() - startedAt;
          set((s) => ({
            isStreaming: false,
            abortController: null,
            runHistory: [
              ...s.runHistory,
              {
                promptId,
                quantization,
                output: lastText,
                tokensPerSec: lastTokensPerSec,
                durationMs,
                activeExperts: lastActiveExperts,
                runAtMs: Date.now(),
              },
            ],
          }));
        } catch (e) {
          set({ isStreaming: false, abortController: null });
          const isAbort = ac.signal.aborted
            || (e instanceof DOMException && e.name === 'AbortError')
            || (e instanceof Error && e.name === 'AbortError');
          if (!isAbort) {
            const msg = e instanceof Error ? e.message : String(e);
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
        const eligible = triviaForBand(band);
        if (eligible.length === 0) return;
        // Fisher-Yates shuffle for unbiased order.
        const shuffled = [...eligible];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        set({
          race: {
            startedAtMs: Date.now(),
            durationMs,
            band,
            servedQuestionIds: [shuffled[0].id],
            answers: [],
            currentQuestionId: shuffled[0].id,
          },
          raceTickMs: Date.now(),
        });
      },

      raceNextQuestion: () => {
        const { race } = get();
        if (!race) return null;
        const bandPool = triviaForBand(race.band);
        const remaining = bandPool.filter((t) => !race.servedQuestionIds.includes(t.id));
        if (remaining.length === 0) {
          // Recycle band-eligible deck so a fast kid doesn't run out
          // and never falls back to age-inappropriate trivia.
          const recycled = bandPool.find((t) => t.id !== race.currentQuestionId) ?? bandPool[0];
          set({
            race: {
              ...race,
              servedQuestionIds: [recycled.id],
              currentQuestionId: recycled.id,
            },
          });
          return recycled;
        }
        const next = remaining[0];
        set({
          race: {
            ...race,
            servedQuestionIds: [...race.servedQuestionIds, next.id],
            currentQuestionId: next.id,
          },
        });
        return next;
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
        // Abort any prior in-flight compare so a re-fire can't race
        // and overwrite the latest output with a stale response.
        const prior = get().cloudAbortController;
        try { prior?.abort(); } catch { /* best-effort */ }
        const ac = new AbortController();
        set({ isCloudComparing: true, cloudCompareOutput: '', cloudAbortController: ac });
        try {
          // Re-uses the existing /api/ai/prompt-lab path. Keeps the
          // single Anthropic API surface area, and inherits its
          // kid-safety filters.
          const res = await fetch('/api/ai/prompt-lab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text }),
            signal: ac.signal,
          });
          if (!res.ok) {
            throw new Error(`Cloud comparison failed (${res.status})`);
          }
          const data = (await res.json()) as { text?: string; reply?: string };
          set({ cloudCompareOutput: data.text ?? data.reply ?? '(no response)' });
        } catch (e) {
          const isAbort = ac.signal.aborted
            || (e instanceof DOMException && e.name === 'AbortError');
          if (!isAbort) {
            const msg = e instanceof Error ? e.message : String(e);
            useToastStore.getState().addToast('error', `Cloud compare failed: ${msg}`);
            set({ cloudCompareOutput: '(comparison unavailable)' });
          }
        } finally {
          if (get().cloudAbortController === ac) {
            set({ isCloudComparing: false, cloudAbortController: null });
          }
        }
      },
    }),
    {
      name: 'sparkforge-pocket-brain',
      partialize: (s): PocketBrainPersisted => ({
        tutorialSeen: s.tutorialSeen,
        // Don't pin a returning kid to the poster fallback if their
        // device later supports WebGPU — re-probe on next visit.
        lastModelChoice: s.lastModelChoice === 'mp4-poster' ? null : s.lastModelChoice,
        lastQuantization: s.lastQuantization,
        raceBest: s.raceBest,
      }),
    },
  ),
);
