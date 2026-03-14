'use client';

// ════════════════════════════════════════════════════
// DynamicEnvironment — Lab-Reactive Cockpit Environment
// ════════════════════════════════════════════════════
// Enhancement 2.0: High-budget environment (15,000 tri budget for particles).
// - 60-120 particles per lab, device-scaled
// - Particle trails (3-point TubeGeometry, ~6 tris each)
// - Lab-specific physics (attract/repel, clusters, spirals, noise drift)
// - Spatial grid optimization for neighbor lookups
// - Enhanced lighting: point + 2 spot + hemisphere
// - Volumetric fog hint sphere
//
// Interface preserved: DynamicEnvironmentProps { activeLabId, intensity }

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#10B981', 10: '#D946EF',
};

// Secondary accent per lab for spot lights
const LAB_ACCENT_COLORS: Record<number, [string, string]> = {
  1: ['#00BBFF', '#0066CC'],
  2: ['#AA66FF', '#6633CC'],
  3: ['#FF66AA', '#CC3377'],
  4: ['#FFAA44', '#CC7722'],
  5: ['#00FF88', '#00CC66'],
  6: ['#FF6644', '#CC3322'],
  7: ['#06B6D4', '#0488A0'],
  8: ['#818CF8', '#5560C0'],
  9: ['#10B981', '#0C8C60'],
  10: ['#D946EF', '#A030C0'],
};

interface DynamicEnvironmentProps {
  activeLabId: number | null;
  intensity?: number; // 0-1
}

// ─── Spatial Grid for O(1) neighbor lookups ──────────────────

const GRID_CELL_SIZE = 2.0;
const GRID_DIM = 16; // covers -16..+16

interface SpatialGrid {
  cells: Map<number, number[]>;
}

function gridKey(cx: number, cy: number, cz: number): number {
  return ((cx + GRID_DIM) * (GRID_DIM * 2 + 1) + (cy + GRID_DIM)) * (GRID_DIM * 2 + 1) + (cz + GRID_DIM);
}

function toCell(v: number): number {
  return Math.floor(v / GRID_CELL_SIZE);
}

function buildGrid(positions: Float32Array, count: number): SpatialGrid {
  const cells = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const cx = toCell(positions[i * 3]);
    const cy = toCell(positions[i * 3 + 1]);
    const cz = toCell(positions[i * 3 + 2]);
    const key = gridKey(cx, cy, cz);
    let bucket = cells.get(key);
    if (!bucket) {
      bucket = [];
      cells.set(key, bucket);
    }
    bucket.push(i);
  }
  return { cells };
}

function getNeighbors(grid: SpatialGrid, x: number, y: number, z: number, selfIdx: number): number[] {
  const cx = toCell(x);
  const cy = toCell(y);
  const cz = toCell(z);
  const result: number[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.cells.get(gridKey(cx + dx, cy + dy, cz + dz));
        if (bucket) {
          for (const idx of bucket) {
            if (idx !== selfIdx) result.push(idx);
          }
        }
      }
    }
  }
  return result;
}

// ─── Pseudo-Perlin noise using sin/cos combinations ──────────

function noiseVec(x: number, y: number, z: number, t: number): [number, number, number] {
  return [
    Math.sin(x * 1.3 + t * 0.7) * Math.cos(z * 0.9 + t * 0.4) * 0.5
      + Math.sin(y * 2.1 + t * 0.3) * 0.3,
    Math.cos(y * 1.7 + t * 0.5) * Math.sin(x * 0.8 + t * 0.6) * 0.4
      + Math.cos(z * 1.4 + t * 0.2) * 0.25,
    Math.sin(z * 1.1 + t * 0.8) * Math.cos(y * 1.5 + t * 0.35) * 0.5
      + Math.sin(x * 1.9 + t * 0.45) * 0.3,
  ];
}

// ─── Particle data structure ─────────────────────────────────

interface ParticleData {
  positions: Float32Array;   // current x,y,z
  velocities: Float32Array;  // vx,vy,vz
  phases: Float32Array;      // per-particle phase offset
  scales: Float32Array;      // per-particle base scale
  // Trail history: 3 previous positions per particle (for TubeGeometry)
  trailHistory: Float32Array; // [count * 3 * 3] — 3 trail points, each xyz
}

