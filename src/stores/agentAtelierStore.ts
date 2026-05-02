// src/stores/agentAtelierStore.ts
// ════════════════════════════════════════════════════════════════
// AGENT ATELIER STORE — Stage 11D (C1, Lab 11 opener)
// ════════════════════════════════════════════════════════════════
// Manages the per-session state of the Agent Atelier game:
//   • Active mission (id + difficulty)
//   • Placed team + wires (the persistent shape — same as JSONB cols)
//   • Phase machine (welcome -> ... -> complete)
//   • Wire-drag transient state
//   • Last simulate trajectory + grade (resets per re-run)
//   • Saved compositions list (loaded from Supabase per child)
//
// Persisted slice (zustand/persist):
//   • lastDifficulty (so the mission select remembers your pick)
//   • tutorialSeen (so the learn-roster/wiring/mission cards don't replay)
//
// Transient slice (NOT persisted):
//   • currentMissionId, team, wires, phase, dragSource, trajectory,
//     grade, runError, savedCompositions
//
// Save flow: writes go through @/lib/supabase/client `agent_compositions`
// table per the migration `20260501000001_create_agent_compositions.sql`.
// Failure surfaces via toastStore so the UI is decoupled from network IO.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { useToastStore } from '@/stores/toastStore';
import type {
  AgentComposition,
  Mission,
  MissionGrade,
  PlacedAgent,
  TrajectoryStep,
  Wire,
} from '@/types/agentAtelier';
import type { RunError } from '@/lib/agentatelier/missionRunner';
import { simulate as runSimulate, grade as runGrade, compositionPayload } from '@/lib/agentatelier/missionRunner';
import { validateWire } from '@/lib/agentatelier/wireGraph';
import { getMission, missionsForBand } from '@/lib/agentatelier/missionLibrary';

// ─── Phase machine ───────────────────────────────────────────────

export type AtelierPhase =
  | 'welcome'
  | 'learn-roster'
  | 'learn-wiring'
  | 'learn-mission'
  | 'mission-select'
  | 'build'
  | 'wire'
  | 'simulate'
  | 'grade'
  | 'save'
  | 'review'
  | 'complete';

// ─── Wire-drag transient state ───────────────────────────────────

export interface DragSource {
  agentId: string;
  outputName: string;
}

// ─── State shape ─────────────────────────────────────────────────

interface AtelierPersisted {
  /** Persisted: last-selected difficulty so mission-select remembers. */
  lastDifficulty: 'easy' | 'medium' | 'hard';
  /** Persisted: which tutorial cards have been completed (skip on re-entry). */
  tutorialSeen: { roster: boolean; wiring: boolean; mission: boolean };
}

interface AtelierTransient {
  phase: AtelierPhase;
  currentMissionId: string | null;
  team: PlacedAgent[];
  wires: Wire[];
  dragSource: DragSource | null;

  // Last simulate result.
  trajectory: TrajectoryStep[];
  finalArtifact: string;
  totalMs: number;
  grade: MissionGrade | null;
  runError: RunError | null;

  // Wire-validation surface — current candidate-wire rejection, if any.
  lastWireError: string | null;

  // Save-flow.
  savedCompositions: AgentComposition[];
  isSaving: boolean;
}

type AtelierState = AtelierPersisted & AtelierTransient & {
  // Phase transitions
  setPhase: (p: AtelierPhase) => void;
  beginGame: () => void;
  reset: () => void;

  // Tutorial
  markTutorialSeen: (k: 'roster' | 'wiring' | 'mission') => void;

  // Mission select
  pickMission: (missionId: string) => void;
  setDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
  /** Convenience for mission-select grids. */
  availableMissionsForBand: (band: 'A' | 'B' | 'C') => Mission[];

  // Build phase (place / move / remove agents)
  placeAgent: (agentId: string, position: [number, number]) => void;
  moveAgent: (agentId: string, position: [number, number]) => void;
  removeAgent: (agentId: string) => void;

  // Wire phase
  beginWire: (source: DragSource) => void;
  cancelWire: () => void;
  addWire: (candidate: Wire) => boolean;
  removeWire: (index: number) => void;

  // Simulate + grade
  runSimulation: () => void;
  clearGrade: () => void;

  // Save / load (Supabase agent_compositions)
  saveComposition: (childId: string, name: string) => Promise<boolean>;
  loadCompositions: (childId: string) => Promise<void>;
};

// ─── Initial transient state ─────────────────────────────────────

const TRANSIENT_INITIAL: AtelierTransient = {
  phase: 'welcome',
  currentMissionId: null,
  team: [],
  wires: [],
  dragSource: null,
  trajectory: [],
  finalArtifact: '',
  totalMs: 0,
  grade: null,
  runError: null,
  lastWireError: null,
  savedCompositions: [],
  isSaving: false,
};

// ─── Store ───────────────────────────────────────────────────────

