// ════════════════════════════════════════════════════════════════════════
// SIMULATION LEVEL RENDERER — Shared for simulation games
// ════════════════════════════════════════════════════════════════════════
// Interactive simulations with parameter sliders, run buttons,
// animated results, and score calculation. Games provide config
// (parameters, targets) and a simulate() function.

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Zap, RotateCcw, Play, Target, GraduationCap } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import type { LevelConfig, LevelResult } from './GameLevelSystem';
import {
  ScoreDisplay, GlowingTitle, FeedbackPopup,
  ComboCounter, LevelBadge,
} from './GameVisualKit';

export interface SimParameter {
  id: string;
  label: string;
  emoji: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface SimResult {
  score: number;
  maxScore: number;
  outputs: Record<string, { value: number; target: number; label: string; emoji: string }>;
  feedback: string;
  explanation: string;
}

interface SimLevelRendererProps {
  level: LevelConfig;
  onComplete: (result: LevelResult) => void;
  onExit: () => void;
  labColor: string;
  gameEmoji: string;
  description: string;
  concept: string;
  challenge?: string;
  parameters: SimParameter[];
  simulate: (params: Record<string, number>) => SimResult;
}

export default function SimLevelRenderer({
  level, onComplete, onExit, labColor, gameEmoji,
  description, concept, challenge, parameters: initialParams, simulate,
}: SimLevelRendererProps) {
  const [phase, setPhase] = useState<'welcome' | 'sim' | 'result'>('welcome');
  const [params, setParams] = useState<SimParameter[]>(initialParams);
  const [result, setResult] = useState<SimResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const handleParamChange = useCallback((id: string, value: number) => {
    setParams((prev) => prev.map((p) => p.id === id ? { ...p, value } : p));
  }, []);

  const handleRun = useCallback(() => {
    const paramValues: Record<string, number> = {};
    params.forEach((p) => { paramValues[p.id] = p.value; });
    const simResult = simulate(paramValues);
    setResult(simResult);
    setAttempts((a) => a + 1);
    setBestScore((b) => Math.max(b, simResult.score));
    setPhase('result');

    // Auto-complete after 3 attempts or if score is good
    if (attempts >= 2 || simResult.score >= level.starThresholds[0]) {
      const stars = simResult.score >= level.starThresholds[2] ? 3 :
        simResult.score >= level.starThresholds[1] ? 2 :
        simResult.score >= level.starThresholds[0] ? 1 : 0;
      setTimeout(() => {
        onComplete({
          score: simResult.score,
          maxScore: simResult.maxScore,
          stars: stars as 0 | 1 | 2 | 3,
          xpEarned: level.xpReward * (stars / 3),
          timeMs: attempts * 30000,
        });
      }, 2500);
    }
  }, [params, simulate, attempts, level, onComplete]);

  const handleRetry = useCallback(() => {
    setPhase('sim');
    setResult(null);
  }, []);

  // Welcome
  if (phase === 'welcome') {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-5">
          <GlowingTitle emoji={gameEmoji} color={labColor}>Level {level.id}: {level.name}</GlowingTitle>
          <SFCard variant="elevated" className="p-5">
            <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{description}</p>
            <div className="rounded-xl p-3 text-xs" style={{ background: `${labColor}10`, color: labColor }}>
              <GraduationCap className="w-4 h-4 inline mr-1" />
              <strong>Concept:</strong> {concept}
            </div>
            {challenge && (
              <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#FF6B3510', color: '#FF6B35' }}>
                <Target className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Challenge:</strong> {challenge}</span>
              </div>
            )}
          </SFCard>
          <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('sim')}>
            Start Simulation <ChevronRight className="w-5 h-5 ml-2" />
          </SFButton>
        </div>
      </div>
    );
  }

  // Simulation
  if (phase === 'sim' || (phase === 'result' && attempts < 3)) {
    return (
      <div className="relative space-y-4">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <GlowingTitle emoji={gameEmoji} color={labColor}>{level.name}</GlowingTitle>
            <div className="flex items-center gap-2">
              <LevelBadge level={level.id} color={labColor} />
              {attempts > 0 && <span className="text-xs" style={{ color: '#8C94AC' }}>Attempt {attempts}</span>}
            </div>
          </div>

          {bestScore > 0 && <ScoreDisplay score={bestScore} maxScore={100} label="Best Score" />}

          {/* Parameters */}
          <SFCard variant="elevated" className="p-4 space-y-4">
            <h3 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>Adjust Parameters</h3>
            {params.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold" style={{ color: '#5A6078' }}>
                    {p.emoji} {p.label}
                  </span>
                  <span className="font-bold" style={{ color: labColor }}>
                    {p.value}{p.unit || ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={p.value}
                  onChange={(e) => handleParamChange(p.id, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${labColor} 0%, ${labColor} ${((p.value - p.min) / (p.max - p.min)) * 100}%, #EEF0F8 ${((p.value - p.min) / (p.max - p.min)) * 100}%, #EEF0F8 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: '#8C94AC' }}>
                  <span>{p.min}{p.unit}</span>
                  <span>{p.max}{p.unit}</span>
                </div>
              </div>
            ))}
          </SFCard>

          <SFButton variant="primary" size="lg" className="w-full" onClick={handleRun}>
            <Play className="w-5 h-5 mr-2" /> Run Simulation
          </SFButton>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <SFCard variant="elevated" className="p-4">
                  <ScoreDisplay score={result.score} maxScore={result.maxScore} />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.values(result.outputs).map((o, i) => (
                      <div key={i} className="rounded-xl p-2 text-center" style={{ background: `${labColor}08` }}>
                        <span className="text-lg">{o.emoji}</span>
                        <p className="text-xs font-bold" style={{ color: '#1A1D2B' }}>{o.label}</p>
                        <p className="text-sm font-extrabold" style={{ color: labColor }}>
                          {Math.round(o.value * 100) / 100}
                        </p>
                        <p className="text-[10px]" style={{ color: '#8C94AC' }}>Target: {o.target}</p>
                      </div>
                    ))}
                  </div>
                </SFCard>
                <FeedbackPopup type={result.score >= level.starThresholds[0] ? 'correct' : 'info'} message={result.feedback} explanation={result.explanation} />
                {attempts < 3 && result.score < level.starThresholds[2] && (
                  <SFButton variant="outline" className="w-full" onClick={handleRetry}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                  </SFButton>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
