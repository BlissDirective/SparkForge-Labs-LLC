'use client';

import Link from 'next/link';
import { LAB_COLORS, LAB_ICONS, LAB_NAMES } from '@/config/labs';
import { useAuthStore } from '@/stores/authStore';

// Week 2 — minimal 2D fallback dashboard that renders when
// useDeviceProfile().tier is 'mobile' or 'tablet'. Real HTML/CSS, no
// Canvas, no WebGPU. First pass is intentionally minimal per the plan
// cut-line: header, nav tiles, lab grid, no personalized fetches.
// Day 2-4 expands it with continue-learning, gamification badges,
// recent activity.

const NAV_TILES = [
  { href: '/home', label: 'Home', icon: '\u{1F3E0}' },         // 🏠
  { href: '/labs', label: 'Labs', icon: '\u{1F9EA}' },         // 🧪
  { href: '/arcade', label: 'Arcade', icon: '\u{1F3AE}' },     // 🎮
  { href: '/profile', label: 'Profile', icon: '\u{1F9D1}' },   // 🧑
  { href: '/settings', label: 'Settings', icon: '\u{2699}\u{FE0F}' }, // ⚙️
] as const;

const LAB_IDS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function MobileDashboard() {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);

  return (
    <main
      role="main"
      aria-label="SparkForge mobile dashboard"
      className="min-h-screen w-full bg-cosmic-dark text-white px-4 py-6 sm:px-6 sm:py-8"
    >
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">SparkForge</h1>
        {isDemoMode && (
          <span
            className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/40"
            aria-label="Demo session"
          >
            Demo
          </span>
        )}
      </header>

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
            const icon = LAB_ICONS[labId] ?? '\u{1F52C}'; // 🔬
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
                      backgroundColor: `${accent}26`, // ~15% alpha tint
                      boxShadow: `0 0 0 1px ${accent}66 inset`,
                    }}
                  >
                    {icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-white/60">
                      Lab {labId}
                    </span>
                    <span className="text-base font-medium">{name}</span>
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
