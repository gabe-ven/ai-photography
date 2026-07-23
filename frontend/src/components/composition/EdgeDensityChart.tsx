import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompositionInfo } from "@/types/analysis";

/**
 * Per-region edge density (Recharts BarChart). Values are the real backend
 * edge_density.regions fractions rendered as percentages — no client-side
 * fabrication.
 */
export function EdgeDensityChart({
  composition,
}: {
  composition: CompositionInfo;
}) {
  const r = composition.edge_density.regions;
  const data = [
    { region: "Top", value: round1(r.top * 100) },
    { region: "Bottom", value: round1(r.bottom * 100) },
    { region: "Left", value: round1(r.left * 100) },
    { region: "Right", value: round1(r.right * 100) },
    { region: "Center", value: round1(r.center * 100) },
  ];

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#222222" vertical={false} />
          <XAxis
            dataKey="region"
            tick={{ fill: "#444444", fontSize: 11 }}
            axisLine={{ stroke: "#222222" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#444444", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={DARK_TOOLTIP}
            labelStyle={{ color: "#ffffff" }}
            itemStyle={{ color: "#ffe234" }}
            formatter={(value) => [`${Number(value)}%`, "Edge density"]}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={800}
          >
            {data.map((entry) => (
              <Cell key={entry.region} fill="#ffe234" fillOpacity={0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

const DARK_TOOLTIP = {
  background: "#111111",
  border: "1px solid #222222",
  borderRadius: 2,
  color: "#ffffff",
  fontSize: 12,
} as const;
