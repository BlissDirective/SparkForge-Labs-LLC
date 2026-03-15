# SPARKFORGE — STAGE 7B v3-FINAL (Part C)

## Career Explorer (Standard Polish) + Full Batch 7B Verification

**Date:** February 28, 2026
**GCUD Version:** V9
**Batch:** 7B — Drag & Drop Games
**Game:** Career Explorer — Lab 10 (AI's Future) — Standard Polish
**V3 Status:** UNCHANGED from V2 — No 3D enhancements per Decision 6.5
**File:** `src/components/games/CareerExplorerGame.tsx`
**Completes:** Stage 7B v3-FINAL — All 4 Drag & Drop games

---

## UNCHANGED FILE: `src/components/games/CareerExplorerGame.tsx`

> V2 Standard Polish — No 3D enhancements. Retains unique 2D visual enhancements with lab-colored particles.

```tsx
// ================================================================
// CAREER EXPLORER V2 — Lab 10 (AI's Future)
// Swipeable AI career cards with detail panels.
// Enhanced: chrome bezel, welcome phase, 10 careers,
// age-band salary visibility, summary of favorites.
//
// V3 NOTE: No 3D enhancements. This is a standard polish game
// per Decision 6.5. Retains unique 2D visual enhancements
// with lab-colored particle background (fuchsia).
// ================================================================

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameShell } from '@/components/game/GameShell';
import { useGameStore } from '@/stores/gameStore';
import { useChildStore } from '@/stores/childStore';
import { ThumbsUp, ThumbsDown, Compass, Sparkles } from 'lucide-react';

type Phase = 'welcome' | 'swipe' | 'summary';

interface Career {
  title: string;
  emoji: string;
  dayInLife: string;
  dayInLifeC: string;
  skills: string[];
  education: string;
  salary: string;
  growth: string;
}

const CAREERS: Career[] = [
  {
    title: 'ML Engineer',
    emoji: '🧠',
    dayInLife: 'Train AI models and make them work better!',
    dayInLifeC: 'Design and optimize machine learning pipelines, from data preprocessing through model deployment and monitoring.',
    skills: ['Python', 'Math', 'Data'],
    education: 'CS Degree + ML specialization',
    salary: '$130K–$200K',
    growth: '🚀 Very High',
  },
  {
    title: 'AI Ethicist',
    emoji: '⚖️',
    dayInLife: 'Make sure AI is fair for everyone!',
    dayInLifeC: 'Audit AI systems for bias, develop ethical frameworks, and advise organizations on responsible AI deployment.',
    skills: ['Ethics', 'Policy', 'Research'],
    education: 'Philosophy/Law + Tech',
    salary: '$90K–$150K',
    growth: '📈 High',
  },
  {
    title: 'Robotics Engineer',
    emoji: '🤖',
    dayInLife: 'Build robots that move and interact with the world!',
    dayInLifeC: 'Integrate mechanical systems, sensors, and AI algorithms to create autonomous or semi-autonomous robotic systems.',
    skills: ['Engineering', 'C++', 'Control Systems'],
    education: 'Mechanical/Electrical Eng.',
    salary: '$110K–$170K',
    growth: '🚀 Very High',
  },
  {
    title: 'AI Artist',
    emoji: '🎨',
    dayInLife: 'Create amazing art using AI tools!',
    dayInLifeC: 'Leverage generative models (diffusion, GANs) to produce visual art, blending traditional aesthetics with computational creativity.',
    skills: ['Art', 'Prompting', 'Design'],
    education: 'Art/Design + AI tools',
    salary: '$60K–$120K',
    growth: '🌱 Emerging',
  },
  {
    title: 'Data Scientist',
    emoji: '📊',
    dayInLife: 'Find hidden patterns in data that help businesses!',
    dayInLifeC: 'Apply statistical methods and machine learning to extract actionable insights from large, complex datasets.',
    skills: ['Statistics', 'Python', 'SQL'],
    education: 'Stats/Math/CS Degree',
    salary: '$120K–$180K',
    growth: '📈 High',
  },
  {
    title: 'NLP Researcher',
    emoji: '💬',
    dayInLife: 'Teach AI to understand and speak languages!',
    dayInLifeC: 'Research and develop language models, focusing on semantic understanding, generation, and multilingual capabilities.',
    skills: ['Linguistics', 'Deep Learning', 'Python'],
    education: 'PhD or MS in NLP/CS',
    salary: '$140K–$220K',
    growth: '🚀 Very High',
  },
  {
    title: 'AI Product Manager',
    emoji: '📋',
    dayInLife: 'Decide what AI products should do!',
    dayInLifeC: 'Bridge technical AI capabilities with user needs, defining product roadmaps and success metrics for AI-powered features.',
    skills: ['Strategy', 'Communication', 'Tech'],
    education: 'Business/CS + PM experience',
    salary: '$130K–$190K',
    growth: '📈 High',
  },
  {
    title: 'Computer Vision Eng.',
    emoji: '👁️',
    dayInLife: 'Teach computers to see — cars, cameras, medical scans!',
    dayInLifeC: 'Develop and deploy visual perception systems using CNNs, transformers, and multi-modal architectures.',
    skills: ['OpenCV', 'PyTorch', 'Math'],
    education: 'CS Degree + CV focus',
    salary: '$130K–$200K',
    growth: '🚀 Very High',
  },
  {
    title: 'AI Safety Researcher',
    emoji: '🛡️',
    dayInLife: 'Keep AI safe and helpful for humans!',
    dayInLifeC: 'Research alignment techniques, interpretability methods, and robustness properties to ensure AI systems behave as intended.',
    skills: ['ML Theory', 'Math', 'Philosophy'],
    education: 'PhD in ML/AI Safety',
    salary: '$150K–$250K',
    growth: '🌱 Emerging',
  },
  {
    title: 'Prompt Engineer',
    emoji: '✍️',
    dayInLife: 'Write the perfect instructions for AI!',
    dayInLifeC: 'Design, test, and optimize prompts for large language models, developing systematic approaches to elicit desired outputs.',
    skills: ['Writing', 'Logic', 'Testing'],
    education: 'Various — emerging field',
    salary: '$80K–$150K',
    growth: '🌱 Emerging',
  },
];

export function CareerExplorerGame() {
  const game = useGameStore();
  const { activeChild } = useChildStore();
  const ageBand = (activeChild?.age_band || 'B') as 'A' | 'B' | 'C';

  const [phase, setPhase] = useState<Phase>('welcome');
  const [idx, setIdx] = useState(0);
  const [favorites, setFavorites] = useState<Career[]>([]);
  const [exitDir, setExitDir] = useState(0);

  const career = CAREERS[idx];

  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
        dur: Math.random() * 6 + 4,
      })),
    []
  );

  function swipe(interested: boolean) {
    if (interested) setFavorites((prev) => [...prev, career]);
    setExitDir(interested ? 1 : -1);
    game.updateScore(5);
    setTimeout(() => {
      setExitDir(0);
      if (idx < CAREERS.length - 1) {
        setIdx((i) => i + 1);
        game.advanceRound();
      } else {
        setPhase('summary');
        game.completeGame();
      }
    }, 300);
  }

  return (
    <GameShell
      gameId="career-explorer"
      title="Career Explorer"
      worldNumber={10}
      worldColor="#D946EF"
    >
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* Particle background */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: `radial-gradient(circle, rgba(217,70,239,${
                  0.15 + p.size * 0.06
                }), transparent)`,
              }}
              animate={{ y: [0, -12, 0], opacity: [0.1, 0.35, 0.1] }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex-1 flex flex-col p-3 md:p-5">
          <div
            className="flex-1 flex flex-col rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(217,70,239,0.15)',
              boxShadow:
                '0 2px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(217,70,239,0.1)',
            }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

            <div className="flex-1 flex flex-col overflow-auto p-4 items-center justify-center">
              <AnimatePresence mode="wait">
                {/* --- WELCOME --- */}
                {phase === 'welcome' && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-4"
                  >
                    <span className="text-5xl">🔮</span>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Career Explorer
                    </h2>
                    <p className="font-body text-sm text-white/50 max-w-sm">
                      Swipe through exciting AI careers and discover what
                      interests you!
                    </p>
                    <div className="flex gap-2 justify-center">
                      {['AI Careers', 'Skills', 'Future Jobs'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 font-body text-[10px] text-fuchsia-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <motion.button
                      onClick={() => setPhase('swipe')}
                      className="w-full max-w-xs py-3 rounded-xl font-display font-bold text-sm text-white"
                      style={{
                        background:
                          'linear-gradient(135deg, #D946EF, #A855F7)',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Explore Careers!{' '}
                      <Compass className="inline w-4 h-4 ml-1" />
                    </motion.button>
                  </motion.div>
                )}

                {/* --- SWIPE --- */}
                {phase === 'swipe' && career && (
                  <motion.div
                    key="swipe"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: exitDir * 200 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl p-5 max-w-sm w-full border border-fuchsia-500/20 bg-fuchsia-500/5"
                      >
                        <div className="text-center mb-3">
                          <span className="text-4xl">{career.emoji}</span>
                          <h3 className="font-display text-lg font-bold text-white mt-1">
                            {career.title}
                          </h3>
                          <span className="font-body text-[10px] text-fuchsia-300">
                            {career.growth}
                          </span>
                        </div>

                        <div className="space-y-2.5 text-left">
                          <div>
                            <p className="font-body text-[9px] text-white/25 uppercase tracking-wider">
                              A Day in the Life
                            </p>
                            <p className="font-body text-xs text-white/60">
                              {ageBand === 'C'
                                ? career.dayInLifeC
                                : career.dayInLife}
                            </p>
                          </div>
                          <div>
                            <p className="font-body text-[9px] text-white/25 uppercase tracking-wider">
                              Key Skills
                            </p>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {career.skills.map((s) => (
                                <span
                                  key={s}
                                  className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 font-body text-[9px] text-fuchsia-300"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div>
                              <p className="font-body text-[9px] text-white/25 uppercase">
                                Education
                              </p>
                              <p className="font-body text-[10px] text-white/50">
                                {career.education}
                              </p>
                            </div>
                            {ageBand !== 'A' && (
                              <div className="text-right">
                                <p className="font-body text-[9px] text-white/25 uppercase">
                                  Salary
                                </p>
                                <p className="font-display text-[10px] font-bold text-emerald-400">
                                  {career.salary}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Swipe buttons */}
                    <div className="flex gap-6 mt-4 justify-center">
                      <motion.button
                        onClick={() => swipe(false)}
                        className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"
                        whileTap={{ scale: 0.85 }}
                        aria-label="Not interested"
                      >
                        <ThumbsDown className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => swipe(true)}
                        className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400"
                        whileTap={{ scale: 0.85 }}
                        aria-label="Interested"
                      >
                        <ThumbsUp className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <p className="font-body text-[10px] text-white/15 mt-2 text-center">
                      {idx + 1}/{CAREERS.length}
                    </p>
                  </motion.div>
                )}

                {/* --- SUMMARY --- */}
                {phase === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <Sparkles className="w-8 h-8 text-fuchsia-400 mx-auto" />
                    <h3 className="font-display text-xl font-bold text-white">
                      Your AI Career Picks!
                    </h3>
                    {favorites.length > 0 ? (
                      <div className="space-y-2 max-w-sm">
                        {favorites.map((c) => (
                          <div
                            key={c.title}
                            className="rounded-xl p-3 flex items-center gap-3 bg-fuchsia-500/5 border border-fuchsia-500/10"
                          >
                            <span className="text-2xl">{c.emoji}</span>
                            <div className="text-left">
                              <p className="font-display text-sm font-bold text-white">
                                {c.title}
                              </p>
                              <p className="font-body text-[9px] text-white/30">
                                {c.skills.join(' · ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-body text-sm text-white/50">
                        No picks yet — that's okay! Explore more later.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

export default CareerExplorerGame;
```

---

## FULL BATCH 7B v3-FINAL VERIFICATION

### COMPLETE FILE INVENTORY

| File Path | Type | Status |
|-----------|------|--------|
| `src/components/3d/SortScene3D.tsx` | NEW | Part A — 3D throwable objects (Decision 6.3) |
| `src/components/3d/CodeBlocks3D.tsx` | NEW | Part B — 3D snap blocks (Decision 6.5) |
| `src/components/games/SortToyBoxGame.tsx` | MODIFIED | Part A — Integrates SortScene3D + 2D fallback |
| `src/components/games/CodeBlocksGame.tsx` | MODIFIED | Part B — V3 Full Treatment replaces V2 |
| `src/components/games/HumanVsMachineGame.tsx` | UNCHANGED | Part A — V2 Standard Polish retained |
| `src/components/games/CareerExplorerGame.tsx` | UNCHANGED | Part C — V2 Standard Polish retained |

### DECISION VERIFICATION

| Decision | Requirement | Implementation |
|----------|-------------|----------------|
| 6.3 | Sort Toy Box: Full 3D throwing with parabolic arcs | SortScene3D.tsx with parametric arcs, ~2K triangles |
| 6.5 | 13 games get 3D: 6 full + 7 FL-Lite. Others stay 2D. | Sort=Full 3D, Code Blocks=Tier 2 Enhanced, HvM+Career=2D |

---

### MASTER VERIFICATION CHECKLIST — ALL 4 GAMES

#### `npm run dev`

**Sort Toy Box** (`/arcade/sort-toy-box`):
- [ ] Chrome bezel (Lab 2 `#AA66FF` purple), welcome → sort → reveal
- [ ] Desktop: 3D throwable primitives with parabolic arcs
- [ ] Mobile: 2D CSS shapes fallback
- [ ] AI criterion reveal with age-band depth
- [ ] Score: +2 per assignment, +20 on reveal

**Human vs Machine** (`/arcade/human-vs-machine`):
- [ ] Chrome bezel (Lab 1 `#00BBFF` sky-blue), welcome → side-by-side play
- [ ] Human input left, AI answer right with timed reveal
- [ ] Advantage cards per round, age-band descriptions
- [ ] Score: +10 per submission

**Code Blocks** (`/arcade/code-blocks`):
- [ ] Chrome bezel (Lab 9 `#F97316` orange), welcome → learn 4 concepts → play
- [ ] Robot actor with 20 poses, spring animation
- [ ] Magnetic block snapping with interlocking notch visuals
- [ ] Execution tracer: glowing line through placed blocks
- [ ] Terminal: green monospace with blinking cursor
- [ ] Pseudocode panel toggle
- [ ] Star rating: 1-3 stars per challenge
- [ ] 10 challenges: Band A=5, Band B=7, Band C=10
- [ ] Desktop: CodeBlocks3D renders above workspace
- [ ] Hint button and Reset button functional

**Career Explorer** (`/arcade/career-explorer`):
- [ ] Chrome bezel (fuchsia), welcome → swipe → summary
- [ ] 10 AI career cards with swipe interaction
- [ ] Band A: salary hidden. Band B/C: salary visible
- [ ] Band C: technical dayInLife descriptions
- [ ] Summary shows favorited careers with skills
- [ ] Score: +5 per swipe

### FINAL GIT COMMANDS — FULL BATCH 7B v3-FINAL

```bash
# Stage 7B v3-FINAL: All files
git add src/components/3d/SortScene3D.tsx
git add src/components/3d/CodeBlocks3D.tsx
git add src/components/games/SortToyBoxGame.tsx
git add src/components/games/HumanVsMachineGame.tsx
git add src/components/games/CodeBlocksGame.tsx
git add src/components/games/CareerExplorerGame.tsx

git commit -m "Stage 7B v3-FINAL: Sort Toy Box 3D + Code Blocks V3 Full Treatment + HvM + Career Explorer"
git push origin main
```

**STAGE 7B v3-FINAL COMPLETE** — Parts A + B + C deliver all 4 games, 2 new 3D components, and full Decision 6.3/6.5 compliance.
