 
 
// ================================================================
// TSL Port — Lab 7: Scan-line Grid (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/visionLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, smoothstep, step,
  mul, add, sub, min, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#06B6D4'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 7: Scan-line Grid */
export const lab7Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.4));

  // Base grid
  const gridSize = float(20.0);
  const gridUv = fract(mul(uvCoord, gridSize));
  const gridLine = min(
    add(
      add(smoothstep(float(0.05), float(0.02), gridUv.x), smoothstep(float(0.05), float(0.02), gridUv.y)),
      add(smoothstep(float(0.95), float(0.98), gridUv.x), smoothstep(float(0.95), float(0.98), gridUv.y))
    ),
    float(1.0)
  );
  const gridIntensity = mul(gridLine, float(0.15));

  // Moving detection rectangles (3 scanning boxes)
  let detections: any = float(0.0);
  for (let i = 0; i < 3; i++) {
    const fi = float(i);
    const boxCenterX = add(float(0.3), mul(float(0.4), sin(add(mul(t, float(0.5)), mul(fi, float(2.094))))));
    const boxCenterY = add(float(0.3), mul(float(0.4), cos(add(mul(t, float(0.4)), mul(fi, float(2.094))))));
    const boxSizeX = add(float(0.12), mul(sin(add(t, fi)), float(0.03)));
    const boxSizeY = add(float(0.09), mul(cos(add(mul(t, float(0.8)), fi)), float(0.02)));

    const dx = abs(sub(uvCoord.x, boxCenterX));
    const dy = abs(sub(uvCoord.y, boxCenterY));

    // Box outline
    const boxOutline = sub(
      mul(step(dx, boxSizeX), step(dy, boxSizeY)),
      mul(step(dx, sub(boxSizeX, float(0.005))), step(dy, sub(boxSizeY, float(0.005))))
    );

    // Corner brackets
    const cornerSize = float(0.025);
    const isCornerX = mul(step(sub(boxSizeX, cornerSize), dx), step(dx, add(boxSizeX, float(0.003))));
    const isCornerY = mul(step(sub(boxSizeY, cornerSize), dy), step(dy, add(boxSizeY, float(0.003))));
    const corner = add(
      mul(isCornerX, step(dy, add(boxSizeY, float(0.003)))),
      mul(isCornerY, step(dx, add(boxSizeX, float(0.003))))
    );

    // Scanning line inside box
    const scanY = add(sub(boxCenterY, boxSizeY), mul(fract(add(mul(t, float(0.8)), mul(fi, float(0.333)))), mul(boxSizeY, float(2.0))));
    const scanLine = mul(step(dx, boxSizeX), smoothstep(float(0.008), float(0.001), abs(sub(uvCoord.y, scanY))));

    detections = add(detections, add(mul(add(boxOutline, corner), float(0.8)), mul(scanLine, float(0.5)))) as any;
  }

  // Horizontal sweep line (full width scan)
  const sweepY = fract(mul(t, float(0.2)));
  const sweep = mul(smoothstep(float(0.01), float(0.003), abs(sub(uvCoord.y, sweepY))), float(0.4));

  // Crosshair at center
  const chH = mul(smoothstep(float(0.002), float(0.001), abs(sub(uvCoord.x, float(0.5)))), step(abs(sub(uvCoord.y, float(0.5))), float(0.03)));
  const chV = mul(smoothstep(float(0.002), float(0.001), abs(sub(uvCoord.y, float(0.5)))), step(abs(sub(uvCoord.x, float(0.5))), float(0.03)));
  const ch = mul(add(chH, chV), float(0.3));

  const total = add(add(add(gridIntensity, detections), sweep), ch);
  const color = mul(vec3(uLabColor), total);
  const alpha = clamp(mul(mul(total, uIntensity), float(0.4)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab7Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
