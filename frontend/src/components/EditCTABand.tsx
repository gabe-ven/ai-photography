import { animate, motion, useMotionValue } from "framer-motion";

interface EditCTABandProps {
  onClick: () => void;
}

const ARROW_SPRING = { type: "spring" as const, stiffness: 500, damping: 30 };

/** Full-bleed dark band closing out the report — the entry point into the
 * edit page. Breaks out of the page's max-w-5xl container using the
 * standard full-bleed technique (its parent is horizontally centered, so
 * `left-1/2` + `-translate-x-1/2` re-centers a 100vw box under it). */
export function EditCTABand({ onClick }: EditCTABandProps) {
  const arrowX = useMotionValue(0);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-bg-dark">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <motion.button
          onClick={onClick}
          onHoverStart={() => animate(arrowX, 10, ARROW_SPRING)}
          onHoverEnd={() => animate(arrowX, 0, ARROW_SPRING)}
          className="font-display text-4xl italic text-white"
        >
          Edit this photograph{" "}
          <motion.span className="inline-block" style={{ x: arrowX }}>
            →
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
