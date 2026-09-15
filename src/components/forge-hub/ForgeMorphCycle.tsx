'use client';

/**
 * /dev/forge-hub P2 morph-cycle control. Does not replace the Director
 * HUD, scrubber, calibrate overlay, or mode switcher.
 */

import { useCallback, useState } from 'react';
import {
  P2_MORPH_CYCLE,
  runP2MorphCycle,
  type P2MorphCycleMode,
} from '@/lib/forge-hub/morphCycle';

export type ForgeMorphCycleStatus = 'idle' | 'running' | 'done';

interface ForgeMorphCycleProps {
  reducedMotion: boolean;
  disabled?: boolean;
  onStatus?: (status: ForgeMorphCycleStatus, step: string) => void;
  onTrace?: (trace: string) => void;
}

export function ForgeMorphCycle({
  reducedMotion,
  disabled = false,
  onStatus,
  onTrace,
}: ForgeMorphCycleProps) {
  const [status, setStatus] = useState<ForgeMorphCycleStatus>('idle');
  const [step, setStep] = useState('idle');

  const report = useCallback(
    (next: ForgeMorphCycleStatus, nextStep: string) => {
      setStatus(next);
      setStep(nextStep);
      onStatus?.(next, nextStep);
    },
    [onStatus],
  );

  const run = useCallback(async () => {
    if (status === 'running' || disabled) return;
    const hops: P2MorphCycleMode[] = [];
    report('running', P2_MORPH_CYCLE[0]);
    onTrace?.('');
    await runP2MorphCycle({
      reducedMotion,
      onStep: (mode: P2MorphCycleMode) => {
        hops.push(mode);
        setStep(mode);
        onStatus?.('running', mode);
        onTrace?.(hops.join(','));
      },
    });
    report('done', 'welcome');
  }, [disabled, onStatus, onTrace, reducedMotion, report, status]);

  return (
    <div
      className="forge-hub-p2-cycle"
      data-testid="forge-hub-p2-cycle-hud"
      data-forge-morph-cycle={status}
      data-forge-morph-cycle-step={step}
    >
      <button
        type="button"
        data-testid="forge-hub-p2-cycle"
        className="forge-hub-ignite"
        disabled={disabled || status === 'running'}
        aria-label="Run P2 morph cycle"
        onClick={() => void run()}
      >
        P2 morph cycle
      </button>
      <p
        data-testid="forge-hub-p2-cycle-status"
        className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/80"
      >
        {status} · {step}
      </p>
    </div>
  );
}
