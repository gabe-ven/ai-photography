import { motion } from "framer-motion";
import { HR_SPRING } from "@/lib/motionVariants";
import type { ColorSwatch } from "@/types/analysis";

export function DominantColors({ colors }: { colors: ColorSwatch[] }) {
  if (colors.length === 0) {
    return <p className="text-sm text-muted">No colors detected.</p>;
  }

  return (
    <div className="border-t border-border pt-4">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Dominant colors
      </span>
      <div className="mt-2 flex h-[52px] w-full overflow-hidden rounded-[2px]">
        {colors.map((color, i) => (
          <motion.div
            key={`${color.hex}-${i}`}
            title={`${color.hex} · ${Math.round(color.proportion * 100)}%`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ ...HR_SPRING, delay: i * 0.05 }}
            style={{
              width: `${color.proportion * 100}%`,
              backgroundColor: color.hex,
              transformOrigin: "left",
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-6">
        {colors.map((color, i) => (
          <div
            key={`${color.hex}-legend-${i}`}
            className="inline-flex items-center gap-2 font-mono text-xs text-muted"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-[2px]"
              style={{ backgroundColor: color.hex }}
            />
            <span className="uppercase text-ink">{color.hex}</span>
            <span>{Math.round(color.proportion * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
