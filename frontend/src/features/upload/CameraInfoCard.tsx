import { MetricCard } from "@/components/MetricCard";
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

  return (
    <div className="flex flex-col gap-5">
      {camera && <p className="font-serif text-2xl italic text-heading">{camera}</p>}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Focal Length" value={exif.focal_length ?? "—"} />
        <MetricCard label="Aperture" value={exif.aperture ?? "—"} />
        <MetricCard label="Shutter" value={exif.shutter_speed ?? "—"} />
        <MetricCard label="ISO" value={exif.iso !== null ? String(exif.iso) : "—"} />
      </div>
    </div>
  );
}
