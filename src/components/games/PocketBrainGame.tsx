'use client';

// ════════════════════════════════════════════════════════════════
// POCKET BRAIN — Stage 11A (C5, Lab 1 — "What IS AI?")
// ════════════════════════════════════════════════════════════════
// Lab 1 | #0FB8FA blue
// The headline flagship: kid runs a real LLM in their browser.
// No internet, no server, no API key.
//
// 13-phase machine (managed by usePocketBrainStore):
//   welcome → learn-model → learn-tokens → learn-where → download
//   → first-run → token-stream-view → quantization-lab
//   → moe-switchboard → speed-race → compare-cloud → pocket-mode
//   → report
//
// Sub 11A.7a (this commit): welcome / 3 tutorials / download /
// first-run / token-stream-view (7 phases).
// Sub 11A.7b: quant-lab / moe / race / cloud / pocket / report.
// ════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { usePocketBrainStore } from '@/stores/pocketBrainStore';
import { MODEL_META, QUANT_META } from '@/lib/pocketbrain/capability';

const PocketBrain3D = dynamic(() => import('@/components/3d/PocketBrain3D'), { ssr: false });
const PocketBrainEnvironment = dynamic(
  () => import('@/components/3d/environments/PocketBrainEnvironment'),
  { ssr: false },
);

const LAB1_HEX = '#0FB8FA';
const LAB1_DEEP = '#0A2A45';

// ─── Common chrome bezel panel ───────────────────────────────────

export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border bg-black/65 backdrop-blur-sm shadow-2xl ${className}`}
      style={{
        borderColor: `${LAB1_HEX}40`,
        boxShadow: `0 0 24px ${LAB1_HEX}25, inset 0 0 0 1px ${LAB1_HEX}30`,
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 1 — WELCOME
// ═══════════════════════════════════════════════════════════════

function WelcomePhase() {
  const beginGame = usePocketBrainStore((s) => s.beginGame);
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 grid place-items-center p-8"
    >
      <Panel className="max-w-xl w-full p-10 text-center">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: LAB1_HEX }}>
          Lab 1 · What IS AI?
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Pocket Brain
        </h1>
        <p className="font-body text-base text-white/85 mb-3 max-w-md mx-auto leading-relaxed">
          There&apos;s a real AI living in this browser tab.
        </p>
        <p className="font-body text-sm text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
          No internet. No server. No API key. Just you, your laptop, and a tiny brain about to wake up.
        </p>
        <button
          type="button"
          onClick={beginGame}
          className="px-8 py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${LAB1_HEX}, ${LAB1_DEEP})`,
            color: '#031416',
            boxShadow: `0 0 20px ${LAB1_HEX}50`,
          }}
          aria-label="Wake up the Pocket Brain"
        >
          Wake it up
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: WHAT IS A MODEL?
// ═══════════════════════════════════════════════════════════════

