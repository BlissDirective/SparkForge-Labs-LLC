// ════════════════════════════════════════════════════════════════════════
// AI TIME MACHINE v5 — Lab 1 — ORDER archetype (chronology + enable-chains)
// ════════════════════════════════════════════════════════════════════════
// Was a three-bucket era-sort ("old / recent / now"). Now it's a real
// draggable + keyboard-orderable TIMELINE TRACK: the child places AI
// milestones into their true chronological sequence. Sparky rides a
// time-machine cart along the placed timeline, narrating each stop and
// reacting when a milestone is out of order. Later levels flip to
// cause→effect: build the enable-chain (ImageNet → AlexNet → the boom;
// Transformers → GPT-3 → ChatGPT). The AI winters are real beats.
//
// G1 honesty: real dates are hidden until the child LOCKS IN the order.
// Keyboard-operable: every row has "earlier / later" buttons (not drag-only).
// Band A = short, generous 4-item orderings. Band C = enable-chains +
// advanced chips (Transformers, agents, MCP).
//
// Teaches: the actual timeline of AI, and what breakthrough enabled the next.

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, ChevronUp, ChevronDown, GraduationCap, Target,
  RotateCcw, Sparkles, Check, CalendarClock, Link2, Snowflake, GripVertical,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle, ScoreDisplay } from '@/components/games/shared/GameVisualKit';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#0FB8FA';
const WINTER_COLOR = '#7DB8E8';

// ════════════════════════════════════════════════════════════════════════
// MILESTONE CATALOG — real AI history. `date` + `why` reveal ONLY after commit.
// `enable` = what this breakthrough made possible (used in enable-chain levels).
// ════════════════════════════════════════════════════════════════════════
interface Milestone {
  id: string;
  label: string;
  year: number;
  date: string;   // human-friendly, shown on reveal
  why: string;    // context, shown on reveal
  enable?: string; // what THIS enabled next (enable-chain narration)
  winter?: boolean;
}

const MS: Record<string, Milestone> = {
  turing:      { id: 'turing', label: 'The Turing Test', year: 1950, date: '1950', why: 'Alan Turing asked "Can machines think?" and invented a test for it.' },
  dartmouth:   { id: 'dartmouth', label: 'Dartmouth Conference', year: 1956, date: '1956', why: 'The field got its name — "Artificial Intelligence" — at this meeting.' },
  eliza:       { id: 'eliza', label: 'ELIZA, the first chatbot', year: 1966, date: '1966', why: 'ELIZA imitated a therapist by matching patterns in what you typed.' },
  mycin:       { id: 'mycin', label: 'MYCIN expert system', year: 1972, date: 'early 1970s', why: 'MYCIN diagnosed infections using hundreds of hand-written rules.' },
  winter1:     { id: 'winter1', label: 'The First AI Winter', year: 1974, date: '1974', why: 'AI had over-promised, so funding dried up — the first "AI winter."', winter: true },
  expert:      { id: 'expert', label: 'Expert-Systems Boom', year: 1980, date: '1980s', why: 'Companies bet big on rule-based "expert systems" to copy human experts.' },
  winter2:     { id: 'winter2', label: 'The Second AI Winter', year: 1987, date: '1987', why: 'Expert systems were brittle and costly, so the market collapsed again.', winter: true },
  deepblue:    { id: 'deepblue', label: 'Deep Blue beats Kasparov', year: 1997, date: '1997', why: 'IBM\'s Deep Blue defeated the world chess champion for the first time.' },
  imagenet:    { id: 'imagenet', label: 'ImageNet dataset', year: 2009, date: '2009', why: 'A giant labeled photo dataset gave AI something huge to learn from.', enable: 'it gave deep networks millions of labeled images to learn from.' },
  alexnet:     { id: 'alexnet', label: 'AlexNet', year: 2012, date: '2012', why: 'AlexNet crushed the ImageNet contest and kicked off the deep-learning era.', enable: 'it proved deep neural nets plus GPUs beat everything else.' },
  gans:        { id: 'gans', label: 'GANs invented', year: 2014, date: '2014', why: 'Two networks competing let AI generate brand-new, realistic images.' },
  dlboom:      { id: 'dlboom', label: 'Deep-Learning Boom', year: 2015, date: 'mid-2010s', why: 'AI suddenly got great at seeing, hearing, and translating.', enable: 'it made AI good enough to trust with real-world tasks.' },
  alphago:     { id: 'alphago', label: 'AlphaGo', year: 2016, date: '2016', why: 'AlphaGo beat a Go world champion — a game once thought too hard for AI.' },
  transformers:{ id: 'transformers', label: 'Transformers', year: 2017, date: '2017', why: 'The "Attention Is All You Need" paper introduced the Transformer.', enable: 'it became the engine inside every modern language model.' },
  gpt3:        { id: 'gpt3', label: 'GPT-3', year: 2020, date: '2020', why: 'A language model big enough to write essays, code, and answers.', enable: 'it showed that making models bigger makes them much smarter.' },
  dalle:       { id: 'dalle', label: 'DALL-E', year: 2021, date: '2021', why: 'DALL-E turned a sentence of text into a brand-new picture.' },
  chatgpt:     { id: 'chatgpt', label: 'ChatGPT', year: 2022, date: 'late 2022', why: 'ChatGPT reached 100 million users faster than anything before it.', enable: 'it put conversational AI into everyone\'s hands.' },
  gpt4:        { id: 'gpt4', label: 'GPT-4 (multimodal)', year: 2023, date: '2023', why: 'GPT-4 could read images as well as text and reason about both.' },
  agents:      { id: 'agents', label: 'Autonomous agents', year: 2024, date: '2024', why: 'AI that plans steps and uses tools on its own to finish a goal.', enable: 'agents needed a standard way to plug into outside tools.' },
  mcp:         { id: 'mcp', label: 'Model Context Protocol', year: 2024, date: 'late 2024', why: 'MCP is a shared standard that lets any agent connect to any tool.' },
};

