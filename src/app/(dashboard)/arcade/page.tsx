// ════════════════════════════════════════════════════════════════
// ARCADE — Game Browser with React Bits & Full Backend Integration
// ════════════════════════════════════════════════════════════════
// Kid-friendly game discovery with filters, search, categories,
// and React Bits visual effects (R3: GlareHover art cards, BlurText,
// ElectricBorder featured banner).

'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  Zap,
  X,
  Gamepad2,
  Sparkles,
  TrendingUp,
  Flame,
  ChevronRight,
  Info,
} from 'lucide-react';
import { GAME_REGISTRY } from '@/config/gameRegistry';
import type { GameRegistryEntry } from '@/config/gameRegistry';
import { LAB_COLORS } from '@/config/labs';
import { SFInput } from '@/components/ui/SFInput';
import { SFBadge } from '@/components/ui/SFBadge';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import BlurText from '@/components/bits/BlurText';
import GlareHover from '@/components/bits/GlareHover';
import ElectricBorder from '@/components/bits/ElectricBorder';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { GameDetailModal } from '@/components/arcade';

// ── Deterministic game-art helpers (R3) ──
// Each card gets a lab-color gradient art panel with a subtle per-slug
// hue variation, so every game reads as its own "cover" while staying
// inside the lab's color family (DESIGN §4 lab recoloring).

function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** Rotate a hex color's hue by `deg` and optionally lift lightness. */
function shiftHue(hex: string, deg: number, lightnessBoost = 0): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const hue = (((h + deg) % 360) + 360) % 360;
  const lit = Math.min(0.92, l + lightnessBoost);
  return `hsl(${hue.toFixed(0)} ${(s * 100).toFixed(0)}% ${(lit * 100).toFixed(0)}%)`;
}

/** Lab-color gradient with a deterministic hue-shifted second stop. */
function gameArtGradient(slug: string, labColor: string): string {
  const shift = (slugHash(slug) % 41) - 20; // −20°..+20°, stable per slug
  return `linear-gradient(135deg, ${labColor} 0%, ${shiftHue(labColor, shift, 0.08)} 100%)`;
}

/** Soft top-left highlight overlay for depth on art panels. */
const ART_HIGHLIGHT =
  'radial-gradient(120% 90% at 25% 15%, rgba(255,255,255,0.42), transparent 55%)';

// ── Category filters ──
const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: Gamepad2, color: '#4F6EF7' },
  { id: 'flagship', label: 'Flagship', icon: Sparkles, color: '#E945F5' },
  { id: 'fl-lite', label: 'FL Lite', icon: Zap, color: '#FF6B35' },
  { id: 'standard', label: 'Standard', icon: Star, color: '#2ECC71' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'xp', label: 'XP Reward' },
];

