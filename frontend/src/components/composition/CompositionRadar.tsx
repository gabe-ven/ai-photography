import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CompositionInfo, SemanticComposition } from "@/types/analysis";
import { applySemanticToProfile, buildCompositionProfile } from "./compositionProfile";

/**
 * The composition profile radar — the centerpiece of the section. Plots a
 * 0–100 score across seven axes, each derived from real CompositionInfo data
 * (see buildCompositionProfile for the per-axis formulas).
 */
export function CompositionRadar({
  composition,
  semantic,
}: {
  composition: CompositionInfo;
  semantic?: SemanticComposition | null;
}) {
  const data = applySemanticToProfile(buildCompositionProfile(composition), semantic);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={320}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
          />
          <Radar
            name="Composition"
            dataKey="value"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.35}
            isAnimationActive
            animationDuration={900}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.1)" }}
            contentStyle={DARK_TOOLTIP}
            labelStyle={{ color: "#e5e7eb" }}
            itemStyle={{ color: "#7dd3fc" }}
            formatter={(value) => [`${Number(value)}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DARK_TOOLTIP = {
  background: "rgba(10,10,10,0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#e5e7eb",
  fontSize: 12,
} as const;
