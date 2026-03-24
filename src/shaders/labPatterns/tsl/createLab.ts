// ================================================================
// TSL Port — Lab 4: Generative Flow Field (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/createLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)
// Uses simplex2DTSL from shared.ts (port of noise.glsl simplex2D)

import {
  Fn, float, vec2, vec3, vec4,
  smoothstep, mix, max, clamp,
  mul, add, sub,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { simplex2DTSL } from './shared';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#FFAA44'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 4: Generative Flow Field */
export const lab4Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.2));

  const scale = float(3.0);

  // Perlin noise flow field — 3 noise layers
  const n1 = simplex2DTSL(add(mul(uvCoord, scale), vec2(mul(t, float(0.3)), mul(t, float(0.1)))));
  const n2 = simplex2DTSL(add(mul(uvCoord, mul(scale, float(1.5))), vec2(mul(t, float(-0.2)), mul(t, float(0.4)))));
  const n3 = simplex2DTSL(add(mul(uvCoord, mul(scale, float(0.5))), vec2(mul(t, float(0.15)), mul(t, float(-0.2)))));

  // Flow direction from noise gradient
  const flow = mul(vec2(n1, n2), float(0.5));

  // Advected UV for paint-like streaks
  const advectedUv = add(uvCoord, mul(flow, float(0.1)));
  const streaks = simplex2DTSL(add(mul(advectedUv, float(8.0)), vec2(mul(t, float(0.5)), float(0.0))));

  // Brush stroke effect — elongated noise
  const brushX = simplex2DTSL(vec2(add(mul(uvCoord.x, float(12.0)), mul(t, float(0.3))), mul(uvCoord.y, float(3.0))));
  const brushY = simplex2DTSL(vec2(mul(uvCoord.x, float(3.0)), sub(mul(uvCoord.y, float(12.0)), mul(t, float(0.2)))));
  const brush = add(mul(max(brushX, brushY), float(0.5)), float(0.5));

  // Color variation — warm palette shifts
  const color1 = vec3(uLabColor);
  const color2 = mul(vec3(uLabColor), vec3(1.2, 0.8, 0.6)); // Warmer variant
  const color3 = mul(vec3(uLabColor), vec3(0.8, 1.0, 1.3)); // Cooler variant

  const mix1 = smoothstep(float(-0.3), float(0.3), n1);
  const mix2 = smoothstep(float(-0.2), float(0.4), n3);

  const colorBlend1 = mix(color1, color2, mix1);
  const colorBlend2 = mix(colorBlend1, color3, mul(mix2, float(0.4)));

  // Apply brush strokes and streaks
  const combined = add(add(mul(brush, float(0.6)), mul(streaks, float(0.3))), float(0.1));
  const finalColor = mul(colorBlend2, combined);

  const alpha = clamp(mul(mul(combined, uIntensity), float(0.35)), float(0.0), float(0.35));

  return vec4(finalColor, alpha);
});

/** Get uniforms for external control */
export function getLab4Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
