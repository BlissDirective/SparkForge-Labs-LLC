// ════════════════════════════════════════════════════════════════
// G5 — client-side adaptive store
// ════════════════════════════════════════════════════════════════
// Verifies the invisible-adaptive loop: high accuracy promotes the
// recommended difficulty, low accuracy demotes it, per-game telemetry
// is logged + capped, and children are isolated from one another.

import { beforeEach, describe, expect, it } from 'vitest';
import { useAdaptiveStore, adaptiveKey, OUTCOME_LOG_CAP } from '@/stores/adaptiveStore';

const CHILD_A = '11111111-1111-1111-1111-111111111111';
const CHILD_B = '22222222-2222-2222-2222-222222222222';
const LAB = 3;

function reset() {
  useAdaptiveStore.setState({ byKey: {}, outcomes: [] });
}

function record(childId: string, accuracy: number, i: number) {
  return useAdaptiveStore.getState().recordOutcome({
    childId,
    gameSlug: 'neural-builder',
    labId: LAB,
    accuracy,
    stars: Math.round(accuracy * 3) as 0 | 1 | 2 | 3,
    // Deterministic clock so tests never touch the real Date.
    at: new Date(1_700_000_000_000 + i * 60_000),
  });
}

describe('adaptiveStore', () => {
  beforeEach(reset);

  it('starts with no state for a child×lab', () => {
    expect(useAdaptiveStore.getState().stateFor(CHILD_A, LAB)).toBeNull();
    expect(useAdaptiveStore.getState().stateFor(null, LAB)).toBeNull();
  });

  it('promotes difficulty after sustained high accuracy', () => {
    let level = 'easy';
    for (let i = 0; i < 6; i++) level = record(CHILD_A, 1, i);
    // With top scores the controller should climb above the easy floor.
    expect(['medium', 'hard', 'expert']).toContain(level);
    const st = useAdaptiveStore.getState().stateFor(CHILD_A, LAB)!;
    expect(st.samples).toBe(6);
    expect(st.performance).toBeGreaterThan(0.8);
  });

  it('keeps a low performer at the easy floor', () => {
    let level = 'easy';
    for (let i = 0; i < 6; i++) level = record(CHILD_A, 0, i);
    expect(level).toBe('easy'); // can't demote below the floor
    const st = useAdaptiveStore.getState().stateFor(CHILD_A, LAB)!;
    expect(st.performance).toBeLessThan(0.45);
  });

  it('logs per-game telemetry and caps the log', () => {
    for (let i = 0; i < OUTCOME_LOG_CAP + 20; i++) record(CHILD_A, 0.9, i);
    const outcomes = useAdaptiveStore.getState().outcomes;
    expect(outcomes.length).toBe(OUTCOME_LOG_CAP);
    expect(outcomes.at(-1)!.gameSlug).toBe('neural-builder');
    expect(outcomes.at(-1)!.labId).toBe(LAB);
    // outcomesFor returns most-recent-first for the requested child.
    const forA = useAdaptiveStore.getState().outcomesFor(CHILD_A, LAB);
    expect(forA.length).toBe(OUTCOME_LOG_CAP);
  });

  it('isolates children from one another', () => {
    for (let i = 0; i < 6; i++) record(CHILD_A, 1, i);
    record(CHILD_B, 0.2, 0);
    const a = useAdaptiveStore.getState().stateFor(CHILD_A, LAB)!;
    const b = useAdaptiveStore.getState().stateFor(CHILD_B, LAB)!;
    expect(a.samples).toBe(6);
    expect(b.samples).toBe(1);
    expect(useAdaptiveStore.getState().outcomesFor(CHILD_B)).toHaveLength(1);
  });

  it('clearForChild forgets only that child', () => {
    record(CHILD_A, 0.9, 0);
    record(CHILD_B, 0.9, 0);
    useAdaptiveStore.getState().clearForChild(CHILD_A);
    expect(useAdaptiveStore.getState().stateFor(CHILD_A, LAB)).toBeNull();
    expect(useAdaptiveStore.getState().stateFor(CHILD_B, LAB)).not.toBeNull();
    expect(useAdaptiveStore.getState().byKey[adaptiveKey(CHILD_B, LAB)]).toBeDefined();
  });
});
