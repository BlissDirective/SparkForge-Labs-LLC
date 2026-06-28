// ════════════════════════════════════════════════════════════════════════
// BUILD A CLASSIFIER v4 — Lab 7 (Computer Vision) — SORT archetype (Wave 4)
// ════════════════════════════════════════════════════════════════════════
// Was a Collect → Train → Test pipeline screen. Now you build the training set
// the way a real classifier learns: drag each labelled EXAMPLE into its class
// bin. A live accuracy meter rewards balanced, correct labelling. Pixi SORT
// scene (named class bins, which vary per level) inside GameShell.
//
// Teaches: a classifier learns from correctly-labelled training examples — the
// cleaner and more balanced the labels, the higher the accuracy.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Cpu, GraduationCap, Target, RotateCcw, Sparkles,
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
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#10BAD2';
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#F59E0B', '#8F96FA', '#FF7050'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Cats vs Dogs', description: 'Label the examples to teach the classifier.', emoji: '🐱', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Fruit Sorter', description: 'Two classes of fruit.', emoji: '🍎', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Vehicles', description: 'Three classes to learn.', emoji: '🚗', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Emotion Reader', description: 'Classify the feeling.', emoji: '🙂', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Spam Filter', description: 'Spam or not spam?', emoji: '📧', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Animal Classes', description: 'Three animal classes.', emoji: '🦜', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Shape Detector', description: 'Three geometric classes.', emoji: '🔷', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Ripe or Not', description: 'Watch the noisy edge cases.', emoji: '🍌', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Four Classes', description: 'A bigger label space.', emoji: '🧩', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Classifier Master', description: 'The ultimate training set!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A classifier learns from labelled examples. Put each example in its true class — correct labels build accuracy.',
  2: 'Features separate classes: shape, colour, and size tell an apple from a banana.',
  3: 'More classes = a harder job. The model needs clear features for each one.',
  4: 'Emotion classifiers read features like a smile or a frown to pick the feeling.',
  5: 'A spam filter learns from labelled mail: urgent money offers vs ordinary messages.',
  6: 'Balanced classes matter — give each animal class enough correct examples.',
  7: 'Shape detectors count corners and curves: circle, square, triangle.',
  8: 'Noisy edge cases are tricky. Label carefully — one wrong label hurts accuracy.',
  9: 'A bigger label space (four classes) needs sharper features to keep them apart.',
  10: 'Master test: label every example correctly to train a high-accuracy classifier.',
};

// ════════════════════════════════════════════════════════════════════════
// PER-LEVEL CLASSES + LABELLED EXAMPLES (classes vary per level)
// ════════════════════════════════════════════════════════════════════════
interface Example { id: string; label: string; name: string; cls: number; why: string; }
interface LevelData { classes: string[]; examples: Example[]; }

