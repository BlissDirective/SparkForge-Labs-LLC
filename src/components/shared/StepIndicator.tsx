'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div
      className="flex items-center justify-center gap-2 mb-8"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
    >
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isCompleted
                  ? 'bg-spark-green text-white'
                  : isActive
                    ? 'bg-gradient-to-r from-spark-purple to-spark-blue text-white shadow-glow-purple'
                    : 'bg-white/10 text-white/40'
              }`}
              animate={isActive && !prefersReducedMotion ? { scale: [1, 1.1, 1] } : {}}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
              aria-label={labels ? `Step ${stepNum}: ${labels[i]}` : `Step ${stepNum}`}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
            </motion.div>

            {/* Connector line */}
            {stepNum < totalSteps && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors ${
                  isCompleted ? 'bg-spark-green' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
