// ================================================================
// TSL Noise Utilities — Ports of noise.glsl + electricVeins perlinNoise2D
// ================================================================
// Faithful TSL ports of all noise functions from src/shaders/noise.glsl.
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2).
//
// Exports:
//   simplex3DTSL  — 3D simplex noise (port of simplex3D)
//   fbmTSL        — 2D FBM using simplex2D (port of fbm)
//   fbm3TSL       — 3D FBM using simplex3D (port of fbm3)
//   curlNoiseTSL  — 2D curl noise (port of curlNoise)
//   perlinNoise2DTSL — 2D Perlin noise with quintic interpolation (port from electricVeins.frag)
//   hash2TSL      — vec2 hash for Perlin noise (port from electricVeins.frag)
//
// Note: simplex2DTSL is already in labPatterns/tsl/shared.ts — re-exported here.

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, step, add, mul, sub, max, min,
  mix, smoothstep, exp,
} from 'three/tsl';

// Re-export simplex2D from the existing shared utilities
export { simplex2DTSL, rand2D } from '../labPatterns/tsl/shared';

// ────────────────────────────────────────────────────────────────
// Internal helpers — mod289 and permute for simplex3D
// ────────────────────────────────────────────────────────────────

const mod289Vec3 = Fn(([x_immutable]: [ReturnType<typeof vec3>]) => {
  const x = vec3(x_immutable);
  return sub(x, mul(floor(mul(x, float(1.0 / 289.0))), float(289.0)));
});

const mod289Vec4 = Fn(([x_immutable]: [ReturnType<typeof vec4>]) => {
  const x = vec4(x_immutable);
  return sub(x, mul(floor(mul(x, float(1.0 / 289.0))), float(289.0)));
});

const permute4 = Fn(([x_immutable]: [ReturnType<typeof vec4>]) => {
  const x = vec4(x_immutable);
  return mod289Vec4(mul(add(mul(x, float(34.0)), float(10.0)), x));
});

const taylorInvSqrt4 = Fn(([r_immutable]: [ReturnType<typeof vec4>]) => {
  const r = vec4(r_immutable);
  return sub(float(1.79284291400159), mul(float(0.85373472095314), r));
});

// ────────────────────────────────────────────────────────────────
// simplex3DTSL — 3D Simplex Noise
// Port of simplex3D(vec3 v) from noise.glsl
// Returns float in range [-1, 1]
// ────────────────────────────────────────────────────────────────

