'use client';

// ================================================================
// SparkForge PromptBubble3D -- 3D Thought Bubble System
// ================================================================
// Decision 6.2.3: Keywords from child's prompt materialize as 3D
// glass bubbles. Drift with spring physics, pop when AI response
// appears. MeshPhysicalMaterial clearcoat for glass effect.
//
// Architecture:
// - R3F Canvas rendered inside PromptLabGame sandbox phase
// - Keywords extracted from prompt text on send
// - Bubbles spawn with spring physics (attract/repel)
// - Pop animation when AI response arrives
// - Max 12 bubbles (FIFO replacement)
// - Desktop only -- mobile gets CSS fallback
//
// Performance: ~2K triangles for 12 bubbles. frameloop='demand'.
// ================================================================

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  SpriteMaterial,
  Vector3,
} from 'three';

// -- Types --

interface Bubble {
  id: string;
  keyword: string;
  position: Vector3;
  velocity: Vector3;
  radius: number;
  color: string;
  opacity: number;
  scale: number;
  age: number;
  merging: boolean;
  popping: boolean;
}

interface PromptBubble3DProps {
  keywords: string[];
  isThinking: boolean;
  temperature: number;
  onBubblesReady?: () => void;
}

// -- Constants --

const MAX_BUBBLES = 12;
const BUBBLE_RADIUS = 0.18;
const SPAWN_RADIUS = 1.2;
const SPRING_STRENGTH = 0.008;
const REPEL_STRENGTH = 0.015;
const DAMPING = 0.94;
const BUBBLE_LIFETIME = 15; // seconds before fade

// -- Amber/Lab4 palette for bubbles --

const BUBBLE_COLORS = [
  '#F59E0B', '#FBBF24', '#D97706', '#FCD34D',
  '#F97316', '#FB923C', '#FDBA74', '#FDE68A',
  '#EAB308', '#CA8A04', '#A16207', '#854D0E',
];

// -- Keyword extraction (simple NLP-lite) --

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'shall',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so',
  'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
  'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'only', 'own', 'same', 'than', 'too', 'very', 'just', 'about',
  'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who',
  'how', 'when', 'where', 'why', 'if', 'then', 'else', 'also',
  'make', 'tell', 'give', 'get', 'go', 'come', 'take', 'know',
  'see', 'think', 'look', 'want', 'say', 'use', 'find', 'here',
  'thing', 'things', 'like', 'please', 'help', 'write',
]);

export function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const unique = [...new Set(words)];
  return unique.slice(0, MAX_BUBBLES);
}

// -- Single Bubble Mesh --

