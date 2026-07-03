'use client';

// ════════════════════════════════════════════════════
// LAB DETAIL — R2 themed lab page (DESIGN.md §4/§5/§6/§8)
// ════════════════════════════════════════════════════
// Lab-colored header band (gradient wash `${color}18` → transparent,
// large lab icon, BlurText name, poetic outcome line, progress +
// PREVIEW chip) over the light dashboard shell, plus game cards with
// per-game art direction: a deterministic CSS gradient composition
// from the lab color, hue-shifted per slug so no two cards are
// identical, with the game's emoji as the hero. The first uncompleted
// (and unlocked) game gets an active ElectricBorder.
//
// Sidebar seam: sets `--sf-nav-glow-rgb` (an "r g b" triplet from the
// lab hex) on document.documentElement via useEffect — the page
// subtree and the Sidebar are siblings, so a CSS var on the page
// wrapper can never cascade into the sidebar; the root element does.
// Removed again on unmount so other routes fall back to the brand
// primary (the Sidebar keyframes read
// `var(--sf-nav-glow-rgb, var(--sf-primary))`).
//
// Preserved behavior (P1-4 / P1-7 / Stage 11A):
//   - tier gating via useLabAccess: 'preview' locks all but the first
//     game (registry order); 'locked' locks every game; loading = full
//   - LabUpsellDialog opens from locked cards (aria-haspopup dialog)
//   - loading vs no-profile states distinguished (P1-7)
//   - Lab 11 renders Lab11HolographicDashboard instead of the list
//   - 3D integration: setLabColor / focusLab / cockpitBroadcast
//   - routes: /labs back link, /arcade/[slug] game links

import { useEffect, useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useActiveChild, useChildren } from '@/hooks/useChildren';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useLabProgress, useAllLabsProgress } from '@/hooks/useProgress';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useLabAccess } from '@/hooks/useTierAccess';
import { LabUpsellDialog } from '@/components/subscription/TierUpsell';
import { getGamesByLab } from '@/config/gameRegistry';
import type { GameRegistryEntry } from '@/config/gameRegistry';
import { LABS } from '@/types';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import BlurText from '@/components/bits/BlurText';
import ElectricBorder from '@/components/bits/ElectricBorder';
import { ArrowLeft, Check, Lock, Play } from 'lucide-react';

const Lab11HolographicDashboard = dynamic(
  () => import('@/components/lab11/Lab11HolographicDashboard'),
  { ssr: false },
);

// Tier badge accents, darkened for AA legibility on the light surface.
const TIER_BADGES: Record<string, { label: string; color: string }> = {
  flagship: { label: 'FLAGSHIP', color: '#B45309' },
  'fl-lite': { label: 'FL-LITE', color: '#047857' },
  standard: { label: 'STANDARD', color: '#0369A1' },
};

// Poetic kid-outcome microcopy (DESIGN.md §5) — kept in sync with
// labs/page.tsx.
const LAB_POETIC: Record<number, string> = {
  1: 'Spot the AI hiding in your world',
  2: 'Train a machine with your own hands',
  3: 'Build a brain, one neuron at a time',
  4: 'Make art with a machine that dreams',
  5: 'Build helpers that work while you play',
  6: 'Teach AI to play fair',
  7: 'Teach a robot to see',
  8: 'Talk to machines in your own words',
  9: "Invent an AI that's all yours",
  10: 'Imagine tomorrow, then build it',
  11: 'Give your AI a mission and watch it go',
};

// DESIGN.md §6 — scroll reveals fire 25% early, once.
const REVEAL_VIEWPORT = { once: true, margin: '0px 0px 25% 0px' } as const;

// ── Color helpers (deterministic per-game art direction) ──────────

/** '#6FFFE6' → '111 255 230' for the Sidebar's rgb(var()/alpha) glow. */
function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '79 110 247'; // brand primary fallback
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Small deterministic string hash — stable per slug across renders. */
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Rotate a hex color's hue and return an `hsl(h s% l% / a)` string. */
function shiftHue(hex: string, degrees: number, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const hue = Math.round((((h + degrees) % 360) + 360) % 360);
  return `hsl(${hue} ${Math.round(s * 100)}% ${Math.round(l * 100)}% / ${alpha})`;
}

/**
 * Per-game art panel: layered gradients composed from the lab color
 * with a slug-hashed hue drift (±40°), angle, and radial focus — every
 * card in a lab shares the lab's palette but no two are identical.
 */
