 
 
// ================================================================
// TSL Port — Fire Noise Shader (Vertex + Fragment)
// ================================================================
// Original: src/shaders/fireNoise.glsl
// Applied to: StreakFlame3D.tsx (Diamond tier, 100+ day streak)
// Geometry: PlaneGeometry billboard facing camera
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow, length,
  uv, uniform, positionLocal,
} from 'three/tsl';
import { simplex3DTSL } from './noiseUtils';
import { rand2D } from '../labPatterns/tsl/shared';

const uTime = uniform(0);
const uFlameHeight = uniform(1.0);  // 1.0 = normal, 1.5 = excited
const uIntensity = uniform(1.0);

/** FBM flame turbulence — 4 octaves using simplex3D */
const flameFBM = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const v1 = mul(float(0.5), simplex3DTSL(vec3(p.x, p.y, mul(uTime, float(1.0)))));
  const v2 = mul(float(0.25), simplex3DTSL(vec3(mul(p.x, float(2.0)), mul(p.y, float(2.0)), mul(uTime, float(1.3)))));
  const v3 = mul(float(0.125), simplex3DTSL(vec3(mul(p.x, float(4.0)), mul(p.y, float(4.0)), mul(uTime, float(1.6)))));
  const v4 = mul(float(0.0625), simplex3DTSL(vec3(mul(p.x, float(8.0)), mul(p.y, float(8.0)), mul(uTime, float(1.9)))));
  return add(add(v1, v2), add(v3, v4));
});

/** Prismatic color for Diamond tier — cosine palette rainbow */
const prismaticColor = Fn(([t]: [ReturnType<typeof float>]) => {
  const a = vec3(0.5, 0.5, 0.5);
  const b = vec3(0.5, 0.5, 0.5);
  const c = vec3(1.0, 1.0, 1.0);
  const d = vec3(0.00, 0.33, 0.67);
  return add(a, mul(b, (cos as any)(mul(float(6.28318), add(mul(c, t), d)))));
});

/** Fire noise vertex — wave distortion + height scaling */
export const fireNoiseVertex = Fn(() => {
  const pos = positionLocal;
  const uvCoord = uv();

  // Subtle horizontal wave at flame tip
  const wave = mul(mul(sin(add(mul(uTime, float(3.0)), mul(pos.y, float(4.0)))), float(0.05)), pos.y);

  return vec3(add(pos.x, wave), mul(pos.y, uFlameHeight), pos.z);
});

/** Fire noise fragment — FBM flame + prismatic Diamond coloring */
export const fireNoiseFragment = Fn(() => {
  const uvCoord = uv();

  // Center horizontally, base at bottom
  const flameX = mul(sub(uvCoord.x, float(0.5)), float(2.0));
  const flameUV = vec2(flameX, uvCoord.y);

  // Flame shape mask: narrow at top, wide at base
  const width = mix(float(0.6), float(0.1), pow(uvCoord.y, float(0.8)));
  const flameMask = smoothstep(width, mul(width, float(0.5)), abs(flameX));

  // FBM noise for turbulence (scrolls upward)
  const noiseUV = vec2(mul(flameX, float(3.0)), sub(mul(uvCoord.y, float(2.0)), mul(uTime, float(2.5))));
  const noise = flameFBM(noiseUV);

  // Distort flame shape with noise
  const distortedMask = mul(
    flameMask,
    smoothstep(float(-0.3), float(0.5), add(noise, mul(sub(float(1.0), uvCoord.y), float(0.8))))
  );

  // Core temperature gradient (white hot center -> edges)
  const coreDistance = mul(
    length(vec2(flameX, sub(uvCoord.y, float(0.3)))),
    float(2.0)
  );
  const core = sub(float(1.0), smoothstep(float(0.0), float(0.5), coreDistance));

  // Diamond prismatic coloring
  const prismT = add(add(mul(noise, float(0.5)), mul(uvCoord.y, float(0.3))), mul(uTime, float(0.1)));
  const prismColor = prismaticColor(prismT);

  // Temperature-based color: white core -> prismatic mid -> blue tips
  const coreColor = vec3(1.0, 0.98, 0.95);
  const midColor = mul(prismColor, float(1.2));
  const tipColor = vec3(0.3, 0.5, 1.0);

  const flameColor1 = mix(tipColor, midColor, smoothstep(float(0.6), float(0.2), uvCoord.y));
  const flameColor2 = mix(flameColor1, coreColor, mul(core, float(0.7)));

  // Final alpha
  const alpha = mul(mul(distortedMask, uIntensity), smoothstep(float(1.0), float(0.85), uvCoord.y));

  // Subtle ember particles near tip
  const emberSeed = add(mul(uvCoord, float(100.0)), uTime);
  const ember = mul(
    mul(smoothstep(float(0.97), float(1.0), rand2D(emberSeed)), distortedMask),
    sub(float(1.0), uvCoord.y)
  );
  const finalColor = add(flameColor2, mul(vec3(1.0, 0.8, 0.4), mul(ember, float(2.0))));

  return vec4(finalColor, alpha);
});

/** Get uniforms for external control */
export function getFireNoiseUniforms() {
  return { uTime, uFlameHeight, uIntensity };
}
