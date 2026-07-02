import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { CompositionInfo } from "@/types/analysis";

type Status = "good" | "warn" | "info" | "neutral";

const STATUS_STYLES: Record<Status, string> = {
  good: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  info: "border-sky-500/30 bg-sky-500/[0.06] text-sky-300",
  neutral: "border-neutral-700 bg-neutral-900/40 text-neutral-400",
};

interface MetricDef {
  key: string;
  label: string;
  icon: ReactNode;
  value: string;
  explanation: string;
  status: Status;
}

function formatRegion(region: string): string {
  return region
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildMetrics(c: CompositionInfo): MetricDef[] {
  const rot = c.rule_of_thirds;
  const ll = c.leading_lines;
  const sym = c.symmetry;
  const ns = c.negative_space;
  const sp = c.subject_position;
  const ed = c.edge_density;
  const hz = c.horizon;
  const symStrength = Math.max(sym.vertical, sym.horizontal);

  return [
    {
      key: "thirds",
      label: "Rule of Thirds",
      icon: <GridIcon />,
      value: `${Math.round(rot.score * 100)}%`,
      explanation: rot.follows_rule
        ? "Subject aligns with a power point."
        : "Subject sits away from the thirds intersections.",
      status: rot.follows_rule ? "good" : "warn",
    },
    {
      key: "lines",
      label: "Leading Lines",
      icon: <LinesIcon />,
      value: String(ll.line_count),
      explanation: ll.has_leading_lines
        ? `Dominant angle ~${ll.dominant_angle}°.`
        : "No strong leading lines detected.",
      status: ll.has_leading_lines ? "good" : "neutral",
    },
    {
      key: "symmetry",
      label: "Symmetry",
      icon: <SymmetryIcon />,
      value: `${Math.round(symStrength * 100)}%`,
      explanation: `Strongest along the ${sym.dominant_axis} axis.`,
      status: sym.is_symmetric ? "good" : "neutral",
    },
    {
      key: "negative-space",
      label: "Negative Space",
      icon: <SpaceIcon />,
      // subject_excluded_ratio measures empty space *around* the subject —
      // the photographic definition. The raw ratio (shown in the explanation)
      // also counts the subject's own flat areas.
      value: `${Math.round(ns.subject_excluded_ratio * 100)}%`,
      explanation: `${
        ns.has_significant_negative_space
          ? "Plenty of breathing room"
          : "Densely filled frame"
      } (${Math.round(ns.negative_space_ratio * 100)}% incl. subject).`,
      status: ns.has_significant_negative_space ? "good" : "neutral",
    },
    {
      key: "subject",
      label: "Subject Position",
      icon: <TargetIcon />,
      value: formatRegion(sp.region),
      explanation: `Offset ${sp.offset_from_center} from center.`,
      status: "info",
    },
    {
      key: "edges",
      label: "Edge Density",
      icon: <EdgeIcon />,
      value: `${(ed.edge_density * 100).toFixed(1)}%`,
      explanation: `${formatRegion(ed.busyness)} detail.`,
      status: ed.busyness === "busy" ? "warn" : ed.busyness === "minimal" ? "info" : "good",
    },
    {
      key: "horizon",
      label: "Horizon",
      icon: <HorizonIcon />,
      value: hz.horizon_detected
        ? hz.is_level
          ? "Level"
          : `Tilted ${hz.tilt_angle}°`
        : "None",
      explanation: hz.horizon_detected
        ? `Detected at ${Math.round((hz.horizon_y ?? 0) * 100)}% height.`
        : "No clear horizon line.",
      status: hz.horizon_detected ? (hz.is_level ? "good" : "warn") : "neutral",
    },
  ];
}

export function CompositionMetrics({ composition }: { composition: CompositionInfo }) {
  const metrics = buildMetrics(composition);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="text-neutral-500">{m.icon}</span>
              <span className="text-xs font-medium uppercase tracking-wide">
                {m.label}
              </span>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLES[m.status]}`}
            >
              {m.status === "good"
                ? "Strong"
                : m.status === "warn"
                  ? "Review"
                  : m.status === "info"
                    ? "Info"
                    : "Low"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-neutral-100">
            {m.value}
          </div>
          <p className="mt-1 text-xs leading-snug text-neutral-500">{m.explanation}</p>
        </motion.div>
      ))}
    </div>
  );
}

// --- inline icons (stroke = currentColor) ---------------------------------

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const GridIcon = () => (
  <svg {...iconProps}>
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);
const LinesIcon = () => (
  <svg {...iconProps}>
    <path d="M3 21 21 3M3 12l9-9M12 21l9-9" />
  </svg>
);
const SymmetryIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v18M7 8l-3 4 3 4M17 8l3 4-3 4" />
  </svg>
);
const SpaceIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="16" cy="16" r="2.5" />
  </svg>
);
const TargetIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
const EdgeIcon = () => (
  <svg {...iconProps}>
    <path d="M4 18 9 6l4 8 3-4 4 8z" />
  </svg>
);
const HorizonIcon = () => (
  <svg {...iconProps}>
    <path d="M3 14h18" />
    <path d="M7 14a5 5 0 0 1 10 0" />
  </svg>
);
