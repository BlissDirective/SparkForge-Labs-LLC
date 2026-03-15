// ════════════════════════════════════════════════════════════════════════
// BUILD A CLASSIFIER — Lab 7 (Computer Vision) — STANDARD POLISH
//
// Concept: Collect training images (emoji-based), label them into
// categories, train a simulated classifier, then test it on new
// images. Teaches the full ML training pipeline.
//
// Features:
// • Chrome bezel (cyan, Lab 7)
// • Particle background
// • Welcome + learn phases
// • 3-step pipeline: Collect → Train → Test
// • Visual training progress animation
// • Confusion matrix on results
// • Age-band depth (C: precision/recall, overfitting)
// • ARIA labels
// ════════════════════════════════════════════════════════════════════════
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  BookOpen,
  Database,
  Cpu,
  TestTube,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type Phase = 'welcome' | 'learn' | 'collect' | 'train' | 'test' | 'results';

interface TrainingImage {
  emoji: string;
  label: string;
}

interface TestImage {
  emoji: string;
  trueLabel: string;
  predicted?: string;
  correct?: boolean;
}

const CATEGORIES = ['Animal', 'Food', 'Vehicle'];

const CATEGORY_COLORS: Record<string, string> = {
  Animal: '#10B981',
  Food: '#F59E0B',
  Vehicle: '#3B82F6',
};

const TRAINING_POOL: TrainingImage[] = [
  { emoji: '🐕', label: 'Animal' },
  { emoji: '🐈', label: 'Animal' },
  { emoji: '🐘', label: 'Animal' },
  { emoji: '🐢', label: 'Animal' },
  { emoji: '🦁', label: 'Animal' },
  { emoji: '🐧', label: 'Animal' },
  { emoji: '🍕', label: 'Food' },
  { emoji: '🍔', label: 'Food' },
  { emoji: '🌮', label: 'Food' },
  { emoji: '🍎', label: 'Food' },
  { emoji: '🧁', label: 'Food' },
  { emoji: '🍩', label: 'Food' },
  { emoji: '🚗', label: 'Vehicle' },
  { emoji: '✈️', label: 'Vehicle' },
  { emoji: '🚀', label: 'Vehicle' },
  { emoji: '🚲', label: 'Vehicle' },
  { emoji: '🚢', label: 'Vehicle' },
  { emoji: '🚁', label: 'Vehicle' },
];

const TEST_IMAGES: TestImage[] = [
  { emoji: '🐬', trueLabel: 'Animal' },
  { emoji: '🦅', trueLabel: 'Animal' },
  { emoji: '🐸', trueLabel: 'Animal' },
  { emoji: '🍇', trueLabel: 'Food' },
  { emoji: '🌽', trueLabel: 'Food' },
  { emoji: '🍰', trueLabel: 'Food' },
  { emoji: '🚂', trueLabel: 'Vehicle' },
  { emoji: '🛵', trueLabel: 'Vehicle' },
  { emoji: '🚤', trueLabel: 'Vehicle' },
];

// Tricky items — ambiguous to simulate classifier errors
const TRICK_TESTS: TestImage[] = [
  { emoji: '🐴', trueLabel: 'Animal' }, // horse — might confuse with vehicle (horsepower?)
  { emoji: '🌵', trueLabel: 'Food' }, // cactus — not food but might confuse
  { emoji: '🛒', trueLabel: 'Vehicle' }, // shopping cart — has wheels but...
];

const LEARN_CARDS = [
  {
    title: 'Training Data',
    emoji: '📊',
    desc: 'AI learns from examples. The more good examples you give it, the better it gets at classifying new things.',
  },
  {
    title: 'Labels',
    emoji: '🏷️',
    desc: 'Each training image needs a label — like teaching a child "this is a dog" by pointing at many dogs.',
  },
  {
    title: 'Training',
    emoji: '🧠',
    desc: 'The AI finds patterns in your labeled data. More data and better labels lead to a smarter classifier.',
  },
  {
    title: 'Testing',
    emoji: '🧪',
    desc: "We test with NEW images the AI hasn't seen before. This tells us how well it truly learned — not just memorized.",
  },
];

