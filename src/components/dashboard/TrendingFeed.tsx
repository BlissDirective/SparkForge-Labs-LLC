'use client';

// ════════════════════════════════════════════════════
// TRENDING AI FEED — Phase 3: Displays trending AI topics
// Shows this week's AI news adapted to game scenarios
// Used on dashboard home + lab pages
// ════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ExternalLink, Gamepad2, Sparkles, ChevronRight } from 'lucide-react';
import { useTrendingContent } from '@/hooks/useContent';
import { useActiveChild } from '@/hooks/useChildren';
import type { Content } from '@/types';
import Link from 'next/link';

interface TrendingFeedProps {
  maxItems?: number;
  compact?: boolean;
}

export default function TrendingFeed({ maxItems = 3, compact = false }: TrendingFeedProps) {
  const ageBand = useActiveChild()?.age_band || 'B';
  const { data, isLoading } = useTrendingContent(ageBand);

  const items = ((data as { items?: Content[] })?.items || []).slice(0, maxItems);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: maxItems }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
        <TrendingUp className="w-8 h-8 text-cyan-400/40 mx-auto mb-2" />
        <p className="text-white/70 font-body text-sm">
          No trending topics yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-display text-lg text-white">Trending in AI</h3>
          <Sparkles className="w-4 h-4 text-cyan-400/60" />
        </div>
      )}

      {/* Trending Items */}
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.1 }}
            className="group relative rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-400/10 hover:border-cyan-400/30 p-4 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              {/* Trending indicator */}
              <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-sm text-white truncate">
                  {item.title}
                </h4>
                {!compact && (
                  <p className="text-white/50 text-xs font-body mt-1 line-clamp-2">
                    {item.content_body}
                  </p>
                )}

                {/* Game badges */}
                {item.game_config && (
                  <div className="flex items-center gap-2 mt-2">
                    <Gamepad2 className="w-3 h-3 text-green-400/60" />
                    <span className="text-xs text-green-400/60 font-mono">
                      {item.game_config.game_type}
                    </span>
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-cyan-400/60 font-data">
                    Lab {item.world}
                  </span>
                  <span className="text-xs text-white/60">|</span>
                  <span className="text-xs text-amber-400/60 font-data">
                    +{item.xp_reward} XP
                  </span>
                </div>
              </div>

              {/* Action arrow */}
              <ChevronRight className="w-4 h-4 text-white/55 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* View all link */}
      {!compact && items.length >= maxItems && (
        <Link
          href="/arcade?filter=trending"
          className="flex items-center gap-2 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors font-body mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          View all trending topics
        </Link>
      )}
    </div>
  );
}
