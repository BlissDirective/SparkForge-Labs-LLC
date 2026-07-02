// ════════════════════════════════════════════════════════════════
// LANDING MICRO GAME — "Teach Sparky to Sort"
// ════════════════════════════════════════════════════════════════
// A self-contained ~20-second playable classifier demo placed
// directly under the hero. Pure DOM/React — no canvas, no new deps.
// 3 rounds of tap-to-sort, then a "you just trained an AI" payoff
// with a CTA into signup. Score-free: wrong answers just retry.

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, RotateCcw, Sparkles } from 'lucide-react';
import GradientText from '@/components/bits/GradientText';
import { SparkyStatic } from '@/components/sparky/SparkyStatic';
import type { SparkyExpression } from '@/components/sparky/SparkyCore';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ── Round data ──

interface SortBin {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface SortRound {
  toy: { emoji: string; name: string };
  bins: [SortBin, SortBin];
  correctBinId: string;
  prompt: string;
  lesson: string;
  wrongHint: string;
}

const ROUNDS: SortRound[] = [
  {
    toy: { emoji: '🐟', name: 'fish' },
    bins: [
      { id: 'animals', label: 'Animals', emoji: '🐾', color: '#2ECC71' },
      { id: 'vehicles', label: 'Vehicles', emoji: '🚗', color: '#4F6EF7' },
    ],
    correctBinId: 'animals',
    prompt: 'Where does the fish go?',
    lesson: 'I learned: fish = animal!',
    wrongHint: 'Hmm… a fish is not a vehicle. Try again!',
  },
  {
    toy: { emoji: '🍌', name: 'banana' },
    bins: [
      { id: 'food', label: 'Food', emoji: '🍎', color: '#FFD93D' },
      { id: 'vehicles', label: 'Vehicles', emoji: '✈️', color: '#4F6EF7' },
    ],
    correctBinId: 'food',
    prompt: 'Where does the banana go?',
    lesson: 'I learned: banana = food!',
    wrongHint: "Hmm… you can't drive a banana. Try again!",
  },
  {
    toy: { emoji: '🐕', name: 'dog' },
    bins: [
      { id: 'animals', label: 'Animals', emoji: '🐾', color: '#2ECC71' },
      { id: 'food', label: 'Food', emoji: '🍌', color: '#FFD93D' },
    ],
    correctBinId: 'animals',
    prompt: 'Where does the dog go?',
    lesson: 'I learned: dog = animal!',
    wrongHint: 'Hmm… a dog is a friend, not food. Try again!',
  },
];

const TOTAL_ROUNDS = ROUNDS.length;
const DONE_MESSAGE =
  "You just trained an AI classifier — that's machine learning!";
const START_BUBBLE = "Show me where each toy goes — I'm learning from you!";

type GamePhase = 'playing' | 'correct' | 'wrong' | 'done';

// ── Sparkle burst (confetti-ish, simple motion divs) ──

const SPARKLE_COLORS = ['#E945F5', '#FFD93D', '#4F6EF7', '#2ECC71'];

function SparkleBurst({ burstKey }: { burstKey: number }) {
  return (
    <div key={burstKey} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const distance = 55 + (i % 3) * 18;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0.2,
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{
              backgroundColor: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
              boxShadow: `0 0 8px ${SPARKLE_COLORS[i % SPARKLE_COLORS.length]}`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main component ──

export function LandingMicroGame() {
  const reducedMotion = useReducedMotion();

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [expression, setExpression] = useState<SparkyExpression>('idle');
  const [bubble, setBubble] = useState(START_BUBBLE);
  const [burstKey, setBurstKey] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const schedule = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const round = ROUNDS[roundIndex];
  const trained =
    roundIndex + (phase === 'correct' ? 1 : 0) + (phase === 'done' ? TOTAL_ROUNDS - roundIndex : 0);

  const handleBinPick = (binId: string) => {
    if (phase === 'correct' || phase === 'done') return;

    if (binId === round.correctBinId) {
      setPhase('correct');
      setExpression('celebrating');
      setBubble(round.lesson);
      setBurstKey((k) => k + 1);
      schedule(() => {
        if (roundIndex + 1 >= TOTAL_ROUNDS) {
          setPhase('done');
          setExpression('celebrating');
          setBubble(DONE_MESSAGE);
        } else {
          setRoundIndex(roundIndex + 1);
          setPhase('playing');
          setExpression('idle');
          setBubble(ROUNDS[roundIndex + 1].prompt);
        }
      }, 1400);
    } else {
      // No fail state — Sparky is briefly sad, then the kid tries again.
      setPhase('wrong');
      setExpression('sad');
      setBubble(round.wrongHint);
      schedule(() => {
        setPhase('playing');
        setExpression('idle');
      }, 900);
    }
  };

  const handleRestart = () => {
    clearTimers();
    setRoundIndex(0);
    setPhase('playing');
    setExpression('idle');
    setBubble(START_BUBBLE);
    setBurstKey(0);
  };

  return (
    <section
      className="relative py-20 sm:py-28 px-4 overflow-hidden"
      style={{ backgroundColor: '#0A0F1E' }}
      aria-labelledby="micro-game-heading"
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ width: 700, height: 350, background: 'radial-gradient(ellipse, #E945F520, transparent 70%)' }}
      />

      <div className="max-w-3xl mx-auto relative">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(233,69,245,0.1)', border: '1px solid rgba(233,69,245,0.2)' }}
          >
            <Gamepad2 className="w-4 h-4" style={{ color: '#E945F5' }} />
            <span className="text-sm font-semibold" style={{ color: '#E945F5' }}>
              Playable Demo · 20 Seconds
            </span>
          </div>
          <h2
            id="micro-game-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="text-white">Try it </span>
            <GradientText from="#E945F5" to="#4F6EF7">right now</GradientText>
            <span className="text-white"> — no signup</span>
          </h2>
          <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'rgba(248,250,255,0.5)' }}>
            Teach Sparky to Sort — tap the right bin and watch a real AI idea click into place.
          </p>
        </motion.div>

        {/* ═══ GAME CARD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 25% 0px' }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 sm:p-10"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex flex-col items-center gap-8">
            {/* ── Sparky + speech bubble ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <SparkyStatic expression={expression} size="md" showAura />
                {burstKey > 0 && !reducedMotion && <SparkleBurst burstKey={burstKey} />}
              </div>
              <div
                role="status"
                aria-live="polite"
                className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-xs text-center sm:text-left"
                style={{
                  background: 'linear-gradient(135deg, #1A1D3B, #2A2D4F)',
                  border: '1px solid rgba(233,69,245,0.15)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <p className="text-sm" style={{ color: 'rgba(248,250,255,0.9)' }}>
                  {bubble}
                </p>
              </div>
            </div>

            {phase !== 'done' ? (
              <>
                {/* ── Round counter + toy ── */}
                <div className="text-center">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: 'rgba(248,250,255,0.45)' }}
                  >
                    Round {roundIndex + 1} of {TOTAL_ROUNDS}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={roundIndex}
                      initial={{ opacity: 0, scale: 0.6, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="text-6xl sm:text-7xl leading-none select-none"
                      role="img"
                      aria-label={`Toy to sort: ${round.toy.name}`}
                    >
                      {round.toy.emoji}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ── Bins ── */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {round.bins.map((bin) => (
                    <motion.button
                      key={`${roundIndex}-${bin.id}`}
                      type="button"
                      onClick={() => handleBinPick(bin.id)}
                      disabled={phase === 'correct'}
                      whileHover={reducedMotion ? undefined : { scale: 1.04, y: -2 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                      aria-label={`Sort the ${round.toy.name} into the ${bin.label} bin`}
                      className="flex flex-col items-center gap-2 py-6 px-4 rounded-2xl font-semibold text-white transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${bin.color}40`,
                        outlineColor: bin.color,
                      }}
                    >
                      <span className="text-4xl" aria-hidden="true">
                        {bin.emoji}
                      </span>
                      <span className="text-base" style={{ color: bin.color }}>
                        {bin.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              /* ── Done panel ── */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-5 text-center"
              >
                <p
                  className="text-lg sm:text-xl font-bold max-w-md"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <span className="text-white">You just trained an </span>
                  <GradientText from="#E945F5" to="#4F6EF7">AI classifier</GradientText>
                  <span className="text-white"> — that&apos;s machine learning!</span>
                </p>
                <a
                  href="/signup"
                  aria-label="Play 42 more games — start free by creating an account"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
                    boxShadow: '0 4px 20px rgba(233, 69, 245, 0.35)',
                  }}
                >
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  Play 42 more games — Start Free
                </a>
                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label="Restart the Teach Sparky to Sort demo"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
                  style={{ color: 'rgba(248,250,255,0.5)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Train Sparky again
                </button>
              </motion.div>
            )}

            {/* ── Training meter ── */}
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(248,250,255,0.45)' }}
                >
                  Training Meter
                </span>
                <span className="text-xs font-semibold" style={{ color: '#E945F5' }}>
                  {trained}/{TOTAL_ROUNDS} examples
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Sparky training progress"
                aria-valuemin={0}
                aria-valuemax={TOTAL_ROUNDS}
                aria-valuenow={trained}
                className="h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  initial={false}
                  animate={{ width: `${(trained / TOTAL_ROUNDS) * 100}%` }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 120, damping: 20 }
                  }
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #E945F5, #4F6EF7)',
                    boxShadow: '0 0 12px rgba(233,69,245,0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
