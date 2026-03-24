// ================================================================
// TSL Lab Pattern Shaders — Barrel Export (Section 4.1-A WebGPU Shader Port)
// ================================================================
// All 10 lab pattern shaders ported from GLSL to TSL (Three Shader Language).
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2).
//
// Usage with MeshBasicNodeMaterial:
//   import { lab1Pattern, getLab1Uniforms } from '@/shaders/labPatterns/tsl';
//   const material = new MeshBasicNodeMaterial();
//   material.colorNode = lab1Pattern();
//   const { uTime } = getLab1Uniforms();
//   // In animation loop: uTime.value = clock.getElapsedTime();

// Shared utilities
export { rand2D, simplex2DTSL } from './shared';
export {
  uTime as sharedUTime,
  uLabColor as sharedULabColor,
  uIntensity as sharedUIntensity,
  uResolution as sharedUResolution,
} from './shared';

// Lab 1: Code Lab — Binary Rain Columns
export { lab1Pattern, getLab1Uniforms } from './codeLab';

// Lab 2: Data Lab — Data Sorting Waves
export { lab2Pattern, getLab2Uniforms } from './dataLab';

// Lab 3: Neural Lab — Neural Pulse Ripples
export { lab3Pattern, getLab3Uniforms } from './neuralLab';

// Lab 4: Create Lab — Generative Flow Field
export { lab4Pattern, getLab4Uniforms } from './createLab';

// Lab 5: Agent Lab — Agent Path Traces
export { lab5Pattern, getLab5Uniforms } from './agentLab';

// Lab 6: Ethics Lab — Balance Oscillation
export { lab6Pattern, getLab6Uniforms } from './ethicsLab';

// Lab 7: Vision Lab — Scan-line Grid
export { lab7Pattern, getLab7Uniforms } from './visionLab';

// Lab 8: Language Lab — Text Stream Flow
export { lab8Pattern, getLab8Uniforms } from './languageLab';

// Lab 9: Build Lab — Code Compilation
export { lab9Pattern, getLab9Uniforms } from './buildLab';

// Lab 10: Frontier Lab — Starfield Warp
export { lab10Pattern, getLab10Uniforms } from './frontierLab';

// ----------------------------------------------------------------
// Lookup helpers — map lab number (1-10) to pattern + uniforms
// ----------------------------------------------------------------

import { lab1Pattern, getLab1Uniforms } from './codeLab';
import { lab2Pattern, getLab2Uniforms } from './dataLab';
import { lab3Pattern, getLab3Uniforms } from './neuralLab';
import { lab4Pattern, getLab4Uniforms } from './createLab';
import { lab5Pattern, getLab5Uniforms } from './agentLab';
import { lab6Pattern, getLab6Uniforms } from './ethicsLab';
import { lab7Pattern, getLab7Uniforms } from './visionLab';
import { lab8Pattern, getLab8Uniforms } from './languageLab';
import { lab9Pattern, getLab9Uniforms } from './buildLab';
import { lab10Pattern, getLab10Uniforms } from './frontierLab';

/** All 10 TSL lab pattern functions, indexed 1-10 */
export const labPatterns = {
  1: lab1Pattern,
  2: lab2Pattern,
  3: lab3Pattern,
  4: lab4Pattern,
  5: lab5Pattern,
  6: lab6Pattern,
  7: lab7Pattern,
  8: lab8Pattern,
  9: lab9Pattern,
  10: lab10Pattern,
} as const;

/** All 10 TSL lab uniform getters, indexed 1-10 */
export const labUniformGetters = {
  1: getLab1Uniforms,
  2: getLab2Uniforms,
  3: getLab3Uniforms,
  4: getLab4Uniforms,
  5: getLab5Uniforms,
  6: getLab6Uniforms,
  7: getLab7Uniforms,
  8: getLab8Uniforms,
  9: getLab9Uniforms,
  10: getLab10Uniforms,
} as const;

/** Get pattern + uniforms for a lab by number (1-10) */
export function getLabPatternTSL(labNumber: number) {
  const num = Math.max(1, Math.min(10, labNumber)) as keyof typeof labPatterns;
  return {
    pattern: labPatterns[num],
    getUniforms: labUniformGetters[num],
  };
}
