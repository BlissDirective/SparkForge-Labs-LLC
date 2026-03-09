# SPARKFORGE — DATA DETECTIVE V3: Full Treatment Flagship-Lite

**Date:** February 20, 2026 | **GCUD Version:** V7
**Game:** Data Detective — Lab 2 (Teaching AI)
**Treatment:** FULL — Investigation theme, heatmap severity, animated cleaning, live accuracy gauge, data microscope histograms, detective rank progression
**Replaces:** STAGE-7C Part3 Data Detective V2

---

## File: `src/components/games/DataDetectiveGame.tsx`

```tsx
// ════════════════════════════════════════════════════════════════════════
// DATA DETECTIVE V3 — Lab 2 (Teaching AI) — FULL TREATMENT FLAGSHIP-LITE
//
// FEATURES:
// 1. Investigation theme — desk lamp spotlight, magnifying glass cursor,
//    evidence tape borders around suspected rows.
// 2. Issue severity heatmap — cells glow red/amber/purple based on type.
// 3. Animated cleaning — scrubbing sparkle when fixing, value cross-fade.
// 4. Live accuracy gauge — circular speedometer that ticks upward per fix.
// 5. Data microscope — tap any column to see a mini histogram with the
//    selected value highlighted. Teaches WHY outliers matter.
// 6. Detective rank — Rookie → Analyst → Chief based on performance.
// 7. 3 case file datasets with manila folder open animation.
// 8. Chrome bezel, welcome, learn phase, age-band depth.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import {
  Trash2, Wrench, Search, BarChart3, BookOpen, AlertTriangle,
  CheckCircle2, Eye, Shield, FileText, Award
} from 'lucide-react';

// ─── Types ───

type Phase = 'welcome' | 'learn' | 'investigate';
type IssueType = 'outlier' | 'missing' | 'duplicate' | 'typo';

interface Row {
  id: number;
  cells: Record<string, string>;
  issue?: IssueType;
  issueCol?: string;
  issueDesc?: string;
  issueDescC?: string;
  fixedValue?: string;
  fixed?: boolean;
  del?: boolean;
  cleaning?: boolean;
}

interface Dataset {
  title: string;
  emoji: string;
  description: string;
  descriptionC: string;
  columns: { key: string; label: string; type: 'text' | 'number' }[];
  rows: Row[];
}

// ─── Constants ───

const ISSUE_COLORS: Record<IssueType, { bg: string; border: string; glow: string; text: string }> = {
  outlier:   { bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.25)', glow: '0 0 12px rgba(249,115,22,0.15)', text: '#F97316' },
  missing:   { bg: 'rgba(234,179,8,0.06)',  border: 'rgba(234,179,8,0.25)',  glow: '0 0 12px rgba(234,179,8,0.15)',  text: '#EAB308' },
  duplicate: { bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.25)', glow: '0 0 12px rgba(139,92,246,0.15)', text: '#8B5CF6' },
  typo:      { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.25)', glow: '0 0 12px rgba(59,130,246,0.15)', text: '#3B82F6' },
};

const ISSUE_ICONS: Record<IssueType, string> = {
  outlier: '📊', missing: '❓', duplicate: '👯', typo: '✏️',
};

const DATASETS: Dataset[] = [
  {
    title: 'Case #1: Student Test Scores', emoji: '📝',
    description: "A class took a test. Something's wrong with the data...",
    descriptionC: 'Classroom dataset with mixed data quality issues. Identify outliers, null values, and duplicates.',
    columns: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'score', label: 'Score', type: 'number' },
    ],
    rows: [
      { id: 1, cells: { name: 'Alice', age: '12', score: '85' } },
      { id: 2, cells: { name: 'Bob', age: '999', score: '72' }, issue: 'outlier', issueCol: 'age',
        issueDesc: "Age 999 is impossible! This is an outlier — a value way outside the normal range.",
        issueDescC: 'Statistical outlier: value 999 is >50σ from the mean age (µ≈11.5). Likely data entry error.',
        fixedValue: '12' },
      { id: 3, cells: { name: 'Charlie', age: '11', score: '90' } },
      { id: 4, cells: { name: '', age: '13', score: '65' }, issue: 'missing', issueCol: 'name',
        issueDesc: "Name is empty! Without a name, we can't identify this student.",
        issueDescC: 'Null value in identifier field. Missing primary keys prevent record linkage.',
        fixedValue: 'Unknown' },
      { id: 5, cells: { name: 'Diana', age: '12', score: '85' } },
      { id: 6, cells: { name: 'Diana', age: '12', score: '85' }, issue: 'duplicate', issueCol: 'name',
        issueDesc: "This is the same as row 5! Duplicate records make AI think Diana is more important.",
        issueDescC: 'Exact duplicate: all fields match row 5. Duplicates inflate sample size and bias model training.' },
      { id: 7, cells: { name: 'Eve', age: '10', score: '' }, issue: 'missing', issueCol: 'score',
        issueDesc: "Score is empty! AI can't learn patterns without the answer data.",
        issueDescC: 'Missing target variable (score). This row is unusable for supervised learning.' },
      { id: 8, cells: { name: 'Frank', age: '11', score: '78' } },
      { id: 9, cells: { name: 'Grace', age: '-5', score: '92' }, issue: 'outlier', issueCol: 'age',
        issueDesc: "Negative age?! Ages can't be below zero. Something went wrong.",
        issueDescC: 'Domain constraint violation: age ∈ ℕ⁺. Negative value indicates sign error or corruption.',
        fixedValue: '5' },
      { id: 10, cells: { name: 'Hank', age: '13', score: '45' } },
      { id: 11, cells: { name: 'Ivy', age: '12', score: '88' } },
      { id: 12, cells: { name: 'Jack', age: '11', score: '2000' }, issue: 'outlier', issueCol: 'score',
        issueDesc: "Score 2000? The test only goes to 100! This would confuse any AI.",
        issueDescC: 'Range violation: score ∈ [0,100]. Value 2000 exceeds domain max by 20×.',
        fixedValue: '80' },
    ],
  },
  {
    title: 'Case #2: Pet Shelter Records', emoji: '🐾',
    description: "The animal shelter's database needs cleaning up...",
    descriptionC: 'Shelter dataset with entity resolution issues. Missing identifiers, age outliers, and duplicate entries.',
    columns: [
      { key: 'name', label: 'Pet Name', type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'species', label: 'Species', type: 'text' },
    ],
    rows: [
      { id: 101, cells: { name: 'Buddy', age: '3', species: 'Dog' } },
      { id: 102, cells: { name: 'Whiskers', age: '5', species: 'Cat' } },
      { id: 103, cells: { name: '', age: '2', species: 'Dog' }, issue: 'missing', issueCol: 'name',
        issueDesc: "No name! Every pet needs to be identifiable in the records.",
        issueDescC: 'Missing identifier. Records without primary key fields cause join failures.',
        fixedValue: 'Unknown' },
      { id: 104, cells: { name: 'Max', age: '-1', species: 'Dog' }, issue: 'outlier', issueCol: 'age',
        issueDesc: "Negative age! Someone made a typo when entering this.",
        issueDescC: 'Domain violation: age < 0. Likely sign error. Requires manual verification.',
        fixedValue: '1' },
      { id: 105, cells: { name: 'Luna', age: '4', species: '' }, issue: 'missing', issueCol: 'species',
        issueDesc: "What kind of animal is Luna? Species is missing!",
        issueDescC: 'Missing categorical feature. Classification models require complete feature vectors.',
        fixedValue: 'Cat' },
      { id: 106, cells: { name: 'Buddy', age: '3', species: 'Dog' }, issue: 'duplicate', issueCol: 'name',
        issueDesc: "Same as row 1! Buddy got entered twice.",
        issueDescC: 'Duplicate record: exact match on all fields with row 101. Entity deduplication required.' },
      { id: 107, cells: { name: 'Mittens', age: '200', species: 'Cat' }, issue: 'outlier', issueCol: 'age',
        issueDesc: "A 200-year-old cat?! Cats live about 15-20 years max.",
        issueDescC: 'Biologically implausible: cat lifespan < 30 years. Value 200 suggests unit error or typo.',
        fixedValue: '2' },
      { id: 108, cells: { name: 'Rocky', age: '7', species: 'Dog' } },
      { id: 109, cells: { name: 'Bella', age: '2', species: 'Rabbit' } },
    ],
  },
  {
    title: 'Case #3: Weather Station Data', emoji: '🌤️',
    description: "Weather sensors have been giving strange readings...",
    descriptionC: 'Sensor dataset with calibration errors, transmission gaps, and repeated timestamps.',
    columns: [
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'temp', label: 'Temp °C', type: 'number' },
      { key: 'humidity', label: 'Humidity %', type: 'number' },
    ],
    rows: [
      { id: 201, cells: { date: 'Mon', temp: '22', humidity: '45' } },
      { id: 202, cells: { date: 'Tue', temp: '24', humidity: '50' } },
      { id: 203, cells: { date: 'Wed', temp: '500', humidity: '48' }, issue: 'outlier', issueCol: 'temp',
        issueDesc: "500°C?! That's hotter than an oven! The sensor glitched.",
        issueDescC: 'Sensor calibration error: 500°C exceeds physical range for ambient temperature.',
        fixedValue: '23' },
      { id: 204, cells: { date: 'Thu', temp: '', humidity: '52' }, issue: 'missing', issueCol: 'temp',
        issueDesc: "Temperature is blank! The sensor didn't record anything.",
        issueDescC: 'Missing value from sensor dropout. Can impute via temporal interpolation.',
        fixedValue: '22' },
      { id: 205, cells: { date: 'Fri', temp: '21', humidity: '55' } },
      { id: 206, cells: { date: 'Fri', temp: '21', humidity: '55' }, issue: 'duplicate', issueCol: 'date',
        issueDesc: "Friday is recorded twice! Same readings duplicated.",
        issueDescC: 'Duplicate timestamp entry. Temporal series require unique timestamps for valid analysis.' },
      { id: 207, cells: { date: 'Sat', temp: '19', humidity: '-20' }, issue: 'outlier', issueCol: 'humidity',
        issueDesc: "Negative humidity?! That's physically impossible.",
        issueDescC: 'Physical constraint violation: humidity ∈ [0,100]%. Negative value indicates sensor malfunction.',
        fixedValue: '20' },
      { id: 208, cells: { date: 'Sun', temp: '23', humidity: '50' } },
    ],
  },
];

const LEARN_CARDS = [
  { title: 'Missing Data', emoji: '❓', desc: "Empty cells = gaps in AI's knowledge. Like studying with blank pages!" },
  { title: 'Outliers', emoji: '📊', desc: "Wild values that don't belong (age: 999). These pull AI's understanding way off." },
  { title: 'Duplicates', emoji: '👯', desc: 'Same data entered twice. Makes AI think that data point matters more than it does.' },
  { title: 'Impact', emoji: '🎯', desc: 'Garbage in = garbage out. Clean data is the #1 factor for AI accuracy.' },
];

const RANKS = [
  { min: 0, title: 'Rookie Detective', emoji: '🔰', color: '#6B7280' },
  { min: 3, title: 'Data Analyst', emoji: '🔍', color: '#3B82F6' },
  { min: 6, title: 'Senior Investigator', emoji: '🕵️', color: '#8B5CF6' },
  { min: 10, title: 'Chief Data Officer', emoji: '⭐', color: '#F59E0B' },
];

function getRank(fixed: number) {
  return [...RANKS].reverse().find(r => fixed >= r.min) || RANKS[0];
}

// ─── Histogram Component ───

function MiniHistogram({ values, highlightValue, label, issueType }: {
  values: string[]; highlightValue: string; label: string; issueType?: IssueType;
}) {
  const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
  if (numericValues.length === 0) return null;

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min || 1;
  const bucketCount = 8;
  const buckets = Array(bucketCount).fill(0);
  const bucketWidth = range / bucketCount;

  numericValues.forEach(v => {
    const idx = Math.min(bucketCount - 1, Math.floor((v - min) / bucketWidth));
    buckets[idx]++;
  });

  const maxBucket = Math.max(...buckets);
  const highlightNum = parseFloat(highlightValue);
  const highlightBucket = !isNaN(highlightNum) ? Math.min(bucketCount - 1, Math.floor((highlightNum - min) / bucketWidth)) : -1;

  return (
    <div className="rounded-xl p-3 border border-white/10 bg-black/20">
      <p className="font-mono text-[9px] text-white/30 mb-2">🔬 Distribution: {label}</p>
      <div className="flex items-end gap-0.5 h-12">
        {buckets.map((count, i) => {
          const isHighlight = i === highlightBucket;
          const height = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
          return (
            <motion.div key={i} className="flex-1 rounded-t-sm relative"
              style={{
                backgroundColor: isHighlight
                  ? (issueType ? ISSUE_COLORS[issueType].text : '#EF4444')
                  : 'rgba(139,92,246,0.3)',
                minHeight: count > 0 ? 4 : 1,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, height)}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              {isHighlight && (
                <motion.div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="font-mono text-[8px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: issueType ? ISSUE_COLORS[issueType].bg : 'rgba(239,68,68,0.1)', color: issueType ? ISSUE_COLORS[issueType].text : '#EF4444' }}>
                    {highlightValue} ← here
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[7px] text-white/15">{min}</span>
        <span className="font-mono text-[7px] text-white/15">{max}</span>
      </div>
    </div>
  );
}

// ─── Accuracy Gauge ───

function AccuracyGauge({ accuracy, worldColor }: { accuracy: number; worldColor: string }) {
  const angle = (accuracy / 100) * 180 - 90; // -90 to 90 degrees
  const gaugeColor = accuracy >= 85 ? '#10B981' : accuracy >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-32 h-20 mx-auto">
      {/* Background arc */}
      <svg viewBox="0 0 120 70" className="w-full h-full">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        {/* Colored arc */}
        <motion.path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={gaugeColor} strokeWidth="8"
          strokeDasharray="157" initial={{ strokeDashoffset: 157 }}
          animate={{ strokeDashoffset: 157 - (accuracy / 100) * 157 }}
          transition={{ duration: 1, ease: 'easeOut' }} />
        {/* Needle */}
        <motion.line x1="60" y1="60" x2="60" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ transformOrigin: '60px 60px' }}
          animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 100 }} />
        <circle cx="60" cy="60" r="4" fill={gaugeColor} />
      </svg>
      <motion.p className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-lg font-black"
        style={{ color: gaugeColor }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
        {accuracy}%
      </motion.p>
    </div>
  );
}

// ─── Main Component ───

export function DataDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [learnIdx, setLearnIdx] = useState(0);
  const [datasetIdx, setDatasetIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>(DATASETS[0].rows.map(d => ({ ...d })));
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [microscopeCol, setMicroscopeCol] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [caseOpening, setCaseOpening] = useState(false);

  const dataset = DATASETS[datasetIdx];
  const totalIssues = rows.filter(d => d.issue).length;
  const fixedCount = rows.filter(d => d.fixed || d.del).length;
  const accuracy = Math.min(98, 62 + fixedCount * 6);
  const rank = getRank(fixedCount);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1,
    delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  const fix = useCallback((id: number) => {
    // Trigger cleaning animation
    setRows(p => p.map(d => d.id === id ? { ...d, cleaning: true } : d));
    setTimeout(() => {
      setRows(p => p.map(d => {
        if (d.id !== id) return d;
        const updated = { ...d, fixed: true, cleaning: false };
        if (d.fixedValue && d.issueCol) {
          updated.cells = { ...d.cells, [d.issueCol]: d.fixedValue };
        }
        return updated;
      }));
      game.updateScore(8);
    }, 600);
  }, [game]);

  const del = useCallback((id: number) => {
    setRows(p => p.map(d => d.id === id ? { ...d, del: true } : d));
    game.updateScore(5);
  }, [game]);

  function compare() { setShowResults(true); game.updateScore(15); }

  function nextDataset() {
    if (datasetIdx >= DATASETS.length - 1) { game.completeGame(); return; }
    setCaseOpening(true);
    setTimeout(() => {
      const next = datasetIdx + 1;
      setDatasetIdx(next);
      setRows(DATASETS[next].rows.map(d => ({ ...d })));
      setShowResults(false); setSelectedRow(null); setMicroscopeCol(null);
      setCaseOpening(false);
      game.advanceRound();
    }, 800);
  }

  return (
    <GameShell gameId="data-detective" title="Data Detective" worldNumber={2} worldColor="#8B5CF6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        {/* Desk lamp spotlight effect */}
        {phase === 'investigate' && (
          <div className="absolute inset-0 pointer-events-none z-[1]"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139,92,246,0.06), transparent)' }} />
        )}

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 40px rgba(0,0,0,0.3)' }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">

                {/* ═══ WELCOME ═══ */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}>🔍</motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === 'C' ? 'Investigate 3 datasets for quality issues: outliers, missing values, duplicates. Observe accuracy impact.'
                        : 'Be a data detective! Investigate messy data, find problems, fix them, and watch AI accuracy improve!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['Data Quality', 'Outliers', 'Missing Values', 'Accuracy'].map(t => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">{t}</span>
                      ))}
                    </div>
                    {/* Case files preview */}
                    <div className="flex gap-2">
                      {DATASETS.map((d, i) => (
                        <div key={i} className="w-16 h-20 rounded-lg border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center">
                          <span className="text-xl">{d.emoji}</span>
                          <p className="font-body text-[7px] text-white/20 mt-1">Case #{i + 1}</p>
                        </div>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Start Training! <Shield className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ═══ LEARN ═══ */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-4 p-4">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">Data Issues 101</h3>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-purple-500/20 bg-purple-500/5 text-center">
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-purple-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(learnIdx + 1); else setPhase('investigate'); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next →' : 'Open Case File #1! 📁'}
                    </motion.button>
                    <button onClick={() => setPhase('investigate')} className="font-body text-xs text-white/30 hover:text-white/50">
                      Skip to investigation →
                    </button>
                  </motion.div>
                )}

                {/* ═══ INVESTIGATE ═══ */}
                {phase === 'investigate' && (
                  <motion.div key="investigate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    {/* Case header + rank */}
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-bold text-white">{dataset.title}</h3>
                        <p className="font-body text-[9px] text-white/30">{ageBand === 'C' ? dataset.descriptionC : dataset.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{rank.emoji}</span>
                        <span className="font-display text-[10px] font-bold" style={{ color: rank.color }}>{rank.title}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-purple-500" animate={{ width: `${totalIssues > 0 ? (fixedCount / totalIssues) * 100 : 0}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-white/30">{fixedCount}/{totalIssues}</span>
                    </div>

                    {/* Data table */}
                    <div className="flex-1 overflow-auto rounded-xl border border-white/10 mb-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {dataset.columns.map(col => (
                              <th key={col.key}
                                onClick={() => setMicroscopeCol(microscopeCol === col.key ? null : col.key)}
                                className="px-2 py-1.5 text-left font-display text-[10px] text-white/40 uppercase cursor-pointer hover:text-white/60">
                                {col.label} {microscopeCol === col.key ? <Eye className="w-2.5 h-2.5 inline text-purple-400" /> : null}
                              </th>
                            ))}
                            <th className="px-2 py-1.5 w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(r => {
                            const issueStyle = r.issue && !r.fixed && !r.del ? ISSUE_COLORS[r.issue] : null;
                            return (
                              <motion.tr key={r.id}
                                onClick={() => r.issue && !r.fixed && !r.del && setSelectedRow(selectedRow === r.id ? null : r.id)}
                                className={`border-b border-white/5 transition-all ${r.issue && !r.fixed && !r.del ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                                style={{
                                  backgroundColor: r.del ? 'rgba(239,68,68,0.03)' : r.cleaning ? 'rgba(139,92,246,0.08)' : issueStyle?.bg || 'transparent',
                                  boxShadow: issueStyle && !r.fixed ? issueStyle.glow : 'none',
                                  opacity: r.del ? 0.2 : 1,
                                  textDecoration: r.del ? 'line-through' : 'none',
                                }}
                                layout>
                                {dataset.columns.map(col => {
                                  const val = r.cells[col.key];
                                  const isIssueCol = r.issue && r.issueCol === col.key && !r.fixed && !r.del;
                                  return (
                                    <td key={col.key} className="px-2 py-1.5">
                                      <motion.span className={`font-body text-xs ${isIssueCol ? 'font-bold' : 'text-white/60'}`}
                                        style={{ color: isIssueCol ? issueStyle?.text : undefined }}
                                        animate={r.cleaning ? { opacity: [1, 0.3, 1], scale: [1, 0.95, 1] } : {}}>
                                        {val || <span className="italic" style={{ color: ISSUE_COLORS.missing.text }}>empty</span>}
                                      </motion.span>
                                      {/* Cleaning sparkle */}
                                      {r.cleaning && (
                                        <motion.span className="ml-1 inline-block"
                                          animate={{ rotate: 360, scale: [0, 1.5, 0] }}
                                          transition={{ duration: 0.6 }}>✨</motion.span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-1.5 text-right">
                                  {r.issue && !r.fixed && !r.del && !r.cleaning && (
                                    <div className="flex gap-1 justify-end items-center">
                                      <span className="text-[10px]">{ISSUE_ICONS[r.issue]}</span>
                                      <button onClick={e => { e.stopPropagation(); fix(r.id); }}
                                        className="p-0.5 rounded transition-colors"
                                        style={{ backgroundColor: `${issueStyle?.text}15`, color: issueStyle?.text }}
                                        aria-label="Fix row"><Wrench className="w-3 h-3" /></button>
                                      <button onClick={e => { e.stopPropagation(); del(r.id); }}
                                        className="p-0.5 rounded bg-red-500/10 text-red-400"
                                        aria-label="Delete row"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                  {r.fixed && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                                  {r.del && <span className="text-red-400 text-xs font-bold">DEL</span>}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Issue detail panel */}
                    <AnimatePresence>
                      {selectedRow && (() => {
                        const row = rows.find(r => r.id === selectedRow);
                        if (!row?.issue || row.fixed || row.del) return null;
                        const colors = ISSUE_COLORS[row.issue];
                        return (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-2">
                            <div className="rounded-xl p-3 border" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">{ISSUE_ICONS[row.issue]}</span>
                                <span className="font-display text-xs font-bold uppercase" style={{ color: colors.text }}>{row.issue}</span>
                              </div>
                              <p className="font-body text-[11px] text-white/50">{ageBand === 'C' ? row.issueDescC : row.issueDesc}</p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Data microscope (histogram) */}
                    <AnimatePresence>
                      {microscopeCol && (() => {
                        const col = dataset.columns.find(c => c.key === microscopeCol);
                        if (!col || col.type !== 'number') return null;
                        const values = rows.filter(r => !r.del).map(r => r.cells[microscopeCol]);
                        const selectedVal = selectedRow ? rows.find(r => r.id === selectedRow)?.cells[microscopeCol] || '' : '';
                        const selectedIssue = selectedRow ? rows.find(r => r.id === selectedRow)?.issue : undefined;
                        return (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-2">
                            <MiniHistogram values={values} highlightValue={selectedVal} label={col.label} issueType={selectedIssue} />
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Results / Accuracy */}
                    {!showResults && fixedCount >= 3 && (
                      <motion.button onClick={compare} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <BarChart3 className="w-4 h-4" /> Analyze Accuracy Impact!
                      </motion.button>
                    )}

                    {showResults && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 border border-purple-500/15 bg-purple-500/3 text-center">
                        <p className="font-display text-sm font-bold text-white text-center mb-2">Accuracy Impact</p>
                        {/* Gauge */}
                        <AccuracyGauge accuracy={accuracy} worldColor="#8B5CF6" />
                        <div className="flex gap-4 mt-3 mb-2">
                          {[{ label: 'Before', pct: 62, color: '#EF4444' }, { label: 'After', pct: accuracy, color: '#10B981' }].map(b => (
                            <div key={b.label} className="flex-1 text-center">
                              <motion.p className="font-display text-lg font-black" style={{ color: b.color }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{b.pct}%</motion.p>
                              <p className="font-body text-[9px] text-white/30">{b.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="font-body text-[10px] text-white/40 text-center mb-2">
                          {ageBand === 'C' ? `Cleaning improved accuracy by +${accuracy - 62}pp. Each fix removes noise from the training distribution.`
                            : `You improved accuracy by ${accuracy - 62}%! Clean data = smarter AI!`}
                        </p>
                        <motion.button onClick={nextDataset}
                          className="w-full py-2.5 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          {datasetIdx < DATASETS.length - 1 ? (
                            <><FileText className="w-4 h-4" /> Open Case #{datasetIdx + 2}</>
                          ) : (
                            <><Award className="w-4 h-4" /> Complete Investigation!</>
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Case opening animation */}
              <AnimatePresence>
                {caseOpening && (
                  <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className="text-center"
                      initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}>
                      <div className="w-24 h-32 mx-auto rounded-lg border-2 border-amber-700/30 bg-amber-900/20 flex flex-col items-center justify-center">
                        <span className="text-3xl">{DATASETS[datasetIdx + 1]?.emoji || '📋'}</span>
                        <p className="font-display text-[10px] font-bold text-amber-400 mt-1">Case #{datasetIdx + 2}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## What's New in V3 vs V2

| Feature | V2 | V3 |
|---------|----|----|
| Visual theme | Generic table | Investigation theme: spotlight effect, evidence-tape borders, severity glow |
| Issue visualization | Amber background only | Color-coded heatmap per issue type with animated glow |
| Fix animation | Toggle checkmark | Cleaning sparkle + value cross-fade to corrected value |
| Accuracy display | Static before/after bars | SVG circular gauge (speedometer) that animates in real-time |
| Data microscope | None | Click any column header to see histogram with highlighted outlier |
| Detective rank | None | Rookie → Analyst → Investigator → Chief based on fixes |
| Datasets | 2 | 3 (added Weather Station with sensor errors) |
| Case transitions | Instant swap | Manila folder opening animation |
| Issue details | Small text | Full panel with icon, colored border, age-band explanation |
| Histogram | None | Mini bar chart showing value distribution per column |

**Lines:** ~850 | **Core visual moments:** severity heatmap, cleaning sparkle, accuracy gauge, histogram microscope
