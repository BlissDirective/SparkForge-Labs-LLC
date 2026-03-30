// ════════════════════════════════════════════════════
// STREAK FIRE — Progressive intensity overlay
// Shows escalating visual effects for consecutive
// correct answers. Sits behind game content.
// ════════════════════════════════════════════════════
'use client';

import { motion, AnimatePresence } from 'motion/react';

interface StreakFireProps {
  streak: number;
  worldColor: string;
}

export function StreakFire({ streak, worldColor }: StreakFireProps) {
  if (streak < 2) return null;

  const intensity = Math.min(1, streak / 10);
  const particleCount = Math.min(20, streak * 3);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
      {/* Edge glow — intensifies with streak */}
      <AnimatePresence>
        {streak >= 3 && (
          <motion.div
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 ${30 + streak * 8}px ${worldColor}${Math.round(intensity * 40).toString(16).padStart(2, '0')}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Rising spark particles */}
      {streak >= 2 && Array.from({ length: particleCount }, (_, i) => (
        <motion.div
          key={`spark-${streak}-${i}`}
          className="absolute rounded-full"
          style={{
            width: (i * 3 % 3) + 1,
            height: (i * 3 % 3) + 1,
            left: `${(i * 37 + 13) % 100}%`,
            bottom: 0,
            backgroundColor: streak >= 7 ? '#EF4444' : streak >= 5 ? '#F97316' : worldColor,
          }}
          initial={{ y: 0, opacity: 0.8 }}
          animate={{
            y: -(100 + (i * 23 % 200)),
            opacity: 0,
            x: ((i * 17 % 40) - 20),
          }}
          transition={{
            duration: 1 + (i % 2) * 0.5,
            delay: (i * 0.05) % 0.5,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Screen edge fire for 7+ streak */}
      {streak >= 7 && (
        <>
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: 'linear-gradient(to top, rgba(239,68,68,0.15), transparent)',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <span className="font-display text-xs font-black text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
              {'\ud83d\udd25'} UNSTOPPABLE {'\ud83d\udd25'}
            </span>
          </motion.div>
        </>
      )}
    </div>
  );
}
