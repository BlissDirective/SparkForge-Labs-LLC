// src/lib/pocketbrain/webllmService.ts
// ════════════════════════════════════════════════════════════════
// Stage 11A — Pocket Brain WebLLM service wrapper
// ════════════════════════════════════════════════════════════════
// Thin façade over @mlc-ai/web-llm. Owns:
//   • Engine lifecycle (create, dispose)
//   • Streaming inference w/ token-rate tracking
//   • MoE-expert visualization signal (educational stub - see below)
//   • Init progress reporting back to the store
//
// MoE expert tracking note:
// WebLLM doesn't expose which expert fires per-token from the
// public API. For the kid-facing visualization, we use a DETERMINISTIC
// per-prompt expert selection based on a hash of the prompt's content
// words — a teaching visualization that's stable + reproducible. The
// real per-token expert routing would require runtime hooks into the
// MLC compilation pipeline. This is documented in-line on the
// `selectActiveExperts` function.
// ════════════════════════════════════════════════════════════════

import type { MLCEngineInterface, InitProgressReport } from '@mlc-ai/web-llm';
import { CreateMLCEngine, hasModelInCache } from '@mlc-ai/web-llm';
import type { ModelChoice, Quantization } from './capability';
import { getModelIdFor } from './capability';

// ─── Types ───────────────────────────────────────────────────────

export interface LoadProgress {
  progress: number;       // 0..1
  text: string;           // human-readable phase label
  elapsedMs: number;
}

export interface StreamChunk {
  /** Cumulative text so far (NOT just the delta). */
  text: string;
  /** This chunk's delta only. */
  delta: string;
  /** Tokens-per-second so far (approximate). */
  tokensPerSec: number;
  /** Active MoE expert indices (0..7) for this stream. */
  activeExperts: number[];
}

export interface InferenceOptions {
  prompt: string;
  /** Cap output length (token estimate). */
  maxTokens?: number;
  /** Sampling temperature (0..1). */
  temperature?: number;
  /** Abort signal — caller can cancel mid-stream. */
  signal?: AbortSignal;
}

// ─── Service ─────────────────────────────────────────────────────

class WebLLMService {
  private engine: MLCEngineInterface | null = null;
  private currentModelId: string | null = null;

  /** Has the WebLLM model file been cached locally? */
  async isModelCached(choice: ModelChoice, q: Quantization): Promise<boolean> {
    const id = getModelIdFor(choice, q);
    if (!id) return false;
    try {
      return await hasModelInCache(id);
    } catch {
      return false;
    }
  }

  /** Load a model. If onProgress is provided, fires multiple times during
   *  download / WASM init / weight load with monotonic progress 0..1. */
  async load(
    choice: ModelChoice,
    quantization: Quantization,
    onProgress?: (p: LoadProgress) => void,
  ): Promise<void> {
    const modelId = getModelIdFor(choice, quantization);
    if (!modelId) {
      throw new Error(`Cannot load model for choice=${choice} (no live inference path)`);
    }

    // Reuse existing engine if it's already loaded with this exact model.
    if (this.engine && this.currentModelId === modelId) return;

    // Dispose any prior engine before loading a new one.
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch {
        // best-effort
      }
      this.engine = null;
      this.currentModelId = null;
    }

    const startedAt = Date.now();
    this.engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report: InitProgressReport) => {
        onProgress?.({
          progress: clamp01(report.progress),
          text: report.text,
          elapsedMs: Date.now() - startedAt,
        });
      },
    });
    this.currentModelId = modelId;
  }

  /** Async generator: yields StreamChunk on each token. */
  async *stream(opts: InferenceOptions): AsyncGenerator<StreamChunk, void, void> {
    if (!this.engine) {
      throw new Error('WebLLMService.stream called before load()');
    }
    const { prompt, maxTokens = 256, temperature = 0.7, signal } = opts;

    const activeExperts = selectActiveExperts(prompt);
    let text = '';
    let chunkCount = 0;
    const startedAt = Date.now();

    const stream = await this.engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    });

    for await (const chunk of stream) {
      if (signal?.aborted) {
        // The web-llm async iterator returns a value to break the loop;
        // aborting via the engine.interruptGenerate() public API is
        // best-effort.
        try {
          this.engine.interruptGenerate();
        } catch {
          // best-effort
        }
        return;
      }
      const delta = chunk.choices?.[0]?.delta?.content ?? '';
      if (delta.length === 0) continue;
      text += delta;
      chunkCount += 1;
      const elapsedSec = Math.max(0.001, (Date.now() - startedAt) / 1000);
      yield {
        text,
        delta,
        // Approx tokens-per-sec via chunkCount/elapsed; web-llm chunks
        // are roughly 1 token each so this is close enough for the kid
        // dashboard.
        tokensPerSec: chunkCount / elapsedSec,
        activeExperts,
      };
    }
  }

  /** One-shot completion — convenience wrapper that consumes the stream
   *  and returns the final text. */
  async complete(opts: InferenceOptions): Promise<{ text: string; tokensPerSec: number; activeExperts: number[] }> {
    let final: StreamChunk | null = null;
    for await (const c of this.stream(opts)) final = c;
    return final
      ? { text: final.text, tokensPerSec: final.tokensPerSec, activeExperts: final.activeExperts }
      : { text: '', tokensPerSec: 0, activeExperts: [] };
  }

  /** Tear down the engine. Frees GPU memory. */
  async dispose(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload();
      } catch {
        // best-effort
      }
      this.engine = null;
      this.currentModelId = null;
    }
  }

  isLoaded(): boolean {
    return this.engine !== null;
  }

  loadedModelId(): string | null {
    return this.currentModelId;
  }
}

// ─── Singleton ───────────────────────────────────────────────────

/** Module-singleton. Pocket Brain only ever runs one engine at a time;
 *  the React store wraps this service with reactive state. */
export const webllmService = new WebLLMService();

// ─── Helpers ─────────────────────────────────────────────────────

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Educational MoE expert visualization. Stable per-prompt: hashes the
 *  first 2-3 content words and maps to 2 of the 8 expert indices.
 *
 *  WHY THIS IS A STUB: the WebLLM public API doesn't expose which
 *  experts fired per-token from the underlying MLC compile graph.
 *  Hooking real expert routing would require modifications to
 *  @mlc-ai/web-llm itself (contribution-level work). The kid-facing
 *  visualization needs to be deterministic + reproducible (same prompt
 *  always lights the same experts) so kids can build the mental model
 *  "different topics use different experts" — this hash satisfies that
 *  pedagogical goal even though it's not real expert routing.
 *
 *  When WebLLM eventually exposes per-token expert telemetry, drop in
 *  the real signal here without changing the calling code. */
export function selectActiveExperts(prompt: string): number[] {
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'as', 'i', 'you', 'me', 'my']);
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !stop.has(w));

  if (words.length === 0) return [0];

  // Two experts: hash of first content word, hash of last (or first if only one).
  const first = words[0];
  const last = words[words.length - 1];
  const e1 = hashToExpert(first);
  const e2 = words.length > 1 ? hashToExpert(last) : (e1 + 3) % 8;
  return e1 === e2 ? [e1] : [e1, e2];
}

function hashToExpert(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 8;
}
