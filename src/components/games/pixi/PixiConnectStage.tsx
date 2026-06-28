// ════════════════════════════════════════════════════════════════════════
// PIXI CONNECT STAGE — wiring / pipeline play surface (Phase C archetype)
// ════════════════════════════════════════════════════════════════════════
// Thin composition of the shared <PixiGameStage> shell + the <ConnectBoardScene>
// archetype, plus a keyboard/AT fallback (two selects + Connect). Pairs with
// "wire these into a graph" games — neural paths, ML pipelines, MCP wiring.
// The parent owns the node set, the connection list, validation, and scoring.
//
// Wave-1 proof game: Neuron Relay (Lab 3) — wire a signal path to the output.

'use client';

import { useState } from 'react';
import PixiGameStage from './PixiGameStage';
import ConnectBoardScene, { type BoardNode } from './scenes/ConnectBoardScene';

export type { BoardNode };

interface PixiConnectStageProps {
  nodes: BoardNode[];
  connections: [string, string][];
  onConnect: (a: string, b: string) => void;
  labColor: string;
  /** Per-edge color override keyed by sorted "a-b" (Pixi hex number). */
  edgeColors?: Record<string, number>;
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiConnectStage({
  nodes, connections, onConnect, labColor, edgeColors, reducedMotion = false, height = 420,
}: PixiConnectStageProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  const alreadyWired = (a: string, b: string) => {
    const key = [a, b].sort().join('-');
    return connections.some((c) => [c[0], c[1]].sort().join('-') === key);
  };
  const canConnect = from && to && from !== to && !alreadyWired(from, to);

  const selectStyle = {
    background: '#101830',
    color: '#E6ECFF',
    border: `1px solid ${labColor}40`,
  } as const;

  // Keyboard / AT control strip — drives the same onConnect as dragging.
  const a11y = (
    <div role="group" aria-label="Keyboard wiring controls" className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Drag node to node — or wire with the keyboard:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="wire-from">Wire from node</label>
        <select
          id="wire-from"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold"
          style={selectStyle}
        >
          <option value="">From…</option>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <span aria-hidden style={{ color: labColor }}>→</span>
        <label className="sr-only" htmlFor="wire-to">Wire to node</label>
        <select
          id="wire-to"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold"
          style={selectStyle}
        >
          <option value="">To…</option>
          {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button
          type="button"
          disabled={!canConnect}
          onClick={() => { if (canConnect) { onConnect(from, to); setFrom(''); setTo(''); } }}
          className="min-h-11 rounded-xl px-4 text-sm font-bold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: `${labColor}18`,
            color: labColor,
            border: `2px solid ${labColor}40`,
            ['--tw-ring-color' as string]: labColor,
          }}
          aria-label={canConnect ? `Wire ${labelOf(from)} to ${labelOf(to)}` : 'Choose two different nodes to wire'}
        >
          Wire
        </button>
      </div>
    </div>
  );

  return (
    <PixiGameStage
      labColor={labColor}
      ariaLabel="Signal wiring board"
      height={height}
      status={`${connections.length} wires placed across ${nodes.length} nodes.`}
      inspector={{ stage: 'pixi-connect', nodes: nodes.length, connections: connections.length }}
      a11y={a11y}
    >
      {({ width, height: h }) => (
        <ConnectBoardScene
          nodes={nodes}
          connections={connections}
          onConnect={onConnect}
          labColor={labColor}
          reducedMotion={reducedMotion}
          width={width}
          height={h}
          edgeColors={edgeColors}
        />
      )}
    </PixiGameStage>
  );
}
