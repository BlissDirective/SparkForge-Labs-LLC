# MYTHOS.md

## Claude Code Reference Guide — OpenMythos Architecture

**Source Repository:** https://github.com/kyegomez/OpenMythos
**Author:** Kye Gomez
**License:** MIT (2026)
**Language:** Python 100% (PyTorch)
**Install:** `pip install open-mythos` (or `uv pip install open-mythos`)

> Living reference distilled from the upstream repo for use inside Claude Code
> sessions. Every functional, architectural, and theoretical concept present in
> OpenMythos is captured here so an agent can reason about the system without
> re-fetching the source.

---

## 1. Project Identity

OpenMythos is an **independent, community-driven theoretical reconstruction**
of what Anthropic's rumored "Claude Mythos" model architecture might be. It is
built entirely from publicly available research papers and public speculation —
it is **not affiliated with, endorsed by, or connected to Anthropic**.

The project's stated purpose is to explore how **looped transformers** — where
a subset of layers is recycled through multiple iterations — could enable
deeper reasoning in **continuous latent space** rather than through
token-by-token chain-of-thought.

### Headline Claims

| Claim | Mechanism |
|---|---|
| Deeper reasoning without more parameters | Weight-shared recurrent block looped T times |
| Reasoning happens silently (no tokens emitted) | Continuous latent updates inside the loop |
| Training is stable at scale | LTI-constrained injection with spectral radius < 1 |
| Inference adapts per token | Adaptive Computation Time (ACT) halting |
| Breadth across domains | Fine-grained Mixture-of-Experts in the recurrent block |
| Cheap KV cache | Multi-Latent Attention (MLA) by default |

### Top-Level Hypothesis

> Claude Mythos likely implements a **Recurrent-Depth Transformer (RDT)** that
> recycles a shared block of layers instead of stacking hundreds of unique
> ones. More loops yield deeper reasoning without parameter growth, and the
> entire chain-of-thought happens in continuous latent space.

---

## 2. Architecture Overview

```
Input tokens
    ↓
[Embedding + RoPE]
    ↓
[Prelude P]          — standard transformer layers, run ONCE
    ↓
  e := x             — encoded input is frozen and re-injected every loop
    ↓
[Recurrent Block R]  — looped up to max_loop_iters times
  ↑_______↓          (h updated each loop with input injection e)
    ↓
[Coda C]             — standard transformer layers, run ONCE
    ↓
[RMSNorm + LM head]
    ↓
Logits (B, T, vocab_size)
```

### 2.1 The Three Stages

| Stage | Type | FFN | Runs |
|---|---|---|---|
| **Prelude** | Standard pre-norm transformer | Dense SwiGLU (`Expert`) | Once, fixed depth = `prelude_layers` |
| **Recurrent Block** | Single transformer block re-used every iteration | MoE FFN (`MoEFFN`) | Looped up to `max_loop_iters`; ACT may exit early |
| **Coda** | Standard pre-norm transformer | Dense SwiGLU (`Expert`) | Once, fixed depth = `coda_layers` |

### 2.2 The Recurrent Update Rule

```
h_{t+1} = A · h_t + B · e + Transformer(h_t, e)
```

- `h_t` — hidden state after loop iteration `t`
- `e` — encoded input produced by the Prelude, re-injected at *every* step
- `A`, `B` — learned injection parameters
- `Transformer(...)` — the shared recurrent block (attention + MoE FFN)

Re-injecting `e` each loop prevents the hidden state from drifting away from
the original signal as recurrence deepens.

### 2.3 Per-Iteration Pipeline (inside `RecurrentBlock`)

For each loop step `t`:

1. `h_loop = loop_index_embedding(h, t, loop_dim)` — inject sinusoidal loop-index signal
2. `combined = RMSNorm(h_loop + e)` — re-inject frozen encoded input
3. `trans_out = TransformerBlock(combined, …)` — shared weights, MoE FFN
4. `trans_out = trans_out + LoRAAdapter(trans_out, t)` — depth-wise delta
5. `h = LTIInjection(h, e, trans_out)` — stable recurrent update, ρ(A) < 1
6. `p = ACTHalting(h)` — per-position halting probability
7. If cumulative halting probability > `act_threshold`, exit loop early (remainder trick)

