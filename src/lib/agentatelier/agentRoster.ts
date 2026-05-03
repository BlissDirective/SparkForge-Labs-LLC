// src/lib/agentatelier/agentRoster.ts
// ================================================================
// Stage 11D — Agent Atelier (C1)
// ================================================================
// 12-specialist roster across 3 unlock tiers (4 each at A/B/C bands).
// See docs/stage11-new-flagships/STAGE11D_v3FINAL.md §6 for the
// canonical table. Port-type compatibility is enforced at wire-add
// time by `wireGraph.canConnect`.
//
// Accent colors are drawn from the SparkForge palette so each
// specialist's 3D figure + trace packets stay visually distinct.
// ================================================================

import type { AgentSpec } from '@/types/agentAtelier';

export const AGENT_ROSTER: readonly AgentSpec[] = [
  // ─── Tier A (always available, band A entry) ─────────────────
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Looks things up',
    unlockTier: 'A',
    inputs:  [{ name: 'topic', type: 'text' }],
    outputs: [{ name: 'facts', type: 'list' }],
    accentHex: '#0FB8FA',
    blurb: 'Pulls together facts about a topic so the rest of the team has good info.',
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Turns notes into prose',
    unlockTier: 'A',
    inputs:  [
      { name: 'notes', type: 'list' },
      { name: 'tone',  type: 'text' },
    ],
    outputs: [{ name: 'text', type: 'text' }],
    accentHex: '#B67BFF',
    blurb: 'Takes a list of notes and writes a clear, friendly paragraph or two.',
  },
  {
    id: 'planner',
    name: 'Planner',
    role: 'Breaks goals into steps',
    unlockTier: 'A',
    inputs:  [{ name: 'goal', type: 'text' }],
    outputs: [{ name: 'steps', type: 'plan' }],
    accentHex: '#00D17A',
    blurb: 'Splits a big goal into ordered, small, doable steps.',
  },
  {
    id: 'estimator',
    name: 'Estimator',
    role: 'Predicts time + cost',
    unlockTier: 'A',
    inputs:  [{ name: 'task', type: 'text' }],
    outputs: [
      { name: 'time', type: 'number' },
      { name: 'cost', type: 'number' },
    ],
    accentHex: '#D9A430',
    blurb: 'Guesses how long a task will take and how much it costs.',
  },

  // ─── Tier B (unlock at band B, ages 10-12) ───────────────────
  {
    id: 'critic',
    name: 'Critic',
    role: 'Finds flaws',
    unlockTier: 'B',
    inputs:  [{ name: 'artifact', type: 'text' }],
    outputs: [{ name: 'issues', type: 'list' }],
    accentHex: '#FF7050',
    blurb: 'Reads what the team made and lists what could be better.',
  },
  {
    id: 'coder',
    name: 'Coder',
    role: 'Writes small programs',
    unlockTier: 'B',
    inputs:  [{ name: 'spec', type: 'text' }],
    outputs: [{ name: 'code', type: 'code' }],
    accentHex: '#10BAD2',
    blurb: 'Turns a description into a tiny working program.',
  },
  {
    id: 'translator',
    name: 'Translator',
    role: 'Switches languages or styles',
    unlockTier: 'B',
    inputs:  [
      { name: 'text',   type: 'text' },
      { name: 'target', type: 'text' },
    ],
    outputs: [{ name: 'text', type: 'text' }],
    accentHex: '#FF70AF',
    blurb: 'Rewrites text into another language or a different tone.',
  },
  {
    id: 'summarizer',
    name: 'Summarizer',
    role: 'Compresses long text',
    unlockTier: 'B',
    inputs:  [
      { name: 'text',   type: 'text' },
      { name: 'budget', type: 'number' },
    ],
    outputs: [{ name: 'text', type: 'text' }],
    accentHex: '#8F96FA',
    blurb: 'Shrinks a long text into a short version that keeps the key points.',
  },

  // ─── Tier C (unlock at band C, ages 13-16) ───────────────────
  {
    id: 'router',
    name: 'Router',
    role: 'Picks who runs next',
    unlockTier: 'C',
    inputs:  [{ name: 'state', type: 'text' }],
    outputs: [{ name: 'next_agent', type: 'text' }],
    accentHex: '#6FFFE6',
    blurb: 'Looks at the current state and decides which teammate should run next.',
  },
  {
    id: 'toolsmith',
    name: 'Toolsmith',
    role: 'Wraps an outside tool',
    unlockTier: 'C',
    inputs:  [{ name: 'request', type: 'tool_request' }],
    outputs: [{ name: 'tool_result', type: 'text' }],
    accentHex: '#E68E28',
    blurb: 'Calls an outside tool (calculator, calendar, dictionary) and brings back the answer.',
  },
  {
    id: 'judge',
    name: 'Judge',
    role: 'Scores final outputs',
    unlockTier: 'C',
    inputs:  [
      { name: 'artifact', type: 'text' },
      { name: 'rubric',   type: 'list' },
    ],
    outputs: [{ name: 'grade', type: 'number' }],
    accentHex: '#DE5AEA',
    blurb: 'Reads the team’s final output, applies a rubric, and gives a score.',
  },
  {
    id: 'memory',
    name: 'Memory',
    role: 'Remembers across runs',
    unlockTier: 'C',
    inputs:  [
      { name: 'key',   type: 'text' },
      { name: 'value', type: 'text' },
    ],
    outputs: [{ name: 'recall', type: 'text' }],
    accentHex: '#0FB8FA',
    blurb: 'Stores a fact under a key so a later teammate can recall it.',
  },
] as const;

// ─── Lookup helpers ──────────────────────────────────────────────

export function getAgent(id: string): AgentSpec | undefined {
  return AGENT_ROSTER.find((a) => a.id === id);
}

/** Roster filtered to the agents available at a given band.
 *  Tier A is always included; B-band adds tier B; C-band adds tiers B+C. */
export function rosterForBand(band: 'A' | 'B' | 'C'): AgentSpec[] {
  if (band === 'A') return AGENT_ROSTER.filter((a) => a.unlockTier === 'A');
  if (band === 'B') return AGENT_ROSTER.filter((a) => a.unlockTier === 'A' || a.unlockTier === 'B');
  return [...AGENT_ROSTER];
}
