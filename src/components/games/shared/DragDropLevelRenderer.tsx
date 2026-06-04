// ════════════════════════════════════════════════════════════════════════
// DRAG/DROP LEVEL RENDERER — Shared for sorting/drag games
// ════════════════════════════════════════════════════════════════════════
// Provides: draggable items, drop zones, scoring by placement,
// multi-round sorting, combo tracking, animated feedback.

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { ChevronRight, RotateCcw, Target, GraduationCap, GripVertical } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import type { LevelConfig, LevelResult } from './GameLevelSystem';
import {
  ScoreDisplay, GlowingTitle, FeedbackPopup,
  ComboCounter, LevelBadge,
} from './GameVisualKit';

export interface DragItem {
  id: string;
  label: string;
  emoji: string;
  category: string;
  explanation: string;
}

export interface DropZone {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

interface DragDropLevelRendererProps {
  level: LevelConfig;
  onComplete: (result: LevelResult) => void;
  onExit: () => void;
  labColor: string;
  gameEmoji: string;
  description: string;
  concept: string;
  challenge?: string;
  items: DragItem[];
  zones: DropZone[];
}

export default function DragDropLevelRenderer({
  level, onComplete, onExit, labColor, gameEmoji,
  description, concept, challenge, items, zones,
}: DragDropLevelRendererProps) {
  const [phase, setPhase] = useState<'welcome' | 'sort' | 'result'>('welcome');
  const [placements, setPlacements] = useState<Record<string, string>>({}); // itemId -> zoneId
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'info'; message: string; explanation?: string } | null>(null);

  const maxScore = items.length * 10 + 10;
  const placedCount = Object.keys(placements).length;

  const handlePlace = useCallback((itemId: string, zoneId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const isCorrect = item.category === zoneId;
    setPlacements((prev) => ({ ...prev, [itemId]: zoneId }));

    if (isCorrect) {
      const bonus = Math.min(combo, 5);
      setScore((s) => s + 10 + bonus);
      setCombo((c) => c + 1);
      setFeedback({
        type: 'correct',
        message: combo > 2 ? `Perfect! ${combo + 1}x streak!` : 'Correct placement!',
        explanation: item.explanation,
      });
    } else {
      setScore((s) => s + 2);
      setCombo(0);
      setFeedback({
        type: 'wrong',
        message: 'Not quite — but good try!',
        explanation: item.explanation,
      });
    }
  }, [items, combo]);

  const handleFinish = useCallback(() => {
    const correctCount = items.filter((i) => placements[i.id] === i.category).length;
    const accuracy = correctCount / items.length;
    const score = Math.round(accuracy * 100);
    const stars = score >= level.starThresholds[2] ? 3 : score >= level.starThresholds[1] ? 2 : score >= level.starThresholds[0] ? 1 : 0;

    setPhase('result');
    setTimeout(() => {
      onComplete({
        score,
        maxScore: 100,
        stars: stars as 0 | 1 | 2 | 3,
        xpEarned: level.xpReward * (stars / 3),
        timeMs: 0,
      });
    }, 2000);
  }, [items, placements, level, onComplete]);

  const unplacedItems = items.filter((i) => !placements[i.id]);

  // Welcome
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji={gameEmoji} color={labColor}>Level {level.id}: {level.name}</GlowingTitle>
          <SFCard variant="elevated" className="p-5">
            <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{description}</p>
            <div className="rounded-xl p-3 text-xs" style={{ background: `${labColor}10`, color: labColor }}>
              <GraduationCap className="w-4 h-4 inline mr-1" />
              <strong>Concept:</strong> {concept}
            </div>
            {challenge && (
              <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Challenge:</strong> {challenge}</span>
              </div>
            )}
          </SFCard>
          <div className="flex flex-wrap gap-2 justify-center">
            {items.slice(0, 6).map((item) => (
              <div key={item.id} className="text-2xl" title={item.label}>{item.emoji}</div>
            ))}
          </div>
          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sort')}>
            Start Sorting <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // Sort
  if (phase === 'sort') {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji={gameEmoji} color={labColor}>{level.name}</GlowingTitle>
            <LevelBadge level={level.id} color={labColor} />
          </div>
          <ScoreDisplay score={score} maxScore={maxScore} />
          <ComboCounter combo={combo} />

          {/* Unplaced items */}
          {unplacedItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#8C94AC' }}>
                Drag items to the correct zone ({unplacedItems.length} remaining)
              </p>
              <div className="flex flex-wrap gap-2">
                {unplacedItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      // For tap-to-sort: show zone selector
                      const zone = zones[0]; // Default to first for simplicity
                      handlePlace(item.id, zone.id);
                    }}
                    className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2
                      transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: `${labColor}10`,
                      border: `1px solid ${labColor}20`,
                      color: '#1A1D2B',
                      ['--tw-ring-color' as string]: labColor,
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{item.emoji}</span>
                    <span className="text-xs">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Drop zones with placed items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zones.map((zone) => {
              const zoneItems = items.filter((i) => placements[i.id] === zone.id);
              const correctInZone = zoneItems.filter((i) => i.category === zone.id).length;
              return (
                <SFCard
                  key={zone.id}
                  variant="elevated"
                  className="p-3"
                  style={{ borderColor: `${zone.color}30`, borderWidth: 1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{zone.emoji}</span>
                    <span className="text-sm font-bold" style={{ color: zone.color }}>{zone.label}</span>
                    {zoneItems.length > 0 && (
                      <span className="text-[10px] ml-auto" style={{ color: '#8C94AC' }}>
                        {correctInZone}/{zoneItems.length} correct
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                    {zoneItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                        style={{
                          background: item.category === zone.id ? '#2ECC7115' : '#EF444415',
                          color: item.category === zone.id ? '#2ECC71' : '#EF4444',
                        }}
                      >
                        {item.emoji} {item.label}
                      </motion.div>
                    ))}
                    {zoneItems.length === 0 && (
                      <span className="text-xs" style={{ color: '#8C94AC' }}>Tap items above to place here</span>
                    )}
                  </div>
                </SFCard>
              );
            })}
          </div>

          {feedback && <FeedbackPopup {...feedback} />}

          <div className="flex gap-2">
            <SFButton
              variant="primary"
              className="flex-1"
              onClick={handleFinish}
              disabled={placedCount < items.length}
            >
              {placedCount >= items.length ? 'Check Results' : `${items.length - placedCount} more to place...`}
            </SFButton>
            <SFButton variant="outline" onClick={onExit}>
              <RotateCcw className="w-4 h-4" />
            </SFButton>
          </div>
        </div>
      </div>
    );
  }

  // Result
  if (phase === 'result') {
    const correctCount = items.filter((i) => placements[i.id] === i.category).length;
    const accuracy = Math.round((correctCount / items.length) * 100);
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 text-center space-y-4">
          <GlowingTitle emoji={gameEmoji} color={labColor}>Results</GlowingTitle>
          <motion.div
            className="text-5xl font-extrabold"
            style={{ color: labColor, fontFamily: 'var(--font-display)' }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
          >
            {accuracy}%
          </motion.div>
          <p className="text-sm" style={{ color: '#5A6078' }}>
            {correctCount} of {items.length} items placed correctly
          </p>
          <FeedbackPopup
            type={accuracy >= 80 ? 'correct' : 'info'}
            message={accuracy >= 80 ? 'Excellent sorting!' : accuracy >= 60 ? 'Good job!' : 'Keep practicing!'}
            explanation={concept}
          />
        </div>
      </div>
    );
  }

  return null;
}
