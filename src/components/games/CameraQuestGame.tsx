// ════════════════════════════════════════════════════════════════════════
// CAMERA QUEST v6 — Lab 7 (Computer Vision) — DATASET-BUILDER redesign
// ════════════════════════════════════════════════════════════════════════
// Audit §II.4 #22 (REDESIGN): the old build was a category-matching quiz —
// tap word tiles that belong to a class. No camera, no images, no lesson.
//
// v6 is the promised viewfinder. The child PANS a viewfinder across a
// scrolling illustrated scene and SNAPS the sprites that belong to the target
// class ("build a dataset of DOGS"). Every snap drops a polaroid into the
// training tray. Then Sparky — the developing-lab robot — DEVELOPS the model:
// a real, deterministic mini-classifier trains on exactly the dataset the
// child built and is tested on 3 (band C: 5) brand-new images.
//
// HONEST MODEL (G1): the test predictions are the classifier's real output.
//   • It only recognises target VARIETIES it actually saw captured — a narrow
//     dataset MISSES unfamiliar test images (the variety lesson).
//   • Any mislabeled capture (a non-target snapped into the "dog" tray)
//     POISONS the model — a matching test image becomes a FALSE ALARM
//     (the clean-data lesson).
// No answers are pre-labeled; predictions are a pure function of the dataset.
//
// 2026 hook: Level 5 "Tricky Shots" — costumes, occlusion and weird angles —
// proves why real datasets need VARIETY, not just easy front-on shots.
//
// NOTE: Pixi (PixiRevealStage) has been dropped — the scene is SVG/CSS so the
// viewfinder, tray and test grid are real DOM (e2e-inspectable, keyboard-run).

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Camera, Aperture, ChevronLeft, ChevronRight, Bot, Check, X, Images,
  FlaskConical, GraduationCap, Target, ScanLine, Sparkles, ArrowRight,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#10BAD2';

// Dark camera-UI palette (no text-white/opacity utilities anywhere).
const SURFACE = '#0F1622';
const SURFACE_2 = '#151F2E';
const INK = '#E8ECF4';
const INK_DIM = '#9AA6BE';
const GOOD = '#2ECC71';
const BAD = '#FF6B6B';

// Content emoji — the played material (each defined ONCE here). Sprites carry
// their identity as an emoji; VARIETY + visual treatment come from `variety`.
const EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', apple: '🍎', banana: '🍌',
  car: '🚗', tree: '🌳', ball: '⚽', flower: '🌸',
};

// ════════════════════════════════════════════════════════════════════════
// DATA MODEL
// ════════════════════════════════════════════════════════════════════════
// A scene sprite. isTarget ⇒ belongs to the level's class; `variety` is the
// appearance the model learns to recognise. A distractor carries `category`,
// the concept that gets poisoned into the model if it is mislabeled (snapped).
interface Sprite {
  id: string;
  kind: keyof typeof EMOJI;
  label: string;
  isTarget: boolean;
  variety?: string;   // targets only — visual look + the feature the model learns
  category?: string;  // distractors only — the false concept a mislabel teaches
}

interface TestImage {
  id: string;
  kind: keyof typeof EMOJI;
  label: string;
  isTarget: boolean;
  variety?: string;
  category?: string;
  tricky?: boolean;   // costume / occlusion / weird angle — needs a varied dataset
}

interface LevelData {
  target: string;      // human name of the class, e.g. "Dog"
  concept: string;     // the CV lesson for this level
  scene: Sprite[];
  test: TestImage[];       // base test set (bands A/B → 3 images)
  testExtraC: TestImage[]; // appended for band C → 5 images
}

// Star thresholds map to test-accuracy percentage (score is 0–100).
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Dogs', description: 'Build a dataset of DOGS. Snap every dog you can frame.', emoji: EMOJI.dog, difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Cats', description: 'Build a dataset of CATS — and nothing but cats.', emoji: EMOJI.cat, difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Birds', description: 'Build a dataset of BIRDS. Watch for the flying ones!', emoji: EMOJI.bird, difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 4, name: 'Fruit', description: 'Build a dataset of FRUIT — apples AND bananas count.', emoji: EMOJI.apple, difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 5, name: 'Tricky Shots', description: 'Dogs in costumes, half-hidden, at weird angles. Capture them ALL.', emoji: EMOJI.dog, difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130, isBonus: true },
];

