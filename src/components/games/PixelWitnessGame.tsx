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
// PHASES 6-12 — placeholders implemented in Sub 11C.7b
// ═══════════════════════════════════════════════════════════════

function NotYetPhase({ label }: { label: string }) {
  const setPhase = usePixelWitnessStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB7_HEX }}>
          {label} (Sub 11C.7b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase('tutorial')}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB7_HEX, color: '#031416' }}
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
        {phase === 'watch-A' && <NotYetPhase key="watch-A" label="Watch-A mode" />}
        {phase === 'watch-B' && <NotYetPhase key="watch-B" label="Watch-B mode" />}
        {phase === 'watch-C' && <NotYetPhase key="watch-C" label="Watch-C mode" />}
        {phase === 'hallucination-hunt' && <NotYetPhase key="hallucination-hunt" label="Hallucination Hunt" />}
        {phase === 'sense-builder' && <NotYetPhase key="sense-builder" label="Sense Builder" />}
        {phase === 'creative-sandbox' && <NotYetPhase key="creative-sandbox" label="Creative Sandbox" />}
        {phase === 'report' && <NotYetPhase key="report" label="Report" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default PixelWitnessGame;

export const _LAB7_HEX = LAB7_HEX;
