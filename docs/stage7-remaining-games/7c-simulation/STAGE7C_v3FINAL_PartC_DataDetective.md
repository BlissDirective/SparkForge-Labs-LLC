# SPARKFORGE — STAGE 7C: DATA DETECTIVE — v3-FINAL (PART C)

**Date:** February 28, 2026 | **GCUD:** V9 | **Vision:** Laboratory Control Station
**Design Direction:** Frost-Prismatic v3 | Lab 2: Teaching AI | Color: `#8B5CF6`

---

## DECISIONS IMPLEMENTED

- [x] Decision 6.5 — DataDetective3D dynamic import integrated into DataDetectiveGame.tsx
- [x] BUG-10F — Font stack uses Exo 2/Sora/Orbitron (font-display/font-body classes)

## THIS PART CONTAINS

| Action | File | Lines |
|--------|------|-------|
| FULL REPLACEMENT | `src/components/games/DataDetectiveGame.tsx` | ~634 |
| FINAL VERIFICATION | Complete Stage 7C v3-FINAL validation checklist | — |
| GIT COMMANDS | Commit sequence for all 4 files | — |

**PREREQUISITES:** Stage 7C Part A (`DataDetective3D.tsx` at `src/components/3d/DataDetective3D.tsx`)
**SUPERSEDES:** `DataDetectiveGame.tsx` from `STAGE7_DataDetective_V3_FullTreatment.pdf`

---

## WHAT CHANGED FROM V3 FULL TREATMENT TO v3-FINAL

All other code is identical to V3 Full Treatment. The v3-FINAL changes are purely additive. The 3D component renders above the data table during the investigate phase on desktop only.

| Line(s) | Change | Reason |
|---------|--------|--------|
| 10–14 | [v3] Header updated to v3-FINAL | Version tracking |
| 25–27 | [v3] `import dynamic from "next/dynamic"` | Required for 3D import |
| 30–33 | [v3] `const DataDetective3D = dynamic(...)` | Decision 6.5: 3D investigation desk scene |
| 36–43 | [v3] `function useIsMobile()` | Mobile detection for 3D/CSS fallback |
| 263 | [v3] `const isMobile = useIsMobile()` | Hook usage in component |
| 266 | [v3] `const [lastFixedRow, ...] state` | Tracks last fix for 3D particle burst |
| 272–273 | [v3] `fixedRows, deletedRows` Sets | Derived state for 3D evidence cards |
| 281 | [v3] `setLastFixedRow(id)` in fix() | Triggers 3D particle burst |
| 303 | [v3] `setLastFixedRow(null)` in nextDataset | Reset on case change |
| 335–343 | [v3] DataDetective3D render block | 3D scene above data table (desktop only) |

## v3 INTEGRATION DETAILS

| Prop | Source | Description |
|------|--------|-------------|
| selectedRow | Component state | Currently selected row ID (or null) |
| totalRows | `rows.length` | Total row count for card layout |
| fixedRows | Derived `Set<number>` | Set of fixed row IDs (green cards) |
| deletedRows | Derived `Set<number>` | Set of deleted row IDs (faded cards) |
| lastFixedRow | Component state | ID of last fixed row (triggers particle burst) |
| worldColor | `"#8B5CF6"` | Purple lab color for lighting/tint |
| isMobile | `useIsMobile()` | Mobile returns null (CSS spotlight fallback) |

---

## FULL REPLACEMENT: `src/components/games/DataDetectiveGame.tsx`

Copy-paste the entire code block below to replace the existing file.

