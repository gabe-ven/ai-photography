import { motion } from "framer-motion";
import { CompositionDashboard } from "@/components/composition/CompositionDashboard";
import { AICritiqueDashboard } from "@/features/ai/AICritiqueDashboard";
import { VisionDashboard } from "@/features/vision/VisionDashboard";
import { CameraInfoCard } from "./CameraInfoCard";
import { Dropzone } from "./Dropzone";
import { useImageAnalysis } from "./useImageAnalysis";

export function UploadPanel() {
  const {
    file,
    previewUrl,
    status,
    error,
    result,
    aiStatus,
    aiError,
    ai,
    selectFile,
    analyze,
    reset,
  } = useImageAnalysis();

  if (!file || !previewUrl) {
    return (
      <div className="space-y-4">
        <Dropzone onFile={selectFile} />
        {error && <ErrorBanner message={error} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
        >
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-[420px] w-full object-contain"
          />
          <p className="truncate px-4 py-2 text-sm text-neutral-400">{file.name}</p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {result && <CameraInfoCard exif={result.exif} />}

          <div className="flex gap-3">
            <motion.button
              onClick={analyze}
              disabled={status === "loading"}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.6, repeat: 2, repeatDelay: 0.4, ease: "easeInOut" }}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-neutral-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Analyzing…" : "Analyze photo"}
            </motion.button>
            <button
              onClick={reset}
              className="rounded-xl border border-neutral-700 px-4 py-2.5 font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Choose another
            </button>
          </div>
        </div>
      </div>

      {/* Analysis report — sections stack vertically. Future panels
          (Composition, Lighting, AI Critique) drop in here as siblings. */}
      {status !== "idle" && (
        <div className="space-y-6">
          <VisionDashboard
            vision={result?.vision ?? null}
            loading={status === "loading"}
            error={status === "error" ? error : null}
          />
        <CompositionDashboard
          composition={result?.composition ?? null}
          semantic={ai?.semantic_composition ?? null}
          imageUrl={previewUrl}
          loading={status === "loading"}
          error={status === "error" ? error : null}
        />
          {status === "success" && (
            <AICritiqueDashboard
              ai={ai}
              loading={aiStatus === "loading"}
              error={aiStatus === "error" ? aiError : null}
            />
          )}
        </div>
      )}
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
