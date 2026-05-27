// ════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Recent Learning Activity Timeline
// Shows recent games played, lessons completed, badges earned, XP gains
// ════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import {
  Gamepad2,
  BookOpen,
  Trophy,
  Zap,
  Star,
  Flame,
  Circle,
} from 'lucide-react';

export type ActivityType = 'game' | 'lesson' | 'badge' | 'xp' | 'streak' | 'level';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  xp?: number;
  icon?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: typeof Gamepad2;
  color: string;
  bgColor: string;
  label: string;
}> = {
  game: {
    icon: Gamepad2,
    color: '#4F6EF7',
    bgColor: 'rgba(79,110,247,0.12)',
    label: 'Played',
  },
  lesson: {
    icon: BookOpen,
    color: '#2ECC71',
    bgColor: 'rgba(46,204,113,0.12)',
    label: 'Learned',
  },
  badge: {
    icon: Trophy,
    color: '#FFD93D',
    bgColor: 'rgba(255,217,61,0.12)',
    label: 'Earned',
  },
  xp: {
    icon: Zap,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.12)',
    label: 'Gained',
  },
  streak: {
    icon: Flame,
    color: '#FF6B35',
    bgColor: 'rgba(255,107,53,0.12)',
    label: 'Streak',
  },
  level: {
    icon: Star,
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.12)',
    label: 'Leveled Up',
  },
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ activities, isLoading, maxItems = 5 }: ActivityFeedProps) {
  const displayItems = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
          <div className="w-24 h-4 rounded bg-slate-700 animate-pulse" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="w-3/4 h-3 rounded bg-slate-700 animate-pulse" />
              <div className="w-1/2 h-2.5 rounded bg-slate-700 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Circle className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-sm text-slate-400 mb-1">No activity yet</p>
        <p className="text-xs text-slate-500">Start playing to see your activity here!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-4">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        Recent Activity
      </h3>

      <div className="space-y-1">
        {displayItems.map((item, index) => {
          const cfg = ACTIVITY_CONFIG[item.type];
          const Icon = cfg.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: cfg.bgColor }}
              >
                {item.icon ? (
                  <span className="text-sm">{item.icon}</span>
                ) : (
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {cfg.label} <span className="text-slate-300">{item.title}</span>
                </p>
                {item.description && (
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                )}
              </div>

              {/* Meta */}
              <div className="text-right shrink-0">
                {item.xp && item.xp > 0 && (
                  <span className="text-xs font-semibold text-amber-400">+{item.xp} XP</span>
                )}
                <p className="text-[10px] text-slate-500">{formatTimeAgo(item.timestamp)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Skeleton / Loading State
// ════════════════════════════════════════════════════════════════

export function ActivityFeedSkeleton() {
  return <ActivityFeed activities={[]} isLoading />;
}

// ════════════════════════════════════════════════════════════════
// ACTIVITY FEED — Empty State
// ════════════════════════════════════════════════════════════════

export function ActivityFeedEmpty() {
  return <ActivityFeed activities={[]} />;
}
