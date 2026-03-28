'use client';

// ================================================================
// SortFeatureViz3D — AI feature-distance visualization
// ================================================================
// P6-D: Shows how the AI "sees" shapes in feature space during the
// reveal phase. Each shape is a point in 3D space, positioned by
// its features (color=X, shape=Y, size=Z). Connection lines show
// which items the AI grouped together. Helps children understand
// feature-based clustering visually.
// ================================================================

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group } from 'three';

interface FeaturePoint {
  id: string;
  color: string;
  shape: string;
  size: string;
  group: number;
  position: [number, number, number]; // derived from features
}

interface SortFeatureViz3DProps {
  items: FeaturePoint[];
  criterion: string; // 'shape' | 'color' | 'size'
  labColor?: string;
}

// Map shape/color/size to spatial coordinates for visualization
function featureToPosition(item: FeaturePoint, criterion: string): [number, number, number] {
  const shapeMap: Record<string, number> = { circle: -1, sphere: -1, square: 0, box: 0, triangle: 1, cone: 1 };
  const colorMap: Record<string, number> = { '#3B82F6': -1, '#EF4444': 0, '#10B981': 1 };
  const sizeMap: Record<string, number> = { small: -0.5, large: 0.5 };

  const x = shapeMap[item.shape] ?? 0;
  const y = sizeMap[item.size] ?? 0;
  const z = colorMap[item.color] ?? 0;

  // Spread based on which feature the AI chose
  const spread = 0.8;
  if (criterion === 'shape') return [x * 2, y * spread, z * spread];
  if (criterion === 'color') return [x * spread, y * spread, z * 2];
  return [x * spread, y * 2, z * spread]; // size
}

const GROUP_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

export default function SortFeatureViz3D({
  items,
  criterion,
  labColor = '#AA66FF',
}: SortFeatureViz3DProps) {
  const groupRef = useRef<Group>(null);

  const points = useMemo(() =>
    items.map((item) => ({
      ...item,
      featurePos: featureToPosition(item, criterion),
    })),
    [items, criterion]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
  });

  return (
    <group ref={groupRef} position={[0, 1, -1]}>
      {/* Axis lines */}
      {[
        { dir: [3, 0, 0] as [number, number, number], label: 'Shape', color: '#AA66FF' },
        { dir: [0, 2, 0] as [number, number, number], label: 'Size', color: '#8B5CF6' },
        { dir: [0, 0, 3] as [number, number, number], label: 'Color', color: '#6B3FA0' },
      ].map((axis, i) => (
        <group key={i}>
          <mesh position={[axis.dir[0] / 2, axis.dir[1] / 2, axis.dir[2] / 2]}>
            <boxGeometry args={[
              axis.dir[0] ? 3 : 0.01,
              axis.dir[1] ? 2 : 0.01,
              axis.dir[2] ? 3 : 0.01,
            ]} />
            <meshStandardMaterial
              color={axis.color}
              emissive={axis.color}
              emissiveIntensity={0.2}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* Feature space points */}
      {points.map((point) => {
        const groupColor = new Color(GROUP_COLORS[point.group] || labColor);
        return (
          <group key={point.id} position={point.featurePos}>
            {/* Point sphere */}
            <mesh castShadow>
              <sphereGeometry args={[point.size === 'small' ? 0.08 : 0.12, 8, 8]} />
              <meshStandardMaterial
                color={point.color}
                emissive={groupColor}
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Group halo */}
            <mesh>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial
                color={groupColor}
                transparent
                opacity={0.1}
                wireframe
              />
            </mesh>
          </group>
        );
      })}

      {/* Cluster boundaries — connect items in same group */}
      {Array.from(new Set(points.map((p) => p.group))).map((groupId) => {
        const groupPoints = points.filter((p) => p.group === groupId);
        if (groupPoints.length < 2) return null;
        const color = new Color(GROUP_COLORS[groupId] || labColor);

        // Draw lines between adjacent group members
        return groupPoints.slice(1).map((point, i) => {
          const prev = groupPoints[i];
          const dx = point.featurePos[0] - prev.featurePos[0];
          const dy = point.featurePos[1] - prev.featurePos[1];
          const dz = point.featurePos[2] - prev.featurePos[2];
          const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (length < 0.01) return null;

          const midX = (point.featurePos[0] + prev.featurePos[0]) / 2;
          const midY = (point.featurePos[1] + prev.featurePos[1]) / 2;
          const midZ = (point.featurePos[2] + prev.featurePos[2]) / 2;

          return (
            <mesh key={`${groupId}-${i}`} position={[midX, midY, midZ]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.0}
                transparent
                opacity={0.5}
              />
            </mesh>
          );
        });
      })}

      {/* Criterion highlight label */}
      <pointLight position={[0, 2, 0]} intensity={0.3} color={labColor} distance={5} />
    </group>
  );
}
