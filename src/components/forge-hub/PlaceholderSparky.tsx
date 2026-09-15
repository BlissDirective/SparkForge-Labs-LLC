'use client';

/**
 * P1 procedural placeholder Sparky (TAP §2.8 interim / spec §3.1).
 * Coral capsule chibi + black joints + face screen + cyan dome.
 * Height 0.40 m. Bob/hop idle. Not the cockpit GuideAvatar.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  DoubleSide,
  MathUtils,
  SRGBColorSpace,
  type Group,
} from 'three';
import { SPARKY_PALETTE } from '@/config/sparkyPalette';
import { SPARKY_HEIGHT_M, SPARKY_SPOTS } from '@/config/sparkySpots';
import { peekDirectorClock } from '@/lib/forge-hub/director/clock';
import {
  dispatchSparkyEvent,
  HOLO_DOME_EMISSIVE,
} from '@/lib/forge-hub/sparkyBehaviour';
import {
  createSparkyFaceCanvas,
  drawSparkyFace,
} from '@/lib/forge-hub/sparkyFace';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import type {
  ForgePanelId,
  ForgeSparkyExpression,
} from '@/lib/forge-hub/types';
import { useForgeStore } from '@/stores/sceneStore';

const LERP_POS = 4.2;
const LERP_YAW = 6;
const LOOK_MAX = (8 * Math.PI) / 180;

function panelLook(panel: ForgePanelId): { x: number; y: number } {
  if (panel === 'holoL') return { x: -0.7, y: 0.15 };
  if (panel === 'holoR') return { x: 0.7, y: 0.15 };
  if (panel === 'holoC') return { x: 0, y: 0.35 };
  return { x: 0, y: 0 };
}

function SparkyFacePlane({
  expression,
  lookX,
  lookY,
}: {
  expression: ForgeSparkyExpression;
  lookX: number;
  lookY: number;
}) {
  const canvas = useMemo(() => createSparkyFaceCanvas(expression), [expression]);
  const texture = useMemo(() => {
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawSparkyFace(ctx, { expression, lookX, lookY });
    texture.needsUpdate = true;
  }, [canvas, expression, lookX, lookY, texture]);

  return (
    <mesh position={[0, 0.002, 0.066]} userData={{ forge: 'sparky-face' }}>
      <planeGeometry args={[0.11, 0.09]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        side={DoubleSide}
      />
    </mesh>
  );
}

function PlaceholderMesh({
  expression,
  domeIntensity,
  sleep,
  whisper,
}: {
  expression: ForgeSparkyExpression;
  domeIntensity: number;
  sleep: boolean;
  whisper: boolean;
}) {
  const headRef = useRef<Group>(null);
  const lookRef = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const head = headRef.current;
    if (!head) return;
    const forge = useForgeStore.getState().forge;
    const panel =
      forge.hoveredPanel ?? forge.activePanel ?? forge.sparky.attendPanel;
    const fromPanel = panelLook(panel);
    const lookX = panel ? fromPanel.x : state.pointer.x * 0.55;
    const lookY = panel ? fromPanel.y : state.pointer.y * 0.35;
    lookRef.current = { x: lookX, y: lookY };
    const tx = MathUtils.clamp(lookX * LOOK_MAX, -LOOK_MAX, LOOK_MAX);
    const ty = MathUtils.clamp(-lookY * LOOK_MAX, -LOOK_MAX, LOOK_MAX);
    head.rotation.y = MathUtils.damp(head.rotation.y, tx, 8, delta);
    head.rotation.x = MathUtils.damp(head.rotation.x, ty, 8, delta);
  });

  const coral = SPARKY_PALETTE.coral;
  const joint = SPARKY_PALETTE.joint;
  const cyan = SPARKY_PALETTE.cyan;
  const bolt = SPARKY_PALETTE.bolt;

  return (
    <group
      rotation={sleep ? [0.55, 0, 0.2] : whisper ? [-0.22, 0, 0] : [0, 0, 0]}
      scale={sleep ? [1, 0.72, 1.05] : [1, 1, 1]}
    >
      {/* Boots */}
      <mesh position={[-0.045, 0.032, 0.012]}>
        <sphereGeometry args={[0.036, 16, 12]} />
        <meshStandardMaterial color={coral} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0.045, 0.032, 0.012]}>
        <sphereGeometry args={[0.036, 16, 12]} />
        <meshStandardMaterial color={coral} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[-0.045, 0.006, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.008, 16]} />
        <meshStandardMaterial
          color={cyan}
          emissive={cyan}
          emissiveIntensity={0.55}
        />
      </mesh>
      <mesh position={[0.045, 0.006, 0.012]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.008, 16]} />
        <meshStandardMaterial
          color={cyan}
          emissive={cyan}
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* Shins + knees */}
      <mesh position={[-0.042, 0.09, 0]}>
        <capsuleGeometry args={[0.022, 0.04, 4, 8]} />
        <meshStandardMaterial color={coral} roughness={0.4} />
      </mesh>
      <mesh position={[0.042, 0.09, 0]}>
        <capsuleGeometry args={[0.022, 0.04, 4, 8]} />
        <meshStandardMaterial color={coral} roughness={0.4} />
      </mesh>
      <mesh position={[-0.042, 0.118, 0]}>
        <sphereGeometry args={[0.02, 12, 10]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>
      <mesh position={[0.042, 0.118, 0]}>
        <sphereGeometry args={[0.02, 12, 10]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>

      {/* Hips + torso */}
      <mesh position={[0, 0.145, 0]}>
        <sphereGeometry args={[0.03, 12, 10]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.205, 0]}>
        <capsuleGeometry args={[0.055, 0.07, 6, 12]} />
        <meshStandardMaterial color={coral} roughness={0.32} metalness={0.12} />
      </mesh>
      {/* Chest badge */}
      <mesh position={[0, 0.215, 0.052]}>
        <circleGeometry args={[0.018, 20]} />
        <meshStandardMaterial
          color={cyan}
          emissive={cyan}
          emissiveIntensity={0.8 + domeIntensity * 0.4}
        />
      </mesh>
      {/* Shoulder bolts */}
      <mesh position={[-0.048, 0.248, 0.03]} rotation={[0.4, 0, -0.4]}>
        <boxGeometry args={[0.018, 0.008, 0.004]} />
        <meshStandardMaterial
          color={bolt}
          emissive={bolt}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0.048, 0.248, 0.03]} rotation={[0.4, 0, 0.4]}>
        <boxGeometry args={[0.018, 0.008, 0.004]} />
        <meshStandardMaterial
          color={bolt}
          emissive={bolt}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.082, 0.235, 0]}>
        <sphereGeometry args={[0.022, 12, 10]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>
      <mesh position={[0.082, 0.235, 0]}>
        <sphereGeometry args={[0.022, 12, 10]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.175, 0.01]} rotation={[0.15, 0, 0.25]}>
        <capsuleGeometry args={[0.018, 0.055, 4, 8]} />
        <meshStandardMaterial color={coral} roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.175, 0.01]} rotation={[0.15, 0, -0.25]}>
        <capsuleGeometry args={[0.018, 0.055, 4, 8]} />
        <meshStandardMaterial color={coral} roughness={0.4} />
      </mesh>

      {/* Neck + head + dome */}
      <mesh position={[0, 0.268, 0]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color={joint} roughness={0.8} />
      </mesh>
      <group ref={headRef} position={[0, 0.318, 0]}>
        <mesh>
          <sphereGeometry args={[0.066, 24, 18]} />
          <meshStandardMaterial
            color={coral}
            roughness={0.28}
            metalness={0.12}
          />
        </mesh>
        <mesh position={[0, 0.002, 0.05]}>
          <planeGeometry args={[0.122, 0.1]} />
          <meshStandardMaterial color={SPARKY_PALETTE.faceBase} roughness={0.45} />
        </mesh>
        <SparkyFacePlane
          expression={expression}
          lookX={lookRef.current.x}
          lookY={lookRef.current.y}
        />
        {/* Ear discs */}
        <mesh position={[-0.068, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
          <meshStandardMaterial
            color={cyan}
            emissive={cyan}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh position={[0.068, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
          <meshStandardMaterial
            color={cyan}
            emissive={cyan}
            emissiveIntensity={0.45}
          />
        </mesh>
        <mesh
          position={[0, 0.055, 0]}
          userData={{ forge: 'sparky-dome' }}
        >
          <sphereGeometry
            args={[0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color={cyan}
            emissive={cyan}
            emissiveIntensity={domeIntensity}
            transparent
            opacity={0.42}
            roughness={0.12}
            metalness={0.05}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <icosahedronGeometry args={[0.012, 0]} />
          <meshBasicMaterial
            color={cyan}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export function PlaceholderSparky() {
  const groupRef = useRef<Group>(null);
  const hopRef = useRef(0);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const flatOverlay = useForgeStore((s) => s.forge.flatOverlay);
  const sparky = useForgeStore((s) => s.forge.sparky);
  const bubble = useForgeStore((s) => s.forge.holoBubble);
  const reducedMotion = useForgeReducedMotion();

  const target = SPARKY_SPOTS[sparky.spot];

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const pose = SPARKY_SPOTS[useForgeStore.getState().forge.sparky.spot];
    const rm = reducedMotion;
    if (rm) {
      group.position.set(pose.position[0], pose.position[1], pose.position[2]);
      group.rotation.y = pose.yaw;
    } else {
      group.position.x = MathUtils.damp(
        group.position.x,
        pose.position[0],
        LERP_POS,
        delta,
      );
      group.position.z = MathUtils.damp(
        group.position.z,
        pose.position[2],
        LERP_POS,
        delta,
      );
      group.rotation.y = MathUtils.damp(
        group.rotation.y,
        pose.yaw,
        LERP_YAW,
        delta,
      );
    }

    const t = state.clock.elapsedTime;
    const behaviour = useForgeStore.getState().forge.sparky.behaviour;
    const moving = useForgeStore.getState().forge.sparky.moving;
    const directorHop = peekDirectorClock().sparkyHop;
    const freeze = rm || behaviour === 'sleep';
    const bob = freeze ? 0 : Math.sin(t * 2.6) * 0.012;
    const walk = !freeze && moving ? Math.abs(Math.sin(t * 11)) * 0.028 : 0;
    if (behaviour === 'react') {
      hopRef.current = Math.min(1, hopRef.current + delta * 4);
    } else {
      hopRef.current = Math.max(0, hopRef.current - delta * 3);
    }
    const hop =
      Math.sin(hopRef.current * Math.PI) * 0.055 + directorHop * 0.05;
    group.position.y = pose.position[1] + bob + walk + hop;

    const dx = group.position.x - pose.position[0];
    const dz = group.position.z - pose.position[2];
    const arrived = Math.hypot(dx, dz) < 0.012;
    if (arrived && moving) {
      useForgeStore.getState().patchForgeSparky({ moving: false });
    }
  });

  if (poseLock || flatOverlay) return null;

  return (
    <group
      ref={groupRef}
      position={[...target.position]}
      rotation={[0, target.yaw, 0]}
      userData={{ forge: 'sparky', height: SPARKY_HEIGHT_M }}
      onClick={(event) => {
        event.stopPropagation();
        dispatchSparkyEvent(
          { type: 'TAP' },
          { reducedMotion, poseLock: false },
        );
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <PlaceholderMesh
        expression={sparky.expression}
        domeIntensity={HOLO_DOME_EMISSIVE[bubble.state]}
        sleep={sparky.behaviour === 'sleep'}
        whisper={sparky.behaviour === 'whisper' || bubble.state === 'whisper'}
      />
      <mesh position={[0, 0.2, 0]} userData={{ forge: 'sparky-hit' }}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default PlaceholderSparky;