function BubbleMesh({ bubble }: { bubble: Bubble }) {
  const meshRef = useRef<Mesh>(null);
  const textGroupRef = useRef<Group>(null);
  const { camera } = useThree();

  const material = useMemo(() => {
    return new MeshPhysicalMaterial({
      color: new Color(bubble.color),
      transparent: true,
      opacity: bubble.opacity * 0.6,
      roughness: 0.05,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.7,
      thickness: 0.5,
      ior: 1.5,
      envMapIntensity: 1.2,
      side: DoubleSide,
    });
  }, [bubble.color, bubble.opacity]);

  useFrame(() => {
    if (!meshRef.current) return;

    meshRef.current.position.copy(bubble.position);
    const s = bubble.scale * (bubble.popping ? Math.max(0, 1 - bubble.age * 3) : 1);
    meshRef.current.scale.setScalar(s);

    // Update opacity reactively
    material.opacity = bubble.opacity * 0.6;

    // Billboard text toward camera
    if (textGroupRef.current) {
      textGroupRef.current.position.copy(bubble.position);
      textGroupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[bubble.radius, 24, 24]} />
      </mesh>
      <group ref={textGroupRef}>
        <Text
          fontSize={0.06}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          maxWidth={bubble.radius * 1.6}
          textAlign="center"
          font="/fonts/Exo2-Bold.woff"
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {bubble.keyword}
        </Text>
      </group>
    </group>
  );
}

// -- Main 3D Scene --

export default function PromptBubble3D({
  keywords,
  isThinking,
  temperature,
  onBubblesReady,
}: PromptBubble3DProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const prevKeywordsRef = useRef<string[]>([]);
  const clockRef = useRef(0);
  const hadBubblesRef = useRef(false);

  // Spawn bubbles when new keywords arrive
  useEffect(() => {
    const prevKeys = prevKeywordsRef.current;
    const newKeys = keywords.filter(k => !prevKeys.includes(k));
    prevKeywordsRef.current = keywords;

    if (newKeys.length === 0) return;

    setBubbles(prev => {
      const updated = [...prev];

      for (const keyword of newKeys) {
        const angle = Math.random() * Math.PI * 2;
        const dist = SPAWN_RADIUS * (0.4 + Math.random() * 0.6);
        const pos = new Vector3(
          Math.cos(angle) * dist,
          (Math.random() - 0.5) * 0.6,
          Math.sin(angle) * dist * 0.3 - 0.5
        );

        const colorIdx = Math.floor(Math.random() * BUBBLE_COLORS.length);

        updated.push({
          id: `${keyword}-${Date.now()}-${Math.random()}`,
          keyword,
          position: pos,
          velocity: new Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            0
          ),
          radius: BUBBLE_RADIUS * (0.8 + keyword.length * 0.03),
          color: BUBBLE_COLORS[colorIdx],
          opacity: 1,
          scale: 0, // spawn at 0, animate to 1
          age: 0,
          merging: false,
          popping: false,
        });
      }

      // Enforce max bubbles (FIFO)
      while (updated.length > MAX_BUBBLES) {
        updated.shift();
      }

      return updated;
    });

    onBubblesReady?.();
  }, [keywords, onBubblesReady]);

  // Pop all bubbles when AI response arrives (thinking stops)
  useEffect(() => {
    if (!isThinking && hadBubblesRef.current) {
      hadBubblesRef.current = false;
      const timer = setTimeout(() => {
        setBubbles(prev => prev.map(b => ({ ...b, popping: true })));
        const clearTimer = setTimeout(() => setBubbles([]), 600);
        return () => clearTimeout(clearTimer);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (isThinking) {
      hadBubblesRef.current = true;
    }
  }, [isThinking]);

  // Physics simulation
  useFrame((_, delta) => {
    clockRef.current += delta;

    setBubbles(prev => {
      if (prev.length === 0) return prev;

      return prev.map((bubble, i) => {
        const b = {
          ...bubble,
          position: bubble.position.clone(),
          velocity: bubble.velocity.clone(),
        };

        // Scale-in animation
        if (b.scale < 1 && !b.popping) {
          b.scale = Math.min(1, b.scale + delta * 3);
        }

        // Age
        b.age += delta;

        // Fade old bubbles
        if (b.age > BUBBLE_LIFETIME * 0.7) {
          b.opacity = Math.max(0, 1 - (b.age - BUBBLE_LIFETIME * 0.7) / (BUBBLE_LIFETIME * 0.3));
        }

        // Pop animation
        if (b.popping) {
          b.scale = Math.max(0, b.scale - delta * 4);
          b.opacity = Math.max(0, b.opacity - delta * 3);
          return b;
        }

        // Spring forces: attract to center
        const toCenter = new Vector3(0, 0, -0.3).sub(b.position);
        toCenter.multiplyScalar(SPRING_STRENGTH);
        b.velocity.add(toCenter);

        // Repulsion from other bubbles
        for (let j = 0; j < prev.length; j++) {
          if (i === j) continue;
          const other = prev[j];
          const diff = b.position.clone().sub(other.position);
          const dist = diff.length();
          const minDist = (b.radius + other.radius) * 1.5;

          if (dist < minDist && dist > 0.01) {
            diff.normalize().multiplyScalar(REPEL_STRENGTH * (1 - dist / minDist));
            b.velocity.add(diff);
          }
        }

        // Gentle orbit when thinking
        if (isThinking) {
          const orbitForce = new Vector3(
            -b.position.y * 0.003,
            b.position.x * 0.003,
            0
          );
          b.velocity.add(orbitForce);
        }

        // Temperature affects drift speed
        const tempMultiplier = 0.5 + temperature * 1.5;
        const wobble = new Vector3(
          Math.sin(clockRef.current * 2 + i) * 0.001 * tempMultiplier,
          Math.cos(clockRef.current * 1.5 + i * 0.7) * 0.001 * tempMultiplier,
          0
        );
        b.velocity.add(wobble);

        // Damping
        b.velocity.multiplyScalar(DAMPING);

        // Apply velocity
        b.position.add(b.velocity);

        // Clamp to visible area
        b.position.x = MathUtils.clamp(b.position.x, -2, 2);
        b.position.y = MathUtils.clamp(b.position.y, -1, 1);
        b.position.z = MathUtils.clamp(b.position.z, -1.5, 0);

        return b;
      }).filter(b => b.opacity > 0.01 && b.scale > 0.01);
    });
  });

  // Glow sprite material (shared)
  const glowMaterial = useMemo(() => {
    return new SpriteMaterial({
      color: new Color('#F59E0B'),
      transparent: true,
      opacity: 0.15,
      blending: AdditiveBlending,
    });
  }, []);

  return (
    <group>
      {/* Ambient light for glass material */}
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color="#F59E0B" />
      <pointLight position={[-2, -1, 1]} intensity={0.3} color="#AA66FF" />

      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Render bubbles */}
      {bubbles.map(bubble => (
        <BubbleMesh key={bubble.id} bubble={bubble} />
      ))}

      {/* Glow sprites behind bubbles */}
      {bubbles.map(bubble => (
        <sprite
          key={`glow-${bubble.id}`}
          position={bubble.position.clone()}
          scale={[bubble.radius * 3 * bubble.scale, bubble.radius * 3 * bubble.scale, 1]}
          material={glowMaterial}
        />
      ))}
    </group>
  );
}
