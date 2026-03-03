// ================================================================
// SparkForge Lab Pattern Shader Index
// ================================================================
// Decision 3.2 + 4.1: All 10 lab patterns exported as TypeScript strings
// Each shader has noise.glsl prepended where needed (Lab 4: createLab)
// Common interface: uTime, uLabColor, uIntensity, uResolution
//
// Usage:
//   import { getLabPatternShader } from '@/shaders/labPatterns';
//   const { fragment, vertex } = getLabPatternShader(labId);

import { noiseGLSL } from '@/shaders/index';

// ■■ Shared vertex shader for all lab patterns ■■■■■■■■■■■■■■■
export const labPatternVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Lab 1: Binary Rain Columns ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const codeLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float digitColumn(vec2 uv, float columnId, float speed) {
  float t = uTime * speed;
  float scrollSpeed = 0.5 + rand(vec2(columnId, 0.0)) * 1.5;
  float yOffset = fract(uv.y * 0.5 + t * scrollSpeed + rand(vec2(columnId, 1.0)));
  float cellSize = 0.04;
  float fade = smoothstep(0.0, 0.4, yOffset) * smoothstep(1.0, 0.6, yOffset);
  float charOn = step(0.5, rand(vec2(columnId, floor(yOffset / cellSize) + floor(t * 2.0))));
  return charOn * fade;
}

void main() {
  vec2 uv = vUv;
  float columns = 40.0;
  float colWidth = 1.0 / columns;
  float colId = floor(uv.x / colWidth);
  float rain1 = digitColumn(uv, colId, 0.3);
  float rain2 = digitColumn(uv + vec2(0.5, 0.0), colId + 100.0, 0.2) * 0.5;
  float combined = rain1 + rain2;
  vec3 color = uLabColor * combined;
  float glow = smoothstep(0.3, 0.0, abs(fract(uv.x * columns) - 0.5)) * combined * 0.3;
  color += uLabColor * glow;
  float alpha = combined * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 2: Data Sorting Waves ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const dataLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;
  float bars = 12.0;
  float barHeight = 1.0 / bars;
  float totalIntensity = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float barY = (fi + 0.5) * barHeight;
    float sortPhase = sin(t * 0.8 + fi * 0.5) * 0.5 + 0.5;
    float barWidth = 0.1 + sortPhase * 0.6;
    float barX = 0.5 + sin(t * 0.4 + fi * 1.2) * 0.15;
    float dy = abs(uv.y - barY);
    float dx = abs(uv.x - barX);
    float barShape = smoothstep(barHeight * 0.4, barHeight * 0.1, dy)
                   * smoothstep(barWidth * 0.5, barWidth * 0.3, dx);
    float brightness = sortPhase * 0.7 + 0.3;
    totalIntensity += barShape * brightness;
  }
  vec3 color = uLabColor * totalIntensity;
  float wave = sin(uv.x * 10.0 + t * 2.0) * sin(uv.y * 8.0 - t * 1.5) * 0.05;
  color += uLabColor * wave;
  float alpha = totalIntensity * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 3: Neural Pulse Ripples ■■■■■■■■■■■■■■■■■■■■■■■■■■
