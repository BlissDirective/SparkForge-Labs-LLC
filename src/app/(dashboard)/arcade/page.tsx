// ════════════════════════════════════════════════════
// ARCADE PAGE — Browse all 35 SparkForge games
// ════════════════════════════════════════════════════
// Stage 4: Refactored to use gameRegistry (S4-WARN-002)
// + completion status per game (S4-WARN-004)
// + cockpit-themed styling for 3D-embedded UI
// Frost-Prismatic styling, filterable by Lab and tier

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Cpu, Zap, CheckCircle } from 'lucide-react';
import { GAME_REGISTRY, type GameTier, type GameRegistryEntry } from '@/config/gameRegistry';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useChildProgress } from '@/hooks/useProgress';

const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#F97316', 10: '#D946EF',
};

const TIER_CONFIG: Record<GameTier, { label: string; color: string }> = {
  flagship: { label: 'Flagship', color: '#FFD700' },
  'fl-lite': { label: 'Enhanced', color: '#00FF88' },
  standard: { label: 'Standard', color: '#00BBFF' },
};

export default function ArcadePage() {
  const [search, setSearch] = useState('');
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<GameTier | null>(null);
  const { activeChild } = useChildStore();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const { data: progress } = useChildProgress(activeChild?.id || '');

  // Set cockpit to arcade green on mount
  useEffect(() => {
    setLabColor('#00FF88');
  }, [setLabColor]);

  // S4-WARN-004: Build completion set from progress data
  const completedSlugs = useMemo(() => {
    if (!progress || !Array.isArray(progress)) return new Set<string>();
    return new Set(
      progress
        .filter((p: { completed?: boolean }) => p.completed)
        .map((p: { content_id?: string }) => p.content_id || '')
    );
  }, [progress]);

  // S4-WARN-002: Use GAME_REGISTRY as single source of truth
  const filtered = useMemo(() => {
    return GAME_REGISTRY.filter(g => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedLab !== null && g.lab !== selectedLab) return false;
      if (selectedTier !== null && g.tier !== selectedTier) return false;
      return true;
    });
  }, [search, selectedLab, selectedTier]);

  const grouped = useMemo(() => {
    const map = new Map<number, GameRegistryEntry[]>();
    for (const g of filtered) {
      if (!map.has(g.lab)) map.set(g.lab, []);
      map.get(g.lab)!.push(g);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto" role="main" aria-label="Game Arcade">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(0,255,136,0.3)]">
          Game Arcade
        </h1>
        <p className="font-mono text-xs text-neon-green/60 tracking-wider mt-1">
          {GAME_REGISTRY.length} GAMES · 10 LABS · AI & ML DISCOVERY
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-card/60 border border-white/[0.06] text-white/80 font-body text-sm placeholder:text-white/20 focus:outline-none focus:border-neon-blue/40 backdrop-blur-sm"
            aria-label="Search games"
          />
        </div>

        <select
          value={selectedLab ?? ''}
          onChange={e => setSelectedLab(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-lg bg-surface-card/60 border border-white/[0.06] text-white/70 font-body text-sm focus:outline-none focus:border-neon-blue/40 backdrop-blur-sm cursor-pointer"
          aria-label="Filter by Lab"
        >
          <option value="">All Labs</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Lab {i + 1}</option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {(['flagship', 'fl-lite', 'standard'] as GameTier[]).map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
              className={`px-3 py-2 rounded-lg border text-xs font-display font-bold transition-all ${
                selectedTier === tier
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/[0.06] bg-transparent text-white/40 hover:text-white/60'
              }`}
              aria-pressed={selectedTier === tier}
              aria-label={`Filter by ${TIER_CONFIG[tier].label} tier`}
            >
              {TIER_CONFIG[tier].label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-xs font-data text-white/30">
        <span>{filtered.length} games</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {filtered.filter(g => g.tier === 'flagship').length} flagship
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          {filtered.filter(g => g.has3D).length} with 3D
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-400/50" />
          {completedSlugs.size} completed
        </span>
      </div>

      {/* Game Grid by Lab */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {grouped.map(([lab, games]) => (
            <motion.section
              key={lab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Lab header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: LAB_COLORS[lab] }}
                />
                <h2 className="font-display text-sm font-bold text-white/80">
                  Lab {lab}: {games[0]?.labName}
                </h2>
                <span className="text-[10px] font-data text-white/25">
                  {games.length} game{games.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Games grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {games.map(game => {
                  const isCompleted = completedSlugs.has(game.slug);
                  const labColor = LAB_COLORS[game.lab] || '#00BBFF';
                  const tierCfg = TIER_CONFIG[game.tier];

                  return (
                    <Link
                      key={game.slug}
                      href={`/arcade/${game.slug}`}
                      className="group block"
                      aria-label={`${game.name}${isCompleted ? ' (completed)' : ''} — ${tierCfg.label} tier`}
                    >
                      <motion.div
                        className="relative rounded-xl border border-white/[0.06] bg-surface-card/50 p-3 transition-all hover:border-white/[0.12] hover:bg-surface-card/80 backdrop-blur-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ boxShadow: `0 0 0 1px ${labColor}08` }}
                      >
                        {/* Completion badge */}
                        {isCompleted && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>
                        )}

                        {/* Tier + 3D badge */}
                        {!isCompleted && game.has3D && (
                          <div
                            className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-data font-bold"
                            style={{
                              backgroundColor: `${tierCfg.color}15`,
                              color: tierCfg.color,
                            }}
                          >
                            <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                            3D
                          </div>
                        )}

                        {/* Icon + Name */}
                        <div className="flex items-start gap-2.5 mb-2">
                          <span className="text-xl" aria-hidden="true">{game.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-xs font-bold text-white/90 truncate group-hover:text-white transition-colors">
                              {game.name}
                            </h3>
                            <p className="font-body text-[10px] text-white/30 mt-0.5 line-clamp-1">
                              {game.description}
                            </p>
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                          <div className="flex gap-1">
                            {game.ageBands.map(band => (
                              <span
                                key={band}
                                className="text-[9px] font-data text-white/20 px-1 py-0.5 rounded bg-white/[0.03]"
                              >
                                {band === 'A' ? '7-10' : band === 'B' ? '11-13' : '14-16'}
                              </span>
                            ))}
                          </div>
                          <span
                            className="text-[9px] font-data"
                            style={{ color: `${labColor}60` }}
                          >
                            {tierCfg.label}
                          </span>
                        </div>

                        {/* Hover glow */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ boxShadow: `inset 0 0 20px ${labColor}08, 0 0 15px ${labColor}08` }}
                        />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-body text-white/30 text-sm">No games match your filters</p>
          <button
            onClick={() => { setSearch(''); setSelectedLab(null); setSelectedTier(null); }}
            className="mt-3 text-xs font-display text-neon-blue/60 hover:text-neon-blue transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
