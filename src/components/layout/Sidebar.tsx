'use client';

import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FlaskConical,
  Gamepad2,
  Trophy,
  Users,
  ChevronLeft,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useChildStore } from '@/stores/childStore';

// Sidebar — Laboratory Control Station Instrument Panel
// v3 Decision 2.2: Hybrid icons + hover labels, instrument styling
// v3 Decision 3.3: Lab mode highlights with accent glow + status
// v2 preserved: gradient active bar, keyboard nav, child switcher,
//   ARIA labels, stagger animations, mobile bottom bar

const navItems = [
  { href: '/home', icon: Home, label: 'Home', emoji: '🏠' },
  { href: '/labs', icon: FlaskConical, label: 'Labs', emoji: '🔬' },
  { href: '/arcade', icon: Gamepad2, label: 'Arcade', emoji: '🎮' },
  { href: '/profile', icon: Trophy, label: 'Profile', emoji: '🏆' },
  { href: '/parent', icon: Users, label: 'Parent', emoji: '👨‍👩‍👧' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, labColor } = useUIStore();
  const { activeChild } = useChildStore();
  const navRef = useRef<HTMLElement>(null);

  // v2 [ACC]: Keyboard navigation — arrow keys cycle items, Enter activates
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const items =
        navRef.current?.querySelectorAll<HTMLAnchorElement>('[data-nav-item]');
      if (!items) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = items[(index + 1) % items.length];
        next?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = items[(index - 1 + items.length) % items.length];
        prev?.focus();
      }
    },
    []
  );

  return (
    <>
      {/* Desktop Sidebar — Instrument Panel */}
      <motion.aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-surface-deep/95 backdrop-blur-xl border-r border-white/5"
        animate={{ width: sidebarOpen ? 220 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Logo — Station Identifier */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center text-xl flex-shrink-0 emissive-glow"
            style={{ '--glow-color': '#00BBFF' } as React.CSSProperties}
            whileHover={{ rotate: 10, scale: 1.1 }}
          >
            ⚡
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                className="font-display text-lg font-bold text-white whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                SparkForge
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* v2 [NEW-3B]: Child switcher mini-section */}
        {activeChild && (
          <div className="px-3 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {activeChild.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="overflow-hidden"
                  >
                    <p className="font-body text-sm font-semibold text-white truncate">
                      {activeChild.display_name}
                    </p>
                    <p className="font-body text-[10px] text-white/40">
                      Lv.{activeChild.level}
                      {activeChild.streak_count > 0 &&
                        ` · 🔥 ${activeChild.streak_count}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Nav items — v3 Instrument-style buttons */}
        <nav
          ref={navRef}
          className="flex-1 py-4 px-2 space-y-1"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item, index) => {
            const isActive = pathname?.startsWith(item.href) || false;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-nav-item
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="relative block"
              >
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative ${
                    isActive ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* v2 [ENH]: Animated gradient active bar */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${labColor}, #8B5CF6)`,
                      }}
                      layoutId="sidebar-active-bar"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* v3 [Decision 2.2]: Hybrid icon — Lucide icon with emissive glow */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'emissive-glow bg-white/10'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    style={
                      isActive
                        ? ({ '--glow-color': labColor } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-white' : 'text-white/60'
                      }`}
                    />
                  </div>

                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        className={`font-body text-sm font-semibold whitespace-nowrap ${
                          isActive ? 'text-white' : 'text-white/60'
                        }`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15, delay: index * 0.03 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* v3: Station status indicator */}
        <div className="px-3 py-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: labColor || '#00BBFF' }}
            />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  className="font-mono text-[10px] text-white/30 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Station Online
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="px-4 py-3 border-t border-white/5 text-white/40 hover:text-white/60 transition-colors flex items-center justify-center"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </button>
      </motion.aside>

      {/* Mobile Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-deep/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href) || false;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5"
              >
                {/* v2 [ENH]: Animated pill background on active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/10"
                    layoutId="mobile-active-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                {/* v3: Lucide icon for mobile too */}
                <Icon
                  className={`w-5 h-5 relative z-10 ${
                    isActive ? 'text-white' : 'text-white/40'
                  }`}
                />
                <span
                  className={`text-[10px] font-body relative z-10 ${
                    isActive ? 'text-white font-semibold' : 'text-white/40'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
