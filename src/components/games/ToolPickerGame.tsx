// ════════════════════════════════════════════════════════════════════════
// TOOL PICKER v4 — Lab 5 — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was a "pick the right AI tool" quiz. Now you SORT real-world problems onto
// the AI tool category that fits — Vision / Language / Prediction /
// Recommendation — the way an engineer picks the right model family for a job.
// Pixi SORT scene inside GameShell.
//
// Teaches: different AI tools solve different kinds of problems. Vision tools
// see images, Language tools read & write text, Prediction tools forecast
// numbers/sequences, and Recommendation tools suggest what you'll like.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Wrench, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#2ECC71';
const BINS = ['Vision', 'Language', 'Prediction', 'Recommendation']; // bin index 0 / 1 / 2 / 3
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Basic Tools', description: 'Match each job to its AI tool family.', emoji: '🧰', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Seeing & Reading', description: 'Vision sees images, Language reads text.', emoji: '👀', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Predict & Suggest', description: 'Forecasts vs. recommendations.', emoji: '🔮', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Everyday AI', description: 'Tools you use every day.', emoji: '📱', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Data Jobs', description: 'Pick tools for data problems.', emoji: '📊', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Mixed Tools', description: 'All four families together.', emoji: '🌍', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Tricky Jobs', description: 'Sort the harder cases.', emoji: '🧠', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Real Products', description: 'Tools behind real apps.', emoji: '🚀', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Combo Challenge', description: 'Every tool family, fast.', emoji: '🔀', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Tool Master', description: 'The ultimate tool-picker sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Every AI tool fits a kind of job: Vision sees, Language reads/writes, Prediction forecasts, Recommendation suggests.',
  2: 'Vision tools work on images — spotting things in photos. Language tools work on text — translating, summarizing, chatting.',
  3: 'Prediction tools forecast a number or what comes next. Recommendation tools suggest things you might like.',
  4: 'The apps you use every day mix these families — your phone uses Vision to unlock and Recommendation to pick videos.',
  5: 'Data problems split too: forecasting a value is Prediction, while suggesting items is Recommendation.',
  6: 'Real systems combine families — but each single job still maps to one best tool type.',
  7: 'Some jobs are tricky: "describe a photo" needs Vision to see and Language to write — pick by the core skill.',
  8: 'Real products are built on these tools: face unlock (Vision), chatbots (Language), weather (Prediction), feeds (Recommendation).',
  9: 'Speed round: match every job to its tool family without slipping.',
  10: 'Master test: pick the right AI tool for every job, fast and correctly.',
};

// ════════════════════════════════════════════════════════════════════════
// JOB BANK — the problem + its tool family (bin) + why (interleaved across bins)
// ════════════════════════════════════════════════════════════════════════
interface Job { id: string; label: string; name: string; bin: number; why: string; }

const BANK: Job[] = [
  { id: 'tumor', label: 'Spot tumors in X-rays', name: 'Spot tumors in X-ray images', bin: 0, why: 'Finding things inside an image is a Vision job — CNNs read pixels.' },
  { id: 'translate', label: 'Translate a menu', name: 'Translate a restaurant menu', bin: 1, why: 'Turning text from one language to another is a Language job (NLP).' },
  { id: 'rain', label: 'Forecast tomorrow’s rain', name: 'Forecast whether it will rain tomorrow', bin: 2, why: 'Predicting a future value from past data is a Prediction job.' },
  { id: 'movie', label: 'Suggest a movie', name: 'Suggest a movie you might like', bin: 3, why: 'Suggesting items you’ll like is a Recommendation job.' },
  { id: 'faceunlock', label: 'Unlock with your face', name: 'Unlock a phone with your face', bin: 0, why: 'Recognizing a face in a camera image is a Vision job.' },
  { id: 'spam', label: 'Sort spam emails', name: 'Sort emails into spam or not-spam', bin: 1, why: 'Reading text and labeling it is a Language job (text classification).' },
  { id: 'temp', label: 'Predict tomorrow’s temperature', name: 'Predict tomorrow’s temperature', bin: 2, why: 'Forecasting a number from a time series is a Prediction job.' },
  { id: 'songs', label: 'Recommend songs', name: 'Recommend songs you’ll enjoy', bin: 3, why: 'Picking songs based on your taste is a Recommendation job.' },
  { id: 'lanes', label: 'See road lanes', name: 'See road lanes for a self-driving car', bin: 0, why: 'Detecting lane lines in a camera feed is a Vision job.' },
  { id: 'summarize', label: 'Summarize an article', name: 'Summarize a long news article', bin: 1, why: 'Shortening text while keeping meaning is a Language job.' },
  { id: 'sales', label: 'Forecast next month’s sales', name: 'Forecast next month’s store sales', bin: 2, why: 'Predicting future sales from history is a Prediction job.' },
  { id: 'products', label: 'Suggest products to buy', name: 'Suggest products you might buy', bin: 3, why: 'Recommending items based on shoppers like you is a Recommendation job.' },
  { id: 'plantdisease', label: 'Find plant disease in leaf photos', name: 'Find disease in leaf photos', bin: 0, why: 'Spotting symptoms in a photo is a Vision job.' },
  { id: 'chatbot', label: 'Answer questions in a chat', name: 'Answer questions in a chatbot', bin: 1, why: 'Understanding and writing text replies is a Language job.' },
  { id: 'traffic', label: 'Predict traffic at 5pm', name: 'Predict traffic levels at 5pm', bin: 2, why: 'Estimating a future value is a Prediction job.' },
  { id: 'news', label: 'Pick your news feed', name: 'Pick which posts fill your news feed', bin: 3, why: 'Ranking what you’ll engage with is a Recommendation job.' },
  { id: 'countcars', label: 'Count cars in a parking lot photo', name: 'Count cars in a parking-lot photo', bin: 0, why: 'Counting objects in an image is a Vision job (object detection).' },
  { id: 'sentiment', label: 'Tell if a review is happy or angry', name: 'Tell if a product review is happy or angry', bin: 1, why: 'Reading text to judge its tone is a Language job (sentiment analysis).' },
];

function getItems(levelId: number): Job[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Job[] = [];
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
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: `${it.name} (${BINS[it.bin]})`, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Right tool! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That’s a ${BINS[item.bin]} job.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🧰" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each job into <strong>Vision</strong>, <strong>Language</strong>, <strong>Prediction</strong>, or <strong>Recommendation</strong>.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Picking <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🧰" color={LAB_COLOR}>Pick the Right Tool</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Wrench className="w-4 h-4" />{sortedCount} / {items.length}
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
export default function ToolPickerGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('tool-picker', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Tool Picker" color="#2ECC71" labNum={5}>
      <GameLevelSystem
        gameTitle="Tool Picker"
        gameEmoji="🧰"
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
