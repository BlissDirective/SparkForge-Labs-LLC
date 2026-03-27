// ════════════════════════════════════════════════════════════════
// GAME PARTICLES — Shared Particle Presets for All 29 Games
// ════════════════════════════════════════════════════════════════
// Reusable particle effect configurations used by FL-Lite and
// Standard game 3D components. Renders inside CockpitCanvas via
// sceneStore (D3D-B3). Uses instanced meshes for performance.
//
// Presets:
//   confettiBurst   — gold/colored confetti for correct answers
//   sparkShower     — small sparks for interactions
//   dustCloud       — poof particles for discovery/cleaning
//   dataStream      — flowing particles between two 3D points
//   discoveryBurst  — radial burst for finding hidden items
//   victoryFireworks — full celebration for game completion
//   trailParticles  — fading trail behind moving objects
// ════════════════════════════════════════════════════════════════

import { Vector3, Color, MathUtils } from 'three';

// ── Particle State ──────────────────────────────────────────

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  color: Color;
  size: number;
  life: number;      // 0..1 (1 = just born, 0 = dead)
  maxLife: number;    // seconds
  rotation: number;
  rotSpeed: number;
  opacity: number;
}

// ── Preset Configs ──────────────────────────────────────────

export interface ParticlePreset {
  count: number;
  gravity: number;
  drag: number;
  sizeRange: [number, number];
  lifeRange: [number, number];
  speedRange: [number, number];
  colors: string[];
  blending: 'additive' | 'normal';
  fadeOut: boolean;
  shrinkOnDeath: boolean;
}

// ── Lab Colors ──────────────────────────────────────────────

export const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#F97316', 10: '#D946EF',
};

// ── Preset Definitions ──────────────────────────────────────

export const PARTICLE_PRESETS: Record<string, ParticlePreset> = {
  confettiBurst: {
    count: 60,
    gravity: -4.5,
    drag: 0.98,
    sizeRange: [0.03, 0.08],
    lifeRange: [1.5, 3.0],
    speedRange: [2.0, 5.0],
    colors: ['#FFD700', '#FF6644', '#00FF88', '#00BBFF', '#AA66FF', '#FF66AA'],
    blending: 'normal',
    fadeOut: true,
    shrinkOnDeath: true,
  },

  sparkShower: {
    count: 30,
    gravity: -1.0,
    drag: 0.95,
    sizeRange: [0.01, 0.04],
    lifeRange: [0.3, 0.8],
    speedRange: [1.0, 3.0],
    colors: ['#FFD700', '#FFFFFF', '#FFAA44'],
    blending: 'additive',
    fadeOut: true,
    shrinkOnDeath: false,
  },

  dustCloud: {
    count: 20,
    gravity: 0.5,
    drag: 0.92,
    sizeRange: [0.05, 0.15],
    lifeRange: [0.5, 1.2],
    speedRange: [0.5, 1.5],
    colors: ['#8B7355', '#A0936E', '#C4B48A'],
    blending: 'normal',
    fadeOut: true,
    shrinkOnDeath: false,
  },

  dataStream: {
    count: 40,
    gravity: 0,
    drag: 1.0,
    sizeRange: [0.02, 0.05],
    lifeRange: [1.0, 2.0],
    speedRange: [2.0, 4.0],
    colors: ['#00BBFF', '#00FF88', '#FFFFFF'],
    blending: 'additive',
    fadeOut: true,
    shrinkOnDeath: false,
  },

  discoveryBurst: {
    count: 40,
    gravity: -0.5,
    drag: 0.96,
    sizeRange: [0.02, 0.06],
    lifeRange: [0.8, 1.5],
    speedRange: [1.5, 4.0],
    colors: ['#FFD700', '#FFAA44', '#FFFFFF'],
    blending: 'additive',
    fadeOut: true,
    shrinkOnDeath: true,
  },

  victoryFireworks: {
    count: 80,
    gravity: -3.0,
    drag: 0.97,
    sizeRange: [0.02, 0.07],
    lifeRange: [1.0, 2.5],
    speedRange: [3.0, 7.0],
    colors: ['#FFD700', '#FF6644', '#00FF88', '#00BBFF', '#AA66FF', '#FF66AA', '#FFFFFF'],
    blending: 'additive',
    fadeOut: true,
    shrinkOnDeath: true,
  },

  trailParticles: {
    count: 20,
    gravity: 0,
    drag: 0.9,
    sizeRange: [0.02, 0.05],
    lifeRange: [0.3, 0.6],
    speedRange: [0.1, 0.3],
    colors: ['#FFFFFF'],
    blending: 'additive',
    fadeOut: true,
    shrinkOnDeath: true,
  },

  steamPuff: {
    count: 15,
    gravity: 1.5,
    drag: 0.93,
    sizeRange: [0.06, 0.18],
    lifeRange: [0.8, 1.8],
    speedRange: [0.3, 1.0],
    colors: ['#FFFFFF', '#DDDDDD', '#BBBBBB'],
    blending: 'normal',
    fadeOut: true,
    shrinkOnDeath: false,
  },
};

