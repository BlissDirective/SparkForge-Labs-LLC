// ================================================================
// SparkForge -- Energy Field Shader (Vertex + Fragment)
// ================================================================
// Decision 4.5: Full 3D dome desktop, CSS mobile
// Applied to: Streak shield on Profile page
// GPU cost: ~0.2ms
// Geometry: IcosahedronGeometry (detail=2) -- natural hex facets
// Blending: THREE.AdditiveBlending
//
// VERTEX: Breathing pulse + shatter displacement
// FRAGMENT: Hex grid + Fresnel glow + energy crawl
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: energyFieldVertexShader

uniform float uTime;
uniform float uShieldHP;          // 1.0 = full, 0.0 = broken
uniform float uBreathScale;       // Breathing pulse amplitude
uniform float uShatterProgress;   // 0.0 = intact, 1.0 = fully shattered

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

// Per-face random for shatter direction
float faceRand(vec3 pos) {
  return fract(sin(dot(floor(pos * 10.0),
               vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Breathing pulse (subtle scale oscillation)
  float breath = 1.0 + sin(uTime * 2.0) * uBreathScale * 0.02;

  // Shatter: each face flies outward along its normal
  float fRand = faceRand(position);
  vFaceRandom = fRand;

  vec3 shatterOffset = normal * fRand * uShatterProgress * 2.0;
  // Add rotation during shatter
  float shatterRotate = uShatterProgress * fRand * 6.28;
  shatterOffset.x += sin(shatterRotate) * uShatterProgress * 0.5;
  shatterOffset.y += cos(shatterRotate) * uShatterProgress * 0.3;

  vec3 finalPos = position * breath + shatterOffset;
  vWorldPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}

// ---- FRAGMENT SHADER ----
// Export as: energyFieldFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;             // Shield color (streak tier dependent)
uniform float uShieldHP;         // 1.0 = full, 0.0 = broken
uniform float uShatterProgress;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

// Note: cameraPosition is a Three.js built-in uniform

// Hex grid pattern
float hexGrid(vec2 p) {
  vec2 q = vec2(p.x * 2.0 * 0.5773503, p.y + p.x * 0.5773503);
  vec2 pi = floor(q);
  vec2 pf = fract(q);
  float v = mod(pi.x + pi.y, 3.0);
  float ca = step(1.0, v);
  float cb = step(2.0, v);
  vec2 ma = step(pf.xy, pf.yx);
  float e = dot(ma, 1.0 - pf.yx + ca * (pf.x + pf.y - 1.0)
             + cb * (pf.yx - 2.0 * pf.xy));
  return smoothstep(0.0, 0.08, e);
}

void main() {
  vec3 normal = normalize(vNormal);

  // Hex grid on the dome surface
  vec2 hexUv = vWorldPosition.xy * 3.0 + vWorldPosition.z * 0.5;
  float hex = hexGrid(hexUv);

  // Edge lines (the hex cell borders glow)
  float hexEdge = 1.0 - hex;

  // Energy crawl along hex edges
  float energyCrawl = simplex3D(vec3(hexUv * 2.0, uTime * 1.5))
                      * 0.5 + 0.5;
  float crawlOnEdge = hexEdge * energyCrawl;

  // Fresnel edge glow
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

  // Base dome color (very transparent center, glowing edges)
  vec3 baseColor = uColor * 0.3;
  float baseAlpha = 0.05 + fresnel * 0.4;

  // Add hex edge glow
  vec3 edgeColor = uColor * 1.5 * crawlOnEdge;
  float edgeAlpha = crawlOnEdge * 0.6;

  // Combine
  vec3 finalColor = baseColor + edgeColor;
  float finalAlpha = (baseAlpha + edgeAlpha) * uIntensity;

  // HP-based dimming
  finalAlpha *= uShieldHP;
  finalColor *= mix(0.3, 1.0, uShieldHP);

  // Shatter: fragments fade out as they fly away
  finalAlpha *= 1.0 - uShatterProgress * 0.8;

  // Pulse flash when HP is low
  if (uShieldHP < 0.3 && uShieldHP > 0.0) {
    float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
    finalColor += uColor * pulse * 0.5;
  }

  gl_FragColor = vec4(finalColor, finalAlpha);
}
