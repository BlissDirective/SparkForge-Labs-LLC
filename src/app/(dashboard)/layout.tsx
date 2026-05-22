// ════════════════════════════════════════════════════════════════
// Dashboard Layout — HTML-First Redesign (Phase 1)
// ════════════════════════════════════════════════════════════════
// Replaces the 3D cockpit with a clean, accessible, responsive
// HTML dashboard. Uses the new design system tokens.

'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { DemoGuard } from '@/components/auth/DemoGuard';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { EmailVerifyBanner } from '@/components/auth/EmailVerifyBanner';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { SkipLink } from '@/components/shared/SkipLink';
import { A11yAnnouncer } from '@/components/shared/A11yAnnouncer';
import { RealtimeChildrenBridge } from '@/components/providers/RealtimeChildrenBridge';
import { useSessionTracker } from '@/hooks/useSessionTracker';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionTracker();

  return (
    <AuthProvider>
      <DemoGuard>
        <SkipLink />
        <OfflineBanner />
        <DemoSessionBanner />
        <EmailVerifyBanner />

        <div
          className="min-h-screen flex"
          style={{
            backgroundColor: 'rgb(var(--sf-surface-alt) / 1)',
            color: 'rgb(var(--sf-text-primary) / 1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {/* Desktop Sidebar — hidden on mobile */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <TopBar />

            {/* Page Content */}
            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
              role="main"
            >
              {children}
            </main>

            {/* Mobile Bottom Nav — hidden on desktop */}
            <BottomNav />
          </div>
        </div>

        <A11yAnnouncer />
        <RealtimeChildrenBridge />
      </DemoGuard>
    </AuthProvider>
  );
}
