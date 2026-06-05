// ════════════════════════════════════════════════════════════════
// GAME MECHANIC KIT — Reusable Gameplay Building Blocks
// ════════════════════════════════════════════════════════════════
// Composable, accessible, animated mechanic components that can be
// mixed and matched to create diverse game experiences.
//
// Replaces repetitive quiz patterns with:
//   • Drag-and-drop classification/sorting
//   • Node-connection building
//   • Visual block programming
//   • Card-based choices with consequences
//   • Interactive simulation canvases
//   • Timeline/sequencing puzzles

// ═══ TYPES ═══

/** A draggable item in a drag-drop game */
export interface MechanicItem {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  category?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/** A drop zone/target bucket */
export interface DropZone {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  acceptedCategories?: string[];
  items: MechanicItem[];
  maxItems?: number;
}

/** A node in a connection board */
export interface ConnectionNode {
  id: string;
  label: string;
  emoji?: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  color?: string;
  type: 'input' | 'process' | 'output';
  connections: string[]; // IDs of connected nodes
}

/** A code block for visual programming */
export interface CodeBlock {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  type: 'start' | 'action' | 'condition' | 'loop' | 'end';
  slots?: CodeBlockSlot[];
  description?: string;
}

export interface CodeBlockSlot {
  id: string;
  label: string;
  filledBy?: string; // Block ID that fills this slot
  acceptedTypes?: CodeBlock['type'][];
}

/** A card in a choice deck */
export interface ChoiceCard {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  color?: string;
  consequences?: CardConsequence[];
  category?: string;
}

export interface CardConsequence {
  type: 'xp' | 'hint' | 'penalty' | 'story' | 'unlock';
  value: number | string;
  description: string;
}

/** A sortable item with order */
export interface SortableItem extends MechanicItem {
  correctPosition: number;
  currentPosition: number;
}

/** A simulation entity */
export interface SimEntity {
  id: string;
  label: string;
  emoji: string;
  x: number;
  y: number;
  state: 'idle' | 'active' | 'processing' | 'done' | 'error';
  connections: string[];
  properties: Record<string, number | string | boolean>;
}

// ═══ VALIDATION ═══

/** Check if all items are in correct zones */
export function validateDragDrop(zones: DropZone[]): {
  allCorrect: boolean;
  zoneResults: { zoneId: string; correct: number; total: number; misplaced: MechanicItem[] }[];
} {
  const zoneResults = zones.map(zone => {
    const misplaced = zone.items.filter(item => {
      if (!zone.acceptedCategories || zone.acceptedCategories.length === 0) return false;
      return item.category ? !zone.acceptedCategories.includes(item.category) : false;
    });
    return {
      zoneId: zone.id,
      correct: zone.items.length - misplaced.length,
      total: zone.items.length,
      misplaced,
    };
  });

  const allCorrect = zoneResults.every(z => z.misplaced.length === 0 && z.total > 0);
  return { allCorrect, zoneResults };
}

/** Check if connection board matches target topology */
export function validateConnections(
  nodes: ConnectionNode[],
  targetConnections: [string, string][],
): {
  allCorrect: boolean;
  correctConnections: number;
  totalTargetConnections: number;
  extraConnections: [string, string][];
  missingConnections: [string, string][];
} {
  const actual = new Set<string>();
  for (const node of nodes) {
    for (const conn of node.connections) {
      const pair = [node.id, conn].sort().join('-');
      actual.add(pair);
    }
  }

  const targets = new Set(targetConnections.map(c => [...c].sort().join('-')));

  let correctConnections = 0;
  const extraConnections: [string, string][] = [];
  const missingConnections: [string, string][] = [];

  for (const a of actual) {
    if (targets.has(a)) correctConnections++;
    else extraConnections.push(a.split('-') as [string, string]);
  }

  for (const t of targets) {
    if (!actual.has(t)) missingConnections.push(t.split('-') as [string, string]);
  }

  return {
    allCorrect: correctConnections === targets.size && extraConnections.length === 0,
    correctConnections,
    totalTargetConnections: targets.size,
    extraConnections,
    missingConnections,
  };
}

/** Check if code blocks are in correct sequence */
export function validateCodeSequence(
  sequence: CodeBlock[],
  expectedOrder: CodeBlock['type'][],
): {
  allCorrect: boolean;
  correctPositions: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let correctPositions = 0;

  for (let i = 0; i < Math.min(sequence.length, expectedOrder.length); i++) {
    if (sequence[i].type === expectedOrder[i]) {
      correctPositions++;
    } else {
      feedback.push(`Position ${i + 1}: Expected ${expectedOrder[i]}, got ${sequence[i].type}`);
    }
  }

  if (sequence.length !== expectedOrder.length) {
    feedback.push(`Expected ${expectedOrder.length} blocks, got ${sequence.length}`);
  }

  return {
    allCorrect: correctPositions === expectedOrder.length && sequence.length === expectedOrder.length,
    correctPositions,
    feedback,
  };
}

/** Check if items are in correct sorted order */
export function validateSorting(items: SortableItem[]): {
  allCorrect: boolean;
  correctPositions: number;
  inversions: [SortableItem, SortableItem][];
} {
  const inversions: [SortableItem, SortableItem][] = [];
  let correctPositions = 0;

  // An item is in the right place when its CURRENT position matches its
  // CORRECT position (each item carries both; we never assume array order).
  for (const item of items) {
    if (item.currentPosition === item.correctPosition) correctPositions++;
  }

  // Inversions: pairs out of order in the current arrangement — an
  // earlier-placed item that should actually come later.
  const byCurrent = [...items].sort((a, b) => a.currentPosition - b.currentPosition);
  for (let i = 0; i < byCurrent.length; i++) {
    for (let j = i + 1; j < byCurrent.length; j++) {
      if (byCurrent[i].correctPosition > byCurrent[j].correctPosition) {
        inversions.push([byCurrent[i], byCurrent[j]]);
      }
    }
  }

  return {
    allCorrect: inversions.length === 0,
    correctPositions,
    inversions,
  };
}

/** Calculate score from mechanic results */
export function calculateMechanicScore(
  correct: number,
  total: number,
  attempts: number,
  timeSeconds: number,
): { score: number; stars: number } {
  if (total === 0) return { score: 0, stars: 0 };

  const accuracy = correct / total;
  const attemptPenalty = Math.max(0, (attempts - 1) * 0.1);
  const timeBonus = timeSeconds < 60 ? 0.2 : timeSeconds < 120 ? 0.1 : 0;

  // Accuracy contributes up to 80 points; a speed bonus of up to +20
  // differentiates fast vs slow runs even at perfect accuracy (so a fast
  // perfect run scores 100 while a slow perfect run scores 80).
  const rawScore = Math.round((accuracy * 0.8 + timeBonus - attemptPenalty) * 100);
  const score = Math.max(0, Math.min(100, rawScore));

  const stars = score >= 90 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;

  return { score, stars };
}

// ═══ SCORING CONFIGS ═══

export const MECHANIC_DIFFICULTY = {
  easy: { timeLimit: 180, hintCount: 3, pointsPerCorrect: 10 },
  medium: { timeLimit: 120, hintCount: 2, pointsPerCorrect: 15 },
  hard: { timeLimit: 60, hintCount: 1, pointsPerCorrect: 20 },
} as const;

// ═══ DEMO DATA ═══

/** Demo items for drag-drop classification games */
export const DEMO_DRAG_ITEMS: MechanicItem[] = [
  { id: 'photo', label: 'Family Photo', emoji: '🖼️', category: 'personal', color: '#3B82F6' },
  { id: 'password', label: 'Password', emoji: '🔑', category: 'sensitive', color: '#EF4444' },
  { id: 'search', label: 'Search History', emoji: '🔍', category: 'behavioral', color: '#F59E0B' },
  { id: 'name', label: 'Your Name', emoji: '📝', category: 'personal', color: '#3B82F6' },
  { id: 'location', label: 'GPS Location', emoji: '📍', category: 'sensitive', color: '#EF4444' },
  { id: 'likes', label: 'Video Likes', emoji: '👍', category: 'behavioral', color: '#F59E0B' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂', category: 'personal', color: '#3B82F6' },
  { id: 'fingerprint', label: 'Fingerprint', emoji: '👆', category: 'sensitive', color: '#EF4444' },
];

export const DEMO_DROP_ZONES: DropZone[] = [
  { id: 'personal', label: 'Personal Info', emoji: '👤', color: '#3B82F6', acceptedCategories: ['personal'], items: [] },
  { id: 'sensitive', label: 'Sensitive Data', emoji: '🔒', color: '#EF4444', acceptedCategories: ['sensitive'], items: [] },
  { id: 'behavioral', label: 'Behavioral Data', emoji: '📊', color: '#F59E0B', acceptedCategories: ['behavioral'], items: [] },
];

/** Demo nodes for connection board */
export const DEMO_NODES: ConnectionNode[] = [
  { id: 'camera', label: 'Camera', emoji: '📷', x: 10, y: 20, color: '#3B82F6', type: 'input', connections: [] },
  { id: 'detect', label: 'Object Detection', emoji: '🔍', x: 40, y: 20, color: '#8B5CF6', type: 'process', connections: [] },
  { id: 'classify', label: 'Classification', emoji: '🏷️', x: 40, y: 60, color: '#8B5CF6', type: 'process', connections: [] },
  { id: 'output', label: 'Label', emoji: '🏷️', x: 70, y: 40, color: '#10B981', type: 'output', connections: [] },
];

/** Demo code blocks for visual programming */
export const DEMO_CODE_BLOCKS: CodeBlock[] = [
  { id: 'start', label: 'Start', emoji: '▶️', color: '#10B981', type: 'start', description: 'Program begins here' },
  { id: 'get-image', label: 'Get Image', emoji: '📷', color: '#3B82F6', type: 'action', description: 'Load an image from the camera' },
  { id: 'detect-faces', label: 'Detect Faces', emoji: '😊', color: '#3B82F6', type: 'action', description: 'Find faces in the image' },
  { id: 'has-faces', label: 'Faces Found?', emoji: '❓', color: '#F59E0B', type: 'condition', description: 'Check if any faces were detected' },
  { id: 'blur', label: 'Blur Faces', emoji: '🔲', color: '#8B5CF6', type: 'action', description: 'Apply blur to protect privacy' },
  { id: 'save', label: 'Save Image', emoji: '💾', color: '#3B82F6', type: 'action', description: 'Save the processed image' },
  { id: 'end', label: 'End', emoji: '🛑', color: '#EF4444', type: 'end', description: 'Program ends' },
];

/** Demo cards for choice deck */
export const DEMO_CHOICE_CARDS: ChoiceCard[] = [
  {
    id: 'ask-consent', title: 'Ask for Consent', emoji: '🙋',
    description: 'Before using someone\'s photo in your AI training, ask them if it\'s okay.',
    color: '#10B981',
    consequences: [{ type: 'xp', value: 20, description: '+20 XP for respecting privacy!' }],
  },
  {
    id: 'blur-faces', title: 'Blur All Faces', emoji: '🔲',
    description: 'Automatically blur every face in your dataset to protect people\'s identities.',
    color: '#3B82F6',
    consequences: [{ type: 'xp', value: 15, description: '+15 XP for safety measures!' }],
  },
  {
    id: 'use-anyway', title: 'Use Without Asking', emoji: '😬',
    description: 'Just use the photos you find online without asking anyone.',
    color: '#EF4444',
    consequences: [{ type: 'penalty', value: -10, description: '-10 XP — Privacy matters!' }],
  },
];

/** Demo sortable items */
export const DEMO_SORTABLE_ITEMS: SortableItem[] = [
  { id: 'data', label: 'Collect Data', emoji: '📥', correctPosition: 0, currentPosition: 0, color: '#3B82F6' },
  { id: 'clean', label: 'Clean Data', emoji: '🧹', correctPosition: 1, currentPosition: 1, color: '#8B5CF6' },
  { id: 'train', label: 'Train Model', emoji: '🧠', correctPosition: 2, currentPosition: 2, color: '#F59E0B' },
  { id: 'test', label: 'Test Model', emoji: '✅', correctPosition: 3, currentPosition: 3, color: '#10B981' },
  { id: 'deploy', label: 'Deploy', emoji: '🚀', correctPosition: 4, currentPosition: 4, color: '#EF4444' },
];
