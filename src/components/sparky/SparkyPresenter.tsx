// ════════════════════════════════════════════════════════════════════════════
// SPARKY PRESENTER — Mission & Announcement Wrapper
// ════════════════════════════════════════════════════════════════════════════
// Large Sparky with speech bubble for presenting daily missions,
// announcements, and guided prompts. Used on home page, onboarding,
// and seasonal events.
//
// Design: Transparent background, floats over page content.
// Sparky at lg (120px) or xl (192px) size with speech bubble above.

'use client';

import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SparkyCore, type SparkyExpression } from './SparkyCore';

export interface SparkyPresenterProps {
  expression?: SparkyExpression;
  message: string;
  missionType?: 'daily' | 'event' | 'onboarding' | 'streak_warning' | 'challenge';
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const MISSION_TYPE_CONFIG = {
  daily:          { label: 'Daily Mission', color: '#4F6EF7', bg: 'rgba(79,110,247,0.12)' },
  event:          { label: 'Special Event', color: '#E945F5', bg: 'rgba(233,69,245,0.12)' },
  onboarding:     { label: 'Getting Started', color: '#2ECC71', bg: 'rgba(46,204,113,0.12)' },
  streak_warning: { label: 'Streak Alert!', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)' },
  challenge:      { label: 'Challenge', color: '#FFD93D', bg: 'rgba(255,217,61,0.12)' },
};

export function SparkyPresenter({
  expression = 'happy',
  message,
  missionType = 'daily',
  actionLabel = 'Start Mission',
  onAction,
  onDismiss,
  className = '',
}: SparkyPresenterProps) {
  const typeCfg = MISSION_TYPE_CONFIG[missionType];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* ═══ Speech Bubble (above Sparky) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative max-w-[340px] sm:max-w-[420px]"
      >
        <div
          className="relative px-5 py-4 rounded-2xl rounded-bl-sm"
          style={{
            background: 'rgba(12, 16, 32, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.35), 0 0 16px ${typeCfg.color}08`,
          }}
        >
          {/* Mission type badge */}
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ background: typeCfg.bg, color: typeCfg.color }}
            >
              <Sparkles className="w-3 h-3" />
              {typeCfg.label}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors hover:bg-white/5"
                style={{ color: 'rgba(200,210,235,0.4)' }}
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-sm font-medium leading-relaxed mb-3" style={{ color: '#E8ECF4' }}>
            {message}
          </p>

          {/* Action button */}
          {onAction && (
            <motion.button
              onClick={onAction}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${typeCfg.color}, ${typeCfg.color}88)`,
                boxShadow: `0 4px 16px ${typeCfg.color}30`,
              }}
            >
              {actionLabel}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Bubble tail (CSS triangle) */}
        <div
          className="absolute -bottom-2 left-8 w-4 h-4 rotate-45"
          style={{
            background: 'rgba(12, 16, 32, 0.88)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        />
      </motion.div>

      {/* ═══ Sparky (lg size for presenter) ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      >
        <SparkyCore expression={expression} size="lg" />
      </motion.div>
    </div>
  );
}
