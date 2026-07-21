import type { Transition, Variants } from "framer-motion";

export const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30 };

/** Fade-up entrance for report sections, staggered via `delay`. */
export function fadeUpIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { ...SPRING, delay },
  };
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: SPRING },
};
