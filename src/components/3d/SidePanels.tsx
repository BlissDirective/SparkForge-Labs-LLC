'use client';

// ================================================================
// CPA v2.0 — SidePanels: Left Radar + Right Terminal (1.5M tri budget)
// ================================================================
// Decision CPA-6: Left=radar/labNav, Right=terminal/stats
//
// Left panel:  Physical rotating radar dish (cylinder base + torus dish
//              + sweep arm), 3D lab blips (spheres), range ring torus
//              geometries, chrome bezel frame, articulated mounting arm.
// Right panel: Scrolling instanced 3D data columns (BoxGeometry bars),
//              holographic Text displays (drei), miniature graph geometry,
//              chrome bezel frame, articulated mounting arm.
//


import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import {
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';
import type { SidePanelContent } from '@/lib/3d/cockpitConfig';
import { dampedLerp, R3F_LERP_SPEED } from '@/lib/animations';

// ════════════════════════════════════════════════════════════════
// Props interface (unchanged from v1)
// ════════════════════════════════════════════════════════════════

interface SidePanelsProps {
  leftContent: SidePanelContent;
  rightContent: SidePanelContent;
  opacity: number;
  labColor: string;
  dimmed: boolean;
}

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════

const PANEL_WIDTH = 2.4;
const PANEL_HEIGHT = 4.2;
const PANEL_DEPTH = 0.12;
const BEZEL_THICKNESS = 0.06;
const ARM_LENGTH = 1.2;
const ARM_WIDTH = 0.14;
const ARM_DEPTH = 0.08;
const JOINT_RADIUS = 0.07;

// 10 lab positions on radar (angles around circle)
const LAB_BLIP_ANGLES = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);
const LAB_BLIP_RADII = [0.6, 0.75, 0.5, 0.85, 0.65, 0.7, 0.8, 0.55, 0.9, 0.45];

// Data column config for terminal
const DATA_COLUMN_COUNT = 24;
const DATA_ROW_COUNT = 32;
const TOTAL_BARS = DATA_COLUMN_COUNT * DATA_ROW_COUNT; // 768 instanced bars

// Chrome bezel material params
const CHROME_COLOR = '#2a2e3e';
const CHROME_METALNESS = 0.92;
const CHROME_ROUGHNESS = 0.18;
const PANEL_FACE_COLOR = '#0d1018';

// ════════════════════════════════════════════════════════════════
// Sub-component: Chrome Bezel Frame
// ════════════════════════════════════════════════════════════════

