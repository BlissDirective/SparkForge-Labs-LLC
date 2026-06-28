// ════════════════════════════════════════════════════════════════════════
// CAMERA QUEST v5 — Lab 7 (Computer Vision) — REVEAL archetype migration
// ════════════════════════════════════════════════════════════════════════
// Was a computer-vision quiz on QuizLevelRenderer. Now a CAPTURE HUNT: a
// viewfinder shows a scene of objects; tap the ones that belong to the
// level's TARGET CLASS to capture them for a training set. Capturing a target
// pulses and reveals why it matches; tapping a non-target reveals why it does
// not belong. Pixi REVEAL scene inside GameShell.
//
// Teaches: computer vision identifies and labels objects to build a training
// set — and detection is only as good as the class you train it on.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Sparkles, Search, GraduationCap, Target, RotateCcw,
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
import type { RevealTile } from '@/components/games/pixi/PixiRevealStage';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiRevealStage = dynamic(() => import('@/components/games/pixi/PixiRevealStage'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl" style={{ background: '#0E1428' }} />
  ),
});

const LAB_COLOR = '#FF6B35';

// Each level trains a detector for ONE target class. isPrize = belongs to it.
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Animals', description: 'Capture the animals for the training set.', emoji: '🐱', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Vehicles', description: 'Capture everything that drives or flies.', emoji: '🚗', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Food', description: 'Capture the things you can eat.', emoji: '🍎', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Plants', description: 'Capture the living, growing things.', emoji: '🌿', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Faces', description: 'Capture the human faces.', emoji: '👤', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Tools', description: 'Capture the tools and instruments.', emoji: '🔧', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Buildings', description: 'Capture the structures and landmarks.', emoji: '🏛️', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Furniture', description: 'Capture the things you sit on or use at home.', emoji: '🪑', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Sports Gear', description: 'Capture the sports equipment.', emoji: '⚽', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Vision Master', description: 'The ultimate capture hunt — find every weather sign!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

// Per-level concept — teaches how CV identifies/labels objects to build a set.
const CONCEPTS: Record<number, string> = {
  1: 'Computer vision learns a class from many labeled examples. To detect "animal," it studies thousands of captured animal images.',
  2: 'A detector draws bounding boxes around objects it recognizes. Capturing vehicles labels them for a training set.',
  3: 'Each captured image is a labeled example. The more food images you tag, the better the model learns the "food" class.',
  4: 'Segmentation labels what each region is. Plants share leaves and stems — features the model learns to recognize.',
  5: 'Face detection finds facial features (eyes, nose, mouth). Early systems compared light and dark regions to spot them.',
  6: 'Models learn from labels you give them. Capturing tools teaches the detector the shapes and parts that define a tool.',
  7: 'Buildings have strong edges and straight lines — features edge detection and CNNs latch onto to classify structures.',
  8: 'A training set must be clean: capture only true furniture, or the detector learns the wrong pattern.',
  9: 'Fine-grained classes are harder. Sports gear looks alike, so the model needs many careful labels to tell them apart.',
  10: 'Master test: a precise label set makes a precise detector. Capture only true members of the class.',
};

// ════════════════════════════════════════════════════════════════════════
// OBJECT BANK — per-level pools. label = object name (NO emoji), isMatch =
// belongs to the level's target class. why = the teaching tell.
// (interleaved so any window holds both matches and non-matches)
// ════════════════════════════════════════════════════════════════════════
interface ObjectItem { id: string; label: string; isMatch: boolean; why: string; category: string; }

