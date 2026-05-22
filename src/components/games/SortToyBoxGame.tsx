// ════════════════════════════════════════════════════════════════════════
// SORT THE TOY BOX v4 — Lab 2 Flagship (Redesigned)
// ════════════════════════════════════════════════════════════════════════
// Sort 3D CSS toys into groups. AI reveals how it clusters.
// Replaced Three.js with ToyItem CSS components (trains, chess,
// treasure chests, rockets, robots, etc.)
// 10 levels with progressive toy sets, multi-dimension sorting,
// combo system, star ratings, timed challenges.
//
// Teaches: unsupervised learning, clustering, features, k-means,
// similarity metrics, dimensionality.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, ChevronRight, Sparkles, Timer, Trophy,
  RotateCcw, Target, GraduationCap, Lightbulb,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFBadge } from '@/components/ui/SFBadge';
import GameLevelSystem, { type LevelConfig, type LevelResult } from '@/components/games/shared/GameLevelSystem';
import {
  ToyItem, TOY_STYLES, ScoreDisplay,
  GlowingTitle, FeedbackPopup, ComboCounter, TimerDisplay,
} from '@/components/games/shared/GameVisualKit';

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'sort' | 'reveal' | 'level-complete';
type RevealStep = 'extracting' | 'calculating' | 'clustering' | 'done';

interface ToyItemData {
  id: string;
  type: string;
  features: Record<string, number>; // normalized 0-1
}

interface LevelData {
  title: string;
  description: string;
  concept: string;
  toyTypes: string[];
  featureKeys: string[];
  featureLabels: Record<string, string>;
  maxGroups: number;
  timeLimit: number | null;
  challenge?: string;
}

// ════════════════════════════════════════════════════════════════════════
// 10 LEVELS (2 hours of content)
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Toy Sorting 101', description: 'Sort toys by their type', emoji: '🧸', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 50 },
  { id: 2, name: 'Color Clues', description: 'Group by color patterns', emoji: '🎨', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 60 },
  { id: 3, name: 'Size Matters', description: 'Sort by multiple features', emoji: '📏', difficulty: 'easy', starThresholds: [60, 80, 95], xpReward: 70 },
  { id: 4, name: 'Shape & Form', description: 'Complex feature sorting', emoji: '🔷', difficulty: 'medium', starThresholds: [60, 80, 90], xpReward: 80 },
  { id: 5, name: 'Speed Round', description: 'Sort under time pressure', emoji: '⏱️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 90 },
  { id: 6, name: 'Hidden Features', description: 'Discover invisible traits', emoji: '👁️', difficulty: 'medium', starThresholds: [50, 75, 90], xpReward: 100 },
  { id: 7, name: 'AI vs Human', description: 'Beat the AI clusters', emoji: '🤖', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 120 },
  { id: 8, name: 'Confusing Toys', description: 'Toys that fit multiple groups', emoji: '😵', difficulty: 'hard', starThresholds: [50, 75, 85], xpReward: 130 },
  { id: 9, name: 'Master Sorter', description: 'All features, all toys', emoji: '🏆', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 150 },
  { id: 10, name: 'Cluster Champion', description: 'The ultimate sorting test', emoji: '👑', difficulty: 'expert', starThresholds: [50, 70, 85], xpReward: 200, isBonus: true },
];

