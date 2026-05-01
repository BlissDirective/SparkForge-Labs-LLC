// src/stores/glassBoxStore.ts
// ════════════════════════════════════════════════════════════════
// GLASS BOX STORE — Stage 11F (C2, Lab 11 — Audit step)
// ════════════════════════════════════════════════════════════════
// Per-session state for the Glass Box Lab. Reads existing
// agent_compositions saves; ALL annotations and audit results live
// in transient state (the lab is intentionally stateless per Doc 2
// §K.4 alignment - no new schema).
//
// Persisted slice: tutorialSeen.
// Transient: everything else.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { useToastStore } from '@/stores/toastStore';
import type { AgentComposition, PlacedAgent, Wire } from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';
import type {
  AuditStep,
  AuditSummary,
  IssueCategory,
  ReplaySource,
  AuditorError,
} from '@/types/glassbox';
import { auditReplay, classifyOrigin, summarizeComposition } from '@/lib/glassbox/auditEngine';
import { summarizeAudit } from '@/lib/glassbox/issueDetector';

// ─── Phase machine ───────────────────────────────────────────────

export type GlassBoxPhase =
  | 'welcome'
  | 'learn-trajectory'
  | 'learn-inputs-outputs'
  | 'learn-issues'
  | 'save-select'
  | 'replay'
  | 'inspect'
  | 'annotate'
  | 'report'
  | 'complete';

// ─── Persisted shape ─────────────────────────────────────────────

interface GlassBoxPersisted {
  tutorialSeen: { trajectory: boolean; inputsOutputs: boolean; issues: boolean };
}

// ─── Transient shape ─────────────────────────────────────────────

interface GlassBoxTransient {
  phase: GlassBoxPhase;
  /** All available saves (loaded once on entering save-select). */
  availableSources: ReplaySource[];
  /** Saves cache, keyed by composition id, used to avoid re-fetching. */
  savesCache: Record<string, { comp: AgentComposition; bindings: ToolBinding[] }>;
  /** Currently-replaying composition id (null when not replaying). */
  currentSourceId: string | null;
  /** Augmented trajectory steps for the current replay. */
  steps: AuditStep[];
  /** Final artifact text from missionRunner.simulate. */
  finalArtifact: string;
  /** Total wall-clock duration in ms. */
  totalMs: number;
  /** Replay scrubber position — index into steps[]. */
  scrubIndex: number;
  /** Inspect-phase: which agent is currently focused (defaults to scrubIndex's agent). */
  inspectAgentId: string | null;
  /** Annotate-phase: which step is being annotated. */
  annotateStepIndex: number | null;
  /** Cached audit summary (recomputed on annotation changes). */
  summary: AuditSummary | null;
  /** Last replay error, if any. */
  error: AuditorError | null;

  // UI flags
  isLoadingSources: boolean;
}

type GlassBoxState = GlassBoxPersisted & GlassBoxTransient & {
  setPhase: (p: GlassBoxPhase) => void;
  beginGame: () => void;
  reset: () => void;

  markTutorialSeen: (k: 'trajectory' | 'inputsOutputs' | 'issues') => void;

  /** Load all saved compositions for a child (atelier + mcp). */
  loadSources: (childId: string) => Promise<void>;
  /** Pick a save and run the audit replay. Transitions to 'replay'. */
  pickSource: (compositionId: string) => void;

  /** Replay scrubber. */
  setScrub: (i: number) => void;
  scrubNext: () => void;
  scrubPrev: () => void;

  /** Inspect-phase actions. */
  setInspectAgent: (agentId: string | null) => void;

  /** Annotate-phase actions. */
  beginAnnotateStep: (stepIndex: number) => void;
  cancelAnnotate: () => void;
  toggleStepTag: (stepIndex: number, category: IssueCategory) => void;
  setStepNote: (stepIndex: number, note: string) => void;
  recomputeSummary: () => void;
};

const TRANSIENT_INITIAL: GlassBoxTransient = {
  phase: 'welcome',
  availableSources: [],
  savesCache: {},
  currentSourceId: null,
  steps: [],
  finalArtifact: '',
  totalMs: 0,
  scrubIndex: 0,
  inspectAgentId: null,
  annotateStepIndex: null,
  summary: null,
  error: null,
  isLoadingSources: false,
};

// ─── Store ───────────────────────────────────────────────────────