const POOLS: Record<number, ObjectItem[]> = {
  1: [
    { id: 'a-cat', label: 'Cat', isMatch: true, why: 'A cat is an animal — a clean positive example for the training set.', category: 'animal' },
    { id: 'a-bicycle', label: 'Bicycle', isMatch: false, why: 'A bicycle is a vehicle, not an animal. Capturing it would teach the wrong class.', category: 'vehicle' },
    { id: 'a-dog', label: 'Dog', isMatch: true, why: 'A dog is an animal — exactly the kind of labeled example the detector needs.', category: 'animal' },
    { id: 'a-tree', label: 'Tree', isMatch: false, why: 'A tree is a plant, not an animal. Mislabeling it confuses the model.', category: 'plant' },
    { id: 'a-horse', label: 'Horse', isMatch: true, why: 'A horse is an animal — capture it to grow the "animal" training set.', category: 'animal' },
    { id: 'a-chair', label: 'Chair', isMatch: false, why: 'A chair is furniture, not an animal. Skip it to keep labels clean.', category: 'furniture' },
    { id: 'a-bird', label: 'Bird', isMatch: true, why: 'A bird is an animal — a good positive example for the detector.', category: 'animal' },
    { id: 'a-apple', label: 'Apple', isMatch: false, why: 'An apple is food, not an animal. Wrong class for this hunt.', category: 'food' },
  ],
  2: [
    { id: 'v-car', label: 'Car', isMatch: true, why: 'A car is a vehicle — a clean positive example for the training set.', category: 'vehicle' },
    { id: 'v-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not a vehicle. Capturing it teaches the wrong class.', category: 'animal' },
    { id: 'v-bus', label: 'Bus', isMatch: true, why: 'A bus is a vehicle — exactly what the detector should learn.', category: 'vehicle' },
    { id: 'v-banana', label: 'Banana', isMatch: false, why: 'A banana is food, not a vehicle. Skip it to keep labels clean.', category: 'food' },
    { id: 'v-airplane', label: 'Airplane', isMatch: true, why: 'An airplane is a vehicle — capture it for the "vehicle" class.', category: 'vehicle' },
    { id: 'v-table', label: 'Table', isMatch: false, why: 'A table is furniture, not a vehicle. Wrong class for this hunt.', category: 'furniture' },
    { id: 'v-bicycle', label: 'Bicycle', isMatch: true, why: 'A bicycle is a vehicle — a good positive example for the detector.', category: 'vehicle' },
    { id: 'v-rose', label: 'Rose', isMatch: false, why: 'A rose is a plant, not a vehicle. Mislabeling it confuses the model.', category: 'plant' },
  ],
  3: [
    { id: 'f-apple', label: 'Apple', isMatch: true, why: 'An apple is food — a clean positive example for the training set.', category: 'food' },
    { id: 'f-car', label: 'Car', isMatch: false, why: 'A car is a vehicle, not food. Capturing it teaches the wrong class.', category: 'vehicle' },
    { id: 'f-pizza', label: 'Pizza', isMatch: true, why: 'Pizza is food — exactly the labeled example the detector needs.', category: 'food' },
    { id: 'f-dog', label: 'Dog', isMatch: false, why: 'A dog is an animal, not food. Skip it to keep labels clean.', category: 'animal' },
    { id: 'f-bread', label: 'Bread', isMatch: true, why: 'Bread is food — capture it to grow the "food" training set.', category: 'food' },
    { id: 'f-hammer', label: 'Hammer', isMatch: false, why: 'A hammer is a tool, not food. Wrong class for this hunt.', category: 'tool' },
    { id: 'f-carrot', label: 'Carrot', isMatch: true, why: 'A carrot is food — a good positive example for the detector.', category: 'food' },
    { id: 'f-sofa', label: 'Sofa', isMatch: false, why: 'A sofa is furniture, not food. Mislabeling it confuses the model.', category: 'furniture' },
  ],
  4: [
    { id: 'p-tree', label: 'Tree', isMatch: true, why: 'A tree is a plant — a clean positive example for the training set.', category: 'plant' },
    { id: 'p-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not a plant. Capturing it teaches the wrong class.', category: 'animal' },
    { id: 'p-fern', label: 'Fern', isMatch: true, why: 'A fern is a plant — exactly the labeled example the detector needs.', category: 'plant' },
    { id: 'p-truck', label: 'Truck', isMatch: false, why: 'A truck is a vehicle, not a plant. Skip it to keep labels clean.', category: 'vehicle' },
    { id: 'p-cactus', label: 'Cactus', isMatch: true, why: 'A cactus is a plant — capture it for the "plant" class.', category: 'plant' },
    { id: 'p-wrench', label: 'Wrench', isMatch: false, why: 'A wrench is a tool, not a plant. Wrong class for this hunt.', category: 'tool' },
    { id: 'p-sunflower', label: 'Sunflower', isMatch: true, why: 'A sunflower is a plant — a good positive example for the detector.', category: 'plant' },
    { id: 'p-burger', label: 'Burger', isMatch: false, why: 'A burger is food, not a plant. Mislabeling it confuses the model.', category: 'food' },
  ],
  5: [
    { id: 'fa-child-face', label: 'Smiling child', isMatch: true, why: 'A human face is the target — face detection learns features like eyes and mouth.', category: 'face' },
    { id: 'fa-car', label: 'Car', isMatch: false, why: 'A car is a vehicle, not a face. Capturing it teaches the wrong class.', category: 'vehicle' },
    { id: 'fa-portrait', label: 'Portrait photo', isMatch: true, why: 'A portrait shows a clear face — exactly what a face detector needs.', category: 'face' },
    { id: 'fa-dog', label: 'Dog', isMatch: false, why: 'A dog is an animal, not a human face. Skip it to keep labels clean.', category: 'animal' },
    { id: 'fa-selfie', label: 'Selfie', isMatch: true, why: 'A selfie centers a human face — capture it for the "face" class.', category: 'face' },
    { id: 'fa-clock', label: 'Clock', isMatch: false, why: 'A clock is an object, not a face — though pareidolia can fool weak detectors.', category: 'object' },
    { id: 'fa-headshot', label: 'Headshot', isMatch: true, why: 'A headshot is a clear human face — a good positive example for the detector.', category: 'face' },
    { id: 'fa-mountain', label: 'Mountain', isMatch: false, why: 'A mountain is scenery, not a face. Mislabeling it confuses the model.', category: 'scenery' },
  ],
  6: [
    { id: 't-hammer', label: 'Hammer', isMatch: true, why: 'A hammer is a tool — a clean positive example for the training set.', category: 'tool' },
    { id: 't-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not a tool. Capturing it teaches the wrong class.', category: 'animal' },
    { id: 't-screwdriver', label: 'Screwdriver', isMatch: true, why: 'A screwdriver is a tool — exactly the labeled example the detector needs.', category: 'tool' },
    { id: 't-apple', label: 'Apple', isMatch: false, why: 'An apple is food, not a tool. Skip it to keep labels clean.', category: 'food' },
    { id: 't-wrench', label: 'Wrench', isMatch: true, why: 'A wrench is a tool — capture it to grow the "tool" training set.', category: 'tool' },
    { id: 't-bird', label: 'Bird', isMatch: false, why: 'A bird is an animal, not a tool. Wrong class for this hunt.', category: 'animal' },
    { id: 't-saw', label: 'Saw', isMatch: true, why: 'A saw is a tool — a good positive example for the detector.', category: 'tool' },
    { id: 't-couch', label: 'Couch', isMatch: false, why: 'A couch is furniture, not a tool. Mislabeling it confuses the model.', category: 'furniture' },
  ],
  7: [
    { id: 'b-house', label: 'House', isMatch: true, why: 'A house is a building — a clean positive example for the training set.', category: 'building' },
    { id: 'b-car', label: 'Car', isMatch: false, why: 'A car is a vehicle, not a building. Capturing it teaches the wrong class.', category: 'vehicle' },
    { id: 'b-skyscraper', label: 'Skyscraper', isMatch: true, why: 'A skyscraper is a building — its straight edges are easy features to learn.', category: 'building' },
    { id: 'b-tree', label: 'Tree', isMatch: false, why: 'A tree is a plant, not a building. Skip it to keep labels clean.', category: 'plant' },
    { id: 'b-bridge', label: 'Bridge', isMatch: true, why: 'A bridge is a structure — capture it for the "building" class.', category: 'building' },
    { id: 'b-dog', label: 'Dog', isMatch: false, why: 'A dog is an animal, not a building. Wrong class for this hunt.', category: 'animal' },
    { id: 'b-castle', label: 'Castle', isMatch: true, why: 'A castle is a building — a good positive example for the detector.', category: 'building' },
    { id: 'b-banana', label: 'Banana', isMatch: false, why: 'A banana is food, not a building. Mislabeling it confuses the model.', category: 'food' },
  ],
  8: [
    { id: 'fu-chair', label: 'Chair', isMatch: true, why: 'A chair is furniture — a clean positive example for the training set.', category: 'furniture' },
    { id: 'fu-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not furniture. Capturing it teaches the wrong class.', category: 'animal' },
    { id: 'fu-table', label: 'Table', isMatch: true, why: 'A table is furniture — exactly the labeled example the detector needs.', category: 'furniture' },
    { id: 'fu-car', label: 'Car', isMatch: false, why: 'A car is a vehicle, not furniture. Skip it to keep labels clean.', category: 'vehicle' },
    { id: 'fu-bed', label: 'Bed', isMatch: true, why: 'A bed is furniture — capture it to grow the "furniture" training set.', category: 'furniture' },
    { id: 'fu-apple', label: 'Apple', isMatch: false, why: 'An apple is food, not furniture. Wrong class for this hunt.', category: 'food' },
    { id: 'fu-desk', label: 'Desk', isMatch: true, why: 'A desk is furniture — a good positive example for the detector.', category: 'furniture' },
    { id: 'fu-rose', label: 'Rose', isMatch: false, why: 'A rose is a plant, not furniture. Mislabeling it confuses the model.', category: 'plant' },
  ],
  9: [
    { id: 's-soccer-ball', label: 'Soccer ball', isMatch: true, why: 'A soccer ball is sports gear — a clean positive example for the training set.', category: 'sports' },
    { id: 's-hammer', label: 'Hammer', isMatch: false, why: 'A hammer is a tool, not sports gear. Capturing it teaches the wrong class.', category: 'tool' },
    { id: 's-tennis-racket', label: 'Tennis racket', isMatch: true, why: 'A tennis racket is sports gear — exactly the labeled example the detector needs.', category: 'sports' },
    { id: 's-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not sports gear. Skip it to keep labels clean.', category: 'animal' },
    { id: 's-helmet', label: 'Sports helmet', isMatch: true, why: 'A sports helmet is gear — capture it for the "sports gear" class.', category: 'sports' },
    { id: 's-table', label: 'Table', isMatch: false, why: 'A table is furniture, not sports gear. Wrong class for this hunt.', category: 'furniture' },
    { id: 's-skis', label: 'Skis', isMatch: true, why: 'Skis are sports gear — a good positive example for the detector.', category: 'sports' },
    { id: 's-pizza', label: 'Pizza', isMatch: false, why: 'Pizza is food, not sports gear. Mislabeling it confuses the model.', category: 'food' },
  ],
  10: [
    { id: 'w-rainbow', label: 'Rainbow', isMatch: true, why: 'A rainbow is a weather sign — a clean positive example for the training set.', category: 'weather' },
    { id: 'w-car', label: 'Car', isMatch: false, why: 'A car is a vehicle, not a weather sign. Capturing it teaches the wrong class.', category: 'vehicle' },
    { id: 'w-lightning', label: 'Lightning', isMatch: true, why: 'Lightning is a weather sign — exactly the labeled example the detector needs.', category: 'weather' },
    { id: 'w-cat', label: 'Cat', isMatch: false, why: 'A cat is an animal, not a weather sign. Skip it to keep labels clean.', category: 'animal' },
    { id: 'w-snowflake', label: 'Snowflake', isMatch: true, why: 'A snowflake is a weather sign — capture it for the "weather" class.', category: 'weather' },
    { id: 'w-chair', label: 'Chair', isMatch: false, why: 'A chair is furniture, not a weather sign. Wrong class for this hunt.', category: 'furniture' },
    { id: 'w-storm-cloud', label: 'Storm cloud', isMatch: true, why: 'A storm cloud is a weather sign — a good positive example for the detector.', category: 'weather' },
    { id: 'w-apple', label: 'Apple', isMatch: false, why: 'An apple is food, not a weather sign. Mislabeling it confuses the model.', category: 'food' },
  ],
};

