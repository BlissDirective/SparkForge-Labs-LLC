'use client';

// ════════════════════════════════════════════════════════════════
// PIXEL WITNESS — Stage 11C (C4, Lab 7 — Computer Vision)
// ════════════════════════════════════════════════════════════════
// Lab 7 | #10BAD2 cyan
// 'Watch the clip. Now ask the AI what happened. Then catch the lies.'
//
// 12-phase machine (managed by usePixelWitnessStore):
//   welcome → learn-modal → learn-fusion → learn-hallucinate
//   → tutorial → watch-A → watch-B → watch-C → hallucination-hunt
//   → sense-builder → creative-sandbox → report
//
// Sub 11C.7a (this commit): welcome / 3 tutorials / tutorial round
// (5 phases). Sub 11C.7b: watch-A/B/C, hallucination-hunt,
// sense-builder, creative-sandbox, report.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useActiveChild } from '@/hooks/useChildren';
import { usePixelWitnessStore } from '@/stores/pixelWitnessStore';

const PixelWitness3D = dynamic(() => import('@/components/3d/PixelWitness3D'), { ssr: false });
const PixelWitnessEnvironment = dynamic(
  () => import('@/components/3d/environments/PixelWitnessEnvironment'),
  { ssr: false },
);

const LAB7_HEX = '#10BAD2';
const LAB7_DEEP = '#062A35';

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
        borderColor: `${LAB7_HEX}40`,
        boxShadow: `0 0 24px ${LAB7_HEX}25, inset 0 0 0 1px ${LAB7_HEX}30`,
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
  const beginGame = usePixelWitnessStore((s) => s.beginGame);
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
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: LAB7_HEX }}>
          Lab 7 · Computer Vision
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Pixel Witness
        </h1>
        <p className="font-body text-base text-white/85 mb-3 max-w-md mx-auto leading-relaxed">
          Watch the clip. Now ask the AI what happened.
        </p>
        <p className="font-body text-sm text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
          Then catch the lies. AI is good at sounding right when it isn&apos;t — your job is to spot when.
        </p>
        <button
          type="button"
          onClick={beginGame}
          className="px-8 py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${LAB7_HEX}, ${LAB7_DEEP})`,
            color: '#031416',
            boxShadow: `0 0 20px ${LAB7_HEX}50`,
          }}
          aria-label="Roll camera"
        >
          Roll camera
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: SENSES → MODALITIES
// ═══════════════════════════════════════════════════════════════

