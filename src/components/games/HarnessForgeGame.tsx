// ════════════════════════════════════════════════════════════════════════
// HARNESS FORGE — Lab 11 Flagship (Constrain step of Build → Equip → Constrain)
// ════════════════════════════════════════════════════════════════════════
// The child wraps a saved agent team in THREE layers of safety harness —
// an input filter, an output validator, and a behavior monitor — then
// stress-tests it against a battery of tricky prompts and sees exactly
// which layer caught which attack.
//
// This component is pure UI: every rule of logic lives in the engine
// (src/lib/harness/*) and the phase machine lives in the store
// (src/stores/harnessForgeStore.ts). We drive the store through its full
// phase machine: welcome → tutorials → save-select → configure the three
// layers → stress-test → report → save → complete.

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import {
  useHarnessForgeStore,
  type HarnessForgePhase,
} from '@/stores/harnessForgeStore';
import { FILTER_RULE_META } from '@/lib/harness/filterLayer';
import { VALIDATOR_RULE_META } from '@/lib/harness/validatorLayer';
import { MONITOR_RULE_META } from '@/lib/harness/monitorLayer';
import { fixturesForBand } from '@/lib/harness/stressTestFixtures';

const ACCENT = '#E945F5';

const LAYER_META = {
  filter: { label: 'Input Filter', color: '#0FB8FA', emoji: '🛡️' },
  validator: { label: 'Output Validator', color: '#B67BFF', emoji: '✅' },
  monitor: { label: 'Behavior Monitor', color: '#FF7050', emoji: '👁️' },
} as const;

// A ready-to-harness sample team, used when the child has no saved
// compositions yet (fresh account / demo). It is a valid 3-agent chain
// (Researcher → Writer → Critic) so `simulate()` produces a real
// trajectory the harness can act on. Clearly labelled "Sample" in the UI;
// its harness is never written back to the database (no such row exists).
const DEMO_SAVE_ID = 'sample-harness-team';
const DEMO_SAVE = {
  comp: {
    id: DEMO_SAVE_ID,
    childId: 'sample',
    name: 'Sample Team · Researcher → Writer → Critic',
    team: [
      { agentId: 'researcher', position: [-0.6, 0] as [number, number] },
      { agentId: 'writer', position: [0, 0] as [number, number] },
      { agentId: 'critic', position: [0.6, 0] as [number, number] },
    ],
    wires: [
      { fromAgentId: 'researcher', fromOutputName: 'facts', toAgentId: 'writer', toInputName: 'notes' },
      { fromAgentId: 'writer', fromOutputName: 'text', toAgentId: 'critic', toInputName: 'artifact' },
    ],
    createdAt: new Date(0).toISOString(),
  },
  bindings: [],
  harness: null,
};

