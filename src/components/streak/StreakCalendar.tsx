// ════════════════════════════════════════════════════
// StreakCalendar — 30-Day Activity Calendar
// Visual grid showing daily activity with streak highlighting
// ════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Flame, Snowflake, Circle } from 'lucide-react';

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
  partOfStreak: boolean;
  freezeUsed: boolean;
  xpEarned: number;
}

interface StreakCalendarProps {
  days: CalendarDay[];
  streakCount: number;
  className?: string;
}

export function StreakCalendar({ days, streakCount, className = '' }: StreakCalendarProps) {
  // Get day of week for first day to align grid
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={`rounded-2xl bg-sf-console/60 border border-sf-console-border/30 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          30-Day Activity
        </h3>
        <span className="text-xs text-sf-console-text-dim">
          {streakCount} day{streakCount !== 1 ? 's' : ''} active
        </span>
      </div>

      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] text-sf-console-text-faint font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <CalendarCell key={day.date} day={day} index={index} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sf-console-border/30">
        <LegendItem color="bg-emerald-500" label="Active" />
        <LegendItem color="bg-sf-console-accent" label="Freeze" />
        <LegendItem color="bg-orange-500" label="Streak" />
        <LegendItem color="bg-sf-console-well" label="Missed" />
      </div>
    </div>
  );
}

function CalendarCell({ day, index }: { day: CalendarDay; index: number }) {
  const getCellStyle = () => {
    if (day.isFuture) {
      return 'bg-sf-console-raised/30 border-sf-console-border/10';
    }
    if (day.isToday) {
      if (day.active) {
        return 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30';
      }
      return 'bg-sf-console-well border-orange-400 ring-2 ring-orange-400/50';
    }
    if (day.freezeUsed) {
      return 'bg-sf-console-accent/40 border-sf-console-accent/60';
    }
    if (day.active && day.partOfStreak) {
      return 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-400';
    }
    if (day.active) {
      return 'bg-emerald-500/60 border-emerald-400/50';
    }
    if (day.partOfStreak) {
      return 'bg-orange-500/20 border-orange-500/30';
    }
    return 'bg-sf-console-raised border-sf-console-border/30';
  };

  const getIcon = () => {
    if (day.freezeUsed) return <Snowflake className="w-2.5 h-2.5 text-sf-console-accent-bright" />;
    if (day.active && day.partOfStreak) return <Flame className="w-2.5 h-2.5 text-white" />;
    if (day.active) return <Circle className="w-2 h-2 text-emerald-300 fill-emerald-300" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.01, duration: 0.2 }}
      className={`
        aspect-square rounded-lg border flex items-center justify-center
        transition-all duration-200 ${getCellStyle()}
        ${day.isToday ? 'relative' : ''}
      `}
      title={
        day.isToday
          ? 'Today'
          : day.active
            ? `${day.date}: ${day.xpEarned} XP`
            : day.freezeUsed
              ? `${day.date}: Freeze used`
              : day.date
      }
    >
      {getIcon()}

      {/* Today indicator dot */}
      {day.isToday && !day.active && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full" />
      )}
    </motion.div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-[10px] text-sf-console-text-dim">{label}</span>
    </div>
  );
}
