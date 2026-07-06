// ════════════════════════════════════════════════════════════════════════
// TOKEN CHOPPER v5 — Lab 4 (AI That Creates) — CHOP archetype
// ════════════════════════════════════════════════════════════════════════
// The chopper finally chops. The child sees a REAL sentence and taps the
// gaps between characters to guess where the model splits it into tokens.
// On "Chop!" the real GPT-4 tokenizer (gpt-tokenizer / cl100k_base) runs,
// their cut points are scored against the model's ACTUAL token boundaries
// (precision + recall), and the true tokens fly apart into labeled pieces.
//
// A live token counter shows how many tokens their cuts imply; the final
// level flips to a token BUDGET — trim words to fit under a limit while
// keeping the meaning — to seed context-budget intuition. A dedicated
// "cost" level reveals that an emoji can cost 2 tokens and SHOUTING costs
// more than lowercase.
//
// Honesty (G1): the true cut points are NEVER pre-marked. They are computed
// only after the child commits, from the real tokenizer's output.
//
// Teaches: tokenization is a real, learnable boundary problem — and every
// piece (word, subword, space, punctuation, emoji-half) costs budget.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { encode, decode } from 'gpt-tokenizer';
import {
  ChevronRight, Scissors, GraduationCap, Target, RotateCcw, Sparkles, Gauge,
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
  GlowingTitle, ScoreDisplay, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#D9A430';
const PIECE_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B', '#EF476F'];

type Band = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// LEVELS — 5 real levels, band-differentiated content
// plain → contractions/punct → subwords/rare → emoji & cost → fit-a-budget
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Plain Words', description: 'Tap the gaps where whole words split apart.', emoji: '✂️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: "Contractions & Marks", description: "Where does can't split? Do commas get their own token?", emoji: '📌', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 3, name: 'Subwords & Rare Words', description: 'Long or rare words shatter into subword pieces.', emoji: '🧩', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 4, name: 'The Cost of Tokens', description: 'An emoji can cost 2 tokens. SHOUTING costs more than lowercase.', emoji: '🍕', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 5, name: 'Fit the Budget', description: 'Trim the fluff to fit under the token limit — keep the meaning.', emoji: '📏', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150, isBonus: true },
];

interface ChopContent {
  mode: 'chop';
  teach: string;
  cost?: boolean;          // level 4: annotate per-piece token cost
  sentence: Record<Band, string>;
}
interface BudgetWord { t: string; essential?: boolean }
interface BudgetContent {
  mode: 'budget';
  teach: string;
  budget: Record<Band, number>;
  words: Record<Band, BudgetWord[]>;
}
type Content = ChopContent | BudgetContent;

const CONTENT: Record<number, Content> = {
  1: {
    mode: 'chop',
    teach: 'Tokenization splits text into units. The most common unit is a whole word — and the space usually rides along with the word after it.',
    sentence: { A: 'the big red dog', B: 'cats love to nap', C: 'robots learn from data' },
  },
  2: {
    mode: 'chop',
    teach: "A contraction like \"It's\" often stays as ONE token, while punctuation such as , . ! ? gets its own token. Surprising, right?",
    sentence: { A: "I can't stop!", B: "It's raining cats and dogs!", C: "Don't you think it's clever, friend?" },
  },
  3: {
    mode: 'chop',
    teach: 'Rare or long words break into smaller subword pieces the model already knows — like "un" + "believable".',
    sentence: { A: 'happiness is warm', B: 'Tokenization is unbelievable.', C: 'Antidisestablishmentarianism confuses everyone.' },
  },
  4: {
    mode: 'chop',
    cost: true,
    teach: 'Not every character costs the same! An emoji can cost 2 tokens, and SHOUTING splits into more pieces than lowercase. Every piece eats your budget.',
    sentence: { A: 'I love pizza 🍕', B: 'Cost: $5 for 🍕🍕 !', C: 'SHOUTING 😤 costs more tokens 🔥🔥' },
  },
  5: {
    mode: 'budget',
    teach: 'Models have a token limit (a context budget). Trim the filler words to fit under the limit — but keep the words that carry the meaning.',
    budget: { A: 4, B: 6, C: 7 },
    words: {
      A: [{ t: 'the' }, { t: 'very' }, { t: 'very' }, { t: 'big' }, { t: 'happy' }, { t: 'dog', essential: true }],
      B: [{ t: 'The' }, { t: 'extremely' }, { t: 'fluffy' }, { t: 'little' }, { t: 'brown' }, { t: 'puppy', essential: true }, { t: 'runs', essential: true }, { t: 'quickly' }],
      C: [{ t: 'Please' }, { t: 'kindly' }, { t: 'send', essential: true }, { t: 'me' }, { t: 'the' }, { t: 'detailed' }, { t: 'quarterly' }, { t: 'report', essential: true }, { t: 'now' }],
    },
  },
};

