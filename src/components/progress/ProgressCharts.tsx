// ════════════════════════════════════════════════════════════════
// PROGRESS CHARTS — SVG Data Visualizations (Phase 5)
// ════════════════════════════════════════════════════════════════
// Kid-friendly SVG charts for the progress page:
// - Horizontal bar chart: lab breakdown comparison
// - Donut chart: overall completion ring
// - Sparkline: weekly activity trend
// All rendered as pure SVG for crisp scaling and zero dependencies.

'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

// ── Types ──
interface LabData {
  name: string;
  percent: number;
  color: string;
  gamesCompleted: number;
  totalGames: number;
}

interface WeeklyPoint {
  day: string;
  minutes: number;
}

interface ProgressChartsProps {
  labData: LabData[];
  overallPercent: number;
  weeklyActivity?: WeeklyPoint[];
  totalGamesPlayed?: number;
  totalTimeMinutes?: number;
}

// ── Donut Chart ──
function DonutChart({ percent, size = 140, strokeWidth = 12 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 75 ? '#2ECC71' : percent >= 50 ? '#4F6EF7' : percent >= 25 ? '#FF6B35' : '#E945F5';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EEF0F8"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#donutGradient-${percent})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />
        <defs>
          <linearGradient id={`donutGradient-${percent}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={`${color}CC`} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-extrabold"
          style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          {Math.round(percent)}%
        </motion.span>
        <span className="text-[10px] font-medium" style={{ color: '#8C94AC' }}>Complete</span>
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ──
function BarChart({ data }: { data: LabData[] }) {
  const maxVal = Math.max(...data.map((d) => d.percent), 1);
  const displayData = data.slice(0, 6); // Show top 6

  return (
    <div className="space-y-3">
      {displayData.map((lab, i) => (
        <motion.div
          key={lab.name}
          className="group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold w-24 truncate text-right shrink-0" style={{ color: '#5A6078' }}>
              {lab.name}
            </span>
            <div className="flex-1 h-7 rounded-lg overflow-hidden relative" style={{ background: '#F0F1F8' }}>
              <motion.div
                className="h-full rounded-lg flex items-center justify-end pr-2"
                style={{ background: `linear-gradient(90deg, ${lab.color}33, ${lab.color}66)` }}
                initial={{ width: 0 }}
                animate={{ width: `${(lab.percent / maxVal) * 100}%` }}
                transition={{ delay: i * 0.08 + 0.3, duration: 0.6, ease: 'easeOut' }}
              >
                {lab.percent >= 20 && (
                  <span className="text-xs font-bold" style={{ color: lab.color }}>
                    {lab.percent}%
                  </span>
                )}
              </motion.div>
              {lab.percent < 20 && (
                <span
                  className="absolute inset-y-0 right-2 flex items-center text-xs font-bold"
                  style={{ color: lab.color }}
                >
                  {lab.percent}%
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] ml-27 pl-27 mt-0.5" style={{ color: '#8C94AC', marginLeft: '108px' }}>
            {lab.gamesCompleted}/{lab.totalGames} games
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Sparkline Chart ──
function Sparkline({ data }: { data: WeeklyPoint[] }) {
  const width = 280;
  const height = 60;
  const padding = 4;

  const maxVal = Math.max(...data.map((d) => d.minutes), 1);
  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - (d.minutes / maxVal) * (height - padding * 2),
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 3;
    const cpx2 = prev.x + (2 * (p.x - prev.x)) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  // Area path (for gradient fill)
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="flex items-end gap-4">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-1">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F6EF7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#sparklineGrad)" />
        <motion.path
          d={pathD}
          fill="none"
          stroke="#4F6EF7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#4F6EF7"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
          />
        ))}
      </svg>
      <div className="flex flex-col justify-between h-[60px] text-[10px] shrink-0" style={{ color: '#8C94AC' }}>
        <span>{maxVal}m</span>
        <span>0</span>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function ProgressCharts({
  labData,
  overallPercent,
  weeklyActivity,
  totalGamesPlayed,
  totalTimeMinutes,
}: ProgressChartsProps) {
  // Real data only. The old placeholder week rendered a fake activity
  // curve next to "0 Games Played / 0h", which looks like broken
  // tracking. An empty week shows a flat zero baseline instead.
  const emptyWeek: WeeklyPoint[] = useMemo(
    () =>
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        minutes: 0,
      })),
    []
  );

  const hasActivity = !!weeklyActivity && weeklyActivity.length > 0;
  const sparkData = hasActivity ? weeklyActivity : emptyWeek;

  return (
    <div className="space-y-6">
      {/* Top row: Donut + Sparkline side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Overall completion donut */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center"
          style={{ background: '#FFFFFF', border: '1px solid #EEF0F8' }}
        >
          <h3 className="text-sm font-bold mb-3 self-start flex items-center gap-2" style={{ color: '#1A1D2B' }}>
            <TrendingUp className="w-4 h-4" style={{ color: '#4F6EF7' }} />
            Overall Completion
          </h3>
          <DonutChart percent={overallPercent} />
          <div className="flex gap-4 mt-3">
            {totalGamesPlayed !== undefined && (
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: '#1A1D2B' }}>{totalGamesPlayed}</p>
                <p className="text-[10px]" style={{ color: '#8C94AC' }}>Games Played</p>
              </div>
            )}
            {totalTimeMinutes !== undefined && (
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: '#1A1D2B' }}>
                  {Math.round(totalTimeMinutes / 60)}h
                </p>
                <p className="text-[10px]" style={{ color: '#8C94AC' }}>Total Time</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly activity sparkline */}
        <div
          className="rounded-2xl p-5"
          style={{ background: '#FFFFFF', border: '1px solid #EEF0F8' }}
        >
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1A1D2B' }}>
            <Calendar className="w-4 h-4" style={{ color: '#2ECC71' }} />
            This Week
          </h3>
          <Sparkline data={sparkData} />
          <div className="flex justify-between mt-2">
            {sparkData.map((d) => (
              <span key={d.day} className="text-[10px] font-medium" style={{ color: '#8C94AC' }}>
                {d.day}
              </span>
            ))}
          </div>
          {!hasActivity && (
            <p className="text-xs mt-2" style={{ color: '#8C94AC' }}>
              No play time yet this week — jump into a game to get started!
            </p>
          )}
        </div>
      </div>

      {/* Lab breakdown bar chart */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#FFFFFF', border: '1px solid #EEF0F8' }}
      >
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#1A1D2B' }}>
          <BarChart3 className="w-4 h-4" style={{ color: '#E945F5' }} />
          Progress by Lab
        </h3>
        {labData.length === 0 ? (
          <p className="text-xs" style={{ color: '#8C94AC' }}>
            Lab-by-lab progress appears here after your first game.
          </p>
        ) : (
          <BarChart data={labData} />
        )}
      </div>
    </div>
  );
}
