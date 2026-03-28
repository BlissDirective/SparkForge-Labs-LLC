// ================================================================
// SORT SCENE 3D — Lab 2 (Teaching AI)
// 3D throwable primitives with parabolic arcs for Sort Toy Box.
// Decision 6.3: Full 3D throwing. ~2K triangles.
// Fixed overhead camera. ContactShadows. No physics engine.
// Mobile fallback: parent renders 2D CSS shapes instead.
// ================================================================

'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { ContactShadows, OrthographicCamera } from '@react-three/drei';
import { Group, MathUtils, Vector3 } from 'three';
import SortToyBoxEnvironment from './environments/SortToyBoxEnvironment';

// ■■■ Types ■■■

interface SortItem {
  id: string;
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus';
  color: string;
  colorName: string;
  size: 'small' | 'large';
  group: number | null;
  position: [number, number, number];
}

interface Bin {
  id: number;
  position: [number, number, number];
  color: string;
  label: string;
}

interface SortScene3DProps {
  items: SortItem[];
  bins: Bin[];
  onItemDrop: (itemId: string, binId: number) => void;
  onItemMiss: (itemId: string) => void;
  activeItemId: string | null;
  onSelectItem: (id: string | null) => void;
}

// ■■■ Parabolic Arc Helper ■■■
// Parametric arc from start to end with peak height
function getArcPosition(
  start: Vector3,
  end: Vector3,
  t: number,
  peakHeight: number = 2.5
): Vector3 {
  const x = MathUtils.lerp(start.x, end.x, t);
  const z = MathUtils.lerp(start.z, end.z, t);
  // Parabolic y = peak * 4t(1-t) + lerp(startY, endY, t)
  const baseY = MathUtils.lerp(start.y, end.y, t);
  const arcY = peakHeight * 4 * t * (1 - t);
  return new Vector3(x, baseY + arcY, z);
}

