 
 
// ================================================================
// TSL Port — Energy Field Shader (Vertex + Fragment)
// ================================================================
// Original: src/shaders/energyField.glsl
// Decision 4.5: Full 3D dome for streak shield on Profile page
// Geometry: IcosahedronGeometry (detail=2) — natural hex facets
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)
//
// VERTEX: Breathing pulse + shatter displacement
// FRAGMENT: Hex grid + Fresnel glow + energy crawl

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow,
  step, normalize,
  uv, uniform, normalLocal, positionLocal, positionWorld, cameraPosition,
} from 'three/tsl';
import { Color } from 'three';
import { simplex3DTSL } from './noiseUtils';
import { rand2D } from '../labPatterns/tsl/shared';

const uTime = uniform(0);
const uShieldHP = uniform(1.0);
const uBreathScale = uniform(1.0);
const uShatterProgress = uniform(0.0);
const uColor = uniform(new Color('#00BBFF'));
const uIntensity = uniform(1.0);

// ── Per-face random for shatter direction ──
const faceRand = Fn(([pos]: [ReturnType<typeof vec3>]) => {
  const floored = floor(mul(pos, float(10.0)));
  return fract(mul(sin(dot(floored, vec3(12.9898, 78.233, 45.164))), float(43758.5453)));
});

// ── Hex grid pattern ──
const hexGrid = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const qx = mul(p.x, mul(float(2.0), float(0.5773503)));
  const qy = add(p.y, mul(p.x, float(0.5773503)));
  const pi = floor(vec2(qx, qy));
  const pf = fract(vec2(qx, qy));

  const v = fract(mul(add(pi.x, pi.y), float(1.0 / 3.0))).mul(float(3.0));
  const ca = step(float(1.0), v);
  const cb = step(float(2.0), v);

  const maX = step(pf.x, pf.y);
  const maY = step(pf.y, pf.x);

  const e = dot(
    vec2(maX, maY),
    add(
      sub(float(1.0), vec2(pf.y, pf.x)),
      add(
        mul(ca, add(pf.x, sub(pf.y, float(1.0)))),
        mul(cb, sub(vec2(pf.y, pf.x), mul(float(2.0), vec2(pf.x, pf.y))))
      )
    )
  );

  return smoothstep(float(0.0), float(0.08), e);
});

/** Energy field vertex displacement — breathing + shatter */
export const energyFieldVertex = Fn(() => {
  const pos = positionLocal;
  const normal = normalLocal;

  // Breathing pulse (subtle scale oscillation)
  const breath = add(float(1.0), mul(sin(mul(uTime, float(2.0))), mul(uBreathScale, float(0.02))));

  // Shatter: each face flies outward along its normal
  const fRand = faceRand(pos);
  const shatterOffset = mul(mul(normal, fRand), mul(uShatterProgress, float(2.0)));
  const shatterRotate = mul(mul(uShatterProgress, fRand), float(6.28));
  const shatterX = mul(sin(shatterRotate), mul(uShatterProgress, float(0.5)));
  const shatterY = mul(cos(shatterRotate), mul(uShatterProgress, float(0.3)));

  const finalPos = add(
    mul(pos, breath),
    add(shatterOffset, vec3(shatterX, shatterY, float(0.0)))
  );

  return finalPos;
});

/** Energy field fragment — hex grid + fresnel + energy crawl */
export const energyFieldFragment = Fn(() => {
  const worldPos = positionWorld;
  const normal = normalize(normalLocal);

  // Hex grid on the dome surface
  const hexUv = add(worldPos.xy.mul(float(3.0)), mul(worldPos.z, float(0.5)));
  const hex = hexGrid(hexUv);
  const hexEdge = sub(float(1.0), hex);

  // Energy crawl along hex edges
  const energyCrawl = add(
    mul(simplex3DTSL(vec3(hexUv.x.mul(float(2.0)), hexUv.y.mul(float(2.0)), mul(uTime, float(1.5)))), float(0.5)),
    float(0.5)
  );
  const crawlOnEdge = mul(hexEdge, energyCrawl);

  // Fresnel edge glow
  const viewDir = normalize(sub(cameraPosition, worldPos));
  const fresnel = pow(sub(float(1.0), max(dot(normal, viewDir), float(0.0))), float(2.0));

  // Base dome color
  const baseColor = mul(vec3(uColor), float(0.3));
  const baseAlpha = add(float(0.05), mul(fresnel, float(0.4)));

  // Hex edge glow
  const edgeColor = mul(vec3(uColor), mul(float(1.5), crawlOnEdge));
  const edgeAlpha = mul(crawlOnEdge, float(0.6));

  // Combine
  const finalColor = add(baseColor, edgeColor);
  const combinedAlpha = mul(add(baseAlpha, edgeAlpha), uIntensity);

  // HP-based dimming
  const hpAlpha = mul(combinedAlpha, uShieldHP);
  const hpColor = mul(finalColor, mix(float(0.3), float(1.0), uShieldHP));

  // Shatter fade
  const shatterAlpha = mul(hpAlpha, sub(float(1.0), mul(uShatterProgress, float(0.8))));

  // Low HP pulse flash
  const pulse = add(mul(sin(mul(uTime, float(8.0))), float(0.5)), float(0.5));
  const lowHPBoost = mul(
    mul(step(uShieldHP, float(0.3)), step(float(0.001), uShieldHP)),
    mul(vec3(uColor), mul(pulse, float(0.5)))
  );

  return vec4(add(hpColor, lowHPBoost), shatterAlpha);
});

/** Get uniforms for external control */
export function getEnergyFieldUniforms() {
  return { uTime, uShieldHP, uBreathScale, uShatterProgress, uColor, uIntensity };
}
