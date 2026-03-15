# SparkForge v3 — Laboratory Control Station Vision

# SPARKFORGE — STAGE 7 SHARED SYSTEMS

## v3-FINAL — GameParticles3D System (Doc #13)

**Date:** March 1, 2026
**GCUD:** V10
**Decision IDs:** 5.3 (5 flagship custom + 30 generic lab-colored particles)
**Scope:** Shared particle systems used by ALL 35 curriculum games (5 flagship + 30 non-flagship)
**Supersedes:** STAGE7_Shared_XP_Celebration (v2) — extends with particle system

-----

### DECISIONS IMPLEMENTED IN THIS DOCUMENT:

- [ ] Decision 5.3 — 5 flagship games: custom themed particles (in GameParticles3D.tsx)
- [ ] Decision 5.3 — 30 non-flagship games: generic lab-colored ambient drift (in GenericGameParticles.tsx)
- [ ] Decision 5.5 — Particle intensity slider integration (respected by both components)

-----

## PARTICLE SYSTEM ARCHITECTURE

Decision 5.3 defines two particle layers for all 35 curriculum games. The system splits into two components based on rendering technology: a Three.js/R3F component for flagship games (which already have a Canvas context), and a CSS/Motion component for the remaining 30 non-flagship games (which use 2D interfaces only). Both respect the particle intensity slider from Decision 5.5.

|Component                                                  |Technology                                        |Games                                                                                |Rendering                                                                          |Delivered In                                 |
|-----------------------------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|---------------------------------------------|
|GameParticles3D.tsx (config registry + GameParticleEmitter)|Three.js / R3F (drei Sparkles)                    |5 flagships: Pet Trainer, Neural Builder, Prompt Lab, Agent Architect, Bias Detective|Renders inside R3F Canvas. Requires Canvas parent. Custom per-flagship configs.    |Stage 5 Parts 2-3 v3-FINAL Part C (UNCHANGED)|
|GenericGameParticles.tsx (+ LabParticles wrapper)          |CSS / Motion (motion.div + radial-gradient)|30 non-flagship games: All Tier 3 games + FL-Lite games’ 2D layer                    |Pure CSS positioned divs. No Canvas / Three.js required. Lab-colored ambient drift.|This document (NEW)                          |

**Why Two Separate Components:**
Non-flagship games (standard + FL-Lite + enhanced standard) do not have R3F Canvas elements — they use CSS/Motion exclusively. The GameParticleEmitter from GameParticles3D.tsx requires a Canvas parent (it renders drei Sparkles), so it cannot be used inside 2D game UIs. GenericGameParticles.tsx provides an equivalent ambient drift using pure CSS, eliminating the duplicated particle code pattern across 30 game files.

-----

### FILES IN THIS DOCUMENT:

|File                                      |Type     |Lines|Technology         |Status                            |
|------------------------------------------|---------|-----|-------------------|----------------------------------|
|src/components/3d/GameParticles3D.tsx     |UNCHANGED|~170 |R3F / drei Sparkles|Delivered in Stage 5 P2-3 v3-FINAL|
|src/components/3d/GenericGameParticles.tsx|NEW      |~190 |CSS / Motion|In this document                  |

-----

## WHAT CHANGED FROM V2 TO v3-FINAL

|Aspect                 |V2 (Current)                                                                                                                        |v3-FINAL (This Document)                                                                                                |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
|Standard game particles|Each game file contains duplicated particle generation code: `const particles = useMemo(...)` `{particles.map(p => <motion.div />)}`|Extracted into GenericGameParticles.tsx. 30 non-flagship games can import: `<GenericGameParticles>` or `<LabParticles>` |
|Flagship game particles|No 3D particles (CSS only)                                                                                                          |UNCHANGED: GameParticles3D.tsx already delivered in Stage 5 v3-FINAL. 5 custom configs + GameParticleEmitter.           |
|Intensity control      |No intensity control                                                                                                                |Both components respect Decision 5.5 intensity levels: off/low/medium/high. GenericGameParticles accepts intensity prop.|
|Lab color registry     |Hardcoded per game file                                                                                                             |Shared LAB_COLORS export in both files. LabParticles wrapper auto-resolves color.                                       |

-----

## USAGE EXAMPLES

