'use client';

// ════════════════════════════════════════════════════
// TrophyShelf3D — 3D Trophy Shelf Display
// ════════════════════════════════════════════════════
// Enhancement 1.2: Cockpit personalization — physical 3D shelves
// displaying badge models the child has earned, organized by lab.
//
// Features:
//   - 10 lab sections with accent-colored shelf panels
//   - 5 badge tiers with unique 3D geometries
//   - Rare/epic/legendary badges have particle auras
//   - Hover reveals badge name via drei Text
//   - Smooth entrance animation (staggered shelf slide-in)
//   - LOD-aware: ~3,000 triangle budget (tier: 'system')
//
// Used in: SpatialDashboard.tsx (command bridge scene)

import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';
import { useDeviceStore } from '@/stores/deviceStore';

// ■■ Types ■■

type BadgeTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface BadgeData {
  id: string;
  name: string;
  tier: BadgeTier;
  labId: number;
  earnedAt?: string;
}

interface TrophyShelf3DProps {
  badges: BadgeData[];
  isOpen: boolean;
  position?: [number, number, number];
}

// ■■ Constants ■■

/** Frost-Prismatic lab accent colors (L1–L10) */
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF',
  2: '#AA66FF',
  3: '#FF66AA',
  4: '#FFAA44',
  5: '#00FF88',
  6: '#FF6644',
  7: '#06B6D4',
  8: '#818CF8',
  9: '#10B981',
  10: '#D946EF',
};

/** Shelf layout — each lab row is a horizontal shelf */
const SHELF_WIDTH = 2.8;
const SHELF_HEIGHT = 0.04;
const SHELF_DEPTH = 0.28;
const SHELF_SPACING_Y = 0.36;
const BADGE_SPACING_X = 0.3;
const MAX_BADGES_PER_ROW = 8;
const SHELF_ENTRANCE_STAGGER = 0.06; // seconds per row

/** Badge tier visual config */
const TIER_CONFIG: Record<BadgeTier, {
  scale: number;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  rotationSpeed: number;
  hasAura: boolean;
  auraParticles: number;
  color: string;
}> = {
  common: {
    scale: 0.06,
    emissiveIntensity: 0,
    metalness: 0.4,
    roughness: 0.5,
    rotationSpeed: 0,
    hasAura: false,
    auraParticles: 0,
    color: '#8899AA',
  },
  uncommon: {
    scale: 0.07,
    emissiveIntensity: 0.05,
    metalness: 0.6,
    roughness: 0.3,
    rotationSpeed: 0.3,
    hasAura: false,
    auraParticles: 0,
    color: '#44DDAA',
  },
  rare: {
    scale: 0.08,
    emissiveIntensity: 0.15,
    metalness: 0.7,
    roughness: 0.2,
    rotationSpeed: 0.5,
    hasAura: true,
    auraParticles: 3,
    color: '#00BBFF',
  },
  epic: {
    scale: 0.09,
    emissiveIntensity: 0.25,
    metalness: 0.85,
    roughness: 0.15,
    rotationSpeed: 0.7,
    hasAura: true,
    auraParticles: 4,
    color: '#AA66FF',
  },
  legendary: {
    scale: 0.1,
    emissiveIntensity: 0.4,
    metalness: 0.95,
    roughness: 0.1,
    rotationSpeed: 1.0,
    hasAura: true,
    auraParticles: 5,
    color: '#FFD700',
  },
};

// ■■ Helper: group badges by lab ■■

function groupBadgesByLab(badges: BadgeData[]): Map<number, BadgeData[]> {
  const map = new Map<number, BadgeData[]>();
  for (let labId = 1; labId <= 10; labId++) {
    map.set(labId, []);
  }
  for (const badge of badges) {
    const labBadges = map.get(badge.labId);
    if (labBadges) {
      labBadges.push(badge);
    }
  }
  return map;
}

// ■■ Sub-component: Single Badge Trophy ■■