export const neuralLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.4;
  float totalPulse = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 nodePos = vec2(
      0.2 + 0.6 * sin(t * 0.3 + fi * 1.256),
      0.2 + 0.6 * cos(t * 0.25 + fi * 0.943)
    );
    float dist = distance(uv, nodePos);
    float pulseTime = fract(t * 0.5 + fi * 0.2);
    float ringRadius = pulseTime * 0.5;
    float ring = smoothstep(0.02, 0.0, abs(dist - ringRadius)) * (1.0 - pulseTime);
    float nodeGlow = 0.02 / (dist * dist + 0.01);
    nodeGlow *= 0.5 + 0.5 * sin(t * 3.0 + fi * 2.0);
    totalPulse += ring + nodeGlow * 0.1;
  }
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 p1 = vec2(0.2 + 0.6 * sin(t * 0.3 + fi * 1.256), 0.2 + 0.6 * cos(t * 0.25 + fi * 0.943));
    vec2 p2 = vec2(0.2 + 0.6 * sin(t * 0.3 + (fi + 1.0) * 1.256), 0.2 + 0.6 * cos(t * 0.25 + (fi + 1.0) * 0.943));
    vec2 dir = p2 - p1;
    float len = length(dir);
    vec2 norm = dir / max(len, 0.001);
    float proj = clamp(dot(uv - p1, norm), 0.0, len);
    vec2 closest = p1 + norm * proj;
    float lineDist = distance(uv, closest);
    float pulse = sin(proj / len * 6.2832 - t * 4.0 + fi) * 0.5 + 0.5;
    totalPulse += smoothstep(0.008, 0.002, lineDist) * pulse * 0.3;
  }
  vec3 color = uLabColor * totalPulse;
  float alpha = totalPulse * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 4: Generative Flow Field (needs noise) ■■■■■■■■■■
const createLabRaw = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.2;
  float scale = 3.0;
  float n1 = simplex2D(uv * scale + vec2(t * 0.3, t * 0.1));
  float n2 = simplex2D(uv * scale * 1.5 + vec2(-t * 0.2, t * 0.4));
  float n3 = simplex2D(uv * scale * 0.5 + vec2(t * 0.15, -t * 0.2));
  vec2 flow = vec2(n1, n2) * 0.5;
  vec2 advectedUv = uv + flow * 0.1;
  float streaks = simplex2D(advectedUv * 8.0 + vec2(t * 0.5, 0.0));
  float brushX = simplex2D(vec2(uv.x * 12.0 + t * 0.3, uv.y * 3.0));
  float brushY = simplex2D(vec2(uv.x * 3.0, uv.y * 12.0 - t * 0.2));
  float brush = max(brushX, brushY) * 0.5 + 0.5;
  vec3 color1 = uLabColor;
  vec3 color2 = uLabColor * vec3(1.2, 0.8, 0.6);
  vec3 color3 = uLabColor * vec3(0.8, 1.0, 1.3);
  float mix1 = smoothstep(-0.3, 0.3, n1);
  float mix2 = smoothstep(-0.2, 0.4, n3);
  vec3 color = mix(color1, color2, mix1);
  color = mix(color, color3, mix2 * 0.4);
  float combined = brush * 0.6 + streaks * 0.3 + 0.1;
  color *= combined;
  float alpha = combined * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;
export const createLab = noiseGLSL + createLabRaw;

// ■■ Lab 5: Agent Path Traces ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const agentLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.35;
  float totalPath = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float phase = fi * 1.047;
    vec2 p0 = vec2(0.1 + sin(t * 0.2 + phase) * 0.1, 0.1 + fi * 0.15);
    vec2 p1 = vec2(0.5 + sin(t * 0.3 + phase + 1.0) * 0.2, 0.2 + fi * 0.12 + sin(t * 0.4 + fi) * 0.1);
    vec2 p2 = vec2(0.9 + sin(t * 0.25 + phase + 2.0) * 0.1, 0.15 + fi * 0.14);
    for (int j = 0; j < 20; j++) {
      float bt = float(j) / 19.0;
      vec2 bp = (1.0 - bt) * (1.0 - bt) * p0 + 2.0 * (1.0 - bt) * bt * p1 + bt * bt * p2;
      float dist = distance(uv, bp);
      float dotPhase = fract(t * 0.5 + fi * 0.167);
      float dotBrightness = smoothstep(0.02, 0.0, abs(bt - dotPhase)) * 2.0;
      float pathLine = smoothstep(0.005, 0.001, dist);
      totalPath += (pathLine * 0.3 + dotBrightness * smoothstep(0.015, 0.005, dist));
    }
  }
  totalPath = min(totalPath, 1.5);
  vec3 color = uLabColor * totalPath;
  float nodeGlow = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 nodePos = vec2(0.25 + fi * 0.18, 0.3 + sin(t * 0.5 + fi * 1.5) * 0.15);
    float dist = distance(uv, nodePos);
    nodeGlow += 0.008 / (dist * dist + 0.005) * (0.5 + 0.5 * sin(t * 2.0 + fi));
  }
  color += uLabColor * nodeGlow * 0.15;
  float alpha = (totalPath + nodeGlow * 0.1) * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 6: Balance Oscillation ■■■■■■■■■■■■■■■■■■■■■■■■■■
