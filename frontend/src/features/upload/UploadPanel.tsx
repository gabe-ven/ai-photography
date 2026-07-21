import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CompositionDashboard } from "@/components/composition/CompositionDashboard";
import { AICritiqueDashboard } from "@/features/ai/AICritiqueDashboard";
import { FujifilmRecipeSection } from "@/features/ai/FujifilmRecipeSection";
import { VisionDashboard } from "@/features/vision/VisionDashboard";
import { HERO_SPRING, SUBTITLE_SPRING } from "@/lib/motionVariants";
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

  // No photo yet — hero + dropzone.
  if (!file || !previewUrl) {
    return (
      <div className="pb-24 pt-20 md:pt-32">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          AI Photography Critique / V2.0
        </p>
        <h1 className="mt-6 leading-[0.95]">
          <motion.span
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={HERO_SPRING}
            className="block font-serif text-7xl italic tracking-tight text-heading md:text-9xl"
          >
            Photographer
          </motion.span>
          <motion.span
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...HERO_SPRING, delay: 0.1 }}
            className="block font-sans text-7xl font-black tracking-tighter text-heading md:text-9xl"
          >
            Brain.
          </motion.span>
        </h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SUBTITLE_SPRING, delay: 0.25 }}
          className="mt-6 max-w-md text-lg font-light text-muted"
        >
          Upload a photograph. Get an AI-powered critique grounded in real
          measurements.
        </motion.p>
        <div className="mt-12">
          <Dropzone onFile={selectFile} />
        </div>
        {error && <ErrorBanner message={error} />}
      </div>
    );
  }

  // Analysis in flight (CV metrics and/or the AI critique) — show the full
  // analyzing animation until everything is ready, then reveal the report.
  if (status === "loading" || aiStatus === "loading") {
    return <AnalyzingView previewUrl={previewUrl} fileName={file.name} />;
  }

  // Photo selected but not analyzed yet — big preview, actions underneath.
  if (status === "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto flex max-w-2xl flex-col gap-6 py-16"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
          className="overflow-hidden border border-border bg-surface"
        >
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-[520px] w-full object-contain"
          />
          <p className="truncate px-4 py-3 font-mono text-xs text-muted">{file.name}</p>
        </motion.div>
        <div className="flex justify-center gap-3">
          <motion.button
            onClick={analyze}
            initial="rest"
            whileHover="hover"
            className="bg-heading px-10 py-4 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
          >
            Analyze{" "}
            <motion.span
              className="inline-block"
              variants={{ rest: { x: 0 }, hover: { x: 6 } }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              →
            </motion.span>
          </motion.button>
          <button
            onClick={reset}
            className="border border-border px-10 py-4 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-heading hover:text-heading"
          >
            Choose another
          </button>
        </div>
      </motion.div>
    );
  }

  // Analysis done (success or error) — the full report.
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-16 py-16"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <div className="inline-block max-w-full overflow-hidden border border-border bg-surface">
          <img
            src={previewUrl}
            alt={file.name}
            className="block max-h-[520px] w-auto max-w-full"
          />
        </div>
        <div className="mt-3 flex w-full max-w-xl items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {result && <CameraInfoCard exif={result.exif} />}
          </div>
          <button
            onClick={reset}
            className="shrink-0 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-heading"
          >
            Choose another →
          </button>
        </div>
      </div>

      <div className="space-y-16">
        <VisionDashboard
          vision={result?.vision ?? null}
          loading={false}
          error={status === "error" ? error : null}
        />
        <CompositionDashboard
          composition={result?.composition ?? null}
          semantic={ai?.semantic_composition ?? null}
          imageUrl={previewUrl}
          loading={false}
          error={status === "error" ? error : null}
        />
        {status === "success" && (
          <>
            <AICritiqueDashboard
              ai={ai}
              loading={false}
              error={aiStatus === "error" ? aiError : null}
            />
            {ai?.fujifilm_recipe?.applicable === true && (
              <FujifilmRecipeSection recipe={ai.fujifilm_recipe} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

const LOADING_MESSAGES = [
  "Reading EXIF metadata…",
  "Measuring exposure & contrast…",
  "Extracting dominant colors…",
  "Locating the subject…",
  "Tracing leading lines…",
  "Reading the composition…",
  "Composing the critique…",
];

function AnalyzingView({
  previewUrl,
  fileName,
}: {
  previewUrl: string;
  fileName: string;
}) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setMessageIndex((n) => (n + 1) % LOADING_MESSAGES.length),
      1700,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-16"
    >
      <div className="relative w-full overflow-hidden border border-border bg-surface">
        <img
          src={previewUrl}
          alt={fileName}
          className="max-h-[480px] w-full object-contain"
        />

        {/* Sweeping glow band + bright scan edge. */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-black/10 to-transparent"
          initial={{ top: "-25%" }}
          animate={{ top: ["-25%", "105%"] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-0.5 bg-heading shadow-[0_0_14px_2px_rgba(10,10,8,0.35)]"
          initial={{ top: "-25%" }}
          animate={{ top: ["-25%", "105%"] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />

        <CornerBrackets />
      </div>

      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <div className="h-5">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-sm tracking-wide text-muted"
            >
              {LOADING_MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Spinner() {
  return (
    <motion.div
      className="h-9 w-9 rounded-full border-2 border-border border-t-heading"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    />
  );
}

function CornerBrackets() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-heading/70" />
      <span className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-heading/70" />
      <span className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-heading/70" />
      <span className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-heading/70" />
    </motion.div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 font-mono text-sm text-red-700">
      {message}
    </div>
  );
}
