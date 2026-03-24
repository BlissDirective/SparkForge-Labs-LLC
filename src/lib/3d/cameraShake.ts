// ════════════════════════════════════════════════════
// Camera Shake Controller — Event-Driven Camera Shake (Section 4.1-G)
// ════════════════════════════════════════════════════
// Provides a global trigger for camera shake effects.
// CameraSystem reads shake state each frame via useFrame.
// No store needed — uses module-level reactive state.

interface ShakeState {
  intensity: number;    // Current shake intensity (decaying)
  frequency: number;    // Shake frequency (Hz)
  decay: number;        // Decay rate per second
  seed: number;         // Random seed for deterministic shake
}

const shakeState: ShakeState = {
  intensity: 0,
  frequency: 25,
  decay: 5.0,
  seed: 0,
};

/** Trigger a camera shake effect */
export function triggerCameraShake(options?: {
  intensity?: number;   // Default: 0.15
  frequency?: number;   // Default: 25
  decay?: number;       // Default: 5.0
}): void {
  shakeState.intensity = options?.intensity ?? 0.15;
  shakeState.frequency = options?.frequency ?? 25;
  shakeState.decay = options?.decay ?? 5.0;
  shakeState.seed = Math.random() * 1000;
}

/** Preset shake triggers for common events */
export const SHAKE_PRESETS = {
  xpGain: { intensity: 0.08, frequency: 30, decay: 8.0 },
  levelUp: { intensity: 0.25, frequency: 20, decay: 4.0 },
  gameComplete: { intensity: 0.18, frequency: 22, decay: 5.0 },
  badgeEarned: { intensity: 0.12, frequency: 28, decay: 6.0 },
} as const;

/** Read current shake offset for this frame. Call from useFrame. */
export function getShakeOffset(delta: number): { x: number; y: number; z: number } {
  if (shakeState.intensity < 0.001) {
    shakeState.intensity = 0;
    return { x: 0, y: 0, z: 0 };
  }

  const t = shakeState.seed + performance.now() * 0.001;
  const f = shakeState.frequency;
  const i = shakeState.intensity;

  // Perlin-like deterministic shake using sin combinations
  const x = (Math.sin(t * f) * 0.5 + Math.sin(t * f * 1.3 + 1.7) * 0.3 + Math.sin(t * f * 2.1 + 3.2) * 0.2) * i;
  const y = (Math.sin(t * f * 0.9 + 0.5) * 0.5 + Math.sin(t * f * 1.1 + 2.3) * 0.3 + Math.sin(t * f * 1.7 + 4.1) * 0.2) * i;
  const z = (Math.sin(t * f * 0.7 + 1.1) * 0.3) * i * 0.5;

  // Decay
  shakeState.intensity *= Math.exp(-shakeState.decay * delta);

  return { x, y, z };
}
