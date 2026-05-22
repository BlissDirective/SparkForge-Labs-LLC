// ════════════════════════════════════════════════════════════════
// LABS — Learning Lab Browser (Phase 3)
// ════════════════════════════════════════════════════════════════
// Kid-friendly lab discovery with progress tracking and React Bits.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FlaskConical, ChevronRight, Gamepad2, Star, Lock } from 'lucide-react';
import { LAB_NAMES, LAB_COLORS } from '@/config/labs';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { SFCard } from '@/components/ui/SFCard';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFBadge } from '@/components/ui/SFBadge';
import SpotlightCard from '@/components/bits/SpotlightCard';
import GradientText from '@/components/bits/GradientText';

const LAB_ICONS: Record<number, string> = {
  1: '\uD83E\uDD16', 2: '\uD83E\uDDE0', 3: '\uD83E\uDDEC', 4: '\uD83C\uDFA8',
  5: '\uD83D\uDD27', 6: '\u2696\uFE0F', 7: '\uD83D\uDC41\uFE0F', 8: '\uD83D\uDCAC',
  9: '\uD83D\uDCDA', 10: '\uD83D\uDD2E', 11: '\uD83C\uDFAD',
};

export default function LabsPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress, isLoading } = useAllLabsProgress(childId);

  const labs = useMemo(() => {
    return Object.entries(LAB_NAMES)
      .filter(([num]) => Number(num) <= 11)
      .map(([num, name]) => {
        const labNum = Number(num);
        const games = GAME_REGISTRY.filter((g) => g.lab === labNum);
        const progress = (labsProgress as Array<{ lab?: number; percent?: number }> | undefined)?.find(
          (p) => p.lab === labNum
        );
        return {
          num: labNum,
          name,
          color: LAB_COLORS[labNum],
          icon: LAB_ICONS[labNum] || '\uD83E\uDDE0',
          games,
          progress: progress?.percent ?? 0,
          flagshipCount: games.filter((g) => g.tier === 'flagship').length,
        };
      })
      .sort((a, b) => a.num - b.num);
  }, [labsProgress]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <GradientText from="#E945F5" to="#4F6EF7">Learning Labs</GradientText>
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          11 labs, {GAME_REGISTRY.length} games — explore topics from AI basics to advanced agent systems
        </p>
      </motion.div>

      {/* Overall Progress */}
      {child && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SFCard variant="elevated" className="flex items-center gap-4 p-4 sm:p-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(79,110,247,0.1)' }}
            >
              <FlaskConical className="w-7 h-7" style={{ color: '#4F6EF7' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold mb-1" style={{ color: '#1A1D2B' }}>Overall Progress</p>
              <SFProgressBar
                value={labs.reduce((s, l) => s + l.progress, 0) / Math.max(labs.length, 1)}
                max={100}
                variant="primary"
                showLabel
              />
            </div>
            <span className="text-2xl font-extrabold shrink-0" style={{ fontFamily: 'var(--font-display)', color: '#4F6EF7' }}>
              {Math.round(labs.reduce((s, l) => s + l.progress, 0) / Math.max(labs.length, 1))}%
            </span>
          </SFCard>
        </motion.div>
      )}

      {/* Lab Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map((lab, i) => (
          <motion.div
            key={lab.num}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Link href={`/labs/${lab.num}`}>
              <SpotlightCard
                spotlightColor={`${lab.color}15`}
                className="cursor-pointer transition-all hover:shadow-sf-lg h-full"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${lab.color}25, ${lab.color}08)`,
                        boxShadow: `0 4px 12px ${lab.color}20`,
                      }}
                    >
                      {lab.icon}
                    </div>
                    <div className="flex items-center gap-1">
                      {lab.flagshipCount > 0 && (
                        <SFBadge variant="premium" size="sm">
                          <Star className="w-3 h-3" /> {lab.flagshipCount}
                        </SFBadge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold mb-1" style={{ color: '#1A1D2B' }}>
                    Lab {lab.num}: {lab.name}
                  </h3>

                  <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: '#8C94AC' }}>
                    <span className="flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" /> {lab.games.length} games
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: '#8C94AC' }}>Progress</span>
                      <span className="font-bold" style={{ color: lab.color }}>{Math.round(lab.progress)}%</span>
                    </div>
                    <SFProgressBar value={lab.progress} max={100} variant="primary" />
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
