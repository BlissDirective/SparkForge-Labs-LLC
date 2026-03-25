'use client';

// ════════════════════════════════════════════════════
// PixelInvestigatorEnvironment — Digital Forensics Lab (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 3: How Machines Learn | Color: #FF66AA (Pink)
//
// A high-tech digital forensics laboratory for pixel-level image analysis:
//   - Giant pixel grid display table in center (interactive magnifier)
//   - Magnification station with zoom lens apparatus
//   - RGB color channel analyzer panels (three separation screens)
//   - Image layer decomposition racks (instanced layer shelves)
//   - Pixel art gallery on walls (instanced frames)
//   - Resolution comparison screens (side-by-side displays)
//   - Anti-aliasing demonstration zone (smooth vs jagged)
//   - Binary data waterfall backdrop (cascading data columns)
//
// Triangle Budget (Desktop Ultra):
//   Pixel Grid Table:           ~80K  (grid cells + frame + legs)
//   Magnification Station:      ~45K  (lens + arm + base + rings)
//   RGB Channel Panels:         ~55K  (3 panels + color bars)
//   Layer Decomposition Racks:  ~60K  (instanced shelves + layer plates)
//   Pixel Art Gallery:          ~50K  (instanced frames on walls)
//   Resolution Screens:         ~40K  (comparison monitors + stands)
//   Anti-Aliasing Zone:         ~35K  (smooth/jagged demo surfaces)
//   Binary Data Waterfall:      ~65K  (instanced falling columns)
//   Lab Furniture & Props:      ~40K  (desks, chairs, consoles)
//   Reserve:                    ~30K
//   Total:                      ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF66AA';

