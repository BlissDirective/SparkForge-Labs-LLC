// ════════════════════════════════════════════════════════════════════════
// AI OR NOT? v4 — Lab 10 (AI Futures) — REACT archetype migration (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a multiple-choice quiz. Now a DETECTION DRILL: AI "tells" surface in the
// arena and you tap them before they vanish. Speed builds a streak — the same
// reflex the skill needs. Each level focuses on a media type and teaches its
// tells as a learn card. Pixi REACT scene (ReactionArena) inside GameShell.
//
// Teaches: the tell-tale signs of AI-generated media, under time pressure.

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, Timer, Crosshair,
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
  GlowingTitle, ScoreDisplay, ComboCounter,
} from '@/components/games/shared/GameVisualKit';

// Pixi is client-only (WebGL/WebGPU) — never SSR it.
const PixiReactStage = dynamic(() => import('@/components/games/pixi/PixiReactStage'), {
  ssr: false,
  loading: () => <PixiStageSkeleton />,
});

const LAB_COLOR = '#DE5AEA';
const ROUND_SEC = 24;

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'AI Art', description: 'Catch the tells in AI-generated art!', emoji: '🎨', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 50 },
  { id: 2, name: 'Text Tricks', description: 'Spot AI writing patterns fast.', emoji: '✍️', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 60 },
  { id: 3, name: 'Music Mystery', description: 'React to synthetic-music tells.', emoji: '🎵', difficulty: 'easy', starThresholds: [70, 120, 180], xpReward: 70 },
  { id: 4, name: 'Photo Fakes', description: 'Catch AI photo artifacts.', emoji: '📸', difficulty: 'medium', starThresholds: [80, 130, 190], xpReward: 80 },
  { id: 5, name: 'Voice vs AI', description: 'Detect synthetic-voice tells.', emoji: '🗣️', difficulty: 'medium', starThresholds: [80, 130, 190], xpReward: 90 },
  { id: 6, name: 'Deepfake Detect', description: 'Spot manipulated-video tells.', emoji: '🎬', difficulty: 'medium', starThresholds: [80, 140, 200], xpReward: 100 },
  { id: 7, name: 'Code Challenge', description: 'React to AI-coding tells.', emoji: '💻', difficulty: 'hard', starThresholds: [90, 150, 210], xpReward: 120 },
  { id: 8, name: 'News or Nonsense', description: 'Catch AI fake-news tells.', emoji: '📰', difficulty: 'hard', starThresholds: [90, 150, 210], xpReward: 130 },
  { id: 9, name: 'Multi-Media Mix', description: 'All tell types, faster.', emoji: '🔀', difficulty: 'expert', starThresholds: [100, 160, 220], xpReward: 150 },
  { id: 10, name: 'Grand Detector', description: 'The ultimate detection drill.', emoji: '🔍', difficulty: 'expert', starThresholds: [100, 170, 230], xpReward: 200, isBonus: true },
];

// Media type + its AI tells (faithful to v3 explanations), per level.
const MEDIA: Record<number, { type: string; tells: string[] }> = {
  1: { type: 'AI Art', tells: ['strange hands', 'perfect symmetry', 'impossible geometry', 'melting edges'] },
  2: { type: 'AI Text', tells: ['repetitive structure', 'too polished', 'no real typos', 'generic phrasing'] },
  3: { type: 'AI Music', tells: ['perfect quantization', 'no dynamics', 'no breath sounds', 'machine timing'] },
  4: { type: 'AI Photos', tells: ['extra fingers', 'mismatched earrings', 'warped background', 'odd reflections'] },
  5: { type: 'AI Voice', tells: ['no breaths', 'robotic pace', 'flat intonation', 'too consistent'] },
  6: { type: 'Deepfakes', tells: ['unnatural blinking', 'lip-sync drift', 'flickering edges', 'frozen stare'] },
  7: { type: 'AI Code', tells: ['too clean', 'misses edge cases', 'over-commented', 'no TODOs'] },
  8: { type: 'AI News', tells: ['hallucinated sources', 'no byline', 'sensational tone', 'no real facts'] },
  9: { type: 'Mixed Media', tells: ['no EXIF data', 'six fingers', 'fake metadata', 'odd artifacts'] },
  10: { type: 'All Media', tells: ['strange hands', 'no breaths', 'hallucinated sources', 'lip-sync drift', 'too perfect'] },
};

