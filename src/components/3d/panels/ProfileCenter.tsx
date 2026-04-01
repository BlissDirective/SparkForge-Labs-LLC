'use client';

// ════════════════════════════════════════════════════════════════
// ProfileCenter — Profile Page Center Content
// ════════════════════════════════════════════════════════════════
// Per SparkForge-Full-ControlScreen.json §center_console["/profile"]:
//   - Trophy room (BadgePedestal3D array with 9 badge categories)
//   - Expanded avatar preview with cosmetic selector ring
//
// Shows earned badges as glowing metallic pedestals, locked ones dim.

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useChildStore } from '@/stores/childStore';

const BADGE_CATEGORIES = [
  'progress', 'streak', 'lab', 'game_master', 'knowledge',
  'explorer', 'creator', 'secret', 'prestige',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  progress: '#00BBFF', streak: '#FF6644', lab: '#AA66FF',
  game_master: '#FFAA44', knowledge: '#00FF88', explorer: '#06B6D4',
  creator: '#FF66AA', secret: '#818CF8', prestige: '#D946EF',
};

export default function ProfileCenter() {
  const child = useChildStore((s) => s.activeChild);
  const badges = useChildStore((s) => s.badges);

  const displayName = child?.display_name ?? 'Explorer';
  const level = child?.level ?? 1;
  const xp = child?.xp ?? 0;

  const earnedCount = badges?.length ?? 0;

  return (
    <group name="profile-center">
      {/* ═══ Avatar (expanded) ═══ */}
      <group position={[0, 0.6, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.18, 48, 48]} />
          <meshStandardMaterial
            color="#1a1e2e"
            metalness={0.6}
            roughness={0.4}
            emissive="#AA66FF"
            emissiveIntensity={0.4}
          />
        </mesh>
        <Text
          position={[0, -0.25, 0]}
          fontSize={0.04}
          color="#F0F0F4"
          anchorX="center"
          font="/fonts/Exo2-Bold.woff2"
        >
          {displayName}
        </Text>
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.022}
          color="#AA66FF"
          anchorX="center"
          font="/fonts/Orbitron-Bold.woff2"
        >
          {`Level ${level}  ·  ${xp.toLocaleString()} XP  ·  ${earnedCount} Badges`}
        </Text>
      </group>

      {/* ═══ Trophy Room — Badge Category Pedestals ═══ */}
      <group position={[-0.4, -0.15, 0.2]}>
        <Text
          position={[0.4, 0.15, 0]}
          fontSize={0.025}
          color="#F0F0F460"
          anchorX="center"
          font="/fonts/Sora-Regular.woff2"
        >
          TROPHY ROOM
        </Text>

        {BADGE_CATEGORIES.map((cat, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const color = CATEGORY_COLORS[cat] ?? '#00BBFF';

          return (
            <group key={cat} position={[col * 0.28, -row * 0.18, 0]}>
              {/* Pedestal */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.025, 8]} />
                <meshStandardMaterial
                  color="#a8b5c8"
                  metalness={0.95}
                  roughness={0.1}
                  emissive={color}
                  emissiveIntensity={0.3}
                />
              </mesh>
              {/* Badge sphere */}
              <mesh position={[0, 0.03, 0]}>
                <icosahedronGeometry args={[0.025, 1]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={0.6}
                  metalness={0.7}
                  roughness={0.3}
                />
              </mesh>
              <Text
                position={[0, -0.05, 0]}
                fontSize={0.014}
                color="#F0F0F460"
                anchorX="center"
                font="/fonts/Sora-Regular.woff2"
              >
                {cat.replace('_', ' ')}
              </Text>
            </group>
          );
        })}
      </group>
    </group>
  );
}
