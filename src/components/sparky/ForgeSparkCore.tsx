'use client';

// ════════════════════════════════════════════════════════════════════════════
// FORGESPARK CORE — Forge F7 (Concept 10 Part 11) · v2 "Forged Chassis"
// ════════════════════════════════════════════════════════════════════════════
// The forge-era mascot: a robotic fox kit assembled from bronze-chrome
// plates. v2 (owner note): more robotic/metallic — chrome gradients with
// specular sheen, panel seams + rivets, LED-ring visor eyes, segmented
// ears with joint bolts, vented muzzle plate, glowing chest core,
// antenna, and an exhaust-nozzle plasma tail (the ONLY persistent
// magenta in the app).
//
// Prop-contract IDENTICAL to SparkyCore (drop-in). SparkyCore branches
// here when FORGE_MASCOT is on; flag-off restores the orb everywhere.
// Hand-authored SVG — the source of truth for the future forgespark.riv.

import { useId, useMemo } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { SparkyCoreProps, SparkyExpression, SparkySize } from './SparkyCore';

const SIZE_MAP: Record<SparkySize, number> = {
  sm: 40,
  md: 72,
  lg: 120,
  xl: 192,
};

// Palette (fixed — the mascot reads identically in both themes)
const CREAM = '#F5EBDC';
const AMBER = '#FF8C1A';
const GOLD = '#FFC24A';
const CYAN = '#35E0FF';
const PLASMA = '#FF3DA5';
const DARK = '#16100B';
const SEAM = '#4A2F18';
const RIVET = '#E8D3B8';

interface FoxExpressionConfig {
  /** 1 = open; 0.08 = closed */
  eyeScaleY: number;
  /** crescent = happy closed-arc LED eyes */
  eyeStyle: 'round' | 'crescent' | 'wide';
  /** degrees; negative = flattened back */
  earRotate: number;
  /** tail flame scale */
  flameScale: number;
  /** tail flame tip color */
  flameTip: string;
  glowColor: string;
  /** chest-core brightness 0..1 */
  coreGlow: number;
  fx: 'none' | 'sparks' | 'gear' | 'arcs' | 'orbit' | 'zzz' | 'question' | 'trophy' | 'bang';
}

const FOX_EXPRESSIONS: Record<SparkyExpression, FoxExpressionConfig> = {
  idle:        { eyeScaleY: 1,    eyeStyle: 'round',    earRotate: 0,   flameScale: 1,   flameTip: PLASMA, glowColor: GOLD,   coreGlow: 0.7, fx: 'none' },
  happy:       { eyeScaleY: 1,    eyeStyle: 'crescent', earRotate: -6,  flameScale: 1.2, flameTip: PLASMA, glowColor: GOLD,   coreGlow: 0.9, fx: 'sparks' },
  thinking:    { eyeScaleY: 0.6,  eyeStyle: 'round',    earRotate: 8,   flameScale: 0.9, flameTip: AMBER,  glowColor: CYAN,   coreGlow: 0.6, fx: 'gear' },
  speaking:    { eyeScaleY: 1,    eyeStyle: 'round',    earRotate: -4,  flameScale: 1,   flameTip: PLASMA, glowColor: GOLD,   coreGlow: 0.8, fx: 'arcs' },
  excited:     { eyeScaleY: 1,    eyeStyle: 'wide',     earRotate: -10, flameScale: 1.4, flameTip: PLASMA, glowColor: GOLD,   coreGlow: 1,   fx: 'orbit' },
  sleepy:      { eyeScaleY: 0.18, eyeStyle: 'round',    earRotate: 14,  flameScale: 0.6, flameTip: AMBER,  glowColor: '#C87B3B', coreGlow: 0.3, fx: 'zzz' },
  sad:         { eyeScaleY: 0.75, eyeStyle: 'round',    earRotate: 20,  flameScale: 0.55,flameTip: '#4FC6FF', glowColor: '#4FC6FF', coreGlow: 0.35, fx: 'question' },
  celebrating: { eyeScaleY: 1,    eyeStyle: 'crescent', earRotate: -10, flameScale: 1.6, flameTip: PLASMA, glowColor: GOLD,   coreGlow: 1,   fx: 'trophy' },
  surprised:   { eyeScaleY: 1,    eyeStyle: 'wide',     earRotate: -14, flameScale: 0.8, flameTip: PLASMA, glowColor: CYAN,   coreGlow: 0.9, fx: 'bang' },
};

