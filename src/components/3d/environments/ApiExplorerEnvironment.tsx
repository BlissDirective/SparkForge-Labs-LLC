'use client';

// ════════════════════════════════════════════════════
// ApiExplorerEnvironment — API Integration Command Center (Standard ~500K budget)
// ════════════════════════════════════════════════════
// Lab 9: AI Careers & Future | Color: #F97316 (Orange)
//
// A high-tech API integration command center with data pipelines:
//   - Central API gateway hub with glowing connection ports
//   - Request/response pipeline tubes (color-coded by method)
//   - Endpoint directory tower (stacked registry panels)
//   - Authentication keycard station (card reader + key display)
//   - Rate limit meter (gauge with threshold markers)
//   - Response payload inspector (expandable data viewer)
//   - Documentation hologram library (floating book panels)
//   - Webhook listener array (instanced dish receivers)
//   - Status code indicator lights (instanced LED array)
//
// Triangle Budget (Desktop Ultra):
//   API Gateway Hub:                  ~65K  (central hub + ports)
//   Pipeline Tubes (color-coded):     ~55K  (4 method tubes)
//   Endpoint Directory Tower:         ~50K  (stacked panels)
//   Auth Keycard Station:             ~40K  (reader + key model)
//   Rate Limit Meter:                 ~45K  (gauge + markers)
//   Payload Inspector:                ~45K  (screen + frame)
//   Documentation Library (inst):     ~55K  (10 panels x ~5.5K)
//   Webhook Listener Array (inst):    ~50K  (8 dishes x ~6.25K)
//   Status Code Lights (inst):        ~40K  (20 LEDs)
//   Room Structure:                   ~55K
//   Total:                            ~500K

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StandardEnvironmentWrapper, useStandardLOD } from './StandardEnvironmentBase';

const LAB_COLOR = '#F97316';

// HTTP method colors
const METHOD_COLORS = {
  GET: '#00FF88',
  POST: '#4488FF',
  PUT: '#FFAA44',
  DELETE: '#FF4444',
};