---

## 3. API Reference

All public symbols live in `open_mythos.main` and are re-exported from
`open_mythos` via `__init__.py`.

### 3.1 `MythosConfig` (dataclass)

Single container for every hyperparameter. Defaults shown:

```python
@dataclass
class MythosConfig:
    # Core
    vocab_size: int = 32000
    dim: int = 2048
    n_heads: int = 16
    n_kv_heads: int = 4
    max_seq_len: int = 4096
    max_loop_iters: int = 16
    prelude_layers: int = 2
    coda_layers: int = 2

    # Attention
    attn_type: str = "mla"          # "gqa" | "mla"
    kv_lora_rank: int = 512         # MLA only
    q_lora_rank: int = 1536         # MLA only
    qk_rope_head_dim: int = 64      # MLA only
    qk_nope_head_dim: int = 128     # MLA only
    v_head_dim: int = 128           # MLA only

    # MoE FFN
    n_experts: int = 64
    n_shared_experts: int = 2
    n_experts_per_tok: int = 4
    expert_dim: int = 512

    # Stability / extras
    act_threshold: float = 0.99
    rope_theta: float = 500000.0
    lora_rank: int = 16
    max_output_tokens: int = 4096
    dropout: float = 0.0
```

### 3.2 `OpenMythos(nn.Module)` — the top-level model

```python
class OpenMythos(nn.Module):
    def __init__(self, cfg: MythosConfig) -> None: ...

    def forward(
        self,
        input_ids: torch.Tensor,              # (B, T)
        n_loops: Optional[int] = None,        # defaults to cfg.max_loop_iters
        kv_cache: Optional[dict] = None,      # None during training
        start_pos: int = 0,
    ) -> torch.Tensor:                        # (B, T, vocab_size) logits

    @torch.no_grad()
    def generate(
        self,
        input_ids: torch.Tensor,              # (B, T) prompt
        max_new_tokens: int = 64,
        n_loops: int = 8,                     # recurrent depth per decode step
        temperature: float = 1.0,
        top_k: int = 50,                      # 0 = disabled
    ) -> torch.Tensor:                        # (B, T + max_new_tokens)
```

**`forward` behaviour:**
1. Embed tokens via `nn.Embedding(vocab_size, dim)`
2. Select RoPE buffer based on `attn_type`
3. Build causal mask (upper-triangular `-inf` when `T > 1`)
4. Run Prelude layers (dense SwiGLU FFN)
5. Freeze encoded input: `e = x` after Prelude
6. Run `RecurrentBlock` for `n_loops` iterations (ACT may end early)
7. Run Coda layers (dense SwiGLU FFN)
8. Apply RMSNorm + LM head projection

**`generate` behaviour:**
- Step 0: process full prompt, populate all per-layer KV caches
- Steps 1…N: process a single token, read prior K/V from cache
- Sampling: `probs = softmax(logits / temperature)` → top-K mask → `multinomial`

### 3.3 Internal Building Blocks

| Class | Role |
|---|---|
| `RMSNorm(dim, eps=1e-6)` | Root-mean-square layer norm; no bias, no mean subtraction |
| `GQAttention(cfg)` | Grouped Query Attention with KV cache (Ainslie et al., 2023) |
| `MLAttention(cfg)` | Multi-Latent Attention (DeepSeek-V2); cache stores compressed `c_kv` + RoPE keys |
| `Expert(dim, expert_dim)` | Single SwiGLU unit: `down(silu(gate(x)) * up(x))` |
| `MoEFFN(cfg)` | Fine-grained MoE: top-K routed experts + always-on shared experts |
| `LoRAAdapter(dim, rank, max_loops)` | Depth-wise adapter: `(down(x) * scale[t]) @ B` per loop `t` |
| `TransformerBlock(cfg, use_moe)` | Pre-norm block with swappable attention + FFN |
| `LTIInjection(dim)` | Stable recurrent update, guarantees ρ(A) < 1 by construction |
| `ACTHalting(dim)` | Linear + sigmoid → per-position halting probability |
| `RecurrentBlock(cfg)` | Shared block looped T times with ACT early exit |

