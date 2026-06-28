// ════════════════════════════════════════════════════════════════════════
// FOOL THE AI v4 — Lab 7 — SORT archetype migration (Wave 2)
// ════════════════════════════════════════════════════════════════════════
// Was an adversarial-attack quiz on QuizLevelRenderer. Now you SORT each image
// change into one of two bins — "Fools the AI" / "AI still sees it" — exactly
// the adversarial-example demo. An AI-confidence meter climbs with each correct
// call (the classifier gets more fooled) and dips on a mistake. Pixi SORT scene
// (drag chips into named bins) inside GameShell.
//
// Teaches: adversarial examples — which subtle changes break an image
// classifier and which harmless edits it shrugs off.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Shield, GraduationCap, Target, RotateCcw, Sparkles,
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
const BINS = ['Fools the AI', 'AI still sees it']; // bin index 0 / 1
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#F59E0B', '#10BAD2', '#FF7050', '#8F96FA'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Trick the Classifier', description: 'Which tweaks fool an image AI?', emoji: '🐱', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Invisible Changes', description: 'Tiny pixels, big confusion.', emoji: '🔬', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Stop Signs', description: 'What makes AI miss a sign?', emoji: '🛑', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Patch Attacks', description: 'Stickers that hijack a label.', emoji: '🎨', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Noise vs Edit', description: 'Perturbation or harmless edit?', emoji: '🌫️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Physical World', description: 'Real-world camera attacks.', emoji: '📷', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'One-Pixel Power', description: 'How little it takes to fool AI.', emoji: '⬛', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Robust Edits', description: 'Changes AI shrugs off.', emoji: '🛡️', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Attack or Augment?', description: 'Tell tricks from training tweaks.', emoji: '⚖️', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Adversarial Master', description: 'Master the art of fooling AI!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'An adversarial example is a carefully crafted change that makes an AI confidently wrong — while harmless edits leave it unbothered.',
  2: 'Imperceptible pixel noise can flip a classifier from "cat" to "dog". You cannot see it, but the AI can.',
  3: 'Specially placed stickers on a stop sign can make a vision model fail to recognize it — a real attack, not a harmless mark.',
  4: 'An adversarial patch is a printed sticker designed to hijack the AI\'s label no matter where it appears in the image.',
  5: 'The trick is targeting the model: crafted perturbations fool it, but a small crop or resize does not.',
  6: 'Physical-world attacks — patches, stickers, projected light — survive being photographed by a real camera.',
  7: 'The one-pixel attack changes a single pixel and still flips the label, showing how fragile classifiers can be.',
  8: 'Robust models shrug off mild rotation, brightness shifts, and resizing — these are normal edits, not attacks.',
  9: 'Data augmentation (flips, crops, brightness) helps training. Adversarial perturbations attack. Know which is which.',
  10: 'Master test: spot the crafted attacks that fool the AI and separate them from the harmless everyday edits.',
};

// ════════════════════════════════════════════════════════════════════════
// ATTACK ITEM BANK — short chip label + full name + correct bin + why
// bin 0 = "Fools the AI" (adversarial), bin 1 = "AI still sees it" (harmless)
// (interleaved so any window covers both bins)
// ════════════════════════════════════════════════════════════════════════
interface AttackItem { id: string; label: string; name: string; bin: number; why: string; }

