import { motion } from "framer-motion";

/** Sweeping highlight for skeleton placeholders while data loads. */
export function ShimmerOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
    />
  );
}

/** Sized placeholder shown for the brief window before a photo thumbnail
 * finishes decoding. */
export function PhotoSkeleton({ className = "h-[360px] w-[300px]" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-border ${className}`}>
      <ShimmerOverlay />
    </div>
  );
}
