'use client';

import { motion } from 'framer-motion';
import { WORLDS } from '@/types';

interface LabConnectionMapProps {
  labsProgress: Array<{ percent: number }> | null;
}

export function LabConnectionMap({ labsProgress }: LabConnectionMapProps) {
  return (
    <div className="hidden lg:block mb-8" role="img" aria-label="Lab progression map">
      <div className="flex items-center justify-between relative px-4">
        {/* Connection line */}
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/10 -translate-y-1/2" />

        {WORLDS.map((lab, i) => {
          const percent = labsProgress?.[i]?.percent || 0;
          const isComplete = percent === 100;
          const hasStarted = percent > 0;

          return (
            <motion.div
              key={lab.id}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                  isComplete
                    ? 'bg-spark-green/20 border-spark-green'
                    : hasStarted
                      ? 'bg-white/10 border-white/30'
                      : 'bg-surface-deep border-white/10'
                }`}
                aria-label={`Lab ${lab.id}: ${lab.title} — ${isComplete ? 'Complete' : hasStarted ? `${percent}% complete` : 'Not started'}`}
              >
                {lab.icon}
              </div>
              <span className="font-body text-[9px] text-white/30 mt-1">{lab.id}</span>

              {/* Progress dot between nodes */}
              {i < WORLDS.length - 1 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{
                    left: '100%',
                    marginLeft: 8,
                    backgroundColor: hasStarted ? lab.color : 'rgba(255,255,255,0.05)',
                  }}
                  animate={hasStarted ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
