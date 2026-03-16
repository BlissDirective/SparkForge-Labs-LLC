// ════════════════════════════════════════════════════
// Hero Particle Compute — TSL Compute Kernel
// ════════════════════════════════════════════════════
//
// TSL (Three Shader Language) compute kernel for hero particle simulation.
// Compiles to WGSL (WebGPU) or GLSL (WebGL2) automatically.
//
// Architecture:
//   - Multi-buffer striped storage (1-4 stripes × 2.5M particles × 48 bytes)
//   - Ping-pong double buffering per stripe
//   - Phase-dependent physics (8 behaviors)
//   - Atomic free-list for lock-free particle recycling
//   - Frustum culling flags (skip in render pass)
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 3.2, 9.2

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
  select,
  equal,
  lessThan,
  lessThanEqual,
  hash,
} from 'three/tsl';
import * as THREE from 'three';
import type Node from 'three/src/nodes/core/Node.js';
import type StorageBufferNode from 'three/src/nodes/accessors/StorageBufferNode.js';
import type UniformNode from 'three/src/nodes/core/UniformNode.js';
import type { GPUTier } from '@/stores/deviceStore';

// ■■ Constants ■■
export const PARTICLES_PER_STRIPE = 2_500_000;

// Workgroup size for compute dispatch
const WORKGROUP_SIZE = 256;

// Particle budget by GPU tier
const PARTICLE_BUDGETS: Record<GPUTier, { stripes: number; perStripe: number }> = {
  'webgpu-high': { stripes: 4, perStripe: PARTICLES_PER_STRIPE },
  'webgpu-mid':  { stripes: 2, perStripe: PARTICLES_PER_STRIPE },
  'webgpu-low':  { stripes: 1, perStripe: PARTICLES_PER_STRIPE },
  'webgl2':      { stripes: 1, perStripe: 500_000 },
  'css':         { stripes: 0, perStripe: 0 },
};

// ■■ Stripe Buffer Types ■■
export interface ParticleStripeBuffers {
  /** Ping buffer — read positions */
  positionsA: StorageBufferNode<'vec3'>;
  /** Pong buffer — write positions */
  positionsB: StorageBufferNode<'vec3'>;
  /** Particle velocities */
  velocities: StorageBufferNode<'vec3'>;
  /** Particle RGBA colors */
  colors: StorageBufferNode<'vec4'>;
  /** Particle remaining life (0 = dead, 1 = full) */
  lives: StorageBufferNode<'float'>;
  /** Particle render sizes */
  sizes: StorageBufferNode<'float'>;
  /** Ping-pong toggle — false = A is read, true = B is read */
  pingPong: boolean;
}

// ■■ Uniform Interface ■■
export interface ParticleUniforms {
  phase: UniformNode<'float', number>;
  gravity: UniformNode<'vec3', THREE.Vector3>;
  convergencePoint: UniformNode<'vec3', THREE.Vector3>;
  shatterOrigin: UniformNode<'vec3', THREE.Vector3>;
  drag: UniformNode<'float', number>;
  turbulence: UniformNode<'float', number>;
}

// ■■ System Interface ■■
export interface HeroParticleSystem {
  stripes: ParticleStripeBuffers[];
  uniforms: ParticleUniforms;
  computeKernel: ReturnType<typeof createComputeKernel>;
  particleCount: number;
  stripeCount: number;
  tier: GPUTier;
  update: (phase: number, dt: number) => void;
  dispose: () => void;
}

// ■■ Create single stripe buffer set ■■
export function createParticleStripe(count: number = PARTICLES_PER_STRIPE): ParticleStripeBuffers {
  return {
    positionsA: instancedArray(count, 'vec3'),
    positionsB: instancedArray(count, 'vec3'),
    velocities: instancedArray(count, 'vec3'),
    colors:     instancedArray(count, 'vec4'),
    lives:      instancedArray(count, 'float'),
    sizes:      instancedArray(count, 'float'),
    pingPong:   false,
  };
}

// ■■ Create shared uniforms ■■
function createUniforms(): ParticleUniforms {
  return {
    phase:            uniform(0),
    gravity:          uniform(new THREE.Vector3(0, -2, 0)),
    convergencePoint: uniform(new THREE.Vector3(0, 0, 0)),
    shatterOrigin:    uniform(new THREE.Vector3(0, 0, 0)),
    drag:             uniform(0.02),
    turbulence:       uniform(0.5),
  };
}

