import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { fadeUpIn } from "@/lib/motionVariants";
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
}: CompositionDashboardProps) {
  return (
    <motion.div {...fadeUpIn(0.15)}>
      <Section title="Composition analysis" description={SECTION_DESCRIPTION}>
        {loading ? (
          <p className="text-sm text-neutral-500">Analyzing composition…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : !composition || !imageUrl ? (
          <p className="text-sm text-neutral-500">
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
    { key: "subject", label: "Subject", dot: "bg-amber-400", available: true },
    { key: "lines", label: "Leading lines", dot: "bg-cyan-400", available: linesAvailable },
    { key: "horizon", label: "Horizon", dot: "bg-emerald-400", available: horizonAvailable },
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
                  ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                  : active
                    ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                    : "border-neutral-700 text-neutral-400 hover:bg-neutral-900"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${def.dot} ${
                  !def.available || !active ? "opacity-30" : ""
                }`}
              />
              {def.label}
              {!def.available && (
                <span className="text-[10px] text-neutral-600">(none)</span>
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
