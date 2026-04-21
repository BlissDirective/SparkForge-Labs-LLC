'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeDisplay } from './BadgeDisplay';
import type { BadgeData } from './BadgeDisplay';
import type { BadgeCategory } from '@/types';

// ════════════════════════════════════════════════════
// BADGE GRID — Grouped badge display with category headers
// Supports filtering, column configuration, and AnimatePresence
// ════════════════════════════════════════════════════

interface BadgeGridProps {
  badges: BadgeData[];
  showLocked?: boolean;
  columns?: 3 | 4 | 5;
  /** Filter to a single category. If undefined, shows all categories. */
  filterCategory?: BadgeCategory;
}

const CATEGORY_META: Record<BadgeCategory, { label: string; emoji: string }> = {
  progress:    { label: 'Progress',     emoji: '\uD83D\uDCC8' },
  streak:      { label: 'Streaks',      emoji: '\uD83D\uDD25' },
  lab:         { label: 'Lab Mastery',  emoji: '\uD83E\uDDEA' },
  game_master: { label: 'Game Master',  emoji: '\uD83C\uDFAE' },
  knowledge:   { label: 'Knowledge',    emoji: '\uD83D\uDCA1' },
  explorer:    { label: 'Explorer',     emoji: '\uD83E\uDDED' },
  creator:     { label: 'Creator',      emoji: '\uD83C\uDFA8' },
  secret:      { label: 'Secret',       emoji: '\uD83D\uDD10' },
  prestige:    { label: 'Prestige',     emoji: '\uD83D\uDC8E' },
};

const CATEGORY_ORDER: BadgeCategory[] = [
  'progress', 'streak', 'lab', 'game_master', 'knowledge',
  'explorer', 'creator', 'secret', 'prestige',
];

const COLUMN_CLASS = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
} as const;

export function BadgeGrid({
  badges,
  showLocked = true,
  columns = 4,
  filterCategory,
}: BadgeGridProps) {
  const grouped = useMemo(() => {
    const filtered = showLocked ? badges : badges.filter((b) => b.earned);

    const groups = new Map<BadgeCategory, BadgeData[]>();
    for (const badge of filtered) {
      if (filterCategory && badge.category !== filterCategory) continue;
      const list = groups.get(badge.category) || [];
      list.push(badge);
      groups.set(badge.category, list);
    }

    // Sort earned first within each category, then by rarity
    const rarityOrder: Record<string, number> = {
      legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
    };
    for (const [, list] of groups) {
      list.sort((a, b) => {
        if (a.earned !== b.earned) return a.earned ? -1 : 1;
        return (rarityOrder[a.rarity] ?? 5) - (rarityOrder[b.rarity] ?? 5);
      });
    }

    return groups;
  }, [badges, showLocked, filterCategory]);

  const visibleCategories = CATEGORY_ORDER.filter((cat) => grouped.has(cat));

  if (visibleCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/70">
        <span className="text-4xl mb-3">{'\uD83C\uDFC6'}</span>
        <p className="font-body text-sm">No badges to display yet.</p>
        <p className="font-body text-xs mt-1">Keep exploring to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {visibleCategories.map((category) => {
          const meta = CATEGORY_META[category];
          const categoryBadges = grouped.get(category)!;

          return (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              aria-labelledby={`badge-category-${category}`}
            >
              {/* Category header */}
              <h3
                id={`badge-category-${category}`}
                className="font-display text-sm font-semibold text-white/70 uppercase tracking-wider mb-3 flex items-center gap-2"
              >
                <span aria-hidden="true">{meta.emoji}</span>
                {meta.label}
                <span className="text-white/60 font-data text-xs ml-auto">
                  {categoryBadges.filter((b) => b.earned).length}/{categoryBadges.length}
                </span>
              </h3>

              {/* Badge grid */}
              <div
                role="list"
                aria-label={`${meta.label} badges`}
                className={`grid ${COLUMN_CLASS[columns]} gap-3`}
              >
                {categoryBadges.map((badge) => (
                  <BadgeDisplay key={badge.id} badge={badge} size="md" />
                ))}
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
