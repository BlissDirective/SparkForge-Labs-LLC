// ================================================================
// useFrameTimeMonitor — Non-Invasive Frame Time Monitoring (Plan B1)
// ================================================================
// Audit Report Section 4.4: No GPU tier-based effect degradation
//
// Monitors frame time via useFrame and logs warnings when performance
// degrades below target. Does NOT auto-degrade effects (D3D-5 honored).
//
// Future Plan B2 integration point: If persistent performance issues
// are detected, this hook could trigger adaptive degradation by
// dispatching to a performanceStore or modifying PostProcessingStack
// props. See CLAUDE.md Section 9.1 for B2 decision reference.
//
// Usage:
//   useFrameTimeMonitor(); // Inside any R3F component
//
// Output:
//   - Console warnings when avg frame time > 20ms (< 50fps)
//   - Exposes frameTimeStats ref for dev overlay consumption

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

interface FrameTimeStats {
  /** Current frame time in ms */
  current: number;
  /** Average frame time over sample window (ms) */
  average: number;
  /** Max frame time in current window (ms) */
  max: number;
  /** Min frame time in current window (ms) */
  min: number;
  /** Estimated FPS based on average */
  fps: number;
  /** Number of frames below 50fps in current window */
  droppedFrames: number;
  /** Total frames sampled */
  totalFrames: number;
}

interface UseFrameTimeMonitorOptions {
  /** Number of frames to average over (default: 60) */
  sampleSize?: number;
  /** Frame time threshold in ms to trigger warning (default: 20 = 50fps) */
  warningThresholdMs?: number;
  /** How often to log warnings, in sample windows (default: 5 = every 300 frames at 60 samples) */
  warningInterval?: number;
  /** Enable/disable monitoring (default: dev-only) */
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<UseFrameTimeMonitorOptions> = {
  sampleSize: 60,
  warningThresholdMs: 20,
  warningInterval: 5,
  enabled: process.env.NODE_ENV === 'development',
};

/**
 * Non-invasive frame time monitor. Runs inside R3F render loop.
 * Returns a ref to current frame time statistics.
 *
 * Plan B1: Monitor-only, no automatic effect degradation.
 * Honors D3D-5 (all effects always-on).
 */
export function useFrameTimeMonitor(options: UseFrameTimeMonitorOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const frameTimes = useRef<number[]>([]);
  const windowCount = useRef(0);
  const stats = useRef<FrameTimeStats>({
    current: 0,
    average: 0,
    max: 0,
    min: Infinity,
    fps: 60,
    droppedFrames: 0,
    totalFrames: 0,
  });

  const processWindow = useCallback(() => {
    const times = frameTimes.current;
    if (times.length === 0) return;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const dropped = times.filter((t) => t > opts.warningThresholdMs).length;

    stats.current = {
      current: times[times.length - 1],
      average: avg,
      max: maxTime,
      min: minTime,
      fps: avg > 0 ? 1000 / avg : 60,
      droppedFrames: dropped,
      totalFrames: stats.current.totalFrames + times.length,
    };

    windowCount.current += 1;

    // Log warning if average exceeds threshold
    if (avg > opts.warningThresholdMs && windowCount.current % opts.warningInterval === 0) {
      console.warn(
        `[FrameTimeMonitor] Performance warning: avg ${avg.toFixed(1)}ms (${stats.current.fps.toFixed(0)}fps), ` +
        `${dropped}/${times.length} frames above ${opts.warningThresholdMs}ms threshold. ` +
        `Max: ${maxTime.toFixed(1)}ms, Min: ${minTime.toFixed(1)}ms. ` +
        `Consider Plan B2 adaptive degradation if this persists.`
      );
    }

    frameTimes.current = [];
  }, [opts.warningThresholdMs, opts.warningInterval]);

  useFrame((_, delta) => {
    if (!opts.enabled) return;

    const frameTimeMs = delta * 1000;
    frameTimes.current.push(frameTimeMs);

    if (frameTimes.current.length >= opts.sampleSize) {
      processWindow();
    }
  });

  return stats;
}
