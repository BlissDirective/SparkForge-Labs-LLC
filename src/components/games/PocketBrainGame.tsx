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

import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import {
  POCKET_PROMPTS,
  THEME_META,
  promptsForBand,
} from '@/lib/pocketbrain/promptLibrary';
import type { Quantization } from '@/lib/pocketbrain/capability';

// ═══════════════════════════════════════════════════════════════
// PHASE 8 — QUANTIZATION LAB (slider Q4/Q5/Q8/FP16, prompt grid)
// ═══════════════════════════════════════════════════════════════

function QuantizationLabPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const quantization = usePocketBrainStore((s) => s.quantization);
  const setQuantization = usePocketBrainStore((s) => s.setQuantization);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const setPhase = usePocketBrainStore((s) => s.setPhase);

  const eligible = promptsForBand(ageBand);
  const QUANT_LEVELS: Quantization[] = ['Q4', 'Q5', 'Q8', 'FP16'];
  const quantMeta = QUANT_META[quantization];

  function pickPrompt(promptId: string) {
    const p = POCKET_PROMPTS.find((x) => x.id === promptId);
    if (!p) return;
    setCurrentPrompt(p.text);
    void runPrompt(p.id);
  }

  return (
    <motion.div
      key="quantization-lab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-cols-[320px_1fr] gap-3 p-4"
    >
      {/* Left: quant slider + prompt list */}
      <Panel className="overflow-y-auto p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB1_HEX }}>
          Quantization
        </p>
        <p className="font-display text-base font-bold text-white mb-1">{quantMeta.label}</p>
        <p className="font-body text-[11px] text-white/65 leading-snug mb-3">
          Smaller quant = less RAM, faster, less smart. Higher = more RAM, slower, smarter.
        </p>
        {/* Quant chips */}
        <div className="flex gap-1 mb-4">
          {QUANT_LEVELS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuantization(q)}
              disabled={isStreaming}
              className="flex-1 px-2 py-1.5 rounded font-mono text-[11px] font-bold transition-all disabled:opacity-50"
              style={{
                background: q === quantization ? LAB1_HEX : 'rgba(255,255,255,0.05)',
                color: q === quantization ? '#031416' : 'white',
                border: `1px solid ${LAB1_HEX}40`,
              }}
              aria-pressed={q === quantization}
            >
              {q}
            </button>
          ))}
        </div>

        {/* RAM / speed / smarts visual relative bars */}
        <div className="space-y-2 mb-4">
          <RelativeBar label="RAM" value={quantMeta.ramRelative} color="#FF7050" />
          <RelativeBar label="Speed" value={quantMeta.speedRelative} color={LAB1_HEX} />
          <RelativeBar label="Smarts" value={quantMeta.smartsRelative} color="#D9A430" />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB1_HEX }}>
          {eligible.length} prompts · pick one
        </p>
        <ul className="space-y-1">
          {eligible.slice(0, 12).map((p) => {
            const meta = THEME_META[p.theme];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pickPrompt(p.id)}
                  disabled={isStreaming}
                  className="w-full text-left rounded p-2 transition-all hover:bg-white/5 disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  aria-label={`Run ${p.label}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">{meta.emoji}</span>
                    <span className="font-display text-xs font-bold text-white flex-1">{p.label}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* Right: output panel */}
      <Panel className="overflow-y-auto p-4 flex flex-col">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB1_HEX }}>
          Brain output
        </p>
        {streamingText.length === 0 ? (
          <p className="font-body text-sm text-white/55 italic">
            Pick a prompt on the left. Try the same prompt at different quant levels — see what changes.
          </p>
        ) : (
          <>
            <p className="font-body text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {streamingText}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-white animate-pulse align-middle" />}
            </p>
            <p className="font-mono text-[11px] text-white/65 mt-3 tabular-nums">
              {tokensPerSec.toFixed(1)} tokens/sec · {quantization}
            </p>
          </>
        )}
        <div className="mt-auto flex justify-between gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setPhase('token-stream-view')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
          >
            ← Slo-mo
          </button>
          <button
            type="button"
            onClick={() => setPhase('moe-switchboard')}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
          >
            MoE switchboard →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function RelativeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10px] text-white/55">{label}</span>
        <span className="font-mono text-[10px] text-white/55 tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 9 — MoE SWITCHBOARD
