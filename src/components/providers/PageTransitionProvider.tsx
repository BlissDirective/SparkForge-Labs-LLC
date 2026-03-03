'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

// PageTransitionProvider — Route transition animations
// v2 [ENH]: Smooth fade/slide between routes
// Note: Dashboard layout handles inline transitions in v3;
//   this provider is available for explicit wrapping if needed.

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
