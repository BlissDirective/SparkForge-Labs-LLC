'use client';

// ================================================================
// CPA v1.0 — BarrelDistortion: Custom Postprocessing Effect
// ================================================================
// Decision CPA-10: 0.02 strength (dashboard), 0.0 (game mode)
// Very low strength to hint at fisheye without distorting UI readability.
// Disabled in game mode for crisp game content.
// Disabled when prefers-reduced-motion is active.

import { forwardRef, useMemo } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const barrelDistortionShader = `
  uniform float strength;

  void mainUv(inout vec2 uv) {
    vec2 centered = uv - 0.5;
    float dist = dot(centered, centered);
    uv = uv + centered * dist * strength;
  }
`;

class BarrelDistortionEffect extends Effect {
  constructor({ strength = 0.02 } = {}) {
    super('BarrelDistortion', barrelDistortionShader, {
      uniforms: new Map([['strength', new Uniform(strength)]]),
    });
  }

  set strength(value: number) {
    const uniform = this.uniforms.get('strength');
    if (uniform) uniform.value = value;
  }

  get strength(): number {
    const uniform = this.uniforms.get('strength');
    return uniform ? (uniform.value as number) : 0;
  }
}

interface BarrelDistortionProps {
  strength?: number;
}

export const BarrelDistortion = forwardRef<BarrelDistortionEffect, BarrelDistortionProps>(
  function BarrelDistortion({ strength = 0.02 }, ref) {
    const effect = useMemo(() => new BarrelDistortionEffect({ strength }), [strength]);

    // Update strength when prop changes
    effect.strength = strength;

    // Forward ref for @react-three/postprocessing integration
    if (typeof ref === 'function') {
      ref(effect);
    } else if (ref) {
      ref.current = effect;
    }

    return null;
  }
);
