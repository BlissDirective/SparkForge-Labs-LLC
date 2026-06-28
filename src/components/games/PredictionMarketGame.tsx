// ════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET v5 — Lab 10 Flagship — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was a forecasting quiz. Now you SORT the forecast: drag each near-future
// claim about AI and tech into Likely / Uncertain / Unlikely by how probable
// it is. On a correct call the why-card explains the base rate and the
// reasoning. Pixi SORT scene (three bins) inside GameShell.
//
// Teaches: probabilistic forecasting, base rates, and crowd wisdom — reading
// how probable a prediction really is.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, TrendingUp, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#DE5AEA';
const BINS = ['Likely', 'Uncertain', 'Unlikely']; // bin index 0 / 1 / 2
const CHIP_PALETTE = ['#4F6EF7', '#2ECC71', '#F59E0B', '#10BAD2', '#8F96FA', '#FF7050'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Predictions 101', description: 'Sort claims by how probable they are.', emoji: '🔮', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Probability', description: 'Read the chance behind each claim.', emoji: '🎲', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Prediction Markets', description: 'What the crowd price says.', emoji: '📈', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Crowd Wisdom', description: 'Sort with the wisdom of crowds.', emoji: '👥', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Calibration', description: 'Match confidence to reality.', emoji: '🎯', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'AI Forecasting', description: 'Predicting the future of AI.', emoji: '🤖', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Base Rates', description: 'Start with the historical average.', emoji: '📊', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Tricky Claims', description: 'The hardest forecasts yet.', emoji: '📉', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Superforecaster', description: 'Sort like an elite forecaster.', emoji: '🏆', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Oracle', description: 'The ultimate forecasting sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A prediction is a claim about the future. Sort each one by how probable it is.',
  2: 'Probability runs from near-certain to near-impossible. Place each claim on that scale.',
  3: 'A prediction-market price is a probability: a high price means the crowd thinks it is likely.',
  4: 'The wisdom of crowds: a diverse group often forecasts better than any single expert.',
  5: 'Good forecasters are calibrated — their "likely" really does come true most of the time.',
  6: 'AI progress is fast but hard to time. Some milestones are near, others are far off.',
  7: 'Base rates anchor a forecast: how often have similar things happened before?',
  8: 'Some claims are deceptively confident. Weigh the evidence before you sort.',
  9: 'Superforecasters update on evidence and avoid extreme over- or under-confidence.',
  10: 'Master test: sort every claim into Likely, Uncertain, or Unlikely.',
};

// ════════════════════════════════════════════════════════════════════════
// FORECAST BANK — a near-future claim + how probable (bin) + why (interleaved)
// bin 0 = Likely · bin 1 = Uncertain · bin 2 = Unlikely
// ════════════════════════════════════════════════════════════════════════
interface Claim { id: string; label: string; bin: number; why: string; }

const BANK: Claim[] = [
  { id: 'phones', label: 'Most phones ship with an AI assistant', bin: 0, why: 'AI assistants are already standard on new phones — a strong base rate makes this likely.' },
  { id: 'agi-year', label: 'True human-level AGI arrives next year', bin: 2, why: 'No clear path to general human-level AI exists yet, so a one-year arrival is unlikely.' },
  { id: 'homework', label: 'Some students use AI for homework help', bin: 0, why: 'This is already common today — the base rate makes it near-certain.' },
  { id: 'robot-chef', label: 'A robot replaces every restaurant chef', bin: 2, why: 'Cooking needs dexterity and judgment robots lack; full replacement is unlikely soon.' },
  { id: 'better-translate', label: 'AI translation keeps improving this year', bin: 0, why: 'Steady year-over-year gains make continued improvement very likely.' },
  { id: 'self-drive-city', label: 'Self-driving taxis run in more cities', bin: 1, why: 'Expansion is happening but slow and uneven, so the timing is genuinely uncertain.' },
  { id: 'ai-president', label: 'An AI is elected to public office', bin: 2, why: 'Laws require humans to hold office, so this is highly unlikely.' },
  { id: 'voice-search', label: 'More people search by talking to AI', bin: 0, why: 'Voice and chat search are clearly trending up — a likely continuation.' },
  { id: 'cure-all', label: 'AI cures every disease within a year', bin: 2, why: 'Drug discovery takes many years of trials; a one-year cure-all is unlikely.' },
  { id: 'classroom-ai', label: 'Some classrooms add an AI tutor', bin: 0, why: 'Pilots already exist; broad trials make this likely.' },
  { id: 'agi-decade', label: 'AI passes many expert exams this decade', bin: 1, why: 'Plausible given fast progress, but the timing is uncertain.' },
  { id: 'no-jobs', label: 'AI eliminates all human jobs next year', bin: 2, why: 'History shows automation shifts jobs slowly; total loss in a year is unlikely.' },
  { id: 'art-tools', label: 'More artists try AI image tools', bin: 0, why: 'Adoption is rising fast, so more artists trying them is likely.' },
  { id: 'agi-conscious', label: 'AI becomes conscious and self-aware', bin: 2, why: 'There is no scientific evidence AI can be conscious; this is unlikely.' },
  { id: 'better-weather', label: 'AI weather forecasts beat old models', bin: 1, why: 'Promising early results, but consistent wins are not yet certain.' },
  { id: 'phone-photos', label: 'Phone cameras use AI to fix photos', bin: 0, why: 'AI photo enhancement is already widespread — very likely to continue.' },
  { id: 'ban-ai', label: 'Every country bans AI completely', bin: 2, why: 'Countries are investing heavily in AI; a global ban is highly unlikely.' },
  { id: 'ai-coding', label: 'More coders use AI to write code', bin: 0, why: 'AI coding tools are widely adopted already, so growth is likely.' },
  { id: 'agi-runaway', label: 'AI takes over the internet on its own', bin: 2, why: 'Systems are sandboxed and supervised; an autonomous takeover is unlikely.' },
  { id: 'market-grows', label: 'Prediction markets gain more users', bin: 1, why: 'Interest is growing but regulation and trust remain uncertain.' },
  { id: 'voice-clone', label: 'Voice-cloning scams keep appearing', bin: 0, why: 'These scams already exist and are rising — likely to continue.' },
  { id: 'fusion-ai', label: 'AI delivers limitless free energy this year', bin: 2, why: 'Energy breakthroughs take decades to deploy; a one-year payoff is unlikely.' },
  { id: 'chat-customer', label: 'More companies add AI chat support', bin: 0, why: 'Adoption is already high and climbing, so this is likely.' },
  { id: 'regulation', label: 'New AI safety rules pass somewhere', bin: 1, why: 'Several governments are drafting rules, but passage and timing are uncertain.' },
];

function getItems(levelId: number): Claim[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Claim[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board (Likely / Uncertain / Unlikely)
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Good call! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That claim is ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🔮" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each claim into <strong>Likely</strong>, <strong>Uncertain</strong>, or <strong>Unlikely</strong>. Read the odds!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Forecasting <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="🔮" color={LAB_COLOR}>Sort the Forecasts</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <TrendingUp className="w-4 h-4" />{sortedCount} / {items.length}
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
          {allSorted ? 'Resolve!' : `Sort ${items.length - sortedCount} more…`}
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
export default function PredictionMarketGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('prediction-market', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Prediction Market" color="#DE5AEA" labNum={10}>
      <GameLevelSystem
        gameTitle="Prediction Market"
        gameEmoji="📈"
        labColor="#DE5AEA"
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
