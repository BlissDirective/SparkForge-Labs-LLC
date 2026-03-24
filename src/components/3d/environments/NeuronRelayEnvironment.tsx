'use client';

// ════════════════════════════════════════════════════
// NeuronRelayEnvironment — Neural Network Relay Station (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 3: Neural Networks | Color: #FF66AA (Pink)
//
// A brain-inspired chamber teaching neural network signal propagation:
//   - Giant neuron models with soma bodies (instanced)
//   - Glowing axon pathways connecting neurons (instanced tubes)
//   - Synapse junction nodes that light up on signal (instanced)
//   - Signal pulse particles traveling along paths
//   - Neural layer panels (input / hidden / output) as labeled walls
//   - Activation function visualizer curves
//   - Dendrite forest ceiling with branching structures
//   - Brain-tissue textured chamber walls
//
// Triangle Budget (Desktop Ultra):
//   Neuron Soma Bodies (instanced):     ~70K  (10 neurons x ~7K)
//   Axon Pathways (instanced):          ~65K  (15 axon tubes)
//   Synapse Junctions (instanced):      ~55K  (20 synapse nodes)
//   Signal Pulse Particles:             ~40K  (instanced traveling pulses)
//   Neural Layer Panels:                ~45K  (3 layer panels + frames)
//   Activation Visualizers:             ~35K  (curve meshes)
//   Dendrite Ceiling Forest:            ~80K  (instanced branches)
//   Chamber Walls:                      ~65K  (brain-tissue enclosure)
//   Floor Circuitry:                    ~45K
//   Total:                              ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper } from './StandardEnvironmentBase';

const LAB_COLOR = '#FF66AA';