function LearnModalPhase() {
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const markSeen = usePixelWitnessStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('modal');
    setPhase('learn-fusion');
  }
  return (
    <motion.div
      key="learn-modal"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB7_HEX }}>
          Card 1 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Senses → modalities
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          You have <span style={{ color: LAB7_HEX }}>5 senses</span>: sight, hearing, touch, taste, smell.
          AIs have something similar — except theirs are called{' '}
          <span style={{ color: LAB7_HEX }}>modalities</span>.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-5">
          <ModalCard emoji="👀" label="Sight" desc="Pixels — images, video frames" color={LAB7_HEX} />
          <ModalCard emoji="👂" label="Hearing" desc="Audio — speech, music, sound effects" color="#00D17A" />
          <ModalCard emoji="✍️" label="Reading" desc="Text — captions, prompts, documents" color="#FFD93D" />
          <ModalCard emoji="🤔" label="Reasoning" desc="Combining everything to draw conclusions" color="#B67BFF" />
        </div>
        <p className="font-body text-sm text-white/65 italic mb-5">
          Pixel Witness focuses on sight + hearing + reading — the three senses an AI uses to
          understand a video.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB7_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function ModalCard({ emoji, label, desc, color }: { emoji: string; label: string; desc: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 bg-black/45" style={{ border: `1px solid ${color}40` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base" aria-hidden="true">{emoji}</span>
        <span className="font-display text-sm font-bold text-white">{label}</span>
      </div>
      <p className="font-body text-[11px] text-white/65 leading-snug">{desc}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: FUSION (single transformer vs bolt-on)
// ═══════════════════════════════════════════════════════════════

function LearnFusionPhase() {
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const markSeen = usePixelWitnessStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('fusion');
    setPhase('learn-hallucinate');
  }
  return (
    <motion.div
      key="learn-fusion"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB7_HEX }}>
          Card 2 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Single brain vs specialists wired together
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          Old AIs had separate brains for vision and language, then a translator in between. New AIs
          have <span style={{ color: LAB7_HEX }}>one shared brain</span> that handles everything at
          once. Less to lose in translation.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg p-3 bg-black/45" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="font-mono text-[11px] uppercase mb-1 text-white/60">Older approach</p>
            <p className="font-body text-sm text-white/85 mb-2 leading-snug">
              📷 Vision brain → 🌉 bridge → 🗣️ Language brain
            </p>
            <p className="font-body text-[11px] text-white/55 italic">
              Three steps. Bridge can drop details. The language brain only sees a summary.
            </p>
          </div>
          <div className="rounded-lg p-3 bg-black/45" style={{ border: `1px solid ${LAB7_HEX}50` }}>
            <p className="font-mono text-[11px] uppercase mb-1" style={{ color: LAB7_HEX }}>Newer approach</p>
            <p className="font-body text-sm text-white/85 mb-2 leading-snug">
              🧠 One shared brain handles 📷 + 🗣️ + 🔊 together
            </p>
            <p className="font-body text-[11px] text-white/55 italic">
              One step. Pixels and words live in the same space. Better at fine details, harder to
              fool.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB7_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: HALLUCINATIONS
// ═══════════════════════════════════════════════════════════════

function LearnHallucinatePhase() {
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const markSeen = usePixelWitnessStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('hallucinate');
    setPhase('tutorial');
  }
  return (
    <motion.div
      key="learn-hallucinate"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB7_HEX }}>
          Card 3 of 3
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Hallucinations: when AI confidently lies
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          A <span style={{ color: '#FF7050' }}>hallucination</span> is when an AI invents a detail
          it didn&apos;t actually see — like a name, a number, or a color. It says it as if it
          knows.
        </p>
        <div className="rounded-lg p-3 mb-5" style={{ background: 'rgba(255,112,80,0.1)', border: '1px solid rgba(255,112,80,0.4)' }}>
          <p className="font-mono text-[11px] uppercase mb-2 text-[#FF7050]">
            Example
          </p>
          <p className="font-body text-sm text-white/90 leading-relaxed">
            <strong className="text-white">Q:</strong> What color is the cat&apos;s collar?<br />
            <strong className="text-white">AI:</strong> The cat is wearing a red collar with a small bell.<br />
            <strong style={{ color: '#FF7050' }}>Reality:</strong> The cat in the clip has no collar.
          </p>
        </div>
        <p className="font-body text-sm text-white/65 italic mb-5">
          Your job in Pixel Witness: catch the AI when it does this. Three rating buttons:{' '}
          <span style={{ color: '#00D17A' }}>correct</span>,{' '}
          <span style={{ color: '#D9A430' }}>partial</span>, or{' '}
          <span style={{ color: '#FF7050' }}>hallucination</span>.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB7_HEX, color: '#031416' }}
          >
            Try a tutorial round →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — TUTORIAL (1 guided round)
// ═══════════════════════════════════════════════════════════════

function TutorialPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const startMode = usePixelWitnessStore((s) => s.startMode);
  const markSeen = usePixelWitnessStore((s) => s.markTutorialSeen);
  function start() {
    markSeen('tutorial');
    startMode('watch-A', ageBand);
  }
  return (
    <motion.div
      key="tutorial"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-xl w-full p-8 text-center">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB7_HEX }}>
          Tutorial round
        </p>
        <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-3">
          Watch a clip. See the AI&apos;s answer. Rate it.
        </h2>
        <p className="font-body text-sm text-white/75 mb-6 leading-relaxed">
          You&apos;ll see 6 simple clips. For each, the AI answers 4 questions — three real, one
          adversarial. Mark each as correct, partial, or hallucination. Try to catch the lie.
        </p>
        <button
          type="button"
          onClick={start}
          className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
          style={{ background: LAB7_HEX, color: '#031416' }}
          aria-label="Start tutorial round"
        >
          Start ▶
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASES 6-10 — Watch & Sense Builder (mode play UI)
// ═══════════════════════════════════════════════════════════════

import { useGameStore } from '@/stores/gameStore';
import { THEME_META } from '@/lib/pixelwitness/clipLibrary';
import { SENSE_META, senseCost } from '@/lib/pixelwitness/judgeEngine';
import type { PixelMode, PlayerRating, SenseConfig } from '@/types/pixelWitness';

// ─── Shared Clip Player atom (poster fallback for missing video) ─

const PLACEHOLDER_SVG = '/videos/pixel-witness/placeholder.svg';

interface ClipPlayerProps {
  src: string;
  poster: string;
  durationSec: number;
  themeColor: string;
}

function ClipPlayer({ src, poster, durationSec, themeColor }: ClipPlayerProps) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: '#0A1A22',
        border: `1px solid ${themeColor}50`,
        aspectRatio: '16 / 9',
      }}
    >
      {!hasError ? (
        <video
          key={src}
          controls
          loop
          poster={poster}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
          aria-label="Clip video"
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        // Layered fallback when no MP4 / poster JPG are provisioned:
        //   1) Background = placeholder.svg as CSS background-image
        //      (avoids @next/next/no-img-element lint and keeps it
        //      runtime-cheap — no next/image hydration for a static SVG)
        //   2) Overlay = caption with theme-tinted duration label
        <div
          className="relative w-full h-full"
          role="img"
          aria-label="Clip preview placeholder — video pending"
          style={{
            backgroundImage: `url(${PLACEHOLDER_SVG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-x-0 bottom-0 grid place-items-center p-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase mb-0.5" style={{ color: themeColor }}>
                clip preview · {durationSec}s · video pending
              </p>
              <p className="font-body text-[11px] text-white/65 italic">
                Q-A flow works without the video file.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WatchModeUI: clip + question + AI answer + 3 rating buttons ─

interface WatchModeUIProps {
  ageBand: 'A' | 'B' | 'C';
  mode: PixelMode;
  modeLabel: string;
}

function WatchModeUI({ ageBand, mode, modeLabel }: WatchModeUIProps) {
  const currentClip = usePixelWitnessStore((s) => s.currentClip);
  const currentQuestion = usePixelWitnessStore((s) => s.currentQuestion);
  const clipIndex = usePixelWitnessStore((s) => s.clipIndex);
  const modeClips = usePixelWitnessStore((s) => s.modeClips);
  const questionIndex = usePixelWitnessStore((s) => s.questionIndex);
  const currentQuestions = usePixelWitnessStore((s) => s.currentQuestions);
  const hasRatedCurrent = usePixelWitnessStore((s) => s.hasRatedCurrent);
  const ratings = usePixelWitnessStore((s) => s.ratings);
  const startMode = usePixelWitnessStore((s) => s.startMode);
  const rateAnswer = usePixelWitnessStore((s) => s.rateAnswer);
  const nextQuestion = usePixelWitnessStore((s) => s.nextQuestion);
  const getDisplayedAnswer = usePixelWitnessStore((s) => s.getDisplayedAnswer);
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const updateScore = useGameStore((s) => s.updateScore);

  // Auto-load mode if not yet loaded.
  useEffect(() => {
    if (!currentClip || modeClips.length === 0) {
      startMode(mode, ageBand);
    }
  }, [currentClip, modeClips.length, startMode, mode, ageBand]);

  if (!currentClip || !currentQuestion) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-6 text-center">
          <p className="font-body text-sm text-white/65 mb-3">Loading clip…</p>
        </Panel>
      </div>
    );
  }

  const themeMeta = THEME_META[currentClip.theme];
  const lastRating = hasRatedCurrent
    ? ratings.find((r) => r.questionId === currentQuestion.id)
    : null;
  const displayedAnswer = getDisplayedAnswer();

  function rateAndScore(rating: PlayerRating['rating']) {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    rateAnswer(rating);
    // Award score = 25 per match, 0 otherwise; checked after the next render
    // since rateAnswer is async-ish (state).
    setTimeout(() => {
      const r = usePixelWitnessStore.getState().ratings.find((rr) => rr.questionId === qId);
      if (r?.matched) updateScore(25);
    }, 50);
  }

  return (
    <motion.div
      key={`${mode}-${currentClip.id}-${currentQuestion.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-3 p-4"
    >
      {/* Top status */}
      <Panel className="p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: LAB7_HEX }}>
            {modeLabel}
          </p>
          <p className="font-display text-sm font-bold text-white">
            Clip {clipIndex + 1} of {modeClips.length} · question {questionIndex + 1}/{currentQuestions.length}
          </p>
        </div>
        <span
          className="font-mono text-[10px] uppercase px-2 py-0.5 rounded"
          style={{ background: `${themeMeta.color}25`, color: themeMeta.color }}
        >
          {themeMeta.emoji} {themeMeta.label}
        </span>
      </Panel>

      {/* Mid: clip player + question + answer + rating */}
      <Panel className="overflow-y-auto p-4 grid grid-rows-[auto_1fr] gap-3">
        <div className="grid sm:grid-cols-[1fr_1.2fr] gap-3">
          {/* Clip */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: themeMeta.color }}>
              {currentClip.emoji} {currentClip.title}
            </p>
            <ClipPlayer
              src={currentClip.videoSrc}
              poster={currentClip.posterSrc}
              durationSec={currentClip.durationSec}
              themeColor={themeMeta.color}
            />
          </div>

          {/* Q + A */}
          <div className="space-y-3">
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${LAB7_HEX}40` }}
            >
              <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB7_HEX }}>
                Question · {currentQuestion.kind}
              </p>
              <p className="font-body text-sm text-white">{currentQuestion.text}</p>
            </div>
            <div
              className="rounded-lg p-3"
              style={{ background: `${LAB7_HEX}10`, border: `1px solid ${LAB7_HEX}40` }}
            >
              <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB7_HEX }}>
                AI&apos;s answer
              </p>
              <p className="font-body text-sm text-white/90 leading-relaxed">{displayedAnswer}</p>
            </div>

            {/* Post-rate explanation */}
            {hasRatedCurrent && lastRating && (
              <div
                className="rounded-lg p-3"
                style={{
                  background: lastRating.matched ? 'rgba(0,209,122,0.1)' : 'rgba(255,112,80,0.1)',
                  border: `1px solid ${lastRating.matched ? '#00D17A' : '#FF7050'}50`,
                }}
              >
                <p className="font-mono text-[10px] uppercase mb-1" style={{ color: lastRating.matched ? '#00D17A' : '#FF7050' }}>
                  {lastRating.matched ? '✓ Match' : '✗ Mismatch'} · truth: {currentQuestion.truth}
                </p>
                <p className="font-body text-xs text-white/85 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Action bar */}
      <Panel className="p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPhase('tutorial')}
          className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
        >
          ← Back
        </button>
        {!hasRatedCurrent ? (
          <div className="flex gap-2">
            <RatingButton label="Correct"     emoji="✅" color="#00D17A" onClick={() => rateAndScore('correct')} />
            <RatingButton label="Partial"     emoji="🤔" color="#D9A430" onClick={() => rateAndScore('partial')} />
            <RatingButton label="Hallucination" emoji="🚨" color="#FF7050" onClick={() => rateAndScore('hallucination')} />
          </div>
        ) : (
          <button
            type="button"
            onClick={nextQuestion}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB7_HEX, color: '#031416' }}
          >
            Next →
          </button>
        )}
      </Panel>
    </motion.div>
  );
}

function RatingButton({ label, emoji, color, onClick }: { label: string; emoji: string; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
      style={{
        background: `${color}25`,
        border: `1px solid ${color}80`,
        color: 'white',
      }}
      aria-label={`Rate as ${label}`}
    >
      {emoji} {label}
    </button>
  );
}

// ─── PHASE 9 — SENSE BUILDER ─────────────────────────────────────

function SenseBuilderPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const senseConfig = usePixelWitnessStore((s) => s.senseConfig);
  const toggleSense = usePixelWitnessStore((s) => s.toggleSense);
  const currentClip = usePixelWitnessStore((s) => s.currentClip);
  const currentQuestion = usePixelWitnessStore((s) => s.currentQuestion);
  const startMode = usePixelWitnessStore((s) => s.startMode);
  const getDisplayedAnswer = usePixelWitnessStore((s) => s.getDisplayedAnswer);
  const nextQuestion = usePixelWitnessStore((s) => s.nextQuestion);
  const setPhase = usePixelWitnessStore((s) => s.setPhase);

  useEffect(() => {
    if (!currentClip) startMode('sense-builder', ageBand);
  }, [currentClip, startMode, ageBand]);

  if (!currentClip || !currentQuestion) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-6 text-center">
          <p className="font-body text-sm text-white/65 mb-3">Loading…</p>
        </Panel>
      </div>
    );
  }

  const themeMeta = THEME_META[currentClip.theme];
  const cost = senseCost(senseConfig);
  const displayedAnswer = getDisplayedAnswer();

  return (
    <motion.div
      key="sense-builder"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-3 p-4"
    >
      <Panel className="p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: LAB7_HEX }}>
            Sense Builder
          </p>
          <p className="font-display text-sm font-bold text-white">
            Toggle senses. Watch the AI&apos;s answer change.
          </p>
        </div>
        <span
          className="font-mono text-xs font-bold px-2 py-0.5 rounded tabular-nums"
          style={{ background: cost > 30 ? '#FF705025' : `${LAB7_HEX}25`, color: cost > 30 ? '#FF7050' : LAB7_HEX }}
        >
          Cost: {cost}× tokens
        </span>
      </Panel>

      <Panel className="overflow-y-auto p-4 grid grid-rows-[auto_auto_1fr] gap-3">
        {/* Sense toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(senseConfig) as Array<keyof SenseConfig>).map((s) => {
            const meta = SENSE_META[s];
            const on = senseConfig[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSense(s)}
                className="text-left rounded-lg p-3 transition-all hover:scale-[1.02]"
                style={{
                  background: on ? `${LAB7_HEX}25` : 'rgba(0,0,0,0.45)',
                  border: `1px solid ${on ? LAB7_HEX : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: on ? `0 0 8px ${LAB7_HEX}40` : undefined,
                }}
                aria-pressed={on}
                aria-label={`${meta.label} ${on ? 'on' : 'off'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base" aria-hidden="true">{meta.emoji}</span>
                  <span className="font-display text-sm font-bold text-white flex-1">{meta.label}</span>
                  <span className="font-mono text-[9px] text-white/55">{meta.costMultiplier}×</span>
                </div>
                <p className="font-body text-[10px] text-white/65 leading-snug">{meta.hint}</p>
              </button>
            );
          })}
        </div>

        {/* Clip + AI answer */}
        <div className="grid sm:grid-cols-[1fr_1.2fr] gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: themeMeta.color }}>
              {currentClip.emoji} {currentClip.title}
            </p>
            <ClipPlayer
              src={currentClip.videoSrc}
              poster={currentClip.posterSrc}
              durationSec={currentClip.durationSec}
              themeColor={themeMeta.color}
            />
          </div>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${LAB7_HEX}40` }}>
              <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB7_HEX }}>
                Question
              </p>
              <p className="font-body text-sm text-white">{currentQuestion.text}</p>
              <p className="font-mono text-[10px] text-white/45 mt-1">
                Needs at least: {currentQuestion.minimumSense}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: `${LAB7_HEX}10`, border: `1px solid ${LAB7_HEX}40` }}>
              <p className="font-mono text-[10px] uppercase mb-1" style={{ color: LAB7_HEX }}>
                AI&apos;s answer with current senses
              </p>
              <p className="font-body text-sm text-white/90 leading-relaxed">{displayedAnswer}</p>
            </div>
          </div>
        </div>

        <div />
      </Panel>

      <Panel className="p-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPhase('tutorial')}
          className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={nextQuestion}
          className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
          style={{ background: LAB7_HEX, color: '#031416' }}
        >
          Next ▶
        </button>
      </Panel>
    </motion.div>
  );
}

