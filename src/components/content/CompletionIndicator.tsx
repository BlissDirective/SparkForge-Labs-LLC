'use client';

import { motion } from 'framer-motion';
import { Check, Trophy } from 'lucide-react';

interface CompletionIndicatorProps {
  type: 'check' | 'score' | 'trophy';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function CompletionIndicator({
  type,
  score,
  size = 'md',
  color = '#10B981',
}: CompletionIndicatorProps) {
  const sizes = { sm: 24, md: 36, lg: 48 };
  const dim = sizes[size];

  if (type === 'check') {
    return (
      <motion.div
        className="rounded-full flex items-center justify-center"
        style={{ width: dim, height: dim, backgroundColor: `${color}20` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Check style={{ color, width: dim * 0.5, height: dim * 0.5 }} />
        </motion.div>
      </motion.div>
    );
  }

  if (type === 'score' && score !== undefined) {
    const radius = dim * 0.38;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
          />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={score >= 70 ? '#10B981' : '#F97316'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: dim * 0.25 }}
          >
            {score}%
          </span>
        </div>
      </div>
    );
  }

  if (type === 'trophy') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
      >
        <Trophy style={{ color: '#F59E0B', width: dim, height: dim }} />
      </motion.div>
    );
  }

  return null;
}
