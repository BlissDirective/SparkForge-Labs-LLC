// ════════════════════════════════════════════════════
// GAME COMPLETE CELEBRATION — Full-screen overlay
// Confetti explosion, stats summary, badge award.
// Triggered when game.completeGame() fires.
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusTrap from 'focus-trap-react';
import { Trophy, Star, Zap, ArrowRight } from 'lucide-react';
// Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
import { ConfettiEngine } from '@/components/shared/ConfettiEngine';

interface CelebrationProps {
  show: boolean;
  score: number;
  totalRounds: number;
  roundsCompleted: number;
  xpReward: number;
  worldColor: string;
  gameTitle: string;
  badge?: { emoji: string; title: string };
  personalBest?: boolean;
  onContinue: () => void;
}

export function GameCompleteCelebration({
  show, score, totalRounds, roundsCompleted, xpReward,
  worldColor, gameTitle, badge, personalBest, onContinue,
}: CelebrationProps) {
  const [phase, setPhase] = useState<'burst' | 'stats' | 'badge'>('burst');

  // Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine
  // Palette preserves the legacy per-game worldColor + rainbow mix.
  const confettiColors = useMemo(
    () => [worldColor, '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'],
    [worldColor]
  );

  // Phase progression
  useEffect(() => {
    if (!show) { setPhase('burst'); return; }
    const t1 = setTimeout(() => setPhase('stats'), 1200);
    const t2 = badge ? setTimeout(() => setPhase('badge'), 3000) : undefined;
    return () => { clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, [show, badge]);

  const accuracy = totalRounds > 0 ? Math.round((roundsCompleted / totalRounds) * 100) : 100;
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  if (!show) return null;

  return (
    <AnimatePresence>
      {/* Phase 1 audit fix (Section 8.1): FocusTrap + Escape key dismiss */}
      <FocusTrap focusTrapOptions={{ escapeDeactivates: true, onDeactivate: onContinue, allowOutsideClick: true }}>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-complete-title"
        onKeyDown={(e) => { if (e.key === 'Escape') onContinue(); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Confetti layer — Phase 2 audit fix (Section 5.6): Consolidated ConfettiEngine */}
        <ConfettiEngine
          count={60}
          colors={confettiColors}
          duration={3000}
          show={show}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-sm w-full mx-4"
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
        >
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,25,0.95), rgba(20,20,35,0.95))',
              border: `1px solid ${worldColor}30`,
              boxShadow: `0 0 60px ${worldColor}20, 0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-[2px] rounded-2xl opacity-50"
              style={{ background: `conic-gradient(from 0deg, ${worldColor}, transparent, ${worldColor})` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative z-10">
              {/* Trophy burst */}
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
                className="mb-3"
              >
                <span className="text-6xl block">{'\ud83c\udfc6'}</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                id="game-complete-title"
                className="font-display text-2xl font-black text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Game Complete!
              </motion.h2>
              <motion.p
                className="font-body text-sm text-white/70 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {gameTitle}
              </motion.p>

              {/* Stars */}
              <motion.div
                className="flex justify-center gap-2 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                {[1, 2, 3].map(s => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: s <= stars ? 1 : 0.6, rotate: 0 }}
                    transition={{ type: 'spring', delay: 1.0 + s * 0.2 }}
                  >
                    <Star
                      className={`w-8 h-8 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-white/50'}`}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats grid */}
              <motion.div
                className="grid grid-cols-3 gap-3 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
              >
                <div className="rounded-xl p-2 bg-white/[0.03] border border-white/5">
                  <Zap className="w-4 h-4 mx-auto mb-1" style={{ color: worldColor }} />
                  <p className="font-display text-lg font-black text-white">{score}</p>
                  <p className="font-body text-2xs text-white/70">SCORE</p>
                </div>
                <div className="rounded-xl p-2 bg-white/[0.03] border border-white/5">
                  <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="font-display text-lg font-black" style={{ color: worldColor }}>{xpReward}</p>
                  <p className="font-body text-2xs text-white/70">XP EARNED</p>
                </div>
                <div className="rounded-xl p-2 bg-white/[0.03] border border-white/5">
                  <Star className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="font-display text-lg font-black text-white">{accuracy}%</p>
                  <p className="font-body text-2xs text-white/70">ACCURACY</p>
                </div>
              </motion.div>

              {/* Personal best */}
              {personalBest && (
                <motion.div
                  className="rounded-lg px-3 py-1.5 mb-3 mx-auto inline-block"
                  style={{ backgroundColor: `${worldColor}15`, border: `1px solid ${worldColor}30` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 1.8 }}
                >
                  <span className="font-display text-xs font-bold" style={{ color: worldColor }}>
                    {'\ud83c\udf89'} NEW PERSONAL BEST!
                  </span>
                </motion.div>
              )}

              {/* Badge */}
              {badge && phase === 'badge' && (
                <motion.div
                  className="rounded-xl p-3 mb-3 mx-auto max-w-[200px]"
                  style={{ backgroundColor: `${worldColor}08`, border: `1px solid ${worldColor}20` }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <span className="text-3xl block mb-1">{badge.emoji}</span>
                  <p className="font-display text-xs font-bold" style={{ color: worldColor }}>
                    Badge Earned!
                  </p>
                  <p className="font-body text-xs text-white/70">{badge.title}</p>
                </motion.div>
              )}

              {/* Continue button */}
              <motion.button
                onClick={onContinue}
                className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${worldColor}, ${worldColor}CC)` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Continue to next activity"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </FocusTrap>
    </AnimatePresence>
  );
}
