// ════════════════════════════════════════════════════
// LeaderboardPanel — Compact Leaderboard for Home Page
// Shows top participants + user's position
// ════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Trophy, ArrowUp, ArrowDown, Minus, Clock, TrendingUp } from 'lucide-react';
import type { LeaderboardEntry, LeagueTier } from '@/lib/leaderboard/LeaderboardEngine';
import { getLeagueConfig, LEAGUE_ORDER } from '@/lib/leaderboard/LeaderboardEngine';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  userRank: number | null;
  currentTier: LeagueTier | null;
  timeUntilReset: string;
  isInPromotionZone: boolean;
  isInDemotionZone: boolean;
  onViewFull: () => void;
}

export function LeaderboardPanel({
  entries,
  userRank,
  currentTier,
  timeUntilReset,
  isInPromotionZone,
  isInDemotionZone,
  onViewFull,
}: LeaderboardPanelProps) {
  const config = currentTier ? getLeagueConfig(currentTier) : null;
  const topEntries = entries.slice(0, 5);
  const userEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="rounded-2xl bg-sf-console/60 border border-sf-console-border/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: config?.bgGradient || 'linear-gradient(135deg, #8B4513, #CD7F32)' }}
            >
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {config?.label || 'Leaderboard'}
              </h3>
              <p className="text-[10px] text-sf-console-text-dim flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Resets in {timeUntilReset}
              </p>
            </div>
          </div>
          <button
            onClick={onViewFull}
            className="text-xs text-sf-console-accent hover:text-sf-console-accent-bright transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      {/* Entries list */}
      <div className="px-2 pb-2">
        {topEntries.map((entry, index) => (
          <LeaderboardRow
            key={entry.rank}
            entry={entry}
            index={index}
            isUser={entry.isCurrentUser}
          />
        ))}

        {/* Show user if not in top 5 */}
        {userEntry && !topEntries.find(e => e.isCurrentUser) && (
          <>
            <div className="flex items-center justify-center py-1">
              <div className="w-8 h-px bg-sf-console-well/50" />
              <span className="px-2 text-[10px] text-sf-console-text-faint">You</span>
              <div className="w-8 h-px bg-sf-console-well/50" />
            </div>
            <LeaderboardRow entry={userEntry} index={-1} isUser />
          </>
        )}
      </div>

      {/* Zone indicator */}
      {(isInPromotionZone || isInDemotionZone) && (
        <div className={`
          mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs
          ${isInPromotionZone
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }
        `}>
          {isInPromotionZone ? (
            <>
              <ArrowUp className="w-3.5 h-3.5" />
              You are in the promotion zone! Keep it up!
            </>
          ) : (
            <>
              <ArrowDown className="w-3.5 h-3.5" />
              You are in the demotion zone. Earn more XP!
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
  isUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isUser: boolean;
}) {
  const getRankIcon = () => {
    if (entry.rank === 1) return '🥇';
    if (entry.rank === 2) return '🥈';
    if (entry.rank === 3) return '🥉';
    return null;
  };

  const getRankStyle = () => {
    if (entry.rank === 1) return 'text-amber-400 font-bold';
    if (entry.rank === 2) return 'text-sf-console-text font-semibold';
    if (entry.rank === 3) return 'text-amber-600 font-semibold';
    return 'text-sf-console-text-dim';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index >= 0 ? index * 0.05 : 0 }}
      className={`
        flex items-center gap-3 px-2 py-2 rounded-lg
        ${isUser ? 'bg-sf-console-accent/10 border border-sf-console-accent/20' : 'hover:bg-sf-console-raised/50'}
        transition-colors
      `}
    >
      {/* Rank */}
      <div className={`w-6 text-center text-xs ${getRankStyle()}`}>
        {getRankIcon() || entry.rank}
      </div>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-sf-console-well flex items-center justify-center text-sm">
        {entry.avatarEmoji}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs truncate ${isUser ? 'text-sf-console-accent-bright font-medium' : 'text-white'}`}>
          {entry.displayName}
          {isUser && ' (You)'}
        </p>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-sf-console-text-faint" />
        <span className="text-xs text-sf-console-text">{entry.xpEarned.toLocaleString()}</span>
      </div>

      {/* Zone indicator */}
      {entry.promotionZone && (
        <ArrowUp className="w-3 h-3 text-emerald-400" />
      )}
      {entry.demotionZone && (
        <ArrowDown className="w-3 h-3 text-red-400" />
      )}
      {!entry.promotionZone && !entry.demotionZone && (
        <Minus className="w-3 h-3 text-sf-console-text-faint" />
      )}
    </motion.div>
  );
}