const LEVEL_DATA: Record<number, LevelData> = {
  1: {
    target: 'Dog',
    concept: 'A model learns a class from labeled examples. Every dog you snap becomes a labeled "dog" image the classifier trains on.',
    scene: [
      { id: 'l1-d1', kind: 'dog', label: 'Dog, sitting', isTarget: true, variety: 'sitting' },
      { id: 'l1-cat', kind: 'cat', label: 'Cat', isTarget: false, category: 'cat' },
      { id: 'l1-d2', kind: 'dog', label: 'Dog, standing', isTarget: true, variety: 'standing' },
      { id: 'l1-car', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
      { id: 'l1-d3', kind: 'dog', label: 'Dog, running', isTarget: true, variety: 'running' },
      { id: 'l1-tree', kind: 'tree', label: 'Tree', isTarget: false, category: 'tree' },
    ],
    test: [
      { id: 'l1-t1', kind: 'dog', label: 'Dog, sitting', isTarget: true, variety: 'sitting' },
      { id: 'l1-t2', kind: 'dog', label: 'Dog, running', isTarget: true, variety: 'running' },
      { id: 'l1-t3', kind: 'cat', label: 'Cat', isTarget: false, category: 'cat' },
    ],
    testExtraC: [
      { id: 'l1-t4', kind: 'dog', label: 'Dog, standing', isTarget: true, variety: 'standing' },
      { id: 'l1-t5', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
    ],
  },
  2: {
    target: 'Cat',
    concept: 'A clean dataset holds ONLY true members of the class. One wrong label and the model learns the wrong pattern.',
    scene: [
      { id: 'l2-c1', kind: 'cat', label: 'Cat, sitting', isTarget: true, variety: 'sitting' },
      { id: 'l2-dog', kind: 'dog', label: 'Dog', isTarget: false, category: 'dog' },
      { id: 'l2-c2', kind: 'cat', label: 'Cat, curled up', isTarget: true, variety: 'curled' },
      { id: 'l2-ball', kind: 'ball', label: 'Ball', isTarget: false, category: 'ball' },
      { id: 'l2-c3', kind: 'cat', label: 'Cat, standing', isTarget: true, variety: 'standing' },
      { id: 'l2-bird', kind: 'bird', label: 'Bird', isTarget: false, category: 'bird' },
    ],
    test: [
      { id: 'l2-t1', kind: 'cat', label: 'Cat, sitting', isTarget: true, variety: 'sitting' },
      { id: 'l2-t2', kind: 'cat', label: 'Cat, curled up', isTarget: true, variety: 'curled' },
      { id: 'l2-t3', kind: 'dog', label: 'Dog', isTarget: false, category: 'dog' },
    ],
    testExtraC: [
      { id: 'l2-t4', kind: 'cat', label: 'Cat, standing', isTarget: true, variety: 'standing' },
      { id: 'l2-t5', kind: 'bird', label: 'Bird', isTarget: false, category: 'bird' },
    ],
  },
  3: {
    target: 'Bird',
    concept: 'The same object looks different from every angle. A model only recognises poses it has seen — a flying bird and a perched bird are different views.',
    scene: [
      { id: 'l3-b1', kind: 'bird', label: 'Bird, perched', isTarget: true, variety: 'perched' },
      { id: 'l3-cat', kind: 'cat', label: 'Cat', isTarget: false, category: 'cat' },
      { id: 'l3-b2', kind: 'bird', label: 'Bird, flying', isTarget: true, variety: 'flying' },
      { id: 'l3-tree', kind: 'tree', label: 'Tree', isTarget: false, category: 'tree' },
      { id: 'l3-b3', kind: 'bird', label: 'Bird, tiny & far', isTarget: true, variety: 'small' },
      { id: 'l3-flower', kind: 'flower', label: 'Flower', isTarget: false, category: 'flower' },
    ],
    test: [
      { id: 'l3-t1', kind: 'bird', label: 'Bird, perched', isTarget: true, variety: 'perched' },
      { id: 'l3-t2', kind: 'bird', label: 'Bird, flying', isTarget: true, variety: 'flying' },
      { id: 'l3-t3', kind: 'cat', label: 'Cat', isTarget: false, category: 'cat' },
    ],
    testExtraC: [
      { id: 'l3-t4', kind: 'bird', label: 'Bird, tiny & far', isTarget: true, variety: 'small' },
      { id: 'l3-t5', kind: 'flower', label: 'Flower', isTarget: false, category: 'flower' },
    ],
  },
  4: {
    target: 'Fruit',
    concept: 'A class can contain very different-looking things. "Fruit" means apples AND bananas — and a round ball is NOT fruit, however similar it looks.',
    scene: [
      { id: 'l4-f1', kind: 'apple', label: 'Apple', isTarget: true, variety: 'apple' },
      { id: 'l4-ball', kind: 'ball', label: 'Ball (looks round!)', isTarget: false, category: 'ball' },
      { id: 'l4-f2', kind: 'banana', label: 'Banana', isTarget: true, variety: 'banana' },
      { id: 'l4-car', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
      { id: 'l4-f3', kind: 'apple', label: 'Apple', isTarget: true, variety: 'apple' },
      { id: 'l4-flower', kind: 'flower', label: 'Flower', isTarget: false, category: 'flower' },
    ],
    test: [
      { id: 'l4-t1', kind: 'apple', label: 'Apple', isTarget: true, variety: 'apple' },
      { id: 'l4-t2', kind: 'banana', label: 'Banana', isTarget: true, variety: 'banana' },
      { id: 'l4-t3', kind: 'ball', label: 'Ball', isTarget: false, category: 'ball', tricky: true },
    ],
    testExtraC: [
      { id: 'l4-t4', kind: 'apple', label: 'Apple', isTarget: true, variety: 'apple' },
      { id: 'l4-t5', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
    ],
  },
  5: {
    target: 'Dog',
    concept: 'Real photos are messy: costumes, occlusion, odd angles. A dataset of only easy front-on shots FAILS on the hard ones. Variety is what makes a model robust.',
    scene: [
      { id: 'l5-d1', kind: 'dog', label: 'Dog, front-on', isTarget: true, variety: 'front' },
      { id: 'l5-cat', kind: 'cat', label: 'Cat (look-alike)', isTarget: false, category: 'cat' },
      { id: 'l5-d2', kind: 'dog', label: 'Dog in a costume', isTarget: true, variety: 'costume' },
      { id: 'l5-car', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
      { id: 'l5-d3', kind: 'dog', label: 'Dog, half-hidden', isTarget: true, variety: 'occluded' },
      { id: 'l5-d4', kind: 'dog', label: 'Dog, weird angle', isTarget: true, variety: 'side' },
    ],
    test: [
      { id: 'l5-t1', kind: 'dog', label: 'Dog in a costume', isTarget: true, variety: 'costume', tricky: true },
      { id: 'l5-t2', kind: 'dog', label: 'Dog, half-hidden', isTarget: true, variety: 'occluded', tricky: true },
      { id: 'l5-t3', kind: 'cat', label: 'Cat', isTarget: false, category: 'cat' },
    ],
    testExtraC: [
      { id: 'l5-t4', kind: 'dog', label: 'Dog, weird angle', isTarget: true, variety: 'side', tricky: true },
      { id: 'l5-t5', kind: 'car', label: 'Car', isTarget: false, category: 'car' },
    ],
  },
};

// ════════════════════════════════════════════════════════════════════════
// THE MINI-CLASSIFIER — honest, deterministic (G1)
// ════════════════════════════════════════════════════════════════════════
// It learns two things from the dataset the child built:
//   seenVarieties = the target appearances it actually saw captured
//   poisoned      = distractor categories that were mislabeled INTO the set
// A test image is predicted "target" iff its variety was learned, OR (for a
// distractor) its category was poisoned in. This is the model's real output,
// not a stored answer key.
interface Prediction { test: TestImage; predicted: boolean; correct: boolean; }

function runClassifier(captured: Sprite[], tests: TestImage[]): Prediction[] {
  const seenVarieties = new Set(
    captured.filter((c) => c.isTarget && c.variety).map((c) => c.variety as string),
  );
  const poisoned = new Set(
    captured.filter((c) => !c.isTarget && c.category).map((c) => c.category as string),
  );
  return tests.map((t) => {
    const predicted = t.isTarget
      ? seenVarieties.has(t.variety ?? '')   // recognised only if that view was learned
      : poisoned.has(t.category ?? '');       // false alarm only if that concept was mislabeled in
    return { test: t, predicted, correct: predicted === t.isTarget };
  });
}

// ════════════════════════════════════════════════════════════════════════
// VISUAL: a single sprite drawn with its variety treatment (SVG/CSS only)
// ════════════════════════════════════════════════════════════════════════
function varietyStyle(variety?: string): React.CSSProperties {
  switch (variety) {
    case 'running': return { transform: 'rotate(6deg)' };
    case 'flying': return { transform: 'rotate(-14deg) translateY(-0.35rem)' };
    case 'small': return { transform: 'scale(0.6)' };
    case 'side': return { transform: 'scaleX(-1) rotate(-7deg)' };
    case 'curled': return { transform: 'rotate(90deg) scale(0.9)' };
    default: return {};
  }
}

function SpriteArt({
  sprite, forgiving,
}: {
  sprite: Sprite | TestImage; forgiving: boolean;
}) {
  const emoji = EMOJI[sprite.kind] ?? '?';
  const v = 'variety' in sprite ? sprite.variety : undefined;
  const occluderOpacity = forgiving ? 0.55 : 0.85;
  return (
    <div className="relative flex items-center justify-center" style={{ width: '4.5rem', height: '4.5rem' }}>
      <span aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1, ...varietyStyle(v) }}>
        {emoji}
      </span>

      {/* Costume: a little party hat drawn over the sprite */}
      {v === 'costume' && (
        <svg aria-hidden="true" viewBox="0 0 40 30" className="absolute" style={{ width: '2.2rem', top: '-0.35rem' }}>
          <polygon points="20,2 8,26 32,26" fill="#E945F5" />
          <circle cx="20" cy="2" r="3" fill="#FFD93D" />
        </svg>
      )}

      {/* Occlusion: leaves/bush partly hiding the sprite */}
      {v === 'occluded' && (
        <svg aria-hidden="true" viewBox="0 0 80 40" className="absolute" style={{ width: '5rem', bottom: '-0.2rem', opacity: occluderOpacity }}>
          <path d="M0,40 Q10,18 22,26 Q28,10 42,22 Q54,10 62,26 Q74,18 80,40 Z" fill="#1F7A3D" />
        </svg>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// VIEWFINDER — pan across the scene, snap the framed sprite
// ════════════════════════════════════════════════════════════════════════
const SLOT = 108; // px per sprite slot along the track

function Viewfinder({
  scene, focus, captured, forgiving, alwaysLabels, reduced,
  onPanLeft, onPanRight, onSnap,
}: {
  scene: Sprite[];
  focus: number;
  captured: Record<string, boolean>;
  forgiving: boolean;
  alwaysLabels: boolean;
  reduced: boolean;
  onPanLeft: () => void;
  onPanRight: () => void;
  onSnap: () => void;
}) {
  const framed = scene[focus];
  const isCaptured = !!captured[framed.id];

  // The scene translates so the focused slot sits under the fixed reticle.
  const translate = `calc(50% - ${(focus + 0.5) * SLOT}px)`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); onPanLeft(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); onPanRight(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSnap(); }
  };

  return (
    <div>
      {/* The scene strip + reticle */}
      <div
        role="group"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Viewfinder. Use the pan buttons or arrow keys to move, and Snap to capture the framed sprite."
        className="relative overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2"
        style={{
          height: '9.5rem',
          background: `radial-gradient(120% 90% at 50% 0%, ${SURFACE_2}, ${SURFACE})`,
          border: `1px solid ${LAB_COLOR}33`,
          ['--tw-ring-color' as string]: LAB_COLOR,
        }}
      >
        {/* Ground line for the "scene" feel */}
        <div aria-hidden="true" className="absolute inset-x-0" style={{ bottom: '1.75rem', height: '1px', background: `${LAB_COLOR}22` }} />

        {/* The panning strip of sprites */}
        <motion.div
          className="absolute flex items-end"
          style={{ bottom: '1.9rem', height: '5rem', left: 0 }}
          animate={{ x: translate }}
          transition={reduced ? { duration: 0 } : { type: 'spring', damping: 26, stiffness: 220 }}
        >
          {scene.map((s, i) => {
            const cap = !!captured[s.id];
            const isFocus = i === focus;
            return (
              <div key={s.id} className="flex flex-col items-center justify-end" style={{ width: `${SLOT}px` }}>
                <div
                  className="relative"
                  style={{
                    opacity: cap ? 0.4 : 1,
                    filter: !isFocus && !cap ? 'brightness(0.72) saturate(0.8)' : 'none',
                    transition: reduced ? 'none' : 'filter 0.2s, opacity 0.2s',
                  }}
                >
                  <SpriteArt sprite={s} forgiving={forgiving} />
                  {cap && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full" style={{ width: '1.15rem', height: '1.15rem', background: LAB_COLOR }}>
                      <Check className="w-3 h-3" style={{ color: SURFACE }} />
                    </span>
                  )}
                </div>
                {(alwaysLabels || isFocus) && (
                  <span className="mt-1 rounded-full px-2 text-center" style={{ fontSize: '0.62rem', color: isFocus ? INK : INK_DIM, background: isFocus ? `${LAB_COLOR}22` : 'transparent', maxWidth: `${SLOT}px` }}>
                    {s.label}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Fixed reticle in the centre */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%,-55%)' }}>
          <svg viewBox="0 0 100 100" style={{ width: '6.5rem', height: '6.5rem' }}>
            {[
              'M6,26 V6 H26', 'M74,6 H94 V26', 'M94,74 V94 H74', 'M26,94 H6 V74',
            ].map((d, i) => (
              <path key={i} d={d} fill="none" stroke={LAB_COLOR} strokeWidth="3" strokeLinecap="round" />
            ))}
            <line x1="50" y1="42" x2="50" y2="58" stroke={LAB_COLOR} strokeWidth="2" />
            <line x1="42" y1="50" x2="58" y2="50" stroke={LAB_COLOR} strokeWidth="2" />
          </svg>
        </div>

        {/* Live caption of what is currently framed (screen-reader + sighted) */}
        <div
          aria-live="polite"
          className="absolute left-1/2 flex items-center gap-1 rounded-full px-3 py-1"
          style={{ bottom: '0.35rem', transform: 'translateX(-50%)', background: `${SURFACE}CC`, border: `1px solid ${LAB_COLOR}33` }}
        >
          <ScanLine className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />
          <span style={{ fontSize: '0.72rem', color: INK }}>
            Framed: {framed.label}{isCaptured ? ' (already captured)' : ''}
          </span>
        </div>
      </div>

      {/* Controls — all real buttons, keyboard-operable */}
      <div className="mt-3 flex items-center gap-2">
        <SFButton variant="outline" onClick={onPanLeft} aria-label="Pan left" disabled={focus === 0}>
          <ChevronLeft className="w-5 h-5" />
        </SFButton>
        <SFButton variant="primary" className="flex-1" onClick={onSnap} disabled={isCaptured} aria-label={isCaptured ? 'Already captured' : `Snap ${framed.label}`}>
          <Aperture className="w-5 h-5 mr-2" />
          {isCaptured ? 'Captured' : 'Snap'}
        </SFButton>
        <SFButton variant="outline" onClick={onPanRight} aria-label="Pan right" disabled={focus === scene.length - 1}>
          <ChevronRight className="w-5 h-5" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const data = LEVEL_DATA[level.id] ?? LEVEL_DATA[1];

  const forgiving = band === 'A';
  const alwaysLabels = band === 'A';
  const tests = useMemo<TestImage[]>(
    () => (band === 'C' ? [...data.test, ...data.testExtraC] : data.test),
    [band, data],
  );

  const [phase, setPhase] = useState<'welcome' | 'hunt' | 'develop'>('welcome');
  const [focus, setFocus] = useState(0);
  const [captured, setCaptured] = useState<Record<string, boolean>>({});
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const capturedList = useMemo(
    () => data.scene.filter((s) => captured[s.id]),
    [data.scene, captured],
  );
  const capturedTargets = capturedList.filter((s) => s.isTarget).length;
  const mislabeled = capturedList.filter((s) => !s.isTarget).length;

  const panLeft = useCallback(() => setFocus((f) => Math.max(0, f - 1)), []);
  const panRight = useCallback(() => setFocus((f) => Math.min(data.scene.length - 1, f + 1)), [data.scene.length]);

  const snap = useCallback(() => {
    const s = data.scene[focus];
    if (!s || captured[s.id]) return;
    setCaptured((prev) => ({ ...prev, [s.id]: true }));
    // Every successful snap feels good — you don't learn if it was a mistake
    // until the model is tested. That reveal IS the lesson.
    juice.onCorrect(1, capturedList.length + 1);
  }, [data.scene, focus, captured, juice, capturedList.length]);

  const develop = useCallback(() => {
    const preds = runClassifier(capturedList, tests);
    setPredictions(preds);
    setPhase('develop');
  }, [capturedList, tests]);

  const result = useMemo<LevelResult>(() => {
    const correct = predictions.filter((p) => p.correct).length;
    const acc = predictions.length ? correct / predictions.length : 0;
    const score = Math.round(acc * 100);
    const stars = (score >= level.starThresholds[2] ? 3
      : score >= level.starThresholds[1] ? 2
        : score >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    return { score, maxScore: 100, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 };
  }, [predictions, level]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-4 p-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl" style={{ width: '2.75rem', height: '2.75rem', background: `${LAB_COLOR}22` }}>
            <Camera className="w-6 h-6" style={{ color: LAB_COLOR }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: INK }}>Level {level.id}: {level.name}</h2>
        </div>

        <div className="rounded-2xl p-4 space-y-3" style={{ background: SURFACE, border: `1px solid ${LAB_COLOR}22` }}>
          <p className="text-sm" style={{ color: INK_DIM }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}14`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Concept:</strong> {data.concept}</span>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3514', color: '#FF8B5A' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Your job:</strong> pan the viewfinder and snap every <strong>{data.target}</strong> to build the dataset. Then Sparky develops the model and tests it on {tests.length} new images. Clean, varied captures make a smart model!</span>
          </div>
        </div>

        <SFButton variant="primary" size="lg" fullWidth onClick={() => setPhase('hunt')}>
          <Camera className="w-5 h-5 mr-2" /> Start Capturing
        </SFButton>
      </div>
    );
  }

  // ═══ DEVELOP / TEST ═══
  if (phase === 'develop') {
    const correct = predictions.filter((p) => p.correct).length;
    const missedTargets = predictions.filter((p) => p.test.isTarget && !p.predicted);
    const falseAlarms = predictions.filter((p) => !p.test.isTarget && p.predicted);

    const verdict = falseAlarms.length > 0
      ? `The model raised ${falseAlarms.length} false alarm${falseAlarms.length > 1 ? 's' : ''} — you snapped ${falseAlarms.length === 1 ? 'something that was not' : 'things that were not'} a ${data.target}, so it learned the wrong pattern. Keep the dataset clean!`
      : missedTargets.length > 0
        ? `The model missed ${missedTargets.length} ${data.target.toLowerCase()}${missedTargets.length > 1 ? 's' : ''} it had never seen that look before. Your dataset was too narrow — capture more variety!`
        : capturedTargets === 0
          ? 'The model saw no examples at all, so it could not learn the class. A model is only as good as its dataset.'
          : `Clean labels and great variety — the model recognised every ${data.target.toLowerCase()} and rejected the rest. That is a strong dataset!`;

    return (
      <div className="relative z-10 space-y-4 p-1">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center justify-center rounded-2xl" style={{ width: '2.75rem', height: '2.75rem', background: `${LAB_COLOR}22` }}
            animate={reduced ? undefined : { rotate: [0, -8, 8, 0] }}
            transition={reduced ? undefined : { repeat: Infinity, duration: 2 }}
          >
            <Bot className="w-6 h-6" style={{ color: LAB_COLOR }} />
          </motion.div>
          <div>
            <h2 className="text-base font-bold" style={{ color: INK }}>Sparky graded your dataset</h2>
            <p className="text-xs" style={{ color: INK_DIM }}>{capturedTargets} good + {mislabeled} mislabeled = {capturedList.length} images</p>
          </div>
        </div>

        {/* Test grid — the model's real predictions on new images */}
        <div
          aria-live="polite"
          aria-label={`Model test: ${correct} of ${predictions.length} new images classified correctly.`}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: SURFACE, border: `1px solid ${LAB_COLOR}22` }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: INK_DIM }}>
            <FlaskConical className="w-4 h-4" style={{ color: LAB_COLOR }} />
            Testing on {predictions.length} brand-new images the model never trained on
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {predictions.map((p, i) => (
              <motion.div
                key={p.test.id}
                className="rounded-xl p-2 flex flex-col items-center gap-1 text-center"
                style={{ background: SURFACE_2, border: `1px solid ${p.correct ? GOOD : BAD}55` }}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { delay: 0.15 + i * 0.12 }}
              >
                <SpriteArt sprite={p.test} forgiving={forgiving} />
                <span style={{ fontSize: '0.62rem', color: INK_DIM }}>{p.test.label}</span>
                <span
                  className="flex items-center gap-1 rounded-full px-1.5"
                  style={{ fontSize: '0.6rem', color: p.correct ? GOOD : BAD, background: `${p.correct ? GOOD : BAD}18` }}
                >
                  {p.correct ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {p.predicted ? data.target : `Not ${data.target.toLowerCase()}`}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="text-center text-sm font-bold" style={{ color: INK }}>
            Model accuracy: {result.score}% ({correct}/{predictions.length})
          </div>
        </div>

        <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}14`, color: INK }}>
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
          <span>{verdict}</span>
        </div>

        <SFButton variant="primary" size="lg" fullWidth onClick={() => onComplete(result)}>
          See my stars <ArrowRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-3 p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" style={{ color: LAB_COLOR }} />
          <h2 className="text-base font-bold" style={{ color: INK }}>Build a dataset of {data.target}s</h2>
        </div>
        <span className="flex items-center gap-1 text-sm font-bold" style={{ color: LAB_COLOR }}>
          <Images className="w-4 h-4" />{capturedList.length}
        </span>
      </div>

      <Viewfinder
        scene={data.scene}
        focus={focus}
        captured={captured}
        forgiving={forgiving}
        alwaysLabels={alwaysLabels}
        reduced={reduced}
        onPanLeft={panLeft}
        onPanRight={panRight}
        onSnap={snap}
      />

      {/* Training tray — polaroids of everything captured */}
      <div className="rounded-2xl p-3" style={{ background: SURFACE, border: `1px solid ${LAB_COLOR}22`, minHeight: '5.5rem' }}>
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold" style={{ color: INK_DIM }}>
          <Images className="w-4 h-4" style={{ color: LAB_COLOR }} />
          Training tray — labeled &ldquo;{data.target}&rdquo;
        </div>
        {capturedList.length === 0 ? (
          <p className="text-xs" style={{ color: INK_DIM }}>Empty. Frame a {data.target.toLowerCase()} in the viewfinder and press Snap.</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="list" aria-label={`Dataset: ${capturedList.length} captured images`}>
            <AnimatePresence>
              {capturedList.map((s) => (
                <motion.div
                  key={s.id}
                  role="listitem"
                  className="rounded-lg flex flex-col items-center pt-1"
                  style={{ width: '3.75rem', background: '#F4F6FB', border: `1px solid ${LAB_COLOR}33` }}
                  initial={reduced ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                >
                  <div style={{ transform: 'scale(0.72)' }}>
                    <SpriteArt sprite={s} forgiving={forgiving} />
                  </div>
                  <span className="w-full text-center pb-1" style={{ fontSize: '0.55rem', color: '#1A1D2B' }}>{data.target}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={develop}>
          <FlaskConical className="w-4 h-4 mr-2" />
          {capturedList.length === 0 ? 'Develop (empty dataset)' : 'Develop & Test the Model'}
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit to level map">
          <X className="w-4 h-4" />
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
  const band: AgeBand = useActiveChild()?.age_band || 'B';

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0); // out of 15
    awardXP(Math.round(totalXP));
    completeGame('camera-quest', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Camera Quest" color={LAB_COLOR} labNum={7}>
      <GameLevelSystem
        gameTitle="Camera Quest"
        gameEmoji={EMOJI.dog}
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
