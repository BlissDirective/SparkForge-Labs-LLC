// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 9: Code Compilation
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #10B981 green
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

// Pseudo-random from 2D seed
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;
  float totalCode = 0.0;

  // Code lines appearing and stacking upward
  float lineHeight = 0.025;
  float maxLines = 30.0;

  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float lineY = fi * lineHeight + 0.05;

    // Line appears at a specific time, stacks from bottom
    float appearTime = fi * 0.15;
    float lineAge = t - appearTime;
    float lineVisible = smoothstep(0.0, 0.3, fract(lineAge / (maxLines * 0.15)));

    // Indentation level (random per line, 0-3)
    float indent = floor(rand(vec2(fi, 0.0)) * 4.0) * 0.04;

    // Line width (random, simulates different code lengths)
    float lineWidth = 0.15 + rand(vec2(fi, 1.0)) * 0.45;

    // Syntax coloring regions within line
    float inLine = step(indent, uv.x)
                 * step(uv.x, indent + lineWidth)
                 * smoothstep(lineHeight * 0.4, lineHeight * 0.1, abs(uv.y - lineY));

    // Build progress highlight (current line being written)
    float buildPhase = fract(t * 0.2);
    float currentLine = floor(buildPhase * maxLines);
    float isCurrent = smoothstep(1.5, 0.0, abs(fi - currentLine));

    totalCode += inLine * lineVisible * (0.4 + isCurrent * 0.6);
  }

  // Progress bar at bottom
  float barY = 0.02;
  float barProgress = fract(t * 0.1);
  float bar = step(abs(uv.y - barY), 0.005)
            * step(0.1, uv.x)
            * step(uv.x, 0.1 + barProgress * 0.8);
  float barBg = step(abs(uv.y - barY), 0.005)
              * step(0.1, uv.x) * step(uv.x, 0.9) * 0.2;

  vec3 color = uLabColor * (totalCode + bar + barBg);
  float alpha = (totalCode + bar) * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
