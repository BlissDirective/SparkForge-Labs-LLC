// ════════════════════════════════════════════════════════════════════════
// WORD PREDICTOR v5 — Lab 4 (AI That Creates) — TWO-BEAT PREDICTION DRILL
// ════════════════════════════════════════════════════════════════════════
// The core insight: a language model doesn't have "one right answer" — it
// outputs a probability DISTRIBUTION over next words. So we teach it as a
// two-beat loop:
//
//   BEAT 1 (commit): the sentence + candidate words appear with NO bars.
//     A commit timer adds arcade tension. The child taps the word they
//     think is likeliest next — a genuine prediction under uncertainty.
//   BEAT 2 (reveal): the distribution animates in — bars fill for EVERY
//     candidate. The child is scored by the probability of THEIR pick:
//     full credit for the top word, PARTIAL credit for plausible-but-not-
//     top words. Prediction is about likelihood, not one right answer.
//
// G1 honesty (S4.5): probabilities are NEVER shown on the pre-commit card.
// The distribution is revealed strictly AFTER the child commits.
//
// Band-C bonus: a Temperature Lab shows the same sentence at temp 0 (always
// the top word) vs temp 1 (samples the distribution — surprising words
// appear), so kids feel what temperature does.

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, Timer, Crown, Thermometer, Dices, ArrowRight,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter,
} from '@/components/games/shared/GameVisualKit';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#D9A430';

// Tuning ----------------------------------------------------------------
const ROUNDS = 8;                 // prompts played per level (pool is 11+)
const POINTS_TOP = 22;            // full credit for picking the top word
const COMBO_STEP = 2;             // bonus per consecutive top pick
const COMBO_CAP = 4;              // combo bonus caps at COMBO_CAP*COMBO_STEP
const MAX_SCORE = ROUNDS * (POINTS_TOP + COMBO_CAP * COMBO_STEP); // 240
// Commit-timer length by band (arcade tension; A gets more thinking time).
const COMMIT_MS: Record<AgeBand, number> = { A: 8000, B: 6000, C: 5000 };

// ── 5 levels (was 10) — each with a 11+ prompt pool ──
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Everyday Sentences', description: 'Tap the word that most likely comes next.', emoji: '📝', difficulty: 'easy', starThresholds: [90, 150, 200], xpReward: 60 },
  { id: 2, name: 'Famous Phrases', description: 'Complete well-known sayings & rhymes.', emoji: '📚', difficulty: 'easy', starThresholds: [95, 150, 205], xpReward: 80 },
  { id: 3, name: 'Science & Facts', description: 'Predict the likeliest technical word.', emoji: '🔬', difficulty: 'medium', starThresholds: [100, 160, 205], xpReward: 110 },
  { id: 4, name: 'Double Meanings', description: 'Flat odds — several words are plausible!', emoji: '🤔', difficulty: 'hard', starThresholds: [100, 160, 210], xpReward: 140 },
  { id: 5, name: 'Code & Tokens', description: 'Predict the next code token — and meet temperature.', emoji: '💻', difficulty: 'expert', starThresholds: [105, 165, 215], xpReward: 180, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A language model scores every possible next word, then predicts the one with the highest probability. Read the sentence and guess before the odds are revealed.',
  2: 'Famous phrases are very high-probability — the model has seen them thousands of times, so one word wins by a landslide.',
  3: 'Even a technical blank has a likeliest word, because facts appear together often in the text the model learned from.',
  4: 'When a word has many meanings, the distribution FLATTENS — several next-words become almost equally likely. There is rarely one "right" answer.',
  5: 'Code is highly predictable: syntax limits what token can legally come next. Temperature then decides how boldly the model samples that distribution.',
};

// ════════════════════════════════════════════════════════════════════════
// PROMPT POOLS — sentence with a "___" blank + candidates with real-ish prob.
// Each pool spans peaked → flat so band selection (below) has range to pull
// from: band A takes the most peaked (obvious), band C the flattest.
// ════════════════════════════════════════════════════════════════════════
interface Candidate { word: string; prob: number; }
interface Prompt { text: string; candidates: Candidate[]; }

