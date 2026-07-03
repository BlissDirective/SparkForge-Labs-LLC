// ════════════════════════════════════════════════════════════════
// MASTERY — Phase 10.2: Mastery Path System
// ════════════════════════════════════════════════════════════════
// Topic mastery trees with prerequisites, mastery certificates, and
// Expert Mode unlocks per mastered lab. R5: DESIGN.md dashboard
// recipe — BlurText h1, poetic subtitle, shared Sparky empty state.

'use client';

import { motion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import BlurText from '@/components/bits/BlurText';
import { NoProfileEmptyState } from '@/components/dashboard/NoProfileEmptyState';
import { MasteryTree } from '@/components/mastery';

export default function MasteryPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';

  if (!childId) {
    return <NoProfileEmptyState context="view their mastery paths" />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-6 h-6" style={{ color: '#FF6B35' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Mastery Paths" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Climb from first spark to full mastery, one lab at a time.
        </p>
      </motion.div>

      <MasteryTree childId={childId} />
    </div>
  );
}
