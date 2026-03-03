// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 4: Generative Flow Field
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution
// REQUIRES: simplex2D from noise.glsl (prepended via index.ts)

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #F59E0B amber
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.2;

  // Perlin noise flow field
  float scale = 3.0;
  float n1 = simplex2D(uv * scale + vec2(t * 0.3, t * 0.1));
  float n2 = simplex2D(uv * scale * 1.5 + vec2(-t * 0.2, t * 0.4));
  float n3 = simplex2D(uv * scale * 0.5 + vec2(t * 0.15, -t * 0.2));

  // Flow direction from noise gradient
  vec2 flow = vec2(n1, n2) * 0.5;

  // Advected UV for paint-like streaks
  vec2 advectedUv = uv + flow * 0.1;
  float streaks = simplex2D(advectedUv * 8.0 + vec2(t * 0.5, 0.0));

  // Brush stroke effect — elongated noise
  float brushX = simplex2D(vec2(uv.x * 12.0 + t * 0.3, uv.y * 3.0));
  float brushY = simplex2D(vec2(uv.x * 3.0, uv.y * 12.0 - t * 0.2));
  float brush = max(brushX, brushY) * 0.5 + 0.5;

  // Color variation — warm palette shifts
  vec3 color1 = uLabColor;
  vec3 color2 = uLabColor * vec3(1.2, 0.8, 0.6);  // Warmer variant
  vec3 color3 = uLabColor * vec3(0.8, 1.0, 1.3);  // Cooler variant

  float mix1 = smoothstep(-0.3, 0.3, n1);
  float mix2 = smoothstep(-0.2, 0.4, n3);

  vec3 color = mix(color1, color2, mix1);
  color = mix(color, color3, mix2 * 0.4);

  // Apply brush strokes and streaks
  float combined = brush * 0.6 + streaks * 0.3 + 0.1;
  color *= combined;

  float alpha = combined * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