// ════════════════════════════════════════════════════════════════════════
// TOKENIZER ANALYSIS — computed AFTER commit only (G1 honesty)
// ════════════════════════════════════════════════════════════════════════
interface DisplayToken { text: string; tokenCount: number }
interface Analysis {
  cps: string[];            // visible code points (emoji = 1 unit)
  trueGaps: Set<number>;    // placeable true boundaries, in code-point gap space (1..cps.length-1)
  display: DisplayToken[];  // real tokens, grouped to visible boundaries (emoji shows its cost)
  realCount: number;        // real total token count
}

/** Real GPT-4 tokenization of `sentence`, mapped to visible code-point gaps. */
function analyze(sentence: string): Analysis {
  const cps = Array.from(sentence); // code points (visible units)

  // UTF-16 offset at the start of each visible code point, plus a reverse map
  const cpOffset: number[] = [0];
  const utf16ToGap = new Map<number, number>();
  for (let i = 0; i < cps.length; i++) {
    utf16ToGap.set(cpOffset[i], i);
    cpOffset.push(cpOffset[i] + cps[i].length);
  }
  utf16ToGap.set(cpOffset[cps.length], cps.length);
  const cpBoundarySet = new Set(cpOffset); // valid UTF-16 offsets (between visible chars)

  const ids = encode(sentence);
  const pieces = ids.map((id) => decode([id]));

  // True internal token boundaries → snap to visible gaps (drop mid-emoji splits)
  const trueGaps = new Set<number>();
  let off = 0;
  for (let i = 0; i < pieces.length - 1; i++) {
    off += pieces[i].length;
    const g = utf16ToGap.get(off);
    if (g !== undefined && g > 0 && g < cps.length) trueGaps.add(g);
  }

  // Group pieces into visible display tokens (an emoji made of N ids → one chip, cost N)
  const display: DisplayToken[] = [];
  let runOff = 0;
  let buf = '';
  let bufCount = 0;
  for (const p of pieces) {
    buf += p;
    bufCount += 1;
    runOff += p.length;
    if (cpBoundarySet.has(runOff) && buf.length > 0) {
      display.push({ text: buf, tokenCount: bufCount });
      buf = '';
      bufCount = 0;
    }
  }
  if (buf.length > 0 || bufCount > 0) display.push({ text: buf, tokenCount: bufCount });

  return { cps, trueGaps, display, realCount: ids.length };
}

/** Score child cut set vs true gaps (precision + recall → F1). tol adds slack for band A. */
function scoreCuts(childSet: Set<number>, trueSet: Set<number>, tol: number) {
  const trueArr = [...trueSet];
  const childArr = [...childSet];
  const usedChild = new Set<number>();
  let tp = 0;
  for (const t of trueArr) {
    let best = -1;
    let bestD = Infinity;
    for (const c of childArr) {
      if (usedChild.has(c)) continue;
      const d = Math.abs(c - t);
      if (d <= tol && d < bestD) { bestD = d; best = c; }
    }
    if (best >= 0) { tp += 1; usedChild.add(best); }
  }
  const fn = trueArr.length - tp;
  const fp = childArr.length - usedChild.size;
  const precision = childArr.length ? tp / (tp + fp) : (trueArr.length ? 0 : 1);
  const recall = trueArr.length ? tp / (tp + fn) : 1;
  const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, fn, f1, trueTotal: trueArr.length };
}