const BANK: AttackItem[] = [
  { id: 'patch', label: 'Adv. Patch', name: 'Adversarial Patch', bin: 0, why: 'A printed adversarial patch is crafted to hijack the AI\'s label — it fools the classifier.' },
  { id: 'crop', label: 'Mild Crop', name: 'Mild Crop', bin: 1, why: 'A small crop keeps the subject in view, so the AI still recognizes it.' },
  { id: 'pixelnoise', label: 'Pixel Noise', name: 'Imperceptible Pixel Noise', bin: 0, why: 'Tiny crafted pixel noise is invisible to you but flips the AI\'s prediction.' },
  { id: 'rotate', label: 'Small Rotate', name: 'Slight Rotation', bin: 1, why: 'A few degrees of rotation does not change what the object is — AI still sees it.' },
  { id: 'sticker', label: 'Attack Sticker', name: 'Stop-Sign Sticker', bin: 0, why: 'Special stickers on a stop sign can make a vision model miss it entirely.' },
  { id: 'bright', label: 'Slight Bright', name: 'Slight Brightness', bin: 1, why: 'A small brightness change is a normal edit the model handles fine.' },
  { id: 'onepixel', label: 'One-Pixel', name: 'One-Pixel Attack', bin: 0, why: 'Changing a single carefully chosen pixel can still flip the AI\'s label.' },
  { id: 'resize', label: 'Resize', name: 'Resize Image', bin: 1, why: 'Resizing keeps the picture\'s content, so the classifier still reads it.' },
  { id: 'occlusion', label: 'Occlude Patch', name: 'Occlusion Patch', bin: 0, why: 'An adversarial occlusion patch hides the key features the AI needs.' },
  { id: 'flip', label: 'H-Flip', name: 'Horizontal Flip', bin: 1, why: 'Mirroring an image leaves the object the same — AI still recognizes it.' },
  { id: 'perturb', label: 'Perturbation', name: 'Gradient Perturbation', bin: 0, why: 'A gradient-crafted perturbation nudges pixels toward a wrong, confident answer.' },
  { id: 'compress', label: 'JPEG Save', name: 'JPEG Compression', bin: 1, why: 'Mild compression loses a little detail but not the subject — AI still sees it.' },
  { id: 'glasses', label: 'Adv. Glasses', name: 'Adversarial Glasses', bin: 0, why: 'Printed adversarial eyeglass frames can fool a face recognizer.' },
  { id: 'blurmild', label: 'Light Blur', name: 'Light Blur', bin: 1, why: 'A little blur softens edges but keeps the object recognizable.' },
  { id: 'lightproj', label: 'Light Attack', name: 'Projected Light Pattern', bin: 0, why: 'Projecting a crafted light pattern onto an object can flip the camera\'s reading.' },
  { id: 'pad', label: 'Add Border', name: 'Add Plain Border', bin: 1, why: 'Adding a plain border around the photo does not change what is inside.' },
];

function getItems(levelId: number): AttackItem[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: AttackItem[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  // De-dup in case the window wraps onto itself.
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board + AI-confidence meter
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
  const [fooled, setFooled] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;
  const perItemFool = Math.round(100 / items.length);

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
    const correct = item.bin === bin;
    const doneCount = Object.keys(nextAssign).length;

    if (correct) {
      const gained = 10 + combo;
      const nextScore = score + gained;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      setFooled((s) => Math.min(100, s + perItemFool));
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Fooled it! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFooled((s) => Math.max(0, s - Math.round(perItemFool / 2)));
      setFeedback({ type: 'wrong', message: `That belongs in "${BINS[item.bin]}".`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, perItemFool, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="😈" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each change into <strong>Fools the AI</strong> or <strong>AI still sees it</strong>. Drive the AI&apos;s confidence down!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="😈" color={LAB_COLOR}>Sort the Attacks</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Shield className="w-4 h-4" />AI Confidence {fooled}%
        </span>
      </div>

      {/* AI-confidence meter (rises as you correctly spot fooling attacks) */}
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#0E1428' }} aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${fooled}%`, background: `linear-gradient(90deg, ${LAB_COLOR}, #E945F5)` }}
        />
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
          {allSorted ? 'Fooled!' : `Sort ${items.length - sortedCount} more…`}
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
export default function FoolTheAiGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('fool-the-ai', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Fool the AI" color="#10BAD2" labNum={7}>
      <GameLevelSystem
        gameTitle="Fool the AI"
        gameEmoji="😈"
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