interface BadgeTrophyProps {
  badge: BadgeData;
  position: [number, number, number];
  labColor: string;
  segments: number;
  enableEffects: boolean;
  enableAnimations: boolean;
  isHovered: boolean;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

function BadgeTrophy({
  badge,
  position,
  labColor,
  segments,
  enableEffects,
  enableAnimations,
  isHovered,
  onPointerEnter,
  onPointerLeave,
}: BadgeTrophyProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const auraGroupRef = useRef<THREE.Group>(null);
  const config = TIER_CONFIG[badge.tier];

  // Rotation + aura orbit animation
  useFrame((state, delta) => {
    if (!enableAnimations) return;

    // Badge rotation
    if (meshRef.current && config.rotationSpeed > 0) {
      meshRef.current.rotation.y += delta * config.rotationSpeed;
    }

    // Aura particle orbit
    if (auraGroupRef.current && config.hasAura) {
      auraGroupRef.current.rotation.y += delta * 1.5;
      auraGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  // Pulsing scale for legendary
  const legendaryRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!enableAnimations || badge.tier !== 'legendary' || !legendaryRef.current) return;
    const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2.0) * 0.08;
    legendaryRef.current.scale.setScalar(pulse);
  });

  const badgeColor = useMemo(() => new THREE.Color(labColor), [labColor]);
  const emissiveColor = useMemo(() => new THREE.Color(config.color), [config.color]);
  const hoverScale = isHovered ? 1.3 : 1.0;

  // Clamp segments for budget compliance
  const seg = Math.min(segments, 8);

  const geometry = useMemo(() => {
    switch (badge.tier) {
      case 'common':
        return <sphereGeometry args={[config.scale, seg, seg]} />;
      case 'uncommon':
        return <octahedronGeometry args={[config.scale, 0]} />;
      case 'rare':
        return <dodecahedronGeometry args={[config.scale, 0]} />;
      case 'epic':
        return <torusKnotGeometry args={[config.scale * 0.7, config.scale * 0.25, 32, seg]} />;
      case 'legendary':
        return <icosahedronGeometry args={[config.scale, 1]} />;
      default:
        return <sphereGeometry args={[config.scale, seg, seg]} />;
    }
  }, [badge.tier, config.scale, seg]);

  return (
    <group position={position} scale={hoverScale}>
      {/* Legendary wrapper for pulse */}
      <group ref={badge.tier === 'legendary' ? legendaryRef : undefined}>
        {/* Main badge mesh */}
        <mesh
          ref={meshRef}
          castShadow={enableEffects}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          {geometry}
          <meshStandardMaterial
            color={badgeColor}
            metalness={config.metalness}
            roughness={config.roughness}
            emissive={emissiveColor}
            emissiveIntensity={config.emissiveIntensity}
          />
        </mesh>

        {/* Legendary wireframe overlay */}
        {badge.tier === 'legendary' && (
          <mesh>
            <icosahedronGeometry args={[config.scale * 1.2, 1]} />
            <meshStandardMaterial
              color={emissiveColor}
              wireframe
              transparent
              opacity={0.4}
              emissive={emissiveColor}
              emissiveIntensity={0.6}
            />
          </mesh>
        )}

        {/* Epic glow ring */}
        {badge.tier === 'epic' && enableEffects && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[config.scale * 1.4, 0.008, 6, 16]} />
            <meshStandardMaterial
              color={emissiveColor}
              emissive={emissiveColor}
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>
        )}

        {/* Particle aura for rare/epic/legendary */}
        {config.hasAura && enableEffects && (
          <group ref={auraGroupRef}>
            {Array.from({ length: config.auraParticles }, (_, i) => {
              const angle = (i / config.auraParticles) * Math.PI * 2;
              const radius = config.scale * 2.0;
              return (
                <mesh
                  key={i}
                  position={[
                    Math.cos(angle) * radius,
                    Math.sin(angle * 1.5) * radius * 0.3,
                    Math.sin(angle) * radius,
                  ]}
                >
                  <sphereGeometry args={[0.012, 4, 4]} />
                  <meshStandardMaterial
                    color={emissiveColor}
                    emissive={emissiveColor}
                    emissiveIntensity={1.0}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              );
            })}
          </group>
        )}
      </group>

      {/* Hover label */}
      {isHovered && (
        <Text
          position={[0, config.scale + 0.08, 0]}
          fontSize={0.06}
          color="#FFFFFF"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.003}
          outlineColor="#000000"
          font="/fonts/Exo2-SemiBold.woff"
        >
          {badge.name}
        </Text>
      )}
    </group>
  );
}

