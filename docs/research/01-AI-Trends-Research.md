# 01 — AI Trends Research (Nov 2025 → Apr 2026)

**Document role:** Research foundation for `02-Flagship-Game-Concepts.md`.
**Authored:** April 30, 2026
**Time window:** Last 6 months (Nov 2025 → Apr 2026)
**Topics:** Agentic AI Engineering · Harness Engineering · LLM Development · Context Engineering · Multimodal / Vision-Language · AI Safety / Alignment / Evals · On-device / Edge AI

---

## Executive Summary

The six-month window from Nov 2025 to Apr 2026 marks the industry transition described by IBM, Gartner, and Anthropic as **"the year of the agent moving into production."** Five mutually-reinforcing shifts dominate the landscape:

1. **Multi-agent systems replaced single agents.** Gartner logged a **1,445% surge** in multi-agent system inquiries (Q1 2024 → Q2 2025). Framework adoption nearly doubled YoY (≈9% → ≈18% of orgs by Q1 2026).
2. **MCP became an open standard.** Anthropic donated the Model Context Protocol to the **Agentic AI Foundation (Linux Foundation)** in **December 2025**, co-founded with Block and OpenAI. By March 2026: 10,000+ active public MCP servers, 97M monthly SDK downloads.
3. **"Harness Engineering" emerged as a discipline.** Coined in Martin Fowler / Addy Osmani writing in late 2025 / early 2026, the term captures everything around an LLM that makes it reliable: hooks, guardrails, sensors, guides. Claude Code and Cursor 3 (April 2026) are the reference implementations.
4. **Context is the new bottleneck.** Models support 1M–10M tokens (Llama 4 Scout claims 10M), but raw window size correlates poorly with performance — Claude Opus 4.6 scores **76% on MRCR-v2 8-needle @ 1M tokens** while Llama 4 Scout scores only 15.6%. **Context Engineering** (compression, budgeting, isolation, dynamic retrieval) is now considered the key skill.
5. **The browser is becoming an AI runtime.** WebGPU + WebAssembly enable models like LFM2-MoE (8.3B total / 1.5B active) and Gemma 3/4 (E2B/E4B) to run **fully client-side at 30–70 tokens/sec**, with up to 80% native performance.

These shifts are directly relevant to SparkForge's mission of teaching ages 7–16 the *real* concepts behind modern AI. Each of the five themes maps cleanly to a teachable, playable mechanic — detailed in Document 2.

---

## 1. Agentic AI Engineering

### 1.1 Summary

The decisive shift of late 2025 / early 2026 is from "single all-purpose agent" to **orchestrated teams of specialized agents**. Engineering effort has moved from prompt-tuning to designing inter-agent workflows and protocols. Anthropic, OpenAI, Google, IBM, and Block now coordinate on shared protocols (MCP, ACP, A2A) under Linux Foundation governance.

### 1.2 Key Findings & Data

| # | Finding | Data Point |
|---|---|---|
| 1 | Multi-agent inquiries surged | **1,445%** Q1 2024 → Q2 2025 (Gartner) |
| 2 | Framework adoption doubled YoY | ~9% (Q1 2025) → ~18% (Q1 2026) of orgs |
| 3 | Top frameworks | LangGraph, CrewAI, Pydantic AI, LangChain, Vercel AI SDK |
| 4 | Enterprise penetration forecast | **40% of enterprise apps** include task-specific agents by EOY 2026 (Gartner; up from <5%) |
| 5 | MCP servers in the wild | **10,000+** active public servers (Mar 2026) |
| 6 | MCP SDK downloads | **97M / month** across Python + TypeScript (Mar 2026) |

### 1.3 Timeline

- **Nov 2024** — Anthropic launches Model Context Protocol (MCP).
- **Q1 2025** — IBM ACP and Google A2A launched.
- **Q3 2025** — LangGraph 1.0 ships; CrewAI hits enterprise GA.
- **Dec 2025** — Anthropic donates MCP to **Agentic AI Foundation** (Linux Foundation). Co-founders: Anthropic, Block, OpenAI. Backers: Google, Microsoft, AWS, Cloudflare.
- **Q1 2026** — Anthropic ships **Agent Skills** (progressive-disclosure file-based skills).
- **April 2026** — Cursor 3 ships cloud agents on isolated VMs, parallel Agent Tabs, /worktree.

### 1.4 Pertinent Patterns for SparkForge

