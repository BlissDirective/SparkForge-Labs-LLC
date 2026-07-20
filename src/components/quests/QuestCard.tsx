// ════════════════════════════════════════════════════
// QuestCard — Individual Quest Display Card
// Rarity border glow, progress bar, claim button
// ════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Check, Gift, Lock, Star, Zap } from 'lucide-react';
import type { ActiveQuest, QuestRarity } from '@/lib/quests/QuestEngine';
import { RARITY_COLORS, RARITY_GLOW, getQuestProgressPercent } from '@/lib/quests/QuestEngine';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';

interface QuestCardProps {
  quest: ActiveQuest;
  onClaim: (questId: string) => void;
  streakDays: number;
}

const DIFFICULTY_LABELS = {
  easy: { text: 'Easy', color: 'text-green-400', bg: 'bg-green-500/10' },
  medium: { text: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  hard: { text: 'Hard', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export function QuestCard({ quest, onClaim, streakDays }: QuestCardProps) {
  const progressPercent = getQuestProgressPercent(quest);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const rarity = (quest.rarity ?? 'common') as QuestRarity;
  const rarityColor = RARITY_COLORS[rarity];
  const rarityGlow = RARITY_GLOW[rarity];
  const diffStyle = DIFFICULTY_LABELS[quest.difficulty ?? 'easy'];
  const streakMultiplier = Math.min(2.0, 1 + (streakDays * 0.05));
  const bonusGems = isCompleted
    ? Math.round((quest.gemReward ?? 0) * (streakMultiplier - 1))
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ boxShadow: rarityGlow }}
    >
      <SFCard
        variant={isClaimed ? 'ghost' : 'default'}
        className={`relative overflow-hidden ${isClaimed ? 'opacity-60' : ''}`}
        style={
          !isClaimed
            ? {
                borderColor: `${rarityColor}25`,
              }
            : undefined
        }
      >
        {/* Rarity accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${rarityColor}, transparent)` }}
        />

        <div className="flex items-start gap-3">
          {/* Emoji icon */}
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${rarityColor}12` }}
          >
            {quest.emoji ?? '🔥'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white truncate">
                {quest.title ?? 'Quest'}
              </h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diffStyle.bg} ${diffStyle.color}`}>
                {diffStyle.text}
              </span>
              {rarity !== 'common' && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold capitalize"
                  style={{ background: `${rarityColor}15`, color: rarityColor }}
                >
                  {rarity}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-sf-console-text-dim mb-2.5">
              {quest.description ?? ''}
            </p>

            {/* Progress bar */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-sf-console-text-faint">
                  {quest.progress} / {quest.requirementCount}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: rarityColor }}>
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-sf-console-raised overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    background: isClaimed
                      ? '#22C55E'
                      : isCompleted
                        ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                        : `linear-gradient(90deg, ${rarityColor}, ${rarityColor}88)`,
                  }}
                />
              </div>
            </div>

            {/* Footer: Rewards + Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] text-sf-console-accent">
                  <Zap className="w-3 h-3" />
                  {quest.xpReward ?? 0} XP
                </span>
                <span className="flex items-center gap-1 text-[10px] text-sf-console-accent-alt">
                  <Star className="w-3 h-3" fill="#A78BFA" />
                  {quest.gemReward ?? 0} gems
                </span>
                {bonusGems > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Gift className="w-3 h-3" />
                    +{bonusGems} bonus
                  </span>
                )}
              </div>

              {isClaimed ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Claimed
                </span>
              ) : isCompleted ? (
                <SFButton
                  variant="accent"
                  size="sm"
                  onClick={() => onClaim(quest.id)}
                  className="text-xs"
                >
                  <Gift className="w-3.5 h-3.5 mr-1" />
                  Claim
                </SFButton>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sf-console-raised text-sf-console-text-faint text-[10px] font-medium">
                  <Lock className="w-3 h-3" />
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>
      </SFCard>
    </motion.div>
  );
}
