// Preview + live catalog for Forge Lab hologram panels.
// Lucide icons only — no new emoji (no-emoji ratchet).

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
import { getGamesByLab, type GameRegistryEntry } from '@/config/gameRegistry';

export interface HubStats {
  childName: string;
  xp: number;
  level: number;
  streak: number;
  labName: string;
}

export interface LabRow {
  num: number;
  name: string;
  color: string;
  poetic: string;
  gamesCount: number;
  progress: number;
  Icon: LucideIcon;
  games: GameRegistryEntry[];
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

export const LAB_ICONS: Record<number, LucideIcon> = {
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

export interface LabProgressRow {
  lab?: number;
  labId?: number;
  percent?: number;
}

export function buildLabRows(
  progressRows?: ReadonlyArray<LabProgressRow> | null,
): LabRow[] {
  const byId = new Map<number, number>();
  for (const row of progressRows ?? []) {
    const id = row.labId ?? row.lab;
    if (typeof id === 'number') byId.set(id, row.percent ?? 0);
  }

  return Array.from({ length: 11 }, (_, i) => {
    const num = i + 1;
    const games = getGamesByLab(num);
    return {
      num,
      name: LAB_NAMES[num] || `Lab ${num}`,
      color: LAB_COLORS[num] || '#00BBFF',
      poetic: LAB_POETIC[num] || '',
      gamesCount: games.length,
      progress: byId.get(num) ?? 0,
      Icon: LAB_ICONS[num] ?? Bot,
      games,
    };
  });
}

export const PREVIEW_STATS: HubStats = {
  childName: 'Nova',
  xp: 345,
  level: 4,
  streak: 7,
  labName: 'Pattern Lab',
};

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

const SPARKY_LINES = [
  'The core is warm. Tap SF and we will unfold the lab.',
  'Panels fly from the monogram — that is the portal, not a menu bar.',
  'Pick a lab. I will keep the gauges honest.',
  'Streaks live in the top glass. I am just the voice in the bay.',
  'Avatar kit is a stub. Your face still belongs to you.',
  'Games stay on the arcade. This bay is only a mount.',
];

export function sparkyLine(seed: number): string {
  return SPARKY_LINES[Math.abs(seed) % SPARKY_LINES.length];
}

/** XP toward the current 100-point level band (home-page heuristic). */
export function xpDialValue(xp: number, level: number): number {
  const intoLevel = xp - Math.max(0, (level - 1) * 100);
  return Math.min(1, Math.max(0, intoLevel / 100));
}

export function pickContinueLab(labs: LabRow[]): number {
  const started = labs.filter((l) => l.progress > 0 && l.progress < 100);
  if (started.length > 0) {
    return started.reduce((a, b) => (a.progress > b.progress ? a : b)).num;
  }
  return labs.find((l) => l.progress === 0)?.num ?? 1;
}
