'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Menu, X } from 'lucide-react';

// P1-9 / P3: primary nav is product-only (Privacy/Terms live in the
// footer's Legal column); mobile gets a hamburger menu instead of the
// old overflowing link row.
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 bg-surface-base/70 backdrop-blur-xl border-b border-white/[0.06]" />

      <nav
        className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="SparkForge home"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-spark-purple to-spark-blue flex items-center justify-center shadow-glow-blue group-hover:shadow-glow-purple transition-shadow duration-300">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            SparkForge
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-3.5 py-1.5 rounded-lg text-sm font-body font-medium transition-all duration-200
                  ${isActive
                    ? 'text-white bg-white/[0.08] shadow-inner-glow'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Auth CTA buttons */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/[0.06]">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg text-sm font-body font-medium text-white/60 hover:text-white transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-lg text-sm font-body font-semibold text-white bg-gradient-to-r from-spark-blue to-spark-purple hover:shadow-glow-blue transition-shadow duration-300"
            >
              Start Free
            </Link>
          </div>
        </div>

        {/* Mobile: primary CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/signup"
            className="px-3.5 py-1.5 rounded-lg text-sm font-body font-semibold text-white bg-gradient-to-r from-spark-blue to-spark-purple"
          >
            Start Free
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="marketing-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden relative overflow-hidden border-b border-white/[0.06]"
            style={{ background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(16px)' }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      px-3.5 py-2.5 rounded-lg text-base font-body font-medium
                      ${isActive ? 'text-white bg-white/[0.08]' : 'text-white/70 hover:text-white'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-lg text-base font-body font-medium text-white/70 hover:text-white"
              >
                Log In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