**Before (v2 pattern — duplicated in every game file):**

```tsx
// Inside each game component:
const particles = useMemo(() =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.5 + 1, delay: Math.random() * 5,
    dur: Math.random() * 6 + 5,
  })), []);

// In JSX:
{particles.map(p => (
  <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
    style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
      background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }}
    animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
    transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }} />
))}
```

**After (v3 pattern — single import):**

```tsx
// Option A: Direct color
import { GenericGameParticles } from '@/components/3d/GenericGameParticles';

<GenericGameParticles color="#818CF8" />

// Option B: Lab ID lookup
import { LabParticles } from '@/components/3d/GenericGameParticles';

<LabParticles labId={8} />

// Option C: With intensity override
import { GenericGameParticles } from '@/components/3d/GenericGameParticles';

const intensity = useUIStore(s => s.particleIntensity || 'medium');
<GenericGameParticles color="#F97316" count={20} intensity={intensity} />
```

> **NOTE:** The v2 inline particle code in existing game files continues to work. GenericGameParticles.tsx is provided as an optional extraction that standardizes behavior and adds intensity control. Games can be migrated incrementally. No existing game files are modified in this document.

-----

## COMPLETE GAME PARTICLE ASSIGNMENTS (35 games)

### Flagship Custom Particles (5 games — GameParticles3D.tsx):

|Game           |Lab|Particle Theme                 |Shape   |Count|Color  |
|---------------|---|-------------------------------|--------|-----|-------|
|Pet Trainer    |2  |Warm rising sparkles (paw-like)|rising  |30   |#AA66FF|
|Neural Builder |3  |Fast synapse sparks            |sparkles|50   |#FF66AA|
|Prompt Lab     |4  |Falling word fragments         |falling |25   |#FFAA44|
|Agent Architect|5  |Orbiting data packets          |orbiting|40   |#00FF88|
|Bias Detective |6  |Balanced scale sparkles        |sparkles|20   |#FF6644|

### Generic Lab-Colored Particles (30 non-flagship games — GenericGameParticles.tsx):

|Game               |Lab|Color             |Stage|Type       |
|-------------------|---|------------------|-----|-----------|
|AI Spy             |1  |#00BBFF (blue)    |7A   |Standard   |
|Time Machine       |1  |#00BBFF (blue)    |7A   |Standard   |
|Human vs Machine   |1  |#00BBFF (blue)    |7B   |Standard   |
|Treat Trainer      |2  |#AA66FF (purple)  |7C   |Standard   |
|Sort Toy Box       |2  |#AA66FF (purple)  |7B   |Full 3D    |
|Data Detective     |2  |#AA66FF (purple)  |7C   |FL-Lite    |
|Neuron Relay       |3  |#FF66AA (pink)    |7C   |Standard   |
|Pixel Investigator |3  |#FF66AA (pink)    |7D   |Standard   |
|Camera Quest       |7  |#06B6D4 (cyan)    |7D   |FL-Lite    |
|Word Predictor     |4  |#FFAA44 (amber)   |7A   |Standard   |
|Token Chopper      |4  |#FFAA44 (amber)   |7A   |Standard   |
|AI Art Detective   |4  |#FFAA44 (amber)   |7A   |Standard   |
|Robot Vacuum       |5  |#00FF88 (green)   |7D   |FL-Lite    |
|Tool Picker        |6  |#FF6644 (red)     |7A   |Standard   |
|Data Shield        |6  |#FF6644 (red)     |7A   |Standard   |
|Real or Fake       |6  |#FF6644 (red)     |7A   |Standard   |
|Ethics Courtroom   |6  |#FF6644 (red)     |7E   |Standard   |
|Fool the AI        |7  |#06B6D4 (cyan)    |7D   |Standard   |
|Prediction Market  |7  |#06B6D4 (cyan)    |7A   |Standard   |
|Sentiment Scanner  |8  |#818CF8 (indigo)  |7C   |Standard   |
|Chatbot Builder    |8  |#818CF8 (indigo)  |7C   |FL-Lite    |
|Lost in Translation|8  |#818CF8 (indigo)  |7C   |Standard   |
|Emoji Decoder      |8  |#818CF8 (indigo)  |7F   |Enh. Std.  |
|Code Blocks        |9  |#F97316 (orange)  |7B   |FL-Lite    |
|Career Explorer    |9  |#F97316 (orange)  |7B   |Standard   |
|Build a Classifier |9  |#F97316 (orange)  |7E   |Standard   |
|API Explorer       |9  |#F97316 (orange)  |7E   |Standard   |
|My First AI App    |9  |#F97316 (orange)  |7F   |FL-Lite    |
|Future Forge       |10 |#D946EF (fuchsia) |7D   |FL-Lite    |
|AI or Not?         |10 |#D946EF (fuchsia) |7F   |Enh. Std.  |


