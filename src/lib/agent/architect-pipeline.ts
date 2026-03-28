// ════════════════════════════════════════════════════
// ARCHITECT PIPELINE — Phase 8: Autonomous 3D/UI code generation
// 8-gate pipeline: Analyze → Design → Generate → Files → Test → COPPA → Approve → Deploy
// ════════════════════════════════════════════════════

import { createAdminClient } from '@/lib/supabase/server';
import { MODELS } from './prompts';
import {
  ARCHITECTURE_ANALYSIS_PROMPT,
  R3F_CODE_GENERATION_PROMPT,
  INTEGRATION_ANALYSIS_PROMPT,
  COPPA_SECURITY_AUDIT_PROMPT,
} from './architect-prompts';
import type {
  ArchitectureRequirement,
  PipelineGateStatus,
  PipelineGate,
  ContentType,
} from '@/types';

// ── Types ──

interface ArchitectRunResult {
  runId: string;
  contentId: string;
  contentType: ContentType;
  gates: PipelineGateStatus[];
  generatedComponents: GeneratedComponent[];
  integrationPlan: IntegrationPlan | null;
  auditResult: AuditResult | null;
  errors: string[];
  durationMs: number;
}

interface GeneratedComponent {
  name: string;
  path: string;
  code: string;
  type: 'environment' | 'game_scene' | 'ui_element' | 'effect';
  triangleBudget: number;
}

interface IntegrationPlan {
  newFiles: { path: string; purpose: string }[];
  modifiedFiles: { path: string; changeDescription: string }[];
  storeUpdates: { store: string; change: string }[];
  cameraPreset: { position: number[]; lookAt: number[]; fov: number } | null;
}

interface AuditResult {
  passed: boolean;
  coppaFlags: string[];
  securityFlags: string[];
  accessibilityFlags: string[];
  recommendation: 'approve' | 'flag_for_review' | 'reject';
}

// ── Lazy Anthropic client ──

let _anthropic: ReturnType<typeof createAnthropicClient> | null = null;

function createAnthropicClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) as {
    messages: { create: (params: Record<string, unknown>) => Promise<{ content: { type: string; text?: string }[] }> };
  };
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_anthropic) _anthropic = createAnthropicClient();
  return _anthropic;
}

function extractText(response: { content: { type: string; text?: string }[] }): string {
  return response.content
    .filter(b => b.type === 'text' && b.text)
    .map(b => b.text!)
    .join('');
}

