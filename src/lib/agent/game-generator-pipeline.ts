// ════════════════════════════════════════════════════
// GAME GENERATOR PIPELINE — Phase 9: Full new game creation
// 9-stage: Concept → Design → 3D Plan → Code Gen → Registry → Test → Safety → Review → Publish
// ════════════════════════════════════════════════════

import { createAdminClient } from '@/lib/supabase/server';
import { MODELS } from './prompts';
import {
  GAME_CONCEPT_PROMPT,
  GAME_CODE_GENERATION_PROMPT,
  GAME_3D_ENVIRONMENT_PROMPT,
  buildGameGenerationContext,
} from './game-generator-prompts';
import { COPPA_SECURITY_AUDIT_PROMPT } from './architect-prompts';
import type { PipelineGateStatus, PipelineGate, NewGameBlueprint } from '@/types';

// ── Types ──

export interface GameGeneratorResult {
  runId: string;
  concept: GameConcept | null;
  gameCode: string | null;
  environmentCode: string | null;
  registryEntry: RegistryEntrySpec | null;
  auditResult: GameAuditResult | null;
  gates: PipelineGateStatus[];
  errors: string[];
  durationMs: number;
}

interface GameConcept {
  name: string;
  slug: string;
  lab: number;
  tier: 'flagship' | 'fl-lite' | 'standard';
  age_bands: string[];
  description: string;
  learning_objectives: string[];
  ai_concept: string;
  mechanics: string;
  phases: { welcome: string; learn: string; play: string; complete: string };
  scoring: { base_xp: number; perfect_bonus: number; time_bonus: boolean };
  visual_style: string;
  estimated_minutes: number;
}

interface RegistryEntrySpec {
  slug: string;
  name: string;
  lab: number;
  tier: string;
  ageBands: string[];
  description: string;
  componentPath: string;
  environmentPath: string;
  triangleBudget: number;
}

interface GameAuditResult {
  passed: boolean;
  coppaFlags: string[];
  securityFlags: string[];
  recommendation: 'approve' | 'flag_for_review' | 'reject';
}

// ── Lazy Anthropic ──

let _client: { messages: { create: (p: Record<string, unknown>) => Promise<{ content: { type: string; text?: string }[] }> } } | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require('@anthropic-ai/sdk');
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

function extractText(r: { content: { type: string; text?: string }[] }): string {
  return r.content.filter(b => b.type === 'text' && b.text).map(b => b.text!).join('');
}

function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim());
  } catch { return null; }
}

function gate(g: PipelineGate, status: PipelineGateStatus['status'], notes?: string): PipelineGateStatus {
  return { gate: g, status, completed_at: status !== 'pending' ? new Date().toISOString() : undefined, notes };
}

const TIER_BUDGETS = { flagship: 20_000_000, 'fl-lite': 10_000_000, standard: 5_000_000 };

// ── Stage 1: Concept Generation ──

