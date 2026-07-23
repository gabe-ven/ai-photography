import { useMemo } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import type { Histogram } from "@/types/analysis";

const VIEW_W = 400;
const VIEW_H = 180;

export function LuminanceChart({ histogram }: { histogram: Histogram }) {
  const { path, meanX } = useMemo(() => {
    const n = histogram.bins;
    // Rec. 601 weights applied to the marginal R/G/B histograms — an
    // approximation of a true per-pixel luminance histogram, which would
    // require the raw pixel array rather than these three independent
    // 256-bin distributions.
    const luminance = Array.from(
      { length: n },
      (_, i) => 0.299 * histogram.r[i] + 0.587 * histogram.g[i] + 0.114 * histogram.b[i],
    );

    const x = d3.scaleLinear().domain([0, n - 1]).range([0, VIEW_W]);
    const maxVal = Math.max(1, d3.max(luminance) ?? 0);
    const y = d3.scaleLinear().domain([0, maxVal]).range([VIEW_H, 0]);
    const area = d3
      .area<number>()
      .x((_d, i) => x(i))
      .y0(VIEW_H)
      .y1((d) => y(d))
      .curve(d3.curveBasis);

    const totalWeight = d3.sum(luminance);
    const weightedIndex =
      totalWeight > 0
        ? d3.sum(luminance.map((v, i) => v * i)) / totalWeight
        : (n - 1) / 2;

    return { path: area(luminance) ?? "", meanX: x(weightedIndex) };
  }, [histogram]);

  return (
    <div className="border-t border-border pt-4">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Luminance
      </span>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="mt-2 h-[180px] w-full"
        aria-label="Luminance distribution"
      >
        <motion.path
          d={path}
          fill="rgba(10,10,8,0.06)"
          stroke="#0a0a08"
          strokeWidth={1}
          initial={{ pathLength: 0, fillOpacity: 0 }}
          animate={{ pathLength: 1, fillOpacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <line
          x1={meanX}
          x2={meanX}
          y1={0}
          y2={VIEW_H}
          stroke="#999994"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={meanX + 4} y={10} className="fill-muted font-mono text-[9px] uppercase">
          Mean
        </text>
      </svg>
    </div>
  );
}
