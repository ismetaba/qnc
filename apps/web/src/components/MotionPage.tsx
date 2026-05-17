import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Wraps page content with a 180ms cross-fade + 4px y-shift on mount. */
export function MotionPage({ children }: { children: ReactNode }): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ display: 'contents' }}
    >
      {children}
    </motion.div>
  );
}
