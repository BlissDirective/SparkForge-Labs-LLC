/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ================================================================
// TSL Port — Holographic Card Shader (Fragment Only)
// ================================================================
// Original: src/shaders/holographic.glsl
// Decision 4.3: Applied to collectibles + Daily Spark only
// Rainbow diffraction from view angle + tilt.
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)
//
// NOTE: This shader requires vNormal and vViewPosition varyings.
// In TSL, these come from the geometry via normalLocal/positionViewDirection.

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow, normalize, length,
  uv, uniform, normalLocal, positionViewDirection,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { rand2D } from '../labPatterns/tsl/shared';

const uTime = uniform(0);
const uTilt = uniform(new Vector2(0, 0));
const uIntensity = uniform(1.0);
const uBaseColor = uniform(new Color('#00BBFF'));

/** HSL to RGB conversion — TSL port
 * GLSL: rgb = clamp(abs(mod(h*6 + vec3(0,4,2), 6) - 3) - 1, 0, 1)
 * result = l + s * (rgb - 0.5) * (1 - abs(2*l - 1))
 */
const hsl2rgb = Fn(([h, s, l]: [ReturnType<typeof float>, ReturnType<typeof float>, ReturnType<typeof float>]) => {
  // mod(h*6 + offset, 6) = fract((h*6 + offset) / 6) * 6
  const h6 = mul(h, float(6.0));

  const modR = mul(fract(add(h6, float(0.0)).div(float(6.0))), float(6.0));
  const modG = mul(fract(add(h6, float(4.0)).div(float(6.0))), float(6.0));
  const modB = mul(fract(add(h6, float(2.0)).div(float(6.0))), float(6.0));

  // abs(mod - 3) - 1, clamped [0, 1]
  const rawR = clamp(sub(abs(sub(modR, float(3.0))), float(1.0)), float(0.0), float(1.0));
  const rawG = clamp(sub(abs(sub(modG, float(3.0))), float(1.0)), float(0.0), float(1.0));
  const rawB = clamp(sub(abs(sub(modB, float(3.0))), float(1.0)), float(0.0), float(1.0));
  const rgb = vec3(rawR, rawG, rawB);

  // result = l + s * (rgb - 0.5) * (1 - abs(2*l - 1))
  return add(l, mul(mul(s, sub(rgb, float(0.5))), sub(float(1.0), abs(sub(mul(float(2.0), l), float(1.0))))));
});

/** Holographic card shader — rainbow diffraction from view angle + tilt */
export const holographicPattern = Fn(() => {
  const uvCoord = uv();
  const normal = normalize(normalLocal);
  const viewDir = normalize(positionViewDirection.negate());

  // View-dependent hue shift (core holographic effect)
  const viewAngle = dot(normal, viewDir);
  const hueBase = add(mul(viewAngle, float(0.5)), float(0.5));

  // Tilt influence — mouse movement shifts rainbow bands
  const tiltInfluence = add(mul(uTilt.x, float(0.3)), mul(uTilt.y, float(0.2)));
  const hue = fract(add(add(hueBase, tiltInfluence), mul(uTime, float(0.05))));

  // Spatial variation — rainbow bands sweep across the card
  const spatialHue = fract(add(add(hue, mul(uvCoord.x, float(0.4))), mul(uvCoord.y, float(0.3))));

  // Generate rainbow color
  const rainbow = hsl2rgb(spatialHue, float(0.8), float(0.6));

  // Fresnel-based intensity — stronger at glancing angles
  const fresnel = pow(sub(float(1.0), max(viewAngle, float(0.0))), float(2.5));

  // Holographic strength: subtle at rest, vivid on tilt
  const tiltMagnitude = length(vec2(uTilt.x, uTilt.y));
  const holoStrength = mul(mix(float(0.15), float(0.6), tiltMagnitude), uIntensity);

  // Shimmer sparkle (fast-moving hash noise)
  const sparkleInput = add(mul(uvCoord, float(50.0)), mul(uTime, float(2.0)));
  const sparkle = mul(smoothstep(float(0.92), float(1.0), rand2D(sparkleInput)), float(0.3));

  // Combine: base card color + rainbow overlay + sparkle
  const mixed = mix(vec3(uBaseColor), rainbow, mul(holoStrength, fresnel));
  const withSparkle = add(mixed, mul(rainbow, mul(sparkle, uIntensity)));

  // Subtle iridescent edge glow
  const finalColor = add(withSparkle, mul(mul(rainbow, fresnel), mul(float(0.15), uIntensity)));

  return vec4(finalColor, float(1.0));
});

/** Get uniforms for external control */
export function getHolographicUniforms() {
  return { uTime, uTilt, uIntensity, uBaseColor };
}
