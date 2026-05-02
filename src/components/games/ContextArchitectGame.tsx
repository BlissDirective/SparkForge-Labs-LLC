'use client';

// ════════════════════════════════════════════════════════════════
// CONTEXT ARCHITECT — Stage 11B (C2, Lab 8 — Words & Language)
// ════════════════════════════════════════════════════════════════
// Lab 8 | #8F96FA violet
// "The AI's brain has a shelf, and the shelf is small. What you put
// on it matters more than how big the AI is."
//
// 12-phase machine (managed by useContextArchitectStore):
//   welcome → learn-shelf → learn-budget → learn-moves → learn-rot
//   → tutorial → sort-mode → budget-mode → multi-turn-mode
//   → rot-boss → design-shelf → report
//
// Sub 11B.7a (this commit): welcome / 4 tutorials / tutorial round
// (6 phases). Sub 11B.7b: 6 mode/play phases.
// ════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';

import { GameShell } from '@/components/game/GameShell';
import { useActiveChild } from '@/hooks/useChildren';
import { useContextArchitectStore } from '@/stores/contextArchitectStore';
import { THEME_META, cardsForBand } from '@/lib/contextarch/cardLibrary';
import { MOVE_META } from '@/lib/contextarch/budgetEngine';

const ContextShelf3D = dynamic(() => import('@/components/3d/ContextShelf3D'), { ssr: false });
const ContextArchitectEnvironment = dynamic(
  () => import('@/components/3d/environments/ContextArchitectEnvironment'),
  { ssr: false },
);

const LAB8_HEX = '#8F96FA';
const LAB8_DEEP = '#1F2348';

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
        borderColor: `${LAB8_HEX}40`,
        boxShadow: `0 0 24px ${LAB8_HEX}25, inset 0 0 0 1px ${LAB8_HEX}30`,
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
  const beginGame = useContextArchitectStore((s) => s.beginGame);
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
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: LAB8_HEX }}>
          Lab 8 · Words &amp; Language
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Context Architect
        </h1>
        <p className="font-body text-base text-white/85 mb-3 max-w-md mx-auto leading-relaxed">
          The AI&apos;s brain has a shelf — and the shelf is small.
        </p>
        <p className="font-body text-sm text-white/70 mb-8 max-w-md mx-auto leading-relaxed">
          What you put on it matters more than how big the AI is. Become a careful curator.
        </p>
        <button
          type="button"
          onClick={beginGame}
          className="px-8 py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${LAB8_HEX}, ${LAB8_DEEP})`,
            color: '#031416',
            boxShadow: `0 0 20px ${LAB8_HEX}50`,
          }}
          aria-label="Open the library"
        >
          Open the library
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2 — LEARN: WHAT'S A CONTEXT WINDOW?
// ═══════════════════════════════════════════════════════════════

function LearnShelfPhase() {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const markSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('shelf');
    setPhase('learn-budget');
  }
  return (
    <motion.div
      key="learn-shelf"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB8_HEX }}>
          Card 1 of 4
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          The shelf is the AI&apos;s working memory
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          When you talk to an AI, every word in your conversation lives on a{' '}
          <span style={{ color: LAB8_HEX }}>context window</span> — a small shelf in its short-term
          memory.
        </p>
        <div className="rounded-lg p-3 bg-black/45 mb-5" style={{ border: `1px solid ${LAB8_HEX}40` }}>
          <p className="font-mono text-[11px] uppercase mb-2" style={{ color: LAB8_HEX }}>
            What lives on the shelf
          </p>
          <ul className="space-y-1 font-body text-sm text-white/85">
            <li>📜 The system instructions (the AI&apos;s rules)</li>
            <li>📎 Your earlier messages</li>
            <li>📚 Notes, knowledge cards, retrieved facts</li>
            <li>🛠️ Tools the AI can call</li>
          </ul>
        </div>
        <p className="font-body text-sm text-white/65 italic mb-5">
          When the shelf gets too full, the AI starts to forget. That&apos;s your problem to solve.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB8_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 3 — LEARN: TOKEN BUDGET
