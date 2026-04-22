// ════════════════════════════════════════════════════════════════
// fpsTelemetry — Phase 5 task #1 (§10.11) Ultra sub-module
// Ring-buffer FPS + frame-time telemetry for OffscreenCanvas worker
// ════════════════════════════════════════════════════════════════
// Problem: once the render loop moves to a worker, the main thread
// can't observe frame time directly. Sentry's Web Vitals don't cover
// worker-context rAF loops. We need our own telemetry.
//
// Design:
//   - Fixed-size ring buffer (128 samples = ~2s @ 60fps).
//   - Per-frame: record frame-time (ms) and GPU-time (ms, if query
//     extension is available).
//   - Every `reportIntervalMs` (default 1000ms) compute aggregates
//     (p50/p95/p99 + mean + min + max) and emit via `onReport`.
//   - Reports are the ONLY thing that crosses the worker→main boundary.
//     No per-frame postMessage — that would defeat the purpose.
//
// Works equally on main-thread and worker-thread (no `window`/`document`
// references). Consumers on main thread can instrument existing Canvas
// too as a baseline, since TrFlask comparison informs Phase 5 metrics.
// ════════════════════════════════════════════════════════════════

export type FpsReport = {
  /** Timestamp of the report, worker-context `performance.now()` ms. */
  t: number;
  /** Samples included in this report window. */
  samples: number;
  /** Frame time stats (ms). */
  frame: { mean: number; min: number; max: number; p50: number; p95: number; p99: number };
  /** Derived FPS from mean frame time. */
  fps: number;
  /** GPU time stats (ms), when the query extension was available. */
  gpu?: { mean: number; min: number; max: number; p50: number; p95: number; p99: number };
  /** Frames below the target FPS threshold within the report window. */
  slowFrames: number;
  /** Frames above 50ms (>1 frame dropped) within the window. */
  freezeFrames: number;
};

export interface FpsTelemetryOptions {
  /** Samples the ring buffer keeps (default 128 = ~2s @ 60fps). */
  ringSize?: number;
  /** Report interval in ms (default 1000). */
  reportIntervalMs?: number;
  /** Target FPS below which a frame counts as "slow" (default 55). */
  slowFrameTargetFps?: number;
  /** Hook fired every time a report is emitted. */
  onReport?: (report: FpsReport) => void;
}

export interface FpsTelemetry {
  /** Record a frame — call at the end of each rAF tick. */
  recordFrame(frameTimeMs: number, gpuTimeMs?: number): void;
  /** Force-emit a report right now. */
  flush(): FpsReport | null;
  /** Stop the periodic reporter and drop all listeners. */
  stop(): void;
  /** Snapshot current ring contents without emitting a report. */
  snapshot(): { frameTimes: Float32Array; gpuTimes: Float32Array | null };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

function stats(values: number[]): FpsReport['frame'] {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    mean: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

export function createFpsTelemetry(opts: FpsTelemetryOptions = {}): FpsTelemetry {
  const ringSize = opts.ringSize ?? 128;
  const reportIntervalMs = opts.reportIntervalMs ?? 1000;
  const slowThresholdMs = 1000 / (opts.slowFrameTargetFps ?? 55);
  const frameTimes = new Float32Array(ringSize);
  const gpuTimes = new Float32Array(ringSize);
  let hasGpu = false;
  let write = 0;
  let filled = 0;

  const getNow = (): number =>
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();

  const emit = (): FpsReport | null => {
    if (filled === 0) return null;
    const len = Math.min(filled, ringSize);
    const frameArr: number[] = [];
    const gpuArr: number[] = [];
    for (let i = 0; i < len; i++) {
      frameArr.push(frameTimes[i]);
      if (hasGpu) gpuArr.push(gpuTimes[i]);
    }
    const frame = stats(frameArr);
    const fps = frame.mean > 0 ? 1000 / frame.mean : 0;
    let slow = 0;
    let freeze = 0;
    for (const ft of frameArr) {
      if (ft > slowThresholdMs) slow += 1;
      if (ft > 50) freeze += 1;
    }
    const report: FpsReport = {
      t: getNow(),
      samples: len,
      frame,
      fps,
      slowFrames: slow,
      freezeFrames: freeze,
    };
    if (hasGpu) report.gpu = stats(gpuArr);
    opts.onReport?.(report);
    return report;
  };

  let timer: ReturnType<typeof setInterval> | null = null;
  if (typeof setInterval !== 'undefined') {
    timer = setInterval(() => emit(), reportIntervalMs);
  }

  return {
    recordFrame(frameTimeMs: number, gpuTimeMs?: number) {
      frameTimes[write] = frameTimeMs;
      if (typeof gpuTimeMs === 'number') {
        gpuTimes[write] = gpuTimeMs;
        hasGpu = true;
      }
      write = (write + 1) % ringSize;
      filled = Math.min(filled + 1, ringSize);
    },
    flush: emit,
    stop() {
      if (timer != null) clearInterval(timer);
      timer = null;
    },
    snapshot() {
      return {
        frameTimes: Float32Array.from(frameTimes),
        gpuTimes: hasGpu ? Float32Array.from(gpuTimes) : null,
      };
    },
  };
}