### 3.4 Utility Functions

```python
def precompute_rope_freqs(dim: int, max_len: int, theta: float = 500000.0) -> torch.Tensor
# → complex64 of shape (max_len, dim // 2)

def apply_rope(x: torch.Tensor, freqs_cis: torch.Tensor) -> torch.Tensor
# Treat adjacent features as complex numbers; pointwise multiply by positional phasor

def loop_index_embedding(h: torch.Tensor, loop_t: int, loop_dim: int, theta: float = 10000.0) -> torch.Tensor
# Inject sinusoidal loop-index signal into first `loop_dim` channels of h
```

### 3.5 `MythosTokenizer`

Thin wrapper over `openai/gpt-oss-20b` tokenizer, used by training scripts.
Exposed from `open_mythos` alongside the model classes.

---

## 4. Pre-configured Model Variants

Seven scales are exported as factory functions returning a `MythosConfig`:

```python
from open_mythos import (
    mythos_1b, mythos_3b, mythos_10b,
    mythos_50b, mythos_100b, mythos_500b, mythos_1t,
    OpenMythos,
)

cfg = mythos_3b()
model = OpenMythos(cfg)
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")
```

| Variant     | `dim`  | Experts | `expert_dim` | Loop iters | Context | Max output |
|-------------|-------:|--------:|-------------:|-----------:|--------:|-----------:|
| `mythos_1b` |  2 048 |      64 |        2 048 |         16 |    4 k |        4 k |
| `mythos_3b` |  3 072 |      64 |        4 096 |         16 |    4 k |        4 k |
| `mythos_10b`|  4 096 |     128 |        5 632 |         24 |    8 k |        4 k |
| `mythos_50b`|  6 144 |     256 |        9 728 |         32 |    8 k |        4 k |
| `mythos_100b`| 8 192 |     256 |       13 568 |         32 |    1 M |      128 k |
| `mythos_500b`|12 288 |     512 |       23 040 |         48 |    1 M |      128 k |
| `mythos_1t` | 16 384 |     512 |       34 560 |         64 |    1 M |      128 k |

## 5. Configuration Recipes

### Minimal (fits on a laptop, for tests)

```python
small_cfg = MythosConfig(
    vocab_size=8192, dim=256, n_heads=4, n_kv_heads=2,
    max_seq_len=512, max_loop_iters=4, prelude_layers=1, coda_layers=1,
    attn_type="gqa",
    n_experts=8, n_shared_experts=1, n_experts_per_tok=2, expert_dim=64,
    lora_rank=4,
)
```

### Production (MLA + MoE)

```python
prod_cfg = MythosConfig(
    vocab_size=32000, dim=2048, n_heads=16, n_kv_heads=4,
    max_seq_len=4096, max_loop_iters=16, prelude_layers=2, coda_layers=2,
    attn_type="mla",
    kv_lora_rank=512, q_lora_rank=1536,
    qk_rope_head_dim=64, qk_nope_head_dim=128, v_head_dim=128,
    n_experts=64, n_shared_experts=2, n_experts_per_tok=4, expert_dim=512,
    act_threshold=0.99, rope_theta=500000.0, lora_rank=16,
)
```

## 6. Canonical Usage Example