function LearnModelPhase() {
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const markSeen = usePocketBrainStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('model');
    setPhase('learn-tokens');
  }
  return (
    <motion.div
      key="learn-model"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Card 1 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          What&apos;s a model?
        </h2>
        <p className="font-body text-white/80 mb-3 leading-relaxed">
          A <span style={{ color: LAB1_HEX }}>model</span> is a giant pile of numbers — billions of them —
          that the AI uses to guess what to say next.
        </p>
        <p className="font-body text-white/80 mb-3 leading-relaxed">
          Bigger pile = smarter, but heavier. Smaller pile = faster, but less smart.
          Today you&apos;ll meet a small one that fits inside your browser.
        </p>
        <div className="rounded-lg p-3 bg-black/45 mb-5" style={{ border: `1px solid ${LAB1_HEX}40` }}>
          <p className="font-mono text-[11px] uppercase mb-1" style={{ color: LAB1_HEX }}>
            For comparison
          </p>
          <ul className="space-y-1 font-body text-sm text-white/85">
            <li>📚 Big cloud model: ~70,000,000,000 numbers</li>
            <li>🎒 Pocket Brain: ~1,100,000,000–8,300,000,000 numbers</li>
            <li>🧠 Your brain: ~86,000,000,000 neurons (different kind of count)</li>
          </ul>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: WHAT'S A TOKEN?
// ═══════════════════════════════════════════════════════════════

function LearnTokensPhase() {
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const markSeen = usePocketBrainStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('tokens');
    setPhase('learn-where');
  }
  return (
    <motion.div
      key="learn-tokens"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Card 2 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          What&apos;s a token?
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          A <span style={{ color: LAB1_HEX }}>token</span> is a small piece of text — usually a word,
          part of a word, or a punctuation mark. The AI guesses one token at a time.
        </p>
        <div className="rounded-lg p-4 bg-black/45 mb-5" style={{ border: `1px solid ${LAB1_HEX}40` }}>
          <p className="font-mono text-[11px] uppercase mb-2" style={{ color: LAB1_HEX }}>
            Example: &quot;The cat sat on a mat.&quot;
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {['The', ' cat', ' sat', ' on', ' a', ' mat', '.'].map((tok) => (
              <span
                key={tok}
                className="px-2 py-1 rounded"
                style={{ background: `${LAB1_HEX}25`, color: LAB1_HEX, border: `1px solid ${LAB1_HEX}50` }}
              >
                {tok || '·'}
              </span>
            ))}
          </div>
          <p className="font-body text-[11px] text-white/55 mt-2 italic">
            7 tokens. Spaces stick to the word that follows. Punctuation gets its own token.
          </p>
        </div>
        <p className="font-body text-sm text-white/65 mb-5 italic">
          When the AI replies, you&apos;ll see tokens stream in one at a time — that&apos;s what makes
          the answer feel like it&apos;s being typed.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: WHERE DOES IT RUN?
// ═══════════════════════════════════════════════════════════════

function LearnWherePhase() {
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const markSeen = usePocketBrainStore((s) => s.markTutorialSeen);
  const probe = usePocketBrainStore((s) => s.probe);
  function next() {
    markSeen('where');
    void probe();
    setPhase('download');
  }
  return (
    <motion.div
      key="learn-where"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Card 3 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Where does it run?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg p-3 bg-black/45" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="font-mono text-[10px] uppercase text-white/55 mb-1">☁️ Cloud AI</p>
            <p className="font-body text-xs text-white/75 leading-snug">
              Lives on giant servers far away. You send your question over the internet; it sends the
              answer back.
            </p>
          </div>
          <div className="rounded-lg p-3 bg-black/45" style={{ border: `1px solid ${LAB1_HEX}50` }}>
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB1_HEX }}>🎒 Pocket Brain</p>
            <p className="font-body text-xs text-white/85 leading-snug">
              Lives <strong>in this browser tab</strong>. Your laptop&apos;s graphics chip does the math.
              No internet needed after it loads.
            </p>
          </div>
        </div>
        <p className="font-body text-sm text-white/65 mb-5">
          The next step downloads the model into your browser. It happens once, then your computer
          remembers it.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
          >
            Check my computer →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — DOWNLOAD (real model fetch with live progress)
// ═══════════════════════════════════════════════════════════════

function DownloadPhase() {
  const capability = usePocketBrainStore((s) => s.capability);
  const modelStatus = usePocketBrainStore((s) => s.modelStatus);
  const modelChoice = usePocketBrainStore((s) => s.modelChoice);
  const quantization = usePocketBrainStore((s) => s.quantization);
  const loadProgress = usePocketBrainStore((s) => s.loadProgress);
  const loadError = usePocketBrainStore((s) => s.loadError);
  const loadModel = usePocketBrainStore((s) => s.loadModel);
  const setPhase = usePocketBrainStore((s) => s.setPhase);

  const meta = modelChoice ? MODEL_META[modelChoice] : null;
  const quantMeta = QUANT_META[quantization];
  const isFallback = modelChoice === 'mp4-poster';
  const isReady = modelStatus === 'ready';
  const isLoading = modelStatus === 'downloading' || modelStatus === 'loading';
  const pct = loadProgress ? Math.round(loadProgress.progress * 100) : 0;

  return (
    <motion.div
      key="download"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-xl w-full p-7">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Download model
        </p>
        <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-2">
          {isFallback ? 'WebGPU not available' : `Loading ${meta?.label ?? 'model'}`}
        </h2>

        {capability && (
          <p className="font-mono text-[11px] text-white/60 mb-4">
            Detected: {capability.hasWebGPU ? '✓ WebGPU' : '✗ no WebGPU'}
            {capability.adapterInfo.vendor && ` · ${capability.adapterInfo.vendor}`}
            {capability.hasCached && ' · cached'}
          </p>
        )}

        {!isFallback && meta && (
          <div className="rounded-lg p-3 bg-black/45 mb-4" style={{ border: `1px solid ${LAB1_HEX}30` }}>
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB1_HEX }}>
              About {meta.label}
            </p>
            <p className="font-body text-sm text-white/85 mb-1">{meta.description}</p>
            <p className="font-mono text-[11px] text-white/60">
              ~{meta.sizeLabel} download · quantization {quantMeta.label}
            </p>
          </div>
        )}

        {isFallback && (
          <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(255,112,80,0.1)', border: '1px solid rgba(255,112,80,0.4)' }}>
            <p className="font-body text-sm text-white/85">
              Your browser doesn&apos;t support WebGPU yet, so the live brain can&apos;t run here.
              Skip ahead to a video walkthrough — kids on Chrome 113+ or Edge 113+ can run the real
              thing.
            </p>
          </div>
        )}

        {!isFallback && !isReady && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="font-mono text-[11px] text-white/60">
                {loadProgress?.text ?? 'Click "Start download" to begin'}
              </span>
              <span className="font-mono text-xs text-white/85 tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${pct}%`, background: LAB1_HEX }}
              />
            </div>
            {loadProgress && loadProgress.elapsedMs > 0 && (
              <p className="font-mono text-[10px] text-white/45 mt-1">
                Elapsed: {Math.round(loadProgress.elapsedMs / 1000)}s
              </p>
            )}
          </div>
        )}

        {loadError && (
          <p className="font-mono text-[11px] text-[#FF7050] mb-3">{loadError}</p>
        )}

        <div className="flex justify-end gap-2">
          {!isReady && !isFallback && !isLoading && (
            <button
              type="button"
              onClick={() => void loadModel()}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB1_HEX, color: '#031416' }}
              aria-label="Start downloading the model"
            >
              Start download
            </button>
          )}
          {(isReady || isFallback) && (
            <button
              type="button"
              onClick={() => setPhase('first-run')}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB1_HEX, color: '#031416' }}
            >
              {isFallback ? 'Continue (video) →' : 'First run ▶'}
            </button>
          )}
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — FIRST RUN (real prompt, real response stream)
// ═══════════════════════════════════════════════════════════════