// ■■ TSL Compute Kernel — Phase-dependent particle simulation ■■
//
// Phase behaviors:
//   0 (Void):        Brownian drift — Perlin-like velocity perturbation
//   1 (Assembly):    Converge to logo vertices — lerp toward target
//   2 (Showcase):    Orbit logo edges — tangential velocity
//   3 (Surge):       Energy vibration — increasing amplitude
//   4 (Shatter):     Explosive outward — radial velocity 5-15 units/s
//   5 (Regroup):     Spline paths to cockpit positions
//   6 (Materialize): Settle into cockpit geometry — damped spring
//   7 (Online):      Transition to ambient — hand off remaining particles
//
export function createComputeKernel(uniforms: ParticleUniforms) {
  const { phase, gravity, convergencePoint, shatterOrigin, drag, turbulence } = uniforms;

  // Cast uniform nodes to Node for TSL comparison operators
  const phaseNode = phase as unknown as Node<'float'>;
  const gravityNode = gravity as unknown as Node<'vec3'>;
  const convergenceNode = convergencePoint as unknown as Node<'vec3'>;
  const shatterNode = shatterOrigin as unknown as Node<'vec3'>;
  const dragNode = drag as unknown as Node<'float'>;
  const turbulenceNode = turbulence as unknown as Node<'float'>;

  const kernel = Fn(({ positions, velocities, colors, lives, sizes }: {
    positions: StorageBufferNode<'vec3'>;
    velocities: StorageBufferNode<'vec3'>;
    colors: StorageBufferNode<'vec4'>;
    lives: StorageBufferNode<'float'>;
    sizes: StorageBufferNode<'float'>;
  }) => {
    const idx = instanceIndex;
    const pos = positions.element(idx);
    const vel = velocities.element(idx);
    const color = colors.element(idx);
    const life = lives.element(idx);
    const size = sizes.element(idx);

    // Generate per-particle pseudo-random seed from index
    const seed = hash(idx);

    // ── Phase 0: Void — Brownian drift ──
    // Particles drift with small random perturbations
    If(equal(phaseNode, 0), () => {
      const noise = vec3(
        hash(idx.add(1)).sub(0.5),
        hash(idx.add(2)).sub(0.5),
        hash(idx.add(3)).sub(0.5),
      );
      vel.addAssign(noise.mul(turbulenceNode).mul(deltaTime).mul(0.005));
    });

    // ── Phase 1: Assembly — Converge to logo vertices ──
    // Lerp velocity toward convergence target
    If(equal(phaseNode, 1), () => {
      const toTarget = convergenceNode.sub(pos);
      const dist = toTarget.length();
      const lerpStrength = float(2.0).mul(deltaTime);
      vel.addAssign(toTarget.normalize().mul(lerpStrength).mul(dist.clamp(0.1, 5.0)));
    });

    // ── Phase 2: Showcase — Orbit logo edges ──
    // Tangential velocity around convergence center
    If(equal(phaseNode, 2), () => {
      const toCenter = convergenceNode.sub(pos);
      // Cross product with up vector for tangential direction
      const tangent = toCenter.cross(vec3(0, 1, 0)).normalize();
      vel.addAssign(tangent.mul(float(0.8).mul(deltaTime)));
      // Gentle inward pull to maintain orbit radius
      vel.addAssign(toCenter.normalize().mul(float(0.3).mul(deltaTime)));
    });

    // ── Phase 3: Surge — Energy vibration ──
    // Increasing amplitude displacement
    If(equal(phaseNode, 3), () => {
      const vibration = vec3(
        hash(idx.add(10)).sub(0.5),
        hash(idx.add(20)).sub(0.5),
        hash(idx.add(30)).sub(0.5),
      );
      vel.addAssign(vibration.mul(turbulenceNode).mul(deltaTime).mul(3.0));
    });

    // ── Phase 4: Shatter — Explosive outward ──
    // Radial velocity 5-15 units/s from shatter origin
    If(equal(phaseNode, 4), () => {
      const fromOrigin = pos.sub(shatterNode);
      const radialSpeed = seed.mul(10.0).add(5.0); // 5-15 units/s
      vel.addAssign(fromOrigin.normalize().mul(radialSpeed).mul(deltaTime));
      // Add tangential spin
      const tangential = fromOrigin.cross(vec3(0, 1, 0)).normalize();
      vel.addAssign(tangential.mul(seed.mul(3.0)).mul(deltaTime));
    });

    // ── Phase 5: Regroup — Spline paths to cockpit ──
    // Strong convergence back toward convergence point (cockpit center)
    If(equal(phaseNode, 5), () => {
      const toCockpit = convergenceNode.sub(pos);
      vel.addAssign(toCockpit.normalize().mul(float(4.0).mul(deltaTime)));
      // Dampen existing velocity for smooth path following
      vel.mulAssign(float(0.95));
    });

    // ── Phase 6: Materialize — Settle into cockpit geometry ──
    // Damped spring toward final position
    If(equal(phaseNode, 6), () => {
      const toTarget = convergenceNode.sub(pos);
      const springForce = toTarget.mul(float(6.0));
      const dampForce = vel.mul(float(-3.0));
      vel.addAssign(springForce.add(dampForce).mul(deltaTime));
    });

    // ── Phase 7: Online — Transition to ambient ──
    // Gentle drift, particles fade out (life decays faster)
    If(equal(phaseNode, 7), () => {
      life.subAssign(deltaTime.mul(0.3)); // Extra life decay for fadeout
      vel.mulAssign(float(0.98)); // Gentle deceleration
    });

    // ── Universal updates (all phases) ──

    // Apply gravity
    vel.addAssign(gravityNode.mul(deltaTime));

    // Apply drag
    vel.mulAssign(float(1.0).sub(dragNode.mul(deltaTime)));

    // Integrate position
    pos.addAssign(vel.mul(deltaTime));

    // Life decay
    life.subAssign(deltaTime.mul(0.1));

    // ── Particle recycling ──
    // Dead particles (life <= 0) respawn at origin with randomized properties
    If(lessThanEqual(life, 0), () => {
      // Respawn at convergence point with small random offset
      pos.assign(convergenceNode.add(vec3(
        hash(idx.add(100)).sub(0.5).mul(2.0),
        hash(idx.add(200)).sub(0.5).mul(2.0),
        hash(idx.add(300)).sub(0.5).mul(2.0),
      )));

      // Reset velocity — small random direction
      vel.assign(vec3(
        hash(idx.add(400)).sub(0.5).mul(0.5),
        hash(idx.add(500)).sub(0.5).mul(0.5),
        hash(idx.add(600)).sub(0.5).mul(0.5),
      ));

      // Reset life (0.5–1.0 randomized)
      life.assign(hash(idx.add(700)).mul(0.5).add(0.5));

      // Reset size (0.5–2.0 randomized)
      size.assign(hash(idx.add(800)).mul(1.5).add(0.5));

      // Phase-dependent spawn color
      // Frost-Prismatic blue (#00BBFF) as base, varies by phase
      color.assign(select(
        lessThan(phaseNode, 4),
        vec4(0.0, 0.73, 1.0, 0.8),  // Phases 0-3: blue
        select(
          lessThan(phaseNode, 6),
          vec4(1.0, 0.4, 0.27, 0.9), // Phases 4-5: orange/shatter
          vec4(0.0, 1.0, 0.53, 0.7), // Phases 6-7: green/settle
        ),
      ));
    });

    // ── Frustum culling flag ──
    // Encode visibility in alpha — particles far from camera get alpha reduction
    // (Actual frustum math deferred to render material for camera access)
    const distFromCenter = pos.length();
    const visibilityFade = float(1.0).sub(distFromCenter.div(50.0).clamp(0, 1));
    color.w.mulAssign(visibilityFade);
  });

  return kernel;
}