- **"Delegate, Review, Own"** operating model — humans own architecture; agents do first-pass execution. (Game-translatable as a player role.)
- **Specialization over generalization** — perception agent ↔ reasoning agent ↔ action agent. (Maps cleanly to a "build your own team" mechanic.)
- **Inter-agent protocols** (MCP / A2A) as the connective tissue. (Maps to a "wiring / pipes" puzzle.)

---

## 2. Harness Engineering

### 2.1 Summary

> *"Agent = Model + Harness."*

Harness Engineering is the new discipline of designing the environment, constraints, and feedback loops that surround an LLM. Martin Fowler describes it as a **"cybernetic governor"** — combining feedforward (Guides) and feedback (Sensors) controls. Claude Code and Cursor 3 are the canonical implementations.

### 2.2 Key Findings & Data

| Component | Description | Example |
|---|---|---|
| **Guides (feedforward)** | Anticipate unwanted outputs before they happen | CLAUDE.md, architecture docs, coding standards, .cursor/rules |
| **Sensors (feedback)** | Observe outputs after the fact and trigger correction | Linters with self-correction hints, LLM-as-judge, test runs |
| **Computational controls** | Deterministic, fast (ms–s), reliable | Tests, linters, type checkers |
| **Inferential controls** | Probabilistic, slower, semantic | Code-review agents, judge-LLMs |
| **Three regulation categories** | Maintainability (mature) → Architecture Fitness → Behavior (least mature) | — |

### 2.3 Reference Implementations

- **Claude Code** — 22 hookable lifecycle events, subagents, skills, MCP servers, permission model with read-only default + per-tool whitelisting, project-level `CLAUDE.md`.
- **Cursor 3 (April 2026)** — Cloud agents on isolated VMs, /worktree for isolated branch changes, self-hosted agents, parallel Agent Tabs, `.cursor/rules` files (markdown, version-controlled, file-pattern-specific).
- **OpenHarness / ohmo** — Open-source agent harness with personal-agent runtime (HKUDS).
- **Harness Skills** (the company) — Structured AI-agent skills for CI/CD workflows.

### 2.4 Timeline

- **Q4 2025** — Term *"harness engineering"* formalized in Martin Fowler / Addy Osmani writing.
- **Q1 2026** — Claude Code introduces `--agents` JSON flag, plugin subagents, richer hooks.
- **Q1 2026** — Cursor `.cursor/rules` becomes default project-level harness format.
- **April 2026** — Cursor 3 ships isolated-VM cloud agents.

### 2.5 Pertinent Patterns for SparkForge

- **"Stack hooks → dispatchers → skills → agents → workflows."** This layered diagram is itself a teaching tool.
- **Guides vs. Sensors** is a perfect kid-level dichotomy: "rules you give it" vs. "things that watch it."
- **Hooks as deterministic safeguards** are concrete and visualizable — you can see them fire.

---

## 3. LLM Development

### 3.1 Summary

The "scaling era" is widely declared over by Q1 2026 commentary (IBM, Stanford AI Index, Vellum). Frontier labs have shifted from compute-scaling to **training innovation, reasoning architectures, and infrastructure efficiency**. Release cadence has accelerated dramatically — Claude Opus 4.7 shipped only 8 days before DeepSeek V4; GPT-5.5 followed GPT-5.4 by 6 weeks.

### 3.2 Key Findings & Data

| Trend | Detail |
|---|---|
| **Reasoning models** | OpenAI o-series, DeepSeek-R1 trade speed for accuracy. Extended-thinking modes are now standard across Claude, Gemini, GPT. |
| **End of pure scaling** | Compute alone no longer delivers next-order breakthroughs. Focus: new training methods, new architectures, new ways to reason. |
| **Long context windows** | Claude Opus 4.6 = 1M tokens. GPT-5.2 extended contexts. Llama 4 Scout = 10M (but performance lags). |
| **Multi-model routing** | "Picking one model is dead" — production agents route per task across providers. |
| **Humanity's Last Exam** | Top models (Opus 4.6, Gemini 3.1 Pro) now exceed **50%** — first time. |
| **Prompt caching ubiquitous** | 90% discount on cache reads (Anthropic + OpenAI). Layered breakpoints (system prompt / tool defs / ref docs). 7%→84% cache-hit rate transitions enable new economic regimes. |
| **Caveat** | Extended thinking + caching *don't mix well* across providers (works on Anthropic Direct; fails differently on Bedrock, Vertex). |

