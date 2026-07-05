// ════════════════════════════════════════════════════════════════════════
// POCKET BRAIN v5 — Lab 1 Flagship · REAL on-device AI (G2.1)
// ════════════════════════════════════════════════════════════════════════
// The registry promise — "run a tiny AI model entirely on your device" — is
// now TRUE. On a WebGPU device this downloads a real Gemma-2-2B model (via
// @mlc-ai/web-llm, cached to IndexedDB after first run) and lets the child
// chat with a genuinely on-device LLM: live token streaming, a real
// tokens/sec readout, no server round-trip.
//
// Flow (WebGPU):  welcome → download (live progress) → chat (curated prompts
//                 + free input, streaming, cancel) → report → completeGame.
// Fallback:       devices without WebGPU (older phones, most Safari) get the
//                 original slider simulator + an honest note — never a dead
//                 end, still earns XP. (Owner-approved, G2.1.)
//
// All inference is client-only; this component is loaded ssr:false by the
// arcade play page, so navigator.gpu / WASM are safe to touch in effects.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain, Cpu, Download, Send, Square, Sparkles, Zap,
  ChevronRight, RotateCcw, Trophy, WifiOff,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';
import { usePocketBrainStore } from '@/stores/pocketBrainStore';
import { MODEL_META } from '@/lib/pocketbrain/capability';
import { promptsForBand, THEME_META, type PocketPrompt } from '@/lib/pocketbrain/promptLibrary';
import GameLevelSystem, { type LevelResult } from '@/components/games/shared/GameLevelSystem';
import SimLevelRenderer from '@/components/games/shared/SimulationLevelRenderer';
import type { SimResult } from '@/components/games/shared/SimulationLevelRenderer';

const LAB_COLOR = '#0FB8FA';
const RUNS_FOR_FULL = 4; // successful chats for a 3-star report

