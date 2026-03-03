// ================================================================
// SparkForge Lab Pattern Fragment Shader — Lab 8: Text Stream Flow
// ================================================================
// Decision 3.2 + 4.1: All 10 labs get unique patterns at launch
// Shared interface: uTime, uLabColor, uIntensity, uResolution

precision mediump float;

uniform float uTime;
uniform vec3 uLabColor;   // #8B5CF6 violet
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

// Pseudo-random from 2D seed
float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.25;
  float totalText = 0.0;

  // Horizontal text streams at different heights
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float streamY = (fi + 0.5) / 8.0;
    float streamSpeed = 0.1 + rand(vec2(fi, 0.0)) * 0.15;
    float direction = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;  // Alternate directions

    // Scrolling character cells
    float cellWidth = 0.02;
    float scrollX = uv.x + t * streamSpeed * direction;
    float cellId = floor(scrollX / cellWidth);

    // Character presence (random on/off)
    float charOn = step(0.3, rand(vec2(cellId, fi)));

    // Character shape (simple rectangular glyph)
    float cellX = fract(scrollX / cellWidth);
    float cellY = abs(uv.y - streamY) / 0.02;
    float glyph = step(0.15, cellX) * step(cellX, 0.85)
                * step(cellY, 1.0)
                * charOn;

    // Brightness fades from center outward
    float horizontalFade = max(1.0 - abs(uv.x - 0.5) * 1.5, 0.0);

    totalText += glyph * 0.3 * horizontalFade;
  }

  // Vertical falling text (secondary layer)
  for (int j = 0; j < 5; j++) {
    float fj = float(j);
    float colX = 0.15 + fj * 0.17;
    float fallSpeed = 0.08 + rand(vec2(fj, 1.0)) * 0.12;

    float cellHeight = 0.025;
    float scrollY = uv.y + t * fallSpeed;
    float cellId = floor(scrollY / cellHeight);
    float charOn = step(0.4, rand(vec2(cellId, fj + 100.0)));

    float cellYFract = fract(scrollY / cellHeight);
    float colDist = abs(uv.x - colX);
    float glyph = step(colDist, 0.008)
                * step(0.1, cellYFract)
                * step(cellYFract, 0.9)
                * charOn;

    totalText += glyph * 0.2;
  }

  vec3 color = uLabColor * totalText;
  float alpha = totalText * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
