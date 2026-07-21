import type { Transition, Variants } from "framer-motion";

export const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30 };
export const CARD_SPRING: Transition = { type: "spring", stiffness: 200, damping: 26 };
export const HERO_SPRING: Transition = { type: "spring", stiffness: 60, damping: 20 };
export const SUBTITLE_SPRING: Transition = { type: "spring", stiffness: 80, damping: 22 };
export const HR_SPRING: Transition = { type: "spring", stiffness: 80, damping: 22 };

/** Section entrance: slides up once when scrolled into view. */
export function sectionReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { ...SPRING, delay },
  };
}

export const STAGGER_VIEWPORT = { once: true, amount: 0.2 };

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: CARD_SPRING },
};
