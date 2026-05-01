// src/lib/mcplab/toolCatalog.ts
// ════════════════════════════════════════════════════════════════
// Stage 11E — MCP Plug-and-Play Lab (C6, Lab 11)
// ════════════════════════════════════════════════════════════════
// 14 starter tools across 7 categories. Tools are static catalog
// data (parallel to AGENT_ROSTER in Stage 11D) — no runtime fetches,
// no DB lookups. The `description` field is the pedagogical hook:
// kids will see how rewriting a description changes how an agent
// uses the same tool.
// ════════════════════════════════════════════════════════════════

import type { Tool } from '@/types/mcplab';

export const TOOL_CATALOG: readonly Tool[] = [
  // ─── Math (3) ──────────────────────────────────────────────
  {
    id: 'calculator',
    name: 'Calculator',
    blurb: 'Adds, subtracts, multiplies, divides',
    category: 'math',
    inputType: 'tool_request',
    outputType: 'number',
    description: 'A four-function calculator. Send it any math expression in plain text and it returns the answer as a number.',
    sideEffect: 'read-only',
    unlockTier: 'A',
    emoji: '🧮',
    accentHex: '#0FB8FA',
    defaultConfigJson: { precision: 2 },
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    blurb: 'Switches between miles, km, ounces, etc.',
    category: 'math',
    inputType: 'tool_request',
    outputType: 'number',
    description: 'Converts between common units of length, mass, volume, and temperature. Send it the value, the from-unit, and the to-unit.',
    sideEffect: 'read-only',
    unlockTier: 'A',
    emoji: '📐',
    accentHex: '#10BAD2',
  },
  {
    id: 'formula-solver',
    name: 'Formula Solver',
    blurb: 'Solves common formulas (area, distance, etc.)',
    category: 'math',
    inputType: 'tool_request',
    outputType: 'number',
    description: 'Solves geometry and physics formulas. Send it the formula name (like "rectangle area") plus the inputs.',
    sideEffect: 'read-only',
    unlockTier: 'B',
    emoji: '🧪',
    accentHex: '#0FB8FA',
  },

  // ─── Time (2) ──────────────────────────────────────────────
  {
    id: 'calendar',
    name: 'Calendar',
    blurb: 'Knows what day, month, and year it is',
    category: 'time',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'A calendar for the current year. Returns the day-of-week for any date, or which holidays fall in a given month.',
    sideEffect: 'read-only',
    unlockTier: 'A',
    emoji: '📅',
    accentHex: '#D9A430',
  },
  {
    id: 'timer',
    name: 'Timer',
    blurb: 'Counts down minutes for a task',
    category: 'time',
    inputType: 'tool_request',
    outputType: 'number',
    description: 'A countdown timer. Send it a duration in minutes; it returns the elapsed time when checked.',
    sideEffect: 'sandboxed',
    unlockTier: 'A',
    emoji: '⏱️',
    accentHex: '#D9A430',
  },

  // ─── Language (3) ──────────────────────────────────────────
  {
    id: 'dictionary',
    name: 'Dictionary',
    blurb: 'Defines words',
    category: 'language',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'A kid-safe dictionary. Send it a word; returns the definition plus an example sentence.',
    sideEffect: 'read-only',
    unlockTier: 'A',
    emoji: '📖',
    accentHex: '#B67BFF',
  },
  {
    id: 'thesaurus',
    name: 'Thesaurus',
    blurb: 'Suggests synonyms and antonyms',
    category: 'language',
    inputType: 'tool_request',
    outputType: 'list',
    description: 'A kid-safe thesaurus. Send it a word; returns a list of similar words and a list of opposite words.',
    sideEffect: 'read-only',
    unlockTier: 'B',
    emoji: '🪶',
    accentHex: '#B67BFF',
  },
  {
    id: 'translator-tool',
    name: 'Translator Tool',
    blurb: 'Translates between languages',
    category: 'language',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'Translates short kid-safe phrases between English, Spanish, French, and Mandarin. Send the text and the target language.',
    sideEffect: 'read-only',
    unlockTier: 'B',
    emoji: '🌐',
    accentHex: '#FF70AF',
  },

  // ─── Web (2) ───────────────────────────────────────────────
  {
    id: 'web-fetch',
    name: 'Web Fetch',
    blurb: 'Reads a kid-safe webpage',
    category: 'web',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'Fetches text from a pre-approved kid-safe URL allowlist (school sites, encyclopedias). Returns the cleaned-up text.',
    sideEffect: 'cached-fetch',
    unlockTier: 'C',
    emoji: '🌍',
    accentHex: '#00D17A',
  },
  {
    id: 'safe-search',
    name: 'Safe Search',
    blurb: 'Searches a kid-safe index',
    category: 'web',
    inputType: 'tool_request',
    outputType: 'list',
    description: 'Searches a curated kid-safe content index. Returns a ranked list of result titles + snippets.',
    sideEffect: 'cached-fetch',
    unlockTier: 'C',
    emoji: '🔎',
    accentHex: '#00D17A',
  },

  // ─── Creative (2) ──────────────────────────────────────────
  {
    id: 'doodle-maker',
    name: 'Doodle Maker',
    blurb: 'Draws simple SVG sketches',
    category: 'creative',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'Draws a simple sketch from a description (a cat, a tree, a robot). Returns the SVG markup as text.',
    sideEffect: 'sandboxed',
    unlockTier: 'B',
    emoji: '🎨',
    accentHex: '#DE5AEA',
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    blurb: 'Suggests color palettes',
    category: 'creative',
    inputType: 'tool_request',
    outputType: 'list',
    description: 'Suggests a 5-color palette for a mood or theme. Returns the palette as a list of HEX codes.',
    sideEffect: 'read-only',
    unlockTier: 'A',
    emoji: '🎨',
    accentHex: '#DE5AEA',
  },

  // ─── Data (1) ──────────────────────────────────────────────
  {
    id: 'chart-builder',
    name: 'Chart Builder',
    blurb: 'Turns numbers into a tiny chart',
    category: 'data',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'Takes a list of labels + numbers and returns a simple bar-chart description in text form.',
    sideEffect: 'sandboxed',
    unlockTier: 'B',
    emoji: '📊',
    accentHex: '#E68E28',
  },

  // ─── Utility (1) ───────────────────────────────────────────
  {
    id: 'notepad',
    name: 'Notepad',
    blurb: 'Stores short notes for later',
    category: 'utility',
    inputType: 'tool_request',
    outputType: 'text',
    description: 'A scratchpad. Agents can store key=value notes and recall them later in the same session.',
    sideEffect: 'sandboxed',
    unlockTier: 'A',
    emoji: '📝',
    accentHex: '#8F96FA',
  },
] as const;

