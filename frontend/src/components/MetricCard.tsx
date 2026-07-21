import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ShimmerOverlay } from "./Shimmer";
import { Tooltip } from "./Tooltip";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Short qualitative interpretation shown under the value. */
  hint?: string;
  /** Longer explanation surfaced via an info tooltip. */
  description?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  hint,
  description,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, borderColor: "#999994" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-[2px] border border-border bg-surface p-4"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {label}
        </span>
        {description && (
          <Tooltip content={description}>
            <span
              tabIndex={0}
              aria-label={`About ${label}`}
              className="cursor-help text-muted transition-colors hover:text-ink focus:text-ink focus:outline-none"
            >
              &#9432;
            </span>
          </Tooltip>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-4xl font-medium tabular-nums text-heading">
          {value}
        </span>
        {unit && <span className="font-mono text-sm text-muted">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </motion.div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[2px] border border-border bg-surface p-4">
      <ShimmerOverlay />
      <div className="h-3 w-16 bg-border" />
      <div className="mt-3 h-7 w-20 bg-border" />
      <div className="mt-2 h-3 w-24 bg-border/70" />
    </div>
  );
}
