import { Dropzone } from "./Dropzone";
import { ImageInfoCard } from "./ImageInfoCard";
import { useImageAnalysis } from "./useImageAnalysis";

export function UploadPanel() {
  const { file, previewUrl, status, error, result, selectFile, analyze, reset } =
    useImageAnalysis();

  if (!file || !previewUrl) {
    return (
      <div className="space-y-4">
        <Dropzone onFile={selectFile} />
        {error && <ErrorBanner message={error} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-[420px] w-full object-contain"
          />
          <p className="truncate px-4 py-2 text-sm text-neutral-400">{file.name}</p>
        </div>

        <div className="flex flex-col gap-4">
          {result ? (
            <ImageInfoCard info={result.image} />
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-800 p-5 text-sm text-neutral-500">
              Run the analysis to see results. More sections (EXIF, composition,
              lighting, AI critique) will appear here as we build them.
            </div>
          )}

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-3">
            <button
              onClick={analyze}
              disabled={status === "loading"}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-neutral-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Analyzing…" : "Analyze photo"}
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-neutral-700 px-4 py-2.5 font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Choose another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}
