'use client';

// ════════════════════════════════════════════════════
// AiArtDetectiveEnvironment — Art Analysis Museum (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 4: Language & Communication | Color: #FFAA44 (Amber)
//
// An elegant art analysis museum where players investigate AI-generated art:
//   - Exhibition hall with floating artworks in ornate frames (instanced)
//   - Style comparison panels (side-by-side art technique displays)
//   - Technique analyzer with brush stroke scanner beam
//   - Art history timeline ribbon (curved ribbon with era markers)
//   - Neural style transfer visualizer (morphing display)
//   - Palette extraction station (color swatch pedestal)
//   - Forgery detection desk with UV light
//   - Artist signature magnifier (loupe on articulated arm)
//
// Triangle Budget (Desktop Ultra):
//   Floating Artworks (instanced):     ~75K  (16 frames + canvases)
//   Style Comparison Panels:           ~50K  (dual displays + stands)
//   Brush Stroke Scanner:              ~45K  (scanner arm + beam + base)
//   Art History Timeline:              ~55K  (ribbon path + era markers)
//   Neural Style Transfer Viz:         ~45K  (morphing display panels)
//   Palette Extraction Station:        ~40K  (pedestal + swatch display)
//   Forgery Detection Desk:            ~50K  (desk + UV lamp + lens)
//   Signature Magnifier:               ~35K  (loupe + arm)
//   Museum Architecture:               ~55K  (columns, arches, floor)
//   Reserve:                           ~50K
//   Total:                             ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FFAA44';

