// ════════════════════════════════════════════════════════════════════════
// THINKING CAP — Lab 4 — reasoning models / chain-of-thought (NEW-5)
// ════════════════════════════════════════════════════════════════════════
// Two AI contestants answer riddles and word problems:
//   • Blurt Bot — fires a fast answer, often wrong (no visible thinking).
//   • Thinker   — shows a numbered chain-of-thought, then an answer.
//
// The lesson is two-sided:
//   1. Thinking BEFORE answering usually beats blurting (why reasoning
//      models exist).
//   2. Shown reasoning STILL needs checking — a tidy, confident-looking
//      step can quietly be wrong (bad arithmetic or a false assumption).
//
// Two round mechanics, escalating across ~5 rounds:
//   • TRUST  — pick which contestant to trust. Usually the reasoner, but a
//     plausible blurt can trap you.
//   • INSPECT — read the Thinker's numbered steps and tap the WRONG one
//     (or "All steps look correct" — sometimes they really are), then pick
//     the corrected final answer.
//
// G1 honesty: nothing is pre-marked; the flawed step and the true answer
// are revealed only after the child commits. DOM/SVG only — fully keyboard
// operable, reveals announced via aria-live. Dark Frost-Prismatic surface.
// Reports XP + 1–3 stars exactly once via
// useGameActions().awardXP + completeGame('thinking-cap', stars).

'use client';

