/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ================================================================
// TSL Port — Lab 9: Code Compilation (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/buildLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  abs, fract, floor, step, smoothstep,
  mul, add, sub, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { rand2D } from './shared';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#F97316'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 9: Code Compilation */
export const lab9Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.3));

  const lineHeight = float(0.025);
  const maxLines = float(30.0);

  let totalCode: any = float(0.0);

  // Code lines appearing and stacking upward
  for (let i = 0; i < 30; i++) {
    const fi = float(i);
    const lineY = add(mul(fi, lineHeight), float(0.05));

    // Line appears at a specific time, stacks from bottom
    const appearTime = mul(fi, float(0.15));
    const lineAge = sub(t, appearTime);
    const lineVisible = smoothstep(float(0.0), float(0.3), fract(mul(lineAge, float(1.0 / (30.0 * 0.15)))));

    // Indentation level (random per line, 0-3)
    const indent = mul(floor(mul(rand2D(vec2(fi, float(0.0))), float(4.0))), float(0.04));

    // Line width (random, simulates different code lengths)
    const lineWidth = add(float(0.15), mul(rand2D(vec2(fi, float(1.0))), float(0.45)));

    // Syntax coloring regions within line
    const inLine = mul(
      mul(
        step(indent, uvCoord.x),
        step(uvCoord.x, add(indent, lineWidth))
      ),
      smoothstep(mul(lineHeight, float(0.4)), mul(lineHeight, float(0.1)), abs(sub(uvCoord.y, lineY)))
    );

    // Build progress highlight (current line being written)
    const buildPhase = fract(mul(t, float(0.2)));
    const currentLine = floor(mul(buildPhase, maxLines));
    const isCurrent = smoothstep(float(1.5), float(0.0), abs(sub(fi, currentLine)));

    totalCode = add(totalCode, mul(mul(inLine, lineVisible), add(float(0.4), mul(isCurrent, float(0.6))))) as any;
  }

  // Progress bar at bottom
  const barY = float(0.02);
  const barProgress = fract(mul(t, float(0.1)));
  const bar = mul(
    mul(
      step(abs(sub(uvCoord.y, barY)), float(0.005)),
      step(float(0.1), uvCoord.x)
    ),
    step(uvCoord.x, add(float(0.1), mul(barProgress, float(0.8))))
  );
  const barBg = mul(
    mul(
      mul(
        step(abs(sub(uvCoord.y, barY)), float(0.005)),
        step(float(0.1), uvCoord.x)
      ),
      step(uvCoord.x, float(0.9))
    ),
    float(0.2)
  );

  const color = mul(vec3(uLabColor), add(add(totalCode, bar), barBg));
  const alpha = clamp(mul(mul(add(totalCode, bar), uIntensity), float(0.35)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab9Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
