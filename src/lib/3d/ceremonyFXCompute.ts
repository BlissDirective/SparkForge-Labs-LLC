// ════════════════════════════════════════════════════════════════
// ceremonyFXCompute — P5 §10.8 Option A (TSL Compute Shader)
// ════════════════════════════════════════════════════════════════
//
// TSL compute kernels for CeremonyFX particle archetypes. WebGPU-only
// system — CPU fallback for WebGL2 lives in `CeremonyFX.tsx` itself.
//
// Architectures:
//   1. CONFETTI — ballistic + rotation + gravity + drag + fade
//   2. FIREWORK — per-burst delay gate + radial expansion + gravity
//   3. TROPHY   — scatter→surface lerp (ease-in-out cubic)
//   4. SHOWER   — falling with wrap + shimmer size pulse
//
// Each archetype gets an independent storage-buffer set + kernel,
// but all share a single uniform block so CeremonyFX.tsx can push
// `elapsed`, `labColor`, and `shatterOrigin` once per frame.
//
// Mythos note: Four archetypes map 1:1 to MoE experts. The top-level
// "router" is the ceremony `type` — no runtime branching inside the
// kernel, so each expert's compiled WGSL is maximally optimized.
// This avoids the `If(equal(phase, N))` branching tax that a unified
// kernel would incur.
//
// Parity target: CPU physicsCore.integrateParticles uses semi-implicit
// Euler with gravity + drag. These TSL kernels preserve the same
// mathematical model so the CPU fallback and GPU path produce
// visually identical motion.
// ════════════════════════════════════════════════════════════════

import {
  Fn,
  float,
  vec3,
  vec4,
  instanceIndex,
  instancedArray,
  uniform,
  deltaTime,
  If,
  lessThanEqual,
  greaterThanEqual,
  hash,
  sin,
  cos,
  PI,
} from 'three/tsl';
import { Color, Vector3 } from 'three';
import type Node from 'three/src/nodes/core/Node.js';
import type StorageBufferNode from 'three/src/nodes/accessors/StorageBufferNode.js';
import type UniformNode from 'three/src/nodes/core/UniformNode.js';

// ■■ Archetype Enum ■■
export type CeremonyArchetype = 'confetti' | 'firework' | 'trophy' | 'shower';

// ■■ Particle counts (match CeremonyFX CPU defaults) ■■
export const CEREMONY_PARTICLE_COUNTS = {
  confetti: 500,   // was 250-500 — bumped to match epic-tier confettiCount
  firework: 180,   // 3 bursts × 60 particles each
  trophy:   200,   // TROPHY_PARTICLE_COUNT from CeremonyFX
  shower:   120,   // showerCount from CeremonyFX
} as const;

// Gravity constant shared with CPU physics (9.8 m/s²)
export const CEREMONY_GRAVITY = -9.8;

// ■■ Shared Uniform Block ■■
// One instance per ceremony; all 4 archetype kernels read from it.
export interface CeremonyUniforms {
  /** Seconds since ceremony started. Drives all time-based behavior. */
  elapsed: UniformNode<'float', number>;
  /** Total ceremony duration (seconds) — used for fade gates. */
  duration: UniformNode<'float', number>;
  /** Lab color vec3 (R, G, B 0-1) — primary celebration hue. */
  labColor: UniformNode<'vec3', Vector3>;
  /** Secondary color — accent / chrome / complementary. */
  accentColor: UniformNode<'vec3', Vector3>;
  /** Tertiary color for firework diversity. */
  tertiaryColor: UniformNode<'vec3', Vector3>;
  /** Shatter origin — for firework burst centers or convergence points. */
  shatterOrigin: UniformNode<'vec3', Vector3>;
  /** Gravity vector (0, CEREMONY_GRAVITY, 0) by default. */
  gravity: UniformNode<'vec3', Vector3>;
  /** Global drag coefficient (air resistance). */
  drag: UniformNode<'float', number>;
}

