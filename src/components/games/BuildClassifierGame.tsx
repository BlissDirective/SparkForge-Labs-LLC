// ════════════════════════════════════════════════════════════════════════
// BUILD A CLASSIFIER v5 — Lab 7 (Computer Vision) — LABEL → TRAIN → TEST
// ════════════════════════════════════════════════════════════════════════
// The old version stopped at "Train!" — nothing was ever trained or tested, so
// the concept died exactly where it started. v5 adds the missing back half:
//
//   1. LABEL  — the child sorts training EXAMPLES into class bins (Pixi board).
//   2. TRAIN  — Sparky's "brain" assembles a real nearest-prototype (centroid)
//               model: each class prototype is the MEAN of the hand-authored
//               feature vectors of the examples the child labelled into it.
//   3. TEST   — 4 UNSEEN examples stream in; the model GUESSES each by nearest
//               prototype. Its mistakes trace directly back to labelling errors.
//
// Honesty (G1): every test prediction is argmin distance to prototypes built
// from the CHILD's labels + hand-authored features. No pre-labelled answers are
// consulted at prediction time — a test item's true class is used only to score
// and to draw the confusion matrix afterwards.
//
// One level (Spam Filter, band C) ships deliberately POISONED training data:
// two examples arrive pre-labelled WRONG and locked. Those bad labels drag a
// prototype off, so an honest test item is mis-guessed — garbage in, garbage
// out. Band C also sees a confusion matrix of the test results.
//
// Keyboard-operable throughout (bins are real buttons via PixiBinSortStage's
// AT strip; every phase advances with buttons). Pixi is KEPT for the LABEL
// phase; TRAIN and TEST are HTML/CSS. Dark surface, lab-cyan accent.

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Cpu, GraduationCap, Target, RotateCcw, Sparkles,
  Brain, Play, ArrowRight, AlertTriangle, Check, X,
} from 'lucide-react';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle } from '@/components/games/shared/GameVisualKit';
import type { BinSortItem } from '@/components/games/pixi/PixiBinSortStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiBinSortStage = dynamic(() => import('@/components/games/pixi/PixiBinSortStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

type Band = 'A' | 'B' | 'C';

const LAB_COLOR = '#10BAD2';
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#F59E0B', '#8F96FA', '#FF7050'];
const CLASS_COLORS = ['#4F6EF7', '#E945F5', '#2ECC71', '#F59E0B'];

// ════════════════════════════════════════════════════════════════════════
// THE MODEL — a real nearest-prototype (centroid) classifier
// ════════════════════════════════════════════════════════════════════════
// Each example carries a hand-authored feature vector `feat` (values 0..1). A
// class prototype is the MEAN of the feature vectors labelled into that class.
// A test item is classified by the nearest prototype (Euclidean). Everything
// below is a pure, deterministic function of the child's labels + the features.

function centroid(vectors: number[][], dim: number): number[] {
  if (vectors.length === 0) return [];
  const sum = new Array(dim).fill(0);
  vectors.forEach((v) => v.forEach((val, i) => { sum[i] += val; }));
  return sum.map((s) => s / vectors.length);
}

/** Build one prototype per class from the labelled training feature vectors. */
function buildPrototypes(
  labelled: { feat: number[]; cls: number }[],
  numClasses: number,
  dim: number,
): (number[] | null)[] {
  const protos: (number[] | null)[] = [];
  for (let c = 0; c < numClasses; c++) {
    const vs = labelled.filter((l) => l.cls === c).map((l) => l.feat);
    protos.push(vs.length > 0 ? centroid(vs, dim) : null);
  }
  return protos;
}

function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