function FirstRunPhase() {
  const currentPrompt = usePocketBrainStore((s) => s.currentPrompt);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const cancelStream = usePocketBrainStore((s) => s.cancelStream);

  // Default prompt suggestion shown only if user hasn't typed anything.
  useEffect(() => {
    if (currentPrompt.length === 0) {
      setCurrentPrompt('Hello! Can you say hi back to me in 1 sentence?');
    }
  }, [currentPrompt.length, setCurrentPrompt]);

  return (
    <motion.div
      key="first-run"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Your first run
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-3">
          Type something. Watch tokens stream.
        </h2>

        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          rows={3}
          placeholder="Ask anything kid-safe…"
          className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40 resize-none mb-3"
          aria-label="Prompt"
          disabled={isStreaming}
        />

        {streamingText.length > 0 && (
          <div
            className="rounded-lg p-3 mb-3 max-h-48 overflow-y-auto"
            style={{ background: `${LAB1_HEX}10`, border: `1px solid ${LAB1_HEX}40` }}
          >
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB1_HEX }}>
              Brain says
            </p>
            <p className="font-body text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {streamingText}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-white animate-pulse align-middle" />}
            </p>
          </div>
        )}

        {(isStreaming || tokensPerSec > 0) && (
          <p className="font-mono text-[11px] text-white/65 mb-3 tabular-nums">
            {tokensPerSec.toFixed(1)} tokens/sec
          </p>
        )}

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setPhase('download')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
          >
            ← Download
          </button>
          <div className="flex gap-2">
            {isStreaming && (
              <button
                type="button"
                onClick={cancelStream}
                className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => void runPrompt('first-run')}
              disabled={isStreaming || currentPrompt.trim().length === 0}
              className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: LAB1_HEX, color: '#031416' }}
              aria-label="Run prompt"
            >
              {isStreaming ? 'Streaming…' : 'Run ▶'}
            </button>
            {streamingText.length > 0 && !isStreaming && (
              <button
                type="button"
                onClick={() => setPhase('token-stream-view')}
                className="px-3 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
                style={{ background: LAB1_HEX, color: '#031416' }}
              >
                Slo-mo →
              </button>
            )}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 7 — TOKEN STREAM VIEW (slo-mo with logit visualization)
