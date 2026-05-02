// src/stores/harnessForgeStore.ts
// ════════════════════════════════════════════════════════════════
// HARNESS FORGE STORE — Stage 11G (C7, Lab 11 — Constrain step)
// ════════════════════════════════════════════════════════════════
// Per-session state for Harness Forge. Reads existing
// agent_compositions saves; writes harness_config back into the
// same row OR creates a new save with the harness configured.
//
// Persisted slice: tutorialSeen, lastConfig.
// Transient slice: everything else.
// ════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { useToastStore } from '@/stores/toastStore';
import type {
  AgentComposition,
  PlacedAgent,
  Wire,
} from '@/types/agentAtelier';
import type { ToolBinding } from '@/types/mcplab';
import type {
  HarnessConfig,
  HarnessCatch,
  StressFixture,
  StressTestResult,
  StressTestGrade,
} from '@/types/harness';
import { DEFAULT_HARNESS_CONFIG } from '@/types/harness';
import { applyFilter } from '@/lib/harness/filterLayer';
import { applyValidator } from '@/lib/harness/validatorLayer';
import { applyMonitor } from '@/lib/harness/monitorLayer';
import { STRESS_FIXTURES } from '@/lib/harness/stressTestFixtures';
import { simulate } from '@/lib/agentatelier/missionRunner';
import { HARDCODED_MISSIONS } from '@/lib/agentatelier/missionLibrary';

// ─── Phase machine ───────────────────────────────────────────────

export type HarnessForgePhase =
  | 'welcome'
  | 'learn-why'
  | 'learn-layers'
  | 'learn-catches'
  | 'save-select'
  | 'configure-filter'
  | 'configure-validator'
  | 'configure-monitor'
  | 'stress-test'
  | 'report'
  | 'save'
  | 'complete';

interface HarnessForgePersisted {
  tutorialSeen: { why: boolean; layers: boolean; catches: boolean };
  /** Persist last config so returning kids start with their previous setup. */
  lastConfig: HarnessConfig;
}

interface HarnessForgeTransient {
  phase: HarnessForgePhase;
  /** Loaded saves (atelier + mcp). */
  availableSaves: Array<{ comp: AgentComposition; bindings: ToolBinding[]; harness: HarnessConfig | null }>;
  /** Currently-selected save id. */
  currentSaveId: string | null;
  /** The active harness config (mutable per-session draft). */
  config: HarnessConfig;
  /** Stress test results, keyed by fixture id. */
  results: Record<string, StressTestResult>;
  /** Cached grade. */
  grade: StressTestGrade | null;
  isLoadingSaves: boolean;
  isSaving: boolean;
}

type HarnessForgeState = HarnessForgePersisted & HarnessForgeTransient & {
  setPhase: (p: HarnessForgePhase) => void;
  beginGame: () => void;
  reset: () => void;

  markTutorialSeen: (k: 'why' | 'layers' | 'catches') => void;

  loadSaves: (childId: string) => Promise<void>;
  pickSave: (compositionId: string) => void;

  // Per-layer config setters
  toggleFilterRule: (rule: 'stripPii' | 'blockProfanity') => void;
  setFilterLengthCap: (cap: number) => void;
  setValidatorRequireKeyword: (kw: string) => void;
  setValidatorMaxLength: (len: number | undefined) => void;
  toggleValidatorCitations: () => void;
  setMonitorLoopLimit: (limit: number) => void;
  toggleMonitorDedupe: () => void;

  resetConfig: () => void;

  /** Run the configured harness against ALL fixtures eligible for the
   *  active band, populating results + grade. */
  runStressTest: (band: 'A' | 'B' | 'C') => void;
  clearResults: () => void;

  /** Persist the current config back to the selected save's harness_config
   *  column (UPDATE in place). */
  saveHarnessToSelected: () => Promise<boolean>;
};

const TRANSIENT_INITIAL: HarnessForgeTransient = {
  phase: 'welcome',
  availableSaves: [],
  currentSaveId: null,
  config: DEFAULT_HARNESS_CONFIG,
  results: {},
  grade: null,
  isLoadingSaves: false,
  isSaving: false,
};

// ─── Store ───────────────────────────────────────────────────────

