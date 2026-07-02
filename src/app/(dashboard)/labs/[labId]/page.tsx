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
// REFACTOR (May 1, 2026 — Stage 11A): page now derives names /
// descriptions / colors from the canonical LABS array (single source
// of truth, automatically Lab-11-aware). Adds Lab 11 special-case
// rendering: when labId === 11 the page renders the holographic
// dashboard component (Lab11HolographicDashboard) instead of the
// standard game-list template.

import { useEffect, useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useActiveChild, useChildren } from '@/hooks/useChildren';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useLabProgress } from '@/hooks/useProgress';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useLabAccess } from '@/hooks/useTierAccess';
import { LabUpsellDialog } from '@/components/subscription/TierUpsell';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { getGamesByLab } from '@/config/gameRegistry';
import { LABS } from '@/types';
import { ArrowLeft, Lock, Play } from 'lucide-react';

const Lab11HolographicDashboard = dynamic(
  () => import('@/components/lab11/Lab11HolographicDashboard'),
  { ssr: false },
);

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
  const childrenQuery = useChildren();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const focusLab = useCockpitStore((s) => s.focusLab);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const childId = activeChild?.id || '';

  // P1-4 tier gating: lab access level for the parent's subscription.
  // While loading, access is 'full' — never flash locks at paying users.
  const { access } = useLabAccess(labId);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Resolve lab metadata from the canonical LABS array (Lab-11-aware).
  // notFound() is called below after all hooks have been registered to
  // preserve React hook order.
  const lab = LABS.find((l) => l.id === labId);

  if (!lab) {
    notFound();
  }

  const color = lab.color;
  const name = lab.title;
  const description = lab.description;
  const games = useMemo(() => getGamesByLab(labId), [labId]);

  const { data: labProgress, isLoading } = useLabProgress(childId, labId);
  const progressPercent = (labProgress as { percent?: number } | undefined)?.percent || 0;

  // 3D Integration: tint cockpit + focus 3D map on this lab.
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
      focusLab(null);
    };
  }, [labId, color, name, setLabColor, focusLab, broadcast]);

  if (!activeChild) {
    // Distinguish "still loading" from "no profile exists" — the old
    // version spun forever for accounts without a child (P1-7).
    if (childrenQuery.isLoading) {
      return (
        <div className="text-center py-20" role="status" aria-label="Loading lab">
          <div
            className="w-8 h-8 border-2 border-t-current rounded-full animate-spin mx-auto"
            style={{ borderColor: `${color}30`, borderTopColor: color }}
          />
          <p className="text-sm mt-4" style={{ color: '#8C94AC' }}>
            Loading {name}…
          </p>
        </div>
      );
    }
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold mb-2" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
          Create a profile to enter {name}
        </p>
        <p className="text-sm mb-4" style={{ color: '#52586E' }}>
          Labs track progress per explorer — set up a profile first.
        </p>
        <Link
          href="/parent/add-child"
          className="inline-block px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(90deg, #E945F5, #4F6EF7)' }}
        >
          Create Profile
        </Link>
      </div>
    );
  }

  // ── Lab 11 special case: holographic dashboard ─────────────────
  // Lab 11 (Agentic AI) renders the cockpit-style holographic
  // dashboard instead of the standard game-list template, surfacing
  // composition stats, mission progress, and the cohort roadmap.
  if (labId === 11) {
    return (
      <Lab11HolographicDashboard
        childId={childId}
        labColor={color}
        labName={name}
        labDescription={description}
        progressPercent={progressPercent}
        isLoadingProgress={isLoading}
      />
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
          {access === 'preview' && (
            <span
              className="font-mono font-bold px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-white/80"
              style={{ fontSize: '9px' }}
              aria-label="Preview lab — first game is free"
            >
              PREVIEW
            </span>
          )}
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

            // P1-4 tier gating: in a 'preview' lab only the FIRST game
            // (registry order) is free; 'locked' labs lock every game.
            const isGameLocked =
              access === 'locked' || (access === 'preview' && index > 0);

            const cardInner = (
              <>
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
                    {isGameLocked && (
                      <span
                        className="inline-flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded-full border border-white/25 bg-white/10 text-white/70"
                        style={{ fontSize: '8px' }}
                      >
                        <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                        LOCKED
                      </span>
                    )}
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

                {/* Play / lock affordance */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  {isGameLocked ? (
                    <Lock className="w-3.5 h-3.5" style={{ color }} />
                  ) : (
                    <Play className="w-3.5 h-3.5" style={{ color }} />
                  )}
                </div>
              </>
            );

            return (
              <motion.div key={game.slug} variants={staggerItem} role="listitem">
                {isGameLocked ? (
                  <button
                    type="button"
                    onClick={() => setUpsellOpen(true)}
                    className="group w-full text-left flex items-center gap-3 rounded-xl p-3 backdrop-blur-md border border-white/[0.06] bg-surface-card/40 hover:bg-surface-card/70 transition-all opacity-60"
                    style={{
                      borderColor: `${color}15`,
                    }}
                    aria-label={`${game.name} is locked — see how to unlock it`}
                    aria-haspopup="dialog"
                  >
                    {cardInner}
                  </button>
                ) : (
                  <Link
                    href={`/arcade/${game.slug}`}
                    className="group flex items-center gap-3 rounded-xl p-3 backdrop-blur-md border border-white/[0.06] bg-surface-card/40 hover:bg-surface-card/70 transition-all"
                    style={{
                      borderColor: `${color}15`,
                    }}
                    aria-label={`Play ${game.name} — ${tier.label} tier`}
                  >
                    {cardInner}
                  </Link>
                )}
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

      {/* P1-4: parent-gated upsell for locked games */}
      <LabUpsellDialog
        isOpen={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        labName={name}
      />
    </motion.div>
  );
}
