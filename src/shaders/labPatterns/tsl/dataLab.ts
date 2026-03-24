// ================================================================
// TSL Port — Lab 2: Data Sorting Waves (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/dataLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, abs, smoothstep, mul, add, sub, clamp, min,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#AA66FF'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 2: Data Sorting Waves */
export const lab2Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.3));

  const bars = float(12.0);
  const barHeight = float(1.0 / 12.0);

  // Accumulate bar intensities via unrolled loop
  let totalIntensity = float(0.0);

  for (let i = 0; i < 12; i++) {
    const fi = float(i);
    const barY = mul(add(fi, float(0.5)), barHeight);

    // Each bar has a different width that oscillates (sorting animation)
    const sortPhase = add(mul(sin(add(mul(t, float(0.8)), mul(fi, float(0.5)))), float(0.5)), float(0.5));
    const barWidth = add(float(0.1), mul(sortPhase, float(0.6)));

    // Bar position shifts horizontally during sort
    const barX = add(float(0.5), mul(sin(add(mul(t, float(0.4)), mul(fi, float(1.2)))), float(0.15)));

    // Distance from bar center
    const dy = abs(sub(uvCoord.y, barY));
    const dx = abs(sub(uvCoord.x, barX));

    // Rounded bar shape
    const barShape = mul(
      smoothstep(mul(barHeight, float(0.4)), mul(barHeight, float(0.1)), dy),
      smoothstep(mul(barWidth, float(0.5)), mul(barWidth, float(0.3)), dx)
    );

    // Height-based brightness
    const brightness = add(mul(sortPhase, float(0.7)), float(0.3));
    totalIntensity = add(totalIntensity, mul(barShape, brightness));
  }

  const color = mul(vec3(uLabColor), totalIntensity);

  // Subtle wave distortion
  const wave = mul(mul(sin(add(mul(uvCoord.x, float(10.0)), mul(t, float(2.0)))), sin(sub(mul(uvCoord.y, float(8.0)), mul(t, float(1.5))))), float(0.05));
  const finalColor = add(color, mul(vec3(uLabColor), wave));

  const alpha = clamp(mul(mul(totalIntensity, uIntensity), float(0.35)), float(0.0), float(0.35));

  return vec4(finalColor, alpha);
});

/** Get uniforms for external control */
export function getLab2Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
