// ════════════════════════════════════════════════════════════════
// LABS — R2 Bento Lab Grid (DESIGN.md §4 lab recoloring, §7 bento)
// ════════════════════════════════════════════════════════════════
// 11 lab tiles in a MagicBento grid (Labs 2 + 11 span 2 columns for
// rhythm). Each tile: large lab emoji, display-face lab name, one
// poetic kid-outcome line (§5), per-lab progress bar, and a wash of
// the lab's color over the light shell (Ciao recolor pattern — the
// shell stays near-monochrome so lab colors pop). GlareHover chrome
// sweep on hover; BlurText h1; tiles link to /labs/[labId].

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { FlaskConical, Gamepad2, Sparkles } from 'lucide-react';
import { LAB_NAMES, LAB_COLORS, LAB_ICONS } from '@/config/labs';
import { getGamesByLab } from '@/config/gameRegistry';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import CountUp from '@/components/bits/CountUp';
import MagicBento, { type BentoItem } from '@/components/bits/MagicBento';
import GlareHover from '@/components/bits/GlareHover';
import BlurText from '@/components/bits/BlurText';
import { ForgeRing } from '@/components/labs/ForgeRing';
import { MoltenProgress } from '@/components/forge';
import { useForgeTier } from '@/hooks/useForgeTier';
import { FEATURE_FLAGS } from '@/config/feature-flags';

// Forge F5: ring gate — flag-off restores the bento grid exactly.
const FORGE_RING_ON = FEATURE_FLAGS.FORGE_THEME && FEATURE_FLAGS.FORGE_RING;

// ── Types ──
interface LabData {
  num: number;
  name: string;
  color: string;
  icon: string;
  poetic: string;
  gamesCount: number;
  flagshipCount: number;
  progress: number;
}

// Poetic kid-outcome microcopy — one line per lab (DESIGN.md §5).
// Kept in sync with the copy in labs/[labId]/page.tsx.
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

// Labs that span 2 bento columns for grid rhythm.
const WIDE_LABS = new Set([2, 11]);

// DESIGN.md §6 — scroll reveals fire 25% early, once.
const REVEAL_VIEWPORT = { once: true, margin: '0px 0px 25% 0px' } as const;