```tsx
"use client";

// ================================================================
// DATA DETECTIVE v3-FINAL — Lab 2 (Teaching AI) — Flagship-Lite
// ================================================================
// V3 Full Treatment features:
//   1. Investigation theme (desk lamp spotlight, magnifying glass cursor,
//      evidence tape borders around suspected rows)
//   2. Issue severity heatmap (cells glow red/amber/purple by type)
//   3. Animated cleaning (scrubbing sparkle + value cross-fade)
//   4. Live accuracy gauge (circular SVG speedometer)
//   5. Data microscope (click column header for mini histogram)
//   6. Detective rank (Rookie → Analyst → Investigator → Chief)
//   7. 3 case file datasets with manila folder open animation
//   8. Chrome bezel, welcome, learn phase, age-band depth
//
// v3-FINAL Additions (Decision 6.5):
//   - [v3] Dynamic import of DataDetective3D for 3D investigation desk
//   - [v3] useIsMobile hook for 3D/CSS fallback
//   - [v3] lastFixedRow state tracked for 3D particle burst
//   - [v3] 3D renders above data table on desktop, hidden on mobile
//
// SUPERSEDES: STAGE7_DataDetective_V3_FullTreatment.pdf
// ================================================================

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { GameShell } from "@/components/game/GameShell";
import { useGameStore } from "@/stores/gameStore";
import { useChildStore } from "@/stores/childStore";
import {
  Trash2, Wrench, Search, BarChart3, BookOpen, AlertTriangle,
  CheckCircle2, Eye, Shield, Award, FileText,
} from "lucide-react";

// [v3] Dynamic import for 3D investigation desk (no SSR)
const DataDetective3D = dynamic(
  () => import("@/components/3d/DataDetective3D"),
  { ssr: false }
);

// [v3] Mobile detection for 3D fallback
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// --- Types ---
type Phase = "welcome" | "learn" | "investigate";
type IssueType = "outlier" | "missing" | "duplicate" | "typo";

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
  columns: { key: string; label: string; type: "text" | "number" }[];
  rows: Row[];
}

// --- Constants ---

const ISSUE_COLORS: Record<IssueType, { bg: string; border: string; glow: string; text: string }> = {
  outlier: { bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.25)", glow: "0 0 12px rgba(249,115,22,0.15)", text: "#F97316" },
  missing: { bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.25)", glow: "0 0 12px rgba(234,179,8,0.15)", text: "#EAB308" },
  duplicate: { bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.25)", glow: "0 0 12px rgba(139,92,246,0.15)", text: "#8B5CF6" },
  typo: { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.25)", glow: "0 0 12px rgba(59,130,246,0.15)", text: "#3B82F6" },
};

const ISSUE_ICONS: Record<IssueType, string> = {
  outlier: "🟠", missing: "🟡", duplicate: "🟣", typo: "🔵",
};

const DATASETS: Dataset[] = [
  {
    title: "Case #1: Student Test Scores", emoji: "📚",
    description: "A class took a test. Something's wrong with the data...",
    descriptionC: "Classroom dataset with mixed data quality issues. Identify outliers, null values, and duplicates.",
    columns: [
      { key: "name", label: "Name", type: "text" },
      { key: "age", label: "Age", type: "number" },
      { key: "score", label: "Score", type: "number" },
    ],
    rows: [
      { id: 1, cells: { name: "Alice", age: "12", score: "85" } },
      { id: 2, cells: { name: "Bob", age: "999", score: "72" }, issue: "outlier", issueCol: "age", fixedValue: "12",
        issueDesc: "Age 999 is impossible! This is an outlier.",
        issueDescC: "Statistical outlier: value 999 is >50σ from the mean age. Likely data entry error." },
      { id: 3, cells: { name: "Charlie", age: "11", score: "90" } },
      { id: 4, cells: { name: "", age: "13", score: "65" }, issue: "missing", issueCol: "name", fixedValue: "Student_4",
        issueDesc: "Name is empty! Without a name, we can't identify this student.",
        issueDescC: "Null value in identifier field. Missing primary keys prevent record linking." },
      { id: 5, cells: { name: "Diana", age: "12", score: "85" } },
      { id: 6, cells: { name: "Diana", age: "12", score: "85" }, issue: "duplicate", issueCol: "name",
        issueDesc: "This is the same as row 5! Duplicate records skew AI training.",
        issueDescC: "Exact duplicate: all fields match row 5. Duplicates inflate sample size artificially." },
      { id: 7, cells: { name: "Eve", age: "10", score: "" }, issue: "missing", issueCol: "score", fixedValue: "75",
        issueDesc: "Score is empty! AI can't learn patterns without the answer data.",
        issueDescC: "Missing target variable (score). This row is unusable for supervised learning." },
      { id: 8, cells: { name: "Frank", age: "11", score: "78" } },
      { id: 9, cells: { name: "Grace", age: "-5", score: "92" }, issue: "outlier", issueCol: "age", fixedValue: "12",
        issueDesc: "Negative age?! Ages can't be below zero.",
        issueDescC: "Domain constraint violation: age ∈ ℕ⁺. Negative value indicates sign error." },
      { id: 10, cells: { name: "Hank", age: "13", score: "45" } },
      { id: 11, cells: { name: "Ivy", age: "12", score: "88" } },
      { id: 12, cells: { name: "Jack", age: "11", score: "2000" }, issue: "outlier", issueCol: "score", fixedValue: "80",
        issueDesc: "Score 2000? The test only goes to 100!",
        issueDescC: "Range violation: score ∈ [0,100]. Value 2000 exceeds domain max by 20×." },
    ],
  },
  {
    title: "Case #2: Pet Shelter Records", emoji: "🐾",
    description: "The animal shelter's database needs cleaning up...",
    descriptionC: "Shelter dataset with entity resolution issues. Missing identifiers, age outliers, species gaps.",
    columns: [
      { key: "name", label: "Pet Name", type: "text" },
      { key: "age", label: "Age", type: "number" },
      { key: "species", label: "Species", type: "text" },
    ],
    rows: [
      { id: 101, cells: { name: "Buddy", age: "3", species: "Dog" } },
      { id: 102, cells: { name: "Whiskers", age: "5", species: "Cat" } },
      { id: 103, cells: { name: "", age: "2", species: "Dog" }, issue: "missing", issueCol: "name", fixedValue: "Pet_103",
        issueDesc: "No name! Every pet needs to be identifiable.",
        issueDescC: "Missing identifier. Records without primary key fields cause join failures." },
      { id: 104, cells: { name: "Max", age: "-1", species: "Dog" }, issue: "outlier", issueCol: "age", fixedValue: "1",
        issueDesc: "Negative age! Someone made a typo.",
        issueDescC: "Domain violation: age < 0. Likely sign error." },
      { id: 105, cells: { name: "Luna", age: "4", species: "" }, issue: "missing", issueCol: "species", fixedValue: "Cat",
        issueDesc: "What kind of animal is Luna? Species is missing!",
        issueDescC: "Missing categorical feature. Classification models require complete feature vectors." },
      { id: 106, cells: { name: "Buddy", age: "3", species: "Dog" }, issue: "duplicate", issueCol: "name",
        issueDesc: "Same as row 1! Buddy got entered twice.",
        issueDescC: "Duplicate record: exact match on all fields with row 101." },
      { id: 107, cells: { name: "Mittens", age: "200", species: "Cat" }, issue: "outlier", issueCol: "age", fixedValue: "2",
        issueDesc: "A 200-year-old cat?! Cats live about 15-20 years max.",
        issueDescC: "Biologically implausible: cat lifespan < 30 years." },
      { id: 108, cells: { name: "Rocky", age: "7", species: "Dog" } },
      { id: 109, cells: { name: "Bella", age: "2", species: "Rabbit" } },
    ],
  },
  {
    title: "Case #3: Weather Station Data", emoji: "⛅",
    description: "Weather sensors have been giving strange readings...",
    descriptionC: "Sensor dataset with calibration errors, transmission gaps, and repeated timestamps.",
    columns: [
      { key: "date", label: "Date", type: "text" },
      { key: "temp", label: "Temp °C", type: "number" },
      { key: "humidity", label: "Humidity %", type: "number" },
    ],
    rows: [
      { id: 201, cells: { date: "Mon", temp: "22", humidity: "45" } },
      { id: 202, cells: { date: "Tue", temp: "24", humidity: "50" } },
      { id: 203, cells: { date: "Wed", temp: "500", humidity: "48" }, issue: "outlier", issueCol: "temp", fixedValue: "25",
        issueDesc: "500°C?! That's hotter than an oven! The sensor glitched.",
        issueDescC: "Sensor calibration error: 500°C exceeds physical range." },
      { id: 204, cells: { date: "Thu", temp: "", humidity: "52" }, issue: "missing", issueCol: "temp", fixedValue: "23",
        issueDesc: "Temperature is blank! The sensor didn't record anything.",
        issueDescC: "Missing value from sensor dropout. Can impute via temporal interpolation." },
      { id: 205, cells: { date: "Fri", temp: "21", humidity: "55" } },
      { id: 206, cells: { date: "Fri", temp: "21", humidity: "55" }, issue: "duplicate", issueCol: "date",
        issueDesc: "Friday is recorded twice! Same readings duplicated.",
        issueDescC: "Duplicate timestamp entry. Temporal series require unique timestamps." },
      { id: 207, cells: { date: "Sat", temp: "19", humidity: "-20" }, issue: "outlier", issueCol: "humidity", fixedValue: "48",
        issueDesc: "Negative humidity?! That's physically impossible.",
        issueDescC: "Physical constraint violation: humidity ∈ [0,100]%." },
      { id: 208, cells: { date: "Sun", temp: "23", humidity: "50" } },
    ],
  },
];

const LEARN_CARDS = [
  { title: "Missing Data", emoji: "🕳️", desc: "Empty cells = gaps in AI's knowledge. Like studying with missing pages." },
  { title: "Outliers", emoji: "📈", desc: "Wild values that don't belong (age: 999). These pull AI predictions off track." },
  { title: "Duplicates", emoji: "👯", desc: "Same data entered twice. Makes AI think that data point matters more." },
  { title: "Impact", emoji: "🎯", desc: "Garbage in = garbage out. Clean data is the #1 factor for good AI." },
];

const RANKS = [
  { min: 0, title: "Rookie Detective", emoji: "🔍", color: "#6B7280" },
  { min: 3, title: "Data Analyst", emoji: "📊", color: "#3B82F6" },
  { min: 6, title: "Senior Investigator", emoji: "🕵️", color: "#8B5CF6" },
  { min: 10, title: "Chief Data Officer", emoji: "🏆", color: "#F59E0B" },
];

function getRank(fixed: number) {
  return [...RANKS].reverse().find((r) => fixed >= r.min) || RANKS[0];
}

// --- Histogram Component ---
function MiniHistogram({ values, highlightValue, label, issueType }: {
  values: string[]; highlightValue: string; label: string; issueType?: IssueType;
}) {
  const numericValues = values.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
  if (numericValues.length === 0) return null;

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min || 1;
  const bucketCount = 8;
  const buckets = Array(bucketCount).fill(0);
  const bucketWidth = range / bucketCount;

  numericValues.forEach((v) => {
    const idx = Math.min(bucketCount - 1, Math.floor((v - min) / bucketWidth));
    buckets[idx]++;
  });
  const maxBucket = Math.max(...buckets);

  const highlightNum = parseFloat(highlightValue);
  const highlightBucket = !isNaN(highlightNum)
    ? Math.min(bucketCount - 1, Math.floor((highlightNum - min) / bucketWidth))
    : -1;

  return (
    <div className="rounded-xl p-3 border border-white/10 bg-black/20">
      <p className="font-mono text-[9px] text-white/30 mb-2">📊 Distribution: {label}</p>
      <div className="flex items-end gap-0.5 h-12">
        {buckets.map((count, i) => {
          const isHighlight = i === highlightBucket;
          const height = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
          return (
            <motion.div key={i} className="flex-1 rounded-t-sm relative"
              style={{
                backgroundColor: isHighlight
                  ? (issueType ? ISSUE_COLORS[issueType].text : "#EF4444")
                  : "rgba(139,92,246,0.3)",
                minHeight: count > 0 ? 4 : 1,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, height)}%` }}
              transition={{ duration: 0.5, delay: i * 0.05 }}>
              {isHighlight && (
                <motion.div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="font-mono text-[8px] px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: issueType ? ISSUE_COLORS[issueType].bg : "rgba(239,68,68,0.1)",
                      color: issueType ? ISSUE_COLORS[issueType].text : "#EF4444",
                    }}>
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

