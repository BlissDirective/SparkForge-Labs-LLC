// src/lib/harness/filterLayer.ts
// ════════════════════════════════════════════════════════════════
// Stage 11G — INPUT FILTER layer
// ════════════════════════════════════════════════════════════════
// Sanitizes prompts before any agent sees them. Pure function,
// deterministic, reproducible (kid auditing the same prompt twice
// gets the same catches both times).
//
// Three rules:
//   1. stripPii: replace emails / phone / addresses with [REDACTED]
//   2. blockProfanity: reject prompts containing kid-safe-blocked terms
//   3. lengthCap: truncate prompts longer than the configured length
// ════════════════════════════════════════════════════════════════

import type { FilterLayerConfig, HarnessCatch } from '@/types/harness';

// PII patterns from the Stage 9 ai-content-generator — re-implemented
// here to keep the harness layer dependency-free.
const EMAIL_RX = /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g;
const PHONE_RX = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const ADDRESS_RX = /\b\d{1,5}\s\w+\s(?:St|Ave|Rd|Blvd|Dr|Ln|Ct|Way|Pl)\b/gi;

// Kid-safe profanity block list (pruned, kept short for clarity — the
// real production block list would be longer and externalized).
const PROFANITY_BLOCK = [
  'damn', 'hell', 'crap', 'idiot', 'stupid', 'shut up', 'shutup',
];

// ─── Apply ───────────────────────────────────────────────────────

export interface ApplyFilterInput {
  config: FilterLayerConfig;
  prompt: string;
}

export interface ApplyFilterOutput {
  /** Sanitized prompt that should be forwarded to the team (empty if rejected). */
  sanitizedPrompt: string;
  /** True if the prompt was REJECTED outright (vs sanitized). */
  rejected: boolean;
  /** All catches the filter generated. */
  catches: HarnessCatch[];
}

/** Apply the input filter to a prompt. */
export function applyFilter(input: ApplyFilterInput): ApplyFilterOutput {
  const { config, prompt } = input;
  const catches: HarnessCatch[] = [];
  let working = prompt;
  let rejected = false;

  // 1. PII strip (replace, don't reject — kids learn graceful degradation)
  if (config.stripPii) {
    let stripped = working;
    let piiCount = 0;
    stripped = stripped.replace(EMAIL_RX, () => {
      piiCount += 1;
      return '[REDACTED-EMAIL]';
    });
    stripped = stripped.replace(PHONE_RX, () => {
      piiCount += 1;
      return '[REDACTED-PHONE]';
    });
    stripped = stripped.replace(ADDRESS_RX, () => {
      piiCount += 1;
      return '[REDACTED-ADDRESS]';
    });
    if (piiCount > 0) {
      catches.push({
        layer: 'filter',
        rule: 'stripPii',
        detail: `Redacted ${piiCount} piece${piiCount === 1 ? '' : 's'} of personally identifiable info from the prompt.`,
        severity: 3,
      });
      working = stripped;
    }
  }

  // 2. Profanity block (REJECT — these prompts shouldn't reach the team at all)
  if (config.blockProfanity) {
    const lower = working.toLowerCase();
    const hits = PROFANITY_BLOCK.filter((w) => lower.includes(w));
    if (hits.length > 0) {
      catches.push({
        layer: 'filter',
        rule: 'blockProfanity',
        detail: `Rejected prompt — blocked term${hits.length === 1 ? '' : 's'}: ${hits.join(', ')}.`,
        severity: 3,
      });
      rejected = true;
    }
  }

  // 3. Length cap (TRUNCATE — shows the kid the prompt was too long)
  if (!rejected && config.lengthCap > 0 && working.length > config.lengthCap) {
    const truncated = working.slice(0, config.lengthCap);
    catches.push({
      layer: 'filter',
      rule: 'lengthCap',
      detail: `Truncated prompt from ${working.length} to ${config.lengthCap} characters.`,
      severity: 1,
    });
    working = truncated;
  }

  return {
    sanitizedPrompt: rejected ? '' : working,
    rejected,
    catches,
  };
}

// ─── UI metadata ─────────────────────────────────────────────────

/** Per-rule labels + hints + severity surfaced by the configure UI. */
export const FILTER_RULE_META = {
  stripPii: {
    label: 'Strip personal info',
    hint: 'Replace emails, phone numbers, and street addresses with REDACTED placeholders.',
    color: '#0FB8FA',
    severity: 3 as const,
  },
  blockProfanity: {
    label: 'Block profanity',
    hint: 'Reject any prompt containing blocked words. The team never sees these.',
    color: '#FF7050',
    severity: 3 as const,
  },
  lengthCap: {
    label: 'Length cap',
    hint: 'Truncate prompts longer than this character count. 0 = no cap.',
    color: '#D9A430',
    severity: 1 as const,
  },
} as const;