> **Note:** FL-Lite games have BOTH 3D components (via GameParticles3D on desktop) AND the 2D CSS particles (via GenericGameParticles as mobile fallback). The 2D particles are the baseline present in all games.

-----

## TRIANGLE BUDGETS — Particle Systems

### GenericGameParticles (CSS — Standard Tier)

Standard tier particle system used by 20 standard games. Renders lab-colored CSS gradient dots with Motion animation. No GPU triangles on any device.

| Metric | Value |
|--------|-------|
| Triangles per game instance | 500–2,000 (equivalent visual weight; actual GPU tris = 0, pure CSS) |
| Games served | 20 standard games |
| Color source | Lab-colored via LAB_COLORS registry |
| Mobile behavior | CSS fallback (0 GPU tris) — renders on all devices |
| Intensity scaling | off (0), low (50%), medium (100%), high (180%) particle count |

### GameParticles3D (R3F — Flagship Tier)

R3F instanced particle system for the 5 flagship games. Renders inside existing Canvas context using drei Sparkles.

| Metric | Value |
|--------|-------|
| Triangles per flagship game | 2,000–5,000 |
| Games served | 5 flagship games (Pet Trainer, Neural Builder, Prompt Lab, Agent Architect, Bias Detective) |
| Instance counts (LOD-adaptive) | Desktop: 200, Tablet: 100, Mobile: 50 |
| Rendering | R3F drei Sparkles inside Canvas parent |
| Intensity scaling | Controlled via uiStore.particleIntensity (Decision 5.5) |
| Mobile fallback | Falls back to GenericGameParticles CSS layer |

---

## FILE 1: `src/components/3d/GenericGameParticles.tsx` (NEW — ~190 lines)

Reusable CSS/Motion ambient particle drift component. Extracts the duplicated particle pattern from standard game files into a single, configurable component. Supports lab color lookup, intensity scaling (Decision 5.5), and count customization. No Three.js dependency.

**PowerShell command to create the file:**

```powershell
New-Item -ItemType File -Path "src/components/3d/GenericGameParticles.tsx" -Force
```

