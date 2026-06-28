// ════════════════════════════════════════════════════════════════════════
// PIXEL INVESTIGATOR v4 — Lab 7 — REVEAL archetype migration (Wave 2)
// ════════════════════════════════════════════════════════════════════════
// Was an image-forensics quiz on QuizLevelRenderer. Now a COMPUTER-VISION
// hunt: a pixelated scene is scanned; tap the feature/object tiles the AI's
// vision system flagged. Tapping reveals whether the detector confirms it as
// a real TARGET (isPrize) or whether it was a distractor / false alarm.
// Pixi REVEAL scene inside GameShell.
//
// Teaches: how computer vision "sees" — edges, textures, features, and how an
// object detector separates true targets from false positives.

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

const LAB_COLOR = '#FF70AF';

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Zoom In', description: 'Pixels tell the truth — find the real features.', emoji: '🔍', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Edge Detection', description: 'Trace the outlines the detector flagged.', emoji: '📐', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Metadata Clues', description: 'Hidden info the vision system reads.', emoji: '📁', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Lighting Check', description: 'Shadows and highlights reveal true targets.', emoji: '💡', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Feature Maps', description: 'What patterns light up the detector?', emoji: '📊', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Object Detection', description: 'Find the objects the AI boxed in.', emoji: '👤', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Hidden Signals', description: 'Steganography and subtle pixel tells.', emoji: '🕵️', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Camera Fingerprint', description: 'Every sensor leaves a unique trace.', emoji: '📷', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'AI vs Real', description: 'Separate AI artifacts from genuine detail.', emoji: '🎨', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Master Detective', description: 'The ultimate computer-vision case!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Computer vision sees images as grids of pixels. Zooming in reveals grain and noise — real detail the detector keys on.',
  2: 'Edge detection finds sharp changes in brightness. Strong, consistent edges mark the boundaries of real objects.',
  3: 'EXIF metadata stores camera, date, and GPS. Vision systems read it for context the pixels alone do not show.',
  4: 'Shadows and highlights must point the same way. Consistent lighting tells the detector a feature is genuinely present.',
  5: 'A feature map shows which textures and patterns activate the network — that is literally how the AI "sees".',
  6: 'Object detection draws boxes around things it recognizes. A true detection is a real object, not a look-alike.',
  7: 'Steganography hides data in pixel values. Subtle, repeating pixel signals are tells a forensic detector hunts for.',
  8: 'Each sensor has a unique noise pattern (PRNU). That fingerprint confirms a photo came from a real camera.',
  9: 'AI images struggle with fine detail — hands, text, repeats. Genuine consistent detail is what the detector trusts.',
  10: 'Master case: across edges, lighting, metadata, and texture, separate every true target from the false alarms.',
};

// ════════════════════════════════════════════════════════════════════════
// FEATURE / OBJECT BANK — candidate tiles the detector evaluates.
// isTarget = a real detected target (prize). false = a distractor / false alarm.
// (interleaved so any window holds both targets and distractors)
// ════════════════════════════════════════════════════════════════════════
interface FeatureItem { id: string; label: string; isTarget: boolean; why: string; }

