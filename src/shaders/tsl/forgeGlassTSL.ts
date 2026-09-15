// ================================================================
// TSL — Forge Hub glass slab (W1-03)
// ================================================================
// Empty hologram material: thin cyan edge, faint frost fill so the
// lock plate shows through, scanline scroll. Breathe scale lives on
// the mesh transform; uBreathe only pulses emissive slightly.
// WebGPU path only. WebGL2 uses the additive fallback in
// ForgeGlassSlabs.tsx.

import { Color, DoubleSide } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn,
  add,
  float,
  mix,
  min,
  mul,
  oneMinus,
  sin,
  smoothstep,
  sub,
  uv,
  uniform,
  vec4,
} from 'three/tsl';

type UniformNode = ReturnType<typeof uniform>;

export interface GlassSlabUniforms {
  uTime: UniformNode;
  uBreathe: UniformNode;
  uFrozen: UniformNode;
}

export function createGlassSlabMaterial(): {
  material: MeshBasicNodeMaterial;
  uniforms: GlassSlabUniforms;
} {
  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  material.toneMapped = false;
  material.name = 'ForgeHub.GlassSlab';

  const uTime = uniform(0);
  const uBreathe = uniform(1);
  const uFrozen = uniform(0);
  const uEdge = uniform(new Color('#4de9ff'));
  const uFill = uniform(new Color('#060e1c'));

  const colorNode = Fn(() => {
    const uvCoord = uv();
    const edgeX = min(uvCoord.x, sub(float(1.0), uvCoord.x));
    const edgeY = min(uvCoord.y, sub(float(1.0), uvCoord.y));
    const edge = min(edgeX, edgeY);
    const rim = oneMinus(smoothstep(float(0.0), float(0.042), edge));
    const inner = smoothstep(float(0.0), float(0.09), edge);

    const t = mix(float(0.0), uTime, sub(float(1.0), uFrozen));
    const scanWave = sin(add(mul(uvCoord.y, float(72.0)), mul(t, float(1.6))));
    const scan = mul(mul(add(scanWave, float(1.0)), float(0.5)), float(0.055));

    const fillA = float(0.07);
    const rimA = float(0.74);
    const alpha = add(
      mul(fillA, inner),
      add(mul(rim, rimA), mul(scan, inner)),
    );
    const tinted = mix(uFill, uEdge, add(rim, mul(scan, float(1.4))));
    const pulse = mix(float(1.0), uBreathe, float(0.22));
    return vec4(mul(tinted, pulse), mul(alpha, pulse));
  });

  material.colorNode = colorNode();
  return { material, uniforms: { uTime, uBreathe, uFrozen } };
}