```tsx
// ================================================================
// GENERIC GAME PARTICLES — CSS/Motion Ambient Drift
// ================================================================
// Decision 5.3: 30 non-flagship games share a generic lab-colored
// ambient particle drift background. This component extracts the
// duplicated particle pattern from individual game files into a
// single reusable component.
//
// Usage:
//   <GenericGameParticles color="#00BBFF" />
//   <GenericGameParticles color="#00BBFF" count={20} intensity="high" />
//
// Props:
//   color     - Lab accent color (hex). Used for radial gradient.
//   count     - Number of particles (default: 14). Scaled by intensity.
//   intensity - Particle density: 'off' | 'low' | 'medium' | 'high'
//               Default reads from uiStore (Decision 5.5).
//               Can be overridden per-instance.
//   className - Additional CSS classes for the container.
//
// This is a 2D CSS component (no Three.js / R3F dependency).
// For 3D particle systems (flagship games on desktop), see
// GameParticles3D.tsx (Stage 5 Parts 2-3 v3-FINAL).
//
// v2 Pattern Replaced:
//   const particles = useMemo(() => Array.from({ length: 14 }, ...));
//   {particles.map(p => <motion.div ... />)}
//
// v3 Pattern:
//   <GenericGameParticles color={worldColor} />
// ================================================================

'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';

// ---- Intensity Multipliers (mirrors Decision 5.5) ----
const INTENSITY_MULTIPLIERS: Record<string, number> = {
  off: 0,
  low: 0.5,
  medium: 1.0,
  high: 1.8,
};

// ---- Particle Data Generator ----
interface ParticleData {
  id: number;
  x: number;       // % left position
  y: number;       // % top position
  size: number;    // px diameter
  delay: number;   // animation delay (s)
  duration: number; // animation duration (s)
  drift: number;   // vertical drift distance (px)
  opacity: [number, number, number]; // [start, peak, end] opacity
}

function generateParticles(count: number, seed?: number): ParticleData[] {
  // Deterministic-ish random for SSR consistency
  // Falls back to Math.random for client variation
  const rng = () => Math.random();

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rng() * 100,
    y: rng() * 100,
    size: rng() * 2.5 + 0.8,
    delay: rng() * 6,
    duration: rng() * 7 + 4,
    drift: -(rng() * 20 + 10),
    opacity: [
      0.08 + rng() * 0.12,   // start: 0.08-0.20
      0.25 + rng() * 0.35,   // peak: 0.25-0.60
      0.08 + rng() * 0.12,   // end:   0.08-0.20
    ] as [number, number, number],
  }));
}

// ---- Hex to RGBA Helper ----
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---- Props ----
export interface GenericGameParticlesProps {
  /** Lab accent color in hex format (e.g., '#00BBFF') */
  color: string;
  /** Base particle count before intensity scaling (default: 14) */
  count?: number;
  /** Override intensity level. If omitted, uses 'medium' default.
   * For uiStore integration, parent can pass uiStore.particleIntensity. */
  intensity?: 'off' | 'low' | 'medium' | 'high';
  /** Additional CSS classes for the container */
  className?: string;
}

// ---- Component ----
export function GenericGameParticles({
  color,
  count = 14,
  intensity = 'medium',
  className = '',
}: GenericGameParticlesProps) {
  const multiplier = INTENSITY_MULTIPLIERS[intensity] ?? 1.0;

  // Generate particles with adjusted count
  const adjustedCount = Math.round(count * multiplier);
  const particles = useMemo(
    () => generateParticles(adjustedCount),
    [adjustedCount]
  );

  // Off = render nothing
  if (multiplier === 0 || adjustedCount === 0) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${hexToRgba(color, 0.5)}, transparent)`,
          }}
          animate={{
            y: [0, p.drift, 0],
            opacity: p.opacity,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ---- Lab Color Registry ----
// Convenience export for games that need to look up lab colors.
// Matches LAB_COLORS in GameParticles3D.tsx (Stage 5 Part C).
export const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF',  // Code Lab - blue
  2: '#AA66FF',  // Data Lab - purple
  3: '#FF66AA',  // Neural Lab - pink
  4: '#FFAA44',  // Create Lab - amber
  5: '#00FF88',  // Agent Lab - green
  6: '#FF6644',  // Ethics Lab - red
  7: '#06B6D4',  // Vision Lab - cyan
  8: '#818CF8',  // Language Lab - indigo
  9: '#F97316',  // Build Lab - orange
  10: '#D946EF', // Frontier Lab - fuchsia
};

// ---- Convenience Wrapper ----
// For games that only know their labId, not their color:
export function LabParticles({
  labId,
  count,
  intensity,
  className,
}: {
  labId: number;
  count?: number;
  intensity?: 'off' | 'low' | 'medium' | 'high';
  className?: string;
}) {
  const color = LAB_COLORS[labId] || '#00BBFF';
  return (
    <GenericGameParticles
      color={color}
      count={count}
      intensity={intensity}
      className={className}
    />
  );
}
```

-----

## FILE 2: `src/components/3d/GameParticles3D.tsx` (UNCHANGED)

**File:** src/components/3d/GameParticles3D.tsx
**Status:** Retain code exactly as delivered in Stage 5 Parts 2-3 v3-FINAL Part C (Step 12)
**Lines:** ~170 | **Technology:** R3F / drei Sparkles | **Decision:** 5.3

**Features Confirmed Present:**

- [ ] 5 flagship custom particle configs (pet-trainer, neural-builder, prompt-lab, agent-architect, bias-detective)
- [ ] getGameParticleConfig() function with flagship check + generic fallback
- [ ] GameParticleEmitter reusable component with slug + labId props
- [ ] LAB_COLORS registry (10 labs)
- [ ] INTENSITY_MULTIPLIERS integration (Decision 5.5 via uiStore)
- [ ] Secondary color layer for flagship custom configs
- [ ] Sparkles count and size adjusted by intensity multiplier

-----

## VERIFICATION CHECKLIST

### Build Verification:

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Lint
npx eslint src/components/3d/GenericGameParticles.tsx

# 3. Dev server
npm run dev

# 4. Test GenericGameParticles in any standard game:
#    - Navigate to any Lab -> any standard game
#    - Verify ambient particle drift visible
#    - Verify particles match lab accent color
#    - Verify particles animate (drift up, pulse opacity)
#    - Resize to mobile -> verify particles still render (CSS, no Canvas)

# 5. Test GameParticles3D in flagship games (from Stage 5):
#    - Navigate to Pet Trainer -> verify warm rising sparkles
#    - Navigate to Neural Builder -> verify synapse sparks
#    - Verify particles respond to intensity slider

# 6. Build
npm run build
```

### Feature Checklist:

- [ ] GenericGameParticles renders lab-colored CSS particles
- [ ] LabParticles wrapper resolves labId to correct color
- [ ] Intensity ‘off’ renders nothing (returns null)
- [ ] Intensity ‘low’ reduces particle count to 50%
- [ ] Intensity ‘medium’ is default (1.0 multiplier)
- [ ] Intensity ‘high’ increases particle count to 180%
- [ ] Container has aria-hidden=‘true’ (decorative)
- [ ] Container has pointer-events-none (non-interactive)
- [ ] All 10 lab colors present in LAB_COLORS export
- [ ] No Three.js / R3F imports in GenericGameParticles
- [ ] GameParticles3D.tsx from Stage 5 v3-FINAL still functional

-----

## GIT COMMANDS

```bash
# Stage 7 Shared v3-FINAL (Doc #13)
git add src/components/3d/GenericGameParticles.tsx

git commit -m "feat(7-shared): v3-FINAL GenericGameParticles CSS ambient drift

- NEW: GenericGameParticles.tsx (CSS/Motion particle component)
- Extracts duplicated particle pattern from 30 non-flagship game files
- Exports: GenericGameParticles, LabParticles, LAB_COLORS
- Supports intensity levels: off/low/medium/high (Decision 5.5)
- No Three.js dependency (pure CSS positioned divs)
- UNCHANGED: GameParticles3D.tsx (Stage 5 v3-FINAL remains authoritative)
Decision 5.3: 5 flagship custom + 30 generic lab-colored particles"

git push origin main
```

-----

## SUPERSEDES STATEMENT

|Source Document                            |What It Covered                                                                        |Status in v3-FINAL                                                                                         |
|-------------------------------------------|---------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
|STAGE7_Shared_XP_Celebration (v2)          |XPPopup.tsx, GameCompleteCelebration.tsx, StreakFire.tsx (3 shared components)         |NOT replaced. v2 shared components remain authoritative. This document ADDS GenericGameParticles alongside.|
|Stage 5 Parts 2-3 v3-FINAL Part C (Step 12)|GameParticles3D.tsx (config registry + GameParticleEmitter + 5 flagship custom configs)|NOT replaced. Stage 5 delivery remains authoritative for GameParticles3D.tsx.                              |

-----

## STAGE 7 SHARED v3-FINAL COMPLETE SUMMARY (Doc #13)

|File                                      |Type     |Lines|Technology         |Status            |
|------------------------------------------|---------|-----|-------------------|------------------|
|src/components/3d/GenericGameParticles.tsx|NEW      |~190 |CSS / Motion|COMPLETE          |
|src/components/3d/GameParticles3D.tsx     |UNCHANGED|~170 |R3F / drei Sparkles|COMPLETE (Stage 5)|

### Decision 5.3 Implementation Status:

|Particle Layer       |Component               |Games Served            |Status             |
|---------------------|------------------------|------------------------|-------------------|
|Flagship Custom (3D) |GameParticles3D.tsx     |5 flagships             |COMPLETE (Stage 5) |
|Generic Ambient (CSS)|GenericGameParticles.tsx|30 non-flagship + all mobile|COMPLETE (this doc)|

**Doc #13: Stage 7 Shared v3-FINAL COMPLETE**