import { useState, useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Brain, Sparkles, Lightbulb, ChevronRight, RotateCcw,
  Check, X, CircleAlert, ScanSearch, Star, Trophy,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';

// ── Palette (dark surface, inline hex — no text-white/NN utilities) ──────
const ACCENT = '#D9A430';               // Lab 4 quiz-show gold
const SURFACE = '#0E1428';              // page surface
const PANEL = '#141B33';                // raised card
const CELL = '#1B2340';                 // interactive cell
const INK = '#EAF0F6';                  // primary text
const DIM = '#9AA4BE';                  // secondary text
const HAIR = 'rgba(255,255,255,0.12)';
const GOOD = '#33D69F';
const BAD = '#FF6B7D';
const BLURT = '#FF9F45';                // Blurt Bot accent
const THINK = '#6EA8FF';                // Thinker accent

type Band = 'B' | 'C';

// ── Round data model ─────────────────────────────────────────────────────
interface TrustRound {
  kind: 'trust';
  id: number;
  prompt: string;
  blurtAnswer: string;
  steps: string[];
  thinkerAnswer: string;
  trust: 'blurt' | 'thinker'; // who the child SHOULD trust
  correctAnswer: string;
  why: string;
}

interface InspectRound {
  kind: 'inspect';
  id: number;
  prompt: string;
  steps: string[];
  thinkerAnswer: string;
  /** Index of the flawed step, or null when every step is sound. */
  flawStep: number | null;
  options: string[];
  correctAnswer: string;
  stepWhy: string; // why that step is wrong (or why all steps hold)
  why: string;
}

type Round = TrustRound | InspectRound;

const MAX_PER_ROUND = 20; // trust: 20 pick · inspect: 10 step + 10 answer

// ── Content: Band B (gentler) ────────────────────────────────────────────
const ROUNDS_B: Round[] = [
  {
    kind: 'trust',
    id: 1,
    prompt: 'A farmer has 4 baskets. Each basket holds 5 apples. How many apples in all?',
    blurtAnswer: '9 apples',
    steps: [
      '4 baskets, and each one holds 5 apples.',
      'That is 5 + 5 + 5 + 5.',
      '5 + 5 + 5 + 5 = 20.',
    ],
    thinkerAnswer: '20 apples',
    trust: 'thinker',
    correctAnswer: '20 apples',
    why: 'Blurt Bot just added 4 + 5 = 9 without thinking. The Thinker showed its steps and multiplied 4 × 5 = 20. Thinking it through won.',
  },
  {
    kind: 'trust',
    id: 2,
    prompt: 'Which is bigger: one half (1/2) or one third (1/3) of the same pizza?',
    blurtAnswer: 'One third — 3 is bigger than 2!',
    steps: [
      'Picture a pizza cut into 2 equal parts, then one cut into 3.',
      'More cuts means each slice is smaller.',
      'So 1/2 is a bigger slice than 1/3.',
    ],
    thinkerAnswer: 'One half (1/2)',
    trust: 'thinker',
    correctAnswer: 'One half (1/2)',
    why: 'Blurt Bot saw "3 is bigger than 2" and guessed. The Thinker pictured the slices: more pieces means smaller pieces, so 1/2 is bigger. The bigger number was a trap.',
  },
  {
    kind: 'inspect',
    id: 3,
    prompt: 'A movie starts at 3:00 and lasts 90 minutes. What time does it end?',
    steps: [
      '90 minutes is 1 hour and 30 minutes.',
      '3:00 plus 1 hour is 4:00.',
      '4:00 plus 30 minutes is 4:30.',
    ],
    thinkerAnswer: '4:30',
    flawStep: null,
    options: ['3:90', '4:30', '4:90'],
    correctAnswer: '4:30',
    stepWhy: 'Every step holds up: 90 min is 1h 30, and 3:00 + 1:30 = 4:30.',
    why: 'This time the Thinker was right. A good checker does not force a mistake that is not there — sometimes the steps really are all correct.',
  },
  {
    kind: 'inspect',
    id: 4,
    prompt: 'You buy 3 pens at 4 coins each and pay with a 20-coin note. How much change?',
    steps: [
      '3 pens at 4 coins each: 3 × 4 = 12 coins.',
      'I paid with a 20-coin note.',
      'Change = 20 − 12 = 9 coins.',
    ],
    thinkerAnswer: '9 coins',
    flawStep: 2,
    options: ['6 coins', '8 coins', '9 coins'],
    correctAnswer: '8 coins',
    stepWhy: 'Step 3 is wrong: 20 − 12 = 8, not 9. The first two steps were fine, but one bad subtraction spoiled the answer.',
    why: 'The reasoning LOOKED careful, but step 3 had a math slip. Even shown steps need checking — a wrong step gives a wrong answer.',
  },
  {
    kind: 'inspect',
    id: 5,
    prompt: 'A pencil and an eraser cost 12 coins together. The pencil costs 10 coins more than the eraser. How much is the eraser?',
    steps: [
      'The pencil costs 10 more than the eraser, and together they are 12.',
      'Try eraser = 2: then call the pencil 10, and 2 + 10 = 12. It adds up!',
      'So the eraser is 2 coins.',
    ],
    thinkerAnswer: '2 coins',
    flawStep: 1,
    options: ['1 coin', '2 coins', '3 coins'],
    correctAnswer: '1 coin',
    stepWhy: 'Step 2 sneaks in a false assumption: it makes the pencil just 10, but the pencil must be 10 MORE than the eraser. If the eraser is 2, the pencil is 12, and that totals 14 — not 12.',
    why: 'This is the big one. The Thinker showed its work and sounded sure — but step 2 quietly assumed the wrong thing. The real answer: eraser = 1, pencil = 11 (11 is 10 more than 1, and 1 + 11 = 12). Shown reasoning still has to be checked.',
  },
];

// ── Content: Band C (harder — more trap rounds) ──────────────────────────
const ROUNDS_C: Round[] = [
  {
    kind: 'trust',
    id: 1,
    prompt: 'A shirt costs 40 coins. It is on sale for 25% off. What is the sale price?',
    blurtAnswer: '15 coins — take off 25!',
    steps: [
      '25% of 40 is the discount to subtract.',
      '25% is one quarter, and a quarter of 40 is 10.',
      'Sale price = 40 − 10 = 30 coins.',
    ],
    thinkerAnswer: '30 coins',
    trust: 'thinker',
    correctAnswer: '30 coins',
    why: 'Blurt Bot subtracted 25 as if the percent were coins. The Thinker found 25% OF 40 = 10, then 40 − 10 = 30. Percent means "out of 100", not a flat number of coins.',
  },
  {
    kind: 'inspect',
    id: 2,
    prompt: 'A tank holds 60 litres. It is 3/4 full. How many litres are in it?',
    steps: [
      'The tank is 3/4 full of its 60-litre capacity.',
      '1/4 of 60 is 15.',
      'Three quarters is 3 × 15 = 45 litres.',
    ],
    thinkerAnswer: '45 litres',
    flawStep: null,
    options: ['20 litres', '45 litres', '80 litres'],
    correctAnswer: '45 litres',
    stepWhy: 'All three steps hold up: 1/4 of 60 is 15, and three quarters is 3 × 15 = 45.',
    why: 'The Thinker was right this time. A careful checker confirms sound reasoning instead of inventing a flaw that is not there.',
  },
  {
    kind: 'inspect',
    id: 3,
    prompt: 'A bus has 32 seats. 4 rows of 6 people are seated. How many seats are empty?',
    steps: [
      '4 rows of 6 people: 4 × 6 = 24 people seated.',
      'The bus has 32 seats in total.',
      'Empty seats = 32 − 24 = 12.',
    ],
    thinkerAnswer: '12 seats',
    flawStep: 2,
    options: ['8 seats', '12 seats', '14 seats'],
    correctAnswer: '8 seats',
    stepWhy: 'Step 3 is off: 32 − 24 = 8, not 12. The setup was right, but the subtraction slipped.',
    why: 'Careful-looking steps, one bad subtraction. That is exactly why you check each step instead of trusting a neat layout.',
  },
  {
    kind: 'inspect',
    id: 4,
    prompt: 'A bat and a ball cost 12 coins together. The bat costs 10 coins more than the ball. How much is the ball?',
    steps: [
      'The bat and ball are 12 together, and the bat is 10 more than the ball.',
      'Try ball = 2: then I will call the bat 10, and 2 + 10 = 12. It adds up!',
      'So the ball is 2 coins.',
    ],
    thinkerAnswer: '2 coins',
    flawStep: 1,
    options: ['1 coin', '2 coins', '3 coins'],
    correctAnswer: '1 coin',
    stepWhy: 'Step 2 hides a false assumption: it makes the bat just 10, but the bat must be 10 MORE than the ball. If the ball is 2, the bat is 12, and the total is 14 — not 12.',
    why: 'The classic trap. The Thinker showed its work and sounded sure, yet step 2 assumed the wrong thing. Real answer: ball = 1, bat = 11 (11 is 10 more than 1, and 1 + 11 = 12).',
  },
  {
    kind: 'inspect',
    id: 5,
    prompt: 'All cats are animals. Some animals are dogs. The Thinker concludes: "So some cats are dogs." Is that right?',
    steps: [
      'All cats are animals — that is true.',
      'Some animals are dogs — that is true.',
      'Cats and dogs are both animals, so some cats must be dogs.',
    ],
    thinkerAnswer: 'Yes, some cats are dogs',
    flawStep: 2,
    options: ['Yes, some cats are dogs', 'No — that does not follow', 'Only kittens are dogs'],
    correctAnswer: 'No — that does not follow',
    stepWhy: 'Step 3 jumps to a false conclusion. Sharing the group "animals" does NOT connect cats to dogs — both being animals never makes a cat a dog.',
    why: 'Every sentence sounded logical, but step 3 linked two facts that do not actually connect. Confident, tidy reasoning can still hide a wrong leap — always check the link between steps.',
  },
];

// ── Small helpers ─────────────────────────────────────────────────────────
function starsFromPct(pct: number): 1 | 2 | 3 {
  if (pct >= 0.85) return 3;
  if (pct >= 0.55) return 2;
  return 1;
}

function StarRow({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          style={{
            width: size,
            height: size,
            color: s <= count ? ACCENT : HAIR,
            fill: s <= count ? ACCENT : 'none',
          }}
        />
      ))}
    </span>
  );
}

