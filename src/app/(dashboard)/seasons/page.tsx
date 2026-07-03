// ════════════════════════════════════════════════════════════════
// SEASONS — Phase 9: Seasonal Content Engine
// ════════════════════════════════════════════════════════════════
// Limited-time themed events: seasonal quest lines, a seasonal shop
// with event-only currency, and a grand-prize completion tracker.
// R5: DESIGN.md dashboard recipe — BlurText h1, poetic subtitle,
// shared Sparky empty state.

'use client';

import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { useActiveChild } from '@/hooks/useChildren';
import BlurText from '@/components/bits/BlurText';
import { NoProfileEmptyState } from '@/components/dashboard/NoProfileEmptyState';
import { SeasonHub } from '@/components/seasons';

export default function SeasonsPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';

  if (!childId) {
    return <NoProfileEmptyState context="join the seasonal event" />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-6 h-6" style={{ color: '#FFB627' }} aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <BlurText text="Seasonal Event" />
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#52586E' }}>
          Something special is happening — for a little while.
        </p>
      </motion.div>

      <SeasonHub childId={childId} />
    </div>
  );
}
