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
    // Inject the keyframes once at the document level. The old inline
    // <style> rendered as a child of whatever heading wrapped this
    // component, leaking "@keyframes metallicSweep …" into the
    // accessible name / textContent of the heading (P3).
    const STYLE_ID = 'sf-metallic-sweep-keyframes';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '@keyframes metallicSweep { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }';
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Force a reflow to ensure animation starts properly
    el.style.animation = 'none';
    void el.offsetHeight; // trigger reflow
    el.style.animation = `metallicSweep ${speed}s ease-in-out infinite`;
  }, [speed, children]);

  return (
    <span
      ref={textRef}
      className={`inline-block ${className}`}
      style={{
        // Mid-stop follows the base color: the old fixed #FFFFFF made
        // dark-base text vanish mid-sweep on white cards (P2-8).
        background: `linear-gradient(90deg, ${baseColor} 0%, ${shimmerColor} 25%, ${baseColor} 50%, ${shimmerColor} 75%, ${baseColor} 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: `drop-shadow(0 0 8px ${shimmerColor}40) drop-shadow(0 0 24px ${shimmerColor}20)`,
      }}
    >
      {children}
    </span>
  );
}