function ChromeBezelFrame({
  width,
  height,
  depth,
  opacity,
}: {
  width: number;
  height: number;
  depth: number;
  opacity: number;
}) {
  const bezel = BEZEL_THICKNESS;
  const cornerSize = bezel * 2.5;
  const seg = Math.max(2, Math.floor(64 / 4));

  return (
    <group>
      {/* Main frame — 4 edges */}
      {/* Top edge */}
      <mesh position={[0, height / 2 + bezel / 2, 0]}>
        <boxGeometry args={[width + bezel * 2, bezel, depth]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Bottom edge */}
      <mesh position={[0, -height / 2 - bezel / 2, 0]}>
        <boxGeometry args={[width + bezel * 2, bezel, depth]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Left edge */}
      <mesh position={[-width / 2 - bezel / 2, 0, 0]}>
        <boxGeometry args={[bezel, height, depth]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Right edge */}
      <mesh position={[width / 2 + bezel / 2, 0, 0]}>
        <boxGeometry args={[bezel, height, depth]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Corner brackets — 4 L-shaped corners using RoundedBox */}
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as [number, number][]
      ).map(([sx, sy], i) => (
        <group
          key={`corner-${i}`}
          position={[
            sx * (width / 2 + bezel),
            sy * (height / 2 + bezel),
            depth / 2 + 0.005,
          ]}
        >
          <RoundedBox
            args={[cornerSize, cornerSize, 0.015]}
            radius={0.005}
            smoothness={seg}
          >
            <meshStandardMaterial
              color="#3a4055"
              metalness={0.95}
              roughness={0.12}
              transparent
              opacity={opacity * 0.9}
            />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// Sub-component: Articulated Mounting Arm
// ════════════════════════════════════════════════════════════════

function MountingArm({
  side,
  opacity,
}: {
  side: 'left' | 'right';
  opacity: number;
}) {
  const sx = side === 'left' ? 1 : -1; // arm extends inward
  const _jointSegs = 64;

  return (
    <group>
      {/* Wall bracket plate */}
      <mesh position={[sx * (ARM_LENGTH / 2 + 0.1), 0, 0]}>
        <boxGeometry args={[0.2, 0.3, ARM_DEPTH * 1.5]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Joint 1 (wall end) — sphere */}
      <mesh position={[sx * (ARM_LENGTH / 2 + 0.02), 0, 0]}>
        <sphereGeometry args={[JOINT_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#4a5070"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Upper arm segment */}
      <mesh position={[sx * (ARM_LENGTH / 4), 0.02, 0]}>
        <boxGeometry args={[ARM_LENGTH / 2, ARM_WIDTH, ARM_DEPTH]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Joint 2 (elbow) — sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[JOINT_RADIUS * 1.1, 64, 64]} />
        <meshStandardMaterial
          color="#5a6080"
          metalness={0.88}
          roughness={0.22}
          transparent
          opacity={opacity}
          emissive="#00BBFF"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Lower arm segment (angled slightly down toward panel) */}
      <mesh position={[sx * (-ARM_LENGTH / 4), -0.05, 0]} rotation={[0, 0, sx * -0.05]}>
        <boxGeometry args={[ARM_LENGTH / 2, ARM_WIDTH, ARM_DEPTH]} />
        <meshStandardMaterial
          color={CHROME_COLOR}
          metalness={CHROME_METALNESS}
          roughness={CHROME_ROUGHNESS}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Joint 3 (panel attachment) — sphere */}
      <mesh position={[sx * (-ARM_LENGTH / 2 - 0.02), -0.08, 0]}>
        <sphereGeometry args={[JOINT_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#4a5070"
          metalness={0.9}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Hydraulic detail cylinders along arm */}
      {(
        <>
          <mesh
            position={[sx * (ARM_LENGTH / 4), ARM_WIDTH / 2 + 0.015, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry
              args={[0.012, 0.012, ARM_LENGTH * 0.4, 64]}
            />
            <meshStandardMaterial
              color="#6a7090"
              metalness={0.95}
              roughness={0.1}
              transparent
              opacity={opacity * 0.8}
            />
          </mesh>
          <mesh
            position={[sx * (-ARM_LENGTH / 4), ARM_WIDTH / 2 + 0.015, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry
              args={[0.01, 0.01, ARM_LENGTH * 0.35, 64]}
            />
            <meshStandardMaterial
              color="#6a7090"
              metalness={0.95}
              roughness={0.1}
              transparent
              opacity={opacity * 0.8}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// Sub-component: Radar Panel (Left)
// ════════════════════════════════════════════════════════════════

function RadarPanel({
  opacity,
  labColor,
  dimmed,
}: {
  opacity: number;
  labColor: Color;
  dimmed: boolean;
}) {
  const dishRef = useRef<Group>(null);
  const sweepRef = useRef<Mesh>(null);
  const blipRefs = useRef<Mesh[]>([]);
  const ringGroupRef = useRef<Group>(null);

  // ─── Hover feedback (Audit Section 2, Finding C) ───
  const hoverProgressRef = useRef(0);
  const isHoveredRef = useRef(false);
  const handlePointerEnter = useCallback(() => {
    isHoveredRef.current = true;
    document.body.style.cursor = 'pointer';
  }, []);
  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    document.body.style.cursor = 'default';
  }, []);

  // Radar sweep geometry (line from center outward)
  const _sweepGeom = useMemo(() => {
    const points = [new Vector3(0, 0, 0), new Vector3(0.95, 0, 0)];
    return new BufferGeometry().setFromPoints(points);
  }, []);

  // Range ring radii
  const rangeRingRadii = useMemo(() => [0.25, 0.5, 0.75, 0.95], []);

  // Grid lines for radar background
  const gridLineCount = Math.floor(64 / 2);

  // Intensity factor
  const intensity = dimmed ? 0.15 : 1.0;

  // Shared blip geometry + material (Critical Fix #1: avoid per-render material recreation)
  const blipGeo = useMemo(() => new SphereGeometry(0.025, 64, 64), []);
  const blipMat = useMemo(() => new MeshStandardMaterial({
    color: labColor,
    emissive: labColor,
    transparent: true,
    opacity: 1.0,
  }), [labColor]);

  // Dispose shared blip geometry/material on unmount or dependency change
  useEffect(() => {
    return () => {
      blipGeo.dispose();
      blipMat.dispose();
    };
  }, [blipGeo, blipMat]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // Rotate sweep arm
    if (sweepRef.current) {
      sweepRef.current.rotation.z = t * 1.5;
    }

    // Hover glow progress (smooth 0→1 via dampedLerp)
    const hoverTarget = isHoveredRef.current ? 1 : 0;
    hoverProgressRef.current = dampedLerp(
      hoverProgressRef.current,
      hoverTarget,
      R3F_LERP_SPEED.NORMAL,
      delta
    );
    const hp = hoverProgressRef.current;

    // Update shared blip material with smooth opacity + hover emissive boost
    const targetEmissive = (0.9 + hp * 0.25) * intensity;
    const targetOpacity = opacity * 0.85 * intensity;
    blipMat.emissiveIntensity = dampedLerp(blipMat.emissiveIntensity, targetEmissive, R3F_LERP_SPEED.NORMAL, delta);
    blipMat.opacity = dampedLerp(blipMat.opacity, targetOpacity, R3F_LERP_SPEED.NORMAL, delta);

    // Pulse blips (+ hover scale boost)
    blipRefs.current.forEach((blip, i) => {
      if (!blip) return;
      const pulse = 0.8 + Math.sin(t * 2.5 + i * 0.7) * 0.2;
      const hoverBoost = 1 + hp * 0.08;
      blip.scale.setScalar(pulse * hoverBoost);
    });

    // Ring rotation: increased speed for perceptible motion (Finding D)
    // Was 0.05 rad/s (imperceptible) — now 0.3 rad/s (~3s per revolution)
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group>
      {/* Panel body — BoxGeometry with physical depth */}
      <mesh
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial
          color={PANEL_FACE_COLOR}
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Radar display surface (slightly in front of panel) */}
      <group position={[0, 0.3, PANEL_DEPTH / 2 + 0.005]}>
        {/* Radar dish assembly */}
        <group ref={dishRef}>
          {/* Cylinder base (pedestal) */}
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry
              args={[0.15, 0.2, 0.06, 64]}
            />
            <meshStandardMaterial
              color="#2a3040"
              metalness={0.9}
              roughness={0.15}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Torus dish (main radar dish ring) */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.95, 0.025, 16, 64]} />
            <meshStandardMaterial
              color={`#${labColor.getHexString()}`}
              metalness={0.7}
              roughness={0.3}
              transparent
              opacity={opacity * 0.6 * intensity}
              emissive={labColor}
              emissiveIntensity={0.3 * intensity}
            />
          </mesh>

          {/* Inner dish ring */}
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.015, 16, 64]} />
            <meshStandardMaterial
              color={`#${labColor.getHexString()}`}
              metalness={0.7}
              roughness={0.3}
              transparent
              opacity={opacity * 0.4 * intensity}
              emissive={labColor}
              emissiveIntensity={0.2 * intensity}
            />
          </mesh>

          {/* Sweep arm (rotating line) */}
          <mesh ref={sweepRef} position={[0, 0, 0.06]}>
            <cylinderGeometry args={[0.008, 0.003, 0.95, 64]} />
            <meshStandardMaterial
              color={`#${labColor.getHexString()}`}
              emissive={labColor}
              emissiveIntensity={0.8 * intensity}
              transparent
              opacity={opacity * 0.9 * intensity}
            />
          </mesh>

          {/* Center dot */}
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.04, 64, 64]} />
            <meshStandardMaterial
              color={`#${labColor.getHexString()}`}
              emissive={labColor}
              emissiveIntensity={1.0 * intensity}
              transparent
              opacity={opacity * intensity}
            />
          </mesh>
        </group>

        {/* Range rings (TorusGeometry) */}
        <group ref={ringGroupRef}>
          {rangeRingRadii.map((r, i) => (
            <mesh key={`ring-${i}`} position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.004, 16, 64]} />
              <meshStandardMaterial
                color={`#${labColor.getHexString()}`}
                transparent
                opacity={opacity * 0.2 * intensity}
                emissive={labColor}
                emissiveIntensity={0.1 * intensity}
              />
            </mesh>
          ))}
        </group>

        {/* Lab location blips (10 small spheres — shared geometry + material) */}
        {LAB_BLIP_ANGLES.map((angle, i) => {
          const r = LAB_BLIP_RADII[i];
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <mesh
              key={`blip-${i}`}
              ref={(el) => {
                if (el) blipRefs.current[i] = el;
              }}
              position={[x, y, 0.07]}
              geometry={blipGeo}
              material={blipMat}
            />
          );
        })}

        {/* Crosshair grid lines */}
        {Array.from({ length: gridLineCount }, (_, i) => {
            const angle = (i / gridLineCount) * Math.PI;
            return (
              <mesh
                key={`grid-${i}`}
                position={[0, 0, 0.035]}
                rotation={[0, 0, angle]}
              >
                <boxGeometry args={[1.9, 0.002, 0.001]} />
                <meshStandardMaterial
                  color={`#${labColor.getHexString()}`}
                  transparent
                  opacity={opacity * 0.08 * intensity}
                />
              </mesh>
            );
          })}
      </group>

      {/* Radar label text */}
      <Text
        position={[0, -PANEL_HEIGHT / 2 + 0.3, PANEL_DEPTH / 2 + 0.01]}
        fontSize={0.12}
        color={`#${labColor.getHexString()}`}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Regular.woff"
        fillOpacity={opacity * 0.7 * intensity}
      >
        LAB RADAR — SECTOR SCAN
      </Text>

      {/* Status readout texts */}
      <Text
        position={[-PANEL_WIDTH / 2 + 0.15, -PANEL_HEIGHT / 2 + 0.6, PANEL_DEPTH / 2 + 0.01]}
        fontSize={0.065}
        color={`#${labColor.getHexString()}`}
        anchorX="left"
        anchorY="middle"
        font="/fonts/JetBrainsMono-Regular.woff"
        fillOpacity={opacity * 0.5 * intensity}
      >
        {'RNG: 100km\nAZM: 360\u00b0\nTGT: 10 LABS'}
      </Text>

      <Text
        position={[PANEL_WIDTH / 2 - 0.15, -PANEL_HEIGHT / 2 + 0.6, PANEL_DEPTH / 2 + 0.01]}
        fontSize={0.065}
        color={`#${labColor.getHexString()}`}
        anchorX="right"
        anchorY="middle"
        font="/fonts/JetBrainsMono-Regular.woff"
        fillOpacity={opacity * 0.5 * intensity}
      >
        {'SIG: STRONG\nMODE: ACTIVE\nSWP: 1.5Hz'}
      </Text>

      {/* Chrome bezel frame */}
      <group position={[0, 0, PANEL_DEPTH / 2]}>
        <ChromeBezelFrame
          width={PANEL_WIDTH}
          height={PANEL_HEIGHT}
          depth={PANEL_DEPTH}
          opacity={opacity}
        />
      </group>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// Sub-component: Terminal Panel (Right)
// ════════════════════════════════════════════════════════════════

const _tempObject = new Object3D();
const _tempColor = new Color();

function TerminalPanel({
  opacity,
  labColor,
  dimmed,
}: {
  opacity: number;
  labColor: Color;
  dimmed: boolean;
}) {
  const barsRef = useRef<InstancedMesh>(null);
  const graphBarsRef = useRef<InstancedMesh>(null);

  // ─── Hover feedback (Audit Section 2, Finding C) ───
  const hoverProgressRef = useRef(0);
  const isHoveredRef = useRef(false);
  const handlePointerEnter = useCallback(() => {
    isHoveredRef.current = true;
    document.body.style.cursor = 'pointer';
  }, []);
  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
    document.body.style.cursor = 'default';
  }, []);

  const intensity = dimmed ? 0.15 : 1.0;

  // Instanced bar count scaled by LOD
  const barCount = useMemo(() => {
    return Math.min(TOTAL_BARS, 5000);
  }, [5000]);

  const graphBarCount = 48;

  // Column layout dimensions
  const colWidth = (PANEL_WIDTH - 0.4) / DATA_COLUMN_COUNT;
  const rowHeight = (PANEL_HEIGHT * 0.5) / DATA_ROW_COUNT;

  // Update instanced bars each frame (scrolling effect)
  useFrame(({ clock }, delta) => {
    // Hover glow progress (dampedLerp for frame-rate independence)
    const hoverTarget = isHoveredRef.current ? 1 : 0;
    hoverProgressRef.current = dampedLerp(
      hoverProgressRef.current,
      hoverTarget,
      R3F_LERP_SPEED.NORMAL,
      delta
    );

    if (!barsRef.current) return;
    const t = clock.elapsedTime;

    const startX = -(PANEL_WIDTH - 0.4) / 2;
    const startY = 0.3;

    for (let i = 0; i < barCount; i++) {
      const col = i % DATA_COLUMN_COUNT;
      const row = Math.floor(i / DATA_COLUMN_COUNT);

      // Scrolling offset
      const scrollOffset = ((t * 0.8 + row * 0.1) % DATA_ROW_COUNT) * rowHeight;
      const yPos = startY + row * rowHeight - scrollOffset;

      // Animated height per bar
      const h = 0.015 + Math.abs(Math.sin(t * 1.2 + col * 0.5 + row * 0.3)) * 0.04;

      _tempObject.position.set(
        startX + col * colWidth + colWidth / 2,
        yPos,
        PANEL_DEPTH / 2 + 0.008
      );
      _tempObject.scale.set(colWidth * 0.7, h, 0.008);
      _tempObject.updateMatrix();
      barsRef.current.setMatrixAt(i, _tempObject.matrix);

      // Color: lab color with brightness variation + hover boost
      const brightness = 0.3 + Math.abs(Math.sin(t * 0.8 + i * 0.02)) * 0.7;
      _tempColor.copy(labColor).multiplyScalar(brightness * intensity * (1 + hoverProgressRef.current * 0.25));
      barsRef.current.setColorAt(i, _tempColor);
    }

    barsRef.current.instanceMatrix.needsUpdate = true;
    if (barsRef.current.instanceColor) {
      barsRef.current.instanceColor.needsUpdate = true;
    }

    // Graph bars at bottom
    if (!graphBarsRef.current) return;
    for (let i = 0; i < graphBarCount; i++) {
      const h = 0.05 + Math.abs(Math.sin(t * 0.6 + i * 0.25)) * 0.25;
      const xPos = -(PANEL_WIDTH - 0.6) / 2 + (i / graphBarCount) * (PANEL_WIDTH - 0.6);

      _tempObject.position.set(
        xPos,
        -PANEL_HEIGHT / 2 + 0.6 + h / 2,
        PANEL_DEPTH / 2 + 0.008
      );
      _tempObject.scale.set(0.03, h, 0.01);
      _tempObject.updateMatrix();
      graphBarsRef.current.setMatrixAt(i, _tempObject.matrix);

      const gb = 0.5 + Math.abs(Math.sin(t * 0.4 + i * 0.15)) * 0.5;
      _tempColor.copy(labColor).multiplyScalar(gb * intensity);
      graphBarsRef.current.setColorAt(i, _tempColor);
    }

    graphBarsRef.current.instanceMatrix.needsUpdate = true;
    if (graphBarsRef.current.instanceColor) {
      graphBarsRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Panel body — BoxGeometry with physical depth */}
      <mesh
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
        <meshStandardMaterial
          color={PANEL_FACE_COLOR}
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Instanced data column bars */}
      <instancedMesh
        ref={barsRef}
        args={[undefined, undefined, barCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          transparent
          opacity={opacity * 0.8 * intensity}
          emissive={labColor}
          emissiveIntensity={0.4 * intensity}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Miniature graph bars at bottom */}
      <instancedMesh
        ref={graphBarsRef}
        args={[undefined, undefined, graphBarCount]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          transparent
          opacity={opacity * 0.7 * intensity}
          emissive={labColor}
          emissiveIntensity={0.5 * intensity}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Header text */}
      <Text
        position={[0, PANEL_HEIGHT / 2 - 0.2, PANEL_DEPTH / 2 + 0.01]}
        fontSize={0.12}
        color={`#${labColor.getHexString()}`}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Regular.woff"
        fillOpacity={opacity * 0.8 * intensity}
      >
        SYSTEM TERMINAL
      </Text>

      {/* Scrolling data label rows */}
      {[
        { y: 1.5, text: 'XP THROUGHPUT    ████████░░  82%' },
        { y: 1.3, text: 'NEURAL SYNC      █████████░  91%' },
        { y: 1.1, text: 'LAB COHERENCE    ███████░░░  74%' },
        { y: 0.9, text: 'BADGE VELOCITY   ██████████  99%' },
        { y: -1.0, text: '> STREAM ACTIVE | LABS: 10/10' },
        { y: -1.2, text: '> LATENCY: 12ms | UPLINK: OK' },
      ].map(({ y, text }, i) => (
        <Text
          key={`term-${i}`}
          position={[
            -PANEL_WIDTH / 2 + 0.15,
            y,
            PANEL_DEPTH / 2 + 0.01,
          ]}
          fontSize={0.06}
          color={`#${labColor.getHexString()}`}
          anchorX="left"
          anchorY="middle"
          font="/fonts/JetBrainsMono-Regular.woff"
          fillOpacity={opacity * 0.55 * intensity}
          maxWidth={PANEL_WIDTH - 0.3}
        >
          {text}
        </Text>
      ))}

      {/* Graph section label */}
      <Text
        position={[0, -PANEL_HEIGHT / 2 + 0.35, PANEL_DEPTH / 2 + 0.01]}
        fontSize={0.07}
        color={`#${labColor.getHexString()}`}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Orbitron-Regular.woff"
        fillOpacity={opacity * 0.5 * intensity}
      >
        PERFORMANCE HISTOGRAM
      </Text>

      {/* Graph baseline */}
      <mesh position={[0, -PANEL_HEIGHT / 2 + 0.55, PANEL_DEPTH / 2 + 0.006]}>
        <boxGeometry args={[PANEL_WIDTH - 0.4, 0.003, 0.002]} />
        <meshStandardMaterial
          color={`#${labColor.getHexString()}`}
          transparent
          opacity={opacity * 0.3 * intensity}
          emissive={labColor}
          emissiveIntensity={0.2 * intensity}
        />
      </mesh>

      {/* Divider line between data and graph */}
      <mesh position={[0, -0.8, PANEL_DEPTH / 2 + 0.006]}>
        <boxGeometry args={[PANEL_WIDTH - 0.2, 0.004, 0.002]} />
        <meshStandardMaterial
          color={`#${labColor.getHexString()}`}
          transparent
          opacity={opacity * 0.2 * intensity}
        />
      </mesh>

      {/* Chrome bezel frame */}
      <group position={[0, 0, PANEL_DEPTH / 2]}>
        <ChromeBezelFrame
          width={PANEL_WIDTH}
          height={PANEL_HEIGHT}
          depth={PANEL_DEPTH}
          opacity={opacity}
        />
      </group>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// Sub-component: Panel Mounting Assembly
// ════════════════════════════════════════════════════════════════

function PanelAssembly({
  side,
  children,
  opacity,
}: {
  side: 'left' | 'right';
  children: React.ReactNode;
  opacity: number;
}) {
  const groupRef = useRef<Group>(null);
  const sx = side === 'left' ? -1 : 1;

  // Subtle animated tilt toward viewer
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    // Gentle breathing tilt toward center (viewer)
    const tiltY = sx * (0.25 + Math.sin(t * 0.3) * 0.02);
    const tiltX = Math.sin(t * 0.2 + (side === 'left' ? 0 : Math.PI)) * 0.01;
    groupRef.current.rotation.y = tiltY;
    groupRef.current.rotation.x = tiltX;
  });

  return (
    <group position={[sx * 5.5, 0, -2]}>
      {/* Mounting arm — connects wall to panel */}
      <group position={[sx * (PANEL_WIDTH / 2 + ARM_LENGTH / 2 + 0.1), 0.5, 0]}>
        <MountingArm side={side} opacity={opacity} />
      </group>

      {/* Second mounting arm (lower) */}
      <group position={[sx * (PANEL_WIDTH / 2 + ARM_LENGTH / 2 + 0.1), -0.8, 0]}>
        <MountingArm side={side} opacity={opacity} />
      </group>

      {/* Panel group (tilts) */}
      <group ref={groupRef}>
        {children}
      </group>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// Main Export: SidePanels
// ════════════════════════════════════════════════════════════════

export function SidePanels({
  leftContent: _leftContent,
  rightContent: _rightContent,
  opacity,
  labColor,
  dimmed,
}: SidePanelsProps) {

  const labColorVec = useMemo(() => new Color(labColor), [labColor]);

  if (opacity <= 0) return null;

  return (
    <group>
      {/* Left panel assembly — Radar */}
      <PanelAssembly side="left" opacity={opacity}>
        <RadarPanel
          opacity={opacity}
          labColor={labColorVec}
          dimmed={dimmed}
        />
      </PanelAssembly>

      {/* Right panel assembly — Terminal */}
      <PanelAssembly side="right" opacity={opacity}>
        <TerminalPanel
          opacity={opacity}
          labColor={labColorVec}
          dimmed={dimmed}
        />
      </PanelAssembly>
    </group>
  );
}
