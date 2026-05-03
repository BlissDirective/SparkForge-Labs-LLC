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
// PHASES 7-11 — Mode play UI (shared layout across 5 modes)
// ═══════════════════════════════════════════════════════════════

import { useGameStore } from '@/stores/gameStore';
import { getCard } from '@/lib/contextarch/cardLibrary';
import type { ContextMode } from '@/types/contextArchitect';

interface PlayModeUIProps {
  ageBand: 'A' | 'B' | 'C';
  mode: ContextMode;
  modeLabel: string;
  /** Phase to return to via 'change mode' button. */
  modeChangePhase: 'sort-mode' | 'budget-mode' | 'multi-turn-mode' | 'rot-boss' | 'design-shelf';
}

function PlayModeUI({ ageBand, mode, modeLabel }: PlayModeUIProps) {
  const shelf = useContextArchitectStore((s) => s.shelf);
  const external = useContextArchitectStore((s) => s.external);
  const used = useContextArchitectStore((s) => s.used);
  const budget = useContextArchitectStore((s) => s.budget);
  const rot = useContextArchitectStore((s) => s.rot);
  const accuracy = useContextArchitectStore((s) => s.accuracy);
  const turn = useContextArchitectStore((s) => s.turn);
  const turnsThisSession = useContextArchitectStore((s) => s.turnsThisSession);
  const currentQuestion = useContextArchitectStore((s) => s.currentQuestion);
  const lastError = useContextArchitectStore((s) => s.lastError);
  const placeCard = useContextArchitectStore((s) => s.placeCard);
  const offloadCard = useContextArchitectStore((s) => s.offloadCard);
  const retrieveCard = useContextArchitectStore((s) => s.retrieveCard);
  const isolateCard = useContextArchitectStore((s) => s.isolateCard);
  const reduceCard = useContextArchitectStore((s) => s.reduceCard);
  const removeCard = useContextArchitectStore((s) => s.removeCard);
  const answerCurrentQuestion = useContextArchitectStore((s) => s.answerCurrentQuestion);
  const nextQuestion = useContextArchitectStore((s) => s.nextQuestion);
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const updateScore = useGameStore((s) => s.updateScore);
  const advanceRound = useGameStore((s) => s.advanceRound);

  const allCards = useMemo(() => cardsForBand(ageBand), [ageBand]);
  const onShelf = useMemo(() => new Set(shelf.map((p) => p.cardId)), [shelf]);
  const inExternal = useMemo(() => new Set(external.map((p) => p.cardId)), [external]);

  const overBudget = budget > 0 && used > budget;
  const enforceBudget = mode === 'budget' || mode === 'multi-turn' || mode === 'rot-boss';

  function answerAndAdvance() {
    answerCurrentQuestion();
    updateScore(Math.round(accuracy * 100));
    advanceRound();
    // For multi-turn / rot-boss, stay in mode and advance to next question.
    // For sort/budget, push to report after 3 turns.
    const shouldReport =
      (mode === 'sort' && turnsThisSession.length >= 2) ||
      (mode === 'budget' && turnsThisSession.length >= 2) ||
      (mode === 'rot-boss' && turnsThisSession.length >= 4);
    if (shouldReport) {
      setPhase('report');
    } else {
      nextQuestion(ageBand);
    }
  }

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-3 p-4"
    >
      {/* Top status bar */}
      <Panel className="p-3 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: LAB8_HEX }}>
            {modeLabel} · turn {turn + 1}
          </p>
          {currentQuestion && (
            <p className="font-display text-sm font-bold text-white truncate">
              {currentQuestion.text}
            </p>
          )}
        </div>
        <Stat label="Tokens" value={`${used}/${budget}`} color={overBudget ? '#FF7050' : LAB8_HEX} />
        <Stat label="Rot" value={`${Math.round(rot * 100)}%`} color={rot > 0.5 ? '#FF7050' : '#D9A430'} />
        <Stat label="Accuracy" value={`${Math.round(accuracy * 100)}%`} color={accuracy >= 0.7 ? '#00D17A' : '#D9A430'} />
      </Panel>

      {/* Middle: shelf + external + deck */}
      <Panel className="overflow-y-auto p-4 grid grid-rows-[auto_auto_1fr] gap-3">
        {lastError && (
          <p className="font-mono text-[11px] text-[#FF7050]">{lastError}</p>
        )}
        {currentQuestion?.hint && shelf.length === 0 && (
          <p className="font-body text-[11px] text-white/60 italic">💡 Hint: {currentQuestion.hint}</p>
        )}

        {/* Shelf row */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB8_HEX }}>
            On the shelf · {shelf.length} card{shelf.length === 1 ? '' : 's'}
          </p>
          {shelf.length === 0 ? (
            <p className="font-body text-xs text-white/50 italic">
              Click cards in the deck below to place them on the shelf.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {shelf.map((p) => {
                const card = getCard(p.cardId);
                if (!card) return null;
                const meta = THEME_META[card.theme];
                const isKey = currentQuestion?.keyCardIds.includes(p.cardId) ?? false;
                const isDecoy = currentQuestion?.decoyCardIds.includes(p.cardId) ?? false;
                return (
                  <ShelfCardChip
                    key={p.cardId}
                    title={card.title}
                    emoji={card.emoji}
                    color={meta.color}
                    isKey={isKey}
                    isDecoy={isDecoy}
                    isReduced={p.reduced}
                    isIsolated={p.isolated}
                    onOffload={() => offloadCard(p.cardId)}
                    onIsolate={() => isolateCard(p.cardId)}
                    onReduce={() => reduceCard(p.cardId)}
                    onRemove={() => removeCard(p.cardId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* External memory */}
        {external.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-2 text-white/55">
              External memory · {external.length} offloaded
            </p>
            <div className="flex flex-wrap gap-2">
              {external.map((p) => {
                const card = getCard(p.cardId);
                if (!card) return null;
                const meta = THEME_META[card.theme];
                return (
                  <button
                    key={p.cardId}
                    type="button"
                    onClick={() => retrieveCard(p.cardId)}
                    className="px-2 py-1 rounded font-mono text-[10px] transition-all hover:scale-[1.04]"
                    style={{ background: `${meta.color}15`, border: `1px dashed ${meta.color}50`, color: 'white' }}
                    aria-label={`Retrieve ${card.title} (costs 1 turn)`}
                  >
                    {card.emoji} {card.title} · retrieve (1 turn)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Deck */}
        <div className="overflow-y-auto">
          <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: LAB8_HEX }}>
            Card deck · click to place
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allCards.map((card) => {
              const placed = onShelf.has(card.id);
              const offloaded = inExternal.has(card.id);
              const meta = THEME_META[card.theme];
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => placeCard(card.id)}
                  disabled={placed || offloaded}
                  className="text-left rounded-lg p-2.5 transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: placed ? `${meta.color}10` : 'rgba(0,0,0,0.4)',
                    border: `1px solid ${meta.color}40`,
                  }}
                  aria-label={`Place ${card.title} on shelf (${card.tokens} tokens)`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span aria-hidden="true">{card.emoji}</span>
                    <span className="font-display text-xs font-bold text-white flex-1">{card.title}</span>
                    <span className="font-mono text-[9px]" style={{ color: meta.color }}>{card.tokens}t</span>
                  </div>
                  <p className="font-body text-[10px] text-white/60 leading-snug line-clamp-2">{card.text}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Bottom: action bar */}
      <Panel className="p-3 flex justify-between items-center gap-2">
        <button
          type="button"
          onClick={() => setPhase('tutorial')}
          className="px-3 py-1.5 rounded font-mono text-xs text-white/70 border border-white/20 hover:text-white"
        >
          ← Back
        </button>
        <p className="font-mono text-[11px] text-white/55">
          {turnsThisSession.length} turn{turnsThisSession.length === 1 ? '' : 's'} answered
          {enforceBudget && overBudget && (
            <span className="ml-2 text-[#FF7050]">· budget exceeded</span>
          )}
        </p>
        <button
          type="button"
          onClick={answerAndAdvance}
          disabled={!currentQuestion || (enforceBudget && overBudget)}
          className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: LAB8_HEX, color: '#031416' }}
          aria-label="Answer this question with current shelf"
        >
          Answer ▶
        </button>
      </Panel>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg px-2.5 py-1.5 text-center min-w-[5rem]"
      style={{ background: 'rgba(0,0,0,0.55)', border: `1px solid ${color}40` }}
    >
      <p className="font-mono text-[8px] uppercase tracking-widest mb-0.5" style={{ color }}>
        {label}
      </p>
      <p className="font-display text-sm font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

interface ShelfCardChipProps {
  title: string;
  emoji: string;
  color: string;
  isKey: boolean;
  isDecoy: boolean;
  isReduced: boolean;
  isIsolated: boolean;
  onOffload: () => void;
  onIsolate: () => void;
  onReduce: () => void;
  onRemove: () => void;
}

function ShelfCardChip({
  title, emoji, color, isKey, isDecoy, isReduced, isIsolated,
  onOffload, onIsolate, onReduce, onRemove,
}: ShelfCardChipProps) {
  const ring = isKey ? color : isDecoy ? '#FF7050' : 'rgba(255,255,255,0.2)';
  return (
    <div
      className="rounded-lg p-2 min-w-[180px]"
      style={{
        background: isIsolated ? 'rgba(0,0,0,0.3)' : `${color}15`,
        border: `1px solid ${ring}`,
        boxShadow: isKey ? `0 0 8px ${color}40` : undefined,
        opacity: isIsolated ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span aria-hidden="true">{emoji}</span>
        <span className="font-display text-xs font-bold text-white flex-1 truncate">{title}</span>
        {isReduced && (
          <span className="font-mono text-[8px] uppercase px-1 rounded" style={{ background: '#D9A430', color: '#031416' }}>
            ½
          </span>
        )}
        {isIsolated && (
          <span className="font-mono text-[8px] uppercase px-1 rounded text-white/60 border border-white/20">
            iso
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onOffload}
          className="flex-1 px-1 py-0.5 rounded font-mono text-[9px] text-white/85 hover:bg-white/10 border border-white/15"
          aria-label="Offload card"
          title={MOVE_META.offload.hint}
        >
          {MOVE_META.offload.emoji}
        </button>
        <button
          type="button"
          onClick={onIsolate}
          disabled={isIsolated}
          className="flex-1 px-1 py-0.5 rounded font-mono text-[9px] text-white/85 hover:bg-white/10 border border-white/15 disabled:opacity-40"
          aria-label="Isolate card"
          title={MOVE_META.isolate.hint}
        >
          {MOVE_META.isolate.emoji}
        </button>
        <button
          type="button"
          onClick={onReduce}
          disabled={isReduced}
          className="flex-1 px-1 py-0.5 rounded font-mono text-[9px] text-white/85 hover:bg-white/10 border border-white/15 disabled:opacity-40"
          aria-label="Reduce card"
          title={MOVE_META.reduce.hint}
        >
          {MOVE_META.reduce.emoji}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex-1 px-1 py-0.5 rounded font-mono text-[9px] text-white/85 hover:bg-white/10 border border-white/15"
          aria-label="Remove card from shelf"
          title="Remove from shelf entirely"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PHASE 12 — REPORT (session grade)
// ═══════════════════════════════════════════════════════════════

function ReportPhase() {
  const turnsThisSession = useContextArchitectStore((s) => s.turnsThisSession);
  const bestScore = useContextArchitectStore((s) => s.bestScore);
  const setPhase = useContextArchitectStore((s) => s.setPhase);
  const reset = useContextArchitectStore((s) => s.reset);
  const completeGame = useGameStore((s) => s.completeGame);

  // Compute grade locally from turns; computeGrade is in budgetEngine.
  const grade = useMemo(() => {
    if (turnsThisSession.length === 0) return null;
    const correct = turnsThisSession.filter((t) => t.accuracy >= 0.7).length;
    const meanAcc = turnsThisSession.reduce((s, t) => s + t.accuracy, 0) / turnsThisSession.length;
    const meanRot = turnsThisSession.reduce((s, t) => s + t.rotAtAnswer, 0) / turnsThisSession.length;
    const stars: 0 | 1 | 2 | 3 =
      meanAcc >= 0.85 ? 3 : meanAcc >= 0.65 ? 2 : meanAcc >= 0.4 ? 1 : 0;
    return { correct, meanAcc, meanRot, stars };
  }, [turnsThisSession]);

  useEffect(() => {
    completeGame();
  }, [completeGame]);

  if (!grade) {
    return (
      <div className="absolute inset-0 grid place-items-center p-8">
        <Panel className="p-4 text-center">
          <p className="font-body text-sm text-white/60">No turns played yet.</p>
        </Panel>
      </div>
    );
  }

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
        <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: LAB8_HEX }}>
          Session report
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
          Accuracy {Math.round(grade.meanAcc * 100)}% · Rot {Math.round(grade.meanRot * 100)}% · {grade.correct}/{turnsThisSession.length} correct
        </p>
        <p className="font-mono text-[11px] text-white/55 mb-5">
          Personal best: <strong className="text-white">{bestScore}</strong>
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              reset();
              setPhase('tutorial');
            }}
            className="px-5 py-2 rounded font-mono text-xs font-bold transition-transform hover:scale-105"
            style={{ background: LAB8_HEX, color: '#031416' }}
          >
            Play again
          </button>
        </div>
      </Panel>
    </motion.div>
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
        {phase === 'sort-mode' && <PlayModeUI key="sort-mode" ageBand={ageBand} mode="sort" modeLabel="Sort mode" modeChangePhase="sort-mode" />}
        {phase === 'budget-mode' && <PlayModeUI key="budget-mode" ageBand={ageBand} mode="budget" modeLabel="Budget mode" modeChangePhase="budget-mode" />}
        {phase === 'multi-turn-mode' && <PlayModeUI key="multi-turn-mode" ageBand={ageBand} mode="multi-turn" modeLabel="Multi-turn mode" modeChangePhase="multi-turn-mode" />}
        {phase === 'rot-boss' && <PlayModeUI key="rot-boss" ageBand={ageBand} mode="rot-boss" modeLabel="Rot boss" modeChangePhase="rot-boss" />}
        {phase === 'design-shelf' && <PlayModeUI key="design-shelf" ageBand={ageBand} mode="design-shelf" modeLabel="Design shelf" modeChangePhase="design-shelf" />}
        {phase === 'report' && <ReportPhase key="report" />}
      </AnimatePresence>
    </GameShell>
  );
}

export default ContextArchitectGame;

export const _LAB8_HEX = LAB8_HEX;