// ─── Small building blocks ───────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  hint,
  color,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  hint: string;
  color: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
      style={{ borderColor: checked ? color : undefined }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-hint`}
        onClick={onToggle}
        className="mt-1 flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors"
        style={{ backgroundColor: checked ? color : 'rgba(255,255,255,0.18)' }}
      >
        <span
          className="block h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0px)' }}
        />
      </button>
      <label htmlFor={id} className="flex-1 cursor-pointer" onClick={onToggle}>
        <span id={id} className="block font-semibold text-white">
          {label}
        </span>
        <span id={`${id}-hint`} className="block text-sm text-slate-400">
          {hint}
        </span>
      </label>
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  color,
  value,
  min,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  color: string;
  value: number | '';
  min: number;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <label htmlFor={id} className="block font-semibold text-white">
        {label}
      </label>
      <p id={`${id}-hint`} className="mb-2 text-sm text-slate-400">
        {hint}
      </p>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        placeholder={placeholder}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.value)}
        className="w-32 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white outline-none focus:ring-2"
        style={{ caretColor: color }}
      />
    </div>
  );
}

function TextField({
  id,
  label,
  hint,
  color,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  color: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <label htmlFor={id} className="block font-semibold text-white">
        {label}
      </label>
      <p id={`${id}-hint`} className="mb-2 text-sm text-slate-400">
        {hint}
      </p>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-white outline-none focus:ring-2"
        style={{ caretColor: color }}
      />
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="rounded-xl px-5 py-3 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: ACCENT }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function StepDots({ phase }: { phase: HarnessForgePhase }) {
  const order: HarnessForgePhase[] = [
    'configure-filter',
    'configure-validator',
    'configure-monitor',
    'stress-test',
    'report',
  ];
  const idx = order.indexOf(phase);
  if (idx < 0) return null;
  const labels = ['Filter', 'Validator', 'Monitor', 'Test', 'Report'];
  return (
    <ol className="mb-4 flex items-center justify-center gap-2" aria-label="Harness progress">
      {labels.map((l, i) => (
        <li key={l} className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: i <= idx ? ACCENT : 'rgba(255,255,255,0.12)',
              color: i <= idx ? '#fff' : 'rgba(255,255,255,0.6)',
            }}
            aria-current={i === idx ? 'step' : undefined}
          >
            {i + 1}
          </span>
          <span className={i === idx ? 'text-sm font-semibold text-white' : 'text-sm text-slate-400'}>
            {l}
          </span>
          {i < labels.length - 1 && <span className="text-slate-600">→</span>}
        </li>
      ))}
    </ol>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────

function HarnessForgeRoot() {
  const reduce = useReducedMotion();
  const activeChild = useActiveChild();
  const childId = activeChild?.id;
  const band = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const { awardXP, completeGame } = useGameActions();

  // ── Reactive store state ──
  const phase = useHarnessForgeStore((s) => s.phase);
  const config = useHarnessForgeStore((s) => s.config);
  const availableSaves = useHarnessForgeStore((s) => s.availableSaves);
  const currentSaveId = useHarnessForgeStore((s) => s.currentSaveId);
  const results = useHarnessForgeStore((s) => s.results);
  const grade = useHarnessForgeStore((s) => s.grade);
  const isLoadingSaves = useHarnessForgeStore((s) => s.isLoadingSaves);
  const isSaving = useHarnessForgeStore((s) => s.isSaving);

  // ── Store actions (stable references) ──
  const reset = useHarnessForgeStore((s) => s.reset);
  const beginGame = useHarnessForgeStore((s) => s.beginGame);
  const setPhase = useHarnessForgeStore((s) => s.setPhase);
  const markTutorialSeen = useHarnessForgeStore((s) => s.markTutorialSeen);
  const loadSaves = useHarnessForgeStore((s) => s.loadSaves);
  const pickSave = useHarnessForgeStore((s) => s.pickSave);
  const toggleFilterRule = useHarnessForgeStore((s) => s.toggleFilterRule);
  const setFilterLengthCap = useHarnessForgeStore((s) => s.setFilterLengthCap);
  const setValidatorRequireKeyword = useHarnessForgeStore((s) => s.setValidatorRequireKeyword);
  const setValidatorMaxLength = useHarnessForgeStore((s) => s.setValidatorMaxLength);
  const toggleValidatorCitations = useHarnessForgeStore((s) => s.toggleValidatorCitations);
  const setMonitorLoopLimit = useHarnessForgeStore((s) => s.setMonitorLoopLimit);
  const toggleMonitorDedupe = useHarnessForgeStore((s) => s.toggleMonitorDedupe);
  const resetConfig = useHarnessForgeStore((s) => s.resetConfig);
  const runStressTest = useHarnessForgeStore((s) => s.runStressTest);
  const clearResults = useHarnessForgeStore((s) => s.clearResults);
  const saveHarnessToSelected = useHarnessForgeStore((s) => s.saveHarnessToSelected);

  // ── Mount: reset transient state, then jump to first unseen tutorial or
  //    save-select (beginGame's intent). Clean up on unmount. ──
  useEffect(() => {
    reset();
    beginGame();
    return () => reset();
  }, [reset, beginGame]);

  // ── When we reach save-select with no saves loaded, fetch the child's
  //    compositions; fall back to the built-in sample team so the game is
  //    always playable, even for a brand-new / demo account. ──
  useEffect(() => {
    if (phase !== 'save-select') return;
    if (useHarnessForgeStore.getState().availableSaves.length > 0) return;
    let cancelled = false;
    (async () => {
      if (childId) await loadSaves(childId);
      if (cancelled) return;
      if (useHarnessForgeStore.getState().availableSaves.length === 0) {
        useHarnessForgeStore.setState({ availableSaves: [DEMO_SAVE] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, childId, loadSaves]);

  // ── Completion: fire exactly once when the report is produced. ──
  const rewardedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'report' || !grade || rewardedRef.current) return;
    rewardedRef.current = true;
    const xp = 100 + grade.stars * 70 + grade.caughtCount * 5;
    awardXP(xp);
    completeGame('harness-forge', grade.stars);
  }, [phase, grade, awardXP, completeGame]);

  const bandFixtures = useMemo(() => fixturesForBand(band), [band]);
  const isDemoSave = currentSaveId === DEMO_SAVE_ID;
  const activeSave = availableSaves.find((s) => s.comp.id === currentSaveId);

  const fade = reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto px-4 py-6 text-white">
      <AnimatePresence mode="wait">
        <motion.div key={phase} {...fade} transition={{ duration: reduce ? 0 : 0.25 }} className="flex-1">
          {/* ─── Tutorials ─── */}
          {phase === 'learn-why' && (
            <TutorialCard
              emoji="🔒"
              title="Why put an AI in a harness?"
              body="You built an agent team — now it's time to make it SAFE. A smart team can still be tricked into leaking private info, saying rude things, running forever, or making stuff up. A harness is a set of guard rails you wrap around your team so bad things get caught before they cause harm."
              cta="Next: the three layers"
              onNext={() => {
                markTutorialSeen('why');
                setPhase('learn-layers');
              }}
            />
          )}
          {phase === 'learn-layers' && (
            <TutorialCard
              emoji="🧱"
              title="Three layers of safety"
              body={
                <ul className="space-y-3 text-left">
                  <li>
                    <strong style={{ color: LAYER_META.filter.color }}>🛡️ Input Filter</strong> — cleans the
                    prompt BEFORE the team sees it (strip private info, block rude words, cap length).
                  </li>
                  <li>
                    <strong style={{ color: LAYER_META.monitor.color }}>👁️ Behavior Monitor</strong> — watches
                    the team WHILE it works (stop runaway loops, spot duplicated effort).
                  </li>
                  <li>
                    <strong style={{ color: LAYER_META.validator.color }}>✅ Output Validator</strong> — checks
                    the final answer AFTER it&apos;s made (must include a keyword, cite sources, stay short).
                  </li>
                </ul>
              }
              cta="Next: what gets caught"
              onNext={() => {
                markTutorialSeen('layers');
                setPhase('learn-catches');
              }}
            />
          )}
          {phase === 'learn-catches' && (
            <TutorialCard
              emoji="🎯"
              title="Catch the tricky prompts"
              body="After you set up your three layers, you'll run a STRESS TEST — a battery of sneaky prompts each designed to slip past a weak harness. A phishing prompt hides personal info. A runaway prompt tries to loop forever. Each catch means your harness worked. Tune the layers, run the test, and earn up to ⭐⭐⭐!"
              cta="Pick a team to protect"
              onNext={() => {
                markTutorialSeen('catches');
                setPhase('save-select');
              }}
            />
          )}

          {/* ─── Save select ─── */}
          {phase === 'save-select' && (
            <section aria-labelledby="save-select-h">
              <h2 id="save-select-h" className="mb-1 text-2xl font-black">
                Choose a team to harness
              </h2>
              <p className="mb-4 text-slate-400">
                Pick one of your saved agent teams. We&apos;ll wrap it in your safety harness and stress-test it.
              </p>
              {isLoadingSaves && <p className="text-slate-300">Loading your saved teams…</p>}
              {!isLoadingSaves && (
                <ul className="space-y-3">
                  {availableSaves.map((s) => (
                    <li key={s.comp.id}>
                      <button
                        type="button"
                        onClick={() => pickSave(s.comp.id)}
                        className="w-full rounded-xl border border-white/15 bg-black/30 p-4 text-left transition-colors hover:border-white/40 hover:bg-white/5"
                        aria-label={`Harness the team ${s.comp.name}`}
                      >
                        <span className="block font-bold text-white">{s.comp.name}</span>
                        <span className="block text-sm text-slate-400">
                          {s.comp.team.length} agent{s.comp.team.length === 1 ? '' : 's'} ·{' '}
                          {s.comp.wires.length} wire{s.comp.wires.length === 1 ? '' : 's'}
                          {s.harness ? ' · already has a harness' : ''}
                          {s.comp.id === DEMO_SAVE_ID ? ' · Sample' : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ─── Configure: Filter ─── */}
          {phase === 'configure-filter' && (
            <ConfigScaffold
              phase={phase}
              layer="filter"
              title="Layer 1 · Input Filter"
              subtitle="Clean the prompt before your team ever reads it."
              onBack={() => setPhase('save-select')}
              onNext={() => setPhase('configure-validator')}
              onResetConfig={resetConfig}
              teamName={activeSave?.comp.name}
            >
              <ToggleRow
                id="f-pii"
                label={FILTER_RULE_META.stripPii.label}
                hint={FILTER_RULE_META.stripPii.hint}
                color={FILTER_RULE_META.stripPii.color}
                checked={config.filter.stripPii}
                onToggle={() => toggleFilterRule('stripPii')}
              />
              <ToggleRow
                id="f-prof"
                label={FILTER_RULE_META.blockProfanity.label}
                hint={FILTER_RULE_META.blockProfanity.hint}
                color={FILTER_RULE_META.blockProfanity.color}
                checked={config.filter.blockProfanity}
                onToggle={() => toggleFilterRule('blockProfanity')}
              />
              <NumberField
                id="f-cap"
                label={FILTER_RULE_META.lengthCap.label}
                hint={FILTER_RULE_META.lengthCap.hint}
                color={FILTER_RULE_META.lengthCap.color}
                value={config.filter.lengthCap}
                min={0}
                onChange={(v) => setFilterLengthCap(v === '' ? 0 : Number(v))}
              />
            </ConfigScaffold>
          )}

          {/* ─── Configure: Validator ─── */}
          {phase === 'configure-validator' && (
            <ConfigScaffold
              phase={phase}
              layer="validator"
              title="Layer 2 · Output Validator"
              subtitle="Check the team's final answer against your rules."
              onBack={() => setPhase('configure-filter')}
              onNext={() => setPhase('configure-monitor')}
              onResetConfig={resetConfig}
              teamName={activeSave?.comp.name}
            >
              <TextField
                id="v-kw"
                label={VALIDATOR_RULE_META.requireKeyword.label}
                hint={VALIDATOR_RULE_META.requireKeyword.hint}
                color={VALIDATOR_RULE_META.requireKeyword.color}
                value={config.validator.requireKeyword ?? ''}
                placeholder="e.g. thermos"
                onChange={(v) => setValidatorRequireKeyword(v)}
              />
              <NumberField
                id="v-max"
                label={VALIDATOR_RULE_META.maxLength.label}
                hint={VALIDATOR_RULE_META.maxLength.hint}
                color={VALIDATOR_RULE_META.maxLength.color}
                value={config.validator.maxLength ?? ''}
                min={0}
                placeholder="no limit"
                onChange={(v) => setValidatorMaxLength(v === '' ? undefined : Number(v))}
              />
              <ToggleRow
                id="v-cite"
                label={VALIDATOR_RULE_META.requireCitations.label}
                hint={VALIDATOR_RULE_META.requireCitations.hint}
                color={VALIDATOR_RULE_META.requireCitations.color}
                checked={config.validator.requireCitations}
                onToggle={toggleValidatorCitations}
              />
            </ConfigScaffold>
          )}

          {/* ─── Configure: Monitor ─── */}
          {phase === 'configure-monitor' && (
            <ConfigScaffold
              phase={phase}
              layer="monitor"
              title="Layer 3 · Behavior Monitor"
              subtitle="Watch the team while it works and stop bad runs."
              onBack={() => setPhase('configure-validator')}
              onNext={() => setPhase('stress-test')}
              nextLabel="Ready to test →"
              onResetConfig={resetConfig}
              teamName={activeSave?.comp.name}
            >
              <NumberField
                id="m-loop"
                label={MONITOR_RULE_META.loopLimit.label}
                hint={MONITOR_RULE_META.loopLimit.hint}
                color={MONITOR_RULE_META.loopLimit.color}
                value={config.monitor.loopLimit}
                min={1}
                onChange={(v) => setMonitorLoopLimit(v === '' ? 1 : Number(v))}
              />
              <ToggleRow
                id="m-dedupe"
                label={MONITOR_RULE_META.dedupeOutputs.label}
                hint={MONITOR_RULE_META.dedupeOutputs.hint}
                color={MONITOR_RULE_META.dedupeOutputs.color}
                checked={config.monitor.dedupeOutputs}
                onToggle={toggleMonitorDedupe}
              />
            </ConfigScaffold>
          )}

          {/* ─── Stress test launch ─── */}
          {phase === 'stress-test' && (
            <section aria-labelledby="stress-h">
              <StepDots phase={phase} />
              <h2 id="stress-h" className="mb-1 text-2xl font-black">
                Run the stress test
              </h2>
              <p className="mb-4 text-slate-400">
                We&apos;ll fire {bandFixtures.length} tricky prompt{bandFixtures.length === 1 ? '' : 's'} at{' '}
                <strong className="text-white">{activeSave?.comp.name}</strong> and see what your harness catches.
              </p>

              <div className="mb-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <h3 className="mb-2 font-bold text-white">Your harness right now</h3>
                <ConfigSummary />
              </div>

              <ul className="mb-6 space-y-2">
                {bandFixtures.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <span className="text-white">{f.label}</span>
                    <span className="flex gap-1">
                      {f.targetLayers.map((l) => (
                        <LayerBadge key={l} layer={l} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <GhostButton onClick={() => setPhase('configure-monitor')} ariaLabel="Go back to harness setup">
                  ← Tweak harness
                </GhostButton>
                <PrimaryButton onClick={() => runStressTest(band)} ariaLabel="Run the stress test now">
                  ⚡ Run stress test
                </PrimaryButton>
              </div>
            </section>
          )}

          {/* ─── Report ─── */}
          {phase === 'report' && grade && (
            <section aria-labelledby="report-h">
              <StepDots phase={phase} />
              <h2 id="report-h" className="mb-1 text-2xl font-black">
                Stress-test report
              </h2>
              <div className="mb-4 flex items-center gap-3" aria-label={`${grade.stars} out of 3 stars`}>
                <span className="text-3xl" aria-hidden>
                  {'★'.repeat(grade.stars)}
                  {'☆'.repeat(3 - grade.stars)}
                </span>
                <span className="text-slate-300">
                  Your harness caught something in {grade.caughtCount} of {grade.totalFixtures} attacks
                  {grade.preventedCount > 0 ? ` and blocked ${grade.preventedCount} outright` : ''}.
                </span>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <EffBar layer="filter" value={grade.filterEffectiveness} />
                <EffBar layer="monitor" value={grade.monitorEffectiveness} />
                <EffBar layer="validator" value={grade.validatorEffectiveness} />
              </div>

              <h3 className="mb-2 font-bold text-white">What each attack did</h3>
              <ul className="mb-6 space-y-3">
                {bandFixtures.map((f) => {
                  const r = results[f.id];
                  const catches = r?.catches ?? [];
                  const caught = catches.length > 0;
                  return (
                    <li
                      key={f.id}
                      className="rounded-xl border bg-black/30 p-4"
                      style={{ borderColor: caught ? '#00D17A' : 'rgba(255,255,255,0.12)' }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{f.label}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            backgroundColor: caught ? 'rgba(0,209,122,0.2)' : 'rgba(255,255,255,0.1)',
                            color: caught ? '#00D17A' : 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {r?.rejected ? 'BLOCKED' : caught ? 'CAUGHT' : 'slipped through'}
                        </span>
                      </div>
                      {caught ? (
                        <ul className="space-y-1">
                          {catches.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span aria-hidden>{LAYER_META[c.layer].emoji}</span>
                              <span>
                                <strong style={{ color: LAYER_META[c.layer].color }}>
                                  {LAYER_META[c.layer].label}
                                </strong>{' '}
                                <span className="text-slate-300">{c.detail}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Nothing on your harness caught this one. {f.unharnessedOutcome}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap gap-3">
                <GhostButton
                  onClick={() => {
                    clearResults();
                    setPhase('configure-filter');
                  }}
                  ariaLabel="Adjust the harness and test again"
                >
                  🔧 Tweak &amp; retest
                </GhostButton>
                {!isDemoSave && (
                  <GhostButton onClick={() => setPhase('save')} ariaLabel="Save this harness to your team">
                    💾 Save to team
                  </GhostButton>
                )}
                <PrimaryButton onClick={() => setPhase('complete')} ariaLabel="Finish and see recap">
                  Finish →
                </PrimaryButton>
              </div>
            </section>
          )}

          {/* ─── Save ─── */}
          {phase === 'save' && (
            <section aria-labelledby="save-h" className="text-center">
              <h2 id="save-h" className="mb-2 text-2xl font-black">
                Save your harness
              </h2>
              <p className="mx-auto mb-6 max-w-md text-slate-400">
                This writes your three-layer harness onto{' '}
                <strong className="text-white">{activeSave?.comp.name}</strong> so it stays protected next time.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <GhostButton onClick={() => setPhase('report')} ariaLabel="Back to the report">
                  ← Back
                </GhostButton>
                <PrimaryButton
                  onClick={async () => {
                    const ok = await saveHarnessToSelected();
                    if (ok) setPhase('complete');
                  }}
                  disabled={isSaving}
                  ariaLabel="Save the harness now"
                >
                  {isSaving ? 'Saving…' : '💾 Save harness'}
                </PrimaryButton>
                <GhostButton onClick={() => setPhase('complete')} ariaLabel="Skip saving and finish">
                  Skip
                </GhostButton>
              </div>
            </section>
          )}

          {/* ─── Complete ─── */}
          {phase === 'complete' && (
            <section aria-labelledby="complete-h" className="text-center">
              <div className="mb-2 text-5xl" aria-hidden>
                🕸️
              </div>
              <h2 id="complete-h" className="mb-2 text-2xl font-black">
                Harness forged!
              </h2>
              <p className="mx-auto mb-4 max-w-md text-slate-300">
                {grade
                  ? `You earned ${'★'.repeat(grade.stars)}${'☆'.repeat(3 - grade.stars)} — a real safety harness that caught ${grade.caughtCount} of ${grade.totalFixtures} tricky prompts. That's the "Constrain" step: filter the inputs, watch the behavior, validate the outputs.`
                  : 'Your safety harness is ready.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <PrimaryButton
                  onClick={() => {
                    reset();
                    beginGame();
                  }}
                  ariaLabel="Play Harness Forge again"
                >
                  ↻ Harness another team
                </PrimaryButton>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-views that read the live config from the store ──────────────────

function ConfigScaffold({
  phase,
  layer,
  title,
  subtitle,
  teamName,
  onBack,
  onNext,
  onResetConfig,
  nextLabel = 'Next →',
  children,
}: {
  phase: HarnessForgePhase;
  layer: keyof typeof LAYER_META;
  title: string;
  subtitle: string;
  teamName?: string;
  onBack: () => void;
  onNext: () => void;
  onResetConfig: () => void;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="config-h">
      <StepDots phase={phase} />
      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {LAYER_META[layer].emoji}
        </span>
        <h2 id="config-h" className="text-2xl font-black" style={{ color: LAYER_META[layer].color }}>
          {title}
        </h2>
      </div>
      <p className="mb-1 text-slate-400">{subtitle}</p>
      {teamName && (
        <p className="mb-4 text-sm text-slate-500">
          Protecting: <span className="text-slate-300">{teamName}</span>
        </p>
      )}
      <div className="mb-6 space-y-3">{children}</div>
      <div className="flex flex-wrap items-center gap-3">
        <GhostButton onClick={onBack} ariaLabel="Go back one layer">
          ← Back
        </GhostButton>
        <PrimaryButton onClick={onNext} ariaLabel={nextLabel}>
          {nextLabel}
        </PrimaryButton>
        <button
          type="button"
          onClick={onResetConfig}
          className="ml-auto text-sm text-slate-400 underline hover:text-white"
          aria-label="Reset all harness settings to defaults"
        >
          Reset harness
        </button>
      </div>
    </section>
  );
}

function ConfigSummary() {
  const config = useHarnessForgeStore((s) => s.config);
  const items: string[] = [];
  if (config.filter.stripPii) items.push('🛡️ Strip personal info');
  if (config.filter.blockProfanity) items.push('🛡️ Block profanity');
  if (config.filter.lengthCap > 0) items.push(`🛡️ Length cap ${config.filter.lengthCap}`);
  if (config.validator.requireKeyword) items.push(`✅ Require "${config.validator.requireKeyword}"`);
  if (config.validator.maxLength) items.push(`✅ Max length ${config.validator.maxLength}`);
  if (config.validator.requireCitations) items.push('✅ Require citations');
  items.push(`👁️ Loop limit ${config.monitor.loopLimit}`);
  if (config.monitor.dedupeOutputs) items.push('👁️ Dedupe outputs');

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <li key={i} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-slate-200">
          {it}
        </li>
      ))}
    </ul>
  );
}