// ■■■ Shape Mesh Component ■■■
function ShapeMesh({
  shape,
  color,
  size,
  isSelected,
}: {
  shape: SortItem['shape'];
  color: string;
  size: SortItem['size'];
  isSelected: boolean;
}) {
  const scale = size === 'small' ? 0.3 : 0.5;
  const emissiveIntensity = isSelected ? 0.4 : 0;

  const geometry = useMemo(() => {
    switch (shape) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 16, 16]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.4, 0.4, 1, 16]} />;
      case 'cone':
        return <coneGeometry args={[0.5, 1, 16]} />;
      case 'torus':
        return <torusGeometry args={[0.35, 0.15, 12, 24]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [shape]);

  return (
    <mesh scale={scale} castShadow>
      {geometry}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// ■■■ Throwable Item ■■■
function ThrowableItem({
  item,
  isSelected,
  isFlying,
  flyTarget,
  onSelect,
  onLanded,
}: {
  item: SortItem;
  isSelected: boolean;
  isFlying: boolean;
  flyTarget: Vector3 | null;
  onSelect: () => void;
  onLanded: (correct: boolean) => void;
}) {
  const meshRef = useRef<Group>(null);
  const flyProgress = useRef(0);
  const startPos = useRef(new Vector3(...item.position));
  const rotSpeed = useRef(
    new Vector3(
      Math.random() * 8 - 4,
      Math.random() * 8 - 4,
      Math.random() * 4 - 2
    )
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isFlying && flyTarget) {
      flyProgress.current += delta * 1.8; // ~0.55s flight
      const t = Math.min(flyProgress.current, 1);
      const pos = getArcPosition(startPos.current, flyTarget, t, 2.0);
      meshRef.current.position.copy(pos);

      // Tumble rotation during flight
      meshRef.current.rotation.x += rotSpeed.current.x * delta;
      meshRef.current.rotation.y += rotSpeed.current.y * delta;
      meshRef.current.rotation.z += rotSpeed.current.z * delta;

      if (t >= 1) {
        onLanded(true);
      }
    } else if (isSelected) {
      // Gentle hover bob when selected
      meshRef.current.position.y =
        item.position[1] + Math.sin(Date.now() * 0.005) * 0.1 + 0.2;
    } else {
      meshRef.current.position.set(...item.position);
    }
  });

  // P3: Hover state
  const [hovered, setHovered] = useState(false);

  return (
    <group
      ref={meshRef}
      position={item.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!isFlying) onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <ShapeMesh
        shape={item.shape}
        color={item.color}
        size={item.size}
        isSelected={isSelected || hovered}
      />
      {/* Selection ring */}
      {isSelected && !isFlying && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[0.4, 0.5, 24]} />
          <meshBasicMaterial
            color={item.color}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■■ Bin Component ■■■
function SortBin({
  bin,
  isHighlighted,
  onClick,
}: {
  bin: Bin;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<Group>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    // Pulse when highlighted (item selected)
    const s = isHighlighted ? 1 + Math.sin(Date.now() * 0.004) * 0.03 : 1;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <group ref={meshRef} position={bin.position} onClick={onClick}>
      {/* Open-top box: 4 walls + bottom */}
      {/* Bottom */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.08, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Front wall */}
      <mesh position={[0, 0.35, 0.56]}>
        <boxGeometry args={[1.2, 0.7, 0.08]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.35, -0.56]}>
        <boxGeometry args={[1.2, 0.7, 0.08]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Left wall */}
      <mesh position={[-0.56, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.7, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Right wall */}
      <mesh position={[0.56, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.7, 1.2]} />
        <meshStandardMaterial
          color={bin.color}
          transparent
          opacity={isHighlighted ? 0.6 : 0.3}
        />
      </mesh>
      {/* Glow edge on highlight */}
      {isHighlighted && (
        <mesh position={[0, 0.02, 0]}>
          <ringGeometry args={[0.7, 0.85, 4]} />
          <meshBasicMaterial
            color={bin.color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// ■■■ Table Surface ■■■
function TableSurface() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      receiveShadow
    >
      <planeGeometry args={[8, 6]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

// ■■■ P3: Landing Particle Burst ■■■
function LandingBurst({ position, color }: { position: [number, number, number]; color: string }) {
  const groupRef = useRef<Group>(null);
  const particleCount = 8;
  const velocities = useRef(
    Array.from({ length: particleCount }, () => new Vector3(
      (Math.random() - 0.5) * 3,
      Math.random() * 2 + 1,
      (Math.random() - 0.5) * 3
    ))
  );
  const lifeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    lifeRef.current += delta;
    if (lifeRef.current > 0.6) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.children.forEach((child, i) => {
      const vel = velocities.current[i];
      child.position.x += vel.x * delta;
      child.position.y += vel.y * delta - 4 * delta * lifeRef.current;
      child.position.z += vel.z * delta;
      const s = Math.max(0, 1 - lifeRef.current * 2);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: particleCount }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
}

// ■■■ Main Scene ■■■
function Scene({
  items,
  bins,
  onItemDrop,
  activeItemId,
  onSelectItem,
}: SortScene3DProps) {
  const [flyingItems, setFlyingItems] = useState<
    Map<string, { target: Vector3; binId: number }>
  >(new Map());
  // P3: Landing particle bursts
  const [bursts, setBursts] = useState<{ id: number; position: [number, number, number]; color: string }[]>([]);
  const burstIdRef = useRef(0);

  const handleBinClick = useCallback(
    (binId: number) => {
      if (!activeItemId) return;

      const item = items.find((i) => i.id === activeItemId);
      if (!item) return;

      const bin = bins.find((b) => b.id === binId);
      if (!bin) return;

      // Start flying animation
      setFlyingItems((prev) => {
        const next = new Map(prev);
        next.set(activeItemId, {
          target: new Vector3(...bin.position),
          binId,
        });
        return next;
      });

      onSelectItem(null);
    },
    [activeItemId, items, bins, onSelectItem]
  );

  const handleLanded = useCallback(
    (itemId: string) => {
      setFlyingItems((prev) => {
        const next = new Map(prev);
        const data = next.get(itemId);
        next.delete(itemId);
        if (data) {
          onItemDrop(itemId, data.binId);
          // P3: Trigger landing particle burst
          const item = items.find((i) => i.id === itemId);
          const bin = bins.find((b) => b.id === data.binId);
          if (bin) {
            const id = burstIdRef.current++;
            setBursts((prev) => [...prev, {
              id,
              position: bin.position,
              color: item?.color || bin.color,
            }]);
            setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 700);
          }
        }
        return next;
      });
    },
    [onItemDrop, items, bins]
  );

  return (
    <>
      {/* Camera: fixed overhead angle */}
      <OrthographicCamera
        makeDefault
        position={[0, 8, 4]}
        zoom={80}
        near={0.1}
        far={50}
      />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 5, -3]} intensity={0.3} color="#AA66FF" />

      <TableSurface />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      {/* Items */}
      {items
        .filter((item) => item.group === null)
        .map((item) => {
          const flyData = flyingItems.get(item.id);
          return (
            <ThrowableItem
              key={item.id}
              item={item}
              isSelected={activeItemId === item.id}
              isFlying={!!flyData}
              flyTarget={flyData?.target ?? null}
              onSelect={() => onSelectItem(item.id)}
              onLanded={() => handleLanded(item.id)}
            />
          );
        })}

      {/* Bins */}
      {bins.map((bin) => (
        <SortBin
          key={bin.id}
          bin={bin}
          isHighlighted={activeItemId !== null}
          onClick={() => handleBinClick(bin.id)}
        />
      ))}

      {/* P3: Landing particle bursts */}
      {bursts.map((burst) => (
        <LandingBurst key={burst.id} position={burst.position} color={burst.color} />
      ))}
    </>
  );
}

// ■■■ Exported Group (D3D-B1 compliant) ■■■
// S6-CRIT-002: Refactored from standalone Canvas to <group>.
// OrthographicCamera stays — game-specific overhead view for sorting.
// 3D Embedding: SortToyBoxEnvironment wired in (was orphaned — S6-HIGH-004 fix)
export function SortScene3D(props: SortScene3DProps) {
  return (
    <group>
      <SortToyBoxEnvironment />
      <Scene {...props} />
    </group>
  );
}

export default SortScene3D;