export function createCeremonyUniforms(labColorHex = '#00BBFF'): CeremonyUniforms {
  const labColor = new Color(labColorHex);
  const accentColor = new Color('#FFD700'); // gold
  const tertiaryColor = new Color('#AA66FF'); // purple
  return {
    elapsed:       uniform(0),
    duration:      uniform(4.0),
    labColor:      uniform(new Vector3(labColor.r, labColor.g, labColor.b)),
    accentColor:   uniform(new Vector3(accentColor.r, accentColor.g, accentColor.b)),
    tertiaryColor: uniform(new Vector3(tertiaryColor.r, tertiaryColor.g, tertiaryColor.b)),
    shatterOrigin: uniform(new Vector3(0, 0, 0)),
    gravity:       uniform(new Vector3(0, CEREMONY_GRAVITY, 0)),
    drag:          uniform(0.1),
  };
}

// ════════════════════════════════════════════════════════════════
// ARCHETYPE 1: CONFETTI — Ballistic with rotation, gravity, drag
// ════════════════════════════════════════════════════════════════

export interface ConfettiBuffers {
  /** Current positions (vec3) */
  positions: StorageBufferNode<'vec3'>;
  /** Current velocities (vec3) */
  velocities: StorageBufferNode<'vec3'>;
  /** Current rotation Euler angles (vec3) */
  rotations: StorageBufferNode<'vec3'>;
  /** Rotation speed per axis (vec3) */
  rotSpeeds: StorageBufferNode<'vec3'>;
  /** Per-particle color (vec4 — RGBA) */
  colors: StorageBufferNode<'vec4'>;
  /** Initial velocity snapshot (for re-seed / reset) */
  initVelocities: StorageBufferNode<'vec3'>;
}

export function createConfettiBuffers(count = CEREMONY_PARTICLE_COUNTS.confetti): ConfettiBuffers {
  return {
    positions:      instancedArray(count, 'vec3'),
    velocities:     instancedArray(count, 'vec3'),
    rotations:      instancedArray(count, 'vec3'),
    rotSpeeds:      instancedArray(count, 'vec3'),
    colors:         instancedArray(count, 'vec4'),
    initVelocities: instancedArray(count, 'vec3'),
  };
}

/** Initialize confetti buffers with CPU-seeded start state. Called once
 *  at ceremony start. Matches ConfettiBurst useMemo init in CeremonyFX.tsx. */
export const initConfettiKernel = (u: CeremonyUniforms, b: ConfettiBuffers) => {
  // Cast uniforms to Node for TSL ops (same pattern as heroParticleCompute)
  const accentNode = u.accentColor as unknown as Node<'vec3'>;
  const labNode = u.labColor as unknown as Node<'vec3'>;

  return Fn(() => {
    const idx = instanceIndex;
    const pos = b.positions.element(idx);
    const vel = b.velocities.element(idx);
    const rot = b.rotations.element(idx);
    const rotSpeed = b.rotSpeeds.element(idx);
    const col = b.colors.element(idx);
    const initVel = b.initVelocities.element(idx);

    // Start position — small spread near origin
    const h1 = hash(idx.add(1)).sub(0.5);
    const h2 = hash(idx.add(2)).sub(0.5);
    pos.assign(vec3(h1.mul(0.3), float(0), h2.mul(0.3)));

    // Initial velocity — upward burst with horizontal spread
    const angle = hash(idx.add(3)).mul(PI).mul(2);
    const speed = hash(idx.add(4)).mul(5).add(3); // 3-8
    const vx = cos(angle).mul(speed).mul(0.6);
    const vy = hash(idx.add(5)).mul(6).add(4); // 4-10
    const vz = sin(angle).mul(speed).mul(0.6);
    vel.assign(vec3(vx, vy, vz));
    initVel.assign(vec3(vx, vy, vz));

    // Random rotation + spin
    rot.assign(vec3(
      hash(idx.add(10)).mul(PI).mul(2),
      hash(idx.add(11)).mul(PI).mul(2),
      hash(idx.add(12)).mul(PI).mul(2),
    ));
    rotSpeed.assign(vec3(
      hash(idx.add(20)).sub(0.5).mul(8),
      hash(idx.add(21)).sub(0.5).mul(8),
      hash(idx.add(22)).sub(0.5).mul(8),
    ));

    // Decision 18.1: Metallic shards — chrome (accent) vs gold (lab)
    // Even indices = accent (chrome), odd = lab color
    const isEven = idx.modInt(2).equal(0);
    const chosen = vec3(0).add(accentNode).mul(float(0)); // placeholder to make types align
    // Use a simple mix: even → accent, odd → lab
    const mixed = accentNode.mul(float(1).sub(idx.modInt(2).toFloat())).add(
      labNode.mul(idx.modInt(2).toFloat()),
    );
    // isEven is only used to make the reader understand intent; TSL
    // select lowering handles the actual branch.
    void isEven;
    void chosen;
    col.assign(vec4(mixed, float(0.95)));
  });
};