export function BuildClassifierGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);

  // Collect phase
  const [labeledData, setLabeledData] = useState<
    { emoji: string; assignedLabel: string }[]
  >([]);
  const [currentPoolIdx, setCurrentPoolIdx] = useState(0);

  // Train phase
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  // Test phase
  const allTests = useMemo(() => {
    const base = [...TEST_IMAGES];
    if (ageBand === 'C') base.push(...TRICK_TESTS);
    return base;
  }, [ageBand]);
  const [testIdx, setTestIdx] = useState(0);
  const [testResults, setTestResults] = useState<TestImage[]>([]);

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  const currentImage = TRAINING_POOL[currentPoolIdx];

  const dataBalance = CATEGORIES.map((c) => ({
    cat: c,
    count: labeledData.filter((d) => d.assignedLabel === c).length,
  }));

  function labelImage(category: string) {
    setLabeledData((prev) => [
      ...prev,
      { emoji: currentImage.emoji, assignedLabel: category },
    ]);
    if (currentPoolIdx < TRAINING_POOL.length - 1) setCurrentPoolIdx((i) => i + 1);
    else setPhase('train');
  }

  function skipImage() {
    if (currentPoolIdx < TRAINING_POOL.length - 1) setCurrentPoolIdx((i) => i + 1);
    else if (labeledData.length >= 9) setPhase('train');
  }

  async function startTraining() {
    setIsTraining(true);
    for (let i = 0; i <= 100; i += 5) {
      setTrainingProgress(i);
      await new Promise((r) => setTimeout(r, 80));
    }
    setIsTraining(false);
    setPhase('test');
  }

  function classifyTest(category: string) {
    const test = allTests[testIdx];
    const correct = category === test.trueLabel;
    setTestResults((prev) => [...prev, { ...test, predicted: category, correct }]);

    if (correct) game.updateScore(8);

    if (testIdx < allTests.length - 1) {
      setTestIdx((i) => i + 1);
      game.advanceRound();
    } else {
      setTimeout(() => setPhase('results'), 500);
    }
  }

  function finishGame() {
    const correctCount = testResults.filter((r) => r.correct).length;
    game.updateScore(correctCount >= allTests.length * 0.8 ? 15 : 5);
    game.completeGame();
  }

  // Confusion matrix for results
  const confusionMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    CATEGORIES.forEach((c) => {
      matrix[c] = {};
      CATEGORIES.forEach((c2) => (matrix[c][c2] = 0));
    });
    testResults.forEach((r) => {
      if (r.predicted) {
        matrix[r.trueLabel][r.predicted] = (matrix[r.trueLabel][r.predicted] || 0) + 1;
      }
    });
    return matrix;
  }, [testResults]);

  const accuracy =
    testResults.length > 0
      ? Math.round(
          (testResults.filter((r) => r.correct).length / testResults.length) * 100
        )
      : 0;

  return (
    <GameShell
      gameId="build-classifier"
      title="Build a Classifier"
      worldNumber={7}
      worldColor="#06B6D4"
      totalRounds={allTests.length}
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background:
                  'radial-gradient(circle, rgba(6,182,212,0.15), transparent)',
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(6,182,212,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="flex-1 flex flex-col p-4 overflow-auto">
              <AnimatePresence mode="wait">
                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div
                    key="w"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
                  >
                    <motion.span
                      className="text-6xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🤖
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Build a Classifier
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C'
                        ? 'Experience the full ML pipeline: data collection, labeling, model training, and evaluation with precision/recall analysis.'
                        : 'Collect training images, label them, train your AI, and test it! See how data quality affects AI accuracy.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['ML Pipeline', 'Classification', 'Training Data'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-body text-[10px] text-cyan-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Learn the pipeline"
                    >
                      Learn the Pipeline! <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-cyan-500/20 bg-cyan-500/5"
                      >
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-cyan-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60 mt-2">
                          {LEARN_CARDS[learnIdx].desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button
                      onClick={() => {
                        if (learnIdx < 3) setLearnIdx((i) => i + 1);
                        else setPhase('collect');
                      }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {learnIdx < 3 ? 'Next →' : 'Start Collecting! 📊'}
                    </motion.button>
                    <button
                      onClick={() => setPhase('collect')}
                      className="font-body text-xs text-white/20 hover:text-white/40"
                    >
                      Skip intro →
                    </button>
                  </motion.div>
                )}

                {/* COLLECT — label training images */}
                {phase === 'collect' && currentImage && (
                  <motion.div
                    key="c"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-3"
                  >
                    {/* Pipeline progress */}
                    <div className="flex items-center gap-1 mb-3">
                      {['Collect', 'Train', 'Test'].map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              i === 0
                                ? 'bg-cyan-500/30 text-cyan-300'
                                : 'bg-white/5 text-white/20'
                            }`}
                          >
                            {i + 1}
                          </div>
                          <span
                            className={`font-body text-[9px] ${
                              i === 0 ? 'text-cyan-400' : 'text-white/20'
                            }`}
                          >
                            {s}
                          </span>
                          {i < 2 && <div className="w-6 h-[1px] bg-white/10" />}
                        </div>
                      ))}
                    </div>

                    {/* Data balance */}
                    <div className="flex gap-3 mb-3">
                      {dataBalance.map((d) => (
                        <div key={d.cat} className="text-center">
                          <p
                            className="font-display text-lg font-bold"
                            style={{ color: CATEGORY_COLORS[d.cat] }}
                          >
                            {d.count}
                          </p>
                          <p className="font-body text-[8px] text-white/30">{d.cat}</p>
                        </div>
                      ))}
                    </div>

                    {/* Current image */}
                    <motion.div
                      key={currentPoolIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-28 h-28 rounded-2xl bg-white/5 border border-cyan-500/15 flex items-center justify-center text-5xl"
                    >
                      {currentImage.emoji}
                    </motion.div>

                    <p className="font-body text-[10px] text-white/30 mb-3">
                      Image {currentPoolIdx + 1}/{TRAINING_POOL.length}
                    </p>

                    {/* Category buttons */}
                    <div className="flex gap-2 mb-2">
                      {CATEGORIES.map((cat) => (
                        <motion.button
                          key={cat}
                          onClick={() => labelImage(cat)}
                          className="px-5 py-3 rounded-xl border font-display text-sm font-bold"
                          style={{
                            borderColor: `${CATEGORY_COLORS[cat]}40`,
                            color: CATEGORY_COLORS[cat],
                          }}
                          whileTap={{ scale: 0.95 }}
                          aria-label={`Label as ${cat}`}
                        >
                          <Database className="inline w-3 h-3 mr-1" /> {cat}
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={skipImage}
                        className="font-body text-[10px] text-white/20 hover:text-white/40"
                      >
                        Skip →
                      </button>
                      {labeledData.length >= 9 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setPhase('train')}
                          className="px-3 py-1.5 rounded-lg font-display text-[10px] font-bold text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20"
                          whileTap={{ scale: 0.95 }}
                          aria-label="Skip to training with current data"
                        >
                          <Cpu className="inline w-3 h-3 mr-1" />
                          Ready to Train ({labeledData.length} labeled)
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* TRAIN */}
                {phase === 'train' && (
                  <motion.div
                    key="tr"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <Cpu className="w-8 h-8 text-cyan-400" />
                    <h3 className="font-display text-lg font-bold text-white">
                      Training Your Classifier
                    </h3>
                    <p className="font-body text-xs text-white/40">
                      You labeled {labeledData.length} images across {CATEGORIES.length}{' '}
                      categories.
                    </p>

                    {/* Balance warning */}
                    {dataBalance.some((d) => d.count < 3) && (
                      <div className="rounded-xl p-2 border border-amber-500/20 bg-amber-500/5">
                        <p className="font-body text-[10px] text-amber-400">
                          ⚠️ Some categories have very few examples — this might reduce
                          accuracy!
                        </p>
                      </div>
                    )}

                    {/* Training bar */}
                    <div className="w-full max-w-xs">
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                          animate={{ width: `${trainingProgress}%` }}
                        />
                      </div>
                      <p className="font-mono text-xs text-cyan-400 mt-1">
                        {trainingProgress}%
                      </p>
                    </div>

                    {!isTraining && trainingProgress === 0 && (
                      <motion.button
                        onClick={startTraining}
                        className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                        style={{
                          background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Start training"
                      >
                        Train! <Cpu className="inline w-4 h-4 ml-1" />
                      </motion.button>
                    )}

                    {ageBand === 'C' && (
                      <p className="font-body text-[9px] text-white/20 max-w-sm">
                        Training iterates over labeled data, adjusting weights to minimize
                        classification loss. More balanced data reduces overfitting to
                        majority classes.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* TEST */}
                {phase === 'test' && testIdx < allTests.length && (
                  <motion.div
                    key="te"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center"
                  >
                    {/* Pipeline progress */}
                    <div className="flex items-center gap-1 mb-3">
                      {['Collect', 'Train', 'Test'].map((s, i) => (
                        <div key={s} className="flex items-center gap-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                              i === 2
                                ? 'bg-cyan-500/30 text-cyan-300'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {i < 2 ? '✓' : '3'}
                          </div>
                          <span
                            className={`font-body text-[9px] ${
                              i === 2 ? 'text-cyan-400' : 'text-green-400/50'
                            }`}
                          >
                            {s}
                          </span>
                          {i < 2 && <div className="w-6 h-[1px] bg-green-500/20" />}
                        </div>
                      ))}
                    </div>

                    <TestTube className="w-5 h-5 text-cyan-400 mb-2" />
                    <p className="font-display text-xs font-bold text-white/40 mb-3">
                      Test {testIdx + 1}/{allTests.length}
                    </p>

                    <motion.div
                      key={testIdx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-24 h-24 rounded-2xl bg-white/5 border border-cyan-500/15 flex items-center justify-center text-4xl mb-4"
                    >
                      {allTests[testIdx].emoji}
                    </motion.div>

                    <div className="flex gap-2">
                      {CATEGORIES.map((cat) => (
                        <motion.button
                          key={cat}
                          onClick={() => classifyTest(cat)}
                          className="px-5 py-3 rounded-xl border font-display text-sm font-bold"
                          style={{
                            borderColor: `${CATEGORY_COLORS[cat]}40`,
                            color: CATEGORY_COLORS[cat],
                          }}
                          whileTap={{ scale: 0.95 }}
                          aria-label={`Classify as ${cat}`}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>

                    {/* Recent results */}
                    {testResults.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {testResults.map((r, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${
                              r.correct
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {r.correct ? '✓' : '✗'}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* RESULTS */}
                {phase === 'results' && (
                  <motion.div
                    key="r"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-3"
                  >
                    <BarChart3 className="w-6 h-6 text-cyan-400" />
                    <h3 className="font-display text-xl font-bold text-white">
                      Classifier Results
                    </h3>

                    {/* Accuracy */}
                    <div
                      className="inline-block px-6 py-2 rounded-full"
                      style={{
                        background:
                          accuracy >= 80
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : accuracy >= 60
                              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                              : 'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                    >
                      <span className="font-display text-lg font-bold text-white">
                        Accuracy: {accuracy}%
                      </span>
                    </div>

                    {/* Result icons */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      {testResults.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5"
                        >
                          <span className="text-sm">{r.emoji}</span>
                          {r.correct ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Confusion matrix (Band C) */}
                    {ageBand === 'C' && (
                      <div className="rounded-xl p-3 border border-cyan-500/15 bg-cyan-500/5">
                        <p className="font-display text-[10px] font-bold text-cyan-300 mb-2 text-center">
                          Confusion Matrix
                        </p>
                        <table className="w-full text-center">
                          <thead>
                            <tr>
                              <th className="font-body text-[8px] text-white/20 p-1">
                                True ↓ / Pred →
                              </th>
                              {CATEGORIES.map((c) => (
                                <th
                                  key={c}
                                  className="font-body text-[8px] p-1"
                                  style={{ color: CATEGORY_COLORS[c] }}
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CATEGORIES.map((row) => (
                              <tr key={row}>
                                <td
                                  className="font-body text-[8px] p-1"
                                  style={{ color: CATEGORY_COLORS[row] }}
                                >
                                  {row}
                                </td>
                                {CATEGORIES.map((col) => (
                                  <td
                                    key={col}
                                    className={`font-mono text-xs p-1 ${
                                      row === col ? 'text-green-400' : 'text-red-400/50'
                                    }`}
                                  >
                                    {confusionMatrix[row]?.[col] || 0}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Training data insight */}
                    <div className="rounded-xl p-2 border border-white/5 bg-white/[0.02] text-center">
                      <p className="font-body text-[9px] text-white/30">
                        {accuracy >= 80
                          ? '🎯 Great dataset! Balanced training data leads to better accuracy.'
                          : accuracy >= 60
                            ? '📊 Decent, but some categories were under-represented in training.'
                            : '⚠️ Low accuracy — try labeling more examples per category next time!'}
                      </p>
                    </div>

                    <motion.button
                      onClick={finishGame}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Complete game"
                    >
                      Complete! 🎉
                    </motion.button>
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
