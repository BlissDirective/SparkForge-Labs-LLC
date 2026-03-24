'use client';

// ════════════════════════════════════════════════════
// ToolPickerEnvironment — AI Tool Workshop (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 6: AI Ethics & Safety | Color: #FF6644 (Orange/Red)
//
// A maker's workshop where players explore and compare AI tools:
//   - Labeled tool racks (instanced shelving with tool categories)
//   - Task assignment board (pinboard with task cards)
//   - Tool comparison table (side-by-side evaluation surface)
//   - Use-case scenario displays (instanced scenario screens)
//   - Effectiveness meter gauges (animated dial instruments)
//   - Integration pipeline models (connected pipe segments)
//   - Safety rating indicators (traffic-light style columns)
//   - Tool evolution timeline (wall-mounted progression display)
//
// Triangle Budget (Desktop Ultra):
//   Tool Racks (instanced):        ~75K  (shelves + tool items)
//   Task Assignment Board:         ~45K  (board + cards + pins)
//   Comparison Table:              ~50K  (table + evaluation panels)
//   Scenario Displays (instanced): ~55K  (screens + frames)
//   Effectiveness Gauges:          ~50K  (dials + needles + labels)
//   Integration Pipelines:         ~55K  (instanced pipe segments)
//   Safety Rating Indicators:      ~40K  (columns + lights)
//   Tool Evolution Timeline:       ~35K  (wall display + markers)
//   Workshop Structure:            ~55K  (walls, workbenches, floor)
//   Reserve:                       ~40K
//   Total:                         ~500K

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF6644';

