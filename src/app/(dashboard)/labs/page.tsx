// ════════════════════════════════════════════════════════════════
// LABS — Cosmic Orbit: Lab → Game Expansion Experience
// ════════════════════════════════════════════════════════════════
// 11 lab orbs in a staggered galaxy grid. Clicking a lab triggers
// a gravity-wave expansion: other orbs drift outward and dim, the
// selected orb scales 2x and centers, and its games emerge in a
// semicircular orbit below. Replaces the separate arcade page.
//
// Layout pattern (desktop): 2-3-2-3-1 rows for 11 labs
// Mobile: single-column stack, expansion fills viewport

'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical, Gamepad2, Star, Lock, Zap, Sparkles,
  ArrowLeft, Play, X, ChevronRight,
} from 'lucide-react';
import { LAB_NAMES, LAB_COLORS, LAB_ICONS as CONFIG_ICONS } from '@/config/labs';
import { GAME_REGISTRY, getGamesByLab } from '@/config/gameRegistry';
import type { GameRegistryEntry } from '@/config/gameRegistry';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFButton } from '@/components/ui/SFButton';
import SpotlightCard from '@/components/bits/SpotlightCard';
import TiltedCard from '@/components/bits/TiltedCard';
import GradientText from '@/components/bits/GradientText';
import CountUp from '@/components/bits/CountUp';
import ShinyText from '@/components/bits/ShinyText';
import GalaxyBackground from '@/components/bits/GalaxyBackground';
import OrbitalRing from '@/components/bits/OrbitalRing';

// ── Types ──
interface LabData {
  num: number;
  name: string;
  color: string;
  icon: string;
  games: GameRegistryEntry[];
  progress: number;
  flagshipCount: number;
}

// ── Row layout pattern for 11 labs (galaxy stagger) ──
const ROW_PATTERN = [2, 3, 2, 3, 1];
function getRowIndex(labIndex: number): number {
  let count = 0;
  for (let r = 0; r < ROW_PATTERN.length; r++) {
    count += ROW_PATTERN[r];
    if (labIndex < count) return r;
  }
  return 0;
}

// ── SVG Circular Progress Ring ──
function OrbProgressRing({
  percent, size, color, strokeWidth = 4,
}: {
  percent: number; size: number; color: string; strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90 pointer-events-none">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ── Gravity Wave Pulse Effect ──
function GravityWave({ color, onComplete }: { color: string; onComplete: () => void }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{ border: `2px solid ${color}` }}
      initial={{ width: 120, height: 120, opacity: 0.6 }}
      animate={{ width: 800, height: 800, opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
    />
  );
}

// ── Single Game Card (in the orbit) ──
function OrbitGameCard({
  game, index, labColor, isCompleted, onClose,
}: {
  game: GameRegistryEntry; index: number; labColor: string;
  isCompleted: boolean; onClose: () => void;
}) {
  const tierConfig = {
    flagship: { label: 'Flagship', icon: Sparkles, color: '#E945F5' },
    'fl-lite': { label: 'FL Lite', icon: Zap, color: '#FF6B35' },
    standard: { label: 'Standard', icon: Star, color: '#2ECC71' },
  };
  const tier = tierConfig[game.tier];
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 20, stiffness: 300 }}
    >
      <Link href={`/arcade/${game.slug}`} onClick={onClose}>
        <TiltedCard tiltAmount={8} className="cursor-pointer">
          <div
            className="rounded-2xl p-4 w-44 sm:w-48 transition-shadow hover:shadow-xl"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
              border: `1px solid ${labColor}20`,
            }}
          >
            {/* Game header */}
            <div
              className="relative h-20 rounded-xl flex items-center justify-center text-4xl mb-3"
              style={{ background: `linear-gradient(135deg, ${labColor}20, ${labColor}08)` }}
            >
              <motion.span whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: 'spring', stiffness: 300 }}>
                {game.icon}
              </motion.span>
              {isCompleted && (
                <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: '#2ECC71' }}>
                  <Star className="w-3.5 h-3.5 text-white" fill="white" />
                </div>
              )}
            </div>

            {/* Info */}
            <h4 className="text-sm font-bold mb-1 truncate" style={{ color: '#1A1D2B' }}>
              {game.name}
            </h4>
            <p className="text-xs line-clamp-2 mb-2" style={{ color: '#8C94AC' }}>
              {game.description}
            </p>

            <div className="flex items-center gap-1.5">
              <SFBadge
                variant="custom"
                size="sm"
                style={{ background: `${tier.color}15`, color: tier.color, borderColor: `${tier.color}25` }}
              >
                <TierIcon className="w-2.5 h-2.5 mr-0.5" />
                {tier.label}
              </SFBadge>
              <span className="flex items-center gap-0.5">
                {game.ageBands.map((band) => (
                  <span key={band} className="text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{ background: `${labColor}12`, color: labColor }}>
                    {band}
                  </span>
                ))}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-1 text-xs font-bold" style={{ color: labColor }}>
              <Play className="w-3.5 h-3.5" /> Play Now
            </div>
          </div>
        </TiltedCard>
      </Link>
    </motion.div>
  );
}

