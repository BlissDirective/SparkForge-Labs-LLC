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
