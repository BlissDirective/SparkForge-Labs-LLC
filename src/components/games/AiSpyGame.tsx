// ════════════════════════════════════════════════════════════════════════
// AI SPY v4 — Lab 1 (What IS AI?) — REVEAL archetype migration (Wave 1)
// ════════════════════════════════════════════════════════════════════════
// Was a tap-quiz on QuizLevelRenderer. Now a HUNT: a grid of everyday objects
// is shown; tap the ones you think use AI. Tapping an AI object fires a glowing
// "signal" pulse + a why-card; tapping a plain object reveals why it has no AI.
// Same educational facts, far more game-feel. Pixi REVEAL scene inside GameShell.
//
// Teaches: where AI hides in daily life — it senses, learns, or predicts.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Sparkles, Eye, GraduationCap, Target, RotateCcw,
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

const LAB_COLOR = '#0FB8FA';

// ════════════════════════════════════════════════════════════════════════
// LEVELS
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Living Room', description: 'Spot AI hiding in your home!', emoji: '🏠', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'School Day', description: 'AI at school — where is it?', emoji: '🏫', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'City Walk', description: 'AI is all around the city!', emoji: '🌆', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'The Kitchen', description: 'Smart kitchen gadgets use AI.', emoji: '🍳', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Playground', description: 'Even playtime has AI!', emoji: '🎮', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'The Hospital', description: 'AI helps doctors heal people.', emoji: '🏥', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Space Station', description: 'AI in space exploration!', emoji: '🚀', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Factory Floor', description: 'Robots and AI build our world.', emoji: '🏭', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Ocean Deep', description: 'AI explores underwater worlds.', emoji: '🌊', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Future World', description: 'The ultimate AI spotting test!', emoji: '🔮', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI hides in objects that learn what you like, hear your voice, or sense the world. Plain objects just sit there.',
  2: 'A tool uses AI when it adapts, understands language, or finds patterns — not when it only stores or adds things.',
  3: 'Out in the city, AI senses traffic, recognises faces, and predicts the weather. Simple machinery does none of that.',
  4: 'Smart gadgets learn your habits. If it just heats, holds, or spins on a timer, there is no AI inside.',
  5: 'Games and toys can use AI to react to you. Ask: does it learn or just follow fixed rules?',
  6: 'Hospitals use AI to read scans and spot patterns doctors might miss. Basic tools stay basic.',
  7: 'In space, AI plans routes and analyses data far from Earth. Not every gauge is intelligent.',
  8: 'Factories use AI vision and robots that adapt. Many machines are still just motors and timers.',
  9: 'Underwater drones use AI to navigate and identify life. A plain buoy only floats.',
  10: 'Master test: across every world, find the things that sense, learn, or predict.',
};

// ════════════════════════════════════════════════════════════════════════
// TILE DATA — every object + whether it uses AI + the "why" (faithful to v3)
// ════════════════════════════════════════════════════════════════════════
interface SpyTile { id: string; label: string; isAI: boolean; why: string; }

// Pools by world; higher levels remix the pool plus harder "C-band" objects.
const POOLS: Record<number, SpyTile[]> = {
  1: [
    { id: 'smart-tv', label: 'Smart TV', isAI: true, why: 'Recommendation algorithms learn what you watch and suggest more.' },
    { id: 'voice-assistant', label: 'Voice Assistant', isAI: true, why: 'Speech recognition + language understanding interpret your voice.' },
    { id: 'couch', label: 'Couch', isAI: false, why: 'Just furniture — no sensors or processors. No AI here.' },
    { id: 'robot-vacuum', label: 'Robot Vacuum', isAI: true, why: 'Uses SLAM mapping to navigate rooms and dodge obstacles.' },
    { id: 'light-switch', label: 'Light Switch', isAI: false, why: 'A mechanical switch just completes a circuit. No computation.' },
    { id: 'thermostat', label: 'Smart Thermostat', isAI: true, why: 'Learns your schedule to heat and cool automatically.' },
    { id: 'picture-frame', label: 'Picture Frame', isAI: false, why: 'Purely physical — it only holds a photo.' },
    { id: 'video-doorbell', label: 'Video Doorbell', isAI: true, why: 'Computer vision detects faces, people, and packages.' },
  ],
  2: [
    { id: 'tutor-app', label: 'Math Tutor App', isAI: true, why: 'Adaptive learning adjusts difficulty to your skill level.' },
    { id: 'pencil', label: 'Pencil', isAI: false, why: 'Wood and graphite — a simple writing tool.' },
    { id: 'plagiarism', label: 'Plagiarism Checker', isAI: true, why: 'NLP compares your text against billions of sources.' },
    { id: 'register', label: 'Cash Register', isAI: false, why: 'A basic register only adds prices — that is arithmetic, not AI.' },
    { id: 'translator', label: 'Translator', isAI: true, why: 'Neural machine translation understands context, not just words.' },
    { id: 'eraser', label: 'Eraser', isAI: false, why: 'A piece of rubber — no intelligence in removing marks.' },
    { id: 'bus-gps', label: 'Bus Route GPS', isAI: true, why: 'Route optimisation predicts arrivals and the fastest path.' },
    { id: 'autocorrect', label: 'Auto-Correct', isAI: true, why: 'Machine learning predicts fixes from the context you type.' },
  ],
  3: [
    { id: 'traffic', label: 'Adaptive Traffic Light', isAI: true, why: 'Sensors + AI tune signal timing to live traffic.' },
    { id: 'bench', label: 'Park Bench', isAI: false, why: 'It is seating. No AI in sitting!' },
    { id: 'self-checkout', label: 'Self-Checkout', isAI: true, why: 'Computer vision identifies produce and verifies items.' },
    { id: 'meter', label: 'Parking Meter', isAI: false, why: 'A basic meter just counts time.' },
    { id: 'face-unlock', label: 'Face Unlock', isAI: true, why: 'Deep neural nets map and match your facial geometry.' },
    { id: 'mailbox', label: 'Mailbox', isAI: false, why: 'A metal box that holds letters — no intelligence needed.' },
    { id: 'weather', label: 'Weather App', isAI: true, why: 'ML models trained on radar and history improve forecasts.' },
    { id: 'fountain', label: 'Public Fountain', isAI: false, why: 'Runs on pumps and water pressure, not AI.' },
  ],
};

