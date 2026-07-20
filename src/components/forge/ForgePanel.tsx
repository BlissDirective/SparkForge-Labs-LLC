'use client';

// ════════════════════════════════════════════════════════════════
// ForgePanel — Forge F1 (Concept 10 §4.1) — the universal container
// ════════════════════════════════════════════════════════════════
// glass  : dark translucent glass with backdrop blur
// alloy  : opaque brushed-metal panel with top sheen
// holo   : glass + faint cyan inner border (AI/hint content only)
// bezel  : chrome frame ring via masked ::before (pure CSS, zero JS)
//
// NOTE: `as` is a narrow union of intrinsic tags on purpose — typing
// it React.ElementType<P> makes tsc distribute a conditional type
// across every intrinsic element and OOMs the build type-checker.

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';

export type ForgePanelTag =
  | 'section'
  | 'div'
  | 'aside'
  | 'article'
  | 'header'
  | 'footer'
  | 'nav'
  | 'li'
  | 'form';

export interface ForgePanelProps {
  variant?: 'glass' | 'alloy' | 'holo';
  /** Chrome bezel edge (default true). */
  bezel?: boolean;
  glow?: 'none' | 'ambient' | 'active';
  as?: ForgePanelTag;
  /** Magnetic-snap entry animation (default false — lists must opt in). */
  animateIn?: boolean;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<ForgePanelProps['variant']>, CSSProperties> = {
  glass: {
    background: 'var(--forge-glass-bg, rgb(var(--sf-surface-elevated) / 0.9))',
    backdropFilter: 'blur(var(--forge-glass-blur, 14px))',
    WebkitBackdropFilter: 'blur(var(--forge-glass-blur, 14px))',
    border: '1px solid var(--forge-glass-border, rgb(var(--sf-border) / 1))',
  },
  alloy: {
    backgroundColor: 'rgb(var(--sf-surface-elevated) / 1)',
    backgroundImage:
      'linear-gradient(180deg, var(--forge-chrome-mid, rgba(255,255,255,0.04)), transparent 18%)',
    border: '1px solid rgb(var(--sf-border) / 1)',
  },
  holo: {
    background: 'var(--forge-glass-bg, rgb(var(--sf-surface-elevated) / 0.9))',
    backdropFilter: 'blur(var(--forge-glass-blur, 14px))',
    WebkitBackdropFilter: 'blur(var(--forge-glass-blur, 14px))',
    border: '1px solid rgb(var(--sf-secondary) / 0.25)',
    boxShadow: 'inset 0 0 0 1px rgb(var(--sf-secondary) / 0.12)',
  },
};

const GLOW_SHADOW: Record<NonNullable<ForgePanelProps['glow']>, string | undefined> = {
  none: undefined,
  ambient: 'var(--shadow-md)',
  active: 'var(--shadow-glow-primary)',
};

export function ForgePanel({
  variant = 'glass',
  bezel = true,
  glow = 'none',
  as = 'section',
  animateIn = false,
  children,
  className = '',
}: ForgePanelProps) {
  const reducedMotion = useReducedMotion() ?? false;

  const style: CSSProperties = {
    ...VARIANT_STYLES[variant],
    borderRadius: 'var(--radius-lg, 16px)',
    position: 'relative',
  };
  const glowShadow = GLOW_SHADOW[glow];
  if (glowShadow) {
    style.boxShadow = style.boxShadow
      ? `${style.boxShadow}, ${glowShadow}`
      : glowShadow;
  }

  const content = (
    <>
      {bezel && <span aria-hidden="true" className="forge-bezel" />}
      {children}
    </>
  );

  if (animateIn && !reducedMotion) {
    return (
      <motion.section
        className={className}
        style={style}
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.36, ease: [0.22, 1.2, 0.36, 1] }}
      >
        {content}
      </motion.section>
    );
  }

  const Tag = as;
  return (
    <Tag className={className} style={style}>
      {content}
    </Tag>
  );
}
