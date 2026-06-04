// ════════════════════════════════════════════════════════════════
// GAME PLAY PAGE — Phase 4 Redesign (HtmlGameShell Integration)
// ════════════════════════════════════════════════════════════════
// Replaces the 3D-first game page with HTML-first wrapper.
// Shows a beautiful difficulty selector before launching the game.
// Uses HtmlGameShell for the game container + CelebrationOverlay
// for completion feedback. Games are dynamically loaded via the
// existing loader system — zero game code changes needed.

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Play, Sparkles, Lock, Zap,
  Star, Clock, Target, ChevronRight,
} from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { getGameBySlug } from '@/config/gameRegistry';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import { GAME_LOADERS } from './game-loaders';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFButton } from '@/components/ui/SFButton';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { CelebrationOverlay } from '@/components/celebrations/CelebrationOverlay';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';
import ShinyText from '@/components/bits/ShinyText';
import StarBorder from '@/components/bits/StarBorder';
import TiltedCard from '@/components/bits/TiltedCard';
import type { GameResult } from '@/types/game';
import type { ComponentType } from 'react';

// ── Difficulty tiers ──
const DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Easy',
    description: 'Guided learning with hints',
    color: '#2ECC71',
    stars: 1,
    xpMultiplier: 0.8,
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Standard challenge',
    color: '#FFD93D',
    stars: 2,
    xpMultiplier: 1,
  },
  {
    id: 'hard',
    label: 'Hard',
    description: 'Expert mode, no hints',
    color: '#FF6B35',
    stars: 3,
    xpMultiplier: 1.5,
  },
];

// ── Game loader component ──
function GameLoaderFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <SFSkeleton variant="avatar" className="w-12 h-12 mx-auto mb-4 rounded-full" />
        <p className="text-sm font-medium" style={{ color: '#8C94AC' }}>Loading game...</p>
      </div>
    </div>
  );
}

