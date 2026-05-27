// ════════════════════════════════════════════════════
// BadgeUnlockAnimation — Celebration Overlay
// Cinematic badge reveal with particles and screen effects
// ════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, Gem } from 'lucide-react';
import type { BadgeDefinition } from '@/lib/badges/BadgeEngine';
import { getRarityColor, getRarityGlow } from '@/lib/gamification';

interface BadgeUnlockAnimationProps {
  badge: BadgeDefinition | null;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function BadgeUnlockAnimation({
  badge,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: BadgeUnlockAnimationProps) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowParticles(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else {
      setShowParticles(false);
    }
  }, [isVisible, autoClose, autoCloseDelay, onClose]);

  if (!badge) return null;

  const rarityColor = getRarityColor(badge.rarity);
  const rarityGlow = getRarityGlow(badge.rarity);
  const isEpic = badge.rarity === 'epic' || badge.rarity === 'legendary';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Screen shake for epic+ */}
          {isEpic && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                x: [0, -3, 3, -2, 2, 0],
                y: [0, 2, -2, 3, -3, 0],
              }}
              transition={{ duration: 0.4, delay: 0.3 }}
            />
          )}

          {/* Particles */}
          {showParticles && <CelebrationParticles color={rarityColor} count={isEpic ? 30 : 15} />}

          {/* Card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm"
          >
            {/* Glow behind card */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
              style={{ backgroundColor: rarityColor }}
            />

            <div
              className="relative rounded-3xl bg-slate-900/95 border-2 p-8 text-center overflow-hidden"
              style={{
                borderColor: rarityColor,
                boxShadow: `${rarityGlow}, 0 0 60px ${rarityColor}20`,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 transition-colors z-10"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              {/* Badge Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
                className="relative mx-auto w-24 h-24 mb-4"
              >
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: rarityColor }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {/* Decorative dots on ring */}
                  {[0, 90, 180, 270].map(angle => (
                    <div
                      key={angle}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: rarityColor,
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${angle}deg) translateY(-46px)`,
                        marginLeft: '-4px',
                        marginTop: '-4px',
                      }}
                    />
                  ))}
                </motion.div>

                {/* Inner badge */}
                <div
                  className="absolute inset-3 rounded-full flex items-center justify-center text-4xl"
                  style={{
                    background: `radial-gradient(circle, ${rarityColor}30, ${rarityColor}10)`,
                  }}
                >
                  {badge.icon}
                </div>

                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: rarityColor }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Rarity badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: `${rarityColor}20`, border: `1px solid ${rarityColor}40` }}
              >
                <Star className="w-3 h-3" style={{ color: rarityColor }} />
                <span className="text-xs font-semibold capitalize" style={{ color: rarityColor }}>
                  {badge.rarity}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {badge.name}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-slate-400 mb-6"
              >
                {badge.description}
              </motion.p>

              {/* Rewards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-4"
              >
                {badge.gemReward > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Gem className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-400">+{badge.gemReward}</span>
                  </div>
                )}
                {badge.xpReward > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">+{badge.xpReward} XP</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══ Celebration Particles ═══

function CelebrationParticles({ color, count }: { color: string; count: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 150 + Math.random() * 200;
        const size = 3 + Math.random() * 6;
        const duration = 1 + Math.random() * 1.5;
        const delay = Math.random() * 0.5;

        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration, delay, ease: 'easeOut' }}
          />
        );
      })}

      {/* Sparkle stars */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{
            duration: 1.5,
            delay: 0.3 + i * 0.1,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <Star className="w-4 h-4" style={{ color }} />
        </motion.div>
      ))}
    </div>
  );
}
