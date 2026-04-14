'use client';

// ================================================================
// useTriangleCounter — Dev/Admin Triangle Budget Counter (COCK-13)
// ================================================================
// Reads gl.info.render every SAMPLE_INTERVAL frames to report
// triangle count, draw calls, frame time, and FPS.
// Returns a stable stats object updated at ~1 Hz (every 60 frames).
//
// Usage (inside R3F component):
//   const stats = useTriangleCounter(enabled);
//   // stats.triangles, stats.overBudget, etc.

import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface TriangleStats {
  triangles: number;
  drawCalls: number;
  frameTimeMs: number;
  fps: number;
  overBudget: boolean;
}

const COCKPIT_BUDGET = 37_800_000;
const SAMPLE_INTERVAL = 60; // Update every 60 frames (~1 Hz at 60fps)

export function useTriangleCounter(enabled: boolean): TriangleStats {
  const { gl } = useThree();
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const [stats, setStats] = useState<TriangleStats>({
    triangles: 0,
    drawCalls: 0,
    frameTimeMs: 0,
    fps: 60,
    overBudget: false,
  });

  useFrame(() => {
    if (!enabled) return;
    frameRef.current++;
    if (frameRef.current % SAMPLE_INTERVAL !== 0) return;

    const now = performance.now();
    const elapsed = now - lastTimeRef.current;
    lastTimeRef.current = now;

    const info = gl.info;
    const triangles = info.render?.triangles ?? 0;
    const drawCalls = info.render?.calls ?? 0;
    const fps = Math.round((SAMPLE_INTERVAL / elapsed) * 1000);
    const frameTimeMs = Math.round((elapsed / SAMPLE_INTERVAL) * 100) / 100;

    setStats({
      triangles,
      drawCalls,
      frameTimeMs,
      fps,
      overBudget: triangles > COCKPIT_BUDGET,
    });
  });

  return stats;
}