// ════════════════════════════════════════════════════════════════════════
// LEVELS — 5 real levels. `mode` is chronology or an enable-chain.
// `items[band]` is the CANONICAL SOLUTION order (earliest→latest / cause→effect).
// Band A = 4 items, generous. Band C adds advanced, agentic-era chips.
// ════════════════════════════════════════════════════════════════════════
type Band = AgeBand;
type Mode = 'timeline' | 'chain';

interface TMLevel {
  id: number;
  name: string;
  emoji: string;
  difficulty: LevelConfig['difficulty'];
  mode: Mode;
  blurb: string;
  concept: string;
  items: Record<Band, string[]>;
  xpReward: number;
  isBonus?: boolean;
}

const TM_LEVELS: TMLevel[] = [
  {
    id: 1, name: 'The First Dreams', emoji: '🕰️', difficulty: 'easy', mode: 'timeline',
    blurb: 'Put the earliest AI ideas in the order they really happened.',
    concept: 'AI is old! Its first ideas came decades before smartphones — even the first "AI winter" is part of the story.',
    xpReward: 60,
    items: {
      A: ['turing', 'dartmouth', 'eliza', 'winter1'],
      B: ['turing', 'dartmouth', 'eliza', 'mycin', 'winter1'],
      C: ['turing', 'dartmouth', 'eliza', 'mycin', 'winter1', 'deepblue'],
    },
  },
  {
    id: 2, name: 'Booms & Winters', emoji: '❄️', difficulty: 'medium', mode: 'timeline',
    blurb: 'AI rose, crashed, and rose again. Order the boom-and-bust years.',
    concept: 'Progress was not a straight line. Expert systems boomed, then a second "AI winter" hit — before data and chess changed everything.',
    xpReward: 80,
    items: {
      A: ['expert', 'winter2', 'deepblue', 'imagenet'],
      B: ['expert', 'winter2', 'deepblue', 'imagenet', 'alexnet'],
      C: ['expert', 'winter2', 'deepblue', 'imagenet', 'alexnet', 'alphago'],
    },
  },
  {
    id: 3, name: 'The Deep-Learning Era', emoji: '🧬', difficulty: 'hard', mode: 'timeline',
    blurb: 'Neural networks woke up. Sequence the breakthroughs that followed.',
    concept: 'Once big data met GPUs, deep learning took off fast — vision, games, and the Transformer that would power everything next.',
    xpReward: 100,
    items: {
      A: ['imagenet', 'alexnet', 'alphago', 'gpt3'],
      B: ['imagenet', 'alexnet', 'gans', 'alphago', 'gpt3'],
      C: ['imagenet', 'alexnet', 'gans', 'alphago', 'transformers', 'gpt3'],
    },
  },
  {
    id: 4, name: 'The LLM & Agent Era', emoji: '🤖', difficulty: 'hard', mode: 'timeline',
    blurb: 'The years you may remember. Order the generative & agent milestones.',
    concept: 'Large language models learned to talk, see, and act. The newest chips — agents and MCP — are the frontier right now.',
    xpReward: 130,
    items: {
      A: ['gpt3', 'dalle', 'chatgpt', 'gpt4'],
      B: ['gpt3', 'dalle', 'chatgpt', 'gpt4', 'agents'],
      C: ['gpt3', 'dalle', 'chatgpt', 'gpt4', 'agents', 'mcp'],
    },
  },
  {
    id: 5, name: 'What Enabled What?', emoji: '🔗', difficulty: 'expert', mode: 'chain', isBonus: true,
    blurb: 'Not just WHEN — WHY. Build the cause→effect chain of breakthroughs.',
    concept: 'Each breakthrough unlocked the next: data enabled deep learning; Transformers enabled GPT-3 enabled ChatGPT. Build the chain of enablement.',
    xpReward: 200,
    items: {
      A: ['imagenet', 'alexnet', 'dlboom', 'alphago'],
      B: ['imagenet', 'alexnet', 'dlboom', 'gpt3', 'chatgpt'],
      C: ['transformers', 'gpt3', 'chatgpt', 'agents', 'mcp'],
    },
  },
];

