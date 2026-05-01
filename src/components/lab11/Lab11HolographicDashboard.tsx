'use client';

// ════════════════════════════════════════════════════════════════
// Lab11HolographicDashboard — Stage 11A
// ════════════════════════════════════════════════════════════════
// Lab 11 (Agentic AI, Mint-Cyan #6FFFE6) cockpit-style dashboard
// rendered when the player navigates to /labs/11. Replaces the
// standard game-list template with a richer composition-aware view.
//
// Composition:
//   • Hero strip: lab title + 3D holographic projector + key stats
//   • Mission radar: 8-axis radar chart of mission family distribution
//   • Milestone tiles: 6 progressive achievements
//   • Specialist usage strip: top-3 most-placed specialists
//   • Cohort roadmap: 11D ✅ / 11E / 11F / 11G timeline cards
//   • Game list: Agent Atelier card + coming-soon tiles
//   • Back link
//
// Data: useAtelierStats + useLabMilestones (read-only Supabase queries
// against agent_compositions, gated by RLS to the active child).
// ════════════════════════════════════════════════════════════════

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Play } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { ResponsiveRadar } from '@nivo/radar';
import {
  useAtelierStats,
  useLabMilestones,
  MISSION_FAMILY_META,
  type AtelierStats,
  type Milestone,
} from '@/hooks/useAtelierStats';
import { AGENT_ROSTER } from '@/lib/agentatelier/agentRoster';
import { getGamesByLab } from '@/config/gameRegistry';

const Lab11Dashboard3D = dynamic(() => import('./Lab11Dashboard3D'), { ssr: false });

interface Lab11HolographicDashboardProps {
  childId: string;
  labColor: string;
  labName: string;
  labDescription: string;
  progressPercent: number;
  isLoadingProgress: boolean;
}

const LAB11_HEX = '#6FFFE6';

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

