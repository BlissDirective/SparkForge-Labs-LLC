// ════════════════════════════════════════════════════════════════
// tsl/postfx — Custom TSL Post-Processing Effects (P5 §10.8 Sub 3b)
// ════════════════════════════════════════════════════════════════
//
// Node factories for effects not shipped natively by three/addons/tsl:
//   - vignette(): radial darkening at screen edges
//   - hueSaturation(): HSV-space hue rotation + saturation boost
//   - brightnessContrast(): linear brightness offset + contrast scale
//
// Each function takes an input color node and returns a new vec4 color
// node, preserving the TSL composition pattern used by native nodes
// like bloom(), chromaticAberration(), etc.
//
// Mythos note: each effect is a "shared expert" in the post-processing
// MoE — always-on transforms that apply regardless of scene route. They
// live outside the archetype kernel dispatch because they're per-pixel
// color ops, not per-particle physics.
// ════════════════════════════════════════════════════════════════

import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  uv,
  min,
  max,
  mix,
  dot,
  sub,
  abs,
  mul,
  add,
} from 'three/tsl';
import type Node from 'three/src/nodes/core/Node.js';

type ColorNode = Node<'vec4'>;
type FloatArg = number | Node<'float'>;

/** Coerce a number or TSL float node to a TSL float node. */
function f(v: FloatArg): Node<'float'> {
  return typeof v === 'number' ? (float(v) as Node<'float'>) : v;
}

// ────────────────────────────────────────────────────────────────
// VIGNETTE
// ────────────────────────────────────────────────────────────────

/** Apply a circular vignette darkening toward the screen edges.
 *  @param input   Color node from prior stage.
 *  @param offset  Distance from center where darkening starts (0.3 ≈ inset).
 *  @param darkness Peak darkening at corners (0.5 ≈ half-brightness).
 */
export function vignette(
  input: ColorNode,
  offset: FloatArg = 0.3,
  darkness: FloatArg = 0.5,
): ColorNode {
  const offsetN = f(offset);
  const darknessN = f(darkness);

  return Fn(() => {
    // Distance from screen center in UV space — range ~0..0.707
    const centered = uv().sub(vec2(0.5, 0.5));
    const dist = centered.length();
    // Normalize so that the corner distance 0.707 maps to 1.0
    const normalized = dist.mul(1.4142); // ≈ √2 ≈ max distance

    // Smooth darkening curve beyond `offset`
    const t = normalized.sub(offsetN).div(float(1).sub(offsetN).max(0.0001)).clamp(0, 1);
    // Quadratic falloff for natural-looking vignette
    const fade = float(1).sub(darknessN.mul(t.mul(t)));

    return vec4(input.rgb.mul(fade), input.a);
  })() as unknown as ColorNode;
}

// ────────────────────────────────────────────────────────────────
// HUE SATURATION
// ────────────────────────────────────────────────────────────────

/** Apply hue rotation (in radians) and saturation adjustment.
 *  Algorithm: luminance-preserving hue rotation via YIQ color space.
 *  @param input      Color node from prior stage.
 *  @param hue        Hue shift in radians (2π = full rotation).
 *  @param saturation Saturation delta (-1 = grayscale, 0 = unchanged, +1 = 2×).
 */