// ■■ Sub-component: Empty Slot Outline ■■

interface EmptySlotProps {
  position: [number, number, number];
  labColor: string;
}

function EmptySlot({ position, labColor }: EmptySlotProps) {
  const color = useMemo(() => new THREE.Color(labColor).multiplyScalar(0.2), [labColor]);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 4, 4]} />
      <meshStandardMaterial
        color={color}
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

// ■■ Sub-component: Single Lab Shelf Row ■■

interface LabShelfRowProps {
  labId: number;
  badges: BadgeData[];
  yOffset: number;
  entranceProgress: number;
  segments: number;
  enableEffects: boolean;
  enableAnimations: boolean;
  hoveredBadgeId: string | null;
  onBadgeHover: (id: string | null) => void;
}

function LabShelfRow({
  labId,
  badges,
  yOffset,
  entranceProgress,
  segments,
  enableEffects,
  enableAnimations,
  hoveredBadgeId,
  onBadgeHover,
}: LabShelfRowProps) {
  const labColor = LAB_COLORS[labId] || '#00BBFF';
  const labColorObj = useMemo(() => new THREE.Color(labColor), [labColor]);
  const dimLabColor = useMemo(() => new THREE.Color(labColor).multiplyScalar(0.15), [labColor]);

  // Slide in from the right with stagger
  const slideX = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, entranceProgress));
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - clamped, 3);
    return THREE.MathUtils.lerp(3.0, 0, eased);
  }, [entranceProgress]);

  const opacity = useMemo(() => {
    return Math.max(0, Math.min(1, entranceProgress));
  }, [entranceProgress]);

  // Calculate badge positions (centered horizontally)
  const totalSlots = Math.max(badges.length, 3); // Minimum 3 slots shown
  const startX = -(totalSlots - 1) * BADGE_SPACING_X * 0.5;

  return (
    <group position={[slideX, yOffset, 0]}>
      {/* Glass shelf panel */}
      <RoundedBox
        args={[SHELF_WIDTH, SHELF_HEIGHT, SHELF_DEPTH]}
        radius={0.01}
        smoothness={2}
        receiveShadow
      >
        <meshPhysicalMaterial
          color={dimLabColor}
          metalness={0.1}
          roughness={0.1}
          transparent
          opacity={opacity * 0.35}
          transmission={0.6}
          thickness={0.02}
        />
      </RoundedBox>

      {/* Lab color accent strip along front edge */}
      <mesh position={[0, SHELF_HEIGHT * 0.5 + 0.003, SHELF_DEPTH * 0.5]}>
        <boxGeometry args={[SHELF_WIDTH - 0.04, 0.006, 0.006]} />
        <meshStandardMaterial
          color={labColorObj}
          emissive={labColorObj}
          emissiveIntensity={0.5}
          transparent
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Lab label */}
      <Text
        position={[-(SHELF_WIDTH * 0.5) - 0.08, 0.02, 0]}
        fontSize={0.05}
        color={labColor}
        anchorX="right"
        anchorY="middle"
        font="/fonts/Orbitron-Medium.woff"
      >
        {`L${labId}`}
      </Text>

      {/* Badge trophies on the shelf */}
      {badges.slice(0, MAX_BADGES_PER_ROW).map((badge, i) => (
        <BadgeTrophy
          key={badge.id}
          badge={badge}
          position={[startX + i * BADGE_SPACING_X, SHELF_HEIGHT * 0.5 + 0.06, 0]}
          labColor={labColor}
          segments={segments}
          enableEffects={enableEffects}
          enableAnimations={enableAnimations}
          isHovered={hoveredBadgeId === badge.id}
          onPointerEnter={() => onBadgeHover(badge.id)}
          onPointerLeave={() => onBadgeHover(null)}
        />
      ))}

      {/* Empty slots for remaining capacity */}
      {Array.from({ length: Math.max(0, totalSlots - badges.length) }, (_, i) => (
        <EmptySlot
          key={`empty-${labId}-${i}`}
          position={[startX + (badges.length + i) * BADGE_SPACING_X, SHELF_HEIGHT * 0.5 + 0.06, 0]}
          labColor={labColor}
        />
      ))}
    </group>
  );
}

// ■■ Main Component: TrophyShelf3D ■■