const LEVELS: LevelConfig[] = TM_LEVELS.map((l) => ({
  id: l.id, name: l.name, description: l.blurb, emoji: l.emoji,
  difficulty: l.difficulty, starThresholds: [40, 60, 80], xpReward: l.xpReward, isBonus: l.isBonus,
}));

const MAX_SCORE = 100;

// ── Scoring: forgiving, based on correctly-ordered adjacent pairs ──
// Kids rarely nail an exact insertion sort; rewarding "mostly right" pairs
// teaches ordering without punishing a single misplacement too harshly.
interface ScoreResult { total: number; exactHits: number; correctPairs: number; totalPairs: number; perfect: boolean; }

function scoreOrder(order: string[], solution: string[], band: Band): ScoreResult {
  const rank = new Map(solution.map((id, i) => [id, i]));
  const n = order.length;
  let exactHits = 0;
  for (let i = 0; i < n; i++) if (order[i] === solution[i]) exactHits++;
  let correctPairs = 0;
  const totalPairs = Math.max(1, n - 1);
  for (let i = 0; i < n - 1; i++) {
    if ((rank.get(order[i]) ?? 0) < (rank.get(order[i + 1]) ?? 0)) correctPairs++;
  }
  const perfect = exactHits === n;
  let total = Math.round((correctPairs / totalPairs) * 80) + (perfect ? 20 : 0);
  if (band === 'A') total = Math.min(100, total + 15); // band A generosity
  total = Math.max(0, Math.min(100, total));
  return { total, exactHits, correctPairs, totalPairs, perfect };
}

