// ════════════════════════════════════════════════════════════════
// Mission Control — lab instrument metadata + layout math
// ════════════════════════════════════════════════════════════════
// Pods are instruments around a holographic core, not a CSS-grid of
// feature cards. Lucide glyphs (not emoji) so the no-emoji ratchet
// stays put and the HUD reads like mood-02 line-art tiles.

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Brain,
  Cpu,
  Palette,
  Wrench,
  Scale,
  Eye,
  MessageCircle,
  Laptop,
  Rocket,
  Share2,
} from 'lucide-react';
import { LAB_COLORS, LAB_NAMES } from '@/config/labs';
import { getGamesByLab } from '@/config/gameRegistry';

export type CrystalVariant = 'cube' | 'octa' | 'diamond' | 'pyramid';

export interface LabInstrument {
  num: number;
  name: string;
  color: string;
  poetic: string;
  gamesCount: number;
  progress: number;
  crystal: CrystalVariant;
  Icon: LucideIcon;
}

export interface HubStats {
  childName: string;
  xp: number;
  level: number;
  streak: number;
}

export const LAB_POETIC: Record<number, string> = {
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

export const LAB_INSTRUMENT_ICONS: Record<number, LucideIcon> = {
  1: Bot,
  2: Brain,
  3: Cpu,
  4: Palette,
  5: Wrench,
  6: Scale,
  7: Eye,
  8: MessageCircle,
  9: Laptop,
  10: Rocket,
  11: Share2,
};

const CRYSTALS: CrystalVariant[] = ['cube', 'octa', 'diamond', 'pyramid'];

export interface LabProgressRow {
  lab?: number;
  labId?: number;
  percent?: number;
}

export function buildLabInstruments(
  progressRows?: ReadonlyArray<LabProgressRow> | null,
): LabInstrument[] {
  const byId = new Map<number, number>();
  for (const row of progressRows ?? []) {
    const id = row.labId ?? row.lab;
    if (typeof id === 'number') byId.set(id, row.percent ?? 0);
  }

  return Array.from({ length: 11 }, (_, i) => {
    const num = i + 1;
    return {
      num,
      name: LAB_NAMES[num] || `Lab ${num}`,
      color: LAB_COLORS[num] || '#0FB8FA',
      poetic: LAB_POETIC[num] || '',
      gamesCount: getGamesByLab(num).length,
      progress: byId.get(num) ?? 0,
      crystal: CRYSTALS[i % CRYSTALS.length],
      Icon: LAB_INSTRUMENT_ICONS[num] ?? Bot,
    };
  });
}

export interface PodPoint {
  left: number;
  top: number;
  depth: number;
}

/**
 * Place 11 pods on an ellipse around the core, leaving the bottom open
 * for the CTA + GameShell bay. Depth jitter keeps them from reading as
 * a flat 2×N card grid.
 */
export function computePodLayout(count: number): PodPoint[] {
  const rx = 38;
  const ry = 32;
  const startDeg = -148;
  const endDeg = 148;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const deg = startDeg + t * (endDeg - startDeg);
    const rad = (deg * Math.PI) / 180;
    const ring = i % 3 === 0 ? 1 : i % 3 === 1 ? 0.86 : 0.74;
    return {
      left: 50 + rx * ring * Math.sin(rad),
      top: 44 - ry * ring * Math.cos(rad),
      depth: ring,
    };
  });
}

export const PREVIEW_STATS: HubStats = {
  childName: 'Nova',
  xp: 345,
  level: 4,
  streak: 7,
};

/** Varied preview percents so gauges and pod fills read as live instruments. */
export const PREVIEW_PROGRESS: LabProgressRow[] = [
  { labId: 1, percent: 82 },
  { labId: 2, percent: 54 },
  { labId: 3, percent: 31 },
  { labId: 4, percent: 12 },
  { labId: 5, percent: 67 },
  { labId: 6, percent: 8 },
  { labId: 7, percent: 44 },
  { labId: 8, percent: 21 },
  { labId: 9, percent: 0 },
  { labId: 10, percent: 16 },
  { labId: 11, percent: 5 },
];

export function pickContinueLab(labs: LabInstrument[]): number {
  const started = labs.filter((l) => l.progress > 0 && l.progress < 100);
  if (started.length > 0) {
    return started.reduce((a, b) => (a.progress > b.progress ? a : b)).num;
  }
  const untouched = labs.find((l) => l.progress === 0);
  return untouched?.num ?? 1;
}

/** XP toward next level — 100 XP per level, matching the home-page heuristic. */
export function xpDialValue(xp: number, level: number): number {
  const intoLevel = xp - Math.max(0, (level - 1) * 100);
  return Math.min(1, Math.max(0, intoLevel / 100));
}
