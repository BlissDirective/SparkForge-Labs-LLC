'use client';

// Projects live glass-mesh corners to CSS pixels each frame.
// Writes the slot projection bus — HoloPanel does not re-render.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { layoutSlotForView } from '@/lib/forge-hub/layouts';
import { boundingRect, ndcToScreen } from '@/lib/forge-hub/projectionMath';
import {
  GLASS_SLOT_IDS,
  getSlotAnchor,
  publishSlotProjection,
} from '@/lib/forge-hub/slotAnchors';
import {
  getHoloBubbleWorld,
  publishHoloBubbleScreen,
} from '@/lib/forge-hub/holoBubbleAnchor';
import { useForgeStore } from '@/stores/sceneStore';

export function ForgeSlotProjector() {
  const mode = useForgeStore((s) => s.forge.mode);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const corners = useRef([
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
  ]);
  const bubblePt = useRef(new Vector3());

  useFrame(({ camera, size }) => {
    const pts = corners.current;
    for (const id of GLASS_SLOT_IDS) {
      const slot = layoutSlotForView(id, mode, poseLock);
      const mesh = getSlotAnchor(id);
      if (!mesh || !slot.visible || poseLock) {
        publishSlotProjection(id, null);
        continue;
      }
      mesh.updateWorldMatrix(true, false);
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      if (!bb) {
        publishSlotProjection(id, null);
        continue;
      }
      pts[0].set(bb.min.x, bb.max.y, 0);
      pts[1].set(bb.max.x, bb.max.y, 0);
      pts[2].set(bb.max.x, bb.min.y, 0);
      pts[3].set(bb.min.x, bb.min.y, 0);
      const screen = pts.map((v) => {
        v.applyMatrix4(mesh.matrixWorld);
        v.project(camera);
        return ndcToScreen(v.x, v.y, size.width, size.height);
      });
      const box = boundingRect(screen);
      if (box.width < 1 || box.height < 1) {
        publishSlotProjection(id, null);
        continue;
      }
      publishSlotProjection(id, {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        yawDeg: slot.reading ? 0 : (slot.yaw ?? 0),
        reading: slot.reading,
        visible: true,
      });
    }

    const world = getHoloBubbleWorld();
    if (!world || poseLock) {
      publishHoloBubbleScreen(null);
      return;
    }
    const v = bubblePt.current;
    v.set(world[0], world[1], world[2]).project(camera);
    const pt = ndcToScreen(v.x, v.y, size.width, size.height);
    publishHoloBubbleScreen({
      x: pt.x,
      y: pt.y,
      visible: v.z >= -1 && v.z <= 1,
    });
  });

  return null;
}
