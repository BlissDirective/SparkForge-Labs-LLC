// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 2: Data Sorting Waves
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #8B5CF6 purple
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;

  // Horizontal bars at different heights
  float bars = 12.0;
  float barHeight = 1.0 / bars;
  float totalIntensity = 0.0;

  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float barY = (fi + 0.5) * barHeight;

    // Each bar has a different width that oscillates (sorting animation)
    float sortPhase = sin(t * 0.8 + fi * 0.5) * 0.5 + 0.5;
    float barWidth = 0.1 + sortPhase * 0.6;

    // Bar position shifts horizontally during sort
    float barX = 0.5 + sin(t * 0.4 + fi * 1.2) * 0.15;

    // Distance from bar center
    float dy = abs(uv.y - barY);
    float dx = abs(uv.x - barX);

    // Rounded bar shape
    float barShape = smoothstep(barHeight * 0.4, barHeight * 0.1, dy)
                   * smoothstep(barWidth * 0.5, barWidth * 0.3, dx);

    // Height-based brightness (taller bars glow more)
    float brightness = sortPhase * 0.7 + 0.3;
    totalIntensity += barShape * brightness;
  }

  vec3 color = uLabColor * totalIntensity;

  // Add subtle wave distortion
  float wave = sin(uv.x * 10.0 + t * 2.0) * sin(uv.y * 8.0 - t * 1.5) * 0.05;
  color += uLabColor * wave;

  float alpha = totalIntensity * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
