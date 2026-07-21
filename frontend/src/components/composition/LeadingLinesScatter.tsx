import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { CompositionInfo } from "@/types/analysis";

/**
 * Endpoints of detected leading lines (Recharts ScatterChart). Coordinates are
 * the real pixel endpoints from leading_lines.lines, normalized to 0–1 against
 * the bounding extents of the endpoints. The Y axis is reversed so the plot
 * reads like image space (origin top-left). Render only when lines exist.
 */
export function LeadingLinesScatter({
  composition,
}: {
  composition: CompositionInfo;
}) {
  const lines = composition.leading_lines.lines;

  const points = lines.flatMap((l) => [
    { x: l.x1, y: l.y1 },
    { x: l.x2, y: l.y2 },
  ]);

  const maxX = Math.max(1, ...points.map((p) => p.x));
  const maxY = Math.max(1, ...points.map((p) => p.y));
  const data = points.map((p) => ({
    x: round3(p.x / maxX),
    y: round3(p.y / maxY),
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <ScatterChart margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#e8e8e4" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 1]}
            tick={{ fill: "#999994", fontSize: 10 }}
            axisLine={{ stroke: "#e8e8e4" }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 1]}
            reversed
            tick={{ fill: "#999994", fontSize: 10 }}
            axisLine={{ stroke: "#e8e8e4" }}
            tickLine={false}
          />
          <ZAxis range={[50, 50]} />
          <Tooltip
            cursor={{ stroke: "#e8e8e4" }}
            contentStyle={LIGHT_TOOLTIP}
            labelStyle={{ color: "#1c1c1a" }}
            itemStyle={{ color: "#22d3ee" }}
            formatter={(value) => Number(value).toFixed(3)}
          />
          <Scatter
            data={data}
            fill="#22d3ee"
            isAnimationActive
            animationDuration={800}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

const LIGHT_TOOLTIP = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 2,
  color: "#1c1c1a",
  fontSize: 12,
} as const;
