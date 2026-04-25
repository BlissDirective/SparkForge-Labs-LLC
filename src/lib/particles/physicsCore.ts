// ════════════════════════════════════════════════════════════════
// particles/physicsCore — P2 §10.8
// ════════════════════════════════════════════════════════════════
// Pure integrate function for particle physics. Deliberately free
// of Three.js / DOM / worker assumptions so the same function can
// run on:
//   - Main thread (current CeremonyFX useFrame callbacks)
//   - heavyCompute Web Worker (T12 infra)
//   - Future TSL compute kernel (as the CPU reference the kernel
//     must match)
//
// The state is a flat Float32Array of 8 channels per particle:
//   [x, y, z, vx, vy, vz, age, lifetime]
// packed contiguously. This layout maps 1:1 to a GPU buffer with
// stride 32 bytes, so a future TSL port is a mechanical transcription.
//
// Integration model: semi-implicit Euler with gravity + drag. Good
// enough for short-lived celebratory particles; NOT suitable for
// long physics simulations (error accumulates).
// ════════════════════════════════════════════════════════════════

export const STRIDE = 8;

export interface ParticleForces {
  /** Gravity acceleration (applied to vy each step). Negative = down. */
  gravity: number;
  /** Linear drag — velocity multiplied by (1 - drag*dt) each step. */
  drag: number;
  /** Optional wind vector [wx, wy, wz]. Additive acceleration. */
  wind?: readonly [number, number, number];
}

export interface IntegrateResult {
  /** Mutated input buffer (also returned for chaining). */
  state: Float32Array;
  /** Count of particles whose age now exceeds lifetime. */
  expired: number;
}

/**
 * Integrate `state` in place for `dt` seconds.
 * @param state Float32Array of N * STRIDE elements.
 * @param dt Timestep in seconds.
 * @param forces Gravity / drag / wind.
 * @returns The mutated state + expired count.
 */
export function integrateParticles(
  state: Float32Array,
  dt: number,
  forces: ParticleForces,
): IntegrateResult {
  const n = state.length / STRIDE;
  const { gravity, drag } = forces;
  const wx = forces.wind?.[0] ?? 0;
  const wy = forces.wind?.[1] ?? 0;
  const wz = forces.wind?.[2] ?? 0;
  const dragFactor = Math.max(0, 1 - drag * dt);
  let expired = 0;

  for (let i = 0; i < n; i++) {
    const o = i * STRIDE;
    // Read
    let vx = state[o + 3];
    let vy = state[o + 4];
    let vz = state[o + 5];
    let age = state[o + 6];
    const life = state[o + 7];

    // Semi-implicit Euler: velocity first, then position.
    vx = (vx + wx * dt) * dragFactor;
    vy = (vy + gravity * dt + wy * dt) * dragFactor;
    vz = (vz + wz * dt) * dragFactor;
    state[o] += vx * dt;
    state[o + 1] += vy * dt;
    state[o + 2] += vz * dt;

    state[o + 3] = vx;
    state[o + 4] = vy;
    state[o + 5] = vz;

    age += dt;
    state[o + 6] = age;

    if (life > 0 && age >= life) expired++;
  }

  return { state, expired };
}

/**
 * Seed a flat state buffer. Helper for tests + initial spawn logic.
 * `emitter` fills in per-particle values; omit any channel to leave
 * it at zero.
 */
export function seedParticles(
  count: number,
  emitter: (i: number) => Partial<{
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    age: number; lifetime: number;
  }>,
): Float32Array {
  const state = new Float32Array(count * STRIDE);
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE;
    const p = emitter(i);
    state[o] = p.x ?? 0;
    state[o + 1] = p.y ?? 0;
    state[o + 2] = p.z ?? 0;
    state[o + 3] = p.vx ?? 0;
    state[o + 4] = p.vy ?? 0;
    state[o + 5] = p.vz ?? 0;
    state[o + 6] = p.age ?? 0;
    state[o + 7] = p.lifetime ?? 1;
  }
  return state;
}