const ARIA: Record<SparkyExpression, string> = {
  idle: 'ForgeSpark the robot fox is here',
  happy: 'ForgeSpark is happy!',
  thinking: 'ForgeSpark is thinking…',
  speaking: 'ForgeSpark is speaking',
  excited: 'ForgeSpark is excited!',
  sleepy: 'ForgeSpark is sleepy',
  sad: 'ForgeSpark wants to help',
  celebrating: 'ForgeSpark is celebrating!',
  surprised: 'ForgeSpark is surprised!',
};

export function ForgeSparkCore({
  expression = 'idle',
  size = 'md',
  pixelSize,
  isAnimated = true,
  glowColor: glowColorProp,
  showAura = true,
  className = '',
}: SparkyCoreProps) {
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/[:]/g, '');
  const cfg = FOX_EXPRESSIONS[expression] ?? FOX_EXPRESSIONS.idle;
  const glowColor = glowColorProp || cfg.glowColor;
  const width = pixelSize ?? SIZE_MAP[size];
  const animate = isAnimated && !reducedMotion;

  // Unique gradient ids per instance (multiple foxes per page).
  const g = {
    chrome: `fsv2-chrome-${uid}`,
    plate: `fsv2-plate-${uid}`,
    belly: `fsv2-belly-${uid}`,
    flame: `fsv2-flame-${uid}`,
    core: `fsv2-core-${uid}`,
    visor: `fsv2-visor-${uid}`,
  };

  const bobAnimation = useMemo(() => (animate ? { y: [0, -4, 0] } : {}), [animate]);
  const bobTransition = useMemo(
    () => (animate ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' as const } : {}),
    [animate]
  );

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        aspectRatio: '1 / 1',
      }}
      animate={bobAnimation}
      transition={bobTransition}
    >
      {showAura && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${glowColor}33 0%, transparent 65%)`,
            transform: 'scale(1.35)',
          }}
        />
      )}
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label={ARIA[expression] ?? ARIA.idle}
        className="relative w-full h-full"
      >
        <defs>
          {/* Bronze-chrome: bright specular top edge → warm mid → deep base */}
          <linearGradient id={g.chrome} x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor="#F2DCBB" />
            <stop offset="18%" stopColor="#DDA96A" />
            <stop offset="45%" stopColor="#C87B3B" />
            <stop offset="80%" stopColor="#8A5426" />
            <stop offset="100%" stopColor="#5C3A1E" />
          </linearGradient>
          {/* Darker chassis plate for the body */}
          <linearGradient id={g.plate} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#E3BE8B" />
            <stop offset="30%" stopColor="#B96F33" />
            <stop offset="75%" stopColor="#7C4B21" />
            <stop offset="100%" stopColor="#54351A" />
          </linearGradient>
          {/* Brushed cream-alloy belly plate */}
          <linearGradient id={g.belly} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4E6" />
            <stop offset="55%" stopColor={CREAM} />
            <stop offset="100%" stopColor="#CBB795" />
          </linearGradient>
          <linearGradient id={g.flame} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="55%" stopColor={AMBER} />
            <stop offset="100%" stopColor={cfg.flameTip} />
          </linearGradient>
          <radialGradient id={g.core}>
            <stop offset="0%" stopColor={GOLD} />
            <stop offset="55%" stopColor={AMBER} />
            <stop offset="100%" stopColor="#C75E0C" />
          </radialGradient>
          {/* Dark visor lens behind each eye */}
          <radialGradient id={g.visor}>
            <stop offset="0%" stopColor="#241A10" />
            <stop offset="100%" stopColor={DARK} />
          </radialGradient>
        </defs>

        {/* ── tail: exhaust nozzle + plasma flame (behind body) ──
            Outer <g>: SVG attribute transform positions/scales. Inner
            <g>: CSS wobble — CSS transform REPLACES an attribute
            transform on the same element, so they must stay separate. */}
        <g transform={`translate(178 150) scale(${cfg.flameScale})`}>
          <g
            style={
              animate
                ? { animation: 'forge-fox-tail 2.8s ease-in-out infinite', transformOrigin: '0px 40px', transformBox: 'fill-box' }
                : undefined
            }
          >
            <path
              d="M 0 40 C -14 18 -6 2 4 -14 C 8 -2 18 2 14 16 C 24 8 26 22 18 34 C 12 42 4 44 0 40 Z"
              fill={`url(#${g.flame})`}
              opacity="0.95"
            />
            <path
              d="M 2 34 C -6 20 0 10 6 0 C 8 8 14 12 11 20 C 14 26 10 32 2 34 Z"
              fill={GOLD}
              opacity="0.8"
            />
          </g>
          {/* exhaust nozzle cone anchoring the flame to the chassis */}
          <path d="M -12 34 L 4 28 L 4 50 L -12 46 Z" fill={`url(#${g.chrome})`} stroke={SEAM} strokeWidth="1.2" />
          <line x1="-4" y1="31" x2="-4" y2="48" stroke={SEAM} strokeWidth="1" opacity="0.7" />
        </g>

        {/* ── body chassis ── */}
        <ellipse cx="120" cy="168" rx="52" ry="44" fill={`url(#${g.plate})`} />
        {/* specular sheen band */}
        <ellipse cx="103" cy="140" rx="30" ry="10" fill="#FFFFFF" opacity="0.18" transform="rotate(-14 103 140)" />
        {/* shoulder plate seams + rivets */}
        <path d="M 74 152 Q 96 142 120 142 Q 144 142 166 152" fill="none" stroke={SEAM} strokeWidth="1.6" opacity="0.85" />
        <path d="M 82 188 Q 120 200 158 188" fill="none" stroke={SEAM} strokeWidth="1.4" opacity="0.7" />
        {[
          [78, 158], [162, 158], [88, 190], [152, 190],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill={RIVET} stroke={SEAM} strokeWidth="0.6" />
        ))}
        {/* amber circuit seams */}
        <path
          d="M 84 150 H 100 V 166 M 156 150 H 140 V 166"
          stroke={AMBER}
          strokeWidth="1.6"
          fill="none"
          opacity="0.8"
          strokeLinecap="round"
        />

        {/* ── belly plate + chest core ── */}
        <ellipse cx="120" cy="178" rx="30" ry="26" fill={`url(#${g.belly})`} stroke={SEAM} strokeWidth="1.4" />
        {/* core reactor */}
        <circle cx="120" cy="172" r="10" fill="none" stroke={SEAM} strokeWidth="1.6" />
        <circle
          cx="120" cy="172" r="7"
          fill={`url(#${g.core})`}
          opacity={cfg.coreGlow}
          style={animate ? { animation: 'forge-glow-breathe 3s ease-in-out infinite' } : undefined}
        />
        <circle cx="118" cy="169.5" r="2" fill="#FFFFFF" opacity={0.5 * cfg.coreGlow} />
        {/* belly vent slots */}
        <g stroke={SEAM} strokeWidth="1.4" opacity="0.6" strokeLinecap="round">
          <line x1="110" y1="192" x2="130" y2="192" />
          <line x1="113" y1="197" x2="127" y2="197" />
        </g>

        {/* ── paw boots ── */}
        {[98, 142].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="206" rx="13" ry="9" fill={`url(#${g.chrome})`} stroke={SEAM} strokeWidth="1.2" />
            <line x1={cx - 6} y1="204" x2={cx - 6} y2="212" stroke={SEAM} strokeWidth="1" opacity="0.7" />
            <line x1={cx + 6} y1="204" x2={cx + 6} y2="212" stroke={SEAM} strokeWidth="1" opacity="0.7" />
          </g>
        ))}

        {/* ── head ── */}
        <g>
          {/* segmented ears with joint bolts */}
          <g transform={`rotate(${cfg.earRotate} 86 62)`}>
            <path d="M 70 82 L 84 30 L 106 68 Z" fill={`url(#${g.chrome})`} stroke={SEAM} strokeWidth="1.4" />
            <path d="M 74 74 L 84 40 L 90 52 L 78 76 Z" fill="#FFFFFF" opacity="0.14" />
            <path d="M 80 68 L 85 48 L 94 63 Z" fill={AMBER} opacity="0.9" />
            <circle cx="88" cy="72" r="3.4" fill={`url(#${g.plate})`} stroke={SEAM} strokeWidth="1.2" />
            <circle cx="88" cy="72" r="1.2" fill={RIVET} />
          </g>
          <g transform={`rotate(${-cfg.earRotate} 154 62)`}>
            <path d="M 170 82 L 156 30 L 134 68 Z" fill={`url(#${g.chrome})`} stroke={SEAM} strokeWidth="1.4" />
            <path d="M 166 74 L 156 40 L 150 52 L 162 76 Z" fill="#FFFFFF" opacity="0.14" />
            <path d="M 160 68 L 155 48 L 146 63 Z" fill={AMBER} opacity="0.9" />
            <circle cx="152" cy="72" r="3.4" fill={`url(#${g.plate})`} stroke={SEAM} strokeWidth="1.2" />
            <circle cx="152" cy="72" r="1.2" fill={RIVET} />
          </g>

          {/* antenna */}
          <g transform={`rotate(${cfg.earRotate * 0.4} 120 56)`}>
            <line x1="120" y1="56" x2="120" y2="38" stroke={`url(#${g.chrome})`} strokeWidth="3" strokeLinecap="round" />
            <circle
              cx="120" cy="35" r="4"
              fill={glowColor}
              style={animate ? { animation: 'forge-glow-breathe 2.2s ease-in-out infinite' } : undefined}
            />
            <circle cx="119" cy="34" r="1.2" fill="#FFFFFF" opacity="0.7" />
          </g>

          {/* head shell */}
          <path
            d="M 66 92 C 66 64 90 52 120 52 C 150 52 174 64 174 92 C 174 118 152 136 120 136 C 88 136 66 118 66 92 Z"
            fill={`url(#${g.chrome})`}
            stroke={SEAM}
            strokeWidth="1.4"
          />
          {/* crown specular sheen */}
          <ellipse cx="102" cy="66" rx="26" ry="8" fill="#FFFFFF" opacity="0.28" transform="rotate(-10 102 66)" />
          {/* faceplate seam splitting the head shell */}
          <path d="M 70 96 Q 120 82 170 96" fill="none" stroke={SEAM} strokeWidth="1.6" opacity="0.9" />
          {[
            [74, 90], [166, 90], [120, 57.5],
          ].map(([x, y]) => (
            <circle key={`h-${x}`} cx={x} cy={y} r="1.7" fill={RIVET} stroke={SEAM} strokeWidth="0.6" />
          ))}

          {/* vented muzzle plate */}
          <ellipse cx="120" cy="114" rx="26" ry="18" fill={`url(#${g.belly})`} stroke={SEAM} strokeWidth="1.4" />
          <g stroke={SEAM} strokeWidth="1.3" opacity="0.55" strokeLinecap="round">
            <line x1="104" y1="110" x2="110" y2="110" />
            <line x1="130" y1="110" x2="136" y2="110" />
          </g>
          {/* LED nose */}
          <ellipse cx="120" cy="106" rx="6" ry="4.5" fill={DARK} />
          <ellipse cx="120" cy="106" rx="3.4" ry="2.4" fill={AMBER} opacity="0.9" />
          <circle cx="118.6" cy="105" r="1" fill="#FFFFFF" opacity="0.8" />
          {/* mouth (speaker-grille inflected) */}
          {cfg.eyeStyle === 'crescent' ? (
            <path d="M 110 118 Q 120 126 130 118" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : expression === 'sad' ? (
            <path d="M 110 122 Q 120 116 130 122" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : expression === 'surprised' ? (
            <ellipse cx="120" cy="120" rx="5" ry="6" fill={DARK} />
          ) : (
            <g>
              <path d="M 112 119 Q 120 123 128 119" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <line x1="116" y1="124.5" x2="124" y2="124.5" stroke={DARK} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
            </g>
          )}

          {/* ── LED-ring visor eyes ── */}
          {(['L', 'R'] as const).map((side) => {
            const cx = side === 'L' ? 98 : 142;
            if (cfg.eyeStyle === 'crescent') {
              return (
                <g key={side}>
                  {/* chrome socket ring stays visible when the LED closes happy */}
                  <circle cx={cx} cy={88} r={12.5} fill={`url(#${g.visor})`} stroke={SEAM} strokeWidth="1.4" />
                  <path
                    d={`M ${cx - 8} 91 Q ${cx} 80 ${cx + 8} 91`}
                    stroke={CYAN}
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 3px ${CYAN})` }}
                  />
                </g>
              );
            }
            const r = cfg.eyeStyle === 'wide' ? 13 : 11;
            return (
              <g key={side}>
                {/* chrome eye socket */}
                <circle cx={cx} cy={88} r={r + 2.5} fill={`url(#${g.chrome})`} stroke={SEAM} strokeWidth="1.2" />
                <g transform={`translate(${cx} 88) scale(1 ${cfg.eyeScaleY})`}>
                  {/* dark visor lens */}
                  <circle r={r} fill={`url(#${g.visor})`} />
                  {/* LED iris ring (segmented) */}
                  <circle
                    r={r * 0.66}
                    fill="none"
                    stroke={CYAN}
                    strokeWidth={r * 0.16}
                    strokeDasharray={`${r * 0.5} ${r * 0.18}`}
                    style={{ filter: `drop-shadow(0 0 2.5px ${CYAN})` }}
                  />
                  {/* iris core */}
                  <circle r={r * 0.34} fill={CYAN} opacity="0.95" />
                  <circle r={r * 0.16} fill={DARK} />
                  {/* lens specular */}
                  <circle cx={-r * 0.32} cy={-r * 0.34} r={r * 0.18} fill="#FFFFFF" opacity="0.85" />
                  {cfg.eyeStyle === 'wide' && <circle cx={r * 0.34} cy={r * 0.3} r={r * 0.1} fill="#FFFFFF" opacity="0.7" />}
                </g>
              </g>
            );
          })}
        </g>

        {/* ── expression FX ── */}
        {cfg.fx === 'sparks' && (
          <g fill={GOLD} aria-hidden="true">
            <circle cx="66" cy="104" r="3" />
            <circle cx="174" cy="104" r="3" />
          </g>
        )}
        {cfg.fx === 'gear' && (
          <g transform="translate(172 40)" aria-hidden="true">
            <g
              style={
                animate
                  ? { animation: 'forge-fox-gear 2s linear infinite', transformOrigin: 'center', transformBox: 'fill-box' }
                  : undefined
              }
            >
              <circle r="10" fill="none" stroke={GOLD} strokeWidth="3" strokeDasharray="4 3" />
              <circle r="3.5" fill={GOLD} />
            </g>
          </g>
        )}
        {cfg.fx === 'arcs' && (
          <g stroke={CYAN} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" aria-hidden="true">
            <path d="M 152 110 Q 158 114 152 118" />
            <path d="M 158 106 Q 168 114 158 122" />
            <path d="M 164 102 Q 178 114 164 126" />
          </g>
        )}
        {cfg.fx === 'orbit' && (
          <g fill={GOLD} aria-hidden="true">
            <circle cx="60" cy="70" r="3.5" />
            <circle cx="180" cy="70" r="3.5" />
            <circle cx="70" cy="140" r="2.5" fill={CYAN} />
            <circle cx="170" cy="140" r="2.5" fill={CYAN} />
          </g>
        )}
        {cfg.fx === 'zzz' && (
          <text x="168" y="52" fontSize="22" fill={CREAM} opacity="0.8" fontFamily="var(--font-display)" aria-hidden="true">
            z z
          </text>
        )}
        {cfg.fx === 'question' && (
          <text x="166" y="52" fontSize="26" fill={CYAN} fontWeight="bold" fontFamily="var(--font-display)" aria-hidden="true">
            ?
          </text>
        )}
        {cfg.fx === 'trophy' && (
          <g aria-hidden="true">
            <circle cx="62" cy="66" r="3.5" fill={GOLD} />
            <circle cx="178" cy="66" r="3.5" fill={GOLD} />
            <circle cx="52" cy="100" r="2.5" fill={PLASMA} />
            <circle cx="188" cy="100" r="2.5" fill={PLASMA} />
            <circle cx="72" cy="42" r="2.5" fill={CYAN} />
            <circle cx="168" cy="42" r="2.5" fill={CYAN} />
          </g>
        )}
        {cfg.fx === 'bang' && (
          <text x="168" y="52" fontSize="28" fill={GOLD} fontWeight="bold" fontFamily="var(--font-display)" aria-hidden="true">
            !
          </text>
        )}
      </svg>
    </motion.div>
  );
}
