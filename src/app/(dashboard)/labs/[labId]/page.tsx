'use client';

// ════════════════════════════════════════════════════
// LAB DETAIL — Individual Lab Page (3D-Embedded)
// ════════════════════════════════════════════════════
// Stage 4: Individual lab page — lists all games in a lab
// with completion status, age band badges, and 3D integration.
//
// 3D Integration:
//   - setLabColor(LAB_COLORS[labId]) on mount → cockpit tints to lab
//   - cockpitStore.focusLab(labId) → camera flies to lab orb
//   - cockpitBroadcast 'lab-select' event → cross-panel sync
//   - Game click → router navigates to /arcade/[gameSlug]
//
// Resolves S4-CRIT-003 (missing route) + S3-INFO-3D-001 (setLabColor)

import { useEffect, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useActiveChild } from '@/hooks/useChildren';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useLabProgress } from '@/hooks/useProgress';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { getGamesByLab } from '@/config/gameRegistry';
import { ArrowLeft, Play } from 'lucide-react';

const LAB_NAMES = [
  'What IS AI?', 'Teaching Machines', 'The Brain Inside',
  'AI That Creates', 'AI Helpers', 'AI & Ethics',
  'Computer Vision', 'Words & Language', 'Build Your AI', "AI's Future",
] as const;

// P2 §7.2: derived from the canonical LAB_COLORS_TABLE (src/config/labColors.ts)
// so cosmetic changes stay in one file. 0-indexed — `LAB_COLORS[labId - 1]`.
import { LAB_COLORS_TABLE } from '@/config/labColors';
const LAB_COLORS = LAB_COLORS_TABLE.map((l) => l.hex) as readonly string[];

const LAB_DESCRIPTIONS = [
  'Discover what artificial intelligence is and how it shapes our world',
  'Learn how machines learn from data and improve over time',
  'Explore neural networks and how AI brains process information',
  'See how AI creates art, music, stories, and more',
  'Build AI agents that help people solve real problems',
  'Understand bias, fairness, and responsible AI development',
  'Teach computers to see and understand images and video',
  'Explore how AI understands and generates human language',
  'Build your own AI applications from scratch',
  'Imagine the future of AI and its impact on society',
] as const;

const TIER_BADGES: Record<string, { label: string; color: string }> = {
  flagship: { label: 'FLAGSHIP', color: '#FFD700' },
  'fl-lite': { label: 'FL-LITE', color: '#00FF88' },
  standard: { label: 'STANDARD', color: '#00BBFF' },
};

export default function LabDetailPage() {
  const params = useParams();
  const labIdRaw = Array.isArray(params.labId) ? params.labId[0] : params.labId;
  const labId = parseInt(labIdRaw || '0', 10);

  const activeChild = useActiveChild();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const focusLab = useCockpitStore((s) => s.focusLab);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const childId = activeChild?.id || '';

  // Validate lab ID — notFound() is called after hooks that are always called unconditionally
  // (useParams, useChildStore, useUIStore, useCockpitStore, useCockpitBroadcast).
  // This is safe because none of the hooks above are conditional — React hook order is preserved.
  if (labId < 1 || labId > 10) {
    notFound();
  }

  const color = LAB_COLORS[labId - 1];
  const name = LAB_NAMES[labId - 1];
  const description = LAB_DESCRIPTIONS[labId - 1];
  const games = useMemo(() => getGamesByLab(labId), [labId]);

  const { data: labProgress, isLoading } = useLabProgress(childId, labId);
  const progressPercent = (labProgress as { percent?: number } | undefined)?.percent || 0;

  // 3D Integration: Tint cockpit to lab color + focus 3D map on this lab
  useEffect(() => {
    setLabColor(color);
    focusLab(labId);
    broadcast({
      type: 'lab-select',
      source: `lab-detail-${labId}`,
      color,
      label: name,
      value: labId,
    });

    return () => {
      focusLab(null); // Return to overview on unmount
    };
  }, [labId, color, name, setLabColor, focusLab, broadcast]);

  if (!activeChild) {
    return (
      <div className="text-center py-20" role="status">
        <div className="w-8 h-8 border-2 border-t-current rounded-full animate-spin mx-auto" style={{ borderColor: `${color}30`, borderTopColor: color }} />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4 max-w-4xl mx-auto"
      role="main"
      aria-label={`Lab ${labId}: ${name}`}
    >
      {/* Back navigation */}
      <motion.div variants={staggerItem}>
        <Link
          href="/labs"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-white/70 hover:text-white/70 transition-colors"
          aria-label="Back to Lab Map"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>LAB MAP</span>
        </Link>
      </motion.div>

      {/* Lab Header */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-data text-xs font-bold tracking-wider"
            style={{ color }}
          >
            LAB {labId}
          </span>
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
        </div>
        <h1
          className="font-display text-2xl font-bold text-white"
          style={{ textShadow: `0 0 20px ${color}30` }}
        >
          {name}
        </h1>
        <p className="font-body text-white/70 text-sm mt-1">{description}</p>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="font-data text-sm font-bold" style={{ color }}>
            {isLoading ? '...' : `${Math.round(progressPercent)}%`}
          </span>
        </div>
      </motion.div>

      {/* Game List */}
      <motion.div variants={staggerItem}>
        <h2 className="font-mono text-[10px] text-white/60 uppercase tracking-[0.15em] mb-2">
          {games.length} Games
        </h2>
        <div className="space-y-2" role="list" aria-label={`Games in Lab ${labId}`}>
          {games.map((game, index) => {
            const tier = TIER_BADGES[game.tier] || TIER_BADGES.standard;

            return (
              <motion.div key={game.slug} variants={staggerItem} role="listitem">
                <Link
                  href={`/arcade/${game.slug}`}
                  className="group flex items-center gap-3 rounded-xl p-3 backdrop-blur-md border border-white/[0.06] bg-surface-card/40 hover:bg-surface-card/70 transition-all"
                  style={{
                    borderColor: `${color}15`,
                  }}
                  aria-label={`Play ${game.name} — ${tier.label} tier`}
                >
                  {/* Game number */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-data text-xs font-bold"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}25`,
                      color,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-white text-sm truncate">
                        {game.name}
                      </p>
                      {/* Tier badge */}
                      <span
                        className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border"
                        style={{
                          color: tier.color,
                          borderColor: `${tier.color}40`,
                          background: `${tier.color}10`,
                        }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    {/* Age bands */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {game.ageBands.map((band: string) => (
                        <span
                          key={band}
                          className="font-mono text-[8px] text-white/25"
                        >
                          {band === 'A' ? '7-10' : band === 'B' ? '11-13' : '14-16'}
                        </span>
                      ))}
                      {game.has3D && (
                        <span className="font-mono text-[8px] text-neon-blue/40 ml-1">
                          3D
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play button */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <Play className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Lab {labId}: {name}. {games.length} games available.
        {isLoading ? ' Loading progress...' : ` ${Math.round(progressPercent)}% complete.`}
      </div>
    </motion.div>
  );
}