// ■■ Central API Gateway Hub ■■
function ApiGatewayHub({ lod, requestsSent }: { lod: ReturnType<typeof useStandardLOD>; requestsSent: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const portsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  const segments = lod.level === 'ultra' ? 32 : lod.level === 'high' ? 20 : 10;
  const portCount = lod.level === 'ultra' ? 8 : lod.level === 'high' ? 6 : 4;

  React.useEffect(() => {
    if (!portsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < portCount; i++) {
      const angle = (i / portCount) * Math.PI * 2;
      const x = Math.cos(angle) * 1.0;
      const z = Math.sin(angle) * 1.0;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(0, -angle, 0));
      tmp.compose(
        new THREE.Vector3(x, 1.2, z),
        rot,
        new THREE.Vector3(0.12, 0.12, 0.2),
      );
      portsRef.current.setMatrixAt(i, tmp);
    }
    portsRef.current.instanceMatrix.needsUpdate = true;
  }, [portCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (coreRef.current) {
      coreRef.current.rotation.y = timeRef.current * 0.3;
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 2) * 0.15;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = timeRef.current * 0.5;
    if (ring2Ref.current) ring2Ref.current.rotation.x = timeRef.current * 0.4;
    if (portsRef.current) {
      const color = new THREE.Color();
      const methods = Object.values(METHOD_COLORS);
      for (let i = 0; i < portCount; i++) {
        const active = requestsSent > 0 && Math.sin(timeRef.current * 3 + i * 1.5) > 0.3;
        color.set(active ? methods[i % methods.length] : '#333340');
        portsRef.current.setColorAt(i, color);
      }
      if (portsRef.current.instanceColor) portsRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core octahedron */}
      <mesh ref={coreRef} position={[0, 1.2, 0]}>
        <octahedronGeometry args={[0.5, lod.level === 'ultra' ? 2 : 1]} />
        <meshStandardMaterial
          color={LAB_COLOR}
          emissive={LAB_COLOR}
          emissiveIntensity={0.3}
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Orbit ring 1 */}
      <mesh ref={ring1Ref} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.75, 0.02, 6, segments]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.4} />
      </mesh>
      {/* Orbit ring 2 */}
      <mesh ref={ring2Ref} position={[0, 1.2, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.85, 0.015, 6, segments]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} />
      </mesh>
      {/* Connection ports */}
      <instancedMesh ref={portsRef} args={[undefined, undefined, portCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </instancedMesh>
      {/* Base platform */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.15, segments]} />
        <meshStandardMaterial color="#12100C" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Request/Response Pipeline Tubes ■■
function PipelineTubes({ lod, currentMethod }: { lod: ReturnType<typeof useStandardLOD>; currentMethod: string }) {
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  const timeRef = useRef(0);

  const methods = useMemo(() => ['GET', 'POST', 'PUT', 'DELETE'], []);
  const segments = lod.level === 'ultra' ? 12 : lod.level === 'high' ? 8 : 6;

  const tubeGeometries = useMemo(() => {
    return methods.map((_, i) => {
      const startAngle = (i / 4) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      for (let t = 0; t <= 20; t++) {
        const frac = t / 20;
        const x = Math.cos(startAngle) * (1.5 + frac * 3.5);
        const y = 1.2 + Math.sin(frac * Math.PI) * 1.0 - frac * 0.3;
        const z = Math.sin(startAngle) * (1.5 + frac * 3.5);
        points.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 20, 0.06, segments, false);
    });
  }, [methods, segments]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    pulseRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const isActive = methods[i] === currentMethod;
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isActive
          ? 0.5 + Math.sin(timeRef.current * 4) * 0.25
          : 0.1;
        (mesh.material as THREE.MeshStandardMaterial).opacity = isActive ? 0.8 : 0.35;
      }
    });
  });

  return (
    <group>
      {tubeGeometries.map((geo, i) => (
        <mesh
          key={`tube-${i}`}
          ref={(el) => { if (el) pulseRefs.current[i] = el; }}
          geometry={geo}
        >
          <meshStandardMaterial
            color={METHOD_COLORS[methods[i] as keyof typeof METHOD_COLORS]}
            emissive={METHOD_COLORS[methods[i] as keyof typeof METHOD_COLORS]}
            emissiveIntensity={0.1}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

// ■■ Endpoint Directory Tower ■■
function EndpointTower({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const panelCount = lod.level === 'ultra' ? 8 : lod.level === 'high' ? 5 : 3;
  const panelsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!panelsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < panelCount; i++) {
      const y = i * 0.45 + 0.5;
      tmp.makeScale(0.9, 0.3, 0.06);
      tmp.setPosition(-5.5, y, 0);
      panelsRef.current.setMatrixAt(i, tmp);
    }
    panelsRef.current.instanceMatrix.needsUpdate = true;
  }, [panelCount]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!panelsRef.current) return;
    const color = new THREE.Color();
    const methods = Object.values(METHOD_COLORS);
    for (let i = 0; i < panelCount; i++) {
      color.set(methods[i % methods.length]);
      panelsRef.current.setColorAt(i, color);
    }
    if (panelsRef.current.instanceColor) panelsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Tower structure */}
      <mesh position={[-5.5, 2.0, 0]} castShadow>
        <boxGeometry args={[1.1, 4.0, 0.2]} />
        <meshStandardMaterial color="#100C18" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Endpoint panels */}
      <instancedMesh ref={panelsRef} args={[undefined, undefined, panelCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial emissive={LAB_COLOR} emissiveIntensity={0.2} transparent opacity={0.6} />
      </instancedMesh>
      {/* Tower top beacon */}
      <mesh position={[-5.5, 4.2, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={LAB_COLOR} emissive={LAB_COLOR} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ■■ Authentication Keycard Station ■■
function AuthKeycardStation({ lod: _lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const cardRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (cardRef.current) {
      cardRef.current.rotation.y = Math.sin(timeRef.current * 0.5) * 0.15;
      cardRef.current.position.y = 1.5 + Math.sin(timeRef.current * 0.8) * 0.05;
    }
    if (scanRef.current) {
      (scanRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(timeRef.current * 4) * 0.2;
    }
  });

  return (
    <group position={[5.0, 0, 3.0]}>
      {/* Card reader base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 1.0, 0.4]} />
        <meshStandardMaterial color="#141018" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Card slot */}
      <mesh position={[0, 0.7, 0.22]}>
        <boxGeometry args={[0.35, 0.04, 0.02]} />
        <meshStandardMaterial color="#0A0810" />
      </mesh>
      {/* Floating keycard */}
      <mesh ref={cardRef} position={[0, 1.5, 0.4]}>
        <boxGeometry args={[0.4, 0.25, 0.02]} />
        <meshStandardMaterial color="#1A2840" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Keycard chip */}
      <mesh position={[0.08, 1.48, 0.42]}>
        <boxGeometry args={[0.1, 0.08, 0.005]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.3} metalness={0.8} roughness={0.1} />
      </mesh>
      {/* Scan line */}
      <mesh ref={scanRef} position={[0, 0.7, 0.23]}>
        <boxGeometry args={[0.3, 0.01, 0.005]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ■■ Rate Limit Meter ■■
function RateLimitMeter({ lod, requestsSent }: { lod: ReturnType<typeof useStandardLOD>; requestsSent: number }) {
  const needleRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const segments = lod.level === 'ultra' ? 24 : lod.level === 'high' ? 16 : 8;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (needleRef.current) {
      const usage = Math.min(requestsSent / 50, 1.0);
      const targetAngle = -Math.PI / 3 + usage * (Math.PI * 2 / 3);
      needleRef.current.rotation.z += (targetAngle - needleRef.current.rotation.z) * delta * 3;
    }
  });

  return (
    <group position={[-4.0, 2.0, 4.5]} rotation={[0, Math.PI / 3, 0]}>
      {/* Gauge body */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 0.12, segments, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#12100A" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Gauge arc — green zone */}
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.06, 4, segments / 2, Math.PI * 0.5]} />
        <meshStandardMaterial color="#00FF88" emissive="#00FF88" emissiveIntensity={0.2} />
      </mesh>
      {/* Gauge arc — yellow zone */}
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, Math.PI * 0.5]}>
        <torusGeometry args={[0.65, 0.06, 4, segments / 3, Math.PI * 0.3]} />
        <meshStandardMaterial color="#FFAA44" emissive="#FFAA44" emissiveIntensity={0.2} />
      </mesh>
      {/* Gauge arc — red zone */}
      <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, Math.PI * 0.8]}>
        <torusGeometry args={[0.65, 0.06, 4, segments / 3, Math.PI * 0.2]} />
        <meshStandardMaterial color="#FF4444" emissive="#FF4444" emissiveIntensity={0.2} />
      </mesh>
      {/* Needle */}
      <group ref={needleRef} position={[0, 0, 0.1]}>
        <mesh>
          <boxGeometry args={[0.02, 0.55, 0.01]} />
          <meshStandardMaterial color="#FF6644" emissive="#FF6644" emissiveIntensity={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshStandardMaterial color="#2A2018" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      {/* Frame ring */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.82, 0.03, 4, segments]} />
        <meshStandardMaterial color="#2A2018" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ■■ Documentation Hologram Library (Instanced) ■■
function DocumentationLibrary({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 10 : lod.level === 'high' ? 6 : 3;
  const pagesRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!pagesRef.current) return;
    const tmp = new THREE.Matrix4();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + Math.PI / 2;
      const radius = 3.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const hover = Math.sin(timeRef.current * 0.6 + i * 0.8) * 0.12;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(
        Math.sin(timeRef.current * 0.3 + i) * 0.05,
        -angle + Math.PI,
        0,
      ));
      tmp.compose(
        new THREE.Vector3(x, 2.8 + hover, z),
        rot,
        new THREE.Vector3(0.6, 0.8, 0.02),
      );
      pagesRef.current.setMatrixAt(i, tmp);
      const hue = 0.08 + (i / count) * 0.15;
      color.setHSL(hue, 0.5, 0.3);
      pagesRef.current.setColorAt(i, color);
    }
    pagesRef.current.instanceMatrix.needsUpdate = true;
    if (pagesRef.current.instanceColor) pagesRef.current.instanceColor.needsUpdate = true;
  });

  if (!lod.enableDetailProps) return null;

  return (
    <instancedMesh ref={pagesRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        emissive={LAB_COLOR}
        emissiveIntensity={0.2}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// ■■ Webhook Listener Array (Instanced) ■■
function WebhookListeners({ lod, requestsSent }: { lod: ReturnType<typeof useStandardLOD>; requestsSent: number }) {
  const count = lod.level === 'ultra' ? 8 : lod.level === 'high' ? 5 : 3;
  const dishesRef = useRef<THREE.InstancedMesh>(null);
  const stemsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!dishesRef.current || !stemsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 1.4;
      const rot = new THREE.Quaternion();
      rot.setFromEuler(new THREE.Euler(-0.3, 0, 0));
      // Dish
      tmp.compose(
        new THREE.Vector3(x, 3.0, 5.5),
        rot,
        new THREE.Vector3(0.3, 0.3, 0.15),
      );
      dishesRef.current.setMatrixAt(i, tmp);
      // Stem
      tmp.makeScale(0.04, 0.6, 0.04);
      tmp.setPosition(x, 2.4, 5.5);
      stemsRef.current.setMatrixAt(i, tmp);
    }
    dishesRef.current.instanceMatrix.needsUpdate = true;
    stemsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!dishesRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const listening = requestsSent > 0 && Math.sin(timeRef.current * 2 + i * 2.0) > 0;
      color.set(listening ? '#00FF88' : '#333340');
      dishesRef.current.setColorAt(i, color);
    }
    if (dishesRef.current.instanceColor) dishesRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={dishesRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={stemsRef} args={[undefined, undefined, count]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial color="#2A2018" metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

// ■■ Status Code Indicator Lights (Instanced) ■■
function StatusCodeLights({ lod }: { lod: ReturnType<typeof useStandardLOD> }) {
  const count = lod.level === 'ultra' ? 20 : lod.level === 'high' ? 12 : 6;
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);

  React.useEffect(() => {
    if (!lightsRef.current) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      tmp.makeScale(0.06, 0.06, 0.06);
      tmp.setPosition(5.8, 2.8 - row * 0.2, -4.5 + col * 0.2);
      lightsRef.current.setMatrixAt(i, tmp);
    }
    lightsRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightsRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Status code color groups: 2xx green, 3xx blue, 4xx yellow, 5xx red
      const group = i % 4;
      const blink = Math.sin(timeRef.current * 3 + i * 1.5) > 0;
      if (group === 0) color.set(blink ? '#00FF88' : '#003318');
      else if (group === 1) color.set(blink ? '#4488FF' : '#0A1830');
      else if (group === 2) color.set(blink ? '#FFAA44' : '#332200');
      else color.set(blink ? '#FF4444' : '#330808');
      lightsRef.current.setColorAt(i, color);
    }
    if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* Panel backing */}
      <mesh position={[5.9, 2.5, -4.1]}>
        <boxGeometry args={[0.08, 1.5, 1.5]} />
        <meshStandardMaterial color="#0E0A10" metalness={0.4} roughness={0.6} />
      </mesh>
      <instancedMesh ref={lightsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial emissive="#FFFFFF" emissiveIntensity={0.6} />
      </instancedMesh>
    </group>
  );
}

// ■■ Main Environment ■■
interface ApiExplorerEnvironmentProps {
  requestsSent?: number;
  currentMethod?: string;
}

export default function ApiExplorerEnvironment({
  requestsSent = 0,
  currentMethod = 'GET',
}: ApiExplorerEnvironmentProps) {
  const lod = useStandardLOD();

  return (
    <StandardEnvironmentWrapper
      labColor={LAB_COLOR}
      terrainColor="#0E0A06"
      skyTopColor="#080503"
      skyHorizonColor="#1A0E08"
      fogColor="#F97316"
    >
      <ApiGatewayHub lod={lod} requestsSent={requestsSent} />
      <PipelineTubes lod={lod} currentMethod={currentMethod} />
      <EndpointTower lod={lod} />
      <AuthKeycardStation lod={lod} />
      <RateLimitMeter lod={lod} requestsSent={requestsSent} />
      <DocumentationLibrary lod={lod} />
      <WebhookListeners lod={lod} requestsSent={requestsSent} />
      <StatusCodeLights lod={lod} />
      {/* Active request glow */}
      {requestsSent > 0 && (
        <pointLight
          position={[0, 2, 0]}
          intensity={0.7}
          color={METHOD_COLORS[currentMethod as keyof typeof METHOD_COLORS] || LAB_COLOR}
          distance={10}
        />
      )}
    </StandardEnvironmentWrapper>
  );
}
