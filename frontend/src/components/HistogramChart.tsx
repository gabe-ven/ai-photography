import type { Histogram } from "@/types/analysis";

interface HistogramChartProps {
  histogram: Histogram;
}

const CHANNELS: { key: "r" | "g" | "b"; color: string }[] = [
  { key: "r", color: "rgb(248 113 113)" },
  { key: "g", color: "rgb(74 222 128)" },
  { key: "b", color: "rgb(96 165 250)" },
];

/** Build a closed SVG area path for a channel, normalized to `max`. */
function areaPath(counts: number[], max: number): string {
  const n = counts.length;
  if (n < 2 || max <= 0) return "";
  const points = counts
    .map((c, i) => `${((i / (n - 1)) * 100).toFixed(2)},${(100 - (c / max) * 100).toFixed(2)}`)
    .join(" L");
  return `M0,100 L${points} L100,100 Z`;
}

export function HistogramChart({ histogram }: HistogramChartProps) {
  const max = Math.max(1, ...histogram.r, ...histogram.g, ...histogram.b);

  return (
    <div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-40 w-full rounded-lg bg-bg ring-1 ring-border"
        aria-label="RGB histogram"
      >
        {CHANNELS.map(({ key, color }) => (
          <path
            key={key}
            d={areaPath(histogram[key], max)}
            fill={color}
            fillOpacity={0.55}
            style={{ mixBlendMode: "multiply" }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>Shadows</span>
        <span>Midtones</span>
        <span>Highlights</span>
      </div>
    </div>
  );
}