// ■■ Floating Artworks in Frames (Instanced) ■■
function FloatingArtworks() {
  const count = 16;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const canvasRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 3.5 + (i % 3) * 1.0,
      height: 1.8 + (i % 4) * 0.5,
      bobSpeed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      hue: 0.06 + Math.random() * 0.08,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!framesRef.current || !canvasRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const bob = Math.sin(timeRef.current * s.bobSpeed + s.phase) * 0.08;
      const orbitAngle = s.angle + timeRef.current * 0.02;
      const x = Math.cos(orbitAngle) * s.radius;
      const z = Math.sin(orbitAngle) * s.radius;
      rot.setFromEuler(new THREE.Euler(0, -orbitAngle + Math.PI, 0));
      // Frame
      tmp.compose(new THREE.Vector3(x, s.height + bob, z), rot, new THREE.Vector3(0.75, 0.6, 0.05));
      framesRef.current.setMatrixAt(i, tmp);
      // Canvas
      tmp.compose(new THREE.Vector3(x, s.height + bob, z), rot, new THREE.Vector3(0.6, 0.45, 0.02));
      canvasRef.current.setMatrixAt(i, tmp);
      color.setHSL(s.hue, 0.4, 0.2 + Math.sin(timeRef.current * 0.5 + i) * 0.05);
      canvasRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    canvasRef.current.instanceMatrix.needsUpdate = true;
    if (canvasRef.current.instanceColor) canvasRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={canvasRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.1} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Style Comparison Panels ■■
function StylePanels({ isDetecting }: { isDetecting: boolean }) {
  const timeRef = useRef(0);
  const dividerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (dividerRef.current) {
      (dividerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isDetecting ? 0.5 + Math.sin(timeRef.current * 3) * 0.25 : 0.15;
    }
  });

  return (
    <group position={[-4.5, 0, 2]}>
      {/* Left panel (original) */}
      <mesh position={[-0.5, 1.8, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.5, 1.8, 0.025]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshStandardMaterial color="#221A10" emissive="#FFAA44" emissiveIntensity={0.08} />
      </mesh>
      {/* Right panel (style-transferred) */}
      <mesh position={[0.5, 1.8, 0]} castShadow>
        <boxGeometry args={[0.7, 0.55, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 1.8, 0.025]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshStandardMaterial color="#1A1510" emissive="#FF8844" emissiveIntensity={0.08} />
      </mesh>
      {/* Comparison divider */}
      <mesh ref={dividerRef} position={[0, 1.8, 0.03]}>
        <boxGeometry args={[0.03, 0.6, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.15} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.4, 8]} />
        <meshStandardMaterial color="#333340" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Label */}
      <mesh position={[0, 1.35, 0.03]}>
        <boxGeometry args={[1.4, 0.06, 0.01]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ■■ Brush Stroke Scanner ■■
function BrushStrokeScanner({ isDetecting }: { isDetecting: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const scanArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (beamRef.current) {
      (beamRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isDetecting ? 0.6 + Math.sin(timeRef.current * 5) * 0.3 : 0.1;
      (beamRef.current.material as THREE.MeshStandardMaterial).opacity =
        isDetecting ? 0.5 + Math.sin(timeRef.current * 3) * 0.2 : 0.15;
    }
    if (scanArmRef.current && isDetecting) {
      scanArmRef.current.position.x = Math.sin(timeRef.current * 1.5) * 0.4;
    }
  });

  return (
    <group position={[4, 0, -2]}>
      {/* Scanner base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.3, 16]} />
        <meshStandardMaterial color="#1A1822" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Vertical arm */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Scan head */}
      <group ref={scanArmRef} position={[0, 2.2, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.1, 0.15]} />
          <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Scanner beam */}
        <mesh ref={beamRef} position={[0, -0.8, 0]}>
          <boxGeometry args={[0.01, 1.4, 0.01]} />
          <meshStandardMaterial
            color={LAB_COLOR}
            emissive={LAB_COLOR}
            emissiveIntensity={0.1}
            transparent
            opacity={0.15}
          />
        </mesh>
        {/* Scanner lens */}
        <mesh position={[0, -0.08, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color="#88DDFF" transparent opacity={0.4} emissive="#88DDFF" emissiveIntensity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ■■ Art History Timeline Ribbon ■■
function TimelineRibbon() {
  const markerCount = 10;
  const markersRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!markersRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < markerCount; i++) {
      const t = i / (markerCount - 1);
      const angle = t * Math.PI * 1.5 - Math.PI * 0.75;
      const x = Math.cos(angle) * 6;
      const z = Math.sin(angle) * 3;
      const y = 3.0 + Math.sin(t * Math.PI) * 0.5;
      tmp.makeScale(0.08, 0.08, 0.08);
      tmp.setPosition(x, y, z);
      markersRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.06 + t * 0.04, 0.7, 0.4);
      markersRef.current.setColorAt(i, color);
    }
    markersRef.current.instanceMatrix.needsUpdate = true;
    if (markersRef.current.instanceColor) markersRef.current.instanceColor.needsUpdate = true;
  }, [markerCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!markersRef.current) return;
    const mat = markersRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.1;
  });

  return (
    <group>
      {/* Ribbon path (simplified as curved tube sections) */}
      <mesh position={[0, 3.0, 0]}>
        <torusGeometry args={[5, 0.02, 4, 48, Math.PI * 1.5]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} />
      </mesh>
      {/* Era markers */}
      <instancedMesh ref={markersRef} args={[undefined, undefined, markerCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Palette Extraction Station ■■
function PaletteStation({ artworksAnalyzed }: { artworksAnalyzed: number }) {
  const swatchCount = Math.min(artworksAnalyzed * 2, 12);
  const swatchRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!swatchRef.current || swatchCount === 0) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < swatchCount; i++) {
      const angle = (i / swatchCount) * Math.PI * 2;
      const x = Math.cos(angle) * 0.3;
      const z = Math.sin(angle) * 0.3;
      tmp.makeScale(0.06, 0.15, 0.06);
      tmp.setPosition(-3 + x, 1.2 + i * 0.02, -4 + z);
      swatchRef.current.setMatrixAt(i, tmp);
      color.setHSL(i * 0.08, 0.7, 0.4);
      swatchRef.current.setColorAt(i, color);
    }
    swatchRef.current.instanceMatrix.needsUpdate = true;
    if (swatchRef.current.instanceColor) swatchRef.current.instanceColor.needsUpdate = true;
  }, [swatchCount]);

  return (
    <group position={[-3, 0, -4]}>
      {/* Pedestal */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 1.0, 16]} />
        <meshStandardMaterial color="#1A1822" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Top plate */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 16]} />
        <meshStandardMaterial color="#2A2235" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Color swatches */}
      {swatchCount > 0 && (
        <instancedMesh ref={swatchRef} args={[undefined, undefined, swatchCount]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} />
        </instancedMesh>
      )}
    </group>
  );
}

