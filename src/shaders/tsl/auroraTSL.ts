 
 
// ================================================================
// TSL Port — Aurora Void Fragment Shader
// ================================================================
// Original: src/shaders/aurora.glsl
// Decision 2.5: Background behind station frame — living space
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { simplex2DTSL } from '../labPatterns/tsl/shared';

const uTime = uniform(0);
const uColor1 = uniform(new Color('#3B82F6'));  // Primary blue
const uColor2 = uniform(new Color('#8B5CF6'));  // Secondary purple
const uColor3 = uniform(new Color('#06B6D4'));  // Tertiary teal
const uIntensity = uniform(1.0);
const uSpeed = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Aurora void background — 3 layers of simplex noise with color gradient */
export const auroraPattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(mul(uTime, uSpeed), float(0.15));

  // Layer 1: Large slow curtains (scale 0.5)
  const n1 = simplex2DTSL(add(mul(uvCoord, float(0.5)), vec2(mul(t, float(0.3)), mul(t, float(0.1)))));

  // Layer 2: Medium bands (scale 2.0)
  const n2 = simplex2DTSL(add(mul(uvCoord, float(2.0)), vec2(mul(t, float(-0.2)), mul(t, float(0.4)))));

  // Layer 3: Fast shimmer (scale 5.0)
  const n3 = simplex2DTSL(add(mul(uvCoord, float(5.0)), vec2(mul(t, float(0.5)), mul(t, float(-0.3)))));

  // Combine with decreasing amplitude
  const noise = add(add(mul(n1, float(0.6)), mul(n2, float(0.3))), mul(n3, float(0.1)));

  // Map noise to color gradient
  const band1 = smoothstep(float(-0.2), float(0.3), noise);
  const band2 = smoothstep(float(0.0), float(0.5), noise);

  const color1 = mix(vec3(uColor1), vec3(uColor2), band1);
  const color = mix(color1, vec3(uColor3), mul(band2, float(0.5)));

  // Vertical fade — stronger at top, fades at bottom
  const vertFade = smoothstep(float(0.0), float(0.6), uvCoord.y);

  // Edge vignette — darker at corners
  const vigUv = sub(mul(uvCoord, float(2.0)), float(1.0));
  const vignette = smoothstep(
    float(0.0),
    float(1.0),
    sub(float(1.0), dot(mul(vigUv, float(0.5)), mul(vigUv, float(0.5))))
  );

  const rawAlpha = add(mul(noise, float(0.5)), float(0.5));
  const alpha = clamp(mul(mul(rawAlpha, mul(vertFade, vignette)), uIntensity), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getAuroraUniforms() {
  return { uTime, uColor1, uColor2, uColor3, uIntensity, uSpeed, uResolution };
}
