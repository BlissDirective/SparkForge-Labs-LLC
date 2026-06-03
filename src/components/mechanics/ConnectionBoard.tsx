// ════════════════════════════════════════════════════════════════
// CONNECTION BOARD — Node-Link Building Mechanic
// ════════════════════════════════════════════════════════════════
// Players connect nodes to build AI pipelines. Used for:
//   • Building neural network architectures
//   • Creating data processing pipelines
//   • Understanding AI system flows

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw, Zap } from 'lucide-react';
import type { ConnectionNode } from '@/lib/mechanics/GameMechanicKit';
import { validateConnections } from '@/lib/mechanics/GameMechanicKit';

interface ConnectionBoardProps {
  nodes: ConnectionNode[];
  targetConnections: [string, string][];
  onComplete?: (result: { allCorrect: boolean; score: number }) => void;
  onScore?: (points: number) => void;
}

export function ConnectionBoard({ nodes: initialNodes, targetConnections, onComplete, onScore }: ConnectionBoardProps) {
  const [nodes, setNodes] = useState<ConnectionNode[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof validateConnections> | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (submitted) return;

    if (!selectedNode) {
      setSelectedNode(nodeId);
      return;
    }

    if (selectedNode === nodeId) {
      setSelectedNode(null);
      return;
    }

    // Toggle connection
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode) {
        const hasConn = n.connections.includes(nodeId);
        return {
          ...n,
          connections: hasConn
            ? n.connections.filter(c => c !== nodeId)
            : [...n.connections, nodeId],
        };
      }
      if (n.id === nodeId) {
        const hasConn = n.connections.includes(selectedNode);
        return {
          ...n,
          connections: hasConn
            ? n.connections.filter(c => c !== selectedNode)
            : [...n.connections, selectedNode],
        };
      }
      return n;
    }));

    setSelectedNode(null);
  }, [selectedNode, submitted]);

  const handleSubmit = useCallback(() => {
    const result = validateConnections(nodes, targetConnections);
    setValidation(result);
    setSubmitted(true);
    const score = result.totalTargetConnections > 0
      ? Math.round((result.correctConnections / result.totalTargetConnections) * 100)
      : 0;
    onComplete?.({ allCorrect: result.allCorrect, score });
    onScore?.(result.allCorrect ? 20 : Math.round((result.correctConnections / result.totalTargetConnections) * 15));
  }, [nodes, targetConnections, onComplete, onScore]);

  const handleReset = useCallback(() => {
    setNodes(initialNodes.map(n => ({ ...n, connections: [] })));
    setSubmitted(false);
    setValidation(null);
    setSelectedNode(null);
  }, [initialNodes]);

  // Build connection lines
  const lines: { from: ConnectionNode; to: ConnectionNode; correct: boolean; extra: boolean }[] = [];
  const processed = new Set<string>();

  for (const node of nodes) {
    for (const connId of node.connections) {
      const pair = [node.id, connId].sort().join('-');
      if (processed.has(pair)) continue;
      processed.add(pair);

      const targetPair = [...targetConnections.find(c =>
        (c[0] === node.id && c[1] === connId) || (c[0] === connId && c[1] === node.id)
      ) || []].sort().join('-');

      const toNode = nodes.find(n => n.id === connId);
      if (toNode) {
        lines.push({
          from: node,
          to: toNode,
          correct: pair === targetPair && submitted,
          extra: pair !== targetPair && submitted,
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* SVG Board */}
      <div className="relative rounded-xl bg-slate-900/60 border border-slate-700/30 overflow-hidden" style={{ minHeight: 300 }}>
        <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Connection lines */}
          {lines.map((line, i) => {
            const pair = [line.from.id, line.to.id].sort().join('-');
            return (
              <line
                key={pair}
                x1={line.from.x} y1={line.from.y}
                x2={line.to.x} y2={line.to.y}
                stroke={submitted
                  ? line.correct ? '#10B981' : line.extra ? '#EF4444' : '#6B7280'
                  : selectedNode && (line.from.id === selectedNode || line.to.id === selectedNode)
                    ? '#4F6EF7'
                    : '#374151'
                }
                strokeWidth={submitted && line.correct ? 1 : 0.8}
                strokeDasharray={submitted && line.extra ? "2,2" : "none"}
              />
            );
          })}

          {/* Missing target connections (shown after submit) */}
          {submitted && validation?.missingConnections.map(([a, b], i) => {
            const nodeA = nodes.find(n => n.id === a);
            const nodeB = nodes.find(n => n.id === b);
            if (!nodeA || !nodeB) return null;
            return (
              <line
                key={`missing-${i}`}
                x1={nodeA.x} y1={nodeA.y}
                x2={nodeB.x} y2={nodeB.y}
                stroke="#F59E0B"
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.6}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const isConnected = selectedNode && nodes.find(n => n.id === selectedNode)?.connections.includes(node.id);

          return (
            <motion.button
              key={node.id}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2
                flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                ${isSelected ? 'border-indigo-400 shadow-lg shadow-indigo-500/30 z-10' : ''}
                ${isConnected ? 'border-emerald-400/50' : 'border-slate-600/40'}
                ${submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              `}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                background: `${node.color || '#3B82F6'}15`,
              }}
              onClick={() => handleNodeClick(node.id)}
              whileHover={!submitted ? { scale: 1.1 } : {}}
              whileTap={!submitted ? { scale: 0.95 } : {}}
            >
              <span className="text-xl">{node.emoji || '🔵'}</span>
              <span className="text-[9px] font-semibold text-white whitespace-nowrap">{node.label}</span>
              <span className="text-[8px] text-slate-500 capitalize">{node.type}</span>
              {node.connections.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[9px] text-white flex items-center justify-center">
                  {node.connections.length}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Instructions */}
      {!submitted && (
        <p className="text-xs text-slate-400 text-center">
          {selectedNode
            ? 'Click another node to connect (or click the same node to cancel)'
            : 'Click a node to start a connection, then click another to connect them'}
        </p>
      )}

      {/* Validation feedback */}
      {submitted && validation && (
        <div className={`rounded-lg p-3 text-xs ${validation.allCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
          <div className="flex items-center gap-2 mb-1">
            {validation.allCorrect ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            <span className="font-semibold">
              {validation.allCorrect ? 'Perfect connections!' : `${validation.correctConnections}/${validation.totalTargetConnections} connections correct`}
            </span>
          </div>
          {validation.missingConnections.length > 0 && (
            <p className="text-slate-400 mt-1">Orange dashed lines show missing connections</p>
          )}
          {validation.extraConnections.length > 0 && (
            <p className="text-slate-400 mt-1">Red dashed lines are extra/incorrect connections</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!submitted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
          >
            Check Connections
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </motion.button>
        )}
      </div>
    </div>
  );
}
