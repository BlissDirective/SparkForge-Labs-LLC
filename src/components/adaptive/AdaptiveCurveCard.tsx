'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Gauge } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFBadge } from '@/components/ui/SFBadge';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import { describeLevel, type DifficultyLevel } from '@/lib/adaptive/AdaptiveEngine';
import { useAdaptive } from '@/hooks/useAdaptive';

const LEVEL_COLOR: Record<DifficultyLevel, string> = {
  easy: '#2ECC71', medium: '#FFD93D', hard: '#FF6B35', expert: '#E945F5',
};

/** Tiny SVG sparkline of the performance learning curve. */
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) {
    return <div className="h-8 flex items-center text-[10px]" style={{ color: '#A8AEC2' }}>Not enough data yet</div>;
  }
  const w = 120, h = 32, pad = 2;
  const max = 1, min = 0;
  const stepX = (w - pad * 2) / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((p - min) / (max - min)) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Parent-dashboard learning-curve visualization. One row per lab the child
 * has played adaptively, showing current difficulty + a performance trend.
 */
export function AdaptiveCurveCard({ childId }: { childId: string }) {
  const { labs, isLoading } = useAdaptive(childId);

  if (isLoading) return null;
  if (labs.length === 0) {
    return (
      <SFCard variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-5 h-5" style={{ color: '#4F6EF7' }} />
          <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Learning Curve</h2>
        </div>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          As your child plays, difficulty adapts to their performance and a learning curve appears here.
        </p>
      </SFCard>
    );
  }

  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-5 h-5" style={{ color: '#4F6EF7' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Learning Curve</h2>
        <span className="ml-auto text-xs" style={{ color: '#8C94AC' }}>Difficulty auto-adapts to performance</span>
      </div>

      <div className="space-y-2">
        {labs.sort((a, b) => a.labId - b.labId).map((lab, i) => {
          const color = LAB_COLORS[lab.labId] || '#4F6EF7';
          const TrendIcon = lab.trend === 'up' ? TrendingUp : lab.trend === 'down' ? TrendingDown : Minus;
          const trendColor = lab.trend === 'up' ? '#2ECC71' : lab.trend === 'down' ? '#FF6B35' : '#8C94AC';
          return (
            <motion.div key={lab.labId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `${color}1A`, color }}>
                {lab.labId}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>{LAB_NAMES[lab.labId] ?? `Lab ${lab.labId}`}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <SFBadge variant="custom" size="sm" style={{ backgroundColor: `${LEVEL_COLOR[lab.level]}1A`, color: LEVEL_COLOR[lab.level] }}>
                    {lab.level}
                  </SFBadge>
                  <span className="text-[10px]" style={{ color: '#8C94AC' }}>{describeLevel(lab.level)}</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <Sparkline points={lab.history.map((p) => p.performance)} color={color} />
                <TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </SFCard>
  );
}

export default AdaptiveCurveCard;