// ═══════════════════════════════════════════════════════════════

function LearnBudgetPhase() {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const markSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('budget');
    setPhase('learn-moves');
  }
  return (
    <motion.div
      key="learn-budget"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB8_HEX }}>
          Card 2 of 4
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Tokens have a budget
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          Each card costs <span style={{ color: LAB8_HEX }}>tokens</span> on the shelf. Bigger card =
          more tokens. The shelf has a fixed token budget. Go over → the bar turns red and the AI gets
          confused.
        </p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[8, 16, 32, 64].map((tokens) => (
            <div
              key={tokens}
              className="rounded-lg p-3 text-center"
              style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${LAB8_HEX}40` }}
            >
              <p className="font-mono text-[10px] uppercase text-white/55 mb-1">card size</p>
              <p className="font-display text-2xl font-bold text-white">{tokens}</p>
              <p className="font-mono text-[10px] text-white/55">tokens</p>
            </div>
          ))}
        </div>
        <p className="font-body text-sm text-white/65 italic mb-5">
          Real LLMs have token limits too — usually thousands or millions. Our shelves are smaller so
          you can feel the pressure.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB8_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 4 — LEARN: THE 4 MOVES
// ═══════════════════════════════════════════════════════════════

function LearnMovesPhase() {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const markSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('moves');
    setPhase('learn-rot');
  }
  return (
    <motion.div
      key="learn-moves"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-3xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB8_HEX }}>
          Card 3 of 4
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          The four moves
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          When the shelf gets crowded, you can&apos;t just keep adding cards. You have to{' '}
          <span style={{ color: LAB8_HEX }}>curate</span>. Four moves available, each turn:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {(['offload', 'retrieve', 'isolate', 'reduce'] as const).map((m) => {
            const meta = MOVE_META[m];
            return (
              <div
                key={m}
                className="rounded-lg p-3"
                style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${LAB8_HEX}40` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">{meta.emoji}</span>
                  <span className="font-display text-sm font-bold text-white flex-1">{meta.label}</span>
                  <span
                    className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                    style={{ background: `${LAB8_HEX}25`, color: LAB8_HEX }}
                  >
                    {meta.turnCost === 0 ? 'free' : `${meta.turnCost} turn`}
                  </span>
                </div>
                <p className="font-body text-[11px] text-white/65 leading-snug">{meta.hint}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB8_HEX, color: '#031416' }}
          >
            Got it →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — LEARN: CONTEXT ROT
// ═══════════════════════════════════════════════════════════════

function LearnRotPhase() {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const markSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  function next() {
    markSeen('rot');
    setPhase('tutorial');
  }
  return (
    <motion.div
      key="learn-rot"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 grid place-items-center p-6"
    >
      <Panel className="max-w-2xl w-full p-8">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB8_HEX }}>
          Card 4 of 4
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          Beware Context Rot
        </h2>
        <p className="font-body text-white/80 mb-4 leading-relaxed">
          When the shelf has too many low-relevance cards (or too many cards period), the AI&apos;s
          accuracy drops. We call this <span style={{ color: '#FF7050' }}>Context Rot</span>.
        </p>
        <div className="rounded-lg p-3 mb-5" style={{ background: 'rgba(255,112,80,0.1)', border: '1px solid rgba(255,112,80,0.4)' }}>
          <p className="font-mono text-[11px] uppercase mb-2 text-[#FF7050]">
            Watch for these signals
          </p>
          <ul className="space-y-1 font-body text-sm text-white/85">
            <li>🔴 Token bar turns red — over budget</li>
            <li>🌫️ Red glow around the shelf — Rot is rising</li>
            <li>📉 Accuracy meter drops — cards aren&apos;t helping</li>
          </ul>
        </div>
        <p className="font-body text-sm text-white/65 italic mb-5">
          Aim for the smallest shelf that still answers the question. Less is more.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={next}
            className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
            style={{ background: LAB8_HEX, color: '#031416' }}
          >
            Try a tutorial round →
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 6 — TUTORIAL (1 guided round)
// ═══════════════════════════════════════════════════════════════