export default function ArcadePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Phase 5: Game detail modal state
  const [detailGame, setDetailGame] = useState<GameRegistryEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const child = useActiveChild();
  const childId = child?.id ?? '';
  const childAgeBand = child?.age_band ?? 'A';
  const { data: labsProgress } = useAllLabsProgress(childId);

  // Get completion status for games
  const completedSlugs = useMemo(() => {
    if (!labsProgress) return new Set<string>();
    const slugs = new Set<string>();
    (labsProgress as Array<{ game_slug?: string; percent?: number }>).forEach((p) => {
      if (p.game_slug && (p.percent ?? 0) >= 100) slugs.add(p.game_slug);
    });
    return slugs;
  }, [labsProgress]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let games = [...GAME_REGISTRY];

    // Category filter
    if (activeCategory !== 'all') {
      games = games.filter((g) => g.tier === activeCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      games = games.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.labName.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        games.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        games.sort((a, b) => b.id - a.id);
        break;
      case 'xp':
        games.sort((a, b) => (b.tier === 'flagship' ? 3 : b.tier === 'fl-lite' ? 2 : 1) - (a.tier === 'flagship' ? 3 : a.tier === 'fl-lite' ? 2 : 1));
        break;
      default:
        // Popular = flagship first
        games.sort((a, b) => {
          const tierOrder = { flagship: 0, 'fl-lite': 1, standard: 2 };
          return tierOrder[a.tier] - tierOrder[b.tier];
        });
    }

    return games;
  }, [activeCategory, searchQuery, sortBy]);

  // Featured game (top flagship)
  const featuredGame = useMemo(
    () => GAME_REGISTRY.find((g) => g.tier === 'flagship'),
    []
  );

  // Phase 5: Open game detail modal
  const openDetailModal = (game: GameRegistryEntry) => {
    setDetailGame(game);
    setDetailOpen(true);
  };

  // Listen for game swaps from within the modal (related games)
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<GameRegistryEntry>;
      if (custom.detail) {
        setDetailGame(custom.detail);
      }
    };
    window.addEventListener('gameDetailOpen', handler);
    return () => window.removeEventListener('gameDetailOpen', handler);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 lg:pb-0">
      {/* ═══ Header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1
          className="text-2xl sm:text-3xl font-extrabold mb-1"
          style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
        >
          <BlurText text="Game Arcade" />
        </h1>
        <p className="text-sm" style={{ color: '#8C94AC' }}>
          {GAME_REGISTRY.length} games to explore, learn, and master AI
        </p>
      </motion.div>

      {/* ═══ Search & Filters Bar ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8C94AC' }} />
          <input
            type="text"
            placeholder="Search games, labs, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-sf-lg border text-sm font-body transition-all focus:outline-none focus:ring-2 focus:ring-sf-primary/20 focus:border-sf-primary"
            style={{ borderColor: '#DAE0F0', color: '#1A1D2B', backgroundColor: '#FFFFFF' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4" style={{ color: '#8C94AC' }} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-sf-lg border text-sm font-body cursor-pointer focus:outline-none focus:ring-2 focus:ring-sf-primary/20"
            style={{ borderColor: '#DAE0F0', color: '#1A1D2B', backgroundColor: '#FFFFFF' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-sf-lg border text-sm font-body transition-all ${showFilters ? 'ring-2 ring-sf-primary/30' : ''}`}
            style={{ borderColor: '#DAE0F0', color: '#1A1D2B', backgroundColor: '#FFFFFF' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ═══ Category Pills ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={isActive}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-sf-full text-sm font-semibold
                whitespace-nowrap transition-all shrink-0
                ${isActive ? 'text-white' : 'hover:bg-sf-surface-muted'}
              `}
              style={{
                backgroundColor: isActive ? cat.color : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#52586E',
                border: isActive ? '1px solid transparent' : '1px solid #DAE0F0',
                boxShadow: isActive
                  ? `0 0 0 1px ${cat.color}66, 0 4px 14px ${cat.color}40`
                  : 'none',
              }}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-sf-surface-muted'}`}
              >
                {cat.id === 'all' ? GAME_REGISTRY.length : GAME_REGISTRY.filter((g) => g.tier === cat.id).length}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ═══ Featured Game Banner ═══ */}
      <AnimatePresence>
        {featuredGame && !searchQuery && activeCategory === 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Link href={`/arcade/${featuredGame.slug}`}>
              <ElectricBorder
                color={LAB_COLORS[featuredGame.lab]}
                radius={24}
                active
                className="cursor-pointer transition-all hover:shadow-sf-lg"
              >
                <div
                  className="relative overflow-hidden rounded-sf-xl"
                  style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)' }}
                >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 sm:p-8">
                  {/* Art panel */}
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-5xl shrink-0"
                    style={{
                      background: gameArtGradient(featuredGame.slug, LAB_COLORS[featuredGame.lab]),
                      boxShadow: `0 8px 24px ${LAB_COLORS[featuredGame.lab]}40`,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{ background: ART_HIGHLIGHT }}
                    />
                    <span className="relative">{featuredGame.icon}</span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <SFBadge variant="premium" size="sm">
                        <Flame className="w-3 h-3" /> Featured
                      </SFBadge>
                      <SFBadge variant="primary" size="sm">{featuredGame.labName}</SFBadge>
                    </div>

                    <h2
                      className="text-xl sm:text-2xl font-extrabold mb-2"
                      style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
                    >
                      {featuredGame.name}
                    </h2>

                    <p className="text-sm mb-4 max-w-lg" style={{ color: '#8C94AC' }}>
                      {featuredGame.description}
                    </p>

                    <div className="flex items-center gap-4">
                      <button
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sf-full text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                        style={{
                          background: `linear-gradient(135deg, ${LAB_COLORS[featuredGame.lab]}, #4F6EF7)`,
                          boxShadow: `0 4px 16px ${LAB_COLORS[featuredGame.lab]}40`,
                        }}
                      >
                        <Gamepad2 className="w-4 h-4" /> Play Now
                      </button>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#8C94AC' }}>
                        <Star className="w-3 h-3" style={{ color: '#FFD93D', fill: '#FFD93D' }} /> {featuredGame.tier}
                      </span>
                    </div>
                  </div>
                </div>
                </div>
              </ElectricBorder>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Game Grid ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
            {searchQuery ? `Results for "${searchQuery}"` : 'All Games'}
          </h2>
          <span className="text-xs" style={{ color: '#8C94AC' }}>
            {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#DAE0F0' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1D2B' }}>No games found</h3>
            <p className="text-sm" style={{ color: '#8C94AC' }}>Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredGames.map((game, i) => {
                const isCompleted = completedSlugs.has(game.slug);
                const labColor = LAB_COLORS[game.lab];

                return (
                  <motion.div
                    key={game.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div
                      onClick={() => openDetailModal(game)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDetailModal(game);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${game.name} — details`}
                      className="h-full"
                    >
                      <GlareHover glowColor={labColor} radius={16} className="h-full cursor-pointer">
                        <div
                          className="rounded-sf-lg overflow-hidden h-full"
                          style={{
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)',
                            border: `1px solid ${labColor}26`,
                          }}
                        >
                          {/* Art panel — deterministic lab-color composition */}
                          <div
                            className="relative h-28 sm:h-32 flex items-center justify-center overflow-hidden"
                            style={{ background: gameArtGradient(game.slug, labColor) }}
                          >
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0"
                              style={{ background: ART_HIGHLIGHT }}
                            />
                            <motion.span
                              className="relative text-5xl sm:text-6xl"
                              style={{ textShadow: '0 4px 14px rgba(0,0,0,0.22)' }}
                              whileHover={{ scale: 1.15, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                            >
                              {game.icon}
                            </motion.span>

                            {isCompleted && (
                              <div
                                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#2ECC71', boxShadow: '0 2px 8px rgba(46,204,113,0.3)' }}
                              >
                                <Star className="w-4 h-4 text-white" fill="white" />
                              </div>
                            )}

                            {/* Info icon for modal */}
                            <div
                              className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center
                                         bg-white/90 shadow-sm"
                            >
                              <Info className="w-3.5 h-3.5" style={{ color: labColor }} />
                            </div>

                            <SFBadge
                              variant="primary"
                              size="sm"
                              className="absolute bottom-3 right-3"
                              style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: labColor }}
                            >
                              {game.labName}
                            </SFBadge>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-sm font-bold leading-tight" style={{ color: '#1A1D2B' }}>
                                {game.name}
                              </h3>
                            </div>

                            <p className="text-xs line-clamp-2 mb-3" style={{ color: '#8C94AC' }}>
                              {game.description}
                            </p>

                            <div className="flex items-center justify-between">
                              {/* P2-5: the old 1–3 star row restated the
                                  tier but read as a quality rating —
                                  "standard" games looked like 1-star
                                  duds. The tier badge alone is honest. */}
                              <div className="flex items-center gap-2">
                                <SFBadge
                                  variant={game.tier === 'flagship' ? 'premium' : game.tier === 'fl-lite' ? 'secondary' : 'default'}
                                  size="sm"
                                >
                                  {game.tier === 'fl-lite' ? 'Lite' : game.tier.charAt(0).toUpperCase() + game.tier.slice(1)}
                                </SFBadge>
                              </div>

                              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4F6EF7' }}>
                                <Info className="w-3 h-3" /> Details
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlareHover>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ═══ Phase 5: Game Detail Modal ═══ */}
      <GameDetailModal
        game={detailGame}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        childAgeBand={childAgeBand}
      />
    </div>
  );
}