/** Nearest-prototype prediction. Returns the class index + per-class distances. */
function classify(feat: number[], protos: (number[] | null)[]): { pred: number; dists: (number | null)[] } {
  const dists = protos.map((p) => (p ? euclid(feat, p) : null));
  let pred = -1;
  let best = Infinity;
  dists.forEach((d, c) => { if (d !== null && d < best) { best = d; pred = c; } });
  return { pred, dists };
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL DATA — hand-authored examples + features. Features are a numeric
// encoding of each example's plain-language description (what the model "sees").
// ════════════════════════════════════════════════════════════════════════
interface Item { id: string; name: string; label: string; feat: number[]; cls: number; }
interface LevelDef {
  key: string;
  name: string;
  emoji: string;
  difficulty: LevelConfig['difficulty'];
  xpReward: number;
  concept: string;
  bands: Band[];
  classes: string[];
  featureNames: string[];        // one label per feature dimension
  train: Item[];                 // the child labels these (true cls hidden until TEST)
  test: Item[];                  // 4 unseen examples the model must guess
  /** Pre-labelled, LOCKED training rows — deliberately wrong. GIGO demo. */
  poison?: { item: Item; forcedCls: number }[];
}

const MASTER_LEVELS: LevelDef[] = [
  {
    key: 'cats-dogs', name: 'Cats vs Dogs', emoji: '🐱', difficulty: 'easy', xpReward: 50,
    concept: 'A classifier learns from labelled examples. Sort each one into its true class — the model builds a "prototype" (an average) for each class from YOUR labels.',
    bands: ['A', 'B', 'C'], classes: ['Cat', 'Dog'],
    featureNames: ['Pitch (deep → high)', 'Small (big → small)'],
    train: [
      { id: 'cd-t1', name: 'A kitten mewing', label: 'Kitten mews', feat: [0.90, 0.85], cls: 0 },
      { id: 'cd-t2', name: 'A cat that purrs', label: 'Cat purrs', feat: [0.80, 0.90], cls: 0 },
      { id: 'cd-t3', name: 'A big dog barking', label: 'Dog barks', feat: [0.15, 0.20], cls: 1 },
      { id: 'cd-t4', name: 'A hound that fetches', label: 'Hound fetches', feat: [0.20, 0.10], cls: 1 },
    ],
    test: [
      { id: 'cd-x1', name: 'A tiny high-pitch pet', label: 'Tiny, high pitch', feat: [0.88, 0.80], cls: 0 },
      { id: 'cd-x2', name: 'A large deep-voiced pet', label: 'Large, deep voice', feat: [0.20, 0.15], cls: 1 },
      { id: 'cd-x3', name: 'A soft mewing pet', label: 'Soft mew', feat: [0.75, 0.70], cls: 0 },
      { id: 'cd-x4', name: 'A big fetch-loving pet', label: 'Big, fetches', feat: [0.25, 0.25], cls: 1 },
    ],
  },
  {
    key: 'apple-banana', name: 'Apple vs Banana', emoji: '🍎', difficulty: 'easy', xpReward: 60,
    concept: 'Features separate classes. Shape and colour tell an apple from a banana — the model averages those features per class.',
    bands: ['A', 'B', 'C'], classes: ['Apple', 'Banana'],
    featureNames: ['Shape (round → long)', 'Colour (red → yellow)'],
    train: [
      { id: 'ab-t1', name: 'A round red apple', label: 'Round & red', feat: [0.15, 0.20], cls: 0 },
      { id: 'ab-t2', name: 'A crunchy green apple', label: 'Crunchy apple', feat: [0.20, 0.15], cls: 0 },
      { id: 'ab-t3', name: 'A long yellow banana', label: 'Long & yellow', feat: [0.90, 0.85], cls: 1 },
      { id: 'ab-t4', name: 'A curved ripe banana', label: 'Curved banana', feat: [0.85, 0.90], cls: 1 },
    ],
    test: [
      { id: 'ab-x1', name: 'A round reddish fruit', label: 'Round, reddish', feat: [0.20, 0.25], cls: 0 },
      { id: 'ab-x2', name: 'A long yellow fruit', label: 'Long, yellow', feat: [0.80, 0.85], cls: 1 },
      { id: 'ab-x3', name: 'A small round fruit', label: 'Small, round', feat: [0.25, 0.15], cls: 0 },
      { id: 'ab-x4', name: 'A curved yellow fruit', label: 'Curved, yellow', feat: [0.90, 0.80], cls: 1 },
    ],
  },
  {
    key: 'ripe-unripe', name: 'Ripe or Not', emoji: '🍌', difficulty: 'easy', xpReward: 70,
    concept: 'Clean, balanced labels build a sharp model. Give each class enough correct examples and the prototypes sit far apart.',
    bands: ['A', 'B', 'C'], classes: ['Ripe', 'Unripe'],
    featureNames: ['Softness (hard → soft)', 'Colour (green → yellow)'],
    train: [
      { id: 'ru-t1', name: 'Soft yellow fruit', label: 'Soft & yellow', feat: [0.85, 0.80], cls: 0 },
      { id: 'ru-t2', name: 'Fruit with a sweet smell', label: 'Sweet & soft', feat: [0.80, 0.90], cls: 0 },
      { id: 'ru-t3', name: 'Hard green fruit', label: 'Hard & green', feat: [0.15, 0.20], cls: 1 },
      { id: 'ru-t4', name: 'Bright-green firm fruit', label: 'Firm & green', feat: [0.20, 0.15], cls: 1 },
    ],
    test: [
      { id: 'ru-x1', name: 'A soft golden fruit', label: 'Soft, golden', feat: [0.80, 0.85], cls: 0 },
      { id: 'ru-x2', name: 'A firm green fruit', label: 'Firm, green', feat: [0.20, 0.20], cls: 1 },
      { id: 'ru-x3', name: 'A squishy sweet fruit', label: 'Squishy, sweet', feat: [0.75, 0.80], cls: 0 },
      { id: 'ru-x4', name: 'A hard bright fruit', label: 'Hard, bright', feat: [0.25, 0.25], cls: 1 },
    ],
  },
  {
    key: 'emotions', name: 'Emotion Reader', emoji: '🙂', difficulty: 'medium', xpReward: 90,
    concept: 'More classes = a harder job. The model needs clear features for each one — a smile, low energy, an intense frown.',
    bands: ['B', 'C'], classes: ['Happy', 'Sad', 'Angry'],
    featureNames: ['Mouth (frown → smile)', 'Energy (calm → intense)'],
    train: [
      { id: 'em-t1', name: 'A big bright smile', label: 'Big smile', feat: [0.90, 0.70], cls: 0 },
      { id: 'em-t2', name: 'Laughing out loud', label: 'Laughing', feat: [0.85, 0.75], cls: 0 },
      { id: 'em-t3', name: 'Tears and a slow droop', label: 'Tearful, slow', feat: [0.15, 0.20], cls: 1 },
      { id: 'em-t4', name: 'A quiet drooping head', label: 'Droopy, quiet', feat: [0.20, 0.10], cls: 1 },
      { id: 'em-t5', name: 'A red face, raised voice', label: 'Red, loud', feat: [0.15, 0.85], cls: 2 },
      { id: 'em-t6', name: 'A clenched jaw, tense', label: 'Clenched, tense', feat: [0.20, 0.90], cls: 2 },
    ],
    test: [
      { id: 'em-x1', name: 'A grinning, cheerful face', label: 'Grinning', feat: [0.88, 0.72], cls: 0 },
      { id: 'em-x2', name: 'A frown with low energy', label: 'Low, frowning', feat: [0.20, 0.18], cls: 1 },
      { id: 'em-x3', name: 'A tense, intense frown', label: 'Tense frown', feat: [0.18, 0.80], cls: 2 },
      { id: 'em-x4', name: 'A smiling, lively face', label: 'Smiling, lively', feat: [0.80, 0.68], cls: 0 },
    ],
  },
  {
    key: 'spam-poison', name: 'Spam Filter', emoji: '📧', difficulty: 'hard', xpReward: 120,
    concept: 'Garbage in, garbage out. This dataset already has TWO examples labelled WRONG (flagged in red) — and you cannot fix them. Watch how bad training labels drag a prototype off and cause a wrong guess at test time.',
    bands: ['C'], classes: ['Spam', 'Not Spam'],
    featureNames: ['Urgent hype (low → high)', 'Money bait (low → high)'],
    train: [
      { id: 'sp-t1', name: '"WIN a FREE prize NOW!!!"', label: 'FREE prize!!!', feat: [0.90, 0.85], cls: 0 },
      { id: 'sp-t2', name: '"Click to claim $1000"', label: 'Claim $1000', feat: [0.85, 0.90], cls: 0 },
      { id: 'sp-t3', name: '"Meeting moved to 3pm"', label: 'Meeting 3pm', feat: [0.10, 0.10], cls: 1 },
      { id: 'sp-t4', name: '"Here are the trip photos"', label: 'Trip photos', feat: [0.15, 0.15], cls: 1 },
    ],
    poison: [
      { item: { id: 'sp-p1', name: '"URGENT! Wire cash to claim reward"', label: 'Wire cash NOW', feat: [0.95, 0.90], cls: 0 }, forcedCls: 1 },
      { item: { id: 'sp-p2', name: '"Verify account or lose your money"', label: 'Verify or lose $', feat: [0.90, 0.85], cls: 0 }, forcedCls: 1 },
    ],
    test: [
      { id: 'sp-x1', name: '"WIN FREE CASH — act fast!"', label: 'FREE cash', feat: [0.90, 0.88], cls: 0 },
      { id: 'sp-x2', name: '"Lunch plans for Saturday"', label: 'Lunch plans', feat: [0.12, 0.15], cls: 1 },
      { id: 'sp-x3', name: '"Urgent: claim your prize link"', label: 'Claim prize', feat: [0.60, 0.60], cls: 0 },
      { id: 'sp-x4', name: '"Meeting notes attached"', label: 'Meeting notes', feat: [0.20, 0.25], cls: 1 },
    ],
  },
];

// Band plan. A = only clean 2-class levels. B = adds the 3-class level.
// C = adds the poisoned level + a confusion matrix in the results.
function levelsForBand(band: Band): LevelDef[] {
  return MASTER_LEVELS.filter((l) => l.bands.includes(band));
}

function toLevelConfigs(defs: LevelDef[]): LevelConfig[] {
  return defs.map((d, i) => ({
    id: i + 1,
    name: d.name,
    description: d.concept,
    emoji: d.emoji,
    difficulty: d.difficulty,
    // Score is test accuracy (0–100). Stars: ≥50 / ≥75 / =100.
    starThresholds: [50, 75, 100],
    xpReward: d.xpReward,
    isBonus: d.difficulty === 'hard' || d.difficulty === 'expert',
  }));
}

// ════════════════════════════════════════════════════════════════════════
// SMALL PRESENTATIONAL BITS
// ════════════════════════════════════════════════════════════════════════
function FeatureBars({ feat, names, color }: { feat: number[]; names: string[]; color: string }) {
  return (
    <div className="space-y-1.5" aria-hidden>
      {feat.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate" style={{ fontSize: '0.65rem', color: '#8C94AC' }}>{names[i]}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: '#0E1428' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.round(v * 100)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — welcome → label → train → test
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'label' | 'train' | 'test';

function LevelRenderer({
  def, level, band, onComplete, onExit,
}: {
  def: LevelDef; level: LevelConfig; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;

  const [phase, setPhase] = useState<Phase>('welcome');
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});
  const [training, setTraining] = useState(false);     // TRAIN animation gate
  const [trained, setTrained] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [revealed, setRevealed] = useState(0);         // number of test items shown

  const dim = def.featureNames.length;
  const numClasses = def.classes.length;
  const train = def.train;
  const test = def.test;
  const poison = def.poison ?? [];

  const sortedCount = train.filter((t) => assignments[t.id] !== undefined).length;
  const allLabelled = sortedCount >= train.length;

  // Chips for the Pixi label board (poison chips are NOT here — they arrive
  // pre-labelled and locked, shown in their own panel).
  const sceneItems = useMemo<BinSortItem[]>(
    () => train.map((it, i) => ({ id: it.id, label: it.label, name: it.name, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
    [train],
  );

  // ── The MODEL: prototypes from the child's labels + any poisoned rows. ──
  const prototypes = useMemo(() => {
    const labelled: { feat: number[]; cls: number }[] = [];
    train.forEach((t) => {
      const a = assignments[t.id];
      if (a !== undefined) labelled.push({ feat: t.feat, cls: a });
    });
    poison.forEach((p) => labelled.push({ feat: p.item.feat, cls: p.forcedCls }));
    return buildPrototypes(labelled, numClasses, dim);
  }, [train, assignments, poison, numClasses, dim]);

  // ── Predictions: pure output of the model on the unseen test items. ──
  const predictions = useMemo(() => test.map((t) => {
    const { pred, dists } = classify(t.feat, prototypes);
    return { item: t, pred, dists, correct: pred === t.cls };
  }), [test, prototypes]);

  const correctPreds = predictions.slice(0, revealed).filter((p) => p.correct).length;
  const accuracy = test.length > 0 ? correctPreds / test.length : 0;
  const childLabelErrors = train.filter((t) => assignments[t.id] !== undefined && assignments[t.id] !== t.cls).length;

  // ── Reveal test predictions one at a time (or instantly if reduced motion). ──
  useEffect(() => {
    if (phase !== 'test' || !testStarted) return;
    if (reduced) { setRevealed(test.length); return; }
    if (revealed >= test.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 750);
    return () => clearTimeout(t);
  }, [phase, testStarted, revealed, reduced, test.length]);

  // Fire celebration/thud as each prediction lands.
  const lastFired = useRef(0);
  useEffect(() => {
    if (!testStarted || revealed === 0 || revealed === lastFired.current) return;
    lastFired.current = revealed;
    const p = predictions[revealed - 1];
    if (!p) return;
    if (p.correct) juice.onCorrect(revealed, 0); else juice.onWrong(0, 0);
  }, [revealed, testStarted, predictions, juice]);

  const allRevealed = revealed >= test.length;

  const handleAssign = useCallback((id: string, bin: number) => {
    // Honest labelling: record the child's choice as-is (right OR wrong). No
    // correctness is revealed here — the consequence surfaces at TEST.
    setAssignments((prev) => (prev[id] !== undefined ? prev : { ...prev, [id]: bin }));
  }, []);

  const startTraining = useCallback(() => {
    setPhase('train');
    setTraining(true);
    if (reduced) { setTraining(false); setTrained(true); return; }
    const t = setTimeout(() => { setTraining(false); setTrained(true); }, 1400);
    return () => clearTimeout(t);
  }, [reduced]);

  const runTest = useCallback(() => {
    setPhase('test');
    setTestStarted(true);
  }, []);

  const finishLevel = useCallback(() => {
    const stars = (accuracy >= 1 ? 3 : accuracy >= 0.75 ? 2 : accuracy >= 0.5 ? 1 : 0) as 0 | 1 | 2 | 3;
    const score = Math.round(accuracy * 100);
    onComplete({ score, maxScore: 100, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
  }, [accuracy, level.xpReward, onComplete]);

  // ═══════════════════════════════════════════════════════════════════════
  // WELCOME
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🧠" color={LAB_COLOR}>Level {level.id}: {def.name}</GlowingTitle>

        <div className="rounded-2xl p-5 space-y-3" style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}30` }}>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}14`, color: '#C9D2F0' }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden />
            <span><strong style={{ color: LAB_COLOR }}>Concept:</strong> {def.concept}</span>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3514', color: '#FFB08A' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FF8A5B' }} aria-hidden />
            <span>
              <strong style={{ color: '#FF8A5B' }}>How it works:</strong> First <strong>Label</strong> the examples into
              their classes ({def.classes.join(' · ')}). Then <strong>Train</strong> a model from your labels. Then
              <strong> Test</strong> it on {def.test.length} brand-new examples it has never seen.
            </span>
          </div>
          {poison.length > 0 && (
            <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#EF444414', color: '#F7A9A9' }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#EF4444' }} aria-hidden />
              <span><strong style={{ color: '#EF4444' }}>Heads up:</strong> this dataset already contains mislabelled data you cannot fix. See what it does to the model!</span>
            </div>
          )}
        </div>

        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('label')}>
          Start Labelling <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LABEL — Pixi sort board (kept). Child labels the training examples.
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'label') {
    return (
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <GlowingTitle emoji="🏷️" color={LAB_COLOR}>Label the Training Set</GlowingTitle>
          <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
            <Cpu className="w-4 h-4" aria-hidden />{sortedCount}/{train.length}
          </span>
        </div>

        <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}22`, color: '#C9D2F0' }}>
          <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden />
          <span>Sort each example into its true class. The model learns only from the labels YOU give — so label carefully.</span>
        </div>

        <PixiBinSortStage
          items={sceneItems}
          bins={def.classes}
          assignments={assignments}
          onAssign={handleAssign}
          labColor={LAB_COLOR}
          reducedMotion={reduced}
        />

        {/* Poisoned rows: pre-labelled, LOCKED, honestly shown as bad data. */}
        {poison.length > 0 && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: '#EF444410', border: '1px solid #EF444433' }}>
            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> Pre-labelled data (locked — you cannot change it)
            </p>
            {poison.map((p) => (
              <div key={p.item.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#141B33' }}>
                <span className="text-xs" style={{ color: '#E8ECFF' }}>{p.item.name}</span>
                <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#EF4444' }}>
                  <AlertTriangle className="w-3 h-3" aria-hidden /> labelled “{def.classes[p.forcedCls]}”
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <SFButton variant="primary" className="flex-1" onClick={startTraining} disabled={!allLabelled}>
            <Brain className="w-4 h-4 mr-2" />
            {allLabelled ? 'Train the Model' : `Label ${train.length - sortedCount} more…`}
          </SFButton>
          <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
            <RotateCcw className="w-4 h-4" />
          </SFButton>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRAIN — assemble the prototypes from the child's labels.
  // ═══════════════════════════════════════════════════════════════════════
  if (phase === 'train') {
    const usedCounts = def.classes.map((_, c) => {
      const childN = train.filter((t) => assignments[t.id] === c).length;
      const poisonN = poison.filter((p) => p.forcedCls === c).length;
      return childN + poisonN;
    });

    return (
      <div className="relative z-10 space-y-4">
        <GlowingTitle emoji="🧠" color={LAB_COLOR}>Training Sparky&apos;s Brain</GlowingTitle>

        <div className="rounded-xl p-3 text-xs" style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}22`, color: '#C9D2F0' }} aria-live="polite">
          {training
            ? 'Building a prototype (an average) for each class from your labelled examples…'
            : `Model trained. Each class prototype is the average of the ${train.length + poison.length} examples in the training set — built from YOUR labels.`}
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(numClasses, 2)}, minmax(0, 1fr))` }}>
          {def.classes.map((cls, c) => {
            const color = CLASS_COLORS[c % CLASS_COLORS.length];
            const proto = prototypes[c];
            return (
              <motion.div
                key={cls}
                className="rounded-2xl p-3 space-y-2"
                style={{ background: '#141B33', border: `1px solid ${color}40` }}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: training ? 0.5 : 1, y: 0 }}
                transition={{ delay: reduced ? 0 : c * 0.15 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color }}>{cls}</span>
                  <span style={{ fontSize: '0.65rem', color: '#8C94AC' }}>{usedCounts[c]} example{usedCounts[c] === 1 ? '' : 's'}</span>
                </div>
                {proto
                  ? <FeatureBars feat={proto} names={def.featureNames} color={color} />
                  : <p style={{ fontSize: '0.7rem', color: '#8C94AC' }}>No examples labelled here — this class can never be predicted!</p>}
              </motion.div>
            );
          })}
        </div>

        <SFButton variant="primary" size="lg" className="w-full" onClick={runTest} disabled={training}>
          <Play className="w-5 h-5 mr-2" />
          {training ? 'Training…' : 'Run the Classifier'}
        </SFButton>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TEST — 4 unseen examples; the model guesses each. Confusion matrix (band C).
  // ═══════════════════════════════════════════════════════════════════════
  const liveMsg = allRevealed
    ? `Testing complete. The classifier guessed ${predictions.filter((p) => p.correct).length} of ${test.length} unseen examples correctly.`
    : revealed > 0
      ? `Guessed "${def.classes[predictions[revealed - 1].pred] ?? '—'}" for ${predictions[revealed - 1].item.name}. That guess was ${predictions[revealed - 1].correct ? 'correct' : 'wrong'}.`
      : 'Running the classifier on unseen examples…';

  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔬" color={LAB_COLOR}>Test on Unseen Examples</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Cpu className="w-4 h-4" aria-hidden />{Math.round(accuracy * 100)}%
        </span>
      </div>

      {/* Screen-reader live commentary of each guess. */}
      <p className="sr-only" role="status" aria-live="polite">{liveMsg}</p>

      <div className="space-y-2">
        {predictions.map((p, i) => {
          const shown = i < revealed;
          const predColor = p.pred >= 0 ? CLASS_COLORS[p.pred % CLASS_COLORS.length] : '#8C94AC';
          return (
            <AnimatePresence key={p.item.id}>
              {shown && (
                <motion.div
                  className="rounded-2xl p-3"
                  style={{ background: '#141B33', border: `1px solid ${p.correct ? '#2ECC71' : '#EF4444'}55` }}
                  initial={reduced ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#F5F7FF' }}>{p.item.name}</p>
                      <p style={{ fontSize: '0.7rem', color: '#8C94AC' }}>
                        Guessed <strong style={{ color: predColor }}>{def.classes[p.pred] ?? '—'}</strong>
                        {' · '}truly <strong style={{ color: '#C9D2F0' }}>{def.classes[p.item.cls]}</strong>
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full p-1.5"
                      style={{ background: p.correct ? '#2ECC7122' : '#EF444422' }}
                      aria-hidden
                    >
                      {p.correct
                        ? <Check className="w-4 h-4" style={{ color: '#2ECC71' }} />
                        : <X className="w-4 h-4" style={{ color: '#EF4444' }} />}
                    </span>
                  </div>
                  {/* Distances to each prototype — the "why" behind the guess. */}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {p.dists.map((d, c) => (
                      <span key={c} style={{ fontSize: '0.65rem', color: c === p.pred ? CLASS_COLORS[c % CLASS_COLORS.length] : '#8C94AC' }}>
                        {def.classes[c]}: {d === null ? 'n/a' : d.toFixed(2)}{c === p.pred ? ' ◀ nearest' : ''}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
        {/* Queued placeholders for items not yet guessed. */}
        {test.slice(revealed).map((t) => (
          <div key={t.id} className="rounded-2xl p-3 flex items-center gap-2" style={{ background: '#0E1428', border: '1px dashed #2A3556' }}>
            <span className="rounded-full px-2 py-0.5 text-sm font-bold" style={{ background: '#141B33', color: '#8C94AC' }} aria-hidden>?</span>
            <span style={{ fontSize: '0.75rem', color: '#8C94AC' }}>Unseen example waiting…</span>
          </div>
        ))}
      </div>

      {/* RESULTS — accuracy, GIGO explanation, confusion matrix (band C). */}
      {allRevealed && (
        <motion.div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: '#0E1428', border: `1px solid ${LAB_COLOR}30` }}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-bold" style={{ color: '#F5F7FF' }}>
            Accuracy: <span style={{ color: LAB_COLOR }}>{predictions.filter((p) => p.correct).length}/{test.length}</span>
            {' '}({Math.round(accuracy * 100)}%)
          </p>

          <p className="text-xs" style={{ color: '#C9D2F0' }}>
            {predictions.every((p) => p.correct)
              ? 'Clean labels in, sharp model out — every unseen example was guessed correctly!'
              : poison.length > 0
                ? 'The dataset held examples labelled WRONG (the flagged rows). Those bad labels dragged a prototype into the wrong place, so the model mis-guessed a real example. Garbage in, garbage out.'
                : childLabelErrors > 0
                  ? `${childLabelErrors} training example${childLabelErrors === 1 ? ' was' : 's were'} labelled wrong — that shifted the prototypes and caused ${predictions.filter((p) => !p.correct).length} wrong guess${predictions.filter((p) => !p.correct).length === 1 ? '' : 'es'}. Re-label to fix it!`
                  : 'A couple of examples sat right on the boundary between classes — that is where classifiers slip.'}
          </p>

          {band === 'C' && (
            <div className="space-y-1.5">
              <p style={{ fontSize: '0.7rem', color: '#8C94AC' }}>Confusion matrix — rows = true class, columns = the model&apos;s guess:</p>
              <div className="overflow-x-auto">
                <table style={{ fontSize: '0.65rem', color: '#C9D2F0', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th className="p-1.5" aria-label="true class over guessed class">true ＼ guess</th>
                      {def.classes.map((c, ci) => (
                        <th key={c} className="p-1.5" style={{ color: CLASS_COLORS[ci % CLASS_COLORS.length] }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {def.classes.map((rowCls, r) => (
                      <tr key={rowCls}>
                        <td className="p-1.5 font-bold" style={{ color: CLASS_COLORS[r % CLASS_COLORS.length] }}>{rowCls}</td>
                        {def.classes.map((_, cc) => {
                          const n = predictions.filter((p) => p.item.cls === r && p.pred === cc).length;
                          const onDiag = r === cc;
                          return (
                            <td
                              key={cc}
                              className="p-1.5 text-center font-bold"
                              style={{
                                background: n === 0 ? '#141B33' : onDiag ? '#2ECC7126' : '#EF444426',
                                color: n === 0 ? '#5A6078' : onDiag ? '#2ECC71' : '#EF4444',
                                border: '1px solid #2A3556',
                              }}
                            >
                              {n}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={finishLevel} disabled={!allRevealed}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allRevealed ? 'Finish Level' : 'Classifying…'}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <ArrowRight className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function BuildClassifierGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const defs = useMemo(() => levelsForBand(band), [band]);
  const levels = useMemo(() => toLevelConfigs(defs), [defs]);

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = results.length * 3;
    const frac = maxStars > 0 ? totalStars / maxStars : 0;
    awardXP(Math.round(totalXP));
    // Fires once, 1–3 stars, based on overall test accuracy across levels.
    completeGame('build-classifier', frac >= 0.8 ? 3 : frac >= 0.5 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Build a Classifier" color={LAB_COLOR} labNum={7}>
      <GameLevelSystem
        gameTitle="Build a Classifier"
        gameEmoji="🧠"
        labColor={LAB_COLOR}
        levels={levels}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer
            key={level.id}
            def={defs[level.id - 1]}
            level={level}
            band={band}
            onComplete={onComplete}
            onExit={onExit}
          />
        )}
      />
    </GameShell>
  );
}