function SparkyLine({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-2xl px-3 py-2.5"
      style={{ background: PANEL, border: `1px solid ${HAIR}` }}
    >
      <span
        className="mt-0.5 flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 28, height: 28, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
      >
        <Sparkles style={{ width: 15, height: 15, color: ACCENT }} aria-hidden="true" />
      </span>
      <p className="text-sm leading-snug" style={{ color: INK }}>
        <span className="font-semibold" style={{ color: ACCENT }}>Sparky: </span>
        {text}
      </p>
    </div>
  );
}

// Shared accent CTA (rolled inline to stay on the dark surface).
function AccentButton({
  children, onClick, disabled, ariaLabel,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:scale-[1.03] enabled:active:scale-95"
      style={{
        background: disabled ? CELL : `linear-gradient(135deg, ${ACCENT}, #C4881E)`,
        color: disabled ? DIM : '#1A1206',
        ['--tw-ring-color' as string]: ACCENT,
        ['--tw-ring-offset-color' as string]: SURFACE,
      }}
    >
      {children}
    </button>
  );
}

// ── Contestant card (Blurt Bot / Thinker) ────────────────────────────────
function ContestantHead({ who }: { who: 'blurt' | 'thinker' }) {
  const isBlurt = who === 'blurt';
  const color = isBlurt ? BLURT : THINK;
  const Icon = isBlurt ? Zap : Brain;
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center rounded-xl"
        style={{ width: 30, height: 30, background: `${color}22`, border: `1px solid ${color}55` }}
      >
        <Icon style={{ width: 17, height: 17, color }} aria-hidden="true" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-bold" style={{ color: INK }}>
          {isBlurt ? 'Blurt Bot' : 'Thinker'}
        </div>
        <div className="text-xs" style={{ color: DIM }}>
          {isBlurt ? 'answers fast' : 'shows its steps'}
        </div>
      </div>
    </div>
  );
}