/** Per-frame physics kernel for confetti. Ballistic with gravity + drag. */
export const stepConfettiKernel = (u: CeremonyUniforms, b: ConfettiBuffers) => {
  const gravityNode = u.gravity as unknown as Node<'vec3'>;
  const dragNode = u.drag as unknown as Node<'float'>;
  const elapsedNode = u.elapsed as unknown as Node<'float'>;
  const durationNode = u.duration as unknown as Node<'float'>;

  return Fn(() => {
    const idx = instanceIndex;
    const pos = b.positions.element(idx);
    const vel = b.velocities.element(idx);
    const rot = b.rotations.element(idx);
    const rotSpeed = b.rotSpeeds.element(idx);
    const col = b.colors.element(idx);

    // Semi-implicit Euler: velocity first (gravity + drag), then position
    vel.addAssign(gravityNode.mul(deltaTime));
    vel.mulAssign(float(1).sub(dragNode.mul(deltaTime)).max(float(0)));
    pos.addAssign(vel.mul(deltaTime));

    // Rotation advances by rotSpeed * dt (preserved from CPU path)
    rot.addAssign(rotSpeed.mul(deltaTime));

    // Fade alpha in last 30% of ceremony duration (matches CPU opacity calc)
    const fadeStart = durationNode.mul(float(0.7));
    const overStart = elapsedNode.sub(fadeStart).max(float(0));
    const fadeRange = durationNode.sub(fadeStart).max(float(0.0001));
    const opacity = float(1).sub(overStart.div(fadeRange)).clamp(0, 1);
    col.w.assign(opacity);
  });
};

// ════════════════════════════════════════════════════════════════
// ARCHETYPE 2: FIREWORK — 3 bursts with delay gates, radial expand
// ════════════════════════════════════════════════════════════════

export interface FireworkBuffers {
  positions:  StorageBufferNode<'vec3'>;
  directions: StorageBufferNode<'vec3'>; // unit direction × speed
  centers:    StorageBufferNode<'vec3'>; // burst center per particle
  meta:       StorageBufferNode<'vec4'>; // (delay, burstIdx, unused, unused)
  colors:     StorageBufferNode<'vec4'>; // RGBA (alpha drives fade)
}

export function createFireworkBuffers(count = CEREMONY_PARTICLE_COUNTS.firework): FireworkBuffers {
  return {
    positions:  instancedArray(count, 'vec3'),
    directions: instancedArray(count, 'vec3'),
    centers:    instancedArray(count, 'vec3'),
    meta:       instancedArray(count, 'vec4'),
    colors:     instancedArray(count, 'vec4'),
  };
}

/** Initialize firework buffers. 3 bursts × N particles; burstIdx encoded in meta.y.
 *  Burst 0: center (-1.5, 2.5, 0), delay 0.0, labColor
 *  Burst 1: center (1.0, 3.0, -0.5), delay 0.6, tertiary (purple)
 *  Burst 2: center (0, 3.5, 0.5), delay 1.2, accent2 (orange #FF6644) */
