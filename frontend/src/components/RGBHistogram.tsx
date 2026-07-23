import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import type { Histogram } from "@/types/analysis";

type Channel = "r" | "g" | "b";

const CHANNEL_STYLES: Record<Channel, { fill: string; stroke: string }> = {
  r: { fill: "rgba(239,68,68,0.20)", stroke: "rgb(239,68,68)" },
  g: { fill: "rgba(34,197,94,0.20)", stroke: "rgb(34,197,94)" },
  b: { fill: "rgba(59,130,246,0.20)", stroke: "rgb(59,130,246)" },
};

const VIEW_W = 400;
const VIEW_H = 180;

export function RGBHistogram({ histogram }: { histogram: Histogram }) {
  const [visible, setVisible] = useState<Record<Channel, boolean>>({
    r: true,
    g: true,
    b: true,
  });

  const paths = useMemo(() => {
    const n = histogram.bins;
    const x = d3.scaleLinear().domain([0, n - 1]).range([0, VIEW_W]);
    const maxCount = Math.max(
      1,
      d3.max(histogram.r) ?? 0,
      d3.max(histogram.g) ?? 0,
      d3.max(histogram.b) ?? 0,
    );
    const y = d3.scaleLinear().domain([0, maxCount]).range([VIEW_H, 0]);
    const area = d3
      .area<number>()
      .x((_d, i) => x(i))
      .y0(VIEW_H)
      .y1((d) => y(d))
      .curve(d3.curveBasis);
    return {
      r: area(histogram.r) ?? "",
      g: area(histogram.g) ?? "",
      b: area(histogram.b) ?? "",
      midX: x((n - 1) / 2),
    };
  }, [histogram]);

  const channels: Channel[] = ["r", "g", "b"];

  return (
    <div className="border-t border-border pt-4">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        Histogram
      </span>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="mt-2 h-[180px] w-full"
        aria-label="RGB histogram"
      >
        <line
          x1={paths.midX}
          x2={paths.midX}
          y1={0}
          y2={VIEW_H}
          stroke="#e8e8e4"
          strokeWidth={0.5}
          strokeDasharray="2 2"
        />
        {channels.map(
          (c, i) =>
            visible[c] && (
              <motion.path
                key={c}
                d={paths[c]}
                fill={CHANNEL_STYLES[c].fill}
                stroke={CHANNEL_STYLES[c].stroke}
                strokeWidth={1}
                initial={{ pathLength: 0, fillOpacity: 0 }}
                animate={{ pathLength: 1, fillOpacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
              />
            ),
        )}
      </svg>
      <div className="mt-3 flex items-center gap-2">
        {channels.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setVisible((v) => ({ ...v, [c]: !v[c] }))}
            aria-pressed={visible[c]}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors"
            style={{
              borderColor: CHANNEL_STYLES[c].stroke,
              backgroundColor: visible[c] ? CHANNEL_STYLES[c].fill : "transparent",
              color: visible[c] ? CHANNEL_STYLES[c].stroke : "#999994",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: CHANNEL_STYLES[c].stroke }}
            />
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
