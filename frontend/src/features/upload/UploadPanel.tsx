import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { CompositionDashboard } from "@/components/composition/CompositionDashboard";
import { ShimmerOverlay } from "@/components/Shimmer";
import { AICritiqueDashboard } from "@/features/ai/AICritiqueDashboard";
import { FujifilmRecipeSection } from "@/features/ai/FujifilmRecipeSection";
import { EditPage } from "@/features/edit/EditPage";
import { VisionDashboard } from "@/features/vision/VisionDashboard";
import { CARD_SPRING, HERO_SPRING } from "@/lib/motionVariants";
import { CameraInfoCard } from "./CameraInfoCard";
import { Dropzone } from "./Dropzone";
import { useImageAnalysis } from "./useImageAnalysis";

type Stage = "hero" | "analyzing" | "preview" | "editing" | "results";

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
    colorGrade,
    colorGradeStatus,
    colorGradeError,
    fetchColorGrade,
    selectFile,
    analyze,
    reset,
  } = useImageAnalysis();
  const [view, setView] = useState<"results" | "editing">("results");

  useEffect(() => {
    setView("results");
  }, [file]);

  const stage: Stage = !file
    ? "hero"
    : status === "loading" || aiStatus === "loading"
      ? "analyzing"
      : status === "idle"
        ? "preview"
        : view === "editing"
          ? "editing"
          : "results";

  return (
    <AnimatePresence mode="popLayout">
      {stage === "hero" && (
        <motion.div
          key="hero"
          exit={{ opacity: 0 }}
          className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center py-16"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Photographer Brain
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
              className="block font-sans text-7xl font-black tracking-tighter text-accent md:text-9xl"
            >
              Brain.
            </motion.span>
          </h1>
          <div className="mt-12">
            <Dropzone onFile={selectFile} />
          </div>
          {error && <ErrorBanner message={error} />}
        </motion.div>
      )}

      {/* Analysis in flight (CV metrics and/or the AI critique) — show the
          full analyzing animation until everything is ready, then reveal
          the report. */}
      {stage === "analyzing" && file && (
        <AnalyzingView key="analyzing" previewUrl={previewUrl} fileName={file.name} />
      )}

      {/* Photo selected but not analyzed yet — big preview, actions underneath.
          The <motion.img> below shares layoutId="photo-preview" with the one
          in the results branch, so Framer Motion animates the photo directly
          from this large hero position into its smaller results position
          when the AI critique finishes. */}
      {stage === "preview" && file && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-16"
        >
          <div className="inline-block max-w-full overflow-hidden">
            {previewUrl ? (
              <motion.img
                layoutId="photo-preview"
                transition={CARD_SPRING}
                src={previewUrl}
                alt={file.name}
                className="block max-h-[520px] w-auto max-w-full"
              />
            ) : (
              <PhotoSkeleton />
            )}
            <p className="truncate px-4 py-3 font-mono text-xs text-muted">{file.name}</p>
          </div>
          <div className="flex justify-center gap-3">
            <AnalyzeButton onClick={analyze} />
            <button
              onClick={reset}
              className="border border-border px-10 py-4 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-border-strong hover:text-[#999999]"
            >
              Choose another
            </button>
          </div>
        </motion.div>
      )}

      {/* Editing state — sliders + live canvas preview over the results data. */}
      {stage === "editing" && file && (
        <EditPage
          key="editing"
          file={file}
          colorGrade={colorGrade}
          colorGradeStatus={colorGradeStatus}
          colorGradeError={colorGradeError}
          onBack={() => setView("results")}
        />
      )}

      {/* Analysis done (success or error) — the full report. */}
      {stage === "results" && file && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-16 py-16"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col items-start gap-3">
              <div className="inline-block max-w-full overflow-hidden">
                {previewUrl ? (
                  <motion.img
                    layoutId="photo-preview"
                    transition={CARD_SPRING}
                    src={previewUrl}
                    alt={file.name}
                    className="block max-h-[520px] w-auto max-w-full"
                  />
                ) : (
                  <PhotoSkeleton />
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={reset}
                  className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-border-strong hover:text-[#999999]"
                >
                  Choose another →
                </button>
                {status === "success" && (
                  <button
                    onClick={() => {
                      setView("editing");
                      fetchColorGrade();
                    }}
                    className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-border-strong hover:text-[#999999]"
                  >
                    Edit photo →
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-6">
              {result && <CameraInfoCard exif={result.exif} />}
            </div>
          </div>

          <div className="space-y-16">
            <VisionDashboard
              vision={result?.vision ?? null}
              loading={false}
              error={status === "error" ? error : null}
              delay={0}
            />
            <CompositionDashboard
              composition={result?.composition ?? null}
              semantic={ai?.semantic_composition ?? null}
              imageUrl={previewUrl}
              loading={false}
              error={status === "error" ? error : null}
              delay={0.2}
            />
            {status === "success" && (
              <>
                <AICritiqueDashboard
                  ai={ai}
                  loading={false}
                  error={aiStatus === "error" ? aiError : null}
                  delay={0.4}
                />
                {ai?.fujifilm_recipe?.applicable === true && (
                  <FujifilmRecipeSection recipe={ai.fujifilm_recipe} />
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  previewUrl: string | null;
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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-16"
    >
      <div className="relative inline-block max-w-full overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={fileName}
            className="block max-h-[480px] w-auto max-w-full"
          />
        ) : (
          <PhotoSkeleton className="h-[480px] w-[360px]" />
        )}

        {/* Sweeping glow band + bright scan edge. */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-white/10 to-transparent"
          initial={{ top: "-25%" }}
          animate={{ top: ["-25%", "105%"] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-0.5 bg-accent shadow-[0_0_14px_2px_rgba(255,226,52,0.35)]"
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

const ARROW_SPRING = { type: "spring" as const, stiffness: 500, damping: 30 };

function AnalyzeButton({ onClick }: { onClick: () => void }) {
  const arrowX = useMotionValue(0);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => animate(arrowX, 6, ARROW_SPRING)}
      onHoverEnd={() => animate(arrowX, 0, ARROW_SPRING)}
      className="bg-accent px-10 py-4 font-mono text-xs uppercase tracking-widest text-bg transition-colors hover:bg-[#fff7a0]"
    >
      Analyze{" "}
      <motion.span className="inline-block" style={{ x: arrowX }}>
        →
      </motion.span>
    </motion.button>
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

/** Sized placeholder shown for the brief window before the preview
 * thumbnail finishes decoding. */
function PhotoSkeleton({ className = "h-[360px] w-[300px]" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-bg ${className}`}>
      <ShimmerOverlay />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-sm text-red-300">
      {message}
    </div>
  );
}
