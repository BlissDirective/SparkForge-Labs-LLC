// ================================================================
// TSL Shader Barrel Export — All Non-Lab-Pattern TSL Ports
// ================================================================
// This module exports all TSL ports of GLSL shaders from src/shaders/.
// Lab pattern TSL ports are in src/shaders/labPatterns/tsl/ (separate module).
//
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2).
//
// Usage:
//   import { auroraPattern, getAuroraUniforms } from '@/shaders/tsl';
//   const material = new MeshBasicNodeMaterial();
//   material.colorNode = auroraPattern();
//   const { uTime } = getAuroraUniforms();

// ── Noise Utilities ──
export {
  simplex2DTSL,
  rand2D,
} from './noiseUtils';

export {
  simplex3DTSL,
  fbm4TSL,
  fbm6TSL,
  fbm3_4TSL,
  fbm3_6TSL,
  curlNoiseTSL,
  hash2TSL,
  perlinNoise2DTSL,
} from './noiseUtils';

// ── Aurora Void (Decision 2.5) ──
export { auroraPattern, getAuroraUniforms } from './auroraTSL';

// ── Scanline Overlay (Decision 2.3) ──
export { scanlinePattern, getScanlineUniforms } from './scanlineTSL';

// ── Holographic Card (Decision 4.3) ──
export { holographicPattern, getHolographicUniforms } from './holographicTSL';

// ── Energy Field — Streak Shield (Decision 4.5) ──
export {
  energyFieldVertex,
  energyFieldFragment,
  getEnergyFieldUniforms,
} from './energyFieldTSL';

// ── Liquid Metal — Badge Levitate (Decision 4.2) ──
export {
  liquidMetalVertex,
  liquidMetalFragment,
  getLiquidMetalUniforms,
} from './liquidMetalTSL';

// ── Fire Noise — Diamond Streak Flame ──
export {
  fireNoiseVertex,
  fireNoiseFragment,
  getFireNoiseUniforms,
} from './fireNoiseTSL';

// ── Crystalline Logo — Hero Animation Phase 2 ──
export {
  crystallineLogoVertex,
  crystallineLogoFragment,
  getCrystallineLogoUniforms,
} from './crystallineLogoTSL';

// ── Electric Veins — Hero Animation Phase 4 ──
export {
  electricVeinsFragment,
  getElectricVeinsUniforms,
} from './electricVeinsTSL';
