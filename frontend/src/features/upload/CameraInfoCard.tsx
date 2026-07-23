import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motionVariants";
import type { ExifInfo } from "@/types/analysis";

function joinCamera(make: string | null, model: string | null): string | null {
  const value = [make, model].filter(Boolean).join(" ").trim();
  return value || null;
}

export function CameraInfoCard({ exif }: { exif: ExifInfo }) {
  if (!exif.has_exif) {
    return (
      <p className="font-mono text-xs text-muted">
        No camera metadata found — settings will be estimated during analysis.
      </p>
    );
  }

  const camera = joinCamera(exif.make, exif.model);
  const stats = [
    { label: "Focal Length", value: exif.focal_length ?? "—" },
    { label: "Aperture", value: exif.aperture ?? "—" },
    { label: "Shutter", value: exif.shutter_speed ?? "—" },
    { label: "ISO", value: exif.iso !== null ? String(exif.iso) : "—" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {camera && (
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{camera}</p>
      )}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-6"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem}>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-muted">
              {stat.label}
            </span>
            <span className="mt-1 block font-mono text-2xl font-medium tabular-nums text-heading">
              {stat.value}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