export const initFireworkKernel = (u: CeremonyUniforms, b: FireworkBuffers) => {
  const labNode = u.labColor as unknown as Node<'vec3'>;
  const tertiaryNode = u.tertiaryColor as unknown as Node<'vec3'>;

  return Fn(() => {
    const idx = instanceIndex;
    const perBurst = float(CEREMONY_PARTICLE_COUNTS.firework / 3); // 60

    // Burst index: 0, 1, or 2 depending on idx range
    const burstIdx = idx.toFloat().div(perBurst).floor();

    // Burst center + delay from burstIdx
    // Encode via select-ish math; TSL doesn't have arrays of uniforms
    // so we compute from idx directly.
    // burst 0: (-1.5, 2.5, 0), delay 0.0
    // burst 1: (1.0, 3.0, -0.5), delay 0.6
    // burst 2: (0, 3.5, 0.5), delay 1.2
    const b0 = burstIdx.equal(0).toFloat();
    const b1 = burstIdx.equal(1).toFloat();
    const b2 = burstIdx.equal(2).toFloat();

    const cx = float(-1.5).mul(b0).add(float(1.0).mul(b1)).add(float(0).mul(b2));
    const cy = float(2.5).mul(b0).add(float(3.0).mul(b1)).add(float(3.5).mul(b2));
    const cz = float(0).mul(b0).add(float(-0.5).mul(b1)).add(float(0.5).mul(b2));
    const center = vec3(cx, cy, cz);
    const delay = float(0).mul(b0).add(float(0.6).mul(b1)).add(float(1.2).mul(b2));

    // Color per burst — lab / tertiary / orange
    // Hardcode orange (#FF6644) = (1.0, 0.4, 0.267) for burst 2
    const orange = vec3(float(1.0), float(0.4), float(0.267));
    const color = labNode.mul(b0).add(tertiaryNode.mul(b1)).add(orange.mul(b2));

    // Random direction on sphere (theta, phi mapping)
    const theta = hash(idx.add(100)).mul(PI).mul(2);
    const phi = hash(idx.add(200)).mul(2).sub(1).acos(); // acos(2r-1)
    const speed = hash(idx.add(300)).mul(2.5).add(1.5); // 1.5-4.0
    const dx = sin(phi).mul(cos(theta)).mul(speed);
    const dy = sin(phi).mul(sin(theta)).mul(speed);
    const dz = cos(phi).mul(speed);

    b.positions.element(idx).assign(center);
    b.directions.element(idx).assign(vec3(dx, dy, dz));
    b.centers.element(idx).assign(center);
    b.meta.element(idx).assign(vec4(delay, burstIdx, float(0), float(0)));
    b.colors.element(idx).assign(vec4(color, float(0))); // alpha starts at 0 (gated)
  });
};

/** Per-frame kernel. Expand radially after delay elapsed, with gravity. */
export const stepFireworkKernel = (u: CeremonyUniforms, b: FireworkBuffers) => {
  const elapsedNode = u.elapsed as unknown as Node<'float'>;

  return Fn(() => {
    const idx = instanceIndex;
    const pos = b.positions.element(idx);
    const dir = b.directions.element(idx);
    const center = b.centers.element(idx);
    const meta = b.meta.element(idx);
    const col = b.colors.element(idx);

    const delay = meta.x;
    const burstT = elapsedNode.sub(delay);

    // Gate: inactive before delay, faded after 2s
    const active = greaterThanEqual(burstT, 0).and(lessThanEqual(burstT, 2.0));

    // Position = center + dir*t + 0.5*gravity*0.15*t² (matches CPU path)
    const g = float(CEREMONY_GRAVITY).mul(0.15);
    const tt = burstT.mul(burstT);
    const newPos = center
      .add(dir.mul(burstT))
      .add(vec3(float(0), g.mul(tt).mul(0.5), float(0)));

    // Fade 1→0 over burstT in [0, 2]
    const fade = float(1).sub(burstT.div(2.0)).clamp(0, 1);

    If(active, () => {
      pos.assign(newPos);
      col.w.assign(fade);
    });
    // When inactive, keep prior pos but zero alpha (render pass hides it)
    If(active.not(), () => {
      col.w.assign(float(0));
    });
  });
};

// ════════════════════════════════════════════════════════════════
// ARCHETYPE 3: TROPHY — Scatter→surface lerp, ease-in-out cubic
// ════════════════════════════════════════════════════════════════

export interface TrophyBuffers {
  /** Current particle positions */
  positions: StorageBufferNode<'vec3'>;
  /** Scattered start positions (radius 2-4 sphere above trophy) */
  startPos:  StorageBufferNode<'vec3'>;
  /** Target positions on trophy surface (pedestal / cup / sphere) */
  targetPos: StorageBufferNode<'vec3'>;
  /** Per-particle color (vec4 RGBA) */
  colors:    StorageBufferNode<'vec4'>;
}