function starsFor(score: number, thresholds: number[]): 0 | 1 | 2 | 3 {
  return (score >= thresholds[2] ? 3 : score >= thresholds[1] ? 2 : score >= thresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
}

// Visible label for a single code point (spaces named for screen readers / display)
function charLabel(c: string): string {
  if (c === ' ') return 'space';
  return c;
}

// ════════════════════════════════════════════════════════════════════════
// SHARED — token meter
// ════════════════════════════════════════════════════════════════════════
function TokenMeter({ count, limit, label }: { count: number; limit?: number; label: string }) {
  const over = limit !== undefined && count > limit;
  const pct = limit !== undefined ? Math.min(100, (count / limit) * 100) : 100;
  const barColor = over ? '#EF476F' : count === limit ? '#F59E0B' : LAB_COLOR;
  return (
    <div className="rounded-xl p-3" style={{ background: '#0000002e', border: `1px solid ${barColor}44` }}>
      <div className="flex items-center justify-between text-xs font-bold mb-2">
        <span className="flex items-center gap-1" style={{ color: '#C7CBD9' }}>
          <Gauge className="w-4 h-4" /> {label}
        </span>
        <span style={{ color: barColor }}>
          {count}{limit !== undefined ? ` / ${limit}` : ''} token{count === 1 ? '' : 's'}
          {over ? ' — over!' : ''}
        </span>
      </div>
      {limit !== undefined && (
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: '#ffffff1f' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CHOP LEVEL — tap gaps, then reveal the real tokenizer
// ════════════════════════════════════════════════════════════════════════
function ChopLevel({
  level, content, band, onComplete, onExit,
}: {
  level: LevelConfig; content: ChopContent; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = useReducedMotion();
  const sentence = content.sentence[band];
  const cps = useMemo(() => Array.from(sentence), [sentence]);

  const [phase, setPhase] = useState<'welcome' | 'play' | 'reveal'>('welcome');
  const [cuts, setCuts] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ analysis: Analysis; f1: number; tp: number; fn: number; fp: number; trueTotal: number; score: number; stars: 0 | 1 | 2 | 3 } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const guessCount = cuts.size + 1; // cuts partition the sentence into this many pieces

  const toggleGap = useCallback((g: number) => {
    setCuts((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }, []);

  const chop = useCallback(() => {
    const analysis = analyze(sentence);
    const tol = band === 'A' ? 1 : 0;
    const s = scoreCuts(cuts, analysis.trueGaps, tol);
    let score = Math.round(s.f1 * 100);
    if (band === 'A') score = Math.min(100, Math.round(score * 1.2)); // gentlest version
    const stars = starsFor(score, level.starThresholds);
    setResult({ analysis, f1: s.f1, tp: s.tp, fn: s.fn, fp: s.fp, trueTotal: s.trueTotal, score, stars });
    if (score >= level.starThresholds[0]) juice.onCorrect(1, score); else juice.onWrong(1, score);
    setPhase('reveal');
  }, [sentence, band, cuts, level.starThresholds, juice]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#8A90A8' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}1a`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {content.teach}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B351a', color: '#FF8A5B' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Chop:</strong> Tap the gaps between characters where you think the model splits the sentence. Then hit <strong>Chop!</strong> to see the real cuts. Sparky 🤖 wields the blade!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
          Start Chopping <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ REVEAL ═══
  if (phase === 'reveal' && result) {
    const { analysis } = result;
    return (
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <GlowingTitle emoji="🤖" color={LAB_COLOR}>The Real Chop</GlowingTitle>
          <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
            <Scissors className="w-4 h-4" />{analysis.realCount} tokens
          </span>
        </div>

        <ScoreDisplay score={result.score} maxScore={100} label="Boundary match" />

        <SFCard variant="elevated" className="p-4">
          <p className="text-xs mb-3" style={{ color: '#C7CBD9' }}>
            You matched <strong style={{ color: '#2ECC71' }}>{result.tp}</strong> of <strong>{result.trueTotal}</strong> real
            splits{result.fp > 0 ? <> · <strong style={{ color: '#EF476F' }}>{result.fp}</strong> extra cut{result.fp === 1 ? '' : 's'}</> : null}
            {result.fn > 0 ? <> · <strong style={{ color: '#F59E0B' }}>{result.fn}</strong> missed</> : null}.
            You guessed <strong>{guessCount}</strong>; the model made <strong>{analysis.realCount}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 items-stretch">
            {analysis.display.map((tok, i) => (
              <motion.div
                key={i}
                initial={reduced ? false : { scale: 0.6, x: -14, opacity: 0 }}
                animate={{ scale: 1, x: 0, opacity: 1 }}
                transition={{ delay: reduced ? 0 : i * 0.09, type: 'spring', stiffness: 260, damping: 20 }}
                className="rounded-lg px-3 py-2 flex flex-col items-center justify-center"
                style={{
                  background: `${PIECE_PALETTE[i % PIECE_PALETTE.length]}22`,
                  border: `1.5px solid ${PIECE_PALETTE[i % PIECE_PALETTE.length]}`,
                  minWidth: 34,
                }}
              >
                <span className="text-sm font-mono font-bold" style={{ color: '#F2F4FA', whiteSpace: 'pre' }}>
                  {tok.text === ' ' ? '␣' : tok.text.replace(/ /g, '·')}
                </span>
                {content.cost && tok.tokenCount > 1 && (
                  <span className="font-bold mt-0.5" style={{ color: '#EF476F', fontSize: '0.62rem' }}>
                    {tok.tokenCount} tokens!
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          {content.cost && (
            <p className="mt-3" style={{ color: '#8A90A8', fontSize: '0.7rem' }}>
              Pieces marked in red cost more than one token — that emoji or ALL-CAPS word eats extra budget.
            </p>
          )}
        </SFCard>

        <SFButton variant="primary" size="lg" className="w-full"
          onClick={() => onComplete({ score: result.score, maxScore: 100, stars: result.stars, xpEarned: level.xpReward * (result.stars / 3), timeMs: 0 })}>
          <Sparkles className="w-4 h-4 mr-2" /> Continue
        </SFButton>
      </div>
    );
  }

  // ═══ PLAY ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="✂️" color={LAB_COLOR}>Place Your Cuts</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Scissors className="w-4 h-4" />{cuts.size} cut{cuts.size === 1 ? '' : 's'}
        </span>
      </div>

      <TokenMeter count={guessCount} label="Your guess" />

      <SFCard variant="elevated" className="p-4">
        <p className="text-xs mb-3" style={{ color: '#8A90A8' }}>
          Tap a gap to drop or lift a blade. The true splits stay hidden until you chop.
        </p>
        <div className="flex flex-wrap items-stretch justify-center" role="group" aria-label="Sentence characters with tappable cut points">
          {cps.map((c, i) => (
            <span key={i} className="inline-flex items-stretch">
              <span
                className="inline-flex items-center justify-center text-lg font-mono font-bold select-none"
                style={{
                  color: '#F2F4FA',
                  minWidth: c === ' ' ? 14 : 22,
                  paddingTop: 6,
                  paddingBottom: 6,
                  background: c === ' ' ? '#ffffff14' : 'transparent',
                  borderRadius: 4,
                }}
                aria-hidden="true"
              >
                {c === ' ' ? '·' : c}
              </span>
              {i < cps.length - 1 && (() => {
                const g = i + 1;
                const active = cuts.has(g);
                return (
                  <button
                    type="button"
                    onClick={() => toggleGap(g)}
                    aria-pressed={active}
                    aria-label={`Cut between ${charLabel(cps[i])} and ${charLabel(cps[i + 1])}`}
                    className="inline-flex items-center justify-center rounded transition-colors"
                    style={{
                      minWidth: 12,
                      marginLeft: 1,
                      marginRight: 1,
                      background: active ? LAB_COLOR : '#ffffff1a',
                      border: active ? `1px solid ${LAB_COLOR}` : '1px solid transparent',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        width: 2,
                        height: 22,
                        borderRadius: 2,
                        background: active ? '#141414' : '#8A90A8',
                      }}
                    />
                  </button>
                );
              })()}
            </span>
          ))}
        </div>
      </SFCard>

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={chop} disabled={cuts.size === 0}>
          <Scissors className="w-4 h-4 mr-2" />
          {cuts.size === 0 ? 'Place at least one cut…' : 'Chop!'}
        </SFButton>
        <SFButton variant="outline" onClick={() => { setCuts(new Set()); setFeedback({ type: 'info', message: 'Blades cleared.' }); }} aria-label="Clear all cuts">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <ChevronRight className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// BUDGET LEVEL — trim words to fit under a real token budget
// ════════════════════════════════════════════════════════════════════════
function BudgetLevel({
  level, content, band, onComplete, onExit,
}: {
  level: LevelConfig; content: BudgetContent; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const words = content.words[band];
  const budget = content.budget[band];

  const [phase, setPhase] = useState<'welcome' | 'play' | 'reveal'>('welcome');
  const [kept, setKept] = useState<boolean[]>(() => words.map(() => true));
  const [result, setResult] = useState<{ tokens: number; score: number; stars: 0 | 1 | 2 | 3; removedEssential: number; text: string } | null>(null);

  const currentText = useMemo(
    () => words.filter((_, i) => kept[i]).map((w) => w.t).join(' '),
    [words, kept],
  );
  const liveTokens = useMemo(() => (currentText ? encode(currentText).length : 0), [currentText]);

  const toggleWord = useCallback((i: number) => {
    setKept((prev) => prev.map((k, j) => (j === i ? !k : k)));
  }, []);

  const commit = useCallback(() => {
    const removedEssential = words.filter((w, i) => w.essential && !kept[i]).length;
    const keptCount = kept.filter(Boolean).length;
    let score: number;
    if (keptCount === 0) {
      score = 0;
    } else if (liveTokens <= budget) {
      score = 100;
    } else {
      score = Math.max(0, 100 - (liveTokens - budget) * 20);
    }
    score = Math.max(0, score - removedEssential * 30);
    const stars = starsFor(score, level.starThresholds);
    setResult({ tokens: liveTokens, score, stars, removedEssential, text: currentText || '(empty)' });
    if (score >= level.starThresholds[0]) juice.onCorrect(1, score); else juice.onWrong(1, score);
    setPhase('reveal');
  }, [words, kept, liveTokens, budget, currentText, level.starThresholds, juice]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#8A90A8' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}1a`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {content.teach}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B351a', color: '#FF8A5B' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Goal:</strong> Tap words to cut them until the sentence fits under <strong>{budget} tokens</strong> — but don&apos;t throw away the words that carry the meaning!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('play')}>
          Start Trimming <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ REVEAL ═══
  if (phase === 'reveal' && result) {
    const fit = result.tokens <= budget && result.tokens > 0;
    return (
      <div className="relative z-10 space-y-4">
        <GlowingTitle emoji="📏" color={LAB_COLOR}>Budget Check</GlowingTitle>
        <ScoreDisplay score={result.score} maxScore={100} label="Budget skill" />
        <TokenMeter count={result.tokens} limit={budget} label="Final sentence" />
        <SFCard variant="elevated" className="p-4">
          <p className="text-sm font-mono mb-2" style={{ color: '#F2F4FA' }}>&ldquo;{result.text}&rdquo;</p>
          <p className="text-xs" style={{ color: fit ? '#2ECC71' : '#EF476F' }}>
            {result.tokens === 0
              ? 'You cut everything — there is no sentence left!'
              : fit
                ? `Under budget at ${result.tokens} tokens.`
                : `Still ${result.tokens - budget} token${result.tokens - budget === 1 ? '' : 's'} over the limit.`}
          </p>
          {result.removedEssential > 0 && (
            <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>
              You cut {result.removedEssential} essential word{result.removedEssential === 1 ? '' : 's'} — the meaning got hurt.
            </p>
          )}
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full"
          onClick={() => onComplete({ score: result.score, maxScore: 100, stars: result.stars, xpEarned: level.xpReward * (result.stars / 3), timeMs: 0 })}>
          <Sparkles className="w-4 h-4 mr-2" /> Continue
        </SFButton>
      </div>
    );
  }

  // ═══ PLAY ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="📏" color={LAB_COLOR}>Trim to Fit</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>Budget: {budget}</span>
      </div>

      <TokenMeter count={liveTokens} limit={budget} label="Live token count" />

      <SFCard variant="elevated" className="p-4">
        <p className="text-xs mb-3" style={{ color: '#8A90A8' }}>
          Tap a word to cut it (tap again to keep). The counter re-tokenizes for real as you go.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sentence words — tap to keep or cut">
          {words.map((w, i) => {
            const on = kept[i];
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleWord(i)}
                aria-pressed={on}
                aria-label={`${on ? 'Cut' : 'Keep'} the word ${w.t}${w.essential ? ' (marked important)' : ''}`}
                className="rounded-lg px-3 py-2 text-sm font-bold font-mono transition-colors"
                style={{
                  background: on ? `${LAB_COLOR}26` : '#ffffff0f',
                  border: `1.5px solid ${on ? LAB_COLOR : '#ffffff33'}`,
                  color: on ? '#F2F4FA' : '#7A8098',
                  textDecoration: on ? 'none' : 'line-through',
                }}
              >
                {w.t}
                {w.essential && (
                  <span className="ml-1" style={{ color: on ? '#F59E0B' : '#7A8098' }} aria-hidden="true">★</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3" style={{ color: '#8A90A8', fontSize: '0.7rem' }}>
          <span style={{ color: '#F59E0B' }}>★</span> = an important word. Keep these.
        </p>
      </SFCard>

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={commit}>
          <Sparkles className="w-4 h-4 mr-2" /> Lock It In
        </SFButton>
        <SFButton variant="outline" onClick={() => setKept(words.map(() => true))} aria-label="Restore all words">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <ChevronRight className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const content = CONTENT[level.id] ?? CONTENT[1];
  if (content.mode === 'budget') {
    return <BudgetLevel key={level.id} level={level} content={content} band={band} onComplete={onComplete} onExit={onExit} />;
  }
  return <ChopLevel key={level.id} level={level} content={content} band={band} onComplete={onComplete} onExit={onExit} />;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function TokenChopperGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    // 5 levels → max 15 stars
    completeGame('token-chopper', totalStars >= 13 ? 3 : totalStars >= 8 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Token Chopper" color={LAB_COLOR} labNum={4}>
      <GameLevelSystem
        gameTitle="Token Chopper"
        gameEmoji="✂️"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