type AgeBand = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// REAL-MODEL EXPERIENCE (WebGPU devices)
// ════════════════════════════════════════════════════════════════════════
function RealModelExperience({ band }: { band: AgeBand }) {
  const { awardXP, completeGame } = useGameActions();
  const phase = usePocketBrainStore((s) => s.phase);
  const modelChoice = usePocketBrainStore((s) => s.modelChoice);
  const modelStatus = usePocketBrainStore((s) => s.modelStatus);
  const loadProgress = usePocketBrainStore((s) => s.loadProgress);
  const loadError = usePocketBrainStore((s) => s.loadError);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const runHistory = usePocketBrainStore((s) => s.runHistory);
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const loadModel = usePocketBrainStore((s) => s.loadModel);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const cancelStream = usePocketBrainStore((s) => s.cancelStream);

  const meta = modelChoice ? MODEL_META[modelChoice] : null;
  const runCount = runHistory.length;
  const completedRef = useRef(false);

  // Kick off the download when we enter the download phase.
  useEffect(() => {
    if (phase === 'download' && modelStatus === 'idle') {
      void loadModel();
    }
  }, [phase, modelStatus, loadModel]);

  // Once the model is ready, advance from download → chat automatically.
  useEffect(() => {
    if (phase === 'download' && modelStatus === 'ready') {
      setPhase('first-run');
    }
  }, [phase, modelStatus, setPhase]);

  // Award XP + completeGame exactly once, when the report is reached.
  useEffect(() => {
    if (phase === 'report' && !completedRef.current) {
      completedRef.current = true;
      const stars = runCount >= RUNS_FOR_FULL ? 3 : runCount >= 2 ? 2 : 1;
      awardXP(80 + Math.min(runCount, 6) * 20);
      completeGame('pocket-brain', stars);
    }
  }, [phase, runCount, awardXP, completeGame]);

  // ── WELCOME ──────────────────────────────────────────────────────────
  if (phase === 'welcome' || phase === 'learn-model' || phase === 'learn-tokens' || phase === 'learn-where') {
    return (
      <div className="max-w-xl mx-auto text-center py-8 px-4">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${LAB_COLOR}1A`, border: `1px solid ${LAB_COLOR}40` }}
        >
          <Brain className="w-10 h-10" style={{ color: LAB_COLOR }} aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
          Run a real AI on your own device
        </h2>
        <p className="font-body text-sm mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Most AI chatbots run on giant computers far away. This one is different — you&apos;ll
          download a small, real AI model called <strong style={{ color: LAB_COLOR }}>{meta?.label ?? 'Gemma'}</strong> and
          it will run <em>entirely on this device</em>. No internet needed once it&apos;s loaded.
        </p>
        <div
          className="rounded-xl p-4 mb-6 text-left"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4" style={{ color: LAB_COLOR }} aria-hidden="true" />
            <span className="font-display text-sm font-bold" style={{ color: '#FFFFFF' }}>
              {meta?.label ?? 'On-device model'}
            </span>
            <span className="font-body text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {meta?.sizeLabel ?? ''} · one-time download
            </span>
          </div>
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {meta?.description ?? ''} The first download is a few hundred MB and is saved on your
            device, so next time it starts instantly.
          </p>
        </div>
        <SFButton variant="primary" size="lg" onClick={() => setPhase('download')}>
          Download the model <Download className="w-4 h-4 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────
  if (phase === 'download') {
    const pct = Math.round((loadProgress?.progress ?? 0) * 100);
    const errored = modelStatus === 'error';
    return (
      <div className="max-w-xl mx-auto text-center py-10 px-4" aria-live="polite">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: `${LAB_COLOR}1A`, border: `1px solid ${LAB_COLOR}40` }}
        >
          <Download className="w-10 h-10" style={{ color: LAB_COLOR }} aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
          {errored ? 'Download hit a snag' : 'Loading your pocket brain…'}
        </h2>
        {!errored && (
          <>
            <p className="font-body text-sm mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {loadProgress?.text ?? 'Getting things ready…'}
            </p>
            <div
              className="w-full h-3 rounded-full overflow-hidden mb-2"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Model download progress"
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${LAB_COLOR}, #7C5CFF)` }}
              />
            </div>
            <p className="font-display text-sm font-bold" style={{ color: LAB_COLOR }}>{pct}%</p>
            <p className="font-body text-xs mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Tip: the model is downloading to your device once. After this it works offline!
            </p>
          </>
        )}
        {errored && (
          <>
            <p className="font-body text-sm mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {loadError ?? 'The model could not be downloaded right now.'}
            </p>
            <SFButton variant="secondary" size="md" onClick={() => void loadModel()}>
              Try again <RotateCcw className="w-4 h-4 ml-2" />
            </SFButton>
          </>
        )}
      </div>
    );
  }

  // ── REPORT ───────────────────────────────────────────────────────────
  if (phase === 'report') {
    const avgTps = runCount > 0
      ? Math.round(runHistory.reduce((s, r) => s + r.tokensPerSec, 0) / runCount)
      : 0;
    return (
      <div className="max-w-xl mx-auto text-center py-10 px-4">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: '#FFD93D1A', border: '1px solid #FFD93D40' }}
        >
          <Trophy className="w-10 h-10" style={{ color: '#FFD93D' }} aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
          You ran a real AI — on your own device!
        </h2>
        <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
          No server, no internet round-trip — every word was generated right here.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-display text-3xl font-extrabold" style={{ color: LAB_COLOR }}>{runCount}</p>
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>prompts answered</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-display text-3xl font-extrabold" style={{ color: LAB_COLOR }}>{avgTps}</p>
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>avg tokens / sec</p>
          </div>
        </div>
        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Your progress has been saved. You can close this — the model stays on your device for next time.
        </p>
      </div>
    );
  }

  // ── CHAT (first-run / token-stream-view) ─────────────────────────────
  return (
    <ChatView
      band={band}
      isStreaming={isStreaming}
      streamingText={streamingText}
      tokensPerSec={tokensPerSec}
      runCount={runCount}
      modelLabel={meta?.label ?? 'Gemma'}
      onRun={(text) => { setCurrentPrompt(text); void runPrompt('free'); }}
      onPickPrompt={(p) => { setCurrentPrompt(p.text); void runPrompt(p.id); }}
      onCancel={cancelStream}
      onFinish={() => setPhase('report')}
    />
  );
}