// ─── Lookup helpers ──────────────────────────────────────────────

export function getTool(id: string): Tool | undefined {
  return TOOL_CATALOG.find((t) => t.id === id);
}

/** Tools available at a given band (tier A always; B adds tier B; C adds B+C). */
export function toolsForBand(band: 'A' | 'B' | 'C'): Tool[] {
  if (band === 'A') return TOOL_CATALOG.filter((t) => t.unlockTier === 'A');
  if (band === 'B') return TOOL_CATALOG.filter((t) => t.unlockTier === 'A' || t.unlockTier === 'B');
  return [...TOOL_CATALOG];
}

export function toolsByCategory(category: Tool['category']): Tool[] {
  return TOOL_CATALOG.filter((t) => t.category === category);
}

// ─── Category display metadata ───────────────────────────────────

export const CATEGORY_META: Record<Tool['category'], { label: string; emoji: string; color: string }> = {
  math:     { label: 'Math',     emoji: '🧮', color: '#0FB8FA' },
  time:     { label: 'Time',     emoji: '⏱️',  color: '#D9A430' },
  language: { label: 'Language', emoji: '📖', color: '#B67BFF' },
  web:      { label: 'Web',      emoji: '🌍', color: '#00D17A' },
  creative: { label: 'Creative', emoji: '🎨', color: '#DE5AEA' },
  data:     { label: 'Data',     emoji: '📊', color: '#E68E28' },
  utility:  { label: 'Utility',  emoji: '📝', color: '#8F96FA' },
};

// ─── Side-effect badge metadata ──────────────────────────────────

export const SIDE_EFFECT_META: Record<Tool['sideEffect'], { label: string; tone: 'safe' | 'caution' | 'warn' }> = {
  'read-only':    { label: 'Read-only',     tone: 'safe' },
  'sandboxed':    { label: 'Sandboxed',     tone: 'safe' },
  'cached-fetch': { label: 'Cached fetch',  tone: 'caution' },
  'network':      { label: 'Network',       tone: 'warn' },
};