### 3.3 Timeline

- **Q4 2025** — Claude Opus 4.5, Gemini 3 Pro, GPT-5.1 ship as next-gen flagships.
- **Jan 2026** — OpenAI prompt-caching becomes automatic on prompts > 1,024 tokens.
- **Mar 2026** — Stanford AI Index 2026 published. Claude Opus 4.7 released; DeepSeek V4 follows 8 days later.
- **April 2026** — Claude Opus 4.6/4.7 + Gemini 3.1 Pro cross 50% on Humanity's Last Exam.

### 3.4 Pertinent Patterns for SparkForge

- **Reasoning vs. fast modes** is the perfect game mechanic for kids: "Think mode" (slow, careful) vs. "Quick mode" (fast, often wrong).
- **Multi-model routing** maps to a kid-level "pick the right tool for the job" mechanic.
- **Prompt caching** is a teachable efficiency concept — visually represented as a memory shelf.

---

## 4. Context Engineering

### 4.1 Summary

Context Engineering is the discipline of designing the architecture that feeds an LLM the right information at the right time. Gartner forecasts **80% of AI tools** will use context-engineering practices by 2028, with **+30% accuracy** improvement. The four canonical "moves" are: **Offload · Retrieve dynamically · Isolate · Reduce**.

### 4.2 Key Findings & Data

| Technique | What it does |
|---|---|
| **Context Compression** | Trim and summarize older context, preserve relevant bits |
| **Context Budgeting** | Allocate token slots: blueprint / RAG / history / inter-agent / response reserve |
| **Multi-Technique Compression** | Conversation summarization + document chunking with relevance scoring + episodic memory encoding |
| **Strategic Retrieval** | Offload to external systems · Retrieve dynamically · Isolate subtasks · Reduce history (preserve future-needed) |

### 4.3 Long-Context Reality Check

Larger windows ≠ better performance. **Context Rot** is documented: model performance degrades as input grows even when info fits.

| Model | Window | Long-Context Score |
|---|---|---|
| Claude Opus 4.6 | 1M | **76%** on MRCR-v2 8-needle @ 1M |
| Claude Sonnet 4.5 | 1M | 18.5% on same test |
| Llama 4 Scout | **10M** | only 15.6% on long-context reasoning |
| Models with 200K windows | 200K | regularly beat Llama 4 Scout |

### 4.4 Timeline

- **Q4 2025** — Term "Context Engineering" enters mainstream usage (LangChain, LlamaIndex, Weaviate blog series).
- **Q1 2026** — MRCR-v2, U-NIAH (multi-needle, long-needle, needle-in-needle) replace simple NIAH as benchmarks.
- **Q1 2026** — Chroma research publishes "Context Rot" paper documenting degradation curve.
- **Apr 25, 2026** — *Context Window Management for Multi-Agent AI* workshop (LLM Engg).

### 4.5 Pertinent Patterns for SparkForge

- **The "context window" is itself a visual game element** — a fixed-size shelf you fill, sort, and prioritize.
- **The four moves (Offload / Retrieve / Isolate / Reduce)** map to four buttons in a context-management puzzle.
- **Context Rot** is a great "boss mechanic": as the conversation gets longer, accuracy drops — the player must compress.

---

## 5. Multimodal / Vision-Language

### 5.1 Summary

The 2025–2026 generation of frontier models drops the historic "vision bridge" — they no longer bolt a vision encoder onto a text model. Instead, they train a **single transformer from scratch on mixed-modality token streams**. This is "Era 3a" (native input, text output): Qwen3.5/3.6, Gemma 4, Gemini 3, GPT-5.4, Phi-4-Reasoning-Vision, Claude Opus 4.6.

The open-source / proprietary gap **narrowed sharply** during the window. Tarsier2 and Eagle 2.5 now outperform GPT-4o and Gemini 2.5 Pro in **video description and long-context video reasoning**. Qwen3-VL-235B-A22B-Instruct rivals Gemini-2.5-Pro and GPT-5 across multimodal benchmarks.

### 5.2 Key Findings & Data

| Capability | Detail |
|---|---|
| **Native multimodal architectures** | Single transformer, mixed-modality early-fusion. No more bridge. |
| **Video understanding** | Tarsier2, Eagle 2.5 outperform GPT-4o, Gemini 2.5 Pro in video description |
| **2D/3D grounding** | Qwen3-VL competitive with Gemini-2.5-Pro and GPT-5 |
| **Document comprehension** | OCR + layout reasoning is now flagship-table-stakes |
| **Open-source closing the gap** | Qwen3-VL-235B-A22B-Instruct rivals top proprietary models |

