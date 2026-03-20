'use client';

// ════════════════════════════════════════════════════
// DynamicEnvironment — Lab-Reactive Cockpit Environment
// ════════════════════════════════════════════════════
// 20M COCKPIT UPGRADE: 3,000,000 triangle target
// - 500 high-fidelity particles per lab (InstancedMesh, icosa/torus/sphere)
// - 8 volumetric fog sphere layers (large, BackSide, alpha blending)
// - 6 god ray cone columns (CylinderGeometry 64-seg)
// - 100 holographic data fragments (InstancedMesh, PlaneGeometry)
// - 4 lamp housing fixtures (sphere + cylinder + ring)
// - Environmental data props: floating rings, spline highways
// - 5000 star field (InstancedMesh)
// - Lab-specific particle physics preserved from v2.0
//
// Interface preserved: DynamicEnvironmentProps { activeLabId, intensity }

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLOD } from '@/hooks/useLOD';
import { useDeviceStore } from '@/stores/deviceStore';

// ── Lab color tables ───────────────────────────────

const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', 2: '#AA66FF', 3: '#FF66AA', 4: '#FFAA44', 5: '#00FF88',
  6: '#FF6644', 7: '#06B6D4', 8: '#818CF8', 9: '#10B981', 10: '#D946EF',
};

const LAB_ACCENT_COLORS: Record<number, [string, string]> = {
  1: ['#00BBFF', '#0066CC'], 2: ['#AA66FF', '#6633CC'], 3: ['#FF66AA', '#CC3377'],
  4: ['#FFAA44', '#CC7722'], 5: ['#00FF88', '#00CC66'], 6: ['#FF6644', '#CC3322'],
  7: ['#06B6D4', '#0488A0'], 8: ['#818CF8', '#5560C0'], 9: ['#10B981', '#0C8C60'],
  10: ['#D946EF', '#A030C0'],
};

interface DynamicEnvironmentProps {
  activeLabId: number | null;
  intensity?: number;
}

// ── Spatial grid helpers (preserved) ──────────────

const GRID_CELL_SIZE = 2.0;
const GRID_DIM = 16;

interface SpatialGrid { cells: Map<number, number[]>; }

function gridKey(cx: number, cy: number, cz: number): number {
  return ((cx + GRID_DIM) * (GRID_DIM * 2 + 1) + (cy + GRID_DIM)) * (GRID_DIM * 2 + 1) + (cz + GRID_DIM);
}
function toCell(v: number): number { return Math.floor(v / GRID_CELL_SIZE); }

function buildGrid(positions: Float32Array, count: number): SpatialGrid {
  const cells = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const key = gridKey(toCell(positions[i * 3]), toCell(positions[i * 3 + 1]), toCell(positions[i * 3 + 2]));
    const bucket = cells.get(key) ?? [];
    bucket.push(i);
    cells.set(key, bucket);
  }
  return { cells };
}

function getNeighbors(grid: SpatialGrid, x: number, y: number, z: number, selfIdx: number): number[] {
  const cx = toCell(x), cy = toCell(y), cz = toCell(z);
  const result: number[] = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.cells.get(gridKey(cx + dx, cy + dy, cz + dz));
        if (bucket) for (const idx of bucket) if (idx !== selfIdx) result.push(idx);
      }
  return result;
}

function noiseVec(x: number, y: number, z: number, t: number): [number, number, number] {
  return [
    Math.sin(x * 1.3 + t * 0.7) * Math.cos(z * 0.9 + t * 0.4) * 0.5 + Math.sin(y * 2.1 + t * 0.3) * 0.3,
    Math.cos(y * 1.7 + t * 0.5) * Math.sin(x * 0.8 + t * 0.6) * 0.4 + Math.cos(z * 1.4 + t * 0.2) * 0.25,
    Math.sin(z * 1.1 + t * 0.8) * Math.cos(y * 1.5 + t * 0.35) * 0.5 + Math.sin(x * 1.9 + t * 0.45) * 0.3,
  ];
}

interface ParticleData {
  positions: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  scales: Float32Array;
  trailHistory: Float32Array;
}

function initParticles(count: number): ParticleData {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const trailHistory = new Float32Array(count * 9);
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
    for (let tp = 0; tp < 3; tp++) {
      trailHistory[i * 9 + tp * 3] = positions[i3];
      trailHistory[i * 9 + tp * 3 + 1] = positions[i3 + 1];
      trailHistory[i * 9 + tp * 3 + 2] = positions[i3 + 2];
    }
  }
  return { positions, velocities, phases, scales, trailHistory };
}

