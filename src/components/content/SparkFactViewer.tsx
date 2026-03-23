'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { useChildStore } from '@/stores/childStore';
import { useCompleteAndReward } from '@/hooks/useGamification';
import { WORLDS } from '@/types';
import type { Content } from '@/types';
import { useState } from 'react';

export function SparkFactViewer({ content }: { content: Content }) {
  const router = useRouter();
  const { activeChild } = useChildStore();
  const completeAndReward = useCompleteAndReward();
  const [completing, setCompleting] = useState(false);

  const lab = WORLDS.find((w) => w.id === content.world);

  async function handleComplete() {
    if (!activeChild || completing) return;
    setCompleting(true);
    try {
      await completeAndReward(activeChild.id, content.id, content.xp_reward, 'spark_fact');
      setTimeout(() => router.push(`/labs/${content.world}`), 3000);
    } catch (err) {
      console.error('Failed to complete:', err);
    } finally {
      setCompleting(false);
    }
  }

  // Parse fact from content_body (remove markdown heading)
  const factText = content.content_body
    .replace(/^#\s+/, '')
    .replace(/^##\s+/, '')
    .trim();

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/labs/${content.world}`}>
        <motion.div
          className="inline-flex items-center gap-2 text-white/60 hover:text-white font-body text-sm mb-6 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to {lab?.title || `Lab ${content.world}`}
        </motion.div>
      </Link>

      <motion.div
        className="glass-card rounded-2xl p-8 md:p-10 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚡
        </motion.div>

        <span className="font-body text-xs font-semibold text-spark-orange uppercase tracking-wider">
          Spark Fact · Lab {content.world}
        </span>

        <h1 className="font-display text-xl md:text-2xl font-bold text-white mt-4 mb-6 leading-relaxed">
          {content.title}
        </h1>

        <p className="font-body text-white/70 text-base leading-relaxed mb-8 max-w-md mx-auto">
          {factText}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-spark-orange/10 mb-6">
          <Zap className="w-4 h-4 text-spark-orange" />
          <span className="font-display font-bold text-spark-orange text-sm">
            +{content.xp_reward} XP
          </span>
        </div>

        <motion.button
          onClick={handleComplete}
          disabled={completing}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-spark-orange to-spark-purple text-white font-display font-bold text-sm transition-opacity disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {completing ? 'Completing...' : 'Got It! Collect XP'}
        </motion.button>
      </motion.div>
    </div>
  );
}