function parseJSON<T>(text: string): T | null {
  try {
    // Strip markdown fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function createGate(gate: PipelineGate, status: PipelineGateStatus['status'], notes?: string): PipelineGateStatus {
  return {
    gate,
    status,
    completed_at: status !== 'pending' ? new Date().toISOString() : undefined,
    notes,
  };
}

// ── Gate 1: Content Analysis ──

async function gateAnalysis(
  contentId: string,
  contentType: ContentType,
  contentTitle: string,
  contentBody: string,
): Promise<{ requirement: ArchitectureRequirement | null; gate: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { requirement: null, gate: createGate('analysis', 'failed', 'No API key') };

  try {
    const response = await client.messages.create({
      model: MODELS.generation,
      max_tokens: 3000,
      system: ARCHITECTURE_ANALYSIS_PROMPT,
      messages: [{
        role: 'user',
        content: `Analyze this content:\n\nID: ${contentId}\nType: ${contentType}\nTitle: ${contentTitle}\nBody: ${contentBody.slice(0, 1000)}`,
      }],
    });

    const text = extractText(response);
    const requirement = parseJSON<ArchitectureRequirement>(text);

    if (!requirement) {
      return { requirement: null, gate: createGate('analysis', 'failed', 'Failed to parse analysis') };
    }

    return { requirement, gate: createGate('analysis', 'passed') };
  } catch (e: unknown) {
    return { requirement: null, gate: createGate('analysis', 'failed', String(e)) };
  }
}

// ── Gate 2: Architecture Design ──

async function gateArchitecture(
  requirement: ArchitectureRequirement,
): Promise<{ plan: IntegrationPlan | null; gate: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { plan: null, gate: createGate('architecture', 'failed', 'No API key') };

  try {
    const response = await client.messages.create({
      model: MODELS.generation,
      max_tokens: 3000,
      system: INTEGRATION_ANALYSIS_PROMPT,
      messages: [{
        role: 'user',
        content: `Plan integration for:\n\n${JSON.stringify(requirement, null, 2)}`,
      }],
    });

    const text = extractText(response);
    const plan = parseJSON<IntegrationPlan>(text);

    if (!plan) {
      return { plan: null, gate: createGate('architecture', 'failed', 'Failed to parse plan') };
    }

    return { plan, gate: createGate('architecture', 'passed') };
  } catch (e: unknown) {
    return { plan: null, gate: createGate('architecture', 'failed', String(e)) };
  }
}

// ── Gate 3: Code Generation ──

async function gateCodeGeneration(
  requirement: ArchitectureRequirement,
): Promise<{ components: GeneratedComponent[]; gate: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { components: [], gate: createGate('code_gen', 'failed', 'No API key') };

  const components: GeneratedComponent[] = [];

  for (const comp of requirement.required_3d_components) {
    try {
      const response = await client.messages.create({
        model: MODELS.generation,
        max_tokens: 8000,
        system: R3F_CODE_GENERATION_PROMPT,
        messages: [{
          role: 'user',
          content: `Generate R3F component:\n\nName: ${comp.name}\nType: ${comp.type}\nTriangle Budget: ${comp.triangle_budget}\nDescription: ${comp.description}\nIntegration: ${comp.integration_point}`,
        }],
      });

      const code = extractText(response);
      const path = comp.type === 'environment'
        ? `src/components/3d/environments/${comp.name}.tsx`
        : `src/components/3d/${comp.name}.tsx`;

      components.push({
        name: comp.name,
        path,
        code,
        type: comp.type,
        triangleBudget: comp.triangle_budget,
      });
    } catch (e: unknown) {
      console.error(`Code gen failed for ${comp.name}:`, e);
    }
  }

  const allGenerated = components.length === requirement.required_3d_components.length;
  return {
    components,
    gate: createGate('code_gen', allGenerated ? 'passed' : 'failed',
      `Generated ${components.length}/${requirement.required_3d_components.length} components`),
  };
}

// ── Gate 4: File Management (generates specs, doesn't write files) ──

function gateFileManagement(
  components: GeneratedComponent[],
  plan: IntegrationPlan | null,
): PipelineGateStatus {
  if (components.length === 0) {
    return createGate('file_management', 'failed', 'No components to manage');
  }
  // In production, this gate would write files and update docs
  // For now, it validates the plan is complete
  return createGate('file_management', 'passed',
    `${components.length} components ready, ${plan?.modifiedFiles.length || 0} files to update`);
}

// ── Gate 5: Build/Test (validates code structure) ──

function gateBuildTest(components: GeneratedComponent[]): PipelineGateStatus {
  const issues: string[] = [];

  for (const comp of components) {
    // Basic structural validation
    if (!comp.code.includes("'use client'") && !comp.code.includes('"use client"')) {
      issues.push(`${comp.name}: Missing 'use client' directive`);
    }
    if (!comp.code.includes('export default')) {
      issues.push(`${comp.name}: Missing default export`);
    }
    if (comp.code.includes('import * as THREE')) {
      issues.push(`${comp.name}: Uses import * (should use named imports)`);
    }
    if (comp.code.includes('any')) {
      // Rough check — may have false positives but catches obvious issues
      const anyCount = (comp.code.match(/: any[;\s,)]/g) || []).length;
      if (anyCount > 0) {
        issues.push(`${comp.name}: Contains ${anyCount} 'any' type(s)`);
      }
    }
  }

  if (issues.length > 0) {
    return createGate('build_test', 'failed', issues.join('; '));
  }
  return createGate('build_test', 'passed');
}

// ── Gate 6: COPPA/Security Audit ──

