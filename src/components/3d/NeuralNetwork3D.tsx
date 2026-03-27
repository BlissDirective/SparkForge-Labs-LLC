// ================================================================
// NeuralNetwork3D — Interactive 3D Neural Network Visualization
// ================================================================
// v3-FINAL: Decision 6.1 — Replaces SVG entirely with 3D rotatable
// network. No 2D/3D toggle. This IS the network visualization.
//
// REPLACES: NeuralNet3D.tsx (v2 brain orb — delete after v3 deploy)
//
// Architecture:
// - Neurons: SphereGeometry with emissive activation color
// - Connections: Line segments with weight-based thickness/color
// - Camera: OrbitControls, constrained polar angle, auto-orbit
// - Interaction: Raycasting for hover (inspect) and click (weight)
// - Heartbeat: Idle pulse wave (v2 enhancement preserved)
// - Sparks: Flash at connection midpoints during training
// - D3D Desktop-First: all effects always active
//
// Dynamic import with ssr: false required.
// Budget: ~20K triangles max.
// ================================================================

'use client';

import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { Color, Mesh, Vector3 } from 'three';
import NeuralBuilderEnvironment from './environments/NeuralBuilderEnvironment';

// ================================================================
// TYPES
// ================================================================

interface NetworkNode {
  id: string;
  layer: number;
  index: number;
  activation: number; // 0-1
}

interface NetworkConnection {
  fromId: string;
  toId: string;
  weight: number; // -1 to 1
  prevWeight: number;
  sparkIntensity: number; // 0-1
}

interface NetworkData {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}

interface NeuralNetwork3DProps {
  layerSizes: number[];
  network: NetworkData;
  isTraining: boolean;
  trainEpoch: number;
  accuracy: number;
  complexity: number; // 0-1
  trainingProgress: number; // 0-1
  dataFlowActive: boolean;
  heartbeatPhase: number; // 0-1 (v2 heartbeat)
  selectedConnection: string | null;
  inspectedNode: string | null;
  onSelectConnection: (id: string | null) => void;
  onInspectNode: (id: string | null) => void;
  labColor?: string;
}

// ================================================================
// COLOR HELPERS
// ================================================================

const COLD_COLOR = new Color('#3b82f6'); // Blue
const HOT_COLOR = new Color('#f97316');  // Orange
const SPARK_COLOR = new Color('#fbbf24'); // Amber

function activationColor(activation: number): Color {
  const c = new Color();
  c.lerpColors(COLD_COLOR, HOT_COLOR, Math.max(0, Math.min(1, activation)));
  return c;
}

function weightColor(weight: number): string {
  const t = (weight + 1) / 2; // -1..1 → 0..1
  const r = Math.round(59 + t * 190);
  const g = Math.round(130 - t * 80);
  const b = Math.round(246 - t * 200);
  return `rgb(${r},${g},${b})`;
}

// ================================================================
// 3D NODE POSITIONS
// ================================================================

function getNodePosition3D(
  layer: number,
  index: number,
  layerSizes: number[],
  totalLayers: number
): [number, number, number] {
  const layerSpacing = 2.5;
  const nodeSpacing = 1.2;
  const layerCount = layerSizes[layer] || 1;
  const x = (layer - (totalLayers - 1) / 2) * layerSpacing;
  const y = (index - (layerCount - 1) / 2) * nodeSpacing;
  const z = 0; // Flat in z, depth comes from x-axis when rotated
  return [x, y, z];
}

// ================================================================
// NEURON SPHERE COMPONENT
// ================================================================