// ── Deterministic shuffle so the board is stable across re-renders ──
function seededShuffle(ids: string[], seed: number): string[] {
  const arr = [...ids];
  let s = seed || 1;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.join('|') === ids.join('|')) arr.reverse(); // never start pre-solved
  return arr;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the timeline track
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const tm = useMemo(() => TM_LEVELS.find((t) => t.id === level.id)!, [level.id]);
  const solution = useMemo(() => tm.items[band] ?? tm.items.B, [tm, band]);
  const isChain = tm.mode === 'chain';

  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();

  const [phase, setPhase] = useState<'welcome' | 'order' | 'reveal'>('welcome');
  const [order, setOrder] = useState<string[]>(() => seededShuffle(solution, level.id * 131 + band.charCodeAt(0)));
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [revealStep, setRevealStep] = useState(0); // how many stops the cart has visited
  const dragIndex = useRef<number | null>(null);

  const n = order.length;
  const posLabels = isChain ? { first: 'First cause', last: 'Final effect' } : { first: 'Earliest', last: 'Most recent' };

  // ── Reorder (keyboard-first via buttons; drag is an enhancement) ──
  const swap = useCallback((i: number, j: number) => {
    if (phase !== 'order') return;
    if (j < 0 || j >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, [order.length, phase]);

  const handleDrop = useCallback((target: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target || phase !== 'order') return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, [phase]);

  // ── Commit: score, then ride the cart along the timeline ──
  const lockIn = useCallback(() => {
    const r = scoreOrder(order, solution, band);
    setResult(r);
    setRevealStep(0);
    setPhase('reveal');
    if (r.perfect) juice.onCorrect(n, r.total);
    else juice.onWrong(0, r.total);
  }, [order, solution, band, juice, n]);

  // ── Cart walk during reveal ──
  useEffect(() => {
    if (phase !== 'reveal') return;
    if (prefersReducedMotion) { setRevealStep(n); return; }
    if (revealStep >= n) return;
    const t = setTimeout(() => setRevealStep((s) => s + 1), revealStep === 0 ? 500 : 1150);
    return () => clearTimeout(t);
  }, [phase, revealStep, prefersReducedMotion, n]);

  const finish = useCallback(() => {
    const r = result ?? scoreOrder(order, solution, band);
    const stars = (r.total >= level.starThresholds[2] ? 3
      : r.total >= level.starThresholds[1] ? 2
        : r.total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    onComplete({ score: r.total, maxScore: MAX_SCORE, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
  }, [result, order, solution, band, level, onComplete]);

  const revealDone = phase === 'reveal' && revealStep >= n;

  // ═══════════════════════════════════ WELCOME ═══════════════════════════════════
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={tm.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{tm.blurb}</p>
          <div className="rounded-2xl p-3 text-xs" style={{ background: `${LAB_COLOR}12`, color: '#0A7FA8' }}>
            <GraduationCap className="w-4 h-4 inline mr-1" style={{ color: LAB_COLOR }} />
            <strong style={{ color: LAB_COLOR }}>Concept:</strong> {tm.concept}
          </div>
          <div className="mt-3 rounded-2xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3512', color: '#C2410C' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF6B35' }} />
            <span>
              <strong style={{ color: '#FF6B35' }}>Your job:</strong>{' '}
              {isChain
                ? 'Arrange the breakthroughs so each one enables the next — a cause→effect chain. Use the arrows or drag.'
                : 'Arrange the milestones from earliest to most recent using the arrows (or drag). Dates stay hidden until you lock in!'}
            </span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('order')}>
          Board the Time Machine <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══════════════════════════════════ ORDER + REVEAL ═══════════════════════════════════
  const cartRow = phase === 'reveal' ? Math.min(revealStep - 1, n - 1) : -1;

  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={tm.emoji} color={LAB_COLOR}>
          {isChain ? 'Build the Enable-Chain' : 'Build the Timeline'}
        </GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <CalendarClock className="w-4 h-4" />{n} stops
        </span>
      </div>

      {phase === 'reveal' && result && (
        <ScoreDisplay score={result.total} maxScore={MAX_SCORE} label={isChain ? 'Chain accuracy' : 'Timeline accuracy'} />
      )}

      {/* Axis orientation labels */}
      <div className="flex items-center justify-between text-xs font-semibold px-1" style={{ color: '#5A6078' }}>
        <span className="flex items-center gap-1"><ChevronUp className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />{posLabels.first}</span>
        <span className="flex items-center gap-1">{posLabels.last}<ChevronDown className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} /></span>
      </div>

      {/* The track */}
      <div className="relative space-y-2">
        {/* connecting rail */}
        <div
          className="absolute top-4 bottom-4 rounded-full pointer-events-none"
          style={{ left: '1.15rem', width: '2px', background: `linear-gradient(${LAB_COLOR}66, ${LAB_COLOR}22)` }}
          aria-hidden="true"
        />
        {order.map((id, i) => {
          const ms = MS[id];
          const revealed = phase === 'reveal' && i < revealStep;
          const correctSlot = order[i] === solution[i];
          const isCart = i === cartRow;
          const nextMs = i < n - 1 ? MS[order[i + 1]] : null;
          const chainOk = isChain && revealed && correctSlot && !!nextMs && solution[i + 1] === order[i + 1];

          return (
            <div key={id} className="relative">
              <motion.div
                layout={!prefersReducedMotion}
                draggable={phase === 'order'}
                onDragStart={() => { dragIndex.current = i; }}
                onDragOver={(e) => { if (phase === 'order') e.preventDefault(); }}
                onDrop={() => handleDrop(i)}
                className="flex items-center gap-2 rounded-2xl p-3"
                style={{
                  background: '#FFFFFF',
                  border: `2px solid ${
                    revealed
                      ? (correctSlot ? '#2ECC7155' : '#F59E0B55')
                      : ms.winter ? `${WINTER_COLOR}55` : `${LAB_COLOR}26`
                  }`,
                  boxShadow: isCart ? `0 0 0 3px ${LAB_COLOR}33, 0 6px 18px ${LAB_COLOR}22` : 'none',
                }}
              >
                {/* Position bead */}
                <span
                  className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: ms.winter ? `${WINTER_COLOR}22` : `${LAB_COLOR}18`,
                    color: ms.winter ? '#2C6FA8' : LAB_COLOR,
                    border: `1.5px solid ${ms.winter ? `${WINTER_COLOR}66` : `${LAB_COLOR}44`}`,
                  }}
                >
                  {ms.winter ? <Snowflake className="w-4 h-4" /> : i + 1}
                </span>

                {/* Label + revealed detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate" style={{ color: '#1A1D2B' }}>{ms.label}</span>
                    {revealed && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: correctSlot ? '#2ECC7118' : '#F59E0B18',
                          color: correctSlot ? '#178A4C' : '#B45309',
                        }}
                      >
                        {ms.date}
                      </span>
                    )}
                  </div>
                  <AnimatePresence>
                    {revealed && (
                      <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs mt-1" style={{ color: '#5A6078' }}>{ms.why}</p>
                        {chainOk && ms.enable && (
                          <p className="text-xs mt-1 flex items-start gap-1 font-medium" style={{ color: '#0A7FA8' }}>
                            <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
                            <span>Enabled <strong>{nextMs?.label}</strong> — {ms.enable}</span>
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart marker (reveal) */}
                {isCart && (
                  <motion.span
                    className="text-xl shrink-0"
                    role="img"
                    aria-label="Sparky's time cart is here"
                    initial={prefersReducedMotion ? false : { scale: 0.6 }}
                    animate={prefersReducedMotion ? {} : { scale: 1, y: [0, -2, 0] }}
                    transition={{ y: { repeat: Infinity, duration: 0.8 } }}
                  >
                    🚋
                  </motion.span>
                )}

                {/* Reorder controls (keyboard-operable) */}
                {phase === 'order' && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      aria-label={`Move ${ms.label} ${isChain ? 'earlier in the chain' : 'earlier in time'}`}
                      disabled={i === 0}
                      onClick={() => swap(i, i - 1)}
                      className="w-7 h-6 rounded-lg flex items-center justify-center disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{ background: `${LAB_COLOR}14`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${ms.label} ${isChain ? 'later in the chain' : 'later in time'}`}
                      disabled={i === n - 1}
                      onClick={() => swap(i, i + 1)}
                      className="w-7 h-6 rounded-lg flex items-center justify-center disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{ background: `${LAB_COLOR}14`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {phase === 'order' && (
                  <GripVertical className="w-4 h-4 shrink-0 hidden sm:block" style={{ color: '#B4BAD0' }} aria-hidden="true" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Sparky narration (reveal) */}
      <AnimatePresence>
        {phase === 'reveal' && revealStep > 0 && (
          <motion.div
            key={cartRow}
            role="status"
            className="rounded-2xl p-3 flex items-start gap-2"
            style={{ background: `${LAB_COLOR}0F`, border: `1px solid ${LAB_COLOR}33` }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <span className="text-lg shrink-0" role="img" aria-hidden="true">🚋</span>
            <p className="text-sm" style={{ color: '#1A1D2B' }}>
              {(() => {
                const idx = revealDone ? n - 1 : cartRow;
                const ms = MS[order[idx]];
                const ok = order[idx] === solution[idx];
                if (isChain) {
                  return ok
                    ? `Sparky: "Perfect link — ${ms.label} really did lead to what's next!"`
                    : `Sparky: "Hmm, ${ms.label} doesn't cause the next stop here — it belongs elsewhere in the chain."`;
                }
                return ok
                  ? `Sparky: "Right on schedule — ${ms.label} happened in ${ms.date}."`
                  : `Sparky: "Whoa, out of order! ${ms.label} is actually from ${ms.date}."`;
              })()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {phase === 'order' && (
        <SFButton variant="primary" size="lg" className="w-full" onClick={lockIn}>
          <Sparkles className="w-4 h-4 mr-2" />
          {isChain ? 'Lock in the chain!' : 'Lock in the timeline!'}
        </SFButton>
      )}
      {phase === 'reveal' && (
        <div className="flex gap-2">
          <SFButton variant="primary" className="flex-1" onClick={finish} disabled={!revealDone}>
            {revealDone ? (
              <>See my stars <ChevronRight className="w-4 h-4 ml-1" /></>
            ) : (
              <><span className="opacity-80">Sparky is riding the timeline…</span></>
            )}
          </SFButton>
          <SFButton variant="outline" onClick={onExit} aria-label="Back to level map">
            <RotateCcw className="w-4 h-4" />
          </SFButton>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function TimeMachineGame() {
  const { awardXP, completeGame } = useGameActions();
  const band: Band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    // 5 levels → 15 stars max. Fire once, 1–3 stars.
    completeGame('time-machine', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Time Machine" color="#0FB8FA" labNum={1}>
      <GameLevelSystem
        gameTitle="AI Time Machine"
        gameEmoji="🕰️"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer key={level.id} level={level} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
