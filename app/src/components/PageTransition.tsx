import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  viewKey: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: -20,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.3,
};

export function PageTransition({ children, viewKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-full flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