// ■■ Forgery Detection Desk ■■
function ForgeryDesk({ isDetecting }: { isDetecting: boolean }) {
  const uvLightRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (uvLightRef.current) {
      (uvLightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isDetecting ? 0.7 + Math.sin(timeRef.current * 4) * 0.3 : 0.15;
    }
  });

  return (
    <group position={[3.5, 0, 3.5]}>
      {/* Desk surface */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#1E1822" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Desk legs */}
      {[[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#2A2235" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* UV lamp arm */}
      <mesh position={[0.5, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* UV light head */}
      <mesh ref={uvLightRef} position={[0.2, 1.6, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 8]} />
        <meshStandardMaterial
          color="#7733FF"
          emissive="#7733FF"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* UV cone of light */}
      {isDetecting && (
        <mesh position={[0, 0.95, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.3, 0.6, 8, 1, true]} />
          <meshStandardMaterial color="#7733FF" emissive="#7733FF" emissiveIntensity={0.2} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Evidence sample on desk */}
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[0.5, 0.01, 0.4]} />
        <meshStandardMaterial color="#221A10" emissive={LAB_COLOR} emissiveIntensity={isDetecting ? 0.15 : 0.03} />
      </mesh>
    </group>
  );
}

// ■■ Museum Architecture (Columns) ■■
function MuseumColumns() {
  const count = 8;
  const columnsRef = useRef<THREE.InstancedMesh>(null);
  const capsRef = useRef<THREE.InstancedMesh>(null);
  const segments = 16;

  React.useEffect(() => {
    if (!columnsRef.current || !capsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = (Math.floor(i / 2) - count / 4) * 3.5;
      // Column
      tmp.makeScale(0.15, 2.0, 0.15);
      tmp.setPosition(side * 6, 1.0, z);
      columnsRef.current.setMatrixAt(i, tmp);
      // Capital
      tmp.makeScale(0.22, 0.1, 0.22);
      tmp.setPosition(side * 6, 2.05, z);
      capsRef.current.setMatrixAt(i, tmp);
    }
    columnsRef.current.instanceMatrix.needsUpdate = true;
    capsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={columnsRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[1, 1, 1, segments]} />
        <meshStandardMaterial color="#1E1828" metalness={0.4} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={capsRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 0.8, 1, segments]} />
        <meshStandardMaterial color="#2A2035" metalness={0.5} roughness={0.3} />
      </instancedMesh>
      {/* Ceiling with accent light strip */}
      <mesh position={[0, 4.0, 0]}>
        <planeGeometry args={[13, 14]} />
        <meshStandardMaterial color="#080510" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {(
        <mesh position={[0, 3.95, 0]}>
          <boxGeometry args={[10, 0.02, 0.05]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ■■ Main Environment ■■
interface AiArtDetectiveEnvironmentProps {
  artworksAnalyzed?: number;
  isDetecting?: boolean;
}

export default function AiArtDetectiveEnvironment({
  artworksAnalyzed = 0,
  isDetecting = false,
}: AiArtDetectiveEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A06"
      skyTopColor="#0A0604"
      skyHorizonColor="#1A1208"
      fogColor="#FFAA44"
    >
      <FloatingArtworks />
      <StylePanels isDetecting={isDetecting} />
      <BrushStrokeScanner isDetecting={isDetecting} />
      <TimelineRibbon />
      <PaletteStation artworksAnalyzed={artworksAnalyzed} />
      <ForgeryDesk isDetecting={isDetecting} />
      <MuseumColumns />
      {/* Detection spotlight */}
      {isDetecting && (
        <pointLight position={[0, 3, 0]} intensity={1.0} color={LAB_COLOR} distance={10} />
      )}
    </StandardEnvironmentWrapper>
  );
}
