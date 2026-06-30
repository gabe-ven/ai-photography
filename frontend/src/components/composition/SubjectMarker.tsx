import { motion } from "framer-motion";
import type { Point } from "@/types/analysis";

interface SubjectMarkerProps {
  width: number;
  height: number;
  centroid: Point;
}

/** Crosshair marker at the estimated subject (saliency centroid). */
export function SubjectMarker({ width, height, centroid }: SubjectMarkerProps) {
  const cx = centroid.x * width;
  const cy = centroid.y * height;
  const r = Math.max(width, height) / 45;
  const stroke = Math.max(width, height) / 320;
  const tick = r * 1.8;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={stroke * 1.5} fill="#f59e0b" />
      <line x1={cx - tick} y1={cy} x2={cx - r} y2={cy} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx + r} y1={cy} x2={cx + tick} y2={cy} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx} y1={cy - tick} x2={cx} y2={cy - r} stroke="#f59e0b" strokeWidth={stroke} />
      <line x1={cx} y1={cy + r} x2={cx} y2={cy + tick} stroke="#f59e0b" strokeWidth={stroke} />
    </motion.g>
  );
}
