// ════════════════════════════════════════════════════
// USAGE DASHBOARD — Aggregate + per-child meters
// v3 Gap 4: Shows prompts, games, and child-profile
// consumption vs the parent's tier limits. Integrated on
// /parent and above the pricing cards on /parent/subscription.
// ════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Gamepad2,
  Users,
  ChevronDown,
  Loader2,
  AlertCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { useParentUsage } from '@/hooks/useParentUsage';
import { UsageMeter } from './UsageMeter';
import { TIER_DISPLAY } from '@/lib/tier-config';

interface UsageDashboardProps {
  /** Show "Upgrade" CTA when nearing limits. Hide on the subscription
   * page where pricing cards are already below. */
  showUpgradeCTA?: boolean;
  /** Dashboard variant — affects spacing + heading. */
  variant?: 'card' | 'inline';
  /** Open with per-child expansion panel already open. */
  defaultExpanded?: boolean;
}

export function UsageDashboard({
  showUpgradeCTA = true,
  variant = 'card',
  defaultExpanded = false,
}: UsageDashboardProps) {
  const { data: usage, isLoading, error } = useParentUsage();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (isLoading) {
    return (
      <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-4">
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-body text-xs">Loading usage…</span>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="bg-[var(--surface-card)] border border-red-500/20 rounded-2xl p-4 bg-red-500/5">
        <div className="flex items-center gap-2 text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span className="font-body text-xs">Unable to load usage data</span>
        </div>
      </div>
    );
  }

  const {
    tier,
    limits,
    totals,
    perChild,
  } = usage;

  // Compute near-limit state for the upgrade CTA
  const promptsNearLimit =
    perChild.some(
      (c) =>
        c.promptsUsedToday > 0 &&
        c.promptsUsedToday / limits.promptsPerDay >= 0.8
    );
  const gamesNearLimit =
    limits.gamesPerWeek !== null &&
    perChild.some(
      (c) =>
        c.gamesPlayedThisWeek / (limits.gamesPerWeek ?? 1) >= 0.8
    );
  const childrenAtLimit = totals.childrenCount >= totals.maxChildren;
  const showCTA =
    showUpgradeCTA &&
    tier !== 'forge' &&
    (promptsNearLimit || gamesNearLimit || childrenAtLimit);

  const tierName = TIER_DISPLAY[tier].name;

  return (
    <motion.div
      className={variant === 'card' ? 'bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-5' : ''}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {variant === 'card' && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-white">Usage</h3>
            <p className="font-body text-2xs text-white/70">
              {tierName} · {totals.childrenCount} child profile
              {totals.childrenCount === 1 ? '' : 's'}
            </p>
          </div>
          {perChild.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 font-body text-xs text-white/50 hover:text-white/80 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? 'Collapse' : 'Per child'}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      )}

      {/* Aggregate meters (total across children) */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-spark-blue/10 border border-spark-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-spark-blue" />
          </div>
          <div className="flex-1">
            <UsageMeter
              label="Prompt Lab today"
              value={totals.promptsUsedToday}
              max={totals.promptsLimitToday}
              hint={`${limits.promptsPerDay}/child`}
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-spark-purple/10 border border-spark-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gamepad2 className="w-4 h-4 text-spark-purple" />
          </div>
          <div className="flex-1">
            <UsageMeter
              label="Games this week"
              value={totals.gamesPlayedThisWeek}
              max={totals.gamesLimitThisWeek}
              hint={
                limits.gamesPerWeek === null
                  ? 'Unlimited'
                  : `${limits.gamesPerWeek}/child`
              }
            />
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-spark-green/10 border border-spark-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Users className="w-4 h-4 text-spark-green" />
          </div>
          <div className="flex-1">
            <UsageMeter
              label="Child profiles"
              value={totals.childrenCount}
              max={totals.maxChildren}
            />
          </div>
        </div>
      </div>

      {/* Per-child drilldown */}
      <AnimatePresence initial={false}>
        {expanded && perChild.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-5 pt-4 border-t border-white/5 space-y-4">
              {perChild.map((child) => (
                <div key={child.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-white">
                      {child.displayName}
                    </span>
                    <span className="font-body text-2xs text-white/60">
                      Band {child.ageBand}
                    </span>
                  </div>
                  <UsageMeter
                    label="Prompts today"
                    value={child.promptsUsedToday}
                    max={limits.promptsPerDay}
                    size="sm"
                  />
                  <UsageMeter
                    label="Games this week"
                    value={child.gamesPlayedThisWeek}
                    max={limits.gamesPerWeek}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade CTA when near limits */}
      {showCTA && (
        <Link href="/parent/subscription">
          <motion.div
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-spark-orange/10 to-amber-500/10 border border-spark-orange/20 flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <ArrowUpCircle className="w-5 h-5 text-spark-orange flex-shrink-0" />
            <div className="flex-1">
              <div className="font-display text-xs font-bold text-spark-orange">
                {childrenAtLimit ? 'Add more profiles' : 'Running low?'}
              </div>
              <div className="font-body text-2xs text-white/50">
                Upgrade for more prompts, games, and child profiles.
              </div>
            </div>
          </motion.div>
        </Link>
      )}
    </motion.div>
  );
}