// ═══════════════════════════════════════════════════════════════

function MoeSwitchboardPhase() {
  const activeExperts = usePocketBrainStore((s) => s.activeExperts);
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const currentPrompt = usePocketBrainStore((s) => s.currentPrompt);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);

  return (
    <motion.div
      key="moe-switchboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          MoE switchboard
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-2">
          Mixture-of-Experts: only the right brains wake up
        </h2>
        <p className="font-body text-sm text-white/75 mb-4">
          The Pocket Brain has 8 expert &quot;sub-brains&quot;. Different prompts wake different experts.
          Try a math prompt, then a creative one — watch which lobes light.
        </p>

        {/* 8-expert grid showing which lit */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from({ length: 8 }, (_, i) => {
            const isActive = activeExperts.includes(i);
            return (
              <div
                key={i}
                className="aspect-square rounded-lg grid place-items-center transition-all"
                style={{
                  background: isActive ? `${LAB1_HEX}25` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? LAB1_HEX : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive ? `0 0 12px ${LAB1_HEX}50, inset 0 0 0 1px ${LAB1_HEX}40` : undefined,
                }}
                aria-label={`Expert ${i + 1} ${isActive ? 'active' : 'idle'}`}
              >
                <div className="text-center">
                  <p className="font-mono text-[10px] text-white/50">Exp</p>
                  <p className="font-display text-lg font-bold text-white">{i + 1}</p>
                </div>
              </div>
            );
          })}
        </div>

        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          rows={2}
          placeholder="Try a math question, then a creative one…"
          className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40 resize-none mb-3"
          aria-label="Prompt"
          disabled={isStreaming}
        />

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setPhase('quantization-lab')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
          >
            ← Quant lab
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void runPrompt('moe-prompt')}
              disabled={isStreaming || currentPrompt.trim().length === 0}
              className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40"
              style={{ background: LAB1_HEX, color: '#031416' }}
            >
              {isStreaming ? 'Streaming…' : 'Run ▶'}
            </button>
            <button
              type="button"
              onClick={() => setPhase('speed-race')}
              className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB1_HEX, color: '#031416' }}
            >
              Speed race →
            </button>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 10 — SPEED RACE (5-min trivia)
// ═══════════════════════════════════════════════════════════════

function SpeedRacePhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const race = usePocketBrainStore((s) => s.race);
  const raceBest = usePocketBrainStore((s) => s.raceBest);
  const startRace = usePocketBrainStore((s) => s.startRace);
  const raceNextQuestion = usePocketBrainStore((s) => s.raceNextQuestion);
  const submitRaceAnswer = usePocketBrainStore((s) => s.submitRaceAnswer);
  const endRace = usePocketBrainStore((s) => s.endRace);
  const raceTick = usePocketBrainStore((s) => s.raceTick);
  const setPhase = usePocketBrainStore((s) => s.setPhase);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const quantization = usePocketBrainStore((s) => s.quantization);

  // Race ticker (re-render once per second to update the clock).
  useEffect(() => {
    if (!race) return;
    const id = window.setInterval(() => raceTick(), 1000);
    return () => window.clearInterval(id);
  }, [race, raceTick]);

  // Auto-end race when timer expires.
  useEffect(() => {
    if (!race) return;
    const elapsed = Date.now() - race.startedAtMs;
    if (elapsed >= race.durationMs) endRace();
  }, [race, endRace]);

  const correct = race?.answers.filter((a) => a.correct).length ?? 0;
  const elapsed = race ? Date.now() - race.startedAtMs : 0;
  const remainingSec = race ? Math.max(0, Math.round((race.durationMs - elapsed) / 1000)) : 0;
  const currentTrivia = race?.currentQuestionId ? RACE_TRIVIA_BY_ID[race.currentQuestionId] : null;

  function fireQuestion() {
    if (!currentTrivia) return;
    setCurrentPrompt(`Answer briefly: ${currentTrivia.question}`);
    void runPrompt('race');
  }

  function submitAndAdvance() {
    if (!currentTrivia) return;
    submitRaceAnswer(currentTrivia.id, streamingText, tokensPerSec);
    raceNextQuestion();
    setCurrentPrompt('');
  }

  return (
    <motion.div
      key="speed-race"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Speed race · 5 minutes
        </p>
        {!race && (
          <>
            <h2 className="font-display text-xl font-bold text-white mb-2">Race the brain</h2>
            <p className="font-body text-sm text-white/75 mb-4">
              Answer as many trivia questions as you can in 5 minutes — but the brain types each
              answer one token at a time. Pick your quant: faster but dumber, or slower but smarter.
            </p>
            <p className="font-mono text-xs text-white/65 mb-4">
              Personal best: <strong className="text-white">{raceBest}</strong> · current quant: {quantization}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPhase('moe-switchboard')}
                className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => startRace(ageBand)}
                className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
                style={{ background: LAB1_HEX, color: '#031416' }}
                aria-label="Start race"
              >
                Start ▶
              </button>
            </div>
          </>
        )}

        {race && (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-display text-2xl font-bold text-white tabular-nums">
                {Math.floor(remainingSec / 60)}:{String(remainingSec % 60).padStart(2, '0')}
              </span>
              <span className="font-mono text-sm text-white/85">
                Score: <strong style={{ color: LAB1_HEX }}>{correct}</strong>
              </span>
            </div>

            {currentTrivia && (
              <div className="rounded-lg p-3 mb-3 bg-black/45" style={{ border: `1px solid ${LAB1_HEX}40` }}>
                <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB1_HEX }}>
                  Question
                </p>
                <p className="font-body text-sm text-white">{currentTrivia.question}</p>
              </div>
            )}

            {streamingText.length > 0 && (
              <div
                className="rounded-lg p-3 mb-3 max-h-32 overflow-y-auto"
                style={{ background: `${LAB1_HEX}10`, border: `1px solid ${LAB1_HEX}30` }}
              >
                <p className="font-body text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                  {streamingText}
                  {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-white animate-pulse align-middle" />}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={endRace}
                className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
              >
                End race
              </button>
              {!isStreaming && streamingText.length === 0 && currentTrivia && (
                <button
                  type="button"
                  onClick={fireQuestion}
                  className="px-4 py-1.5 rounded font-mono text-xs font-bold"
                  style={{ background: LAB1_HEX, color: '#031416' }}
                >
                  Brain, answer ▶
                </button>
              )}
              {!isStreaming && streamingText.length > 0 && (
                <button
                  type="button"
                  onClick={submitAndAdvance}
                  className="px-4 py-1.5 rounded font-mono text-xs font-bold"
                  style={{ background: LAB1_HEX, color: '#031416' }}
                >
                  Submit + next →
                </button>
              )}
            </div>
          </>
        )}
      </Panel>
    </motion.div>
  );
}

// Local lookup helper (avoids re-importing every render).
import { RACE_TRIVIA, isTriviaAnswerCorrect } from '@/lib/pocketbrain/promptLibrary';
const RACE_TRIVIA_BY_ID: Record<string, typeof RACE_TRIVIA[number]> =
  Object.fromEntries(RACE_TRIVIA.map((t) => [t.id, t]));
void isTriviaAnswerCorrect; // re-export-friendly

// ═══════════════════════════════════════════════════════════════
// PHASE 11 — COMPARE CLOUD (single-shot Anthropic)
// ═══════════════════════════════════════════════════════════════