export const simplex3DTSL = Fn(([v_immutable]: [ReturnType<typeof vec3>]) => {
  const v = vec3(v_immutable);

  // Constants: C.x = 1/6, C.y = 1/3
  const Cx = float(1.0 / 6.0);
  const Cy = float(1.0 / 3.0);

  // First corner
  const i = floor(add(v, float(dot(v, vec3(Cy, Cy, Cy)))));
  const x0 = add(sub(v, i), float(dot(i, vec3(Cx, Cx, Cx))));

  // Other corners
  const g = step(x0.yzx, x0.xyz);
  const l = sub(float(1.0), g);
  const i1 = min(g.xyz, l.zxy);
  const i2 = max(g.xyz, l.zxy);

  const x1 = add(sub(x0, i1), vec3(Cx, Cx, Cx));
  const x2 = add(sub(x0, i2), vec3(Cy, Cy, Cy));
  const x3 = sub(x0, vec3(0.5, 0.5, 0.5));

  // Permutations
  const iMod = mod289Vec3(i);
  const p = permute4(
    add(
      permute4(
        add(
          permute4(add(iMod.z, vec4(0.0, i1.z, i2.z, 1.0))),
          add(iMod.y, vec4(0.0, i1.y, i2.y, 1.0))
        )
      ),
      add(iMod.x, vec4(0.0, i1.x, i2.x, 1.0))
    )
  );

  // Gradients
  const n_ = float(0.142857142857); // 1/7
  const ns_z = sub(mul(n_, float(2.0)), float(1.0));  // ns.z = 2*n_ - 1 = -0.714...
  // Actually: ns = n_ * D.wyz - D.xzx where D = (0, 0.5, 1, 2)
  // ns = (n_*2 - 0, n_*1 - 1, n_*0.5 - 0) = (0.2857, -0.8571, 0.0714)
  const ns_x = float(0.142857142857);   // n_ * 1.0 - 0.0 ... actually recalculating
  // D.wyz = (2, 0.5, 1), D.xzx = (0, 1, 0)
  // ns = n_ * vec3(2, 0.5, 1) - vec3(0, 1, 0) = vec3(0.2857, -0.9286, 0.1429)
  // Actually let me just use the constants directly from the GLSL

  const j = sub(p, mul(floor(mul(p, mul(float(0.142857142857 * 0.142857142857), float(1.0)))), float(49.0)));
  // Simpler: j = p - 49.0 * floor(p * ns.z * ns.z)
  // ns.z = n_ * 1.0 - 0.0... let me trace through more carefully
  // D = vec4(0.0, 0.5, 1.0, 2.0)
  // ns = n_ * D.wyz - D.xzx = 0.142857 * vec3(2.0, 0.5, 1.0) - vec3(0.0, 1.0, 0.0)
  //    = vec3(0.285714, 0.071429, 0.142857) - vec3(0, 1, 0)
  //    = vec3(0.285714, -0.928571, 0.142857)
  // ns.z * ns.z = 0.142857 * 0.142857 = 0.020408
  // j = p - 49.0 * floor(p * 0.020408)
  const nsZsq = float(0.020408163265); // (1/7)^2 = 1/49
  const jj = sub(p, mul(float(49.0), floor(mul(p, float(nsZsq)))));

  // x_ = floor(j * ns.z);  y_ = floor(j - 7.0 * x_);
  const nsZ = float(0.142857142857);
  const x_ = floor(mul(jj, nsZ));
  const y_ = floor(sub(jj, mul(float(7.0), x_)));

  // x = x_ * ns.x + ns.yyyy;  y = y_ * ns.x + ns.yyyy
  const nsX = float(0.285714285714);
  const nsY = float(-0.928571428571);
  const xx = add(mul(x_, nsX), vec4(nsY, nsY, nsY, nsY));
  const yy = add(mul(y_, nsX), vec4(nsY, nsY, nsY, nsY));
  const hh = sub(sub(float(1.0), abs(xx)), abs(yy));

  const b0 = vec4(xx.x, xx.y, yy.x, yy.y);
  const b1 = vec4(xx.z, xx.w, yy.z, yy.w);

  const s0 = add(mul(floor(b0), float(2.0)), float(1.0));
  const s1 = add(mul(floor(b1), float(2.0)), float(1.0));
  const sh = step(hh, vec4(0.0, 0.0, 0.0, 0.0)).negate();

  // a0, a1 via swizzle: xzyw
  const a0x = add(b0.x, mul(s0.x, sh.x));
  const a0y = add(b0.z, mul(s0.z, sh.x));
  const a0z = add(b0.y, mul(s0.y, sh.y));
  const a0w = add(b0.w, mul(s0.w, sh.y));

  const a1x = add(b1.x, mul(s1.x, sh.z));
  const a1y = add(b1.z, mul(s1.z, sh.z));
  const a1z = add(b1.y, mul(s1.y, sh.w));
  const a1w = add(b1.w, mul(s1.w, sh.w));

  const p0 = vec3(a0x, a0y, hh.x);
  const p1 = vec3(a0z, a0w, hh.y);
  const p2 = vec3(a1x, a1y, hh.z);
  const p3 = vec3(a1z, a1w, hh.w);

  const norm = taylorInvSqrt4(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  const p0n = mul(p0, norm.x);
  const p1n = mul(p1, norm.y);
  const p2n = mul(p2, norm.z);
  const p3n = mul(p3, norm.w);

  // Kernel falloff
  const m = max(sub(float(0.6), vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))), float(0.0));
  const mm = mul(m, m);

  return mul(
    float(42.0),
    dot(
      mul(mm, mm),
      vec4(dot(p0n, x0), dot(p1n, x1), dot(p2n, x2), dot(p3n, x3))
    )
  );
});

// ────────────────────────────────────────────────────────────────
// fbmTSL — 2D Fractional Brownian Motion (up to 6 octaves)
// Port of fbm(vec2 p, int octaves) from noise.glsl
// Uses simplex2DTSL from shared.ts
// ────────────────────────────────────────────────────────────────

import { simplex2DTSL } from '../labPatterns/tsl/shared';

/** 2D FBM with fixed 4 octaves (TSL doesn't support dynamic loops well) */
export const fbm4TSL = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const v1 = mul(float(0.5), simplex2DTSL(p));
  const v2 = mul(float(0.25), simplex2DTSL(mul(p, float(2.0))));
  const v3 = mul(float(0.125), simplex2DTSL(mul(p, float(4.0))));
  const v4 = mul(float(0.0625), simplex2DTSL(mul(p, float(8.0))));
  return add(add(v1, v2), add(v3, v4));
});