const POOLS: Record<number, Prompt[]> = {
  1: [
    { text: 'The dog wagged its ___', candidates: [{ word: 'tail', prob: 0.90 }, { word: 'ears', prob: 0.05 }, { word: 'paw', prob: 0.03 }, { word: 'nose', prob: 0.02 }] },
    { text: 'The cat sat on the ___', candidates: [{ word: 'mat', prob: 0.82 }, { word: 'rug', prob: 0.09 }, { word: 'moon', prob: 0.05 }, { word: 'water', prob: 0.04 }] },
    { text: 'The sun is very ___', candidates: [{ word: 'hot', prob: 0.70 }, { word: 'bright', prob: 0.18 }, { word: 'blue', prob: 0.07 }, { word: 'tiny', prob: 0.05 }] },
    { text: 'I drink a glass of ___', candidates: [{ word: 'water', prob: 0.66 }, { word: 'milk', prob: 0.22 }, { word: 'juice', prob: 0.09 }, { word: 'rocks', prob: 0.03 }] },
    { text: 'Close the window, it is getting ___', candidates: [{ word: 'cold', prob: 0.58 }, { word: 'dark', prob: 0.22 }, { word: 'late', prob: 0.16 }, { word: 'loud', prob: 0.04 }] },
    { text: 'She opened the door and said ___', candidates: [{ word: 'hello', prob: 0.55 }, { word: 'hi', prob: 0.22 }, { word: 'goodbye', prob: 0.13 }, { word: 'banana', prob: 0.10 }] },
    { text: 'We turned off the ___', candidates: [{ word: 'lights', prob: 0.50 }, { word: 'TV', prob: 0.26 }, { word: 'water', prob: 0.16 }, { word: 'sky', prob: 0.08 }] },
    { text: 'The baby began to ___', candidates: [{ word: 'cry', prob: 0.48 }, { word: 'laugh', prob: 0.28 }, { word: 'sleep', prob: 0.18 }, { word: 'code', prob: 0.06 }] },
    { text: 'He put on his ___ before school', candidates: [{ word: 'shoes', prob: 0.40 }, { word: 'backpack', prob: 0.28 }, { word: 'jacket', prob: 0.26 }, { word: 'roof', prob: 0.06 }] },
    { text: 'Please pass the ___', candidates: [{ word: 'salt', prob: 0.38 }, { word: 'butter', prob: 0.26 }, { word: 'bread', prob: 0.22 }, { word: 'guitar', prob: 0.14 }] },
    { text: 'I am going to ___ now', candidates: [{ word: 'sleep', prob: 0.34 }, { word: 'eat', prob: 0.30 }, { word: 'leave', prob: 0.28 }, { word: 'fly', prob: 0.08 }] },
  ],
  2: [
    { text: 'It is raining cats and ___', candidates: [{ word: 'dogs', prob: 0.92 }, { word: 'frogs', prob: 0.03 }, { word: 'mice', prob: 0.03 }, { word: 'hats', prob: 0.02 }] },
    { text: 'Twinkle, twinkle, little ___', candidates: [{ word: 'star', prob: 0.92 }, { word: 'light', prob: 0.05 }, { word: 'moon', prob: 0.03 }] },
    { text: 'Practice makes ___', candidates: [{ word: 'perfect', prob: 0.91 }, { word: 'better', prob: 0.07 }, { word: 'noise', prob: 0.02 }] },
    { text: 'To be or not to ___', candidates: [{ word: 'be', prob: 0.94 }, { word: 'see', prob: 0.04 }, { word: 'flee', prob: 0.02 }] },
    { text: 'An apple a day keeps the ___ away', candidates: [{ word: 'doctor', prob: 0.90 }, { word: 'teacher', prob: 0.05 }, { word: 'monster', prob: 0.03 }, { word: 'cat', prob: 0.02 }] },
    { text: 'Better late than ___', candidates: [{ word: 'never', prob: 0.90 }, { word: 'sorry', prob: 0.06 }, { word: 'early', prob: 0.04 }] },
    { text: 'A picture is worth a thousand ___', candidates: [{ word: 'words', prob: 0.90 }, { word: 'dollars', prob: 0.05 }, { word: 'pixels', prob: 0.04 }, { word: 'cats', prob: 0.01 }] },
    { text: 'The early bird catches the ___', candidates: [{ word: 'worm', prob: 0.89 }, { word: 'bus', prob: 0.06 }, { word: 'sun', prob: 0.03 }, { word: 'ball', prob: 0.02 }] },
    { text: 'Actions speak louder than ___', candidates: [{ word: 'words', prob: 0.89 }, { word: 'sounds', prob: 0.06 }, { word: 'drums', prob: 0.04 }, { word: 'cats', prob: 0.01 }] },
    { text: 'Roses are red, violets are ___', candidates: [{ word: 'blue', prob: 0.88 }, { word: 'sweet', prob: 0.07 }, { word: 'green', prob: 0.03 }, { word: 'purple', prob: 0.02 }] },
    { text: 'The quick brown fox jumps over the lazy ___', candidates: [{ word: 'dog', prob: 0.86 }, { word: 'cat', prob: 0.07 }, { word: 'log', prob: 0.05 }, { word: 'fox', prob: 0.02 }] },
    { text: 'When in Rome, do as the ___ do', candidates: [{ word: 'Romans', prob: 0.84 }, { word: 'locals', prob: 0.08 }, { word: 'robots', prob: 0.05 }, { word: 'cats', prob: 0.03 }] },
  ],
  3: [
    { text: 'Ice is frozen ___', candidates: [{ word: 'water', prob: 0.90 }, { word: 'cream', prob: 0.05 }, { word: 'air', prob: 0.03 }, { word: 'time', prob: 0.02 }] },
    { text: 'The Earth orbits the ___', candidates: [{ word: 'Sun', prob: 0.90 }, { word: 'Moon', prob: 0.06 }, { word: 'Mars', prob: 0.03 }, { word: 'void', prob: 0.01 }] },
    { text: 'Water is made of hydrogen and ___', candidates: [{ word: 'oxygen', prob: 0.88 }, { word: 'carbon', prob: 0.06 }, { word: 'helium', prob: 0.04 }, { word: 'salt', prob: 0.02 }] },
    { text: 'The mitochondria is the ___ of the cell', candidates: [{ word: 'powerhouse', prob: 0.84 }, { word: 'brain', prob: 0.08 }, { word: 'heart', prob: 0.05 }, { word: 'engine', prob: 0.03 }] },
    { text: 'Bees help flowers by carrying ___', candidates: [{ word: 'pollen', prob: 0.82 }, { word: 'honey', prob: 0.10 }, { word: 'water', prob: 0.05 }, { word: 'wifi', prob: 0.03 }] },
    { text: 'The freezing point of water is zero ___', candidates: [{ word: 'degrees', prob: 0.78 }, { word: 'kelvin', prob: 0.10 }, { word: 'celsius', prob: 0.09 }, { word: 'meters', prob: 0.03 }] },
    { text: 'The speed of ___ is very fast', candidates: [{ word: 'light', prob: 0.70 }, { word: 'sound', prob: 0.22 }, { word: 'cars', prob: 0.05 }, { word: 'thought', prob: 0.03 }] },
    { text: 'Plants make food using ___', candidates: [{ word: 'sunlight', prob: 0.62 }, { word: 'water', prob: 0.20 }, { word: 'soil', prob: 0.12 }, { word: 'wifi', prob: 0.06 }] },
    { text: 'A triangle has three ___', candidates: [{ word: 'sides', prob: 0.56 }, { word: 'angles', prob: 0.30 }, { word: 'corners', prob: 0.12 }, { word: 'wheels', prob: 0.02 }] },
    { text: 'Humans breathe in oxygen and breathe out ___', candidates: [{ word: 'carbon', prob: 0.52 }, { word: 'air', prob: 0.28 }, { word: 'smoke', prob: 0.13 }, { word: 'fire', prob: 0.07 }] },
    { text: 'Gravity pulls objects toward the ___', candidates: [{ word: 'ground', prob: 0.46 }, { word: 'Earth', prob: 0.34 }, { word: 'center', prob: 0.16 }, { word: 'sky', prob: 0.04 }] },
  ],
  4: [
    { text: 'The nail went into the ___', candidates: [{ word: 'wall', prob: 0.42 }, { word: 'wood', prob: 0.30 }, { word: 'board', prob: 0.22 }, { word: 'finger', prob: 0.06 }] },
    { text: 'He rolled the die and moved his ___', candidates: [{ word: 'piece', prob: 0.44 }, { word: 'hand', prob: 0.26 }, { word: 'car', prob: 0.22 }, { word: 'house', prob: 0.08 }] },
    { text: 'She swung the bat at the ___', candidates: [{ word: 'ball', prob: 0.44 }, { word: 'cave', prob: 0.30 }, { word: 'bug', prob: 0.18 }, { word: 'moon', prob: 0.08 }] },
    { text: 'I went to the bank to sit by the ___', candidates: [{ word: 'river', prob: 0.42 }, { word: 'water', prob: 0.28 }, { word: 'money', prob: 0.20 }, { word: 'road', prob: 0.10 }] },
    { text: 'He tuned the bass in the ___', candidates: [{ word: 'band', prob: 0.40 }, { word: 'lake', prob: 0.30 }, { word: 'studio', prob: 0.22 }, { word: 'oven', prob: 0.08 }] },
    { text: 'They rowed past the crane by the ___', candidates: [{ word: 'dock', prob: 0.40 }, { word: 'river', prob: 0.28 }, { word: 'bird', prob: 0.24 }, { word: 'cloud', prob: 0.08 }] },
    { text: 'He watched the ball at the ___', candidates: [{ word: 'game', prob: 0.40 }, { word: 'party', prob: 0.34 }, { word: 'park', prob: 0.20 }, { word: 'moon', prob: 0.06 }] },
    { text: 'The date was written on the ___', candidates: [{ word: 'calendar', prob: 0.40 }, { word: 'card', prob: 0.28 }, { word: 'plate', prob: 0.24 }, { word: 'tree', prob: 0.08 }] },
    { text: 'I saw a seal near the ___', candidates: [{ word: 'beach', prob: 0.38 }, { word: 'letter', prob: 0.28 }, { word: 'zoo', prob: 0.24 }, { word: 'oven', prob: 0.10 }] },
    { text: 'The spring felt warm and ___', candidates: [{ word: 'sunny', prob: 0.36 }, { word: 'bouncy', prob: 0.30 }, { word: 'wet', prob: 0.22 }, { word: 'loud', prob: 0.12 }] },
    { text: 'She left the light on in the ___', candidates: [{ word: 'kitchen', prob: 0.34 }, { word: 'hallway', prob: 0.30 }, { word: 'bedroom', prob: 0.28 }, { word: 'ocean', prob: 0.08 }] },
  ],
  5: [
    { text: 'import numpy as ___', candidates: [{ word: 'np', prob: 0.88 }, { word: 'num', prob: 0.06 }, { word: 'n', prob: 0.04 }, { word: 'py', prob: 0.02 }] },
    { text: 'for i in ___(10):', candidates: [{ word: 'range', prob: 0.85 }, { word: 'list', prob: 0.08 }, { word: 'loop', prob: 0.04 }, { word: 'count', prob: 0.03 }] },
    { text: '// this is a ___', candidates: [{ word: 'comment', prob: 0.82 }, { word: 'function', prob: 0.08 }, { word: 'bug', prob: 0.06 }, { word: 'secret', prob: 0.04 }] },
    { text: 'The model picks the highest ___', candidates: [{ word: 'probability', prob: 0.82 }, { word: 'letter', prob: 0.10 }, { word: 'volume', prob: 0.05 }, { word: 'number', prob: 0.03 }] },
    { text: 'print(___)  # show Hello', candidates: [{ word: '"Hello"', prob: 0.78 }, { word: 'Hello', prob: 0.14 }, { word: 'echo', prob: 0.05 }, { word: 'say', prob: 0.03 }] },
    { text: 'GPT predicts the next ___', candidates: [{ word: 'token', prob: 0.78 }, { word: 'word', prob: 0.12 }, { word: 'color', prob: 0.06 }, { word: 'sound', prob: 0.04 }] },
    { text: 'x = [1, 2, ___]', candidates: [{ word: '3', prob: 0.74 }, { word: '4', prob: 0.10 }, { word: 'n', prob: 0.10 }, { word: 'cat', prob: 0.06 }] },
    { text: 'def add(a, b): return a ___ b', candidates: [{ word: '+', prob: 0.70 }, { word: '-', prob: 0.14 }, { word: '*', prob: 0.10 }, { word: 'and', prob: 0.06 }] },
    { text: 'while True:  # this loops ___', candidates: [{ word: 'forever', prob: 0.66 }, { word: 'once', prob: 0.18 }, { word: 'never', prob: 0.12 }, { word: 'twice', prob: 0.04 }] },
    { text: 'if x == 5: return ___', candidates: [{ word: 'True', prob: 0.58 }, { word: 'five', prob: 0.24 }, { word: 'x', prob: 0.12 }, { word: 'print', prob: 0.06 }] },
    { text: 'Temperature controls how ___ the model is', candidates: [{ word: 'random', prob: 0.54 }, { word: 'creative', prob: 0.28 }, { word: 'fast', prob: 0.12 }, { word: 'tall', prob: 0.06 }] },
    { text: 'arr.length gives the ___', candidates: [{ word: 'count', prob: 0.46 }, { word: 'size', prob: 0.34 }, { word: 'total', prob: 0.16 }, { word: 'color', prob: 0.04 }] },
  ],
};