function gameArtStyle(slug: string, labColor: string, locked: boolean): React.CSSProperties {
  const h = hashSlug(slug);
  const drift = (h % 81) - 40; // -40..+40° hue drift
  const angle = 110 + (h % 121); // 110..230° gradient angle
  const cx = 20 + (h % 61); // 20..80% radial focus x
  const cy = 15 + ((h >> 3) % 51); // 15..65% radial focus y
  return {
    background: [
      `radial-gradient(circle at ${cx}% ${cy}%, ${shiftHue(labColor, drift, 0.3)}, transparent 62%)`,
      `linear-gradient(${angle}deg, ${labColor}26 0%, ${shiftHue(labColor, drift, 0.12)} 100%)`,
      '#FFFFFF',
    ].join(', '),
    ...(locked ? { filter: 'grayscale(0.7)', opacity: 0.6 } : {}),
  };
}

// ── Game card (art panel + info) ──────────────────────────────────
function GameCard({
  game, index, color, locked, completed, isNext, onLockedClick,
}: {
  game: GameRegistryEntry;
  index: number;
  color: string;
  locked: boolean;
  completed: boolean;
  isNext: boolean;
  onLockedClick: () => void;
}) {
  const tier = TIER_BADGES[game.tier] || TIER_BADGES.standard;

  const body = (
    <div
      className="h-full rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${color}1F`,
        boxShadow: '0 2px 10px rgba(26, 29, 43, 0.05)',
      }}
    >
      {/* Art panel — deterministic per-slug gradient + hero emoji */}
      <div
        className="relative flex h-28 items-center justify-center"
        style={gameArtStyle(game.slug, color, locked)}
      >
        <span className="text-5xl" aria-hidden="true">{game.icon}</span>
        {/* Game number */}
        <span
          className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(255, 255, 255, 0.85)', color: '#52586E' }}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        {/* Completed check */}
        {completed && (
          <span
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#2ECC71' }}
            aria-hidden="true"
          >
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="font-bold text-sm truncate"
            style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
          >
            {game.name}
          </p>
          {/* Tier badge */}
          <span
            className="font-bold px-1.5 py-0.5 rounded-full border tracking-wider"
            style={{
              fontSize: '9px',
              color: tier.color,
              borderColor: `${tier.color}40`,
              background: `${tier.color}0D`,
            }}
          >
            {tier.label}
          </span>
          {locked && (
            <span
              className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-full border tracking-wider"
              style={{
                fontSize: '9px',
                borderColor: '#DAE0F0',
                background: '#F1F4FB',
                color: '#52586E',
              }}
            >
              <Lock className="w-2.5 h-2.5" aria-hidden="true" />
              LOCKED
            </span>
          )}
        </div>

        <p className="text-xs mt-1 line-clamp-2" style={{ color: '#52586E' }}>
          {game.description}
        </p>

        {/* Age bands + 3D + play/lock affordance */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {game.ageBands.map((band: string) => (
            <span key={band} className="font-semibold" style={{ fontSize: '10px', color: '#8C94AC' }}>
              {band === 'A' ? '7-10' : band === 'B' ? '11-13' : '14-16'}
            </span>
          ))}
          {game.has3D && (
            <span className="font-bold" style={{ fontSize: '10px', color: '#0369A1' }}>
              3D
            </span>
          )}
          <span
            className="ml-auto w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
            style={{ background: `${color}1A`, border: `1px solid ${color}33` }}
            aria-hidden="true"
          >
            {locked ? (
              <Lock className="w-3.5 h-3.5" style={{ color: '#52586E' }} />
            ) : (
              <Play className="w-3.5 h-3.5" style={{ color: '#1A1D2B' }} />
            )}
          </span>
        </div>
      </div>
    </div>
  );

  const interactive = locked ? (
    <button
      type="button"
      onClick={onLockedClick}
      className="group block w-full h-full text-left rounded-2xl focus-visible:outline-none focus-visible:ring-2"
      style={{ ['--tw-ring-color' as string]: color }}
      aria-label={`${game.name} is locked — see how to unlock it`}
      aria-haspopup="dialog"
    >
      {body}
    </button>
  ) : (
    <Link
      href={`/arcade/${game.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2"
      style={{ ['--tw-ring-color' as string]: color }}
      aria-label={`Play ${game.name} — ${tier.label} tier`}
    >
      {body}
    </Link>
  );

  return (
    <motion.div
      role="listitem"
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={REVEAL_VIEWPORT}
      transition={{
        delay: (index % 3) * 0.06,
        opacity: { duration: 0.45, ease: 'easeOut' },
        y: { type: 'spring', stiffness: 300, damping: 20 },
      }}
    >
      {isNext ? (
        <ElectricBorder color={color} radius={16} active className="h-full">
          {interactive}
        </ElectricBorder>
      ) : (
        interactive
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════
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
  // notFound() is called after ALL hooks below so hook order is stable;
  // the fallbacks keep the hooks safe when the lab id is invalid.
  const lab = LABS.find((l) => l.id === labId);
  const color = lab?.color ?? '#4F6EF7';
  const name = lab?.title ?? `Lab ${labId}`;
  const description = lab?.description ?? '';
  const icon = lab?.icon ?? '🧪';
  const poetic = LAB_POETIC[labId] ?? '';

  const games = useMemo(() => getGamesByLab(labId), [labId]);

  const { data: labProgress, isLoading } = useLabProgress(childId, labId);
  const progressPercent = (labProgress as { percent?: number } | undefined)?.percent || 0;

  // Per-game completion — same all-labs payload the Labs index reads.
  const { data: allLabsProgress } = useAllLabsProgress(childId);
  const completedSlugs = useMemo(() => {
    const slugs = new Set<string>();
    (allLabsProgress as Array<{ game_slug?: string; percent?: number }> | undefined)?.forEach((p) => {
      if (p.game_slug && (p.percent ?? 0) >= 100) slugs.add(p.game_slug);
    });
    return slugs;
  }, [allLabsProgress]);

  // First uncompleted game (registry order) gets the ElectricBorder.
  const nextSlug = useMemo(
    () => games.find((g) => !completedSlugs.has(g.slug))?.slug,
    [games, completedSlugs],
  );

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

  // R2 sidebar seam: the Sidebar is a sibling of the page subtree, so a
  // CSS var set on this page's wrapper can never reach it via the
  // cascade — document.documentElement does. The Sidebar's active-glow
  // keyframes read `rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / a)`,
  // so removing the property on unmount restores the brand primary.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sf-nav-glow-rgb', hexToRgbTriplet(color));
    return () => {
      root.style.removeProperty('--sf-nav-glow-rgb');
    };
  }, [color]);

  if (!lab) {
    notFound();
  }

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
    <div
      className="space-y-6 max-w-5xl mx-auto pb-20 lg:pb-0"
      role="main"
      aria-label={`Lab ${labId}: ${name}`}
    >
      {/* Back navigation */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/labs"
          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest hover:underline transition-colors"
          style={{ color: '#52586E' }}
          aria-label="Back to Lab Map"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>LAB MAP</span>
        </Link>
      </motion.div>

      {/* ── Themed header band — lab-colored wash → transparent ── */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background: `linear-gradient(150deg, ${color}18 0%, ${color}0A 55%, rgba(255, 255, 255, 0) 100%)`,
            border: `1px solid ${color}26`,
          }}
        >
          {/* Soft radial accent, top-right */}
          <div
            aria-hidden="true"
            className="absolute pointer-events-none rounded-full"
            style={{
              right: '-3rem',
              top: '-3rem',
              width: '14rem',
              height: '14rem',
              background: `radial-gradient(circle, ${color}22, transparent 70%)`,
            }}
          />

          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="text-5xl sm:text-6xl leading-none" aria-hidden="true">
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-widest" style={{ color: '#52586E' }}>
                  LAB {labId}
                </span>
                {access === 'preview' && (
                  <span
                    className="font-bold px-2 py-0.5 rounded-full border tracking-wider"
                    style={{
                      fontSize: '9px',
                      borderColor: `${color}40`,
                      background: '#FFFFFF',
                      color: '#52586E',
                    }}
                    aria-label="Preview lab — first game is free"
                  >
                    PREVIEW
                  </span>
                )}
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
              >
                <BlurText text={name} />
              </h1>
              {poetic && (
                <p className="text-sm sm:text-base font-medium mt-1" style={{ color: '#52586E' }}>
                  {poetic}
                </p>
              )}
              <p className="text-xs sm:text-sm mt-1" style={{ color: '#8C94AC' }}>
                {description}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative mt-5 flex items-center gap-3">
            <div className="flex-1">
              <SFProgressBar
                value={Math.min(progressPercent, 100)}
                max={100}
                variant="custom"
                color={color}
                size="sm"
              />
            </div>
            <span className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
              {isLoading ? '…' : `${Math.round(progressPercent)}%`}
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Game cards — per-game art direction ── */}
      <section>
        <h2
          className="text-xs font-bold uppercase mb-3"
          style={{ color: '#52586E', letterSpacing: '0.15em' }}
        >
          {games.length} Games
        </h2>
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label={`Games in Lab ${labId}`}
        >
          {games.map((game, index) => {
            // P1-4 tier gating: in a 'preview' lab only the FIRST game
            // (registry order) is free; 'locked' labs lock every game.
            const isGameLocked =
              access === 'locked' || (access === 'preview' && index > 0);

            return (
              <GameCard
                key={game.slug}
                game={game}
                index={index}
                color={color}
                locked={isGameLocked}
                completed={completedSlugs.has(game.slug)}
                isNext={game.slug === nextSlug && !isGameLocked}
                onLockedClick={() => setUpsellOpen(true)}
              />
            );
          })}
        </div>
      </section>

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
    </div>
  );
}
