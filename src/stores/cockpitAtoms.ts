import { atom } from 'jotai';

// ═══ Shader Uniforms (updated per-frame or on interaction) ═══
export const bloomIntensityAtom = atom(0.4);
export const vignettedarknessAtom = atom(0.5);
export const barrelDistortionAtom = atom(0.02);
export const hudOpacityAtom = atom(0.15);
export const hudRotationSpeedAtom = atom(0.1);
export const hudPulseIntensityAtom = atom(0.3);

// ═══ Particle System (updated on mode change / FPS degradation) ═══
export const particleCountAtom = atom(50);
export const particleSpeedAtom = atom(1.0);

// ═══ Camera Interpolation (updated per-frame during transitions) ═══
// v3.0: Tight-focus cockpit seat position (was [0, 6.5, 7])
export const cameraPositionAtom = atom<[number, number, number]>([0, 0.65, 1.1]);
export const cameraLookAtAtom = atom<[number, number, number]>([0, 0, -2.5]);
export const cameraFovAtom = atom(58);

// ═══ LOD State (updated on FPS degradation) ═══
export const currentLODLevelAtom = atom<'ultra' | 'high' | 'medium' | 'low' | 'billboard'>('high');
export const triangleBudgetUsedAtom = atom(0);
export const fpsRatioAtom = atom(1.0); // actual FPS / target FPS

// ═══ WebGPU State (Enhancement 8.2) ═══
export const rendererTypeAtom = atom<'webgpu' | 'webgl2' | 'webgl'>('webgl2');
export const gpuTierAtom = atom<'high' | 'medium' | 'low'>('medium');