export function createTrophyBuffers(count = CEREMONY_PARTICLE_COUNTS.trophy): TrophyBuffers {
  return {
    positions: instancedArray(count, 'vec3'),
    startPos:  instancedArray(count, 'vec3'),
    targetPos: instancedArray(count, 'vec3'),
    colors:    instancedArray(count, 'vec4'),
  };
}

/** Initialize trophy buffers. Mirrors sampleTrophyTargets() in CeremonyFX.tsx:
 *  - First 30% of particles map to pedestal (cylinder y=-0.3 to -0.1, r=0.2-0.3)
 *  - Next 45% map to cup body (cylinder y=-0.1 to 0.4, r=0.15-0.25)
 *  - Last 25% map to top sphere (y=0.55 center, r=0.15) */
export const initTrophyKernel = (u: CeremonyUniforms, b: TrophyBuffers) => {
  // All trophy particles are gold — use accent uniform (pre-set to #FFD700)
  const accentNode = u.accentColor as unknown as Node<'vec3'>;
  const N = float(CEREMONY_PARTICLE_COUNTS.trophy);

  return Fn(() => {
    const idx = instanceIndex;
    // section = idx / N (normalized 0..1)
    const section = idx.toFloat().div(N);

    // ── Scatter start position ──
    // Sphere shell radius 2-4 around y=1.0
    const theta = hash(idx.add(1)).mul(PI).mul(2);
    const phi = hash(idx.add(2)).mul(2).sub(1).acos();
    const r = hash(idx.add(3)).mul(2).add(2); // 2-4
    const sx = sin(phi).mul(cos(theta)).mul(r);
    const sy = sin(phi).mul(sin(theta)).mul(r).add(1.0);
    const sz = cos(phi).mul(r);
    b.startPos.element(idx).assign(vec3(sx, sy, sz));

    // ── Trophy target position ──
    // Pedestal: section < 0.3
    const isPedestal = section.lessThan(0.3).toFloat();
    // Cup body: 0.3 <= section < 0.75
    const isCup = section.greaterThanEqual(0.3).and(section.lessThan(0.75)).toFloat();
    // Sphere top: section >= 0.75
    const isSphere = section.greaterThanEqual(0.75).toFloat();

    // Shared angles
    const tAngle = hash(idx.add(50)).mul(PI).mul(2);

    // Pedestal geometry
    const pY = hash(idx.add(51)).mul(0.2).sub(0.3); // -0.3 to -0.1
    const pR = float(0.2).add(float(0.1).mul(pY.add(0.3).div(0.2))); // 0.2-0.3
    const pX = cos(tAngle).mul(pR);
    const pZ = sin(tAngle).mul(pR);

    // Cup geometry
    const cY = hash(idx.add(52)).mul(0.5).sub(0.1); // -0.1 to 0.4
    const cR = float(0.15).add(float(0.1).mul(cY.add(0.1).div(0.5))); // 0.15-0.25
    const cX = cos(tAngle).mul(cR);
    const cZ = sin(tAngle).mul(cR);

    // Sphere top geometry (around y=0.55, r=0.15)
    const sTheta = hash(idx.add(60)).mul(PI).mul(2);
    const sPhi = hash(idx.add(61)).mul(2).sub(1).acos();
    const ssX = sin(sPhi).mul(cos(sTheta)).mul(0.15);
    const ssY = sin(sPhi).mul(sin(sTheta)).mul(0.15).add(0.55);
    const ssZ = cos(sPhi).mul(0.15);

    // Blend via masks
    const tx = pX.mul(isPedestal).add(cX.mul(isCup)).add(ssX.mul(isSphere));
    const ty = pY.mul(isPedestal).add(cY.mul(isCup)).add(ssY.mul(isSphere));
    const tz = pZ.mul(isPedestal).add(cZ.mul(isCup)).add(ssZ.mul(isSphere));
    b.targetPos.element(idx).assign(vec3(tx, ty, tz));

    // Start at scatter position
    b.positions.element(idx).assign(vec3(sx, sy, sz));

    // Gold color
    b.colors.element(idx).assign(vec4(accentNode, float(0.95)));
  });
};

