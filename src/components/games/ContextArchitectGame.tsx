// ════════════════════════════════════════════════════════════════════════
// CONTEXT ARCHITECT — Lab 8 Flagship (real engine wiring)
// ════════════════════════════════════════════════════════════════════════
// The child is the Context Architect: they manage an AI's limited "memory
// shelf" (its context window). Place knowledge cards, but keep the shelf
// clean — Offload cards to external memory, Retrieve them back, Isolate
// them from the next agent, or Reduce them to summaries. A crowded shelf
// full of the wrong cards breeds Context Rot, which drags the AI's answers
// down. Beat Rot across four challenges to master context engineering.
//
// This component is pure UI. ALL game logic lives in
// `useContextArchitectStore` + `@/lib/contextarch/*` (budget engine,
// card + question libraries). We only drive the phase machine and render.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import {
  useContextArchitectStore,
  type ContextArchitectPhase,
} from '@/stores/contextArchitectStore';
import type { ContextMode, ConversationTurn } from '@/types/contextArchitect';
import {
  getCard,
  cardsForBand,
  THEME_META,
  reducedTokensFor,
} from '@/lib/contextarch/cardLibrary';
import {
  MOVE_META,
  computeGrade,
  effectiveTokens,
} from '@/lib/contextarch/budgetEngine';

const LAB_COLOR = '#8F96FA';
const ROUNDS_PER_MODE = 2;
const MODE_SEQUENCE: ContextMode[] = ['sort', 'budget', 'multi-turn', 'rot-boss'];

const PHASE_TO_MODE: Partial<Record<ContextArchitectPhase, ContextMode>> = {
  'sort-mode': 'sort',
  'budget-mode': 'budget',
  'multi-turn-mode': 'multi-turn',
  'rot-boss': 'rot-boss',
  'design-shelf': 'design-shelf',
};

const MODE_INFO: Record<ContextMode, { name: string; emoji: string; blurb: string }> = {
  sort: {
    name: 'Sort the Shelf',
    emoji: '🗂️',
    blurb: 'No budget pressure yet — just place the cards that answer the question and leave the rest off.',
  },
  budget: {
    name: 'Tight Budget',
    emoji: '💰',
    blurb: 'The shelf is small now. Reduce or Offload cards so you never spill over the token budget.',
  },
  'multi-turn': {
    name: 'Rolling Memory',
    emoji: '💬',
    blurb: 'Old cards stay on the shelf across questions. Clean up what you no longer need.',
  },
  'rot-boss': {
    name: 'Rot Boss',
    emoji: '👑',
    blurb: 'The hardest questions and a budget that shrinks every round. Keep the shelf razor-sharp.',
  },
  'design-shelf': {
    name: 'Free Build',
    emoji: '🛠️',
    blurb: 'No pressure — experiment with the shelf and watch how Rot and accuracy react.',
  },
};

const LEARN_CARDS: Array<{
  key: 'shelf' | 'budget' | 'moves' | 'rot';
  phase: ContextArchitectPhase;
  emoji: string;
  title: string;
  body: string;
}> = [
  {
    key: 'shelf',
    phase: 'learn-shelf',
    emoji: '🧠',
    title: 'The Memory Shelf',
    body: "An AI can only 'see' what fits on its context shelf right now. You decide which knowledge cards go on the shelf so it can answer the question.",
  },
  {
    key: 'budget',
    phase: 'learn-budget',
    emoji: '💰',
    title: 'The Token Budget',
    body: 'Every card costs tokens. The shelf has a budget. Go over it and the AI starts dropping things. Keep the shelf light.',
  },
  {
    key: 'moves',
    phase: 'learn-moves',
    emoji: '🎛️',
    title: 'Your Four Moves',
    body: 'Offload a card to external memory, Retrieve it back later, Isolate it (hide it from the next agent), or Reduce it to a summary that costs half the tokens.',
  },
  {
    key: 'rot',
    phase: 'learn-rot',
    emoji: '🦠',
    title: 'Context Rot',
    body: 'A crowded shelf full of cards that do NOT help the question grows Rot — and Rot drags the answer down. The best shelf is the smallest one that still answers.',
  },
];

// ─── Small UI atoms ──────────────────────────────────────────────────────

