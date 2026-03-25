// ════════════════════════════════════════════════════
// ARCADE PAGE — Browse all 35 SparkForge games by Lab
// Frost-Prismatic styling, filterable by Lab and tier
// ════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Cpu, Zap } from 'lucide-react';

type GameTier = 'flagship' | 'fl-lite' | 'standard';
type AgeBand = 'A' | 'B' | 'C';

interface ArcadeGame {
  id: number;
  name: string;
  slug: string;
  lab: number;
  labName: string;
  tier: GameTier;
  icon: string;
  description: string;
  ageBands: AgeBand[];
  has3D: boolean;
}

const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#F97316', 10: '#D946EF',
};

const LAB_NAMES: Record<number, string> = {
  1: 'What IS AI?', 2: 'AI Assistants', 3: 'How AI Learns', 4: 'AI & Language',
  5: 'AI Agents', 6: 'AI & Society', 7: 'Computer Vision', 8: 'AI Communication',
  9: 'Building with AI', 10: 'AI Futures',
};

const GAMES: ArcadeGame[] = [
  { id: 1, name: 'AI Spy', slug: 'ai-spy', lab: 1, labName: 'What IS AI?', tier: 'standard', icon: '🔍', description: 'Spot hidden AI in everyday scenes', ageBands: ['A','B','C'], has3D: true },
  { id: 2, name: 'Time Machine', slug: 'time-machine', lab: 1, labName: 'What IS AI?', tier: 'standard', icon: '⏰', description: 'Place AI milestones on a timeline', ageBands: ['A','B','C'], has3D: true },
  { id: 3, name: 'Human vs Machine', slug: 'human-vs-machine', lab: 1, labName: 'What IS AI?', tier: 'standard', icon: '🤖', description: 'Guess if work was done by human or AI', ageBands: ['A','B','C'], has3D: true },
  { id: 4, name: 'AI Pet Trainer', slug: 'pet-trainer', lab: 2, labName: 'AI Assistants', tier: 'flagship', icon: '🐾', description: 'Train a virtual AI pet through reinforcement learning', ageBands: ['A','B','C'], has3D: true },
  { id: 5, name: 'Sort Toy Box', slug: 'sort-toy-box', lab: 2, labName: 'AI Assistants', tier: 'flagship', icon: '📦', description: 'Sort objects into categories like a classifier', ageBands: ['A','B','C'], has3D: true },
  { id: 6, name: 'Treat Trainer', slug: 'treat-trainer', lab: 2, labName: 'AI Assistants', tier: 'standard', icon: '🦴', description: 'Teach an AI pet using rewards and penalties', ageBands: ['A','B','C'], has3D: true },
  { id: 7, name: 'Data Detective', slug: 'data-detective', lab: 2, labName: 'AI Assistants', tier: 'fl-lite', icon: '🔎', description: 'Investigate datasets for patterns and anomalies', ageBands: ['A','B','C'], has3D: true },
  { id: 8, name: 'Neural Builder', slug: 'neural-builder', lab: 3, labName: 'How AI Learns', tier: 'flagship', icon: '🧠', description: 'Build and train a neural network visually', ageBands: ['A','B','C'], has3D: true },
  { id: 9, name: 'Neuron Relay', slug: 'neuron-relay', lab: 3, labName: 'How AI Learns', tier: 'standard', icon: '⚡', description: 'Pass signals through a neural network relay', ageBands: ['A','B','C'], has3D: true },
  { id: 10, name: 'Pixel Investigator', slug: 'pixel-investigator', lab: 3, labName: 'How AI Learns', tier: 'standard', icon: '🖼️', description: 'Explore how AI sees and processes images', ageBands: ['B','C'], has3D: true },
  { id: 11, name: 'Prompt Lab', slug: 'prompt-lab', lab: 4, labName: 'AI & Language', tier: 'flagship', icon: '💬', description: 'Craft prompts and see how AI responds', ageBands: ['A','B','C'], has3D: true },
  { id: 12, name: 'Word Predictor', slug: 'word-predictor', lab: 4, labName: 'AI & Language', tier: 'standard', icon: '📝', description: 'Predict the next word like a language model', ageBands: ['A','B','C'], has3D: true },
  { id: 13, name: 'Token Chopper', slug: 'token-chopper', lab: 4, labName: 'AI & Language', tier: 'standard', icon: '✂️', description: 'Break text into tokens like an AI tokenizer', ageBands: ['B','C'], has3D: true },
  { id: 14, name: 'AI Art Detective', slug: 'ai-art-detective', lab: 4, labName: 'AI & Language', tier: 'standard', icon: '🎨', description: 'Determine if artwork was made by AI or human', ageBands: ['A','B','C'], has3D: true },
  { id: 15, name: 'Agent Architect', slug: 'agent-architect', lab: 5, labName: 'AI Agents', tier: 'flagship', icon: '🏗️', description: 'Design and wire up an AI agent pipeline', ageBands: ['A','B','C'], has3D: true },
  { id: 16, name: 'Robot Vacuum', slug: 'robot-vacuum', lab: 5, labName: 'AI Agents', tier: 'fl-lite', icon: '🤖', description: 'Program a robot vacuum to navigate rooms', ageBands: ['A','B','C'], has3D: true },
  { id: 17, name: 'Tool Picker', slug: 'tool-picker', lab: 6, labName: 'AI & Society', tier: 'standard', icon: '🔧', description: 'Match the right AI tool to each task', ageBands: ['A','B','C'], has3D: true },
  { id: 18, name: 'Bias Detective', slug: 'bias-detective', lab: 6, labName: 'AI & Society', tier: 'flagship', icon: '⚖️', description: 'Detect and fix bias in AI systems', ageBands: ['B','C'], has3D: true },
  { id: 19, name: 'Data Shield', slug: 'data-shield', lab: 6, labName: 'AI & Society', tier: 'standard', icon: '🛡️', description: 'Protect personal data from AI misuse', ageBands: ['A','B','C'], has3D: true },
  { id: 20, name: 'Real or Fake', slug: 'real-or-fake', lab: 6, labName: 'AI & Society', tier: 'standard', icon: '🔮', description: 'Spot AI-generated content vs real content', ageBands: ['A','B','C'], has3D: true },
  { id: 21, name: 'Ethics Courtroom', slug: 'ethics-courtroom', lab: 6, labName: 'AI & Society', tier: 'standard', icon: '⚖️', description: 'Judge AI ethics cases as a courtroom judge', ageBands: ['B','C'], has3D: true },
  { id: 22, name: 'Camera Quest', slug: 'camera-quest', lab: 7, labName: 'Computer Vision', tier: 'fl-lite', icon: '📸', description: 'Explore how AI camera systems see the world', ageBands: ['A','B','C'], has3D: true },
  { id: 23, name: 'Fool the AI', slug: 'fool-the-ai', lab: 7, labName: 'Computer Vision', tier: 'standard', icon: '🎭', description: 'Create adversarial examples to trick AI', ageBands: ['B','C'], has3D: true },
  { id: 24, name: 'Build Classifier', slug: 'build-classifier', lab: 7, labName: 'Computer Vision', tier: 'standard', icon: '📊', description: 'Build an image classifier step by step', ageBands: ['B','C'], has3D: true },
  { id: 25, name: 'Prediction Market', slug: 'prediction-market', lab: 7, labName: 'Computer Vision', tier: 'standard', icon: '📈', description: 'Predict outcomes and calibrate confidence', ageBands: ['B','C'], has3D: true },
  { id: 26, name: 'Sentiment Scanner', slug: 'sentiment-scanner', lab: 8, labName: 'AI Communication', tier: 'standard', icon: '😊', description: 'Analyze the sentiment of text like an AI', ageBands: ['A','B','C'], has3D: true },
  { id: 27, name: 'Chatbot Builder', slug: 'chatbot-builder', lab: 8, labName: 'AI Communication', tier: 'fl-lite', icon: '💭', description: 'Design conversation flows for a chatbot', ageBands: ['B','C'], has3D: true },
  { id: 28, name: 'Lost in Translation', slug: 'lost-in-translation', lab: 8, labName: 'AI Communication', tier: 'standard', icon: '🌍', description: 'See how AI translation can go wrong', ageBands: ['A','B','C'], has3D: true },
  { id: 29, name: 'Emoji Decoder', slug: 'emoji-decoder', lab: 8, labName: 'AI Communication', tier: 'fl-lite', icon: '😎', description: 'Decode emoji sequences into meaning', ageBands: ['A','B'], has3D: true },
  { id: 30, name: 'Code Blocks', slug: 'code-blocks', lab: 9, labName: 'Building with AI', tier: 'fl-lite', icon: '🧩', description: 'Snap code blocks together to build programs', ageBands: ['A','B','C'], has3D: true },
  { id: 31, name: 'Career Explorer', slug: 'career-explorer', lab: 9, labName: 'Building with AI', tier: 'standard', icon: '🎯', description: 'Discover AI-related career paths', ageBands: ['B','C'], has3D: true },
  { id: 32, name: 'API Explorer', slug: 'api-explorer', lab: 9, labName: 'Building with AI', tier: 'standard', icon: '🔌', description: 'Learn how APIs connect AI services', ageBands: ['C'], has3D: true },
  { id: 33, name: 'My First AI App', slug: 'my-first-ai-app', lab: 9, labName: 'Building with AI', tier: 'fl-lite', icon: '📱', description: 'Build your first AI-powered application', ageBands: ['A','B','C'], has3D: true },
  { id: 34, name: 'Future Forge', slug: 'future-forge', lab: 10, labName: 'AI Futures', tier: 'fl-lite', icon: '🚀', description: 'Design the future of AI technology', ageBands: ['A','B','C'], has3D: true },
  { id: 35, name: 'AI or Not?', slug: 'ai-or-not', lab: 10, labName: 'AI Futures', tier: 'fl-lite', icon: '🤔', description: 'Determine what is and isn\'t AI', ageBands: ['A','B'], has3D: true },
];

