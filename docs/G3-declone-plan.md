# G3 — De-clone the Standard Tier · Execution Plan

**Mandate (rebuild plan §II.8 G3):** give each standard game a distinct verb and real consequences (kill the "same drag, different labels" clone feel), per-level themed content, celebration + Sparky reactions everywhere, and cut 10-levels-of-padding to 5 real levels where content is thin. Per-game direction is §II.4. G1 (honesty) and G2 (flagship engines) are done; this is the standard tier.

**Method:** waves of parallel agents over disjoint game files, each doing ONE game's full §II.4 redesign. Preserve each game's `GameShell` props + `completeGame('<slug>', stars)` + ARIA + age band. No game may lie or leak its answer (G1 rules still apply). Gate each wave (tsc + 817 tests + build), commit, push both branches.

## Wave A — self-contained REDESIGNs, no assets, no deps (IN PROGRESS)
| Game | slug | §II.4 redesign |
|---|---|---|
| Human vs Machine | human-vs-machine | Third bin **Better Together**; place a chip → a "2026 reality check" card (AI drafts, human judges); Sparky as game-show referee. Kills the "confident falsehood" of clean human/machine wins. |
| Code Blocks | code-blocks | Keep ordering, but wired programs **run**: an output console animates line-by-line, the loop actually iterates, the "no update" decoy visibly infinite-loops until Sparky sparks out. Band C: debug AI-generated code. |
| Lost in Translation | lost-in-translation | **Telephone game with real text**: a sentence visibly mutates each hop ("raining cats and dogs" → "rain of animals falls"); kid picks the hop where meaning broke or routes to keep it intact. Back-translation framing. |
| Career Explorer | career-explorer | **"A day in the AI lab"**: each round is a real problem ticket ("our model calls everyone a cat!") → dispatch the right specialist → Sparky-narrated fix vignette. Careers by function, not flashcards. Add Harness Engineer / MCP Integrator. |

## Wave B — self-contained REDESIGNs (deps/tokenizer handled by orchestrator first)
| Game | slug | redesign |
|---|---|---|
| Token Chopper | token-chopper | Show a real sentence; tap **cut points**; a real client-side tokenizer reveals the model's actual splits; score by boundary match; live token-count/limit meter; token-cost compare. (Orchestrator wires the tokenizer dep.) |
| Prediction Market | prediction-market | A real market: crowd price (72¢), BUY yes/no with a coin budget + stake slider, pre-resolved historical questions resolve → payouts; over/under-confidence costs coins (= calibration). Sparky announcer. |
| Chatbot Builder | chatbot-builder | Wiring is consequential: a real test message flows through the wired graph and **produces an actual reply** in a phone mockup; wrong routing → funny wrong answers. Remove decoy-color giveaway. Band C: LLM+system-prompt level. |
| My First AI App | my-first-ai-app | Wire Input→model→Output and **see the app run** on real input (not "App shipped!" text). Remove "(dead)" decoy giveaway. |

## Wave C — POLISH: themed content banks + juice + Sparky + cut padding
AI Spy (themed scene pools), Time Machine (draggable **timeline track**, not 3 bins), Word Predictor (two-beat: commit → distribution animates in, partial credit — G1 already removed the on-card bar), Tool Picker (add Generative + Agent bins / compose mode), Data Shield (context-shifting scenarios, "what's safe to paste into a chatbot"), Sentiment Scanner (per-level themed banks + sarcasm/uncertainty), Emoji Decoder (show glyph+token, sequence mode), Build Classifier (add TRAIN→TEST back half + poisoned-label level), Ethics Courtroom (G1 already hid pre-commit strength; add animated jury + rival-lawyer rounds), Data Detective (evidence-board case files).

## Wave D — asset-dependent, built with SVG/CSS mock artifacts (no photos)
Real or Fake (mock headlines/quote cards with layout + subtle glitches; magnifier; "detectors have false positives" level), AI Art Detective (SVG image pairs w/ hotspots; center C2PA/provenance as the 2026 lesson), Pixel Investigator (zoomable SVG "photo" patches + edge-filter toggle), Camera Quest (viewfinder pan/zoom over an illustrated scene, snap sprites → mini-classifier tests itself), Fool the AI (mock classifier + live confidence bar; player is the attacker spending an edit budget).

## Wave E — REPLACE / real-engine rebuilds (largest)
Pet Trainer (trial-based RL loop on ReactionArena), Robot Vacuum (rebuild on PhaserMazeStage w/ coverage %), Neural Builder (real tiny JS net + live decision boundary), Sort Toy Box (real k-means w/ moving centroids, permutation-matched scoring — G1 already softened false claims + fixed timer), Bias Detective (ConnectBoardScene evidence web + fix-and-watch-bars), Neuron Relay (signal-strength weights + firing threshold, not path-finding), Agent Architect (deterministic world-state branches + debug mode), Prompt Lab (server-side multi-turn + Claude-rubric judging + Prompt Battle + light theme), API Explorer (quest tickets + light theme + /agent endpoint).

## Notes
- KEEP (light polish only): Treat Trainer (watch-BFS mode), Prompt Lab, API Explorer.
- Games already partially advanced by G1: Word Predictor (bar removed), Ethics Courtroom (pre-commit strength hidden), Sort Toy Box (timer + honesty), Token Chopper (aria leak fixed).
- Asset constraint: no photographs can be produced here — Wave D uses SVG/CSS-drawn mock artifacts, which §II.4 explicitly endorses for Real or Fake.

---

## Status (end of session) — G3 substantially COMPLETE

**29 of 32 game-items shipped** across waves A–E (both branches). Every audit-**critical**
issue is resolved library-wide: all cloned mechanics de-cloned into distinct verbs, all
dishonest scoring/leaks fixed (G1 + the real-engine rebuilds), all orphaned engines wired (G2).

**Shipped:** A (Human vs Machine, Career Explorer, Code Blocks, Lost in Translation) · B (Token
Chopper, Prediction Market, Chatbot Builder, My First AI App) · C1 (AI Spy, Time Machine, Tool
Picker, Data Shield, Word Predictor) · C2 (Sentiment Scanner, Emoji Decoder, Build Classifier,
Ethics Courtroom, Data Detective) · D (Real or Fake, AI Art Detective, Pixel Investigator,
Camera Quest, Fool the AI) · E1 (Pet Trainer, Robot Vacuum, Neural Builder, Sort Toy Box, Neuron
Relay) · E2 (Bias Detective).

**Deferred (E2 tail — 3 optional POLISH items on already-functional games; needs the parallel
agent budget, which hit the daily limit):**
- **Agent Architect** — give each mission a tiny world-state so Decide/Check depend on block
  configs; surface the dead debug-challenge data as a "Fix the Broken Agent" mode; label Tool
  blocks as MCP + add a token/cost budget. (G1 already made the branch deterministic; game is
  honest + functional today.)
- **API Explorer** — quest/bug-ticket structure over the sandbox; /agent tool-use endpoint +
  streaming; surface-consistency pass. (Functional today.)
- **Prompt Lab** — revive Prompt Battle (two prompts, Sparky judges via the existing scorer);
  server-side multi-turn history + Claude-rubric challenge judging (API-route work). (The
  library's strongest game; functional today — polish only, do carefully.)

These are enhancements, not fixes: all 42 games are functional and honest. Complete them as a
focused agent wave when the budget resets.