```python
import torch
from open_mythos.main import OpenMythos, MythosConfig

attn_type = "mla"  # or "gqa"
base = dict(
    vocab_size=1000, dim=256, n_heads=8, max_seq_len=128,
    max_loop_iters=4, prelude_layers=1, coda_layers=1,
    n_experts=8, n_shared_experts=1, n_experts_per_tok=2,
    expert_dim=64, lora_rank=8, attn_type=attn_type,
)

if attn_type == "gqa":
    cfg = MythosConfig(**base, n_kv_heads=2)
else:
    cfg = MythosConfig(
        **base, n_kv_heads=8,
        kv_lora_rank=32, q_lora_rank=64,
        qk_rope_head_dim=16, qk_nope_head_dim=16, v_head_dim=16,
    )

model = OpenMythos(cfg)
ids    = torch.randint(0, cfg.vocab_size, (2, 16))
logits = model(ids, n_loops=4)                  # (2, 16, 1000)
out    = model.generate(ids, max_new_tokens=8, n_loops=8)

# Sanity check: stability invariant
A = model.recurrent.injection.get_A()
assert A.max().item() < 1.0, "Spectral radius must stay < 1"
```

---

## 7. Training

Training entry point: `training/3b_fine_web_edu.py`.

```bash
# Single GPU
python training/3b_fine_web_edu.py

# Multi-GPU (auto-detect count)
torchrun --nproc_per_node=$(python -c "import torch; print(torch.cuda.device_count())") \
    training/3b_fine_web_edu.py
```

### 7.1 Training Design Choices

| Feature      | Detail |
|---|---|
| Optimizer    | AdamW |
| Dataset      | `HuggingFaceFW/fineweb-edu` (`sample-10BT` default) |
| Tokenizer    | `openai/gpt-oss-20b` via `MythosTokenizer` |
| Parallelism  | PyTorch DDP through `torchrun` with sharded streaming |
| Precision    | bfloat16 on H100/A100; float16 + `GradScaler` on older GPUs |
| Schedule     | Linear warmup (2 000 steps) → cosine decay |
| Target       | ~30 B tokens (Chinchilla-adjusted for looped architecture) |

### 7.2 Recommended Datasets

| Dataset         | HF path                                  | Tokens | License   | Use |
|---|---|---:|---|---|
| FineWeb-Edu     | `HuggingFaceFW/fineweb-edu`              |  1.3 T | Apache 2.0| Primary pretraining |
| OpenHermes 2.5  | `teknium/OpenHermes-2.5`                 | ~1 M samples | Apache 2.0 | Instruction tuning (~5 % mix) |
| OpenWebMath     | `open-web-math/open-web-math`            | 14.7 B | ODC-By    | Math / reasoning boost |

### 7.3 Token Budget (Chinchilla vs. Looped)

| Variant | Chinchilla-optimal | Recommended (looped) |
|---|---|---|
| 1B    |   ~20 B | ~10–15 B |
| 3B    |   ~60 B | ~30–40 B |
| 10B   |  ~200 B | ~100–150 B |
| 50B+  |   ~1 T+ | ~500 B+ |

The looped architecture is more sample-efficient than a standard transformer —
it converges faster per token because each loop amounts to an extra pass of
reasoning over the same data.

---

## 8. Theoretical Foundations

The README distills seven interlocking ideas that motivate the architecture.

### 8.1 Systematic Generalization

Looped transformers pass compositional-generalization tests vanilla models
fail. Capability emerges through **three-stage grokking**:

1. Memorization of the training distribution
2. In-distribution generalization over known compositions
3. Systematic generalization over novel compositions

This explains why a Mythos-style model may exhibit **phase-transitions** in
capability rather than smooth curves.

### 8.2 Depth Extrapolation

Train on 5-hop reasoning chains, test on 10-hop: vanilla transformers fail,
looped ones succeed by simply running more loops at inference. Directly maps
to multi-step math, long-horizon planning, and layered arguments without any
visible chain-of-thought.

### 8.3 Latent Thoughts as Implicit Chain-of-Thought

Each loop iteration is a reasoning step in **continuous latent space**, not
token space. A model running T loops implicitly simulates T steps of CoT
(Saunshi et al., 2025). Because latent thoughts are continuous, they can
represent *multiple* next-step alternatives simultaneously — effectively
breadth-first search within a single forward pass.

### 8.4 Parameter Efficiency

A k-layer block looped L times matches the quality of a kL-layer stack with
only k layers of parameters. Consequences:

- Memory footprint does **not** grow with reasoning depth
- Inference compute scales with loop count, not model size
- Deeper reasoning is effectively "free" in parameter terms

### 8.5 The Stability Problem → LTI-Constrained Injection

Looped training classically fails through **residual explosion** or **loss
spikes**. Reframe looping as a discrete LTI dynamical system:

```
h_{t+1} = A · h_t + B · e
```

Stability is controlled by the spectral radius of A:
`ρ(A) < 1` ⇒ convergent; `ρ(A) ≥ 1` ⇒ divergent.

**The fix (Parcae architecture):**

1. Parameterize A as a continuous *negative* diagonal matrix
2. Discretize using ZOH/Euler: `A_discrete = exp(Δt · A_continuous)`
3. Enforce negativity via `A := Diag(-exp(log_A))` with learned scalar `Δt`
4. Result: `ρ(A) < 1` holds **by construction**, always

Implemented in `LTIInjection`. Exposed via `model.recurrent.injection.get_A()`.

### 8.6 Scaling Laws (Parcae)

Parcae establishes predictable scaling laws for looped models:

- **Training:** with a fixed FLOP budget at fixed parameters, raising mean
  recurrence (and lowering token count) beats more tokens at minimal loops.
  Optimal recurrence and token count both follow power laws with consistent
  exponents across scales.
- **Inference:** additional test-time loops improve quality following a
  saturating exponential decay — real but diminishing returns, mirroring CoT
  inference scaling.
- **Empirical result:** a 770 M looped model matches the downstream quality of
  a 1.3 B fixed-depth transformer trained on the same data — roughly **half
  the parameters for equivalent quality**.

### 8.7 Loop-Index Embedding Hypothesis

Without a positional signal across loop iterations, shared weights must handle
both early pattern-matching and late refinement simultaneously. Injecting a
**RoPE-like loop-index embedding** at each step allows the same weights to
implement functionally distinct phases per iteration.

Implemented in `loop_index_embedding(h, loop_t, loop_dim)` — injected as the
first operation inside each recurrent iteration.

### 8.8 Overthinking and Adaptive Computation Time

More loops is **not** always better: beyond a certain depth, excess recurrence
degrades predictions (hidden state drifts past the solution).

Solution: **ACT halting** (Dehghani et al., 2018, Universal Transformer). A
learned per-position scalar decides when to stop looping. Harder positions get
more compute; simple ones halt early. Also makes the model Turing-complete
under standard assumptions.

Implemented in `ACTHalting` + the cumulative-halting early-exit logic inside
`RecurrentBlock` (remainder trick at threshold `cfg.act_threshold = 0.99`).

### 8.9 Mixture of Experts for Breadth

Looping explains depth, not breadth. To handle code, math, literature, law, and
science with the same weights, every FFN inside the recurrent block is
replaced by **fine-grained MoE**:

- `n_experts` routed SwiGLU FFNs (each ~1/m of standard width)
- Per-token router picks the top `n_experts_per_tok`
- `n_shared_experts` **always-on** FFNs absorb domain-general knowledge
  (syntax, basic reasoning) that would otherwise be redundantly learned

As `h_t` evolves across loops, the router may pick different experts at
different depths — making every loop computationally distinct despite weight
sharing. Routing collapse is prevented via dynamically-adjusted router logits
that keep load balanced without distorting the loss signal.

Activated parameters per token ≈ `(n_experts_per_tok / n_experts) × routed + all shared`
(roughly **~5 %** of total at scale).

### 8.10 Memorization–Reasoning Tradeoff

Looped architectures favour *composition* over *rote memorization*. They
improve reasoning but can hurt factual recall. This explains the observable
pattern of strong novel-problem reasoning coexisting with inconsistent
factual knowledge. Looping-based regularization (Saunshi et al., 2025) can
rebalance the two during training.

### 8.11 Depth-Wise LoRA (Relaxed Recursive Transformers)

Between pure weight-tying (max efficiency, min expressiveness) and fully
distinct layers (max expressiveness, no savings) lies a middle path:

