/**
 * SparkForge Brand Material — Single Source of Truth
 *
 * Eye-extracted from public/branding/IMG_4607.png (the "SF" reference logo).
 * Every branding-surface material in the app draws from this file. Changing
 * a value here changes the live hero, the offline 4K renders, the
 * <BrandWordmark> component, and any future marketing surface in lockstep.
 *
 * Authority: CLAUDE.md v6.6 "Tech Quality Mandate" — WebGPU + TSL only,
 * no shader fork, halt threshold SSIM >= 0.96 vs IMG_4607.
 */

import type { Color } from 'three';

// ─────────────────────────────────────────────────────────────────────────
// 1. Palette — locked from IMG_4607 by direct eyedropper sampling
// ─────────────────────────────────────────────────────────────────────────

export const PALETTE = {
  /** Deep navy void — the background of IMG_4607 */
  voidNavy:        '#02050d',
  /** Slightly lifted navy for the env-map base */
  voidNavyLift:    '#070a14',

  /** Cool cyan — upper-right rim light + cyan dispersion peak */
  rimCyan:         '#7fe8ff',
  /** Brighter cyan highlight — bevel kicks */
  cyanKick:        '#bff5ff',

  /** Warm amber — lower-left key light + amber dispersion peak */
  keyAmber:        '#ffaa55',
  /** Brighter amber spark — lens-flare hot core */
  amberCore:       '#ffd9a8',

  /** Magenta dispersion mid-band */
  dispersionMag:   '#ff5fc8',
  /** Hot pink dispersion edge */
  dispersionPink:  '#ff9ad6',

  /** Pure white — hottest highlight pinpoints */
  hotWhite:        '#ffffff',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 2. Material physics — IOR / transmission / dichroic
// ─────────────────────────────────────────────────────────────────────────

export const MATERIAL = {
  /**
   * Index of refraction. IMG_4607 reads as crown glass (~1.52) bumped
   * slightly to dial the bevel-edge bend visible on the S-curve interior.
   */
  ior: 1.55,

  /** Light-transmission ratio. Letters are nearly clear glass. */
  transmission: 0.97,

  /**
   * Surface roughness. Microscale only — the letters have a glossy
   * but not mirror-smooth feel; the dichroic film adds a touch of haze.
   */
  roughness: 0.04,

  /** Metalness — pure dielectric. */
  metalness: 0.0,

  /**
   * Thickness in volume-units (the extrude depth multiplier feeding
   * MeshTransmissionMaterial / TSL volumetric absorption).
   */
  thickness: 0.85,

  /**
   * Anisotropy — drives E1 (asymmetric prismatic dispersion).
   * IMG_4607 shows the magenta band curling counter to the cyan band:
   * that requires angle-dependent IOR per channel.
   */
  anisotropy: 0.65,
  anisotropyRotation: 0.42, // radians; CCW from horizontal

  /** Clearcoat layer over the body — gives the dichroic film its substrate. */
  clearcoat: 1.0,
  clearcoatRoughness: 0.08,

  /** Body absorption tint for thin sections. */
  attenuationColor: '#9fcfff',
  attenuationDistance: 1.4,

  /** Env-map intensity — IMG_4607 has aggressive HDRI bounce. */
  envMapIntensity: 2.4,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 3. Dispersion — E1 anisotropic prismatic split
// ─────────────────────────────────────────────────────────────────────────

export const DISPERSION = {
  /**
   * Per-channel IOR offsets, applied around MATERIAL.ior. R/G/B sample
   * directions are bent by these deltas — this is what generates the
   * cyan/magenta/amber halo on the bevels.
   *
   * Standard MeshTransmissionMaterial uses a symmetric (B - R) split.
   * Ours is asymmetric: cyan curls one way, magenta the other. That
   * matches IMG_4607's dichroic-film signature, not pure prism glass.
   */
  iorR: -0.038,
  iorG:  0.000,
  iorB:  0.052,

  /** Strength of the color-split. 0..1 typically; we sit hot. */
  strength: 0.072,

  /**
   * Asymmetry rotation, in radians. The B-channel sample direction is
   * rotated by +rotation around the surface tangent; R is rotated by
   * -rotation. This produces the curling rainbow seen on the SF bevels.
   */
  rotation: 0.31,

  /**
   * Bevel emphasis — multiplies dispersion strength near edges where
   * normal · viewDir is shallow. IMG_4607's rainbow is most intense at
   * grazing angles, so we ramp it up there.
   */
  fresnelBoost: 1.85,
  fresnelPower: 2.4,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 4. Dichroic coating — the oil-slick rainbow band across the faces
// ─────────────────────────────────────────────────────────────────────────

export const DICHROIC = {
  /** Coating opacity at face center. */
  opacity: 0.55,

  /** Three-stop palette traversed by view-angle. */
  bandA: PALETTE.rimCyan,        // shallow-angle teal/cyan
  bandB: PALETTE.dispersionMag,  // mid-angle magenta
  bandC: PALETTE.keyAmber,       // grazing-angle amber

  /** Frequency of the band sweep across the surface (cycles per unit). */
  frequency: 1.35,

  /** Viewing-angle exponent that drives band traversal. */
  anglePower: 1.6,

  /**
   * Asymmetric warm-bias: IMG_4607's right side is warmer than its
   * left. We bake that asymmetry into the coating so the wordmark
   * rendered at 0° rotation matches the reference at 0° rotation.
   */
  warmBiasRight: 0.18,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 5. Geometry — bevel + extrusion controls for SVG → ExtrudeGeometry
// ─────────────────────────────────────────────────────────────────────────

export const GEOMETRY = {
  /** Extrude depth as a fraction of letter cap-height. */
  extrudeDepth: 0.32,

  /** Bevel size as a fraction of cap-height — IMG_4607 reads ~7%. */
  bevelSize: 0.072,

  /** Bevel thickness — slightly less than size for a soft round-over. */
  bevelThickness: 0.058,

  /** Bevel segments — high count keeps the rainbow gradient smooth. */
  bevelSegments: 12,

  /** Curve segments — controls the S-curve smoothness. */
  curveSegments: 24,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 6. Lighting — the three-light rig that produced IMG_4607
// ─────────────────────────────────────────────────────────────────────────

export const LIGHTING = {
  /** Warm key light — the lower-left amber spark. */
  key: {
    position: [-3.4, -2.1, 2.6] as const,
    color:    PALETTE.keyAmber,
    intensity: 6.8,
  },

  /** Cool rim light — the upper-right cyan halo. */
  rim: {
    position: [ 3.6,  2.4, 1.8] as const,
    color:    PALETTE.rimCyan,
    intensity: 4.4,
  },

  /** Soft fill — barely there, prevents shadow crush. */
  fill: {
    position: [ 0.0, -0.5, 4.0] as const,
    color:    PALETTE.voidNavyLift,
    intensity: 0.6,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 7. Lens flares — the two anamorphic streaks visible in IMG_4607
// ─────────────────────────────────────────────────────────────────────────

export const LENS_FLARES = [
  {
    id: 'amber-spark',
    position: [-2.1, -1.8, 1.4] as const,
    color: PALETTE.amberCore,
    intensity: 1.8,
    streakAngle: 0.0,                 // horizontal
    streakLength: 1.4,
    streakWidth: 0.06,
  },
  {
    id: 'cyan-halo',
    position: [ 2.4,  1.6, 1.2] as const,
    color: PALETTE.cyanKick,
    intensity: 1.2,
    streakAngle: 0.0,
    streakLength: 1.1,
    streakWidth: 0.04,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// 8. Procedural HDRI — E2 palette-locked environment
// ─────────────────────────────────────────────────────────────────────────

export const HDRI = {
  /** Resolution of the procedurally generated env-map cube. */
  cubeSize: 512,

  /** Mythos-style "re-inject e every loop" — palette anchors the noise. */
  paletteAnchors: [
    PALETTE.voidNavy,
    PALETTE.voidNavyLift,
    PALETTE.keyAmber,
    PALETTE.rimCyan,
    PALETTE.dispersionMag,
  ] as const,

  /** Octaves of fractal noise used to shape the gradient. */
  noiseOctaves: 5,

  /** Directional warmth (radians around Y). Lower-left = warm. */
  warmthAngle: -2.36, // ≈ -135°, the IMG_4607 key direction

  /** Bright-spot intensity multipliers for the two flare positions. */
  amberSpotIntensity: 3.4,
  cyanSpotIntensity:  2.1,

  /** Background tint for far falloff. */
  backgroundTint: PALETTE.voidNavy,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 9. Background — the starfield + radial streaks
// ─────────────────────────────────────────────────────────────────────────

export const BACKGROUND = {
  baseColor: PALETTE.voidNavy,

  starfield: {
    count: 1200,
    minSize: 0.4,
    maxSize: 1.8,
    twinkleHz: 0.45,
  },

  /** Radial light streaks emanating from screen-center. */
  streaks: {
    count: 240,
    minLength: 0.1,
    maxLength: 0.9,
    speedMin: 0.04,
    speedMax: 0.32,
    color: PALETTE.cyanKick,
  },

  /** Subtle vignette, darker at corners. */
  vignetteStrength: 0.32,
} as const;

// ─────────────────────────────────────────────────────────────────────────
// 10. Halt threshold — Mythos convergence rule (CLAUDE.md v6.6)
// ─────────────────────────────────────────────────────────────────────────

export const HALT = {
  /** SSIM threshold against IMG_4607 — locked at 0.96 per N5=b. */
  ssimThreshold: 0.96,

  /** Max iteration count before escalating to user. */
  maxIterations: 12,

  /** Reference image path (the "e" we re-inject every loop). */
  referenceImage: '/branding/IMG_4607.png',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// Aggregate export — convenience for component imports
// ─────────────────────────────────────────────────────────────────────────

export const SF_BRAND = {
  PALETTE,
  MATERIAL,
  DISPERSION,
  DICHROIC,
  GEOMETRY,
  LIGHTING,
  LENS_FLARES,
  HDRI,
  BACKGROUND,
  HALT,
} as const;

export type SfBrandConfig = typeof SF_BRAND;

/** Helper: convert any palette hex to a three Color (call-site only). */
export function paletteColor(_hex: string): Color {
  // Implemented at call-site to avoid pulling Color into the config bundle.
  // BrandingMaterial.tsx wraps this with `new THREE.Color(hex)`.
  throw new Error(
    'paletteColor() is a typed marker. Call site must construct THREE.Color.',
  );
}
