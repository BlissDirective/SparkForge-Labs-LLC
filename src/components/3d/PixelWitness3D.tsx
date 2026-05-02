'use client';

// ════════════════════════════════════════════════════════════════
// PixelWitness3D — Stage 11C dynamic scene content
// ════════════════════════════════════════════════════════════════
// Lab 7 | Color: #10BAD2 (cyan)
//
// What this component owns (per Doc 2 §G.8):
//   • Curved cinema screen — the "stage" where the clip plays. The
//     screen tints by clip theme + active question kind.
//   • AI Eye Iris — a glowing camera-iris that opens/closes as
//     senses toggle. Closed (caption-only) = a single dot. Fully
//     open (all-frames+audio+caption+oneFrame) = a wide aperture.
//
// Reads from usePixelWitnessStore: senseConfig + currentClip +
// currentQuestion + hasRatedCurrent.
// ════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Group,
  MeshBasicMaterial,
} from 'three';

import { usePixelWitnessStore } from '@/stores/pixelWitnessStore';
import { THEME_META } from '@/lib/pixelwitness/clipLibrary';
import { highestSense, senseCost } from '@/lib/pixelwitness/judgeEngine';

const LAB7_HEX = '#10BAD2';
const LAB7_SOFT = '#7FE0EE';

// ─── Curved cinema screen ────────────────────────────────────────

