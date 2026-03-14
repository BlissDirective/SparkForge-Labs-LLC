// ================================================================
// SparkForge Shader Index
// ================================================================
// Exports all GLSL shader source strings as TypeScript modules.
// Noise functions are prepended to shaders that need them.

// ■■ Shared Noise Library ■■
// This is the noise.glsl content as a TypeScript string.
// Prepended to shaders that need noise functions.
export const noiseGLSL = `
vec3 mod289_v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289_v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289_v3(((x * 34.0) + 10.0) * x); }

float simplex2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289_v2(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec4 mod289_v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute4(vec4 x) { return mod289_v4(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float simplex3D(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289_v3(i);
  vec4 p = permute4(permute4(permute4(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0+1.0;
  vec4 s1 = floor(b1)*2.0+1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m = m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec2 p, int octaves) {
  float val = 0.0; float amp = 0.5; float freq = 1.0;
  for(int i=0;i<6;i++){if(i>=octaves)break;val+=amp*simplex2D(p*freq);freq*=2.0;amp*=0.5;}
  return val;
}
`;

// ■■ Aurora Void Shader ■■
export const auroraFragmentShader = noiseGLSL + `
precision mediump float;

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uIntensity;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.15;

  float n1 = simplex2D(uv * 0.5 + vec2(t * 0.3, t * 0.1));
  float n2 = simplex2D(uv * 2.0 + vec2(-t * 0.2, t * 0.4));
  float n3 = simplex2D(uv * 5.0 + vec2(t * 0.5, -t * 0.3));

  float noise = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;

  float band1 = smoothstep(-0.2, 0.3, noise);
  float band2 = smoothstep(0.0, 0.5, noise);

  vec3 color = mix(uColor1, uColor2, band1);
  color = mix(color, uColor3, band2 * 0.5);

  float vertFade = smoothstep(0.0, 0.6, uv.y);

  vec2 vigUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vigUv * 0.5, vigUv * 0.5);
  vignette = smoothstep(0.0, 1.0, vignette);

  float alpha = noise * 0.5 + 0.5;
  alpha *= vertFade * vignette * uIntensity;
  alpha = clamp(alpha, 0.0, 0.35);

  gl_FragColor = vec4(color, alpha);
}
`;

export const auroraVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Scanline Overlay Shader ■■
export const scanlineFragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 1.5);
  float scroll = sin(uTime * 0.5 + vUv.y * 4.0) * 0.02;
  float intensity = scanline * uOpacity + scroll * uOpacity;
  gl_FragColor = vec4(0.0, 0.0, 0.0, intensity);
}
`;

export const scanlineVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Chrome Reflection Shader (for bezel) ■■
export const chromeFragmentShader = noiseGLSL + `
precision mediump float;

uniform float uTime;
uniform vec3 uBaseColor;
uniform float uMetalness;
uniform float uRoughness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  // Simple chrome-like reflection using noise-based environment
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 reflectDir = reflect(-viewDir, normalize(vNormal));

  // Fake environment reflection using noise
  float envNoise = simplex2D(reflectDir.xy * 2.0 + uTime * 0.05);
  vec3 envColor = mix(
    vec3(0.05, 0.1, 0.2),  // Dark blue
    vec3(0.2, 0.15, 0.3),  // Purple tint
    envNoise * 0.5 + 0.5
  );

  // Fresnel edge glow
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);
  vec3 fresnelColor = vec3(0.23, 0.51, 0.96) * fresnel; // #3B82F6

  vec3 color = mix(uBaseColor, envColor, uMetalness * 0.6);
  color += fresnelColor * 0.3;
  color = mix(color, envColor, (1.0 - uRoughness) * 0.4);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const chromeVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalMatrix * normal;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ================================================================
// v3 Stage 5 P2-3A Additions -- Reward Shader Exports
// ================================================================
// APPENDED by Stage 5 Parts 2-3A v3-FINAL
// DO NOT modify existing exports above.
// noiseGLSL is already defined at the top of this file.

