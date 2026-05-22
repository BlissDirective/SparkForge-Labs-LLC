// ════════════════════════════════════════════════════════════════════════
// GAME LEVEL SYSTEM — Shared Progression Framework
// ════════════════════════════════════════════════════════════════════════
// Provides: level-based progression, star ratings (1-3 per level),
// locked/unlocked states, XP rewards per level, level map UI.
// Use by wrapping any game: <GameLevelSystem levels={...} renderLevel={...} />

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Lock, ChevronRight, Trophy, RotateCcw, Sparkles } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import CountUp from '@/components/bits/CountUp';

// ── Types ──
export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  starThresholds: [number, number, number]; // 1-star, 2-star, 3-star score thresholds
  xpReward: number;
  isBonus?: boolean;
}

export interface LevelResult {
  score: number;
  maxScore: number;
  stars: 0 | 1 | 2 | 3;
  xpEarned: number;
  timeMs: number;
}

interface GameLevelSystemProps {
  gameTitle: string;
  gameEmoji: string;
  labColor: string;
  levels: LevelConfig[];
  savedProgress?: Record<number, { stars: number; bestScore: number }>;
  onComplete: (results: LevelResult[]) => void;
  renderLevel: (level: LevelConfig, onComplete: (result: LevelResult) => void, onExit: () => void) => React.ReactNode;
}

