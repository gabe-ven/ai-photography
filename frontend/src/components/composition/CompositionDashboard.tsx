import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { sectionMount } from "@/lib/motionVariants";
import type { CompositionInfo, SemanticComposition } from "@/types/analysis";
import { CompositionMetrics } from "./CompositionMetrics";
import { CompositionOverlay, type OverlayToggles } from "./CompositionOverlay";
import { CompositionVisuals } from "./CompositionVisuals";

interface CompositionDashboardProps {
  composition: CompositionInfo | null;
  semantic?: SemanticComposition | null;
  imageUrl: string | null;
  loading?: boolean;
  error?: string | null;
  /** Stagger offset (seconds) so this section can cascade in after siblings. */
  delay?: number;
}

interface ToggleDef {
  key: keyof OverlayToggles;
  label: string;
  dot: string;
  available: boolean;
}

const SECTION_DESCRIPTION =
  "Composition metrics from OpenCV, overlaid on your photo. Toggle each layer.";

export function CompositionDashboard({
  composition,
  semantic = null,
  imageUrl,
  loading = false,
  error = null,
  delay = 0,
}: CompositionDashboardProps) {
  return (
    <motion.div {...sectionMount(delay)}>
      <Section number="02" title="COMPOSITION" description={SECTION_DESCRIPTION}>
        {loading ? (
          <p className="text-sm text-muted">Analyzing composition…</p>
        ) : error ? (
          <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
            {error}
          </div>
        ) : !composition || !imageUrl ? (
          <p className="text-sm text-muted">
            Run the analysis to see the composition overlays and metrics.
          </p>
        ) : (
          <DashboardContent
            composition={composition}
            semantic={semantic}
            imageUrl={imageUrl}
          />
        )}
      </Section>
    </motion.div>
  );
}

function DashboardContent({
  composition,
  semantic,
  imageUrl,
}: {
  composition: CompositionInfo;
  semantic: SemanticComposition | null;
  imageUrl: string;
}) {
  const linesAvailable = composition.leading_lines.lines.length > 0;
  const horizonAvailable = composition.horizon.horizon_detected;

  const [toggles, setToggles] = useState<OverlayToggles>({
    thirds: true,
    subject: true,
    lines: linesAvailable,
    horizon: horizonAvailable,
    edges: false,
  });

  // Reset overlay defaults whenever a new analysis arrives.
  useEffect(() => {
    setToggles({
      thirds: true,
      subject: true,
      lines: linesAvailable,
      horizon: horizonAvailable,
      edges: false,
    });
  }, [composition, linesAvailable, horizonAvailable]);

  const toggleDefs: ToggleDef[] = [
    { key: "thirds", label: "Rule of thirds", dot: "bg-white", available: true },
    { key: "subject", label: "Subject", dot: "bg-accent", available: true },
    { key: "lines", label: "Leading lines", dot: "bg-accent", available: linesAvailable },
    { key: "horizon", label: "Horizon", dot: "bg-accent", available: horizonAvailable },
    { key: "edges", label: "Edges", dot: "bg-emerald-300", available: true },
  ];

  const toggle = (key: keyof OverlayToggles) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {toggleDefs.map((def) => {
          const active = toggles[def.key];
          return (
            <button
              key={def.key}
              type="button"
              disabled={!def.available}
              onClick={() => toggle(def.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                !def.available
                  ? "cursor-not-allowed border-border text-muted/50"
                  : active
                    ? "border-accent bg-accent text-bg"
                    : "border-border text-muted hover:border-border-strong"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${def.dot} ${
                  !def.available || !active ? "opacity-30" : ""
                }`}
              />
              {def.label}
              {!def.available && (
                <span className="text-[10px] text-muted/50">(none)</span>
              )}
            </button>
          );
        })}
      </div>

      <CompositionVisuals composition={composition} semantic={semantic} />

      <CompositionOverlay
        imageUrl={imageUrl}
        composition={composition}
        toggles={toggles}
      />

      <CompositionMetrics composition={composition} semantic={semantic} />
    </div>
  );
}