export const useHarnessForgeStore = create<HarnessForgeState>()(
  persist(
    (set, get) => ({
      tutorialSeen: { why: false, layers: false, catches: false },
      lastConfig: DEFAULT_HARNESS_CONFIG,
      ...TRANSIENT_INITIAL,

      setPhase: (p) => set({ phase: p }),

      beginGame: () => {
        const { tutorialSeen, lastConfig } = get();
        const next: HarnessForgePhase =
          !tutorialSeen.why ? 'learn-why'
          : !tutorialSeen.layers ? 'learn-layers'
          : !tutorialSeen.catches ? 'learn-catches'
          : 'save-select';
        set({ phase: next, config: lastConfig });
      },

      reset: () => set({ ...TRANSIENT_INITIAL }),

      markTutorialSeen: (k) =>
        set((s) => ({ tutorialSeen: { ...s.tutorialSeen, [k]: true } })),

      loadSaves: async (childId) => {
        if (!childId) return;
        set({ isLoadingSaves: true });
        const supabase = createClient();
        const { data, error } = await supabase
          .from('agent_compositions')
          .select('id, child_id, name, team, wires, tool_bindings, harness_config, created_at')
          .eq('child_id', childId)
          .order('created_at', { ascending: false });
        set({ isLoadingSaves: false });
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
          harness_config: HarnessConfig | null;
          created_at: string;
        };
        const rows = (data as DBRow[] | null ?? []);
        set({
          availableSaves: rows.map((r) => ({
            comp: {
              id: r.id,
              childId: r.child_id,
              name: r.name,
              team: r.team,
              wires: r.wires,
              createdAt: r.created_at,
            },
            bindings: r.tool_bindings ?? [],
            harness: r.harness_config ?? null,
          })),
        });
      },

      pickSave: (compositionId) => {
        const { availableSaves } = get();
        const entry = availableSaves.find((e) => e.comp.id === compositionId);
        if (!entry) return;
        // Inherit existing harness if the save already had one. Otherwise
        // start from DEFAULT_HARNESS_CONFIG (clean slate) - NOT lastConfig.
        // Reason: lastConfig from a prior unrelated save would silently
        // override an unconfigured composition; the player would be confused
        // by toggles already on without an explicit "carrying over" UI.
        set({
          currentSaveId: compositionId,
          config: entry.harness ?? DEFAULT_HARNESS_CONFIG,
          results: {},
          grade: null,
          phase: 'configure-filter',
        });
      },

      toggleFilterRule: (rule) => {
        set((s) => ({
          config: {
            ...s.config,
            filter: { ...s.config.filter, [rule]: !s.config.filter[rule] },
          },
        }));
      },
      setFilterLengthCap: (cap) =>
        set((s) => ({
          config: { ...s.config, filter: { ...s.config.filter, lengthCap: Math.max(0, cap) } },
        })),

      setValidatorRequireKeyword: (kw) =>
        set((s) => ({
          config: {
            ...s.config,
            validator: { ...s.config.validator, requireKeyword: kw.trim() || undefined },
          },
        })),
      setValidatorMaxLength: (len) =>
        set((s) => ({
          config: {
            ...s.config,
            validator: {
              ...s.config.validator,
              maxLength: len === undefined ? undefined : Math.max(0, len),
            },
          },
        })),
      toggleValidatorCitations: () =>
        set((s) => ({
          config: {
            ...s.config,
            validator: { ...s.config.validator, requireCitations: !s.config.validator.requireCitations },
          },
        })),

      setMonitorLoopLimit: (limit) =>
        set((s) => ({
          config: { ...s.config, monitor: { ...s.config.monitor, loopLimit: Math.max(1, limit) } },
        })),
      toggleMonitorDedupe: () =>
        set((s) => ({
          config: {
            ...s.config,
            monitor: { ...s.config.monitor, dedupeOutputs: !s.config.monitor.dedupeOutputs },
          },
        })),

      resetConfig: () => set({ config: DEFAULT_HARNESS_CONFIG }),

      runStressTest: (band) => {
        const { config, currentSaveId, availableSaves } = get();
        const save = currentSaveId ? availableSaves.find((s) => s.comp.id === currentSaveId) : null;
        if (!save) return;

        const eligible = STRESS_FIXTURES.filter((f) => f.band.includes(band));
        const out: Record<string, StressTestResult> = {};
        // Use the first-mission template as a synthetic stand-in for
        // simulate() shape; the actual prompt is replaced per-fixture.
        const baseMission = HARDCODED_MISSIONS[0];

        for (const fixture of eligible) {
          const result = runOneFixture(fixture, save.comp, config, baseMission);
          out[fixture.id] = result;
        }

        const grade = computeGrade(out, eligible, config);
        // NOTE: lastConfig (persisted slice) is *not* updated here —
        // we only persist on explicit `saveHarnessToSelected` so an
        // experimental config the kid bails on doesn't leak into the
        // next session.
        set({ results: out, grade, phase: 'report' });
      },

      clearResults: () => set({ results: {}, grade: null }),

      saveHarnessToSelected: async () => {
        const { config, currentSaveId } = get();
        if (!currentSaveId) return false;
        set({ isSaving: true });
        const supabase = createClient();
        const { error } = await supabase
          .from('agent_compositions')
          .update({ harness_config: config })
          .eq('id', currentSaveId);
        set({ isSaving: false });
        if (error) {
          useToastStore.getState().addToast('error', `Couldn't save harness: ${error.message}`);
          return false;
        }
        // Now that the kid has explicitly committed this config, persist
        // it so the next session starts pre-filled.
        set({ lastConfig: config });
        useToastStore.getState().addToast('success', 'Harness saved on this composition.');
        return true;
      },
    }),
    {
      name: 'sparkforge-harness-forge',
      partialize: (s): HarnessForgePersisted => ({
        tutorialSeen: s.tutorialSeen,
        lastConfig: s.lastConfig,
      }),
    },
  ),
);