function getTiles(levelId: number): ObjectItem[] {
  const pool = POOLS[levelId] ?? POOLS[1];
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 tiles
  const out: ObjectItem[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  const seen = new Set<string>();
  const deduped = out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
  // Guarantee at least one target to capture.
  if (!deduped.some((it) => it.isMatch)) deduped[0] = pool.find((b) => b.isMatch)!;
  return deduped;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REVEAL capture hunt
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'welcome' | 'hunt'>('welcome');
  const tiles = useMemo(() => getTiles(level.id), [level.id]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const targetTotal = useMemo(() => tiles.filter((t) => t.isMatch).length, [tiles]);
  const maxScore = targetTotal * 10 + 20;

  const sceneTiles = useMemo<RevealTile[]>(
    () => tiles.map((t) => ({ id: t.id, isPrize: t.isMatch, label: t.label })),
    [tiles],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number, finalRevealed: Record<string, boolean>) => {
    const all: Record<string, boolean> = { ...finalRevealed };
    tiles.forEach((t) => { all[t.id] = true; });
    setRevealed(all);

    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: 0 });
    }, 1400);
  }, [tiles, level, maxScore, onComplete]);

  const handleReveal = useCallback((id: string, isPrize: boolean) => {
    if (revealed[id]) return;
    const tile = tiles.find((t) => t.id === id);
    if (!tile) return;

    const nextRevealed = { ...revealed, [id]: true };
    setRevealed(nextRevealed);

    if (isPrize) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFeedback({
        type: 'correct',
        message: nextCombo > 2 ? `${nextCombo}x combo! Captured +${gained}` : `Captured! +${gained}`,
        explanation: tile.why,
      });
      const foundNow = tiles.filter((t) => t.isMatch && nextRevealed[t.id]).length;
      juice.onCorrect(foundNow, nextScore);
      if (foundNow >= targetTotal) finishLevel(nextScore, wrongTaps, nextRevealed);
    } else {
      setCombo(0);
      const nextWrong = wrongTaps + 1;
      setWrongTaps(nextWrong);
      setFeedback({ type: 'info', message: 'That one does not belong.', explanation: tile.why });
      juice.onWrong(0, score);
    }
  }, [revealed, tiles, combo, score, wrongTaps, targetTotal, juice, finishLevel]);

  const found = tiles.filter((t) => t.isMatch && revealed[t.id]).length;

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="📸" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Capture:</strong> Tap every object that belongs to <strong>{level.name}</strong>. Capture all {targetTotal} targets!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('hunt')}>
          Start Capturing <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="📸" color={LAB_COLOR}>Capture the {level.name}</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
          <Search className="w-4 h-4 inline mr-1" />{found} / {targetTotal}
        </span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiRevealStage
        tiles={sceneTiles}
        columns={4}
        revealed={revealed}
        onReveal={handleReveal}
        labColor={LAB_COLOR}
        actionLabel="Capture"
        showLabelsCovered
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrongTaps, revealed)}>
          <Sparkles className="w-4 h-4 mr-2" />
          {found >= targetTotal ? 'All targets captured!' : 'Finish capture'}
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
export default function CameraQuestGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('camera-quest', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Camera Quest" color="#FF6B35" labNum={7}>
      <GameLevelSystem
        gameTitle="Camera Quest"
        gameEmoji="📸"
        labColor="#FF6B35"
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
