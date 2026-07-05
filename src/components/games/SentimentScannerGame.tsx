// ════════════════════════════════════════════════════════════════════════
// SENTIMENT SCANNER v4 — Lab 8 (AI That Understands Us) — SORT archetype
// ════════════════════════════════════════════════════════════════════════
// Was a slider-tuning sentiment simulation. Now you SORT short text messages
// into their emotion — Happy / Sad / Angry / Neutral — the way a sentiment
// classifier labels the feeling behind a piece of text. Pixi SORT scene inside
// GameShell.
//
// Teaches: sentiment analysis reads the emotional tone of text by spotting
// cue words and phrasing — and sorts each message into a feeling.

'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PixiStageSkeleton from '@/components/games/pixi/PixiStageSkeleton';
import { useReducedMotion } from 'motion/react';
import {
  ChevronRight, ScanLine, GraduationCap, Target, RotateCcw, Sparkles,
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

const LAB_COLOR = '#8F96FA';
const BINS = ['Happy', 'Sad', 'Angry', 'Neutral']; // bin index 0 / 1 / 2 / 3
const CHIP_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#10BAD2', '#8F96FA', '#F59E0B'];

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Happy or Sad?', description: 'Sort clearly happy and sad messages.', emoji: '😊', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Movie Reviews', description: 'Did they love it or hate it?', emoji: '🎬', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'Social Posts', description: 'Sort everyday posts by feeling.', emoji: '📱', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 70 },
  { id: 4, name: 'Angry Voices', description: 'Spot frustration and anger.', emoji: '😠', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 5, name: 'Plain Facts', description: 'Neutral messages carry no strong feeling.', emoji: '😐', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 90 },
  { id: 6, name: 'Mixed Feed', description: 'All four emotions together.', emoji: '🌍', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 7, name: 'Customer Feedback', description: 'Sort product reviews by mood.', emoji: '⭐', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 8, name: 'Tricky Tone', description: 'Subtle cues, harder calls.', emoji: '🤔', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 130 },
  { id: 9, name: 'Real Streams', description: 'Fast feed of mixed emotions.', emoji: '📡', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150 },
  { id: 10, name: 'Emotion Master', description: 'The ultimate sentiment sort!', emoji: '👑', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 200, isBonus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'Sentiment analysis reads text and labels its feeling — happy, sad, angry, or neutral.',
  2: 'Cue words give it away: "loved" and "amazing" are happy; "boring" and "waste" are not.',
  3: 'Short posts still carry emotion — a model spots tone from just a few words.',
  4: 'Anger has its own cues: "furious", "ridiculous", and ALL-CAPS shouting signal it.',
  5: 'Neutral text states facts with no strong feeling — "The store opens at nine."',
  6: 'Real feeds mix all four emotions — the model labels each message on its own.',
  7: 'Reviews pack feeling: "best purchase ever" is happy, "broke in a day" is angry.',
  8: 'Some tones are subtle — disappointment leans sad, mild complaints lean angry.',
  9: 'Live streams move fast — a classifier still labels every message in real time.',
  10: 'Master test: read each message and sort its true emotion, fast and correctly.',
};

// ════════════════════════════════════════════════════════════════════════
// MESSAGE BANK — full text + its emotion (bin) + why (interleaved across bins)
// label = SHORT chip text, name = full message for a11y
// ════════════════════════════════════════════════════════════════════════
interface Message { id: string; label: string; name: string; bin: number; why: string; }

