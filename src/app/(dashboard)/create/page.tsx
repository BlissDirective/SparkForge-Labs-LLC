// ════════════════════════════════════════════════════════════════
// CREATE — Phase 10.3: User-Generated Content (Create a Quiz)
// ════════════════════════════════════════════════════════════════
// COPPA-safe quiz creation from a pre-approved question bank, parent
// moderation, and a community library with ratings.
// R5: DESIGN.md dashboard recipe — BlurText h1, poetic subtitle,
// shared Sparky empty state.

'use client';

import { motion } from 'motion/react';
import { Wand2 } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import BlurText from '@/components/bits/BlurText';
import { NoProfileEmptyState } from '@/components/dashboard/NoProfileEmptyState';
import { UgcHub } from '@/components/ugc';

export default function CreatePage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';

  if (!childId) {
    return <NoProfileEmptyState context="start creating quizzes" />;
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-6 h-6" style={{ color: '#E945F5' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Create a Quiz" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Build something that&apos;s all yours, then share it with the community (after a grown-up approves).
        </p>
      </motion.div>

      <UgcHub childId={childId} />
    </div>
  );
}
