# G2.1 — Pocket Brain WebLLM Wiring · Work-Order

**Goal:** make "Run a real AI in your browser tab" TRUE — wire the shipped on-device
WebLLM engine into the game so a kid downloads a small model and chats with a genuinely
on-device LLM. This is the G2 flagship demo ("do this first").

## Key finding: the engine is already fully plumbed — only the game component is orphaned

- `src/lib/pocketbrain/{capability,webllmService,promptLibrary}.ts` — complete engine:
  WebGPU capability probe → model tier cascade, `@mlc-ai/web-llm` façade with async-generator
  streaming (`StreamChunk{ text, delta, tokensPerSec, activeExperts }`), 30 kid-safe banded
  prompts + 12 race-mode trivia. `@mlc-ai/web-llm@^0.2.83` IS installed.
- `src/stores/pocketBrainStore.ts` (458 lines) — already drives the engine end-to-end:
  probe/loadModel/runPrompt/cancelStream, a 13-phase machine
  (welcome→learn→download→first-run→token-stream→quantization-lab→moe-switchboard→
  speed-race→compare-cloud→pocket-mode→report), race mode, cloud-compare via /api/ai/prompt-lab.
- `src/components/3d/PocketBrain3D.tsx` (+ PocketBrainEnvironment) — 8-lobe brain + token-stream
  scene reading the store. Also currently orphaned.
- `src/components/games/PocketBrainGame.tsx` — THE orphan: renders 4 sliders via
  SimulationLevelRenderer, never imports the store/engine/3D.

## Platform invariants any rewrite must preserve
`<GameShell title="Pocket Brain" color="#0FB8FA" labNum={1}>` wrapper; `useGameActions()`
`awardXP` + `completeGame('pocket-brain', stars)` completion; welcome→…→complete flow with
ARIA + age bands; mounts via `arcade/[gameSlug]` `dynamic(loader,{ssr:false})` (WebGPU/WASM
already SSR-safe — no server component imports the store/service).

## Blockers
| # | Blocker | Severity | Resolution | Needs owner? |
|---|---|---|---|---|
| B1 | Game component ignores the engine (sliders) | CRITICAL (the task) | Rewrite PocketBrainGame.tsx to drive usePocketBrainStore | no |
| B2 | CSP `connect-src` blocks model hosts (huggingface.co + cdn-lfs*, raw.githubusercontent.com for WASM libs) | CRITICAL | add `https://huggingface.co https://*.huggingface.co https://raw.githubusercontent.com` to connect-src in src/lib/csp.ts | YES (security) |
| B3 | Prod CSP drops eval; WebLLM needs WASM eval | CRITICAL (prod-only) | add `'wasm-unsafe-eval'` to scriptSrc in src/lib/csp.ts | YES (security) |
| B4 | Primary model id `LFM2-2.6B-q4f16_1-MLC` missing from WebLLM 0.2.83; cascade picks it for most desktops → throws | CRITICAL | remap `lfm2-moe` in capability.ts to a real prebuilt id (gemma-2-2b / Llama-3.2) or custom appConfig | YES (product/model) |
| B5 | ~0.6–1.5 GB first-run model download (cached in IndexedDB after) + few-MB runtime added to pocket-brain chunk (lazy) | HIGH (informational) | owner accepts shipping dep + big download for kids | YES (product) |
| B6 | Not verifiable in this sandbox (no WebGPU, proxied net) | MEDIUM | validate on a real Chromium+WebGPU browser or Vercel preview | — |
| B7 | No-WebGPU fallback asset unspecified (mp4-poster promised, none exists) | LOW/MED | reuse existing slider sim as the no-WebGPU path (no new asset, recommended) OR ship an MP4 poster | YES (product) |

Infra already OK: `worker-src 'self' blob:`, `script-src … blob:`, middleware whitelists `.wasm`, arcade mounts ssr:false.

## Wiring plan (once infra/decisions land)
1. Infra (B2/B3/B4): CSP additions + model-id remap.
2. Rewrite PocketBrainGame.tsx to consume the store: probe on mount → download-progress UI
   (store.loadProgress) → chat UI (prompt picker from promptLibrary + free text →
   store.runPrompt, live store.streamingText, tokens/sec, cancel) → optional MoE 3D lobes
   (PocketBrain3D, ssr:false, desktop) → report phase calls awardXP + completeGame. Keep
   GameShell + ARIA + band awareness.
3. Fallback (B7): no-WebGPU → slider sim (recommended) so the game is never a dead end.
4. Reconcile stale copy in src/types/index.ts:366 ("Run a real AI…no internet") to match honest registry.

## Generalizes to the other 6 Lab-11 flagships
AgentAtelier, McpLab, GlassBox, HarnessForge, ContextArchitect, PixelWitness each have a built
engine + store, with a slider-stub component. Same "swap SimLevelRenderer for the store-driven
UI" template — but NONE of them need WebGPU/CSP/model-download (pure client-side logic engines),
so they are unblocked and fully testable in-sandbox. Pocket Brain is the WebGPU-heaviest and the
one gated on owner security/product decisions.
