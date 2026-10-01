'use client';

// GLB object layer for the POC. Loads the authored HubDesk / SfEmitter /
// HoloScreens GLBs, assigns the runtime glass shader to the screen meshes,
// reparents them into the scene so the shared pose clock drives them, and
// renders the desk + emitter under a (calibration-placeholder) placement
// group. Only mounted once probePocAssets() confirms all three exist, so
// useGLTF never suspends on a 404.
//
// Final placement / per-node calibration happens in-engine when the real
// GLBs + new background plate land (P1/P4). This component is the drop-in
// seam: author the GLBs to the FORGE_STAGE_ASSET_PROMPTS contract and they
// appear here with no code change.

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Mesh, Object3D } from 'three';
import { makeGlassMaterial, type PocSceneController } from './pocScene';
import { POC_GLB_PLACEMENT, POC_OBJECT_URLS } from './pocAssets';

function firstMeshNamed(root: Object3D, name: string): Mesh | null {
  let hit: Mesh | null = null;
  root.traverse((o) => {
    if (hit) return;
    if (o.name === name && (o as Mesh).isMesh) hit = o as Mesh;
  });
  if (hit) return hit;
  // named node may be a group wrapping the mesh
  root.traverse((o) => {
    if (hit || o.name !== name) return;
    o.traverse((c) => {
      if (!hit && (c as Mesh).isMesh) hit = c as Mesh;
    });
  });
  return hit;
}

export function ForgePocGltfObjects({
  controller,
}: {
  controller: PocSceneController;
}) {
  const desk = useGLTF(POC_OBJECT_URLS.desk);
  const emitter = useGLTF(POC_OBJECT_URLS.emitter);
  const screens = useGLTF(POC_OBJECT_URLS.screens);

  useEffect(() => {
    const L = firstMeshNamed(screens.scene, 'HoloL');
    const C = firstMeshNamed(screens.scene, 'HoloC');
    const R = firstMeshNamed(screens.scene, 'HoloR');
    const mats = [makeGlassMaterial(false), makeGlassMaterial(true), makeGlassMaterial(false)];
    if (L) L.material = mats[0];
    if (C) C.material = mats[1];
    if (R) R.material = mats[2];
    // reparent found screen meshes into world space so pose-clock transforms
    // (POC world units) apply directly, not through the placement group
    for (const m of [L, C, R]) if (m) controller.group.add(m);
    if (L && C && R) {
      controller.registerScreens({ L, C, R, content: C });
    }
    return () => {
      controller.registerScreens(null);
      for (const m of mats) m.dispose();
    };
  }, [controller, screens]);

  return (
    <group position={POC_GLB_PLACEMENT.position} scale={POC_GLB_PLACEMENT.scale}>
      <primitive object={desk.scene} />
      <primitive object={emitter.scene} />
    </group>
  );
}

useGLTF.preload(POC_OBJECT_URLS.desk);
useGLTF.preload(POC_OBJECT_URLS.emitter);
useGLTF.preload(POC_OBJECT_URLS.screens);

export default ForgePocGltfObjects;
