// ════════════════════════════════════════════════════════════════════════
// ANALYTICS ENGINE — Phase 10.5: Advanced Analytics Dashboard (Parent)
// ════════════════════════════════════════════════════════════════════════
// Learning-velocity trends, a topic-strength heatmap, time-on-task, an
// anonymous percentile benchmark (computed against a fixed reference cohort
// curve — never against other children's data, for COPPA safety), and
// template-generated weekly insights. Weekly snapshots are captured by cron.
// ════════════════════════════════════════════════════════════════════════

export interface AnalyticsSnapshot {
  weekStarting: string; // ISO date (Monday)
  xp: number;
  timeMinutes: number;
  gamesPlayed: number;
}

export type StrengthBand = 'new' | 'learning' | 'strong' | 'mastered';

export interface TopicStrength {
  labId: number;
  percent: number;
  band: StrengthBand;
}

export interface LearningVelocity {
  /** XP gained per week, most recent last. */
  weekly: number[];
  /** Average XP/week over the captured window. */
  average: number;
  trend: 'up' | 'down' | 'flat';
}

// ─── Topic strength heatmap ──────────────────────────────────────────────

export function strengthBand(percent: number): StrengthBand {
  if (percent >= 80) return 'mastered';
  if (percent >= 50) return 'strong';
  if (percent >= 20) return 'learning';
  return 'new';
}

export function topicHeatmap(perLabPercent: Record<number, number>): TopicStrength[] {
  return Object.keys(perLabPercent)
    .map(Number)
    .sort((a, b) => a - b)
    .map((labId) => ({ labId, percent: perLabPercent[labId], band: strengthBand(perLabPercent[labId]) }));
}

// ─── Learning velocity ───────────────────────────────────────────────────

/** Derive XP-per-week deltas from cumulative-XP snapshots (chronological). */
export function computeVelocity(snapshots: AnalyticsSnapshot[]): LearningVelocity {
  const sorted = [...snapshots].sort((a, b) => a.weekStarting.localeCompare(b.weekStarting));
  const weekly: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    weekly.push(Math.max(0, sorted[i].xp - sorted[i - 1].xp));
  }
  const average = weekly.length ? Math.round(weekly.reduce((s, n) => s + n, 0) / weekly.length) : 0;
  let trend: LearningVelocity['trend'] = 'flat';
  if (weekly.length >= 2) {
    const first = weekly[0];
    const last = weekly[weekly.length - 1];
    if (last > first * 1.1) trend = 'up';
    else if (last < first * 0.9) trend = 'down';
  }
  return { weekly, average, trend };
}

// ─── Anonymous percentile benchmark ──────────────────────────────────────
// Fixed reference cohort curve (total-XP thresholds → percentile). No other
// child's data is ever queried; this is a privacy-safe synthetic benchmark.
const XP_PERCENTILE_CURVE: { xp: number; percentile: number }[] = [
  { xp: 0, percentile: 5 },
  { xp: 200, percentile: 20 },
  { xp: 500, percentile: 40 },
  { xp: 1000, percentile: 55 },
  { xp: 2000, percentile: 70 },
  { xp: 4000, percentile: 82 },
  { xp: 8000, percentile: 92 },
  { xp: 15000, percentile: 98 },
];

/** Anonymous percentile (0-100) for a child's total XP vs the reference curve. */
export function xpPercentile(totalXp: number): number {
  let result = XP_PERCENTILE_CURVE[0].percentile;
  for (const point of XP_PERCENTILE_CURVE) {
    if (totalXp >= point.xp) result = point.percentile;
    else break;
  }
  return result;
}

// ─── Time-on-task ────────────────────────────────────────────────────────

export function timeOnTaskSummary(snapshots: AnalyticsSnapshot[]): { totalMinutes: number; weeklyAvgMinutes: number } {
  const total = snapshots.reduce((s, x) => s + x.timeMinutes, 0);
  const avg = snapshots.length ? Math.round(total / snapshots.length) : 0;
  return { totalMinutes: total, weeklyAvgMinutes: avg };
}

// ─── Weekly insight (template-generated) ─────────────────────────────────

export interface InsightInput {
  childName: string;
  velocity: LearningVelocity;
  heatmap: TopicStrength[];
  percentile: number;
  labNames: Record<number, string>;
}

/** A friendly, parent-facing summary generated from the data (no PII). */
export function generateInsight(input: InsightInput): string {
  const { childName, velocity, heatmap, percentile, labNames } = input;
  const strongest = [...heatmap].sort((a, b) => b.percent - a.percent)[0];
  const weakest = [...heatmap].filter((t) => t.percent > 0).sort((a, b) => a.percent - b.percent)[0];

  const parts: string[] = [];
  if (velocity.trend === 'up') parts.push(`${childName}'s learning pace is accelerating`);
  else if (velocity.trend === 'down') parts.push(`${childName}'s pace dipped a little this week`);
  else parts.push(`${childName} is keeping a steady pace`);

  if (velocity.average > 0) parts.push(`averaging ${velocity.average} XP per week`);
  if (strongest) parts.push(`strongest in ${labNames[strongest.labId] ?? `Lab ${strongest.labId}`}`);
  if (weakest && weakest.labId !== strongest?.labId) {
    parts.push(`a great next focus is ${labNames[weakest.labId] ?? `Lab ${weakest.labId}`}`);
  }
  parts.push(`ahead of about ${percentile}% of learners`);

  return parts.join(', ') + '.';
}

export function getWeekMonday(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}
