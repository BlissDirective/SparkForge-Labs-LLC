'use client';

// ════════════════════════════════════════════════════
// MemoryMonitor — dev-only Three.js allocation overlay
// Final-Audit 04-15-2026 finding PERF-CRIT-002 (Option C)
//
// Fixed-position HUD (top-right) that shows live + cumulative counts
// of Three.js resources created via useDisposable. Warns in the
// console when live counts exceed configurable thresholds, so
// creeping VRAM leaks surface visibly during extended play.
//
// Activation:
//   - process.env.NODE_ENV !== 'production'   AND
//   - localStorage.sparkforge_memory_monitor === '1'
//
// Users can enable from devtools:
//   localStorage.sparkforge_memory_monitor = '1'; location.reload();
//
// Zero cost in production bundles (guarded by NODE_ENV check that
// Next.js strips).
// ════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { getDisposableStats } from '@/hooks/useDisposable';

/** Warn in console when live Disposable count exceeds this. */
const LIVE_COUNT_WARN_THRESHOLD = 2000;
const REFRESH_INTERVAL_MS = 500;

export function MemoryMonitor() {
  const [enabled, setEnabled] = useState(false);
  const [stats, setStats] = useState(() => getDisposableStats());
  const warnedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window === 'undefined') return;
    const flag = window.localStorage.getItem('sparkforge_memory_monitor');
    if (flag === '1') setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const next = getDisposableStats();
      setStats(next);
      if (!warnedRef.current && next.currentLive > LIVE_COUNT_WARN_THRESHOLD) {
        warnedRef.current = true;
        // eslint-disable-next-line no-console
        console.warn(
          `[MemoryMonitor] Live disposable count ${next.currentLive} > threshold ${LIVE_COUNT_WARN_THRESHOLD}. ` +
            'Possible leak. Check which component type dominates:',
          next.byType,
        );
      }
      // Reset warn flag when we drop back under threshold so later spikes re-warn.
      if (warnedRef.current && next.currentLive < LIVE_COUNT_WARN_THRESHOLD * 0.75) {
        warnedRef.current = false;
      }
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (process.env.NODE_ENV === 'production' || !enabled) return null;

  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const liveHot = stats.currentLive > LIVE_COUNT_WARN_THRESHOLD;

  return (
    <div
      role="status"
      aria-label="Three.js memory monitor"
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 99999,
        padding: '8px 10px',
        background: 'rgba(10, 14, 22, 0.85)',
        border: `1px solid ${liveHot ? 'rgba(255, 102, 68, 0.6)' : 'rgba(0, 187, 255, 0.35)'}`,
        borderRadius: 8,
        font: '11px/1.4 ui-monospace, SFMono-Regular, monospace',
        color: '#e0e0e0',
        minWidth: 220,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#00BBFF' }}>
        MemoryMonitor (dev)
      </div>
      <div style={{ color: liveHot ? '#FF6644' : '#00FF88' }}>
        live: {stats.currentLive}
        {liveHot && ' ⚠'}
      </div>
      <div style={{ color: '#888' }}>
        allocated: {stats.totalAllocated} · disposed: {stats.totalDisposed}
      </div>
      {topTypes.length > 0 && (
        <div style={{ marginTop: 4, color: '#aaa' }}>
          {topTypes.map(([type, count]) => (
            <div key={type}>
              {type}: {count}
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 4, color: '#555', fontSize: 10 }}>
        localStorage.sparkforge_memory_monitor = &apos;0&apos; to hide
      </div>
    </div>
  );
}