### 5.3 Image / Video Generation Landscape

| Tool | Status (Apr 2026) |
|---|---|
| **OpenAI Sora** | App **shut down April 26, 2026**. API discontinuation set for **Sept 24, 2026**. Rare public cancellation from a frontier lab. |
| **Google Veo 3.1** | Active, integrated into Gemini and Vertex |
| **Google Imagen 4** | Active, leads on creative-prompt fidelity benchmarks |
| **Black Forest Labs Flux** | Active, dominant open-weights image gen |
| **DALL·E 3** | Still active inside ChatGPT for conversational refinement |

### 5.4 Timeline

- **Q4 2025** — Qwen3-VL-235B released, closes proprietary gap.
- **Q1 2026** — Tarsier2 / Eagle 2.5 surpass GPT-4o on long-context video reasoning.
- **April 26, 2026** — Sora app discontinuation.
- **April 2026** — Gemma 4 ships with vision-capable E2B/E4B variants.

### 5.5 Pertinent Patterns for SparkForge

- **"Single shared brain" vs. "specialist parts wired together"** is a teachable architecture tension.
- **Video understanding** opens up a kid-level mechanic: "Watch the clip — what just happened?" with multi-step reasoning.
- **Image/video creative tools** (Veo, Imagen, Flux, DALL·E) are increasingly **safe-for-kids when properly gated** — prompt-aware filters mature in this window.
- **Sora's discontinuation** is itself a teachable moment about how AI products fail in market — a basis for an "AI Futures" lab game.

---

## 6. AI Safety / Alignment / Evals

### 6.1 Summary

The Anthropic-led "Constitutional Classifiers" approach (a prototype version withstood **3,000+ hours of expert red teaming with no universal jailbreaks found**) became the dominant defense pattern of late 2025. The broader theme of the window: **shift from reactive jailbreak-patching to proactive security-by-design**, combining constitutional principles with formal verification and full-trajectory evaluation.

