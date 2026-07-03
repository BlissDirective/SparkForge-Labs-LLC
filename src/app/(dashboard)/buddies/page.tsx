// ════════════════════════════════════════════════════════════════
// STUDY BUDDIES — Phase 8: COPPA-Safe Social Features
// ════════════════════════════════════════════════════════════════
// Parent-approved friends, buddy quests, preset-only safe messages,
// and shared achievements. No real names, photos, or free-form chat.
// R5: DESIGN.md dashboard recipe — BlurText h1, poetic subtitle,
// shared Sparky empty state.

'use client';

import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import BlurText from '@/components/bits/BlurText';
import { NoProfileEmptyState } from '@/components/dashboard/NoProfileEmptyState';
import { StudyBuddiesPanel } from '@/components/social';

export default function BuddiesPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const childName = child?.display_name ?? 'Explorer';

  if (!childId) {
    return <NoProfileEmptyState context="find study buddies" />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6" style={{ color: '#4F6EF7' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Study Buddies" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Learning is better with a friend beside you — safe, private, and parent-approved.
        </p>
      </motion.div>

      <StudyBuddiesPanel childId={childId} childName={childName} />
    </div>
  );
}
