'use client';

import { motion } from 'motion/react';
import { SFCard } from '@/components/ui/SFCard';
import { BUDDY_BADGES, type BuddyBadgeTier } from '@/lib/social/SocialEngine';

interface BuddyBadgesProps {
  /** Ids of badges already earned together. */
  earnedIds?: string[];
}

const TIER_COLOR: Record<BuddyBadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#A8B0C0',
  gold: '#FFD93D',
};

export function BuddyBadges({ earnedIds = [] }: BuddyBadgesProps) {
  const earned = new Set(earnedIds);

  return (
    <SFCard variant="elevated" className="p-5">
      <h3 className="text-base font-bold mb-1" style={{ color: '#1A1D2B' }}>
        Buddy Badges
      </h3>
      <p className="text-xs mb-4" style={{ color: '#8C94AC' }}>
        Earn these together with your buddies!
      </p>

      <div className="grid grid-cols-1 gap-2">
        {BUDDY_BADGES.map((badge, i) => {
          const isEarned = earned.has(badge.id);
          const color = TIER_COLOR[badge.tier];
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{
                background: isEarned ? `${color}14` : '#F7F8FC',
                opacity: isEarned ? 1 : 0.7,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                style={{ background: isEarned ? `${color}22` : '#EEF0F8', filter: isEarned ? 'none' : 'grayscale(0.6)' }}
              >
                {badge.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{badge.title}</p>
                <p className="text-[11px]" style={{ color: '#8C94AC' }}>{badge.description}</p>
              </div>
              {isEarned && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
                  Earned
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </SFCard>
  );
}

export default BuddyBadges;
