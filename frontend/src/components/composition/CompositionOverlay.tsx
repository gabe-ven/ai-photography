import { AnimatePresence } from "framer-motion";
import { memo, useCallback, useState } from "react";
import type { CompositionInfo } from "@/types/analysis";
import { EdgeOverlay } from "./EdgeOverlay";
import { HorizonOverlay } from "./HorizonOverlay";
import { LeadingLinesOverlay } from "./LeadingLinesOverlay";
import { RuleOfThirdsOverlay } from "./RuleOfThirdsOverlay";
import { SubjectMarker } from "./SubjectMarker";

export interface OverlayToggles {
  thirds: boolean;
  subject: boolean;
  lines: boolean;
  horizon: boolean;
  edges: boolean;
}

interface CompositionOverlayProps {
  imageUrl: string;
  composition: CompositionInfo;
  toggles: OverlayToggles;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Renders the photo with toggleable annotation layers on top. The photo is a
 * memoized layer keyed only on its URL, so toggling overlays never re-renders
 * or reloads the image.
 *
 * New overlays (Lighting, Focus heatmap, Highlight/Shadow clipping) slot in as
 * additional <AnimatePresence> children below — no structural changes needed.
 */
export function CompositionOverlay({
  imageUrl,
  composition,
  toggles,
}: CompositionOverlayProps) {
  const [dims, setDims] = useState<Dimensions | null>(null);

  const handleLoad = useCallback((width: number, height: number) => {
    setDims({ width, height });
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-bg">
      <PhotoLayer imageUrl={imageUrl} onLoad={handleLoad} />

      <AnimatePresence>
        {toggles.edges && <EdgeOverlay key="edges" imageUrl={imageUrl} />}
      </AnimatePresence>

      {dims && (
        <svg
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <AnimatePresence>
            {toggles.thirds && (
              <RuleOfThirdsOverlay
                key="thirds"
                width={dims.width}
                height={dims.height}
                ruleOfThirds={composition.rule_of_thirds}
              />
            )}
            {toggles.lines && composition.leading_lines.lines.length > 0 && (
              <LeadingLinesOverlay
                key="lines"
                width={dims.width}
                height={dims.height}
                lines={composition.leading_lines.lines}
              />
            )}
            {toggles.horizon && composition.horizon.horizon_detected && (
              <HorizonOverlay
                key="horizon"
                width={dims.width}
                height={dims.height}
                horizon={composition.horizon}
              />
            )}
            {toggles.subject && (
              <SubjectMarker
                key="subject"
                width={dims.width}
                height={dims.height}
                centroid={composition.subject_position.centroid}
                bbox={composition.subject_position.bbox}
                label={composition.subject_position.label}
              />
            )}
          </AnimatePresence>
        </svg>
      )}
    </div>
  );
}

const PhotoLayer = memo(function PhotoLayer({
  imageUrl,
  onLoad,
}: {
  imageUrl: string;
  onLoad: (width: number, height: number) => void;
}) {
  return (
    <img
      src={imageUrl}
      alt="Analyzed photograph"
      draggable={false}
      onLoad={(e) =>
        onLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
      }
      className="block max-h-[700px] w-full select-none object-contain"
    />
  );
});
