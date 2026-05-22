'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Sparkles } from 'lucide-react';
import type { GameResult } from '@/types/game';
import confetti from 'canvas-confetti';

interface CelebrationOverlayProps {
  result: GameResult;
  onDismiss: () => void;
}

export function CelebrationOverlay({ result, onDismiss }: CelebrationOverlayProps) {
  const [show, setShow] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (result.starsEarned >= 2) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#E945F5', '#4F6EF7', '#FFD93D', '#2ECC71'] });
    }
    const timer = setTimeout(() => setCount(result.xpEarned), 300);
    return () => clearTimeout(timer);
  }, [result]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleDismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-sf-xl shadow-sf-xl p-8 text-center overflow-hidden"
          >
            <button onClick={handleDismiss} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-5 h-5" style={{ color: '#8C94AC' }} />
            </button>

            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#E945F5' }} />

            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
              Level Complete!
            </h2>

            {/* Stars */}
            <div className="flex items-center justify-center gap-3 my-6">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + s * 0.15, type: 'spring' }}
                >
                  <Star
                    className="w-10 h-10"
                    style={{ color: s <= result.starsEarned ? '#FFD93D' : '#EEF2FA', fill: s <= result.starsEarned ? '#FFD93D' : 'transparent' }}
                  />
                </motion.div>
              ))}
            </div>

            {/* XP Counter */}
            <div className="mb-6">
              <p className="text-sm mb-1" style={{ color: '#8C94AC' }}>XP Earned</p>
              <motion.p
                className="text-5xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#4F6EF7' }}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                +{count}
              </motion.p>
            </div>

            {/* Score */}
            <p className="text-sm mb-6" style={{ color: '#52586E' }}>
              Score: {result.score} / {result.maxScore}
              {result.accuracy && ` · ${Math.round(result.accuracy)}% accuracy`}
            </p>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-sf-full font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #4F6EF7, #E945F5)', boxShadow: '0 4px 16px rgba(79,110,247,0.3)' }}
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
