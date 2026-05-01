// src/hooks/useAtelierStats.ts
// ════════════════════════════════════════════════════════════════
// Stage 11A — Lab 11 Holographic Dashboard data hooks
// ════════════════════════════════════════════════════════════════
// Read-only React-Query hooks for the agent_compositions table that
// power the Lab 11 dashboard's stats panels, mission radar, and
// milestone tiles. RLS gates parent-id ownership; same auth path as
// agentAtelierStore.loadCompositions but kept SEPARATE from store
// state so dashboard reads don't collide with active game session
// state.
// ════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { AgentComposition, PlacedAgent, Wire } from '@/types/agentAtelier';
import { AGENT_ROSTER } from '@/lib/agentatelier/agentRoster';
import { HARDCODED_MISSIONS } from '@/lib/agentatelier/missionLibrary';

// ─── Saved-compositions query ────────────────────────────────────

/** Loads a child's saved Agent Atelier compositions, newest first. */
export function useAtelierSaves(childId: string) {
  return useQuery<AgentComposition[]>({
    queryKey: ['atelier', 'saves', childId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agent_compositions')
        .select('id, child_id, name, team, wires, created_at')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      type DBRow = {
        id: string;
        child_id: string;
        name: string;
        team: PlacedAgent[];
        wires: Wire[];
        created_at: string;
      };
      return (data as DBRow[] | null ?? []).map((r) => ({
        id: r.id,
        childId: r.child_id,
        name: r.name,
        team: r.team,
        wires: r.wires,
        createdAt: r.created_at,
      }));
    },
    enabled: !!childId,
    staleTime: 60 * 1000,
  });
}

// ─── Derived stats ───────────────────────────────────────────────

export interface AtelierStats {
  totalSaves: number;
  /** Total agents placed across all saves (one per PlacedAgent slot, not unique). */
  totalAgentsPlaced: number;
  /** Total wires across all saves. */
  totalWires: number;
  /** Average team size (per-save mean), rounded to 1dp. */
  avgTeamSize: number;
  /** Most-used specialist agentId across all saves (null if no saves). */
  topSpecialistId: string | null;
  /** Per-agent placement frequency, sorted desc. */
  specialistFrequency: Array<{ agentId: string; placements: number }>;
  /** Per-mission attempts: which of the 8 hardcoded mission templates have saves
   *  derived from them (we infer mission template from the save's name as a heuristic
   *  — saves don't store missionId per the Stage 11D schema). */
  missionDistribution: Array<{ missionFamily: string; saves: number }>;
  /** ISO timestamp of the most recent save, or null. */
  lastSaveAt: string | null;
  /** Wires-to-agents ratio (a rough wiring-density metric). */
  wiringDensity: number;
}

/** Empty stats for the no-data case, surfaced when childId is unset
 *  or the user has zero saved compositions. */
const EMPTY_STATS: AtelierStats = {
  totalSaves: 0,
  totalAgentsPlaced: 0,
  totalWires: 0,
  avgTeamSize: 0,
  topSpecialistId: null,
  specialistFrequency: AGENT_ROSTER.map((a) => ({ agentId: a.id, placements: 0 })),
  missionDistribution: [],
  lastSaveAt: null,
  wiringDensity: 0,
};

export function useAtelierStats(childId: string): {
  data: AtelierStats;
  isLoading: boolean;
  isError: boolean;
} {
  const { data: saves, isLoading, isError } = useAtelierSaves(childId);

  const stats = useMemo<AtelierStats>(() => {
    if (!saves || saves.length === 0) return EMPTY_STATS;

    const totalSaves = saves.length;
    const totalAgentsPlaced = saves.reduce((s, c) => s + c.team.length, 0);
    const totalWires = saves.reduce((s, c) => s + c.wires.length, 0);
    const avgTeamSize = Math.round((totalAgentsPlaced / totalSaves) * 10) / 10;

    // Specialist frequency.
    const freqMap = new Map<string, number>();
    for (const a of AGENT_ROSTER) freqMap.set(a.id, 0);
    for (const c of saves) {
      for (const p of c.team) {
        freqMap.set(p.agentId, (freqMap.get(p.agentId) ?? 0) + 1);
      }
    }
    const specialistFrequency = [...freqMap.entries()]
      .map(([agentId, placements]) => ({ agentId, placements }))
      .sort((a, b) => b.placements - a.placements);
    const topSpecialistId = specialistFrequency[0]?.placements > 0 ? specialistFrequency[0].agentId : null;

    // Mission distribution: heuristically match the save's name against the 8
    // mission family titles. A save called "Birthday Plan v1" matches the
    // birthday-plan family. Saves whose names don't match any family are
    // bucketed into 'custom'.
    const missionFamilies = ['birthday-plan', 'fact-check', 'lunchbox', 'story-editor', 'homework', 'travel-trio', 'pet-schedule', 'build-joke'];
    const familyTitleMap: Record<string, string[]> = {};
    for (const fam of missionFamilies) {
      familyTitleMap[fam] = HARDCODED_MISSIONS
        .filter((m) => m.id.startsWith(fam + '-'))
        .map((m) => m.title.toLowerCase());
    }
    const missionMap = new Map<string, number>();
    for (const fam of missionFamilies) missionMap.set(fam, 0);
    missionMap.set('custom', 0);
    for (const c of saves) {
      const lower = c.name.toLowerCase();
      let matched: string | null = null;
      for (const fam of missionFamilies) {
        for (const title of familyTitleMap[fam]) {
          // Match on either the family slug or any title keyword (first word of title).
          const firstWord = title.split(' ')[0];
          if (lower.includes(fam) || lower.includes(firstWord)) {
            matched = fam;
            break;
          }
        }
        if (matched) break;
      }
      const key = matched ?? 'custom';
      missionMap.set(key, (missionMap.get(key) ?? 0) + 1);
    }
    const missionDistribution = [...missionMap.entries()]
      .filter(([, n]) => n > 0)
      .map(([missionFamily, saves]) => ({ missionFamily, saves }))
      .sort((a, b) => b.saves - a.saves);

    const lastSaveAt = saves[0]?.createdAt ?? null;
    const wiringDensity = totalAgentsPlaced > 0 ? totalWires / totalAgentsPlaced : 0;

    return {
      totalSaves,
      totalAgentsPlaced,
      totalWires,
      avgTeamSize,
      topSpecialistId,
      specialistFrequency,
      missionDistribution,
      lastSaveAt,
      wiringDensity,
    };
  }, [saves]);

  return { data: stats, isLoading, isError };
}