function initParticles(count: number): ParticleData {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const trailHistory = new Float32Array(count * 9); // 3 trail points * 3 components

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 14;
    positions[i3 + 1] = (Math.random() - 0.5) * 8;
    positions[i3 + 2] = (Math.random() - 0.5) * 14;
    velocities[i3] = (Math.random() - 0.5) * 0.2;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
    phases[i] = Math.random() * Math.PI * 2;
    scales[i] = 0.02 + Math.random() * 0.06;
    // Initialize trail at current position
    for (let t = 0; t < 3; t++) {
      trailHistory[i * 9 + t * 3] = positions[i3];
      trailHistory[i * 9 + t * 3 + 1] = positions[i3 + 1];
      trailHistory[i * 9 + t * 3 + 2] = positions[i3 + 2];
    }
  }
  return { positions, velocities, phases, scales, trailHistory };
}

// ─── Lab Particles Component ─────────────────────────────────

function LabParticles({
  labId,
  color,
  count,
  intensity,
}: {
  labId: number;
  color: string;
  count: number;
  intensity: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => initParticles(count), [count]);

  // Trail geometry: small elongated low-poly capsule (~6 tris per trail segment)
  const trailGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.008, 0.003, 0.15, 3, 1);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  // Lab-specific geometry for particles
  const geometry = useMemo(() => {
    switch (labId) {
      case 1: return new THREE.IcosahedronGeometry(1, 0);
      case 2: return new THREE.TorusGeometry(1, 0.3, 6, 8);
      case 3: return new THREE.SphereGeometry(1, 4, 4);
      case 4: return new THREE.TetrahedronGeometry(1, 0);
      case 5: return new THREE.OctahedronGeometry(1, 0);
      case 6: return new THREE.BoxGeometry(1, 0.3, 1);
      case 7: return new THREE.SphereGeometry(1, 8, 8);
      case 8: return new THREE.CapsuleGeometry(0.5, 1, 4, 8);
      case 9: return new THREE.BoxGeometry(1, 1, 1);
      case 10: return new THREE.ConeGeometry(0.7, 1, 4);
      default: return new THREE.IcosahedronGeometry(1, 0);
    }
  }, [labId]);

  // Frame counter for trail update throttle
  const frameCount = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const dt = 0.016; // fixed step for stability
    const pos = data.positions;
    const vel = data.velocities;

    frameCount.current++;
    const updateTrails = frameCount.current % 3 === 0; // update trails every 3rd frame

    // Build spatial grid for neighbor lookups (used by Lab 3 and Lab 6)
    let grid: SpatialGrid | null = null;
    if (labId === 3 || labId === 6) {
      grid = buildGrid(pos, count);
    }

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = pos[i3];
      const py = pos[i3 + 1];
      const pz = pos[i3 + 2];

      let fx = 0, fy = 0, fz = 0;

      // ─── Lab-specific physics ───
      if (labId === 3 && grid) {
        // Lab 3 (Neural Networks): attract/repel based on distance
        const neighbors = getNeighbors(grid, px, py, pz, i);
        for (const ni of neighbors) {
          const ni3 = ni * 3;
          const dx = pos[ni3] - px;
          const dy = pos[ni3 + 1] - py;
          const dz = pos[ni3 + 2] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 0.01) continue;
          const dist = Math.sqrt(distSq);
          // Attract at medium range (1-3), repel at close range (<1)
          const force = dist < 1.0
            ? -0.5 / (distSq + 0.1)  // repel
            : 0.15 / (dist + 0.5);    // attract
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
          fz += (dz / dist) * force;
        }
        // Damping
        fx -= vel[i3] * 0.3;
        fy -= vel[i3 + 1] * 0.3;
        fz -= vel[i3 + 2] * 0.3;
      } else if (labId === 6 && grid) {
        // Lab 6 (Ethics): Two balanced clusters — left and right
        const targetX = i % 2 === 0 ? -2.5 : 2.5;
        const targetY = 0;
        const targetZ = 0;
        fx += (targetX - px) * 0.08;
        fy += (targetY - py) * 0.06;
        fz += (targetZ - pz) * 0.06;
        // Repel from same-cluster neighbors to spread them out
        const neighbors = getNeighbors(grid, px, py, pz, i);
        for (const ni of neighbors) {
          if ((ni % 2) !== (i % 2)) continue; // only same cluster
          const ni3 = ni * 3;
          const dx = pos[ni3] - px;
          const dy = pos[ni3 + 1] - py;
          const dz = pos[ni3 + 2] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 0.01) continue;
          const dist = Math.sqrt(distSq);
          if (dist < 1.5) {
            fx -= (dx / dist) * 0.1;
            fy -= (dy / dist) * 0.1;
            fz -= (dz / dist) * 0.1;
          }
        }
        fx -= vel[i3] * 0.5;
        fy -= vel[i3 + 1] * 0.5;
        fz -= vel[i3 + 2] * 0.5;
      } else if (labId === 4) {
        // Lab 4 (Generative AI): Spiral outward from center
        const dist = Math.sqrt(px * px + pz * pz) + 0.01;
        const angle = Math.atan2(pz, px);
        // Tangential force (spiral)
        const tangentX = -Math.sin(angle) * 0.3;
        const tangentZ = Math.cos(angle) * 0.3;
        // Outward radial push
        const radialX = (px / dist) * 0.15;
        const radialZ = (pz / dist) * 0.15;
        fx += tangentX + radialX;
        fy += -py * 0.1 + Math.sin(t * 0.5 + data.phases[i]) * 0.1;
        fz += tangentZ + radialZ;
        // Reset particles that go too far
        if (dist > 8) {
          pos[i3] = (Math.random() - 0.5) * 1.0;
          pos[i3 + 2] = (Math.random() - 0.5) * 1.0;
          vel[i3] = 0;
          vel[i3 + 2] = 0;
        }
        fx -= vel[i3] * 0.2;
        fy -= vel[i3 + 1] * 0.3;
        fz -= vel[i3 + 2] * 0.2;
      } else {
        // All others: Enhanced drift with Perlin-like noise
        const [nx, ny, nz] = noiseVec(px * 0.3, py * 0.3, pz * 0.3, t * 0.4);
        fx += nx * 0.4 * intensity;
        fy += ny * 0.3 * intensity;
        fz += nz * 0.4 * intensity;
        // Gentle centering to keep particles in bounds
        fx -= px * 0.01;
        fy -= py * 0.01;
        fz -= pz * 0.01;
        fx -= vel[i3] * 0.15;
        fy -= vel[i3 + 1] * 0.15;
        fz -= vel[i3 + 2] * 0.15;
      }

      // Integrate velocity and position
      vel[i3] += fx * dt;
      vel[i3 + 1] += fy * dt;
      vel[i3 + 2] += fz * dt;
      // Clamp velocity
      const vMag = Math.sqrt(vel[i3] ** 2 + vel[i3 + 1] ** 2 + vel[i3 + 2] ** 2);
      if (vMag > 2.0) {
        const scale = 2.0 / vMag;
        vel[i3] *= scale;
        vel[i3 + 1] *= scale;
        vel[i3 + 2] *= scale;
      }
      pos[i3] += vel[i3] * dt;
      pos[i3 + 1] += vel[i3 + 1] * dt;
      pos[i3 + 2] += vel[i3 + 2] * dt;

      // Soft boundary
      const bound = 7;
      if (Math.abs(pos[i3]) > bound) vel[i3] *= -0.5;
      if (Math.abs(pos[i3 + 1]) > bound * 0.6) vel[i3 + 1] *= -0.5;
      if (Math.abs(pos[i3 + 2]) > bound) vel[i3 + 2] *= -0.5;

      // Update trail history (shift old positions back)
      if (updateTrails) {
        const ti = i * 9;
        // Shift trail[1] -> trail[2], trail[0] -> trail[1]
        data.trailHistory[ti + 6] = data.trailHistory[ti + 3];
        data.trailHistory[ti + 7] = data.trailHistory[ti + 4];
        data.trailHistory[ti + 8] = data.trailHistory[ti + 5];
        data.trailHistory[ti + 3] = data.trailHistory[ti];
        data.trailHistory[ti + 4] = data.trailHistory[ti + 1];
        data.trailHistory[ti + 5] = data.trailHistory[ti + 2];
        data.trailHistory[ti] = pos[i3];
        data.trailHistory[ti + 1] = pos[i3 + 1];
        data.trailHistory[ti + 2] = pos[i3 + 2];
      }

      // Set particle instance matrix
      const s = data.scales[i] * (0.8 + Math.sin(t * 0.5 + data.phases[i]) * 0.2);
      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
      dummy.scale.setScalar(s);
      dummy.rotation.y = t * (0.1 + data.phases[i] * 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Update trail instances (3 trail segments per particle)
    if (trailMeshRef.current && updateTrails) {
      for (let i = 0; i < count; i++) {
        const ti = i * 9;
        for (let seg = 0; seg < 3; seg++) {
          const instanceIdx = i * 3 + seg;
          const sx = data.trailHistory[ti + seg * 3];
          const sy = data.trailHistory[ti + seg * 3 + 1];
          const sz = data.trailHistory[ti + seg * 3 + 2];
          dummy.position.set(sx, sy, sz);
          // Scale trail segments: fade out further back
          const trailScale = data.scales[i] * (0.6 - seg * 0.15);
          dummy.scale.set(trailScale, trailScale, trailScale * 2);
          // Orient trail along velocity direction
          dummy.lookAt(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          dummy.updateMatrix();
          trailMeshRef.current!.setMatrixAt(instanceIdx, dummy.matrix);
        }
      }
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Main particles */}
      <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
          roughness={0.6}
        />
      </instancedMesh>

      {/* Particle trails (3 trail segments per particle, ~6 tris each) */}
      <instancedMesh ref={trailMeshRef} args={[trailGeo, undefined, count * 3]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
        />
      </instancedMesh>
    </group>
  );
}

// ─── Main Environment ────────────────────────────────────────

export function DynamicEnvironment({
  activeLabId,
  intensity = 0.5,
}: DynamicEnvironmentProps) {
  const mainLightRef = useRef<THREE.PointLight>(null);
  const spotLight1Ref = useRef<THREE.SpotLight>(null);
  const spotLight2Ref = useRef<THREE.SpotLight>(null);
  const fogSphereRef = useRef<THREE.Mesh>(null);
  const profile = useDeviceStore((s) => s.profile);

  const labColor = activeLabId ? LAB_COLORS[activeLabId] || '#00BBFF' : '#00BBFF';
  const accents = activeLabId ? LAB_ACCENT_COLORS[activeLabId] || LAB_ACCENT_COLORS[1] : LAB_ACCENT_COLORS[1];
  const threeColor = useMemo(() => new THREE.Color(labColor), [labColor]);
  const accentColor1 = useMemo(() => new THREE.Color(accents[0]), [accents]);
  const accentColor2 = useMemo(() => new THREE.Color(accents[1]), [accents]);
  const fogColor = useMemo(() => new THREE.Color(labColor), [labColor]);

  // Smoothly transition all light colors
  useFrame((_, delta) => {
    const lerpSpeed = delta * 2;
    if (mainLightRef.current) {
      mainLightRef.current.color.lerp(threeColor, lerpSpeed);
    }
    if (spotLight1Ref.current) {
      spotLight1Ref.current.color.lerp(accentColor1, lerpSpeed);
    }
    if (spotLight2Ref.current) {
      spotLight2Ref.current.color.lerp(accentColor2, lerpSpeed);
    }
    if (fogSphereRef.current) {
      (fogSphereRef.current.material as THREE.MeshBasicMaterial).color.lerp(fogColor, lerpSpeed);
    }
  });

  // Scale particle count: 60-120 range based on intensity and device
  const baseCount = activeLabId ? 90 : 60;
  const particleCount = Math.round(
    Math.max(60, Math.min(120, baseCount * intensity)) * profile.particleMultiplier
  );

  return (
    <group>
      {/* Main point light — intensity 1.0 (up from 0.5) */}
      <pointLight
        ref={mainLightRef}
        position={[0, 3, 0]}
        color={labColor}
        intensity={intensity * 1.0}
        distance={18}
        decay={2}
      />

      {/* Two colored spot lights following lab theme */}
      <spotLight
        ref={spotLight1Ref}
        position={[6, 4, 3]}
        color={accents[0]}
        intensity={intensity * 0.6}
        distance={20}
        angle={0.5}
        penumbra={0.8}
        decay={2}
      />
      <spotLight
        ref={spotLight2Ref}
        position={[-5, 3, -4]}
        color={accents[1]}
        intensity={intensity * 0.5}
        distance={20}
        angle={0.5}
        penumbra={0.8}
        decay={2}
      />

      {/* Hemispheric light: sky = lab color, ground = base dark */}
      <hemisphereLight
        args={[labColor, '#0A0E16', 0.15 * intensity]}
      />

      {/* Ambient fill */}
      <ambientLight intensity={0.05} />

      {/* Volumetric fog hint — large low-opacity sphere */}
      <mesh ref={fogSphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial
          color={labColor}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lab-specific floating particles with trails */}
      {activeLabId && (
        <LabParticles
          labId={activeLabId}
          color={labColor}
          count={particleCount}
          intensity={intensity}
        />
      )}

      {/* Default ambient particles when no lab is focused */}
      {!activeLabId && (
        <LabParticles
          labId={1}
          color="#00BBFF"
          count={particleCount}
          intensity={intensity}
        />
      )}
    </group>
  );
}
