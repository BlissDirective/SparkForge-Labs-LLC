'use client';

// ════════════════════════════════════════════════════
// CameraQuestEnvironment — Photography Studio & CV Lab (FL-Lite 1.3M budget)
// ════════════════════════════════════════════════════
// Lab 7: Computer Vision | Color: #06B6D4 (Cyan)
//
// Photography studio and computer vision lab with lighting rigs,
// camera stations, photo gallery wall, green screen backdrop,
// film strip ribbons, lens flare points, neural network viz,
// and viewfinder frame overlay.
//
// Triangle Budget (Desktop Ultra):
//   Photography Lighting Rigs: ~180K (instanced softbox lights)
//   Camera Stations:           ~160K (3-4 cameras on tripods)
//   Photo Gallery Wall:        ~200K (floating polaroid frames)
//   Green Screen Backdrop:     ~80K  (backdrop with AR overlay)
//   Film Strip Ribbons:        ~130K (instanced hanging strips)
//   Lens Flare Light Points:   ~100K (glowing light sources)
//   Neural Network Viz:        ~220K (nodes + connection lines)
//   Viewfinder Frame:          ~60K  (corner brackets overlay)
//   Base Environment:          ~70K  (terrain + sky + fog)
//   Total:                     ~1.3M

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FLLiteEnvironmentWrapper } from './FLLiteEnvironmentBase';

