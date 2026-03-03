// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 7: Scan-line Grid
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #06B6D4 cyan
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.4;

  // Base grid
  float gridSize = 20.0;
  vec2 gridUv = fract(uv * gridSize);
  float gridLine = smoothstep(0.05, 0.02, gridUv.x)
                 + smoothstep(0.05, 0.02, gridUv.y)
                 + smoothstep(0.95, 0.98, gridUv.x)
                 + smoothstep(0.95, 0.98, gridUv.y);
  gridLine = min(gridLine, 1.0) * 0.15;

  // Moving detection rectangles (3 scanning boxes)
  float detections = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 boxCenter = vec2(
      0.3 + 0.4 * sin(t * 0.5 + fi * 2.094),
      0.3 + 0.4 * cos(t * 0.4 + fi * 2.094)
    );
    vec2 boxSize = vec2(0.12 + sin(t + fi) * 0.03, 0.09 + cos(t * 0.8 + fi) * 0.02);

    // Box outline
    float dx = abs(uv.x - boxCenter.x);
    float dy = abs(uv.y - boxCenter.y);
    float boxOutline = step(dx, boxSize.x) * step(dy, boxSize.y)
                     - step(dx, boxSize.x - 0.005) * step(dy, boxSize.y - 0.005);

    // Corner brackets
    float cornerSize = 0.025;
    float isCornerX = step(boxSize.x - cornerSize, dx) * step(dx, boxSize.x + 0.003);
    float isCornerY = step(boxSize.y - cornerSize, dy) * step(dy, boxSize.y + 0.003);
    float corner = (isCornerX * step(dy, boxSize.y + 0.003))
                 + (isCornerY * step(dx, boxSize.x + 0.003));

    // Scanning line inside box
    float scanY = boxCenter.y - boxSize.y + fract(t * 0.8 + fi * 0.333) * boxSize.y * 2.0;
    float scanLine = step(dx, boxSize.x) * smoothstep(0.008, 0.001, abs(uv.y - scanY));

    detections += (boxOutline + corner) * 0.8 + scanLine * 0.5;
  }

  // Horizontal sweep line (full width scan)
  float sweepY = fract(t * 0.2);
  float sweep = smoothstep(0.01, 0.003, abs(uv.y - sweepY)) * 0.4;

  // Crosshair at center
  float crosshairSize = 0.03;
  float ch = smoothstep(0.002, 0.001, abs(uv.x - 0.5)) * step(abs(uv.y - 0.5), crosshairSize)
           + smoothstep(0.002, 0.001, abs(uv.y - 0.5)) * step(abs(uv.x - 0.5), crosshairSize);
  ch *= 0.3;

  float total = gridLine + detections + sweep + ch;
  vec3 color = uLabColor * total;
  float alpha = total * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
