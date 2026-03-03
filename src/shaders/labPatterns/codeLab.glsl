// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 1: Binary Rain Columns
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #3B82F6 blue
uniform float uIntensity;  // 0.0 - 1.0
uniform vec2 uResolution;

varying vec2 vUv;

// Pseudo-random from 2D seed
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// Single digit column character
float digitColumn(vec2 uv, float columnId, float speed) {
  float t = uTime * speed;
  // Each column scrolls at different speed
  float scrollSpeed = 0.5 + rand(vec2(columnId, 0.0)) * 1.5;
  float yOffset = fract(uv.y * 0.5 + t * scrollSpeed + rand(vec2(columnId, 1.0)));
  // Character cell
  float cellSize = 0.04;
  // Brightness based on position (fade at bottom)
  float fade = smoothstep(0.0, 0.4, yOffset) * smoothstep(1.0, 0.6, yOffset);
  // Random on/off per cell
  float charOn = step(0.5, rand(vec2(columnId, floor(yOffset / cellSize) + floor(t * 2.0))));
  return charOn * fade;
}

void main() {
  vec2 uv = vUv;
  float columns = 40.0;
  float colWidth = 1.0 / columns;
  float colId = floor(uv.x / colWidth);

  // Multiple rain layers at different speeds
  float rain1 = digitColumn(uv, colId, 0.3);
  float rain2 = digitColumn(uv + vec2(0.5, 0.0), colId + 100.0, 0.2) * 0.5;
  float combined = rain1 + rain2;

  // Color: lab color with brightness variation
  vec3 color = uLabColor * combined;

  // Add subtle glow around active columns
  float glow = smoothstep(0.3, 0.0, abs(fract(uv.x * columns) - 0.5)) * combined * 0.3;
  color += uLabColor * glow;

  float alpha = combined * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
