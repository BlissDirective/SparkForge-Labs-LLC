 
 
// ================================================================
// TSL Port — Lab 8: Text Stream Flow (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/languageLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  abs, fract, floor, step, smoothstep, max, mod,
  mul, add, sub, div, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { rand2D } from './shared';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#818CF8'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 8: Text Stream Flow */
export const lab8Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.25));

  let totalText: any = float(0.0);

  // Horizontal text streams at different heights
  for (let i = 0; i < 8; i++) {
    const fi = float(i);
    const streamY = div(add(fi, float(0.5)), float(8.0));
    const streamSpeed = add(float(0.1), mul(rand2D(vec2(fi, float(0.0))), float(0.15)));
    // Alternate directions: odd streams go right, even go left
    const direction = sub(mul(float(2.0), step(float(1.0), mod(fi, float(2.0)))), float(1.0));

    // Scrolling character cells
    const cellWidth = float(0.02);
    const scrollX = add(uvCoord.x, mul(mul(t, streamSpeed), direction));
    const cellId = floor(div(scrollX, cellWidth));

    // Character presence (random on/off)
    const charOn = step(float(0.3), rand2D(vec2(cellId, fi)));

    // Character shape (simple rectangular glyph)
    const cellX = fract(div(scrollX, cellWidth));
    const cellY = div(abs(sub(uvCoord.y, streamY)), float(0.02));
    const glyph = mul(
      mul(
        mul(step(float(0.15), cellX), step(cellX, float(0.85))),
        step(cellY, float(1.0))
      ),
      charOn
    );

    // Brightness fades from center outward
    const horizontalFade = max(sub(float(1.0), mul(abs(sub(uvCoord.x, float(0.5))), float(1.5))), float(0.0));

    totalText = add(totalText, mul(mul(glyph, float(0.3)), horizontalFade)) as any;
  }

  // Vertical falling text (secondary layer)
  for (let j = 0; j < 5; j++) {
    const fj = float(j);
    const colX = add(float(0.15), mul(fj, float(0.17)));
    const fallSpeed = add(float(0.08), mul(rand2D(vec2(fj, float(1.0))), float(0.12)));

    const cellHeight = float(0.025);
    const scrollY = add(uvCoord.y, mul(t, fallSpeed));
    const cellId = floor(div(scrollY, cellHeight));
    const charOn = step(float(0.4), rand2D(vec2(cellId, add(fj, float(100.0)))));

    const cellYFract = fract(div(scrollY, cellHeight));
    const colDist = abs(sub(uvCoord.x, colX));
    const glyph = mul(
      mul(
        step(colDist, float(0.008)),
        mul(step(float(0.1), cellYFract), step(cellYFract, float(0.9)))
      ),
      charOn
    );

    totalText = add(totalText, mul(glyph, float(0.2))) as any;
  }

  const color = mul(vec3(uLabColor), totalText);
  const alpha = clamp(mul(mul(totalText, uIntensity), float(0.4)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab8Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
