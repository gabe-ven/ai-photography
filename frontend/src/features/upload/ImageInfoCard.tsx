import type { ImageInfo } from "@/types/analysis";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageInfoCard({ info }: { info: ImageInfo }) {
  const rows: [string, string][] = [
    ["Dimensions", `${info.width} × ${info.height} px`],
    ["Resolution", `${info.megapixels} MP`],
    ["Aspect ratio", `${info.aspect_ratio}:1`],
    ["Format", `${info.format} (${info.mode})`],
    ["File size", formatBytes(info.size_bytes)],
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Image details
      </h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="font-medium text-neutral-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