export function TrophyShelf3D({
  badges,
  isOpen,
  position = [0, 0, 0],
}: TrophyShelf3DProps) {
  const lod = useLOD({ tier: 'system' });
  const _profile = useDeviceStore((s) => s.profile);

  const [hoveredBadgeId, setHoveredBadgeId] = useState<string | null>(null);
  const entranceRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  // Group badges by lab
  const badgesByLab = useMemo(() => groupBadgesByLab(badges), [badges]);

  // Entrance animation — driven by useFrame for smooth interpolation
  useFrame((_, delta) => {
    const target = isOpen ? 1.0 : 0.0;
    entranceRef.current = THREE.MathUtils.lerp(
      entranceRef.current,
      target,
      delta * 3.0
    );

    // Scale the whole shelf group for open/close
    if (groupRef.current) {
      const scale = THREE.MathUtils.lerp(0.01, 1.0, Math.max(0, entranceRef.current));
      groupRef.current.scale.setScalar(scale);
      groupRef.current.visible = entranceRef.current > 0.01;
    }
  });

  // Staggered per-row entrance progress — each row arrives slightly later
  const rowEntranceProgress = useCallback(
    (rowIndex: number): number => {
      const staggerDelay = rowIndex * SHELF_ENTRANCE_STAGGER;
      // Map overall entrance to per-row, accounting for stagger
      const rowProgress = (entranceRef.current - staggerDelay * 2) / (1 - staggerDelay * 2);
      return Math.max(0, Math.min(1, rowProgress));
    },
    [] // entranceRef is a ref, stable across renders
  );

  const handleBadgeHover = useCallback((id: string | null) => {
    setHoveredBadgeId(id);
  }, []);

  // Calculate total shelf height to center vertically
  const totalHeight = 10 * SHELF_SPACING_Y;
  const startY = totalHeight * 0.5;

  return (
    <group ref={groupRef} position={position}>
      {/* Chrome frame — vertical side rails */}
      <mesh position={[-(SHELF_WIDTH * 0.5) - 0.14, 0, 0]}>
        <boxGeometry args={[0.03, totalHeight + 0.2, 0.03]} />
        <meshStandardMaterial
          color="#222233"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[SHELF_WIDTH * 0.5 + 0.04, 0, 0]}>
        <boxGeometry args={[0.03, totalHeight + 0.2, 0.03]} />
        <meshStandardMaterial
          color="#222233"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Chrome frame — top/bottom rails */}
      <mesh position={[0, startY + 0.1, 0]}>
        <boxGeometry args={[SHELF_WIDTH + 0.36, 0.025, 0.04]} />
        <meshStandardMaterial
          color="#2A2A3A"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, -startY - 0.1, 0]}>
        <boxGeometry args={[SHELF_WIDTH + 0.36, 0.025, 0.04]} />
        <meshStandardMaterial
          color="#2A2A3A"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Title text */}
      <Text
        position={[0, startY + 0.2, 0]}
        fontSize={0.08}
        color="#00BBFF"
        anchorX="center"
        anchorY="bottom"
        font="/fonts/Exo2-Bold.woff"
      >
        TROPHY SHELF
      </Text>

      {/* Lab shelf rows */}
      {Array.from({ length: 10 }, (_, i) => {
        const labId = i + 1;
        const labBadges = badgesByLab.get(labId) || [];
        const yPos = startY - i * SHELF_SPACING_Y;

        return (
          <LabShelfRow
            key={labId}
            labId={labId}
            badges={labBadges}
            yOffset={yPos}
            entranceProgress={rowEntranceProgress(i)}
            segments={lod.segments}
            enableEffects={lod.enableEffects}
            enableAnimations={lod.enableAnimations}
            hoveredBadgeId={hoveredBadgeId}
            onBadgeHover={handleBadgeHover}
          />
        );
      })}

      {/* Hovered badge Float wrapper — selected trophy gets gentle bob */}
      {hoveredBadgeId && (
        <Float
          speed={2.0}
          rotationIntensity={0.1}
          floatIntensity={0.15}
          floatingRange={[-0.005, 0.005]}
        >
          {/* Float is applied via the isHovered prop scaling in BadgeTrophy */}
          <group />
        </Float>
      )}
    </group>
  );
}