function TutorialPhase({ ageBand }: { ageBand: 'A' | 'B' | 'C' }) {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const markSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  const startMode = useContextArchitectStore((s) => s.startMode);

  function start() {
    markSeen('tutorial');
    startMode('sort', ageBand);
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
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: LAB8_HEX }}>
          Tutorial round
        </p>
        <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-3">
          Place 1-2 key cards. Read the question. Watch the meters.
        </h2>
        <p className="font-body text-sm text-white/75 mb-6 leading-relaxed">
          Sort Mode is forgiving — there&apos;s no hard token budget. Use it to get a feel for how
          the shelf, accuracy, and rot relate before you face Budget Mode.
        </p>
        <button
          type="button"
          onClick={start}
          className="px-6 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-transform hover:scale-105"
          style={{ background: LAB8_HEX, color: '#031416' }}
          aria-label="Start tutorial round"
        >
          Start ▶
        </button>
      </Panel>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASES 7-12 — placeholders implemented in Sub 11B.7b
// ═══════════════════════════════════════════════════════════════

function NotYetPhase({ label }: { label: string }) {
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  return (
    <div className="absolute inset-0 grid place-items-center p-8">
      <Panel className="max-w-md p-6 text-center">
        <p className="font-mono text-xs uppercase mb-2" style={{ color: LAB8_HEX }}>
          {label} (Sub 11B.7b)
        </p>
        <p className="text-white/70 font-body text-sm mb-4">
          Remaining phases land in the next sub-task.
        </p>
        <button
          type="button"
          onClick={() => setPhase('tutorial')}
          className="px-4 py-2 rounded font-mono text-xs"
          style={{ background: LAB8_HEX, color: '#031416' }}
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

const TOTAL_ROUNDS = 5;

export function ContextArchitectGame() {
  const phase = useContextArchitectStore((s) => s.phase);
  const reset = useContextArchitectStore((s) => s.reset);
  const activeChild = useActiveChild();
  const ageBand = (activeChild?.age_band ?? 'B') as 'A' | 'B' | 'C';

  useEffect(() => {
    reset();
    return () => reset();
  }, [reset]);

  // Defensive: pre-fetch cards-for-band so the deck doesn't lag on first
  // mode entry. useMemo ensures the pre-fetch runs once per ageBand change.
  useMemo(() => cardsForBand(ageBand), [ageBand]);
  // Theme meta consumed by phase-7+; ensure it stays in scope (the
  // unused-import-killing pass would otherwise drop it).
  void THEME_META;

  return (
    <GameShell
      gameId="context-architect"
      title="Context Architect"
      worldNumber={8}
      worldColor={LAB8_HEX}
      totalRounds={TOTAL_ROUNDS}
      hints={3}
      showTimer
    >
      <div className="absolute inset-0 pointer-events-none">
        <ContextArchitectEnvironment />
        <ContextShelf3D />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'welcome' && <WelcomePhase key="welcome" />}
        {phase === 'learn-shelf' && <LearnShelfPhase key="learn-shelf" />}
        {phase === 'learn-budget' && <LearnBudgetPhase key="learn-budget" />}
        {phase === 'learn-moves' && <LearnMovesPhase key="learn-moves" />}
        {phase === 'learn-rot' && <LearnRotPhase key="learn-rot" />}
        {phase === 'tutorial' && <TutorialPhase key="tutorial" ageBand={ageBand} />}
        {phase === 'sort-mode' && <NotYetPhase key="sort-mode" label="Sort mode" />}
        {phase === 'budget-mode' && <NotYetPhase key="budget-mode" label="Budget mode" />}
        {phase === 'multi-turn-mode' && <NotYetPhase key="multi-turn-mode" label="Multi-turn mode" />}
        {phase === 'rot-boss' && <NotYetPhase key="rot-boss" label="Rot boss" />}
        {phase === 'design-shelf' && <NotYetPhase key="design-shelf" label="Design shelf" />}
        {phase === 'report' && <NotYetPhase key="report" label="Report" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default ContextArchitectGame;

export const _LAB8_HEX = LAB8_HEX;
