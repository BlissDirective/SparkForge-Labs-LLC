// src/lib/agentatelier/wireGraph.ts
// ================================================================
// Stage 11D — Agent Atelier (C1)
// ================================================================
// Pure functions for the agent wiring graph: port-type compatibility,
// duplicate-detection, cycle-detection (DFS), and topological order
// for `simulate` execution. No React, no IO, no Zustand — these are
// the deterministic engine the UI calls.
// ================================================================

import type {
  AgentSpec,
  PlacedAgent,
  Port,
  PortType,
  Wire,
  WireGraphError,
} from '@/types/agentAtelier';
import { getAgent } from './agentRoster';

// ─── Port-type compatibility ─────────────────────────────────────

/** Returns true if an output port can feed an input port.
 *
 * Compatibility rules (kid-friendly, intentionally permissive):
 *   • Same-type connections always allowed.
 *   • `text` is a "universal donor" — any output can feed a `text` input.
 *   • `list` outputs may feed `text` inputs (concat at runtime).
 *   • `plan` outputs may feed `list` inputs (each plan-step becomes a list item).
 *   • Otherwise: rejected.
 *
 * These rules also live in copy that the UI surfaces in the `learn-wiring`
 * card so kids understand WHY a connection is rejected. */
export function canConnect(out: Port, into: Port): boolean {
  // Same-type
  if (out.type === into.type) return true;
  // text is universal donor for inputs
  if (into.type === 'text') return true;
  // plan output -> list input (each plan-step becomes a list item)
  if (out.type === 'plan' && into.type === 'list') return true;
  return false;
}

/** Helper: human-readable explanation of why a connection was refused. */
export function explainRejection(out: Port, into: Port): string {
  if (canConnect(out, into)) return '';
  return `${out.name} (${out.type}) can't feed ${into.name} (${into.type}). Wire types don't match.`;
}

// ─── Wire validation ─────────────────────────────────────────────

/** Validates a wire against the current team. Returns null if valid,
 *  or a `WireGraphError` describing the first failure encountered. */
export function validateWire(
  team: PlacedAgent[],
  existingWires: Wire[],
  candidate: Wire,
): WireGraphError | null {
  // Self-wire?
  if (candidate.fromAgentId === candidate.toAgentId) {
    return { kind: 'self-wire' };
  }

  // Find specs for both agents.
  const fromSpec = getAgent(candidate.fromAgentId);
  const toSpec = getAgent(candidate.toAgentId);
  if (!fromSpec || !toSpec) {
    return {
      kind: 'unknown-port',
      agentId: !fromSpec ? candidate.fromAgentId : candidate.toAgentId,
      portName: !fromSpec ? candidate.fromOutputName : candidate.toInputName,
    };
  }

  // Both agents present in team?
  const fromPlaced = team.find((p) => p.agentId === candidate.fromAgentId);
  const toPlaced = team.find((p) => p.agentId === candidate.toAgentId);
  if (!fromPlaced || !toPlaced) {
    return {
      kind: 'unknown-port',
      agentId: !fromPlaced ? candidate.fromAgentId : candidate.toAgentId,
      portName: !fromPlaced ? candidate.fromOutputName : candidate.toInputName,
    };
  }

  // Find ports.
  const out = fromSpec.outputs.find((p) => p.name === candidate.fromOutputName);
  const into = toSpec.inputs.find((p) => p.name === candidate.toInputName);
  if (!out) {
    return { kind: 'unknown-port', agentId: candidate.fromAgentId, portName: candidate.fromOutputName };
  }
  if (!into) {
    return { kind: 'unknown-port', agentId: candidate.toAgentId, portName: candidate.toInputName };
  }

  // Type compatible?
  if (!canConnect(out, into)) {
    return { kind: 'port-type-mismatch', from: out, to: into };
  }

  // Duplicate?
  const dup = existingWires.find(
    (w) =>
      w.fromAgentId === candidate.fromAgentId &&
      w.fromOutputName === candidate.fromOutputName &&
      w.toAgentId === candidate.toAgentId &&
      w.toInputName === candidate.toInputName,
  );
  if (dup) return { kind: 'duplicate-wire' };

  // Would adding this wire create a cycle?
  const provisionalWires = [...existingWires, candidate];
  const cycle = detectCycle(team, provisionalWires);
  if (cycle) return { kind: 'cycle-detected', involvedAgentIds: cycle };

  return null;
}