// ─── Milestones ──────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  /** Hint shown when locked. */
  hint: string;
  /** Progress fraction 0..1. */
  progress: number;
  /** True when fully unlocked. */
  unlocked: boolean;
  /** Visual emoji. */
  emoji: string;
}

const MILESTONE_DEFS: Array<{
  id: string;
  title: string;
  hint: string;
  emoji: string;
  /** Returns a 0..1 progress fraction for this milestone given current stats. */
  progressOf: (s: AtelierStats) => number;
}> = [
  {
    id: 'first-save',
    title: 'First Composition',
    hint: 'Save your first team',
    emoji: '🌱',
    progressOf: (s) => Math.min(1, s.totalSaves / 1),
  },
  {
    id: 'apprentice',
    title: 'Atelier Apprentice',
    hint: 'Save 5 compositions',
    emoji: '🛠️',
    progressOf: (s) => Math.min(1, s.totalSaves / 5),
  },
  {
    id: 'crafter',
    title: 'Composition Crafter',
    hint: 'Save 10 compositions',
    emoji: '🎨',
    progressOf: (s) => Math.min(1, s.totalSaves / 10),
  },
  {
    id: 'diversity',
    title: 'Mission Diversity',
    hint: 'Tackle 4 different mission families',
    emoji: '🗂️',
    progressOf: (s) => Math.min(1, s.missionDistribution.filter((m) => m.missionFamily !== 'custom').length / 4),
  },
  {
    id: 'wiring-master',
    title: 'Wiring Master',
    hint: 'Build a team with 10 or more wires',
    emoji: '⚡',
    progressOf: (s) => Math.min(1, s.totalWires / 10),
  },
  {
    id: 'roster-explorer',
    title: 'Roster Explorer',
    hint: 'Place at least 8 different specialists across your saves',
    emoji: '🎭',
    progressOf: (s) => Math.min(1, s.specialistFrequency.filter((f) => f.placements > 0).length / 8),
  },
];

export function useLabMilestones(childId: string): {
  data: Milestone[];
  isLoading: boolean;
} {
  const { data: stats, isLoading } = useAtelierStats(childId);
  const milestones = useMemo<Milestone[]>(() => {
    return MILESTONE_DEFS.map((def) => {
      const progress = def.progressOf(stats);
      return {
        id: def.id,
        title: def.title,
        hint: def.hint,
        emoji: def.emoji,
        progress,
        unlocked: progress >= 1,
      };
    });
  }, [stats]);
  return { data: milestones, isLoading };
}

// ─── Mission family display metadata ─────────────────────────────

export const MISSION_FAMILY_META: Record<string, { label: string; emoji: string }> = {
  'birthday-plan': { label: 'Birthday Plan', emoji: '🎂' },
  'fact-check': { label: 'Fact Check', emoji: '🔍' },
  'lunchbox': { label: 'Lunchbox', emoji: '🥪' },
  'story-editor': { label: 'Story Editor', emoji: '📝' },
  'homework': { label: 'Homework Hot Seat', emoji: '➗' },
  'travel-trio': { label: 'Travel Trio', emoji: '🚆' },
  'pet-schedule': { label: 'Pet Schedule', emoji: '🐹' },
  'build-joke': { label: 'Build a Joke', emoji: '😂' },
  'custom': { label: 'Custom', emoji: '✨' },
};
