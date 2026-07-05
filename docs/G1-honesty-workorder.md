# G1 — Honesty & Integrity Sweep · Fix Work-Order

**Source:** Fable-5-SparkForge-Rebuild.md §II.2 (systemic findings S1–S6) + §II.8 G1.
**Rule:** Nothing ships that lies about how AI works or leaks its own answer before the child commits.
**Scope discipline:** G1 makes games *stop lying/leaking*. It does NOT redesign them (that is G3) or wire the orphaned engines (that is G2). Where honest scoring needs a real engine, G1 changes only the *claim/copy* so the game no longer asserts something false.

## Architecture map

| Primitive | Renderer | Games |
|---|---|---|
| CONNECT | `pixi/PixiConnectStage.tsx` → `pixi/scenes/ConnectBoardScene.tsx` | NeuronRelay, MyFirstAiApp, LostInTranslation, FutureForge, ChatbotBuilder, CodeBlocks (+ CareerExplorer uses a different `matching()` builder — NOT affected) |
| BIN-SORT | `pixi/PixiBinSortStage.tsx` → `pixi/scenes/SortDragScene.tsx` | EmojiDecoder, TokenChopper, SentimentScanner, ToolPicker, FoolTheAi, DataShield, BuildClassifier, BiasDetective, TimeMachine, HumanVsMachine, PredictionMarket, AiArtDetective |
| SORT | `pixi/PixiSortStage.tsx` | SortToyBox |
| REVEAL | `pixi/PixiRevealStage.tsx` | AiSpy, RealOrFake, PixelInvestigator, CameraQuest |
| REACT | `pixi/PixiReactStage.tsx` → `pixi/scenes/ReactionArena.tsx` | WordPredictor |
| QUIZ | `shared/QuizLevelRenderer.tsx` | McpLab, DataDetective, PixelWitness, GlassBox, ContextArchitect |
| SIMULATION | `shared/SimulationLevelRenderer.tsx` | PetTrainer, AgentAtelier, PocketBrain, HarnessForge, RobotVacuum |

`shared/DragDropLevelRenderer.tsx` — imported by no game (dead). Ignore.

## Fix clusters (file-disjoint; A–E can run in parallel)

### Cluster A — CONNECT grey telegraph (S4.1)
Files: `NeuronRelayGame.tsx`, `MyFirstAiAppGame.tsx`, `LostInTranslationGame.tsx`, `FutureForgeGame.tsx`, `ChatbotBuilderGame.tsx`, `CodeBlocksGame.tsx`.
In each `layered()` builder, decoy nodes are painted grey `#5A6078` (`color: onPath ? undefined : '#5A6078'`), telegraphing the correct path before wiring. Fix: uniform `color: undefined` for every node (ConnectBoardScene falls back to `labColor`); correctness still shows post-commit via `edgeColors`. Also strip literal ` (dead)`/`(unsorted)` parentheticals from decoy labels.

### Cluster B — SORT answer leaks (S4.2)  ·  DONE BY ORCHESTRATOR
Files: `TokenChopperGame.tsx:129`, `EmojiDecoderGame.tsx:130`, `SentimentScannerGame.tsx:129`, `ToolPickerGame.tsx:129`. The chip AT `name` embeds the correct bin: `` `"${it.label}" (${BINS[it.bin]})` ``, surfaced visibly + in aria-label by PixiBinSortStage. Fix: drop the ` (${BINS[it.bin]})` suffix. (FoolTheAi S4.3 excluded — deferred to G3; the label *is* the content, neutralizing guts the game.)

### Cluster C — commit-time reveal (S4.4 + S4.5)  ·  DONE BY ORCHESTRATOR
`EthicsCourtroomGame.tsx`: argument-strength badges (green/amber/red) render in the `argue` step before the child chooses, and the aria-label leaks `Strength: ${arg.strength}`; scoring rewards the strong ones. Fix: remove the strength `<span>` and the aria strength suffix from the `argue` step; show strength only in the `verdict` step (post-commit). `WordPredictorGame.tsx:189`: `makeTarget` returns `prob: cand.prob`, drawing a probability bar on the card the child is meant to predict. Fix: drop `prob` from the returned object (ReactionArena's bar is already conditional); the child predicts from the sentence context.

### Cluster D — dishonest sim + broken timers (S5.1–S5.5)
Files: `SortToyBoxGame.tsx`, `NeuralBuilderGame.tsx`, `AgentArchitectGame.tsx`, + honesty-copy in the SimLevelRenderer games (`PetTrainerGame.tsx` et al.).
- **Timers (safe logic fix):** SortToyBox ~L158 and NeuralBuilder ~L153 use `useState(() => {…})` as an effect — runs once at mount when `phase==='welcome'`, so timed levels never count down. Convert to `useEffect(…, [phase, …])` with interval cleanup.
- **SortToyBox honesty:** concept strings claim "K-means clustering" while `ai[t.id] = indexOf(type) % maxGroups` + `hiddenWeight: Math.random()` + always-true `isGoodGrouping`. G1: soften the concept/reveal copy so it stops asserting a real algorithm; remove the `Math.random()` "feature"; make per-drop feedback neutral (honest verdict only at reveal). Real k-means = G2.
- **NeuralBuilder honesty:** accuracy is independent of the built network (`simulateTraining` never reads layers/nodes; `handleTest` is `Math.random()`-gated). G1: soften concept strings that claim architecture matters. Real toy-training = G2. (Do NOT invest in fake scoring.)
- **AgentArchitect:** Decide/Check branch at ~L738 is `Math.random() > 0.5` narrated as real reasoning. G1: make the branch deterministic/labeled (seed from block config/index, or narrate "taking the YES path for this demo") so it stops claiming a real decision.
- **Slider sims (copy only):** PetTrainer/AgentAtelier/PocketBrain/HarnessForge/RobotVacuum CONCEPTS + `description` claim real ML (reinforcement/supervised learning, hyperparameters). Soften to "adjust the dials and see what happens" until G2 wires the orphaned engines.

### Cluster E — band filtering + registry honesty (S6 + registry)  ·  DONE BY ORCHESTRATOR
- **Band filter (one place heals 5 quiz games):** `shared/QuizLevelRenderer.tsx` declares `QuizQuestion.band` but never reads it, so a band-A 7-year-old gets band-C questions. Fix: import `useActiveChild`, derive `ageBand = activeChild?.age_band ?? 'B'`, filter `questions` by `BAND_ORDER[q.band] <= BAND_ORDER[ageBand]` (reuse `useFilteredContent`'s predicate), fall back to unfiltered if a level filters to 0. EthicsCourtroom already filters. Only QuizLevelRenderer carries unfiltered band tags — Sim/DragDrop content has no band tags (band gating there is a G2/G3 no-op).
- **Registry copy:** `config/gameRegistry.ts` — rewrite `description` strings to match shipped reality (copy only; do NOT flip `has3D`/`component3D` — that is scene-routing architecture, needs separate approval). Most urgent: **pocket-brain** "Run a real AI in your browser tab" must not claim a running model. Header comment "All 35 games" → 42.

## Test impact
`tests/e2e/game-migration-smoke.spec.ts` is a load/smoke test; none of these fixes break an existing assertion. No unit tests cover QuizLevelRenderer / SimulationLevelRenderer / sim scoring. Band-filter change may warrant a new test but breaks nothing.