// ■■ Liquid Metal Shader (Decision 4.2) ■■
// Epic (0.5x intensity) + Legendary (1.0x + mouse ripple)
// Applied to: BadgeLevitate3D meshes in Trophy Room

const liquidMetalVertexRaw = `
uniform float uTime;
uniform float uIntensity;
uniform vec2 uRippleCenter;
uniform float uRippleStrength;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  float noise1 = simplex3D(vec3(position.xy * 1.5, uTime * 0.3)) * 0.5;
  float noise2 = simplex3D(vec3(position.xy * 3.0, uTime * 0.5)) * 0.25;
  float noise3 = simplex3D(vec3(position.xy * 6.0, uTime * 0.8)) * 0.125;
  float totalNoise = (noise1 + noise2 + noise3) * uIntensity;

  float distToMouse = distance(uv, uRippleCenter);
  float ripple = sin(distToMouse * 20.0 - uTime * 8.0) *
                 exp(-distToMouse * 4.0) * uRippleStrength * 0.15;

  float displacement = totalNoise * 0.08 + ripple;
  vDisplacement = displacement;

  vec3 displaced = position + normal * displacement;
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const liquidMetalFragmentRaw = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  fresnel = mix(0.2, 1.0, fresnel);

  float flow = simplex3D(vec3(vUv * 4.0, uTime * 0.4)) * 0.5 + 0.5;
  vec3 baseColor = mix(uColor * 0.6, uColor * 1.4, flow);

  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.8));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
  vec3 specColor = vec3(1.0, 0.95, 0.9) * spec * 1.5;

  vec3 reflectDir = reflect(-viewDir, normal);
  float envReflect = simplex3D(reflectDir * 2.0 + uTime * 0.2) * 0.5 + 0.5;
  vec3 envColor = mix(vec3(0.1, 0.15, 0.3), vec3(0.4, 0.5, 0.7), envReflect);

  vec3 finalColor = mix(baseColor, envColor, fresnel * 0.6);
  finalColor += specColor;

  float valleyDarken = smoothstep(-0.05, 0.05, vDisplacement);
  finalColor *= mix(0.7, 1.0, valleyDarken);

  finalColor += uColor * fresnel * 0.3 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const liquidMetalVertexShader = noiseGLSL + '\n' + liquidMetalVertexRaw;
export const liquidMetalFragmentShader = noiseGLSL + '\n' + liquidMetalFragmentRaw;

// ■■ Holographic Card Shader (Decision 4.3) ■■
// Rainbow diffraction on collectibles + Daily Spark
// Pure fragment -- no noise dependency

export const holographicVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const holographicFragmentShader = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec2 uTilt;
uniform float uIntensity;
uniform vec3 uBaseColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(
    abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
    0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  float viewAngle = dot(normal, viewDir);
  float hueBase = viewAngle * 0.5 + 0.5;

  float tiltInfluence = uTilt.x * 0.3 + uTilt.y * 0.2;
  float hue = fract(hueBase + tiltInfluence + uTime * 0.05);

  float spatialHue = fract(hue + vUv.x * 0.4 + vUv.y * 0.3);

  vec3 rainbow = hsl2rgb(spatialHue, 0.8, 0.6);

  float fresnel = pow(1.0 - max(viewAngle, 0.0), 2.5);

  float tiltMagnitude = length(uTilt);
  float holoStrength = mix(0.15, 0.6, tiltMagnitude) * uIntensity;

  float sparkle = fract(sin(dot(vUv * 50.0 + uTime * 2.0,
                   vec2(12.9898, 78.233))) * 43758.5453);
  sparkle = smoothstep(0.92, 1.0, sparkle) * 0.3;

  vec3 finalColor = mix(uBaseColor, rainbow, holoStrength * fresnel);
  finalColor += rainbow * sparkle * uIntensity;
  finalColor += rainbow * fresnel * 0.15 * uIntensity;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ■■ Energy Field Shader (Decision 4.5) ■■
// Hex dome with shatter + energy crawl
// Applied to: Streak shield on Profile page

const energyFieldVertexRaw = `
uniform float uTime;
uniform float uShieldHP;
uniform float uBreathScale;
uniform float uShatterProgress;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