function LayerBadge({ layer }: { layer: keyof typeof LAYER_META }) {
  const m = LAYER_META[layer];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${m.color}22`, color: m.color }}
    >
      {m.emoji} {m.label}
    </span>
  );
}

function EffBar({ layer, value }: { layer: keyof typeof LAYER_META; value: number }) {
  const m = LAYER_META[layer];
  const pct = Math.round(value * 100);
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden>{m.emoji}</span>
        <span className="text-sm font-semibold text-white">{m.label}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${m.label} effectiveness ${pct} percent`}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
      </div>
      <span className="mt-1 block text-right text-sm font-bold" style={{ color: m.color }}>
        {pct}%
      </span>
    </div>
  );
}

function TutorialCard({
  emoji,
  title,
  body,
  cta,
  onNext,
}: {
  emoji: string;
  title: string;
  body: React.ReactNode;
  cta: string;
  onNext: () => void;
}) {
  return (
    <section aria-labelledby="tut-h" className="mx-auto max-w-xl text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        {emoji}
      </div>
      <h2 id="tut-h" className="mb-3 text-2xl font-black text-white">
        {title}
      </h2>
      <div className="mb-6 text-slate-300">{body}</div>
      <PrimaryButton onClick={onNext} ariaLabel={cta}>
        {cta}
      </PrimaryButton>
    </section>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────

export default function HarnessForgeGame() {
  return (
    <GameShell title="Harness Forge" color={ACCENT} labNum={11}>
      <HarnessForgeRoot />
    </GameShell>
  );
}
