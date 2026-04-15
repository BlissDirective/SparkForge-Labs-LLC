// ════════════════════════════════════════════════════════════════════
// hapticSim — Multimodal Haptic Simulation (Phase 4 §10.14, J-A)
// ════════════════════════════════════════════════════════════════════
// Simulates tactile feedback through synchronized visual + audio + motion
// cues. SparkForge doesn't have physical haptic hardware — we simulate
// the feeling by combining three sensory channels at the right moment:
//   • visual: brief transform nudge (scale, blur, flash)
//   • audio:  short procedural sound aligned to impact
//   • motion: camera shake via the existing triggerCameraShake utility
//
// Four presets chosen for maximum impact with minimum stimulation
// (per user spec — NO haptic on high-frequency surfaces like every
// HolographicButton or every page nav):
//
//   1. buttonPress      — cockpit nav buttons only (5 total)
//   2. dragResistance   — RadialDial3D rotation "heavy" feel
//   3. snapToGrid       — dial detent positions + difficulty chip snap
//   4. impactBurst      — epic-tier celebration mount only
//
// Each preset returns an object describing the cues; the caller decides
// which cues to actually apply (visual handled by component, audio via
// Tone.js, motion via cameraShake module).
// ════════════════════════════════════════════════════════════════════

import { triggerCameraShake } from '@/lib/3d/cameraShake';

export interface HapticPreset {
  /** Micro camera shake for "impact" feel. Off for no-shake presets. */
  shake?: { intensity: number; frequency: number; decay: number };
  /** Audio preset (handled by caller via Tone.js synth). */
  audio?: 'click' | 'friction' | 'snap' | 'thump';
  /** Visual scale delta applied briefly to the affected element. */
  visualScaleDelta?: number;
  /** Visual duration in ms — how long the visual cue lasts. */
  visualDurationMs?: number;
}

export const HAPTIC_PRESETS: Record<
  'buttonPress' | 'dragResistance' | 'snapToGrid' | 'impactBurst',
  HapticPreset
> = {
  // Cockpit nav press: scale down 2px + micro shake + click tone
  // ~50ms total reading — feels like a real soft key closing a micro-switch
  buttonPress: {
    shake: { intensity: 0.015, frequency: 30, decay: 12.0 },
    audio: 'click',
    visualScaleDelta: -0.02,
    visualDurationMs: 80,
  },
  // Dial drag: no shake. Slower lerp + friction audio layered on rotation
  dragResistance: {
    audio: 'friction',
    visualDurationMs: 0, // no visual — the dial motion itself IS the visual
  },
  // Dial detent / snap: sharp spring + click at stop position
  snapToGrid: {
    shake: { intensity: 0.008, frequency: 40, decay: 16.0 },
    audio: 'snap',
    visualScaleDelta: 0.03,
    visualDurationMs: 120,
  },
  // Epic celebration impact: bigger shake + bass thump + brief flash
  impactBurst: {
    shake: { intensity: 0.18, frequency: 20, decay: 3.5 },
    audio: 'thump',
    visualScaleDelta: 0.06,
    visualDurationMs: 240,
  },
};

/** Fire the motion channel (camera shake) of a preset. Returns the preset
 *  so the caller can also wire visual + audio cues. */
export function fireHaptic(
  kind: keyof typeof HAPTIC_PRESETS
): HapticPreset {
  const preset = HAPTIC_PRESETS[kind];
  if (preset.shake) {
    triggerCameraShake(preset.shake);
  }
  return preset;
}
