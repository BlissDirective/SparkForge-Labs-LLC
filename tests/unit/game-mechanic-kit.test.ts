// ════════════════════════════════════════════════════
// GAME MECHANIC KIT TESTS
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  validateDragDrop,
  validateConnections,
  validateCodeSequence,
  validateSorting,
  calculateMechanicScore,
  DEMO_DRAG_ITEMS,
  DEMO_DROP_ZONES,
  DEMO_NODES,
  DEMO_CODE_BLOCKS,
  DEMO_CHOICE_CARDS,
  DEMO_SORTABLE_ITEMS,
  MECHANIC_DIFFICULTY,
} from '@/lib/mechanics/GameMechanicKit';
import type { DropZone, ConnectionNode, CodeBlock, SortableItem } from '@/lib/mechanics/GameMechanicKit';

// ─── Drag Drop Validation ───

describe('validateDragDrop', () => {
  it('returns allCorrect when all items in right zones', () => {
    const zones: DropZone[] = [
      { id: 'z1', label: 'Zone 1', acceptedCategories: ['a'], items: [{ id: 'i1', label: 'Item 1', category: 'a' }] },
      { id: 'z2', label: 'Zone 2', acceptedCategories: ['b'], items: [{ id: 'i2', label: 'Item 2', category: 'b' }] },
    ];
    const result = validateDragDrop(zones);
    expect(result.allCorrect).toBe(true);
    expect(result.zoneResults[0].correct).toBe(1);
  });

  it('detects misplaced items', () => {
    const zones: DropZone[] = [
      { id: 'z1', label: 'Zone 1', acceptedCategories: ['a'], items: [{ id: 'i1', label: 'Item 1', category: 'b' }] },
    ];
    const result = validateDragDrop(zones);
    expect(result.allCorrect).toBe(false);
    expect(result.zoneResults[0].misplaced.length).toBe(1);
  });

  it('returns true when no acceptedCategories', () => {
    const zones: DropZone[] = [
      { id: 'z1', label: 'Zone 1', items: [{ id: 'i1', label: 'Item 1', category: 'a' }] },
    ];
    const result = validateDragDrop(zones);
    expect(result.allCorrect).toBe(true);
  });

  it('handles empty zones', () => {
    const zones: DropZone[] = [
      { id: 'z1', label: 'Zone 1', acceptedCategories: ['a'], items: [] },
    ];
    const result = validateDragDrop(zones);
    expect(result.allCorrect).toBe(false); // Empty zone = not all correct
  });
});

// ─── Connection Validation ───

describe('validateConnections', () => {
  it('returns allCorrect when connections match', () => {
    const nodes: ConnectionNode[] = [
      { id: 'a', label: 'A', x: 0, y: 0, type: 'input', connections: ['b'] },
      { id: 'b', label: 'B', x: 10, y: 10, type: 'output', connections: ['a'] },
    ];
    const result = validateConnections(nodes, [['a', 'b']]);
    expect(result.allCorrect).toBe(true);
    expect(result.correctConnections).toBe(1);
  });

  it('detects missing connections', () => {
    const nodes: ConnectionNode[] = [
      { id: 'a', label: 'A', x: 0, y: 0, type: 'input', connections: [] },
      { id: 'b', label: 'B', x: 10, y: 10, type: 'output', connections: [] },
    ];
    const result = validateConnections(nodes, [['a', 'b']]);
    expect(result.allCorrect).toBe(false);
    expect(result.missingConnections.length).toBe(1);
  });

  it('detects extra connections', () => {
    const nodes: ConnectionNode[] = [
      { id: 'a', label: 'A', x: 0, y: 0, type: 'input', connections: ['b', 'c'] },
      { id: 'b', label: 'B', x: 10, y: 10, type: 'output', connections: ['a'] },
      { id: 'c', label: 'C', x: 20, y: 20, type: 'output', connections: ['a'] },
    ];
    const result = validateConnections(nodes, [['a', 'b']]);
    expect(result.allCorrect).toBe(false);
    expect(result.extraConnections.length).toBe(1);
  });

  it('handles bidirectional connections', () => {
    const nodes: ConnectionNode[] = [
      { id: 'a', label: 'A', x: 0, y: 0, type: 'input', connections: ['b'] },
      { id: 'b', label: 'B', x: 10, y: 10, type: 'output', connections: [] },
    ];
    const result = validateConnections(nodes, [['b', 'a']]);
    expect(result.allCorrect).toBe(true);
  });
});

