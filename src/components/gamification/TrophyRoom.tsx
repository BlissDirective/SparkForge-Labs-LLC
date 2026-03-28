'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { useBadges } from '@/hooks/useGamification';
import { BadgeGrid } from './BadgeGrid';
import type { BadgeData } from './BadgeDisplay';
import type { BadgeCategory } from '@/types';

// ════════════════════════════════════════════════════
// TROPHY ROOM — Full badge collection view
// 3D showcase for rare/epic/legendary + category tabs + BadgeGrid
// ════════════════════════════════════════════════════

const RARITY_COLORS: Record<string, string> = {
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
};

const RARITY_LABELS: Record<string, string> = {
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

interface TrophyRoomProps {
  childId: string;
  onShowcaseBadgeSelect?: (badge: BadgeData) => void;
}

const CATEGORY_TABS: { key: BadgeCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all',         label: 'All',          emoji: '\uD83C\uDFC6' },
  { key: 'progress',    label: 'Progress',     emoji: '\uD83D\uDCC8' },
  { key: 'streak',      label: 'Streaks',      emoji: '\uD83D\uDD25' },
  { key: 'lab',         label: 'Labs',         emoji: '\uD83E\uDDEA' },
  { key: 'game_master', label: 'Game Master',  emoji: '\uD83C\uDFAE' },
  { key: 'knowledge',   label: 'Knowledge',    emoji: '\uD83D\uDCA1' },
  { key: 'explorer',    label: 'Explorer',     emoji: '\uD83E\uDDED' },
  { key: 'creator',     label: 'Creator',      emoji: '\uD83C\uDFA8' },
  { key: 'secret',      label: 'Secret',       emoji: '\uD83D\uDD10' },
  { key: 'prestige',    label: 'Prestige',     emoji: '\uD83D\uDC8E' },
];

export function TrophyRoom({ childId, onShowcaseBadgeSelect }: TrophyRoomProps) {
  const { data, isLoading } = useBadges(childId);
  const [activeTab, setActiveTab] = useState<BadgeCategory | 'all'>('all');
  const [selectedShowcaseId, setSelectedShowcaseId] = useState<string | null>(null);

  // Normalize API response into BadgeData[]
  const badges: BadgeData[] = useMemo(() => {
    const rawData = data as { badges?: Array<{ id: string; name: string; icon: string; description: string; rarity: string; earned: boolean; category: string }> } | undefined;
    if (!rawData?.badges) return [];
    return rawData.badges.map((b: {
      id: string;
      name: string;
      icon: string;
      description: string;
      rarity: string;
      earned: boolean;
      category: string;
    }) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      description: b.description,
      rarity: b.rarity as BadgeData['rarity'],
      earned: b.earned,
      category: b.category as BadgeData['category'],
    }));
  }, [data]);

  // Stats
  const totalEarned = badges.filter((b) => b.earned).length;
  const totalAvailable = badges.length;
  const completionPct = totalAvailable > 0
    ? Math.round((totalEarned / totalAvailable) * 100)
    : 0;

  // High-rarity earned badges for the 3D showcase section
  const showcaseBadges = useMemo(
    () =>
      badges
        .filter(
          (b) =>
            b.earned &&
            (b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary'),
        )
        .slice(0, 6),
    [badges],
  );

  const handleShowcaseSelect = useCallback(
    (badge: BadgeData) => {
      setSelectedShowcaseId((prev) => (prev === badge.id ? null : badge.id));
      onShowcaseBadgeSelect?.(badge);
    },
    [onShowcaseBadgeSelect],
  );

  if (isLoading) {
    return <TrophyRoomSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex items-center gap-6 rounded-xl border border-white/[0.06] bg-[#111118]/70 backdrop-blur-md px-6 py-4">
        <StatItem label="Earned" value={totalEarned} color="#00FF88" />
        <div className="w-px h-8 bg-white/[0.06]" />
        <StatItem label="Total" value={totalAvailable} color="#00BBFF" />
        <div className="w-px h-8 bg-white/[0.06]" />
        <StatItem label="Complete" value={`${completionPct}%`} color="#AA66FF" />

        {/* Mini progress bar */}
        <div className="flex-1 ml-4">
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#AA66FF' }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* 3D Showcase — rare/epic/legendary earned badges */}
      {showcaseBadges.length > 0 && (
        <section aria-label="Featured high-rarity badges">
          <h3 className="font-display text-sm font-semibold text-white/70 mb-3 flex items-center gap-1.5">
            <span aria-hidden="true">&#10024;</span>
            Featured Badges
          </h3>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {showcaseBadges.map((badge) => {
              const isSelected = selectedShowcaseId === badge.id;
              const accentColor = RARITY_COLORS[badge.rarity] || '#00BBFF';

              return (
                <motion.button
                  key={badge.id}
                  onClick={() => handleShowcaseSelect(badge)}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    relative flex-shrink-0 w-36 rounded-xl p-3 text-left
                    backdrop-blur-md border bg-[#111118]/50
                    transition-colors duration-200 cursor-pointer
                    ${isSelected
                      ? 'border-white/20 ring-1'
                      : 'border-white/[0.06] hover:border-white/10'
                    }
                  `}
                  style={{
                    // @ts-expect-error -- ringColor is a valid CSS custom property for ring utilities
                    '--tw-ring-color': isSelected ? accentColor : undefined,
                    boxShadow: isSelected
                      ? `0 0 16px ${accentColor}33, inset 0 0 12px ${accentColor}11`
                      : undefined,
                  }}
                  aria-label={`${badge.name}, ${RARITY_LABELS[badge.rarity] || badge.rarity} rarity — click to preview in 3D`}
                  aria-pressed={isSelected}
                >
                  {/* Badge emoji */}
                  <span className="block text-3xl mb-2" aria-hidden="true">
                    {badge.icon}
                  </span>

                  {/* Name */}
                  <span className="block font-body text-xs text-white/90 truncate">
                    {badge.name}
                  </span>

                  {/* Rarity label */}
                  <span
                    className="block font-data text-[10px] font-bold uppercase tracking-wider mt-1"
                    style={{ color: accentColor }}
                  >
                    {RARITY_LABELS[badge.rarity] || badge.rarity}
                  </span>

                  {/* Selected indicator dot */}
                  {isSelected && (
                    <motion.span
                      layoutId="showcase-indicator"
                      className="absolute top-2 right-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* Category tabs */}
      <div
        role="tablist"
        aria-label="Badge categories"
        className="flex flex-wrap gap-2"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls="trophy-room-panel"
              id={`trophy-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                font-body text-sm transition-all duration-200
                border
                ${isActive
                  ? 'bg-[#00BBFF]/15 border-[#00BBFF]/30 text-white'
                  : 'bg-transparent border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/10'
                }
              `}
            >
              <span aria-hidden="true" className="text-sm">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Badge content panel */}
      <div
        role="tabpanel"
        id="trophy-room-panel"
        aria-labelledby={`trophy-tab-${activeTab}`}
      >
        <BadgeGrid
          badges={badges}
          showLocked
          columns={4}
          filterCategory={activeTab === 'all' ? undefined : activeTab}
        />
      </div>
    </div>
  );
}

// ═══ Sub-components ═══

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-data text-lg font-bold" style={{ color }}>
        {value}
      </span>
      <span className="font-body text-[10px] text-white/40 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function TrophyRoomSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Stats bar skeleton */}
      <div className="h-16 rounded-xl bg-[#111118]/50 border border-white/[0.06]" />

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-lg bg-[#111118]/50 border border-white/[0.06]"
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl bg-[#111118]/40 border border-white/[0.06]"
          />
        ))}
      </div>
    </div>
  );
}