function StepList({
  steps, flaggedIndex, revealedFlaw,
}: {
  steps: string[]; flaggedIndex?: number | null; revealedFlaw?: number | null;
}) {
  return (
    <ol className="flex flex-col gap-1.5">
      {steps.map((s, i) => {
        const isChosen = flaggedIndex === i;
        const isTrueFlaw = revealedFlaw != null && revealedFlaw === i;
        let borderColor = HAIR;
        if (isTrueFlaw) borderColor = BAD;
        else if (isChosen) borderColor = ACCENT;
        return (
          <li
            key={i}
            className="flex items-start gap-2 rounded-xl px-3 py-2"
            style={{ background: CELL, border: `1px solid ${borderColor}` }}
          >
            <span
              className="mt-0.5 flex shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ width: 20, height: 20, background: `${THINK}22`, color: THINK }}
            >
              {i + 1}
            </span>
            <span className="text-sm leading-snug" style={{ color: INK }}>{s}</span>
            {isTrueFlaw && (
              <CircleAlert style={{ width: 16, height: 16, color: BAD }} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ════════════════════════════════════════════════════════════════════════
// TRUST ROUND — pick which contestant to trust, then reveal
// ════════════════════════════════════════════════════════════════════════
function TrustRoundView({
  def, roundNo, totalRounds, onFinish,
}: {
  def: TrustRound; roundNo: number; totalRounds: number; onFinish: (score: number) => void;
}) {
  const [picked, setPicked] = useState<'blurt' | 'thinker' | null>(null);
  const [revealed, setRevealed] = useState(false);

  const correct = picked === def.trust;
  const score = correct ? MAX_PER_ROUND : 0;

  const cardStyle = (who: 'blurt' | 'thinker'): CSSProperties => {
    const isPicked = picked === who;
    const color = who === 'blurt' ? BLURT : THINK;
    let border = isPicked ? color : HAIR;
    if (revealed) {
      if (who === def.trust) border = GOOD;
      else if (isPicked) border = BAD;
    }
    return { background: PANEL, border: `2px solid ${border}` };
  };

  return (
    <div className="flex flex-col gap-3">
      <RoundHeader roundNo={roundNo} totalRounds={totalRounds} label="Who do you trust?" icon="trust" />
      <SparkyLine text={`Round ${roundNo}. Two contestants, one question. Read them both, then trust the one you believe.`} />

      <div className="rounded-2xl px-3 py-2.5" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: ACCENT }}>
          <Lightbulb style={{ width: 14, height: 14 }} aria-hidden="true" /> The question
        </div>
        <p className="text-sm" style={{ color: INK }}>{def.prompt}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Blurt Bot */}
        <button
          type="button"
          onClick={revealed ? undefined : () => setPicked('blurt')}
          disabled={revealed}
          aria-pressed={picked === 'blurt'}
          aria-label={`Blurt Bot answers: ${def.blurtAnswer}. Trust Blurt Bot.`}
          className="flex flex-col gap-2 rounded-2xl p-3 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:scale-[1.01]"
          style={{ ...cardStyle('blurt'), ['--tw-ring-color' as string]: BLURT, ['--tw-ring-offset-color' as string]: SURFACE }}
        >
          <ContestantHead who="blurt" />
          <div className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: CELL, color: INK }}>
            &ldquo;{def.blurtAnswer}&rdquo;
          </div>
        </button>

        {/* Thinker */}
        <button
          type="button"
          onClick={revealed ? undefined : () => setPicked('thinker')}
          disabled={revealed}
          aria-pressed={picked === 'thinker'}
          aria-label={`Thinker shows ${def.steps.length} steps and answers: ${def.thinkerAnswer}. Trust the Thinker.`}
          className="flex flex-col gap-2 rounded-2xl p-3 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:scale-[1.01]"
          style={{ ...cardStyle('thinker'), ['--tw-ring-color' as string]: THINK, ['--tw-ring-offset-color' as string]: SURFACE }}
        >
          <ContestantHead who="thinker" />
          <StepList steps={def.steps} />
          <div className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: CELL, color: INK }}>
            Answer: &ldquo;{def.thinkerAnswer}&rdquo;
          </div>
        </button>
      </div>

      {!revealed ? (
        <div className="flex justify-end">
          <AccentButton onClick={() => setRevealed(true)} disabled={picked === null}>
            Lock in my choice <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
          </AccentButton>
        </div>
      ) : (
        <RevealPanel correct={correct} correctAnswer={def.correctAnswer} why={def.why}>
          <AccentButton onClick={() => onFinish(score)} ariaLabel={roundNo === totalRounds ? 'See results' : 'Next round'}>
            {roundNo === totalRounds ? 'See results' : 'Next round'} <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
          </AccentButton>
        </RevealPanel>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INSPECT ROUND — tap the wrong step (or all-correct), then the true answer
// ════════════════════════════════════════════════════════════════════════
const ALL_CORRECT = -1; // sentinel for the "no flawed step" choice

function InspectRoundView({
  def, roundNo, totalRounds, onFinish,
}: {
  def: InspectRound; roundNo: number; totalRounds: number; onFinish: (score: number) => void;
}) {
  const [stepPick, setStepPick] = useState<number | null>(null);
  const [answerPick, setAnswerPick] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const expectedStepPick = def.flawStep === null ? ALL_CORRECT : def.flawStep;
  const stepCorrect = stepPick === expectedStepPick;
  const answerCorrect = answerPick === def.correctAnswer;
  const score = (stepCorrect ? 10 : 0) + (answerCorrect ? 10 : 0);
  const bothRight = stepCorrect && answerCorrect;

  return (
    <div className="flex flex-col gap-3">
      <RoundHeader roundNo={roundNo} totalRounds={totalRounds} label="Inspect the Thinker" icon="inspect" />
      <SparkyLine text={`Round ${roundNo}. The Thinker showed its work. Tap the step that is WRONG — or say every step looks correct — then pick the true answer.`} />

      <div className="rounded-2xl px-3 py-2.5" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: ACCENT }}>
          <Lightbulb style={{ width: 14, height: 14 }} aria-hidden="true" /> The question
        </div>
        <p className="text-sm" style={{ color: INK }}>{def.prompt}</p>
      </div>

      {/* Step picker */}
      <div role="group" aria-label="Tap the step that is wrong, or choose all steps are correct">
        <div className="mb-1.5 flex items-center gap-2">
          <ContestantHead who="thinker" />
        </div>
        <ol className="flex flex-col gap-1.5">
          {def.steps.map((s, i) => {
            const isChosen = stepPick === i;
            const isTrueFlaw = revealed && def.flawStep === i;
            let border = HAIR;
            if (isTrueFlaw) border = BAD;
            else if (isChosen) border = ACCENT;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={revealed ? undefined : () => setStepPick(i)}
                  disabled={revealed}
                  aria-pressed={isChosen}
                  aria-label={`Step ${i + 1}: ${s}. Mark this step as wrong.`}
                  className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:brightness-125"
                  style={{ background: CELL, border: `1px solid ${border}`, ['--tw-ring-color' as string]: ACCENT, ['--tw-ring-offset-color' as string]: SURFACE }}
                >
                  <span className="mt-0.5 flex shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ width: 20, height: 20, background: `${THINK}22`, color: THINK }}>
                    {i + 1}
                  </span>
                  <span className="text-sm leading-snug" style={{ color: INK }}>{s}</span>
                  {isTrueFlaw && <CircleAlert style={{ width: 16, height: 16, color: BAD }} className="ml-auto mt-0.5 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Thinker's stated answer + the all-correct option */}
        <div className="mt-1.5 rounded-xl px-3 py-2 text-sm" style={{ background: SURFACE, border: `1px dashed ${HAIR}`, color: DIM }}>
          Thinker&rsquo;s answer: <span className="font-semibold" style={{ color: INK }}>{def.thinkerAnswer}</span>
        </div>

        <button
          type="button"
          onClick={revealed ? undefined : () => setStepPick(ALL_CORRECT)}
          disabled={revealed}
          aria-pressed={stepPick === ALL_CORRECT}
          aria-label="All steps look correct."
          className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:brightness-125"
          style={{
            background: CELL,
            border: `1px solid ${stepPick === ALL_CORRECT ? (revealed && def.flawStep === null ? GOOD : ACCENT) : HAIR}`,
            ['--tw-ring-color' as string]: ACCENT,
            ['--tw-ring-offset-color' as string]: SURFACE,
          }}
        >
          <Check style={{ width: 16, height: 16, color: GOOD }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: INK }}>All steps look correct</span>
        </button>
      </div>

      {/* Answer picker */}
      <div role="group" aria-label="Pick the corrected final answer">
        <div className="mb-1.5 text-xs font-semibold" style={{ color: ACCENT }}>The true answer is…</div>
        <div className="grid gap-1.5 sm:grid-cols-3">
          {def.options.map((opt) => {
            const isChosen = answerPick === opt;
            const isTrue = revealed && opt === def.correctAnswer;
            let border = HAIR;
            if (isTrue) border = GOOD;
            else if (isChosen) border = revealed ? BAD : ACCENT;
            return (
              <button
                key={opt}
                type="button"
                onClick={revealed ? undefined : () => setAnswerPick(opt)}
                disabled={revealed}
                aria-pressed={isChosen}
                aria-label={`Answer: ${opt}`}
                className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 enabled:hover:brightness-125"
                style={{ background: CELL, border: `1px solid ${border}`, color: INK, ['--tw-ring-color' as string]: ACCENT, ['--tw-ring-offset-color' as string]: SURFACE }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {!revealed ? (
        <div className="flex justify-end">
          <AccentButton
            onClick={() => setRevealed(true)}
            disabled={stepPick === null || answerPick === null}
          >
            Commit <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
          </AccentButton>
        </div>
      ) : (
        <RevealPanel correct={bothRight} correctAnswer={def.correctAnswer} why={def.why} extra={def.stepWhy}>
          <AccentButton onClick={() => onFinish(score)} ariaLabel={roundNo === totalRounds ? 'See results' : 'Next round'}>
            {roundNo === totalRounds ? 'See results' : 'Next round'} <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
          </AccentButton>
        </RevealPanel>
      )}
    </div>
  );
}

// ── Shared round header ───────────────────────────────────────────────────
function RoundHeader({
  roundNo, totalRounds, label, icon,
}: {
  roundNo: number; totalRounds: number; label: string; icon: 'trust' | 'inspect';
}) {
  const Icon = icon === 'trust' ? Sparkles : ScanSearch;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon style={{ width: 18, height: 18, color: ACCENT }} aria-hidden="true" />
        <h2 className="text-base font-bold" style={{ color: INK }}>{label}</h2>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: i + 1 === roundNo ? 20 : 8,
              height: 8,
              background: i + 1 <= roundNo ? ACCENT : HAIR,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Reveal panel (aria-live) ──────────────────────────────────────────────
function RevealPanel({
  correct, correctAnswer, why, extra, children,
}: {
  correct: boolean; correctAnswer: string; why: string; extra?: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl p-3"
      style={{ background: PANEL, border: `1px solid ${correct ? GOOD : BAD}55` }}
    >
      <div aria-live="polite" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center rounded-full"
            style={{ width: 26, height: 26, background: correct ? `${GOOD}22` : `${BAD}22` }}
          >
            {correct
              ? <Check style={{ width: 16, height: 16, color: GOOD }} aria-hidden="true" />
              : <X style={{ width: 16, height: 16, color: BAD }} aria-hidden="true" />}
          </span>
          <span className="text-sm font-bold" style={{ color: correct ? GOOD : BAD }}>
            {correct ? 'Nice thinking!' : 'Not quite — but now you see it.'}
          </span>
        </div>
        <p className="text-sm" style={{ color: INK }}>
          <span className="font-semibold" style={{ color: ACCENT }}>True answer: </span>{correctAnswer}
        </p>
        {extra && <p className="text-sm" style={{ color: INK }}>{extra}</p>}
        <p className="text-sm leading-snug" style={{ color: DIM }}>{why}</p>
      </div>
      <div className="flex justify-end">{children}</div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INTRO + COMPLETE
// ════════════════════════════════════════════════════════════════════════
function Intro({ band, onStart }: { band: Band; onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-center">
      <span
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 60, height: 60, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
      >
        <Brain style={{ width: 30, height: 30, color: ACCENT }} aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-xl font-bold" style={{ color: INK }}>Thinking Cap</h1>
        <p className="mt-1 text-sm" style={{ color: DIM }}>
          A quiz show with two AI contestants. Learn why thinking beats blurting — and why even shown thinking needs checking.
        </p>
      </div>

      <div className="grid w-full gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl p-3 text-left" style={{ background: PANEL, border: `1px solid ${BLURT}44` }}>
          <ContestantHead who="blurt" />
          <p className="text-sm" style={{ color: DIM }}>Fires an answer instantly. Fast — but often wrong.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl p-3 text-left" style={{ background: PANEL, border: `1px solid ${THINK}44` }}>
          <ContestantHead who="thinker" />
          <p className="text-sm" style={{ color: DIM }}>Shows numbered steps first. Usually right — but check each step!</p>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1.5 text-left">
        {[
          'Some rounds: pick which contestant to trust.',
          'Other rounds: tap the Thinker’s WRONG step, then give the true answer.',
          'Watch out — sometimes the shown reasoning is confidently wrong.',
        ].map((t, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
            <ChevronRight style={{ width: 16, height: 16, color: ACCENT }} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="text-sm" style={{ color: INK }}>{t}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs" style={{ color: DIM }}>
        {band === 'C' ? '5 rounds · harder problems with more reasoning traps.' : '5 rounds · warming up your inner checker.'}
      </p>

      <AccentButton onClick={onStart} ariaLabel="Start Thinking Cap">
        Start the show <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
      </AccentButton>
    </motion.div>
  );
}

function CompletePanel({
  score, maxScore, stars, onReplay,
}: {
  score: number; maxScore: number; stars: 1 | 2 | 3; onReplay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 rounded-3xl p-6 text-center"
      style={{ background: PANEL, border: `1px solid ${ACCENT}55` }}
      role="dialog"
      aria-modal="true"
      aria-label={`Show complete: ${stars} of 3 stars, score ${score} of ${maxScore}`}
    >
      <motion.span
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${ACCENT}, #C4881E)` }}
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
      >
        <Trophy style={{ width: 32, height: 32, color: '#1A1206' }} aria-hidden="true" />
      </motion.span>
      <div>
        <h2 className="text-xl font-bold" style={{ color: INK }}>Cap earned!</h2>
        <p className="mt-1 text-sm" style={{ color: DIM }}>
          You thought it through — and caught the reasoning that wasn&rsquo;t as smart as it looked.
        </p>
      </div>
      <div aria-live="polite"><StarRow count={stars} size={30} /></div>
      <p className="text-sm" style={{ color: DIM }}>
        Score <span className="font-bold" style={{ color: INK }}>{score}</span> / {maxScore}
      </p>
      <button
        type="button"
        onClick={onReplay}
        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ background: CELL, color: INK, border: `1px solid ${HAIR}`, ['--tw-ring-color' as string]: ACCENT, ['--tw-ring-offset-color' as string]: SURFACE }}
      >
        <RotateCcw style={{ width: 16, height: 16 }} aria-hidden="true" /> Play again
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════
export default function ThinkingCapGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const rounds = useMemo<Round[]>(() => (band === 'C' ? ROUNDS_C : ROUNDS_B), [band]);
  const maxScore = rounds.length * MAX_PER_ROUND;

  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0); // remounts a round for a clean reset
  const firedRef = useRef(false);

  const stars = useMemo<1 | 2 | 3>(() => starsFromPct(maxScore ? score / maxScore : 0), [score, maxScore]);

  const finishRound = useCallback((roundScore: number) => {
    setScore((s) => s + roundScore);
    setRoundIndex((idx) => {
      const next = idx + 1;
      if (next >= rounds.length) {
        setDone(true);
        return idx;
      }
      setAttempt((a) => a + 1);
      return next;
    });
  }, [rounds.length]);

  // Award XP + completion exactly once (ref-guarded) after the final round.
  useEffect(() => {
    if (!done || firedRef.current) return;
    firedRef.current = true;
    const xp = 40 + Math.round((score / (maxScore || 1)) * 120); // 40–160
    awardXP(xp);
    completeGame('thinking-cap', stars);
  }, [done, score, maxScore, stars, awardXP, completeGame]);

  const replay = useCallback(() => {
    firedRef.current = false;
    setStarted(false);
    setRoundIndex(0);
    setScore(0);
    setDone(false);
    setAttempt((a) => a + 1);
  }, []);

  const current = rounds[roundIndex];

  return (
    <GameShell title="Thinking Cap" color={ACCENT} labNum={4}>
      <div className="relative mx-auto flex max-w-2xl flex-col gap-3 p-4">
        {!started ? (
          <Intro band={band} onStart={() => setStarted(true)} />
        ) : (
          <AnimatePresence mode="wait">
            {current.kind === 'trust' ? (
              <TrustRoundView
                key={`t-${current.id}-${attempt}`}
                def={current}
                roundNo={roundIndex + 1}
                totalRounds={rounds.length}
                onFinish={finishRound}
              />
            ) : (
              <InspectRoundView
                key={`i-${current.id}-${attempt}`}
                def={current}
                roundNo={roundIndex + 1}
                totalRounds={rounds.length}
                onFinish={finishRound}
              />
            )}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {done && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(4,8,20,0.72)', backdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <CompletePanel score={score} maxScore={maxScore} stars={stars} onReplay={replay} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
