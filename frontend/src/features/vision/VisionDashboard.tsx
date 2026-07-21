import { motion } from "framer-motion";
import { DominantColorPalette } from "@/components/DominantColorPalette";
import { LuminanceChart } from "@/components/LuminanceChart";
import { MetricCard, MetricCardSkeleton } from "@/components/MetricCard";
import { RGBHistogram } from "@/components/RGBHistogram";
import { Section } from "@/components/Section";
import {
  sectionReveal,
  STAGGER_VIEWPORT,
  staggerContainer,
  staggerItem,
} from "@/lib/motionVariants";
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
    <motion.div {...sectionReveal(0)}>
      <Section number="01" title="VISION ANALYSIS" description={SECTION_DESCRIPTION}>
        {loading ? (
          <MetricGridSkeleton />
        ) : error ? (
          <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
            {error}
          </div>
        ) : !vision ? (
          <p className="text-sm text-muted">
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
        whileInView="show"
        viewport={STAGGER_VIEWPORT}
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
          <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Dominant colors
          </h3>
          <DominantColorPalette colors={vision.dominant_colors} />
        </div>
        <div>
          <RGBHistogram histogram={vision.histogram} />
          <LuminanceChart histogram={vision.histogram} />
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