export function hueSaturation(
  input: ColorNode,
  hue: FloatArg = 0,
  saturation: FloatArg = 0,
): ColorNode {
  const hueN = f(hue);
  const satN = f(saturation);

  return Fn(() => {
    // Approximate perceptual luminance (Rec.709)
    const lum = dot(input.rgb, vec3(0.2126, 0.7152, 0.0722));

    // Saturation: lerp from grayscale(lum) toward original
    const satApplied = mix(vec3(lum), input.rgb, float(1).add(satN));

    // Hue rotation via YIQ color space (Rodrigues around luminance axis).
    // Precompute trig values once to keep the rotation matrix readable.
    const c = hueN.cos();
    const s = hueN.sin();

    // Row coefficients derived from YIQ rotation matrix:
    //   R' = R*(0.299 + 0.701c + 0.168s) + G*(0.587 − 0.587c + 0.330s) + B*(0.114 − 0.114c − 0.497s)
    //   G' = R*(0.299 − 0.299c − 0.328s) + G*(0.587 + 0.413c + 0.035s) + B*(0.114 − 0.114c + 0.292s)
    //   B' = R*(0.299 − 0.300c + 1.250s) + G*(0.587 − 0.588c − 1.050s) + B*(0.114 + 0.886c − 0.203s)
    const rC = satApplied.r.mul(float(0.299).add(c.mul(0.701)).add(s.mul(0.168)));
    const rG = satApplied.g.mul(float(0.587).sub(c.mul(0.587)).add(s.mul(0.330)));
    const rB = satApplied.b.mul(float(0.114).sub(c.mul(0.114)).sub(s.mul(0.497)));
    const r = rC.add(rG).add(rB);

    const gC = satApplied.r.mul(float(0.299).sub(c.mul(0.299)).sub(s.mul(0.328)));
    const gG = satApplied.g.mul(float(0.587).add(c.mul(0.413)).add(s.mul(0.035)));
    const gB = satApplied.b.mul(float(0.114).sub(c.mul(0.114)).add(s.mul(0.292)));
    const g = gC.add(gG).add(gB);

    const bC = satApplied.r.mul(float(0.299).sub(c.mul(0.300)).add(s.mul(1.250)));
    const bG = satApplied.g.mul(float(0.587).sub(c.mul(0.588)).sub(s.mul(1.050)));
    const bB = satApplied.b.mul(float(0.114).add(c.mul(0.886)).sub(s.mul(0.203)));
    const b = bC.add(bG).add(bB);

    const rotated = vec3(r, g, b).clamp(0, 1);
    return vec4(rotated, input.a);
  })() as unknown as ColorNode;
}

// ────────────────────────────────────────────────────────────────
// BRIGHTNESS / CONTRAST
// ────────────────────────────────────────────────────────────────

/** Apply linear brightness offset + contrast scaling.
 *  @param input      Color node from prior stage.
 *  @param brightness Additive offset (-1..1).
 *  @param contrast   Multiplicative scale around 0.5 midpoint (-1..1).
 */
export function brightnessContrast(
  input: ColorNode,
  brightness: FloatArg = 0,
  contrast: FloatArg = 0,
): ColorNode {
  const bN = f(brightness);
  const cN = f(contrast);

  return Fn(() => {
    // Brightness shift
    const bright = input.rgb.add(vec3(bN));
    // Contrast: pull toward/away from 0.5 midpoint
    const contrasted = bright.sub(vec3(0.5)).mul(float(1).add(cN)).add(vec3(0.5));
    return vec4(contrasted.clamp(0, 1), input.a);
  })() as unknown as ColorNode;
}

// ────────────────────────────────────────────────────────────────
// BARREL DISTORTION (Sub 3c)
// ────────────────────────────────────────────────────────────────

/** Apply a barrel lens distortion. Matches the GLSL implementation in
 *  `src/components/3d/BarrelDistortion.tsx`:
 *    centered = uv - 0.5
 *    dist = dot(centered, centered)
 *    uv' = uv + centered * dist * strength
 *  Then sample the input texture at uv'.
 *
 *  @param textureNode Input scene texture (from pass().getTextureNode()).
 *  @param strength Distortion strength — Decision CPA-10: 0.02 default.
 */
export function barrelDistortion(
  textureNode: { sample: (uv: Node<'vec2'>) => ColorNode },
  strength: FloatArg = 0.02,
): ColorNode {
  const strengthN = f(strength);
  return Fn(() => {
    const centered = uv().sub(vec2(0.5, 0.5));
    const distSq = dot(centered, centered);
    const displaced = uv().add(centered.mul(distSq).mul(strengthN));
    return textureNode.sample(displaced as unknown as Node<'vec2'>);
  })() as unknown as ColorNode;
}

// Re-exports for convenience — callers can pull from this module alone
export { Fn, float, vec2, vec3, vec4, uv, min, max, mix, dot, sub, abs, mul, add };
