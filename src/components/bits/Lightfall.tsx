'use client';

// ════════════════════════════════════════════════════════════════
// LIGHTFALL — vendored from React Bits (reactbits.dev/backgrounds/lightfall,
// repo DavidHDev/react-bits, MIT) per Forge plan §10.1. Forge F6.
// ════════════════════════════════════════════════════════════════
// OGL fragment-shader falling-light streaks. Adaptations vs upstream
// (plan §10.1.3 — we own this copy):
//   • TypeScript + forwardRef imperative handle: setUniforms() lets
//     scroll choreography drive speed/density/opacity WITHOUT React
//     re-renders (a re-render would rebuild the GL context).
//   • dpr clamped to ≤1.5 (≤1 when compactDpr) — perf budget.
//   • Auto-pause when <5% visible (IntersectionObserver) or tab hidden.
//   • prefers-reduced-motion: renders ONE static frame, then stops.
//   • WebGL context failure: renders nothing (the CSS poster layer
//     beneath is the permanent fallback).
//   • `paused` prop changes do NOT re-create the GL context (ref).

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const MAX_COLORS = 8;

const hexToRGB = (hex: string): [number, number, number] => {
  const c = hex.replace('#', '').padEnd(6, '0');
  return [
    parseInt(c.slice(0, 2), 16) / 255,
    parseInt(c.slice(2, 4), 16) / 255,
    parseInt(c.slice(4, 6), 16) / 255,
  ];
};

const prepColors = (input?: string[]) => {
  const base = (input && input.length ? input : ['#FFC24A', '#FF8C1A', '#35E0FF']).slice(0, MAX_COLORS);
  const count = base.length;
  const arr: Array<[number, number, number]> = [];
  for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
  const avg: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    avg[0] += arr[i][0];
    avg[1] += arr[i][1];
    avg[2] += arr[i][2];
  }
  avg[0] /= count;
  avg[1] /= count;
  avg[2] /= count;
  return { arr, count, avg };
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uBgColor;
uniform vec3  uMouseColor;
uniform float uSpeed;
uniform int   uStreakCount;
uniform float uStreakWidth;
uniform float uStreakLength;
uniform float uGlow;
uniform float uDensity;
uniform float uTwinkle;
uniform float uZoom;
uniform float uBgGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

vec3 tanhv(vec3 x) {
  vec3 e = exp(-2.0 * x);
  return (1.0 - e) / (1.0 + e);
}

vec2 sceneC(vec2 frag, vec2 r) {
  vec2 P = (frag + frag - r) / r.x;
  float z = 0.0;
  float d = 1e3;
  vec4 O = vec4(0.0);
  for (int k = 0; k < 39; k++) {
    if (d <= 1e-4) break;
    O = z * normalize(vec4(P, uZoom, 0.0)) - vec4(0.0, 4.0, 1.0, 0.0) / 4.5;
    d = 1.0 - sqrt(length(O * O));
    z += d;
  }
  return vec2(O.x, atan(O.z, O.y));
}