// ■■ Tool Racks with Items (Instanced) ■■
function ToolRacks({ toolsSelected }: { toolsSelected: number }) {
  const shelfCount = 15;
  const toolCount = 30;
  const shelvesRef = useRef<THREE.InstancedMesh>(null);
  const toolsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!shelvesRef.current || !toolsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    // Create 3 rack columns
    const racksPerColumn = Math.floor(shelfCount / 3);
    for (let i = 0; i < shelfCount; i++) {
      const col = Math.floor(i / racksPerColumn);
      const row = i % racksPerColumn;
      const x = -5 + col * 2.5;
      const y = 0.5 + row * 0.65;
      tmp.makeScale(0.9, 0.04, 0.35);
      tmp.setPosition(x, y, -5.5);
      shelvesRef.current.setMatrixAt(i, tmp);
    }
    shelvesRef.current.instanceMatrix.needsUpdate = true;
    // Tool items on shelves
    const toolsPerShelf = Math.ceil(toolCount / shelfCount);
    for (let i = 0; i < toolCount; i++) {
      const shelf = Math.floor(i / toolsPerShelf);
      const pos = i % toolsPerShelf;
      const col = Math.floor(shelf / racksPerColumn);
      const row = shelf % racksPerColumn;
      const x = -5 + col * 2.5 + (pos - toolsPerShelf / 2) * 0.2;
      const y = 0.58 + row * 0.65;
      const shapes = [
        new THREE.Vector3(0.06, 0.12, 0.06),
        new THREE.Vector3(0.08, 0.08, 0.08),
        new THREE.Vector3(0.05, 0.15, 0.05),
      ];
      const shape = shapes[i % 3];
      tmp.makeScale(shape.x, shape.y, shape.z);
      tmp.setPosition(x, y + shape.y * 0.5, -5.5);
      toolsRef.current.setMatrixAt(i, tmp);
      const isSelected = i < toolsSelected;
      color.set(isSelected ? LAB_COLOR : '#333340');
      toolsRef.current.setColorAt(i, color);
    }
    toolsRef.current.instanceMatrix.needsUpdate = true;
    if (toolsRef.current.instanceColor) toolsRef.current.instanceColor.needsUpdate = true;
  }, [shelfCount, toolCount, toolsSelected]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!toolsRef.current) return;
    // Pulse selected tools
    const color = new THREE.Color();
    for (let i = 0; i < Math.min(toolsSelected, toolCount); i++) {
      const bright = 0.5 + Math.sin(timeRef.current * 2 + i * 0.5) * 0.2;
      color.setRGB(bright, bright * 0.4, bright * 0.27);
      toolsRef.current.setColorAt(i, color);
    }
    if (toolsRef.current.instanceColor) toolsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Rack uprights */}
      {[-5, -2.5, 0].map((x, i) => (
        <React.Fragment key={i}>
          <mesh position={[x - 0.45, 1.5, -5.5]} castShadow>
            <boxGeometry args={[0.05, 3.0, 0.4]} />
            <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[x + 0.45, 1.5, -5.5]} castShadow>
            <boxGeometry args={[0.05, 3.0, 0.4]} />
            <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
          </mesh>
        </React.Fragment>
      ))}
      <instancedMesh ref={shelvesRef} args={[undefined, undefined, shelfCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1E1822" metalness={0.5} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={toolsRef} args={[undefined, undefined, toolCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.2} metalness={0.4} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

// ■■ Task Assignment Board ■■
function TaskBoard({ currentTask }: { currentTask: string }) {
  const cardCount = 9;
  const cardsRef = useRef<THREE.InstancedMesh>(null);
  const pinsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!cardsRef.current || !pinsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < cardCount; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = (col - 1) * 0.45;
      const y = 2.6 - row * 0.5;
      // Card
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.1));
      tmp.compose(new THREE.Vector3(x + 3.5, y, -6.85), rot, new THREE.Vector3(0.35, 0.3, 0.01));
      cardsRef.current.setMatrixAt(i, tmp);
      const isActive = currentTask.length > 0 && i === 0;
      color.set(isActive ? LAB_COLOR : '#1E1A28');
      cardsRef.current.setColorAt(i, color);
      // Pin
      tmp.makeScale(0.02, 0.02, 0.02);
      tmp.setPosition(x + 3.5, y + 0.12, -6.83);
      pinsRef.current.setMatrixAt(i, tmp);
    }
    cardsRef.current.instanceMatrix.needsUpdate = true;
    if (cardsRef.current.instanceColor) cardsRef.current.instanceColor.needsUpdate = true;
    pinsRef.current.instanceMatrix.needsUpdate = true;
  }, [cardCount, currentTask]);

  useFrame((_, delta) => {
    timeRef.current += delta;
  });

  return (
    <group>
      {/* Board background */}
      <mesh position={[3.5, 2.3, -6.9]} castShadow>
        <boxGeometry args={[1.8, 1.6, 0.08]} />
        <meshStandardMaterial color="#2A1E18" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Board frame */}
      <mesh position={[3.5, 2.3, -6.88]}>
        <boxGeometry args={[1.9, 1.7, 0.02]} />
        <meshStandardMaterial color="#3A2A20" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Cards */}
      <instancedMesh ref={cardsRef} args={[undefined, undefined, cardCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.05} />
      </instancedMesh>
      {/* Pins */}
      <instancedMesh ref={pinsRef} args={[undefined, undefined, cardCount]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color="#FF3333" emissive="#FF3333" emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Tool Comparison Table ■■
function ComparisonTable(_props: Record<string, never>) {
  const panelRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (panelRef.current) {
      (panelRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.15 + Math.sin(timeRef.current * 1.5) * 0.05;
    }
  });

  return (
    <group position={[0, 0, 1]}>
      {/* Table surface */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.06, 1.2]} />
        <meshStandardMaterial color="#1A1822" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Table legs */}
      {[[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]}>
          <boxGeometry args={[0.06, 0.75, 0.06]} />
          <meshStandardMaterial color="#333340" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Evaluation panel (holographic surface) */}
      <mesh ref={panelRef} position={[0, 0.79, 0]}>
        <boxGeometry args={[2.2, 0.01, 1.0]} />
        <meshStandardMaterial
          color="#000000"
          emissive={LAB_COLOR}
          emissiveIntensity={0.15}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Divider line */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.01, 0.005, 1.0]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ■■ Effectiveness Meter Gauges ■■