const BANK: FeatureItem[] = [
  { id: 'sensor-grain', label: 'Natural sensor grain', isTarget: true, why: 'Real photos carry organic sensor noise and grain — a genuine feature the detector keys on.' },
  { id: 'flat-fill', label: 'Suspiciously flat fill', isTarget: false, why: 'Perfectly flat, noiseless regions are a false alarm — often a cloned or painted-over patch, not a real object.' },
  { id: 'strong-edge', label: 'Sharp object edge', isTarget: true, why: 'Edge detection flags strong brightness changes — these mark the true boundary of a real object.' },
  { id: 'soft-blur', label: 'Soft blurred smear', isTarget: false, why: 'A vague, edgeless smear has no detectable structure — the detector treats it as background, not a target.' },
  { id: 'exif-block', label: 'Valid EXIF metadata', isTarget: true, why: 'Authentic camera metadata (model, date, GPS) is real evidence a vision system reads alongside the pixels.' },
  { id: 'stripped-meta', label: 'Stripped metadata field', isTarget: false, why: 'Missing or wiped metadata gives the detector nothing to confirm — a dead end, not a detection.' },
  { id: 'consistent-shadow', label: 'Consistent shadow angle', isTarget: true, why: 'Shadows pointing one way match a single light source — a sign of a genuine object in the scene.' },
  { id: 'mismatched-light', label: 'Mismatched highlight', isTarget: false, why: 'A highlight lit from the wrong direction is a composite tell — a false target, not a real feature.' },
  { id: 'feature-map-spike', label: 'Strong feature activation', isTarget: true, why: 'A region that strongly activates the feature map is exactly what the network recognizes as a target.' },
  { id: 'noise-only', label: 'Random noise patch', isTarget: false, why: 'Pure random noise activates nothing meaningful — the detector correctly ignores it as a distractor.' },
  { id: 'bounding-box', label: 'Clean bounding box', isTarget: true, why: 'A tight, confident bounding box means the object detector found and localized a real object.' },
  { id: 'ghost-box', label: 'Low-confidence ghost box', isTarget: false, why: 'A faint, low-confidence box is usually a false positive — the detector saw a look-alike, not a target.' },
  { id: 'prnu-pattern', label: 'Sensor fingerprint (PRNU)', isTarget: true, why: 'A unique sensor noise pattern (PRNU) confirms the image came from a real, identifiable camera.' },
  { id: 'jpeg-block', label: 'JPEG block artifact', isTarget: false, why: 'Blocky compression artifacts are damage, not content — a distractor the detector should not flag as an object.' },
  { id: 'fine-texture', label: 'Consistent fine texture', isTarget: true, why: 'Genuine, consistent fine detail (skin, fabric, hair) is what the detector trusts as a real surface.' },
  { id: 'melted-detail', label: 'Melted AI detail', isTarget: false, why: 'Warped hands, garbled text, and melting edges are AI-generation artifacts — false alarms, not real targets.' },
];

function getTiles(levelId: number): FeatureItem[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 tiles
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: FeatureItem[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  const deduped = out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
  // Guarantee at least one target to find.
  if (!deduped.some((it) => it.isTarget)) deduped[0] = BANK.find((b) => b.isTarget)!;
  return deduped;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REVEAL computer-vision hunt
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

  const targetTotal = useMemo(() => tiles.filter((t) => t.isTarget).length, [tiles]);
  const maxScore = targetTotal * 10 + 20;

  const sceneTiles = useMemo<RevealTile[]>(
    () => tiles.map((t) => ({ id: t.id, isPrize: t.isTarget, label: t.label })),
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
        message: nextCombo > 2 ? `${nextCombo}x combo! Target found +${gained}` : `Target found! +${gained}`,
        explanation: tile.why,
      });
      const foundNow = tiles.filter((t) => t.isTarget && nextRevealed[t.id]).length;
      juice.onCorrect(foundNow, nextScore);
      if (foundNow >= targetTotal) finishLevel(nextScore, wrongTaps, nextRevealed);
    } else {
      setCombo(0);
      const nextWrong = wrongTaps + 1;
      setWrongTaps(nextWrong);
      setFeedback({ type: 'info', message: 'False alarm — not a real target.', explanation: tile.why });
      juice.onWrong(0, score);
    }
  }, [revealed, tiles, combo, score, wrongTaps, targetTotal, juice, finishLevel]);

  const found = tiles.filter((t) => t.isTarget && revealed[t.id]).length;

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Inspect:</strong> Tap every tile you think the detector flagged as a <strong>real target</strong>. Find all {targetTotal} targets!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('hunt')}>
          Start Inspecting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Scan for Targets</GlowingTitle>
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
        actionLabel="Inspect"
        showLabelsCovered
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={() => finishLevel(score, wrongTaps, revealed)}>
          <Sparkles className="w-4 h-4 mr-2" />
          {found >= targetTotal ? 'All targets found!' : 'Finish inspection'}
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
export default function PixelInvestigatorGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('pixel-investigator', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Pixel Investigator" color="#FF70AF" labNum={3}>
      <GameLevelSystem
        gameTitle="Pixel Investigator"
        gameEmoji="🔍"
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