float faceRand(vec3 pos) {
  return fract(sin(dot(floor(pos * 10.0),
               vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  float breath = 1.0 + sin(uTime * 2.0) * uBreathScale * 0.02;

  float fRand = faceRand(position);
  vFaceRandom = fRand;

  vec3 shatterOffset = normal * fRand * uShatterProgress * 2.0;
  float shatterRotate = uShatterProgress * fRand * 6.28;
  shatterOffset.x += sin(shatterRotate) * uShatterProgress * 0.5;
  shatterOffset.y += cos(shatterRotate) * uShatterProgress * 0.3;

  vec3 finalPos = position * breath + shatterOffset;
  vWorldPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}
`;

const energyFieldFragmentRaw = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec3 uColor;
uniform float uShieldHP;
uniform float uShatterProgress;
uniform float uIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vFaceRandom;

float hexGrid(vec2 p) {
  vec2 q = vec2(p.x * 2.0 * 0.5773503, p.y + p.x * 0.5773503);
  vec2 pi = floor(q);
  vec2 pf = fract(q);
  float v = mod(pi.x + pi.y, 3.0);
  float ca = step(1.0, v);
  float cb = step(2.0, v);
  vec2 ma = step(pf.xy, pf.yx);
  float e = dot(ma, 1.0 - pf.yx + ca * (pf.x + pf.y - 1.0)
             + cb * (pf.yx - 2.0 * pf.xy));
  return smoothstep(0.0, 0.08, e);
}

void main() {
  vec3 normal = normalize(vNormal);

  vec2 hexUv = vWorldPosition.xy * 3.0 + vWorldPosition.z * 0.5;
  float hex = hexGrid(hexUv);
  float hexEdge = 1.0 - hex;

  float energyCrawl = simplex3D(vec3(hexUv * 2.0, uTime * 1.5)) * 0.5 + 0.5;
  float crawlOnEdge = hexEdge * energyCrawl;

  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);

  vec3 baseColor = uColor * 0.3;
  float baseAlpha = 0.05 + fresnel * 0.4;

  vec3 edgeColor = uColor * 1.5 * crawlOnEdge;
  float edgeAlpha = crawlOnEdge * 0.6;

  vec3 finalColor = baseColor + edgeColor;
  float finalAlpha = (baseAlpha + edgeAlpha) * uIntensity;

  finalAlpha *= uShieldHP;
  finalColor *= mix(0.3, 1.0, uShieldHP);

  finalAlpha *= 1.0 - uShatterProgress * 0.8;

  if (uShieldHP < 0.3 && uShieldHP > 0.0) {
    float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
    finalColor += uColor * pulse * 0.5;
  }

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

export const energyFieldVertexShader = noiseGLSL + '\n' + energyFieldVertexRaw;
export const energyFieldFragmentShader = noiseGLSL + '\n' + energyFieldFragmentRaw;

// ■■ Fire Noise Shader (Diamond Streak Flame) ■■
// Prismatic procedural flame for 100+ day streaks
// Applied to: StreakFlame3D.tsx billboard

const fireNoiseVertexRaw = `
uniform float uTime;
uniform float uFlameHeight;

varying vec2 vUv;
varying float vFlameY;

void main() {
  vUv = uv;
  vFlameY = uv.y;

  vec3 pos = position;
  float wave = sin(uTime * 3.0 + position.y * 4.0)
             * 0.05 * position.y;
  pos.x += wave;
  pos.y *= uFlameHeight;

  gl_Position = projectionMatrix * modelViewMatrix
              * vec4(pos, 1.0);
}
`;

const fireNoiseFragmentRaw = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uIntensity;
uniform float uFlameHeight;

varying vec2 vUv;
varying float vFlameY;

float flameFBM(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    f += amp * simplex3D(vec3(p * freq,
                         uTime * (1.0 + float(i) * 0.3)));
    freq *= 2.0;
    amp *= 0.5;
  }
  return f;
}

vec3 prismaticColor(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.00, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = vUv;

  vec2 flameUV = vec2((uv.x - 0.5) * 2.0, uv.y);

  float width = mix(0.6, 0.1, pow(uv.y, 0.8));
  float flameMask = smoothstep(width, width * 0.5, abs(flameUV.x));

  vec2 noiseUV = vec2(flameUV.x * 3.0,
                      flameUV.y * 2.0 - uTime * 2.5);
  float noise = flameFBM(noiseUV);

  flameMask *= smoothstep(-0.3, 0.5, noise + (1.0 - uv.y) * 0.8);

  float coreDistance = length(vec2(flameUV.x, flameUV.y - 0.3)) * 2.0;
  float core = 1.0 - smoothstep(0.0, 0.5, coreDistance);

  float prismT = noise * 0.5 + uv.y * 0.3 + uTime * 0.1;
  vec3 prismColor = prismaticColor(prismT);

  vec3 coreColor = vec3(1.0, 0.98, 0.95);
  vec3 midColor = prismColor * 1.2;
  vec3 tipColor = vec3(0.3, 0.5, 1.0);

  vec3 flameColor = mix(tipColor, midColor, smoothstep(0.6, 0.2, uv.y));
  flameColor = mix(flameColor, coreColor, core * 0.7);

  float alpha = flameMask * uIntensity;
  alpha *= smoothstep(1.0, 0.85, uv.y);

  float ember = fract(sin(dot(uv * 100.0 + uTime,
                   vec2(12.9898, 78.233))) * 43758.5453);
  ember = smoothstep(0.97, 1.0, ember) * flameMask * (1.0 - uv.y);
  flameColor += vec3(1.0, 0.8, 0.4) * ember * 2.0;

  gl_FragColor = vec4(flameColor, alpha);
}
`;

export const fireNoiseVertexShader = noiseGLSL + '\n' + fireNoiseVertexRaw;
export const fireNoiseFragmentShader = noiseGLSL + '\n' + fireNoiseFragmentRaw;

// ================================================================
// CPA v1.0 — Cockpit Panoramic Architecture Shaders
// ================================================================

// ■■ Radar Sweep Shader (Left Side Panel) ■■
// Rotating sweep line with concentric range rings, lab dot indicators

const radarSweepFragmentRaw = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uSweepSpeed;

varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);
  float angle = atan(centered.y, centered.x);

  // Concentric range rings (4 rings)
  float rings = 0.0;
  for (int i = 1; i <= 4; i++) {
    float r = float(i) * 0.22;
    float ring = smoothstep(0.008, 0.0, abs(dist - r));
    rings += ring * 0.4;
  }

  // Rotating sweep line
  float sweepAngle = mod(uTime * uSweepSpeed, 6.2832);
  float angleDiff = mod(angle - sweepAngle + 6.2832, 6.2832);
  float sweep = smoothstep(0.5, 0.0, angleDiff) * smoothstep(0.0, 0.02, angleDiff);
  sweep *= step(dist, 0.9);

  // Sweep trail (fading arc behind sweep)
  float trail = smoothstep(1.2, 0.0, angleDiff) * 0.3;
  trail *= step(dist, 0.9);

  // Center dot
  float centerDot = smoothstep(0.04, 0.02, dist);

  // Outer boundary circle
  float boundary = smoothstep(0.008, 0.0, abs(dist - 0.9));

  // Cross hairs
  float crossH = smoothstep(0.003, 0.0, abs(centered.y)) * step(dist, 0.9) * 0.2;
  float crossV = smoothstep(0.003, 0.0, abs(centered.x)) * step(dist, 0.9) * 0.2;

  float total = (rings + sweep + trail + centerDot + boundary + crossH + crossV) * uIntensity;
  vec3 color = uColor * total;

  gl_FragColor = vec4(color, total * 0.8);
}
`;

export const radarSweepFragmentShader = radarSweepFragmentRaw;

export const radarSweepVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Data Stream Shader (Right Side Panel) ■■
// Scrolling data characters, bar graphs, on-brand digital rain

const dataStreamFragmentRaw = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uScrollSpeed;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float digitGrid(vec2 uv, float time) {
  vec2 grid = floor(uv * vec2(8.0, 20.0));
  float h = hash(grid + floor(vec2(0.0, time * 0.5)));
  float show = step(0.4, h);
  // Brightness varies per cell
  float brightness = hash(grid * 1.7 + 0.5) * 0.6 + 0.4;
  return show * brightness;
}

void main() {
  vec2 uv = vUv;

  // Scrolling effect
  float scroll = uTime * uScrollSpeed;
  vec2 scrollUv = vec2(uv.x, uv.y + scroll);

  // Data grid
  float data = digitGrid(scrollUv, uTime);

  // Horizontal bar graphs (bottom section)
  float barSection = smoothstep(0.0, 0.25, uv.y) * (1.0 - step(0.25, uv.y));
  float barIndex = floor(uv.y * 16.0);
  float barWidth = hash(vec2(barIndex, floor(uTime * 0.3))) * 0.7 + 0.2;
  float bar = step(uv.x, barWidth) * barSection * 0.8;

  // Fade edges
  float edgeFade = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x);
  edgeFade *= smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);

  // Scanline effect within panel
  float scanline = sin(uv.y * 80.0) * 0.1 + 0.9;

  float total = (data * (1.0 - barSection) + bar) * edgeFade * scanline * uIntensity;
  vec3 color = uColor * total;

  gl_FragColor = vec4(color, total * 0.7);
}
`;

export const dataStreamFragmentShader = dataStreamFragmentRaw;

export const dataStreamVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ■■ Holographic Ring Shader (HUD concentric rings) ■■
// Concentric ring glow with scan line animation

const holographicRingFragmentRaw = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPulse;

varying vec2 vUv;

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  float dist = length(centered);
  float angle = atan(centered.y, centered.x);

  // 3 concentric rings with glow falloff
  float ring1 = smoothstep(0.02, 0.0, abs(dist - 0.9)) * 0.8;
  float ring2 = smoothstep(0.02, 0.0, abs(dist - 0.6)) * 0.6;
  float ring3 = smoothstep(0.015, 0.0, abs(dist - 0.35)) * 0.5;

  // Ring glow halos
  float glow1 = smoothstep(0.08, 0.0, abs(dist - 0.9)) * 0.3;
  float glow2 = smoothstep(0.06, 0.0, abs(dist - 0.6)) * 0.2;

  // Radial tick marks (12 segments)
  float tickAngle = mod(angle + 3.14159, 0.5236); // PI/6 = 30 degrees
  float tick = smoothstep(0.02, 0.0, tickAngle) * step(0.3, dist) * step(dist, 0.92) * 0.4;

  // Active scan line (one radial line sweeps)
  float scanAngle = mod(uTime * 1.5, 6.2832);
  float scanDiff = mod(angle - scanAngle + 6.2832, 6.2832);
  float scan = smoothstep(0.08, 0.0, scanDiff) * step(0.3, dist) * step(dist, 0.92) * 0.8;

  // Center core pulse
  float corePulse = sin(uTime * 4.189) * 0.15 + 0.85; // 4.189 ≈ 2PI/1.5
  float core = smoothstep(0.15, 0.0, dist) * corePulse * uPulse;

  float total = (ring1 + ring2 + ring3 + glow1 + glow2 + tick + scan + core) * uIntensity;
  vec3 color = uColor * total;

  // Subtle color shift on outer ring
  vec3 shiftColor = mix(uColor, uColor * vec3(0.8, 1.2, 1.0), sin(angle * 3.0 + uTime) * 0.3 + 0.5);
  color = mix(color, shiftColor * total, ring1 + glow1);

  gl_FragColor = vec4(color, total * 0.9);
}
`;

export const holographicRingFragmentShader = holographicRingFragmentRaw;

export const holographicRingVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
