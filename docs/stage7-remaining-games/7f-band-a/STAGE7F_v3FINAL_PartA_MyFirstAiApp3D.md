# SparkForge v3 — Laboratory Control Station Vision

## SPARKFORGE — STAGE 7F: MY FIRST AI APP

### v3-FINAL (PART A)

**Date:** February 28, 2026
**GCUD:** V9
**Vision:** Laboratory Control Station
**Design Direction:** Frost-Prismatic v3 (blue-dominant 60/40, chrome bezel, hex-radial, R3F station frame)
**Age Bands:** A (7-10), B (11-13), C (14-16)

---

## Game Lab Color Treatment

| Game | Lab | Color | Tier |
|------|-----|-------|------|
| My First AI App | Lab 9 — Build with AI | Orange (#F97316) | Flagship-Lite (Tier 2 Enhanced 3D) |
| Emoji Decoder | Lab 8 — Words & Language | Indigo (#6366F1) | Enhanced Standard (Tier 3 — UNCHANGED) |
| AI or Not? | Lab 10 — AI's Future | Fuchsia (#D946EF) | Enhanced Standard (Tier 3 — UNCHANGED) |

---

## DECISIONS IMPLEMENTED IN THIS DOCUMENT

- [ ] Decision 6.5 — Tier 2 Enhanced 3D for My First AI App: 3D app mockup that assembles as child builds it, holographic preview of finished app

## V2 FEATURES PRESERVED

- [ ] My First AI App: 5-step build wizard, 7 categories, 9 AI powers, 6 themes, innovation score, app card (v2 code in Part B)
- [ ] Emoji Decoder: 16 puzzles, 3 tiers, AI comparison, streak bonus, emoji lab (UNCHANGED — Tier 3)
- [ ] AI or Not?: 12 scenarios, 3 categories, confidence slider, prediction round (UNCHANGED — Tier 3)
- [ ] All games: Chrome bezels, particle backgrounds, age-band depth (A/B/C), ARIA labels

---

## FILES IN THIS DOCUMENT (Part A)

**New:** 1 file | **Total lines:** ~478

| File | Type | Lines | Triangles | Mobile Fallback |
|------|------|-------|-----------|----------------|
| `src/components/3d/MyFirstAiApp3D.tsx` | NEW | ~478 | ~2K | Hidden (CSS game UI only) |

**PREREQUISITES:** Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure) must be complete.

**SUPERSEDES:** No prior 3D component exists for this game (v2 was CSS/Framer Motion only).

**FILES IN PART B:** MyFirstAiAppGame.tsx (full standalone replacement with 3D integration) + Unchanged files + Verification + Git

---

## WHAT CHANGED FROM V2 TO v3-FINAL

| Aspect | V2 (Current) | v3-FINAL (This Document) |
|--------|-------------|--------------------------|
| Build Wizard | CSS step indicator + Framer Motion transitions | CSS preserved + 3D phone mockup assembles as child builds (desktop only) |
| 3D Component | None | MyFirstAiApp3D.tsx (NEW). Dynamic import, ssr: false. Mobile CSS fallback. |
| Power Selection | CSS grid with glow border + pulse animation | CSS preserved + 3D floating orbs ring around phone with connection lines (desktop) |
| App Preview | CSS gradient card with flip entrance | CSS card preserved + 3D holographic floating card with slow rotation (desktop) |
| Innovation Score | Framer Motion animated bar + counter | Bar preserved + 3D score bar on holographic card (desktop) |
| Triangle Budget | N/A (CSS/Framer Motion) | ~2K triangles (phone + orbs + platform + holographic card) |
| Performance | CSS + Framer Motion | ~2K tri. frameloop=demand. Desktop only (mobile = CSS game UI). |

---

## 3D COMPONENT SPECIFICATION (Decision 6.5)

Decision 6.5 specifies Tier 2 Enhanced 3D treatment for 7 flagship-lite games. These are themed 3D elements that augment (not replace) the existing 2D game layout. The 3D scene renders in a contained Canvas above the game UI, with mobile CSS fallback. Triangle budget: 2-5K per game.

### MyFirstAiApp3D.tsx — 3D App Mockup Assembly

**PREREQUISITES:**

Packages should exist from Stage 3 P3 v3-FINAL:

```bash
npm list three @react-three/fiber @react-three/drei @react-three/postprocessing
```

If missing:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

| Element | Implementation Details |
|---------|----------------------|
| **Phone Frame** | BoxGeometry(1.6, 2.8, 0.12) outer shell with inner bezel + PlaneGeometry screen. MeshStandardMaterial metallic dark body. Screen emissive glows with theme color. Progress bar at bottom grows with build steps. Gentle float animation. |
| **Screen Content** | PlaneGeometry(1.3, 2.4) overlay. Opacity increases with build progress. Color matches selected design theme. Notch detail at top. |
| **Power Orbs** | SphereGeometry(0.15, 12, 8) per selected power. Arranged in ring (radius 1.6) around phone. Each orb uses power's color with emissive glow. Individual bob animation with phase offset. Connection lines (LineBasicMaterial) from orbs to phone center. |
| **Glow Rings** | RingGeometry(0.16, 0.25, 16) per orb. Pulsing opacity. Matches power color. Gives each orb a halo effect. |
| **Holographic Preview** | PlaneGeometry(2.0, 1.2) floating above phone. MeshPhysicalMaterial with transmission 0.3, clearcoat 1.0. Slow Y rotation (0.3 rad/s). Only visible in preview/complete phase. |
| **Innovation Bar** | BoxGeometry bar width scales with score (0-100). Theme-colored emissive. Background bar at 5% opacity for contrast. |
| **Base Platform** | CircleGeometry(2.2, 32) dark disc. Outer RingGeometry with theme-colored emissive edge. 5 concentric grid rings for tech feel. Slow rotation on outer ring. |
| **Camera** | Fixed position [0, 1.5, 5], FOV 40. No OrbitControls (consistent framing). |
| **Lighting** | AmbientLight 0.3 + DirectionalLight 0.5 + 2x PointLight (theme color + orange accent). Environment preset "night". |
| **Triangle Budget** | ~2K max. Phone ~24 tri. Screen 2 tri. Orbs ~96 tri each x 9 max = 864. Rings ~32 tri each x 9 = 288. Platform ~200 tri. Holographic card 2 tri. Lines (no tri). |
| **Mobile Fallback** | Component returns null when isMobile=true. Game falls back to CSS/Framer Motion UI only. Auto-detect via window.innerWidth < 768 in parent game component. |

---

## FILE 1: `src/components/3d/MyFirstAiApp3D.tsx` (NEW — ~478 lines)

This component renders a 3D app mockup assembly visualization. It receives build state from the parent MyFirstAiAppGame component: build step progress, selected AI powers, design theme color, app name, and innovation score. The phone frame assembles progressively as the child completes build steps. AI power orbs float in a ring around the phone. In preview mode, a holographic card appears above with slow rotation. Desktop only; mobile falls back to CSS game UI.

```powershell
New-Item -ItemType File -Path "src/components/3d/MyFirstAiApp3D.tsx" -Force
```

```tsx
"use client";

// ================================================================
// MY FIRST AI APP 3D — Lab 9 (Build with AI) — v3 Enhanced 3D
// [v3] 3D app mockup that assembles as child builds it
// [v3] Floating AI power orbs with emissive glow
// [v3] Holographic app preview card with slow rotation
// [v3] Build progress shown via assembling phone frame
// [v3] Decision 6.5 — Tier 2 Enhanced 3D (~2K triangles)
// ================================================================

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ---- Types ----

interface PowerOrb {
  id: string;
  emoji: string;
  color: string;
  techLabel: string;
}

interface MyFirstAiApp3DProps {
  buildStep: number;        // 0-4 (category, name, powers, audience, design)
  totalSteps: number;       // 5
  selectedPowers: PowerOrb[];
  maxPowers: number;
  themeColor: string;       // hex accent from selected theme
  categoryEmoji: string;
  appName: string;
  innovationScore: number;  // 0-100
  isPreview: boolean;       // true when app card is shown
  isMobile?: boolean;
}

// ---- Phone Frame ----

function PhoneFrame({
  buildProgress,
  themeColor,
  isPreview,
}: {
  buildProgress: number; // 0-1
  themeColor: string;
  isPreview: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;

    // Slow rotation in preview mode
    if (isPreview) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        0.05
      );
    }

    // Screen emissive pulse
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isPreview
        ? 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 0.1 + buildProgress * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Phone body — outer shell */}
      <mesh>
        <boxGeometry args={[1.6, 2.8, 0.12]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Phone bezel — inner rim */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.5, 2.7, 0.08]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.065]}>
        <planeGeometry args={[1.4, 2.5]} />
        <meshStandardMaterial
          color={isPreview ? themeColor : "#111827"}
          emissive={themeColor}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Screen content glow overlay */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[1.3, 2.4]} />
        <meshBasicMaterial
          color={themeColor}
          transparent
          opacity={buildProgress * 0.08}
        />
      </mesh>

      {/* Notch */}
      <mesh position={[0, 1.2, 0.07]}>
        <boxGeometry args={[0.5, 0.08, 0.01]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>

      {/* Build progress bar at bottom of screen */}
      {!isPreview && buildProgress > 0 && (
        <mesh position={[-0.7 + (buildProgress * 1.4) / 2, -1.15, 0.07]}>
          <boxGeometry args={[buildProgress * 1.4, 0.06, 0.01]} />
          <meshStandardMaterial
            color={themeColor}
            emissive={themeColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ---- Power Orb ----

function PowerOrbMesh({
  position,
  color,
  index,
  total,
}: {
  position: [number, number, number];
  color: string;
  index: number;
  total: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Individual bob offset
    meshRef.current.position.y =
      position[1] + Math.sin(t * 1.2 + index * 1.5) * 0.08;

    // Gentle spin
    meshRef.current.rotation.y = t * 0.5 + index * (Math.PI / total);

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 2 + index) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 12, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Glow ring */}
      <mesh
        ref={glowRef}
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.16, 0.25, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---- Power Orbs Ring ----

function PowerOrbsRing({
  powers,
  maxPowers,
}: {
  powers: PowerOrb[];
  maxPowers: number;
}) {
  const positions = useMemo(() => {
    const radius = 1.6;
    return powers.map((_, i) => {
      const angle = (i / Math.max(maxPowers, powers.length)) * Math.PI * 2 - Math.PI / 2;
      return [
        Math.cos(angle) * radius,
        0.2,
        Math.sin(angle) * radius,
      ] as [number, number, number];
    });
  }, [powers, maxPowers]);

  return (
    <group>
      {powers.map((pow, i) => (
        <PowerOrbMesh
          key={pow.id}
          position={positions[i]}
          color={pow.color}
          index={i}
          total={powers.length}
        />
      ))}

      {/* Connection lines from orbs to phone */}
      {powers.map((pow, i) => {
        const start = positions[i];
        if (!start) return null;
        const pts = new Float32Array([
          start[0], start[1], start[2],
          0, 0, 0.1,
        ]);
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(pts, 3));

        return (
          <line key={`line-${pow.id}`}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                array={pts}
                count={2}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={pow.color}
              transparent
              opacity={0.2}
            />
          </line>
        );
      })}
    </group>
  );
}

// ---- Holographic Preview (Preview Mode) ----

function HolographicPreview({
  themeColor,
  innovationScore,
}: {
  themeColor: string;
  innovationScore: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    meshRef.current.position.y =
      1.8 + Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
  });

  const barWidth = (innovationScore / 100) * 1.5;

  return (
    <group>
      {/* Floating holographic card */}
      <mesh ref={meshRef} position={[0, 1.8, 0]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshPhysicalMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.25}
          transmission={0.3}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Innovation score bar */}
      <mesh position={[(-1.5 + barWidth) / 2, 1.0, 0]}>
        <boxGeometry args={[barWidth, 0.08, 0.02]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Score bar background */}
      <mesh position={[0, 1.0, -0.01]}>
        <boxGeometry args={[1.5, 0.08, 0.01]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

// ---- Base Platform ----

function BasePlatform({ themeColor }: { themeColor: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
  });

  return (
    <group>
      {/* Platform disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <circleGeometry args={[2.2, 32]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Outer ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.48, 0]}
      >
        <ringGeometry args={[2.0, 2.2, 48]} />
        <meshStandardMaterial
          color={themeColor}
          emissive={themeColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Grid lines on platform */}
      {Array.from({ length: 5 }).map((_, i) => {
        const radius = 0.4 + i * 0.4;
        return (
          <mesh
            key={`grid-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.47, 0]}
          >
            <ringGeometry args={[radius - 0.01, radius, 32]} />
            <meshBasicMaterial
              color={themeColor}
              transparent
              opacity={0.06}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---- Scene ----

