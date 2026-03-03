// ================================================================
// SparkForge Aurora Void Fragment Shader
// ================================================================
// Decision 2.5: Background behind station frame — living space
// Renders on a plane behind the chrome frame (z-index lower)
// Crossfades with lab patterns via uTransition uniform

precision mediump float;

uniform float uTime;
uniform vec3 uColor1;   // Primary blue: #3B82F6
uniform vec3 uColor2;   // Secondary purple: #8B5CF6
uniform vec3 uColor3;   // Tertiary teal: #06B6D4
uniform float uIntensity; // 0.0 - 1.0 (mode-dependent)
uniform float uSpeed;     // Animation speed multiplier
uniform vec2 uResolution;

varying vec2 vUv;

// Noise functions are concatenated from noise.glsl at build time

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.15;

  // Layer 1: Large slow curtains (scale 0.5)
  float n1 = simplex2D(uv * 0.5 + vec2(t * 0.3, t * 0.1));

  // Layer 2: Medium bands (scale 2.0)
  float n2 = simplex2D(uv * 2.0 + vec2(-t * 0.2, t * 0.4));

  // Layer 3: Fast shimmer (scale 5.0)
  float n3 = simplex2D(uv * 5.0 + vec2(t * 0.5, -t * 0.3));

  // Combine with decreasing amplitude
  float noise = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

  // Map noise to color gradient
  float band1 = smoothstep(-0.2, 0.3, noise);
  float band2 = smoothstep(0.0, 0.5, noise);

  vec3 color = mix(uColor1, uColor2, band1);
  color = mix(color, uColor3, band2 * 0.5);

  // Vertical fade — stronger at top, fades at bottom
  float vertFade = smoothstep(0.0, 0.6, uv.y);

  // Edge vignette — darker at corners
  vec2 vigUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vigUv * 0.5, vigUv * 0.5);
  vignette = smoothstep(0.0, 1.0, vignette);

  float alpha = noise * 0.5 + 0.5;
  alpha *= vertFade * vignette * uIntensity;

  // Clamp to subtle range
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