function EffectivenessGauges({ toolsSelected }: { toolsSelected: number }) {
  const gaugeCount = 5;
  const needlesRef = useRef<THREE.InstancedMesh>(null);
  const dialsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!dialsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < gaugeCount; i++) {
      const x = (i - (gaugeCount - 1) / 2) * 1.2;
      tmp.makeScale(0.35, 0.35, 0.03);
      tmp.setPosition(x, 2.5, 5.9);
      dialsRef.current.setMatrixAt(i, tmp);
    }
    dialsRef.current.instanceMatrix.needsUpdate = true;
  }, [gaugeCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!needlesRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < gaugeCount; i++) {
      const x = (i - (gaugeCount - 1) / 2) * 1.2;
      const targetAngle = -Math.PI / 4 + (Math.min(toolsSelected, 5) / 5) * (Math.PI / 2);
      const angle = targetAngle + Math.sin(timeRef.current * 2 + i) * 0.05;
      rot.setFromEuler(new THREE.Euler(0, 0, angle));
      tmp.compose(new THREE.Vector3(x, 2.5, 5.92), rot, new THREE.Vector3(0.01, 0.25, 0.01));
      needlesRef.current.setMatrixAt(i, tmp);
    }
    needlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Dial backgrounds */}
      <instancedMesh ref={dialsRef} args={[undefined, undefined, gaugeCount]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial color="#111118" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* Gauge bezels */}
      {Array.from({ length: gaugeCount }, (_, i) => (
        <mesh key={i} position={[(i - (gaugeCount - 1) / 2) * 1.2, 2.5, 5.88]}>
          <torusGeometry args={[0.37, 0.025, 6, 24]} />
          <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.2} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
      {/* Needles */}
      <instancedMesh ref={needlesRef} args={[undefined, undefined, gaugeCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#FF3333" emissive="#FF3333" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Integration Pipeline Models (Instanced) ■■
function IntegrationPipelines() {
  const segCount = 20;
  const segsRef = useRef<THREE.InstancedMesh>(null);
  const jointsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!segsRef.current || !jointsRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < segCount; i++) {
      const t = i / segCount;
      const x = -4 + t * 8;
      const y = 1.5 + Math.sin(t * Math.PI * 2) * 0.3;
      const z = 3 + Math.cos(t * Math.PI) * 0.5;
      const isVertical = i % 3 === 0;
      rot.setFromEuler(new THREE.Euler(0, 0, isVertical ? Math.PI / 2 : 0));
      tmp.compose(new THREE.Vector3(x, y, z), rot, new THREE.Vector3(0.04, 0.4, 0.04));
      segsRef.current.setMatrixAt(i, tmp);
      // Joints
      tmp.makeScale(0.06, 0.06, 0.06);
      tmp.setPosition(x, y, z);
      jointsRef.current.setMatrixAt(i, tmp);
    }
    segsRef.current.instanceMatrix.needsUpdate = true;
    jointsRef.current.instanceMatrix.needsUpdate = true;
  }, [segCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!jointsRef.current) return;
    const mat = jointsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={segsRef} args={[undefined, undefined, segCount]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#333340" metalness={0.7} roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={jointsRef} args={[undefined, undefined, segCount]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Safety Rating Indicators ■■
function SafetyRatings() {
  const count = 5;
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const lightColors = ['#FF3333', '#FFAA33', '#33FF33'];

  React.useEffect(() => {
    if (!lightsRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const x = -5.5 + i * (11 / (count - 1 || 1));
      for (let l = 0; l < 3; l++) {
        const idx = i * 3 + l;
        if (idx >= count * 3) break;
        tmp.makeScale(0.06, 0.06, 0.06);
        tmp.setPosition(x, 0.8 + l * 0.2, 5.8);
        lightsRef.current.setMatrixAt(idx, tmp);
        color.set(lightColors[l]);
        lightsRef.current.setColorAt(idx, color);
      }
    }
    lightsRef.current.instanceMatrix.needsUpdate = true;
    if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const mat = lightsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(timeRef.current * 1.5) * 0.15;
  });

  return (
    <group>
      {/* Indicator posts */}
      {Array.from({ length: count }, (_, i) => {
        const x = -5.5 + i * (11 / (count - 1 || 1));
        return (
          <mesh key={i} position={[x, 0.5, 5.8]}>
            <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
            <meshStandardMaterial color="#2A2235" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Traffic lights */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, count * 3]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Tool Evolution Timeline (Wall) ■■
function EvolutionTimeline() {
  const markerCount = 8;
  const markersRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!markersRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < markerCount; i++) {
      const x = -4 + (i / (markerCount - 1)) * 8;
      tmp.makeScale(0.05, 0.05, 0.05);
      tmp.setPosition(x, 3.2, -6.85);
      markersRef.current.setMatrixAt(i, tmp);
      color.lerpColors(new THREE.Color('#FF6644'), new THREE.Color('#FFDD44'), i / markerCount);
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
      {/* Timeline bar */}
      <mesh position={[0, 3.2, -6.88]}>
        <boxGeometry args={[9, 0.02, 0.02]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* Markers */}
      <instancedMesh ref={markersRef} args={[undefined, undefined, markerCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface ToolPickerEnvironmentProps {
  toolsSelected?: number;
  currentTask?: string;
}

export default function ToolPickerEnvironment({
  toolsSelected = 0,
  currentTask = '',
}: ToolPickerEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0806"
      skyTopColor="#0A0604"
      skyHorizonColor="#1A0E08"
      fogColor="#FF6644"
    >
      <ToolRacks toolsSelected={toolsSelected} />
      <TaskBoard currentTask={currentTask} />
      <ComparisonTable />
      <EffectivenessGauges toolsSelected={toolsSelected} />
      <IntegrationPipelines />
      <SafetyRatings />
      <EvolutionTimeline />
      {/* Workshop ambient point lights */}
      <pointLight position={[-3, 2.5, -3]} intensity={0.4} color={LAB_COLOR} distance={8} />
      <pointLight position={[3, 2.5, 3]} intensity={0.3} color="#FFAA44" distance={8} />
    </StandardEnvironmentWrapper>
  );
}
