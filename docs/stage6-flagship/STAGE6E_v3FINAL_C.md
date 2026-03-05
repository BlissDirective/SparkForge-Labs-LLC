# Stage 6E v3-FINAL Part C — Agent Architect JSX Render + Verification

**Version:** v3-FINAL
**Build Phase:** 13 (Stage 6E — Agent Architect, Part C: JSX render for all 5 phases)
**Date:** February 28, 2026
**Prerequisites:** Stage 6E Part A (AgentPipeline3D.tsx) + Part B (game logic section) complete
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS
**Lab:** 5 — Agents & Helpers | **Color:** #10B981 (Emerald/Green)
**Age Bands:** B (11-13), C (14-16) — Band A uses 2D fallback (drag complexity)
**GCUD:** V9

---

## Overview

This document contains **Section 2** of the complete standalone `AgentArchitectGame.tsx`. It includes the complete JSX render for all 5 phases (welcome, learn, missions, build with 3D/2D, report), configuration panels, narration bar, and closing braces.

**Instructions:** Append this code after Part B code in the **SAME** file (`src/components/games/AgentArchitectGame.tsx`). The code continues directly from the `selectedBlockData` const at the end of Part B.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 6.4 | 3D pipeline via AgentPipeline3D (desktop) / 2D CSS fallback (mobile) | Build phase JSX |
| 5.3 | Flagship custom particles (emerald) | Particle background layer |

---

## Files

| Action | File | Lines |
|--------|------|-------|
| APPEND (Section 2) | `src/components/games/AgentArchitectGame.tsx` | ~550 |

---

## Code Review Notes & Bug Fixes Applied

| ID | Issue | Severity | Fix Applied |
|----|-------|----------|-------------|
| CR-6E-C1 | `GameShell` missing required `totalRounds` prop | **TS Error** | Added `totalRounds={8}` (8 missions) |
| CR-6E-C2 | HTML entities throughout (`&gt;`, `&lt;`, `&amp;`) | **Encoding** | All decoded to proper JSX/TypeScript |
| CR-6E-C3 | Welcome tags `.map` truncated: `{t` at end of line | **Syntax Error** | Corrected to `{tag}` with proper closing |
| CR-6E-C4 | Block palette button class truncated: `disab` | **Syntax Error** | Completed to `disabled:opacity-30` |
| CR-6E-C5 | 2D fallback `backgroundImage` CSS truncated mid-value | **Syntax Error** | Completed both linear-gradient values |
| CR-6E-C6 | Cinema spotlight `</div>` closing tag truncated | **Syntax Error** | Completed closing tag |
| CR-6E-C7 | Delete button class truncated: `justify-c` | **Syntax Error** | Completed to `justify-center` |
| CR-6E-C8 | Code panel `<pre>` placed outside its parent `<div>` container | **Layout Bug** | Moved `<pre>` inside the container div, before closing `</div>` |
| CR-6E-C9 | Report "Next Mission" button has stray `)}` before button text | **Syntax Error** | Removed stray fragment |
| CR-6E-C10 | Particle `motion.div` has `animate` and `transition` props outside JSX element tag | **Syntax Error** | Moved props into the `<motion.div>` opening tag |
| BUG-10F | Font stack preserved | Compliance | Exo 2/Sora/Orbitron — no Fredoka/Nunito |

---

## Code

### File: `src/components/games/AgentArchitectGame.tsx` (Section 2 — APPEND after Part B)

