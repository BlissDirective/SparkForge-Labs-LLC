// ════════════════════════════════════════════════════════════════
// ceremony-fx-compute.test — P5 §10.8 Sub 7 Parity Tests
// ════════════════════════════════════════════════════════════════
//
// Validates that:
//   1. createCeremonyComputeSystem produces the expected archetype
//      slots with correct particle counts.
//   2. Uniforms are wired correctly and updateCeremonyUniforms mutates
//      them in place.
//   3. CPU reference physicsCore.integrateParticles matches the
//      mathematical model the GPU kernels implement (semi-implicit
//      Euler + gravity + drag) — first 100 particles over 10 frames.
//
// The GPU kernels themselves aren't executable in node/vitest
// (no WebGPU). Parity is verified at the math level, not bytecode.
// ════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  CEREMONY_PARTICLE_COUNTS,
  CEREMONY_GRAVITY,
  createCeremonyComputeSystem,
  createCeremonyUniforms,
  updateCeremonyUniforms,
} from '@/lib/3d/ceremonyFXCompute';
import {
  integrateParticles,
  seedParticles,
  STRIDE,
} from '@/lib/particles/physicsCore';

// ── 1. System shape ───────────────────────────────────────────────
describe('createCeremonyComputeSystem', () => {
  it('creates all four archetype slots with correct counts', () => {
    const system = createCeremonyComputeSystem('#00BBFF');
    expect(system.confetti.count).toBe(CEREMONY_PARTICLE_COUNTS.confetti);
    expect(system.firework.count).toBe(CEREMONY_PARTICLE_COUNTS.firework);
    expect(system.trophy.count).toBe(CEREMONY_PARTICLE_COUNTS.trophy);
    expect(system.shower.count).toBe(CEREMONY_PARTICLE_COUNTS.shower);
  });

  it('each archetype has init + step kernel pair', () => {
    const system = createCeremonyComputeSystem();
    for (const name of ['confetti', 'firework', 'trophy', 'shower'] as const) {
      const slot = system[name];
      expect(slot.kernels.init).toBeDefined();
      expect(slot.kernels.step).toBeDefined();
    }
  });

  it('exposes shared uniforms across all archetypes', () => {
    const system = createCeremonyComputeSystem('#FF6644');
    expect(system.uniforms.elapsed).toBeDefined();
    expect(system.uniforms.duration).toBeDefined();
    expect(system.uniforms.labColor).toBeDefined();
    expect(system.uniforms.shatterOrigin).toBeDefined();
    expect(system.uniforms.gravity).toBeDefined();
    expect(system.uniforms.drag).toBeDefined();
  });

  it('dispose() is idempotent', () => {
    const system = createCeremonyComputeSystem();
    expect(() => system.dispose()).not.toThrow();
    expect(() => system.dispose()).not.toThrow();
  });
});

// ── 2. Uniform updates ────────────────────────────────────────────
describe('updateCeremonyUniforms', () => {
  it('mutates elapsed + duration in place', () => {
    const u = createCeremonyUniforms('#00BBFF');
    updateCeremonyUniforms(u, 1.5, 4.0);
    expect(u.elapsed.value).toBe(1.5);
    expect(u.duration.value).toBe(4.0);
  });

  it('preserves labColor when hex arg omitted', () => {
    const u = createCeremonyUniforms('#00BBFF'); // r=0, g=0.73, b=1
    const originalR = u.labColor.value.x;
    updateCeremonyUniforms(u, 0, 4);
    expect(u.labColor.value.x).toBe(originalR);
  });

  it('updates labColor when hex arg provided', () => {
    const u = createCeremonyUniforms('#00BBFF');
    updateCeremonyUniforms(u, 0, 4, '#FFD700'); // gold
    // Gold #FFD700 → r=1.0, g≈0.843, b=0
    expect(u.labColor.value.x).toBeCloseTo(1.0, 2);
    expect(u.labColor.value.z).toBeCloseTo(0.0, 2);
  });
});

// ── 3. CPU reference physics (parity baseline) ────────────────────
describe('physicsCore.integrateParticles (GPU kernel reference)', () => {
  const N = 100;
  const dt = 1 / 60;

  function buildSeed() {
    return seedParticles(N, (i) => ({
      x: 0,
      y: 0,
      z: 0,
      vx: Math.cos(i) * 2,
      vy: 5 + (i % 10) * 0.3,
      vz: Math.sin(i) * 2,
      lifetime: 4.0,
    }));
  }

  it('gravity pulls vy downward over time (CEREMONY_GRAVITY)', () => {
    const state = buildSeed();
    const initialVy = state[4]; // first particle's vy
    // Simulate 10 frames (≈0.166 s) with only gravity, no drag/wind
    for (let i = 0; i < 10; i++) {
      integrateParticles(state, dt, { gravity: CEREMONY_GRAVITY, drag: 0 });
    }
    // Expected: vy decreased by |gravity| * 10 * dt ≈ 1.633
    const finalVy = state[4];
    expect(finalVy).toBeLessThan(initialVy);
    expect(initialVy - finalVy).toBeCloseTo(Math.abs(CEREMONY_GRAVITY) * 10 * dt, 1);
  });

  it('drag decays velocity toward zero', () => {
    const state = buildSeed();
    const initialVy = Math.abs(state[4]);
    // High drag + zero gravity: velocity should decay monotonically
    for (let i = 0; i < 30; i++) {
      integrateParticles(state, dt, { gravity: 0, drag: 2.0 });
    }
    const finalVy = Math.abs(state[4]);
    expect(finalVy).toBeLessThan(initialVy);
    expect(finalVy).toBeLessThan(initialVy * 0.5);
  });

  it('position integrates by velocity × dt (semi-implicit Euler)', () => {
    const state = buildSeed();
    const startPos = [state[0], state[1], state[2]] as const;
    integrateParticles(state, dt, { gravity: 0, drag: 0 });
    // Position delta should roughly equal velocity * dt (+ gravity if any)
    // With gravity=0, drag=0: Δx = vx * dt exactly.
    // vx was 2 for particle 0; with dragFactor = 1, pos_x gains 2 * dt.
    expect(state[0] - startPos[0]).toBeCloseTo(2 * dt, 4);
    // vy = 5 + 0*0.3 = 5 for particle 0. Δy = 5 * dt
    expect(state[1] - startPos[1]).toBeCloseTo(5 * dt, 4);
  });

  it('age accumulates + expired count reports correctly', () => {
    const state = seedParticles(10, () => ({ lifetime: 0.1 }));
    // After 10 frames of dt=1/60 = 0.166s, all 10 should have expired
    let totalExpired = 0;
    for (let i = 0; i < 10; i++) {
      const r = integrateParticles(state, dt, { gravity: 0, drag: 0 });
      totalExpired = r.expired;
    }
    // All particles age past 0.1s — all 10 expired
    expect(totalExpired).toBe(10);
  });
});

// ── 4. Stride contract (GPU buffer compatibility) ─────────────────
describe('physicsCore stride/packing', () => {
  it('STRIDE is 8 (x, y, z, vx, vy, vz, age, lifetime)', () => {
    expect(STRIDE).toBe(8);
  });

  it('seedParticles respects stride', () => {
    const state = seedParticles(3, (i) => ({ x: i + 1 }));
    expect(state.length).toBe(3 * STRIDE);
    expect(state[0]).toBe(1);
    expect(state[STRIDE]).toBe(2);
    expect(state[STRIDE * 2]).toBe(3);
  });
});