export const useAgentAtelierStore = create<AtelierState>()(
  persist(
    (set, get) => ({
      // ── Persisted defaults ───────────────────────────────────
      lastDifficulty: 'easy',
      tutorialSeen: { roster: false, wiring: false, mission: false },

      // ── Transient defaults ───────────────────────────────────
      ...TRANSIENT_INITIAL,

      // ── Phase ────────────────────────────────────────────────
      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen } = get();
        // Skip already-seen tutorial cards.
        const next: AtelierPhase =
          !tutorialSeen.roster ? 'learn-roster'
          : !tutorialSeen.wiring ? 'learn-wiring'
          : !tutorialSeen.mission ? 'learn-mission'
          : 'mission-select';
        set({ phase: next });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      // ── Tutorial ─────────────────────────────────────────────
      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      // ── Mission select ───────────────────────────────────────
      pickMission: (missionId) => {
        const m = getMission(missionId);
        if (!m) return;
        set({
          currentMissionId: missionId,
          team: [],
          wires: [],
          trajectory: [],
          finalArtifact: '',
          grade: null,
          runError: null,
          lastWireError: null,
          phase: 'build',
        });
      },
      setDifficulty: (d) => set({ lastDifficulty: d }),
      availableMissionsForBand: (band) => missionsForBand(band),

      // ── Build phase ──────────────────────────────────────────
      placeAgent: (agentId, position) =>
        set((s) =>
          s.team.some((p) => p.agentId === agentId)
            ? s // already placed — no-op
            : { team: [...s.team, { agentId, position }] },
        ),

      moveAgent: (agentId, position) =>
        set((s) => ({
          team: s.team.map((p) => (p.agentId === agentId ? { ...p, position } : p)),
        })),

      removeAgent: (agentId) =>
        set((s) => ({
          team: s.team.filter((p) => p.agentId !== agentId),
          // Drop any wires touching this agent.
          wires: s.wires.filter(
            (w) => w.fromAgentId !== agentId && w.toAgentId !== agentId,
          ),
        })),

      // ── Wire phase ───────────────────────────────────────────
      beginWire: (source) => set({ dragSource: source, lastWireError: null }),
      cancelWire: () => set({ dragSource: null, lastWireError: null }),

      addWire: (candidate) => {
        const { team, wires } = get();
        const err = validateWire(team, wires, candidate);
        if (err) {
          let msg = 'Wire rejected.';
          if (err.kind === 'port-type-mismatch')
            msg = `${err.from.name} (${err.from.type}) can't feed ${err.to.name} (${err.to.type}).`;
          else if (err.kind === 'cycle-detected')
            msg = `Cycle would be created across ${err.involvedAgentIds.length} agents.`;
          else if (err.kind === 'duplicate-wire') msg = 'Wire already exists.';
          else if (err.kind === 'self-wire') msg = "An agent can't wire to itself.";
          else if (err.kind === 'unknown-port') msg = 'Unknown port.';
          set({ lastWireError: msg, dragSource: null });
          return false;
        }
        set({ wires: [...wires, candidate], dragSource: null, lastWireError: null });
        return true;
      },

      removeWire: (index) =>
        set((s) => ({ wires: s.wires.filter((_, i) => i !== index) })),

      // ── Simulate + grade ─────────────────────────────────────
      runSimulation: () => {
        const { team, wires, currentMissionId } = get();
        if (!currentMissionId) return;
        const mission = getMission(currentMissionId);
        if (!mission) return;
        const sim = runSimulate({ team, wires, mission });
        if (sim.error) {
          set({
            phase: 'wire', // bounce back to wire phase
            runError: sim.error,
            trajectory: [],
            grade: null,
          });
          return;
        }
        const grd = runGrade({
          trajectory: sim.trajectory,
          finalArtifact: sim.finalArtifact,
          mission,
        });
        set({
          phase: 'simulate',
          trajectory: sim.trajectory,
          finalArtifact: sim.finalArtifact,
          totalMs: sim.totalMs,
          grade: grd,
          runError: null,
        });
      },

      clearGrade: () => set({ grade: null, trajectory: [], runError: null }),

      // ── Save / load Supabase ─────────────────────────────────
      saveComposition: async (childId, name) => {
        const { team, wires } = get();
        if (team.length === 0) return false;
        set({ isSaving: true });
        const supabase = createClient();
        const payload = {
          child_id: childId,
          ...compositionPayload(name, team, wires),
        };
        const { error } = await supabase.from('agent_compositions').insert(payload);
        set({ isSaving: false });
        if (error) {
          useToastStore.getState().addToast('error', `Couldn't save: ${error.message}`);
          return false;
        }
        useToastStore.getState().addToast('success', `Saved "${name}".`);
        // Refresh the list.
        await get().loadCompositions(childId);
        return true;
      },

      loadCompositions: async (childId) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('agent_compositions')
          .select('id, child_id, name, team, wires, created_at')
          .eq('child_id', childId)
          .order('created_at', { ascending: false });
        if (error) {
          useToastStore.getState().addToast('error', `Couldn't load saves: ${error.message}`);
          return;
        }
        // The DB row uses snake_case; map to AgentComposition.
        type DBRow = {
          id: string;
          child_id: string;
          name: string;
          team: PlacedAgent[];
          wires: Wire[];
          created_at: string;
        };
        const rows = (data ?? []) as DBRow[];
        const comps: AgentComposition[] = rows.map((r) => ({
          id: r.id,
          childId: r.child_id,
          name: r.name,
          team: r.team,
          wires: r.wires,
          createdAt: r.created_at,
        }));
        set({ savedCompositions: comps });
      },
    }),
    {
      name: 'sparkforge-agent-atelier',
      // Only persist the user-preference slice; transient game state is
      // always per-session.
      partialize: (s): AtelierPersisted => ({
        lastDifficulty: s.lastDifficulty,
        tutorialSeen: s.tutorialSeen,
      }),
    },
  ),
);