// ── Chat view (presentational) ──────────────────────────────────────────
function ChatView({
  band, isStreaming, streamingText, tokensPerSec, runCount, modelLabel,
  onRun, onPickPrompt, onCancel, onFinish,
}: {
  band: AgeBand;
  isStreaming: boolean;
  streamingText: string;
  tokensPerSec: number;
  runCount: number;
  modelLabel: string;
  onRun: (text: string) => void;
  onPickPrompt: (p: PocketPrompt) => void;
  onCancel: () => void;
  onFinish: () => void;
}) {
  const [input, setInput] = useState('');
  const prompts = useMemo(() => promptsForBand(band).slice(0, 8), [band]);

  const submit = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    onRun(text);
    setInput('');
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-3">
      {/* Model status bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-xs font-bold"
          style={{ background: `${LAB_COLOR}1A`, color: LAB_COLOR, border: `1px solid ${LAB_COLOR}40` }}
        >
          <Cpu className="w-3.5 h-3.5" aria-hidden="true" /> {modelLabel} · on-device
        </span>
        {(isStreaming || tokensPerSec > 0) && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}
            aria-live="polite"
          >
            <Zap className="w-3.5 h-3.5" style={{ color: '#FFD93D' }} aria-hidden="true" />
            {Math.round(tokensPerSec)} tok/s
          </span>
        )}
        {runCount > 0 && (
          <span className="font-body text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {runCount} answered
          </span>
        )}
      </div>

      {/* Output area */}
      <div
        className="rounded-2xl p-4 mb-4 min-h-[9rem]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        aria-live="polite"
      >
        {streamingText ? (
          <p className="font-body text-sm whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {streamingText}
            {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 align-middle" style={{ background: LAB_COLOR, animation: 'pulse 1s infinite' }} />}
          </p>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-6 h-6 mx-auto mb-2" style={{ color: LAB_COLOR }} aria-hidden="true" />
            <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Pick a prompt below or type your own — the answer is written right here, on your device.
            </p>
          </div>
        )}
      </div>

      {/* Curated prompt chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => !isStreaming && onPickPrompt(p)}
            disabled={isStreaming}
            className="px-3 py-1.5 rounded-full font-body text-xs text-left transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
            aria-label={`Ask: ${p.text}`}
          >
            <span className="mr-1" aria-hidden="true">{THEME_META[p.theme].emoji}</span>
            {p.text.length > 42 ? `${p.text.slice(0, 42)}…` : p.text}
          </button>
        ))}
      </div>

      {/* Free input */}
      <div className="flex items-center gap-2 mb-5">
        <label htmlFor="pb-input" className="sr-only">Type a prompt for the on-device model</label>
        <input
          id="pb-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="Ask the pocket brain anything…"
          maxLength={200}
          disabled={isStreaming}
          className="flex-1 px-4 py-3 rounded-xl font-body text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF', ['--tw-ring-color' as string]: LAB_COLOR }}
        />
        {isStreaming ? (
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-xl font-display font-bold text-sm flex items-center gap-1.5"
            style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }}
            aria-label="Stop generating"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="px-4 py-3 rounded-xl font-display font-bold text-sm flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: LAB_COLOR, color: '#04121A' }}
            aria-label="Send prompt"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        )}
      </div>

      {/* Finish */}
      {runCount >= 1 && !isStreaming && (
        <div className="text-center">
          <SFButton variant="primary" size="md" onClick={onFinish}>
            {runCount >= RUNS_FOR_FULL ? 'See my report' : `See my report (${runCount}/${RUNS_FOR_FULL} for 3★)`}
            <ChevronRight className="w-4 h-4 ml-1" />
          </SFButton>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SLIDER-SIMULATOR FALLBACK (no WebGPU) — honest note + original game
// ════════════════════════════════════════════════════════════════════════
const SIM_LEVELS = [
  { id: 1, name: 'Compression', description: 'Shrink a model without losing accuracy!', emoji: '📦', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 50 },
  { id: 2, name: 'Quantization', description: 'Use fewer bits for each weight!', emoji: '🔢', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 60 },
  { id: 3, name: 'Distillation', description: 'Teach a small model from a big one!', emoji: '👨‍🏫', difficulty: 'easy' as const, starThresholds: [60,80,95], xpReward: 70 },
  { id: 4, name: 'Pruning', description: 'Remove unnecessary connections!', emoji: '✂️', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 80 },
  { id: 5, name: 'Mixed Precision', description: 'Use different precisions for different layers!', emoji: '⚡', difficulty: 'medium' as const, starThresholds: [60,80,90], xpReward: 90 },
  { id: 6, name: 'Edge Deployment', description: 'Optimize for phones and IoT devices!', emoji: '📱', difficulty: 'medium' as const, starThresholds: [50,75,90], xpReward: 100 },
  { id: 7, name: 'Knowledge Distill', description: 'Transfer reasoning, not just answers!', emoji: '🧠', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 120 },
  { id: 8, name: 'Dynamic Batching', description: 'Batch requests for throughput!', emoji: '⚙️', difficulty: 'hard' as const, starThresholds: [50,75,85], xpReward: 130 },
  { id: 9, name: 'Multi-Device', description: 'Split models across hardware!', emoji: '🔌', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 150 },
  { id: 10, name: 'Pocket Master', description: 'The ultimate efficiency challenge!', emoji: '👑', difficulty: 'expert' as const, starThresholds: [50,70,85], xpReward: 200, isBonus: true },
];

const SIM_CONCEPTS: Record<number, string> = {
  1: 'Model compression reduces file size through techniques like weight sharing and matrix factorization, making models faster to load and run.',
  2: 'Quantization reduces the number of bits used to represent each weight. FP32 → INT8 cuts size by 4x with minimal accuracy loss.',
  3: 'Knowledge distillation trains a small "student" model to mimic a large "teacher" model, transferring knowledge through soft labels.',
  4: 'Pruning removes weights with small magnitudes or low importance. A pruned model has fewer connections but can maintain performance.',
  5: 'Mixed precision uses different numerical formats for different layers. Some layers need high precision; others work fine with less.',
  6: 'Edge deployment optimizes models for mobile CPUs, NPUs, and microcontrollers with extreme memory and power constraints.',
  7: 'Advanced distillation transfers not just answers but reasoning chains, attention patterns, and intermediate representations.',
  8: 'Dynamic batching groups incoming requests for efficient GPU utilization. Better batching = higher throughput at same latency.',
  9: 'Model parallelism splits large models across multiple devices. Each device holds a portion of the model, working together.',
  10: 'Master efficient AI: combine quantization, pruning, distillation, and hardware-aware optimization for maximum efficiency.',
};

function getSimulate(levelId: number) {
  return (params: Record<string, number>): SimResult => {
    const quantization = params.quantization || 50;
    const pruning = params.pruning || 50;
    const distillation = params.distillation || 50;
    const optimization = params.optimization || 50;
    const targets: Record<number, [number, number, number, number]> = {
      1: [70, 30, 60, 50], 2: [80, 40, 50, 60], 3: [50, 40, 80, 60],
      4: [40, 80, 50, 50], 5: [70, 50, 60, 70], 6: [80, 50, 40, 70],
      7: [50, 40, 90, 60], 8: [60, 40, 50, 80], 9: [60, 60, 60, 70], 10: [70, 65, 70, 70],
    };
    const t = targets[levelId] || [60, 60, 60, 60];
    const sizeReduction = Math.max(0, 100 - Math.abs(quantization - t[0]) * 0.6 - Math.abs(pruning - t[1]) * 0.5);
    const accuracyRetention = Math.max(0, 100 - Math.abs(distillation - t[2]) * 0.5 - Math.abs(optimization - t[3]) * 0.4);
    const score = Math.round((sizeReduction + accuracyRetention) / 2);
    return {
      score,
      maxScore: 100,
      outputs: {
        sizeReduction: { value: Math.round(sizeReduction), target: 80, label: 'Size Reduction', emoji: '📉' },
        accuracyRetention: { value: Math.round(accuracyRetention), target: 85, label: 'Accuracy Kept', emoji: '🎯' },
      },
      feedback: score >= 80 ? 'Ultra-efficient model!' : score >= 60 ? 'Good compression!' : 'Keep optimizing!',
      explanation: 'In real AI, efficient models balance size reduction (quantization, pruning) with accuracy retention (distillation, optimization).',
    };
  };
}

function SliderSimulatorFallback() {
  const { awardXP, completeGame } = useGameActions();
  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('pocket-brain', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <>
      <div
        className="max-w-xl mx-auto mb-4 rounded-xl p-3 flex items-start gap-2"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        role="note"
      >
        <WifiOff className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
        <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
          This device can&apos;t run a live AI model (it needs WebGPU). No problem — here&apos;s the
          model-shrinking simulator instead, so you can still learn how tiny AI models are made.
        </p>
      </div>
      <GameLevelSystem gameTitle="Pocket Brain" gameEmoji="🧠" labColor={LAB_COLOR} levels={SIM_LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <SimLevelRenderer
            level={level} onComplete={onComplete} onExit={onExit}
            labColor={LAB_COLOR} gameEmoji="🧠"
            description={`${level.description} Adjust the dials and see what changes.`}
            concept={SIM_CONCEPTS[level.id] || SIM_CONCEPTS[1]}
            parameters={[
              { id: 'quantization', label: 'Quantization', emoji: '🔢', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'pruning', label: 'Pruning', emoji: '✂️', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'distillation', label: 'Distillation', emoji: '👨‍🏫', value: 50, min: 0, max: 100, step: 5, unit: '%' },
              { id: 'optimization', label: 'Optimization', emoji: '⚡', value: 50, min: 0, max: 100, step: 5, unit: '%' },
            ]}
            simulate={getSimulate(level.id)}
          />
        )}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROOT — probe capability, route to real model vs slider fallback
// ════════════════════════════════════════════════════════════════════════
export default function PocketBrainGame() {
  const child = useActiveChild();
  const band = (child?.age_band || 'B') as AgeBand;

  const modelChoice = usePocketBrainStore((s) => s.modelChoice);
  const modelStatus = usePocketBrainStore((s) => s.modelStatus);
  const probe = usePocketBrainStore((s) => s.probe);
  const reset = usePocketBrainStore((s) => s.reset);
  const unloadModel = usePocketBrainStore((s) => s.unloadModel);

  // Fresh session: clear transient state, then probe the device once.
  useEffect(() => {
    reset();
    void probe();
    // Free the GPU/model when leaving the game.
    return () => { void unloadModel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noWebGPU = modelChoice === 'mp4-poster';
  const probing = modelStatus === 'probing' || modelChoice === null;

  return (
    <GameShell title="Pocket Brain" color={LAB_COLOR} labNum={1}>
      {probing ? (
        <div className="max-w-xl mx-auto text-center py-16 px-4" aria-live="polite">
          <Cpu className="w-10 h-10 mx-auto mb-3 animate-pulse" style={{ color: LAB_COLOR }} aria-hidden="true" />
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Checking what your device can do…
          </p>
        </div>
      ) : noWebGPU ? (
        <SliderSimulatorFallback />
      ) : (
        <RealModelExperience band={band} />
      )}
    </GameShell>
  );
}