// ─── Code Sequence Validation ───

describe('validateCodeSequence', () => {
  it('returns allCorrect for perfect sequence', () => {
    const blocks: CodeBlock[] = [
      { id: '1', label: 'Start', type: 'start' },
      { id: '2', label: 'Action', type: 'action' },
      { id: '3', label: 'End', type: 'end' },
    ];
    const result = validateCodeSequence(blocks, ['start', 'action', 'end']);
    expect(result.allCorrect).toBe(true);
    expect(result.correctPositions).toBe(3);
  });

  it('detects wrong position', () => {
    const blocks: CodeBlock[] = [
      { id: '1', label: 'Start', type: 'start' },
      { id: '2', label: 'Wrong', type: 'end' },
      { id: '3', label: 'Action', type: 'action' },
    ];
    const result = validateCodeSequence(blocks, ['start', 'action', 'end']);
    expect(result.allCorrect).toBe(false);
    expect(result.correctPositions).toBe(1);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('detects wrong length', () => {
    const blocks: CodeBlock[] = [
      { id: '1', label: 'Start', type: 'start' },
    ];
    const result = validateCodeSequence(blocks, ['start', 'action', 'end']);
    expect(result.allCorrect).toBe(false);
    expect(result.feedback.some(f => f.includes('Expected'))).toBe(true);
  });
});

// ─── Sorting Validation ───

describe('validateSorting', () => {
  it('returns allCorrect for perfect order', () => {
    const items: SortableItem[] = [
      { id: 'a', label: 'A', correctPosition: 0, currentPosition: 0 },
      { id: 'b', label: 'B', correctPosition: 1, currentPosition: 1 },
      { id: 'c', label: 'C', correctPosition: 2, currentPosition: 2 },
    ];
    const result = validateSorting(items);
    expect(result.allCorrect).toBe(true);
    expect(result.correctPositions).toBe(3);
    expect(result.inversions.length).toBe(0);
  });

  it('detects inversions', () => {
    const items: SortableItem[] = [
      { id: 'b', label: 'B', correctPosition: 1, currentPosition: 0 },
      { id: 'a', label: 'A', correctPosition: 0, currentPosition: 1 },
    ];
    const result = validateSorting(items);
    expect(result.allCorrect).toBe(false);
    expect(result.inversions.length).toBe(1);
  });

  it('counts correct positions', () => {
    const items: SortableItem[] = [
      { id: 'a', label: 'A', correctPosition: 0, currentPosition: 0 },
      { id: 'b', label: 'B', correctPosition: 1, currentPosition: 2 },
      { id: 'c', label: 'C', correctPosition: 2, currentPosition: 1 },
    ];
    const result = validateSorting(items);
    expect(result.correctPositions).toBe(1);
  });
});

// ─── Scoring ───

describe('calculateMechanicScore', () => {
  it('gives 100 for perfect score', () => {
    const result = calculateMechanicScore(10, 10, 1, 30);
    expect(result.score).toBe(100);
    expect(result.stars).toBe(3);
  });

  it('gives time bonus for fast completion', () => {
    const fast = calculateMechanicScore(10, 10, 1, 30);
    const slow = calculateMechanicScore(10, 10, 1, 200);
    expect(fast.score).toBeGreaterThan(slow.score);
  });

  it('applies attempt penalty', () => {
    const first = calculateMechanicScore(10, 10, 1, 60);
    const retry = calculateMechanicScore(10, 10, 3, 60);
    expect(first.score).toBeGreaterThan(retry.score);
  });

  it('gives 3 stars for 90+', () => {
    expect(calculateMechanicScore(9, 10, 1, 30).stars).toBe(3);
  });

  it('gives 2 stars for 60-89', () => {
    expect(calculateMechanicScore(7, 10, 1, 90).stars).toBe(2);
  });

  it('gives 1 star for 30-59', () => {
    expect(calculateMechanicScore(5, 10, 2, 120).stars).toBe(1);
  });

  it('gives 0 stars below 30', () => {
    expect(calculateMechanicScore(1, 10, 5, 200).stars).toBe(0);
  });

  it('handles zero total', () => {
    expect(calculateMechanicScore(0, 0, 0, 0).score).toBe(0);
  });
});

// ─── Demo Data Tests ───

describe('DEMO_DRAG_ITEMS', () => {
  it('has items with categories', () => {
    expect(DEMO_DRAG_ITEMS.length).toBeGreaterThan(0);
    for (const item of DEMO_DRAG_ITEMS) {
      expect(item.category).toBeTruthy();
      expect(item.label).toBeTruthy();
    }
  });

  it('categories match drop zones', () => {
    const itemCats = new Set(DEMO_DRAG_ITEMS.map(i => i.category));
    const zoneCats = new Set(DEMO_DROP_ZONES.flatMap(z => z.acceptedCategories || []));
    for (const cat of itemCats) {
      if (cat === undefined) continue;
      expect(zoneCats.has(cat)).toBe(true);
    }
  });
});

describe('DEMO_DROP_ZONES', () => {
  it('has accepted categories', () => {
    for (const zone of DEMO_DROP_ZONES) {
      expect(zone.acceptedCategories).toBeDefined();
      expect(zone.acceptedCategories!.length).toBeGreaterThan(0);
    }
  });
});

describe('DEMO_NODES', () => {
  it('has valid positions', () => {
    for (const node of DEMO_NODES) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(100);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(100);
    }
  });

  it('has node types', () => {
    for (const node of DEMO_NODES) {
      expect(['input', 'process', 'output']).toContain(node.type);
    }
  });
});

describe('DEMO_CODE_BLOCKS', () => {
  it('starts with start type', () => {
    expect(DEMO_CODE_BLOCKS[0].type).toBe('start');
  });

  it('ends with end type', () => {
    const endBlock = DEMO_CODE_BLOCKS[DEMO_CODE_BLOCKS.length - 1];
    expect(endBlock.type).toBe('end');
  });

  it('has diverse block types', () => {
    const types = new Set(DEMO_CODE_BLOCKS.map(b => b.type));
    expect(types.size).toBeGreaterThan(2);
  });
});

describe('DEMO_CHOICE_CARDS', () => {
  it('has consequences for each card', () => {
    for (const card of DEMO_CHOICE_CARDS) {
      expect(card.consequences).toBeDefined();
      expect(card.consequences!.length).toBeGreaterThan(0);
    }
  });

  it('has diverse consequence types', () => {
    const types = new Set(DEMO_CHOICE_CARDS.flatMap(c => c.consequences?.map(co => co.type) || []));
    expect(types.size).toBeGreaterThan(0);
  });
});

describe('DEMO_SORTABLE_ITEMS', () => {
  it('has sequential correct positions', () => {
    const positions = DEMO_SORTABLE_ITEMS.map(i => i.correctPosition).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBe(i);
    }
  });
});

// ─── Difficulty Config ───

describe('MECHANIC_DIFFICULTY', () => {
  it('has ascending time limits', () => {
    expect(MECHANIC_DIFFICULTY.hard.timeLimit).toBeLessThan(MECHANIC_DIFFICULTY.medium.timeLimit);
    expect(MECHANIC_DIFFICULTY.medium.timeLimit).toBeLessThan(MECHANIC_DIFFICULTY.easy.timeLimit);
  });

  it('has ascending points per correct', () => {
    expect(MECHANIC_DIFFICULTY.easy.pointsPerCorrect).toBeLessThan(MECHANIC_DIFFICULTY.hard.pointsPerCorrect);
  });

  it('has descending hint counts', () => {
    expect(MECHANIC_DIFFICULTY.hard.hintCount).toBeLessThan(MECHANIC_DIFFICULTY.easy.hintCount);
  });
});