function CompareCloudPhase() {
  const currentPrompt = usePocketBrainStore((s) => s.currentPrompt);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const runCloudCompare = usePocketBrainStore((s) => s.runCloudCompare);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const isCloudComparing = usePocketBrainStore((s) => s.isCloudComparing);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const cloudCompareOutput = usePocketBrainStore((s) => s.cloudCompareOutput);
  const setPhase = usePocketBrainStore((s) => s.setPhase);

  return (
    <motion.div
      key="compare-cloud"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Compare cloud
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-2">
          Pocket Brain vs cloud AI
        </h2>
        <p className="font-body text-sm text-white/75 mb-4">
          One prompt. Both brains. See the gap. (Cloud uses our shared kid-safe Anthropic surface.)
        </p>
        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          rows={2}
          placeholder="Type a prompt to send to BOTH brains…"
          className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40 resize-none mb-3"
          aria-label="Comparison prompt"
          disabled={isStreaming || isCloudComparing}
        />

        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              const text = currentPrompt.trim();
              if (text.length === 0) return;
              void runPrompt('compare');
              void runCloudCompare(text);
            }}
            disabled={isStreaming || isCloudComparing || currentPrompt.trim().length === 0}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40"
            style={{ background: LAB1_HEX, color: '#031416' }}
            aria-label="Run on both brains"
          >
            {isStreaming || isCloudComparing ? 'Running…' : 'Run on both ▶'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg p-3 bg-black/45" style={{ border: `1px solid ${LAB1_HEX}40` }}>
            <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB1_HEX }}>
              🎒 Pocket Brain (your laptop)
            </p>
            <p className="font-body text-sm text-white/90 whitespace-pre-wrap min-h-[5rem] leading-relaxed">
              {streamingText || (isStreaming ? '…' : '(no answer yet)')}
            </p>
          </div>
          <div className="rounded-lg p-3 bg-black/45" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="font-mono text-[10px] uppercase mb-1 text-white/65">
              ☁️ Cloud AI (Anthropic)
            </p>
            <p className="font-body text-sm text-white/90 whitespace-pre-wrap min-h-[5rem] leading-relaxed">
              {cloudCompareOutput || (isCloudComparing ? '…' : '(no answer yet)')}
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setPhase('speed-race')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
          >
            ← Race
          </button>
          <button
            type="button"
            onClick={() => setPhase('pocket-mode')}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB1_HEX, color: '#031416' }}
          >
            Pocket mode →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 12 — POCKET MODE (free play)
// ═══════════════════════════════════════════════════════════════

