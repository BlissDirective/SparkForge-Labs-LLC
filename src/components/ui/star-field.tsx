'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * StarField — SparkForge v4 Design System
 * ════════════════════════════════════════════
 * An animated starfield background with twinkling stars,
 * subtle cosmic dust, and optional nebula gradients.
 * Renders to canvas for performance.
 */

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface StarFieldProps {
  /** Number of stars to render */
  starCount?: number;
  /** Whether to show nebula gradients */
  showNebula?: boolean;
  /** Custom class name */
  className?: string;
  /** Opacity of the overall effect */
  opacity?: number;
}

export function StarField({
  starCount = 150,
  showNebula = true,
  className,
  opacity = 1,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Regenerate stars on resize
      initStars(rect.width, rect.height);
    };

    const initStars = (width: number, height: number) => {
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    };

    const drawStar = (star: Star, time: number) => {
      if (!ctx) return;

      const twinkle = prefersReducedMotion
        ? 1
        : 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);

      const currentOpacity = star.opacity * twinkle;

      // Star core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
      ctx.fill();

      // Star glow for larger stars
      if (star.size > 1) {
        const gradient = ctx.createRadialGradient(
          star.x,
          star.y,
          0,
          star.x,
          star.y,
          star.size * 3
        );
        gradient.addColorStop(0, `rgba(200, 220, 255, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const animate = (time: number) => {
      if (!ctx || !canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw stars
      starsRef.current.forEach((star) => drawStar(star, time * 0.001));

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (prefersReducedMotion) {
      // Draw static frame
      animate(0);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [starCount, prefersReducedMotion]);

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Nebula gradients */}
      {showNebula && (
        <>
          {/* Purple nebula - top right */}
          <div
            className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(182,123,255,0.15) 0%, rgba(182,123,255,0.05) 40%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          {/* Cyan nebula - bottom left */}
          <div
            className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 40%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          {/* Magenta nebula - center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,112,175,0.08) 0%, transparent 60%)',
              filter: 'blur(100px)',
            }}
          />
        </>
      )}

      {/* Star canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
