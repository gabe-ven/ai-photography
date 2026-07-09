import { useCallback, useState } from "react";
import { analyzeImage, generateAIAnalysis, validateFile } from "@/lib/api";
import type { AIAnalysis, AnalysisResponse } from "@/types/analysis";

type Status = "idle" | "loading" | "success" | "error";
type AiStatus = "idle" | "loading" | "success" | "error";

export interface ImageAnalysisState {
  file: File | null;
  previewUrl: string | null;
  status: Status;
  error: string | null;
  result: AnalysisResponse | null;
  aiStatus: AiStatus;
  aiError: string | null;
  ai: AIAnalysis | null;
  selectFile: (file: File) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

export function useImageAnalysis(): ImageAnalysisState {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [ai, setAi] = useState<AIAnalysis | null>(null);

  const selectFile = useCallback(
    (next: File) => {
      const validationError = validateFile(next);
      if (validationError) {
        setError(validationError);
        setStatus("error");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(next);
      setPreviewUrl(URL.createObjectURL(next));
      setResult(null);
      setError(null);
      setStatus("idle");
      setAi(null);
      setAiError(null);
      setAiStatus("idle");
    },
    [previewUrl],
  );

  const analyze = useCallback(async () => {
    if (!file) return;
    setStatus("loading");
    setError(null);
    setAi(null);
    setAiError(null);
    setAiStatus("idle");

    let cvResult: AnalysisResponse;
    try {
      cvResult = await analyzeImage(file);
      setResult(cvResult);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
      return;
    }

    // Kick off the slower AI critique once the CV metrics are in, grounding it
    // in the analysis we just received. A failure here never affects the CV
    // results already on screen.
    setAiStatus("loading");
    try {
      const aiResult = await generateAIAnalysis(file, cvResult);
      setAi(aiResult.ai);
      setAiStatus("success");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed.");
      setAiStatus("error");
    }
  }, [file]);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setAi(null);
    setAiError(null);
    setAiStatus("idle");
  }, [previewUrl]);

  return {
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
  };
}
