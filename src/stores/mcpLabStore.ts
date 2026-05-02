// src/stores/mcpLabStore.ts
// ════════════════════════════════════════════════════════════════
// MCP LAB STORE — Stage 11E (C6, Lab 11)
// ════════════════════════════════════════════════════════════════
// Per-session state for MCP Plug-and-Play Lab. Manages:
//   • Active equip mission (id + difficulty preference)
//   • Loaded team (from a starterTeam OR a previous Atelier save)
//   • Tool bindings (the persistent shape — same as the JSONB column)
//   • Phase machine
//   • Last grade + violation list
//   • Save/load via agent_compositions (UPDATE existing or INSERT new)
//
// Persisted slice: lastDifficulty, tutorialSeen.
// Transient slice: everything else.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { useToastStore } from '@/stores/toastStore';
import type {
  EquipGrade,
  EquipMission,
  EquipMissionDifficulty,
  ToolBinding,
} from '@/types/mcplab';
import type { AgentComposition, PlacedAgent, Wire } from '@/types/agentAtelier';
import { gradeEquipped, getEquipMission, equipMissionsForBand, validateBinding } from '@/lib/mcplab/toolBinding';
import { explainBindingError } from '@/lib/mcplab/toolBinding';

// ─── Phase machine ───────────────────────────────────────────────

export type McpLabPhase =
  | 'welcome'
  | 'learn-tools'
  | 'learn-descriptions'
  | 'learn-plug-and-play'
  | 'mission-select'
  | 'load-team'
  | 'equip'
  | 'test'
  | 'compare'
  | 'grade'
  | 'save'
  | 'complete';

// ─── State shape ─────────────────────────────────────────────────

interface McpLabPersisted {
  lastDifficulty: EquipMissionDifficulty;
  tutorialSeen: { tools: boolean; descriptions: boolean; plugAndPlay: boolean };
}

interface McpLabTransient {
  phase: McpLabPhase;
  currentMissionId: string | null;
  /** When non-null, the player has loaded a previous Atelier save instead of
   *  using the mission's starter team. */
  loadedFromSaveId: string | null;
  team: PlacedAgent[];
  wires: Wire[];
  bindings: ToolBinding[];

  // Last test/grade output.
  grade: EquipGrade | null;
  /** Snapshot for the compare phase: artifact text WITHOUT tools. */
  baselineArtifact: string;
  /** Snapshot for the compare phase: artifact text WITH tools. */
  equippedArtifact: string;

  // Cached saves list (for the load-team picker).
  savedCompositions: AgentComposition[];

  // UI flags.
  isSaving: boolean;
  lastBindingError: string | null;
}

type McpLabState = McpLabPersisted & McpLabTransient & {
  setPhase: (p: McpLabPhase) => void;
  beginGame: () => void;
  reset: () => void;

  markTutorialSeen: (k: 'tools' | 'descriptions' | 'plugAndPlay') => void;

  setDifficulty: (d: EquipMissionDifficulty) => void;
  pickMission: (missionId: string) => void;
  availableMissionsForBand: (band: 'A' | 'B' | 'C') => EquipMission[];

  /** Use the mission's starterTeam (default path on pickMission). */
  loadStarterTeam: () => void;
  /** Load a previous Atelier save instead of the starter team. */
  loadFromSave: (compositionId: string) => void;
  /** Refresh saves list (used by the load-team picker). */
  refreshSaves: (childId: string) => Promise<void>;

  addBinding: (binding: ToolBinding) => boolean;
  removeBinding: (index: number) => void;
  clearBindings: () => void;

  /** Run the equipped mission and produce a grade. */
  runTest: () => void;
  /** Re-run baseline (no tools) for the compare phase. */
  runBaseline: () => void;

  /** Save the equipped composition as a NEW save (always — keeps Stage 11D
   *  saves intact and creates a Stage 11E variant). */
  saveEquippedComposition: (childId: string, name: string) => Promise<boolean>;
};

const TRANSIENT_INITIAL: McpLabTransient = {
  phase: 'welcome',
  currentMissionId: null,
  loadedFromSaveId: null,
  team: [],
  wires: [],
  bindings: [],
  grade: null,
  baselineArtifact: '',
  equippedArtifact: '',
  savedCompositions: [],
  isSaving: false,
  lastBindingError: null,
};

// ─── Store ───────────────────────────────────────────────────────

