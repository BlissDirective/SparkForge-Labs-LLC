// ════════════════════════════════════════════════════
// ADMIN NAV DOCK — Persistent discoverable admin nav
// v3 Gap 1/3: Until now, /admin routes were only reachable
// via pathname detection with no visual affordance. This
// floating chrome dock is mounted in the dashboard layout
// and renders ONLY when parent.is_admin is true.
//
// - bottom-left floating position so it coexists with the
//   TrialBanner/DemoSessionBanner at top and the parent
//   UsageDashboard at top-right
// - Collapsible: shield-only rest state → full dock on hover/focus
// - Highlights the current admin sub-route
// - Matches Frost-Prismatic glass-card language of the rest of
//   the dashboard
// - Keyboard accessible (Tab focuses the toggle, Enter expands)
// ════════════════════════════════════════════════════
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, FileText, CreditCard, Archive, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';

interface AdminRoute {
  href: string;
  label: string;
  icon: typeof FileText;
  color: string;
}

const ADMIN_ROUTES: AdminRoute[] = [
  {
    href: '/admin/content',
    label: 'Content Queue',
    icon: FileText,
    color: '#00BBFF',
  },
  {
    href: '/admin/subscriptions',
    label: 'Subscriptions',
    icon: CreditCard,
    color: '#FFAA44',
  },
  {
    href: '/admin/archived-children',
    label: 'Archived Children',
    icon: Archive,
    color: '#AA66FF',
  },
];

export function AdminNavDock() {
  const isAdmin = useAuthStore((s) => s.parent?.is_admin);
  const pathname = usePathname();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when user is ON an admin page so the active route is
  // immediately visible.
  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      setExpanded(true);
    }
  }, [pathname]);

  if (!isAdmin) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-40 pointer-events-auto"
      role="navigation"
      aria-label="Admin tools"
    >
      {/* Collapsed: just the shield toggle */}
      <motion.button
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setExpanded(true)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse admin tools' : 'Expand admin tools'}
        className="flex items-center gap-2 glass-card-v2 rounded-xl px-3 py-2 border border-spark-green/20 hover:border-spark-green/40 transition-colors"
        style={{
          boxShadow: '0 0 16px rgba(0, 255, 136, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-7 h-7 rounded-lg bg-spark-green/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-spark-green" />
        </div>
        <motion.span
          className="font-display text-xs font-bold text-spark-green uppercase tracking-wide"
          animate={{
            maxWidth: expanded ? 64 : 64,
            opacity: 1,
          }}
        >
          Admin
        </motion.span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        </motion.div>
      </motion.button>

      {/* Expanded: full nav dock */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute bottom-full left-0 mb-2 min-w-[220px]"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onMouseLeave={() => {
              // Only auto-collapse if we're NOT currently on an admin page
              if (!pathname?.startsWith('/admin')) {
                setExpanded(false);
              }
            }}
          >
            <div
              className="glass-card-v2 p-2 border border-spark-green/20"
              style={{
                boxShadow: '0 0 32px rgba(0, 255, 136, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-1">
                <Shield className="w-4 h-4 text-spark-green" />
                <span className="font-display text-xs font-bold text-white/80 uppercase tracking-wide">
                  Admin Tools
                </span>
              </div>

              {/* Routes */}
              {ADMIN_ROUTES.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href || pathname?.startsWith(route.href + '/');
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() =>
                      broadcast({
                        type: 'page-navigate',
                        source: `admin-dock-${route.href}`,
                        color: route.color,
                        label: route.label.toUpperCase(),
                        targetPage: route.href,
                      })
                    }
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${route.color}15`,
                        boxShadow: isActive ? `0 0 12px ${route.color}40` : 'none',
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: route.color }} />
                    </div>
                    <span
                      className={`font-body text-sm flex-1 ${
                        isActive ? 'text-white font-semibold' : 'text-white/70'
                      }`}
                    >
                      {route.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: route.color }}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