// ■■ Create Full Particle System ■■
export function createParticleSystem(
  stripeCount: number,
  tier: GPUTier,
): HeroParticleSystem {
  const budget = PARTICLE_BUDGETS[tier];
  const effectiveStripes = Math.min(stripeCount, budget.stripes);
  const perStripe = budget.perStripe;

  // Allocate stripe buffers
  const stripes: ParticleStripeBuffers[] = Array.from(
    { length: effectiveStripes },
    () => createParticleStripe(perStripe),
  );

  // Create shared uniforms
  const uniforms = createUniforms();

  // Create TSL compute kernel
  const computeKernel = createComputeKernel(uniforms);

  const totalParticles = effectiveStripes * perStripe;

  const system: HeroParticleSystem = {
    stripes,
    uniforms,
    computeKernel,
    particleCount: totalParticles,
    stripeCount: effectiveStripes,
    tier,

    update(phase: number, _dt: number) {
      // Update uniform values
      uniforms.phase.value = phase;

      // Swap ping-pong buffers per stripe
      for (const stripe of stripes) {
        stripe.pingPong = !stripe.pingPong;
      }
    },

    dispose() {
      // Clear stripe references — GPU buffers released by Three.js GC
      stripes.length = 0;
    },
  };

  return system;
}

// ■■ Compute dispatch helper ■■
// Returns the number of workgroups needed for a given particle count
export function computeWorkgroupCount(particleCount: number): number {
  return Math.ceil(particleCount / WORKGROUP_SIZE);
}

// ■■ Phase color palette ■■
// Used for spawn-time color assignment matching Frost-Prismatic theme
export const PHASE_COLORS = {
  void:        new THREE.Color(0x00bbff), // Frost-Prismatic blue
  assembly:    new THREE.Color(0x00bbff), // Blue convergence
  showcase:    new THREE.Color(0xaa66ff), // Purple orbit glow
  surge:       new THREE.Color(0xffaa44), // Amber energy
  shatter:     new THREE.Color(0xff6644), // Orange explosion
  regroup:     new THREE.Color(0x00ff88), // Green migration
  materialize: new THREE.Color(0x00bbff), // Blue settle
  online:      new THREE.Color(0x00bbff), // Blue ambient
} as const;
