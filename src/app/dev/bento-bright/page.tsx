// ════════════════════════════════════════════════════════════════════
// Bento Bright Test Page — Style 2: Brighter Cockpit Preview
// ════════════════════════════════════════════════════════════════════
// Test page rendering all 11 labs in a 4-col grid with perspective
// transform on the wrapper. Use this to verify the chrome shimmer
// and LED rim animations are visible and performant.
// ════════════════════════════════════════════════════════════════════

import { LAB_COLORS_TABLE } from '@/config/labColors';
import BentoLabTile from '@/components/dashboard/BentoLabTile';
import { DashboardBackground } from '@/components/dashboard/DashboardBackground';

// Demo data for progress — in production, fetch from user's actual progress
const DEMO_PROGRESS: Record<number, { progress: number; gamesCompleted: number; gamesTotal: number }> = {
  1:  { progress: 85, gamesCompleted: 17, gamesTotal: 20 },
  2:  { progress: 60, gamesCompleted: 12, gamesTotal: 20 },
  3:  { progress: 45, gamesCompleted: 9,  gamesTotal: 20 },
  4:  { progress: 30, gamesCompleted: 6,  gamesTotal: 20 },
  5:  { progress: 75, gamesCompleted: 15, gamesTotal: 20 },
  6:  { progress: 20, gamesCompleted: 4,  gamesTotal: 20 },
  7:  { progress: 55, gamesCompleted: 11, gamesTotal: 20 },
  8:  { progress: 40, gamesCompleted: 8,  gamesTotal: 20 },
  9:  { progress: 10, gamesCompleted: 2,  gamesTotal: 20 },
  10: { progress: 90, gamesCompleted: 18, gamesTotal: 20 },
  11: { progress: 5,  gamesCompleted: 1,  gamesTotal: 20 },
};

// Lab icons — emoji representations for each lab
const LAB_ICONS: Record<number, string> = {
  1:  '🤖', // What IS AI?
  2:  '🧠', // Teaching Machines
  3:  '🔮', // The Brain Inside
  4:  '🎨', // AI That Creates
  5:  '🛠️', // AI Helpers
  6:  '⚖️', // AI & Ethics
  7:  '👁️', // Computer Vision
  8:  '💬', // Words & Language
  9:  '🔧', // Build Your AI
  10: '🚀', // AI Futures
  11: '🤝', // Agentic AI
};

export default function BentoBrightTestPage() {
  return (
    <DashboardBackground>
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            Style 2: Brighter Cockpit
          </h1>
          <p className="font-body text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            BentoLabTile Preview — All 11 Labs with High-Shine Chrome
          </p>
        </div>

        {/* Bento Grid with Perspective Curvature */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          style={{
            transform: 'perspective(1200px) rotateX(2deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {LAB_COLORS_TABLE.map((lab) => {
            const progressData = DEMO_PROGRESS[lab.id] || { progress: 0, gamesCompleted: 0, gamesTotal: 20 };
            const icon = LAB_ICONS[lab.id] || '🔬';

            return (
              <BentoLabTile
                key={lab.id}
                labId={lab.id}
                name={lab.name}
                icon={icon}
                labColorHex={lab.hex}
                progress={progressData.progress}
                gamesCompleted={progressData.gamesCompleted}
                gamesTotal={progressData.gamesTotal}
                size="1x1"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log(`[v0] Clicked Lab ${lab.id}: ${lab.name}`);
                }}
              />
            );
          })}
        </div>

        {/* Size Variants Demo */}
        <div className="mt-16">
          <h2 className="font-display text-xl font-semibold text-white mb-4 text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            Size Variants
          </h2>
          <div
            className="grid grid-cols-4 gap-4 max-w-4xl mx-auto"
            style={{
              transform: 'perspective(1200px) rotateX(2deg)',
              transformStyle: 'preserve-3d',
              gridTemplateRows: 'repeat(2, minmax(140px, 1fr))',
            }}
          >
            {/* 2x2 Featured Lab */}
            <BentoLabTile
              labId={1}
              name="What IS AI?"
              icon="🤖"
              labColorHex={LAB_COLORS_TABLE[0].hex}
              progress={85}
              gamesCompleted={17}
              gamesTotal={20}
              size="2x2"
              href="/labs/1"
            />

            {/* 1x2 Vertical */}
            <BentoLabTile
              labId={2}
              name="Teaching Machines"
              icon="🧠"
              labColorHex={LAB_COLORS_TABLE[1].hex}
              progress={60}
              gamesCompleted={12}
              gamesTotal={20}
              size="1x2"
              href="/labs/2"
            />

            {/* 1x1 Standard */}
            <BentoLabTile
              labId={3}
              name="The Brain Inside"
              icon="🔮"
              labColorHex={LAB_COLORS_TABLE[2].hex}
              progress={45}
              gamesCompleted={9}
              gamesTotal={20}
              size="1x1"
              href="/labs/3"
            />

            {/* 2x1 Horizontal */}
            <BentoLabTile
              labId={4}
              name="AI That Creates"
              icon="🎨"
              labColorHex={LAB_COLORS_TABLE[3].hex}
              progress={30}
              gamesCompleted={6}
              gamesTotal={20}
              size="2x1"
              href="/labs/4"
            />
          </div>
        </div>

        {/* Design Notes */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div
            className="rounded-xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <h3 className="font-display font-semibold text-white mb-3">Design Notes</h3>
            <ul className="space-y-2 text-white/80 text-sm font-body">
              <li>✓ Chrome shimmer runs ambiently (3s linear infinite)</li>
              <li>✓ LED rim has 4s breathing glow animation</li>
              <li>✓ Glass panel with backdrop blur for depth</li>
              <li>✓ Gradient text on hover for lab names</li>
              <li>✓ Respects prefers-reduced-motion</li>
              <li>✓ Accessible with proper ARIA labels</li>
              <li>✓ Focus-visible ring uses lab color</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardBackground>
  );
}