function Scene(props: MyFirstAiApp3DProps) {
  const {
    buildStep,
    totalSteps,
    selectedPowers,
    maxPowers,
    themeColor,
    innovationScore,
    isPreview,
  } = props;

  const buildProgress = (buildStep + 1) / totalSteps;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.5}
        color="#ffffff"
      />
      <pointLight
        position={[0, 2, 2]}
        intensity={0.4}
        color={themeColor}
        distance={6}
      />
      <pointLight
        position={[-2, 0, -1]}
        intensity={0.2}
        color="#F97316"
        distance={5}
      />

      {/* Environment */}
      <Environment preset="night" />

      {/* Base platform */}
      <BasePlatform themeColor={themeColor} />

      {/* Phone mockup */}
      <PhoneFrame
        buildProgress={buildProgress}
        themeColor={themeColor}
        isPreview={isPreview}
      />

      {/* AI Power orbs (visible during powers step and beyond) */}
      {selectedPowers.length > 0 && (
        <PowerOrbsRing
          powers={selectedPowers}
          maxPowers={maxPowers}
        />
      )}

      {/* Holographic preview (only in preview/complete phase) */}
      {isPreview && (
        <HolographicPreview
          themeColor={themeColor}
          innovationScore={innovationScore}
        />
      )}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.4}
          intensity={0.4}
        />
      </EffectComposer>
    </>
  );
}

