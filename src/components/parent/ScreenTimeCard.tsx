// ════════════════════════════════════════════════════════════════
// SCREEN TIME CARD — Visual Time Limit Controls (Phase 5)
// ════════════════════════════════════════════════════════════════
// Interactive circular gauge showing daily screen time usage
// with a slider to adjust time limits per child. Syncs with
// parentStore.updateChildTimeLimit for real-time updates.

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Clock, Plus, Minus, AlertCircle } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { apiFetch, csrfHeader } from '@/lib/api';

interface ScreenTimeCardProps {
  childId: string;
  childName: string;
  timeUsedMinutes: number;
  timeLimitMinutes: number | null;
  onUpdateLimit: (minutes: number | null) => void;
  isLoading?: boolean;
}

const PRESET_LIMITS = [30, 60, 90, 120, 180, null]; // null = unlimited

export default function ScreenTimeCard({
  childId,
  childName,
  timeUsedMinutes,
  timeLimitMinutes,
  onUpdateLimit,
  isLoading,
}: ScreenTimeCardProps) {
  const [localLimit, setLocalLimit] = useState(timeLimitMinutes);
  const limit = localLimit ?? 180; // Default to 3h if unlimited
  const percentUsed = Math.min(100, (timeUsedMinutes / Math.max(limit, 1)) * 100);

  // Gauge color based on usage
  const gaugeColor = percentUsed >= 90 ? '#EF4444' : percentUsed >= 70 ? '#FF6B35' : '#4F6EF7';

  /** Persist time limit change to server and update local state. */
  const persistLimit = useCallback(async (newLimit: number | null) => {
    setLocalLimit(newLimit);
    onUpdateLimit(newLimit);
    try {
      await apiFetch(`/api/children/${childId}`, {
        method: 'PATCH',
        body: JSON.stringify({ dailyTimeLimitMinutes: newLimit }),
      });
    } catch {
      // Silently fail — local state already updated for responsive UX.
      // The next dashboard refresh will sync with server truth.
    }
  }, [childId, onUpdateLimit]);

  const handleAdjust = useCallback((delta: number) => {
    const newLimit = Math.max(15, Math.min(300, (localLimit ?? 180) + delta));
    persistLimit(newLimit);
  }, [localLimit, persistLimit]);

  const handlePreset = useCallback((preset: number | null) => {
    persistLimit(preset);
  }, [persistLimit]);

  // SVG gauge
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentUsed / 100) * circumference;

  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5" style={{ color: '#4F6EF7' }} />
        <h3 className="text-base font-bold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
          Screen Time
        </h3>
        {percentUsed >= 90 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto"
          >
            <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
          </motion.div>
        )}
      </div>

      <p className="text-sm mb-4" style={{ color: '#5A6078' }}>
        Manage daily play time for <strong style={{ color: '#1A1D2B' }}>{childName}</strong>
      </p>

      {/* Circular gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#EEF0F8"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
              {Math.round(percentUsed)}%
            </span>
            <span className="text-[10px]" style={{ color: '#8C94AC' }}>used</span>
          </div>
        </div>
      </div>

      {/* Time display */}
      <div className="text-center mb-4">
        <p className="text-sm" style={{ color: '#5A6078' }}>
          <strong style={{ color: gaugeColor }}>{timeUsedMinutes}m</strong>
          {' '}used of{' '}
          <strong style={{ color: '#1A1D2B' }}>
            {localLimit === null ? '∞' : `${localLimit}m`}
          </strong>
          {localLimit === null && ' (unlimited)'}
        </p>
        {percentUsed >= 90 && (
          <p className="text-xs mt-1 font-medium" style={{ color: '#EF4444' }}>
            Almost at daily limit!
          </p>
        )}
      </div>

      {/* Adjust buttons */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <SFButton
          variant="outline"
          size="sm"
          onClick={() => handleAdjust(-15)}
          disabled={isLoading || (localLimit ?? 180) <= 15}
          aria-label="Decrease time limit"
        >
          <Minus className="w-4 h-4" />
        </SFButton>
        <span className="text-sm font-bold min-w-[60px] text-center" style={{ color: '#1A1D2B' }}>
          {localLimit === null ? 'Unlimited' : `${localLimit}m`}
        </span>
        <SFButton
          variant="outline"
          size="sm"
          onClick={() => handleAdjust(15)}
          disabled={isLoading || (localLimit ?? 0) >= 300}
          aria-label="Increase time limit"
        >
          <Plus className="w-4 h-4" />
        </SFButton>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {PRESET_LIMITS.map((preset) => (
          <button
            key={preset ?? 'unlimited'}
            onClick={() => handlePreset(preset)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                       ${localLimit === preset
                         ? 'shadow-md'
                         : 'hover:bg-gray-100'
                       }`}
            style={{
              background: localLimit === preset ? '#4F6EF7' : '#F0F1F8',
              color: localLimit === preset ? '#FFFFFF' : '#5A6078',
              focusVisibleRingColor: '#4F6EF7',
            }}
          >
            {preset === null ? 'Unlimited' : `${preset}m`}
          </button>
        ))}
      </div>
    </SFCard>
  );
}
