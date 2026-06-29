// ════════════════════════════════════════════════════════════════════════
// TOKEN CHOPPER v4 — Lab 4 (AI That Creates) — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was a tokenization quiz (with a CONNECT bonus round). Now you SORT token
// chunks into their kind — Word / Subword / Punct / Special — the way a
// tokenizer labels the pieces it chops a sentence into. Pixi SORT scene inside
// GameShell. (The old "how text becomes tokens" ordering idea now lives in the
// CONNECT archetype family; this proof focuses on token categories.)
//
// Teaches: tokenization splits text into typed units — words, subword pieces,
// punctuation, and special model tokens.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Scissors, GraduationCap, Target, RotateCcw, Sparkles,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import {
  GlowingTitle, ScoreDisplay, ComboCounter, FeedbackPopup,
} from '@/components/games/shared/GameVisualKit';
import type { BinSortItem } from '@/components/games/pixi/PixiBinSortStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiBinSortStage = dynamic(() => import('@/components/games/pixi/PixiBinSortStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

const LAB_COLOR = '#D9A430';
const BINS = ['Word', 'Subword', 'Punct', 'Special']; // bin index 0 / 1 / 2 / 3
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Word Basics', description: 'Sort whole words from the rest.', emoji: '✂️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Punctuation', description: 'Commas, periods, and quotes are tokens too.', emoji: '📌', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Contractions', description: "can / 't — split into pieces.", emoji: '🤝', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Subwords', description: 'Words broken into smaller pieces.', emoji: '🧩', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Special Tokens', description: 'CLS, SEP, PAD — model markers.', emoji: '🔖', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Mixed Text', description: 'All the kinds together.', emoji: '🌍', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Tricky Pieces', description: 'Sort the harder fragments.', emoji: '😂', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Code Tokens', description: 'Symbols and keywords as tokens.', emoji: '💻', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Token Limits', description: 'Every piece counts toward the limit.', emoji: '📏', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Token Master', description: 'The ultimate tokenization sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Tokenization splits text into units. The most common unit is a whole word like "cat" or "the".',
  2: 'Punctuation becomes its own token — "Hello, world!" is Hello / , / world / ! = four tokens.',
  3: 'Contractions split: "can\'t" becomes "can" + "\'t". The "\'t" is a subword piece.',
  4: 'Rare words break into subwords: "unhappiness" → "un" + "happy" + "ness" — familiar pieces.',
  5: 'Special tokens like [CLS], [SEP], and [PAD] are markers the model adds, not real words.',
  6: 'Real text is a mix: words, subword pieces, punctuation, and special markers all in one stream.',
  7: 'Some fragments are tricky — a suffix like "ization" is a subword, not a standalone word.',
  8: 'Code tokenizes too: keywords are words, but symbols like ( and ; are punctuation tokens.',
  9: 'Models have a token limit. Every piece — word, subword, punctuation, special — counts.',
  10: 'Master test: label every chopped piece by its kind, fast and correctly.',
};

// ════════════════════════════════════════════════════════════════════════
// TOKEN BANK — the piece + its kind (bin) + why (interleaved across bins)
// ════════════════════════════════════════════════════════════════════════
interface Token { id: string; label: string; bin: number; why: string; }

const BANK: Token[] = [
  { id: 'the', label: 'the', bin: 0, why: 'A common whole word — one token.' },
  { id: 'comma', label: ',', bin: 2, why: 'Punctuation is its own token.' },
  { id: 'un', label: 'un', bin: 1, why: 'A subword prefix — part of a bigger word like "unhappy".' },
  { id: 'cls', label: '[CLS]', bin: 3, why: 'A special classification marker the model adds at the start.' },
  { id: 'cat', label: 'cat', bin: 0, why: 'A whole word — one token.' },
  { id: 'bang', label: '!', bin: 2, why: 'An exclamation mark is a separate punctuation token.' },
  { id: 'ness', label: 'ness', bin: 1, why: 'A subword suffix — the tail of words like "happiness".' },
  { id: 'sep', label: '[SEP]', bin: 3, why: 'A special token that separates sentence pairs.' },
  { id: 'jump', label: 'jump', bin: 0, why: 'A whole word — one token.' },
  { id: 'period', label: '.', bin: 2, why: 'A period is its own punctuation token.' },
  { id: 'apos-t', label: "'t", bin: 1, why: 'The piece left when "can\'t" splits into "can" + "\'t".' },
  { id: 'pad', label: '[PAD]', bin: 3, why: 'A special token that pads inputs to equal length.' },
  { id: 'happy', label: 'happy', bin: 0, why: 'A whole word — one token.' },
  { id: 'qmark', label: '?', bin: 2, why: 'A question mark is a separate punctuation token.' },
  { id: 'ization', label: 'ization', bin: 1, why: 'A subword suffix — the tail of "tokenization".' },
  { id: 'unk', label: '[UNK]', bin: 3, why: 'A special token for an unknown, out-of-vocabulary word.' },
  { id: 'paren', label: '(', bin: 2, why: 'In code, a bracket is a punctuation token.' },
  { id: 'return', label: 'return', bin: 0, why: 'A code keyword — tokenized as a whole word.' },
];

function getItems(levelId: number): Token[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Token[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const items = useMemo(() => getItems(level.id), [level.id]);
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;

  const sceneItems = useMemo<BinSortItem[]>(
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: `"${it.label}" (${BINS[it.bin]})`, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
    [items],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number) => {
    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1300);
  }, [level, maxScore, onComplete]);

  const handleAssign = useCallback((id: string, bin: number) => {
    if (assignments[id] !== undefined) return;
    const item = items.find((t) => t.id === id);
    if (!item) return;
    const nextAssign = { ...assignments, [id]: bin };
    setAssignments(nextAssign);
    const correct = item.bin === bin;
    const doneCount = Object.keys(nextAssign).length;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Chopped! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `"${item.label}" is a ${BINS[item.bin]} token.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="✂️" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each chopped piece into <strong>Word</strong>, <strong>Subword</strong>, <strong>Punct</strong>, or <strong>Special</strong>.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Chopping <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="✂️" color={LAB_COLOR}>Sort the Tokens</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Scissors className="w-4 h-4" />{sortedCount} / {items.length}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiBinSortStage
        items={sceneItems}
        bins={BINS}
        assignments={assignments}
        onAssign={handleAssign}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrong)} disabled={!allSorted}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allSorted ? 'Done!' : `Sort ${items.length - sortedCount} more…`}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function TokenChopperGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('token-chopper', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
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
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
