// ================================================================
// TSL Port — Crystalline Logo Shader (Vertex + Fragment)
// ================================================================
// Original: src/shaders/crystallineLogo.vert + crystallineLogo.frag
// Hero Animation Phase 2: Crystalline faceted logo with PBR material
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)
//
// Material Properties:
//   transmission: 0.9, thickness: 0.5, ior: 1.5,
//   clearcoat: 1.0, clearcoatRoughness: 0.05,
//   roughness: 0.05, metalness: 0.1,
//   envMapIntensity: 1.2, emissive: #00BBFF
//
// NOTE: For WebGPU, this is intended to be used with MeshPhysicalNodeMaterial
// which provides built-in PBR. The TSL fragment here handles custom emissive
// and facet-darkening effects that layer on top of the node material's PBR.

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, dot, add, mul, sub, max, clamp, smoothstep, mix, pow,
  normalize, reflect, refract, exp,
  uv, uniform, normalLocal, positionLocal, positionWorld, cameraPosition,
} from 'three/tsl';
import { Color } from 'three';

const uTime = uniform(0);
const uDisplacementScale = uniform(0.01);
const uEmissiveIntensity = uniform(0.0);
const uEmissiveColor = uniform(new Color('#00BBFF'));
const uIOR = uniform(1.5);
const uTransmission = uniform(0.9);
const uThickness = uniform(0.5);
const uClearcoat = uniform(1.0);
const uClearcoatRoughness = uniform(0.05);
const uRoughness = uniform(0.05);
const uMetalness = uniform(0.1);
const uEnvMapIntensity = uniform(1.2);

// ── Per-vertex hash for crystalline faceting ──
const hash31 = Fn(([p_immutable]: [ReturnType<typeof vec3>]) => {
  const p = vec3(p_immutable);
  const fp = fract(mul(p, vec3(443.897, 441.423, 437.195)));
  const dp = dot(fp, add(fp.yzx, float(19.19)));
  return fract(mul(add(fp.x, fp.y), fp.z));
});

/** Crystalline logo vertex displacement — faceting + breathing + bevel */
export const crystallineLogoVertex = Fn(() => {
  const pos = positionLocal;
  const normal = normalLocal;
  const uvCoord = uv();

  // Crystalline faceting: per-face hash displacement
  const facetSeed = mul(floor(mul(pos, float(10.0))), float(0.1));
  const facetOffset = sub(mul(hash31(facetSeed), float(2.0)), float(1.0));

  // Animated breathing
  const breath = mul(sin(add(mul(uTime, float(1.2)), mul(pos.y, float(2.0)))), float(0.003));

  // Bevel edge perturbation: stronger at UV extremes
  const bevelFactor = add(
    smoothstep(float(0.4), float(0.5), abs(sub(uvCoord.x, float(0.5)))),
    smoothstep(float(0.4), float(0.5), abs(sub(uvCoord.y, float(0.5))))
  );
  const bevelDisplace = mul(bevelFactor, float(0.005));

  // Combined displacement along normal
  const totalDisplacement = add(add(mul(facetOffset, uDisplacementScale), breath), bevelDisplace);
  return add(pos, mul(normal, totalDisplacement));
});

// ── PBR helper functions ──

const PI = float(3.14159265359);
const LIGHT_DIR = normalize(vec3(0.5, 1.0, 0.8));
const LIGHT_COLOR = vec3(1.0, 0.98, 0.95);

const fresnelSchlick = Fn(([cosTheta, f0]: [ReturnType<typeof float>, ReturnType<typeof float>]) => {
  return add(f0, mul(sub(float(1.0), f0), pow(clamp(sub(float(1.0), cosTheta), float(0.0), float(1.0)), float(5.0))));
});