/** 2D FBM with fixed 6 octaves */
export const fbm6TSL = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const v1 = mul(float(0.5), simplex2DTSL(p));
  const v2 = mul(float(0.25), simplex2DTSL(mul(p, float(2.0))));
  const v3 = mul(float(0.125), simplex2DTSL(mul(p, float(4.0))));
  const v4 = mul(float(0.0625), simplex2DTSL(mul(p, float(8.0))));
  const v5 = mul(float(0.03125), simplex2DTSL(mul(p, float(16.0))));
  const v6 = mul(float(0.015625), simplex2DTSL(mul(p, float(32.0))));
  return add(add(add(v1, v2), add(v3, v4)), add(v5, v6));
});

// ────────────────────────────────────────────────────────────────
// fbm3TSL — 3D Fractional Brownian Motion (up to 6 octaves)
// Port of fbm3(vec3 p, int octaves) from noise.glsl
// Uses simplex3DTSL
// ────────────────────────────────────────────────────────────────

/** 3D FBM with fixed 4 octaves */
export const fbm3_4TSL = Fn(([p_immutable]: [ReturnType<typeof vec3>]) => {
  const p = vec3(p_immutable);
  const v1 = mul(float(0.5), simplex3DTSL(p));
  const v2 = mul(float(0.25), simplex3DTSL(mul(p, float(2.0))));
  const v3 = mul(float(0.125), simplex3DTSL(mul(p, float(4.0))));
  const v4 = mul(float(0.0625), simplex3DTSL(mul(p, float(8.0))));
  return add(add(v1, v2), add(v3, v4));
});

/** 3D FBM with fixed 6 octaves */
export const fbm3_6TSL = Fn(([p_immutable]: [ReturnType<typeof vec3>]) => {
  const p = vec3(p_immutable);
  const v1 = mul(float(0.5), simplex3DTSL(p));
  const v2 = mul(float(0.25), simplex3DTSL(mul(p, float(2.0))));
  const v3 = mul(float(0.125), simplex3DTSL(mul(p, float(4.0))));
  const v4 = mul(float(0.0625), simplex3DTSL(mul(p, float(8.0))));
  const v5 = mul(float(0.03125), simplex3DTSL(mul(p, float(16.0))));
  const v6 = mul(float(0.015625), simplex3DTSL(mul(p, float(32.0))));
  return add(add(add(v1, v2), add(v3, v4)), add(v5, v6));
});

// ────────────────────────────────────────────────────────────────
// curlNoiseTSL — 2D Curl Noise
// Port of curlNoise(vec2 p) from noise.glsl
// Derivative-based flow field using simplex2D
// ────────────────────────────────────────────────────────────────

export const curlNoiseTSL = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const eps = float(0.001);

  const n1 = simplex2DTSL(vec2(p.x, add(p.y, eps)));
  const n2 = simplex2DTSL(vec2(p.x, sub(p.y, eps)));
  const n3 = simplex2DTSL(vec2(add(p.x, eps), p.y));
  const n4 = simplex2DTSL(vec2(sub(p.x, eps), p.y));

  const cx = mul(sub(n1, n2), float(1.0 / (2.0 * 0.001)));
  const cy = mul(sub(n3, n4), float(-1.0 / (2.0 * 0.001)));

  return vec2(cx, cy);
});

// ────────────────────────────────────────────────────────────────
// hash2TSL — vec2 hash for Perlin noise
// Port of hash2(vec2 p) from electricVeins.frag
// ────────────────────────────────────────────────────────────────

export const hash2TSL = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const d1 = dot(p, vec2(127.1, 311.7));
  const d2 = dot(p, vec2(269.5, 183.3));
  return sub(mul(fract(sin(vec2(d1, d2)).mul(float(43758.5453123))), float(2.0)), float(1.0));
});

// ────────────────────────────────────────────────────────────────
// perlinNoise2DTSL — 2D Perlin Noise with quintic interpolation
// Port of perlinNoise2D(vec2 p) from electricVeins.frag
// ────────────────────────────────────────────────────────────────

export const perlinNoise2DTSL = Fn(([p_immutable]: [ReturnType<typeof vec2>]) => {
  const p = vec2(p_immutable);
  const i = floor(p);
  const f = fract(p);

  // Quintic interpolation: f * f * f * (f * (f * 6.0 - 15.0) + 10.0)
  const u = mul(
    mul(mul(f, f), f),
    add(mul(f, add(mul(f, float(6.0)), float(-15.0))), float(10.0))
  );

  const a = dot(hash2TSL(add(i, vec2(0.0, 0.0))), sub(f, vec2(0.0, 0.0)));
  const b = dot(hash2TSL(add(i, vec2(1.0, 0.0))), sub(f, vec2(1.0, 0.0)));
  const c = dot(hash2TSL(add(i, vec2(0.0, 1.0))), sub(f, vec2(0.0, 1.0)));
  const d = dot(hash2TSL(add(i, vec2(1.0, 1.0))), sub(f, vec2(1.0, 1.0)));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});