// --- Accuracy Gauge ---
function AccuracyGauge({ accuracy, worldColor }: { accuracy: number; worldColor: string }) {
  const angle = (accuracy / 100) * 180 - 90;
  const gaugeColor = accuracy >= 85 ? "#10B981" : accuracy >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative w-32 h-20 mx-auto">
      <svg viewBox="0 0 120 70" className="w-full h-full">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
        <motion.path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray="157" initial={{ strokeDashoffset: 157 }}
          animate={{ strokeDashoffset: 157 - (accuracy / 100) * 157 }}
          transition={{ duration: 1, ease: "easeOut" }} />
        <motion.line x1="60" y1="60" x2="60" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ transformOrigin: "60px 60px" }}
          animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 100 }} />
        <circle cx="60" cy="60" r="4" fill={gaugeColor} />
      </svg>
      <motion.p className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-lg font-black"
        style={{ color: gaugeColor }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
        {accuracy}%
      </motion.p>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function DataDetectiveGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || "B") as "A" | "B" | "C";
  const isMobile = useIsMobile(); // [v3]

  const [phase, setPhase] = useState<Phase>("welcome");
  const [learnIdx, setLearnIdx] = useState(0);
  const [datasetIdx, setDatasetIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>(DATASETS[0].rows.map((d) => ({ ...d })));
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [microscopeCol, setMicroscopeCol] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [caseOpening, setCaseOpening] = useState(false);
  const [lastFixedRow, setLastFixedRow] = useState<number | null>(null); // [v3]

  const dataset = DATASETS[datasetIdx];
  const totalIssues = rows.filter((d) => d.issue).length;
  const fixedCount = rows.filter((d) => d.fixed || d.del).length;
  const accuracy = Math.min(98, 62 + fixedCount * 6);
  const rank = getRank(fixedCount);

  // [v3] Track fixed/deleted rows as Sets for 3D component
  const fixedRows = useMemo(() => new Set(rows.filter((r) => r.fixed).map((r) => r.id)), [rows]);
  const deletedRows = useMemo(() => new Set(rows.filter((r) => r.del).map((r) => r.id)), [rows]);

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 1, delay: Math.random() * 4, dur: Math.random() * 6 + 4,
  })), []);

  const fix = useCallback((id: number) => {
    setRows((p) => p.map((d) => (d.id === id ? { ...d, cleaning: true } : d)));
    setLastFixedRow(id); // [v3]
    setTimeout(() => {
      setRows((p) => p.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, fixed: true, cleaning: false };
        if (d.fixedValue && d.issueCol) {
          updated.cells = { ...d.cells, [d.issueCol]: d.fixedValue };
        }
        return updated;
      }));
      game.addScore(8);
    }, 600);
  }, [game]);

  const del = useCallback((id: number) => {
    setRows((p) => p.map((d) => (d.id === id ? { ...d, del: true } : d)));
    game.addScore(5);
  }, [game]);

  function compare() { setShowResults(true); game.addScore(15); }

  function nextDataset() {
    if (datasetIdx >= DATASETS.length - 1) { game.completeGame(); return; }
    setCaseOpening(true);
    setTimeout(() => {
      const next = datasetIdx + 1;
      setDatasetIdx(next);
      setRows(DATASETS[next].rows.map((d) => ({ ...d })));
      setShowResults(false); setSelectedRow(null); setMicroscopeCol(null);
      setCaseOpening(false); setLastFixedRow(null); // [v3]
      game.nextRound();
    }, 800);
  }

  return (
    <GameShell gameId="data-detective" title="Data Detective" worldNumber={2} worldColor="#8B5CF6">
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(139,92,246,${0.15 + p.size * 0.06}), transparent)` }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
          ))}
        </div>

        {/* Desk lamp spotlight effect (CSS) */}
        {phase === "investigate" && (
          <div className="absolute inset-0 pointer-events-none z-[1]"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139,92,246,0.06), transparent)" }} />
        )}

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 40px rgba(0,0,0,0.3)" }}>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="flex-1 flex flex-col overflow-auto p-4">
              <AnimatePresence mode="wait">
                {/* === WELCOME === */}
                {phase === "welcome" && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <motion.span className="text-6xl block" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                      🔍
                    </motion.span>
                    <h2 className="font-display text-2xl font-bold text-white">Data Detective</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      {ageBand === "C" ? "Analyze datasets for quality issues: outliers, missing values, duplicates. Measure accuracy impact."
                        : "Find and fix problems in messy data! Clean it up so AI can learn properly."}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["Data Quality", "Outliers", "Missing Values", "Accuracy"].map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-body text-[10px] text-purple-300">
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button onClick={() => setPhase("learn")}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      Learn the Basics! <BookOpen className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* === LEARN === */}
                {phase === "learn" && (
                  <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
                    <Search className="w-6 h-6 text-purple-400" />
                    <h3 className="font-display text-lg font-bold text-white">Detective Training</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} / {LEARN_CARDS.length}</p>
                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 text-center bg-purple-500/5 border border-purple-500/15">
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-purple-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2">{LEARN_CARDS[learnIdx].desc}</p>
                      </motion.div>
                    </AnimatePresence>
                    <motion.button onClick={() => { if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx((i) => i + 1); else setPhase("investigate"); }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? "Next →" : "Start Investigating! 🔍"}
                    </motion.button>
                    <button onClick={() => setPhase("investigate")} className="font-body text-xs text-white/20">Skip</button>
                  </motion.div>
                )}

                {/* === INVESTIGATE === */}
                {phase === "investigate" && (
                  <motion.div key="investigate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                    {/* Case header + rank */}
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-bold text-white">{dataset.title}</h3>
                        <p className="font-body text-[9px] text-white/30">
                          {ageBand === "C" ? dataset.descriptionC : dataset.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{rank.emoji}</span>
                        <span className="font-display text-[10px] font-bold" style={{ color: rank.color }}>{rank.title}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-purple-500"
                          animate={{ width: `${totalIssues > 0 ? (fixedCount / totalIssues) * 100 : 0}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-white/30">{fixedCount}/{totalIssues}</span>
                    </div>

                    {/* [v3] 3D Investigation Desk (desktop only) */}
                    {!isMobile && (
                      <DataDetective3D
                        selectedRow={selectedRow}
                        totalRows={rows.length}
                        fixedRows={fixedRows}
                        deletedRows={deletedRows}
                        lastFixedRow={lastFixedRow}
                        worldColor="#8B5CF6"
                        isMobile={isMobile}
                      />
                    )}

                    {/* Data table */}
                    <div className="flex-1 overflow-auto rounded-xl border border-white/10 mb-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {dataset.columns.map((col) => (
                              <th key={col.key}
                                onClick={() => setMicroscopeCol(microscopeCol === col.key ? null : col.key)}
                                className="px-2 py-1.5 text-left font-display text-[10px] text-white/40 cursor-pointer hover:text-purple-300 transition-colors">
                                {col.label} {microscopeCol === col.key ? <Eye className="w-2.5 h-2.5 inline text-purple-400" /> : null}
                              </th>
                            ))}
                            <th className="px-2 py-1.5 w-20"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => {
                            const issueStyle = r.issue && !r.fixed && !r.del ? ISSUE_COLORS[r.issue] : null;
                            return (
                              <motion.tr key={r.id}
                                onClick={() => r.issue && !r.fixed && !r.del && setSelectedRow(r.id === selectedRow ? null : r.id)}
                                className={`border-b border-white/5 transition-all ${r.issue && !r.fixed && !r.del ? "cursor-pointer" : ""}`}
                                style={{
                                  backgroundColor: r.del ? "rgba(239,68,68,0.03)" : r.cleaning ? "rgba(16,185,129,0.05)" : issueStyle && !r.fixed ? issueStyle.bg : undefined,
                                  boxShadow: issueStyle && !r.fixed ? issueStyle.glow : "none",
                                  opacity: r.del ? 0.2 : 1,
                                  textDecoration: r.del ? "line-through" : "none",
                                }}
                                layout>
                                {dataset.columns.map((col) => {
                                  const val = r.cells[col.key];
                                  const isIssueCol = r.issue && r.issueCol === col.key && !r.fixed && !r.del;
                                  return (
                                    <td key={col.key} className="px-2 py-1.5">
                                      <motion.span
                                        className={`font-body text-xs ${isIssueCol ? "font-bold" : "text-white/60"}`}
                                        style={{ color: isIssueCol ? issueStyle?.text : undefined }}
                                        animate={r.cleaning ? { opacity: [1, 0.3, 1], scale: [1, 0.95, 1] } : {}}>
                                        {val || <span className="italic" style={{ color: ISSUE_COLORS.missing.text }}>(empty)</span>}
                                      </motion.span>
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
                                      <button onClick={(e) => { e.stopPropagation(); fix(r.id); }}
                                        className="p-0.5 rounded transition-colors"
                                        style={{ backgroundColor: `${issueStyle?.text}15`, color: issueStyle?.text }}
                                        aria-label="Fix row">
                                        <Wrench className="w-3 h-3" />
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); del(r.id); }}
                                        className="p-0.5 rounded bg-red-500/10 text-red-400"
                                        aria-label="Delete row">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
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
                        const row = rows.find((r) => r.id === selectedRow);
                        if (!row?.issue || row.fixed || row.del) return null;
                        const colors = ISSUE_COLORS[row.issue];
                        return (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-2">
                            <div className="rounded-xl p-3 border" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">{ISSUE_ICONS[row.issue]}</span>
                                <span className="font-display text-xs font-bold uppercase" style={{ color: colors.text }}>{row.issue}</span>
                              </div>
                              <p className="font-body text-[11px] text-white/50">
                                {ageBand === "C" ? row.issueDescC : row.issueDesc}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Data microscope (histogram) */}
                    <AnimatePresence>
                      {microscopeCol && (() => {
                        const col = dataset.columns.find((c) => c.key === microscopeCol);
                        if (!col || col.type !== "number") return null;
                        const values = rows.filter((r) => !r.del).map((r) => r.cells[microscopeCol]).filter(Boolean);
                        const selectedVal = selectedRow ? rows.find((r) => r.id === selectedRow)?.cells[microscopeCol] || "" : "";
                        const selectedIssue = selectedRow ? rows.find((r) => r.id === selectedRow)?.issue : undefined;
                        return (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-2">
                            <MiniHistogram values={values} highlightValue={selectedVal} label={col.label} issueType={selectedIssue} />
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>

                    {/* Results / Accuracy */}
                    {!showResults && fixedCount >= 3 && (
                      <motion.button onClick={compare} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="w-full py-3 rounded-xl font-display font-bold text-sm text-white mb-2"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <BarChart3 className="w-4 h-4 inline mr-1" /> Analyze Accuracy Impact!
                      </motion.button>
                    )}

                    {showResults && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 border border-purple-500/15 bg-purple-500/[0.03]">
                        <p className="font-display text-sm font-bold text-white text-center mb-2">Accuracy Analysis</p>
                        <AccuracyGauge accuracy={accuracy} worldColor="#8B5CF6" />
                        <div className="flex gap-4 mt-3 mb-2">
                          {[{ label: "Before", pct: 62, color: "#EF4444" }, { label: "After", pct: accuracy, color: "#10B981" }].map((b) => (
                            <div key={b.label} className="flex-1 text-center">
                              <motion.p className="font-display text-lg font-black" style={{ color: b.color }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{b.pct}%</motion.p>
                              <p className="font-body text-[9px] text-white/30">{b.label}</p>
                            </div>
                          ))}
                        </div>
                        <p className="font-body text-[10px] text-white/40 text-center mb-2">
                          {ageBand === "C"
                            ? `Cleaning improved accuracy by +${accuracy - 62}pp. Issues: ${fixedCount} resolved of ${totalIssues}.`
                            : `You improved accuracy by ${accuracy - 62}%! Clean data = smart AI.`}
                        </p>
                        <motion.button onClick={nextDataset}
                          className="w-full py-2.5 rounded-xl font-display font-bold text-sm text-white"
                          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          {datasetIdx < DATASETS.length - 1
                            ? <><FileText className="w-4 h-4 inline mr-1" /> Open Case #{datasetIdx + 2}</>
                            : <><Award className="w-4 h-4 inline mr-1" /> Complete Investigation!</>}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Case opening animation */}
        <AnimatePresence>
          {caseOpening && (
            <motion.div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="text-center"
                initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}>
                <div className="w-24 h-32 mx-auto rounded-lg border-2 border-amber-700/30 bg-amber-900/20 flex flex-col items-center justify-center">
                  <span className="text-3xl">{DATASETS[datasetIdx + 1]?.emoji || "📁"}</span>
                  <p className="font-display text-[10px] font-bold text-amber-400 mt-1">
                    {DATASETS[datasetIdx + 1]?.title || "Complete!"}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
```

---

## PART C VALIDATION CHECKLIST

### File Verification
- [ ] `DataDetectiveGame.tsx` exists at `src/components/games/DataDetectiveGame.tsx`
- [ ] File is ~634 lines (complete replacement)
- [ ] No TypeScript errors: `npx tsc --noEmit`

### [v3] 3D Integration Verification
- [ ] Dynamic import of DataDetective3D with `ssr: false`
- [ ] `useIsMobile` hook present
- [ ] `isMobile = useIsMobile()` in component body
- [ ] `lastFixedRow` state variable declared
- [ ] `fixedRows` and `deletedRows` derived Sets via useMemo
- [ ] `setLastFixedRow(id)` called in `fix()` callback
- [ ] `setLastFixedRow(null)` called in `nextDataset()`
- [ ] DataDetective3D renders when `phase === 'investigate'` AND `!isMobile`
- [ ] Props passed: selectedRow, totalRows, fixedRows, deletedRows, lastFixedRow, worldColor, isMobile

### V3 Full Treatment Features Preserved
- [ ] Investigation theme: CSS spotlight gradient on investigate phase
- [ ] 4 Issue types with ISSUE_COLORS: outlier (#F97316), missing (#EAB308), duplicate (#8B5CF6), typo (#3B82F6)
- [ ] ISSUE_ICONS with colored emoji indicators
- [ ] Severity heatmap: row bg + glow + boxShadow per issue type
- [ ] Animated cleaning: sparkle emoji + opacity/scale pulse + value cross-fade
- [ ] Live AccuracyGauge: SVG circular speedometer with spring-animated needle
- [ ] MiniHistogram: click column header to see distribution with highlighted outlier
- [ ] Detective rank: Rookie (0–2), Analyst (3–5), Senior Investigator (6–9), Chief (10+)
- [ ] 3 case file datasets: Student Scores (12 rows), Pet Shelter (9 rows), Weather Station (8 rows)
- [ ] Manila folder opening animation between cases
- [ ] Issue detail panel with icon, colored border, age-band explanation
- [ ] Fix (Wrench) and Delete (Trash2) action buttons with score tracking
- [ ] Before/after accuracy comparison in results panel
- [ ] Welcome phase, Learn phase (4 concept cards), age-band differentiation
- [ ] Chrome bezel: gradient top/bottom bars, rounded border, shadow
- [ ] Background particles with purple radial gradients
- [ ] All ARIA labels preserved (Fix row, Delete row)

---

## COMPLETE STAGE 7C v3-FINAL VERIFICATION

### All Files Created/Modified

| File | Part | Type | Lines | Status |
|------|------|------|-------|--------|
| `src/components/3d/ChatbotNodes3D.tsx` | A | NEW | ~300 | [ ] |
| `src/components/3d/DataDetective3D.tsx` | A | NEW | ~300 | [ ] |
| `src/components/games/ChatbotBuilderGame.tsx` | B | REPLACE | ~712 | [ ] |
| `src/components/games/DataDetectiveGame.tsx` | C | REPLACE | ~634 | [ ] |

### Decision 6.5 Implementation Summary

| Game | Tier | 3D Component | Triangles | Mobile Fallback |
|------|------|-------------|-----------|-----------------|
| Chatbot Builder | Tier 2 | ChatbotNodes3D.tsx — 3D conversation tree | ~3K | SVG graph only (existing V3) |
| Data Detective | Tier 2 | DataDetective3D.tsx — 3D investigation desk | ~2K | CSS spotlight (existing V3) |

### Build Verification

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Lint check
npx eslint src/components/3d/ChatbotNodes3D.tsx
npx eslint src/components/3d/DataDetective3D.tsx
npx eslint src/components/games/ChatbotBuilderGame.tsx
npx eslint src/components/games/DataDetectiveGame.tsx

# 3. Dev server
npm run dev
# Navigate to Lab 8 -> Chatbot Builder (verify 3D nodes on graph/test view)
# Navigate to Lab 2 -> Data Detective (verify 3D desk + magnifying glass)
# Resize to mobile width -> verify 3D hidden, SVG/CSS fallback active

# 4. Build
npm run build
```

### GIT COMMANDS

```bash
# Stage 7C v3-FINAL: Chatbot Builder + Data Detective 3D
git add src/components/3d/ChatbotNodes3D.tsx
git add src/components/3d/DataDetective3D.tsx
git add src/components/games/ChatbotBuilderGame.tsx
git add src/components/games/DataDetectiveGame.tsx

git commit -m "feat(7C): v3-FINAL Chatbot Builder + Data Detective

Decision 6.5: Tier 2 Enhanced 3D for both games.

New files:
- ChatbotNodes3D.tsx: 3D conversation tree nodes (~3K tri)
- DataDetective3D.tsx: 3D investigation desk + magnifying glass (~2K tri)

Modified files:
- ChatbotBuilderGame.tsx: dynamic import, 3D on graph/test views
- DataDetectiveGame.tsx: dynamic import, 3D above data table

All V3 Full Treatment features preserved.
Mobile: falls back to SVG/CSS only (no 3D Canvas).
"
```

---

## SUPERSEDES STATEMENT

This document (Stage 7C v3-FINAL Parts A + B + C) supersedes:

- `STAGE7_ChatbotBuilder_V3_FullTreatment.pdf` (Feb 20, 2026)
- `STAGE7_DataDetective_V3_FullTreatment.pdf` (Feb 20, 2026)
- `STAGE7C_Part3_ChatbotBuilder_DataDetective.pdf` (V2, superseded by V3 Full Treatment)

All V3 Full Treatment game logic, content, UI, phases, and features are preserved in the v3-FINAL files. The only additions are the Decision 6.5 Tier 2 Enhanced 3D components and their integration points.

**Stage 7C v3-FINAL is COMPLETE.**