// Harder, cross-cutting objects mixed into levels 4+ (B/C band facts from v3).
const HARD_POOL: SpyTile[] = [
  { id: 'fitness', label: 'Fitness Tracker', isAI: true, why: 'ML recognises activities — walking, running, swimming — from motion.' },
  { id: 'spam', label: 'Spam Filter', isAI: true, why: 'Classification learns the patterns of junk mail and adapts.' },
  { id: 'recsys', label: 'Recommendation Feed', isAI: true, why: 'Reinforcement learning optimises for long-term engagement.' },
  { id: 'medical', label: 'Medical Scanner', isAI: true, why: 'CNNs detect tumours and fractures in medical images.' },
  { id: 'clock', label: 'Wall Clock', isAI: false, why: 'Gears and a battery — it only keeps time.' },
  { id: 'fan', label: 'Electric Fan', isAI: false, why: 'A motor spinning blades. No sensing or learning.' },
  { id: 'umbrella', label: 'Umbrella', isAI: false, why: 'Fabric and ribs — purely mechanical.' },
  { id: 'kettle', label: 'Kettle', isAI: false, why: 'It heats water with an element. No AI.' },
];

function getTiles(levelId: number): SpyTile[] {
  const base = POOLS[((levelId - 1) % 3) + 1];
  if (levelId <= 3) return base;
  // Higher levels: blend the rotating pool with progressively harder objects.
  const hardCount = Math.min(4, 1 + Math.floor((levelId - 4) / 2));
  const offset = (levelId * 2) % HARD_POOL.length;
  const hard = Array.from({ length: hardCount }, (_, i) => HARD_POOL[(offset + i) % HARD_POOL.length]);
  // De-dup by id, keep 8 tiles.
  const seen = new Set<string>();
  return [...base, ...hard].filter((t) => (seen.has(t.id) ? false : seen.add(t.id))).slice(0, 8);
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the REVEAL hunt
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

  const prizeTotal = useMemo(() => tiles.filter((t) => t.isAI).length, [tiles]);
  const maxScore = prizeTotal * 10 + 20;

  const sceneTiles = useMemo<RevealTile[]>(
    () => tiles.map((t) => ({ id: t.id, isPrize: t.isAI, label: t.label })),
    [tiles],
  );

  const finishLevel = useCallback((finalScore: number, finalWrong: number, finalRevealed: Record<string, boolean>) => {
    // Reveal anything still covered so the board reads as fully scanned.
    const all: Record<string, boolean> = { ...finalRevealed };
    tiles.forEach((t) => { all[t.id] = true; });
    setRevealed(all);

    const accuracyBonus = Math.max(0, 20 - finalWrong * 5);
    const total = finalScore + accuracyBonus;
    const stars = (total >= level.starThresholds[2] ? 3
      : total >= level.starThresholds[1] ? 2
        : total >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;

    setTimeout(() => {
      onComplete({
        score: total,
        maxScore,
        stars,
        xpEarned: level.xpReward * (stars / 3),
        timeMs: 0,
      });
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
        message: nextCombo > 2 ? `${nextCombo}x combo! AI found +${gained}` : `AI signal! +${gained}`,
        explanation: tile.why,
      });
      const foundNow = tiles.filter((t) => t.isAI && nextRevealed[t.id]).length;
      juice.onCorrect(foundNow, nextScore);
      if (foundNow >= prizeTotal) finishLevel(nextScore, wrongTaps, nextRevealed);
    } else {
      setCombo(0);
      const nextWrong = wrongTaps + 1;
      setWrongTaps(nextWrong);
      setFeedback({
        type: 'info',
        message: 'No AI in that one.',
        explanation: tile.why,
      });
      juice.onWrong(0, score);
    }
  }, [revealed, tiles, combo, score, wrongTaps, prizeTotal, juice, finishLevel]);

  const found = tiles.filter((t) => t.isAI && revealed[t.id]).length;

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
            <span><strong>Hunt:</strong> Tap every object you think uses AI. Find all {prizeTotal} hidden AIs!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('hunt')}>
          Start Hunt <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ HUNT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔍" color={LAB_COLOR}>Find the AI</GlowingTitle>
        <span className="text-sm font-bold" style={{ color: LAB_COLOR }}>
          <Eye className="w-4 h-4 inline mr-1" />{found} / {prizeTotal}
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
        actionLabel="Scan for AI"
        showLabelsCovered
        reducedMotion={!!prefersReducedMotion}
      />

      {feedback && <FeedbackPopup {...feedback} />}

      <div className="flex gap-2">
        <SFButton
          variant="primary"
          className="flex-1"
          onClick={() => finishLevel(score, wrongTaps, revealed)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {found >= prizeTotal ? 'All AI found!' : 'Finish hunt'}
        </SFButton>
        <SFButton variant="outline" onClick={onExit}>
          <RotateCcw className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function AiSpyGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('ai-spy', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Spy" color={LAB_COLOR} labNum={1}>
      <GameLevelSystem
        gameTitle="AI Spy"
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
