import type { CompositionInfo, SemanticComposition } from "@/types/analysis";
import {
  applySemanticToProfile,
  buildCompositionProfile,
  overallScore,
} from "./compositionProfile";

/**
 * Presentational summary card (no Recharts). Surfaces an overall composition
 * score plus a few short, data-driven takeaways. Every statement is derived
 * from real CompositionInfo fields via the shared composition profile.
 */
export function CompositionSummary({
  composition,
  semantic,
}: {
  composition: CompositionInfo;
  semantic?: SemanticComposition | null;
}) {
  const profile = applySemanticToProfile(
    buildCompositionProfile(composition),
    semantic,
  );
  const score = overallScore(profile);

  const applicable = profile.filter((p) => p.applicable);
  const sorted = [...applicable].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const hz = composition.horizon;
  const takeaways: string[] = [
    `Strongest: ${strongest.axis} (${Math.round(strongest.value)}/100).`,
    `Weakest: ${weakest.axis} (${Math.round(weakest.value)}/100).`,
    hz.horizon_detected
      ? hz.is_level
        ? "Horizon is level."
        : `Horizon tilts ${Math.abs(hz.tilt_angle ?? 0).toFixed(1)}°.`
      : "No clear horizon detected.",
    `Frame detail is ${composition.edge_density.busyness}.`,
  ];

  const band = scoreBand(score);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums text-neutral-100">
          {score}
        </span>
        <span className="text-sm text-neutral-500">/ 100</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase ${band.className}`}>
          {band.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Mean of applicable composition axes.
      </p>
      <ul className="mt-4 space-y-2">
        {takeaways.map((t) => (
          <li
            key={t}
            className="flex items-start gap-2 text-sm leading-snug text-neutral-300"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/70" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function scoreBand(score: number): { label: string; className: string } {
  if (score >= 70)
    return {
      label: "Strong",
      className: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
    };
  if (score >= 45)
    return {
      label: "Balanced",
      className: "border-sky-500/30 bg-sky-500/[0.06] text-sky-300",
    };
  return {
    label: "Review",
    className: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  };
}
