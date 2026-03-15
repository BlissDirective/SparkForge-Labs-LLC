# SPARKFORGE — STAGE 6F: FLAGSHIP — BIAS DETECTIVE

## v3-FINAL (PART C) — JSX Render + Verification

---

**Date:** February 28, 2026 | **GCUD:** V9 | **Lab:** 6 (Red) | **Bands:** A+B+C

Section 2 of `BiasDetectiveGame.tsx`. Append this code after Part B code in the SAME file. Contains: complete JSX render for all 7 phases (welcome, learn, cases, investigate with [v3] 3D scales, testlab, fix, report), closing braces, verification checklist, git commands.

---

### CODE REVIEW FIXES APPLIED (Part C):

| ID | Issue | Fix |
|----|-------|-----|
| CR-6F-C1 | HTML entities (`&gt;`, `&lt;`, `&amp;`) throughout all JSX | Decoded all to proper JSX/TypeScript characters |
| CR-6F-C2 | `frameloop="demand"` freezes spring physics and particles | Changed to `frameloop="always"` — component has per-frame spring physics and particle updates |
| CR-6F-C3 | Welcome phase `&amp;amp;` double-encoded entity in "AI & Ethics" | Fixed to proper `&amp;` JSX entity for ampersand display |
| CR-6F-C4 | Evidence board conditional rendering used `&amp;&amp;` HTML entity | Fixed to proper `&&` JSX operator throughout |
| CR-6F-C5 | Pie chart path `d` attribute used HTML entities for comparison | Fixed `pct > 0.5` comparison operator |
| CR-6F-C6 | Several motion event handlers used HTML entity arrow functions | All `() => ...` lambdas use proper syntax |

---

## STEP 2: JSX RENDER — All 7 Phases (append after Part B)