function CinemaScreen() {
  const currentClip = usePixelWitnessStore((s) => s.currentClip);
  const screenMatRef = useRef<MeshBasicMaterial>(null);
  const accent = useMemo(() => {
    if (!currentClip) return new Color(LAB7_HEX);
    return new Color(THEME_META[currentClip.theme].color);
  }, [currentClip]);

  useFrame(({ clock }) => {
    if (screenMatRef.current) {
      screenMatRef.current.opacity = 0.35 + 0.08 * Math.sin(clock.elapsedTime * 0.6);
    }
  });

  return (
    <group position={[0, 1.7, -1.4]}>
      {/* Screen frame (slight curve via ring) */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[2.3, 0.06, 12, 64, Math.PI * 1.1]} />
        <meshStandardMaterial color="#0A1A22" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Curved screen surface (a flattened cone slice approximation) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[4.4, 2.5, 8, 4]} />
        <meshBasicMaterial
          ref={screenMatRef}
          color={accent}
          transparent
          opacity={0.4}
          side={DoubleSide}
        />
      </mesh>
      {/* Faint "scanlines" using a thin striped overlay */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[4.4, 2.5]} />
        <meshBasicMaterial
          color={LAB7_SOFT}
          wireframe
          transparent
          opacity={0.12}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── AI Eye Iris ─────────────────────────────────────────────────
//
// 8 iris blades arranged in a circle. Closing/opening is driven by
// the sense config — each enabled sense pulls blades outward from the
// center, opening the aperture.

function AiEyeIris() {
  const senseConfig = usePixelWitnessStore((s) => s.senseConfig);
  const groupRef = useRef<Group>(null);
  const pupilRef = useRef<MeshBasicMaterial>(null);
  const haloRef = useRef<MeshBasicMaterial>(null);

  // Aperture 0..1: 0 = caption-only (just a dot), 1 = all senses on.
  const aperture = useMemo(() => {
    let n = 0;
    if (senseConfig.caption) n += 0.05;
    if (senseConfig.oneFrame) n += 0.25;
    if (senseConfig.allFrames) n += 0.45;
    if (senseConfig.audio) n += 0.25;
    return Math.min(1, n);
  }, [senseConfig]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    // Slow rotation while open so the iris feels alive.
    groupRef.current.rotation.z = t * 0.15 * aperture;
    if (pupilRef.current) {
      pupilRef.current.opacity = 0.85 + 0.1 * Math.sin(t * 2.4);
    }
    if (haloRef.current) {
      haloRef.current.opacity = (0.2 + 0.5 * aperture) + 0.06 * Math.sin(t * 0.8);
    }
  });

  // 8 iris blades. Each blade's offset from center scales with aperture.
  const blades = 8;
  const bladeRadius = 0.1 + aperture * 0.6;

  return (
    <group ref={groupRef} position={[2.6, 1.4, -0.5]}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.82, 32]} />
        <meshBasicMaterial color={LAB7_HEX} side={DoubleSide} transparent opacity={0.65} />
      </mesh>
      {/* 8 blades */}
      {Array.from({ length: blades }, (_, i) => {
        const angle = (i / blades) * Math.PI * 2;
        return (
          <group
            key={i}
            position={[Math.cos(angle) * bladeRadius, 0, Math.sin(angle) * bladeRadius]}
            rotation={[0, -angle + Math.PI / 2, 0]}
          >
            <mesh>
              <boxGeometry args={[0.3, 0.04, 0.06]} />
              <meshBasicMaterial color={LAB7_SOFT} transparent opacity={0.65} />
            </mesh>
          </group>
        );
      })}
      {/* Pupil (center) */}
      <mesh>
        <sphereGeometry args={[0.06 + aperture * 0.12, 16, 16]} />
        <meshBasicMaterial ref={pupilRef} color={LAB7_HEX} transparent opacity={0.9} />
      </mesh>
      {/* Halo - intensity scales with aperture */}
      <mesh>
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshBasicMaterial ref={haloRef} color={LAB7_HEX} transparent opacity={0.2} side={DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Active-sense ribbons (one ribbon per active sense) ──────────

function SenseRibbons() {
  const senseConfig = usePixelWitnessStore((s) => s.senseConfig);
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.1;
  });

  const ribbons: Array<{ color: string; offset: number }> = [];
  if (senseConfig.caption)  ribbons.push({ color: '#FFD93D', offset: 0 });   // caption = yellow
  if (senseConfig.oneFrame) ribbons.push({ color: '#0FB8FA', offset: 1 });   // frame = blue
  if (senseConfig.allFrames) ribbons.push({ color: '#B67BFF', offset: 2 });  // all frames = violet
  if (senseConfig.audio)    ribbons.push({ color: '#00D17A', offset: 3 });   // audio = green

  return (
    <group ref={groupRef} position={[2.6, 1.4, -0.5]}>
      {ribbons.map((r, i) => {
        const angle = (i / Math.max(1, ribbons.length)) * Math.PI * 2;
        return (
          <mesh
            key={`${r.color}-${r.offset}`}
            position={[Math.cos(angle) * 1.2, 0, Math.sin(angle) * 1.2]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.95, 1.0, 24]} />
            <meshBasicMaterial color={r.color} side={DoubleSide} transparent opacity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Cost meter (visualizes total token cost of active senses) ───

function CostMeter() {
  const senseConfig = usePixelWitnessStore((s) => s.senseConfig);
  const cost = senseCost(senseConfig);

  // Map cost (1..41 max) to a bar height 0..1.
  const fill = Math.min(1, cost / 41);

  return (
    <group position={[-2.6, 1.4, -0.5]}>
      {/* Track */}
      <mesh>
        <boxGeometry args={[0.18, 1.4, 0.06]} />
        <meshBasicMaterial color="#0A1A22" />
      </mesh>
      {/* Fill */}
      <mesh position={[0, -0.7 + (fill * 1.4) / 2, 0.01]}>
        <boxGeometry args={[0.16, fill * 1.4, 0.07]} />
        <meshBasicMaterial color={fill > 0.7 ? '#FF7050' : LAB7_HEX} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.2, 0.05, 0.08]} />
        <meshBasicMaterial color={LAB7_HEX} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ─── Top-level scene component ───────────────────────────────────

export default function PixelWitness3D() {
  const sense = usePixelWitnessStore((s) => s.senseConfig);
  // Force re-render on sense changes; void reference keeps highestSense
  // import alive for downstream components.
  void highestSense(sense);

  return (
    <group>
      <CinemaScreen />
      <AiEyeIris />
      <SenseRibbons />
      <CostMeter />
    </group>
  );
}
