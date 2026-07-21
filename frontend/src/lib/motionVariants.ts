import type { Transition, Variants } from "framer-motion";

export const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30 };
export const CARD_SPRING: Transition = { type: "spring", stiffness: 300, damping: 28 };

/** Section entrance: slides up once when scrolled into view. */
export function sectionReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { ...SPRING, delay },
  };
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: CARD_SPRING },
};