// ═══════════════════════════════════════════════════════════════

function TokenStreamViewPhase() {
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const setPhase = usePocketBrainStore((s) => s.setPhase);

  // Tokenize-ish: split on word boundaries keeping the spaces. This is
  // a kid-friendly approximation, not the real BPE tokenizer.
  const tokens = streamingText
    .split(/(\s+|[.,!?;:'"()\[\]{}—-])/)
    .filter((t) => t.length > 0);

  return (
    <motion.div
      key="token-stream-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Slo-mo · token stream
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-3">
          Each chip is one token
        </h2>
        <p className="font-body text-sm text-white/70 mb-4">
          The brain wrote {tokens.length} token{tokens.length === 1 ? '' : 's'} to make that answer. Each
          chip below was one prediction step.
        </p>

        {tokens.length === 0 ? (
          <p className="font-body text-sm text-white/55 italic">
            No output yet. Run a prompt first.
          </p>
        ) : (
          <div
            className="flex flex-wrap gap-1 p-3 rounded-lg max-h-64 overflow-y-auto"
            style={{ background: `${LAB1_HEX}08`, border: `1px solid ${LAB1_HEX}30` }}
          >
            {tokens.map((tok, i) => (
              <motion.span
                key={`${i}-${tok}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 1) }}
                className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                style={{
                  background: tok.trim().length === 0 ? 'rgba(255,255,255,0.05)' : `${LAB1_HEX}20`,
                  color: tok.trim().length === 0 ? 'rgba(255,255,255,0.4)' : '#fff',
                  border: `1px solid ${LAB1_HEX}30`,
                }}
                aria-label={`Token: ${tok || 'space'}`}
              >
                {tok.trim().length === 0 ? '·' : tok}
              </motion.span>
            ))}
          </div>
        )}

        <div className="flex justify-between gap-2 mt-5">
          <button
            type="button"
            onClick={() => setPhase('first-run')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
          >
            ← First run
          </button>
          <button
            type="button"
            onClick={() => setPhase('quantization-lab')}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
            aria-label="Move to quantization lab"
          >
            Quantization lab →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASES 8-13 — placeholders implemented in Sub 11A.7b
// ═══════════════════════════════════════════════════════════════

function NotYetPhase({ label, prevPhase }: { label: string; prevPhase: 'token-stream-view' }) {
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB1_HEX }}>
          {label} (Sub 11A.7b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase(prevPhase)}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB1_HEX, color: '#031416' }}
        >
          ← Back
        </button>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 1; // Pocket Brain is one long ride per session

export function PocketBrainGame() {
  const phase = usePocketBrainStore((s) => s.phase);
  const reset = usePocketBrainStore((s) => s.reset);

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  return (
    <GameShell
      gameId="pocket-brain"
      title="Pocket Brain"
      worldNumber={1}
      worldColor={LAB1_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <PocketBrainEnvironment />
        <PocketBrain3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-model' && <LearnModelPhase key="learn-model" />}
        {phase === 'learn-tokens' && <LearnTokensPhase key="learn-tokens" />}
        {phase === 'learn-where' && <LearnWherePhase key="learn-where" />}
        {phase === 'download' && <DownloadPhase key="download" />}
        {phase === 'first-run' && <FirstRunPhase key="first-run" />}
        {phase === 'token-stream-view' && <TokenStreamViewPhase key="token-stream-view" />}
        {phase === 'quantization-lab' && <NotYetPhase key="quantization-lab" label="Quantization lab" prevPhase="token-stream-view" />}
        {phase === 'moe-switchboard' && <NotYetPhase key="moe-switchboard" label="MoE switchboard" prevPhase="token-stream-view" />}
        {phase === 'speed-race' && <NotYetPhase key="speed-race" label="Speed race" prevPhase="token-stream-view" />}
        {phase === 'compare-cloud' && <NotYetPhase key="compare-cloud" label="Compare-cloud" prevPhase="token-stream-view" />}
        {phase === 'pocket-mode' && <NotYetPhase key="pocket-mode" label="Pocket mode" prevPhase="token-stream-view" />}
        {phase === 'report' && <NotYetPhase key="report" label="Report" prevPhase="token-stream-view" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default PocketBrainGame;

export const _LAB1_HEX = LAB1_HEX;
