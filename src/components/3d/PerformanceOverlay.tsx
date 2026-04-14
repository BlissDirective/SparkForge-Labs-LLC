'use client';

// ════════════════════════════════════════════════════════════════
// PerformanceOverlay — Dev/Admin Triangle Counter (COCK-13, Option A2)
// ════════════════════════════════════════════════════════════════
// Compact semi-transparent overlay in the bottom-right corner showing:
//   - Triangle count (color-coded vs 37.8M cockpit budget)
//   - Draw calls
//   - Frame time (ms)
//   - FPS
//
// Visibility rules:
//   - Development: always shown
//   - Production: shown only when uiStore.showPerfStats === true
//     (toggled by admin users in SettingsPanel)
//
// Architecture: Two-part design —
//   1. TriangleStatsCollector (R3F component inside Canvas) reads gl.info
//      via useTriangleCounter and writes to a module-level ref.
//   2. PerformanceOverlayHTML (DOM component outside Canvas) reads the
//      ref and renders the overlay. This avoids drei <Html> overhead.

import React, { useRef, useEffect, useState } from 'react';
import { useTriangleCounter, type TriangleStats } from '@/hooks/useTriangleCounter';

// ── Module-level shared ref for cross-boundary communication ────
// The R3F collector writes here; the DOM overlay reads from here.
let _sharedStats: TriangleStats = {
  triangles: 0,
  drawCalls: 0,
  frameTimeMs: 0,
  fps: 60,
  overBudget: false,
};

export function getSharedTriangleStats(): TriangleStats {
  return _sharedStats;
}

// ── Budget thresholds ───────────────────────────────────────────
const COCKPIT_BUDGET = 37_800_000;
const WARNING_THRESHOLD = 0.8; // 80% of budget = amber

function getBudgetColor(triangles: number): string {
  const ratio = triangles / COCKPIT_BUDGET;
  if (ratio > 1.0) return '#FF4444'; // red — over budget
  if (ratio > WARNING_THRESHOLD) return '#FFAA44'; // amber — approaching budget
  return '#00FF88'; // green — under budget
}

function formatTriangles(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

// ════════════════════════════════════════════════════════════════
// Part 1: R3F Stats Collector (renders inside Canvas)
// ════════════════════════════════════════════════════════════════

export function TriangleStatsCollector({ enabled }: { enabled: boolean }) {
  const stats = useTriangleCounter(enabled);

  // Write to module-level ref on every update
  _sharedStats = stats;

  return null; // No 3D geometry — pure data collection
}

// ════════════════════════════════════════════════════════════════
// Part 2: DOM Overlay (renders outside Canvas, in CockpitCanvas wrapper div)
// ════════════════════════════════════════════════════════════════

export function PerformanceOverlayHTML({ enabled }: { enabled: boolean }) {
  const [stats, setStats] = useState<TriangleStats>(_sharedStats);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Poll the shared stats at ~4 Hz (every 250ms) to keep DOM updates minimal
    let lastUpdate = 0;
    const tick = (time: number) => {
      if (time - lastUpdate > 250) {
        lastUpdate = time;
        setStats({ ..._sharedStats });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled]);

  if (!enabled) return null;

  const budgetColor = getBudgetColor(stats.triangles);
  const budgetPct = ((stats.triangles / COCKPIT_BUDGET) * 100).toFixed(0);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        background: 'rgba(10, 14, 22, 0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: '8px 12px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
        lineHeight: '16px',
        color: '#AAB4C2',
        pointerEvents: 'none',
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        minWidth: 170,
      }}
      aria-hidden="true"
    >
      {/* Header */}
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#667788',
          marginBottom: 4,
        }}
      >
        Triangle Budget
      </div>

      {/* Triangle count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>Tris</span>
        <span style={{ color: budgetColor, fontWeight: 600 }}>
          {formatTriangles(stats.triangles)}{' '}
          <span style={{ fontSize: 9, opacity: 0.7 }}>({budgetPct}%)</span>
        </span>
      </div>

      {/* Draw calls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>Draws</span>
        <span>{stats.drawCalls}</span>
      </div>

      {/* Frame time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>Frame</span>
        <span style={{ color: stats.frameTimeMs > 20 ? '#FF4444' : '#AAB4C2' }}>
          {stats.frameTimeMs.toFixed(1)}ms
        </span>
      </div>

      {/* FPS */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>FPS</span>
        <span
          style={{
            color: stats.fps < 30 ? '#FF4444' : stats.fps < 50 ? '#FFAA44' : '#00FF88',
          }}
        >
          {stats.fps}
        </span>
      </div>

      {/* Over-budget warning */}
      {stats.overBudget && (
        <div
          style={{
            marginTop: 4,
            padding: '2px 6px',
            background: 'rgba(255, 68, 68, 0.2)',
            borderRadius: 3,
            color: '#FF4444',
            fontSize: 9,
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          OVER BUDGET
        </div>
      )}
    </div>
  );
}