// ■■ Giant Pixel Grid Display Table ■■
function PixelGridTable({ zoomLevel }: { zoomLevel: number }) {
  const gridRef = useRef<InstancedMesh>(null);
  const frameRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const gridSize = 16;
  const count = gridSize * gridSize;

  const cellSeeds = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      hue: (i / count) * 0.3 + 0.85,
      saturation: 0.4 + Math.random() * 0.5,
      lightness: 0.15 + Math.random() * 0.35,
      pulsePhase: Math.random() * Math.PI * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!gridRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    const cellSize = 3.0 / gridSize;
    const offset = (gridSize - 1) * cellSize * 0.5;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = col * cellSize - offset;
      const z = row * cellSize - offset;
      const heightPulse = Math.sin(timeRef.current * 1.5 + cellSeeds[i].pulsePhase) * 0.02 * zoomLevel;
      tmp.makeScale(cellSize * 0.9, 0.05 + heightPulse, cellSize * 0.9);
      tmp.setPosition(x, 1.03 + heightPulse, z);
      gridRef.current.setMatrixAt(i, tmp);
      const s = cellSeeds[i];
      color.setHSL(s.hue + Math.sin(timeRef.current * 0.5 + i * 0.1) * 0.05, s.saturation, s.lightness + heightPulse * 2);
      gridRef.current.setColorAt(i, color);
    }
    gridRef.current.instanceMatrix.needsUpdate = true;
    if (gridRef.current.instanceColor) gridRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Table surface */}
      <mesh position={[0, 0.95, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.1, 3.6]} />
        <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Table legs */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 1.9, 6]} />
          <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Grid cells */}
      <instancedMesh ref={gridRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.3} transparent opacity={0.85} />
      </instancedMesh>
      {/* Frame glow border */}
      <mesh ref={frameRef} position={[0, 1.0, 0]}>
        <boxGeometry args={[3.7, 0.02, 3.7]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ■■ Magnification Station ■■
function MagnificationStation({ isAnalyzing }: { isAnalyzing: boolean }) {
  const lensRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const timeRef = useRef(0);
  const segments = 32;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lensRef.current) {
      lensRef.current.rotation.y = timeRef.current * (isAnalyzing ? 0.8 : 0.2);
      const scale = isAnalyzing ? 1.0 + Math.sin(timeRef.current * 3) * 0.05 : 1.0;
      lensRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      (ringRef.current.material as MeshStandardMaterial).emissiveIntensity =
        isAnalyzing ? 0.6 + Math.sin(timeRef.current * 4) * 0.3 : 0.2;
    }
  });

  return (
    <group position={[3.5, 0, -1]}>
      {/* Base pedestal */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.6, segments]} />
        <meshStandardMaterial color="#1A1822" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Vertical arm */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Horizontal arm */}
      <mesh position={[-0.5, 2.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lens body */}
      <mesh ref={lensRef} position={[-0.8, 2.5, 0]}>
        <torusGeometry args={[0.25, 0.04, 8, segments]} />
        <meshStandardMaterial color="#AAA" metalness={0.8} roughness={0.1} />
      </mesh>
      {/* Lens glass */}
      <mesh position={[-0.8, 2.5, 0]}>
        <circleGeometry args={[0.22, segments]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.3} emissive="#88CCFF" emissiveIntensity={0.2} side={DoubleSide} />
      </mesh>
      {/* Glow ring */}
      <mesh ref={ringRef} position={[-0.8, 2.5, 0]}>
        <torusGeometry args={[0.3, 0.015, 6, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ■■ RGB Color Channel Analyzer Panels ■■
function RGBChannelPanels({ isAnalyzing }: { isAnalyzing: boolean }) {
  const timeRef = useRef(0);
  const barsRef = useRef<InstancedMesh>(null);
  const barCount = 24;
  const channels = ['#FF3333', '#33FF33', '#3333FF'] as const;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!barsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < barCount; i++) {
        const idx = c * barCount + i;
        const x = -3.8 + c * 1.4;
        const barX = x + (i / barCount) * 1.0 - 0.5;
        const height = 0.1 + Math.abs(Math.sin(timeRef.current * (isAnalyzing ? 2 : 0.5) + i * 0.4 + c * 2)) * 0.6;
        tmp.makeScale(1.0 / barCount * 0.8, height, 0.02);
        tmp.setPosition(barX, 2.2 + height * 0.5, -6.8);
        barsRef.current.setMatrixAt(idx, tmp);
        color.set(channels[c]);
        barsRef.current.setColorAt(idx, color);
      }
    }
    barsRef.current.instanceMatrix.needsUpdate = true;
    if (barsRef.current.instanceColor) barsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Three panel backdrops */}
      {channels.map((ch, i) => (
        <mesh key={i} position={[-3.8 + i * 1.4, 2.2, -6.9]} castShadow>
          <boxGeometry args={[1.1, 1.0, 0.05]} />
          <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {/* Channel label strips */}
      {channels.map((ch, i) => (
        <mesh key={`label-${i}`} position={[-3.8 + i * 1.4, 1.6, -6.85]}>
          <boxGeometry args={[1.0, 0.08, 0.02]} />
          <meshStandardMaterial color={ch} emissive={ch} emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Animated bars */}
      <instancedMesh ref={barsRef} args={[undefined, undefined, barCount * 3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
}

// ■■ Image Layer Decomposition Racks ■■
function LayerRacks() {
  const count = 8;
  const shelvesRef = useRef<InstancedMesh>(null);
  const platesRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!shelvesRef.current || !platesRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const y = 0.4 + i * 0.45;
      // Shelf brackets
      tmp.makeScale(0.8, 0.03, 0.5);
      tmp.setPosition(-5.5, y, -2);
      shelvesRef.current.setMatrixAt(i, tmp);
      // Layer plates (translucent colored sheets)
      tmp.makeScale(0.7, 0.01, 0.4);
      tmp.setPosition(-5.5, y + 0.03, -2);
      platesRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.9 + i * 0.03, 0.6, 0.3 + i * 0.05);
      platesRef.current.setColorAt(i, color);
    }
    shelvesRef.current.instanceMatrix.needsUpdate = true;
    platesRef.current.instanceMatrix.needsUpdate = true;
    if (platesRef.current.instanceColor) platesRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      {/* Rack frame */}
      <mesh position={[-5.5, 1.5, -2]} castShadow>
        <boxGeometry args={[0.05, 3.0, 0.6]} />
        <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-5.1, 1.5, -2]} castShadow>
        <boxGeometry args={[0.05, 3.0, 0.6]} />
        <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Shelves */}
      <instancedMesh ref={shelvesRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#333340" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      {/* Layer plates */}
      <instancedMesh ref={platesRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial transparent opacity={0.5} emissive="#FFFFFF" emissiveIntensity={0.15} />
      </instancedMesh>
    </group>
  );
}

// ■■ Pixel Art Gallery (Wall Frames) ■■
function PixelArtGallery() {
  const count = 10;
  const framesRef = useRef<InstancedMesh>(null);
  const artRef = useRef<InstancedMesh>(null);

  React.useEffect(() => {
    if (!framesRef.current || !artRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * 6.5;
      const z = (Math.floor(i / 2) - count / 4) * 2.5;
      const rot = new Quaternion();
      rot.setFromEuler(new Euler(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0));
      tmp.compose(new Vector3(x, 2.0, z), rot, new Vector3(0.9, 0.9, 0.06));
      framesRef.current.setMatrixAt(i, tmp);
      tmp.compose(new Vector3(x - side * 0.04, 2.0, z), rot, new Vector3(0.7, 0.7, 0.02));
      artRef.current.setMatrixAt(i, tmp);
      color.setHSL(0.9 + i * 0.02, 0.5, 0.2);
      artRef.current.setColorAt(i, color);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    artRef.current.instanceMatrix.needsUpdate = true;
    if (artRef.current.instanceColor) artRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={framesRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2A1830" metalness={0.5} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={artRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.15} />
      </instancedMesh>
    </group>
  );
}

// ■■ Resolution Comparison Screens ■■
function ResolutionScreens() {
  const timeRef = useRef(0);
  const scanRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (scanRef.current) {
      scanRef.current.position.y = 1.5 + Math.sin(timeRef.current * 1.5) * 0.4;
      (scanRef.current.material as MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 3) * 0.15;
    }
  });

  return (
    <group position={[4, 0, 3]}>
      {/* Low-res screen */}
      <mesh position={[-0.6, 1.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.6, 1.8, 0.025]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#331122" emissive="#FF66AA" emissiveIntensity={0.1} />
      </mesh>
      {/* High-res screen */}
      <mesh position={[0.6, 1.8, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.04]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 1.8, 0.025]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#220E1A" emissive="#FF66AA" emissiveIntensity={0.2} />
      </mesh>
      {/* Comparison label bar */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[2.0, 0.06, 0.03]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </mesh>
      {/* Scan line */}
      <mesh ref={scanRef} position={[0, 1.8, 0.04]}>
        <boxGeometry args={[2.0, 0.01, 0.01]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Anti-Aliasing Demonstration Zone ■■
function AntiAliasingZone() {
  const stepsRef = useRef<InstancedMesh>(null);
  const stepCount = 12;

  React.useEffect(() => {
    if (!stepsRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < stepCount; i++) {
      const x = (i / stepCount) * 3 - 1.5;
      const y = -0.5 + (i / stepCount) * 1.5;
      const smooth = i / stepCount;
      tmp.makeScale(3.0 / stepCount * 0.95, 0.08 + smooth * 0.02, 0.5);
      tmp.setPosition(x, y, 5.5);
      stepsRef.current.setMatrixAt(i, tmp);
      color.lerpColors(new Color('#FF66AA'), new Color('#FFB8D9'), smooth);
      stepsRef.current.setColorAt(i, color);
    }
    stepsRef.current.instanceMatrix.needsUpdate = true;
    if (stepsRef.current.instanceColor) stepsRef.current.instanceColor.needsUpdate = true;
  }, [stepCount]);

  return (
    <group>
      {/* Label plate */}
      <mesh position={[0, 1.2, 5.5]}>
        <boxGeometry args={[2.0, 0.15, 0.03]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* Stepped demonstration */}
      <instancedMesh ref={stepsRef} args={[undefined, undefined, stepCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.1} />
      </instancedMesh>
    </group>
  );
}

// ■■ Binary Data Waterfall ■■
function BinaryWaterfall() {
  const count = 80;
  const meshRef = useRef<InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 14,
      speed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * 8,
      width: 0.02 + Math.random() * 0.04,
      height: 0.08 + Math.random() * 0.2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new Matrix4();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.phase + timeRef.current * s.speed) % 5) - 0.5;
      tmp.makeScale(s.width, s.height, 0.01);
      tmp.setPosition(s.x, 4.5 - y, -7.2);
      meshRef.current.setMatrixAt(i, tmp);
      const bright = 0.2 + (1 - y / 5) * 0.6;
      color.setRGB(bright * 1.0, bright * 0.4, bright * 0.67);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.7} />
    </instancedMesh>
  );
}

// ■■ Main Environment ■■
interface PixelInvestigatorEnvironmentProps {
  zoomLevel?: number;
  isAnalyzing?: boolean;
}

export default function PixelInvestigatorEnvironment({
  zoomLevel = 1,
  isAnalyzing = false,
}: PixelInvestigatorEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0816"
      skyTopColor="#08041A"
      skyHorizonColor="#1A0E22"
      fogColor="#FF66AA"
    >
      <PixelGridTable zoomLevel={zoomLevel} />
      <MagnificationStation isAnalyzing={isAnalyzing} />
      <RGBChannelPanels isAnalyzing={isAnalyzing} />
      <LayerRacks />
      <PixelArtGallery />
      <ResolutionScreens />
      <AntiAliasingZone />
      <BinaryWaterfall />
      {/* Active analysis spotlight */}
      {isAnalyzing && (
        <pointLight position={[0, 3, 0]} intensity={1.2} color={LAB_COLOR} distance={8} />
      )}
    </StandardEnvironmentWrapper>
  );
}