// ── Level Map Node ──
function LevelNode({
  level, isUnlocked, bestStars, bestScore, onClick, index,
}: {
  level: LevelConfig; isUnlocked: boolean; bestStars: number; bestScore: number;
  onClick: () => void; index: number;
}) {
  const difColors = {
    easy: '#2ECC71', medium: '#4F6EF7', hard: '#FF6B35', expert: '#E945F5',
  };

  return (
    <motion.button
      onClick={isUnlocked ? onClick : undefined}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all
        ${isUnlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
      style={{
        background: isUnlocked
          ? `linear-gradient(135deg, ${level.isBonus ? '#FFD93D15' : '#FFFFFF'}, ${level.isBonus ? '#FFD93D08' : '#F8FAFF'})`
          : '#F0F1F8',
        border: `2px solid ${isUnlocked ? (level.isBonus ? '#FFD93D' : difColors[level.difficulty]) + '30' : '#EEF0F8'}`,
        focusVisibleRingColor: difColors[level.difficulty],
      }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', damping: 20 }}
      whileHover={isUnlocked ? { y: -4 } : {}}
    >
      {/* Level number / lock */}
      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: isUnlocked
              ? `linear-gradient(135deg, ${difColors[level.difficulty]}25, ${difColors[level.difficulty]}10)`
              : '#EEF0F8',
          }}
        >
          {isUnlocked ? level.emoji : <Lock className="w-5 h-5" style={{ color: '#8C94AC' }} />}
        </div>
        {bestStars > 0 && (
          <div className="absolute -top-1 -right-1 flex">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 -ml-1 first:ml-0"
                style={{
                  color: i < bestStars ? '#FFD93D' : '#EEF0F8',
                  fill: i < bestStars ? '#FFD93D' : 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <span className="text-[10px] font-bold mt-1" style={{ color: isUnlocked ? '#1A1D2B' : '#8C94AC' }}>
        {level.name}
      </span>

      {level.isBonus && isUnlocked && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FFD93D20', color: '#B8860B' }}>
          BONUS
        </span>
      )}

      {bestScore > 0 && (
        <span className="text-[9px]" style={{ color: '#8C94AC' }}>
          Best: {bestScore}
        </span>
      )}
    </motion.button>
  );
}

// ── Level Complete Overlay ──
function LevelCompleteOverlay({
  result, level, onNext, onReplay, onMap,
}: {
  result: LevelResult; level: LevelConfig; onNext: () => void; onReplay: () => void; onMap: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
        initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1D2B' }}>
          {result.stars >= 2 ? 'Level Complete!' : 'Level Finished'}
        </h3>

        {/* Stars */}
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={s <= result.stars ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0.3, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + s * 0.15, type: 'spring' }}
            >
              <Star
                className="w-10 h-10"
                style={{
                  color: s <= result.stars ? '#FFD93D' : '#EEF0F8',
                  fill: s <= result.stars ? '#FFD93D' : 'none',
                  filter: s <= result.stars ? 'drop-shadow(0 0 8px #FFD93D60)' : 'none',
                }}
              />
            </motion.div>
          ))}
        </div>

        <p className="text-sm mb-1" style={{ color: '#5A6078' }}>
          Score: <strong style={{ color: '#1A1D2B' }}>{result.score}</strong> / {result.maxScore}
        </p>
        <p className="text-sm mb-4" style={{ color: '#8C94AC' }}>
          +{result.xpEarned} XP earned
        </p>

        <div className="flex flex-col gap-2">
          <SFButton variant="primary" onClick={onNext}>
            Next Level <ChevronRight className="w-4 h-4 ml-1" />
          </SFButton>
          <div className="flex gap-2">
            <SFButton variant="outline" className="flex-1" onClick={onReplay}>
              <RotateCcw className="w-4 h-4 mr-1" /> Replay
            </SFButton>
            <SFButton variant="outline" className="flex-1" onClick={onMap}>
              Level Map
            </SFButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Game Complete (all levels done) ──
function GameCompleteOverlay({
  totalStars, maxStars, totalXP, onReplay,
}: {
  totalStars: number; maxStars: number; totalXP: number; onReplay: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #FFFFFF, #F8F7FF)' }}
        initial={{ scale: 0.5 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 18 }}
      >
        <motion.div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #FFD93D, #FF6B35)' }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>

        <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1D2B' }}>
          <Sparkles className="w-5 h-5 inline mr-1" style={{ color: '#E945F5' }} />
          All Levels Complete!
        </h3>

        <div className="flex justify-center gap-1 my-3">
          {Array.from({ length: maxStars }).map((_, i) => (
            <Star key={i} className="w-5 h-5" style={{
              color: i < totalStars ? '#FFD93D' : '#EEF0F8',
              fill: i < totalStars ? '#FFD93D' : 'none',
            }} />
          ))}
        </div>

        <p className="text-sm mb-4" style={{ color: '#5A6078' }}>
          <strong style={{ color: '#1A1D2B' }}>{totalStars}</strong> of <strong>{maxStars}</strong> stars collected
          <br />
          <strong style={{ color: '#FF6B35' }}><CountUp end={totalXP} /> XP</strong> total earned
        </p>

        <SFButton variant="primary" onClick={onReplay}>
          <RotateCcw className="w-4 h-4 mr-2" /> Play Again
        </SFButton>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──
export default function GameLevelSystem({
  gameTitle, gameEmoji, labColor, levels, savedProgress = {}, onComplete, renderLevel,
}: GameLevelSystemProps) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [levelResults, setLevelResults] = useState<Record<number, LevelResult>>({});
  const [showComplete, setShowComplete] = useState<LevelResult | null>(null);

  const handleLevelResult = useCallback((result: LevelResult) => {
    const levelId = activeLevel!;
    const existing = levelResults[levelId];
    // Keep best result
    if (!existing || result.stars > existing.stars || (result.stars === existing.stars && result.score > existing.score)) {
      setLevelResults((prev) => ({ ...prev, [levelId]: result }));
    }
    setShowComplete(result);
  }, [activeLevel, levelResults]);

  const goToNext = useCallback(() => {
    setShowComplete(null);
    const nextIdx = levels.findIndex((l) => l.id === activeLevel) + 1;
    if (nextIdx < levels.length) {
      setActiveLevel(levels[nextIdx].id);
    } else {
      // All done
      setActiveLevel(null);
      const allResults = Object.values({ ...levelResults, [activeLevel!]: levelResults[activeLevel!] || showComplete! });
      onComplete(allResults.filter(Boolean) as LevelResult[]);
    }
  }, [activeLevel, levels, levelResults, onComplete, showComplete]);

  const replayLevel = useCallback(() => {
    setShowComplete(null);
  }, []);

  const goToMap = useCallback(() => {
    setShowComplete(null);
    setActiveLevel(null);
  }, []);

  const isUnlocked = useCallback((levelId: number, levelIndex: number) => {
    if (levelIndex === 0) return true; // First level always unlocked
    const prevLevel = levels[levelIndex - 1];
    return (levelResults[prevLevel.id]?.stars || 0) >= 1 || (savedProgress[prevLevel.id]?.stars || 0) >= 1;
  }, [levelResults, savedProgress, levels]);

  const totalStars = levels.reduce((s, l) => s + (levelResults[l.id]?.stars || savedProgress[l.id]?.stars || 0), 0);
  const maxStars = levels.length * 3;
  const totalXP = levels.reduce((s, l) => s + (levelResults[l.id]?.xpEarned || 0), 0);

  // Active level view
  if (activeLevel !== null) {
    const level = levels.find((l) => l.id === activeLevel)!;
    return (
      <div className="relative">
        {renderLevel(level, handleLevelResult, goToMap)}
        <AnimatePresence>
          {showComplete && (
            <LevelCompleteOverlay
              result={showComplete}
              level={level}
              onNext={goToNext}
              onReplay={replayLevel}
              onMap={goToMap}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Level map view
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `linear-gradient(135deg, ${labColor}25, ${labColor}10)` }}
        >
          {gameEmoji}
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>{gameTitle}</h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#8C94AC' }}>
            <Star className="w-3 h-3" style={{ color: '#FFD93D', fill: '#FFD93D' }} />
            {totalStars}/{maxStars} stars
            <span className="mx-1">|</span>
            <Sparkles className="w-3 h-3" style={{ color: '#FF6B35' }} />
            {totalXP} XP
          </div>
        </div>
      </div>

      {/* Level grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {levels.map((level, i) => (
          <LevelNode
            key={level.id}
            level={level}
            index={i}
            isUnlocked={isUnlocked(level.id, i)}
            bestStars={levelResults[level.id]?.stars || savedProgress[level.id]?.stars || 0}
            bestScore={levelResults[level.id]?.bestScore || savedProgress[level.id]?.bestScore || 0}
            onClick={() => setActiveLevel(level.id)}
          />
        ))}
      </div>

      {/* All complete overlay */}
      <AnimatePresence>
        {totalStars >= maxStars && maxStars > 0 && (
          <GameCompleteOverlay
            totalStars={totalStars}
            maxStars={maxStars}
            totalXP={totalXP}
            onReplay={() => { setLevelResults({}); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