const TIER_CONFIG: Record<GameTier, { label: string; color: string; badge: string }> = {
  flagship: { label: 'Flagship', color: '#00BBFF', badge: '3D' },
  'fl-lite': { label: 'Enhanced', color: '#00FF88', badge: '3D' },
  standard: { label: 'Standard', color: '#FFAA44', badge: '' },
};

export default function ArcadePage() {
  const [search, setSearch] = useState('');
  const [selectedLab, setSelectedLab] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<GameTier | null>(null);

  const filtered = useMemo(() => {
    return GAMES.filter(g => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedLab !== null && g.lab !== selectedLab) return false;
      if (selectedTier !== null && g.tier !== selectedTier) return false;
      return true;
    });
  }, [search, selectedLab, selectedTier]);

  const grouped = useMemo(() => {
    const map = new Map<number, ArcadeGame[]>();
    for (const g of filtered) {
      if (!map.has(g.lab)) map.set(g.lab, []);
      map.get(g.lab)!.push(g);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Game Arcade
        </h1>
        <p className="font-body text-white/50 text-sm">
          35 interactive AI games across 10 Labs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111118] border border-white/[0.06] text-white/80 font-body text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00BBFF]/40"
            aria-label="Search games"
          />
        </div>

        {/* Lab filter */}
        <select
          value={selectedLab ?? ''}
          onChange={e => setSelectedLab(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2.5 rounded-xl bg-[#111118] border border-white/[0.06] text-white/70 font-body text-sm focus:outline-none focus:border-[#00BBFF]/40 appearance-none cursor-pointer"
          aria-label="Filter by Lab"
        >
          <option value="">All Labs</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Lab {i + 1}: {LAB_NAMES[i + 1]}</option>
          ))}
        </select>

        {/* Tier filter */}
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
      <div className="flex items-center gap-6 mb-6 text-xs font-data text-white/30">
        <span>{filtered.length} games</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {filtered.filter(g => g.tier === 'flagship').length} flagship
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          {filtered.filter(g => g.has3D).length} with 3D
        </span>
      </div>

      {/* Game Grid by Lab */}
      <div className="space-y-10">
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
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: LAB_COLORS[lab] }}
                />
                <h2 className="font-display text-lg font-bold text-white/80">
                  Lab {lab}: {LAB_NAMES[lab]}
                </h2>
                <span className="text-xs font-data text-white/25">
                  {games.length} game{games.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Games grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {games.map(game => (
                  <Link
                    key={game.slug}
                    href={`/arcade/${game.slug}`}
                    className="group block"
                  >
                    <motion.div
                      className="relative rounded-xl border border-white/[0.06] bg-[#111118] p-4 transition-all hover:border-white/[0.12] hover:bg-[#1A1822]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        boxShadow: `0 0 0 1px ${LAB_COLORS[game.lab]}08`,
                      }}
                    >
                      {/* Tier badge */}
                      {game.has3D && (
                        <div
                          className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-data font-bold"
                          style={{
                            backgroundColor: `${TIER_CONFIG[game.tier].color}18`,
                            color: TIER_CONFIG[game.tier].color,
                          }}
                        >
                          <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                          3D
                        </div>
                      )}

                      {/* Icon + Name */}
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl" aria-hidden="true">{game.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">
                            {game.name}
                          </h3>
                          <p className="font-body text-xs text-white/35 mt-0.5 line-clamp-2">
                            {game.description}
                          </p>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                        <div className="flex gap-1">
                          {game.ageBands.map(band => (
                            <span
                              key={band}
                              className="text-xs font-data text-white/25 px-1.5 py-0.5 rounded bg-white/[0.03]"
                            >
                              {band === 'A' ? '7-9' : band === 'B' ? '10-12' : '13-16'}
                            </span>
                          ))}
                        </div>
                        <span
                          className="text-xs font-data"
                          style={{ color: `${LAB_COLORS[game.lab]}80` }}
                        >
                          {game.tier === 'flagship' ? 'Flagship' : game.tier === 'fl-lite' ? 'Enhanced' : 'Standard'}
                        </span>
                      </div>

                      {/* Glow edge */}
                      <div
                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                          boxShadow: `inset 0 0 20px ${LAB_COLORS[game.lab]}08, 0 0 15px ${LAB_COLORS[game.lab]}05`,
                        }}
                      />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="font-body text-white/30 text-sm">No games match your filters</p>
          <button
            onClick={() => { setSearch(''); setSelectedLab(null); setSelectedTier(null); }}
            className="mt-3 text-xs font-display text-[#00BBFF]/60 hover:text-[#00BBFF] transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