function PocketModePhase() {
  const currentPrompt = usePocketBrainStore((s) => s.currentPrompt);
  const setCurrentPrompt = usePocketBrainStore((s) => s.setCurrentPrompt);
  const runPrompt = usePocketBrainStore((s) => s.runPrompt);
  const isStreaming = usePocketBrainStore((s) => s.isStreaming);
  const streamingText = usePocketBrainStore((s) => s.streamingText);
  const tokensPerSec = usePocketBrainStore((s) => s.tokensPerSec);
  const cancelStream = usePocketBrainStore((s) => s.cancelStream);
  const setPhase = usePocketBrainStore((s) => s.setPhase);

  return (
    <motion.div
      key="pocket-mode"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB1_HEX }}>
          Pocket mode · free play
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-3">
          The brain is yours. Ask anything kid-safe.
        </h2>

        <textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          rows={4}
          placeholder="Type a question, a story prompt, anything kid-safe…"
          className="w-full px-3 py-2 rounded bg-black/50 border border-white/15 text-white font-body text-sm focus:outline-none focus:border-white/40 resize-none mb-3"
          aria-label="Free-play prompt"
          disabled={isStreaming}
        />

        {streamingText.length > 0 && (
          <div
            className="rounded-lg p-3 mb-3 max-h-56 overflow-y-auto"
            style={{ background: `${LAB1_HEX}10`, border: `1px solid ${LAB1_HEX}40` }}
          >
            <p className="font-body text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {streamingText}
              {isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 bg-white animate-pulse align-middle" />}
            </p>
            {tokensPerSec > 0 && (
              <p className="font-mono text-[11px] text-white/55 mt-2 tabular-nums">{tokensPerSec.toFixed(1)} tokens/sec</p>
            )}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => setPhase('compare-cloud')}
            className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
          >
            ← Compare
          </button>
          <div className="flex gap-2">
            {isStreaming && (
              <button
                type="button"
                onClick={cancelStream}
                className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => void runPrompt('pocket-free')}
              disabled={isStreaming || currentPrompt.trim().length === 0}
              className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40"
              style={{ background: LAB1_HEX, color: '#031416' }}
            >
              {isStreaming ? 'Streaming…' : 'Run ▶'}
            </button>
            <button
              type="button"
              onClick={() => setPhase('report')}
              className="px-4 py-1.5 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
              style={{ background: LAB1_HEX, color: '#031416' }}
            >
              Report card →
            </button>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 13 — REPORT (cert + run history)
// ═══════════════════════════════════════════════════════════════

function ReportPhase() {
  const runHistory = usePocketBrainStore((s) => s.runHistory);
  const raceBest = usePocketBrainStore((s) => s.raceBest);
  const modelChoice = usePocketBrainStore((s) => s.modelChoice);
  const completeGame = useGameStore((s) => s.completeGame);

  useEffect(() => {
    completeGame();
  }, [completeGame]);

  const totalRuns = runHistory.length;
  const totalTokens = runHistory.reduce(
    (s, r) => s + Math.round((r.tokensPerSec * r.durationMs) / 1000),
    0,
  );
  const avgTps = totalRuns === 0
    ? 0
    : runHistory.reduce((s, r) => s + r.tokensPerSec, 0) / totalRuns;
  const meta = modelChoice ? MODEL_META[modelChoice] : null;

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-md w-full p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB1_HEX }}>
          You ran a real LLM today
        </p>
        <h2 className="font-display text-2xl font-bold text-white mb-3">
          Pocket Brain certificate
        </h2>
        <div className="grid grid-cols-3 gap-2 my-5">
          <KeyStat label="Prompts run" value={String(totalRuns)} />
          <KeyStat label="Tokens (est)" value={String(totalTokens)} />
          <KeyStat label="Avg t/s" value={avgTps.toFixed(1)} />
        </div>
        <p className="font-body text-sm text-white/75 leading-relaxed mb-3">
          You ran <strong style={{ color: LAB1_HEX }}>{meta?.label ?? 'a small model'}</strong>{' '}
          entirely in your browser. No server. No API key.
        </p>
        <p className="font-mono text-[11px] text-white/55">
          Race personal best: <strong className="text-white">{raceBest}</strong>
        </p>
      </Panel>
    </motion.div>
  );
}

function KeyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${LAB1_HEX}30` }}>
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/55 mb-0.5">{label}</p>
      <p className="font-display text-xl font-bold text-white tabular-nums">{value}</p>
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
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band ?? 'B') as 'A' | 'B' | 'C';

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
        {phase === 'quantization-lab' && <QuantizationLabPhase key="quantization-lab" ageBand={ageBand} />}
        {phase === 'moe-switchboard' && <MoeSwitchboardPhase key="moe-switchboard" />}
        {phase === 'speed-race' && <SpeedRacePhase key="speed-race" ageBand={ageBand} />}
        {phase === 'compare-cloud' && <CompareCloudPhase key="compare-cloud" />}
        {phase === 'pocket-mode' && <PocketModePhase key="pocket-mode" />}
        {phase === 'report' && <ReportPhase key="report" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default PocketBrainGame;

export const _LAB1_HEX = LAB1_HEX;