const LEVEL_DATA: Record<number, LevelData> = {
  1: { title: 'Toy Sorting 101', description: 'Drag toys into groups. The AI will show you how it sees the same toys!', concept: 'Clustering means grouping similar things together. You sort by what seems similar — the AI does the same with math!', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot'], featureKeys: ['type'], featureLabels: { type: 'Toy Type' }, maxGroups: 3, timeLimit: null },
  2: { title: 'Color Clues', description: 'This time, toys come in different colors. Group by color first!', concept: 'Color is a feature! A feature is any property we can measure. AI uses features to decide what goes together.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car'], featureKeys: ['colorHue'], featureLabels: { colorHue: 'Color' }, maxGroups: 4, timeLimit: null },
  3: { title: 'Size Matters', description: 'Sort by size AND type. Multi-feature sorting!', concept: 'Multiple features = more dimensions. A toy can be similar in size but different in type. That is complexity!', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block'], featureKeys: ['type', 'size'], featureLabels: { type: 'Type', size: 'Size' }, maxGroups: 4, timeLimit: null },
  4: { title: 'Shape & Form', description: 'Complex sorting with 3 different features to consider.', concept: 'As dimensions grow, clustering gets harder. The AI uses distance in multi-dimensional space to find groups.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'size', 'roundness'], featureLabels: { type: 'Type', size: 'Size', roundness: 'Shape' }, maxGroups: 5, timeLimit: null },
  5: { title: 'Speed Sort!', description: '30 seconds! Sort as many toys as you can into the right groups.', concept: 'Real AI clustering happens in milliseconds. Can you keep up?', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue'], featureLabels: { type: 'Type', colorHue: 'Color' }, maxGroups: 4, timeLimit: 30, challenge: 'Sort 10 toys in 30 seconds!' },
  6: { title: 'Hidden Features', description: 'Some features are invisible! Can you guess the hidden trait?', concept: 'Not all features are visible. AI can discover hidden patterns — like weight, material, or sound.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'size', 'hiddenWeight'], featureLabels: { type: 'Type', size: 'Size', hiddenWeight: 'Weight (hidden)' }, maxGroups: 4, timeLimit: null, challenge: 'The weight feature is hidden! Watch the AI reveal it.' },
  7: { title: 'AI vs Human', description: 'Your sorting vs the AI\'s sorting. Who gets better groups?', concept: 'K-means clustering: the AI picks random centers, assigns points, moves centers, repeats. Simple but powerful!', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size'], featureLabels: { type: 'Type', colorHue: 'Color', size: 'Size' }, maxGroups: 5, timeLimit: 45, challenge: 'Score higher than the AI clusterer!' },
  8: { title: 'Confusing Toys', description: 'Some toys belong to multiple groups. Ambiguity!', concept: 'Fuzzy clustering lets items belong to multiple groups with different degrees. Not everything fits in one box.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness'], featureLabels: { type: 'Type', colorHue: 'Color', size: 'Size', roundness: 'Shape' }, maxGroups: 5, timeLimit: null },
  9: { title: 'Master Sorter', description: 'All features, all toys, maximum complexity.', concept: 'High-dimensional clustering: each feature is a dimension. The AI finds structure in 5+ dimensions!', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness', 'hiddenWeight'], featureLabels: { type: 'Type', colorHue: 'Color', size: 'Size', roundness: 'Shape', hiddenWeight: 'Weight' }, maxGroups: 6, timeLimit: 60 },
  10: { title: 'Cluster Champion', description: 'The ultimate test of sorting mastery.', concept: 'Combine everything: speed, multi-dimension sorting, hidden features, and beating the AI.', toyTypes: ['train', 'chess', 'chest', 'rocket', 'robot', 'dice', 'ball', 'car', 'teddy', 'block', 'plane', 'puzzle'], featureKeys: ['type', 'colorHue', 'size', 'roundness', 'hiddenWeight'], featureLabels: { type: 'Type', colorHue: 'Color', size: 'Size', roundness: 'Shape', hiddenWeight: 'Weight' }, maxGroups: 6, timeLimit: 45, challenge: 'The ultimate sorting test!' },
};

// ════════════════════════════════════════════════════════════════════════
// GENERATE TOYS FOR LEVEL
// ════════════════════════════════════════════════════════════════════════
function generateToys(levelId: number): ToyItemData[] {
  const data = LEVEL_DATA[levelId];
  const toys: ToyItemData[] = [];
  const count = 8 + levelId; // 9-18 toys per level

  for (let i = 0; i < count; i++) {
    const type = data.toyTypes[i % data.toyTypes.length];
    const toyDef = TOY_STYLES[type] || TOY_STYLES.block;
    toys.push({
      id: `toy-${i}`,
      type,
      features: {
        type: data.toyTypes.indexOf(type) / Math.max(data.toyTypes.length - 1, 1),
        colorHue: (parseInt(toyDef.color.slice(1), 16) % 360) / 360,
        size: type === 'chest' || type === 'train' ? 0.8 : type === 'dice' || type === 'ball' ? 0.4 : 0.6,
        roundness: ['ball', 'dice'].includes(type) ? 1 : ['rocket', 'plane'].includes(type) ? 0.3 : 0.5,
        hiddenWeight: Math.random(),
      },
    });
  }
  return toys;
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const data = LEVEL_DATA[level.id];
  const [phase, setPhase] = useState<Phase>('welcome');
  const [toys] = useState(() => generateToys(level.id));
  const [groups, setGroups] = useState<Record<string, number>>({});
  const [activeGroup, setActiveGroup] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(data.timeLimit || 60);
  const [revealStep, setRevealStep] = useState<RevealStep>('extracting');
  const [aiGroups, setAiGroups] = useState<Record<string, number>>({});
  const [sortedCount, setSortedCount] = useState(0);

  const labColor = '#4F6EF7';
  const maxScore = toys.length * 10 + 20;
  const allSorted = sortedCount >= toys.length;

  // Timer
  useState(() => {
    if ((phase === 'sort' || phase === 'reveal') && data.timeLimit) {
      const interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  });

  const handleAssignToy = useCallback((toyId: string) => {
    if (groups[toyId] !== undefined) return; // Already sorted
    setGroups((prev) => ({ ...prev, [toyId]: activeGroup }));
    setSortedCount((c) => c + 1);

    // Check if grouping is reasonable (simplified scoring)
    const toy = toys.find((t) => t.id === toyId);
    if (toy) {
      const sameTypeInGroup = toys.filter(
        (t) => t.type === toy.type && groups[t.id] === activeGroup
      ).length;
      const isGoodGrouping = sameTypeInGroup > 0 || activeGroup < data.maxGroups;

      if (isGoodGrouping) {
        setScore((s) => s + 10 + combo);
        setCombo((c) => c + 1);
        setFeedback({
          type: 'correct',
          message: combo > 2 ? `${combo}x combo! +${10 + combo} pts` : `+${10 + combo} pts`,
        });
      } else {
        setScore((s) => s + 5);
        setCombo(0);
        setFeedback({
          type: 'info',
          message: '+5 pts — interesting grouping!',
          explanation: 'Different types in the same group — the AI might see a hidden pattern.',
        });
      }
    }
  }, [activeGroup, groups, toys, combo, data.maxGroups]);

  const handleReveal = useCallback(() => {
    setPhase('reveal');
    setRevealStep('extracting');

    // Simulate AI clustering steps
    setTimeout(() => setRevealStep('calculating'), 800);
    setTimeout(() => setRevealStep('clustering'), 1600);
    setTimeout(() => {
      setRevealStep('done');
      // Generate AI groups
      const ai: Record<string, number> = {};
      toys.forEach((t) => {
        ai[t.id] = data.toyTypes.indexOf(t.type) % data.maxGroups;
      });
      setAiGroups(ai);

      // Calculate final score
      const accuracy = toys.filter((t) => (groups[t.id] !== undefined) && (groups[t.id] % data.maxGroups === ai[t.id])).length;
      const bonus = Math.round((accuracy / toys.length) * 20);
      const timeBonus = data.timeLimit ? Math.round(timeLeft / data.timeLimit * 10) : 0;
      const finalScore = score + bonus + timeBonus;
      const stars = finalScore >= level.starThresholds[2] ? 3 : finalScore >= level.starThresholds[1] ? 2 : finalScore >= level.starThresholds[0] ? 1 : 0;

      setTimeout(() => {
        onComplete({
          score: finalScore,
          maxScore,
          stars: stars as 0 | 1 | 2 | 3,
          xpEarned: level.xpReward * (stars / 3),
          timeMs: ((data.timeLimit || 60) - timeLeft) * 1000,
        });
      }, 1500);
    }, 2400);
  }, [toys, groups, score, timeLeft, data, level, maxScore, onComplete]);

  // ═══ WELCOME PHASE ═══
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji="📦" color={labColor}>Level {level.id}: {data.title}</GlowingTitle>

          <SFCard variant="elevated" className="p-5">
            <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{data.description}</p>
            <div className="rounded-xl p-3 text-xs" style={{ background: `${labColor}10`, color: labColor }}>
              <GraduationCap className="w-4 h-4 inline mr-1" />
              <strong>Concept:</strong> {data.concept}
            </div>
            {data.challenge && (
              <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Challenge:</strong> {data.challenge}</span>
              </div>
            )}
          </SFCard>

          {/* Preview toys */}
          <div className="flex flex-wrap gap-2 justify-center">
            {data.toyTypes.slice(0, 6).map((t) => (
              <ToyItem key={t} toyKey={t} size="sm" />
            ))}
          </div>

          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
            Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // ═══ SORT PHASE ═══
  if (phase === 'sort') {
    const unsorted = toys.filter((t) => groups[t.id] === undefined);
    const sorted = toys.filter((t) => groups[t.id] !== undefined);

    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji="📦" color={labColor}>Sort Toys</GlowingTitle>
            {data.timeLimit && <TimerDisplay seconds={timeLeft} />}
          </div>

          <ScoreDisplay score={score} maxScore={maxScore} />
          <ComboCounter combo={combo} />

          {/* Group selector tabs */}
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: data.maxGroups }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all
                  focus-visible:outline-none focus-visible:ring-2`}
                style={{
                  background: activeGroup === i ? `${labColor}20` : '#F0F1F8',
                  color: activeGroup === i ? labColor : '#8C94AC',
                  border: `2px solid ${activeGroup === i ? labColor : 'transparent'}`,
                  focusVisibleRingColor: labColor,
                }}
              >
                Group {i + 1}
                <span className="ml-1 opacity-60">
                  ({toys.filter((t) => groups[t.id] === i).length})
                </span>
              </button>
            ))}
          </div>

          {/* Unsorted toys */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#8C94AC' }}>
              {unsorted.length} toys to sort (click to add to Group {activeGroup + 1})
            </p>
            <div className="flex flex-wrap gap-2">
              {unsorted.map((toy) => (
                <motion.div key={toy.id} layout>
                  <ToyItem toyKey={toy.type} size="md" glowing onClick={() => handleAssignToy(toy.id)} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sorted toys by group */}
          {sorted.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#8C94AC' }}>Sorted</p>
              {Array.from({ length: data.maxGroups }).map((_, gi) => {
                const groupToys = sorted.filter((t) => groups[t.id] === gi);
                if (groupToys.length === 0) return null;
                return (
                  <div key={gi} className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${labColor}15`, color: labColor }}>
                      G{gi + 1}
                    </span>
                    {groupToys.map((t) => (
                      <ToyItem key={t.id} toyKey={t.type} size="sm" />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {feedback && <FeedbackPopup {...feedback} />}

          <div className="flex gap-2">
            <SFButton
              variant="primary"
              className="flex-1"
              onClick={handleReveal}
              disabled={!allSorted}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {allSorted ? 'See AI Results' : `Sort ${toys.length - sortedCount} more...`}
            </SFButton>
            <SFButton variant="outline" onClick={onExit}>
              <RotateCcw className="w-4 h-4" />
            </SFButton>
          </div>
        </div>
      </div>
    );
  }

  // ═══ REVEAL PHASE ═══
  if (phase === 'reveal') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <GlowingTitle emoji="🤖" color={labColor}>AI Clustering</GlowingTitle>

          {/* AI reveal steps */}
          <SFCard variant="elevated" className="p-4">
            <div className="space-y-3">
              {(['extracting', 'calculating', 'clustering', 'done'] as RevealStep[]).map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: revealStep === step ? labColor : revealStep === 'done' || 
                        (step === 'extracting' && revealStep !== 'extracting') ||
                        (step === 'calculating' && (revealStep === 'clustering' || revealStep === 'done')) ||
                        (step === 'clustering' && revealStep === 'done') ? '#2ECC71' : '#EEF0F8',
                    }}
                  >
                    {revealStep === 'done' || 
                     (step === 'extracting' && revealStep !== 'extracting') ||
                     (step === 'calculating' && (revealStep === 'clustering' || revealStep === 'done')) ||
                     (step === 'clustering' && revealStep === 'done') ? (
                      <motion.svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </motion.svg>
                    ) : revealStep === step ? (
                      <motion.div className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} />
                    ) : null}
                  </div>
                  <span className="text-sm capitalize" style={{
                    color: revealStep === step ? labColor : '#8C94AC',
                    fontWeight: revealStep === step ? 600 : 400,
                  }}>
                    {step === 'done' ? 'Complete!' : `${step} features...`}
                  </span>
                </div>
              ))}
            </div>
          </SFCard>

          {/* AI groups visualization */}
          {revealStep === 'done' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#1A1D2B' }}>AI found these clusters:</p>
              {Array.from({ length: data.maxGroups }).map((_, gi) => {
                const groupToys = toys.filter((t) => aiGroups[t.id] === gi);
                if (groupToys.length === 0) return null;
                return (
                  <div key={gi} className="rounded-xl p-3" style={{ background: `${labColor}08` }}>
                    <span className="text-xs font-bold mb-2 block" style={{ color: labColor }}>Cluster {gi + 1} ({groupToys.length} toys)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {groupToys.map((t) => (
                        <ToyItem key={t.id} toyKey={t.type} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function SortToyBoxGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();

  const handleAllComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    awardXP(Math.round(totalXP));
    completeGame('sort-toy-box', totalStars >= 25 ? 3 : totalStars >= 15 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Sort the Toy Box" color="#4F6EF7" labNum={2}>
      <GameLevelSystem
        gameTitle="Sort the Toy Box"
        gameEmoji="📦"
        labColor="#4F6EF7"
        levels={LEVELS}
        onComplete={handleAllComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
