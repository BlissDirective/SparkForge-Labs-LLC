// ================================================================
// SparkForge -- Fire Noise Shader (Vertex + Fragment)
// ================================================================
// Applied to: StreakFlame3D.tsx (Diamond tier, 100+ day streak)
// GPU cost: ~0.2ms
// Geometry: PlaneGeometry billboard facing camera
//
// VERTEX: Billboard orientation + subtle wave distortion
// FRAGMENT: FBM noise flame + prismatic Diamond refraction
// Requires: noise.glsl (simplex3D) prepended at build time
//
// NOTE: This is a reference file. The actual imports come from
// src/shaders/index.ts which contains these shaders as template
// literal strings with noiseGLSL prepended.

// ---- VERTEX SHADER ----
// Export as: fireNoiseVertexShader

uniform float uTime;
uniform float uFlameHeight;  // 1.0 = normal, 1.5 = excited

varying vec2 vUv;
varying float vFlameY;

void main() {
  vUv = uv;

  // Flame Y position (0 at base, 1 at tip)
  vFlameY = uv.y;

  // Subtle horizontal wave at flame tip
  vec3 pos = position;
  float wave = sin(uTime * 3.0 + position.y * 4.0) * 0.05 * position.y;
  pos.x += wave;

  // Scale height
  pos.y *= uFlameHeight;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

// ---- FRAGMENT SHADER ----
// Export as: fireNoiseFragmentShader

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uIntensity;    // Overall brightness
uniform float uFlameHeight;

varying vec2 vUv;
varying float vFlameY;

// FBM for flame turbulence (4 octaves)
float flameFBM(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    f += amp * simplex3D(vec3(p * freq,
                         uTime * (1.0 + float(i) * 0.3)));
    freq *= 2.0;
    amp *= 0.5;
  }
  return f;
}

// Prismatic color for Diamond tier
vec3 prismaticColor(float t) {
  // Rainbow cycle through spectral colors
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = vUv;

  // Center horizontally, base at bottom
  vec2 flameUV = vec2((uv.x - 0.5) * 2.0, uv.y);

  // Flame shape mask: narrow at top, wide at base
  float width = mix(0.6, 0.1, pow(uv.y, 0.8));
  float flameMask = smoothstep(width, width * 0.5, abs(flameUV.x));

  // FBM noise for turbulence (scrolls upward)
  vec2 noiseUV = vec2(flameUV.x * 3.0,
                      flameUV.y * 2.0 - uTime * 2.5);
  float noise = flameFBM(noiseUV);

  // Distort flame shape with noise
  flameMask *= smoothstep(-0.3, 0.5,
                          noise + (1.0 - uv.y) * 0.8);

  // Core temperature gradient (white hot center -> edges)
  float coreDistance = length(
    vec2(flameUV.x, flameUV.y - 0.3)) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.5, coreDistance);

  // Diamond prismatic coloring
  float prismT = noise * 0.5 + uv.y * 0.3 + uTime * 0.1;
  vec3 prismColor = prismaticColor(prismT);

  // Temperature-based color:
  // white core -> prismatic mid -> blue tips
  vec3 coreColor = vec3(1.0, 0.98, 0.95);  // White-hot
  vec3 midColor = prismColor * 1.2;
  vec3 tipColor = vec3(0.3, 0.5, 1.0);     // Blue tips

  vec3 flameColor = mix(tipColor, midColor,
                        smoothstep(0.6, 0.2, uv.y));
  flameColor = mix(flameColor, coreColor, core * 0.7);

  // Final alpha
  float alpha = flameMask * uIntensity;

  // Fade out at very top
  alpha *= smoothstep(1.0, 0.85, uv.y);

  // Subtle ember particles near tip
  float ember = fract(sin(dot(uv * 100.0 + uTime,
                   vec2(12.9898, 78.233))) * 43758.5453);
  ember = smoothstep(0.97, 1.0, ember) * flameMask
        * (1.0 - uv.y);
  flameColor += vec3(1.0, 0.8, 0.4) * ember * 2.0;

  gl_FragColor = vec4(flameColor, alpha);
}