// ── Particle Factory ────────────────────────────────────────

/**
 * Create an array of particles from a preset, spawned at the given origin.
 * Direction is randomized within a unit sphere unless `direction` is provided.
 */
export function spawnParticles(
  presetName: string,
  origin: Vector3,
  overrides?: Partial<ParticlePreset> & { direction?: Vector3; spread?: number }
): Particle[] {
  const preset = { ...PARTICLE_PRESETS[presetName], ...overrides };
  if (!preset) return [];

  const particles: Particle[] = [];
  const spread = overrides?.spread ?? 1.0;

  for (let i = 0; i < preset.count; i++) {
    const speed = MathUtils.lerp(preset.speedRange[0], preset.speedRange[1], Math.random());
    const life = MathUtils.lerp(preset.lifeRange[0], preset.lifeRange[1], Math.random());
    const size = MathUtils.lerp(preset.sizeRange[0], preset.sizeRange[1], Math.random());
    const colorStr = preset.colors[i % preset.colors.length];

    // Random direction in unit sphere (or constrained by direction + spread)
    let dir: Vector3;
    if (overrides?.direction) {
      dir = overrides.direction.clone().normalize();
      dir.x += (Math.random() - 0.5) * spread;
      dir.y += (Math.random() - 0.5) * spread;
      dir.z += (Math.random() - 0.5) * spread;
      dir.normalize();
    } else {
      dir = new Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2 + 0.5, // bias upward
        (Math.random() - 0.5) * 2
      ).normalize();
    }

    particles.push({
      position: origin.clone(),
      velocity: dir.multiplyScalar(speed),
      color: new Color(colorStr),
      size,
      life: 1.0,
      maxLife: life,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 4,
      opacity: 1.0,
    });
  }

  return particles;
}

/**
 * Update all particles by delta time. Returns the array (mutated in place).
 * Dead particles (life <= 0) should be filtered out by the caller.
 */
export function updateParticles(
  particles: Particle[],
  delta: number,
  preset: ParticlePreset
): Particle[] {
  for (const p of particles) {
    // Gravity
    p.velocity.y += preset.gravity * delta;

    // Drag
    p.velocity.multiplyScalar(preset.drag);

    // Move
    p.position.addScaledVector(p.velocity, delta);

    // Age
    p.life -= delta / p.maxLife;

    // Fade
    if (preset.fadeOut) {
      p.opacity = Math.max(0, p.life);
    }

    // Shrink
    if (preset.shrinkOnDeath) {
      p.size *= 0.99;
    }

    // Rotate
    p.rotation += p.rotSpeed * delta;
  }

  return particles;
}

// ── Game Completion Tier ────────────────────────────────────

export type CompletionTier = 'bronze' | 'silver' | 'gold';

/**
 * Determine celebration tier based on score percentage.
 * Used to trigger appropriate CeremonyFX intensity.
 */
export function getCompletionTier(scorePercent: number): CompletionTier {
  if (scorePercent >= 80) return 'gold';
  if (scorePercent >= 50) return 'silver';
  return 'bronze';
}

/**
 * Map completion tier to CeremonyFX config.
 */
export const COMPLETION_CEREMONY_MAP: Record<CompletionTier, {
  particlePreset: string;
  bloomPeak: number;
  hudExpansion: number;
  duration: number;
}> = {
  bronze: {
    particlePreset: 'confettiBurst',
    bloomPeak: 0.5,
    hudExpansion: 1.1,
    duration: 1500,
  },
  silver: {
    particlePreset: 'sparkShower',
    bloomPeak: 0.7,
    hudExpansion: 1.3,
    duration: 2000,
  },
  gold: {
    particlePreset: 'victoryFireworks',
    bloomPeak: 1.0,
    hudExpansion: 1.5,
    duration: 3000,
  },
};

/**
 * Get lab-themed particle colors for a specific lab number.
 */
export function getLabParticleColors(labNumber: number): string[] {
  const primary = LAB_COLORS[labNumber] || '#00BBFF';
  return [primary, '#FFFFFF', '#FFD700', primary];
}
