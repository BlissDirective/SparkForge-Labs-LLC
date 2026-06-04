'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Sparkles, Gauge, Clock } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { LAB_NAMES } from '@/config/labs';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { StrengthBand } from '@/lib/analytics/AnalyticsEngine';

const BAND_COLOR: Record<StrengthBand, string> = {
  new: '#EEF0F8', learning: '#FFD93D', strong: '#5EC8F5', mastered: '#2ECC71',
};

export function AdvancedAnalyticsCard({ childId }: { childId: string }) {
  const { data, isLoading } = useAnalytics(childId);

  if (isLoading || !data) return null;

  const TrendIcon = data.velocity.trend === 'up' ? TrendingUp : data.velocity.trend === 'down' ? TrendingDown : Minus;
  const trendColor = data.velocity.trend === 'up' ? '#2ECC71' : data.velocity.trend === 'down' ? '#FF6B35' : '#8C94AC';

  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-5 h-5" style={{ color: '#E945F5' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Advanced Analytics</h2>
      </div>

      {/* AI-style insight */}
      <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(233,69,245,0.06)' }}>
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#E945F5' }} />
        <p className="text-sm" style={{ color: '#1A1D2B' }}>{data.insight}</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
          <p className="text-lg font-extrabold inline-flex items-center gap-1" style={{ color: '#1A1D2B' }}>
            {data.velocity.average}<TrendIcon className="w-4 h-4" style={{ color: trendColor }} />
          </p>
          <p className="text-[10px]" style={{ color: '#8C94AC' }}>XP / week</p>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
          <p className="text-lg font-extrabold" style={{ color: '#1A1D2B' }}>{data.percentile}%</p>
          <p className="text-[10px]" style={{ color: '#8C94AC' }}>percentile</p>
        </div>
        <div className="text-center p-3 rounded-xl" style={{ background: '#F7F8FC' }}>
          <p className="text-lg font-extrabold inline-flex items-center gap-1" style={{ color: '#1A1D2B' }}>
            <Clock className="w-4 h-4" style={{ color: '#FF6B35' }} />{data.timeOnTask.weeklyAvgMinutes}
          </p>
          <p className="text-[10px]" style={{ color: '#8C94AC' }}>avg min/week</p>
        </div>
      </div>

      {/* Topic strength heatmap */}
      <p className="text-xs font-bold mb-2" style={{ color: '#1A1D2B' }}>Topic Strength</p>
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1">
        {data.heatmap.map((t, i) => (
          <motion.div
            key={t.labId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-bold"
            style={{ background: BAND_COLOR[t.band], color: t.band === 'new' || t.band === 'learning' ? '#5A6078' : '#FFFFFF' }}
            title={`${LAB_NAMES[t.labId] ?? `Lab ${t.labId}`}: ${t.percent}% (${t.band})`}
          >
            {t.labId}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {(['new', 'learning', 'strong', 'mastered'] as StrengthBand[]).map((b) => (
          <span key={b} className="inline-flex items-center gap-1 text-[10px]" style={{ color: '#8C94AC' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAND_COLOR[b] }} /> {b}
          </span>
        ))}
      </div>
    </SFCard>
  );
}

export default AdvancedAnalyticsCard;