export const ethicsLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;
  vec2 fulcrum = vec2(0.5, 0.4);
  float fulcrumDist = distance(uv, fulcrum);
  float fulcrumGlow = 0.005 / (fulcrumDist * fulcrumDist + 0.002);
  float tiltAngle = sin(t * 0.7) * 0.3;
  float beamLength = 0.35;
  vec2 leftEnd = fulcrum + vec2(-cos(tiltAngle), sin(tiltAngle)) * beamLength;
  vec2 rightEnd = fulcrum + vec2(cos(tiltAngle), -sin(tiltAngle)) * beamLength;
  vec2 beamDir = rightEnd - leftEnd;
  float beamLen = length(beamDir);
  vec2 beamNorm = beamDir / beamLen;
  float proj = clamp(dot(uv - leftEnd, beamNorm), 0.0, beamLen);
  vec2 closest = leftEnd + beamNorm * proj;
  float beamDist = distance(uv, closest);
  float beam = smoothstep(0.006, 0.002, beamDist);
  float leftPan = smoothstep(0.06, 0.04, distance(uv, leftEnd));
  float rightPan = smoothstep(0.06, 0.04, distance(uv, rightEnd));
  float leftWeight = sin(t * 1.2) * 0.5 + 0.5;
  float rightWeight = 1.0 - leftWeight;
  float leftBar = smoothstep(0.03, 0.02, abs(uv.x - leftEnd.x))
                * smoothstep(leftEnd.y, leftEnd.y - leftWeight * 0.15, uv.y)
                * step(leftEnd.y - leftWeight * 0.15, uv.y);
  float rightBar = smoothstep(0.03, 0.02, abs(uv.x - rightEnd.x))
                 * smoothstep(rightEnd.y, rightEnd.y - rightWeight * 0.15, uv.y)
                 * step(rightEnd.y - rightWeight * 0.15, uv.y);
  float leftLine = smoothstep(0.003, 0.001, abs(uv.x - fulcrum.x + beamLength * cos(tiltAngle)))
                 * step(fulcrum.y, uv.y) * step(uv.y, fulcrum.y + 0.15);
  float rightLine = smoothstep(0.003, 0.001, abs(uv.x - fulcrum.x - beamLength * cos(tiltAngle)))
                  * step(fulcrum.y, uv.y) * step(uv.y, fulcrum.y + 0.15);
  float gradient = smoothstep(0.0, 1.0, uv.x);
  vec3 leftColor = vec3(0.2, 0.8, 0.2);
  vec3 rightColor = uLabColor;
  vec3 bgGradient = mix(leftColor, rightColor, gradient) * 0.08;
  float total = beam + leftPan + rightPan + leftBar * 0.8 + rightBar * 0.8
              + fulcrumGlow * 0.15 + leftLine + rightLine;
  vec3 color = uLabColor * total + bgGradient;
  float alpha = total * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 7: Scan-line Grid ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const visionLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.4;
  float gridSize = 20.0;
  vec2 gridUv = fract(uv * gridSize);
  float gridLine = smoothstep(0.05, 0.02, gridUv.x) + smoothstep(0.05, 0.02, gridUv.y)
                 + smoothstep(0.95, 0.98, gridUv.x) + smoothstep(0.95, 0.98, gridUv.y);
  gridLine = min(gridLine, 1.0) * 0.15;
  float detections = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 boxCenter = vec2(0.3 + 0.4 * sin(t * 0.5 + fi * 2.094), 0.3 + 0.4 * cos(t * 0.4 + fi * 2.094));
    vec2 boxSize = vec2(0.12 + sin(t + fi) * 0.03, 0.09 + cos(t * 0.8 + fi) * 0.02);
    float dx = abs(uv.x - boxCenter.x);
    float dy = abs(uv.y - boxCenter.y);
    float boxOutline = step(dx, boxSize.x) * step(dy, boxSize.y)
                     - step(dx, boxSize.x - 0.005) * step(dy, boxSize.y - 0.005);
    float cornerSize = 0.025;
    float isCornerX = step(boxSize.x - cornerSize, dx) * step(dx, boxSize.x + 0.003);
    float isCornerY = step(boxSize.y - cornerSize, dy) * step(dy, boxSize.y + 0.003);
    float corner = (isCornerX * step(dy, boxSize.y + 0.003)) + (isCornerY * step(dx, boxSize.x + 0.003));
    float scanY = boxCenter.y - boxSize.y + fract(t * 0.8 + fi * 0.333) * boxSize.y * 2.0;
    float scanLine = step(dx, boxSize.x) * smoothstep(0.008, 0.001, abs(uv.y - scanY));
    detections += (boxOutline + corner) * 0.8 + scanLine * 0.5;
  }
  float sweepY = fract(t * 0.2);
  float sweep = smoothstep(0.01, 0.003, abs(uv.y - sweepY)) * 0.4;
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
`;

// ■■ Lab 8: Text Stream Flow ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const languageLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.25;
  float totalText = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float streamY = (fi + 0.5) / 8.0;
    float streamSpeed = 0.1 + rand(vec2(fi, 0.0)) * 0.15;
    float direction = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;
    float cellWidth = 0.02;
    float scrollX = uv.x + t * streamSpeed * direction;
    float cellId = floor(scrollX / cellWidth);
    float charOn = step(0.3, rand(vec2(cellId, fi)));
    float cellX = fract(scrollX / cellWidth);
    float cellY = abs(uv.y - streamY) / 0.02;
    float glyph = step(0.15, cellX) * step(cellX, 0.85) * step(cellY, 1.0) * charOn;
    float horizontalFade = max(1.0 - abs(uv.x - 0.5) * 1.5, 0.0);
    totalText += glyph * 0.3 * horizontalFade;
  }
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
    float glyph = step(colDist, 0.008) * step(0.1, cellYFract) * step(cellYFract, 0.9) * charOn;
    totalText += glyph * 0.2;
  }
  vec3 color = uLabColor * totalText;
  float alpha = totalText * uIntensity * 0.4;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 9: Code Compilation ■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const buildLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.3;
  float totalCode = 0.0;
  float lineHeight = 0.025;
  float maxLines = 30.0;
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float lineY = fi * lineHeight + 0.05;
    float appearTime = fi * 0.15;
    float lineAge = t - appearTime;
    float lineVisible = smoothstep(0.0, 0.3, fract(lineAge / (maxLines * 0.15)));
    float indent = floor(rand(vec2(fi, 0.0)) * 4.0) * 0.04;
    float lineWidth = 0.15 + rand(vec2(fi, 1.0)) * 0.45;
    float inLine = step(indent, uv.x) * step(uv.x, indent + lineWidth)
                 * smoothstep(lineHeight * 0.4, lineHeight * 0.1, abs(uv.y - lineY));
    float buildPhase = fract(t * 0.2);
    float currentLine = floor(buildPhase * maxLines);
    float isCurrent = smoothstep(1.5, 0.0, abs(fi - currentLine));
    totalCode += inLine * lineVisible * (0.4 + isCurrent * 0.6);
  }
  float barY = 0.02;
  float barProgress = fract(t * 0.1);
  float bar = step(abs(uv.y - barY), 0.005) * step(0.1, uv.x) * step(uv.x, 0.1 + barProgress * 0.8);
  float barBg = step(abs(uv.y - barY), 0.005) * step(0.1, uv.x) * step(uv.x, 0.9) * 0.2;
  vec3 color = uLabColor * (totalCode + bar + barBg);
  float alpha = (totalCode + bar) * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab 10: Starfield Warp ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
export const frontierLab = `
precision mediump float;
uniform float uTime;
uniform vec3 uLabColor;
uniform float uIntensity;
uniform vec2 uResolution;
varying vec2 vUv;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.5;
  vec2 center = vec2(0.5, 0.5);
  vec2 dir = uv - center;
  float dist = length(dir);
  float angle = atan(dir.y, dir.x);
  float totalStars = 0.0;
  for (int layer = 0; layer < 3; layer++) {
    float fl = float(layer);
    float layerSpeed = 0.3 + fl * 0.3;
    float layerSize = 0.003 - fl * 0.0005;
    float starCount = 40.0 + fl * 20.0;
    for (int i = 0; i < 60; i++) {
      if (float(i) >= starCount) break;
      float fi = float(i);
      float starAngle = rand(vec2(fi, fl)) * 6.2832;
      float starDist = fract(rand(vec2(fi + 100.0, fl)) + t * layerSpeed * 0.1);
      vec2 starPos = center + vec2(cos(starAngle), sin(starAngle)) * starDist * 0.7;
      float d = distance(uv, starPos);
      float star = smoothstep(layerSize, 0.0, d);
      vec2 streakDir = normalize(starPos - center + vec2(0.001));
      float streakLen = starDist * 0.03 * layerSpeed;
      float streakDist = abs(dot(uv - starPos, vec2(-streakDir.y, streakDir.x)));
      float alongStreak = dot(uv - starPos, streakDir);
      float streak = smoothstep(0.002, 0.0, streakDist) * smoothstep(streakLen, 0.0, alongStreak)
                   * step(0.0, alongStreak) * starDist;
      float brightness = starDist * 1.5 + 0.2;
      totalStars += (star + streak * 0.5) * brightness;
    }
  }
  float vortex = 0.01 / (dist * dist + 0.005);
  vortex *= 0.5 + 0.5 * sin(t * 2.0);
  float speedLines = 0.0;
  for (int k = 0; k < 8; k++) {
    float fk = float(k);
    float lineAngle = fk * 0.7854 + t * 0.1;
    float angleDiff = abs(mod(angle - lineAngle + 3.14159, 6.28318) - 3.14159);
    speedLines += smoothstep(0.03, 0.01, angleDiff) * dist * 0.3;
  }
  float total = totalStars + vortex * 0.2 + speedLines * 0.15;
  vec3 color = uLabColor * total;
  color += vec3(0.1, 0.05, 0.0) * totalStars * dist;
  float alpha = total * uIntensity * 0.35;
  alpha = clamp(alpha, 0.0, 0.35);
  gl_FragColor = vec4(color, alpha);
}
`;

// ■■ Lab ID to Shader Mapping ■■■■■■■■■■■■■■■■■■■■■■■■■■■
const LAB_SHADERS: Record<number, string> = {
  1: codeLab,
  2: dataLab,
  3: neuralLab,
  4: createLab,
  5: agentLab,
  6: ethicsLab,
  7: visionLab,
  8: languageLab,
  9: buildLab,
  10: frontierLab,
};

export function getLabPatternShader(labId: number): {
  fragment: string;
  vertex: string;
} {
  const fragment = LAB_SHADERS[labId] || LAB_SHADERS[1];
  return { fragment, vertex: labPatternVertexShader };
}

// ■■ All lab IDs for preloading ■■■■■■■■■■■■■■■■■■■■■■■■■
export const ALL_LAB_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
