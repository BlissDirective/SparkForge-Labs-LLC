// ════════════════════════════════════════════════════════════════
// GAME DETAIL MODAL — Rich Game Information Overlay (Phase 5)
// ════════════════════════════════════════════════════════════════
// Full game detail modal with description, age band, difficulty
// selector, related games, and play button. Triggered from arcade
// grid when a game card is clicked (not navigating away).

'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Gamepad2, Star, Zap, Clock, Users, ChevronRight,
  Sparkles, Trophy, Target, Flame,
} from 'lucide-react';
import type { GameRegistryEntry } from '@/config/gameRegistry';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { SFButton } from '@/components/ui/SFButton';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import TiltedCard from '@/components/bits/TiltedCard';
import GradientText from '@/components/bits/GradientText';

interface GameDetailModalProps {
  game: GameRegistryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  childAgeBand?: 'A' | 'B' | 'C';
  gameProgress?: { completed: boolean; percent: number; highScore?: number };
}

const TIER_CONFIG = {
  flagship: { label: 'Flagship', icon: Sparkles, color: '#E945F5', desc: 'Full 3D experience with immersive gameplay' },
  'fl-lite': { label: 'FL Lite', icon: Zap, color: '#FF6B35', desc: 'Lightweight fun with quick play sessions' },
  standard: { label: 'Standard', icon: Star, color: '#2ECC71', desc: 'Classic learning games with solid mechanics' },
};

const AGE_BAND_LABELS: Record<string, string> = {
  A: 'Ages 5–7',
  B: 'Ages 8–10',
  C: 'Ages 11–13',
};

export default function GameDetailModal({
  game,
  isOpen,
  onClose,
  childAgeBand = 'A',
  gameProgress,
}: GameDetailModalProps) {
  if (!game) return null;

  const tierInfo = TIER_CONFIG[game.tier];
  const TierIcon = tierInfo.icon;
  const labColor = LAB_COLORS[game.lab] || '#4F6EF7';
  const isAgeAppropriate = game.ageBands.includes(childAgeBand);

  // Find related games (same lab or same tier, excluding self)
  const relatedGames = GAME_REGISTRY
    .filter((g) => g.id !== game.id && (g.lab === game.lab || g.tier === game.tier))
    .slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl 
                       shadow-2xl"
            style={{ background: '#FFFFFF' }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div
              className="relative h-40 rounded-t-3xl flex items-end p-6 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${labColor}22, ${labColor}44)` }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${labColor}, transparent 70%)`,
                }}
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white 
                           shadow-md transition-colors focus-visible:outline-none 
                           focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ['--tw-ring-color' as string]: labColor }}
                aria-label="Close"
              >
                <X className="w-5 h-5" style={{ color: '#1A1D2B' }} />
              </button>

              <div className="relative flex items-end gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${labColor}, ${labColor}DD)` }}
                >
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-extrabold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                    {game.name}
                  </h2>
                  <p className="text-sm font-medium" style={{ color: labColor }}>
                    {game.labName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <SFBadge
                  variant="custom"
                  style={{
                    background: `${tierInfo.color}18`,
                    color: tierInfo.color,
                    borderColor: `${tierInfo.color}30`,
                  }}
                >
                  <TierIcon className="w-3 h-3 mr-1" />
                  {tierInfo.label}
                </SFBadge>
                {game.ageBands.map((band) => (
                  <SFBadge
                    key={band}
                    variant={band === childAgeBand ? 'success' : 'default'}
                  >
                    {AGE_BAND_LABELS[band] || `Band ${band}`}
                  </SFBadge>
                ))}
                {!isAgeAppropriate && (
                  <SFBadge variant="warning">Advanced</SFBadge>
                )}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: '#5A6078' }}>
                {game.description}
              </p>

              {/* Tier description */}
              <div
                className="rounded-xl p-3 text-xs flex items-start gap-2"
                style={{ background: `${tierInfo.color}10`, color: tierInfo.color }}
              >
                <TierIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{tierInfo.desc}</span>
              </div>

              {/* Progress (if available) */}
              {gameProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#5A6078' }}>Your Progress</span>
                    <span className="font-bold" style={{ color: labColor }}>
                      {gameProgress.percent}%
                    </span>
                  </div>
                  <SFProgressBar
                    value={gameProgress.percent}
                    variant="custom"
                    color={labColor}
                  />
                  {gameProgress.highScore !== undefined && (
                    <p className="text-xs" style={{ color: '#8C94AC' }}>
                      <Trophy className="w-3 h-3 inline mr-1" />
                      Best Score: {gameProgress.highScore}
                    </p>
                  )}
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Target, label: 'Stage', value: game.stage },
                  { icon: Users, label: 'Ages', value: game.ageBands.join(', ') },
                  { icon: Clock, label: 'Duration', value: '~10 min' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: '#F8F7FF' }}
                  >
                    <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: labColor }} />
                    <p className="text-xs font-semibold" style={{ color: '#1A1D2B' }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px]" style={{ color: '#8C94AC' }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Related games */}
              {relatedGames.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#1A1D2B' }}>
                    <Flame className="w-4 h-4 inline mr-1" style={{ color: '#FF6B35' }} />
                    Similar Games
                  </h3>
                  <div className="space-y-2">
                    {relatedGames.map((rg) => (
                      <button
                        key={rg.id}
                        onClick={() => {
                          // Swap to this game in modal
                          window.dispatchEvent(
                            new CustomEvent('gameDetailOpen', { detail: rg })
                          );
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left
                                   transition-colors hover:bg-gray-50 focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{ ['--tw-ring-color' as string]: LAB_COLORS[rg.lab] || '#4F6EF7' }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${LAB_COLORS[rg.lab] || '#4F6EF7'}, ${LAB_COLORS[rg.lab] || '#4F6EF7'}DD)`,
                          }}
                        >
                          <Gamepad2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1A1D2B' }}>
                            {rg.name}
                          </p>
                          <p className="text-xs" style={{ color: '#8C94AC' }}>
                            {rg.labName}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#8C94AC' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Play button */}
              <Link href={`/arcade/${game.slug}`} className="block">
                <SFButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  style={{
                    background: `linear-gradient(135deg, ${labColor}, ${labColor}DD)`,
                  }}
                >
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Play Now
                  <ChevronRight className="w-4 h-4 ml-1" />
                </SFButton>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
