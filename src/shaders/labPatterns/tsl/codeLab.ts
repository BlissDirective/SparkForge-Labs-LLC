 
 
// ================================================================
// TSL Port — Lab 1: Binary Rain Columns (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/codeLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, abs, fract, floor, step, smoothstep, mul, add, sub, min, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { rand2D } from './shared';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#00BBFF'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Single digit column — returns brightness for one rain layer */
const digitColumn = Fn(([uvCoord, columnId, speed]: [ReturnType<typeof vec2>, ReturnType<typeof float>, ReturnType<typeof float>]) => {
  const t = mul(uTime, speed);
  // Each column scrolls at different speed
  const scrollSpeed = add(float(0.5), mul(rand2D(vec2(columnId, float(0.0))), float(1.5)));
  const yOffset = fract(add(add(mul(uvCoord.y, float(0.5)), mul(t, scrollSpeed)), rand2D(vec2(columnId, float(1.0)))));
  // Brightness based on position (fade at edges)
  const fade = mul(smoothstep(float(0.0), float(0.4), yOffset), smoothstep(float(1.0), float(0.6), yOffset));
  // Random on/off per cell
  const cellSize = float(0.04);
  const charOn = step(float(0.5), rand2D(vec2(columnId, add(floor(mul(yOffset, float(1.0 / 0.04))), floor(mul(t, float(2.0)))))));
  return mul(charOn, fade);
});

/** Create the TSL fragment output for Lab 1: Binary Rain */
export const lab1Pattern = Fn(() => {
  const uvCoord = uv();
  const columns = float(40.0);
  const colWidth = float(1.0 / 40.0);
  const colId = floor(mul(uvCoord.x, columns));

  // Multiple rain layers at different speeds
  const rain1 = digitColumn(uvCoord, colId, float(0.3));
  const rain2 = mul(digitColumn(add(uvCoord, vec2(0.5, 0.0)), add(colId, float(100.0)), float(0.2)), float(0.5));
  const combined = add(rain1, rain2);

  // Color: lab color with brightness variation
  const color = mul(vec3(uLabColor), combined);

  // Add subtle glow around active columns
  const glow = mul(mul(smoothstep(float(0.3), float(0.0), abs(sub(fract(mul(uvCoord.x, columns)), float(0.5)))), combined), float(0.3));
  const finalColor = add(color, mul(vec3(uLabColor), glow));

  const alpha = clamp(mul(mul(combined, uIntensity), float(0.4)), float(0.0), float(0.35));

  return vec4(finalColor, alpha);
});

/** Get uniforms for external control */
export function getLab1Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