const LEVEL_DATA: Record<number, LevelData> = {
  1: {
    classes: ['Cat', 'Dog'],
    examples: [
      { id: 'l1a', label: 'Says meow', name: 'Says meow', cls: 0, why: 'Meowing is a cat trait.' },
      { id: 'l1b', label: 'Barks loudly', name: 'Barks loudly', cls: 1, why: 'Barking is a dog trait.' },
      { id: 'l1c', label: 'Purrs', name: 'Purrs when happy', cls: 0, why: 'Purring is a cat behaviour.' },
      { id: 'l1d', label: 'Wags tail', name: 'Wags its tail', cls: 1, why: 'Tail-wagging signals a happy dog.' },
      { id: 'l1e', label: 'Climbs trees', name: 'Climbs trees', cls: 0, why: 'Cats climb with retractable claws.' },
      { id: 'l1f', label: 'Fetches stick', name: 'Fetches a stick', cls: 1, why: 'Fetching is a classic dog game.' },
    ],
  },
  2: {
    classes: ['Apple', 'Banana'],
    examples: [
      { id: 'l2a', label: 'Round & red', name: 'Round and red', cls: 0, why: 'Apples are round and often red.' },
      { id: 'l2b', label: 'Long & yellow', name: 'Long and yellow', cls: 1, why: 'Bananas are long and yellow.' },
      { id: 'l2c', label: 'Crunchy bite', name: 'Crunchy when bitten', cls: 0, why: 'Apples are crisp and crunchy.' },
      { id: 'l2d', label: 'Peel to eat', name: 'You peel it to eat', cls: 1, why: 'Bananas have a peel.' },
      { id: 'l2e', label: 'Has a stem', name: 'Stem on top', cls: 0, why: 'Apples grow with a short stem.' },
      { id: 'l2f', label: 'Curved shape', name: 'Curved shape', cls: 1, why: 'Bananas have a curved shape.' },
    ],
  },
  3: {
    classes: ['Car', 'Plane', 'Boat'],
    examples: [
      { id: 'l3a', label: 'Four wheels', name: 'Four wheels on roads', cls: 0, why: 'Cars drive on wheels.' },
      { id: 'l3b', label: 'Has wings', name: 'Has wings', cls: 1, why: 'Planes use wings to fly.' },
      { id: 'l3c', label: 'Floats', name: 'Floats on water', cls: 2, why: 'Boats float on water.' },
      { id: 'l3d', label: 'Drives highway', name: 'Drives on a highway', cls: 0, why: 'Cars travel on roads.' },
      { id: 'l3e', label: 'Flies high', name: 'Flies in the sky', cls: 1, why: 'Planes fly through the air.' },
      { id: 'l3f', label: 'Has a sail', name: 'Has a sail or motor on water', cls: 2, why: 'Boats move with sails or motors.' },
    ],
  },
  4: {
    classes: ['Happy', 'Sad', 'Angry'],
    examples: [
      { id: 'l4a', label: 'Big smile', name: 'Big smile, bright eyes', cls: 0, why: 'A smile signals happiness.' },
      { id: 'l4b', label: 'Tears', name: 'Tears and a frown', cls: 1, why: 'Crying signals sadness.' },
      { id: 'l4c', label: 'Clenched jaw', name: 'Furrowed brow, clenched jaw', cls: 2, why: 'A tense face signals anger.' },
      { id: 'l4d', label: 'Laughing', name: 'Laughing out loud', cls: 0, why: 'Laughter is a happy cue.' },
      { id: 'l4e', label: 'Drooping head', name: 'Drooping head, slow', cls: 1, why: 'Low energy signals sadness.' },
      { id: 'l4f', label: 'Red face', name: 'Red face, raised voice', cls: 2, why: 'A flushed, loud cue signals anger.' },
    ],
  },
  5: {
    classes: ['Spam', 'Not Spam'],
    examples: [
      { id: 'l5a', label: 'FREE prize!!!', name: 'WIN a FREE prize NOW!!!', cls: 0, why: 'Urgent free-prize hype is classic spam.' },
      { id: 'l5b', label: 'Meeting 3pm', name: 'Meeting moved to 3pm', cls: 1, why: 'A normal scheduling note is not spam.' },
      { id: 'l5c', label: 'Claim $1000', name: 'Click here to claim $1000', cls: 0, why: 'Money-bait links are spam.' },
      { id: 'l5d', label: 'Trip photos', name: 'Here are the trip photos', cls: 1, why: 'A friendly personal message is not spam.' },
      { id: 'l5e', label: 'Verify account', name: 'Urgent: verify your account', cls: 0, why: 'Fake urgent verify requests are phishing spam.' },
      { id: 'l5f', label: 'Homework due', name: 'Homework is due Friday', cls: 1, why: 'An ordinary reminder is not spam.' },
    ],
  },
  6: {
    classes: ['Dog', 'Cat', 'Bird'],
    examples: [
      { id: 'l6a', label: 'Has feathers', name: 'Has feathers and wings', cls: 2, why: 'Feathers mean a bird.' },
      { id: 'l6b', label: 'Barks', name: 'Barks and fetches', cls: 0, why: 'Barking means a dog.' },
      { id: 'l6c', label: 'Meows', name: 'Meows and purrs', cls: 1, why: 'Meowing means a cat.' },
      { id: 'l6d', label: 'Chirps', name: 'Chirps a song', cls: 2, why: 'Chirping means a bird.' },
      { id: 'l6e', label: 'Wags tail', name: 'Wags its tail', cls: 0, why: 'Tail-wagging means a dog.' },
      { id: 'l6f', label: 'Whiskers', name: 'Whiskers and claws', cls: 1, why: 'Whiskers point to a cat.' },
    ],
  },
  7: {
    classes: ['Circle', 'Square', 'Triangle'],
    examples: [
      { id: 'l7a', label: 'No corners', name: 'Round, no corners', cls: 0, why: 'A circle has no corners.' },
      { id: 'l7b', label: '4 equal sides', name: 'Four equal sides', cls: 1, why: 'A square has four equal sides.' },
      { id: 'l7c', label: '3 corners', name: 'Three corners', cls: 2, why: 'A triangle has three corners.' },
      { id: 'l7d', label: 'Perfectly round', name: 'Perfectly round edge', cls: 0, why: 'A circle is one curved edge.' },
      { id: 'l7e', label: '4 right angles', name: 'Four right angles', cls: 1, why: 'A square has four right angles.' },
      { id: 'l7f', label: '3 sides', name: 'Three straight sides', cls: 2, why: 'A triangle has three sides.' },
    ],
  },
  8: {
    classes: ['Ripe', 'Unripe'],
    examples: [
      { id: 'l8a', label: 'Yellow soft', name: 'Yellow and soft', cls: 0, why: 'Soft yellow fruit is ripe.' },
      { id: 'l8b', label: 'Green hard', name: 'Green and hard', cls: 1, why: 'Hard green fruit is unripe.' },
      { id: 'l8c', label: 'Sweet smell', name: 'Sweet smell', cls: 0, why: 'A sweet aroma means ripe.' },
      { id: 'l8d', label: 'No smell', name: 'No smell yet', cls: 1, why: 'No aroma means unripe.' },
      { id: 'l8e', label: 'Few brown spots', name: 'A few brown spots', cls: 0, why: 'Spots appear as fruit ripens.' },
      { id: 'l8f', label: 'Bright green', name: 'Bright green all over', cls: 1, why: 'Fully green is still unripe.' },
    ],
  },
  9: {
    classes: ['Land', 'Water', 'Air', 'Space'],
    examples: [
      { id: 'l9a', label: 'Lion', name: 'A lion', cls: 0, why: 'Lions live on land.' },
      { id: 'l9b', label: 'Shark', name: 'A shark', cls: 1, why: 'Sharks live in water.' },
      { id: 'l9c', label: 'Eagle', name: 'An eagle', cls: 2, why: 'Eagles fly in the air.' },
      { id: 'l9d', label: 'Satellite', name: 'A satellite', cls: 3, why: 'Satellites orbit in space.' },
      { id: 'l9e', label: 'Dolphin', name: 'A dolphin', cls: 1, why: 'Dolphins live in water.' },
      { id: 'l9f', label: 'Rover', name: 'A Mars rover', cls: 3, why: 'A rover operates in space.' },
      { id: 'l9g', label: 'Tiger', name: 'A tiger', cls: 0, why: 'Tigers live on land.' },
      { id: 'l9h', label: 'Sparrow', name: 'A sparrow', cls: 2, why: 'Sparrows fly in the air.' },
    ],
  },
  10: {
    classes: ['Vision', 'Language', 'Audio'],
    examples: [
      { id: 'l10a', label: 'Photo of a cat', name: 'A photo of a cat', cls: 0, why: 'An image is vision data.' },
      { id: 'l10b', label: 'A sentence', name: 'A written sentence', cls: 1, why: 'Text is language data.' },
      { id: 'l10c', label: 'A song clip', name: 'A song clip', cls: 2, why: 'Sound is audio data.' },
      { id: 'l10d', label: 'A drawing', name: 'A hand drawing', cls: 0, why: 'A drawing is vision data.' },
      { id: 'l10e', label: 'A chat message', name: 'A chat message', cls: 1, why: 'A message is language data.' },
      { id: 'l10f', label: 'A voice note', name: 'A voice note', cls: 2, why: 'Speech is audio data.' },
      { id: 'l10g', label: 'A video frame', name: 'A video frame', cls: 0, why: 'A frame is vision data.' },
      { id: 'l10h', label: 'A podcast', name: 'A podcast clip', cls: 2, why: 'A podcast is audio data.' },
    ],
  },
};

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board + accuracy meter
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const data = LEVEL_DATA[level.id] || LEVEL_DATA[1];
  const [phase, setPhase] = useState<'welcome' | 'sort'>('welcome');
  const items = data.examples;
  const bins = data.classes;
  const [assignments, setAssignments] = useState<Record<string, number | undefined>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;
  // Live accuracy: correctly-labelled examples ÷ examples labelled so far.
  const correctCount = items.filter((t) => assignments[t.id] !== undefined && assignments[t.id] === t.cls).length;
  const accuracy = sortedCount > 0 ? Math.round((correctCount / sortedCount) * 100) : 0;

  const sceneItems = useMemo<BinSortItem[]>(
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: it.name, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
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
    const correct = item.cls === bin;
    const doneCount = Object.keys(nextAssign).length;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Labelled! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That example is class "${bins[item.cls]}".`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, bins, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🧠" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Train:</strong> Drag each example into its class: {bins.join(' · ')}. Push the accuracy meter up!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Training <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🧠" color={LAB_COLOR}>Label the Examples</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Cpu className="w-4 h-4" />{accuracy}% acc
        </span>
      </div>

      {/* Accuracy meter */}
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#0E1428' }} aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${accuracy}%`, background: `linear-gradient(90deg, ${LAB_COLOR}, #2ECC71)` }}
        />
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiBinSortStage
        items={sceneItems}
        bins={bins}
        assignments={assignments}
        onAssign={handleAssign}
        labColor={LAB_COLOR}
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrong)} disabled={!allSorted}>
          <Sparkles className="w-4 h-4 mr-2" />
          {allSorted ? 'Train!' : `Label ${items.length - sortedCount} more…`}
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
export default function BuildClassifierGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('build-classifier', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Build a Classifier" color={LAB_COLOR} labNum={7}>
      <GameLevelSystem
        gameTitle="Build a Classifier"
        gameEmoji="🧠"
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
