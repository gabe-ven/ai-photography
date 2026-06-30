import { motion } from "framer-motion";
import type { Horizon } from "@/types/analysis";

interface HorizonOverlayProps {
  width: number;
  height: number;
  horizon: Horizon;
}

/** Detected horizon line, drawn with its estimated tilt. */
export function HorizonOverlay({ width, height, horizon }: HorizonOverlayProps) {
  if (!horizon.horizon_detected || horizon.horizon_y === null) return null;

  const y = horizon.horizon_y * height;
  const tilt = horizon.tilt_angle ?? 0;
  const dy = Math.tan((tilt * Math.PI) / 180) * (width / 2);
  const stroke = Math.max(width, height) / 260;
  const color = horizon.is_level ? "#34d399" : "#fbbf24";

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.line
        x1={0}
        y1={y - dy}
        x2={width}
        y2={y + dy}
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${stroke * 4} ${stroke * 3}`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </motion.g>
  );
}
