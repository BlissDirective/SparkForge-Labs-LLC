// ════════════════════════════════════════════════════════════════
// P2 §10.8 — particle physics core (pure integrator)
// ════════════════════════════════════════════════════════════════
// Verifies the pure `integrateParticles` function is:
//   - Correct under gravity alone (free-fall positions + velocities)
//   - Idempotent across call sites (worker wrapper === main-thread)
//   - Monotonic on expired count (only grows as particles age out)
//   - Allocation-free (mutates input — no new arrays per step)

import { describe, expect, it } from 'vitest';
import {
  integrateParticles,
  seedParticles,
  STRIDE,
} from '@/lib/particles/physicsCore';
import { integrateParticlesWorker } from '@/lib/workers/heavyCompute.worker';

describe('P2 §10.8 — physicsCore.integrateParticles', () => {
  it('free-fall: y decreases under gravity', () => {
    const state = seedParticles(1, () => ({ y: 10, lifetime: 5 }));
    integrateParticles(state, 0.1, { gravity: -9.8, drag: 0 });
    // vy = 0 + (-9.8)(0.1) = -0.98; y = 10 + (-0.98)(0.1) = 9.902
    expect(state[1]).toBeCloseTo(9.902, 3);
    expect(state[4]).toBeCloseTo(-0.98, 3);
  });

  it('drag decays velocity toward zero', () => {
    const state = seedParticles(1, () => ({ vx: 10, lifetime: 5 }));
    integrateParticles(state, 1.0, { gravity: 0, drag: 0.5 });
    // dragFactor = 1 - 0.5 = 0.5 → vx = 10 * 0.5 = 5
    expect(state[3]).toBeCloseTo(5, 3);
  });

  it('wind adds a constant acceleration', () => {
    const state = seedParticles(1, () => ({ lifetime: 5 }));
    integrateParticles(state, 1.0, { gravity: 0, drag: 0, wind: [2, 0, 0] });
    // vx = 0 + 2*1 = 2
    expect(state[3]).toBeCloseTo(2, 3);
  });

  it('expired count tracks lifetime', () => {
    const state = seedParticles(3, (i) => ({ lifetime: i + 1 }));
    // After 2s: particles with lifetime 1 + 2 expire (age≥life). 3 does not.
    const { expired } = integrateParticles(state, 2.0, { gravity: 0, drag: 0 });
    expect(expired).toBe(2);
  });

  it('worker wrapper produces identical output to core', () => {
    const stateA = seedParticles(10, (i) => ({
      x: i, y: i * 0.5, vx: 1, vy: 2, lifetime: 5,
    }));
    const stateB = stateA.slice(); // independent copy

    integrateParticles(stateA, 0.016, { gravity: -9.8, drag: 0.1 });
    integrateParticlesWorker(stateB, 0.016, { gravity: -9.8, drag: 0.1 });

    for (let i = 0; i < stateA.length; i++) {
      expect(stateB[i]).toBeCloseTo(stateA[i], 6);
    }
  });

  it('does NOT allocate new arrays (mutates input)', () => {
    const state = seedParticles(100, () => ({ lifetime: 1 }));
    const original = state;
    const { state: returned } = integrateParticles(state, 0.016, {
      gravity: -9.8,
      drag: 0,
    });
    expect(returned).toBe(original); // same reference
  });

  it('STRIDE constant is 8 (x, y, z, vx, vy, vz, age, lifetime)', () => {
    expect(STRIDE).toBe(8);
    const s = seedParticles(5, () => ({}));
    expect(s.length).toBe(5 * 8);
  });
});