// ■■ Photography Lighting Rigs ■■
function LightingRigs() {
  const count = 8;
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const panelRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!boxRef.current || !panelRef.current) return;
    const bTemp = new THREE.Matrix4();
    const pTemp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 1.2 - Math.PI * 0.6;
      const r = 8;
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;
      bTemp.makeRotationY(-angle);
      bTemp.setPosition(x, 3.5, z);
      boxRef.current.setMatrixAt(i, bTemp);
      pTemp.makeRotationY(-angle);
      pTemp.setPosition(x - Math.sin(angle) * 0.45, 3.5, z + Math.cos(angle) * 0.45);
      panelRef.current.setMatrixAt(i, pTemp);
    }
    boxRef.current.instanceMatrix.needsUpdate = true;
    panelRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      {/* Softbox housings */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.3]} />
        <meshStandardMaterial color="#1A1822" metalness={0.6} roughness={0.3} />
      </instancedMesh>
      {/* Light panels */}
      <instancedMesh ref={panelRef} args={[undefined, undefined, count]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.35} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* Stand poles */}
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 1.2 - Math.PI * 0.6;
        const x = Math.sin(angle) * 8;
        const z = Math.cos(angle) * 8;
        return (
          <mesh key={i} position={[x, 1.2, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 4.6, 6]} />
            <meshStandardMaterial color="#333344" metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

// ■■ Camera Stations ■■
function CameraStations({ isCapturing }: { isCapturing: boolean }) {
  const stationCount = 4;
  const flashRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!flashRef.current) return;
    flashRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = isCapturing
          ? (Math.sin(clock.elapsedTime * 8 + i * 2) > 0.7 ? 0.8 : 0.1)
          : 0.1;
      }
    });
  });

  return (
    <group ref={flashRef}>
      {Array.from({ length: stationCount }).map((_, i) => {
        const angle = (i / stationCount) * Math.PI * 0.8 + Math.PI * 0.6;
        const r = 5;
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            {/* Tripod legs */}
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((la, j) => (
              <mesh key={j} position={[Math.cos(la) * 0.25, 0.1, Math.sin(la) * 0.25]} rotation={[0.15 * Math.cos(la), 0, 0.15 * Math.sin(la)]}>
                <cylinderGeometry args={[0.02, 0.02, 1.6, 4]} />
                <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
            {/* Camera body */}
            <mesh position={[0, 1.0, 0]} castShadow>
              <boxGeometry args={[0.3, 0.2, 0.35]} />
              <meshStandardMaterial color="#111118" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Lens */}
            <mesh position={[0, 1.0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.06, 0.15, 12]} />
              <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.3} metalness={0.8} roughness={0.1} />
            </mesh>
            {/* Flash indicator */}
            <mesh position={[0, 1.15, 0.15]}>
              <sphereGeometry args={[0.04, 8, 6]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ■■ Photo Gallery Wall ■■
function PhotoGallery() {
  const frameCount = 20;
  const framesRef = useRef<THREE.InstancedMesh>(null);
  const photosRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!framesRef.current || !photosRef.current) return;
    const fTemp = new THREE.Matrix4();
    const pTemp = new THREE.Matrix4();
    for (let i = 0; i < frameCount; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = (col - 2) * 1.8 + (Math.random() - 0.5) * 0.3;
      const y = 1.5 + row * 1.5 + (Math.random() - 0.5) * 0.2;
      const z = -9 + Math.random() * 0.1;
      const tilt = (Math.random() - 0.5) * 0.12;
      fTemp.makeRotationZ(tilt);
      fTemp.setPosition(x, y, z);
      framesRef.current.setMatrixAt(i, fTemp);
      pTemp.makeRotationZ(tilt);
      pTemp.setPosition(x, y, z + 0.03);
      photosRef.current.setMatrixAt(i, pTemp);
      photosRef.current.setColorAt(i, new THREE.Color().setHSL(0.5 + Math.random() * 0.15, 0.5, 0.15));
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
    photosRef.current.instanceMatrix.needsUpdate = true;
    if (photosRef.current.instanceColor) photosRef.current.instanceColor.needsUpdate = true;
  }, [frameCount]);

  useFrame(({ clock }) => {
    if (!framesRef.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < frameCount; i++) {
      framesRef.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y += Math.sin(clock.elapsedTime * 0.5 + i * 0.4) * 0.001;
      temp.compose(pos, quat, scl);
      framesRef.current.setMatrixAt(i, temp);
    }
    framesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Polaroid frames */}
      <instancedMesh ref={framesRef} args={[undefined, undefined, frameCount]}>
        <boxGeometry args={[1.1, 1.3, 0.04]} />
        <meshStandardMaterial color="#EEEEDD" roughness={0.9} metalness={0.0} />
      </instancedMesh>
      {/* Photo surfaces */}
      <instancedMesh ref={photosRef} args={[undefined, undefined, frameCount]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ■■ Film Strip Ribbons ■■
function FilmStrips() {
  const count = 12;
  const ref = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 10;
      const rotZ = (Math.random() - 0.5) * 0.4;
      temp.makeRotationZ(rotZ);
      temp.setPosition(x, 3.0 + Math.random() * 1.5, z);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const temp = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, temp);
      temp.decompose(pos, quat, scl);
      pos.y += Math.sin(clock.elapsedTime * 0.3 + i) * 0.001;
      temp.compose(pos, quat, scl);
      ref.current.setMatrixAt(i, temp);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.25, 2.5, 0.01]} />
      <meshStandardMaterial color="#222233" metalness={0.3} roughness={0.5} />
    </instancedMesh>
  );
}

// ■■ Neural Network Visualization ■■
function NeuralNetworkViz({ confidence }: { confidence: number }) {
  const nodeCount = 24;
  const nodesRef = useRef<THREE.InstancedMesh>(null);

  const nodePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const layers = [4, 6, 6, 4, 2];
    let idx = 0;
    for (let l = 0; l < layers.length && idx < nodeCount; l++) {
      const layerCount = Math.min(layers[l], nodeCount - idx);
      for (let n = 0; n < layerCount; n++) {
        const x = (l - 2) * 1.5;
        const y = (n - (layerCount - 1) / 2) * 0.8;
        positions.push(new THREE.Vector3(x, y + 2.5, -6));
        idx++;
      }
    }
    return positions;
  }, [nodeCount]);

  const lineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, nodePositions.length); j++) {
        if (Math.abs(nodePositions[j].x - nodePositions[i].x) < 2) {
          points.push(nodePositions[i], nodePositions[j]);
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodePositions]);

  React.useEffect(() => {
    if (!nodesRef.current) return;
    const temp = new THREE.Matrix4();
    for (let i = 0; i < nodePositions.length; i++) {
      temp.makeTranslation(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
      nodesRef.current.setMatrixAt(i, temp);
      nodesRef.current.setColorAt(i, new THREE.Color().lerpColors(
        new THREE.Color('#333344'), new THREE.Color('#06B6D4'), confidence
      ));
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
  }, [nodePositions, confidence]);

  return (
    <group>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={0.6} metalness={0.5} roughness={0.3} />
      </instancedMesh>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#06B6D4" transparent opacity={0.3 + confidence * 0.4} />
      </lineSegments>
    </group>
  );
}

// ■■ Viewfinder Frame Overlay ■■
function ViewfinderFrame() {
  const cornerSize = 0.6;
  const spread = 4;
  return (
    <group position={[0, 1.5, 0]}>
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <group key={i} position={[sx * spread, sy * spread * 0.6, 5]}>
          <mesh position={[sx * cornerSize * 0.5, 0, 0]}>
            <boxGeometry args={[cornerSize, 0.03, 0.01]} />
            <meshBasicMaterial color="#06B6D4" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, sy * cornerSize * 0.5, 0]}>
            <boxGeometry args={[0.03, cornerSize, 0.01]} />
            <meshBasicMaterial color="#06B6D4" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ■■ Main Environment ■■
interface CameraQuestEnvironmentProps {
  isCapturing: boolean;
  confidence: number;
}

export default function CameraQuestEnvironment({ isCapturing, confidence }: CameraQuestEnvironmentProps) {

  return (
    <FLLiteEnvironmentWrapper
      labColor="#06B6D4"
      terrainColor="#0A1216"
      skyTopColor="#040A10"
      skyHorizonColor="#0E1E28"
      fogColor="#06B6D4"
    >
      <LightingRigs />
      <CameraStations isCapturing={isCapturing} />
      <PhotoGallery />
      {<FilmStrips />}
      <NeuralNetworkViz confidence={confidence} />
      <ViewfinderFrame />
    </FLLiteEnvironmentWrapper>
  );
}
