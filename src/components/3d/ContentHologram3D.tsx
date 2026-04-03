'use client';

// ════════════════════════════════════════════════════
// CONTENT HOLOGRAM 3D — Phase 6: Floating content display in cockpit
// Shows daily challenge, trending topics, recommendations
// Positioned near InteractiveConsole3D area
// ════════════════════════════════════════════════════

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useCockpitContentBridge } from '@/hooks/useCockpitContentBridge';

interface ContentHologram3DProps {
  position?: [number, number, number];
  visible?: boolean;
}

export default function ContentHologram3D({
  position = [0, 1.5, -2.5],
  visible = true,
}: ContentHologram3DProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const { dailyChallenge, trendingTopics, recommendation, npcTip: _npcTip } = useCockpitContentBridge();

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.3;
    }
  });

  if (!visible) return null;

  const hasContent = dailyChallenge || trendingTopics.length > 0 || recommendation;

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.3}>
        {/* Holographic ring frame */}
        <mesh ref={ringRef}>
          <torusGeometry args={[0.8, 0.015, 8, 64]} />
          <meshStandardMaterial
            color="#00BBFF"
            emissive="#00BBFF"
            emissiveIntensity={1.5}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Inner glow plane */}
        <mesh rotation={[0, 0, 0]}>
          <circleGeometry args={[0.75, 32]} />
          <meshStandardMaterial
            color="#00BBFF"
            transparent
            opacity={0.03}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Content overlay via Html */}
        {hasContent && (
          <Html
            center
            distanceFactor={5}
            style={{ pointerEvents: 'none', width: '220px' }}
          >
            <div className="text-center space-y-2">
              {/* Daily Challenge */}
              {dailyChallenge && (
                <div className="px-2 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20">
                  <p className="text-[9px] text-amber-400/60 font-data uppercase tracking-wider">
                    Daily Challenge
                  </p>
                  <p className="text-[11px] text-white/80 font-body truncate">
                    {dailyChallenge.title}
                  </p>
                  <p className="text-[9px] text-amber-400/80 font-data">
                    +{dailyChallenge.xp_reward} XP
                  </p>
                </div>
              )}

              {/* Trending */}
              {trendingTopics.length > 0 && (
                <div className="px-2 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                  <p className="text-[9px] text-cyan-400/60 font-data uppercase tracking-wider">
                    Trending
                  </p>
                  <p className="text-[11px] text-white/80 font-body truncate">
                    {trendingTopics[0].title}
                  </p>
                </div>
              )}

              {/* Recommendation */}
              {recommendation && (
                <div className="px-2 py-1 rounded-lg bg-green-400/10 border border-green-400/20">
                  <p className="text-[9px] text-green-400/60 font-data uppercase tracking-wider">
                    Recommended
                  </p>
                  <p className="text-[10px] text-white/60 font-body">
                    {recommendation.reason}
                  </p>
                </div>
              )}
            </div>
          </Html>
        )}

        {/* Accent particles around the ring */}
        <pointLight color="#00BBFF" intensity={0.5} distance={3} />
      </Float>
    </group>
  );
}
