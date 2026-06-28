// ════════════════════════════════════════════════════════════════════════
// BIAS DETECTIVE v5 — Lab 6 (AI & Ethics) Flagship — SORT archetype (Phase D)
// ════════════════════════════════════════════════════════════════════════
// Was a concept quiz. Now you weigh the evidence: drag each AI scenario onto the
// scales — "Shows Bias" or "Fair Design" — and a fairness balance meter tips
// toward fair as you call them correctly (the map's "scales" SORT). Pixi SORT
// scene inside GameShell. Same educational cases (Amazon hiring, COMPAS,
// healthcare proxy, facial recognition, audits), now an interactive judgment.
//
// Teaches: recognising biased vs fair AI design in real systems.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, Scale, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#FF7050';
const BINS = ['Shows Bias', 'Fair Design']; // bin index 0 / 1
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'What is Bias?', description: 'Weigh fair vs biased AI.', emoji: '⚖️', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Data Bias', description: 'Bias starts in the data.', emoji: '📊', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Algorithm Bias', description: 'How algorithms amplify bias.', emoji: '🧮', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Facial Recognition', description: 'Why face AI fails some people.', emoji: '👤', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Hiring AI', description: 'When AI screens applications.', emoji: '💼', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Criminal Justice', description: 'AI in courts and policing.', emoji: '⚖️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Healthcare Bias', description: 'AI that treats patients unfairly.', emoji: '🏥', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Language Models', description: 'Bias in text generation.', emoji: '📝', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Intersectionality', description: 'Multiple overlapping biases.', emoji: '🔀', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Bias Hunter', description: 'The ultimate bias-detection test!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'AI bias means a system produces unfair results for certain groups. Fair design tests and balances across everyone.',
  2: 'Bias starts in the data: a model learns whatever skew its training examples contain.',
  3: 'Algorithms amplify patterns — including unfair ones — unless designers check for it.',
  4: 'Face AI failed darker skin tones when training sets lacked them. Testing across tones is fair design.',
  5: 'Amazon\'s hiring AI penalised "women\'s" because past hires were mostly male. Diverse data avoids that.',
  6: 'COMPAS falsely flagged Black defendants as higher risk. Independent audits catch this.',
  7: 'A healthcare AI used spending as a proxy for need, underserving patients with less access.',
  8: 'Language models absorb internet stereotypes; explainability helps spot when they leak into decisions.',
  9: 'Intersectional bias compounds — removing one protected attribute is not enough if proxies remain.',
  10: 'Master test: weigh every system as biased or fair, and know why.',
};

// ════════════════════════════════════════════════════════════════════════
// SCENARIO BANK — an AI design choice + verdict (bin) + why (interleaved)
// ════════════════════════════════════════════════════════════════════════
interface Scenario { id: string; label: string; name: string; bin: number; why: string; }

const BANK: Scenario[] = [
  { id: 'male-hire', label: 'Hires from male-only history', name: 'Hiring AI trained only on past male hires', bin: 0, why: 'It learns the historical skew and penalises women — biased.' },
  { id: 'test-tones', label: 'Tested on all skin tones', name: 'Face ID tested across all skin tones', bin: 1, why: 'Testing across groups is fair design.' },
  { id: 'zip-proxy', label: 'Uses ZIP code as a proxy', name: 'Risk score using ZIP code as a proxy', bin: 0, why: 'ZIP code correlates with race — the bias sneaks back in.' },
  { id: 'diverse-data', label: 'Diversified training data', name: 'Training data balanced across groups', bin: 1, why: 'Representative data reduces bias — fair design.' },
  { id: 'spend-need', label: 'Spending = health need', name: 'Healthcare AI using spending as need', bin: 0, why: 'Lower spending reflects access barriers, not less need — biased.' },
  { id: 'audit', label: 'Independent diverse audit', name: 'Independent audit by a diverse team', bin: 1, why: 'Outside, diverse review catches hidden bias — fair.' },
  { id: 'llm-stereo', label: 'Repeats web stereotypes', name: 'LLM repeating internet stereotypes', bin: 0, why: 'It absorbed biased text and echoes it — biased.' },
  { id: 'xai', label: 'Explains its reasoning', name: 'Explainable AI showing its reasoning', bin: 1, why: 'Transparency lets you catch unfair influence — fair.' },
  { id: 'proxy-leak', label: 'Drops race, keeps ZIP+income', name: 'Removing race but keeping ZIP and income', bin: 0, why: 'Correlated features still predict race — fairness-through-unawareness fails.' },
  { id: 'parity', label: 'Equal positive rates', name: 'Equal positive rates across groups', bin: 1, why: 'Demographic parity is a fairness goal — fair design.' },
  { id: 'more-male', label: 'Mostly male faces in data', name: 'More male faces in the training set', bin: 0, why: 'The model learns male features better — biased.' },
  { id: 'per-demo', label: 'Accuracy checked per group', name: 'Testing accuracy per demographic', bin: 1, why: 'Per-group testing surfaces unfair gaps — fair.' },
];

function getItems(levelId: number): Scenario[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Scenario[] = [];
  for (let i = 0; i < count; i++) out.push(BANK[(offset + i) % BANK.length]);
  const seen = new Set<string>();
  return out.filter((it) => (seen.has(it.id) ? false : seen.add(it.id)));
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — the SORT scales + fairness balance meter
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
  const [fairness, setFairness] = useState(50); // 0 = unfair, 100 = fair
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 20;
  const sortedCount = items.filter((t) => assignments[t.id] !== undefined).length;
  const allSorted = sortedCount >= items.length;
  const step = Math.round(50 / items.length);

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
      setFairness((f) => Math.min(100, f + step));
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Weighed right! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFairness((f) => Math.max(0, f - step));
      setFeedback({ type: 'wrong', message: `That one is "${BINS[item.bin]}".`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, step, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="⚖️" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Weigh it:</strong> Drag each AI system onto <strong>Shows Bias</strong> or <strong>Fair Design</strong>. Tip the scales toward fair!</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Investigating <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="⚖️" color={LAB_COLOR}>Weigh the Evidence</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Scale className="w-4 h-4" />{fairness}% fair
        </span>
      </div>

      {/* Fairness balance meter */}
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#0E1428' }} aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${fairness}%`, background: `linear-gradient(90deg, ${LAB_COLOR}, #2ECC71)` }}
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
          {allSorted ? 'Deliver verdict' : `Weigh ${items.length - sortedCount} more…`}
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
export default function BiasDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('bias-detective', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Bias Detective" color={LAB_COLOR} labNum={6}>
      <GameLevelSystem
        gameTitle="Bias Detective"
        gameEmoji="⚖️"
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
