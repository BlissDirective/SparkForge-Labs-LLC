 
 
// ================================================================
// TSL Port — Scanline Overlay Fragment Shader
// ================================================================
// Original: src/shaders/scanline.glsl
// Decision 2.3: Toggleable in accessibility settings
// Very subtle CRT screen texture — opacity 0.03
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec4,
  sin, add, mul, pow,
  uv, uniform,
} from 'three/tsl';
import { Vector2 } from 'three';

const uTime = uniform(0);
const uResolution = uniform(new Vector2(1920, 1080));
const uOpacity = uniform(0.03);

/** CRT scanline overlay — horizontal lines with slow vertical scroll */
export const scanlinePattern = Fn(() => {
  const uvCoord = uv();

  // Horizontal scan lines — repeating every 3 pixels
  const rawScan = add(mul(sin(mul(mul(uvCoord.y, uResolution.y), float(1.5))), float(0.5)), float(0.5));
  const scanline = pow(rawScan, float(1.5));

  // Slow vertical scroll — barely perceptible
  const scroll = mul(sin(add(mul(uTime, float(0.5)), mul(uvCoord.y, float(4.0)))), float(0.02));

  // Combine
  const intensity = add(mul(scanline, uOpacity), mul(scroll, uOpacity));

  // Dark lines on bright background
  return vec4(float(0.0), float(0.0), float(0.0), intensity);
});

/** Get uniforms for external control */
export function getScanlineUniforms() {
  return { uTime, uResolution, uOpacity };
}
