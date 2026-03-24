// ================================================================
// TSL Shared Utilities — Lab Pattern Shaders (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Shared TSL helper functions and uniform declarations for all 10 lab patterns.
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2).

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, step, add, mul, sub, max,
  uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

// ----------------------------------------------------------------
// Common uniforms — each lab file creates its own instances so they
// can be driven independently, but these defaults are re-usable for
// quick prototyping / shared scenes.
// ----------------------------------------------------------------

export const uTime = uniform(0);
export const uLabColor = uniform(new Color('#00BBFF'));
export const uIntensity = uniform(1.0);
export const uResolution = uniform(new Vector2(1920, 1080));

// ----------------------------------------------------------------
// rand2D — Pseudo-random float from a vec2 seed.
// Port of: float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
// ----------------------------------------------------------------

export const rand2D = Fn(([co_immutable]: [ReturnType<typeof vec2>]) => {
  const co = vec2(co_immutable);
  return fract(mul(sin(dot(co, vec2(12.9898, 78.233))), float(43758.5453)));
});

// ----------------------------------------------------------------
// simplex2DTSL — Simplified 2D simplex noise for TSL.
// A faithful port of the GLSL simplex2D from noise.glsl.
// ----------------------------------------------------------------

const mod289Vec3 = Fn(([x_immutable]: [ReturnType<typeof vec3>]) => {
  const x = vec3(x_immutable);
  return sub(x, mul(floor(mul(x, float(1.0 / 289.0))), float(289.0)));
});

const mod289Vec2 = Fn(([x_immutable]: [ReturnType<typeof vec2>]) => {
  const x = vec2(x_immutable);
  return sub(x, mul(floor(mul(x, float(1.0 / 289.0))), float(289.0)));
});

const permute3 = Fn(([x_immutable]: [ReturnType<typeof vec3>]) => {
  const x = vec3(x_immutable);
  return mod289Vec3(mul(add(mul(x, float(34.0)), float(10.0)), x));
});

export const simplex2DTSL = Fn(([v_immutable]: [ReturnType<typeof vec2>]) => {
  const v = vec2(v_immutable);

  // Constants: C.x = (3-sqrt(3))/6, C.y = 0.5*(sqrt(3)-1), C.z = -1+2*C.x, C.w = 1/41
  const Cx = float(0.211324865405187);
  const Cy = float(0.366025403784439);
  const Cz = float(-0.577350269189626);

  // First corner
  const i = floor(add(v, float(dot(v, vec2(Cy, Cy)))));
  const x0 = add(sub(v, i), float(dot(i, vec2(Cx, Cx))));

  // Other corners — select i1 based on x0.x > x0.y
  // Use step: if x0.y >= x0.x => i1 = (0,1), else i1 = (1,0)
  const s = step(x0.x, x0.y);
  const i1 = vec2(sub(float(1.0), s), s);

  // x12 = x0.xyxy + C.xxzz - i1.xyxy (for corners 1 and 2)
  const x1 = add(sub(x0, i1), vec2(Cx, Cx));
  const x2 = add(x0, vec2(Cz, Cz));

  // Permutations
  const iMod = mod289Vec2(i);
  const p = permute3(
    add(
      permute3(add(iMod.y, vec3(0.0, i1.y, 1.0))),
      add(iMod.x, vec3(0.0, i1.x, 1.0))
    )
  );

  // Kernel falloff: m = max(0.5 - dot products, 0)
  const m0 = max(sub(float(0.5), dot(x0, x0)), float(0.0));
  const m1 = max(sub(float(0.5), dot(x1, x1)), float(0.0));
  const m2 = max(sub(float(0.5), dot(x2, x2)), float(0.0));

  const m0_4 = mul(mul(m0, m0), mul(m0, m0));
  const m1_4 = mul(mul(m1, m1), mul(m1, m1));
  const m2_4 = mul(mul(m2, m2), mul(m2, m2));

  // Gradients: x = 2*fract(p * (1/41)) - 1
  const gx = sub(mul(fract(mul(p, float(1.0 / 41.0))), float(2.0)), float(1.0));
  const gy = sub(abs(gx), float(0.5));
  const ox = floor(add(gx, float(0.5)));
  const ax = sub(gx, ox);

  // Normalize: m *= 1.79284.. - 0.85373.. * (a*a + h*h)
  const norm0 = sub(float(1.79284291400159), mul(float(0.85373472095314), add(mul(ax.x, ax.x), mul(gy.x, gy.x))));
  const norm1 = sub(float(1.79284291400159), mul(float(0.85373472095314), add(mul(ax.y, ax.y), mul(gy.y, gy.y))));
  const norm2 = sub(float(1.79284291400159), mul(float(0.85373472095314), add(mul(ax.z, ax.z), mul(gy.z, gy.z))));

  // Dot products: g.x = a0.x*x0.x + h.x*x0.y, etc.
  const g0 = add(mul(ax.x, x0.x), mul(gy.x, x0.y));
  const g1 = add(mul(ax.y, x1.x), mul(gy.y, x1.y));
  const g2 = add(mul(ax.z, x2.x), mul(gy.z, x2.y));

  return mul(float(130.0), add(add(
    mul(mul(m0_4, norm0), g0),
    mul(mul(m1_4, norm1), g1)
  ), mul(mul(m2_4, norm2), g2)));
});
