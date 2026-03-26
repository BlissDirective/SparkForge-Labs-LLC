 
 
// ================================================================
// TSL Port — Lab 3: Neural Pulse Ripples (Section 4.1-A WebGPU Shader Port)
// ================================================================
// Original: src/shaders/labPatterns/neuralLab.glsl
// TSL auto-compiles to WGSL (WebGPU) and GLSL (WebGL2)

import {
  Fn, float, vec2, vec3, vec4,
  sin, cos, abs, fract, floor, smoothstep, distance, length, dot, normalize,
  mul, add, sub, div, max, min, clamp,
  uv, uniform,
} from 'three/tsl';
import { Color, Vector2 } from 'three';

const uTime = uniform(0);
const uLabColor = uniform(new Color('#FF66AA'));
const uIntensity = uniform(1.0);
const uResolution = uniform(new Vector2(1920, 1080));

/** Create the TSL fragment output for Lab 3: Neural Pulse Ripples */
export const lab3Pattern = Fn(() => {
  const uvCoord = uv();
  const t = mul(uTime, float(0.4));

  let totalPulse: any = float(0.0);

  // 5 synapse firing points
  for (let i = 0; i < 5; i++) {
    const fi = float(i);

    // Node position drifts slowly
    const nodePos = vec2(
      add(float(0.2), mul(float(0.6), sin(add(mul(t, float(0.3)), mul(fi, float(1.256)))))),
      add(float(0.2), mul(float(0.6), cos(add(mul(t, float(0.25)), mul(fi, float(0.943))))))
    );
    const dist = distance(uvCoord, nodePos);

    // Expanding ring pulse
    const pulseTime = fract(add(mul(t, float(0.5)), mul(fi, float(0.2))));
    const ringRadius = mul(pulseTime, float(0.5));
    const ring = mul(smoothstep(float(0.02), float(0.0), abs(sub(dist, ringRadius))), sub(float(1.0), pulseTime));

    // Central glow at node
    const nodeGlow = div(float(0.02), add(mul(dist, dist), float(0.01)));
    const glowPulse = mul(nodeGlow, add(float(0.5), mul(float(0.5), sin(add(mul(t, float(3.0)), mul(fi, float(2.0)))))));

    totalPulse = add(totalPulse, add(ring, mul(glowPulse, float(0.1)))) as any;
  }

  // Connection lines between nodes (simplified: 4 connections)
  let connections: any = float(0.0);
  for (let i = 0; i < 4; i++) {
    const fi = float(i);
    const fi1 = float(i + 1);

    const p1 = vec2(
      add(float(0.2), mul(float(0.6), sin(add(mul(t, float(0.3)), mul(fi, float(1.256)))))),
      add(float(0.2), mul(float(0.6), cos(add(mul(t, float(0.25)), mul(fi, float(0.943))))))
    );
    const p2 = vec2(
      add(float(0.2), mul(float(0.6), sin(add(mul(t, float(0.3)), mul(fi1, float(1.256)))))),
      add(float(0.2), mul(float(0.6), cos(add(mul(t, float(0.25)), mul(fi1, float(0.943))))))
    );

    // Line distance approximation
    const dir = sub(p2, p1);
    const len = max(length(dir), float(0.001));
    const norm = div(dir, len);
    const proj = clamp(dot(sub(uvCoord, p1), norm), float(0.0), len);
    const closest = add(p1, mul(norm, proj));
    const lineDist = distance(uvCoord, closest);

    // Traveling pulse along connection
    const pulse = add(mul(sin(sub(mul(div(proj, len), float(6.2832)), add(mul(t, float(4.0)), fi))), float(0.5)), float(0.5));
    connections = add(connections, mul(mul(smoothstep(float(0.008), float(0.002), lineDist), pulse), float(0.3))) as any;
  }

  totalPulse = add(totalPulse, connections) as any;

  const color = mul(vec3(uLabColor), totalPulse);
  const alpha = clamp(mul(mul(totalPulse, uIntensity), float(0.4)), float(0.0), float(0.35));

  return vec4(color, alpha);
});

/** Get uniforms for external control */
export function getLab3Uniforms() {
  return { uTime, uLabColor, uIntensity, uResolution };
}
