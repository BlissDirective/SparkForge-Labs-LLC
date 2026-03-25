// ================================================================
// TSL Port — Liquid Metal Shader (Vertex + Fragment)
// ================================================================
// Original: src/shaders/liquidMetal.glsl
// Decision 4.2: Epic (0.5x) + Legendary (1.0x + mouse ripple)
// Applied to: BadgeLevitate3D meshes in Trophy Room
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow,
  normalize, reflect, exp, distance,
  uv, uniform, normalLocal, positionLocal, positionViewDirection,
} from 'three/tsl';
import { Color, Vector2 } from 'three';
import { simplex3DTSL } from './noiseUtils';

const uTime = uniform(0);
const uIntensity = uniform(1.0);       // 0.5 for Epic, 1.0 for Legendary
const uRippleCenter = uniform(new Vector2(0.5, 0.5));
const uRippleStrength = uniform(0.0);  // 0.0 = no ripple, 1.0 = full
const uColor = uniform(new Color('#AA66FF'));

/** Liquid metal vertex displacement — 3 octaves of noise + mouse ripple */
export const liquidMetalVertex = Fn(() => {
  const pos = positionLocal;
  const normal = normalLocal;
  const uvCoord = uv();

  // Base undulation: 3 octaves of simplex noise
  const noise1 = mul(simplex3DTSL(vec3(mul(pos.x, float(1.5)), mul(pos.y, float(1.5)), mul(uTime, float(0.3)))), float(0.5));
  const noise2 = mul(simplex3DTSL(vec3(mul(pos.x, float(3.0)), mul(pos.y, float(3.0)), mul(uTime, float(0.5)))), float(0.25));
  const noise3 = mul(simplex3DTSL(vec3(mul(pos.x, float(6.0)), mul(pos.y, float(6.0)), mul(uTime, float(0.8)))), float(0.125));
  const totalNoise = mul(add(add(noise1, noise2), noise3), uIntensity);

  // Mouse ripple (Legendary only)
  const distToMouse = distance(uvCoord, vec2(uRippleCenter.x, uRippleCenter.y));
  const ripple = mul(
    mul(sin(sub(mul(distToMouse, float(20.0)), mul(uTime, float(8.0)))), exp(mul(distToMouse, float(-4.0)))),
    mul(uRippleStrength, float(0.15))
  );

  // Combined displacement along normal
  const displacement = add(mul(totalNoise, float(0.08)), ripple);
  return add(pos, mul(normal, displacement));
});

/** Liquid metal fragment — metallic BRDF + animated noise + fresnel */
export const liquidMetalFragment = Fn(() => {
  const uvCoord = uv();
  const normal = normalize(normalLocal);
  const viewDir = normalize(positionViewDirection.negate());

  // Fresnel effect — stronger reflection at glancing angles
  const fresnel = mix(float(0.2), float(1.0), pow(sub(float(1.0), max(dot(normal, viewDir), float(0.0))), float(3.0)));

  // Base metallic color with animated flow
  const flow = add(mul(simplex3DTSL(vec3(mul(uvCoord.x, float(4.0)), mul(uvCoord.y, float(4.0)), mul(uTime, float(0.4)))), float(0.5)), float(0.5));
  const baseColor = mix(mul(vec3(uColor), float(0.6)), mul(vec3(uColor), float(1.4)), flow);

  // Specular highlight (Blinn-Phong)
  const lightDir = normalize(vec3(0.5, 1.0, 0.8));
  const halfDir = normalize(add(lightDir, viewDir));
  const spec = pow(max(dot(normal, halfDir), float(0.0)), float(64.0));
  const specColor = mul(vec3(1.0, 0.95, 0.9), mul(spec, float(1.5)));

  // Environment reflection approximation
  const reflectDir = reflect(viewDir.negate(), normal);
  const envReflect = add(
    mul(simplex3DTSL(add(mul(reflectDir, float(2.0)), mul(uTime, float(0.2)))), float(0.5)),
    float(0.5)
  );
  const envColor = mix(vec3(0.1, 0.15, 0.3), vec3(0.4, 0.5, 0.7), envReflect);

  // Combine: base metal + fresnel reflection + specular
  const combined = add(mix(baseColor, envColor, mul(fresnel, float(0.6))), specColor);

  // Edge glow based on intensity
  const finalColor = add(combined, mul(mul(vec3(uColor), fresnel), mul(float(0.3), uIntensity)));

  return vec4(finalColor, float(1.0));
});

/** Get uniforms for external control */
export function getLiquidMetalUniforms() {
  return { uTime, uIntensity, uRippleCenter, uRippleStrength, uColor };
}
