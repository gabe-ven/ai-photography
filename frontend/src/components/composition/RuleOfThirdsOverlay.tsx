import { motion } from "framer-motion";
import type { RuleOfThirds } from "@/types/analysis";

interface RuleOfThirdsOverlayProps {
  width: number;
  height: number;
  ruleOfThirds: RuleOfThirds;
}

/** Rule-of-thirds grid + the four power points (nearest one highlighted). */
export function RuleOfThirdsOverlay({
  width,
  height,
  ruleOfThirds,
}: RuleOfThirdsOverlayProps) {
  const stroke = Math.max(width, height) / 400;
  const radius = Math.max(width, height) / 90;
  const xs = [width / 3, (2 * width) / 3];
  const ys = [height / 3, (2 * height) / 3];
  const powerPoints = xs.flatMap((x) => ys.map((y) => ({ x, y })));
  const nearest = ruleOfThirds.nearest_power_point;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {xs.map((x) => (
        <line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={height} stroke="white" strokeOpacity={0.55} strokeWidth={stroke} />
      ))}
      {ys.map((y) => (
        <line key={`hy-${y}`} x1={0} y1={y} x2={width} y2={y} stroke="white" strokeOpacity={0.55} strokeWidth={stroke} />
      ))}
      {powerPoints.map((p, i) => {
        const isNearest =
          Math.abs(p.x / width - nearest.x) < 0.02 &&
          Math.abs(p.y / height - nearest.y) < 0.02;
        return (
          <circle
            key={`pp-${i}`}
            cx={p.x}
            cy={p.y}
            r={isNearest ? radius * 1.4 : radius}
            fill={isNearest ? "#34d399" : "white"}
            fillOpacity={isNearest ? 0.95 : 0.7}
            stroke="black"
            strokeOpacity={0.25}
            strokeWidth={stroke}
          />
        );
      })}
    </motion.g>
  );
}
