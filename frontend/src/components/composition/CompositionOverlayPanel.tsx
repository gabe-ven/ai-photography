import { useEffect, useState } from "react";
import type { CompositionInfo, SemanticComposition } from "@/types/analysis";
import { CompositionMetrics } from "./CompositionMetrics";
import { CompositionOverlay, type OverlayToggles } from "./CompositionOverlay";
import { CompositionToggles } from "./CompositionToggles";
import { CompositionVisuals } from "./CompositionVisuals";

interface CompositionOverlayPanelProps {
  composition: CompositionInfo;
  semantic: SemanticComposition | null;
  imageUrl: string;
}

/** The full legacy composition dashboard — toggle pills, the annotated photo,
 * radar/summary/scores/edge/scatter charts, and the 7-metric grid — tucked
 * behind Section 3's "View composition overlay" disclosure instead of always
 * visible on the page. */
export function CompositionOverlayPanel({
  composition,
  semantic,
  imageUrl,
}: CompositionOverlayPanelProps) {
  const linesAvailable = composition.leading_lines.lines.length > 0;
  const horizonAvailable = composition.horizon.horizon_detected;

  const [toggles, setToggles] = useState<OverlayToggles>({
    thirds: true,
    subject: true,
    lines: linesAvailable,
    horizon: horizonAvailable,
    edges: false,
  });

  useEffect(() => {
    setToggles({
      thirds: true,
      subject: true,
      lines: linesAvailable,
      horizon: horizonAvailable,
      edges: false,
    });
  }, [composition, linesAvailable, horizonAvailable]);

  const toggle = (key: keyof OverlayToggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5 pt-6">
      <CompositionToggles
        toggles={toggles}
        onToggle={toggle}
        linesAvailable={linesAvailable}
        horizonAvailable={horizonAvailable}
      />

      <CompositionVisuals composition={composition} semantic={semantic} />

      <CompositionOverlay imageUrl={imageUrl} composition={composition} toggles={toggles} />

      <CompositionMetrics composition={composition} semantic={semantic} />
    </div>
  );
}
