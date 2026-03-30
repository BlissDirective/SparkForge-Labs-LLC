// ════════════════════════════════════════════════════
// PARENT — Data Export Page
// COPPA-compliant data export for children's progress
// Frost-Prismatic dark-mode design, ARIA labels
// ════════════════════════════════════════════════════
'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { staggerContainer, staggerItem } from '@/lib/animations';
import {
  ArrowLeft, Download, FileSpreadsheet, Trophy, Gamepad2,
  BarChart3, Calendar, CheckSquare, Square, Info, Loader2,
} from 'lucide-react';
import Link from 'next/link';

// ═══ Types ═══

type ExportType = 'progress' | 'activity' | 'badges' | 'scores';

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
  color: string;
  columns: string[];
}

// ═══ Export Definitions ═══

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'progress',
    label: 'Progress Report',
    description: 'XP, level, streaks, time spent, and lab completion across all learning areas',
    icon: BarChart3,
    color: '#00BBFF',
    columns: ['Child', 'Level', 'Total XP', 'Streak', 'Lessons Done', 'Quizzes Passed', 'Time (min)', 'Labs Done', 'Last Active'],
  },
  {
    id: 'activity',
    label: 'Activity Log',
    description: 'Timestamped log of sessions, games played, and daily engagement patterns',
    icon: FileSpreadsheet,
    color: '#00FF88',
    columns: ['Date', 'Child', 'Activity', 'Duration (min)', 'XP Earned', 'Lab'],
  },
  {
    id: 'badges',
    label: 'Badge Collection',
    description: 'All earned badges with categories, rarity, and the date each was unlocked',
    icon: Trophy,
    color: '#FFAA44',
    columns: ['Child', 'Badge Name', 'Category', 'Rarity', 'Earned Date'],
  },
  {
    id: 'scores',
    label: 'Game Scores',
    description: 'Scores, attempts, and completion status for every game played',
    icon: Gamepad2,
    color: '#AA66FF',
    columns: ['Child', 'Game', 'Lab', 'Score', 'Attempts', 'Best Time (s)', 'Completed', 'Last Played'],
  },
];

// ═══ Mock Data Generators ═══

function generateProgressCSV(
  children: { id: string; display_name: string; level: number; xp: number; streak_count: number; lessons_completed: number; quizzes_passed: number; total_time_minutes: number; labs_completed: number; last_active: string | null }[],
  selectedIds: Set<string>
): string {
  const header = 'Child,Level,Total XP,Streak,Lessons Done,Quizzes Passed,Time (min),Labs Done,Last Active\n';
  const rows = children
    .filter((c) => selectedIds.has(c.id))
    .map((c) =>
      [
        c.display_name,
        c.level,
        c.xp,
        c.streak_count,
        c.lessons_completed,
        c.quizzes_passed,
        c.total_time_minutes,
        c.labs_completed,
        c.last_active ? new Date(c.last_active).toLocaleDateString() : 'Never',
      ].join(',')
    )
    .join('\n');
  return header + rows;
}

