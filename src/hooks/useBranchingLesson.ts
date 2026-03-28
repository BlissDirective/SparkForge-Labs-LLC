'use client';

// ════════════════════════════════════════════════════
// BRANCHING LESSON HOOK — Phase 4: State machine for decision-tree navigation
// Tracks current node, path history, and learning outcomes
// ════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import type { BranchNode } from '@/types';

export interface BranchingLessonState {
  currentNodeId: string;
  currentNode: BranchNode | null;
  path: string[];                  // Node IDs visited in order
  choicesMade: { nodeId: string; choiceLabel: string }[];
  isComplete: boolean;
  progress: number;                // 0-1 estimated completion
  totalNodesVisited: number;
}

export interface UseBranchingLessonReturn extends BranchingLessonState {
  makeChoice: (nextNodeId: string, choiceLabel: string) => void;
  goBack: () => void;
  restart: () => void;
  canGoBack: boolean;
}

export function useBranchingLesson(
  nodes: BranchNode[],
  entryNodeId: string,
  estimatedPaths: number = 3
): UseBranchingLessonReturn {
  const nodeMap = useMemo(() => {
    const map = new Map<string, BranchNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  const [currentNodeId, setCurrentNodeId] = useState(entryNodeId);
  const [path, setPath] = useState<string[]>([entryNodeId]);
  const [choicesMade, setChoicesMade] = useState<{ nodeId: string; choiceLabel: string }[]>([]);

  const currentNode = nodeMap.get(currentNodeId) || null;

  const isComplete = currentNode?.type === 'outcome' && (!currentNode.choices || currentNode.choices.length === 0);

  // Estimate progress based on path length vs estimated total nodes per path
  const avgNodesPerPath = Math.max(1, Math.ceil(nodes.length / estimatedPaths));
  const progress = Math.min(1, path.length / avgNodesPerPath);

  const makeChoice = useCallback((nextNodeId: string, choiceLabel: string) => {
    if (!nodeMap.has(nextNodeId)) return;
    setPath(prev => [...prev, nextNodeId]);
    setChoicesMade(prev => [...prev, { nodeId: currentNodeId, choiceLabel }]);
    setCurrentNodeId(nextNodeId);
  }, [currentNodeId, nodeMap]);

  const goBack = useCallback(() => {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    const prevNodeId = newPath[newPath.length - 1];
    setPath(newPath);
    setChoicesMade(prev => prev.slice(0, -1));
    setCurrentNodeId(prevNodeId);
  }, [path]);

  const restart = useCallback(() => {
    setPath([entryNodeId]);
    setChoicesMade([]);
    setCurrentNodeId(entryNodeId);
  }, [entryNodeId]);

  return {
    currentNodeId,
    currentNode,
    path,
    choicesMade,
    isComplete,
    progress,
    totalNodesVisited: path.length,
    makeChoice,
    goBack,
    restart,
    canGoBack: path.length > 1,
  };
}
