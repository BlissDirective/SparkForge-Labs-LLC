'use client';

import { motion } from 'motion/react';
import { Star, TrendingUp } from 'lucide-react';
import ShinyText from './ShinyText';

interface SFCelebrationCardProps {
  title: string;
  xpEarned: number;
  starsEarned: number;
  subtitle?: string;
}

export function SFCelebrationCard({ title, xpEarned, starsEarned, subtitle }: SFCelebrationCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="relative overflow-hidden rounded-sf-xl p-6 text-center"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF, #F8FAFF)',
        boxShadow: '0 8px 32px rgba(79,110,247,0.15), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(79,110,247,0.1)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #E945F5, #4F6EF7, #2ECC71)' }} />

      <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
        <ShinyText text={title} speed={4} />
      </h3>
      {subtitle && <p className="text-sm mb-4" style={{ color: '#8C94AC' }}>{subtitle}</p>}

      <div className="flex items-center justify-center gap-2 my-4">
        {[1, 2, 3].map((s) => (
          <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + s * 0.1, type: 'spring' }}>
            <Star className="w-8 h-8" style={{ color: s <= starsEarned ? '#FFD93D' : '#EEF2FA', fill: s <= starsEarned ? '#FFD93D' : 'none' }} />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sf-primary font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        <TrendingUp className="w-6 h-6" />
        +{xpEarned} XP
      </div>
    </motion.div>
  );
}
