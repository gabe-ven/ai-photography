import type { ReactNode } from "react";
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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </span>
        {description && (
          <Tooltip content={description}>
            <span
              tabIndex={0}
              aria-label={`About ${label}`}
              className="cursor-help text-neutral-600 transition-colors hover:text-neutral-300 focus:text-neutral-300 focus:outline-none"
            >
              &#9432;
            </span>
          </Tooltip>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums text-neutral-100">
          {value}
        </span>
        {unit && <span className="text-sm text-neutral-500">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="h-3 w-16 animate-pulse rounded bg-neutral-800" />
      <div className="mt-3 h-7 w-20 animate-pulse rounded bg-neutral-800" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-800/70" />
    </div>
  );
}
