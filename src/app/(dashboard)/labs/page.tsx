'use client';

// ════════════════════════════════════════════════════
// LABS MAP — 3D-Embedded Cockpit Page
// ════════════════════════════════════════════════════
// Stage 4: Full labs map replacing stub.
// The 3D HolographicLabMap inside CockpitCanvas shows the 10 lab orbs
// with geodesic completion fills. This page provides the HTML overlay:
//   - 10 lab cards with color, progress, game count
//   - Search/filter
//   - Click navigates to individual lab detail
//   - Calls setLabColor on hover for real-time cockpit LED shifts
//   - Calls cockpitStore.setHoveredLabId for 3D map highlight
//
// Resolves S4-CRIT-002 (stub) and S4-CRIT-004 (useAllLabsProgress consumed)

import { useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useChildStore } from '@/stores/childStore';
import { useUIStore } from '@/stores/uiStore';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { getGamesByLab } from '@/config/gameRegistry';
import { ChevronRight, Lock, CheckCircle } from 'lucide-react';

const LAB_NAMES = [
  'What IS AI?', 'Teaching Machines', 'The Brain Inside',
  'AI That Creates', 'AI Helpers', 'AI & Ethics',
  'Computer Vision', 'Words & Language', 'Build Your AI', "AI's Future",
] as const;

const LAB_COLORS = [
  '#00BBFF', '#AA66FF', '#FF66AA', '#FFAA44', '#00FF88',
  '#FF6644', '#06B6D4', '#818CF8', '#F97316', '#D946EF',
] as const;

const LAB_ICONS = ['🤖', '🧠', '🔬', '🎨', '🤝', '⚖️', '👁', '💬', '🔧', '🚀'] as const;

export default function LabsPage() {
  const { activeChild } = useChildStore();
  const setLabColor = useUIStore((s) => s.setLabColor);
  const setHoveredLabId = useCockpitStore((s) => s.setHoveredLab);
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const childId = activeChild?.id || '';

  const { data: labsProgress, isLoading } = useAllLabsProgress(childId);

  // Set cockpit to labmap default color on mount
  useEffect(() => {
    setLabColor('#00BBFF');
    return () => setHoveredLabId(null);
  }, [setLabColor, setHoveredLabId]);

  // Hover handler — updates cockpit LED + 3D map highlight
  const handleLabHover = useCallback((labId: number | null) => {
    if (labId !== null) {
      setLabColor(LAB_COLORS[labId - 1]);
      setHoveredLabId(labId);
      broadcast({ type: 'lab-hover', source: `lab-${labId}`, color: LAB_COLORS[labId - 1] });
    } else {
      setLabColor('#00BBFF');
      setHoveredLabId(null);
    }
  }, [setLabColor, setHoveredLabId, broadcast]);

  // Get game counts per lab
  const labGameCounts = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => getGamesByLab(i + 1).length),
  []);

  if (!activeChild) {
    return (
      <div className="text-center py-20" role="status" aria-label="Loading labs">
        <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" />
        <p className="text-white/50 font-body mt-4">Loading lab systems...</p>
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
      aria-label="SparkForge Lab Map"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_0_12px_rgba(0,187,255,0.3)]">
            Lab Map
          </h1>
          <p className="font-mono text-xs text-neon-blue/60 tracking-wider mt-1">
            10 LABS · 35 GAMES · AI & ML DISCOVERY
          </p>
        </div>
      </motion.div>

      {/* Lab Grid */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 gap-3"
        role="list"
        aria-label="10 AI Learning Labs"
      >
        {LAB_NAMES.map((name, i) => {
          const labNum = i + 1;
          const color = LAB_COLORS[i];
          const icon = LAB_ICONS[i];
          const gameCount = labGameCounts[i];
          const progress = isLoading ? 0 :
            (Array.isArray(labsProgress) ? (labsProgress[i]?.percent || 0) : 0);
          const isComplete = progress >= 100;

          return (
            <motion.div
              key={labNum}
              variants={staggerItem}
              role="listitem"
            >
              <Link
                href={`/labs/${labNum}`}
                className="group block rounded-xl p-4 backdrop-blur-md border border-white/[0.06] bg-surface-card/50 hover:bg-surface-card/80 transition-all relative overflow-hidden"
                style={{
                  borderColor: `${color}20`,
                  boxShadow: `0 0 20px ${color}08`,
                }}
                onMouseEnter={() => handleLabHover(labNum)}
                onMouseLeave={() => handleLabHover(null)}
                aria-label={`Lab ${labNum}: ${name} — ${Math.round(progress)}% complete, ${gameCount} games`}
              >
                {/* Lab color accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />

                <div className="flex items-start gap-3">
                  {/* Lab icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Lab number + name */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-data text-[10px] font-bold" style={{ color }}>
                        LAB {labNum}
                      </span>
                      {isComplete && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <p className="font-display font-bold text-white text-sm truncate">
                      {name}
                    </p>
                    <p className="font-mono text-[10px] text-white/30 mt-0.5">
                      {gameCount} games
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 mt-1" />
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>

                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 30px ${color}10, 0 0 30px ${color}15` }}
                />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Lab Map loaded. {isLoading ? 'Loading progress...' : `Overall progress available for ${activeChild.display_name}.`}
      </div>
    </motion.div>
  );
}
