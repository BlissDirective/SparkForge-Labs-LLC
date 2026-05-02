// src/lib/harness/validatorLayer.ts
// ════════════════════════════════════════════════════════════════
// Stage 11G — OUTPUT VALIDATOR layer
// ════════════════════════════════════════════════════════════════
// Checks the team's final artifact against rules. Pure function;
// produces catches but doesn't modify the artifact (this is a
// post-hoc validator, not a sanitizer).
// ════════════════════════════════════════════════════════════════

import type { HarnessCatch, ValidatorLayerConfig } from '@/types/harness';

export interface ApplyValidatorInput {
  config: ValidatorLayerConfig;
  artifact: string;
}

export interface ApplyValidatorOutput {
  catches: HarnessCatch[];
  /** Whether ALL configured rules passed. */
  passed: boolean;
}

const CITATION_RX = /\[\d+\]/g;

export function applyValidator(input: ApplyValidatorInput): ApplyValidatorOutput {
  const { config, artifact } = input;
  const catches: HarnessCatch[] = [];

  if (config.requireKeyword && config.requireKeyword.trim().length > 0) {
    const kw = config.requireKeyword.trim().toLowerCase();
    if (!artifact.toLowerCase().includes(kw)) {
      catches.push({
        layer: 'validator',
        rule: 'requireKeyword',
        detail: `Final artifact didn't include the required keyword: "${config.requireKeyword}".`,
        severity: 2,
      });
    }
  }

  if (config.maxLength !== undefined && config.maxLength > 0 && artifact.length > config.maxLength) {
    catches.push({
      layer: 'validator',
      rule: 'maxLength',
      detail: `Final artifact is ${artifact.length} characters (limit: ${config.maxLength}).`,
      severity: 1,
    });
  }

  if (config.requireCitations) {
    const cites = artifact.match(CITATION_RX)?.length ?? 0;
    if (cites === 0) {
      catches.push({
        layer: 'validator',
        rule: 'requireCitations',
        detail: 'Final artifact has no [n]-style citations. Add at least one source.',
        severity: 3,
      });
    }
  }

  return { catches, passed: catches.length === 0 };
}

// ─── UI metadata ─────────────────────────────────────────────────

export const VALIDATOR_RULE_META = {
  requireKeyword: {
    label: 'Require keyword',
    hint: 'The artifact must contain this word (case-insensitive). Useful for ensuring the team addressed the brief.',
    color: '#0FB8FA',
    severity: 2 as const,
  },
  maxLength: {
    label: 'Max length',
    hint: 'Reject artifacts longer than this character count.',
    color: '#D9A430',
    severity: 1 as const,
  },
  requireCitations: {
    label: 'Require citations',
    hint: 'Demand at least one [1]-style citation marker. Helps catch agents that make things up.',
    color: '#B67BFF',
    severity: 3 as const,
  },
} as const;