// ── Single bento lab tile ──
function LabTile({ lab, index }: { lab: LabData; index: number }) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.5, ease: 'easeOut' }}
    >
      <GlareHover glowColor={lab.color} radius={16} className="h-full">
        <Link
          href={`/labs/${lab.num}`}
          aria-label={`Lab ${lab.num}: ${lab.name} — ${Math.round(lab.progress)}% complete, ${lab.gamesCount} games`}
          className="flex h-full flex-col p-5 focus-visible:outline-none"
          style={{
            // Lab-color wash over the light surface — tint, never glow (§4).
            background: `radial-gradient(circle at 85% 0%, ${lab.color}1A, transparent 55%), linear-gradient(180deg, ${lab.color}0D 0%, #FFFFFF 100%)`,
          }}
        >
          {/* Icon + lab number chip */}
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl sm:text-5xl leading-none" aria-hidden="true">
              {lab.icon}
            </span>
            <span
              className="font-bold tracking-widest rounded-full px-2 py-1"
              style={{
                fontSize: '10px',
                background: `${lab.color}14`,
                color: '#52586E',
                fontFamily: 'var(--font-body)',
              }}
            >
              LAB {lab.num}
            </span>
          </div>

          {/* Name + poetic outcome line */}
          <h2
            className="text-base sm:text-lg font-bold leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
          >
            {lab.name}
          </h2>
          <p className="text-sm mt-0.5 mb-4" style={{ color: '#52586E', fontFamily: 'var(--font-body)' }}>
            {lab.poetic}
          </p>

          {/* Stats + progress (pinned to tile bottom) */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-2" style={{ color: '#8C94AC' }}>
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {lab.gamesCount}
                </span>
                {lab.flagshipCount > 0 && (
                  <span className="flex items-center gap-1" style={{ color: '#C026D3' }}>
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    {lab.flagshipCount}
                  </span>
                )}
              </span>
              <span className="font-bold" style={{ color: '#52586E' }}>
                {Math.round(lab.progress)}%
              </span>
            </div>
            <SFProgressBar value={lab.progress} max={100} variant="custom" color={lab.color} size="sm" />
          </div>
        </Link>
      </GlareHover>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function LabsPage() {
  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress } = useAllLabsProgress(childId);
  const router = useRouter();
  const { isCompact } = useForgeTier();
  // Ring is the desktop default under the forge; Grid always available.
  const [view, setView] = useState<'ring' | 'grid'>('ring');

  // Build lab data from registry + progress (wiring unchanged from v2).
  const labs = useMemo((): LabData[] => {
    return Array.from({ length: 11 }, (_, i) => {
      const num = i + 1;
      const games = getGamesByLab(num);
      const progress = (labsProgress as Array<{ lab?: number; percent?: number }> | undefined)?.find(
        (p) => p.lab === num
      );
      return {
        num,
        name: LAB_NAMES[num] || `Lab ${num}`,
        color: LAB_COLORS[num] || '#4F6EF7',
        icon: LAB_ICONS[num] || '🧠',
        poetic: LAB_POETIC[num] || '',
        gamesCount: games.length,
        flagshipCount: games.filter((g) => g.tier === 'flagship').length,
        progress: progress?.percent ?? 0,
      };
    });
  }, [labsProgress]);

  // Overall progress
  const overallProgress = useMemo(() => {
    if (!labs.length) return 0;
    return Math.round(labs.reduce((s, l) => s + l.progress, 0) / labs.length);
  }, [labs]);

  // Total games across all labs
  const totalGames = useMemo(() => labs.reduce((s, l) => s + l.gamesCount, 0), [labs]);

  // Bento items — Labs 2 + 11 span two columns for grid rhythm.
  const bentoItems = useMemo((): BentoItem[] => {
    return labs.map((lab, i) => ({
      id: `lab-${lab.num}`,
      colSpan: WIDE_LABS.has(lab.num) ? 2 : undefined,
      glowColor: lab.color,
      content: <LabTile lab={lab} index={i} />,
    }));
  }, [labs]);

  return (
    <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'rgb(var(--sf-text-primary) / 1)', textShadow: 'var(--glow-text, none)' }}
          >
            <BlurText text="Learning Labs" />
          </h1>
          <p className="text-sm" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
            <CountUp to={11} /> labs, <CountUp to={totalGames} /> games — explore and master AI topic by topic
          </p>
        </div>

        {/* Forge F5: Ring/Grid view toggle (desktop-class tiers only) */}
        {FORGE_RING_ON && !isCompact && (
          <div
            role="group"
            aria-label="Lab view"
            className="flex rounded-xl overflow-hidden border"
            style={{ borderColor: 'rgb(var(--sf-border) / 1)' }}
          >
            {(['ring', 'grid'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 text-xs font-semibold font-display uppercase tracking-wide transition-colors"
                style={{
                  backgroundColor: view === v ? 'rgb(var(--sf-primary) / 0.15)' : 'transparent',
                  color: view === v ? 'rgb(var(--sf-primary-light) / 1)' : 'rgb(var(--sf-text-muted) / 1)',
                }}
              >
                {v === 'ring' ? 'Forge Ring' : 'Grid'}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Overall Progress Bar ── */}
      {child && (
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgb(var(--sf-surface-muted) / 1)' }}>
            <FlaskConical className="w-5 h-5 shrink-0" style={{ color: 'rgb(var(--sf-primary) / 1)' }} />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: 'rgb(var(--sf-text-primary) / 1)' }}>Overall Progress</span>
                <span className="font-bold" style={{ color: 'rgb(var(--sf-primary) / 1)' }}>{overallProgress}%</span>
              </div>
              {FORGE_RING_ON ? (
                <MoltenProgress value={overallProgress / 100} height={8} label="Overall lab progress" />
              ) : (
                <SFProgressBar value={overallProgress} max={100} variant="primary" />
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Lab views: Forge Ring (desktop, flag) or Bento Grid (baseline) ── */}
      {FORGE_RING_ON && !isCompact && view === 'ring' ? (
        <section aria-label="All labs" className="mt-8">
          <ForgeRing
            labs={labs.map((l) => ({
              num: l.num,
              name: l.name,
              color: l.color,
              icon: l.icon,
              poetic: l.poetic,
              gamesCount: l.gamesCount,
              progress: l.progress,
            }))}
            onEnter={(num) => router.push(`/labs/${num}`)}
          />
        </section>
      ) : (
        <section aria-label="All labs">
          {/* minCell 150 keeps ≥2 columns down to 360px viewports so the
              colSpan-2 tiles (Labs 2 + 11) never exceed the track count. */}
          <MagicBento items={bentoItems} minCell={150} className="mt-6" />
        </section>
      )}
    </div>
  );
}