async function stageConcept(
  targetLab?: number,
  targetTier?: string,
): Promise<{ concept: GameConcept | null; gateResult: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { concept: null, gateResult: gate('analysis', 'failed', 'No API key') };

  try {
    let userPrompt = 'Design a new SparkForge game.';
    if (targetLab) userPrompt += ` It should be for Lab ${targetLab}.`;
    if (targetTier) userPrompt += ` Tier: ${targetTier}.`;
    userPrompt += ' Make it unique and different from all 35 existing games.';

    const response = await client.messages.create({
      model: MODELS.generation,
      max_tokens: 4000,
      system: GAME_CONCEPT_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const concept = parseJSON<GameConcept>(extractText(response));
    if (!concept || !concept.slug || !concept.name) {
      return { concept: null, gateResult: gate('analysis', 'failed', 'Invalid concept JSON') };
    }

    return { concept, gateResult: gate('analysis', 'passed', `${concept.name} (${concept.tier})`) };
  } catch (e: unknown) {
    return { concept: null, gateResult: gate('analysis', 'failed', String(e)) };
  }
}

// ── Stage 2: Game Code Generation ──

async function stageGameCode(
  concept: GameConcept,
): Promise<{ code: string | null; gateResult: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { code: null, gateResult: gate('code_gen', 'failed', 'No API key') };

  try {
    const context = buildGameGenerationContext(concept);
    const response = await client.messages.create({
      model: MODELS.generation,
      max_tokens: 16000,
      system: GAME_CODE_GENERATION_PROMPT,
      messages: [{ role: 'user', content: context }],
    });

    const code = extractText(response);
    if (!code || code.length < 200) {
      return { code: null, gateResult: gate('code_gen', 'failed', 'Generated code too short') };
    }

    // Basic validation
    const hasUseClient = code.includes("'use client'") || code.includes('"use client"');
    const hasGameShell = code.includes('GameShell');
    const hasExport = code.includes('export default');

    if (!hasUseClient || !hasGameShell || !hasExport) {
      return { code, gateResult: gate('code_gen', 'failed', 'Code missing required patterns') };
    }

    return { code, gateResult: gate('code_gen', 'passed', `${code.length} chars`) };
  } catch (e: unknown) {
    return { code: null, gateResult: gate('code_gen', 'failed', String(e)) };
  }
}

// ── Stage 3: Environment Code Generation ──

async function stageEnvironmentCode(
  concept: GameConcept,
): Promise<{ code: string | null; gateResult: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { code: null, gateResult: gate('architecture', 'failed', 'No API key') };

  try {
    const response = await client.messages.create({
      model: MODELS.generation,
      max_tokens: 8000,
      system: GAME_3D_ENVIRONMENT_PROMPT,
      messages: [{
        role: 'user',
        content: `Generate 3D environment for:\n\nGame: ${concept.name}\nLab: ${concept.lab}\nTier: ${concept.tier}\nVisual Style: ${concept.visual_style}\nMechanics: ${concept.mechanics}`,
      }],
    });

    const code = extractText(response);
    if (!code || code.length < 100) {
      return { code: null, gateResult: gate('architecture', 'failed', 'Environment code too short') };
    }

    return { code, gateResult: gate('architecture', 'passed', `${code.length} chars`) };
  } catch (e: unknown) {
    return { code: null, gateResult: gate('architecture', 'failed', String(e)) };
  }
}

// ── Stage 4: Registry Entry Spec ──

function stageRegistryEntry(concept: GameConcept): { entry: RegistryEntrySpec; gateResult: PipelineGateStatus } {
  const pascalName = concept.slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  const entry: RegistryEntrySpec = {
    slug: concept.slug,
    name: concept.name,
    lab: concept.lab,
    tier: concept.tier,
    ageBands: concept.age_bands,
    description: concept.description,
    componentPath: `src/components/games/${pascalName}Game.tsx`,
    environmentPath: `src/components/3d/environments/${pascalName}Environment.tsx`,
    triangleBudget: TIER_BUDGETS[concept.tier as keyof typeof TIER_BUDGETS] || TIER_BUDGETS.standard,
  };

  return { entry, gateResult: gate('file_management', 'passed', `${entry.componentPath}`) };
}

// ── Stage 5: Build Validation ──

function stageBuildValidation(gameCode: string, envCode: string | null): PipelineGateStatus {
  const issues: string[] = [];

  // Game code checks
  if (!gameCode.includes('completeGame')) issues.push('Missing completeGame() call');
  if (!gameCode.includes('useGameStore')) issues.push('Missing useGameStore');
  if (!gameCode.includes('aria-label') && !gameCode.includes('aria-')) issues.push('No ARIA labels found');

  // Environment code checks (if generated)
  if (envCode) {
    if (!envCode.includes('useFrame')) issues.push('Environment missing useFrame');
    if (envCode.includes('import * as THREE')) issues.push('Environment uses import *');
  }

  return issues.length > 0
    ? gate('build_test', 'failed', issues.join('; '))
    : gate('build_test', 'passed');
}

// ── Stage 6: COPPA/Safety Audit ──

async function stageSafetyAudit(
  gameCode: string,
  envCode: string | null,
): Promise<{ audit: GameAuditResult | null; gateResult: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { audit: null, gateResult: gate('coppa_audit', 'failed', 'No API key') };

  try {
    const allCode = `// === Game Component ===\n${gameCode}\n\n${envCode ? `// === Environment ===\n${envCode}` : ''}`;

    const response = await client.messages.create({
      model: MODELS.safety,
      max_tokens: 2000,
      system: COPPA_SECURITY_AUDIT_PROMPT,
      messages: [{ role: 'user', content: `Audit:\n\n${allCode.slice(0, 15000)}` }],
    });

    const audit = parseJSON<GameAuditResult>(extractText(response));
    if (!audit) return { audit: null, gateResult: gate('coppa_audit', 'failed', 'Parse error') };

    return {
      audit,
      gateResult: gate('coppa_audit', audit.recommendation === 'reject' ? 'failed' : 'passed', audit.recommendation),
    };
  } catch (e: unknown) {
    return { audit: null, gateResult: gate('coppa_audit', 'failed', String(e)) };
  }
}

// ── Main Orchestrator ──

export async function runGameGeneratorPipeline(
  targetLab?: number,
  targetTier?: 'flagship' | 'fl-lite' | 'standard',
): Promise<GameGeneratorResult> {
  const startTime = Date.now();
  const runId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const errors: string[] = [];
  const gates: PipelineGateStatus[] = [];

  // Stage 1: Concept
  const { concept, gateResult: conceptGate } = await stageConcept(targetLab, targetTier);
  gates.push(conceptGate);

  if (!concept) {
    errors.push('Concept generation failed');
    return buildResult(runId, null, null, null, null, null, gates, errors, startTime);
  }

  // Stage 2: Game code
  const { code: gameCode, gateResult: codeGate } = await stageGameCode(concept);
  gates.push(codeGate);

  if (!gameCode) {
    errors.push('Game code generation failed');
    return buildResult(runId, concept, null, null, null, null, gates, errors, startTime);
  }

  // Stage 3: Environment code
  const { code: envCode, gateResult: envGate } = await stageEnvironmentCode(concept);
  gates.push(envGate);

  // Stage 4: Registry entry
  const { entry, gateResult: regGate } = stageRegistryEntry(concept);
  gates.push(regGate);

  // Stage 5: Build validation
  gates.push(stageBuildValidation(gameCode, envCode));

  // Stage 6: COPPA audit
  const { audit, gateResult: auditGate } = await stageSafetyAudit(gameCode, envCode);
  gates.push(auditGate);

  // Stages 7-8: Pending admin
  gates.push(gate('admin_approval', 'pending', 'Awaiting admin review'));
  gates.push(gate('deployed', 'pending', 'Awaiting deployment'));

  // Log run
  const supabase = createAdminClient();
  await supabase.from('agent_runs').insert({
    run_id: runId,
    findings_count: 1,
    generated_count: envCode ? 2 : 1,
    approved_count: 0,
    flagged_count: gates.filter(g => g.status === 'failed').length,
    rejected_count: 0,
    duration_ms: Date.now() - startTime,
    errors: errors.length > 0 ? errors : [],
    completed_at: new Date().toISOString(),
  });

  return buildResult(runId, concept, gameCode, envCode, entry, audit, gates, errors, startTime);
}

function buildResult(
  runId: string,
  concept: GameConcept | null,
  gameCode: string | null,
  environmentCode: string | null,
  registryEntry: RegistryEntrySpec | null,
  auditResult: GameAuditResult | null,
  gates: PipelineGateStatus[],
  errors: string[],
  startTime: number,
): GameGeneratorResult {
  return { runId, concept, gameCode, environmentCode, registryEntry, auditResult, gates, errors, durationMs: Date.now() - startTime };
}