/** Per-frame kernel. Ease-in-out cubic convergence over 1.6s (TROPHY_CONVERGE_TIME). */
export const stepTrophyKernel = (u: CeremonyUniforms, b: TrophyBuffers) => {
  const elapsedNode = u.elapsed as unknown as Node<'float'>;
  const durationNode = u.duration as unknown as Node<'float'>;

  return Fn(() => {
    const idx = instanceIndex;
    const start = b.startPos.element(idx);
    const target = b.targetPos.element(idx);
    const col = b.colors.element(idx);

    // Convergence progress: 0 → 1 over 1.6s
    const convergeT = elapsedNode.div(1.6).clamp(0, 1);

    // Ease-in-out cubic
    // t < 0.5: 4t³
    // t >= 0.5: 1 - (-2t+2)³ / 2
    const t2 = convergeT.mul(convergeT);
    const t3 = t2.mul(convergeT);
    const easeIn = float(4).mul(t3);
    const oneMinus = float(-2).mul(convergeT).add(2);
    const easeOut = float(1).sub(oneMinus.mul(oneMinus).mul(oneMinus).div(2));
    const lt = convergeT.lessThan(0.5).toFloat();
    const eased = easeIn.mul(lt).add(easeOut.mul(float(1).sub(lt)));

    // Fade out in last 1s of ceremony
    const fadeStart = durationNode.sub(1.0);
    const fadeT = elapsedNode.sub(fadeStart).max(0);
    const fadeOut = float(1).sub(fadeT).clamp(0, 1);

    // Lerp start → target
    const newPos = start.mix(target, eased);
    b.positions.element(idx).assign(newPos);
    col.w.assign(float(0.95).mul(fadeOut));
  });
};

// ════════════════════════════════════════════════════════════════
// ARCHETYPE 4: SHOWER — Falling particles with wrap + shimmer
// ════════════════════════════════════════════════════════════════

export interface ShowerBuffers {
  /** Current positions */
  positions: StorageBufferNode<'vec3'>;
  /** Per-particle params: (xBase, zBase, speed, shimmerPhase) */
  params:    StorageBufferNode<'vec4'>;
  /** Per-particle color (vec4 RGBA — alpha drives shimmer) */
  colors:    StorageBufferNode<'vec4'>;
}

export function createShowerBuffers(count = CEREMONY_PARTICLE_COUNTS.shower): ShowerBuffers {
  return {
    positions: instancedArray(count, 'vec3'),
    params:    instancedArray(count, 'vec4'),
    colors:    instancedArray(count, 'vec4'),
  };
}

/** Initialize shower buffers. */
export const initShowerKernel = (u: CeremonyUniforms, b: ShowerBuffers) => {
  const labNode = u.labColor as unknown as Node<'vec3'>;

  return Fn(() => {
    const idx = instanceIndex;
    // Random X in [-3, 3], Z in [-2, 2]
    const xBase = hash(idx.add(1)).mul(6).sub(3);
    const zBase = hash(idx.add(2)).mul(4).sub(2);
    const speed = hash(idx.add(3)).mul(3).add(1.5); // 1.5-4.5
    const phase = hash(idx.add(4)).mul(PI).mul(2);
    // Initial offset (stagger start height)
    const initOffset = hash(idx.add(5)).mul(5);

    b.params.element(idx).assign(vec4(xBase, zBase, speed, phase));
    b.positions.element(idx).assign(vec3(xBase, initOffset, zBase));
    b.colors.element(idx).assign(vec4(labNode, float(0.8)));
  });
};

