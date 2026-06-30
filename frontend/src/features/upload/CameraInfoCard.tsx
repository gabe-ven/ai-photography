import type { ExifInfo } from "@/types/analysis";

function joinCamera(make: string | null, model: string | null): string | null {
  const value = [make, model].filter(Boolean).join(" ").trim();
  return value || null;
}

export function CameraInfoCard({ exif }: { exif: ExifInfo }) {
  if (!exif.has_exif) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
        No camera metadata was found. Camera settings will be estimated during
        analysis.
      </div>
    );
  }

  const gpsValue = exif.gps
    ? `${exif.gps.latitude}, ${exif.gps.longitude}`
    : null;

  const rows: [string, string | null][] = [
    ["Camera", joinCamera(exif.make, exif.model)],
    ["Lens", exif.lens],
    ["ISO", exif.iso !== null ? String(exif.iso) : null],
    ["Aperture", exif.aperture],
    ["Shutter speed", exif.shutter_speed],
    ["Focal length", exif.focal_length],
    ["Date taken", exif.date_taken],
    ["GPS", gpsValue],
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Camera information
      </h3>
      <dl className="divide-y divide-neutral-800/70">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="text-right font-medium text-neutral-100">
              {value ?? <span className="text-neutral-600">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