function NeuronSphere({
  node,
  position,
  isInspected,
  isTraining,
  heartbeatPhase,
  layerSizes,
  onHover,
  onClick,
}: {
  node: NetworkNode;
  position: [number, number, number];
  isInspected: boolean;
  isTraining: boolean;
  heartbeatPhase: number;
  layerSizes: number[];
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const segments = 20;
  const radius = 0.15;

  // Compute activation with heartbeat
  const effectiveActivation = useMemo(() => {
    if (isTraining) return node.activation;
    // Heartbeat: wave from layer 0 → last layer
    const totalLayers = layerSizes.length;
    const layerT = node.layer / Math.max(totalLayers - 1, 1);
    const dist = Math.abs(layerT - heartbeatPhase);
    const pulse = dist < 0.15 ? (0.15 - dist) / 0.15 * 0.25 : 0;
    return Math.max(node.activation, pulse);
  }, [node.activation, node.layer, isTraining, heartbeatPhase, layerSizes.length]);

  const color = useMemo(
    () => activationColor(effectiveActivation),
    [effectiveActivation]
  );

  const emissiveIntensity = 0.3 + effectiveActivation * 1.2;

  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isInspected ? 1.4 : 1.0 + effectiveActivation * 0.15;
    meshRef.current.scale.lerp(
      new Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(node.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'default';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick(node.id);
      }}
    >
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ================================================================
// CONNECTION LINE COMPONENT
// ================================================================

function ConnectionLine({
  from,
  to,
  connection,
  isSelected,
  onSelect,
}: {
  from: [number, number, number];
  to: [number, number, number];
  connection: NetworkConnection;
  isSelected: boolean;
  dataFlowActive: boolean;
  onSelect: (id: string) => void;
}) {
  const lineWidth = Math.max(0.5, Math.abs(connection.weight) * 3);
  const color = weightColor(connection.weight);
  const opacity = isSelected ? 1.0 : 0.3 + Math.abs(connection.weight) * 0.5;

  // Spark flash at midpoint
  const sparkRef = useRef<Mesh>(null);
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  useFrame(() => {
    if (!sparkRef.current) return;
    if (connection.sparkIntensity > 0.3) {
      const s = connection.sparkIntensity * 0.3;
      sparkRef.current.scale.set(s, s, s);
      sparkRef.current.visible = true;
    } else {
      sparkRef.current.visible = false;
    }
  });

  const connId = `${connection.fromId}-${connection.toId}`;

  return (
    <group>
      <Line
        points={[from, to]}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(connId);
        }}
      />
      {/* Spark flash mesh */}
      <mesh ref={sparkRef} position={midpoint} visible={false}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={SPARK_COLOR} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ================================================================
// LAYER LABEL COMPONENT
// ================================================================

function LayerLabel({
  layer,
  layerSize,
  position,
  totalLayers,
}: {
  layer: number;
  layerSize: number;
  position: [number, number, number];
  totalLayers: number;
}) {
  const label =
    layer === 0
      ? 'Input'
      : layer === totalLayers - 1
        ? 'Output'
        : `Hidden ${layer}`;

  return (
    <Text
      position={[position[0], position[1] - 0.5, position[2]]}
      fontSize={0.18}
      color="#ffffff"
      anchorX="center"
      anchorY="top"
      outlineWidth={0.01}
      outlineColor="#000000"
    >
      {label} ({layerSize})
    </Text>
  );
}

// ================================================================
// AUTO-ORBIT CONTROLLER
// ================================================================

function AutoOrbitController({
  isTraining,
}: {
  isTraining: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useFrame(() => {
    if (!controlsRef.current) return;
    if (isTraining) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.5;
    } else {
      controlsRef.current.autoRotate = false;
    }
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      minPolarAngle={Math.PI * 0.19} // ~35 degrees
      maxPolarAngle={Math.PI * 0.47} // ~85 degrees
      minDistance={3}
      maxDistance={12}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

// ================================================================
// NETWORK SCENE (inner R3F component)
// ================================================================

function NetworkScene({
  layerSizes,
  network,
  isTraining,
  heartbeatPhase,
  dataFlowActive,
  selectedConnection,
  inspectedNode,
  onSelectConnection,
  onInspectNode,
}: Omit<NeuralNetwork3DProps, 'trainEpoch' | 'accuracy' | 'complexity' | 'trainingProgress' | 'labColor'>) {
  const totalLayers = layerSizes.length;

  // Precompute 3D positions for all nodes
  const nodePositions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    network.nodes.forEach(node => {
      map.set(
        node.id,
        getNodePosition3D(node.layer, node.index, layerSizes, totalLayers)
      );
    });
    return map;
  }, [network.nodes, layerSizes, totalLayers]);

  // Layer label positions (below bottom node of each layer)
  const layerLabelPositions = useMemo(() => {
    return layerSizes.map((size, layer) => {
      const bottomY = -((size - 1) / 2) * 1.2;
      const x = (layer - (totalLayers - 1) / 2) * 2.5;
      return [x, bottomY - 0.6, 0] as [number, number, number];
    });
  }, [layerSizes, totalLayers]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#EC4899" />
      <pointLight position={[-4, -3, 3]} intensity={0.3} color="#6366F1" />

      {/* Neurons */}
      {network.nodes.map(node => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;
        return (
          <NeuronSphere
            key={node.id}
            node={node}
            position={pos}
            isInspected={inspectedNode === node.id}
            isTraining={isTraining}
            heartbeatPhase={heartbeatPhase}
            layerSizes={layerSizes}
            onHover={onInspectNode}
            onClick={onInspectNode}
          />
        );
      })}

      {/* Connections */}
      {network.connections.map(conn => {
        const fromPos = nodePositions.get(conn.fromId);
        const toPos = nodePositions.get(conn.toId);
        if (!fromPos || !toPos) return null;
        const connId = `${conn.fromId}-${conn.toId}`;
        return (
          <ConnectionLine
            key={connId}
            from={fromPos}
            to={toPos}
            connection={conn}
            isSelected={selectedConnection === connId}
            dataFlowActive={dataFlowActive}
            onSelect={onSelectConnection}
          />
        );
      })}

      {/* Layer Labels */}
      {layerSizes.map((size, layer) => (
        <LayerLabel
          key={`label-${layer}`}
          layer={layer}
          layerSize={size}
          position={layerLabelPositions[layer]}
          totalLayers={totalLayers}
        />
      ))}

      {/* Camera Controls */}
      <AutoOrbitController isTraining={isTraining} />

      {/* 3D Embedding: Removed duplicate Environment preset="night" — NeuralBuilderEnvironment
         provides HDR/lighting in the outer group. Also removed EffectComposer — CockpitCanvas
         provides PostProcessingStack (D3D-C1). */}
    </>
  );
}

// ================================================================
// EXPORTED COMPONENT — Group (D3D-B1 compliant)
// ================================================================
// S6-CRIT-002: Refactored from standalone Canvas to <group> that
// renders inside CockpitCanvas via sceneStore.setGameSceneContent.

export default function NeuralNetwork3D(props: NeuralNetwork3DProps) {
  return (
    <group>
      {/* [5M] Immersive Data Center Environment */}
      <NeuralBuilderEnvironment
        isTraining={props.isTraining}
        accuracy={props.accuracy}
      />

      <NetworkScene
        layerSizes={props.layerSizes}
        network={props.network}
        isTraining={props.isTraining}
        heartbeatPhase={props.heartbeatPhase}
        dataFlowActive={props.dataFlowActive}
        selectedConnection={props.selectedConnection}
        inspectedNode={props.inspectedNode}
        onSelectConnection={props.onSelectConnection}
        onInspectNode={props.onInspectNode}
      />
    </group>
  );
}
