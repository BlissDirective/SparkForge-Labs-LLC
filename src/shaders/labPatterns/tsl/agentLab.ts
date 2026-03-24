// ================================================================
// TSL Port — Lab 5: Agent Path Traces (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/agentLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, smoothstep, distance, dot,
  mul, add, sub, div, min, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#00FF88'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 5: Agent Path Traces */
export const lab5Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.35));

  let totalPath = float(0.0);

  // 6 agent paths — animated quadratic Bezier curves
  // Reduced Bezier sample count from 20 to 10 for TSL compatibility
  for (let i = 0; i < 6; i++) {
    const fi = float(i);
    const phase = mul(fi, float(1.047)); // ~60 degree spacing

    // Path control points
    const p0 = vec2(
      add(float(0.1), mul(sin(add(mul(t, float(0.2)), phase)), float(0.1))),
      add(float(0.1), mul(fi, float(0.15)))
    );
    const p1 = vec2(
      add(float(0.5), mul(sin(add(add(mul(t, float(0.3)), phase), float(1.0))), float(0.2))),
      add(add(float(0.2), mul(fi, float(0.12))), mul(sin(add(mul(t, float(0.4)), fi)), float(0.1)))
    );
    const p2 = vec2(
      add(float(0.9), mul(sin(add(add(mul(t, float(0.25)), phase), float(2.0))), float(0.1))),
      add(float(0.15), mul(fi, float(0.14)))
    );

    // Evaluate quadratic Bezier at 10 sample points
    for (let j = 0; j < 10; j++) {
      const bt = float(j / 9.0);
      const omt = sub(float(1.0), bt); // 1 - bt

      // Bezier: (1-t)^2*p0 + 2*(1-t)*t*p1 + t^2*p2
      const bp = add(add(
        mul(mul(omt, omt), p0),
        mul(mul(mul(float(2.0), omt), bt), p1)
      ), mul(mul(bt, bt), p2));

      const dist = distance(uvCoord, bp);

      // Traveling dot along path
      const dotPhase = fract(add(mul(t, float(0.5)), mul(fi, float(0.167))));
      const dotBrightness = mul(smoothstep(float(0.02), float(0.0), abs(sub(bt, dotPhase))), float(2.0));

      // Path line
      const pathLine = smoothstep(float(0.005), float(0.001), dist);
      totalPath = add(totalPath, add(mul(pathLine, float(0.3)), mul(dotBrightness, smoothstep(float(0.015), float(0.005), dist))));
    }
  }

  totalPath = min(totalPath, float(1.5));
  let color = mul(vec3(uLabColor), totalPath);

  // Decision node glow at path intersections
  let nodeGlow = float(0.0);
  for (let i = 0; i < 4; i++) {
    const fi = float(i);
    const nodePos = vec2(
      add(float(0.25), mul(fi, float(0.18))),
      add(float(0.3), mul(sin(add(mul(t, float(0.5)), mul(fi, float(1.5)))), float(0.15)))
    );
    const dist = distance(uvCoord, nodePos);
    nodeGlow = add(nodeGlow, mul(div(float(0.008), add(mul(dist, dist), float(0.005))), add(float(0.5), mul(float(0.5), sin(add(mul(t, float(2.0)), fi))))));
  }
  color = add(color, mul(vec3(uLabColor), mul(nodeGlow, float(0.15))));

  const alpha = clamp(mul(mul(add(totalPath, mul(nodeGlow, float(0.1))), uIntensity), float(0.35)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab5Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