- Share a large common weight matrix across loops (the "recursive base")
- Add a small rank-r LoRA adapter **per iteration depth**
- Overhead is tiny, expressiveness is substantially recovered

Implemented in `LoRAAdapter`: `(down(x) * scale[t]) @ B`, where `scale` is an
`Embedding(max_loops, rank)` table indexed by loop `t`.

### 8.12 Continuous Depth-Wise Batching

Because every token flows through the same shared block, different tokens —
or entire different sequences — can exit the loop at different depths within
the **same batch**. Easy inputs halt early; hard ones keep iterating. Reported
to deliver **2–3× inference throughput** in deployed settings.

---

## 9. Design Property Matrix

| Property                  | Mechanism in OpenMythos                          | Benefit |
|---|---|---|
| Depth extrapolation       | Weight-shared recurrent block                    | Train on N, infer on N+k with no retraining |
| Parameter efficiency      | Weight sharing across iterations                 | k-layer quality with k params; compute ∝ L |
| Adaptive compute          | `ACTHalting` per-position                        | Easy tokens exit early in same batch |
| Stable training           | `LTIInjection` with ρ(A) < 1                     | No residual explosion; robust LRs |
| Domain breadth            | `MoEFFN` in recurrent block                      | Different experts per loop depth |
| Loop differentiation      | `loop_index_embedding`                           | Same weights, functionally distinct phases |
| Efficient KV memory       | `MLAttention` (default) or `GQAttention`         | MLA: 10–20× smaller cache vs. standard |
| Depth-wise adaptation     | `LoRAAdapter`                                    | Expressiveness beyond pure weight-tying |
| Variable-depth batching   | ACT + shared block                               | 2–3× inference throughput |

---

## 10. Repository Map

```
OpenMythos/
├── open_mythos/
│   ├── __init__.py           # re-exports model, config, utils, variants, tokenizer
│   ├── main.py               # OpenMythos + all sub-modules + utilities
│   └── (tokenizer module)    # MythosTokenizer wrapper around gpt-oss-20b
├── docs/
│   ├── open_mythos.md        # full API reference
│   └── datasets.md           # dataset + token-budget guidance
├── tests/                    # test suite
├── training/
│   └── 3b_fine_web_edu.py    # 3B FineWeb-Edu training script (DDP-ready)
├── example.py                # minimal usage example
├── variants_example.py       # instantiate mythos_1b and count params
├── test_main.py              # top-level smoke test
├── pyproject.toml
├── requirements.txt
├── LICENSE                   # MIT
└── README.md
```

---

## 11. Claude Code Playbook

Heuristics for an agent integrating, forking, or reasoning about OpenMythos.

### 11.1 Installation

```bash
pip install open-mythos
# or (for local dev)
git clone https://github.com/kyegomez/OpenMythos
cd OpenMythos
pip install -e .
```

### 11.2 Golden Path

1. Pick a variant (`mythos_1b()` for first runs; scale up after a smoke test).
2. Instantiate `OpenMythos(cfg)`; count params to verify the target scale.
3. Run `model(ids, n_loops=4)` on a random batch to validate shapes.
4. Call `model.generate(ids, max_new_tokens=8, n_loops=8)` to validate KV cache.
5. Assert `model.recurrent.injection.get_A().max().item() < 1.0`.
6. For training, launch `training/3b_fine_web_edu.py` via `torchrun`.

### 11.3 Debugging Checklist

| Symptom | Likely cause | Check |
|---|---|---|
| Loss spikes / NaNs | Spectral radius ≥ 1 | `get_A()` max; ensure `LTIInjection` in use |
| Hidden state explodes across loops | Missing input injection | Confirm `e` re-added every iteration |
| All tokens halt instantly | `act_threshold` too low | Raise toward 0.99; check `ACTHalting` init |
| KV cache blows memory | GQA instead of MLA | Switch `attn_type="mla"` |
| Router collapse (few experts hot) | Load imbalance | Verify router-logit balancing is active |
| Loops behave identically | Missing loop-index signal | Ensure `loop_index_embedding` is applied |
| Ballooning params per variant | LoRA rank too high | Lower `lora_rank` (default 16) |