function Meter({
  label,
  pct,
  valueText,
  color,
  danger,
}: {
  label: string;
  pct: number;
  valueText: string;
  color: string;
  danger?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueText}
    >
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white/90">{valueText}</span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden bg-white/10"
        style={{ height: 10 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: danger ? '#F87171' : color }}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        />
      </div>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-2 justify-center" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          style={{ fontSize: 40, opacity: n <= count ? 1 : 0.25 }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

// ─── Play view (the core interaction) ────────────────────────────────────

function PlayView({
  band,
  freePlay,
  progressLabel,
  onAnswerRecorded,
  onFinishFreePlay,
}: {
  band: 'A' | 'B' | 'C';
  freePlay: boolean;
  progressLabel: string;
  onAnswerRecorded: (turn: ConversationTurn) => void;
  onFinishFreePlay: () => void;
}) {
  const shelf = useContextArchitectStore((s) => s.shelf);
  const external = useContextArchitectStore((s) => s.external);
  const budget = useContextArchitectStore((s) => s.budget);
  const used = useContextArchitectStore((s) => s.used);
  const rot = useContextArchitectStore((s) => s.rot);
  const accuracy = useContextArchitectStore((s) => s.accuracy);
  const currentQuestion = useContextArchitectStore((s) => s.currentQuestion);
  const mode = useContextArchitectStore((s) => s.mode);
  const lastError = useContextArchitectStore((s) => s.lastError);

  const placeCard = useContextArchitectStore((s) => s.placeCard);
  const offloadCard = useContextArchitectStore((s) => s.offloadCard);
  const retrieveCard = useContextArchitectStore((s) => s.retrieveCard);
  const isolateCard = useContextArchitectStore((s) => s.isolateCard);
  const reduceCard = useContextArchitectStore((s) => s.reduceCard);
  const removeCard = useContextArchitectStore((s) => s.removeCard);
  const answerCurrentQuestion = useContextArchitectStore((s) => s.answerCurrentQuestion);

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    setShowHint(false);
  }, [currentQuestion?.id]);

  const info = MODE_INFO[mode];

  // Deck for this question: the key cards, the decoys, then a few extra
  // distractors from the child's band — a focused puzzle rather than all 48.
  const deckIds = useMemo(() => {
    if (!currentQuestion) return [] as string[];
    const ids: string[] = [];
    const add = (id: string) => {
      if (!ids.includes(id) && getCard(id)) ids.push(id);
    };
    currentQuestion.keyCardIds.forEach(add);
    currentQuestion.decoyCardIds.forEach(add);
    for (const c of cardsForBand(band)) {
      if (ids.length >= 9) break;
      add(c.id);
    }
    return ids.sort();
  }, [currentQuestion, band]);

  const placedIds = useMemo(
    () => new Set([...shelf.map((p) => p.cardId), ...external.map((p) => p.cardId)]),
    [shelf, external],
  );
  const availableIds = deckIds.filter((id) => !placedIds.has(id));

  const overBudget = used > budget;
  const capacityPct = budget > 0 ? (used / budget) * 100 : 0;

  const handleAnswer = useCallback(() => {
    answerCurrentQuestion();
    const turns = useContextArchitectStore.getState().turnsThisSession;
    const last = turns[turns.length - 1];
    if (last) onAnswerRecorded(last);
  }, [answerCurrentQuestion, onAnswerRecorded]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-full text-white/70">
        Preparing the shelf…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Mode header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" style={{ fontSize: 24 }}>{info.emoji}</span>
          <div>
            <div className="font-bold text-white">{info.name}</div>
            <div className="text-xs text-white/60">{progressLabel}</div>
          </div>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide"
          style={{ backgroundColor: `${LAB_COLOR}22`, color: LAB_COLOR }}
        >
          {currentQuestion.difficulty}
        </span>
      </div>

      {/* Question */}
      <div
        className="rounded-2xl p-5 border"
        style={{ borderColor: `${LAB_COLOR}55`, backgroundColor: `${LAB_COLOR}12` }}
      >
        <div className="text-xs uppercase tracking-wide text-white/60 mb-1">
          The AI is asked
        </div>
        <p className="text-lg font-semibold text-white">{currentQuestion.text}</p>
        {currentQuestion.hint && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="text-sm underline text-white/70 hover:text-white"
              aria-expanded={showHint}
            >
              {showHint ? 'Hide hint' : 'Need a hint?'}
            </button>
            {showHint && <p className="text-sm text-white/70 mt-1">💡 {currentQuestion.hint}</p>}
          </div>
        )}
      </div>

      {/* Live meters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl p-4 bg-white/5 border border-white/10">
        <Meter
          label="Shelf budget"
          pct={capacityPct}
          valueText={`${used} / ${budget} tokens`}
          color={LAB_COLOR}
          danger={overBudget}
        />
        <Meter
          label="Context Rot"
          pct={rot * 100}
          valueText={`${Math.round(rot * 100)}%`}
          color="#FBBF24"
          danger={rot >= 0.6}
        />
        <Meter
          label="Answer strength"
          pct={accuracy * 100}
          valueText={`${Math.round(accuracy * 100)}%`}
          color="#34D399"
        />
      </div>

      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="rounded-xl px-4 py-2 text-sm font-medium border"
            style={{ borderColor: '#F8717166', color: '#FCA5A5', backgroundColor: '#F871711a' }}
          >
            {lastError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The shelf */}
      <section aria-label="Context shelf" className="rounded-2xl p-4 bg-black/30 border border-white/10">
        <h3 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
          <span aria-hidden="true">📚</span> Memory Shelf
          <span className="text-white/50 font-normal">({shelf.length} on shelf)</span>
        </h3>
        {shelf.length === 0 ? (
          <p className="text-sm text-white/60 py-4 text-center">
            The shelf is empty. Add the cards that answer the question below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shelf.map((p) => {
              const card = getCard(p.cardId);
              if (!card) return null;
              const theme = THEME_META[card.theme];
              return (
                <li
                  key={p.cardId}
                  className="rounded-xl p-3 border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    borderColor: `${theme.color}55`,
                    backgroundColor: p.isolated ? 'rgba(255,255,255,0.03)' : `${theme.color}14`,
                    opacity: p.isolated ? 0.65 : 1,
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span aria-hidden="true">{card.emoji}</span>
                      <span className="font-semibold text-white truncate">{card.title}</span>
                      <span className="text-xs font-mono text-white/70">
                        {effectiveTokens(p)}t
                      </span>
                      {p.reduced && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                          🗜️ reduced
                        </span>
                      )}
                      {p.isolated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                          🙈 isolated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-1">{card.text}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => offloadCard(p.cardId)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      aria-label={`${MOVE_META.offload.label} ${card.title}. ${MOVE_META.offload.hint}`}
                      title={MOVE_META.offload.hint}
                    >
                      {MOVE_META.offload.emoji} Offload
                    </button>
                    <button
                      type="button"
                      onClick={() => reduceCard(p.cardId)}
                      disabled={p.reduced}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`${MOVE_META.reduce.label} ${card.title}. ${MOVE_META.reduce.hint}`}
                      title={MOVE_META.reduce.hint}
                    >
                      {MOVE_META.reduce.emoji} Reduce
                    </button>
                    <button
                      type="button"
                      onClick={() => isolateCard(p.cardId)}
                      disabled={p.isolated}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`${MOVE_META.isolate.label} ${card.title}. ${MOVE_META.isolate.hint}`}
                      title={MOVE_META.isolate.hint}
                    >
                      {MOVE_META.isolate.emoji} Isolate
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCard(p.cardId)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      aria-label={`Remove ${card.title} from the shelf`}
                      title="Take the card off the shelf entirely"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* External memory */}
      {external.length > 0 && (
        <section aria-label="External memory" className="rounded-2xl p-4 bg-white/5 border border-white/10">
          <h3 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
            <span aria-hidden="true">🗃️</span> External Memory
            <span className="text-white/50 font-normal">(off the shelf — Retrieve costs 1 turn)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {external.map((p) => {
              const card = getCard(p.cardId);
              if (!card) return null;
              return (
                <button
                  key={p.cardId}
                  type="button"
                  onClick={() => retrieveCard(p.cardId)}
                  className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                  aria-label={`${MOVE_META.retrieve.label} ${card.title} back to the shelf. ${MOVE_META.retrieve.hint}`}
                  title={MOVE_META.retrieve.hint}
                >
                  <span aria-hidden="true">{card.emoji}</span>
                  {card.title}
                  <span className="text-white/60">· 📥 Retrieve</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Deck of available cards */}
      <section aria-label="Available cards" className="rounded-2xl p-4 bg-white/5 border border-white/10">
        <h3 className="text-sm font-bold text-white/90 mb-3 flex items-center gap-2">
          <span aria-hidden="true">🃏</span> Card Deck
          <span className="text-white/50 font-normal">(tap to place on the shelf)</span>
        </h3>
        {availableIds.length === 0 ? (
          <p className="text-sm text-white/60">Every card is on the shelf or in external memory.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableIds.map((id) => {
              const card = getCard(id);
              if (!card) return null;
              const theme = THEME_META[card.theme];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => placeCard(id)}
                  className="text-left rounded-xl p-3 border hover:brightness-125 transition-all"
                  style={{ borderColor: `${theme.color}44`, backgroundColor: `${theme.color}10` }}
                  aria-label={`Place ${card.title} on the shelf. ${card.text} Costs ${card.tokens} tokens.`}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{card.emoji}</span>
                    <span className="font-semibold text-white truncate">{card.title}</span>
                    <span className="text-xs font-mono text-white/70 ml-auto">{card.tokens}t</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">{card.text}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer actions */}
      <div className="flex flex-wrap gap-3 justify-end pt-1 pb-2">
        {freePlay && (
          <button
            type="button"
            onClick={onFinishFreePlay}
            className="px-5 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Back to Report
          </button>
        )}
        <button
          type="button"
          onClick={handleAnswer}
          className="px-6 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
          style={{ backgroundColor: LAB_COLOR }}
          aria-label="Answer the question with the current shelf"
        >
          ✅ Answer with this shelf
        </button>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────

function ContextArchitectRoot() {
  const band = (useActiveChild()?.age_band || 'B') as 'A' | 'B' | 'C';

  const phase = useContextArchitectStore((s) => s.phase);
  const currentQuestion = useContextArchitectStore((s) => s.currentQuestion);
  const bestScore = useContextArchitectStore((s) => s.bestScore);

  const reset = useContextArchitectStore((s) => s.reset);
  const beginGame = useContextArchitectStore((s) => s.beginGame);
  const markTutorialSeen = useContextArchitectStore((s) => s.markTutorialSeen);
  const startMode = useContextArchitectStore((s) => s.startMode);
  const nextQuestion = useContextArchitectStore((s) => s.nextQuestion);
  const setPhase = useContextArchitectStore((s) => s.setPhase);

  const { awardXP, completeGame } = useGameActions();

  // Welcome is a local gate so the intro always shows even though
  // beginGame() (per the mount contract) routes straight past the store's
  // 'welcome' phase. Store logic is untouched; we just defer reveal.
  const [entered, setEntered] = useState(false);
  const [roundInMode, setRoundInMode] = useState(1);
  const [roundResult, setRoundResult] = useState<{ accuracy: number; rot: number } | null>(null);
  const [freePlay, setFreePlay] = useState(false);

  // Full-session turn history (survives per-mode startMode resets), used to
  // grade the final report via the real engine.
  const allTurnsRef = useRef<ConversationTurn[]>([]);
  const rewardedRef = useRef(false);

  // Mount: reset transient state, then let the store route the phase machine.
  useEffect(() => {
    reset();
    beginGame();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure a mode phase always has a question set up (covers returning
  // players whose beginGame() jumps straight to 'sort-mode').
  useEffect(() => {
    if (!entered) return;
    const mode = PHASE_TO_MODE[phase];
    if (mode && !currentQuestion) startMode(mode, band);
  }, [entered, phase, currentQuestion, band, startMode]);

  // Fire completion exactly once when the report is first reached.
  useEffect(() => {
    if (phase !== 'report' || rewardedRef.current) return;
    rewardedRef.current = true;
    const grade = computeGrade(allTurnsRef.current);
    const xp = 40 + grade.correctAnswers * 15 + grade.stars * 30;
    awardXP(xp);
    completeGame('context-architect', grade.stars);
  }, [phase, awardXP, completeGame]);

  const recordTurn = useCallback((turn: ConversationTurn) => {
    allTurnsRef.current = [...allTurnsRef.current, turn];
    setRoundResult({ accuracy: turn.accuracy, rot: turn.rotAtAnswer });
  }, []);

  // Advance after the child confirms a round result.
  const handleContinue = useCallback(() => {
    setRoundResult(null);
    if (freePlay) {
      const prevId = useContextArchitectStore.getState().currentQuestion?.id;
      nextQuestion(band);
      const newId = useContextArchitectStore.getState().currentQuestion?.id;
      if (!newId || newId === prevId) setPhase('report');
      return;
    }
    const mode = PHASE_TO_MODE[phase];
    if (!mode) return;
    const idx = MODE_SEQUENCE.indexOf(mode);
    // More rounds left in this mode? Try to pull a fresh question.
    if (roundInMode < ROUNDS_PER_MODE) {
      const prevId = useContextArchitectStore.getState().currentQuestion?.id;
      nextQuestion(band);
      const newId = useContextArchitectStore.getState().currentQuestion?.id;
      if (newId && newId !== prevId) {
        setRoundInMode((r) => r + 1);
        return;
      }
    }
    // Otherwise move to the next challenge, or finish.
    if (idx >= 0 && idx < MODE_SEQUENCE.length - 1) {
      startMode(MODE_SEQUENCE[idx + 1], band);
      setRoundInMode(1);
    } else {
      setPhase('report');
    }
  }, [freePlay, phase, roundInMode, band, nextQuestion, startMode, setPhase]);

  const handleLearnContinue = useCallback(
    (key: 'shelf' | 'budget' | 'moves' | 'rot' | 'tutorial') => {
      markTutorialSeen(key);
      beginGame();
    },
    [markTutorialSeen, beginGame],
  );

  const startFreePlay = useCallback(() => {
    setFreePlay(true);
    setRoundResult(null);
    startMode('design-shelf', band);
  }, [startMode, band]);

  const finishFreePlay = useCallback(() => {
    setFreePlay(false);
    setRoundResult(null);
    setPhase('report');
  }, [setPhase]);

  const playAgain = useCallback(() => {
    allTurnsRef.current = [];
    rewardedRef.current = false;
    setFreePlay(false);
    setRoundInMode(1);
    setRoundResult(null);
    reset();
    startMode('sort', band);
  }, [reset, startMode, band]);

  // ── Welcome ─────────────────────────────────────────────────────────
  if (!entered) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl text-center rounded-3xl p-8 border bg-black/40"
          style={{ borderColor: `${LAB_COLOR}55` }}
        >
          <div aria-hidden="true" style={{ fontSize: 56 }}>🪟</div>
          <h1 className="text-2xl font-bold text-white mt-2">Context Architect</h1>
          <p className="text-white/70 mt-3">
            You are the Context Architect. An AI has a small memory shelf — its context
            window. Place the right knowledge cards, clear out the clutter, and beat{' '}
            <span style={{ color: LAB_COLOR }} className="font-semibold">Context Rot</span> so
            the AI answers every question.
          </p>
          {bestScore > 0 && (
            <p className="text-sm text-white/60 mt-3">Best score so far: {bestScore}</p>
          )}
          <button
            type="button"
            onClick={() => setEntered(true)}
            className="mt-6 px-8 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
            style={{ backgroundColor: LAB_COLOR }}
          >
            Enter the Lab →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Learn cards ─────────────────────────────────────────────────────
  const learn = LEARN_CARDS.find((c) => c.phase === phase);
  if (learn) {
    const idx = LEARN_CARDS.findIndex((c) => c.phase === phase);
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <motion.div
          key={learn.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-lg text-center rounded-3xl p-8 border bg-black/40"
          style={{ borderColor: `${LAB_COLOR}55` }}
        >
          <div className="text-xs uppercase tracking-wide text-white/50">
            Lesson {idx + 1} of {LEARN_CARDS.length}
          </div>
          <div aria-hidden="true" style={{ fontSize: 48 }} className="mt-2">{learn.emoji}</div>
          <h2 className="text-xl font-bold text-white mt-2">{learn.title}</h2>
          <p className="text-white/70 mt-3">{learn.body}</p>
          <button
            type="button"
            onClick={() => handleLearnContinue(learn.key)}
            className="mt-6 px-8 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
            style={{ backgroundColor: LAB_COLOR }}
          >
            Got it →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Tutorial hand-off ───────────────────────────────────────────────
  if (phase === 'tutorial') {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg text-center rounded-3xl p-8 border bg-black/40"
          style={{ borderColor: `${LAB_COLOR}55` }}
        >
          <div aria-hidden="true" style={{ fontSize: 48 }}>🚀</div>
          <h2 className="text-xl font-bold text-white mt-2">Ready to Architect</h2>
          <p className="text-white/70 mt-3">
            Four challenges are coming: Sort the Shelf, Tight Budget, Rolling Memory, and the
            Rot Boss. Keep the shelf small and on-topic. Watch the Rot meter!
          </p>
          <button
            type="button"
            onClick={() => handleLearnContinue('tutorial')}
            className="mt-6 px-8 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
            style={{ backgroundColor: LAB_COLOR }}
          >
            Start Challenge 1 →
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Report ──────────────────────────────────────────────────────────
  if (phase === 'report') {
    const grade = computeGrade(allTurnsRef.current);
    const accPct = Math.round(grade.meanAccuracy * 100);
    const rotPct = Math.round(grade.meanRot * 100);
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center rounded-3xl p-8 border bg-black/40"
          style={{ borderColor: `${LAB_COLOR}55` }}
        >
          <h2 className="text-2xl font-bold text-white">Session Report</h2>
          <div className="my-5">
            <Stars count={grade.stars} />
          </div>
          <p className="text-white/80">{grade.summary}</p>

          <div className="grid grid-cols-2 gap-3 mt-6 text-left">
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-xs text-white/60">Questions answered</div>
              <div className="text-lg font-bold text-white">{grade.totalQuestions}</div>
            </div>
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-xs text-white/60">Answered well</div>
              <div className="text-lg font-bold text-white">{grade.correctAnswers}</div>
            </div>
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-xs text-white/60">Avg. answer strength</div>
              <div className="text-lg font-bold" style={{ color: '#34D399' }}>{accPct}%</div>
            </div>
            <div className="rounded-xl p-3 bg-white/5 border border-white/10">
              <div className="text-xs text-white/60">Avg. Context Rot</div>
              <div className="text-lg font-bold" style={{ color: '#FBBF24' }}>{rotPct}%</div>
            </div>
          </div>
          <p className="text-sm text-white/60 mt-4">Best score: {Math.max(bestScore, accPct)}</p>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button
              type="button"
              onClick={startFreePlay}
              className="px-6 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              🛠️ Free Build
            </button>
            <button
              type="button"
              onClick={playAgain}
              className="px-6 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
              style={{ backgroundColor: LAB_COLOR }}
            >
              Play Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Play (mode phases + free build) ─────────────────────────────────
  const mode = PHASE_TO_MODE[phase];
  if (mode) {
    const idx = MODE_SEQUENCE.indexOf(mode);
    const progressLabel = freePlay
      ? 'Free build — experiment freely'
      : `Challenge ${idx + 1} of ${MODE_SEQUENCE.length} · Round ${roundInMode} of ${ROUNDS_PER_MODE}`;
    return (
      <div className="relative p-4 sm:p-6 min-h-full overflow-y-auto">
        <PlayView
          band={band}
          freePlay={freePlay}
          progressLabel={progressLabel}
          onAnswerRecorded={recordTurn}
          onFinishFreePlay={finishFreePlay}
        />

        {/* Round result overlay */}
        <AnimatePresence>
          {roundResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70"
              role="dialog"
              aria-modal="true"
              aria-label="Round result"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="max-w-sm w-full text-center rounded-3xl p-8 border bg-black/90"
                style={{ borderColor: `${LAB_COLOR}66` }}
              >
                <div aria-hidden="true" style={{ fontSize: 52 }}>
                  {roundResult.accuracy >= 0.7 ? '🎉' : '🤔'}
                </div>
                <h3 className="text-xl font-bold text-white mt-2">
                  {roundResult.accuracy >= 0.7 ? 'Sharp shelf!' : 'The AI got fuzzy'}
                </h3>
                <p className="text-white/70 mt-2">
                  Answer strength{' '}
                  <span className="font-bold" style={{ color: '#34D399' }}>
                    {Math.round(roundResult.accuracy * 100)}%
                  </span>{' '}
                  · Rot{' '}
                  <span className="font-bold" style={{ color: '#FBBF24' }}>
                    {Math.round(roundResult.rot * 100)}%
                  </span>
                </p>
                <p className="text-sm text-white/60 mt-2">
                  {roundResult.rot >= 0.5
                    ? 'Too much clutter — try Offloading or Reducing off-topic cards.'
                    : roundResult.accuracy >= 0.7
                    ? 'You kept only what the question needed. That is clean context.'
                    : 'Make sure the key cards are on the shelf and decoys are off it.'}
                </p>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="mt-6 px-8 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105"
                  style={{ backgroundColor: LAB_COLOR }}
                  autoFocus
                >
                  Continue →
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Fallback (should not normally render — store routes to a known phase).
  return (
    <div className="flex items-center justify-center min-h-full text-white/70">
      Loading…
    </div>
  );
}

export default function ContextArchitectGame() {
  return (
    <GameShell title="Context Architect" color={LAB_COLOR} labNum={8}>
      <ContextArchitectRoot />
    </GameShell>
  );
}
