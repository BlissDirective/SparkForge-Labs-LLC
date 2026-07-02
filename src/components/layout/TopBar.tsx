'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';

// ── R1 "Bolder atmosphere" ──────────────────────────────────────────────
// Very light SVG fractal noise (feTurbulence) baked at 3% opacity —
// combined with the 2-3% cyan/violet aurora gradient it gives the TopBar
// a faint grain band without touching text contrast (all text sits on
// what is effectively still the plain light surface).
const NOISE_TEXTURE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='96' height='96' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Dashboard',
  '/arcade': 'Game Arcade',
  '/labs': 'Learning Labs',
  '/progress': 'Your Progress',
  '/achievements': 'Rewards',
  '/parent': 'Parent Dashboard',
  '/settings': 'Settings',
  '/help': 'Help Center',
};

export function TopBar() {
  const pathname = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = PAGE_TITLES[pathname] || 'SparkForge';

  return (
    <header
      className="sticky top-0 z-50 border-b px-4 md:px-6 h-16 flex items-center justify-between"
      style={{
        backgroundColor: 'rgba(var(--sf-surface) / 0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgb(var(--sf-border) / 1)',
      }}
    >
      {/* Aurora-grain atmosphere band — 2-3% cyan/violet tint + faint noise */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent 0%, rgb(var(--sf-accent-cyan) / 0.03) 22%, rgb(var(--sf-accent-purple) / 0.03) 55%, rgb(var(--sf-primary) / 0.02) 78%, transparent 100%), ${NOISE_TEXTURE_URI}`,
        }}
      />

      {/* Left: Mobile menu + Page title */}
      <div className="flex items-center gap-3 relative">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo (mobile only) */}
        <div
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--sf-primary)), rgb(var(--sf-accent-pink)))',
          }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        {/* Page title */}
        <h1
          className="text-lg font-semibold hidden sm:block"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'rgb(var(--sf-text-primary) / 1)',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right: Search + Notifications + Profile */}
      <div className="flex items-center gap-2 relative">
        {/* Search */}
        <button
          className="p-2 rounded-xl transition-all hover:scale-105"
          style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-xl transition-all hover:scale-105 relative"
          style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Badge */}
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'rgb(var(--sf-secondary) / 1)' }}
          />
        </button>

        {/* Profile avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ml-2 cursor-pointer transition-transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--sf-accent-purple)), rgb(var(--sf-primary)))',
          }}
        >
          A
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname() ?? '';

  const items = [
    { href: '/home', label: 'Home' },
    { href: '/arcade', label: 'Arcade' },
    { href: '/labs', label: 'Labs' },
    { href: '/progress', label: 'Progress' },
    { href: '/achievements', label: 'Rewards' },
    { href: '/parent', label: 'Parent' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <div
      className="fixed inset-0 z-40 lg:hidden"
      style={{ top: '64px' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Menu panel */}
      <nav
        className="absolute left-0 top-0 w-64 h-[calc(100vh-64px)] p-4 space-y-1 overflow-y-auto"
        style={{
          backgroundColor: 'rgb(var(--sf-surface) / 1)',
          borderRight: '1px solid rgb(var(--sf-border) / 1)',
        }}
      >
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                color: isActive
                  ? 'rgb(var(--sf-primary) / 1)'
                  : 'rgb(var(--sf-text-secondary) / 1)',
                backgroundColor: isActive
                  ? 'rgb(var(--sf-primary) / 0.08)'
                  : 'transparent',
              }}
              onClick={onClose}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