### 11.4 Tuning Levers (in rough order of impact)

1. `max_loop_iters` — single biggest lever for reasoning depth at inference
2. `n_experts` / `n_experts_per_tok` — breadth vs. compute tradeoff
3. `attn_type` — `"mla"` for long context, `"gqa"` for simplicity
4. `prelude_layers` / `coda_layers` — capacity outside the loop
5. `act_threshold` — controls average inference depth
6. `lora_rank` — per-iteration expressiveness
7. `rope_theta` — extend effective context window

### 11.5 What to Avoid

- Stacking more Prelude / Coda layers instead of adding loops — defeats the
  parameter-efficiency argument.
- Bypassing `LTIInjection` with a plain residual add — removes the stability
  guarantee.
- Training with `ACTHalting` disabled on a fixed, large `n_loops` — invites
  "overthinking" and wasted compute.
- Disabling shared experts in `MoEFFN` — forces routed experts to re-learn
  common-knowledge features redundantly.

---

## 12. Key File Pointers

| Path | Why it matters |
|---|---|
| `open_mythos/main.py`            | Every class in Section 3 lives here |
| `open_mythos/__init__.py`        | Public surface + variant factories |
| `docs/open_mythos.md`            | Full upstream API reference |
| `docs/datasets.md`               | Dataset choices + token budgets |
| `training/3b_fine_web_edu.py`    | Canonical training recipe |
| `example.py`, `variants_example.py` | Minimal runnable demos |

---

## 13. References

### Papers

- **Parcae — Scaling Laws for Stable Looped Language Models** (Prairie et al., 2026) — https://arxiv.org/abs/2604.12946 · blog: https://sandyresearch.github.io/parcae/
- **Universal Transformers** (Dehghani et al., 2018) — https://arxiv.org/pdf/1807.03819
- **Reasoning with Latent Thoughts — On the Power of Looped Transformers** (Saunshi et al., 2025) — https://arxiv.org/abs/2502.17416
- **Training LLMs to Reason in a Continuous Latent Space** — https://arxiv.org/abs/2412.06769
- **Relaxed Recursive Transformers — Effective Parameter Sharing with Layer-wise LoRA** (Bae et al., 2024) — https://arxiv.org/pdf/2410.20672
- **Loop, Think, & Generalize — Implicit Reasoning in Recurrent Depth Transformers** — https://arxiv.org/pdf/2604.07822
- **Fine-grained Expert Segmentation & Shared Expert Isolation in MoE** — https://arxiv.org/abs/2401.06066
- **Mixture-of-Depths Attention** — https://arxiv.org/abs/2603.15619

### Community Threads (X / Twitter)

- Looped-transformer theory — `@realsigridjin`
- Implicit reasoning over parametric knowledge — `@yuekun_yao`
- Cyclic trajectories and input injection — `@rosinality`
- Parcae scaling-laws thread — `@hayden_prairie`
- RoPE-like loop-index embedding — `@davidad`
- On the Looped Transformers controversy — `@ChrisHayduk`, `@realsigridjin`

### Citation

```bibtex
@software{gomez2026openmythos,
  author = {Kye Gomez},
  title  = {OpenMythos: A Theoretical Reconstruction of the Claude Mythos Architecture},
  year   = {2026},
  url    = {https://github.com/kyegomez/OpenMythos},
  note   = {Recurrent-Depth Transformer with MoE, MLA, LTI-stable injection, and ACT halting}
}
```

---

## 14. Disclaimer

OpenMythos is an independent, community-driven theoretical reconstruction
based solely on publicly available research and speculation. It is **not
affiliated with, endorsed by, or connected to Anthropic** or any of their
proprietary systems. Treat all architectural claims about "Claude Mythos" as
hypotheses grounded in the cited literature, not statements of fact about any
Anthropic product.