// ── Expanded Lab View (games in orbit) ──
function ExpandedLabView({
  lab, completedSlugs, onClose,
}: {
  lab: LabData; completedSlugs: Set<string>; onClose: () => void;
}) {
  return (
    <motion.div
      className="relative z-30 flex flex-col items-center w-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Back button */}
      <motion.button
        onClick={onClose}
        className="absolute -top-4 left-0 sm:left-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
                   transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 z-40"
        style={{ background: `${lab.color}15`, color: lab.color, focusVisibleRingColor: lab.color }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
      >
        <ArrowLeft className="w-4 h-4" /> All Labs
      </motion.button>

      {/* Enlarged orb */}
      <motion.div
        className="relative flex flex-col items-center"
        initial={{ scale: 1 }} animate={{ scale: 1.15 }} transition={{ type: 'spring', damping: 20 }}
      >
        <div className="relative">
          <OrbitalRing size={120} color={lab.color} orbitCount={3} speed={14}>
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-5xl sm:text-6xl shadow-2xl"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${lab.color}40, ${lab.color}18 60%, ${lab.color}08)`,
                boxShadow: `0 0 60px ${lab.color}30, 0 0 120px ${lab.color}15, inset 0 0 40px ${lab.color}10`,
              }}
            >
              {lab.icon}
            </div>
          </OrbitalRing>
          <div className="absolute inset-0 flex items-center justify-center">
            <OrbProgressRing percent={lab.progress} size={160} color={lab.color} strokeWidth={5} />
          </div>

          {/* Floating label */}
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
            style={{ background: lab.color, color: '#FFFFFF' }}
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            {Math.round(lab.progress)}% Complete
          </motion.div>
        </div>

        {/* Lab title */}
        <motion.div className="text-center mt-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            <ShinyText disabled={false}>{lab.name}</ShinyText>
          </h2>
          <p className="text-sm mt-1" style={{ color: '#8C94AC' }}>
            Lab {lab.num} &middot; {lab.games.length} games &middot; {lab.flagshipCount} flagship
          </p>
        </motion.div>
      </motion.div>

      {/* Games — semicircular orbit layout */}
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 max-w-5xl px-4"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
      >
        <AnimatePresence>
          {lab.games.map((game, i) => (
            <OrbitGameCard
              key={game.slug}
              game={game}
              index={i}
              labColor={lab.color}
              isCompleted={completedSlugs.has(game.slug)}
              onClose={onClose}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Play random from lab */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
      >
        <Link href={`/arcade/${lab.games[Math.floor(Math.random() * lab.games.length)]?.slug}`} onClick={onClose}>
          <SFButton
            variant="primary"
            size="lg"
            style={{ background: `linear-gradient(135deg, ${lab.color}, ${lab.color}CC)` }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Play a Random {lab.name} Game
          </SFButton>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ── Lab Orb (compact card in galaxy grid) ──
function LabOrb({
  lab, index, isDimmed, isSelected, onClick,
}: {
  lab: LabData; index: number; isDimmed: boolean; isSelected: boolean; onClick: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className="cursor-pointer relative"
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{
        opacity: isDimmed ? 0.15 : 1,
        scale: isSelected ? 1.08 : 1,
        y: 0,
      }}
      whileHover={!isSelected && !isDimmed ? { scale: 1.05, y: -4 } : {}}
      transition={{
        layout: { type: 'spring', damping: 25, stiffness: 200 },
        opacity: { duration: 0.4 },
        scale: { type: 'spring', damping: 20 },
        delay: index * 0.05,
      }}
      style={{ pointerEvents: isDimmed ? 'none' : 'auto' }}
    >
      <SpotlightCard spotlightColor={`${lab.color}12`} className="h-full">
        <div className="p-4 sm:p-5 flex flex-col items-center text-center relative">
          {/* Orb */}
          <div className="relative mb-3">
            <OrbitalRing size={80} color={lab.color} orbitCount={2} speed={18 + (lab.num % 5) * 3}>
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl"
                style={{
                  background: `radial-gradient(circle at 40% 35%, ${lab.color}35, ${lab.color}15 60%, transparent)`,
                  boxShadow: `0 0 30px ${lab.color}25, inset 0 0 20px ${lab.color}10`,
                }}
              >
                {lab.icon}
              </div>
            </OrbitalRing>
            <div className="absolute inset-0">
              <OrbProgressRing percent={lab.progress} size={96} color={lab.color} />
            </div>

            {/* Progress badge */}
            {lab.progress > 0 && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: lab.color, color: '#FFFFFF' }}
              >
                {Math.round(lab.progress)}%
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="text-sm font-bold mb-0.5" style={{ color: '#1A1D2B' }}>
            {lab.name}
          </h3>
          <p className="text-xs mb-2" style={{ color: '#8C94AC' }}>
            Lab {lab.num}
          </p>

          <div className="flex items-center gap-2 text-xs" style={{ color: '#8C94AC' }}>
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" /> {lab.games.length}
            </span>
            {lab.flagshipCount > 0 && (
              <span className="flex items-center gap-1" style={{ color: '#E945F5' }}>
                <Sparkles className="w-3 h-3" /> {lab.flagshipCount}
              </span>
            )}
          </div>

          {/* Mini progress */}
          <div className="w-full mt-3">
            <SFProgressBar value={lab.progress} max={100} variant="custom" color={lab.color} />
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function LabsPage() {
  const [selectedLab, setSelectedLab] = useState<LabData | null>(null);
  const [waveColor, setWaveColor] = useState<string | null>(null);

  const child = useActiveChild();
  const childId = child?.id ?? '';
  const { data: labsProgress } = useAllLabsProgress(childId);

  // Build lab data from registry + progress
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
        icon: CONFIG_ICONS[num] || '🧠',
        games,
        progress: progress?.percent ?? 0,
        flagshipCount: games.filter((g) => g.tier === 'flagship').length,
      };
    });
  }, [labsProgress]);

  // Which game slugs are completed
  const completedSlugs = useMemo(() => {
    if (!labsProgress) return new Set<string>();
    const slugs = new Set<string>();
    (labsProgress as Array<{ game_slug?: string; percent?: number }>).forEach((p) => {
      if (p.game_slug && (p.percent ?? 0) >= 100) slugs.add(p.game_slug);
    });
    return slugs;
  }, [labsProgress]);

  // Overall progress
  const overallProgress = useMemo(() => {
    if (!labs.length) return 0;
    return Math.round(labs.reduce((s, l) => s + l.progress, 0) / labs.length);
  }, [labs]);

  // Total games across all labs
  const totalGames = useMemo(() => labs.reduce((s, l) => s + l.games.length, 0), [labs]);

  const handleSelectLab = useCallback((lab: LabData) => {
    setWaveColor(lab.color);
    setSelectedLab(lab);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedLab(null);
    setWaveColor(null);
  }, []);

  // Group labs into rows per galaxy pattern
  const rows = useMemo(() => {
    const result: LabData[][] = [];
    let idx = 0;
    for (const count of ROW_PATTERN) {
      result.push(labs.slice(idx, idx + count));
      idx += count;
    }
    return result;
  }, [labs]);

  return (
    <div className="relative min-h-[calc(100vh-200px)] max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* Galaxy starfield background */}
      <GalaxyBackground className="opacity-70" />

      {/* Gravity wave effect */}
      <AnimatePresence>
        {waveColor && (
          <GravityWave color={waveColor} onComplete={() => setWaveColor(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          <GradientText from="#E945F5" to="#4F6EF7">Learning Labs</GradientText>
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          <CountUp end={11} /> labs, <CountUp end={totalGames} /> games — explore and master AI topic by topic
        </p>
      </motion.div>

      {/* ── Overall Progress Bar ── */}
      {child && (
        <motion.div
          className="mt-5 mb-6"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#F8F7FF' }}>
            <FlaskConical className="w-5 h-5 shrink-0" style={{ color: '#4F6EF7' }} />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold" style={{ color: '#1A1D2B' }}>Overall Progress</span>
                <span className="font-bold" style={{ color: '#4F6EF7' }}>{overallProgress}%</span>
              </div>
              <SFProgressBar value={overallProgress} max={100} variant="primary" />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Galaxy Grid (always rendered, dims when lab selected) ── */}
      <motion.div
        className="mt-6 space-y-5 relative z-10"
        animate={{
          opacity: selectedLab ? 0.12 : 1,
          scale: selectedLab ? 0.92 : 1,
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex justify-center gap-4 sm:gap-5 flex-wrap"
            style={{
              paddingLeft: rowIdx % 2 === 1 ? '2rem' : '0',
              paddingRight: rowIdx % 2 === 0 && rowIdx > 0 ? '2rem' : '0',
            }}
          >
            {row.map((lab) => {
              const globalIndex = rows.slice(0, rowIdx).reduce((s, r) => s + r.length, 0) + row.indexOf(lab);
              return (
                <div key={lab.num} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(20%-16px)] max-w-[220px]">
                  <LabOrb
                    lab={lab}
                    index={globalIndex}
                    isDimmed={!!selectedLab}
                    isSelected={selectedLab?.num === lab.num}
                    onClick={() => handleSelectLab(lab)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* ── Expanded Lab View (overlays the dimmed grid) ── */}
      <AnimatePresence>
        {selectedLab && (
          <motion.div
            key={`expanded-${selectedLab.num}`}
            className="absolute inset-x-0 top-32 z-30"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180, delay: 0.15 }}
          >
            <ExpandedLabView
              lab={selectedLab}
              completedSlugs={completedSlugs}
              onClose={handleClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
                                               