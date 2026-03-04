// ================================================================
// SparkForge -- Liquid Metal Shader (Vertex + Fragment)
// ================================================================
// Decision 4.2: Epic (0.5x) + Legendary (1.0x + mouse ripple)
// Applied to: BadgeLevitate3D meshes in Trophy Room
// GPU cost: ~0.3ms per badge
//
// VERTEX: Simplex noise displacement for surface undulation
// FRAGMENT: Metallic BRDF + animated noise + Fresnel reflection
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: liquidMetalVertexShader

uniform float uTime;
uniform float uIntensity;       // 0.5 for Epic, 1.0 for Legendary
uniform vec2 uRippleCenter;     // Mouse position in UV space
uniform float uRippleStrength;  // 0.0 = no ripple, 1.0 = full

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

// simplex3D is prepended from noise.glsl

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Base undulation: 3 octaves of simplex noise
  float noise1 = simplex3D(vec3(position.xy * 1.5, uTime * 0.3)) * 0.5;
  float noise2 = simplex3D(vec3(position.xy * 3.0, uTime * 0.5)) * 0.25;
  float noise3 = simplex3D(vec3(position.xy * 6.0, uTime * 0.8)) * 0.125;
  float totalNoise = (noise1 + noise2 + noise3) * uIntensity;

  // Mouse ripple (Legendary only, uRippleStrength > 0)
  float distToMouse = distance(uv, uRippleCenter);
  float ripple = sin(distToMouse * 20.0 - uTime * 8.0) *
                 exp(-distToMouse * 4.0) *
                 uRippleStrength * 0.15;

  // Combined displacement along normal
  float displacement = totalNoise * 0.08 + ripple;
  vDisplacement = displacement;

  vec3 displaced = position + normal * displacement;
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}

// ---- FRAGMENT SHADER ----
// Export as: liquidMetalFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;      // Badge rarity color
uniform float uIntensity;  // 0.5 for Epic, 1.0 for Legendary

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel effect -- stronger reflection at glancing angles
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  fresnel = mix(0.2, 1.0, fresnel);

  // Base metallic color with animated flow
  float flow = simplex3D(vec3(vUv * 4.0, uTime * 0.4)) * 0.5 + 0.5;
  vec3 baseColor = mix(uColor * 0.6, uColor * 1.4, flow);

  // Specular highlight (Blinn-Phong)
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  vec3 specColor = vec3(1.0, 0.95, 0.9) * spec * 1.5;

  // Environment reflection approximation
  vec3 reflectDir = reflect(-viewDir, normal);
  float envReflect = simplex3D(reflectDir * 2.0 + uTime * 0.2) * 0.5 + 0.5;
  vec3 envColor = mix(
    vec3(0.1, 0.15, 0.3),  // Dark blue ambient
    vec3(0.4, 0.5, 0.7),   // Bright sky reflection
    envReflect
  );

  // Combine: base metal + fresnel reflection + specular
  vec3 finalColor = mix(baseColor, envColor, fresnel * 0.6);
  finalColor += specColor;

  // Displacement-based darkening in valleys
  float valleyDarken = smoothstep(-0.05, 0.05, vDisplacement);
  finalColor *= mix(0.7, 1.0, valleyDarken);

  // Edge glow based on intensity
  finalColor += uColor * fresnel * 0.3 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
