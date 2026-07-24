import { AnimatePresence } from "framer-motion";
import type { CompositionInfo } from "@/types/analysis";
import type { OverlayToggles } from "./CompositionOverlay";
import { EdgeOverlay } from "./EdgeOverlay";
import { HorizonOverlay } from "./HorizonOverlay";
import { LeadingLinesOverlay } from "./LeadingLinesOverlay";
import { RuleOfThirdsOverlay } from "./RuleOfThirdsOverlay";
import { SubjectMarker } from "./SubjectMarker";

interface Dimensions {
  width: number;
  height: number;
}

interface CompositionOverlayLayersProps {
  imageUrl: string;
  composition: CompositionInfo;
  toggles: OverlayToggles;
  dims: Dimensions | null;
  /** When true, overlays fade in on a per-type stagger (the "drawn-on after
   * the photo" intro). When false, they appear instantly — the right feel for
   * live user toggles and the composition panel. */
  staggerReveal?: boolean;
}

/** Per-type reveal delays (s) for the first "drawn-on" intro. */
const REVEAL_DELAY = {
  thirds: 0.6,
  edges: 0.65,
  horizon: 0.7,
  subject: 0.8,
  lines: 0.9,
} as const;

/**
 * The toggleable annotation layers (edge canvas + SVG overlay group), split
 * out of CompositionOverlay so any photo host — its own plain <img>, or a
 * shared-layout motion.img elsewhere — can composite the same layers on top
 * once it knows the rendered image's natural dimensions.
 */
export function CompositionOverlayLayers({
  imageUrl,
  composition,
  toggles,
  dims,
  staggerReveal = false,
}: CompositionOverlayLayersProps) {
  const d = (key: keyof typeof REVEAL_DELAY) => (staggerReveal ? REVEAL_DELAY[key] : 0);

  return (
    <>
      <AnimatePresence>
        {toggles.edges && <EdgeOverlay key="edges" imageUrl={imageUrl} delay={d("edges")} />}
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
                delay={d("thirds")}
              />
            )}
            {toggles.lines && composition.leading_lines.lines.length > 0 && (
              <LeadingLinesOverlay
                key="lines"
                width={dims.width}
                height={dims.height}
                lines={composition.leading_lines.lines}
                delay={d("lines")}
              />
            )}
            {toggles.horizon && composition.horizon.horizon_detected && (
              <HorizonOverlay
                key="horizon"
                width={dims.width}
                height={dims.height}
                horizon={composition.horizon}
                delay={d("horizon")}
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
                delay={d("subject")}
              />
            )}
          </AnimatePresence>
        </svg>
      )}
    </>
  );
}