```tsx
  // FULL JSX RENDER — All 7 phases
  return (
    <GameShell gameId="bias-detective" title="Bias Detective"
      worldNumber={6} worldColor="#EF4444">
      <div className="h-full flex flex-col relative overflow-hidden">

        {/* Red Particle Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-red-900/8
            via-transparent to-transparent" />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size,
                background: `radial-gradient(circle,
                  rgba(239,68,68,${0.15 + p.size * 0.06}), transparent)`,
              }}
              animate={{
                y: [0, -12 - p.size * 4, 0],
                opacity: [0.1, 0.35, 0.1],
              }}
              transition={{
                duration: p.duration, delay: p.delay,
                repeat: Infinity, ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Chrome Bezel */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(239,68,68,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(239,68,68,0.1)',
            }}>

            <div className="h-[2px] w-full bg-gradient-to-r
              from-transparent via-red-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 md:p-6">
              <AnimatePresence mode="wait">

                {/* WELCOME */}
                {phase === 'welcome' && (
                  <motion.div key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center
                      justify-center text-center space-y-5">

                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(239,68,68,0.15)',
                          '0 0 40px rgba(239,68,68,0.25)',
                          '0 0 20px rgba(239,68,68,0.15)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex items-center gap-2 px-4 py-2
                        rounded-full border border-red-500/20"
                      style={{
                        background: 'linear-gradient(135deg,
                          rgba(239,68,68,0.08), rgba(220,38,38,0.04))',
                      }}>
                      <Scale className="w-4 h-4 text-red-400" />
                      <span className="font-data text-data-sm text-red-400
                        uppercase tracking-widest">
                        Lab 6: AI &amp; Ethics
                      </span>
                    </motion.div>

                    <h2 className="font-display text-2xl md:text-3xl
                      font-bold text-white">Bias Detective
                    </h2>

                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Investigate unfair AI systems. Collect evidence.
                      Fix the bias.
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['AI Bias', 'Fairness', 'Data Ethics', 'Mitigation']
                        .map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-lg
                          bg-red-500/10 border border-red-500/20
                          font-body text-[10px] text-red-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5
                      rounded-lg bg-white/5">
                      <span className="font-display text-xs font-bold"
                        style={{ color: rank.color }}>
                        {rank.title}
                      </span>
                      <span className="font-body text-[9px] text-white/20">
                        ({completedCases.length}/{availableCases.length} cases)
                      </span>
                    </div>

                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-xs py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Start Investigating
                      <Search className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* LEARN */}
                {phase === 'learn' && (
                  <motion.div key="learn"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center
                      justify-center space-y-5">

                    <GraduationCap className="w-6 h-6 text-red-400" />
                    <h3 className="font-display text-lg font-bold
                      text-white">
                      Understanding AI Bias
                    </h3>
                    <p className="font-body text-xs text-white/40">
                      {learnIdx + 1} of {LEARN_CARDS.length}
                    </p>

                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5
                          border border-red-500/20 text-center"
                        style={{
                          background: 'linear-gradient(135deg,
                            rgba(239,68,68,0.06), rgba(220,38,38,0.02))',
                        }}>
                        <span className="text-2xl font-bold text-red-300">
                          {LEARN_CARDS[learnIdx].label}
                        </span>
                        <h4 className="font-display text-base font-bold
                          text-red-300 mt-3">
                          {LEARN_CARDS[learnIdx].title}
                        </h4>
                        <p className="font-body text-sm text-white/60
                          mt-2 leading-relaxed">
                          {ageBand === 'C'
                            ? LEARN_CARDS[learnIdx].bodyC
                            : LEARN_CARDS[learnIdx].body}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <motion.button
                      onClick={() => {
                        if (learnIdx < LEARN_CARDS.length - 1)
                          setLearnIdx(learnIdx + 1);
                        else setPhase('cases');
                      }}
                      className="w-full max-w-md py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1
                        ? 'Next' : 'Choose a Case!'}
                    </motion.button>
                    <button onClick={() => setPhase('cases')}
                      className="font-body text-xs text-white/20
                        hover:text-white/40">
                      Skip intro
                    </button>
                  </motion.div>
                )}

                {/* CASE SELECT */}
                {phase === 'cases' && (
                  <motion.div key="cases"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4">

                    <div className="text-center">
                      <FileText className="w-6 h-6 text-red-400
                        mx-auto mb-2" />
                      <h3 className="font-display text-lg font-bold
                        text-white">Case Files</h3>
                      <div className="flex items-center gap-2
                        justify-center mt-1">
                        <span className="font-display text-xs font-bold"
                          style={{ color: rank.color }}>
                          {rank.title}
                        </span>
                        <span className="font-body text-[9px] text-white/20">
                          {completedCases.length}/{availableCases.length} solved
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3
                      max-w-2xl mx-auto">
                      {availableCases.map(c => {
                        const isDone = completedCases.includes(c.id);
                        return (
                          <motion.button key={c.id}
                            onClick={() => startCase(c.id)}
                            className={`p-4 rounded-xl border text-left
                              transition-all ${isDone
                              ? 'border-red-500/30 bg-red-500/5'
                              : 'border-white/10 bg-white/[0.02] hover:border-red-500/20'
                            }`}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold
                                text-red-300">{c.label}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-sm
                                    font-bold text-white">{c.title}</p>
                                  {isDone && <CheckCircle2
                                    className="w-3.5 h-3.5 text-red-400" />}
                                </div>
                                <p className="font-body text-[11px]
                                  text-white/40 mt-0.5">
                                  {c.description.slice(0, 80)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-1.5 py-0.5 rounded
                                bg-red-500/10 text-red-400 font-data
                                text-[9px]">{c.biasType}</span>
                              <span className={`px-1.5 py-0.5 rounded
                                text-[9px] font-bold ${
                                c.difficulty === 'beginner'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : c.difficulty === 'intermediate'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}>{c.difficulty}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* INVESTIGATE + [v3] 3D SCALES */}
                {phase === 'investigate' && activeCase && (
                  <motion.div key="investigate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeCase.label}</span>
                      <div className="flex-1">
                        <h3 className="font-display text-sm font-bold
                          text-white">{activeCase.title}</h3>
                        <p className="font-body text-[10px] text-white/30">
                          {ageBand === 'C'
                            ? activeCase.descriptionC
                            : activeCase.description}
                        </p>
                      </div>
                      <span className="font-data text-[10px] text-red-400">
                        {relevantEvidenceCount}/{totalRelevant} clues
                      </span>
                    </div>

                    {/* [v3] 3D Justice Scales — responds to evidence */}
                    <div className="w-full h-32 md:h-40 rounded-xl
                      overflow-hidden"
                      style={{ background: 'rgba(0,0,0,0.2)' }}
                      aria-hidden="true">
                      {isMobile ? (
                        <BiasScalesFallback
                          biasWeight={scaleWeights.biasWeight}
                          fairWeight={scaleWeights.fairWeight}
                          isBalanced={scaleWeights.isBalanced}
                        />
                      ) : (
                        <Canvas
                          camera={{ position: [0, 1.5, 3.5], fov: 45 }}
                          style={{ background: 'transparent' }}
                          gl={{ alpha: true, antialias: true }}
                          frameloop="always">
                          {/* [CR-6F-C2] frameloop="always" for spring physics + particles */}
                          <BiasScales3DComponent
                            biasWeight={scaleWeights.biasWeight}
                            fairWeight={scaleWeights.fairWeight}
                            isBalanced={scaleWeights.isBalanced}
                            caseColor="#EF4444"
                          />
                        </Canvas>
                      )}
                    </div>

                    {/* Data Visualizations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeCase.visualizations.map((viz, i) => (
                        <div key={i} className="glass-card rounded-xl p-3">
                          {viz.type === 'bar'
                            ? <BarChart viz={viz} />
                            : <PieChartViz viz={viz} />}
                        </div>
                      ))}
                    </div>

                    {/* Evidence Board */}
                    <div className="rounded-xl p-3 border
                      border-red-500/15"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.03), rgba(0,0,0,0.2))',
                        backgroundImage: 'radial-gradient(rgba(239,68,68,0.03) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}>
                      <p className="font-display text-xs font-bold
                        text-red-400 mb-2 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Evidence Board
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2
                        gap-2">
                        {activeCase.evidence.map(ev => {
                          const isCollected =
                            collectedEvidence.includes(ev.id);
                          return (
                            <motion.button key={ev.id}
                              onClick={() => collectEvidence(ev.id)}
                              className={`p-2.5 rounded-lg border
                                text-left transition-all ${isCollected
                                ? ev.biasRelevant
                                  ? 'border-red-500/30 bg-red-500/8'
                                  : 'border-white/20 bg-white/5'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                              }`}
                              whileTap={{ scale: 0.97 }}
                              aria-label={`Evidence: ${ev.text}`}>
                              <div className="flex items-start gap-2">
                                <span className="text-sm flex-shrink-0">
                                  {isCollected
                                    ? (ev.biasRelevant ? '[!]' : '[.]')
                                    : '[?]'}
                                </span>
                                <div>
                                  <p className={`font-body text-[11px]
                                    ${isCollected
                                    ? 'text-white/70'
                                    : 'text-white/40'}`}>
                                    {ev.text}
                                  </p>
                                  {isCollected && (
                                    <span className={`font-data text-[8px]
                                      uppercase tracking-wider ${
                                      ev.category === 'data'
                                        ? 'text-blue-400'
                                        : ev.category === 'outcome'
                                        ? 'text-amber-400'
                                        : 'text-purple-400'
                                    }`}>
                                      {ev.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isCollected && ev.biasRelevant && (
                                <div className="mt-1.5 h-[2px] w-full
                                  rounded bg-gradient-to-r
                                  from-red-500/40 to-transparent" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setPhase('testlab')}
                      disabled={relevantEvidenceCount < 3}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white disabled:opacity-30"
                      style={{
                        background: relevantEvidenceCount >= 3
                          ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                      whileHover={
                        relevantEvidenceCount >= 3
                          ? { scale: 1.02 } : {}
                      }
                      whileTap={
                        relevantEvidenceCount >= 3
                          ? { scale: 0.98 } : {}
                      }>
                      {relevantEvidenceCount >= 3
                        ? 'Proceed to Test Lab'
                        : `Collect ${3 - relevantEvidenceCount} more clues`}
                    </motion.button>
                  </motion.div>
                )}

                {/* TEST LAB */}
                {phase === 'testlab' && activeCase && (
                  <motion.div key="testlab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-5 h-5 text-red-400" />
                      <h3 className="font-display text-sm font-bold
                        text-white">
                        Test Lab: {activeCase.title}
                      </h3>
                    </div>
                    <p className="font-body text-xs text-white/40">
                      Test the AI with different inputs to confirm bias.
                    </p>

                    <div className="space-y-2">
                      {activeCase.presetTests.map((t, i) => (
                        <div key={i}
                          className={`rounded-lg p-3 border ${
                            t.biased
                              ? 'border-red-500/20 bg-red-500/5'
                              : 'border-emerald-500/20 bg-emerald-500/5'
                          }`}>
                          <p className="font-body text-xs text-white/50">
                            Input: <span className="text-white/70">
                              {t.prompt}
                            </span>
                          </p>
                          <p className="font-display text-sm font-bold mt-1"
                            style={{
                              color: t.biased ? '#EF4444' : '#10B981',
                            }}>
                            {t.result}
                          </p>
                          <p className="font-body text-[10px]
                            text-white/30 mt-0.5">
                            {t.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 border
                      border-white/10 bg-white/[0.02]">
                      <p className="font-display text-xs font-bold
                        text-white mb-2">
                        Try Your Own Test:
                      </p>
                      <div className="flex gap-2">
                        <input type="text"
                          value={customInput}
                          onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && runCustomTest()
                          }
                          placeholder="Type a test input..."
                          className="flex-1 px-3 py-2 rounded-lg
                            bg-white/5 border border-white/10
                            text-white text-sm font-body
                            placeholder:text-white/20
                            focus:outline-none focus:border-red-500/30"
                          aria-label="Custom test input" />
                        <motion.button
                          onClick={runCustomTest}
                          disabled={!customInput.trim()}
                          className="px-4 py-2 rounded-lg font-display
                            text-xs font-bold text-white
                            disabled:opacity-30"
                          style={{
                            background:
                              'linear-gradient(135deg, #EF4444, #DC2626)',
                          }}
                          whileTap={{ scale: 0.95 }}>
                          Test
                        </motion.button>
                      </div>
                      {testResults.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {testResults.map((t, i) => (
                            <div key={i}
                              className={`rounded-lg p-2 ${
                                t.biased
                                  ? 'bg-red-500/8'
                                  : 'bg-emerald-500/8'
                              }`}>
                              <p className="font-body text-[10px]
                                text-white/50">
                                You tested: {t.prompt}
                              </p>
                              <p className="font-display text-xs font-bold"
                                style={{
                                  color: t.biased ? '#EF4444' : '#10B981',
                                }}>
                                {t.result}
                              </p>
                              <p className="font-body text-[9px]
                                text-white/25">
                                {t.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <motion.button
                      onClick={() => setPhase('fix')}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Fix the AI
                    </motion.button>
                  </motion.div>
                )}

                {/* FIX THE AI */}
                {phase === 'fix' && activeCase && (
                  <motion.div key="fix"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4">

                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-red-400" />
                      <h3 className="font-display text-sm font-bold
                        text-white">
                        Fix the AI: {activeCase.title}
                      </h3>
                    </div>

                    <div className="rounded-xl p-3 border
                      border-red-500/15 bg-red-500/3">
                      <p className="font-body text-xs text-white/60">
                        <span className="font-bold text-red-400">
                          Bias found:
                        </span>{' '}
                        {ageBand === 'C'
                          ? activeCase.biasExplanationC
                          : activeCase.biasExplanation}
                      </p>
                    </div>

                    <p className="font-body text-xs text-white/40">
                      Select the best fix(es):
                    </p>

                    <div className="space-y-2">
                      {activeCase.fixOptions.map(fix => (
                        <motion.button key={fix.id}
                          onClick={() => toggleFix(fix.id)}
                          className={`w-full p-3 rounded-xl border
                            text-left transition-all ${
                            selectedFixes.includes(fix.id)
                              ? 'border-red-500/40 bg-red-500/10'
                              : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                          }`}
                          whileTap={{ scale: 0.98 }}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md border-2
                              flex items-center justify-center ${
                              selectedFixes.includes(fix.id)
                                ? 'border-red-400 bg-red-500/20'
                                : 'border-white/20'
                            }`}>
                              {selectedFixes.includes(fix.id) && (
                                <CheckCircle2
                                  className="w-3 h-3 text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-display text-xs
                                font-bold text-white">
                                {fix.label}
                              </p>
                              <p className="font-body text-[10px]
                                text-white/30">
                                {fix.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      onClick={submitReport}
                      disabled={selectedFixes.length === 0}
                      className="w-full py-3 rounded-xl font-display
                        font-bold text-sm text-white
                        disabled:opacity-30"
                      style={{
                        background: selectedFixes.length > 0
                          ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                          : 'rgba(255,255,255,0.05)',
                      }}
                      whileHover={
                        selectedFixes.length > 0
                          ? { scale: 1.02 } : {}
                      }
                      whileTap={
                        selectedFixes.length > 0
                          ? { scale: 0.98 } : {}
                      }>
                      Submit Report
                    </motion.button>
                  </motion.div>
                )}

                {/* REPORT */}
                {phase === 'report' && activeCase && (
                  <motion.div key="report"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center
                      justify-center text-center space-y-4">

                    {/* CASE CLOSED stamp */}
                    <motion.div
                      initial={{ scale: 3, rotate: -15, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{
                        type: 'spring', damping: 12, stiffness: 200,
                      }}
                      className="px-6 py-3 border-4 border-red-500
                        rounded-lg"
                      style={{ transform: 'rotate(-3deg)' }}>
                      <span className="font-display text-xl
                        font-black text-red-500 tracking-wider">
                        CASE CLOSED
                      </span>
                    </motion.div>

                    <h3 className="font-display text-base font-bold
                      text-white">
                      {activeCase.title}
                    </h3>
                    <p className="font-body text-xs text-red-400
                      font-bold">
                      {activeCase.biasType}
                    </p>

                    {/* Fix results */}
                    <div className="glass-card rounded-xl p-4
                      max-w-md w-full text-left space-y-2">
                      <p className="font-display text-xs font-bold
                        text-white">Your Fixes:</p>
                      {selectedFixes.map(fid => {
                        const fix = activeCase.fixOptions
                          .find(f => f.id === fid);
                        if (!fix) return null;
                        return (
                          <div key={fid}
                            className={`p-2 rounded-lg ${
                              fix.correct
                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                            <p className="font-body text-xs
                              text-white/70">
                              {fix.correct
                                ? '[CORRECT] ' : '[INCORRECT] '}
                              {fix.label}
                            </p>
                            <p className="font-body text-[10px]
                              text-white/30">
                              {fix.impact}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="glass-card rounded-xl p-3
                      max-w-md w-full">
                      <div className="grid grid-cols-3 gap-3
                        text-center">
                        <div>
                          <p className="font-data text-lg font-bold
                            text-red-400">
                            {relevantEvidenceCount}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Clues</p>
                        </div>
                        <div>
                          <p className="font-data text-lg font-bold
                            text-blue-400">
                            {activeCase.presetTests.length
                              + testResults.length}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Tests</p>
                        </div>
                        <div>
                          <p className="font-data text-lg font-bold
                            text-amber-400">
                            {selectedFixes.filter(id =>
                              activeCase.fixOptions
                                .find(f => f.id === id)?.correct
                            ).length}
                          </p>
                          <p className="font-body text-[9px]
                            text-white/30">Good Fixes</p>
                        </div>
                      </div>
                    </div>

                    {/* Rank up notification */}
                    {(() => {
                      const newR = getRank(completedCases.length);
                      const oldR = getRank(completedCases.length - 1);
                      return newR.title !== oldR.title ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-3 border
                            border-amber-500/20 max-w-md w-full"
                          style={{
                            background:
                              'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))',
                          }}>
                          <p className="font-display text-xs
                            font-bold text-amber-400">
                            Rank Up!
                          </p>
                          <p className="font-body text-sm
                            text-white/60">
                            {newR.label} {newR.title}
                          </p>
                        </motion.div>
                      ) : null;
                    })()}

                    {/* This Really Happened */}
                    <motion.button
                      onClick={() => setShowRealWorld(!showRealWorld)}
                      className="flex items-center gap-2 px-4 py-2
                        rounded-xl bg-white/5 border border-white/10
                        max-w-md w-full"
                      whileHover={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      }}>
                      <BookOpen className="w-4 h-4 text-red-400" />
                      <span className="font-display text-xs font-bold
                        text-white">
                        This Really Happened
                      </span>
                      <ChevronRight
                        className={`w-3 h-3 text-white/20 ml-auto
                          transition-transform ${
                          showRealWorld ? 'rotate-90' : ''
                        }`} />
                    </motion.button>

                    <AnimatePresence>
                      {showRealWorld && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="max-w-md w-full overflow-hidden">
                          <div className="rounded-xl p-4 border
                            border-red-500/15 text-left"
                            style={{
                              background: 'rgba(239,68,68,0.03)',
                            }}>
                            <div className="flex items-center
                              gap-2 mb-2">
                              <span className="font-display text-xs
                                font-bold text-red-400">
                                {activeCase.realWorld.title}
                              </span>
                              <span className="font-mono text-[9px]
                                text-white/20">
                                {activeCase.realWorld.year}
                              </span>
                            </div>
                            <p className="font-body text-xs
                              text-white/50 leading-relaxed">
                              {activeCase.realWorld.summary}
                            </p>
                            <p className="font-body text-[11px]
                              text-red-400/70 mt-2 italic">
                              Lesson: {activeCase.realWorld.lesson}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next Case button */}
                    <motion.button
                      onClick={() => setPhase('cases')}
                      className="w-full max-w-md py-3 rounded-xl
                        font-display font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #EF4444, #DC2626)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>
                      Next Case
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r
              from-transparent via-red-500/50 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## VERIFICATION CHECKLIST

Run `npm run dev` and test at `http://localhost:3000/arcade/bias-detective`:

### Visual Checks:

- [ ] Chrome bezel with red LED rim glow
- [ ] Red particle background animates
- [ ] Evidence board has dot-grid background pattern
- [ ] Collected bias-relevant evidence shows red gradient string
- [ ] Bar charts animate on load (bars grow from bottom)
- [ ] Pie charts render with colored segments
- [ ] CASE CLOSED stamp slams in with spring animation
- [ ] [v3] 3D justice scales visible in investigate phase (desktop)
- [ ] [v3] Scales tilt when evidence is collected
- [ ] [v3] Golden glow when bias/fair evidence is balanced
- [ ] [v3] Red particles when severely unbalanced
- [ ] [v3] CSS fallback scales on mobile (resize to test)

### Phase Flow (7 phases):

- [ ] Welcome: rank display, topic tags, start button
- [ ] Learn: 4 educational cards (Band B/C variants), skip button
- [ ] Cases: 6 case files with bias type + difficulty badges, age-filtered
- [ ] Investigate: [v3] 3D scales + data viz + evidence board + collect mechanic
- [ ] Test Lab: 3 preset tests + custom input with simulated responses
- [ ] Fix the AI: bias explanation + 4 fix options (checkbox multi-select)
- [ ] Report: CASE CLOSED stamp, fix results, stats, rank up, real-world card

### Accessibility:

- [ ] [v3] 3D canvas has `aria-hidden="true"`
- [ ] [v3] Mobile fallback has `aria-hidden="true"`
- [ ] Evidence buttons have `aria-label` with evidence text
- [ ] Custom test input has `aria-label`
- [ ] All existing ARIA labels preserved
- [ ] Keyboard navigation works for all interactive elements

### [v3] Decision Verification:

- [ ] Decision 6.6: 3D scales visible for Band A, B, AND C users
- [ ] Decision 6.2.5: Brushed brass material, spring physics tilt, ~500 triangles
- [ ] Decision 5.3: Red flagship particles in background (Lab 6 themed)

---

## GIT COMMANDS

```bash
git add src/components/3d/BiasScales3D.tsx
git add src/components/games/BiasDetectiveGame.tsx
git commit -m "Stage 6F v3-FINAL: Bias Detective - 3D justice scales (Decision 6.6, 6.2.5), spring physics, all age bands"
```

---

## END OF STAGE 6F v3-FINAL (Parts A + B + C)

Stage 6F v3-FINAL complete. Bias Detective upgraded with 3D justice scales (Decision 6.6, 6.2.5). Brushed brass MeshStandardMaterial with spring physics tilt, golden glow when balanced, red warning particles when severely unbalanced. All age bands (A, B, C). Mobile CSS fallback with Motion. ~280 lines new (BiasScales3D.tsx) + ~1,400 lines replaced (BiasDetectiveGame.tsx with v3 integration). All v2 features preserved: 6 cases with SVG charts, evidence board, test lab, Fix the AI mechanic, detective rank progression (5 levels), real-world case studies, age-band differentiation, ARIA labels.

**SUPERSEDES:** `STAGE6F_Flagship_BiasDetective.pdf`