// Difficulty ramp: targets spawn faster and live shorter as levels climb.
function tuning(levelId: number) {
  return {
    spawnEveryMs: Math.max(620, 1180 - levelId * 55),
    lifeMs: Math.max(900, 1750 - levelId * 80),
    maxConcurrent: 2 + Math.floor(levelId / 3),
  };
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REACT detection drill
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const prefersReducedMotion = useReducedMotion();
  const media = MEDIA[level.id] || MEDIA[1];
  const tune = useMemo(() => tuning(level.id), [level.id]);

  const [phase, setPhase] = useState<'welcome' | 'drill'>('welcome');
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [tellIdx, setTellIdx] = useState(0);

  const maxScore = 240;
  const active = phase === 'drill' && timeLeft > 0;

  // Latest score in a ref so the unmount/onComplete path reads a fresh value.
  const scoreRef = useRef(0);
  scoreRef.current = score;

  // Round countdown + rotating tell caption.
  useEffect(() => {
    if (phase !== 'drill') return;
    const tick = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    const rotate = setInterval(() => setTellIdx((i) => (i + 1) % media.tells.length), 2600);
    return () => { clearInterval(tick); clearInterval(rotate); };
  }, [phase, media.tells.length]);

  // End of round → score it.
  useEffect(() => {
    if (phase !== 'drill' || timeLeft > 0) return;
    const total = scoreRef.current;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    const id = setTimeout(() => {
      onComplete({ score: total, maxScore, stars, xpEarned: level.xpReward * (stars / 3), timeMs: ROUND_SEC * 1000 });
    }, 900);
    return () => clearTimeout(id);
  }, [phase, timeLeft, level, maxScore, onComplete]);

  const handleHit = useCallback(() => {
    if (!active) return;
    setHits((h) => h + 1);
    setCombo((c) => {
      const nc = c + 1;
      setScore((s) => {
        const ns = s + 10 + c;
        juice.onCorrect(nc, ns);
        return ns;
      });
      return nc;
    });
  }, [active, juice]);

  const handleMiss = useCallback(() => {
    if (!active) return;
    setMisses((m) => m + 1);
    setCombo(0);
    juice.onWrong(0, scoreRef.current);
  }, [active, juice]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>{media.type} tells:</strong> {media.tells.join(' · ')}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Drill:</strong> Tap every tell that pops up before it vanishes. Build your detection streak!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => { setTimeLeft(ROUND_SEC); setPhase('drill'); }}>
          Start Drill <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ DRILL ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Catch the Tells</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: timeLeft <= 5 ? '#FF4D4D' : LAB_COLOR }}>
          <Timer className="w-4 h-4" />{timeLeft}s
        </span>
      </div>

      <div className="rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-2" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
        <Crosshair className="w-4 h-4" /> Catch the AI tell: <span style={{ color: '#1A1D2B' }}>{media.tells[tellIdx]}</span>
      </div>

      <ScoreDisplay score={score} maxScore={maxScore} />
      <ComboCounter combo={combo} />

      <PixiReactStage
        active={active}
        onHit={handleHit}
        onMiss={handleMiss}
        labColor={LAB_COLOR}
        status={`${hits} tells caught, ${misses} missed. Streak ${combo}.`}
        actionLabel="Catch tell"
        spawnEveryMs={tune.spawnEveryMs}
        lifeMs={tune.lifeMs}
        maxConcurrent={tune.maxConcurrent}
        reducedMotion={!!prefersReducedMotion}
      />

      <div className="flex items-center justify-between text-xs" style={{ color: '#8C94AC' }}>
        <span>Caught: <strong style={{ color: '#2ECC71' }}>{hits}</strong> · Missed: <strong style={{ color: '#FF4D4D' }}>{misses}</strong></span>
        <SFButton variant="outline" size="sm" onClick={onExit} aria-label="Exit level">Exit</SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function AiOrNotGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-or-not', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI or Not?" color={LAB_COLOR} labNum={10}>
      <GameLevelSystem
        gameTitle="AI or Not?"
        gameEmoji="🔍"
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
