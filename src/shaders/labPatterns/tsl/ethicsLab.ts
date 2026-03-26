/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ================================================================
// TSL Port — Lab 6: Balance Oscillation (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/ethicsLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, smoothstep, distance, step, length, dot, mix,
  mul, add, sub, div, min, max, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#FF6644'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 6: Balance Oscillation */
export const lab6Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.3));

  // Central fulcrum
  const fulcrum = vec2(0.5, 0.4);
  const fulcrumDist = distance(uvCoord, fulcrum);
  const fulcrumGlow = div(float(0.005), add(mul(fulcrumDist, fulcrumDist), float(0.002)));

  // Balance beam — tilts back and forth
  const tiltAngle = mul(sin(mul(t, float(0.7))), float(0.3));
  const beamLength = float(0.35);

  // Beam endpoints
  const leftEnd = add(fulcrum, mul(vec2(sub(float(0.0), cos(tiltAngle)), sin(tiltAngle)), beamLength));
  const rightEnd = add(fulcrum, mul(vec2(cos(tiltAngle), sub(float(0.0), sin(tiltAngle))), beamLength));

  // Beam line distance
  const beamDir = sub(rightEnd, leftEnd);
  const beamLen = length(beamDir);
  const beamNorm = div(beamDir, beamLen);
  const proj = clamp(dot(sub(uvCoord, leftEnd), beamNorm), float(0.0), beamLen);
  const closest = add(leftEnd, mul(beamNorm, proj));
  const beamDist = distance(uvCoord, closest);
  const beam = smoothstep(float(0.006), float(0.002), beamDist);

  // Scale pans (circles at beam ends)
  const leftPan = smoothstep(float(0.06), float(0.04), distance(uvCoord, leftEnd));
  const rightPan = smoothstep(float(0.06), float(0.04), distance(uvCoord, rightEnd));

  // Weight indicators
  const leftWeight = add(mul(sin(mul(t, float(1.2))), float(0.5)), float(0.5));
  const rightWeight = sub(float(1.0), leftWeight);

  // Left bar
  const leftBar = mul(
    mul(
      smoothstep(float(0.03), float(0.02), abs(sub(uvCoord.x, leftEnd.x))),
      smoothstep(leftEnd.y, sub(leftEnd.y, mul(leftWeight, float(0.15))), uvCoord.y)
    ),
    step(sub(leftEnd.y, mul(leftWeight, float(0.15))), uvCoord.y)
  );

  // Right bar
  const rightBar = mul(
    mul(
      smoothstep(float(0.03), float(0.02), abs(sub(uvCoord.x, rightEnd.x))),
      smoothstep(rightEnd.y, sub(rightEnd.y, mul(rightWeight, float(0.15))), uvCoord.y)
    ),
    step(sub(rightEnd.y, mul(rightWeight, float(0.15))), uvCoord.y)
  );

  // Pendulum support lines
  const leftLine = mul(
    mul(
      smoothstep(float(0.003), float(0.001), abs(sub(uvCoord.x, sub(fulcrum.x, mul(beamLength, cos(tiltAngle)))))),
      step(fulcrum.y, uvCoord.y)
    ),
    step(uvCoord.y, add(fulcrum.y, float(0.15)))
  );
  const rightLine = mul(
    mul(
      smoothstep(float(0.003), float(0.001), abs(sub(uvCoord.x, add(fulcrum.x, mul(beamLength, cos(tiltAngle)))))),
      step(fulcrum.y, uvCoord.y)
    ),
    step(uvCoord.y, add(fulcrum.y, float(0.15)))
  );

  // Background gradient weight visualization
  const gradient = smoothstep(float(0.0), float(1.0), uvCoord.x);
  const leftColor = vec3(0.2, 0.8, 0.2); // Green = fair
  const rightColor = vec3(uLabColor);      // Red = unfair
  const bgGradient = mul(mix(leftColor, rightColor, gradient), float(0.08));

  const total = add(add(add(add(add(add(beam, leftPan), rightPan), mul(leftBar, float(0.8))), mul(rightBar, float(0.8))), mul(fulcrumGlow, float(0.15))), add(leftLine, rightLine));

  const color = add(mul(vec3(uLabColor), total), bgGradient);
  const alpha = clamp(mul(mul(total, uIntensity), float(0.4)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab6Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
