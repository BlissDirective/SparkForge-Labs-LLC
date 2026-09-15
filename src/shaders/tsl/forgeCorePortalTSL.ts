// ================================================================
// TSL — Forge Hub CorePortal (W1-02)
// ================================================================
// Emissive disc + upward beam cone. Driven by portalPhase uniforms.
// The lock plate already paints the SF monogram — this shader is glow
// only (no second glyph). TSL compiles to WGSL (WebGPU) and GLSL.
//
// Used only on the WebGPU renderer path. WebGL2 uses a standard
// emissive fallback in CorePortal.tsx.

import { AdditiveBlending, Color, DoubleSide } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn,
  abs,
  clamp,
  float,
  length,
  mix,
  oneMinus,
  pow,
  smoothstep,
  sub,
  uv,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';

type UniformNode = ReturnType<typeof uniform>;

export interface CorePortalUniforms {
  uIntensity: UniformNode;
  uPulse: UniformNode;
}

function attachAdditive(material: MeshBasicNodeMaterial, name: string) {
  material.transparent = true;
  material.depthWrite = false;
  material.blending = AdditiveBlending;
  material.toneMapped = false;
  material.name = name;
}

/** Radial cyan disc — idle pulse, charge brighten, emit peak. */
export function createCoreGlowMaterial(
  initialIntensity = 0.22,
): { material: MeshBasicNodeMaterial; uniforms: CorePortalUniforms } {
  const material = new MeshBasicNodeMaterial();
  attachAdditive(material, 'ForgeHub.CoreGlow');

  const uIntensity = uniform(initialIntensity);
  const uPulse = uniform(1);
  const uColor = uniform(new Color('#7fe7ff'));

  const colorNode = Fn(() => {
    const centered = uv().sub(vec3(0.5, 0.5, 0)).mul(2.0);
    const r = length(centered);
    const disc = pow(oneMinus(smoothstep(float(0.0), float(1.0), r)), float(1.8));
    const hot = oneMinus(smoothstep(float(0.0), float(0.22), r)).mul(0.55);
    const ring = oneMinus(
      clamp(abs(sub(r, float(0.72))).mul(8.0), float(0.0), float(1.0)),
    ).mul(0.35);
    const total = disc.add(hot).add(ring).mul(uIntensity).mul(uPulse);
    const tinted = mix(uColor, vec3(1.0, 1.0, 1.0), hot.mul(0.4));
    return vec4(tinted.mul(total), total);
  });

  material.colorNode = colorNode();
  return { material, uniforms: { uIntensity, uPulse } };
}

/** Upward beam from the core. Alpha is 0 while idle/charge. */
export function createBeamConeMaterial(
  initialIntensity = 0,
): { material: MeshBasicNodeMaterial; uniforms: CorePortalUniforms } {
  const material = new MeshBasicNodeMaterial();
  attachAdditive(material, 'ForgeHub.BeamCone');
  material.side = DoubleSide;

  const uIntensity = uniform(initialIntensity);
  const uPulse = uniform(1);
  const uColor = uniform(new Color('#4de9ff'));

  const colorNode = Fn(() => {
    const uvCoord = uv();
    const along = uvCoord.y;
    const across = oneMinus(abs(uvCoord.x.sub(0.5)).mul(2.0));
    const shaft = pow(across, float(1.6)).mul(
      oneMinus(smoothstep(float(0.05), float(1.0), along)),
    );
    const coreLine = pow(across, float(6.0)).mul(0.45);
    const total = shaft.add(coreLine).mul(uIntensity).mul(uPulse);
    const tinted = mix(uColor, vec3(0.85, 1.0, 1.0), coreLine);
    return vec4(tinted.mul(total), total);
  });

  material.colorNode = colorNode();
  return { material, uniforms: { uIntensity, uPulse } };
}