// ---- Export ----

export default function MyFirstAiApp3D(props: MyFirstAiApp3DProps) {
  if (props.isMobile) return null;

  return (
    <div
      className="w-full h-48 md:h-56 rounded-xl overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 1.5, 5],
          fov: 40,
          near: 0.1,
          far: 50,
        }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
```

---

## PART A SUMMARY

| File | Type | Lines | Triangles | Mobile Fallback |
|------|------|-------|-----------|----------------|
| `src/components/3d/MyFirstAiApp3D.tsx` | NEW | ~478 | ~2K | Hidden (CSS game UI only) |

### Decision 6.5 Implementation Summary (7F games)

| Game | Tier | 3D Component | Status |
|------|------|-------------|--------|
| My First AI App | Tier 2 Enhanced | MyFirstAiApp3D.tsx — 3D app assembly | COMPLETE (Part A) |
| Emoji Decoder | Tier 3 Standard | None (standard 2D polish) | COMPLETE (no 3D needed) |
| AI or Not? | Tier 3 Standard | None (standard 2D polish) | COMPLETE (no 3D needed) |

---

**NEXT:** Part B — MyFirstAiAppGame.tsx (full standalone replacement with v3 3D integration) + EmojiDecoder (UNCHANGED) + AiOrNot (UNCHANGED) + Verification + Git Commands

---

*Stage 7F v3-FINAL Part A COMPLETE*
