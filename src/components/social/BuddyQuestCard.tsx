'use client';

import { motion } from 'motion/react';
import { Users, Check } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import {
  isBuddyQuestComplete,
  buddyQuestProgressPercent,
  type BuddyQuest,
} from '@/lib/social/SocialEngine';

interface BuddyQuestCardProps {
  quest: BuddyQuest;
  buddyName: string;
  index?: number;
}

export function BuddyQuestCard({ quest, buddyName, index = 0 }: BuddyQuestCardProps) {
  const complete = isBuddyQuestComplete(quest);
  const pct = buddyQuestProgressPercent(quest);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <SFCard variant={complete ? 'gradient' : 'default'} className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'rgba(233,69,245,0.1)' }}
          >
            {quest.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
                {quest.title}
              </h4>
              {complete && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(46,204,113,0.15)', color: '#2ECC71' }}>
                  <Check className="w-3 h-3" /> Done
                </span>
              )}
            </div>
            <p className="text-xs mb-2" style={{ color: '#8C94AC' }}>
              {quest.description}
            </p>

            <SFProgressBar
              value={pct}
              max={100}
              variant="custom"
              color="linear-gradient(90deg, #E945F5, #4F6EF7)"
              size="sm"
            />

            <div className="flex items-center justify-between mt-2 text-[11px]" style={{ color: '#5A6078' }}>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> You: {Math.min(quest.myProgress, quest.requirementCount)}/{quest.requirementCount}
              </span>
              <span>{buddyName}: {Math.min(quest.buddyProgress, quest.requirementCount)}/{quest.requirementCount}</span>
              <span className="font-bold" style={{ color: '#FF6B35' }}>+{quest.xpReward} XP</span>
            </div>
          </div>
        </div>
      </SFCard>
    </motion.div>
  );
}

export default BuddyQuestCard;
