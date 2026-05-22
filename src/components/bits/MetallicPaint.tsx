'use client';

import { useEffect, useRef } from 'react';

interface MetallicPaintProps {
  children: string;
  className?: string;
  baseColor?: string;
  shimmerColor?: string;
  speed?: number;
}

/**
 * MetallicPaint — Animated metallic shimmer/sweep effect on text.
 * Creates a paint-brush sweep that continuously flows across the text,
 * giving it a liquid metal appearance. Pure CSS animation — no canvas.
 */
export default function MetallicPaint({
  children,
  className = '',
  baseColor = '#FFFFFF',
  shimmerColor = '#E945F5',
  speed = 3,
}: MetallicPaintProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Force a reflow to ensure animation starts properly
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = `metallicSweep ${speed}s ease-in-out infinite`;
  }, [speed, children]);

  return (
    <>
      <span
        ref={textRef}
        className={`inline-block ${className}`}
        style={{
          background: `linear-gradient(90deg, ${baseColor} 0%, ${shimmerColor} 25%, #FFFFFF 50%, ${shimmerColor} 75%, ${baseColor} 100%)`,
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          filter: `drop-shadow(0 0 8px ${shimmerColor}40) drop-shadow(0 0 24px ${shimmerColor}20)`,
        }}
      >
        {children}
      </span>
      <style>{`
        @keyframes metallicSweep {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}
