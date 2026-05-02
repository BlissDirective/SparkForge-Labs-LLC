// src/lib/harness/monitorLayer.ts
// ════════════════════════════════════════════════════════════════
// Stage 11G — BEHAVIOR MONITOR layer
// ════════════════════════════════════════════════════════════════
// Watches a trajectory in real time for loops + duplicate outputs.
// Pure function over a TrajectoryStep[].
// ════════════════════════════════════════════════════════════════

import type { TrajectoryStep } from '@/types/agentAtelier';
import type { HarnessCatch, MonitorLayerConfig } from '@/types/harness';

export interface ApplyMonitorInput {
  config: MonitorLayerConfig;
  steps: TrajectoryStep[];
}

export interface ApplyMonitorOutput {
  catches: HarnessCatch[];
  /** Index in `steps` at which the monitor would HALT the run (loopLimit
   *  hit). -1 means the run was allowed to complete. */
  haltedAtIndex: number;
}

export function applyMonitor(input: ApplyMonitorInput): ApplyMonitorOutput {
  const { config, steps } = input;
  const catches: HarnessCatch[] = [];

  // 1. loopLimit — if more steps than the cap, halt at cap+1.
  let haltedAtIndex = -1;
  if (config.loopLimit > 0 && steps.length > config.loopLimit) {
    haltedAtIndex = config.loopLimit;
    catches.push({
      layer: 'monitor',
      rule: 'loopLimit',
      detail: `Trajectory exceeded the loop limit of ${config.loopLimit} steps. Run halted at step ${config.loopLimit + 1}.`,
      severity: 3,
    });
  }

  // 2. dedupeOutputs — flag any pair of steps with identical first-output.
  if (config.dedupeOutputs) {
    const seen = new Map<string, number>();
    const effectiveSteps =
      haltedAtIndex >= 0 ? steps.slice(0, haltedAtIndex + 1) : steps;
    for (const s of effectiveSteps) {
      const firstOut = Object.values(s.outputs)[0];
      const key = typeof firstOut === 'string' ? firstOut.slice(0, 60) : JSON.stringify(firstOut).slice(0, 60);
      const prev = seen.get(key);
      if (prev !== undefined) {
        catches.push({
          layer: 'monitor',
          rule: 'dedupeOutputs',
          detail: `Steps ${prev} and ${s.step} produced near-identical first outputs.`,
          severity: 2,
        });
        // Don't keep flagging the same key.
        seen.set(key, -999);
      } else {
        seen.set(key, s.step);
      }
    }
  }

  return { catches, haltedAtIndex };
}

// ─── UI metadata ─────────────────────────────────────────────────

export const MONITOR_RULE_META = {
  loopLimit: {
    label: 'Loop limit',
    hint: 'Halt the trajectory after this many agent steps. Prevents runaway loops.',
    color: '#FF7050',
    severity: 3 as const,
  },
  dedupeOutputs: {
    label: 'Dedupe outputs',
    hint: 'Surface steps that produced near-identical outputs (the team duplicated work).',
    color: '#D9A430',
    severity: 2 as const,
  },
} as const;
