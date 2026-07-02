'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  Home,
  Gamepad2,
  FlaskConical,
  TrendingUp,
  User,
} from 'lucide-react';

const TABS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/arcade', label: 'Arcade', icon: Gamepad2 },
  { href: '/labs', label: 'Labs', icon: FlaskConical },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
];

// ── R1 "Bolder atmosphere" ──────────────────────────────────────────────
// Same soft breathing primary glow as the sidebar active item (no texture
// on this small surface). Own keyframe name so it never collides with the
// sidebar's when both are mounted. Static shadow under reduced motion.
const TAB_GLOW_KEYFRAMES = `
@keyframes sfTabGlow {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgb(var(--sf-primary) / 0.16),
      0 2px 10px 0 rgb(var(--sf-primary) / 0.14);
  }
  50% {
    box-shadow:
      0 0 0 1px rgb(var(--sf-primary) / 0.3),
      0 2px 16px 2px rgb(var(--sf-primary) / 0.26);
  }
}
`;

const TAB_GLOW_STATIC =
  '0 0 0 1px rgb(var(--sf-primary) / 0.22), 0 2px 12px 1px rgb(var(--sf-primary) / 0.18)';

export function BottomNav() {
  const pathname = usePathname() ?? '';
  const reducedMotion = useReducedMotion();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-inset-bottom"
      style={{
        backgroundColor: 'rgba(var(--sf-surface) / 0.9)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgb(var(--sf-border) / 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <style>{TAB_GLOW_KEYFRAMES}</style>
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all active:scale-95"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={
                isActive
                  ? {
                      backgroundColor: 'rgb(var(--sf-primary) / 0.08)',
                      ...(reducedMotion
                        ? { boxShadow: TAB_GLOW_STATIC }
                        : { animation: 'sfTabGlow 2.8s ease-in-out infinite' }),
                    }
                  : undefined
              }
            >
              <Icon
                className="w-5 h-5 transition-colors"
                style={{
                  color: isActive
                    ? 'rgb(var(--sf-primary) / 1)'
                    : 'rgb(var(--sf-text-muted) / 1)',
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive
                    ? 'rgb(var(--sf-primary) / 1)'
                    : 'rgb(var(--sf-text-muted) / 1)',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
