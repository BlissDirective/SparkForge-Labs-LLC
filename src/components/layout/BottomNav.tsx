'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

export function BottomNav() {
  const pathname = usePathname() ?? '';

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