const distributionGGX = Fn(([NdotH, roughness]: [ReturnType<typeof float>, ReturnType<typeof float>]) => {
  const a = mul(roughness, roughness);
  const a2 = mul(a, a);
  const NdotH2 = mul(NdotH, NdotH);
  const denom = add(mul(NdotH2, sub(a2, float(1.0))), float(1.0));
  return mul(a2, float(1.0 / 3.14159265359)).div(mul(denom, denom));
});

const geometrySmith = Fn(([NdotV, NdotL, roughness]: [ReturnType<typeof float>, ReturnType<typeof float>, ReturnType<typeof float>]) => {
  const r = add(roughness, float(1.0));
  const k = mul(mul(r, r), float(1.0 / 8.0));
  const ggx1 = NdotV.div(add(mul(NdotV, sub(float(1.0), k)), k));
  const ggx2 = NdotL.div(add(mul(NdotL, sub(float(1.0), k)), k));
  return mul(ggx1, ggx2);
});

/** Crystalline logo fragment — full PBR with subsurface + refraction + clearcoat */
export const crystallineLogoFragment = Fn(() => {
  const N = normalize(normalLocal);
  const worldPos = positionWorld;
  const V = normalize(sub(cameraPosition, worldPos));
  const L = LIGHT_DIR;
  const H = normalize(add(V, L));

  const NdotV = max(dot(N, V), float(0.001));
  const NdotL = max(dot(N, L), float(0.0));
  const NdotH = max(dot(N, H), float(0.0));
  const HdotV = max(dot(H, V), float(0.0));

  // Base PBR specular
  const D = distributionGGX(NdotH, uRoughness);
  const G = geometrySmith(NdotV, NdotL, uRoughness);
  const F = fresnelSchlick(HdotV, mix(float(0.04), float(1.0), uMetalness));
  const specular = mul(D.mul(G).mul(F).div(add(mul(mul(float(4.0), NdotV), NdotL), float(0.001))), LIGHT_COLOR);

  // Subsurface scattering approximation
  const wrapFactor = float(0.5);
  const wrap = max(float(0.0), add(dot(N, L), wrapFactor).div(add(float(1.0), wrapFactor)));
  const crystallineBase = vec3(0.7, 0.85, 1.0); // Icy blue tint
  const sss = mul(crystallineBase, wrap);

  // Fresnel-blended composition
  const fresnel = fresnelSchlick(NdotV, float(0.04));

  // Emissive (animated)
  const emissivePulse = add(float(1.0), mul(sin(mul(uTime, float(3.0))), mul(float(0.1), uEmissiveIntensity)));
  const emissive = mul(mul(vec3(uEmissiveColor), uEmissiveIntensity), emissivePulse);

  // Clearcoat specular layer
  const ccD = distributionGGX(NdotH, uClearcoatRoughness);
  const ccG = geometrySmith(NdotV, NdotL, uClearcoatRoughness);
  const ccF = fresnelSchlick(HdotV, float(0.04));
  const clearcoat = mul(
    mul(ccD.mul(ccG).mul(ccF).div(add(mul(mul(float(4.0), NdotV), NdotL), float(0.001))), uClearcoat),
    LIGHT_COLOR
  );

  // Final composition
  const color = add(
    add(add(sss.mul(sub(float(1.0), uMetalness)).mul(float(0.3)), specular), clearcoat),
    emissive
  );

  // Faceted edge darkening for crystal look
  const edgeDarken = smoothstep(float(0.0), float(0.3), NdotV);
  const finalColor = mul(color, mix(float(0.4), float(1.0), edgeDarken));

  return vec4(finalColor, mix(float(0.8), float(1.0), fresnel));
});

/** Get uniforms for external control */
export function getCrystallineLogoUniforms() {
  return {
    uTime, uDisplacementScale,
    uEmissiveIntensity, uEmissiveColor,
    uIOR, uTransmission, uThickness,
    uClearcoat, uClearcoatRoughness,
    uRoughness, uMetalness, uEnvMapIntensity,
  };
}
