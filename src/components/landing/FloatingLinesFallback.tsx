'use client';

/**
 * CSS Fallback for FloatingLines.
 * Renders when WebGL is unavailable, reduced-motion is preferred,
 * or the device is low-end. Preserves the brand color story.
 */
export function FloatingLinesFallback() {
  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        background: `
          linear-gradient(
            135deg,
            #E945F5 0%,
            #2F4BC0 35%,
            #E945F5 65%,
            #FFFFFF 85%,
            #FFFFFF 100%
          )
        `,
        opacity: 0.15,
      }}
    />
  );
}
