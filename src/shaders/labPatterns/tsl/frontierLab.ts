 
 
// ================================================================
// TSL Port — Lab 10: Starfield Warp (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/frontierLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)
// Reduced star counts and layers for TSL loop compatibility.

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, smoothstep, length, distance, dot, normalize, atan, mod,
  mul, add, sub, div, min, clamp, step,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { rand2D } from './shared';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#D946EF'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 10: Starfield Warp */
export const lab10Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.5));

  // Center-relative coordinates for radial motion
  const center = vec2(0.5, 0.5);
  const dir = sub(uvCoord, center);
  const dist = length(dir);
  const angle = atan(dir.y, dir.x);

  let totalStars: any = float(0.0);

  // Star layers at different depths (3 layers, reduced star count)
  for (let layer = 0; layer < 3; layer++) {
    const fl = float(layer);
    const layerSpeed = add(float(0.3), mul(fl, float(0.3)));
    const layerSize = sub(float(0.003), mul(fl, float(0.0005)));
    const starCount = 20 + layer * 10; // 20, 30, 40

    for (let i = 0; i < starCount; i++) {
      const fi = float(i);

      // Star position in polar coords
      const starAngle = mul(rand2D(vec2(fi, fl)), float(6.2832));
      const starDist = fract(add(rand2D(vec2(add(fi, float(100.0)), fl)), mul(mul(t, layerSpeed), float(0.1))));

      // Convert back to UV
      const starPos = add(center, mul(vec2(cos(starAngle), sin(starAngle)), mul(starDist, float(0.7))));
      const d = distance(uvCoord, starPos);

      // Star point with streak
      const star = smoothstep(layerSize, float(0.0), d);

      // Radial streak (motion blur effect) — safe normalize
      const streakDir = normalize(add(sub(starPos, center), vec2(0.001, 0.001)));
      const streakLen = mul(mul(starDist, float(0.03)), layerSpeed);
      const streakDist = abs(dot(sub(uvCoord, starPos), vec2(sub(float(0.0), streakDir.y), streakDir.x)));
      const alongStreak = dot(sub(uvCoord, starPos), streakDir);
      const streak = mul(
        mul(
          mul(smoothstep(float(0.002), float(0.0), streakDist), smoothstep(streakLen, float(0.0), alongStreak)),
          step(float(0.0), alongStreak)
        ),
        starDist
      );

      // Brightness increases as stars move outward
      const brightness = add(mul(starDist, float(1.5)), float(0.2));
      totalStars = add(totalStars, mul(add(star, mul(streak, float(0.5))), brightness));
    }
  }

  // Central vortex glow
  const vortex = div(float(0.01), add(mul(dist, dist), float(0.005)));
  const vortexPulse = mul(vortex, add(float(0.5), mul(float(0.5), sin(mul(t, float(2.0))))));

  // Radial speed lines (subtle)
  let speedLines: any = float(0.0);
  for (let k = 0; k < 8; k++) {
    const fk = float(k);
    const lineAngle = add(mul(fk, float(0.7854)), mul(t, float(0.1))); // 45 degree spacing
    const angleDiff = abs(sub(mod(sub(add(angle, float(3.14159)), lineAngle), float(6.28318)), float(3.14159)));
    speedLines = add(speedLines, mul(mul(smoothstep(float(0.03), float(0.01), angleDiff), dist), float(0.3)));
  }

  const total = add(add(totalStars, mul(vortexPulse, float(0.2))), mul(speedLines, float(0.15)));
  const color = add(mul(vec3(uLabColor), total), mul(vec3(0.1, 0.05, 0.0), mul(totalStars, dist)));

  const alpha = clamp(mul(mul(total, uIntensity), float(0.35)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab10Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
