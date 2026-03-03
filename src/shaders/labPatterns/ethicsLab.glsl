// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 6: Balance Oscillation
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #EF4444 red
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;

  // Central fulcrum
  vec2 fulcrum = vec2(0.5, 0.4);
  float fulcrumDist = distance(uv, fulcrum);
  float fulcrumGlow = 0.005 / (fulcrumDist * fulcrumDist + 0.002);

  // Balance beam — tilts back and forth
  float tiltAngle = sin(t * 0.7) * 0.3;  // Oscillating tilt
  float beamLength = 0.35;

  // Beam endpoints
  vec2 leftEnd = fulcrum + vec2(-cos(tiltAngle), sin(tiltAngle)) * beamLength;
  vec2 rightEnd = fulcrum + vec2(cos(tiltAngle), -sin(tiltAngle)) * beamLength;

  // Beam line distance
  vec2 beamDir = rightEnd - leftEnd;
  float beamLen = length(beamDir);
  vec2 beamNorm = beamDir / beamLen;
  float proj = clamp(dot(uv - leftEnd, beamNorm), 0.0, beamLen);
  vec2 closest = leftEnd + beamNorm * proj;
  float beamDist = distance(uv, closest);
  float beam = smoothstep(0.006, 0.002, beamDist);

  // Scale pans (circles at beam ends)
  float leftPan = smoothstep(0.06, 0.04, distance(uv, leftEnd));
  float rightPan = smoothstep(0.06, 0.04, distance(uv, rightEnd));

  // Weight indicators (vertical bars in pans)
  float leftWeight = sin(t * 1.2) * 0.5 + 0.5;  // 0-1
  float rightWeight = 1.0 - leftWeight;

  float leftBar = smoothstep(0.03, 0.02, abs(uv.x - leftEnd.x))
                * smoothstep(leftEnd.y, leftEnd.y - leftWeight * 0.15, uv.y)
                * step(leftEnd.y - leftWeight * 0.15, uv.y);
  float rightBar = smoothstep(0.03, 0.02, abs(uv.x - rightEnd.x))
                 * smoothstep(rightEnd.y, rightEnd.y - rightWeight * 0.15, uv.y)
                 * step(rightEnd.y - rightWeight * 0.15, uv.y);

  // Pendulum support lines
  float leftLine = smoothstep(0.003, 0.001, abs(uv.x - fulcrum.x + beamLength * cos(tiltAngle)))
                 * step(fulcrum.y, uv.y)
                 * step(uv.y, fulcrum.y + 0.15);
  float rightLine = smoothstep(0.003, 0.001, abs(uv.x - fulcrum.x - beamLength * cos(tiltAngle)))
                  * step(fulcrum.y, uv.y)
                  * step(uv.y, fulcrum.y + 0.15);

  // Gradient weight visualization background
  float gradient = smoothstep(0.0, 1.0, uv.x);
  vec3 leftColor = vec3(0.2, 0.8, 0.2);  // Green = fair
  vec3 rightColor = uLabColor;             // Red = unfair
  vec3 bgGradient = mix(leftColor, rightColor, gradient) * 0.08;

  float total = beam + leftPan + rightPan + leftBar * 0.8 + rightBar * 0.8
              + fulcrumGlow * 0.15 + leftLine + rightLine;

  vec3 color = uLabColor * total + bgGradient;
  float alpha = total * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