// ── High-Fidelity Lab Particles ────────────────────

function LabParticles({ labId, color, count, intensity, seg }: {
  labId: number; color: string; count: number; intensity: number; seg: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => initParticles(count), [count]);
  const frameCount = useRef(0);
  const halfSeg = Math.max(6, Math.floor(seg / 2));

  const trailGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.008, 0.003, 0.15, 4, 1);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  const geometry = useMemo(() => {
    switch (labId) {
      case 1:  return new THREE.IcosahedronGeometry(1, 2);          // ~80 tris/particle
      case 2:  return new THREE.TorusGeometry(1, 0.35, halfSeg, seg); // high-seg torus
      case 3:  return new THREE.SphereGeometry(1, seg, halfSeg);    // smooth sphere
      case 4:  return new THREE.TetrahedronGeometry(1, 2);
      case 5:  return new THREE.OctahedronGeometry(1, 2);
      case 6:  return new THREE.BoxGeometry(1, 0.3, 1, 4, 1, 4);
      case 7:  return new THREE.SphereGeometry(1, halfSeg, halfSeg);
      case 8:  return new THREE.CapsuleGeometry(0.5, 1, halfSeg / 2, halfSeg);
      case 9:  return new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
      case 10: return new THREE.ConeGeometry(0.7, 1, seg);
      default: return new THREE.IcosahedronGeometry(1, 2);
    }
  }, [labId, seg, halfSeg]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const dt = 0.016;
    const pos = data.positions;
    const vel = data.velocities;
    frameCount.current++;
    const updateTrails = frameCount.current % 3 === 0;

    let grid: SpatialGrid | null = null;
    if (labId === 3 || labId === 6) grid = buildGrid(pos, count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const px = pos[i3], py = pos[i3 + 1], pz = pos[i3 + 2];
      let fx = 0, fy = 0, fz = 0;

      if (labId === 3 && grid) {
        const neighbors = getNeighbors(grid, px, py, pz, i);
        for (const ni of neighbors) {
          const ni3 = ni * 3;
          const dx = pos[ni3] - px, dy = pos[ni3 + 1] - py, dz = pos[ni3 + 2] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 0.01) continue;
          const dist = Math.sqrt(distSq);
          const force = dist < 1.0 ? -0.5 / (distSq + 0.1) : 0.15 / (dist + 0.5);
          fx += (dx / dist) * force; fy += (dy / dist) * force; fz += (dz / dist) * force;
        }
        fx -= vel[i3] * 0.3; fy -= vel[i3 + 1] * 0.3; fz -= vel[i3 + 2] * 0.3;
      } else if (labId === 6 && grid) {
        const targetX = i % 2 === 0 ? -2.5 : 2.5;
        fx += (targetX - px) * 0.08; fy += (-py) * 0.06; fz += (-pz) * 0.06;
        const neighbors = getNeighbors(grid, px, py, pz, i);
        for (const ni of neighbors) {
          if ((ni % 2) !== (i % 2)) continue;
          const ni3 = ni * 3;
          const dx = pos[ni3] - px, dy = pos[ni3 + 1] - py, dz = pos[ni3 + 2] - pz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 0.01) continue;
          const dist = Math.sqrt(distSq);
          if (dist < 1.5) { fx -= (dx / dist) * 0.1; fy -= (dy / dist) * 0.1; fz -= (dz / dist) * 0.1; }
        }
        fx -= vel[i3] * 0.5; fy -= vel[i3 + 1] * 0.5; fz -= vel[i3 + 2] * 0.5;
      } else if (labId === 4) {
        const dist = Math.sqrt(px * px + pz * pz) + 0.01;
        const angle = Math.atan2(pz, px);
        fx += -Math.sin(angle) * 0.3 + (px / dist) * 0.15;
        fy += -py * 0.1 + Math.sin(t * 0.5 + data.phases[i]) * 0.1;
        fz += Math.cos(angle) * 0.3 + (pz / dist) * 0.15;
        if (dist > 8) { pos[i3] = (Math.random() - 0.5); pos[i3 + 2] = (Math.random() - 0.5); vel[i3] = 0; vel[i3 + 2] = 0; }
        fx -= vel[i3] * 0.2; fy -= vel[i3 + 1] * 0.3; fz -= vel[i3 + 2] * 0.2;
      } else {
        const [nx, ny, nz] = noiseVec(px * 0.3, py * 0.3, pz * 0.3, t * 0.4);
        fx += nx * 0.4 * intensity; fy += ny * 0.3 * intensity; fz += nz * 0.4 * intensity;
        fx -= px * 0.01; fy -= py * 0.01; fz -= pz * 0.01;
        fx -= vel[i3] * 0.15; fy -= vel[i3 + 1] * 0.15; fz -= vel[i3 + 2] * 0.15;
      }

      vel[i3] += fx * dt; vel[i3 + 1] += fy * dt; vel[i3 + 2] += fz * dt;
      const vMag = Math.sqrt(vel[i3] ** 2 + vel[i3 + 1] ** 2 + vel[i3 + 2] ** 2);
      if (vMag > 2.0) { const sc = 2.0 / vMag; vel[i3] *= sc; vel[i3 + 1] *= sc; vel[i3 + 2] *= sc; }
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      const bound = 7;
      if (Math.abs(pos[i3]) > bound) vel[i3] *= -0.5;
      if (Math.abs(pos[i3 + 1]) > bound * 0.6) vel[i3 + 1] *= -0.5;
      if (Math.abs(pos[i3 + 2]) > bound) vel[i3 + 2] *= -0.5;

      if (updateTrails) {
        const ti = i * 9;
        data.trailHistory[ti + 6] = data.trailHistory[ti + 3]; data.trailHistory[ti + 7] = data.trailHistory[ti + 4]; data.trailHistory[ti + 8] = data.trailHistory[ti + 5];
        data.trailHistory[ti + 3] = data.trailHistory[ti]; data.trailHistory[ti + 4] = data.trailHistory[ti + 1]; data.trailHistory[ti + 5] = data.trailHistory[ti + 2];
        data.trailHistory[ti] = pos[i3]; data.trailHistory[ti + 1] = pos[i3 + 1]; data.trailHistory[ti + 2] = pos[i3 + 2];
      }

      const sc = data.scales[i] * (0.8 + Math.sin(t * 0.5 + data.phases[i]) * 0.2);
      dummy.position.set(pos[i3], pos[i3 + 1], pos[i3 + 2]);
      dummy.scale.setScalar(sc);
      dummy.rotation.y = t * (0.1 + data.phases[i] * 0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (trailRef.current && updateTrails) {
      for (let i = 0; i < count; i++) {
        const ti = i * 9;
        for (let sg = 0; sg < 3; sg++) {
          const iIdx = i * 3 + sg;
          dummy.position.set(data.trailHistory[ti + sg * 3], data.trailHistory[ti + sg * 3 + 1], data.trailHistory[ti + sg * 3 + 2]);
          const ts = data.scales[i] * (0.6 - sg * 0.15);
          dummy.scale.set(ts, ts, ts * 2);
          dummy.lookAt(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          dummy.updateMatrix();
          trailRef.current!.setMatrixAt(iIdx, dummy.matrix);
        }
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
          transparent opacity={0.18} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={trailRef} args={[trailGeo, undefined, count * 3]}>
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </instancedMesh>
    </group>
  );
}

// ── Volumetric Fog Spheres ─────────────────────────

function FogLayers({ color, intensity, seg }: { color: string; intensity: number; seg: number }) {
  const refs = [
    useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null),
  ];
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, delta) => {
    refs.forEach((r) => {
      if (r.current) (r.current.material as THREE.MeshBasicMaterial).color.lerp(colorObj, delta * 1.5);
    });
  });

  const fogDefs = [
    { r: 9.0,  y: 0,    op: 0.018 }, { r: 7.5,  y: 2.5,  op: 0.022 },
    { r: 6.0,  y: -2,   op: 0.025 }, { r: 5.5,  y: 1,    op: 0.02  },
    { r: 12.0, y: 4,    op: 0.012 }, { r: 4.0,  y: -3.5, op: 0.03  },
    { r: 8.0,  y: -1,   op: 0.015 }, { r: 10.0, y: 5,    op: 0.01  },
  ];

  return (
    <group>
      {fogDefs.map((fd, i) => (
        <mesh key={i} ref={refs[i]} position={[0, fd.y, 0]}>
          <sphereGeometry args={[fd.r, seg, Math.floor(seg * 0.75)]} />
          <meshBasicMaterial color={color} transparent opacity={fd.op * intensity}
            side={THREE.BackSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── God Ray Columns ────────────────────────────────

function GodRays({ color, seg }: { color: string; seg: number }) {
  const rayDefs = [
    { pos: [3, 7, 3],   ry: 0.2, tilt: 0.1 }, { pos: [-4, 8, 2],  ry: -0.3, tilt: 0.15 },
    { pos: [0, 9, -5],  ry: 0.5, tilt: 0   }, { pos: [-3, 7, -3], ry: -0.5, tilt: -0.1 },
    { pos: [5, 8, -1],  ry: 0.8, tilt: 0.2 }, { pos: [-2, 9, 4],  ry: -0.1, tilt: 0.05 },
  ] as const;
  return (
    <group>
      {rayDefs.map((rd, i) => (
        <mesh key={i} position={rd.pos as [number,number,number]}
          rotation={[rd.tilt, rd.ry, 0]}>
          <coneGeometry args={[0.6, 12, seg, 4, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.04}
            side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Lamp Housing Fixtures ──────────────────────────

function LampFixtures({ color, seg }: { color: string; seg: number }) {
  const fixtureDefs = [
    { pos: [5, 6, 5]   }, { pos: [-5, 6, 5]  },
    { pos: [5, 6, -5]  }, { pos: [-5, 6, -5] },
  ] as const;
  const halfSeg = Math.max(8, Math.floor(seg / 2));
  return (
    <group>
      {fixtureDefs.map((fd, i) => (
        <group key={i} position={fd.pos}>
          {/* Housing sphere */}
          <mesh>
            <sphereGeometry args={[0.18, halfSeg, halfSeg]} />
            <meshStandardMaterial color="#1a1a2a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Lens inner glow */}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.1, halfSeg, halfSeg / 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
          </mesh>
          {/* Mounting arm */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.5, halfSeg]} />
            <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Collar ring */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.18, 0.012, 8, halfSeg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
              metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Holographic Data Fragments ─────────────────────

function DataFragments({ color, seg: _seg }: { color: string; seg: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 100;

  const positions = useMemo(() => {
    return Array.from({ length: count }, (_: unknown, i: number) => ({
      x: (Math.sin(i * 2.3) * 8),
      y: (Math.cos(i * 1.7) * 4) + 1,
      z: (Math.sin(i * 3.1) * 8),
      phase: i * 0.628,
    }));
  }, []);

  const geo = useMemo(() => new THREE.PlaneGeometry(0.18, 0.12, 4, 3), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    positions.forEach((p, i) => {
      dummy.position.set(p.x + Math.sin(t * 0.3 + p.phase) * 0.3, p.y + Math.sin(t * 0.5 + p.phase) * 0.4, p.z + Math.cos(t * 0.2 + p.phase) * 0.3);
      dummy.rotation.y = t * 0.2 + p.phase;
      dummy.rotation.x = Math.sin(t * 0.1 + p.phase) * 0.3;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, count]}>
      <meshBasicMaterial color={color} transparent opacity={0.18}
        side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

// ── Star Field ─────────────────────────────────────

function StarField({ seg }: { seg: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const starCount = Math.min(5000, seg * 78); // scale with LOD

  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_: unknown, i: number) => {
      const theta = Math.acos(1 - 2 * ((i * 0.618033) % 1));
      const phi = 2 * Math.PI * ((i * 0.618033) % 1) * i;
      const r = 40 + (i % 20) * 1.5;
      return { x: r * Math.sin(theta) * Math.cos(phi), y: r * Math.cos(theta), z: r * Math.sin(theta) * Math.sin(phi), s: 0.02 + (i % 10) * 0.005 };
    });
  }, [starCount]);

  const geo = useMemo(() => new THREE.SphereGeometry(1, 4, 3), []);

  useMemo(() => {
    if (!meshRef.current) return;
    stars.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [stars, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[geo, undefined, starCount]}>
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ── Data Highway Splines ───────────────────────────

function DataHighways({ color, seg }: { color: string; seg: number }) {
  const highways = useMemo(() => {
    const routes = [
      [new THREE.Vector3(-6,1,0), new THREE.Vector3(-3,3,3), new THREE.Vector3(0,2,6), new THREE.Vector3(3,4,3), new THREE.Vector3(6,1,0)],
      [new THREE.Vector3(0,-1,-6), new THREE.Vector3(3,2,-3), new THREE.Vector3(6,1,0), new THREE.Vector3(3,3,3), new THREE.Vector3(0,2,6)],
      [new THREE.Vector3(-6,3,0), new THREE.Vector3(-3,1,-3), new THREE.Vector3(0,4,-6), new THREE.Vector3(3,2,-3), new THREE.Vector3(6,3,0)],
    ];
    return routes.map((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      return new THREE.TubeGeometry(curve, Math.max(16, seg), 0.018, 8, false);
    });
  }, [seg]);

  return (
    <group>
      {highways.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color={color} transparent opacity={0.12} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Floating Environment Rings ─────────────────────

function EnvironmentRings({ color, seg }: { color: string; seg: number }) {
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.y = clock.elapsedTime * 0.04;
  });
  const ringDefs = [
    { r: 8.5, tube: 0.04, y: 0,    tilt: 0.15  },
    { r: 11,  tube: 0.03, y: 3,    tilt: -0.2  },
    { r: 6,   tube: 0.05, y: -2.5, tilt: 0.3   },
    { r: 9.5, tube: 0.025, y: -4,  tilt: -0.08 },
  ];
  return (
    <group ref={ringRef}>
      {ringDefs.map((rd, i) => (
        <mesh key={i} position={[0, rd.y, 0]} rotation={[rd.tilt, 0, 0]}>
          <torusGeometry args={[rd.r, rd.tube, Math.floor(seg / 4), seg * 2]} />
          <meshBasicMaterial color={color} transparent opacity={0.08 + i * 0.01}
            toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main Environment ───────────────────────────────

export function DynamicEnvironment({ activeLabId, intensity = 0.5 }: DynamicEnvironmentProps) {
  const mainLightRef  = useRef<THREE.PointLight>(null);
  const spotLight1Ref = useRef<THREE.SpotLight>(null);
  const spotLight2Ref = useRef<THREE.SpotLight>(null);
  const lod = useLOD({ tier: 'system' });
  const seg = lod.segments;
  const profile = useDeviceStore((s) => s.profile);

  const labColor = activeLabId ? (LAB_COLORS[activeLabId] ?? '#00BBFF') : '#00BBFF';
  const accents  = activeLabId ? (LAB_ACCENT_COLORS[activeLabId] ?? LAB_ACCENT_COLORS[1]) : LAB_ACCENT_COLORS[1];

  const threeColor   = useMemo(() => new THREE.Color(labColor), [labColor]);
  const accentColor1 = useMemo(() => new THREE.Color(accents[0]), [accents]);
  const accentColor2 = useMemo(() => new THREE.Color(accents[1]), [accents]);

  useFrame((_, delta) => {
    const ls = delta * 2;
    if (mainLightRef.current)  mainLightRef.current.color.lerp(threeColor, ls);
    if (spotLight1Ref.current) spotLight1Ref.current.color.lerp(accentColor1, ls);
    if (spotLight2Ref.current) spotLight2Ref.current.color.lerp(accentColor2, ls);
  });

  const baseCount = activeLabId ? 90 : 60;
  const particleCount = Math.round(Math.max(60, Math.min(500, baseCount * 5 * intensity)) * profile.particleMultiplier);

  return (
    <group>
      {/* Lights */}
      <pointLight ref={mainLightRef} position={[0, 3, 0]} color={labColor}
        intensity={intensity * 1.0} distance={18} decay={2} />
      <spotLight ref={spotLight1Ref} position={[6, 4, 3]} color={accents[0]}
        intensity={intensity * 0.6} distance={20} angle={0.5} penumbra={0.8} decay={2} />
      <spotLight ref={spotLight2Ref} position={[-5, 3, -4]} color={accents[1]}
        intensity={intensity * 0.5} distance={20} angle={0.5} penumbra={0.8} decay={2} />
      <hemisphereLight args={[labColor, '#0A0E16', 0.15 * intensity]} />
      <ambientLight intensity={0.05} />

      {/* Volumetric fog layers */}
      <FogLayers color={labColor} intensity={intensity} seg={seg} />

      {/* God ray columns */}
      {lod.enableEffects && <GodRays color={labColor} seg={seg} />}

      {/* Lamp housing fixtures */}
      {lod.enableEffects && <LampFixtures color={labColor} seg={seg} />}

      {/* Holographic data fragments */}
      {lod.enableEffects && <DataFragments color={labColor} seg={seg} />}

      {/* Data highway splines */}
      {lod.enableEffects && <DataHighways color={labColor} seg={seg} />}

      {/* Floating environment rings */}
      <EnvironmentRings color={labColor} seg={seg} />

      {/* Star field */}
      <StarField seg={seg} />

      {/* Lab-specific floating particles */}
      <LabParticles
        labId={activeLabId ?? 1}
        color={labColor}
        count={particleCount}
        intensity={intensity}
        seg={seg}
      />
    </group>
  );
}