async function gateCoppaAudit(
  components: GeneratedComponent[],
): Promise<{ audit: AuditResult | null; gate: PipelineGateStatus }> {
  const client = getClient();
  if (!client) return { audit: null, gate: createGate('coppa_audit', 'failed', 'No API key') };

  try {
    const allCode = components.map(c => `// === ${c.name} (${c.path}) ===\n${c.code}`).join('\n\n');

    const response = await client.messages.create({
      model: MODELS.safety, // Haiku for fast audit
      max_tokens: 2000,
      system: COPPA_SECURITY_AUDIT_PROMPT,
      messages: [{
        role: 'user',
        content: `Audit the following generated code:\n\n${allCode.slice(0, 15000)}`,
      }],
    });

    const text = extractText(response);
    const audit = parseJSON<AuditResult>(text);

    if (!audit) {
      return { audit: null, gate: createGate('coppa_audit', 'failed', 'Failed to parse audit') };
    }

    const status = audit.recommendation === 'reject' ? 'failed' : 'passed';
    return { audit, gate: createGate('coppa_audit', status, audit.recommendation) };
  } catch (e: unknown) {
    return { audit: null, gate: createGate('coppa_audit', 'failed', String(e)) };
  }
}

// ── Gate 7 & 8: Admin Approval + Deploy (manual steps) ──

// These gates are set to 'pending' — admin completes them via dashboard

// ── Main Orchestrator ──

export async function runArchitectPipeline(
  contentId: string,
  contentType: ContentType,
  contentTitle: string,
  contentBody: string,
): Promise<ArchitectRunResult> {
  const startTime = Date.now();
  const runId = `arch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const errors: string[] = [];
  const gates: PipelineGateStatus[] = [];

  // Gate 1: Analysis
  const { requirement, gate: analysisGate } = await gateAnalysis(contentId, contentType, contentTitle, contentBody);
  gates.push(analysisGate);

  if (!requirement || analysisGate.status === 'failed') {
    errors.push('Analysis gate failed');
    return buildResult(runId, contentId, contentType, gates, [], null, null, errors, startTime);
  }

  // Gate 2: Architecture
  const { plan, gate: archGate } = await gateArchitecture(requirement);
  gates.push(archGate);

  // Gate 3: Code Generation
  const { components, gate: codeGate } = await gateCodeGeneration(requirement);
  gates.push(codeGate);

  if (components.length === 0) {
    errors.push('Code generation produced no components');
    return buildResult(runId, contentId, contentType, gates, [], plan, null, errors, startTime);
  }

  // Gate 4: File Management
  gates.push(gateFileManagement(components, plan));

  // Gate 5: Build/Test
  const buildGate = gateBuildTest(components);
  gates.push(buildGate);

  // Gate 6: COPPA/Security
  const { audit, gate: coppaGate } = await gateCoppaAudit(components);
  gates.push(coppaGate);

  // Gates 7-8: Pending admin action
  gates.push(createGate('admin_approval', 'pending', 'Awaiting admin review'));
  gates.push(createGate('deployed', 'pending', 'Awaiting deployment'));

  // Store run in database
  const supabase = createAdminClient();
  await supabase.from('agent_runs').insert({
    run_id: runId,
    findings_count: requirement.required_3d_components.length,
    generated_count: components.length,
    approved_count: 0,
    flagged_count: gates.filter(g => g.status === 'failed').length,
    rejected_count: 0,
    duration_ms: Date.now() - startTime,
    errors: errors.length > 0 ? errors : [],
    completed_at: new Date().toISOString(),
  });

  return buildResult(runId, contentId, contentType, gates, components, plan, audit, errors, startTime);
}

function buildResult(
  runId: string,
  contentId: string,
  contentType: ContentType,
  gates: PipelineGateStatus[],
  components: GeneratedComponent[],
  plan: IntegrationPlan | null,
  audit: AuditResult | null,
  errors: string[],
  startTime: number,
): ArchitectRunResult {
  return {
    runId,
    contentId,
    contentType,
    gates,
    generatedComponents: components,
    integrationPlan: plan,
    auditResult: audit,
    errors,
    durationMs: Date.now() - startTime,
  };
}

export type { ArchitectRunResult, GeneratedComponent, IntegrationPlan, AuditResult };