// ─── Cycle detection (DFS on agent graph) ─────────────────────────

/** Detects a cycle in the directed agent graph. Returns the list of
 *  agentIds involved (in cycle order) if a cycle exists, else null.
 *  Uses standard DFS with white/gray/black coloring. */
export function detectCycle(team: PlacedAgent[], wires: Wire[]): string[] | null {
  // Build adjacency.
  const adj = new Map<string, string[]>();
  for (const p of team) adj.set(p.agentId, []);
  for (const w of wires) {
    const list = adj.get(w.fromAgentId);
    if (list && !list.includes(w.toAgentId)) list.push(w.toAgentId);
  }

  // 0 = white (unvisited), 1 = gray (in stack), 2 = black (done).
  const color = new Map<string, 0 | 1 | 2>();
  for (const id of adj.keys()) color.set(id, 0);

  const path: string[] = [];

  function dfs(node: string): string[] | null {
    color.set(node, 1);
    path.push(node);
    for (const next of adj.get(node) ?? []) {
      const c = color.get(next);
      if (c === 1) {
        // Found cycle — return slice from `next` to end of path.
        const cycleStart = path.indexOf(next);
        return path.slice(cycleStart);
      }
      if (c === 0) {
        const found = dfs(next);
        if (found) return found;
      }
    }
    color.set(node, 2);
    path.pop();
    return null;
  }

  for (const id of adj.keys()) {
    if (color.get(id) === 0) {
      const cycle = dfs(id);
      if (cycle) return cycle;
    }
  }
  return null;
}

// ─── Topological sort (execution order) ──────────────────────────

/** Topological order for `simulate` phase. Throws if a cycle exists
 *  (caller should validate with `detectCycle` first).
 *  Uses Kahn's algorithm so the order is stable when there are
 *  multiple valid topological orderings (smaller in-degree first,
 *  ties broken by agentId alphabetical for determinism). */
export function topologicalOrder(team: PlacedAgent[], wires: Wire[]): string[] {
  const inDeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const p of team) {
    inDeg.set(p.agentId, 0);
    adj.set(p.agentId, []);
  }
  for (const w of wires) {
    inDeg.set(w.toAgentId, (inDeg.get(w.toAgentId) ?? 0) + 1);
    const list = adj.get(w.fromAgentId);
    if (list) list.push(w.toAgentId);
  }

  // Initialize queue with all in-degree-0 nodes, sorted by agentId.
  const ready: string[] = [];
  for (const [id, d] of inDeg.entries()) if (d === 0) ready.push(id);
  ready.sort();

  const order: string[] = [];
  while (ready.length > 0) {
    const id = ready.shift()!;
    order.push(id);
    for (const nxt of adj.get(id) ?? []) {
      const newDeg = (inDeg.get(nxt) ?? 1) - 1;
      inDeg.set(nxt, newDeg);
      if (newDeg === 0) {
        // Insert maintaining sorted order.
        const i = ready.findIndex((r) => r > nxt);
        if (i === -1) ready.push(nxt);
        else ready.splice(i, 0, nxt);
      }
    }
  }

  if (order.length !== team.length) {
    throw new Error('topologicalOrder: graph has a cycle (caller should run detectCycle first)');
  }
  return order;
}

// ─── Helpers for the UI ──────────────────────────────────────────

/** Lists all `from→to` wire candidates that would be type-compatible.
 *  Used to pulse legal target ports while the player drags a wire. */
export function legalTargets(
  fromSpec: AgentSpec,
  fromOutputName: string,
  team: PlacedAgent[],
): Array<{ agentId: string; portName: string; portType: PortType }> {
  const out = fromSpec.outputs.find((p) => p.name === fromOutputName);
  if (!out) return [];
  const result: Array<{ agentId: string; portName: string; portType: PortType }> = [];
  for (const placed of team) {
    if (placed.agentId === fromSpec.id) continue;
    const spec = getAgent(placed.agentId);
    if (!spec) continue;
    for (const inp of spec.inputs) {
      if (canConnect(out, inp)) {
        result.push({ agentId: placed.agentId, portName: inp.name, portType: inp.type });
      }
    }
  }
  return result;
}
