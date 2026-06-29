// ════════════════════════════════════════════════════════════════════════
// EMOJI DECODER v4 — Lab 1 (How AI Sees) — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was an emoji-meaning quiz. Now you SORT emoji — referred to by their TEXT
// NAMES, never their glyphs — into what they MEAN: Positive / Negative /
// Action / Object. This is how a model decodes an emoji: not as a picture, but
// as a token with a meaning category. (No-emoji guard: chips show the words
// "thumbs up", "angry face", "running person", "pizza" — never the glyph.)
//
// Teaches: emoji are TOKENS that carry meaning — a sentiment, an action, or a
// thing — and AI reads that meaning, not the picture.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Smile, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#8F96FA';
const BINS = ['Positive', 'Negative', 'Action', 'Object']; // bin index 0 / 1 / 2 / 3
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Happy Faces', description: 'Sort the cheerful faces into Positive.', emoji: '😊', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Upset Faces', description: 'Some faces carry a negative feeling.', emoji: '😠', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Gestures', description: 'Hand signs mean approval — or not.', emoji: '👍', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Actions', description: 'Some emoji show something happening.', emoji: '🏃', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Objects', description: 'Foods and things are objects.', emoji: '🍕', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Mixed Meanings', description: 'All four meaning kinds together.', emoji: '🌍', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Tricky Feelings', description: 'Tell positive from negative carefully.', emoji: '😅', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Action or Object?', description: 'Is it a thing, or a thing happening?', emoji: '🎨', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Decoder Drill', description: 'Decode every emoji by its meaning.', emoji: '🤖', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Emoji Master', description: 'The ultimate meaning sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI does not see an emoji as a picture — it reads it as a token with a meaning. A smiling face means something Positive.',
  2: 'A model decodes an angry or crying face as a Negative sentiment — the same way it reads negative words.',
  3: 'Gestures carry sentiment: a thumbs up is Positive, a thumbs down is Negative — to a model, just like good/bad words.',
  4: 'Some emoji name an Action — a running person or someone dancing — the model decodes "something is happening".',
  5: 'Many emoji are Objects — a pizza, a rocket, a book. The model decodes them as the thing they name.',
  6: 'Real messages mix all four: Positive feelings, Negative feelings, Actions, and Objects, all as tokens.',
  7: 'Some faces are tricky — a nervous smile leans Negative even though it is a smile. Meaning, not shape, decides.',
  8: 'A camera is an Object, but a person taking a photo is an Action. The same scene can be a thing or a doing.',
  9: 'Decoding drill: read each emoji as its meaning category — Positive, Negative, Action, or Object.',
  10: 'Master test: decode every emoji by meaning, fast and correctly — the way a real model does.',
};

// ════════════════════════════════════════════════════════════════════════
// EMOJI MEANING BANK — text name + meaning bin + why (interleaved across bins)
// No glyphs anywhere — each emoji is referred to by its text name only.
// ════════════════════════════════════════════════════════════════════════
interface Token { id: string; label: string; bin: number; why: string; }

const BANK: Token[] = [
  { id: 'smiling-face', label: 'smiling face', bin: 0, why: 'A happy face — a model decodes it as a Positive sentiment.' },
  { id: 'angry-face', label: 'angry face', bin: 1, why: 'An angry face reads as a strong Negative feeling.' },
  { id: 'running-person', label: 'running person', bin: 2, why: 'Someone running shows an Action — something is happening.' },
  { id: 'pizza', label: 'pizza', bin: 3, why: 'A pizza is a thing — an Object, not a feeling.' },
  { id: 'red-heart', label: 'red heart', bin: 0, why: 'A heart means love — one of the most Positive tokens.' },
  { id: 'crying-face', label: 'crying face', bin: 1, why: 'A crying face decodes as sadness — a Negative sentiment.' },
  { id: 'dancing-person', label: 'dancing person', bin: 2, why: 'Dancing is an Action — a person doing something.' },
  { id: 'rocket', label: 'rocket', bin: 3, why: 'A rocket is an Object — the thing the emoji names.' },
  { id: 'party-popper', label: 'party popper', bin: 0, why: 'A party popper signals celebration — a Positive token.' },
  { id: 'thumbs-down', label: 'thumbs down', bin: 1, why: 'A thumbs down means disapproval — a Negative gesture.' },
  { id: 'waving-hand', label: 'waving hand', bin: 2, why: 'A waving hand shows the Action of greeting someone.' },
  { id: 'book', label: 'book', bin: 3, why: 'A book is an Object — a thing, not a feeling or an action.' },
  { id: 'thumbs-up', label: 'thumbs up', bin: 0, why: 'A thumbs up means approval — a Positive gesture token.' },
  { id: 'pouting-face', label: 'pouting face', bin: 1, why: 'A pouting, frowning face decodes as a Negative mood.' },
  { id: 'person-running-track', label: 'person walking', bin: 2, why: 'A walking person is an Action — movement is happening.' },
  { id: 'birthday-cake', label: 'birthday cake', bin: 3, why: 'A cake is an Object — the thing pictured, not a feeling.' },
  { id: 'grinning-face', label: 'grinning face', bin: 0, why: 'A big grin reads as a clearly Positive sentiment.' },
  { id: 'broken-heart', label: 'broken heart', bin: 1, why: 'A broken heart decodes as heartbreak — a Negative token.' },
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Decoded! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `"${item.label}" means ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="😊" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each emoji into <strong>Positive</strong>, <strong>Negative</strong>, <strong>Action</strong>, or <strong>Object</strong> by what it means.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Decoding <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="😊" color={LAB_COLOR}>Decode the Emoji</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Smile className="w-4 h-4" />{sortedCount} / {items.length}
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
export default function EmojiDecoderGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('emoji-decoder', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Emoji Decoder" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Emoji Decoder"
        gameEmoji="😊"
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