export const useMcpLabStore = create<McpLabState>()(
  persist(
    (set, get) => ({
      lastDifficulty: 'easy',
      tutorialSeen: { tools: false, descriptions: false, plugAndPlay: false },
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen } = get();
        const next: McpLabPhase =
          !tutorialSeen.tools ? 'learn-tools'
          : !tutorialSeen.descriptions ? 'learn-descriptions'
          : !tutorialSeen.plugAndPlay ? 'learn-plug-and-play'
          : 'mission-select';
        set({ phase: next });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      setDifficulty: (d) => set({ lastDifficulty: d }),

      pickMission: (missionId) => {
        const m = getEquipMission(missionId);
        if (!m) return;
        // Default-path: load the mission's starter team automatically.
        const team: PlacedAgent[] = m.starterTeam.map((agentId, i) => ({
          agentId,
          // 4-col grid layout (mirrors Stage 11D).
          position: [
            ((i % 4) / 3) * 2 - 1,
            (Math.floor(i / 4) / 2) * 2 - 1,
          ],
        }));
        set({
          currentMissionId: missionId,
          loadedFromSaveId: null,
          team,
          wires: [],
          bindings: [],
          grade: null,
          baselineArtifact: '',
          equippedArtifact: '',
          lastBindingError: null,
          phase: 'load-team',
        });
      },

      availableMissionsForBand: (band) => equipMissionsForBand(band),

      loadStarterTeam: () => {
        const { currentMissionId } = get();
        if (!currentMissionId) return;
        const m = getEquipMission(currentMissionId);
        if (!m) return;
        const team: PlacedAgent[] = m.starterTeam.map((agentId, i) => ({
          agentId,
          position: [((i % 4) / 3) * 2 - 1, (Math.floor(i / 4) / 2) * 2 - 1],
        }));
        set({ team, wires: [], bindings: [], loadedFromSaveId: null, phase: 'equip' });
      },

      loadFromSave: (compositionId) => {
        const { savedCompositions } = get();
        const comp = savedCompositions.find((c) => c.id === compositionId);
        if (!comp) return;
        set({
          team: comp.team,
          wires: comp.wires,
          bindings: [],
          loadedFromSaveId: comp.id,
          phase: 'equip',
        });
      },

      refreshSaves: async (childId) => {
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
        type DBRow = {
          id: string;
          child_id: string;
          name: string;
          team: PlacedAgent[];
          wires: Wire[];
          created_at: string;
        };
        const rows = (data as DBRow[] | null ?? []);
        set({
          savedCompositions: rows.map((r) => ({
            id: r.id,
            childId: r.child_id,
            name: r.name,
            team: r.team,
            wires: r.wires,
            createdAt: r.created_at,
          })),
        });
      },

      addBinding: (binding) => {
        const { team, bindings, currentMissionId } = get();
        const mission = currentMissionId ? getEquipMission(currentMissionId) : undefined;
        const err = validateBinding(team, bindings, binding, mission);
        if (err) {
          set({ lastBindingError: explainBindingError(err) });
          return false;
        }
        set({ bindings: [...bindings, binding], lastBindingError: null });
        return true;
      },

      removeBinding: (index) =>
        set((s) => ({ bindings: s.bindings.filter((_, i) => i !== index) })),

      clearBindings: () => set({ bindings: [] }),

      runTest: () => {
        const { team, bindings, currentMissionId } = get();
        if (!currentMissionId) return;
        const mission = getEquipMission(currentMissionId);
        if (!mission) return;
        const equippedArtifact = stubArtifact(mission, bindings.length, true);
        const grade = gradeEquipped({
          team,
          bindings,
          mission,
          artifactHint: equippedArtifact,
          timeMs: 800 + bindings.length * 200,
        });
        set({ equippedArtifact, grade, phase: 'compare' });
      },

      runBaseline: () => {
        const { currentMissionId } = get();
        if (!currentMissionId) return;
        const mission = getEquipMission(currentMissionId);
        if (!mission) return;
        const baselineArtifact = stubArtifact(mission, 0, false);
        set({ baselineArtifact });
      },

      saveEquippedComposition: async (childId, name) => {
        const { team, wires, bindings } = get();
        if (team.length === 0) return false;
        set({ isSaving: true });
        const supabase = createClient();
        const { error } = await supabase
          .from('agent_compositions')
          .insert({
            child_id: childId,
            name,
            team,
            wires,
            tool_bindings: bindings,
          });
        set({ isSaving: false });
        if (error) {
          useToastStore.getState().addToast('error', `Couldn't save: ${error.message}`);
          return false;
        }
        useToastStore.getState().addToast('success', `Saved equipped team: "${name}".`);
        return true;
      },
    }),
    {
      name: 'sparkforge-mcp-lab',
      partialize: (s): McpLabPersisted => ({
        lastDifficulty: s.lastDifficulty,
        tutorialSeen: s.tutorialSeen,
      }),
    },
  ),
);

// ─── Stub artifact generator (for the compare phase) ─────────────

function stubArtifact(mission: EquipMission, toolCount: number, equipped: boolean): string {
  const prefix = equipped
    ? `Equipped run (${toolCount} tool${toolCount === 1 ? '' : 's'}):`
    : 'Baseline run (no tools):';
  // Concatenate the mission's recommendedTool ids if equipped — gives the
  // grader keywords to match the rubric criteria.
  const toolHint = equipped ? mission.recommendedTools.join(' ') : 'estimated by hand';
  return `${prefix} ${mission.title}. Output references: ${toolHint}.`;
}
