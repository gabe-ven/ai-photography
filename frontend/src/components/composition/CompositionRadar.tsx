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
          <PolarGrid stroke="#e8e8e4" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#999994", fontSize: 11, fontFamily: "DM Mono, monospace" }}
          />
          <Radar
            name="Composition"
            dataKey="value"
            stroke="#0a0a08"
            strokeWidth={2}
            fill="#0a0a08"
            fillOpacity={0.04}
            isAnimationActive
            animationDuration={900}
          />
          <Tooltip
            cursor={{ stroke: "#e8e8e4" }}
            contentStyle={LIGHT_TOOLTIP}
            labelStyle={{ color: "#0a0a08" }}
            itemStyle={{ color: "#0a0a08" }}
            formatter={(value) => [`${Number(value)}/100`, "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const LIGHT_TOOLTIP = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 2,
  color: "#1c1c1a",
  fontSize: 12,
  fontFamily: "DM Mono, monospace",
} as const;
