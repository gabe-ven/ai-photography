import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import type { CompositionInfo, SemanticComposition } from "@/types/analysis";

/**
 * Three circular indicators (Recharts RadialBarChart) for Rule of Thirds,
 * Symmetry and Negative Space. Each value comes straight from real
 * CompositionInfo fields and animates from 0 to the measured percentage.
 */
export function CompositionScores({
  composition,
  semantic,
}: {
  composition: CompositionInfo;
  semantic?: SemanticComposition | null;
}) {
  const scores: ScoreDef[] = [
    {
      label: "Rule of Thirds",
      value:
        semantic?.rule_of_thirds?.score != null
          ? Math.round(semantic.rule_of_thirds.score)
          : Math.round(composition.rule_of_thirds.score * 100),
      color: "#38bdf8",
    },
    {
      label: "Symmetry",
      value: Math.round(
        Math.max(composition.symmetry.vertical, composition.symmetry.horizontal) *
          100,
      ),
      color: "#a78bfa",
    },
    {
      label: "Negative Space",
      // Subject-excluded ratio: empty space around the subject, matching
      // CompositionMetrics and the radar profile.
      value:
        semantic?.negative_space?.score != null
          ? Math.round(semantic.negative_space.score)
          : Math.round(composition.negative_space.subject_excluded_ratio * 100),
      color: "#34d399",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {scores.map((s) => (
        <RadialScore key={s.label} {...s} />
      ))}
    </div>
  );
}

interface ScoreDef {
  label: string;
  value: number;
  color: string;
}

function RadialScore({ label, value, color }: ScoreDef) {
  const data = [{ name: label, value, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <RadialBar
              dataKey="value"
              background={{ fill: "rgba(255,255,255,0.06)" }}
              cornerRadius={10}
              isAnimationActive
              animationDuration={900}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold tabular-nums text-heading">
            {value}%
          </span>
        </div>
      </div>
      <span className="mt-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
    </div>
  );
}
