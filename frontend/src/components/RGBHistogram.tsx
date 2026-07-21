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
const VIEW_H = 140;

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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Histogram
        </span>
        <div className="flex items-center gap-3">
          {channels.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase"
              style={{ color: visible[c] ? CHANNEL_STYLES[c].stroke : "#999994" }}
            >
              <input
                type="checkbox"
                checked={visible[c]}
                onChange={() => setVisible((v) => ({ ...v, [c]: !v[c] }))}
                className="h-3 w-3"
              />
              {c}
            </label>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-[140px] w-full"
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
    </div>
  );
}