/** Per-frame kernel. Fall with wrap + shimmer + gentle sway. */
export const stepShowerKernel = (u: CeremonyUniforms, b: ShowerBuffers) => {
  const elapsedNode = u.elapsed as unknown as Node<'float'>;
  const durationNode = u.duration as unknown as Node<'float'>;
  const labNode = u.labColor as unknown as Node<'vec3'>;

  return Fn(() => {
    const idx = instanceIndex;
    const params = b.params.element(idx);
    const col = b.colors.element(idx);

    const xBase = params.x;
    const zBase = params.y;
    const speed = params.z;
    const phase = params.w;

    // Falling y with wrap: ((offset - speed*t) % 8 + 8) % 8 - 3
    const raw = hash(idx.add(100)).mul(5).sub(speed.mul(elapsedNode));
    // Approximate wrap — sample to 8-unit interval
    // y = raw mod 8, then remap to [-3, 5]
    const wrapped = raw.mod(float(8)).add(8).mod(float(8)).sub(3);

    // Sway: sin(elapsed * 1.5 + phase) * 0.2
    const swayArg = elapsedNode.mul(1.5).add(phase);
    const sway = sin(swayArg).mul(0.2);
    const x = xBase.add(sway);

    b.positions.element(idx).assign(vec3(x, wrapped, zBase));

    // Shimmer: 0.5 + 0.5*sin(elapsed*4 + phase) — drives alpha pulsing
    const shimmer = sin(elapsedNode.mul(4).add(phase)).mul(0.5).add(0.5);

    // Fade out in last 1s
    const fadeStart = durationNode.sub(1.0);
    const fadeT = elapsedNode.sub(fadeStart).max(0);
    const fadeOut = float(1).sub(fadeT).clamp(0, 1);

    col.xyz.assign(labNode);
    col.w.assign(shimmer.mul(0.8).mul(fadeOut));
  });
};

// ════════════════════════════════════════════════════════════════
// SYSTEM FACTORY — wires archetype buffers + kernels together
// ════════════════════════════════════════════════════════════════

export interface CeremonyKernelPair {
  init: ReturnType<typeof Fn>;
  step: ReturnType<typeof Fn>;
}

export interface CeremonyComputeSystem {
  uniforms: CeremonyUniforms;
  confetti: { buffers: ConfettiBuffers;  kernels: CeremonyKernelPair; count: number };
  firework: { buffers: FireworkBuffers;  kernels: CeremonyKernelPair; count: number };
  trophy:   { buffers: TrophyBuffers;    kernels: CeremonyKernelPair; count: number };
  shower:   { buffers: ShowerBuffers;    kernels: CeremonyKernelPair; count: number };
  dispose: () => void;
}

/** Create the full compute system. One instance per active ceremony.
 *  WebGPU-only — caller must verify gpuTier !== 'webgl2' before instantiating. */
export function createCeremonyComputeSystem(labColorHex = '#00BBFF'): CeremonyComputeSystem {
  const uniforms = createCeremonyUniforms(labColorHex);

  const confettiB = createConfettiBuffers();
  const fireworkB = createFireworkBuffers();
  const trophyB = createTrophyBuffers();
  const showerB = createShowerBuffers();

  return {
    uniforms,
    confetti: {
      buffers: confettiB,
      kernels: {
        init: initConfettiKernel(uniforms, confettiB),
        step: stepConfettiKernel(uniforms, confettiB),
      },
      count: CEREMONY_PARTICLE_COUNTS.confetti,
    },
    firework: {
      buffers: fireworkB,
      kernels: {
        init: initFireworkKernel(uniforms, fireworkB),
        step: stepFireworkKernel(uniforms, fireworkB),
      },
      count: CEREMONY_PARTICLE_COUNTS.firework,
    },
    trophy: {
      buffers: trophyB,
      kernels: {
        init: initTrophyKernel(uniforms, trophyB),
        step: stepTrophyKernel(uniforms, trophyB),
      },
      count: CEREMONY_PARTICLE_COUNTS.trophy,
    },
    shower: {
      buffers: showerB,
      kernels: {
        init: initShowerKernel(uniforms, showerB),
        step: stepShowerKernel(uniforms, showerB),
      },
      count: CEREMONY_PARTICLE_COUNTS.shower,
    },
    dispose() {
      // Three.js GC releases instancedArray GPU resources automatically
      // when buffers go out of scope. Nothing to explicitly free here.
    },
  };
}

/** Update uniforms at the start of each frame. CPU-driven — cheap. */
export function updateCeremonyUniforms(
  u: CeremonyUniforms,
  elapsed: number,
  duration: number,
  labColorHex?: string,
) {
  u.elapsed.value = elapsed;
  u.duration.value = duration;
  if (labColorHex) {
    const c = new Color(labColorHex);
    u.labColor.value.set(c.r, c.g, c.b);
  }
}

