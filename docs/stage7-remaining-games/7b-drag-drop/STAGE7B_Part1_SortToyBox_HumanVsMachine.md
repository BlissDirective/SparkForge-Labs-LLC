# SPARKFORGE — STAGE 7B PART 1: Sort Toy Box + Human vs Machine

**Date:** February 20, 2026 | **GCUD Version:** V7
**Batch:** 7B — Drag & Drop Games
**Games in this file:** Sort Toy Box (Standard Polish), Human vs Machine (Standard Polish)

---

## Game 1: `src/components/games/SortToyBoxGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// SORT THE TOY BOX V2 — Lab 2 (Teaching AI)
// Group shapes however you want, then compare with AI.
// Teaches: unsupervised learning, clustering, features.
// Enhanced: chrome bezel, welcome phase, multiple rounds,
// AI explains its sorting criteria, age-band depth.
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Plus, Boxes, Brain } from 'lucide-react';

type Phase = 'welcome' | 'sort' | 'reveal';

interface Shape {
  id: string;
  shape: 'circle' | 'square' | 'triangle';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  group: number | null;
}

const COLORS = [
  { color: '#3B82F6', name: 'Blue' },
  { color: '#EF4444', name: 'Red' },
  { color: '#10B981', name: 'Green' },
];

const AI_CRITERIA = [
  { key: 'shape', label: 'Shape', desc: 'I sorted by shape: circles, squares, and triangles each get their own group!', descC: 'The algorithm identified geometric class as the optimal feature for partitioning, creating clusters with maximum inter-class distance.' },
  { key: 'color', label: 'Color', desc: 'I sorted by color: all blues together, all reds together, all greens together!', descC: 'Color channel values provided the highest-variance feature for k-means clustering with k=3.' },
  { key: 'size', label: 'Size', desc: 'I sorted by size: big shapes and small shapes into two groups!', descC: 'Binary classification on the size dimension yielded the cleanest decision boundary with k=2.' },
];

function generateShapes(): Shape[] {
  const shapes: Shape[] = [];
  let id = 0;
  (['circle', 'square', 'triangle'] as const).forEach(shape => {
    COLORS.forEach(c => {
      (['small', 'large'] as const).forEach(size => {
        shapes.push({ id: `s${id++}`, shape, color: c.color, colorName: c.name, size, group: null });
      });
    });
  });
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }
  return shapes.slice(0, 12);
}

function ShapeIcon({ shape, color, size }: { shape: string; color: string; size: string }) {
  const s = size === 'small' ? 22 : 34;
  if (shape === 'circle') return <div className="rounded-full" style={{ width: s, height: s, background: color }} />;
  if (shape === 'square') return <div className="rounded-sm" style={{ width: s, height: s, background: color }} />;
  return (
    <div style={{ width: s, height: s }} className="flex items-end justify-center">
      <div style={{ borderLeft: `${s / 2}px solid transparent`, borderRight: `${s / 2}px solid transparent`, borderBottom: `${s}px solid ${color}` }} />
    </div>
  );
}

