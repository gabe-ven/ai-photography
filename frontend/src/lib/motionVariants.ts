import type { Transition, Variants } from "framer-motion";

export const CARD_SPRING: Transition = { type: "spring", stiffness: 200, damping: 26 };
export const HERO_SPRING: Transition = { type: "spring", stiffness: 60, damping: 20 };
export const SUBTITLE_SPRING: Transition = { type: "spring", stiffness: 80, damping: 22 };
export const HR_SPRING: Transition = { type: "spring", stiffness: 80, damping: 22 };
export const SECTION_LINE_SPRING: Transition = { type: "spring", stiffness: 60, damping: 20 };
export const SECTION_LABEL_SPRING: Transition = { type: "spring", stiffness: 100, damping: 22 };

/**
 * Section entrance/exit tied to the section mounting (not scroll position) —
 * for report sections that appear together as a group and should cascade in
 * with a stagger, then animate out together if the whole report unmounts.
 */
export function sectionMount(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { type: "spring" as const, stiffness: 80, damping: 20, delay },
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
