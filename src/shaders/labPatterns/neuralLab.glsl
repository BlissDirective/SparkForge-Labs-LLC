// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 3: Neural Pulse Ripples
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #EC4899 pink
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.4;
  float totalPulse = 0.0;

  // 5 synapse firing points at semi-random positions
  for (int i = 0; i < 5; i++) {
    float fi = float(i);

    // Node position drifts slowly
    vec2 nodePos = vec2(
      0.2 + 0.6 * sin(t * 0.3 + fi * 1.256),
      0.2 + 0.6 * cos(t * 0.25 + fi * 0.943)
    );
    float dist = distance(uv, nodePos);

    // Expanding ring pulse
    float pulseTime = fract(t * 0.5 + fi * 0.2);
    float ringRadius = pulseTime * 0.5;
    float ring = smoothstep(0.02, 0.0, abs(dist - ringRadius)) * (1.0 - pulseTime);

    // Central glow at node
    float nodeGlow = 0.02 / (dist * dist + 0.01);
    nodeGlow *= 0.5 + 0.5 * sin(t * 3.0 + fi * 2.0);

    totalPulse += ring + nodeGlow * 0.1;
  }

  // Connection lines between nodes (simplified)
  float connections = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 p1 = vec2(
      0.2 + 0.6 * sin(t * 0.3 + fi * 1.256),
      0.2 + 0.6 * cos(t * 0.25 + fi * 0.943)
    );
    vec2 p2 = vec2(
      0.2 + 0.6 * sin(t * 0.3 + (fi + 1.0) * 1.256),
      0.2 + 0.6 * cos(t * 0.25 + (fi + 1.0) * 0.943)
    );

    // Line distance approximation
    vec2 dir = p2 - p1;
    float len = length(dir);
    vec2 norm = dir / max(len, 0.001);
    float proj = clamp(dot(uv - p1, norm), 0.0, len);
    vec2 closest = p1 + norm * proj;
    float lineDist = distance(uv, closest);

    // Traveling pulse along connection
    float pulse = sin(proj / len * 6.2832 - t * 4.0 + fi) * 0.5 + 0.5;
    connections += smoothstep(0.008, 0.002, lineDist) * pulse * 0.3;
  }

  totalPulse += connections;

  vec3 color = uLabColor * totalPulse;
  float alpha = totalPulse * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
