'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gamepad2,
  FlaskConical,
  TrendingUp,
  Shield,
  Settings,
  CircleHelp,
  Sparkles,
  Trophy,
  Users,
  CalendarDays,
  GraduationCap,
  Wand2,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/arcade', label: 'Arcade', icon: Gamepad2 },
  { href: '/labs', label: 'Labs', icon: FlaskConical },
  { href: '/buddies', label: 'Buddies', icon: Users },
  { href: '/seasons', label: 'Seasons', icon: CalendarDays },
  { href: '/mastery', label: 'Mastery', icon: GraduationCap },
  { href: '/create', label: 'Create', icon: Wand2 },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/achievements', label: 'Rewards', icon: Trophy },
  { href: '/parent', label: 'Parent', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: CircleHelp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 h-screen sticky top-0 flex flex-col border-r"
      style={{
        backgroundColor: 'rgb(var(--sf-surface) / 1)',
        borderColor: 'rgb(var(--sf-border) / 1)',
      }}
    >
      {/* Logo */}
      <div className="p-6">
        <Link href="/home" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--sf-primary)), rgb(var(--sf-accent-pink)))',
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'rgb(var(--sf-text-primary) / 1)',
            }}
          >
            SparkForge
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{
                color: isActive
                  ? 'rgb(var(--sf-primary) / 1)'
                  : 'rgb(var(--sf-text-secondary) / 1)',
                backgroundColor: isActive
                  ? 'rgb(var(--sf-primary) / 0.08)'
                  : 'transparent',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgb(var(--sf-primary) / 0.04)';
                  e.currentTarget.style.color = 'rgb(var(--sf-text-primary) / 1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgb(var(--sf-text-secondary) / 1)';
                }
              }}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                style={{
                  color: isActive
                    ? 'rgb(var(--sf-primary) / 1)'
                    : 'rgb(var(--sf-text-muted) / 1)',
                }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Child Profile */}
      <div
        className="p-4 border-t"
        style={{ borderColor: 'rgb(var(--sf-border) / 1)' }}
      >
        <ChildProfileMini />
      </div>
    </aside>
  );
}

function ChildProfileMini() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--sf-accent-purple)), rgb(var(--sf-primary)))',
        }}
      >
        A
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'rgb(var(--sf-text-primary) / 1)' }}
        >
          Alex
        </p>
        <p
          className="text-xs truncate"
          style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
        >
          Level 5 Explorer
        </p>
      </div>
    </div>
  );
}
