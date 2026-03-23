'use client';

import { useChildStore } from '@/stores/childStore';
import { motion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/animations';

// Home Dashboard — Placeholder (replaced in Stage 4)

export default function HomePage() {
  const { activeChild } = useChildStore();

  if (!activeChild) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50 font-body">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div
        variants={staggerItem}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Hey {activeChild.display_name}!
          </h1>
          <p className="font-body text-white/40 text-sm mt-1">
            Level {activeChild.level} · {activeChild.level_title}
          </p>
        </div>
        {activeChild.streak_count > 0 && (
          <motion.div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-orange/10 border border-spark-orange/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-lg">🔥</span>
            <span className="font-display font-bold text-spark-orange text-sm">
              {activeChild.streak_count}
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Total XP',
            value: activeChild.xp.toLocaleString(),
            icon: '✨',
          },
          { label: 'Level', value: activeChild.level, icon: '📊' },
          {
            label: 'Streak',
            value: `${activeChild.streak_count} days`,
            icon: '🔥',
          },
          {
            label: 'Coins',
            value: activeChild.spark_coins.toLocaleString(),
            icon: '🪙',
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="font-display text-xl font-bold text-white">
              {stat.value}
            </p>
            <p className="font-body text-white/40 text-xs">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-white mb-2">
          🔬 Continue Learning
        </h2>
        <p className="font-body text-white/40 text-sm">
          Lab map and content will be built in Stage 4.
        </p>
      </motion.div>
    </motion.div>
  );
}
