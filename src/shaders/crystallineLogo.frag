// ================================================================
// Crystalline Logo — Fragment Shader (WebGL2 fallback)
// ================================================================
// Subsurface scattering approximation (Burley diffuse + wrap lighting),
// IOR-based refraction, clearcoat specular, environment map sampling.
//
// In WebGPU mode, this is replaced by TSL MeshPhysicalNodeMaterial with
// transmission, clearcoat, and custom emissive nodes.
//
// Material Properties (from spec Section 4, Phase 2):
//   transmission: 0.9, thickness: 0.5, ior: 1.5,
//   clearcoat: 1.0, clearcoatRoughness: 0.05,
//   roughness: 0.05, metalness: 0.1,
//   envMapIntensity: 1.2, emissive: #00BBFF
//
// Spec: SparkForge_Hero_Page_Animation_v2.0.md Section 4, Phase 2

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uEmissiveIntensity;  // 0.0 -> 0.5 (Phase 3) -> 3.0 (Phase 4)
uniform vec3 uEmissiveColor;       // Default: #00BBFF (Frost-Prismatic blue)
uniform float uIOR;                // Default: 1.5
uniform float uTransmission;       // Default: 0.9
uniform float uThickness;          // Default: 0.5
uniform float uClearcoat;          // Default: 1.0
uniform float uClearcoatRoughness; // Default: 0.05
uniform float uRoughness;          // Default: 0.05
uniform float uMetalness;          // Default: 0.1
uniform float uEnvMapIntensity;    // Default: 1.2
uniform samplerCube uEnvMap;       // frost-prismatic.hdr environment

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// ■■ Constants ■■
const float PI = 3.14159265359;
const vec3 LIGHT_DIR = normalize(vec3(0.5, 1.0, 0.8));
const vec3 LIGHT_COLOR = vec3(1.0, 0.98, 0.95);

// ■■ Fresnel — Schlick approximation ■■
float fresnelSchlick(float cosTheta, float f0) {
  return f0 + (1.0 - f0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ■■ GGX Distribution ■■
float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  float denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / (PI * denom * denom);
}

// ■■ Geometry Smith ■■
float geometrySmith(float NdotV, float NdotL, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  float ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  float ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

// ■■ Subsurface Scattering Approximation (Burley diffuse + wrap) ■■
vec3 subsurfaceScatter(vec3 N, vec3 L, vec3 V, vec3 baseColor, float thickness) {
  // Wrap lighting: extends diffuse beyond the terminator
  float wrapFactor = 0.5;
  float NdotL = dot(N, L);
  float wrap = max(0.0, (NdotL + wrapFactor) / (1.0 + wrapFactor));

  // View-dependent subsurface (light transmitting through thin geometry)
  vec3 H = normalize(L + N * 0.3); // Bias normal toward light
  float VdotH = pow(clamp(dot(V, -H), 0.0, 1.0), 2.0);
  float backScatter = VdotH * thickness;

  // Combine wrapped diffuse + back-scatter
  vec3 sss = baseColor * (wrap + backScatter * 0.5);
  return sss;
}

// ■■ IOR Refraction ■■
vec3 refractedEnvSample(vec3 V, vec3 N, float ior, float transmission) {
  float eta = 1.0 / ior;
  vec3 refracted = refract(-V, N, eta);

  // Sample environment map along refracted direction
  vec3 envColor = textureCube(uEnvMap, refracted).rgb;

  // Attenuate by transmission and thickness
  float attenuation = exp(-uThickness * 0.5);
  return envColor * transmission * attenuation;
}

// ■■ Clearcoat Specular ■■
vec3 clearcoatSpecular(vec3 N, vec3 V, vec3 L, float clearcoat, float clearcoatRough) {
  vec3 H = normalize(V + L);
  float NdotH = max(dot(N, H), 0.0);
  float NdotV = max(dot(N, V), 0.001);
  float NdotL = max(dot(N, L), 0.0);

  // Clearcoat uses its own roughness (very smooth)
  float D = distributionGGX(N, H, clearcoatRough);
  float G = geometrySmith(NdotV, NdotL, clearcoatRough);
  float F = fresnelSchlick(max(dot(H, V), 0.0), 0.04);

  vec3 spec = vec3(D * G * F / (4.0 * NdotV * NdotL + 0.001));
  return spec * clearcoat * LIGHT_COLOR;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPosition);
  vec3 L = LIGHT_DIR;
  vec3 H = normalize(V + L);

  float NdotV = max(dot(N, V), 0.001);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  float HdotV = max(dot(H, V), 0.0);

  // ── Base PBR specular ──
  float D = distributionGGX(N, H, uRoughness);
  float G = geometrySmith(NdotV, NdotL, uRoughness);
  float F = fresnelSchlick(HdotV, mix(0.04, 1.0, uMetalness));

  vec3 specular = vec3(D * G * F / (4.0 * NdotV * NdotL + 0.001)) * LIGHT_COLOR;

  // ── Subsurface scattering ──
  vec3 crystallineBase = vec3(0.7, 0.85, 1.0); // Icy blue tint
  vec3 sss = subsurfaceScatter(N, L, V, crystallineBase, uThickness);

  // ── Refraction through crystalline body ──
  vec3 refraction = refractedEnvSample(V, N, uIOR, uTransmission);

  // ── Environment reflection ──
  vec3 reflectDir = reflect(-V, N);
  vec3 envReflection = textureCube(uEnvMap, reflectDir).rgb * uEnvMapIntensity;

  // ── Clearcoat ──
  vec3 clearcoat = clearcoatSpecular(N, V, L, uClearcoat, uClearcoatRoughness);

  // ── Emissive (animated) ──
  // Ramps from 0.0 (Phase 1-2) -> 0.5 (Phase 3) -> 3.0 (Phase 4 surge)
  float emissivePulse = 1.0 + sin(uTime * 3.0) * 0.1 * uEmissiveIntensity;
  vec3 emissive = uEmissiveColor * uEmissiveIntensity * emissivePulse;

  // ── Fresnel-blended composition ──
  float fresnel = fresnelSchlick(NdotV, 0.04);

  // Blend refraction (transmission) and reflection based on fresnel
  vec3 dielectric = mix(refraction, envReflection, fresnel);

  // Metal vs dielectric blend
  vec3 surface = mix(dielectric, envReflection * crystallineBase, uMetalness);

  // Final composition
  vec3 color = vec3(0.0);
  color += surface;                          // Base reflection/refraction
  color += sss * (1.0 - uMetalness) * 0.3;  // Subsurface (non-metals only)
  color += specular;                         // Primary specular
  color += clearcoat;                        // Clearcoat layer
  color += emissive;                         // Animated emissive

  // Faceted edge darkening for crystal look (flatShading simulation)
  float edgeDarken = smoothstep(0.0, 0.3, NdotV);
  color *= mix(0.4, 1.0, edgeDarken);

  gl_FragColor = vec4(color, mix(0.8, 1.0, fresnel));
}
