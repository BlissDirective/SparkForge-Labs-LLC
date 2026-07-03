// ════════════════════════════════════════════════════════════════
// NO-PROFILE EMPTY STATE — Shared "Pick a profile first" card (R5)
// ════════════════════════════════════════════════════════════════
// One honest empty state for every child-facing progression surface
// (mastery, seasons, story, buddies, create). DESIGN.md §8 dashboard
// recipe: white card on the light shell, Sparky doing something
// (napping until a profile wakes him), and a next-action CTA.

'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { SparkyCore } from '@/components/sparky';
import { SFButton } from '@/components/ui/SFButton';

interface NoProfileEmptyStateProps {
  /**
   * What choosing a profile unlocks, completing the sentence
   * "Choose a kid profile to …" — e.g. "view their mastery paths".
   */
  context: string;
  /** Optional full override for the body copy. */
  message?: string;
}

export function NoProfileEmptyState({ context, message }: NoProfileEmptyStateProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center w-full max-w-md p-8 rounded-sf-lg"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6E9F4',
          boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
        }}
      >
        {/* Decorative Sparky — napping until a profile is picked */}
        <div className="flex justify-center mb-4" aria-hidden="true">
          <SparkyCore expression="sleepy" pixelSize={72} showAura={false} />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
        >
          Pick a profile first
        </h2>
        <p className="text-base mb-6" style={{ color: '#52586E' }}>
          {message ?? `Sparky is napping — choose a kid profile to ${context}.`}
        </p>
        <Link href="/home" aria-label="Back to Home to pick a profile">
          <SFButton variant="primary">Back to Home</SFButton>
        </Link>
      </motion.div>
    </div>
  );
}

export default NoProfileEmptyState;
