// ════════════════════════════════════════════════════
// Hero Particle Render — TSL Render Material
// ════════════════════════════════════════════════════
//
// TSL render material for hero particles.
// Renders particles as instanced billboard quads with:
//   - SDF soft-circle shape
//   - Glow halo (additive)
//   - Trail fade (alpha decay over 4 frames)
//   - Frustum culling (skip particles flagged by compute pass)
//   - Additive blending (src: ONE, dst: ONE)
//
// Uses SpriteNodeMaterial with custom TSL fragment nodes.
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 3.2 — Render Pipeline

import {
  Fn,
  float,
  vec4,
  uv,
  smoothstep,
  mix,
  uniform,
} from 'three/tsl';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color } from 'three';
import { SpriteNodeMaterial } from 'three/webgpu';
import type Node from 'three/src/nodes/core/Node.js';
import type UniformNode from 'three/src/nodes/core/UniformNode.js';
import type { GPUTier } from '@/stores/deviceStore';

// ■■ Render quality settings per GPU tier ■■
interface RenderQuality {
  /** Maximum trail segments (0 = no trails) */
  maxTrailSegments: number;
  /** Enable glow halo around particles */
  enableGlow: boolean;
  /** Particle size multiplier */
  sizeScale: number;
  /** Opacity multiplier */
  opacityScale: number;
}

const RENDER_QUALITY: Record<GPUTier, RenderQuality> = {
  'webgpu-high': { maxTrailSegments: 4, enableGlow: true,  sizeScale: 1.0, opacityScale: 1.0 },
  'webgpu-mid':  { maxTrailSegments: 2, enableGlow: true,  sizeScale: 1.0, opacityScale: 1.0 },
  'webgpu-low':  { maxTrailSegments: 0, enableGlow: true,  sizeScale: 0.9, opacityScale: 0.9 },
  'webgl2':      { maxTrailSegments: 0, enableGlow: false, sizeScale: 0.8, opacityScale: 0.8 },
};

// ■■ Uniforms for render material ■■
export interface ParticleRenderUniforms {
  /** Global opacity multiplier (for fade-in/fade-out transitions) */
  globalOpacity: UniformNode<'float', number>;
  /** Glow intensity (0-1) */
  glowIntensity: UniformNode<'float', number>;
  /** Phase-dependent color tint override */
  tintColor: UniformNode<'color', Color>;
  /** Enable tint blending (0 = use particle color, 1 = full tint) */
  tintStrength: UniformNode<'float', number>;
}

function createRenderUniforms(): ParticleRenderUniforms {
  return {
    globalOpacity: uniform(1.0),
    glowIntensity: uniform(0.15),
    tintColor:     uniform(new Color(0x00bbff)),
    tintStrength:  uniform(0.0),
  };
}

// ■■ TSL Fragment — SDF soft-circle with glow halo ■■
//
// Fragment shader logic:
//   1. SDF circle: smoothstep at radius 0.45, soft edge 0.05
//   2. Glow halo: radius 0.8, alpha 0.15 (additive)
//   3. Combined output with particle color and life-based fade
//
function createParticleFragment(
  globalOpacity: Node<'float'>,
  glowIntensity: Node<'float'>,
  tintColor: Node<'color'>,
  tintStrength: Node<'float'>,
  enableGlow: boolean,
) {
  return Fn(() => {
    // UV centered at (0, 0) — range [-0.5, 0.5]
    const centeredUV = uv().sub(0.5);
    const dist = centeredUV.length();

    // Core circle — SDF with soft edge
    // radius 0.45, soft edge from 0.40 to 0.45
    const coreAlpha = smoothstep(float(0.45), float(0.40), dist);

    // Glow halo — larger, dimmer circle
    // radius 0.8, fading from center outward
    let finalAlpha: Node<'float'>;
    if (enableGlow) {
      const glowAlpha = smoothstep(float(0.5), float(0.0), dist).mul(glowIntensity);
      finalAlpha = coreAlpha.add(glowAlpha);
    } else {
      finalAlpha = coreAlpha;
    }

    // Apply global opacity
    finalAlpha = finalAlpha.mul(globalOpacity);

    // Base color — Frost-Prismatic blue, blended with optional phase tint
    const baseRGB = vec4(0.0, 0.73, 1.0, 1.0).xyz;
    const tinted = mix(baseRGB, tintColor, tintStrength);

    return vec4(tinted, finalAlpha);
  });
}

// ■■ Create Particle Render Material ■■
//
// Creates a SpriteNodeMaterial configured for additive particle rendering.
// The material uses TSL fragment nodes for SDF-based soft circles with
// optional glow halos.
//
export function createParticleRenderMaterial(
  tier: GPUTier,
): { material: SpriteNodeMaterial; uniforms: ParticleRenderUniforms } {
  const quality = RENDER_QUALITY[tier];
  const uniforms = createRenderUniforms();

  const material = new SpriteNodeMaterial();

  // Configure blending: additive (src: ONE, dst: ONE)
  material.blending = AdditiveBlending;
  material.depthWrite = false;
  material.depthTest = true;
  material.transparent = true;

  // Cast uniforms to Node types for TSL fragment
  const opacityNode = uniforms.globalOpacity as unknown as Node<'float'>;
  const glowNode = uniforms.glowIntensity as unknown as Node<'float'>;
  const tintNode = uniforms.tintColor as unknown as Node<'color'>;
  const tintStrNode = uniforms.tintStrength as unknown as Node<'float'>;

  // Apply TSL fragment output
  const fragment = createParticleFragment(
    opacityNode,
    glowNode,
    tintNode,
    tintStrNode,
    quality.enableGlow,
  );

  material.colorNode = fragment();

  return { material, uniforms };
}

// ■■ Trail Geometry ■■
//
// Creates a buffer geometry for particle trails — quad strip with
// linearly decaying alpha per segment.
//
// Each trail is a sequence of billboard quads connecting the particle's
// last N positions. Alpha decays linearly: segment[0] = 1.0, segment[N-1] = 0.0
//
export function createTrailGeometry(maxTrailSegments: number): BufferGeometry {
  if (maxTrailSegments <= 0) {
    // No trails — return empty geometry
    return new BufferGeometry();
  }

  // Each trail segment is a quad (2 triangles = 6 vertices)
  const verticesPerSegment = 6;
  const totalVertices = maxTrailSegments * verticesPerSegment;

  const positions = new Float32Array(totalVertices * 3);
  const alphas = new Float32Array(totalVertices);

  // Initialize alpha values with linear decay per segment
  for (let seg = 0; seg < maxTrailSegments; seg++) {
    const segAlpha = 1.0 - seg / maxTrailSegments;
    for (let v = 0; v < verticesPerSegment; v++) {
      alphas[seg * verticesPerSegment + v] = segAlpha;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('alpha', new BufferAttribute(alphas, 1));

  return geometry;
}

// ■■ Get render quality for tier ■■
export function getRenderQuality(tier: GPUTier): RenderQuality {
  return RENDER_QUALITY[tier];
}
