// ════════════════════════════════════════════════════════════════
// STORY — Phase 10.4: Cross-Lab Story Campaigns
// ════════════════════════════════════════════════════════════════
// 5-chapter branching narratives with Sparky, spanning multiple labs.
// R5: DESIGN.md dashboard recipe — BlurText h1, poetic subtitle,
// shared Sparky empty state.

'use client';

import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import BlurText from '@/components/bits/BlurText';
import { NoProfileEmptyState } from '@/components/dashboard/NoProfileEmptyState';
import { StoryHub } from '@/components/story';

export default function StoryPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';

  if (!childId) {
    return <NoProfileEmptyState context="start the adventure" />;
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-6 h-6" style={{ color: '#4F6EF7' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Story Mode" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Choose your path with Sparky — the ending is yours to shape.
        </p>
      </motion.div>

      <StoryHub childId={childId} />
    </div>
  );
}
