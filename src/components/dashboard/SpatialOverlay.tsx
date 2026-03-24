'use client';

// ════════════════════════════════════════════════════
// SpatialOverlay — HTML Overlay for Spatial Dashboard
// ════════════════════════════════════════════════════
// Enhancement 1.1: Glassmorphic info panels that overlay the 3D scene.
// Shows: focused lab info, quick actions, navigation hints.
// Transparent + pointer-events-none except for interactive elements.

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCockpitStore } from '@/stores/cockpitStore';
import { LABS } from '@/types';

interface SpatialOverlayProps {
  labCompletions?: Record<number, number>;
}

export function SpatialOverlay({ labCompletions = {} }: SpatialOverlayProps) {
  const router = useRouter();
  // Critical Fix #4: Individual selectors to avoid full-store re-renders
  const focusedLabId = useCockpitStore((s) => s.focusedLabId);
  const spatialView = useCockpitStore((s) => s.spatialView);
  const returnToOverview = useCockpitStore((s) => s.returnToOverview);

  const focusedLab = focusedLabId ? LABS.find((l) => l.id === focusedLabId) : null;
  const completion = focusedLabId ? labCompletions[focusedLabId] ?? 0 : 0;

  const handleEnterLab = useCallback(() => {
    if (focusedLabId) {
      router.push(`/labs/${focusedLabId}`);
    }
  }, [focusedLabId, router]);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* Top-left: Station title */}
      <div className="absolute top-6 left-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-neon-blue animate-glow-pulse" />
          <span className="font-display text-xs tracking-[0.3em] uppercase text-white/40">
            Command Bridge
          </span>
        </motion.div>
      </div>

      {/* Bottom: Navigation hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 text-[10px] font-mono text-white/25"
        >
          <span>← → Navigate</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Enter: Open Lab</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Esc: Overview</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Click: Focus</span>
        </motion.div>
      </div>

      {/* Focused Lab Info Panel */}
      <AnimatePresence>
        {focusedLab && spatialView === 'lab-focus' && (
          <motion.div
            key="lab-info"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-auto"
          >
            <div
              className="w-72 rounded-xl border backdrop-blur-xl p-5"
              style={{
                background: 'rgba(17, 17, 24, 0.85)',
                borderColor: `${focusedLab.tint}30`,
                boxShadow: `0 0 30px ${focusedLab.tint}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              {/* Lab header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{focusedLab.icon}</span>
                <div>
                  <h3
                    className="font-display text-sm font-bold"
                    style={{ color: focusedLab.tint }}
                  >
                    {focusedLab.title}
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                    {focusedLab.subtitle}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-white/60 font-body mb-4 leading-relaxed">
                {focusedLab.description}
              </p>

              {/* Completion bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-white/40 font-mono">PROGRESS</span>
                  <span
                    className="font-data"
                    style={{ color: focusedLab.tint }}
                  >
                    {Math.round(completion * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: focusedLab.tint }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completion * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Games list */}
              <div className="mb-4">
                <p className="text-[10px] text-white/30 font-mono uppercase mb-2">
                  {focusedLab.games.length} Games
                </p>
                <div className="space-y-1.5">
                  {focusedLab.games.slice(0, 3).map((game) => (
                    <div
                      key={game.slug}
                      className="flex items-center gap-2 text-xs text-white/50"
                    >
                      <span className="text-sm">{game.emoji}</span>
                      <span className="font-body truncate">{game.title}</span>
                      <span className="ml-auto text-[9px] font-data" style={{ color: focusedLab.tint }}>
                        {game.xpReward}XP
                      </span>
                    </div>
                  ))}
                  {focusedLab.games.length > 3 && (
                    <p className="text-[10px] text-white/20 font-mono">
                      +{focusedLab.games.length - 3} more
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleEnterLab}
                  className="flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${focusedLab.tint}, ${focusedLab.tint}80)`,
                    color: '#000',
                  }}
                  aria-label={`Enter ${focusedLab.title}`}
                >
                  Enter Lab
                </button>
                <button
                  onClick={returnToOverview}
                  className="px-3 py-2 rounded-lg text-xs font-mono text-white/50 border border-white/10 hover:border-white/20 transition-colors"
                  aria-label="Return to overview"
                >
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick-access console indicators (corner badges) */}
      <div className="absolute bottom-16 left-6 flex flex-col gap-2 pointer-events-auto">
        {[
          { icon: '⚡', label: 'XP', color: '#00BBFF' },
          { icon: '🏅', label: 'Badges', color: '#FFAA44' },
          { icon: '🔥', label: 'Streak', color: '#FF6644' },
          { icon: '📊', label: 'Progress', color: '#00FF88' },
        ].map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.1, x: 4 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-colors"
            style={{
              background: 'rgba(17, 17, 24, 0.7)',
              borderColor: `${item.color}20`,
              color: `${item.color}80`,
            }}
            aria-label={`View ${item.label}`}
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
