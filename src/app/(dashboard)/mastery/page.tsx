// ════════════════════════════════════════════════════════════════
// MASTERY — Phase 10.2: Mastery Path System
// ════════════════════════════════════════════════════════════════
// Topic mastery trees with prerequisites, mastery certificates, and
// Expert Mode unlocks per mastered lab.

'use client';

import { motion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useActiveChild } from '@/hooks/useChildren';
import GradientText from '@/components/bits/GradientText';
import { SFButton } from '@/components/ui/SFButton';
import { MasteryTree } from '@/components/mastery';

export default function MasteryPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';

  if (!childId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md p-8">
          <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ color: '#DAE0F0' }} />
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>Pick a profile first</h2>
          <p className="text-sm mb-6" style={{ color: '#8C94AC' }}>Choose a kid profile to view their mastery paths.</p>
          <Link href="/home"><SFButton variant="primary">Back to Home</SFButton></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="w-6 h-6" style={{ color: '#FF6B35' }} />
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <GradientText from="#FFD93D" to="#FF6B35">Mastery Paths</GradientText>
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#8C94AC' }}>Master each lab to earn certificates and unlock Expert Mode.</p>
      </motion.div>

      <MasteryTree childId={childId} />
    </div>
  );
}
