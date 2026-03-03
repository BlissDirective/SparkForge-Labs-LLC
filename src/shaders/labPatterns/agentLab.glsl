// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 5: Agent Path Traces
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #10B981 emerald
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.35;
  float totalPath = 0.0;

  // 6 agent paths — animated Bezier-like curves
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float phase = fi * 1.047;  // ~60 degree spacing

    // Path defined by 3 control points that move
    vec2 p0 = vec2(
      0.1 + sin(t * 0.2 + phase) * 0.1,
      0.1 + fi * 0.15
    );
    vec2 p1 = vec2(
      0.5 + sin(t * 0.3 + phase + 1.0) * 0.2,
      0.2 + fi * 0.12 + sin(t * 0.4 + fi) * 0.1
    );
    vec2 p2 = vec2(
      0.9 + sin(t * 0.25 + phase + 2.0) * 0.1,
      0.15 + fi * 0.14
    );

    // Evaluate quadratic Bezier at multiple t values
    for (int j = 0; j < 20; j++) {
      float bt = float(j) / 19.0;
      vec2 bp = (1.0 - bt) * (1.0 - bt) * p0
              + 2.0 * (1.0 - bt) * bt * p1
              + bt * bt * p2;
      float dist = distance(uv, bp);

      // Traveling dot along path
      float dotPhase = fract(t * 0.5 + fi * 0.167);
      float dotBrightness = smoothstep(0.02, 0.0, abs(bt - dotPhase)) * 2.0;

      // Path line
      float pathLine = smoothstep(0.005, 0.001, dist);
      totalPath += (pathLine * 0.3 + dotBrightness * smoothstep(0.015, 0.005, dist));
    }
  }

  totalPath = min(totalPath, 1.5);
  vec3 color = uLabColor * totalPath;

  // Decision node glow at path intersections
  float nodeGlow = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 nodePos = vec2(
      0.25 + fi * 0.18,
      0.3 + sin(t * 0.5 + fi * 1.5) * 0.15
    );
    float dist = distance(uv, nodePos);
    nodeGlow += 0.008 / (dist * dist + 0.005) * (0.5 + 0.5 * sin(t * 2.0 + fi));
  }
  color += uLabColor * nodeGlow * 0.15;

  float alpha = (totalPath + nodeGlow * 0.1) * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
