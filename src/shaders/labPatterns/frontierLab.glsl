// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 10: Starfield Warp
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #F59E0B gold
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

// Pseudo-random from 2D seed
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.5;

  // Center-relative coordinates for radial motion
  vec2 center = vec2(0.5, 0.5);
  vec2 dir = uv - center;
  float dist = length(dir);
  float angle = atan(dir.y, dir.x);

  float totalStars = 0.0;

  // Star layers at different depths
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float layerSpeed = 0.3 + fl * 0.3;
    float layerSize = 0.003 - fl * 0.0005;
    float starCount = 40.0 + fl * 20.0;

    for (int i = 0; i < 60; i++) {
      if (float(i) >= starCount) break;
      float fi = float(i);

      // Star position in polar coords
      float starAngle = rand(vec2(fi, fl)) * 6.2832;
      float starDist = fract(rand(vec2(fi + 100.0, fl)) + t * layerSpeed * 0.1);

      // Convert back to UV
      vec2 starPos = center + vec2(cos(starAngle), sin(starAngle)) * starDist * 0.7;
      float d = distance(uv, starPos);

      // Star point with streak
      float star = smoothstep(layerSize, 0.0, d);

      // Radial streak (motion blur effect) — safe normalize
      vec2 streakDir = normalize(starPos - center + vec2(0.001));
      float streakLen = starDist * 0.03 * layerSpeed;
      float streakDist = abs(dot(uv - starPos, vec2(-streakDir.y, streakDir.x)));
      float alongStreak = dot(uv - starPos, streakDir);
      float streak = smoothstep(0.002, 0.0, streakDist)
                   * smoothstep(streakLen, 0.0, alongStreak)
                   * step(0.0, alongStreak)
                   * starDist;

      // Brightness increases as stars move outward
      float brightness = starDist * 1.5 + 0.2;
      totalStars += (star + streak * 0.5) * brightness;
    }
  }

  // Central vortex glow
  float vortex = 0.01 / (dist * dist + 0.005);
  vortex *= 0.5 + 0.5 * sin(t * 2.0);

  // Radial speed lines (subtle)
  float speedLines = 0.0;
  for (int k = 0; k < 8; k++) {
    float fk = float(k);
    float lineAngle = fk * 0.7854 + t * 0.1;  // 45 degree spacing
    float angleDiff = abs(mod(angle - lineAngle + 3.14159, 6.28318) - 3.14159);
    speedLines += smoothstep(0.03, 0.01, angleDiff) * dist * 0.3;
  }

  float total = totalStars + vortex * 0.2 + speedLines * 0.15;
  vec3 color = uLabColor * total;

  // Warmer stars at edges
  color += vec3(0.1, 0.05, 0.0) * totalStars * dist;

  float alpha = total * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
