import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { SECTION_LABEL_SPRING, SECTION_LINE_SPRING } from "@/lib/motionVariants";

interface SectionProps {
  /** Editorial section number, e.g. "01". */
  number: string;
  title: string;
  description?: string;
  /** Optional element rendered at the top-right (e.g. a status badge). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * A titled report section. Card-less by design — a thin hr plus a
 * number/title header on the page background. Only the content inside
 * (metric cards, InfoCards, etc.) is individually boxed.
 *
 * The hr and the number/title label are sequenced explicitly via useInView
 * (rather than each having its own whileInView) so the label visibly waits
 * for the line to finish drawing before it slides in.
 */
export function Section({ number, title, description, action, children }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref}>
      <motion.hr
        className="border-border"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={SECTION_LINE_SPRING}
        style={{ transformOrigin: "left" }}
      />
      <div className="mb-8 mt-6 flex items-center justify-between gap-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ ...SECTION_LABEL_SPRING, delay: 0.15 }}
        >
          <span className="font-mono text-xs text-accent">{number}</span>
          <span className="font-mono text-xs text-subtle">/</span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            {title}
          </span>
        </motion.div>
        {action}
      </div>
      {description && (
        <p className="-mt-6 mb-8 max-w-2xl text-sm text-muted">{description}</p>
      )}
      {children}
    </section>
  );
}
