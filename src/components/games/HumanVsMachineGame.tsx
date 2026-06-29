// ════════════════════════════════════════════════════════════════════════
// HUMAN vs MACHINE v4 — Lab 2 — SORT archetype (Wave 3)
// ════════════════════════════════════════════════════════════════════════
// Was a 3-zone drag-drop quiz. Now you SORT each task into who does it better:
// Humans win or Machines win. On a correct call the why-card explains the
// complementary strength — speed/scale/pattern-matching for machines, emotion/
// creativity/judgment for humans. Pixi SORT scene (two bins) inside GameShell.
//
// Teaches: the complementary strengths of humans vs AI/machines.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
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
  loading: () => <PixiStageSkeleton />,
});

const LAB_COLOR = '#0FB8FA';
const BINS = ['Humans win', 'Machines win']; // bin index 0 / 1
const CHIP_PALETTE = ['#4F6EF7', '#2ECC71', '#F59E0B', '#10BAD2', '#8F96FA', '#FF7050'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Easy Tasks', description: 'Sort simple everyday tasks.', emoji: '🤖', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Creative Work', description: 'Who is better at art, music, stories?', emoji: '🎨', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Speed & Scale', description: 'Crunching numbers and huge data.', emoji: '⚡', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Smart Decisions', description: 'Moral and ethical choices.', emoji: '⚖️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Pattern Hunt', description: 'Spotting signals in the noise.', emoji: '🔎', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Tricky Tasks', description: 'Things that seem obvious but are not!', emoji: '😵', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Future Jobs', description: 'What work will look like in 2030.', emoji: '🔮', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'AI Surprises', description: 'Things machines do that shock people!', emoji: '😲', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Edge Cases', description: 'Gray areas and debates.', emoji: '🤔', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Future Critic', description: 'The ultimate human vs AI test!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI excels at speed, scale, and pattern recognition. Humans excel at creativity, empathy, and judgment.',
  2: 'Creativity, emotion, and original ideas are human strengths — machines can only remix what they have seen.',
  3: 'Machines win at raw speed and scale: math, sorting, and searching huge piles of data instantly.',
  4: 'Ethical decisions need values, context, and empathy — areas where machines fall short.',
  5: 'Machines spot patterns across millions of examples far faster than any human can.',
  6: 'Some tasks seem simple but are surprisingly complex, and vice versa!',
  7: 'Future jobs shift toward AI oversight, creativity, and human connection — human strengths.',
  8: 'Machine capabilities keep surprising us — what seems impossible today may be routine tomorrow.',
  9: 'The boundary between human and machine strengths is a gray zone that keeps shifting.',
  10: 'Master test: sort every task into Humans win or Machines win.',
};

// ════════════════════════════════════════════════════════════════════════
// TASK BANK — a task + who does it better (bin) + why (interleaved)
// ════════════════════════════════════════════════════════════════════════
interface Clue { id: string; label: string; bin: number; why: string; }

const BANK: Clue[] = [
  { id: 'lovenote', label: 'Writing a heartfelt note', bin: 0, why: 'Deep emotional connection and personal experience are uniquely human.' },
  { id: 'sortphotos', label: 'Sorting a million photos', bin: 1, why: 'Machines process massive datasets at speeds humans cannot match.' },
  { id: 'comfort', label: 'Comforting a sad friend', bin: 0, why: 'Empathy and real emotional support need genuine human connection.' },
  { id: 'bignumbers', label: 'Multiplying huge numbers', bin: 1, why: 'Computers do exact arithmetic on giant numbers in an instant.' },
  { id: 'newtheory', label: 'Inventing a new theory', bin: 0, why: 'Breakthrough insights need creativity, intuition, and cross-domain thinking.' },
  { id: 'searchrecords', label: 'Searching billions of records', bin: 1, why: 'Machines scan enormous databases far faster than any person.' },
  { id: 'raisechild', label: 'Raising a child', bin: 0, why: 'Parenting needs love, moral guidance, and adapting to a unique person.' },
  { id: 'chess', label: 'Chess at grandmaster level', bin: 1, why: 'Chess engines like Stockfish now surpass every human player.' },
  { id: 'ethics', label: 'Making ethical decisions', bin: 0, why: 'Ethics need values, cultural context, and moral reasoning machines lack.' },
  { id: 'translate', label: 'Translating 100 languages', bin: 1, why: 'Neural translation handles dozens of languages instantly and at once.' },
  { id: 'love', label: 'Understanding emotions', bin: 0, why: 'Reading true feelings needs consciousness and lived experience.' },
  { id: 'fraud', label: 'Spotting fraud patterns', bin: 1, why: 'Machines catch patterns across millions of transactions in real time.' },
  { id: 'storytelling', label: 'Creative storytelling', bin: 0, why: 'Original stories with real meaning and surprise come from human imagination.' },
  { id: 'weather', label: 'Predicting weather patterns', bin: 1, why: 'Models crunch satellite and history data better than humans can.' },
  { id: 'inspire', label: 'Inspiring a whole team', bin: 0, why: 'Genuine leadership and trust grow from human relationships.' },
  { id: 'memorize', label: 'Remembering every fact', bin: 1, why: 'Computer memory stores and recalls data perfectly and forever.' },
];

function getItems(levelId: number): Clue[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Clue[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT board (Humans win / Machines win)
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Nailed it! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That one is a win for ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="🤖" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each task into <strong>Humans win</strong> or <strong>Machines win</strong>. Who does it better?</span>
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
        <GlowingTitle emoji="🤖" color={LAB_COLOR}>Who Does It Better?</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Cpu className="w-4 h-4" />{sortedCount} / {items.length}
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
          {allSorted ? 'Verdict!' : `Sort ${items.length - sortedCount} more…`}
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
export default function HumanVsMachineGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('human-vs-machine', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Human vs Machine" color="#0FB8FA" labNum={1}>
      <GameLevelSystem
        gameTitle="Human vs Machine"
        gameEmoji="🤖"
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