export const useGlassBoxStore = create<GlassBoxState>()(
  persist(
    (set, get) => ({
      tutorialSeen: { trajectory: false, inputsOutputs: false, issues: false },
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen } = get();
        const next: GlassBoxPhase =
          !tutorialSeen.trajectory ? 'learn-trajectory'
          : !tutorialSeen.inputsOutputs ? 'learn-inputs-outputs'
          : !tutorialSeen.issues ? 'learn-issues'
          : 'save-select';
        set({ phase: next });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      loadSources: async (childId) => {
        if (!childId) return;
        set({ isLoadingSources: true });
        const supabase = createClient();
        const { data, error } = await supabase
          .from('agent_compositions')
          .select('id, child_id, name, team, wires, tool_bindings, created_at')
          .eq('child_id', childId)
          .order('created_at', { ascending: false });
        set({ isLoadingSources: false });
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
          tool_bindings: ToolBinding[];
          created_at: string;
        };
        const rows = (data as DBRow[] | null ?? []);
        const sources: ReplaySource[] = [];
        const cache: GlassBoxTransient['savesCache'] = {};
        for (const r of rows) {
          const bindings = r.tool_bindings ?? [];
          const comp: AgentComposition = {
            id: r.id,
            childId: r.child_id,
            name: r.name,
            team: r.team,
            wires: r.wires,
            createdAt: r.created_at,
          };
          sources.push({
            compositionId: r.id,
            name: r.name,
            origin: classifyOrigin(bindings),
            createdAt: r.created_at,
          });
          cache[r.id] = { comp, bindings };
        }
        set({ availableSources: sources, savesCache: cache });
      },

      pickSource: (compositionId) => {
        const { savesCache } = get();
        const entry = savesCache[compositionId];
        if (!entry) {
          set({ error: { kind: 'composition-not-found', compositionId } });
          return;
        }
        const result = auditReplay({ composition: entry.comp, bindings: entry.bindings });
        if (result.error) {
          set({ error: result.error, steps: [], finalArtifact: '', totalMs: 0 });
          return;
        }
        set({
          currentSourceId: compositionId,
          steps: result.steps,
          finalArtifact: result.finalArtifact,
          totalMs: result.totalMs,
          scrubIndex: 0,
          inspectAgentId: result.steps[0]?.base.agentId ?? null,
          annotateStepIndex: null,
          summary: summarizeAudit(result.steps),
          error: null,
          phase: 'replay',
        });
      },

      setScrub: (i) => {
        const { steps } = get();
        if (steps.length === 0) return;
        const clamped = Math.max(0, Math.min(steps.length - 1, i));
        set({ scrubIndex: clamped, inspectAgentId: steps[clamped]?.base.agentId ?? null });
      },
      scrubNext: () => get().setScrub(get().scrubIndex + 1),
      scrubPrev: () => get().setScrub(get().scrubIndex - 1),

      setInspectAgent: (agentId) => set({ inspectAgentId: agentId }),

      beginAnnotateStep: (stepIndex) =>
        set({ annotateStepIndex: stepIndex, phase: 'annotate' }),
      cancelAnnotate: () => set({ annotateStepIndex: null, phase: 'replay' }),

      toggleStepTag: (stepIndex, category) => {
        set((s) => {
          const steps = s.steps.map((step, i) => {
            if (i !== stepIndex) return step;
            const has = step.playerTags.includes(category);
            const playerTags = has
              ? step.playerTags.filter((c) => c !== category)
              : [...step.playerTags, category];
            return { ...step, playerTags };
          });
          return { steps, summary: summarizeAudit(steps) };
        });
      },

      setStepNote: (stepIndex, note) => {
        const trimmed = note.slice(0, 200);
        set((s) => {
          const steps = s.steps.map((step, i) =>
            i === stepIndex ? { ...step, playerNote: trimmed || undefined } : step,
          );
          return { steps, summary: summarizeAudit(steps) };
        });
      },

      recomputeSummary: () => {
        set((s) => ({ summary: summarizeAudit(s.steps) }));
      },
    }),
    {
      name: 'sparkforge-glassbox',
      partialize: (s): GlassBoxPersisted => ({ tutorialSeen: s.tutorialSeen }),
    },
  ),
);

// ─── Selectors / helpers ─────────────────────────────────────────

/** Build a CompositionSummary for the save-select picker. */
export function describeSource(
  source: ReplaySource,
  cache: GlassBoxTransient['savesCache'],
): ReturnType<typeof summarizeComposition> | null {
  const entry = cache[source.compositionId];
  if (!entry) return null;
  return summarizeComposition(entry.comp, entry.bindings);
}