// ■■ Neuron Soma Bodies (Instanced) ■■
function NeuronSomas({ activeLayer }: { activeLayer: number }) {
  const count = 10;
  const somasRef = useRef<THREE.InstancedMesh>(null);
  const nucleiRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const neuronData = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const layer = Math.floor(i / Math.ceil(count / 3));
      return {
        x: -4 + layer * 4,
        y: 1.0 + (i % 3) * 1.2 + Math.random() * 0.5,
        z: (i % 4 - 1.5) * 1.5,
        layer,
        scale: 0.3 + Math.random() * 0.15,
      };
    }),
  [count]);

  React.useEffect(() => {
    if (!somasRef.current || !nucleiRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const n = neuronData[i];
      const s = n.scale;
      // Soma body
      tmp.makeScale(s, s, s);
      tmp.setPosition(n.x, n.y, n.z);
      somasRef.current.setMatrixAt(i, tmp);
      // Nucleus
      tmp.makeScale(s * 0.4, s * 0.4, s * 0.4);
      tmp.setPosition(n.x, n.y, n.z);
      nucleiRef.current.setMatrixAt(i, tmp);
      const isActive = n.layer === activeLayer;
      color.set(isActive ? '#FFFFFF' : LAB_COLOR);
      somasRef.current.setColorAt(i, color);
    }
    somasRef.current.instanceMatrix.needsUpdate = true;
    nucleiRef.current.instanceMatrix.needsUpdate = true;
    if (somasRef.current.instanceColor) somasRef.current.instanceColor.needsUpdate = true;
  }, [count, activeLayer, neuronData]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!somasRef.current) return;
    const mat = somasRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.5) * 0.15;
  });

  return (
    <group>
      <instancedMesh ref={somasRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
          metalness={0.3}
          roughness={0.5}
        />
      </instancedMesh>
      <instancedMesh ref={nucleiRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Axon Pathways (Instanced Tubes) ■■
function AxonPathways() {
  const count = 15;
  const axonsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const axonData = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const fromLayer = Math.floor(i / 5);
      const toLayer = fromLayer + 1;
      return {
        fromX: -4 + fromLayer * 4,
        toX: -4 + toLayer * 4,
        fromY: 1.0 + (i % 3) * 1.2,
        toY: 1.0 + ((i + 1) % 3) * 1.2,
        fromZ: ((i % 4) - 1.5) * 1.5,
        toZ: (((i + 2) % 4) - 1.5) * 1.5,
      };
    }),
  [count]);

  React.useEffect(() => {
    if (!axonsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const a = axonData[i];
      const midX = (a.fromX + a.toX) / 2;
      const midY = (a.fromY + a.toY) / 2;
      const midZ = (a.fromZ + a.toZ) / 2;
      const dx = a.toX - a.fromX;
      const dy = a.toY - a.fromY;
      const dz = a.toZ - a.fromZ;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const rot = new THREE.Quaternion();
      const dir = new THREE.Vector3(dx, dy, dz).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      rot.setFromUnitVectors(up, dir);
      tmp.compose(
        new THREE.Vector3(midX, midY, midZ),
        rot,
        new THREE.Vector3(0.02, length / 2, 0.02)
      );
      axonsRef.current.setMatrixAt(i, tmp);
    }
    axonsRef.current.instanceMatrix.needsUpdate = true;
  }, [count, axonData]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!axonsRef.current) return;
    const mat = axonsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 2) * 0.15;
  });

  return (
    <instancedMesh ref={axonsRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial
        color={LAB_COLOR}
        emissive={LAB_COLOR}
        emissiveIntensity={0.3}
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
}

// ■■ Synapse Junction Nodes (Instanced) ■■
function SynapseJunctions({ signalStrength }: { signalStrength: number }) {
  const count = 20;
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const junctionData = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: -3 + (i % 5) * 1.5 + (Math.random() - 0.5) * 0.5,
      y: 0.8 + (Math.floor(i / 5)) * 1.0 + Math.random() * 0.6,
      z: (Math.random() - 0.5) * 4,
      phase: Math.random() * Math.PI * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!nodesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const j = junctionData[i];
      const pulse = Math.sin(timeRef.current * 3 + j.phase) > (1 - signalStrength) ? 1 : 0.3;
      const scale = 0.06 * pulse + 0.03;
      tmp.makeScale(scale, scale, scale);
      tmp.setPosition(j.x, j.y, j.z);
      nodesRef.current.setMatrixAt(i, tmp);
      color.lerpColors(
        new THREE.Color('#442244'),
        new THREE.Color('#FFFFFF'),
        pulse > 0.5 ? signalStrength : 0
      );
      nodesRef.current.setColorAt(i, color);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={nodesRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial
        emissive={LAB_COLOR}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

// ■■ Signal Pulse Particles ■■
function SignalPulses({ signalStrength }: { signalStrength: number }) {
  const count = 30;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, (_, _i) => ({
      startX: -4 + Math.random() * 2,
      endX: 2 + Math.random() * 2,
      y: 0.8 + Math.random() * 3,
      z: (Math.random() - 0.5) * 4,
      speed: 0.8 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    })),
  [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!meshRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const t = ((timeRef.current * s.speed * signalStrength + s.phase) % 1);
      const x = s.startX + t * (s.endX - s.startX);
      const y = s.y + Math.sin(t * Math.PI) * 0.5;
      const z = s.z + Math.sin(t * Math.PI * 2 + s.phase) * 0.3;
      const scale = 0.04 * signalStrength;
      tmp.makeScale(scale, scale, scale);
      tmp.setPosition(x, y, z);
      meshRef.current.setMatrixAt(i, tmp);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshStandardMaterial
        color="#FFFFFF"
        emissive="#FFFFFF"
        emissiveIntensity={0.9}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ■■ Neural Layer Panels ■■
function NeuralLayerPanels({ activeLayer }: { activeLayer: number }) {
  const panelRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);
  const layers = ['INPUT', 'HIDDEN', 'OUTPUT'];

  useFrame((_, delta) => {
    timeRef.current += delta;
    panelRefs.current.forEach((panel, i) => {
      if (!panel) return;
      const mat = panel.material as THREE.MeshStandardMaterial;
      const isActive = i === activeLayer;
      mat.emissiveIntensity = isActive
        ? 0.5 + Math.sin(timeRef.current * 3) * 0.2
        : 0.1;
    });
  });

  return (
    <group>
      {layers.map((_, i) => {
        const x = -4 + i * 4;
        return (
          <group key={i} position={[x, 4.0, 0]}>
            {/* Panel */}
            <mesh
              ref={(el) => { if (el) panelRefs.current[i] = el; }}
            >
              <boxGeometry args={[2.0, 0.4, 0.05]} />
              <meshStandardMaterial
                color={i === activeLayer ? LAB_COLOR : '#2A1A30'}
                emissive={LAB_COLOR}
                emissiveIntensity={0.1}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>
            {/* Bracket */}
            {(
              <>
                <mesh position={[-1.1, 0, 0]}>
                  <boxGeometry args={[0.04, 0.6, 0.04]} />
                  <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[1.1, 0, 0]}>
                  <boxGeometry args={[0.04, 0.6, 0.04]} />
                  <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ■■ Activation Function Visualizer ■■
function ActivationVisualizer() {
  const curveRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (curveRef.current) {
      const mat = curveRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.2) * 0.15;
    }
  });

  return (
    <group position={[0, 0.5, -4.5]}>
      {/* Sigmoid curve approximation using box segments */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = (i / 19) * 2 - 1;
        const sigmoid = 1 / (1 + Math.exp(-t * 4));
        const x = t * 2;
        const y = sigmoid * 1.5;
        return (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[0.22, 0.04, 0.02]} />
            <meshStandardMaterial
              color={LAB_COLOR}
              emissive={LAB_COLOR}
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
      {/* Axis lines */}
      <mesh position={[0, 0.75, -0.01]}>
        <boxGeometry args={[4.2, 0.01, 0.01]} />
        <meshStandardMaterial color="#444455" />
      </mesh>
      <mesh position={[0, 0.75, -0.01]}>
        <boxGeometry args={[0.01, 1.8, 0.01]} />
        <meshStandardMaterial color="#444455" />
      </mesh>
      {/* Label backing */}
      <mesh ref={curveRef} position={[0, 2.0, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.03]} />
        <meshStandardMaterial color="#1A0E20" emissive={LAB_COLOR} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Dendrite Ceiling Forest (Instanced) ■■
function DendriteCeiling() {
  const count = 30;
  const dendritesRef = useRef<THREE.InstancedMesh>(null);
  const tipsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const seeds = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 8,
      length: 0.5 + Math.random() * 1.5,
      angle: (Math.random() - 0.5) * 0.6,
      phase: Math.random() * Math.PI * 2,
    })),
  [count]);

  React.useEffect(() => {
    if (!dendritesRef.current || !tipsRef.current) return;
    const tmp = new THREE.Matrix4();
    const rot = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      rot.setFromEuler(new THREE.Euler(s.angle, 0, s.angle * 0.5));
      // Branch
      tmp.compose(
        new THREE.Vector3(s.x, 4.5 - s.length / 2, s.z),
        rot,
        new THREE.Vector3(0.015, s.length / 2, 0.015)
      );
      dendritesRef.current.setMatrixAt(i, tmp);
      // Tip
      tmp.makeScale(0.03, 0.03, 0.03);
      tmp.setPosition(s.x + Math.sin(s.angle) * s.length * 0.3, 4.5 - s.length, s.z);
      tipsRef.current.setMatrixAt(i, tmp);
    }
    dendritesRef.current.instanceMatrix.needsUpdate = true;
    tipsRef.current.instanceMatrix.needsUpdate = true;
  }, [count, seeds]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!tipsRef.current) return;
    const mat = tipsRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 1.8) * 0.2;
  });

  return (
    <group>
      <instancedMesh ref={dendritesRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 0.5, 1, 5]} />
        <meshStandardMaterial color="#3A1A30" metalness={0.3} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={tipsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.3} transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

// ■■ Chamber Walls (Brain-Tissue Textured) ■■
function ChamberWalls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.2, -5.5]} castShadow>
        <boxGeometry args={[12, 5, 0.12]} />
        <meshStandardMaterial color="#120A18" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-6, 2.2, -0.5]} castShadow>
        <boxGeometry args={[0.12, 5, 10]} />
        <meshStandardMaterial color="#120A18" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[6, 2.2, -0.5]} castShadow>
        <boxGeometry args={[0.12, 5, 10]} />
        <meshStandardMaterial color="#120A18" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 4.7, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#0A0610" roughness={0.9} />
      </mesh>
      {/* Brain-tissue accent folds on walls */}
      {(
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-5.9, 1.5 + i * 0.6, (i - 3) * 1.5]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.3, 0.08, 6, 12, Math.PI]} />
              <meshStandardMaterial color="#2A1430" metalness={0.2} roughness={0.7} />
            </mesh>
          ))}
          {/* Floor circuitry */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`fl-${i}`} position={[-3 + i * 1.5, -0.96, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.02, 8]} />
              <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.25} transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// ■■ Main Environment ■■
interface NeuronRelayEnvironmentProps {
  activeLayer?: number;
  signalStrength?: number;
}

export default function NeuronRelayEnvironment({
  activeLayer = 0,
  signalStrength = 0.5,
}: NeuronRelayEnvironmentProps) {

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0A0614"
      skyTopColor="#040210"
      skyHorizonColor="#1A0A28"
      fogColor="#FF66AA"
    >
      <ChamberWalls />
      <NeuronSomas activeLayer={activeLayer} />
      <AxonPathways />
      <SynapseJunctions signalStrength={signalStrength} />
      <SignalPulses signalStrength={signalStrength} />
      <NeuralLayerPanels activeLayer={activeLayer} />
      <ActivationVisualizer />
      <DendriteCeiling />
      {/* Active layer spotlight */}
      <pointLight
        position={[-4 + activeLayer * 4, 3, 0]}
        intensity={1.2}
        color={LAB_COLOR}
        distance={6}
      />
    </StandardEnvironmentWrapper>
  );
}
