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

  const parts = [
    joinCamera(exif.make, exif.model),
    exif.focal_length,
    exif.aperture,
    exif.shutter_speed,
    exif.iso !== null ? `ISO ${exif.iso}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <p className="font-mono text-xs tracking-wide text-muted">
      {parts.join("  ·  ")}
    </p>
  );
}