// ── Distribution helpers ──
function topProb(p: Prompt): number {
  return p.candidates.reduce((m, c) => Math.max(m, c.prob), 0);
}
function topWord(p: Prompt): string {
  return p.candidates.reduce((a, b) => (b.prob > a.prob ? b : a)).word;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// temp=1 sampling: pick a word proportional to its probability.
function weightedSample(cands: Candidate[]): string {
  const total = cands.reduce((s, c) => s + c.prob, 0);
  let r = Math.random() * total;
  for (const c of cands) { r -= c.prob; if (r <= 0) return c.word; }
  return cands[cands.length - 1].word;
}
// Band-aware prompt selection from a shared pool.
//   A → most peaked (obvious) prompts; C → flattest (ambiguous); B → mixed.
function selectPrompts(pool: Prompt[], band: AgeBand, count: number): Prompt[] {
  if (band === 'B') return shuffle(pool).slice(0, count);
  const sorted = [...pool].sort((a, b) =>
    band === 'A' ? topProb(b) - topProb(a) : topProb(a) - topProb(b));
  // Take a slightly wider slice, then shuffle so difficulty isn't monotonic.
  return shuffle(sorted.slice(0, count + 2)).slice(0, count);
}
function starsFor(score: number, thresholds: number[]): 0 | 1 | 2 | 3 {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}

// Render a sentence, emphasising the "___" blank.
function SentenceLine({ text, fill }: { text: string; fill?: string }) {
  const parts = text.split('___');
  return (
    <span>
      {parts[0]}
      <span
        className="inline-block mx-1 px-2 rounded-md font-bold align-baseline"
        style={{ background: `${LAB_COLOR}22`, color: fill ? '#1A1D2B' : LAB_COLOR, minWidth: '2.5rem', textAlign: 'center' }}
      >
        {fill || '____'}
      </span>
      {parts[1]}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the two-beat prediction drill
// ════════════════════════════════════════════════════════════════════════
type Beat = 'commit' | 'reveal';
interface RoundResult { gained: number; isTop: boolean; pickedWord: string | null; topWord: string; }

function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;
  const commitMs = COMMIT_MS[band];

  const roundPrompts = useMemo(
    () => selectPrompts(POOLS[level.id] || POOLS[1], band, ROUNDS),
    [level.id, band],
  );

  const [phase, setPhase] = useState<'welcome' | 'drill'>('welcome');
  const [roundIdx, setRoundIdx] = useState(0);
  const [beat, setBeat] = useState<Beat>('commit');
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(commitMs);
  const [last, setLast] = useState<RoundResult | null>(null);
  const [tempSample, setTempSample] = useState('');

  const prompt = roundPrompts[roundIdx] ?? roundPrompts[0];
  // Shuffle candidate positions per round so location never telegraphs the answer.
  const display = useMemo(() => shuffle(prompt.candidates), [prompt]);
  // Reveal always shows the true distribution sorted high→low.
  const sorted = useMemo(() => [...prompt.candidates].sort((a, b) => b.prob - a.prob), [prompt]);
  const tw = topWord(prompt);

  // Refs so the (stable) timer/keyboard handlers read live state.
  const beatRef = useRef(beat); beatRef.current = beat;
  const promptRef = useRef(prompt); promptRef.current = prompt;
  const displayRef = useRef(display); displayRef.current = display;
  const scoreRef = useRef(score); scoreRef.current = score;
  const roundRef = useRef(roundIdx); roundRef.current = roundIdx;
  const startRef = useRef(0);

  // ── Commit a pick (or null on timeout) → score by probability of the pick ──
  const commit = useCallback((pickIdx: number | null) => {
    if (beatRef.current !== 'commit') return;
    const p = promptRef.current;
    const cand = pickIdx == null ? null : displayRef.current[pickIdx];
    const isTop = !!cand && cand.word === topWord(p);
    const ratio = cand ? cand.prob / topProb(p) : 0; // full credit at the top
    const base = Math.round(ratio * POINTS_TOP);

    setCombo((prevCombo) => {
      const nc = isTop ? prevCombo + 1 : 0;
      const bonus = isTop ? Math.min(nc, COMBO_CAP) * COMBO_STEP : 0;
      const gained = base + bonus;
      setScore((s) => {
        const ns = s + gained;
        if (isTop) juice.onCorrect(nc, ns); else juice.onWrong(0, ns);
        return ns;
      });
      setLast({ gained, isTop, pickedWord: cand ? cand.word : null, topWord: topWord(p) });
      return nc;
    });
    if (isTop) setHits((h) => h + 1); else setMisses((m) => m + 1);
    setPicked(pickIdx);
    if (band === 'C') setTempSample(weightedSample(p.candidates));
    setBeat('reveal');
  }, [juice, band]);
  const commitRef = useRef(commit); commitRef.current = commit;

  // ── Finish the level (fires onComplete once), then reset for a clean replay ──
  const finish = useCallback(() => {
    const total = scoreRef.current;
    const stars = starsFor(total, level.starThresholds);
    onComplete({
      score: total, maxScore: MAX_SCORE, stars,
      xpEarned: Math.round(level.xpReward * (stars / 3)),
      timeMs: Date.now() - startRef.current,
    });
    // Reset underneath the completion overlay so "Replay" starts fresh.
    setPhase('welcome'); setRoundIdx(0); setBeat('commit'); setPicked(null);
    setScore(0); setCombo(0); setHits(0); setMisses(0); setLast(null); setTempSample('');
  }, [level, onComplete]);

  const advance = useCallback(() => {
    const next = roundRef.current + 1;
    if (next >= Math.min(roundPrompts.length, ROUNDS)) { finish(); return; }
    setRoundIdx(next); setBeat('commit'); setPicked(null); setLast(null); setTempSample('');
  }, [roundPrompts.length, finish]);
  const advanceRef = useRef(advance); advanceRef.current = advance;

  // Commit countdown (arcade tension). Times out → auto-reveal with no pick.
  useEffect(() => {
    if (phase !== 'drill' || beat !== 'commit') return;
    setTimeLeft(commitMs);
    const started = Date.now();
    const iv = setInterval(() => {
      const rem = commitMs - (Date.now() - started);
      if (rem <= 0) { clearInterval(iv); setTimeLeft(0); commitRef.current(null); }
      else setTimeLeft(rem);
    }, 100);
    return () => clearInterval(iv);
  }, [phase, beat, roundIdx, commitMs]);

  // Keyboard: number keys pick during commit; Enter/Space advances during reveal.
  useEffect(() => {
    if (phase !== 'drill') return;
    const onKey = (e: KeyboardEvent) => {
      if (beatRef.current === 'commit') {
        const n = Number(e.key);
        if (Number.isInteger(n) && n >= 1 && n <= displayRef.current.length) {
          e.preventDefault(); commitRef.current(n - 1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const timerPct = Math.max(0, Math.min(100, (timeLeft / commitMs) * 100));

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#4F6EF712', color: '#4F6EF7' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Two beats:</strong> first <strong>commit</strong> to the word you think comes next (no odds shown!).
              Then the <strong>distribution reveals</strong> — you score by how likely YOUR pick was. Top word = full points,
              plausible words = partial credit.
              {band === 'C' && ' You will also meet the Temperature Lab.'}
            </span>
          </div>
        </SFCard>
        <SFButton
          variant="primary" size="lg" className="w-full"
          onClick={() => { startRef.current = Date.now(); setPhase('drill'); setBeat('commit'); }}
        >
          Start Drill <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ DRILL ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Predict the Word</GlowingTitle>
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${LAB_COLOR}15`, color: LAB_COLOR }}>
          Round {Math.min(roundIdx + 1, ROUNDS)} / {ROUNDS}
        </span>
      </div>

      {/* Sentence prompt (fills the blank with the top word once revealed) */}
      <div className="rounded-xl px-4 py-3 text-base font-semibold" style={{ background: '#FFFFFF', border: `1px solid ${LAB_COLOR}30`, color: '#1A1D2B' }}>
        <SentenceLine text={prompt.text} fill={beat === 'reveal' ? tw : undefined} />
      </div>

      <ScoreDisplay score={score} maxScore={MAX_SCORE} />
      <ComboCounter combo={combo} />

      {/* ── BEAT 1: COMMIT — candidate cards, NO probabilities (G1 honesty) ── */}
      {beat === 'commit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs" style={{ color: '#5A6078' }}>
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Tap the <strong>likeliest</strong> next word</span>
            <span className="flex items-center gap-1 font-bold" style={{ color: timerPct < 30 ? '#FF4D4D' : LAB_COLOR }}>
              <Timer className="w-3.5 h-3.5" />{Math.ceil(timeLeft / 1000)}s
            </span>
          </div>
          {/* Commit timer bar */}
          <div
            className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0F1F8' }}
            role="progressbar" aria-label="Time left to predict"
            aria-valuenow={Math.ceil(timeLeft / 1000)} aria-valuemin={0} aria-valuemax={Math.ceil(commitMs / 1000)}
          >
            <div className="h-full rounded-full" style={{ width: `${timerPct}%`, background: timerPct < 30 ? '#FF4D4D' : LAB_COLOR, transition: 'width 0.1s linear' }} />
          </div>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Candidate next words">
            {display.map((c, i) => (
              <motion.button
                key={c.word}
                onClick={() => commit(i)}
                aria-label={`Predict "${c.word}". Press ${i + 1}.`}
                className="relative rounded-2xl px-4 py-4 text-center font-bold transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: `linear-gradient(135deg, ${LAB_COLOR}18, ${LAB_COLOR}08)`,
                  border: `2px solid ${LAB_COLOR}40`, color: '#1A1D2B',
                  ['--tw-ring-color' as string]: LAB_COLOR,
                }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="absolute top-1.5 left-2 text-xs font-bold" style={{ color: `${LAB_COLOR}` }} aria-hidden="true">{i + 1}</span>
                {c.word}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── BEAT 2: REVEAL — the distribution animates in; score the pick ── */}
      <AnimatePresence mode="wait">
        {beat === 'reveal' && last && (
          <motion.div
            key={`reveal-${roundIdx}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Score line (announced) */}
            <div
              role="status" aria-live="polite"
              className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2"
              style={{
                background: last.isTop ? '#2ECC7115' : last.gained > 0 ? '#4F6EF712' : '#FF4D4D12',
                color: last.isTop ? '#1E9E5A' : last.gained > 0 ? '#4F6EF7' : '#FF4D4D',
              }}
            >
              {last.isTop
                ? <><Crown className="w-4 h-4" /> Top word! You picked “{last.pickedWord}” — the likeliest. +{last.gained} points.</>
                : last.pickedWord
                  ? <><ArrowRight className="w-4 h-4" /> “{last.pickedWord}” was plausible. The top word was “{last.topWord}”. Partial credit: +{last.gained}.</>
                  : <><Timer className="w-4 h-4" /> Out of time! The top word was “{last.topWord}”. +0 this round.</>}
            </div>

            {/* Distribution bars — one per candidate, high → low */}
            <div className="space-y-2" aria-label="Revealed probability distribution">
              {sorted.map((c, i) => {
                const isTopRow = c.word === tw;
                const isPick = c.word === last.pickedWord;
                const pct = Math.round(c.prob * 100);
                return (
                  <div key={c.word} aria-label={`${c.word}: ${pct} percent${isTopRow ? ', top word' : ''}${isPick ? ', your pick' : ''}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold flex items-center gap-1" style={{ color: '#1A1D2B' }}>
                        {isTopRow && <Crown className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} aria-hidden="true" />}
                        {c.word}
                        {isPick && <span className="ml-1 px-1.5 py-0.5 rounded-full font-bold" style={{ fontSize: '0.65rem', background: '#4F6EF720', color: '#4F6EF7' }}>your pick</span>}
                      </span>
                      <span className="font-bold" style={{ color: isTopRow ? LAB_COLOR : '#5A6078' }}>{pct}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F0F1F8', outline: isPick ? '2px solid #4F6EF7' : 'none', outlineOffset: '1px' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: isTopRow ? `linear-gradient(90deg, ${LAB_COLOR}, #E9C46A)` : `${LAB_COLOR}66` }}
                        initial={{ width: prefersReducedMotion ? `${pct}%` : 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Band-C bonus: Temperature Lab ── */}
            {band === 'C' && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: '#E945F510', border: '1px solid #E945F530' }}>
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#B33FC0' }}>
                  <Thermometer className="w-4 h-4" /> Temperature Lab — same sentence, two settings
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0" style={{ background: '#4F6EF720', color: '#4F6EF7' }}>temp 0</span>
                    <span style={{ color: '#5A6078' }}>always the top word →</span>
                    <strong style={{ color: '#1A1D2B' }}>{tw}</strong>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0" style={{ background: '#E945F520', color: '#B33FC0' }}>temp 1</span>
                    <span style={{ color: '#5A6078' }}>samples the odds →</span>
                    <strong style={{ color: '#1A1D2B' }}>{tempSample || '—'}</strong>
                    <SFButton variant="outline" size="sm" onClick={() => setTempSample(weightedSample(prompt.candidates))} aria-label="Sample again at temperature 1">
                      <Dices className="w-3.5 h-3.5 mr-1" /> Sample
                    </SFButton>
                  </div>
                  <p className="text-xs" style={{ color: '#5A6078' }}>
                    Roll temp 1 a few times — surprising words appear because the model is <em>sampling</em>, not always choosing the top.
                  </p>
                </div>
              </div>
            )}

            <SFButton variant="primary" size="lg" className="w-full" onClick={advance}>
              {roundIdx + 1 >= Math.min(roundPrompts.length, ROUNDS) ? 'Finish Level' : 'Next Word'} <ChevronRight className="w-5 h-5 ml-2" />
            </SFButton>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between text-xs" style={{ color: '#8C94AC' }}>
        <span>Top picks: <strong style={{ color: '#2ECC71' }}>{hits}</strong> · Missed top: <strong style={{ color: '#FF4D4D' }}>{misses}</strong></span>
        <SFButton variant="outline" size="sm" onClick={onExit} aria-label="Exit level">Exit</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function WordPredictorGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0); // 5 levels → max 15
    awardXP(Math.round(totalXP));
    completeGame('word-predictor', totalStars >= 13 ? 3 : totalStars >= 8 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Word Predictor" color={LAB_COLOR} labNum={4}>
      <GameLevelSystem
        gameTitle="Word Predictor"
        gameEmoji="📝"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          // key forces a clean remount when moving to the next level.
          <LevelRenderer key={level.id} level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
