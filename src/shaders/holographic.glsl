// ================================================================
// SparkForge -- Holographic Card Shader (Fragment Only)
// ================================================================
// Decision 4.3: Applied to collectibles + Daily Spark only
// Applied to: SparkCard3D, CosmeticShop featured items
// GPU cost: ~0.1ms (very low -- fragment only, no vertex mod)
//
// Rainbow diffraction from view angle + tilt.
// Uses HSL-to-RGB conversion for smooth spectral sweep.
// CSS fallback: conic-gradient + mix-blend-mode (in v2 component)
// Does NOT require noise.glsl -- uses inline hash noise
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains this shader as a template
// literal string.

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec2 uTilt;       // Card tilt from mouse/touch (-1 to 1)
uniform float uIntensity;  // 0.0 = subtle, 1.0 = vivid
uniform vec3 uBaseColor;   // Card's base color

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// HSL to RGB conversion
vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(
    abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
    0.0, 1.0
  );
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // View-dependent hue shift (core holographic effect)
  float viewAngle = dot(normal, viewDir);
  float hueBase = viewAngle * 0.5 + 0.5;

  // Tilt influence -- mouse movement shifts the rainbow bands
  float tiltInfluence = uTilt.x * 0.3 + uTilt.y * 0.2;
  float hue = fract(hueBase + tiltInfluence + uTime * 0.05);

  // Spatial variation -- rainbow bands sweep across the card
  float spatialHue = fract(hue + vUv.x * 0.4 + vUv.y * 0.3);

  // Generate rainbow color
  vec3 rainbow = hsl2rgb(spatialHue, 0.8, 0.6);

  // Fresnel-based intensity -- stronger at glancing angles
  float fresnel = pow(1.0 - max(viewAngle, 0.0), 2.5);

  // Holographic strength: subtle at rest, vivid on tilt
  float tiltMagnitude = length(uTilt);
  float holoStrength = mix(0.15, 0.6, tiltMagnitude) * uIntensity;

  // Shimmer sparkle (fast-moving high-frequency noise)
  float sparkle = fract(sin(dot(vUv * 50.0 + uTime * 2.0,
                   vec2(12.9898, 78.233))) * 43758.5453);
  sparkle = smoothstep(0.92, 1.0, sparkle) * 0.3;

  // Combine: base card color + rainbow overlay + sparkle
  vec3 finalColor = mix(uBaseColor, rainbow, holoStrength * fresnel);
  finalColor += rainbow * sparkle * uIntensity;

  // Subtle iridescent edge glow
  finalColor += rainbow * fresnel * 0.15 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
