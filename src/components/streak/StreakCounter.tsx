// ════════════════════════════════════════════════════
// StreakCounter — Visual Streak Display with Flame
// Animated flame that grows with streak count
// ════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Shield, Zap, AlertTriangle } from 'lucide-react';
import type { StreakMilestone } from '@/lib/streak/StreakEngine';
import { getFlameConfig } from '@/lib/gamification';
import type { FlameConfig } from '@/lib/gamification';

interface StreakCounterProps {
  streakCount: number;
  longestStreak: number;
  freezesEquipped: number;
  isAtRisk: boolean;
  nextMilestone: StreakMilestone | null;
  daysUntilMilestone: number;
  onClick?: () => void;
  compact?: boolean;
}

export function StreakCounter({
  streakCount,
  longestStreak,
  freezesEquipped,
  isAtRisk,
  nextMilestone,
  daysUntilMilestone,
  onClick,
  compact = false,
}: StreakCounterProps) {
  const [flameConfig, setFlameConfig] = useState<FlameConfig>(getFlameConfig(streakCount));
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    setFlameConfig(getFlameConfig(streakCount));
    // Pulse animation when streak increases
    setShowPulse(true);
    const timer = setTimeout(() => setShowPulse(false), 2000);
    return () => clearTimeout(timer);
  }, [streakCount]);

  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          ${isAtRisk ? 'bg-red-500/20 border border-red-500/40' : 'bg-orange-500/10 border border-orange-500/20'}
          transition-colors cursor-pointer
        `}
      >
        <motion.div
          animate={isAtRisk ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {isAtRisk ? (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          ) : (
            <Flame className="w-4 h-4 text-orange-400" />
          )}
        </motion.div>
        <span className={`font-bold text-sm ${isAtRisk ? 'text-red-400' : 'text-orange-300'}`}>
          {streakCount}
        </span>
        {freezesEquipped > 0 && (
          <Shield className="w-3 h-3 text-cyan-400" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      className={`
        relative rounded-2xl p-6 cursor-pointer overflow-hidden
        ${isAtRisk
          ? 'bg-gradient-to-br from-red-950/60 to-orange-950/40 border border-red-500/30'
          : 'bg-gradient-to-br from-orange-950/60 to-yellow-950/40 border border-orange-500/20'
        }
        transition-all duration-300
      `}
    >
      {/* Animated flame background */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <FlameBackground config={flameConfig} streakCount={streakCount} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={showPulse ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Flame
                className="w-10 h-10"
                style={{ color: flameConfig.coreColor }}
              />
              {/* Flame glow */}
              <div
                className="absolute inset-0 blur-xl rounded-full"
                style={{ backgroundColor: flameConfig.glowColor }}
              />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-white">{streakCount}</h3>
              <p className="text-xs text-white/60">
                {streakCount === 1 ? 'Day Streak' : 'Day Streak'}
              </p>
            </div>
          </div>

          {/* Freeze indicator */}
          {freezesEquipped > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-300">{freezesEquipped}</span>
            </motion.div>
          )}
        </div>

        {/* Risk warning */}
        <AnimatePresence>
          {isAtRisk && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-3 py-2 bg-red-500/20 rounded-lg border border-red-500/30"
            >
              <p className="text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Streak at risk! Play today to keep it alive.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestone progress */}
        {nextMilestone && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Next: {nextMilestone.description}</span>
              <span className="text-white/50">{daysUntilMilestone}d</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${flameConfig.coreColor}, ${flameConfig.outerColor})`,
                }}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(5, (1 - daysUntilMilestone / nextMilestone.day) * 100)}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Longest streak badge */}
        {longestStreak > streakCount && (
          <p className="mt-3 text-xs text-white/60 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Best: {longestStreak} days
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ═══ Flame Background Animation ═══

function FlameBackground({ config, streakCount }: { config: FlameConfig; streakCount: number }) {
  const layers = Array.from({ length: config.layers }, (_, i) => i);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none">
      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: config.glowColor }}
      />

      {/* Flame layers */}
      {layers.map(i => (
        <motion.div
          key={i}
          className="absolute bottom-0 left-1/2 rounded-full"
          style={{
            width: `${60 + i * 20}%`,
            height: `${40 + i * 15}%`,
            marginLeft: `-${(60 + i * 20) / 2}%`,
            background: `radial-gradient(ellipse at center bottom, ${config.coreColor}40, ${config.outerColor}20, transparent 70%)`,
            filter: `blur(${8 - i * 2}px)`,
          }}
          animate={{
            scaleY: [1, 1.05 + i * 0.02, 1],
            scaleX: [1, 0.98 + i * 0.01, 1],
            opacity: [0.4 + i * 0.1, 0.5 + i * 0.1, 0.4 + i * 0.1],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Embers for high streaks */}
      {config.hasEmbers && <EmberParticles count={6} color={config.coreColor} />}

      {/* Orbits for very high streaks */}
      {config.hasOrbits && <OrbitParticles count={3} color={config.outerColor} />}
    </div>
  );
}

function EmberParticles({ count, color }: { count: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`ember-${i}`}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            backgroundColor: color,
            left: `${20 + Math.random() * 60}%`,
            bottom: '10%',
          }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, (Math.random() - 0.5) * 30],
            opacity: [0.8, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
}

function OrbitParticles({ count, color }: { count: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            backgroundColor: color,
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: [0, Math.cos(i * (Math.PI * 2 / count)) * 40, 0],
            y: [0, Math.sin(i * (Math.PI * 2 / count)) * 40, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}
