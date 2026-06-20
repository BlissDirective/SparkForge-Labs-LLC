// ════════════════════════════════════════════════════════════════════
// BentoLabTile — Style 2: Brighter Cockpit (High-Shine Chrome)
// ════════════════════════════════════════════════════════════════════
// CURVATURE: Apply `transform: perspective(1200px) rotateX(2deg); transform-style: preserve-3d`
// to the parent <BentoGrid> container. Tiles inherit the bow.
// ════════════════════════════════════════════════════════════════════

'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────

export interface BentoLabTileProps {
  labId: number;            // 1–11
  name: string;
  icon: string;             // emoji
  labColorHex: string;      // e.g. '#0FB8FA'
  progress: number;         // 0-100
  gamesCompleted: number;
  gamesTotal: number;
  size?: '1x1' | '1x2' | '2x1' | '2x2';
  onClick?: () => void;
  href?: string;
}

// ─── Size Mappings ─────────────────────────────────────────────────

const SIZE_CLASSES: Record<NonNullable<BentoLabTileProps['size']>, string> = {
  '1x1': 'col-span-1 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x1': 'col-span-2 row-span-1',
  '2x2': 'col-span-2 row-span-2',
};

// ─── Animation Variants ────────────────────────────────────────────

const tileVariants = {
  initial: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.015 },
  tap: { y: -2, scale: 1.0 },
};

const tileTransition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1] as const,
};

const tapTransition = {
  duration: 0.1,
};

// ─── Component ─────────────────────────────────────────────────────

export default function BentoLabTile({
  labId,
  name,
  icon,
  labColorHex,
  progress,
  gamesCompleted,
  gamesTotal,
  size = '1x1',
  onClick,
  href,
}: BentoLabTileProps) {
  const shouldReduceMotion = useReducedMotion();
  
  // Format lab number with leading zero
  const formattedLabId = String(labId).padStart(2, '0');
  
  // Accessibility label
  const ariaLabel = `Enter Lab ${labId}: ${name}. ${progress}% complete, ${gamesCompleted} of ${gamesTotal} games finished.`;
  
  // CSS custom properties for lab color
  const cssVars = {
    '--lab-color': labColorHex,
    '--lab-glow': `${labColorHex}55`, // ~33% alpha
  } as React.CSSProperties;

  // Shared content JSX
  const tileContent = (
    <>
      {/* Outer Chrome Bezel */}
      <div
        className="relative rounded-[16px] p-[3px] h-full"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.38) 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 0.5px rgba(255,255,255,0.10)',
        }}
      >
        {/* Chrome Shimmer Overlay - Always on */}
        <div
          className={shouldReduceMotion ? '' : 'animate-chrome-shimmer'}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            pointerEvents: 'none',
            // Mask to bezel ring only
            WebkitMaskImage: 'linear-gradient(#fff 0 0)',
            maskImage: 'linear-gradient(#fff 0 0)',
            WebkitMaskClip: 'padding-box',
            maskClip: 'padding-box',
            animation: shouldReduceMotion ? 'none' : undefined,
          }}
        />

        {/* LED Rim */}
        <div
          className="relative rounded-[13px] p-[2px] h-full transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent 0%, var(--lab-color) 50%, transparent 100%)`,
            opacity: 0.65,
          }}
        >
          {/* Breathing glow animation via pseudo element */}
          <div
            className={shouldReduceMotion ? '' : 'animate-subtle-glow'}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '13px',
              boxShadow: `0 0 12px var(--lab-color)`,
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          />

          {/* Screen Inner (Glass Panel) */}
          <div
            className="relative rounded-[11px] h-full p-[var(--space-md,16px)] flex flex-col"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
              backdropFilter: 'blur(14px) saturate(170%) brightness(1.05)',
              WebkitBackdropFilter: 'blur(14px) saturate(170%) brightness(1.05)',
              border: '1px solid rgba(255,255,255,0.28)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 40px rgba(0,0,0,0.18)',
              minHeight: '120px',
            }}
          >
            {/* Top Row: Lab Badge + Icon */}
            <div className="flex justify-between items-start">
              {/* Lab Number Badge */}
              <span
                className="font-data text-[10px] text-white uppercase tracking-wider"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                }}
              >
                LAB {formattedLabId}
              </span>

              {/* Lab Icon Emoji */}
              <span
                className="text-2xl"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
                role="img"
                aria-hidden="true"
              >
                {icon}
              </span>
            </div>

            {/* Center: Lab Name */}
            <div className="flex-1 flex items-center justify-center">
              <span
                className="font-display font-semibold text-base text-white text-center transition-all duration-200 group-hover:bg-clip-text group-hover:text-transparent"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                  // Hover gradient applied via group-hover classes
                }}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - CSS custom properties for gradient text on hover
                {...(typeof window !== 'undefined' ? {} : {})}
              >
                <span className="group-hover:hidden">{name}</span>
                <span
                  className="hidden group-hover:inline"
                  style={{
                    background: `linear-gradient(135deg, var(--lab-color), color-mix(in srgb, var(--lab-color), white 30%))`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {name}
                </span>
              </span>
            </div>

            {/* Bottom: Progress Strip + Games Count */}
            <div className="space-y-2">
              {/* Progress Strip */}
              <div
                className="h-[2px] w-full rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Lab ${labId} progress: ${progress}%`}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    background: `linear-gradient(90deg, var(--lab-color) ${progress}%, rgba(255,255,255,0.20) ${progress}%)`,
                  }}
                />
              </div>

              {/* Games Completed Count */}
              <div className="flex justify-end">
                <span
                  className="font-data text-[10px] text-white"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                  }}
                >
                  {gamesCompleted}/{gamesTotal}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Common motion props
  const motionProps = {
    variants: shouldReduceMotion ? {} : tileVariants,
    initial: 'initial',
    whileHover: shouldReduceMotion ? undefined : 'hover',
    whileTap: shouldReduceMotion ? undefined : 'tap',
    transition: tileTransition,
    className: `${SIZE_CLASSES[size]} group cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--lab-color)] rounded-[16px] min-w-[44px] min-h-[44px]`,
    style: {
      ...cssVars,
      // Hover shadow enhancement
      transition: 'box-shadow 0.25s ease',
    },
  };

  // Hover shadow styles (applied via CSS since motion doesn't handle complex shadows well)
  const hoverShadowStyle = `
    .bento-tile-${labId}:hover {
      box-shadow: 0 16px 50px rgba(0,0,0,0.25), 0 0 28px var(--lab-glow);
    }
    .bento-tile-${labId}:hover .shimmer-overlay {
      animation-duration: 1.5s !important;
    }
  `;

  // Render as Link or Button based on props
  if (href) {
    return (
      <>
        <style>{hoverShadowStyle}</style>
        <Link href={href} passHref legacyBehavior>
          <motion.a
            {...motionProps}
            className={`${motionProps.className} bento-tile-${labId}`}
            aria-label={ariaLabel}
          >
            {tileContent}
          </motion.a>
        </Link>
      </>
    );
  }

  return (
    <>
      <style>{hoverShadowStyle}</style>
      <motion.button
        {...motionProps}
        className={`${motionProps.className} bento-tile-${labId}`}
        onClick={onClick}
        aria-label={ariaLabel}
        type="button"
      >
        {tileContent}
      </motion.button>
    </>
  );
}

export type { BentoLabTileProps };
