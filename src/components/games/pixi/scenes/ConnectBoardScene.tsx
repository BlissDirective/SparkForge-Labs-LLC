// ════════════════════════════════════════════════════════════════════════
// ARCHETYPE: BUILD / CONNECT BOARD — wire nodes together by dragging edges
// ════════════════════════════════════════════════════════════════════════
// Pairs with games whose mechanic is "connect these into a pipeline / graph"
// (neural nets, ML pipelines, MCP tool wiring). Drag from one node to another
// to create an edge; the parent owns the connection list + validation
// (see validateConnections in GameMechanicKit). Renders inside <PixiGameStage>.

'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useTick } from '@pixi/react';
import { Graphics, type FederatedPointerEvent } from 'pixi.js';
import { hexNum, STAGE_PAD } from '../primitives';
import { ParticleField, type ParticleController } from '../ParticleField';

export interface BoardNode {
  id: string;
  label: string;
  /** 0–100 percentage positions within the stage. */
  x: number;
  y: number;
  color?: string;
}

interface ConnectBoardSceneProps {
  nodes: BoardNode[];
  /** Controlled connection list (unordered pairs). */
  connections: [string, string][];
  onConnect: (a: string, b: string) => void;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
}

const NODE_R = 28;

export default function ConnectBoardScene({
  nodes, connections, onConnect, labColor, reducedMotion, width, height,
}: ConnectBoardSceneProps) {
  const accent = hexNum(labColor);

  // Resolve node centers in pixels (inset by padding so nodes never clip).
  const centers = useMemo(() => {
    const map = new Map<string, { x: number; y: number; node: BoardNode }>();
    const innerW = width - STAGE_PAD * 2 - NODE_R * 2;
    const innerH = height - STAGE_PAD * 2 - NODE_R * 2;
    for (const n of nodes) {
      map.set(n.id, {
        x: STAGE_PAD + NODE_R + (n.x / 100) * innerW,
        y: STAGE_PAD + NODE_R + (n.y / 100) * innerH,
        node: n,
      });
    }
    return map;
  }, [nodes, width, height]);

  const [fromId, setFromId] = useState<string | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pendingRef = useRef<Graphics | null>(null);
  const particles = useRef<ParticleController | null>(null);

  const nodeAt = useCallback((px: number, py: number): string | null => {
    for (const [id, c] of centers) {
      if (Math.hypot(px - c.x, py - c.y) <= NODE_R + 6) return id;
    }
    return null;
  }, [centers]);

  const connected = useCallback((a: string, b: string) => {
    const key = [a, b].sort().join('-');
    return connections.some((c) => [c[0], c[1]].sort().join('-') === key);
  }, [connections]);

  const onMove = useCallback((e: FederatedPointerEvent) => {
    pointerRef.current = { x: e.global.x, y: e.global.y };
  }, []);

  const onUp = useCallback(() => {
    if (!fromId) return;
    const { x, y } = pointerRef.current;
    const target = nodeAt(x, y);
    if (target && target !== fromId && !connected(fromId, target)) {
      const c = centers.get(target)!;
      particles.current?.burst(c.x, c.y, accent);
      onConnect(fromId, target);
    }
    setFromId(null);
  }, [fromId, nodeAt, connected, centers, accent, onConnect]);

  // Pending edge follows the pointer imperatively while dragging.
  useTick(() => {
    const g = pendingRef.current;
    if (!g) return;
    g.clear();
    if (!fromId) return;
    const from = centers.get(fromId);
    if (!from) return;
    g.moveTo(from.x, from.y);
    g.lineTo(pointerRef.current.x, pointerRef.current.y);
    g.stroke({ color: accent, alpha: 0.7, width: 3 });
  });

  const drawBg = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 0, width, height);
    g.fill({ color: 0x0a0f1e, alpha: 0.001 });
  }, [width, height]);

  const drawEdges = useCallback((g: Graphics) => {
    g.clear();
    for (const [a, b] of connections) {
      const ca = centers.get(a);
      const cb = centers.get(b);
      if (!ca || !cb) continue;
      g.moveTo(ca.x, ca.y);
      g.lineTo(cb.x, cb.y);
      g.stroke({ color: 0x2ecc71, alpha: 0.85, width: 4 });
    }
  }, [connections, centers]);

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBg} eventMode="static" onPointerMove={onMove} onPointerUp={onUp} onPointerUpOutside={onUp} />

      <pixiGraphics draw={drawEdges} />
      <pixiGraphics ref={pendingRef} draw={() => {}} />

      {[...centers.values()].map(({ x, y, node }) => {
        const col = hexNum(node.color ?? labColor);
        const active = fromId === node.id;
        return (
          <pixiContainer
            key={node.id}
            x={x}
            y={y}
            eventMode="static"
            cursor="pointer"
            onPointerDown={() => setFromId(node.id)}
          >
            <pixiGraphics
              draw={(g: Graphics) => {
                g.clear();
                g.circle(0, 0, NODE_R * 1.3);
                g.fill({ color: col, alpha: 0.18 });
                g.circle(0, 0, NODE_R);
                g.fill({ color: col, alpha: 0.92 });
                g.circle(0, 0, NODE_R);
                g.stroke({ color: 0xffffff, alpha: active ? 0.9 : 0.4, width: active ? 3 : 2 });
              }}
            />
            <pixiText
              text={node.label}
              anchor={0.5}
              y={NODE_R + 12}
              style={{ fill: 0xffffff, fontSize: 12, fontWeight: '600', fontFamily: 'system-ui, sans-serif', align: 'center' }}
            />
          </pixiContainer>
        );
      })}

      <ParticleField controllerRef={particles} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}