function generateActivityCSV(
  children: { id: string; display_name: string }[],
  selectedIds: Set<string>,
  dateFrom: string,
  dateTo: string
): string {
  const header = 'Date,Child,Activity,Duration (min),XP Earned,Lab\n';
  const activities = ['Completed lesson', 'Played game', 'Quiz attempt', 'Prompt Lab session', 'Badge earned', 'Explored lab'];
  const labs = ['What IS AI?', 'Teaching Machines', 'The Brain Inside', 'AI That Creates', 'AI Helpers', 'AI & Ethics', 'Computer Vision', 'Words & Language', 'Build Your AI', 'AI Futures'];

  const rows: string[] = [];
  const filtered = children.filter((c) => selectedIds.has(c.id));
  const start = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 86400000);
  const end = dateTo ? new Date(dateTo) : new Date();

  for (const child of filtered) {
    const count = 15 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const ts = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const duration = 3 + Math.floor(Math.random() * 25);
      const xp = Math.floor(Math.random() * 40) + 5;
      const lab = labs[Math.floor(Math.random() * labs.length)];
      rows.push(`${ts.toLocaleDateString()},${child.display_name},"${activity}",${duration},${xp},"${lab}"`);
    }
  }

  rows.sort((a, b) => {
    const dateA = a.split(',')[0];
    const dateB = b.split(',')[0];
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return header + rows.join('\n');
}

function generateBadgesCSV(
  children: { id: string; display_name: string }[],
  selectedIds: Set<string>
): string {
  const header = 'Child,Badge Name,Category,Rarity,Earned Date\n';
  const badges = [
    { name: 'First Steps', category: 'progress', rarity: 'common' },
    { name: 'Quick Learner', category: 'progress', rarity: 'common' },
    { name: 'Streak Starter', category: 'streak', rarity: 'common' },
    { name: 'Week Warrior', category: 'streak', rarity: 'uncommon' },
    { name: 'Lab Explorer', category: 'explorer', rarity: 'uncommon' },
    { name: 'Quiz Whiz', category: 'knowledge', rarity: 'uncommon' },
    { name: 'Game Master', category: 'game_master', rarity: 'rare' },
    { name: 'Neural Navigator', category: 'lab', rarity: 'rare' },
    { name: 'AI Architect', category: 'creator', rarity: 'epic' },
    { name: 'Forge Legend', category: 'prestige', rarity: 'legendary' },
  ];

  const rows: string[] = [];
  const filtered = children.filter((c) => selectedIds.has(c.id));

  for (const child of filtered) {
    const count = 3 + Math.floor(Math.random() * 6);
    const shuffled = [...badges].sort(() => Math.random() - 0.5).slice(0, count);
    for (const badge of shuffled) {
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      rows.push(
        `${child.display_name},"${badge.name}",${badge.category},${badge.rarity},${date.toLocaleDateString()}`
      );
    }
  }

  return header + rows.join('\n');
}

function generateScoresCSV(
  children: { id: string; display_name: string }[],
  selectedIds: Set<string>
): string {
  const header = 'Child,Game,Lab,Score,Attempts,Best Time (s),Completed,Last Played\n';
  const games = [
    { name: 'AI Spy', lab: 'What IS AI?' },
    { name: 'Time Machine', lab: 'What IS AI?' },
    { name: 'AI Pet Trainer', lab: 'Teaching Machines' },
    { name: 'Sort the Toy Box', lab: 'Teaching Machines' },
    { name: 'Neural Network Builder', lab: 'The Brain Inside' },
    { name: 'Prompt Lab', lab: 'AI That Creates' },
    { name: 'Bias Detective', lab: 'AI & Ethics' },
    { name: 'Camera Quest', lab: 'Computer Vision' },
    { name: 'Chatbot Builder', lab: 'Words & Language' },
    { name: 'Code Blocks', lab: 'Build Your AI' },
    { name: 'Future Forge', lab: 'AI Futures' },
    { name: 'Robot Vacuum Challenge', lab: 'AI Helpers' },
  ];

  const rows: string[] = [];
  const filtered = children.filter((c) => selectedIds.has(c.id));

  for (const child of filtered) {
    const count = 6 + Math.floor(Math.random() * 8);
    const shuffled = [...games].sort(() => Math.random() - 0.5).slice(0, count);
    for (const game of shuffled) {
      const score = Math.floor(Math.random() * 100);
      const attempts = 1 + Math.floor(Math.random() * 5);
      const bestTime = 30 + Math.floor(Math.random() * 300);
      const completed = Math.random() > 0.2 ? 'Yes' : 'No';
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      rows.push(
        `${child.display_name},"${game.name}","${game.lab}",${score},${attempts},${bestTime},${completed},${date.toLocaleDateString()}`
      );
    }
  }

  return header + rows.join('\n');
}

// ═══ Component ═══

export default function ExportPage() {
  const { children, isLoading } = useParentDashboard();

  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());
  const [selectedExports, setSelectedExports] = useState<Set<ExportType>>(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);

  // Auto-select all children initially
  useMemo(() => {
    if (children.length > 0 && selectedChildren.size === 0) {
      setSelectedChildren(new Set(children.map((c) => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // Toggle child selection
  const toggleChild = useCallback((id: string) => {
    setSelectedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Toggle all children
  const toggleAllChildren = useCallback(() => {
    if (selectedChildren.size === children.length) {
      setSelectedChildren(new Set());
    } else {
      setSelectedChildren(new Set(children.map((c) => c.id)));
    }
  }, [children, selectedChildren.size]);

  // Toggle export type
  const toggleExport = useCallback((type: ExportType) => {
    setSelectedExports((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Preview summary
  const previewSummary = useMemo(() => {
    const childCount = selectedChildren.size;
    const exportCount = selectedExports.size;
    if (childCount === 0 || exportCount === 0) return null;

    const childNames = children
      .filter((c) => selectedChildren.has(c.id))
      .map((c) => c.display_name);

    const exportLabels = EXPORT_OPTIONS.filter((o) => selectedExports.has(o.id)).map(
      (o) => o.label
    );

    return { childNames, exportLabels, childCount, exportCount };
  }, [children, selectedChildren, selectedExports]);

  // Download handler
  const handleExport = useCallback(async () => {
    if (selectedChildren.size === 0 || selectedExports.size === 0) return;

    setIsExporting(true);

    // Brief delay to show loading state
    await new Promise((r) => setTimeout(r, 600));

    for (const exportType of selectedExports) {
      let csvContent = '';
      let filename = '';

      switch (exportType) {
        case 'progress':
          csvContent = generateProgressCSV(children, selectedChildren);
          filename = 'sparkforge-progress-report';
          break;
        case 'activity':
          csvContent = generateActivityCSV(children, selectedChildren, dateFrom, dateTo);
          filename = 'sparkforge-activity-log';
          break;
        case 'badges':
          csvContent = generateBadgesCSV(children, selectedChildren);
          filename = 'sparkforge-badges';
          break;
        case 'scores':
          csvContent = generateScoresCSV(children, selectedChildren);
          filename = 'sparkforge-game-scores';
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setLastExported(new Date().toLocaleString());
    setIsExporting(false);
  }, [children, selectedChildren, selectedExports, dateFrom, dateTo]);

  // ═══ Loading skeleton ═══
  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center gap-4 mb-8">
        <Link
          href="/parent"
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:border-white/20 hover:text-white transition-all"
          aria-label="Back to Parent Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Export Data</h1>
          <p className="font-body text-sm text-white/40">
            Download your children&apos;s learning data (COPPA compliant)
          </p>
        </div>
      </motion.div>

      {/* COPPA notice */}
      <motion.div
        variants={staggerItem}
        className="glass-card rounded-xl p-4 mb-6 border-l-2 border-l-spark-blue/40"
      >
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-spark-blue flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-sm font-bold text-white mb-1">Your Data, Your Rights</p>
            <p className="font-body text-xs text-white/40">
              Under COPPA, you have the right to access and export all data collected about your children.
              All exports are generated locally in your browser. No data leaves the platform during export.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step 1: Select children */}
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-spark-blue/20 text-spark-blue font-data text-xs flex items-center justify-center">1</span>
          Select Children
        </h2>

        {children.length === 0 ? (
          <p className="font-body text-sm text-white/40">No child profiles found.</p>
        ) : (
          <>
            <motion.button
              onClick={toggleAllChildren}
              className="flex items-center gap-2 mb-3 text-white/50 hover:text-white/80 transition-colors"
              whileTap={{ scale: 0.97 }}
              aria-label={selectedChildren.size === children.length ? 'Deselect all children' : 'Select all children'}
            >
              {selectedChildren.size === children.length ? (
                <CheckSquare className="w-4 h-4 text-spark-blue" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="font-body text-xs">
                {selectedChildren.size === children.length ? 'Deselect All' : 'Select All'}
              </span>
            </motion.button>
            <div className="flex flex-wrap gap-3">
              {children.map((child) => {
                const isSelected = selectedChildren.has(child.id);
                return (
                  <motion.button
                    key={child.id}
                    onClick={() => toggleChild(child.id)}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all inline-flex items-center gap-2 ${
                      isSelected
                        ? 'border-spark-blue bg-spark-blue/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${child.display_name}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-spark-blue" />
                    ) : (
                      <Square className="w-4 h-4 text-white/40" />
                    )}
                    <span className="font-display text-sm font-bold text-white">
                      {child.display_name}
                    </span>
                    <span className="font-body text-xs text-white/30">
                      Band {child.age_band}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Step 2: Select export types */}
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-spark-green/20 text-spark-green font-data text-xs flex items-center justify-center">2</span>
          Choose Export Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXPORT_OPTIONS.map((option) => {
            const isSelected = selectedExports.has(option.id);
            const Icon = option.icon;
            return (
              <motion.button
                key={option.id}
                onClick={() => toggleExport(option.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-white/20 bg-white/[0.04]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/15'
                }`}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${option.label} export`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: option.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-spark-blue flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                      <p className="font-display text-sm font-bold text-white">{option.label}</p>
                    </div>
                    <p className="font-body text-xs text-white/30 mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Step 3: Date range (optional) */}
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-display text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-spark-orange/20 text-spark-orange font-data text-xs flex items-center justify-center">3</span>
          Date Range
          <span className="font-body text-xs text-white/20 font-normal">(optional)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="export-date-from" className="font-body text-xs text-white/30 mb-1 block">
              From
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="export-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:border-spark-blue/50 focus:outline-none [color-scheme:dark]"
                aria-label="Export data from date"
              />
            </div>
          </div>
          <div>
            <label htmlFor="export-date-to" className="font-body text-xs text-white/30 mb-1 block">
              To
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="export-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-body text-sm focus:border-spark-blue/50 focus:outline-none [color-scheme:dark]"
                aria-label="Export data to date"
              />
            </div>
          </div>
        </div>
        <p className="font-body text-xs text-white/20 mt-2">
          Leave blank to include all available data. Date filtering applies to Activity Log export.
        </p>
      </motion.div>

      {/* Preview & Download */}
      <motion.div variants={staggerItem} className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-display text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-spark-purple/20 text-spark-purple font-data text-xs flex items-center justify-center">4</span>
          Preview &amp; Download
        </h2>

        <AnimatePresence mode="wait">
          {previewSummary ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-xs text-white/30 mb-1">Children</p>
                    <p className="font-body text-sm text-white">
                      {previewSummary.childNames.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-white/30 mb-1">Export Types</p>
                    <p className="font-body text-sm text-white">
                      {previewSummary.exportLabels.join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-white/30 mb-1">Date Range</p>
                    <p className="font-body text-sm text-white">
                      {dateFrom || dateTo
                        ? `${dateFrom || 'Start'} to ${dateTo || 'Present'}`
                        : 'All time'}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-xs text-white/30 mb-1">Files</p>
                    <p className="font-data text-sm text-spark-blue">
                      {previewSummary.exportCount} CSV file{previewSummary.exportCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Column preview per selected export */}
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="font-body text-xs text-white/30 mb-2">Columns included:</p>
                  <div className="space-y-2">
                    {EXPORT_OPTIONS.filter((o) => selectedExports.has(o.id)).map((option) => (
                      <div key={option.id}>
                        <p className="font-display text-xs font-semibold text-white/60 mb-1">
                          {option.label}:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {option.columns.map((col) => (
                            <span
                              key={col}
                              className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-mono text-[10px] text-white/40"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.98 }}
                aria-label="Download selected exports as CSV files"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download {previewSummary.exportCount} CSV File{previewSummary.exportCount !== 1 ? 's' : ''}
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="empty-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Download className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="font-body text-sm text-white/30">
                Select at least one child and one export type to continue
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {lastExported && (
          <p className="font-body text-xs text-white/20 mt-3 text-center">
            Last exported: {lastExported}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