export function SortToyBoxGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [shapes, setShapes] = useState<Shape[]>(() => generateShapes());
  const [groupCount, setGroupCount] = useState(2);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [aiCriterion, setAiCriterion] = useState<typeof AI_CRITERIA[0] | null>(null);

  const allGrouped = shapes.every(s => s.group !== null);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  function assignGroup(g: number) {
    if (!selectedShape) return;
    setShapes(prev => prev.map(s => s.id === selectedShape ? { ...s, group: g } : s));
    setSelectedShape(null);
    game.addScore(2);
  }

  function revealAI() {
    const pick = AI_CRITERIA[Math.floor(Math.random() * AI_CRITERIA.length)];
    setAiCriterion(pick);
    const sorted = shapes.map(s => {
      let g = 0;
      if (pick.key === 'shape') g = ['circle', 'square', 'triangle'].indexOf(s.shape);
      else if (pick.key === 'color') g = COLORS.findIndex(c => c.color === s.color);
      else g = s.size === 'small' ? 0 : 1;
      return { ...s, group: g };
    });
    setShapes(sorted);
    game.addScore(20);
    setPhase('reveal');
    setTimeout(() => game.completeGame(), 4000);
  }

  return (
    <GameShell gameId="sort-toy-box" title="Sort the Toy Box" worldNumber={2} worldColor="#8B5CF6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), rgba(0,0,0,0))` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          {/* Chrome bezel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* Welcome Phase */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-5xl">📦</span>
                    <h2 className="font-display text-2xl font-bold text-white">Sort the Toy Box</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Explore unsupervised learning — group objects by any feature, then compare your clustering strategy with the AI\'s approach.'
                        : 'Sort these shapes into groups however YOU want! Then see how the AI sorts them differently.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Clustering', 'Features', 'Unsupervised Learning'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('sort')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Open the Toy Box! <Boxes className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Sort Phase */}
                {phase === 'sort' && (
                  <motion.div key="sort" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    <p className="font-body text-xs text-white/30 mb-3 text-center">Tap a shape, then tap a group to sort it!</p>

                    {/* Ungrouped */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                      {shapes.filter(s => s.group === null).map(s => (
                        <motion.button key={s.id} onClick={() => setSelectedShape(selectedShape === s.id ? null : s.id)}
                          className={`p-2 rounded-lg transition-all ${selectedShape === s.id ? 'ring-2 ring-purple-500 bg-purple-500/10' : 'hover:bg-white/5'}`}
                          whileTap={{ scale: 0.9 }} layout aria-label={`${s.size} ${s.colorName} ${s.shape}`}>
                          <ShapeIcon shape={s.shape} color={s.color} size={s.size} />
                        </motion.button>
                      ))}
                    </div>

                    {shapes.filter(s => s.group === null).length === 0 && <p className="font-body text-xs text-purple-300 text-center mb-2">All sorted!</p>}

                    {/* Groups */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
                      {Array.from({ length: groupCount }).map((_, g) => (
                        <motion.button key={g} onClick={() => assignGroup(g)}
                          className={`rounded-xl border-2 border-dashed p-2 min-h-[80px] flex flex-wrap gap-1 content-start items-start ${
                            selectedShape ? 'border-purple-500/40 bg-purple-500/5 cursor-pointer' : 'border-white/10 bg-white/[0.01]'
                          }`} whileHover={selectedShape ? { scale: 1.02 } : {}}>
                          <span className="font-display text-[10px] text-white/20 w-full">Group {g + 1}</span>
                          {shapes.filter(s => s.group === g).map(s => (
                            <motion.div key={s.id} layout className="p-0.5">
                              <ShapeIcon shape={s.shape} color={s.color} size={s.size} />
                            </motion.div>
                          ))}
                        </motion.button>
                      ))}
                      {groupCount < 4 && (
                        <button onClick={() => setGroupCount(c => c + 1)}
                          className="rounded-xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/20 hover:text-white/40 hover:border-white/10">
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {allGrouped && (
                      <motion.button onClick={revealAI} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 w-full py-3 rounded-xl font-display font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        See How AI Sorts! <Brain className="inline w-4 h-4 ml-1" />
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* Reveal Phase */}
                {phase === 'reveal' && aiCriterion && (
                  <motion.div key="reveal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <Brain className="w-8 h-8 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">AI sorted by: {aiCriterion.label}</h3>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? aiCriterion.descC : aiCriterion.desc}
                    </p>
                    <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5 max-w-sm">
                      <p className="font-body text-xs text-white/40">
                        {ageBand === 'C'
                          ? 'In unsupervised learning, the algorithm discovers structure without labeled training data — selecting features that maximize cluster separation.'
                          : 'There\'s no "wrong" way to sort! AI just picks different features to group by.'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## Game 2: `src/components/games/HumanVsMachineGame.tsx`

```tsx
// ════════════════════════════════════════════════════
// HUMAN VS MACHINE V2 — Lab 1 (What IS AI?)
// Side-by-side challenges: kid vs simulated AI.
// Enhanced: chrome bezel, welcome phase, 8 challenges,
// scoring comparison, "who wins" verdict, age-band depth.
// ════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { Swords, User, Bot } from 'lucide-react';

type Phase = 'welcome' | 'play';

interface Challenge {
  title: string;
  emoji: string;
  prompt: string;
  type: 'math' | 'text' | 'opinion';
  aiAnswer: string;
  aiTime: number;
  humanAdvantage: string;
  aiAdvantage: string;
  humanAdvantageC: string;
  aiAdvantageC: string;
  band: 'A' | 'B' | 'C';
}

const ALL_CHALLENGES: Challenge[] = [
  { title: 'Quick Math', emoji: '🔢', prompt: 'What is 47 + 86?', type: 'math', aiAnswer: '133', aiTime: 400,
    humanAdvantage: 'You can check AI\'s work!', aiAdvantage: 'AI is lightning fast at math.',
    humanAdvantageC: 'Humans verify computational outputs through number sense and estimation.', aiAdvantageC: 'Deterministic computation gives AI sub-millisecond arithmetic.', band: 'A' },
  { title: 'Complete the Joke', emoji: '😄', prompt: 'Why did the robot go to school?', type: 'text', aiAnswer: 'To improve its learning algorithm!', aiTime: 1200,
    humanAdvantage: 'Humor is a human superpower!', aiAdvantage: 'AI can generate jokes, but doesn\'t "get" them.',
    humanAdvantageC: 'Human humor relies on theory of mind, cultural context, and timing.', aiAdvantageC: 'AI pattern-matches joke structures but lacks genuine comedic understanding.', band: 'A' },
  { title: 'Describe Friendship', emoji: '🤝', prompt: 'What does friendship mean to you?', type: 'opinion', aiAnswer: 'Friendship is a social bond between individuals characterized by mutual trust, support, and shared experiences.', aiTime: 800,
    humanAdvantage: 'Your answer has real feeling — AI describes, not feels.', aiAdvantage: 'AI gives a clear definition but misses the warmth.',
    humanAdvantageC: 'Phenomenal experience gives humans genuine emotional grounding.', aiAdvantageC: 'AI produces semantically correct but experientially empty descriptions.', band: 'A' },
  { title: 'Name an Emotion', emoji: '💭', prompt: 'Describe what happiness feels like', type: 'opinion', aiAnswer: 'Happiness is a positive emotional state associated with feelings of joy, contentment, and well-being.', aiTime: 600,
    humanAdvantage: 'You described a FEELING. AI describes a concept.', aiAdvantage: 'AI sounds right but has never actually felt happy.',
    humanAdvantageC: 'First-person phenomenal experience is epistemically privileged.', aiAdvantageC: 'AI generates accurate descriptions without qualia or subjective experience.', band: 'B' },
  { title: 'Creative Story', emoji: '📖', prompt: 'Write a one-sentence story about a lost puppy', type: 'text', aiAnswer: 'A small puppy wandered through the rain-soaked streets until a kind child with an umbrella led it home.', aiTime: 1500,
    humanAdvantage: 'Your stories have unique perspectives!', aiAdvantage: 'AI writes well but recombines existing patterns.',
    humanAdvantageC: 'Human narratives draw on embodied experience and genuine imagination.', aiAdvantageC: 'AI generates coherent narratives via statistical pattern completion over training data.', band: 'B' },
  { title: 'Quick Math 2', emoji: '🔢', prompt: 'What is 15 × 12?', type: 'math', aiAnswer: '180', aiTime: 300,
    humanAdvantage: 'Understanding WHY matters more than speed.', aiAdvantage: 'Calculators are AI\'s oldest trick.',
    humanAdvantageC: 'Mathematical intuition and proof comprehension exceed mere computation.', aiAdvantageC: 'Arithmetic is a solved problem for digital systems — O(1) lookup vs human serial processing.', band: 'B' },
  { title: 'Moral Dilemma', emoji: '⚖️', prompt: 'Is it okay to lie to protect someone\'s feelings?', type: 'opinion', aiAnswer: 'This is a complex ethical question. Many ethicists argue that while honesty is important, compassionate communication can sometimes justify withholding harsh truths.', aiTime: 1000,
    humanAdvantage: 'You have REAL moral intuitions shaped by experience.', aiAdvantage: 'AI summarizes ethics but can\'t feel moral weight.',
    humanAdvantageC: 'Moral reasoning integrates emotion, experience, and ethical frameworks.', aiAdvantageC: 'AI aggregates ethical positions without genuine moral agency or accountability.', band: 'C' },
  { title: 'Pattern Recognition', emoji: '🔍', prompt: 'What comes next: 2, 6, 12, 20, ___?', type: 'math', aiAnswer: '30', aiTime: 500,
    humanAdvantage: 'Humans can explain WHY patterns work.', aiAdvantage: 'AI processes sequences instantly.',
    humanAdvantageC: 'Human pattern recognition generalizes from limited examples via inductive reasoning.', aiAdvantageC: 'AI applies learned sequence models but may lack causal understanding of the generating function.', band: 'C' },
];

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

export function HumanVsMachineGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [humanAnswer, setHumanAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiRevealed, setAiRevealed] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const challenges = useMemo(() => ALL_CHALLENGES.filter(c => BAND_ORDER[c.band] <= BAND_ORDER[ageBand]), [ageBand]);
  const challenge = challenges[roundIdx];

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  const handleSubmit = useCallback(() => {
    if (!humanAnswer.trim()) return;
    setSubmitted(true);
    setAiThinking(true);
    game.addScore(10);
    setTimeout(() => { setAiThinking(false); setAiRevealed(true); }, challenge.aiTime);
  }, [humanAnswer, challenge, game]);

  function nextRound() {
    setHumanAnswer(''); setSubmitted(false); setAiRevealed(false);
    if (roundIdx < challenges.length - 1) { setRoundIdx(i => i + 1); game.nextRound(); }
    else game.completeGame();
  }

  return (
    <GameShell gameId="human-vs-machine" title="Human vs Machine" worldNumber={1} worldColor="#3B82F6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(59,130,246,${0.15 + p.size * 0.06}), rgba(0,0,0,0))` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          {/* Chrome bezel */}
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {/* Welcome Phase */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4">
                    <span className="text-5xl">⚔️</span>
                    <h2 className="font-display text-2xl font-bold text-white">Human vs Machine</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">Go head-to-head with an AI! See where humans and machines each have advantages.</p>
                    <div className="flex gap-2 justify-center">
                      {['Comparison', 'Strengths', 'Limitations'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 font-body text-[10px] text-blue-300">{t}</span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('play')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Challenge the AI! <Swords className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* Play Phase */}
                {phase === 'play' && challenge && (
                  <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg space-y-4">
                    <div className="text-center mb-4">
                      <span className="text-3xl">{challenge.emoji}</span>
                      <h3 className="font-display text-base font-bold text-white mt-1">{challenge.title}</h3>
                      <p className="font-body text-sm text-white/50">{challenge.prompt}</p>
                    </div>

                    <div className="flex gap-3 mb-4">
                      {/* Human */}
                      <div className="flex-1 rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <span className="font-display text-xs font-bold text-white">You</span>
                        </div>
                        {!submitted ? (
                          <input type="text" value={humanAnswer} onChange={e => setHumanAnswer(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            placeholder="Your answer..." autoFocus aria-label="Your answer"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-body focus:outline-none focus:border-blue-500/50" />
                        ) : <p className="font-body text-sm text-white/80">{humanAnswer}</p>}
                      </div>

                      {/* AI */}
                      <div className="flex-1 rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-amber-400" />
                          <span className="font-display text-xs font-bold text-white">AI</span>
                        </div>
                        {aiThinking ? (
                          <motion.p className="font-body text-sm text-white/30" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>Thinking...</motion.p>
                        ) : aiRevealed ? (
                          <p className="font-body text-sm text-white/80">{challenge.aiAnswer}</p>
                        ) : <p className="font-body text-sm text-white/10">Waiting...</p>}
                      </div>
                    </div>

                    {!submitted && (
                      <motion.button onClick={handleSubmit} disabled={!humanAnswer.trim()}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Submit!
                      </motion.button>
                    )}

                    {aiRevealed && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg p-2 bg-blue-500/5 border border-blue-500/10">
                            <p className="font-body text-[9px] text-blue-400 uppercase">Human Advantage</p>
                            <p className="font-body text-[10px] text-white/50 mt-0.5">{ageBand === 'C' ? challenge.humanAdvantageC : challenge.humanAdvantage}</p>
                          </div>
                          <div className="rounded-lg p-2 bg-amber-500/5 border border-amber-500/10">
                            <p className="font-body text-[9px] text-amber-400 uppercase">AI Advantage</p>
                            <p className="font-body text-[10px] text-white/50 mt-0.5">{ageBand === 'C' ? challenge.aiAdvantageC : challenge.aiAdvantage}</p>
                          </div>
                        </div>
                        <motion.button onClick={nextRound}
                          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 font-display text-xs text-white/70 hover:bg-white/10"
                          whileTap={{ scale: 0.95 }}>
                          Next Challenge →
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```