void mainImage(out vec4 o, vec2 C) {
  vec2 r = iResolution.xy;
  vec2 uv0 = (C + C - r) / r.x;
  float T = 0.1 * iTime * uSpeed + 9.0;
  float angRings = max(1.0, floor(6.28318530718 * max(uDensity, 0.05) + 0.5));
  vec2 Y = vec2(5e-3, 6.28318530718 / angRings);

  vec2 c0 = sceneC(C, r);
  vec2 cdx = sceneC(C + vec2(1.0, 0.0), r);
  vec2 cdy = sceneC(C + vec2(0.0, 1.0), r);
  vec2 dCx = cdx - c0;
  vec2 dCy = cdy - c0;
  dCx.y -= 6.28318530718 * floor(dCx.y / 6.28318530718 + 0.5);
  dCy.y -= 6.28318530718 * floor(dCy.y / 6.28318530718 + 0.5);
  vec2 fw = abs(dCx) + abs(dCy);
  C = c0;

  vec2 P = vec2(2.0, 1.0) * uv0 - (r / r.x) * vec2(0.0, 1.0);
  vec4 O = vec4(uBgColor * 90.0 * uBgGlow / (1e3 * dot(P, P) + 6.0), 0.0);

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mN = (iMouse + iMouse - r) / r.x;
    float md = length(uv0 - mN);
    mGlow = exp(-md * md / max(uMouseRadius * uMouseRadius, 1e-4)) * uMouseStrength;
    O.rgb += uMouseColor * mGlow * 0.25;
  }

  float zr = 5e-4 * uStreakWidth;
  vec2 rr = vec2(max(length(fw), 1e-5));
  float tail = 19.0 / max(uStreakLength, 0.05);

  for (int m = 0; m < 16; m++) {
    if (m >= uStreakCount) break;
    float jf = float(m) + 1.0;
    float ic = fract(sin(dot(vec2(jf, floor(C.x / Y.x + 0.5)), vec2(7.0, 11.0)) * 73.0));
    vec2 Pp = C - (T + T * ic) * vec2(0.0, 1.0);
    Pp -= floor(Pp / Y + 0.5) * Y;
    float h = fract(8663.0 * ic);
    vec3 col = palette(h);
    float weight = mix(1.5, 1.0 + sin(T + 7.0 * h + 4.0), uTwinkle);
    weight *= (1.0 + mGlow * 2.0);
    vec2 inner = vec2(length(max(Pp, vec2(-1.0, 0.0))), length(Pp) - zr) - zr;
    vec2 sm = vec2(1.0) - smoothstep(-rr, rr, inner);
    O.rgb += dot(sm, vec2(exp(tail * Pp.y), 3.0)) * col * weight;
    C.x += Y.x / 8.0;
  }

  vec3 colr = sqrt(tanhv(max(O.rgb * uGlow - vec3(0.04, 0.08, 0.02), 0.0)));
  o = vec4(colr, uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

export interface LightfallHandle {
  /** Drive shader uniforms directly (no React re-render). */
  setUniforms: (u: { speed?: number; density?: number; opacity?: number }) => void;
  /** Pause/resume the render loop without rebuilding the context. */
  setPaused: (paused: boolean) => void;
}

export interface LightfallProps {
  className?: string;
  dpr?: number;
  /** Clamp dpr to 1 (compact devices). */
  compactDpr?: boolean;
  paused?: boolean;
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  zoom?: number;
  backgroundGlow?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  /** Reduced-motion override; when true renders one static frame. */
  staticFrame?: boolean;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
}

type UniformMap = Record<string, { value: number | number[] | [number, number, number] }>;

const Lightfall = forwardRef<LightfallHandle, LightfallProps>(function Lightfall(
  {
    className,
    dpr,
    compactDpr = false,
    paused = false,
    colors = ['#FFC24A', '#FF8C1A', '#35E0FF'],
    backgroundColor = '#16100B',
    speed = 0.5,
    streakCount = 2,
    streakWidth = 1,
    streakLength = 1,
    glow = 1,
    density = 0.6,
    twinkle = 1,
    zoom = 3,
    backgroundGlow = 0.5,
    opacity = 1,
    mouseInteraction = true,
    mouseStrength = 0.5,
    mouseRadius = 1,
    mouseDampening = 0.15,
    staticFrame = false,
    mixBlendMode,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<UniformMap | null>(null);
  const pausedRef = useRef(paused);
  const visibleRef = useRef(true);
  const colorKey = colors.join(',');

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useImperativeHandle(
    ref,
    () => ({
      setUniforms: (u) => {
        const uniforms = uniformsRef.current;
        if (!uniforms) return;
        if (u.speed !== undefined) uniforms.uSpeed.value = u.speed;
        if (u.density !== undefined) uniforms.uDensity.value = u.density;
        if (u.opacity !== undefined) uniforms.uOpacity.value = u.opacity;
      },
      setPaused: (p) => {
        pausedRef.current = p;
      },
    }),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // WebGL failure → render nothing; poster layer beneath persists.
    let renderer: Renderer;
    try {
      const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      renderer = new Renderer({
        dpr: dpr ?? Math.min(rawDpr, compactDpr ? 1 : 1.5),
        alpha: true,
        antialias: true,
      });
      if (!renderer.gl) return;
    } catch {
      return;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const { arr, count, avg } = prepColors(colorKey.split(','));

    const uniforms: UniformMap = {
      iResolution: { value: [gl.drawingBufferWidth, gl.drawingBufferHeight, 1] },
      iMouse: { value: [0, 0] },
      iTime: { value: 0 },
      uColor0: { value: arr[0] },
      uColor1: { value: arr[1] },
      uColor2: { value: arr[2] },
      uColor3: { value: arr[3] },
      uColor4: { value: arr[4] },
      uColor5: { value: arr[5] },
      uColor6: { value: arr[6] },
      uColor7: { value: arr[7] },
      uColorCount: { value: count },
      uBgColor: { value: hexToRGB(backgroundColor) },
      uMouseColor: { value: avg },
      uSpeed: { value: speed },
      uStreakCount: { value: Math.max(1, Math.min(16, Math.round(streakCount))) },
      uStreakWidth: { value: streakWidth },
      uStreakLength: { value: streakLength },
      uGlow: { value: glow },
      uDensity: { value: density },
      uTwinkle: { value: twinkle },
      uZoom: { value: zoom },
      uBgGlow: { value: backgroundGlow },
      uOpacity: { value: opacity },
      uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
      uMouseStrength: { value: mouseStrength },
      uMouseRadius: { value: mouseRadius },
    };
    uniformsRef.current = uniforms;

    const program = new Program(gl, { vertex, fragment, uniforms });
    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.iResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight, 1];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Auto-pause when barely visible or tab hidden (plan §10.1.3).
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = (entries[0]?.intersectionRatio ?? 0) > 0.05;
      },
      { threshold: [0, 0.05, 0.1] }
    );
    io.observe(container);
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible' && visibleRef.current;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const mouseTarget: [number, number] = [0, 0];
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = renderer.dpr || 1;
      mouseTarget[0] = (e.clientX - rect.left) * scale;
      mouseTarget[1] = (rect.height - (e.clientY - rect.top)) * scale;
      if (mouseDampening <= 0) {
        uniforms.iMouse.value = [...mouseTarget];
      }
    };
    // Window-level listener: the canvas never intercepts touch/scroll
    // (container is pointer-events:none — plan §10.8).
    if (mouseInteraction) window.addEventListener('pointermove', onPointerMove);

    let raf = 0;
    let lastTime = 0;
    let renderedOnce = false;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      // Static frame mode (reduced-motion): render exactly one frame.
      if (staticFrame && renderedOnce) return;
      if (pausedRef.current && renderedOnce) return;
      if (!visibleRef.current && renderedOnce) return;
      uniforms.iTime.value = t * 0.001;
      if (mouseDampening > 0) {
        if (!lastTime) lastTime = t;
        const dt = (t - lastTime) / 1000;
        lastTime = t;
        const tau = Math.max(1e-4, mouseDampening);
        const factor = Math.min(1, 1 - Math.exp(-dt / tau));
        const cur = uniforms.iMouse.value as number[];
        cur[0] += (mouseTarget[0] - cur[0]) * factor;
        cur[1] += (mouseTarget[1] - cur[1]) * factor;
      } else {
        lastTime = t;
      }
      try {
        renderer.render({ scene: mesh });
        renderedOnce = true;
      } catch {
        cancelAnimationFrame(raf);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (mouseInteraction) window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      io.disconnect();
      if (canvas.parentElement === container) container.removeChild(canvas);
      const callIfFn = (obj: unknown, key: string) => {
        const o = obj as Record<string, unknown> | null;
        if (o && typeof o[key] === 'function') (o[key] as () => void).call(o);
      };
      callIfFn(program, 'remove');
      callIfFn(geometry, 'remove');
      callIfFn(mesh, 'remove');
      callIfFn(renderer, 'destroy');
      uniformsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dpr,
    compactDpr,
    colorKey,
    backgroundColor,
    streakCount,
    streakWidth,
    streakLength,
    glow,
    twinkle,
    zoom,
    backgroundGlow,
    mouseInteraction,
    mouseStrength,
    mouseRadius,
    mouseDampening,
    staticFrame,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...(mixBlendMode ? { mixBlendMode } : {}),
      }}
    />
  );
});

export default Lightfall;