// ─── PHASE 10 — CREATIVE SANDBOX (gated, optional) ───────────────

function CreativeSandboxPhase() {
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  return (
    <motion.div
      key="creative-sandbox"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-md w-full p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB7_HEX }}>
          Creative sandbox
        </p>
        <h2 className="font-display text-xl font-bold text-white mb-2">
          Image generation — gated
        </h2>
        <p className="font-body text-sm text-white/75 mb-5 leading-relaxed">
          The image-generation sandbox uses external models (Imagen / Flux) with strict kid-safe
          prompt filtering. Per Doc 2 §G.11 it&apos;s available only when the upstream gateway is
          configured. For now: skip ahead to the report.
        </p>
        <button
          type="button"
          onClick={() => setPhase('report')}
          className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
          style={{ background: LAB7_HEX, color: '#031416' }}
        >
          See report →
        </button>
      </Panel>
    </motion.div>
  );
}

// ─── PHASE 11 — REPORT ───────────────────────────────────────────

function ReportPhase() {
  const ratings = usePixelWitnessStore((s) => s.ratings);
  const getGrade = usePixelWitnessStore((s) => s.getGrade);
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  const reset = usePixelWitnessStore((s) => s.reset);
  const completeGame = useGameStore((s) => s.completeGame);

  const grade = useMemo(() => getGrade(), [getGrade]);

  useEffect(() => {
    completeGame();
  }, [completeGame]);

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-md w-full p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB7_HEX }}>
          Witness report
        </p>
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.15 }}
              className="text-5xl"
              style={{ color: i < grade.stars ? '#FFD93D' : 'rgba(255,255,255,0.15)' }}
              aria-hidden="true"
            >
              ★
            </motion.span>
          ))}
        </div>
        <p className="font-display text-3xl font-bold text-white mb-1" aria-live="polite">
          {grade.stars} / 3 stars
        </p>
        <p className="font-mono text-xs text-white/60 mb-5">
          Accuracy {Math.round(grade.accuracy * 100)}% · {grade.matched}/{ratings.length} matched
        </p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <ReportStat label="Caught" value={grade.hallucinationsCaught} color="#00D17A" />
          <ReportStat label="Missed" value={grade.hallucinationsMissed} color="#FF7050" />
          <ReportStat label="False alarms" value={grade.falseAlarms} color="#D9A430" />
        </div>
        <p className="font-body text-xs text-white/65 mb-5 italic">{grade.summary}</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              setPhase('tutorial');
            }}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB7_HEX, color: '#031416' }}
          >
            Play again
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

function ReportStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${color}40` }}>
      <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5" style={{ color }}>{label}</p>
      <p className="font-display text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN — Phase router + GameShell wrapper
// ═══════════════════════════════════════════════════════════════

const TOTAL_ROUNDS = 4;

export function PixelWitnessGame() {
  const phase = usePixelWitnessStore((s) => s.phase);
  const reset = usePixelWitnessStore((s) => s.reset);
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band ?? 'B') as 'A' | 'B' | 'C';

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  // No-op memo to silence unused-import lint until 11C.7b consumers land.
  void useMemo(() => ageBand, [ageBand]);

  return (
    <GameShell
      gameId="pixel-witness"
      title="Pixel Witness"
      worldNumber={7}
      worldColor={LAB7_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <PixelWitnessEnvironment />
        <PixelWitness3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-modal' && <LearnModalPhase key="learn-modal" />}
        {phase === 'learn-fusion' && <LearnFusionPhase key="learn-fusion" />}
        {phase === 'learn-hallucinate' && <LearnHallucinatePhase key="learn-hallucinate" />}
        {phase === 'tutorial' && <TutorialPhase key="tutorial" ageBand={ageBand} />}
        {phase === 'watch-A' && <WatchModeUI key="watch-A" ageBand={ageBand} mode="watch-A" modeLabel="Watch · band A" />}
        {phase === 'watch-B' && <WatchModeUI key="watch-B" ageBand={ageBand} mode="watch-B" modeLabel="Watch · band B" />}
        {phase === 'watch-C' && <WatchModeUI key="watch-C" ageBand={ageBand} mode="watch-C" modeLabel="Watch · band C" />}
        {phase === 'hallucination-hunt' && <WatchModeUI key="hallucination-hunt" ageBand={ageBand} mode="hallucination-hunt" modeLabel="Hallucination Hunt · boss" />}
        {phase === 'sense-builder' && <SenseBuilderPhase key="sense-builder" ageBand={ageBand} />}
        {phase === 'creative-sandbox' && <CreativeSandboxPhase key="creative-sandbox" />}
        {phase === 'report' && <ReportPhase key="report" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default PixelWitnessGame;

export const _LAB7_HEX = LAB7_HEX;