The **EU AI Act is now in effect** — sector regulations in finance, healthcare, education, and government procurement increasingly require documented safety controls. For SparkForge (children's education, ages 7–16), this trend matters: kids' AI products will face **higher bars** for safety auditing.

### 6.2 Key Findings & Data

| # | Finding | Data |
|---|---|---|
| 1 | Anthropic Constitutional Classifiers prototype | **3,000+ hours expert red teaming**, no universal jailbreaks found |
| 2 | Automated judge agreement | **70–93%** depending on implementation — eval reliability gap |
| 3 | Defense residual success | Feedback-based attacks retain **>15%** success even against layered protections |
| 4 | JBDistill benchmark | **81.8%** effectiveness, generalizes across 13 evaluation models |
| 5 | LLM-judge vulnerability | Misclassify subtly-incorrect-but-harmless responses as successful jailbreaks |

### 6.3 Production Evals Best Practices (Q1 2026 consensus)

- Score **full trajectories**, not just final outputs:
  - tool-choice correctness
  - argument validity
  - step count
  - time / cost
  - policy compliance
- Mix **deterministic rules**, **statistical methods**, **LLM-as-judge**, and **custom evaluators**.
- Layer guardrails: **input → reasoning → tool-use → output**.

### 6.4 Timeline

- **Q4 2025** — Anthropic publishes Constitutional Classifiers research.
- **Q1 2026** — JBDistill, U-NIAH benchmarks introduced.
- **Q1 2026** — Datadog, Galileo, Maxim, Portkey LLM observability platforms reach GA for full-trajectory scoring.
- **Q1 2026** — EU AI Act enforcement begins for high-risk categories.
- **Mar 2026** — JHU publishes "efficient, reusable framework to evaluate AI safety."

### 6.5 Pertinent Patterns for SparkForge

- **"Constitution"** — kids can write a list of rules and watch how an agent responds. The metaphor is intuitive (classroom rules, family rules).
- **Red-team vs. blue-team** is a natural **two-role game** — one player tries to trick, the other tries to defend.
- **Trajectory scoring** is visualizable as a "scorecard" attached to every step the AI takes.
- **EU AI Act framing** gives a real-world relevance hook for older age band (C, ages 13–16).

---

## 7. On-device / Edge AI

### 7.1 Summary

The browser is becoming an AI runtime. **WebGPU + WebAssembly** pipelines now deliver **30–70 tokens/sec** in a vanilla browser tab with up to **80% native performance**. Mixture-of-Experts models like LFM2-MoE (8.3B total / 1.5B active) load and generate **fully client-side**. Phones from Samsung, Google, and Qualcomm in 2026 ship with NPUs supporting **up to 4B-parameter Q4-quantized** local models. This is the most directly SparkForge-relevant trend in the report — it means a **cookie-licked-clean, in-browser, no-server, kids-safe LLM is now feasible** for SparkForge games.

### 7.2 Key Findings & Data

| Tech | Capability |
|---|---|
| **WebLLM** (mlc-ai) | OpenAI-compatible JS API. WebGPU + WASM. **30–70 tok/s** on consumer laptops. **80% native perf**. |
| **Transformers.js** (Hugging Face) | ONNX Runtime Web + WebGPU. Text classification, NER, QA, etc. |
| **LFM2-MoE** (Liquid AI) | **8.3B total / 1.5B active per token**. Loads, quantizes, generates entirely client-side. |
| **Phi-4** (14B, Microsoft) | **Beats GPT-4o on MATH and GPQA** (graduate-level science). Outperforms Llama 3.2 3B on every benchmark. |
| **Gemma 3 / 4** (Google) | Multimodal, **128K context**. Gemma 4 E2B/E4B variants run in **5GB RAM @ Q4** on phones, tablets, edge HW. |
| **Apple Intelligence** | Personal SLM model used for on-device personalization (e.g., suggest holiday locations from photo metadata). |
| **Hardware support** | Samsung, Google, Qualcomm phones (2026) support up to 4B-param Q4 models locally. |

### 7.3 Timeline

- **Q4 2025** — Liquid AI ships LFM2-MoE with browser demo.
- **Q4 2025** — Phi-4 (14B) released; benchmarks beat GPT-4o on MATH and GPQA.
- **Q1 2026** — WebLLM hits production maturity (OpenAI-compatible API, no server required).
- **April 2026** — Gemma 4 E2B / E4B variants released.

### 7.4 Pertinent Patterns for SparkForge

- **Browser-side LLM = no API key spend, no PII out, no latency, full kids-safety control.** Directly enables a no-cost agentic flagship game.
- **Quantization is teachable**: Q4 / Q8 / FP16 = "compression levels" that trade memory for accuracy.
- **Mixture-of-Experts** is teachable: "we have 8 specialist tutors, but only the right 1 or 2 wake up for each question."
- **Per-layer embeddings (PLE)** — Gemma's "effective parameters" are a teachable parameter-efficiency idea.

---

## 8. Cross-Cutting Insights

The seven topics interlock. The patterns below recur across multiple research areas and are the most game-design-relevant takeaways for SparkForge.

### 8.1 The "Five Pillars" of Modern AI Engineering

Every flagship product or research paper from the window touches at least three of these. Document 2 will use them as the design backbone for new flagship games:

| Pillar | One-Line Definition | Source Topics |
|---|---|---|
| **Orchestration** | Wiring multiple specialized agents together to accomplish complex tasks | 1, 2 |
| **Harness** | The deterministic scaffolding (rules, hooks, sensors) that makes a probabilistic model reliable | 2, 6 |
| **Reasoning** | Slow, deliberate, multi-step thinking — vs. fast pattern-matching | 3 |
| **Context** | Curating *what* the model sees, not just *how much* | 3, 4 |
| **Trust** | Constitutional rules + evaluations + observability that keep AI honest and safe | 6 |

### 8.2 Recurring Tension: Capability vs. Reliability

Every topic has the same shape: capability is up and to the right, but reliability lags. Long context, large parameter counts, and broad multimodality all create surface area for failure. The dominant 2026 engineering response is **constraint** — harness, context engineering, constitutional classifiers, full-trajectory evals. **Constraint-as-a-game-mechanic** is therefore unusually well-aligned with where the field is.

### 8.3 The Browser-Native Agentic Stack

Combining Topics 1, 4, and 7, a **fully browser-side agentic stack** is now feasible:

```
[ WebGPU ] → [ WebLLM / Transformers.js (SLM) ] → [ in-tab tools / MCP-shape ] → [ context-budgeted memory ] → [ in-browser eval guardrails ]
```

This stack maps directly onto SparkForge's locked tech (Next.js 15, WebGPU+TSL, Zustand, Supabase). No new infra category is required to ship a browser-side flagship.

### 8.4 The "AI Literacy Gap" Opportunity

Most consumer media still teaches AI as a **chat product**. The actual industry has moved on: agents, harnesses, context, evals, multi-modal, on-device. **There is no children's curriculum at this depth in 2026.** SparkForge has a clear differentiation lane teaching the *post-chat* AI stack.

---

## 9. Implications for SparkForge Flagship Game Design

This section is the bridge to Document 2. It distills the research into **direct mechanic candidates**, age-band hints, and lab-mapping suggestions.

### 9.1 Mechanic Candidates Discovered in Research

| Mechanic | Source Topic(s) | Age Band | Why It Works for Kids |
|---|---|---|---|
| **Wire specialist agents into a pipeline** | 1, 8 | B/C | Concrete, visual, builds intuition for "delegation" |
| **Write a "constitution," then watch a red-team try to break it** | 6 | C | Two-role play, debate-friendly |
| **Sort context shelves under a token budget** | 4 | B/C | Tetris-meets-knowledge-management |
| **Dial reasoning effort up/down per task and see cost vs. accuracy** | 3 | B/C | Live tradeoff visualization |
| **Hook hands-on: pre-tool, post-tool, and after-output** | 2 | C | Teaches the harness directly |
| **Run an SLM in the browser and feel the speed cost** | 7 | A/B/C | Tactile, immediate feedback |
| **Drop video into an agent, ask it questions about the clip** | 5 | A/B/C | Instant "wow" with ground-truth check |
| **Cache vs. fresh: replay 100 prompts, watch hit rate climb** | 3 | B/C | Numerical literacy + efficiency lesson |
| **MoE switchboard: route the question to the right specialist** | 7 | B/C | Single visual that captures Mixture-of-Experts |
| **MCP "USB-C for AI": plug-and-play tool ports** | 1 | B/C | Familiar metaphor, maps cleanly |
| **Eval scorecard on every step of an agent's trajectory** | 6 | C | Teaches trajectory evaluation, not just outputs |

### 9.2 Lab-Mapping Hints

The research suggests **at least 10 viable concepts**, most of which fit existing labs without forcing structural changes. Document 2 will commit to the final mapping.

| Lab | Likely Theme Match |
|---|---|
| **Lab 1 — What IS AI?** | Browser-native SLM demo, "what is a model?" |
| **Lab 5 — AI Helpers** | Multi-agent orchestration, MCP plug-and-play |
| **Lab 6 — AI & Ethics** | Constitution-vs-redteam, trajectory eval scorecard |
| **Lab 7 — Computer Vision** | Video reasoning, multimodal native input |
| **Lab 8 — Words & Language** | Context budgeting, token shelves |
| **Lab 9 — Build Your AI** | Reasoning dial, MoE switchboard, harness builder |
| **Lab 10 — AI Futures** | Sora-style product cancellations, on-device futures, EU AI Act framing |
| **Possible new lab** | "Agentic AI Lab" — only if 3+ flagship concepts cluster too tightly to fit an existing lab |

### 9.3 Tech-Fit Notes

All candidate mechanics fit SparkForge's locked stack with no new categories:

- **R3F + WebGPU+TSL** handles every visualization (shelves, switchboards, pipelines).
- **WebLLM / Transformers.js** can be added as a single `dynamic(import())` for browser-side SLM demos — no Anthropic/OpenAI API spend.
- **Zustand** stores can hold trajectory/eval state without new state shape categories.
- **Supabase** can persist player constitutions, custom agent pipelines, and trajectory replays.
- **Existing chrome bezel + lab-color system** absorbs all new flagship visuals.

### 9.4 Content-Length Target

Per the original brief, new flagship games target **≥ 2× content length** of current flagship games. Based on a sampling of `STAGE6B–6F` v3-FINAL documents, current flagships average roughly **6–9 phases each, plus age-band branching, plus 12–24 distinct content units**. Doubling means each new flagship targets:

- **12+ phases** (welcome → multiple learn → multiple play → reflect/judge → complete)
- **3 age-band variants per phase** (A: 7–9, B: 10–12, C: 13–16)
- **24–48 distinct content units** (scenes / prompts / scenarios / cards)
- **≥ 2 distinct play loops** (replay value)

These targets are codified in Document 2.

---


