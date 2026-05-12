'use client';

import Link from 'next/link';
import { LAB_COLORS, LAB_ICONS, LAB_NAMES } from '@/config/labs';
import { useAuthStore } from '@/stores/authStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';

// Week 2 (Days 2-4) — 2D fallback dashboard for mobile/tablet tiers.
// Reads real personalized data via useActiveChild + useAllLabsProgress
// when authenticated; falls through to anon/demo content otherwise.
// Stays under the cut-line: header, continue CTA, nav tiles, lab grid
// with completion %, footer. No 3D, no Canvas.

const NAV_TILES = [
  { href: '/home', label: 'Home', icon: '\u{1F3E0}' },
  { href: '/labs', label: 'Labs', icon: '\u{1F9EA}' },
  { href: '/arcade', label: 'Arcade', icon: '\u{1F3AE}' },
  { href: '/profile', label: 'Profile', icon: '\u{1F9D1}' },
  { href: '/settings', label: 'Settings', icon: '\u{2699}\u{FE0F}' },
] as const;

const LAB_IDS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

interface LabProgressRow {
  labId: number;
  totalItems: number;
  completedItems: number;
  percent: number;
}

function pickContinueLab(rows: ReadonlyArray<LabProgressRow> | undefined): number {
  if (!rows || rows.length === 0) return 1;
  // Resume the lab with the highest non-100 completion (closest to finish);
  // fall through to lab 1 if nothing started.
  const started = rows.filter((r) => r.percent > 0 && r.percent < 100);
  if (started.length > 0) {
    const best = started.reduce((a, b) => (a.percent > b.percent ? a : b));
    return best.labId;
  }
  return 1;
}

export function MobileDashboard() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const child = useActiveChild();
  // useAllLabsProgress refuses to fetch when childId is falsy (enabled guard).
  const progressQuery = useAllLabsProgress(child?.id ?? '');
  const progressRows = progressQuery.data as ReadonlyArray<LabProgressRow> | undefined;

  const continueLabId = pickContinueLab(progressRows);
  const completionByLab = new Map<number, number>(
    (progressRows ?? []).map((r) => [r.labId, r.percent]),
  );

  const greetingName = child?.display_name ?? (isDemoMode ? 'Demo Scout' : 'Explorer');
  const xp = child?.xp ?? 0;
  const streak = child?.streak_count ?? 0;
  const level = child?.level ?? 1;

  return (
    <main
      role="main"
      aria-label="SparkForge mobile dashboard"
      className="min-h-screen w-full bg-cosmic-dark text-white px-4 py-6 sm:px-6 sm:py-8"
    >
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">SparkForge</p>
          <h1 className="text-2xl font-bold tracking-tight">Hi, {greetingName}</h1>
        </div>
        {isDemoMode && (
          <span
            className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/40"
            aria-label="Demo session"
          >
            Demo
          </span>
        )}
      </header>

      {child && (
        <section
          aria-label="Your progress"
          className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
        >
          <Stat label="Level" value={level} />
          <Stat label="XP" value={xp} />
          <Stat label="Streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
        </section>
      )}

      <section aria-label="Continue learning" className="mb-8">
        <Link
          href={`/labs/${continueLabId}`}
          className="touch-target flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-sky-500/20 to-violet-500/20 px-5 py-5 ring-1 ring-white/20 transition hover:from-sky-500/30 hover:to-violet-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <span className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-white/70">
              {progressRows && progressRows.some((r) => r.percent > 0)
                ? 'Continue where you left off'
                : 'Start your first lab'}
            </span>
            <span className="text-lg font-semibold">
              Lab {continueLabId} · {LAB_NAMES[continueLabId] ?? `Lab ${continueLabId}`}
            </span>
          </span>
          <span aria-hidden="true" className="text-3xl">
            {LAB_ICONS[continueLabId] ?? '\u{1F52C}'}
          </span>
        </Link>
      </section>

      <section aria-label="Primary navigation" className="mb-8">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {NAV_TILES.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="touch-target flex flex-col items-center justify-center rounded-2xl bg-white/5 px-4 py-5 text-center ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <span aria-hidden="true" className="mb-2 text-3xl">
                  {tile.icon}
                </span>
                <span className="text-sm font-medium">{tile.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="labs-heading">
        <h2
          id="labs-heading"
          className="mb-3 text-lg font-semibold tracking-tight text-white/90"
        >
          Explore the Labs
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {LAB_IDS.map((labId) => {
            const accent = LAB_COLORS[labId] ?? '#FFFFFF';
            const name = LAB_NAMES[labId] ?? `Lab ${labId}`;
            const icon = LAB_ICONS[labId] ?? '\u{1F52C}';
            const percent = completionByLab.get(labId);
            return (
              <li key={labId}>
                <Link
                  href={`/labs/${labId}`}
                  className="touch-target flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
                    style={{
                      backgroundColor: `${accent}26`,
                      boxShadow: `0 0 0 1px ${accent}66 inset`,
                    }}
                  >
                    {icon}
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-xs uppercase tracking-wider text-white/60">
                      Lab {labId}
                    </span>
                    <span className="text-base font-medium">{name}</span>
                    {typeof percent === 'number' && percent > 0 && (
                      <span className="mt-1 text-xs text-white/70">
                        {Math.round(percent)}% complete
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-10 text-center text-xs text-white/50">
        <p>
          Best experienced on a larger screen for the full Laboratory Control
          Station.
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
      <span className="mt-0.5 text-lg font-semibold tabular-nums">
        {value}
        {suffix ? <span className="ml-1 text-xs font-normal text-white/60">{suffix}</span> : null}
      </span>
    </div>
  );
}