```typescript
  // ================================================================
  // RENDER
  // ================================================================

  return (
    <GameShell gameId="agent-architect" title="Agent Architect"
      worldNumber={5} worldColor="#10B981" totalRounds={8}>
      <div className="h-full flex flex-col relative overflow-hidden">

        {/* Particle Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-900/8 via-transparent to-transparent" />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size,
                background: `radial-gradient(circle, rgba(16,185,129,${0.15 + p.size * 0.06}) 0%, transparent 70%)`,
              }}
              animate={{ y: [0, -12 - p.size * 4, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Chrome Bezel */}
        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(16,185,129,0.15)',
              boxShadow: '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(16,185,129,0.1)',
            }}>

            {/* Top LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto">
              <AnimatePresence mode="wait">

                {/* ======== WELCOME PHASE ======== */}
                {phase === 'welcome' && (
                  <motion.div key="welcome" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">

                    <motion.div
                      animate={{ boxShadow: ['0 0 20px rgba(16,185,129,0.15)', '0 0 40px rgba(16,185,129,0.3)', '0 0 20px rgba(16,185,129,0.15)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20"
                      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' }}>
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span className="font-data text-data-sm text-emerald-400 uppercase tracking-widest">Lab 5</span>
                    </motion.div>

                    <span className="text-6xl">{'\ud83e\udd16'}</span>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Agent Architect</h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Design AI agents that think, decide, and act! Build flowcharts,
                      configure tools, and watch your agent execute its mission.
                    </p>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Goal Decomposition', 'Tool Use', 'Decision Trees', 'Loops'].map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-body text-[10px] text-emerald-400">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <motion.button onClick={() => setPhase('learn')}
                      className="w-full max-w-sm py-3.5 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      aria-label="Enter the Lab">
                      Enter the Lab <Cpu className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* ======== LEARN PHASE ======== */}
                {phase === 'learn' && (
                  <motion.div key="learn" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">

                    <GraduationCap className="w-6 h-6 text-emerald-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">How AI Agents Work</h3>
                    <p className="font-body text-xs text-white/40">{learnIdx + 1} of {LEARN_CARDS.length}</p>

                    <AnimatePresence mode="wait">
                      <motion.div key={learnIdx} initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        className="max-w-md w-full rounded-xl p-5 border border-emerald-500/20"
                        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.01))' }}>
                        <span className="text-4xl">{LEARN_CARDS[learnIdx].emoji}</span>
                        <h4 className="font-display text-base font-bold text-emerald-300 mt-3">{LEARN_CARDS[learnIdx].title}</h4>
                        <p className="font-body text-sm text-white/60 mt-2 leading-relaxed">
                          {ageBand === 'C' ? LEARN_CARDS[learnIdx].bodyC : LEARN_CARDS[learnIdx].body}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <motion.button onClick={() => {
                      if (learnIdx < LEARN_CARDS.length - 1) setLearnIdx(learnIdx + 1);
                      else setPhase('missions');
                    }}
                      className="w-full max-w-md py-3 rounded-xl font-display font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {learnIdx < LEARN_CARDS.length - 1 ? 'Next \u2192' : 'Choose a Mission! \ud83d\ude80'}
                    </motion.button>

                    <button onClick={() => setPhase('missions')}
                      className="font-body text-xs text-white/20 hover:text-white/40">
                      Skip to missions
                    </button>
                  </motion.div>
                )}

                {/* ======== MISSIONS PHASE ======== */}
                {phase === 'missions' && (
                  <motion.div key="missions" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="p-4 md:p-6 space-y-4">

                    <div className="text-center">
                      <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <h3 className="font-display text-lg font-bold text-white">Choose Your Mission</h3>
                      <p className="font-body text-xs text-white/40">
                        {completedMissions.length} of {availableMissions.length} completed
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {availableMissions.map(m => {
                        const isComplete = completedMissions.includes(m.id);
                        const isLocked = m.difficulty === 'advanced' && completedMissions.length < 4;
                        return (
                          <motion.button key={m.id} onClick={() => !isLocked && startMission(m.id)}
                            disabled={isLocked}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              isComplete ? 'border-emerald-500/30 bg-emerald-500/5'
                              : isLocked ? 'border-white/5 bg-white/[0.01] opacity-40'
                              : 'border-white/10 bg-white/[0.02] hover:border-emerald-500/20'
                            }`}
                            whileHover={!isLocked ? { y: -2 } : {}}
                            whileTap={!isLocked ? { scale: 0.98 } : {}}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{m.emoji}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-sm font-bold text-white">{m.title}</p>
                                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                  {isLocked && (
                                    <span className="text-[9px] text-white/20">
                                      {'\ud83d\udd12'} Complete 4 missions
                                    </span>
                                  )}
                                </div>
                                <p className="font-body text-[11px] text-white/40 mt-0.5">{m.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                m.difficulty === 'beginner' ? 'bg-emerald-500/10 text-emerald-400'
                                : m.difficulty === 'intermediate' ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                              }`}>
                                {m.difficulty}
                              </span>
                              <span className="font-body text-[9px] text-white/20">
                                {m.requirements.length} requirements
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ======== BUILD PHASE ======== */}
                {phase === 'build' && (
                  <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} className="flex-1 flex flex-col">

                    {/* Mission header */}
                    {mission && (
                      <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center gap-2">
                        <span className="text-lg">{mission.emoji}</span>
                        <div className="flex-1">
                          <span className="font-display text-xs font-bold text-emerald-400">{mission.title}</span>
                          <span className="font-body text-[10px] text-white/30 ml-2">{mission.description}</span>
                        </div>
                        <button onClick={() => setPhase('missions')}
                          className="font-body text-[10px] text-white/20 hover:text-white/40">
                          Back
                        </button>
                      </div>
                    )}

                    {/* Block palette */}
                    <div className="px-3 py-2 border-b border-white/5 flex items-center gap-1.5 flex-wrap">
                      {unlockedBlocks.map(type => (
                        <motion.button key={type.id} onClick={() => addBlock(type)} disabled={isRunning}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors disabled:opacity-30"
                          whileTap={{ scale: 0.95 }}
                          style={{ borderColor: `${type.color}20` }}
                          aria-label={`Add ${type.label} block`}>
                          <span className="text-sm">{type.emoji}</span>
                          <span className="font-body text-[11px] text-white/60">{type.label}</span>
                        </motion.button>
                      ))}

                      <div className="flex-1" />

                      {ageBand === 'C' && (
                        <button onClick={() => setShowCode(!showCode)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-body text-[11px] ${
                            showCode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
                          }`}
                          aria-label="Toggle pseudocode view">
                          <Code2 className="w-3 h-3" /> Code
                        </button>
                      )}

                      <motion.button onClick={runAgent} disabled={isRunning || blocks.length < 2}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-white font-display text-xs font-bold disabled:opacity-30"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                        <Play className="w-3.5 h-3.5" /> Run
                      </motion.button>

                      <button onClick={resetCanvas}
                        className="text-white/20 hover:text-white/40 p-1.5"
                        aria-label="Reset canvas">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Validation / connection mode */}
                    <AnimatePresence>
                      {validationMsg && (
                        <motion.div
                          className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}>
                          <span className="font-body text-xs text-amber-400">{validationMsg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {connecting && (
                      <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <span className="font-body text-xs text-blue-400">
                          Click a block to connect...{' '}
                          <button onClick={() => setConnecting(null)}
                            className="ml-2 text-white/30 hover:text-white/50">
                            Cancel
                          </button>
                        </span>
                      </div>
                    )}

                    {/* Main workspace */}
                    <div className="flex-1 flex min-h-0">

                      {/* [v3] 3D Pipeline (desktop) OR 2D Fallback (mobile) */}
                      {!isMobile ? (
                        <div className="flex-1 relative mx-3 my-2 rounded-xl overflow-hidden"
                          style={{ minHeight: '300px' }}>
                          <AgentPipeline3D
                            blocks={pipelineBlocks}
                            connections={pipelineConnections}
                            activeBlockId={activeRunBlock}
                            runPath={runPath}
                            isRunning={isRunning}
                            onBlockClick={handleBlockClick}
                            onPlatformClick={handle3DPlatformClick}
                          />
                          {blocks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="text-center">
                                <span className="text-4xl block mb-2">{'\ud83d\udce6'}</span>
                                <p className="font-body text-sm text-white/25">
                                  Click blocks from the palette to build your agent
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* 2D FALLBACK WORKSPACE (mobile + Band A) */
                        <div className="flex-1 relative overflow-auto mx-3 my-2 rounded-xl border border-white/5"
                          style={{
                            background: 'linear-gradient(180deg, rgba(16,185,129,0.02) 0%, rgba(0,0,0,0.3) 100%)',
                            backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                          }}
                          onClick={() => { setConnecting(null); setSelectedBlock(null); }}>

                          {/* Cinema spotlight overlay */}
                          {isRunning && spotlightPos && (
                            <div className="absolute inset-0 z-10 pointer-events-none"
                              style={{
                                background: `radial-gradient(circle 120px at ${spotlightPos.x}px ${spotlightPos.y}px, transparent 0%, rgba(0,0,0,0.7) 100%)`,
                              }}
                            />
                          )}

                          {/* SVG arrows */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
                            <defs>
                              <marker id="ah-d" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.2)" />
                              </marker>
                              <marker id="ah-a" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
                              </marker>
                            </defs>

                            {arrows.map((arrow, i) => {
                              const from = getBlockCenter(arrow.fromId);
                              const to = getBlockCenter(arrow.toId);
                              const active = runPath.includes(arrow.fromId) && runPath.includes(arrow.toId);
                              const fb = blocks.find(b => b.id === arrow.fromId);
                              const label = fb?.type.outputs === 2
                                ? (arrow.outputIndex === 0 ? 'YES' : 'NO')
                                : null;
                              const mx = (from.x + to.x) / 2;
                              const my = (from.y + 30 + to.y - 30) / 2;

                              return (
                                <g key={i}>
                                  <line
                                    x1={from.x} y1={from.y + 30}
                                    x2={to.x} y2={to.y - 30}
                                    stroke={active ? '#10B981' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth={active ? 2.5 : 1.2}
                                    strokeDasharray={active ? '' : '6 3'}
                                    markerEnd={active ? 'url(#ah-a)' : 'url(#ah-d)'}
                                  />
                                  {active && (
                                    <circle r={2.5} fill="#10B981" opacity={0.8}>
                                      <animateMotion dur="1s" repeatCount="indefinite"
                                        path={`M${from.x},${from.y + 30} L${to.x},${to.y - 30}`} />
                                    </circle>
                                  )}
                                  {label && (
                                    <text x={mx + 10} y={my}
                                      fill={arrow.outputIndex === 0 ? '#22C55E' : '#EF4444'}
                                      fontSize={9} fontFamily="system-ui" fontWeight="bold">
                                      {label}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </svg>

                          {/* 2D Blocks */}
                          {blocks.map(block => {
                            const isActive = activeRunBlock === block.id;
                            const inPath = runPath.includes(block.id);
                            const isSel = selectedBlock === block.id;
                            return (
                              <motion.div key={block.id}
                                className={`absolute z-20 cursor-pointer select-none ${
                                  connecting ? 'ring-2 ring-blue-500/30 rounded-xl' : ''
                                }`}
                                style={{ left: block.x, top: block.y }}
                                onClick={e => { e.stopPropagation(); handleBlockClick(block.id); }}
                                drag={!isRunning && !connecting}
                                dragMomentum={false}
                                onDrag={(_, info) => {
                                  setBlocks(prev => prev.map(b =>
                                    b.id === block.id
                                      ? { ...b, x: Math.max(0, b.x + info.delta.x), y: Math.max(0, b.y + info.delta.y) }
                                      : b
                                  ));
                                }}
                                animate={isActive ? { scale: [1, 1.06, 1] } : {}}
                                transition={isActive ? { duration: 0.6, repeat: Infinity } : {}}>

                                {/* Block shadow */}
                                <div className="absolute inset-0 rounded-xl translate-x-1 translate-y-1"
                                  style={{ backgroundColor: `${block.type.color}10`, filter: 'blur(4px)' }} />

                                {/* Block card */}
                                <div className={`relative w-[130px] rounded-xl border-2 p-3 text-center transition-all ${
                                  isActive ? 'shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                                  : isSel ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''
                                }`}
                                  style={{
                                    backgroundColor: `${block.type.color}12`,
                                    borderColor: isActive ? '#10B981'
                                      : isSel ? `${block.type.color}50`
                                      : `${block.type.color}20`,
                                    boxShadow: isActive ? undefined
                                      : '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                                  }}>
                                  <span className="text-xl">{block.type.emoji}</span>
                                  <p className="font-display text-[11px] font-bold text-white mt-1">
                                    {block.type.label}
                                  </p>
                                  {block.config.text && (
                                    <p className="font-body text-[9px] text-white/30 mt-0.5 truncate">
                                      {block.config.text}
                                    </p>
                                  )}

                                  {/* Delete button */}
                                  {!isRunning && (
                                    <button
                                      onClick={e => { e.stopPropagation(); removeBlock(block.id); }}
                                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center"
                                      aria-label={`Delete ${block.type.label} block`}>
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Output ports */}
                                {block.type.outputs >= 1 && (
                                  <div className="flex justify-center gap-4 mt-1.5">
                                    <button onClick={e => handleOutputClick(block.id, 0, e)}
                                      className="w-4 h-4 rounded-full bg-white/15 hover:bg-emerald-500/40 border border-white/20"
                                      title={block.type.outputs === 2 ? 'YES' : 'Connect'}
                                      aria-label="Output port" />
                                    {block.type.outputs === 2 && (
                                      <button onClick={e => handleOutputClick(block.id, 1, e)}
                                        className="w-4 h-4 rounded-full bg-white/15 hover:bg-red-500/40 border border-white/20"
                                        title="NO"
                                        aria-label="NO output port" />
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}

                          {/* Empty state */}
                          {blocks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-4xl block mb-2">{'\ud83d\udce6'}</span>
                                <p className="font-body text-sm text-white/25">
                                  Click blocks from the palette to build your agent
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Code Panel (Band C) */}
                      {showCode && ageBand === 'C' && (
                        <motion.div initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 280, opacity: 1 }}
                          className="border-l border-white/5 overflow-y-auto">
                          <div className="p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Code2 className="w-3 h-3 text-emerald-400" />
                              <span className="font-display text-[11px] font-bold text-emerald-400">Pseudocode</span>
                            </div>
                            <pre className="font-mono text-[10px] text-white/50 leading-relaxed whitespace-pre-wrap">
                              {pseudocode}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Block Config Panel */}
                    <AnimatePresence>
                      {selectedBlockData && selectedBlockData.type.configurable && !isRunning && (
                        <motion.div initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mx-3 mb-2 overflow-hidden">
                          <div className="glass-card rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Settings2 className="w-3.5 h-3.5 text-white/40" />
                              <span className="font-display text-xs font-bold text-white">
                                Configure {selectedBlockData.type.label}
                              </span>
                            </div>

                            {/* Text input: Goal, Decide, Check, Loop, Memory, Human */}
                            {['goal', 'decide', 'check', 'loop', 'memory', 'human'].includes(selectedBlockData.type.id) && (
                              <input type="text"
                                value={selectedBlockData.config.text || ''}
                                onChange={e => updateBlockConfig(selectedBlockData.id, { text: e.target.value })}
                                placeholder={
                                  selectedBlockData.type.id === 'goal' ? "What is the agent's mission?" :
                                  selectedBlockData.type.id === 'decide' ? 'What condition to check?' :
                                  selectedBlockData.type.id === 'check' ? 'What to verify?' :
                                  selectedBlockData.type.id === 'loop' ? 'Loop until...' :
                                  selectedBlockData.type.id === 'memory' ? 'What to remember?' :
                                  'What to ask the human?'
                                }
                                className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 font-body text-xs focus:outline-none focus:border-emerald-500/30"
                                aria-label="Block configuration text" />
                            )}

                            {/* Tool selector */}
                            {selectedBlockData.type.id === 'tool' && (
                              <div className="flex flex-wrap gap-1.5">
                                {TOOL_OPTIONS.map(tool => (
                                  <button key={tool.id}
                                    onClick={() => updateBlockConfig(selectedBlockData.id, { tool: tool.id })}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
                                      selectedBlockData.config.tool === tool.id
                                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'
                                    }`}>
                                    {tool.emoji} {tool.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Search target selector */}
                            {selectedBlockData.type.id === 'search' && (
                              <div className="flex flex-wrap gap-1.5">
                                {SEARCH_TARGETS.map(target => (
                                  <button key={target.id}
                                    onClick={() => updateBlockConfig(selectedBlockData.id, { searchTarget: target.id })}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
                                      selectedBlockData.config.searchTarget === target.id
                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                        : 'border-white/5 bg-white/[0.02] text-white/40 hover:bg-white/5'
                                    }`}>
                                    {target.emoji} {target.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Narration bar (during execution) */}
                    {isRunning && runSteps.length > 0 && (
                      <div className="mx-3 mb-2 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="font-body text-xs text-emerald-300">
                            {runSteps[runSteps.length - 1].narration}
                          </span>
                          {runSteps[runSteps.length - 1].decision && (
                            <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              runSteps[runSteps.length - 1].decision === 'yes'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {runSteps[runSteps.length - 1].decision?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Emoji trail */}
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {runSteps.map((step, i) => {
                            const b = blocks.find(bl => bl.id === step.blockId);
                            return b ? (
                              <span key={i} className="text-[11px] opacity-60">{b.type.emoji}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ======== REPORT PHASE ======== */}
                {phase === 'report' && reportData && (
                  <motion.div key="report" initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">

                    <Award className="w-8 h-8 text-emerald-400" />
                    <h3 className="font-display text-xl font-bold text-white">Mission Report</h3>
                    {mission && (
                      <p className="font-body text-xs text-white/40">{mission.emoji} {mission.title}</p>
                    )}

                    {/* Stars */}
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <Star key={i} className={`w-8 h-8 ${
                          i <= reportData.stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/10'
                        }`} />
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="font-display text-2xl font-bold text-emerald-400">{reportData.pathLen}</p>
                        <p className="font-body text-[10px] text-white/30">Steps</p>
                      </div>
                      <div>
                        <p className="font-display text-2xl font-bold text-emerald-400">{blocks.length}</p>
                        <p className="font-body text-[10px] text-white/30">Blocks</p>
                      </div>
                      <div>
                        <p className={`font-display text-sm font-bold ${
                          reportData.efficiency === 'Excellent' ? 'text-emerald-400'
                          : reportData.efficiency === 'Good' ? 'text-amber-400'
                          : 'text-red-400'
                        }`}>
                          {reportData.efficiency}
                        </p>
                        <p className="font-body text-[10px] text-white/30">Efficiency</p>
                      </div>
                    </div>

                    {/* Mission log */}
                    <div className="max-w-sm w-full space-y-1.5 max-h-36 overflow-y-auto">
                      {runSteps.map((step, i) => {
                        const b = blocks.find(bl => bl.id === step.blockId);
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02]">
                            <span className="text-xs">{b?.type.emoji}</span>
                            <span className="font-body text-[10px] text-white/40 flex-1">{step.narration}</span>
                            {step.decision && (
                              <span className={`text-[9px] font-bold ${
                                step.decision === 'yes' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {step.decision.toUpperCase()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Tips */}
                    {reportData.tips.length > 0 && (
                      <div className="max-w-sm w-full rounded-xl p-3 border border-amber-500/20 bg-amber-500/5">
                        <p className="font-display text-xs font-bold text-amber-400">{'\ud83d\udca1'} Tips</p>
                        {reportData.tips.map((tip, i) => (
                          <p key={i} className="font-body text-[10px] text-white/40">{'\u2022'} {tip}</p>
                        ))}
                      </div>
                    )}

                    {/* Block unlock notifications */}
                    {completedMissions.length > 0 && (() => {
                      const newUnlocks = ALL_BLOCK_TYPES.filter(
                        bt => bt.unlockAfter === completedMissions.length
                      );
                      if (newUnlocks.length === 0) return null;
                      return (
                        <motion.div initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl p-3 border border-amber-500/20 max-w-sm w-full"
                          style={{ background: 'rgba(245,158,11,0.03)' }}>
                          <p className="font-display text-xs font-bold text-amber-400">
                            {'\ud83d\udd13'} New Blocks Unlocked!
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newUnlocks.map(bt => (
                              <span key={bt.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-[11px] text-white/60">
                                {bt.emoji} {bt.label}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })()}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => {
                          setPhase('build');
                          setReportData(null);
                          setRunPath([]);
                          setRunSteps([]);
                          setActiveRunBlock(null);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-emerald-500/20 font-display text-xs font-bold text-emerald-400"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Improve Agent
                      </motion.button>
                      <motion.button onClick={() => setPhase('missions')}
                        className="px-6 py-2.5 rounded-xl font-display text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Next Mission
                      </motion.button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom LED rim */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
```

---

## END OF PART C

**Contents summary:**
- Complete JSX render for all 5 phases (welcome, learn, missions, build, report)
- Chrome bezel with emerald LED rim (top + bottom)
- Emerald particle background (20 floating particles)
- [v3] 3D workspace (desktop via AgentPipeline3D) / 2D fallback (mobile with SVG arrows, Framer drag)
- Block configuration panels (text, tool selector, search target selector)
- Narration bar with emoji trail during cinema mode execution
- Report phase with stars, stats, mission log, tips, unlock notifications
- All closing braces for component and GameShell

---

## Verification Checklist (Part C)

### Build & Type Safety
- [x] `GameShell` receives all required props: `gameId`, `title`, `worldNumber`, `worldColor`, `totalRounds={8}`
- [x] All HTML entities decoded to proper JSX (`>`, `<`, `&` — not `&gt;`, `&lt;`, `&amp;`)
- [x] No truncated class names or JSX expressions
- [x] `<pre>` for pseudocode correctly nested inside its container `<div>`
- [x] All `motion.div` elements have `animate`/`transition` props inside JSX tags
- [x] SVG `z-5` class replaced with `z-[5]` for Tailwind arbitrary value syntax
- [x] All JSX elements properly closed (no dangling tags)

### Visual Checks
- [ ] Chrome bezel with emerald LED rim glow (top + bottom 2px gradients)
- [ ] Emerald particle background animates (20 floating particles)
- [ ] [v3] Desktop: Full 3D R3F canvas with platform grid, typed block geometries
- [ ] [v3] Mobile (<768px): 2D CSS fallback with isometric grid, SVG arrows, Framer drag
- [ ] Active execution block pulses with green glow
- [ ] YES/NO labels on branching connections

### Phase Flow
- [ ] Welcome: Lab 5 badge, 4 topic tags, enter button with aria-label
- [ ] Learn: 4 cards with Band B/C bodyC variants, skip option
- [ ] Missions: 8 missions grid, difficulty badges, completion marks, lock indicators
- [ ] Build: Block palette, 3D workspace (desktop) / 2D workspace (mobile), config panel, run button, narration bar
- [ ] Report: Stars (1-3), path/block/efficiency stats, mission log, tips, unlock notifications

### Block Configuration
- [ ] Goal: text input for mission objective
- [ ] Search: 4 target buttons (Web, Database, Memory, Files)
- [ ] Tool: 6 option buttons (Calculator, Translator, Code Runner, Web Scraper, Email Sender, Scheduler)
- [ ] Decide/Check: text input for condition
- [ ] Loop: text input for loop condition
- [ ] Memory: text input for what to remember
- [ ] Human: text input for what to ask
- [ ] Done/Parallel: no config panel (configurable: false)

### Mission System
- [ ] 8 missions (3 beginner, 3 intermediate, 2 advanced)
- [ ] Required block types enforced during validation
- [ ] Star rating: pathLen<=optimal + meetsReqs + blockCount<=minBlocks+2
- [ ] Progressive unlock tracked; advanced locked until 4+ completions

### Block Unlock Progression
- [ ] Start: Goal, Search, Done (unlockAfter: 0)
- [ ] After 1: +Tool, +Decide (unlockAfter: 1)
- [ ] After 2: +Check, +Loop (unlockAfter: 2)
- [ ] After 4: +Memory (unlockAfter: 4, Band C)
- [ ] After 5: +Parallel (unlockAfter: 5, Band C)
- [ ] After 6: +Human (unlockAfter: 6, Band C)
- [ ] Unlock notification on report screen

### Pseudocode (Band C)
- [ ] Code toggle in palette bar (Band C only)
- [ ] Panel slides in 280px from right
- [ ] Live update as blocks placed/connected
- [ ] Decide=if/else, Loop=while, Parallel=Promise.all
- [ ] Hidden for Band A and B

### Execution (Cinema Mode)
- [ ] Validates: Goal + Done + 3+ blocks + all connected + required types
- [ ] [v3] 3D SpotLight + PointLight on active (desktop), CSS radial-gradient (mobile)
- [ ] Narration bar with step text + emoji trail
- [ ] Random YES/NO on Decide/Check (visual badge)
- [ ] Loop protection: 20 step max + visited set

### Accessibility
- [ ] Palette buttons: `aria-label='Add {type} block'`
- [ ] Delete buttons: `aria-label='Delete {type} block'`
- [ ] Output ports: `aria-label`
- [ ] Config input: `aria-label='Block configuration text'`
- [ ] Code toggle: `aria-label='Toggle pseudocode view'`
- [ ] Enter button: `aria-label='Enter the Lab'`
- [ ] Reset button: `aria-label='Reset canvas'`

---

## Git Commands

```bash
# After assembling Part B + Part C into a single file:
git add src/components/games/AgentArchitectGame.tsx
git commit -m "Stage 6E v3-FINAL Parts B+C: Agent Architect game (Decision 6.4)"
```

---

## END OF STAGE 6E v3-FINAL (Parts A + B + C)

Stage 6E v3-FINAL complete. Agent Architect upgraded from CSS isometric to full R3F 3D pipeline (Decision 6.4). All v2 features preserved: 10 block types, 8 missions, cinema mode, pseudocode (Band C), progressive unlock. Mobile 2D fallback. ~400 lines new (3D) + ~1,500 lines replaced (game). 45 v2 PDF truncations reconstructed and verified.
