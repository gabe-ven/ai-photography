// Derives a 0-100 composition profile from real CompositionInfo fields.
// Every value here traces back to a measured backend metric — nothing is
// fabricated. Shared by CompositionRadar (the chart) and CompositionSummary
// (the textual takeaways) so both stay in lockstep.

import type { CompositionInfo, EdgeRegions } from "@/types/analysis";

export interface ProfileAxis {
  /** Human-readable axis label shown on the radar. */
  axis: string;
  /** Normalized score in [0, 100]. */
  value: number;
}

/** Evenness of edge distribution across regions, in [0, 1].
 * 1 - (stddev / mean), clamped — higher means edges are spread evenly. */
export function edgeBalance(regions: EdgeRegions): number {
  const values = [
    regions.top,
    regions.bottom,
    regions.left,
    regions.right,
    regions.center,
  ];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean <= 0) return 0; // guard divide-by-zero (no edges at all)
  const variance =
    values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);
  return clamp01(1 - stddev / mean);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Build the seven radar axes from real composition data. */
export function buildCompositionProfile(c: CompositionInfo): ProfileAxis[] {
  const rot = c.rule_of_thirds;
  const ll = c.leading_lines;
  const sym = c.symmetry;
  const ns = c.negative_space;
  const hz = c.horizon;

  // Rule of Thirds = rule_of_thirds.score * 100
  const ruleOfThirds = rot.score * 100;

  // Leading Lines = min(line_count / 8, 1) * 100 (8+ lines reads as "full").
  const leadingLines = Math.min(ll.line_count / 8, 1) * 100;

  // Symmetry = max(vertical, horizontal) * 100 (strongest axis).
  const symmetry = Math.max(sym.vertical, sym.horizontal) * 100;

  // Negative Space = negative_space_ratio * 100.
  const negativeSpace = ns.negative_space_ratio * 100;

  // Horizon Levelness: if detected, penalize tilt up to 10° linearly; else 0.
  const horizonLevelness = hz.horizon_detected
    ? Math.max(0, 1 - Math.min(Math.abs(hz.tilt_angle ?? 0) / 10, 1)) * 100
    : 0;

  // Subject Placement: alignment to a power point via rule_of_thirds.score.
  const subjectPlacement = rot.score * 100;

  // Edge Balance: evenness of edge_density.regions (real backend regions).
  const edgeBalanceValue = edgeBalance(c.edge_density.regions) * 100;

  return [
    { axis: "Rule of Thirds", value: round1(ruleOfThirds) },
    { axis: "Leading Lines", value: round1(leadingLines) },
    { axis: "Symmetry", value: round1(symmetry) },
    { axis: "Negative Space", value: round1(negativeSpace) },
    { axis: "Horizon", value: round1(horizonLevelness) },
    { axis: "Subject Placement", value: round1(subjectPlacement) },
    { axis: "Edge Balance", value: round1(edgeBalanceValue) },
  ];
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Mean of the seven radar axis values — an overall composition score. */
export function overallScore(profile: ProfileAxis[]): number {
  if (profile.length === 0) return 0;
  const sum = profile.reduce((a, p) => a + p.value, 0);
  return Math.round(sum / profile.length);
}
