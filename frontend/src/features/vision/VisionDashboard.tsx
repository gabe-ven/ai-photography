import { motion } from "framer-motion";
import { DominantColorPalette } from "@/components/DominantColorPalette";
import { HistogramChart } from "@/components/HistogramChart";
import { MetricCard, MetricCardSkeleton } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fadeUpIn, staggerContainer, staggerItem } from "@/lib/motionVariants";
import type { VisionInfo } from "@/types/analysis";

interface VisionDashboardProps {
  vision: VisionInfo | null;
  loading?: boolean;
  error?: string | null;
}

const SECTION_DESCRIPTION =
  "Objective image-quality metrics computed with OpenCV — no AI involved.";

export function VisionDashboard({
  vision,
  loading = false,
  error = null,
}: VisionDashboardProps) {
  return (
    <motion.div {...fadeUpIn(0)}>
      <Section title="Vision analysis" description={SECTION_DESCRIPTION}>
        {loading ? (
          <MetricGridSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : !vision ? (
          <p className="text-sm text-neutral-500">
            Run the analysis to compute brightness, contrast, sharpness, color, and
            more.
          </p>
        ) : (
          <VisionContent vision={vision} />
        )}
      </Section>
    </motion.div>
  );
}

function VisionContent({ vision }: { vision: VisionInfo }) {
  return (
    <div className="space-y-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Brightness"
            value={Math.round(vision.brightness)}
            hint={brightnessHint(vision.brightness)}
            description="Average luminance across all pixels (0–255). Low means a dark image, high means bright."
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Contrast"
            value={Math.round(vision.contrast)}
            hint={contrastHint(vision.contrast)}
            description="Spread of tones (standard deviation of luminance). Higher means more separation between lights and darks."
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Sharpness"
            value={Math.round(vision.sharpness)}
            hint="Relative detail — very low can indicate blur"
            description="Variance of the Laplacian. Higher values indicate more fine detail; low values suggest softness or blur."
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Dynamic range"
            value={vision.dynamic_range.stops}
            unit="stops"
            hint={`Tonal span ${vision.dynamic_range.range} of 255`}
            description="Approximate tonal range between deep shadows and bright highlights, in stops (EV), from the 1st–99th luminance percentiles."
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Orientation"
            value={capitalize(vision.orientation)}
            hint={`${vision.dimensions.aspect_ratio}:1 aspect ratio`}
            description="Image shape derived from width vs. height (landscape, portrait, or square)."
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <MetricCard
            label="Dimensions"
            value={`${vision.dimensions.width} × ${vision.dimensions.height}`}
            unit="px"
            hint={`${vision.dimensions.aspect_ratio}:1`}
            description="Pixel dimensions of the image and its aspect ratio."
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Dominant colors
          </h3>
          <DominantColorPalette colors={vision.dominant_colors} />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            RGB histogram
          </h3>
          <HistogramChart histogram={vision.histogram} />
        </div>
      </div>
    </div>
  );
}

function MetricGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

function brightnessHint(value: number): string {
  const pct = (value / 255) * 100;
  if (pct < 33) return "Dark / low-key";
  if (pct > 66) return "Bright / high-key";
  return "Balanced exposure";
}

function contrastHint(value: number): string {
  if (value < 25) return "Flat / low contrast";
  if (value > 70) return "Punchy / high contrast";
  return "Moderate contrast";
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
