import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/Section";
import { ZERO_ADJUSTMENTS } from "./adjustments";
import { ControlSlider } from "./ControlSlider";
import { EditCanvas, type EditCanvasHandle } from "./EditCanvas";
import type { ColorGradeResponse, GradingAdjustments } from "@/types/analysis";

interface SliderConfig {
  key: keyof GradingAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

const TONE_SLIDERS: SliderConfig[] = [
  { key: "exposure", label: "Exposure", min: -2, max: 2, step: 0.1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1 },
  { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1 },
  { key: "whites", label: "Whites", min: -100, max: 100, step: 1 },
  { key: "blacks", label: "Blacks", min: -100, max: 100, step: 1 },
];

const COLOR_SLIDERS: SliderConfig[] = [
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1 },
  { key: "tint", label: "Tint", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1 },
];

const DETAIL_SLIDERS: SliderConfig[] = [
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1 },
];

interface EditPageProps {
  file: File;
  previewUrl: string;
  colorGrade: ColorGradeResponse | null;
  colorGradeStatus: "idle" | "loading" | "success" | "error";
  colorGradeError: string | null;
  onBack: () => void;
}

export function EditPage({
  file,
  previewUrl,
  colorGrade,
  colorGradeStatus,
  colorGradeError,
  onBack,
}: EditPageProps) {
  const aiAdjustments = colorGrade?.available ? colorGrade.adjustments : ZERO_ADJUSTMENTS;
  const [adjustments, setAdjustments] = useState<GradingAdjustments>(aiAdjustments);
  const initializedRef = useRef(colorGrade?.available ?? false);
  const canvasRef = useRef<EditCanvasHandle>(null);
  const [exporting, setExporting] = useState(false);

  // Fill sliders from the AI suggestion the first time it arrives; never
  // overwrites adjustments the user has already made.
  useEffect(() => {
    if (!initializedRef.current && colorGrade?.available) {
      setAdjustments(colorGrade.adjustments);
      initializedRef.current = true;
    }
  }, [colorGrade]);

  const setField = (key: keyof GradingAdjustments, value: number) =>
    setAdjustments((prev) => ({ ...prev, [key]: value }));

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await canvasRef.current?.exportJPEG();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = editedFileName(file.name);
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const renderSliderGroup = (sliders: SliderConfig[]) =>
    sliders.map((s) => (
      <ControlSlider
        key={s.key}
        label={s.label}
        value={adjustments[s.key]}
        aiValue={aiAdjustments[s.key]}
        min={s.min}
        max={s.max}
        step={s.step}
        onChange={(v) => setField(s.key, v)}
      />
    ));

  return (
    <div className="space-y-8 py-16">
      <button
        onClick={onBack}
        className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-heading hover:text-heading"
      >
        ← Back
      </button>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <div className="inline-block max-w-full overflow-hidden border border-border bg-surface">
            <EditCanvas ref={canvasRef} imageUrl={previewUrl} adjustments={adjustments} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="bg-heading px-10 py-4 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Download"}
            </button>
            {colorGrade?.available && colorGrade.style && (
              <span className="rounded-sm bg-heading px-2.5 py-1 font-mono text-xs text-white">
                {colorGrade.style}
              </span>
            )}
          </div>
        </div>

        <div>
          <Section number="01" title="TONE">
            {renderSliderGroup(TONE_SLIDERS)}
          </Section>
          <Section number="02" title="COLOR">
            {renderSliderGroup(COLOR_SLIDERS)}
          </Section>
          <Section number="03" title="DETAIL">
            {renderSliderGroup(DETAIL_SLIDERS)}
          </Section>

          <div className="mt-8 space-y-4 border-t border-border pt-6">
            {colorGradeStatus === "loading" ? (
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                Generating suggestions…
              </p>
            ) : colorGradeStatus === "error" ? (
              <p className="font-mono text-sm text-red-700">
                {colorGradeError ?? "Color grading failed."}
              </p>
            ) : colorGrade && !colorGrade.available ? (
              <p className="text-sm text-muted">
                {colorGrade.reason ?? "AI suggestions are unavailable."}
              </p>
            ) : colorGrade?.reasoning ? (
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
                  AI suggestion
                </p>
                <p className="text-sm text-muted">{colorGrade.reasoning}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setAdjustments(aiAdjustments)}
                className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-heading hover:text-heading"
              >
                Reset to AI values
              </button>
              <button
                onClick={() => setAdjustments(ZERO_ADJUSTMENTS)}
                className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-heading hover:text-heading"
              >
                Reset to original
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function editedFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${base}-edited.jpg`;
}
