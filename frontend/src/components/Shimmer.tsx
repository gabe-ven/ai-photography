import { motion } from "framer-motion";

/** Sweeping highlight for skeleton placeholders while data loads. */
export function ShimmerOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
    />
  );
}