// ─── Per-fixture run + grade helpers ─────────────────────────────

function runOneFixture(
  fixture: StressFixture,
  comp: AgentComposition,
  config: HarnessConfig,
  baseMission: typeof HARDCODED_MISSIONS[number],
): StressTestResult {
  const allCatches: HarnessCatch[] = [];

  // 1. Filter: sanitize the fixture prompt.
  const filterOut = applyFilter({ config: config.filter, prompt: fixture.prompt });
  allCatches.push(...filterOut.catches);
  if (filterOut.rejected) {
    return {
      fixtureId: fixture.id,
      catches: allCatches,
      finalArtifact: '',
      rejected: true,
      timestampMs: Date.now(),
    };
  }

  // 2. Simulate the team using the (possibly truncated/sanitized) prompt.
  //    We swap the mission's prompt with the sanitized fixture prompt so
  //    simulate's stub-output generator treats the fixture text as input.
  const syntheticMission = { ...baseMission, prompt: filterOut.sanitizedPrompt };
  const sim = simulate({ team: comp.team, wires: comp.wires, mission: syntheticMission });

  // 3. Monitor: walk the trajectory.
  const monitorOut = applyMonitor({ config: config.monitor, steps: sim.trajectory });
  allCatches.push(...monitorOut.catches);

  // 4. Validator: only run when the monitor allowed the team to complete.
  //    Running the validator against '(halted by monitor)' produced false
  //    requireKeyword/maxLength failures (the team never had a chance to
  //    produce an artifact). When halted, skip the validator entirely - the
  //    monitor's catch already explains the outcome.
  const finalArtifact = monitorOut.haltedAtIndex >= 0
    ? '(halted by monitor)'
    : sim.finalArtifact;
  if (monitorOut.haltedAtIndex < 0) {
    const validatorOut = applyValidator({ config: config.validator, artifact: finalArtifact });
    allCatches.push(...validatorOut.catches);
  }

  return {
    fixtureId: fixture.id,
    catches: allCatches,
    finalArtifact,
    rejected: monitorOut.haltedAtIndex >= 0,
    timestampMs: Date.now(),
  };
}

function computeGrade(
  results: Record<string, StressTestResult>,
  fixtures: readonly StressFixture[],
  _config: HarnessConfig,
): StressTestGrade {
  const totalFixtures = fixtures.length;
  if (totalFixtures === 0) {
    return {
      totalFixtures: 0,
      caughtCount: 0,
      preventedCount: 0,
      filterEffectiveness: 0,
      validatorEffectiveness: 0,
      monitorEffectiveness: 0,
      total: 0,
      stars: 0,
    };
  }

  let caughtCount = 0;
  let preventedCount = 0;

  // Per-layer denominators = number of fixtures targeting that layer;
  // numerator = number of those fixtures that produced ≥1 catch in that layer.
  let filterTargets = 0, filterCaught = 0;
  let valTargets = 0, valCaught = 0;
  let monTargets = 0, monCaught = 0;

  for (const f of fixtures) {
    const r = results[f.id];
    if (!r) continue;
    if (r.catches.length > 0) caughtCount += 1;
    if (r.rejected) preventedCount += 1;

    if (f.targetLayers.includes('filter')) {
      filterTargets += 1;
      if (r.catches.some((c) => c.layer === 'filter')) filterCaught += 1;
    }
    if (f.targetLayers.includes('validator')) {
      valTargets += 1;
      if (r.catches.some((c) => c.layer === 'validator')) valCaught += 1;
    }
    if (f.targetLayers.includes('monitor')) {
      monTargets += 1;
      if (r.catches.some((c) => c.layer === 'monitor')) monCaught += 1;
    }
  }

  const filterEffectiveness = filterTargets > 0 ? filterCaught / filterTargets : 0;
  const validatorEffectiveness = valTargets > 0 ? valCaught / valTargets : 0;
  const monitorEffectiveness = monTargets > 0 ? monCaught / monTargets : 0;

  // Total = arithmetic mean of the three effectiveness scores, ignoring layers
  // with zero target fixtures (otherwise a fully-relevant 1.0 average gets
  // dragged down by a 0/0=0 denominator).
  const present = [
    filterTargets > 0 ? filterEffectiveness : null,
    valTargets > 0 ? validatorEffectiveness : null,
    monTargets > 0 ? monitorEffectiveness : null,
  ].filter((v): v is number => v !== null);
  const total = present.length > 0 ? present.reduce((s, v) => s + v, 0) / present.length : 0;

  const stars: 0 | 1 | 2 | 3 =
    total >= 0.85 ? 3
    : total >= 0.6 ? 2
    : total >= 0.3 ? 1
    : 0;

  return {
    totalFixtures,
    caughtCount,
    preventedCount,
    filterEffectiveness,
    validatorEffectiveness,
    monitorEffectiveness,
    total,
    stars,
  };
}
