'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import GradientText from './GradientText';

interface SFXPRevealProps {
  from?: number;
  to: number;
  duration?: number;
  label?: string;
}

export function SFXPReveal({ from = 0, to, duration = 1500, label = 'XP Earned' }: SFXPRevealProps) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [from, to, duration]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-center"
    >
      <p className="text-sm mb-1" style={{ color: '#8C94AC' }}>{label}</p>
      <div className="flex items-center justify-center gap-2">
        <Zap className="w-6 h-6" style={{ color: '#FFD93D' }} />
        <span className="text-4xl font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
          <GradientText from="#4F6EF7" to="#E945F5">+{value}</GradientText>
        </span>
      </div>
    </motion.div>
  );
}
