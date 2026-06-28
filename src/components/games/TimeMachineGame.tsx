// ════════════════════════════════════════════════════════════════════════
// AI TIME MACHINE v4 — Lab 1 — SORT archetype (era-SORT)
// ════════════════════════════════════════════════════════════════════════
// Was an AI-history quiz. Now you SORT the timeline: drag each AI milestone
// onto the era it belongs to — Early (pre-2000), Recent (2000-2020), or
// Today (2020+). On a correct call the why-card reveals the date and context.
// Pixi SORT scene (three bins) inside GameShell.
//
// Teaches: the timeline of AI — when the milestones that built modern AI happened.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Clock, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#4F6EF7';
const BINS = ['Early (pre-2000)', 'Recent (2000-2020)', 'Today (2020+)']; // bin index 0 / 1 / 2
const CHIP_PALETTE = ['#4F6EF7', '#2ECC71', '#F59E0B', '#10BAD2', '#8F96FA', '#FF7050'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: '1950s Dreams', description: 'Where the AI timeline begins.', emoji: '🕰️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Early Foundations', description: 'The first thinking machines.', emoji: '❄️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Expert Era', description: 'Rules, chess, and chatbots.', emoji: '🧠', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Web Meets AI', description: 'Data and the internet age.', emoji: '🌐', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Big Data', description: 'More data, smarter models.', emoji: '📊', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Deep Learning', description: 'Neural nets change everything.', emoji: '🧬', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'AI Everywhere', description: 'AI in your pocket and home.', emoji: '📱', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Generative Age', description: 'Models that create.', emoji: '🤖', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Agents & Beyond', description: 'AI that acts on its own.', emoji: '🔮', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Time Lord', description: 'Master the whole timeline!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI has a long history. Sort each milestone onto the era when it happened.',
  2: 'The earliest AI ideas — the Turing Test and the first programs — are all from before 2000.',
  3: 'Expert systems, ELIZA, and Deep Blue all belong to the early, pre-2000 era of AI.',
  4: 'The web and search ranking arrived in the 1990s — still the early era.',
  5: 'Big data, recommendations, and voice assistants mark the 2000-2020 recent era.',
  6: 'Deep learning broke through between 2012 and 2016 — squarely the recent era.',
  7: 'Smartphones and self-driving research spread AI in the 2010s recent era.',
  8: 'Generative models like GPT-3 and DALL-E launched in 2020+ — the today era.',
  9: 'Autonomous agents and multimodal models are the newest, today-era milestones.',
  10: 'Master test: place every milestone in its correct era across the whole timeline.',
};

// ════════════════════════════════════════════════════════════════════════
// MILESTONE BANK — an AI milestone + its era (bin) + why (date/context)
// bin 0 = Early (pre-2000), bin 1 = Recent (2000-2020), bin 2 = Today (2020+)
// Interleaved across eras so each level mixes all three.
// ════════════════════════════════════════════════════════════════════════
interface Milestone { id: string; label: string; bin: number; why: string; }

const BANK: Milestone[] = [
  { id: 'turing', label: 'Turing Test', bin: 0, why: 'Alan Turing proposed it in 1950 — long before 2000.' },
  { id: 'netflix', label: 'Netflix recommender', bin: 1, why: 'Netflix\'s recommendation engine launched around 2006 — the recent era.' },
  { id: 'gpt3', label: 'GPT-3', bin: 2, why: 'GPT-3 was released in 2020 — the today era of generative AI.' },
  { id: 'dartmouth', label: 'Dartmouth conference', bin: 0, why: 'The term "AI" was coined at Dartmouth in 1956 — the founding moment.' },
  { id: 'alexnet', label: 'AlexNet', bin: 1, why: 'AlexNet won the ImageNet contest in 2012 — the recent era.' },
  { id: 'dalle', label: 'DALL-E image AI', bin: 2, why: 'DALL-E generated images from text starting in 2021 — the today era.' },
  { id: 'eliza', label: 'ELIZA chatbot', bin: 0, why: 'ELIZA, an early chatbot, was built in 1966 — well before 2000.' },
  { id: 'siri', label: 'Siri assistant', bin: 1, why: 'Siri brought voice AI to phones in 2011 — the recent era.' },
  { id: 'agents', label: 'Autonomous agents', bin: 2, why: 'AI agents that plan and act became practical in the 2020s — today.' },
  { id: 'deepblue', label: 'Deep Blue beats Kasparov', bin: 0, why: 'Deep Blue defeated the chess champion in 1997 — the early era.' },
  { id: 'alphago', label: 'AlphaGo', bin: 1, why: 'AlphaGo beat a Go champion in 2016 — the recent era.' },
  { id: 'mcp', label: 'Model Context Protocol', bin: 2, why: 'MCP, a tool-connection standard for agents, emerged in the 2020s — today.' },
  { id: 'mycin', label: 'MYCIN expert system', bin: 0, why: 'MYCIN diagnosed infections in 1976 — a pre-2000 expert system.' },
  { id: 'imagenet', label: 'ImageNet dataset', bin: 1, why: 'The ImageNet dataset was released in 2009 — the recent era.' },
  { id: 'multimodal', label: 'Multimodal models', bin: 2, why: 'Models combining text, image and audio matured in the 2020s — today.' },
  { id: 'pagerank', label: 'PageRank search', bin: 0, why: 'PageRank ranked web pages in 1998 — still the pre-2000 era.' },
  { id: 'diffusion', label: 'Diffusion image models', bin: 2, why: 'Stable Diffusion and friends arrived in 2022 — the today era.' },
  { id: 'gpu', label: 'GPU deep-learning boom', bin: 1, why: 'Training neural nets on GPUs took off in the 2010s — the recent era.' },
];

function getItems(levelId: number): Milestone[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Milestone[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board (Early / Recent / Today)
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
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: it.label, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Right era! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That belongs in ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🕰️" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each milestone into <strong>Early</strong>, <strong>Recent</strong>, or <strong>Today</strong>. Build the timeline!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start the Time Machine <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🕰️" color={LAB_COLOR}>Sort the Timeline</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Clock className="w-4 h-4" />{sortedCount} / {items.length}
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
          {allSorted ? 'Lock in the timeline!' : `Sort ${items.length - sortedCount} more…`}
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
export default function TimeMachineGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('time-machine', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Time Machine" color="#4F6EF7" labNum={1}>
      <GameLevelSystem
        gameTitle="AI Time Machine"
        gameEmoji="🕰️"
        labColor="#4F6EF7"
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