export default function Lab11HolographicDashboard({
  childId,
  labColor,
  labName,
  labDescription,
  progressPercent,
  isLoadingProgress,
}: Lab11HolographicDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useAtelierStats(childId);
  const { data: milestones } = useLabMilestones(childId);
  const games = React.useMemo(() => getGamesByLab(11), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 max-w-5xl mx-auto"
      role="main"
      aria-label={`Lab 11: ${labName}`}
    >
      {/* Back navigation */}
      <Link
        href="/labs"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/70 hover:text-white transition-colors"
        aria-label="Back to Lab Map"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>LAB MAP</span>
      </Link>

      {/* Hero strip — header + 3D + key stats */}
      <HeroStrip
        labName={labName}
        labDescription={labDescription}
        labColor={labColor}
        progressPercent={progressPercent}
        isLoadingProgress={isLoadingProgress}
        stats={stats}
        statsLoading={statsLoading}
      />

      {/* Mid grid: radar + milestones */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-3">
        <MissionRadarPanel stats={stats} statsLoading={statsLoading} />
        <SpecialistUsagePanel stats={stats} />
      </div>

      <MilestoneStrip milestones={milestones} />

      {/* Cohort roadmap */}
      <CohortRoadmap />

      {/* Game list (Agent Atelier + coming-soon tiles) */}
      <GameList games={games} labColor={labColor} />

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Lab 11: {labName}. {games.length} game{games.length === 1 ? '' : 's'} available.
        {statsLoading
          ? ' Loading composition stats...'
          : ` ${stats.totalSaves} saved composition${stats.totalSaves === 1 ? '' : 's'}.`}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO STRIP
// ═══════════════════════════════════════════════════════════════

interface HeroStripProps {
  labName: string;
  labDescription: string;
  labColor: string;
  progressPercent: number;
  isLoadingProgress: boolean;
  stats: AtelierStats;
  statsLoading: boolean;
}

function HeroStrip({
  labName,
  labDescription,
  labColor,
  progressPercent,
  isLoadingProgress,
  stats,
  statsLoading,
}: HeroStripProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm"
      style={{ boxShadow: `0 0 32px ${labColor}25, inset 0 0 0 1px ${labColor}30` }}
    >
      {/* 3D background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 2.2, 4.5], fov: 48 }}
          dpr={[1, 1.5]}
          style={{ background: 'transparent' }}
        >
          <Lab11Dashboard3D stats={stats} />
        </Canvas>
      </div>

      {/* Content overlay */}
      <div className="relative grid grid-cols-2 gap-4 p-5 md:p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-data text-xs font-bold tracking-wider"
              style={{ color: labColor }}
            >
              LAB 11 · AGENTIC AI
            </span>
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${labColor}40, transparent)` }}
            />
          </div>
          <h1
            className="font-display text-3xl font-bold text-white mb-1"
            style={{ textShadow: `0 0 20px ${labColor}40` }}
          >
            {labName}
          </h1>
          <p className="font-body text-sm text-white/75 leading-relaxed mb-3 max-w-md">
            {labDescription}
          </p>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: labColor }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="font-data text-sm font-bold" style={{ color: labColor }}>
              {isLoadingProgress ? '...' : `${Math.round(progressPercent)}%`}
            </span>
          </div>
        </div>

        {/* Right column: key stats grid */}
        <div className="grid grid-cols-2 gap-2 self-end">
          <KeyStat
            label="Saved teams"
            value={statsLoading ? '...' : String(stats.totalSaves)}
            color={labColor}
          />
          <KeyStat
            label="Avg team size"
            value={statsLoading ? '...' : (stats.totalSaves > 0 ? stats.avgTeamSize.toFixed(1) : '—')}
            color={labColor}
          />
          <KeyStat
            label="Total wires"
            value={statsLoading ? '...' : String(stats.totalWires)}
            color={labColor}
          />
          <KeyStat
            label="Wiring density"
            value={statsLoading ? '...' : (stats.totalSaves > 0 ? stats.wiringDensity.toFixed(2) : '—')}
            color={labColor}
          />
        </div>
      </div>
    </div>
  );
}

function KeyStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-white/55 mb-0.5">{label}</p>
      <p className="font-display text-xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MISSION RADAR
// ═══════════════════════════════════════════════════════════════

function MissionRadarPanel({ stats, statsLoading }: { stats: AtelierStats; statsLoading: boolean }) {
  // Build the 8-axis radar dataset (always show all 8 mission families,
  // including those with 0 saves, so the radar shape is stable).
  const families = ['birthday-plan', 'fact-check', 'lunchbox', 'story-editor', 'homework', 'travel-trio', 'pet-schedule', 'build-joke'];
  const data = families.map((fam) => {
    const meta = MISSION_FAMILY_META[fam];
    const found = stats.missionDistribution.find((m) => m.missionFamily === fam);
    return {
      mission: meta?.label ?? fam,
      saves: found?.saves ?? 0,
    };
  });

  const empty = stats.totalSaves === 0;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden"
      style={{ boxShadow: `inset 0 0 0 1px ${LAB11_HEX}20` }}
    >
      <div className="px-4 pt-4 pb-1">
        <p
          className="font-mono text-[10px] uppercase tracking-widest mb-1"
          style={{ color: LAB11_HEX }}
        >
          Mission radar
        </p>
        <p className="font-display text-base font-bold text-white">
          {empty ? 'Pick your first mission' : 'Mission family coverage'}
        </p>
        <p className="font-body text-[11px] text-white/55 leading-snug mt-0.5">
          {empty
            ? 'Each axis represents one of the 8 mission families. Save a team and watch this fill in.'
            : 'How many times you have saved a team for each mission family.'}
        </p>
      </div>

      <div className="h-[260px] px-2 pb-2 relative">
        {statsLoading && (
          <div className="absolute inset-0 grid place-items-center text-white/45 font-mono text-xs">Loading…</div>
        )}
        {!statsLoading && (
          <ResponsiveRadar
            data={data}
            keys={['saves']}
            indexBy="mission"
            maxValue={Math.max(2, ...data.map((d) => d.saves))}
            margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
            curve="linearClosed"
            borderColor={LAB11_HEX}
            borderWidth={2}
            gridLevels={5}
            gridShape="circular"
            gridLabelOffset={14}
            colors={[LAB11_HEX]}
            fillOpacity={0.25}
            blendMode="screen"
            theme={{
              background: 'transparent',
              text: { fill: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: 'inherit' },
              grid: { line: { stroke: 'rgba(111,255,230,0.18)', strokeWidth: 1 } },
              tooltip: {
                container: {
                  background: '#0A1A1E',
                  color: '#fff',
                  border: `1px solid ${LAB11_HEX}50`,
                  fontSize: 11,
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPECIALIST USAGE PANEL
// ═══════════════════════════════════════════════════════════════

function SpecialistUsagePanel({ stats }: { stats: AtelierStats }) {
  const top3 = stats.specialistFrequency.slice(0, 3);
  const max = top3[0]?.placements ?? 0;
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-4"
      style={{ boxShadow: `inset 0 0 0 1px ${LAB11_HEX}20` }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-widest mb-1"
        style={{ color: LAB11_HEX }}
      >
        Top specialists
      </p>
      <p className="font-display text-base font-bold text-white mb-3">
        {max === 0 ? 'No placements yet' : 'Most-placed in your saves'}
      </p>
      {max === 0 ? (
        <p className="font-body text-xs text-white/55 leading-relaxed">
          Each specialist you place across your saved teams shows up here. Build a few teams to see your favorites.
        </p>
      ) : (
        <ul className="space-y-2">
          {top3.map((entry, i) => {
            const a = AGENT_ROSTER.find((x) => x.id === entry.agentId);
            if (!a) return null;
            const pct = Math.round((entry.placements / max) * 100);
            return (
              <li key={entry.agentId}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-mono text-[10px] text-white/55 w-4"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: a.accentHex, boxShadow: `0 0 4px ${a.accentHex}` }}
                  />
                  <span className="font-display text-sm font-bold text-white flex-1">{a.name}</span>
                  <span className="font-mono text-[10px] text-white/65 tabular-nums">
                    {entry.placements}×
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden ml-6">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: a.accentHex }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MILESTONE STRIP
// ═══════════════════════════════════════════════════════════════

function MilestoneStrip({ milestones }: { milestones: Milestone[] }) {
  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: LAB11_HEX }}
      >
        Milestones
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {milestones.map((m) => (
          <MilestoneTile key={m.id} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function MilestoneTile({ milestone }: { milestone: Milestone }) {
  const pct = Math.round(milestone.progress * 100);
  return (
    <div
      className="relative rounded-xl p-3 bg-black/40 border transition-all"
      style={{
        borderColor: milestone.unlocked ? `${LAB11_HEX}60` : 'rgba(255,255,255,0.08)',
        boxShadow: milestone.unlocked ? `0 0 10px ${LAB11_HEX}25, inset 0 0 0 1px ${LAB11_HEX}30` : 'none',
      }}
      role="group"
      aria-label={`${milestone.title} - ${milestone.unlocked ? 'unlocked' : `${pct}% progress`}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base" aria-hidden="true">
          {milestone.emoji}
        </span>
        <span className="font-display text-[11px] font-bold text-white leading-tight">
          {milestone.title}
        </span>
      </div>
      <p className="font-body text-[10px] text-white/55 leading-snug mb-2">{milestone.hint}</p>
      <div className="h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: milestone.unlocked ? LAB11_HEX : `${LAB11_HEX}55`,
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COHORT ROADMAP
// ═══════════════════════════════════════════════════════════════

interface RoadmapStage {
  stage: string;
  title: string;
  arc: string;
  status: 'live' | 'planned' | 'next';
  blurb: string;
}

const ROADMAP: RoadmapStage[] = [
  {
    stage: '11D',
    title: 'Agent Atelier',
    arc: 'Build',
    status: 'live',
    blurb: 'Pick specialists, wire them up, run missions.',
  },
  {
    stage: '11E',
    title: 'MCP Plug-and-Play Lab',
    arc: 'Equip',
    status: 'next',
    blurb: 'Plug tools into your agents and watch capabilities expand.',
  },
  {
    stage: '11F',
    title: 'Glass Box Lab',
    arc: 'Audit',
    status: 'planned',
    blurb: 'Replay any saved run frame-by-frame to see how your team thinks.',
  },
  {
    stage: '11G',
    title: 'Harness Forge',
    arc: 'Constrain',
    status: 'planned',
    blurb: 'Wrap your team in safety harnesses and see what each layer catches.',
  },
];

function CohortRoadmap() {
  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: LAB11_HEX }}
      >
        Cohort roadmap · Build → Equip → Audit → Constrain
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {ROADMAP.map((s, i) => (
          <RoadmapCard key={s.stage} stage={s} index={i} />
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({ stage, index }: { stage: RoadmapStage; index: number }) {
  const isLive = stage.status === 'live';
  const isNext = stage.status === 'next';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="rounded-xl p-3 bg-black/40 border relative overflow-hidden"
      style={{
        borderColor: isLive ? `${LAB11_HEX}60` : isNext ? `${LAB11_HEX}30` : 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="font-mono text-[10px] font-bold tracking-wider"
          style={{ color: isLive ? LAB11_HEX : 'rgba(255,255,255,0.55)' }}
        >
          {stage.stage}
        </span>
        <span className="font-mono text-[9px] uppercase text-white/45">{stage.arc}</span>
        {isLive && (
          <span
            className="ml-auto font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${LAB11_HEX}20`, color: LAB11_HEX }}
          >
            live
          </span>
        )}
        {isNext && (
          <span
            className="ml-auto font-mono text-[8px] uppercase font-bold px-1.5 py-0.5 rounded text-white/65 border border-white/15"
          >
            up next
          </span>
        )}
      </div>
      <h3 className="font-display text-sm font-bold text-white mb-1">{stage.title}</h3>
      <p className="font-body text-[11px] text-white/60 leading-relaxed">{stage.blurb}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GAME LIST
// ═══════════════════════════════════════════════════════════════

interface GameListProps {
  games: ReturnType<typeof getGamesByLab>;
  labColor: string;
}

function GameList({ games, labColor }: GameListProps) {
  return (
    <div>
      <p
        className="font-mono text-[10px] uppercase tracking-widest mb-2"
        style={{ color: labColor }}
      >
        {games.length} game{games.length === 1 ? '' : 's'} live · 3 planned
      </p>
      <div className="space-y-2">
        {games.map((game, index) => (
          <Link
            key={game.slug}
            href={`/arcade/${game.slug}`}
            className="group flex items-center gap-3 rounded-xl p-3 backdrop-blur-md border bg-surface-card/40 hover:bg-surface-card/70 transition-all"
            style={{ borderColor: `${labColor}30` }}
            aria-label={`Play ${game.name}`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-data text-xs font-bold"
              style={{
                background: `${labColor}15`,
                border: `1px solid ${labColor}30`,
                color: labColor,
              }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display font-bold text-white text-sm truncate">{game.name}</p>
                <span
                  className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border"
                  style={{ color: '#FFD700', borderColor: '#FFD70040', background: '#FFD70010' }}
                >
                  FLAGSHIP
                </span>
              </div>
              <p className="font-body text-[11px] text-white/55 truncate">{game.description}</p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ background: `${labColor}20`, border: `1px solid ${labColor}40` }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: labColor }} />
            </div>
          </Link>
        ))}

        {/* Coming-soon tiles for the rest of the cohort */}
        {(['11E - MCP Plug-and-Play Lab', '11F - Glass Box Lab', '11G - Harness Forge'] as const).map((label, i) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl p-3 bg-surface-card/20 border border-white/[0.05] opacity-60"
            aria-label={`${label} - coming soon`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-data text-xs font-bold text-white/30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              {games.length + i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-white/55 text-sm">{label}</p>
              <p className="font-body text-[11px] text-white/35">Coming soon</p>
            </div>
            <span className="font-mono text-[9px] uppercase text-white/35 px-2 py-0.5 rounded border border-white/15">
              planned
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