export default function GamePlayPage() {
  const { gameSlug } = useParams<{ gameSlug: string }>();
  const router = useRouter();
  const activeChild = useActiveChild();
  const completeAndReward = useCompleteAndReward();

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'selecting' | 'playing' | 'completed'>('selecting');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Resolve game config
  const gameConfig = useMemo(() => getGameBySlug(gameSlug), [gameSlug]);
  const childBand = activeChild?.age_band || 'B';

  // Dynamic game component
  const GameComponent = useMemo(() => {
    const loader = GAME_LOADERS[gameSlug];
    if (!loader) return null;
    return dynamic(loader, { ssr: false, loading: GameLoaderFallback });
  }, [gameSlug]);

  // Handle game completion
  const handleGameComplete = useCallback(
    async (result: GameResult) => {
      setGameResult(result);
      setGameState('completed');
      setShowCelebration(true);

      // Award XP via backend
      if (activeChild?.id) {
        try {
          await completeAndReward(
            activeChild.id,
            gameSlug,
            result.xpEarned,
            'game',
            Math.round((result.score / result.maxScore) * 100)
          );
        } catch {
          // Non-blocking: celebration still shows even if XP save fails
        }
      }
    },
    [activeChild, gameSlug, completeAndReward]
  );

  // Age band check
  if (GameComponent && gameConfig?.ageBands && !gameConfig.ageBands.includes(childBand)) {
    return <AgeRestricted gameConfig={gameConfig} />;
  }

  if (!GameComponent || !gameConfig) {
    return <GameNotFound />;
  }

  const labColor = LAB_COLORS[gameConfig.lab] || '#4F6EF7';
  const diff = DIFFICULTIES.find((d) => d.id === selectedDifficulty);

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-0">
      <AnimatePresence mode="wait">
        {/* ═══ STATE: Difficulty Selection ═══ */}
        {gameState === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Back link */}
            <Link
              href="/arcade"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
              style={{ color: '#8C94AC' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            {/* Game Hero */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl mx-auto mb-5"
                style={{
                  background: `linear-gradient(135deg, ${labColor}, #4F6EF7)`,
                  boxShadow: `0 8px 32px ${labColor}40`,
                }}
              >
                {gameConfig.icon}
              </motion.div>

              <h1
                className="text-2xl sm:text-3xl font-extrabold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
              >
                <GradientText from={labColor} to="#4F6EF7">
                  {gameConfig.name}
                </GradientText>
              </h1>

              <div className="flex items-center justify-center gap-2 mb-3">
                <SFBadge variant="primary" size="sm" style={{ backgroundColor: `${labColor}15`, color: labColor }}>
                  {gameConfig.labName}
                </SFBadge>
                <SFBadge
                  variant={gameConfig.tier === 'flagship' ? 'premium' : gameConfig.tier === 'fl-lite' ? 'secondary' : 'default'}
                  size="sm"
                >
                  {gameConfig.tier}
                </SFBadge>
              </div>

              <p className="text-sm max-w-md mx-auto" style={{ color: '#8C94AC' }}>
                {gameConfig.description}
              </p>
            </div>

            {/* Game Info Cards */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { icon: Target, label: 'Focus', value: gameConfig.labName, color: labColor },
                { icon: Clock, label: 'Time', value: '~5 min', color: '#FF6B35' },
                { icon: Zap, label: 'XP', value: gameConfig.tier === 'flagship' ? '50' : gameConfig.tier === 'fl-lite' ? '30' : '15', color: '#4F6EF7' },
              ].map((info, i) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-center p-3 rounded-xl"
                  style={{ backgroundColor: `${info.color}08` }}
                >
                  <info.icon className="w-5 h-5 mx-auto mb-1" style={{ color: info.color }} />
                  <p className="text-xs font-bold" style={{ color: '#1A1D2B' }}>{info.value}</p>
                  <p className="text-[10px]" style={{ color: '#8C94AC' }}>{info.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Difficulty Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2
                className="text-lg font-bold text-center mb-5"
                style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
              >
                <ShinyText text="Choose Your Challenge" speed={4} />
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {DIFFICULTIES.map((d, i) => (
                  <motion.button
                    key={d.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDifficulty(d.id)}
                    className={`relative p-5 rounded-sf-xl text-left transition-all border-2 ${selectedDifficulty === d.id ? 'ring-2' : ''}`}
                    style={{
                      backgroundColor: selectedDifficulty === d.id ? `${d.color}08` : '#FFFFFF',
                      borderColor: selectedDifficulty === d.id ? d.color : '#EEF2FA',
                      boxShadow: selectedDifficulty === d.id ? `0 4px 20px ${d.color}20` : 'var(--shadow-sm)',
                      ['--tw-ring-color' as string]: d.color,
                    }}
                  >
                    {/* Star indicators */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Star
                          key={j}
                          className="w-4 h-4"
                          style={{
                            color: j < d.stars ? d.color : '#EEF2FA',
                            fill: j < d.stars ? d.color : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <h3 className="text-base font-bold mb-1" style={{ color: '#1A1D2B' }}>
                      {d.label}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: '#8C94AC' }}>
                      {d.description}
                    </p>

                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" style={{ color: d.color }} />
                      <span className="text-xs font-semibold" style={{ color: d.color }}>
                        {d.xpMultiplier}x XP
                      </span>
                    </div>

                    {selectedDifficulty === d.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: d.color }}
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Play Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedDifficulty ? 1 : 0 }}
                className="text-center mt-6"
              >
                <SFButton
                  variant="primary"
                  size="lg"
                  shape="pill"
                  leftIcon={<Play className="w-5 h-5" />}
                  onClick={() => setGameState('playing')}
                  className="px-10"
                  style={{
                    background: `linear-gradient(135deg, ${labColor}, #4F6EF7)`,
                    boxShadow: `0 4px 20px ${labColor}40`,
                  }}
                >
                  Start Game
                </SFButton>
              </motion.div>
            </motion.div>

            {/* How to Play */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-lg mx-auto"
            >
              <SpotlightCard spotlightColor={`${labColor}10`} className="p-5">
                <h3 className="text-sm font-bold mb-3" style={{ color: '#1A1D2B' }}>
                  <Target className="w-4 h-4 inline mr-1" style={{ color: labColor }} />
                  How to Play
                </h3>
                <ul className="space-y-2 text-xs" style={{ color: '#8C94AC' }}>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: labColor }}>1</span>
                    Read the instructions at the start of each round
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: labColor }}>2</span>
                    Complete the challenges to learn AI concepts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: labColor }}>3</span>
                    Earn XP and stars based on your performance
                  </li>
                </ul>
              </SpotlightCard>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ STATE: Playing ═══ */}
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Game shell header */}
            <div
              className="flex items-center justify-between px-4 py-3 mb-4 rounded-sf-xl"
              style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }}
            >
              <button
                onClick={() => {
                  if (confirm('Exit game? Your progress will be saved.')) {
                    setGameState('selecting');
                  }
                }}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
                style={{ color: '#8C94AC' }}
              >
                <ArrowLeft className="w-4 h-4" /> Exit
              </button>

              <div className="flex items-center gap-2">
                <SFBadge variant="primary" size="sm" style={{ backgroundColor: `${labColor}15`, color: labColor }}>
                  {gameConfig.name}
                </SFBadge>
                {diff && (
                  <SFBadge size="sm" style={{ backgroundColor: `${diff.color}15`, color: diff.color }}>
                    {diff.label}
                  </SFBadge>
                )}
              </div>
            </div>

            {/* Game container */}
            <div
              className="rounded-sf-xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: 'var(--shadow-md)',
                minHeight: '500px',
              }}
            >
              <GameComponent />
            </div>

            {/* Completion trigger (games call this via a global event or callback) */}
            {/* The actual completion is handled by the game's internal GameShell calling the gamification hooks */}
          </motion.div>
        )}

        {/* ═══ STATE: Completed ═══ */}
        {gameState === 'completed' && gameResult && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <CelebrationOverlay
              result={gameResult}
              onDismiss={() => {
                setShowCelebration(false);
                router.push('/arcade');
              }}
            />

            {/* Post-game actions (shown after celebration dismiss) */}
            {!showCelebration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
                  Great job! Want to play another game?
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <SFButton
                    variant="primary"
                    leftIcon={<Play className="w-4 h-4" />}
                    onClick={() => setGameState('selecting')}
                  >
                    Play Again
                  </SFButton>
                  <Link href="/arcade">
                    <SFButton variant="outline">
                      Browse Games
                    </SFButton>
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

function AgeRestricted({ gameConfig }: { gameConfig: { ageBands: string[] } }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md p-8"
      >
        <div className="text-6xl mb-4">
          <Lock className="w-16 h-16 mx-auto" style={{ color: '#DAE0F0' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          Age Restricted
        </h2>
        <p className="text-sm mb-6" style={{ color: '#8C94AC' }}>
          This game is designed for ages {gameConfig.ageBands.map((b) =>
            b === 'A' ? '7-10' : b === 'B' ? '11-13' : '14-16'
          ).join(', ')}.
        </p>
        <Link href="/arcade">
          <SFButton variant="primary">Back to Arcade</SFButton>
        </Link>
      </motion.div>
    </div>
  );
}

function GameNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md p-8"
      >
        <div className="text-6xl mb-4">&#x2753;</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          Game Not Found
        </h2>
        <p className="text-sm mb-6" style={{ color: '#8C94AC' }}>
          This game may have been moved or removed.
        </p>
        <Link href="/arcade">
          <SFButton variant="primary">Back to Arcade</SFButton>
        </Link>
      </motion.div>
    </div>
  );
}
