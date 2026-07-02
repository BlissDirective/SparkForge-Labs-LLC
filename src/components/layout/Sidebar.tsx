'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveChild } from '@/hooks/useChildren';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SparkyCore, type SparkyExpression } from '@/components/sparky/SparkyCore';
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
  BookOpen,
} from 'lucide-react';

// `tour` renders a stable data-tour attribute used by DashboardTour anchors.
const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof Home;
  tour?: string;
}> = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/arcade', label: 'Arcade', icon: Gamepad2, tour: 'nav-arcade' },
  { href: '/labs', label: 'Labs', icon: FlaskConical, tour: 'nav-labs' },
  { href: '/story', label: 'Story', icon: BookOpen },
  { href: '/buddies', label: 'Buddies', icon: Users },
  { href: '/seasons', label: 'Seasons', icon: CalendarDays },
  { href: '/mastery', label: 'Mastery', icon: GraduationCap },
  { href: '/create', label: 'Create', icon: Wand2 },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/achievements', label: 'Rewards', icon: Trophy },
  { href: '/parent', label: 'Parent', icon: Shield, tour: 'nav-parent' },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help', icon: CircleHelp },
];

// ── R1 "Bolder atmosphere" ──────────────────────────────────────────────
// Faint circuit-board texture (thin traces + solder nodes, 24px tile),
// drawn in the brand primary #4F6EF7 and rendered at 4% opacity so it
// reads as paper grain on the light surface — never a dark overlay.
const CIRCUIT_TEXTURE_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='%234F6EF7' stroke-width='1'%3E%3Cpath d='M0 6h9v9h15'/%3E%3Cpath d='M12 24v-5h7'/%3E%3Cpath d='M18 0v4'/%3E%3C/g%3E%3Cg fill='%234F6EF7'%3E%3Ccircle cx='9' cy='6' r='1.3'/%3E%3Ccircle cx='9' cy='15' r='1.3'/%3E%3Ccircle cx='19' cy='19' r='1.3'/%3E%3Ccircle cx='18' cy='4' r='1.1'/%3E%3C/g%3E%3C/svg%3E")`;

// Breathing active-nav glow — a soft box-shadow accent in the primary
// color (DESIGN.md §4: saturated, not glowing; no neon on light surface).
// `--sf-nav-glow-rgb` is the R2 seam for per-lab tinting; it defaults to
// the brand primary. Static midpoint shadow under prefers-reduced-motion.
const NAV_GLOW_KEYFRAMES = `
@keyframes sfNavGlow {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.16),
      0 2px 10px 0 rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.14);
  }
  50% {
    box-shadow:
      0 0 0 1px rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.3),
      0 2px 16px 2px rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.26);
  }
}
`;

const NAV_GLOW_STATIC =
  '0 0 0 1px rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.22), 0 2px 12px 1px rgb(var(--sf-nav-glow-rgb, var(--sf-primary)) / 0.18)';

export function Sidebar() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <aside
      className="w-64 h-screen sticky top-0 flex flex-col border-r relative overflow-hidden"
      style={{
        // Very soft cool tint: surface base sliding into a ~2-4%
        // primary-tinted tone toward the bottom.
        backgroundColor: 'rgb(var(--sf-surface) / 1)',
        backgroundImage:
          'linear-gradient(180deg, rgb(var(--sf-primary) / 0.02) 0%, rgb(var(--sf-primary) / 0.045) 100%)',
        borderColor: 'rgb(var(--sf-border) / 1)',
      }}
    >
      <style>{NAV_GLOW_KEYFRAMES}</style>

      {/* Circuit-board texture overlay — pure atmosphere, never interactive */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: CIRCUIT_TEXTURE_URI, opacity: 0.04 }}
      />

      {/* Logo */}
      <div className="p-6 relative">
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
      <nav className="flex-1 px-4 py-2 space-y-1 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;
          // Lab-flask accent: /labs (and lab detail routes) keep the
          // primary tint in R1 — per-lab colors arrive in R2 via
          // --sf-nav-glow-rgb.
          const glowRgb = 'var(--sf-primary)';

          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.tour}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={
                {
                  color: isActive
                    ? 'rgb(var(--sf-primary) / 1)'
                    : 'rgb(var(--sf-text-secondary) / 1)',
                  backgroundColor: isActive
                    ? 'rgb(var(--sf-primary) / 0.08)'
                    : 'transparent',
                  fontFamily: 'var(--font-body)',
                  ...(isActive
                    ? {
                        '--sf-nav-glow-rgb': glowRgb,
                        ...(reducedMotion
                          ? { boxShadow: NAV_GLOW_STATIC }
                          : { animation: 'sfNavGlow 2.8s ease-in-out infinite' }),
                      }
                    : {}),
                } as React.CSSProperties
              }
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
        className="p-4 border-t relative"
        style={{ borderColor: 'rgb(var(--sf-border) / 1)' }}
      >
        <ChildProfileMini />
      </div>
    </aside>
  );
}

/**
 * Mini idle Sparky for the profile chip. Bobs gently and occasionally
 * perks up ('happy' for ~1.2s every 6-9s). Under prefers-reduced-motion
 * the blink loop is skipped entirely and a static 'happy' is shown.
 * `napping` renders the static 'sleepy' variant (create-profile branch).
 */
function SparkyAvatar({ napping = false }: { napping?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [expression, setExpression] = useState<SparkyExpression>('idle');

  useEffect(() => {
    if (napping || reducedMotion) return;
    // Randomize the perk cadence once per mount (6-9s window).
    const period = 6000 + Math.random() * 3000;
    let perkTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setExpression('happy');
      perkTimeout = setTimeout(() => setExpression('idle'), 1200);
    }, period);
    return () => {
      clearInterval(interval);
      if (perkTimeout) clearTimeout(perkTimeout);
    };
  }, [napping, reducedMotion]);

  const resolved: SparkyExpression = napping
    ? 'sleepy'
    : reducedMotion
      ? 'happy'
      : expression;

  return (
    <div aria-hidden="true" className="shrink-0">
      <SparkyCore
        pixelSize={34}
        expression={resolved}
        isAnimated={!napping && !reducedMotion}
        showAura={false}
      />
    </div>
  );
}

function ChildProfileMini() {
  const child = useActiveChild();

  if (!child) {
    return (
      <Link href="/parent/add-child" className="flex items-center gap-3 px-2 group">
        <SparkyAvatar napping />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate group-hover:underline"
            style={{ color: 'rgb(var(--sf-text-primary) / 1)' }}
          >
            Create a profile
          </p>
          <p
            className="text-xs truncate"
            style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
          >
            Start your AI journey
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 px-2">
      <SparkyAvatar />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'rgb(var(--sf-text-primary) / 1)' }}
        >
          {child.display_name}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
        >
          Level {child.level} {child.level_title}
        </p>
      </div>
    </div>
  );
}
