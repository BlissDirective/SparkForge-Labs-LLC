'use client';

// ================================================================
// BiasDecisionTree3D — 3D decision tree for Bias Detective fix phase
// ================================================================
// P6-C: Shows the biased algorithm's decision process as a 3D tree
// structure. Biased nodes glow red, corrected nodes glow green.
// Children can see which "branches" of the AI's thinking lead to
// unfair outcomes and understand why fixes help.
// ================================================================

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group } from 'three';

interface DecisionNode {
  id: string;
  label: string;
  isBiased: boolean;
  isFixed: boolean;
  depth: number;
  children: string[];
}

interface BiasDecisionTree3DProps {
  nodes: DecisionNode[];
  caseColor: string;
  fixedCount: number;
  totalBiased: number;
}

export default function BiasDecisionTree3D({
  nodes,
  caseColor,
  fixedCount,
  totalBiased,
}: BiasDecisionTree3DProps) {
  const groupRef = useRef<Group>(null);
  const fixProgress = totalBiased > 0 ? fixedCount / totalBiased : 0;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
  });

  // Build a simple tree layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    const byDepth: DecisionNode[][] = [];
    nodes.forEach((n) => {
      if (!byDepth[n.depth]) byDepth[n.depth] = [];
      byDepth[n.depth].push(n);
    });

    byDepth.forEach((layer, depth) => {
      const count = layer.length;
      layer.forEach((node, idx) => {
        const x = (idx - (count - 1) / 2) * 1.5;
        const y = (byDepth.length - 1 - depth) * 1.2;
        positions.set(node.id, [x, y, 0]);
      });
    });
    return positions;
  }, [nodes]);

  return (
    <group ref={groupRef} position={[-2, 0, -1]}>
      {/* Tree nodes */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        const nodeColor = node.isFixed
          ? new Color('#10B981') // Green (fixed)
          : node.isBiased
            ? new Color('#EF4444') // Red (biased)
            : new Color(caseColor); // Neutral

        return (
          <group key={node.id} position={pos}>
            {/* Node sphere */}
            <mesh castShadow>
              <octahedronGeometry args={[0.2]} />
              <meshStandardMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={node.isBiased && !node.isFixed ? 0.8 : 0.3}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>

            {/* Fix indicator glow */}
            {node.isFixed && (
              <mesh>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0.2}
                />
              </mesh>
            )}

            {/* Connection lines to children */}
            {node.children.map((childId) => {
              const childPos = nodePositions.get(childId);
              if (!childPos) return null;
              const dx = childPos[0] - pos[0];
              const dy = childPos[1] - pos[1];
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              return (
                <mesh
                  key={`${node.id}-${childId}`}
                  position={[dx / 2, dy / 2, 0]}
                  rotation={[0, 0, angle]}
                >
                  <boxGeometry args={[length, 0.03, 0.03]} />
                  <meshStandardMaterial
                    color={nodeColor}
                    emissive={nodeColor}
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.5}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* Progress indicator — arc that fills as fixes are applied */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[
          nodes.length * 0.3,
          0.03,
          8,
          32,
          Math.PI * 2 * fixProgress,
        ]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={1.0 + fixProgress}
        />
      </mesh>

      <pointLight position={[0, 2, 1]} intensity={0.4} color={caseColor} distance={6} />
    </group>
  );
}
