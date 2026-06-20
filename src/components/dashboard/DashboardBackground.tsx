// ════════════════════════════════════════════════════════════════════
// DashboardBackground — Style 2: Brighter Cockpit
// ════════════════════════════════════════════════════════════════════
// Turquoise → Dark-Magenta diagonal gradient backdrop for the Bright
// Cockpit design variant. This is a LIGHT theme — no dark mode utilities.
// ════════════════════════════════════════════════════════════════════

'use client';

interface DashboardBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function DashboardBackground({ 
  children, 
  className = '' 
}: DashboardBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen w-full ${className}`}
      style={{
        // Do NOT use color-scheme: dark
        colorScheme: 'light',
        background: `
          radial-gradient(ellipse 80% 60% at 25% 30%, oklch(0.78 0.16 195) 0%, transparent 55%),
          radial-gradient(ellipse 70% 70% at 78% 78%, oklch(0.42 0.20 340) 0%, transparent 60%),
          linear-gradient(135deg, oklch(0.66 0.14 200) 0%, oklch(0.34 0.14 330) 100%)
        `.replace(/\s+/g, ' ').trim(),
      }}
    >
      {children}
    </div>
  );
}

export default DashboardBackground;
