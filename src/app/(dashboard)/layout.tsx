// ════════════════════════════════════════════════════════════════
// Dashboard Layout — HTML-First Redesign (Phase 1)
// ════════════════════════════════════════════════════════════════
// Replaces the 3D cockpit with a clean, accessible, responsive
// HTML dashboard. Uses the new design system tokens.

'use client';

import { usePathname } from 'next/navigation';
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
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { CircuitTraces, EmberField } from '@/components/forge';
import { AITutorProvider } from '@/components/ai-tutor/AITutorContext';
import { AITutor } from '@/components/ai-tutor/AITutor';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionTracker();
  const pathname = usePathname();
  const isForgeLab = FEATURE_FLAGS.FORGE_LAB_HUB && pathname === '/forge-lab';

  return (
    <AuthProvider>
      <DemoGuard>
        <AITutorProvider>
          <SkipLink />
          <OfflineBanner />
          <DemoSessionBanner />
          <EmailVerifyBanner />

          {isForgeLab ? (
            <div
              className="min-h-screen"
              style={{
                backgroundColor: '#05070b',
                color: '#E8F7FF',
                fontFamily: 'var(--font-body)',
              }}
            >
              <main
                id="main-content"
                className="fixed inset-0 overflow-hidden"
                role="main"
                tabIndex={-1}
              >
                {children}
              </main>
            </div>
          ) : (
          <div
            className="min-h-screen flex"
            style={{
              backgroundColor: 'rgb(var(--sf-surface-alt) / 1)',
              color: 'rgb(var(--sf-text-primary) / 1)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* Forge F4 (Concept 10 §8.1): the ENTIRE dashboard ambient
                budget — one fixed traces layer + one ember field, behind
                all content, decorative, flag-gated. */}
            {FEATURE_FLAGS.FORGE_THEME && FEATURE_FLAGS.FORGE_DASHBOARD && (
              <>
                <CircuitTraces
                  density="low"
                  className="fixed inset-0 w-full h-full opacity-40 z-0"
                />
                <EmberField className="fixed inset-0 z-0" />
              </>
            )}

            {/* Desktop Sidebar — hidden on mobile */}
            <div className="hidden lg:block relative z-10">
              <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
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

          )}

          {/* AI Tutor — omitted on Forge Lab so the SF core stays the emitter */}
          {!isForgeLab && <AITutor />}

          <A11yAnnouncer />
          <RealtimeChildrenBridge />
        </AITutorProvider>
      </DemoGuard>
    </AuthProvider>
  );
}
