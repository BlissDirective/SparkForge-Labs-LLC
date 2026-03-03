'use client';

// StationFrame — PLACEHOLDER (Part 3B delivers full R3F version)
// Decision 2.1: Persistent frame on ALL dashboard pages
// Decision 2.4: CSS fallback for now; R3F in Part 3B
// Decision 2.5: Edge-to-edge, frame as border

interface StationFrameProps {
  mode?: string;
  ledColor?: string;
  bgIntensity?: number;
  particleCount?: number;
  frameGlow?: number;
  frameDimmed?: boolean;
}

export function StationFrame({
  ledColor = '#00BBFF',
  bgIntensity = 0.15,
  frameDimmed = false,
}: StationFrameProps) {
  return (
    <>
      {/* CSS-only station frame (replaced by R3F canvas in Part 3B) */}
      <div
        className="station-frame-css"
        style={
          {
            '--glow-color': ledColor,
            opacity: frameDimmed ? 0.3 : 1,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />

      {/* Aurora background placeholder — CSS gradient */}
      <div
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: bgIntensity }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 40%, ${ledColor}15 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, #8B5CF610 0%, transparent 60%)`,
          }}
        />
      </div>
    </>
  );
}
