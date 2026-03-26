/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ================================================================
// TSL Port — Electric Veins Fragment Shader
// ================================================================
// Original: src/shaders/electricVeins.frag
// Hero Animation Phase 4: Animated energy vein propagation (7.5s–10.0s)
// L-system fractal branching with Perlin noise offset.
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow, step, length,
  uv, uniform,
} from 'three/tsl';
import { perlinNoise2DTSL } from './noiseUtils';

const uTime = uniform(0);
const uIntensity = uniform(0.0);  // Ramps 0 -> 1 over Phase 4 (2.5s)

/** Vein branch function — creates a single branching line with noise displacement */
const veinBranch = Fn(([uvCoord, frequency, time, thickness]: [
  ReturnType<typeof vec2>, ReturnType<typeof float>, ReturnType<typeof float>, ReturnType<typeof float>
]) => {
  // Noise-displaced UV for organic wobble
  const noiseOffX = perlinNoise2DTSL(add(mul(uvCoord, mul(frequency, float(0.5))), mul(time, float(0.3))));
  const noiseOffY = perlinNoise2DTSL(add(add(mul(uvCoord, mul(frequency, float(0.7))), mul(time, float(0.4))), float(50.0)));
  const displaced = add(uvCoord, mul(vec2(noiseOffX, noiseOffY), float(0.08)));

  // Branch pattern: abs(fract - 0.5) creates center-line pattern
  const branchX = abs(sub(fract(mul(displaced.x, frequency)), float(0.5)));
  const branchY = abs(sub(fract(mul(displaced.y, frequency)), float(0.5)));

  // Combine X and Y branches for grid-like vein network
  const branch = mul(
    smoothstep(add(thickness, float(0.02)), thickness, branchX),
    smoothstep(add(thickness, float(0.02)), thickness, branchY)
  );

  return branch;
});

/** Electric vein color — white-hot core -> cyan mid -> deep blue edge */
const electricColor = Fn(([veinStrength]: [ReturnType<typeof float>]) => {
  const coreColor = vec3(1.0, 1.0, 1.0);           // White-hot core
  const midColor = vec3(0.2, 0.8, 1.0);             // Bright cyan
  const edgeColor = vec3(0.0, 0.4, 1.0);            // Deep electric blue

  const color1 = mix(edgeColor, midColor, smoothstep(float(0.0), float(0.5), veinStrength));
  return mix(color1, coreColor, smoothstep(float(0.6), float(1.0), veinStrength));
});

/** Electric veins fragment — 6-octave fractal vein accumulation with propagation */
export const electricVeinsFragment = Fn(() => {
  const uvCoord = uv();

  // 6-octave fractal vein accumulation (unrolled — TSL doesn't support dynamic loops well)
  const octave = (idx: number) => {
    const fi = float(idx);
    const freq = pow(float(2.0), fi);
    const amp = float(1.0 / (idx + 1));

    const uvOffset = add(uvCoord, mul(perlinNoise2DTSL(add(mul(uvCoord, add(fi, float(1.0))), mul(uTime, float(0.5)))), float(0.1)));

    const branch = mul(
      smoothstep(float(0.48), float(0.50), abs(sub(fract(mul(uvOffset.x, freq)), float(0.5)))),
      smoothstep(float(0.48), float(0.50), abs(sub(fract(mul(uvOffset.y, freq)), float(0.5))))
    );

    return mul(branch, amp);
  };

  const veinBase = add(add(add(add(add(
    octave(0), octave(1)), octave(2)), octave(3)), octave(4)), octave(5));

  // Propagation wave — veins expand from center over time
  const distFromCenter = mul(length(sub(uvCoord, float(0.5))), float(2.0));
  const propagation = smoothstep(
    sub(distFromCenter, float(0.1)),
    add(distFromCenter, float(0.1)),
    mul(uIntensity, float(1.5))
  );
  const veinPropagated = mul(veinBase, propagation);

  // Flickering / arcing effect
  const flicker = add(
    mul(perlinNoise2DTSL(add(mul(uvCoord, float(20.0)), mul(uTime, float(8.0)))), float(0.5)),
    float(0.5)
  );
  const arc = mul(step(float(0.7), flicker), float(0.5));
  const veinWithArc = add(veinPropagated, mul(mul(arc, propagation), float(0.3)));

  // Main trunk veins
  const trunk = veinBranch(uvCoord, float(2.0), uTime, float(0.48));
  const vein = mul(add(veinWithArc, mul(trunk, float(0.4))), uIntensity);

  // Color computation
  const veinColor = electricColor(vein);

  // Glow bloom contribution
  const softGlow = mul(smoothstep(float(0.0), float(0.3), vein), float(0.2));
  const finalColor = mul(veinColor, add(vein, softGlow));
  const alpha = mul(clamp(add(vein, mul(softGlow, float(0.5))), float(0.0), float(1.0)), uIntensity);

  return vec4(finalColor, alpha);
});

/** Get uniforms for external control */
export function getElectricVeinsUniforms() {
  return { uTime, uIntensity };
}
