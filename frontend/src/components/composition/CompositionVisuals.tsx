import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { CompositionInfo } from "@/types/analysis";
import { CompositionRadar } from "./CompositionRadar";
import { CompositionScores } from "./CompositionScores";
import { CompositionSummary } from "./CompositionSummary";
import { EdgeDensityChart } from "./EdgeDensityChart";
import { LeadingLinesScatter } from "./LeadingLinesScatter";

/**
 * Layout for the composition visualization dashboard. Holds no chart logic —
 * each chart is a self-contained component. The radar is the visual
 * centerpiece, with the radial scores, edge-density bars and summary alongside.
 */
export function CompositionVisuals({
  composition,
}: {
  composition: CompositionInfo;
}) {
  const hasLines = composition.leading_lines.lines.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ChartCard title="Composition profile" delay={0} className="lg:col-span-2 lg:row-span-2">
        <CompositionRadar composition={composition} />
      </ChartCard>

      <ChartCard title="Summary" delay={0.05}>
        <CompositionSummary composition={composition} />
      </ChartCard>

      <ChartCard title="Key scores" delay={0.1}>
        <CompositionScores composition={composition} />
      </ChartCard>

      <ChartCard title="Edge density by region" delay={0.15} className="lg:col-span-2">
        <EdgeDensityChart composition={composition} />
      </ChartCard>

      {hasLines && (
        <ChartCard title="Leading-line endpoints" delay={0.2}>
          <LeadingLinesScatter composition={composition} />
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({
  title,
  delay,
  className = "",
  children,
}: {
  title: string;
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur ${className}`}
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.div>
  );
}