const BANK: Message[] = [
  { id: 'best-day', label: 'best day ever!', name: 'This is the best day ever!', bin: 0, why: '"best ever" and the exclamation signal joy — happy.' },
  { id: 'so-sad', label: 'I feel so down', name: 'I feel so down and lonely today.', bin: 1, why: '"down" and "lonely" are classic sadness cues — sad.' },
  { id: 'furious', label: 'I am furious', name: 'I am absolutely furious about this!', bin: 2, why: '"furious" is a direct anger word — angry.' },
  { id: 'opens-nine', label: 'opens at nine', name: 'The store opens at nine in the morning.', bin: 3, why: 'A plain fact with no feeling — neutral.' },
  { id: 'loved-it', label: 'loved every minute', name: 'I loved every single minute of it!', bin: 0, why: '"loved" is a strong positive cue — happy.' },
  { id: 'miss-you', label: 'I miss you', name: 'I really miss you and it hurts.', bin: 1, why: '"miss" and "hurts" express loss — sad.' },
  { id: 'ridiculous', label: 'this is ridiculous', name: 'This is ridiculous, I want a refund now!', bin: 2, why: '"ridiculous" and demanding tone signal anger — angry.' },
  { id: 'weather-report', label: 'cloudy today', name: 'It will be cloudy today with light wind.', bin: 3, why: 'A factual report, no emotion — neutral.' },
  { id: 'so-excited', label: 'so excited!', name: 'I am so excited for the trip tomorrow!', bin: 0, why: '"excited" is an upbeat cue — happy.' },
  { id: 'crying', label: 'I cant stop crying', name: "I can't stop crying after the news.", bin: 1, why: '"crying" is a strong sadness cue — sad.' },
  { id: 'fed-up', label: 'fed up with this', name: 'I am completely fed up with this service!', bin: 2, why: '"fed up" expresses frustration — angry.' },
  { id: 'meeting-three', label: 'meeting at three', name: 'The meeting is scheduled for three o\'clock.', bin: 3, why: 'A plain scheduling fact — neutral.' },
  { id: 'amazing', label: 'absolutely amazing', name: 'That was absolutely amazing, thank you!', bin: 0, why: '"amazing" and gratitude signal joy — happy.' },
  { id: 'heartbroken', label: 'I am heartbroken', name: 'I am heartbroken over losing my pet.', bin: 1, why: '"heartbroken" is a deep sadness cue — sad.' },
  { id: 'unacceptable', label: 'totally unacceptable', name: 'This delay is totally unacceptable!', bin: 2, why: '"unacceptable" with emphasis signals anger — angry.' },
  { id: 'package-info', label: 'package weighs 2kg', name: 'The package weighs about two kilograms.', bin: 3, why: 'A factual measurement — neutral.' },
  { id: 'thrilled', label: 'thrilled with it', name: 'I am thrilled with how it turned out!', bin: 0, why: '"thrilled" is a happy cue — happy.' },
  { id: 'disappointed', label: 'feeling let down', name: 'I am feeling really let down by all this.', bin: 1, why: 'Disappointment and "let down" lean sad.' },
];

function getItems(levelId: number): Message[] {
  const count = Math.min(8, 6 + Math.floor(levelId / 4)); // 6–8 items
  const offset = ((levelId - 1) * 2) % BANK.length;
  const out: Message[] = [];
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
    () => items.map((it, i) => ({ id: it.id, label: it.label, name: `"${it.name}"`, color: CHIP_PALETTE[i % CHIP_PALETTE.length] })),
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
      setFeedback({ type: 'correct', message: nextCombo > 2 ? `${nextCombo}x combo! +${gained}` : `Scanned! +${gained}`, explanation: item.why });
      juice.onCorrect(doneCount, nextScore);
      if (doneCount >= items.length) finishLevel(nextScore, wrong);
    } else {
      setCombo(0);
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      setFeedback({ type: 'wrong', message: `That message is ${BINS[item.bin]}.`, explanation: item.why });
      juice.onWrong(0, score);
      if (doneCount >= items.length) finishLevel(score, nextWrong);
    }
  }, [assignments, items, combo, score, wrong, juice, finishLevel]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji="😊" color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 inline mr-1" />
            <strong>Concept:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Sort:</strong> Drag each message into <strong>Happy</strong>, <strong>Sad</strong>, <strong>Angry</strong>, or <strong>Neutral</strong>.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
          Start Scanning <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ SORT ═══
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji="😊" color={LAB_COLOR}>Sort the Emotions</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <ScanLine className="w-4 h-4" />{sortedCount} / {items.length}
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
export default function SentimentScannerGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('sentiment-scanner', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Sentiment Scanner" color="#8F96FA" labNum={8}>
      <GameLevelSystem
        gameTitle="Sentiment Scanner"
        gameEmoji="😊"
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
